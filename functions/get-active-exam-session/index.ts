// POST /functions/v1/get-active-exam-session
//
// Body: { certification_id?: string }
// Auth: Bearer JWT
//
// Answers one question: does this candidate have an exam in progress, and if so
// what exactly were they looking at?
//
// Returns one of:
//   { active: false }
//   { active: true, session_id, ..., questions: [...], saved_answers: [...] }
//   { active: false, finalized: { session_id, score_pct, passed } }
//   { active: false, unscoreable: true, session_id, ... }
//   { active: false, finalize_failed: true, session_id, detail }
//
// ============================================================================
// WHY THIS EXISTS
// ============================================================================
//
// RESUME. A form that was never recorded cannot be re-served - regenerating
// would draw a fresh sample and hand the candidate a second look at the secure
// pool. exam_session_items (migration 163) records the exact form, so it can be
// re-served in the exact order, with the answers already saved against it
// (migration 164). The candidate returns to their work, not a blank slate.
//
// FINALISING ABANDONED ATTEMPTS. Auto-submit at zero only fires if a browser is
// present. Without one, an attempt sat in_progress forever: voucher spent, no
// exam_attempts row, no score, nothing the candidate holds.
//
// This is not rare. On 2026-07-29 quiz_sessions held TWENTY-TWO open sessions
// going back to May, three of them certification_exam - three consumed vouchers
// with no attempt against them. Twenty-two abandonments across two months of
// internal testing means closing a tab mid-exam is ordinary behaviour, and in
// production it is a steady stream of stuck entitlements.
//
// ============================================================================
// THE CHECK ORDER IS LOAD-BEARING
// ============================================================================
//
// The form is read BEFORE expiry is considered. The first cut of this file did
// the opposite, and it would have done real damage:
//
// Every session created before migration 163 has no recorded form. Checking
// expiry first would have routed all of them into finalisation, where
// score-mock-exam would grade an empty form and write an exam_attempts row
// recording 0% on 0 questions. For the three certification exams that is a
// fabricated failed attempt in a permanent record, polluting readiness views and
// exposure statistics, and arguably misrepresenting a candidate.
//
// So: no recorded form, no scoring. Those sessions are reported as unscoreable
// and left alone for an administrator, who can close them without inventing a
// result. A session WITH a form and zero saved answers is a different case and
// IS scored - the candidate was served the form and answered nothing, and 0 out
// of 40 is the truth.
//
// LAZY, NOT SCHEDULED. Finalisation happens on the candidate's next
// authenticated request rather than from a cron: no scheduler to forget, no
// unattended service-role job. A candidate who never returns leaves a stale
// session for the console to surface; nobody is waiting on that one.
//
// ============================================================================
// WHAT IS DELIBERATELY NOT RETURNED
// ============================================================================
//
// correct_answer, difficulty, task_id, domain_id - exactly as generate-mock-exam
// withholds them. A resume path that leaked the answer key would be a worse
// defect than the one this chain set out to fix, and `select *` would write it
// by accident.
//
// Questions come back ordered by presented_order, so a resumed exam is the one
// the candidate left. Re-shuffling would invalidate their mental map of the
// navigator grid - its own kind of unfairness.
//
// ============================================================================
// UNLOCKED RESUME IS A DELIBERATE POLICY DECISION
// ============================================================================
//
// A resumed candidate may change answers they had already saved. Locking would
// be more defensible if we ever had to argue a session was continuous, but the
// clock never stopped, and locking costs an honest candidate whose browser died
// far more than it costs someone determined to cheat - who would use a second
// device and never leave the tab. Recorded in the candidate handbook.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

/** Matches score-mock-exam's grace, so both agree on what "expired" means. */
const LATE_GRACE_SECONDS = 60;

type ExamKind = "mock_exam" | "certification_exam";

interface Body {
  certification_id?: string;
  /**
   * Narrow to the kind the caller can actually resume. OPTIONAL, and absent
   * keeps the catalogue-wide behaviour the dashboard banner depends on.
   *
   * This exists because the exam page used to ask for the newest open session
   * of EITHER kind and then discard it client-side when the kind was wrong.
   * See THE KIND FILTER below for what that cost.
   */
  kind?: ExamKind;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const user_id = await authenticate(req);
    const body = (await req.json().catch(() => ({}))) as Body;
    const svc = getServiceClient();
    const now = new Date();

