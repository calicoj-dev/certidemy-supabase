// _shared/census.ts  --  CENSUS-SHARED-v1
//
// The whole-account census: EVERY auth user, placed at exactly one funnel stage,
// with dormant / unconfirmed flags, enrollments, and usable-seat state.
//
// WHY THIS MODULE EXISTS
// ---------------------------------------------------------------------------
// This logic used to live inside list-users, and sync-to-ghl reached it by
// invoking list-users over HTTP. That could never work: sync-to-ghl needs a
// SERVICE-ROLE client (to read the Vault token), so its invoke presented a
// service-role key as the bearer token -- and list-users authenticates a USER
// JWT and rejected it with a 401. The census now lives here, in-process, and
// both callers import it. One derivation, one source of truth, no inner hop,
// no doubled cold-start, no doubled rate limit.
//
// SECURITY: nothing in this module authenticates or authorizes. It takes an
// already-built service-role client and reads freely. EVERY caller MUST gate
// (platform_admin) BEFORE calling buildCensus().
//
// Reads, each ONCE in bulk (no per-user queries, no N+1):
//   - auth.admin.listUsers()  -> email, last_sign_in_at, email_confirmed_at, created_at
//   - profiles                -> full_name, platform_role
//   - team_members            -> team_admin role
//   - credentials             -> certified (active credential), per user AND per user+cert
//   - user_certifications     -> enrollments, joined to certifications
//   - vouchers                -> usable-seat state (the money column)
//
// FUNNEL STAGE (exactly one per account, priority top-down):
//   certified        -> holds an active credential             (upsell next cert)
//   seat_unused      -> assigned voucher, attempts left, no pass (urgency: expiring seat)
//   enrolled_no_seat -> enrolled in >=1 cert, no usable voucher  (conversion: promo target)
//   never_activated  -> account exists, zero enrollments         (activation)
//
// Independent flags: dormant (no activity in 30d), emailConfirmed.

import { getServiceClient } from "./supabase.ts";

/** The service-role client type, derived so we need no extra type imports. */
export type ServiceClient = ReturnType<typeof getServiceClient>;

export const DORMANT_DAYS = 30;

export type Stage =
  | "certified"
  | "seat_unused"
  | "enrolled_no_seat"
  | "never_activated";

export interface Enrollment {
  code: string;
  name: string;
  source: string; // self | voucher | seat | admin
  status: string; // active | archived | completed
  certified: boolean; // holds an active credential for THIS cert
}

export interface CensusUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string; // learner | team_admin | platform_admin
  createdAt: string | null;
  lastActiveAt: string | null;
  emailConfirmed: boolean;
  dormant: boolean;
  stage: Stage;
  enrollments: Enrollment[];
  // voucher-derived flags for the stage / segments
  hasUsableSeat: boolean;
  seatDaysRemaining: number | null; // soonest-expiring usable seat
}

export interface CensusSummary {
  total: number;
  certified: number;
  seatUnused: number;
  enrolledNoSeat: number;
  neverActivated: number;
  dormant: number;
  unconfirmed: number;
}

export interface Census {
  users: CensusUser[];
  summary: CensusSummary;
}

/** Sentinel for `.in()` when the id list is empty (PostgREST rejects an empty IN). */
const NO_MATCH = "00000000-0000-0000-0000-000000000000";

/**
 * Build the full account census.
 *
 * @param svc  A service-role Supabase client. CALLER MUST HAVE AUTHORIZED.
 */
