# SPO-I — Job-Task Analysis (v1.1)

**Document version:** 1.1
**Status:** LOCKED. This is the basis for content production.
**Certification:** Certidemy Scrum Product Owner I (SPO-I) — AI-ready
**Authority:** 2020 Scrum Guide (Schwaber & Sutherland) — primary
**Supporting sources:** Agile Manifesto (4 values, 12 principles); Agile Alliance Glossary; *Essential Scrum* (Kenneth Rubin); *The Professional Product Owner* (McGreal & Jocham)
**Last updated:** June 18, 2026 (v1.1 — locked 80% pass, added reading legend + signature-AI headline + strategic-spine cross-reference)

---

## Design decisions (why this JTA looks the way it does)

1. **AI is woven through the domains, not isolated.** Unlike SM-I (where AI became a bolted-on 6th domain, D6), SPO-I designs AI into the blueprint from line one — AI-augmented competencies live *inside* the relevant role domains. This mirrors the market leader we're aligning to (CertMind's "Scrum Product Owner – Inteligencia Artificial"), and it's more honest: an AI-ready Product Owner *uses* AI inside backlog and value work; it isn't a separate skill. **11 of the 44 tasks are AI-integrated, spread across all 5 domains.**

2. **Alignment target is the AI-native CertMind blueprint, not CertiProf's traditional SPOPC.** CertiProf's SPOPC contains zero AI content; CertMind's is AI-native and is the model Certidemy is emulating. We cover CertMind's topic blueprint, structured at our finer task granularity.

3. **We train to a higher standard than the test.** CertMind's PO exam is 60Q, 70% pass, Bloom capped at L3 (62% sits at L2). We keep Certidemy's standard: **80% pass, Bloom ceiling 4 (Analyze)**, with ~50% of items at Apply/Analyze. (80% is the locked standard across all "I"-tier certs — rigorous but accessible for a first-level credential, and consistent brand-wide.)

4. **Bloom 5–6 reserved for AI simulations (Phase 2)**, never MCQ-tested — same as SM-I. Simulation candidates are flagged inline.

5. **Single-answer MCQ + scenario items only. No multi-select** — matches how both CertMind and CertiProf actually test, and matches the Certidemy practice/exam engine.

---

## The headline: the signature AI competency

The marketable spine of SPO-I is one argument, taught and tested across the cert: **AI makes building cheap and fast, so the scarce, durable Product Owner skill becomes deciding _what is worth building_.** It surfaces concretely as **Spec-Driven Development — user stories as agent-executable specifications** (introduced in Task 1.6, applied in 4.9), and as the strategic counterweight to AI throughput (the "feature waiter amplified by AI" diagnostic in 4.12, and the vision argument in 5.11). This is the "why this cert, now" story — lead with it in marketing and in the first lesson.

---

## How to read this document

Each task carries an attribute line (Domain, Criticality, Frequency, Bloom level, Exam-scope) plus concept slugs and a K/S/A breakdown (Knowledge / Skills / Abilities).

- **`[AI-integrated]`** — the task embeds an AI-augmented competency. These are woven through the domains by design, not isolated in a module.
- **Simulation candidate** — flagged for Phase 2 AI-driven simulations at Bloom 5–6 (Evaluate/Create); never MCQ-tested.
- **Concept slugs** — kebab-case identifiers that seed as cert-scoped `concepts` rows; `task_concepts` links are written at creation so the question pipeline and reachability work from day one.

---

## Exam facts (target)

| Attribute | Value |
|-|-|
| Format | Multiple choice (single answer) + scenario items, online |
| Questions | 80 |
| Duration | 90 minutes |
| Passing score | 80% (64/80) |
| Open/closed book | Closed book |
| Bloom ceiling | 4 (Analyze) for MCQ; 5–6 reserved for AI simulations |
| Source material | 2020 Scrum Guide, Agile Manifesto, Agile Glossary, *Essential Scrum*, *The Professional Product Owner* |
| Languages | English, es-419, pt-BR (trilingual from launch) |

---

## Domain structure (proposed — lock on sign-off)

