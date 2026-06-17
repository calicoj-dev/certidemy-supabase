-- Migration 043: atomic, reachability-safe practice-question creation.
--
-- Why this exists
-- ---------------
-- The practice engine (fetchConceptPractice) can ONLY find a question by
-- walking concept -> question_concepts -> question. A question linked solely
-- by task_id is invisible to it. Migration 042 backfilled that link AFTER the
-- fact (deriving question_concepts from the question's task -> task_concepts).
-- This function enforces the same rule AT CREATION, in a single transaction:
-- it inserts each question and immediately derives its concept links from the
-- authoritative task_concepts map. A generated question therefore cannot exist
-- without its links, and the linkage can never drift onto a concept the
-- question isn't actually tagged to for mastery (it always matches task_id).
--
-- pool and is_exam_scope are FORCED here ('practice' / false) so the caller
-- can never mis-pool a generated question or flag it as exam scope.
--
-- Idempotent: CREATE OR REPLACE. Returns the inserted ids in payload order.

create or replace function public.create_practice_questions(p_questions jsonb)
returns uuid[]
language plpgsql
as $$
declare
  elem      jsonb;
  new_id    uuid;
  v_task_id uuid;
  out_ids   uuid[] := '{}';
begin
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' then
    raise exception 'p_questions must be a JSON array';
  end if;

  for elem in select value from jsonb_array_elements(p_questions)
  loop
    v_task_id := nullif(elem->>'task_id', '')::uuid;
    if v_task_id is null then
      -- Hard stop: a question with no task has no authoritative concept map
      -- and would be born invisible to the practice engine.
      raise exception 'every generated question must carry a task_id (reachability rule)';
    end if;

    insert into public.quiz_questions (
      certification_id,
      task_id,
      question_text,
      question_type,
      options,
      correct_answer,
      explanation,
      difficulty,
      language,
      pool,
      is_exam_scope
    )
    values (
      (elem->>'certification_id')::uuid,
      v_task_id,
      elem->>'question_text',
      (elem->>'question_type')::question_type,
      elem->'options',
      elem->'correct_answer',
      nullif(elem->>'explanation', ''),
      (elem->>'difficulty')::smallint,
      coalesce(nullif(elem->>'language', ''), 'en'),
      'practice',
      false
    )
    returning id into new_id;

    -- Reachability: links come from the task's authoritative concept map,
    -- not from anything the model said. Same source as migration 042.
    insert into public.question_concepts (question_id, concept_id)
    select new_id, tc.concept_id
    from public.task_concepts tc
    where tc.task_id = v_task_id
    on conflict do nothing;

    out_ids := out_ids || new_id;
  end loop;

  return out_ids;
end;
$$;
