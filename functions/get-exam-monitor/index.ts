// POST /functions/v1/get-exam-monitor
//
// Body: { certification_id?: string, recent_limit?: number }
// Auth: Bearer JWT — MUST be platform_admin.
//
// The live examination monitor: what is happening right now, per certification,
// plus recently completed attempts and 24-hour totals. Designed to be polled.
//
// ============================================================================
// CONDUCT, NOT CONTENT — READ BEFORE ADDING FIELDS
// ============================================================================
//
// This returns progress, pace, timing spread, idle time and integrity flags. It
// does NOT return which options a candidate selected, and it should not be
// extended to.
//
// Two reasons, and the second is the practical one:
//
//   A live feed of someone's answers appearing one by one is a privacy surface
//   with no operational purpose. ISO/IEC 17024 asks a body to monitor
//   examination CONDUCT; it does not ask anyone to watch people think.
//
//   Pace is the signal that actually tells you something. Uniform four-second
//   responses at high accuracy is pre-knowledge. A 1s-to-84s spread across a
//   form is someone reading and reasoning. Neither of those is visible in the
//   answer selections, and both are visible here.
//
// Answer selections belong in the post-hoc review surface, where an appeal or a
// fraud investigation would examine a specific attempt with a specific reason.
// Different question, different audience, different access.
//
// ============================================================================
// WHY POLLING AND NOT SUPABASE REALTIME
// ============================================================================
//
// Realtime respects RLS, and exam_session_items has RLS enabled with NO policies
// deliberately — those rows describe form composition, and across sessions they
// describe the item bank. A browser subscription would need a policy that
// weakens that, permanently, so a dashboard could refresh a little faster.
//
// A service-role function polled every 3–5s is indistinguishable for a
// monitoring view and keeps the item bank unreachable from any client. Slightly
// less elegant, considerably more defensible.
//
// ============================================================================
// PLATFORM ADMIN ONLY
// ============================================================================
//
// Not marketing. The sales library is marketing's surface; live candidate
// activity is not. An exam in progress with a named holder is operational data
// about a person mid-assessment.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

/** Matches score-mock-exam and get-active-exam-session. */
const LATE_GRACE_SECONDS = 60;
const DEFAULT_RECENT_LIMIT = 20;
const MAX_RECENT_LIMIT = 100;

interface Body {
  certification_id?: string;
  recent_limit?: number;
}