| # | Domain | Weight | MCQ (of 80) |
|-|-|-|-|
| 1 | Agile Foundations in the AI Era | 12.5% | 10 |
| 2 | The Scrum Framework & AI-Ready Artifacts | 15.0% | 12 |
| 3 | The Product Owner Accountability & the Scrum Team | 15.0% | 12 |
| 4 | Product Backlog Management & Spec-Driven Development | 30.0% | 24 |
| 5 | Product Vision, Value, Roadmap & Strategy | 27.5% | 22 |
| **Total** | | **100%** | **80** |

### Rationale

- **Domains 4 + 5 carry 57.5% together** because backlog and value *are* the Product Owner role — the inverse of SM-I, where Events led. This matches CertMind's own distribution, where product management is roughly half the syllabus.
- **Domain 4 (Backlog & Spec-Driven Development) is the single heaviest at 30%** — it is the core daily craft and the home of the signature AI competency (stories as agent-executable specifications).
- **Domain 5 (Vision, Value, Roadmap & Strategy) at 27.5%** — the strategic half of the role, and where "why strategic vision matters more in the AI era" lands.
- **Domain 1 (Foundations) is light at 12.5%** — a PO needs empiricism and the agile "why," but is tested on it less directly than on the craft.
- **Domains 2 and 3 at 15% each** — framework fluency and the accountability/boundaries that define the role.

## Bloom's Taxonomy distribution (MCQ target, across 80)

| Bloom level | Target % | Count | Style |
|-|-|-|-|
| 1 — Remember | 15% | 12 | Direct recall ("Who can change the Product Backlog?") |
| 2 — Understand | 35% | 28 | Explanation/comparison ("Why is the Product Goal a commitment?") |
| 3 — Apply | 35% | 28 | Short scenarios ("A stakeholder demands X mid-Sprint. What should the PO do?") |
| 4 — Analyze | 15% | 12 | Multi-step diagnosis ("Identify the anti-pattern and the corrective action") |
| 5–6 — Evaluate/Create | 0% in MCQ | 0 | **Reserved for AI simulations (Phase 2)** |

---

# Domain 1 — Agile Foundations in the AI Era (12.5%)

**Description.** The "why" beneath agile product management, refreshed for the AI era. Agile values and principles, the empirical pillars, lean product thinking — and why Scrum remains relevant, arguably *more* relevant, when AI agents accelerate delivery. Introduces the AI-agent concept and Spec-Driven Development as throughlines the later domains build on.

**Estimated module mapping:** Modules 1–2 (Why Agile, Agile in the AI Era).

## Tasks

### Task 1.1 — Explain the meaning of agile and distinguish it from predictive (waterfall) delivery
| Attribute | Value |
|-|-|
| Domain | 1 | Criticality | High | Frequency | Occasional | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `agile-meaning`, `agile-vs-waterfall`, `agile-lifecycle` |

- **K:** Agile as empirical, iterative-incremental delivery vs. predictive plan-then-execute; the agile product lifecycle; when each approach fits the problem.
- **S:** Judge whether a given context suits an agile or predictive approach.
- **A:** Comfort with emergence and uncertainty.

### Task 1.2 — Apply the Agile Manifesto values and principles to product decisions
| Attribute | Value |
|-|-|
| Domain | 1 | Criticality | High | Frequency | Occasional | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `agile-manifesto-values`, `agile-principles`, `customer-collaboration` |

- **K:** The four values (precedence of the left) and the twelve principles, with emphasis on those most relevant to a PO: early and continuous delivery of value, welcoming changing requirements, daily business–developer collaboration.
- **S:** Map a product decision to the value/principle that supports it.
- **A:** Value-over-process bias.

### Task 1.3 — Explain the three pillars of empiricism and their role in product decisions
| Attribute | Value |
|-|-|
| Domain | 1 | Criticality | High | Frequency | Daily | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `empiricism`, `transparency-inspection-adaptation`, `empirical-product-decisions` |

