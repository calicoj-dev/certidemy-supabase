# SD-AI-I - Job-Task Analysis

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

**Certification:** Scrum Developer I — AI  
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
| D1 | Agile Foundations & Empirical Engineering in the AI Era | 12.5% | 10 |
| D2 | The Scrum Framework from the Developers' Seat | 15% | 12 |
| D3 | Engineering Craft, Quality & the Definition of Done | 20% | 16 |
| D4 | AI-Augmented Implementation | 30% | 24 |
| D5 | Collaboration, Professionalism & Continuous Improvement | 22.5% | 18 |
| **Total** | | **100%** | **80** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 1 (Remember) | 1 | 1.79% |
| 2 (Understand) | 8 | 18.26% |
| 3 (Apply) | 32 | 70.96% |
| 4 (Analyze) | 4 | 9% |

---

# Domain D1 - Agile Foundations & Empirical Engineering in the AI Era (12.5%)

**Description.** The why beneath a Developer's work: Agile values and principles from a builder's perspective, the three pillars of empiricism applied to engineering, the five Scrum values as Developers live them, lean/flow thinking, and who the Developers are in the 2020 Guide. The AI-era twist: when generation is cheap and verification is expensive, empiricism is why you inspect AI output instead of trusting it.

**Tasks:** 7  |  **MCQ seats:** 10

## Tasks

### Task 1.1 - Articulate the Agile Manifesto's values and principles from a Developer's perspective

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `agile-principles`, `agile-values`, `working-software-over-docs` |

- **K:** The 4 values and 12 principles; the primacy of working software and technical excellence.
- **S:** Map a delivery decision to the principle it serves or violates.
- **A:** Craftsmanship; pride in working, maintainable output.

### Task 1.2 - Apply the three pillars of empiricism to engineering work and to AI-generated output

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `adaptation`, `empirical-process`, `inspection`, `transparency`, `verify-ai-output` |

- **K:** Transparency, Inspection, Adaptation and their interdependence; AI-generated code is unverified work until inspected.
- **S:** Identify which pillar is broken when a team merges AI output it never read.
- **A:** Intellectual honesty; trust-but-verify toward machine output.

### Task 1.3 - Live the five Scrum Values as a Developer

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `courage-and-quality`, `openness-about-uncertainty`, `scrum-values` |

- **K:** Commitment, Courage, Focus, Openness, Respect applied to building; Courage to reject plausible-but-wrong output.
- **S:** Recognize which value is lived or violated in a build scenario.
- **A:** Modeling the values under deadline pressure.

