// POST /functions/v1/issue-partner-credential
//
// Header: x-certidemy-key: cdk_live_...
// Body:   { achievement_code, recipient_email, recipient_name,
//           display_id?, issued_at?, expires_at?, idempotency_key? }
//
// The machine surface. A partner's LMS, script, Zapier scenario or LTI launch
// calls this on course completion and a signed OB3 credential exists a moment
// later.
//
// ============================== WHY NOT A JWT ==============================
//
// This is deployed with verify_jwt = false and authenticates ITSELF against
// issuer_api_keys. A Supabase JWT belongs to a user session; an automation has
// no user and no session, and handing a partner a service-role token would
// give them the whole database.
//
// The key arrives in x-certidemy-key rather than Authorization, because
// Authorization on this platform means "a Supabase JWT" everywhere else and a
// header that means two different things is a header somebody will eventually
// forward to the wrong place.
//
// ============================== THE MINT IS SHARED =========================
//
// Achievement resolution, the dates, the insert with its collision retry, and
// the webhook queue all live in _shared/issue.ts and are used identically by
// issue-credential-console, the browser path. What stays HERE is everything
// that exists only because the caller is a machine: the API key, the
// idempotency replay, issuer_api_requests, and this response shape.
//
// This function's wire behaviour is a live partner contract. The extraction
// changed none of it -- same status codes, same bodies, same log strings.
//
// ============================== NO ACCOUNT REQUIRED ========================
//
// user_id is NULL and holder_email carries the recipient. Migration 231 made
// that possible and claim_credentials() links it when they sign up. A partner
// finishing a Saturday bootcamp has 30 email addresses and no idea which of
// them will ever create a Certidemy account -- requiring accounts first would
// make the product unusable for exactly the customer it is built for.
//
// The salted identityHash is computed from holder_email, so the credential is
// matchable by a receiving HR system from the moment it is issued.
//
// ============================== IDEMPOTENCY ================================
//
// A webhook that fires twice must not mint twice. issuer_api_requests carries a
// unique index on (issuer_id, idempotency_key); a replay returns the ORIGINAL
// credential rather than a second one or an error, because from the caller's
// side those are the same request and they want the same answer.
//
// Without an idempotency_key there is no protection and cannot be: two
// identical POSTs with no key are indistinguishable from two genuine
// enrolments of the same person.
//
// ============================== WHAT IT DOES NOT DO ========================
//
// It does not sign anything. The credential row is written here; open-badge
// signs on read, with the issuer's key, which never leaves that function.
//
// It does not deliver webhooks. It QUEUES them into webhook_deliveries. The
// dispatcher is a cron.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import {
  IssueError,
  issueCredential,
  MAX_RECIPIENT_NAME,
  RECIPIENT_EMAIL_RE,
} from "../_shared/issue.ts";

interface Body {
  achievement_code?: string;
  recipient_email?: string;
  recipient_name?: string;
  display_id?: string;
  issued_at?: string;
  expires_at?: string;
  idempotency_key?: string;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = new Uint8Array(new ArrayBuffer(data.length));
  buf.set(data);
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  const svc = getServiceClient();
  let keyRow: {
    id: string;
    issuer_id: string;
    scopes: string[];
    environment: string;
    expires_at: string | null;
  } | null = null;

  /** Best-effort request log. Never blocks the response. */
  const logRequest = async (
    status: number,
    credentialId: string | null,
    idem: string | null,
    error: string | null,
  ) => {
    if (!keyRow) return;
    await svc.from("issuer_api_requests").insert({
      issuer_id: keyRow.issuer_id,
      api_key_id: keyRow.id,
      method: "POST",
      path: "/issue-partner-credential",
      status_code: status,
      credential_id: credentialId,
      idempotency_key: idem,
      error,
    }).then(
      () => {},
      (e: unknown) => console.warn("request log failed", e),
    );
  };

