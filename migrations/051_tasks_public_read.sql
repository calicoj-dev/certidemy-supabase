-- Public read for tasks (anon + authenticated).
-- The Blueprint/JTA drawer and cert detail pages read tasks for logged-out
-- visitors. Without this dual-gate, anon got zero rows (GRANT was missing) and
-- the drawer rendered empty. Applied in the SQL editor first; this is the
-- versioned record.

grant select on public.tasks to anon, authenticated;

alter table public.tasks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tasks'
      and policyname = 'tasks public read'
  ) then
    create policy "tasks public read"
      on public.tasks for select
      to anon, authenticated
      using (true);
  end if;
end $$;
