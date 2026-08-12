-- 205_aims_ia_scaffold.sql
--
-- AIMS-IA (ISO/IEC 42001:2023 Internal Auditor) - certification row, 5 domains, 40 tasks.
--
-- GENERATED FROM AIMS-IA_JTA_v1_1.md (v1.1-LOCKED), NOT TRANSCRIBED ALONGSIDE IT.
-- Every statement, KSA field, weight and bloom level below was parsed out of the locked
-- JTA. A JTA that contradicts itself fails to generate rather than producing a database
-- that quietly disagrees with the published blueprint - which is how the stale domain
-- heading weights (D3 22.50, D4 27.50) were caught before they reached a row.
--
-- CONCEPTS AND task_concepts ARE DELIBERATELY NOT HERE. They are migration 206.
-- CERT-CREATION Stage 6 specifies a single scaffold migration; this splits it, because
-- the 158 concept descriptions carry a different KIND of risk. A wrong task row fails
-- loudly. A concept description more specific than the standard passes every gate, and
-- the generator then writes the defect faithfully - which is what migration 198 had to
-- repair on ISMS-IA. That half deserves its own read against the standards and its own
-- attribution proofs. Modules are migration 207.
--
-- exam_duration_minutes IS NULL ON PURPOSE. SCHEME-AIMS-IA.md section 6 forbids
-- inheriting ISMS-IA's 150 minutes: this scheme sits at 69.48 pct analyze against 65.60,
-- so the reading load the 150 was measured from does not transfer. A provisional number
-- that works is a number nobody re-measures. NULL is visible, and the cert is draft.
-- PUBLICATION GATE: non-null, derived from this bank's own measured item lengths.
--
-- Run in the Supabase SQL editor. Blocks are separated so they can be run one at a time.
-- ============================================================================

