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
// dispatcher is a cron that does not exist yet -- rows will accumulate as
// pending, which is visible and recoverable, unlike a fire-and-forget POST
// inside a request handler that nobody sees fail.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  achievement_code?: string;
  recipient_email?: string;
  recipient_name?: string;
  display_id?: string;
  issued_at?: string;
  expires_at?: string;
  idempotency_key?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** No I, L, O, 0 or 1: these codes get read aloud and typed off paper. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = new Uint8Array(new ArrayBuffer(data.length));
  buf.set(data);
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)));
}

function randomBlock(n: number): string {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  let out = "";
  for (const x of b) out += CODE_ALPHABET[x % CODE_ALPHABET.length];
  return out;
}

/**
 * credential_code -- the URL segment.
 *
 * Deliberately NOT the partner's own numbering. display_id carries that and
 * prints on the certificate. This one has entropy because it is public and
 * guessable codes let anyone walk /credentials/1..5000 and harvest every
 * holder name an issuer ever wrote.
 */
function mintCredentialCode(achievementCode: string): string {
  const stem = achievementCode
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);
  return `${stem}-${randomBlock(4)}-${randomBlock(4)}`;
}

/** 256 bits, matching the shape migration 185 backfilled. */
function mintSalt(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return hex(b);
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
    if (!email || !EMAIL_RE.test(email)) {
      await logRequest(400, null, idem, "recipient_email");
      return jsonResponse({ error: "valid recipient_email required" }, 400);
    }
    if (!holderName) {
      await logRequest(400, null, idem, "recipient_name");
      return jsonResponse({ error: "recipient_name required" }, 400);
    }
    if (holderName.length > 120) {
      await logRequest(400, null, idem, "recipient_name too long");
      return jsonResponse({ error: "recipient_name must be 120 characters or fewer" }, 400);
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

    /* -------------------------------------------------- the achievement -- */
    const { data: ach, error: aErr } = await svc
      .from("achievements")
      .select("id, code, name, status, issuer_id, default_validity_days")
      .eq("issuer_id", issuer.id)
      .eq("code", achCode)
      .maybeSingle();
    if (aErr) throw new Error(`achievement lookup: ${aErr.message}`);
    if (!ach) {
      await logRequest(404, null, idem, "achievement not found");
      return jsonResponse(
        { error: `no achievement "${achCode}" for issuer "${issuer.slug}"` },
        404,
      );
    }
    if (ach.status !== "active") {
      await logRequest(409, null, idem, "achievement not active");
      return jsonResponse(
        { error: `achievement "${achCode}" is ${ach.status}, not active` },
        409,
      );
    }

    /* ---------------------------------------------------------- mint ----- */
    const issuedAt = body.issued_at ? new Date(body.issued_at) : new Date();
    if (Number.isNaN(issuedAt.getTime())) {
      await logRequest(400, null, idem, "issued_at");
      return jsonResponse({ error: "issued_at is not a valid date" }, 400);
    }

    let expiresAt: string | null = null;
    if (body.expires_at) {
      const d = new Date(body.expires_at);
      if (Number.isNaN(d.getTime())) {
        await logRequest(400, null, idem, "expires_at");
        return jsonResponse({ error: "expires_at is not a valid date" }, 400);
      }
      expiresAt = d.toISOString();
    } else if (ach.default_validity_days) {
      expiresAt = new Date(
        issuedAt.getTime() + ach.default_validity_days * 86400_000,
      ).toISOString();
    }

    let credential: { id: string; credential_code: string } | null = null;
    for (let attempt = 0; attempt < 5 && !credential; attempt++) {
      const code = mintCredentialCode(ach.code);
      const { data, error } = await svc
        .from("credentials")
        .insert({
          credential_code: code,
          user_id: null,
          holder_email: email,
          holder_name: holderName,
          display_id: displayId,
          achievement_id: ach.id,
          issuer_id: issuer.id,
          // No certification behind a partner achievement, and no exam, so no
          // score. Migration 231 made all three nullable for exactly this row.
          certification_id: null,
          certification_name: ach.name,
          certification_code: ach.code,
          score_pct: null,
          exam_attempt_id: null,
          issued_at: issuedAt.toISOString(),
          expires_at: expiresAt,
          status: "active",
          subject_salt: mintSalt(),
          is_specimen: false,
        })
        .select("id, credential_code")
        .single();

      if (!error && data) {
        credential = data;
        break;
      }
      if ((error as { code?: string } | null)?.code !== "23505") {
        console.error("credential insert failed", error);
        await logRequest(500, null, idem, error?.message ?? "insert failed");
        return jsonResponse({ error: "failed to issue credential" }, 500);
      }
    }
    if (!credential) {
      await logRequest(500, null, idem, "code collision");
      return jsonResponse({ error: "failed to issue credential" }, 500);
    }

    await logRequest(200, credential.id, idem, null);

    /* ------------------------------------------------------- webhooks ---- */
    // QUEUED, not delivered. A POST fired from inside this handler would fail
    // silently on a slow endpoint and take the issuance response with it.
    const { data: hooks } = await svc
      .from("issuer_webhooks")
      .select("id, events")
      .eq("issuer_id", issuer.id)
      .eq("is_active", true);
    const due = (hooks ?? []).filter((h: { events: string[] }) =>
      h.events?.includes("credential.issued")
    );
    if (due.length > 0) {
      await svc.from("webhook_deliveries").insert(
        due.map((h: { id: string }) => ({
          webhook_id: h.id,
          event: "credential.issued",
          payload: {
            event: "credential.issued",
            issuer: issuer.slug,
            achievement_code: ach.code,
            credential_code: credential!.credential_code,
            display_id: displayId,
            recipient_email: email,
            recipient_name: holderName,
            issued_at: issuedAt.toISOString(),
            url: `${issuer.base_url}/credentials/${credential!.credential_code}`,
          },
          status: "pending",
          next_retry_at: new Date().toISOString(),
        })),
      ).then(() => {}, (e: unknown) => console.warn("webhook queue failed", e));
    }

    return jsonResponse({
      ok: true,
      credential: {
        code: credential.credential_code,
        display_id: displayId,
        recipient_email: email,
        recipient_name: holderName,
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt,
        url: `${issuer.base_url}/credentials/${credential.credential_code}`,
        badge_url: `${issuer.base_url}/credentials/${credential.credential_code}/badge`,
        verify_url: `${issuer.site_url}/verify/${credential.credential_code}`,
      },
      achievement: { code: ach.code, name: ach.name },
      issuer: { slug: issuer.slug, name: issuer.name },
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
