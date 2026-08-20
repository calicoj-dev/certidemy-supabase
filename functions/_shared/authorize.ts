/**
 * supabase/functions/_shared/authorize.ts
 *
 * Who may act on an issuer.
 *
 * ============================== WHY ONE IMPLEMENTATION ====================
 *
 * Three edge functions need the same question answered: "is this caller
 * allowed to touch this issuer?" Three copies of that check is three chances
 * for them to disagree, and the one that drifts is the one nobody tests.
 *
 * lib/console/access.ts already answers the same question on the web side, and
 * this deliberately mirrors its precedence: platform_admin first, then
 * team_admin scoped to ONE company. If those two ever disagree, the console
 * will show a partner a page whose buttons all fail, which is worse than not
 * showing the page.
 *
 * ============================== SCOPED, NOT GLOBAL ========================
 *
 * team_admin is NOT "an admin of some company". It is an admin of THE company
 * that owns THIS issuer. A partner admin at company A must not be able to
 * mint an API key for company B's issuer, and the only thing standing between
 * those two facts is that this function compares issuers.company_id against
 * the caller's memberships rather than merely checking that they hold the role
 * somewhere.
 *
 * ============================== WHAT STAYS ADMIN-ONLY =====================
 *
 * This helper is NOT used by create-partner-issuer or activate-partner-issuer.
 * Activation mints a signing key and burns a permanent public slug -- that is
 * Certidemy admitting an organisation to the OB3 namespace, not a self-service
 * action. A partner requests; a platform admin activates. Those two keep their
 * own inline platform_admin check precisely so this file cannot loosen them by
 * accident.
 */

import { HttpError } from "./supabase.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

export type IssuerRole = "platform_admin" | "team_admin";

export interface IssuerAccess {
  role: IssuerRole;
  /** NULL for platform_admin, who is not scoped to a company. */
  companyId: string | null;
}

/**
 * Resolve the caller's platform role. Returns null for a plain learner.
 *
 * Separated because two callers need the role WITHOUT an issuer in hand --
 * listing issuers, for instance, where the answer shapes the query rather than
 * gating it.
 */
export async function platformRole(
  svc: Svc,
  actorId: string,
): Promise<string | null> {
  const { data } = await svc
    .from("profiles")
    .select("platform_role")
    .eq("id", actorId)
    .maybeSingle();
  return (data as { platform_role?: string } | null)?.platform_role ?? null;
}

/**
 * Throw unless the caller may act on this issuer.
 *
 * THROWS RATHER THAN RETURNING A BOOLEAN. A boolean invites `if (ok) { ... }`
 * with no else, and the failure mode of a forgotten else is silent
 * authorisation. An HttpError cannot be forgotten.
 *
 * The 403 message is identical for "no role at all" and "wrong company". A
 * caller learning WHICH of those applied learns whether an issuer id they
 * guessed exists.
 */
export async function requireIssuerAccess(
  svc: Svc,
  actorId: string,
  issuerId: string,
): Promise<IssuerAccess> {
  const role = await platformRole(svc, actorId);

  if (role === "platform_admin") {
    return { role: "platform_admin", companyId: null };
  }

  // marketing is the sales-library seat and deliberately holds no issuing
  // power. Named here so it is clear the omission is a decision, not an
  // oversight: a rep must never be able to mint a key.
  if (role === "marketing") {
    throw new HttpError(403, "not authorised for this issuer");
  }

  const { data: issuer } = await svc
    .from("issuers")
    .select("id, company_id")
    .eq("id", issuerId)
    .maybeSingle();

  const companyId = (issuer as { company_id?: string } | null)?.company_id ?? null;

  // An issuer with no company cannot be reached by any team_admin. That is the
  // certidemy issuer itself, which belongs to no partner.
  if (!companyId) {
    throw new HttpError(403, "not authorised for this issuer");
  }

  const { data: membership } = await svc
    .from("team_members")
    .select("company_id, role")
    .eq("user_id", actorId)
    .eq("company_id", companyId)
    .eq("role", "team_admin")
    .maybeSingle();

  if (!membership) {
    throw new HttpError(403, "not authorised for this issuer");
  }

  return { role: "team_admin", companyId };
}

/**
 * The issuer a team_admin owns, or null.
 *
 * For pages and endpoints that start from the CALLER rather than from an
 * issuer id -- "show me my issuer" -- where there is nothing yet to authorise
 * against.
 */
export async function issuerForActor(
  svc: Svc,
  actorId: string,
): Promise<string | null> {
  const { data: memberships } = await svc
    .from("team_members")
    .select("company_id, joined_at")
    .eq("user_id", actorId)
    .eq("role", "team_admin")
    .order("joined_at", { ascending: true });

  const rows = (memberships ?? []) as { company_id: string }[];
  if (rows.length === 0) return null;

  // Earliest-joined admin membership wins, mirroring loadConsoleAccess and
  // loadTeamContext. Three places resolving "which company is this admin"
  // differently would be three different answers for one person.
  const { data: issuer } = await svc
    .from("issuers")
    .select("id")
    .eq("company_id", rows[0].company_id)
    .maybeSingle();

  return (issuer as { id?: string } | null)?.id ?? null;
}
