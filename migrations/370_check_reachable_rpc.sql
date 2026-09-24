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
-- ############ WHY IT IS SAFE TO EXPOSE ############
--
-- It answers a BOOLEAN about privilege for a caller-supplied (role, function)
-- pair. It returns no data, no query text, no row contents; every fact it
-- reports is already derivable by anyone who can read pg_proc, and it is
-- granted to service_role only -- the credential the scripts already hold, and
-- which can read everything anyway.
--
-- It is SECURITY DEFINER because pg_proc rows for schemas the caller cannot
-- USE would otherwise be invisible -- which would make the function silently
-- unable to answer the exact question it exists for. An empty result meaning
-- "not asked" is the failure this repository keeps paying for.

do $mig$
declare
  v_usage  boolean;
  v_exec   boolean;
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

  raise notice '370: mcp_check_reachable created; reports mcp.resolve_api_key reachable and extensions.unaccent gated at the schema door';
end
$mig$;

-- Read it back, as a separate statement.
select * from public.mcp_check_reachable(
  array['mcp_reader','mcp_holder'],
  array['mcp.unaccent','extensions.unaccent','mcp.resolve_api_key']
) order by fname, rolname;
