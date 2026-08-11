-- 198_isms_ia_principle_attribution.sql
--
-- FOUR ROWS TELL THE ITEM GENERATOR TO WRITE THE DEFECT THE CERT TEACHES AGAINST.
--
-- The first Level II dry run on task 1.2 produced a key reading:
--
--   "Risk-based approach governs: ISO 19011 requires risk to substantively
--    influence audit effort, so concentrate remaining hours on the higher-risk
--    process."
--
-- Two faults in one sentence - a precedence claim, and "requires" over a
-- document that requires nothing. The AUDIT grounding forbids both explicitly.
-- The model wrote it anyway, and it was right to: three rows more specific than
-- the grounding told it to.
--
-- WHAT THE STANDARD ACTUALLY SAYS, read from ISO 19011:2026 directly:
--
--   * The words "precedence", "hierarchy" and "rank" appear NOWHERE in the
--     document. Clause 4.1 says only that adherence to the principles is
--     fundamental, and that Clauses 5 to 7 are based on the seven outlined in
--     4.2 to 4.8. It makes no statement about ranking in either direction.
--
--   * The document contains ONE instance of "shall" and it is boilerplate about
--     ISO patent rights. There are 264 instances of "should". Clause 1 Scope:
--     "This document gives guidance on auditing management systems."
--
-- So "the standard states no precedence" and "the fair presentation principle
-- requires" are both false attributions - asserting the document contains claims
-- it does not make. The SUBSTANCE was right in both cases. The attribution was
-- not, and that distinction is the entire competence this credential certifies.
--
-- THE CERT ALREADY KNEW. Concept ia-no-certification-to-19011 reads "Because ISO
-- 19011 states no requirements, there is nothing to certify against." Two of its
-- siblings contradict it. This migration makes the set internally consistent.
--
-- AND THE TASK ASKS THE WRONG QUESTION. Task 1.2 says "determine which principle
-- GOVERNS", its skills line says "identify which principle is DECISIVE" - while
-- one of its own concepts says none is. The generator was handed two
-- incompatible instructions and produced both kinds of key across runs. Restated
-- here to ask what the lessons actually teach: how an auditor RESOLVES the
-- situation. That is a genuine analyze-level competence; "which one wins" is not,
-- because none does.
--
-- A sweep of ISMS-F, AIMS-F and AIGRM-I for the same pattern found nothing. The
-- defect is contained to this cert.
--
-- No items exist for ISMS-IA yet, so nothing downstream needs regenerating.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. The precedence claim. The second sentence was already correct; the first
--    asserted a statement the standard does not make.
-- ============================================================================

update public.concepts con
set description = 'ISO 19011:2026 presents the seven principles without ranking them: clause 4.1 says only that adherence to them is fundamental, and that Clauses 5 to 7 are based on the seven outlined in 4.2 to 4.8. It states nothing about precedence in either direction - the words precedence, hierarchy and rank do not appear in the document. Where two principles engage a situation differently, nothing in the text decides between them and the auditor weighs them.'
from public.certifications c
where c.id = con.certification_id and c.code = 'ISMS-IA'
  and con.slug = 'ia-principles-carry-no-precedence';

-- ============================================================================
-- 2. The modal. Clause 4.3 uses "should" - every principle does.
-- ============================================================================

update public.concepts con
set description = 'The fair presentation principle in ISO 19011:2026 clause 4.3 says audit findings, conclusions and reports should reflect the auditing activities truthfully and accurately, and that the communication should be truthful, accurate, objective, timely, clear and complete. Like every principle in clause 4 it is expressed as a should, not a shall - ISO 19011 is a guidance document and contains no requirements. The statement records what was found; it does not prescribe the remedy or characterise the auditee.'
from public.certifications c
where c.id = con.certification_id and c.code = 'ISMS-IA'
  and con.slug = 'ia-statement-objectivity';

-- ============================================================================
-- 3. The framing. "which governs" presupposes a winner the standard does not
--    name. What the auditor actually does is establish which principles are
--    engaged and reason to a defensible resolution.
-- ============================================================================

update public.concepts con
set description = 'A single audit situation can engage several principles at once. The auditor first determines which are actually engaged - not every principle bears on every situation - and then reasons to a defensible resolution, because nothing in the text ranks one above another.'
from public.certifications c
where c.id = con.certification_id and c.code = 'ISMS-IA'
  and con.slug = 'ia-principle-interaction-in-practice';

update public.tasks t
set statement = 'Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions.',
    skills    = 'Given a situation where two principles pull against each other, identify which are engaged and state what a defensible resolution weighs.'
from public.certifications c
where c.id = t.certification_id and c.code = 'ISMS-IA' and t.code = '1.2';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 4. No ISMS-IA concept claims a guidance document states or requires anything.
--    Expect only ia-isms-specific-auditor-competence ("offers guidance") and
--    ia-no-certification-to-19011 ("states no requirements") - both correct.
select con.slug, left(con.description, 110) as description
from public.concepts con
join public.certifications c on c.id = con.certification_id
where c.code = 'ISMS-IA'
  and con.description ~* '(19011|17021|27007|27000)[^.]{0,60}\m(requires|mandates|states no|shall)\M'
order by con.slug;

-- 5. No ISMS-IA task or concept frames the principles as having a winner.
--    Expect one row: task 1.5, where "governs" correctly describes what
--    ISO/IEC 17021-1 does over certification-body conduct.
select 'task' as kind, t.code, left(t.statement, 110) as text
from public.tasks t join public.certifications c on c.id = t.certification_id
where c.code = 'ISMS-IA'
  and (t.statement ~* '\m(governs|decisive|overrides|takes precedence)\M'
       or t.skills ~* '\m(governs|decisive|overrides)\M')
union all
select 'concept', con.slug, left(con.description, 110)
from public.concepts con join public.certifications c on c.id = con.certification_id
where c.code = 'ISMS-IA'
  and con.description ~* '\m(governs|decisive|overrides|takes precedence)\M'
order by kind, code;

-- 6. Task 1.2 reads as intended.
select t.code, t.statement, t.skills, t.bloom_level
from public.tasks t join public.certifications c on c.id = t.certification_id
where c.code = 'ISMS-IA' and t.code = '1.2';
