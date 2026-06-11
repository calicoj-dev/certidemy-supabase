-- =============================================================================
-- 011_study_plan_item_type.sql
-- =============================================================================
-- A study-plan item is fundamentally "a thing to do on a day." Most items are
-- a lesson; some are a module review; some are a mock exam. The original table
-- only modeled lesson/module via FK and enforced:
--
--   CHECK (lesson_id IS NOT NULL OR module_id IS NOT NULL)
--
-- That makes mock-exam and review items (which have neither FK) impossible to
-- insert — the study-plan generator schedules them, the insert violates the
-- constraint, and plan generation fails entirely.
--
-- Fix: add an explicit item_type, and replace the constraint so that:
--   - 'lesson' items must have a lesson_id
--   - 'review' items are FSRS-general (no specific lesson/module) — need neither
--   - 'mock_exam' items need neither
-- The only hard rule is that a 'lesson' item actually points at a lesson;
-- review and mock_exam are valid with both FKs null.
-- =============================================================================

begin;

-- 1. Add the type column (nullable first, backfill, then constrain).
alter table public.study_plan_items
  add column if not exists item_type text;

-- 2. Backfill existing rows from their FKs.
update public.study_plan_items
set item_type = case
  when lesson_id is not null then 'lesson'
  when module_id is not null then 'review'
  else 'mock_exam'
end
where item_type is null;

-- 3. Default + not-null going forward.
alter table public.study_plan_items
  alter column item_type set default 'lesson';
alter table public.study_plan_items
  alter column item_type set not null;

-- 4. Replace the old constraint with a type-aware one.
alter table public.study_plan_items
  drop constraint if exists study_plan_items_check;

alter table public.study_plan_items
  add constraint study_plan_items_type_check check (
    item_type in ('lesson', 'review', 'mock_exam')
    and (item_type <> 'lesson' or lesson_id is not null)
  );

commit;

-- Verify:
-- select item_type, count(*) from public.study_plan_items group by item_type;
