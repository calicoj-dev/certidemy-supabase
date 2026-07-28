-- 157_asset_downloads.sql
--
-- Audit trail for the sales library. Both tiers are logged.
--
-- REQUIRES 154 (the 'marketing' enum value).
--
-- Cheap now, and the only way to answer "how did this reach them" if an
-- internal-tier comparison sheet ever surfaces where it should not. Internal
-- assets have no public route at all (spec §5), so a leak can only happen via a
-- human forwarding a downloaded file -- which means the download record is the
-- entire evidence trail.
--
-- Writes come from the render-asset edge function under the service role, so no
-- insert grant to authenticated is needed or wanted: a client must not be able
-- to forge or suppress a log line.

begin;

create table if not exists public.asset_downloads (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id),
  asset_type        text not null,
  tier              text not null check (tier in ('client_safe', 'internal')),
  certification_id  uuid references public.certifications(id) on delete set null,
  language          text check (language in ('en', 'es-419', 'pt-BR')),
  downloaded_at     timestamptz not null default now()
);

-- certification_id is nullable: the catalog overview and claims sheet are
-- platform-level assets with no single cert.

create index if not exists asset_downloads_user_idx
  on public.asset_downloads (user_id, downloaded_at desc);

create index if not exists asset_downloads_tier_idx
  on public.asset_downloads (tier, downloaded_at desc);

alter table public.asset_downloads enable row level security;

-- Platform admin reads everything. Marketing reads only its own history -- a
-- rep can see what they pulled, not what a colleague pulled. Nobody can write
-- through this path at all; the service role bypasses RLS for the insert.
create policy asset_downloads_select_admin
  on public.asset_downloads for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.platform_role = 'platform_admin'::platform_role
    )
  );

create policy asset_downloads_select_own
  on public.asset_downloads for select
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.platform_role = 'marketing'::platform_role
    )
  );

grant select on public.asset_downloads to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
--
-- select policyname, cmd from pg_policies
--  where schemaname='public' and tablename='asset_downloads';
--   Expect two SELECT rows and no INSERT policy. That is correct: inserts go
--   through the service role only.
--
-- Retention is still an open decision (spec §15.5). No purge job ships here --
-- adding one later is a one-line cron; deleting history we should have kept is
-- not recoverable.
