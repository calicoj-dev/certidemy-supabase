# AIGRM-I - Job-Task Analysis

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

**Certification:** Certidemy AI Governance & Risk Management I - AI  
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
| D1 | Foundations of AI Governance & Trustworthy AI | 15% | 12 |
| D2 | AI Risk Management in Practice | 22.5% | 18 |
| D3 | Regulatory & Standards Landscape | 20% | 16 |
| D4 | The AI Lifecycle & Accountable Deployment | 25% | 20 |
| D5 | Responsible AI, Ethics & the Governance Function | 17.5% | 14 |
| **Total** | | **100%** | **80** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 1 (Remember) | 2 | 3% |
| 2 (Understand) | 33 | 65.06% |
| 3 (Apply) | 13 | 25.62% |
| 4 (Analyze) | 3 | 6.32% |

---

# Domain D1 - Foundations of AI Governance & Trustworthy AI (15%)

**Description.** The shared vocabulary and mental model the credential builds on: what AI governance, risk, and compliance are and how they differ; core AI terms; risk versus harm; the value-chain actors; the characteristics of trustworthy AI; why autonomy and scale raise the governance stakes; and the types of governance instrument. Predominantly comprehension, making the applied domains legible.

**Tasks:** 10  |  **MCQ seats:** 12

## Tasks

### Task 1.1 - Distinguish AI governance, AI risk management, and AI compliance, and explain why an organization needs all three.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-compliance`, `ai-governance`, `ai-risk-management`, `governance-vs-risk-vs-compliance` |

- **K:** Governance directs and holds accountable; risk management works specific systems; compliance evidences conformance to law/standards/policy.
- **S:** Separate the three when a scenario blurs them; name which is missing.
- **A:** Precision about organizational responsibilities.

### Task 1.2 - Define the core AI terms and place a given system among them.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `agentic-ai`, `ai-system-definition`, `foundation-model`, `ml-vs-generative-vs-agentic` |

- **K:** AI system, model, foundation/general-purpose model, generative AI, agentic AI, and how they differ.
- **S:** Classify a described system by type.
- **A:** Comfort with fast-moving terminology.

### Task 1.3 - Explain the difference between an AI risk and an AI harm, and identify the categories of harm an AI system can cause.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-risk-vs-harm`, `categories-of-ai-harm`, `likelihood-and-severity` |

- **K:** A harm is a realized negative impact; a risk is its possibility, characterized by likelihood and severity; harms span individuals, groups, organizations, society.
- **S:** Separate risk from harm in a scenario; categorize a described harm.
- **A:** Concern for those affected by AI.

### Task 1.4 - Identify the actors in the AI value chain and how their responsibilities differ.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `affected-person`, `ai-value-chain-actors`, `provider-vs-deployer` |

- **K:** Provider/developer, deployer, distributor, importer, affected person; obligations differ by role.
- **S:** Assign the right role to an actor in a scenario.
- **A:** Fairness in allocating responsibility.

### Task 1.5 - Describe the characteristics of trustworthy AI and what each means in practice.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `accountability-transparency`, `explainability-interpretability`, `fairness-bias-managed`, `privacy-enhanced`, `safety`, `security-resilience`, `trustworthy-ai-characteristics`, `validity-reliability` |

- **K:** Validity/reliability, safety, security/resilience, accountability/transparency, explainability/interpretability, privacy, fairness-with-bias-managed, taken together.
- **S:** Match a described shortfall to the trustworthy-AI characteristic it violates.
- **A:** Holistic view of what makes AI worthy of trust.

### Task 1.6 - Explain why governance matters more, not less, as AI becomes generative and agentic.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `autonomy-risk`, `scale-and-opacity`, `why-govern-generative-agentic` |

- **K:** Autonomy, scale, and opacity raise the stakes; cheap generation and autonomous action make oversight and accountability more important.
- **S:** Reason from a generative/agentic scenario to why oversight increases.
- **A:** Resisting the assumption that better AI needs less governance.

