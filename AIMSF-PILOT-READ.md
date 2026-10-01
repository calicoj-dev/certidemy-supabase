# AIMS-F: the rows carrying `read`, for a verdict

**Ruled PROMPT-100 s1b.** No blanket upgrade: *"a verdict I didn't give must not be recorded as mine."*
Nothing on these rows has changed. Each needs **accept** or **reject**, by id.

## How to read this

- **35 items**: the rows whose `item_grounding.review_verdict` is `read`, plus the one
  carrying no verdict at all. The second is marked NO VERDICT and is a survivor of
  `PILOT-AIMSF-TASK-1-3-R2.json`, an artifact no prompt ever ruled on.
- **The gates were re-run today**, against the library as it is now -- after 38 Annex A passages were
  de-columned, twelve anchors re-cut, and A.5.4 repaired from character coordinates. A gate result from the
  run that wrote these items is a fact about a document that has since changed.
- A gate prints PASS, FAIL with its reason, or **UNASSERTED**. Never a blank: a gate that could not run is
  not a gate that passed.
- The key is marked **(KEY)**. `read` counts toward no floor until these are ruled, which is why the
  completion report stands at 11 of 35 rather than 28.

## Summary

| | |
|---|---|
| items awaiting a verdict | **35** |
| clean on all five gates | 34 |
| at least one FAIL today | **1** -- 9ecce8e5 |
| at least one UNASSERTED | 0 |

| gate | pass | fail | unasserted |
|---|---|---|---|
| `quote-noise` | 35 | 0 | 0 |
| `verbatim` | 34 | **1** | 0 |
| `anchor-is-primary` | 35 | 0 | 0 |
| `clause-number-recall` | 35 | 0 | 0 |
| `letter-reference` | 35 | 0 | 0 |

---

## `017478b5`  task 1.1

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **3.4**  (management system set of)
- **task**: Explain what an AI management system is and what a management system standard does
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A certification candidate is asked what the elements of an organization's management system are, using the defined term in the vocabulary clause. Which set of elements fits that definition?

- **(KEY)** Its structure, the assigned roles and responsibilities, planning and operation
- Identification, analysis, evaluation and treatment of potential consequences
- Design and architecture specifications, data descriptions and validation records
- Error rates, processing durations and other agreed performance metrics

**Explanation.** The vocabulary entry for management system (clause 3.4) describes interrelated elements used to set policies, objectives and processes, and its second note states: "The management system elements include the organization’s structure, roles and responsibilities, planning and operation." The other sets are artefacts or activities of particular technical or assessment controls, not the constituent elements of a management system.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `9cbef19e`  task 1.2

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **4.1**  (Understanding the organization and its context)
- **task**: Determine the organization's roles with respect to its AI systems
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A firm licenses a machine learning platform from a vendor, integrates it into a diagnostic service it sells to clinics, supplies the training data itself, and also runs the same service on its own staff records. Working through clause 4.1, what should the firm conclude about its position relative to this AI system?

- Its integration and data-supply activities place it among AI customers, a category separate from AI partners.
- Obligations attached to the categories of data it processes sit outside the matters that can inform its role.
- Deciding its role relative to its AI systems is recommended practice for context setting rather than a stated obligation.
- **(KEY)** It can hold several of the listed roles, and its roles can bear on which requirements and controls apply.

**Explanation.** Clause 4.1 lists role categories that an organization may occupy 'one or more of', and states that "The organization’s roles can determine the applicability and extent of applicability of the requirements and controls in this document." So multiple simultaneous roles are possible and they influence applicability.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `7256f658`  task 1.4

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **D.2**  (Integration of AI management system with other management system)
- **task**: Explain the harmonised structure and how ISO/IEC 42001 sits alongside ISO/IEC 27001 and ISO 9001
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** An organization holds an ISO/IEC 27001 certificate and is now planning an AI management system. Its project lead asks why Annex D suggests the two can be run together with relatively little friction. Which explanation reflects Annex D?

- ISO/IEC 27001 is cited among the normative references, so its clauses already form part of this document.
- The AI management system treats security from a technology-neutral angle, so ISO/IEC 27001 adds little.
- The information security controls of the AI management system fall away once ISO/IEC 27001 is certified.
- **(KEY)** The two standards share the same high-level clause framework, which eases their combined use.

