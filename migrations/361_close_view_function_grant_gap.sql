-- 361_close_view_function_grant_gap.sql
--
-- Close the four view/function grant gaps. Measured, not judged.
--
-- ============ THE GAP ============
--
-- A `security_barrier` view is not `security_invoker`: tables it queries
-- directly are checked as the view OWNER, but a FUNCTION called inside it runs
-- with the CALLER's privileges. So a role holding SELECT on the view and
-- lacking EXECUTE on the function gets a 500, and the gap is invisible from
-- any role holding both -- which is every role anyone tests with. 339 is the
-- instance that reached production and took explain_task down in two languages
-- for two hours.
--
-- Measured 2026-09-21 by scripts/sql/check-view-function-grant-gap.sql:
--
--   mcp.concept       concept_row_en_hash      etl_admin, read_only_user
--   mcp.lesson        lesson_body_is_servable  etl_admin, read_only_user
--   mcp.lesson_index  lesson_body_is_servable  etl_admin, read_only_user
--   mcp.task          task_ksa_is_withheld     etl_admin, read_only_user
--
-- The lesson and task gaps date from 341 and 350. 359 did not create the
-- class; it joined it.
--
-- ============ WHY THIS GRANT WIDENS NOTHING ============
--
-- The question was whether granting EXECUTE gives these roles reach they do
-- not already have. Enumerated every table each function reads, and checked
-- with has_table_privilege rather than reading a grant list:
--
--   concept_row_en_hash       concepts
--   lesson_body_is_servable   lessons, lesson_translation_reviews
--   task_ksa_is_withheld      task_translations, task_translation_reviews
--     -> task_ksa_en_hash     tasks
--   translation_hash          nothing; it is pure
--
-- BOTH ROLES ALREADY HOLD SELECT ON EVERY ONE, through membership of
-- pg_read_all_data. So EXECUTE grants access to no byte they cannot already
-- read directly; it converts a 500 into a working read of data already
-- readable. That is a repair, not an access decision.
--
-- HAD ANY FUNCTION READ A TABLE THEY COULD NOT REACH, this migration would not
-- exist and the gap would be a decision to take rather than a bug to fix. The
-- measurement is what made it the first and not the second.
--
-- ============ THE SECURITY PROPERTY THAT MUST NOT MOVE ============
--
-- These functions are SECURITY DEFINER and exist so mcp_reader can evaluate a
-- predicate over tables it has NO grant on. Widening EXECUTE to two read-all
-- roles does not touch that: anon and authenticated are named in the
-- post-conditions and must still be refused, because for THEM the definer
-- really would be a way to read what they were not granted.
--
-- ============ ITS FIRST RUN ABORTED, AND NOT ON PRIVILEGES ============
--
--     ERROR: relation "mcp.pg_stat_statements_info" does not exist
--
-- The pre-condition built a text identifier -- has_table_privilege(role,
-- 'mcp.' || c.relname, 'SELECT') -- and the planner may evaluate that on rows
-- the n.nspname = 'mcp' filter would have excluded, so a relname from another
-- schema got 'mcp.' prefixed onto it and the lookup failed. The function side
-- already passed p.oid, which is exactly why only the table side broke.
--
-- Every privilege call here now passes the OBJECT -- an oid, or a regclass /
-- regprocedure literal resolved at parse time. A CONSTRUCTED IDENTIFIER
-- INSIDE A WHERE CLAUSE IS A LOOKUP WAITING FOR A ROW YOU DID NOT INTEND.
--
-- Confirmed the aborted run granted nothing: all four gate functions still
-- read false for both roles. The DO block aborted the whole transaction, as
-- it should, and that was checked rather than assumed.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_gap  int;
  n_bad  int;
