> ## SUPERSEDED FOR ALL FACTUAL CONTENT
>
> **The authoritative JTA for SM-AI-I is `jta/SM-AI-I_JTA_generated.md`**, rendered
> from the live database by `scripts/gen-jta-doc.mjs`. Regenerate it rather than
> reading or editing the tables below.
>
> Measured on 2026-07-23, this document disagrees with the database on
> **9 task statement(s)** and is **missing 9 task(s)** entirely. Its exam
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
> has not been moved yet. It will be extracted into `SM-AI-I_JTA_narrative.md`,
> after which this file is archived. Until then, read it for the *why* and never for
> the *what*.

---
# SM-I — Job-Task Analysis (v2.1)

**Document version:** 2.1
**Status:** Locked. This is the basis for content production.
**Certification:** Certidemy Scrum Master I (SM-I) — proprietary, issued by Certidemy
**Authority:** 2020 Scrum Guide (Schwaber \& Sutherland) — primary
**Last updated:** June 18, 2026 (v2.1 — renamed SMPC→SM-I, reframed issuer to Certidemy, terminology drift made provider-neutral; D6 reconcile still pending)

\---

## ⚠ Reconcile note (v2.1)

This document was authored when SM-I was conceived as **CertiProf SMPC exam prep**. Two gaps remain that a rename alone does not close:

1. **D6 (AI / agentic Scrum) is NOT documented here.** The live database carries a **6th domain, D6**, added after this JTA was authored (~7 tasks on AI-augmented Scrum Mastery). This doc still describes the original **5 domains / 44 tasks**. Reconciling requires pulling D6's actual tasks + concepts from the DB and appending them — it should not be reconstructed from memory. **Until then, treat the domain/task counts below as the pre-D6 baseline, not the current DB state.** (For comparison, the newer SPO-I cert weaves AI through all domains rather than isolating it — the preferred model going forward.)
2. **Exam facts are stale.** The "Exam facts" table below reads **40 questions / 80% / 60 min** — those are the *original CertiProf SMPC* numbers this JTA was authored against. The live Certidemy SM-I cert is **80 questions / 85% pass / 60 min** (per the DB). Treat the table as historical; the DB is canonical.

3. **Exam-target positioning.** SM-I is now a Certidemy-issued proprietary credential (`provider='Certidemy'`). Terminology-drift content has been made provider-neutral (legacy Scrum materials vs. the 2020 Guide). If SM-I is still specifically intended to prep for **CertiProf's** external exam, the exam-target framing should be restored — that is a strategic decision, not a doc cleanup.

\---

## Changes from v1

1. Collapsed to **5 domains** (folded Scaling into Domain 5)
2. Rebalanced weights: **12.5 / 22.5 / 25 / 17.5 / 22.5**
3. Added concepts: `cynefin-framework`, `burndown-charts`, `velocity`, `invest-criteria`, `estimation-techniques`, `servant-vs-true-leader`, `ceremonies-vs-events-terminology`, `refinement-as-activity`
4. **Bloom ceiling at 4 (Analyze)** for MCQs; Bloom 5-6 reserved for AI simulations (Phase 2)
5. Added **terminology drift** tasks per domain — explicit teaching of where legacy Scrum materials use deprecated terms
6. Added **`is\_exam\_scope`** distinction on every task: exam-scope vs. mastery-deep
7. Tagged **simulation candidates** for future AI-driven Evaluate/Create content
8. Updated SM-I `passing\_score\_pct` from 70% to **80%** (verified: 32/40)

\---

## Exam facts (verified)

|Attribute|Value|
|-|-|
|Format|Multiple choice, online|
|Questions|40|
|Duration|60 minutes|
|Passing score|80% (32/40 correct)|
|Open/closed book|Closed book|
|Attempts|1 included; retake purchasable|
|Source material|2020 Scrum Guide, Agile Manifesto, Agile Alliance Glossary, *Essential Scrum* (Kenneth Rubin)|
|Languages offered|English, Spanish, Portuguese, others|

\---

## Domain structure (locked)

|#|Domain|Weight|MCQ count (of 40)|
|-|-|-|-|
|1|Agile Foundations \& Empirical Thinking|12.5%|5|
|2|The Scrum Team \& Accountabilities|22.5%|9|
|3|Scrum Events|25.0%|10|
|4|Scrum Artifacts \& Commitments|17.5%|7|
|5|Scrum Master in Practice \& Organizational Context|22.5%|9|
|**Total**||**100%**|**40**|