### Task 1.7 - Distinguish the types of governance instrument and what each is for.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `binding-regulation`, `governance-instrument-types`, `management-system-standard`, `voluntary-framework` |

- **K:** Voluntary framework vs binding regulation vs management-system standard, and the purpose of each.
- **S:** Classify a named instrument by type.
- **A:** Clarity about what each instrument can and cannot do.

### Task 1.8 - Explain what an AI management system (AIMS) is, and how org-level governance differs from single-system risk work.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-management-system`, `org-level-vs-project-level` |

- **K:** An AIMS is the auditable organizational system for governing AI; org-level governance differs from managing one system's risk.
- **S:** Separate org-level from project-level concerns in a scenario.
- **A:** Systems thinking about the whole organization.

### Task 1.9 - Recall the core AI terms: AI system, model, foundation/general-purpose model, generative AI, agentic AI

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `agentic-ai`, `ai-system-definition`, `foundation-model`, `ml-vs-generative-vs-agentic` |

- **K:** The definitions of AI system, model, foundation / general-purpose model, generative AI, and agentic AI - and which term names which thing. These are not vocabulary trivia: the EU AI Act's obligations attach to these categories, so a term applied wrongly is an obligation missed.
- **S:** State what each term means and which is which.
- **A:** Precision with terminology that carries legal weight.

### Task 1.10 - Recall the actors in the AI value chain: provider, deployer, distributor, importer, affected person

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `affected-person`, `ai-value-chain-actors`, `provider-vs-deployer` |

- **K:** Provider (develops or places the system on the market), deployer (uses it under its own authority), distributor, importer, and affected person (whose rights or opportunities the output touches, whether or not they interacted with the system). These are legally defined roles, and each carries distinct obligations.
- **S:** Name each actor and state what defines it.
- **A:** Precision with roles that determine who is legally on the hook.

---

# Domain D2 - AI Risk Management in Practice (22.5%)

**Description.** The applied core: how AI risk is actually managed. The Govern/Map/Measure/Manage cycle, the identify-analyze-evaluate-treat process, characterizing and treating risk, and the concrete AI-era risk types - the generative taxonomy, agentic risks, security-oriented risks, model drift, and human oversight as a control. Carries the heaviest apply/analyze load.

**Tasks:** 11  |  **MCQ seats:** 18

## Tasks

### Task 2.1 - Explain the purpose and structure of an AI risk-management framework, including Govern, Map, Measure, and Manage.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-rmf-purpose`, `govern-function`, `manage-function`, `map-function`, `measure-function` |

- **K:** A structured, repeatable framework; the four functions Govern (cross-cutting), Map, Measure, Manage.
- **S:** Assign an activity to the correct function.
- **A:** Preference for structure over ad-hoc risk handling.

### Task 2.2 - Apply the risk process to a described AI use case.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `iterative-risk-process`, `risk-analysis`, `risk-evaluation`, `risk-identification`, `risk-treatment` |

- **K:** Identify, analyze, evaluate, treat; the process iterates across the lifecycle.
- **S:** Walk a use case through the four process steps.
- **A:** Discipline in following a repeatable process.

### Task 2.3 - Characterize an AI risk by its likelihood and severity and prioritize among competing risks.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `likelihood-and-severity`, `residual-risk`, `risk-prioritization` |

- **K:** Likelihood x severity; prioritization; residual risk after treatment.
- **S:** Rank risks and identify residual risk.
- **A:** Proportionality; focusing effort where it matters.

### Task 2.4 - Explain risk tolerance and how it determines which AI risks an organization accepts.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `acceptable-vs-unacceptable-risk`, `risk-tolerance` |

- **K:** Risk tolerance sets the acceptable/unacceptable threshold in pursuit of objectives.
- **S:** Judge a risk against a stated tolerance.
- **A:** Respect for organizational risk appetite.

