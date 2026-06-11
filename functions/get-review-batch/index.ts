// POST /functions/v1/get-review-batch
//
// Body: { certification_id, limit?: number, include_new?: number }
// Auth: Bearer JWT
//
// Returns the user's review queue for today:
//   - All FSRS cards with due <= now, sorted by due ascending
//   - Optionally padded with `include_new` brand-new questions the user hasn't
//     seen yet (defaults to a few from their current module).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

interface Body {
  certification_id: string;
  limit?: number;
  include_new?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.certification_id) throw new HttpError(400, 'certification_id required');

    const svc = getServiceClient();
    const review_limit = Math.min(body.limit ?? 20, 100);
    const new_limit = Math.min(body.include_new ?? 5, 20);

    // 1. Due reviews — FSRS cards whose due time has passed, for questions in
    //    this certification.
    const { data: due_cards } = await svc
      .from('fsrs_cards')
      .select(`
        id, due, state, stability, difficulty,
        quiz_questions!inner (
          id, question_text, question_type, options, difficulty, module_id, certification_id
        )
      `)
      .eq('user_id', user_id)
      .eq('quiz_questions.certification_id', body.certification_id)
      .lte('due', new Date().toISOString())
      .order('due', { ascending: true })
      .limit(review_limit);

    // 2. Net new items — questions in this cert the user has never seen.
    //    Exclude seen IDs at the query level so the whole unseen bank is
    //    reachable (not just the first N rows of the full table).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let new_items: any[] = [];
    if (new_limit > 0) {
      const { data: seen_ids } = await svc
        .from('fsrs_cards')
        .select('question_id')
        .eq('user_id', user_id);
      const seen = (seen_ids ?? [])
        .map((r) => r.question_id)
        .filter(Boolean);

      let q = svc
        .from('quiz_questions')
        .select('id, question_text, question_type, options, difficulty, module_id')
        .eq('certification_id', body.certification_id);

      // Exclude already-seen questions in the query itself. PostgREST's
      // `not in` wants a (a,b,c) list; build it from the seen IDs.
      if (seen.length > 0) {
        q = q.not('id', 'in', `(${seen.join(',')})`);
      }

      // Pull a generous pool of unseen questions. Order by id for stable,
      // deterministic paging; the player shuffles presentation if desired.
      const { data: candidates } = await q.limit(new_limit * 4);

      new_items = (candidates ?? [])
        .slice(0, new_limit)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((qq: any) => ({ ...qq, kind: 'new' }));
    }


    const reviews = (due_cards ?? []).map((c: any) => ({
      kind: 'review',
      card_id: c.id,
      due: c.due,
      state: c.state,
      stability: c.stability,
      difficulty_fsrs: c.difficulty,
      ...c.quiz_questions,
    }));

    // 3. Total due count (for the badge).
    const { count: total_due } = await svc
      .from('fsrs_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .lte('due', new Date().toISOString());

    return jsonResponse({
      total_due_now: total_due ?? 0,
      reviews,
      new_items,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
