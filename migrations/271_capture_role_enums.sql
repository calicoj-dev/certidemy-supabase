-- ============================================================================
-- 271_capture_role_enums.sql
--
-- CAPTURE platform_role AND team_role INTO VERSION CONTROL.
--
-- THESE TWO TYPES BACK EVERY ROLE CHECK IN THE SYSTEM. Until this file they
-- existed in no migration. Found missing by the schema audit of 2026-09-01,
-- the same audit that found the functions captured in 270.
--
-- 270 captured is_platform_admin() and is_team_admin_of(); this file captures
-- the vocabulary those functions compare against. Between them the two files
-- make the authorisation LOGIC reproducible. The two TABLES it reads --
-- public.profiles and public.team_members -- still have no CREATE anywhere;
-- they are part of the 26-table base schema that predates this repository.
--
-- ---------------------------------------------------------------------------
-- READ FROM pg_type / pg_enum ON 2026-09-01, IN ORDINAL ORDER.
--
--   platform_role   owner postgres
--     1  learner
--     2  platform_admin
--     3  marketing
--
--   team_role       owner postgres
--     1  team_admin
--     2  team_member
--
-- ORDINAL ORDER IS PART OF THE TYPE, NOT PRESENTATION. Enum values compare and
-- sort in declaration order, so recreating these in a different order would
-- change the meaning of any ORDER BY or inequality against them without
-- changing a single value. The order above is the live order and must be
-- preserved on any rebuild.
--
-- ---------------------------------------------------------------------------
-- WHERE THEY ARE USED, and both defaults are the LEAST-PRIVILEGED value.
--
--   profiles.platform_role   NOT NULL  default 'learner'::platform_role
--   team_members.role        NOT NULL  default 'team_member'::team_role
--
-- That is deliberate and worth stating: a row inserted without an explicit
-- role gets the weakest one. A default of 'platform_admin' or 'team_admin'
-- would grant authority by omission, and 45 policies read the first of these.
-- Preserve the defaults if these columns are ever recreated.
--
-- 'platform_admin' is the exact string that grants platform administrator
-- rights across 45 of 117 policies. Before this file it appeared in version
-- control only as a literal inside a function body.
--
-- ---------------------------------------------------------------------------
-- *** THE team_role VOCABULARY LIVES IN TWO PLACES, WITH TWO MECHANISMS. ***
--
--   team_members.role    enum team_role
--   company_invites.role TEXT, constrained by a CHECK:
--
--     company_invites_role_vocab
--       CHECK (role = ANY (ARRAY['team_admin'::text, 'team_member'::text]))
--
-- ADDING A VALUE TO team_role WITHOUT ADDING IT TO THAT CHECK -- OR THE
-- REVERSE -- REOPENS A FAILURE THIS PLATFORM HAS ALREADY HAD. company_invites
-- .role was unconstrained text while the signup trigger cast it to the enum,
-- so a typo inserted cleanly and then raised 22P02 INSIDE THE TRIGGER days
-- later, against a different person, aborting that transaction and blocking
-- an account creation with nothing pointing back at the invite. The CHECK was
-- added for exactly that reason. See CLAUDE.md, partner onboarding.
--
-- They are a mirrored pair. Both move or neither does.
--
-- ---------------------------------------------------------------------------
-- GUARDED, so this is a no-op against the live database and correct on a
-- rebuild. `create type` has no `if not exists`, hence the do-block.
--
-- MIGRATION REPLAY FROM ZERO HAS NEVER WORKED IN THIS REPOSITORY AND 271 DOES
-- NOT CHANGE THAT. See 268. What this file buys is that the vocabulary is
-- written down somewhere other than a running database.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- platform_role -- read by is_platform_admin(), 45 policies downstream.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'platform_role'
  ) then
    create type public.platform_role as enum ('learner', 'platform_admin', 'marketing');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- team_role -- read by is_team_admin_of(), 12 policies downstream, and
-- mirrored by company_invites_role_vocab as a text CHECK.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'team_role'
  ) then
    create type public.team_role as enum ('team_admin', 'team_member');
  end if;
end
$$;

commit;

-- ---------------------------------------------------------------------------
-- Verification, run separately. Property, and both directions.
--
-- select t.typname, e.enumsortorder, e.enumlabel
-- from pg_type t
-- join pg_enum e on e.enumtypid = t.oid
-- join pg_namespace n on n.oid = t.typnamespace
-- where n.nspname = 'public' and t.typname in ('platform_role','team_role')
-- order by t.typname, e.enumsortorder;
--
-- POSITIVE half: five rows, in the order recorded above.
--
-- NEGATIVE half, and it is the one a count alone would miss: no SIXTH value
-- appeared, and the two defaults did not move. A guard that only asserted
-- "the types exist" would pass on a type with an extra label in it.
--
-- select table_name, column_name, udt_name, column_default
-- from information_schema.columns
-- where table_schema = 'public' and udt_name in ('platform_role','team_role')
-- order by udt_name, table_name;
--
-- Expect exactly two rows: profiles.platform_role default 'learner', and
-- team_members.role default 'team_member'.
