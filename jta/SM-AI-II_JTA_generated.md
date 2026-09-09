# SM-AI-II - Job-Task Analysis

> **GENERATED FROM THE DATABASE on 2026-09-09. Do not hand-edit.**
>
> Every fact below is rendered from the live schema by
> `scripts/gen-jta-doc.mjs`. To change anything here, change the database
> through a migration and regenerate - the git diff on this file is then the
> change record.
>
> Design rationale, sourcing, review history and reconciliation records are
> NOT here. They carry human judgment that no query can reconstruct, and live
> in the companion narrative document.

**Certification:** Scrum Master II — AI  
**Status:** draft

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
| D1 | Resolving framework tensions | 20% | 10 |
| D2 | Coaching a team performing Scrum and still failing | 20% | 10 |
| D3 | Serving the Product Owner and the organization without absorbing their accountabilities | 17.5% | 9 |
| D4 | Empiricism under distortion | 20% | 10 |
| D5 | Scrum Master judgment when AI is inside the work system | 22.5% | 11 |
| **Total** | | **100%** | **50** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 3 (Apply) | 16 | 36.28% |
| 4 (Analyze) | 28 | 63.72% |

---

# Domain D1 - Resolving framework tensions (20%)

**Description.** Situations in which two Scrum Guide rules pull against each other and the Guide does not say which yields.

**Tasks:** 9  |  **MCQ seats:** 10

## Tasks

### Task 1.1 - Determine whether a proposed mid-Sprint change threatens the Sprint Goal

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `scope-renegotiation`, `sprint-goal-as-commitment`, `sprint-goal-threat-test` |

- **K:** The Sprint Goal as the Sprint's single commitment; the provision that scope may be renegotiated with the Product Owner as more is learned
- **S:** Applying the threat test to a concrete proposed change
- **A:** Holding the Sprint Goal against pressure from outside the team

### Task 1.2 - Analyze a situation in which the Developers' sizing of an item has been set by someone else

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `accountability-displacement`, `developer-sizing-authority`, `product-backlog-ordering` |

- **K:** The Developers who will be doing the work are responsible for the sizing; the Product Owner may influence them by helping them understand and select trade-offs
- **S:** Reading whether the number was imposed, conceded or genuinely contested
- **A:** Naming a displacement the Developers took part in

### Task 1.3 - Distinguish permitted additions to the Definition of Done from weakening of an organizational standard

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `definition-of-done`, `dod-strengthening`, `organizational-dod-floor` |

- **K:** An organizational Definition of Done is a minimum the Scrum Team may only strengthen
- **S:** Classifying a proposed change as an addition or a weakening
- **A:** Defending a floor the team finds inconvenient

### Task 1.4 - Analyze a Sprint in which the Sprint Goal was met and the scope selected at Sprint Planning was not all delivered

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `commitment-vs-forecast`, `sprint-backlog-as-plan`, `sprint-outcome-interpretation` |

- **K:** The Sprint Backlog is a plan by and for the Developers; the Sprint Goal is the commitment
- **S:** Separating a planning signal from a delivery failure
- **A:** Resisting the reflex to treat undelivered scope as failure

### Task 1.5 - Diagnose a self-management decision that conflicts with an organizational constraint

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `organizational-constraint`, `self-management`, `self-management-boundary` |

- **K:** The Scrum Team decides who does what, when and how, and does not rewrite standards the organization owns
- **S:** Locating the boundary in a live decision
- **A:** Declining to expand the team's authority in order to keep the peace

### Task 1.6 - Analyze pressure to cancel a Sprint while the Sprint Goal remains attainable

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `product-owner-authority`, `sprint-cancellation`, `sprint-goal-obsolescence` |

- **K:** Only the Product Owner may cancel a Sprint, and a Sprint is cancelled when its Sprint Goal becomes obsolete
- **S:** Assessing obsolescence against changed conditions
- **A:** Holding the distinction between inconvenient and obsolete

