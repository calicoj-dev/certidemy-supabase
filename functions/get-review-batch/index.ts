// POST /functions/v1/get-review-batch
//
// Body: { certification_id, limit?: number, include_new?: number, language?: string }
// Auth: Bearer JWT
//
// Returns the user's review queue for today:
//   - All FSRS cards with due <= now, sorted by due ascending
//   - Optionally padded with `include_new` brand-new questions the user hasn't
//     seen yet (defaults to a few from their current module).
//
// New items are drawn from the PRACTICE pool ONLY (never secure/exam items)
// and in the requested language, so a review/practice slate can never surface
// an exam question or one in the wrong locale.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
/* PROMPT-96 s1b. ONE implementation, shared with submit-quiz-answer, so the two cannot disagree about what
 * "servable" means or about which row supplies the text. */
import { isServable, resolveSibling } from "../_shared/item-rules/language-sibling.mjs";

interface Body {
  certification_id: string;
  limit?: number;
  include_new?: number;
  language?: string;
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
    const language = (body.language && body.language.trim()) || 'en';

    // ============ 1. DUE REVIEWS ============
    //
    // ============ THIS BRANCH FILTERED THREE THINGS AND THE ONE BESIDE IT FILTERED SEVEN ============
    //
    // Until PROMPT-96 this query filtered `user_id`, `certification_id` and `due <= now`. The new-items
    // branch below filters pool, language, status and retired_at as well, and the header of this file
    // claimed both did: *"New items are drawn from the PRACTICE pool ONLY ... and in the requested
    // language, so a review/practice slate can never surface an exam question or one in the wrong
    // locale."* True of the branch it names, false of the file.
    //
    // MEASURED BEFORE THE FIX, over 435 live cards (scripts/measure-review-branch-exposure.mjs):
    //
    //   196 cards pointed at a RETIRED item, 149 of them due now -- 45 percent of the whole card set
    //    27 pointed at a NOT-APPROVED item, 26 due
    //     0 pointed at a secure or non-practice row
    //   291 pointed at an es-419 row and 144 at an English one, so a learner in either locale met the other
    //
    // The retirement figure is the serious one: migration 345 retired 158 pre-consolidation items and this
    // path kept serving them, so that retirement was half-effective in exactly the half a learner meets.
    // `retired_at` has gated `generate-mock-exam` since migration 089.
    //
    // The three filters are applied ON THE EMBEDDED ROW, which is why the join is `!inner`: a PostgREST
    // filter on an embedded table without `!inner` returns the card with a null embed rather than dropping
    // it, and a null embed would arrive here as a review with no question text.
    const { data: due_cards, error: dueErr } = await svc
      .from('fsrs_cards')
      .select(`
        id, due, state, stability, difficulty,
        quiz_questions!inner (
          id, question_text, question_type, options, difficulty, module_id, certification_id,
          language, question_group_id, status, pool, retired_at
        )
      `)
      .eq('user_id', user_id)
      .eq('quiz_questions.certification_id', body.certification_id)
      // the three the new-items branch has had since 2026-09-18, and this one never did
      .eq('quiz_questions.status', 'approved')
      .eq('quiz_questions.pool', 'practice')
      .is('quiz_questions.retired_at', null)
      .lte('due', new Date().toISOString())
      .order('due', { ascending: true })
      .limit(review_limit);
    // A DROPPED READ MUST NOT BECOME AN ANSWER. This result was destructured without its error, so a failed
    // read returned an empty review slate -- indistinguishable from a learner with nothing due.
    if (dueErr) throw new HttpError(500, 'could not read the due-review queue');

