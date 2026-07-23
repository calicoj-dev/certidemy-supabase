# SPO-AI-I - Job-Task Analysis

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

**Certification:** Scrum Product Owner I — AI  
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
| D1 | Agile Foundations in the AI Era | 12.5% | 10 |
| D2 | The Scrum Framework & AI-Ready Artifacts | 15% | 12 |
| D3 | The Product Owner Accountability & the Scrum Team | 15% | 12 |
| D4 | Product Backlog Management & Spec-Driven Development | 30% | 24 |
| D5 | Product Vision, Value, Roadmap & Strategy | 27.5% | 22 |
| **Total** | | **100%** | **80** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 1 (Remember) | 1 | 1.88% |
| 2 (Understand) | 18 | 36.87% |
| 3 (Apply) | 23 | 52.71% |
| 4 (Analyze) | 4 | 8.54% |

---

# Domain D1 - Agile Foundations in the AI Era (12.5%)

**Description.** The why beneath agile product management, refreshed for the AI era: agile values and principles, empiricism, lean product thinking, why Scrum stays relevant when AI accelerates delivery, and an intro to AI agents and Spec-Driven Development.

**Tasks:** 6  |  **MCQ seats:** 10

## Tasks

### Task 1.1 - Explain the meaning of agile and distinguish it from predictive (waterfall) delivery

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `agile-lifecycle`, `agile-meaning`, `agile-vs-waterfall` |

- **K:** Agile as empirical, iterative-incremental delivery vs predictive plan-then-execute; the agile lifecycle; when each fits.
- **S:** Judge whether a context suits an agile or predictive approach.
- **A:** Comfort with emergence and uncertainty.

### Task 1.2 - Apply the Agile Manifesto values and principles to product decisions

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `agile-manifesto-values`, `agile-principles`, `customer-collaboration` |

- **K:** The four values (precedence of the left) and twelve principles, emphasizing early/continuous value delivery, welcoming change, and business-developer collaboration.
- **S:** Map a product decision to the value or principle that supports it.
- **A:** Value-over-process bias.

### Task 1.3 - Explain the three pillars of empiricism and their role in product decisions

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `empirical-product-decisions`, `empiricism`, `transparency-inspection-adaptation` |

- **K:** Transparency, Inspection, Adaptation; empiricism as the basis for value decisions under uncertainty.
- **S:** Recognize when a product decision lacks an empirical basis.
- **A:** Evidence over opinion.

### Task 1.4 - Explain lean product thinking

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `deferring-commitment`, `lean-product-thinking`, `small-batches` |

- **K:** Flow, small batches, reducing waste, deferring commitment to the last responsible moment; cost of delay; Scrum's lean lineage.
- **S:** Identify waste in a product process.
- **A:** Bias toward small, reversible bets.

