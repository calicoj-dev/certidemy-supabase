# AISM-I - Job-Task Analysis

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

**Certification:** Certidemy AI Service Management I - AI  
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
| D1 | Foundations of Digital Product & Service Management | 12.5% | 10 |
| D2 | The Value System, Guiding Principles & Governance | 15% | 12 |
| D3 | The Service Lifecycle & Management Practices | 17.5% | 14 |
| D4 | AI-Augmented Service Operations | 27.5% | 22 |
| D5 | Governing AI in Service Management | 15% | 12 |
| D6 | Experience, Trust & Sustainable Service | 12.5% | 10 |
| **Total** | | **100%** | **80** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 2 (Understand) | 36 | 58.4% |
| 3 (Apply) | 20 | 32.81% |
| 4 (Analyze) | 5 | 8.79% |

---

# Domain D1 - Foundations of Digital Product & Service Management (12.5%)

**Description.** The shared vocabulary and mental model the credential builds on: service, value co-creation, the parties in a service relationship, utility, warranty and experience, outcomes, and SLAs. Predominantly comprehension, making the applied domains legible. AI is woven in where a foundation genuinely changes; the sponsor, customer, and user roles stay clean.

**Tasks:** 8  |  **MCQ seats:** 10

## Tasks

### Task 1.1 - Explain why service management exists and the problem it solves, and how the field's shift from IT to digital to AI-augmented services extends that same purpose.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-augmented-service-shift`, `it-to-digital-shift`, `service-management-purpose`, `service-management-value` |

- **K:** Service management coordinates people, process, and technology to deliver value reliably; the shift from IT to digital to AI-augmented services extends that same purpose.
- **S:** Explain the problem service management solves and place the AI-augmented shift on that continuum.
- **A:** Sees disciplined design, not heroics, as the source of reliable value.

### Task 1.2 - Define the core terms - service, product, digital product, digital service - and recognize an AI-infused service as one whose behavior is partly produced by a model.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-infused-service`, `digital-product`, `digital-service`, `product-definition`, `product-vs-service`, `service-definition` |

- **K:** The definitions of service, product, digital product, and digital service, and what makes a service AI-infused (behavior partly produced by a model).
- **S:** Classify a described offering among these terms and flag when it is AI-infused.
- **A:** Precision with everyday words used as technical terms.

### Task 1.3 - Explain value co-creation - how value is jointly produced by provider and consumer, not delivered - and how it changes when the provider's contribution is a probabilistic AI model (co-creation under uncertainty).

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `co-creation-with-ai-service`, `consumer-contribution`, `provider-contribution`, `value-co-creation`, `value-not-delivered` |

- **K:** Value is co-created by provider and consumer, not delivered; a probabilistic model shifts this into co-creation under uncertainty.
- **S:** Identify each side's contribution and how AI changes expectation-setting and assurance.
- **A:** Resists treating value as something handed over.

### Task 1.4 - Distinguish the parties and roles in a service relationship - provider, consumer, and the sponsor / customer / user roles.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `provider-consumer`, `service-relationship`, `service-relationship-types`, `sponsor-customer-user` |

- **K:** The provider and consumer parties and the sponsor, customer, and user roles inside the consumer.
- **S:** Assign the right role to an actor in a scenario.
- **A:** Serves all roles, not only the loudest.

### Task 1.5 - Explain utility, warranty, and experience as the dimensions of a service's fitness - and how warranty changes for non-deterministic AI output, assuring a range of quality rather than an identical output.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `fit-for-purpose-fit-for-use`, `non-deterministic-output`, `user-experience`, `utility`, `warranty` |

- **K:** Utility (fit for purpose), warranty (fit for use), and experience, and how warranty shifts to assuring bounds for non-deterministic AI output.
- **S:** Match a described shortfall to utility, warranty, or experience, and adapt warranty for an AI service.
- **A:** Holds that value needs both the right thing and dependable delivery.

### Task 1.6 - Explain outputs vs outcomes, and cost and risk as what a service removes and imposes - including why AI's ability to mass-produce outputs sharpens the risk of mistaking outputs for outcomes.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-output-volume-trap`, `cost-and-risk`, `output-vs-outcome`, `value-equation` |

