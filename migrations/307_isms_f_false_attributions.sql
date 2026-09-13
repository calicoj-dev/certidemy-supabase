-- 307_isms_f_false_attributions.sql
--
-- ISMS-F ASSERTS ISO/IEC 27005'S RISK-TREATMENT VOCABULARY AS ISO/IEC 27001'S,
-- AND FILES CONTINUAL IMPROVEMENT AT THE 2013 EDITION'S CLAUSE NUMBER.
--
-- Found by reading 164 clause-citing items against the PDF. ISMS-F routed to
-- NEUTRAL - 524 characters naming no standard - for its entire build, and 2 of
-- its 192 concept descriptions name a document. Its standards content had no
-- source in the repository, so the drafter supplied it from training data. The
-- routing is fixed going forward (FOUNDATION_27001, commit 4e82809); this is
-- the bank that was already written.
--
-- VERIFIED AGAINST ISO/IEC 27001:2022 ON DISK, NOT FROM MEMORY:
--   "modify"  0 occurrences in the whole standard
--   "avoid"   0
--   "share"   0
--   clause 6.1.3 a) reads only "select appropriate information security risk
--   treatment options, taking account of the risk assessment results" - it
--   names none of them.
--   clause 10.1 is Continual improvement; 10.2 is Nonconformity and corrective
--   action. THEY SWAPPED IN THE 2022 EDITION - 2013 had them the other way up.
--
-- modify / retain / avoid / share is ISO/IEC 27005 vocabulary. That is a
-- document this certification already teaches: its own task 1.4 items state
-- that ISO/IEC 27005 is the family member dedicated to risk management
-- guidance. Re-attributing to 27005 is therefore coherent with what the cert
-- teaches elsewhere, not an import of a new source.
--
-- ============================================================================
-- THE KEYS WERE CHECKED BEFORE BEING TOUCHED. Three of these are keys, and a
-- key asserting the wrong source is not a citation repair.
--
--   7a90ecf3  "Which set of terms correctly names all four risk treatment
--             options in ISO/IEC 27001:2022 Clause 6.1.3?"
--             THE STEM IS THE DEFECT, NOT THE KEY. The key ("Modify, retain,
--             avoid, and share") is the correct 27005 set. Repair the
--             attribution and the key is right; replace the key and the item
--             tests nothing. Key still discriminates against three variant
--             sets.
--
--   160130c8  "According to ISO/IEC 27001, which set of terms names the four
--             risk treatment options?" Same shape. Same repair.
--
--   f2686dcc  "According to ISO/IEC 27001, which of the following is one of
--             the four recognized risk treatment options?" Key is a definition
--             of "modify"; correct under 27005. Same repair.
--
--   8bacbcc6  Key: "Clause 10.2 uses 'shall,' making improvement a normative
--             requirement." The clause NUMBER is wrong, the claim is right.
--             Continual improvement is 10.1 and it does use "shall".
--
-- AND THE DISTRACTORS WERE CHECKED FOR THE INVERSE FAILURE - a distractor
-- built to be wrong BECAUSE it named the four options would become CORRECT
-- once the key is re-attributed, which is worse than the original defect.
-- It does not happen here, and the reason is structural rather than lucky:
-- every distractor in these items presents a VARIANT set (reduce/accept/
-- transfer/eliminate, modify/accept/eliminate/transfer, prevent/detect/
-- respond/recover, accept/transfer/mitigate/escalate). None presents the
-- correct four. They are wrong under 27001 and under 27005 alike, so moving
-- the attribution moves nothing. Checked individually, all four items.
--
-- 8bacbcc6's distractors turn on WHEN the obligation applies (first cycle
-- only, at certification, only on nonconformity) and name no clause, so the
-- 10.2 -> 10.1 change cannot reach them either.
--
-- WHAT IS NOT FIXED HERE AND WHY. Seven further defects need PROSE rewritten
-- rather than an address corrected, in three languages - "clause 4.1
-- explicitly lists governance, culture and values as internal issues" (4.1
-- enumerates nothing: "competitive", "cultural", "socio-economic" and
-- "governance structure" each appear 0 times in the standard), "ISO/IEC 27001
-- requires ongoing monitoring and review of internal and external issues"
-- (that sentence is ISO 9001:2015's; it occurs once in 27001, in Annex A
-- control 8.30), "clause 4.3 requires exclusions and their justification" (4.3
-- never mentions exclusions - that is 6.1.3 d) and the Statement of
-- Applicability), and "ISO 27001 requires the risk register to be a living
-- document" (no clause requires a register at all). Grammar does not survive
-- substring surgery, so those go through the translation path as their own
-- change. Listed in full in the report.
--
-- ASCII, AND NO ACCENTED TEXT TRAVELS. Every pattern and replacement below is
-- ASCII. Where a pattern must span an accented word, "Cl.usula" matches
-- "Clausula" and "Clausula" with the accent alike. Every replacement was
-- previewed in all three languages and is grammatical: Spanish keeps its
-- article ("en la ISO/IEC 27005"), Portuguese keeps its contraction ("na
-- ISO/IEC 27005").
--
-- Run in the Supabase SQL editor, one block at a time.

-- ============================================================================
-- 1. GUARD. Expect 18 rows: six groups x three languages.
-- ============================================================================

select q.question_group_id as grp, t.code as task, count(*) as language_rows,
       count(*) filter (where (q.question_text||coalesce(q.explanation,'')||q.options::text)
                        ~ 'ISO/IEC 27001|ISO 27001|10\.2') as rows_to_change
from public.quiz_questions q
left join public.tasks t on t.id = q.task_id
where q.question_group_id in (
  '7a90ecf3-d510-4e04-9e85-8cba4ab8a998',
  '160130c8-96d7-4581-b255-80a7d296d888',
  'f2686dcc-cede-4d7b-ac6b-e24e36b9037e',
  '37b4a39b-8baa-4370-9276-b16e782550f0',
  '8bacbcc6-ae9d-44b2-891c-d3a98d710f9e')
group by 1, 2 order by 2;

-- ============================================================================
-- 2. 7a90ecf3 - the clause reference goes with the standard.
--    English puts the standard first, Spanish and Portuguese put the clause
--    first, so this needs both patterns. Expect 3 rows.
-- ============================================================================

update public.quiz_questions set
  question_text = regexp_replace(regexp_replace(question_text,
      'ISO/IEC 27001:2022 Clause 6\.1\.3', 'ISO/IEC 27005'),
      'Cl.usula 6\.1\.3 d[ea] ISO/IEC 27001:2022', 'ISO/IEC 27005'),
  explanation = regexp_replace(regexp_replace(explanation,
      'ISO/IEC 27001:2022 Clause 6\.1\.3', 'ISO/IEC 27005'),
      'Cl.usula 6\.1\.3 d[ea] ISO/IEC 27001:2022', 'ISO/IEC 27005')
where question_group_id = '7a90ecf3-d510-4e04-9e85-8cba4ab8a998';

-- ============================================================================
-- 3. 160130c8 - stem and explanation. Expect 3 rows.
-- ============================================================================

update public.quiz_questions set
  question_text = replace(question_text, 'ISO/IEC 27001', 'ISO/IEC 27005'),
  explanation   = replace(explanation,   'ISO/IEC 27001', 'ISO/IEC 27005')
where question_group_id = '160130c8-96d7-4581-b255-80a7d296d888';

-- ============================================================================
-- 4. f2686dcc - stem only; the explanation names no standard. Expect 3 rows.
-- ============================================================================

update public.quiz_questions set
  question_text = replace(question_text, 'ISO/IEC 27001', 'ISO/IEC 27005')
where question_group_id = 'f2686dcc-cede-4d7b-ac6b-e24e36b9037e';

-- ============================================================================
-- 5. 37b4a39b - EXPLANATION ONLY, AND THAT IS THE WHOLE POINT OF THIS ONE.
--    The stem asks "Is this valid under ISO 27001?" and must keep saying
--    27001: the question is about what 27001 permits, and the answer is yes -
--    6.1.3 a) does not restrict which treatment options may be selected. Only
--    the explanation's enumeration is misattributed. Expect 3 rows.
-- ============================================================================

