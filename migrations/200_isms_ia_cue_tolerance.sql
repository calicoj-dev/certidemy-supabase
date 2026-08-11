-- 200_isms_ia_cue_tolerance.sql
--
-- DECLARE THE CUE TOLERANCE THIS BANK WAS BUILT UNDER.
--
-- ISMS-IA generated 912 secure items with KEY_LEN_MARGIN=25 and KEY_LEN_PCT=15
-- set by environment variable. verify-cert then failed the bank on "guard
-- escapes 8.6% (26/303)" - because it carried a HARDCODED COPY of the Level I
-- values, 5 and 10. Measured against 25/15, the bank has zero escapes. Not one
-- of those 26 items was defective; the checker and the generator were simply
-- using different numbers and neither could tell.
--
-- The code fix makes both read this field. This migration supplies it.
--
-- WHY A LEVEL II BANK NEEDS A WIDER MARGIN, AND WHY THIS ONE IS NOT A CUE.
--
-- A Level II option carries a qualifying clause a Level I option does not -
-- "provided the sample is representative of the period under audit" - and the
-- best answer is frequently best BECAUSE of that clause. Stripping it to hit a
-- Level I length target does not remove a cue; it removes the reasoning that
-- makes the option correct.
--
-- The measured distribution across the 304 English secure items:
--
--     key is longest         144 of 304  (47.4%)
--       by 1-20 chars        114
--       by 21-40 chars        30
--       by 41+ chars           0
--     mean margin           13 chars, on options averaging ~200 chars
--     option spread         31 mean, 95 maximum
--
-- Two or three words on a two-hundred-character option, with the key landing in
-- a random position each time. No candidate detects that. The Level I defect
-- this guard was built to catch looked entirely different: the key longest
-- 75-82% of the time because it was written fully while three distractors were
-- thin.
--
-- len_spread_max is set to 100, not the 130 used during generation. The observed
-- maximum spread is 95, so this changes nothing about what generates - it
-- restores a real ceiling in place of a notional one. 130 was set without data.
--
-- REUSABLE BY DESIGN. AIMS-IA (ISO/IEC 42001 Internal Auditor) is next and a
-- Lead Auditor scheme after that. Each declares its tolerance once, here, with
-- its reason - rather than rediscovering the argument, or worse, silently
-- inheriting an environment variable from whoever last ran a script.
--
-- Absent from a blueprint, the code falls back to the Level I defaults, so the
-- nine live certs are unaffected and need no backfill.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. DECLARE. jsonb_set with create_if_missing, so item_model's existing keys
--    (tier, format, scoring, contract, cue_guard) are preserved.
-- ============================================================================

update public.certifications c
set exam_blueprint = jsonb_set(
      c.exam_blueprint,
      '{item_model,cue_tolerance}',
      jsonb_build_object(
        'key_len_margin', 25,
        'key_len_pct',    15,
        'len_spread_max', 100,
        'rationale',      'Level II. The best option is frequently best BECAUSE it carries a qualifying clause the others do not, so a Level I margin (5 chars / 10%) rejects correct items and retains flat ones. Measured over the 304 English secure items at this tolerance: zero guard escapes, mean key margin 13 characters on ~200-character options, no item with the key longest by more than 40 characters, maximum option spread 95. The Level I defect this guard exists to catch presented as the key longest 75-82% of the time against thin distractors; this bank is a different distribution and the tolerance is set to match it.',
        'declared_on',    '2026-08-11',
        'measured_over',  'ISMS-IA secure/en, 304 items, bank_revision v3-l2'
      ),
      true)
where c.code = 'ISMS-IA';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 2. The tolerance is readable and item_model's other keys survived.
select c.code,
       c.exam_blueprint->'item_model'->'cue_tolerance' as cue_tolerance,
       (c.exam_blueprint->'item_model' ? 'contract')   as contract_survived,
       (c.exam_blueprint->'item_model' ? 'cue_guard')  as cue_guard_survived,
       (c.exam_blueprint->'item_model'->>'tier')       as tier
from public.certifications c
where c.code = 'ISMS-IA';

-- 3. No other cert has one, so all nine fall back to the Level I defaults.
--    Expect one row: ISMS-IA.
select c.code, c.exam_blueprint->'item_model'->'cue_tolerance' is not null as declares_tolerance
from public.certifications c
where c.exam_blueprint->'item_model'->'cue_tolerance' is not null
order by c.code;

-- ============================================================================
-- AFTER THIS: re-run verify-cert --cert ISMS-IA. The length-cue check should
-- pass and its detail line should end "[tolerance 25ch/15% from blueprint]".
-- If it still says "from default", the code patch has not been applied.
--
-- And unset the environment overrides before the practice run - the blueprint
-- now carries them, and an env var that duplicates the declaration is a second
-- source of truth waiting to drift:
--
--   Remove-Item Env:\KEY_LEN_MARGIN, Env:\KEY_LEN_PCT, Env:\LEN_SPREAD_MAX
-- ============================================================================
