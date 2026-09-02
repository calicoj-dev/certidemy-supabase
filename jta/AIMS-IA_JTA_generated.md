# AIMS-IA - Job-Task Analysis

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

**Certification:** ISO/IEC 42001:2023 Internal Auditor  
**Status:** available

---

## Exam facts

| Attribute | Value |
|-|-|
| Questions | 50 |
| Duration | 165 minutes |
| Passing score | 75% (38/50) |
| Format | Multiple choice (single answer), online |
| Bloom ceiling | 4 (Analyze) for MCQ; 5-6 reserved for simulation |
| Languages | English, es-419, pt-BR |

## Domain structure

| # | Domain | Weight | MCQ seats |
|-|-|-|-|
| D1 | The internal audit function and its boundaries | 12.5% | 6 |
| D2 | Audit programme management | 20% | 10 |
| D3 | Conducting the audit: evidence, sampling and testing | 20% | 10 |
| D4 | Auditing the AIMS against ISO/IEC 42001 as criteria | 30% | 15 |
| D5 | Findings, reporting, follow-up and management review | 17.5% | 9 |
| **Total** | | **100%** | **50** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 2 (Understand) | 5 | 13.02% |
| 3 (Apply) | 7 | 17.5% |
| 4 (Analyze) | 28 | 69.48% |

---

# Domain D1 - The internal audit function and its boundaries (12.5%)

**Description.** Who the internal auditor is, what governs their work, and what does not. Establishes ISO 19011 as method and ISO/IEC 42001 as criteria, the seven principles and how they interact, and the boundary against certification-body activity. Without this, every downstream judgment rests on borrowed assumptions.

**Tasks:** 5  |  **MCQ seats:** 6

## Tasks

### Task 1.1 - Classify a described audit engagement as first, second or third party and locate the internal auditor's remit within it

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aia-audit-client-vs-auditee`, `aia-audit-party-types`, `aia-internal-audit-definition` |

- **K:** ISO 19011:2026 Table 1 - first party is internal audit, second party is external-provider or interested-party audit, third party is certification audit or accreditation assessment. Clause 3.1 Notes 1-2.
- **S:** Place a described engagement in the correct category.
- **A:** Resisting the assumption that "audit" means an outsider with a certificate.

### Task 1.2 - Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-principle-interaction-in-practice`, `aia-principles-carry-no-precedence`, `aia-professional-judgement`, `aia-seven-principles` |

- **K:** The seven principles at 4.2-4.8. Clause 4.1 states adherence is fundamental and that Clauses 5 to 7 are based on them; it states nothing about ranking.
- **S:** Identify which principles a situation actually engages - not every principle bears on every situation - and state what a defensible resolution weighs.
- **A:** Tolerating that the text does not decide it for you.

### Task 1.3 - Apply the distinction between ISO 19011 as methodology and ISO/IEC 42001 as criteria to a proposed audit finding

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aia-19011-is-guidance-only`, `aia-audit-criteria-definition`, `aia-method-vs-criteria`, `aia-no-certification-to-19011` |

- **K:** ISO 19011:2026 contains one shall (patent boilerplate) and 264 should; clause 1 says it gives guidance. It has no normative references and names no management-system standard. 42001 names it once, in a Note to entry at 3.18.
- **S:** Given a proposed finding, identify whether the criterion cited is capable of being a criterion at all.
- **A:** Refusing to write "ISO 19011 requires".

### Task 1.4 - Analyze how an internal auditor preserves objectivity where independence from the audited activity is not practicable

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-42001-impartiality-clause`, `aia-independence-wherever-practicable`, `aia-objectivity-safeguards`, `aia-small-organization-constraint` |

- **K:** ISO 19011:2026 clause 4.6 asks auditors to be independent of the activity audited wherever practicable and, where internal auditors cannot be, to make every effort to remove bias and encourage objectivity. ISO/IEC 42001 clause 9.2.2 b) asks the organization to select auditors and conduct audits to ensure objectivity and the impartiality of the audit process.
- **S:** Evaluate proposed safeguards where the only competent person also built the thing.
- **A:** Naming one's own conflict rather than working around it.

