> ## SUPERSEDED FOR ALL FACTUAL CONTENT
>
> **The authoritative JTA for SD-AI-I is `jta/SD-AI-I_JTA_generated.md`**, rendered
> from the live database by `scripts/gen-jta-doc.mjs`. Regenerate it rather than
> reading or editing the tables below.
>
> Measured on 2026-07-23, this document disagrees with the database on
> **13 task statement(s)** and is **missing 1 task(s)** entirely. Its exam
> facts and any hand-typed Bloom distribution are also unreliable - SPO-AI-I's copy
> published a 15/35/35/15 profile where the computed figure is 1.9/36.9/52.7/8.5,
> and a 90-minute duration where the database says 120.
>
> **This is not a hypothetical risk.** A translator worked from the SM-AI-I copy of
> this document rather than the live tasks, and five statements were translated into
> Spanish and Portuguese from wording migration 091 had already superseded.
>
> **What is still valuable here:** the design rationale, domain-weight reasoning,
> sourcing and review history. That judgment cannot be regenerated from a query and
> has not been moved yet. It will be extracted into `SD-AI-I_JTA_narrative.md`,
> after which this file is archived. Until then, read it for the *why* and never for
> the *what*.

---
# SD-AI-I — Job-Task Analysis (v1.1)

**Document version:** 1.1 (locked)
**Status:** LOCKED — basis for content production.
**Certification:** Certidemy Scrum Developer I — AI (SD-AI-I) — proprietary, issued by Certidemy
**Authority:** 2020 Scrum Guide (Schwaber & Sutherland) — primary; established software-engineering and AI-assisted-development practice — supporting
**Cert id (fixed pattern):** `44444444-4444-4444-4444-444444444444`
**Last updated:** June 30, 2026

---

## Changes from v1.0 (review-response pass)

1. **3.1 ↔ 4.10 de-overlapped.** 3.1 now owns the *craft* claim (the DoD is the
   quality bar and applies identically to AI output); 4.10 is reframed to pure
   *accountability* (responsibility for the Increment is human and collective and
   cannot be delegated to a tool) and no longer restates the DoD.
2. **3.8 ↔ 4.3 differentiated by object.** 3.8 is the collaborative *practice* of
   review (shared ownership, feedback, AI as a review assistant); 4.3 is the
   special scrutiny that *AI-authored* code demands (never-merge-unread, provenance,
   automation bias).
3. **4.12 made concrete and testable** — reframed from the broad "manage the
   throughput-vs-quality tension" to "recognize when AI velocity is creating
   review/integration debt and adjust team practices."
4. **D4 KSAs tightened** for sharper lesson/item authoring.
5. **D1 weight held at 12.5%** — deliberately, for cross-suite symmetry (see the
   note under Domain structure). Flagged in review; justification made explicit
   rather than changed.
6. **KSA polish pass** — tightened the longer KSAs in D3 (3.5, 3.10) and D4 (4.2,
   4.4, 4.7, 4.11) and sharpened 4.12's signals; meaning preserved.

---

## About this document

This is the Job-Task Analysis for **Scrum Developer I — AI**, the third and final
credential in Certidemy's **Level-I Scrum trilogy** (SM-AI-I, SPO-AI-I, SD-AI-I).
It defines the domains, tasks, weightings, and concept map that drive content
production and the secure examination blueprint, in the same shape as the locked
SM-AI-I and SPO-AI-I analyses.

It is authored to the **AI-era model proven on SPO-AI-I**: AI fluency is **woven
through every domain**, never isolated in a bolt-on "AI domain." (SM-AI-I's
original dark Domain 6 taught us that lesson; it was dissolved and its AI tasks
re-homed across D1–D5.) Every one of this credential's five domains contains
AI-era tasks, so every instructional module teaches AI-era content.

**The signature competency is AI-Augmented Implementation** — the Developer's
half of Spec-Driven Development. Where the Product Owner authors a Product Backlog
item precise enough to act as an agent-executable specification (SPO-AI-I, D4), the
Scrum Developer **implements that specification with AI as a teammate and remains
accountable for verifying it against the Definition of Done.** That loop is the
spine that ties the three Level-I credentials into one coherent picture of an
AI-era Scrum Team (see §"The Level-I trilogy").

**A note on honesty.** Where a property depends on data or governance that only
accumulates after launch (SME validation, standard-setting, full lesson
localization), this document says so plainly rather than overstating readiness —
consistent with the SPO-AI-I scheme.

---

## Intended exam facts (target DB state on build)

| Attribute | Value |
|---|---|
| Credential name | Scrum Developer I — AI |
| Credential code | SD-AI-I |
| Cert id | `44444444-4444-4444-4444-444444444444` |
| Issuing body | Certidemy (provider = `Certidemy`) |
| Items | 80 |
| Duration | 90 minutes |
| Item format | Single-best-answer multiple choice and true/false (no multi-select) |
| Pass mark | 80% (64 / 80) — criterion-referenced, provisional |
| Languages | English, es-419, pt-BR |
| Validity | 1 year from issuance |
| `is_published` | `false` (dark) until lessons + both pools are built |

