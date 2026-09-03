-- 278_sm_ai_ii_exam_blueprint.sql
--
-- SM-AI-II exam_blueprint. Written AFTER the tasks landed, FROM the computed
-- profile. Migration 277 deliberately left it NULL for this reason.
--
-- NOTHING IN THIS FILE STATES A PERCENTAGE. cognitive_profile and task_counts
-- are built by jsonb_object_agg directly from public.v_cognitive_profile, which
-- is the same view verify-cert.mjs:445 checks the published blueprint against.
-- Invariant 17 therefore holds BY CONSTRUCTION rather than by inspection: the
-- blueprint is the view, so the two cannot disagree.
--
-- This is 190's construction (ISMS-IA), not 205's (AIMS-IA). 205 pasted a
-- literal computed from the locked JTA before any row existed, then added a
-- proof block to recompute the profile and demand it match, headed "IF THIS
-- DISAGREES WITH THE BLUEPRINT, STOP". That check is only necessary because the
-- blueprint was written first. 190's header states the rule: "a hand-typed
-- number is a second declaration reconciled with nothing." Same rule that kept
-- bloom_distribution out of content/sm-ai-ii/cert.yml.
--
-- RECOMMENDED ORDER FOR EVERY SUBSEQUENT TIER-2 BUILD: cert row -> ingest the
-- spine -> compute the profile -> write the blueprint from it.
--
-- APPLIED 2026-09-03. Verified: stored equals live at 3_apply 38.51 /
-- 4_analyze 61.49, drift 0.00 on both, full outer join so a key present on one
-- side only would surface as a failure rather than as a silent non-match.
--
-- Idempotent via `exam_blueprint is null`: a second run reports 0 rows.
--
-- ---------------------------------------------------------------------------
-- WHY ALL THREE cue_tolerance NUMBERS ARE WRITTEN
--
-- scripts/lib/item-cue-guard.mjs:138-155 falls back PER KEY, not all-or-nothing:
--
--   LEN_SPREAD_MAX: int(t.len_spread_max, CUE_CFG.LEN_SPREAD_MAX),
--   KEY_LEN_MARGIN: int(t.key_len_margin, CUE_CFG.KEY_LEN_MARGIN),
--   KEY_LEN_PCT:    int(t.key_len_pct,    CUE_CFG.KEY_LEN_PCT),
--   source: "blueprint",
--
-- A tolerance object missing one key silently applies the Level I default for
-- that key (spread 70 / margin 5 / pct 10) while STILL REPORTING
-- source: "blueprint". Nothing validates, nothing clamps -- int() accepts zero
-- and negatives, and a non-numeric string becomes the Level I default. At Level
-- I the margin catches a key that is longest because the distractors are thin;
-- at Level II the key is frequently longest BECAUSE it carries the qualifying
-- clause that makes it best, so the Level I value rejects correct items and
-- retains flat ones. The failure is invisible in the output.
--
-- OPERATIONAL CHECK (200's closing note): the generator prints
--   Cue tolerance: 25ch / 15% / spread 100 (blueprint)
-- and verify-cert's length-cue detail ends "[tolerance 25ch/15% from
-- blueprint]". If either says "default", this migration did not take effect.
--
-- ---------------------------------------------------------------------------
-- THREE THINGS RECORDED RATHER THAN QUIETLY RESOLVED
--
-- 1. ISMS-IA declares len_spread_max 100, but HANDOFF-v6.5 records its bank
--    actually generated at 130 via env override -- the log would have read
--    "blueprint+env(LEN_SPREAD_MAX)". The declared value is NOT what produced
--    that bank. 100 is carried here to match both Level II siblings; the
--    discrepancy is named in the rationale rather than silently picked.
--
-- 2. item_model.cue_guard uses AIMS-IA's ACCURATE wording. ISMS-IA's live text
--    claims the guard "tests comparable qualification density across options" --
--    a control that has never existed. Nothing reads this key, which is exactly
--    why the wrong description survived. ISMS-IA's row is owed a correction.
--
-- 3. difficulty_mix is INERT in the {easy,moderate,hard} form. Confirmed:
--    generate-mock-exam:213 reads it, but pickByMix does
--    Object.keys(mix).map(Number).filter(Number.isFinite), so word keys yield
--    zero finite levels and it falls through to a hardcoded 30/50/20 -- which
--    happens to equal what is declared. Carried for consistency with both
--    siblings and labelled inert, because a key that looks operative and is not
--    is worse than one that is absent.
--
-- task_counts is documentation only. functions/_shared/blueprint.ts:65 and
-- render-asset:1075 both refuse it by name -- "LIVE task counts, never
-- exam_blueprint.task_counts". It is written because both siblings carry it.
--
-- computed_at and version ARE read: render-asset/index.ts:654-655 emits them
-- into four asset payloads, and computed_at is part of the asset cache identity.
--
-- Run in the Supabase SQL editor. One statement.

