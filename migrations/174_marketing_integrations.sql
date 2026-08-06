-- 174_marketing_integrations.sql
--
-- Advertising / analytics vendor configuration.
--
-- DESIGN RULE (do not relax): this table stores IDENTIFIERS, never executable
-- code. There is no `snippet` column and there must never be one. A pasted
-- <script> block is arbitrary JavaScript executing on every visitor, authorable
-- by anyone holding the marketing role, on a platform that runs secure
-- examinations and publishes credential verification.
--
-- The vendor list lives in `lib/marketing/vendors.ts`. Adding a vendor the code
-- has never heard of is a code change. Enabling one the code knows is a row.
--
-- Server-side conversion tokens (Meta CAPI, Google Enhanced Conversions,
-- LinkedIn CAPI) follow the migration 144 GHL pattern: the token is NEVER in
-- this table, only a pointer to a Vault secret plus key_last4.
--
-- Editor-first. Run in the Supabase SQL editor; this file is the versioned
-- record. One statement at a time.

-- ---------------------------------------------------------------------------
-- 1. Enum: consent category
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'consent_category') then
    create type public.consent_category as enum ('necessary', 'marketing');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------------

create table if not exists public.marketing_integrations (
  vendor            text primary key,
  -- The one variable. Meta pixel id, AW-xxxxx, G-xxxxx, LinkedIn partner id.
  -- Public by construction: it is visible in page source once the tag loads.
  external_id       text        not null,

  enabled           boolean     not null default false,

  -- Which canonical events fire to this vendor. Validated against the event
  -- enum in lib/marketing/vendors.ts. `credential_issued` deliberately does
  -- not exist as an event anywhere in this system.
  events            text[]      not null default array['page_view','sign_up']::text[],

  consent_category  public.consent_category not null default 'marketing',

  -- Non-secret vendor extras: conversion labels, GA4 measurement path, etc.
  settings          jsonb       not null default '{}'::jsonb,

  -- Server-side conversions. Pointer only; the token itself lives in Vault.
  vault_secret_id   uuid,
  key_last4         text,

  last_error        text,
  last_verified_at  timestamptz,

  created_by        uuid        references auth.users(id) on delete set null,
  updated_by        uuid        references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- A disabled row may hold a blank id (vendor staged, id not yet issued).
  -- An ENABLED row may not: an empty id renders a broken tag on every page.
  constraint marketing_integrations_id_required
    check (enabled = false or length(btrim(external_id)) > 0)
);

comment on table public.marketing_integrations is
  'Advertising/analytics vendor identifiers. IDs only, never executable code. Vendor adapters live in lib/marketing/vendors.ts.';
comment on column public.marketing_integrations.external_id is
  'Public vendor identifier (pixel id, measurement id). Not a secret.';
comment on column public.marketing_integrations.vault_secret_id is
  'Pointer to a Vault secret for server-side conversion APIs. NEVER granted to anon or authenticated.';

-- ---------------------------------------------------------------------------
-- 3. Audit trail
-- ---------------------------------------------------------------------------

create table if not exists public.marketing_integrations_audit (
  id          bigserial primary key,
  vendor      text        not null,
  action      text        not null,       -- insert | update | delete
  before      jsonb,
  after       jsonb,
  actor       uuid,
  occurred_at timestamptz not null default now()
);

create or replace function public.trg_marketing_integrations_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
  v_after  jsonb;
