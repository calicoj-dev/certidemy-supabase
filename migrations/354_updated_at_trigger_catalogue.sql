-- 354_updated_at_trigger_catalogue.sql
--
-- Expose ONE catalogue fact: which tables have a trigger maintaining
-- `updated_at`. Read-only, no arguments, no table data.
--
-- ============ WHY A MIGRATION FOR A CHECK ============
--
-- `scripts/check-updated-at-writers.mjs` compares the writers of every table
-- carrying `updated_at` and fails when they disagree about setting it. On its
-- first run it produced exactly two failures and BOTH WERE FALSE POSITIVES:
--
--   user_certifications  the omitting writer is an upsert with
--                        ignoreDuplicates, so it can only INSERT and the
--                        column default supplies the value. Fixed in the
--                        script -- that is visible in source.
--
--   achievements         the table has a TRIGGER, so a writer that omits
--                        updated_at is correct. NOT visible in source, and
--                        this is what 354 is for.
--
-- A gate that is wrong on its first run gets loosened. This repository has the
-- record: the smoke-courseware assertions died that way, and CLAUDE.md keeps
-- the note that a gate wrongly called unreliable is worse than a gap, because
-- the gap is bounded and the distrust is not.
--
-- ============ WHY NOT READ IT SOMEWHERE ELSE ============
--
-- pg_catalog is not reachable through PostgREST and no RPC on this project
-- exposed it -- checked against the OpenAPI document, 47 RPCs, none matching
-- trigger/catalog/schema/table. The alternative was to read the trigger list
-- out of the migrations folder, which is the defect CLAUDE.md opens with: a
-- migration is an intention, dated, not a schema. Migration 329 described a
-- constraint perfectly for weeks after 331 had dropped it.
--
-- So the fact is named once, in the database, where it is true -- the same
-- argument as 350's lesson_body_is_servable.
--
-- ============ WHAT IT DELIBERATELY DOES NOT DO ============
--
-- It returns table NAMES and nothing else: no row counts, no column values, no
-- trigger bodies. A function that hands out catalogue detail is a way to learn
-- the shape of a schema, so this one answers a single yes/no per table and is
-- granted to service_role only. The script that calls it already holds the
-- service key.
--
-- The predicate is "some non-internal trigger on this table runs a function
-- whose body mentions updated_at". That is broader than `set_updated_at` by
-- design: 11 tables use that function and 6 more use a differently-named one,
-- and a list of function names would be the same second copy of a fact that
-- this file exists to avoid.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_tables  int;
  n_trig    int;
  n_probe   int;
begin

  -- ----------------------------------------------- pre-condition
  -- The control: if nothing in this database has such a trigger, the function
  -- would return an empty set and the caller would treat every table as
  -- untriggered -- which is the naive rule this exists to avoid.
  select count(*) into n_trig
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    join pg_proc p on p.oid = t.tgfoid
   where not t.tgisinternal
     and pg_get_functiondef(p.oid) ilike '%updated_at%';
  if n_trig = 0 then
    raise exception 'no trigger in public maintains updated_at -- the predicate is wrong'
      using hint = 'Expected at least the 17 tables measured on 2026-09-19.';
  end if;

  -- ----------------------------------------------- the function
  create or replace function public.tables_with_updated_at_trigger()
  returns table (table_name text)
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select distinct c.relname::text
      from pg_catalog.pg_trigger t
      join pg_catalog.pg_class c on c.oid = t.tgrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      join pg_catalog.pg_proc p on p.oid = t.tgfoid
     where n.nspname = 'public'
       and not t.tgisinternal
       and pg_catalog.pg_get_functiondef(p.oid) ilike '%updated_at%'
     order by 1
  $fn$;

  comment on function public.tables_with_updated_at_trigger() is
    'Tables in public whose updated_at is maintained by a trigger. Read by scripts/check-updated-at-writers.mjs to tell a real writer disagreement from a cosmetic one. Names only, no row data.';

  -- EXECUTE revoked from PUBLIC and granted by name. A definer function anyone
  -- may call is a way to read something they were not granted -- the same rule
  -- 350 applies to lesson_body_is_servable.
  revoke all on function public.tables_with_updated_at_trigger() from public;
  grant execute on function public.tables_with_updated_at_trigger() to service_role;

  -- ===================== POST-CONDITIONS =====================

  -- 1. POSITIVE, AND COMPARED AGAINST THE QUERY IT CLAIMS TO ANSWER rather
  --    than against a literal. The count is captured above from the same
  --    predicate; a number typed here would be the fifth literal this week to
  --    abort against a correct database.
  select count(*) into n_tables from public.tables_with_updated_at_trigger();
  if n_tables <> n_trig then
    raise exception 'the function returns % table(s), the predicate finds %', n_tables, n_trig;
  end if;

  -- 2. POSITIVE, NAMED. achievements is the table whose false positive bought
  --    this migration, so it is the one worth asserting by name.
  if not exists (select 1 from public.tables_with_updated_at_trigger() where table_name = 'achievements') then
    raise exception 'achievements is absent -- it has a trigger and is why 354 exists';
  end if;

  -- 3. NEGATIVE, AND IT IS THE HALF THAT MATTERS. A function returning EVERY
  --    table would satisfy checks 1 and 2 on a broken predicate and would make
  --    the script exempt everything -- a gate that cannot fire.
  --    user_certifications carries updated_at with NO trigger; it must not
  --    appear.
  if exists (select 1 from public.tables_with_updated_at_trigger() where table_name = 'user_certifications') then
    raise exception 'user_certifications is present -- it has no updated_at trigger, so the predicate is too broad';
  end if;

  -- 4. NEGATIVE. anon and authenticated cannot call it.
  if has_function_privilege('anon', 'public.tables_with_updated_at_trigger()', 'EXECUTE') then
    raise exception 'anon can execute tables_with_updated_at_trigger';
  end if;
  if has_function_privilege('authenticated', 'public.tables_with_updated_at_trigger()', 'EXECUTE') then
    raise exception 'authenticated can execute tables_with_updated_at_trigger';
  end if;

  -- 5. AND THE SET SPANS BOTH STATES, so the script's exemption is meaningful.
  --    If every table carrying updated_at were triggered, the check could never
  --    fail and would be a green that carries no information.
  select count(*) into n_probe
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
   where a.attname = 'updated_at' and c.relkind = 'r' and not a.attisdropped
     and c.relname not in (select table_name from public.tables_with_updated_at_trigger());
  if n_probe = 0 then
    raise exception 'every table carrying updated_at is trigger-maintained -- the script would exempt all of them';
  end if;

  raise notice '354 ok: % of % table(s) carrying updated_at are trigger-maintained',
    n_tables, n_tables + n_probe;
  raise notice 'check-updated-at-writers.mjs becomes a gate on the next run.';
end
$mig$;
