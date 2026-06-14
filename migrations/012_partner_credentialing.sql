-- 012_partner_credentialing.sql
-- =============================================================================
-- BASELINE MIGRATION (v1.1 partner / B2B credentialing layer)
--
-- Records schema that was applied via the Supabase SQL editor and never
-- versioned. It is IDEMPOTENT and dependency-ordered, so it is safe to run
-- against the live DB (every statement no-ops if the object already exists)
-- AND it rebuilds these objects from scratch on a fresh environment.
--
-- Deviates from the plain `create` style of 002-011 on purpose: a baseline that
-- captures existing state must be guarded so re-running is harmless.
--
-- Objects, in dependency order:
--   1. is_company_admin()            (helper; the other two helpers live in 002/003)
--   2. company_certifications        (B2B allocation)
--   3. seat_batches                  (per-invoice seat batches; vouchers.batch_id -> here)
--   4. credentials                   (minted on exam pass)
--   5. exam_attempts                 (cert-exam attempts; distinct from mock_exam_results)
--   6. vouchers                      (exam seats)
--   7. cyclic FKs                    (credentials<->exam_attempts<->vouchers), added last
--   8. admin_actions                 (audit log)
--
-- Pre-existing dependencies (created in earlier migrations / base schema):
--   certifications, companies, profiles, team_members, quiz_sessions, auth.users,
--   is_platform_admin() (002/003), is_team_admin_of() (002/003).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper: is_company_admin(target_company)
--    (is_platform_admin / is_team_admin_of are already versioned in 002/003)
-- -----------------------------------------------------------------------------
create or replace function public.is_company_admin(target_company uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from team_members
    where user_id = auth.uid()
      and company_id = target_company
      and role = 'team_admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. company_certifications  (what a partner has been sold)
-- -----------------------------------------------------------------------------
create table if not exists public.company_certifications (
  id                 uuid not null default uuid_generate_v4(),
  company_id         uuid not null,
  certification_id   uuid not null,
  seats_allocated    integer not null default 0,
  seats_used         integer not null default 0,
  expires_at         timestamptz,
  created_at         timestamptz not null default now(),
  attempts_per_seat  integer,
  invoice_ref        text,
  constraint company_certifications_pkey primary key (id),
  constraint company_certifications_company_id_certification_id_key
    unique (company_id, certification_id),
  constraint company_certifications_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete cascade,
  constraint company_certifications_cert_fk
    foreign key (certification_id) references public.certifications(id) on delete cascade,
  constraint company_certifications_seats_allocated_check check (seats_allocated >= 0),
  constraint company_certifications_seats_used_check check (seats_used >= 0)
);

alter table public.company_certifications enable row level security;

drop policy if exists "company_certs read" on public.company_certifications;
create policy "company_certs read" on public.company_certifications
  for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.company_id = company_certifications.company_id
        and tm.user_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- -----------------------------------------------------------------------------
-- 3. seat_batches  (per-invoice seat batches; backs the quota views)
-- -----------------------------------------------------------------------------
create table if not exists public.seat_batches (
  id                       uuid not null default gen_random_uuid(),
  company_certification_id uuid not null,
  company_id               uuid not null,
  certification_id         uuid not null,
  seats                    integer not null default 0,
  attempts_per_seat        integer,
  invoice_ref              text,
  expires_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint seat_batches_pkey primary key (id),
  constraint seat_batches_company_certification_id_fkey
    foreign key (company_certification_id) references public.company_certifications(id) on delete cascade,
  constraint seat_batches_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete cascade,
  constraint seat_batches_certification_id_fkey
    foreign key (certification_id) references public.certifications(id) on delete cascade,
  constraint seat_batches_seats_check check (seats >= 0),
  constraint seat_batches_attempts_per_seat_check
    check (attempts_per_seat is null or attempts_per_seat >= 1)
);

create index if not exists seat_batches_cc_idx
  on public.seat_batches using btree (company_certification_id);
create index if not exists seat_batches_company_idx
  on public.seat_batches using btree (company_id);

alter table public.seat_batches enable row level security;

drop policy if exists seat_batches_company_read on public.seat_batches;
create policy seat_batches_company_read on public.seat_batches
  for select
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.team_members tm
      where tm.company_id = seat_batches.company_id
        and tm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 4. credentials  (exam_attempt_id FK deferred to step 7)
-- -----------------------------------------------------------------------------
create table if not exists public.credentials (
  id                 uuid not null default gen_random_uuid(),
  credential_code    text not null,
  user_id            uuid not null,
  certification_id   uuid not null,
  exam_attempt_id    uuid,
  holder_name        text not null,
  certification_name text not null,
  certification_code text not null,
  score_pct          numeric not null,
  issued_at          timestamptz not null default now(),
  expires_at         timestamptz,
  status             text not null default 'active',
  created_at         timestamptz not null default now(),
  locale             text,
  certificate_path   text,
  credly_badge_id    text,
  credly_badge_url   text,
  constraint credentials_pkey primary key (id),
  constraint credentials_credential_code_key unique (credential_code),
  constraint credentials_user_id_fkey
    foreign key (user_id) references auth.users(id),
  constraint credentials_certification_id_fkey
    foreign key (certification_id) references public.certifications(id),
  constraint credentials_status_check
    check (status = any (array['active'::text, 'revoked'::text, 'expired'::text]))
);

-- One ACTIVE credential per user+cert (revoked/expired don't count).
create unique index if not exists credentials_one_active_per_cert
  on public.credentials using btree (user_id, certification_id)
  where (status = 'active'::text);

alter table public.credentials enable row level security;

drop policy if exists "owner reads own credentials" on public.credentials;
create policy "owner reads own credentials" on public.credentials
  for select
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. exam_attempts  (voucher_id FK deferred to step 7)
-- -----------------------------------------------------------------------------
create table if not exists public.exam_attempts (
  id               uuid not null default uuid_generate_v4(),
  user_id          uuid not null,
  certification_id uuid not null,
  session_id       uuid,
  company_id       uuid,
  voucher_id       uuid,
  score_pct        numeric not null,
  passed           boolean not null,
  total_questions  integer not null,
  correct_answers  integer not null,
  duration_seconds integer,
  submitted_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  constraint exam_attempts_pkey primary key (id),
  constraint exam_attempts_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint exam_attempts_certification_id_fkey
    foreign key (certification_id) references public.certifications(id),
  constraint exam_attempts_session_id_fkey
    foreign key (session_id) references public.quiz_sessions(id),
  constraint exam_attempts_company_id_fkey
    foreign key (company_id) references public.companies(id)
);

create index if not exists idx_exam_attempts_user
  on public.exam_attempts using btree (user_id);
create index if not exists idx_exam_attempts_cert
  on public.exam_attempts using btree (certification_id);
create index if not exists idx_exam_attempts_company
  on public.exam_attempts using btree (company_id);

alter table public.exam_attempts enable row level security;

drop policy if exists "own attempts read" on public.exam_attempts;
create policy "own attempts read" on public.exam_attempts
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_company_admin(company_id)
    or public.is_platform_admin()
  );

-- -----------------------------------------------------------------------------
-- 6. vouchers  (credential_id FK deferred to step 7)
-- -----------------------------------------------------------------------------
create table if not exists public.vouchers (
  id                       uuid not null default uuid_generate_v4(),
  voucher_code             text not null,
  certification_id         uuid not null,
  company_certification_id uuid,
  company_id               uuid,
  assigned_user_id         uuid,
  assigned_email           text,
  assigned_by              uuid,
  status                   text not null default 'available',
  attempts_allowed         integer,
  attempts_used            integer not null default 0,
  assigned_at              timestamptz,
  redeemed_at              timestamptz,
  revoked_at               timestamptz,
  revoked_reason           text,
  credential_id            uuid,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  batch_id                 uuid,
  constraint vouchers_pkey primary key (id),
  constraint vouchers_voucher_code_key unique (voucher_code),
  constraint vouchers_certification_id_fkey
    foreign key (certification_id) references public.certifications(id),
  constraint vouchers_company_certification_id_fkey
    foreign key (company_certification_id) references public.company_certifications(id),
  constraint vouchers_company_id_fkey
    foreign key (company_id) references public.companies(id),
  constraint vouchers_batch_id_fkey
    foreign key (batch_id) references public.seat_batches(id),
  constraint vouchers_status_check
    check (status = any (array['available'::text, 'assigned'::text, 'redeemed'::text, 'revoked'::text]))
);

create index if not exists idx_vouchers_assigned_user
  on public.vouchers using btree (assigned_user_id, certification_id, status);
create index if not exists idx_vouchers_company
  on public.vouchers using btree (company_id, status);
create index if not exists idx_vouchers_allocation
  on public.vouchers using btree (company_certification_id);
create index if not exists idx_vouchers_code
  on public.vouchers using btree (voucher_code);
create index if not exists vouchers_batch_idx
  on public.vouchers using btree (batch_id);
-- One non-revoked voucher per email+cert.
create unique index if not exists vouchers_email_cert_active_uniq
  on public.vouchers using btree (assigned_email, certification_id)
  where ((status <> 'revoked'::text) and (assigned_email is not null));

alter table public.vouchers enable row level security;

drop policy if exists vouchers_select_own on public.vouchers;
create policy vouchers_select_own on public.vouchers
  for select
  using (assigned_user_id = auth.uid());

drop policy if exists vouchers_select_company_admin on public.vouchers;
create policy vouchers_select_company_admin on public.vouchers
  for select
  using (
    company_id in (
      select tm.company_id from public.team_members tm
      where tm.user_id = auth.uid() and tm.role = 'team_admin'::team_role
    )
  );

drop policy if exists vouchers_select_platform_admin on public.vouchers;
create policy vouchers_select_platform_admin on public.vouchers
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.platform_role = 'platform_admin'::platform_role
    )
  );

