// POST /functions/v1/request-signin-link
//
// Public (verify_jwt = false). Emails a one-time sign-in link so a credential
// holder can reach their credentials without a password (stage 4).
//
// Body: { email?, offer_token?, locale? }  -- offer_token resolves the address from
// a credential offer, so the recipient page never has to show or ask for it.
//
// ALWAYS answers { ok: true }: the response must not say whether an address has an
// account or a credential. Mail goes only to an address that holds a credential or
// an offer, or already has an account; at most 3 links per 15 minutes per address.
// generateLink creates the account when there is none and sends nothing itself
// (_shared/lti-provision.ts); our queue sends the email.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { RECIPIENT_EMAIL_RE } from "../_shared/issue.ts";
import { OFFER_TOKEN_RE, offerLocale, sha256Hex } from "../_shared/offer.ts";

const SITE = "https://certidemy.com";
const PER_WINDOW = 3;
const WINDOW_MS = 15 * 60 * 1000;

interface Body {
  email?: string;
  offer_token?: string;
  locale?: string;
}

// deno-lint-ignore no-explicit-any
type Svc = any;

async function exists(q: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>, what: string) {
  const { data, error } = await q;
  if (error) throw new Error(`${what}: ${error.message}`);
  return (data ?? []).length > 0;
}

async function resolve(svc: Svc, body: Body): Promise<{ email: string; name: string | null } | null> {
  if (body.offer_token) {
    if (!OFFER_TOKEN_RE.test(body.offer_token)) return null;
    const { data, error } = await svc.from("credential_offers")
      .select("recipient_email, name_sent, name_final")
      .eq("token_hash", await sha256Hex(body.offer_token)).maybeSingle();
    if (error) throw new Error(`offer: ${error.message}`);
    return data ? { email: String(data.recipient_email).toLowerCase(), name: data.name_final ?? data.name_sent } : null;
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  return RECIPIENT_EMAIL_RE.test(email) ? { email, name: null } : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const locale = offerLocale(body.locale);
    const svc = getServiceClient();
    const who = await resolve(svc, body);
    if (!who) return jsonResponse({ ok: true });

    // Eligible: holds a credential, has an offer, or already has an account.
    const [holds, offered, account] = await Promise.all([
      exists(svc.from("credentials").select("id").eq("holder_email", who.email).limit(1), "credentials"),
      exists(svc.from("credential_offers").select("id").eq("recipient_email", who.email).in("status", ["sent", "change_requested", "confirmed"]).limit(1), "offers"),
      exists(svc.from("profiles").select("id").eq("email", who.email).limit(1), "profiles"),
    ]);
    if (!holds && !offered && !account) return jsonResponse({ ok: true });

    const { count, error: cErr } = await svc.from("email_queue")
      .select("id", { count: "exact", head: true })
      .eq("template_key", "auth.signin_link").eq("to_email", who.email)
      .gte("created_at", new Date(Date.now() - WINDOW_MS).toISOString());
    if (cErr) throw new Error(`rate: ${cErr.message}`);
    if ((count ?? 0) >= PER_WINDOW) return jsonResponse({ ok: true });

    // A new account takes the name the credential was issued under.
    const { data: link, error: lErr } = await svc.auth.admin.generateLink({
      type: "magiclink",
      email: who.email,
      options: who.name ? { data: { full_name: who.name } } : undefined,
    });
    const token = link?.properties?.hashed_token;
    if (lErr || !token) throw new Error(`generateLink: ${lErr?.message ?? "no hashed_token"}`);

    const next = `/${locale}/dashboard#earned`;
    const url = `${SITE}/${locale}/auth/confirm?token_hash=${encodeURIComponent(token)}&type=magiclink&next=${encodeURIComponent(next)}`;
    const { error: qErr } = await svc.rpc("enqueue_email", {
      p_template_key: "auth.signin_link",
      p_to_email: who.email,
      p_locale: locale,
      p_payload: { url },
      // One per minute per address: a double click sends one email.
      p_dedupe_key: `signin:${who.email}:${Math.floor(Date.now() / 60000)}`,
    });
    if (qErr) throw new Error(`enqueue: ${qErr.message}`);
    return jsonResponse({ ok: true });
  } catch (err) {
    // Logged, never echoed: an error body would leak which branch ran.
    console.error("request-signin-link", (err as Error).message);
    return jsonResponse({ ok: true });
  }
});