### Task 1.5 - Explain why Scrum remains relevant in the AI era and how AI agents impact product development

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-agent-definition`, `ai-impact-product-development`, `scrum-in-ai-era` |

- **K:** What an AI agent is; how agents accelerate throughput; why empiricism and value judgment become more important when building is cheap; Scrum as the empirical wrapper around AI-accelerated work.
- **S:** Articulate the human accountabilities AI does not remove.
- **A:** Grounded realism, neither AI-hype nor AI-dismissal.

### Task 1.6 - Describe Spec-Driven Development and the role of executable specifications

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `executable-specifications`, `intro-agent-executable-stories`, `spec-driven-development` |

- **K:** Spec-Driven Development as writing specs precise enough for agents to execute; the PBI as that specification; the shift from story-as-conversation toward story-as-executable-spec and the tension between them.
- **S:** Recognize what makes a spec executable vs ambiguous.
- **A:** Precision without over-specification.

---

# Domain D2 - The Scrum Framework & AI-Ready Artifacts (15%)

**Description.** Scrum framework essentials through the product lens — theory, team, events, artifacts — plus artifacts as a source of instruction for AI agents and what Done means when an agent did the work.

**Tasks:** 8  |  **MCQ seats:** 12

## Tasks

### Task 2.1 - Describe the Scrum framework and what a product is

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `definition-of-product`, `product-vs-project`, `scrum-framework-overview` |

- **K:** Scrum as a lightweight framework; a product as a vehicle to deliver value with a clear boundary and stakeholders; product-over-project mindset.
- **S:** Define a product's boundary.
- **A:** Product-centric thinking.

### Task 2.2 - Explain the Scrum Team composition and the PO's place in it

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `one-team-no-subteams`, `po-in-scrum-team`, `scrum-team-composition` |

- **K:** One PO, one Scrum Master, and Developers; typically 10 or fewer; no sub-teams; the PO is one person.
- **S:** Apply composition rules to a described team.
- **A:** Small-team comfort.

### Task 2.3 - Explain the three Scrum artifacts and their commitments

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `artifact-commitments`, `backlog-sprintbacklog-increment`, `scrum-artifacts` |

- **K:** Product Backlog to Product Goal; Sprint Backlog to Sprint Goal; Increment to Definition of Done.
- **S:** Match each artifact to its commitment.
- **A:** Transparency orientation.

### Task 2.4 - Explain the five Scrum events from the PO's perspective

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `po-event-participation`, `scrum-events`, `sprint-as-container` |

- **K:** The Sprint as container; Planning, Daily Scrum, Review, Retrospective; where the PO is essential vs supporting.
- **S:** Identify the PO's role in each event.
- **A:** Presence without overreach.

### Task 2.5 - Apply Transparency, Inspection, and Adaptation to artifacts

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `artifact-transparency`, `inspection-adaptation-artifacts`, `transparency-breakdown` |

- **K:** Each artifact must be transparent for inspection to be meaningful; the consequences of low transparency for value decisions.
- **S:** Detect and correct a transparency breakdown in the Product Backlog.
- **A:** Courage to surface inconvenient truths.

### Task 2.6 - Explain how Scrum artifacts serve as a source of instruction for AI agents

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `artifacts-as-ai-instruction`, `pbi-as-agent-input`, `transparency-for-agents` |

- **K:** When agents do work, the backlog, PBIs, and acceptance criteria become the instruction set; ambiguous artifacts produce wrong agent output; transparency serves machines too.
- **S:** Evaluate whether an artifact is clear enough to instruct an agent.
- **A:** Rigor in artifact clarity.

### Task 2.7 - Apply the Definition of Done to an Increment partly built by an AI agent

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `definition-of-done`, `dod-ai-assisted-work`, `dod-applies-to-agent-output` |

- **K:** The DoD applies equally to AI-generated output; output is not Done because an agent produced it; the risk of quietly lowering the DoD because AI is fast.
- **S:** Apply the DoD to an Increment partly built by an agent.
- **A:** No quality double-standard for AI work.

### Task 2.8 - Recognize Scrum framework anti-patterns relevant to the PO

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `absent-po`, `proxy-po`, `scrum-anti-patterns-po` |

- **K:** Proxy/committee PO; absent PO; PO bypassing the team; treating events as status meetings.
- **S:** Diagnose the anti-pattern and prescribe the correction.
- **A:** Diplomatic firmness.

---

# Domain D3 - The Product Owner Accountability & the Scrum Team (15%)

**Description.** Who the PO is and what they are accountable for (maximizing value), and how the role interacts with the SM, Developers, and stakeholders — including the human accountability that persists when AI assists.

**Tasks:** 8  |  **MCQ seats:** 12

## Tasks

### Task 3.1 - Explain the PO's central accountability: maximizing product value

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `maximizing-value`, `po-value-accountability`, `value-from-team-work` |

- **K:** The PO is accountable for maximizing the value of the product resulting from the Scrum Team's work.
- **S:** Distinguish value work from output work.
- **A:** Outcome over output.

### Task 3.2 - Apply the one-Product-Owner rule: a single accountable person, not a committee or a proxy

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `po-decision-authority`, `po-not-committee`, `po-one-person` |

- **K:** One person, not a committee; may represent a committee's desires but the decisions are the PO's; only the PO (or those answering to them) changes the backlog.
- **S:** Apply the one-person rule to a scenario.
- **A:** Ownership of decisions.

### Task 3.3 - Explain the PO's authority over the Product Backlog and the Sprint

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `po-backlog-authority`, `po-sprint-cancellation`, `respecting-po-decisions` |

- **K:** The PO orders the backlog; only the PO can cancel a Sprint; the organization must respect the PO's decisions.
- **S:** Recognize violations of PO authority.
- **A:** Authority held responsibly.

### Task 3.4 - Distinguish PO boundaries from Scrum Master and Developer accountabilities

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `accountability-anti-patterns`, `po-developer-boundary`, `po-sm-boundary` |

- **K:** The PO is not the SM or a project manager; the PO does not assign tasks or dictate the how; Developers own the how and their estimates.
- **S:** Diagnose a boundary violation and prescribe the correction.
- **A:** Restraint.

### Task 3.5 - Explain the PO's collaboration with Developers on the backlog

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `estimates-by-developers`, `po-developer-collaboration`, `refinement-collaboration` |

- **K:** Developers size the work; the PO supplies the why and the ordering; refinement is collaborative.
- **S:** Facilitate productive PO-Developer interaction.
- **A:** Respect for the team's craft.

### Task 3.6 - Determine which value decisions the Product Owner retains when incorporating AI inputs

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `accountability-with-ai`, `ai-does-not-own-value`, `human-held-value-accountability` |

- **K:** AI can draft, suggest, and analyze, but the value decision and accountability remain the PO's; accountability cannot be delegated to an agent; the PO must justify a value decision AI influenced.
- **S:** Retain decision authority while incorporating AI inputs.
- **A:** Accountability that does not hide behind the tool.

### Task 3.7 - Describe the product ecosystem and stakeholder relationships

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `product-ecosystem-actors`, `stakeholders-customers-users`, `voice-of-customer` |

- **K:** Stakeholders, customers, users, sponsors; the PO as the voice of the customer to the team and of the team to stakeholders.
- **S:** Map a product's stakeholder landscape.
- **A:** Boundary-spanning.

### Task 3.9 - Recall that the Product Owner is one accountable person, not a committee

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `po-decision-authority`, `po-not-committee`, `po-one-person` |

- **K:** The Product Owner is ONE PERSON, not a committee. They may represent the desires of many stakeholders, and those wanting to change the Backlog must persuade the Product Owner - but the accountability is single and undivided. The organization must respect their decisions for them to succeed.
- **S:** State the one-person rule and what follows from it.
- **A:** Comfort with holding a single, visible accountability.

---

# Domain D4 - Product Backlog Management & Spec-Driven Development (30%)

**Description.** The core craft: building, ordering, and refining the backlog; PBI, story, and acceptance-criteria quality; estimation; story mapping — and the AI-era evolution: stories as agent-executable specs, AI-assisted refinement, and the feature-factory trap AI amplifies.

**Tasks:** 12  |  **MCQ seats:** 24

## Tasks

### Task 4.1 - Explain the Product Backlog as an emergent, ordered, single source

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `backlog-emergent`, `product-backlog-definition`, `single-product-backlog` |

- **K:** One backlog per product; never complete; dynamic; the single source of work; multiple teams on one product share one backlog.
- **S:** Recognize multi-backlog anti-patterns.
- **A:** Single-source discipline.

### Task 4.2 - Apply Product Backlog ordering to maximize value

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `backlog-ordering`, `cost-of-delay`, `value-based-prioritization` |

- **K:** Ordering by value, risk, dependency, and cost of delay; not all priority is equal; the PO owns the ordering.
- **S:** Order a sample backlog with explicit rationale.
- **A:** Decisiveness under tradeoffs.

### Task 4.3 - Select a well-formed user story, and an epic split that preserves value

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `epics`, `story-splitting`, `user-stories` |

- **K:** Story structure (as-a / I-want / so-that); epics as large stories; vertical splitting that preserves value.
- **S:** Write a well-formed story and split an epic into valuable slices.
- **A:** User-centric framing.

### Task 4.4 - Apply INVEST criteria to PBI quality

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `invest-criteria`, `pbi-quality`, `story-independence` |

- **K:** Independent, Negotiable, Valuable, Estimable, Small, Testable.
- **S:** Evaluate a PBI against INVEST and improve it.
- **A:** A quality bar for backlog items.

### Task 4.5 - Select acceptance criteria that are clear and testable for a described Product Backlog item

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `acceptance-criteria`, `criteria-vs-dod`, `testable-criteria` |

- **K:** Acceptance criteria define done-ness for a specific item, distinct from the DoD which applies to every item; given/when/then style.
- **S:** Write clear, testable acceptance criteria.
- **A:** Precision.

### Task 4.6 - Explain backlog refinement as an ongoing activity

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `backlog-refinement`, `refinement-not-event`, `refinement-ongoing` |

- **K:** Refinement is a continuous activity, not a formal event; it adds detail, estimates, and order.
- **S:** Run effective refinement.
- **A:** Continuous-grooming discipline.

### Task 4.7 - Apply estimation techniques to PBIs

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `estimation-techniques`, `relative-estimation`, `story-points` |

- **K:** Relative estimation, story points, planning poker; estimates owned by Developers; the PO uses them for forecasting, not as commitments.
- **S:** Facilitate estimation and interpret estimates for forecasting.
- **A:** Estimates as forecasts, not promises.

### Task 4.8 - Apply story mapping to structure the backlog

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `backlog-structure`, `story-mapping`, `walking-skeleton` |

- **K:** Story maps as a two-dimensional narrative view; backbone plus slices; the releasable walking skeleton.
- **S:** Build a story map from a product narrative.
- **A:** Whole-journey thinking.

### Task 4.9 - Apply Spec-Driven Development: stories as agent-executable specifications

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `precision-for-agents`, `spec-driven-development-applied`, `stories-as-executable-specs` |

- **K:** When agents execute work, story plus acceptance criteria become the executable spec; the precision bar rises; the gap-filling conversation may not happen with an agent, so the spec must carry the intent.
- **S:** Convert a conversational story into an agent-executable specification without over-constraining the how.
- **A:** Precision balanced with leaving the team room to implement.

### Task 4.10 - Apply AI-assisted backlog refinement

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-assisted-refinement`, `ai-drafted-pbis`, `curating-ai-output` |

