-- 304_citation_address_defects.sql
--
-- THREE WRONG CLAUSE ADDRESSES, FOUND MECHANICALLY.
--
-- scripts/verify-citations.mjs resolves every clause and annex reference in
-- every bank against the three standards on disk and reports the ones that
-- exist in none of them. Across 9,341 rows and 5,736 resolved references it
-- returned 21 flags in 15 rows. Fourteen of those rows are two items that name
-- ISO/IEC 27001:2013 deliberately, in order to dismiss it (see the note at the
-- foot). These three are the real ones.
--
-- ALL THREE ARE ADDRESS ERRORS, NOT CLAIM ERRORS, and that distinction is the
-- point. Every claim here is true; each is filed at a location that does not
-- exist. No key changes, no option changes, no difficulty change - which is
-- also why the fix is a substring replacement and not a re-translation.
--
-- ASCII, AND NO ACCENTED TEXT TRAVELS. Every search and replacement string is
-- ASCII; the Spanish and Portuguese around them stays in the database. Where a
-- pattern has to span an accented word, "cl.usula" matches "clausula" and
-- "clausula" with the accent alike, so the accent never enters the editor.
--
-- Run in the Supabase SQL editor, one block at a time.

-- ============================================================================
-- 1. GUARD. Expect 3 groups, 9 rows, and the hit counts below.
--    D1 1 hit per row (explanation), D2 1 (stem), D3 2 (stem + explanation).
-- ============================================================================

select
  case q.question_group_id
    when 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f' then 'D1 AIMS-IA secure 5.6  19011 clause 6.8'
    when 'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd' then 'D2 AIMS-IA practice 3.3  42001 clause 10.3'
    when 'b95f0fd8-0e21-49ed-937f-f58562f8d641' then 'D3 ISMS-IA practice 5.2  27001 clause 5.19'
  end as defect,
  q.language, q.pool,
  (length(q.explanation) - length(replace(q.explanation, '6.8', ''))) / 3 as hits_6_8,
  (length(q.question_text) - length(replace(q.question_text, '10.3', ''))) / 4 as hits_10_3,
  (length(q.question_text || coalesce(q.explanation, ''))
   - length(replace(q.question_text || coalesce(q.explanation, ''), '5.19', ''))) / 4 as hits_5_19
from public.quiz_questions q
where q.question_group_id in (
  'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f',
  'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd',
  'b95f0fd8-0e21-49ed-937f-f58562f8d641')
order by defect, q.language;

-- ============================================================================
-- 2. D1 - AIMS-IA, SECURE, task 5.6. A LIVE TIER-2 SECURE ITEM.
--
--    Reads "ISO 19011:2026 clause 6.8 does allow verification to be deferred
--    to a subsequent audit". ISO 19011:2026 clause 6 ends at 6.7. The claim is
--    TRUE and lives in 6.7, "Conducting the audit follow-up":
--
--      "The completion and effectiveness of these actions should be verified.
--       This verification can be part of a subsequent audit."
--
--    Right fact, wrong address, off by one. Expect 3 rows.
-- ============================================================================

update public.quiz_questions
set explanation = replace(explanation, '6.8', '6.7')
where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f';

-- ============================================================================
-- 3. D2 - AIMS-IA, practice, task 3.3.
--
--    The stem calls incident management "clause 10.3 of ISO/IEC 42001".
--    Clause 10 of 42001 is Improvement and has 10.1 and 10.2 only. There is no
--    clause anywhere in 42001 for incident management - the nearest thing is
--    Annex A control A.8.4, "Communication of incidents", which is not what the
--    stem means either.
--
--    THE CITATION IS DELETED RATHER THAN CORRECTED, because the item does not
--    need it. What is being tested is the inferential reach of a judgement
--    sample; the incident records are just the population. A reference that
--    adds nothing and is wrong should go, not be replaced by a better wrong
--    one. Expect 3 rows.
-- ============================================================================

update public.quiz_questions
set question_text = regexp_replace(question_text,
      '\s*\((clause|cl.usula) 10\.3 (of|de|da) ISO/IEC 42001\)', '')
where question_group_id = 'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd';

