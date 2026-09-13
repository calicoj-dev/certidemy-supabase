-- 309_retire_sm_ai_ii_two_option_items.sql
--
-- TWO true_false ITEMS WITH TWO OPTIONS ON A LIVE TIER-2 CERTIFICATION.
--
-- SM-AI-II is tier = 2, status = 'available'. Its Level II contract is four
-- defensible options with one best. These two are true_false with TWO options,
-- so a guesser scores 50% and there is no second-best for the contract to be
-- about. Both came from functions/generate-practice-questions on 2026-09-12:
--
--   36b2e351  en      task 1.1  practice  "True or False: The Sprint Goal threat test ..."
--   a1f12fd3  es-419  task 1.1  practice  "Verdadero o Falso: El Sprint Goal y el alcance ..."
--
-- THEY ARE NOT SIBLINGS. Each is its own single-language group, which is
-- CORRECT for that path - it writes one language per call and mints a fresh
-- question_group_id per question. That structure was briefly mistaken for an
-- orphan defect during the investigation; it is not, and the exemption in
-- verify-cert's trilingual.items covers it deliberately.
--
-- RETIRED RATHER THAN REWRITTEN, AND THE FLOOR IS WHY. Task 1.1 practice holds
-- 15 / 15 / 10 across en / es-419 / pt-BR. Retiring both takes it to 14 / 14 /
-- 10, all at or above the floor of 10, so floors.practice stays green. That is
-- the opposite of the AIMS-F case an hour earlier, where the equivalent
-- retirement sat exactly on the floor and had to be replaced before it could
-- land. CHECK THE FLOOR BEFORE CHOOSING; the cheap option is only cheap
-- sometimes.
--
-- THE CAUSE IS FIXED UPSTREAM IN THE SAME CHANGE. validateQuestion accepted
-- options.length >= 2 and question_type 'true_false' and read no tier, while
-- the Level II contract lived only in scripts/gen-cert-secure.mjs. It now takes
-- the certification's tier and refuses anything but four single_choice options
-- at tier 2. Without that, retiring these two just clears the way for the next
-- weak-concepts session to write more.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. GUARD. Expect 2 rows, both 2 options, both generated, both live.
-- ============================================================================

select q.question_group_id as grp, q.language, q.pool, q.question_type,
       jsonb_array_length(q.options) as n_opts, q.item_origin, q.retired_at
from public.quiz_questions q
where q.question_group_id in (
  '36b2e351-2b28-4de6-b1b4-d95a7f4146a6',
  'a1f12fd3-e97a-436b-a412-d5f83e3fe390')
order by q.language;

-- 2. THE FLOOR BEFORE. Expect en 15, es-419 15, pt-BR 10.
select q.language, count(*) as approved
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t on t.id = q.task_id
where c.code = 'SM-AI-II' and t.code = '1.1' and q.pool = 'practice'
  and q.retired_at is null and q.status = 'approved'
group by q.language order by q.language;

-- ============================================================================
-- 3. THE RETIREMENT. Expect 2 rows.
-- ============================================================================

update public.quiz_questions set
  retired_at    = now(),
  retire_reason = 'true_false with two options on a tier-2 certification (SM-AI-II, status=available), whose Level II contract is four defensible options with one best. A guesser scores 50% and a two-option item has no second-best. Written by generate-practice-questions when validateQuestion accepted options.length >= 2 and read no tier; that validator now refuses anything but four single_choice options at tier 2.'
where question_group_id in (
  '36b2e351-2b28-4de6-b1b4-d95a7f4146a6',
  'a1f12fd3-e97a-436b-a412-d5f83e3fe390')
  and retired_at is null;

-- ============================================================================
-- PROOF - both directions.
-- ============================================================================

-- 4. POSITIVE: no live SM-AI-II item offers fewer than four options. Expect 0.
select count(*) as sub_four_live
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'SM-AI-II' and q.retired_at is null and q.status = 'approved'
  and jsonb_array_length(q.options) < 4;

-- 5. POSITIVE, AND THIS IS THE ONE THE AIMS-F CASE TAUGHT. The floor is still
--    met in every language. Expect NO ROWS - a row here is a breach.
select q.language, count(*) as approved
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t on t.id = q.task_id
where c.code = 'SM-AI-II' and t.code = '1.1' and q.pool = 'practice'
  and q.retired_at is null and q.status = 'approved'
group by q.language
having count(*) < 10;

-- 6. NEGATIVE: exactly two rows retired, nothing else in SM-AI-II. Expect 2.
select count(*) as retired_total
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'SM-AI-II' and q.retired_at is not null;

-- 7. NEGATIVE: the other eight generated items from that run are untouched and
--    still single-language groups of one, which is correct for that path.
--    Expect 8 rows, every one langs=1 and rows_in_group=1.
select q.question_group_id as grp, q.language,
       count(*) over (partition by q.question_group_id) as rows_in_group
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'SM-AI-II' and q.item_origin = 'generated'
  and q.retired_at is null
order by q.language, q.question_group_id;
