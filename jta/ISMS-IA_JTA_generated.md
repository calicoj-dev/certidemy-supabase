# ISMS-IA - Job-Task Analysis

> **GENERATED FROM THE DATABASE on 2026-09-02. Do not hand-edit.**
>
> Every fact below is rendered from the live schema by
> `scripts/gen-jta-doc.mjs`. To change anything here, change the database
> through a migration and regenerate - the git diff on this file is then the
> change record.
>
> Design rationale, sourcing, review history and reconciliation records are
> NOT here. They carry human judgment that no query can reconstruct, and live
> in the companion narrative document.

**Certification:** ISO/IEC 27001:2022 Internal Auditor - AI  
**Status:** available

---

## Exam facts

| Attribute | Value |
|-|-|
| Questions | 50 |
| Duration | 150 minutes |
| Passing score | 75% (38/50) |
| Format | Multiple choice (single answer), online |
| Bloom ceiling | 4 (Analyze) for MCQ; 5-6 reserved for simulation |
| Languages | English, es-419, pt-BR |

## Domain structure

| # | Domain | Weight | MCQ seats |
|-|-|-|-|
| D1 | The audit function and its boundaries | 12.5% | 6 |
| D2 | Audit programme management | 20% | 10 |
| D3 | Conducting the audit: evidence, sampling and testing | 25% | 13 |
| D4 | Auditing the ISMS against ISO/IEC 27001 as criteria | 25% | 12 |
| D5 | Findings, reporting, follow-up and management review | 17.5% | 9 |
| **Total** | | **100%** | **50** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 2 (Understand) | 2 | 5% |
| 3 (Apply) | 11 | 29.4% |
| 4 (Analyze) | 25 | 65.6% |

---

# Domain D1 - The audit function and its boundaries (12.5%)

**Description.** The purposes and parties of management system auditing, the ISO 19011 principles and how they interact under tension, auditor objectivity and competence, and the boundary between what ISO 19011 guides, what ISO/IEC 27001 requires, and what ISO/IEC 17021-1 governs.

**Tasks:** 5  |  **MCQ seats:** 6

## Tasks

### Task 1.1 - Distinguish first-party, second-party and third-party audits by purpose, criteria and who may conduct them - and distinguish the clause 9.2 internal audit requirement from the Annex A 5.35 independent review control.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ia-19011-table-1-audit-types`, `ia-annex-a-5-35-independent-review`, `ia-clause-9-2-versus-control-5-35`, `ia-first-party-audit-purpose`, `ia-second-party-audit-context`, `ia-third-party-certification-audit`, `ia-who-may-conduct-each-audit-type` |

- **K:** ISO 19011:2026 Table 1 sets out first-, second- and third-party audits, and clause 3.1 notes internal audits are conducted by or on behalf of the organization itself while third-party audits are conducted by independent auditing organizations. ISO/IEC 27001 carries two obligations that both speak of planned intervals: the clause 9.2 internal audit requirement, and Annex A control 5.35 requiring the approach to managing information security to be reviewed independently. Satisfying one does not satisfy the other.
- **S:** Place a described audit or review into the correct category and determine which obligation an activity discharges.
- **A:** Treats the internal audit as serving the organization rather than as rehearsal for a certification body.

### Task 1.2 - Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-principles-set`, `ia-evidence-based-vs-risk-based-tension`, `ia-independence-vs-due-care-tension`, `ia-principle-interaction-in-practice`, `ia-principles-carry-no-precedence` |

- **K:** The seven principles of ISO 19011:2026 - integrity (4.2), fair presentation (4.3), due professional care (4.4), confidentiality (4.5), independence (4.6), evidence-based approach (4.7), risk-based approach (4.8) - and that the standard states no order of precedence among them. Clause 4.1 says only that adherence is fundamental and that Clauses 5 to 7 are based on all seven.
- **S:** Given a situation where two principles pull against each other, identify which are engaged and state what a defensible resolution weighs.
- **A:** Treats a conflict between principles as requiring judgment rather than a lookup.

### Task 1.3 - Determine whether a proposed internal auditor assignment preserves objectivity and impartiality, given that auditor's other duties in the organization.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-clause-9-2-2-objectivity-requirement`, `ia-compensating-arrangements-for-limited-independence`, `ia-independence-of-the-activity-audited-4-6`, `ia-internal-auditor-limited-independence-remedy`, `ia-objectivity-in-first-party-audit`, `ia-small-organization-independence-constraints` |

