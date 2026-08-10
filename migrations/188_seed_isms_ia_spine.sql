-- 188_seed_isms_ia_spine.sql
-- ISMS-IA spine, part 1 of 2: 5 domains, 5 modules, 38 tasks.
-- Concepts and task_concepts follow in 189, together, so the reachability
-- graph is complete the moment that migration lands.
--
-- Source: ISMS-IA_JTA_v2.0 (locked 2026-08-09)
--
-- NOTES THAT COST SOMETHING TO LEARN:
--
--   modules_slug_unique is UNIQUE (slug) - TABLE-WIDE, not scoped to the cert.
--   Every module slug below carries the ia- prefix for that reason. Each must
--   also equal its content folder name minus the NN- prefix, and match
--   module_slug in every lesson frontmatter. A typo loads lessons into nothing.
--
--   modules has NO unique constraint on (certification_id, slug) and no
--   deterministic-id convention available - the repeating-digit UUID pattern in
--   CERT-SCHEMA-GUIDE section 6 is exhausted. Idempotency here is on
--   (certification_id, order_index).
--
--   tasks_domain_id_order_index_key is UNIQUE (domain_id, order_index), i.e.
--   PER DOMAIN. The globally-sequential 1..38 convention satisfies it trivially
--   but is NOT enforced by the database. It is a convention, and it matters
--   because downstream tooling assumes it.
--
--   All task text is dollar-quoted. Apostrophes appear throughout
--   ("the organization's", "risk owners'") and a single-quoted literal would
--   terminate early.
--
--   No task in this cert is bloom 5 or a simulation candidate. is_exam_scope is
--   true for all 38, which is what keeps verify-cert invariant 16 satisfied
--   without any schema change.

-- ---------------------------------------------------------------------------
-- 1. DOMAINS  (weight_pct sums to 100.0)
-- ---------------------------------------------------------------------------

insert into public.domains (certification_id, code, title, description, weight_pct, order_index)
values
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','D1','The audit function and its boundaries',
 $$The purposes and parties of management system auditing, the ISO 19011 principles and how they interact under tension, auditor objectivity and competence, and the boundary between what ISO 19011 guides, what ISO/IEC 27001 requires, and what ISO/IEC 17021-1 governs.$$,
 12.5, 1),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','D2','Audit programme management',
 $$Deriving programme objectives from the organization's ISMS objectives, risks and audit history; risk-based frequency and priority; defining scope and criteria for an individual audit; selecting on-site, remote or hybrid auditing methods; team composition; and testing a programme against ISO/IEC 27001 clause 9.2.$$,
 20.0, 2),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','D3','Conducting the audit: evidence, sampling and testing',
 $$Determining the degree of verification information carries and the reliance a finding may place on it; sampling adequacy; evidence obtained by remote auditing methods; selecting collection methods; testing an Annex A control against its Statement of Applicability claim; the boundary of an ISMS audit; and what an AI-assisted evidence process establishes and leaves unverified.$$,
 25.0, 3),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','D4','Auditing the ISMS against ISO/IEC 27001 as criteria',
 $$Auditing clauses 4 through 10 as the yardstick rather than the syllabus - scope, leadership, the whole of clause 6, the Statement of Applicability, support, operation and measurement - together with AI systems inside ISMS scope, control effectiveness under non-determinism, and the boundary between ISMS and AI management system conformity.$$,
 25.0, 4),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','D5','Findings, reporting, follow-up and management review',
 $$Determining whether evidence constitutes a nonconformity and whether findings are systemic; classifying against a declared scheme; writing a defensible nonconformity statement; disclosing AI-assisted method in the audit report; judging corrective action adequacy; verification and closure; and what must reach clause 9.3 management review.$$,
 17.5, 5)
