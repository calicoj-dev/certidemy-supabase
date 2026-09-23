-- 366: 365 closed the partner path and shut the door on two other roles.
--
-- ############ v2. THE FIRST VERSION ABORTED ON ITS OWN POST-CONDITION ############
--
--     ERROR: P0001: 1 role(s) can read mcp.concept and cannot call its wrapper
--
-- and a read-only query afterwards found TWO failing roles, not one. That is an
-- instrument disagreeing with the corpus, so nothing was granted until it was
-- explained. It is explained, and neither number was wrong.
--
-- THE MIGRATION AND THE QUERY WERE LOOKING AT DIFFERENT DATABASES.
-- Everything here runs inside one transaction. When the DO block executed, its
-- own grants had already applied IN THAT TRANSACTION, so both named roles
-- already held the wrapper and were correctly excluded. The exception then
-- aborted the transaction and rolled the grants back, so the query run
-- afterwards saw a database where neither had it. Same predicate, two states.
--
-- THE ROLE IT FOUND WAS A THIRD ONE. Measured:
--
--   role                      selects mcp.concept via   wrap_en  wrap_tr
--   mcp_reader                direct grant              true     true
--   mcp_holder                direct grant              true     true
--   postgres                  direct grant              true     true
--   supabase_admin            pg_read_all_data          true     true
--   supabase_read_only_user   pg_read_all_data          FALSE    FALSE
--   supabase_etl_admin        pg_read_all_data          FALSE    FALSE
--   pg_read_all_data          (is the role itself)      FALSE    FALSE
--
-- The 1 was `pg_read_all_data`. The 2 were the named roles, measured after the
-- rollback. Three roles are in the gap, and the standing check reported only
-- two of them because `check-view-function-grant-gap.sql` filters
-- `rolname not like 'pg\_%'`.
--
-- SO THE MIGRATION'S ROLE SET WAS WIDER THAN THE STANDING CHECK'S, not
-- narrower. The check could not see the role that three others inherit from.
--
-- ############ WHAT COMMITTED: NOTHING ############
--
-- Measured rather than reasoned from the file: both named roles are still
-- FALSE on both wrappers. An error inside a transaction block makes a
-- subsequent COMMIT behave as ROLLBACK, so the grants pasted before the DO
-- block did not survive it. 365's wrappers and view are present and unchanged.
--
-- ############ AND pg_read_all_data IS NOT A CALLER ############
--
-- THE ASSERTION IS NOT NARROWED TO MAKE THIS PASS. It is scoped to the
-- property it was always about, and there is evidence rather than an argument.
--
-- `pg_read_all_data` is NOLOGIN. Nobody starts a session as it; it is a
-- privilege-bearing group, not a principal. It holds SELECT on every mcp view
-- and EXECUTE on none of the four functions those views call -- INCLUDING
-- `lesson_body_is_servable` and `task_ksa_is_withheld`, which have been in
-- exactly this state since 341 and 350.
--
-- So if a NOLOGIN role sitting in the gap were a defect, mcp.lesson,
-- mcp.lesson_index and mcp.task would have been broken for months. They answer
-- 200 in all three languages. The gap is inert because there is no session to
-- be refused.
--
-- What is NOT inert is a role that can log in and reaches the view through
-- membership -- which is precisely the two this migration restores. So the
-- assertion below covers `rolcanlogin` roles, and it still catches a future
-- member of `pg_read_all_data`, because such a member could log in.
--
-- NOT granted to `pg_read_all_data` itself, deliberately. That would close the
-- class permanently and is the tempting answer; it also extends what a builtin
-- role means for our schema, to fix a gap that three other view/function pairs
-- prove causes nothing. Recorded as the alternative rather than taken.
--
-- ############ 1. THE REGRESSION ############
--
-- 365 created mcp.concept_row_en_hash and mcp.translation_hash and granted
-- EXECUTE to mcp_reader and mcp_holder. The view now calls those wrappers. The
-- PUBLIC originals were also executable by supabase_read_only_user and
-- supabase_etl_admin; the wrappers were not, so both lost mcp.concept:
--
--     select ... from mcp.concept  ->  42501 permission denied for function translation_hash
--
-- Neither ever held a deliberate grant on an mcp function. They reached the
-- view because it called the PUBLIC originals, which they could execute. 365
-- moved the call site and took it away. `supabase_read_only_user` is the role
-- the read-only dashboard runs as; it is the instrument that measured this
-- entire week, including the outage that produced 365. Losing it is losing the
-- observability that found the defect.
--
-- BY NAME, never to PUBLIC.
--
-- ############ 2. THE CORRECTION TO 365'S ACCOUNT OF ITSELF ############
--
-- 365 said the call was refused "at the schema door before the function ACL is
-- ever consulted" and generalised that into a rule about two gates. The rule is
-- real elsewhere. IT IS NOT WHAT HAPPENED.
--
-- MEASURED, as mcp_reader, holding no USAGE on public:
--
--     POST courseware-read {resource: lesson_index, language: es-419}  ->  200
--     aims-ia-01-01-who-commissioned-it   body_available=false
--
-- mcp.lesson_index SELECTS public.lesson_body_is_servable and the value came
-- back. A stored view holds its functions BY OID; no name lookup happens at
-- read time, so schema USAGE is never consulted.
--
-- The gate was one level in:
--
--   public.concept_row_en_hash     DEFINER   runs as postgres     fine
--   public.lesson_body_is_servable DEFINER   runs as postgres     fine
--   public.task_ksa_is_withheld    DEFINER   runs as postgres     fine
--   public.translation_hash        INVOKER   runs as mcp_reader   BROKEN
--
-- translation_hash is SET search_path = '' and its body calls
-- public.ksa_en_hash by qualified name, resolved AT RUNTIME in the caller's
-- context. THAT lookup needs USAGE on public.
--
--   A SECURITY DEFINER FUNCTION IS REACHABLE BY ANYONE HOLDING EXECUTE.
--   A SECURITY INVOKER FUNCTION IS ONLY AS REACHABLE AS EVERYTHING ITS BODY
--   TOUCHES.
--
-- Consequences: the outage dates to 364, not 359; and mcp.lesson,
-- mcp.lesson_index and mcp.task were never latent and are not touched here.

