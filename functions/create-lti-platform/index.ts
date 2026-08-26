// POST /functions/v1/create-lti-platform
//
// Body: { iss, client_id, name, auth_login_url, auth_token_url, jwks_url,
//         company_id?, skew_tolerance_seconds? }
// Auth: Bearer JWT -- MUST be platform_admin.
//
// Registers an LTI 1.3 platform. One row per (iss, client_id).
//
// ============================== WHY AN EDGE FUNCTION =====================
//
// `authenticated` holds SELECT on lti_platforms and nothing else, deliberately
// (253, 256). This is the only way a row is created, and it exists rather than
// an INSERT grant for two reasons.
//
// A REGISTRATION DECIDES WHO MAY INITIATE A LOGIN INTO US. That is the same
// class of act as creating a company or attesting an issuer, and it gets the
// same treatment: platform_admin, enforced in TypeScript, with an admin_actions
// row written from the same request. Opening INSERT on the table would make it
// a thing that happens with no actor recorded.
//
// And the validation below is policy, not schema. It will change more often
// than the columns do -- which is the same argument create-partner-issuer makes
// for keeping its reserved-slug list in the function rather than in a CHECK.
//
// ============================== SAME iss, DIFFERENT client_id ============
//
// IS NORMAL AND IS NOT WARNED ABOUT.
//
// All Instructure-hosted Canvas shares one issuer, https://canvas.instructure
// .com, regardless of institution -- plus canvas.beta.instructure.com and
// canvas.test.instructure.com. So one institution registering production and
// beta produces two rows with the same iss, and two Canvas customers produce
// two more.
//
// That is why the key is (iss, client_id) and why iss alone is not unique. An
// admin doing something entirely expected must not meet a warning that makes
// them stop and email us. The response carries `siblings` so the console can
// say plainly that this is the Nth registration for that issuer and that this
// is expected.
//
// ============================== VALIDATION ===============================
//
// Absolute https on iss and all three endpoints. Not pedantry: these are
// fetched server-to-server (jwks_url) or redirected to in a browser
// (auth_login_url), and a scheme-relative or http value fails later, at a
// moment that names OIDC rather than the typo.
//
// The (iss, client_id) pre-check exists for a USEFUL 409. The unique index
// lti_platforms_iss_client_unique is the real guard -- two admins submitting at
// once is exactly the race a check-then-insert loses -- so 23505 is caught
// below and mapped to the same answer.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  iss?: string;
  client_id?: string;
  name?: string;
  auth_login_url?: string;
  auth_token_url?: string;
  jwks_url?: string;
  company_id?: string | null;
  skew_tolerance_seconds?: number | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bounds on the clock tolerance.
 *
 * The LTI specification states no normative value and defers to OIDC; the
 * industry norm is 30-60 seconds. These bounds are not the norm, they are the
 * edges of defensible: below 5 seconds ordinary network jitter starts rejecting
 * valid launches, and above 300 the replay window is wide enough that the check
 * has stopped meaning much.
 */
const SKEW_MIN = 5;
const SKEW_MAX = 300;

/** Absolute https, no fragment, parseable. */
function httpsUrl(value: string | undefined, field: string): string {
  const v = value?.trim();
  if (!v) throw new HttpError(400, `${field} is required`);
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    throw new HttpError(400, `${field} must be an absolute URL`);
  }
  if (u.protocol !== "https:") {
    throw new HttpError(400, `${field} must use https`);
  }
  return v;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    /* ---- validate BEFORE any write, so a refusal writes nothing --------- */
    const iss = httpsUrl(body.iss, "iss");
    const authLoginUrl = httpsUrl(body.auth_login_url, "auth_login_url");
    const authTokenUrl = httpsUrl(body.auth_token_url, "auth_token_url");
    const jwksUrl = httpsUrl(body.jwks_url, "jwks_url");

    const clientId = body.client_id?.trim();
    if (!clientId) throw new HttpError(400, "client_id is required");

    const name = body.name?.trim();
    if (!name) throw new HttpError(400, "name is required");

    let companyId: string | null = null;
    if (body.company_id) {
      companyId = body.company_id.trim();
      if (!UUID_RE.test(companyId)) {
        throw new HttpError(400, "company_id must be a uuid");
      }
      const { data: company } = await svc
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .maybeSingle();
      if (!company) throw new HttpError(404, "company not found");
    }

    let skew = 60;
    if (
      body.skew_tolerance_seconds !== undefined &&
      body.skew_tolerance_seconds !== null
    ) {
      skew = Number(body.skew_tolerance_seconds);
      if (!Number.isInteger(skew) || skew < SKEW_MIN || skew > SKEW_MAX) {
        throw new HttpError(
          400,
          `skew_tolerance_seconds must be a whole number between ${SKEW_MIN} and ${SKEW_MAX}`,
        );
      }
    }

    /* ---- siblings: same iss, other client_ids. NORMAL. ------------------ */
    // ONE UNBROKEN LITERAL -- a concatenated select collapses the row type.
    const { data: sameIss } = await svc
      .from("lti_platforms")
      .select("id, client_id, name")
      .eq("iss", iss);

    const siblings = sameIss ?? [];
    const duplicate = siblings.find((r) => r.client_id === clientId);
    if (duplicate) {
      // Pre-checked for a useful answer. The unique index is the real guard.
      throw new HttpError(
        409,
        `a registration already exists for this issuer and client_id ("${duplicate.name}")`,
      );
    }

    /* ---- insert --------------------------------------------------------- */
    const { data: created, error: insErr } = await svc
      .from("lti_platforms")
      .insert({
        iss,
        client_id: clientId,
        name,
        auth_login_url: authLoginUrl,
        auth_token_url: authTokenUrl,
        jwks_url: jwksUrl,
        company_id: companyId,
        skew_tolerance_seconds: skew,
        status: "active",
        created_by: actor,
        // product_family_code is NOT settable here. It is DISCOVERED from what
        // a platform sends in a launch (tool_platform.product_family_code), and
        // a value typed by an admin would be a guess wearing the same column as
        // an observation.
      })
      .select("id, iss, client_id, name")
      .single();

    if (insErr || !created) {
      const dup = (insErr as { code?: string } | null)?.code === "23505";
      console.error("lti_platforms insert failed", insErr);
      throw new HttpError(
        dup ? 409 : 500,
        dup
          ? "a registration already exists for this issuer and client_id"
          : "failed to create the registration",
      );
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "create_lti_platform",
      target_type: "lti_platform",
      target_id: created.id,
      reason: null,
      metadata: {
        iss,
        client_id: clientId,
        name,
        company_id: companyId,
        skew_tolerance_seconds: skew,
        // How many other registrations already shared this issuer. Recorded so
        // the audit trail shows a Canvas beta/test registration as the ordinary
        // thing it is rather than as a near-duplicate somebody has to explain.
        siblings_for_iss: siblings.length,
      },
    });

    return jsonResponse({
      ok: true,
      platform: {
        id: created.id,
        iss: created.iss,
        client_id: created.client_id,
        name: created.name,
      },
      // The console renders a plain note when this is non-zero. Not a warning.
      siblings_for_iss: siblings.length,
      sibling_names: siblings.map((s) => s.name),
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
