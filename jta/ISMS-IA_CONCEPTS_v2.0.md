# ISMS-IA — Concept Register v2.0

**Companion to** `ISMS-IA_JTA_v2.0.md` · **File:** `supabase/jta/ISMS-IA_CONCEPTS_v2.0.md`
**169 concepts · 169 `task_concepts` links · 38 tasks**

`concepts (certification_id, slug, name, description)`
`task_concepts (task_id, concept_id)` — written in the **same** scaffold migration.

---

## 0. RULES THIS TABLE FOLLOWS

**Every slug carries the `ia-` prefix.** `CERT-SCHEMA-GUIDE` §4 says
`concepts.slug` is unique within the cert, which would make this unnecessary — but
that guide was wrong three times in one session during the `ISMS-F` build, and
`AIMS-F` needed a commit to fix a slug collision. ISMS-IA shares almost its whole
vocabulary with `ISMS-F`'s 192 concepts. The prefix is free; the failure it
prevents is silent.

**No concept is linked by more than one task in this version.** 169 concepts →
**169 links**, a clean 1:1. `AIGRM-I` ran 165 concepts / 174 links with 9 reuse
links; reuse is legitimate but it should be a decision, not an accident. Stating
1:1 makes the count checkable at scaffold: if `task_concepts` returns anything
other than 169, something went wrong.

**Descriptions are generator input, not labels.** Each says what the concept *is*
in terms an item can be grounded in. Where a concept sits on the ISO 19011 /
ISO/IEC 27001 / ISO/IEC 17021-1 seam, the description **names the source** and,
where the competence is an absence, **says what the document does not contain.**

**A description that would let a generator assert a requirement no standard states
is a defect**, however true the underlying practice.

---

## D1 — The audit function and its boundaries

### Task 1.1

| slug | name | description |
|---|---|---|
| `ia-first-party-audit-purpose` | First-party audit | An audit conducted by or on behalf of the organization on its own management system, to inform the organization about its own conformity and effectiveness. It produces no certificate and serves no external party. |
| `ia-second-party-audit-context` | Second-party audit | An audit conducted by a party with an interest in the organization, such as a customer, or by another party on their behalf — including audits an organization conducts on its own external providers. |
| `ia-third-party-certification-audit` | Third-party audit | An audit conducted by an independent auditing organization, such as a body providing certification of conformity, or by a regulatory authority. Governed by ISO/IEC 17021-1, not by ISO 19011. |
| `ia-who-may-conduct-each-audit-type` | Who may conduct each audit type | The party conducting an audit is determined by its type and purpose. An organization cannot use its certification body's auditors to satisfy its own internal audit obligation. |
| `ia-19011-table-1-audit-types` | ISO 19011 Table 1 | ISO 19011:2026 Table 1 sets out the three audit types and their examples. The standard's Introduction states it concentrates on first- and second-party audits and hands third-party certification requirements to ISO/IEC 17021-1. |
| `ia-annex-a-5-35-independent-review` | Annex A 5.35 independent review | An ISO/IEC 27001 Annex A control requiring the organization's approach to managing information security — people, processes and technologies — to be reviewed independently at planned intervals or on significant change. |
| `ia-clause-9-2-versus-control-5-35` | Clause 9.2 is not control 5.35 | Two distinct obligations that both speak of planned intervals: clause 9.2 requires an internal audit programme; Annex A 5.35 requires an independent review of the approach. Satisfying one does not satisfy the other. |

### Task 1.2

| slug | name | description |
|---|---|---|
| `ia-audit-principles-set` | The seven audit principles | ISO 19011:2026 clause 4 sets out integrity, fair presentation, due professional care, confidentiality, independence, the evidence-based approach and the risk-based approach. Clauses 5 to 7 of the standard are built on all seven. |
| `ia-principles-carry-no-precedence` | The principles carry no precedence | ISO 19011:2026 states no order, ranking or precedence among the seven principles. Clause 4.1 says only that adherence to them is fundamental. Where two engage a situation differently, the auditor weighs them. |
| `ia-principle-interaction-in-practice` | Principles interacting in a situation | A single audit situation can engage several principles at once, and the auditor must first determine which are actually engaged before determining which governs. |
| `ia-independence-vs-due-care-tension` | Independence against due professional care | Where the only person competent to audit an area is close to it, independence and due professional care point in different directions, and the resolution depends on what the audit is trying to establish. |
| `ia-evidence-based-vs-risk-based-tension` | Evidence-based against risk-based | The evidence-based approach seeks sufficient evidence for each conclusion; the risk-based approach concentrates finite audit effort where it matters most. Under time pressure these compete for the same hours. |

### Task 1.3

| slug | name | description |
|---|---|---|
| `ia-objectivity-in-first-party-audit` | Objectivity in a first-party audit | The requirement that findings and conclusions rest only on audit evidence, and not on the auditor's other interests in the audited area. Objectivity is established per assignment. |
| `ia-clause-9-2-2-objectivity-requirement` | ISO/IEC 27001 clause 9.2.2 b) | Requires the organization to select auditors and conduct audits that ensure objectivity and the impartiality of the audit process. This sentence is the whole of what ISO/IEC 27001 states on auditor independence. |
| `ia-independence-of-the-activity-audited-4-6` | Independence of the activity audited | ISO 19011:2026 clause 4.6 states auditors should be independent of the activity being audited wherever practicable, and should in all cases act free from bias and conflict of interest. |
| `ia-internal-auditor-limited-independence-remedy` | Where independence is not possible | ISO 19011:2026 clause 4.6 states that where it is not possible for internal auditors to be independent of the activity being audited, every effort should be made to remove bias and encourage objectivity. **Neither ISO 19011 nor ISO/IEC 27001 contains a rule that an auditor may not audit their own work** — that formulation is practice convention. |
| `ia-small-organization-independence-constraints` | Independence in a small organization | Where few people hold the necessary competence, full independence from every audited activity may be unattainable, which clause 4.6 contemplates rather than prohibits. |
| `ia-compensating-arrangements-for-limited-independence` | Compensating arrangements | Measures that reduce bias where independence is limited — a second reviewer, an auditor drawn from another function, external support, or restricting the auditor to areas outside their responsibility. |