### Task 2.5 - Select an appropriate risk-treatment option for a given AI risk.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `avoid-mitigate-transfer-accept`, `control-selection`, `risk-treatment-options` |

- **K:** Avoid, mitigate, transfer, accept; select controls proportionate to the risk.
- **S:** Choose and justify a treatment for a described risk.
- **A:** Decisiveness balanced with proportionality.

### Task 2.6 - Identify the categories of generative-AI risk and recognize them in a scenario.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `confabulation-hallucination`, `data-privacy-risk`, `generative-ai-risk-taxonomy`, `harmful-bias`, `harmful-content-risk`, `information-integrity`, `ip-and-provenance-risk` |

- **K:** Confabulation, harmful bias, information integrity, data privacy, IP/provenance, harmful content.
- **S:** Name the generative-risk category present in a scenario.
- **A:** Vigilance toward generative-AI failure modes.

### Task 2.7 - Analyze the distinctive risks of agentic AI and why human oversight is required.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `agentic-risk`, `compounding-actions`, `human-oversight-necessity`, `tool-misuse` |

- **K:** Autonomy, tool misuse, compounding actions; why consequential autonomy demands a human check.
- **S:** Trace how an agent's autonomy amplifies a failure and where oversight belongs.
- **A:** Healthy caution toward autonomous action.

### Task 2.8 - Explain the security-oriented risks of AI systems and that mitigations exist.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `adversarial-input`, `data-leakage-memorization`, `jailbreak`, `mitigation-concept`, `prompt-injection` |

- **K:** Prompt injection, jailbreaks, training-data leakage, adversarial input; controls reduce but do not eliminate them.
- **S:** Recognize a security-oriented AI risk and name a class of mitigation.
- **A:** Security-mindedness without false certainty.

### Task 2.9 - Explain model drift and the need for ongoing monitoring of deployed AI.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `model-drift`, `ongoing-monitoring` |

- **K:** Drift is performance degradation as conditions change; ongoing monitoring detects it.
- **S:** Spot drift risk in a described deployment.
- **A:** Attentiveness to systems after launch.

### Task 2.10 - Explain human oversight as a primary control for consequential AI.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `human-in-the-loop`, `human-on-the-loop`, `oversight-as-control` |

- **K:** Human-in-the-loop and human-on-the-loop as designed, primary controls.
- **S:** Choose the oversight mode fitting a consequential decision.
- **A:** Insistence on human judgment where it counts.

### Task 2.11 - Explain how AI risk integrates with enterprise risk rather than standing alone.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-privacy-security-safety-overlap`, `enterprise-risk-integration` |

- **K:** AI risk is managed within broader enterprise risk; it overlaps privacy, security, safety.
- **S:** Connect an AI risk to the enterprise-risk domain it touches.
- **A:** Integrative rather than siloed thinking.

---

# Domain D3 - Regulatory & Standards Landscape (20%)

**Description.** Orient the practitioner in the instruments that govern AI - the EU AI Act's risk-tier structure and obligation types, ISO/IEC 42001 and its family, the NIST AI RMF as a voluntary framework, and the emerging jurisdictional pattern - and how they relate. Taught strictly as structure and obligations, never as compliance advice and never implying Certidemy is any of them.

**Tasks:** 10  |  **MCQ seats:** 16

## Tasks

### Task 3.1 - Explain the EU AI Act's risk-based structure and its four risk tiers.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `eu-ai-act-overview`, `high-risk-systems`, `limited-risk-transparency`, `minimal-risk`, `risk-based-approach`, `unacceptable-risk-prohibited` |

- **K:** Risk-based approach; unacceptable/prohibited, high, limited/transparency, minimal tiers.
- **S:** Place a use case in the correct risk tier.
- **A:** Accuracy about a binding legal framework.

### Task 3.2 - Given a described AI system, determine whether it is high-risk under the EU AI Act and identify the obligations that attach.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `accuracy-robustness-cybersecurity`, `conformity-assessment`, `data-governance-requirement`, `high-risk-obligations`, `human-oversight-requirement`, `risk-management-system-requirement`, `technical-documentation-requirement` |

