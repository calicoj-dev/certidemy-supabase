# AIMS-F thin-map proposals

**Read-only. Nothing is promoted.** Ruled PROMPT-87 s4. `promote-13-lifecycle-controls.mjs` refuses to
write a clause a verdict file does not list, and the same discipline applies to whatever is ruled here.

The candidate set is each task's own SUPPORTING links first -- that is how 1.3 was fixed, where all seven
promoted clauses were already supporting. Library clauses are proposed only where the supporting set
cannot reach 4, and marked **LIBRARY**.

Two rules are applied mechanically rather than judged: **42001 Annex B stays supporting** (guidance for
an Annex A control), and **ISO/IEC 17021-1 and 42006 are primary only on a certification task** -- none
of these 14 is one.

---

## Task 1.2   —   1 effective primaries now

**Determine the organization's roles with respect to its AI systems**

*Roles with respect to AI systems: who the organization IS in the AI value chain.*

- *Knowledge:* Determining roles is a requirement, not advice. The role categories are AI providers, AI producers, AI customers, AI partners, AI subjects and relevant authorities, with developers, designers, operators, testers and deployers sitting inside the producer category. One organization can hold several roles at once, and its roles determine which requirements and controls apply and to what extent. Role 
- *Skills:* Given a described organization and an AI system, identify which roles apply and what follows for applicability.
- *Abilities:* Resistance to the assumption that one label fits a whole organization.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `3.2` | 42001 | 40 | **in scope** | the role allocation is expressed in terms of interested parties, so the definition is the task's vocabulary |
| `4.3` | 42001 | 83 | out of scope | determining the SCOPE is task 2.2's subject, not the organization's role |
| `A.3.2` | 42001 | 21 | **in scope** | AI roles and responsibilities is the control the task is named after |
| `A.10.2` | 42001 | 26 | **in scope** | allocating responsibilities between the organization, its partners, suppliers and customers IS the role question |
| `B.10.2` | 42001 | 245 | out of scope | Annex B guidance for A.10.2 -- stays supporting by rule |
| `B.10.4` | 42001 | 229 | out of scope | Annex B guidance -- stays supporting by rule |

**Effective primaries if the in-scope candidates are promoted: 1 → 4**

Withheld (3): 3 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 2.1   —   2 effective primaries now

**Determine the organization's context and interested parties for an AIMS**

*Context and interested parties. Its supporting set cannot reach four; two library clauses are the task's literal subject.*

- *Knowledge:* External and internal issues include applicable legal requirements and prohibited uses, regulator guidance, incentives and consequences, cultural and ethical norms, the competitive landscape, contractual obligations and the intended purpose of the systems themselves. Clause 4.1 requires the organization to determine whether climate change is a relevant issue, and clause 4.2 notes that interested p
- *Skills:* Given a described organization, identify context issues and interested parties that an information-security-shaped analysis would miss.
- *Abilities:* Willingness to count people outside the commercial relationship.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `3.2` | 42001 | 40 | **in scope** | the definition of interested party is the second half of the task statement |
| `4.3` | 42001 | 83 | out of scope | scope belongs to 2.2 |
| `4.1` | 42001 | 465 | **in scope** | LIBRARY: Understanding the organization and its context is the first half of the task, verbatim |
| `4.2` | 42001 | 48 | **in scope** | LIBRARY: Understanding the needs and expectations of interested parties is the second half, verbatim |

**Effective primaries if the in-scope candidates are promoted: 2 → 5**

Withheld (1): 1 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 2.2   —   2 effective primaries now

**Determine the scope of the AI management system**

*Scope of the AIMS.*