### Task 1.4

| slug | name | description |
|---|---|---|
| `ia-auditor-competence-elements` | Auditor competence elements | ISO 19011:2026 clause 7.2 treats competence as personal behaviour (7.2.2) together with knowledge and skills (7.2.3), evaluated against criteria the organization establishes. |
| `ia-isms-specific-auditor-competence` | ISMS-specific auditor competence | ISO/IEC 27007 offers guidance on the competence of ISMS auditors in addition to ISO 19011, covering the information security knowledge an ISMS audit requires. |
| `ia-ict-and-emerging-technology-competence-7-2-3` | ICT and emerging technology competence | ISO 19011:2026 clause 7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools, and emerging technology, to conduct audits — naming artificial-intelligence-based evaluation tools as its example. |
| `ia-ai-tool-competence-for-auditors` | Competence to use an AI audit tool | Understanding what an AI-based tool does to the evidence it processes, what it leaves unverified, and when its use changes what the audit can conclude. Annex A.16 adds the technical skills to use the technology itself. |
| `ia-team-competence-versus-individual-competence` | Team competence against individual | Competence may be held collectively by the audit team rather than by every member, but a gap left unclosed before the audit becomes a limitation on its conclusions. |

### Task 1.5

| slug | name | description |
|---|---|---|
| `ia-19011-is-guidance-not-requirements` | ISO 19011 states guidance, not requirements | ISO 19011 contains no requirements. Nothing is ever *required by* ISO 19011, and no organization or person can be certified to it. |
| `ia-27001-requirements-as-audit-criteria` | ISO/IEC 27001 as audit criteria | In an internal ISMS audit, ISO/IEC 27001 functions as the criteria against which evidence is compared, alongside the organization's own requirements — not as the methodology. |
| `ia-17021-1-governs-certification-bodies` | ISO/IEC 17021-1 governs certification bodies | ISO/IEC 17021-1 sets requirements for bodies providing third-party certification of management systems, with ISO/IEC 27006 adding the ISMS-specific requirements. ISO 19011's own Introduction says so. |
| `ia-no-certification-to-19011` | No certification to ISO 19011 | Because ISO 19011 states no requirements, there is nothing to certify against. Claims of being "certified to ISO 19011" describe something that does not exist. |
| `ia-terms-defined-outside-27001` | ISO/IEC 27001's terms live elsewhere | Clause 3 delegates all terms and definitions to ISO/IEC 27000 through an undated normative reference. *Nonconformity*, *correction*, *corrective action* and *audit* are not defined inside ISO/IEC 27001. |

---

## D2 — Audit programme management

### Task 2.1

| slug | name | description |
|---|---|---|
| `ia-audit-programme-objectives` | Audit programme objectives | What the programme as a whole is intended to achieve over its cycle, distinct from the objectives of any individual audit within it. ISO 19011:2026 clause 5.2. |
| `ia-isms-objectives-as-programme-input` | ISMS objectives as programme input | The organization's information security objectives under clause 6.2 are a direct input to what the audit programme is for, since the programme exists to inform the organization about whether it is achieving them. |
| `ia-previous-audit-results-as-input` | Previous audit results as input | ISO/IEC 27001 clause 9.2.2 requires the organization, when establishing the internal audit programme, to consider the importance of the processes concerned and the results of previous audits. |
| `ia-interested-party-requirements-as-input` | Interested party requirements as input | Requirements determined under clause 4.2 that the ISMS addresses can shape what the programme must give assurance about, particularly where they are contractual or regulatory. |

### Task 2.2

| slug | name | description |
|---|---|---|
| `ia-risk-based-audit-programme` | The risk-based audit programme | ISO 19011:2026 clause 4.8 states the risk-based approach should substantively influence the planning and implementation of the audit programme, so that audits focus on matters significant to the audit client and to the programme objectives. |
| `ia-programme-risks-and-opportunities-5-3` | Programme risks and opportunities | ISO 19011:2026 clause 5.3 covers determining and evaluating the risks and opportunities that attach to the audit programme itself — as distinct from the risks the audited system manages. |
| `ia-process-importance-as-prioritisation-factor` | Process importance as a factor | The importance of the processes concerned is a named input to programme establishment under ISO/IEC 27001 clause 9.2.2, and drives which areas receive more frequent or deeper audit. |
| `ia-coverage-across-programme-cycle` | Coverage across the cycle | Full coverage of the ISMS scope is achieved across the programme cycle, not within any single audit. A gap in one audit is not a finding if the cycle addresses it. |
| `ia-clause-order-carries-no-priority` | Clause order is not priority order | ISO/IEC 27001's Introduction states that the order in which its requirements are presented does not reflect their importance. Auditing clause by clause in numeric sequence imports a priority the standard disclaims. |

### Task 2.3

