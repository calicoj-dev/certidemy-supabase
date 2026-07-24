-- 140_console_usage_views_invoker.sql
--
-- Follow-up to 139. The two aggregate views were created service_role-only while
-- it was unclear whether v_batch_quota's authenticated grant was a cross-partner
-- leak. It is not: both v_batch_quota and v_allocation_quota carry
-- reloptions security_invoker=on, so RLS on seat_batches and vouchers is
-- evaluated as the CALLER, and a partner admin sees only their own rows.
--
-- (The check that suggested otherwise tested for 'security_invoker=true'.
-- Postgres stores the value as 'on'. The option was set correctly all along.)
--
-- This migration brings the 139 views onto the same footing as their siblings so
-- the console can read them with the session client, exactly as loadPartnerQuota
-- already reads v_allocation_quota.
--
-- v_company_cert_usage selects FROM v_batch_attempts. With security_invoker on
-- both, the caller needs SELECT on the inner view too -- hence both grants.
--
-- v_direct_vouchers is deliberately NOT granted and NOT made invoker:
--   1. it joins v_voucher_validity, which is not security_invoker and is not
--      granted to authenticated -- an invoker read would fail 42501 anyway;
--   2. B2C seats belong to no company, so there is no partner who should ever
--      see them. Platform admin only, through a service-role path.

begin;

alter view public.v_batch_attempts     set (security_invoker = on);
alter view public.v_company_cert_usage set (security_invoker = on);

grant select on public.v_batch_attempts     to authenticated;
grant select on public.v_company_cert_usage to authenticated;

commit;
