-- 369 -- mcp.unaccent: make the dictionary reachable from the partner read role.
--
-- ############ THE INCIDENT THIS FIXES ############
--
-- 368 installed `unaccent` into `extensions` and `courseware-read` was deployed
-- calling `extensions.unaccent(...)`. Every search returned:
--
--   HTTP 500 {"error":"read failed"}
--
-- for EVERY language including English, deterministically, surviving a 90
-- second rest -- which is how it was told apart from pooler exhaustion, the
-- other thing that produces that exact string. The function was rolled back
-- within minutes and search is serving again on the pre-unaccent code.
--
-- ############ AND IT IS THE 364 SHAPE, WHICH THIS REPOSITORY ALREADY KNEW ###
--
-- Measured with the has_*_privilege family -- what is TRUE, not what was typed:
--
--   role          USAGE on extensions    EXECUTE on unaccent
--   mcp_reader    FALSE                  true
--   mcp_holder    FALSE                  true
--   anon          true                   true
--   authenticated true                   true
--
-- EXECUTE IS TRUE. Extension functions are granted to PUBLIC, so an
-- EXECUTE-only check reports clean -- and the call is refused at the SCHEMA
-- DOOR before the function ACL is ever consulted.
--
-- CLAUDE.md records this exact two-gate structure, from 364/365, including the
-- rule that a reachability check asks has_function_privilege AND
-- has_schema_privilege and reports WHICH gate is shut. That control existed and
-- was not run before deploying. The outage is not a surprise about Postgres; it
-- is a documented failure mode that nobody checked for.
--
-- ############ WHY NOT JUST GRANT USAGE ON extensions ############
--
-- Measured rather than argued, the way 365 measured the same question for
-- `public`:
--
--   extensions holds 59 functions, 0 of them SECURITY DEFINER, and 2 relations
--   (pg_stat_statements and its info view), from pg_stat_statements, pgcrypto,
--   unaccent and uuid-ossp.
--
-- That is far milder than `public`, where the same grant would have exposed 217
-- functions, 16 of them SECURITY DEFINER running as postgres. But it is still a
-- standing widening of what a partner-facing read role can reach, for one
-- dictionary lookup -- and `pg_stat_statements` carries query text from the
-- whole database.
--
-- So: the 365 precedent. A thin `mcp.` wrapper that DELEGATES to the original
-- rather than reimplementing it, because a second copy of a normaliser diverges
-- and the divergence surfaces as a query matching in one layer and not the
-- other.
--
-- ############ ONE STATEMENT ############
--
-- A single DO block. A migration's atomicity is a property of the transport and
-- this editor's handling of a multi-statement paste is not established.

do $mig$
declare
  v_acc  text;
  v_out  text;
  v_bad  text;
begin
  -- 1. The wrapper. SECURITY DEFINER so the schema door is opened by the
  --    definer rather than by widening the caller; IMMUTABLE is NOT claimed,
  --    because unaccent depends on a dictionary file and claiming otherwise
  --    would make it index-eligible and wrong.
  execute $fn$
    create or replace function mcp.unaccent(p_text text)
     returns text
     language sql
     stable
     security definer
     set search_path to ''
    as $body$
      -- DELEGATES, never reimplements. A hand-rolled translate() would drift
      -- from the dictionary and the drift would surface as a query matching in
      -- one layer and not the other.
      select extensions.unaccent('extensions.unaccent'::regdictionary, p_text)
    $body$;
  $fn$;

  comment on function mcp.unaccent(text) is
    'Accent-stripping for courseware search. Delegates to extensions.unaccent. '
    'SECURITY DEFINER because mcp_reader has no USAGE on extensions, and '
    'widening that for one dictionary lookup would expose 59 functions and '
    'pg_stat_statements to a partner-facing read role.';

  -- 2. Grant to exactly the roles the search path runs as, named rather than
  --    assumed. PUBLIC is deliberately NOT granted: a SECURITY DEFINER function
  --    is reachable by anyone holding EXECUTE, so the grant list IS the
  --    exposure.
  revoke all on function mcp.unaccent(text) from public;
  grant execute on function mcp.unaccent(text) to mcp_reader, mcp_holder;

  -- 3. POST-CONDITIONS, BOTH DIRECTIONS.

  -- POSITIVE: it strips the diacritics this corpus contains. Built from
  -- character codes, never typed.
  v_acc := 'auditor' || chr(237) || 'a se' || chr(231) || chr(227) || 'o gesti' || chr(243) || 'n';
  v_out := mcp.unaccent(v_acc);
  if v_out <> 'auditoria secao gestion' then
    raise exception 'mcp.unaccent produced %, expected "auditoria secao gestion"', v_out;
  end if;

  -- NEGATIVE: ASCII untouched, or every English query changes meaning.
  if mcp.unaccent('audit management system') <> 'audit management system' then
    raise exception 'mcp.unaccent altered pure ASCII; English behaviour would change';
  end if;

  -- NEGATIVE: diacritics AND NOTHING ELSE. A normaliser that also folded stems
  -- would make the matcher stop discriminating, which is indistinguishable from
  -- "it worked" unless something checks.
  if mcp.unaccent('gestor') = mcp.unaccent('gesti' || chr(243) || 'n') then
    raise exception 'mcp.unaccent collapsed two distinct words';
  end if;

  -- POSITIVE, AND THE ONE THE OUTAGE NEEDED: the roles that actually call it
  -- can reach it. EXECUTE alone is not reachability -- that is the whole
  -- lesson of 364 -- so this asserts the pair.
  select string_agg(r.rolname, ', ' order by r.rolname) into v_bad
    from pg_roles r
   where r.rolname in ('mcp_reader','mcp_holder')
     and not (
       has_function_privilege(r.rolname, 'mcp.unaccent(text)'::regprocedure, 'EXECUTE')
       and has_schema_privilege(r.rolname, 'mcp', 'USAGE')
     );
  if v_bad is not null then
    raise exception 'role(s) still cannot reach mcp.unaccent: %', v_bad;
  end if;

  raise notice '369: mcp.unaccent created, delegating to extensions.unaccent, reachable by mcp_reader and mcp_holder';
end
$mig$;

-- Read it back, as a separate statement.
select p.proname, p.prosecdef as security_definer,
       has_schema_privilege('mcp_reader', 'extensions', 'USAGE') as reader_usage_extensions,
       has_function_privilege('mcp_reader', p.oid, 'EXECUTE')    as reader_execute_wrapper,
       mcp.unaccent('auditor' || chr(237) || 'a')                as sample
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'mcp' and p.proname = 'unaccent';
