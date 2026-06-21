-- =====================================================================
-- 049_cert_categories_rls.sql
-- cert_categories was created in 048 with RLS enabled but NO policies, so the
-- anon/public site read nothing and the grouped catalog rendered empty. This
-- adds the policies, mirroring how `certifications` exposes itself:
--   - public SELECT (categories are just group labels/taglines, meant to be seen)
--   - admin-only writes via is_platform_admin()
-- Editor-first: run in the Supabase SQL editor; this file is the record.
-- Idempotent — guarded so re-runs don't error.
--
-- LESSON BAKED IN: every new public-facing table needs its RLS policy in the
-- same migration that creates it, or it's invisible to the live site while
-- looking perfect in the editor (which runs as postgres and bypasses RLS).
-- =====================================================================

-- 1. Public read — anyone can see the cert groups.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='cert_categories' and policyname='catalog read cert_categories'
  ) then
    create policy "catalog read cert_categories"
      on public.cert_categories for select to public using (true);
  end if;
end $$;

-- 2. Admin write — only platform admins can change groups.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='cert_categories' and policyname='admin write cert_categories'
  ) then
    create policy "admin write cert_categories"
      on public.cert_categories for all to public
      using (is_platform_admin()) with check (is_platform_admin());
  end if;
end $$;

-- 3. Verify.
-- select policyname, cmd, roles from pg_policies
-- where schemaname='public' and tablename='cert_categories';
