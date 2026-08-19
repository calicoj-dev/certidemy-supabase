-- 232_issuing_api.sql
-- The machine surface: API keys, inbound LMS hooks, outbound webhooks.
--
-- This is what "works with your LMS" actually means. Moodle, Canvas, Thinkific
-- and anything with Zapier can drive issuance through an API key. LTI 1.3 is a
-- separate and later thing that serves exam launch and grade passback, not
-- badge issuance.
--
-- KEYS ARE NEVER STORED. Only sha256(key) and a display prefix. A partner who
-- loses a key gets a new one; there is no recovery path and that is correct.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. API keys

create table if not exists public.issuer_api_keys (
  id           uuid primary key default gen_random_uuid(),
  issuer_id    uuid not null references public.issuers(id) on delete cascade,
  name         text not null,

  -- shown in the UI so a partner can tell two keys apart, e.g. 'cdk_live_a1b2c3d4'
  key_prefix   text not null,
  -- sha256 hex of the full key. The key itself is displayed exactly once.
  key_hash     text not null,

  scopes       text[] not null default '{credentials:issue}',
  environment  text not null default 'live',

  last_used_at timestamptz,
  last_used_ip inet,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  revoked_by   uuid references auth.users(id),

  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create unique index if not exists issuer_api_keys_hash_unique on public.issuer_api_keys(key_hash);
create unique index if not exists issuer_api_keys_prefix_unique on public.issuer_api_keys(key_prefix);
create index if not exists issuer_api_keys_issuer_idx
  on public.issuer_api_keys(issuer_id) where revoked_at is null;

alter table public.issuer_api_keys drop constraint if exists issuer_api_keys_env_vocab;
alter table public.issuer_api_keys add constraint issuer_api_keys_env_vocab
  check (environment in ('live','test'));

-- A key belonging to a non-active issuer must not authenticate. Enforced at the
-- API layer too, but a dormant key on a deactivated issuer is exactly the thing
-- that gets forgotten.
create or replace function public.guard_api_key_issuer()
returns trigger language plpgsql as $$
declare
  v_status public.issuer_status;
begin
  select status into v_status from public.issuers where id = new.issuer_id;
  if tg_op = 'INSERT' and v_status <> 'active' then
    raise exception 'cannot mint an API key for an issuer with status %', v_status;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_api_key_issuer on public.issuer_api_keys;
create trigger trg_guard_api_key_issuer
  before insert on public.issuer_api_keys
  for each row execute function public.guard_api_key_issuer();

-- ============================================================ 2. inbound hooks
-- An LMS posts its own payload shape on course completion. One row per source
-- per issuer, each with its own signing secret and a default achievement.

create table if not exists public.issuer_inbound_hooks (
  id                    uuid primary key default gen_random_uuid(),
  issuer_id             uuid not null references public.issuers(id) on delete cascade,
  source                text not null,
  -- the public path segment: /hooks/inbound/<hook_token>
  hook_token            text not null,
  -- HMAC secret. Stored in Vault; this is the reference.
  signing_secret_id     uuid,
  -- what gets issued when this hook fires, unless the payload names one
  default_achievement_id uuid references public.achievements(id) on delete restrict,
  -- field path in the incoming payload that holds the recipient email
  email_path            text not null default 'email',
  is_active             boolean not null default true,
  last_fired_at         timestamptz,
  created_by            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index if not exists issuer_inbound_hooks_token_unique
  on public.issuer_inbound_hooks(hook_token);
create index if not exists issuer_inbound_hooks_issuer_idx
  on public.issuer_inbound_hooks(issuer_id);

alter table public.issuer_inbound_hooks drop constraint if exists issuer_inbound_hooks_source_vocab;
alter table public.issuer_inbound_hooks add constraint issuer_inbound_hooks_source_vocab
  check (source in ('moodle','canvas','thinkific','teachable','zapier','make','generic'));

-- ============================================================ 3. outbound webhooks

create table if not exists public.issuer_webhooks (
  id             uuid primary key default gen_random_uuid(),
  issuer_id      uuid not null references public.issuers(id) on delete cascade,
  url            text not null,
  secret_id      uuid,
  events         text[] not null default '{credential.issued}',
  is_active      boolean not null default true,
  failure_count  integer not null default 0,
  disabled_at    timestamptz,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists issuer_webhooks_issuer_idx
  on public.issuer_webhooks(issuer_id) where is_active;

alter table public.issuer_webhooks drop constraint if exists issuer_webhooks_url_https;
alter table public.issuer_webhooks add constraint issuer_webhooks_url_https
  check (url like 'https://%');

-- ============================================================ 4. delivery queue
-- A webhook without a retry queue is a webhook that silently drops on the
-- first timeout.

create table if not exists public.webhook_deliveries (
  id             uuid primary key default gen_random_uuid(),
  webhook_id     uuid not null references public.issuer_webhooks(id) on delete cascade,
  event          text not null,
  payload        jsonb not null,
  status         text not null default 'pending',
  attempts       integer not null default 0,
  response_code  integer,
  last_error     text,
  next_retry_at  timestamptz,
  delivered_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists webhook_deliveries_due_idx
  on public.webhook_deliveries(next_retry_at)
  where status = 'pending';
create index if not exists webhook_deliveries_webhook_idx
  on public.webhook_deliveries(webhook_id, created_at desc);

alter table public.webhook_deliveries drop constraint if exists webhook_deliveries_status_vocab;
alter table public.webhook_deliveries add constraint webhook_deliveries_status_vocab
  check (status in ('pending','delivered','failed','abandoned'));

-- ============================================================ 5. request log
-- Every write through the issuing API. This is the answer to "we did not issue
-- that" and it is cheap.

create table if not exists public.issuer_api_requests (
  id            uuid primary key default gen_random_uuid(),
  issuer_id     uuid not null references public.issuers(id) on delete cascade,
  api_key_id    uuid references public.issuer_api_keys(id) on delete set null,
  method        text not null,
  path          text not null,
  status_code   integer not null,
  credential_id uuid references public.credentials(id) on delete set null,
  idempotency_key text,
  error         text,
  ip            inet,
  created_at    timestamptz not null default now()
);

create index if not exists issuer_api_requests_issuer_idx
  on public.issuer_api_requests(issuer_id, created_at desc);

-- Replayed POSTs must not mint twice.
create unique index if not exists issuer_api_requests_idempotency_unique
  on public.issuer_api_requests(issuer_id, idempotency_key)
  where idempotency_key is not null;

-- ============================================================ 6. RLS
-- Everything here is service-role only. Partner reads go through edge functions
-- exactly as the console already does for credentials and vouchers.

alter table public.issuer_api_keys      enable row level security;
alter table public.issuer_inbound_hooks enable row level security;
alter table public.issuer_webhooks      enable row level security;
alter table public.webhook_deliveries   enable row level security;
alter table public.issuer_api_requests  enable row level security;

commit;

-- Verification (run separately):
--
--   select table_name from information_schema.tables
--   where table_schema='public'
--     and table_name in ('issuer_api_keys','issuer_inbound_hooks','issuer_webhooks',
--                        'webhook_deliveries','issuer_api_requests')
--   order by 1;
--   -- expect 5 rows
--
-- Prove the key guard bites. This MUST raise:
--
--   insert into public.issuer_api_keys (issuer_id, name, key_prefix, key_hash)
--   values ((select id from public.issuers where slug='certidemy'),
--           'x','cdk_test_0000', repeat('a',64));
--   -- WAIT: certidemy IS active, so this SUCCEEDS. Delete it:
--   --   delete from public.issuer_api_keys where key_prefix='cdk_test_0000';
--   -- To test the guard properly, insert a draft issuer first and try against that.
