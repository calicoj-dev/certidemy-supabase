// POST /functions/v1/lti-deep-link
//
// Body: { action: "context", session_id }
//     | { action: "sign", session_id, codes: string[] }
// PUBLIC endpoint (verify_jwt = false, PINNED). The caller is certidemy.com's
// picker, which holds no service_role and has no user behind it -- the
// instructor is inside an LMS iframe with no Certidemy account.
//
// AUTHORISATION IS THE SESSION ID. lti_launch_sessions.id is a bearer
// capability: 122 bits, 30 minutes, and what it unlocks is a certification
// picker and nothing else. See migration 257.
//
// ============================== THE SIGNING IS THE MIRROR OF lti-launch ===
//
// THESE TWO ARE A PAIR. lti-launch verifies an RS256 JWT a platform sent us;
// this signs an RS256 JWT we send back. Same algorithm, same key material
// handling, opposite direction.
//
// IF THEY EVER DISAGREE ABOUT THE JWT SHAPE, A PLATFORM REJECTS OUR RESPONSE
// WITH AN ERROR WE CANNOT SEE. The failure surfaces in their logs, on their
// timetable, as a signature or claim error naming OIDC rather than us -- and
// there is no callback telling us it happened. That asymmetry is why the shape
// belongs in one place conceptually even though the code runs in two:
//
//   header    { alg: "RS256", kid, typ: "JWT" }   -- lti-launch REQUIRES alg
//                                                    RS256 and a kid; we send
//                                                    exactly that.
//   base64url no padding, three parts, signature over `header.payload` ASCII
//             -- decodeJwt() in _shared/lti-jwt.ts splits on the same shape.
//
// If the verifier's expectations change, this changes with it.
//
// ============================== iss AND aud INVERT ========================
//
// The direction people get wrong. In a message FROM the platform, iss is the
// platform's issuer and aud is our client_id. In THIS message it is the other
// way round: WE are the issuer, and the issuer we are addressing is the
// audience.
//
//   iss  = platform.client_id   (the id THEY issued to US -- our identity to them)
//   aud  = platform.iss         (their issuer identifier)
//
// Writing iss = our own domain looks reasonable and is rejected by every
// conforming platform.
//
// ============================== accept_types IS READ, NOT ASSUMED =========
//
// Tier A: advertised per launch in deep_linking_settings, so it is read from
// the session rather than guessed. A platform that accepts only one item gets
// one, and a platform that does not accept a plain `link` gets an honest
// refusal rather than an item it will discard.
//
// WE PLANT A `link`, NOT AN `ltiResourceLink`. An ltiResourceLink is a link
// that launches US -- which in phase 1 lands on "student launch is not
// available yet". A plain link to the public certification page is the thing
// that actually works, and planting the other would be planting a dead end.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  action?: string;
  session_id?: string;
  codes?: string[];
}

const SITE = "https://certidemy.com";
const SUPPORTED_LOCALES = new Set(["en", "es-419", "pt-BR"]);

/** Response JWTs are short-lived. They cross one browser hop and are consumed. */
const RESPONSE_TTL_SECONDS = 300;

// deno-lint-ignore no-explicit-any
type Svc = any;

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlJson(o: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(o)));
}

