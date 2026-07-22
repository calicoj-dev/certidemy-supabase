-- 117_grant_credentials_select.sql
--
-- Grants SELECT on public.credentials to authenticated.
--
-- THE BUG: credentials has a correct RLS policy ("owner reads own credentials",
-- auth.uid() = user_id) but NO table-level grant. Postgres checks the GRANT
-- BEFORE the policy, so every read failed with 42501 - and because the loaders
-- are failure-tolerant, that error was swallowed and the app simply behaved as
-- though the user had no credentials. A learner holding two credentials saw
-- none of them anywhere.
--
-- This is the same class of mistake documented for certification_i18n:
--   RLS IS NOT A GRANT. A policy without a grant is a locked door with no
--   handle. Whenever a policy is added, add the matching grant.
--
-- SELECT ONLY. Credentials are issued by the exam scorer through a service-role
-- path; a learner must never be able to insert, update or delete one. Under
-- ISO/IEC 17024 the certification decision and its record belong to the
-- certification body, not to the candidate.
--
-- ASCII only: pasted into the Supabase SQL editor. Idempotent.

grant select on public.credentials to authenticated;

-- anon deliberately excluded. Public verification goes through the /verify
-- route, which resolves a single credential by id - not through table reads.

-- Verify: expect true.
--   select has_table_privilege('authenticated','public.credentials','SELECT');
--
-- And confirm no write privileges leaked in:
--   select has_table_privilege('authenticated','public.credentials','INSERT') as ins,
--          has_table_privilege('authenticated','public.credentials','UPDATE') as upd,
--          has_table_privilege('authenticated','public.credentials','DELETE') as del;
--   -- all three must be false.
