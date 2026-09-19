-- 348_blueprint_measurement_method.sql
--
-- Take a repository path out of a column anon reads. Mine, from 344.
--
-- ============ WHAT 344 WROTE ============
--
-- 344 replaced two provisional cue-tolerance declarations with the measurement,
-- and added a `measurement_method` field describing how it was taken:
--
--   "auditItem in scripts/lib/item-cue-guard.mjs, over pool=secure
--    language=en status=approved"
--
-- `certifications.exam_blueprint` is readable by anon for any certification not
-- in 'draft'. So that sentence put an internal source path on a public surface,
-- on all three tier-2 certifications, and `verify-cert` §12 "Blueprint names no
-- repository internals" has been failing on it since.
--
-- ============ AND IT WAS ALREADY WRONG TWICE OVER ============
--
-- The path moved four days later: the item rules were consolidated into
-- `functions/_shared/item-rules/` so the edge runtime could read them. So the
-- field named an internal file AND named it at an address that no longer
-- exists -- a partner reading it would learn nothing true.
--
-- THE IRONY IS THE POINT AND IS WHY THIS IS A MIGRATION RATHER THAN A QUIET
-- EDIT. Two days after 344, the same author scanned every assembled rubric
-- payload for exactly this -- internal paths, migration numbers, defect
-- narration -- found three migration references in the Scrum grounding and
-- rewrote them in source rather than filtering at serve time. That scan covered
-- the PROMPT surface and never looked at `exam_blueprint`, which is the other
-- thing a partner reads and the one the same author had written into by hand.
--
-- A leak audit is only as wide as the surfaces it enumerates, and the surface
-- you just edited is the easiest one to leave off the list.
--
-- ============ WHAT REPLACES IT ============
--
-- The METHOD, described in terms a reader outside this repository can use: what
-- was measured, over what population. No file, no function name, no path. The
-- three numeric keys 344 added -- measured_items, mean_key_margin_when_key_
-- longest_chars and the rest -- already carry the substance; this field only
-- ever needed to say what population they were taken over.
--
-- ============ AND ITS OWN POST-CONDITION FOUND MORE ============
--
-- The first version rewrote `measurement_method` and aborted on its own check:
-- `measured_over` carries "ISMS-IA secure/en, 304 items, bank_revision v3-l2",
-- and `bank_revision` is an internal column name with a tag that means nothing
-- to a reader outside this repository. Also 344's. Both are rewritten here.
--
-- A full scan then found this was the smaller half. scan-public-internals.mjs
-- reads every table anon holds SELECT on, AS anon, and reports 106 genuine hits
-- across THREE columns -- exam_blueprint (12, all mine), tasks.notes (36) and
-- jta_versions.blueprint_snapshot (58). The other two are named in the
-- post-conditions with their counts and with why neither is a text rewrite.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_before int;
  n_after  int;
  n_paths  int;
  n_keys   int;