    // ============ THE EMBEDDED FILTER IS ASSERTED, NOT ASSUMED ============
    //
    // A PostgREST filter on an embedded table behaves differently with and without `!inner`: without it the
    // parent row comes back with a NULL embed rather than being dropped. The query above uses `!inner`, so
    // every row should satisfy all three predicates -- and this is the one place that could notice if a
    // future edit dropped the `!inner` or a predicate silently stopped applying. The whole defect being
    // fixed here is a reader that trusted a filter it did not have.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leaked = (due_cards ?? []).filter((c: any) => !isServable(c.quiz_questions));
    if (leaked.length) {
      console.error('due-review filter leak: ' + JSON.stringify(leaked.slice(0, 5).map((c: any) => ({
        card: c.id, question: c.quiz_questions?.id, status: c.quiz_questions?.status,
        pool: c.quiz_questions?.pool, retired_at: c.quiz_questions?.retired_at,
      }))));
      throw new HttpError(500, 'the due-review filter did not hold; refusing to serve this slate');
    }

    // ============ LANGUAGE IS RESOLVED THROUGH THE SIBLING, NOT FILTERED AWAY ============
    //
    // Filtering these cards by language would silently drop every card earned in another locale, so
    // switching the interface to Spanish would look like the learner's spaced repetition had been erased.
    // Serving the English row on a Spanish page is the defect we started from. So the CARD stays and the
    // DISPLAY is resolved: the card's own question id goes back to the client (scheduling is keyed on it),
    // and the TEXT comes from the sibling.
    //
    // Where there is no servable sibling the review is SKIPPED AND LOGGED. Never English on a Spanish page.
    const wrongLanguage = (due_cards ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => c.quiz_questions)
      .filter((q: any) => q && q.language !== language && q.question_group_id);
    const groupIds = [...new Set(wrongLanguage.map((q: any) => q.question_group_id))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let siblings: any[] = [];
    if (groupIds.length) {
      const { data: sibRows, error: sibErr } = await svc
        .from('quiz_questions')
        // ONE UNBROKEN LITERAL -- a concatenated select collapses the row type to `GenericStringError`.
        .select('id, question_group_id, language, status, pool, retired_at, question_text, question_type, options, difficulty, module_id, certification_id')
        .in('question_group_id', groupIds)
        .eq('language', language);
      // A FAILED SIBLING READ MUST NOT LOOK LIKE "NO SIBLING EXISTS". That would skip every out-of-locale
      // review and report an empty queue as though the bank were short.
      if (sibErr) throw new HttpError(500, 'could not read language siblings for the review queue');
      siblings = sibRows ?? [];
    }

    // 2. Net new items — PRACTICE-pool questions in this cert, in the requested
    //    language, that the user has never seen. The pool filter is the lock:
    //    secure/exam items must NEVER pad a practice/review slate. Seen IDs are
    //    excluded at the query level so the whole unseen bank is reachable (not
    //    just the first N rows of the full table).
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
        .eq('certification_id', body.certification_id)
        // Practice pool ONLY — never serve a secure (exam) item as "new".
        .eq('pool', 'practice')
        // Match the learner's language.
        .eq('language', language)
        // ============ ADDED 2026-09-18, AND THIS PATH HAD NEITHER ============
        //
        // This query filtered certification, pool, language and
        // not-already-seen, and NOTHING ELSE. So every item anybody had ever
        // withdrawn was still reachable as a "new" item here: measured before
        // the fix, 132 of them -- 122 rejected-and-retired, 10
        // approved-and-retired.
        //
        // `generate-mock-exam` has filtered `retired_at` since migration 089
        // ("retiring removes an item from circulation for future forms"). This
        // path never did, so a retirement was only ever half-effective and the
        // half that leaked was the one a learner meets first.
        //
        // Found while retiring the 158 pre-consolidation generated items
        // (migration 345). Without these two predicates that migration is
        // cosmetic here and the items keep arriving as "new".
        .eq('status', 'approved')
        .is('retired_at', null);

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


    // ============ BUILD THE REVIEW SLATE, RESOLVING THE LANGUAGE PER CARD ============
    //
    // THE ID THAT GOES BACK IS THE CARD'S, AND THAT IS THE WHOLE DESIGN. `submit-quiz-answer` grades by
    // reading `correct_answer` for the id it is handed and updates `fsrs_cards` on `(user_id, question_id)`.
    // Returning the sibling's id would create a SECOND card and reset the learner's interval -- the thing
    // the ruling forbids. Returning the card's id with the sibling's text keeps scheduling attached, and
    // grading is unaffected because siblings share option ids and `correct_answer` (measured: 9,224 of
    // 9,224 translated option sets pair by id, not by position).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: any[] = [];
    const skipped: { question_id: string; language: string; reason: string }[] = [];
    for (const c of (due_cards ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (c as any).quiz_questions;
      /* The resolver is plain JS and Deno widens its three-state return, so the union is named HERE, once.
       * Writing it out is deliberate: it is the third state -- `ok: false` with a reason -- that must not be
       * collapsible into a fallback, and a named union is what makes `deno check` enforce that the caller
       * handles it. */
      const r = resolveSibling(q, language, siblings) as
        | { ok: true; source: unknown; is_sibling: boolean; ambiguous?: number; reason?: undefined }
        | { ok: false; reason: string; source?: undefined; is_sibling?: undefined; ambiguous?: undefined };
      if (!r.ok) {
        // SKIPPED AND LOGGED, never a fallback. A silent fallback would put a page in front of the learner
        // that looks complete and is in the wrong language.
        skipped.push({ question_id: q?.id, language, reason: r.reason });
        console.warn('review skipped: ' + JSON.stringify({ question_id: q?.id, language,
          reason: r.reason }));
        continue;
      }
      if (r.ambiguous) {
        console.warn('review language ambiguous: ' + JSON.stringify({ group: q.question_group_id,
          language, servable_siblings: r.ambiguous }));
      }
      /* The shared resolver is plain JS, so Deno infers `object` for its return. Cast ONCE, here, with the
       * shape named -- rather than sprinkling `any` at each use, which is how a renamed field stops being
       * checked anywhere. */
      const src = r.source as {
        id: string; question_text: string; question_type: string; options: unknown; language: string;
      };
      reviews.push({
        kind: 'review',
        card_id: c.id,
        due: c.due,
        state: c.state,
        stability: c.stability,
        difficulty_fsrs: c.difficulty,
        // the CARD's id -- scheduling and grading key on it
        id: q.id,
        certification_id: q.certification_id,
        module_id: q.module_id,
        difficulty: q.difficulty,
        // the DISPLAY, from whichever row is in the requested language
        question_text: src.question_text,
        question_type: src.question_type,
        options: src.options,
        // observability: which row supplied the text, so a locale complaint is diagnosable from the payload
        served_language: language,
        served_from_question_id: r.is_sibling ? src.id : undefined,
      });
    }

    // ============ 3. THE BADGE COUNT, WHICH WAS COUNTING WHAT THE QUEUE NO LONGER SERVES ============
    //
    // This counted every due card with no filter at all -- not even the certification. So it reported cards
    // from OTHER certifications, and after the filters above it would also have reported the 149 retired and
    // 26 unapproved cards the queue now correctly refuses. A badge saying "175 due" over a queue that serves
    // none of them is worse than no badge: the learner clicks it and the page is empty.
    //
    // It carries the same four filters as the queue, so the number and the slate answer the same question.
    // LANGUAGE IS DELIBERATELY NOT AMONG THEM: a card whose sibling is missing is still due, it just cannot
    // be shown right now, and dropping it from the count would make the badge depend on the interface
    // locale. `skipped` below is what says how many of them there are.
    const { count: total_due, error: countErr } = await svc
      .from('fsrs_cards')
      .select('id, quiz_questions!inner(id)', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('quiz_questions.certification_id', body.certification_id)
      .eq('quiz_questions.status', 'approved')
      .eq('quiz_questions.pool', 'practice')
      .is('quiz_questions.retired_at', null)
      .lte('due', new Date().toISOString());
    if (countErr) throw new HttpError(500, 'could not count the due-review queue');

    return jsonResponse({
      total_due_now: total_due ?? 0,
      reviews,
      new_items,
      // REPORTED, not swallowed. A skipped review is a card the learner has earned and cannot be shown in
      // this locale; a caller that never sees the count cannot tell that from an empty queue.
      skipped_reviews: skipped.length,
      skipped_detail: skipped.length ? skipped : undefined,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