| slug | name | description |
|---|---|---|
| `ia-audit-scope-definition-3-6` | Audit scope | ISO 19011:2026 clause 3.6 defines audit scope as the extent and boundaries of an audit, generally including physical and virtual locations, functions, organizational units, activities and processes, and the time period covered. |
| `ia-audit-criteria-3-8` | Audit criteria | ISO 19011:2026 clause 3.8 defines audit criteria as the set of requirements used as a reference against which objective evidence is compared — which may include policies, procedures, legal requirements, contractual obligations and standards. |
| `ia-individual-audit-objectives` | Individual audit objectives | What a single audit is intended to establish, defined per audit under ISO 19011:2026 clause 5.5.2 alongside its scope and criteria. |
| `ia-scope-boundaries-and-exclusions` | Scope boundaries and exclusions | What an audit will and will not examine, stated explicitly. An unstated boundary is read as coverage, and a conclusion then claims more than the audit established. |
| `ia-audit-objectives-are-practice-not-a-27001-requirement` | Objectives are practice, not a 27001 requirement | ISO/IEC 27001 clause 9.2.2 a) requires the organization to define the audit *criteria and scope* for each audit. It does not require audit objectives. ISO/IEC 42001's own 9.2.2 a) adds objectives where ISO/IEC 27001 does not. |

### Task 2.4

| slug | name | description |
|---|---|---|
| `ia-on-site-auditing-method` | On-site auditing method | Audit activities performed at the auditee's location, giving direct access to physical conditions, informal observation and unplanned lines of enquiry. |
| `ia-remote-auditing-method-3-4` | Remote auditing method | ISO 19011:2026 clause 3.4 defines it as a method for conducting audit activities from any place other than the location of the auditee. The definition is sourced from ISO/IEC TS 17012:2024, whose guidance the 2026 edition imports. |
| `ia-virtual-locations` | Virtual locations | Where an organization performs work or provides a service in an online environment, allowing individuals to execute processes irrespective of physical location. Remote auditing methods can be used to audit them. |
| `ia-method-selection-5-5-3` | Selecting auditing methods | ISO 19011:2026 clause 5.5.3 covers selecting and determining auditing methods, which may combine on-site and remote activity within a single audit. |
| `ia-remote-method-risks-annex-a-16` | Risks of remote auditing methods | Annex A.16 states that using remote auditing methods can introduce additional risks and opportunities to the audit process, naming data security, confidentiality and contingency planning for technology failure among the considerations. |

### Task 2.5

| slug | name | description |
|---|---|---|
| `ia-audit-team-selection-5-5-4` | Selecting audit team members | ISO 19011:2026 clause 5.5.4 covers composing the team so that the competence needed for the audit's scope and criteria is present across it. |
| `ia-technical-expert-role` | The technical expert | A person providing specific knowledge or expertise to the audit team who does not act as an auditor, and whose contribution does not by itself constitute audit evidence. |
| `ia-audit-programme-resources-5-4-4` | Audit programme resources | ISO 19011:2026 clause 5.4.4 covers determining programme resources, which include access to adequate and appropriate information and communication technology. |
| `ia-audit-team-leader-assignment-5-5-5` | Assigning the audit team leader | ISO 19011:2026 clause 5.5.5 covers assigning responsibility for an individual audit to a team leader, who carries the conduct of that audit. |

### Task 2.6

| slug | name | description |
|---|---|---|
| `ia-planned-intervals-carries-no-fixed-value` | "Planned intervals" has no fixed value | ISO/IEC 27001 requires internal audits at planned intervals and sets no numeric value. The organization determines a defensible interval from process importance and previous results; "annual" is a choice requiring justification, not a requirement. |
| `ia-clause-9-2-1-requirements` | ISO/IEC 27001 clause 9.2.1 | Requires internal audits at planned intervals to provide information on whether the ISMS conforms to the organization's own requirements and to the requirements of the standard, and is effectively implemented and maintained. |
| `ia-clause-9-2-2-programme-requirements` | ISO/IEC 27001 clause 9.2.2 | Requires the organization to plan, establish, implement and maintain an audit programme including frequency, methods, responsibilities, planning requirements and reporting; to define criteria and scope for each audit; to select auditors and conduct audits ensuring objectivity and impartiality; and to report results to relevant management. |
| `ia-audit-programme-3-5` | Audit programme | ISO 19011:2026 clause 3.5 defines it as arrangements for a set of one or more audits planned for a specific time frame and directed towards a specific purpose. |
| `ia-documented-information-on-the-programme` | Evidence of the programme | ISO/IEC 27001 clause 9.2.2 requires documented information to be available as evidence of the implementation of the audit programme and of the audit results. |

### Task 2.7

| slug | name | description |
|---|---|---|
| `ia-ai-systems-in-isms-scope` | AI systems inside ISMS scope | Where an AI system processes information within the ISMS scope, it falls inside the audit programme regardless of whether the organization has a separate AI management system. |
| `ia-ai-change-velocity-and-audit-frequency` | Change velocity against audit interval | An interval set on the assumption that changes pass through change control does not hold for a system whose behaviour changes on model update or continued training. |
| `ia-ai-supplier-and-model-dependency` | Model providers as suppliers | An externally provided model or API enters the ISMS through the Annex A supplier-relationship controls, making the provider part of what the programme must cover. |
| `ia-shadow-ai-in-programme-planning` | Shadow AI at programme planning | AI tools adopted within scope without going through procurement or change control will not appear in the inputs a programme is planned from, and surface only if the programme looks for them. |

---

## D3 — Conducting the audit: evidence, sampling and testing

### Task 3.1

