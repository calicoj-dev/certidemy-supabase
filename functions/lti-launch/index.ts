// POST /functions/v1/lti-launch
//
// Body: { id_token, state, state_cookie? }
// PUBLIC endpoint (verify_jwt = false, PINNED). The caller is certidemy.com's
// /lti/launch route handler, which holds no service_role of its own.
//
// THIS IS THE CODE THAT DECIDES WHETHER A LAUNCH IS GENUINE.
//
// ============================== ORDER OF OPERATIONS =======================
//
//   1. decode the id_token WITHOUT verifying   (untrusted; reads kid)
//   2. resolve lti_nonces BY STATE             (the trust anchor)
//   3. load the platform from lti_nonces.platform_id
//   4. verify: alg, key by kid, signature, iss, aud/azp, exp, iat, nonce
//   5. CONSUME the nonce, atomically
//   6. auto-register the deployment
//   7. parse into LaunchContext (the tolerant reader)
//   8. write evidence, then skeleton
//   9. record capability observations
//  10. branch on message type
//
// ============================== STEP 2/3: THE TRUST ANCHOR ================
//
// The registration is resolved from lti_nonces.platform_id -- something WE
// wrote at login time -- and NOT from the token's `iss`.
//
// AT STEP 4 THE TOKEN IS UNVERIFIED AND iss IS ATTACKER-CONTROLLED; USING IT TO
// PICK WHICH KEY VERIFIES THE SIGNATURE IS THE CLASSIC MISTAKE.
//
// The obvious implementation reads `iss` from the decoded payload, looks up the
// registration, fetches that platform's JWKS and verifies. It is wrong, and it
// is wrong in a way that looks completely reasonable: anyone can craft a token
// whose `iss` names a platform they control, and the signature will verify
// beautifully against that platform's key. The tool then believes a launch from
// an institution that never sent one.
//
// So `iss` becomes a CHECK rather than a lookup key: we already know which
// platform this flow belongs to, because we recorded it when we minted the
// state, and the token has to agree with us. Same instinct as open-badge
// resolving the issuer from credentials.issuer_id rather than from ?issuer=.
//
// ============================== STEP 5 AFTER STEP 4 =======================
//
// CONSUMING THE NONCE BEFORE VERIFYING LETS ANYONE BURN A REAL STUDENT'S STATE
// MID-LAUNCH WITH A GARBAGE POST, WHICH PRESENTS AS "THE EXAM LINK DOESN'T WORK
// FOR ME" AND IS ALMOST IMPOSSIBLE TO DIAGNOSE FROM THE OTHER END.
//
// The state travels through the browser, so anyone who can see it -- a shared
// screen, a proxy, a browser extension -- can POST it back with a junk token. If
// consumption happened first, that junk POST would spend the state and the real
// launch, arriving a second later, would be refused as a replay. The student
// sees a failure, the institution sees nothing, and the logs say "replay" about
// the victim rather than the attacker.
//
// Verify first. Then consume atomically:
//   update ... where consumed_at is null returning id
// Zero rows means somebody got there first, and THAT is the replay guard --
// not a read-then-write, which two simultaneous launches would both pass.
//
// ============================== THE FAILURE DISCLOSURE LINE ===============
//
// EVERY VERIFICATION FAILURE RETURNS THE SAME REASON TO THE BROWSER:
// "not_verified", plus a reference id. The precise error_code goes in
// lti_launch_skeleton, which only a platform_admin can read (256).
//
// The pairs that must not be distinguishable from outside are the point:
// nonce_not_found vs nonce_consumed is a REPLAY ORACLE -- "this state never
// existed" versus "this state was real and has been used" -- and
// bad_signature vs unknown_kid vs aud_mismatch each confirm which single field
// a forger got right.
//
// The reference id is the skeleton row's uuid. An admin matches a screenshot to
// the exact code in /console/lti. That is better than differentiated errors,
// not merely safer: it also works for the failures nobody can screenshot.
//
// Same instinct as requireIssuerAccess returning one 403 for "no role" and
// "wrong company", because a caller learning which applied learns whether an
// id they guessed exists.
//
// TWO EXCEPTIONS, both deliberate:
//   unregistered_platform  keeps a readable page naming iss and client_id. The
//                          reader is an admin doing setup, the values were sent
//                          BY them, and the alternative is an institution
//                          silently unable to start.
//   unsupported_message    LtiResourceLinkRequest is not a failure. It is phase
//                          2 not existing, and it says so.
//
// ============================== JWKS ERROR TAXONOMY =======================
//
// _shared/lti-jwt.ts throws DISTINCT codes -- jwks_unreachable, jwks_http_429,
// jwks_http_403, jwks_not_json, unknown_kid, unknown_kid_cached, jwk_unusable
// -- and they all land in skeleton.error_code.
//
// The reason is diagnostic, not cosmetic: A RATE LIMIT AND A KEY ROTATION WOULD
// OTHERWISE LOOK IDENTICAL AND WE WOULD CHASE THE WRONG REMEDY. Under one
// generic "jwks_failed", an institution whose WAF blocks us and an institution
// that rotated its keys produce the same row, and the first thing anyone tries
// is the wrong thing.
//
// THE RESIDUAL, NAMED: the key cache is in-memory and DIES WITH THE ISOLATE. A
// cold start refetches, and the negative cache only suppresses a retry storm
// within one isolate. That is proportionate -- a burst mostly lands on a warm
// isolate and a JWKS fetch is one round trip a platform expects -- but if it is
// ever wrong, the fix is a lti_jwks_cache table, and THE EVIDENCE WOULD ARRIVE
// AS jwks_http_429 IN THE SKELETON WITH A PLATFORM NAME ATTACHED. It is
// recognisable precisely because the codes are distinct.
//
// Worth knowing which failure is likelier: not load, but a WAF or allowlist,
// which fails on the FIRST launch at an institution rather than at nine in the
// morning under load. "It has never worked here" is far easier to diagnose than
// "it worked and then stopped".
//
// ============================== WHAT IS DEFERRED ==========================
//
// The lti1p1 migration claim, AGS, NRPS, and launch_presentation.document_target
// handling. Absent on purpose, recorded here rather than forgotten.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import {
  claimPresence,
  decodeJwt,
  getPlatformKey,
  hasValue,
  JwksError,
  LTI,
  type LaunchContext,
  parseLaunch,
  verifyRs256,
} from "../_shared/lti-jwt.ts";

