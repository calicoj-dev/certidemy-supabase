> ## SUPERSEDED FOR ALL FACTUAL CONTENT
>
> **The authoritative JTA for AIGRM-I is `jta/AIGRM-I_JTA_generated.md`**, rendered
> from the live database by `scripts/gen-jta-doc.mjs`. Regenerate it rather than
> reading or editing the tables below.
>
> Measured on 2026-07-23, this document disagrees with the database on
> **20 task statement(s)** and is **missing 2 task(s)** entirely. Its exam
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
> has not been moved yet. It will be extracted into `AIGRM-I_JTA_narrative.md`,
> after which this file is archived. Until then, read it for the *why* and never for
> the *what*.

---
# AIGRM-I — Job-Task Analysis (JTA) — v1 (complete, all five domains)

**Credential:** Certidemy AI Governance & Risk Management I — AI
**Code:** AIGRM-I  ·  **Tier:** I (single-correct-answer)  ·  **Cert UUID:** *(assigned at scaffold, Stage 6)*
**Document version:** **v1 (polished) — all five domains, Grok round-1 notes applied.**
**Basis:** `AIGP-AI-I_BOK.md` (Stage-1 BoK, verified July 2026); D1 + D2 approved by
Grok; D3–D5 authored to the same shape; polish pass applied per Grok's full-JTA
review (8.7/10): D3 and D5 each gained a higher-order applied task, reuse tags made
uniform, D3/D5 task wording tightened.
**Status:** DRAFT-COMPLETE — for Grok's final confirm before lock. On sign-off this
becomes the scheme-of-record input to scaffold (Stage 6).

