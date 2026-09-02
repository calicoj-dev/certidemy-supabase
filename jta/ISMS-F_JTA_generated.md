# ISMS-F - Job-Task Analysis

> **GENERATED FROM THE DATABASE on 2026-09-02. Do not hand-edit.**
>
> Every fact below is rendered from the live schema by
> `scripts/gen-jta-doc.mjs`. To change anything here, change the database
> through a migration and regenerate - the git diff on this file is then the
> change record.
>
> Design rationale, sourcing, review history and reconciliation records are
> NOT here. They carry human judgment that no query can reconstruct, and live
> in the companion narrative document.

**Certification:** ISO/IEC 27001:2022 Foundation - AI  
**Status:** available

---

## Exam facts

| Attribute | Value |
|-|-|
| Questions | 40 |
| Duration | 60 minutes |
| Passing score | 80% (32/40) |
| Format | Multiple choice (single answer), online |
| Bloom ceiling | 4 (Analyze) for MCQ; 5-6 reserved for simulation |
| Languages | English, es-419, pt-BR |

## Domain structure

| # | Domain | Weight | MCQ seats |
|-|-|-|-|
| D1 | Information security fundamentals and the AI-era threat landscape | 15% | 6 |
| D2 | The ISMS: context, leadership, scope and policy with AI in the estate | 17.5% | 7 |
| D3 | Risk assessment and treatment | 22.5% | 9 |
| D4 | Annex A controls and the AI weave | 27.5% | 11 |
| D5 | Performance evaluation, improvement and certification | 17.5% | 7 |
| **Total** | | **100%** | **40** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 1 (Remember) | 5 | 10.39% |
| 2 (Understand) | 28 | 56.77% |
| 3 (Apply) | 11 | 22.68% |
| 4 (Analyze) | 5 | 10.17% |

---

# Domain D1 - Information security fundamentals and the AI-era threat landscape (15%)

**Description.** The vocabulary floor and the threat picture. Asset, threat, vulnerability, risk and control, and the AI-specific threat surface as a catalogued thing rather than a vague anxiety.

**Tasks:** 7  |  **MCQ seats:** 6

## Tasks

### Task 1.1 - Define confidentiality, integrity and availability, and the supporting properties.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `availability`, `cia-triad`, `confidentiality`, `integrity`, `supporting-properties` |

- **K:** the three core properties and the four supporting properties, and their standard definitions.
- **S:** states each property and its definition accurately; identifies which property a stated definition describes.
- **A:** holds the core vocabulary reliably enough to use it without re-deriving it.

### Task 1.2 - Distinguish asset, threat, vulnerability, risk and control and explain how they relate.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `information-asset`, `risk-relationship`, `security-control`, `threat`, `vulnerability` |

- **K:** what each of the five terms means and how they compose into a risk.
- **S:** distinguishes the five terms in a described situation; explains why a vulnerability without a threat is not a risk.
- **A:** reasons about security situations in the standard's vocabulary rather than in colloquial terms.

### Task 1.3 - Explain the difference between an information security event, incident and breach.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `data-breach`, `security-event`, `security-incident` |

- **K:** the definitions of event, incident and breach and the thresholds between them.
- **S:** explains why not every event is an incident and not every incident is a breach.
- **A:** recognizes that escalation language carries consequences and is not interchangeable.

### Task 1.4 - Recognize the core members of the ISO/IEC 27000 family and what each does.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Per exam |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `iso-27000-family`, `iso-27001-requirements`, `iso-27002-controls`, `iso-27005-risk` |

- **K:** which standard in the family carries requirements, which carries control guidance, which carries risk guidance, and the role of the overview document.
- **S:** names the function of each core family member.
- **A:** knows where to look rather than assuming one standard contains everything.

### Task 1.5 - Explain how AI systems change the information security attack surface.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-attack-surface`, `inference-boundary`, `model-as-asset`, `prompt-as-data` |

- **K:** the exposure AI systems introduce beyond conventional application surface - the model as an asset, prompts as data, the inference boundary.
- **S:** explains why an AI system extends attack surface rather than merely adding a feature.
- **A:** treats AI adoption as a change to the security picture rather than a procurement event.