- **K:** Transparency, Inspection, Adaptation; empiricism as the basis for making value decisions under uncertainty.
- **S:** Recognize when a product decision lacks an empirical basis.
- **A:** Evidence over opinion.

### Task 1.4 — Explain lean product thinking
| Attribute | Value |
|-|-|
| Domain | 1 | Criticality | Medium | Frequency | Occasional | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `lean-product-thinking`, `small-batches`, `deferring-commitment` |

- **K:** Flow, small batches, reducing waste, deferring commitment to the last responsible moment; cost of delay; Scrum's lean lineage.
- **S:** Identify waste in a product process.
- **A:** Bias toward small, reversible bets.

### Task 1.5 — Explain why Scrum remains relevant in the AI era and how AI agents impact product development
| Attribute | Value |
|-|-|
| Domain | 1 | Criticality | High | Frequency | Daily | Bloom level | 2 (Understand) | Exam-scope | Yes | Simulation candidate | Yes |
| Concept slugs | `scrum-in-ai-era`, `ai-agent-definition`, `ai-impact-product-development` |

- **K:** What an AI agent is (an autonomous/semi-autonomous system that executes specified work); how agents accelerate throughput; why empiricism and value judgment become *more* important when building is cheap; Scrum as the empirical wrapper around AI-accelerated work.
- **S:** Articulate the human accountabilities AI does not remove.
- **A:** Neither AI-hype nor AI-dismissal — grounded realism. **[AI-integrated]**

### Task 1.6 — Describe Spec-Driven Development and the role of executable specifications
| Attribute | Value |
|-|-|
| Domain | 1 | Criticality | High | Frequency | Per-Sprint | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `spec-driven-development`, `executable-specifications`, `intro-agent-executable-stories` |

- **K:** Spec-Driven Development = writing specifications precise enough that AI agents can execute them; the PBI/user story as that specification; the shift from "story as conversation starter" toward "story as executable spec," and the tension between the two.
- **S:** Recognize what makes a spec executable vs. ambiguous.
- **A:** Precision without over-specification. **[AI-integrated]**

---

# Domain 2 — The Scrum Framework & AI-Ready Artifacts (15%)

**Description.** The Scrum framework essentials a Product Owner must master — theory, team, events, artifacts — viewed through the product lens, plus the modern twist: artifacts as the source of instruction for both humans *and* AI agents, and what "Done" means when an agent did the work.

**Estimated module mapping:** Modules 3–4 (The Scrum Framework, AI-Ready Artifacts).

## Tasks

### Task 2.1 — Describe the Scrum framework and what a "product" is
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | High | Frequency | Occasional | Bloom level | 1 (Remember) | Exam-scope | Yes |
| Concept slugs | `scrum-framework-overview`, `definition-of-product`, `product-vs-project` |

- **K:** Scrum as a lightweight framework; a product as a vehicle to deliver value with a clear boundary and stakeholders; product-over-project mindset.
- **S:** Define a product's boundary.
- **A:** Product-centric thinking.

### Task 2.2 — Explain the Scrum Team composition and the PO's place in it
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | High | Frequency | Occasional | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `scrum-team-composition`, `po-in-scrum-team`, `one-team-no-subteams` |

- **K:** One PO + one Scrum Master + Developers; typically ≤10; no sub-teams or hierarchies; the PO is one person, not a committee.
- **S:** Apply composition rules to a described team.
- **A:** Small-team comfort.

### Task 2.3 — Explain the three Scrum artifacts and their commitments
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | High | Frequency | Daily | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `scrum-artifacts`, `artifact-commitments`, `backlog-sprintbacklog-increment` |

- **K:** Product Backlog → Product Goal; Sprint Backlog → Sprint Goal; Increment → Definition of Done.
- **S:** Match each artifact to its commitment.
- **A:** Transparency orientation.

### Task 2.4 — Explain the five Scrum events from the PO's perspective
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | High | Frequency | Per-Sprint | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `scrum-events`, `po-event-participation`, `sprint-as-container` |

- **K:** The Sprint as container; Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective; where the PO is essential (Planning, Review) vs. supporting.
- **S:** Identify the PO's role and degree of involvement in each event.
- **A:** Presence without overreach.