update public.certifications c
set exam_blueprint = jsonb_build_object(
  'version', '2.0',
  'basis', 'Certidemy Cognitive Model v2.0: an item''s cognitive level EQUALS its task''s declared level, so the form''s profile is a computed consequence of the JTA, not a target asserted over it.',
  'assembly', jsonb_build_object(
    'sample_by', 'domain weight_pct, then across tasks within each domain',
    'balance',   'difficulty spread within each task''s items',
    'cognition', 'follows automatically: every item carries its task''s bloom_level, so a domain-proportional draw reproduces cognitive_profile without needing to enforce it'
  ),
  'item_model', jsonb_build_object(
    'tier',     'II',
    'format',   'single best answer among four defensible options',
    'scoring',  'dichotomous - one key, no partial credit',
    'contract', 'All four options are defensible on the facts given. The best answer must be better than the second-best for a reason a competent practitioner could state in one sentence; the second-best must be genuinely defensible rather than merely wrong. An item whose second choice is incorrect is a Level I item in the wrong bank.',
    'cue_guard', 'Character-based. The guard measures the key''s length against the longest distractor, and the spread across all options, in CHARACTERS, applying the tolerance declared in cue_tolerance. It does NOT measure qualification density. ISMS-IA''s blueprint says it does; that description is wrong and is a known open item.',
    'cue_tolerance', jsonb_build_object(
      'status',         'PROVISIONAL - NOT YET MEASURED ON THIS BANK',
      'rationale',      'Level II. The best option is frequently best BECAUSE it carries a qualifying clause the others do not, so the Level I default (5 chars / 10 pct) rejects correct items and retains flat ones. All three numeric keys are written deliberately: cueConfigFor falls back PER KEY, so an object missing one silently applies the Level I value for that key while still reporting source: blueprint. These three numbers are ISMS-IA''s, adopted unmeasured as a starting point ONLY - they are NOT evidence for this bank. NOTE: HANDOFF-v6.5 records ISMS-IA generation actually running at len_spread_max 130 via env override, not the 100 its blueprint declares, so the declared value is not what produced that bank. 100 is carried here to match both Level II siblings; the discrepancy is recorded rather than silently resolved. Re-measure over SM-AI-II secure/en once the bank exists and re-declare with measured_over populated.',
      'declared_on',    '2026-09-03',
      'key_len_margin', 25,
      'key_len_pct',    15,
      'len_spread_max', 100,
      'measured_over',  null::text
    ),
    'grounding_note', 'BEFORE STAGE 9: scripts/lib/item-grounding.mjs has no SCRUM entry, so this certification resolves to NEUTRAL - no edition set and no never-assert list. SM-AI-II_JTA_v1.2 section 7 holds the 26 never-assert entries, four labelled [derived], plus the paired-error rule. Separately, scripts/lib/item-profile.mjs routes profileFor() on the certification NAME via /\\bscrum\\b/ and does not read tier, so this cert would inherit SM-AI-I''s Level I profile. Both must be fixed before any item is generated.'
  ),
  'computed_at',  '2026-09-03',
  'derived_from', 'tasks.bloom_level x domains.weight_pct over exam-scope tasks (see public.v_cognitive_profile)',
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
  'difficulty_mix', jsonb_build_object('easy', 30, 'moderate', 50, 'hard', 20),
  'difficulty_note', 'Difficulty is orthogonal to cognitive level. An easy Analyze item and a hard Analyze item are both Analyze items. Items are made harder by subtler content, closer distractors, or less familiar situations - NEVER by raising the cognitive level. NOTE: generate-mock-exam:213 reads difficulty_mix but pickByMix requires NUMERIC keys, so this easy/moderate/hard form yields zero finite levels and falls through to the hardcoded 30/50/20 - which happens to match. Inert in this form, carried for consistency with both Level II siblings.'
)
where c.code = 'SM-AI-II'
  and c.exam_blueprint is null;

