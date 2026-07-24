-- 142_credentials_platform_admin_policies.sql
--
-- credentials had exactly one RLS policy: "owner reads own credentials"
-- (SELECT where auth.uid() = user_id). No platform-admin access of any kind.
--
-- Two things depended on policies that were never there:
--
--   1. update-credential-name writes through the CALLER'S jwt (getUserClient),
--      not the service role, because the 136 audit trigger refuses a name change
--      when auth.uid() is NULL. A user-client write is subject to RLS, and with
--      no UPDATE policy it returns 42501 - which the function then mislabels as
--      "unattributable". The write was attributable; RLS simply forbade it.
--
--   2. /console/credentials claims to list "every issued credential across all
--      partners", but loadPlatformCredentials reading through the session client
--      under an owner-only SELECT policy would return only the admin's OWN
--      credentials. (If that loader uses a service path it is unaffected, but the
--      policy should exist regardless so the surface does not depend on which
--      client happens to be used.)
--
-- Both policies gate on platform_role = 'platform_admin', the same predicate as
-- vouchers_select_platform_admin.
--
-- The UPDATE policy's USING and WITH CHECK are both the admin predicate. It does
-- NOT try to restrict WHICH columns change - that is the 136 trigger's job, and
-- it already enforces that only holder_name may move and that the change is
-- attributable. RLS decides WHO may update; the trigger decides WHAT may change.
-- Keeping those two concerns separate is deliberate: a column filter in RLS would
-- silently duplicate the trigger and the two could drift.

begin;

create policy "platform admin reads all credentials"
  on public.credentials
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.platform_role = 'platform_admin'
    )
  );

create policy "platform admin updates credentials"
  on public.credentials
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.platform_role = 'platform_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.platform_role = 'platform_admin'
    )
  );

commit;