### Task 1.5 - Classify activities in a described audit programme as within or outside the internal auditor's remit

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aia-17021-1-governs-certification-bodies`, `aia-42006-scope-boundary`, `aia-internal-vs-certification-audit`, `aia-no-certification-decision` |

- **K:** ISO 19011:2026 states that ISO/IEC 17021-1 provides the requirements for third-party certification audits. ISO/IEC 42006:2025 supplements 17021-1 with AI-specific requirements for bodies auditing and certifying an AIMS. Neither applies to the candidate.
- **S:** Identify which activities in a described programme fall outside the internal auditor's remit.
- **A:** Not importing certification-audit habits into a first-party programme.

---

# Domain D2 - Audit programme management (20%)

**Description.** The programme above the individual audit: objectives, risks, resources, competence, scope, methods, monitoring and improvement. ISO 19011:2026 clause 5 throughout, with the AIMS-specific twist that programme scope depends on which roles the organization holds toward its AI systems.

**Tasks:** 7  |  **MCQ seats:** 10

## Tasks

### Task 2.1 - Explain the objectives an AIMS audit programme serves and how they derive from organizational context

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aia-objectives-from-context`, `aia-programme-objectives`, `aia-programme-vs-individual-audit` |

- **K:** ISO 19011:2026 clause 5.2. The distinction between programme-level and audit-level objectives.
- **S:** Trace a stated programme objective back to a contextual driver.
- **A:** Treating the programme as a designed thing, not a calendar.

### Task 2.2 - Analyze how audit programme risks and opportunities shape its scope and resourcing

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-programme-resources`, `aia-programme-risks`, `aia-risk-based-approach`, `aia-risk-vs-evidence-tension` |

- **K:** Clauses 5.3 and 5.4.4. The risk-based approach at 4.8 "should substantively influence the planning and implementation of the audit programme".
- **S:** Given constrained hours, justify where audit effort concentrates.
- **A:** Accepting that concentrating effort means accepting thinner coverage elsewhere, and saying so.

### Task 2.3 - Determine the competence an AIMS audit team requires given the AI systems in scope

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-aims-specific-knowledge`, `aia-auditor-competence`, `aia-competence-gap-remedies`, `aia-technical-expert-vs-auditor` |

- **K:** ISO 19011:2026 clauses 5.4.2, 7.2.3, 7.2.4. The distinction between an auditor and a technical expert on the team.
- **S:** Identify the competence gap a given AI system creates and select a remedy that does not compromise objectivity.
- **A:** Admitting where one cannot competently evaluate the evidence.

### Task 2.4 - Analyze how audit programme scope is set when the organization holds more than one role toward its AI systems

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-developer-provider-user`, `aia-multiple-roles-one-system`, `aia-organizational-roles-4-1`, `aia-role-changes-obligations`, `aia-scope-follows-roles` |

- **K:** ISO/IEC 42001 clause 4.1 has the organization consider the intended purpose of AI systems it develops, provides or uses, and determine its roles with respect to them. Clause 4.3 scoping follows.
- **S:** Given a described estate, determine which roles are in play - including where one organization holds more than one role on a single AI system, such as fine-tuning a third-party model and then providing it to customers - and determine what the programme must therefore cover.
- **A:** Not collapsing "we use AI" into a single undifferentiated role.

### Task 2.5 - Determine the objectives, scope and criteria for an individual AIMS audit

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-42001-9-2-2-a`, `aia-audit-scope-definition`, `aia-criteria-selection`, `aia-individual-audit-objectives` |

- **K:** ISO 19011:2026 clause 5.5.2. ISO/IEC 42001 clause 9.2.2 a) has the organization define the audit objectives, criteria and scope for each audit.
- **S:** Write a scope statement that a finding can later be tested against.
- **A:** Precision at the outset rather than at the report stage.

### Task 2.6 - Determine which auditing methods fit the evidence an AI management system produces, including remote methods and virtual locations

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-auditing-methods`, `aia-method-fit-to-evidence`, `aia-remote-audit-methods`, `aia-virtual-location` |

- **K:** ISO 19011:2026 clause 5.5.3 and Annex A.16; the fourth edition expanded this from ISO/IEC TS 17012. Much AIMS evidence has no physical location.
- **S:** Match method to evidence type and justify the choice.
- **A:** Not defaulting to on-site as the rigorous option or remote as the convenient one.

### Task 2.7 - Explain how audit programme results are monitored, reviewed and improved

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aia-audit-records`, `aia-programme-monitoring`, `aia-programme-review-improvement` |

- **K:** ISO 19011:2026 clauses 5.5.6, 5.5.7, 5.6, 5.7.
- **S:** Identify what a programme review should examine.
- **A:** Treating the programme itself as subject to improvement.

