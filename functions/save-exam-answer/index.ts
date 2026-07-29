// POST /functions/v1/save-exam-answer
//
// Body: { session_id, answers: [{ question_id, user_answer: string[],
//                                 time_taken_seconds?, marked_for_review? }] }
// Auth: Bearer JWT
//
// Persists in-progress answers into exam_session_items (migrations 163 + 164),
// so the server holds the candidate's work while the exam is still running.
//
// ============================================================================
// WHAT THIS EXISTS FOR
// ============================================================================
//
// Answers previously lived only in React state until submit. A dead browser at
// minute 55 of 60 meant a consumed voucher, eighty answered items, and nothing
// to show. Resume was impossible because there was nothing to return to. And
// scoring still had to take the answers from the client, so the integrity of a
// result depended on a check rather than on the client being irrelevant.
//
// With answers on the server, four things follow:
//   - a candidate can resume exactly where they left off
//   - a crash costs nothing already saved
//   - submit becomes a FINALISE signal, not the source of truth
//   - an abandoned attempt can be scored server-side with no client present
//
// ============================================================================
// WRITE ON CHANGE, NOT ON A CLOCK
// ============================================================================
//
// The client calls this when an answer changes, debounced a second or two. Not a
// heartbeat: a 45-second tick over a two-hour exam is ~160 writes per candidate
// that still cannot say WHEN an answer was given, only which tick it had been
// given by. Change-driven saves come to roughly 100-150 for an eighty-item exam
// and each one is precise.
//
// Batching is supported so the client can flush several at once - on
// visibilitychange, for instance - but the normal call carries one item.
//
// ============================================================================
// EVERY GUARD HERE MATTERS
// ============================================================================
//
// OWNERSHIP. The session must belong to the caller. Without it, any candidate
// could write answers into any session.
//
// NOT COMPLETED. A completed session is a closed examination record. Writing to
// it would let someone alter answers after seeing their score, and re-scoring
// is possible from the console.
//
// THE ITEM MUST HAVE BEEN SERVED. Only rows already in exam_session_items are
// updated - never inserted. An UPSERT here would let a client add items to its
// own form, which is the migration-163 defect rebuilt one layer down.
//
// THE CLOCK MUST NOT HAVE EXPIRED. Without this, answers could be submitted
// hours after the window closed. The server owns elapsed time (from
// quiz_sessions.started_at), and a small grace absorbs the latency of a save
// dispatched at zero.
//
// The response carries seconds_remaining, so the client's countdown is corrected
// by the server on every save. Browsers throttle timers in background tabs, so a
// client-side clock drifts slow - this makes that drift self-healing rather than
// something the late-submission flag has to catch afterwards.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

/** Absorbs latency for a save dispatched as the clock hits zero. */
const SAVE_GRACE_SECONDS = 30;

/** Ceiling on one request. A full form flush is the largest legitimate call. */
const MAX_ITEMS_PER_CALL = 120;

interface IncomingAnswer {
  question_id: string;
  user_answer: string[];
  time_taken_seconds?: number;
  marked_for_review?: boolean;
}