-- ============================================================================
-- 4. D3 - ISMS-IA, practice, task 5.2.
--
--    Reads "ISO/IEC 27001 clause 5.19". Clause 5 of 27001 is Leadership and
--    has 5.1 to 5.3. What the item means is the Annex A control A.5.19,
--    "Information security in supplier relationships", which is exactly the
--    subject of the scenario. The address was missing its "A." prefix.
--
--    ONLY THE ADDRESS IS CORRECTED. Calling an Annex A control a "clause" is
--    loose - Annex A holds controls, and clause 6.1.3 is what makes them
--    operative through the Statement of Applicability. Tightening the wording
--    to "control A.5.19" would change an article and its agreement in both
--    Spanish and Portuguese ("a la clausula" -> "al control"), and grammar
--    does not survive substring surgery. That is a translation-path change and
--    it is not worth one for a live practice item whose address is now right.
--    Expect 3 rows, 2 replacements each.
-- ============================================================================

update public.quiz_questions set
  question_text = replace(question_text, '5.19', 'A.5.19'),
  explanation   = replace(explanation,   '5.19', 'A.5.19')
where question_group_id = 'b95f0fd8-0e21-49ed-937f-f58562f8d641';

-- ============================================================================
-- PROOF - both directions.
-- ============================================================================

-- 5. POSITIVE: the three addresses are gone. Expect 0, 0, 0.
select
  (select count(*) from public.quiz_questions
   where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
     and explanation like '%6.8%') as d1_stale,
  (select count(*) from public.quiz_questions
   where question_group_id = 'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd'
     and question_text like '%10.3%') as d2_stale,
  (select count(*) from public.quiz_questions
   where question_group_id = 'b95f0fd8-0e21-49ed-937f-f58562f8d641'
     and (question_text || coalesce(explanation, '')) ~ '(^|[^.A])5\.19') as d3_stale;

-- 6. POSITIVE: the corrected addresses are present, 3 rows each. Expect 3/3/3.
select
  (select count(*) from public.quiz_questions
   where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
     and explanation like '%6.7%') as d1_fixed,
  (select count(*) from public.quiz_questions
   where question_group_id = 'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd'
     and question_text like '%incident%') as d2_intact,
  (select count(*) from public.quiz_questions
   where question_group_id = 'b95f0fd8-0e21-49ed-937f-f58562f8d641'
     and question_text like '%A.5.19%' and explanation like '%A.5.19%') as d3_fixed;

-- 7. NEGATIVE: no double prefix, and D3 did not create "A.A.5.19". Expect 0.
select count(*) as double_prefixed
from public.quiz_questions
where (question_text || coalesce(explanation, '')) like '%A.A.5.19%';

-- 8. NEGATIVE: nothing outside these three groups was touched. The same
--    strings appear legitimately elsewhere - clause 10.3 does not exist in
--    42001 but 10.2 and 6.7 exist everywhere - so this asserts the blast
--    radius, not the absence of the tokens. Expect exactly 9.
select count(*) as rows_in_scope
from public.quiz_questions
where question_group_id in (
  'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f',
  'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd',
  'b95f0fd8-0e21-49ed-937f-f58562f8d641');

-- 9. NEGATIVE: keys still resolve and option counts are untouched. Expect 0.
select count(*) as broken
from public.quiz_questions q
where q.question_group_id in (
  'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f',
  'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd',
  'b95f0fd8-0e21-49ed-937f-f58562f8d641')
  and (jsonb_array_length(q.options) <> 4
    or not exists (select 1 from jsonb_array_elements(q.options) o
                   where o->>'id' = q.correct_answer->>0));

-- 10. NEGATIVE: no mojibake. Expect 0.
select count(*) as mojibake
from public.quiz_questions
where question_group_id in (
  'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f',
  'ccd2d55f-c00a-4b30-93e7-d6b6ecbe4cdd',
  'b95f0fd8-0e21-49ed-937f-f58562f8d641')
  and (question_text || coalesce(explanation, '') || options::text)
      like '%' || chr(195) || chr(169) || '%';

-- ============================================================================
-- WHAT THIS DOES NOT FIX, DELIBERATELY.
--
-- Two items name ISO/IEC 27001:2013 and are CORRECT to do so. Both exist to
-- dismiss a confusion, and a correction has to say what it corrects:
--
--   AIMS-F secure 4.1  - "The 114-control figure is from ISO/IEC 27001:2013."
--   ISMS-IA practice 3.3 - a distractor "confuses it with clause A.16 of
--                          ISO/IEC 27001:2013's Annex A, a different document
--                          entirely." 2013's A.16 was indeed incident
--                          management, and that is the whole point of the item.
--
-- This is CLAUDE.md's rule verbatim: the prose a guard checks can quote the
-- thing it forbids. Rewriting either item to satisfy the gate would be the
-- check editing the content. They need an EXEMPTION, keyed to the citation
-- rather than to the item, and that is its own change.
-- ============================================================================