| slug | name | description |
|---|---|---|
| `ia-audit-evidence-3-10` | Audit evidence | ISO 19011:2026 clause 3.10 defines audit evidence as records, statements of fact or other information which are relevant to the audit criteria and verifiable. |
| `ia-objective-evidence-versus-audit-evidence` | Objective evidence is not audit evidence | Two distinct defined terms. Objective evidence (3.9) is data supporting the existence or verity of something; audit evidence (3.10) is objective evidence that is relevant to the audit criteria and verifiable. The clause 3.1 definition of *audit* uses the former. |
| `ia-degree-of-verification` | Degree of verification | ISO 19011:2026 clause 6.4.7 states that only information subject to some degree of verification should be accepted as audit evidence. Verification is a matter of degree, not a binary test. |
| `ia-professional-judgement-on-reliance` | Judgement about reliance | Where the degree of verification is low, clause 6.4.7 requires the auditor to use professional judgement to determine the degree of reliance that can be placed on the information as evidence. |
| `ia-unverifiable-information-handling` | Information that cannot be verified | Relevant information that cannot be subjected to any verification does not become audit evidence. It may still direct further enquiry, but no finding rests on it alone. |

### Task 3.2

| slug | name | description |
|---|---|---|
| `ia-sampling-and-confidence-in-conclusions` | Sampling and confidence | ISO 19011:2026 clause 4.7 states audit evidence should be based on samples because an audit runs for a specified duration with finite resources, and that appropriate use of sampling is closely related to the confidence that can be placed in the audit conclusions. |
| `ia-sampling-guidance-annex-a-6` | Sampling guidance | ISO 19011:2026 Annex A.6 gives the guidance on audit sampling; clause 6.4.7 requires information to be collected by means of appropriate sampling. |
| `ia-judgement-based-sampling` | Judgement-based sampling | Selection driven by the auditor's knowledge of the process, its risks and where failure is most likely, rather than by a statistical model. Its adequacy rests on the reasoning behind the selection. |
| `ia-statistical-sampling` | Statistical sampling | Selection built on a probability model, allowing a stated confidence to be attached to a conclusion about the population. Requires a definable population and a sample drawn accordingly. |
| `ia-sample-adequacy-for-conclusion` | Sample adequacy for a conclusion | Whether a sample supports the conclusion actually drawn from it. A sample can be well constructed and still not support a broader claim than it was designed to test. |

### Task 3.3

| slug | name | description |
|---|---|---|
| `ia-electronic-evidence-reliability` | Reliability of electronic evidence | Electronically presented information can be filtered, edited or generated between the source system and the auditor's view, so the auditor evaluates what the presentation establishes rather than what it appears to show. |
| `ia-witnessed-access-and-screen-share` | Witnessed access | Observing an auditee navigate a live system while the auditor directs the path establishes more than receiving an exported artefact, because the auditor controls what is retrieved. |
| `ia-evidence-provenance-in-remote-audit` | Provenance under remote methods | Where evidence arrives as a file or screen image, its origin, generation date and completeness are not directly observable, and the auditor establishes them separately or discounts the reliance placed on it. |
| `ia-remote-method-additional-risks` | Additional risks of remote methods | Annex A.16 names data security and management, confidentiality, and the need for contingency plans due to technology failure among the considerations remote auditing methods introduce. |

### Task 3.4

| slug | name | description |
|---|---|---|
| `ia-interviews-as-collection-method` | Interviews | Named in ISO 19011:2026 clause 6.4.7 as a method of collecting information. Establishes what people understand and believe they do, which is not the same as what the process does. |
| `ia-observation-as-collection-method` | Observation | Named in clause 6.4.7. Establishes what happens at the moment observed, which may or may not represent the normal operation of the process. |
| `ia-review-of-documented-information` | Review of documented information | Named in clause 6.4.7. Establishes what the organization has decided and recorded, which is distinct from evidence that the recorded arrangement operates. |
| `ia-re-performance-as-evidence-source` | Re-performance | Independently repeating a control step or calculation to establish whether it produces the result claimed. The strongest evidence of operating effectiveness and the most costly to obtain. |

### Task 3.5

| slug | name | description |
|---|---|---|
| `ia-interview-guidance-annex-a-17` | Interview guidance | ISO 19011:2026 Annex A.17 gives the guidance on conducting interviews, including selecting interviewees and framing the exchange so answers carry evidential value. |
| `ia-open-versus-closed-questions` | Open against closed questions | A closed question offers the answer it is looking for and produces confirmation; an open question requires the interviewee to describe what actually happens and produces evidence. |
| `ia-corroboration-across-interviewees` | Corroboration | Agreement between people who share the same training or assumptions is not independent confirmation. Corroboration requires a second source that could have disagreed. |

### Task 3.6

| slug | name | description |
|---|---|---|
| `ia-statement-of-applicability-claim` | The SoA as a claim | ISO/IEC 27001 clause 6.1.3 d) requires the Statement of Applicability to record whether each necessary control is implemented or not. That entry is the organization's claim, and it is what the auditor tests. |
| `ia-control-design-versus-operating-effectiveness` | Design against operating effectiveness | A control can be well designed and documented yet not operate, or operate for part of the period. Evidence that a control exists is not evidence that it ran. |
| `ia-annex-a-control-testing` | Testing an Annex A control | Selecting evidence that would show whether the control operated as claimed across the period under audit, rather than at the moment of the audit. |
| `ia-control-implementation-evidence` | Implementation evidence | The records a control produces as a by-product of operating — logs, approvals, review records — which are usually stronger evidence of operation than the procedure describing it. |

### Task 3.7