interface Body {
  id_token?: string;
  state?: string;
  /** Read by the route handler; compared here. Absent is normal, not an error. */
  state_cookie?: string | null;
}

const DEEP_LINKING = "LtiDeepLinkingRequest";
const RESOURCE_LINK = "LtiResourceLinkRequest";

/** Locales we can plant a link for. Anything else falls back to en, explicitly. */
const SUPPORTED_LOCALES = new Set(["en", "es-419", "pt-BR"]);

// deno-lint-ignore no-explicit-any
type Svc = any;

/** Everything the skeleton needs, gathered as we go so a failure can still record. */
interface Trace {
  platformId: string | null;
  deploymentId: string | null;
  messageType: string | null;
  clockDeltaSeconds: number | null;
  claimPresence: Record<string, boolean> | null;
}

/**
 * Write the skeleton row and return its id.
 *
 * ALWAYS WRITTEN, success or failure. The reference id shown to a user IS this
 * row's id, so a failure that does not record leaves a person holding a
 * reference to nothing.
 */
async function recordSkeleton(
  svc: Svc,
  trace: Trace,
  outcome: string,
  errorCode: string | null,
): Promise<string | null> {
  const { data, error } = await svc
    .from("lti_launch_skeleton")
    .insert({
      platform_id: trace.platformId,
      deployment_id: trace.deploymentId,
      message_type: trace.messageType,
      outcome,
      error_code: errorCode,
      claim_presence: trace.claimPresence,
      clock_delta_seconds: trace.clockDeltaSeconds,
    })
    .select("id")
    .single();
  if (error) {
    console.error("skeleton insert failed", error);
    return null;
  }
  return data.id as string;
}

