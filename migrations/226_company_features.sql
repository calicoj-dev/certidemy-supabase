-- 226_company_features.sql
--
-- Feature entitlements for companies, and the registry of features that exist.
--
-- ===================== WHY NOW, HAVING DECLINED EARLIER =====================
--
-- This was deliberately NOT built when the analyzer schema was designed: there
-- was no feature to gate, and a flag table with nothing behind it is debt.
--
-- There is now. The curriculum coverage analyzer is a partner-portal tool that
-- must be switchable per company from the super admin console. Without this,
-- it ships enabled to everyone by default -- which is the wrong default for a
-- tool that reads our blueprint and is part of a paid partner tier.
--
-- ========================== DESIGN DECISIONS ==========================
--
-- ABSENT MEANS DISABLED. There is no `enabled` boolean. A company either has a
-- live grant row or it does not. A boolean invites the state where a row exists
-- saying false, and then two places disagree about what "no row" means.
--
-- REVOKED, NOT DELETED. Turning a feature off sets revoked_at rather than
-- removing the row, so "who had access to what, when" survives. That question
-- gets asked during a contract dispute, and the answer should not be "we
-- deleted it".
--
-- THE CHECK BELONGS IN THE LOADER, NOT THE COMPONENT. Same rule as the public
-- lesson payload and the analyzer firewall: a control a renderer can forget is
-- not a control. A disabled feature must return no data, not hidden data.
--
-- A REGISTRY, NOT FREE TEXT. platform_features is the list of keys that exist,
-- and company_features references it. A typo in a feature key would otherwise
-- silently grant nothing while appearing to work, and nobody would find out
-- until a partner complained.
--
-- ASCII-only. Editor-first.
--
-- Tip before this migration: 225. This is 226.


-- =====================================================================
-- SECTION 1 - the registry
-- =====================================================================

create table if not exists public.platform_features (
  key              text primary key,
  name             text not null,
  description      text,
  is_partner_facing boolean not null default true,
  created_at       timestamptz not null default now(),
  constraint platform_features_key_shape
    check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

comment on table public.platform_features is
  'The features that exist and can be granted. company_features references this, so a typo in a key fails loudly instead of silently granting nothing.';

insert into public.platform_features (key, name, description, is_partner_facing)
values
  ('curriculum_coverage',
   'Curriculum coverage analyzer',
   'Compares a partner course syllabus against a Certidemy blueprint and reports coverage, terminology drift, weighting divergence and reverse gaps. Reads published artifacts only; never the secure item bank.',
   true)
on conflict (key) do update set
  name        = excluded.name,
  description = excluded.description;


-- =====================================================================
-- SECTION 2 - the grants
-- =====================================================================

create table if not exists public.company_features (
  company_id   uuid not null references public.companies(id) on delete cascade,
  feature_key  text not null references public.platform_features(key) on delete restrict,
  granted_at   timestamptz not null default now(),
  granted_by   uuid references auth.users(id) on delete set null,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  revoked_by   uuid references auth.users(id) on delete set null,
  notes        text,
  primary key (company_id, feature_key),
  constraint company_features_revocation_pairing
    check ((revoked_at is null) = (revoked_by is null) or revoked_by is null),
  constraint company_features_expiry_after_grant
    check (expires_at is null or expires_at > granted_at)
);

create index if not exists company_features_active_idx
  on public.company_features (feature_key, company_id)
  where revoked_at is null;

comment on table public.company_features is
  'Per-company feature grants. ABSENT MEANS DISABLED -- there is no enabled flag. Revoking sets revoked_at rather than deleting, so the record of who had access when survives a contract dispute.';


-- =====================================================================
-- SECTION 3 - the single source of truth for "is it on"
--
-- One function, so the liveness rule (not revoked AND not expired) is written
-- once. Every loader calls this; nothing re-implements the comparison.
-- =====================================================================

create or replace function public.company_has_feature(p_company_id uuid, p_feature_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.company_features cf
     where cf.company_id  = p_company_id
       and cf.feature_key = p_feature_key
       and cf.revoked_at is null
       and (cf.expires_at is null or cf.expires_at > now())
  );
$$;

comment on function public.company_has_feature(uuid, text) is
  'The ONLY definition of whether a feature is live for a company. Liveness is not-revoked AND not-expired; writing that comparison anywhere else invites the two copies to disagree.';


-- =====================================================================
-- SECTION 4 - RLS
-- Closed, same posture as the analyzer tables. service_role only; the console
-- reads and writes through an edge function.
--
-- When the partner portal needs to read its OWN grants, add a policy scoped to
-- the caller's company AND a column-scoped grant -- never a table-wide
-- GRANT SELECT, which would expose notes and granted_by across companies.
-- =====================================================================

alter table public.platform_features enable row level security;
alter table public.company_features  enable row level security;

revoke all on public.platform_features from anon, authenticated;
revoke all on public.company_features  from anon, authenticated;


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME.
-- =====================================================================

-- 1) both tables exist, one feature registered
-- select key, name, is_partner_facing from public.platform_features order by key;

-- 2) RLS on, no grants leaked (expect ZERO rows)
-- select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--  where table_schema = 'public'
--    and grantee in ('anon','authenticated')
--    and table_name in ('platform_features','company_features');

-- 3) DEFAULT IS OFF. Pick any company; expect false.
-- select c.id, c.name, public.company_has_feature(c.id, 'curriculum_coverage') as has_it
--   from public.companies c
--  order by c.name
--  limit 5;

-- 4) NEGATIVE TEST - an unregistered key must be rejected by the FK.
--    Expect: violates foreign key constraint.
-- insert into public.company_features (company_id, feature_key)
-- select id, 'curiculum_coverage'  -- deliberate typo
--   from public.companies limit 1;