---

# Domain D3 - Conducting the audit: evidence, sampling and testing (20%)

**Description.** The individual audit from initiation to completion - ISO 19011:2026 clause 6 and Annex A. Domain 3 is about the quality of the evidence: whether it was gathered soundly, sampled defensibly and verified. Whether it satisfies a particular requirement is Domain 4.

**Tasks:** 8  |  **MCQ seats:** 10

## Tasks

### Task 3.1 - Place a described audit activity at its correct point in the sequence from initiation to completion

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aia-audit-feasibility`, `aia-audit-sequence`, `aia-completing-the-audit`, `aia-initiating-the-audit` |

- **K:** ISO 19011:2026 clauses 6.2 to 6.6, including 6.2.3 feasibility.
- **S:** Place a described activity at the correct point in the sequence.
- **A:** Following a sequence without treating it as a script.

### Task 3.2 - Analyze whether the review of documented information supports proceeding to further audit activities

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-audit-planning`, `aia-documented-information-review`, `aia-plan-adjustment`, `aia-working-documents` |

- **K:** ISO 19011:2026 clauses 6.3.1, 6.3.2, 6.3.4 and Annex A.13.
- **S:** Judge whether what was supplied is enough to plan against, and what to do when it is not.
- **A:** Raising an obstacle early rather than absorbing it.

### Task 3.3 - Determine an appropriate sampling approach for AIMS audit evidence

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-judgement-based-sampling`, `aia-sample-defensibility`, `aia-sampling-general`, `aia-statistical-sampling` |

- **K:** ISO 19011:2026 Annex A.6, including A.6.2 and A.6.3.
- **S:** Choose an approach that fits the population and state what the sample can and cannot support.
- **A:** Not generalizing beyond what was sampled.

### Task 3.4 - Analyze whether information collected constitutes verified audit evidence

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-collecting-verifying-information`, `aia-evidence-based-approach`, `aia-evidence-vs-assertion`, `aia-verifying-information` |

- **K:** ISO 19011:2026 clause 6.4.7, Annex A.5, and the evidence-based principle at 4.7. Only verifiable information can be audit evidence.
- **S:** Separate what was demonstrated from what was described.
- **A:** Declining to record an assertion as evidence because the person was credible.

### Task 3.5 - Determine what to ask and how to record it when interviewing personnel involved in AI system work

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-conducting-interviews`, `aia-interview-confirmation`, `aia-interview-selection-of-persons`, `aia-leading-question-risk` |

- **K:** ISO 19011:2026 Annex A.17 ("Conducting interviews"), and clause 6.4.4 on communication during the audit.
- **S:** Frame questions that surface evidence rather than agreement, and confirm what was recorded.
- **A:** Interviewing a specialist without deferring to them or posturing against them.

### Task 3.6 - Analyze the sufficiency of evidence obtained through remote auditing methods

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-remote-access-limits`, `aia-remote-evidence-sufficiency`, `aia-remote-vs-onsite-tradeoff`, `aia-screen-share-verification` |

- **K:** ISO 19011:2026 Annex A.16 and clause 6.4.5 on access to audit information.
- **S:** Judge whether a remotely demonstrated control was actually verified.
- **A:** Naming the limits of what a screen share showed.

### Task 3.7 - Select sources of information appropriate to an AIMS audit

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aia-aims-evidence-types`, `aia-data-and-tooling-records`, `aia-sources-of-information` |

- **K:** ISO 19011:2026 Annex A.14. AIMS-specific sources: data documentation, tooling and computing resource records, impact assessment outputs, event logs.
- **S:** Choose the source that answers the question being asked.
- **A:** Going to the record rather than the summary of the record.

### Task 3.8 - Explain the purpose and conduct of the opening and closing meetings

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aia-closing-meeting`, `aia-guides-and-observers`, `aia-opening-meeting` |

- **K:** ISO 19011:2026 clauses 6.4.2, 6.4.3, 6.4.10.
- **S:** Identify what belongs in each meeting.
- **A:** Setting expectations rather than assuming them.

---

# Domain D4 - Auditing the AIMS against ISO/IEC 42001 as criteria (30%)

**Description.** The largest domain, and where this cert diverges from its ISMS sibling. Testing the management system clause by clause, with the layered normativity of Annex A and Annex B, the role-based scope, and the AI system impact assessment as a required artifact with no ISO/IEC 27001 equivalent.