- **K:** AI can draft PBIs, suggest splits, surface edge cases, and generate acceptance criteria; the PO curates and stays accountable; the risk of accepting plausible-but-wrong suggestions.
- **S:** Use AI to accelerate refinement while curating for quality.
- **A:** Critical curation, not rubber-stamping.

### Task 4.11 - Use AI for user research and feedback analysis

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-feedback-analysis`, `ai-hypothesis-generation`, `ai-user-research` |

- **K:** AI to synthesize research, cluster feedback, and draft hypotheses; the PO validates and decides; correlation vs causation; bias in AI synthesis.
- **S:** Turn AI-analyzed feedback into validated backlog candidates.
- **A:** Validate before acting.

### Task 4.12 - Recognize the feature waiter anti-pattern amplified by AI agents

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-amplified-feature-factory`, `feature-waiter-anti-pattern`, `strategy-over-throughput` |

- **K:** The feature-waiter / order-taker PO who relays requests; AI making feature churn cheaper amplifies the feature-factory trap; why vision and value discrimination matter more when output is cheap.
- **S:** Diagnose feature-factory behavior and redirect toward value and outcomes.
- **A:** Strategic backbone; the discipline to say no.

---

# Domain D5 - Product Vision, Value, Roadmap & Strategy (27.5%)

