-- ============================================================================
-- 100_exam_durations.sql
--
-- GIVE CANDIDATES TIME TO READ THE EXAM.
--
-- The reconciled item style - a scenario stem with four options each carrying its own
-- "X, because Y" rationale - is deliberate. Forcing every option to justify itself is
-- what makes a distractor SUBSTANTIVELY wrong rather than merely wrong-sounding, and it
-- is what removed the length cue (the key can no longer be the only option with reasoning
-- attached). Medical board exams use the same pattern.
--
-- But it produces items of roughly 160 words, and the durations we inherited do not fit
-- them:
--
--     cert        items  minutes  sec/item     needed (~150wpm + thinking)
--     SM-AI-I       80      60       45   <--  ~90s.  HALF the time required.
--     AIGRM-I       80      90       68        ~90s
--     SD-AI-I       80      90       68        ~90s
--     SPO-AI-I      80      90       68        ~90s
--     AIE-I         25      30       72        ~60s   (adequate)
--
-- SM-AI-I's 80-items-in-60-minutes is inherited from PSM I, whose items are SHORT RECALL.
-- Ours are not. A candidate has 45 seconds to read ~160 words and decide. That is not an
-- assessment of Scrum mastery; it is a reading-speed test with Scrum-flavoured content.
--
-- WHY THIS IS A VALIDITY PROBLEM, NOT A COMFORT ONE.
--
-- An exam that cannot be READ in the time allowed measures reading speed and working
-- memory - competences no Certidemy job-task analysis declares. That is textbook
-- construct-irrelevant variance.
--
-- And it does not fall evenly. Spanish and Portuguese run 15-25% LONGER than English for
-- identical content. On a fixed clock, the same item is a harder item in es-419 and
-- pt-BR. That is differential item functioning by language, designed into the exam, in a
-- product built for LATAM.
--
-- THE ASYMMETRY, WHICH IS THE SAME ONE THAT SET THE CUT SCORE.
--
--   Too much time  -> candidates finish early. Nobody is harmed.
--   Too little time-> competent candidates fail on the clock, and we have measured the
--                     wrong thing. Unrecoverable for the person who already failed.
--
-- Generous is the recoverable direction. Set it generously now; tighten it later against
-- real data, never the other way round.
--
-- BENCHMARKS (comparable professional exams, seconds per item):
--     PSM I (short recall)      45
--     CompTIA Security+         60
--     PMP (scenario-heavy)      77
--     ISTQB Foundation          90   <-- comparable item style
--     CIPP/E (regulatory)      100   <-- closest analogue to AIGRM-I
--     Certidemy @ 120 min       90
--
-- 90 s/item places us level with ISTQB and inside CIPP/E. Defensible.
--
-- THIS IS AN INTERIM SETTING, AND IT IS FALSIFIABLE.
-- quiz_attempts.time_taken_seconds records every response, per item, per language, from
-- the first candidate. Once there is data we set duration from the observed distribution
-- (e.g. 95th-percentile completion) rather than from a benchmark. Recorded in
-- PSYCHOMETRIC-PROCEDURES as a deferred item with a live trigger.
-- ============================================================================

update public.certifications set exam_duration_minutes = 120 where code = 'SM-AI-I';   --  60 -> 120 (45 s -> 90 s per item)
update public.certifications set exam_duration_minutes = 120 where code = 'AIGRM-I';   --  90 -> 120 (68 s -> 90 s)
update public.certifications set exam_duration_minutes = 120 where code = 'SD-AI-I';   --  90 -> 120 (68 s -> 90 s)
update public.certifications set exam_duration_minutes = 120 where code = 'SPO-AI-I';  --  90 -> 120 (68 s -> 90 s)
update public.certifications set exam_duration_minutes = 45  where code = 'AIE-I';     --  30 ->  45 (72 s -> 108 s; shorter items, non-technical audience)

select code,
       num_questions,
       exam_duration_minutes,
       round(exam_duration_minutes * 60.0 / nullif(num_questions, 0), 0) as seconds_per_item,
       passing_score_pct
from public.certifications
order by code;