### Task 2.5 — Apply Transparency, Inspection, and Adaptation to artifacts
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | High | Frequency | Daily | Bloom level | 3 (Apply) | Exam-scope | Yes | Simulation candidate | Yes |
| Concept slugs | `artifact-transparency`, `inspection-adaptation-artifacts`, `transparency-breakdown` |

- **K:** Each artifact must be transparent for inspection to be meaningful; the consequences of low transparency for value decisions.
- **S:** Detect and correct a transparency breakdown in the Product Backlog.
- **A:** Courage to surface inconvenient truths.

### Task 2.6 — Explain how Scrum artifacts serve as a source of instruction for AI agents
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | High | Frequency | Per-Sprint | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `artifacts-as-ai-instruction`, `pbi-as-agent-input`, `transparency-for-agents` |

- **K:** When agents do work, the Product Backlog, PBIs, and acceptance criteria become the instruction set the agent acts on; ambiguous artifacts produce wrong agent output; transparency now serves machines as well as people.
- **S:** Evaluate whether an artifact is clear enough to instruct an agent.
- **A:** Rigor in artifact clarity. **[AI-integrated]**

### Task 2.7 — Explain the Definition of Done in AI-assisted teams
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | High | Frequency | Per-Sprint | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `definition-of-done`, `dod-ai-assisted-work`, `dod-applies-to-agent-output` |

- **K:** The DoD applies equally to AI-generated output; output is not "Done" merely because an agent produced it — it must meet the same DoD; the risk of quietly lowering the DoD because AI is fast.
- **S:** Apply the DoD to an Increment partly built by an agent.
- **A:** No quality double-standard for AI work. **[AI-integrated]**

### Task 2.8 — Recognize Scrum framework anti-patterns relevant to the PO
| Attribute | Value |
|-|-|
| Domain | 2 | Criticality | Medium | Frequency | Occasional | Bloom level | 4 (Analyze) | Exam-scope | Yes |
| Concept slugs | `scrum-anti-patterns-po`, `proxy-po`, `absent-po` |

- **K:** Proxy/committee PO; absent PO; PO bypassing the team; treating events as status meetings.
- **S:** Diagnose the anti-pattern and prescribe the correction.
- **A:** Diplomatic firmness.

---

# Domain 3 — The Product Owner Accountability & the Scrum Team (15%)

**Description.** Who the Product Owner is and what they are accountable for — maximizing value — and how the role interacts with the Scrum Master, Developers, and stakeholders, including the human accountability that persists when AI assists.

**Estimated module mapping:** Module 5 (The Product Owner Accountability).

## Tasks

### Task 3.1 — Explain the PO's central accountability: maximizing product value
| Attribute | Value |
|-|-|
| Domain | 3 | Criticality | High | Frequency | Daily | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `po-value-accountability`, `maximizing-value`, `value-from-team-work` |

- **K:** The PO is accountable for maximizing the value of the product resulting from the Scrum Team's work.
- **S:** Distinguish value work from output work.
- **A:** Outcome over output.

### Task 3.2 — Explain that the Product Owner is one accountable person
| Attribute | Value |
|-|-|
| Domain | 3 | Criticality | High | Frequency | Occasional | Bloom level | 1 (Remember) | Exam-scope | Yes |
| Concept slugs | `po-one-person`, `po-not-committee`, `po-decision-authority` |

- **K:** One person, not a committee; may represent a committee's desires in the Product Backlog, but the decisions are the PO's; others may influence, but only the PO (or those answering to them) changes the backlog.
- **S:** Apply the one-person rule to a scenario.
- **A:** Ownership of decisions.

### Task 3.3 — Explain the PO's authority over the Product Backlog and the Sprint
| Attribute | Value |
|-|-|
| Domain | 3 | Criticality | High | Frequency | Per-Sprint | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `po-backlog-authority`, `po-sprint-cancellation`, `respecting-po-decisions` |