### Task 1.7 - Determine whether an item incomplete at Sprint end is a Definition of Done failure or a forecasting failure

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `done-failure`, `forecasting-failure`, `undone-work-disposition` |

- **K:** Work not meeting the Definition of Done is not released and returns to the Product Backlog
- **S:** Attributing the cause from Sprint evidence
- **A:** Reporting a cause the team would rather not hear

### Task 1.8 - Diagnose divergence between the Developers' daily plan and the Sprint Backlog

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `artifact-currency`, `daily-plan-adjustment`, `sprint-backlog-ownership` |

- **K:** The Sprint Backlog is updated by the Developers throughout the Sprint; the Daily Scrum adjusts the plan toward the Sprint Goal
- **S:** Reading a divergence as a transparency, planning or engagement signal
- **A:** Treating an artifact gap as information rather than non-compliance

### Task 1.9 - Analyze a Retrospective improvement that would require the team to depart from Scrum

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `complementary-practice`, `retrospective-improvements`, `scrum-immutability` |

- **K:** Scrum's elements are immutable; implementing only parts of it yields something that is not Scrum
- **S:** Distinguishing a complementary practice from an omission of a Scrum element
- **A:** Refusing an improvement the team is enthusiastic about

---

# Domain D2 - Coaching a team performing Scrum and still failing (20%)

**Description.** Team-level dysfunction that passes every formal inspection: stance selection, dysfunction that survives compliance, and improvement that never lands.

**Tasks:** 9  |  **MCQ seats:** 10

## Tasks

### Task 2.1 - Select the Scrum Master's stance for a given team dysfunction

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `intervention-proportionality`, `scrum-master-services`, `stance-selection` |

- **K:** The services the Scrum Master renders to the team, the Product Owner and the organization
- **S:** Matching a stance to a dysfunction
- **A:** Withholding the stance that comes most naturally

### Task 2.2 - Diagnose why a Retrospective produces actions that are never completed

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `improvement-ownership`, `retrospective-follow-through`, `sprint-retrospective` |

- **K:** The Retrospective's purpose and output; the most impactful improvement may be added to the Sprint Backlog
- **S:** Separating a capacity cause from an ownership cause from a safety cause
- **A:** Raising an uncomfortable cause in the team's presence