- **K:** Outputs vs outcomes, the value equation of costs and risks removed vs imposed, and how AI mass-production sharpens the outputs-for-outcomes trap.
- **S:** Separate output counts from outcomes and spot the AI volume trap.
- **A:** Measures achievement by outcomes, not activity.

### Task 1.7 - Explain service quality, service levels, and SLAs as the agreement of expectation - and how a service level is written for an AI service, committing to quality bounds and escalation rather than identical output.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-service-level`, `service-level`, `service-quality`, `sla`, `sla-measurement-pitfall` |

- **K:** Service quality, service levels, and SLAs as the agreement of expectation, the measurement pitfall, and how an AI service level commits to bounds, safety, and escalation.
- **S:** Write or judge a service level, including one for a non-deterministic AI service.
- **A:** Distrusts green metrics that hide an unhappy consumer.

### Task 1.8 - Explain the provider's continuing accountability for an AI service's behavior - that an AI output is a service action the provider owns, and that AI services drift and must be monitored, not assumed stable.

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-as-service-action`, `provider-owns-ai-behavior`, `service-that-drifts` |

- **K:** An AI output is a service action the provider owns; AI services drift and must be monitored, not assumed stable.
- **S:** Reject the-model-did-it and identify the monitoring an AI service needs.
- **A:** Owns the behavior of the service continuously.

---

# Domain D2 - The Value System, Guiding Principles & Governance (15%)

**Description.** The organizing system that turns opportunity and demand into value: the value-system components, the seven guiding principles (understood and applied), the continual-improvement model, and governance as direction and control. The most stable domain; AI enters only where it genuinely bears.

**Tasks:** 9  |  **MCQ seats:** 12

## Tasks

### Task 2.1 - Explain the components of a service value system and how they fit together.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `service-value-system`, `svs-components`, `svs-inputs-outputs` |

- **K:** The service value system and its components (principles, governance, value chain, practices, continual improvement), and how opportunity and demand become value.
- **S:** Identify how the components combine to create value.
- **A:** Sees the whole system, not isolated parts.

### Task 2.2 - Explain the purpose of the guiding principles as universal, framework-agnostic recommendations.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `guiding-principles`, `principles-interact`, `universal-guidance` |

- **K:** The guiding principles as universal, framework-agnostic recommendations that interact.
- **S:** Explain why principles outlast tools and are used together.
- **A:** Reaches for durable principles over situational rules.

### Task 2.3 - Explain each of the seven guiding principles and what it recommends.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `collaborate-and-promote-visibility`, `focus-on-value`, `keep-it-simple-and-practical`, `optimize-and-automate`, `progress-iteratively-with-feedback`, `start-where-you-are`, `think-and-work-holistically` |

- **K:** What each of the seven guiding principles recommends.
- **S:** State and illustrate each principle in a service context.
- **A:** Carries the principles into everyday decisions.

### Task 2.4 - Given a described situation - including a decision about whether and where to adopt AI - apply the appropriate guiding principle to choose a sound course of action.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-adoption-judgment`, `principle-application`, `principle-selection`, `principle-tradeoffs` |

- **K:** Principle selection, application, and trade-offs, and using the principles to judge whether and where to adopt AI.
- **S:** Read a situation for the principle it calls for and reason to a sound action, including AI-adoption decisions.
- **A:** Lets value, not novelty, decide AI adoption.

### Task 2.5 - Apply "optimize and automate" to decide which service activities suit AI-driven automation and which must retain meaningful human judgment - recognizing that AI widens both what can be automated and what can fail silently.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-automation-judgment`, `ai-changes-automation-calculus`, `automation-candidacy`, `do-not-automate-a-broken-process`, `optimize-before-automate` |

- **K:** Optimize before automate, automation candidacy, do-not-automate-a-broken-process, and how AI widens both what can be automated and what can fail silently.
- **S:** Decide which activities suit AI automation and which must keep human judgment.
- **A:** Matches the human check to the cost of a silent failure.

### Task 2.6 - Explain governance as the direction and control that enables service management.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `direct-monitor-evaluate`, `governance-definition`, `governance-enabling` |

- **K:** Governance as the means by which an organization is directed and controlled through direct, monitor, and evaluate; it enables delivery.
- **S:** Explain how governance sets enabling guardrails.
- **A:** Sees governance as enabling, not merely restricting.

