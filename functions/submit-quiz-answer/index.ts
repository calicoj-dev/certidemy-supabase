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
import { updateMastery } from "../_shared/mastery.ts";

interface Body {
  session_id: string;
  question_id: string;
  user_answer: string[];
  time_taken_seconds: number;
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

    // 1. Load the authoritative question record.
    const { data: question, error: qErr } = await svc
      .from('quiz_questions')
      .select('id, certification_id, module_id, correct_answer, explanation, difficulty')
      .eq('id', body.question_id)
      .single();
    if (qErr || !question) throw new HttpError(404, 'question not found');

    // 2. Grade.
    const is_correct = setsEqual(
      new Set(question.correct_answer as string[]),
      new Set(body.user_answer),
    );

    // 3. Log the attempt.
    await svc.from('quiz_attempts').insert({
      session_id: body.session_id,
      user_id,
      question_id: body.question_id,
      user_answer: body.user_answer,
      is_correct,
      time_taken_seconds: body.time_taken_seconds,
      attempted_at: now.toISOString(),
    });

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
    });

    return jsonResponse({
      is_correct,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
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

  let q = svc
    .from('quiz_questions')
    .select('id, question_text, difficulty, module_id')
    .eq('certification_id', args.certification_id)
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
