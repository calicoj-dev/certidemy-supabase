# SM-AI-I - Job-Task Analysis

> **GENERATED FROM THE DATABASE on 2026-07-23. Do not hand-edit.**
>
> Every fact below is rendered from the live schema by
> `scripts/gen-jta-doc.mjs`. To change anything here, change the database
> through a migration and regenerate - the git diff on this file is then the
> change record.
>
> Design rationale, sourcing, review history and reconciliation records are
> NOT here. They carry human judgment that no query can reconstruct, and live
> in the companion narrative document.

**Certification:** Scrum Master I — AI  
**Status:** available

---

## Exam facts

| Attribute | Value |
|-|-|
| Questions | 80 |
| Duration | 120 minutes |
| Passing score | 80% (64/80) |
| Format | Multiple choice (single answer), online |
| Bloom ceiling | 4 (Analyze) for MCQ; 5-6 reserved for simulation |
| Languages | English, es-419, pt-BR |

## Domain structure

| # | Domain | Weight | MCQ seats |
|-|-|-|-|
| D1 | Agile Foundations & Empirical Thinking | 12.5% | 10 |
| D2 | The Scrum Team & Accountabilities | 22.5% | 18 |
| D3 | Scrum Events | 25% | 20 |
| D4 | Scrum Artifacts & Commitments | 17.5% | 14 |
| D5 | Scrum Master in Practice & Organizational Context | 22.5% | 18 |
| **Total** | | **100%** | **80** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 1 (Remember) | 8 | 15.65% |
| 2 (Understand) | 16 | 30.5% |
| 3 (Apply) | 22 | 42.37% |
| 4 (Analyze) | 6 | 11.49% |

---

# Domain D1 - Agile Foundations & Empirical Thinking (12.5%)

**Description.** The why beneath Scrum: Agile values and principles, empirical process control, Scrum values, lean thinking, and complexity framing.

**Tasks:** 7  |  **MCQ seats:** 10

## Tasks

### Task 1.1 - Articulate the Agile Manifesto's four values and twelve principles

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `agile-principles`, `agile-values` |

- **K:** Manifesto text; 4 values; 12 principles; origin (Snowbird, 2001)
- **S:** Map a real situation to a specific principle
- **A:** Reading between the lines — recognizing when a behavior aligns or violates a value

### Task 1.2 - Apply the three pillars of empirical process control (Transparency, Inspection, Adaptation) to diagnose which pillar is broken

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `adaptation`, `empirical-process`, `inspection`, `transparency` |

- **K:** Definitions of all three pillars; their interdependence
- **S:** Diagnose which pillar is broken in a described scenario
- **A:** Comfort with iterative course-correction; intellectual honesty

### Task 1.3 - Identify the five Scrum Values in workplace behaviors

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `scrum-values` |

- **K:** Commitment, Courage, Focus, Openness, Respect
- **S:** Recognize which value is being lived (or violated) in a scenario
- **A:** Modeling values personally; calling them out when missing

### Task 1.4 - Distinguish complex problems suited to Scrum from problems suited to predictive approaches

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `complex-vs-complicated`, `cynefin-framework`, `empirical-vs-predictive` |

- **K:** Cynefin framework (simple / complicated / complex / chaotic); when waterfall makes sense
- **S:** Categorize a real problem accurately
- **A:** Resisting the "Scrum for everything" anti-pattern

### Task 1.5 - Explain lean thinking principles as they apply to Scrum

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `iterative-incremental`, `lean-thinking` |

- **K:** Small batches, flow, reducing waste, deferred commitment; Scrum's lean lineage
- **S:** Identify waste in a Scrum implementation
- **A:** Bias toward smaller/simpler

### Task 1.6 - Recognize when transparency is compromised and trace consequences

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `artifact-transparency`, `transparency` |

- **K:** What transparent artifacts look like; common ways teams hide work or progress
- **S:** Identify hidden information or inflated status reports
- **A:** Courage to surface uncomfortable truths

