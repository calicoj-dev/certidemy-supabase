# AIGRM-I — Job-Task Analysis (JTA)

**Credential:** Certidemy AI Governance & Risk Management I — AI
**Code:** AIGRM-I  ·  **Tier:** I (single-correct-answer)  ·  **Cert UUID:** *(assigned at scaffold)*
**Document version:** v0.1 — **D1 authored as the TEMPLATE PASS; D2–D5 pending.**
**Basis:** `AIGP-AI-I_BOK.md` (Stage-1 BoK, verified July 2026). BoK code superseded
by **AIGRM-I** per Grok review (avoids the IAPP "AIGP" collision).
**Status:** DRAFT — awaiting Juan + Grok review of the D1 template before D2–D5.

---

## How to read this JTA (field legend)

The JTA is the traceability spine: **domain → task → concept**. It seeds the
scaffold (domains, tasks, `task_concepts`, concepts) and is what lessons tag and
questions ground in.

- **Task code** — stable `D.N` identifier (e.g. `1.3`). **Immutable once
  published** (lesson frontmatter `task_codes` and item `task_id` reference it).
- **Task statement** — what a competent AI-governance practitioner can do.
  Framed as *understand/identify/explain the structure and obligations of* — never
  "comply with" (we certify understanding of the landscape, not legal compliance).
- **Bloom** — the primary cognitive level the task assesses, using the DB enum:
  `2_understand`, `3_apply`, `4_analyze`. (Foundations skews `2_understand`; the
  applied domains D2/D4 rise to `3_apply`/`4_analyze`.)
- **Freq / Crit** — job-task frequency (how often the practice arises) × criticality
  (consequence of getting it wrong): `H` / `M` / `L`. Together they justify the
  domain weighting and per-task item emphasis.
- **Concepts** — the fine-grained teachable/testable units the task draws on
  (kebab-case slugs). Each is defined in the domain **concept glossary** below and
  becomes a `concepts` row; the task→concept pairs become `task_concepts`.

**Concept-authoring rule:** each concept is one idea, teachable in a lesson block
and testable in one item. Split anything that needs "and" to describe it.

---

## Domain map (weights sum to 100)

| Domain | Title | Weight | Tasks | Status |
|---|---|---|---|---|
| **D1** | Foundations of AI Governance & Trustworthy AI | 15.0% | 8 | **authored (template)** |
| D2 | AI Risk Management in Practice | 22.5% | ~11 | pending |
| D3 | Regulatory & Standards Landscape | 20.0% | ~10 | pending |
| D4 | The AI Lifecycle & Accountable Deployment | 25.0% | ~12 | pending |
| D5 | Responsible AI, Ethics & the Governance Function | 17.5% | ~8 | pending |

Generative/agentic AI risk is woven through every domain (heaviest in D2 and D4),
not isolated — the AI-era-native differentiator.

---

# D1 — Foundations of AI Governance & Trustworthy AI  *(15%)*

**Domain intent.** Establish the shared vocabulary and mental model the rest of the
credential builds on: what AI governance, risk, and compliance are and how they
differ; the terms (AI system, generative, agentic, foundation model); risk versus
harm; who the accountable actors are; what "trustworthy AI" means; why autonomy and
scale raise the governance stakes; and the *types* of governance instrument (the
detailed regulatory/standards content lives in D3). Predominantly comprehension
(`2_understand`) — this domain makes the applied domains legible.

## D1 tasks