/** Median of a numeric array. Returns null for empty. */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actor_user_id = await authenticate(req);
    const body = (await req.json().catch(() => ({}))) as Body;
    const svc = getServiceClient();
    const now = new Date();

    // ---- authorize ------------------------------------------------------
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();

    if (actorProfile?.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const recent_limit = Math.min(
      Math.max(1, body.recent_limit ?? DEFAULT_RECENT_LIMIT),
      MAX_RECENT_LIMIT,
    );

    // ---- certifications map --------------------------------------------
    const { data: certRows } = await svc
      .from("certifications")
      .select("id, code, name, exam_duration_minutes, passing_score_pct");

    const certById = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (certRows ?? []).map((c: any) => [c.id, c]),
    );

    // ---- open sessions --------------------------------------------------
    let openQ = svc
      .from("quiz_sessions")
      .select("id, user_id, certification_id, kind, started_at, voucher_id")
      .is("completed_at", null)
      .in("kind", ["mock_exam", "certification_exam"])
      .order("started_at", { ascending: false });

    if (body.certification_id) openQ = openQ.eq("certification_id", body.certification_id);

    const { data: openRows, error: oErr } = await openQ;
    if (oErr) throw new Error(`open sessions: ${oErr.message}`);

    const open = openRows ?? [];

    // Only sessions with a recorded form can be monitored — a pre-migration-163
    // session has no items to report on. They are counted separately rather than
    // hidden, because an unexplained gap in a monitoring view is worse than a
    // number with a label.
    const openIds = open.map((s) => s.id as string);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let itemRows: any[] = [];
    if (openIds.length > 0) {
      const { data, error } = await svc
        .from("exam_session_items")
        .select("session_id, user_answer, time_taken_seconds, marked_for_review, answered_at")
        .in("session_id", openIds);
      if (error) throw new Error(`session items: ${error.message}`);
      itemRows = data ?? [];
    }

    // Reduce in memory: few live sessions, one round trip.
    const agg = new Map<
      string,
      {
        form_size: number;
        answered: number;
        marked: number;
        times: number[];
        last_activity_at: string | null;
      }
    >();
    for (const r of itemRows) {
      const sid = r.session_id as string;
      if (!agg.has(sid)) {
        agg.set(sid, { form_size: 0, answered: 0, marked: 0, times: [], last_activity_at: null });
      }
      const a = agg.get(sid)!;
      a.form_size += 1;
      if (r.user_answer !== null && r.user_answer !== undefined) a.answered += 1;
      if (r.marked_for_review === true) a.marked += 1;
      if (typeof r.time_taken_seconds === "number") a.times.push(r.time_taken_seconds);
      if (r.answered_at && (!a.last_activity_at || r.answered_at > a.last_activity_at)) {
        a.last_activity_at = r.answered_at as string;
      }
    }

    // Candidate identity. platform_admin can already see users in the console,
    // so the email is shown rather than masked — a monitor that says "someone"
    // cannot be acted on.
    const emailById = new Map<string, string>();
    for (const uid of new Set(open.map((s) => s.user_id as string))) {
      try {
        const { data } = await svc.auth.admin.getUserById(uid);
        emailById.set(uid, data?.user?.email ?? uid);
      } catch {
        emailById.set(uid, uid);
      }
    }

    const live: unknown[] = [];
    let unmonitorable = 0;

    for (const s of open) {
      const a = agg.get(s.id as string);
      if (!a || a.form_size === 0) {
        unmonitorable += 1;
        continue;
      }
      const cert = certById.get(s.certification_id);
      const duration_minutes = cert?.exam_duration_minutes ?? 60;
      const elapsed = Math.floor(
        (now.getTime() - new Date(s.started_at as string).getTime()) / 1000,
      );
      const seconds_remaining = duration_minutes * 60 - elapsed;
      const expired = seconds_remaining < -LATE_GRACE_SECONDS;

      live.push({
        session_id: s.id,
        kind: s.kind,
        certification_id: s.certification_id,
        certification_code: cert?.code ?? null,
        certification_name: cert?.name ?? null,
        candidate: emailById.get(s.user_id as string) ?? null,
        started_at: s.started_at,
        duration_minutes,
        elapsed_seconds: elapsed,
        seconds_remaining: Math.max(0, seconds_remaining),
        // An expired session still sitting open is awaiting finalisation, which
        // happens on the candidate's next authenticated request. Surfaced so it
        // reads as "pending close" rather than "still working".
        expired,
        form_size: a.form_size,
        answered: a.answered,
        unanswered: a.form_size - a.answered,
        marked_for_review: a.marked,
        progress_pct: Math.round((a.answered / a.form_size) * 100),
        // Pace. The interesting number is the SPREAD: a flat line at a few
        // seconds per item with high accuracy is pre-knowledge; a wide spread is
        // someone reading and reasoning.
        pace_seconds_median: median(a.times),
        fastest_item_seconds: a.times.length ? Math.min(...a.times) : null,
        slowest_item_seconds: a.times.length ? Math.max(...a.times) : null,
        last_activity_at: a.last_activity_at,
        idle_seconds: a.last_activity_at
          ? Math.floor((now.getTime() - new Date(a.last_activity_at).getTime()) / 1000)
          : null,
      });
    }

    // ---- recently completed --------------------------------------------
    let recentQ = svc
      .from("quiz_sessions")
      .select("id, user_id, certification_id, kind, started_at, completed_at, score_pct, passed")
      .not("completed_at", "is", null)
      .in("kind", ["mock_exam", "certification_exam"])
      .order("completed_at", { ascending: false })
      .limit(recent_limit);

    if (body.certification_id) recentQ = recentQ.eq("certification_id", body.certification_id);

    const { data: recentRows } = await recentQ;
    const recentSessions = recentRows ?? [];

    // integrity_flags live on exam_attempts, so only certification exams have
    // them. Fetched in one query for the recent window.
    const recentIds = recentSessions.map((r) => r.id as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attemptBySession = new Map<string, any>();
    if (recentIds.length > 0) {
      const { data: attempts } = await svc
        .from("exam_attempts")
        .select("session_id, score_pct, passed, total_questions, correct_answers, duration_seconds, late_submission, integrity_flags, submitted_at")
        .in("session_id", recentIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const a of (attempts ?? []) as any[]) attemptBySession.set(a.session_id, a);
    }

    const recent = recentSessions.map((r) => {
      const cert = certById.get(r.certification_id);
      const attempt = attemptBySession.get(r.id as string);
      return {
        session_id: r.id,
        kind: r.kind,
        certification_code: cert?.code ?? null,
        started_at: r.started_at,
        completed_at: r.completed_at,
        score_pct: r.score_pct === null ? null : Number(r.score_pct),
        passed: r.passed,
        // Null for a session closed without scoring — the pre-163 cleanup case.
        scored: r.score_pct !== null,
        total_questions: attempt?.total_questions ?? null,
        late_submission: attempt?.late_submission ?? null,
        integrity_flags: attempt?.integrity_flags ?? null,
      };
    });

    // ---- 24-hour totals -------------------------------------------------
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dayRows } = await svc
      .from("quiz_sessions")
      .select("certification_id, kind, score_pct, passed")
      .not("completed_at", "is", null)
      .gte("completed_at", since)
      .in("kind", ["mock_exam", "certification_exam"]);

    const day = dayRows ?? [];
    const scoredDay = day.filter((d) => d.score_pct !== null);
    const certExamsDay = day.filter((d) => d.kind === "certification_exam");

    const byCert = new Map<string, { code: string; live: number; completed_24h: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const l of live as any[]) {
      const key = l.certification_code ?? "—";
      if (!byCert.has(key)) byCert.set(key, { code: key, live: 0, completed_24h: 0 });
      byCert.get(key)!.live += 1;
    }
    for (const d of day) {
      const code = certById.get(d.certification_id)?.code ?? "—";
      if (!byCert.has(code)) byCert.set(code, { code, live: 0, completed_24h: 0 });
      byCert.get(code)!.completed_24h += 1;
    }

    return jsonResponse({
      generated_at: now.toISOString(),
      live,
      recent,
      totals: {
        live_count: live.length,
        // Open sessions with no recorded form: cannot be monitored, awaiting an
        // administrative close. Named rather than silently dropped.
        unmonitorable_open: unmonitorable,
        completed_24h: day.length,
        cert_exams_24h: certExamsDay.length,
        passed_24h: certExamsDay.filter((d) => d.passed === true).length,
        avg_score_24h:
          scoredDay.length > 0
            ? Math.round(
                (scoredDay.reduce((n, d) => n + Number(d.score_pct), 0) / scoredDay.length) * 10,
              ) / 10
            : null,
        by_certification: [...byCert.values()].sort((a, b) => b.live - a.live || a.code.localeCompare(b.code)),
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
