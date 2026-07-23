-- 126_view_grant_hardening.sql
--
-- Close an answer-key exposure through a view, and revoke unnecessary client
-- grants on internal governance views.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- Idempotent. ASCII-clean.
--
-- ===========================================================================
-- 1. THE FINDING
-- ===========================================================================
-- public.v_live_items selects correct_answer and had GRANT SELECT to the
-- 'authenticated' role, with reloptions = null (no security_invoker).
--
-- The chain:
--   a) reloptions = null  -> the view executes with its OWNER's privileges
--   b) owner = postgres, which owns quiz_questions
--   c) quiz_questions.relforcerowsecurity = false -> RLS does NOT apply to the
--      table owner, so the view saw every row including pool='secure'
--   d) 'authenticated' held SELECT on the view, and the view emits correct_answer
--
-- Supabase exposes the public schema through PostgREST, so any signed-in user
-- could have issued:
--     GET /rest/v1/v_live_items?select=question_text,correct_answer&pool=eq.secure
-- and received the secure exam answer key.
--
-- The base table was hardened correctly - quiz_questions grants SELECT only to
-- postgres and service_role, with correct_answer column-revoked from client
-- roles. The view bypassed that entirely, because PostgREST checks the VIEW's
-- grants, not the base table's.
--
-- This is the failure mode already recorded in the project notes ("GRANT SELECT
-- table-wide re-confers every column and silently overrides a column-level
-- REVOKE"), reintroduced through a view after the table was fixed.
--
-- NO BREACH OCCURRED. Only test accounts exist; the platform has not launched.
-- Nothing in either repository references v_live_items - every edge function
-- reads quiz_questions directly with service_role - so the grant was pure
-- surface area with no consumer.
--
-- ===========================================================================
-- 2. WHAT WAS ALREADY APPLIED BY HAND
-- ===========================================================================
-- The v_live_items fix was run in the editor before this file existed. The
-- statements are repeated below for the versioned record; they are idempotent
-- and safe to re-run.
--
-- ===========================================================================
-- 3. A FALSE POSITIVE, RECORDED SO IT IS NOT RE-RAISED
-- ===========================================================================
-- v_question_group_integrity was initially flagged as a second exposure by a
-- detector testing `viewdef ILIKE '%correct_answer%'`. That was WRONG. The view
-- only aggregates the column:
--       count(DISTINCT correct_answer::text) AS distinct_answers
-- It emits an integer count, never the value. It is revoked below for a
-- different and lesser reason (see section 5), not as a key leak.
--
-- Lesson for future audits: test what a view EMITS, not whether a column name
-- appears in its definition.
--
-- ===========================================================================
-- 4. THE ANSWER-KEY FIX
-- ===========================================================================

revoke all on public.v_live_items from authenticated;
revoke all on public.v_live_items from anon;

-- security_invoker makes the view execute as the CALLER, so the column-level
-- revoke on quiz_questions applies even if someone re-grants the view later.
-- Defence in depth: the revoke alone would be sufficient today.
alter view public.v_live_items set (security_invoker = true);
alter view public.v_retired_items_evidence set (security_invoker = true);


-- ===========================================================================
-- 5. UNNECESSARY CLIENT GRANTS ON INTERNAL GOVERNANCE VIEWS
-- ===========================================================================
-- These four run as owner (bypassing RLS) and were granted to 'authenticated'.
-- None exposes an answer key, but none has a client-side consumer either:
--
--   v_coverage_tested_not_taught  - read by get-governance-snapshot (service_role)
--   v_coverage_taught_not_tested  - read by get-governance-snapshot (service_role)
--   v_cognitive_profile           - read by migrations and verify-cert.mjs (service key)
--   v_question_group_integrity    - referenced only by migration 063
--
-- All four retain service_role SELECT, so no consumer breaks.
--
-- v_coverage_tested_not_taught is the one with real information value to a
-- candidate: it is the internal defect list naming concepts the exam tests that
-- the lessons do not cover. That is scheme-quality QA output, not learner-facing
-- material.

revoke all on public.v_coverage_tested_not_taught from authenticated;
revoke all on public.v_coverage_taught_not_tested from authenticated;
revoke all on public.v_cognitive_profile          from authenticated;
revoke all on public.v_question_group_integrity   from authenticated;


-- ===========================================================================
-- 6. DELIBERATELY NOT CHANGED
-- ===========================================================================
-- v_cert_lesson_totals keeps its 'authenticated' grant. It is read by
-- certidemy-web/lib/dashboard/home.ts through createClient() - the USER-SCOPED
-- client, not service_role - so revoking it would break the dashboard. It emits
-- only (certification_id, total_lessons): aggregate lesson counts, with no
-- per-user data for RLS to protect and nothing sensitive to leak.
--
-- v_allocation_quota and v_batch_quota already carry security_invoker=on and are
-- read by app code (lib/console/*). Correct as they stand.
--
-- The three v_user_* views already carry security_invoker=true. Correct.


-- ---------------------------------------------------------------------------
-- VERIFY: expect no row where exposes_answer_key is true AND client_grants is
-- non-null. v_cert_lesson_totals should be the ONLY remaining view with a
-- client grant and reloptions = null.
--
-- select v.viewname,
--        c.reloptions,
--        (pg_get_viewdef(c.oid) ilike '%correct_answer%') as mentions_answer_col,
--        string_agg(distinct g.grantee, ', ')
--          filter (where g.grantee in ('anon','authenticated')) as client_grants
-- from pg_views v
-- join pg_class c on c.relname = v.viewname
-- join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
-- left join information_schema.role_table_grants g
--        on g.table_name = v.viewname and g.table_schema = 'public'
-- where v.schemaname = 'public'
-- group by v.viewname, c.reloptions, c.oid
-- order by client_grants nulls last, v.viewname;
--
-- Confirm the dashboard path still works (expect rows):
--
-- select certification_id, total_lessons from public.v_cert_lesson_totals limit 5;
--
-- Confirm the governance snapshot path still works from service_role (expect
-- the view to be queryable; it returns 0 rows when coverage is clean):
--
-- select count(*) from public.v_coverage_tested_not_taught;
-- ---------------------------------------------------------------------------
