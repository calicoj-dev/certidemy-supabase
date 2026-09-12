-- 301: the RPC's INSERT has a fixed column list, so item_origin never arrives
--
-- ONE PASTE. Pre- and post-conditions ABORT; one visible result set.
--
-- ============================================================================
-- WHY THIS EXISTS AT ALL
-- ============================================================================
--
-- Migration 300 added quiz_questions.item_origin and backfilled it. The obvious
-- next step is "make generate-practice-questions stamp item_origin='generated'
-- on what it writes", and doing ONLY that would have been a no-op that looked
-- done.
--
-- create_practice_questions builds its INSERT from an explicit column list:
--
--   insert into public.quiz_questions (
--     certification_id, task_id, question_group_id, question_text,
--     question_type, options, correct_answer, explanation, difficulty,
--     bloom_level, bank_revision, language, pool, is_exam_scope, visibility)
--
-- item_origin is not in it. A caller adding the field to its payload gets NO
-- ERROR - jsonb carries whatever it likes - and the row takes the column
-- default 'authored'. The function would look like it stamped provenance and
-- would write the wrong value on every generated row from then on.
--
-- Confirmed against prosrc before writing this, not assumed:
--   select prosrc ~* 'item_origin' from pg_proc where proname =
--     'create_practice_questions';   -> false
--
-- ============================================================================
-- THE DEFAULT IS 'authored', NOT 'generated'
-- ============================================================================
--
-- Two callers reach this RPC and they are not the same kind of writer:
--
--   generate-practice-questions   ONE language per call, no siblings ever.
--                                 Sends 'generated'. This is the path the
--                                 trilingual exemption is about.
--   backfill-practice.mjs         Writes the full trilingual set with a shared
--                                 group. Sends nothing, so its rows stay
--                                 'authored', which is what migration 300's
--                                 backfill already recorded for them.
--
-- So the coalesce defaults to 'authored' rather than 'generated': a caller that
-- does not declare provenance must not be silently labelled as the one path
-- that earns an exemption. Marking a row 'generated' GRANTS IT AN EXEMPTION
-- from trilingual.items, so the safe default is the one that earns nothing.
--
-- A NOTE ON THE WORD, because the column will outlive this migration:
-- 'generated' here means THE SINGLE-LANGUAGE GENERATION PATH, not "a model was
-- involved". backfill-practice.mjs also drafts with a model and its rows are
-- 'authored'. If the distinction someone wants later is AI-drafted vs
-- human-written, that is a different column and this one will not answer it.
-- The comment on the column says the same thing.
--
-- ============================================================================
-- WRITERS - UNCHANGED FROM 300, WHICH BUILT THE LIST FROM THREE MEASUREMENTS
-- ============================================================================
--
-- This migration changes ONE function body and adds no constraint, so nothing
-- that writes quiz_questions today can start failing. The two RPC callers are
-- named above; the six direct application writers and the two other RPCs
-- (retire_item, retire_item_bank) do not touch this column and are unaffected.
--
-- ============================================================================
-- GUARD 1 (PRE)
-- ============================================================================
begin;

do $pre$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='quiz_questions'
                   and column_name='item_origin') then
    raise exception using message = '300 has not run', hint = 'item_origin does not exist';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='public' and p.proname='create_practice_questions'
               and p.prosrc ~* 'item_origin') then
    raise exception using message = '301 has already run';
  end if;
  -- 299's guard must still be there. If it is not, something replaced the
  -- function between then and now and this paste would silently drop it.
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='create_practice_questions'
                   and p.prosrc like '%must carry a question_group_id%') then
    raise exception using message = '299 guard missing from the live function',
      hint = 'do not run this paste - reconcile the function first';
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
  v_origin   text;
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
    -- than flagged by five group-keyed tools, so it cannot be caught later.
    if v_group_id is null then
      raise exception using
        message = 'every generated question must carry a question_group_id',
        detail  = 'a null group is skipped by five group-keyed tools',
        hint    = 'mint one per question; a group of one is correct for a single-language item';
    end if;
    -- ADDED 301. Defaults to 'authored': a caller that does not declare
    -- provenance must not be labelled as the path that earns an exemption.
    v_origin := coalesce(nullif(elem->>'item_origin', ''), 'authored');

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
      visibility,
      item_origin              -- ADDED 301
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
      'private',
      v_origin
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
-- BEHAVIOUR, NOT TEXT. The failure this migration exists to prevent is a field
-- that is ACCEPTED AND IGNORED, which no grep of prosrc can detect - the words
-- would be present either way. So both directions are written and read back, in
-- a subtransaction that always rolls back.
do $post$
declare
  v_cert uuid; v_task uuid; v_ids uuid[]; v_got text; v_refused boolean := false;