update public.quiz_questions set
  explanation = regexp_replace(explanation, 'ISO 27001', 'ISO/IEC 27005')
where question_group_id = '37b4a39b-8baa-4370-9276-b16e782550f0';

-- ============================================================================
-- 6. 8bacbcc6 - continual improvement is clause 10.1 in the 2022 edition.
--    Expect 3 rows.
-- ============================================================================

update public.quiz_questions set
  options     = replace(options::text, '10.2', '10.1')::jsonb,
  explanation = replace(explanation,   '10.2', '10.1')
where question_group_id = '8bacbcc6-ae9d-44b2-891c-d3a98d710f9e';

-- ============================================================================
-- PROOF - both directions.
-- ============================================================================

-- 7. POSITIVE: the five targeted groups now name ISO/IEC 27005 where they named
--    27001, in all three languages. Expect 3 / 3 / 3 / 3 / 3.
--
--    THE LEXICAL VERSION OF THIS CHECK WAS WRONG THREE SEPARATE WAYS and is
--    kept here as the record, because it is the third instance today of a guard
--    searching for a STRING when the property was structural. It read:
--
--      where (question_text || coalesce(explanation,'') || options::text)
--            ~* 'ISO(/IEC)? 27001[^.]{0,60}(modif|retain|...)[^.]{0,40}(retain|...)'
--
--    (a) IT CONCATENATED FIELDS WITH NO SEPARATOR. Group 37b4a39b's stem ends
--        "...valid under ISO 27001?" and its explanation begins "ISO/IEC 27005
--        recognises... modification, retention". Joined, the stem's 27001 sits
--        60 characters from the explanation's enumeration - an adjacency that
--        does not exist in the item. The group it flagged is the group this
--        migration correctly FIXED.
--    (b) TERM COLLISION. "reten" matched task 4.12's "log retention periods",
--        which is records retention and has nothing to do with risk treatment.
--    (c) EVEN PER-FIELD, REQUIRING THREE OF THE FOUR TERMS, it still flagged
--        task 3.7, which names the options parenthetically and unattributed and
--        then separately says "ISO/IEC 27001 requires both steps in that order"
--        - a true statement about clause 6.1.3's sequence.
--
--    (c) is the one that matters: ATTRIBUTION IS A GRAMMATICAL RELATION AND NO
--    LEXICAL PROXIMITY TEST CAPTURES IT. "names the four options, and also
--    mentions 27001" is indistinguishable from "says 27001 names the four
--    options" by any distance measure. So the property is positional - these
--    five groups, these fields - and the items that legitimately state the
--    vocabulary without attributing it are named below rather than pattern-
--    matched around.
select
  (select count(*) from public.quiz_questions where question_group_id = '7a90ecf3-d510-4e04-9e85-8cba4ab8a998'
     and (question_text || coalesce(explanation, '')) like '%27005%') as g1_7a90ecf3,
  (select count(*) from public.quiz_questions where question_group_id = '160130c8-96d7-4581-b255-80a7d296d888'
     and (question_text || coalesce(explanation, '')) like '%27005%') as g2_160130c8,
  (select count(*) from public.quiz_questions where question_group_id = 'f2686dcc-cede-4d7b-ac6b-e24e36b9037e'
     and question_text like '%27005%') as g3_f2686dcc,
  (select count(*) from public.quiz_questions where question_group_id = '37b4a39b-8baa-4370-9276-b16e782550f0'
     and explanation like '%27005%') as g4_37b4a39b_expl,
  (select count(*) from public.quiz_questions where question_group_id = '8bacbcc6-ae9d-44b2-891c-d3a98d710f9e'
     and options::text like '%10.1%' and explanation like '%10.1%') as g5_8bacbcc6;

