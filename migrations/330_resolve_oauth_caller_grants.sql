-- 330_resolve_oauth_caller_grants.sql
--
-- 329 granted `mcp.resolve_oauth_caller` to the wrong role. The first OAuth
-- lesson read ever attempted answered
--
--     HTTP 500 {"error":"read failed"}
--     mcp_requests.error: permission denied for function resolve_oauth_caller
--
-- ===================== A MIGRATION WRITTEN UNDER A DESIGN THAT CHANGED =====================
--
-- 329's own header says it: "The Worker reaches this over PostgREST with the
-- service key." That was TRUE WHEN IT WAS WRITTEN. The open question at the time
-- was where the gate lives, and one answer had the Worker resolving the token
-- and forwarding what it found.
--
-- The answer chosen was the other one: THE GATE STAYS IN THE FUNCTION. The Worker
-- forwards the bearer and resolves nothing, because putting a boundary back into
-- application code for one class of caller is a category change. `courseware-read`
-- then resolves the token on its OWN READER POOL, connecting as `mcp_reader` --
-- the same pool, the same role and the same reason as `resolve_api_key`, which
-- 323 granted to `mcp_reader` and nothing else.
--
-- The function side was built for that decision. The grants were not revisited,
-- because nothing in a migration file changes when a decision made in
-- conversation changes. **The header was already stale in the commit that
-- introduced it.**
--
-- ===================== AND THE POST-CONDITIONS PROVED THE WRONG PARTY =====================
--
-- This is the sharper half, and it is a rule this repository wrote down one day
-- earlier: RUN THE CHECK AS THE PARTY THE PROPERTY IS ABOUT.
--
-- 329 asserted that `service_role` could USE schema mcp, and that it could NOT
-- read mcp.lesson. Both true. Both about a role that never calls this function.
-- It asserted nothing about `mcp_reader`, which is the only role that does -- so
-- it passed, cleanly, while the path it exists to enable could not run.
--
-- A grant checked for the wrong grantee is indistinguishable from a grant that
-- works, in exactly the way a check that cannot fire is indistinguishable from
-- one that ran clean.
--
-- ===================== WHAT THIS DOES =====================
--
--   1. EXECUTE to mcp_reader, mirroring 323 exactly.
--   2. Revokes the two grants 329 made to service_role, which were made for a
--      caller that does not exist. `usage on schema mcp` was not held by
--      service_role before 329 -- that was measured, and it is what produced the
--      42501 that prompted the grant -- so this restores the prior state rather
--      than tightening past it.
--   3. Proves it BY CALLING IT as mcp_reader, which is what 329 should have done.

begin;

do $mig$
declare
  n        integer;
  v_status text;
  blocked  boolean := false;
begin

  -- ---------------------------------------------------------------- the fix

  grant execute on function mcp.resolve_oauth_caller(uuid, uuid) to mcp_reader;

  -- The Worker resolves nothing. An unused grant on a schema that carries the
  -- lesson paywall is not neutral: it is a door nobody opened yet.
  revoke execute on function mcp.resolve_oauth_caller(uuid, uuid) from service_role;
  revoke usage on schema mcp from service_role;

  -- ============ PROVEN BY CALLING IT AS THE ROLE THAT WILL ============

  execute format('grant mcp_reader to %I with set true', current_user);

  -- 1. THE POSITIVE HALF, AND THE ONE 329 OMITTED. mcp_reader must be able to
  --    execute it and get an answer back.
  execute 'set local role mcp_reader';
  select r.caller_status into v_status
    from mcp.resolve_oauth_caller(
           '00000000-0000-4000-8000-000000000001'::uuid,
           '00000000-0000-4000-8000-0000000000ff'::uuid) r;
  execute 'reset role';

  if v_status is distinct from 'client_not_approved' then
    raise exception 'mcp_reader called it and got %', coalesce(v_status, '<null>')
      using hint = 'expected client_not_approved for an unknown client';
  end if;

  -- 2. A REAL BINDING, AS mcp_reader, RESOLVING TO AN ENTITLED ISSUER.
  --    The row that matters: an issuer with mcp_scopes actually set. If none is
  --    granted yet this reports UNPROVEN rather than passing quietly.
  select count(*) into n from public.issuers
   where coalesce(array_length(mcp_scopes, 1), 0) > 0;
  if n = 0 then
    raise notice 'UNPROVEN: no issuer carries mcp_scopes, so the entitled path did not run';
  else
    declare
      v_user   uuid;
      v_client uuid;
      v_scopes text[];
    begin
      select b.user_id, b.client_id into v_user, v_client
        from public.oauth_issuer_bindings b
        join public.issuers i on i.id = b.issuer_id
       where coalesce(array_length(i.mcp_scopes, 1), 0) > 0
       limit 1;

      if v_user is null then
        raise notice 'UNPROVEN: no binding points at an entitled issuer';
      else
        execute 'set local role mcp_reader';
        select r.caller_status, r.scopes into v_status, v_scopes
          from mcp.resolve_oauth_caller(v_user, v_client) r;
        execute 'reset role';

        if v_status is distinct from 'active' then
          raise exception 'an entitled binding resolved as %', coalesce(v_status, '<null>');
        end if;
        if not ('courseware:lessons' = any(v_scopes)) then
          raise exception 'an entitled binding resolved without courseware:lessons'
            using detail = array_to_string(v_scopes, ',');
        end if;
        raise notice 'mcp_reader resolves an entitled binding to %', array_to_string(v_scopes, ',');
      end if;
    end;
  end if;

  -- 3. AND service_role IS BACK OUT. Attempted, not inferred: a SELECT through
  --    a revoked schema is not destructive, so the check and the damage are not
  --    the same action.
  if has_schema_privilege('service_role', 'mcp', 'USAGE') then
    raise exception 'service_role still holds usage on schema mcp';
  end if;
  if has_function_privilege('service_role', 'mcp.resolve_oauth_caller(uuid, uuid)', 'EXECUTE') then
    raise exception 'service_role still holds execute on resolve_oauth_caller';
  end if;

  -- 4. AND NOBODY ELSE WANDERED IN.
  if has_function_privilege('anon', 'mcp.resolve_oauth_caller(uuid, uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'mcp.resolve_oauth_caller(uuid, uuid)', 'EXECUTE') then
    raise exception 'anon or authenticated can call resolve_oauth_caller';
  end if;

  -- 5. THE READER STILL CANNOT READ A LESSON BODY. The grant added above is the
  --    right to ASK a question, never the right to act on the answer -- 315 and
  --    322 are what make that true and this is where it would quietly stop being.
  begin
    execute 'set local role mcp_reader';
    execute 'select 1 from mcp.lesson limit 1';
    execute 'reset role';
  exception when insufficient_privilege then
    blocked := true;
  end;
  execute 'reset role';
  if not blocked then
    raise exception 'mcp_reader can read lesson bodies'
      using hint = 'the resolution grant widened the pool; nothing is committed';
  end if;

  raise notice 'resolve_oauth_caller: mcp_reader may call it, service_role may not, reader still blind to bodies';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
--   select proname,
--          has_function_privilege('mcp_reader',  p.oid, 'EXECUTE') as reader,
--          has_function_privilege('service_role', p.oid, 'EXECUTE') as service
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'mcp' and proname in ('resolve_api_key', 'resolve_oauth_caller');
--   -- expect reader t / service f on BOTH rows: one shape for two credentials
--
--   select has_schema_privilege('service_role', 'mcp', 'USAGE');
--   -- expect f, the state that held before 329