| Code | Task — *the candidate can…* | Bloom | Freq | Crit | Concepts |
|---|---|---|---|---|---|
| **1.1** | Distinguish **AI governance**, **AI risk management**, and **AI compliance**, and explain why an organization needs all three. | 2_understand | H | H | `ai-governance`, `ai-risk-management`, `ai-compliance`, `governance-vs-risk-vs-compliance` |
| **1.2** | Define the core AI terms — **AI system, model, foundation / general-purpose model, generative AI, agentic AI** — and place a given system among them. | 2_understand | H | M | `ai-system-definition`, `ml-vs-generative-vs-agentic`, `foundation-model`, `agentic-ai` |
| **1.3** | Explain the difference between an **AI risk** and an **AI harm**, and identify the categories of harm an AI system can cause. | 2_understand | H | H | `ai-risk-vs-harm`, `likelihood-and-severity`, `categories-of-ai-harm` |
| **1.4** | Identify the **actors in the AI value chain** (provider/developer, deployer, distributor, importer, affected person) and how their responsibilities differ. | 2_understand | H | H | `ai-value-chain-actors`, `provider-vs-deployer`, `affected-person` |
| **1.5** | Describe the **characteristics of trustworthy AI** and what each one means in practice. | 2_understand | H | M | `trustworthy-ai-characteristics`, `validity-reliability`, `safety`, `security-resilience`, `accountability-transparency`, `explainability-interpretability`, `privacy-enhanced`, `fairness-bias-managed` |
| **1.6** | Explain why governance matters **more, not less**, as AI becomes generative and agentic — reasoning from autonomy, scale, and opacity. | 3_apply | M | H | `autonomy-risk`, `scale-and-opacity`, `why-govern-generative-agentic` |
| **1.7** | Distinguish the **types of governance instrument** — voluntary framework, binding regulation, and management-system standard — and what each is for. | 2_understand | M | M | `governance-instrument-types`, `voluntary-framework`, `binding-regulation`, `management-system-standard` |
| **1.8** | Explain what an **AI management system (AIMS)** is, and how organization-level governance differs from risk work on a single AI system. | 2_understand | M | M | `ai-management-system`, `org-level-vs-project-level` |

**D1 assessment note.** 1.1, 1.3, 1.4 are the load-bearing foundations (H/H) and
should carry the heaviest item emphasis within the domain; 1.5 is broad (eight
characteristics) and pairs naturally with a grouped-layout lesson + a drag-match
widget. 1.6 is the one `3_apply` task — it asks the learner to *reason* about the
AI-era stakes, and is the domain's differentiator hook.

## D1 concept glossary

*(slug — name — one-line teachable/testable definition; each becomes a `concepts` row.)*

**Governance vs risk vs compliance (1.1)**
- `ai-governance` — **AI governance** — the organization-level structures, policies, roles, and accountability that direct and oversee how AI is developed and used.
- `ai-risk-management` — **AI risk management** — the ongoing process of identifying, analyzing, evaluating, and treating the risks an AI system poses.
- `ai-compliance` — **AI compliance** — conformance of AI practices to applicable laws, standards, and internal policy.
- `governance-vs-risk-vs-compliance` — **How they relate** — governance sets direction and accountability, risk management works the specific systems, compliance evidences conformance; each is necessary and none substitutes for another.

**AI terminology (1.2)**
- `ai-system-definition` — **AI system** — a machine-based system that, for stated objectives, infers from input how to generate outputs (predictions, content, recommendations, decisions) that influence environments.
- `ml-vs-generative-vs-agentic` — **ML vs generative vs agentic** — traditional ML predicts/classifies; generative AI produces new content; agentic AI plans and takes actions toward goals with degrees of autonomy.
- `foundation-model` — **Foundation / general-purpose model** — a broadly-capable model trained on large data that can be adapted to many downstream tasks (the "GPAI" the EU AI Act singles out).
- `agentic-ai` — **Agentic AI** — an AI system that pursues goals by planning and acting across steps and tools, with reduced per-step human intervention.

**Risk vs harm (1.3)**
- `ai-risk-vs-harm` — **Risk vs harm** — a *harm* is a realized negative impact; a *risk* is the possibility of a harm, characterized by its likelihood and severity.
- `likelihood-and-severity` — **Likelihood × severity** — the two axes by which AI risk is characterized and prioritized.
- `categories-of-ai-harm` — **Categories of AI harm** — harms to individuals, to groups/communities, to organizations, and to society/democratic institutions.