-- 1. Certification row.
--    id is a generated v4. The repeating-digit slots are retired: the rubric does not scale past a dozen certs and recent certs already use v4. category_slug
--    matches AIMS-F, not ISMS-IA: ISO/IEC 42001 is not a security standard. The NAME is load-bearing - the
--    item generator routes grounding on it (/auditor/ then /42001/), so renaming this
--    without updating scripts/lib/item-grounding.mjs would generate 42001 items grounded
--    in ISO/IEC 27001 editions.
insert into public.certifications (
  id, code, name, provider, description, price_usd, tier, sort_order, status,
  category_slug, difficulty_level, issuer_id, validity_days, num_questions,
  passing_score_pct, exam_duration_minutes, max_exam_attempts, attempt_window_months,
  exam_blueprint
) values (
  '4818fc03-6da0-4266-9329-0e1ea2ea3fb4',
  'AIMS-IA',
  'ISO/IEC 42001:2023 Internal Auditor',
  'Certidemy',
  'Certifies that the holder can plan and conduct an internal audit of an AI management system against ISO/IEC 42001:2023, applying ISO 19011:2026 audit methodology, and can write findings that survive challenge. The two documents do different jobs and the credential turns on keeping them apart: ISO 19011 is the method and states no requirements, while ISO/IEC 42001 is the criteria a finding is raised against. The scheme also tests what makes an AI management system different from an information security one - the AI system impact assessment as a required artifact distinct from the risk assessment, and the layered normativity of Annex A and Annex B. The candidate audits their own organization; they do not make certification decisions.',
  0, 2, 4, 'draft',
  'governance-service-management', 2,
  'b2b35e1e-fb05-484d-9065-5deeb400492a',
  730,      -- 2 years; SCHEME section 9 - same number as ISMS-IA, opposite argument
  50,
  75.00,
  NULL,     -- exam_duration_minutes: see header
  6, 12,
  '{
    "version": "2.0",
    "basis": "Certidemy Cognitive Model v2.0: an item''s cognitive level EQUALS its task''s declared level, so the form''s profile is a computed consequence of the JTA, not a target asserted over it.",
    "assembly": {
      "balance": "difficulty spread within each task''s items",
      "cognition": "follows automatically: every item carries its task''s bloom_level, so a domain-proportional draw reproduces cognitive_profile without needing to enforce it",
      "sample_by": "domain weight_pct, then across tasks within each domain"
    },
    "item_model": {
      "tier": "II",
      "format": "single best answer among four defensible options",
      "scoring": "dichotomous - one key, no partial credit",
      "contract": "All four options are defensible on the facts given. The best answer must be better than the second-best for a reason a competent auditor could state in one sentence; the second-best must be genuinely defensible rather than merely wrong. An item whose second choice is incorrect is a Level I item in the wrong bank.",
      "cue_guard": "Character-based. The guard measures the key''s length against the longest distractor, and the spread across all options, in CHARACTERS, applying the tolerance declared in cue_tolerance. It does NOT measure qualification density. ISMS-IA''s blueprint says it does; that description is wrong and is a known open item. Stated accurately here so no reader acts on a control that has never existed.",
      "cue_tolerance": {
        "status": "PROVISIONAL - NOT YET MEASURED ON THIS BANK",
        "declared_on": "2026-08-12",
        "key_len_margin": 25,
        "key_len_pct": 15,
        "len_spread_max": 100,
        "measured_over": null,
        "rationale": "Level II. The best option is frequently best BECAUSE it carries a qualifying clause the others do not, so the Level I default (5 chars / 10 pct) rejects correct items and retains flat ones. A declaration must exist before generation or the generator silently falls back to that default. These three numbers are ISMS-IA''s, adopted unmeasured as a starting point ONLY - they are NOT evidence for this bank. Re-measure over AIMS-IA secure/en once the bank exists and re-declare with measured_over populated. The check that matters is strict-longest near 25 pct, not near 40."
      },
      "task_4_12_sampling": "The bank for task 4.12 must deliberately reach control families A.4 (resources for AI systems), A.6 (AI system life cycle) and A.7 (data for AI systems), not only A.2 and A.3. See SCHEME-AIMS-IA.md section 8.3."
    },
    "computed_at": "2026-08-12",
    "derived_from": "tasks.bloom_level x domains.weight_pct over exam-scope tasks (see public.v_cognitive_profile)",
    "task_counts": {
      "3_apply": 7,
      "4_analyze": 28,
      "2_understand": 5
    },
    "cognitive_profile": {
      "3_apply": 17.5,
      "4_analyze": 69.48,
      "2_understand": 13.02
    },
    "difficulty_mix": {
      "easy": 30,
      "moderate": 50,
      "hard": 20
    },
    "difficulty_note": "Difficulty is orthogonal to cognitive level. An easy Analyze item and a hard Analyze item are both Analyze items. Items are made harder by subtler content, closer distractors, or less familiar situations - NEVER by raising the cognitive level."
  }'::jsonb
);

-- ============================================================================
-- 2. Domains. The weights-sum constraint trigger is DEFERRABLE INITIALLY DEFERRED,
--    so all five must land together; they do, as one statement.
insert into public.domains (certification_id, code, title, description, weight_pct, order_index) values
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'D1', 'The internal audit function and its boundaries',
   'Who the internal auditor is, what governs their work, and what does not. Establishes ISO 19011 as method and ISO/IEC 42001 as criteria, the seven principles and how they interact, and the boundary against certification-body activity. Without this, every downstream judgment rests on borrowed assumptions.',
   12.50, 1),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'D2', 'Audit programme management',
   'The programme above the individual audit: objectives, risks, resources, competence, scope, methods, monitoring and improvement. ISO 19011:2026 clause 5 throughout, with the AIMS-specific twist that programme scope depends on which roles the organization holds toward its AI systems.',
   20.00, 2),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'D3', 'Conducting the audit: evidence, sampling and testing',
   'The individual audit from initiation to completion - ISO 19011:2026 clause 6 and Annex A. Domain 3 is about the *quality of the evidence*: whether it was gathered soundly, sampled defensibly and verified. Whether it satisfies a particular requirement is Domain 4.',
   20.00, 3),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'D4', 'Auditing the AIMS against ISO/IEC 42001 as criteria',
   'The largest domain, and where this cert diverges from its ISMS sibling. Testing the management system clause by clause, with the layered normativity of Annex A and Annex B, the role-based scope, and the AI system impact assessment as a required artifact with no ISO/IEC 27001 equivalent.',
   30.00, 4),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'D5', 'Findings, reporting, follow-up and management review',
   'Turning evidence into findings that survive challenge, reporting them to the people who can act, and closing the loop through corrective action and management review. Where Domain 4 asks whether a requirement is met, Domain 5 asks whether the statement saying so is defensible.',
   17.50, 5);