on conflict (certification_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- 2. MODULES  (order_index aligns 1:1 to domains - the reachability fallback)
-- ---------------------------------------------------------------------------

insert into public.modules (certification_id, title, description, order_index, estimated_minutes, slug)
values
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','The Audit Function and Its Boundaries',
 $$What an internal audit is, how it differs from second- and third-party audits, the seven ISO 19011 principles and what to do when they conflict, auditor objectivity where full independence is not available, and which document actually says what.$$,
 1, 110, 'ia-audit-function'),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','Managing the Audit Programme',
 $$Building an audit programme from the organization's own objectives, risks and audit history; deciding frequency and depth by risk rather than by calendar; scoping an individual audit; and choosing between on-site, remote and hybrid methods.$$,
 2, 155, 'ia-audit-programme'),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','Conducting the Audit',
 $$Evidence and what makes it evidence, sampling and what a sample can support, interviewing, testing an Annex A control against the claim made for it, knowing where an ISMS audit stops, and using AI tooling without losing verification.$$,
 3, 200, 'ia-conducting-the-audit'),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','Auditing the ISMS Against ISO/IEC 27001',
 $$Working through clauses 4 to 10 as audit criteria - scope, leadership, planning, support, operation and performance evaluation - and what changes when AI systems are inside the scope.$$,
 4, 220, 'ia-auditing-the-isms'),
('7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417','Findings, Reporting and Follow-up',
 $$Turning evidence into findings, deciding whether a failure is isolated or systemic, writing statements that can be acted on, reporting what the audit did, and verifying that corrective action actually worked.$$,
 5, 155, 'ia-findings-and-follow-up')
on conflict (certification_id, order_index) do nothing;

-- ---------------------------------------------------------------------------
-- 3. TASKS  (38; domain_id resolved by join on domain code)
-- ---------------------------------------------------------------------------

insert into public.tasks (
  certification_id, domain_id, code, statement,
  criticality, frequency, bloom_level,
  is_exam_scope, is_simulation_candidate,
  knowledge, skills, abilities, order_index
)
select
  '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'::uuid,
  d.id,
  v.code,
  v.statement,
  v.criticality::criticality,
  v.frequency::task_frequency,
  v.bloom::bloom_level,
  true,
  false,
  v.knowledge,
  v.skills,
  v.abilities,
  v.order_index::int
from (values

-- ===== D1 =====
('D1','1.1',
 $$Distinguish first-party, second-party and third-party audits by purpose, criteria and who may conduct them - and distinguish the clause 9.2 internal audit requirement from the Annex A 5.35 independent review control.$$,
 'medium','occasional','2_understand',
 $$ISO 19011:2026 Table 1 sets out first-, second- and third-party audits, and clause 3.1 notes internal audits are conducted by or on behalf of the organization itself while third-party audits are conducted by independent auditing organizations. ISO/IEC 27001 carries two obligations that both speak of planned intervals: the clause 9.2 internal audit requirement, and Annex A control 5.35 requiring the approach to managing information security to be reviewed independently. Satisfying one does not satisfy the other.$$,
 $$Place a described audit or review into the correct category and determine which obligation an activity discharges.$$,
 $$Treats the internal audit as serving the organization rather than as rehearsal for a certification body.$$, '1'),

('D1','1.2',
 $$Determine which ISO 19011 audit principle governs where two of them pull against each other in a given situation.$$,
 'medium','occasional','4_analyze',
 $$The seven principles of ISO 19011:2026 - integrity (4.2), fair presentation (4.3), due professional care (4.4), confidentiality (4.5), independence (4.6), evidence-based approach (4.7), risk-based approach (4.8) - and that the standard states no order of precedence among them. Clause 4.1 says only that adherence is fundamental and that Clauses 5 to 7 are based on all seven.$$,
 $$Identify which principle is decisive where two point in different directions, and state why.$$,
 $$Treats a conflict between principles as requiring judgment rather than a lookup.$$, '2'),

('D1','1.3',
 $$Determine whether a proposed internal auditor assignment preserves objectivity and impartiality, given that auditor's other duties in the organization.$$,
 'high','occasional','4_analyze',
 $$ISO/IEC 27001 clause 9.2.2 b) requires the organization to select auditors and conduct audits that ensure objectivity and the impartiality of the audit process, and that is the whole of what that standard says. ISO 19011:2026 clause 4.6 states auditors should be independent of the activity being audited wherever practicable, and that where an internal auditor cannot be independent of the audited activity, every effort should be made to remove bias and encourage objectivity rather than the assignment being barred. Neither document contains a rule that an auditor may not audit their own work - that formulation is practice convention and must not be attributed to either.$$,
 $$Examine an auditor's other responsibilities against the area to be audited, determine whether objectivity survives, and identify what arrangement would restore it.$$,
 $$Treats independence as a property established per assignment, not a status an auditor holds.$$, '3'),

