-- Migration 044: make create_practice_questions group-aware (trilingual sets).
--
-- A logical practice question now exists as three language rows (en / es-419 /
-- pt-BR) that share one question_group_id. question_group_id has NO foreign key
-- (confirmed) — it's a free uuid, so the caller mints one per logical question
-- and passes the same value on all three rows.
--
-- Everything else is unchanged from 043: pool='practice' and is_exam_scope=false
-- are FORCED, and question_concepts is derived from the task's task_concepts in
-- the same transaction (each language row is independently reachable in its own
-- language). Backward compatible — question_group_id is optional (null when
-- absent), so the existing single-language caller is unaffected.
--
-- Idempotent: CREATE OR REPLACE.

create or replace function public.create_practice_questions(p_questions jsonb)
returns uuid[]
language plpgsql
as $$
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
      language,
      pool,
      is_exam_scope
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
      coalesce(nullif(elem->>'language', ''), 'en'),
      'practice',
      false
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
$$;