### Task 1.4 - Explain lean and flow thinking, and how AI shifts the bottleneck from authoring to reviewing

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-shifts-the-bottleneck`, `flow-and-wip-limits`, `lean-thinking` |

- **K:** Small batches, flow, limiting WIP; when code is cheap to generate, the constraint moves to review and verification.
- **S:** Spot when more AI output is making flow worse.
- **A:** Systems thinking over local optimization.

### Task 1.5 - Classify who is and is not a Developer under the 2020 Scrum Guide

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `cross-functional-team`, `developers-definition`, `whole-team-skills` |

- **K:** Developers are the team members who create any aspect of a usable Increment each Sprint; the 2020 Guide removed the Development Team sub-team.
- **S:** Correctly classify who is and isn't a Developer in a scenario.
- **A:** Inclusivity toward all build skills (test, design, ops, data).

### Task 1.6 - Match AI assistance to the complexity of the work

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `complexity-and-ai-fit`, `cynefin-lite`, `when-to-trust-ai` |

- **K:** Where AI generation is high-leverage vs where novel/complex/ambiguous work needs human-led design first.
- **S:** Categorize a piece of work and choose an AI-use posture accordingly.
- **A:** Resisting AI-for-everything; judgment over reflex.

### Task 1.9 - Recall who the Developers are under the 2020 Scrum Guide

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `cross-functional-team`, `developers-definition`, `whole-team-skills` |

- **K:** A Developer is anyone on the Scrum Team doing the work of creating a usable Increment - testers, designers, analysts, writers, operations, not only programmers. The 2020 Guide removed "Development Team" as a separate sub-team; there is one Scrum Team with three accountabilities.
- **S:** State who counts as a Developer and who does not.
- **A:** Respect for the whole craft, not just the coding part of it.

---

# Domain D2 - The Scrum Framework from the Developers' Seat (15%)

**Description.** The Scrum framework as Developers experience and own it: their accountabilities, Sprint Planning's how, the Sprint Backlog as a living forecast, the Daily Scrum as the Developers' event, and their part in Review and Retrospective. AI-era: AI as input to estimation, never a replacement for the Developers' self-management.

**Tasks:** 8  |  **MCQ seats:** 12

## Tasks

### Task 2.1 - Describe the Developers' accountabilities

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `daily-adaptation`, `developers-accountabilities`, `instill-quality`, `peer-accountability` |

- **K:** Create the Sprint plan; instill quality by adhering to a DoD; adapt the plan daily toward the Sprint Goal; hold each other accountable.
- **S:** Identify which accountability a behavior fulfills or neglects.
- **A:** Ownership of outcomes, not just tasks.

### Task 2.2 - Turn the Sprint Goal and selected items into a Sprint Backlog (the how)

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `sprint-backlog-creation`, `sprint-goal`, `sprint-planning-how` |

- **K:** Sprint Planning topics (why/what/how); Developers decompose selected PBIs into an actionable plan; the Sprint Goal is the single objective.
- **S:** Produce a workable plan that serves the Sprint Goal.
- **A:** Realistic forecasting over heroic over-commitment.

### Task 2.3 - Own and maintain the Sprint Backlog as a living forecast

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `daily-backlog-update`, `living-forecast`, `sprint-backlog-ownership` |

- **K:** The Sprint Backlog is by the Developers, for the Developers; a forecast that updates as more is learned; not a fixed contract.
- **S:** Keep the plan transparent and current through the Sprint.
- **A:** Comfort with change within the Sprint.

### Task 2.4 - Run the Daily Scrum as the Developers' event

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `daily-scrum`, `developers-event`, `replanning-toward-goal` |

- **K:** 15-minute timebox; for and by the Developers; inspect progress toward the Sprint Goal and adapt the plan — not a status report.
- **S:** Keep the event focused on the Goal, not individual task accounting.
- **A:** Self-management over reporting-up.

### Task 2.5 - Explain the Developers' part in the Sprint Review: showing a Done Increment and absorbing feedback

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `done-increment-demo`, `sprint-review-participation`, `stakeholder-feedback` |

- **K:** The Review inspects the Increment and adapts the Product Backlog; only Done work is shown; a working session, not a phase-gate.
- **S:** Demonstrate working software and absorb feedback without defensiveness.
- **A:** Openness to inspection of one's work.

### Task 2.6 - Engage in the Sprint Retrospective and commit to improvement

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `improvement-commitment`, `sprint-retrospective`, `team-process-inspection` |

- **K:** Inspect how the last Sprint went (people, relationships, process, tools, DoD); identify the most helpful improvements.
- **S:** Move from complaint to a concrete, owned improvement.
- **A:** Continuous-improvement habit; candor with kindness.

### Task 2.7 - Apply estimation and forecasting, treating AI estimates as input not authority

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-assisted-estimation`, `forecasting-throughput`, `relative-estimation` |

- **K:** Relative sizing, story points, throughput as forecasting aids; AI can suggest estimates but the Developers own the forecast.
- **S:** Use an AI estimate as a conversation starter, then adjust with team knowledge.
- **A:** Skepticism toward false precision, human or machine.

### Task 2.8 - Self-manage: decide who does what, when, and how

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `no-externally-assigned-tasks`, `resist-command-control`, `self-management` |

- **K:** The Developers internally decide how to turn the Backlog into Increments; no one tells them how; self-management is undermined by re-imposed task assignment.
- **S:** Distinguish legitimate coordination from command-and-control creep.
- **A:** Collective ownership; professional autonomy.

---

# Domain D3 - Engineering Craft, Quality & the Definition of Done (20%)

**Description.** The enduring technical craft that makes Done real: the Definition of Done as a quality commitment, done vs looks-done, test-first development, CI/CD, technical debt, refactoring, version-control discipline, code review, and pairing/mobbing. AI-era woven throughout: the DoD applies equally to AI-generated work, and unreviewed AI output is a fast path to technical debt.

**Tasks:** 10  |  **MCQ seats:** 16

## Tasks

### Task 3.1 - Apply the Definition of Done as the quality bar for every Increment, including AI output

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `definition-of-done`, `dod-applies-to-ai-output`, `quality-commitment` |

- **K:** The DoD makes Increment quality transparent; work isn't Done until it meets the DoD, applied identically whether a human or AI produced the code.
- **S:** Judge whether an Increment, including AI-generated parts, meets the DoD.
- **A:** A non-negotiable quality bar.

