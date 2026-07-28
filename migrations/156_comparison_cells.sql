-- 156_comparison_cells.sql
--
-- The only authored rows in the sales library. Competitor facts are not in our
-- database and cannot be derived, so this is the one place §2 of
-- SALES-LIBRARY-SPEC.md ("every asset is generated, never authored") does not
-- apply -- and it therefore gets the strictest handling.
--
-- REQUIRES 154 (the 'marketing' enum value) to have run in an earlier
-- transaction.
--
-- source_url and verified_as_of are NOT NULL by design. A cell without a source
-- is an assertion, and assertions are what this whole structure exists to
-- avoid. The renderer reads verified_as_of and, per spec §6.3:
--   - published artifacts BLOCK past the staleness threshold (90 days)
--   - internal artifacts PRINT the age on the face of the document
--
-- This table feeds INTERNAL sheets only. The published Scrum family comparison
-- chart on /certifications/scrum is a separate, stricter thing and is not
-- migrated here or superseded by this.

begin;

create table if not exists public.comparison_cells (
  id                uuid primary key default gen_random_uuid(),
  certification_id  uuid not null references public.certifications(id) on delete cascade,
  competitor_label  text not null,
  row_key           text not null,
  cell_value        text not null,
  source_url        text not null,
  verified_as_of    date not null,
  notes             text,
  updated_by        uuid references auth.users(id),
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  constraint comparison_cells_unique unique (certification_id, competitor_label, row_key)
);

create index if not exists comparison_cells_cert_idx
  on public.comparison_cells (certification_id);

create index if not exists comparison_cells_stale_idx
  on public.comparison_cells (verified_as_of);

create or replace function public.touch_comparison_cells()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_comparison_cells on public.comparison_cells;

create trigger trg_touch_comparison_cells
before update on public.comparison_cells
for each row
execute function public.touch_comparison_cells();

alter table public.comparison_cells enable row level security;

-- Predicate copied verbatim from the four existing live policies rather than
-- invented. Marketing and platform admin both get full access; nobody else gets
-- any. There is no learner-facing read here -- these rows never reach a
-- client-safe artifact.
create policy comparison_cells_select_staff
  on public.comparison_cells for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.platform_role in ('platform_admin'::platform_role,
                                 'marketing'::platform_role)
    )
  );

create policy comparison_cells_write_staff
  on public.comparison_cells for all
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.platform_role in ('platform_admin'::platform_role,
                                 'marketing'::platform_role)
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.platform_role in ('platform_admin'::platform_role,
                                 'marketing'::platform_role)
    )
  );

-- Column-scoped, not table-wide. A table-wide grant re-confers every column and
-- silently overrides any later column-level revoke.
grant select on public.comparison_cells to authenticated;
grant insert (certification_id, competitor_label, row_key, cell_value,
              source_url, verified_as_of, notes, updated_by)
  on public.comparison_cells to authenticated;
grant update (competitor_label, row_key, cell_value, source_url,
              verified_as_of, notes, updated_by)
  on public.comparison_cells to authenticated;
grant delete on public.comparison_cells to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
--
-- select policyname, cmd from pg_policies
--  where schemaname='public' and tablename='comparison_cells';
--   Expect two rows.
--
-- select count(*) from public.comparison_cells;
--   Expect 0. Rows arrive through the console, never through the SQL editor --
--   competitor labels carry accents and the editor is this project's
--   documented mojibake source.
