-- 114_user_certifications.sql
--
-- Learner enrollment: what a user is working on.
--
-- WHY THIS DID NOT EXIST: there was no enrollment model at all. /learn/[cert]
-- takes no user and checks nothing, so any visitor with the URL gets the full
-- module journey. This is not "certs are auto-assigned" - it is that access was
-- never modelled. Nothing has to be unwound; something has to be introduced.
--
-- ENROLLMENT IS INTENT, NOT ENTITLEMENT. This is the load-bearing decision.
--   vouchers / seat_batches / company_certifications answer "WHO PAID".
--   user_certifications answers "WHAT AM I WORKING ON".
-- Keeping them separate means:
--   * Self-enrollment is OPEN for any non-draft cert. A learner adds a cert,
--     gets lessons and practice, and builds investment before buying. That is
--     the funnel, and it is why AIE-I being freemium needs no special case.
--   * The EXAM stays gated on voucher / seat exactly as it is today. Nothing
--     about the paid path changes in this migration.
--   * A company granting a seat can also insert an enrollment with
--     source='seat' so the learner sees it appear with no second step.
--
-- `source` exists because "I chose this" and "my employer assigned this" should
-- look different on the dashboard, and the analytics split matters.
--
-- ASCII ONLY: pasted into the Supabase SQL editor.
-- Idempotent: create-if-not-exists throughout; back-seed uses on-conflict-do-nothing.

create table if not exists public.user_certifications (
  user_id uuid not null
    references auth.users(id) on delete cascade,
  certification_id uuid not null
    references public.certifications(id) on delete cascade,
  source text not null default 'self',
  status text not null default 'active',
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, certification_id),
  constraint user_certifications_source_check
    check (source in ('self', 'voucher', 'seat', 'admin')),
  constraint user_certifications_status_check
    check (status in ('active', 'archived', 'completed'))
);

-- PK covers user_id lookups (leading column). This one is for admin/console
-- queries that ask "who is enrolled in cert X".
create index if not exists user_certifications_cert_idx
  on public.user_certifications (certification_id);

comment on table public.user_certifications is
  'Learner enrollment = intent. Entitlement to sit an exam lives in vouchers / company_certifications, not here.';
comment on column public.user_certifications.source is
  'self = learner added it; voucher/seat = granted commercially; admin = support action.';

alter table public.user_certifications enable row level security;

-- READ: own rows only.
drop policy if exists "own enrollments read" on public.user_certifications;
create policy "own enrollments read"
  on public.user_certifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- INSERT: a learner may only enrol THEMSELVES, only with source='self', and
-- only in a cert that is not a hidden draft. Commercial sources (voucher/seat/
-- admin) are written by SECURITY DEFINER paths or the service role, which
-- bypass RLS - a client must never be able to claim source='seat'.
drop policy if exists "self enroll" on public.user_certifications;
create policy "self enroll"
  on public.user_certifications
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and source = 'self'
    and exists (
      select 1 from public.certifications c
       where c.id = certification_id
         and c.status <> 'draft'
    )
  );

-- UPDATE: own rows, and `source` is immutable from the client so a self-enrolled
-- row can never be relabelled as commercially granted.
drop policy if exists "own enrollments update" on public.user_certifications;
create policy "own enrollments update"
  on public.user_certifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and source = 'self');

-- DELETE: only what the learner added themselves. Removing a seat/voucher
-- enrollment is a commercial action, not a learner one.
drop policy if exists "own enrollments delete" on public.user_certifications;
create policy "own enrollments delete"
  on public.user_certifications
  for delete
  to authenticated
  using (user_id = auth.uid() and source = 'self');

-- RLS IS NOT A GRANT: the table-level grant is checked BEFORE the policy.
-- Without it every statement fails with a silent 42501.
grant select, insert, update, delete on public.user_certifications to authenticated;
-- anon gets nothing: enrollment is never anonymous.

-- ---------------------------------------------------------------------------
-- BACK-SEED. THE HIGHEST-RISK PART OF THIS MIGRATION.
--
-- The moment /learn/[cert] gains an enrollment gate, anyone mid-lesson without
-- a row is locked out - including every existing tester. So every user who has
-- ALREADY touched a cert, or holds a voucher for one, is enrolled retroactively
-- here, BEFORE any app change ships.
--
-- Three sources, in ascending trust order; on-conflict-do-nothing means the
-- first one to claim a (user, cert) pair wins, so a real voucher grant is not
-- overwritten by an inferred one.
-- ---------------------------------------------------------------------------

do $$
declare
  v_progress integer;
  v_lessons  integer;
  v_vouchers integer;
  v_total    integer;
begin
  -- Guard: the module -> cert path is assumed below. Fail loudly rather than
  -- silently seeding zero rows.
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'modules'
       and column_name = 'certification_id'
  ) then
    raise exception 'modules.certification_id not found - back-seed path is wrong, aborting';
  end if;

  -- 1. Module-level progress.
  insert into public.user_certifications (user_id, certification_id, source)
  select distinct up.user_id, m.certification_id, 'self'
    from public.user_progress up
    join public.modules m on m.id = up.module_id
   where m.certification_id is not null
  on conflict (user_id, certification_id) do nothing;
  get diagnostics v_progress = row_count;

  -- 2. Lesson-level progress (a user may have opened a lesson without the
  --    module row existing yet).
  insert into public.user_certifications (user_id, certification_id, source)
  select distinct ulp.user_id, m.certification_id, 'self'
    from public.user_lesson_progress ulp
    join public.lessons l on l.id = ulp.lesson_id
    join public.modules m on m.id = l.module_id
   where m.certification_id is not null
  on conflict (user_id, certification_id) do nothing;
  get diagnostics v_lessons = row_count;

  -- 3. Vouchers already claimed by a user. source='voucher' so the dashboard
  --    can show these differently from self-added certs.
  insert into public.user_certifications (user_id, certification_id, source)
  select distinct v.assigned_user_id, v.certification_id, 'voucher'
    from public.vouchers v
   where v.assigned_user_id is not null
     and v.certification_id is not null
     and coalesce(v.status, '') <> 'revoked'
  on conflict (user_id, certification_id) do nothing;
  get diagnostics v_vouchers = row_count;

  select count(*) into v_total from public.user_certifications;

  raise notice 'back-seed: % from module progress, % from lesson progress, % from vouchers. Total rows now %.',
    v_progress, v_lessons, v_vouchers, v_total;
end $$;

-- ---------------------------------------------------------------------------
-- VERIFY BEFORE SHIPPING ANY GATE.
--
-- A. Enrollments per source:
--   select source, count(*) from public.user_certifications group by source;
--
-- B. THE CRITICAL ONE - anyone with progress but no enrollment would be locked
--    out by the gate. Must return zero rows.
--   select distinct up.user_id, m.certification_id
--     from public.user_progress up
--     join public.modules m on m.id = up.module_id
--    where m.certification_id is not null
--      and not exists (
--        select 1 from public.user_certifications uc
--         where uc.user_id = up.user_id
--           and uc.certification_id = m.certification_id
--      );
--
-- C. Sanity - how many certs each user now has:
--   select user_id, count(*) from public.user_certifications group by user_id order by 2 desc;
-- ---------------------------------------------------------------------------
