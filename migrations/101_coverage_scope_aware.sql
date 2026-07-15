-- ============================================================================
-- 101_coverage_scope_aware.sql
--
-- TEACH THE COVERAGE VIEW ABOUT EXAM SCOPE.
--
-- v_coverage_summary asks "are all concepts tested?" against EVERY concept. That was fine
-- while every task was in exam scope. It stopped being fine the moment we did the correct
-- thing and removed items from an out-of-scope task.
--
-- SM-AI-I task 5.11 (5_evaluate, above the MCQ ceiling) is is_exam_scope = false. Its
-- concept `ai-augmentation-anti-patterns` is reachable ONLY through 5.11. So:
--
--   * The exam CANNOT test it - no in-scope task reaches it, and an MCQ cannot assess
--     Evaluate anyway. Requiring it to be "tested" asks for something the scheme forbids.
--   * But we still TEACH it (there is a lesson). "We teach a concept the exam can never
--     assess" is not an error to silence - it is exactly the kind of thing an ISO/IEC
--     17024 auditor wants documented. So it must remain VISIBLE, as a warning, not vanish.
--
-- The old view had two buckets (taught / tested) against one denominator (all concepts).
-- The honest model has THREE:
--
--   testable            reachable through an IN-SCOPE task  -> MUST be tested (fail if not)
--   out_of_scope_only   reachable ONLY through out-of-scope -> CANNOT be tested (warn)
--   (a concept in neither is unlinked entirely - already caught by the §5 check)
--
-- "All concepts tested" now measures tested-vs-TESTABLE, not tested-vs-ALL. And a new
-- column plus a companion view expose the out-of-scope-only concepts by name.
-- ============================================================================

-- Concepts reachable through at least one IN-SCOPE task. These are the concepts the exam
-- is allowed to - and must - assess.
create or replace view public.v_concepts_testable as
select distinct c.id, c.certification_id
from public.concepts c
join public.task_concepts tc on tc.concept_id = c.id
join public.tasks t on t.id = tc.task_id
where t.is_exam_scope;

comment on view public.v_concepts_testable is
  'Concepts reachable through at least one in-scope task - i.e. concepts the examination may and must assess. The denominator for "all concepts tested".';

-- Concepts reachable through a task, but ONLY through out-of-scope tasks. Taught, never
-- examinable by MCQ. Not an error - a documented boundary of the scheme.
create or replace view public.v_concepts_out_of_scope_only as
select c.id, c.certification_id, c.slug
from public.concepts c
where exists (
        select 1 from public.task_concepts tc
        join public.tasks t on t.id = tc.task_id
        where tc.concept_id = c.id and not t.is_exam_scope
      )
  and not exists (
        select 1 from public.task_concepts tc
        join public.tasks t on t.id = tc.task_id
        where tc.concept_id = c.id and t.is_exam_scope
      );

comment on view public.v_concepts_out_of_scope_only is
  'Concepts reachable ONLY through out-of-scope tasks: taught but not examinable by MCQ. Surfaced as a warning, never a failure. An ISO/IEC 17024 auditor wants this boundary documented, not hidden.';

-- Rebuild the summary. New columns are inserted mid-list (concepts_testable sits next to
-- the other concept counts for readability), which CREATE OR REPLACE cannot do - it may
-- only append. So drop and recreate. Confirmed no other object depends on this view
-- (pg_depend returned zero dependents), so the drop cascades to nothing.
--   * concepts_testable          - new; the correct denominator for "all tested"
--   * concepts_tested_in_scope   - tested AND testable (a stray test on an out-of-scope
--                                  concept must not paper over a real in-scope gap)
--   * concepts_out_of_scope_only - new; the count behind the warning
-- Every pre-existing column is preserved so nothing downstream breaks.
drop view if exists public.v_coverage_summary;
create view public.v_coverage_summary as
 WITH taught AS (
         SELECT DISTINCT c.id, c.certification_id
           FROM concepts c
             JOIN lesson_concepts lc ON lc.concept_id = c.id
        ), tested AS (
         SELECT DISTINCT c.id, c.certification_id
           FROM concepts c
             JOIN question_concepts qc ON qc.concept_id = c.id
        )
 SELECT cert.id AS certification_id,
    cert.code AS certification_code,
    cert.is_published,
    ( SELECT count(*) FROM concepts b
          WHERE b.certification_id = cert.id) AS concepts_total,
    ( SELECT count(*) FROM public.v_concepts_testable vt
          WHERE vt.certification_id = cert.id) AS concepts_testable,
    ( SELECT count(*) FROM taught t
          WHERE t.certification_id = cert.id) AS concepts_taught,
    ( SELECT count(*) FROM tested t
          WHERE t.certification_id = cert.id) AS concepts_tested,
    -- tested AND in the testable set: the number that must equal concepts_testable
    ( SELECT count(*) FROM tested t
          JOIN public.v_concepts_testable vt ON vt.id = t.id
          WHERE t.certification_id = cert.id) AS concepts_tested_in_scope,
    ( SELECT count(*) FROM public.v_concepts_out_of_scope_only vo
          WHERE vo.certification_id = cert.id) AS concepts_out_of_scope_only,
    ( SELECT count(*) FROM v_coverage_tested_not_taught v
          WHERE v.certification_id = cert.id) AS untaught_testing_violations,
    ( SELECT count(*) FROM v_coverage_taught_not_tested v
          WHERE v.certification_id = cert.id) AS taught_not_yet_practiced
   FROM certifications cert;

-- Show the new shape for the cert in question.
select certification_code,
       concepts_total,
       concepts_testable,
       concepts_taught,
       concepts_tested,
       concepts_tested_in_scope,
       concepts_out_of_scope_only
from public.v_coverage_summary
where certification_code = 'SM-AI-I';

-- Name the out-of-scope-only concept(s) so the boundary is on the record.
select certification_id, slug
from public.v_concepts_out_of_scope_only
order by certification_id, slug;