| slug | name | description |
|---|---|---|
| `ia-annex-a-8-34-audit-testing-agreement` | Annex A 8.34 | An ISO/IEC 27001 Annex A control requiring audit tests and other assurance activities involving assessment of operational systems to be planned and agreed between the tester and appropriate management. |
| `ia-isms-audit-boundary` | The boundary of an ISMS audit | A management system audit establishes whether arrangements are defined, operating and effective. Establishing whether a technical control resists a specific attack is a different activity requiring different competence. |
| `ia-technical-expert-engagement-trigger` | When to bring a technical expert | Where a conclusion would require technical knowledge the audit team does not hold, the choice is to engage an expert, narrow the conclusion, or record the limitation — not to proceed on assumption. |
| `ia-audit-feasibility-6-2-3` | Feasibility of the audit | ISO 19011:2026 clause 6.2.3 covers determining whether an audit is feasible, including whether the necessary access, cooperation, information and resources are available. |

### Task 3.8

| slug | name | description |
|---|---|---|
| `ia-ai-evaluation-tools-in-auditor-competence-7-2-3` | AI evaluation tools in auditor competence | ISO 19011:2026 clause 7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools, and emerging technology, to conduct audits — giving artificial-intelligence-based evaluation tools as its example. |
| `ia-ai-summary-is-not-verified-information` | An AI summary is not verified information | A summary produced by a tool from a document the auditor did not open carries a low degree of verification under clause 6.4.7, so professional judgement must set the reliance placed on it rather than the summary being accepted as evidence. |
| `ia-ai-tool-output-provenance` | Provenance of tool output | Establishing what source material a tool actually processed, what it excluded, and whether its output can be traced back to a record a second auditor could examine. |
| `ia-auditor-accountability-for-ai-assisted-conclusions` | Accountability remains with the auditor | Using a tool does not transfer responsibility for the conclusion. The auditor remains accountable for the sufficiency of the evidence supporting every finding. |
| `ia-ai-selection-bias-in-evidence-sampling` | Tool-driven selection is a sampling decision | Where a tool decides which records the auditor examines, it has made a sampling decision — which clause 4.7 ties directly to the confidence that can be placed in the audit conclusions. |

### Task 3.9

| slug | name | description |
|---|---|---|
| `ia-evidence-to-finding-traceability` | Traceability from evidence to finding | Every finding can be followed back to the specific evidence supporting it, so that a second auditor could reach the same conclusion from the same record. |
| `ia-audit-records-5-5-7` | Audit-related records | ISO 19011:2026 clause 5.5.7 covers managing audit-related records. Clause 6.4.7 requires audit evidence leading to audit findings to be recorded. |
| `ia-evidence-retention-and-confidentiality` | Retention and confidentiality | Audit records carry information the confidentiality principle protects, and their retention period and handling are determined rather than left to the auditor. |

---

## D4 — Auditing the ISMS against ISO/IEC 27001 as criteria

### Task 4.1

| slug | name | description |
|---|---|---|
| `ia-isms-scope-clause-4-3` | ISMS scope under clause 4.3 | Requires the organization to determine the boundaries and applicability of the ISMS, considering the 4.1 issues, the 4.2 requirements, and interfaces and dependencies with other organizations. The scope shall be available as documented information. |
| `ia-interfaces-and-dependencies` | Interfaces and dependencies | Activities performed by other organizations on which the ISMS depends. Clause 4.3 c) names them explicitly, and an undeclared interface is the most common way a scope fails. |
| `ia-clauses-4-to-10-not-excludable` | Clauses 4 to 10 cannot be excluded | Stated in **Clause 1 Scope**, not clause 4: excluding any of the requirements specified in Clauses 4 to 10 is not acceptable when an organization claims conformity. Activities, locations and assets can fall outside a scope boundary; requirements cannot. |
| `ia-internal-and-external-issues-clause-4-1` | Internal and external issues | Clause 4.1 requires the organization to determine external and internal issues relevant to its purpose that affect its ability to achieve the intended outcomes of its ISMS. |

### Task 4.2

| slug | name | description |
|---|---|---|
| `ia-leadership-commitment-clause-5-1` | Leadership and commitment | Clause 5.1 lists eight things top management shall **demonstrate**, including ensuring the policy and objectives are established and compatible with strategic direction, ensuring resources, and promoting continual improvement. |
| `ia-information-security-policy-clause-5-2` | The information security policy | Clause 5.2 requires the policy to be appropriate to the organization's purpose, to include objectives or provide the framework for setting them, and to include commitments to satisfy applicable requirements and to continual improvement. |
| `ia-policy-availability-and-communication` | Policy availability and communication | Clause 5.2 separately requires the policy to be available as documented information, communicated within the organization, and available to interested parties as appropriate. |
| `ia-roles-responsibilities-authorities-clause-5-3` | Roles, responsibilities and authorities | Clause 5.3 requires top management to ensure responsibilities and authorities for relevant roles are assigned **and communicated**, and to assign authority for ISMS conformity and for reporting performance to top management. |
| `ia-evidence-of-commitment-versus-statement-of-commitment` | Demonstrated against documented commitment | Clause 5.1 uses the verb *demonstrate*. A signed policy is a statement; evidence of commitment is found in resourcing decisions, attendance at management review, and action taken on prior findings. |

### Task 4.3