### Task 1.7 - Analyze how AI-accelerated output can threaten empiricism, and how the Scrum Master safeguards inspection and adaptation

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `empiricism-under-acceleration`, `sm-safeguards-inspection` |

- **K:** Empiricism rests on the team's ability to inspect work and adapt. When AI generates output faster than the team can inspect it, transparency and inspection degrade and adaptation lags. The Scrum Master protects the cadence of inspect-and-adapt rather than raw output.
- **S:** Trace how output velocity without inspection erodes the empirical pillars.
- **A:** Intervene to restore inspection and adaptation when automation outpaces them.

---

# Domain D2 - The Scrum Team & Accountabilities (22.5%)

**Description.** Composition, the three accountabilities, self-management, cross-functionality.

**Tasks:** 11  |  **MCQ seats:** 18

## Tasks

### Task 2.1 - Define the Scrum Team's composition and size constraints

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `scrum-team-composition`, `team-size` |

- **K:** One PO + one SM + Developers; typically ≤ 10 people; no sub-teams or hierarchies
- **S:** Apply the rule to a described team structure
- **A:** Comfort with small teams

### Task 2.2 - Explain the Scrum Master's accountability for the Scrum Team's effectiveness

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `sm-accountability-team-effectiveness` |

- **K:** "Effectiveness" is the SM's central accountability per the 2020 Guide
- **S:** Distinguish effectiveness work from project management work
- **A:** Outcome focus over output focus

### Task 2.3 - List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `sm-accountability-team-effectiveness`, `sm-serves-org`, `sm-serves-po`, `sm-serves-team` |

- **K:** The four ways SM serves the team, the four ways SM serves the PO, the four ways SM serves the org
- **S:** Identify which service is being performed in a scenario
- **A:** Service mindset

### Task 2.4 - Explain the Product Owner's accountability for maximizing product value

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `po-accountability`, `po-one-person`, `product-value` |

- **K:** PO is one person, not a committee; accountable for Product Backlog ordering, Product Goal, communication
- **S:** Recognize when a "Product Owner by committee" pattern emerges
- **A:** Respect for value-based decision making

### Task 2.5 - Explain the Developers' four accountabilities

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `developer-accountability` |

- **K:** Creating Sprint Backlog; instilling quality via DoD; adapting plan; holding each other accountable
- **S:** Recognize when developers are dodging accountability
- **A:** Peer accountability (not boss accountability)

### Task 2.6 - Apply "self-managing" to a described team scenario

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `self-managing`, `self-organizing-deprecated` |

- **K:** 2020 shift from "self-organizing" (who and how) to "self-managing" (who, how, what); deprecation note
- **S:** Identify when a team is being managed externally vs. self-managing
- **A:** Releasing control as a Scrum Master

### Task 2.7 - Identify accountability boundary violations

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `accountability-boundaries`, `sm-vs-pm-anti-pattern` |

- **K:** Common violations: SM ordering backlog, PO assigning tasks, developers ignoring DoD, manager attending Daily Scrum
- **S:** Diagnose the boundary violation and prescribe the correction
- **A:** Diplomatic but firm

### Task 2.8 - Explain cross-functionality as a property of the whole Scrum Team

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `cross-functional`, `t-shaped-skills` |

- **K:** Cross-functional means the team has all skills needed to deliver value; not every individual is full-stack
- **S:** Recognize when an apparent skills gap is really a team-formation problem
- **A:** Hiring/staffing for whole-team skill coverage

### Task 2.9 - Recognize that "Developer" applies to any team member, not just software engineers

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `developer-broad-definition` |

- **K:** 2020 Guide explicitly removed software-specific language
- **S:** Apply Scrum outside software domains
- **A:** Inclusive framing