-- ============================================================================
-- 3. Tasks. criticality and frequency follow ISMS-IA's vocabulary exactly: high|medium
--    and weekly|occasional. The JTA marks tasks 4.6, 4.9 and 5.4 'Highest' - editorial
--    emphasis with no enum value. It lands as 'high'; the emphasis is carried by D4's
--    weight and by SCHEME section 4.2 naming those tasks as the differentiators.
--
--    Domain ids come from a JOIN, not a scalar subquery inside VALUES: a join fails
--    loudly on a missing domain instead of inserting a null.
insert into public.tasks (
  certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
  is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index)
select '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'::uuid, dom.id, v.code, v.statement,
       v.criticality::criticality, v.frequency::task_frequency, v.bloom_level::bloom_level,
       true, false, v.knowledge, v.skills, v.abilities, v.order_index
from (values
  ('D1', '1.1',
   'Classify a described audit engagement as first, second or third party and locate the internal auditor''s remit within it',
   'high', 'occasional', '3_apply',
   'ISO 19011:2026 Table 1 - first party is internal audit, second party is external-provider or interested-party audit, third party is certification audit or accreditation assessment. Clause 3.1 Notes 1-2.',
   'Place a described engagement in the correct category.',
   'Resisting the assumption that "audit" means an outsider with a certificate.',
   1),
  ('D1', '1.2',
   'Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions',
   'high', 'weekly', '4_analyze',
   'The seven principles at 4.2-4.8. Clause 4.1 states adherence is fundamental and that Clauses 5 to 7 are based on them; it states nothing about ranking.',
   'Identify which principles a situation actually engages - not every principle bears on every situation - and state what a defensible resolution weighs.',
   'Tolerating that the text does not decide it for you.',
   2),
  ('D1', '1.3',
   'Apply the distinction between ISO 19011 as methodology and ISO/IEC 42001 as criteria to a proposed audit finding',
   'high', 'weekly', '3_apply',
   'ISO 19011:2026 contains one shall (patent boilerplate) and 264 should; clause 1 says it gives guidance. It has no normative references and names no management-system standard. 42001 names it once, in a Note to entry at 3.18.',
   'Given a proposed finding, identify whether the criterion cited is capable of being a criterion at all.',
   'Refusing to write "ISO 19011 requires".',
   3),
  ('D1', '1.4',
   'Analyze how an internal auditor preserves objectivity where independence from the audited activity is not practicable',
   'high', 'weekly', '4_analyze',
   'ISO 19011:2026 clause 4.6 asks auditors to be independent of the activity audited wherever practicable and, where internal auditors cannot be, to make every effort to remove bias and encourage objectivity. ISO/IEC 42001 clause 9.2.2 b) asks the organization to select auditors and conduct audits to ensure objectivity and the impartiality of the audit process.',
   'Evaluate proposed safeguards where the only competent person also built the thing.',
   'Naming one''s own conflict rather than working around it.',
   4),
  ('D1', '1.5',
   'Classify activities in a described audit programme as within or outside the internal auditor''s remit',
   'medium', 'occasional', '3_apply',
   'ISO 19011:2026 states that ISO/IEC 17021-1 provides the requirements for third-party certification audits. ISO/IEC 42006:2025 supplements 17021-1 with AI-specific requirements for bodies auditing and certifying an AIMS. Neither applies to the candidate.',
   'Identify which activities in a described programme fall outside the internal auditor''s remit.',
   'Not importing certification-audit habits into a first-party programme.',
   5),
  ('D2', '2.1',
   'Explain the objectives an AIMS audit programme serves and how they derive from organizational context',
   'high', 'occasional', '2_understand',
   'ISO 19011:2026 clause 5.2. The distinction between programme-level and audit-level objectives.',
   'Trace a stated programme objective back to a contextual driver.',
   'Treating the programme as a designed thing, not a calendar.',
   6),
  ('D2', '2.2',
   'Analyze how audit programme risks and opportunities shape its scope and resourcing',
   'high', 'weekly', '4_analyze',
   'Clauses 5.3 and 5.4.4. The risk-based approach at 4.8 "should substantively influence the planning and implementation of the audit programme".',
   'Given constrained hours, justify where audit effort concentrates.',
   'Accepting that concentrating effort means accepting thinner coverage elsewhere, and saying so.',
   7),
  ('D2', '2.3',
   'Determine the competence an AIMS audit team requires given the AI systems in scope',
   'high', 'occasional', '4_analyze',
   'ISO 19011:2026 clauses 5.4.2, 7.2.3, 7.2.4. The distinction between an auditor and a technical expert on the team.',
   'Identify the competence gap a given AI system creates and select a remedy that does not compromise objectivity.',
   'Admitting where one cannot competently evaluate the evidence.',
   8),
  ('D2', '2.4',
   'Analyze how audit programme scope is set when the organization holds more than one role toward its AI systems',
   'high', 'occasional', '4_analyze',
   'ISO/IEC 42001 clause 4.1 has the organization consider the intended purpose of AI systems it develops, provides or uses, and determine its roles with respect to them. Clause 4.3 scoping follows.',
   'Given a described estate, determine which roles are in play - including where one organization holds more than one role on a single AI system, such as fine-tuning a third-party model and then providing it to customers - and determine what the programme must therefore cover.',
   'Not collapsing "we use AI" into a single undifferentiated role.',
   9),
  ('D2', '2.5',
   'Determine the objectives, scope and criteria for an individual AIMS audit',
   'high', 'weekly', '4_analyze',
   'ISO 19011:2026 clause 5.5.2. ISO/IEC 42001 clause 9.2.2 a) has the organization define the audit objectives, criteria and scope for each audit.',
   'Write a scope statement that a finding can later be tested against.',
   'Precision at the outset rather than at the report stage.',
   10),
  ('D2', '2.6',
   'Select auditing methods appropriate to AI system evidence, including remote methods and virtual locations',
   'medium', 'occasional', '4_analyze',
   'ISO 19011:2026 clause 5.5.3 and Annex A.16; the fourth edition expanded this from ISO/IEC TS 17012. Much AIMS evidence has no physical location.',
   'Match method to evidence type and justify the choice.',
   'Not defaulting to on-site as the rigorous option or remote as the convenient one.',
   11),
  ('D2', '2.7',
   'Explain how audit programme results are monitored, reviewed and improved',
   'medium', 'occasional', '2_understand',
   'ISO 19011:2026 clauses 5.5.6, 5.5.7, 5.6, 5.7.',
   'Identify what a programme review should examine.',
   'Treating the programme itself as subject to improvement.',
   12),
  ('D3', '3.1',
   'Place a described audit activity at its correct point in the sequence from initiation to completion',
   'high', 'weekly', '3_apply',
   'ISO 19011:2026 clauses 6.2 to 6.6, including 6.2.3 feasibility.',
   'Place a described activity at the correct point in the sequence.',
   'Following a sequence without treating it as a script.',
   13),
  ('D3', '3.2',
   'Analyze whether the review of documented information supports proceeding to further audit activities',
   'high', 'weekly', '4_analyze',
   'ISO 19011:2026 clauses 6.3.1, 6.3.2, 6.3.4 and Annex A.13.',
   'Judge whether what was supplied is enough to plan against, and what to do when it is not.',
   'Raising an obstacle early rather than absorbing it.',
   14),
  ('D3', '3.3',
   'Determine an appropriate sampling approach for AIMS audit evidence',
   'high', 'weekly', '4_analyze',
   'ISO 19011:2026 Annex A.6, including A.6.2 and A.6.3.',
   'Choose an approach that fits the population and state what the sample can and cannot support.',
   'Not generalizing beyond what was sampled.',
   15),
  ('D3', '3.4',
   'Analyze whether information collected constitutes verified audit evidence',
   'high', 'weekly', '4_analyze',
   'ISO 19011:2026 clause 6.4.7, Annex A.5, and the evidence-based principle at 4.7. Only verifiable information can be audit evidence.',
   'Separate what was demonstrated from what was described.',
   'Declining to record an assertion as evidence because the person was credible.',
   16),
  ('D3', '3.5',
   'Determine what to ask and how to record it when interviewing personnel involved in AI system work',
   'high', 'weekly', '4_analyze',
   'ISO 19011:2026 Annex A.17 ("Conducting interviews"), and clause 6.4.4 on communication during the audit.',
   'Frame questions that surface evidence rather than agreement, and confirm what was recorded.',
   'Interviewing a specialist without deferring to them or posturing against them.',
   17),
  ('D3', '3.6',
   'Analyze the sufficiency of evidence obtained through remote auditing methods',
   'medium', 'occasional', '4_analyze',
   'ISO 19011:2026 Annex A.16 and clause 6.4.5 on access to audit information.',
   'Judge whether a remotely demonstrated control was actually verified.',
   'Naming the limits of what a screen share showed.',
   18),
  ('D3', '3.7',
   'Select sources of information appropriate to an AIMS audit',
   'medium', 'weekly', '3_apply',
   'ISO 19011:2026 Annex A.14. AIMS-specific sources: data documentation, tooling and computing resource records, impact assessment outputs, event logs.',
   'Choose the source that answers the question being asked.',
   'Going to the record rather than the summary of the record.',
   19),
  ('D3', '3.8',
   'Explain the purpose and conduct of the opening and closing meetings',
   'medium', 'weekly', '2_understand',
   'ISO 19011:2026 clauses 6.4.2, 6.4.3, 6.4.10.',
   'Identify what belongs in each meeting.',
   'Setting expectations rather than assuming them.',
   20),
  ('D4', '4.1',
   'Analyze whether the organization''s determination of its roles toward its AI systems is adequately evidenced',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clause 4.1 - determine external and internal issues, consider the intended purpose of AI systems developed, provided or used, determine the organization''s roles.',
   'Distinguish a reasoned determination - one that names the systems, applies the developer / provider / user categories to each, and records why - from a bare assertion that "we use AI tools". The first is auditable; the second is not.',
   'Pressing on a scope decision that was inherited rather than made.',
   21),
  ('D4', '4.2',
   'Analyze whether the AIMS scope statement is defensible given the AI systems and roles determined',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clauses 4.2 and 4.3.',
   'Identify a system or activity that the stated scope excludes without justification.',
   'Treating a scope statement as testable rather than as given.',
   22),
  ('D4', '4.3',
   'Determine whether leadership and AI policy requirements are evidenced',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clauses 5.1, 5.2, 5.3; controls A.2.2, A.2.3, A.2.4, A.3.2, A.3.3.',
   'Distinguish a policy that exists from a policy that is maintained and reviewed.',
   'Auditing leadership commitment through artifacts, not attitude.',
   23),
  ('D4', '4.4',
   'Analyze whether the AI risk assessment process conforms to clause 6.1.2',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clause 6.1.2. Documented information is required about the *process*.',
   'Test the process against its own stated criteria.',
   'Not requiring an artifact the standard does not name.',
   24),
  ('D4', '4.5',
   'Analyze whether the AI risk treatment process and the statement of applicability conform to clause 6.1.3',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clause 6.1.3 a) to f) - select treatment options, determine necessary controls and compare with Annex A to verify none necessary has been omitted, consider Annex A controls, identify additional controls, consider Annex B guidance, produce a statement of applicability with justification for inclusion and exclusion.',
   'Test whether the comparison against Annex A was actually performed.',
   'Reading the justification column rather than counting the rows.',
   25),
  ('D4', '4.6',
   'Distinguish the AI system impact assessment from the AI risk assessment and determine whether clause 6.1.4 is met',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clause 6.1.4 - a process for assessing potential consequences for individuals, groups of individuals and societies from development, provision or use of AI systems; it addresses deployment, intended use and foreseeable misuse; it takes account of the technical and societal context and applicable jurisdictions; the result shall be documented; the organization shall consider the results in the risk assessment. Clause 8.4 performs it operationally. Annex A.5 "Assessing impacts of AI systems" carries the supporting controls, including A.5.2 (impact assessment process) and A.5.5 (assessing societal impacts).',
   'Identify an organization that has run a risk assessment and called it an impact assessment.',
   'Holding the distinction under pressure from an auditee who considers it pedantic.',
   26),
  ('D4', '4.7',
   'Analyze whether documented information requirements under clause 7.5 are met',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clauses 7.1, 7.3, 7.4, 7.5.1-7.5.3. (Competence, clause 7.2, is task 4.13.)',
   'Test control of documented information rather than its existence.',
   'Distinguishing a document that is controlled from one that is merely present.',
   27),
  ('D4', '4.8',
   'Analyze whether operational planning and control under clause 8 is evidenced',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clauses 6.3, 8.1, 8.2, 8.3, 8.4. Clauses 8.2 and 8.3 require documented information of the *results*.',
   'Trace a planned change through to its controlled implementation.',
   'Following the process into practice rather than stopping at the procedure.',
   28),
  ('D4', '4.9',
   'Determine the normative status of an Annex A control and of Annex B guidance when testing conformity',
   'high', 'weekly', '4_analyze',
   'Annex A is normative and Table A.1 controls are stated with shall. Annex B is normative and restates the same controls with should; it binds because 6.1.3 e) has the organization *consider* it, and B.1 exempts implementation guidance from the statement of applicability. Annexes C and D are informative. Clauses 4-10 contain no should at all.',
   'Given a proposed finding built on an Annex B sentence, determine whether it can stand.',
   'Preserving the modal in one''s own writing.',
   29),
  ('D4', '4.10',
   'Analyze whether the controls declared in the statement of applicability are justified against Annex A',
   'high', 'weekly', '4_analyze',
   'Annex A.1 states that not all control objectives and controls in Table A.1 are required to be used, and that the organization can design and implement its own. Clause 6.1.3 f) requires the statement of applicability with justification for inclusion and exclusion.',
   'Test an exclusion against the risk treatment that produced it.',
   'Auditing the justification, not the checkbox.',
   30),
  ('D4', '4.11',
   'Explain how climate change is addressed in ISO/IEC 42001 clauses 4.1 and 4.2',
   'medium', 'occasional', '2_understand',
   'Clause 4.1 has the organization determine whether climate change is a relevant issue; the NOTE at 4.2 observes that relevant interested parties can have requirements related to climate change. Both are in the published first edition - there is no amendment to ISO/IEC 42001.',
   'Identify what the auditor can and cannot require here: a determination was made, not a particular answer.',
   'Not inflating a determination requirement into a performance requirement.',
   31),
  ('D4', '4.12',
   'Analyze whether a control declared in the statement of applicability is implemented as declared',
   'high', 'weekly', '4_analyze',
   'The auditor knows the nine Annex A control families - A.2 policies, A.3 internal organization, A.4 resources for AI systems, A.5 assessing impacts, A.6 AI system life cycle, A.7 data for AI systems, A.8 information for interested parties, A.9 use of AI systems, A.10 third-party and customer relationships - and knows that A.4, A.6 and A.7 call for documentation about data, tooling, computing and human resources that no ISO/IEC 27001 control asks for.',
   'The auditor selects a control the organization declared in the statement of applicability, traces it to the evidence of its implementation, and determines whether the evidence supports the declaration.',
   'Testing what was claimed rather than what would have been sensible to claim.',
   32),
  ('D4', '4.13',
   'Analyze whether people performing AI-related work meet the competence requirements the AIMS claims',
   'high', 'weekly', '4_analyze',
   'The auditor knows ISO/IEC 42001 clause 7.2 - determine necessary competence, ensure competence on the basis of education, training or experience, take action where needed, and retain documented information as evidence - and control A.4.6, under which the organization documents information about the human resources and their competences used across the AI system life cycle.',
   'The auditor tests whether the organization has determined what competence its AI work requires and evidenced that the people doing it hold it, rather than accepting a headcount or a job title as the evidence.',
   'Raising a competence gap about named colleagues without making it personal.',
   33),
  ('D5', '5.1',
   'Classify a described observation as a conformity, a nonconformity or an opportunity for improvement',
   'high', 'weekly', '3_apply',
   'ISO 19011:2026 Annex A.18.1-A.18.3. ISO/IEC 42001 uses only the term nonconformity and defines no severity scheme; a major/minor distinction comes from third-party certification practice under ISO/IEC 17021-1, and an internal programme may adopt any scheme it declares. Unlike ISO/IEC 27001, which relies on ISO/IEC 27000 for the term, ISO/IEC 42001 defines nonconformity itself at clause 3.16 - non-fulfilment of a requirement - alongside conformity (3.15) and corrective action (3.17).',
   'Classify a described observation.',
   'Not upgrading an observation to make it land.',
   34),
  ('D5', '5.2',
   'Select the nonconformity statement that correctly links evidence to the requirement',
   'high', 'weekly', '3_apply',
   'A nonconformity statement names the requirement, states the evidence, and asserts the gap between them.',
   'Choose the statement that does this and no more.',
   'Withholding the fix and the blame.',
   35),
  ('D5', '5.3',
   'Analyze a finding that engages more than one audit criterion',
   'medium', 'occasional', '4_analyze',
   'ISO 19011:2026 Annex A.18.4 on dealing with audit findings related to multiple criteria.',
   'Decide whether to record one finding referencing several criteria or several findings.',
   'Choosing for the reader''s benefit rather than the tally.',
   36),
  ('D5', '5.4',
   'Determine whether a proposed finding is supportable given the normative status of the clause cited',
   'high', 'weekly', '4_analyze',
   'A nonconformity requires an unfulfilled requirement. ISO 19011 contains none. Annex B is written in should. Notes are not requirements - with the 3.26 drafting anomaly noted and avoided as an item basis.',
   'Identify which of several proposed findings can actually stand, and restate the others as observations.',
   'Withdrawing one''s own finding when the criterion will not bear it.',
   37),
  ('D5', '5.5',
   'Analyze the adequacy of an audit report for its intended recipients',
   'medium', 'weekly', '4_analyze',
   'ISO 19011:2026 clauses 6.5.1 and 6.5.2; the fair presentation principle at 4.3 and confidentiality at 4.5.',
   'Judge whether a report is complete without disclosing what it should not.',
   'Writing for a reader who was not in the room.',
   38),
  ('D5', '5.6',
   'Determine whether corrective action and its follow-up satisfy clause 10.2',
   'high', 'weekly', '4_analyze',
   'ISO/IEC 42001 clause 10.2 - react to the nonconformity, evaluate the need for action to eliminate the causes, implement, review effectiveness. ISO 19011:2026 clause 6.7 on audit follow-up.',
   'Distinguish a correction from a corrective action and judge whether effectiveness was reviewed.',
   'Not closing a finding because the immediate symptom is gone.',
   39),
  ('D5', '5.7',
   'Explain how internal audit results feed the management review inputs in clause 9.3.2',
   'medium', 'occasional', '2_understand',
   'ISO/IEC 42001 clause 9.3.2 lists audit results and trends in nonconformities and corrective actions among management review inputs; 9.3.3 requires documented results.',
   'Trace an audit finding to its place in the review.',
   'Seeing the audit as an input to governance rather than an end in itself.',
   40)
) as v(dom_code, code, statement, criticality, frequency, bloom_level,
       knowledge, skills, abilities, order_index)