- **K:** ISO/IEC 27001 clause 9.2.2 b) requires the organization to select auditors and conduct audits that ensure objectivity and the impartiality of the audit process, and that is the whole of what that standard says. ISO 19011:2026 clause 4.6 states auditors should be independent of the activity being audited wherever practicable, and that where an internal auditor cannot be independent of the audited activity, every effort should be made to remove bias and encourage objectivity rather than the assignment being barred. Neither document contains a rule that an auditor may not audit their own work - that formulation is practice convention and must not be attributed to either.
- **S:** Examine an auditor's other responsibilities against the area to be audited, determine whether objectivity survives, and identify what arrangement would restore it.
- **A:** Treats independence as a property established per assignment, not a status an auditor holds.

### Task 1.4 - Identify the competence gaps in an audit team against a given audit's scope, including the technology competence a remote or hybrid audit demands.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-ai-tool-competence-for-auditors`, `ia-auditor-competence-elements`, `ia-ict-and-emerging-technology-competence-7-2-3`, `ia-isms-specific-auditor-competence`, `ia-team-competence-versus-individual-competence` |

- **K:** The competence elements of ISO 19011:2026 clause 7.2 - personal behaviour (7.2.2) and knowledge and skills (7.2.3) - the ISMS-specific additions in ISO/IEC 27007, and that clause 7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools and emerging technology to conduct audits, naming artificial-intelligence-based evaluation tools as its example. Annex A.16 adds technical skills to use the appropriate technology while auditing.
- **S:** Compare a team's competence against an audit's scope and technology profile and identify the gap.
- **A:** Accepts that team competence can cover an individual gap, and that a gap left unclosed becomes a limitation on the audit's conclusions.

### Task 1.5 - Distinguish what ISO 19011 provides, what ISO/IEC 27001 requires and what ISO/IEC 17021-1 governs - and where ISO/IEC 27001's terms are actually defined.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ia-17021-1-governs-certification-bodies`, `ia-19011-is-guidance-not-requirements`, `ia-27001-requirements-as-audit-criteria`, `ia-no-certification-to-19011`, `ia-terms-defined-outside-27001` |

- **K:** ISO 19011 states guidance and not requirements, so nothing is ever required by it and no organization or person is certified to it. Its Introduction states ISO/IEC 17021-1 provides requirements for auditing management systems for third-party certification while ISO 19011 concentrates on first- and second-party audits. ISO/IEC 27001 contains no conformity assessment provisions. ISO/IEC 27001 clause 3 delegates its terms to ISO/IEC 27000 through an undated normative reference, so nonconformity, correction, corrective action and audit are not defined inside ISO/IEC 27001 at all.
- **S:** Attribute a statement about auditing to the document that actually contains it.
- **A:** Will not assert a requirement without knowing which document states it.

---

# Domain D2 - Audit programme management (20%)

**Description.** Deriving programme objectives from the organization's ISMS objectives, risks and audit history; risk-based frequency and priority; defining scope and criteria for an individual audit; selecting on-site, remote or hybrid auditing methods; team composition; and testing a programme against ISO/IEC 27001 clause 9.2.

**Tasks:** 7  |  **MCQ seats:** 10

## Tasks

### Task 2.1 - Determine audit programme objectives from the organization's ISMS objectives, its information security risks, and the results of previous audits.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-programme-objectives`, `ia-interested-party-requirements-as-input`, `ia-isms-objectives-as-programme-input`, `ia-previous-audit-results-as-input` |

- **K:** The inputs a programme's objectives derive from, and that ISO/IEC 27001 clause 9.2.2 requires the organization, when establishing the internal audit programme, to consider the importance of the processes concerned and the results of previous audits. ISO 19011:2026 clause 5.2 covers establishing programme objectives.
- **S:** Determine which programme objectives a described organization's ISMS objectives, risk profile and audit history support.
- **A:** Treats programme objectives as derived from the organization rather than copied from a template.

### Task 2.2 - Determine risk-based frequency and priority across the areas within ISMS scope.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-clause-order-carries-no-priority`, `ia-coverage-across-programme-cycle`, `ia-process-importance-as-prioritisation-factor`, `ia-programme-risks-and-opportunities-5-3`, `ia-risk-based-audit-programme` |