### Task 2.7 - Distinguish governance from management and from day-to-day operations.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `delegated-authority`, `governance-vs-management`, `governing-body` |

- **K:** Governance sets direction and holds accountable; management executes under delegated authority; the governing body stays accountable.
- **S:** Sort activities into governance or management.
- **A:** Keeps direction-setting distinct from execution.

### Task 2.8 - Explain the continual improvement model and its steps - and why AI services in particular require continual improvement, because they drift and cannot be improved once and left.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ci-everyone-responsible`, `ci-for-ai-services`, `ci-steps`, `ci-vision-to-action`, `continual-improvement-model` |

- **K:** The continual improvement model and its steps, that improvement is everyone's responsibility, and why AI services make continual improvement structural.
- **S:** Walk the model's steps and explain why an AI service is never improved once and left.
- **A:** Treats improvement as an ongoing habit, not a project.

### Task 2.9 - Given a described improvement effort, determine which continual-improvement step it skipped.

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ci-application`, `ci-baseline-measurement`, `ci-common-failures` |

- **K:** How to apply the improvement model as a diagnostic and its common failures (no baseline, no follow-through).
- **S:** Read a stalled effort's symptoms and name the skipped step.
- **A:** Diagnoses rather than blames when improvement fails.

---

# Domain D3 - The Service Lifecycle & Management Practices (17.5%)

**Description.** The operating layer: the product-and-service lifecycle activities, value streams, and the core management practices - incident, problem, change, request, service level, and monitoring - plus one diagnostic task to root cause. AI enters at the practices it genuinely changes; supplier and AI-model-dependency management included.

**Tasks:** 12  |  **MCQ seats:** 14

## Tasks

### Task 3.1 - Explain the product-and-service lifecycle activities and that they are iterative, not sequential.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `iterative-not-sequential`, `lifecycle-activities`, `product-service-lifecycle` |

- **K:** The lifecycle activities (discover/design, acquire/build, transition/operate, deliver/support) and that they are iterative, not sequential.
- **S:** Describe the lifecycle and why it recurs rather than runs once.
- **A:** Views a service as continuously improved, not shipped once.

### Task 3.2 - Given a described situation, determine which lifecycle activity it belongs to.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `acquire-and-build`, `deliver-and-support`, `discover-and-design`, `lifecycle-activity-selection`, `transition-and-operate` |

- **K:** What each lifecycle activity covers.
- **S:** Place a described situation into the lifecycle activity it belongs to.
- **A:** Maps real work to the right stage.

### Task 3.3 - Explain what a management practice is and distinguish general vs service management practices.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `general-vs-service-practices`, `management-practice`, `practice-types` |

- **K:** What a management practice is and the distinction between general and service management practices.
- **S:** Classify a practice by type.
- **A:** Uses shared vocabulary precisely.

### Task 3.4 - Explain value streams - core and enabling - and their role in delivering a service.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `core-vs-enabling-value-stream`, `value-stream`, `value-stream-purpose` |

- **K:** Value streams (core and enabling) and their role in delivering a service.
- **S:** Explain how a value stream models the flow of work.
- **A:** Thinks in end-to-end flow.

### Task 3.5 - Explain incident and problem management and select which applies - recognizing that a drop in AI output quality is itself an incident even when nothing is "down".

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-service-incident`, `incident-management`, `incident-vs-problem`, `known-error`, `problem-management`, `workaround` |

- **K:** Incident vs problem management, known error and workaround, and that a drop in AI output quality is an incident even when nothing is down.
- **S:** Select whether incident or problem management applies, including for AI output degradation.
- **A:** Treats up and working as different things.

### Task 3.6 - Analyze a described recurring incident to identify its underlying problem (its root cause).

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `contributing-vs-root-cause`, `recurring-incident-signals-problem`, `root-cause-analysis` |

- **K:** Root-cause analysis, contributing vs root cause, and that recurring incidents signal an unresolved problem.
- **S:** Analyze a recurring incident to its underlying problem.
- **A:** Presses past symptoms to the real cause.

### Task 3.7 - Explain change enablement and select the appropriate change type - including treating an AI model update or retraining as a change whose effects are hard to predict and must be governed accordingly.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-model-change`, `change-authority`, `change-enablement`, `change-types`, `standard-normal-emergency-change` |