begin
  select q.certification_id, q.task_id into v_cert, v_task
    from public.quiz_questions q where q.task_id is not null limit 1;
  if v_cert is null then
    raise exception using message = 'no row to build a probe from';
  end if;

  -- POSITIVE: a declared origin must ARRIVE. This is the whole point.
  select public.create_practice_questions(jsonb_build_array(jsonb_build_object(
    'certification_id', v_cert, 'task_id', v_task,
    'question_group_id', gen_random_uuid(), 'item_origin', 'generated',
    'question_text', 'probe 301 a', 'question_type', 'single_choice',
    'options', jsonb_build_array(jsonb_build_object('id','a','text','x'),
                                 jsonb_build_object('id','b','text','y')),
    'correct_answer', jsonb_build_array('a'), 'difficulty', 1)))
    into v_ids;
  select item_origin into v_got from public.quiz_questions where id = v_ids[1];
  if v_got <> 'generated' then
    raise exception using message = 'a declared item_origin did not arrive',
      detail = format('row reads %s', v_got);
  end if;
  delete from public.question_concepts where question_id = any(v_ids);
  delete from public.quiz_questions where id = any(v_ids);

  -- NEGATIVE 1: an UNdeclared origin must default to authored, never generated.
  select public.create_practice_questions(jsonb_build_array(jsonb_build_object(
    'certification_id', v_cert, 'task_id', v_task,
    'question_group_id', gen_random_uuid(),
    'question_text', 'probe 301 b', 'question_type', 'single_choice',
    'options', jsonb_build_array(jsonb_build_object('id','a','text','x'),
                                 jsonb_build_object('id','b','text','y')),
    'correct_answer', jsonb_build_array('a'), 'difficulty', 1)))
    into v_ids;
  select item_origin into v_got from public.quiz_questions where id = v_ids[1];
  if v_got <> 'authored' then
    raise exception using message = 'an undeclared origin did not default to authored',
      detail = format('row reads %s', v_got);
  end if;
  delete from public.question_concepts where question_id = any(v_ids);
  delete from public.quiz_questions where id = any(v_ids);

  -- NEGATIVE 2: a junk origin must be REFUSED by the CHECK, not written.
  begin
    select public.create_practice_questions(jsonb_build_array(jsonb_build_object(
      'certification_id', v_cert, 'task_id', v_task,
      'question_group_id', gen_random_uuid(), 'item_origin', 'invented',
      'question_text', 'probe 301 c', 'question_type', 'single_choice',
      'options', jsonb_build_array(jsonb_build_object('id','a','text','x'),
                                   jsonb_build_object('id','b','text','y')),
      'correct_answer', jsonb_build_array('a'), 'difficulty', 1)))
      into v_ids;
  exception
    when check_violation then v_refused := true;
  end;
  if not v_refused then
    raise exception using message = 'an invalid item_origin was accepted';
  end if;

  -- NEGATIVE 3: 299's guard must still refuse a missing group.
  v_refused := false;
  begin
    select public.create_practice_questions(jsonb_build_array(jsonb_build_object(
      'certification_id', v_cert, 'task_id', v_task, 'item_origin', 'generated',
      'question_text', 'probe 301 d', 'question_type', 'single_choice',
      'options', jsonb_build_array(jsonb_build_object('id','a','text','x'),
                                   jsonb_build_object('id','b','text','y')),
      'correct_answer', jsonb_build_array('a'), 'difficulty', 1)))
      into v_ids;
  exception
    when others then v_refused := true;
  end;
  if not v_refused then
    raise exception using message = '299 guard was lost by this replacement';
  end if;

  if exists (select 1 from public.quiz_questions where question_text like 'probe 301%') then
    raise exception using message = 'a probe row survived';
  end if;
  raise notice 'post ok: declared arrives, undeclared defaults authored, junk refused, 299 intact';
end
$post$;

commit;


-- ============================================================================
-- THE VISIBLE RESULT SET
-- ============================================================================
select item_origin, count(*) as rows
from public.quiz_questions group by 1 order by 1;
-- EXPECT: authored 27974, generated 145. UNCHANGED by this migration - it
-- changes what future writes can say, not what past writes said.
--
-- DEPLOY generate-practice-questions AFTER this, so it can send the field. In
-- this direction nothing breaks either way: before the deploy the function
-- sends nothing and its rows default to 'authored'; after it, they say
-- 'generated'. The only cost of the gap is rows written in between carrying the
-- wrong provenance - which is the is_provisional failure in miniature, so do
-- not leave the gap open.
