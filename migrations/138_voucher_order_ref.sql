-- 138_voucher_order_ref.sql
--
-- A place to record the CertiGlobal order a voucher was issued against.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent.
--
-- ===========================================================================
-- WHERE MONEY HAPPENS, AND WHY THAT MAKES THIS NECESSARY
-- ===========================================================================
-- Certidemy is free. A learner signs up, studies the lessons, and takes as many
-- practice and simulation exams as they want without paying anything. Nothing on
-- this platform is sold.
--
-- Certification is purchased on certiglobal.org - a SEPARATE PLATFORM, with its
-- own database. Both individuals and partner organizations buy there. A
-- Certidemy platform admin then issues the corresponding seats here.
--
-- So the payment record and the voucher it paid for live in two different
-- systems with no shared key, no foreign key, and no join. Without a reference
-- carried across that boundary, these questions have no answer:
--
--   "I bought this on CertiGlobal last week and never got a code."
--   "This order was refunded - which seat do we pull?"
--   "Do the seats we issued this month match what CertiGlobal sold?"
--
-- Partner seats already carry this: seat_batches.invoice_ref is the CertiGlobal
-- reference for a bulk purchase. Individually issued seats have no batch, and so
-- currently have nothing at all. This column is the individual equivalent.
--
-- Cross-system reconciliation with no shared key is materially worse than the
-- within-system case, and it does not get easier with volume. One nullable text
-- column now; a manual reconstruction from another platform's exports later.
--
-- DELIBERATELY DUMB. Free text, nullable, no constraint. It holds whatever
-- CertiGlobal calls an order today and whatever it calls one after a rebuild -
-- an order number, a payment reference, a promo code for a comped seat, or a
-- note for a manual issue. A stricter shape would be a guess about a system this
-- schema does not own.
--
-- If Certidemy ever sells directly, this is where that transaction id goes too,
-- and nothing about the column changes.

alter table public.vouchers
  add column if not exists order_ref text;

comment on column public.vouchers.order_ref is
  'The CertiGlobal order this seat was issued against. Certidemy is free; certification is purchased on certiglobal.org, a separate platform with its own database, so this is the only reference tying a voucher to the payment that bought it. Partner seats use seat_batches.invoice_ref instead. Free text and nullable by design - the shape belongs to a system this schema does not own.';

create index if not exists idx_vouchers_order_ref
  on public.vouchers (order_ref)
  where order_ref is not null;


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) column present; every existing row NULL (nothing has been issued against
--     an individual order yet).
-- select count(*) as vouchers, count(order_ref) as with_order_ref
--   from public.vouchers;
--
-- (b) how each voucher traces back to a CertiGlobal purchase. Anything reading
--     "no purchase reference" is a seat nobody can reconcile.
-- select v.voucher_code,
--        case
--          when v.batch_id is not null
--            then 'batch invoice: ' || coalesce(sb.invoice_ref, '(none recorded)')
--          when v.order_ref is not null
--            then 'order: ' || v.order_ref
--          else '*** no purchase reference ***'
--        end as traces_to
--   from public.vouchers v
--   left join public.seat_batches sb on sb.id = v.batch_id
--  order by v.created_at desc;
-- ---------------------------------------------------------------------------
