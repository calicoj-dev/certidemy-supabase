-- 079_sd_ai_i_public_samples.sql
-- ============================================================================
-- Fix SD-AI-I's missing transparency-section demo samples.
--
-- ROOT CAUSE: SD-AI-I's practice-pool rows (pool='practice') were loaded with
-- visibility='secure' instead of 'private' (SM-AI-I / SPO-AI-I practice rows are
-- 'private'). So get_public_samples (which needs visibility='public') found none
-- for SD-AI-I, and the home/detail transparency questions were empty.
--
-- This does NOT touch the real exam pool. Every statement is guarded with
-- pool='practice'. The pool='secure' rows (1,107, is_exam_scope=true) are the
-- certification exam and are physically excluded from every WHERE clause here.
-- visibility is a DISPLAY tier; pool/is_exam_scope is the firewall.
--
-- Idempotent: safe to re-run (normalize is a no-op once done; promotion is
-- gated on there being no existing public rows).
-- ============================================================================

begin;

-- Resolve the cert id once.
with cert as (
  select id from public.certifications where lower(code) = 'sd-ai-i' limit 1
)

-- 1) NORMALIZE: practice rows secure -> private (align with SM/SPO). Never
--    touches pool='secure'.
update public.quiz_questions q
set visibility = 'private'
from cert
where q.certification_id = cert.id
  and q.pool = 'practice'
  and q.is_exam_scope = false
  and q.visibility = 'secure';

-- 2) PROMOTE 6 per language to 'public', mirroring SM-AI-I's shape: one question
--    from each of 6 DISTINCT tasks, and guaranteeing at least one AI-Era task
--    (AI-Era = the same task_concepts regex get_public_samples uses).
--    Only runs if SD-AI-I has no public samples yet (idempotent guard).
do $$
declare
  v_cert uuid;
  v_has_public int;
  v_lang text;
begin
  select id into v_cert from public.certifications where lower(code) = 'sd-ai-i' limit 1;
  if v_cert is null then
    raise notice 'SD-AI-I not found; skipping.';
    return;
  end if;

  select count(*) into v_has_public
  from public.quiz_questions
  where certification_id = v_cert and visibility = 'public';

  if v_has_public > 0 then
    raise notice 'SD-AI-I already has % public rows; skipping promotion.', v_has_public;
    return;
  end if;

  -- Which SD-AI-I tasks are AI-Era (same predicate as get_public_samples).
  for v_lang in select unnest(array['en','es-419','pt-BR'])
  loop
    with ai_tasks as (
      select distinct t.id as task_id
      from public.tasks t
      where t.certification_id = v_cert
        and exists (
          select 1
          from public.task_concepts tc
          join public.concepts c on c.id = tc.concept_id
          where tc.task_id = t.id
            and (c.slug || ' ' || coalesce(c.name,'') || ' ' || coalesce(c.description,''))
                ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
        )
    ),
    -- one candidate practice single_choice question per task, tagged ai/not
    ranked as (
      select q.id, q.task_id,
             (at.task_id is not null) as is_ai,
             row_number() over (partition by q.task_id order by q.id) as rn_in_task
      from public.quiz_questions q
      left join ai_tasks at on at.task_id = q.task_id
      where q.certification_id = v_cert
        and q.pool = 'practice'
        and q.is_exam_scope = false
        and q.language = v_lang
        and q.question_type::text = 'single_choice'
        and q.visibility = 'private'   -- already normalized in step 1
    ),
    one_per_task as (
      select id, task_id, is_ai from ranked where rn_in_task = 1
    ),
    -- take up to 2 AI-Era tasks first (guarantee the mix), then fill to 6 with others
    pick as (
      (select id from one_per_task where is_ai order by id limit 2)
      union
      (select id from one_per_task where not is_ai order by id limit 6)
    ),
    final_six as (
      -- ensure distinct tasks + cap at 6, AI-first
      select p.id
      from pick p
      join one_per_task o on o.id = p.id
      order by o.is_ai desc, p.id
      limit 6
    )
    update public.quiz_questions q
    set visibility = 'public'
    from final_six f
    where q.id = f.id;

    raise notice 'SD-AI-I %: promoted % rows to public', v_lang,
      (select count(*) from public.quiz_questions
        where certification_id = v_cert and language = v_lang and visibility = 'public');
  end loop;
end $$;

commit;

-- ============================================================================
-- VERIFY (run after): expect 6 public per language, one/​few AI-Era, and the
-- secure exam pool still 1,107 untouched.
--
--   select pool, is_exam_scope, visibility, language, count(*)
--   from public.quiz_questions q
--   join public.certifications c on c.id = q.certification_id
--   where lower(c.code)='sd-ai-i'
--   group by pool, is_exam_scope, visibility, language
--   order by pool, visibility, language;
--
-- Expect: pool=secure/is_exam_scope=true/visibility=secure = 1107 (UNCHANGED),
--         pool=practice public = 6/lang, remainder practice private.
-- ============================================================================
