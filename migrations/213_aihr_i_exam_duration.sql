-- 213_aihr_i_exam_duration.sql
--
-- AIHR-I exam duration - 50 minutes to 60, meeting the Tier I floor.
--
-- FOUND BY the exam-duration invariant added to verify-cert.mjs alongside
-- migration 212. AIHR-I was the only certification in the catalogue below its
-- tier floor:
--
--   FAIL  Minutes per item at or above the tier floor
--         1.25 min/item is below the tier 1 floor of 1.50
--
-- ============================================================================
-- WHY THIS IS A DEFECT AND NOT A TUNED CHOICE
-- ============================================================================
--
-- A tighter form could be deliberate if its items were shorter. They are not.
-- Measured across the three Tier I certifications that run 40 items, secure
-- pool, mean characters of stem plus options:
--
--                  en      es-419    minutes   min/item
--   AIHR-I         745     896       50        1.25
--   AIMS-F         726     862       60        1.50
--   ISMS-F         685     806       60        1.50
--
-- AIHR-I's items are the LONGEST of the three and it gave the LEAST time. A
-- Spanish-language candidate was reading 11% more than ISMS-F's candidate in
-- 17% less time. Nothing about the scheme justifies that, and its subject -
-- judgement about legal exposure in employment decisions - is the last place to
-- rush a candidate.
--
-- ============================================================================
-- WHY 60 AND NOT A MEASURED NUMBER
-- ============================================================================
--
-- COGNITIVE-MODEL section 5 says the tier gives a base and measurement on the
-- built bank adjusts it upward. Applying that literally here would suggest 62
-- to 67 minutes, depending on which sibling supplies the reference rate.
--
-- That precision would be false. ISMS-F and AIMS-F both sit at exactly 60
-- minutes despite a 7% difference in item length, which means Tier I durations
-- across this catalogue were set by TIER CONVENTION and never measured. There
-- is no reference rate to derive from - the two siblings imply 537 and 575
-- chars/minute, and neither figure was ever chosen.
--
-- So the honest correction is the tier base: 40 items x 1.50 = 60 minutes. That
-- fixes the defect, matches both siblings exactly, and does not pretend to a
-- measurement that the Tier I catalogue has not yet had.
--
-- SEPARATE FOLLOW-UP, recorded not done: Tier I durations across all eight
-- Tier I certifications deserve the same measurement AIMS-IA and ISMS-IA got.
-- AIHR-I's items being longest of its cohort suggests the 1.50 base may be
-- tight for scenario-heavy schemes generally. That is a catalogue-wide pass,
-- not a fix to smuggle into a single-cert migration.
--
-- ============================================================================
-- CANDIDATE IMPACT
-- ============================================================================
--
-- This lengthens an exam. No candidate is disadvantaged by it, no prior result
-- is invalidated, and no attempt in progress is affected - the duration is read
-- when a session starts. AIHR-I has issued no credentials.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

update public.certifications
set exam_duration_minutes = 60
where code = 'AIHR-I'
  and exam_duration_minutes = 50;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. AIHR-I now meets the Tier I floor. Expect 60 / 40 = 1.50.
select code, tier, num_questions, exam_duration_minutes,
       round(exam_duration_minutes::numeric / num_questions, 2) as min_per_item
from public.certifications
where code = 'AIHR-I';

-- 2. No certification is below its tier floor. Expect zero rows.
select code, tier, num_questions, exam_duration_minutes,
       round(exam_duration_minutes::numeric / num_questions, 2) as min_per_item
from public.certifications
where exam_duration_minutes is not null
  and num_questions > 0
  and (exam_duration_minutes::numeric / num_questions)
      < case tier when 1 then 1.50 when 2 then 3.00 else 0 end
order by code;

-- 3. The three 40-item Tier I certs, side by side. All three at 60 / 1.50.
select code, num_questions, exam_duration_minutes,
       round(exam_duration_minutes::numeric / num_questions, 2) as min_per_item
from public.certifications
where num_questions = 40
order by code;

-- 4. The whole-catalogue check.
--    Run: node scripts\verify-cert.mjs --all --strict
--    Expect: every cert PASS on "Minutes per item at or above the tier floor".
