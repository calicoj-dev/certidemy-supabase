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
// one.
//
// WE PLANT AN `ltiResourceLink`. This header used to say the opposite, in the
// same certain tone -- "planting the other would be planting a dead end" -- and
// it was correct WHEN WRITTEN and became false without changing a character.
// In phase 1 an ltiResourceLink launched us and we answered "student launch is
// not available yet", so a plain link to the public certification page was the
// only thing that worked. Phase 2 shipped the student launch and proved it on a
// real withheld-email Moodle launch, at which point the plain link became the
// dead end: a `link` content item is a URL resource, so clicking it is an
// ordinary navigation with no id_token and no launch, and every bit of phase 2
// sits unreachable behind it.
//
// A COMMENT THAT WAS TRUE ON THE DAY IT WAS WRITTEN IS THE HARDEST KIND TO
// CATCH, because nothing about it ever looks wrong. What dates it is not the
// wording but the fact it asserts about another part of the system.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  action?: string;
  session_id?: string;
  codes?: string[];
}

const SITE = "https://certidemy.com";

/** Response JWTs are short-lived. They cross one browser hop and are consumed. */
const RESPONSE_TTL_SECONDS = 300;

/**
 * THE ONLY CLAIM URL IN THIS FILE THAT IS NAMED, AND DELIBERATELY SO.
 *
 * Every other claim in the response payload appears once, as an inline literal,
 * and should stay that way. This one is referenced TWICE -- once to set it, and
 * once to derive the `data` boolean recorded on the skeleton row.
 *
 * Two copies of a URL string is exactly the drift that would make that boolean
 * silently wrong forever: a typo in the second copy yields `false` on every
 * launch, nothing fails, and the row we added specifically to answer "did we
 * send data back?" answers it incorrectly with no error anywhere.
 *
 * So: named because it is used twice. Do NOT tidy the others to match.
 */
const DL_DATA_CLAIM = "https://purl.imsglobal.org/spec/lti-dl/claim/data";

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
        .select("id, code, name, description")
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
      .select("id, code, name")
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
    /* WE PLANT AN ltiResourceLink, NOT A link, AND THE DIFFERENCE IS THE WHOLE
       FEATURE. A `link` content item becomes a URL resource in the platform:
       clicking it is an ordinary web navigation, with no id_token, no sub and
       no launch. Everything phase 2 does -- identity, the two doors, seating --
       is unreachable from one. This previously planted a link to the PUBLIC
       MARKETING PAGE, so an instructor's course activity was a bookmark to a
       sales page. It was not wrong when it shipped: phase 1 had no launch to
       point at. It was overtaken.

       THE URL IS THE LAUNCH ENDPOINT AND CARRIES NO LOCALE. It used to carry
       one because a planted link outlives our routing. A launch does not need
       it: launch_presentation.locale arrives with every launch and is the
       STUDENT's language, whereas a locale planted here would be the
       INSTRUCTOR's, pinned permanently onto every student in the course. */

    /* ================== THE CUSTOM CLAIM IS KEYED ON THE IMMUTABLE ID ======
       certification_id, never the code, and this is the most consequential
       line in the file.

       A CONTENT ITEM IS WRITTEN ONCE INTO A PLATFORM WE DO NOT CONTROL AND
       REPLAYED ON EVERY LAUNCH FOREVER. We cannot edit it, migrate it, or see
       it. Whatever goes in here is permanent at every institution that ever
       planted one.

       `code` is mutable and has already been rewritten across this entire
       catalogue: migration 053 renamed every certification to the AI line and
       silently falsified four things -- a validator, a lookup, a generated
       artifact and a directory name -- none of which raised its voice for two
       months. If the code were the key, the next rename would orphan every
       planted activity at every institution, and NOTHING IN EITHER REPO WOULD
       EVER SEE IT: the launches keep arriving, they simply resolve to nothing.
       That is 053's silent failure relocated to somewhere we have no logs at
       all.

       `certifications.id` is a uuid primary key. A rename does not touch it,
       so the launch resolves id -> CURRENT code from live data and every
       planted activity follows the rename by itself.

       AND ONLY THE ID -- the code is deliberately NOT carried alongside it. A
       readable copy of a mutable fact sitting next to the immutable key is the
       pair that somebody eventually branches on, and a stale copy of a code is
       worse than no copy. The instructor already sees the certification's name
       in `title`, which is the platform's own display text.

       A literal can never legitimately arrive `unsubstituted`, so the launch's
       four-state claim reader turns a platform mangling this value into a
       detectable event rather than a student silently seated in the wrong
       place. */
    const contentItems = found.map((c) => ({
      type: "ltiResourceLink",
      title: c.name,
      url: `${SITE}/lti/launch`,
      custom: {
        certidemy_certification_id: c.id,
      },
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
      payload[DL_DATA_CLAIM] = session.deep_link_data;
    }

    /* ---- the two booleans recorded on the response row ------------------- */
    //
    // TWO INDEPENDENT SOURCES, AND THAT IS THE ENTIRE POINT.
    //
    //   dataRequested  from the SESSION COLUMN -- did the platform send one?
    //   dataEchoed     from the PAYLOAD        -- did we put one in the JWT?
    //
    // Derived separately so they are a CHECK rather than a restatement. A row
    // where `data_requested` is true and `data` is false says exactly one
    // thing, and it is the failure migration 259 exists to prevent: a platform
    // that sent a correlation handle, did not get it back, and rejected our
    // response AT ITS OWN END where we never see the rejection.
    //
    // One boolean could not say that. `data: false` alone means both "there was
    // nothing to echo" and "we dropped what we had" -- and the sweep in 258
    // deletes the session about a day after expiry, so joining the column to
    // disambiguate works only in the window where nobody is asking. The
    // skeleton has indefinite retention and this row has to answer on its own,
    // weeks later.
    //
    // dataEchoed IS COMPUTED HERE, not at the insert. Here the payload is final
    // and about to become the signed bytes. Reading it thirty lines below would
    // be correct today and is the weaker guarantee -- it would depend on
    // nothing mutating the object in between, which is a promise about future
    // code rather than a fact about this one.
    const dataEchoed = DL_DATA_CLAIM in payload;
    const dataRequested = Boolean(session.deep_link_data);

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
      // BOOLEANS ONLY. claim_presence records WHICH claims were present, never
      // their values, on a table with no PII and indefinite retention. The
      // `data` value is opaque platform-supplied content and has no business
      // here -- only whether it went.
      claim_presence: {
        content_items: true,
        count: contentItems.length > 0,
        data: dataEchoed,
        data_requested: dataRequested,
      },
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