**Explanation.** Annex D.2 attributes the ease of joint use to the shared high-level structure: "Given that both ISO/IEC 27001 and the AI management systems use the high-level structure, their integrated use is facilitated and of great benefit for the organization." (D.2)

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `4acadf6b`  task 2.1

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **4.1**  (Understanding the organization and its context)
- **task**: Determine the organization's context and interested parties for an AIMS
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A medical-imaging firm builds a triage model and also resells a third party's model under its own brand. Preparing the AIMS, the team copies its existing ISO/IEC 27001 context register, which lists market pressures, legal duties and threat trends. Applying Clause 4.1, what does the firm still have to add to satisfy the requirement?

- A record of what system information the firm is obliged to report to parties outside it
- An appraisal of machine-learning security concerns that go past conventional system security
- **(KEY)** A determination of the positions the firm occupies in relation to each AI system it supplies or uses
- A documented list of necessary controls with reasons for including or leaving out each one

**Explanation.** Clause 4.1 states: "The organization shall determine its roles with respect to these AI systems." Role determination (provider, producer, customer, partner, and so on) is a Clause 4.1 obligation that an information-security context analysis does not produce.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `ce86479f`  task 2.2

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **4.3**  (Determining the scope of the AI management system)
- **task**: Determine the scope of the AI management system
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A retailer runs three AI-enabled capabilities: a model its data team built, a customer-service suite whose vendor has switched on a generative assistant, and a purchased rostering package with an embedded scoring engine. The AI governance lead is preparing the boundary statement for the AI management system. Which step best fits the requirement for setting that boundary?

- Fix the boundary only after designated management has approved the risk treatment plan and accepted the residual risks arising from the purchased capabilities.
- Fix the boundary around the in-house model and record the reasoning for leaving the two purchased capabilities out in the statement of applicability.
- **(KEY)** Fix the boundary and its applicability using the internal and external issues and the relevant party requirements already identified, and hold the result as documented information.
- Fix the boundary around the model built in-house, treating the vendor assistant and the embedded scoring engine as the suppliers' management responsibility.

**Explanation.** Clause 4.3 has the organization settle the boundaries and applicability of the system by weighing the context issues identified under 4.1 together with the interested-party requirements identified under 4.2, and keeping the resulting scope as documented information. Capability bought in, or switched on by a vendor, is still AI the organization uses, so it cannot be pushed outside the boundary as a supplier matter.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `3359b050`  task 2.4

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **5.3**  (Roles, responsibilities and authorities)
- **task**: Assign roles, responsibilities and authorities for AI
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A provider organization has named owners for risk management, security, privacy, data quality and impact assessment work, and has told staff who each owner is. Reviewing this against the leadership requirements of the AI management system standard, which gap should be flagged?

- An owner for keeping records of each completed impact assessment is the one outstanding leadership allocation.
- The set of assignments is complete once every area listed in the Annex B guidance has a named owner.
- The governing body, rather than top management, carries the duty to allocate and make known these roles.
- **(KEY)** An owner is still needed for confirming the system meets the document and for briefing leadership on how it performs.

**Explanation.** Clause 5.3 goes beyond assigning and communicating roles in general: top management has to place with someone the responsibility and authority for confirming that the management system meets the document's requirements, and for "reporting on the performance of the AI management system to top management" (5.3). Neither of those two outcomes is owned in the scenario described.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `4467ac24`  task 2.5

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **6.1.2**  (AI risk assessment)
- **task**: Apply the AI risk assessment process
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A lender is adapting its existing IT risk method to cover a new credit-scoring model. Today, each identified risk is scored only for its effect on service availability and on the confidentiality of customer records, and the scored risks are then ranked. A reviewer notes that the analysis step does not yet meet the AIMS requirement. What should be added to the analysis step?

- Measuring each scored risk against the criteria the organisation has established and maintained
- **(KEY)** Appraisal of what materialisation would mean for the organisation, for individuals and for society
- Checking each proposed safeguard against the reference controls listed in Annex A of the standard
- Securing approval from the designated management for the residual exposure that will be carried

**Explanation.** Clause 6.1.2 d) 1) requires the analysis to "assess the potential consequences to the organization, individuals and societies that would result if the identified risks were to materialize". A purely IT-oriented analysis that looks only at availability and confidentiality of the organisation's own data misses the consequences to individuals and to societies that the AIMS analysis step must cover.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `e641c343`  task 2.6

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **8.4**  (AI system impact assessment)
- **task**: Apply the AI system impact assessment
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A provider launched a hiring recommendation tool two years ago and completed an impact assessment at that time. The tool is now being extended to a new country and to a much larger applicant pool, and a separate privacy impact assessment has been prepared for that country. Under the AI management system requirements, how should the team handle the AI system impact assessment?

