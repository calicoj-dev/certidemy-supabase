// POST /functions/v1/manage-credential-offers
//
// Auth: Bearer JWT -- platform_admin, or the team_admin of the company that owns THIS
// issuer (requireIssuerAccess, before anything else is trusted). Migration 388.
//
// Body: { action: "create" | "list" | "review" | "cancel", issuer_id, ... }
//   create  { achievement_code, recipients: [{ name, email }], locale?, awarded_on?, auto_minor_fixes? }
//   list    { achievement_code }
//   review  { offer_id, decision: "approve" | "keep" }   -- settles a requested name change by minting
//   cancel  { offer_id }
//   summary                       -- per-achievement counts for the status board (migration 390)
//   remind  { offer_id }          -- one reminder now, same personal link; at most once a day
//   readdress { offer_id, email } -- a bounced or wrong address: a new offer to the new address
//
// Nothing here is signed until a person confirms; "review" is the partner confirming for them,
// with the name the partner chose. The mint is _shared/offer-mint.ts -> _shared/issue.ts.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { requireIssuerAccess } from "../_shared/authorize.ts";
import { MAX_RECIPIENT_NAME, RECIPIENT_EMAIL_RE } from "../_shared/issue.ts";
import {
  confirmUrl,
  MAX_OFFERS_PER_CALL,
  newOfferToken,
  offerLocale,
  sha256Hex,
} from "../_shared/offer.ts";
import { mintFromOffer, OFFER_COLUMNS, type OfferRow } from "../_shared/offer-mint.ts";
import { allowanceJson, readAllowance } from "../_shared/allowance.ts";