### Task 3.2 - Distinguish Done from looks-done

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `done-vs-looks-done`, `hidden-integration-cost`, `undone-work` |

- **K:** Undone work (untested, unintegrated, undocumented) accrues as invisible debt; it-runs-on-my-machine is not Done.
- **S:** Detect undone work hiding behind a demo.
- **A:** Honesty about completeness.

### Task 3.3 - Practice test-first / test-driven development

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `red-green-refactor`, `test-driven-development`, `test-first` |

- **K:** Red-green-refactor; tests as executable specification and a guardrail for change (and for verifying AI-generated code).
- **S:** Drive a small change test-first.
- **A:** Discipline; valuing fast feedback over speed-to-merge.

### Task 3.4 - Keep the Increment releasable with continuous integration and delivery

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `continuous-delivery`, `continuous-integration`, `releasable-increment` |

- **K:** Integrate frequently; a green pipeline as a precondition of Done; the Increment should be usable/releasable at Sprint end or sooner.
- **S:** Diagnose a broken-flow scenario (long-lived branches, red main).
- **A:** Collective responsibility for the build.

### Task 3.5 - Surface and pay down technical debt, including AI-generated debt

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-generated-debt`, `surface-debt-transparency`, `technical-debt` |

- **K:** Technical debt is a transparency problem before it's a code problem; high-volume AI generation without review accelerates it.
- **S:** Name debt, make it visible, and negotiate paydown.
- **A:** Long-term stewardship over short-term throughput.

### Task 3.6 - Refactor safely toward maintainability

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-assisted-refactoring`, `maintainability`, `refactoring` |

- **K:** Behavior-preserving change under test coverage; AI can propose refactorings but the tests and Developer judgment certify safety.
- **S:** Refactor without changing behavior; verify with tests.
- **A:** Care for the next reader of the code.

### Task 3.7 - Apply version-control discipline to structure work into reviewable units

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `branching-tradeoffs`, `small-reviewable-commits`, `version-control-discipline` |

- **K:** Small, reviewable commits; trunk-based vs feature-branch trade-offs; meaningful history; AI-generated changes still need reviewable diffs.
- **S:** Structure work into reviewable units.
- **A:** Consideration for reviewers.

### Task 3.8 - Conduct effective code review as a team practice

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `code-review`, `review-feedback-craft`, `shared-code-ownership` |

- **K:** Review is a collaboration practice: it spreads ownership, transfers knowledge, and improves quality through actionable feedback.
- **S:** Give specific, kind, actionable review feedback; review for correctness and readability, not style nits.
- **A:** Collective ownership; ego-free critique.

### Task 3.9 - Collaborate through pairing and mobbing; situate AI pair-programming within them

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-pair-programming`, `mob-programming`, `pair-programming` |

- **K:** Pairing/mobbing for quality and knowledge-sharing; an AI assistant is a powerful pair partner but not a substitute for human pairing.
- **S:** Choose human pairing vs AI assistance vs both for a given task.
- **A:** Valuing shared understanding, not just output.

### Task 3.10 - Build quality in continuously (shift-left), including AI-generated tests

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ai-generated-tests-quality`, `built-in-quality`, `shift-left-testing` |

- **K:** Quality must be built in, not inspected in at the end; AI can expand test volume, but tests from the same model that wrote the code may share its blind spots.
- **S:** Evaluate whether a test suite actually constrains behavior.
- **A:** Distrust of coverage-as-vanity-metric.

---

# Domain D4 - AI-Augmented Implementation (30%)

**Description.** The signature domain: implementing an acceptance-criteria-bearing specification with AI as a teammate, while the Developer remains accountable for verification, security, licensing, and the Definition of Done. The Developer's half of Spec-Driven Development (it pairs with SPO-AI-I's D4): implementation prompting, critical review of AI output, the generate-then-verify loop, AI test generation, agentic workflows, AI-specific risks, when not to use AI, provenance, and the human-accountability boundary.

**Tasks:** 12  |  **MCQ seats:** 24

## Tasks

### Task 4.1 - Implement against a PBI as an executable specification, with AI assistance

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `acceptance-criteria-driven`, `pbi-as-executable-spec`, `spec-driven-development` |