- **K:** High-risk obligations: risk-management system, data governance, technical documentation, human oversight, accuracy/robustness/cybersecurity, conformity assessment.
- **S:** Decide high-risk status for a system and list the obligations that follow.
- **A:** Care in applying legal criteria to a real case.

### Task 3.3 - Explain the transparency obligations for limited-risk AI.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-interaction-disclosure`, `deepfake-disclosure`, `synthetic-content-labeling` |

- **K:** Disclose AI interaction; label synthetic content; disclose deepfakes.
- **S:** Identify which transparency duty a scenario triggers.
- **A:** Honesty toward end users.

### Task 3.4 - Distinguish provider vs deployer obligations under the EU AI Act.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `deployer-obligations`, `provider-obligations`, `provider-vs-deployer` |

- **K:** Providers develop/place systems; deployers use them; each carries distinct obligations.
- **S:** Assign an obligation to provider or deployer in a scenario.
- **A:** Fairness in allocating duties.

### Task 3.5 - Explain the EU AI Act's treatment of general-purpose AI (GPAI) models.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `foundation-model`, `gpai-obligations`, `systemic-risk-model` |

- **K:** GPAI transparency/documentation obligations; systemic-risk models carry additional duties.
- **S:** Recognize when GPAI-specific obligations apply.
- **A:** Currency with evolving GPAI rules.

### Task 3.6 - Explain what ISO/IEC 42001 is and what certification to it signals.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aims-dual-assessment`, `iso-42001-aims`, `management-system-certification` |

- **K:** The certifiable AI management system standard; certification signals an audited AIMS; dual mandatory risk + impact assessment.
- **S:** Explain what an ISO 42001 certificate does and does not attest.
- **A:** Respect for independent assurance.

### Task 3.7 - Match each companion ISO/IEC AI standard to the purpose it serves.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `iso-22989-terminology`, `iso-23894-risk`, `iso-38507-governance`, `iso-42005-impact-assessment`, `iso-ai-standards-family` |

- **K:** 23894 (risk), 42005 (impact assessment), 38507 (governance), 22989 (terminology) around 42001.
- **S:** Match a companion standard to its purpose.
- **A:** Orientation within a standards family.

### Task 3.8 - Explain how the NIST AI RMF complements binding law and standards.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `framework-complementarity`, `governance-instrument-types`, `nist-ai-rmf-voluntary` |

- **K:** A voluntary, sector-neutral framework that complements binding law and certifiable standards.
- **S:** Position NIST AI RMF relative to law and standards.
- **A:** Even-handedness across instruments.

### Task 3.9 - Recognize the emerging pattern of AI regulation beyond the EU.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `jurisdictional-patchwork`, `oecd-ai-principles`, `sectoral-ai-rules`, `us-state-ai-laws` |

- **K:** US state laws, sectoral rules, and OECD principles as a shared baseline; a shifting patchwork.
- **S:** Recognize the pattern rather than any single statute's detail.
- **A:** Comfort with legal uncertainty and change.

### Task 3.10 - Explain how the frameworks reinforce one another.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `defense-in-depth-governance`, `framework-interoperability`, `iso-42001-eu-act-alignment` |

- **K:** Where voluntary framework, binding law, and management standard overlap; ISO 42001 supports EU-Act readiness (not automatic compliance); defense in depth.
- **S:** Explain how two instruments combine to strengthen governance.
- **A:** Synthesis across instruments.

---

# Domain D4 - The AI Lifecycle & Accountable Deployment (25%)

**Description.** The signature domain: governance across the AI lifecycle, the accountability at each stage, AI system impact assessment, documentation and provenance, human oversight in live systems, incident response and post-market monitoring, third-party AI, and the AI-era capstone of accountability in agentic workflows. The richest domain; most apply/analyze.

**Tasks:** 12  |  **MCQ seats:** 20

