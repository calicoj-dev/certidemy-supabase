-- 368 -- install `unaccent` so search stops being accent-sensitive.
--
-- ############ THE DEFECT ############
--
-- `search` matches with a word-boundary regex against raw text, with no
-- normalisation on either side. So a query typed without accents does not
-- match text that has them. Measured at the deployed endpoint:
--
--   es-419  auditoria+accent   69      auditoria       0
--   es-419  gestion+accent     33      gestion         5
--   es-419  informacion+acc    26      informacion     0
--   pt-BR   avaliacao+cedilla  14      avaliacao       0
--   pt-BR   secao+cedilla      59      secao           0
--   en      audit              80      --              --
--
-- THE 5-OF-33 IS THE DANGEROUS ONE, NOT THE ZEROS. An empty result makes a
-- user question their spelling. A short result looks like an answer, and
-- nothing tells them twenty-eight were missed.
--
-- EXPOSURE: 751 distinct accented words in the es-419 searchable corpus, 12.9
-- percent of its vocabulary; 1,008 in pt-BR, 16.9 percent. Every one of the
-- top fourteen in each language is a plausible query term. This is a
-- mobile-first Android product in LATAM, where the accent is two taps away.
--
-- ############ WHAT THIS MIGRATION IS AND IS NOT ############
--
-- IT BYPASSES NO GATE. The rows it newly matches were always servable through
-- `mcp.task` and `mcp.concept` and were merely unmatched. This is recall over
-- already-cleared content, not release of withheld content -- so it is not a
-- mixed change and needs no release enumeration.
--
-- BUT "more rows returned" IS THE INTENDED EFFECT AND THEREFORE CANNOT BE THE
-- EVIDENCE THAT IT WORKED. The controls are in scripts/verify-unaccent.mjs and
-- they assert EQUALITY of result sets -- accented against unaccented, same
-- count and same ids -- because a control written as "the unaccented query
-- returns rows" would have PASSED the broken state for `gestion`. Five is
-- rows. The worst manifestation of this defect is the one a non-emptiness
-- check cannot see.
--
-- ############ SCHEMA-QUALIFIED AT EVERY CALL SITE ############
--
-- The extension goes in `extensions`, and every caller writes
-- `extensions.unaccent(...)` in full.
--
-- THIS IS NOT TIDINESS. Several functions here run with `search_path = ''`,
-- and `public.translation_hash` resolving `public.ksa_en_hash` at runtime
-- under that setting took every non-English concept read down for four
-- migrations before anyone found it. An unqualified `unaccent(...)` inside
-- any SECURITY INVOKER body would reproduce that exactly.
--
-- Whoever later "tidies" the qualification away: this paragraph is why not.
--
-- ############ THE INDEX DOOR, CLOSED IN ADVANCE ############
--
-- `unaccent()` is STABLE, not IMMUTABLE -- its behaviour depends on a
-- dictionary file on disk. It therefore CANNOT appear in an index expression
-- without an IMMUTABLE wrapper function.
--
-- That costs nothing today because there is no index: `courseware-query`
-- argues deliberately that a search is certification-scoped, the corpus is a
-- few hundred rows, and the scan is microseconds. Measured before this change,
-- the widest query (en/AIMS-IA, 131 rows scanned, 80 returned) executes in
-- 19.1 ms, and `mcp.concept` already calls two functions per row inside it.
--
-- Recorded here so the next person reaching for a GIN index learns it from a
-- comment rather than from an afternoon.
--
-- ############ ONE STATEMENT ############
--
-- A single DO block, because a migration's atomicity is a property of the
-- transport and the SQL editor's handling of a multi-statement paste is not
-- established -- see scripts/sql/probe-editor-transaction.sql. One statement
-- is one transaction under every pooling mode.

do $mig$
declare
  v_schema text;
  v_plain  text;
  v_acc    text;
begin
  -- 1. The extension. `extensions` is where Supabase puts them and where the
  --    callers will look for it.
  create extension if not exists unaccent with schema extensions;

  -- 2. POST-CONDITIONS, BOTH DIRECTIONS.

  -- POSITIVE: it is installed, and in the schema the callers name.
  select n.nspname into v_schema
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'unaccent';
  if v_schema is null then
    raise exception 'unaccent did not install';
  end if;
  if v_schema <> 'extensions' then
    raise exception 'unaccent installed into %, but every call site writes extensions.unaccent()', v_schema;
  end if;

  -- POSITIVE: it strips the diacritics this corpus actually contains. Built
  -- from character codes rather than typed, because four transport surprises
  -- this week were non-ASCII text mangled between an author and its execution.
  v_acc := 'auditor' || chr(237) || 'a se' || chr(231) || chr(227) || 'o gesti' || chr(243) || 'n';
  v_plain := extensions.unaccent(v_acc);
  if v_plain <> 'auditoria secao gestion' then
    raise exception 'unaccent produced %, expected "auditoria secao gestion"', v_plain;
  end if;

  -- NEGATIVE: ASCII passes through untouched. If this moved, every English
  -- query would change meaning and the English cells of the wire matrix would
  -- be measuring something else.
  if extensions.unaccent('audit management system') <> 'audit management system' then
    raise exception 'unaccent altered pure ASCII; English behaviour would change';
  end if;

  -- NEGATIVE: it strips DIACRITICS AND NOTHING ELSE. A normaliser that also
  -- folded plurals or stems would make `gestor` and `gestion` collide, and the
  -- matcher would stop discriminating -- which is indistinguishable from
  -- "unaccent worked" if nobody checks.
  if extensions.unaccent('gestor') = extensions.unaccent('gesti' || chr(243) || 'n') then
    raise exception 'unaccent collapsed two distinct words; it is doing more than stripping accents';
  end if;

  raise notice '368: unaccent installed in %, diacritics stripped, ASCII unchanged, distinct words stay distinct', v_schema;
end
$mig$;

-- Read it back. A SEPARATE statement deliberately: it needs no transaction and
-- must not re-introduce a dependency on the paste being atomic.
select e.extname, e.extversion, n.nspname as schema,
       extensions.unaccent('auditor' || chr(237) || 'a') as sample
  from pg_extension e join pg_namespace n on n.oid = e.extnamespace
 where e.extname = 'unaccent';