join public.domains dom on dom.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4' and dom.code = v.dom_code;

-- ============================================================================
-- PROOF. Run each block and require the stated result before treating 205 as applied.
-- ============================================================================

-- 4. Row counts. Expect certs 1, domains 5, tasks 40.
select
  (select count(*) from public.certifications where code = 'AIMS-IA')       as certs,
  (select count(*) from public.domains where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4')   as domains,
  (select count(*) from public.tasks   where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4')   as tasks;

-- 5. Domain weights and task counts.
--    Expect 12.50/5, 20.00/7, 20.00/8, 30.00/13, 17.50/7; weights summing to 100.00.
select d.code, d.title, d.weight_pct, count(t.id) as tasks
from public.domains d
left join public.tasks t on t.domain_id = d.id
where d.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
group by d.code, d.title, d.weight_pct, d.order_index
order by d.order_index;

-- 6. Bloom distribution. Expect 2_understand 5, 3_apply 7, 4_analyze 28.
select bloom_level, count(*) as tasks
from public.tasks where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
group by bloom_level order by bloom_level;

-- 7. THE ASSERTION THAT MATTERS.
--    exam_blueprint.cognitive_profile was computed from the LOCKED JTA before these rows
--    existed. This recomputes it from the rows that actually landed.
--    Expect 2_understand 13.02, 3_apply 17.50, 4_analyze 69.48, TOTAL 100.00.
--    IF THIS DISAGREES WITH THE BLUEPRINT, STOP: the task rows and the published
--    blueprint are not describing the same examination.
with per_task as (
  select t.bloom_level,
         d.weight_pct / count(*) over (partition by d.id) as w
  from public.tasks t
  join public.domains d on d.id = t.domain_id
  where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4' and t.is_exam_scope
)
select bloom_level::text as bloom, round(sum(w), 2) as weighted_pct
from per_task group by bloom_level
union all
select 'TOTAL', round(sum(w), 2) from per_task
order by bloom;

-- 8. The same figures as the blueprint records them, for a side-by-side read.
select jsonb_pretty(exam_blueprint -> 'cognitive_profile') as blueprint_profile,
       jsonb_pretty(exam_blueprint -> 'task_counts')       as blueprint_counts
from public.certifications where code = 'AIMS-IA';

-- 9. The cue-tolerance declaration must be PRESENT and marked provisional. If the Stage 9
--    generator prints "(default)" rather than "(blueprint)", this block is why.
select exam_blueprint -> 'item_model' -> 'cue_tolerance' ->> 'status'         as status,
       exam_blueprint -> 'item_model' -> 'cue_tolerance' ->> 'key_len_margin' as margin,
       exam_blueprint -> 'item_model' -> 'cue_tolerance' ->> 'key_len_pct'    as pct,
       exam_blueprint -> 'item_model' -> 'cue_tolerance' ->> 'len_spread_max' as spread,
       exam_blueprint -> 'item_model' -> 'cue_tolerance' ->> 'measured_over'  as measured_over
from public.certifications where code = 'AIMS-IA';

-- 10. Scheme parameters beside both siblings. exam_duration_minutes IS EXPECTED NULL and
--     is a publication gate: do not flip status while it is null.
select code, status, tier, sort_order, category_slug, validity_days, num_questions,
       passing_score_pct, exam_duration_minutes
from public.certifications where code in ('AIMS-IA','AIMS-F','ISMS-IA') order by code;

-- 11. No task statement asserts a requirement over a guidance document, and none frames
--     the ISO 19011 principles as having a winner. Expect ZERO rows.
select t.code, left(t.statement, 120) as statement
from public.tasks t
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and (t.statement ~* '(19011|17021|42006)[^.]{0,60}\m(requires|mandates|shall)\M'
       or t.statement ~* '\m(governs|decisive|overrides|takes precedence)\M')
order by t.code;

-- 12. No task statement asserts an Annex A control unconditionally. Annex A.1 states that
--     not all controls in Table A.1 are required to be used, so an unconditional
--     "ISO/IEC 42001 requires X" is a false attribution. Expect ZERO rows.
select t.code, left(t.statement, 120) as statement
from public.tasks t
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and t.statement ~* '42001[^.]{0,40}\mrequires\M'
order by t.code;

-- 13. Read the forty statements. This is the published blueprint a candidate sees, and it
--     is what every item will be generated against. Nothing downstream re-checks it.
select t.code, t.bloom_level, t.criticality, t.frequency, t.statement
from public.tasks t where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4' order by t.order_index;