- *Knowledge:* Scope is determined from the context issues and interested-party requirements, must be available as documented information, and determines the organization's activities with respect to the standard's requirements, controls and objectives. It must account for AI capability the organization did not build, including vendor features, embedded model interfaces and AI inside purchased software. A scope 
- *Skills:* Given an estate description, determine what falls inside the AIMS boundary and justify an exclusion.
- *Abilities:* Refusal to let a convenient boundary define the scope.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `4.1` | 42001 | 465 | **in scope** | the scope is determined from the context, and 4.3 requires it to consider 4.1's issues |
| `4.2` | 42001 | 48 | **in scope** | 4.3 requires the scope to consider interested-party requirements |
| `4.4` | 42001 | 29 | **in scope** | the AI management system clause is what the scope bounds |
| `9.1.1` | 17021-1 | 117 | out of scope | the certification body's application process; this task is the organization's own scope |
| `9.1.3` | 42006 | 40 | out of scope | scope of CERTIFICATION is a different object from scope of the AIMS, and 42006 is primary only on a certification task |

**Effective primaries if the in-scope candidates are promoted: 2 → 5**

Withheld (2): 2 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 2.4   —   3 effective primaries now

**Assign roles, responsibilities and authorities for AI**

*Assigning roles, responsibilities and authorities.*

- *Knowledge:* Top management assigns and communicates responsibilities and authorities for relevant roles, and must specifically assign authority for ensuring the AIMS conforms to the standard and for reporting AIMS performance to top management. Areas that typically need named ownership span impact assessment, security, privacy, safety, data quality, development, performance, supplier relationships, resource m
- *Skills:* Identify where an assignment leaves an outcome unowned.
- *Abilities:* Insistence that a person, not a system, is accountable.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `3.3` | 42001 | 69 | **in scope** | top management is the party clause 5.3 assigns from, so the definition carries the task's subject |
| `A.3.3` | 42001 | 67 | **in scope** | reporting of concerns is an authority the organization must define and allocate |
| `B.3.2` | 42001 | 160 | out of scope | Annex B guidance for A.3.2 -- stays supporting |
| `B.3.3` | 42001 | 179 | out of scope | Annex B guidance for A.3.3 -- stays supporting |

**Effective primaries if the in-scope candidates are promoted: 3 → 5**

Withheld (2): 2 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 2.7   —   3 effective primaries now

**Differentiate the AI risk assessment from the AI system impact assessment and determine what a situation requires**

*Risk assessment versus impact assessment. Both normative clauses are already linked and neither is primary.*

- *Knowledge:* The two are not parallel and are not distinguished by who is harmed - the risk analysis already assesses consequences to the organization, individuals and societies. The impact assessment is an input, and the link is a requirement: clause 6.1.4 requires the impact assessment's results to be taken into account when risk is assessed, with a reciprocal note at clause 6.1.2 permitting its use when ass
- *Skills:* Given a scenario, determine which assessment is called for, or both, and justify the answer from anchoring and output rather than from who is harmed.
- *Abilities:* Refusal to collapse two obligations into one document.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `8.2` | 42001 | 36 | **in scope** | the AI risk assessment clause is one of the two things the task differentiates |
| `8.4` | 42001 | 37 | **in scope** | the AI system impact assessment clause is the other |
| `A.5.2` | 42001 | 37 | **in scope** | the Annex A control for impact assessment, which is where its process requirements sit |

**Effective primaries if the in-scope candidates are promoted: 3 → 6**

---

## Task 2.8   —   2 effective primaries now

**Apply AI risk treatment and produce the Statement of Applicability**

*Risk treatment and the Statement of Applicability.*

- *Knowledge:* Treatment selects appropriate options, determines all controls necessary to implement them, compares those controls against Annex A to verify that no necessary control has been omitted, identifies any additional controls needed beyond Annex A, and considers the Annex B guidance. The Statement of Applicability documents all necessary controls with justification for inclusion and exclusion; legitima
- *Skills:* Determine a treatment option for a described risk and state what the Statement of Applicability must record.
- *Abilities:* Treating documentation as evidence rather than paperwork.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `6.1.1` | 42001 | 383 | **in scope** | planning general: the SoA is produced inside the 6.1 planning process |
| `8.3` | 42001 | 91 | **in scope** | AI risk treatment is the operational half of the task |
| `A.1` | 42001 | 76 | **in scope** | Annex A's own introduction states that not every control must be used, which is the SoA's whole point |
| `B.1` | 42001 | 169 | out of scope | Annex B general guidance -- stays supporting |