### Rationale

* **Domain 3 (Events) gets the largest slice (25%)** because events are the most testable component — concrete, timeboxed, well-defined attendees and purposes. Triangulation across Grok, Gemini, and PSM I patterns put Events between 20-30%; 25% is our centered estimate.
* **Domain 2 (Team) and Domain 5 (Practice) tied at 22.5%** because together they own the Scrum Master role. Domain 2 is the formal definition; Domain 5 is the lived practice.
* **Domain 4 (Artifacts) at 17.5%** — the 2020 Scrum Guide added commitments as first-class concepts, which the exam tests, but artifacts are conceptually leaner than events.
* **Domain 1 (Foundations) at 12.5%** — small but non-negotiable. Empiricism and Agile principles underpin everything else but get fewer direct questions.

\---

## Bloom's Taxonomy distribution (MCQ target)

Across all 40 questions:

|Bloom level|Target %|Question count|Style|
|-|-|-|-|
|1 — Remember|15%|6|Direct recall ("What is the timebox for the Daily Scrum?")|
|2 — Understand|35%|14|Explanation/comparison ("Why does Scrum prescribe a Sprint Goal?")|
|3 — Apply|35%|14|Short scenarios ("A developer says X. What should the SM do?")|
|4 — Analyze|15%|6|Multi-step scenarios with diagnosis|
|5-6 — Evaluate/Create|0% in MCQs|0|**Reserved for AI simulations (Phase 2)**|

**Why this is more rigorous than typical entry-level Scrum Master exams:** Most certification prep platforms train almost exclusively at Levels 1-2 because those are easiest to write. By placing 50% of questions at Apply/Analyze, Certidemy learners over-prepare for any entry-level exam. The marketing claim: *Train to a higher standard than the test.*

\---

## Scrum terminology drift (legacy vs. 2020 Guide)

The Scrum Guide 2020 is canonical, but legacy Scrum prep materials (and older trainers) sometimes lag in terminology. Our content teaches the Scrum Guide as authoritative, then flags drift as exam-tip callouts.

|Scrum Guide 2020 (canonical)|Legacy materials sometimes use|Our content position|
|-|-|-|
|Accountabilities|Roles|Teach "accountabilities"; note "roles" is deprecated|
|Self-managing|Self-organizing|Teach "self-managing"; flag the 2017→2020 shift|
|Events|Ceremonies|Teach "events"; note "ceremonies" is legacy|
|True leaders who serve|Servant leaders|Teach both; explain servant leadership concept remains|
|(No specific charts prescribed)|Burndown charts, velocity|Teach as common practice; note Guide is tool-agnostic|
|Refinement (as activity, not event)|Refinement (sometimes treated as event)|Teach as ongoing activity, not a formal event|

These drift points become specific tasks (5.7 below) and dedicated exam-tip callouts in lessons.

\---

# Domain 1 — Agile Foundations \& Empirical Thinking (12.5%)

**Description.** The "why" beneath Scrum. Agile values and principles, the three pillars of empiricism, the five Scrum values, lean thinking, and the Cynefin framework as a way to identify when Scrum is appropriate. Without this foundation, Domains 2-5 are just rules to memorize.

**Estimated module mapping:** Modules 1 \& 2 (Foundations of Agile, Empiricism \& Scrum Values)

## Tasks

### Task 1.1 — Articulate the Agile Manifesto's four values and twelve principles

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`agile-values`, `agile-principles`|

**KSAs:**

* **K:** Manifesto text; 4 values; 12 principles; origin (Snowbird, 2001)
* **S:** Map a real situation to a specific principle
* **A:** Reading between the lines — recognizing when a behavior aligns or violates a value

\---

### Task 1.2 — Explain the three pillars of empirical process control (Transparency, Inspection, Adaptation)

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`empirical-process`, `transparency`, `inspection`, `adaptation`|

**KSAs:**

* **K:** Definitions of all three pillars; interdependence (inspection without transparency is misleading; adaptation without inspection is pointless)
* **S:** Diagnose which pillar is broken in a described scenario
* **A:** Comfort with iterative course-correction; intellectual honesty

