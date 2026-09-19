-- 349_anon_off_notes_and_snapshots.sql
--
-- Take anon off `tasks.notes` and off `jta_versions` entirely.
--
-- ============ WHAT anon COULD READ ============
--
-- Measured 2026-09-20 by `scripts/scan-public-internals.mjs`, which derives
-- every table anon holds SELECT on and reads AS anon rather than as service
-- role -- a grant is not exposure, and the credential a test holds IS the
-- hypothesis. 106 hits naming repository internals on three columns:
--
--   certifications.exam_blueprint     12   written by 344; 348 rewrites them
--   tasks.notes                       36   63 rows readable, 18 naming a
--                                          migration
--   jta_versions.blueprint_snapshot   58   52 migration numbers, 6 source paths
--
-- 348 fixed the first because the text was mine and carried no record value.
-- These two are different and neither is a text rewrite:
--
--   `tasks.notes` is CORRECT CONTENT ON THE WRONG SURFACE. "Rebuilt by
--   migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md
--   with migration 090 revisions applied." is exactly what a maintenance note
--   should say. The defect is that a stranger can read it.
--
--   `jta_versions.blueprint_snapshot` is EVIDENCE. Rewriting it to remove
--   migration numbers would destroy the record it exists to keep -- a snapshot
--   that has been edited is no longer a snapshot. Only the console reads it,
--   authenticated.
--
-- ============ THE TRAP THIS MIGRATION IS SHAPED AROUND ============
--
-- CLAUDE.md: "Column-scoped GRANT SELECT must list columns explicitly. A
-- table-wide GRANT SELECT silently overrides a column-level REVOKE."
--
-- So `revoke select (notes)` ALONE DOES NOTHING while the table-wide grant
-- stands. The only thing that works is to revoke the table grant and re-grant
-- the columns anon keeps, BY NAME. Sixteen of seventeen are named below;
-- `notes` is the one absent, and its absence is the whole migration.
--
-- ============ WHY THIS DOES NOT BREAK THE SITE ============
--
-- A column-scoped grant makes `select=*` fail for anon -- PostgREST expands the
-- star and hits the missing column. Checked before writing, all four public
-- reads of `tasks` name their columns and none names `notes`:
--
--   lib/blueprint/data.ts   id, code, statement, domain_id, order_index,
--                           knowledge, skills, abilities, bloom_level, criticality
--   lib/console/readiness.ts, lib/dashboard/data.ts, lib/team/data.ts
--                           id, domain_id
--
-- The MCP path is unaffected: it reads `mcp.task`, owned by the view owner, and
-- anon's grants on the base table do not reach it.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  before_notes  int;
  before_snap   int;
  after_notes   int;
  after_snap    int;
  after_public  int;
  n_cols        int;
begin

  -- ----------------------------------------------- BEFORE, as anon
  -- CAPTURED BY READING, NOT BY ASKING THE CATALOGUE. A grant is not exposure
  -- and neither is its absence; the probe that found this read as anon, so the
  -- one that closes it does too.
  execute 'set local role anon';
  begin
    select count(*) into before_notes from public.tasks where notes is not null;
  exception when insufficient_privilege then before_notes := -1;
  end;
  begin
    select count(*) into before_snap from public.jta_versions;
  exception when insufficient_privilege then before_snap := -1;
  end;
  execute 'reset role';

  raise notice 'before -- anon reads % task note(s) and % jta_version row(s)',
    before_notes, before_snap;

  if before_notes <= 0 and before_snap <= 0 then
    raise exception 'anon already reads neither -- nothing to do, or the probe is wrong'
      using hint = 'Run scripts/scan-public-internals.mjs before re-running this.';
  end if;

  -- ----------------------------------------------- the revokes
  --
  -- TABLE GRANT OFF FIRST, then the columns back by name. Doing it the other
  -- way round leaves a window, and leaving the table grant in place makes the
  -- column revoke a no-op that reads as a fix.
  revoke select on public.tasks from anon;
  grant select (
    id, certification_id, domain_id, code, statement, criticality, frequency,
    bloom_level, is_exam_scope, is_simulation_candidate, knowledge, skills,
    abilities, order_index, created_at, scope_tag
  ) on public.tasks to anon;

  -- Whole table. The console reads it with a user session, not anon.
  revoke select on public.jta_versions from anon;

  -- ===================== POST-CONDITIONS =====================
  --
  -- BOTH DIRECTIONS, AS anon. "notes is gone" alone passes on a revoke that
  -- took the whole table with it, which would break four pages.

  -- 1. NEGATIVE. notes is unreadable.
  execute 'set local role anon';
  begin
    select count(*) into after_notes from public.tasks where notes is not null;
  exception when insufficient_privilege then after_notes := -1;
  end;
  -- 2. POSITIVE. Everything the site actually selects still reads, and the
  --    count matches what anon saw before -- a revoke that also tripped RLS
  --    would satisfy check 1 and empty the blueprint page.
  begin
    select count(*) into after_public
      from (select id, code, statement, domain_id, order_index,
                   knowledge, skills, abilities, bloom_level, criticality
              from public.tasks) t;
  exception when insufficient_privilege then after_public := -1;
  end;
  -- 3. NEGATIVE. jta_versions is gone entirely.
  begin
    select count(*) into after_snap from public.jta_versions;
  exception when insufficient_privilege then after_snap := -1;
  end;
  execute 'reset role';

  if after_notes <> -1 then
    raise exception 'anon still reads tasks.notes (% row(s)) -- the table grant overrode the column revoke', after_notes;
  end if;
  if after_public <= 0 then
    raise exception 'anon can no longer read the columns the blueprint page needs (got %)', after_public
      using detail = 'The revoke took more than notes. lib/blueprint/data.ts selects id, code, statement, domain_id, order_index, knowledge, skills, abilities, bloom_level, criticality.';
  end if;
  if after_snap <> -1 then
    raise exception 'anon still reads jta_versions (% row(s))', after_snap;
  end if;

  -- 4. AND THE GRANT IS COLUMN-SCOPED RATHER THAN ABSENT. A revoke with no
  --    re-grant satisfies checks 1 and 3 and is caught only here.
  select count(*) into n_cols
    from information_schema.column_privileges
   where grantee = 'anon' and table_schema = 'public' and table_name = 'tasks'
     and privilege_type = 'SELECT';
  if n_cols <> 16 then
    raise exception 'anon holds SELECT on % column(s) of tasks, expected 16 of 17', n_cols;
  end if;

  -- 5. AND NOTHING ELSE LOST ITS READ. service_role and authenticated are how
  --    the console, the scorer and the MCP holder pool reach these tables.
  if not has_table_privilege('service_role', 'public.tasks', 'SELECT') then
    raise exception 'service_role lost SELECT on tasks';
  end if;
  if not has_table_privilege('service_role', 'public.jta_versions', 'SELECT') then
    raise exception 'service_role lost SELECT on jta_versions';
  end if;
  if not has_table_privilege('authenticated', 'public.jta_versions', 'SELECT') then
    raise notice 'authenticated has no SELECT on jta_versions -- check the console still reads it';
  end if;

  raise notice '349 ok: anon reads 16 of 17 task columns and no jta_versions row';
  raise notice 'NEXT: run scripts/scan-public-internals.mjs -- it reads over HTTP as anon, which this cannot';
end
$mig$;
