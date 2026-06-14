-- 013_quiz_sessions_cert_exam.sql
-- =============================================================================
-- BASELINE MIGRATION (v1.1 delta to the existing quiz_sessions table)
--
-- quiz_sessions is a base table (created in 002). v1.1 added two things that
-- were applied via the SQL editor and never versioned:
--   1. 'certification_exam' to the kind CHECK constraint.
--   2. voucher_id column + FK -> vouchers(id)  (vouchers is created in 012).
--
-- Idempotent: the CHECK is dropped-then-readded; the column add is guarded;
-- the FK add is guarded. Safe to run against the live DB or a fresh rebuild.
-- Must run AFTER 012 (FK target vouchers).
-- =============================================================================

-- 1. Expand the kind CHECK to include 'certification_exam'.
alter table public.quiz_sessions
  drop constraint if exists quiz_sessions_kind_check;
alter table public.quiz_sessions
  add constraint quiz_sessions_kind_check
  check (kind = any (array[
    'practice'::text,
    'module_check'::text,
    'mock_exam'::text,
    'review'::text,
    'certification_exam'::text
  ]));

-- 2. voucher_id column + FK.
alter table public.quiz_sessions
  add column if not exists voucher_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quiz_sessions_voucher_id_fkey') then
    alter table public.quiz_sessions
      add constraint quiz_sessions_voucher_id_fkey
      foreign key (voucher_id) references public.vouchers(id);
  end if;
end $$;
