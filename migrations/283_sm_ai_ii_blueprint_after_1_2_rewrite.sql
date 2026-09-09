-- 283_sm_ai_ii_blueprint_after_1_2_rewrite.sql
--
-- Re-derives SM-AI-II's exam_blueprint after task 1.2 moved 3_apply -> 4_analyze.
--
-- WHY A NEW FILE AND NOT A RE-RUN OF 278. Migration 278 is guarded by
-- `exam_blueprint is null`. That guard made it idempotent and now makes it
-- INERT: a re-run reports 0 rows and the blueprint keeps the pre-rewrite
-- profile while verify-cert.mjs invariant 17 fails on both levels. The guard
-- is correct; it just cannot be the update path.
--
-- NOTHING IN THIS FILE STATES A PERCENTAGE. cognitive_profile and task_counts
-- are built by jsonb_object_agg directly from public.v_cognitive_profile, the
-- same view verify-cert.mjs:445 checks the stored blueprint against. Invariant
-- 17 therefore holds BY CONSTRUCTION, exactly as in 278: the blueprint is the
-- view, so the two cannot disagree. Same rule as 190's header -- "a hand-typed
-- number is a second declaration reconciled with nothing."
--
-- WHY THE MERGE RATHER THAN A REBUILD. `||` on jsonb is a shallow merge, so
-- only the three named top-level keys move. item_model (including its
-- cue_tolerance, contract and cue_guard), assembly, basis, derived_from,
-- difficulty_mix, difficulty_note and version survive untouched. Retyping the
-- whole object to change two keys is how the cue_tolerance numbers would get
-- lost, and scripts/lib/item-cue-guard.mjs:138-153 falls back PER KEY while
-- still reporting source: "blueprint" -- so a dropped key is invisible in the
-- output. See 278's header.
--
-- WHY computed_at MOVES. 278: "computed_at and version ARE read:
-- render-asset/index.ts:654-655 emits them into four asset payloads, and
-- computed_at is part of the asset cache identity." Leaving it at 2026-09-03
-- would serve cached assets carrying the old profile against a blueprint that
-- no longer holds it. It is the one date in this file and it is deliberate.
--
-- THE GUARD IS A PROPERTY, NOT A COUNT. `exists (... 1.2 is 4_analyze)` names
-- the thing the task update was supposed to do. A count guard on tasks = 28
-- would abort falsely the moment any unrelated task moved, which is the
-- failure mode CLAUDE.md records as more common than the catch.
--
-- Idempotent: the values are recomputed from the view, so a second run writes
-- the same object and reports 1 row. Run before the task update, it writes
-- nothing -- the guard does not match.
--
-- APPLIED 2026-09-09. Verified: stored equals live at 3_apply 36.28 /
-- 4_analyze 63.72, drift 0.00 on both, full outer join so a key present on one
-- side only would surface as a failure rather than as a silent non-match.
-- task_counts 16 / 28. item_model.cue_tolerance, item_model.contract and
-- difficulty_mix all confirmed present after the merge, top-level key count
-- unchanged at 10.
--
-- Run in the Supabase SQL editor. One statement.

update public.certifications c
set exam_blueprint = c.exam_blueprint || jsonb_build_object(
  'cognitive_profile', (
    select jsonb_object_agg(v.bloom_level, v.pct_of_form)
    from public.v_cognitive_profile v
    where v.certification_id = c.id
  ),
  'task_counts', (
    select jsonb_object_agg(v.bloom_level, v.tasks)
    from public.v_cognitive_profile v
    where v.certification_id = c.id
  ),
  'computed_at', '2026-09-09'
)
where c.code = 'SM-AI-II'
  and exists (
    select 1 from public.tasks t
    where t.certification_id = c.id
      and t.code = '1.2'
      and t.bloom_level = '4_analyze'
  );

-- ============================================================================
-- PROOF. Invariant 17 by hand, mirroring verify-cert.mjs:445-465.
--    FULL OUTER JOIN is deliberate: the invariant takes the UNION of keys, so
--    a level present on one side only must surface as a row rather than be
--    dropped by an inner join. Expect exactly two rows, 3_apply and
--    4_analyze, drift 0.00 on both, and no null on either side.
-- ============================================================================

select coalesce(s.key, l.bloom_level)              as bloom,
       (s.value)::numeric                          as blueprint_says,
       l.pct_of_form                               as tasks_say,
       abs((s.value)::numeric - l.pct_of_form)     as drift
from (
  select key, value
  from public.certifications c,
       jsonb_each_text(c.exam_blueprint->'cognitive_profile')
  where c.code = 'SM-AI-II'
) s
full outer join public.v_cognitive_profile l
  on l.bloom_level = s.key
 and l.certification_id = (select id from public.certifications where code = 'SM-AI-II')
order by 1;

-- PROOF 2. The shallow merge preserved everything it was supposed to.
--    Expect true on all four and 10 top-level keys.
select (c.exam_blueprint->'item_model') ? 'cue_tolerance' as cue_tolerance_survived,
       (c.exam_blueprint->'item_model') ? 'contract'      as contract_survived,
       (c.exam_blueprint->'item_model') ? 'cue_guard'     as cue_guard_survived,
       c.exam_blueprint ? 'difficulty_mix'                as difficulty_mix_survived,
       (select count(*) from jsonb_object_keys(c.exam_blueprint)) as top_level_keys,
       c.exam_blueprint->'task_counts'                    as task_counts,
       c.exam_blueprint->>'computed_at'                   as computed_at
from public.certifications c
where c.code = 'SM-AI-II';