## Tasks

### Task 4.1 - Explain the stages of the AI system lifecycle and why governance applies at each.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-system-lifecycle`, `governance-across-lifecycle`, `lifecycle-stages` |

- **K:** Design, data, development, validation, deployment, monitoring, retirement; governance is continuous.
- **S:** Place a governance activity at the right lifecycle stage.
- **A:** End-to-end ownership mindset.

### Task 4.2 - Identify the accountability and decisions that belong at each lifecycle stage.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `gate-reviews`, `lifecycle-decision-points`, `stage-accountability` |

- **K:** Stage accountability, gate reviews, and go/no-go decision points.
- **S:** Assign an owner and a gate decision to a stage.
- **A:** Clarity about who decides what, when.

### Task 4.3 - Explain the purpose of an AI system impact assessment and when it is performed.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-impact-assessment`, `impact-vs-risk-assessment`, `when-to-assess` |

- **K:** Evaluates effects on people; distinct from risk assessment; performed early and updated across the lifecycle.
- **S:** Explain why and when an impact assessment is done.
- **A:** Concern for real-world effects on people.

### Task 4.4 - Apply an impact-assessment mindset to a described AI system.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `affected-stakeholders`, `foreseeable-misuse`, `safeguards-identification` |

- **K:** Who is affected, what could go wrong, what safeguards; foreseeable misuse.
- **S:** Produce affected-parties, failure modes, and safeguards for a system.
- **A:** Anticipatory, stakeholder-centered thinking.

### Task 4.5 - Explain the role of technical documentation, model cards, and system cards in accountable AI.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `documentation-for-accountability`, `model-card`, `system-card` |

- **K:** Documentation as the substrate of accountability; model cards and system cards.
- **S:** Identify what belongs in a model or system card.
- **A:** Diligence in record-keeping.

### Task 4.6 - Explain data governance across the lifecycle.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `data-consent-rights`, `data-provenance`, `data-quality-representativeness` |

- **K:** Provenance, quality and representativeness, consent and rights.
- **S:** Spot a data-governance gap in a scenario.
- **A:** Stewardship of data and the people behind it.

### Task 4.7 - Explain content provenance and authenticity for generated content.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `content-authenticity-standards`, `content-provenance`, `synthetic-content-labeling` |

- **K:** Content provenance; synthetic-content labeling; authenticity standards (e.g., C2PA-style).
- **S:** Recommend a provenance measure for generated media.
- **A:** Commitment to an authentic information ecosystem.

### Task 4.8 - Select where human oversight belongs in a deployed AI system, and what escalation it requires

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `human-in-the-loop`, `human-on-the-loop`, `override-and-escalation`, `oversight-design` |

- **K:** Oversight points, override, escalation; in-the-loop vs on-the-loop by consequence.
- **S:** Place oversight at the accountable decision points of a described deployment, choosing from human-in-the-loop, human-on-the-loop, and gate review.
- **A:** Insistence on real, not nominal, human control.

### Task 4.9 - Explain post-market monitoring and incident response for deployed AI.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `incident-response`, `post-market-monitoring`, `serious-incident-reporting` |

- **K:** Post-market monitoring, incident response, serious-incident reporting.
- **S:** Outline a monitoring-and-response plan for a deployed system.
- **A:** Readiness for things going wrong.

### Task 4.10 - Explain the governance of third-party and procured AI.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `supply-chain-accountability`, `third-party-ai-governance`, `vendor-assessment` |

- **K:** Vendor assessment; supply-chain accountability persists when AI is procured.
- **S:** Identify what to assess before adopting a vendor's AI.
- **A:** Accountability that does not stop at the vendor's door.

### Task 4.11 - Analyze accountability in agentic workflows.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `accountability-cannot-be-delegated`, `agentic-accountability`, `meaningful-human-control` |