| slug | name | description |
|---|---|---|
| `ia-risk-assessment-process-clause-6-1-2` | The risk assessment process | Clause 6.1.2 requires a defined and applied process that establishes risk criteria, produces consistent, valid and comparable results, identifies risks and risk owners, analyses consequences and likelihood, and evaluates against the criteria. |
| `ia-risk-acceptance-criteria` | Risk acceptance criteria | Clause 6.1.2 a) 1) requires the organization to establish and maintain risk acceptance criteria, alongside criteria for performing risk assessments. |
| `ia-risk-treatment-process-clause-6-1-3` | The risk treatment process | Clause 6.1.3 requires selecting treatment options, determining all necessary controls, comparing them with Annex A, producing the Statement of Applicability, formulating a treatment plan, and obtaining risk owners' approval. |
| `ia-annex-a-as-completeness-check` | Annex A as a completeness check | NOTE 2 to clause 6.1.3 directs users to Annex A to ensure that no necessary controls are overlooked; NOTE 3 states the listed controls are not exhaustive. Annex A verifies nothing was missed; it is not a catalogue to select from. |
| `ia-no-risk-register-requirement` | No risk register is required | ISO/IEC 27001 does not require a risk register. Clauses 6.1.2 and 6.1.3 require documented information about the *processes*; clauses 8.2 and 8.3 require documented information *of the results*. A register is one way to satisfy this, not the requirement. |
| `ia-information-security-objectives-clause-6-2` | Information security objectives | Clause 6.2 requires objectives at relevant functions and levels, meeting seven stated requirements, and requires the organization to determine five things about how each will be achieved. |
| `ia-planning-of-changes-clause-6-3` | Planning of changes | Clause 6.3 requires that where the organization determines the need for changes to the ISMS, the changes shall be carried out in a planned manner. **It does not appear on the standard's own contents page**, which is how it is routinely missed. |

### Task 4.4

| slug | name | description |
|---|---|---|
| `ia-soa-four-required-elements` | The four SoA elements | Clause 6.1.3 d) requires the Statement of Applicability to contain the necessary controls, justification for their inclusion, whether each is implemented or not, and justification for excluding any of the Annex A controls. |
| `ia-soa-inclusion-and-exclusion-justification` | Justification for inclusion and exclusion | Every control included and every Annex A control excluded carries a stated reason traceable to the risk assessment and treatment decisions, not to convenience or precedent. |
| `ia-soa-versus-risk-treatment-plan-consistency` | SoA against the treatment plan | The Statement of Applicability and the risk treatment plan describe the same decisions from different angles, and a divergence between them is a finding regardless of which one is right. |
| `ia-risk-owner-approval-of-treatment-plan` | Risk owners' approval | Clause 6.1.3 f) requires the organization to obtain risk owners' approval of the risk treatment plan and their acceptance of the residual information security risks. |

### Task 4.5

| slug | name | description |
|---|---|---|
| `ia-competence-clause-7-2` | Competence under clause 7.2 | Requires determining necessary competence, ensuring persons are competent on the basis of education, training or experience, taking action where applicable and evaluating its effectiveness, and **retaining documented information as evidence of competence**. |
| `ia-awareness-clause-7-3` | Awareness under clause 7.3 | Requires persons doing work under the organization's control to be aware of the policy, their contribution to the effectiveness of the ISMS, and the implications of not conforming. |
| `ia-documented-information-clause-7-5` | Documented information | Clause 7.5 covers what the ISMS must include (7.5.1), creating and updating (7.5.2), and control (7.5.3), including documented information of external origin the organization determines is necessary. |
| `ia-control-of-documented-information` | Control of documented information | Clause 7.5.3 requires documented information to be available and suitable for use and adequately protected, addressing distribution, storage, control of changes, and retention and disposition. |

### Task 4.6

| slug | name | description |
|---|---|---|
| `ia-operational-planning-and-control-clause-8-1` | Operational planning and control | Clause 8.1 requires the organization to plan, implement and control the processes needed to meet requirements and implement the clause 6 actions, by establishing criteria and controlling the processes in accordance with them, with documented information available to have confidence the processes ran as planned. |
| `ia-risk-assessment-and-treatment-in-operation-clause-8-2-8-3` | Risk assessment and treatment in operation | Clause 8.2 requires assessments at planned intervals or when significant changes are proposed or occur; clause 8.3 requires the treatment plan to be implemented. Both require documented information of the results. |
| `ia-monitoring-and-measurement-clause-9-1` | Monitoring and measurement | Clause 9.1 requires the organization to determine six things: what needs monitoring and measuring including processes and controls, the methods, when performed, **who shall monitor and measure**, when results are analysed and evaluated, and **who shall analyse and evaluate**. |
| `ia-who-monitors-and-who-evaluates` | The named "who" | ISO/IEC 27001 clause 9.1 names responsibility for monitoring and for evaluation as things the organization must determine. An arrangement where no one is named does not satisfy the clause even if measurement occurs. |
| `ia-clause-6-defines-clause-8-performs` | Clause 6 defines, clause 8 performs | The structural relationship an auditor uses to locate evidence: clause 6 requires the process to be defined; clause 8 requires it to be operated, with the results retained. |

### Task 4.7 ⛔

| slug | name | description |
|---|---|---|
| `ia-amendment-1-2024-climate-change` | Amendment 1:2024 | ISO/IEC 27001:2022/Amd 1:2024, Climate action changes, adds one sentence to clause 4.1: the organization shall determine whether climate change is a relevant issue. The amendment is one page and adds nothing else to clause 4.1. It names climate change specifically, not environmental conditions. |
| `ia-climate-change-as-a-4-1-issue` | Climate change as a 4.1 issue | The determination is required of every organization; the answer may be that it is not relevant, but the determination itself must have been made and be evidenced. |
| `ia-interested-party-climate-requirements-4-2` | Interested party climate requirements | Amendment 1:2024 adds NOTE 2 at the end of clause 4.2: relevant interested parties can have requirements related to climate change. It is a second note - the existing note on legal, regulatory and contractual requirements becomes NOTE 1. A note is not a requirement. |

