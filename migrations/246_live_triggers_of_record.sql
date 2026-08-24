-- 246_live_triggers_of_record.sql
--
-- Records nine triggers and two functions that exist in the live database and
-- in no migration in this repo.
--
-- ============================ WHAT THIS FILE IS NOT =======================
--
-- THIS CHANGES NOTHING LIVE. Every object below already exists on
-- pctynukndxnmnxiqpgck exactly as written. Running it is a no-op by design.
--
-- IT DOES NOT RESTORE REPLAYABILITY. Migration replay from zero has never
-- worked in this repo and this file does not make it work:
--
--   * The base schema is not here. profiles, certifications, user_progress,
--     vouchers and the rest are referenced by the earliest migrations and
--     created by none of them. This repo begins partway through.
--
--   * 002_rag_and_chat.sql:72 creates chat_sessions_updated_at pointing at
--     set_updated_at(), which no migration defined. A fresh replay fails there,
--     at 002, long before it reaches anything below. Section 1 defines that
--     function, but it is numbered 246 and 002 will not see it.
--
-- So this file is a RECORD, not a fix. Its value is that a reader can now see
-- what is actually running without opening the SQL editor, and that a future
-- rebuild has the definitions to work from. Do not mistake it for a migration
-- that makes `supabase db reset` succeed. It does not.
--
-- Editor-first in the usual sense is inverted here: nothing was run. The
-- statements were reconstructed from pg_get_triggerdef and pg_get_functiondef
-- on 2026-08-24 and are recorded verbatim.
--
-- ============================ WHY THIS MATTERS ============================
--
-- Two of the nine are load-bearing for signup:
--
--   on_auth_user_created            -> handle_new_user()                 (072)
--   on_profile_created_claim_vouchers -> claim_vouchers_for_new_profile() (237)
--
-- Both functions ARE in the repo and both are byte-identical to live -- checked
-- by md5 of prosrc with CRs stripped, 2026-08-24:
--
--   handle_new_user                 764 bytes  7b6910ec19ffd30972999950e62875c3
--   claim_vouchers_for_new_profile  2112 bytes a01bde2427726988117bda432c0416bd
--
-- It was only ever the triggers that were missing. An environment built from
-- these files would hold both functions and attach neither, so every claim step
-- -- vouchers, memberships, invite redemption, credential binding -- would
-- silently never fire. Nothing would error. Signups would simply complete with
-- none of it done. That is the failure mode this repo keeps paying for.
--
-- ============================ SCOPE ======================================
--
-- IN: nine triggers absent from migrations/, and the two trigger functions that
-- six and one of them respectively call, which are also absent.
--
-- OUT, deliberately:
--
--   * trg_domain_weights_sum on public.domains. Already recorded, as a CREATE
--     CONSTRAINT TRIGGER, at 003_jta_curriculum.sql:74. It is the only
--     constraint trigger in this database, which is why a grep for
--     "create trigger" misses it. Not missing; do not re-add.
--
--   * The four storage triggers -- enforce_bucket_name_length_trigger and
--     protect_buckets_delete on storage.buckets, protect_objects_delete and
--     update_objects_updated_at on storage.objects. All owned by
--     supabase_storage_admin. Supabase platform objects, not ours to record.
--
-- ============================ WHY REPLACE, NOT DROP ======================
--
-- Every trigger below uses CREATE OR REPLACE TRIGGER rather than this repo's
-- usual drop-if-exists-then-create. One form for all nine, because it needs no
-- DROP at all -- see below for why that stopped being a privilege argument and
-- became an idempotency one.
--
-- auth.users is owned by supabase_auth_admin, NOT postgres. Observed ACL,
-- 2026-08-24:
--
--   supabase_auth_admin=arwdDxtm/supabase_auth_admin
--   dashboard_user=arwdDxtm/supabase_auth_admin
--   postgres=ar*wdDxtm/supabase_auth_admin
--
-- The `t` in that third entry is the TRIGGER privilege, and
-- has_table_privilege('postgres','auth.users','TRIGGER') returns true. So
-- postgres CAN create a trigger there -- which is how the live one came to
-- exist. But pg_has_role('postgres', relowner, 'USAGE') is FALSE: postgres is
-- not a member of supabase_auth_admin.
--
-- The first version of this file predicted that DROP TRIGGER would be refused
-- here, reasoning from the documented rule that DROP TRIGGER requires table
-- OWNERSHIP while CREATE TRIGGER requires only the TRIGGER privilege.
--
-- THAT PREDICTION WAS WRONG. Observed 2026-08-24T14:19:26Z, from the dashboard
-- SQL editor:
--
--   drop trigger if exists on_auth_user_created on auth.users;
--
-- SUCCEEDED. No error. postgres CAN drop a trigger on auth.users in this
-- project despite not being a member of supabase_auth_admin. Whatever the
-- dashboard editor runs as, or whatever Supabase grants beyond the visible
-- ACL, ownership is not the barrier the rule implies.
--
-- CREATE OR REPLACE TRIGGER is still the right form, but for IDEMPOTENCY, not
-- for privilege. Available since PostgreSQL 14; this server is 17.6
-- (server_version_num 170006).
--
-- ============================ HOW THIS WAS LEARNED =======================
--
-- By breaking it. This file used to end with that DROP as a commented
-- "verification step", labelled expect-42501. It was run. It succeeded.
-- on_auth_user_created was gone and signup was silently dead -- every new
-- auth.users row landing with no profile, no error, no log line -- until the
-- trigger was recreated from section 2. Caught only because an unrelated
-- trigger count came back 0.
--
-- A VERIFICATION STEP WHOSE FAILURE MODE IS INDISTINGUISHABLE FROM ITS SUCCESS
-- IS NOT A VERIFICATION STEP. If the hypothesis had held, the statement would
-- have errored harmlessly. Because it did not hold, the statement did the
-- damage it was meant to rule out -- and the two outcomes are the same action.
-- The check WAS the damage.
--
-- The DROP has been removed from section 3. Nothing in this repo should carry
-- a destructive statement as a way to test a belief about privileges. Read
-- pg_catalog, or leave the question open and say so.
--
-- THE GRANT IS NOT OURS. postgres holding TRIGGER on auth.users is a Supabase
-- platform decision this repo does not control and cannot assert. A local
-- `supabase db reset`, a new project, or a change to how Supabase provisions
-- the auth schema is exactly where this assumption breaks -- and it will break
-- as a permission error on section 2, not as anything subtler. The ACL above is
-- recorded so that failure is diagnosable rather than mysterious.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: safe to re-run, and a no-op against this database today.

