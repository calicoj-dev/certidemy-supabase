-- 208_aims_ia_task_2_6_statement.sql
--
-- AIMS-IA task 2.6 - statement verb corrected to match its declared level.
--
-- verify-cert --strict flagged:
--     FAIL  Statement verb agrees with declared level
--           2.6: verb level 3 ("select") vs declared 4_analyze
--
-- WHY THIS IS THE STATEMENT AND NOT THE BLOOM. COGNITIVE-MODEL.md is explicit
-- that the task statement's verb DECLARES the cognitive level, and that this is
-- the only place the level is declared anywhere in the system. So a mismatch is
-- always resolved by asking which one describes the competence, and moving the
-- other.
--
-- Task 2.6's competence is analyze. Its skills field reads "Match method to
-- evidence type and justify the choice", and the lesson that teaches it
-- (02-06-choosing-the-method) turns on judging a balance of methods against
-- associated risks and opportunities per ISO 19011:2026 clause 5.5.3. That is
-- not selection from a list; it is a reasoned trade. The statement moves.
--
-- THIS IS AMENDMENT 1'S DEFECT IN THE OPPOSITE DIRECTION. That amendment moved
-- five statements UP to apply verbs where the S field described applied work
-- (tasks 1.1, 1.3, 1.5, 3.1, 5.1). Task 2.6 is the mirror case - an apply verb
-- on an analyze competence - and it was missed in that pass because the check
-- run then compared blooms against the JTA rather than verbs against blooms.
-- verify-cert's Section 9 check catches both directions; the lesson validator did not.
--
-- NO ITEM IMPACT. The 18 secure and practice items already generated for task
-- 2.6 were built at 4_analyze, which is unchanged. Items carry the task's bloom
-- level, not its verb, so nothing regenerates.
--
-- NO TRANSLATION IMPACT. trg_invalidate_task_translations flips a task's
-- translations to provisional when its statement changes. AIMS-IA has no task
-- translations yet (gen-jta-translations.mjs has not been run), so this change
-- was made at the cheapest possible moment - a day later it would have
-- invalidated es-419 and pt-BR rows and blocked the publication gate.
--
-- The JTA of record is updated to match, recorded there as Amendment 3.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

update public.tasks
set statement = 'Determine which auditing methods fit the evidence an AI management system produces, including remote methods and virtual locations'
where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and code = '2.6';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. The statement now opens with an analyze-level verb. Expect one row,
--    bloom_level 4_analyze, statement beginning "Determine which".
select code, bloom_level, statement
from public.tasks
where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and code = '2.6';

-- 2. Items for 2.6 are untouched and still at the task's declared level.
--    Expect secure 24 and practice 30 (8 and 10 per language x3), all 4_analyze.
select q.pool, q.bloom_level, count(*) as items
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and t.code = '2.6'
group by q.pool, q.bloom_level
order by q.pool;

-- 3. No task translations were invalidated, because none exist yet.
--    Expect zero rows.
select t.code, tt.language, tt.is_provisional
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
order by t.code, tt.language;

-- 4. The whole-cert check that motivated this migration.
--    Run: node scripts\verify-cert.mjs --cert AIMS-IA --strict
--    Expect: PASS  Section 9  Statement verb agrees with declared level  40 tasks