begin;

grant execute on function mcp.concept_row_en_hash(uuid)          to supabase_read_only_user, supabase_etl_admin;
grant execute on function mcp.translation_hash(text, text, text) to supabase_read_only_user, supabase_etl_admin;

do $post$
declare bad text; n_rel int;
begin
  -- POSITIVE, AND THE ASSERTION IS THE ONE THAT CAUGHT THIS: any role that can
  -- start a session and SELECT this view must be able to call what it calls.
  --
  -- It NAMES the offenders rather than counting them. v1 raised "1 role(s)"
  -- and the number could not be reconciled with a query run in another state;
  -- a name can. A count is a summary of a set, and the set is what the next
  -- person needs.
  select string_agg(r.rolname || ' -> ' || f.fn, ', ' order by r.rolname)
    into bad
    from pg_roles r
   cross join (values ('mcp.concept_row_en_hash(uuid)'),
                      ('mcp.translation_hash(text,text,text)')) f(fn)
   where r.rolcanlogin
     and has_table_privilege(r.rolname, 'mcp.concept'::regclass, 'SELECT')
     and not has_function_privilege(r.rolname, f.fn::regprocedure, 'EXECUTE');
  if bad is not null then
    raise exception 'a login role can read mcp.concept and cannot call its wrapper'
      using detail = bad,
            hint   = 'grant the wrapper to that role BY NAME; do not narrow this assertion';
  end if;

  -- NEGATIVE, both halves. The fix must not widen the mcp roles, and must not
  -- reach a role that could not read the view in the first place.
  if has_schema_privilege('mcp_reader', 'public', 'USAGE')
     or has_schema_privilege('mcp_holder', 'public', 'USAGE') then
    raise exception 'an mcp role gained USAGE on public';
  end if;

  select count(*) into n_rel
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r','v','m')
     and has_table_privilege('mcp_reader', c.oid, 'SELECT');
  if n_rel <> 0 then
    raise exception 'mcp_reader can now select % public relation(s)', n_rel;
  end if;

  if has_function_privilege('anon',          'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('service_role',  'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE') then
    raise exception 'a browser or service role can call an mcp wrapper';
  end if;

  raise notice '366: mcp.concept readable again by every login role that could read it before 365.';
end $post$;

commit;