/** Non-fatal by construction. Failing to record must never cost a launch. */
async function observe(
  svc: Svc,
  platformId: string,
  deploymentId: string | null,
  key: string,
  value: boolean,
): Promise<void> {
  const { error } = await svc.rpc("lti_record_capability", {
    p_platform_id: platformId,
    p_deployment_id: deploymentId,
    p_key: key,
    p_value: value,
    p_detail: null,
  });
  if (error) console.warn(`lti_record_capability ${key}:`, error.message);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  const svc = getServiceClient();
  const trace: Trace = {
    platformId: null,
    deploymentId: null,
    messageType: null,
    clockDeltaSeconds: null,
    claimPresence: null,
  };

  /** One exit for every verification failure. Generic outward, precise inward. */
  const fail = async (code: string) => {
    const ref = await recordSkeleton(svc, trace, "verification_failed", code);
    return jsonResponse({ ok: false, reason: "not_verified", reference: ref }, 400);
  };

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const token = body.id_token?.trim();
    const state = body.state?.trim();

    if (!token || !state) return await fail("missing_id_token_or_state");

    /* ---- 1. decode WITHOUT verifying. Everything here is untrusted. ----- */
    let decoded;
    try {
      decoded = decodeJwt(token);
    } catch {
      return await fail("malformed_jwt");
    }

    const alg = decoded.header.alg;
    const kid = decoded.header.kid;
    if (alg !== "RS256") return await fail("alg_not_rs256");
    if (typeof kid !== "string" || kid === "") return await fail("missing_kid");

    /* ---- 2. THE TRUST ANCHOR: resolve the state row ------------------- */
    // ONE UNBROKEN LITERAL -- concatenation collapses the row type.
    const { data: nonceRow, error: nonceErr } = await svc
      .from("lti_nonces")
      .select("id, state, nonce, platform_id, expires_at, consumed_at, target_link_uri")
      .eq("state", state)
      .maybeSingle();

    if (nonceErr) throw new Error(`lti_nonces: ${nonceErr.message}`);

    // nonce_not_found and nonce_consumed are DISTINCT in the skeleton and
    // IDENTICAL to the caller. The difference between them is a replay oracle.
    if (!nonceRow) return await fail("nonce_not_found");
    if (nonceRow.consumed_at) return await fail("nonce_consumed");
    if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
      return await fail("state_expired");
    }

    trace.platformId = nonceRow.platform_id;

    /* ---- 3. the platform, from OUR row, never from the token ----------- */
    const { data: platform, error: pErr } = await svc
      .from("lti_platforms")
      .select("id, iss, client_id, name, jwks_url, skew_tolerance_seconds, status")
      .eq("id", nonceRow.platform_id)
      .maybeSingle();

    if (pErr) throw new Error(`lti_platforms: ${pErr.message}`);
    if (!platform) return await fail("platform_missing");
    if (platform.status !== "active") return await fail("platform_inactive");

    /* ---- 4. verify ---------------------------------------------------- */
    let key: CryptoKey;
    try {
      key = await getPlatformKey(platform.id, platform.jwks_url, kid);
    } catch (err) {
      // Distinct code straight through -- see the JWKS taxonomy in the header.
      const code = err instanceof JwksError ? err.code : "jwks_error";
      return await fail(code);
    }

    if (!(await verifyRs256(key, decoded))) return await fail("bad_signature");

    // FROM HERE THE PAYLOAD IS TRUSTED.
    const p = decoded.payload;

    if (p.iss !== platform.iss) return await fail("iss_mismatch");

    // aud may be a string OR an array, and azp becomes load-bearing when the
    // array has more than one entry -- the case single-audience tokens never
    // exercise, which is exactly why it gets missed.
    const audRaw = p.aud;
    const aud = Array.isArray(audRaw) ? audRaw : [audRaw];
    if (!aud.includes(platform.client_id)) return await fail("aud_mismatch");
    if (aud.length > 1 && p.azp !== platform.client_id) {
      return await fail("azp_mismatch");
    }

    const now = Math.floor(Date.now() / 1000);
    const skew = Number(platform.skew_tolerance_seconds) || 60;

    const exp = Number(p.exp);
    if (!Number.isFinite(exp)) return await fail("missing_exp");
    // Leeway on exp: a token that expired within the tolerance is clock drift.
    if (exp + skew < now) return await fail("expired");

    const iat = Number(p.iat);
    if (!Number.isFinite(iat)) return await fail("missing_iat");

    // RECORDED BEFORE THE CHECK, DELIBERATELY.
    //
    // A rejected token is exactly the one whose clock delta you want. Setting
    // this after the check would mean every iat_in_future row carries a null
    // delta -- and "their clock is 2 seconds ahead" and "their clock is three
    // hours ahead" are different problems with different remedies. Negative
    // values here mean the platform is ahead of us.
    trace.clockDeltaSeconds = now - iat;

    // NO LEEWAY ON iat. A token issued in the future is not drift, it is a
    // replay signal -- granting leeway here would accept exactly what the check
    // exists to catch.
    //
    // THE OPERATIONAL COST, NAMED: if a platform's clock runs even a second
    // ahead of ours, its legitimate launches are refused. That is a real
    // failure mode at an institution with poor time sync, and it is why the
    // delta above is captured rather than inferred -- a burst of iat_in_future
    // with deltas of -1 or -2 is a clock problem to solve with them, while a
    // delta of -3600 is something else entirely.
    if (iat > now) return await fail("iat_in_future");

    if (p.nonce !== nonceRow.nonce) return await fail("nonce_mismatch");

    /* ---- 5. CONSUME, atomically. See the header. ---------------------- */
    const { data: consumed, error: consumeErr } = await svc
      .from("lti_nonces")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", nonceRow.id)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();

    if (consumeErr) throw new Error(`nonce consume: ${consumeErr.message}`);
    // Zero rows means a concurrent request consumed it between our read and our
    // write. That is the replay guard doing its job.
    if (!consumed) return await fail("nonce_consumed_race");

    /* ---- 6/7. parse, then auto-register the deployment ---------------- */
    const ctx: LaunchContext = parseLaunch(p);
    trace.messageType = ctx.messageType.status === "provided"
      ? ctx.messageType.value
      : null;
    trace.claimPresence = claimPresence(ctx);

    if (!hasValue(ctx.deploymentId)) return await fail("missing_deployment_id");
    const deploymentIdClaim = (ctx.deploymentId as { value: string }).value;

    // AUTO-REGISTER. Refusing an unknown deployment_id would make every new
    // Canvas placement a support ticket -- and the value is attested by the
    // platform's own signature, which we have now verified.
    const { data: deployment } = await svc
      .from("lti_deployments")
      .upsert(
        {
          platform_id: platform.id,
          deployment_id: deploymentIdClaim,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "platform_id,deployment_id" },
      )
      .select("id")
      .maybeSingle();

    trace.deploymentId = deployment?.id ?? null;

    /* ---- 8. evidence, then skeleton ----------------------------------- */
    // Evidence carries the RAW JWT as well as the decoded claims: decoded is
    // what we think arrived, raw can be re-verified against the platform's JWKS
    // months later. It is PII and expires in 30 days by column default.
    const { error: evErr } = await svc.from("lti_launch_evidence").insert({
      platform_id: platform.id,
      deployment_id: trace.deploymentId,
      raw_jwt: token,
      claims: p,
    });
    if (evErr) console.warn("evidence insert failed:", evErr.message);

    /* ---- 9. observations. All non-fatal. ------------------------------ */
    const cookieMatched = body.state_cookie === state;
    await observe(svc, platform.id, null, "state_cookie_survives", cookieMatched);
    await observe(svc, platform.id, null, "releases_email", hasValue(ctx.email));
    await observe(svc, platform.id, null, "releases_name", hasValue(ctx.name));
    await observe(svc, platform.id, null, "aud_is_array", Array.isArray(audRaw));
    await observe(
      svc,
      platform.id,
      null,
      "supports_deep_linking",
      hasValue(ctx.deepLinking.returnUrl),
    );
    if (Object.keys(ctx.custom).length > 0) {
      await observe(
        svc,
        platform.id,
        null,
        "custom_vars_substituted",
        !Object.values(ctx.custom).some((c) => c.status === "unsubstituted"),
      );
    }

    // product_family_code is DISCOVERED here, never typed by an admin. Recorded
    // on the registration for diagnostics; nothing branches on it.
    if (hasValue(ctx.productFamilyCode)) {
      const pfc = (ctx.productFamilyCode as { value: string }).value;
      await svc
        .from("lti_platforms")
        .update({ product_family_code: pfc })
        .eq("id", platform.id)
        .is("product_family_code", null);
    }

    /* ---- 10. branch --------------------------------------------------- */
    const messageType = trace.messageType;

    if (messageType === DEEP_LINKING) {
      if (!hasValue(ctx.deepLinking.returnUrl)) {
        return await fail("deep_linking_without_return_url");
      }
      const returnUrl = (ctx.deepLinking.returnUrl as { value: string }).value;

      // launch_presentation.locale is advertised, so it is read like any other
      // claim. Present and one of ours -> plant that locale. Absent or
      // unrecognised -> 'en' EXPLICITLY, never the unprefixed path: a link in
      // someone's course outlives our routing, and it must not depend on a
      // redirect we control.
      const localeClaim = ctx.locale;
      const locale = localeClaim.status === "provided" &&
          SUPPORTED_LOCALES.has(localeClaim.value)
        ? localeClaim.value
        : "en";

      const { data: session, error: sErr } = await svc
        .from("lti_launch_sessions")
        .insert({
          platform_id: platform.id,
          deployment_id: trace.deploymentId,
          message_type: messageType,
          deep_link_return_url: returnUrl,
          accept_types: ctx.deepLinking.acceptTypes.status === "provided"
            ? ctx.deepLinking.acceptTypes.value
            : null,
          accept_multiple: ctx.deepLinking.acceptMultiple,
          document_targets: ctx.deepLinking.documentTargets.status === "provided"
            ? ctx.deepLinking.documentTargets.value
            : null,
          locale,
          target_link_uri: nonceRow.target_link_uri,
        })
        .select("id")
        .single();

      if (sErr || !session) {
        console.error("launch session insert failed", sErr);
        return await fail("session_not_recorded");
      }

      const ref = await recordSkeleton(svc, trace, "deep_linking_ok", null);
      return jsonResponse({
        ok: true,
        action: "select",
        session_id: session.id,
        locale,
        reference: ref,
      });
    }

    if (messageType === RESOURCE_LINK) {
      // NOT a failure. Phase 2 does not exist yet, and the honest answer is a
      // page that says so. Recorded as its own outcome, which also makes it
      // free telemetry: it tells us which institutions want phase 2 before we
      // build it.
      const ref = await recordSkeleton(svc, trace, "resource_link_unsupported", null);
      return jsonResponse({
        ok: true,
        action: "not_supported_yet",
        reference: ref,
      });
    }

    const ref = await recordSkeleton(svc, trace, "unsupported_message", messageType);
    return jsonResponse({ ok: true, action: "unsupported_message", reference: ref });
  } catch (err) {
    console.error(err);
    const ref = await recordSkeleton(svc, trace, "internal_error", "exception");
    return jsonResponse({ ok: false, reason: "internal", reference: ref }, 500);
  }
});