('D1','1.4',
 $$Identify the competence gaps in an audit team against a given audit's scope, including the technology competence a remote or hybrid audit demands.$$,
 'medium','occasional','4_analyze',
 $$The competence elements of ISO 19011:2026 clause 7.2 - personal behaviour (7.2.2) and knowledge and skills (7.2.3) - the ISMS-specific additions in ISO/IEC 27007, and that clause 7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools and emerging technology to conduct audits, naming artificial-intelligence-based evaluation tools as its example. Annex A.16 adds technical skills to use the appropriate technology while auditing.$$,
 $$Compare a team's competence against an audit's scope and technology profile and identify the gap.$$,
 $$Accepts that team competence can cover an individual gap, and that a gap left unclosed becomes a limitation on the audit's conclusions.$$, '4'),

('D1','1.5',
 $$Distinguish what ISO 19011 provides, what ISO/IEC 27001 requires and what ISO/IEC 17021-1 governs - and where ISO/IEC 27001's terms are actually defined.$$,
 'high','occasional','2_understand',
 $$ISO 19011 states guidance and not requirements, so nothing is ever required by it and no organization or person is certified to it. Its Introduction states ISO/IEC 17021-1 provides requirements for auditing management systems for third-party certification while ISO 19011 concentrates on first- and second-party audits. ISO/IEC 27001 contains no conformity assessment provisions. ISO/IEC 27001 clause 3 delegates its terms to ISO/IEC 27000 through an undated normative reference, so nonconformity, correction, corrective action and audit are not defined inside ISO/IEC 27001 at all.$$,
 $$Attribute a statement about auditing to the document that actually contains it.$$,
 $$Will not assert a requirement without knowing which document states it.$$, '5'),

-- ===== D2 =====
('D2','2.1',
 $$Derive audit programme objectives from the organization's ISMS objectives, its information security risks, and the results of previous audits.$$,
 'high','occasional','4_analyze',
 $$The inputs a programme's objectives derive from, and that ISO/IEC 27001 clause 9.2.2 requires the organization, when establishing the internal audit programme, to consider the importance of the processes concerned and the results of previous audits. ISO 19011:2026 clause 5.2 covers establishing programme objectives.$$,
 $$Derive defensible programme objectives from a described organization's ISMS objectives, risk profile and audit history.$$,
 $$Treats programme objectives as derived from the organization rather than copied from a template.$$, '6'),

('D2','2.2',
 $$Determine risk-based frequency and priority across the areas within ISMS scope.$$,
 'high','occasional','4_analyze',
 $$ISO 19011:2026 clause 4.8 states the risk-based approach should substantively influence the planning and implementation of the audit programme, and the planning, conducting and reporting of audits, so that audits focus on matters significant to the audit client. Clause 5.3 covers determining and evaluating programme risks and opportunities. ISO/IEC 27001's Introduction states that the order in which its requirements are presented does not reflect their importance.$$,
 $$Allocate audit frequency and depth across areas of differing risk and importance, and justify the allocation.$$,
 $$Resists equal-time coverage as a proxy for fairness, and clause order as a proxy for risk.$$, '7'),

('D2','2.3',
 $$Define the scope, criteria and objectives of an individual audit within the programme.$$,
 'high','weekly','3_apply',
 $$ISO 19011:2026 defines audit scope (3.6) as the extent and boundaries of an audit, generally including physical and virtual locations, functions, units, activities, processes and the time period covered; and audit criteria (3.8) as the set of requirements against which objective evidence is compared. Clause 5.5.2 covers defining objectives, scope and criteria for an individual audit. ISO/IEC 27001 clause 9.2.2 a) requires the organization to define the audit criteria and scope for each audit - it does not require audit objectives. ISO/IEC 42001's own 9.2.2 a) adopted objectives where ISO/IEC 27001 did not.$$,
 $$Write scope, criteria and objectives for a described audit that are consistent with one another and with the programme.$$,
 $$States scope boundaries explicitly rather than leaving them to be inferred.$$, '8'),