- Treat the privacy impact assessment prepared for the new country as covering the extended tool.
- Repeat the assessment after applicants report that the extended tool has disadvantaged them.
- **(KEY)** Repeat the assessment for the proposed change and retain documented information on the outcome.
- Repeat the assessment once a regulatory authority asks to see the results of the earlier one.

**Explanation.** Clause 8.4 ties performance of the assessment to planned intervals and to proposed significant changes, and requires records of the results: "The organization shall perform AI system impact assessments according to 6.1.4 at planned intervals or when significant changes are proposed to occur." Extending the tool to a new jurisdiction and population is such a proposed change, so the assessment is redone in advance and its results are kept as documented information.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `d124df3c`  task 2.7

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **6.1.4**  (AI system impact assessment)
- **task**: Differentiate the AI risk assessment from the AI system impact assessment and determine what a situation requires
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A provider has completed and documented an assessment of the consequences that a new hiring tool's rollout, planned use and predictable misuse could have on applicants and on wider society in the jurisdictions where it will run. The AI objectives and risk criteria were fixed earlier. Under ISO/IEC 42001, what is required next for this system?

- Take the outcome of the risk analysis into account while the consequence assessment is being prepared and documented.
- **(KEY)** Carry the documented consequences into the risk analysis, then determine and rank the resulting risk levels for treatment.
- Accept the documented consequences as satisfying the risk analysis obligation for this particular system.
- Divide the two exercises so that risk work covers harm to the organization and the other covers harm to people.

**Explanation.** Clause 6.1.4 makes the impact assessment an input to risk work: “The organization shall consider the results of the AI system impact assessment in the risk assessment (see 6.1.2).” The risk assessment itself still has to run under 6.1.2, analysing consequences and likelihood, determining levels of risk and prioritizing them against the risk criteria for treatment.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `1f2f7dc7`  task 2.8

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **6.1.3**  (AI risk treatment)
- **task**: Apply AI risk treatment and produce the Statement of Applicability
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** An AI governance team has chosen its treatment options, worked out the controls needed, checked them against the Annex A reference list, and drafted both the statement of applicability and the treatment plan. Before the planning stage can be regarded as complete, which action is still outstanding?

- Keep documented results of the finished treatment activities on file before the plan is put into effect.
- Record in the statement of applicability a reason for each item of Annex B guidance left out of scope.
- **(KEY)** Obtain sign-off from the management designated for it, covering the plan and the acceptance of leftover risk.
- Obtain sign-off from the governing body for the risk criteria before the draft plan is circulated further.

**Explanation.** Clause 6.1.3 closes the treatment process with an approval step: "The organization shall obtain approval from the designated management for the AI risk treatment plan and for acceptance of the residual AI risks." The other options misplace the actor, the object of documentation, or the sequence.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `3ca45f4c`  task 3.1

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **7.2**  (Competence)
- **task**: Determine resources and competence needs for an AIMS
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A deployer's AI team is made up of four data scientists and two software engineers. The organization has decided that human oversight of the deployed model and knowledge of the regulated clinical field it serves both affect AI performance, and no team member has either. Which response satisfies the AI management system's competence requirement?

- List and record the resources that each life cycle stage of the system requires.
- **(KEY)** Arrange training, mentoring or hiring for the missing expertise, then judge whether it worked.
- Make sure the whole team knows the AI policy and the effects of nonconformity.
- Decide what will be communicated about the shortfall, when, to whom and how.

**Explanation.** Clause 7.2 obliges the organization to act on an identified competence shortfall and then check the result: "where applicable, take actions to acquire the necessary competence, and evaluate the effectiveness of the actions taken". The note to that clause identifies training, mentoring, reassignment, hiring or contracting as possible actions, and records of competence must be available as evidence.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `1ea0ea64`  task 3.2

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **7.3**  (Awareness)
- **task**: Explain awareness and communication requirements
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A quality manager is briefing a project team on what clause 7.3 of the AI management system standard expects. Which description of that expectation is accurate?

- **(KEY)** People working under the organization's direction are to be aware of the AI policy, how they help the system succeed, and the effect of departing from its rules.
- People on the payroll must know the AI policy, while contracted staff are covered instead through evaluation of their competence for the work.
- Each person covered by the system must have a record retained by the organization showing that the three awareness topics were conveyed to them.
- The expectation is met by delivering training on the AI policy and then judging whether those training actions achieved their purpose.

