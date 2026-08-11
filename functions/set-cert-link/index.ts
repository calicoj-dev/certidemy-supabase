// POST /functions/v1/set-cert-link
//
// Body: { certification_id, exam_link, exam_link_i18n? }
//   exam_link       : string | null  - the default CertiGlobal product page
//   exam_link_i18n  : object | null  - optional per-locale overrides, keys
//                                      limited to en / es-419 / pt-BR
//
// Auth: Bearer JWT - MUST be a platform_admin.
//
// Certidemy sells nothing. Vouchers are purchased on certiglobal.org, so every
// "Buy exam voucher" CTA in the app has to hand the buyer to the right product
// page. This function is how a platform admin sets that URL per certification,
// instead of hardcoding links in the frontend.
//
// RESOLUTION ORDER (mirrored in lib/certifications/buy-link.ts):
//   exam_link_i18n[locale]  ->  exam_link  ->  https://certiglobal.org
// A missing locale key degrades to the default link, and a missing default
// degrades to the CertiGlobal home page. A buyer is never sent nowhere.
//
// HOST LOCK: both fields are validated here AND by check constraints in
// migration 199. A cert page that accepts any string is a way to point a paying
// buyer at a domain someone else owns; the DB constraint is the backstop that
// holds even if a future surface writes this column directly.
//
// Effects:
//   - certifications.exam_link / exam_link_i18n -> the requested values
//   - admin_actions row written: who changed it, from -> to
//
// Idempotent: setting a cert to its current links is a no-op success.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

interface Body {
  certification_id: string;
  exam_link?: string | null;
  exam_link_i18n?: Record<string, string> | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Must stay in step with public.is_valid_purchase_url (migration 199).
const URL_RE = /^https:\/\/([a-z0-9-]+\.)*certiglobal\.org(\/|$)/;

const VALID_LOCALES = ["en", "es-419", "pt-BR"] as const;

/** Empty string from a cleared input means "unset", not "invalid". */
function normalizeLink(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") throw new HttpError(400, "exam_link must be a string or null");
  const t = v.trim();
  if (t === "") return null;
  if (!URL_RE.test(t)) {
    throw new HttpError(400, "exam_link must be an https:// URL on certiglobal.org");
  }
  return t;
}

/** Drops empty values, so clearing one language field removes that key. */
function normalizeMap(v: unknown): Record<string, string> | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "object" || Array.isArray(v)) {
    throw new HttpError(400, "exam_link_i18n must be an object or null");
  }
  const out: Record<string, string> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (!(VALID_LOCALES as readonly string[]).includes(k)) {
      throw new HttpError(400, `unsupported locale key: ${k}`);
    }
    if (typeof raw !== "string") {
      throw new HttpError(400, `exam_link_i18n.${k} must be a string`);
    }
    const t = raw.trim();
    if (t === "") continue;
    if (!URL_RE.test(t)) {
      throw new HttpError(
        400,
        `exam_link_i18n.${k} must be an https:// URL on certiglobal.org`,
      );
    }
    out[k] = t;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Order-insensitive compare, so re-saving an unchanged map is a no-op. */
function sameMap(
  a: Record<string, string> | null,
  b: Record<string, string> | null,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (ka.length !== kb.length) return false;
  return ka.every((k, i) => k === kb[i] && a[k] === b[k]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    // Identify the caller.
    const actor_user_id = await authenticate(req);

    // Authorize: caller must be platform_admin (profiles is the source of truth).
    const svc = getServiceClient();
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();

    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json()) as Body;

    if (!body.certification_id || !UUID_RE.test(body.certification_id)) {
      throw new HttpError(400, "valid certification_id required");
    }

    const to_link = normalizeLink(body.exam_link);
    const to_i18n = normalizeMap(body.exam_link_i18n);

    // Load the cert (and its current links, for the audit from->to).
    const { data: cert, error: cErr } = await svc
      .from("certifications")
      .select("id, code, name, exam_link, exam_link_i18n")
      .eq("id", body.certification_id)
      .maybeSingle();

    if (cErr) throw new Error(`certification lookup: ${cErr.message}`);
    if (!cert) throw new HttpError(404, "certification not found");

    const from_link = (cert.exam_link ?? null) as string | null;
    const from_i18n = (cert.exam_link_i18n ?? null) as Record<string, string> | null;

    // Idempotent: no change -> success no-op (still 200, no audit noise).
    if (from_link === to_link && sameMap(from_i18n, to_i18n)) {
      return jsonResponse({
        ok: true,
        unchanged: true,
        certification_id: cert.id,
        exam_link: to_link,
        exam_link_i18n: to_i18n,
      });
    }

    // 1. Apply the change. The DB check constraints are the backstop here.
    const { error: uErr } = await svc
      .from("certifications")
      .update({ exam_link: to_link, exam_link_i18n: to_i18n })
      .eq("id", cert.id);

    if (uErr) throw new Error(`link update: ${uErr.message}`);

    // 2. Audit log - a purchase link is a commercial fact, so who changed it
    //    and when is worth being able to answer later.
    const { error: logErr } = await svc.from("admin_actions").insert({
      actor_user_id,
      action: "set_cert_link",
      target_type: "certification",
      target_id: cert.id,
      reason: null,
      metadata: {
        code: cert.code,
        name: cert.name,
        from: { exam_link: from_link, exam_link_i18n: from_i18n },
        to: { exam_link: to_link, exam_link_i18n: to_i18n },
      },
    });
    if (logErr) console.warn("admin_actions log failed", logErr);

    return jsonResponse({
      ok: true,
      certification_id: cert.id,
      exam_link: to_link,
      exam_link_i18n: to_i18n,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