begin

  -- ----------------------------------------------- pre-conditions
  select count(*) into n_before
    from public.certifications
   where exam_blueprint #>> '{item_model,cue_tolerance,measurement_method}' like '%scripts/%';
  if n_before = 0 then
    raise exception 'no blueprint names a scripts/ path -- already fixed, or the field moved'
      using hint = 'Check exam_blueprint before re-running; this migration has nothing to do.';
  end if;
  raise notice '% blueprint(s) name a repository path', n_before;

  -- ----------------------------------------------- the rewrite
  -- TWO FIELDS, not one. The first version fixed `measurement_method` and its
  -- own post-condition caught `measured_over` carrying `bank_revision v3-l2` --
  -- an internal column name and a revision tag that mean nothing outside this
  -- repository. Both were written by 344; narrowing the check to pass on the
  -- field I already knew about would have been the same failure again.
  update public.certifications
     set exam_blueprint = jsonb_set(
           jsonb_set(
             exam_blueprint,
             '{item_model,cue_tolerance,measurement_method}',
             to_jsonb('Every secure item in this language, approved and not retired, measured with the same character-based cue guard the generator applies before an item is accepted.'::text)
           ),
           '{item_model,cue_tolerance,measured_over}',
           to_jsonb(
             (exam_blueprint #>> '{item_model,cue_tolerance,measured_items}') ||
             ' secure items in English on this certification'
           )
         )
   where exam_blueprint ? 'item_model';

  -- ===================== POST-CONDITIONS =====================

  -- 1. POSITIVE. No blueprint names a repository path, and the check is over
  --    EVERY certification rather than the three this touched -- a leak audit
  --    scoped to the rows you edited is the mistake that produced this one.
  select count(*) into n_paths
    from public.certifications
   where exam_blueprint::text ~ '(scripts|functions|migrations)/[a-z0-9_./-]+\.(mjs|ts|sql)';
  if n_paths <> 0 then
    raise exception '% blueprint(s) still name a repository path', n_paths;
  end if;

  -- 2. AND NO OTHER INTERNAL SHAPE EITHER, since the same column could carry a
  --    migration number or a defect narration just as easily. Checked here
  --    rather than trusted, because nothing else looks at this column.
  select count(*) into n_paths
    from public.certifications
   where exam_blueprint::text ~* '(migration [0-9]{2,3}|CLAUDE\.md|verify-cert|auditItem|bank_revision v)';
  if n_paths <> 0 then
    raise exception '% blueprint(s) name another repository internal', n_paths;
  end if;

  -- 3. NEGATIVE. The measurement itself survived. A rewrite that emptied the
  --    tolerance block would satisfy both checks above.
  select count(*) into n_after
    from public.certifications
   where exam_blueprint ? 'item_model'
     and coalesce(exam_blueprint #>> '{item_model,cue_tolerance,measured_over}', '') <> ''
     and coalesce(exam_blueprint #>> '{item_model,cue_tolerance,measurement_method}', '') <> ''
     and (exam_blueprint #>> '{item_model,cue_tolerance,key_len_margin}')::int = 25
     and (exam_blueprint #>> '{item_model,cue_tolerance,key_len_pct}')::int = 15
     and (exam_blueprint #>> '{item_model,cue_tolerance,len_spread_max}')::int = 100;
  if n_after <> 3 then
    raise exception 'only % of 3 item_model(s) still carry a complete measured tolerance', n_after;
  end if;

  -- 4. NEGATIVE. Nothing outside item_model moved.
  select count(*) into n_keys
    from public.certifications
   where exam_blueprint is not null
     and exam_blueprint ? 'cognitive_profile' and exam_blueprint ? 'difficulty_mix';
  if n_keys <> 12 then
    raise exception '% blueprint(s) carry cognitive_profile and difficulty_mix, expected 12', n_keys;
  end if;

  -- 5. THE SURFACES THIS DOES NOT FIX, NAMED WITH THEIR COUNTS.
  --
  -- `scripts/scan-public-internals.mjs` reads every table anon holds SELECT on,
  -- AS anon, and found 106 genuine hits across THREE columns. This migration
  -- fixes one. Reporting the other two here rather than leaving them to a note
  -- is the whole lesson: a leak audit is as wide as its list, and a migration
  -- that silently fixes its own column re-creates that.
  --
  -- NEITHER IS A TEXT REWRITE, which is why they are not in this statement:
  --
  --   tasks.notes -- 63 rows anon can read, 18 naming a migration ("Rebuilt by
  --     migration 104 after the 6666 UUID collision"). The CONTENT is correct
  --     and internal; the defect is that anon can read the column at all.
  --     Nothing public reads it. The fix is a column-scoped grant, and
  --     CLAUDE.md warns that a table-wide GRANT SELECT silently overrides a
  --     column-level REVOKE -- so it needs its own migration naming every
  --     column anon KEEPS.
  --
  --   jta_versions.blueprint_snapshot -- 52 migration numbers and 6 source
  --     paths across 13 snapshots. A SNAPSHOT IS EVIDENCE: rewriting it
  --     destroys the record of what the JTA was, which is the thing it exists
  --     to preserve. Only the console reads it, authenticated. The fix is to
  --     take anon off the table, not to edit history.
  select count(*) into n_paths from public.tasks
   where notes ~* 'migration [0-9]{2,3}';
  raise notice 'NOT FIXED HERE: tasks.notes names a migration on % row(s) -- needs a column-scoped grant', n_paths;
  select count(*) into n_paths from public.jta_versions
   where blueprint_snapshot::text ~* '(migration [0-9]{2,3}|scripts/)';
  raise notice 'NOT FIXED HERE: jta_versions.blueprint_snapshot on % row(s) -- a snapshot is evidence; revoke anon, do not edit', n_paths;

  raise notice '348 ok: % blueprint(s) rewritten, exam_blueprint clean', n_before;
end
$mig$;