  try {
    /* ---------------------------------------------------------- auth ----- */
    const presented = req.headers.get("x-certidemy-key")?.trim();
    if (!presented) {
      return jsonResponse({ error: "x-certidemy-key header required" }, 401);
    }

    // Looked up BY HASH. The plaintext key exists nowhere on this platform.
    const { data: key, error: kErr } = await svc
      .from("issuer_api_keys")
      .select("id, issuer_id, scopes, environment, expires_at, revoked_at")
      .eq("key_hash", await sha256Hex(presented))
      .maybeSingle();
    if (kErr) throw new Error(`key lookup: ${kErr.message}`);

    // One message for every auth failure. Distinguishing "no such key" from
    // "revoked key" tells a prober which of their guesses was once real.
    if (!key || key.revoked_at) {
      return jsonResponse({ error: "invalid API key" }, 401);
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return jsonResponse({ error: "invalid API key" }, 401);
    }
    keyRow = key;

    if (!key.scopes?.includes("credentials:issue")) {
      await logRequest(403, null, null, "scope");
      return jsonResponse({ error: "this key cannot issue credentials" }, 403);
    }

    // Checked BEFORE the body is parsed, and kept here rather than folded into
    // issueCredential: an inactive issuer must answer 403 even when the body is
    // also malformed, which is the order this API has always had.
    const { data: issuer, error: iErr } = await svc
      .from("issuers")
      .select("id, slug, name, status, base_url, site_url")
      .eq("id", key.issuer_id)
      .maybeSingle();
    if (iErr) throw new Error(`issuer lookup: ${iErr.message}`);
    if (!issuer || issuer.status !== "active") {
      await logRequest(403, null, null, "issuer not active");
      return jsonResponse({ error: "issuer is not active" }, 403);
    }

    // Touch, best effort. A failed timestamp must not fail an issuance.
    await svc
      .from("issuer_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id)
      .then(() => {}, () => {});

    /* --------------------------------------------------------- input ----- */
    const body = (await req.json()) as Body;
    const achCode = body.achievement_code?.trim();
    const email = body.recipient_email?.trim().toLowerCase();
    const holderName = body.recipient_name?.trim();
    const displayId = body.display_id?.trim() || null;
    const idem = body.idempotency_key?.trim() || null;

    if (!achCode) {
      await logRequest(400, null, idem, "achievement_code");
      return jsonResponse({ error: "achievement_code required" }, 400);
    }
    if (!email || !RECIPIENT_EMAIL_RE.test(email)) {
      await logRequest(400, null, idem, "recipient_email");
      return jsonResponse({ error: "valid recipient_email required" }, 400);
    }
    if (!holderName) {
      await logRequest(400, null, idem, "recipient_name");
      return jsonResponse({ error: "recipient_name required" }, 400);
    }
    if (holderName.length > MAX_RECIPIENT_NAME) {
      await logRequest(400, null, idem, "recipient_name too long");
      return jsonResponse(
        { error: `recipient_name must be ${MAX_RECIPIENT_NAME} characters or fewer` },
        400,
      );
    }

    /* --------------------------------------------------- idempotency ----- */
    if (idem) {
      const { data: prior } = await svc
        .from("issuer_api_requests")
        .select("credential_id")
        .eq("issuer_id", issuer.id)
        .eq("idempotency_key", idem)
        .not("credential_id", "is", null)
        .maybeSingle();
      if (prior?.credential_id) {
        const { data: existing } = await svc
          .from("credentials")
          .select("id, credential_code, display_id, holder_email, issued_at, expires_at")
          .eq("id", prior.credential_id)
          .maybeSingle();
        if (existing) {
          // The SAME answer, not an error. From the caller's side a replay and
          // the original are one request.
          return jsonResponse({
            ok: true,
            replayed: true,
            credential: {
              code: existing.credential_code,
              display_id: existing.display_id,
              recipient_email: existing.holder_email,
              issued_at: existing.issued_at,
              expires_at: existing.expires_at,
              url: `${issuer.base_url}/credentials/${existing.credential_code}`,
            },
          });
        }
      }
    }

    /* ---------------------------------------------------------- mint ----- */
    let issued;
    try {
      issued = await issueCredential(svc, {
        issuerId: issuer.id,
        achievementCode: achCode,
        recipientEmail: email,
        recipientName: holderName,
        displayId,
        issuedAt: body.issued_at ?? null,
        expiresAt: body.expires_at ?? null,
      });
    } catch (err) {
      if (!(err instanceof IssueError)) throw err;

      // Each kind maps back to the status, body and log string this API
      // returned before the mint was extracted. Partner integrations read all
      // three.
      switch (err.kind) {
        case "achievement_not_found":
          await logRequest(404, null, idem, "achievement not found");
          return jsonResponse({ error: err.message }, 404);
        case "achievement_not_active":
          await logRequest(409, null, idem, "achievement not active");
          return jsonResponse({ error: err.message }, 409);
        case "bad_issued_at":
          await logRequest(400, null, idem, "issued_at");
          return jsonResponse({ error: err.message }, 400);
        case "bad_expires_at":
          await logRequest(400, null, idem, "expires_at");
          return jsonResponse({ error: err.message }, 400);
        case "insert_failed":
          await logRequest(500, null, idem, err.detail ?? "insert failed");
          return jsonResponse({ error: "failed to issue credential" }, 500);
        case "code_collision":
          await logRequest(500, null, idem, "code collision");
          return jsonResponse({ error: "failed to issue credential" }, 500);
        default:
          await logRequest(500, null, idem, err.message);
          return jsonResponse({ error: "failed to issue credential" }, 500);
      }
    }

    await logRequest(200, issued.id, idem, null);

    return jsonResponse({
      ok: true,
      credential: {
        code: issued.credentialCode,
        display_id: issued.displayId,
        recipient_email: issued.recipientEmail,
        recipient_name: issued.recipientName,
        issued_at: issued.issuedAt,
        expires_at: issued.expiresAt,
        url: `${issued.issuer.baseUrl}/credentials/${issued.credentialCode}`,
        badge_url: `${issued.issuer.baseUrl}/credentials/${issued.credentialCode}/badge`,
        verify_url: `${issued.issuer.siteUrl}/verify/${issued.credentialCode}`,
      },
      achievement: { code: issued.achievement.code, name: issued.achievement.name },
      issuer: { slug: issued.issuer.slug, name: issued.issuer.name },
      note:
        "The recipient has no account yet. The credential is theirs the moment " +
        "they sign up with this email; until then it verifies publicly without " +
        "the hashed identifier.",
    });
  } catch (err) {
    console.error(err);
    await logRequest(500, null, null, (err as Error).message);
    return jsonResponse({ error: "failed to issue credential" }, 500);
  }
});