**Explanation.** Clause 7.3 extends awareness to "Persons doing work under the organization’s control" and names three subjects: the AI policy, the individual's contribution to how well the management system works including the gains from better AI performance, and what follows from failing to meet the system's requirements. The scope is therefore not limited to employees, and the content is these three topics rather than records or training evaluation.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `ab040514`  task 3.4

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **8.1**  (Operational planning and control)
- **task**: Explain operational planning and control
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A financial services firm contracts an outside vendor to label the training data used by one of its AI systems. The labelling work feeds directly into a system covered by the firm's AI management system. Under the operational planning and control requirements, how should the firm treat this vendor activity?

- The firm passes control of the labelling activity to the vendor through the terms agreed in the supply contract.
- The firm examines the labelling activity when users report problems traceable to poorly labelled data.
- The firm treats the labelling activity as sitting outside the criteria it sets for its own processes.
- **(KEY)** The firm keeps the vendor's labelling activity under its own control, since the activity bears on its AI management system.

**Explanation.** Clause 8.1 requires that "The organization shall ensure that externally provided processes, products or services that are relevant to the AI management system are controlled." Because the labelling work is relevant to the AIMS, responsibility for ensuring it is controlled stays with the organization; it is not discharged by contracting it out, excluded from the organization's process criteria, or limited to reactive review after complaints.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `cdde7e6b`  task 3.6

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **B.7.2**  (Data for development and enhancement of AI system)
- **task**: Explain data management requirements for AI systems
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A provider is reviewing the data-related topics its AI data management process addresses. Which of the listed data properties mainly affects how the model behaves in its deployment context, rather than being one of the components that make up information security as defined in the standard?

- Protection of the data from disclosure to parties that are not authorized
- Assurance that the data remains unaltered and complete while it is held
- **(KEY)** Degree to which the training data mirrors the setting where the system will run
- Assurance that the data can be reached by authorized users when it is needed

**Explanation.** B.7.2 lists topics that data management can cover, among them "representativeness of training data compared to operational domain of use". This property concerns whether the data matches the domain the system will operate in, which drives AI outcomes; it is not one of the three properties that clause 3.23 uses to define information security (confidentiality, integrity, availability).

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `4024c897`  task 3.7

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **7.2**  (Competence)
- **task**: Analyze which of an existing ISMS's support and operation machinery carries over to an AIMS
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A firm with a long-standing, certified information security management system is standing up an AI management system over the same governance machinery. It proposes to reuse, unchanged: its records-control procedure, its communications plan, its staff awareness briefings, and the competence matrix and training records it already holds for its security roles. Reviewing this reuse plan, which conclusion is best supported?

- **(KEY)** The existing competence evidence, built for security roles, does not by itself cover persons whose work affects AI performance.
- The awareness briefings transfer intact, since staff are already told about the security policy and the consequences of non-conformity.
- The operational planning process transfers intact, with the process criteria already set for security work applied to AI development and use.
- The records-control procedure cannot be reused; a separate documented-information system dedicated to AI records has to be stood up alongside it.

**Explanation.** Clause 7.2 ties competence to work that affects AI performance and requires evidence of it: 'Appropriate documented information shall be available as evidence of competence.' Records demonstrating security competence therefore do not, on their own, discharge 7.2 for AI-related roles; the competence needed for AI work must be determined and evidenced. The documented-information and communication machinery of 7.4 and 7.5 can be carried across, and 8.1 carries over in form, but the processes and controls it governs (those determined under 6.1.3) are AI-specific.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `d48a4f53`  task 3.8

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **8.2**  (AI risk assessment)
- **task**: Apply the clause 8 operational requirements for assessment and treatment
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A provider has internally approved a substantial redesign of an AI system's decision logic. The redesign has not yet been built or released. According to the operational requirements of Clause 8, what should the organization do at this point?

- Carry out both assessments now and retain the statement of applicability as the record of results
- Carry out the risk assessment now and the impact assessment once the redesign is operating
- Schedule both assessments for the next planned interval and retain the results they produce
- **(KEY)** Carry out the risk assessment and the impact assessment now, retaining the results of both

**Explanation.** Clause 8.2 requires AI risk assessments 'at planned intervals or when significant changes are proposed or occur', and clause 8.4 applies the same trigger to AI system impact assessments for proposed significant changes. A change that is proposed but not yet implemented already triggers both, and both clauses require the results to be retained as documented information.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `594c7d73`  task 4.1

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **A.1**  (General)
- **task**: Explain the structure of Annex A and the status of Annex B
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A quality manager asks how the control list in Annex A is meant to function when the organization treats its AI risks. Which description fits the annex?

- It serves as a list of objectives chosen in a step that is separate from choosing the controls.
- It serves as the permitted source of controls, with omissions recorded in the applicability statement.
- It serves as a mandatory baseline, to be fully implemented before any further control is added.
- **(KEY)** It serves as a reference set, and an organization may devise and apply controls of its own.

