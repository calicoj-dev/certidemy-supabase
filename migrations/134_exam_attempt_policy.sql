-- 134_exam_attempt_policy.sql
--
-- Make the re-examination policy a per-certification DATA value, and compute its
-- consequence rather than asserting it.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent.
--
-- ===========================================================================
-- WHY
-- ===========================================================================
-- ISO/IEC 17024 requires a certification body to define and PUBLISH the
-- conditions under which a candidate may re-sit. Certidemy had no such policy in
-- any scheme document - the only thing resembling one was `vouchers.
-- attempts_allowed`, which is an implementation detail, not a published
-- commitment.
--
-- The standard does not specify a NUMBER. It requires that the number exist, be
-- published, be applied uniformly, and be defensible. "Defensible" for an
-- attempt cap means one thing above all: examination security. PMI - accredited
-- to ISO/IEC 17024 - caps the PMP at three attempts per eligibility period and
-- states the reason in its own handbook: "to uphold exam security and reduce
-- overexposure of examination questions to individual candidates."
--
-- That is the whole argument. A finite item bank plus unlimited attempts means a
-- candidate can eventually pass by recall rather than competence, and the
-- credential then attests something it never measured.
--
-- ===========================================================================
-- THE NUMBER IS A DECISION; THE EXPOSURE IS A CONSEQUENCE
-- ===========================================================================
-- Fraction of the secure bank a candidate has seen after N sittings:
--
--     exposure(N) = 1 - (1 - form_size / bank_size) ^ N
--
-- That is arithmetic, not opinion. v_exam_exposure below computes it per
-- certification per language, at 1..8 attempts, so the cap can be chosen by
-- reading what it costs rather than by picking a number that feels right.
--
-- This mirrors how exam_blueprint already works (migration 097): the profile is
-- computed from the JTA, never typed in. Same discipline, different quantity.
--
-- Raising the cap and growing the bank are the two levers, and they trade off:
-- roughly 16 secure items per task per language would put a 6-attempt cap at the
-- same exposure a 3-attempt cap gives today.
--
-- ===========================================================================
-- 1. THE POLICY, AS DATA
-- ===========================================================================

alter table public.certifications
  add column if not exists max_exam_attempts integer not null default 6;

alter table public.certifications
  add column if not exists attempt_window_months integer not null default 12;

alter table public.certifications
  drop constraint if exists certifications_max_exam_attempts_check;
alter table public.certifications
  add constraint certifications_max_exam_attempts_check
  check (max_exam_attempts >= 1 and max_exam_attempts <= 20);

alter table public.certifications
  drop constraint if exists certifications_attempt_window_check;
alter table public.certifications
  add constraint certifications_attempt_window_check
  check (attempt_window_months >= 1 and attempt_window_months <= 60);

comment on column public.certifications.max_exam_attempts is
  'Published re-examination cap: sittings permitted within attempt_window_months. Set deliberately against v_exam_exposure - the exposure it produces is the justification. Must equal the value published in SCHEME-<CODE>.md.';

comment on column public.certifications.attempt_window_months is
  'Rolling window over which max_exam_attempts is counted, from the first sitting.';


-- ===========================================================================
-- 2. THE CONSEQUENCE, COMPUTED
-- ===========================================================================
-- Bank = what a certification exam can actually draw: secure pool, exam-scope,
-- approved, not retired, in that language. Same predicate generate-mock-exam
-- applies for mode='exam'.

