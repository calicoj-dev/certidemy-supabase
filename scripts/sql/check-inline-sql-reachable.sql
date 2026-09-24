-- Can the roles that run courseware-read's SQL reach every function it names?
--
-- The TypeScript-assembled query is a call site no enumeration of `mcp` views
-- can see. check-view-function-grant-gap.sql covers views; this covers the
-- other half, and the other half is what took search down.
--
-- BOTH GATES, because they need opposite fixes and only one of them is visible
-- from an ACL: a missing EXECUTE is a grant; a missing schema USAGE is refused
-- at the door before any ACL is consulted, and must NOT be fixed by widening
-- the schema -- see 369.

-- ############ ONLY INLINE-SQL CALL SITES BELONG IN THIS LIST ############
--
-- The first version of this list also carried public.translation_hash,
-- public.lesson_body_is_servable, public.task_ksa_is_withheld and
-- public.concept_row_en_hash -- and reported HARD GAP on all of them, because
-- mcp_reader has no USAGE on `public`.
--
-- THOSE ARE FALSE POSITIVES, and CLAUDE.md already records why: a stored view
-- holds its functions BY OID in the rewrite rule, so no name resolution
-- happens at read time and schema USAGE is never consulted. Those four are
-- reached through views and they work; mcp.lesson_index answers 200 in all
-- three languages with mcp_reader holding no USAGE on public.
--
-- The INLINE path is different in kind: SQL assembled in TypeScript and sent
-- over the wire resolves every name AT RUNTIME, in the caller's privilege
-- context. That is why `extensions.unaccent` 500'd and the view-internal calls
-- do not.
--
-- So this list carries only what the TypeScript names. Mixing the two paths
-- makes the check report three healthy functions as gaps, and a guard that
-- cries wolf gets loosened by the first person who sees it.
--
-- `scripts/check-inline-sql-reachable.mjs` derives the list from the source
-- rather than from this comment; keep them in step or prefer the script.
with called(fname) as (
  values ('mcp.unaccent'), ('mcp.resolve_api_key'), ('mcp.resolve_oauth_caller'),
         ('mcp.feature_status'), ('mcp.log_request')
),
roles(rolname) as (values ('mcp_reader'), ('mcp_holder'))
select c.fname, r.rolname,
       p.oid is not null                                                as exists,
       has_schema_privilege(r.rolname, split_part(c.fname,'.',1), 'USAGE') as usage_schema,
       case when p.oid is null then null
            else has_function_privilege(r.rolname, p.oid, 'EXECUTE') end as execute_fn,
       case
         when p.oid is null then 'NOT A FUNCTION (a view or relation -- check table grants instead)'
         when not has_schema_privilege(r.rolname, split_part(c.fname,'.',1), 'USAGE')
              then 'HARD GAP: no USAGE on schema -- refused before the ACL is read'
         when not has_function_privilege(r.rolname, p.oid, 'EXECUTE')
              then 'HARD GAP: no EXECUTE'
         else 'reachable'
       end as verdict
  from called c
  cross join roles r
  left join lateral (
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = split_part(c.fname,'.',1) and p.proname = split_part(c.fname,'.',2)
     limit 1
  ) p on true
 order by (case when p.oid is not null
                 and has_schema_privilege(r.rolname, split_part(c.fname,'.',1), 'USAGE')
                 and has_function_privilege(r.rolname, p.oid, 'EXECUTE') then 1 else 0 end),
          c.fname, r.rolname;
