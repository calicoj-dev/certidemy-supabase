-- 136_voucher_expiry_and_holder_name_correction.sql
--
-- Two things: vouchers now expire, and a misspelled holder name can be corrected
-- without a SQL prompt - but never silently.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent.
--
-- ===========================================================================
-- PART 1 - VOUCHERS EXPIRE
-- ===========================================================================
-- vouchers had NO expiry column. seat_batches has one and assign-voucher checks
-- it, so a BATCH could expire - but an individual voucher, once assigned, was
-- good forever. A seat sold in 2026 was still redeemable in 2031 against an item
-- bank and a JTA that had moved on underneath it.
--
-- Six months from ASSIGNMENT, not from purchase. A partner may buy twenty seats
-- in January and assign the last one in June; starting the clock at purchase
-- would hand that person a seat that was already half dead. The batch's own
-- expires_at still applies on top - see the effective-expiry rule below.
--
-- EFFECTIVE EXPIRY = the EARLIER of the voucher's own expiry and its batch's.
-- A seat cannot outlive the contract term that paid for it, and a contract term
-- does not extend a seat past its six months. Whichever comes first wins.

alter table public.vouchers
  add column if not exists expires_at timestamptz;

comment on column public.vouchers.expires_at is
  'When this seat stops being redeemable. Set to assigned_at + 6 months when the voucher is assigned. The EFFECTIVE expiry is the earlier of this and the batch expires_at - a seat cannot outlive the contract that paid for it.';

-- Backfill. Assigned vouchers date from their assignment; unassigned inventory
-- has not started its clock and stays NULL until someone is put in the seat.
update public.vouchers
   set expires_at = assigned_at + interval '6 months'
 where expires_at is null
   and assigned_at is not null;


-- A voucher's usable window, resolved once so the app and the roster agree.
create or replace view public.v_voucher_validity as
select
  v.id                                   as voucher_id,
  v.voucher_code,
  v.certification_id,
  v.company_id,
  v.assigned_email,
  v.assigned_user_id,
  v.status,
  v.attempts_used,
  v.assigned_at,
  v.expires_at                           as voucher_expires_at,
  sb.expires_at                          as batch_expires_at,
  least(
    coalesce(v.expires_at,  'infinity'::timestamptz),
    coalesce(sb.expires_at, 'infinity'::timestamptz)
  ) as effective_expires_at,
  case
    when v.status = 'revoked' then 'revoked'
    when least(
           coalesce(v.expires_at,  'infinity'::timestamptz),
           coalesce(sb.expires_at, 'infinity'::timestamptz)
         ) < now() then 'expired'
    else v.status
  end as effective_status,
  case
    when v.expires_at is null then null
    else greatest(0, extract(day from v.expires_at - now())::int)
  end as days_remaining
from public.vouchers v
left join public.seat_batches sb on sb.id = v.batch_id;

comment on view public.v_voucher_validity is
  'Voucher status with expiry applied. effective_expires_at is the earlier of the voucher and its batch; effective_status reports expired even while the stored status still reads assigned. Read this rather than vouchers.status wherever a human sees the state.';

grant select on public.v_voucher_validity to service_role;


-- ===========================================================================
-- PART 2 - A MISSPELLED HOLDER NAME CAN BE CORRECTED
-- ===========================================================================
-- WHERE THE LINE SITS, AND WHY IT SITS THERE
--
-- The CERTIFICATION DECISION is immutable: the score, pass/fail, the issue date,
-- the expiry, and the JTA version the candidate was measured against. None of
-- those may be edited. A wrong decision is revoked and, if warranted, a new one
-- is issued - which the platform already supports.
--
-- The HOLDER'S NAME is not part of that decision. It is an identity attribute
-- attached to it. "Chrisopher Smith" passed exactly the same exam as
-- "Christopher Smith"; correcting the spelling changes nothing about what was
-- measured or decided.
--
-- ISO/IEC 17024 asks that certification records be accurate and that changes be
-- traceable. Forcing a revoke-and-reissue for a typo would make the record LESS
-- accurate - the candidate would carry a revoked credential for a clerical
-- error. So: the edit is allowed, and it is audited with a reason.
--
-- WHAT ALSO HAS TO HAPPEN, AND IS EASY TO MISS
--
-- credentials.certificate_path points at a PDF with the old name printed on it,
-- and credential-og renders the name into a share image. If the name changes and
-- the artifact does not, the certificate and the record disagree - which is
-- worse than the typo. The trigger therefore CLEARS certificate_path, so the
-- next request regenerates it.

create or replace function public.fn_audit_holder_name_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
begin
  if new.holder_name is distinct from old.holder_name then

    if v_actor is null then
      raise exception
        'Correcting a holder name must be attributable. auth.uid() is NULL (SQL editor or service context). Make this change through the console as a platform admin.'
        using errcode = 'insufficient_privilege';
    end if;

    if coalesce(btrim(new.holder_name), '') = '' then
      raise exception 'holder_name cannot be blank';
    end if;

    -- The stored certificate carries the old name. Force a regenerate.
    new.certificate_path := null;

    insert into public.admin_actions (actor_user_id, action, target_type, target_id, reason, metadata)
    values (
      v_actor,
      'credential_holder_name_corrected',
      'credential',
      new.id,
      'Holder name corrected',
      jsonb_build_object(
        'credential_code', new.credential_code,
        'from', old.holder_name,
        'to',   new.holder_name,
        'certificate_regenerated', true
      )
    );
  end if;

  -- The decision itself is immutable. These are the fields that record what was
  -- measured and decided; a mistake in any of them is a revoke-and-reissue, not
  -- an edit.
  if new.score_pct        is distinct from old.score_pct
     or new.issued_at     is distinct from old.issued_at
     or new.certification_id is distinct from old.certification_id
     or new.exam_attempt_id  is distinct from old.exam_attempt_id
     or new.jta_version_id   is distinct from old.jta_version_id
     or new.credential_code  is distinct from old.credential_code then
    raise exception
      'The certification decision is immutable. score_pct, issued_at, certification_id, exam_attempt_id, jta_version_id and credential_code cannot be edited - revoke and reissue instead.'
      using errcode = 'integrity_constraint_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_audit_holder_name_change on public.credentials;
create trigger trg_audit_holder_name_change
  before update on public.credentials
  for each row
  execute function public.fn_audit_holder_name_change();


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) expiry backfilled onto assigned vouchers; unassigned inventory left NULL.
-- select voucher_code, status, assigned_at, expires_at,
--        (expires_at is null) as no_clock_yet
--   from public.vouchers order by assigned_at desc nulls last;
--
-- (b) the validity view, with the effective rule applied.
-- select voucher_code, status, effective_status, voucher_expires_at,
--        batch_expires_at, effective_expires_at, days_remaining
--   from public.v_voucher_validity order by effective_expires_at nulls last;
--
-- (c) the decision really is immutable. Expect a raise, then rollback.
-- begin;
--   update public.credentials set score_pct = 100 where credential_code is not null;
-- rollback;
--
-- (d) a name change from the SQL editor is refused (no actor). Expect a raise.
-- begin;
--   update public.credentials set holder_name = 'Test' where credential_code is not null;
-- rollback;
--
-- (e) nothing else about a credential was touched.
-- select count(*) as credentials, count(*) filter (where certificate_path is not null) as with_pdf
--   from public.credentials;
-- ---------------------------------------------------------------------------
