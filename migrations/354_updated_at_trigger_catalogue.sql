-- 354_updated_at_trigger_catalogue.sql
--
-- Expose ONE catalogue fact: which tables have a trigger that MAINTAINS
-- `updated_at`. Read-only, no arguments, no table data.
--
-- ============ WHY A MIGRATION FOR A CHECK ============
--
-- `scripts/check-updated-at-writers.mjs` compares the writers of every table
-- carrying `updated_at` and fails when they disagree about setting it. On its
-- first run it produced two failures and both were false positives. One was
-- fixable in source: an upsert with ignoreDuplicates can only INSERT, so the
-- column default supplies the value. The other was `achievements`, which has a
-- trigger -- and whether a table has one is not visible from source.
--
-- pg_catalog is not reachable through PostgREST and no RPC exposed it (checked
-- against the OpenAPI document: 47 RPCs, none matching trigger/catalog/schema).
-- Reading the trigger list out of the migrations folder is the defect CLAUDE.md
-- opens with. So the fact is named once, in the database, where it is true --
-- the same argument as 350's lesson_body_is_servable.
--
-- ============ ITS FIRST RUN ABORTED, AND THE CAUSE WAS NOT THE COUNT ============
--
-- It raised `the function returns 22 table(s), the predicate finds 25` and
-- wrote nothing. TWO defects, and the interesting one is second.
--
-- FIRST, A POPULATION ERROR. The pre-condition ran `count(*)` over a join of
-- pg_trigger, which counts TRIGGERS, and asserted it of what the function
-- returns, which is DISTINCT TABLES. Three tables carry two matching triggers
-- each -- achievements, credential_results, profiles -- so 25 triggers are 22
-- tables and both numbers were right. Fifth instance of one family in a week:
-- a page cap read as a total, a per-line count read as per-segment, a census
-- taken before the pass it described, a mean over the wrong population, and
-- now a trigger count read as a table count.
--
-- SECOND, AND THIS IS THE ONE WORTH THE FILE: THE PREDICATE MATCHED A
-- SUBSTRING WHEN THE PROPERTY IS AN ASSIGNMENT.
--
--   pg_get_functiondef(p.oid) ilike '%updated_at%'
--
-- `material_updated_at` CONTAINS `updated_at`. That is the Open Badges
-- credential-freshness column -- a different column, a different meaning, and
-- the thing DOC_VERSION bumps travel with. So the predicate classified three
-- tables as maintaining `updated_at` on the strength of triggers that do
-- nothing of the kind:
--
--   achievement_alignments   alignment_bump_credential_material
--   achievement_results      achievement_result_bump_credential_material
--   credentials              credentials_bump_material
--
-- None of those three even carries an `updated_at` column. It also matched
-- guard triggers that merely READ the column without maintaining it.
--
-- CLAUDE.md: "Guards match code shapes, never English words", and the sharper
-- form -- every one of the five instances recorded there "searched for a
-- STRING when the property was a PLACE". This searched for a string when the
-- property is an ASSIGNMENT. The predicate is now:
--
--   pg_get_functiondef(p.oid) ~* 'new\.updated_at\s*:?='
--
-- Measured: 25 substring matches across 22 tables, against 19 real ones.
--
-- ============ THE POST-CONDITION CALLS THE FUNCTION ============
--
-- The first version re-derived the set in its own post-condition and compared
-- the two. That is a mirrored pair inside a single file, and it failed exactly
-- the way this repository's cross-repo pairs fail: two spellings of one rule,
-- each correct against itself, disagreeing about a population.
--
-- A CHECK THAT RE-IMPLEMENTS ITS SUBJECT IS TESTING THE RE-IMPLEMENTATION. So
-- every post-condition below calls `tables_with_updated_at_trigger()`, and what
-- it asserts are NAMED FACTS -- this table is in, that one is out -- which are
-- claims about the world rather than second copies of the rule. Same shape as
-- 347, which asserts named scopes accepted and refused rather than recounting
-- its own constraint.
--
-- ============ WHAT IT DELIBERATELY DOES NOT DO ============
--
-- It returns table NAMES and nothing else: no row counts, no column values, no
-- trigger bodies. A function handing out catalogue detail is a way to learn the
-- shape of a schema, so this one answers a single yes/no per table and is
-- granted to service_role only. The script that calls it holds the service key.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_set      int;
  n_no_trig  int;
  n_bad_col  int;
