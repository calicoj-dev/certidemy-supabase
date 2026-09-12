-- 299: create_practice_questions guarded task_id and not question_group_id
--
-- ONE PASTE. Pre- and post-conditions ABORT; one visible result set.
--
-- ============================================================================
-- DEPLOY THE EDGE FUNCTION FIRST. THIS ORDER IS NOT OPTIONAL.
-- ============================================================================
--
--   1. supabase functions deploy generate-practice-questions   (from ../)
--   2. THEN run this migration.
--
-- The only caller of this RPC is functions/generate-practice-questions, and
-- until the deployed copy sends question_group_id, this guard raises on every
-- call and practice generation is dead for every learner who presses the
-- button. Run in the other order and the outage is silent to us and immediate
-- for them.
--
-- This is the writer-list discipline in CLAUDE.md, in its live form: a
-- constraint added today does not fail the writers that predate it until one of
-- them next runs. Here the rare path is not rare - it is the whole feature.
--
-- ============================================================================
-- WHY
-- ============================================================================
--
-- The function raises on a null task_id:
--
--   if v_task_id is null then
--     raise exception 'every generated question must carry a task_id ...';
--
-- and takes a null question_group_id without comment:
--
--   v_group_id := nullif(elem->>'question_group_id', '')::uuid;
--
-- The asymmetry was not deliberate; it is simply the guard nobody wrote. Its
-- caller never sent the field, so between 2026-08-27 and 2026-09-11 it wrote 90
-- ungrouped English rows into AIE-I, on top of 30 es-419 rows from the same
-- path. The most recent landed the day before this was measured. The count in
-- CLAUDE.md said 15, Spanish-only, and had said so since 2026-08-25.
--
-- ============================================================================
-- A NULL GROUP IS EXCLUDED, NOT FLAGGED - WHICH IS WHY IT RAN FOR TWO WEEKS
-- ============================================================================
--
-- Measured across both repos on 2026-09-12. Every one of these keys on the
-- column, and every one of them SKIPS a row that lacks it:
--
--   verify-cert  trilingual.items         filters `g && n !== 3` - the `g &&`
--                                         drops the null key, so ungrouped rows
--                                         are never checked for 3-language
--                                         completeness
--   verify-cert  items.vocabulary exempt  quotedGroups is keyed per group, so
--                                         retired_vocabulary_intent='quoted' on
--                                         an ungrouped row is STORED AND INERT.
--                                         SM-AI-I has one such adjudication now
--   retranslate-retired-vocabulary.mjs    finds the English sibling with
--                                         .eq('question_group_id', <null>),
--                                         which matches no row in SQL. It does
--                                         ABORT loudly rather than skip, but
--                                         the row can never be re-translated
--   debias-positions.mjs                  `if (!r.question_group_id) continue`
--   publish-sample-questions.mjs          selects by an explicit group list, so
--                                         an ungrouped row is unreachable
--
-- Only verify-cert's items.grouped sees them, and it is the check that has been
-- reporting the number all along. NOT affected: cue.position, which filters
-- pool='secure' and never looked at these rows for a different reason.
--
-- 120 ungrouped rows are 120 rows that five tools step over.
--
-- ============================================================================
-- WHAT THE CALLER NOW SENDS, AND WHY A GROUP OF ONE IS CORRECT
-- ============================================================================
--
-- One question_group_id per generated question, minted in the function. The
-- trilingual fan-out is still unbuilt; this does not build it.
--
-- A group of one is the honest record of "this logical question exists in
-- English only". It is incomplete, and trilingual.items will now SAY so instead
-- of skipping it. That is the intended trade: a visible incompleteness beats a
-- silent exclusion. It also makes the row ADDRESSABLE - a later fan-out can
-- insert siblings into an existing group, which cannot be done to a null.
--
-- THE 120 EXISTING ROWS ARE NOT TOUCHED. This migration fixes the writer. What
-- to do with the rows it already wrote is a separate decision, and backfilling
-- them would hide the size of what happened.
--
-- ============================================================================
-- EVERY CALLER OF THIS FUNCTION - THERE ARE TWO, AND ONLY ONE IS BROKEN
-- ============================================================================
--
--   functions/generate-practice-questions/index.ts
--       ONE language per call, and sent NO question_group_id until 2026-09-12.
--       This is the writer that produced the 120 ungrouped rows.
--
--   scripts/backfill-practice.mjs
--       CORRECT ALREADY, and it is the model for what the other one should
--       eventually do: it mints one shared group id per logical question and
--       applies it to all three language rows before calling the RPC
--       ("Build the trilingual payload: one shared group id per logical
--       question"). Unconditional - there is no path through it that omits the
--       field. This is what produced AIE-I's balanced 170/170/170 practice
--       rows, and THE GUARD BELOW DOES NOT AFFECT IT.
--
-- The remaining grep matches are migrations 043, 044, 080, 098 and 298 - this
-- function's own history and its writer list - plus four prose documents.
--
-- A FIRST DRAFT OF THIS HEADER SAID backfill-practice.mjs "contains no insert
-- and does not call it either, contrary to the note in 298's header". Both
-- halves were wrong: it calls the RPC at line 460 and sends the group at line
-- 437, and 298's note - that the script contains no direct insert because it
-- goes through the RPC - was accurate. The error came from trusting one grep;
-- a second grep over both repos returned the file the first had not listed.
-- Two measurements, and the one that disagreed was the correct one.
--
-- Grants are preserved by `create or replace`: EXECUTE to PUBLIC, postgres and
-- service_role, unchanged. The function is NOT security definer and stays that
-- way, so RLS on quiz_questions continues to apply to the caller.
--
-- ============================================================================
-- GUARD 0 (PRE): IS THE NEW FUNCTION ACTUALLY DEPLOYED?
-- ============================================================================
--
-- SQL CANNOT READ EDGE FUNCTION SOURCE. Functions are deployed to the Functions
-- runtime, not stored in Postgres: there is no pg_catalog entry, no
-- information_schema view, nothing to inspect. A deploy cannot be verified
-- directly from here, and this guard does not pretend otherwise.
--
-- What it verifies instead is the DEPLOYED CODE'S OUTPUT, which does land in a
-- table. Before running this migration:
--
--   press "generate practice questions" ONCE in the app, on any certification
--
-- That exercises the deployed path end to end. The row it writes then answers
-- the question: new code stamps a question_group_id, old code leaves it null.
--
-- BOTH HALVES ARE ASSERTED, and the first one is the important one:
--   positive  at least one practice row exists inside the window - so an
--             EMPTY result aborts instead of passing. "Nobody generated" and
--             "the deploy worked" produce the same zero, and a guard that
--             cannot tell them apart is the silent-success failure this
--             codebase keeps paying for
--   negative  none of those rows has a null group
--
-- ASSUMPTION, STATED: the recent rows came from the app's generate button and
-- not from scripts/backfill-practice.mjs, which also writes grouped practice
-- rows through this same RPC and would satisfy the check without proving
-- anything about the deploy. If the backfill script was run in the last half
-- hour, widen nothing - just re-run the generate button and this guard.
do $deploy$
declare n_recent int; n_null int;
begin
  select count(*), count(*) filter (where q.question_group_id is null)
    into n_recent, n_null
    from public.quiz_questions q
   where q.pool = 'practice'
     and q.created_at > now() - interval '30 minutes';

  if n_recent = 0 then
    raise exception using
      message = 'no practice row written in the last 30 minutes',
      detail  = 'this guard cannot see edge function source; it reads what the deployed code wrote',
      hint    = 'press generate practice questions once in the app, then re-run this paste';
  end if;

  if n_null > 0 then
    raise exception using
      message = 'the deployed function is still writing ungrouped rows',
      detail  = 'the old copy is live - applying the guard now would kill practice generation',
      hint    = 'redeploy generate-practice-questions, then generate once more';
  end if;

  raise notice 'deploy ok: % recent practice row(s), 0 ungrouped', n_recent;
end
$deploy$;


-- ============================================================================
-- GUARD 1 (PRE)
-- ============================================================================
begin;

do $pre$
declare n_guard int;
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'create_practice_questions') then
    raise exception using message = 'create_practice_questions does not exist';
  end if;
  select count(*) into n_guard from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'create_practice_questions'
     and p.prosrc like '%must carry a question_group_id%';
  if n_guard > 0 then
    raise exception using message = '299 has already run';
  end if;
  raise notice 'pre ok';