/** The send would pass the yearly limit (migration 389). Carries the numbers the console shows. */
class LimitError extends Error {
  constructor(readonly remaining: number, readonly annualCap: number) {
    super("credential_limit");
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CHUNK = 100;

// deno-lint-ignore no-explicit-any
type Svc = any;

interface Body {
  action?: string;
  issuer_id?: string;
  achievement_code?: string;
  recipients?: { name?: unknown; email?: unknown }[];
  locale?: string;
  awarded_on?: string;
  auto_minor_fixes?: boolean;
  offer_id?: string;
  decision?: string;
  email?: string;
}

async function activeAchievement(svc: Svc, issuerId: string, code: string | undefined) {
  if (!code?.trim()) throw new HttpError(400, "achievement_code required");
  const { data, error } = await svc
    .from("achievements")
    .select("id, code, name, status")
    .eq("issuer_id", issuerId)
    .eq("code", code.trim())
    .maybeSingle();
  if (error) throw new Error(`achievement lookup: ${error.message}`);
  if (!data) throw new HttpError(404, `no achievement "${code}" for this issuer`);
  return data as { id: string; code: string; name: string; status: string };
}

/** Emails already holding this achievement, or with an open offer for it. Chunked: .in() is a URL. */
async function blockedEmails(svc: Svc, achievementId: string, emails: string[]) {
  const holds = new Set<string>();
  const offered = new Set<string>();
  for (let i = 0; i < emails.length; i += CHUNK) {
    const part = emails.slice(i, i + CHUNK);
    const [c, o] = await Promise.all([
      svc.from("credentials").select("holder_email")
        .eq("achievement_id", achievementId).eq("status", "active").in("holder_email", part),
      svc.from("credential_offers").select("recipient_email")
        .eq("achievement_id", achievementId).in("status", ["sent", "change_requested"])
        .in("recipient_email", part),
    ]);
    if (c.error) throw new Error(`holder lookup: ${c.error.message}`);
    if (o.error) throw new Error(`offer lookup: ${o.error.message}`);
    for (const r of c.data ?? []) holds.add(String(r.holder_email).toLowerCase());
    for (const r of o.data ?? []) offered.add(String(r.recipient_email).toLowerCase());
  }
  return { holds, offered };
}

async function create(svc: Svc, actor: string, issuerId: string, body: Body) {
  const ach = await activeAchievement(svc, issuerId, body.achievement_code);
  if (ach.status !== "active") throw new HttpError(409, `achievement is ${ach.status}, not active`);
  const rows = Array.isArray(body.recipients) ? body.recipients : [];
  if (rows.length === 0) throw new HttpError(400, "recipients required");
  if (rows.length > MAX_OFFERS_PER_CALL) {
    throw new HttpError(400, `at most ${MAX_OFFERS_PER_CALL} recipients per call`);
  }
  const awardedOn = body.awarded_on?.trim() || null;
  if (awardedOn && (!DATE_RE.test(awardedOn) || Number.isNaN(Date.parse(awardedOn)))) {
    throw new HttpError(400, "awarded_on must be YYYY-MM-DD");
  }
  const locale = offerLocale(body.locale);

  // Validate and dedupe BEFORE any write; one bad row is an outcome, not an abort.
  const invalid: { index: number; reason: "email" | "name" }[] = [];
  const skipped: { email: string; name: string; reason: string }[] = [];
  const seen = new Set<string>();
  const valid: { email: string; name: string }[] = [];
  rows.forEach((r, index) => {
    const email = String(r?.email ?? "").trim().toLowerCase();
    const name = String(r?.name ?? "").replace(/\s+/g, " ").trim();
    if (!RECIPIENT_EMAIL_RE.test(email)) return void invalid.push({ index, reason: "email" });
    if (!name || name.length > MAX_RECIPIENT_NAME) return void invalid.push({ index, reason: "name" });
    if (seen.has(email)) return void skipped.push({ email, name, reason: "duplicate_in_list" });
    seen.add(email);
    valid.push({ email, name });
  });

  const { holds, offered } = await blockedEmails(svc, ach.id, valid.map((v) => v.email));
  const toSend: { email: string; name: string; token_hash: string; confirm_url: string }[] = [];
  for (const v of valid) {
    if (holds.has(v.email)) skipped.push({ ...v, reason: "already_holds" });
    else if (offered.has(v.email)) skipped.push({ ...v, reason: "already_offered" });
    else {
      const token = newOfferToken();
      toSend.push({ ...v, token_hash: await sha256Hex(token), confirm_url: confirmUrl(locale, token) });
    }
  }

  if (toSend.length > 0) {
    // Each offer holds a slot from the moment it is sent, so the whole list must fit.
    // Soft under a concurrent send from the same partner; issue.ts still refuses past the limit.
    const allowance = await readAllowance(svc, issuerId);
    if (!allowance.enabled) throw new HttpError(403, "issuing_paused");
    if (allowance.remaining !== null && toSend.length > allowance.remaining) {
      throw new LimitError(allowance.remaining, allowance.annualCap ?? 0);
    }
    // One statement: every offer row and every email, or none (migration 388 block 6).
    const { error } = await svc.rpc("create_credential_offers", {
      p_issuer_id: issuerId,
      p_achievement_id: ach.id,
      p_created_by: actor,
      p_locale: locale,
      p_awarded_on: awardedOn,
      p_auto_minor: body.auto_minor_fixes !== false,
      p_rows: toSend,
    });
    if (error) {
      // A concurrent send raced us past blockedEmails; the open-offer index refused it, nothing was written.
      if ((error as { code?: string }).code === "23505") {
        throw new HttpError(409, "someone in this list was just sent an offer; reload and try again");
      }
      console.error("create_credential_offers failed", error);
      throw new HttpError(500, "failed to send offers");
    }
  }

  const { error: logErr } = await svc.from("admin_actions").insert({
    actor_user_id: actor,
    action: "send_credential_offers",
    target_type: "achievement",
    target_id: ach.id,
    reason: null,
    metadata: {
      issuer_id: issuerId, achievement_code: ach.code, locale, awarded_on: awardedOn,
      sent: toSend.length, skipped: skipped.length, invalid: invalid.length,
    },
  });
  if (logErr) console.warn("admin_actions log failed", logErr);

  return {
    ok: true,
    achievement: { code: ach.code, name: ach.name },
    sent: toSend.map(({ email, name }) => ({ email, name })),
    skipped,
    invalid,
  };
}

async function list(svc: Svc, issuerId: string, body: Body) {
  const ach = await activeAchievement(svc, issuerId, body.achievement_code);
  const out: unknown[] = [];
  // Paged to the end: an unpaged read is a floor (CLAUDE.md s5).
  for (let from = 0; ; from += 1000) {
    const { data, error } = await svc
      .from("credential_offers")
      .select("id, recipient_email, name_sent, name_requested, request_note, name_final, status, decline_reason, created_at, responded_at, expires_at, opened_at, reminders_sent, last_reminded_at, credentials(credential_code)")
      .eq("issuer_id", issuerId)
      .eq("achievement_id", ach.id)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) throw new Error(`offer list: ${error.message}`);
    const page = data ?? [];
    for (const r of page) {
      const cred = Array.isArray(r.credentials) ? r.credentials[0] : r.credentials;
      const expired = r.status === "sent" && Date.parse(r.expires_at) < Date.now();
      out.push({
        id: r.id,
        email: r.recipient_email,
        name_sent: r.name_sent,
        name_requested: r.name_requested,
        request_note: r.request_note,
        name_final: r.name_final,
        status: expired ? "expired" : r.status,
        decline_reason: r.decline_reason,
        created_at: r.created_at,
        responded_at: r.responded_at,
        expires_at: r.expires_at,
        opened_at: r.opened_at,
        reminders_sent: r.reminders_sent,
        last_reminded_at: r.last_reminded_at,
        credential_code: cred?.credential_code ?? null,
        email_status: null as string | null,
        link: null as string | null,
      });
    }
    if (page.length < 1000) break;
  }
  // The invitation email's fate, and the personal link for anyone still waiting (to send another way).
  const rows = out as { id: string; status: string; email_status: string | null; link: string | null }[];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const part = rows.slice(i, i + CHUNK);
    const { data, error } = await svc.from("email_queue")
      .select("dedupe_key, status, delivery_status, payload")
      .in("dedupe_key", part.map((r) => `offer-confirm:${r.id}`));
    if (error) throw new Error(`email lookup: ${error.message}`);
    const byKey = new Map((data ?? []).map((e: { dedupe_key: string }) => [e.dedupe_key, e]));
    for (const r of part) {
      const e = byKey.get(`offer-confirm:${r.id}`) as { status: string; delivery_status: string | null; payload: { confirm_url?: string } | null } | undefined;
      if (!e) continue;
      r.email_status = e.delivery_status ?? e.status;
      if (r.status === "sent") r.link = e.payload?.confirm_url ?? null;
    }
  }
  return { ok: true, achievement: { code: ach.code, name: ach.name }, offers: out };
}