These mirror SPO-AI-I exactly (80 / 80% / 90 min). The Level-I suite is thereby
internally consistent at **80 items / 80% pass** across all three credentials. (The
only standing inconsistency in the suite is SM-AI-I's 60-minute duration vs.
90 for SPO/SD — flagged for the suite-consistency pass, not changed here.)

---

## Domain structure (locked)

| # | Domain | Weight | Items (of 80) | Tasks |
|---|---|---|---|---|
| D1 | Agile Foundations & Empirical Engineering in the AI Era | 12.5% | 10 | 6 |
| D2 | The Scrum Framework from the Developers' Seat | 15.0% | 12 | 8 |
| D3 | Engineering Craft, Quality & the Definition of Done | 20.0% | 16 | 10 |
| D4 | **AI-Augmented Implementation** (signature) | 30.0% | 24 | 12 |
| D5 | Collaboration, Professionalism & Continuous Improvement | 22.5% | 18 | 8 |
| **Total** | | **100%** | **80** | **44** |

The assembler draws each form proportionally to these weights and **refuses to
issue a form if any domain is short of its quota**, guaranteeing a blueprint-valid
form for every candidate.

### Rationale

- **D4 (AI-Augmented Implementation) carries the heaviest slice at 30%** — the
  same weighting SPO gives Spec-Driven Development. This is the credential's
  signature and its differentiator: the discipline of generating with AI and
  *owning the verification.*
- **D3 (Engineering Craft, Quality & DoD) at 20%** — the enduring technical
  craft (DoD, TDD, CI/CD, refactoring, technical debt, code review, pairing) that
  AI accelerates but never excuses.
- **D5 (Collaboration & Professionalism) at 22.5%** — a Developer's work is
  team work; this domain owns cross-functionality, working with PO/SM,
  professional responsibility, and sustaining skill in an AI world.