- **K:** Who remains accountable when an agent acts; accountability cannot be delegated to the tool; meaningful human control.
- **S:** Locate where human accountability sits in an agentic workflow.
- **A:** Refusal to let the tool absorb responsibility.

### Task 4.12 - Explain responsible decommissioning and change management for AI systems.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `change-management`, `responsible-decommissioning` |

- **K:** Safe retirement; governing significant changes to a deployed system.
- **S:** Identify decommissioning and change-control steps.
- **A:** Care through the end of the lifecycle.

---

# Domain D5 - Responsible AI, Ethics & the Governance Function (17.5%)

**Description.** The human and organizational layer that sustains everything else: the ethical principles, fairness/transparency/privacy as duties, and how a real governance function is built and kept alive - roles, policy, literacy, culture. Comprehension-led with an analytic capstone tying ethics, policy, and function into sustained trustworthy AI.

**Tasks:** 8  |  **MCQ seats:** 14

## Tasks

### Task 5.1 - Explain the core principles of responsible AI.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `beneficence-nonmaleficence`, `human-centered-ai`, `oecd-ai-principles`, `responsible-ai-principles` |

- **K:** Human-centered, fairness, transparency, accountability, privacy, robustness; beneficence and non-maleficence.
- **S:** Match a practice to the responsible-AI principle it serves.
- **A:** Principled commitment beyond the minimum.

### Task 5.2 - Trace where bias entered an AI system and determine how to mitigate it

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `bias-mitigation`, `fairness-bias-managed`, `fairness-in-ai`, `sources-of-bias` |

- **K:** Fairness; sources of bias in data, design, deployment; bias mitigation.
- **S:** Trace where bias entered a described system and how to mitigate it.
- **A:** Commitment to equitable outcomes.

### Task 5.3 - Explain transparency and explainability as duties to affected people.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `explainability-for-stakeholders`, `meaningful-information`, `transparency-duty` |

- **K:** Transparency duty; audience-appropriate explainability; meaningful information for affected people.
- **S:** Judge whether an explanation meets a stakeholder's needs.
- **A:** Respect for people's right to understand.

### Task 5.4 - Explain privacy as a responsible-AI concern beyond legal compliance.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `data-minimization`, `privacy-beyond-compliance`, `privacy-by-design` |

- **K:** Privacy beyond compliance; privacy by design; data minimization.
- **S:** Recommend a privacy-by-design measure for a system.
- **A:** Care for personal data as an ethical duty.

### Task 5.5 - Given an organization's context, determine an appropriate AI governance-function structure.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-governance-committee`, `ai-governance-function`, `governance-roles-raci` |

- **K:** Roles, a governance committee, and RACI fit to the organization's context.
- **S:** Propose a fit-for-context governance structure.
- **A:** Pragmatism about what an organization can actually run.

### Task 5.6 - Explain the role of an AI policy in guiding organizational AI use.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `acceptable-use-ai`, `ai-policy`, `policy-to-practice` |

- **K:** An AI policy as documented commitment; policy-to-practice; acceptable-use rules.
- **S:** Identify what an AI policy should cover.
- **A:** Belief that stated policy must guide real decisions.

### Task 5.7 - Explain AI literacy and training as a governance obligation and culture practice.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-literacy`, `role-based-ai-training`, `training-and-culture` |

- **K:** AI literacy; training-and-culture; role-based training.
- **S:** Design role-appropriate AI training for a team.
- **A:** Investment in people, not just controls.

### Task 5.8 - Explain how ethics, policy, and the governance function combine to sustain trustworthy AI over time.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `continuous-improvement-governance`, `governance-maturity`, `sustaining-trustworthy-ai` |

- **K:** How ethics, policy, function, and review sustain trust; continuous improvement; governance maturity.
- **S:** Explain how the pieces combine to keep AI trustworthy over time.
- **A:** Long-term stewardship of trust.

---

*Generated 2026-07-23 by scripts/gen-jta-doc.mjs from certification AIGRM-I (55555555-5555-5555-5555-555555555555).*
