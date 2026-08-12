-- 202_isms_ia_validity_and_duration.sql
--
-- TWO SCHEME DECISIONS FOR ISMS-IA, EACH WITH ITS REASON.
--
-- PREREQUISITE: the code patch must be deployed first. score-mock-exam
-- hardcoded expires_at as getFullYear() + 1 and ignored certifications
-- .validity_days entirely - migration 158 recorded that gap in its own header
-- and left it as a follow-up. Setting 730 here without the patch would make the
-- fact sheet say two years while every credential issued still expired in one.
-- The column would be decorative.
--
-- ============================================================================
-- 1. VALIDITY: 730 DAYS
-- ============================================================================
--
-- The house default is 365, and migration 158 states the principle behind it: a
-- validity period is a commitment to RE-REVIEW THE BODY OF KNOWLEDGE on that
-- schedule, not a claim about how fast a candidate forgets. Certifications
-- anchored to stable frameworks may hold a version for years under the same
-- cadence; ones tracking fast-moving regulation cannot.
--
-- ISMS-IA is anchored to standards that revise on a multi-year cycle:
--
--     ISO 19011      2018 -> 2026   (eight years)
--     ISO/IEC 27001  2013 -> 2022   (nine years, plus Amd 1:2024)
--     ISO/IEC 17021-1  stable since 2015
--
-- Against that, an annual re-review would find nothing changed in most years -
-- churn without a change in the body of knowledge, and a recertification fee
-- that buys the holder nothing. Two years is the shortest interval at which the
-- underlying documents plausibly move.
--
-- It also matches the practice the credential attests to. An internal audit
-- programme runs on a cycle that covers the whole ISMS scope; two years is a
-- realistic span for a holder to have completed one and audited against a
-- revised edition.
--
-- The AI-era content in domains 3 and 4 does move faster, and that is the
-- argument on the other side. It is answered by re-review rather than by
-- expiry: when that material changes materially, the lessons are updated and
-- credentials.material_updated_at moves. Expiring the credential annually would
-- not have taught the holder the new material either.
--
-- This is the first cert to deviate from 365. The Foundation and Level I certs
-- keep the house default until each is argued on its own facts.
--
-- ============================================================================
-- 2. EXAM DURATION: 150 MINUTES
-- ============================================================================
--
-- Currently 90 for a 50-item form - 1.8 minutes per item. The Level I certs run
-- 1.5 (AIGRM-I: 80 items in 120; the Foundations: 40 in 60). So ISMS-IA already
-- has more time per item, and it is still not enough.
--
-- A Level II item is a different object. Measured over the 304 English secure
-- items actually in the bank: four options averaging roughly 200 characters
-- each, against a Foundation item's ~110. 65.6% of the form sits at
-- 4_analyze, where the candidate does not recognise an answer - they read four
-- defensible positions and weigh which is best.
--
--     ~90-word stem + 4 x ~45-word options = ~270 words
--     at 200 wpm that is ~80 seconds of READING, before any thinking
--
-- Three minutes per item leaves roughly ninety seconds to decide. That is the
-- competence being measured; the reading is not.
--
-- 150 minutes also sits inside the range the established internal-auditor exams
-- use for comparable forms (PECB runs 2-3 hours). That is a sanity check on the
-- estimate, not its justification.
--
-- HONEST STATUS: this is a reasoned ESTIMATE, not a validated figure. Real
-- timing data - how long candidates actually take, and how many run out - is
-- the only thing that can confirm or correct it, and none exists until the exam
-- is sat. Recorded here so the number is revisited against evidence rather than
-- inherited as fact. Under ISO/IEC 17024 what matters is that the basis is
-- stated and reviewed, not that the first estimate is right.
--
-- ============================================================================
-- 3. SESSION TIMEOUT - CHECK BEFORE PUBLISH, NOT DONE HERE
-- ============================================================================
--
-- A 150-minute form outlives a short-lived auth token. If the Supabase JWT
-- expiry is under 150 minutes and the exam runner does not refresh it,
-- candidates are logged out mid-exam and lose an attempt. Verify against
-- get-active-exam-session and the project's token lifetime BEFORE ISMS-IA
-- leaves draft. Recorded so it cannot be forgotten.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- BEFORE
-- ============================================================================

select code, validity_days, exam_duration_minutes, num_questions,
       passing_score_pct, status
from public.certifications
where code = 'ISMS-IA';

-- ============================================================================
-- APPLY
-- ============================================================================

update public.certifications
set validity_days         = 730,
    exam_duration_minutes = 150
where code = 'ISMS-IA';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. ISMS-IA holds the new values; nothing else moved. Expect exactly one row
--    away from the 365-day house default.
select code, validity_days, exam_duration_minutes, num_questions,
       round(exam_duration_minutes::numeric / nullif(num_questions,0), 2) as min_per_item,
       status
from public.certifications
order by validity_days desc, code;

-- 2. No credential has been issued for this cert yet, so no holder is affected
--    by the change. Expect 0.
select count(*) as credentials_issued
from public.credentials cr
join public.certifications c on c.id = cr.certification_id
where c.code = 'ISMS-IA';

-- 3. Every other cert still sits at the house default. Expect 9 rows, all 365.
select count(*) as certs_at_house_default
from public.certifications
where validity_days = 365;