    // ---- 1. the open exam session this caller means --------------------
    //
    // ====================================================================
    // THE KIND FILTER, AND WHY IT IS NOT OPTIONAL FOR THE EXAM PAGE
    // ====================================================================
    //
    // This used to return the newest open session of either kind, full stop,
    // and mock-exam.tsx discarded the answer when res.kind was not the kind it
    // wanted -- falling through to the intro screen with a Start button.
    //
    // So any newer session of the OTHER kind made a resumable exam invisible.
    // On 2026-08-21 a candidate hit exactly that: he started a mock exam at
    // 03:07:44, which masked the certification exam he had started at 03:06:46
    // and was still inside its window. Seven seconds later the real exam page
    // showed him Start instead of Resume, generate-mock-exam consumed his last
    // attempt, and the resumable session sat one row away. Two attempts gone,
    // no exam sat, no credential.
    //
    // Filtering HERE, on the server, is what makes the client correct rather
    // than working around it. Two places deciding the same thing is how that
    // happened.
    //
    // ====================================================================
    // NO KIND: PREFER THE ONE WITH A CLOCK THAT CANNOT BE RECOVERED
    // ====================================================================
    //
    // The dashboard banner asks without a kind, deliberately: it spans the
    // whole catalogue. When both kinds are open it must surface the
    // certification exam, because that is the one running down a timer the
    // candidate cannot get back and the one an attempt was spent on. Showing
    // the free practice run in preference to it is the same failure as above,
    // one screen earlier.
    //
    // Chosen in TypeScript rather than by ORDER BY: 'certification_exam' sorts
    // before 'mock_exam' alphabetically, so an ascending order would work today
    // and silently stop working the day a kind is added between them. The
    // preference is a decision, so it is written as one.
    let q = svc
      .from("quiz_sessions")
      .select("id, certification_id, kind, started_at, voucher_id")
      .eq("user_id", user_id)
      .is("completed_at", null)
      .order("started_at", { ascending: false })
      .limit(10);

    q = body.kind
      ? q.eq("kind", body.kind)
      : q.in("kind", ["mock_exam", "certification_exam"]);

    if (body.certification_id) q = q.eq("certification_id", body.certification_id);

    const { data: sessions, error: sErr } = await q;
    if (sErr) {
      console.error("session lookup failed", sErr);
      throw new Error(`session lookup failed: ${sErr.message}`);
    }

    // The full selected shape: the rest of this function reads every column.
    const open = (sessions ?? []) as {
      id: string;
      certification_id: string;
      kind: string;
      started_at: string;
      voucher_id: string | null;
    }[];
    const session = body.kind
      ? open[0]
      : open.find((r) => r.kind === "certification_exam") ?? open[0];

    if (!session) return jsonResponse({ active: false });

    // ---- 2. THE FORM, BEFORE ANYTHING ELSE ----------------------------
    //
    // Read first on purpose. See the header: checking expiry before this would
    // route every pre-migration-163 session into scoring and fabricate a 0/0
    // failed attempt for each.
    const { data: servedRows, error: siErr } = await svc
      .from("exam_session_items")
      .select("question_id, presented_order, language, user_answer, time_taken_seconds, marked_for_review")
      .eq("session_id", session.id)
      .order("presented_order", { ascending: true });

    if (siErr) {
      console.error("exam_session_items read failed", siErr);
      throw new Error(`could not read the served form: ${siErr.message}`);
    }

    const served = servedRows ?? [];

    if (served.length === 0) {
      // No record of what this candidate was shown. It cannot be resumed
      // (regenerating would be a different exam) and it must not be scored
      // (there is nothing to score). Reported for an administrator to close.
      console.warn(
        `session ${session.id} (kind=${session.kind}, started ${session.started_at}) ` +
        `has no recorded form - unscoreable, left open for admin action`,
      );
      return jsonResponse({
        active: false,
        unscoreable: true,
        session_id: session.id,
        kind: session.kind,
        started_at: session.started_at,
        detail:
          "this session predates form recording, so there is no record of the " +
          "examination served. It cannot be resumed or scored, and needs an " +
          "administrator to close it.",
      });
    }

    // ---- 3. cert config + the clock -----------------------------------
    const { data: cert } = await svc
      .from("certifications")
      .select("code, name, exam_duration_minutes, passing_score_pct")
      .eq("id", session.certification_id)
      .single();

    const duration_minutes = cert?.exam_duration_minutes ?? 60;
    const elapsed_seconds = Math.floor(
      (now.getTime() - new Date(session.started_at).getTime()) / 1000,
    );
    const seconds_remaining = duration_minutes * 60 - elapsed_seconds;

