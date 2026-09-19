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
  update public.certifications
     set exam_blueprint = jsonb_set(
           exam_blueprint,
           '{item_model,cue_tolerance,measurement_method}',
           to_jsonb('Every secure item in this language, approved and not retired, measured with the same character-based cue guard the generator applies before an item is accepted.'::text)
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

  raise notice '348 ok: % blueprint(s) rewritten, no repository internals on a public column', n_before;
end
$mig$;
