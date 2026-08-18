-- 224_tasks_scope_tag.sql
--
-- Adds tasks.scope_tag so the analyzer can partition unmatched concepts by
-- REASON rather than reporting one number that means three different things.
--
-- ===================== THE PROBLEM THIS SOLVES =====================
--
-- The first coverage run reported TUV SUD at 19% against a hand score of 49%,
-- and BCS EXIN at 10.4% against 38%. Investigating, an unmatched concept turned
-- out to have at least three quite different causes:
--
--   GAP        in shared scope, not taught. The real finding.
--   PHRASING   taught, but our concept name is analytic where a syllabus is
--              plain. "Scrum Master serves the Product Owner" vs TUV's
--              "Responsibilities of the Scrum Master with the Product Owner" --
--              same idea, near-zero overlap on distinguishing tokens.
--   OUT OF SCOPE  reachable only from AI tasks. NO Scrum course will ever match
--              "Retained accountabilities" or "Delegable AI work", because no
--              Scrum course teaches them.
--
-- Summing those into one percentage understates competitors on the third
-- category and makes the product's actual differentiator look like their
-- deficiency. It is the opposite of the story worth telling: a pure-Scrum
-- course CANNOT cover this, and that is the point of the certification.
--
-- ================== WHY A COLUMN AND NOT A REGEX ==================
--
-- "Is this an AI task" was inferable only from statement text. A regex over
-- concept names was tried first and undercounted by more than half -- it found
-- 7 of 107 concepts, while the task-link route found 15, because concepts like
-- "Retained accountabilities" and "Human-held accountabilities" are AI concepts
-- that never say "AI".
--
-- That is the item-pipeline attribution rule in a new outfit: do not infer a
-- classification from surface text when it can be declared. This column is
-- declared, versioned and reviewable; a report that depends on it depends on a
-- decision somebody made on purpose.
--
-- ====================== THE BOUNDARY DECISION ======================
--
-- All seven AI tasks are tagged extended, INCLUDING 1.7 and 4.11 whose
-- underlying competences (empiricism, Definition of Done) are core Scrum. The
-- test applied is not "is the underlying idea Scrum" but "could a competent
-- pure-Scrum course match this task as stated". For all seven the answer is no.
--
-- Recorded here so it is decided once rather than re-litigated on every report.
--
-- text + CHECK rather than a new enum type: this vocabulary is expected to grow
-- (a third tier is plausible), and a CHECK is a one-line migration where an
-- enum is not.
--
-- ASCII-only. Editor-first.
--
-- Tip before this migration: 223. This is 224.


-- =====================================================================
-- SECTION 1 - the column
-- =====================================================================

alter table public.tasks
  add column if not exists scope_tag text not null default 'core';

alter table public.tasks
  drop constraint if exists tasks_scope_tag_check;

alter table public.tasks
  add constraint tasks_scope_tag_check
  check (scope_tag in ('core', 'extended'));

comment on column public.tasks.scope_tag is
  'core = a competent course in the base discipline could reasonably cover this. extended = it could not, because the task is stated in terms outside that discipline. Drives how the analyzer partitions an unmatched concept: a gap in core scope is a finding about the source, an unmatched extended concept is a structural difference and the differentiator. Declared deliberately, never inferred from statement text.';


-- =====================================================================
-- SECTION 2 - tag the SM-AI-I AI tasks
-- Codes resolved by join; no task UUID is assumed.
-- =====================================================================

update public.tasks t
set scope_tag = 'extended'
from public.certifications c
where c.id = t.certification_id
  and c.code = 'SM-AI-I'
  and t.code in ('1.7', '2.10', '2.11', '3.11', '4.11', '5.10', '5.11');


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME.
-- =====================================================================

-- 1) exactly 7 extended tasks on SM-AI-I, one per expected code
-- select t.code, d.code as domain, t.scope_tag, left(t.statement, 60) as statement
--   from public.tasks t
--   join public.domains d on d.id = t.domain_id
--   join public.certifications c on c.id = t.certification_id
--  where c.code = 'SM-AI-I' and t.scope_tag = 'extended'
--  order by t.code;

-- 2) every other certification is untouched (expect ZERO rows)
-- select c.code, count(*) as extended_tasks
--   from public.tasks t
--   join public.certifications c on c.id = t.certification_id
--  where t.scope_tag = 'extended' and c.code <> 'SM-AI-I'
--  group by c.code;

-- 3) THE DERIVED PARTITION -- concepts reachable ONLY from extended tasks.
--    These are the concepts no pure-Scrum course can match. Expect fewer than
--    the 15 reachable from AI tasks, because a concept reachable from BOTH an
--    extended and a core task (Definition of Done, for instance) stays core.
-- select count(*) as extended_only_concepts
--   from public.concepts c
--   join public.certifications cert on cert.id = c.certification_id
--  where cert.code = 'SM-AI-I'
--    and exists (select 1 from public.task_concepts tc where tc.concept_id = c.id)
--    and not exists (
--      select 1
--        from public.task_concepts tc
--        join public.tasks t on t.id = tc.task_id
--       where tc.concept_id = c.id and t.scope_tag = 'core');

-- 4) name them, so the boundary decision can be eyeballed rather than trusted
-- select c.slug, c.name
--   from public.concepts c
--   join public.certifications cert on cert.id = c.certification_id
--  where cert.code = 'SM-AI-I'
--    and exists (select 1 from public.task_concepts tc where tc.concept_id = c.id)
--    and not exists (
--      select 1
--        from public.task_concepts tc
--        join public.tasks t on t.id = tc.task_id
--       where tc.concept_id = c.id and t.scope_tag = 'core')
--  order by c.slug;

-- 5) core-scope denominator per domain -- what a pure-Scrum course is measured
--    against once extended-only concepts leave the calculation
-- select d.code, d.weight_pct,
--        count(distinct c.id) as concepts_total,
--        count(distinct c.id) filter (
--          where exists (
--            select 1 from public.task_concepts tc2
--              join public.tasks t2 on t2.id = tc2.task_id
--             where tc2.concept_id = c.id and t2.scope_tag = 'core')
--        ) as concepts_core
--   from public.domains d
--   join public.tasks t on t.domain_id = d.id
--   join public.task_concepts tc on tc.task_id = t.id
--   join public.concepts c on c.id = tc.concept_id
--   join public.certifications cert on cert.id = d.certification_id
--  where cert.code = 'SM-AI-I'
--  group by d.code, d.weight_pct, d.order_index
--  order by d.order_index;
