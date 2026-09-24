-- 370 -- mcp_check_reachable(): let the pre-deploy gate actually run.
--
-- ############ WHY THIS IS SEPARATE FROM 369 ############
--
-- 369 was approved as written. This is a different subject -- making the
-- pre-deploy check executable rather than making unaccent reachable -- and
-- folding it in silently would hand back an artifact that is not the one that
-- was read. Two small pastes beat one quietly altered.
--
-- ############ THE GATE IT UNBLOCKS ############
--
-- `scripts/check-inline-sql-reachable.mjs` extracts every schema-qualified
-- function that the TypeScript-assembled SQL names, and asserts the roles that
-- run that SQL can REACH each one. Reaching is TWO gates:
--
--   has_function_privilege   the ACL
--   has_schema_privilege     the schema door, checked FIRST
--
-- `extensions.unaccent` had EXECUTE true -- extension functions are granted to
-- PUBLIC -- and USAGE false. Deploying against it returned HTTP 500 on every
-- search in every language until it was rolled back. That is the second
-- partner-surface outage in a week from schema reachability, after 364.
--
-- Nothing in this repository can run pg_catalog SQL from a script: `_pg.mjs`
-- is PostgREST only. So without this RPC the gate reports UNVERIFIABLE and
-- exits 2 -- correct, and useless as a deploy gate, because a gate that always
-- fails closed is a gate somebody disables.
--
-- ############ IT IS PRIVILEGE INTROSPECTION ON AN EXPOSED SCHEMA ############
--
-- This function enumerates which roles can reach what. On this database that
-- is a live question, because PostgREST makes a `public` function an HTTP
-- endpoint unless something revokes it -- and an unauthenticated endpoint that
-- lists our roles and their access, added in order to CHECK access, would be a
-- worse trade than the schema USAGE we just declined.
--
-- MEASURED BEFORE DECIDING, not assumed:
--
--   anon USAGE on public                    true
--   anon USAGE on mcp                       FALSE
--   PostgREST exposes public                yes  (rpc/lesson_body_is_servable -> 200)
--   PostgREST exposes mcp                   NO   (rpc/unaccent -> 404)
--   a public function with EXECUTE revoked, called with an anon key   HTTP 401
--   the same, called with no key at all                               HTTP 401
--
-- SO THE CHOICE IS FORCED AND IT IS WORTH STATING. `mcp` would be invisible to
-- PostgREST entirely, which is stronger -- and the deploy gate reaches this
-- database through PostgREST and nothing else, so an `mcp` function it cannot
-- call is a gate that cannot run. A gate that cannot run is the thing this
-- whole migration exists to stop.
--
-- So: `public`, REVOKED FROM PUBLIC, granted to service_role alone -- the
-- identity the deploy script already authenticates as, which can read
-- everything regardless. Measured above: that combination answers 401 to anon.
--
-- AND THE POST-CONDITIONS ASSERT BOTH DIRECTIONS. An earlier draft did the
-- revoke and asserted only that the function WORKS. A revoke that silently
-- failed would have left an open privilege-introspection endpoint and every
-- post-condition would still have passed -- which is the one-sided-check shape
-- this repository has recorded five times this week.
--
-- It is SECURITY DEFINER because pg_proc rows for schemas the caller cannot
-- USE would otherwise be invisible -- which would make the function silently
-- unable to answer the exact question it exists for. An empty result meaning
-- "not asked" is that same failure again, one layer down.

do $mig$
declare
  v_usage  boolean;
  v_exec   boolean;
  v_open   text;
