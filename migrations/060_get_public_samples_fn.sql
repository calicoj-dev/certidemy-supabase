-- 060_get_public_samples_fn.sql
--
-- The read path for the public marketing samples (paired with 059's published
-- rows and the DB-driven sample-questions.tsx).
--
-- WHY A FUNCTION. 058 column-revoked correct_answer from anon/authenticated so
-- no answer key ever ships to the browser from a direct table read. But the
-- marketing sample card reveals the correct option + explanation the moment a
-- visitor clicks -- that's the whole demo. This SECURITY DEFINER function is the
-- ONLY controlled door to a sample's answer: by construction it returns rows
-- ONLY where visibility='public' (the 12 published demo groups), so it can never
-- surface a secure or private answer. The table-wide correct_answer revoke is
-- left fully intact; the ~5,000 practice/secure keys remain unreadable from the
-- browser. This is strictly tighter than the old hardcoded array (which shipped
-- answers in client JS).
--
-- It also DERIVES the AI-Era flag in SQL using the SAME concept term-set that
-- drives the blueprint badge (derive, don't store), and returns concept slugs,
-- so the client gets everything it needs in ONE rpc call, per language.

create or replace function public.get_public_samples(p_code text, p_lang text)
returns table (
  id uuid,
  question_text text,
  question_type text,
  options jsonb,
  correct_answer jsonb,
  explanation text,
  task_id uuid,
  question_group_id uuid,
  is_ai_era boolean,
  concept_slugs text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with cert as (
    select c.id
    from public.certifications c
    where lower(c.code) = lower(p_code) and c.is_published = true
    limit 1
  ),
  ai_tasks as (
    select distinct t.id as task_id
    from public.tasks t
    join cert on cert.id = t.certification_id
    where exists (
      select 1
      from public.task_concepts tc
      join public.concepts c on c.id = tc.concept_id
      where tc.task_id = t.id
        and (c.slug || ' ' || coalesce(c.name,'') || ' ' || coalesce(c.description,''))
            ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
    )
  )
  select
    q.id,
    q.question_text,
    q.question_type::text,
    q.options,
    q.correct_answer,
    q.explanation,
    q.task_id,
    q.question_group_id,
    (at.task_id is not null) as is_ai_era,
    coalesce(
      (select array_agg(distinct c2.slug)
         from public.question_concepts qc
         join public.concepts c2 on c2.id = qc.concept_id
        where qc.question_id = q.id),
      '{}'::text[]
    ) as concept_slugs
  from public.quiz_questions q
  join cert on cert.id = q.certification_id
  left join ai_tasks at on at.task_id = q.task_id
  where q.visibility = 'public'
    and q.language = p_lang
    and q.question_type::text = 'single_choice';
$$;

-- Only callable as an RPC by the two client roles; nothing else.
revoke all on function public.get_public_samples(text, text) from public;
grant execute on function public.get_public_samples(text, text) to anon, authenticated;

-- ===========================================================================
-- VERIFY (run separately).
--   -- definer view: SM-AI-I en -> 6 rows, 3 with is_ai_era=true
--   select id, is_ai_era, concept_slugs, left(question_text,50)
--   from public.get_public_samples('SM-AI-I','en');
--
--   -- anon can execute and gets 6 (ai=3), in Spanish
--   set role anon;
--   select count(*) as items, count(*) filter (where is_ai_era) as ai
--   from public.get_public_samples('SPO-AI-I','es-419');     -- expect 6, ai 3
--   reset role;
--
--   -- the direct-table answer-key revoke is STILL intact (058 untouched)
--   set role anon;
--   select id, correct_answer from public.quiz_questions limit 1;  -- permission denied
--   reset role;
-- ===========================================================================

-- ROLLBACK: drop function public.get_public_samples(text, text);
