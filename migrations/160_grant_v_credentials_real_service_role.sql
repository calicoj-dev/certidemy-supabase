-- 160_grant_v_credentials_real_service_role.sql
--
-- Grants the service role SELECT on v_credentials_real.
--
-- WHY THIS IS NOT OPTIONAL: migration 155 created the view and granted SELECT to
-- `authenticated` only. Every consumer that actually needs it is an edge
-- function running under the SERVICE role -- census, the governance snapshot,
-- the platform credential registry.
--
-- A missing grant is checked BEFORE RLS and produces a silent 42501. Every one
-- of those functions is failure-tolerant by design, so the error would be
-- swallowed and the surface would render zero credentials, zero certified
-- users, and an empty governance snapshot -- looking exactly like a working
-- feature with no data yet. This is the v_direct_vouchers failure, and it is on
-- record precisely so it does not happen twice.
--
-- The grant ships in the same session as the feature it enables. It is not
-- inferred from Supabase's default privileges, because those apply to objects
-- created under the role that owns the default-privilege setting, and this view
-- was created by hand in the SQL editor.

begin;

grant select on public.v_credentials_real to service_role;

commit;

-- ---------------------------------------------------------------------------
-- Verification (run separately)
-- ---------------------------------------------------------------------------
--
-- select grantee, privilege_type
--   from information_schema.role_table_grants
--  where table_schema = 'public'
--    and table_name = 'v_credentials_real'
--  order by grantee;
--
-- Expect both `authenticated` and `service_role` with SELECT.
--
-- Then prove the view and the base table still agree, since no specimen exists
-- yet:
--
-- select (select count(*) from public.credentials)        as base,
--        (select count(*) from public.v_credentials_real) as view_only;
--
-- Equal until the first specimen is minted. After that the difference should
-- equal the number of specimens, and nothing else.