('D2','2.4',
 $$Select on-site, remote or hybrid auditing methods for a given audit against the factors ISO 19011 sets out.$$,
 'medium','weekly','3_apply',
 $$ISO 19011:2026 defines remote auditing method (3.4) as a method for conducting audit activities from any place other than the auditee's location, sourced from ISO/IEC TS 17012:2024, with notes covering combination with on-site methods, virtual locations, and auditing one site from another. Method selection is clause 5.5.3. The detailed guidance, including the additional risks remote methods introduce, is in Annex A.16 rather than the body.$$,
 $$Select a method for a described audit and name the factor that decided it.$$,
 $$Treats method choice as carrying its own risks rather than as a logistics decision.$$, '9'),

('D2','2.5',
 $$Determine audit team composition and resourcing for a given audit.$$,
 'medium','occasional','3_apply',
 $$The roles an audit team may contain, what a technical expert may and may not do, and that programme resources include access to adequate and appropriate information and communication technology.$$,
 $$Compose a team for a described audit scope and justify each role.$$,
 $$Treats resourcing as a constraint on what the audit can conclude.$$, '10'),

('D2','2.6',
 $$Determine whether an audit programme satisfies clause 9.2, including what "planned intervals" requires and does not require.$$,
 'high','occasional','4_analyze',
 $$Clause 9.2.1 requires internal audits at planned intervals to provide information on whether the ISMS conforms to the organization's own requirements and the standard's, and is effectively implemented and maintained. Clause 9.2.2 requires the programme to include frequency, methods, responsibilities, planning requirements and reporting, with documented information available as evidence. The standard sets no numeric interval.$$,
 $$Examine a described programme against clause 9.2 and determine whether the interval and coverage are defensible.$$,
 $$Will not accept "annual" as self-justifying.$$, '11'),

('D2','2.7',
 $$Determine how AI systems within the ISMS scope change the audit programme's risk profile and its prioritisation.$$,
 'medium','occasional','4_analyze',
 $$Why systems whose behaviour changes without a change request disturb an interval set on a change-controlled assumption, and why model providers enter the programme through the Annex A supplier-relationship controls.$$,
 $$Adjust a programme's frequency and priority for a scope that has acquired AI systems since the programme was set.$$,
 $$Treats a model update as a change to the audited environment.$$, '12'),

-- ===== D3 =====
('D3','3.1',
 $$Determine what degree of verification collected information carries, and what reliance a finding can therefore place on it.$$,
 'high','weekly','4_analyze',
 $$ISO 19011:2026 defines audit evidence (3.10) as records, statements of fact or other information relevant to the audit criteria and verifiable, and separately defines objective evidence (3.9) as data supporting the existence or verity of something - two different defined terms, and clause 3.1's definition of audit uses the latter. Clause 6.4.7 states only information subject to some degree of verification should be accepted as audit evidence, and where that degree is low the auditor should use professional judgement to determine the degree of reliance placed on it.$$,
 $$Determine what a described item of information establishes and what reliance a finding can place on it.$$,
 $$Does not let relevance substitute for verifiability, and does not treat verification as binary.$$, '13'),

('D3','3.2',
 $$Determine a sampling approach and judge whether a sample supports the conclusion drawn from it.$$,
 'high','weekly','4_analyze',
 $$ISO 19011:2026 clause 4.7 states audit evidence should be based on samples because an audit runs for a specified duration with finite resources, and that appropriate use of sampling is closely related to the confidence that can be placed in the audit conclusions. Clause 6.4.7 requires collection by means of appropriate sampling. Sampling guidance is Annex A.6.$$,
 $$Judge whether a described sample supports the conclusion drawn, and identify what would strengthen it.$$,
 $$Reports the conclusion the sample supports rather than the one it was taken to support.$$, '14'),

('D3','3.3',
 $$Assess the reliability of evidence obtained through remote auditing methods.$$,
 'high','weekly','4_analyze',
 $$Annex A.16 states the use of remote auditing methods can introduce additional risks and opportunities to the audit process, naming data security, confidentiality and contingency planning for technology failure among the considerations, together with the limitations electronic and remotely-obtained evidence carries against the clause 6.4.7 verification test.$$,
 $$Assess a described piece of remotely-obtained evidence and determine what it establishes.$$,
 $$Distinguishes what was seen from what was shown.$$, '15'),