- **K:** The PO orders the Product Backlog; only the PO has the authority to cancel a Sprint; the organization must respect the PO's decisions.
- **S:** Recognize violations of PO authority.
- **A:** Authority held responsibly.

### Task 3.4 — Distinguish PO boundaries from Scrum Master and Developer accountabilities
| Attribute | Value |
|-|-|
| Domain | 3 | Criticality | High | Frequency | Daily | Bloom level | 4 (Analyze) | Exam-scope | Yes |
| Concept slugs | `po-sm-boundary`, `po-developer-boundary`, `accountability-anti-patterns` |

- **K:** PO ≠ Scrum Master ≠ project manager; the PO does not assign tasks to Developers or dictate the "how"; Developers own the "how" and their estimates.
- **S:** Diagnose a boundary violation and prescribe the correction.
- **A:** Restraint.

### Task 3.5 — Explain the PO's collaboration with Developers on the backlog
| Attribute | Value |
|-|-|
| Domain | 3 | Criticality | High | Frequency | Daily | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `po-developer-collaboration`, `refinement-collaboration`, `estimates-by-developers` |

- **K:** Developers size the work; the PO supplies the "why" and the ordering; refinement is collaborative.
- **S:** Facilitate productive PO–Developer interaction.
- **A:** Respect for the team's craft.

### Task 3.6 — Explain the human-held value accountability in AI-augmented teams
| Attribute | Value |
|-|-|
| Domain | 3 | Criticality | High | Frequency | Daily | Bloom level | 3 (Apply) | Exam-scope | Yes | Simulation candidate | Yes |
| Concept slugs | `human-held-value-accountability`, `ai-does-not-own-value`, `accountability-with-ai` |

- **K:** AI can draft, suggest, and analyze, but the value decision and its accountability remain the PO's; accountability cannot be delegated to an agent; the PO must be able to justify a value decision that AI influenced.
- **S:** Retain decision authority while incorporating AI inputs.
- **A:** Accountability that doesn't hide behind the tool. **[AI-integrated]**

### Task 3.7 — Describe the product ecosystem and stakeholder relationships
| Attribute | Value |
|-|-|
| Domain | 3 | Criticality | Medium | Frequency | Weekly | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `product-ecosystem-actors`, `stakeholders-customers-users`, `voice-of-customer` |

- **K:** Stakeholders, customers, users, sponsors; the PO as the voice of the customer to the team and the voice of the team to stakeholders.
- **S:** Map a product's stakeholder landscape.
- **A:** Boundary-spanning.

---

# Domain 4 — Product Backlog Management & Spec-Driven Development (30%)

**Description.** The core craft. Building, ordering, and refining the Product Backlog; writing high-quality PBIs, user stories, and acceptance criteria; estimation; story mapping — and the AI-era evolution: stories as agent-executable specifications, AI-assisted refinement, AI-drafted items the PO curates, and the feature-factory trap that AI amplifies.

**Estimated module mapping:** Modules 6–7 (Backlog Craft, Spec-Driven Development & AI-Assisted Refinement).

## Tasks

### Task 4.1 — Explain the Product Backlog as an emergent, ordered, single source
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Daily | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `product-backlog-definition`, `single-product-backlog`, `backlog-emergent` |

- **K:** One Product Backlog per product; never complete; dynamic; the single source of work; multiple teams on one product share one backlog.
- **S:** Recognize multi-backlog anti-patterns.
- **A:** Single-source discipline.

### Task 4.2 — Apply Product Backlog ordering to maximize value
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Daily | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `backlog-ordering`, `value-based-prioritization`, `cost-of-delay` |

- **K:** Ordering by value, risk, dependency, and cost of delay; not all "priority" is equal; the PO owns the ordering.
- **S:** Order a sample backlog with explicit rationale.
- **A:** Decisiveness under tradeoffs.

### Task 4.3 — Write high-quality user stories and epics
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Daily | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `user-stories`, `epics`, `story-splitting` |

- **K:** Story structure (as a… I want… so that…); epics as large stories; vertical splitting that preserves value.
- **S:** Write a well-formed story and split an epic into valuable slices.
- **A:** User-centric framing.