- **K:** ISO 19011:2026 clause 4.8 states the risk-based approach should substantively influence the planning and implementation of the audit programme, and the planning, conducting and reporting of audits, so that audits focus on matters significant to the audit client. Clause 5.3 covers determining and evaluating programme risks and opportunities. ISO/IEC 27001's Introduction states that the order in which its requirements are presented does not reflect their importance.
- **S:** Allocate audit frequency and depth across areas of differing risk and importance, and justify the allocation.
- **A:** Resists equal-time coverage as a proxy for fairness, and clause order as a proxy for risk.

### Task 2.3 - Define the scope, criteria and objectives of an individual audit within the programme.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-criteria-3-8`, `ia-audit-objectives-are-practice-not-a-27001-requirement`, `ia-audit-scope-definition-3-6`, `ia-individual-audit-objectives`, `ia-scope-boundaries-and-exclusions` |

- **K:** ISO 19011:2026 defines audit scope (3.6) as the extent and boundaries of an audit, generally including physical and virtual locations, functions, units, activities, processes and the time period covered; and audit criteria (3.8) as the set of requirements against which objective evidence is compared. Clause 5.5.2 covers defining objectives, scope and criteria for an individual audit. ISO/IEC 27001 clause 9.2.2 a) requires the organization to define the audit criteria and scope for each audit - it does not require audit objectives. ISO/IEC 42001's own 9.2.2 a) adopted objectives where ISO/IEC 27001 did not.
- **S:** Determine whether a described audit's scope, criteria and objectives are consistent with one another and with the programme.
- **A:** States scope boundaries explicitly rather than leaving them to be inferred.

### Task 2.4 - Select on-site, remote or hybrid auditing methods for a given audit against the factors ISO 19011 sets out.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-method-selection-5-5-3`, `ia-on-site-auditing-method`, `ia-remote-auditing-method-3-4`, `ia-remote-method-risks-annex-a-16`, `ia-virtual-locations` |

- **K:** ISO 19011:2026 defines remote auditing method (3.4) as a method for conducting audit activities from any place other than the auditee's location, sourced from ISO/IEC TS 17012:2024, with notes covering combination with on-site methods, virtual locations, and auditing one site from another. Method selection is clause 5.5.3. The detailed guidance, including the additional risks remote methods introduce, is in Annex A.16 rather than the body.
- **S:** Select a method for a described audit and name the factor that decided it.
- **A:** Treats method choice as carrying its own risks rather than as a logistics decision.

### Task 2.5 - Determine audit team composition and resourcing for a given audit.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-programme-resources-5-4-4`, `ia-audit-team-leader-assignment-5-5-5`, `ia-audit-team-selection-5-5-4`, `ia-technical-expert-role` |

- **K:** The roles an audit team may contain, what a technical expert may and may not do, and that programme resources include access to adequate and appropriate information and communication technology.
- **S:** Determine an appropriate team composition for a described audit scope and what each role contributes to it.
- **A:** Treats resourcing as a constraint on what the audit can conclude.

### Task 2.6 - Determine whether an audit programme satisfies clause 9.2, including what "planned intervals" requires and does not require.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-programme-3-5`, `ia-clause-9-2-1-requirements`, `ia-clause-9-2-2-programme-requirements`, `ia-documented-information-on-the-programme`, `ia-planned-intervals-carries-no-fixed-value` |

- **K:** Clause 9.2.1 requires internal audits at planned intervals to provide information on whether the ISMS conforms to the organization's own requirements and the standard's, and is effectively implemented and maintained. Clause 9.2.2 requires the programme to include frequency, methods, responsibilities, planning requirements and reporting, with documented information available as evidence. The standard sets no numeric interval.
- **S:** Examine a described programme against clause 9.2 and determine whether the interval and coverage are defensible.
- **A:** Will not accept "annual" as self-justifying.

### Task 2.7 - Determine how AI systems within the ISMS scope change the audit programme's risk profile and its prioritisation.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-ai-change-velocity-and-audit-frequency`, `ia-ai-supplier-and-model-dependency`, `ia-ai-systems-in-isms-scope`, `ia-shadow-ai-in-programme-planning` |

- **K:** Why systems whose behaviour changes without a change request disturb an interval set on a change-controlled assumption, and why model providers enter the programme through the Annex A supplier-relationship controls.
- **S:** Adjust a programme's frequency and priority for a scope that has acquired AI systems since the programme was set.
- **A:** Treats a model update as a change to the audited environment.