### Task 4.8

| slug | name | description |
|---|---|---|
| `ia-ai-derived-information-assets` | AI-derived information assets | Outputs, embeddings, fine-tuning datasets and evaluation results produced by an AI system, which carry information security value and are frequently absent from asset inventories. |
| `ia-model-weights-and-training-data-as-assets` | Model weights and training data | Both are information assets within the ISMS scope where the organization holds them, with confidentiality, integrity and availability properties of their own. |
| `ia-prompt-and-inference-logs` | Prompt and inference logs | Records of what was submitted to and returned by an AI system. They can contain information at any classification and are often retained by default without an owner. |
| `ia-shadow-ai-discovery` | Shadow AI discovery | Identifying AI tools in use within scope that did not pass through procurement, change control or the asset inventory, and which therefore appear in no ISMS record. Annex A 5.9 requires an inventory of information and other associated assets including owners. |

### Task 4.9

| slug | name | description |
|---|---|---|
| `ia-non-deterministic-process-control-challenge` | Controls over a non-deterministic process | A control validated against a process producing consistent output may not hold when the same process produces varying output, because the evidence of effectiveness was drawn from a behaviour that no longer applies. |
| `ia-control-effectiveness-drift` | Control effectiveness drift | The gradual divergence between what a control was tested against and what the protected process now does, without any change event to trigger re-assessment. |
| `ia-human-review-of-ai-output-as-control` | Human review as a control | Where review of AI output is claimed as the control, its effectiveness depends on whether the reviewer has the information, time and authority to reject — which is what the auditor tests, not whether the review step exists. |

### Task 4.10

| slug | name | description |
|---|---|---|
| `ia-27001-42001-scope-overlap` | Where the two scopes overlap | An AI system inside the ISMS scope is subject to ISO/IEC 27001 for its information security properties and to ISO/IEC 42001 for the organization's AI management system, where one exists. The two do not substitute for each other. |
| `ia-combined-audit-3-2` | Combined audit | ISO 19011:2026 clause 3.2 defines a combined audit as one carried out together at a single auditee on two or more management systems. |
| `ia-isms-competence-does-not-satisfy-aims-competence` | ISMS competence is not AIMS competence | Competence records maintained for the ISMS do not evidence the competence an AI management system requires, because the necessary competence is determined against a different set of objectives. |
| `ia-42001-annex-d-integration-guidance` | ISO/IEC 42001 Annex D.2 | An **informative** annex discussing use of the AI management system across domains and its integration with other management system standards, including ISO/IEC 27001. Annexes A and B of ISO/IEC 42001 are normative; C and D are not. |
| `ia-management-review-input-divergence` | Management review inputs diverge | ISO/IEC 27001 clause 9.3.2 additionally requires fulfilment of information security objectives, feedback from interested parties, and risk assessment results and treatment plan status. **ISO/IEC 42001 requires none of these three.** Carrying the 27001 list into a 42001 audit raises findings that are not requirements. |
| `ia-audit-requirement-divergence-27001-42001` | Audit requirements diverge | ISO/IEC 27001 9.2.2 a) requires audit *criteria and scope*; ISO/IEC 42001 requires *objectives, criteria and scope*. ISO/IEC 27001 reports results to *relevant management*; ISO/IEC 42001 to *relevant managers*. |

---

## D5 — Findings, reporting, follow-up and management review

### Task 5.1

| slug | name | description |
|---|---|---|
| `ia-finding-classification-scheme` | The classification scheme | The categories an audit programme uses to grade findings. ISO/IEC 27001 defines none, so the scheme is the organization's own declared choice and the auditor applies the scheme in force. |
| `ia-audit-finding-3-11` | Audit finding | ISO 19011:2026 clause 3.11 defines an audit finding as the result of evaluating collected audit evidence against the audit criteria. |
| `ia-compliance-versus-conformity-language` | Compliance against conformity | ISO 19011:2026 clause 3.8 Note 1 records that where the audit criteria are legal, statutory or regulatory requirements, the words *compliance* and *non-compliance* are often used in a finding rather than conformity language. |
| `ia-opportunity-for-improvement` | Opportunity for improvement | A commonly used finding category that appears nowhere in ISO/IEC 27001. Where a programme uses it, its meaning and consequences are defined by the organization, not by the standard. |
| `ia-classification-scheme-is-an-organizational-choice` | Severity is not in the standard | ISO/IEC 27001 uses only the term *nonconformity* and defines no severity scheme. A major/minor distinction comes from third-party certification practice under ISO/IEC 17021-1. The term *nonconformity* itself is defined in ISO/IEC 27000. |

### Task 5.2

| slug | name | description |
|---|---|---|
| `ia-nonconformity-determination` | Determining a nonconformity | Establishing that a specific requirement exists, that evidence relates to it, and that the evidence shows the requirement is not fulfilled. All three are needed before a finding is a nonconformity. |
| `ia-generating-audit-findings-6-4-8` | Generating audit findings | ISO 19011:2026 clause 6.4.8 covers evaluating audit evidence against the audit criteria to determine findings, including recording conformity as well as nonconformity. |
| `ia-isolated-versus-systemic-failure` | Isolated against systemic | Whether a set of findings indicates individual lapses or a failure of the arrangement itself. ISO/IEC 27001 clause 10.2 b) 3) requires the organization to determine whether similar nonconformities exist or could potentially occur. |
| `ia-absence-of-evidence-versus-evidence-of-absence` | Absent evidence is not a nonconformity by itself | Before treating missing evidence as a failure, the auditor establishes that the requirement calls for evidence to exist and that it would have been retrievable. Otherwise the finding is about the search, not the system. |

