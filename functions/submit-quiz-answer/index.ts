// POST /functions/v1/submit-quiz-answer
//
// Body: { session_id, question_id, user_answer: string[], time_taken_seconds }
// Auth: Bearer JWT (Supabase auth token)
//
// Pipeline:
//   1. Verify caller via JWT → user_id
//   2. Load question's correct_answer server-side (client never sees it pre-submit)
//   3. Grade the answer
//   4. Insert quiz_attempts row
//   5. Update user_concept_mastery for every concept tagged on the question
//   6. Apply FSRS update to fsrs_cards (create if missing) and append fsrs_reviews
//   7. Recommend the next item the user should see
//
// Returns: correctness, explanation, mastery deltas, next due, next recommendation.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { review, ratingFromOutcome, defaultNewCard, FsrsCard } from "../_shared/fsrs.ts";
/* PROMPT-96 s1b. ONE definition of servable, shared with get-review-batch. */
import { isServable } from "../_shared/item-rules/language-sibling.mjs";
import { updateMastery } from "../_shared/mastery.ts";

interface Body {
  session_id: string;
  question_id: string;
  user_answer: string[];
  time_taken_seconds: number;
  /**
   * PROMPT-96 s1b. The locale the learner is on, so the EXPLANATION comes back in it.
   *
   * WHY THIS FUNCTION NEEDED A LANGUAGE AT ALL. `get-review-batch` now serves a review in the requested
   * language by keeping the CARD's question id and taking the display text from the sibling -- scheduling is
   * keyed on that id, so it cannot change. The consequence lands here: the client submits the card's id,
   * this function reads that row, and returns ITS explanation. A learner answering a Spanish question was
   * therefore shown an English explanation on the same page.
   *
   * Fixing it in `get-review-batch` is not possible: the explanation is not in the review payload, by
   * design, because a client holding the explanation before the answer holds the answer.
   *
   * OPTIONAL, AND ABSENCE MEANS "THE QUESTION'S OWN LANGUAGE". An older client that does not send it gets
   * exactly the behaviour it has today, so the two deploys are independent in either order.
   */
  language?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.session_id || !body.question_id || !Array.isArray(body.user_answer)) {
      return jsonResponse({ error: 'invalid body' }, 400);
    }

    const svc = getServiceClient();
    const now = new Date();

    // ============ THE CALLER MUST OWN THE SESSION, AND THE SESSION MUST FIT THIS ENDPOINT ======
    //
    // Found 2026-09-27. This function authenticated the caller and then trusted `session_id` from
    // the request body, so ANY learner could write attempt rows into ANY other learner's session --
    // and read out a key while doing it. The JWT proved who was calling and nothing checked what
    // they were calling about, which is the shape `requireIssuerAccess` exists to prevent one table
    // over on the issuing path.
    //
    // THE KIND VOCABULARY IS READ FROM THE DATA, NOT GUESSED. `quiz_sessions.kind` is one of
    // practice | review | certification_exam | mock_exam, and all 813 attempts this endpoint has
    // ever written sat on a `practice` (594) or `review` (219) session. An exam session is graded by
    // score-mock-exam; accepting one here has never happened and must not start.
    //
    // BOTH CHECKS RUN BEFORE ANYTHING IS READ OR WRITTEN, so a refusal leaves no attempt row and
    // discloses nothing -- validate before writing, so ABORT means nothing happened.
    const GRADEABLE_SESSION_KINDS = ['practice', 'review'];
    const { data: session, error: sErr } = await svc
      .from('quiz_sessions')
      .select('id, user_id, kind')
      .eq('id', body.session_id)
      .maybeSingle();
    if (sErr) throw new HttpError(500, 'session lookup failed');
    if (!session) throw new HttpError(404, 'session not found');
    if (session.user_id !== user_id) {
      // Deliberately the same wording as a missing session: whether a given session id exists is
      // not something a stranger should be able to probe.
      throw new HttpError(404, 'session not found');
    }
    if (!GRADEABLE_SESSION_KINDS.includes(session.kind)) {
      throw new HttpError(403, 'this session kind is not graded here');
    }

    // 1. Load the authoritative question record.
    //    `pool` and `status` are selected because the refusal below needs them. They are NOT
    //    returned to the caller.
    const { data: question, error: qErr } = await svc
      .from('quiz_questions')
      // ONE UNBROKEN LITERAL. Splitting this across a `+` collapsed the row type to `GenericStringError`
      // and `deno check` reported five phantom "property does not exist" errors -- the trap CLAUDE.md
      // records for exactly this, caught here by the type checker on the first run.
      .select('id, certification_id, module_id, correct_answer, explanation, difficulty, language, pool, status, retired_at, question_group_id')
      .eq('id', body.question_id)
      .single();
    if (qErr || !question) throw new HttpError(404, 'question not found');

    // ============ THE EXPLANATION IS RESOLVED INTO THE REQUESTED LANGUAGE ============
    //
    // PROMPT-96 s1b. GRADING IS UNTOUCHED AND THAT IS THE POINT: `correct_answer` is read from the row
    // above, the FSRS card is keyed on that row's id, and only the explanation TEXT moves. A sibling's
    // `correct_answer` is identical by construction (9,224 of 9,224 translated option sets pair by id), but
    // this path does not rely on that -- it never reads the sibling's key.
    //
    // NO SERVABLE SIBLING MEANS THE QUESTION'S OWN EXPLANATION, WHICH IS A DELIBERATE FALLBACK AND THE
    // OPPOSITE OF THE RULE IN `get-review-batch`. There, a missing sibling means the review is skipped: the
    // learner has not yet been shown anything, so showing nothing costs them nothing. Here the answer is
    // already submitted and graded; withholding the explanation to avoid the wrong language would take away
    // the one thing the learner is owed for having answered. Wrong-language text beats no text ONLY after
    // the answer, and the two rules differ for that reason rather than by oversight.
    let explanation = question.explanation;
    let explanation_language = question.language;
    const want = (body.language && body.language.trim()) || null;
    if (want && want !== question.language && question.question_group_id) {
      const { data: sib, error: sibErr } = await svc
        .from('quiz_questions')
        .select('id, explanation, language, status, pool, retired_at, question_group_id')
        .eq('question_group_id', question.question_group_id)
        .eq('language', want);
      // A FAILED READ IS NOT "NO SIBLING". It is logged and the fallback stands, rather than being
      // indistinguishable from a bank with no translation.
      if (sibErr) {
        console.warn('explanation sibling read failed: ' + JSON.stringify({ q: question.id, want,
          error: sibErr.message }));
      } else {
        const hit = (sib ?? []).find((s) => isServable(s) && s.explanation);
        if (hit) { explanation = hit.explanation; explanation_language = hit.language; }
        else {
          console.warn('explanation stays in ' + question.language + ': ' + JSON.stringify({
            q: question.id, want, reason: 'no servable ' + want + ' sibling with an explanation' }));
        }
      }
    }

    // ============ A SECURE ITEM IS NEVER GRADED HERE ============
    //
    // This read filtered on id alone and the response returns `correct_answer` and `explanation`.
    // Measured as a stranger on 2026-09-27: a brand-new learner with no entitlement posted a live
    // SECURE exam item's id and received its key. get-active-exam-session is careful never to send
    // correct_answer and it does send question IDS, so a candidate with an exam in progress holds
    // everything needed.
    //
    // Refused outright rather than filtered into a 404: the item exists, and the reason it is
    // refused is what the next reader needs. 0 of 813 practice-path attempts have ever been on a
    // secure item, so this breaks nothing that has ever happened.
    //
    // NON-APPROVED PRACTICE ITEMS ARE STILL GRADED, deliberately. A learner mid-session whose item
    // was retired underneath them would otherwise lose the answer they just gave; 4 such calls have
    // happened. They can no longer be RECOMMENDED, which is the separate fix below.
    if (question.pool === 'secure') {
      throw new HttpError(403, 'secure items are graded only by the exam scorer');
    }

    // 2. Grade.
    const is_correct = setsEqual(
      new Set(question.correct_answer as string[]),
      new Set(body.user_answer),
    );

    // 3. Log the attempt.
    //
    // ============ A RESPONSE CARRYING A KEY MUST NOT EXIST WITHOUT AN AUDIT ROW ============
    //
    // This insert's error was DISCARDED, and that is what made the exposure unmeasurable rather
    // than merely unmeasured. `session_id` has a foreign key to quiz_sessions and `user_id` one to
    // profiles, so a caller passing a session id that does not exist got a 23503 -- the error was
    // swallowed, the function carried on, and it returned correct_answer and explanation WITH NO
    // ROW WRITTEN. The cheapest possible exploit was also the one that left no trace, so "0 attempts
    // on secure items" proved nothing about whether anyone had called it.
    //
    // Now the row IS the precondition for the answer. If it cannot be written, the caller gets an
    // error and no key -- the same shape as the dropped-read rule this repository is built around,
    // with the direction reversed: there a failed READ became a legitimate-looking empty result,
    // here a failed WRITE became a legitimate-looking answer.
    const { error: aErr } = await svc.from('quiz_attempts').insert({
      session_id: body.session_id,
      user_id,
      question_id: body.question_id,
      user_answer: body.user_answer,
      is_correct,
      time_taken_seconds: body.time_taken_seconds,
      attempted_at: now.toISOString(),
    });
    if (aErr) {
      // Deliberately not echoing the database message: it names constraints and columns, and the
      // caller gets nothing they could not have worked out from a 500.
      console.error('quiz_attempts insert failed, refusing to answer:', aErr.message);
      throw new HttpError(500, 'attempt could not be recorded');
    }

    // 4. Update concept mastery (one upsert per concept tagged on the question).
    const { data: tagged } = await svc
      .from('question_concepts')
      .select('concept_id')
      .eq('question_id', body.question_id);

    const concept_ids = (tagged ?? []).map(r => r.concept_id);
    const mastery_updates: Array<{ concept_id: string; mastery_score: number; delta: number }> = [];

    if (concept_ids.length > 0) {
      const { data: existing } = await svc
        .from('user_concept_mastery')
        .select('concept_id, mastery_score, attempts, correct, last_seen_at')
        .eq('user_id', user_id)
        .in('concept_id', concept_ids);
      const existing_by_id = new Map((existing ?? []).map(m => [m.concept_id, m]));

      const upserts = concept_ids.map(concept_id => {
        const old = existing_by_id.get(concept_id);
        const days_since = old?.last_seen_at
          ? (now.getTime() - new Date(old.last_seen_at).getTime()) / 86_400_000
          : 0;
        const next = updateMastery({
          old_mastery: old?.mastery_score ?? null,
          old_attempts: old?.attempts ?? 0,
          old_correct: old?.correct ?? 0,
          is_correct,
          question_difficulty: question.difficulty,
          days_since_last_seen: days_since,
          weight: 1 / concept_ids.length,
        });
        mastery_updates.push({
          concept_id,
          mastery_score: next.mastery,
          delta: next.mastery - (old?.mastery_score ?? 0.5),
        });
        return {
          user_id,
          concept_id,
          mastery_score: next.mastery,
          attempts: next.attempts,
          correct: next.correct,
          last_seen_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
      });

      await svc.from('user_concept_mastery').upsert(upserts, { onConflict: 'user_id,concept_id' });
    }

    // 5. FSRS update.
    const rating = ratingFromOutcome(is_correct, body.time_taken_seconds);

    const { data: existing_card } = await svc
      .from('fsrs_cards')
      .select('*')
      .eq('user_id', user_id)
      .eq('question_id', body.question_id)
      .maybeSingle();

    const card_before: FsrsCard = existing_card
      ? {
          state: existing_card.state,
          due: new Date(existing_card.due),
          stability: Number(existing_card.stability),
          difficulty: Number(existing_card.difficulty),
          elapsed_days: Number(existing_card.elapsed_days),
          scheduled_days: Number(existing_card.scheduled_days),
          reps: existing_card.reps,
          lapses: existing_card.lapses,
          last_review: existing_card.last_review ? new Date(existing_card.last_review) : null,
        }
      : defaultNewCard(now);

    const card_after = review(card_before, rating, now);

    let card_id: string;
    if (existing_card) {
      card_id = existing_card.id;
      await svc.from('fsrs_cards').update({
        state: card_after.state,
        due: card_after.due.toISOString(),
        stability: card_after.stability,
        difficulty: card_after.difficulty,
        elapsed_days: card_after.elapsed_days,
        scheduled_days: card_after.scheduled_days,
        reps: card_after.reps,
        lapses: card_after.lapses,
        last_review: now.toISOString(),
      }).eq('id', card_id);
    } else {
      const { data: inserted, error: insErr } = await svc.from('fsrs_cards').insert({
        user_id,
        question_id: body.question_id,
        state: card_after.state,
        due: card_after.due.toISOString(),
        stability: card_after.stability,
        difficulty: card_after.difficulty,
        elapsed_days: card_after.elapsed_days,
        scheduled_days: card_after.scheduled_days,
        reps: card_after.reps,
        lapses: card_after.lapses,
        last_review: now.toISOString(),
      }).select('id').single();
      if (insErr || !inserted) throw new Error(`fsrs_cards insert failed: ${insErr?.message}`);
      card_id = inserted.id;
    }

    await svc.from('fsrs_reviews').insert({
      card_id,
      user_id,
      rating,
      state_before: card_before.state,
      state_after: card_after.state,
      stability_before: card_before.stability,
      stability_after: card_after.stability,
      difficulty_before: card_before.difficulty,
      difficulty_after: card_after.difficulty,
      elapsed_days: card_after.elapsed_days,
      reviewed_at: now.toISOString(),
    });

    // 6. Recommend a next item.
    //    Strategy: if the user just got it wrong, queue another question from the
    //    same module at the same difficulty. If correct, optionally raise difficulty.
    const next_recommendation = await recommendNext(svc, {
      user_id,
      certification_id: question.certification_id,
      module_id: question.module_id,
      just_correct: is_correct,
      last_difficulty: question.difficulty,
      exclude_question_id: question.id,
      language: question.language,
    });

    return jsonResponse({
      is_correct,
      correct_answer: question.correct_answer,
      explanation,
      // WHICH LANGUAGE THE EXPLANATION IS IN, stated rather than inferred by the client. Where no sibling
      // was available this differs from the requested locale, and the caller can say so instead of the
      // learner wondering.
      explanation_language,
      rating,
      next_due: card_after.due.toISOString(),
      next_interval_days: card_after.scheduled_days,
      mastery_updates,
      next_recommendation,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

async function recommendNext(
  svc: ReturnType<typeof getServiceClient>,
  args: {
    user_id: string;
    certification_id: string;
    module_id: string | null;
    just_correct: boolean;
    last_difficulty: number;
    exclude_question_id: string;
    /* The learner is answering in ONE language and must be recommended one in the same
     * language. Threaded from the answered question rather than defaulted, because a default
     * would silently be English for a pt-BR learner. */
    language: string;
  },
) {
  // Aim difficulty: nudge up after a correct answer, down after a wrong one.
  const target_difficulty = Math.max(
    1,
    Math.min(5, args.last_difficulty + (args.just_correct ? 1 : -1)),
  );

  // Prefer questions tagged with the user's weakest concepts in this cert.
  const { data: weak } = await svc
    .from('user_concept_mastery')
    .select('concept_id, concepts!inner(certification_id)')
    .eq('user_id', args.user_id)
    .eq('concepts.certification_id', args.certification_id)
    .order('mastery_score', { ascending: true })
    .limit(3);

  const weak_ids = (weak ?? []).map((r: any) => r.concept_id);

  // ============ THIS QUERY SERVES A STEM TO A LEARNER AND FILTERED ALMOST NOTHING ========
  //
  // Found 2026-09-26, while proving that a draft item could not reach a candidate. It could:
  // this path selected on certification_id and module_id and NOTHING ELSE, then returned
  // `question_text` to the learner as the next recommended item. Four separate holes in one
  // query, and three of them are live today regardless of drafts:
  //
  //   status         a draft or a rejected item is recommendable. Nothing had ever inserted a
  //                  non-approved row, so the hole was unobserved rather than closed -- the
  //                  empty-table shape this repository already records for company_features.
  //   pool           SECURE items are recommendable into a practice flow. 278 of AIMS-F's 630
  //                  English rows are pool='secure', so a learner answering practice questions
  //                  could be handed a certification exam stem. That is an exam-integrity
  //                  defect, not a content one.
  //   retired_at     a retired item is served again, which is exactly what retiring prevents
  //                  everywhere else (migration 089). Three AIMS-F rows are retired.
  //   language       no filter at all, so an English learner can be recommended a pt-BR stem.
  //
  // The pool and retired holes are the serious ones and they predate any of this work. The
  // status filter is what makes inserting graded drafts safe.
  let q = svc
    .from('quiz_questions')
    .select('id, question_text, difficulty, module_id')
    .eq('certification_id', args.certification_id)
    .eq('status', 'approved')
    .eq('pool', 'practice')
    .eq('language', args.language)
    .is('retired_at', null)
    .neq('id', args.exclude_question_id);

  if (args.module_id) q = q.eq('module_id', args.module_id);

  const { data: candidates } = await q.limit(50);
  if (!candidates || candidates.length === 0) return null;

  // Score: prefer matching difficulty, then concept overlap.
  let best = candidates[0];
  let best_score = -Infinity;
  for (const c of candidates) {
    let score = -Math.abs(c.difficulty - target_difficulty);
    if (weak_ids.length > 0) {
      const { count } = await svc
        .from('question_concepts')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', c.id)
        .in('concept_id', weak_ids);
      score += (count ?? 0) * 0.5;
    }
    if (score > best_score) { best_score = score; best = c; }
  }
  return { question_id: best.id, question_text: best.question_text, difficulty: best.difficulty };
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}
