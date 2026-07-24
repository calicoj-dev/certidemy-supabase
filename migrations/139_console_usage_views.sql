-- 139_console_usage_views.sql
--
-- Attempts rollup for the super-admin console redesign (CONSOLE-REDESIGN-SPEC.md,
-- gap 1: "nothing sums attempts_used at batch or company level").
--
-- Three views, all additive. v_batch_quota is deliberately NOT modified:
-- v_allocation_quota depends on it, CREATE OR REPLACE VIEW cannot insert a column
-- mid-list, and a drop-and-recreate would take /console/seats down with it for no
-- gain.
--
-- DENOMINATOR DECISION -- purchased entitlement, not issued allowance.
--   A batch's attempts denominator is seats * attempts_per_seat: what the partner
--   bought. It is NOT the sum of vouchers.attempts_allowed, because that grows as
--   seats get assigned, so the meter would move while nobody sat an exam. A meter
--   whose denominator moves is a lie.
--
-- UNLIMITED -- seat_batches.attempts_per_seat IS NULL (matching v_batch_quota's
--   own `unlimited` flag). vouchers.attempts_allowed IS NULL means inherit from
--   the batch, which is a different fact and is not conflated here.
--   An unlimited batch has NO denominator: attempts_purchased is NULL, and any
--   company/cert group containing one reports has_unlimited = true with a NULL
--   denominator. The UI renders that as the infinity glyph, never a filled bar.
--
-- SEATS -- seats_assigned counts status IN ('assigned','redeemed'), identical to
--   v_batch_quota.seats_used, so the two views can never disagree.
--
-- ATTEMPTS -- attempts_used sums across ALL vouchers on the batch including
--   revoked ones. A revoked seat that was sat on still consumed purchased
--   entitlement; excluding it would understate consumption.
--
-- GRANTS -- service_role only. v_batch_quota and v_allocation_quota currently
--   grant SELECT to authenticated, and a view does not enforce RLS on its base
--   tables unless it is security_invoker, so those may already expose every
--   partner's seat counts to any logged-in user. That is being investigated
--   separately; this migration does not widen it. v_voucher_validity is already
--   service_role only, so v_direct_vouchers could not be broader regardless.

begin;

-- ---------------------------------------------------------------------------
-- 1. Batch grain
-- ---------------------------------------------------------------------------
drop view if exists public.v_batch_attempts;

create view public.v_batch_attempts as
select
    sb.id                                   as batch_id,
    sb.company_id,
    sb.certification_id,
    sb.company_certification_id,
    sb.seats,
    sb.attempts_per_seat,
    (sb.attempts_per_seat is null)          as unlimited,
    case
        when sb.attempts_per_seat is null then null::bigint
        else (sb.seats::bigint * sb.attempts_per_seat::bigint)
    end                                     as attempts_purchased,
    coalesce(sum(v.attempts_used), 0)::bigint as attempts_used,
    count(v.id) filter (
        where v.status = any (array['assigned'::text, 'redeemed'::text])
    )::bigint                               as seats_assigned,
    greatest(
        sb.seats - count(v.id) filter (
            where v.status = any (array['assigned'::text, 'redeemed'::text])
        ),
        0
    )::bigint                               as seats_idle,
    sb.invoice_ref,
    sb.expires_at,
    sb.created_at
from public.seat_batches sb
left join public.vouchers v on v.batch_id = sb.id
group by sb.id;

comment on view public.v_batch_attempts is
    'Per-batch seat and attempt rollup. attempts_purchased = seats * attempts_per_seat (NULL when unlimited). seats_assigned matches v_batch_quota.seats_used exactly.';

-- ---------------------------------------------------------------------------
-- 2. Company x certification grain -- the company card body rows
-- ---------------------------------------------------------------------------
drop view if exists public.v_company_cert_usage;

create view public.v_company_cert_usage as
select
    ba.company_id,
    ba.certification_id,
    count(*)::bigint                        as batches,
    sum(ba.seats)::bigint                   as seats_sold,
    sum(ba.seats_assigned)::bigint          as seats_assigned,
    greatest(sum(ba.seats) - sum(ba.seats_assigned), 0)::bigint as seats_idle,
    sum(ba.attempts_used)::bigint           as attempts_used,
    bool_or(ba.unlimited)                   as has_unlimited,
    case
        when bool_or(ba.unlimited) then null::bigint
        else sum(ba.attempts_purchased)::bigint
    end                                     as attempts_purchased,
    array_remove(
        array_agg(ba.invoice_ref order by ba.created_at),
        null
    )                                       as invoice_refs,
    min(ba.expires_at)                      as earliest_batch_expiry,
    max(ba.created_at)                      as latest_batch_created_at
from public.v_batch_attempts ba
group by ba.company_id, ba.certification_id;

comment on view public.v_company_cert_usage is
    'Company x certification rollup across batches with differing terms. attempts_purchased is NULL when any batch in the group is unlimited -- an infinite denominator has no number, and summing the finite batches would understate it.';

-- ---------------------------------------------------------------------------
-- 3. Direct (B2C) vouchers -- no company, no batch
-- ---------------------------------------------------------------------------
drop view if exists public.v_direct_vouchers;

create view public.v_direct_vouchers as
select
    v.id                    as voucher_id,
    v.voucher_code,
    v.certification_id,
    v.assigned_email,
    v.assigned_user_id,
    v.order_ref,
    v.attempts_allowed,
    v.attempts_used,
    v.status,
    vv.effective_status,
    vv.effective_expires_at,
    vv.days_remaining,
    vv.can_unassign,
    v.assigned_at,
    v.credential_id,
    v.created_at
from public.vouchers v
join public.v_voucher_validity vv on vv.voucher_id = v.id
where v.company_certification_id is null
  and v.batch_id is null;

comment on view public.v_direct_vouchers is
    'B2C seats issued directly to an individual. No company, no batch -- order_ref is the only link back to the CertiGlobal payment. effective_status is read from v_voucher_validity, never vouchers.status.';

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select on public.v_batch_attempts     to service_role;
grant select on public.v_company_cert_usage to service_role;
grant select on public.v_direct_vouchers    to service_role;

commit;