### Task 1.6 - Distinguish model-level risks from agentic risks.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `agentic-risk`, `autonomy-and-blast-radius`, `delegated-authority`, `model-level-risk` |

- **K:** the distinction between a model treated as input-in output-out and a system that plans, holds memory, calls tools and acts.
- **S:** distinguishes a model-level risk from an agentic one in a described deployment; explains why autonomy widens blast radius.
- **A:** does not apply chatbot-era assumptions to an agent.

### Task 1.7 - Classify a described AI-related security concern against the appropriate threat category.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `insecure-output-handling`, `prompt-injection`, `threat-taxonomy-ai`, `tool-misuse`, `training-data-poisoning` |

- **K:** the published AI threat categories and what characterizes each.
- **S:** given a described concern, classifies it against the correct threat category and states why the neighbouring category does not fit.
- **A:** uses shared vocabulary so a concern can be communicated and tracked rather than described ad hoc.

---

# Domain D2 - The ISMS: context, leadership, scope and policy with AI in the estate (17.5%)

**Description.** Clauses 4 and 5 and the management-system model. The signature AI content is scope: browser-accessible AI tooling reaches systems the scope statement never anticipated.

**Tasks:** 9  |  **MCQ seats:** 7

## Tasks

### Task 2.1 - Explain what an ISMS is and what a management system does.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `isms-definition`, `management-system-model`, `systematic-vs-ad-hoc` |

- **K:** what an ISMS is, and the common management-system structure of policy, objectives, process and improvement.
- **S:** explains what a management system adds over a set of security measures.
- **A:** thinks of security as a managed system rather than a toolset.

### Task 2.2 - Explain clause 4 - internal and external issues, and interested parties.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `interested-parties`, `internal-external-issues`, `organizational-context`, `party-requirements` |

- **K:** internal and external issues, interested parties, and which of their requirements are security-relevant.
- **S:** explains why context is determined before scope; distinguishes an interested party's requirement from a general preference.
- **A:** grounds security decisions in the organization's actual situation.

### Task 2.3 - Explain the climate-change consideration introduced by Amendment 1:2024.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `amendment-1-2024`, `climate-change-relevance`, `documented-non-applicability` |

- **K:** what Amendment 1:2024 added to clauses 4.1 and 4.2, and the obligation to document a determination of non-relevance.
- **S:** explains what the amendment requires and what it does not require.
- **A:** recognizes that "not applicable" is itself a determination that must be recorded.

### Task 2.4 - Explain how the ISMS scope is determined, bounded and documented.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `interfaces-and-dependencies`, `isms-scope`, `scope-boundaries`, `scope-statement` |

- **K:** how scope is bounded, what an interface and a dependency are, and what a scope statement contains.
- **S:** explains how a boundary is drawn and what must be documented; reads a scope statement and identifies what it includes and excludes.
- **A:** understands scope as a deliberate decision with consequences.

### Task 2.5 - Analyze how a scope boundary is challenged when SaaS AI tools cross system and organizational lines.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `boundary-erosion`, `saas-ai-in-scope`, `scope-failure-modes`, `third-party-processing` |

- **K:** how browser-accessible AI tooling reaches systems and information, and the characteristic ways a scope statement stops describing reality.
- **S:** given a described estate and a scope statement, identifies where the boundary has stopped being true and explains the mechanism by which it failed.
- **A:** recognizes that a documented boundary and an actual boundary can diverge without anyone acting improperly.

### Task 2.6 - Explain clause 5 - leadership, commitment, and the information security policy.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `information-security-policy`, `leadership-commitment`, `policy-communication` |

- **K:** top management's obligations, what an information security policy must establish, and the communication requirement.
- **S:** explains what leadership commitment means in practice and why policy without communication fails.
- **A:** distinguishes a policy that operates from a policy that exists.

### Task 2.7 - Explain roles, responsibilities and authorities within an ISMS.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `assigned-authority`, `isms-roles`, `risk-owner`, `top-management` |