- **K:** Change enablement, change types (standard, normal, emergency), change authority, and that an AI model update or retraining is a change with hard-to-predict effects.
- **S:** Select the appropriate change type, including for an AI model update.
- **A:** Governs model changes as carefully as any change.

### Task 3.8 - Explain service request management and the service desk as the point of engagement.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `request-vs-incident`, `service-desk`, `service-request-management` |

- **K:** Service request management, the service desk as point of engagement, and request vs incident.
- **S:** Distinguish a request from an incident.
- **A:** Keeps the user's point of contact in view.

### Task 3.9 - Explain service level management and monitoring & event management - including monitoring an AI service for drift and output-quality degradation, not just availability.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `event-alert-threshold`, `monitoring-ai-services`, `monitoring-and-event-management`, `service-level-management` |

- **K:** Service level management, monitoring and event management, event and alert thresholds, and monitoring an AI service for drift, not just availability.
- **S:** Explain what to monitor for an AI service beyond up and down.
- **A:** Watches behavior, not only uptime.

### Task 3.10 - Given a described flow, determine an improvement using value-stream thinking (find the waste).

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `flow-efficiency`, `value-stream-mapping`, `waste-identification` |

- **K:** Value-stream mapping, waste identification, and flow efficiency.
- **S:** Determine an improvement to a described flow using value-stream thinking.
- **A:** Sees waste where others see busyness.

### Task 3.11 - Determine where AI shifts human effort inside a management practice (such as triage, detection, or assessment) while the purpose of the practice and human accountability for its outcome remain unchanged.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-augmented-practice-boundary`, `ai-in-practices`, `human-accountability-retained`, `practice-transformed-not-replaced`, `work-relocation` |

- **K:** AI relocates human effort inside a practice (triage, detection, assessment) while purpose and human accountability remain; the practice is transformed, not replaced.
- **S:** Locate where AI moves effort inside a practice without moving accountability.
- **A:** Keeps accountability with the human as work relocates.

### Task 3.12 - Explain supplier and service-provider management, and the distinctive dependency risk of an AI service built on a model you do not own - lock-in, and a provider changing the model underneath you.

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-model-supplier-risk`, `ai-vendor-lock-in`, `model-changed-underneath`, `service-provider-dependency`, `supplier-management` |

- **K:** Supplier and service-provider management, and the dependency risk of an AI service built on a model you do not own (lock-in; a provider changing the model underneath you).
- **S:** Identify the dependency risks of running a service on an external model.
- **A:** Manages, rather than assumes, dependencies it does not control.

---

# Domain D4 - AI-Augmented Service Operations (27.5%)

**Description.** The signature applied domain: how service operations change when AI is core. AIOps and event correlation, predictive and proactive operations, virtual agents at the service desk, intelligent and agentic automation, and human oversight of AI-driven service actions as a primary control. The richest, most applied domain.

**Tasks:** 15  |  **MCQ seats:** 22

## Tasks

### Task 4.1 - Explain what AIOps is and how it changes service operations.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aiops`, `aiops-capabilities`, `aiops-vs-traditional-ops` |

- **K:** AIOps and how it changes service operations versus static thresholds and manual correlation.
- **S:** Explain AIOps capabilities and where they apply.
- **A:** Open to pattern-learning over fixed rules.

### Task 4.2 - Given a described operation, determine where AIOps adds value across monitoring, event correlation, and noise reduction.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aiops-use-cases`, `alert-noise-reduction`, `event-correlation` |

- **K:** Event correlation, alert-noise reduction, and AIOps use cases.
- **S:** Determine where AIOps adds value in a described operation.
- **A:** Targets AIOps where it earns its place.

### Task 4.3 - Analyze an alert flood to identify the underlying signal AIOps should surface.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `alert-storm`, `root-signal-identification`, `signal-vs-noise` |

- **K:** Signal vs noise, alert storms, and root-signal identification.
- **S:** Analyze an alert flood to the underlying signal AIOps should surface.
- **A:** Finds the one cause behind many alerts.

### Task 4.4 - Explain predictive and proactive service management.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `failure-prediction`, `leading-indicators`, `predictive-service-management`, `proactive-vs-reactive` |