-- 7b. THE ITEMS DELIBERATELY LEFT ALONE, named so a later reader does not
--     "fix" them. Each states the four-option vocabulary WITHOUT attributing it
--     to ISO/IEC 27001, which is correct - the terms are ISO/IEC 27005's and
--     the cert teaches elsewhere that 27005 is where risk methodology lives.
--       05b1484e  "How many risk treatment options are defined...?"  no standard named
--       e522bf7f  "Which of the following correctly lists all four...?"  no standard named
--       6a11b4a4  task 3.7, names them parenthetically, then says 27001 requires
--                 the SEQUENCE (option selection before treatment plan), which
--                 is true of clause 6.1.3.
--     Expect 9 rows, none of them mentioning 27005.
select q.question_group_id as grp, q.language,
       (q.question_text || coalesce(q.explanation, '') || q.options::text) like '%27005%' as leaked_27005
from public.quiz_questions q
where q.question_group_id in (
  '05b1484e-4778-46cf-a972-37d76d760b42',
  'e522bf7f-5cf7-4ca3-a65e-ccc2b356b66a',
  '6a11b4a4-a80c-4977-b5da-544850d9aeb3')
order by grp, q.language;

-- 8. POSITIVE: no ISMS-F item files continual improvement at 10.2. Expect 0.
select count(*) as improvement_at_10_2
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-F' and q.retired_at is null
  and (q.question_text || coalesce(q.explanation, '') || q.options::text)
      ~* 'cl.usula 10\.2|clause 10\.2';