\---

### Task 1.3 — Identify the five Scrum Values in workplace behaviors

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`scrum-values`|

**KSAs:**

* **K:** Commitment, Courage, Focus, Openness, Respect
* **S:** Recognize which value is being lived (or violated) in a scenario
* **A:** Modeling values personally; calling them out when missing

\---

### Task 1.4 — Distinguish complex problems suited to Scrum from problems suited to predictive approaches

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`cynefin-framework`, `complex-vs-complicated`, `empirical-vs-predictive`|

**KSAs:**

* **K:** Cynefin framework (simple / complicated / complex / chaotic); when waterfall makes sense; when iteration is required
* **S:** Categorize a real problem accurately
* **A:** Resisting "Scrum for everything" anti-pattern

\---

### Task 1.5 — Explain lean thinking principles as they apply to Scrum

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`lean-thinking`, `iterative-incremental`|

**KSAs:**

* **K:** Small batches, flow, reducing waste, deferred commitment; Scrum's lean lineage
* **S:** Identify waste in a Scrum implementation
* **A:** Bias toward smaller/simpler

\---

### Task 1.6 — Recognize when transparency is compromised and trace consequences

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Daily|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Simulation candidate|**Yes** — "Find the Transparency Breakdown" simulation|
|Concept slugs|`transparency`, `artifact-transparency`|

**KSAs:**

* **K:** What transparent artifacts look like; common ways teams hide work or progress
* **S:** Identify hidden information or inflated status reports
* **A:** Courage to surface uncomfortable truths

\---

# Domain 2 — The Scrum Team \& Accountabilities (22.5%)

**Description.** Who is on a Scrum Team, what each accountability owns, and how they interact. Heavy emphasis on the Scrum Master's accountabilities since this is the certification's namesake role.

**Estimated module mapping:** Modules 3, 4, 5 (The Scrum Team, The Scrum Master in Depth, The Product Owner and Developers)

## Tasks

### Task 2.1 — Define the Scrum Team's composition and size constraints

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|1 (Remember)|
|Exam-scope|Yes|
|Concept slugs|`scrum-team-composition`, `team-size`|

**KSAs:**

* **K:** One PO + one SM + Developers; typically ≤ 10 people; no sub-teams or hierarchies
* **S:** Apply the rule to a described team structure
* **A:** Comfort with small teams

\---

### Task 2.2 — Explain the Scrum Master's accountability for the Scrum Team's effectiveness

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`sm-accountability-team-effectiveness`|

**KSAs:**

* **K:** "Effectiveness" is the Scrum Master's central accountability per the 2020 Guide
* **S:** Distinguish effectiveness work from project management work
* **A:** Outcome focus over output focus

\---

### Task 2.3 — List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|1 (Remember)|
|Exam-scope|Yes|
|Concept slugs|`sm-serves-team`, `sm-serves-po`, `sm-serves-org`|

**KSAs:**

* **K:** The four ways SM serves the team, the four ways SM serves the PO, the four ways SM serves the org (verbatim from Scrum Guide 2020)
* **S:** Identify which service is being performed in a scenario
* **A:** Service mindset

\---

### Task 2.4 — Explain the Product Owner's accountability for maximizing product value

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Weekly|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`po-accountability`, `product-value`, `po-one-person`|

**KSAs:**

* **K:** PO is one person, not a committee; accountable for Product Backlog ordering, Product Goal, communication to stakeholders
* **S:** Recognize when a "Product Owner by committee" pattern emerges
* **A:** Respect for value-based decision making

\---

### Task 2.5 — Explain the Developers' four accountabilities

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`developer-accountability`|

**KSAs:**

* **K:** Creating Sprint Backlog; instilling quality via DoD; adapting plan toward Sprint Goal; holding each other accountable
* **S:** Recognize when developers are dodging accountability
* **A:** Peer accountability (not boss accountability)

\---

### Task 2.6 — Apply "self-managing" to a described team scenario

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`self-managing`, `self-organizing-deprecated`|

**KSAs:**

* **K:** 2020 shift from "self-organizing" (who and how) to "self-managing" (who, how, **what**); deprecation note
* **S:** Identify when a team is being managed externally vs. self-managing
* **A:** Releasing control as a Scrum Master

\---

