-- 141_direct_vouchers_invoker.sql
--
-- Rebuilds v_direct_vouchers so the console can read it with the SESSION client,
-- the same way loadAdminData already reads v_batch_quota.
--
-- WHY IT COULD NOT BE INVOKER BEFORE
--
-- 139 built it as a join onto v_voucher_validity, which is not security_invoker
-- and is not granted to authenticated. Under security_invoker the caller needs
-- SELECT on the inner view too, so an authenticated read would have failed 42501
-- - and Promise.allSettled in the loader swallows that into an empty array, so
-- the Direct card would have rendered "0 vouchers issued" and looked like working
-- code.
--
-- The join is unnecessary. v_voucher_validity's whole job is resolving WHICH of
-- two clocks applies (assigned -> voucher clock, otherwise -> batch clock). A
-- direct seat has no batch, so there is only ever the voucher clock. The logic
-- collapses to a plain CASE over vouchers.
--
-- RLS DOES THE SCOPING
--
-- vouchers_select_platform_admin has no company predicate, so a platform admin
-- reads every row. vouchers_select_own restricts a learner to
-- assigned_user_id = auth.uid(), so a learner reading this view sees their own
-- direct seat and nothing else - which is their own data, and is what spec gap 2
-- (expiry on the learner dashboard) will need anyway.
--
-- can_unassign IS HARDCODED false
--
-- unassign-voucher now refuses any voucher with a NULL batch_id: there is no pool
-- to return a direct seat to, and clearing its expires_at would leave it with no
-- clock at all. The view must agree with the function, or the roster renders an
-- unassign button that is guaranteed to 409.

begin;

drop view if exists public.v_direct_vouchers;

create view public.v_direct_vouchers
with (security_invoker = on) as
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
    case
        when v.status = 'revoked' then 'revoked'
        when v.expires_at is not null and v.expires_at < now() then 'expired'
        else v.status
    end                     as effective_status,
    v.expires_at            as effective_expires_at,
    case
        when v.expires_at is null then null::integer
        else greatest(0, (extract(day from (v.expires_at - now())))::integer)
    end                     as days_remaining,
    false                   as can_unassign,
    v.assigned_at,
    v.credential_id,
    v.created_at
from public.vouchers v
where v.company_certification_id is null
  and v.batch_id is null;

comment on view public.v_direct_vouchers is
    'B2C seats issued directly to an individual. No company, no batch - order_ref is the only link back to the CertiGlobal payment. Only one clock applies (the voucher clock), so the expiry logic is resolved inline rather than through v_voucher_validity. can_unassign is always false: unassign-voucher refuses direct seats.';

grant select on public.v_direct_vouchers to authenticated;
grant select on public.v_direct_vouchers to service_role;

commit;