-- ---------------------------------------------------------------------------
-- 1. The two trigger functions that no migration defines.
--
--    Bodies taken from live prosrc on 2026-08-24 and verified by md5 with CRs
--    stripped:
--
--      set_updated_at        50 bytes  b6ad157f898b54ffc45e2bdde7d725fa
--      audit_user_progress  550 bytes  9208483abe4ce27cb7dfd8c5b74d728c
--
--    Recorded as they run, not as they should be written. Both are plain
--    (not security definer) and neither pins search_path. Both carry the
--    default PUBLIC execute grant: =X/postgres postgres=X/postgres
--    service_role=X/postgres. Changing any of that is a different migration
--    and a different argument; this file only writes down what is there.
--
--    set_updated_at is referenced by 002_rag_and_chat.sql:72 and by
--    218_analyzer_provenance_spine.sql:282 and :287 -- three triggers pointing
--    at a function those files never created.
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end$$;

create or replace function public.audit_user_progress()
returns trigger
language plpgsql
as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, before_data, after_data)
  values (
    coalesce(new.user_id, old.user_id),
    case tg_op when 'INSERT' then 'insert'::audit_action
               when 'UPDATE' then 'update'::audit_action
               when 'DELETE' then 'delete'::audit_action end,
    'user_progress',
    coalesce(new.id, old.id),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end$$;

-- ---------------------------------------------------------------------------
-- 2. The nine triggers, verbatim from pg_get_triggerdef, 2026-08-24.
--
--    All nine: tgenabled = 'O' (enabled, fires on origin), tgconstraint = 0
--    (not constraint triggers), tgqual null (no WHEN clause).
--
--    Run one at a time. The auth.users one is the only statement in this repo
--    that touches a table this project does not own.
-- ---------------------------------------------------------------------------

-- The two that carry signup. Order matters at runtime, not here: an insert on
-- auth.users fires the first, which inserts the profile, which fires the second.

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace trigger on_profile_created_claim_vouchers
  after insert on public.profiles
  for each row execute function public.claim_vouchers_for_new_profile();

-- The six updated_at stamps. certifications, companies, profiles, study_plans,
-- user_lesson_progress and user_progress. chat_sessions has the same trigger
-- and it IS recorded, at 002_rag_and_chat.sql:72 -- these six are the ones that
-- never were.

create or replace trigger certifications_updated_at
  before update on public.certifications
  for each row execute function public.set_updated_at();

create or replace trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger study_plans_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();

create or replace trigger user_lesson_progress_updated_at
  before update on public.user_lesson_progress
  for each row execute function public.set_updated_at();

create or replace trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

-- The audit trigger. Fires on all three write verbs, unlike anything else here.

create or replace trigger trg_audit_user_progress
  after insert or delete or update on public.user_progress
  for each row execute function public.audit_user_progress();

-- ---------------------------------------------------------------------------
-- 3. Verification. Run separately. Post-conditions name properties, not counts.
--
--    Because this file records rather than changes, the meaningful check is
--    that running it leaves the database identical -- same trigger definitions,
--    same function bodies. Capture the md5s BEFORE and compare AFTER.
-- ---------------------------------------------------------------------------

-- -- Function bodies must still hash to the values recorded in section 1.
-- select proname,
--        length(regexp_replace(prosrc, E'\r', '', 'g')) as len_lf,
--        md5(regexp_replace(prosrc, E'\r', '', 'g')) as md5_lf
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and proname in ('set_updated_at','audit_user_progress',
--                   'handle_new_user','claim_vouchers_for_new_profile')
-- order by proname;
-- -- expected:
-- --   audit_user_progress             550   9208483abe4ce27cb7dfd8c5b74d728c
-- --   claim_vouchers_for_new_profile  2112  a01bde2427726988117bda432c0416bd
-- --   handle_new_user                 764   7b6910ec19ffd30972999950e62875c3
-- --   set_updated_at                  50    b6ad157f898b54ffc45e2bdde7d725fa

-- -- All nine must exist, be enabled, and be plain row triggers.
-- select n.nspname, c.relname, t.tgname, t.tgenabled,
--        t.tgconstraint <> 0 as is_constraint, t.tgqual is not null as has_when
-- from pg_trigger t
-- join pg_class c on c.oid = t.tgrelid
-- join pg_namespace n on n.oid = c.relnamespace
-- where not t.tgisinternal
--   and t.tgname in ('on_auth_user_created','on_profile_created_claim_vouchers',
--                    'certifications_updated_at','companies_updated_at',
--                    'profiles_updated_at','study_plans_updated_at',
--                    'user_lesson_progress_updated_at','user_progress_updated_at',
--                    'trg_audit_user_progress')
-- order by n.nspname, c.relname, t.tgname;
-- -- expected: 9 rows, every tgenabled = 'O', every is_constraint false,
-- --           every has_when false

-- -- The auth.users grant this file depends on. If section 2 ever fails with
-- -- 42501, this is the first thing to read.
-- select pg_get_userbyid(relowner) as owner, relacl
-- from pg_class where oid = 'auth.users'::regclass;
-- -- expected owner: supabase_auth_admin
-- -- expected to contain: postgres=ar*wdDxtm/supabase_auth_admin