### Task 2.7 — Identify accountability boundary violations

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Simulation candidate|**Yes** — "Who Should Do This?" branching scenario|
|Concept slugs|`accountability-boundaries`, `sm-vs-pm-anti-pattern`|

**KSAs:**

* **K:** Common violations: SM ordering backlog, PO assigning tasks, developers ignoring DoD, manager attending Daily Scrum
* **S:** Diagnose the boundary violation and prescribe the correction
* **A:** Diplomatic but firm

\---

### Task 2.8 — Explain cross-functionality as a property of the whole Scrum Team

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`cross-functional`, `t-shaped-skills`|

**KSAs:**

* **K:** Cross-functional means the team has all skills needed to deliver value; not every individual is full-stack
* **S:** Recognize when an apparent skills gap is really a team-formation problem
* **A:** Hiring/staffing for whole-team skill coverage

\---

### Task 2.9 — Recognize that "Developer" applies to any team member, not just software engineers

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|1 (Remember)|
|Exam-scope|Yes|
|Concept slugs|`developer-broad-definition`|

**KSAs:**

* **K:** 2020 Guide explicitly removed software-specific language; "Developer" = anyone contributing to the Increment
* **S:** Apply Scrum outside software domains
* **A:** Inclusive framing

\---

# Domain 3 — Scrum Events (25%)

**Description.** The five Scrum events. Each event's timebox, attendees, purpose, and output. The most heavily-tested domain because events are concrete and easy to construct questions around.

**Estimated module mapping:** Modules 6 \& 7 (The Sprint and Sprint Planning; Daily Scrum, Review, Retrospective)

## Tasks

### Task 3.1 — State the maximum timebox for each event

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Daily|
|Bloom level|1 (Remember)|
|Exam-scope|Yes|
|Concept slugs|`timeboxes`|

**KSAs:**

* **K:** Sprint ≤ 1 month; Sprint Planning ≤ 8 hours (for 1-month Sprint); Daily Scrum 15 minutes; Sprint Review ≤ 4 hours; Sprint Retrospective ≤ 3 hours
* **S:** Apply proportional rule: shorter Sprints → proportionally shorter Planning/Review/Retro
* **A:** Timebox discipline

\---

### Task 3.2 — Explain the Sprint as the container for all other events

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`sprint`, `sprint-container`|

**KSAs:**

* **K:** Sprints are fixed-length, no gaps between Sprints, all other events occur within
* **S:** Identify violations (e.g., gaps between Sprints, extending a Sprint)
* **A:** Cadence respect

\---

### Task 3.3 — Identify the three topics of Sprint Planning (Why, What, How)

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Per-Sprint|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`sprint-planning`, `sprint-planning-topics`, `sprint-goal-crafting`|

**KSAs:**

* **K:** Why → Sprint Goal (NEW emphasis in 2020); What → Product Backlog selection; How → plan for delivery
* **S:** Diagnose Sprint Plannings that skip Why
* **A:** Holding space for purpose, not just task-listing

\---

### Task 3.4 — Explain the Daily Scrum's purpose and rules

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`daily-scrum`, `daily-scrum-purpose`|

**KSAs:**

* **K:** 15-minute timebox; Developers only (SM/PO attend only if working as Developers); inspect progress toward Sprint Goal; produce actionable plan for next day; structure is up to Developers
* **S:** Reject anti-patterns (status report to manager, SM-led standup)
* **A:** Stepping back to let team own it

\---

### Task 3.5 — Describe the Sprint Review as a working session, not a status report

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Per-Sprint|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`sprint-review`, `sprint-review-vs-demo`|

**KSAs:**

* **K:** Inspect Increment with stakeholders; adapt Product Backlog if needed; not a demo; not a sign-off
* **S:** Run a Review that produces backlog changes, not just claps
* **A:** Inviting genuine feedback, not seeking approval

\---

### Task 3.6 — Describe the Sprint Retrospective's focus on team process

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Per-Sprint|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|**Yes** — "Facilitate the Retrospective" simulation|
|Concept slugs|`sprint-retrospective`, `retrospective-format`, `retrospective-actions`|

**KSAs:**

* **K:** Inspect Scrum Team itself (people, relationships, processes, tools); identify improvements; produce actionable plan; often add at least one improvement to next Sprint Backlog
* **S:** Run formats (Liked/Learned/Lacked, Start/Stop/Continue, 4Ls, sailboat); turn observations into experiments
* **A:** Psychological safety; vulnerability-led leadership