('D3','3.4',
 $$Select the evidence-gathering method that fits the evidence sought.$$,
 'medium','weekly','3_apply',
 $$ISO 19011:2026 clause 6.4.7 names interviews, observations and review of documented information among the methods of collecting information, and what each can and cannot establish.$$,
 $$Select the method that produces the evidence a given audit trail needs.$$,
 $$Does not accept a document as evidence that a process runs.$$, '16'),

('D3','3.5',
 $$Construct interview questions that elicit evidence rather than confirmation.$$,
 'medium','weekly','3_apply',
 $$How question form shapes the evidential value of an answer. Interview guidance is ISO 19011:2026 Annex A.17.$$,
 $$Rewrite a leading or closed question into one that produces evidence.$$,
 $$Does not treat agreement as corroboration.$$, '17'),

('D3','3.6',
 $$Test an Annex A control's operating effectiveness against the claim made for it in the Statement of Applicability.$$,
 'high','weekly','4_analyze',
 $$The difference between a control that is designed and one that operates, and that ISO/IEC 27001 clause 6.1.3 d) requires the Statement of Applicability to record whether each necessary control is implemented or not - which is the claim the auditor tests.$$,
 $$Design a test that would establish whether a described control operates as claimed, and determine what its result shows.$$,
 $$Audits the claim the organization made, not the control the auditor would have chosen.$$, '18'),

('D3','3.7',
 $$Determine when control testing has reached the boundary of an ISMS audit and become a technical assessment.$$,
 'medium','occasional','4_analyze',
 $$ISO/IEC 27001 Annex A control 8.34 requires audit tests and other assurance activities involving assessment of operational systems to be planned and agreed between the tester and appropriate management, together with where management system auditing stops and technical assessment of controls begins.$$,
 $$Determine whether a proposed test is within the audit's competence, scope and agreed terms.$$,
 $$Escalates and seeks agreement rather than improvising past the boundary.$$, '19'),

('D3','3.8',
 $$Determine what an AI-assisted evidence process establishes and what it leaves unverified.$$,
 'high','weekly','4_analyze',
 $$ISO 19011:2026 clause 7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools, and emerging technology, to conduct audits, giving artificial-intelligence-based evaluation tools as its example. Under clause 6.4.7 an AI-produced summary of a document the auditor did not open carries a low degree of verification, so professional judgement must set the reliance placed on it. An AI tool selecting which records to examine is making a sampling decision, which clause 4.7 ties to confidence in the audit conclusions. Accountability for the conclusion remains with the auditor regardless of the tool.$$,
 $$Determine, for a described AI-assisted step, what it established and what remains unverified.$$,
 $$Treats an AI tool as a method whose reliability must be evaluated, not as a source of evidence.$$, '20'),

('D3','3.9',
 $$Maintain traceability from an evidence source through to the finding it supports.$$,
 'high','weekly','3_apply',
 $$ISO 19011:2026 clause 6.4.7 requires audit evidence leading to audit findings to be recorded, and what a working-paper record must contain for a finding to be defensible later. Audit-related records are clause 5.5.7.$$,
 $$Record an evidence trail another auditor could follow.$$,
 $$Treats a finding without a traceable source as unusable.$$, '21'),

-- ===== D4 =====
('D4','4.1',
 $$Determine whether a declared ISMS scope is complete and defensible against clause 4.$$,
 'high','occasional','4_analyze',
 $$Clause 4.3 requires the scope determination to consider the 4.1 issues, the 4.2 requirements, and the interfaces and dependencies between activities performed by the organization and those performed by other organizations, with the scope available as documented information. Clause 1 Scope - not clause 4 - states that excluding any requirement in Clauses 4 to 10 is not acceptable when conformity is claimed.$$,
 $$Examine a declared scope against the organization described and determine what has been left out.$$,
 $$Treats an undeclared interface as the most likely place a scope fails.$$, '22'),