- **K:** A PBI with clear acceptance criteria is a specification an AI agent can execute against; the acceptance criteria are the contract the implementation must satisfy.
- **S:** Drive an implementation from acceptance criteria, with AI generating candidate code.
- **A:** Spec-first discipline over prompt-and-pray.

### Task 4.2 - Select the implementation prompt and context most likely to produce correct, verifiable output

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `context-engineering`, `implementation-prompting`, `prompt-with-constraints-and-tests` |

- **K:** Supply the acceptance criteria, constraints, relevant context, and tests when prompting; ambiguous prompts produce plausible but incorrect code.
- **S:** Construct a prompt/context that makes correct output likely and verifiable.
- **A:** Precision; treating the assistant as a literal-minded collaborator.

### Task 4.3 - Analyze plausible-looking AI-generated code to find the subtle defect

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-code-review`, `never-merge-unread`, `provenance-and-licensing-check` |

- **K:** AI output looks confident and idiomatic, inviting automation bias; never merge what you haven't read, and check for hallucinated APIs, insecure defaults, and uncertain provenance.
- **S:** Find the subtle defect in plausible-looking generated code.
- **A:** Resistance to automation bias.

### Task 4.4 - Apply the generate-then-verify loop and own the verification

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `developer-owns-verification`, `generate-then-verify`, `verify-against-dod` |

- **K:** AI speeds up generation, but the Developer owns verification against acceptance criteria and the DoD; unverified AI output is unverified work.
- **S:** Sequence a task as generate, verify, integrate — not generate, merge.
- **A:** Accountability for outcomes regardless of authorship.

### Task 4.5 - Analyze AI-generated tests to identify the cases they miss

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ai-test-generation`, `coverage-with-ai`, `testing-to-its-own-bugs` |

- **K:** AI can rapidly draft tests, but tests from the same flawed assumptions as the code can test to its own bugs; independent edge-case reasoning is still required.
- **S:** Add the cases the AI missed; verify tests actually fail when behavior breaks.
- **A:** Rigor over coverage theater.

### Task 4.6 - Operate agentic, multi-step AI dev workflows with a human in the loop

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `agentic-dev-workflow`, `human-in-the-loop`, `plan-implement-test-review` |

- **K:** Agentic workflows (plan, implement, test, review, with tool use) raise leverage and risk together; a human checkpoint at accountable boundaries is non-negotiable.
- **S:** Define where to let an agent run and where to gate it.
- **A:** Calibrated trust; comfort interrupting an autonomous run.

### Task 4.7 - Recognize and mitigate risks specific to AI-generated code

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-code-risks`, `hallucinated-apis`, `insecure-ai-patterns` |

- **K:** Common risks: hallucinated APIs/packages, insecure defaults, subtle logic errors, confident-but-incorrect answers, outdated patterns from training data.
- **S:** Anticipate the failure mode for a given task and check for it.
- **A:** Defensive posture toward generated dependencies.

### Task 4.8 - Decide when NOT to use AI

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `novel-design-human-led`, `security-critical-paths`, `when-not-to-use-ai` |

- **K:** Novel/architectural design, security-critical paths, deeply ambiguous requirements, and skill-building contexts are poor fits for delegation.
- **S:** Make and defend a no-AI call.
- **A:** Judgment over default-to-tool.

### Task 4.9 - Explain provenance, attribution, and licensing obligations for AI-assisted work

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ip-hygiene`, `license-compliance-ai`, `provenance-and-attribution` |

- **K:** AI-suggested code can reproduce licensed material; teams need provenance, license-compliance, and IP-hygiene practices; the-AI-wrote-it is not a shield.
- **S:** Flag and handle code of uncertain provenance.
- **A:** Professional and legal responsibility.

### Task 4.10 - Keep accountability for the Increment human and collective

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `cannot-delegate-accountability`, `human-accountability`, `tool-not-teammate` |

- **K:** AI is a tool, not a team member that holds accountability; responsibility for the Increment is human and collective and cannot be laundered through a tool.
- **S:** Refuse ship-it-the-AI-says-it's-fine and name who owns the outcome.
- **A:** Ownership under pressure.