### Task 4.4 — Apply INVEST criteria to PBI quality
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Daily | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `invest-criteria`, `pbi-quality`, `story-independence` |

- **K:** Independent, Negotiable, Valuable, Estimable, Small, Testable.
- **S:** Evaluate a PBI against INVEST and improve it.
- **A:** A quality bar for backlog items.

### Task 4.5 — Write effective acceptance criteria
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Daily | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `acceptance-criteria`, `testable-criteria`, `criteria-vs-dod` |

- **K:** Acceptance criteria define done-ness for a *specific* item; distinct from the DoD (which applies to every item); given/when/then style.
- **S:** Write clear, testable acceptance criteria.
- **A:** Precision.

### Task 4.6 — Explain backlog refinement as an ongoing activity
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Daily | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `backlog-refinement`, `refinement-not-event`, `refinement-ongoing` |

- **K:** Refinement is a continuous activity, not a formal event; it adds detail, estimates, and order.
- **S:** Run effective refinement.
- **A:** Continuous-grooming discipline.

### Task 4.7 — Apply estimation techniques to PBIs
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | Medium | Frequency | Per-Sprint | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `estimation-techniques`, `story-points`, `relative-estimation` |

- **K:** Relative estimation, story points, planning poker; estimates are owned by Developers; the PO uses them for forecasting, not as commitments.
- **S:** Facilitate estimation and interpret estimates for forecasting.
- **A:** Estimates as forecasts, not promises.

### Task 4.8 — Apply story mapping to structure the backlog
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | Medium | Frequency | Occasional | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `story-mapping`, `walking-skeleton`, `backlog-structure` |

- **K:** Story maps as a two-dimensional narrative view; backbone plus slices; the releasable walking skeleton.
- **S:** Build a story map from a product narrative.
- **A:** Whole-journey thinking.

### Task 4.9 — Apply Spec-Driven Development: stories as agent-executable specifications
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Per-Sprint | Bloom level | 3 (Apply) | Exam-scope | Yes | Simulation candidate | Yes |
| Concept slugs | `spec-driven-development-applied`, `stories-as-executable-specs`, `precision-for-agents` |

- **K:** When agents execute work, the story plus acceptance criteria become the executable spec; the bar for precision and unambiguity rises; the gap-filling conversation may not happen with an agent, so the spec must carry the intent.
- **S:** Convert a conversational story into an agent-executable specification *without* over-constraining the implementation "how."
- **A:** Precision balanced with leaving the team room to implement. **[AI-integrated]**

### Task 4.10 — Apply AI-assisted backlog refinement
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Per-Sprint | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `ai-assisted-refinement`, `ai-drafted-pbis`, `curating-ai-output` |

- **K:** AI can draft PBIs, suggest splits, surface edge cases, and generate acceptance criteria; the PO curates and stays accountable; the risk of accepting plausible-but-wrong AI suggestions.
- **S:** Use AI to accelerate refinement while curating for quality.
- **A:** Critical curation, not rubber-stamping. **[AI-integrated]**

### Task 4.11 — Use AI for user research and feedback analysis
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | Medium | Frequency | Weekly | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `ai-user-research`, `ai-feedback-analysis`, `ai-hypothesis-generation` |

- **K:** AI to synthesize user research, cluster feedback, and draft hypotheses; the PO validates and decides; correlation vs. causation; bias in AI synthesis.
- **S:** Turn AI-analyzed feedback into validated backlog candidates.
- **A:** Validate before acting. **[AI-integrated]**

### Task 4.12 — Recognize the "feature waiter" anti-pattern amplified by AI agents
| Attribute | Value |
|-|-|
| Domain | 4 | Criticality | High | Frequency | Daily | Bloom level | 4 (Analyze) | Exam-scope | Yes | Simulation candidate | Yes |
| Concept slugs | `feature-waiter-anti-pattern`, `ai-amplified-feature-factory`, `strategy-over-throughput` |