**Explanation.** A.1 frames the tabled controls as a reference point for organizational objectives and AI risks; it states that they need not all be used and that an organization 'can design and implement their own controls', pointing to 6.1.3.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `82edb6a3`  task 4.1

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **B.1**  (General)
- **task**: Explain the structure of Annex A and the status of Annex B
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** During preparation for an audit, a team debates what Annex B contributes and how it affects their applicability statement. Which description is accurate?

- **(KEY)** It offers guidance for the controls in the table, and its adoption need not be recorded in that statement.
- It offers guidance for a subset of the tabled controls that each organization selects for itself.
- It offers the complete range of technical controls available to the organization for risk treatment.
- It offers guidance whose inclusion or exclusion is justified item by item in that statement.

**Explanation.** Clause B.1 presents the annex as support for putting the tabled controls into practice and meeting their objectives, while making clear that organizations are not expected to record or defend their choices about that guidance in the applicability statement.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `9bd5796f`  task 4.2

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **6.1.3**  (AI risk treatment)
- **task**: Explain how Annex A relates to the Statement of Applicability
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** An organization leaves one Annex A control out of its statement of applicability. Which recorded reason would an assessor most reasonably accept as an adequate justification?

- **(KEY)** The risk assessment did not find the control necessary and no applicable external obligation imposes it.
- The organization judged the Annex B guidance written for that control unsuitable for its operating context.
- The organization chose a control of its own design instead, and left both out of the document.
- The related risk was accepted by management and was recorded only in the risk treatment plan.

**Explanation.** Clause 6.1.3 f) illustrates acceptable reasoning for leaving a control out: the risk assessment showed no need for it, and external obligations either do not demand it or grant an exception. The other options rest on guidance suitability, on placing risk information outside the statement of applicability, or on omitting a necessary self-designed control, none of which match that clause.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `333a50d8`  task 4.3

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **B.2.3**  (Alignment with other organizational policies)
- **task**: Select controls for AI policy, internal organization and resources
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A bank already maintains separate corporate policies on privacy, information security and product quality, and has just issued a standalone AI policy. An internal audit finds that none of the existing corporate policies acknowledge the bank's AI aims, and no analysis was done to see whether any of them needs revising. Which Annex A control category most directly addresses this gap?

- Documenting a policy that covers how the organization builds or uses AI systems
- **(KEY)** Determining where existing corporate policies intersect with the organization's AI aims
- Defining and allocating AI accountabilities according to organizational needs
- Reviewing the AI policy at scheduled intervals for continued adequacy

**Explanation.** The gap is that no analysis has established which other policies touch the AI aims. Clause B.2.3 (alignment with other organizational policies) states: "The organization should determine where other policies can be affected by or apply to, the organization’s objectives with respect to AI systems." Its guidance points to analysing intersections with domains such as quality, security and privacy and then updating those policies or covering the point in the AI policy.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `8cf14ae1`  task 4.3

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **A.3.3**  (Reporting of concerns)
- **task**: Select controls for AI policy, internal organization and resources
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** An engineer at a company that deploys a third-party AI system suspects the company is presenting itself to customers as the system's developer. She finds no established channel through which such a worry can be raised and handled, at any stage of the system's life. Which Annex A control category closes this gap?

- Reviewing the AI policy when legal or business circumstances change
- Recording the people and competences drawn on across the AI system life cycle
- **(KEY)** Establishing a route for raising concerns about the organization's role in the system
- Allocating AI responsibilities across areas such as human oversight and safety

**Explanation.** Clause A.3.3 covers exactly this: "The organization shall define and put in place a process to report concerns about the organization’s role with respect to an AI system throughout its life cycle." The missing element is the reporting channel, not the assignment of duties or the documentation of resources.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `a287616d`  task 4.4

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **B.6.2.6**  (AI system operation and monitoring)
- **task**: Select controls across impact assessment and the AI system life cycle
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A lender's deployed screening model works well at release. Over the following year the mix of applicants shifts, the model's accuracy quietly falls, and nobody notices until complaint volumes rise, because no one was watching how the model behaved on live traffic after go-live. Which Annex B life-cycle control area most directly addresses this gap?

- Determining what technical material each category of interested party receives and in what form
- Defining test methods, test data selection and release thresholds applied before the system ships
- Specifying and recording the needs and rationale the new system is built to satisfy
- **(KEY)** Defining what is needed to run the system on an ongoing basis, including tracking live performance

