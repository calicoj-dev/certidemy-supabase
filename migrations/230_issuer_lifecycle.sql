-- 230_issuer_lifecycle.sql
-- Issuer lifecycle: draft -> verified -> active -> deactivated.
--
-- RUN IN THE SUPABASE SQL EDITOR ON 2026-08-19. This file is the versioned
-- record of what already executed, committed after the fact per the
-- editor-first workflow.
--
-- Context: before this migration public.issuers held exactly one row
-- ('certidemy', seeded by 185) and there was no code path that created a
-- second. This adds the lifecycle a partner issuer moves through, and the
-- DB-side guarantee that a slug can never move once it is public.
--
-- A slug appears inside every credential that issuer ever signs. Immutability
-- is therefore enforced by trigger, not by application convention.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ---------------------------------------------------------------- 1. lifecycle
do $$ begin
  create type public.issuer_status as enum ('draft','verified','active','deactivated');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- 2. columns
alter table public.issuers
  add column if not exists status              public.issuer_status not null default 'draft',
  add column if not exists company_id          uuid references public.companies(id) on delete restrict,
  add column if not exists verification_domain text,
  add column if not exists verification_token  text,
  add column if not exists verified_at         timestamptz,
  add column if not exists activated_at        timestamptz;

-- ---------------------------------------------------------------- 3. backfill
-- The existing row is serving live credentials. It is active, not a draft.
update public.issuers
set status = 'active', activated_at = coalesce(activated_at, created_at)
where slug = 'certidemy';

-- ---------------------------------------------------------------- 4. slug format
-- Format only. The reserved-word list lives in the admin activation path,
-- because it is policy and will change more often than the schema.
alter table public.issuers drop constraint if exists issuers_slug_format;
alter table public.issuers add constraint issuers_slug_format
  check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');

-- ---------------------------------------------------------------- 5. active means signable
alter table public.issuers drop constraint if exists issuers_active_requires_keys;
alter table public.issuers add constraint issuers_active_requires_keys
  check (status <> 'active'
         or (vault_secret_id is not null
             and public_key_multibase is not null
             and key_id is not null));

-- ---------------------------------------------------------------- 6. one per company
create unique index if not exists issuers_company_id_unique
  on public.issuers(company_id) where company_id is not null;

-- ---------------------------------------------------------------- 7. the guard
-- Slug immutable once activated. is_active derived from status so the two
-- can never disagree.
create or replace function public.guard_issuer_identity()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and new.slug is distinct from old.slug
     and old.status in ('active','deactivated') then
    raise exception 'issuer slug is immutable once activated (id=%, slug=%)', old.id, old.slug;
  end if;
  new.is_active := (new.status = 'active');
  return new;
end $$;

drop trigger if exists trg_guard_issuer_identity on public.issuers;
create trigger trg_guard_issuer_identity
  before insert or update on public.issuers
  for each row execute function public.guard_issuer_identity();

commit;

-- Verification (run separately):
--
--   select slug, status, is_active, company_id,
--          activated_at is not null as activated,
--          vault_secret_id is not null as has_vault
--   from public.issuers;
--   -- expect: certidemy / active / true / null / true / true
--
--   update public.issuers set slug = 'certidemy-x' where slug = 'certidemy';
--   -- MUST raise P0001. An "UPDATE 1" here means the trigger did not attach.
--
-- Both verified green on 2026-08-19.
