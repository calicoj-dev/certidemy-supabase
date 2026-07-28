// POST /functions/v1/render-asset
//
// Body: { asset_type: "factsheet", certification_code: string, language?: "en" | "es-419" | "pt-BR" }
// Auth: Bearer JWT - MUST be platform_admin or marketing.
//
// v2: the fact sheet now carries domains with exam weights, preparation
// figures, the credibility block, and sibling certifications. All of it read
// from rows; nothing authored here.
//
// GATED, NOT PUBLIC. verify_jwt stays ON - the caller must be staff. The public
// forwarding URLs in SALES-LIBRARY-SPEC §9 are a separate endpoint; that is
// where verify_jwt = false gets pinned in config.toml. Making THIS function
// public would let anyone enumerate assets and would bypass the download log.
//
// CACHING: object paths are content-versioned from source updated_at values. An
// edited weight or an approved translation changes the path, so the next
// request renders fresh and the old object is never requested again. No
// invalidation step to forget.
//
// NOTE ON SELECT STRINGS: single literals, never built with `+`. supabase-js
// parses the select as a template-literal type; a concatenated string degrades
// the response to GenericStringError and breaks the typed build in the web app.
// Same discipline here for consistency even though Deno does not enforce it.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import {
  renderFactSheet,
  FACTSHEET_RENDERER_VERSION,
  type AssetLocale,
  type FactSheetData,
  type FactSheetDomain,
  type FactSheetSibling,
} from "../_shared/factsheet.ts";

const BUCKET = "sales-assets";
const SIGNED_URL_TTL = 60 * 60;
const LOCALES: AssetLocale[] = ["en", "es-419", "pt-BR"];
const CLIENT_SAFE_STATUSES = ["available", "coming_soon"];