- **K:** ISMS roles, the pairing of responsibility with authority, and the risk owner's position.
- **S:** explains why responsibility without authority does not function; identifies who holds a stated accountability.
- **A:** looks for the named owner rather than assuming the security function owns everything.

### Task 2.8 - Apply policy reasoning to determine what an acceptable AI use provision must address.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `acceptable-use-ai`, `policy-enforceability`, `policy-to-practice`, `sanctioned-vs-unsanctioned-tools` |

- **K:** what an acceptable-use provision governs, the sanctioned/unsanctioned distinction, and what makes a rule enforceable.
- **S:** given an organizational situation, determines which provisions an acceptable AI use policy must contain and rejects a provision that could not be observed or enforced.
- **A:** writes and reads policy with enforceability in mind rather than aspiration.

### Task 2.9 - Explain continual improvement and the plan-do-check-act model as the ISMS operating rhythm.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `continual-improvement`, `management-system-maturity`, `pdca-cycle`, `planned-change` |

- **K:** the plan-do-check-act rhythm and the continual improvement obligation.
- **S:** explains where each ISMS activity sits in the cycle and why improvement is an obligation rather than an ambition.
- **A:** treats the ISMS as ongoing rather than as a project with an end date.

---

# Domain D3 - Risk assessment and treatment (22.5%)

**Description.** Clauses 6 and 8, the engine of the standard. The Statement of Applicability as a justification record, and why a conventional assessment can return a clean result for an exposed estate.

**Tasks:** 11  |  **MCQ seats:** 9

## Tasks

### Task 3.1 - Explain the risk assessment process - identification, analysis and evaluation.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `risk-analysis`, `risk-assessment-process`, `risk-evaluation`, `risk-identification` |

- **K:** the three stages of assessment and what each produces.
- **S:** explains what distinguishes identification from analysis from evaluation, and why the order matters.
- **A:** treats assessment as a defined process rather than an opinion exercise.

### Task 3.2 - Apply stated risk criteria to determine whether an analysed risk falls within acceptance.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `likelihood-and-consequence`, `risk-acceptance-criteria`, `risk-appetite`, `risk-criteria` |

- **K:** risk criteria, acceptance criteria, the likelihood-consequence pairing, and how appetite is expressed.
- **S:** given stated criteria and a risk with stated likelihood and consequence, determines the risk level and classifies it as acceptable, retained, or requiring treatment.
- **A:** applies the organization's stated thresholds rather than a personal sense of severity.

### Task 3.3 - Apply risk identification to a described situation to name the asset, threat and vulnerability.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `asset-threat-vulnerability-mapping`, `risk-register`, `scenario-based-identification` |

- **K:** the asset-threat-vulnerability composition and how a risk is recorded.
- **S:** given a described situation, names the asset at risk, the threat acting on it and the vulnerability being exploited.
- **A:** decomposes a vague concern into a statable risk.

### Task 3.4 - List the four risk treatment options.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `avoid-risk`, `modify-risk`, `retain-risk`, `risk-treatment-options`, `share-risk` |

- **K:** the four treatment options and their standard names.
- **S:** states the four options; identifies which option a described decision represents.
- **A:** holds the option set reliably enough to recognize when one is missing from a discussion.

### Task 3.5 - Explain the purpose and required content of the Statement of Applicability.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `exclusion-justification`, `implementation-status`, `inclusion-justification`, `statement-of-applicability` |

- **K:** what the SoA records - necessity, justification for inclusion and exclusion, and implementation status.
- **S:** explains what each required element of the SoA is for and why justification is the substance of it.
- **A:** reads an SoA as a reasoning record rather than a compliance artifact.

### Task 3.6 - Explain why Annex A is a set of reference controls, not a checklist to be copied into the SoA.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `annex-a-as-reference`, `control-selection-is-risk-driven`, `soa-is-justification` |

- **K:** Annex A's status as a reference set, and the risk-driven basis of control selection.
- **S:** explains why controls are selected because treatment requires them, and why an SoA that mirrors Annex A with a yes/no column has inverted the logic.
- **A:** resists checklist thinking about a risk-based standard.

