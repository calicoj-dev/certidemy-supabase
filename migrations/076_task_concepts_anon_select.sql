-- Migration 076: grant anon SELECT on task_concepts (AI-Era blueprint tag fix)
--
-- FINDING (RLS != grant, same class as 070/071):
--   The marketing blueprint drawer derives each task's "AI-Era" badge in JS by
--   reading task_concepts -> concepts (lib/blueprint/data.ts, lines 104/113).
--   Logged-out visitors saw NO AI-Era tags because task_concepts had an
--   anon-inclusive RLS policy ("task_concepts public read", USING true) but NO
--   table-level GRANT SELECT to anon. Grants are checked BEFORE RLS, so the anon
--   read returned empty and every task fell back to isAiEra=false.
--
--   Diagnostic confirmed anon already holds full SELECT on every sibling this
--   code path reads: tasks, domains, concepts (incl. all columns),
--   task_translations, domain_translations. task_concepts was the only gap.
--
-- task_concepts is public curriculum taxonomy (JTA task -> concept mapping),
-- intended anon-readable like tasks/domains. It is NOT the secure firewall
-- (questions / question_concepts) -- unrelated table, zero exam-item exposure.
--
-- FIX: bring task_concepts' grant in line with its policy and its siblings.

GRANT SELECT ON public.task_concepts TO anon;

-- Verify (run separately after apply):
--   select grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'task_concepts'
--     and privilege_type = 'SELECT' and grantee in ('anon','authenticated');
--   -- expect BOTH anon and authenticated
