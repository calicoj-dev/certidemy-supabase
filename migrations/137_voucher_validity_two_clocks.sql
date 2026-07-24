-- 137_voucher_validity_two_clocks.sql
--
-- Correct the expiry model established in 136. Two clocks, and they govern
-- different things.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent.
--
-- ===========================================================================
-- WHAT 136 GOT WRONG
-- ===========================================================================
-- v_voucher_validity resolved the effective expiry as LEAST(voucher, batch), so
-- a seat assigned in month 11 of a 12-month batch died a month later instead of
-- carrying its six months.
--
-- That punishes the candidate for a contract date they never saw, and it
-- punishes the partner for assigning late - which is exactly the behaviour a
-- partner has every right to. The correct division:
--
--   BATCH expires_at    gates whether a seat can be ASSIGNED from it.
--                       12 months from purchase. Already enforced in
--                       assign-voucher, which refuses an expired batch.
--
--   VOUCHER expires_at  gates whether an assigned seat can be REDEEMED.
--                       6 months from assignment. Independent of the batch once
--                       the seat is in someone's hands.
--
-- The tail is bounded and predictable: the last assignable day is day 364 of the
-- batch, plus six months, so no seat outlives 18 months from purchase.
--
-- WHY THIS IS THE RIGHT WAY ROUND
--
-- The batch date is a commercial term between Certidemy and the partner. The
-- voucher date is a commitment to the candidate. A candidate handed a seat in
-- November should get the same six months as one handed a seat in February -
-- they are sitting the same exam, and neither of them signed the invoice.
--
-- ===========================================================================
-- 1. BATCHES DEFAULT TO 12 MONTHS
-- ===========================================================================
-- seat_batches.expires_at was nullable with no default, and NULL meant a seat
-- pool that never expired. Inventory should not be immortal: an unassigned seat
-- from 2026 drawing against a 2029 item bank is the same staleness problem in
-- slower motion.

alter table public.seat_batches
  alter column expires_at set default (now() + interval '12 months');

comment on column public.seat_batches.expires_at is
  'When this seat pool stops being ASSIGNABLE. Defaults to 12 months from purchase. It does NOT cut short a seat already assigned - see v_voucher_validity.';

-- Backfill batches with no expiry, dated from when they were created rather than
-- from today, so an old batch does not silently gain a fresh year.
update public.seat_batches
   set expires_at = created_at + interval '12 months'
 where expires_at is null;


-- ===========================================================================
-- 2. THE CORRECTED VALIDITY VIEW
-- ===========================================================================

-- CREATE OR REPLACE cannot insert a column mid-list; Postgres refuses to rename
-- positionally, and 136's version had no batch_id. Verified nothing depends on
-- the view before dropping it.
drop view if exists public.v_voucher_validity;

create view public.v_voucher_validity as
select
  v.id                as voucher_id,
  v.voucher_code,
  v.certification_id,
  v.company_id,
  v.batch_id,
  v.assigned_email,
  v.assigned_user_id,
  v.status,
  v.attempts_used,
  v.assigned_at,
  v.expires_at        as voucher_expires_at,
  sb.expires_at       as batch_expires_at,

  -- ASSIGNED: the holder's own six months. UNASSIGNED: the pool's assignability
  -- window, because an unassigned seat has no holder and no clock of its own.
  case
    when v.assigned_at is not null then v.expires_at
    else sb.expires_at
  end as effective_expires_at,

  case
    when v.status = 'revoked' then 'revoked'
    when v.assigned_at is not null
     and v.expires_at is not null
     and v.expires_at < now() then 'expired'
    when v.assigned_at is null
     and sb.expires_at is not null
     and sb.expires_at < now() then 'expired'
    else v.status
  end as effective_status,

  case
    when v.assigned_at is not null and v.expires_at is not null
      then greatest(0, extract(day from v.expires_at - now())::int)
    when v.assigned_at is null and sb.expires_at is not null
      then greatest(0, extract(day from sb.expires_at - now())::int)
    else null
  end as days_remaining,

  -- Can this seat be returned to the pool? Only if nobody has sat an exam on it.
  -- Assign -> sit -> unassign -> reassign would otherwise be unlimited attempts
  -- on a single purchased seat, straight through the re-examination cap.
  (v.status = 'assigned' and v.attempts_used = 0) as can_unassign

from public.vouchers v
left join public.seat_batches sb on sb.id = v.batch_id;

comment on view public.v_voucher_validity is
  'Voucher state with both clocks applied. The BATCH date gates assignment; the VOUCHER date gates redemption and is independent once assigned, so a seat handed out in month 11 still carries its full six months. can_unassign is false the moment an attempt is consumed - a spent seat cannot be recycled.';

grant select on public.v_voucher_validity to service_role;


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) every batch now has an assignability window.
-- select id, seats, created_at, expires_at,
--        round(extract(epoch from expires_at - created_at) / 86400) as days
--   from public.seat_batches order by created_at;
--
-- (b) the two clocks, side by side. An assigned voucher's effective expiry must
--     equal its OWN expiry, never the batch's.
-- select voucher_code, status, effective_status,
--        assigned_at is not null as assigned,
--        voucher_expires_at, batch_expires_at, effective_expires_at,
--        days_remaining, can_unassign
--   from public.v_voucher_validity
--  order by effective_expires_at nulls last;
--
-- (c) the recycling guard: can_unassign must be false wherever attempts_used > 0.
-- select voucher_code, status, attempts_used, can_unassign
--   from public.v_voucher_validity
--  where attempts_used > 0;
--
-- (d) prove the late-assignment case. Expect the voucher to outlive its batch.
-- begin;
--   update public.seat_batches set expires_at = now() + interval '20 days'
--    where id = (select batch_id from public.vouchers where batch_id is not null limit 1);
--   select voucher_code, batch_expires_at, voucher_expires_at, effective_expires_at
--     from public.v_voucher_validity
--    where batch_id = (select batch_id from public.vouchers where batch_id is not null limit 1);
-- rollback;
-- ---------------------------------------------------------------------------