---

# Domain D3 - Conducting the audit: evidence, sampling and testing (25%)

**Description.** Determining the degree of verification information carries and the reliance a finding may place on it; sampling adequacy; evidence obtained by remote auditing methods; selecting collection methods; testing an Annex A control against its Statement of Applicability claim; the boundary of an ISMS audit; and what an AI-assisted evidence process establishes and leaves unverified.

**Tasks:** 9  |  **MCQ seats:** 13

## Tasks

### Task 3.1 - Determine what degree of verification collected information carries, and what reliance a finding can therefore place on it.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-evidence-3-10`, `ia-degree-of-verification`, `ia-objective-evidence-versus-audit-evidence`, `ia-professional-judgement-on-reliance`, `ia-unverifiable-information-handling` |

- **K:** ISO 19011:2026 defines audit evidence (3.10) as records, statements of fact or other information relevant to the audit criteria and verifiable, and separately defines objective evidence (3.9) as data supporting the existence or verity of something - two different defined terms, and clause 3.1's definition of audit uses the latter. Clause 6.4.7 states only information subject to some degree of verification should be accepted as audit evidence, and where that degree is low the auditor should use professional judgement to determine the degree of reliance placed on it.
- **S:** Determine what a described item of information establishes and what reliance a finding can place on it.
- **A:** Does not let relevance substitute for verifiability, and does not treat verification as binary.

### Task 3.2 - Determine a sampling approach and judge whether a sample supports the conclusion drawn from it.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-judgement-based-sampling`, `ia-sample-adequacy-for-conclusion`, `ia-sampling-and-confidence-in-conclusions`, `ia-sampling-guidance-annex-a-6`, `ia-statistical-sampling` |

- **K:** ISO 19011:2026 clause 4.7 states audit evidence should be based on samples because an audit runs for a specified duration with finite resources, and that appropriate use of sampling is closely related to the confidence that can be placed in the audit conclusions. Clause 6.4.7 requires collection by means of appropriate sampling. Sampling guidance is Annex A.6.
- **S:** Judge whether a described sample supports the conclusion drawn, and identify what would strengthen it.
- **A:** Reports the conclusion the sample supports rather than the one it was taken to support.

### Task 3.3 - Assess the reliability of evidence obtained through remote auditing methods.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-electronic-evidence-reliability`, `ia-evidence-provenance-in-remote-audit`, `ia-remote-method-additional-risks`, `ia-witnessed-access-and-screen-share` |

- **K:** Annex A.16 states the use of remote auditing methods can introduce additional risks and opportunities to the audit process, naming data security, confidentiality and contingency planning for technology failure among the considerations, together with the limitations electronic and remotely-obtained evidence carries against the clause 6.4.7 verification test.
- **S:** Assess a described piece of remotely-obtained evidence and determine what it establishes.
- **A:** Distinguishes what was seen from what was shown.

### Task 3.4 - Select the evidence-gathering method that fits the evidence sought.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-interviews-as-collection-method`, `ia-observation-as-collection-method`, `ia-re-performance-as-evidence-source`, `ia-review-of-documented-information` |

- **K:** ISO 19011:2026 clause 6.4.7 names interviews, observations and review of documented information among the methods of collecting information, and what each can and cannot establish.
- **S:** Select the method that produces the evidence a given audit trail needs.
- **A:** Does not accept a document as evidence that a process runs.

### Task 3.5 - Select the question form that elicits evidence rather than confirmation in a given interview situation.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-corroboration-across-interviewees`, `ia-interview-guidance-annex-a-17`, `ia-open-versus-closed-questions` |

- **K:** How question form shapes the evidential value of an answer. Interview guidance is ISO 19011:2026 Annex A.17.
- **S:** Determine which of several question forms would produce evidence rather than confirmation in a described interview.
- **A:** Does not treat agreement as corroboration.

### Task 3.6 - Determine whether an Annex A control operates as claimed in the Statement of Applicability.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-annex-a-control-testing`, `ia-control-design-versus-operating-effectiveness`, `ia-control-implementation-evidence`, `ia-statement-of-applicability-claim` |

- **K:** The difference between a control that is designed and one that operates, and that ISO/IEC 27001 clause 6.1.3 d) requires the Statement of Applicability to record whether each necessary control is implemented or not - which is the claim the auditor tests.
- **S:** Determine which evidence would establish whether a described control operates as claimed, and what a given result shows.
- **A:** Audits the claim the organization made, not the control the auditor would have chosen.