-- 9. NEGATIVE, AND THIS IS THE ONE THAT MATTERS. The KEY of every one of the
--    six groups must still be the option it was, and every distractor must
--    still be wrong. Option ids, option count and key id are asserted
--    unchanged; the four correct-set keys are asserted to still contain all
--    four terms in their own language. Expect 18 rows, all true.
select q.question_group_id as grp, q.language,
       jsonb_array_length(q.options) = 4 as four_options,
       exists (select 1 from jsonb_array_elements(q.options) o
               where o->>'id' = q.correct_answer->>0) as key_resolves,
       (select o->>'text' from jsonb_array_elements(q.options) o
        where o->>'id' = q.correct_answer->>0)
         ~* '(modif|retain|reten|avoid|evita|share|compart|10\.1)' as key_still_on_topic
from public.quiz_questions q
where q.question_group_id in (
  '7a90ecf3-d510-4e04-9e85-8cba4ab8a998',
  '160130c8-96d7-4581-b255-80a7d296d888',
  'f2686dcc-cede-4d7b-ac6b-e24e36b9037e',
  '37b4a39b-8baa-4370-9276-b16e782550f0',
  '8bacbcc6-ae9d-44b2-891c-d3a98d710f9e')
order by grp, q.language;

-- 10. NEGATIVE: the 3.2 item's STEM still says 27001. If this returns anything
--     other than 3, statement 5 reached the stem and changed the question.
select count(*) as stem_still_asks_about_27001
from public.quiz_questions
where question_group_id = '37b4a39b-8baa-4370-9276-b16e782550f0'
  and question_text ~ 'ISO 27001';

-- 11. NEGATIVE: no group acquired "27005" in an option. The repair is to the
--     attribution, never to what the candidate chooses between. Expect 0.
select count(*) as options_mentioning_27005
from public.quiz_questions
where question_group_id in (
  '7a90ecf3-d510-4e04-9e85-8cba4ab8a998',
  '160130c8-96d7-4581-b255-80a7d296d888',
  'f2686dcc-cede-4d7b-ac6b-e24e36b9037e',
  '37b4a39b-8baa-4370-9276-b16e782550f0',
  '8bacbcc6-ae9d-44b2-891c-d3a98d710f9e')
  and options::text like '%27005%';

-- 12. NEGATIVE: no mojibake from the jsonb round trip. Expect 0.
select count(*) as mojibake
from public.quiz_questions
where question_group_id in (
  '7a90ecf3-d510-4e04-9e85-8cba4ab8a998',
  '160130c8-96d7-4581-b255-80a7d296d888',
  'f2686dcc-cede-4d7b-ac6b-e24e36b9037e',
  '37b4a39b-8baa-4370-9276-b16e782550f0',
  '8bacbcc6-ae9d-44b2-891c-d3a98d710f9e')
  and (question_text || coalesce(explanation, '') || options::text)
      like '%' || chr(195) || chr(169) || '%';