**Tasks:** 13  |  **MCQ seats:** 15

## Tasks

### Task 4.1 - Analyze whether the organization's determination of its roles toward its AI systems is adequately evidenced

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-clause-4-1-context`, `aia-external-internal-issues`, `aia-intended-purpose-consideration`, `aia-role-assertion-vs-determination`, `aia-role-determination-evidence` |

- **K:** ISO/IEC 42001 clause 4.1 - determine external and internal issues, consider the intended purpose of AI systems developed, provided or used, determine the organization's roles.
- **S:** Distinguish a reasoned determination - one that names the systems, applies the developer / provider / user categories to each, and records why - from a bare assertion that "we use AI tools". The first is auditable; the second is not.
- **A:** Pressing on a scope decision that was inherited rather than made.

### Task 4.2 - Analyze whether the AIMS scope statement is defensible given the AI systems and roles determined

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-clause-4-3-scope`, `aia-interested-party-requirements`, `aia-scope-boundaries-applicability`, `aia-scope-exclusion-justification` |

- **K:** ISO/IEC 42001 clauses 4.2 and 4.3.
- **S:** Identify a system or activity that the stated scope excludes without justification.
- **A:** Treating a scope statement as testable rather than as given.

### Task 4.3 - Determine whether leadership and AI policy requirements are evidenced

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-ai-policy-requirements`, `aia-clause-5-leadership`, `aia-policy-review-a-2-4`, `aia-roles-responsibilities-authorities` |

- **K:** ISO/IEC 42001 clauses 5.1, 5.2, 5.3; controls A.2.2, A.2.3, A.2.4, A.3.2, A.3.3.
- **S:** Distinguish a policy that exists from a policy that is maintained and reviewed.
- **A:** Auditing leadership commitment through artifacts, not attitude.

### Task 4.4 - Analyze whether the AI risk assessment process conforms to clause 6.1.2

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-clause-6-1-2-risk-assessment`, `aia-no-risk-register-requirement`, `aia-repeatable-comparable-results`, `aia-risk-criteria` |

- **K:** ISO/IEC 42001 clause 6.1.2. Documented information is required about the process.
- **S:** Test the process against its own stated criteria.
- **A:** Not requiring an artifact the standard does not name.

### Task 4.5 - Analyze whether the AI risk treatment process and the statement of applicability conform to clause 6.1.3

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-additional-controls-beyond-annex-a`, `aia-clause-6-1-3-risk-treatment`, `aia-control-comparison-annex-a`, `aia-statement-of-applicability` |

- **K:** ISO/IEC 42001 clause 6.1.3 a) to f) - select treatment options, determine necessary controls and compare with Annex A to verify none necessary has been omitted, consider Annex A controls, identify additional controls, consider Annex B guidance, produce a statement of applicability with justification for inclusion and exclusion.
- **S:** Test whether the comparison against Annex A was actually performed.
- **A:** Reading the justification column rather than counting the rows.

### Task 4.6 - Distinguish the AI system impact assessment from the AI risk assessment and determine whether clause 6.1.4 is met

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-annex-a-5-impact-controls`, `aia-clause-6-1-4-impact-assessment`, `aia-clause-8-4-operational-impact-assessment`, `aia-consequences-for-individuals-societies`, `aia-impact-results-into-risk-assessment`, `aia-impact-vs-risk-assessment` |

- **K:** ISO/IEC 42001 clause 6.1.4 - a process for assessing potential consequences for individuals, groups of individuals and societies from development, provision or use of AI systems; it addresses deployment, intended use and foreseeable misuse; it takes account of the technical and societal context and applicable jurisdictions; the result shall be documented; the organization shall consider the results in the risk assessment. Clause 8.4 performs it operationally. Annex A.5 "Assessing impacts of AI systems" carries the supporting controls, including A.5.2 (impact assessment process) and A.5.5 (assessing societal impacts).
- **S:** Identify an organization that has run a risk assessment and called it an impact assessment.
- **A:** Holding the distinction under pressure from an auditee who considers it pedantic.

### Task 4.7 - Analyze whether documented information requirements under clause 7.5 are met

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-awareness-and-communication`, `aia-clause-7-5-documented-information`, `aia-creating-updating-control`, `aia-documented-information-vs-record` |

- **K:** ISO/IEC 42001 clauses 7.1, 7.3, 7.4, 7.5.1-7.5.3. (Competence, clause 7.2, is task 4.13.)
- **S:** Test control of documented information rather than its existence.
- **A:** Distinguishing a document that is controlled from one that is merely present.

### Task 4.8 - Analyze whether operational planning and control under clause 8 is evidenced

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-clause-8-1-operational-control`, `aia-clause-8-2-8-3-operational-risk`, `aia-outsourced-processes`, `aia-planned-changes-control` |