interface Body {
  session_id: string;
  answers: IncomingAnswer[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const user_id = await authenticate(req);
    const body = (await req.json()) as Body;

    if (!body.session_id || !Array.isArray(body.answers)) {
      throw new HttpError(400, "session_id and answers required");
    }
    if (body.answers.length === 0) {
      return jsonResponse({ saved: 0, skipped: 0, seconds_remaining: null });
    }
    if (body.answers.length > MAX_ITEMS_PER_CALL) {
      throw new HttpError(400, `at most ${MAX_ITEMS_PER_CALL} answers per call`);
    }

    const svc = getServiceClient();
    const now = new Date();

    // ---- session: ownership, kind, still open --------------------------
    const { data: session, error: sErr } = await svc
      .from("quiz_sessions")
      .select("id, user_id, certification_id, kind, started_at, completed_at")
      .eq("id", body.session_id)
      .single();
    if (sErr || !session) throw new HttpError(404, "session not found");
    if (session.user_id !== user_id) throw new HttpError(403, "not your session");
    if (session.kind !== "mock_exam" && session.kind !== "certification_exam") {
      throw new HttpError(400, "not an exam session");
    }
    if (session.completed_at) {
      // A completed session is a closed examination record.
      throw new HttpError(409, "session already completed");
    }

    // ---- clock: the server owns elapsed time --------------------------
    const { data: cert } = await svc
      .from("certifications")
      .select("exam_duration_minutes")
      .eq("id", session.certification_id)
      .single();

    const duration_seconds = (cert?.exam_duration_minutes ?? 60) * 60;
    const elapsed_seconds = Math.floor(
      (now.getTime() - new Date(session.started_at).getTime()) / 1000,
    );
    const seconds_remaining = duration_seconds - elapsed_seconds;

    if (seconds_remaining < -SAVE_GRACE_SECONDS) {
      // Past the window. Reported rather than silently dropped so the client
      // can stop trying and move to submission.
      return jsonResponse(
        {
          saved: 0,
          skipped: body.answers.length,
          seconds_remaining: 0,
          expired: true,
          detail: "the examination window has closed; this answer was not saved",
        },
        409,
      );
    }

    // ---- the form: only served items can be written -------------------
    const { data: servedRows, error: siErr } = await svc
      .from("exam_session_items")
      .select("question_id")
      .eq("session_id", body.session_id);
    if (siErr) {
      console.error("exam_session_items read failed", siErr);
      throw new Error(`could not read the served form: ${siErr.message}`);
    }

    const served = new Set((servedRows ?? []).map((r) => r.question_id as string));
    if (served.size === 0) {
      // A session issued before migration 163 has no recorded form, so there is
      // nothing to write into. Those sessions still score through the legacy
      // path in score-mock-exam; they simply cannot be saved or resumed.
      return jsonResponse({
        saved: 0,
        skipped: body.answers.length,
        seconds_remaining: Math.max(0, seconds_remaining),
        legacy_session: true,
        detail: "this session predates form recording; answers are kept client-side",
      });
    }

    // ---- write ---------------------------------------------------------
    //
    // UPDATE, never UPSERT. An upsert would insert a row for a question that was
    // never served, which is the migration-163 defect rebuilt one layer down.
    // An item not in the form simply matches nothing, and is counted as skipped.
    let saved = 0;
    const rejected: string[] = [];

    for (const a of body.answers) {
      if (!a || typeof a.question_id !== "string" || !Array.isArray(a.user_answer)) {
        rejected.push(String(a?.question_id ?? "malformed"));
        continue;
      }
      if (!served.has(a.question_id)) {
        rejected.push(a.question_id);
        continue;
      }

      const { error: uErr } = await svc
        .from("exam_session_items")
        .update({
          user_answer: a.user_answer,
          time_taken_seconds:
            typeof a.time_taken_seconds === "number" && a.time_taken_seconds >= 0
              ? Math.round(a.time_taken_seconds)
              : null,
          marked_for_review: a.marked_for_review === true,
          answered_at: now.toISOString(),
        })
        .eq("session_id", body.session_id)
        .eq("question_id", a.question_id);

      if (uErr) {
        // One item failing must not lose the rest of a flush.
        console.warn(`save failed for ${a.question_id}: ${uErr.message}`);
        rejected.push(a.question_id);
        continue;
      }
      saved += 1;
    }

    if (rejected.length > 0) {
      console.warn(
        `session ${body.session_id}: ${rejected.length} answer(s) not saved ` +
        `(not in the served form, or malformed): ${rejected.slice(0, 10).join(", ")}`,
      );
    }

    return jsonResponse({
      saved,
      skipped: rejected.length,
      // The client's countdown is corrected by the server on every save.
      seconds_remaining: Math.max(0, seconds_remaining),
      expired: false,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