### Task 3.7 - Determine when control testing has reached the boundary of an ISMS audit and become a technical assessment.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-annex-a-8-34-audit-testing-agreement`, `ia-audit-feasibility-6-2-3`, `ia-isms-audit-boundary`, `ia-technical-expert-engagement-trigger` |

- **K:** ISO/IEC 27001 Annex A control 8.34 requires audit tests and other assurance activities involving assessment of operational systems to be planned and agreed between the tester and appropriate management, together with where management system auditing stops and technical assessment of controls begins.
- **S:** Determine whether a proposed test is within the audit's competence, scope and agreed terms.
- **A:** Escalates and seeks agreement rather than improvising past the boundary.

### Task 3.8 - Determine what an AI-assisted evidence process establishes and what it leaves unverified.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-ai-evaluation-tools-in-auditor-competence-7-2-3`, `ia-ai-selection-bias-in-evidence-sampling`, `ia-ai-summary-is-not-verified-information`, `ia-ai-tool-output-provenance`, `ia-auditor-accountability-for-ai-assisted-conclusions` |

- **K:** ISO 19011:2026 clause 7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools, and emerging technology, to conduct audits, giving artificial-intelligence-based evaluation tools as its example. Under clause 6.4.7 an AI-produced summary of a document the auditor did not open carries a low degree of verification, so professional judgement must set the reliance placed on it. An AI tool selecting which records to examine is making a sampling decision, which clause 4.7 ties to confidence in the audit conclusions. Accountability for the conclusion remains with the auditor regardless of the tool.
- **S:** Determine, for a described AI-assisted step, what it established and what remains unverified.
- **A:** Treats an AI tool as a method whose reliability must be evaluated, not as a source of evidence.

### Task 3.9 - Maintain traceability from an evidence source through to the finding it supports.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-records-5-5-7`, `ia-evidence-retention-and-confidentiality`, `ia-evidence-to-finding-traceability` |

- **K:** ISO 19011:2026 clause 6.4.7 requires audit evidence leading to audit findings to be recorded, and what a working-paper record must contain for a finding to be defensible later. Audit-related records are clause 5.5.7.
- **S:** Determine what a working-paper record must contain for a finding to remain defensible to a second auditor.
- **A:** Treats a finding without a traceable source as unusable.

---

# Domain D4 - Auditing the ISMS against ISO/IEC 27001 as criteria (25%)

**Description.** Auditing clauses 4 through 10 as the yardstick rather than the syllabus - scope, leadership, the whole of clause 6, the Statement of Applicability, support, operation and measurement - together with AI systems inside ISMS scope, control effectiveness under non-determinism, and the boundary between ISMS and AI management system conformity.

**Tasks:** 10  |  **MCQ seats:** 12

## Tasks

### Task 4.1 - Determine whether a declared ISMS scope is complete and defensible against clause 4.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-clauses-4-to-10-not-excludable`, `ia-interfaces-and-dependencies`, `ia-internal-and-external-issues-clause-4-1`, `ia-isms-scope-clause-4-3` |

- **K:** Clause 4.3 requires the scope determination to consider the 4.1 issues, the 4.2 requirements, and the interfaces and dependencies between activities performed by the organization and those performed by other organizations, with the scope available as documented information. Clause 1 Scope - not clause 4 - states that excluding any requirement in Clauses 4 to 10 is not acceptable when conformity is claimed.
- **S:** Examine a declared scope against the organization described and determine what has been left out.
- **A:** Treats an undeclared interface as the most likely place a scope fails.

### Task 4.2 - Determine whether evidence shows top management has demonstrated the leadership, policy and role assignments clause 5 requires.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-evidence-of-commitment-versus-statement-of-commitment`, `ia-information-security-policy-clause-5-2`, `ia-leadership-commitment-clause-5-1`, `ia-policy-availability-and-communication`, `ia-roles-responsibilities-authorities-clause-5-3` |

- **K:** The eight things clause 5.1 requires top management to demonstrate. Clause 5.2 requires the policy to be appropriate to purpose, to include objectives or provide the framework for setting them, and to include commitments to satisfy applicable requirements and to continual improvement - and separately to be available as documented information, communicated internally, and available to interested parties as appropriate. Clause 5.3 requires responsibilities and authorities to be assigned and communicated, with specific authority for ISMS conformity and for reporting performance to top management.
- **S:** Determine what evidence would establish that a described organization's top management has demonstrated a given clause 5.1 element.
- **A:** Distinguishes a documented commitment from a demonstrated one.

