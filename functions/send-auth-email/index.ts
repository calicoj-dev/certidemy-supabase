// POST /functions/v1/send-auth-email   (Supabase Auth "Send Email" hook)
//
// Replaces Supabase's built-in auth emails with one email in the person's own
// language, sent at once through Resend (a code cannot wait for the queue's cron).
// Auth signs each call with the Standard Webhooks scheme; SEND_EMAIL_HOOK_SECRET
// holds the "v1,whsec_..." secret the dashboard shows when the hook is created.
//
// Language: the locale segment of redirect_to (the page they were on), then
// user_metadata.preferred_language (set at signup), then en.
// Links keep the shape /auth/confirm already redeems: redirect_to + token_hash + type.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { render } from "../_shared/email-templates.ts";
import { buildLink, pickLocale, verifySignature } from "../_shared/auth-email.ts";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM_ADDRESS = "no-reply@mail.certidemy.com";
const REPLY_TO = "info@certidemy.com";
const SEND_TIMEOUT_MS = 8_000;

interface HookPayload {
  user?: { email?: string; user_metadata?: Record<string, unknown> };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  };
}

function hookError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return hookError(405, "method not allowed");

  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!secret || !apiKey) return hookError(500, "send-auth-email is not configured");

  const body = await req.text();
  if (!(await verifySignature(secret, req.headers, body))) {
    return hookError(401, "invalid signature");
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(body) as HookPayload;
  } catch {
    return hookError(400, "invalid JSON");
  }

  const to = payload.user?.email;
  const data = payload.email_data ?? {};
  const action = data.email_action_type ?? "";
  if (!to || !action) return hookError(400, "missing email or action type");

  const locale = pickLocale(data.redirect_to, payload.user?.user_metadata?.preferred_language);
  const key = action === "signup" ? "auth.signup" : action === "recovery" ? "auth.recovery" : "auth.other";
  const { subject, html, fromName } = render(key, locale, {
    code: data.token ?? "",
    link: buildLink(action, data.token_hash, data.redirect_to, locale),
  });

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: `${fromName} <${FROM_ADDRESS}>`, to: [to], reply_to: REPLY_TO, subject, html }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      console.error("send-auth-email: Resend refused", res.status, detail);
      return hookError(502, "the email could not be sent");
    }
  } catch (err) {
    console.error("send-auth-email: Resend unreachable", err);
    return hookError(502, "the email could not be sent");
  }

  return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
});
