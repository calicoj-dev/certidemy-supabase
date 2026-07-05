-- Migration 068: cert-tie read policy
-- Grant certification NAME read to authenticated users with a real tie to the
-- cert (an assigned voucher, or membership in a company that holds an allocation),
-- regardless of is_published.
--
-- Additive: does NOT alter the existing "catalog read certifications" policy, so
-- catalog discovery is unchanged (unpublished certs still stay out of the public
-- "add certification" catalog). RLS SELECT policies are OR'd, so this only WIDENS
-- read for people with a legitimate relationship to the cert.
--
-- Fixes: partner/business console showing an unpublished cert as the generic
-- "Certification" label (the name lookup in lib/console/partner.ts was blocked by
-- the is_published RLS gate). Also lets a voucher-holder's exam surface resolve
-- the cert name pre-launch.
--
-- Status: BRIDGE fix. The proper long-term model is a cert status lifecycle
-- (draft / coming_soon / published / retired) replacing the is_published boolean;
-- this policy remains correct after that lands. See backlog.
--
-- Editor-first: run this in the Supabase SQL editor (that is what changes the live
-- DB); this committed file is the versioned record. auth.uid() is NULL in the
-- editor, so user_has_cert_tie() returns false there — verify behaviorally in the
-- authenticated app, not in the editor.

-- 1) SECURITY DEFINER helper: current user has a voucher or company allocation
--    for this cert? Runs as owner to bypass RLS on the checked tables, so the
--    policy on certifications cannot recurse back through them.
create or replace function public.user_has_cert_tie(p_cert_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from vouchers v
      where v.certification_id = p_cert_id
        and v.assigned_user_id = auth.uid()
        and v.status = 'assigned'
    )
    or exists (
      select 1
      from team_members tm
      join company_certifications cc
        on cc.company_id = tm.company_id
      where tm.user_id = auth.uid()
        and cc.certification_id = p_cert_id
    );
$$;

revoke all on function public.user_has_cert_tie(uuid) from public;
grant execute on function public.user_has_cert_tie(uuid) to authenticated;

-- 2) Additive SELECT policy: read a cert row if you hold a tie to it.
--    OR'd with the existing catalog policy; catalog discovery unchanged.
drop policy if exists "tied read certifications" on certifications;
create policy "tied read certifications"
  on certifications
  for select
  to authenticated
  using ( public.user_has_cert_tie(id) );