**Effective primaries if the in-scope candidates are promoted: 2 → 5**

Withheld (1): 1 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 3.1   —   3 effective primaries now

**Determine resources and competence needs for an AIMS**

*Resources and competence. Five Annex A resource controls are linked and all are supporting.*

- *Knowledge:* The organization determines and provides the resources needed to establish, implement, maintain and continually improve the AIMS. Competence must be determined for persons doing work under its control that affects AI performance, established on the basis of appropriate education, training or experience, and evidenced by appropriate documented information. Where competence is lacking the organizati
- *Skills:* Identify a competence gap from a described team.
- *Abilities:* Honesty about what the organization does not know.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `A.4.2` | 42001 | 29 | **in scope** | resource documentation is the first of the resource controls the task covers |
| `A.4.3` | 42001 | 21 | **in scope** | data resources |
| `A.4.4` | 42001 | 21 | **in scope** | tooling resources |
| `A.4.5` | 42001 | 25 | **in scope** | system and computing resources |
| `A.4.6` | 42001 | 74 | **in scope** | human resources, which is the competence half of the task |
| `B.4.2` | 42001 | 228 | out of scope | Annex B guidance -- stays supporting |
| `B.4.3` | 42001 | 414 | out of scope | Annex B guidance -- stays supporting |
| `B.4.4` | 42001 | 101 | out of scope | Annex B guidance -- stays supporting |
| `B.4.5` | 42001 | 181 | out of scope | Annex B guidance -- stays supporting |
| `B.4.6` | 42001 | 151 | out of scope | Annex B guidance -- stays supporting |

**Effective primaries if the in-scope candidates are promoted: 3 → 8**

Withheld (5): 5 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 3.2   —   3 effective primaries now

**Explain awareness and communication requirements**

*Awareness and communication.*

- *Knowledge:* Awareness covers persons doing work under the organization's control, not only employees, and spans the AI policy, their contribution to the effectiveness of the AIMS including the benefits of improved AI performance, and the implications of not conforming with AIMS requirements. Communication must be determined across what will be communicated, when, with whom and how, for both internal and exter
- *Skills:* Distinguish awareness from training.
- *Abilities:* Treating communication as a designed process.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `5.2` | 42001 | 117 | **in scope** | the AI policy shall be communicated within the organization and available to interested parties -- the communication requirement in normative text |
| `A.3.3` | 42001 | 67 | **in scope** | reporting of concerns is the organization's internal communication channel |

**Effective primaries if the in-scope candidates are promoted: 3 → 5**

---

## Task 3.4   —   3 effective primaries now

**Explain operational planning and control**

*Operational planning and control.*

- *Knowledge:* The organization establishes criteria for its processes and implements control in accordance with those criteria, and implements the controls determined during risk treatment that relate to operation of the AIMS. The effectiveness of those controls must be monitored and corrective actions considered where intended results are not achieved. Documented information must be kept to whatever extent giv
- *Skills:* Identify what controlled requires for a described outsourced activity.
- *Abilities:* Ownership that does not transfer with the work.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `6.1.3` | 42001 | 374 | **in scope** | 8.1 implements the risk treatment 6.1.3 plans, so the treatment clause carries the control criteria |
| `6.2` | 42001 | 149 | **in scope** | AI objectives and the planning to achieve them are what operational control is measured against |
| `6.3` | 42001 | 23 | **in scope** | planning of changes is operational control over change |

**Effective primaries if the in-scope candidates are promoted: 3 → 6**

---

## Task 4.2   —   2 effective primaries now

**Explain how Annex A relates to the Statement of Applicability**

