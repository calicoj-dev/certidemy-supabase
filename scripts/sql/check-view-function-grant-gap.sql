-- Standing assertion: no mcp.* view is readable by a role that cannot execute
-- the function that view calls. 339's defect as a query rather than a memory.
--
-- TWO THINGS THIS QUERY GETS RIGHT THAT THE OBVIOUS VERSION DOES NOT, and both
-- were found by writing the obvious version first.
--
-- 1. IT ASKS WHAT IS TRUE, NOT WHAT WAS GRANTED. An aclexplode(relacl) against
--    aclexplode(proacl) form reported ZERO GAP on four views while the role
--    running it was sitting in the gap on all four: supabase_read_only_user
--    reads through MEMBERSHIP of pg_read_all_data, which confers SELECT and
--    appears in no ACL anywhere. The has_*_privilege family resolves
--    membership, inheritance and defaults; an ACL comparison sees only what
--    someone typed.
--
-- 2. IT PASSES THE OBJECT, NOT ITS NAME. A version using
--    has_table_privilege(role, 'mcp.' || c.relname, 'SELECT') aborted with
--
--        ERROR: relation "mcp.pg_stat_statements_info" does not exist
--
--    The planner is free to evaluate that constructed identifier on rows the
--    n.nspname = 'mcp' filter would have excluded, so a relname from another
--    schema got 'mcp.' prefixed onto it and the lookup failed. The OID
--    overload takes the object itself and cannot be misresolved.
--
--    A CONSTRUCTED IDENTIFIER INSIDE A WHERE CLAUSE IS A LOOKUP WAITING FOR A
--    ROW YOU DID NOT INTEND.
--
-- Reports. Does not fail. Empty output means no gap.
with views as (
  select c.oid as view_oid, c.relname, pg_get_viewdef(c.oid, true) as def
    from pg_class c join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'mcp'
   where c.relkind = 'v'
), fns as (
  select p.oid as fn_oid, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
   where p.prokind = 'f'
), pairs as (
  select v.relname as view_name, v.view_oid, f.proname as fn_name, f.fn_oid
    from views v join fns f on v.def ~ ('\m' || f.proname || '\s*\(')
), roles as (
  select rolname from pg_roles
   where rolname not like 'pg\_%' and rolname not like 'supabase\_admin%'
)
-- ============================================================================
-- REACHING A FUNCTION IS TWO GATES AND THIS ASKED ABOUT ONE.
--
-- Until 365 the join below read only
--
--     and not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
--
-- and this file reported NO GAP on mcp.concept while every non-English read of
-- it answered HTTP 500 with "permission denied for schema public". mcp_reader
-- holds EXECUTE on both functions the view calls and has no USAGE on the schema
-- they live in, so the call is refused at the door before the function ACL is
-- ever consulted.
--
-- That is one rung below the note at the top of this file. There, an ACL
-- comparison measured what was TYPED and has_function_privilege measured what
-- is TRUE. Here has_function_privilege IS true and the call still fails --
-- because it answers "may this role execute this function", and the property
-- is "can this role reach it". The check named after the gap could not see it.
--
-- WHICH_GATE is reported rather than a bare verdict, because the two failures
-- need opposite fixes: a missing EXECUTE is a grant, and a missing schema USAGE
-- must NOT be fixed by granting schema USAGE (that would expose 217 public
-- functions to the partner read role). It is fixed by moving the call site into
-- a schema the role already reaches. 365 is the worked example.
-- ============================================================================
select p.view_name, p.fn_name,
       case when not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
            then 'EXECUTE on the function'
            else 'USAGE on schema public' end as which_gate,
       string_agg(r.rolname, ', ' order by r.rolname) as roles_that_would_500
  from pairs p
  join roles r
    on has_table_privilege(r.rolname, p.view_oid, 'SELECT')
   and (not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
        or not has_schema_privilege(r.rolname, 'public', 'USAGE'))
 group by p.view_name, p.fn_name,
          case when not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
               then 'EXECUTE on the function'
               else 'USAGE on schema public' end
 order by p.view_name, p.fn_name;

-- ---------------------------------------------------------------------------
-- POSITIVE CONTROL. An empty report above means "no gap" only if this query can
-- produce a row at all; a check that cannot fire is indistinguishable from one
-- that fired and found nothing. This asserts the instrument still sees a gap it
-- is KNOWN to have: mcp_reader against public.lesson_body_is_servable, which
-- 365 deliberately left unfixed.
--
-- If this returns no row, the check above proves nothing and must not be read
-- as clean.
select 'POSITIVE CONTROL' as check,
       case when has_table_privilege('mcp_reader', 'mcp.lesson'::regclass, 'SELECT')
             and not has_schema_privilege('mcp_reader', 'public', 'USAGE')
            then 'FIRES -- the report above is meaningful'
            else 'DID NOT FIRE -- the report above proves nothing' end as verdict;