**Description.** The strategic half of the role: vision, the Product Goal, value maximization and measurement, roadmaps, forecasting and release planning, business strategy, and stakeholders — with AI woven into roadmap and strategic analysis, and the argument that vision matters more in the AI era.

**Tasks:** 12  |  **MCQ seats:** 22

## Tasks

### Task 5.1 - Select a product vision that fits a described context, and distinguish it from a goal or a feature list

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `product-vision`, `vision-alignment`, `vision-communication` |

- **K:** Vision as the north star; aligning development with long-term goals; communicating vision to team and stakeholders.
- **S:** Craft and articulate a compelling vision.
- **A:** Inspirational clarity.

### Task 5.2 - Explain the Product Goal as a commitment to the Product Backlog

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `product-goal`, `product-goal-commitment`, `product-goal-vs-sprint-goal` |

- **K:** The Product Goal is the commitment for the Product Backlog; a single objective; one at a time; its relationship to Sprint Goals.
- **S:** Write a coherent Product Goal and relate Sprint Goals to it.
- **A:** Goal-orientation.

### Task 5.3 - Apply value-maximization concepts and ROI

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `roi`, `value-maximization`, `value-vs-cost` |

- **K:** Maximizing value/ROI; value is multi-dimensional (revenue, cost savings, risk reduction, learning); avoiding output-as-value.
- **S:** Argue for an option on value/ROI grounds.
- **A:** Value discrimination.

### Task 5.4 - Measure product value and outcomes

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `evidence-based-management`, `outcome-vs-output-metrics`, `value-metrics` |