### Task 3.7 - Explain the risk treatment plan and the role of residual risk and risk-owner approval.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `residual-risk`, `risk-owner-approval`, `risk-treatment-plan`, `treatment-vs-plan` |

- **K:** what a treatment plan contains, what residual risk is, and whose approval is required.
- **S:** explains the difference between deciding treatment and planning it, and why the risk owner rather than the security function approves residual risk.
- **A:** locates accountability for accepted risk correctly.

### Task 3.8 - Apply risk identification to a described AI deployment to surface the information risks it introduces.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-risk-identification`, `context-leakage`, `output-trust`, `training-data-confidentiality` |

- **K:** the information risks characteristic of AI deployments - context leakage, training-data confidentiality, output trust.
- **S:** given a described AI deployment, identifies the information risks it introduces and states the asset each threatens.
- **A:** applies risk identification to a system type the asset register was not built for.

### Task 3.9 - Explain how prompt and context data leaving the organization constitutes an information security risk.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `classification-survival`, `inference-boundary`, `prompt-data-egress`, `retention-by-provider` |

- **K:** prompt data egress, provider retention, the inference boundary, and whether classification survives handling.
- **S:** explains why entering information into an external model is a disclosure, and what determines its severity.
- **A:** treats a prompt as information leaving the organization rather than as a query.

### Task 3.10 - Apply treatment reasoning to select a defensible option for a described AI-related risk.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `compensating-control`, `proportionality`, `treatment-and-appetite`, `treatment-selection` |

- **K:** the four treatment options, compensating controls, proportionality, and the relationship of treatment to appetite.
- **S:** given an identified AI-related risk and stated appetite, selects a defensible treatment option and states why a neighbouring option is less appropriate.
- **A:** matches treatment effort to risk level rather than to alarm.

### Task 3.11 - Analyze why a conventional risk assessment can return a clean result for an estate with unmanaged AI exposure.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `assessment-blind-spots`, `asset-register-gaps`, `false-assurance`, `invisible-adoption` |

- **K:** how assessment method determines what is visible, and the ways AI adoption escapes the asset register.
- **S:** given an assessment that returned a clean result against an estate with known AI exposure, identifies the mechanism by which the method could not see the exposure.
- **A:** distrusts a clean result whose method was never tested against the thing in question.

---

# Domain D4 - Annex A controls and the AI weave (27.5%)

**Description.** The four themes and the reasoning that selects among them, not a survey of 93 controls. Carries the signature AI content and the explicit null result on physical controls.

**Tasks:** 13  |  **MCQ seats:** 11

## Tasks

### Task 4.1 - Recognize the four Annex A control themes and the number of reference controls.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `annex-a-themes`, `organizational-controls`, `people-controls`, `physical-controls`, `technological-controls` |

- **K:** the four theme names and the count of reference controls.
- **S:** names the four themes; identifies which theme a named control belongs to.
- **A:** navigates Annex A by structure rather than by scanning.

### Task 4.2 - Explain control attributes and how they support selection and reporting.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `control-attributes`, `control-type`, `operational-capability`, `security-property-attribute` |

- **K:** the attribute set and what each attribute expresses.
- **S:** explains what the attributes are for and how they let the same control set be viewed from different angles.
- **A:** understands that Annex A supports more than one reading.

### Task 4.3 - Explain the purpose of the organizational controls theme.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `asset-management`, `information-classification`, `policy-controls`, `roles-segregation` |

- **K:** the purpose of the organizational theme and the control families within it.
- **S:** explains what the theme governs and why policy, roles, assets and classification sit together.
- **A:** locates a governance-shaped control problem in the right theme.

### Task 4.4 - Apply asset-inventory reasoning to determine which AI components are information assets.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `agent-as-asset`, `ai-asset-inventory`, `model-as-asset`, `prompt-log-as-asset`, `vector-store-as-asset` |

- **K:** what makes something an information asset, and which AI components qualify.
- **S:** given a described AI deployment, determines which components belong on the asset inventory and states what each holds or exposes.
- **A:** extends an established practice to a component class it was not written for.

### Task 4.5 - Apply least-privilege and identity-lifecycle reasoning to a described access arrangement.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `access-control`, `identity-lifecycle`, `least-privilege`, `privileged-access` |

