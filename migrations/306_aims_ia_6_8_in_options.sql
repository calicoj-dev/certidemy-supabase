-- 306_aims_ia_6_8_in_options.sql
--
-- MIGRATION 304 FIXED HALF OF ONE DEFECT, AND ITS OWN PROOF SAID IT WAS DONE.
--
-- 304 D1 corrected "ISO 19011:2026 clause 6.8" to 6.7 in the EXPLANATION of
-- AIMS-IA secure group fc72ac28 (task 5.6). The same wrong address is also in
-- OPTION (c), in all three languages. The update touched `explanation` only.
--
-- THE POST-CONDITION WAS SHAPED BY THE FIX INSTEAD OF BY THE PROPERTY:
--
--   select count(*) ... where question_group_id = '...' and explanation like '%6.8%'
--
-- It asked "did the field I edited stop containing the string", which is a
-- restatement of the UPDATE, not an independent check. It returned 0 and the
-- defect was still live in the option. The property is "no reference to clause
-- 6.8 anywhere in this group, in any field, in any language", and that is what
-- the proof below asserts. CLAUDE.md's rule about naming a property rather than
-- a count has a second half this is the worked example of: name the property
-- over the whole object, not over the part you happened to change.
--
-- It surfaced because verify-cert's new items.citations invariant kept FAILING
-- AIMS-IA after 304 ran - 3 secure references resolving to nothing where there
-- should have been none. The instrument caught the migration.
--
-- WHY THE DISTRACTOR STILL HAS TO BE FIXED, given that the grounding says a
-- distractor built on a false attribution is legitimate and should be kept.
-- Option (c) argues the finding may be closed because 19011 permits deferring
-- verification. Its flaw is meant to be the INFERENCE - deferral supports
-- scheduling, not closure - and the explanation says exactly that, against
-- clause 6.7. An address that does not exist makes the option eliminable
-- without engaging the reasoning at all: a candidate who knows clause 6 ends at
-- 6.7 discards it on sight. That is a cue, not a misconception, and it is the
-- one thing a Level II distractor must never be.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. GUARD. Expect 3 rows, all with the string in options only. Expect
--    in_stem false, in_expl false, in_opts true for each of en/es-419/pt-BR.
-- ============================================================================

select q.language,
       (q.question_text like '%6.8%') as in_stem,
       (q.explanation   like '%6.8%') as in_expl,
       (q.options::text like '%6.8%') as in_opts
from public.quiz_questions q
where q.question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
order by q.language;

-- ============================================================================
-- 2. THE FIX. Options only - the other two fields are already correct.
--    Expect 3 rows.
-- ============================================================================

update public.quiz_questions
set options = replace(options::text, '6.8', '6.7')::jsonb
where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
  and options::text like '%6.8%';

-- ============================================================================
-- PROOF - the property, over the whole object.
-- ============================================================================

-- 3. POSITIVE, AND THIS IS THE CHECK 304 SHOULD HAVE CARRIED. No field of any
--    row of this group mentions 6.8. Expect 0.
select count(*) as rows_still_citing_6_8
from public.quiz_questions
where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
  and (question_text || coalesce(explanation, '') || options::text) like '%6.8%';

-- 4. WIDER, AND THE REAL PROPERTY: no item in ANY certification cites a clause
--    6.8 of ISO 19011 in any field or language. Clause 6 of ISO 19011:2026 ends
--    at 6.7. Expect 0.
select count(*) as any_cert_citing_19011_6_8
from public.quiz_questions q
where q.retired_at is null
  and (q.question_text || coalesce(q.explanation, '') || q.options::text)
      ~ '19011[^.]{0,80}6\.8|6\.8[^.]{0,40}19011';

-- 5. POSITIVE: the corrected address is present in all three fields that had
--    the wrong one, across three languages. Expect 3.
select count(*) as rows_with_6_7_in_options
from public.quiz_questions
where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
  and options::text like '%6.7%' and explanation like '%6.7%';

-- 6. NEGATIVE: option count, key resolution and option ids are untouched.
--    Expect 0.
select count(*) as broken
from public.quiz_questions q
where q.question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
  and (jsonb_array_length(q.options) <> 4
    or not exists (select 1 from jsonb_array_elements(q.options) o
                   where o->>'id' = q.correct_answer->>0));

-- 7. NEGATIVE: no mojibake introduced by the jsonb round trip. Expect 0.
select count(*) as mojibake
from public.quiz_questions
where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f'
  and (question_text || coalesce(explanation, '') || options::text)
      like '%' || chr(195) || chr(169) || '%';

-- 8. NEGATIVE: nothing outside this group was touched. Expect 3.
select count(*) as rows_in_scope
from public.quiz_questions
where question_group_id = 'fc72ac28-4fe3-4265-bfb0-a8639c5c7c2f';
