-- =============================================================================
-- 006_lesson_order_index_language.sql
-- =============================================================================
-- Make the lessons uniqueness constraint language-aware.
--
-- BEFORE: UNIQUE (module_id, order_index)
--   This prevents an English lesson and its Spanish/Portuguese translation
--   from both sitting at order_index 1 in the same module — which blocks
--   storing translated lessons at their natural order_index.
--
-- AFTER:  UNIQUE (module_id, order_index, language)
--   A module may now hold one lesson per (order_index, language). The English
--   row, its es-419 row, and its pt-BR row can all share order_index = 1.
--
-- This migration is backward-compatible: existing English-only rows already
-- satisfy the wider constraint, so nothing breaks on apply.
--
-- Run in the Supabase SQL editor, or via the migrations pipeline.
-- =============================================================================

begin;

alter table public.lessons
  drop constraint if exists lessons_module_id_order_index_key;

alter table public.lessons
  add constraint lessons_module_id_order_index_language_key
  unique (module_id, order_index, language);

commit;

-- Verify the new constraint is in place:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.lessons'::regclass and contype = 'u';