> **Polish changelog (this revision):**
> - **3.2** raised `2_understand` → `3_apply` (determine *whether* a system is
>   high-risk, then identify obligations — applied, not recall).
> - **5.5** raised `2_understand` → `3_apply` (determine a *fit-for-context*
>   governance structure — gives D5 a second higher-order task; weight held at
>   17.5%).
> - Cross-domain reused concepts now uniformly tagged *(D#)*.
> - D3/D5 task statements tightened to D1/D2 crispness.
> - Concept-density scan: intentional grouped-lesson anchors (1.5, 2.6, 3.2)
>   kept whole; no accidental pile-ups found to split.
> - Result — Bloom across 49 tasks: **31× understand, 13× apply, 5× analyze**
>   (D3 and D5 each now carry a real applied task).

---

## Field legend

The JTA is the traceability spine: **domain → task → concept**. It seeds the
scaffold (domains, tasks, `task_concepts`, concepts); lessons tag these codes/slugs;
questions ground in the concepts; coverage proves against them.

- **Task code** — stable `D.N` id, **immutable once published**.
- **Task statement** — what a competent practitioner can do; verb-first;
  regulatory tasks say *understand / explain the structure and obligations of* —
  never "comply with" (we certify understanding of the landscape, not legal
  compliance).
- **Bloom** — primary cognitive level on the DB enum: `2_understand`, `3_apply`,
  `4_analyze`. Foundations skew understand; applied domains rise to apply/analyze.
- **Freq / Crit** — job-task frequency × criticality (`H`/`M`/`L`); justifies domain
  weighting and per-task item emphasis.
- **Concepts** — one teachable/testable idea each (kebab-case slug). A concept may
  be shared across tasks (many-to-many `task_concepts`), marked *(reused from D#)*
  rather than redefined.

**Locked template conventions:** verb-first statements; the four NIST functions
always capitalized (**Govern, Map, Measure, Manage**); framework proper nouns
consistent (NIST AI RMF, EU AI Act, ISO/IEC 42001, OECD); "understand structure &
obligations," not "comply"; one concept = one idea.

---

## Domain map & exam blueprint (weights sum to 100; 80 items)

| Domain | Title | Weight | Tasks | Items/form |
|---|---|---|---|---|
| **D1** | Foundations of AI Governance & Trustworthy AI | 15.0% | 8 | 12 |
| **D2** | AI Risk Management in Practice | 22.5% | 11 | 18 |
| **D3** | Regulatory & Standards Landscape | 20.0% | 10 | 16 |
| **D4** | The AI Lifecycle & Accountable Deployment *(signature)* | 25.0% | 12 | 20 |
| **D5** | Responsible AI, Ethics & the Governance Function | 17.5% | 8 | 14 |
| | **Total** | **100%** | **49** | **80** |

Generative/agentic AI risk is woven through every domain (heaviest in D2 and D4) —
the AI-era-native differentiator. The assembler draws each form to this blueprint
and refuses a form if any domain is short.

---

# D1 — Foundations of AI Governance & Trustworthy AI  *(15%)*

**Intent.** The shared vocabulary and mental model the credential builds on.
Predominantly `2_understand` — makes the applied domains legible.

| Code | Task — *the candidate can…* | Bloom | Freq | Crit | Concepts |
|---|---|---|---|---|---|
| **1.1** | Distinguish **AI governance**, **AI risk management**, and **AI compliance**, and explain why an organization needs all three. | 2_understand | H | H | `ai-governance`, `ai-risk-management`, `ai-compliance`, `governance-vs-risk-vs-compliance` |
| **1.2** | Define the core AI terms — **AI system, model, foundation/general-purpose model, generative AI, agentic AI** — and place a system among them. | 2_understand | H | M | `ai-system-definition`, `ml-vs-generative-vs-agentic`, `foundation-model`, `agentic-ai` |
| **1.3** | Explain the difference between an **AI risk** and an **AI harm**, and identify the categories of harm an AI system can cause. | 2_understand | H | H | `ai-risk-vs-harm`, `likelihood-and-severity`, `categories-of-ai-harm` |
| **1.4** | Identify the **actors in the AI value chain** and how their responsibilities differ. | 2_understand | H | H | `ai-value-chain-actors`, `provider-vs-deployer`, `affected-person` |
| **1.5** | Describe the **characteristics of trustworthy AI** and what each means in practice. | 2_understand | H | M | `trustworthy-ai-characteristics`, `validity-reliability`, `safety`, `security-resilience`, `accountability-transparency`, `explainability-interpretability`, `privacy-enhanced`, `fairness-bias-managed` |
| **1.6** | Explain why governance matters **more, not less**, as AI becomes generative and agentic. | 3_apply | M | H | `autonomy-risk`, `scale-and-opacity`, `why-govern-generative-agentic` |
| **1.7** | Distinguish the **types of governance instrument** — voluntary framework, binding regulation, management-system standard. | 2_understand | M | M | `governance-instrument-types`, `voluntary-framework`, `binding-regulation`, `management-system-standard` |
| **1.8** | Explain what an **AI management system (AIMS)** is, and how org-level governance differs from single-system risk work. | 2_understand | M | M | `ai-management-system`, `org-level-vs-project-level` |

### D1 concepts
- `ai-governance` — org-level structures, policies, roles, accountability directing how AI is developed and used.
- `ai-risk-management` — the ongoing process of identifying, analyzing, evaluating, treating AI risk.
- `ai-compliance` — conformance of AI practices to applicable laws, standards, and policy.
- `governance-vs-risk-vs-compliance` — governance sets direction, risk management works the systems, compliance evidences conformance; each necessary, none substitutable.
- `ai-system-definition` — a machine-based system that infers from input how to generate outputs influencing environments.
- `ml-vs-generative-vs-agentic` — ML predicts/classifies; generative produces content; agentic plans and acts with autonomy.
- `foundation-model` — a broadly-capable model adaptable to many tasks (the "GPAI" the EU AI Act singles out).
- `agentic-ai` — a system pursuing goals by planning and acting across steps/tools with reduced per-step human intervention.
- `ai-risk-vs-harm` — a harm is a realized negative impact; a risk is the possibility of a harm.
- `likelihood-and-severity` — the two axes by which AI risk is characterized and prioritized.
- `categories-of-ai-harm` — harms to individuals, groups, organizations, and society.
- `ai-value-chain-actors` — provider/developer, deployer, distributor, importer, affected person.
- `provider-vs-deployer` — the provider develops/places the system; the deployer uses it under its own authority; obligations differ.
- `affected-person` — the individual subject to or impacted by an AI system's output.
- `trustworthy-ai-characteristics` — the properties of trustworthy AI, taken together.
- `validity-reliability` — performs as intended, accurately and consistently.
- `safety` — does not create an unacceptable risk of harm under defined conditions.
- `security-resilience` — withstands adversarial attack, misuse, abnormal conditions, and recovers.
- `accountability-transparency` — responsibility assigned and traceable; appropriate information disclosed.
- `explainability-interpretability` — outputs and mechanisms can be understood by relevant audiences.
- `privacy-enhanced` — safeguards autonomy, identity, and personal data by design and use.
- `fairness-bias-managed` — harmful bias identified, measured, mitigated for equitable outcomes.
- `autonomy-risk` — risk from an AI system taking consequential action with reduced human intervention.
- `scale-and-opacity` — governance pressure from AI operating at scale and being hard to inspect/explain.
- `why-govern-generative-agentic` — as generation gets cheap and systems act autonomously, oversight and accountability matter more.
- `governance-instrument-types` — the distinct kinds of governance instrument and what each does.
- `voluntary-framework` — non-binding guidance adopted to structure practice.
- `binding-regulation` — enforceable law imposing obligations with penalties.
- `management-system-standard` — a certifiable standard defining an auditable organizational system.
- `ai-management-system` — the auditable set of policies, processes, controls for governing AI across its lifecycle.
- `org-level-vs-project-level` — governing AI across the organization vs managing one system's risk.

*D1: 8 tasks · 30 concepts · Bloom 7×understand, 1×apply.*

---

# D2 — AI Risk Management in Practice  *(22.5%)*

**Intent.** The applied core — how AI risk is actually managed: the **Govern/Map/
Measure/Manage** cycle, the identify→analyze→evaluate→treat process, characterizing
and treating risk, and the concrete AI-era risk types (generative taxonomy, agentic
risks, security risks, drift, oversight). Heaviest `3_apply`/`4_analyze` load.

| Code | Task — *the candidate can…* | Bloom | Freq | Crit | Concepts |
|---|---|---|---|---|---|
| **2.1** | Explain the purpose and structure of an AI risk-management framework, including **Govern, Map, Measure, Manage**. | 2_understand | H | H | `ai-rmf-purpose`, `govern-function`, `map-function`, `measure-function`, `manage-function` |
| **2.2** | Apply the risk process — **identify, analyze, evaluate, treat** — to a described AI use case. | 3_apply | H | H | `risk-identification`, `risk-analysis`, `risk-evaluation`, `risk-treatment`, `iterative-risk-process` |
| **2.3** | Characterize an AI risk by **likelihood and severity** and prioritize among competing risks. | 3_apply | H | H | `likelihood-and-severity` *(D1)*, `risk-prioritization`, `residual-risk` |
| **2.4** | Explain **risk tolerance** and how it determines which AI risks an organization accepts. | 2_understand | M | H | `risk-tolerance`, `acceptable-vs-unacceptable-risk` |
| **2.5** | Select an appropriate **risk-treatment option** — avoid, mitigate, transfer, accept — for a given risk. | 3_apply | H | H | `risk-treatment-options`, `avoid-mitigate-transfer-accept`, `control-selection` |
| **2.6** | Identify the **categories of generative-AI risk** and recognize them in a scenario. | 3_apply | H | H | `generative-ai-risk-taxonomy`, `confabulation-hallucination`, `harmful-bias`, `information-integrity`, `data-privacy-risk`, `ip-and-provenance-risk`, `harmful-content-risk` |
| **2.7** | Analyze the **distinctive risks of agentic AI** — autonomy, tool misuse, compounding actions — and why human oversight is required. | 4_analyze | M | H | `agentic-risk`, `tool-misuse`, `compounding-actions`, `human-oversight-necessity` |
| **2.8** | Explain the **security-oriented risks** — prompt injection, jailbreaks, training-data leakage — and that mitigations exist. | 3_apply | M | H | `prompt-injection`, `jailbreak`, `data-leakage-memorization`, `adversarial-input`, `mitigation-concept` |
| **2.9** | Explain **model drift** and the need for ongoing monitoring of deployed AI. | 2_understand | M | M | `model-drift`, `ongoing-monitoring` |
| **2.10** | Explain **human oversight** — human-in-the-loop and human-on-the-loop — as a primary control. | 2_understand | H | H | `human-in-the-loop`, `human-on-the-loop`, `oversight-as-control` |
| **2.11** | Explain how AI risk **integrates with enterprise risk** — privacy, security, safety. | 2_understand | M | M | `enterprise-risk-integration`, `ai-privacy-security-safety-overlap` |

### D2 concepts
- `ai-rmf-purpose` — why organizations use a structured, repeatable AI risk framework over ad-hoc judgment.
- `govern-function` — **Govern**: cross-cutting culture, roles, accountability, policy across the lifecycle.
- `map-function` — **Map**: establish an AI system's context and identify its risks.
- `measure-function` — **Measure**: assess, analyze, track identified risks.
- `manage-function` — **Manage**: prioritize, respond to, monitor risks; allocate resources.
- `risk-identification` — determining what could go wrong and to whom.
- `risk-analysis` — understanding a risk's nature, likelihood, severity.
- `risk-evaluation` — judging acceptability against tolerance.
- `risk-treatment` — acting to modify a risk to an acceptable level.
- `iterative-risk-process` — the process repeats across the lifecycle as context changes.
- `risk-prioritization` — ranking risks so effort targets the most significant first.
- `residual-risk` — the risk remaining after treatment.
- `risk-tolerance` — the level of risk an organization accepts to pursue objectives.
- `acceptable-vs-unacceptable-risk` — the threshold separating risks borne from those refused.
- `risk-treatment-options` — the set of possible responses to a risk.
- `avoid-mitigate-transfer-accept` — the four canonical treatment choices.
- `control-selection` — choosing controls proportionate to likelihood and severity.
- `generative-ai-risk-taxonomy` — the recognized set of generative-AI risk categories.
- `confabulation-hallucination` — confident, fluent output that is factually false.
- `harmful-bias` — outputs systematically and unfairly disadvantaging individuals/groups.
- `information-integrity` — generative AI's effect on the information ecosystem (misinformation, deepfakes).
- `data-privacy-risk` — exposure/misuse of personal data via training data or outputs.
- `ip-and-provenance-risk` — infringement, attribution, and origin issues in generated content.
- `harmful-content-risk` — generation of dangerous, violent, abusive, or harmful material.
- `agentic-risk` — risk from systems that plan and act autonomously across steps/tools.
- `tool-misuse` — an agent invoking a tool/action incorrectly, harmfully, or out of scope.
- `compounding-actions` — errors cascading and amplifying across an agent's multi-step chain.
- `human-oversight-necessity` — consequential autonomy demands a human check because the system acts faster/wider than a person can correct.
- `prompt-injection` — malicious input crafted to override or hijack an AI system's instructions.
- `jailbreak` — input designed to bypass a model's safety constraints.
- `data-leakage-memorization` — the model exposing sensitive data memorized in training.
- `adversarial-input` — input deliberately shaped to manipulate model behavior.
- `mitigation-concept` — these risks are reduced (not eliminated) by controls.
- `model-drift` — degradation of a deployed model's performance as conditions shift.
- `ongoing-monitoring` — continuous observation of a deployed system to detect drift and emerging risks.
- `human-in-the-loop` — a human reviews and approves within the decision loop before action.
- `human-on-the-loop` — a human supervises and can intervene without approving each action.
- `oversight-as-control` — human oversight as a designed, primary risk control for consequential AI.
- `enterprise-risk-integration` — managing AI risk within the organization's broader risk practices.
- `ai-privacy-security-safety-overlap` — AI risk intersects and must coordinate with privacy, security, safety.

*D2: 11 tasks · 41 concepts (40 new + 1 reused) · Bloom 5×understand, 5×apply, 1×analyze.*

---

# D3 — Regulatory & Standards Landscape  *(20%)*

**Intent.** Orient the practitioner in the instruments that govern AI — the EU AI
Act's risk-tier structure and obligation types, ISO/IEC 42001 and its family, NIST
AI RMF as a voluntary framework, and the emerging jurisdictional pattern — and how
they relate. Taught strictly as *structure and obligations*, never as compliance
advice and never implying Certidemy *is* any of them. Comprehension-heavy, with
the applied edge at provider-vs-deployer obligations and the cross-framework synthesis.

| Code | Task — *the candidate can…* | Bloom | Freq | Crit | Concepts |
|---|---|---|---|---|---|
| **3.1** | Explain the **EU AI Act's risk-based structure** and its four risk tiers. | 2_understand | H | H | `eu-ai-act-overview`, `risk-based-approach`, `unacceptable-risk-prohibited`, `high-risk-systems`, `limited-risk-transparency`, `minimal-risk` |
| **3.2** | Given a described AI system, **determine whether it is high-risk** under the EU AI Act and identify the obligations that attach. | 3_apply | H | H | `high-risk-obligations`, `risk-management-system-requirement`, `data-governance-requirement`, `technical-documentation-requirement`, `human-oversight-requirement`, `accuracy-robustness-cybersecurity`, `conformity-assessment` |
| **3.3** | Explain the **transparency obligations** for limited-risk AI. | 2_understand | M | M | `ai-interaction-disclosure`, `synthetic-content-labeling`, `deepfake-disclosure` |
| **3.4** | Distinguish **provider vs deployer obligations** under the EU AI Act. | 3_apply | M | H | `provider-vs-deployer` *(D1)*, `provider-obligations`, `deployer-obligations` |
| **3.5** | Explain the EU AI Act's treatment of **general-purpose AI (GPAI) models**. | 2_understand | M | M | `foundation-model` *(D1)*, `gpai-obligations`, `systemic-risk-model` |
| **3.6** | Explain what **ISO/IEC 42001** is and what certification to it signals. | 2_understand | H | H | `iso-42001-aims`, `management-system-certification`, `aims-dual-assessment` |
| **3.7** | Recognize the **companion ISO/IEC AI standards** and their roles. | 2_understand | M | M | `iso-ai-standards-family`, `iso-23894-risk`, `iso-42005-impact-assessment`, `iso-38507-governance`, `iso-22989-terminology` |
| **3.8** | Explain how the **NIST AI RMF** complements binding law and standards. | 2_understand | M | M | `nist-ai-rmf-voluntary`, `framework-complementarity`, `governance-instrument-types` *(D1)* |
| **3.9** | Recognize the **emerging pattern of AI regulation beyond the EU**. | 2_understand | M | M | `jurisdictional-patchwork`, `us-state-ai-laws`, `oecd-ai-principles`, `sectoral-ai-rules` |
| **3.10** | Analyze **how the frameworks reinforce one another** — voluntary framework, binding law, and management standard. | 4_analyze | M | H | `framework-interoperability`, `iso-42001-eu-act-alignment`, `defense-in-depth-governance` |

### D3 concepts
- `eu-ai-act-overview` — the EU AI Act: the first comprehensive, risk-based AI law (Reg. 2024/1689).
- `risk-based-approach` — obligations scale with the risk a use poses, not the technology itself.
- `unacceptable-risk-prohibited` — practices banned outright (e.g., social scoring, manipulative or exploitative systems).
- `high-risk-systems` — systems with significant impact on health, safety, or fundamental rights, heavily regulated.
- `limited-risk-transparency` — systems subject mainly to transparency/disclosure duties.
- `minimal-risk` — the majority of AI systems; no specific obligations.
- `high-risk-obligations` — the set of requirements attaching to high-risk systems.
- `risk-management-system-requirement` — a documented, ongoing risk-management process is required.
- `data-governance-requirement` — training/validation/test data quality and governance requirements.
- `technical-documentation-requirement` — documentation demonstrating the system meets requirements.
- `human-oversight-requirement` — high-risk systems must enable effective human oversight.
- `accuracy-robustness-cybersecurity` — performance, robustness, and security requirements for high-risk systems.
- `conformity-assessment` — the process to demonstrate a high-risk system meets the requirements.
- `ai-interaction-disclosure` — informing people when they are interacting with an AI system.
- `synthetic-content-labeling` — marking AI-generated or manipulated content as artificial.
- `deepfake-disclosure` — disclosing manipulated audio/image/video content.
- `provider-obligations` — what the developer/provider of an AI system must do.
- `deployer-obligations` — what the using organization must do when deploying an AI system.
- `gpai-obligations` — documentation and transparency obligations on providers of general-purpose AI models.
- `systemic-risk-model` — the most capable GPAI models carrying additional obligations.
- `iso-42001-aims` — ISO/IEC 42001: the certifiable AI management system standard.
- `management-system-certification` — what independent third-party certification to a management standard signals.
- `aims-dual-assessment` — ISO/IEC 42001's two mandatory processes: AI risk assessment and AI system impact assessment.
- `iso-ai-standards-family` — the set of complementary ISO/IEC AI standards around 42001.
- `iso-23894-risk` — companion guidance on AI risk management.
- `iso-42005-impact-assessment` — guidance on AI system impact assessment.
- `iso-38507-governance` — governance guidance for governing bodies (boards/leadership).
- `iso-22989-terminology` — foundational AI concepts and terminology.
- `nist-ai-rmf-voluntary` — the NIST AI RMF as a voluntary, sector-neutral risk framework.
- `framework-complementarity` — how a voluntary framework complements binding law and certifiable standards.
- `jurisdictional-patchwork` — AI regulation emerging unevenly across jurisdictions.
- `us-state-ai-laws` — the pattern of US state-level AI / automated-decision laws.
- `oecd-ai-principles` — the OECD AI Principles as a shared international baseline.
- `sectoral-ai-rules` — sector-specific AI rules layered on top of general law.
- `framework-interoperability` — how voluntary framework, binding law, and management standard overlap and reinforce.
- `iso-42001-eu-act-alignment` — ISO/IEC 42001 certification supports EU AI Act readiness but does not automatically confer compliance.
- `defense-in-depth-governance` — using multiple instruments together for stronger, layered governance.

*D3: 10 tasks · 37 new concepts (+3 reused: `provider-vs-deployer`, `foundation-model`, `governance-instrument-types`) · Bloom 7×understand, 2×apply, 1×analyze.*

---

# D4 — The AI Lifecycle & Accountable Deployment  *(25% — signature domain)*

**Intent.** The signature applied domain: governance across the AI lifecycle
(design→data→develop→validate→deploy→monitor→retire), the accountability at each
stage, AI system impact assessment, documentation and provenance, human oversight
in live systems, incident response and post-market monitoring, third-party AI, and
— the AI-era capstone — accountability in agentic workflows (where a human stays
accountable when an agent acts). Richest domain; most `3_apply`/`4_analyze`.

| Code | Task — *the candidate can…* | Bloom | Freq | Crit | Concepts |
|---|---|---|---|---|---|
| **4.1** | Explain the **stages of the AI system lifecycle** and why governance applies at each. | 2_understand | H | H | `ai-system-lifecycle`, `lifecycle-stages`, `governance-across-lifecycle` |
| **4.2** | Identify the **accountability and decisions** that belong at each lifecycle stage. | 3_apply | H | H | `stage-accountability`, `gate-reviews`, `lifecycle-decision-points` |
| **4.3** | Explain the purpose of an **AI system impact assessment** and when it is performed. | 2_understand | H | H | `ai-impact-assessment`, `impact-vs-risk-assessment`, `when-to-assess` |
| **4.4** | Apply an **impact-assessment mindset** to a described AI system — who is affected, what could go wrong, what safeguards. | 3_apply | M | H | `affected-stakeholders`, `foreseeable-misuse`, `safeguards-identification` |
| **4.5** | Explain the role of **technical documentation, model cards, and system cards** in accountable AI. | 2_understand | M | M | `documentation-for-accountability`, `model-card`, `system-card` |
| **4.6** | Explain **data governance across the lifecycle** — provenance, quality, representativeness, consent. | 2_understand | H | H | `data-provenance`, `data-quality-representativeness`, `data-consent-rights` |
| **4.7** | Explain **content provenance and authenticity** for generated content. | 2_understand | M | M | `content-provenance`, `synthetic-content-labeling` *(D3)*, `content-authenticity-standards` |
| **4.8** | Analyze how **human oversight is designed into a deployed system** — oversight points, override, escalation. | 4_analyze | M | H | `oversight-design`, `override-and-escalation`, `human-in-the-loop` *(D2)*, `human-on-the-loop` *(D2)* |
| **4.9** | Explain **post-market monitoring and incident response** for deployed AI. | 3_apply | H | H | `post-market-monitoring`, `incident-response`, `serious-incident-reporting` |
| **4.10** | Explain the governance of **third-party and procured AI** — vendor assessment, supply-chain accountability. | 2_understand | M | H | `third-party-ai-governance`, `vendor-assessment`, `supply-chain-accountability` |
| **4.11** | Analyze **accountability in agentic workflows** — where a human remains accountable when an agent acts. | 4_analyze | M | H | `agentic-accountability`, `accountability-cannot-be-delegated`, `meaningful-human-control` |
| **4.12** | Explain responsible **decommissioning and change management** for AI systems. | 2_understand | M | M | `responsible-decommissioning`, `change-management` |

### D4 concepts
- `ai-system-lifecycle` — the stages an AI system passes through from conception to retirement.
- `lifecycle-stages` — design, data, development, validation, deployment, monitoring, retirement.
- `governance-across-lifecycle` — governance applies continuously, not only at launch.
- `stage-accountability` — the decisions and owners that belong at each lifecycle stage.
- `gate-reviews` — checkpoints where a system is reviewed before proceeding to the next stage.
- `lifecycle-decision-points` — key go/no-go decisions across the lifecycle.
- `ai-impact-assessment` — evaluating an AI system's effects on individuals, groups, and society.
- `impact-vs-risk-assessment` — impact assessment (effects on people) vs risk assessment (threats to objectives).
- `when-to-assess` — impact assessment performed early and updated across the lifecycle.
- `affected-stakeholders` — identifying who is affected, directly and indirectly, by an AI system.
- `foreseeable-misuse` — anticipating how the system could be misused or fail.
- `safeguards-identification` — determining mitigations proportionate to the assessed impact.
- `documentation-for-accountability` — documentation as the substrate of accountability and audit.
- `model-card` — a standardized summary of a model's characteristics, intended use, and limitations.
- `system-card` — documentation of an AI system's design, data, and evaluation.
- `data-provenance` — knowing the origin and history of training and input data.
- `data-quality-representativeness` — data fit for purpose and representative of the affected population.
- `data-consent-rights` — lawful basis and consent for the data used.
- `content-provenance` — establishing the origin and authenticity of generated content.
- `content-authenticity-standards` — provenance/authenticity standards (e.g., C2PA-style) for media.
- `oversight-design` — designing where and how humans oversee a deployed system.
- `override-and-escalation` — mechanisms for humans to intervene, override, or escalate.
- `post-market-monitoring` — ongoing surveillance of a deployed system's real-world performance.
- `incident-response` — responding to AI failures and harms when they occur.
- `serious-incident-reporting` — escalating and reporting significant AI incidents.
- `third-party-ai-governance` — governing AI obtained from vendors and suppliers.
- `vendor-assessment` — evaluating a supplier's AI risk and governance posture.
- `supply-chain-accountability` — accountability persists even when AI is procured, not built in-house.
- `agentic-accountability` — who remains accountable when an autonomous agent takes action.
- `accountability-cannot-be-delegated` — accountability for AI-assisted work cannot be handed to the tool.
- `meaningful-human-control` — retaining genuine control over consequential autonomous action.
- `responsible-decommissioning` — safely retiring an AI system.
- `change-management` — governing significant changes to a deployed system.

*D4: 12 tasks · 33 new concepts (+3 reused: `synthetic-content-labeling`, `human-in-the-loop`, `human-on-the-loop`) · Bloom 7×understand, 3×apply (4.2, 4.4, 4.9), 2×analyze (4.8, 4.11).*

---

# D5 — Responsible AI, Ethics & the Governance Function  *(17.5%)*

**Intent.** The human and organizational layer that sustains everything else:
the ethical principles, fairness/transparency/privacy as duties, and how a real
governance function is built and kept alive — roles, policy, literacy, culture.
Comprehension-led with an analytic capstone that ties ethics, policy, and function
into sustained trustworthy AI.

| Code | Task — *the candidate can…* | Bloom | Freq | Crit | Concepts |
|---|---|---|---|---|---|
| **5.1** | Explain the **core principles of responsible AI**. | 2_understand | H | H | `responsible-ai-principles`, `human-centered-ai`, `oecd-ai-principles` *(D3)*, `beneficence-nonmaleficence` |
| **5.2** | Explain **fairness and bias** as an ethical and practical concern, and how bias enters AI systems. | 3_apply | H | H | `fairness-in-ai`, `sources-of-bias`, `bias-mitigation`, `fairness-bias-managed` *(D1)* |
| **5.3** | Explain **transparency and explainability** as duties to affected people. | 2_understand | M | H | `transparency-duty`, `explainability-for-stakeholders`, `meaningful-information` |
| **5.4** | Explain **privacy** as a responsible-AI concern beyond legal compliance. | 2_understand | M | M | `privacy-beyond-compliance`, `privacy-by-design`, `data-minimization` |
| **5.5** | Given an organization's context, **determine an appropriate AI governance-function structure** — roles, committee, RACI. | 3_apply | H | H | `ai-governance-function`, `governance-roles-raci`, `ai-governance-committee` |
| **5.6** | Explain the role of an **AI policy** in guiding organizational AI use. | 2_understand | M | H | `ai-policy`, `policy-to-practice`, `acceptable-use-ai` |
| **5.7** | Explain **AI literacy and training** as a governance obligation and culture practice. | 2_understand | M | M | `ai-literacy`, `training-and-culture`, `role-based-ai-training` |
| **5.8** | Analyze how **ethics, policy, and the governance function combine** to sustain trustworthy AI over time. | 4_analyze | M | H | `sustaining-trustworthy-ai`, `continuous-improvement-governance`, `governance-maturity` |

### D5 concepts
- `responsible-ai-principles` — the core principles guiding ethical AI development and use.
- `human-centered-ai` — AI designed to serve human values, rights, and wellbeing.
- `beneficence-nonmaleficence` — doing good and avoiding harm as ethical anchors for AI.
- `fairness-in-ai` — equitable treatment across individuals and groups.
- `sources-of-bias` — how bias enters AI via data, design, and deployment.
- `bias-mitigation` — measuring and reducing harmful bias.
- `transparency-duty` — the obligation to be open about AI use and behavior.
- `explainability-for-stakeholders` — providing explanations appropriate to the audience.
- `meaningful-information` — giving affected people usable information about AI decisions affecting them.
- `privacy-beyond-compliance` — treating privacy as an ethical commitment, not just the legal minimum.
- `privacy-by-design` — building privacy protections into AI systems from the start.
- `data-minimization` — collecting and retaining only the data actually needed.
- `ai-governance-function` — the organizational structure that owns and coordinates AI governance.
- `governance-roles-raci` — defined roles and responsibilities (RACI) for AI governance.
- `ai-governance-committee` — a cross-functional body overseeing consequential AI decisions.
- `ai-policy` — the organization's documented commitment and rules for AI.
- `policy-to-practice` — how policy translates into day-to-day AI decisions.
- `acceptable-use-ai` — rules defining permissible AI use within the organization.
- `ai-literacy` — workforce understanding of AI capabilities, limits, and risks.
- `training-and-culture` — building a risk-aware, responsible AI culture.
- `role-based-ai-training` — training tailored to each role's AI responsibilities.
- `sustaining-trustworthy-ai` — how ethics, policy, function, and review sustain trust over time.
- `continuous-improvement-governance` — governance as an ongoing, improving practice.
- `governance-maturity` — the progression from ad-hoc to systematic AI governance.

*D5: 8 tasks · 24 new concepts (+2 reused: `oecd-ai-principles`, `fairness-bias-managed`) · Bloom 5×understand, 2×apply (5.2, 5.5), 1×analyze — the second applied task added per Grok's balance note; weight held at 17.5%.*

---

## JTA totals

| | Tasks | New concepts | Reused links | Blueprint items |
|---|---|---|---|---|
| D1 | 8 | 30 | — | 12 |
| D2 | 11 | 40 | 1 | 18 |
| D3 | 10 | 37 | 3 | 16 |
| D4 | 12 | 33 | 3 | 20 |
| D5 | 8 | 24 | 2 | 14 |
| **Total** | **49** | **164** | **9** | **80** |

**Bloom distribution (49 tasks):** 31× `2_understand`, 13× `3_apply`, 5× `4_analyze`.
The applied/analytic tasks cluster in D2 and D4 (the AI-era-native core); after the
polish pass D3 and D5 each carry a genuine applied task (3.2, 5.5) in addition to
their analyze task, so no domain is comprehension-flat. Consistent with an entry
("I") tier: fair, knowledge-and-application, not tricky.

**Downstream contract (CERT-CREATION.md §4):** each of the 164 concepts must be
taught by ≥1 lesson per language and tested to the item floors (≥8 secure / ≥10
practice per task per language, all 49 tasks, en/es-419/pt-BR), with
`untaught_testing_violations = 0` and the secure firewall at 0.

---

## Sign-off gate

- [ ] Grok full-JTA consistency + commercial review (all five domains).
- [ ] Juan accepts/declines Grok's notes with reasoning; lock.

On lock → this becomes **`AIGRM-I_JTA_v1.md`** (scheme-of-record), and Stage 6
begins: author the scaffold migrations (cert + 5 domains + 49 tasks + 164 concepts
+ `task_concepts` + 5 modules), editor-first, per CERT-CREATION.md.

*Level II note: the situational-judgment "best-of-four" version (AIGRM-II) reuses
this domain/task spine but requires the L2 item generator (CERT-CREATION.md §5) —
not this cert, not yet.*