begin

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
       and pg_catalog.pg_get_functiondef(p.oid) ~* 'new\.updated_at\s*:?='
     order by 1
  $fn$;

  comment on function public.tables_with_updated_at_trigger() is
    'Tables in public whose updated_at is ASSIGNED by a trigger. Matches new.updated_at := rather than the substring updated_at, which also hits material_updated_at. Read by scripts/check-updated-at-writers.mjs to tell a real writer disagreement from a cosmetic one. Names only, no row data.';

  revoke all on function public.tables_with_updated_at_trigger() from public;
  grant execute on function public.tables_with_updated_at_trigger() to service_role;

  -- ===================== POST-CONDITIONS =====================
  --
  -- ALL of these call the function. None re-derives its rule.

  -- 1. CONTROL. An empty set makes every assertion below vacuous and would
  --    make the calling script exempt nothing, silently.
  select count(*) into n_set from public.tables_with_updated_at_trigger();
  if n_set = 0 then
    raise exception 'the function returns no table at all -- the predicate matches nothing';
  end if;

  -- 2. POSITIVE, NAMED. profiles carries the canonical `profiles_updated_at`
  --    trigger on set_updated_at; achievements is the table whose false
  --    positive bought this migration. Both must be in.
  if not exists (select 1 from public.tables_with_updated_at_trigger() where table_name = 'profiles') then
    raise exception 'profiles is absent -- it carries profiles_updated_at on set_updated_at';
  end if;
  if not exists (select 1 from public.tables_with_updated_at_trigger() where table_name = 'achievements') then
    raise exception 'achievements is absent -- it has a trigger and is why 354 exists';
  end if;

  -- 3. NEGATIVE, NAMED, AND IT IS THE HALF THAT MATTERS. A predicate returning
  --    everything would satisfy checks 1 and 2 and make the script exempt every
  --    table -- a gate that cannot fire. user_certifications carries updated_at
  --    with no trigger.
  if exists (select 1 from public.tables_with_updated_at_trigger() where table_name = 'user_certifications') then
    raise exception 'user_certifications is present -- it has no updated_at trigger, so the predicate is too broad';
  end if;

  -- 4. NEGATIVE, NAMED, AND IT IS THE ONE THE REWRITE WAS FOR. `credentials`
  --    carries credentials_bump_material, which touches material_updated_at and
  --    never updated_at. The substring predicate returned it. If this fires, the
  --    check has regressed to matching a name instead of an assignment.
  if exists (select 1 from public.tables_with_updated_at_trigger()
              where table_name in ('credentials', 'achievement_alignments', 'achievement_results')) then
    raise exception 'a material_updated_at table is present -- the predicate is matching the substring again'
      using detail = 'credentials, achievement_alignments and achievement_results bump material_updated_at, a different column.';
  end if;

  -- 5. EVERY TABLE RETURNED ACTUALLY HAS THE COLUMN. A trigger assigning
  --    new.updated_at on a table without that column could not work, so any
  --    such row means the predicate is reading something else.
  select count(*) into n_bad_col
    from public.tables_with_updated_at_trigger() f
   where not exists (
     select 1 from pg_attribute a
       join pg_class c on c.oid = a.attrelid
       join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
      where c.relname = f.table_name and a.attname = 'updated_at' and not a.attisdropped
   );
  if n_bad_col <> 0 then
    raise exception '% returned table(s) do not carry an updated_at column', n_bad_col;
  end if;

  -- 6. THE SET SPANS BOTH STATES. If every table carrying updated_at were
  --    trigger-maintained the calling script could never fail, and a green run
  --    would carry no information.
  select count(*) into n_no_trig
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
   where a.attname = 'updated_at' and c.relkind = 'r' and not a.attisdropped
     and c.relname not in (select table_name from public.tables_with_updated_at_trigger());
  if n_no_trig = 0 then
    raise exception 'every table carrying updated_at is trigger-maintained -- the script would exempt all of them';
  end if;

  -- 7. NEGATIVE. anon and authenticated cannot call it.
  if has_function_privilege('anon', 'public.tables_with_updated_at_trigger()', 'EXECUTE') then
    raise exception 'anon can execute tables_with_updated_at_trigger';
  end if;
  if has_function_privilege('authenticated', 'public.tables_with_updated_at_trigger()', 'EXECUTE') then
    raise exception 'authenticated can execute tables_with_updated_at_trigger';
  end if;

  raise notice '354 ok: % trigger-maintained, % convention-maintained', n_set, n_no_trig;
  raise notice 'check-updated-at-writers.mjs becomes a gate on the next run.';
end
$mig$;
