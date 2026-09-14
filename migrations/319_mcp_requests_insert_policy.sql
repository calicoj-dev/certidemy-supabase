-- 319_mcp_requests_insert_policy.sql
--
-- 317 enabled RLS on public.mcp_requests and granted mcp_logger INSERT, and
-- wrote no policy. Every log write failed with
--   new row violates row-level security policy for table "mcp_requests"
--
-- A GRANT IS NOT A POLICY. Same lesson as 316's revoke-by-name, from the other
-- direction: there, a privilege survived a revoke aimed at PUBLIC; here, a
-- privilege was granted and still denied. Both are the rule CLAUDE.md already
-- states -- the table-level grant is checked BEFORE row-level security, and
-- passing the first check says nothing about the second. A table with RLS
-- enabled and no policy is CLOSED, including to a role holding INSERT.
--
-- ===================== DOES RLS EVEN APPLY HERE? MEASURED =====================
--
--   public.mcp_requests owner ......... postgres
--   relrowsecurity .................... true
--   relforcerowsecurity ............... false
--   mcp_logger rolbypassrls ........... FALSE
--   policies on the table ............. 0
--
-- The definer function runs as mcp_logger, which is neither the owner nor a
-- BYPASSRLS role, SO RLS APPLIES. relforcerowsecurity being false exempts the
-- OWNER only, and the owner is not who is inserting.
--
-- service_role DOES hold rolbypassrls, so reading the telemetry was never
-- affected by this and is not affected by the policy below.
--
-- ===================== WHY A POLICY AND NOT `disable row level security`
--
-- RLS staying on is what keeps the table closed to everything that is not named
-- here. anon and authenticated hold no grant AND now face a policy that does not
-- mention them; removing RLS would leave only the grant between them and the
-- table, which is one revoke away from being wrong. The policy is narrow: INSERT
-- only, for one role.
--
-- `with check (true)` is not laxness. mcp_logger cannot reach this table by any
-- other path -- it holds INSERT and nothing else, no SELECT, no UPDATE, no
-- DELETE -- and every row it writes is constructed by mcp.log_request, whose
-- body is fixed. A narrower predicate would constrain a shape the role cannot
-- vary.
--
-- ===================== WHAT WOULD HAVE CAUGHT THIS =====================
--
-- 317's post-conditions asserted that the GRANT existed and never asserted that
-- an INSERT SUCCEEDS. Both defects that survived it -- this one and the identity
-- assertion that could not resolve a schema-qualified name -- are the same
-- omission: every check read pg_catalog and none exercised the path.
--
-- So this migration does not assert that a policy exists. IT PERFORMS THE WRITE,
-- through the whole chain: set role mcp_reader, call mcp.log_request, let the
-- definer switch to mcp_logger, let RLS judge it, then confirm the row landed
-- and remove it. If any link is broken the transaction aborts.
--
-- Editor-first, ONE STATEMENT: paste the whole DO block. A DO block is atomic on
-- its own and a raise inside it rolls back the policy with it.

do $mig$
declare
  n_before bigint;
  n_after  bigint;
  marker   text := '319 insert probe';
begin
  -- ------------------------------------------------------------- the policy
  execute 'drop policy if exists mcp_requests_logger_insert on public.mcp_requests';
  execute $ddl$
    create policy mcp_requests_logger_insert
      on public.mcp_requests
      for insert
      to mcp_logger
      with check (true)
  $ddl$;

  -- The probe below must become mcp_reader. CREATE ROLE gives its creator ADMIN
  -- and withholds SET since PG16, which is what cost 317 its first attempt; an
  -- explicit grant supplies it, and ADMIN OPTION is the privilege that permits
  -- the grant. INHERIT is deliberately not included.
  execute format('grant mcp_reader to %I with set true', current_user);

  select count(*) into n_before from public.mcp_requests;

  -- ------------------------------------------------- the whole chain, executed
  -- mcp_reader holds EXECUTE on the function and INSERT on nothing. The definer
  -- switches to mcp_logger. RLS judges the row. Anything broken raises here.
  execute 'set local role mcp_reader';
  perform mcp.log_request(
    'log', null, null, null, null, null, null, null, null, null,
    200, null, 0, marker, null, null, null
  );
  execute 'reset role';

  select count(*) into n_after from public.mcp_requests;

  if n_after <> n_before + 1 then
    raise exception 'the log write did not land'
      using detail = 'rows before ' || n_before || ', after ' || n_after,
            hint   = 'the policy exists but the insert was still refused';
  end if;

  if not exists (select 1 from public.mcp_requests where error = marker) then
    raise exception 'a row landed but not the probe row'
      using hint = 'something else wrote concurrently; rerun';
  end if;

  delete from public.mcp_requests where error = marker;

  raise notice 'log write verified end to end and the probe row removed';
end
$mig$;

-- ===================== VERIFICATION =====================
--
-- The write above ran INSIDE the transaction and aborted on failure, so these
-- confirm the shape it cannot see.
--
-- 1. ONE POLICY, INSERT ONLY, FOR ONE ROLE. Expect a single row:
--    mcp_requests_logger_insert, INSERT, {mcp_logger}, with_check true.
--
-- select policyname, cmd, roles::text, qual, with_check
--   from pg_policies
--  where schemaname = 'public' and tablename = 'mcp_requests';
--
-- 2. RLS IS STILL ON. Expect t. Fixing this by disabling RLS would also pass
--    check 1's absence, so assert the thing that was NOT done.
--
-- select relrowsecurity from pg_class where oid = 'public.mcp_requests'::regclass;
--
-- 3. THE BROWSER ROLES STILL HAVE NOTHING. A policy naming mcp_logger does not
--    grant anyone else anything, but this is the assertion that says so.
--    Expect four f.
--
-- select r as role,
--        has_table_privilege(r, 'public.mcp_requests', 'SELECT') as sel,
--        has_table_privilege(r, 'public.mcp_requests', 'INSERT') as ins
--   from unnest(array['anon','authenticated']) r;
--
-- 4. THE TABLE IS EMPTY OR CARRIES ONLY REAL TRAFFIC -- the probe row was
--    deleted. Expect 0.
--
-- select count(*) as leftover_probe_rows
--   from public.mcp_requests where error = '319 insert probe';
--
-- ===================== STILL OPEN, RECORDED HERE =====================
--
-- mcp_reader CAN WRITE SOMEWHERE, and it is not this table. pg_net grants ALL on
-- net.http_request_queue and net._http_response to PUBLIC, and USAGE on schema
-- net to PUBLIC, so every role on this database -- mcp_reader included -- can
-- enqueue outbound HTTP requests and call 12 net functions. Measured 2026-09-14.
--
-- So the property "mcp_reader can write nothing" was never true, and the runtime
-- assertion that discovered it was right to refuse.
--
-- NOT FIXED HERE, because pg_net is load-bearing: cron jobs dispatch-webhooks
-- and dispatch-emails both call net.http_post every minute. Revoking PUBLIC's
-- access means granting it explicitly to whatever role those jobs run as, and
-- getting that wrong stops outbound email and partner webhooks. It is its own
-- migration with its own investigation, not a line folded into an RLS fix.
