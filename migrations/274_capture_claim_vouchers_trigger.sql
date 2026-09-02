-- ============================================================================
-- 274_capture_claim_vouchers_trigger.sql
--
-- CAPTURE on_profile_created_claim_vouchers, THE AFTER INSERT TRIGGER ON
-- public.profiles.
--
-- Its FUNCTION has a file: claim_vouchers_for_new_profile() is created at
-- 237_claim_credentials_on_signup.sql:51. Only the CREATE TRIGGER was ever
-- missing, and it has been flagged for a while:
--
--   CLAUDE.md:300  "on_profile_created_claim_vouchers exists only in the live
--                   database. It is in no migration; 237 does `create or
--                   replace function` without `create trigger`. A fresh
--                   environment would have the function, no trigger, and every
--                   claim step would silently never fire."
--
--   246_live_triggers_of_record.sql  records this trigger among nine found
--                   live on 2026-08-24, verbatim, and says of the two that
--                   matter for signup: "It was only ever the triggers that
--                   were missing."
--
-- 246 is the RECORD. This file is the CREATE.
--
-- ---------------------------------------------------------------------------
-- READ FROM pg_trigger ON 2026-09-01:
--
--   CREATE TRIGGER on_profile_created_claim_vouchers
--     AFTER INSERT ON profiles
--     FOR EACH ROW
--     EXECUTE FUNCTION claim_vouchers_for_new_profile()
--
--   tgenabled 'O' (enabled, origin), no WHEN clause, no column list.
--
-- The function is unchanged since 246 checked it. md5 of prosrc with CRs
-- stripped, verified again today:
--
--   claim_vouchers_for_new_profile  a01bde2427726988117bda432c0416bd
--
-- which is byte-for-byte what 246 recorded on 2026-08-24. SECURITY DEFINER,
-- search_path=public.
--
-- ---------------------------------------------------------------------------
-- *** GUARDED CREATE, NOT drop-then-create, AND THE DIFFERENCE MATTERS HERE. ***
--
-- 273 uses drop-then-create because create policy has no other idempotent
-- form. A trigger does, and this one gets it, because THIS REPOSITORY HAS
-- ALREADY KILLED SIGNUP BY DROPPING A TRIGGER ON THIS PATH.
--
--   CLAUDE.md: migration 246 shipped `drop trigger if exists
--   on_auth_user_created on auth.users;` as a commented "expect 42501"
--   verification step. It SUCCEEDED instead of failing, and signup was
--   silently dead until the trigger was recreated.
--
-- The do-block below never drops anything. If the trigger exists it does
-- nothing at all; if it is absent it creates it. There is no state in which
-- running this file removes a working trigger, even for the duration of a
-- transaction.
--
-- WHAT THIS TRIGGER DOES, so the next reader knows what breaking it costs: on
-- profile insert it claims any vouchers already issued to that email address.
-- Without it a learner who was invited before signing up gets an account with
-- no seat, no error anywhere, and an invite that sits pending forever. That is
-- the signup-after-invite path; see 245 for the other half.
--
-- MIGRATION REPLAY FROM ZERO HAS NEVER WORKED HERE AND 274 DOES NOT CHANGE
-- THAT; see 268. Against the live database this is a no-op.
--
-- STILL MISSING AFTER THIS FILE, and deliberately out of scope:
-- on_auth_user_created -> handle_new_user() lives on auth.users, not on a
-- table in public. It is the same class of gap and wants its own decision,
-- because writing to the auth schema is not the same act as writing to ours.
-- ============================================================================

begin;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and t.tgname  = 'on_profile_created_claim_vouchers'
      and not t.tgisinternal
  ) then
    create trigger on_profile_created_claim_vouchers
      after insert on public.profiles
      for each row
      execute function public.claim_vouchers_for_new_profile();
  end if;
end
$$;

commit;

-- ---------------------------------------------------------------------------
-- Verification, run separately. Property, and both directions.
--
-- select t.tgname, t.tgenabled, p.proname,
--        md5(replace(p.prosrc, chr(13), '')) as fn_md5
-- from pg_trigger t
-- join pg_class c on c.oid = t.tgrelid
-- join pg_namespace n on n.oid = c.relnamespace
-- join pg_proc p on p.oid = t.tgfoid
-- where n.nspname = 'public' and c.relname = 'profiles'
--   and not t.tgisinternal
-- order by t.tgname;
--
-- POSITIVE half: TWO rows -- on_profile_created_claim_vouchers and
-- profiles_updated_at. tgenabled 'O' on both. fn_md5 for the claim function
-- still a01bde2427726988117bda432c0416bd.
--
-- NEGATIVE half: exactly two, not three. A do-block that ran when it should
-- not have would leave a duplicate trigger firing the same function twice per
-- insert -- which claims vouchers twice and would not raise.
