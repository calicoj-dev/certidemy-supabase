// POST /functions/v1/credential-offer        (verify_jwt = false: the token IS the credential)
//
// The recipient's side of confirm-before-signing (migration 388). The 256-bit token from
// their email is looked up by sha256; holding it proves they read that inbox.
//
// Body: { token, action: "view" | "confirm" | "request_name" | "decline", name?, note?, reason? }
//   confirm       mint with the name the partner sent
//   request_name  accents/case only and the partner allowed it -> mint now; else wait for the partner
//   decline       nothing is ever minted; the partner sees why
//
// POST for "view" too, so the token never sits in a query string or an access log.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient, HttpError } from "../_shared/supabase.ts";
import { MAX_RECIPIENT_NAME } from "../_shared/issue.ts";
import { isMinorNameFix, OFFER_TOKEN_RE, sha256Hex } from "../_shared/offer.ts";
import { mintFromOffer, OFFER_COLUMNS, type OfferRow } from "../_shared/offer-mint.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

const DECLINE_REASONS = new Set(["not_attended", "other_session", "not_my_email"]);

interface Body {
  token?: string;
  action?: string;
  name?: string;
  note?: string;
  reason?: string;
}

/** a***@gmail.com -- enough to recognise your own inbox, not enough to harvest it. */
function maskEmail(e: string): string {
  const [user, domain] = e.split("@");
  if (!user || !domain) return "";
  return `${user.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(6, user.length - 1)))}@${domain}`;
}

const isExpired = (o: OfferRow) => o.status === "sent" && Date.parse(o.expires_at) < Date.now();

async function view(svc: Svc, offer: OfferRow) {
  const [issuerRes, achRes, credRes] = await Promise.all([
    svc.from("issuers").select("name, site_url").eq("id", offer.issuer_id).maybeSingle(),
    svc.from("achievements")
      .select("name, achievement_type, description, criteria_narrative, image_path")
      .eq("id", offer.achievement_id).maybeSingle(),
    offer.credential_id
      ? svc.from("credentials").select("credential_code").eq("id", offer.credential_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  for (const r of [issuerRes, achRes, credRes]) if (r.error) throw new Error(r.error.message);
  const code = credRes.data?.credential_code ?? null;
  return {
    ok: true,
    offer: {
      status: isExpired(offer) ? "expired" : offer.status,
      name_sent: offer.name_sent,
      name_requested: offer.name_requested,
      awarded_on: offer.awarded_on,
      locale: offer.locale,
      email_masked: maskEmail(offer.recipient_email),
    },
    issuer: { name: issuerRes.data?.name ?? "", site_url: issuerRes.data?.site_url ?? null },
    achievement: {
      name: achRes.data?.name ?? "",
      type: achRes.data?.achievement_type ?? null,
      description: achRes.data?.description ?? null,
      criteria: achRes.data?.criteria_narrative ?? null,
      image_url: achRes.data?.image_path || null,
    },
    credential: code ? { code, verify_path: `/verify/${code}` } : null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);
  try {
    const body = (await req.json()) as Body;
    const token = String(body.token ?? "");
    // Same answer for malformed and unknown, so the endpoint is not an oracle.
    if (!OFFER_TOKEN_RE.test(token)) throw new HttpError(404, "offer not found");

    const svc = getServiceClient();
    const { data, error } = await svc
      .from("credential_offers")
      .select(OFFER_COLUMNS)
      .eq("token_hash", await sha256Hex(token))
      .maybeSingle();
    if (error) throw new Error(`offer lookup: ${error.message}`);
    if (!data) throw new HttpError(404, "offer not found");
    let offer = data as OfferRow;

    const action = body.action ?? "view";
    if (action === "view") return jsonResponse(await view(svc, offer));

    if (offer.status === "confirmed") return jsonResponse(await view(svc, offer)); // idempotent
    if (isExpired(offer)) throw new HttpError(410, "this link has expired; ask the issuer to send it again");
    if (offer.status === "declined" || offer.status === "cancelled") {
      throw new HttpError(409, "this offer is closed");
    }

    if (action === "confirm") {
      if (offer.status === "change_requested") {
        throw new HttpError(409, "your name change is waiting for the issuer");
      }
      await mintFromOffer(svc, offer, offer.name_sent);
    } else if (action === "request_name") {
      if (offer.status !== "sent") throw new HttpError(409, "your name change is already with the issuer");
      const name = String(body.name ?? "").replace(/\s+/g, " ").trim();
      const note = String(body.note ?? "").trim().slice(0, 300) || null;
      if (!name || name.length > MAX_RECIPIENT_NAME) {
        throw new HttpError(400, `name must be 1-${MAX_RECIPIENT_NAME} characters`);
      }
      if (name === offer.name_sent.trim()) {
        await mintFromOffer(svc, offer, offer.name_sent);
      } else if (offer.auto_minor_fixes && isMinorNameFix(offer.name_sent, name)) {
        await mintFromOffer(svc, offer, name);
      } else {
        const { data: upd, error: uErr } = await svc
          .from("credential_offers")
          .update({ status: "change_requested", name_requested: name, request_note: note, responded_at: new Date().toISOString() })
          .eq("id", offer.id)
          .eq("status", "sent")
          .select(OFFER_COLUMNS);
        if (uErr) throw new Error(`request_name: ${uErr.message}`);
        if (!upd || upd.length === 0) throw new HttpError(409, "this offer changed meanwhile; reload");
        offer = upd[0] as OfferRow;
      }
    } else if (action === "decline") {
      const reason = String(body.reason ?? "");
      if (!DECLINE_REASONS.has(reason)) throw new HttpError(400, "a reason is required");
      const { data: upd, error: dErr } = await svc
        .from("credential_offers")
        .update({ status: "declined", decline_reason: reason, responded_at: new Date().toISOString() })
        .eq("id", offer.id)
        .in("status", ["sent", "change_requested"])
        .select("id");
      if (dErr) throw new Error(`decline: ${dErr.message}`);
      if (!upd || upd.length === 0) throw new HttpError(409, "this offer changed meanwhile; reload");
    } else {
      throw new HttpError(400, "action must be view, confirm, request_name or decline");
    }

    // Re-read so the page renders exactly what is stored now, not what we assume happened.
    const { data: fresh, error: fErr } = await svc
      .from("credential_offers").select(OFFER_COLUMNS).eq("id", offer.id).single();
    if (fErr) throw new Error(`re-read: ${fErr.message}`);
    return jsonResponse(await view(svc, fresh as OfferRow));
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: "something went wrong" }, 500);
  }
});