const SITE_BASE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.com";

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

    if (assetType !== "factsheet" && assetType !== "specimen_certificate") {
      return jsonResponse(
        { error: `asset_type '${assetType}' not implemented yet` },
        400,
      );
    }
    if (!code) return jsonResponse({ error: "certification_code required" }, 400);
    if (!LOCALES.includes(language)) {
      return jsonResponse({ error: `unsupported language '${language}'` }, 400);
    }

    // ---- identify + authorize ------------------------------------------

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

    // ---- certification --------------------------------------------------
    //
    // price_usd is deliberately NOT selected. No asset in this library renders
    // a price. Not fetching it is stronger than fetching and remembering not to
    // use it. Spec §3.4.

    const { data: certRow, error: certErr } = await svc
      .from("certifications")
      .select(
        "id, code, name, description, num_questions, passing_score_pct, exam_duration_minutes, max_exam_attempts, attempt_window_months, validity_days, status, category_slug, sort_order, exam_blueprint, updated_at"
      )
      .eq("code", code)
      .maybeSingle();

    if (certErr) {
      console.error("certification lookup failed", certErr);
      return jsonResponse({ error: "lookup failed" }, 500);
    }
    if (!certRow) return jsonResponse({ error: `no certification '${code}'` }, 404);

    if (!CLIENT_SAFE_STATUSES.includes(certRow.status)) {
      return jsonResponse(
        {
          error: "no client-safe asset for this certification",
          status: certRow.status,
          detail:
            "A draft certification has not cleared the publish checklist and must not be put in front of a buyer.",
        },
        409,
      );
    }

    // ---- specimen certificate --------------------------------------------
    //
    // Delegated, not duplicated. get-credential-certificate owns the
    // versioned locale-scoped path, the lazy render and the specimen marks.
    // Reimplementing that here would mean fixing certificate caching twice
    // forever.
    if (assetType === "specimen_certificate") {
      const { data: specRow } = await svc
        .from("credentials")
        .select("credential_code")
        .eq("certification_id", certRow.id)
        .eq("is_specimen", true)
        .maybeSingle();

      if (!specRow) {
        return jsonResponse(
          {
            error: "no specimen credential for this certification",
            detail:
              "Mint one with certidemy-web/scripts/mint-specimens.mjs.",
          },
          404,
        );
      }

      const base = Deno.env.get("SUPABASE_URL") ?? "";
      const certUrl =
        base +
        "/functions/v1/get-credential-certificate?code=" +
        encodeURIComponent(specRow.credential_code) +
        "&locale=" +
        language;

      const res = await fetch(certUrl);
      const payload = (await res.json().catch(() => ({}))) as {
        url?: string;
        cached?: boolean;
        error?: string;
      };

      if (!res.ok || !payload.url) {
        console.error("specimen certificate fetch failed", payload);
        return jsonResponse(
          { error: payload.error ?? "could not obtain specimen certificate" },
          502,
        );
      }

      // Logged here, not there: the audit question is which member of
      // staff obtained the file, and only this function knows that.
      const { error: specLogErr } = await svc.from("asset_downloads").insert({
        user_id: actor_user_id,
        asset_type: "specimen_certificate",
        tier: "client_safe",
        certification_id: certRow.id,
        language,
      });
      if (specLogErr) console.warn("asset_downloads insert failed", specLogErr);

      return jsonResponse({
        url: payload.url,
        filename: `${code}-specimen-certificate-${language}.pdf`,
        asset_type: "specimen_certificate",
        certification_code: code,
        language,
        cached: payload.cached === true,
      });
    }

    // ---- localized copy -------------------------------------------------
    //
    // Falls back to the base row. AIHR-I has a null i18n description by design
    // - the catalog reads `claim` only.

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
            "The claim is the load-bearing sentence on a fact sheet. Rendering without one would put unreviewed copy in a buyer's hands.",
        },
        409,
      );
    }

    // ---- domains + weights ----------------------------------------------
    //
    // The most interesting thing about a certification, and the section v1
    // omitted entirely. domains has no language column; titles come from
    // domain_translations, falling back to English.

    const { data: domainRows } = await svc
      .from("domains")
      .select("id, title, weight_pct, order_index")
      .eq("certification_id", certRow.id)
      .order("order_index", { ascending: true });

    const domainBase = (domainRows ?? []) as {
      id: string;
      title: string;
      weight_pct: number;
      order_index: number;
    }[];

    let domainTitles = new Map<string, string>();
    if (language !== "en" && domainBase.length > 0) {
      const { data: trRows } = await svc
        .from("domain_translations")
        .select("domain_id, title")
        .in("domain_id", domainBase.map((d) => d.id))
        .eq("language", language);

      domainTitles = new Map(
        ((trRows ?? []) as { domain_id: string; title: string }[]).map(
          (r) => [r.domain_id, r.title] as const,
        ),
      );
    }

    const domains: FactSheetDomain[] = domainBase.map((d) => ({
      title: domainTitles.get(d.id) ?? d.title,
      weightPct: Number(d.weight_pct),
    }));

    // ---- preparation figures --------------------------------------------
    //
    // "How long does this take my people" is the buyer's second question.
    // Lesson counts are per-language; fall back to English when a language has
    // not been fully loaded, so the figure is never zero on a real course.

    const { data: moduleRows } = await svc
      .from("modules")
      .select("id")
      .eq("certification_id", certRow.id);

    const moduleIds = ((moduleRows ?? []) as { id: string }[]).map((m) => m.id);

    let lessonCount = 0;
    let studyMinutes = 0;

    if (moduleIds.length > 0) {
      const countFor = async (lang: string) => {
        const { data } = await svc
          .from("lessons")
          .select("estimated_minutes")
          .in("module_id", moduleIds)
          .eq("language", lang);
        const rows = (data ?? []) as { estimated_minutes: number | null }[];
        return {
          count: rows.length,
          minutes: rows.reduce((n, r) => n + (r.estimated_minutes ?? 0), 0),
        };
      };

      let got = await countFor(language);
      if (got.count === 0 && language !== "en") got = await countFor("en");
      lessonCount = got.count;
      studyMinutes = got.minutes;
    }

    // ---- siblings --------------------------------------------------------
    //
    // Facts about our own catalog only. No labour-market claims anywhere on
    // this document.

    const { data: sibRows } = certRow.category_slug
      ? await svc
        .from("certifications")
        .select("code, name, sort_order, status")
        .eq("category_slug", certRow.category_slug)
        .neq("id", certRow.id)
        .in("status", CLIENT_SAFE_STATUSES)
        .order("sort_order", { ascending: true })
      : { data: null };

    const siblings: FactSheetSibling[] = (
      (sibRows ?? []) as { code: string; name: string }[]
    ).map((s) => ({ code: s.code, name: s.name }));

    // ---- assemble --------------------------------------------------------

    const blueprint = (certRow.exam_blueprint ?? {}) as Record<string, unknown>;

    const data: FactSheetData = {
      code: certRow.code,
      name: i18nRow?.name ?? certRow.name,
      claim,
      description: i18nRow?.description ?? certRow.description ?? "",
      status: certRow.status,
      domains,
      numQuestions: certRow.num_questions,
      passingScorePct: certRow.passing_score_pct,
      examDurationMinutes: certRow.exam_duration_minutes,
      maxExamAttempts: certRow.max_exam_attempts,
      attemptWindowMonths: certRow.attempt_window_months,
      validityDays: certRow.validity_days,
      moduleCount: moduleIds.length,
      lessonCount,
      studyMinutes,
      siblings,
      blueprintComputedAt: (blueprint.computed_at as string) ?? null,
      cognitiveModelVersion: (blueprint.version as string) ?? null,
    };

    // ---- cache -----------------------------------------------------------
    //
    // v2 in the path: v1 objects describe a different document and must not be
    // served for a v2 request.

    const stamps = [certRow.updated_at, i18nRow?.updated_at]
      .filter(Boolean)
      .sort()
      .join("");
    const version = contentVersion(stamps || certRow.updated_at);
    const path =
      `factsheet/v${FACTSHEET_RENDERER_VERSION}/${code}/${language}/${version}.pdf`;
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

    // ---- audit -----------------------------------------------------------
    //
    // Logged on every generation, cached or not. The question the log answers
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
      domains: domains.length,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: "asset generation failed" }, 500);
  }
});