### Task 2.10 - Explain how AI agents participate in a Scrum Team as tools, and which accountabilities must remain human

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-as-tool-not-team-member`, `human-held-accountabilities` |

- **K:** AI agents are tools the Scrum Team uses, not members of it. The Scrum Guide's accountabilities — Product Owner, Scrum Master, Developers — are held by people; AI holds none of them.
- **S:** Separate tool-use from accountability; articulate why AI cannot own the Sprint Goal, the Definition of Done, or the team's self-management.
- **A:** Frame AI's role for a team or stakeholder without diluting human accountability.

### Task 2.11 - Distinguish work a team may delegate to AI from the accountabilities it must retain

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `delegable-ai-work`, `retained-accountabilities` |

- **K:** Teams may delegate drafting, generation, analysis, and summarization to AI, always subject to human inspection. They may not delegate commitment to the Sprint Goal, the Definition of Done, self-management, facilitation of Scrum events, or accountability for the Increment.
- **S:** Classify activities as safely delegable or necessarily retained.
- **A:** Guide a team to use AI for leverage without surrendering its accountabilities.

---

# Domain D3 - Scrum Events (25%)

**Description.** The five Scrum events: purpose, timeboxes, attendees, outputs, anti-patterns.

**Tasks:** 11  |  **MCQ seats:** 20

## Tasks

### Task 3.1 - State the maximum timebox for each event

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `timeboxes` |

- **K:** Sprint ≤ 1 month; Sprint Planning ≤ 8h; Daily Scrum 15m; Sprint Review ≤ 4h; Sprint Retrospective ≤ 3h
- **S:** Apply proportional rule: shorter Sprints → proportionally shorter Planning/Review/Retro
- **A:** Timebox discipline

### Task 3.2 - Explain the Sprint as the container for all other events

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `sprint`, `sprint-container` |

- **K:** Sprints are fixed-length, no gaps between Sprints, all other events occur within
- **S:** Identify violations (gaps between Sprints, extending a Sprint)
- **A:** Cadence respect

### Task 3.3 - Recall the three topics of Sprint Planning (Why, What, How)

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `sprint-goal-crafting`, `sprint-planning`, `sprint-planning-topics` |

- **K:** Why → Sprint Goal (NEW emphasis in 2020); What → Backlog selection; How → plan for delivery
- **S:** Name the three topics and what each answers.
- **A:** Holding space for purpose, not just task-listing

### Task 3.4 - Explain the Daily Scrum's purpose and rules

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `daily-scrum`, `daily-scrum-purpose` |

- **K:** 15-minute timebox; Developers only; inspect progress toward Sprint Goal; produce next-day plan
- **S:** Reject anti-patterns (status report to manager, SM-led standup)
- **A:** Stepping back to let team own it

### Task 3.5 - Describe the Sprint Review as a working session, not a status report

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `sprint-review`, `sprint-review-vs-demo` |

- **K:** Inspect Increment with stakeholders; adapt Product Backlog; not a demo; not a sign-off
- **S:** Run a Review that produces backlog changes
- **A:** Inviting genuine feedback, not seeking approval

### Task 3.6 - Facilitate the Sprint Retrospective with a focus on team process

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `retrospective-actions`, `retrospective-format`, `sprint-retrospective` |

- **K:** Inspect Scrum Team itself; identify improvements; produce actionable plan; often add improvement to next Sprint
- **S:** Run formats (Liked/Learned/Lacked, Start/Stop/Continue, 4Ls, sailboat)
- **A:** Psychological safety; vulnerability-led leadership

### Task 3.7 - Identify when a Sprint can be canceled and by whom

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `sprint-cancellation` |

- **K:** Only the PO can cancel; happens when Sprint Goal becomes obsolete; rare and traumatic
- **S:** Recognize when cancellation is warranted vs. overreaction
- **A:** Restraint with the cancellation lever

### Task 3.8 - Apply timebox rules to scenarios

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `timebox-violations`, `timeboxes` |

- **K:** Timeboxes are maxima, not targets; events can end early; must not exceed
- **S:** Calculate proportional timeboxes for non-standard Sprint lengths
- **A:** Comfort with "finished early — let's stop"

### Task 3.9 - Select a Sprint Goal that is coherent and outcome-focused, and distinguish it from the Product Backlog items selected for the Sprint

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `goal-vs-items`, `sprint-goal` |

- **K:** Sprint Goal is the singular objective; selected PBIs are means; PBIs can change while Goal remains
- **S:** Write a Sprint Goal that's coherent and outcome-focused
- **A:** Goal-orientation over task-orientation

### Task 3.10 - Recognize event anti-patterns

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `daily-scrum-status-report`, `event-anti-patterns`, `retro-blame-game`, `review-as-demo` |

- **K:** Daily Scrum as status to manager; Review as one-way demo; Retro as blame session; Planning that skips Why
- **S:** Diagnose the anti-pattern and prescribe the correction
- **A:** Naming uncomfortable patterns kindly but clearly

### Task 3.11 - Use AI-generated signal as input to inspection without ceding the team's decision-making

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-signal-informs-inspection`, `metrics-inform-not-decide` |

