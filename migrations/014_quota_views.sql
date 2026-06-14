-- 014_quota_views.sql
-- =============================================================================
-- BASELINE MIGRATION (v1.1 seat-quota views)
--
-- Editor-applied, never versioned. Two views in dependency order:
--   v_batch_quota      -> per seat_batch: voucher counts by status, seats used/avail
--   v_allocation_quota -> per company_certification: rolls batches up via v_batch_quota
--
-- `create or replace view` is idempotent. Must run AFTER 012 (seat_batches,
-- company_certifications, vouchers) and is independent of 013.
-- =============================================================================

-- 1. Per-batch quota.
create or replace view public.v_batch_quota as
  select
    sb.id                          as batch_id,
    sb.company_certification_id,
    sb.company_id,
    sb.certification_id,
    sb.seats,
    sb.attempts_per_seat,
    sb.attempts_per_seat is null   as unlimited,
    sb.invoice_ref,
    sb.expires_at,
    sb.created_at,
    count(v.id)                                                                  as vouchers_total,
    count(v.id) filter (where v.status = 'available'::text)                      as vouchers_available,
    count(v.id) filter (where v.status = 'assigned'::text)                       as vouchers_assigned,
    count(v.id) filter (where v.status = 'redeemed'::text)                       as vouchers_redeemed,
    count(v.id) filter (where v.status = 'revoked'::text)                        as vouchers_revoked,
    count(v.id) filter (where v.status = any (array['assigned'::text, 'redeemed'::text])) as seats_used,
    greatest(
      sb.seats - count(v.id) filter (where v.status = any (array['assigned'::text, 'redeemed'::text])),
      0::bigint
    )                                                                            as seats_available
  from public.seat_batches sb
  left join public.vouchers v on v.batch_id = sb.id
  group by sb.id;

-- 2. Per-allocation quota (rolls batches up).
create or replace view public.v_allocation_quota as
  select
    cc.id            as company_certification_id,
    cc.company_id,
    cc.certification_id,
    coalesce(sum(sb.seats), 0::bigint)::integer as seats_allocated,
    case
      when count(sb.id) = 0 then null::integer
      when count(distinct coalesce(sb.attempts_per_seat, '-1'::integer)) = 1 then max(sb.attempts_per_seat)
      else null::integer
    end              as attempts_per_seat,
    max(sb.invoice_ref) as invoice_ref,
    max(sb.expires_at)  as expires_at,
    coalesce(sum(bq.vouchers_total), 0::numeric)::bigint     as vouchers_total,
    coalesce(sum(bq.vouchers_available), 0::numeric)::bigint as vouchers_available,
    coalesce(sum(bq.vouchers_assigned), 0::numeric)::bigint  as vouchers_assigned,
    coalesce(sum(bq.vouchers_redeemed), 0::numeric)::bigint  as vouchers_redeemed,
    coalesce(sum(bq.vouchers_revoked), 0::numeric)::bigint   as vouchers_revoked
  from public.company_certifications cc
  left join public.seat_batches sb on sb.company_certification_id = cc.id
  left join public.v_batch_quota bq on bq.batch_id = sb.id
  group by cc.id;
