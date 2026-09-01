-- ============================================================================
-- 270_capture_rls_admin_predicates.sql
--
-- CAPTURE is_platform_admin() AND is_team_admin_of() INTO VERSION CONTROL.
--
-- These two functions ARE THE AUTHORISATION BACKBONE OF THE RLS LAYER, and
-- until this file they existed in no migration. They predate this repository:
-- 003_jta_curriculum.sql -- the earliest file here -- already CALLS
-- is_platform_admin() in policy definitions at line 280 onward, so the function
-- was live before the first committed migration ran.
--
-- Found missing by the schema audit of 2026-09-01, which compared every live
-- object in `public` against a CREATE in migrations/.
--
-- WHAT DEPENDS ON THEM, measured 2026-09-01 against pg_policies:
--
--     is_platform_admin()   45 of 117 policies
--     is_team_admin_of()    12 of 117 policies
--
-- If this database were lost, every policy in this repository would recreate
-- and every one of those 57 would fail on an undefined function. The RLS layer
-- is the least-documented part of the system and the most consequential.
--
-- ---------------------------------------------------------------------------
-- CAPTURED EXACTLY AS STORED. NOT CLEANED UP.
--
-- Read from pg_proc.prosrc on 2026-09-01 and reproduced byte for byte. The
-- md5s below are of the live bodies with CRs stripped, as 244/245/249 do:
--
--     is_platform_admin    72ec8087ee606f15f9871b26629abbd6   (126 bytes)
--     is_team_admin_of     cf45ef9b8b01dd938a913f7fa9e8eec6   (253 bytes)
--
-- Both are LANGUAGE sql, STABLE, SECURITY DEFINER, owned by postgres.
--
-- Re-run after applying and both md5s must be UNCHANGED. `create or replace`
-- capturing an existing definition should alter nothing; an md5 that moves
-- means this file does not say what the database says, which is the one
-- failure this migration exists to prevent.
--
-- ---------------------------------------------------------------------------
-- *** NEITHER FUNCTION PINS search_path, AND EVERY COMPARABLE ONE DOES. ***
--
-- Measured across the five functions referenced in policy quals:
--
--     is_platform_admin    SECURITY DEFINER   proconfig (none)      45 policies
--     is_team_admin_of     SECURITY DEFINER   proconfig (none)      12 policies
--     can_read_issuer      SECURITY DEFINER   search_path=public     8 policies
--     is_company_admin     SECURITY DEFINER   search_path=public     5 policies
--     user_has_cert_tie    SECURITY DEFINER   search_path=public     1 policy
--
-- The three pinned ones were written later, by files that exist. The two
-- unpinned ones predate the convention -- which is consistent with their
-- being the two with no file.
--
-- A SECURITY DEFINER function without a pinned search_path resolves unqualified
-- names using the CALLER's search_path. Both bodies below schema-qualify every
-- table (public.profiles, public.team_members), which is what limits the
-- exposure here -- but `auth.uid()` is qualified by schema and the comparison
-- literals are not resolved through search_path at all, so the practical risk
-- is low rather than absent.
--
-- THIS MIGRATION DOES NOT PIN THEM. Adding `set search_path` would change the
-- function definition, break the md5 equality above, and turn a capture into
-- an edit. Capturing what is live and hardening it are two changes and want
-- two files. The hardening is a separate decision; this file makes it possible
-- to make that decision against a recorded baseline instead of against
-- nothing.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS FILE DOES NOT CAPTURE, and it matters.
--
-- Both functions read tables and types that ALSO have no file:
--
--     public.profiles       no CREATE TABLE in any migration
--     public.team_members   no CREATE TABLE in any migration
--     type platform_role    no CREATE TYPE   (learner, platform_admin, marketing)
--     type team_role        no CREATE TYPE   (team_admin, team_member)
--
-- profiles.platform_role is NOT NULL default 'learner'::platform_role.
-- team_members.role is NOT NULL default 'team_member'::team_role.
--
-- So this file makes the two functions reproducible but NOT the auth path:
-- applied to an empty database it would fail, because neither table nor
-- either enum exists. The 2026-09-01 audit found 26 tables in `public` with no
-- CREATE TABLE anywhere -- the original application schema, which predates this
-- repository. profiles and team_members are two of them.
--
-- Capturing that base schema is a bigger, separate job (pg_dump --schema-only
-- is the obvious route). This file is deliberately the small half: the two
-- objects that are pure logic, that 57 policies name directly, and that no
-- other record holds.
--
-- MIGRATION REPLAY FROM ZERO HAS NEVER WORKED IN THIS REPOSITORY AND 270 DOES
-- NOT CHANGE THAT. See 268 for the full note. `create or replace` is used so
-- this is a no-op against the live database and correct in any environment
-- where the tables above already exist.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- is_platform_admin() -- 45 policies
--
-- Reads profiles.platform_role for the calling user. SECURITY DEFINER because
-- the policies that call it are themselves what protect public.profiles: an
-- invoker-rights version would recurse into the RLS it is being used to decide.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
as $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and platform_role = 'platform_admin'
  );
$function$;

-- ---------------------------------------------------------------------------
-- is_team_admin_of(target_user uuid) -- 12 policies
--
-- True when the caller is a team_admin in a company that target_user also
-- belongs to. The self-join is the whole predicate: membership of the SAME
-- company, not merely being an admin somewhere.

create or replace function public.is_team_admin_of(target_user uuid)
returns boolean
language sql
stable
security definer
as $function$
  select exists (
    select 1
    from public.team_members me
    join public.team_members them on them.company_id = me.company_id
    where me.user_id = auth.uid()
      and me.role   = 'team_admin'
      and them.user_id = target_user
  );
$function$;

commit;

-- ---------------------------------------------------------------------------
-- Verification, run separately. Property, and both directions.
--
-- select proname, prosecdef, provolatile,
--        coalesce(array_to_string(proconfig,','),'(none)') as cfg,
--        length(prosrc) as len,
--        md5(replace(prosrc, chr(13), '')) as md5
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and proname in ('is_platform_admin','is_team_admin_of')
-- order by proname;
--
-- POSITIVE half: md5s UNCHANGED at 72ec8087ee606f15f9871b26629abbd6 and
-- cf45ef9b8b01dd938a913f7fa9e8eec6; prosecdef still true; provolatile still s.
--
-- NEGATIVE half, and it is the one that matters: the dependent policy counts
-- must not move. A `create or replace` that changed a signature would drop
-- nothing and break everything quietly.
--
-- select count(*) filter (where expr like '%is_platform_admin(%') as must_be_45,
--        count(*) filter (where expr like '%is_team_admin_of(%')  as must_be_12
-- from (select coalesce(qual,'')||' '||coalesce(with_check,'') as expr
--       from pg_policies where schemaname = 'public') t;