- **K:** the identity lifecycle, least privilege, and privileged-access handling.
- **S:** given a described access arrangement, determines whether the rights exceed what the role requires and identifies what would change.
- **A:** reads access as a live risk surface rather than a settled configuration.

### Task 4.6 - Analyze how access control assumptions break when a non-human actor holds credentials and acts.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `agent-credentials`, `attribution-gap`, `non-human-identity`, `standing-vs-just-in-time-authority` |

- **K:** non-human identity, agent credentials, standing versus just-in-time authority, and the attribution problem.
- **S:** given a described agent deployment, identifies which access-control assumption has stopped holding and explains why the conventional control does not address it.
- **A:** recognizes when a control's underlying model, not its implementation, is what failed.

### Task 4.7 - Explain supplier relationship controls and the security requirements placed on suppliers.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `service-delivery-monitoring`, `supplier-agreements`, `supplier-controls`, `supply-chain-security` |

- **K:** supplier controls, agreements, supply-chain reach, and delivery monitoring.
- **S:** explains what security requirements a supplier relationship must carry and why monitoring continues past contract signature.
- **A:** treats suppliers as part of the estate.

### Task 4.8 - Analyze what supplier assurance can and cannot establish about a foundation-model provider.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `assurance-by-attestation`, `concentration-risk`, `foundation-model-supplier`, `inspectability-limits` |

- **K:** the foundation-model provider as a supplier, inspectability limits, attestation-based assurance, and concentration risk.
- **S:** given a supplier assurance process applied to a model provider, identifies which questions the process cannot answer and why direct inspection is unavailable.
- **A:** distinguishes assurance obtained from assurance assumed.

### Task 4.9 - Explain the people controls theme - screening, terms, awareness, disciplinary process.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `awareness-education-training`, `disciplinary-process`, `screening`, `terms-and-conditions` |

- **K:** the people theme and its control families across the employment lifecycle.
- **S:** explains what each people control addresses and at which point in the employment relationship it applies.
- **A:** recognizes that most security outcomes route through people.

### Task 4.10 - Apply awareness and acceptable-use reasoning to a described shadow AI situation.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `awareness-vs-prohibition`, `reporting-culture`, `shadow-ai`, `well-intentioned-noncompliance` |

- **K:** shadow AI, well-intentioned non-compliance, the limits of prohibition, and reporting culture.
- **S:** given a described shadow AI situation, determines what awareness and acceptable-use response would address it, and rejects a response that would drive adoption further underground.
- **A:** responds to non-compliance by diagnosing the need behind it.

### Task 4.11 - Explain the physical controls theme, and why AI does not materially change it.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `clear-desk-clear-screen`, `equipment-security`, `physical-perimeter`, `unchanged-by-ai` |

- **K:** the physical theme and its control families, and the reasoning that establishes AI does not materially change them.
- **S:** explains what the physical theme governs, and states why AI adoption does not alter these controls where a candidate might expect it to.
- **A:** distinguishes a control genuinely affected by a technology shift from one merely adjacent to it.

### Task 4.12 - Explain the technological controls theme - logging, cryptography, secure development, data leakage prevention.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `cryptographic-controls`, `data-leakage-prevention`, `logging-and-monitoring`, `secure-development` |

- **K:** the technological theme - logging and monitoring, cryptography, secure development, data leakage prevention.
- **S:** explains what each control family addresses and how they interact.
- **A:** reads technical controls as a layered set rather than a product list.

### Task 4.13 - Apply information-classification reasoning to content a user is about to enter into an AI tool.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `classification-in-practice`, `classification-survival`, `handling-rules`, `paste-boundary` |

- **K:** classification schemes, handling rules, and whether a label survives being retyped into an external tool.
- **S:** given content and a classification, determines whether entering it into a described AI tool is permitted under the handling rules, and states what makes the difference.
- **A:** applies handling rules at the moment of the decision rather than after it.

---

# Domain D5 - Performance evaluation, improvement and certification (17.5%)

**Description.** Clauses 9 and 10, and what certification actually is. The AI weave is detection: an AI-related incident frequently leaves no conventional log entry.

