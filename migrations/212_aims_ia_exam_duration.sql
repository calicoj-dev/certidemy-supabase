-- 212_aims_ia_exam_duration.sql
--
-- AIMS-IA exam duration - 165 minutes, measured on the built bank.
--
-- WHY THIS WAS LEFT NULL. SCHEME-AIMS-IA Section 6 deliberately withheld a
-- duration and forbade inheriting ISMS-IA's 150 minutes, on the grounds that
-- AIMS-IA runs 69.48% analyze against ISMS-IA's 65.60% and that the number had
-- to be measured on this scheme's own items. Publication was gated on it.
-- The bank now exists (960 secure items, 320 per language), so it can be.
--
-- ============================================================================
-- THE RULE (also recorded in COGNITIVE-MODEL.md)
-- ============================================================================
--
-- TIER SETS THE BASE. It is not a preference, it is the cost of the item
-- contract:
--
--   Tier I   80 items   1.50 min/item   120 min
--   Tier II  50 items   3.00 min/item   150 min
--
-- A Level I item asks the candidate to find one correct answer among three that
-- are wrong. A Level II item asks them to evaluate four DEFENSIBLE options and
-- determine which is better, for a reason they could state. That is a different
-- act and it costs roughly double. Fewer items at more time each is also the
-- only honest way to ask 50 analyze items - past a point, a longer form stops
-- measuring competence and starts measuring stamina.
--
-- MEASUREMENT ADJUSTS WITHIN TIER, on two inputs computed from the built bank:
--
--   1. READING LOAD IN THE LONGEST LANGUAGE. One duration serves en, es-419 and
--      pt-BR, so a duration set on English disadvantages Spanish candidates.
--      es-419 runs 116.9% of English on AIMS-IA and 117.4% on ISMS-IA -
--      consistent enough across schemes to treat as structural rather than
--      noise. The longest language binds.
--
--   2. ANALYZE SHARE against the tier's reference scheme. Character counts
--      cannot see reasoning time. A form that moves items from apply to analyze
--      costs more than its length suggests.
--
-- ============================================================================
-- THE MEASUREMENT
-- ============================================================================
--
-- Mean item length, stem + options, secure pool, per language:
--
--                    en        es-419     pt-BR     es-419 as % of en
--   AIMS-IA          1205      1408       1357      116.9%
--   ISMS-IA          1153      1354       1300      117.4%
--
-- ISMS-IA's 150 minutes against its binding-language load:
--   50 items x 1354 chars = 67,700 chars in 150 min = 451 chars/minute
--
-- AIMS-IA's binding-language load at that same rate:
--   50 items x 1408 chars = 70,400 chars / 451 = 156.1 minutes
--
-- That is the FLOOR - reading parity with a scheme whose duration is already in
-- the field. It carries no allowance for the harder cognitive profile.
--
-- Cognitive premium: 69.48% analyze against 65.60% moves roughly two items of a
-- 50-item form from apply to analyze, at the tier's most expensive level.
--
--   156.1 floor + premium, rounded to a clean quarter hour = 165 minutes
--   165 / 50 = 3.30 min/item
--
-- ============================================================================
-- AGAINST THE MARKET
-- ============================================================================
--
-- There is no ISO/IEC 42001 INTERNAL auditor exam with a published duration to
-- benchmark against - the market at this level is course-based, with a final
-- assessment rather than a timed independent exam. The nearest published
-- anchors are Lead Auditor:
--
--   PECB Lead Auditor      80 MCQ / 180 min / open book / 70%   = 2.25 min/item
--   PECB Lead Auditor      12 essay / 180 min / open book       (sources differ
--                          on which format is current - both are reported)
--   GSDC Lead Auditor      62 MCQ, duration not published
--
-- At 3.30 min/item, AIMS-IA gives 47% more time per item than the PECB MCQ
-- figure. That is intended, and the reason is the item contract: PECB's is open
-- book, so time is partly spent looking things up rather than deciding. Ours is
-- closed book with four defensible options, where the whole task is deciding.
--
-- ============================================================================
-- ISO/IEC 17024 POSITION
-- ============================================================================
--
-- 17024 does not prescribe an exam duration. It requires that the examination be
-- planned and structured so that assessment is valid and reliable, and that the
-- decisions behind it be documented. The defensible claim is therefore not
-- "165 minutes is correct" - it is that the number was derived from the built
-- bank by a stated rule, benchmarked against what the market publishes, and is
-- subject to review.
--
-- REVIEW TRIGGER. Re-measure when any of these move: the item bank is
-- regenerated, the cognitive profile changes by more than 2 percentage points,
-- or the binding language's expansion ratio moves outside 110-125% of English.
-- Otherwise review semi-annually with the rest of the scheme.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

update public.certifications
set exam_duration_minutes = 165
where id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and code = 'AIMS-IA';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. The duration is set, and its minutes-per-item sits above the Tier II base.
--    Expect 165 / 50 = 3.30.
select code, tier, num_questions, exam_duration_minutes,
       round(exam_duration_minutes::numeric / num_questions, 2) as min_per_item
from public.certifications
where code = 'AIMS-IA';

-- 2. The catalogue, by minutes per item. AIMS-IA should be the highest - it is
--    the most analyze-heavy scheme in the catalogue.
select code, tier, num_questions, exam_duration_minutes,
       round(exam_duration_minutes::numeric / num_questions, 2) as min_per_item, status
from public.certifications
where exam_duration_minutes is not null
order by min_per_item desc, code;

-- 3. The measurement this migration rests on, re-runnable. Confirms the
--    binding-language ratio has not moved since it was taken.
select c.code, q.language,
       count(*) as items,
       round(avg(length(q.question_text) + length(q.options::text))) as avg_item_chars
from public.certifications c
join public.tasks t on t.certification_id = c.id
join public.quiz_questions q on q.task_id = t.id
where c.code in ('AIMS-IA','ISMS-IA') and q.pool = 'secure'
group by c.code, q.language
order by c.code, q.language;

-- 4. The whole-cert check.
--    Run: node scripts\verify-cert.mjs --cert AIMS-IA --strict