### Task 4.3 - Determine whether an organization's risk assessment, risk treatment, information security objectives and planning of changes conform to clause 6.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-annex-a-as-completeness-check`, `ia-information-security-objectives-clause-6-2`, `ia-no-risk-register-requirement`, `ia-planning-of-changes-clause-6-3`, `ia-risk-acceptance-criteria`, `ia-risk-assessment-process-clause-6-1-2`, `ia-risk-treatment-process-clause-6-1-3` |

- **K:** Clause 6.1.2 requires a defined risk assessment process establishing risk acceptance criteria and criteria for performing assessments, producing consistent, valid and comparable results, with risk owners identified. ISO/IEC 27001 does not require a risk register - clauses 6.1.2 and 6.1.3 require documented information about the processes, and clauses 8.2 and 8.3 require it of the results. NOTE 2 to clause 6.1.3 directs users to Annex A to ensure no necessary controls are overlooked and NOTE 3 states the Annex A list is not exhaustive, so Annex A is a completeness check and not a catalogue to select from. Clause 6.2 sets seven requirements on objectives and five on the planning to achieve them. Clause 6.3 Planning of changes is a real numbered requirement that does not appear on the standard's own contents page.
- **S:** Determine whether a described clause 6 process meets the requirements and whether its outputs are traceable to the treatment decisions.
- **A:** Audits the process the organization operates, not the one the auditor would design.

### Task 4.4 - Determine whether a Statement of Applicability is consistent with the risk treatment decisions behind it.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-risk-owner-approval-of-treatment-plan`, `ia-soa-four-required-elements`, `ia-soa-inclusion-and-exclusion-justification`, `ia-soa-versus-risk-treatment-plan-consistency` |

- **K:** The four elements clause 6.1.3 d) requires the Statement of Applicability to contain - the necessary controls, justification for their inclusion, whether they are implemented or not, and justification for excluding any Annex A control - and that clause 6.1.3 f) requires risk owners' approval of the treatment plan and acceptance of the residual risks.
- **S:** Trace an inclusion or exclusion back to the risk treatment decision that should support it.
- **A:** Treats an unjustified exclusion as a finding regardless of how reasonable it sounds.

### Task 4.5 - Select the evidence that would establish conformity with a given clause 7 requirement for competence, awareness or documented information.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-awareness-clause-7-3`, `ia-competence-clause-7-2`, `ia-control-of-documented-information`, `ia-documented-information-clause-7-5` |

- **K:** Clause 7.2 requires the necessary competence to be determined, persons to be competent on the basis of education, training or experience, actions taken where applicable with their effectiveness evaluated, and documented information retained as evidence of competence. Clause 7.3 sets what persons must be aware of. Clause 7.5 has three parts covering what the ISMS must include, creating and updating, and control of documented information.
- **S:** Select the evidence that would establish conformity with a given clause 7 requirement.
- **A:** Distinguishes attendance from competence.

### Task 4.6 - Determine whether operational planning and control and the clause 9.1 measurement arrangements are operating as planned.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-clause-6-defines-clause-8-performs`, `ia-monitoring-and-measurement-clause-9-1`, `ia-operational-planning-and-control-clause-8-1`, `ia-risk-assessment-and-treatment-in-operation-clause-8-2-8-3`, `ia-who-monitors-and-who-evaluates` |

- **K:** Clause 6 defines the processes and clause 8 performs them - 6.1.2 defines the risk assessment process and 8.2 performs assessments at planned intervals or on significant change; 6.1.3 defines the treatment process and 8.3 implements the plan. Clause 9.1 requires the organization to determine six things, including who shall monitor and measure and who shall analyse and evaluate.
- **S:** Determine whether described operational evidence shows the planned arrangements actually running.
- **A:** Looks for the operation of a plan rather than the existence of one.

### Task 4.7 - Determine whether the organization has addressed the climate change consideration Amendment 1:2024 adds to clause 4.1.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-amendment-1-2024-climate-change`, `ia-climate-change-as-a-4-1-issue`, `ia-interested-party-climate-requirements-4-2` |

