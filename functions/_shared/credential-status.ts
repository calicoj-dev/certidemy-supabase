/**
 * supabase/functions/_shared/credential-status.ts
 *
 * ONE definition of a credential's effective public status.
 *
 * ============================== WHY THIS FILE EXISTS ======================
 *
 * This derivation has now been implemented independently three times, and one
 * of those copies was wrong in production:
 *
 *   verify-credential  computed it correctly (specimen wins, then live expiry)
 *   the verify PAGE    branched on the mapped value, so it was correct
 *   credential-og      queried `credentials.status` directly and never read
 *                      is_specimen — so every specimen rendered as ACTIVE on
 *                      its OG card, with a green dot, visually identical to a
 *                      real credential. SALES-LIBRARY-SPEC §8 names that exact
 *                      outcome a fraud vector.
 *
 * The pattern (v4.4 §2, v4.5 §3): TWO CONSUMERS, ONE DERIVED FIELD, ONE OF
 * THEM DOESN'T KNOW. The Open Badges endpoint would have been the fourth
 * implementation and the second chance to get it wrong, because it cannot call
 * verify-credential — it needs certification_id, jta_version_id and user_id,
 * which verify-credential does not select.
 *
 * So the derivation moves here and every consumer imports it. The rule stops
 * living in prose and starts living in one function.
 *
 * ============================== THE ORDERING IS DELIBERATE ================
 *
 * specimen > revoked > expired > stored status.
 *
 * A specimen is a marketing artifact whose stored status is 'active' so the
 * certificate renders through the normal path. It must NEVER read as genuine,
 * whatever else is true of it. Revocation outranks expiry because a revoked
 * credential that later expires is still revoked — the certification decision
 * was withdrawn, and "expired" would understate that.
 */

export type EffectiveStatus =
  | "active"
  | "expired"
  | "revoked"
  | "suspended"
  | "specimen";

/** The columns any consumer must select to derive status correctly. */
export const CREDENTIAL_STATUS_COLUMNS = "status, expires_at, is_specimen";

export interface StatusInput {
  status: string;
  expires_at: string | null;
  is_specimen: boolean | null;
}

export function effectiveStatus(cred: StatusInput): EffectiveStatus {
  // Specimen wins over everything. See the note above.
  if (cred.is_specimen === true) return "specimen";

  // Revocation and suspension are decisions, not lapses. They outrank expiry.
  if (cred.status === "revoked") return "revoked";
  if (cred.status === "suspended") return "suspended";

  // Expiry is evaluated LIVE, never trusted from the stored status alone —
  // nothing sweeps the table at midnight, so a stored 'active' on a lapsed
  // credential is expected, not a defect.
  const expired =
    cred.expires_at !== null && new Date(cred.expires_at).getTime() < Date.now();
  if (expired && cred.status === "active") return "expired";

  return cred.status as EffectiveStatus;
}

/**
 * Is this credential currently a genuine, standing certification decision?
 *
 * The single question verification answers. Anything but true means a badge
 * endpoint must not present it as valid.
 */
export function isValid(cred: StatusInput): boolean {
  return effectiveStatus(cred) === "active";
}

/**
 * May this credential be issued as a signed Verifiable Credential at all?
 *
 * Specimens: NO. A signed specimen is the credential-og fraud vector with a
 * cryptographic guarantee bolted on — it would verify, because it genuinely
 * was signed by Certidemy, and a machine has no way to read the amber banner
 * a human sees on the verify page.
 *
 * Revoked, suspended and expired: YES. Those are real credentials whose current
 * standing is expressed through credentialStatus and validUntil. Refusing to
 * serve them would make revocation look like deletion, which is strictly worse
 * — a verifier holding a cached copy would get a network error instead of a
 * definitive "this was revoked".
 */
export function isSignable(cred: StatusInput): boolean {
  return cred.is_specimen !== true;
}