end
$pre$;


create or replace function public.create_practice_questions(p_questions jsonb)
returns uuid[]
language plpgsql
as $fn$
declare
  elem       jsonb;
  new_id     uuid;
  v_task_id  uuid;
  v_group_id uuid;
  out_ids    uuid[] := '{}';
begin
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' then
    raise exception 'p_questions must be a JSON array';
  end if;

  for elem in select value from jsonb_array_elements(p_questions)
  loop
    v_task_id := nullif(elem->>'task_id', '')::uuid;
    if v_task_id is null then
      raise exception 'every generated question must carry a task_id (reachability rule)';
    end if;
    v_group_id := nullif(elem->>'question_group_id', '')::uuid;
    -- ADDED 299. Symmetric with task_id above. A null group is EXCLUDED rather
    -- than flagged by five tools that key on it, so it cannot be caught later.
    if v_group_id is null then
      raise exception using
        message = 'every generated question must carry a question_group_id',
        detail  = 'a null group is skipped by five group-keyed tools',
        hint    = 'mint one per question; a group of one is correct for a single-language item';
    end if;

    insert into public.quiz_questions (
      certification_id,
      task_id,
      question_group_id,
      question_text,
      question_type,
      options,
      correct_answer,
      explanation,
      difficulty,
      bloom_level,             -- ADDED: was dropped on the floor; the column default
                               -- silently stamped 93.6% of the practice pool
      bank_revision,           -- ADDED: which cognitive model wrote this item
      language,
      pool,
      is_exam_scope,
      visibility
    )
    values (
      (elem->>'certification_id')::uuid,
      v_task_id,
      v_group_id,
      elem->>'question_text',
      (elem->>'question_type')::question_type,
      elem->'options',
      elem->'correct_answer',
      nullif(elem->>'explanation', ''),
      (elem->>'difficulty')::smallint,
      -- If the caller omits bloom_level, take it from the task rather than from a
      -- column default. The task IS the declaration; there is nowhere else it can
      -- legitimately come from.
      coalesce(
        nullif(elem->>'bloom_level', '')::bloom_level,
        (select t.bloom_level from public.tasks t where t.id = v_task_id)
      ),
      coalesce(nullif(elem->>'bank_revision', ''), 'v2-jta'),
      coalesce(nullif(elem->>'language', ''), 'en'),
      'practice',
      false,
      'private'
    )
    returning id into new_id;

    insert into public.question_concepts (question_id, concept_id)
    select new_id, tc.concept_id
    from public.task_concepts tc
    where tc.task_id = v_task_id
    on conflict do nothing;

    out_ids := out_ids || new_id;
  end loop;

  return out_ids;