*Annex A and the Statement of Applicability. The supporting set cannot reach four; two library clauses are the SoA itself.*

- *Knowledge:* The Statement of Applicability documents all necessary controls and the justification for inclusion or exclusion of controls. An organization may need only some of the Annex A controls, and may go beyond that list with additional controls established by the organization itself. Exclusion is legitimate and must be reasoned rather than silent, and documented justifications may be provided for exclud
- *Skills:* Determine whether a described exclusion is adequately justified.
- *Abilities:* Completeness over convenience.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `9.1.3` | 42006 | 40 | out of scope | a CB standard on a non-certification task |
| `A.1` | 42001 | 76 | **in scope** | Annex A's introduction: the controls are a reference and not all are required, which is what the SoA records |
| `B.1` | 42001 | 169 | out of scope | Annex B general guidance -- stays supporting |
| `6.1.3` | 42001 | 374 | **in scope** | LIBRARY: 6.1.3 f) is the clause that REQUIRES a statement of applicability to be produced |
| `3.26` | 42001 | 304 | **in scope** | LIBRARY: the definition of statement of applicability -- documentation of all necessary controls and the justification for inclusion or exclusion |

**Effective primaries if the in-scope candidates are promoted: 2 → 5**

Withheld (2): 2 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 5.1   —   3 effective primaries now

**Explain monitoring, measurement, analysis and evaluation for an AIMS**

*Monitoring, measurement, analysis and evaluation.*

- *Knowledge:* The organization determines what needs to be monitored and measured, the methods to be used to ensure valid results, when monitoring and measuring is performed, and when results are analysed and evaluated, with documented information available as evidence of the results. It must evaluate how well the AI management system performs and how effective it is. A note to the definition of performance - n
- *Skills:* Distinguish a measure of AIMS effectiveness from a model performance metric.
- *Abilities:* Measuring the system of governance, not only the technology.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `6.2` | 42001 | 149 | **in scope** | objectives are what 9.1 evaluates performance against |
| `A.6.2.6` | 42001 | 37 | **in scope** | AI system operation and monitoring is the control carrying the monitoring requirement |
| `B.6.2.6` | 42001 | 841 | out of scope | Annex B guidance for A.6.2.6 -- stays supporting |

**Effective primaries if the in-scope candidates are promoted: 3 → 5**

Withheld (1): 1 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Task 5.2   —   2 effective primaries now

**Explain the internal audit requirement**

*The internal audit requirement. One supporting link only; the two normative clauses must come from the library.*

- *Knowledge:* Internal audits are conducted at planned intervals to provide information on whether the AIMS conforms to the organization's own requirements for it and to the requirements of the standard, and whether it is effectively implemented and maintained. The audit programme covers frequency, methods, responsibilities, planning requirements and reporting, and weighs how important the processes under audit
- *Skills:* Identify an objectivity or impartiality problem in a described audit assignment.
- *Abilities:* Independence treated as a structural requirement.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `3.18` | 42001 | 94 | **in scope** | the definition of audit is the task's subject term |
| `9.2.1` | 42001 | 43 | **in scope** | LIBRARY: the internal audit requirement itself |
| `9.2.2` | 42001 | 102 | **in scope** | LIBRARY: the internal audit programme, which is what the requirement obliges |

**Effective primaries if the in-scope candidates are promoted: 2 → 5**

---

## Task 5.3   —   3 effective primaries now

**Explain management review inputs and results**

*Management review inputs and results.*

- *Knowledge:* Top management reviews the AIMS at planned intervals, checking that it still suits the organization, is still adequate and still works. Inputs are the status of actions from previous reviews, changes in external and internal issues relevant to the AIMS, changes in the needs and expectations of interested parties, information on AIMS performance including trends in nonconformities and corrective ac
- *Skills:* Identify a missing management review input.
- *Abilities:* Review treated as a decision forum rather than a formality.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `10.1` | 42001 | 15 | **in scope** | continual improvement is where the review's results go, and at 15 words it just clears the floor |
| `9.3.2` | 42001 | 75 | **in scope** | LIBRARY: management review INPUTS, the first half of the task statement |
| `9.3.3` | 42001 | 37 | **in scope** | LIBRARY: management review RESULTS, the second half |