\---

### Task 3.7 — Identify when a Sprint can be canceled and by whom

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|1 (Remember)|
|Exam-scope|Yes|
|Concept slugs|`sprint-cancellation`|

**KSAs:**

* **K:** Only the Product Owner can cancel a Sprint; happens when Sprint Goal becomes obsolete; cancellation is rare and traumatic
* **S:** Recognize when cancellation is genuinely warranted vs. when it's overreaction
* **A:** Restraint with the cancellation lever

\---

### Task 3.8 — Apply timebox rules to scenarios

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`timeboxes`, `timebox-violations`|

**KSAs:**

* **K:** Timeboxes are maxima, not targets; events can end early; events must NOT exceed their timebox
* **S:** Calculate proportional timeboxes for non-standard Sprint lengths
* **A:** Comfort with "finished early — let's stop"

\---

### Task 3.9 — Distinguish the Sprint Goal from the Product Backlog items selected for the Sprint

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Per-Sprint|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Concept slugs|`sprint-goal`, `goal-vs-items`|

**KSAs:**

* **K:** Sprint Goal is the singular objective; selected PBIs are the means; if circumstances change, PBIs change while the Goal remains
* **S:** Write a Sprint Goal that's coherent and outcome-focused, not a task list
* **A:** Goal-orientation over task-orientation

\---

### Task 3.10 — Recognize event anti-patterns

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Daily|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Simulation candidate|**Yes** — "Find the Anti-Pattern" lesson|
|Concept slugs|`event-anti-patterns`, `daily-scrum-status-report`, `review-as-demo`, `retro-blame-game`|

**KSAs:**

* **K:** Daily Scrum as status to manager; Sprint Review as one-way demo; Retrospective as blame session; Planning that skips Why
* **S:** Diagnose the anti-pattern and prescribe the correction
* **A:** Naming uncomfortable patterns kindly but clearly

\---

# Domain 4 — Scrum Artifacts \& Commitments (17.5%)

**Description.** The three artifacts (Product Backlog, Sprint Backlog, Increment) and the three commitments added in the 2020 Scrum Guide (Product Goal, Sprint Goal, Definition of Done). Backlog refinement as an ongoing activity (not an event). Optional but commonly-tested topics: burndown charts, velocity, INVEST.

**Estimated module mapping:** Module 8 (Artifacts and Commitments)

## Tasks

### Task 4.1 — Identify each artifact's commitment

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|1 (Remember)|
|Exam-scope|Yes|
|Concept slugs|`commitments`, `product-goal`, `sprint-goal`, `definition-of-done`|

**KSAs:**

* **K:** Product Backlog → Product Goal; Sprint Backlog → Sprint Goal; Increment → Definition of Done
* **S:** Map artifact to its commitment instantly
* **A:** Internalizing the 2020 commitments addition

\---

### Task 4.2 — Explain the Product Backlog as an emergent, ordered list owned by the PO

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Weekly|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`product-backlog`, `product-backlog-ordering`, `product-backlog-ownership`|

**KSAs:**

* **K:** Single source of work; ordered (not just prioritized); never "complete"; PO accountable for content + ordering
* **S:** Identify when ordering logic is broken (alphabetical, by team preference, by stakeholder loudness)
* **A:** Value-based prioritization

\---

### Task 4.3 — Explain that the Sprint Backlog is created by and for the Developers

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Per-Sprint|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`sprint-backlog`, `sprint-backlog-ownership`|

**KSAs:**

* **K:** Sprint Backlog = Sprint Goal + selected PBIs + plan; updated daily by Developers
* **S:** Recognize when a Sprint Backlog is being managed externally
* **A:** Hands-off from the SM

\---

### Task 4.4 — Define the Increment and the Definition of Done

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Per-Sprint|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|**Yes** — "Write a DoD" coaching simulation|
|Concept slugs|`increment`, `definition-of-done`, `dod-creation`|

**KSAs:**

* **K:** Increment is a usable step toward the Product Goal; must meet the DoD to be an Increment at all; multiple Increments may be created in a Sprint; DoD is created by the **Scrum Team** (2020 change — previously Developers alone); organizational standards may set a minimum DoD
* **S:** Apply DoD to determine if work is "done"; help team write a DoD
* **A:** Quality bar discipline

