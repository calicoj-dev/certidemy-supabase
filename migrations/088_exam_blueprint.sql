-- 088_exam_blueprint.sql
-- Per-cert exam FORM blueprint. Additive and nullable: when null, generate-mock-exam
-- keeps its existing hardcoded 30/50/20 difficulty balance, so SM-AI-I / SPO-AI-I /
-- SD-AI-I / AIGRM-I assemble exactly as they do today. No regression.
--
-- WHY
-- ---
-- generate-mock-exam's pickBalancedDifficulty() hardcodes {easy d<=2: 30%, medium
-- d=3: 50%, hard d>=4: 20%} - correct for an 80-item professional Scrum exam, wrong
-- for a literacy tier. AIE-I's JTA declares Bloom 44/40/16 (Remember/Understand/
-- Apply) with a hard ceiling at Apply, and its corrected secure pool holds
-- d1=35 / d2=77 / d3=16 / d4+=0. Run the old assembler over that pool and a 25-item
-- form comes out ~50% Apply - a 3x overshoot of the published blueprint, while
-- draining nearly every Apply item into every form (an exposure problem too).
--
-- A credential whose delivered form does not match its published blueprint is not
-- defensible under ISO/IEC 17024. This makes conformance structural.
--
-- SHAPE
--   exam_blueprint = { "difficulty_mix": { "1": 44, "2": 40, "3": 16 } }
--   Keys are exact difficulty levels; values are percentages (need not sum to 100 -
--   they are normalized). Seats are allocated by largest-remainder so they sum to
--   the domain quota exactly. Applied WITHIN the existing domain weighting, so
--   domain proportions (40/36/24) are untouched.
--
-- Because bloom_level is a pure function of difficulty per tier (literacy:
-- 1->remember, 2->understand, 3->apply), stratifying on difficulty IS stratifying
-- on Bloom. No new column is needed on quiz_questions.
--
-- Editor-first. ASCII-only.

begin;

alter table public.certifications
  add column if not exists exam_blueprint jsonb;

comment on column public.certifications.exam_blueprint is
  'Optional per-cert exam form blueprint. {"difficulty_mix":{"1":44,"2":40,"3":16}} '
  'stratifies form assembly by exact difficulty (== Bloom, per tier) within domain '
  'weights. NULL = legacy 30/50/20 difficulty balance in generate-mock-exam.';

-- AIE-I (literacy tier): Bloom 44/40/16, ceiling 3_apply. Matches the locked JTA.
update public.certifications
set exam_blueprint = '{"difficulty_mix": {"1": 44, "2": 40, "3": 16}}'::jsonb
where id = '66666666-6666-6666-6666-666666666666';

commit;

-- ============================================================================
-- Verify (expect exactly one row, AIE-I, with the mix; all other certs NULL):
--   select code, exam_blueprint from public.certifications order by code;
--
-- Expected 25-item AIE-I form after this + the edge-function change:
--   domain seats (weights 40/36/24, largest-remainder): D1=10, D2=9, D3=6
--   bloom seats  (44/40/16 within each domain, largest-remainder):
--     D1 -> 4 remember / 4 understand / 2 apply
--     D2 -> 4 remember / 4 understand / 1 apply
--     D3 -> 3 remember / 2 understand / 1 apply
--     total ~ 11 / 10 / 4  = 44% / 40% / 16%   <- the published blueprint
--
-- Pool sufficiency for that form (secure, per language): d1=35, d2=77, d3=16
-- against a per-form need of 11 / 10 / 4. Every band has 3x+ headroom, so forms
-- can randomize without exhausting a band.
-- ============================================================================
