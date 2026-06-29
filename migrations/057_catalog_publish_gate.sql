-- 057_catalog_publish_gate.sql
--
-- Gate the ENTIRE catalog read surface to published certs, uniformly. Before
-- this, domains/tasks/concepts/modules/task_concepts were world-readable with
-- `using (true)` (see 051, 056, and the original catalog-read policies), which
-- meant an UNPUBLISHED cert's full blueprint (domains, weights, task statements,
-- concept links) was anonymously readable. getCertByCode already 404s
-- unpublished certs on the page, and `certifications` itself is gated to
-- `is_published OR is_platform_admin()` — this brings the child catalog tables
-- in line with that same rule so the whole catalog is consistent.
--
-- WHY UNIFORM MATTERS: every cert (SM-AI-I, SPO-AI-I, and future SD-AI-I while
-- it is still a draft) is now treated identically — published => public,
-- unpublished => hidden (admins always see all). This is the ISO/IEC 17024
-- expectation that scheme content is handled consistently, and it lets SD-AI-I
-- be built as a draft without its blueprint leaking before launch.
--
-- DESIGN: two SECURITY DEFINER helpers test publish status while bypassing the
-- referenced table's own RLS (so there is no policy-recursion surprise). Reads
-- are then `published(...) OR is_platform_admin()`, mirroring the certifications
-- policy. Admin WRITE policies are untouched. Wrapped in a transaction so a
-- failure leaves the prior (working) policies fully intact.
--
-- Idempotent: helpers use CREATE OR REPLACE; policies are DROP IF EXISTS + CREATE.

begin;

-- ---- publish-status helpers (SECURITY DEFINER: bypass referenced-table RLS) ----
create or replace function public.is_cert_published(cert uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.certifications c
    where c.id = cert and c.is_published
  );
$$;

create or replace function public.is_task_published(task uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    join public.certifications c on c.id = t.certification_id
    where t.id = task and c.is_published
  );
$$;

grant execute on function public.is_cert_published(uuid) to anon, authenticated;
grant execute on function public.is_task_published(uuid) to anon, authenticated;

-- ---- domains ----
drop policy if exists "domains public read" on public.domains;       -- 056 (true)
drop policy if exists "auth read domains" on public.domains;          -- authenticated-only
create policy "domains catalog read"
  on public.domains for select to anon, authenticated
  using (is_cert_published(domains.certification_id) or is_platform_admin());

-- ---- tasks ----
drop policy if exists "tasks public read" on public.tasks;            -- 051 (true)
drop policy if exists "auth read tasks" on public.tasks;              -- authenticated-only
create policy "tasks catalog read"
  on public.tasks for select to anon, authenticated
  using (is_cert_published(tasks.certification_id) or is_platform_admin());

-- ---- concepts ----
drop policy if exists "catalog read concepts" on public.concepts;     -- (true)
create policy "concepts catalog read"
  on public.concepts for select to anon, authenticated
  using (is_cert_published(concepts.certification_id) or is_platform_admin());

-- ---- modules ----
drop policy if exists "catalog read modules" on public.modules;       -- (true)
create policy "modules catalog read"
  on public.modules for select to anon, authenticated
  using (is_cert_published(modules.certification_id) or is_platform_admin());

-- ---- task_concepts (cert resolved via its task) ----
drop policy if exists "task_concepts public read" on public.task_concepts;  -- 056 (true)
drop policy if exists "auth read task_concepts" on public.task_concepts;     -- authenticated-only
create policy "task_concepts catalog read"
  on public.task_concepts for select to anon, authenticated
  using (is_task_published(task_concepts.task_id) or is_platform_admin());

commit;

-- ===========================================================================
-- VERIFY (run separately after COMMIT). Published certs must stay visible to
-- anon; unpublished must be hidden. If "unpublished_visible_to_anon" is not 0,
-- or a published count is 0, ROLLBACK with the block at the bottom.
-- ===========================================================================
-- set role anon;
-- select 'SM domains (expect 5)'  as check, count(*) from public.domains where certification_id='11111111-1111-1111-1111-111111111111'
-- union all
-- select 'SPO domains (expect >0)', count(*) from public.domains where certification_id='33333333-3333-3333-3333-333333333333'
-- union all
-- select 'unpublished domains visible to anon (expect 0)',
--        count(*) from public.domains d join public.certifications c on c.id=d.certification_id where c.is_published = false
-- union all
-- select 'unpublished task_concepts visible to anon (expect 0)',
--        count(*) from public.task_concepts tc join public.tasks t on t.id=tc.task_id
--                 join public.certifications c on c.id=t.certification_id where c.is_published = false;
-- reset role;

-- ===========================================================================
-- ROLLBACK (only if verification fails — restores the prior permissive reads).
-- ===========================================================================
-- begin;
-- drop policy if exists "domains catalog read" on public.domains;
-- create policy "domains public read" on public.domains for select to anon, authenticated using (true);
-- drop policy if exists "tasks catalog read" on public.tasks;
-- create policy "tasks public read" on public.tasks for select to anon, authenticated using (true);
-- drop policy if exists "concepts catalog read" on public.concepts;
-- create policy "catalog read concepts" on public.concepts for select to public using (true);
-- drop policy if exists "modules catalog read" on public.modules;
-- create policy "catalog read modules" on public.modules for select to public using (true);
-- drop policy if exists "task_concepts catalog read" on public.task_concepts;
-- create policy "task_concepts public read" on public.task_concepts for select to anon, authenticated using (true);
-- commit;
