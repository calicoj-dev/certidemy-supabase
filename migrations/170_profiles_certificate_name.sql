-- 170_profiles_certificate_name.sql
--
-- EXECUTED IN THE SUPABASE SQL EDITOR. This file is the versioned record, not
-- the execution. Editor-first, per standing rule.
--
-- SAFE AS SQL: DDL and grants only, no string literals, no multibyte payload.
--
-- ============================== WHY A NEW COLUMN ===========================
--
-- A DISPLAY NAME AND A CERTIFICATE NAME ARE DIFFERENT THINGS.
--
-- Google OAuth hands over whatever the person has on their Google account --
-- "J Roman" -- and that is fine for greeting them in the app. It is not what
-- belongs on a credential shown to an employer, which wants "Juan Roman".
--
-- Overloading full_name for both means editing your certificate name changes
-- how the app greets you, and re-syncing from an OAuth provider silently
-- rewrites what your certificate will say. They will diverge for legitimate
-- reasons and there would be no way to tell which is which.
--
-- NULLABLE ON PURPOSE. A null certificate_name is "never chose one", which is
-- distinguishable from "chose something identical to the display name". Only
-- the first should be nagged about.
--
-- =========================== WHY A CONFIRMED-AT STAMP ======================
--
-- The dashboard reminds a learner to check the spelling before they earn a
-- credential. If that reminder only cleared when certificate_name was SET,
-- then someone whose Google name is already correct would have to retype an
-- identical string to dismiss it -- a chore, not a check.
--
-- certificate_name_confirmed_at records that a human looked, whether they
-- changed anything or not. It also gives the certification body something
-- worth having: the difference between a name a person actively confirmed and
-- a name that is whatever an OAuth provider said and nobody ever read.
--
-- ================================ THE GRANT ================================
--
-- Extends 168's enumerated grant. DO NOT convert this to a table-wide grant
-- plus a column REVOKE: a table-wide GRANT re-confers every column and
-- silently overrides a column-level REVOKE, which is how platform_role became
-- self-service in the first place.
--
-- Enumerating fails safe. A column added to profiles later is NOT writable by
-- users until someone deliberately adds it to this list.
--
-- certificate_name_confirmed_at IS user-writable, deliberately. It records the
-- user's own act of confirming, it grants no privilege, and the alternative --
-- an edge function for a timestamp -- is machinery without a threat to answer.
-- The worst a user can do is claim they checked their name when they did not,
-- which affects only their own credential.

begin;

alter table public.profiles
  add column if not exists certificate_name text;

alter table public.profiles
  add column if not exists certificate_name_confirmed_at timestamptz;

comment on column public.profiles.certificate_name is
  'The name the holder wants printed on their certificate. NULL means never '
  'chosen -- fall back to full_name. Deliberately separate from full_name, '
  'which is the display name and may come from an OAuth provider.';

comment on column public.profiles.certificate_name_confirmed_at is
  'When the holder last confirmed their certificate name, whether or not they '
  'changed it. NULL means nobody has ever looked. Drives the dashboard '
  'reminder; do not infer confirmation from certificate_name being non-null.';

-- Enumerated, extending 168. Four existing columns plus the two new ones.
revoke update on public.profiles from authenticated;
grant update (
  full_name,
  avatar_url,
  timezone,
  locale,
  certificate_name,
  certificate_name_confirmed_at
) on public.profiles to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- VERIFICATION. Expected: exactly SIX rows --
--   avatar_url, certificate_name, certificate_name_confirmed_at, full_name,
--   locale, timezone.
-- Anything else, especially platform_role or email, means it is open again.
-- ---------------------------------------------------------------------------
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;

-- What each account would print today, and whether anyone has confirmed.
select
  p.id,
  u.email,
  p.full_name,
  p.certificate_name,
  coalesce(p.certificate_name, p.full_name, u.email) as would_print,
  p.certificate_name_confirmed_at
from public.profiles p
join auth.users u on u.id = p.id
order by p.certificate_name_confirmed_at nulls first, u.email;

-- ---------------------------------------------------------------------------
-- POST-RUN CHECKS (a green migration is not a working system)
--
-- 1. Escalation still refused. From the BROWSER as a signed-in non-admin --
--    the SQL editor runs as service role and will succeed regardless, which
--    proves nothing:
--
--      await supabase.from('profiles')
--        .update({ platform_role: 'platform_admin' })
--        .eq('id', (await supabase.auth.getUser()).data.user.id)
--
--    Expect 42501. A silent success with zero rows is NOT a pass -- that means
--    RLS filtered the row rather than the grant refusing the column.
--
-- 2. The new columns ARE writable by their owner. Same console, same user:
--
--      await supabase.from('profiles')
--        .update({ certificate_name: 'Test Name' })
--        .eq('id', (await supabase.auth.getUser()).data.user.id)
--
--    Expect success. A 42501 here means the grant did not take.
--
-- 3. score-mock-exam must be redeployed to read profiles. Until it does, this
--    column changes nothing -- exactly the failure 168's follow-up note
--    predicted: the feature looks broken rather than missing.
-- ---------------------------------------------------------------------------
