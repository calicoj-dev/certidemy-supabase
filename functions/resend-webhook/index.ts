// POST /functions/v1/resend-webhook
//
// Headers: svix-id, svix-timestamp, svix-signature  (Resend delivers through
//          Svix; Professional/Enterprise senders may use webhook- prefixes, so
//          both are accepted)
// Body:    { "type": "email.delivered", "data": { "email_id": "...", ... } }
//
// Turns provider delivery events into rows on email_queue, and hard bounces and
// spam complaints into email_suppressions.
//
// ============================== WHY THIS EXISTS ============================
//
// dispatch-emails records that Resend ACCEPTED a message. Whether it ARRIVED is
// a different fact and only the provider knows it. Without this endpoint the
// platform sends blind, and the audit answer to whether a holder was notified
// is a shrug -- which, for an ISO/IEC 17024-aligned scheme where notification
// is part of the record, is not good enough.
//
// ============================== WHY verify_jwt = false =====================
//
// The caller is Svix. It carries no Supabase JWT and never will. The gateway
// would reject it before this function ran. It authenticates ITSELF, below,
// against a signature over the raw body -- which is strictly stronger than a
// bearer token, because it also proves the body was not altered in transit.
//
// ============================== THE RAW BODY ===============================
//
// req.text() ONCE, and the signature is computed over exactly those bytes.
// Parsing to JSON and re-serialising reorders keys and changes whitespace, and
// the signature then covers a document Svix never sent. This is the single most
// common way to get webhook verification wrong.
//
// ============================== HARD VS SOFT ===============================
//
// Only email.bounced with bounce_type 'hard' suppresses. A delivery_delayed is
// a full mailbox or a receiving server having a bad afternoon; retiring that
// address forever would lose a real holder their credential notice.
//
// ============================== IDEMPOTENCY ================================
//
// Svix retries, and can redeliver an event the endpoint already acknowledged
// when the acknowledgement is lost coming back. record_email_event is an UPDATE
// plus an ON CONFLICT DO NOTHING insert, so a replay changes nothing. An
// unknown email_id returns 'unknown' and still answers 200 -- a 4xx would make
// Svix retry an event we will never be able to match.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/** Svix's own replay window. A captured POST is useless once it expires. */
const TOLERANCE_SECONDS = 5 * 60;

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

/** Constant-time. A signature compared with === leaks its prefix to anyone
 *  willing to measure, and this endpoint is public. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function expectedSignature(
  secret: string,
  id: string,
  timestamp: string,
  rawBody: string,
): Promise<string> {
  // whsec_ is a display prefix; the key itself is the base64 that follows.
  const keyBytes = b64ToBytes(secret.startsWith("whsec_") ? secret.slice(6) : secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const enc = new TextEncoder();
  const msg = enc.encode(`${id}.${timestamp}.${rawBody}`);
  const msgBuf = new Uint8Array(new ArrayBuffer(msg.length));
  msgBuf.set(msg);
  return bytesToB64(new Uint8Array(await crypto.subtle.sign("HMAC", key, msgBuf)));
}

/** Both header prefixes. Svix white-labels to webhook- on higher tiers, and a
 *  plan change should not silently break ingestion. */
function header(req: Request, name: string): string | null {
  return req.headers.get(`svix-${name}`) ?? req.headers.get(`webhook-${name}`);
}

interface ResendEvent {
  type?: string;
  data?: {
    email_id?: string;
    bounce_type?: string;
    bounce?: { type?: string };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    if (!secret) throw new Error("RESEND_WEBHOOK_SECRET is not set");

    const id = header(req, "id");
    const timestamp = header(req, "timestamp");
    const signatureHeader = header(req, "signature");

    if (!id || !timestamp || !signatureHeader) {
      return jsonResponse({ error: "missing signature headers" }, 400);
    }

    // Read ONCE, verify over exactly these bytes, parse only afterwards.
    const rawBody = await req.text();

    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) {
      return jsonResponse({ error: "bad timestamp" }, 400);
    }
    const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
    if (skew > TOLERANCE_SECONDS) {
      return jsonResponse({ error: "timestamp outside tolerance" }, 400);
    }

    const expected = await expectedSignature(secret, id, timestamp, rawBody);

    // The header carries a space-separated list, each entry "v1,<base64>".
    // Several appear during a secret rotation and ANY match is valid.
    const presented = signatureHeader
      .split(" ")
      .map((part) => {
        const comma = part.indexOf(",");
        return comma === -1 ? part : part.slice(comma + 1);
      })
      .filter((s) => s.length > 0);

    if (!presented.some((sig) => safeEqual(sig, expected))) {
      return jsonResponse({ error: "invalid signature" }, 401);
    }

    // ---- verified past this point ---------------------------------------
    let event: ResendEvent;
    try {
      event = JSON.parse(rawBody) as ResendEvent;
    } catch {
      return jsonResponse({ error: "body is not json" }, 400);
    }

    const emailId = event.data?.email_id ?? null;
    const type = event.type ?? "";

    if (!emailId) {
      // Contact and domain events carry no email_id. Not ours; acknowledge so
      // Svix stops retrying something we will never act on.
      return jsonResponse({ ok: true, result: "no email_id", type });
    }

    let mapped: "delivered" | "bounced" | "complained" | null = null;
    if (type === "email.delivered") {
      mapped = "delivered";
    } else if (type === "email.complained") {
      mapped = "complained";
    } else if (type === "email.bounced") {
      // Only a PERMANENT rejection suppresses. A soft bounce is a full mailbox
      // or a transient fault at the receiver; retiring that address would cost
      // a real holder their credential notice.
      const bounceType = (event.data?.bounce_type ?? event.data?.bounce?.type ?? "").toLowerCase();
      mapped = bounceType === "hard" ? "bounced" : null;
    }

    if (mapped === null) {
      // email.sent, email.opened, email.clicked, email.delivery_delayed and
      // soft bounces all land here. Acknowledged, deliberately not recorded:
      // delivery_status is a vocabulary of FINAL outcomes.
      return jsonResponse({ ok: true, result: "ignored", type });
    }

    const svc = getServiceClient();
    const { data, error } = await svc.rpc("record_email_event", {
      p_provider_message_id: emailId,
      p_event: mapped,
    });
    if (error) throw new Error(`record_email_event: ${error.message}`);

    // 'unknown' means no queue row carries that provider id -- an auth email
    // sent over SMTP, or a message predating the queue. Still a 200: a 4xx
    // would make Svix retry an event that can never match.
    return jsonResponse({ ok: true, result: String(data ?? "unknown"), type });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