    // ---- 4. expired, and we DO have a form: finalise ------------------
    if (seconds_remaining < -LATE_GRACE_SECONDS) {
      // Delegated to score-mock-exam rather than reimplemented. That function
      // owns grading, credential issuance, voucher linkage, the JTA stamp and
      // the mastery rules. A second copy of any of it would drift, and would
      // drift SILENTLY, because nothing exercises this path until someone
      // abandons an exam.
      //
      // The caller's Authorization header is forwarded, so finalisation runs as
      // the candidate and the scorer's ownership check still applies. No
      // service-role backdoor into scoring.
      const base = Deno.env.get("SUPABASE_URL") ?? "";
      const auth = req.headers.get("Authorization") ?? "";
      const answered = served.filter(
        (s) => s.user_answer !== null && s.user_answer !== undefined,
      ).length;

      try {
        const res = await fetch(`${base}/functions/v1/score-mock-exam`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: auth },
          // Empty answers. The scorer merges what was saved during the exam, so
          // this scores exactly what the candidate had persisted - and a form
          // with zero saved answers correctly scores zero out of the form size.
          body: JSON.stringify({ session_id: session.id, answers: [] }),
        });
        const scored = (await res.json().catch(() => ({}))) as {
          score_pct?: number;
          passed?: boolean;
          total_questions?: number;
          error?: string;
        };

        if (!res.ok) {
          console.error("finalisation failed", session.id, scored);
          // Reported, not hidden. The session stays open and will be retried on
          // the next call, rather than the candidate being told "nothing here"
          // while a spent voucher sits unresolved.
          return jsonResponse({
            active: false,
            finalize_failed: true,
            session_id: session.id,
            detail: scored.error ?? "could not finalise the expired session",
          });
        }

        console.log(
          `finalised abandoned session ${session.id} (kind=${session.kind}) ` +
          `form=${served.length} answered=${answered} score=${scored.score_pct}`,
        );
        return jsonResponse({
          active: false,
          finalized: {
            session_id: session.id,
            score_pct: scored.score_pct ?? null,
            passed: scored.passed ?? null,
            total_questions: scored.total_questions ?? served.length,
            answered_before_abandon: answered,
          },
        });
      } catch (err) {
        console.error("finalisation threw", session.id, err);
        return jsonResponse({
          active: false,
          finalize_failed: true,
          session_id: session.id,
          detail: (err as Error).message,
        });
      }
    }

    // ---- 5. live: re-serve the recorded form --------------------------
    //
    // Question bodies for the recorded ids. NEVER correct_answer / difficulty /
    // task_id - the same withholding generate-mock-exam applies.
    const ids = served.map((s) => s.question_id as string);
    const { data: questionRows, error: qErr } = await svc
      .from("quiz_questions")
      .select("id, question_text, question_type, options")
      .in("id", ids);

    if (qErr) {
      console.error("question load failed", qErr);
      throw new Error(`could not load the form's questions: ${qErr.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byId = new Map((questionRows ?? []).map((q: any) => [q.id, q]));

    // Rebuilt in presented_order so the resumed exam is the one they left.
    const questions: unknown[] = [];
    let missing = 0;
    for (const s of served) {
      const q = byId.get(s.question_id as string);
      if (!q) {
        missing += 1;
        continue;
      }
      questions.push({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
      });
    }
    if (missing > 0) {
      console.warn(
        `session ${session.id}: ${missing} recorded item(s) no longer exist in ` +
        `quiz_questions and cannot be re-served`,
      );
    }

    const saved_answers = served
      .filter((s) => s.user_answer !== null && s.user_answer !== undefined)
      .map((s) => ({
        question_id: s.question_id,
        user_answer: s.user_answer,
        time_taken_seconds: s.time_taken_seconds,
        marked_for_review: s.marked_for_review ?? false,
      }));

    return jsonResponse({
      active: true,
      session_id: session.id,
      kind: session.kind,
      certification_id: session.certification_id,
      certification_code: cert?.code ?? null,
      certification_name: cert?.name ?? null,
      language: served[0].language ?? "en",
      started_at: session.started_at,
      duration_minutes,
      passing_score_pct: Number(cert?.passing_score_pct ?? 85),
      // The server's number. The client should trust this over its own clock.
      seconds_remaining: Math.max(0, seconds_remaining),
      total_questions: questions.length,
      questions,
      saved_answers,
      missing_items: missing,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
