// POST /functions/v1/render-asset
//
// Body: { asset_type: "factsheet", certification_code: string, language?: "en" | "es-419" | "pt-BR" }
// Auth: Bearer JWT - MUST be platform_admin or marketing.
//
// The sales library's generation endpoint. First increment: fact sheet only.
// Blueprint sheet, samples sheet, scheme PDF, specimen certificate and the
// internal comparison sheet follow the same shape.
//
// GATED, NOT PUBLIC. verify_jwt stays ON for this function - the caller must be
// staff. The public forwarding URLs in SALES-LIBRARY-SPEC §9 are a separate
// endpoint; that is where verify_jwt = false gets pinned in config.toml.
// Do not confuse the two: making THIS function public would let anyone
// enumerate assets and would bypass the download log entirely.
//
// CACHING: object paths are content-versioned from the source row's updated_at.
// An edited weight or an approved translation changes the path, so the next
// request renders fresh and the old object is simply never requested again.
// There is no invalidation step to forget.
//
// STATUS GATE: a `draft` certification produces no client-safe asset. A cert
// only reaches coming_soon after verify-cert is green and the publish checklist
// is cleared, so status already means "safe to put in front of a buyer".

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import {
  renderFactSheet,
  type AssetLocale,
  type FactSheetData,
} from "../_shared/factsheet.ts";

const BUCKET = "sales-assets";
const SIGNED_URL_TTL = 60 * 60; // 1 hour
const LOCALES: AssetLocale[] = ["en", "es-419", "pt-BR"];
const CLIENT_SAFE_STATUSES = ["available", "coming_soon"];

const SITE_BASE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.com";

/** Filesystem-safe content version from a timestamp. */
function contentVersion(iso: string): string {
  return iso.replace(/[^0-9]/g, "").slice(0, 14);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      asset_type?: string;
      certification_code?: string;
      language?: string;
    };

    const assetType = body.asset_type ?? "factsheet";
    const code = body.certification_code?.trim().toUpperCase();
    const language = (body.language ?? "en") as AssetLocale;

    if (assetType !== "factsheet") {
      return jsonResponse(
        { error: `asset_type '${assetType}' not implemented yet` },
        400,
      );
    }
    if (!code) {
      return jsonResponse({ error: "certification_code required" }, 400);
    }
    if (!LOCALES.includes(language)) {
      return jsonResponse({ error: `unsupported language '${language}'` }, 400);
    }

    // ---- identify + authorize ------------------------------------------
    //
    // Marketing is a peer of platform_admin HERE and nowhere else. It exists so
    // a sales rep never needs a role that can flip certification status, issue
    // vouchers, or edit credential holder names.

    const actor_user_id = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();

    const role = actorProfile?.platform_role;
    if (role !== "platform_admin" && role !== "marketing") {
      throw new HttpError(403, "platform_admin or marketing required");
    }

    // ---- source rows ----------------------------------------------------
    //
    // price_usd is deliberately NOT selected. No asset in this library renders
    // a price - pricing is CertiGlobal's and varies by bundle. Spec §3.4.

    const { data: certRow, error: certErr } = await svc
      .from("certifications")
      .select(
        "id, code, name, description, num_questions, passing_score_pct, " +
          "exam_duration_minutes, max_exam_attempts, attempt_window_months, " +
          "validity_days, status, exam_blueprint, updated_at",
      )
      .eq("code", code)
      .maybeSingle();

    if (certErr) {
      console.error("certification lookup failed", certErr);
      return jsonResponse({ error: "lookup failed" }, 500);
    }
    if (!certRow) {
      return jsonResponse({ error: `no certification '${code}'` }, 404);
    }

    if (!CLIENT_SAFE_STATUSES.includes(certRow.status)) {
      return jsonResponse(
        {
          error: "no client-safe asset for this certification",
          status: certRow.status,
          detail:
            "A draft certification has not cleared the publish checklist and " +
            "must not be put in front of a buyer.",
        },
        409,
      );
    }

    // Localized copy. Falls back to the base certifications row - AIHR-I has a
    // null i18n description by design, since the catalog reads `claim` only.
    const { data: i18nRow } = await svc
      .from("certification_i18n")
      .select("name, claim, description, updated_at")
      .eq("certification_id", certRow.id)
      .eq("lang", language)
      .maybeSingle();

    const { data: enRow } = language === "en"
      ? { data: null }
      : await svc
        .from("certification_i18n")
        .select("claim")
        .eq("certification_id", certRow.id)
        .eq("lang", "en")
        .maybeSingle();

    const claim = i18nRow?.claim ?? enRow?.claim ?? "";
    if (!claim) {
      return jsonResponse(
        {
          error: "no approved claim for this certification",
          detail:
            "The claim is the load-bearing sentence on a fact sheet. Rendering " +
            "without one would put an unreviewed description in a buyer's hands.",
        },
        409,
      );
    }

    const blueprint = (certRow.exam_blueprint ?? {}) as Record<string, unknown>;

    const data: FactSheetData = {
      code: certRow.code,
      name: i18nRow?.name ?? certRow.name,
      claim,
      description: i18nRow?.description ?? certRow.description ?? "",
      num_questions: certRow.num_questions,
      passing_score_pct: certRow.passing_score_pct,
      exam_duration_minutes: certRow.exam_duration_minutes,
      max_exam_attempts: certRow.max_exam_attempts,
      attempt_window_months: certRow.attempt_window_months,
      validity_days: certRow.validity_days,
      status: certRow.status,
      blueprint_computed_at: (blueprint.computed_at as string) ?? null,
      cognitive_model_version: (blueprint.version as string) ?? null,
    };

    // ---- cache ----------------------------------------------------------

    const stamps = [certRow.updated_at, i18nRow?.updated_at]
      .filter(Boolean)
      .sort()
      .join("");
    const version = contentVersion(stamps || certRow.updated_at);
    const path = `factsheet/${code}/${language}/${version}.pdf`;
    const filename = `${code}-factsheet-${language}.pdf`;

    const { data: hit } = await svc.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL, { download: filename });

    let cached = false;
    let signedUrl = hit?.signedUrl ?? null;

    if (signedUrl) {
      cached = true;
    } else {
      const pdfBytes = await renderFactSheet(data, language, SITE_BASE);

      const { error: upErr } = await svc.storage
        .from(BUCKET)
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (upErr) {
        console.error("asset upload failed", upErr);
        return jsonResponse({ error: "could not store asset" }, 500);
      }

      const { data: fresh, error: signErr } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL, { download: filename });

      if (signErr || !fresh?.signedUrl) {
        console.error("could not sign fresh asset", signErr);
        return jsonResponse({ error: "could not sign asset" }, 500);
      }
      signedUrl = fresh.signedUrl;
    }

    // ---- audit ----------------------------------------------------------
    //
    // Logged on every generation, cached or not - the question the log answers
    // is "who obtained this file", and a cache hit is still an obtaining.
    // Best-effort: a logging failure must not deny the rep their document.

    const { error: logErr } = await svc.from("asset_downloads").insert({
      user_id: actor_user_id,
      asset_type: "factsheet",
      tier: "client_safe",
      certification_id: certRow.id,
      language,
    });
    if (logErr) console.warn("asset_downloads insert failed", logErr);

    return jsonResponse({
      url: signedUrl,
      filename,
      asset_type: "factsheet",
      certification_code: code,
      language,
      cached,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: "asset generation failed" }, 500);
  }
});