- **K:** The "feature waiter"/order-taker PO who merely relays requests; AI agents make churning out features cheaper, amplifying the feature-factory trap; why strategic vision and value discrimination matter *more* when output is cheap.
- **S:** Diagnose feature-factory behavior and redirect toward value and outcomes.
- **A:** Strategic backbone; the discipline to say no. **[AI-integrated]**

---

# Domain 5 — Product Vision, Value, Roadmap & Strategy (27.5%)

**Description.** The strategic half of the role — vision, the Product Goal, value maximization and measurement, roadmaps, forecasting and release planning, business strategy, and stakeholder management — with AI woven in for roadmap construction and strategic analysis, and the central argument that strategic vision becomes more critical, not less, in the AI era.

**Estimated module mapping:** Modules 8–9 (Vision, Value & Strategy; Roadmaps, Forecasting & Stakeholders).

## Tasks

### Task 5.1 — Create and communicate a product vision
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Weekly | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `product-vision`, `vision-communication`, `vision-alignment` |

- **K:** Vision as the north star; aligning development with long-term goals; communicating vision to team and stakeholders.
- **S:** Craft and articulate a compelling vision.
- **A:** Inspirational clarity.

### Task 5.2 — Explain the Product Goal as a commitment to the Product Backlog
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Per-Sprint | Bloom level | 2 (Understand) | Exam-scope | Yes |
| Concept slugs | `product-goal`, `product-goal-commitment`, `product-goal-vs-sprint-goal` |

- **K:** The Product Goal is the commitment for the Product Backlog (2020 Guide); a single objective; one Product Goal at a time; its relationship to Sprint Goals.
- **S:** Write a coherent Product Goal and relate Sprint Goals to it.
- **A:** Goal-orientation.

### Task 5.3 — Apply value-maximization concepts and ROI
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Weekly | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `value-maximization`, `roi`, `value-vs-cost` |

- **K:** Maximizing value/ROI; value is multi-dimensional (revenue, cost savings, risk reduction, learning); avoiding "output as value."
- **S:** Argue for an option on value/ROI grounds.
- **A:** Value discrimination.

### Task 5.4 — Measure product value and outcomes
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Weekly | Bloom level | 4 (Analyze) | Exam-scope | Yes |
| Concept slugs | `value-metrics`, `outcome-vs-output-metrics`, `evidence-based-management` |

- **K:** Outcome metrics over output metrics; leading vs. lagging indicators; Evidence-Based Management dimensions (current value, unrealized value, ability to innovate, time to market) at a foundational level.
- **S:** Choose meaningful value metrics for a given product.
- **A:** Measure what matters.

### Task 5.5 — Apply forecasting and release planning
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Per-Sprint | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `forecasting`, `release-planning`, `cone-of-uncertainty` |

- **K:** Forecasting from velocity/throughput; the cone of uncertainty; release burndown; forecasts are probabilistic, not promises; the PO tracks progress toward the goal at least each Sprint Review.
- **S:** Produce a release forecast and communicate its uncertainty.
- **A:** Honesty about uncertainty.

### Task 5.6 — Build and maintain a product roadmap
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Weekly | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `product-roadmap`, `outcome-based-roadmap`, `roadmap-vs-plan` |

- **K:** The roadmap as outcome-oriented intent over time, not a fixed feature schedule; now/next/later; revisiting as you learn.
- **S:** Construct an outcome-based roadmap.
- **A:** Adaptive planning.

### Task 5.7 — Align product decisions to business strategy
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | Medium | Frequency | Weekly | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `business-strategy-alignment`, `product-strategy`, `strategy-to-execution` |

- **K:** Bridging business strategy and execution; aligning product decisions to strategic goals; the PO as strategy translator.
- **S:** Connect a backlog decision to a strategic objective.
- **A:** Strategic framing.

### Task 5.8 — Manage stakeholders and collaborate across the ecosystem
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Daily | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `stakeholder-management`, `managing-conflicting-priorities`, `stakeholder-transparency` |

- **K:** Identifying and engaging stakeholders; managing conflicting priorities; transparency with stakeholders; the Sprint Review as the key stakeholder inspection point.
- **S:** Navigate conflicting stakeholder demands toward value.
- **A:** Diplomatic and value-anchored.

