-- =============================================================================
-- Migration 004: Role grants
-- =============================================================================
-- Run AFTER 001, 002, and 003.
--
-- WHY THIS EXISTS
-- ---------------
-- Migrations 001-003 created tables and RLS policies but never issued the
-- table-level GRANT statements. In Postgres, RLS and GRANT are two separate
-- gates: a role must have the table privilege AND satisfy the row policy.
-- With RLS enabled but no GRANT, every access is denied before RLS is even
-- evaluated (error 42501, "permission denied").
--
-- These grants were originally applied by hand in the SQL editor while
-- debugging Phases 2.4 and 2.5. This migration captures them so a fresh
-- database rebuild reproduces the working permission setup. Without this
-- file, a rebuilt database has working tables, working RLS, and a completely
-- non-functional app.
--
-- SAFETY
-- ------
-- GRANT only opens the table-level door. RLS policies still decide which
-- ROWS each role sees. Granting `authenticated` SELECT on user_concept_mastery
-- does not let a user read other users' mastery — the RLS policy still scopes
-- it to auth.uid(). service_role intentionally bypasses RLS; it is the trusted
-- backend role used only inside Edge Functions, never exposed to browsers.
--
-- This migration is idempotent — GRANT is safe to run repeatedly.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. service_role — the backend role used by all Edge Functions.
-- -----------------------------------------------------------------------------
-- Edge Functions authenticate the caller, then use the service-role client for
-- all database work. service_role must have full access to every table; it is
-- never browser-exposed. This was the root cause of the Phase 2.4 "quiz has no
-- questions" bug — get-review-batch's service client could not read
-- quiz_questions.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- Future tables/sequences/functions inherit the same grant automatically, so a
-- later migration never silently reintroduces the missing-grant bug.
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;

-- -----------------------------------------------------------------------------
-- 2. authenticated — signed-in users, acting through the browser.
-- -----------------------------------------------------------------------------
-- These grants are paired with RLS. The browser holds the anon key + a user
-- JWT; RLS scopes every query to that user. Read-only on catalog/content
-- tables; read-write on the user's own progress tables.

-- Catalog & content — readable by signed-in users and anonymous visitors.
grant select on public.certifications      to authenticated, anon;
grant select on public.modules             to authenticated, anon;
grant select on public.lessons             to authenticated, anon;
grant select on public.concepts            to authenticated, anon;
grant select on public.lesson_concepts     to authenticated, anon;
grant select on public.quiz_questions      to authenticated, anon;
grant select on public.question_concepts   to authenticated, anon;
grant select on public.domains             to authenticated, anon;
grant select on public.tasks               to authenticated, anon;
grant select on public.module_prerequisites to authenticated, anon;

-- Per-user tables — the user reads and writes their own rows; RLS enforces
-- "own". Writes also happen server-side via service_role (which bypasses
-- this), but several of these are read or written directly from the browser.
grant select, insert, update on public.quiz_sessions        to authenticated;
grant select, insert, update on public.quiz_attempts        to authenticated;
grant select, insert, update on public.user_concept_mastery to authenticated;
grant select, insert, update on public.user_progress        to authenticated;
grant select, insert, update on public.user_lesson_progress to authenticated;
grant select, insert, update on public.fsrs_cards           to authenticated;
grant select, insert, update on public.fsrs_reviews         to authenticated;
grant select, insert, update on public.study_plans          to authenticated;
grant select, insert, update on public.study_plan_items     to authenticated;
grant select, insert, update on public.chat_sessions        to authenticated;
grant select, insert, update on public.chat_messages        to authenticated;
grant select on public.pass_predictions    to authenticated;
grant select on public.mock_exam_results   to authenticated;
grant select, update on public.profiles    to authenticated;

-- -----------------------------------------------------------------------------
-- Notes
-- -----------------------------------------------------------------------------
-- - If a table named above does not exist in your schema, that GRANT line
--   errors. Migrations 001-003 should have created all of them; if a name
--   drifted, adjust the line rather than removing the safety this file gives.
-- - source_documents and document_chunks are deliberately NOT granted to
--   authenticated — they are admin-ingested and only ever read by the
--   chat-tutor Edge Function via service_role.
-- =============================================================================