end;
$fn$;


-- ============================================================================
-- GUARD 2 (POST)
-- ============================================================================
--
-- BEHAVIOUR, NOT TEXT. A grep of prosrc proves the words are present, not that
-- the function refuses anything. Both directions are asserted in a
-- subtransaction that is always rolled back, so nothing is written.
do $post$
declare
  v_cert uuid; v_task uuid; v_refused boolean := false; v_ids uuid[];
begin
  select q.certification_id, q.task_id into v_cert, v_task
    from public.quiz_questions q where q.task_id is not null limit 1;
  if v_cert is null then
    raise exception using message = 'no row to build a probe from';
  end if;

  -- NEGATIVE HALF: a payload with no question_group_id must be REFUSED.
  begin
    select public.create_practice_questions(jsonb_build_array(jsonb_build_object(
      'certification_id', v_cert, 'task_id', v_task,
      'question_text', 'probe 299', 'question_type', 'single_choice',
      'options', jsonb_build_array(jsonb_build_object('id','a','text','x'),
                                   jsonb_build_object('id','b','text','y')),
      'correct_answer', jsonb_build_array('a'), 'difficulty', 1)))
      into v_ids;
  exception
    when others then v_refused := true;
  end;
  if not v_refused then
    raise exception using message = 'the guard did not refuse a null question_group_id';
  end if;

  -- POSITIVE HALF: the same payload WITH a group must still be accepted. A
  -- guard that refuses everything would pass the negative half alone.
  begin
    select public.create_practice_questions(jsonb_build_array(jsonb_build_object(
      'certification_id', v_cert, 'task_id', v_task,
      'question_group_id', gen_random_uuid(),
      'question_text', 'probe 299', 'question_type', 'single_choice',
      'options', jsonb_build_array(jsonb_build_object('id','a','text','x'),
                                   jsonb_build_object('id','b','text','y')),
      'correct_answer', jsonb_build_array('a'), 'difficulty', 1)))
      into v_ids;
    if v_ids is null or array_length(v_ids, 1) <> 1 then
      raise exception using message = 'a valid payload was not accepted';
    end if;
    -- Undo the probe insert. It is inside this block only.
    delete from public.question_concepts where question_id = any(v_ids);
    delete from public.quiz_questions where id = any(v_ids);
  end;

  if exists (select 1 from public.quiz_questions where question_text = 'probe 299') then
    raise exception using message = 'a probe row survived';
  end if;
  raise notice 'post ok: refuses null, accepts valid, left nothing behind';