create or replace view public.v_exam_exposure as
with bank as (
  select c.id                     as certification_id,
         c.code,
         c.num_questions          as form_size,
         c.max_exam_attempts,
         c.attempt_window_months,
         q.language,
         count(*)::numeric        as bank_size
    from public.certifications c
    join public.quiz_questions q on q.certification_id = c.id
   where q.pool = 'secure'
     and q.is_exam_scope
     and q.status = 'approved'
     and q.retired_at is null
   group by c.id, c.code, c.num_questions, c.max_exam_attempts, c.attempt_window_months, q.language
),
calc as (
  select *,
         case when bank_size > 0
              then least(1.0, form_size::numeric / bank_size)
              else 1.0 end as p_per_sitting
    from bank
)
select
  certification_id,
  code,
  language,
  bank_size::bigint                                   as secure_items,
  form_size,
  round(100 * p_per_sitting, 1)                       as pct_per_sitting,
  max_exam_attempts                                   as policy_max_attempts,
  attempt_window_months                               as policy_window_months,
  round(100 * (1 - power(1 - p_per_sitting, max_exam_attempts)), 1) as pct_at_policy_cap,
  round(100 * (1 - power(1 - p_per_sitting, 1)), 1)   as pct_at_1,
  round(100 * (1 - power(1 - p_per_sitting, 2)), 1)   as pct_at_2,
  round(100 * (1 - power(1 - p_per_sitting, 3)), 1)   as pct_at_3,
  round(100 * (1 - power(1 - p_per_sitting, 4)), 1)   as pct_at_4,
  round(100 * (1 - power(1 - p_per_sitting, 5)), 1)   as pct_at_5,
  round(100 * (1 - power(1 - p_per_sitting, 6)), 1)   as pct_at_6,
  round(100 * (1 - power(1 - p_per_sitting, 8)), 1)   as pct_at_8,
  -- Secure items per task per language needed to hold the CURRENT cap at ~50%
  -- exposure, the level a 3-attempt cap yields on today's banks. Advisory: a
  -- target for gen-cert-secure.mjs (SECURE_PER_TASK), not a gate.
  ceil(
    (form_size::numeric / (1 - power(0.5, 1.0 / greatest(max_exam_attempts, 1))))
    / nullif((select count(*) from public.tasks t
               where t.certification_id = calc.certification_id and t.is_exam_scope), 0)
  )::integer as secure_per_task_for_50pct
from calc
order by code, language;

comment on view public.v_exam_exposure is
  'What an attempt cap costs in item exposure. exposure(N) = 1 - (1 - form/bank)^N, per certification per language. The cap is a decision; this is its consequence. Read it before changing certifications.max_exam_attempts.';

grant select on public.v_exam_exposure to service_role;


-- ===========================================================================
-- 3. CHANGES TO THE POLICY ARE AUDITED
-- ===========================================================================
-- A published policy that can be changed silently is not a control. Uniform
-- application is the 17024 requirement that actually matters here: the rule in
-- force when a voucher is issued governs that voucher, and it is never varied
-- per candidate.
--
-- actor_user_id is auth.uid(), which is NULL for a SQL-editor change. That is
-- accurate rather than a defect: an editor change has no application actor, and
-- the NULL says so.

create or replace function public.fn_audit_attempt_policy()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.max_exam_attempts is distinct from old.max_exam_attempts
     or new.attempt_window_months is distinct from old.attempt_window_months then
    insert into public.admin_actions (actor_user_id, action, target_type, target_id, reason, metadata)
    values (
      auth.uid(),
      'exam_attempt_policy_changed',
      'certification',
      new.id,
      'Re-examination policy updated',
      jsonb_build_object(
        'code', new.code,
        'from', jsonb_build_object('max_exam_attempts', old.max_exam_attempts,
                                   'attempt_window_months', old.attempt_window_months),
        'to',   jsonb_build_object('max_exam_attempts', new.max_exam_attempts,
                                   'attempt_window_months', new.attempt_window_months)
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_attempt_policy on public.certifications;
create trigger trg_audit_attempt_policy
  after update of max_exam_attempts, attempt_window_months on public.certifications
  for each row
  execute function public.fn_audit_attempt_policy();


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) THE DECISION TABLE. Read this before setting any cap.
--     English rows only for legibility; check all three before publishing.
--
-- select code, secure_items, form_size, pct_per_sitting,
--        policy_max_attempts, pct_at_policy_cap,
--        pct_at_3, pct_at_4, pct_at_5, pct_at_6,
--        secure_per_task_for_50pct
--   from public.v_exam_exposure
--  where language = 'en'
--  order by pct_at_policy_cap desc;
--
-- (b) all three languages for the tightest cert.
-- select * from public.v_exam_exposure where code = 'SD-AI-I';
--
-- (c) the audit trigger fires. Run the whole block; it rolls back.
-- begin;
--   update public.certifications set max_exam_attempts = 3 where code = 'AIE-I';
--   select action, target_type, metadata from public.admin_actions
--    where action = 'exam_attempt_policy_changed' order by created_at desc limit 1;
-- rollback;
--
-- (d) defaults landed on every cert.
-- select code, max_exam_attempts, attempt_window_months from public.certifications order by code;
-- ---------------------------------------------------------------------------