begin
  execute $fn$
    create or replace function public.mcp_check_reachable(p_roles text[], p_names text[])
     returns table (fname text, rolname text, can_execute boolean, can_use_schema boolean)
     language sql
     stable
     security definer
     set search_path to ''
    as $body$
      select c.fname,
             r.rolname,
             case when p.oid is null then null
                  else pg_catalog.has_function_privilege(r.rolname, p.oid, 'EXECUTE') end,
             pg_catalog.has_schema_privilege(r.rolname, pg_catalog.split_part(c.fname, '.', 1), 'USAGE')
        from pg_catalog.unnest(p_names) as c(fname)
        cross join pg_catalog.unnest(p_roles) as r(rolname)
        left join lateral (
          select p.oid
            from pg_catalog.pg_proc p
            join pg_catalog.pg_namespace n on n.oid = p.pronamespace
           where n.nspname = pg_catalog.split_part(c.fname, '.', 1)
             and p.proname = pg_catalog.split_part(c.fname, '.', 2)
           limit 1
        ) p on true
    $body$;
  $fn$;

  comment on function public.mcp_check_reachable(text[], text[]) is
    'Pre-deploy gate helper. Answers, per (role, function), whether the role holds '
    'EXECUTE and whether it holds USAGE on the schema -- the two gates, because a '
    'missing schema USAGE is refused before the ACL is read and the two need '
    'opposite fixes. Returns booleans only.';

  revoke all on function public.mcp_check_reachable(text[], text[]) from public;
  grant execute on function public.mcp_check_reachable(text[], text[]) to service_role;

  -- POST-CONDITIONS, BOTH DIRECTIONS.
  --
  -- POSITIVE: it reports a reachable function as reachable.
  select can_use_schema, can_execute into v_usage, v_exec
    from public.mcp_check_reachable(array['mcp_reader'], array['mcp.resolve_api_key']);
  if v_usage is not true or v_exec is not true then
    raise exception 'mcp.resolve_api_key reports unreachable by mcp_reader, which contradicts a serving endpoint';
  end if;

  -- NEGATIVE, AND IT IS THE OUTAGE ITSELF: the function must report the gap
  -- that took search down. If this passes as reachable, the gate is blind to
  -- the only thing it was built for.
  select can_use_schema, can_execute into v_usage, v_exec
    from public.mcp_check_reachable(array['mcp_reader'], array['extensions.unaccent']);
  if v_exec is not true then
    raise exception 'expected EXECUTE true on extensions.unaccent (granted to PUBLIC); got %', v_exec;
  end if;
  if v_usage is not false then
    raise exception 'expected USAGE false on extensions for mcp_reader; got % -- the gate cannot see the outage it exists for', v_usage;
  end if;

  -- NEGATIVE, AND IT IS THE ONE THE EARLIER DRAFT LACKED: the revoke landed.
  -- Nothing but the deploy identity may call a function that enumerates roles
  -- and their privileges.
  select string_agg(r.rolname, ', ' order by r.rolname) into v_open
    from pg_roles r
   where r.rolname in ('anon', 'authenticated', 'mcp_reader', 'mcp_holder')
     and has_function_privilege(r.rolname,
           'public.mcp_check_reachable(text[],text[])'::regprocedure, 'EXECUTE');
  if v_open is not null then
    raise exception 'privilege-introspection endpoint is callable by: % -- the revoke did not land', v_open;
  end if;

  -- POSITIVE: and the deploy identity CAN, or the gate cannot run and blocks
  -- every deploy forever.
  if not has_function_privilege('service_role',
        'public.mcp_check_reachable(text[],text[])'::regprocedure, 'EXECUTE') then
    raise exception 'service_role cannot call mcp_check_reachable; the deploy gate would never run';
  end if;

  raise notice '370: mcp_check_reachable created; service_role only, anon refused, extensions.unaccent reported gated at the schema door';
end
$mig$;

-- Read it back, as a separate statement -- including who can call it.
select r.rolname,
       has_function_privilege(r.rolname,
         'public.mcp_check_reachable(text[],text[])'::regprocedure, 'EXECUTE') as can_call
  from (values ('anon'),('authenticated'),('mcp_reader'),('mcp_holder'),('service_role')) r(rolname)
 order by r.rolname;

select * from public.mcp_check_reachable(
  array['mcp_reader','mcp_holder'],
  array['mcp.unaccent','extensions.unaccent','mcp.resolve_api_key']
) order by fname, rolname;