async function summary(svc: Svc, issuerId: string) {
  const { data, error } = await svc.rpc("credential_offer_summary", { p_issuer_id: issuerId });
  if (error) throw new Error(`offer summary: ${error.message}`);
  const out: Record<string, unknown> = {};
  for (const r of (data ?? []) as Record<string, number | string>[]) {
    out[String(r.o_achievement_id)] = {
      waiting: r.o_waiting, opened: r.o_opened, needs_review: r.o_needs_review,
      confirmed: r.o_confirmed, declined: r.o_declined, expired: r.o_expired,
    };
  }
  return { ok: true, by_achievement: out };
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function remind(svc: Svc, actor: string, issuerId: string, body: Body) {
  const offer = await loadOffer(svc, issuerId, body.offer_id);
  const { data: row, error: rErr } = await svc.from("credential_offers")
    .select("status, expires_at, last_reminded_at").eq("id", offer.id).single();
  if (rErr) throw new Error(`offer reread: ${rErr.message}`);
  if (row.status !== "sent" || Date.parse(row.expires_at) <= Date.now()) throw new HttpError(409, "not_waiting");
  if (row.last_reminded_at && Date.now() - Date.parse(row.last_reminded_at) < DAY_MS) {
    throw new HttpError(409, "reminded_recently");
  }
  const { data: queued, error } = await svc.rpc("enqueue_offer_reminder", { p_offer_id: offer.id });
  if (error) throw new Error(`remind: ${error.message}`);
  // false: the original email bounced or cannot be found; a reminder would go nowhere.
  if (queued !== true) throw new HttpError(409, "cannot_remind");
  const { error: logErr } = await svc.from("admin_actions").insert({
    actor_user_id: actor, action: "remind_credential_offer", target_type: "credential_offer",
    target_id: offer.id, reason: null, metadata: { issuer_id: issuerId },
  });
  if (logErr) console.warn("admin_actions log failed", logErr);
  return { ok: true };
}

async function readdress(svc: Svc, actor: string, issuerId: string, body: Body) {
  const offer = await loadOffer(svc, issuerId, body.offer_id);
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!RECIPIENT_EMAIL_RE.test(email)) throw new HttpError(400, "bad_email");
  if (offer.status !== "sent") throw new HttpError(409, "not_waiting");
  // The same address is allowed only to renew an expired link; the old offer goes first.
  const same = email === String(offer.recipient_email).toLowerCase();
  if (same && Date.parse(offer.expires_at) > Date.now()) throw new HttpError(400, "same_email");
  if (!same) {
    const { holds, offered } = await blockedEmails(svc, offer.achievement_id, [email]);
    if (holds.has(email)) throw new HttpError(409, "already_holds");
    if (offered.has(email)) throw new HttpError(409, "already_offered");
  } else {
    const { error: xErr } = await svc.from("credential_offers")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", offer.id).eq("status", "sent");
    if (xErr) throw new Error(`renew: ${xErr.message}`);
  }

  // A new offer to the new address (new link, new email), then the old one is withdrawn.
  // The slot under the yearly limit moves with it, so the allowance is not re-checked.
  const token = newOfferToken();
  const locale = offerLocale(offer.locale);
  const { data: created, error } = await svc.rpc("create_credential_offers", {
    p_issuer_id: issuerId,
    p_achievement_id: offer.achievement_id,
    p_created_by: actor,
    p_locale: locale,
    p_awarded_on: offer.awarded_on,
    p_auto_minor: offer.auto_minor_fixes,
    p_rows: [{ email, name: offer.name_sent, token_hash: await sha256Hex(token), confirm_url: confirmUrl(locale, token) }],
  });
  if (error) {
    if ((error as { code?: string }).code === "23505") throw new HttpError(409, "already_offered");
    throw new Error(`readdress create: ${error.message}`);
  }
  if (!same) {
    const { error: cErr } = await svc.from("credential_offers")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", offer.id).eq("status", "sent");
    if (cErr) console.error("readdress: old offer not withdrawn", offer.id, cErr);
  }
  const { error: logErr } = await svc.from("admin_actions").insert({
    actor_user_id: actor, action: "readdress_credential_offer", target_type: "credential_offer",
    target_id: offer.id, reason: null,
    metadata: { issuer_id: issuerId, from: offer.recipient_email, to: email, new_offer_id: created?.[0]?.o_offer_id ?? null },
  });
  if (logErr) console.warn("admin_actions log failed", logErr);
  return { ok: true };
}

