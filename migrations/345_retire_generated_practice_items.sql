-- 345_retire_generated_practice_items.sql
--
-- Retire every practice item written by generate-practice-questions before it
-- shared the item rules. RETIRE, NOT DELETE. 2,249 attempt rows stay.
--
-- ============ WHAT THEY ARE ============
--
-- 160 items, 158 live, written 2026-08-20 .. 2026-09-14 by
-- functions/generate-practice-questions -- created 2026-05-20 in this repo's
-- initial commit, five to seven weeks BEFORE item-pipeline.mjs (06-26) and
-- item-profile.mjs / item-grounding.mjs (07-11) existed. It was never a
-- divergence from the shared rules; it predated them, and nothing moved it
-- across until 2026-09-18.
--
-- So these items were written with no grounding, the Level I difficulty curve
-- regardless of tier, no Level II contract, and -- found last -- no job-task
-- analysis at all: draftSystem depends on (kind, certName, tier, bloom_level),
-- and the task statement, criticality and KSA travel in the USER prompt via
-- taskBlock, which that function never called. It asked for items "measuring
-- this task" without ever naming the task.
--
-- ============ GRADED AGAINST THE AUTHORED POOL, SAME CODE ============
--
--                        n       validator   cue-guard FAIL   true_false
--   generated          158         67.7%          53.8%         25.9%
--   authored        15,190         83.1%           9.5%          0.0%
--
-- Per certification, so subject is not the variable: AIE-I 55.4 vs 6.5,
-- SM-AI-I 40.0 vs 4.1, SM-AI-II 62.5 vs 14.3. Four to ten times worse.
-- `true_false` is the cleanest signal: 26 percent of these against ZERO of
-- 15,190 authored items -- the script pipeline has never emitted a two-option
-- item.
--
-- Nothing exceeds its certification's ceiling or its own task's declared level,
-- and no tier-2 option-floor violation survives (309 retired those two).
--
-- ============ AND THEY WERE NOT ONE LEARNER'S HISTORY ============
--
-- This was checked rather than assumed, because "the click that created them
-- also played them" would have made them private and harmless.
--
--   quiz_questions has NO created_by and NO user_id. Nothing can filter by
--   creator because the information was never recorded.
--
--   149 of 160 have been served. 40 reached a learner OTHER than the first one
--   to see them, across 8 distinct learners.
--
--   49 distinct generated items appeared in 16 SIMULATED CERTIFICATION EXAMS
--   for 6 learners. Someone judged their readiness on a set where 54 percent
--   fail the cue guard.
--
-- The control matters: authored practice items show the same sharing -- 199 of
-- 764 served items reached 2+ learners, max 10 on one item -- so this is real
-- traffic across 21 learners, not an artefact of a quiet platform.
--
-- ============ RETIREMENT ALONE IS NOT ENOUGH, AND THAT IS THE OTHER HALF =====
--
-- `generate-mock-exam` filters `.is("retired_at", null)`, so this removes them
-- from the simulator -- the route that carried the 16 exams.
--
-- `get-review-batch`'s new-item query does NOT. It selects practice items by
-- certification, language and not-already-seen, and filters NEITHER `status`
-- NOR `retired_at`. Measured 2026-09-18: 132 items are reachable by it that
-- should not be -- 122 rejected-and-retired, 10 approved-and-retired, every
-- one of them an item somebody already decided to withdraw.
--
-- So the function gains `.eq('status','approved').is('retired_at', null)` in
-- the same change. Without it this migration is cosmetic for that path and the
-- 158 keep arriving as "new" items.
--
-- ============ THIS FILE ABORTED ONCE, ON ITS OWN NEGATIVE ASSERTION ========
--
-- The first run raised "secure pool is now 12511 live item(s), expected 12637"
-- and wrote nothing. The pool had not moved. THE LITERAL WAS THE WRONG
-- POPULATION: 12637 is the TOTAL number of secure rows, measured earlier that
-- day with no `retired_at` predicate, and it was written into an assertion
-- about LIVE rows. 126 secure items have been retired since 2026-08-10, so
-- 12637 - 126 = 12511 and the database was right.
--
-- Those 126 are a deliberate pass, checked rather than assumed: one batch on
-- 2026-08-10, status rejected, bank_revision v2-jta, no supersedes_id, one
-- reason on all of them -- "Two-option item: a guesser scores 50%. No minimum
-- option count existed in LESSON_AUTHORING_SPEC or in any verifier". Perfectly
-- trilingual: 11/11/11 SD-AI-I, 11/11/11 SM-AI-I, 8/8/8 SPO-AI-I, 5/5/5
-- AIHR-I, 3/3/3 ISMS-F, 2/2/2 AIE-I and AISM-I. 42 sibling groups x 3
-- languages.
--
-- SO EVERY COUNT IN THIS FILE IS NOW CAPTURED BEFORE AND COMPARED AFTER. The
-- property is "unchanged", never "equals a number somebody wrote down
-- yesterday" -- a literal in an assertion is a second copy of a fact that
-- lives in the database, which is the whole argument for the migration probe.
-- It also means a weak-concepts click between writing this and running it
-- cannot abort it: the set is "all live generated practice items", not 158.
--
-- FIFTH INSTANCE of the population error, and the sharpest: written into 345
-- by the author who had just recorded the fourth in CLAUDE.md as part of 344.
-- Reading a number off one query and asserting it of another is not a lapse of
-- care, it is what happens by default.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_live_before   int;
  n_ret_before    int;
  n_att_before    int;
  n_secure_before int;
  n_live_after    int;
  n_ret_after     int;
  n_att_after     int;
  n_auth_ret      int;
  n_secure_after  int;
  breaches        text;
