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
  const { data, error } = await svc
    .from("profiles")
    .select("platform_role")
    .eq("id", actorId)
    .maybeSingle();

  // A DROPPED READ HERE DEMOTES AN ADMIN TO A LEARNER. This used to discard
  // `error`, which fails closed -- safe, and indistinguishable from "you are
  // not an admin", which is the reading that sends the next person to look at
  // roles that are perfectly correct. analyze-curriculum already answered 500
  // on this read before it moved behind this helper; that is preserved rather
  // than lost. It can never GRANT anything it did not grant before.
  if (error) throw new HttpError(500, `profile: ${error.message}`);

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

/* ===================================================================== */
/*  Company feature access -- the same discipline, a different subject.  */
/* ===================================================================== */

export type FeatureRole = "platform_admin" | "team_admin";

export interface CompanyFeatureAccess {
  role: FeatureRole;
  /** NULL for platform_admin, who is not scoped to a company. */
  companyId: string | null;
}

/**
 * Throw unless the caller may exercise `featureKey` on behalf of a company
 * they administer.
 *
 * ================= WHY THIS EXISTS, AND WHAT IT REPLACED =================
 *
 * analyze-curriculum's partner branch read:
 *
 *     if (!body.company_id) return 403;
 *     const granted = await rpc("company_has_feature", {
 *       p_company_id: body.company_id, ...
 *     });
 *     if (granted !== true) return 403;
 *
 * company_has_feature(company_id, feature_key) is a pure lookup over
 * company_features. IT SAYS NOTHING ABOUT WHO IS ASKING. So the check proved
 * that SOME company holds the grant, and then attributed the run to whatever
 * company id arrived in the request body. Any authenticated learner JWT plus a
 * granted company's id was a complete authorization.
 *
 * That is the shape requireIssuerAccess above exists to prevent, one table
 * over: an id from the body, compared against nothing the caller owns.
 *
 * ================= A GRANT IS NOT A MEMBERSHIP IS NOT A ROLE =============
 *
 * Three separate facts, and the old code checked only the first:
 *
 *   1. the company holds the feature      -> company_features
 *   2. the caller belongs to that company -> team_members
 *   3. the caller is its team_admin       -> team_members.role
 *
 * (3) is deliberate rather than incidental. A coverage report is commercial
 * information about a partner's own product; a learner holding a seat at a
 * granted company must not be able to pull it. Membership alone is too wide.
 *
 * ================= THE BODY'S company_id IS A SELECTOR ===================
 *
 * It is never authorization. The caller's memberships are resolved FIRST, from
 * team_members; an id in the body may only narrow that set, and naming a
 * company outside it is refused rather than ignored. Ignoring it would be worse
 * than refusing: the caller would get a report about a company they did not
 * ask about and could not tell.
 *
 * ================= WHERE THIS DIVERGES FROM issuerForActor ===============
 *
 * issuerForActor resolves a multi-company admin by earliest-joined membership,
 * and says so, to keep three surfaces answering "which company is this admin"
 * the same way. THIS ONE REFUSES TO GUESS -- an admin of more than one company
 * must name which, with a 400.
 *
 * That is not a fourth answer to the same question; it is declining to answer.
 * The reason is that the result here is PERSISTED and attributed:
 * analysis_runs.owner_company_id becomes a commercial record of which partner
 * ran which analysis. Guessing wrong on a page shows the wrong heading.
 * Guessing wrong here files a competitor analysis under the wrong customer.
 *
 * ================= NO READ IS DROPPED ====================================
 *
 * Both reads surface their error as a 500 rather than degrading to "not
 * found". Failing closed on a transient error is still closed -- but it would
 * present as a permissions bug to a paying partner, and the person debugging it
 * would go looking at grants that are perfectly fine. See READ-FAILURE-AUDIT.
 */
export async function requireCompanyFeature(
  svc: Svc,
  actorId: string,
  featureKey: string,
  requestedCompanyId?: string | null,
): Promise<CompanyFeatureAccess> {
  const role = await platformRole(svc, actorId);

  if (role === "platform_admin") {
    return { role: "platform_admin", companyId: null };
  }

  // marketing is the sales-library seat. It holds no company membership by
  // construction and would fall through to the empty-set 403 below anyway;
  // named here so the exclusion reads as a decision rather than an accident,
  // exactly as requireIssuerAccess names it.
  if (role === "marketing") {
    throw new HttpError(403, "not authorised for this company");
  }

  const { data: memberships, error: memberErr } = await svc
    .from("team_members")
    .select("company_id")
    .eq("user_id", actorId)
    .eq("role", "team_admin");

  if (memberErr) {
    throw new HttpError(500, `team_members: ${memberErr.message}`);
  }

  const adminOf = ((memberships ?? []) as { company_id: string }[]).map(
    (r) => r.company_id,
  );

  // ONE 403 FOR EVERY WAY OF NOT BEING ENTITLED. "no memberships", "not this
  // company" and "this company has no grant" are the same answer to the caller.
  // Distinguishing them tells someone who guessed a uuid whether it named a
  // real company, and whether that company buys this feature.
  const denied = () => new HttpError(403, "not authorised for this company");

  if (adminOf.length === 0) throw denied();

  let companyId: string;
  if (requestedCompanyId) {
    if (!adminOf.includes(requestedCompanyId)) throw denied();
    companyId = requestedCompanyId;
  } else if (adminOf.length === 1) {
    companyId = adminOf[0];
  } else {
    // 400, not 403. The caller IS entitled; the request is ambiguous. A 403
    // here would send an admin of two companies looking for a missing grant.
    throw new HttpError(
      400,
      "company_id is required: you administer more than one company",
    );
  }

  const { data: granted, error: grantErr } = await svc.rpc("company_has_feature", {
    p_company_id: companyId,
    p_feature_key: featureKey,
  });

  if (grantErr) {
    throw new HttpError(500, `company_has_feature: ${grantErr.message}`);
  }
  if (granted !== true) throw denied();

  return { role: "team_admin", companyId };
}
