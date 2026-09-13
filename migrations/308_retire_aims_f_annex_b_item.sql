-- 308_retire_aims_f_annex_b_item.sql
--
-- AIMS-F PRACTICE 4.1, GROUP 14cfe015: NO OPTION IS CORRECT.
--
-- The stem has a candidate make two claims and asks which part is incorrect:
--   (1) Annex B of ISO/IEC 42001 is informative  -> FALSE, it is normative
--   (2) omitted Annex B guidance must be justified in the SoA -> FALSE, B.1
--       says organizations do not have to document or justify inclusion or
--       exclusion of implementation guidance in the statement of applicability
--
-- BOTH parts are false, and no option says so:
--   a) "first part incorrect ... though it carries no SoA obligation" - states
--      the true facts but mislabels which part is wrong
--   b) "neither part is incorrect" - wrong twice
--   c) "both parts are incorrect: Annex B is normative AND does carry SoA
--      justification obligations" - right about the first, wrong about the second
--   d) "second part incorrect: Annex B is informative" - the shipped key, and
--      its premise is the error the item exists to test
--
-- SO IT IS RETIRED RATHER THAN REWRITTEN. Repairing it means writing a new
-- stem, a new key and at least two new distractors, which is authoring a new
-- item behind an old id. Its sibling 3df218a1 WAS repairable - the candidate's
-- premise there is true and only the inference is wrong - and was rewritten in
-- the same pass.
--
-- THIS WILL TURN floors.practice RED, DELIBERATELY. AIMS-F task 4.1 practice
-- holds exactly 10 per language, and verify-cert's floors.* invariants count
-- only status='approved' rows. Retiring takes it to 9/9/9 and the gate fails.
-- That is the point: the replacement is generated under FOUNDATION_42001 and
-- the floor returning to 10/10/10 is what proves the fix rather than the
-- assumption. Do not leave the bank in this state - step 2 follows immediately.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. GUARD. Expect 3 rows, all approved, all currently counting to the floor.
-- ============================================================================

select q.language, q.pool, q.status, q.retired_at,
       left(q.question_text, 80) as stem
from public.quiz_questions q
where q.question_group_id = '14cfe015-0a71-448e-8683-2ec8db169850'
order by q.language;

-- ============================================================================
-- 2. THE RETIREMENT. Expect 3 rows.
-- ============================================================================

update public.quiz_questions set
  retired_at    = now(),
  retire_reason = 'No correct option. Stem asserts Annex B of ISO/IEC 42001 is informative (it is normative) and that omitted Annex B guidance must be justified in the SoA (B.1 says it need not); both of the candidate claims are false and no option states that. Repair would be a new item behind an old id. Replaced by a task 4.1 practice item generated under FOUNDATION_42001.'
where question_group_id = '14cfe015-0a71-448e-8683-2ec8db169850'
  and retired_at is null;

-- ============================================================================
-- PROOF - and the first one is EXPECTED TO SHOW A BREACH.
-- ============================================================================

-- 3. THE FLOOR IS NOW RED. Expect 3 rows, one per language, each reading 9.
--    If this returns nothing, the retirement did not take.
select q.language, count(*) as approved_items
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t on t.id = q.task_id
where c.code = 'AIMS-F' and t.code = '4.1' and q.pool = 'practice'
  and q.retired_at is null and q.status = 'approved'
group by q.language
having count(*) < 10
order by q.language;

-- 4. The three rows are retired and carry a reason. Expect 3.
select count(*) as retired_with_reason
from public.quiz_questions
where question_group_id = '14cfe015-0a71-448e-8683-2ec8db169850'
  and retired_at is not null and length(coalesce(retire_reason, '')) > 40;

-- 5. NEGATIVE: nothing else in AIMS-F was retired by this. Expect 3.
select count(*) as aims_f_retired_total
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'AIMS-F' and q.retired_at is not null;

-- 6. NEGATIVE: its repaired sibling is untouched and still live. Expect 3 live
--    rows, none retired, key still 'd'.
select q.language, q.retired_at is null as live, q.correct_answer->>0 as key
from public.quiz_questions q
where q.question_group_id = '3df218a1-ec34-4e51-b5b2-1a7ecf5a03d6'
order by q.language;
