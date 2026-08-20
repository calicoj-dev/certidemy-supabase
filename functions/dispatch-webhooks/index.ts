// POST /functions/v1/dispatch-webhooks
//
// Header: x-dispatch-key: <the Vault-held shared secret>
// Body:   {} (or { "limit": 25 })
//
// Called every minute by pg_cron via pg_net. Claims due deliveries, signs and
// POSTs each one, records the outcome.
//
// ============================== WHY NOT A JWT ==============================
//
// Deployed with verify_jwt = false and gated on a shared secret instead. The
// documented cron-to-function pattern wants a JWT in Vault, but minting a real
// one from SQL is currently awkward -- the static service_role key is no longer
// issued by the CLI, pgjwt is deprecated in Postgres 17, and pgsodium is not
// recommended for new use.
//
// BOTH SIDES READ THE SECRET FROM VAULT: the cron job to send it, this function
// to compare it. It exists in exactly one place and never in an env var, a
// config file or a deploy command.
//
// ============================== SIGNING ====================================
//
//   x-certidemy-signature: sha256=<hex hmac of the RAW body>
//   x-certidemy-timestamp: <unix seconds>
//   x-certidemy-event:     credential.issued
//
// Stripe/GitHub shape, so a partner's developer already knows what to do. The
// timestamp is inside the signed string as `<ts>.<body>` so a captured POST
// cannot be replayed a week later against a receiver that checks it.
//
// The signature covers the EXACT bytes sent. The body is serialised once and
// both signed and posted from that same string -- re-serialising for the POST
// would produce a signature over a document that differs by key order.
//
// ============================== ONE ATTEMPT PER RUN ========================
//
// A failed delivery is scheduled by complete_webhook_delivery and picked up by
// a later run. No retry loop in here: a slow endpoint would then hold the whole
// batch, and the batch is shared with every other partner.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/** Per-endpoint. Generous enough for a cold serverless receiver, short enough
 *  that a hung endpoint cannot eat the run. */
const POST_TIMEOUT_MS = 10_000;

/** Default batch. The cron runs every minute, so this is 1,500/hour before any
 *  tuning; raise it and the frequency together when that stops being enough. */
const DEFAULT_LIMIT = 25;

interface Claimed {
  delivery_id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, unknown>;
  attempts: number;
  url: string;
  secret_id: string | null;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(secret);
  const keyBuf = new Uint8Array(new ArrayBuffer(keyBytes.length));
  keyBuf.set(keyBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const msgBytes = enc.encode(message);
  const msgBuf = new Uint8Array(new ArrayBuffer(msgBytes.length));
  msgBuf.set(msgBytes);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, msgBuf)));
}

/**
 * Constant-time compare. A shared secret checked with === leaks its prefix to
 * anyone willing to measure, and this endpoint is public.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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

    // ---- gate ------------------------------------------------------------
    const presented = req.headers.get("x-dispatch-key") ?? "";
    const { data: expected, error: sErr } = await svc.rpc("webhook_dispatch_secret");
    if (sErr) throw new Error(`dispatch secret: ${sErr.message}`);
    if (!expected || !safeEqual(presented, String(expected))) {
      return jsonResponse({ error: "not authorised" }, 401);
    }

    let limit = DEFAULT_LIMIT;
    try {
      const body = await req.json();
      if (Number.isInteger(body?.limit) && body.limit > 0 && body.limit <= 200) {
        limit = body.limit;
      }
    } catch { /* an empty body is the normal case from pg_cron */ }

    // ---- claim -----------------------------------------------------------
    const { data: claimed, error: cErr } = await svc.rpc(
      "claim_webhook_deliveries",
      { p_limit: limit },
    );
    if (cErr) throw new Error(`claim: ${cErr.message}`);

    const rows = (claimed ?? []) as Claimed[];
    if (rows.length === 0) {
      return jsonResponse({ ok: true, claimed: 0, delivered: 0, failed: 0 });
    }

    let delivered = 0;
    let failed = 0;
    const outcomes: { id: string; status: string; code: number | null }[] = [];

    // Sequential. A partner endpoint is a third party we do not control, and
    // 25 simultaneous outbound sockets from an edge worker is a good way to
    // find out what its limits are during someone else's incident.
    for (const row of rows) {
      // Serialised ONCE. Signed and posted from the same string, because
      // re-serialising can reorder keys and the signature would then cover a
      // document the receiver never saw.
      const bodyText = JSON.stringify(row.payload);
      const ts = Math.floor(Date.now() / 1000).toString();

      let code: number | null = null;
      let ok = false;
      let error: string | null = null;

      try {
        let secret: string | null = null;
        if (row.secret_id) {
          const { data } = await svc.rpc("webhook_get_secret", {
            p_secret_id: row.secret_id,
          });
          secret = (data as string | null) ?? null;
        }

        const headers: Record<string, string> = {
          "content-type": "application/json",
          "user-agent": "Certidemy-Webhooks/1.0",
          "x-certidemy-event": row.event,
          "x-certidemy-timestamp": ts,
          "x-certidemy-delivery": row.delivery_id,
        };
        if (secret) {
          // ts INSIDE the signed string: a captured POST replayed next week
          // still verifies against the body alone, and does not against this.
          headers["x-certidemy-signature"] =
            `sha256=${await hmacSha256Hex(secret, `${ts}.${bodyText}`)}`;
        }

        const res = await fetch(row.url, {
          method: "POST",
          headers,
          body: bodyText,
          signal: AbortSignal.timeout(POST_TIMEOUT_MS),
          redirect: "error",
        });
        code = res.status;
        ok = res.ok;
        if (!ok) {
          // First 300 chars only. A receiver returning an HTML error page
          // should not be able to fill our table with it.
          error = (await res.text().catch(() => "")).slice(0, 300) || `HTTP ${code}`;
        }
      } catch (err) {
        error = (err as Error).message;
      }

      const { data: status, error: rErr } = await svc.rpc(
        "complete_webhook_delivery",
        {
          p_delivery_id: row.delivery_id,
          p_ok: ok,
          p_response_code: code,
          p_error: error,
        },
      );
      if (rErr) {
        // The POST may have SUCCEEDED and only the bookkeeping failed. The row
        // stays 'sending' and is reclaimed after 5 minutes, so the receiver
        // may see it twice -- which is why the delivery id header exists and
        // why receivers should treat it as at-least-once.
        console.error(`complete failed for ${row.delivery_id}: ${rErr.message}`);
      }

      ok ? delivered++ : failed++;
      outcomes.push({ id: row.delivery_id, status: String(status ?? "unknown"), code });
    }

    return jsonResponse({
      ok: true,
      claimed: rows.length,
      delivered,
      failed,
      outcomes,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
