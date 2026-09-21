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
select p.view_name, p.fn_name,
       string_agg(r.rolname, ', ' order by r.rolname) as roles_that_would_500
  from pairs p
  join roles r
    on has_table_privilege(r.rolname, p.view_oid, 'SELECT')
   and not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
 group by p.view_name, p.fn_name
 order by p.view_name, p.fn_name;
