// POST /functions/v1/list-users
//
// Body: { } (no params -- returns the full account census)
// Auth: Bearer JWT -- MUST be a platform_admin.
//
// The whole-user census for the admin console: EVERY account, not just the ones
// a partner manages. Built for growth/retention -- each account is placed at a
// funnel stage and tagged dormant / unconfirmed so a marketer can segment and
// export an audience.
//
// Sibling of list-credentials: same admin-gated service-client pattern. It joins
// four sources, each read ONCE in bulk (no per-user queries):
//   - auth.admin.listUsers()   -> email, last_sign_in_at, email_confirmed_at, created_at
//   - profiles                 -> full_name, platform_role
//   - user_certifications      -> enrollments (+ source), joined to certifications
//   - vouchers                 -> usable-seat state (the money column)
//   - credentials              -> certified (active credential)
//
// FUNNEL STAGE (exactly one per account, priority top-down):
//   certified        -> holds an active credential            (upsell next cert)
//   seat_unused      -> assigned voucher, attempts left, no pass (urgency: expiring seat)
//   enrolled_no_seat -> enrolled in >=1 cert, no usable voucher (conversion: promo target)
//   never_activated  -> account exists, zero enrollments        (activation)
//
// Independent flags: dormant (no activity in 30d), email_confirmed.
//
// Everything is derived server-side so the client just renders + filters.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

const DORMANT_DAYS = 30;

type Stage = "certified" | "seat_unused" | "enrolled_no_seat" | "never_activated";

interface Enrollment {
  code: string;
  name: string;
  source: string; // self | voucher | seat | admin
  status: string; // active | archived | completed
}

interface CensusUser {
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    // --- Authorize: caller must be platform_admin --------------------------
    const actorId = await authenticate(req);
    const svc = getServiceClient();
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actorId)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    // --- 1. auth.users via the admin API (paginated) -----------------------
    // Gives email, last_sign_in_at, email_confirmed_at, created_at. The PostgREST
    // client can't read the auth schema directly; the admin API is the route.
    type AuthUser = {
      id: string;
      email: string | null;
      created_at: string | null;
      last_sign_in_at: string | null;
      email_confirmed_at: string | null;
      confirmed_at?: string | null;
    };
    const authUsers: AuthUser[] = [];
    let page = 1;
    const perPage = 1000;
    // Stop after a sane number of pages; 50k accounts is far beyond current scale.
    for (let i = 0; i < 50; i++) {
      const { data, error } = await svc.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`auth.admin.listUsers: ${error.message}`);
      const batch = (data?.users ?? []) as unknown as AuthUser[];
      authUsers.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    const userIds = authUsers.map((u) => u.id);

    // --- 2. profiles (name + role) -----------------------------------------
    const profileById = new Map<string, { full_name: string | null; platform_role: string | null }>();
    if (userIds.length > 0) {
      const { data: profiles } = await svc
        .from("profiles")
        .select("id, full_name, platform_role")
        .in("id", userIds);
      for (const p of (profiles ?? []) as {
        id: string;
        full_name: string | null;
        platform_role: string | null;
      }[]) {
        profileById.set(p.id, { full_name: p.full_name, platform_role: p.platform_role });
      }
    }

    // team_admins: users who hold a team_admin membership (role column).
    const teamAdminIds = new Set<string>();
    {
      const { data: tm } = await svc
        .from("team_members")
        .select("user_id, role")
        .eq("role", "team_admin");
      for (const r of (tm ?? []) as { user_id: string; role: string }[]) {
        teamAdminIds.add(r.user_id);
      }
    }

    // --- 3. enrollments (user_certifications + cert code/name) --------------
    const enrollmentsByUser = new Map<string, Enrollment[]>();
    {
      const { data: ucs } = await svc
        .from("user_certifications")
        .select("user_id, source, status, certifications(code, name)")
        .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
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
        });
        enrollmentsByUser.set(r.user_id, list);
      }
    }

    // --- 4. usable-seat state from vouchers ---------------------------------
    // "Usable" = assigned, not revoked, attempts remaining, not past expiry.
    // We don't resolve batch allowance here (that's getEligibility's job for the
    // exact count) -- for the census a seat with attempts_used < attempts_allowed
    // OR a null allowance counts as usable. attempts_allowed null = inherit; we
    // treat null-allowance assigned seats as usable (they gate at exam time).
    const nowMs = Date.now();
    const usableByUser = new Map<string, { daysRemaining: number | null }>();
    {
      const { data: vs } = await svc
        .from("vouchers")
        .select("assigned_user_id, status, attempts_allowed, attempts_used, expires_at")
        .in("assigned_user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])
        .eq("status", "assigned");
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
        const days =
          v.expires_at != null
            ? Math.max(0, Math.floor((new Date(v.expires_at).getTime() - nowMs) / 86400000))
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

    // --- 5. certified: users with an active credential ---------------------
    const certifiedIds = new Set<string>();
    {
      const { data: creds } = await svc
        .from("credentials")
        .select("user_id, status")
        .eq("status", "active")
        .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      for (const c of (creds ?? []) as { user_id: string; status: string }[]) {
        certifiedIds.add(c.user_id);
      }
    }

    // --- Assemble the census -----------------------------------------------
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

      const role =
        prof?.platform_role === "platform_admin"
          ? "platform_admin"
          : teamAdminIds.has(u.id)
            ? "team_admin"
            : "learner";

      const lastActive = u.last_sign_in_at ?? null;
      const dormant =
        lastActive != null
          ? new Date(lastActive).getTime() < dormantCutoff
          : // never signed in at all counts as dormant for re-engagement
            true;

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

    // Summary funnel counts for the strip.
    const summary = {
      total: users.length,
      certified: users.filter((u) => u.stage === "certified").length,
      seatUnused: users.filter((u) => u.stage === "seat_unused").length,
      enrolledNoSeat: users.filter((u) => u.stage === "enrolled_no_seat").length,
      neverActivated: users.filter((u) => u.stage === "never_activated").length,
      dormant: users.filter((u) => u.dormant).length,
      unconfirmed: users.filter((u) => !u.emailConfirmed).length,
    };

    return jsonResponse({ users, summary });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