\---

### Task 4.5 — Apply the DoD to determine completion

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Per-Sprint|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`dod-application`|

**KSAs:**

* **K:** Anything not meeting DoD is not an Increment, returns to Product Backlog
* **S:** Distinguish "done" from "done-done from "almost done"
* **A:** Discomfort tolerance — saying "not done"

\---

### Task 4.6 — Explain the Product Goal as the long-term objective

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Weekly|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`product-goal`, `product-goal-relationship-to-sprint-goal`|

**KSAs:**

* **K:** Product Goal lives in the Product Backlog; each Sprint should bring the product closer; only one Product Goal at a time
* **S:** Recognize when sprints are drifting from the Product Goal
* **A:** Long-arc thinking

\---

### Task 4.7 — Distinguish artifact transparency from artifact perfection

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|Medium|
|Frequency|Daily|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Concept slugs|`artifact-transparency`, `imperfect-but-transparent`|

**KSAs:**

* **K:** Artifacts can be partial, rough, or evolving — and still transparent
* **S:** Coach a team out of "we can't show stakeholders until it's polished"
* **A:** Vulnerability with rough work

\---

### Task 4.8 — Explain refinement as an ongoing activity (NOT a formal event)

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|Medium|
|Frequency|Weekly|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`refinement-as-activity`, `refinement-not-event`|

**KSAs:**

* **K:** Refinement breaks PBIs into smaller items, adds detail, estimates; NOT a Scrum event; happens whenever the team needs it
* **S:** Avoid the anti-pattern of "Refinement Meeting" treated as a sixth event
* **A:** Comfort with embedded activities

\---

### Task 4.9 — Interpret burndown charts and velocity metrics (common exam emphasis)

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|Medium|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`burndown-charts`, `velocity`, `metrics-not-targets`|

**KSAs:**

* **K:** Burndowns show remaining work over time; velocity = points completed per Sprint; both are forecasting tools, not performance metrics; the Scrum Guide is tool-agnostic but these are commonly tested
* **S:** Read a burndown and identify what's happening (scope creep, late completion, etc.)
* **A:** Resisting "velocity as productivity score"

\---

### Task 4.10 — Apply INVEST criteria to Product Backlog Items

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|Medium|
|Frequency|Weekly|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`invest-criteria`, `pbi-quality`|

**KSAs:**

* **K:** INVEST = Independent, Negotiable, Valuable, Estimable, Small, Testable
* **S:** Identify which letter a poor PBI fails on
* **A:** Constructive editing of others' work

\---

# Domain 5 — Scrum Master in Practice \& Organizational Context (22.5%)

**Description.** Everything that's not framework definition: facilitation, coaching stances, impediment removal, conflict, psychological safety, organizational adoption, scaling (lightly), and the terminology drift between legacy Scrum materials and the 2020 Scrum Guide. This is where Certidemy's content goes deeper and where adaptive depth pays off.

**Estimated module mapping:** Modules 9 \& 10 (The Scrum Master in Practice; Scaling and Adoption)

## Tasks

### Task 5.1 — Identify impediments and choose removal strategies

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|**Yes** — "Impediment Triage" simulation|
|Concept slugs|`impediment-management`, `impediment-types`|

**KSAs:**

* **K:** Internal vs. external impediments; SM "causes the removal" — not always personally; escalation paths
* **S:** Categorize an impediment and pick the right response (coach team to resolve / escalate / personally remove)
* **A:** Persistence; comfort with bureaucratic friction

\---

### Task 5.2 — Distinguish impediments from problems the team should resolve themselves

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Daily|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Concept slugs|`impediment-vs-problem`, `team-ownership`|

**KSAs:**

* **K:** Self-managing teams should handle their own problems; SM intervention undermines self-management
* **S:** Resist the urge to fix everything; ask "is this their problem or mine?"
* **A:** Restraint; coaching reflex over fixing reflex

\---

### Task 5.3 — Coach a Scrum Team toward greater self-management

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Weekly|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|**Yes** — "Coach the Team" simulation (Bloom 5)|
|Concept slugs|`coaching-self-management`, `coaching-stances`|

**KSAs:**

