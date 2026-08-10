-- 195_aie_i_orphan_practice_items.sql
--
-- AIE-I HAS 20 PRACTICE ITEMS WITH NO question_group_id.
--
-- They are es-419 only, pool='practice', bank_revision='v2-jta', approved,
-- task-linked, and each carries three concept links. So they are not
-- pre-JTA remnants and not mis-generated - they are ordinary items that were
-- never grouped.
--
-- WHY THAT MATTERS BEYOND TIDINESS.
--
-- verify-cert checks that every question group holds three language rows. An
-- item with no group is invisible to that check. These twenty have never been
-- verified for language completeness, and they never will be while they are
-- ungrouped - the same shape of blind spot as the two-option items being
-- invisible to the answer-position guard, which filters to items with three or
-- more options.
--
-- A structural check that skips the rows most likely to be defective is worse
-- than no check, because it reports a pass.
--
-- WHAT THIS MIGRATION DOES, AND DELIBERATELY DOES NOT DO.
--
-- Retires 5 of the 20:
--   * 3 are two-option items - the same defect as migration 194's 76 groups,
--     missed by that migration precisely because they have no group id to list.
--   * 2 are exact duplicates of another item in the same set. A learner can
--     draw both in one session and answer the same question twice.
--
-- Leaves 13 alone. They are sound four-option items serving es-419 learners
-- correctly today. Retiring working stock to fix a metadata gap would make the
-- pool worse, not better. The missing group id is recorded as an owed item, not
-- treated as grounds for destruction.
--
-- 3 attempts exist across these items, so retirement rather than deletion is
-- required by migration 089 regardless.
--
-- Run in the Supabase SQL editor, statement by statement.

-- ============================================================================
-- 1. GUARD. Run alone. Expect exactly 5 rows: three with n_opts = 2, and one
--    of each duplicate pair. If any row shows n_opts = 4 and is not one of the
--    two named duplicates, stop.
-- ============================================================================

select q.id, jsonb_array_length(q.options) as n_opts,
       left(q.question_text, 70) as stem
from public.quiz_questions q
where q.id in (
  -- two-option orphans
  'bd1fcdf4-0015-4caf-a2f3-1f64502f4627',
  'cf608603-2896-4df7-ae7f-a02d5bb4ac4b',
  'e1332375-6dbb-435a-94ef-857fd38c8caa',
  -- second copy of each duplicate pair; the first copy is kept
  'd16f7964-280c-4535-80de-969bd71287a6',
  'e3bf55a8-ecf2-413d-8fa6-540098868234')
order by n_opts, q.id;

-- ============================================================================
-- 2. RETIRE THE THREE TWO-OPTION ORPHANS.
-- ============================================================================

update public.quiz_questions
set retired_at    = now(),
    retire_reason = 'Two-option item: a guesser scores 50 percent. Same defect as migration 194, missed by it because this row carries no question_group_id and the retirement list was keyed on groups.',
    status        = 'rejected'
where id in (
  'bd1fcdf4-0015-4caf-a2f3-1f64502f4627',
  'cf608603-2896-4df7-ae7f-a02d5bb4ac4b',
  'e1332375-6dbb-435a-94ef-857fd38c8caa')
  and retired_at is null;

-- ============================================================================
-- 3. RETIRE ONE OF EACH DUPLICATE PAIR.
--    The kept copy is named in the reason so the pairing stays reconstructible
--    from v_retired_items_evidence years later.
-- ============================================================================

update public.quiz_questions
set retired_at    = now(),
    retire_reason = 'Exact duplicate of 43069bb7-4c6c-4684-87c3-0e0a68831e54, which is kept. Both are ungrouped es-419 practice items, so a learner could draw the same question twice in one session.',
    status        = 'rejected'
where id = 'd16f7964-280c-4535-80de-969bd71287a6'
  and retired_at is null;

update public.quiz_questions
set retired_at    = now(),
    retire_reason = 'Exact duplicate of 4d4ded8a-2a07-4796-b214-c2815726f7d0, which is kept. Both are ungrouped es-419 practice items, so a learner could draw the same question twice in one session.',
    status        = 'rejected'
where id = 'e3bf55a8-ecf2-413d-8fa6-540098868234'
  and retired_at is null;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 4. No LIVE item anywhere in the catalogue has fewer than four options.
--    Expect 0 rows. This is what 194's proof 4 could not reach.
select c.code, q.pool, q.language, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where jsonb_array_length(q.options) < 4 and q.retired_at is null
group by c.code, q.pool, q.language;

-- 5. No LIVE duplicate stems remain among the ungrouped set. Expect 0 rows.
select left(q.question_text, 120) as stem, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'AIE-I' and q.question_group_id is null and q.retired_at is null
group by left(q.question_text, 120)
having count(*) > 1;

-- 6. Thirteen sound orphans remain, all four-option. Expect 13 / all n_opts 4.
select count(*) as remaining_orphans,
       min(jsonb_array_length(q.options)) as min_opts,
       max(jsonb_array_length(q.options)) as max_opts
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'AIE-I' and q.question_group_id is null and q.retired_at is null;

-- 7. Total retired across 194 and 195. Expect 233 rows.
select count(*) as retired_rows from public.quiz_questions where retired_at is not null;

-- ============================================================================
-- OWED, NOT FIXED HERE
-- ============================================================================
-- The 13 surviving items still have no question_group_id, so they remain
-- outside the language-completeness check. Grouping them means either finding
-- or generating their en and pt-BR siblings, which is item generation work
-- rather than a migration. Recorded in the handoff.
--
-- INVARIANT OWED: no live item may have a null question_group_id. One query,
-- and it would have surfaced these twenty the first time it ran.
