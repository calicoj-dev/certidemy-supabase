-- Standing assertion: no mcp.* view is readable by a role that cannot execute
-- the function that view calls. 339's defect as a query rather than a memory.
--
-- MUST USE has_*_privilege, NOT aclexplode. An ACL-only version of this check
-- reported ZERO GAP while the role running it was sitting in the gap:
-- supabase_read_only_user reads through pg_read_all_data membership, which
-- never appears in relacl. The property is EFFECTIVE privilege.
with views as (
  select c.relname, pg_get_viewdef(c.oid, true) as def
    from pg_class c join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'mcp'
   where c.relkind = 'v'
), fns as (
  select p.oid, p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
   where p.prokind = 'f'
), pairs as (
  select v.relname as view_name, f.proname as fn_name, f.oid as fn_oid,
         'mcp.' || v.relname as view_sig
    from views v join fns f on v.def ~ ('\m' || f.proname || '\s*\(')
), roles as (
  select rolname from pg_roles
   where rolname not like 'pg\_%' and rolname not like 'supabase\_admin%'
)
select p.view_name, p.fn_name,
       coalesce(string_agg(r.rolname, ', ' order by r.rolname), '(none)') as roles_that_would_500
  from pairs p
  left join roles r
    on has_table_privilege(r.rolname, p.view_sig, 'SELECT')
   and not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
 group by p.view_name, p.fn_name
 order by p.view_name, p.fn_name;