- **K:** Amendment 1:2024 requires the organization to determine whether climate change is a relevant issue, naming it specifically rather than as a general environmental condition, and adds a note at clause 4.2 that relevant interested parties can have climate-change-related requirements. NOTE: the amended text has not been read directly; wording pending verification against the amended standard before this task's lesson is authored.
- **S:** Determine whether a described organization has addressed the requirement and what evidence would show it.
- **A:** Checks the named requirement rather than a paraphrase of it.

### Task 4.8 - Identify AI systems and AI-derived assets inside the ISMS scope that the asset inventory has not captured.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-ai-derived-information-assets`, `ia-model-weights-and-training-data-as-assets`, `ia-prompt-and-inference-logs`, `ia-shadow-ai-discovery` |

- **K:** The asset classes an AI system introduces, why they are routinely absent from inventories built before the system arrived, and that Annex A 5.9 requires an inventory of information and other associated assets including owners.
- **S:** Determine from a described environment which AI-related assets fall inside scope and are unaccounted for.
- **A:** Treats an absent asset class as more likely than an absent control.

### Task 4.9 - Determine whether an Annex A control still operates as claimed where the process it protects has become non-deterministic.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-control-effectiveness-drift`, `ia-human-review-of-ai-output-as-control`, `ia-non-deterministic-process-control-challenge` |

- **K:** Why a control validated against a deterministic process may not hold when the same process produces varying output, and what evidence of continued effectiveness looks like in that case.
- **S:** Determine whether described evidence still supports an effectiveness claim after the protected process changed character.
- **A:** Treats "the control passed last year" as a statement about last year.

### Task 4.10 - Distinguish ISMS conformity from AI management system conformity where the two scopes overlap.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-27001-42001-scope-overlap`, `ia-42001-annex-d-integration-guidance`, `ia-audit-requirement-divergence-27001-42001`, `ia-combined-audit-3-2`, `ia-isms-competence-does-not-satisfy-aims-competence`, `ia-management-review-input-divergence` |

- **K:** The two standards share the harmonized structure but diverge in text at points that change what an auditor must look for. ISO/IEC 27001 clause 9.2.2 a) requires audit criteria and scope where ISO/IEC 42001 requires objectives, criteria and scope. ISO/IEC 27001 reports results to relevant management, ISO/IEC 42001 to relevant managers. ISO/IEC 27001's management review inputs additionally require fulfilment of objectives, feedback from interested parties, and risk assessment results and treatment plan status - none of which ISO/IEC 42001 requires. ISO/IEC 27001 clause 9.1 names who shall monitor and who shall analyse, ISO/IEC 42001 does not. ISO/IEC 27001 requires risk owners' approval of the treatment plan where ISO/IEC 42001 requires designated management approval. ISO/IEC 42001 alone carries the AI system impact assessment at 6.1.4, an input to its risk assessment. ISO 19011:2026 defines a combined audit (3.2) as one carried out together at a single auditee on two or more management systems. ISO/IEC 42001 Annex D.2 is informative and discusses integrated implementation with ISO/IEC 27001.
- **S:** Determine which standard a described requirement or finding belongs to when both systems are in scope.
- **A:** Does not accept conformity with one system as evidence of conformity with the other.

---

# Domain D5 - Findings, reporting, follow-up and management review (17.5%)

**Description.** Determining whether evidence constitutes a nonconformity and whether findings are systemic; classifying against a declared scheme; writing a defensible nonconformity statement; disclosing AI-assisted method in the audit report; judging corrective action adequacy; verification and closure; and what must reach clause 9.3 management review.

**Tasks:** 7  |  **MCQ seats:** 9

## Tasks

### Task 5.1 - Classify a finding against the audit programme's declared classification scheme.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-finding-3-11`, `ia-classification-scheme-is-an-organizational-choice`, `ia-compliance-versus-conformity-language`, `ia-finding-classification-scheme`, `ia-opportunity-for-improvement` |

- **K:** ISO/IEC 27001 uses the term nonconformity and requires reaction, correction and corrective action at clause 10.2, but defines no severity scheme and does not use observation or opportunity for improvement as finding categories at all. A major/minor distinction comes from third-party certification practice under ISO/IEC 17021-1, and an internal programme adopts a scheme by its own choice. The term nonconformity is defined in ISO/IEC 27000, not in ISO/IEC 27001. ISO 19011:2026 clause 3.8 Note 1 records that where the audit criteria are legal requirements, compliance and non-compliance are often used in a finding rather than conformity language.
- **S:** Classify a described finding against a scheme that has been given.
- **A:** Applies the programme's declared scheme rather than a remembered one.