begin
  -- Never write the vault pointer into the audit trail.
  if tg_op <> 'INSERT' then
    v_before := to_jsonb(old) - 'vault_secret_id';
  end if;
  if tg_op <> 'DELETE' then
    v_after := to_jsonb(new) - 'vault_secret_id';
  end if;

  insert into public.marketing_integrations_audit (vendor, action, before, after, actor)
  values (
    coalesce(new.vendor, old.vendor),
    lower(tg_op),
    v_before,
    v_after,
    auth.uid()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists trg_marketing_integrations_audit on public.marketing_integrations;
create trigger trg_marketing_integrations_audit
  before insert or update or delete on public.marketing_integrations
  for each row execute function public.trg_marketing_integrations_audit();

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------

alter table public.marketing_integrations       enable row level security;
alter table public.marketing_integrations_audit enable row level security;

-- Public read of ENABLED rows only. The loader on a marketing page needs the
-- identifier, and the identifier is public the moment the tag renders.
-- A disabled row is a staging decision and is nobody's business.
drop policy if exists marketing_integrations_public_read on public.marketing_integrations;
create policy marketing_integrations_public_read
  on public.marketing_integrations
  for select
  to anon, authenticated
  using (enabled = true);

-- Writes and audit reads are service-role only (service_role bypasses RLS).
-- No authenticated policy is defined for insert/update/delete, and none should
-- be: every write goes through the admin-gated edge function.

-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------
--
-- RLS IS NOT A GRANT. A policy passing does nothing if the table-level grant is
-- missing; the read fails 42501 and a failure-tolerant loader swallows it.
--
-- These are COLUMN-SCOPED on purpose. A table-wide `grant select` re-confers
-- every column and silently overrides any column-level revoke, which would
-- expose vault_secret_id and key_last4. Every safe column is listed explicitly;
-- adding a column to this table means deciding whether it belongs on this line.

revoke all on public.marketing_integrations       from anon, authenticated;
revoke all on public.marketing_integrations_audit from anon, authenticated;

grant select (vendor, external_id, enabled, events, consent_category, settings, updated_at)
  on public.marketing_integrations
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Vault wrappers for server-side conversion tokens
--    Mirrors integration_store_token / integration_read_token from 144.
-- ---------------------------------------------------------------------------

create or replace function public.marketing_store_token(
  p_vendor text,
  p_token  text,
  p_actor  uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_existing uuid;
  v_name     text := 'marketing_' || p_vendor;
begin
  select vault_secret_id into v_existing
    from public.marketing_integrations where vendor = p_vendor;

  if v_existing is null then
    v_existing := vault.create_secret(p_token, v_name, 'Server-side conversion token: ' || p_vendor);
  else
    perform vault.update_secret(v_existing, p_token, v_name, null);
  end if;

  update public.marketing_integrations
     set vault_secret_id = v_existing,
         key_last4       = right(p_token, 4),
         last_error      = null,
         updated_by      = p_actor
   where vendor = p_vendor;
end
$$;

create or replace function public.marketing_read_token(p_vendor text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id uuid;
  v_tok text;
begin
  select vault_secret_id into v_id
    from public.marketing_integrations where vendor = p_vendor;
  if v_id is null then
    return null;
  end if;
  select decrypted_secret into v_tok
    from vault.decrypted_secrets where id = v_id;
  return v_tok;
end
$$;

revoke all on function public.marketing_store_token(text, text, uuid) from public, anon, authenticated;
revoke all on function public.marketing_read_token(text)              from public, anon, authenticated;
grant execute on function public.marketing_store_token(text, text, uuid) to service_role;
grant execute on function public.marketing_read_token(text)              to service_role;

-- ---------------------------------------------------------------------------
-- 7. Verification (run these; do not assume)
-- ---------------------------------------------------------------------------
--
--   -- expect exactly the seven safe columns, and NOT vault_secret_id/key_last4
--   select grantee, privilege_type, column_name
--     from information_schema.column_privileges
--    where table_name = 'marketing_integrations'
--      and grantee in ('anon','authenticated')
--    order by grantee, column_name;
--
--   -- expect 0 rows: no table-wide grant that would re-confer every column
--   select * from information_schema.table_privileges
--    where table_name = 'marketing_integrations'
--      and grantee in ('anon','authenticated');
--
--   -- from the BROWSER as a non-admin, not the SQL editor:
--   -- select vault_secret_id from marketing_integrations;  -> must fail
