-- 062_iso17024_hardening.sql
-- ISO/IEC 17024 pre-launch hardening pass. Cert-agnostic. Editor-first.
--
-- Adds, in one transaction (all-or-nothing; idempotent / re-runnable):
--   1. Per-item telemetry columns on quiz_attempts        (subsystem E)
--   2. Late-submission flag on exam_attempts              (subsystem C)
--   3. jta_versions + blueprint snapshot + version stamp  (subsystem I)
--   4. appeals table (Clause 9.9 candidate review)        (subsystems E/F)
--
-- The cross-language integrity VIEW is a separate migration (063) because it
-- references quiz_questions columns that should be confirmed first.
--
-- After applying this, deploy the updated score-mock-exam (populates the new
-- columns + stamps the version), then run publish_jta_version() per cert.

begin;

-- ============================================================
-- 1. Per-item telemetry columns on quiz_attempts (subsystem E)
--    Existing rows keep NULLs; the scorer populates these going forward.
--    quiz_attempts already carries user_answer / is_correct / time_taken_seconds,
--    so this is the only addition needed for clean item analysis.
-- ============================================================
alter table public.quiz_attempts
  add column if not exists language        text,
  add column if not exists domain_code     text,
  add column if not exists presented_order integer;

comment on column public.quiz_attempts.language is
  'Trilingual form the item was served in (en/es-419/pt-BR), for item analysis by language.';
comment on column public.quiz_attempts.domain_code is
  'Blueprint domain (D1..D5) of the item, for domain-level reliability analysis.';
comment on column public.quiz_attempts.presented_order is
  'Zero-based position the item was shown in the assembled form, for position-effect analysis.';

-- ============================================================
-- 2. Late-submission flag on exam_attempts (subsystem C)
--    The server records lateness; it does NOT auto-reject (the client
--    auto-submits at zero, which covers honest cases). Decision: record,
--    do not reject. A grace window absorbs normal network/processing latency.
-- ============================================================
alter table public.exam_attempts
  add column if not exists late_submission boolean not null default false,
  add column if not exists over_by_seconds integer;

comment on column public.exam_attempts.late_submission is
  'True if the submission arrived after started_at + duration + grace. Recorded, not rejected.';
comment on column public.exam_attempts.over_by_seconds is
  'Seconds past the allowed window (0/NULL if on time). Exam-integrity / appeals evidence.';

-- ============================================================
-- 3. jta_versions — immutable blueprint snapshots (subsystem I)
--    A credential must forever render the blueprint it was earned against.
--    Lightweight model: one row per published JTA version, holding a frozen
--    JSON snapshot of domains + tasks; attempts/credentials stamp the version.
-- ============================================================
create table if not exists public.jta_versions (
  id                 uuid not null default gen_random_uuid(),
  certification_id   uuid not null,
  version_string     text not null,
  status             text not null default 'draft',
  blueprint_snapshot jsonb not null,
  created_at         timestamptz not null default now(),
  constraint jta_versions_pkey primary key (id),
  constraint jta_versions_certification_id_fkey
    foreign key (certification_id) references public.certifications(id) on delete cascade,
  constraint jta_versions_status_chk
    check (status in ('draft','published','retired')),
  constraint jta_versions_cert_version_uq
    unique (certification_id, version_string)
);

-- At most one PUBLISHED version per certification at any time.
create unique index if not exists jta_versions_one_published
  on public.jta_versions (certification_id)
  where status = 'published';

create index if not exists idx_jta_versions_cert
  on public.jta_versions using btree (certification_id);

alter table public.jta_versions enable row level security;

-- Published blueprint snapshots are public-readable (the verify page renders
-- them); writes are admin-only. Mirrors the JTA-translations RLS (migration 061).
drop policy if exists "jta_versions public read" on public.jta_versions;
create policy "jta_versions public read" on public.jta_versions
  for select to anon, authenticated using (true);

drop policy if exists "jta_versions admin write" on public.jta_versions;
create policy "jta_versions admin write" on public.jta_versions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select on public.jta_versions to anon, authenticated;
grant all    on public.jta_versions to service_role;

