-- 197_aie_i_retire_ungrouped_items.sql
--
-- AIE-I HELD 15 PRACTICE ITEMS WITH NO question_group_id.
--
-- Found by the new §20 invariant, which had never existed. They are es-419
-- only, pool='practice', all on task 2.3, all four-option, approved,
-- task-linked, bank_revision v2-jta. Not remnants and not malformed - ordinary
-- items that were never grouped.
--
-- WHY UNGROUPED MATTERS.
--
-- question_group_id ties an item to its siblings in the other two languages.
-- verify-cert checks that every question group holds three language rows; an
-- item with no group is invisible to that check, because the check GROUPS BY
-- the column it lacks. These 15 had never been verified for language
-- completeness and never would be. Same shape of blind spot as the two-option
-- items hiding from the answer-position guard, which filters to items with
-- three or more options.
--
-- WHY RETIRE RATHER THAN GENERATE SIBLINGS.
--
-- Migration 195 kept them for exactly the right reason at the time: they are
-- sound items and retiring working stock to satisfy a metadata check is the
-- wrong trade. What changed is the evidence. Counting per task and language:
--
--     task 2.3 practice   en 10   es-419 25   pt-BR 10
--     task 2.3 secure     en  8   es-419  8   pt-BR  8
--
-- The task meets the practice floor of 10 in all three languages WITHOUT them.
-- Their presence made the Spanish practice pool two and a half times the size
-- of English and Portuguese for one task - an imbalance nobody chose, and one
-- that quietly changes what a Spanish-speaking learner practises relative to
-- everyone else.
--
-- So generating en and pt-BR siblings would add 30 items to a task that needs
-- none, purely to make 15 surplus items checkable. Retiring them costs nothing
-- and restores the balance.
--
-- 3 attempts exist across these rows. Migration 089 applies: the rows stay,
-- retired_at is set, the response history is preserved.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. GUARD. Run alone. Expect 15 rows, all es-419, all practice, all task 2.3,
--    all n_opts = 4. Anything else means the population has changed.
-- ============================================================================

select q.language, q.pool, t.code as task,
       jsonb_array_length(q.options) as n_opts, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t on t.id = q.task_id
where c.code = 'AIE-I' and q.question_group_id is null and q.retired_at is null
group by q.language, q.pool, t.code, jsonb_array_length(q.options);

-- ============================================================================
-- 2. RETIRE.
-- ============================================================================

update public.quiz_questions q
set retired_at    = now(),
    retire_reason = 'Ungrouped es-419 practice item on task 2.3. Carries no question_group_id, so it has no en or pt-BR sibling and is invisible to the language-completeness check, which groups by that column. Task 2.3 meets the practice floor of 10 in all three languages without these, and their presence made the es-419 pool 25 against 10 elsewhere. Sound items, surplus to the pool, unreachable by the structural checks.',
    status        = 'rejected'
from public.certifications c
where c.id = q.certification_id
  and c.code = 'AIE-I'
  and q.question_group_id is null
  and q.retired_at is null;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 3. Task 2.3 balanced and at floor. Expect 10/10/10 practice, 8/8/8 secure.
select t.code as task, q.pool, q.language, count(*) as live
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
join public.certifications c on c.id = q.certification_id
where c.code = 'AIE-I' and q.retired_at is null and t.code = '2.3'
group by t.code, q.pool, q.language order by q.pool, q.language;

-- 4. No live item anywhere in the catalogue is ungrouped. Expect 0 rows.
select c.code, q.language, q.pool, count(*) as ungrouped
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where q.question_group_id is null and q.retired_at is null
group by c.code, q.language, q.pool;

-- 5. Total retired across 194, 195 and 197. Expect 248 rows.
select count(*) as retired_rows from public.quiz_questions where retired_at is not null;