### Task 2.3 - Analyze events that run correctly and produce no change across multiple Sprints

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ceremonial-compliance`, `event-purpose`, `inspection-adaptation` |

- **K:** Each event enables inspection and adaptation; holding it correctly is necessary and not sufficient
- **S:** Separating form from function across several Sprints
- **A:** Questioning compliance that looks like health

### Task 2.4 - Determine whether a self-managing team's decision should be allowed to run to its consequence

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `consequence-threshold`, `impediment-removal`, `self-management-development` |

- **K:** Impediment removal; coaching self-management; the Sprint as a container bounding risk to one Sprint
- **S:** Applying the Sprint Goal and usable Increment threshold to a foreseeable consequence
- **A:** Tolerating a foreseeable failure that does not cross the threshold

### Task 2.5 - Diagnose why a Daily Scrum meeting every formal requirement continues to function as a status report

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `daily-scrum`, `developer-owned-event`, `status-reporting-persistence` |

- **K:** The Daily Scrum is for the Developers; the 2020 Guide removed any required question structure
- **S:** Tracing persistence to attendance, safety, or expectation
- **A:** Removing oneself from the centre of an event

### Task 2.6 - Determine a proportionate response to a Developer consistently excluded from the Developers' planning

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `collective-accountability`, `developer-accountability`, `team-inclusion` |

- **K:** The Developers are accountable as one unit for creating a plan for the Sprint
- **S:** Scaling a response to the degree of exclusion
- **A:** Acting on a dynamic nobody has named aloud

### Task 2.7 - Analyze a team whose Sprint Goals are consistently a list of unrelated items

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `goal-fragmentation`, `sprint-goal-coherence`, `sprint-planning-topic-two` |

- **K:** The Sprint Goal is the single objective for the Sprint and creates coherence
- **S:** Tracing incoherence to planning, ordering or stakeholder pressure
- **A:** Naming a cause that lies outside the Developers

### Task 2.8 - Determine whether reduced delivery is an impediment, a capability gap, or a self-management failure

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `capability-gap`, `cause-discrimination`, `impediment` |

- **K:** The three causes and the distinct remedy each requires
- **S:** Classifying the operating cause from Sprint evidence
- **A:** Declining the most convenient explanation

### Task 2.9 - Determine how to coach a team that has adopted a practice that works and is not part of Scrum

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `element-displacement`, `practice-augmentation`, `purposeful-incompleteness` |

- **K:** Scrum is purposefully incomplete and may be wrapped in other practices; its own elements may not be omitted
- **S:** Testing whether the practice adds to or displaces a Scrum element
- **A:** Leaving a working practice alone

---

# Domain D3 - Serving the Product Owner and the organization without absorbing their accountabilities (17.5%)

**Description.** The boundary between the Scrum Master and everyone else: delegation without absorption, organizational impedance, and accountability exercised by the wrong party.

**Tasks:** 8  |  **MCQ seats:** 9

## Tasks

### Task 3.1 - Determine the Scrum Master's response when the Product Owner delegates Product Backlog ordering to the Scrum Master

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `accountability-non-transfer`, `delegation-vs-absorption`, `product-owner-accountability` |

- **K:** The Product Owner may have others do the ordering work but remains accountable
- **S:** Distinguishing helping from absorbing
- **A:** Declining useful work that blurs an accountability

### Task 3.2 - Analyze a situation in which a functional manager assigns work directly to Developers

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `management-interference`, `organizational-service`, `work-assignment-boundary` |

- **K:** The Developers decide who does what within the Sprint; the Scrum Master serves the organization in its Scrum adoption
- **S:** Reading whether the assignment is habit, structure or emergency
- **A:** Engaging authority above the team

### Task 3.3 - Diagnose which organizational structure is producing a specific empirical failure the Scrum Team cannot resolve

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `empiricism-prerequisites`, `organizational-diagnosis`, `structural-impediment` |

- **K:** The Scrum Master helps employees and stakeholders adopt an empirical approach
- **S:** Tracing a symptom inside the Sprint to a structure outside it
- **A:** Describing an organizational cause without indicting individuals

### Task 3.4 - Determine a proportionate intervention for an impediment lying outside the Scrum Team

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `escalation-proportionality`, `external-impediment`, `impediment-causation` |

- **K:** The Scrum Master causes the removal of impediments; causing is not necessarily removing
- **S:** Matching an intervention to cost, urgency and standing
- **A:** Escalating no further than necessary

### Task 3.5 - Analyze a Product Owner accountability being exercised by a committee

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `decision-diffusion`, `product-owner-singularity`, `stakeholder-influence` |

- **K:** The Product Owner is one person, not a committee; those wanting change persuade the Product Owner
- **S:** Identifying which decisions have diffused
- **A:** Raising an arrangement the organization finds comfortable

### Task 3.6 - Determine the Scrum Master's next move when the Product Owner is absent and the Developers are proceeding without ordering decisions

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `absence-handling`, `accountability-persistence`, `role-vacancy-pressure` |

- **K:** The Product Owner's accountability does not lapse in their absence; the Developers remain accountable for a plan
- **S:** Choosing between waiting, escalating and enabling a provisional decision
- **A:** Resisting the pull to fill the vacancy

### Task 3.7 - Diagnose a shared-product situation in which two teams maintain separate Product Backlogs

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `backlog-fragmentation`, `product-goal-singularity`, `single-product-backlog` |

- **K:** One product has one Product Backlog, one Product Goal and one Product Owner
- **S:** Tracing the split to organizational structure, tooling or Product Owner capacity
- **A:** Addressing the cause rather than merging the artifacts

### Task 3.8 - Determine the Scrum Master's response when one team on a shared product loses Product Owner engagement

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `cross-team-equity`, `po-capacity`, `shared-product-ownership` |

- **K:** The same Product Owner serves the product across teams and the accountability is not divisible
- **S:** Selecting between capacity, prioritisation and escalation responses
- **A:** Raising a fairness issue between teams

---

# Domain D4 - Empiricism under distortion (20%)

**Description.** Whether the team can still see the truth: metrics decoupled from reality, inspection that changes nothing, and commitments a team has stopped measuring against.

**Tasks:** 9  |  **MCQ seats:** 10

## Tasks

### Task 4.1 - Diagnose a Sprint Review that no longer changes the Product Backlog

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `backlog-adaptation`, `review-as-presentation`, `sprint-review` |

- **K:** The Sprint Review is a working session where the Product Backlog may be adjusted; it is not a presentation
- **S:** Distinguishing a demonstration from an inspection
- **A:** Telling stakeholders the event is not working

### Task 4.2 - Analyze metrics reported to management that no longer describe the team's actual progress

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `decision-quality`, `metric-decoupling`, `transparency` |

- **K:** Low transparency leads to decisions that diminish value; Scrum prescribes no metric
- **S:** Testing whether a number still tracks the thing it names
- **A:** Withdrawing a number people rely on

### Task 4.3 - Determine whether an artifact's transparency has been compromised

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `artifact-commitments`, `artifact-integrity`, `transparency-test` |

- **K:** Each artifact carries a commitment providing the information against which progress is measured
- **S:** Applying the transparency test to a live artifact
- **A:** Admitting an artifact the team maintains is not transparent

### Task 4.4 - Diagnose a Product Backlog whose ordering no longer reflects value

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `backlog-ordering-rationale`, `ordering-antipatterns`, `value-drift` |

- **K:** The Product Owner orders items to best achieve goals and missions; the Guide does not define value
- **S:** Detecting ordering driven by age, politics or convenience
- **A:** Questioning an order the Product Owner defends

### Task 4.5 - Analyze a Definition of Done that is satisfied while the Increment is not usable

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `dod-insufficiency`, `increment-usability`, `standard-revision` |

- **K:** An Increment is a usable step toward the Product Goal, and work meeting the Definition of Done is an Increment
- **S:** Locating what the definition fails to require
- **A:** Reopening a standard the team believes it satisfies

### Task 4.6 - Diagnose inspection occurring too infrequently to permit adaptation

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `feedback-latency`, `inspection-frequency`, `risk-containment` |

- **K:** Inspection must be frequent and diligent; the Sprint bounds risk to one Sprint
- **S:** Relating feedback latency to the rate of change in the context
- **A:** Proposing a cadence change the organization resists

### Task 4.7 - Determine how a Scrum Master re-establishes a commitment a team has been operating without

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `commitment-artifact-pairing`, `commitment-reestablishment`, `product-goal` |

- **K:** Each artifact's commitment supplies its measure of progress, and where each commitment originates
- **S:** Sequencing re-establishment without stopping the Sprint
- **A:** Naming an absence the team has normalised

### Task 4.8 - Analyze a forecast that has become a performance target

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `estimation-pressure`, `forecast-semantics`, `target-distortion` |

- **K:** The Sprint Backlog is a plan by and for the Developers; the Guide names burn-downs as one of several practices that exist to forecast progress, and no occurrence of velocity or story points was found in it
- **S:** Detecting target-driven estimation
- **A:** Protecting a forecast from becoming a promise

### Task 4.9 - Diagnose stakeholder feedback that is collected and never acted upon

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `adaptation-failure`, `feedback-loop-break`, `stakeholder-collaboration` |

- **K:** Sprint Review attendees collaborate on what to do next; adaptation must follow inspection
- **S:** Locating the break between hearing and adapting
- **A:** Confronting a pattern that keeps stakeholders comfortable

---

# Domain D5 - Scrum Master judgment when AI is inside the work system (22.5%)

**Description.** Who is accountable when part of the work was not done by a person. Not AI literacy and not organizational AI governance: the object is the Scrum Team's empiricism, events and accountabilities.

**Tasks:** 9  |  **MCQ seats:** 11

## Tasks

### Task 5.1 - Determine what the Definition of Done must cover when implementation is AI-generated

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `dod-for-generated-work`, `provenance-in-done`, `quality-measures` |

- **K:** The Definition of Done states the quality measures required for the product and may only be strengthened above an organizational floor
- **S:** Identifying the quality measure the existing definition does not reach
- **A:** Strengthening a standard against delivery pressure

### Task 5.2 - Diagnose a Sprint Review at which the Increment can no longer be meaningfully inspected within the event

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `increment-volume`, `inspection-capacity`, `review-degradation` |

- **K:** The Sprint Review inspects the outcome and the Increment must be usable
- **S:** Separating a volume problem from a preparation problem
- **A:** Proposing that the team produce less

### Task 5.3 - Analyze accountability for a defect in AI-authored work the Developers accepted

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `acceptance-decision`, `developer-accountability-for-generated-work`, `tool-non-accountability` |

- **K:** The Developers are accountable for a usable Increment each Sprint; Scrum accountabilities are held by people
- **S:** Tracing the acceptance decision
- **A:** Refusing the tool as an explanation

### Task 5.4 - Determine the Scrum Master's response when model-produced estimates are read by management as commitments

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `commitment-misattribution`, `false-precision`, `generated-estimates` |

- **K:** The Sprint Backlog is a plan by and for the Developers and the Sprint Goal is the commitment, independent of what produced the numbers
- **S:** Choosing between correcting the reading and removing the artifact
- **A:** Contradicting a number that looks objective

### Task 5.5 - Diagnose a Retrospective whose inputs are model-summarised and whose actions nobody owns

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `action-ownership`, `retrospective-participation`, `summarisation-displacement` |

- **K:** The Retrospective is the Scrum Team inspecting itself; ownership follows from participation
- **S:** Connecting absent ownership to displaced participation
- **A:** Giving up a convenience the team likes

### Task 5.6 - Analyze a decline in the Developers' ability to meet the Definition of Done without generation

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `capability-erosion`, `generation-dependence`, `quality-adherence` |

- **K:** The Developers instil quality by adhering to the Definition of Done and are accountable for a usable Increment every Sprint
- **S:** Distinguishing capability erosion from tooling dependence from staffing change
- **A:** Raising a competence trend while output looks healthy

### Task 5.7 - Analyze rising throughput accompanied by falling Increment usability

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `increment-standard`, `throughput-usability-tradeoff`, `volume-quality-inversion` |

- **K:** Usability is the Increment's standard; volume is not a Scrum measure
- **S:** Relating the two movements to a single cause
- **A:** Raising a decline while output is being celebrated

### Task 5.8 - Diagnose transparency loss when work is produced faster than the team can inspect it

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `empiricism-pillars`, `production-inspection-mismatch`, `transparency-erosion` |

- **K:** Empiricism rests on transparency, inspection and adaptation; inspection without transparency is misleading
- **S:** Identifying which pillar failed first
- **A:** Slowing a team that feels productive

### Task 5.9 - Determine the Scrum Master's response when a Developer cannot explain work they submitted

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `coaching-response`, `comprehension-of-submitted-work`, `quality-adherence` |

- **K:** The Developers are accountable for the Increment and for instilling quality by adhering to the Definition of Done
- **S:** Choosing between a Definition of Done change, a coaching response and an escalation
- **A:** Raising a competence question without humiliating a person

---

*Generated 2026-09-09 by scripts/gen-jta-doc.mjs from certification SM-AI-II (a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46).*