-- Stamp the JTA version onto the attempt + credential at mint.
alter table public.exam_attempts add column if not exists jta_version_id uuid;
alter table public.credentials   add column if not exists jta_version_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'exam_attempts_jta_version_id_fkey') then
    alter table public.exam_attempts
      add constraint exam_attempts_jta_version_id_fkey
      foreign key (jta_version_id) references public.jta_versions(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'credentials_jta_version_id_fkey') then
    alter table public.credentials
      add constraint credentials_jta_version_id_fkey
      foreign key (jta_version_id) references public.jta_versions(id);
  end if;
end $$;

-- publish_jta_version: snapshot the cert's CURRENT live domains + tasks into a
-- new published version (retiring any prior published one for that cert).
-- Snapshots whole rows via to_jsonb(), so it is robust to column changes and
-- captures task statements/weights without naming every column. Returns the id.
create or replace function public.publish_jta_version(p_cert uuid, p_version text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_snapshot jsonb;
begin
  v_snapshot := jsonb_build_object(
    'certification_id', p_cert,
    'version', p_version,
    'captured_at', now(),
    'domains', coalesce((
      select jsonb_agg(to_jsonb(d.*) order by d.order_index)
      from public.domains d where d.certification_id = p_cert), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(to_jsonb(t.*) order by t.id)
      from public.tasks t where t.certification_id = p_cert), '[]'::jsonb)
  );

  update public.jta_versions
     set status = 'retired'
   where certification_id = p_cert and status = 'published';

  insert into public.jta_versions (certification_id, version_string, status, blueprint_snapshot)
  values (p_cert, p_version, 'published', v_snapshot)
  returning id into v_id;

  return v_id;
end $$;

-- Callable only from a privileged context (SQL editor / service role).
revoke all on function public.publish_jta_version(uuid, text) from public, anon, authenticated;

-- ============================================================
-- 4. appeals — Clause 9.9 candidate review workflow (subsystems E/F)
--    NARROW scope (decided): a re-grade request, or flag a specific item for
--    review. No item content is disclosed to the candidate; the secure bank is
--    never exposed. This also bounds the telemetry retention requirement.
-- ============================================================
create table if not exists public.appeals (
  id                  uuid not null default gen_random_uuid(),
  exam_attempt_id     uuid not null,
  user_id             uuid not null,
  certification_id    uuid not null,
  kind                text not null,
  status              text not null default 'open',
  reason              text,
  flagged_question_id uuid,
  resolution_note     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint appeals_pkey primary key (id),
  constraint appeals_exam_attempt_id_fkey
    foreign key (exam_attempt_id) references public.exam_attempts(id) on delete cascade,
  constraint appeals_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint appeals_certification_id_fkey
    foreign key (certification_id) references public.certifications(id),
  constraint appeals_flagged_question_id_fkey
    foreign key (flagged_question_id) references public.quiz_questions(id),
  constraint appeals_kind_chk   check (kind in ('regrade','item_flag')),
  constraint appeals_status_chk check (status in ('open','under_review','upheld','denied','withdrawn'))
);

create index if not exists idx_appeals_user    on public.appeals using btree (user_id);
create index if not exists idx_appeals_attempt on public.appeals using btree (exam_attempt_id);
create index if not exists idx_appeals_status  on public.appeals using btree (status);

alter table public.appeals enable row level security;

drop policy if exists "appeals owner read" on public.appeals;
create policy "appeals owner read" on public.appeals
  for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists "appeals owner insert" on public.appeals;
create policy "appeals owner insert" on public.appeals
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "appeals admin update" on public.appeals;
create policy "appeals admin update" on public.appeals
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert on public.appeals to authenticated;
grant all on public.appeals to service_role;

commit;

-- ============================================================
-- AFTER APPLYING: publish the current JTA version per live cert, so the scorer
-- has a version to stamp. Pick version strings that match the locked JTAs.
-- Run these in the SQL editor (service-role / postgres context):
--
--   select public.publish_jta_version('11111111-1111-1111-1111-111111111111', 'SM-AI-I v2.1');
--   select public.publish_jta_version('33333333-3333-3333-3333-333333333333', 'SPO-AI-I v1.0');
--   -- SD-AI-I: after its seed migration, publish 'SD-AI-I v1.1'.
-- ============================================================