* **K:** Four coaching stances (teach / mentor / coach / facilitate); powerful questions; when to use each
* **S:** Pick the right stance for a moment; ask powerful questions
* **A:** Patience; comfort with silence

\---

### Task 5.4 — Apply servant leadership behaviors (NOTE: "true leaders who serve")

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`servant-leadership`, `true-leadership`, `servant-vs-true-leader`|

**KSAs:**

* **K:** Servant leadership concept (Greenleaf, 1970); 2020 Guide language shift to "true leaders who serve"; the substance is the same
* **S:** Recognize servant-leadership behaviors (listening, empathy, healing, awareness, persuasion, conceptualization, foresight, stewardship, commitment to growth, community)
* **A:** Influence without authority; ego subordination

\---

### Task 5.5 — Recognize psychological safety and how SM behavior affects it

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|Medium|
|Frequency|Daily|
|Bloom level|4 (Analyze)|
|Exam-scope|Yes|
|Concept slugs|`psychological-safety`, `team-trust`|

**KSAs:**

* **K:** Amy Edmondson's research; signs of low safety (silence, blame, defensiveness); how SM behavior shifts safety up or down
* **S:** Diagnose safety issues without naming them as such; nudge behavior to rebuild
* **A:** Emotional intelligence; self-awareness

\---

### Task 5.6 — Coach the Product Owner

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Weekly|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`coaching-po`, `po-coaching-techniques`|

**KSAs:**

* **K:** PO common struggles: too far from team, too close to team, "by committee," poor Product Goal articulation, stakeholder pressure
* **S:** Coach without taking ownership; help PO build their own capabilities
* **A:** Respect for PO's authority; resisting "be the PO yourself"

\---

### Task 5.7 — Navigate legacy vs. 2020 Scrum Guide terminology drift (EXAM TIP)

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|Medium|
|Frequency|Per-Exam|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`ceremonies-vs-events-terminology`, `self-organizing-vs-self-managing`, `servant-vs-true-leader`|

**KSAs:**

* **K:** Where legacy Scrum materials use deprecated terms ("ceremonies," "self-organizing," "servant-leader"); which is canonical (Scrum Guide 2020 wins)
* **S:** Translate between the two on the exam
* **A:** Patience with terminology lag

\---

### Task 5.8 — Coach the organization on Scrum adoption

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Concept slugs|`org-coaching`, `scrum-adoption`, `org-impediments`|

**KSAs:**

* **K:** Common organizational impediments (functional silos, command-and-control management, project-based funding, performance metrics that punish collaboration); how SM "leads, trains, and coaches" the organization
* **S:** Pick battles; persuade upward without burning credibility
* **A:** Political savvy; long-game patience

\---

### Task 5.9 — Apply scaling principles at a foundational level

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|Low|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Concept slugs|`scaling-multiple-teams`, `single-product-owner-rule`, `scaling-frameworks-overview`|

**KSAs:**

* **K:** Multiple Scrum Teams on one product share one Product Backlog, one Product Owner, one Product Goal; awareness of major scaling frameworks (Nexus, SAFe, LeSS) without deep dive
* **S:** Recognize anti-patterns ("two teams, two backlogs, same product")
* **A:** Knowing what you don't know about scaling

\---

## Summary statistics

* **5 domains**
* **44 tasks total** (Domain 1: 6 | Domain 2: 9 | Domain 3: 10 | Domain 4: 10 | Domain 5: 9)
* **6 simulation candidates** flagged for Phase 2 (Bloom 5-6 AI interactions)
* **8 high-criticality tasks** specifically about boundary violations and anti-patterns (where Scrum implementations fail)
* **3 explicit terminology-drift tasks** (Tasks 2.6, 5.4, 5.7) so learners aren't blindsided by legacy phrasing

\---

## What's next

This JTA becomes the foundation for:

1. **Migration 003** — `domains`, `tasks`, and related tables/columns; insert all 5 domains and 44 tasks above
2. **Lesson authoring spec** — markdown DSL for sectioned, dual-renderer lessons
3. **Lesson 1 (Module 1, Lesson 1)** — "The Agile Manifesto" written in the DSL, mapped to Task 1.1, as the production template
4. **Question bank scaffold** — \~150 questions across all 44 tasks, distributed by Bloom level and weighted by domain

Once those four exist, content production is mechanical: write lesson → tag tasks → generate questions → ship.