begin

  -- ----------------------------------------------- pre-condition
  -- THE GAP MUST EXIST. If it does not, something already closed it and this
  -- migration is operating on a different database than the one measured.
  select count(*) into n_gap
    from (select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'mcp'
            join pg_proc p on true
            join pg_namespace pn on pn.oid = p.pronamespace and pn.nspname = 'public'
           where c.relkind = 'v'
             and p.proname in ('concept_row_en_hash','lesson_body_is_servable','task_ksa_is_withheld')
             and pg_get_viewdef(c.oid, true) ~ ('\m' || p.proname || '\s*\(')
             and has_table_privilege('supabase_read_only_user', c.oid, 'SELECT')
             and not has_function_privilege('supabase_read_only_user', p.oid, 'EXECUTE')) t;
  if n_gap = 0 then
    raise exception 'no gap for supabase_read_only_user -- already closed, or the measurement was wrong';
  end if;
  raise notice 'before -- % view/function pair(s) would 500 for supabase_read_only_user', n_gap;

  -- ----------------------------------------------- the grants
  grant execute on function public.concept_row_en_hash(uuid)
    to supabase_read_only_user, supabase_etl_admin;
  grant execute on function public.lesson_body_is_servable(uuid)
    to supabase_read_only_user, supabase_etl_admin;
  grant execute on function public.task_ksa_is_withheld(uuid)
    to supabase_read_only_user, supabase_etl_admin;
  -- called INSIDE task_ksa_is_withheld, so the caller needs it too.
  grant execute on function public.task_ksa_en_hash(uuid)
    to supabase_read_only_user, supabase_etl_admin;
  grant execute on function public.translation_hash(text, text, text)
    to supabase_read_only_user, supabase_etl_admin;

  -- ===================== POST-CONDITIONS =====================

  -- 1. POSITIVE. The gap is closed for every view/function pair, derived from
  --    the catalogue rather than from the list of four in the header -- a view
  --    added since the measurement is covered too.
  select count(*) into n_gap
    from (select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'mcp'
            join pg_proc p on true
            join pg_namespace pn on pn.oid = p.pronamespace and pn.nspname = 'public'
           where c.relkind = 'v' and p.prokind = 'f'
             and pg_get_viewdef(c.oid, true) ~ ('\m' || p.proname || '\s*\(')
             and (has_table_privilege('supabase_read_only_user', c.oid, 'SELECT')
                  and not has_function_privilege('supabase_read_only_user', p.oid, 'EXECUTE')
                  or has_table_privilege('supabase_etl_admin', c.oid, 'SELECT')
                  and not has_function_privilege('supabase_etl_admin', p.oid, 'EXECUTE'))) t;
  if n_gap <> 0 then
    raise exception '% view/function pair(s) still gap', n_gap;
  end if;

  -- 2. NEGATIVE, AND IT IS THE ONE THAT MATTERS. anon and authenticated must
  --    still be refused. For them a SECURITY DEFINER function IS a way to read
  --    tables they hold no grant on, which is the reason it is definer at all.
  if has_function_privilege('anon', 'public.concept_row_en_hash(uuid)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.lesson_body_is_servable(uuid)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.task_ksa_is_withheld(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'anon can execute a gate predicate';
  end if;
  if has_function_privilege('authenticated', 'public.concept_row_en_hash(uuid)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.lesson_body_is_servable(uuid)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.task_ksa_is_withheld(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'authenticated can execute a gate predicate';
  end if;

  -- 3. NEGATIVE. The serving roles kept theirs. A revoke-and-regrant typo here
  --    would take the MCP surface down, which is 339 exactly.
  if not has_function_privilege('mcp_reader', 'public.concept_row_en_hash(uuid)'::regprocedure, 'EXECUTE')
     or not has_function_privilege('mcp_holder', 'public.lesson_body_is_servable(uuid)'::regprocedure, 'EXECUTE')
     or not has_function_privilege('mcp_reader', 'public.task_ksa_is_withheld(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'a serving role lost EXECUTE on a gate predicate';
  end if;

  -- 4. NEGATIVE. No new TABLE reach. Every table these functions read was
  --    already readable by both roles, which is what made this a repair --
  --    asserted here rather than left in the header.
  select count(*) into n_bad
    from (values ('public.concepts'::regclass), ('public.lessons'::regclass),
                 ('public.lesson_translation_reviews'::regclass),
                 ('public.task_translations'::regclass),
                 ('public.task_translation_reviews'::regclass),
                 ('public.tasks'::regclass)) v(t)
   where not has_table_privilege('supabase_read_only_user', v.t, 'SELECT')
      or not has_table_privilege('supabase_etl_admin', v.t, 'SELECT');
  if n_bad <> 0 then
    raise exception '% input table(s) were NOT already readable -- this grant widens access', n_bad
      using detail = 'Stop. This is an access decision, not a repair.';
  end if;

  raise notice '361 ok: grant gap closed for all mcp view/function pairs; anon and authenticated still refused';
end
$mig$;
