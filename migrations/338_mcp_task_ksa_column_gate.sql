-- 338_mcp_task_ksa_column_gate.sql
--
-- Gate `ksa_is_provisional` on the COLUMNS, not on the row.
--
-- ============ THE DECISION, AND THE NUMBER THAT MADE IT ============
--
-- `task_translations` carries TWO provisional flags for two different facts.
-- `is_provisional` is about the translated STATEMENT; `ksa_is_provisional` is
-- about the translated knowledge / skills / abilities. They were populated by
-- different passes, which is why they disagree. `mcp.task` filtered only the
-- first, so a translation whose statement was approved served KSAs nobody had
-- reviewed.
--
-- Measured 2026-09-17 over all 1016 rows (scripts/measure-ksa-provisional.mjs):
--
--   A  leave it           1016 statements, 256 rows of unreviewed KSA text
--   B  filter the ROW      604 statements, 412 rows withheld entirely
--   C  filter the COLUMNS 1016 statements, 256 rows lose only their KSA text
--
-- B WAS REJECTED ON ITS OWN NUMBERS. Of the 412 rows it withholds, 156 carry no
-- KSA text at all -- AIMS-IA and ISMS-IA have `ksa_is_provisional = true` on
-- every row and zero KSAs in any of them. B would withhold task statements to
-- protect KSAs that do not exist.
--
-- C is this migration. ISMS-F's Spanish KSAs go dark -- 49 rows, all carrying
-- text -- and that is the accepted cost: they are machine-translated and
-- unreviewed, which is precisely what the column records. A null a partner can
-- see beats text nobody checked.
--
-- ============ AND THE PARTNER HAS TO BE ABLE TO TELL ============
--
-- A null KSA now means one of two different things: never translated, or
-- translated and withheld pending review. This repo has already paid for that
-- confusion once -- `mcp.lesson_index.body_available` exists so "a withheld
-- lesson can be told from an absent one" -- so the view gains `ksa_withheld`
-- alongside the nulls rather than nulling silently.
--
-- The column is added here and NOT yet surfaced by `courseware-read`, which
-- selects named columns and is unaffected. Surfacing it is a separate change
-- that must land AFTER this migration, and it is deliberately not bundled:
-- courseware-read already has an undeployed edit waiting on 337, and adding a
-- second, differently-ordered dependency to the same file is how one of them
-- gets deployed at the wrong time.
--
-- ============ CREATE OR REPLACE, NOT DROP AND CREATE ============
--
-- Every mcp migration since 325 has dropped and recreated, and each one has had
-- to restate the grants and the comment because "A DROP TAKES BOTH, silently"
-- (334's words). `create or replace view` preserves ownership, privileges and
-- comments and only changes the definition -- and a new column is permitted as
-- long as it is appended LAST, which `ksa_withheld` is.
--
-- So this migration restates neither the grants nor the comment, and then
-- ASSERTS both survived, because "preserved by construction" is exactly the
-- kind of claim this repo has been wrong about before.
--
-- ============ IT REQUIRES 337 AND SAYS SO ============
--
-- The `allowed` array is restated here because CREATE OR REPLACE needs the full
-- definition. That makes 338 order-dependent: written for the twelve-cert world
-- 337 creates, it would silently ADMIT ISMS-IA early if run first. So it aborts
-- unless `mcp.certification` already shows twelve including ISMS-IA.
--
-- Deriving the list from `mcp.certification` instead was considered and
-- rejected: it would make `mcp.task` depend on that view, and every widening
-- migration in this family begins with `drop view if exists mcp.certification`,
-- which would then fail -- or be "fixed" with CASCADE, silently dropping
-- mcp.task.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  n          int;
  n_expected int;
  n_stmt     int;
  n_withheld int;
  n_withksa  int;
begin

  -- ------------------------------------------------- pre-conditions
  -- 337 FIRST. Named explicitly rather than inferred from a count, so the
  -- message tells the operator what to do.
  select count(*) into n from mcp.certification where code = 'ISMS-IA';
  if n <> 1 then
    raise exception '338 requires 337: ISMS-IA is not in mcp.certification'
      using detail = 'This migration restates allowed as twelve certifications.',
            hint   = 'Run 337_mcp_admit_isms_ia.sql first.';
  end if;
  select count(*) into n from mcp.certification;
  if n <> array_length(allowed, 1) then
    raise exception 'mcp.certification shows % certification(s), this migration assumes %',
      n, array_length(allowed, 1)
      using hint = 'The allowed array here has drifted from the live views.';
  end if;

  -- The column has to exist before anything is gated on it.
  select count(*) into n
    from information_schema.columns
   where table_schema = 'public' and table_name = 'task_translations'
     and column_name = 'ksa_is_provisional';
  if n <> 1 then
    raise exception 'public.task_translations has no ksa_is_provisional column';
  end if;

  -- BASELINE, TAKEN BEFORE THE CHANGE. Post-condition 1 compares against this
  -- rather than against a literal, because a literal 1016 copied out of a
  -- report is exactly how 328's first run aborted on a stale `4`.
  select count(*) into n_expected
    from public.task_translations tt
    join public.tasks t          on t.id = tt.task_id
    join public.certifications c on c.id = t.certification_id
   where tt.is_provisional = false
     and tt.review_status = 'approved'
     and c.code = any (allowed);
  raise notice 'baseline: % approved non-English task rows', n_expected;

  -- And how many of those carry unreviewed KSA TEXT, which is what C withholds.
  select count(*) into n_withksa
    from public.task_translations tt
    join public.tasks t          on t.id = tt.task_id
    join public.certifications c on c.id = t.certification_id
   where tt.is_provisional = false
     and tt.review_status = 'approved'
     and c.code = any (allowed)
     and tt.ksa_is_provisional = true
     and (coalesce(btrim(tt.knowledge), '') <> ''
       or coalesce(btrim(tt.skills), '')    <> ''
       or coalesce(btrim(tt.abilities), '') <> '');
  raise notice 'baseline: % row(s) carry unreviewed KSA text', n_withksa;

  -- ------------------------------------------------- the view
  --
  -- `ksa_withheld` is appended LAST, which is what CREATE OR REPLACE permits.
  -- The English branch is never withheld: `tasks` has no provisional concept,
  -- and the KSAs there are the source rather than a translation of it.
  execute format($ddl$
    create or replace view mcp.task
    with (security_barrier = true) as
    select c.code as certification,
           d.code as domain_code, d.title as domain_title,
           false as domain_title_is_fallback,
           d.weight_pct as domain_weight_pct, d.order_index as domain_order,
           t.code as task_code, 'en'::text as language,
           t.statement, t.knowledge, t.skills, t.abilities,
           t.bloom_level, t.is_exam_scope, t.scope_tag,
           t.order_index as task_order,
           false as ksa_withheld
      from public.tasks t
      join public.domains d        on d.id = t.domain_id
      join public.certifications c on c.id = t.certification_id
     where c.code = any (%L::text[])
    union all
    select c.code as certification,
           d.code as domain_code,
           coalesce(dt.title, d.title) as domain_title,
           dt.title is null as domain_title_is_fallback,
           d.weight_pct as domain_weight_pct, d.order_index as domain_order,
           t.code as task_code, tt.language,
           tt.statement,
           case when tt.ksa_is_provisional then null else tt.knowledge end,
           case when tt.ksa_is_provisional then null else tt.skills    end,
           case when tt.ksa_is_provisional then null else tt.abilities end,
           t.bloom_level, t.is_exam_scope, t.scope_tag,
           t.order_index as task_order,
           coalesce(tt.ksa_is_provisional, false) as ksa_withheld
      from public.tasks t
      join public.domains d        on d.id = t.domain_id
      join public.certifications c on c.id = t.certification_id
      join public.task_translations tt
        on tt.task_id = t.id and tt.is_provisional = false
       and tt.review_status = 'approved'
      left join public.domain_translations dt
        on dt.domain_id = d.id and dt.language = tt.language
       and dt.is_provisional = false and dt.review_status = 'approved'
     where c.code = any (%L::text[])
  $ddl$, allowed, allowed);

  -- ===================== POST-CONDITIONS =====================
  --
  -- BOTH HALVES, because C's whole claim is that one thing changed and one
  -- thing did not. Asserting only the withholding would pass on a migration
  -- that had also taken every statement down.

  -- 1. THE STATEMENTS ARE UNCHANGED. Derived from the baseline above, never a
  --    literal, so the assertion cannot disagree with the view by construction.
  select count(*) into n_stmt from mcp.task where language <> 'en';
  if n_stmt <> n_expected then
    raise exception 'mcp.task serves % non-English row(s), expected % -- statements moved',
      n_stmt, n_expected;
  end if;
  select count(*) into n from mcp.task where language <> 'en' and btrim(coalesce(statement, '')) = '';
  if n <> 0 then
    raise exception '% non-English row(s) now serve an empty statement', n;
  end if;
  raise notice 'ok: % non-English statements served, unchanged', n_stmt;

  -- 2. NO UNREVIEWED KSA TEXT IS REACHABLE. The half the decision was about.
  select count(*) into n
    from mcp.task
   where ksa_withheld
     and (coalesce(btrim(knowledge), '')  <> ''
       or coalesce(btrim(skills), '')     <> ''
       or coalesce(btrim(abilities), '')  <> '');
  if n <> 0 then
    raise exception '% withheld row(s) still expose KSA text', n
      using hint = 'The case expressions did not take.';
  end if;
  raise notice 'ok: no unreviewed KSA text reachable';

  -- 3. AND THE WITHHOLDING ACTUALLY HAPPENED, which check 2 cannot tell on its
  --    own: a view returning no rows at all would satisfy it. This is the
  --    positive half, derived from the same baseline.
  select count(*) into n_withheld from mcp.task where language <> 'en' and ksa_withheld;
  if n_withheld < n_withksa then
    raise exception 'only % row(s) marked withheld, expected at least % carrying KSA text',
      n_withheld, n_withksa;
  end if;
  raise notice 'ok: % row(s) marked ksa_withheld, of which % carried text', n_withheld, n_withksa;

  -- 4. KSA TEXT STILL SERVES WHERE IT WAS REVIEWED. The other direction again:
  --    a migration that nulled every KSA would pass 1, 2 and 3.
  select count(*) into n
    from mcp.task
   where language <> 'en'
     and not ksa_withheld
     and (coalesce(btrim(knowledge), '')  <> ''
       or coalesce(btrim(skills), '')     <> ''
       or coalesce(btrim(abilities), '')  <> '');
  if n = 0 then
    raise exception 'no non-English row serves any KSA text -- C has become B'
      using detail = 'Every translated KSA is now withheld, which is not what was decided.';
  end if;
  raise notice 'ok: % non-English row(s) still serve reviewed KSA text', n;

  -- 5. ENGLISH IS NEVER WITHHELD. `tasks` has no provisional concept and its
  --    KSAs are the source, not a translation of it.
  select count(*) into n from mcp.task where language = 'en' and ksa_withheld;
  if n <> 0 then
    raise exception '% English row(s) are marked withheld', n;
  end if;

  -- 6. CREATE OR REPLACE PRESERVED THE GRANTS AND THE COMMENT. Restating them
  --    was skipped on the strength of that, so it is asserted rather than
  --    assumed -- "A DROP TAKES BOTH, silently" is 334's warning and this
  --    migration is claiming the opposite about a different statement.
  if not has_table_privilege('mcp_reader', 'mcp.task', 'SELECT') then
    raise exception 'mcp_reader lost SELECT on mcp.task';
  end if;
  if not has_table_privilege('mcp_holder', 'mcp.task', 'SELECT') then
    raise exception 'mcp_holder lost SELECT on mcp.task';
  end if;
  if obj_description('mcp.task'::regclass, 'pg_class') is null then
    raise exception 'mcp.task lost its comment';
  end if;

  -- 7. AND THE PAYWALL IS UNTOUCHED, since this migration had no business near
  --    mcp.lesson and a check that says so is cheaper than trusting that.
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;

  raise notice '338 ok: statements unchanged, unreviewed KSAs withheld by column';
end
$mig$;