- **K:** ISO/IEC 42001 clauses 6.3, 8.1, 8.2, 8.3, 8.4. Clauses 8.2 and 8.3 require documented information of the results.
- **S:** Trace a planned change through to its controlled implementation.
- **A:** Following the process into practice rather than stopping at the procedure.

### Task 4.9 - Determine the normative status of an Annex A control and of Annex B guidance when testing conformity

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-annex-a-normative-shall`, `aia-annex-b-binds-via-6-1-3-e`, `aia-annex-b-normative-but-should`, `aia-annex-c-d-informative`, `aia-modal-shall-should-note` |

- **K:** Annex A is normative and Table A.1 controls are stated with shall. Annex B is normative and restates the same controls with should; it binds because 6.1.3 e) has the organization consider it, and B.1 exempts implementation guidance from the statement of applicability. Annexes C and D are informative. Clauses 4-10 contain no should at all.
- **S:** Given a proposed finding built on an Annex B sentence, determine whether it can stand.
- **A:** Preserving the modal in one's own writing.

### Task 4.10 - Analyze whether the controls declared in the statement of applicability are justified against Annex A

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-control-objectives-a-2-to-a-10`, `aia-controls-not-all-required`, `aia-soa-inclusion-exclusion-justification`, `aia-soa-vs-implementation-evidence` |

- **K:** Annex A.1 states that not all control objectives and controls in Table A.1 are required to be used, and that the organization can design and implement its own. Clause 6.1.3 f) requires the statement of applicability with justification for inclusion and exclusion.
- **S:** Test an exclusion against the risk treatment that produced it.
- **A:** Auditing the justification, not the checkbox.

### Task 4.11 - Explain how climate change is addressed in ISO/IEC 42001 clauses 4.1 and 4.2

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aia-climate-change-4-1`, `aia-climate-native-not-amendment`, `aia-climate-note-4-2` |

- **K:** Clause 4.1 has the organization determine whether climate change is a relevant issue; the NOTE at 4.2 observes that relevant interested parties can have requirements related to climate change. Both are in the published first edition - there is no amendment to ISO/IEC 42001.
- **S:** Identify what the auditor can and cannot require here: a determination was made, not a particular answer.
- **A:** Not inflating a determination requirement into a performance requirement.

### Task 4.12 - Analyze whether a control declared in the statement of applicability is implemented as declared

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-a-4-resource-documentation`, `aia-a-6-life-cycle-controls`, `aia-a-7-data-controls`, `aia-control-families-a-2-to-a-10`, `aia-declared-vs-implemented` |

- **K:** The auditor knows the nine Annex A control families - A.2 policies, A.3 internal organization, A.4 resources for AI systems, A.5 assessing impacts, A.6 AI system life cycle, A.7 data for AI systems, A.8 information for interested parties, A.9 use of AI systems, A.10 third-party and customer relationships - and knows that A.4, A.6 and A.7 call for documentation about data, tooling, computing and human resources that no ISO/IEC 27001 control asks for.
- **S:** The auditor selects a control the organization declared in the statement of applicability, traces it to the evidence of its implementation, and determines whether the evidence supports the declaration.
- **A:** Testing what was claimed rather than what would have been sensible to claim.

### Task 4.13 - Analyze whether people performing AI-related work meet the competence requirements the AIMS claims

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-a-4-6-human-resources`, `aia-clause-7-2-competence`, `aia-competence-evidence-vs-headcount`, `aia-organizational-vs-auditor-competence` |

- **K:** The auditor knows ISO/IEC 42001 clause 7.2 - determine necessary competence, ensure competence on the basis of education, training or experience, take action where needed, and retain documented information as evidence - and control A.4.6, under which the organization documents information about the human resources and their competences used across the AI system life cycle.
- **S:** The auditor tests whether the organization has determined what competence its AI work requires and evidenced that the people doing it hold it, rather than accepting a headcount or a job title as the evidence.
- **A:** Raising a competence gap about named colleagues without making it personal.

---

# Domain D5 - Findings, reporting, follow-up and management review (17.5%)

**Description.** Turning evidence into findings that survive challenge, reporting them to the people who can act, and closing the loop through corrective action and management review. Where Domain 4 asks whether a requirement is met, Domain 5 asks whether the statement saying so is defensible.

**Tasks:** 7  |  **MCQ seats:** 9

## Tasks

### Task 5.1 - Classify a described observation as a conformity, a nonconformity or an opportunity for improvement

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aia-classification-scheme-is-an-organizational-choice`, `aia-opportunity-for-improvement`, `aia-recording-conformities`, `aia-recording-nonconformities` |