**Explanation.** B.6.2.6 covers the ongoing running of a deployed system, naming monitoring of the system and its performance, together with repairs, updates and support, as the baseline elements to be defined and documented. Its guidance explicitly addresses performance changing in production through concept or data drift, which is exactly the described failure.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `169fb07b`  task 4.5

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **A.8.3**  (External reporting)
- **task**: Select controls for data and for information to interested parties
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A public body deploys an AI system that screens benefit applications. Applicants and advocacy groups have no way to tell the body when they believe the system has harmed them, and the body decides to close this gap. Which Annex A control does this action implement?

- Define a process for recording where the system's data came from across its life cycle
- **(KEY)** Establish a route through which affected parties can raise harms arising from the system
- Set out what the body is obliged to report about the system to regulators
- Draw up a plan for telling the people who use the system about incidents

**Explanation.** Control A.8.3 (External reporting) is the control that establishes an inbound channel: it requires the organization to "provide capabilities for interested parties to report adverse impacts of the AI system". The other options name genuine controls that run in the opposite direction (organization to users or authorities) or concern data, not reporting of harm.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `9ecce8e5`  task 4.6

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **A.9.3**  (Objectives for responsible use of AI system)
- **task**: Select controls for use of AI systems and for third-party and customer relationships
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A retailer switches on a product recommendation engine built entirely by an outside supplier. The compliance lead is mapping which Annex A controls bind the retailer in its role as a user of the system. Which statement is accurate?

- The supplier that built the engine, rather than the retailer, carries the duty to set down and record use processes.
- **(KEY)** The retailer has to settle on and record the aims that steer its responsible use of the engine.
- Granting reviewers the power to overturn engine outputs is a mandated element of the use controls.
- Naming internal AI roles discharges the duty to apportion life cycle duties across partners and customers.

**Explanation.** A.9.3 places the duty to work out and write down the aims guiding responsible use on the organization itself, so the retailer carries it in its user role even though an outside party built the engine. The sample aims set out in Annex B at B.9.3 (fairness, privacy and the like) sit under a should and are offered as illustrations rather than a closed, binding set.

**Why verbatim fails.** The row's stored `key_support` is:

> Objectives for responsible use of AI The organization shall identify and document objectives to system guide the responsible use of AI systems.

The library's A.9.3 now reads:

> The organization shall identify and document objectives to guide the responsible use of AI systems.

That stored text appears verbatim in: `ISO/IEC 42001 A.9` (Use of AI systems).

**That is a CONTAINER**, whose text is its children's run together -- so the stored quotation spans a
column boundary. It was captured before this passage was de-columned. The likely repair is a
**re-quote from the clean clause**, not a reject: the stored anchor is stale, which says nothing
about whether the item is sound.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | **FAIL** -- key: not verbatim in A.9.3 |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `ef2a9c5d`  task 5.1

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **9.1**  (Monitoring, measurement, analysis and evaluation)
- **task**: Explain monitoring, measurement, analysis and evaluation for an AIMS
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** During a readiness review, a team asks what outcome the clause on monitoring, measurement, analysis and evaluation obliges the organization to deliver. Which outcome is that clause's obligation?

- Judging the possible consequences for individuals and societies across the AI system life cycle
- **(KEY)** Forming a judgement on how well the AI management system works and how effective it is
- Setting out the elements for running the AI system, such as repairs, updates and support
- Recording decisions on improvement opportunities and changes needed to the AI management system

**Explanation.** Clause 9.1 states: "The organization shall evaluate the performance and the effectiveness of the AI management system." The other outcomes belong to different clauses: management review results (9.3.3), the operation and monitoring control (B.6.2.6) and the impact assessment process control (B.5.2).

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `99524730`  task 5.2

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **9.2.1**  (General)
- **task**: Explain the internal audit requirement
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A manager asks what information the periodic internal audits of the AI management system are meant to generate. Which answer best reflects the standard?

- Whether outsiders have a usable route for raising harmful effects caused by the AI system
- Whether the topics, timing, audiences and channels for internal and external messaging have been settled
- **(KEY)** Whether the system matches the arrangements the organization set for it and the clauses of this document, and is working and being sustained
- Whether the entry and exit criteria for every stage of the AI system life cycle have been written down

**Explanation.** Clause 9.2.1 sets out why internal audits are held at planned intervals: they yield information on whether the AI management system conforms both to the arrangements the organization itself set for that system and to the requirements of the document, and on whether it is being effectively implemented and kept up. The other options describe communication determination (7.4), the external reporting capability (A.8.3) and informative life cycle criteria guidance (B.6.2.1).

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `4b317d6c`  task 5.3

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **9.3.2**  (Management review inputs)
- **task**: Explain management review inputs and results
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A review agenda prepared for top management lists: progress on actions agreed at the last review; shifts in the organization's external and internal issues; performance data covering nonconformity and corrective action trends, monitoring and measurement figures, and audit findings; and candidate improvements for the coming year. Which required input to the review is absent from this agenda?

