-- 135_audit_actor_and_provider_default.sql
--
-- Two corrections found immediately after migration 134.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent.
--
-- ===========================================================================
-- 1. THE AUDIT TRIGGER CANNOT WRITE A NULL ACTOR
-- ===========================================================================
-- Migration 134's trg_audit_attempt_policy inserted auth.uid() into
-- admin_actions.actor_user_id, which is NOT NULL. In the Supabase SQL editor
-- auth.uid() returns NULL, so the trigger raised and the UPDATE failed:
--
--     null value in column "actor_user_id" of relation "admin_actions"
--     violates not-null constraint
--
-- THE TABLE IS RIGHT AND THE TRIGGER WAS WRONG. An audit record without an actor
-- is not an audit record. Weakening the column to nullable would trade a real
-- control for convenience, and the control is the point: ISO/IEC 17024 asks that
-- a scheme's rules be applied uniformly and that changes to them be attributable.
--
-- So the trigger now REFUSES an unattributable change and says how to make an
-- attributable one. The re-examination cap is a published scheme parameter; it
-- should be changed through the console, by an identified platform admin, not by
-- whoever happens to have a SQL editor open.
--
-- ESCAPE HATCH, for build-time work before the console control exists. Both
-- statements are themselves part of this versioned file, so the bypass is not
-- silent:
--
--     alter table public.certifications disable trigger trg_audit_attempt_policy;
--     -- ... make the change ...
--     alter table public.certifications enable  trigger trg_audit_attempt_policy;
--
-- Use it knowingly, and record why in the commit message.

create or replace function public.fn_audit_attempt_policy()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
begin
  if new.max_exam_attempts is distinct from old.max_exam_attempts
     or new.attempt_window_months is distinct from old.attempt_window_months then

    if v_actor is null then
      raise exception
        'Re-examination policy changes must be attributable. auth.uid() is NULL (SQL editor or service context). Change % via the console as a platform admin, or see migration 135 for the documented build-time bypass.',
        new.code
        using errcode = 'insufficient_privilege';
    end if;

    insert into public.admin_actions (actor_user_id, action, target_type, target_id, reason, metadata)
    values (
      v_actor,
      'exam_attempt_policy_changed',
      'certification',
      new.id,
      'Re-examination policy updated',
      jsonb_build_object(
        'code', new.code,
        'from', jsonb_build_object('max_exam_attempts', old.max_exam_attempts,
                                   'attempt_window_months', old.attempt_window_months),
        'to',   jsonb_build_object('max_exam_attempts', new.max_exam_attempts,
                                   'attempt_window_months', new.attempt_window_months)
      )
    );
  end if;
  return new;
end;
$$;

comment on function public.fn_audit_attempt_policy() is
  'Records re-examination policy changes to admin_actions, and REFUSES a change it cannot attribute. admin_actions.actor_user_id is NOT NULL by design - an audit record without an actor is not an audit record.';


-- ===========================================================================
-- 2. THE INHERITED PROVIDER DEFAULT
-- ===========================================================================
-- public.certifications.provider defaulted to 'CertiProf'.
--
-- Every live row already reads 'Certidemy', so nothing is currently mislabelled.
-- The DEFAULT is the hazard: the next certification inserted without an explicit
-- provider would silently claim to be issued by a different certification body.
--
-- Under ISO/IEC 17024 the issuing body is an identification field on the
-- credential, not a cosmetic label - a scheme document names the body that owns
-- and defends the certification decision. Certidemy issues its own credentials.
--
-- NOTE, deliberately not changed: 'smpc' as an internal content-pipeline
-- identifier (content/smpc/, --cert smpc, certFolder="smpc", group_key prefixes)
-- stays. PIPELINE-INDEX.md and CERT-CREATION.md both record this as legitimate:
-- those identifiers are never rendered to a candidate, and renaming them would
-- break content paths for no user-visible gain.

alter table public.certifications
  alter column provider set default 'Certidemy';

update public.certifications
   set provider = 'Certidemy'
 where provider is distinct from 'Certidemy';


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) the default is gone.
-- select column_name, column_default
--   from information_schema.columns
--  where table_schema='public' and table_name='certifications' and column_name='provider';
--
-- (b) every row reads Certidemy.
-- select code, provider from public.certifications order by code;
--
-- (c) the trigger now refuses an unattributable change with a clear message
--     rather than a constraint violation. Expect the raise, then rollback.
-- begin;
--   update public.certifications set max_exam_attempts = 3 where code = 'AIE-I';
-- rollback;
--
-- (d) and the documented bypass works when knowingly used.
-- begin;
--   alter table public.certifications disable trigger trg_audit_attempt_policy;
--   update public.certifications set max_exam_attempts = 3 where code = 'AIE-I';
--   alter table public.certifications enable  trigger trg_audit_attempt_policy;
--   select code, max_exam_attempts from public.certifications where code = 'AIE-I';
-- rollback;
-- ---------------------------------------------------------------------------
