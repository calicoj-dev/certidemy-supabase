-- 080_practice_rpc_visibility.sql
-- ============================================================================
-- ROOT-CAUSE FIX for the SD-AI-I mislabel that migration 079 patched in data.
--
-- THE BUG: quiz_questions.visibility defaults to 'secure' (058, deny-by-default
-- — a SAFE default). create_practice_questions inserts practice rows but never
-- set visibility, so every practice row it wrote inherited 'secure'. SM-AI-I /
-- SPO-AI-I only became 'private' because 058's backfill ran AFTER their practice
-- rows existed; SD-AI-I's practice rows were generated later and never got that
-- backfill -> they kept the raw 'secure' default. 079 fixed SD-AI-I's data;
-- THIS fixes the write path so no FUTURE cert repeats it.
--
-- THE FIX: create_practice_questions now sets visibility='private' explicitly.
-- Practice rows are learner-visible (private), never the secure exam default.
-- The column default STAYS 'secure' (deny-by-default is correct — we make the
-- practice path explicit rather than weaken the safety net).
--
-- Unchanged: pool='practice', is_exam_scope=false, the task_id reachability
-- rule, and the question_concepts derivation. Only the visibility literal is added.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_practice_questions(p_questions jsonb)
 RETURNS uuid[]
 LANGUAGE plpgsql
AS $function$
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
      is_exam_scope,
      visibility               -- ADDED: practice rows are learner-visible
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
      false,
      'private'                -- ADDED: never inherit the 'secure' column default
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

-- ============================================================================
-- GUARDRAIL QUERY (run anytime, especially after building a new cert):
-- any practice row still mislabeled secure? Expect 0. If >0, the pipeline
-- regressed (or an old cert predates this fix and needs a 079-style normalize).
--
--   select c.code, count(*) as practice_rows_mislabeled_secure
--   from public.quiz_questions q
--   join public.certifications c on c.id = q.certification_id
--   where q.pool = 'practice' and q.is_exam_scope = false
--     and q.visibility = 'secure'
--   group by c.code
--   order by c.code;
-- ============================================================================
