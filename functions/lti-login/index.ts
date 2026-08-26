// POST /functions/v1/lti-login
//
// Body: { iss, login_hint?, target_link_uri?, client_id?, lti_deployment_id?,
//         lti_message_hint? }
// PUBLIC endpoint (verify_jwt = false, PINNED). The caller is certidemy.com's
// /lti/login route handler, which has no service_role of its own.
//
// The STATEFUL half of the OIDC third-party-initiated login. It resolves the
// registration, mints and stores state + nonce, and records what it observed.
// It does NOT redirect and does NOT set a cookie -- both must happen on
// certidemy.com, because that is the origin the browser is talking to and the
// only place a cookie of ours can live.
//
// ============================== WHY THE WORK IS SPLIT ====================
//
// This needs service_role: lti_platforms is admin-only under RLS, and
// lti_nonces, lti_launch_skeleton and lti_capabilities have NO GRANT AT ALL to
// anon or authenticated. lib/supabase/admin.ts in the web repo refuses to be
// imported from a route handler, in as many words, and it is right to.
//
// So the split is the same one lib/openbadge/proxy.ts already argues for the
// credential documents: the privileged work happens in exactly one place, and
// the Next.js handler moves bytes and owns the browser-facing concerns
// (the 302, the cookie, the human-readable failure page).
//
// ============================== THE LOOKUP IS THREE-WAY ==================
//
// The registration key is (iss, client_id). But client_id is OPTIONAL on the
// login request -- some platforms send it, some do not, and the specification
// permits both. That leaves three cases, and the third is the one that matters:
//
//   client_id present            -> exact lookup. One row or none.
//   absent, ONE row for that iss -> use it, and record omits_client_id_on_login
//                                   so the capability record shows this
//                                   registration behaves that way.
//   absent, SEVERAL rows for iss -> REFUSE.
//
// The refusal is not caution for its own sake. All Instructure-hosted Canvas
// shares one issuer, https://canvas.instructure.com, so the moment there are
// two Canvas customers, `iss` alone matches both. Picking one would initiate a
// login against the WRONG TENANT'S auth endpoint -- and it would mostly appear
// to work, because the platform would answer, and the failure would surface
// later as a mismatched client_id or an audience error at their end.
//
// ============================== NONCE AND STATE ==========================
//
// Both CSPRNG, 256 bits, base64url. state is unique in the table so a replayed
// state collides rather than being silently accepted twice.
//
// The lti_nonces row is the ONLY thing that makes the eventual launch
// verifiable: at /lti/launch the state proves the flow started here, and the
// nonce inside the id_token must equal the one we generated. Without the row
// there is no way to tell a real launch from a replayed capture.
//
// TTL 10 MINUTES. The window is one redirect plus one page load. Anything
// longer only widens the replay window for a state nobody has consumed yet.
//
// ============================== WHAT IT RECORDS ==========================
//
// An unknown iss writes a lti_launch_skeleton row with
// outcome='unregistered_platform'. That row is how we find out an institution
// is trying to integrate BEFORE they email us -- someone registers Certidemy in
// their LMS, clicks it, and their attempt lands in a table rather than in a log
// nobody reads. platform_id is nullable precisely so this case can be recorded.
//
// No PII is written here in any case: a login request carries an opaque
// login_hint and nothing else about a person.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  iss?: string;
  client_id?: string;
  login_hint?: string;
  target_link_uri?: string;
  lti_deployment_id?: string;
  lti_message_hint?: string;
}

/** One redirect plus one page load. See the header. */
const NONCE_TTL_MINUTES = 10;

/**
 * THE REDIRECT URI, and the reason it is a constant rather than a computation.
 *
 * This exact string is registered on the platform side by a human who pasted
 * it. OIDC requires the redirect_uri we send to match what was registered
 * EXACTLY -- not equivalently, exactly. A trailing slash, a different host, an
 * environment-derived value that differs between deploys, and the platform
 * rejects the authorization request with an opaque error at THEIR end.
 *
 * So it is one literal, exported for the registration UI to display verbatim,
 * so an admin copies the same string we send rather than typing what they
 * think it should be.
 */
const REDIRECT_URI = "https://certidemy.com/lti/launch";