- **K:** Outcome metrics over output metrics; leading vs lagging; Evidence-Based Management dimensions (current value, unrealized value, ability to innovate, time to market) at a foundational level.
- **S:** Choose meaningful value metrics for a given product.
- **A:** Measure what matters.

### Task 5.5 - Apply forecasting and release planning

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `cone-of-uncertainty`, `forecasting`, `release-planning` |

- **K:** Forecasting from velocity/throughput; the cone of uncertainty; release burndown; forecasts are probabilistic, not promises; the PO tracks progress at least each Review.
- **S:** Produce a release forecast and communicate its uncertainty.
- **A:** Honesty about uncertainty.

### Task 5.6 - Determine an outcome-based roadmap structure for a described product context

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `outcome-based-roadmap`, `product-roadmap`, `roadmap-vs-plan` |

- **K:** The roadmap as outcome-oriented intent over time, not a fixed feature schedule; now/next/later; revisiting as you learn.
- **S:** Construct an outcome-based roadmap.
- **A:** Adaptive planning.

### Task 5.7 - Align product decisions to business strategy

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `business-strategy-alignment`, `product-strategy`, `strategy-to-execution` |

- **K:** Bridging business strategy and execution; aligning product decisions to strategic goals; the PO as strategy translator.
- **S:** Connect a backlog decision to a strategic objective.
- **A:** Strategic framing.

### Task 5.8 - Manage stakeholders and collaborate across the ecosystem

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `managing-conflicting-priorities`, `stakeholder-management`, `stakeholder-transparency` |

- **K:** Identifying and engaging stakeholders; managing conflicting priorities; transparency with stakeholders; the Sprint Review as the key inspection point.
- **S:** Navigate conflicting stakeholder demands toward value.
- **A:** Diplomatic and value-anchored.

### Task 5.9 - Facilitate the Sprint Review as the PO's key value-inspection event

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per Sprint |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `review-not-demo`, `sprint-review`, `value-inspection` |

- **K:** The Review is a working session to inspect the Increment and adapt the backlog with stakeholders, not a one-way demo; collaborating on what could be done next to optimize value.
- **S:** Run a value-focused Sprint Review.
- **A:** Collaboration over presentation.

### Task 5.10 - Apply AI to roadmap construction and strategic analysis

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-roadmap-construction`, `ai-scenario-modeling`, `ai-strategic-analysis` |

- **K:** AI to draft roadmap options, model scenarios, and surface dependencies and risks; the PO sets strategy and decides; AI as analyst, not strategist.
- **S:** Use AI to generate roadmap options, then exercise strategic judgment.
- **A:** Strategy stays human.

### Task 5.11 - Explain why strategic vision is more critical in the AI era

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `strategic-vision-ai-era`, `value-discrimination-cheap-output`, `vision-as-differentiator` |

- **K:** When AI makes building cheap and fast, the scarce skill becomes deciding what is worth building; vision and value discrimination are the PO's durable differentiators; the risk of accelerating in the wrong direction.
- **S:** Explain why value discrimination becomes the scarce skill when building becomes cheap.
- **A:** Long-game strategic conviction.

### Task 5.12 - Diagnose why a product that is shipping steadily is still not creating value

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `ai-amplified-feature-factory`, `evidence-based-management`, `maximizing-value`, `outcome-vs-output-metrics`, `value-metrics` |

- **K:** Output is not outcome. A product can ship on cadence, refine its backlog, keep its roadmap current and satisfy its Definition of Done, and still create no value - and every output metric will look healthy while it happens. The symptoms are quiet: features ship and usage does not move; customers adopt and do not return; the team is fast and the business result is flat. AI makes this failure CHEAPER TO COMMIT and therefore more common: when building is fast, building the wrong thing is fast too. The three causes look alike from the outside and demand different remedies - the wrong PROBLEM was solved (go back to discovery); the right problem was solved with the wrong SOLUTION (re-approach the design); or the right solution was built and poorly ADOPTED (fix onboarding, positioning, access).
- **S:** Reason from ambiguous outcome data to the underlying cause: distinguish solving the wrong problem from solving the right problem badly from building the right thing nobody could adopt. Each has a different remedy, and prescribing the wrong one wastes a quarter.
- **A:** The discipline to ask "did this create value?" when every output metric says yes, and to keep asking until the real cause surfaces.

---

*Generated 2026-07-23 by scripts/gen-jta-doc.mjs from certification SPO-AI-I (33333333-3333-3333-3333-333333333333).*