- **K:** Predictive service management, proactive vs reactive, failure prediction, and leading indicators.
- **S:** Explain how prediction shifts operations from reactive to proactive.
- **A:** Prefers preventing failures to responding to them.

### Task 4.5 - Given a described operation, determine whether a predictive approach fits.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `data-availability-for-prediction`, `prediction-value-threshold`, `predictive-approach-fit` |

- **K:** Predictive-approach fit, data availability for prediction, and the prediction-value threshold.
- **S:** Judge whether a described operation suits a predictive approach.
- **A:** Applies prediction only where data and value justify it.

### Task 4.6 - Analyze a recurring-incident pattern to determine whether a predictive control would prevent it.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `pattern-to-control`, `predictive-control-fit`, `recurring-incident-analysis` |

- **K:** Recurring-incident analysis, predictive-control fit, and translating a pattern into a control.
- **S:** Determine whether a predictive control would prevent a recurring pattern.
- **A:** Reasons from pattern to preventive control.

### Task 4.7 - Explain virtual agents and conversational AI at the service desk, and their limits.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `conversational-ai-service-desk`, `deflection-rate`, `virtual-agent`, `virtual-agent-limits` |

- **K:** Virtual agents and conversational AI at the service desk, deflection rate, and their limits.
- **S:** Explain what a virtual agent handles and where it must stop.
- **A:** Honest about where automation should hand off.

### Task 4.8 - Given a described user request handled by a virtual agent, determine whether the agent should resolve it or escalate to a human, based on the request's risk and the agent's confidence.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `confidence-threshold`, `escalation-and-handoff`, `escalation-boundary` |

- **K:** The escalation boundary, confidence threshold, and escalation and handoff design.
- **S:** Decide whether a virtual agent should resolve or escalate based on risk and confidence.
- **A:** Escalates when stakes or uncertainty demand a human.

### Task 4.9 - Explain intelligent automation and how it differs from traditional scripted automation.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `automation-in-workflows`, `intelligent-automation`, `scripted-vs-intelligent-automation` |

- **K:** Intelligent automation and how it differs from scripted automation, and automation within workflows.
- **S:** Distinguish intelligent from scripted automation in a scenario.
- **A:** Matches the automation type to the variability of the work.

### Task 4.10 - Explain agentic workflows in service operations - how an AI agent plans and takes multi-step action with reduced per-step human intervention.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `action-reversibility`, `agentic-service-workflow`, `autonomy-levels`, `reduced-per-step-intervention` |

- **K:** Agentic service workflows, autonomy levels, action reversibility, and reduced per-step human intervention.
- **S:** Explain how an agent plans and takes multi-step action with less per-step approval.
- **A:** Understands what changes when a human no longer approves each step.

### Task 4.11 - Given a described AI-driven service action an agent can perform, determine the highest safe level of autonomy the agent should be granted.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `autonomy-decision-factors`, `bounded-autonomy`, `reversibility-and-stakes` |

- **K:** Bounded autonomy and the factors that set it: reversibility, stakes, confidence, and oversight cost.
- **S:** Determine the highest safe autonomy level for a described AI action.
- **A:** Grants autonomy only within safe limits.

### Task 4.12 - Analyze how errors compound across an agentic workflow's multi-step chain.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `blast-radius`, `circuit-breaker-pattern`, `compounding-actions`, `multi-step-failure` |

- **K:** How errors compound across an agentic chain: multi-step failure, blast radius, and the circuit-breaker pattern.
- **S:** Analyze where and how a multi-step agentic workflow amplifies an error.
- **A:** Anticipates cascade, not just single-step failure.

### Task 4.13 - Distinguish human-in-the-loop from human-on-the-loop oversight when applied to AI-driven service actions.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `human-in-the-loop`, `human-on-the-loop`, `oversight-in-service-actions` |

- **K:** Human-in-the-loop vs human-on-the-loop oversight applied to AI-driven service actions.
- **S:** Distinguish the two oversight modes for a service action.
- **A:** Chooses real oversight suited to the action.

### Task 4.14 - Given a described AI-driven service action, determine an appropriate oversight design for its risk.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `consequential-service-action`, `oversight-design`, `risk-based-oversight` |

- **K:** Risk-based oversight, oversight design, and what makes a service action consequential.
- **S:** Determine an oversight design proportionate to an action's risk.
- **A:** Matches oversight strength to consequence.

