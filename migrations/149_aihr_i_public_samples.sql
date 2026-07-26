-- 149_aihr_i_public_samples.sql
-- Tag six AIHR-I practice items as visibility='public' so the certification page
-- can cycle real questions ("See it before you trust it"), matching AIE-I's six.
--
-- Selection is deliberate and reproducible, not hand-picked UUIDs:
--   * blueprint-weighted across domains - D1 x1, D2 x2, D3 x2, D4 x1
--   * restricted to bloom 3_apply / 4_analyze, so the showcase demonstrates
--     judgment rather than recall (this scheme declares no recall tasks at all)
--   * deterministic: lowest task order_index per domain, then lowest group id
--   * matched on question_group_id, so all three languages flip together
--
-- Public items stay in the practice pool and keep their question_concepts links.
-- The secure pool is untouched: no exam item is ever made public, and the
-- firewall invariant is unaffected.
--
-- PREVIEW BEFORE RUNNING - see the block at the foot of this file. Run that
-- first, read the six questions, and swap any you dislike by adjusting the
-- domain quotas in `picks` below.
--
-- Editor-first. Idempotent (re-running selects the same six). ASCII-only.

begin;

with ranked as (
  select
    q.question_group_id,
    d.code as domain_code,
    row_number() over (
      partition by d.code
      order by t.order_index, q.question_group_id
    ) as rn
  from public.quiz_questions q
  join public.tasks   t on t.id = q.task_id
  join public.domains d on d.id = t.domain_id
  where q.certification_id = '77777777-7777-7777-7777-777777777777'
    and q.pool = 'practice'
    and q.language = 'en'
    and q.bloom_level in ('3_apply', '4_analyze')
),
picks as (
  select question_group_id from ranked where domain_code = 'D1' and rn <= 1
  union all
  select question_group_id from ranked where domain_code = 'D2' and rn <= 2
  union all
  select question_group_id from ranked where domain_code = 'D3' and rn <= 2
  union all
  select question_group_id from ranked where domain_code = 'D4' and rn <= 1
)
update public.quiz_questions q
set visibility = 'public'
where q.certification_id = '77777777-7777-7777-7777-777777777777'
  and q.pool = 'practice'
  and q.question_group_id in (select question_group_id from picks);

commit;

-- ============================================================
-- VERIFICATION - expect 6 public per language, 18 rows total
-- ============================================================
-- select language, visibility, count(*)
--   from public.quiz_questions
--  where certification_id='77777777-7777-7777-7777-777777777777' and pool='practice'
--  group by language, visibility order by language, visibility;
--
-- Secure pool must be untouched (expect zero rows):
-- select count(*) from public.quiz_questions
--  where certification_id='77777777-7777-7777-7777-777777777777'
--    and pool='secure' and visibility <> 'secure';
--
-- ============================================================
-- PREVIEW - RUN THIS FIRST, BEFORE THE MIGRATION
-- Shows exactly which six would be tagged, with their text.
-- ============================================================
-- with ranked as (
--   select q.question_group_id, q.question_text, q.bloom_level, q.difficulty,
--          d.code as domain_code, t.code as task_code,
--          row_number() over (partition by d.code order by t.order_index, q.question_group_id) as rn
--     from public.quiz_questions q
--     join public.tasks t   on t.id = q.task_id
--     join public.domains d on d.id = t.domain_id
--    where q.certification_id='77777777-7777-7777-7777-777777777777'
--      and q.pool='practice' and q.language='en'
--      and q.bloom_level in ('3_apply','4_analyze')
-- )
-- select domain_code, task_code, bloom_level, difficulty, question_text
--   from ranked
--  where (domain_code='D1' and rn<=1)
--     or (domain_code='D2' and rn<=2)
--     or (domain_code='D3' and rn<=2)
--     or (domain_code='D4' and rn<=1)
--  order by domain_code, task_code;
