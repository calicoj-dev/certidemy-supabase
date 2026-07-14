-- ============================================================================
-- 098_enforce_item_bloom_equals_task_bloom.sql
--
-- PUT THE RULE IN THE DATABASE.
--
-- Today we found that the item generator never read the tasks table, that four of five
-- JTAs declared cognitive levels contradicting their own KSAs, that the verifier could
-- not SEE bloom_level, and that unordered pagination was corrupting the generators'
-- deficit counts. Four independent failures, all of the same shape: A RULE THAT LIVED
-- ONLY IN PROSE, ENFORCED NOWHERE.
--
-- So this migration stops relying on any script getting it right.
--
--     item.bloom_level MUST EQUAL its task's declared bloom_level.
--
-- Enforced by trigger, on every insert, from every path - the RPC, a script, a hand-run
-- statement in the SQL editor. If an item does not test its task at the level the
-- job-task analysis declares, the database refuses to store it.
--
-- WHY BOTH POOLS, WHICH REVERSES AN EARLIER DECISION.
--
-- We initially exempted the PRACTICE pool, reasoning that scaffolding below the task's
-- level is legitimate teaching and that ISO/IEC 17024 governs the examination, not the
-- study material. Both halves of that are true. The conclusion was still wrong, and the
-- evidence is sitting in the table:
--
--     practice  2_understand   5795   (93.6%)
--     practice  3_apply         387
--     practice  4_analyze         6
--     practice  1_remember        0
--
-- Practice items carry no bloom_level at all - the RPC never wrote the column, so 93.6%
-- of the pool holds whatever the column default happened to be. Nobody CHOSE that
-- distribution. It is not scaffolding; it is an unset field.
--
-- And it has a victim: the READINESS CALCULATOR predicts a candidate's exam performance
-- from their practice performance. It has been scoring against a near-constant - which
-- is why two correct answers on one lesson could move a learner to "40% ready". Worse,
-- a practice pool that is 94% Understand cannot possibly predict a secure exam that is
-- 71% Apply (SD-AI-I). A candidate drills comprehension, feels prepared, and sits an
-- exam demanding application. That is not an abstract validity concern. It is a person
-- who paid us walking into a wall.
--
-- The lessons already scaffold - checkpoints, widgets, in-lesson quizzes are where a
-- learner is walked up from recall to application. The practice pool is not teaching.
-- It is EXAM SIMULATION, and its only job is to predict. So it is held to the same rule.
--
-- ONE RULE, BOTH POOLS. Verifiable in a single query, with no "adequate coverage"
-- weasel-clause for anyone to interpret their way around.
--
-- The existing 11,135 rows are grandfathered: the trigger fires on INSERT, and on UPDATE
-- only when task_id or bloom_level actually changes. That lets us retire the old bank
-- without tripping the guard, while making the bad state unreachable for anything new.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. The guard
-- ---------------------------------------------------------------------------
create or replace function public.enforce_item_bloom_matches_task()
returns trigger
language plpgsql
as $$
declare
  v_task_bloom text;
  v_task_code  text;
begin
  -- An item with no task cannot be checked. Items with no task are a separate defect
  -- (the reachability rule), enforced elsewhere.
  if new.task_id is null then
    return new;
  end if;

  select t.bloom_level::text, t.code
    into v_task_bloom, v_task_code
  from public.tasks t
  where t.id = new.task_id;

  if v_task_bloom is null then
    return new;   -- task declares no level; nothing to enforce against
  end if;

  if new.bloom_level is null then
    raise exception using
      errcode = 'check_violation',
      message = format('Item for task %s carries no bloom_level.', v_task_code),
      detail  = format('Its task declares %s. An item that does not state its cognitive level cannot be shown to test the competence the JTA declares.', v_task_bloom),
      hint    = 'Stamp bloom_level FROM THE TASK (tasks.bloom_level), never from a difficulty curve.';
  end if;

  if new.bloom_level::text <> v_task_bloom then
    raise exception using
      errcode = 'check_violation',
      message = format('Item bloom_level (%s) does not equal its task''s declared level (%s) for task %s.',
                       new.bloom_level, v_task_bloom, v_task_code),
      detail  = 'Testing ABOVE the declared level is construct-irrelevant variance: the candidate is failed on competence the credential never claimed to require. Testing BELOW it is construct under-representation: the credential attests competence it never measured. Both are validity failures.',
      hint    = 'The task''s declared bloom_level is the single cognitive declaration. If the item genuinely tests a different competence, DECLARE THAT COMPETENCE AS ITS OWN TASK - do not relabel the item.';
  end if;

  return new;
