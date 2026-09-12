-- 303_isms_ia_19011_edition.sql
--
-- ISMS-IA'S SECURE BANK CITES A SUPERSEDED EDITION OF ITS OWN METHOD STANDARD.
--
-- 63 secure items (189 rows across three languages) cite ISO 19011:2018. The
-- practice bank of the same certification, same bank_revision, same day, cites
-- ISO 19011:2026 in 180 items and 2018 in none.
--
-- WHY, AND IT IS NOT A MISSING SOURCE. Commit 91de93e (2026-08-11 05:19 UTC)
-- gave draftSystem the full 2026 edition set, including the line "NEVER cite
-- ISO 19011:2018 - it is superseded". Routing was correct: ISMS-IA's name
-- matches /auditor|internal audit/ and resolves to AUDIT. The secure run began
-- at 05:27 UTC, eight minutes later, fully grounded.
--
-- groundingFor() was called EXACTLY ONCE in item-pipeline.mjs - inside
-- draftSystem. critiqueSystem did not receive it. And critique rule 7 is
-- FALSE ATTRIBUTION: it instructs the reviewer to rewrite any key or
-- explanation that misattributes a claim, and it names ISO 19011 with no
-- edition. So the one stage with authority over citations had no edition
-- knowledge, and reverted the drafter's 2026 to its own training data.
--
-- Commit e7b161a (2026-08-11 20:59:54 UTC) fixed it, and says so:
--   "critiqueSystem receives the cert's grounding. The reviewer was rejecting
--    correct ISO 19011:2026 citations as false attribution from its own
--    training data - the drafter had the edition set, the reviewer did not."
--
-- ALL 304 ISMS-IA SECURE ITEMS PREDATE THAT COMMIT (last 19:44:33 UTC). ALL 380
-- PRACTICE ITEMS POSTDATE IT (first 21:04:46 UTC). ISMS-IA is the only
-- certification the commit splits. Nobody went back for the 304.
--
-- THE CRITIC CHANGED THE LABEL, NOT THE SUBSTANCE, AND THAT IS WHY THIS
-- MIGRATION IS A RELABEL AND NOT A REWRITE. Every cited location was verified
-- against the 2026 text before this file was written:
--
--   Annex A is informative        -- "Annex A (informative)", contents page
--   A.6 / A.6.2 / A.6.3 sampling  -- present, judgement-based at A.6.2
--   A.16 remote auditing methods  -- names data security, confidentiality and
--                                    "contingency plans due to technology failure"
--   clause 3.4 remote auditing method, Note 2 covers virtual locations
--   clause 4.7 evidence-based     -- "An appropriate use of sampling should be
--                                    applied, since this is closely related to
--                                    the confidence that can be placed in the
--                                    audit conclusions"
--   clause 5.4.4 g)               -- availability of ICT
--   clause 5.5.3                  -- "Audits can be performed on-site, remotely
--                                    or as a combination"
--   clause 6.7                    -- "The completion and effectiveness of these
--                                    actions should be verified"
--   clause 7.2.3.2 a) item 10     -- appropriateness and consequences of using
--                                    ICT and emerging technology, naming
--                                    AI-based evaluation tools
--
-- All 23 distinct locations cited by the 63 exist in 2026 with matching subject.
--
-- THREE OF THE 63 WERE WRONG RATHER THAN DATED, AND THE RELABEL REPAIRS THEM
-- TOO. Tasks 2.4 (x2) and 3.3 attribute to the 2018 edition content the 2026
-- foreword says the fourth edition ADDED: "expansion of Annex A to provide
-- guidance on remote auditing methods and virtual locations". One of them
-- paraphrases clause 3.4, whose definition is tagged
-- [SOURCE: ISO/IEC TS 17012:2024] - six years after the edition it cited.
-- Under the 2018 label those three assert something false. Under the 2026 label
-- they are correct as written. No option or stem text needs to change.
--
-- WHAT THIS MIGRATION DOES NOT FIX. 15 secure rows assert "ISO 19011 requires".
-- The grounding forbids that - ISO 19011 is guidance, 264 "should" and no
-- operative "shall". It is a MODAL defect, not an edition defect, it survives
-- the e7b161a fix (AIMS-IA's post-fix secure bank has 11 of 172), and it is
-- left for its own change. Some hits are distractors, where a false attribution
-- is legitimate by design, so the 15 is an upper bound needing a human read.
--
-- ASCII, AND NO ACCENTED TEXT TRAVELS. Both statements are replacements on
-- content already in the database; every search and replacement string is
-- ASCII. Unlike migration 201, which pasted Spanish and Portuguese literals
-- through the editor, nothing multibyte crosses the clipboard here.
--
-- Run in the Supabase SQL editor, one block at a time.

-- ============================================================================
-- 1. GUARD. Expect exactly: 2018 = 189 rows / 63 groups, unversioned-with-a-
--    clause-token = 102 rows, already-2026 = 18 rows.
--    Nothing else in this bank carries the string "2018" at all.
-- ============================================================================

with s as (
  select q.question_group_id as grp, q.language, q.explanation,
    q.question_text||' '||coalesce(q.explanation,'')||' '||q.options::text as txt
  from public.quiz_questions q
  join public.certifications c on c.id = q.certification_id
  where c.code = 'ISMS-IA' and q.pool = 'secure'
    and q.retired_at is null and q.status = 'approved'
)
select
  count(*) filter (where txt like '%ISO 19011:2018%') as rows_2018,
  count(distinct grp) filter (where txt like '%ISO 19011:2018%') as groups_2018,
  count(*) filter (where txt ~ '19011' and txt !~ '19011:20'
    and txt ~ '(clause|Annex|cl.usula|apartado|Anexo|item|.tem)[[:space:]]*[0-9A]'
    and explanation ~ 'ISO 19011') as rows_unversioned_clause,
  count(*) filter (where txt like '%ISO 19011:2026%') as rows_2026,
  count(*) filter (where txt like '%2018%' and txt not like '%ISO 19011:2018%') as rows_other_2018,
  count(*) filter (where txt ~* '(third|fourth)[[:space:]]+edition') as rows_edition_ordinal
from s;

-- ============================================================================
-- 2. RELABEL. 2018 -> 2026 across stem, explanation and options.
--    Expect 189 rows.
-- ============================================================================

update public.quiz_questions q set
  question_text = replace(q.question_text, 'ISO 19011:2018', 'ISO 19011:2026'),
  explanation   = replace(q.explanation,   'ISO 19011:2018', 'ISO 19011:2026'),
  options       = replace(q.options::text,  'ISO 19011:2018', 'ISO 19011:2026')::jsonb
from public.certifications c
where c.id = q.certification_id
  and c.code = 'ISMS-IA' and q.pool = 'secure'
  and q.retired_at is null and q.status = 'approved'
  and (q.question_text||coalesce(q.explanation,'')||q.options::text) like '%ISO 19011:2018%';

-- ============================================================================
-- 3. NAME THE EDITION where an unversioned item makes a clause-specific claim.
--
--    EXPLANATION ONLY, AND FIRST OCCURRENCE ONLY. regexp_replace without the
--    'g' flag replaces once. All 34 groups carry a bare mention in the
--    explanation in all three languages, so this reaches every one of them
--    without touching a stem or an option.
--
--    Why not the stem: task 1.5's stem quotes a fabricated credential, an
--    "ISO 19011 Certification". Stamping an edition inside invented marketing
--    copy would be an error, and it is the reason this is not a blanket sweep.
--
--    Why not every mention: the six items that already cite 2026 correctly
--    carry 13 bare mentions between them. Label once, then refer bare, is the
--    house style of the items the fixed pipeline produced.
--
--    The 45 unversioned items that make only generic claims about what
--    ISO 19011 IS are deliberately untouched - those claims are edition-neutral.
--
--    Expect 102 rows.
-- ============================================================================

update public.quiz_questions q set
  explanation = regexp_replace(q.explanation, 'ISO 19011(?!:)', 'ISO 19011:2026')
from public.certifications c
where c.id = q.certification_id
  and c.code = 'ISMS-IA' and q.pool = 'secure'
  and q.retired_at is null and q.status = 'approved'
  and q.explanation ~ 'ISO 19011'
  and (q.question_text||' '||coalesce(q.explanation,'')||' '||q.options::text) ~ '19011'
  and (q.question_text||' '||coalesce(q.explanation,'')||' '||q.options::text) !~ '19011:20'
  and (q.question_text||' '||coalesce(q.explanation,'')||' '||q.options::text)
      ~ '(clause|Annex|cl.usula|apartado|Anexo|item|.tem)[[:space:]]*[0-9A]';

-- ============================================================================
-- PROOF - both directions. The positive half alone would pass on a sweep that
-- also labelled the 45 edition-neutral items, which is the failure this names.
-- ============================================================================

-- 4. POSITIVE: no ISMS-IA row anywhere still cites the superseded edition.
--    Expect 0.
select count(*) as rows_still_2018
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.retired_at is null
  and (q.question_text||coalesce(q.explanation,'')||q.options::text) like '%ISO 19011:2018%';

-- 5. BOTH HALVES ON ONE ROW. Of the 444 secure rows citing ISO 19011:
--    309 must now name 2026 (18 already correct + 189 relabelled + 102 named),
--    and 135 must STILL be unversioned. Expect 309 / 135 / 444.
select
  count(*) filter (where txt like '%ISO 19011:2026%') as rows_labelled_2026,
  count(*) filter (where txt ~ '19011' and txt !~ '19011:20') as rows_still_unversioned,
  count(*) as rows_citing_19011
from (
  select q.question_text||' '||coalesce(q.explanation,'')||' '||q.options::text as txt
  from public.quiz_questions q
  join public.certifications c on c.id = q.certification_id
  where c.code = 'ISMS-IA' and q.pool = 'secure'
    and q.retired_at is null and q.status = 'approved'
    and (q.question_text||' '||coalesce(q.explanation,'')||' '||q.options::text) ~ '19011'
) z;

-- 6. NEGATIVE: no doubled edition label anywhere. Expect 0.
--
-- THIS CHECK WAS WRONG ON THE FIRST RUN AND RETURNED 5. It read
--   like '%19011:2026:%'
-- which matches an ordinary sentence colon after the label - "misreads
-- ISO 19011:2026: feasibility is assessed before and during the audit". All
-- five hits were correct prose, in both relabelled and untouched rows.
--
-- The property is a SECOND YEAR, not a second colon. Searching for a string
-- when the property is a place is the recurring guard defect in CLAUDE.md, and
-- this is another instance of it. Corrected form below; it returns 0.
select count(*) as doubled_year
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.retired_at is null
  and (q.question_text||coalesce(q.explanation,'')||q.options::text) ~ 'ISO 19011:[0-9]{4}:[0-9]{4}';

-- 6b. NEGATIVE, sharper: no edition of ISO 19011 other than 2026 survives
--     anywhere in the certification, in any pool or language. Expect 0.
select count(*) as any_non_2026_edition
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.retired_at is null
  and (q.question_text||coalesce(q.explanation,'')||q.options::text) ~ 'ISO 19011:(?!2026)[0-9]{4}';

-- 7. NEGATIVE: no multibyte corruption introduced. Expect 0.
select count(*) as mojibake
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.retired_at is null
  and ((q.question_text||coalesce(q.explanation,'')||q.options::text) like '%' || chr(226) || chr(8364) || '%'
    or (q.question_text||coalesce(q.explanation,'')||q.options::text) like '%' || chr(195) || chr(169) || '%');

-- 8. NEGATIVE: every key still resolves to an option that exists. Expect 0.
select count(*) as orphan_keys
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.retired_at is null
  and not exists (select 1 from jsonb_array_elements(q.options) o
                  where o->>'id' = q.correct_answer->>0);

-- 9. The three that were wrong rather than dated now read 2026. Expect 9 rows,
--    tasks 2.4 / 2.4 / 3.3, three languages each.
select t.code as task, q.language, left(q.explanation, 90) as explanation_head
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
left join public.tasks t on t.id = q.task_id
where c.code = 'ISMS-IA' and q.pool = 'secure' and q.retired_at is null
  and (q.question_text||coalesce(q.explanation,'')||q.options::text) ~* 'Annex[[:space:]]+A\.16'
order by t.code, q.language;