### Task 4.11 - Use AI for debugging and comprehension without outsourcing understanding

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-debugging`, `code-comprehension-with-ai`, `dont-outsource-understanding` |

- **K:** AI can accelerate explanation and debugging, but the Developer must understand the solution well enough to own it and detect a wrong explanation.
- **S:** Use AI to accelerate comprehension, then confirm independently.
- **A:** Curiosity over copy-paste.

### Task 4.12 - Recognize when AI velocity is creating review/integration debt and adjust

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `adjust-team-practices`, `review-integration-debt`, `velocity-outpacing-verification` |

- **K:** Signals that AI generation is outpacing verification — growing unreviewed PRs, rising rollbacks, integration backlog — and the concrete team adjustments that restore balance.
- **S:** Read the signals and pick a concrete adjustment.
- **A:** Holding the quality line as output volume rises.

---

# Domain D5 - Collaboration, Professionalism & Continuous Improvement (22.5%)

**Description.** A Developer's work is team work: cross-functionality and T-shaping, collaborating with the Product Owner and Scrum Master, professional responsibility (security, privacy, accessibility, ethics — including for AI-assisted output), sustaining skill in an AI world, standardizing good team AI practices, and the terminology drift Developers must navigate.

**Tasks:** 8  |  **MCQ seats:** 18

## Tasks

### Task 5.1 - Collaborate across a cross-functional team and develop T-shaped skills

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `avoid-silos`, `cross-functionality`, `t-shaped-skills` |

- **K:** The Developers collectively have all skills to build a Done Increment; T-shaping and swarming reduce single points of failure and silos.
- **S:** Spread knowledge; pick up adjacent work to keep flow.
- **A:** Generosity with knowledge; whole-team mindset.

### Task 5.2 - Determine how to clarify criteria, surface constraints, and negotiate scope with the Product Owner

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `clarify-acceptance-criteria`, `surface-technical-constraints`, `working-with-po` |

- **K:** Developers and PO collaborate on refinement; Developers surface technical reality so value decisions are informed; the PO owns the what, Developers own the how.
- **S:** Translate technical constraints into terms the PO can decide on.
- **A:** Respect for the PO's authority; candor about feasibility.

### Task 5.3 - Explain how Developers work with the Scrum Master: surfacing impediments early and engaging in improvement

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `engage-improvement`, `surface-impediments`, `working-with-scrum-master` |

- **K:** The SM serves the Developers by removing impediments and fostering self-management; Developers must make impediments visible early.
- **S:** Raise an impediment clearly and early.
- **A:** Trust; willingness to ask for help.

### Task 5.4 - Give and receive technical feedback professionally

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `constructive-critique`, `professional-disagreement`, `technical-feedback` |

- **K:** Critique the work, not the person; disagree-and-commit; feedback is a team-health practice, not a status contest.
- **S:** Deliver hard feedback kindly; receive it without defensiveness.
- **A:** Professional maturity; ego subordination.

### Task 5.5 - Uphold professional responsibility, including for AI-assisted work

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ethics-of-ai-assisted-work`, `professional-responsibility`, `security-privacy-accessibility` |

- **K:** Security, privacy, accessibility, and ethics are the Developer's responsibility; AI assistance doesn't lower the bar.
- **S:** Apply a professional-responsibility lens to an AI-assisted change.
- **A:** Duty of care to users and the public.

### Task 5.6 - Explain how over-reliance on AI erodes the fundamentals that make AI safe to use

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `deliberate-practice`, `learning-in-the-ai-era`, `skill-atrophy-risk` |

- **K:** Over-reliance on AI can erode fundamentals; deliberate practice and occasional AI-off work preserve the judgment that makes AI safe to use.
- **S:** Explain why deliberate practice and occasional AI-off work preserve the judgment that AI use depends on.
- **A:** Long-term self-investment over short-term convenience.

### Task 5.7 - Share and standardize good AI-assisted practices across the team

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `collective-ai-guardrails`, `share-ai-practices`, `team-ai-conventions` |

- **K:** Teams benefit from shared conventions for AI use; guardrails are a collective-ownership artifact, like a coding standard or the DoD.
- **S:** Contribute to and follow team AI guardrails.
- **A:** Collective ownership over lone-wolf tooling.

### Task 5.8 - Translate legacy Scrum terminology to the 2020 Guide's canonical terms

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `commitment-as-forecast`, `development-team-to-developers`, `terminology-drift-developers` |

- **K:** Development Team to Developers; self-organizing to self-managing; the Sprint Backlog is a forecast while the Sprint Goal is its commitment; ceremonies to events.
- **S:** Translate legacy phrasing to canonical on the exam.
- **A:** Patience with terminology lag.

---

*Generated 2026-07-23 by scripts/gen-jta-doc.mjs from certification SD-AI-I (44444444-4444-4444-4444-444444444444).*