end;
$$;

-- Fires on INSERT always; on UPDATE only when the cognitive claim actually changes.
-- This grandfathers the 11,135 pre-existing rows so the old bank can still be retired,
-- while making the bad state unreachable for anything written from here on.
drop trigger if exists trg_item_bloom_matches_task on public.quiz_questions;
create trigger trg_item_bloom_matches_task
  before insert or update of bloom_level, task_id on public.quiz_questions
  for each row execute function public.enforce_item_bloom_matches_task();

comment on function public.enforce_item_bloom_matches_task() is
  'item.bloom_level == task.bloom_level, both pools, every insert path. The rule lived in prose for eight months and was violated by 58% of the secure bank and 100% of the practice bank. It lives in the database now.';

-- ---------------------------------------------------------------------------
-- 2. Teach the practice RPC to carry bloom_level and bank_revision
--
-- It listed its insert columns explicitly and included neither - so every practice item
-- ever written silently took the column default. That is the whole explanation for
-- "93.6% of practice is 2_understand".
-- ---------------------------------------------------------------------------
create or replace function public.create_practice_questions(p_questions jsonb)
returns uuid[]
language plpgsql
as $function$
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
$function$;

-- ---------------------------------------------------------------------------
-- 3. Prove the guard bites
--
-- The test CLONES AN EXISTING ROW and flips only its bloom_level, rather than
-- fabricating a row from literals. A test that invents its own enum values is a test
-- that can fail for reasons having nothing to do with what it claims to prove.
-- ---------------------------------------------------------------------------
do $$
declare
  src    public.quiz_questions%rowtype;
  v_task uuid;
  v_wrong text;
  caught boolean := false;
begin
  -- borrow a real item that carries a task with a declared level
  select q.* into src
  from public.quiz_questions q
  join public.tasks t on t.id = q.task_id
  where t.bloom_level is not null
  limit 1;

  if src.id is null then
    raise notice 'GUARD TEST SKIPPED: no existing item with a levelled task to clone.';
    return;
  end if;

  select case when t.bloom_level::text = '2_understand' then '4_analyze' else '2_understand' end
    into v_wrong
  from public.tasks t where t.id = src.task_id;

  begin
    insert into public.quiz_questions
      (certification_id, task_id, question_text, question_type, options, correct_answer,
       difficulty, bloom_level, language, pool, is_exam_scope, visibility)
    values
      (src.certification_id, src.task_id, 'GUARD TEST - must not persist', src.question_type,
       src.options, src.correct_answer, src.difficulty, v_wrong::bloom_level,
       src.language, 'practice', false, 'private');
    raise exception 'GUARD FAILED: a mis-levelled item was accepted.';
  exception
    when check_violation then
      caught := true;
  end;

  if caught then
    raise notice '--------------------------------------------------------------';
    raise notice 'GUARD ACTIVE: the database now refuses any item whose cognitive';
    raise notice 'level does not equal its task''s declared level. Both pools.';
    raise notice '--------------------------------------------------------------';
  end if;
end $$;

-- What the trigger will find when we regenerate: the current state of the bank.
select q.pool,
       count(*)                                                             as items,
       count(*) filter (where q.bloom_level::text = t.bloom_level::text)    as matches_task,
       count(*) filter (where q.bloom_level::text <> t.bloom_level::text)   as violates,
       round(100.0 * count(*) filter (where q.bloom_level::text <> t.bloom_level::text)
             / nullif(count(*), 0), 1)                                      as violation_pct
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
group by q.pool
order by q.pool;