('D4','4.2',
 $$Audit leadership, the information security policy, and organizational roles against clause 5.$$,
 'high','occasional','4_analyze',
 $$The eight things clause 5.1 requires top management to demonstrate. Clause 5.2 requires the policy to be appropriate to purpose, to include objectives or provide the framework for setting them, and to include commitments to satisfy applicable requirements and to continual improvement - and separately to be available as documented information, communicated internally, and available to interested parties as appropriate. Clause 5.3 requires responsibilities and authorities to be assigned and communicated, with specific authority for ISMS conformity and for reporting performance to top management.$$,
 $$Determine what evidence would establish that a described organization's top management has demonstrated a given clause 5.1 element.$$,
 $$Distinguishes a documented commitment from a demonstrated one.$$, '23'),

('D4','4.3',
 $$Audit the whole of clause 6 - risk assessment, risk treatment, information security objectives, and planning of changes.$$,
 'high','weekly','4_analyze',
 $$Clause 6.1.2 requires a defined risk assessment process establishing risk acceptance criteria and criteria for performing assessments, producing consistent, valid and comparable results, with risk owners identified. ISO/IEC 27001 does not require a risk register - clauses 6.1.2 and 6.1.3 require documented information about the processes, and clauses 8.2 and 8.3 require it of the results. NOTE 2 to clause 6.1.3 directs users to Annex A to ensure no necessary controls are overlooked and NOTE 3 states the Annex A list is not exhaustive, so Annex A is a completeness check and not a catalogue to select from. Clause 6.2 sets seven requirements on objectives and five on the planning to achieve them. Clause 6.3 Planning of changes is a real numbered requirement that does not appear on the standard's own contents page.$$,
 $$Determine whether a described clause 6 process meets the requirements and whether its outputs are traceable to the treatment decisions.$$,
 $$Audits the process the organization operates, not the one the auditor would design.$$, '24'),

('D4','4.4',
 $$Determine whether a Statement of Applicability is consistent with the risk treatment decisions behind it.$$,
 'high','weekly','4_analyze',
 $$The four elements clause 6.1.3 d) requires the Statement of Applicability to contain - the necessary controls, justification for their inclusion, whether they are implemented or not, and justification for excluding any Annex A control - and that clause 6.1.3 f) requires risk owners' approval of the treatment plan and acceptance of the residual risks.$$,
 $$Trace an inclusion or exclusion back to the risk treatment decision that should support it.$$,
 $$Treats an unjustified exclusion as a finding regardless of how reasonable it sounds.$$, '25'),

('D4','4.5',
 $$Audit competence, awareness and documented information against clause 7.$$,
 'medium','weekly','3_apply',
 $$Clause 7.2 requires the necessary competence to be determined, persons to be competent on the basis of education, training or experience, actions taken where applicable with their effectiveness evaluated, and documented information retained as evidence of competence. Clause 7.3 sets what persons must be aware of. Clause 7.5 has three parts covering what the ISMS must include, creating and updating, and control of documented information.$$,
 $$Select the evidence that would establish conformity with a given clause 7 requirement.$$,
 $$Distinguishes attendance from competence.$$, '26'),

('D4','4.6',
 $$Audit operational planning and control and the clause 9.1 measurement arrangements.$$,
 'high','weekly','4_analyze',
 $$Clause 6 defines the processes and clause 8 performs them - 6.1.2 defines the risk assessment process and 8.2 performs assessments at planned intervals or on significant change; 6.1.3 defines the treatment process and 8.3 implements the plan. Clause 9.1 requires the organization to determine six things, including who shall monitor and measure and who shall analyse and evaluate.$$,
 $$Determine whether described operational evidence shows the planned arrangements actually running.$$,
 $$Looks for the operation of a plan rather than the existence of one.$$, '27'),

('D4','4.7',
 $$Determine whether the organization has addressed the climate change consideration Amendment 1:2024 adds to clause 4.1.$$,
 'medium','occasional','3_apply',
 $$Amendment 1:2024 requires the organization to determine whether climate change is a relevant issue, naming it specifically rather than as a general environmental condition, and adds a note at clause 4.2 that relevant interested parties can have climate-change-related requirements. NOTE: the amended text has not been read directly; wording pending verification against the amended standard before this task's lesson is authored.$$,
 $$Determine whether a described organization has addressed the requirement and what evidence would show it.$$,
 $$Checks the named requirement rather than a paraphrase of it.$$, '28'),

