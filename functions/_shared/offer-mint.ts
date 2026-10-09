/**
 * supabase/functions/_shared/offer-mint.ts -- the ONE place an offer becomes a credential.
 *
 * Both callers (credential-offer: the recipient confirms; manage-credential-offers: the
 * partner settles a name change) go through here, so they cannot drift. The mint itself
 * is _shared/issue.ts, unchanged; "offer:<id>" makes it idempotent across double clicks.
 */
import { HttpError } from "./supabase.ts";
import { IssueError, issueCredential, type IssuedCredential } from "./issue.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

export interface OfferRow {
  id: string;
  issuer_id: string;
  achievement_id: string;
  recipient_email: string;
  name_sent: string;
  name_requested: string | null;
  name_final: string | null;
  status: string;
  awarded_on: string | null;
  auto_minor_fixes: boolean;
  locale: string;
  expires_at: string;
  credential_id: string | null;
}

export const OFFER_COLUMNS =
  "id, issuer_id, achievement_id, recipient_email, name_sent, name_requested, name_final, status, awarded_on, auto_minor_fixes, locale, expires_at, credential_id";

export async function mintFromOffer(
  svc: Svc,
  offer: OfferRow,
  finalName: string,
): Promise<IssuedCredential> {
  const { data: ach, error: aErr } = await svc
    .from("achievements")
    .select("code")
    .eq("id", offer.achievement_id)
    .maybeSingle();
  if (aErr) throw new Error(`achievement lookup: ${aErr.message}`);
  if (!ach) throw new HttpError(404, "achievement not found");

  let issued: IssuedCredential;
  try {
    issued = await issueCredential(svc, {
      issuerId: offer.issuer_id,
      achievementCode: ach.code,
      recipientEmail: offer.recipient_email,
      recipientName: finalName,
      // The class date, at midday UTC so no timezone moves it to the day before.
      issuedAt: offer.awarded_on ? `${offer.awarded_on}T12:00:00Z` : null,
      idempotencyKey: `offer:${offer.id}`,
    });
  } catch (err) {
    if (!(err instanceof IssueError)) throw err;
    if (err.kind === "achievement_not_active") {
      throw new HttpError(409, "this course is no longer active, so nothing can be issued from it");
    }
    if (err.kind === "achievement_not_found" || err.kind === "issuer_not_found") {
      throw new HttpError(404, err.message);
    }
    console.error("offer mint failed", err.kind, err.detail);
    throw new HttpError(500, "failed to issue credential");
  }

  // Marks the offer confirmed and queues the "it's yours" email, atomically (migration 388).
  const { error: cErr } = await svc.rpc("confirm_credential_offer", {
    p_offer_id: offer.id,
    p_credential_id: issued.id,
    p_final_name: finalName,
  });
  if (cErr) {
    // The credential exists; a retry re-runs the mint as a no-op (idempotency key) and lands here again.
    console.error("confirm_credential_offer failed", cErr);
    throw new HttpError(500, "issued, but the offer could not be marked confirmed; retry");
  }
  return issued;
}
