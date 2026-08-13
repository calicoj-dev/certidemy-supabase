-- 214_aihr_i_ungrouped_items.sql
--
-- AIHR-I - retire five ungrouped Spanish-only practice items on task 3.5.
--
-- FOUND BY verify-cert:
--   FAIL  Every item belongs to a question group
--         5 ungrouped - invisible to the 3-language check, which groups by this column
--
-- ============================================================================
-- WHAT THEY ARE
-- ============================================================================
--
-- Task 3.5's practice pool, by language:
--
--   en        10 items    0 ungrouped
--   es-419    15 items    5 ungrouped
--   pt-BR     10 items    0 ungrouped
--
-- Five Spanish-only extras with no English or Portuguese siblings. All five
-- created 2026-08-12 21:50 at bank_revision v2-jta, in one write. English and
-- Portuguese sit at exactly the 10-per-task floor, so the pool does not need
-- them: retiring them leaves every language at 10.
--
-- ============================================================================
-- WHY THIS MATTERS MORE THAN FIVE ITEMS
-- ============================================================================
--
-- question_group_id is what makes an item trilingual. Without it an item is not
-- a Spanish version of anything - it is a Spanish item that exists alone. Two
-- consequences, both quiet:
--
-- 1. THE ITEMS ARE UNCHECKABLE. The three-language integrity check groups by
--    question_group_id, so a null makes an item invisible to it BY
--    CONSTRUCTION. The check cannot fail on what it cannot see.
--
-- 2. ONE MISSING COLUMN BYPASSED TWO CHECKS. One of the five carries only two
--    options - "Verdadero o falso: ..." - and it is the ONLY item in the entire
--    catalogue with fewer than four options. Yet AIHR-I passes "Every item
--    offers at least four options". That check evidently reaches items through
--    their group as well, so the same null hid the item from both.
--
--    This is the answer-position blind spot again in a new place: a check that
--    filters before it counts cannot see what the filter dropped. Recorded as a
--    follow-up below - the fix belongs in verify-cert.mjs, not here.
--
-- 3. LEARNERS GOT DIFFERENT PRODUCTS. A Spanish learner practising task 3.5 saw
--    fifteen items where an English learner saw ten, five of them never reviewed
--    as part of a trilingual set. Practice equivalence across languages is part
--    of what the platform claims.
--
-- ============================================================================
-- RETIRE, NOT DELETE
-- ============================================================================
--
-- Two of the five have been answered. quiz_attempts carries a RESTRICT foreign
-- key precisely so that deleting an item cannot destroy attempt evidence, so a
-- hard delete would fail on those two anyway. All five are retired uniformly -
-- splitting the treatment by attempt count would leave three deleted and two
-- retired for no principled reason, and the retirement trail is the honest
-- record either way. This follows migrations 194 and 197.
--
-- Retired items stay out of every pool: v_live_items and the practice RPC both
-- filter on retired_at is null.
--
-- ============================================================================
-- FOLLOW-UP, RECORDED NOT DONE
-- ============================================================================
--
-- The four-option check in verify-cert.mjs must count items directly rather than
-- through their groups, so an ungrouped item cannot escape it. Had it done so,
-- the two-option item here would have been caught on its own rather than as a
-- side effect of chasing a null column.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

update public.quiz_questions
set retired_at    = now(),
    retire_reason = 'Ungrouped Spanish-only practice item with no en/pt-BR siblings. '
                 || 'question_group_id null made it invisible to the three-language '
                 || 'integrity check by construction; one of the five also carried only '
                 || 'two options and escaped the four-option check the same way. '
                 || 'Task 3.5 holds 10 per language without these. Migration 214.'
where id in (
  '04f09ab5-dbb7-4283-9842-21f71370638d',  -- 2 options, "Verdadero o falso"
  '796fab6b-2241-45e5-a2f4-b8f7f3c22501',
  '8eb7e758-9250-4db2-b738-bcb2397a15f9',
  'a1005a58-d513-4ef3-be6b-7f5a12aee106',  -- 1 attempt
  'e7de08ad-f9c6-44ac-80f8-720ce9cafe4a'   -- 1 attempt
)
  and retired_at is null;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. All five retired. Expect 5 rows, each with a retired_at.
select id, retired_at is not null as retired, jsonb_array_length(options) as options
from public.quiz_questions
where id in (
  '04f09ab5-dbb7-4283-9842-21f71370638d','796fab6b-2241-45e5-a2f4-b8f7f3c22501',
  '8eb7e758-9250-4db2-b738-bcb2397a15f9','a1005a58-d513-4ef3-be6b-7f5a12aee106',
  'e7de08ad-f9c6-44ac-80f8-720ce9cafe4a'
)
order by id;

-- 2. Task 3.5 now holds 10 live practice items per language, evenly.
select q.language, q.pool, count(*) as live_items,
       count(*) filter (where q.question_group_id is null) as ungrouped
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
join public.certifications c on c.id = t.certification_id
where c.code = 'AIHR-I' and t.code = '3.5' and q.retired_at is null
group by q.language, q.pool
order by q.pool, q.language;

-- 3. No live item anywhere in the catalogue lacks a group. Expect zero rows.
select c.code, count(*) as ungrouped_live
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
join public.certifications c on c.id = t.certification_id
where q.question_group_id is null and q.retired_at is null
group by c.code
order by c.code;

-- 4. No live item anywhere offers fewer than four options. Expect zero rows.
--    This is the check verify-cert should be making directly.
select c.code, q.id, jsonb_array_length(q.options) as options,
       left(q.question_text, 60) as stem
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
join public.certifications c on c.id = t.certification_id
where jsonb_array_length(q.options) < 4 and q.retired_at is null
order by c.code;

-- 5. Attempt evidence survives retirement. Expect 2 rows with attempts.
select q.id, q.retired_at is not null as retired,
       (select count(*) from public.quiz_attempts a where a.question_id = q.id) as attempts
from public.quiz_questions q
where q.id in ('a1005a58-d513-4ef3-be6b-7f5a12aee106','e7de08ad-f9c6-44ac-80f8-720ce9cafe4a');

-- 6. The whole-catalogue check.
--    Run: node scripts\verify-cert.mjs --all --strict
--    Expect AIHR-I: 0 fail.
