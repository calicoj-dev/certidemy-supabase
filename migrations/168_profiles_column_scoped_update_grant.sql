-- 168_profiles_column_scoped_update_grant.sql
--
-- EXECUTED IN THE SUPABASE SQL EDITOR. This file is the versioned record, not
-- the execution. Editor-first, per standing rule.
--
-- SAFE AS SQL: DDL only, no string literals, no multibyte payload.
--
-- ============================ WHAT THIS CLOSES =============================
--
-- public.profiles had a table-wide UPDATE grant to `authenticated`, and its
-- only RLS policy is:
--
--     profile self update   UPDATE   (id = auth.uid())   WITH CHECK (id = auth.uid())
--
-- RLS restricts ROWS. It cannot restrict COLUMNS. So the policy correctly
-- confined a user to their own row -- and then the table-wide grant let them
-- write every column in it, including platform_role:
--
--     update profiles set platform_role = 'platform_admin' where id = auth.uid();
--
-- The row is theirs, so the policy permits it. The column is granted, so the
-- grant permits it. That is self-service platform admin: every credential,
-- every console surface, and update-credential-name (which is admin-gated and
-- audited, and would have been passed a legitimately-admin caller).
--
-- No trigger guarded it. The only triggers on profiles are
-- claim_vouchers_for_new_profile (AFTER INSERT) and set_updated_at (a timestamp
-- helper). Confirmed by reading pg_trigger, not by assuming.
--
-- Exposure at the time of the fix was five accounts, all known to the founder.
-- That is luck, not design.
--
-- This is the failure mode already recorded in the handoff chain, in its other
-- direction: RLS IS NOT A GRANT. The earlier lesson was a MISSING grant
-- producing a silent 42501. This is an OVER-BROAD grant producing a silent
-- privilege escalation. Both come from treating a policy as if it were the
-- whole access control story.
--
-- =========================== WHY ENUMERATE, NOT REVOKE =====================
--
-- The obvious-looking fix is `revoke update (platform_role) ... `. Do not.
-- A table-wide GRANT re-confers every column and silently overrides a
-- column-level REVOKE, so a later `grant update on public.profiles to
-- authenticated` -- from a migration, a fix, or a dashboard click -- would
-- reopen it with no error and no diff anyone would notice.
--
-- Enumerating the allowed columns fails safe: a column added to profiles later
-- is NOT writable by users until someone deliberately adds it here.
--
-- WHAT IS DELIBERATELY EXCLUDED
--   platform_role  the escalation vector; service-role or an admin function only
--   email          a user-writable copy desyncs from auth.users
--   id             identity; also the RLS predicate
--   created_at     not the user's to set
--   updated_at     owned by the set_updated_at BEFORE UPDATE trigger. Column
--                  privileges are checked against the columns named in the
--                  statement, so the trigger still sets it. Verify after
--                  running (see below) rather than assuming.
--
-- FOLLOW-UP, NOT IN THIS MIGRATION
--   score-mock-exam mints holder_name from auth.users.user_metadata.full_name,
--   NOT from profiles.full_name -- with a "Certified Professional" fallback.
--   Until that reads profiles first, a profile name edit will stamp nothing and
--   the feature will look broken rather than missing.

begin;

revoke update on public.profiles from authenticated;

grant update (full_name, avatar_url, timezone, locale)
  on public.profiles to authenticated;

-- Verification. Expected: exactly four rows -- avatar_url, full_name, locale,
-- timezone. Anything else, especially platform_role, means it is still open.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;

commit;

-- POST-RUN CHECKS (do not skip -- a green migration is not a working system)
--
-- 1. updated_at still tracked. As a normal signed-in user, change your own
--    full_name, then confirm updated_at moved. If it did not, set_updated_at
--    is being blocked and needs SECURITY DEFINER.
--
-- 2. Escalation actually refused. From the browser as a signed-in NON-admin
--    (the SQL editor runs as service role and will succeed regardless, which
--    proves nothing):
--
--      await supabase.from('profiles')
--        .update({ platform_role: 'platform_admin' })
--        .eq('id', (await supabase.auth.getUser()).data.user.id)
--
--    Expect error 42501. A silent success with zero rows is NOT a pass --
--    that would mean RLS filtered the row rather than the grant refusing the
--    column, and the finding would not actually be closed.
--
-- 3. Nothing in the app wrote profiles.email or profiles.platform_role from
--    the client. Grep before deploying:
--      Select-String -Pattern 'from\("profiles"\)' -Recurse