/** PEM -> CryptoKey, the same shape lti-mint-tool-key produced. */
async function importSigningKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Load a session and refuse it if it is spent, expired or missing. */
async function loadSession(svc: Svc, id: string) {
  // ONE UNBROKEN LITERAL -- concatenation collapses the row type.
  const { data, error } = await svc
    .from("lti_launch_sessions")
    .select("id, platform_id, deployment_id, message_type, deep_link_return_url, accept_types, accept_multiple, locale, deep_link_data, expires_at, consumed_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`lti_launch_sessions: ${error.message}`);
  if (!data) return { error: "session_not_found" as const };
  if (data.consumed_at) return { error: "session_consumed" as const };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { error: "session_expired" as const };
  }
  return { session: data };
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
    const sessionId = body.session_id?.trim();

    if (!sessionId) return jsonResponse({ ok: false, reason: "missing_session" }, 400);

    const loaded = await loadSession(svc, sessionId);
    if ("error" in loaded) {
      return jsonResponse({ ok: false, reason: loaded.error }, 410);
    }
    const session = loaded.session;

    /* ================================================== action: context == */
    if (body.action !== "sign") {
      const { data: certs } = await svc
        .from("certifications")
        .select("code, name, description")
        .eq("status", "available")
        .order("sort_order", { ascending: true })
        .order("code", { ascending: true });

      const acceptTypes: string[] | null = session.accept_types ?? null;

      return jsonResponse({
        ok: true,
        session: {
          id: session.id,
          locale: session.locale ?? "en",
          accept_multiple: session.accept_multiple === true,
          accept_types: acceptTypes,
          // ADVERTISED, NOT ASSUMED. Null means the platform did not say, which
          // is different from saying "no link" -- the picker treats the two
          // differently and records which happened.
          accepts_link: acceptTypes === null ? null : acceptTypes.includes("link"),
        },
        certifications: certs ?? [],
      });
    }

    /* ===================================================== action: sign == */
    const codes = (body.codes ?? []).map((c) => String(c).trim()).filter(Boolean);
    if (codes.length === 0) {
      return jsonResponse({ ok: false, reason: "no_selection" }, 400);
    }

    // ACCEPT_MULTIPLE IS ENFORCED HERE, not only in the picker. The picker is a
    // form and a form can be edited; the platform's own stated limit is a rule.
    if (session.accept_multiple !== true && codes.length > 1) {
      return jsonResponse({ ok: false, reason: "multiple_not_accepted" }, 400);
    }

    const acceptTypes: string[] | null = session.accept_types ?? null;
    if (acceptTypes !== null && !acceptTypes.includes("link")) {
      // Honest refusal rather than an item the platform will discard silently.
      //
      // RENAMED 2026-08-27, from accepts_link_content_item. The old name
      // claimed something we can never know: deep linking has NO CALLBACK. We
      // sign, the browser redirects, and the platform decides at its own end.
      // We learned the 1EdTech reference implementation accepted our content
      // item by reading their web page -- nothing about acceptance reaches us,
      // and nothing ever will. So no honest `true` could mean "the platform
      // took it". The most any value here can mean is what it ADVERTISED.
      //
      // The rename was free: the key had zero rows, because this was its only
      // write site and it only ever fired on refusal. A one-sided recorder
      // makes absence ambiguous -- "never checked" and "checked and fine" look
      // identical. The true branch now lives in lti-launch, once per launch,
      // where the accept_types claim actually arrives.
      //
      // THIS WRITE STAYS. A platform that did not advertise link and got
      // refused is a real event, observed at the moment it mattered, and it is
      // a second observation of a different thing: not what was advertised at
      // launch, but what we hit when we tried to use it.
      await svc.rpc("lti_record_capability", {
        p_platform_id: session.platform_id,
        p_deployment_id: session.deployment_id,
        p_key: "advertises_link_content_item",
        p_value: false,
        p_detail: null,
      }).then(undefined, () => {});
      return jsonResponse({ ok: false, reason: "link_type_not_accepted" }, 400);
    }

    // Verify the codes are real and available. A code that is not is either a
    // stale picker or an edited form; either way it must not be planted.
    const { data: certs } = await svc
      .from("certifications")
      .select("code, name")
      .eq("status", "available")
      .in("code", codes);

    const found = certs ?? [];
    if (found.length !== codes.length) {
      return jsonResponse({ ok: false, reason: "unknown_certification" }, 400);
    }

    const { data: platform } = await svc
      .from("lti_platforms")
      .select("id, iss, client_id")
      .eq("id", session.platform_id)
      .maybeSingle();
    if (!platform) return jsonResponse({ ok: false, reason: "platform_missing" }, 410);

    const { data: deployment } = await svc
      .from("lti_deployments")
      .select("deployment_id")
      .eq("id", session.deployment_id)
      .maybeSingle();

    /* ---- the signing key ------------------------------------------------ */
    const { data: keyRow } = await svc
      .from("lti_tool_keys")
      .select("kid")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!keyRow) return jsonResponse({ ok: false, reason: "no_signing_key" }, 500);

    const { data: pem, error: keyErr } = await svc.rpc("lti_get_tool_key", {
      p_kid: keyRow.kid,
    });
    if (keyErr || !pem) {
      // Never echo the error: a Vault failure can carry the statement that
      // referenced the key.
      console.error("lti_get_tool_key failed", keyErr);
      return jsonResponse({ ok: false, reason: "no_signing_key" }, 500);
    }

    /* ---- the content items ---------------------------------------------- */
    // LOCALE IS PLANTED EXPLICITLY, NEVER LEFT UNPREFIXED. A link in someone's
    // course outlives our routing, so it must not depend on a redirect we
    // control. Unrecognised or absent falls back to 'en' as a literal segment.
    const locale = session.locale && SUPPORTED_LOCALES.has(session.locale)
      ? session.locale
      : "en";

    const contentItems = found.map((c) => ({
      type: "link",
      title: c.name,
      url: `${SITE}/${locale}/certifications/${c.code.toLowerCase()}`,
    }));

    /* ---- sign ------------------------------------------------------------ */
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", kid: keyRow.kid, typ: "JWT" };
    const payload: Record<string, unknown> = {
      // INVERTED FROM AN INBOUND MESSAGE -- see the header. We are the issuer,
      // identified by the client_id THEY issued to US; they are the audience.
      iss: platform.client_id,
      aud: platform.iss,
      iat: now,
      exp: now + RESPONSE_TTL_SECONDS,
      nonce: crypto.randomUUID(),
      "https://purl.imsglobal.org/spec/lti/claim/message_type":
        "LtiDeepLinkingResponse",
      "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id":
        deployment?.deployment_id ?? null,
      "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": contentItems,
    };

    // ECHOED UNCHANGED WHEN THE PLATFORM SENT ONE.
    //
    // deep_linking_settings.data is the correlation handle between the request
    // a platform made and the response we return, and the specification
    // requires it back verbatim. It means nothing to us and is never
    // interpreted.
    //
    // It is OPTIONAL -- Moodle does not send one -- and that is exactly why it
    // was missed first time round: a platform that DOES send it and does not
    // get it back rejects our response AT ITS OWN END, where we never see the
    // rejection. Deep linking would work in one LMS and silently not in
    // another.
    //
    // OMITTED ENTIRELY when absent, never sent as null or "". A platform that
    // sent nothing has nothing to correlate, and an empty string is a value
    // where there was none -- the same distinction the tolerant reader keeps
    // on the way in.
    if (session.deep_link_data) {
      payload["https://purl.imsglobal.org/spec/lti-dl/claim/data"] =
        session.deep_link_data;
    }

    const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
    const key = await importSigningKey(pem as string);
    const sig = new Uint8Array(
      await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        key,
        new TextEncoder().encode(signingInput),
      ),
    );
    const jwt = `${signingInput}.${b64url(sig)}`;

    /* ---- CONSUME, atomically. Same shape as the nonce. ------------------- */
    // After this the session cannot be reused. Consuming AFTER signing, so a
    // signing failure leaves the instructor able to try again rather than
    // holding a spent session and a blank page.
    const { data: consumed } = await svc
      .from("lti_launch_sessions")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", session.id)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();

    if (!consumed) {
      // Someone submitted twice. The first response is already on its way to
      // the platform; a second would plant duplicate links.
      return jsonResponse({ ok: false, reason: "session_consumed" }, 410);
    }

    await svc.from("lti_launch_skeleton").insert({
      platform_id: platform.id,
      deployment_id: session.deployment_id,
      message_type: "LtiDeepLinkingResponse",
      outcome: "deep_link_returned",
      error_code: null,
      claim_presence: { content_items: true, count: contentItems.length > 0 },
      clock_delta_seconds: null,
    });

    return jsonResponse({
      ok: true,
      jwt,
      return_url: session.deep_link_return_url,
      planted: contentItems.length,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, reason: "internal" }, 500);
  }
});