- **K:** ISO 19011:2026 Annex A.18.1-A.18.3. ISO/IEC 42001 uses only the term nonconformity and defines no severity scheme; a major/minor distinction comes from third-party certification practice under ISO/IEC 17021-1, and an internal programme may adopt any scheme it declares. Unlike ISO/IEC 27001, which relies on ISO/IEC 27000 for the term, ISO/IEC 42001 defines nonconformity itself at clause 3.16 - non-fulfilment of a requirement - alongside conformity (3.15) and corrective action (3.17).
- **S:** Classify a described observation.
- **A:** Not upgrading an observation to make it land.

### Task 5.2 - Select the nonconformity statement that correctly links evidence to the requirement

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aia-evidence-requirement-link`, `aia-finding-does-not-attribute-intent`, `aia-finding-does-not-prescribe-remedy`, `aia-finding-structure` |

- **K:** A nonconformity statement names the requirement, states the evidence, and asserts the gap between them.
- **S:** Choose the statement that does this and no more.
- **A:** Withholding the fix and the blame.

### Task 5.3 - Analyze a finding that engages more than one audit criterion

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-combining-vs-separating-findings`, `aia-criteria-cross-reference`, `aia-multiple-criteria-findings` |

- **K:** ISO 19011:2026 Annex A.18.4 on dealing with audit findings related to multiple criteria.
- **S:** Decide whether to record one finding referencing several criteria or several findings.
- **A:** Choosing for the reader's benefit rather than the tally.

### Task 5.4 - Determine whether a proposed finding is supportable given the normative status of the clause cited

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-finding-against-a-note`, `aia-finding-against-annex-b`, `aia-finding-against-should-text`, `aia-nonconformity-needs-a-shall` |

- **K:** A nonconformity requires an unfulfilled requirement. ISO 19011 contains none. Annex B is written in should. Notes are not requirements - with the 3.26 drafting anomaly noted and avoided as an item basis.
- **S:** Identify which of several proposed findings can actually stand, and restate the others as observations.
- **A:** Withdrawing one's own finding when the criterion will not bear it.

### Task 5.5 - Analyze the adequacy of an audit report for its intended recipients

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-audit-report-content`, `aia-confidentiality-in-reporting`, `aia-fair-presentation-in-reporting`, `aia-report-distribution` |

- **K:** ISO 19011:2026 clauses 6.5.1 and 6.5.2; the fair presentation principle at 4.3 and confidentiality at 4.5.
- **S:** Judge whether a report is complete without disclosing what it should not.
- **A:** Writing for a reader who was not in the room.

### Task 5.6 - Determine whether corrective action and its follow-up satisfy clause 10.2

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `aia-cause-analysis`, `aia-clause-10-2-corrective-action`, `aia-correction-vs-corrective-action`, `aia-follow-up-verification` |

- **K:** ISO/IEC 42001 clause 10.2 - react to the nonconformity, evaluate the need for action to eliminate the causes, implement, review effectiveness. ISO 19011:2026 clause 6.7 on audit follow-up.
- **S:** Distinguish a correction from a corrective action and judge whether effectiveness was reviewed.
- **A:** Not closing a finding because the immediate symptom is gone.

### Task 5.7 - Explain how internal audit results feed the management review inputs in clause 9.3.2

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aia-audit-results-as-review-input`, `aia-clause-9-3-management-review`, `aia-review-results-9-3-3` |

- **K:** ISO/IEC 42001 clause 9.3.2 lists audit results and trends in nonconformities and corrective actions among management review inputs; 9.3.3 requires documented results.
- **S:** Trace an audit finding to its place in the review.
- **A:** Seeing the audit as an input to governance rather than an end in itself.

---

*Generated 2026-09-02 by scripts/gen-jta-doc.mjs from certification AIMS-IA (4818fc03-6da0-4266-9329-0e1ea2ea3fb4).*