**Value-chain actors (1.4)**
- `ai-value-chain-actors` — **AI value-chain actors** — the roles along an AI system's path to use: provider/developer, deployer, distributor, importer, and the affected person.
- `provider-vs-deployer` — **Provider vs deployer** — the provider develops/places the system on the market; the deployer uses it under its own authority; obligations differ by role.
- `affected-person` — **Affected person** — the individual subject to, or impacted by, an AI system's output or decision.

**Trustworthy-AI characteristics (1.5)**
- `trustworthy-ai-characteristics` — **Trustworthy AI (the set)** — the properties a trustworthy AI system exhibits, taken together rather than in isolation.
- `validity-reliability` — **Valid & reliable** — the system performs as intended, accurately and consistently, under expected conditions.
- `safety` — **Safe** — the system does not, under defined conditions, create an unacceptable risk of harm to life, health, property, or environment.
- `security-resilience` — **Secure & resilient** — the system withstands adversarial attack, misuse, and abnormal conditions, and recovers from them.
- `accountability-transparency` — **Accountable & transparent** — responsibility for the system is assigned and traceable, and appropriate information about it is disclosed.
- `explainability-interpretability` — **Explainable & interpretable** — the system's outputs and mechanisms can be understood by relevant audiences.
- `privacy-enhanced` — **Privacy-enhanced** — the system safeguards autonomy, identity, and personal data through its design and use.
- `fairness-bias-managed` — **Fair, with harmful bias managed** — harmful bias is identified, measured, and mitigated so outcomes are equitable.

**Why the AI era raises the stakes (1.6)**
- `autonomy-risk` — **Autonomy risk** — risk arising when an AI system takes consequential action with reduced human intervention (central to agentic systems).
- `scale-and-opacity` — **Scale & opacity** — governance pressure from AI operating at population scale and being hard to inspect or explain (inscrutability).
- `why-govern-generative-agentic` — **Why govern generative/agentic AI** — as generation gets cheap and systems act autonomously, the discipline of oversight, verification, and accountability matters more, not less.

**Governance-instrument types (1.7)**
- `governance-instrument-types` — **Instrument types** — the distinct kinds of AI governance instrument and what each is designed to do.
- `voluntary-framework` — **Voluntary framework** — non-binding guidance an organization adopts to structure practice (e.g. a risk-management framework).
- `binding-regulation` — **Binding regulation** — enforceable law that imposes obligations with penalties for non-conformance.
- `management-system-standard` — **Management-system standard** — a certifiable standard defining an organizational system that a third party can audit.

**AIMS & levels of governance (1.8)**
- `ai-management-system` — **AI management system (AIMS)** — the set of organizational policies, processes, and controls for governing AI across its lifecycle, as an auditable system.
- `org-level-vs-project-level` — **Org-level vs project-level** — the difference between governing AI across the whole organization and managing the risk of one specific AI system.

---

## D1 summary (template metrics)

- **Tasks:** 8  ·  **Concepts:** 30  ·  **Bloom mix:** 7× `2_understand`, 1× `3_apply`.
- **Concept density:** ~3.75 concepts/task (1.5's eight characteristics is the
  intentional outlier and maps to one grouped lesson).
- **Downstream targets** (per CERT-CREATION.md §4): each of these 30 concepts must
  end up **taught** by ≥1 lesson per language and **tested** to the item floors
  (≥8 secure, ≥10 practice per task per language), with `untaught_testing_violations = 0`.

---

*This is the D1 template pass. On sign-off (Juan + Grok), D2–D5 are authored to
this exact shape — task table + concept glossary, same field discipline — and the
completed JTA becomes `AIGRM-I_JTA_v1.md`, the locked scheme-of-record input to
scaffold Stage 6.*
