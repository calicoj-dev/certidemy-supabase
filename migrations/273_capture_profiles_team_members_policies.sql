-- ============================================================================
-- 273_capture_profiles_team_members_policies.sql
--
-- CAPTURE THE FOUR RLS POLICIES ON public.profiles AND public.team_members.
--
-- Found missing by the schema audit of 2026-09-01. None of the four has a
-- CREATE POLICY in any file. The only trace anywhere is a COMMENT at
-- 168_profiles_column_scoped_update_grant.sql:13, which describes "profile
-- self update" in prose while creating nothing.
--
-- UNLIKE THE TABLES, THESE ARE FULLY CAPTURABLE. A create-policy needs only
-- the table to exist -- see 272 for why the tables themselves cannot be
-- written as create-table statements from this repository.
--
-- ---------------------------------------------------------------------------
-- READ FROM pg_policy ON 2026-09-01 AND REPRODUCED EXACTLY, NOT RETYPED.
--
-- md5 of each stored qual, as pg_policies renders it:
--
--   profile self read           qual  faac18a8788a3b53e6316091f9c30ebc
--   profile self update         qual  ea1f5df45681e1946eaa85c22966d773
--                         with_check  ea1f5df45681e1946eaa85c22966d773
--   team self read members      qual  3db69fc914f830c4bb702cd89b15af41
--   team_admin manage members   qual  61b79dbb528167d3842bc81e766d9f8a
--                         with_check  61b79dbb528167d3842bc81e766d9f8a
--
-- All four are PERMISSIVE.
--
-- *** TWO DETAILS THAT ARE EASY TO GET WRONG AND CHANGE THE MEANING. ***
--
-- (a) THE profiles POLICIES HAVE NO `TO` CLAUSE. pg_policy.polroles is 0,
--     which renders as {public} in pg_policies -- that is the ABSENCE of a TO
--     clause, not `TO public` written out. The team_members policies DO name
--     a role: TO authenticated. Adding `TO public` to the first two, or
--     dropping `TO authenticated` from the last two, changes who the policy
--     applies to.
--
-- (b) THE STORED QUALS CALL THE HELPERS UNQUALIFIED -- is_platform_admin(),
--     not public.is_platform_admin(). Reproduced that way on purpose: writing
--     the schema-qualified form would store a DIFFERENT expression and break
--     the md5 equality above. It does mean these statements need `public` on
--     the search_path when they run, which is the SQL editor default.
--
-- The helper functions themselves are captured in 270 (is_platform_admin,
-- is_team_admin_of) and 012 (is_company_admin).
--
-- ---------------------------------------------------------------------------
-- IDEMPOTENT BY drop-then-create, INSIDE ONE TRANSACTION.
--
-- `create policy` has no `or replace` and no `if not exists`, so drop-then-
-- create is the only idempotent form. The transaction is what makes it safe:
-- the drop and the create commit together, so there is no window in which
-- profiles is readable without its policy. Running these statements OUTSIDE a
-- transaction would open exactly that window on a live table.
--
-- MIGRATION REPLAY FROM ZERO HAS NEVER WORKED HERE AND 273 DOES NOT CHANGE
-- THAT; see 268. Against the live database this is a no-op that reproduces
-- what is already there.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- profiles -- 2 policies, NO `TO` clause on either.

drop policy if exists "profile self read" on public.profiles;
create policy "profile self read"
  on public.profiles
  as permissive
  for select
  using (((id = auth.uid()) OR is_platform_admin() OR is_team_admin_of(id)));

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update"
  on public.profiles
  as permissive
  for update
  using ((id = auth.uid()))
  with check ((id = auth.uid()));

-- ---------------------------------------------------------------------------
-- team_members -- 2 policies, both TO authenticated.

drop policy if exists "team self read members" on public.team_members;
create policy "team self read members"
  on public.team_members
  as permissive
  for select
  to authenticated
  using (((user_id = auth.uid()) OR is_company_admin(company_id) OR is_platform_admin()));

drop policy if exists "team_admin manage members" on public.team_members;
create policy "team_admin manage members"
  on public.team_members
  as permissive
  for all
  to authenticated
  using (is_company_admin(company_id))
  with check (is_company_admin(company_id));

commit;

-- ---------------------------------------------------------------------------
-- Verification, run separately. Property, and both directions.
--
-- select tablename, policyname, permissive, cmd, roles::text,
--        md5(coalesce(qual,''))       as qual_md5,
--        md5(coalesce(with_check,'')) as wc_md5
-- from pg_policies
-- where schemaname = 'public' and tablename in ('profiles','team_members')
-- order by tablename, policyname;
--
-- POSITIVE half: four rows, with the md5s recorded above. An empty with_check
-- hashes to d41d8cd98f00b204e9800998ecf8427e, which is the md5 of the empty
-- string -- expected on the two SELECT policies.
--
-- NEGATIVE half, and it is what a count would miss: roles must still read
-- {public} for the two profiles policies and {authenticated} for the two on
-- team_members. A policy recreated with the wrong TO clause has the right
-- name, the right qual, the right count -- and applies to the wrong people.
--
-- Also assert no FIFTH policy appeared:
--
-- select count(*) as must_be_4 from pg_policies
-- where schemaname = 'public' and tablename in ('profiles','team_members');