end
$post$;

commit;


-- ============================================================================
-- THE VISIBLE RESULT SET
-- ============================================================================
select c.code,
       count(*) filter (where q.question_group_id is null) as ungrouped_rows,
       count(*) as practice_rows
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where q.pool = 'practice' and q.retired_at is null and q.status = 'approved'
group by 1 having count(*) filter (where q.question_group_id is null) > 0
order by 2 desc;
-- EXPECT: AIE-I with 120. This migration does not change that number - it stops
-- it growing. If a later run shows MORE than 120, the deploy did not take.
--
--
-- ============================================================================
-- ROLLBACK, IF PRACTICE GENERATION BREAKS ANYWAY
-- ============================================================================
--
-- The guard lives inside the function body, so reverting is one statement: run
-- the function definition from migration 098 (the last one before this), which
-- is byte-identical to this one minus the question_group_id block. Generation
-- resumes immediately and starts writing ungrouped rows again.
--
-- Do that FIRST and diagnose afterwards. An outage here is every learner on
-- every certification who presses the button, not just AIE-I.


-- ============================================================================
-- POST-RUN NOTE, 2026-09-12. RAN CLEAN.
-- ============================================================================
--
-- prosrc grew 2306 -> 2790 and carries the guard. Guard 0 passed on five
-- SM-AI-II practice rows written at 18:15:59.862299+00 - five rows, FIVE
-- DISTINCT GROUPS, zero ungrouped, which is the per-question mint rather than
-- one group per call.
--
-- GUARD 0'S HINT IS WORDED WRONG AND IS LEFT AS IT RAN. It says "press generate
-- practice questions once in the app". There is no such button. The trigger is
-- the quiz MODE PICKER (components/quiz/quiz-mode-picker.tsx): the third mode,
-- "Weak concepts" / "Conceptos debiles" / "Conceitos fracos", calls
-- fetchWeakConceptPractice(..., 5, lang), which generates 5 questions and then
-- starts a session. "Practice" and "Review due" read existing rows and write
-- nothing.
--
-- That is why three quizzes in two languages produced no rows and a fourth
-- produced five: the modes are indistinguishable afterwards, because
-- quiz_sessions.kind records 'practice' for ALL THREE. The session at
-- 18:16:00.355873 is the weak-concepts one - it starts half a second AFTER the
-- questions it plays were written, which is the ordering fetchWeakConceptPractice
-- documents: generate + persist, fetch back, create session.
--
-- If this guard is ever reused, say "start a Weak concepts quiz" instead.