('D4','4.8',
 $$Identify AI systems and AI-derived assets inside the ISMS scope that the asset inventory has not captured.$$,
 'high','weekly','4_analyze',
 $$The asset classes an AI system introduces, why they are routinely absent from inventories built before the system arrived, and that Annex A 5.9 requires an inventory of information and other associated assets including owners.$$,
 $$Determine from a described environment which AI-related assets fall inside scope and are unaccounted for.$$,
 $$Treats an absent asset class as more likely than an absent control.$$, '29'),

('D4','4.9',
 $$Determine whether an Annex A control still operates as claimed where the process it protects has become non-deterministic.$$,
 'medium','occasional','4_analyze',
 $$Why a control validated against a deterministic process may not hold when the same process produces varying output, and what evidence of continued effectiveness looks like in that case.$$,
 $$Determine whether described evidence still supports an effectiveness claim after the protected process changed character.$$,
 $$Treats "the control passed last year" as a statement about last year.$$, '30'),

('D4','4.10',
 $$Distinguish ISMS conformity from AI management system conformity where the two scopes overlap.$$,
 'medium','occasional','4_analyze',
 $$The two standards share the harmonized structure but diverge in text at points that change what an auditor must look for. ISO/IEC 27001 clause 9.2.2 a) requires audit criteria and scope where ISO/IEC 42001 requires objectives, criteria and scope. ISO/IEC 27001 reports results to relevant management, ISO/IEC 42001 to relevant managers. ISO/IEC 27001's management review inputs additionally require fulfilment of objectives, feedback from interested parties, and risk assessment results and treatment plan status - none of which ISO/IEC 42001 requires. ISO/IEC 27001 clause 9.1 names who shall monitor and who shall analyse, ISO/IEC 42001 does not. ISO/IEC 27001 requires risk owners' approval of the treatment plan where ISO/IEC 42001 requires designated management approval. ISO/IEC 42001 alone carries the AI system impact assessment at 6.1.4, an input to its risk assessment. ISO 19011:2026 defines a combined audit (3.2) as one carried out together at a single auditee on two or more management systems. ISO/IEC 42001 Annex D.2 is informative and discusses integrated implementation with ISO/IEC 27001.$$,
 $$Determine which standard a described requirement or finding belongs to when both systems are in scope.$$,
 $$Does not accept conformity with one system as evidence of conformity with the other.$$, '31'),

-- ===== D5 =====
('D5','5.1',
 $$Classify a finding against the audit programme's declared classification scheme.$$,
 'medium','weekly','3_apply',
 $$ISO/IEC 27001 uses the term nonconformity and requires reaction, correction and corrective action at clause 10.2, but defines no severity scheme and does not use observation or opportunity for improvement as finding categories at all. A major/minor distinction comes from third-party certification practice under ISO/IEC 17021-1, and an internal programme adopts a scheme by its own choice. The term nonconformity is defined in ISO/IEC 27000, not in ISO/IEC 27001. ISO 19011:2026 clause 3.8 Note 1 records that where the audit criteria are legal requirements, compliance and non-compliance are often used in a finding rather than conformity language.$$,
 $$Classify a described finding against a scheme that has been given.$$,
 $$Applies the programme's declared scheme rather than a remembered one.$$, '32'),

('D5','5.2',
 $$Determine whether the evidence constitutes a nonconformity, and whether a set of findings indicates a systemic rather than an isolated failure.$$,
 'high','weekly','4_analyze',
 $$What must be true for evidence to establish a nonconformity, and that ISO/IEC 27001 clause 10.2 b) 3) directs the organization to determine whether similar nonconformities exist or could potentially occur - the standard's own hook for systemic reasoning. Generating audit findings is ISO 19011:2026 clause 6.4.8.$$,
 $$Determine from a set of described findings whether a systemic failure is present.$$,
 $$Does not raise a nonconformity on absent evidence without first establishing that evidence should exist.$$, '33'),

('D5','5.3',
 $$Construct a nonconformity statement that links the evidence to the requirement it fails.$$,
 'high','weekly','3_apply',
 $$What a statement must contain for the recipient to act on it without the auditor present, and that ISO 19011:2026's fair presentation principle (4.3) requires findings, conclusions and reports to reflect the auditing activities truthfully and accurately.$$,
 $$Write a statement naming the requirement, the evidence and the gap, without prescribing the remedy.$$,
 $$States what was found rather than what should be done.$$, '34'),