export async function buildCensus(svc: ServiceClient): Promise<Census> {
  // --- 1. auth.users via the admin API (paginated) -------------------------
  // Gives email, last_sign_in_at, email_confirmed_at, created_at. The PostgREST
  // client can't read the auth schema directly; the admin API is the route.
  type AuthUser = {
    id: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    confirmed_at?: string | null;
    /** Present at runtime; the batch is cast through unknown. */
    user_metadata?: { service_account?: boolean } | null;
  };

  const authUsers: AuthUser[] = [];
  let page = 1;
  const perPage = 1000;
  // Stop after a sane number of pages; 50k accounts is far beyond current scale.
  for (let i = 0; i < 50; i++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth.admin.listUsers: ${error.message}`);
    const batch = (data?.users ?? []) as unknown as AuthUser[];
    // Service accounts are not people. specimen@certidemy.com owns the
    // marketing specimen credentials because credentials.user_id is NOT
    // NULL; it is not a learner and must not reach the funnel. This census
    // also feeds sync-to-ghl, so without this filter the account would be
    // pushed to the CRM as a contact.
    //
    // Applied after batch.length is read below, so pagination is unaffected.
    authUsers.push(
      ...batch.filter((u) => u.user_metadata?.service_account !== true),
    );
    if (batch.length < perPage) break;
    page++;
  }

  const userIds = authUsers.map((u) => u.id);
  const idFilter = userIds.length > 0 ? userIds : [NO_MATCH];

  // --- 2. profiles (name + role) -------------------------------------------
  const profileById = new Map<
    string,
    { full_name: string | null; platform_role: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profiles, error } = await svc
      .from("profiles")
      .select("id, full_name, platform_role")
      .in("id", userIds);
    if (error) throw new Error(`profiles: ${error.message}`);
    for (const p of (profiles ?? []) as {
      id: string;
      full_name: string | null;
      platform_role: string | null;
    }[]) {
      profileById.set(p.id, {
        full_name: p.full_name,
        platform_role: p.platform_role,
      });
    }
  }

  // team_admins: users who hold a team_admin membership (role column).
  const teamAdminIds = new Set<string>();
  {
    const { data: tm, error } = await svc
      .from("team_members")
      .select("user_id, role")
      .eq("role", "team_admin");
    if (error) throw new Error(`team_members: ${error.message}`);
    for (const r of (tm ?? []) as { user_id: string; role: string }[]) {
      teamAdminIds.add(r.user_id);
    }
  }

  // --- 3. certified: active credentials, keyed by user AND by user+cert -----
  // certifiedIds answers "certified in anything" (drives the account stage);
  // certifiedUserCert answers "certified in THIS cert" (greens the matching
  // enrollment chip, so a person certified in one cert but studying others
  // still shows their in-progress work). Built BEFORE enrollments, so each
  // enrollment can be tagged as it's assembled.
  const certifiedIds = new Set<string>();
  const certifiedUserCert = new Set<string>(); // key: `${user_id}|${CERT_CODE}`
  {
    const { data: creds, error } = await svc
      .from("v_credentials_real")
      .select("user_id, status, certification_code")
      .eq("status", "active")
      .in("user_id", idFilter);
    if (error) throw new Error(`credentials: ${error.message}`);
    for (const c of (creds ?? []) as {
      user_id: string;
      status: string;
      certification_code: string | null;
    }[]) {
      certifiedIds.add(c.user_id);
      if (c.certification_code) {
        certifiedUserCert.add(
          `${c.user_id}|${c.certification_code.toUpperCase()}`,
        );
      }
    }
  }

  // --- 4. enrollments (user_certifications + cert code/name) ----------------
  const enrollmentsByUser = new Map<string, Enrollment[]>();
  {
    const { data: ucs, error } = await svc
      .from("user_certifications")
      .select("user_id, source, status, certifications(code, name)")
      .in("user_id", idFilter);
    if (error) throw new Error(`user_certifications: ${error.message}`);
    for (const r of (ucs ?? []) as unknown as {
      user_id: string;
      source: string;
      status: string;
      certifications: { code: string; name: string } | null;
    }[]) {
      if (!r.certifications) continue; // cert hard-deleted; skip nameless row
      const list = enrollmentsByUser.get(r.user_id) ?? [];
      list.push({
        code: r.certifications.code,
        name: r.certifications.name,
        source: r.source,
        status: r.status,
        certified: certifiedUserCert.has(
          `${r.user_id}|${r.certifications.code.toUpperCase()}`,
        ),
      });
      enrollmentsByUser.set(r.user_id, list);
    }
  }

  // --- 5. usable-seat state from vouchers -----------------------------------
  // "Usable" = assigned, not revoked, attempts remaining, not past expiry.
  // We don't resolve batch allowance here (that's getEligibility's job for the
  // exact count) -- for the census a seat with attempts_used < attempts_allowed
  // OR a null allowance counts as usable. attempts_allowed null = inherit; we
  // treat null-allowance assigned seats as usable (they gate at exam time).
  const nowMs = Date.now();
  const usableByUser = new Map<string, { daysRemaining: number | null }>();
  {
    const { data: vs, error } = await svc
      .from("vouchers")
      .select(
        "assigned_user_id, status, attempts_allowed, attempts_used, expires_at",
      )
      .in("assigned_user_id", idFilter)
      .eq("status", "assigned");
    if (error) throw new Error(`vouchers: ${error.message}`);
    for (const v of (vs ?? []) as {
      assigned_user_id: string | null;
      status: string;
      attempts_allowed: number | null;
      attempts_used: number | null;
      expires_at: string | null;
    }[]) {
      if (!v.assigned_user_id) continue;
      // expiry gate
      if (v.expires_at && new Date(v.expires_at).getTime() < nowMs) continue;
      // attempts gate: null allowance = usable; else needs remaining > 0
      const used = v.attempts_used ?? 0;
      const usable = v.attempts_allowed == null || used < v.attempts_allowed;
      if (!usable) continue;
      const days = v.expires_at != null
        ? Math.max(
          0,
          Math.floor((new Date(v.expires_at).getTime() - nowMs) / 86400000),
        )
        : null;
      const prev = usableByUser.get(v.assigned_user_id);
      // keep the SOONEST-expiring usable seat (the urgency signal)
      if (!prev) {
        usableByUser.set(v.assigned_user_id, { daysRemaining: days });
      } else if (
        days != null &&
        (prev.daysRemaining == null || days < prev.daysRemaining)
      ) {
        usableByUser.set(v.assigned_user_id, { daysRemaining: days });
      }
    }
  }

  // --- 6. real last-activity (v_user_last_activity) --------------------------
  // auth.users.last_sign_in_at only moves on a FRESH sign-in. A session that
  // keeps refreshing never rewrites it, so a daily user read as dormant --
  // and `dormant` is the audience an operator emails or pushes to the CRM.
  //
  // The view unions every table that records a human touching the product:
  // quiz attempts, exam submissions, FSRS reviews, lesson progress and tutor
  // chat. Users with no activity are ABSENT from it, not null, so "never did
  // anything" stays distinguishable from "did something at an unknown time".
  const activityByUser = new Map<string, string>();
  {
    const { data: acts, error } = await svc
      .from("v_user_last_activity")
      .select("user_id, last_activity_at")
      .in("user_id", idFilter);
    if (error) throw new Error(`v_user_last_activity: ${error.message}`);
    for (const a of (acts ?? []) as {
      user_id: string;
      last_activity_at: string | null;
    }[]) {
      if (a.last_activity_at) activityByUser.set(a.user_id, a.last_activity_at);
    }
  }

  // --- Assemble --------------------------------------------------------------
  const dormantCutoff = nowMs - DORMANT_DAYS * 86400000;

  const users: CensusUser[] = authUsers.map((u) => {
    const prof = profileById.get(u.id);
    const enrollments = enrollmentsByUser.get(u.id) ?? [];
    const usable = usableByUser.get(u.id);
    const hasUsableSeat = !!usable;
    const certified = certifiedIds.has(u.id);

    const stage: Stage = certified
      ? "certified"
      : hasUsableSeat
      ? "seat_unused"
      : enrollments.length > 0
      ? "enrolled_no_seat"
      : "never_activated";

    const role = prof?.platform_role === "platform_admin"
      ? "platform_admin"
      : teamAdminIds.has(u.id)
      ? "team_admin"
      : "learner";

    // LAST ACTIVE is the LATER of real activity and a fresh sign-in.
    //
    // Neither alone is right. Activity alone marks someone dormant who signed
    // in this morning but has not studied in a fortnight; sign-in alone was
    // the original bug. Both were observed in the same ten rows of live data.
    const activityAt = activityByUser.get(u.id) ?? null;
    const signInAt = u.last_sign_in_at ?? null;
    const lastActive = activityAt != null && signInAt != null
      ? (new Date(activityAt).getTime() >= new Date(signInAt).getTime()
        ? activityAt
        : signInAt)
      : (activityAt ?? signInAt);
    const dormant = lastActive != null
      ? new Date(lastActive).getTime() < dormantCutoff
      // never signed in at all counts as dormant for re-engagement
      : true;

    return {
      id: u.id,
      email: u.email,
      fullName: prof?.full_name ?? null,
      role,
      createdAt: u.created_at ?? null,
      lastActiveAt: lastActive,
      emailConfirmed: !!(u.email_confirmed_at ?? u.confirmed_at),
      dormant,
      stage,
      enrollments,
      hasUsableSeat,
      seatDaysRemaining: usable?.daysRemaining ?? null,
    };
  });

  const summary: CensusSummary = {
    total: users.length,
    certified: users.filter((u) => u.stage === "certified").length,
    seatUnused: users.filter((u) => u.stage === "seat_unused").length,
    enrolledNoSeat: users.filter((u) => u.stage === "enrolled_no_seat").length,
    neverActivated: users.filter((u) => u.stage === "never_activated").length,
    dormant: users.filter((u) => u.dormant).length,
    unconfirmed: users.filter((u) => !u.emailConfirmed).length,
  };

  return { users, summary };
}