async function loadOffer(svc: Svc, issuerId: string, offerId: string | undefined): Promise<OfferRow> {
  if (!offerId || !UUID_RE.test(offerId)) throw new HttpError(400, "valid offer_id required");
  const { data, error } = await svc
    .from("credential_offers")
    .select(OFFER_COLUMNS)
    .eq("id", offerId)
    .eq("issuer_id", issuerId)
    .maybeSingle();
  if (error) throw new Error(`offer lookup: ${error.message}`);
  if (!data) throw new HttpError(404, "offer not found");
  return data as OfferRow;
}

async function review(svc: Svc, actor: string, issuerId: string, body: Body) {
  const offer = await loadOffer(svc, issuerId, body.offer_id);
  if (offer.status !== "change_requested" || !offer.name_requested) {
    throw new HttpError(409, "this offer has no name change waiting");
  }
  if (body.decision !== "approve" && body.decision !== "keep") {
    throw new HttpError(400, 'decision must be "approve" or "keep"');
  }
  const finalName = body.decision === "approve" ? offer.name_requested : offer.name_sent;
  const issued = await mintFromOffer(svc, offer, finalName);
  const { error: logErr } = await svc.from("admin_actions").insert({
    actor_user_id: actor,
    action: "review_credential_offer",
    target_type: "credential",
    target_id: issued.id,
    reason: null,
    metadata: {
      issuer_id: issuerId, offer_id: offer.id, decision: body.decision,
      name_sent: offer.name_sent, name_requested: offer.name_requested, name_final: finalName,
    },
  });
  if (logErr) console.warn("admin_actions log failed", logErr);
  return { ok: true, credential_code: issued.credentialCode, name_final: finalName };
}

async function cancel(svc: Svc, issuerId: string, body: Body) {
  const offer = await loadOffer(svc, issuerId, body.offer_id);
  const { data, error } = await svc
    .from("credential_offers")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", offer.id)
    .in("status", ["sent", "change_requested"])
    .select("id");
  if (error) throw new Error(`cancel: ${error.message}`);
  if (!data || data.length === 0) throw new HttpError(409, "this offer is no longer open");
  return { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);
  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();
    const body = (await req.json()) as Body;
    const issuerId = body.issuer_id?.trim();
    if (!issuerId || !UUID_RE.test(issuerId)) throw new HttpError(400, "valid issuer_id required");
    // BEFORE any read or write. Never trust a company or issuer from the body without this.
    await requireIssuerAccess(svc, actor, issuerId);

    switch (body.action) {
      case "create": return jsonResponse(await create(svc, actor, issuerId, body));
      case "list": return jsonResponse(await list(svc, issuerId, body));
      case "review": return jsonResponse(await review(svc, actor, issuerId, body));
      case "cancel": return jsonResponse(await cancel(svc, issuerId, body));
      case "allowance": return jsonResponse({ ok: true, allowance: allowanceJson(await readAllowance(svc, issuerId)) });
      case "summary": return jsonResponse(await summary(svc, issuerId));
      case "remind": return jsonResponse(await remind(svc, actor, issuerId, body));
      case "readdress": return jsonResponse(await readdress(svc, actor, issuerId, body));
      default: throw new HttpError(400, "action must be create, list, review, cancel, allowance, summary, remind or readdress");
    }
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    if (err instanceof LimitError) {
      return jsonResponse({ error: "credential_limit", remaining: err.remaining, annual_cap: err.annualCap }, 409);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