begin

  -- ----------------------------------------------- pre-conditions
  -- CAPTURED, NOT ASSERTED. The set is "every live generated practice item",
  -- whatever that number is when this runs. 158 on 2026-09-18; a single
  -- weak-concepts click adds five more, and that must not abort the migration.
  select count(*) into n_live_before
    from public.quiz_questions
   where item_origin = 'generated' and pool = 'practice' and retired_at is null;
  select count(*) into n_ret_before
    from public.quiz_questions
   where item_origin = 'generated' and pool = 'practice' and retired_at is not null;
  select count(*) into n_att_before from public.quiz_attempts;
  select count(*) into n_secure_before
    from public.quiz_questions where pool = 'secure' and retired_at is null;

  -- The only thing worth refusing: nothing to do. A migration that retires
  -- zero rows and reports success is the silent-success failure.
  if n_live_before = 0 then
    raise exception 'no live generated practice items to retire'
      using hint = 'Already run, or item_origin is not being stamped.';
  end if;
  raise notice 'retiring % live generated practice item(s); % already retired; % attempt row(s); % live secure',
    n_live_before, n_ret_before, n_att_before, n_secure_before;

  -- THE FLOOR, BEFORE. Every task that carries a generated item must keep at
  -- least 10 approved live practice items per language WITHOUT them. Asserted
  -- here rather than trusted: this is the only thing that makes retiring
  -- safe without regenerating.
  select string_agg(x.cert || '/' || x.task || '/' || x.lang || ': ' || x.after_n, ', ')
    into breaches
    from (
      select c.code as cert, t.code as task, q.language as lang,
             count(*) filter (where q.item_origin <> 'generated') as after_n
        from public.quiz_questions q
        join public.tasks t          on t.id = q.task_id
        join public.certifications c on c.id = q.certification_id
       where q.pool = 'practice' and q.status = 'approved' and q.retired_at is null
       group by c.code, t.code, q.language
      having count(*) filter (where q.item_origin = 'generated') > 0
         and count(*) filter (where q.item_origin <> 'generated') < 10
    ) x;
  if breaches is not null then
    raise exception 'retiring would drop these task/language pairs below the practice floor of 10: %', breaches
      using hint = 'Regenerate first, or retire only the surplus.';
  end if;

  -- ----------------------------------------------- the retirement
  update public.quiz_questions set
    retired_at    = now(),
    retire_reason = 'Written by generate-practice-questions before it shared the item rules: no grounding, the Level I difficulty curve regardless of tier, no Level II contract, and no job-task analysis in the prompt at all. Graded against the authored pool with the same code: cue-guard failure 54 pct against 9.5 pct, true_false 26 pct against 0. 49 of them reached 16 simulated certification exams for 6 learners. Retired 2026-09-18; attempt history preserved.'
  where item_origin = 'generated'
    and pool = 'practice'
    and retired_at is null;

  -- ===================== POST-CONDITIONS =====================

  -- 1. POSITIVE. None left in circulation.
  select count(*) into n_live_after
    from public.quiz_questions
   where item_origin = 'generated' and pool = 'practice' and retired_at is null;
  if n_live_after <> 0 then
    raise exception '% generated practice item(s) are still live', n_live_after;
  end if;

  select count(*) into n_ret_after
    from public.quiz_questions
   where item_origin = 'generated' and pool = 'practice' and retired_at is not null;
  if n_ret_after <> n_ret_before + n_live_before then
    raise exception 'retired count is % , expected % (% already + % just now)',
      n_ret_after, n_ret_before + n_live_before, n_ret_before, n_live_before;
  end if;

  -- 2. NEGATIVE, AND IT IS THE POINT: NOTHING WAS DELETED. A retirement that
  --    took the learner history with it would be worse than serving the items.
  select count(*) into n_att_after from public.quiz_attempts;
  if n_att_after <> n_att_before then
    raise exception 'quiz_attempts moved from % to % -- this migration must not touch history',
      n_att_before, n_att_after;
  end if;
  raise notice 'ok: % attempt row(s) preserved', n_att_after;

  -- 3. NEGATIVE. No authored item was caught by the predicate.
  select count(*) into n_auth_ret
    from public.quiz_questions
   where item_origin <> 'generated'
     and pool = 'practice'
     and retired_at >= now() - interval '1 minute';
  if n_auth_ret <> 0 then
    raise exception '% non-generated item(s) were retired by this migration', n_auth_ret;
  end if;

  -- 4. NEGATIVE. The secure pool was not touched at all.
  select count(*) into n_secure_after
    from public.quiz_questions where pool = 'secure' and retired_at is null;
  if n_secure_after <> n_secure_before then
    raise exception 'live secure items moved from % to % -- this migration must not touch the secure pool',
      n_secure_before, n_secure_after;
  end if;
  raise notice 'ok: secure pool unchanged at % live item(s)', n_secure_after;

  -- 5. AND THE FLOOR HOLDS AFTER THE FACT, measured on the live rows rather
  --    than predicted from the ones about to move.
  select string_agg(x.cert || '/' || x.task || '/' || x.lang || ': ' || x.n, ', ')
    into breaches
    from (
      select c.code as cert, t.code as task, q.language as lang, count(*) as n
        from public.quiz_questions q
        join public.tasks t          on t.id = q.task_id
        join public.certifications c on c.id = q.certification_id
       where q.pool = 'practice' and q.status = 'approved' and q.retired_at is null
         and c.code in ('AIE-I','SM-AI-I','SM-AI-II')
       group by c.code, t.code, q.language
      having count(*) < 10
    ) x;
  if breaches is not null then
    raise exception 'below the practice floor of 10 after retirement: %', breaches;
  end if;

  raise notice '345 ok: % retired, 0 live, % attempt rows kept, floor holds',
    n_live_before, n_att_after;
  raise notice 'NEXT: deploy get-review-batch -- it filters neither status nor retired_at';
end
$mig$;
