-- 344_blueprint_publishable.sql
--
-- Make certifications.exam_blueprint safe to serve. Two defects, both of them
-- the blueprint asserting something untrue about itself.
--
-- ============ WHY NOW ============
--
-- exam_blueprint is the only per-certification item rubric that lives in the
-- DATABASE rather than in generator source, so it is what a partner-facing
-- rubric tool would return. Scoped 2026-09-18. Before anything serves it, it
-- must stop making claims that are false.
--
-- ============ DEFECT 1: A FALSE DESCRIPTION OF OUR OWN GUARD ============
--
-- ISMS-IA's item_model.cue_guard ends:
--
--   "The guard tests comparable qualification density across options instead."
--
-- It does not. `auditItem` in scripts/lib/item-cue-guard.mjs compares the key's
-- length in CHARACTERS against the longest distractor, and the spread across
-- all options, plus one absolute-word test. There is no qualification-density
-- measurement anywhere in this repository.
--
-- AIMS-IA's blueprint already says so, in its own cue_guard text: "ISMS-IA's
-- blueprint says it does; that description is wrong and is a known open item."
-- So the platform has carried a known-false self-description and a note about
-- it, in two different rows, rather than a fix.
--
-- THE CORRECT TEXT IS ALREADY IN THE DATABASE, on SM-AI-II, with no
-- cross-reference to anything. So this migration COPIES it rather than retyping
-- it -- derive, never duplicate -- which also repairs AIMS-IA in the same
-- statement, because AIMS-IA's only fault is a trailing sentence about ISMS-IA
-- that goes stale the moment ISMS-IA is fixed. A cross-reference is a second
-- copy of someone else's state.
--
-- ============ DEFECT 2: TWO TOLERANCES ASSERTED UNMEASURED ============
--
-- AIMS-IA and SM-AI-II both carried:
--
--   "status": "PROVISIONAL - NOT YET MEASURED ON THIS BANK"
--   "measured_over": null
--
-- with numbers adopted from ISMS-IA. Both said so honestly, which is why this
-- is a publication defect and not a lie: internally the marker is the record
-- working. Served to a partner it becomes a rubric number with no evidence.
--
-- MEASURED 2026-09-18, with `auditItem` itself rather than a reimplementation
-- of it, over each bank's own secure English approved items:
--
--   cert      items  bank_revision   opt_mean  key_longest  mean_margin  max  spread  escapes  L1_rejects
--   ISMS-IA     304  v3-l2               187      144 (47)         13.1   38      95        0          31
--   AIMS-IA     320  v3-l2               193      146 (46)         13.7   38      87        0          34
--   SM-AI-II    352  v4-smaiii-sec       178      173 (49)         12.9   33      83        0          43
--
-- THE ADOPTION WAS CORRECT AND UNEVIDENCED. All three banks measure the same
-- distribution, so the numbers do not move: this migration changes no
-- tolerance. It replaces "adopted, unmeasured" with the measurement, and a
-- post-condition asserts the three values are IDENTICAL afterwards, because a
-- re-declaration that silently retuned a live guard would be the worse outcome.
--
-- ISMS-IA is re-measured too, though it was never provisional, so all three
-- carry comparable evidence rather than one narrative and two numbers.
--
-- WHICH POPULATION "mean_key_margin" DESCRIBES, because this cost a wrong
-- reading: it is the mean over items where the key IS the longest option, not
-- over all items. Over ALL items the mean is about -2 on every bank -- the key
-- is shorter than the longest distractor about half the time. Both are true;
-- they answer different questions, and ISMS-IA's original declaration meant the
-- first. The keys below are named so the next reader cannot make that mistake.
--
-- STRUCTURED, NOT PROSE. The old rationale blocks were 400-700 character
-- paragraphs carrying numbers inside sentences. The measurement is now separate
-- scalar keys, which is what a rubric consumer can use and what keeps every
-- literal in this file short enough to survive a paste (CLAUDE.md's 42601 note).
-- The one-sentence rationale that remains is the ARGUMENT, which is not data.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  canonical jsonb;
  n         int;
  n_im      int;
  n_t1      int;
  bad       text;
begin

  -- ----------------------------------------------- pre-conditions
  -- The text being copied must actually be the correct one. Copying a
  -- description is only safe if the source has been read.
  select exam_blueprint -> 'item_model' -> 'cue_guard'
    into canonical
    from public.certifications
   where code = 'SM-AI-II';

  if canonical is null then
    raise exception 'SM-AI-II carries no item_model.cue_guard to copy';
  end if;
  if position('Character-based' in (canonical #>> '{}')) = 0 then
    raise exception 'SM-AI-II cue_guard does not describe a character-based guard'
      using detail = 'The text to be copied is not the one this migration was written for.';
  end if;
  if position('qualification density across options' in (canonical #>> '{}')) > 0 then
    raise exception 'SM-AI-II cue_guard makes the false density claim -- nothing here is safe to copy';
  end if;
  if position('ISMS-IA' in (canonical #>> '{}')) > 0 then
    raise exception 'SM-AI-II cue_guard cross-references ISMS-IA; copying it would spread the reference';
  end if;

  -- Exactly three certifications carry item_model, and they are the tier-2 ones.
  select count(*) into n_im
    from public.certifications
   where exam_blueprint ? 'item_model';
  if n_im <> 3 then
    raise exception '% certification(s) carry item_model, expected 3', n_im;
  end if;

  select count(*) into n_t1
    from public.certifications
   where exam_blueprint ? 'item_model' and coalesce(tier, 1) < 2;
  if n_t1 <> 0 then
    raise exception '% tier-1 certification(s) carry item_model', n_t1;
  end if;

  -- ----------------------------------------------- defect 1
  -- One statement repairs both rows: ISMS-IA loses the false sentence, AIMS-IA
  -- loses the cross-reference that described it.
  update public.certifications
     set exam_blueprint = jsonb_set(exam_blueprint, '{item_model,cue_guard}', canonical)
   where code in ('ISMS-IA', 'AIMS-IA');

  -- ----------------------------------------------- defect 2
  -- The numbers are NOT touched. Only the evidence around them.
  update public.certifications
     set exam_blueprint = jsonb_set(
           exam_blueprint,
           '{item_model,cue_tolerance}',
           (exam_blueprint -> 'item_model' -> 'cue_tolerance')
             - 'status'
             - 'rationale'
             || jsonb_build_object(
                  'rationale', 'Level II: the best option is frequently best BECAUSE it carries a qualifying clause the others do not, so the Level I margin rejects correct items and retains flat ones.',
                  'declared_on', '2026-09-18',
                  'measured_over', m.measured_over,
                  'measured_items', m.items,
                  'option_length_mean_chars', m.opt_mean,
                  'key_longest_share_pct', m.key_longest_pct,
                  'mean_key_margin_when_key_longest_chars', m.mean_margin,
                  'max_key_margin_chars', m.max_margin,
                  'max_option_spread_chars', m.max_spread,
                  'guard_escapes_at_this_tolerance', 0,
                  'items_rejected_at_level_i_tolerance', m.l1_rejects,
                  'measurement_method', 'auditItem in scripts/lib/item-cue-guard.mjs, over pool=secure language=en status=approved'
                )
         )
    from (values
            ('ISMS-IA',  'ISMS-IA secure/en, 304 items, bank_revision v3-l2',        304, 187, 47, 13.1, 38, 95, 31),
            ('AIMS-IA',  'AIMS-IA secure/en, 320 items, bank_revision v3-l2',        320, 193, 46, 13.7, 38, 87, 34),
            ('SM-AI-II', 'SM-AI-II secure/en, 352 items, bank_revision v4-smaiii-sec', 352, 178, 49, 12.9, 33, 83, 43)
         ) as m(code, measured_over, items, opt_mean, key_longest_pct, mean_margin, max_margin, max_spread, l1_rejects)
   where public.certifications.code = m.code;

  -- ===================== POST-CONDITIONS =====================

  -- 1. NOTHING ASSERTS AN UNMADE MEASUREMENT. The whole point.
  select string_agg(code, ', ') into bad
    from public.certifications
   where exam_blueprint::text like '%PROVISIONAL%'
      or exam_blueprint::text like '%NOT YET MEASURED%'
      or exam_blueprint -> 'item_model' -> 'cue_tolerance' ? 'status';
  if bad is not null then
    raise exception 'blueprint still asserts a provisional tolerance on: %', bad;
  end if;

  -- 2. AND EVERY DECLARATION NOW CARRIES ITS EVIDENCE. The negative half of 1:
  --    removing the marker without adding the measurement would pass check 1.
  select count(*) into n
    from public.certifications
   where exam_blueprint ? 'item_model'
     and coalesce(exam_blueprint #>> '{item_model,cue_tolerance,measured_over}', '') <> ''
     and coalesce(exam_blueprint #>> '{item_model,cue_tolerance,measured_items}', '') <> '';
  if n <> 3 then
    raise exception 'only % of 3 item_model(s) carry measured_over and measured_items', n;
  end if;

  -- 3. THE FALSE CLAIM IS GONE, PLATFORM-WIDE rather than on one row.
  select string_agg(code, ', ') into bad
    from public.certifications
   where exam_blueprint::text like '%qualification density across options%';
  if bad is not null then
    raise exception 'the false density description survives on: %', bad;
  end if;

  -- 4. AND NO BLUEPRINT DESCRIBES ANOTHER CERTIFICATION'S STATE.
  select string_agg(code, ', ') into bad
    from public.certifications
   where code <> 'ISMS-IA'
     and exam_blueprint #>> '{item_model,cue_guard}' like '%ISMS-IA%';
  if bad is not null then
    raise exception 'a cue_guard description still cross-references ISMS-IA on: %', bad;
  end if;

  -- 5. NEGATIVE HALF, AND THE IMPORTANT ONE: THE GUARD DID NOT MOVE.
  --    A re-declaration that silently retuned a live tolerance is worse than
  --    the provisional marker it replaced.
  select count(*) into n
    from public.certifications
   where exam_blueprint ? 'item_model'
     and (exam_blueprint #>> '{item_model,cue_tolerance,key_len_margin}')::int = 25
     and (exam_blueprint #>> '{item_model,cue_tolerance,key_len_pct}')::int = 15
     and (exam_blueprint #>> '{item_model,cue_tolerance,len_spread_max}')::int = 100;
  if n <> 3 then
    raise exception 'only % of 3 tolerance(s) still read 25/15/100 -- this migration changed a guard', n;
  end if;

  -- 6. NOTHING ELSE MOVED. No cert gained or lost an item_model, no tier-1
  --    blueprint was touched, and the contract text is intact.
  select count(*) into n_im from public.certifications where exam_blueprint ? 'item_model';
  if n_im <> 3 then
    raise exception 'item_model count is now %, expected 3', n_im;
  end if;
  select count(*) into n_t1
    from public.certifications
   where exam_blueprint ? 'item_model' and coalesce(tier, 1) < 2;
  if n_t1 <> 0 then
    raise exception '% tier-1 certification(s) now carry item_model', n_t1;
  end if;
  select count(*) into n
    from public.certifications
   where exam_blueprint ? 'item_model'
     and coalesce(exam_blueprint #>> '{item_model,contract}', '') <> ''
     and coalesce(exam_blueprint #>> '{item_model,format}', '') <> '';
  if n <> 3 then
    raise exception 'only % of 3 item_model(s) still carry contract and format', n;
  end if;

  -- 7. The twelve blueprints that exist still exist.
  select count(*) into n from public.certifications where exam_blueprint is not null;
  if n <> 12 then
    raise exception '% certification(s) carry a blueprint, expected 12', n;
  end if;

  raise notice '344 ok: 3 tolerances measured and declared, 1 false description removed, guard unchanged at 25/15/100';
end
$mig$;