- **K:** AI can surface flow metrics, impediment patterns, and defect trends that feed inspection — for example, in the Sprint Retrospective — but the team interprets the signal and decides. Metrics inform decisions; they do not make them.
- **S:** Bring AI-derived signal into Scrum events while keeping interpretation and decisions with the team.
- **A:** Use AI analysis to enrich, not replace, the team's inspection and adaptation.

---

# Domain D4 - Scrum Artifacts & Commitments (17.5%)

**Description.** The three artifacts plus their commitments (Product Goal, Sprint Goal, Definition of Done), refinement, INVEST, burndowns.

**Tasks:** 13  |  **MCQ seats:** 14

## Tasks

### Task 4.1 - Identify each artifact's commitment

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `commitments`, `definition-of-done`, `product-goal`, `sprint-goal` |

- **K:** Product Backlog → Product Goal; Sprint Backlog → Sprint Goal; Increment → Definition of Done
- **S:** Map artifact to its commitment instantly
- **A:** Internalizing the 2020 commitments addition

### Task 4.2 - Explain the Product Backlog as an emergent, ordered list owned by the PO

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `product-backlog`, `product-backlog-ordering`, `product-backlog-ownership` |

- **K:** Single source of work; ordered (not just prioritized); never "complete"
- **S:** Identify when ordering logic is broken
- **A:** Value-based prioritization

### Task 4.3 - Explain that the Sprint Backlog is created by and for the Developers

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `sprint-backlog`, `sprint-backlog-ownership` |

- **K:** Sprint Backlog = Sprint Goal + selected PBIs + plan; updated daily by Developers
- **S:** Recognize when a Sprint Backlog is being managed externally
- **A:** Hands-off from the SM

### Task 4.4 - Recall the Increment and the Definition of Done

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `definition-of-done`, `dod-creation`, `increment` |

- **K:** Increment must meet DoD; multiple Increments per Sprint allowed; DoD created by the Scrum Team (2020 change)
- **S:** State what an Increment is and what the Definition of Done is.
- **A:** Quality bar discipline

### Task 4.5 - Apply the DoD to determine completion

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `dod-application` |

- **K:** Anything not meeting DoD is not an Increment, returns to Product Backlog
- **S:** Distinguish "done" from "done-done" from "almost done"
- **A:** Discomfort tolerance — saying "not done"

### Task 4.6 - Explain the Product Goal as the long-term objective

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `product-goal`, `product-goal-relationship-to-sprint-goal` |

- **K:** Product Goal lives in the Product Backlog; each Sprint brings the product closer; only one Product Goal at a time
- **S:** Recognize when sprints are drifting from the Product Goal
- **A:** Long-arc thinking

### Task 4.7 - Distinguish artifact transparency from artifact perfection

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `artifact-transparency`, `imperfect-but-transparent` |

- **K:** Artifacts can be partial, rough, or evolving — and still transparent
- **S:** Coach a team out of "we can't show stakeholders until it's polished"
- **A:** Vulnerability with rough work