### Task 5.3

| slug | name | description |
|---|---|---|
| `ia-nonconformity-statement-structure` | Structure of a nonconformity statement | A statement naming the requirement, the evidence observed, and the gap between them — written so the recipient can act on it without the auditor present. |
| `ia-requirement-to-evidence-link` | The requirement–evidence link | The specific clause, control or organizational requirement the evidence fails, stated explicitly. A statement without it describes a problem rather than a nonconformity. |
| `ia-statement-objectivity` | Objectivity in the statement | ISO 19011:2026's fair presentation principle requires findings, conclusions and reports to reflect the auditing activities truthfully and accurately. The statement records what was found; it does not prescribe the remedy or characterise the auditee. |

### Task 5.4

| slug | name | description |
|---|---|---|
| `ia-audit-report-content-6-5-1` | Audit report content | ISO 19011:2026 clause 6.5.1 covers preparing the audit report, which provides a complete, accurate, concise and clear record of the audit including its scope, criteria, findings and conclusions. |
| `ia-ai-assisted-method-disclosure` | Disclosing AI-assisted method | Where an AI tool determined which evidence was examined or how it was interpreted, the method shaped the audit and belongs in the report, because a reader cannot otherwise assess the conclusions. |
| `ia-reader-judgement-of-evidence-reliability` | Enabling the reader's judgement | The test for disclosure is whether a reader could reach a different view of the conclusions if they knew how the evidence was selected and processed. |
| `ia-disclosure-proportionality` | Proportionality of disclosure | Disclosure applies to methods that shaped the evidence, not to every tool the auditor touched. An inventory of software is not the requirement. |

### Task 5.5

| slug | name | description |
|---|---|---|
| `ia-correction-versus-corrective-action` | Correction against corrective action | ISO/IEC 27001 clause 10.2 a) requires action to control and correct the nonconformity and deal with the consequences; clause 10.2 b) requires evaluating the need for action to eliminate the causes. Neither term is defined inside ISO/IEC 27001. |
| `ia-root-cause-analysis-adequacy` | Adequacy of root cause analysis | Clause 10.2 b) requires reviewing the nonconformity, determining its causes, and determining whether similar nonconformities exist or could occur. An analysis stopping at the individual who erred has not reached a cause. |
| `ia-clause-10-2-requirements` | Clause 10.2 in full | Requires reaction, evaluation of the need to eliminate causes, implementation, review of the effectiveness of any corrective action taken, and changes to the ISMS if necessary, with corrective actions appropriate to the effects of the nonconformities encountered. |
| `ia-recurrence-prevention` | Preventing recurrence | The test of a corrective action is whether the same nonconformity could arise again through the same route. Closing the instance without changing the arrangement is a correction, not a corrective action. |

### Task 5.6

| slug | name | description |
|---|---|---|
| `ia-corrective-action-verification` | Verifying corrective action | ISO/IEC 27001 clause 10.2 d) requires the **effectiveness** of any corrective action taken to be reviewed — which requires evidence of the changed arrangement operating, not evidence that it was made. |
| `ia-audit-follow-up-6-7` | Audit follow-up | ISO 19011:2026 clause 6.7 covers conducting the audit follow-up, including verifying completion and effectiveness of actions taken in response to findings. |
| `ia-finding-closure-criteria` | Closure criteria | What must be true before a finding is closed: the action is implemented, its effectiveness is evidenced, and the evidence covers enough time or volume to show the arrangement operating. |

### Task 5.7

| slug | name | description |
|---|---|---|
| `ia-audit-results-as-management-review-input` | Audit results as a review input | ISO/IEC 27001 clause 9.3.2 d) 3) places audit results among management review inputs, nested under feedback on information security performance. |
| `ia-management-review-inputs-clause-9-3-2` | Management review inputs | Clause 9.3.2 lists the inputs the review shall consider, including prior actions, changes in issues and interested party needs, performance feedback, feedback from interested parties, risk assessment results and treatment plan status, and improvement opportunities. |
| `ia-reporting-results-to-relevant-management` | Reporting to relevant management | ISO/IEC 27001 clause 9.2.2 c) requires the organization to ensure that the results of the audits are reported to relevant management. |
| `ia-fulfilment-of-objectives-as-input` | Fulfilment of objectives as an input | Clause 9.3.2 d) 4) requires fulfilment of information security objectives among the performance trends the review considers — a requirement ISO/IEC 42001 does not carry. |

---

## COUNTS

| Domain | Tasks | Concepts |
|---|---|---|
| D1 | 5 | 28 |
| D2 | 7 | 32 |
| D3 | 9 | 37 |
| D4 | 10 | 45 |
| D5 | 7 | 27 |
| **Total** | **38** | **169** |

**4.45 concepts per task** — `ISMS-F` 3.9, `AIMS-F` 4.4, `AIGRM-I` 3.4.
**`task_concepts` link count must equal 169.** Anything else is a scaffold defect.

## BEFORE SCAFFOLD

1. **CLOSED 2026-08-10.** The two task 4.7 concepts that carried *pending
   verification* are resolved against ISO/IEC 27001:2022/Amd 1:2024, read
   directly. The live rows were updated in the same pass; these entries and the
   database now agree.
2. **`concepts.slug` uniqueness** — one query; the `ia-` prefix stands either way.
3. **Introspect `concepts` before writing SQL.** No SQL against a table not
   introspected in the session.

*End of ISMS-IA Concept Register v2.0.*