/** 256 bits, base64url, no padding. */
function randomToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  let bin = "";
  for (const x of b) bin += String.fromCharCode(x);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const svc = getServiceClient();
    const body = (await req.json().catch(() => ({}))) as Body;

    const iss = body.iss?.trim();
    const clientId = body.client_id?.trim() || null;

    if (!iss) {
      return jsonResponse({ ok: false, reason: "missing_iss" }, 400);
    }

    /* ---- the three-way lookup ------------------------------------------ */
    // ONE UNBROKEN LITERAL -- a concatenated select collapses the row type.
    let q = svc
      .from("lti_platforms")
      .select("id, iss, client_id, name, auth_login_url, status")
      .eq("iss", iss)
      .eq("status", "active");
    if (clientId) q = q.eq("client_id", clientId);

    const { data: rows, error: lookupErr } = await q;
    if (lookupErr) throw new Error(`lti_platforms: ${lookupErr.message}`);

    const matches = rows ?? [];

    if (matches.length === 0) {
      // Recorded, not just refused. See WHAT IT RECORDS in the header.
      await svc.from("lti_launch_skeleton").insert({
        platform_id: null,
        deployment_id: null,
        message_type: "LtiOidcLogin",
        outcome: "unregistered_platform",
        error_code: clientId ? "no_such_iss_client" : "no_such_iss",
        claim_presence: {
          iss: true,
          client_id: clientId !== null,
          login_hint: Boolean(body.login_hint),
          target_link_uri: Boolean(body.target_link_uri),
          lti_deployment_id: Boolean(body.lti_deployment_id),
          lti_message_hint: Boolean(body.lti_message_hint),
        },
      });

      return jsonResponse({
        ok: false,
        reason: "unregistered_platform",
        iss,
        client_id: clientId,
      }, 404);
    }

    if (matches.length > 1) {
      // Only reachable when client_id was absent -- with it, (iss, client_id)
      // is unique. See the header on why guessing is worse than refusing.
      await svc.from("lti_launch_skeleton").insert({
        platform_id: null,
        deployment_id: null,
        message_type: "LtiOidcLogin",
        outcome: "ambiguous_registration",
        error_code: "iss_matches_multiple_without_client_id",
        claim_presence: { iss: true, client_id: false },
      });

      return jsonResponse({
        ok: false,
        reason: "ambiguous_registration",
        iss,
        client_id: null,
        candidates: matches.length,
      }, 409);
    }

    const platform = matches[0];

    // TIER B: this registration omits client_id on login. Recorded rather than
    // inferred every time, so the capability record shows the behaviour of this
    // registration without anyone naming a vendor.
    if (!clientId) {
      const { error: capErr } = await svc.rpc("lti_record_capability", {
        p_platform_id: platform.id,
        p_deployment_id: null,
        p_key: "omits_client_id_on_login",
        p_value: true,
        p_detail: null,
      });
      // Never fatal. Failing to record an observation must not cost a launch.
      if (capErr) console.warn("lti_record_capability failed:", capErr.message);
    }

    /* ---- mint and store state + nonce ---------------------------------- */
    const state = randomToken();
    const nonce = randomToken();
    const expiresAt = new Date(Date.now() + NONCE_TTL_MINUTES * 60_000);

    const { error: nonceErr } = await svc.from("lti_nonces").insert({
      state,
      nonce,
      platform_id: platform.id,
      target_link_uri: body.target_link_uri ?? null,
      lti_message_hint: body.lti_message_hint ?? null,
      expires_at: expiresAt.toISOString(),
    });
    if (nonceErr) {
      // A login we cannot record is a launch we cannot verify. Refuse rather
      // than redirect into a flow whose other half has nothing to check.
      console.error("lti_nonces insert failed", nonceErr);
      throw new Error("could not record the login state; the launch was not started");
    }

    /* ---- build the authorization request -------------------------------- */
    const auth = new URL(platform.auth_login_url);
    auth.searchParams.set("scope", "openid");
    auth.searchParams.set("response_type", "id_token");
    auth.searchParams.set("response_mode", "form_post");
    auth.searchParams.set("prompt", "none");
    auth.searchParams.set("client_id", platform.client_id);
    auth.searchParams.set("redirect_uri", REDIRECT_URI);
    auth.searchParams.set("state", state);
    auth.searchParams.set("nonce", nonce);
    if (body.login_hint) auth.searchParams.set("login_hint", body.login_hint);
    if (body.lti_message_hint) {
      auth.searchParams.set("lti_message_hint", body.lti_message_hint);
    }
    // Echoed when the platform sent it. Some platforms use it to disambiguate
    // which deployment the eventual launch belongs to.
    if (body.lti_deployment_id) {
      auth.searchParams.set("lti_deployment_id", body.lti_deployment_id);
    }

    return jsonResponse({
      ok: true,
      authorize_url: auth.toString(),
      state,
      platform_name: platform.name,
      redirect_uri: REDIRECT_URI,
      state_ttl_seconds: NONCE_TTL_MINUTES * 60,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, reason: "internal", error: (err as Error).message }, 500);
  }
});