('D5','5.4',
 $$Determine what an audit report must disclose about AI-assisted evidence processing so that a reader can judge the reliability of the evidence.$$,
 'medium','occasional','4_analyze',
 $$What an audit report contains under ISO 19011:2026 clause 6.5.1, and why a method that shaped which evidence was examined belongs in it while an incidental tool does not - following from clause 6.4.7's requirement that the degree of reliance placed on low-verification evidence be a matter of stated professional judgement.$$,
 $$Determine what a described audit must disclose about its AI-assisted steps for its conclusions to be assessable.$$,
 $$Treats an undisclosed method that shaped the evidence as a defect in the report.$$, '35'),

('D5','5.5',
 $$Determine whether a proposed correction, root cause analysis and corrective action adequately address a nonconformity.$$,
 'high','occasional','4_analyze',
 $$Clause 10.2 a) requires reacting to the nonconformity including action to control and correct it and to deal with the consequences, while clause 10.2 b) requires evaluating the need for action to eliminate the causes so it does not recur or occur elsewhere - the operative distinction between correction and corrective action, neither of which is defined inside ISO/IEC 27001. Corrective actions shall be appropriate to the effects of the nonconformities encountered.$$,
 $$Determine whether a described corrective action would prevent recurrence or only close the instance.$$,
 $$Does not accept retraining as a root cause response by default.$$, '36'),

('D5','5.6',
 $$Determine the verification approach for a corrective action and whether a finding may be closed.$$,
 'high','occasional','4_analyze',
 $$ISO/IEC 27001 clause 10.2 d) requires the effectiveness of any corrective action taken to be reviewed, and ISO 19011:2026 clause 6.7 covers conducting the audit follow-up.$$,
 $$Determine whether described evidence supports closing a finding.$$,
 $$Does not close on a commitment.$$, '37'),

('D5','5.7',
 $$Determine which audit results clause 9.3 requires to reach management review.$$,
 'medium','occasional','3_apply',
 $$Clause 9.2.2 c) requires audit results to be reported to relevant management, and clause 9.3.2 d) 3) places audit results among the management review inputs, nested under feedback on information security performance alongside nonconformities and corrective actions, monitoring and measurement results, and fulfilment of information security objectives.$$,
 $$Select from a described audit's outputs what must reach management review.$$,
 $$Treats the review input as the point of the audit rather than its administrative tail.$$, '38')

) as v(domain_code, code, statement, criticality, frequency, bloom, knowledge, skills, abilities, order_index)
join public.domains d
  on d.certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'::uuid
 and d.code = v.domain_code
on conflict (certification_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
--
-- Counts - expect 5 / 5 / 38:
--
--   select
--     (select count(*) from public.domains  where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417') as domains,
--     (select count(*) from public.modules  where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417') as modules,
--     (select count(*) from public.tasks    where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417') as tasks;
--
-- Weights sum to 100.0 and order_index is 1..38 with no gaps:
--
--   select sum(weight_pct) from public.domains where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417';
--   select min(order_index), max(order_index), count(distinct order_index)
--   from public.tasks where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417';
--
-- Bloom distribution - expect 2_understand 2, 3_apply 11, 4_analyze 25, nothing else:
--
--   select bloom_level, count(*) from public.tasks
--   where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'
--   group by bloom_level order by bloom_level;
--
-- Every task exam-scoped, none a simulation candidate - expect 38 / 0:
--
--   select count(*) filter (where is_exam_scope) as in_scope,
--          count(*) filter (where is_simulation_candidate) as sim
--   from public.tasks where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417';
--
-- No K/S/A field left null - expect 0:
--
--   select count(*) from public.tasks
--   where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'
--     and (knowledge is null or skills is null or abilities is null);
--
-- Cognitive profile, the number that validates the build - expect
-- understand 5.00 / apply 29.40 / analyze 65.60:
--
--   select bloom_level, tasks, pct_of_form from public.v_cognitive_profile
--   where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'
--   order by bloom_level;