### Task 5.2 - Determine whether the evidence constitutes a nonconformity, and whether a set of findings indicates a systemic rather than an isolated failure.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-absence-of-evidence-versus-evidence-of-absence`, `ia-generating-audit-findings-6-4-8`, `ia-isolated-versus-systemic-failure`, `ia-nonconformity-determination` |

- **K:** What must be true for evidence to establish a nonconformity, and that ISO/IEC 27001 clause 10.2 b) 3) directs the organization to determine whether similar nonconformities exist or could potentially occur - the standard's own hook for systemic reasoning. Generating audit findings is ISO 19011:2026 clause 6.4.8.
- **S:** Determine from a set of described findings whether a systemic failure is present.
- **A:** Does not raise a nonconformity on absent evidence without first establishing that evidence should exist.

### Task 5.3 - Select the nonconformity statement that correctly links the evidence to the requirement it fails.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-nonconformity-statement-structure`, `ia-requirement-to-evidence-link`, `ia-statement-objectivity` |

- **K:** What a statement must contain for the recipient to act on it without the auditor present, and that ISO 19011:2026's fair presentation principle (4.3) requires findings, conclusions and reports to reflect the auditing activities truthfully and accurately.
- **S:** Determine which of several candidate statements names the requirement, the evidence and the gap without prescribing the remedy.
- **A:** States what was found rather than what should be done.

### Task 5.4 - Determine what an audit report must disclose about AI-assisted evidence processing so that a reader can judge the reliability of the evidence.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-ai-assisted-method-disclosure`, `ia-audit-report-content-6-5-1`, `ia-disclosure-proportionality`, `ia-reader-judgement-of-evidence-reliability` |

- **K:** What an audit report contains under ISO 19011:2026 clause 6.5.1, and why a method that shaped which evidence was examined belongs in it while an incidental tool does not - following from clause 6.4.7's requirement that the degree of reliance placed on low-verification evidence be a matter of stated professional judgement.
- **S:** Determine what a described audit must disclose about its AI-assisted steps for its conclusions to be assessable.
- **A:** Treats an undisclosed method that shaped the evidence as a defect in the report.

### Task 5.5 - Determine whether a proposed correction, root cause analysis and corrective action adequately address a nonconformity.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-clause-10-2-requirements`, `ia-correction-versus-corrective-action`, `ia-recurrence-prevention`, `ia-root-cause-analysis-adequacy` |

- **K:** Clause 10.2 a) requires reacting to the nonconformity including action to control and correct it and to deal with the consequences, while clause 10.2 b) requires evaluating the need for action to eliminate the causes so it does not recur or occur elsewhere - the operative distinction between correction and corrective action, neither of which is defined inside ISO/IEC 27001. Corrective actions shall be appropriate to the effects of the nonconformities encountered.
- **S:** Determine whether a described corrective action would prevent recurrence or only close the instance.
- **A:** Does not accept retraining as a root cause response by default.

### Task 5.6 - Determine the verification approach for a corrective action and whether a finding may be closed.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-follow-up-6-7`, `ia-corrective-action-verification`, `ia-finding-closure-criteria` |

- **K:** ISO/IEC 27001 clause 10.2 d) requires the effectiveness of any corrective action taken to be reviewed, and ISO 19011:2026 clause 6.7 covers conducting the audit follow-up.
- **S:** Determine whether described evidence supports closing a finding.
- **A:** Does not close on a commitment.

### Task 5.7 - Determine which audit results clause 9.3 requires to reach management review.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ia-audit-results-as-management-review-input`, `ia-fulfilment-of-objectives-as-input`, `ia-management-review-inputs-clause-9-3-2`, `ia-reporting-results-to-relevant-management` |

- **K:** Clause 9.2.2 c) requires audit results to be reported to relevant management, and clause 9.3.2 d) 3) places audit results among the management review inputs, nested under feedback on information security performance alongside nonconformities and corrective actions, monitoring and measurement results, and fulfilment of information security objectives.
- **S:** Select from a described audit's outputs what must reach management review.
- **A:** Treats the review input as the point of the audit rather than its administrative tail.

---

*Generated 2026-09-02 by scripts/gen-jta-doc.mjs from certification ISMS-IA (7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417).*