### Task 5.9 — Facilitate the Sprint Review as the PO's key value-inspection event
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Per-Sprint | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `sprint-review`, `review-not-demo`, `value-inspection` |

- **K:** The Review is a working session to inspect the Increment and adapt the Product Backlog with stakeholders — not a one-way demo; the PO's role; collaborating on what could be done next to optimize value.
- **S:** Run a value-focused Sprint Review.
- **A:** Collaboration over presentation.

### Task 5.10 — Apply AI to roadmap construction and strategic analysis
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | Medium | Frequency | Weekly | Bloom level | 3 (Apply) | Exam-scope | Yes |
| Concept slugs | `ai-roadmap-construction`, `ai-strategic-analysis`, `ai-scenario-modeling` |

- **K:** AI to draft roadmap options, model scenarios, and surface dependencies and risks; the PO sets strategy and decides; AI as analyst, not strategist.
- **S:** Use AI to generate roadmap options, then exercise strategic judgment over them.
- **A:** Strategy stays human. **[AI-integrated]**

### Task 5.11 — Explain why strategic vision is more critical in the AI era
| Attribute | Value |
|-|-|
| Domain | 5 | Criticality | High | Frequency | Daily | Bloom level | 4 (Analyze) | Exam-scope | Yes | Simulation candidate | Yes |
| Concept slugs | `strategic-vision-ai-era`, `value-discrimination-cheap-output`, `vision-as-differentiator` |

- **K:** When AI makes building cheap and fast, the scarce skill becomes deciding *what* is worth building; vision and value discrimination are the PO's durable differentiators; the risk of accelerating efficiently in the wrong direction.
- **S:** Make the case for investing in vision and discovery over raw throughput.
- **A:** Long-game strategic conviction. **[AI-integrated]**

---

## Summary statistics

- **5 domains, 44 tasks total** (D1: 6 | D2: 8 | D3: 7 | D4: 12 | D5: 11)
- **Domain weights:** 12.5 / 15 / 15 / 30 / 27.5
- **11 AI-integrated tasks**, woven across **all five domains** (D1: 1.5, 1.6 | D2: 2.6, 2.7 | D3: 3.6 | D4: 4.9, 4.10, 4.11, 4.12 | D5: 5.10, 5.11) — AI is in the role's identity, not a quarantined module.
- **6 simulation candidates** flagged for Phase 2 (Bloom 5–6 AI interactions): 1.5, 2.5, 3.6, 4.9, 4.12, 5.11.
- **Signature AI competency:** Spec-Driven Development — user stories as agent-executable specifications (Tasks 1.6, 4.9), plus the "feature waiter amplified by AI" strategic argument (Tasks 4.12, 5.11).
- **Strategic spine (cross-reference in lessons):** Tasks **3.6 → 4.12 → 5.11** form one through-line at three altitudes — accountability (you can't delegate the value decision to an agent), tactical diagnosis (spotting feature-factory behavior in the backlog), and strategy (investing in vision over throughput). They are intentionally *distinct* tasks, not redundant; the lessons should explicitly cross-reference them so the learner feels the single argument reinforced across domains.
- **Concept slugs:** ~120 unique slugs defined inline, ready to seed as cert-scoped `concepts` rows.

---

## What's next (once this JTA is locked)

1. **Seed the structure into the DB** — create the SPO-I certification row, then its 5 domains, 44 tasks, and ~120 concepts, with `task_concepts` links written at creation so reachability holds from day one.
2. **Author lessons** in the existing dual-renderer DSL, mapped to tasks, trilingual.
3. **Build the secure exam pool** (single-answer MCQ + scenario items, Bloom ≤4).
4. **Run the trilingual practice backfill** — the same `backfill-practice.mjs` ops script with `CERT_ID` pointed at SPO-I, to the ≥10/lesson floor.
5. **SD-I next** — the Scrum Developer I JTA, which will share foundational structure with SM-I (Increment, Definition of Done, Developer accountabilities) while centering on the AI-assisted build craft.