- Outcomes of the AI risk assessments carried out at planned intervals
- **(KEY)** Changes in what relevant interested parties need and expect
- The organization's documented reporting obligations towards interested parties
- Records showing how documented information is distributed and accessed

**Explanation.** Clause 9.3.2 lists the inputs the review has to cover, including item c): "c) changes in needs and expectations of interested parties that are relevant to the AI management system;". The agenda covers items a), b), d) and e) but omits c).

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `17f802fb`  task 2.6

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **6.1.4**  (AI system impact assessment)
- **task**: Apply the AI system impact assessment
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A deployment team has completed an AI system impact assessment for a customer-service chatbot. The assessment covers only the benefits and consequences of the system's intended use, and the results have been documented. Applying Clause 6.1.4, which action does the organization need to take next?

- Keep the assessment results separate from the risk assessment so that the two processes stay independent.
- **(KEY)** Extend the assessment to the consequences of reasonably foreseeable misuse of the system.
- Delay documenting the assessment results until a regulator or customer formally requests them.
- Publish the assessment results to every interested party before the chatbot is released.

**Explanation.** Clause 6.1.4 requires the impact assessment to determine potential consequences of deployment, intended use AND foreseeable misuse; an assessment limited to intended use is incomplete. The other options contradict the documentation requirement, the conditional ('where appropriate', 'can') provision on making results available, and the requirement to consider the results in the risk assessment.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `fd65b423`  task 3.3

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **7.5.2**  (Creating and updating documented information)
- **task**: Manage documented information for an AIMS
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** An AI governance team has drafted a new internal procedure for bias testing and intends to issue it as part of the AIMS. Before the procedure is released for use, which action does the AIMS documented information requirement place on the organization?

- Identify the draft as external-origin documented information and bring it under control on that basis.
- Have top management approve the draft during its planned review of the AI management system.
- **(KEY)** Review and approve the draft for suitability and adequacy, with appropriate identification, format and media.
- Determine and document the organization's obligations to report the procedure's content to regulators and customers.

**Explanation.** Clause 7.5.2 applies when documented information is created or updated: the organization shall ensure appropriate identification and description, format and media, and review and approval for suitability and adequacy. That is the applicable obligation before issuing the new procedure.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `4c69db20`  task 3.5

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **B.10.3**  (Suppliers)
- **task**: Apply the AIMS to AI systems and components obtained from third parties
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A bank embeds a pre-trained fraud-detection model licensed from an external vendor into its own platform. As the team applies its AI management system to this dependency, which action is consistent with the guidance on suppliers?

- Skip documenting how the vendor's model is integrated into the bank's platform, because the vendor documents its own product.
- Apply one identical monitoring and evaluation regime to every supplier, irrespective of what is supplied or the risk it poses.
- Treat replacement of the model as the only available response when it produces impacts misaligned with the bank's responsible approach, since corrective action cannot be pursued with a supplier.
- **(KEY)** Obtain appropriate and adequate documentation about the model from the vendor.

**Explanation.** B.10.3 (implementation guidance for control A.10.3) advises that the organization make sure a supplier hands over suitable and sufficient documentation covering the supplied AI system, cross-referencing B.6.2.7 on technical documentation. Obtaining that documentation for the licensed model is the action aligned with the guidance.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `f93d06cc`  task 4.6

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **A.10.2**  (Allocating responsibilities)
- **task**: Select controls for use of AI systems and for third-party and customer relationships
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A retail company does not build AI systems; it licenses a demand-forecasting AI system from a vendor and operates it in its stores. While planning Annex A control implementation, the AIMS coordinator asks which statement about the company's obligations is accurate.

- The nine illustrative responsible-use objectives, ranging from fairness and accountability through to accessibility, must all be adopted exactly as listed.
- Human reviewers with authority to override the system's decisions must be assigned at every stage of the AI system life cycle.
- **(KEY)** Responsibilities across the AI system life cycle are allocated between the company and its partners, suppliers, customers and third parties.
- Because the system was sourced externally, documented processes for responsible use apply only to the vendor, not to the company operating it.

**Explanation.** A.10.2 is a 'shall' control requiring the organization to ensure life-cycle responsibilities are allocated between itself, its partners, suppliers, customers and third parties — directly applicable to an organization using a vendor-supplied AI system.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `07561e42`  task 5.2