### Task 4.8 - Explain refinement as an ongoing activity (NOT a formal event)

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `refinement-as-activity`, `refinement-not-event` |

- **K:** Refinement breaks PBIs into smaller items, adds detail, estimates; NOT an event
- **S:** Avoid the anti-pattern of "Refinement Meeting" treated as a sixth event
- **A:** Comfort with embedded activities

### Task 4.9 - Interpret burndown charts and velocity metrics

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `burndown-charts`, `metrics-not-targets`, `velocity` |

- **K:** Burndowns show remaining work over time; velocity = points completed per Sprint; both are forecasting tools
- **S:** Read a burndown and identify what's happening (scope creep, late completion)
- **A:** Resisting "velocity as productivity score"

### Task 4.10 - Apply INVEST criteria to Product Backlog Items

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `invest-criteria`, `pbi-quality` |

- **K:** INVEST = Independent, Negotiable, Valuable, Estimable, Small, Testable
- **S:** Identify which letter a poor PBI fails on
- **A:** Constructive editing of others' work

### Task 4.11 - Apply the Definition of Done and artifact transparency to work generated or assisted by AI

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `dod-applies-to-ai-output`, `increment-transparency-ai` |

- **K:** The Definition of Done applies equally to AI-assisted work. An Increment is only Done when it meets the DoD and is transparent and inspectable, regardless of whether a person or an AI produced the draft.
- **S:** Assess AI-produced output against the Definition of Done before it becomes part of the Increment.
- **A:** Coach Developers to treat AI output as a draft subject to the DoD, never as automatically Done.

### Task 4.13 - Apply the Definition of Done to determine whether work is releasable

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `definition-of-done`, `dod-creation`, `increment` |

- **K:** The DoD as the shared, binding quality bar; that an Increment is only an Increment when it meets the DoD; that partial completion is not Done; that the DoD may tighten but not loosen mid-Sprint.
- **S:** Given a described piece of work and a DoD, determine whether it is Done - and identify what remains if it is not.
- **A:** Quality-bar discipline; refusing "done except for" as an answer.

### Task 4.14 - Diagnose why a team that runs the events correctly is still not adapting

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `adaptation`, `coaching-restore-empiricism`, `empirical-process`, `inspection`, `retrospective-actions` |

- **K:** Empiricism requires that inspection actually LEAD TO adaptation. A team can hold every event, keep every artifact current, and still be stagnant - because inspection is happening without consequence. The symptoms are quiet rather than dramatic: retrospective actions agreed and never done; the same impediment surfacing for several Sprints; a Sprint Goal missed repeatedly for reasons never examined; no experiment ever actually run; artifacts current but nobody acting on what they reveal. The failure is in the ADAPT half of inspect-and-adapt, and it is invisible to anyone auditing the ceremonies.
- **S:** Reason from ambiguous symptoms to the underlying cause: distinguish a team that cannot see its problems (a transparency failure) from a team that sees them and does not act (an adaptation failure) from a team that acts and is blocked (an impediment). Each has a different remedy, and prescribing the wrong one wastes Sprints.
- **A:** The judgment to look past correct ceremony to absent outcome, and to say so.

---

# Domain D5 - Scrum Master in Practice & Organizational Context (22.5%)

**Description.** Facilitation, coaching, impediment removal, psychological safety, organizational adoption, scaling basics, terminology drift.

**Tasks:** 11  |  **MCQ seats:** 18

## Tasks

### Task 5.1 - Identify impediments and choose removal strategies

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `impediment-management`, `impediment-types` |

- **K:** Internal vs. external impediments; SM "causes the removal" — not always personally; escalation paths
- **S:** Categorize impediment and pick the right response
- **A:** Persistence; comfort with bureaucratic friction

### Task 5.2 - Distinguish impediments from problems the team should resolve themselves

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `impediment-vs-problem`, `team-ownership` |