### Task 4.15 - Diagnose why an AI-augmented operation degraded - model drift, data quality, or automation gone wrong.

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `automation-failure-mode`, `data-quality-in-ops`, `model-drift`, `operation-degradation-diagnosis` |

- **K:** Diagnosing a degraded AI operation: model drift, data quality in operations, and automation failure modes.
- **S:** Diagnose why an AI-augmented operation degraded.
- **A:** Reasons from symptoms to the true cause of degradation.

---

# Domain D5 - Governing AI in Service Management (15%)

**Description.** The focused governance bridge to AIGRM-I: accountability when an agent acts on a live service, data quality and provenance for AIOps pipelines, transparency to users, over-automation risk, and how AI service governance plugs into the organization's broader AI governance. Deliberately bounded to complement, not duplicate, AIGRM-I.

**Tasks:** 9  |  **MCQ seats:** 12

## Tasks

### Task 5.1 - Explain why AI in service management needs governance beyond traditional service controls.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-governance-in-service`, `governance-gap`, `why-govern-ai-services` |

- **K:** Why AI service actions need governance beyond traditional service controls (autonomy, scale, opacity) and the governance gap.
- **S:** Explain what ordinary service controls leave uncovered once AI acts.
- **A:** Sees the gap AI opens in traditional controls.

### Task 5.2 - Explain accountability when an AI agent takes a service action - who remains answerable.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `accountability-cannot-be-delegated`, `agentic-accountability`, `meaningful-human-control` |

- **K:** Agentic accountability, that accountability cannot be delegated to the tool, and meaningful human control.
- **S:** Locate who remains answerable when an AI agent takes a service action.
- **A:** Refuses to let the tool absorb responsibility.

### Task 5.3 - Given an AIOps or predictive pipeline, determine appropriate data-quality and provenance controls.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `data-provenance`, `data-quality-for-aiops`, `garbage-in-garbage-out` |

- **K:** Data quality for AIOps, data provenance, and garbage-in-garbage-out.
- **S:** Determine appropriate data-quality and provenance controls for an AIOps or predictive pipeline.
- **A:** Treats data quality as the foundation of AI operations.

### Task 5.4 - Explain transparency and disclosure when users interact with AI in a service context.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-interaction-disclosure`, `transparency-to-users`, `virtual-agent-disclosure` |

- **K:** AI-interaction disclosure, transparency to users, and virtual-agent disclosure.
- **S:** Identify the disclosure a service owes users interacting with AI.
- **A:** Honest with users about AI's role.

### Task 5.5 - Given a described service, determine the over-automation risks and where a human check must remain.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `automation-bias`, `deskilling-risk`, `human-check-necessity`, `over-automation-risk` |

- **K:** Over-automation risk, automation bias, human-check necessity, and deskilling risk.
- **S:** Determine where over-automation risk requires a human check to remain.
- **A:** Keeps a human where judgment must not be automated away.

### Task 5.6 - Explain how AI service governance connects to the organization's broader AI governance and risk management.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-governance-alignment`, `defense-in-depth-governance`, `enterprise-ai-governance-link` |

- **K:** How AI service governance aligns with and links to enterprise AI governance, and defense in depth.
- **S:** Connect service-level AI governance to the organization's broader AI risk management.
- **A:** Governs in layers, not in isolation.

### Task 5.7 - Given a described AI-driven service, determine what to monitor to detect drift, degradation, and harm.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-service-monitoring`, `drift-and-degradation-signals`, `harm-detection-signals`, `what-to-monitor` |

- **K:** AI service monitoring: what to monitor, drift and degradation signals, and harm-detection signals.
- **S:** Determine what to monitor to detect drift, degradation, and harm in an AI service.
- **A:** Chooses signals that reveal real harm, not just uptime.

### Task 5.8 - Explain how incident-response and continual-improvement processes must adapt when the incident or improvement involves an AI-driven service action.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-incident-response`, `feedback-to-improvement`, `improve-ai-services` |

- **K:** How incident response and continual improvement must adapt when an AI-driven service action is involved.
- **S:** Explain how to feed AI incidents back into improvement.
- **A:** Closes the loop from monitoring to improvement.

