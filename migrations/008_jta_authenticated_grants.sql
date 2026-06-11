-- Migration 008: grant authenticated SELECT on the JTA reference tables.
--
-- Migration 003 created the JTA tables (domains, tasks, task_concepts,
-- lesson_sections, lesson_tasks, widget_definitions) with RLS policies that
-- permit authenticated SELECT — but migration 004 (the grants migration)
-- didn't list these tables. The result: RLS allowed reads in principle while
-- table grants forbade them in practice, producing a silent 42501
-- "permission denied" for every authenticated query joining these tables.
-- Surfaced when the dashboard readiness radar started reading task_concepts.
--
-- This fixes the gap for ALL JTA reference tables, not just the three the
-- radar touches today (domains, tasks, task_concepts). lesson_sections,
-- lesson_tasks, and widget_definitions aren't read from the app yet, but
-- they have the same permission shape — RLS-ready but ungranted — and the
-- next feature that touches them would hit the same wall. Cheap insurance.
--
-- concepts already had a permissive policy and grants from earlier work;
-- re-granting an existing privilege is a no-op, so it's safe to include.
--
-- We grant SELECT only; writes to JTA tables stay gated to platform admins
-- via the existing "admin write *" RLS policies plus the absence of any
-- INSERT/UPDATE/DELETE grant.

begin;

grant select on public.domains            to authenticated;
grant select on public.tasks              to authenticated;
grant select on public.task_concepts      to authenticated;
grant select on public.concepts           to authenticated;
grant select on public.lesson_sections    to authenticated;
grant select on public.lesson_tasks       to authenticated;
grant select on public.widget_definitions to authenticated;

-- Sanity check: confirm all seven tables now have the SELECT grant.
do $$
declare
  missing text;
begin
  select string_agg(t, ', ')
    into missing
  from (values
    ('domains'), ('tasks'), ('task_concepts'), ('concepts'),
    ('lesson_sections'), ('lesson_tasks'), ('widget_definitions')
  ) as v(t)
  where not exists (
    select 1 from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = v.t
      and g.grantee = 'authenticated'
      and g.privilege_type = 'SELECT'
  );
  if missing is not null then
    raise exception 'JTA grants: SELECT to authenticated still missing on: %', missing;
  end if;
end $$;

commit;
