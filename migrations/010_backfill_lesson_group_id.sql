-- =============================================================================
-- 010_backfill_lesson_group_id.sql
-- =============================================================================
-- Migration 003 §8 added lessons.lesson_group_id with the convention:
--   "The canonical English lesson IS the group head — its lesson_group_id = its
--    own id." Translated rows point at that head.
--
-- A few English-only stub lessons (e.g. the unpublished GAIPC cert's module
-- heads) were inserted without their self-referencing group id, leaving
-- lesson_group_id NULL. A NULL group breaks any logic that rolls progress /
-- mastery up across a lesson's language variants, because the row belongs to
-- no group.
--
-- This backfill makes every lesson belong to a group: any row still missing a
-- group id becomes its own head (lesson_group_id = id). For an English-only
-- lesson that is exactly right; if/when translations are added later, they
-- will point at this head.
--
-- Idempotent: re-running only touches rows that are still NULL.
-- =============================================================================

begin;

update public.lessons
set lesson_group_id = id
where lesson_group_id is null;

commit;

-- Verify zero remain:
-- select count(*) as null_group_count from public.lessons where lesson_group_id is null;
-- Expect: 0