### Task 5.9 - Given an AI service action that caused harm, determine an appropriate escalation and incident path.

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-service-incident`, `harm-escalation`, `rollback-and-remediation`, `serious-incident-reporting` |

- **K:** The AI service incident (including harm), harm escalation, serious-incident reporting, and rollback and remediation.
- **S:** Determine an appropriate escalation and incident path for an AI action that caused harm.
- **A:** Routes harm quickly to the right responders.

---

# Domain D6 - Experience, Trust & Sustainable Service (12.5%)

**Description.** The human and responsible dimensions of service value: experience management and measuring it beyond technical service levels, trust and adoption as prerequisites for AI-service value, and sustainable service value including the compute and energy footprint of AI services.

**Tasks:** 8  |  **MCQ seats:** 10

## Tasks

### Task 6.1 - Explain service experience - what it is and why it matters beyond whether a service technically works.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `experience-vs-performance`, `perception-and-value`, `service-experience` |

- **K:** Service experience and why it matters beyond whether a service technically works (perception and value).
- **S:** Explain why experience is part of value, not a cosmetic extra.
- **A:** Values how a service feels, not only whether it runs.

### Task 6.2 - Explain experience-focused measurement - measuring the outcome and satisfaction a user actually gets, not only technical service levels.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `beyond-technical-sla`, `experience-measurement`, `outcome-based-metric` |

- **K:** Experience measurement, outcome-based metrics, and measuring beyond technical SLAs.
- **S:** Explain how to measure the user's actual outcome and satisfaction.
- **A:** Measures from the user's side, not only the dashboard.

### Task 6.3 - Given a described service situation, determine an action that would improve the user's experience.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `experience-design-choice`, `experience-improvement`, `friction-identification` |

- **K:** Experience improvement, friction identification, and experience-design choices.
- **S:** Determine an action that would improve the user's experience.
- **A:** Removes friction the user actually feels.

### Task 6.4 - Explain trust and adoption as prerequisites for AI-service value - why users must *appropriately* trust and actually adopt an AI service for value to be co-created.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `adoption-prerequisite`, `appropriate-trust`, `trust-in-ai-service`, `trust-transparency` |

- **K:** Trust and adoption as prerequisites for AI-service value: appropriate (calibrated) trust and why adoption must be earned.
- **S:** Explain why users must appropriately trust and adopt an AI service for value to be co-created.
- **A:** Seeks calibrated trust, neither blind nor absent.

### Task 6.5 - Given an AI service with low or miscalibrated trust, determine what would build appropriate trust and adoption.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `building-appropriate-trust`, `escalation-as-trust`, `over-trust-correction`, `transparency-action` |

- **K:** Building appropriate trust through transparency, reliable escalation, and correcting over-trust.
- **S:** Determine what would build appropriate trust and adoption for a low- or miscalibrated-trust AI service.
- **A:** Designs for trust that is earned and calibrated.

### Task 6.6 - Explain sustainable service value - the environmental, social, and economic dimensions woven into the value system.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `sustainability-in-value-system`, `sustainable-service`, `triple-dimension-value` |

- **K:** Sustainable service value across environmental, social, and economic dimensions, woven into the value system.
- **S:** Explain how sustainability is part of how value is created.
- **A:** Weighs value across more than the economic dimension.

### Task 6.7 - Explain the compute and energy footprint of AI services and why it is a service-management concern.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-compute-footprint`, `efficiency-as-service-quality`, `green-ai` |

- **K:** The compute and energy footprint of AI services and why efficiency is a service-management concern (green AI).
- **S:** Explain why an AI service's compute footprint is a service-management matter.
- **A:** Treats efficiency as part of service quality.

### Task 6.8 - Given an AI service, determine a sustainability-improving action that does not degrade service value.

| Attribute | Value |
|-|-|
| Domain | D6 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `efficient-inference`, `right-sizing-model`, `sustainability-tradeoff`, `sustainability-without-degradation` |

- **K:** Sustainability trade-offs, right-sizing models, efficient inference, and preserving the user's outcome.
- **S:** Determine a sustainability-improving action that does not degrade service value.
- **A:** Cuts footprint without cutting the user's outcome.

---

*Generated 2026-07-23 by scripts/gen-jta-doc.mjs from certification AISM-I (66666666-6666-6666-6666-666666666666).*