- **verdict today**: `read`, recorded 2026-09-27
- **anchor**: ISO/IEC 42001 **9.2.2**  (Internal audit programme)
- **task**: Explain the internal audit requirement
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** An organization is setting up the internal audit programme for its AI management system. Beyond deciding how often audits occur, the methods used, who is responsible, and how audits are planned and reported, what else does it have to take into account?

- The number of adverse impacts of the AI system reported by interested parties during the period
- **(KEY)** The importance of the processes being audited and the findings of previous audits
- Whether the audits will be carried out by an external party acting on the organization's behalf rather than by its own staff
- The criteria and requirements defined for each stage of the AI system life cycle

**Explanation.** Clause 9.2.2 names two inputs that must be weighed when the audit programme is set up: how significant the processes in scope are, and what earlier audits turned up. The other options come from clauses on a different subject — who may perform an internal audit, capabilities for reporting adverse impacts, and life cycle criteria — none of which is identified as an input to establishing the programme.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `8d1e4481`  task 1.3

- **verdict today**: `read`, recorded 2026-09-29
- **anchor**: ISO/IEC 42001 **C.3.6**  (System life cycle issues)
- **task**: Describe the AI system life cycle and why it anchors AIMS obligations
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** Which of the following is offered in Annex C as an illustration of where risk can come from?

- Choosing an unsuitable accuracy metric for a classification task.
- **(KEY)** Leaving a fielded system without upkeep over a long period.
- Publishing technical documentation that management has not approved.
- Running an AI management system apart from a quality system.

**Explanation.** Clause C.3.6 notes that risk can arise anywhere across the whole life cycle, and its illustrations include design flaws, poor deployment, absence of maintenance, and decommissioning problems; lack of upkeep of a system already in the field matches the maintenance example. The other options come from operational performance guidance, documentation guidance and integration guidance rather than from the C.3.6 illustrations.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `d16bcf46`  task 1.3

- **verdict today**: `read`, recorded 2026-09-29
- **anchor**: ISO/IEC 42001 **C.3.6**  (System life cycle issues)
- **task**: Describe the AI system life cycle and why it anchors AIMS obligations
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** An insurer runs an approved model for three years with no patching, no updates and no support arrangement in place. Using the illustrations in Annex C, this fits best under which heading?

- The system was put into service inadequately.
- Withdrawal of the system raised unresolved issues.
- **(KEY)** Upkeep of the system in service was absent.
- The original design of the system was flawed.

**Explanation.** Clause C.3.6 notes that risk sources can arise anywhere across the whole life cycle, and the examples it gives include missing maintenance alongside design flaws, poor deployment and decommissioning problems. Three years in service with no patching, updates or support is the missing-maintenance case.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## `602cab35`  task 1.3

- **verdict today**: **none**
- **anchor**: ISO/IEC 42001 **A.6.2.6**  (AI system operation and monitoring)
- **task**: Describe the AI system life cycle and why it anchors AIMS obligations
- **row**: status `pending_review`, visibility `secure`, pool `secure`, is_exam_scope `true`

**Stem.** A deployed classifier does not learn continuously, but its accuracy declines as the production data shifts, and the team prepares a retraining round. Which Annex A life-cycle control covers this activity?

- **(KEY)** Operation and monitoring, whose documented elements cover performance monitoring and updates
- Deployment, whose documented plan confirms the applicable requirements before go-live
- Verification and validation, whose documented measures come with criteria for their use
- Technical documentation, whose content is matched to categories of interested parties

**Explanation.** Detecting shifted performance in production and updating the system sits in the operation and monitoring stage. A.6.2.6 calls for documented elements for the ongoing running of the AI system, covering as a minimum the monitoring of the system and its performance, the fixing of faults, the issuing of updates and the provision of support. The other options name controls attached to earlier stages or to documentation provision.

**Gates, re-run today**

| gate | result |
|---|---|
| `quote-noise` | PASS |
| `verbatim` | PASS |
| `anchor-is-primary` | PASS |
| `clause-number-recall` | PASS |
| `letter-reference` | PASS |

**Verdict:** accept / reject  _(and a reason if reject)_

---

## What this document does not decide

- **The gates are necessary, not sufficient.** Measured recall of the strongest instrument against the
  director's own read of 40 items was 7 of 14, and 5 of the 9 that were a named defect in the key. A row
  clean on all five gates can still have a wrong key.
- **Nothing here is servable.** Every row is `pending_review`, and `generate-mock-exam` filters `approved`.
- **A reject needs its reason recorded**, because a rejection is the one disposition no artifact can derive.
