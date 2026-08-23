// POST /functions/v1/dispatch-emails
//
// Header: x-dispatch-key: <the Vault-held shared secret>
// Body:   {} (or { "limit": 25 })
//
// Called every minute by pg_cron via pg_net. Claims due sends, renders each one
// from its own payload, hands it to Resend, records the outcome.
//
// ============================== WHY NOT A JWT ==============================
//
// Same reasoning as dispatch-webhooks, and the SAME SECRET. Both are pg_cron
// calling one of our own edge functions -- one trust boundary, so a second
// Vault secret would be a second thing to rotate and no additional isolation.
// webhook_dispatch_secret() is read by both sides and exists nowhere else.
//
// ============================== WHY A SEPARATE DISPATCHER ==================
//
// Not folded into dispatch-webhooks. A partner's HTTP endpoint and Resend fail
// in different ways and on different timescales, and a partner endpoint that
// hangs for its full 10s timeout must not be able to hold an issuance notice
// behind it in the same batch.
//
// ============================== ONE ATTEMPT PER RUN ========================
//
// A failed send is rescheduled by complete_email_send and picked up later. No
// retry loop in here, for the same reason 235 gives: a slow call would hold the
// whole batch, and the batch is shared.
//
// ============================== RENDER FAILURES ARE TERMINAL ===============
//
// A template that throws is a bug in our code or a malformed payload. Neither
// gets better by waiting, so it is failed straight to 'abandoned' rather than
// burning five retries over 15 hours to arrive at the same place. The row keeps
// last_error, which is the thing worth reading.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { render, normalizeLocale } from "../_shared/email-templates.ts";

/** Resend is a third party. Generous enough for a cold path, short enough that
 *  one hung call cannot eat the run. */
const SEND_TIMEOUT_MS = 10_000;

/** The cron runs every minute. 25/min is 1,500/hour, far above the Resend plan
 *  ceiling; raise both together when that stops being true. */
const DEFAULT_LIMIT = 25;

const FROM_ADDRESS = "no-reply@mail.certidemy.com";

/** Replies go to a mailbox a human reads. The sending subdomain has no inbox
 *  and must never look like it does. */
const REPLY_TO = "info@certidemy.com";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface Claimed {
  send_id: string;
  template_key: string;
  to_email: string;
  locale: string;
  payload: Record<string, unknown>;
  attempts: number;
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

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");

    let limit = DEFAULT_LIMIT;
    try {
      const body = await req.json();
      if (Number.isInteger(body?.limit) && body.limit > 0 && body.limit <= 200) {
        limit = body.limit;
      }
    } catch { /* an empty body is the normal case from pg_cron */ }

    // ---- claim -----------------------------------------------------------
    const { data: claimed, error: cErr } = await svc.rpc("claim_email_sends", {
      p_limit: limit,
    });
    if (cErr) throw new Error(`claim: ${cErr.message}`);

    const rows = (claimed ?? []) as Claimed[];
    if (rows.length === 0) {
      return jsonResponse({ ok: true, claimed: 0, sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;
    const outcomes: { id: string; status: string }[] = [];

    // Sequential, same as dispatch-webhooks: 25 concurrent outbound sockets
    // from an edge worker is a good way to meet a rate limit during someone
    // else's incident.
    for (const row of rows) {
      let ok = false;
      let providerId: string | null = null;
      let error: string | null = null;
      let terminal = false;

      try {
        const locale = normalizeLocale(row.locale);
        const { subject, html, fromName } = render(row.template_key, locale, row.payload ?? {});

        const res = await fetch(RESEND_ENDPOINT, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <${FROM_ADDRESS}>`,
            to: [row.to_email],
            reply_to: REPLY_TO,
            subject,
            html,
          }),
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        });

        if (res.ok) {
          const json = await res.json().catch(() => null);
          providerId = (json?.id as string | undefined) ?? null;
          ok = true;
        } else {
          // First 300 chars only. A provider returning an HTML error page
          // should not be able to fill the table with it.
          error = (await res.text().catch(() => "")).slice(0, 300) || `HTTP ${res.status}`;
          // 4xx other than 429 is a rejected message, not a transient fault.
          // Retrying a malformed address five times over 15 hours arrives at
          // the same answer with more noise.
          terminal = res.status >= 400 && res.status < 500 && res.status !== 429;
        }
      } catch (err) {
        error = (err as Error).message;
        // A render failure is our bug or a bad payload. Waiting does not fix
        // either one.
        terminal = /^(unknown template_key|issuance\.credential:)/.test(error);
      }

      const { data: status, error: rErr } = await svc.rpc("complete_email_send", {
        p_send_id: row.send_id,
        p_ok: ok,
        p_provider_message_id: providerId,
        p_error: terminal && error ? `TERMINAL: ${error}` : error,
      });

      if (rErr) {
        // The send may have SUCCEEDED and only the bookkeeping failed. The row
        // stays 'sending' and is reclaimed after 5 minutes, so the recipient
        // could see it twice. dedupe_key prevents a duplicate ENQUEUE; it
        // cannot prevent a duplicate SEND, which is why this is logged loudly.
        console.error(`complete failed for ${row.send_id}: ${rErr.message}`);
      }

      // Terminal failures are walked straight to 'abandoned' rather than left
      // on the backoff ladder.
      if (!ok && terminal) {
        const { error: aErr } = await svc
          .from("email_queue")
          .update({ status: "abandoned", next_retry_at: null, claimed_at: null })
          .eq("id", row.send_id);
        if (aErr) console.error(`abandon failed for ${row.send_id}: ${aErr.message}`);
      }

      ok ? sent++ : failed++;
      outcomes.push({
        id: row.send_id,
        status: ok ? "sent" : terminal ? "abandoned" : String(status ?? "unknown"),
      });
    }

    return jsonResponse({ ok: true, claimed: rows.length, sent, failed, outcomes });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