- **D2 (Framework from the Developers' seat) at 15%** — the Scrum framework as
  Developers live it: their accountabilities, the Sprint Backlog, the Daily Scrum
  as *their* event.
- **D1 (Foundations) held at 12.5%** — small but non-negotiable. This is a
  **deliberate cross-suite decision, not an under-weighting:** D1 sits at 12.5% on
  all three Level-I credentials (SM-AI-I, SPO-AI-I, SD-AI-I), and that symmetry is
  part of what makes the trilogy read as one coherent system. Foundations are
  tested **implicitly through every other domain** (you cannot answer a D4
  generate-then-verify item without empiricism), which is precisely why they carry
  few *direct* items. The high-leverage AI-era foundations (1.2, 1.4, 1.6) get
  their assessment weight where they're applied — in D3 and D4 — rather than as
  standalone foundation items. Raising SD's D1 to chase a per-cert optimum would
  break the parallel structure for a marginal gain; the weight stays.

---

## Bloom's Taxonomy distribution (MCQ target)

Across all 80 items:

| Bloom level | Target % | ~Count | Style |
|---|---|---|---|
| 1 — Remember | 12.5% | 10 | Direct recall ("Who owns the Sprint Backlog?") |
| 2 — Understand | 30% | 24 | Explanation/comparison ("Why does DoD apply to AI-generated code?") |
| 3 — Apply | 37.5% | 30 | Short scenarios ("The AI suggests code that passes tests but…") |
| 4 — Analyze | 20% | 16 | Multi-step diagnosis (review an AI PR; trace a quality failure) |
| 5–6 — Evaluate/Create | 0% in MCQs | 0 | **Reserved for AI simulations (Phase 2)** |

**57.5% of items sit at Apply/Analyze** — the same "train above the test" posture
as SM-AI-I and SPO-AI-I. Bloom ceiling for secure MCQs is **4 (Analyze)**;
5–6 are reserved for the future AI-driven simulation items flagged below.

---

## Scrum terminology drift (legacy vs. 2020 Guide) — Developer lens

The 2020 Scrum Guide is canonical; legacy materials lag. Content teaches the Guide
as authoritative and flags drift as exam-tip callouts (Task 5.8).

| 2020 Guide (canonical) | Legacy materials sometimes use | Our content position |
|---|---|---|
| Developers (an accountability) | "Development Team" (a sub-team) | Teach "Developers"; note the 2020 removal of the Development Team as a separate entity |
| Self-managing | Self-organizing | Teach "self-managing"; flag the 2017→2020 shift |
| Commitment (Sprint Goal / DoD / Product Goal) | "Commitment" loosely as the Sprint forecast | Teach the three commitments; note the Sprint Backlog is a *forecast*, the Sprint Goal is its commitment |
| Events | Ceremonies | Teach "events"; note "ceremonies" is legacy |
| Definition of Done (a commitment to the Increment) | "DoD" as a team checklist only | Teach DoD as the quality commitment that makes "Done" transparent |

---

## How AI is woven through the domains

AI-era competence is **not** a domain — it is a thread through all five. Of the 44
tasks, **24 are AI-era** (their concept map carries AI-era concepts, so
`taskIsAiEra` derives `true`; the magenta AI-Era badge surfaces on those tasks and
in every module), distributed:

- **D1:** 1.2, 1.4, 1.6 — empiricism over AI output; AI shifts the bottleneck from
  authoring to reviewing; matching AI assistance to problem complexity.
- **D2:** 2.7 — AI-assisted estimation as input, not authority.
- **D3:** 3.1, 3.5, 3.6, 3.9, 3.10 — DoD applies to AI output; AI-generated
  technical debt; AI-assisted refactoring, review, pairing, and test generation.
- **D4 (signature):** all 12 tasks are AI-era.
- **D5:** 5.5, 5.6, 5.7 — ethics of AI-assisted work; skill atrophy and learning
  in an AI world; standardizing team AI practices.

Every module (one per domain) therefore contains AI-era lessons, satisfying the
requirement that AI-era tasks appear **both in the JTA and in its modules.**

---

# Domain 1 — Agile Foundations & Empirical Engineering in the AI Era (12.5%)

**Description.** The "why" beneath a Developer's work: Agile values and principles
from a builder's perspective, the three pillars of empiricism applied to
engineering, the five Scrum values as Developers live them, lean/flow thinking,
and a precise definition of who "Developers" are in the 2020 Guide. The AI-era
twist: when generation is cheap and verification is expensive, empiricism is the
reason you inspect AI output instead of trusting it.

**Module mapping:** Module 1 (Foundations for the AI-Era Developer)

## Tasks

### Task 1.1 — Articulate the Agile Manifesto's values and principles from a Developer's perspective

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `agile-values`, `agile-principles`, `working-software-over-docs` |

**KSAs:**

- **K:** The 4 values and 12 principles; the primacy of working software and
  technical excellence ("Continuous attention to technical excellence and good
  design enhances agility")
- **S:** Map a delivery decision to the principle it serves or violates
- **A:** Craftsmanship; pride in working, maintainable output

---

### Task 1.2 — Apply the three pillars of empiricism to engineering work and to AI-generated output

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `empirical-process`, `transparency`, `inspection`, `adaptation`, `verify-ai-output` |

**KSAs:**

- **K:** Transparency, Inspection, Adaptation and their interdependence; why
  AI-generated code is *unverified work* until inspected — generation is not
  evidence of correctness
- **S:** Identify which pillar is broken when a team merges AI output it never read
- **A:** Intellectual honesty; "trust, but verify" reflex toward machine output

---

### Task 1.3 — Live the five Scrum Values as a Developer

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `scrum-values`, `courage-and-quality`, `openness-about-uncertainty` |

**KSAs:**

- **K:** Commitment, Courage, Focus, Openness, Respect, applied to building —
  Courage to reject plausible-but-wrong output and to surface bad news; Openness
  about what isn't understood
- **S:** Recognize which value is lived or violated in a build scenario
- **A:** Modeling the values under deadline pressure

---

### Task 1.4 — Explain lean and flow thinking, and how AI shifts the bottleneck from authoring to reviewing

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `lean-thinking`, `flow-and-wip-limits`, `ai-shifts-the-bottleneck` |

**KSAs:**

- **K:** Small batches, flow, limiting WIP, reducing waste; the AI-era shift —
  when code is cheap to generate, the constraint moves to review, integration, and
  verification, so unbounded generation creates a review backlog (waste)
- **S:** Spot when "more AI output" is making flow *worse*
- **A:** Systems thinking over local optimization

---

### Task 1.5 — Define who the "Developers" are in the 2020 Scrum Guide

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Per-Exam |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `developers-definition`, `cross-functional-team`, `whole-team-skills` |

**KSAs:**

- **K:** "Developers" = the Scrum Team members who create any aspect of a usable
  Increment each Sprint; not a job title, not only coders; the 2020 Guide removed
  the "Development Team" as a separate sub-team
- **S:** Correctly classify who is and isn't "a Developer" in a scenario
- **A:** Inclusivity toward all build skills (test, design, ops, data)

---

### Task 1.6 — Match AI assistance to the complexity of the work

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `complexity-and-ai-fit`, `cynefin-lite`, `when-to-trust-ai` |

**KSAs:**

- **K:** Where AI generation is high-leverage (well-specified, well-trodden work)
  vs. where novel/complex/ambiguous work needs human-led design first
- **S:** Categorize a piece of work and choose an AI-use posture accordingly
- **A:** Resisting "AI for everything"; judgment over reflex

---

# Domain 2 — The Scrum Framework from the Developers' Seat (15%)

**Description.** The Scrum framework as Developers experience and own it: their
accountabilities, Sprint Planning's "how," the Sprint Backlog as a living forecast,
the Daily Scrum as the Developers' event, and their part in Review and
Retrospective. AI-era: AI as input to estimation and planning, never a replacement
for the Developers' self-management.

**Module mapping:** Module 2 (Scrum for Developers)

## Tasks

### Task 2.1 — Describe the Developers' accountabilities

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `developers-accountabilities`, `instill-quality`, `daily-adaptation`, `peer-accountability` |

**KSAs:**

- **K:** Create the Sprint plan (Sprint Backlog); instill quality by adhering to a
  Definition of Done; adapt the plan daily toward the Sprint Goal; hold each other
  accountable as professionals
- **S:** Identify which accountability a behavior fulfills or neglects
- **A:** Ownership of outcomes, not just tasks

---

### Task 2.2 — Turn the Sprint Goal and selected items into a Sprint Backlog (the "how")

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Per-Sprint |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `sprint-planning-how`, `sprint-goal`, `sprint-backlog-creation` |

**KSAs:**

- **K:** Sprint Planning topics (why/what/how); Developers decompose selected PBIs
  into an actionable plan; the Sprint Goal is the single objective
- **S:** Produce a workable plan that serves the Sprint Goal
- **A:** Realistic forecasting over heroic over-commitment

---

### Task 2.3 — Own and maintain the Sprint Backlog as a living forecast

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `sprint-backlog-ownership`, `living-forecast`, `daily-backlog-update` |

**KSAs:**

- **K:** The Sprint Backlog is by the Developers, for the Developers; it is a
  forecast that updates as more is learned; it is not a fixed contract
- **S:** Keep the plan transparent and current through the Sprint
- **A:** Comfort with change within the Sprint

---

### Task 2.4 — Run the Daily Scrum as the Developers' event

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `daily-scrum`, `developers-event`, `replanning-toward-goal` |

**KSAs:**

- **K:** 15-minute timebox; for and by the Developers; purpose is to inspect
  progress toward the Sprint Goal and adapt the plan — not a status report to a
  manager
- **S:** Keep the event focused on the Goal, not on individual task accounting
- **A:** Self-management over reporting-up

---

### Task 2.5 — Present a Done Increment and gather feedback at the Sprint Review

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | Medium |
| Frequency | Per-Sprint |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `sprint-review-participation`, `done-increment-demo`, `stakeholder-feedback` |

**KSAs:**

- **K:** The Review inspects the Increment and adapts the Product Backlog; only
  *Done* work is shown; it is a working session, not a phase-gate
- **S:** Demonstrate working software and absorb feedback without defensiveness
- **A:** Openness to inspection of one's work

---

### Task 2.6 — Engage in the Sprint Retrospective and commit to improvement

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Per-Sprint |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `sprint-retrospective`, `improvement-commitment`, `team-process-inspection` |

**KSAs:**

- **K:** Inspect how the last Sprint went (people, relationships, process, tools,
  Definition of Done); identify the most helpful improvements; at least one is
  often added to the next Sprint Backlog
- **S:** Move from complaint to a concrete, owned improvement
- **A:** Continuous-improvement habit; candor with kindness

---

### Task 2.7 — Apply estimation and forecasting, treating AI estimates as input not authority

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | Medium |
| Frequency | Per-Sprint |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `relative-estimation`, `forecasting-throughput`, `ai-assisted-estimation` |

**KSAs:**

- **K:** Relative sizing, story points, throughput/velocity as forecasting aids
  (not Guide-prescribed); AI can suggest estimates from history, but the Developers
  own the forecast and its uncertainty
- **S:** Use an AI estimate as a conversation starter, then adjust with team
  knowledge
- **A:** Skepticism toward false precision, human or machine

---

### Task 2.8 — Self-manage: decide who does what, when, and how

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `self-management`, `no-externally-assigned-tasks`, `resist-command-control` |

**KSAs:**

- **K:** The Developers internally decide how to turn the Backlog into Increments;
  no one tells them how to do it; self-management is undermined when tools or
  managers re-impose task assignment
- **S:** Distinguish legitimate coordination from command-and-control creep
- **A:** Collective ownership; professional autonomy

---

# Domain 3 — Engineering Craft, Quality & the Definition of Done (20%)

**Description.** The enduring technical craft that makes "Done" real: the Definition
of Done as a quality commitment, distinguishing done from "looks done," test-first
development, CI/CD, technical debt, refactoring, version-control discipline, code
review, and pairing/mobbing. AI-era woven throughout: the DoD applies equally to
AI-generated work, and unreviewed AI output is a fast path to technical debt.

**Module mapping:** Module 3 (Quality & Engineering Craft)

## Tasks

### Task 3.1 — Apply the Definition of Done as the quality bar for every Increment, including AI output

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `definition-of-done`, `quality-commitment`, `dod-applies-to-ai-output` |

**KSAs:**

- **K:** The DoD is the commitment that makes Increment quality transparent; work
  isn't "Done" until it meets the DoD — and the DoD is applied identically whether
  a human or an AI produced the code. *(This task owns the quality-bar claim; the
  human-accountability claim lives in 4.10.)*
- **S:** Judge whether an Increment, including AI-generated parts, meets the DoD
- **A:** A non-negotiable quality bar

---

### Task 3.2 — Distinguish "Done" from "looks done"

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Per-Sprint |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `done-vs-looks-done`, `undone-work`, `hidden-integration-cost` |

**KSAs:**

- **K:** Undone work (untested, unintegrated, undocumented) accrues as invisible
  debt; "it runs on my machine / it passed one test" is not Done
- **S:** Detect undone work hiding behind a demo
- **A:** Honesty about completeness

---

### Task 3.3 — Practice test-first / test-driven development

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | **Yes** — "TDD Kata" simulation (Bloom 5) |
| Concept slugs | `test-driven-development`, `test-first`, `red-green-refactor` |

**KSAs:**

- **K:** Red-green-refactor; tests as executable specification and as a guardrail
  for change (and for verifying AI-generated code)
- **S:** Drive a small change test-first
- **A:** Discipline; valuing fast feedback over speed-to-merge

---

### Task 3.4 — Keep the Increment releasable with continuous integration and delivery

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `continuous-integration`, `continuous-delivery`, `releasable-increment` |

**KSAs:**

- **K:** Integrate frequently; a green pipeline as a precondition of Done; the
  Increment should be usable/releasable at Sprint end (or sooner)
- **S:** Diagnose a broken-flow scenario (long-lived branches, red main)
- **A:** Collective responsibility for the build

---

### Task 3.5 — Surface and pay down technical debt, including AI-generated debt

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `technical-debt`, `surface-debt-transparency`, `ai-generated-debt` |

**KSAs:**

- **K:** Technical debt is a transparency problem before it's a code problem;
  high-volume AI generation without review accelerates it through plausible but
  poorly understood code and copy-paste sprawl
- **S:** Name debt, make it visible, and negotiate paydown
- **A:** Long-term stewardship over short-term throughput

---

### Task 3.6 — Refactor safely toward maintainability

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `refactoring`, `maintainability`, `ai-assisted-refactoring` |

**KSAs:**

- **K:** Behavior-preserving change under test coverage; AI can propose
  refactorings but the test suite and the Developer's judgment certify safety
- **S:** Refactor without changing behavior; verify with tests
- **A:** Care for the next reader of the code

---

### Task 3.7 — Use version-control discipline

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `version-control-discipline`, `small-reviewable-commits`, `branching-tradeoffs` |

**KSAs:**

- **K:** Small, reviewable commits; trunk-based vs. feature-branch trade-offs;
  meaningful history; AI-generated changes still need reviewable diffs
- **S:** Structure work into reviewable units
- **A:** Consideration for reviewers

---

### Task 3.8 — Conduct effective code review as a team practice

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `code-review`, `shared-code-ownership`, `review-feedback-craft` |

**KSAs:**

- **K:** Review is a collaboration practice: it spreads ownership, transfers
  knowledge, and improves quality through actionable feedback. *(Object: the team's
  review discipline on any change. The distinct scrutiny that AI-authored code
  demands lives in 4.3.)*
- **S:** Give specific, kind, actionable review feedback; review for correctness
  and readability, not style nits
- **A:** Collective ownership; ego-free critique

---

### Task 3.9 — Collaborate through pairing and mobbing; situate AI pair-programming within them

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `pair-programming`, `mob-programming`, `ai-pair-programming` |

**KSAs:**

- **K:** Pairing/mobbing for quality and knowledge-sharing; an AI assistant is a
  powerful pair *partner* but not a substitute for human pairing — it doesn't share
  context, accountability, or learning across the team
- **S:** Choose human pairing vs. AI assistance vs. both for a given task
- **A:** Valuing shared understanding, not just output

---

### Task 3.10 — Build quality in continuously (shift-left), including AI-generated tests

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `built-in-quality`, `shift-left-testing`, `ai-generated-tests-quality` |

**KSAs:**

- **K:** Quality must be built in, not inspected in at the end; AI can expand test
  volume quickly, but tests generated *by the same model that wrote the code* may
  share its blind spots
- **S:** Evaluate whether a test suite (AI-assisted or not) actually constrains
  behavior
- **A:** Distrust of coverage-as-vanity-metric

---

# Domain 4 — AI-Augmented Implementation (signature) (30%)

**Description.** The signature domain: implementing an acceptance-criteria-bearing
specification with AI as a teammate, while the Developer remains accountable for
verification, security, licensing, and the Definition of Done. This is the
Developer's half of Spec-Driven Development (it pairs with SPO-AI-I's D4). It
covers implementation prompting, critical review of AI output, the
generate-then-verify loop, AI test generation, agentic workflows, AI-specific
risks, when *not* to use AI, provenance, and the human-accountability boundary.

**Module mapping:** Module 4 (AI-Augmented Implementation — the signature module)

## Tasks

### Task 4.1 — Implement against a PBI as an executable specification, with AI assistance

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | **Yes** — "Spec-to-Increment" simulation (Bloom 5) |
| Concept slugs | `spec-driven-development`, `pbi-as-executable-spec`, `acceptance-criteria-driven` |

**KSAs:**

- **K:** A PBI with clear acceptance criteria is a specification an AI agent can
  execute against; the acceptance criteria are the contract the implementation must
  satisfy (the Developer half of the SPO signature loop)
- **S:** Drive an implementation from acceptance criteria, with AI generating
  candidate code
- **A:** Spec-first discipline over prompt-and-pray

---

### Task 4.2 — Write effective implementation prompts and context for AI coding assistants

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `implementation-prompting`, `context-engineering`, `prompt-with-constraints-and-tests` |

**KSAs:**

- **K:** Supply the acceptance criteria, constraints, relevant context, and tests when
  prompting; ambiguous prompts produce plausible but incorrect code because the
  model cannot infer unstated intent
- **S:** Construct a prompt/context that makes correct output likely and verifiable
- **A:** Precision; treating the assistant as a literal-minded collaborator

---

### Task 4.3 — Apply the extra scrutiny that AI-authored code demands

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | **Yes** — "Review the AI's PR" simulation (Bloom 5) |
| Concept slugs | `ai-code-review`, `never-merge-unread`, `provenance-and-licensing-check` |

**KSAs:**

- **K:** AI output looks confident and idiomatic, which invites automation bias.
  It demands review beyond ordinary code review: never merge what you haven't read
  and understood; check for hallucinated APIs, insecure defaults, and uncertain
  provenance/licensing. *(Object: AI-authored code specifically. The general team
  review practice is 3.8.)*
- **S:** Find the subtle defect in plausible-looking generated code
- **A:** Resistance to automation bias

---

### Task 4.4 — Apply the generate-then-verify loop and own the verification

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `generate-then-verify`, `developer-owns-verification`, `verify-against-dod` |

**KSAs:**

- **K:** AI speeds up *generation*, but the Developer owns *verification* against
  acceptance criteria and the Definition of Done; unverified AI output is not
  progress — it is unverified work
- **S:** Sequence a task as generate → verify → integrate, not generate → merge
- **A:** Accountability for outcomes regardless of authorship

---

### Task 4.5 — Use AI to generate and strengthen tests, guarding against blind spots

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `ai-test-generation`, `coverage-with-ai`, `testing-to-its-own-bugs` |

**KSAs:**

- **K:** AI can rapidly draft unit/integration tests, but tests generated from the
  same flawed assumptions as the code can "test to its own bugs"; independent
  reasoning about edge cases is still required
- **S:** Add the cases the AI missed; verify tests actually fail when behavior breaks
- **A:** Rigor over coverage theater

---

### Task 4.6 — Operate agentic, multi-step AI dev workflows with a human in the loop

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | **Yes** — "Drive the Agent" simulation (Bloom 6) |
| Concept slugs | `agentic-dev-workflow`, `plan-implement-test-review`, `human-in-the-loop` |

**KSAs:**

- **K:** Agentic workflows (plan → implement → test → review, with tool use) raise
  leverage and risk together; a human checkpoint at the accountable boundaries
  (merge, deploy, security) is non-negotiable
- **S:** Define where to let an agent run and where to gate it
- **A:** Calibrated trust; comfort interrupting an autonomous run

---

### Task 4.7 — Recognize and mitigate risks specific to AI-generated code

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `ai-code-risks`, `hallucinated-apis`, `insecure-ai-patterns` |

**KSAs:**

- **K:** Common risks in AI-generated code: hallucinated APIs/packages (slopsquatting
  risk), insecure defaults, subtle logic errors, confident-but-incorrect answers,
  and outdated patterns from training data
- **S:** Anticipate the failure mode for a given task and check for it
- **A:** Defensive posture toward generated dependencies

---

### Task 4.8 — Decide when NOT to use AI

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `when-not-to-use-ai`, `novel-design-human-led`, `security-critical-paths` |

**KSAs:**

- **K:** Novel/architectural design, security-critical paths, deeply ambiguous
  requirements, and skill-building contexts are poor fits for delegation; sometimes
  the right move is to think first and generate later (or not at all)
- **S:** Make and defend a no-AI call
- **A:** Judgment over default-to-tool

---

### Task 4.9 — Maintain provenance, attribution, and licensing hygiene for AI-assisted work

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `provenance-and-attribution`, `license-compliance-ai`, `ip-hygiene` |

**KSAs:**

- **K:** AI-suggested code can reproduce licensed material; teams need provenance,
  license-compliance, and IP-hygiene practices; "the AI wrote it" is not a legal or
  professional shield
- **S:** Flag and handle code of uncertain provenance
- **A:** Professional and legal responsibility

---

### Task 4.10 — Keep accountability for the Increment human and collective

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `human-accountability`, `cannot-delegate-accountability`, `tool-not-teammate` |

**KSAs:**

- **K:** AI is a tool, not a team member that holds accountability. Responsibility
  for the Increment is human and collective and cannot be laundered through a tool —
  "the AI wrote it" is never a defense. *(This task owns the accountability claim;
  the quality-bar/DoD claim lives in 3.1.)*
- **S:** Refuse "ship it, the AI says it's fine" and name who owns the outcome
- **A:** Ownership under pressure

---

### Task 4.11 — Use AI for debugging and comprehension without outsourcing understanding

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `ai-debugging`, `code-comprehension-with-ai`, `dont-outsource-understanding` |

**KSAs:**

- **K:** AI can accelerate code explanation and debugging, but the Developer must still
  understand the solution well enough to own it and to detect a wrong explanation
- **S:** Use AI to accelerate comprehension, then confirm independently
- **A:** Curiosity over copy-paste

---

### Task 4.12 — Recognize when AI velocity is creating review/integration debt and adjust

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `review-integration-debt`, `velocity-outpacing-verification`, `adjust-team-practices` |

**KSAs:**

- **K:** Signals that AI generation is outpacing verification — growing unreviewed PRs,
  rising rollback rates, integration backlog — and the concrete team adjustments
  that restore balance (WIP limits on AI-generated PRs, review-capacity gating,
  smaller batches). The Developer analogue of the PO's insight: cheaper output
  makes the discipline of "Done" matter *more*, not less.
- **S:** Read the signals and pick a concrete adjustment
- **A:** Holding the quality line as output volume rises

---

# Domain 5 — Collaboration, Professionalism & Continuous Improvement (22.5%)

**Description.** A Developer's work is team work. Cross-functionality and T-shaping,
collaborating with the Product Owner and Scrum Master, professional responsibility
(security, privacy, accessibility, ethics — including for AI-assisted output),
sustaining skill in an AI world, standardizing good team AI practices, and the
terminology drift Developers must navigate.

**Module mapping:** Module 5 (Working as a Team in the AI Era)

## Tasks

### Task 5.1 — Collaborate across a cross-functional team and develop T-shaped skills

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `cross-functionality`, `t-shaped-skills`, `avoid-silos` |

**KSAs:**

- **K:** The Developers collectively have all skills to build a Done Increment;
  T-shaping and swarming reduce single points of failure and silos
- **S:** Spread knowledge; pick up adjacent work to keep flow
- **A:** Generosity with knowledge; whole-team mindset

---

### Task 5.2 — Work with the Product Owner: clarify criteria, surface constraints, negotiate scope

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `working-with-po`, `clarify-acceptance-criteria`, `surface-technical-constraints` |

**KSAs:**

- **K:** Developers and PO collaborate on refinement; Developers surface technical
  reality (cost, risk, feasibility) so value decisions are informed; the PO owns
  the *what*, Developers own the *how*
- **S:** Translate technical constraints into terms the PO can decide on
- **A:** Respect for the PO's authority; candor about feasibility

---

### Task 5.3 — Work with the Scrum Master: surface impediments and engage in improvement

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `working-with-scrum-master`, `surface-impediments`, `engage-improvement` |

**KSAs:**

- **K:** The SM serves the Developers by removing impediments and fostering
  self-management; Developers must make impediments visible early
- **S:** Raise an impediment clearly and early
- **A:** Trust; willingness to ask for help

---

### Task 5.4 — Give and receive technical feedback professionally

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `technical-feedback`, `professional-disagreement`, `constructive-critique` |

**KSAs:**

- **K:** Critique the work, not the person; disagree-and-commit; feedback is a
  team-health practice, not a status contest
- **S:** Deliver hard feedback kindly; receive it without defensiveness
- **A:** Professional maturity; ego subordination

---

### Task 5.5 — Uphold professional responsibility, including for AI-assisted work

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `professional-responsibility`, `security-privacy-accessibility`, `ethics-of-ai-assisted-work` |

**KSAs:**

- **K:** Security, privacy, accessibility, and ethics are the Developer's
  responsibility; AI assistance doesn't lower the bar — sensitive data shouldn't
  leak into prompts, and accessibility/security can't be assumed because "the AI
  handled it"
- **S:** Apply a professional-responsibility lens to an AI-assisted change
- **A:** Duty of care to users and the public

---

### Task 5.6 — Sustain skill and learning in an AI-augmented world

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `skill-atrophy-risk`, `deliberate-practice`, `learning-in-the-ai-era` |

**KSAs:**

- **K:** Over-reliance on AI can erode fundamentals (debugging, reading code,
  reasoning from first principles); deliberate practice and occasional
  "AI-off" work preserve the judgment that makes AI safe to use
- **S:** Design a personal practice that keeps core skills sharp
- **A:** Long-term self-investment over short-term convenience

---

### Task 5.7 — Share and standardize good AI-assisted practices across the team

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `team-ai-conventions`, `share-ai-practices`, `collective-ai-guardrails` |

**KSAs:**

- **K:** Teams benefit from shared conventions for AI use (review rules, prompt/
  context patterns, what's off-limits); guardrails are a collective-ownership
  artifact, like a coding standard or the DoD
- **S:** Contribute to and follow team AI guardrails
- **A:** Collective ownership over lone-wolf tooling

---

### Task 5.8 — Navigate legacy vs. 2020 Guide terminology drift (EXAM TIP)

| Attribute | Value |
|---|---|
| Domain | 5 |
| Criticality | Medium |
| Frequency | Per-Exam |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `terminology-drift-developers`, `development-team-to-developers`, `commitment-as-forecast` |

**KSAs:**

- **K:** "Development Team" → "Developers" (no separate sub-team in 2020);
  self-organizing → self-managing; the Sprint Backlog is a forecast while the
  Sprint Goal is its commitment; ceremonies → events
- **S:** Translate legacy phrasing to canonical on the exam
- **A:** Patience with terminology lag

---

## Summary statistics

- **5 domains; 44 tasks** (D1: 6 | D2: 8 | D3: 10 | D4: 12 | D5: 8)
- **All 44 tasks are exam-scope.** Weights 12.5 / 15 / 20 / 30 / 22.5 → blueprint
  **D1=10 / D2=12 / D3=16 / D4=24 / D5=18 = 80.**
- **24 AI-era tasks** (their concept maps carry AI-era concepts; AI is present in
  **every** domain and therefore every module).
- **~132 concepts** (≈3 per task) — the planned concept count, matching SPO-AI-I.
- **4 simulation candidates** flagged for Phase 2 (3.3 TDD Kata, 4.1 Spec-to-
  Increment, 4.3 Review the AI's PR, 4.6 Drive the Agent) — Bloom 5–6, AI-driven.
- **1 terminology-drift task** (5.8) plus a drift table.
- **Bloom ceiling 4** for secure MCQs; 5–6 reserved for simulations.
- **Item bank target (matches SPO-AI-I economics):** per task **24 secure
  (8/lang) + 30 practice (10/lang)** → **1,056 secure + 1,320 practice** items
  across en / es-419 / pt-BR.

---

## The Level-I trilogy — how this wraps up Level-I Scrum

With SD-AI-I, Certidemy certifies **all three Scrum accountabilities at the entry
tier, each AI-infused** — i.e. the whole Scrum Team:

| Credential | Accountability certified | Signature competency | Heaviest domain |
|---|---|---|---|
| **SM-AI-I** | Scrum Master — process, empiricism, team health | AI-augmented Scrum mastery (woven) | D3 Events (25%) |
| **SPO-AI-I** | Product Owner — value, backlog, vision | **Spec-Driven Development** (authoring the spec) | D4 Backlog & SDD (30%) |
| **SD-AI-I** | Developers — building & verifying the Increment | **AI-Augmented Implementation** (executing the spec) | D4 Implementation (30%) |

**The connective spine — the thing no legacy Scrum cert has.** The signature
competencies interlock into one loop:

> **The Product Owner authors a Product Backlog item precise enough to be an
> agent-executable specification → the Developer implements that spec with AI as a
> teammate and verifies it against the Definition of Done → the Scrum Master
> safeguards the empirical loop and the team's self-management around it.**

That is a coherent, defensible, genuinely modern account of how an AI-era Scrum
Team works — and it's the marketing story for the suite: *not three disconnected
exams, but one model of an AI-era team, certified role by role.*

**What "wrapping up Level I" then enables (in order):**

1. **Finish the current blocker first** — SPO-AI-I trilingual lessons (the ~88
   es-419/pt-BR rows). That's execution, not design; it gates SPO sale, which gates
   marketing the suite.
2. **Build SD-AI-I** from this JTA on the *existing rails* — no new platform work:
   seed migration → 5 modules / 44 lessons → practice + secure pools via the
   cert-agnostic generators (`CERT_ID=44444444…`) → `wire-lessons.mjs` →
   `is_published=true`. Verify, LinkedIn/OG, blueprint i18n, the secure firewall,
   and the assembler all already handle a third cert for free.
3. **Standardize the suite** — confirm all three at 80 items / 80% (SM pass-mark
   85→80 update is already pending) and resolve SM's 60-min duration if you want
   uniformity.
4. **Package the completion** — a "Scrum Team I — AI" track/bundle (earn all
   three) and, eventually, the **Level-II** ladder rung (advanced/Professional)
   as the next tier above this complete Level-I base.

**Honesty carried forward (same as SPO scheme).** SME-panel validation of this JTA
and weightings, a formal standard-setting study for the cut score, the governance
impartiality structure, and full lesson localization are all **named, not implied
as done.** SD-AI-I ships "built to the ISO/IEC 17024 framework / audit-ready by
design," not accredited.

---

## What's next (production path)

This JTA is the foundation for, in order:

1. **Seed migration `NNN_seed_sd_ai_i.sql`** (next number is **061+**; editor-first)
   — insert the cert row (`44444444-4444-4444-4444-444444444444`, code `SD-AI-I`,
   name "Scrum Developer I — AI", 80 / 80 / 90, `is_published=false`), the 5 domains
   with weights, all 44 tasks with attributes, the ~132 concepts, and the
   `task_concepts` links (reachability baked in at creation, as SPO did in
   migration 045).
2. **`SCHEME-SD-AI-I.md`** — the public certification scheme, mirroring
   `SCHEME-SPO-AI-I.md` §1–11 (purpose/scope, eligibility, body of knowledge,
   competency model, exam structure, pass mark, integrity/firewall, recertification,
   traceability, governance/open-items).
3. **5 modules / 44 lessons** in the lesson DSL, AI-era lessons in every module,
   wired with `wire-lessons.mjs` (projection rule: frontmatter alone is inert).
4. **Question banks** via the cert-agnostic generators: practice
   (`backfill-practice.mjs`, ≥10/lesson, D4 at 12/lesson from the start) and secure
   (`gen-spo-i-secure.mjs` despite its name, `CERT_ID=44444444…`, 8/lang/task), both
   trilingual; **secure writes zero `question_concepts`** (the firewall).
5. **Flip `is_published=true`** once every domain clears its blueprint quota in all
   three languages and the assembler reports a valid form.

Once 1–4 exist, SD-AI-I production is mechanical — the same write-lesson → tag →
generate → wire → ship loop the other two certs run on.

---

*End of JTA — SD-AI-I v1.1 (locked).*