-- ============================================================================
-- PROOF 1. Blueprint written, all three tolerance keys present as numbers.
select
  c.exam_blueprint -> 'cognitive_profile' as profile,
  c.exam_blueprint -> 'task_counts'       as counts,
  c.exam_blueprint -> 'item_model' -> 'cue_tolerance' as cue_tolerance,
  c.exam_blueprint ->> 'computed_at'      as computed_at,
  c.exam_blueprint ->> 'version'          as version
from public.certifications c
where c.code = 'SM-AI-II';

-- PROOF 2. INVARIANT 17 BY HAND, mirroring verify-cert.mjs:445-465.
--    FULL OUTER JOIN is deliberate: the invariant takes the UNION of keys and
--    compares a missing one against zero, so a level present on one side only
--    must surface as FAIL rather than as a row that quietly does not match.
--    Expect two rows, drift 0.00, verdict ok. Actual on 2026-09-03: exactly that.
with stored as (
  select key as bloom, value::numeric as pct
  from public.certifications c,
       jsonb_each_text(c.exam_blueprint -> 'cognitive_profile')
  where c.code = 'SM-AI-II'
),
live as (
  select v.bloom_level::text as bloom, v.pct_of_form as pct
  from public.v_cognitive_profile v
  where v.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
)
select coalesce(s.bloom, l.bloom) as bloom,
       s.pct as stored, l.pct as live,
       abs(coalesce(s.pct,0) - coalesce(l.pct,0)) as drift,
       case when abs(coalesce(s.pct,0) - coalesce(l.pct,0)) > 0.02
            then 'FAIL' else 'ok' end as verdict
from stored s
full outer join live l on l.bloom = s.bloom
order by bloom;

-- ============================================================================
-- STILL OPEN. exam_blueprint is now non-null, so 277's publication gate is
-- cleared -- but status must NOT leave 'draft' yet. Remaining before Stage 12:
--
--   - jta_versions row, published, projected from the live rows. Owed since
--     v5.5; CERT-PUBLISH-CHECKLIST still has no step for it and ten certs have
--     each rediscovered it separately.
--   - SCHEME-SM-AI-II.md, including the minimally-competent-candidate
--     definition (§7). Write the MCC BEFORE lesson authoring: it describes what
--     the borderline candidate gets wrong, which is the raw material for Level
--     II distractors and an input to the SCRUM grounding entry, not just a
--     standard-setting document.
--   - SCRUM grounding entry + item-profile tier routing (see grounding_note).
--   - Tier-2 generation constants as code defaults, owed since v6.5.
--   - Stage 7: 44 lessons. Stage 9: 1,056 secure + 1,320 practice at the floors.
--   - trg_guard_cert_has_active_achievement fires BEFORE INSERT OR UPDATE OF
--     status on certifications. An active achievement row is required before
--     this cert can leave 'draft'. Not in CERT-PUBLISH-CHECKLIST.
--
-- End of 278.