**Tasks:** 9  |  **MCQ seats:** 7

## Tasks

### Task 5.1 - Explain monitoring, measurement, analysis and evaluation under clause 9.1.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `effectiveness-evaluation`, `monitoring-and-measurement`, `what-to-measure` |

- **K:** what must be monitored and measured, by what methods, and what effectiveness means.
- **S:** explains why measuring activity is not measuring effectiveness, and what makes an indicator useful.
- **A:** asks what a metric would prove before adopting it.

### Task 5.2 - Explain the internal audit programme and its purpose.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `audit-criteria`, `audit-findings`, `auditor-objectivity`, `internal-audit-programme` |

- **K:** the audit programme, audit criteria, the objectivity requirement, and finding types.
- **S:** explains the purpose of internal audit, and why objectivity and impartiality mean an auditor does not audit their own work.
- **A:** understands internal audit as an assurance mechanism rather than an inspection.

### Task 5.3 - Explain management review - its required inputs and its outputs.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `management-review`, `review-cadence`, `review-inputs`, `review-outputs` |

- **K:** required review inputs, required outputs, and the cadence obligation.
- **S:** explains what management review must consider and what it must produce.
- **A:** recognizes review as a decision-making event rather than a status report.

### Task 5.4 - Explain nonconformity and corrective action, including root cause.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `correction-vs-corrective-action`, `effectiveness-check`, `nonconformity`, `root-cause` |

- **K:** nonconformity, the correction/corrective-action distinction, root cause, and effectiveness verification.
- **S:** explains why fixing an instance is not corrective action, and what closes a nonconformity properly.
- **A:** looks past the symptom to the cause.

### Task 5.5 - Recognize the certification process - stage 1, stage 2, surveillance and the three-year cycle.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `recertification-cycle`, `stage-1-audit`, `stage-2-audit`, `surveillance-audit` |

- **K:** the two audit stages, surveillance, and the three-year cycle.
- **S:** states what happens at each stage and the sequence they occur in.
- **A:** holds the certification timeline reliably.

### Task 5.6 - Distinguish certification from accreditation, and the roles of the certification body and accreditation body.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `accreditation-body`, `certification-body`, `iso-17021-vs-17024`, `what-a-certificate-signals` |

- **K:** the certification body's role, the accreditation body's role, the separation between management-system and personnel certification, and what a certificate asserts.
- **S:** distinguishes certification from accreditation; explains what a certificate does and does not claim.
- **A:** reads a credential claim precisely rather than by impression.

### Task 5.7 - Apply incident-response reasoning to a described AI-related security incident.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-incident-classes`, `containment-with-agents`, `incident-response-process`, `lessons-learned` |

- **K:** the incident-response process, AI-specific incident classes, and containment where the component acts autonomously.
- **S:** given a described AI-related incident, determines the appropriate response steps in order and identifies what containment requires here that it would not for a static system.
- **A:** applies an established process to an unfamiliar incident class.

### Task 5.8 - Analyze why an AI-related incident may not surface through conventional monitoring.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `absent-log-signal`, `detection-gaps`, `semantic-vs-syntactic-detection`, `time-to-discovery` |

- **K:** detection gaps, activity that produces no log signal, semantic versus syntactic detection, and time to discovery.
- **S:** given an AI-related incident that went undetected, identifies why the monitoring in place could not have surfaced it.
- **A:** recognizes that absence of alerts is not evidence of absence of incident.

### Task 5.9 - Explain how ISO/IEC 42001 relates to an ISMS and why organizations increasingly operate both.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Per exam |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `iso-42001-aims`, `management-system-integration`, `overlapping-controls`, `separate-certifications` |

- **K:** ISO/IEC 42001 as the AI management system standard, integration across shared processes, overlapping controls, and the separateness of the two certifications.
- **S:** explains how the two standards relate and why holding one does not confer the other.
- **A:** situates the ISMS within a wider management-system landscape.

---

*Generated 2026-09-02 by scripts/gen-jta-doc.mjs from certification ISMS-F (0bb3878a-fb89-455d-a84c-bdb9a26b1643).*