- **K:** Self-managing teams should handle their own problems; SM intervention undermines self-management
- **S:** Resist the urge to fix everything
- **A:** Restraint; coaching reflex over fixing reflex

### Task 5.3 - Coach a Scrum Team toward greater self-management

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `coaching-self-management`, `coaching-stances` |

- **K:** Four coaching stances (teach / mentor / coach / facilitate); powerful questions
- **S:** Pick the right stance for a moment; ask powerful questions
- **A:** Patience; comfort with silence

### Task 5.4 - Apply servant leadership behaviors

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `servant-leadership`, `servant-vs-true-leader`, `true-leadership` |

- **K:** Servant leadership concept (Greenleaf, 1970); 2020 Guide language shift to "true leaders who serve"
- **S:** Recognize servant-leadership behaviors
- **A:** Influence without authority; ego subordination

### Task 5.5 - Recognize psychological safety and how SM behavior affects it

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `psychological-safety`, `team-trust` |

- **K:** Amy Edmondson's research; signs of low safety (silence, blame, defensiveness)
- **S:** Diagnose safety issues; nudge behavior to rebuild
- **A:** Emotional intelligence; self-awareness

### Task 5.6 - Coach the Product Owner

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `coaching-po`, `po-coaching-techniques` |

- **K:** PO common struggles: too far/close to team, "by committee", poor Product Goal articulation
- **S:** Coach without taking ownership
- **A:** Respect for PO's authority

### Task 5.7 - Translate between legacy training terminology and the 2020 Scrum Guide

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ceremonies-vs-events-terminology`, `self-organizing-vs-self-managing`, `servant-vs-true-leader` |

- **K:** Where legacy training materials use legacy terms ("ceremonies," "self-organizing," "servant-leader")
- **S:** Translate between the two on the exam
- **A:** Patience with terminology lag

### Task 5.8 - Coach the organization on Scrum adoption

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `org-coaching`, `org-impediments`, `scrum-adoption` |

- **K:** Common organizational impediments; SM "leads, trains, and coaches" the organization
- **S:** Pick battles; persuade upward without burning credibility
- **A:** Political savvy; long-game patience

### Task 5.9 - Recognize scaling anti-patterns at a foundational level

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Low |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `scaling-frameworks-overview`, `scaling-multiple-teams`, `single-product-owner-rule` |

- **K:** Multiple Scrum Teams on one product share one Product Backlog, one PO, one Product Goal
- **S:** Recognize anti-patterns ("two teams, two backlogs, same product")
- **A:** Knowing what you don't know about scaling

### Task 5.10 - Identify the new impediments that arise in AI-augmented teams

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-review-bottleneck`, `automation-over-trust`, `eroded-shared-understanding-ai` |

- **K:** AI augmentation introduces distinct impediments: review bottlenecks when generated output exceeds the team's capacity to inspect it, over-trust that lets unverified AI output enter the Increment, and erosion of shared understanding when members rely on private AI assistance.
- **S:** Recognize these impediment patterns in a team's behavior and flow.
- **A:** Surface and categorize AI-related impediments so they can be removed.

### Task 5.11 - Diagnose an AI-augmentation anti-pattern and coach the team back toward empiricism and self-management

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 5 (Evaluate) |
| Exam scope | No |
| Simulation candidate | Yes |
| Concept slugs | `ai-augmentation-anti-patterns`, `coaching-restore-empiricism` |

- **K:** Common anti-patterns include shipping unverified AI output, treating velocity gains as the objective, and individuals deferring judgment to AI. Effective coaching restores inspection, shared understanding, and human accountability.
- **S:** Evaluate a complex, realistic scenario and choose an intervention that restores empiricism.
- **A:** Coach a team through an AI-augmentation dysfunction without abandoning Scrum's principles.

---

*Generated 2026-07-23 by scripts/gen-jta-doc.mjs from certification SM-AI-I (11111111-1111-1111-1111-111111111111).*
