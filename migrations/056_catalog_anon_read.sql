-- 056_catalog_anon_read.sql
--
-- Public (anon) read for the two catalog tables that were still gated to the
-- authenticated role. Mirrors the pattern established in 051_tasks_public_read.sql
-- and the existing "catalog read concepts/modules" policies.
--
-- WHY: the public marketing surfaces (home hero + /certifications/[code]) render
-- the exam composition (domain weights) and the Blueprint/JTA drawer. Under RLS,
-- a logged-out visitor runs as `anon`; `domains` and `task_concepts` had only an
-- `authenticated` SELECT policy, so anon got ZERO rows -> the exam-composition
-- block and Blueprint silently disappeared for prospects (only the hardcoded
-- sample questions showed). This restores them.
--
-- task_concepts is also required for the blueprint "AI-Era" task flag, which is
-- derived (task -> task_concepts -> concepts) and must work logged-out too.
--
-- CONSISTENCY: `tasks` (051) and `concepts`/`modules` are already world-readable
-- with `using (true)` and are NOT gated to published certs. Matching that here
-- keeps the catalog uniform. A separate, deliberate pass (see 057, pending) can
-- gate the WHOLE catalog to is_published if drafts should be hidden — doing it
-- piecemeal on only these two tables would be inconsistent and pointless while
-- their child rows (tasks/concepts) remain public.
--
-- Idempotent: guarded by pg_policies existence checks. RLS already enabled on
-- both tables.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'domains'
      and policyname = 'domains public read'
  ) then
    create policy "domains public read"
      on public.domains
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'task_concepts'
      and policyname = 'task_concepts public read'
  ) then
    create policy "task_concepts public read"
      on public.task_concepts
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;
