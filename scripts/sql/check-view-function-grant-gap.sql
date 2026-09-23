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
-- 3. THE KEY IS (SCHEMA, PRONAME), NOT PRONAME. Matching a bare function name
--    anywhere in the view definition made `mcp.concept_row_en_hash(...)` match
--    the PUBLIC function of the same name too, so 365's fix was reported as
--    two fresh gaps against functions the view had stopped calling. Same shape
--    as a clause address that is only a key once the standard is attached.
--
-- 4. SCHEMA USAGE IS NOT A GATE ON A STORED VIEW'S CALL, and an earlier version
--    of this file asserted that it was. MEASURED: mcp_reader holds no USAGE on
--    public and reads mcp.lesson_index, which SELECTS the public function
--    lesson_body_is_servable and returns its values. A view's rewrite rule
--    holds the function by OID -- already resolved -- so no name lookup happens
--    at read time.
--
--    That version reported mcp.lesson, mcp.lesson_index and mcp.task as gaps.
--    All three answer 200 in all three languages. THE GUARD OVER-REPORTED ON
--    THREE WORKING PARTNER-FACING VIEWS, which is how a guard gets deleted.
--
--    What actually broke mcp.concept was SECURITY INVOKER, one level in:
--    public.translation_hash runs as the CALLER and its body resolves
--    public.ksa_en_hash by name at runtime, and THAT lookup needs USAGE on
--    public. The three SECURITY DEFINER functions never needed it.
--
--        A SECURITY DEFINER FUNCTION IS REACHABLE BY ANYONE HOLDING EXECUTE.
--        A SECURITY INVOKER FUNCTION IS ONLY AS REACHABLE AS EVERYTHING ITS
--        BODY TOUCHES.
--
--    So EXECUTE is the hard gap below, and SECURITY INVOKER is reported
--    separately as an ADVISORY -- a static reader cannot follow a function body
--    to every schema it resolves, and claiming otherwise would be the same
--    over-reporting again.
--
-- Reports. Does not fail. Empty output means no gap.

-- ============================ A. HARD GAPS ============================
-- A role that can SELECT the view and cannot EXECUTE a function it calls.
-- This is a 500 waiting for that role to read the view.
with views as (
  select c.oid as view_oid, c.relname, pg_get_viewdef(c.oid, true) as def
    from pg_class c join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'mcp'
   where c.relkind = 'v'
), fns as (
  select p.oid as fn_oid, p.proname, n.nspname, p.prosecdef
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where p.prokind = 'f' and n.nspname in ('public', 'mcp')
), pairs as (
  -- (schema, proname). An mcp call is written `mcp.f(`; a public call is the
  -- bare name, so it must NOT be preceded by `mcp.`.
  select v.relname as view_name, v.view_oid,
         f.nspname || '.' || f.proname as fn_name, f.fn_oid, f.nspname, f.prosecdef
    from views v
    join fns f
      on case when f.nspname = 'mcp'
              then v.def ~ ('\mmcp\.' || f.proname || '\s*\(')
              else v.def ~ ('(?<!mcp\.)\m' || f.proname || '\s*\(')
         end
)
-- NO ROLE FILTER. It used to exclude `pg\_%`, which hid `pg_read_all_data` --
-- the role THREE others reach these views through. 366's post-condition found
-- it and this file could not, so the two disagreed on the same property and
-- the migration was blamed. A filter that removes a whole class of role is not
-- noise reduction; it is a coverage gap that reports as clean.
-- TWO CLASSES, BECAUSE ONLY ONE OF THEM IS A DEFECT.
--
-- A NOLOGIN role cannot start a session, so it cannot be refused. It is a
-- privilege-bearing group, not a principal. `pg_read_all_data` holds SELECT on
-- every mcp view and EXECUTE on none of the four functions they call -- and has
-- been in exactly that state for `lesson_body_is_servable` and
-- `task_ksa_is_withheld` since 341 and 350, while both views answered 200 in
-- all three languages for months. The gap is inert, and the proof is that it
-- has already been sitting there harmlessly.
--
-- It is still REPORTED, because a NOLOGIN group is how a future login role will
-- inherit SELECT without inheriting EXECUTE, and the previous version of this
-- file made that invisible by filtering it out.
select case when r.rolcanlogin then 'HARD GAP' else 'INERT (nologin group)' end as class,
       p.view_name, p.fn_name,
       string_agg(r.rolname, ', ' order by r.rolname) as roles_that_would_500
  from pairs p
  join pg_roles r
    on has_table_privilege(r.rolname, p.view_oid, 'SELECT')
   and not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
 group by r.rolcanlogin, p.view_name, p.fn_name
 order by r.rolcanlogin desc, p.view_name, p.fn_name;

-- ====================== B. SECURITY INVOKER ADVISORY ======================
-- Not a gap by itself. A function called by an mcp view that runs as the
-- CALLER is only as reachable as its own body, and no static check here can
-- follow it. Each one needs a human to confirm every reader can reach what it
-- touches -- which is exactly what nobody did for translation_hash.
select 'INVOKER -- body must be reachable by every reader' as class,
       c.relname as view_name,
       n.nspname || '.' || p.proname as fn_name,
       coalesce(array_to_string(p.proconfig, ' '), '(no search_path pin)') as config
  from pg_class c
  join pg_namespace cn on cn.oid = c.relnamespace and cn.nspname = 'mcp'
  join pg_proc p on true
  join pg_namespace n on n.oid = p.pronamespace and n.nspname in ('public', 'mcp')
 where c.relkind = 'v'
   and not p.prosecdef
   and case when n.nspname = 'mcp'
            then pg_get_viewdef(c.oid, true) ~ ('\mmcp\.' || p.proname || '\s*\(')
            else pg_get_viewdef(c.oid, true) ~ ('(?<!mcp\.)\m' || p.proname || '\s*\(')
       end
 order by 2, 3;

-- ============================ C. POSITIVE CONTROL ============================
-- TWO-SIDED, ON THE PREDICATE ITSELF, AND IT STAYS TRUE AFTER THE GAPS CLOSE.
--
-- The previous control asserted a gap that 365/366 were about to fix, which is
-- the shape already recorded here as a defect: a control depending on a defect
-- remaining in production forbids repairing it. This asserts instead that
-- has_function_privilege can still answer BOTH ways on this database --
-- postgres owns and may execute the wrapper, anon may not. If either half
-- stops holding, the report above is not evidence of anything.
select 'POSITIVE CONTROL' as class,
       case when has_function_privilege('postgres', 'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
             and not has_function_privilege('anon', 'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
            then 'FIRES BOTH WAYS -- the report above is meaningful'
            else 'BROKEN -- the predicate no longer discriminates; ignore the report' end as verdict;
