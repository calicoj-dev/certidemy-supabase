-- 366: 365 closed the partner path and shut the door on two other roles.
--
-- AND IT CORRECTS 365'S OWN ACCOUNT OF WHY IT WORKED. That account is in
-- CLAUDE.md and in 365's header, it is wrong in its top-level claim, and the
-- correction changes what the next person does about three other views.
--
-- ============ 1. THE REGRESSION, WHICH IS THE ONLY THING THIS CHANGES ============
--
-- 365 created mcp.concept_row_en_hash and mcp.translation_hash and granted
-- EXECUTE to mcp_reader and mcp_holder. The view now calls those wrappers.
-- The PUBLIC originals had also been granted to supabase_read_only_user and
-- supabase_etl_admin; the wrappers were not, so those two roles lost
-- mcp.concept entirely:
--
--     select ... from mcp.concept  ->  42501 permission denied for function translation_hash
--
-- That is dashboard SQL and ETL, not partner traffic -- but it is a surface
-- somebody uses, it broke silently, and it was found by a query that happened
-- to touch the view rather than by anything watching. The grant list of a
-- wrapper must match the grant list of the original it replaces, or the
-- replacement is a narrowing wearing the shape of a fix.
--
-- ============ 2. THE CORRECTION: SCHEMA USAGE WAS NOT THE GATE ============
--
-- 365 said the call was "refused at the schema door before the function ACL is
-- ever consulted", and generalised that into a rule about reachability being
-- two gates. The rule is real. IT IS NOT WHAT HAPPENED HERE.
--
-- MEASURED, on the deployed endpoint, as mcp_reader, holding no USAGE on
-- public:
--
--     POST courseware-read {resource: lesson_index, language: es-419}  ->  200
--     aims-ia-01-01-who-commissioned-it   body_available=false
--
-- mcp.lesson_index selects `lesson_body_is_servable(l.id)`, a PUBLIC function,
-- and the value came back. So a stored view calling a public function does NOT
-- require the reader to hold USAGE on public: the view's rewrite rule holds the
-- function by OID, already resolved, and no name lookup happens at read time.
--
-- The difference is INSIDE the function:
--
--   public.concept_row_en_hash    SECURITY DEFINER   body runs as postgres   fine
--   public.lesson_body_is_servable SECURITY DEFINER  body runs as postgres   fine
--   public.task_ksa_is_withheld   SECURITY DEFINER   body runs as postgres   fine
--   public.translation_hash       SECURITY INVOKER   body runs as mcp_reader BROKEN
--
-- translation_hash is `SET search_path = ''` and its body calls
-- public.ksa_en_hash by qualified name. That name is resolved AT RUNTIME, in
-- the caller's privilege context, and THAT lookup needs USAGE on public.
--
-- > **A SECURITY DEFINER FUNCTION IS REACHABLE BY ANYONE HOLDING EXECUTE. A
-- > SECURITY INVOKER FUNCTION IS ONLY AS REACHABLE AS EVERYTHING ITS BODY
-- > TOUCHES**, and a search_path of '' makes every one of those touches a
-- > fully-qualified runtime lookup that the CALLER must be able to perform.
--
-- 365's wrapper is SECURITY DEFINER, so the whole chain runs as postgres. It
-- fixed the defect for a reason its own header stated only in a side comment.
--
-- ============ 3. SO THE THREE "LATENT" VIEWS ARE NOT LATENT ============
--
-- 365 recorded mcp.lesson, mcp.lesson_index and mcp.task as one planner
-- decision away from the same 500, and deferred them. That was wrong and this
-- migration does NOT touch them. All three call SECURITY DEFINER functions,
-- all three are evaluated today -- mcp.lesson calls its function in the WHERE
-- clause, where nothing can prune it -- and all three answer 200 in all three
-- languages on the wire.
--
-- The dating was wrong too. The outage began at 364, which put translation_hash
-- into the predicate, NOT at 359: 359's predicate used only
-- concept_row_en_hash, and that one has always been callable.
--
-- check-view-function-grant-gap.sql reported those three because it asks
-- has_schema_privilege about a stored view's already-resolved call. That
-- predicate is wrong for this shape and is corrected in the same commit.

begin;

grant execute on function mcp.concept_row_en_hash(uuid)          to supabase_read_only_user, supabase_etl_admin;
grant execute on function mcp.translation_hash(text, text, text) to supabase_read_only_user, supabase_etl_admin;

do $post$
declare n_rel int; n_gap int;
begin
  -- POSITIVE: every role that could read mcp.concept before 365 can again.
  -- Derived from the PUBLIC originals' grant list rather than typed, so the
  -- assertion cannot drift from the thing it is restoring.
  select count(*) into n_gap
    from pg_roles r
   where has_function_privilege(r.rolname, 'public.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
     and not has_function_privilege(r.rolname, 'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
     and has_table_privilege(r.rolname, 'mcp.concept'::regclass, 'SELECT');
  if n_gap <> 0 then
    raise exception '% role(s) can read mcp.concept and cannot call its wrapper', n_gap;
  end if;

  -- NEGATIVE, both halves. Widening the wrapper must not widen the ROLE, and
  -- must not hand the wrapper to anyone who could not read the view anyway.
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

  if has_function_privilege('anon', 'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE') then
    raise exception 'a browser role can call an mcp wrapper';
  end if;

  raise notice '366: mcp.concept readable again by every role that held the originals.';
end $post$;

commit;