-- -----------------------------------------------------------------------------
-- 7. Cyclic FKs (added now that all three tables exist)
--    credentials.exam_attempt_id -> exam_attempts.id
--    exam_attempts.voucher_id    -> vouchers.id
--    vouchers.credential_id      -> credentials.id
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'credentials_exam_attempt_id_fkey') then
    alter table public.credentials
      add constraint credentials_exam_attempt_id_fkey
      foreign key (exam_attempt_id) references public.exam_attempts(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'exam_attempts_voucher_id_fkey') then
    alter table public.exam_attempts
      add constraint exam_attempts_voucher_id_fkey
      foreign key (voucher_id) references public.vouchers(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'vouchers_credential_id_fkey') then
    alter table public.vouchers
      add constraint vouchers_credential_id_fkey
      foreign key (credential_id) references public.credentials(id);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 8. admin_actions  (audit log; no outbound FKs by design)
-- -----------------------------------------------------------------------------
create table if not exists public.admin_actions (
  id            uuid not null default uuid_generate_v4(),
  actor_user_id uuid not null,
  action        text not null,
  target_type   text not null,
  target_id     uuid,
  reason        text,
  metadata      jsonb,
  created_at    timestamptz not null default now(),
  constraint admin_actions_pkey primary key (id)
);

create index if not exists idx_admin_actions_actor
  on public.admin_actions using btree (actor_user_id, created_at desc);
create index if not exists idx_admin_actions_target
  on public.admin_actions using btree (target_type, target_id);

alter table public.admin_actions enable row level security;

drop policy if exists admin_actions_select_platform_admin on public.admin_actions;
create policy admin_actions_select_platform_admin on public.admin_actions
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.platform_role = 'platform_admin'::platform_role
    )
  );