**Effective primaries if the in-scope candidates are promoted: 3 → 6**

---

## Task 5.4   —   1 effective primaries now

**Apply nonconformity and corrective action**

*Nonconformity and corrective action. Nine supporting links, and most are the certification body's process rather than the organization's.*

- *Knowledge:* When a nonconformity occurs the organization reacts to it, taking action to control and correct it and dealing with the consequences, then evaluates the need for action to eliminate the causes, so the same failure does not come back or turn up somewhere else, by reviewing the nonconformity, determining its causes and determining whether similar nonconformities exist or could potentially occur. Any
- *Skills:* Given a described failure, distinguish the correction from the corrective action.
- *Abilities:* Impatience with fixes that do not prevent recurrence.

| candidate | source | words | verdict | reasoning |
|---|---|---|---|---|
| `3.11` | 17021-1 | 99 | out of scope | the CB standard's definition; the organization's own is 42001 3.16 |
| `3.13` | 42001 | 13 | out of scope | effectiveness is 13 words, under the 15-word floor, so it cannot carry a key |
| `3.16` | 42001 | 111 | **in scope** | the definition of nonconformity, the task's first subject |
| `3.17` | 42001 | 15 | **in scope** | the definition of corrective action, the task's second subject |
| `9.4.5.3` | 17021-1 | 66 | out of scope | recording audit findings is the CB's audit process |
| `9.4.9` | 17021-1 | 33 | out of scope | cause analysis by the CB, not by the organization |
| `9.4.10` | 17021-1 | 136 | out of scope | the CB's judgement of effectiveness, not the organization's action |
| `10.1` | 42001 | 15 | **in scope** | continual improvement is the clause corrective action feeds |
| `A.7.4` | 42001 | 31 | out of scope | quality of data is not about nonconformity |
| `A.10.3` | 42001 | 34 | out of scope | suppliers is not about nonconformity |
| `10.2` | 42001 | 142 | **in scope** | LIBRARY: Nonconformity and corrective action is the clause the task is named after |

**Effective primaries if the in-scope candidates are promoted: 1 → 5**

Withheld (7): 7 candidate(s) reported out of scope
rather than promoted, as ruled.

---

## Summary

| task | now | if promoted | reaches 4 | to promote |
|---|---|---|---|---|
| 1.2 | 1 | 4 | yes | 3.2, A.3.2, A.10.2 |
| 2.1 | 2 | 5 | yes | 3.2, 4.1, 4.2 |
| 2.2 | 2 | 5 | yes | 4.1, 4.2, 4.4 |
| 2.4 | 3 | 5 | yes | 3.3, A.3.3 |
| 2.7 | 3 | 6 | yes | 8.2, 8.4, A.5.2 |
| 2.8 | 2 | 5 | yes | 6.1.1, 8.3, A.1 |
| 3.1 | 3 | 8 | yes | A.4.2, A.4.3, A.4.4, A.4.5, A.4.6 |
| 3.2 | 3 | 5 | yes | 5.2, A.3.3 |
| 3.4 | 3 | 6 | yes | 6.1.3, 6.2, 6.3 |
| 4.2 | 2 | 5 | yes | A.1, 6.1.3, 3.26 |
| 5.1 | 3 | 5 | yes | 6.2, A.6.2.6 |
| 5.2 | 2 | 5 | yes | 3.18, 9.2.1, 9.2.2 |
| 5.3 | 3 | 6 | yes | 10.1, 9.3.2, 9.3.3 |
| 5.4 | 1 | 5 | yes | 42001 3.16, 42001 3.17, 42001 10.1, 10.2 |

**Every one of the 14 tasks reaches 4** on in-scope candidates alone.

