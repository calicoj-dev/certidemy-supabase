-- 150_aihr_i_public_samples_distinct_tasks.sql
-- Reselect AIHR-I's six public sample questions so each comes from a DISTINCT
-- task, and prefer scenarios that are not tied to a single foreign jurisdiction.
--
-- WHY: migration 149 ranked with row_number() partitioned by domain only, so
-- rn=1 and rn=2 both fell inside the first task of that domain (each task holds
-- ten practice items). The result showcased six questions across four tasks -
-- two from 2.1 and two from 3.1. For the page that is a prospective candidate's
-- first look at the item bank, six distinct tasks is materially better evidence
-- of breadth.
--
-- SELECTION (deterministic, reproducible):
--   * one item per task, from the lowest-ordered tasks in each domain
--   * blueprint-weighted: D1 x1, D2 x2, D3 x2, D4 x1
--   * bloom 3_apply / 4_analyze only
--   * DEPRIORITISES items whose stem names a single foreign jurisdiction, so a
--     LATAM-first catalogue page does not lead with US state and city law
--   * matched on question_group_id, so all three languages move together
--
-- Resets every practice item to 'private' first, so this is a true reselection
-- and re-running cannot accumulate extra public rows. The secure pool is never
-- touched.
--
-- Editor-first. Idempotent. ASCII-only.

begin;

-- 1. clear the previous selection (practice pool only)
update public.quiz_questions
set visibility = 'private'
where certification_id = '77777777-7777-7777-7777-777777777777'
  and pool = 'practice'
  and visibility = 'public';

-- 2. reselect: one per task, weighted by domain, jurisdiction-neutral preferred
with candidates as (
  select
    q.question_group_id,
    d.code as domain_code,
    t.code as task_code,
    t.order_index as task_order,
    -- 1 when the stem leans on one foreign jurisdiction, else 0; sorts last
    case
      when q.question_text ~* '(New York City|NYC|Texas|Illinois|Colorado|California|U\.S\.|United States)'
      then 1 else 0
    end as jurisdiction_specific,
    row_number() over (
      partition by t.code
      order by
        case
          when q.question_text ~* '(New York City|NYC|Texas|Illinois|Colorado|California|U\.S\.|United States)'
          then 1 else 0
        end,
        q.question_group_id
    ) as rn_in_task
  from public.quiz_questions q
  join public.tasks   t on t.id = q.task_id
  join public.domains d on d.id = t.domain_id
  where q.certification_id = '77777777-7777-7777-7777-777777777777'
    and q.pool = 'practice'
    and q.language = 'en'
    and q.bloom_level in ('3_apply', '4_analyze')
),
best_per_task as (
  select *,
         row_number() over (partition by domain_code order by task_order) as task_rank
  from candidates
  where rn_in_task = 1
),
picks as (
  select question_group_id from best_per_task where domain_code = 'D1' and task_rank <= 1
  union all
  select question_group_id from best_per_task where domain_code = 'D2' and task_rank <= 2
  union all
  select question_group_id from best_per_task where domain_code = 'D3' and task_rank <= 2
  union all
  select question_group_id from best_per_task where domain_code = 'D4' and task_rank <= 1
)
update public.quiz_questions q
set visibility = 'public'
where q.certification_id = '77777777-7777-7777-7777-777777777777'
  and q.pool = 'practice'
  and q.question_group_id in (select question_group_id from picks);

commit;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Expect 6 public per language, 18 rows, SIX DISTINCT task codes:
--
-- select t.code as task_code, q.language, left(q.question_text, 90) as stem
--   from public.quiz_questions q
--   join public.tasks t on t.id = q.task_id
--  where q.certification_id='77777777-7777-7777-7777-777777777777'
--    and q.pool='practice' and q.visibility='public' and q.language='en'
--  order by t.order_index;
--
-- select count(distinct t.code) as distinct_tasks, count(*) as rows_en
--   from public.quiz_questions q
--   join public.tasks t on t.id = q.task_id
--  where q.certification_id='77777777-7777-7777-7777-777777777777'
--    and q.pool='practice' and q.visibility='public' and q.language='en';
--   -- expect 6 / 6
--
-- Secure pool untouched (expect 0):
-- select count(*) from public.quiz_questions
--  where certification_id='77777777-7777-7777-7777-777777777777'
--    and pool='secure' and visibility <> 'secure';
