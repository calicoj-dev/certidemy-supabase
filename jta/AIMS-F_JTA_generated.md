# AIMS-F - Job-Task Analysis

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

**Certification:** ISO/IEC 42001:2023 Foundation  
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
| D1 | AI management systems and the AI landscape | 15% | 6 |
| D2 | Context, leadership and planning | 22.5% | 9 |
| D3 | Support and operation | 20% | 8 |
| D4 | Annex A controls: structure and selection | 25% | 10 |
| D5 | Performance evaluation, improvement and certification | 17.5% | 7 |
| **Total** | | **100%** | **40** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 2 (Understand) | 17 | 46.93% |
| 3 (Apply) | 14 | 41.26% |
| 4 (Analyze) | 4 | 11.8% |

---

# Domain D1 - AI management systems and the AI landscape (15%)

**Description.** What an AI management system is, the roles an organization can hold, the AI system life cycle, the harmonised structure shared with ISO/IEC 27001, and the regulatory drivers.

**Tasks:** 6  |  **MCQ seats:** 6

## Tasks

### Task 1.1 - Explain what an AI management system is and what a management system standard does

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-management-system`, `management-system-certification-basis`, `management-system-standard`, `pdca-cycle` |

- **K:** An AIMS is the interrelated elements of an organization - policies, objectives and processes - through which it governs responsible development, provision and use of AI. The standard specifies requirements for that system, not for the technology, and deliberately avoids prescribing management processes. Certification of an organization is possible because ISO/IEC 42006 sets requirements for the bodies that audit and certify an AIMS; ISO/IEC 42001 itself does not describe certification.
- **S:** Distinguish a management system requirement from a technical control.
- **A:** Systems thinking in preference to tool thinking.

### Task 1.2 - Determine the organization's roles with respect to its AI systems

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-customer-role`, `ai-partner-role`, `ai-producer-role`, `ai-provider-role`, `ai-subject-role`, `role-dependent-applicability`, `role-determination-requirement` |

- **K:** Determining roles is a requirement, not advice. The role categories are AI providers, AI producers, AI customers, AI partners, AI subjects and relevant authorities, with developers, designers, operators, testers and deployers sitting inside the producer category. One organization can hold several roles at once, and its roles determine which requirements and controls apply and to what extent. Role can also be shaped by data-processing obligations.
- **S:** Given a described organization and an AI system, identify which roles apply and what follows for applicability.
- **A:** Resistance to the assumption that one label fits a whole organization.

### Task 1.3 - Describe the AI system life cycle and why it anchors AIMS obligations

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-system-life-cycle`, `continuous-learning-behaviour`, `life-cycle-stages`, `retraining-and-drift` |

- **K:** Obligations attach across the whole life cycle rather than at release. Systems that learn continuously change their behaviour during use and need specific consideration for that reason. Performance can also shift without continuous learning, through concept or data drift in production data, which is what triggers retraining. ISO/IEC 5338 describes life cycle processes, and the organization may define its own stages.
- **S:** Place a described activity at its life-cycle stage.
- **A:** Rejection of the deploy-and-forget model.

### Task 1.4 - Explain the harmonised structure and how ISO/IEC 42001 sits alongside ISO/IEC 27001 and ISO 9001

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `clauses-four-to-ten`, `harmonised-structure`, `integrated-management-system`, `iso-42001-27001-integration` |

- **K:** ISO/IEC 42001 applies the harmonised structure - identical clause numbers, titles, text and core definitions - shared with ISO/IEC 27001, ISO 9001 and others, which is what makes integrated implementation practical. Annex D.2 states that integration with other management system standards is essential for responsible development and use of an AI system, and names ISO/IEC 27001 first. The shared structure is also why the differences are the part that needs teaching.
- **S:** Identify which clause of ISO/IEC 42001 corresponds to a named ISO/IEC 27001 clause.
- **A:** Reuse before rebuild.

### Task 1.5 - Explain the regulatory drivers for an AIMS and why certification is not compliance

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `certification-is-not-compliance`, `eu-ai-act-overview`, `regulatory-driver`, `voluntary-standard` |

- **K:** ISO/IEC 42001 is a voluntary standard and certification to it does not by itself establish compliance with any law. Conformity generates evidence of the organization's responsibility and accountability regarding its role with respect to AI systems, which is a narrower claim than compliance. The EU AI Act imposes obligations by risk tier on an independent timetable that has already been amended once.
- **S:** Distinguish a claim an AIMS supports from one it does not.
- **A:** Precision about what a certificate actually says.

### Task 1.6 - Distinguish an AIMS from model-level assurance and from AI ethics frameworks

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aims-vs-ethics-framework`, `aims-vs-model-assurance`, `nist-ai-rmf-relationship`, `sector-application-annex-d` |

- **K:** The standard specifies no fairness thresholds, evaluation methods, model architectures or testing protocols. It requires a system for deciding those things and for catching them when they fail. The NIST AI Risk Management Framework is referenced as a complementary description of roles across the life cycle rather than a competitor. Annex D addresses sector application and is informative.
- **S:** Given a described activity, determine whether it is an AIMS requirement or a technical practice that the AIMS governs.
- **A:** Discipline about scope boundaries.

---

# Domain D2 - Context, leadership and planning (22.5%)

**Description.** Clauses 4 to 6: context and interested parties, scope, leadership and the AI policy, AI risk assessment, AI system impact assessment, risk treatment and the Statement of Applicability.

**Tasks:** 8  |  **MCQ seats:** 9

## Tasks

### Task 2.1 - Determine the organization's context and interested parties for an AIMS

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `affected-individuals`, `climate-change-relevance`, `interested-parties-ai`, `internal-external-issues`, `organizational-context` |

- **K:** External and internal issues include applicable legal requirements and prohibited uses, regulator guidance, incentives and consequences, cultural and ethical norms, the competitive landscape, contractual obligations and the intended purpose of the systems themselves. Clause 4.1 requires the organization to determine whether climate change is a relevant issue, and clause 4.2 notes that interested parties may have climate-related requirements. Interested parties include those who can perceive themselves affected, which reaches well beyond customers and regulators.
- **S:** Given a described organization, identify context issues and interested parties that an information-security-shaped analysis would miss.
- **A:** Willingness to count people outside the commercial relationship.

### Task 2.2 - Determine the scope of the AI management system

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `aims-scope`, `scope-as-documented-information`, `scope-boundary-decision`, `shadow-ai`, `third-party-ai-in-scope` |

- **K:** Scope is determined from the context issues and interested-party requirements, must be available as documented information, and determines the organization's activities with respect to the standard's requirements, controls and objectives. It must account for AI capability the organization did not build, including vendor features, embedded model interfaces and AI inside purchased software. A scope drawn around systems we developed omits most of the estate, and undeclared use is a scope problem before it is a control problem.
- **S:** Given an estate description, determine what falls inside the AIMS boundary and justify an exclusion.
- **A:** Refusal to let a convenient boundary define the scope.

### Task 2.3 - Explain leadership requirements, the AI policy, AI objectives and planning of changes

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-objectives`, `ai-policy`, `objectives-measurable`, `planning-of-changes`, `policy-vs-objective`, `top-management-commitment` |

- **K:** Top management must demonstrate leadership rather than delegate it, including integrating AIMS requirements into business processes and supporting other roles to demonstrate leadership in their own areas. The AI policy provides the framework for objectives, commits to meeting applicable requirements and to continual improvement, and must be documented, communicated and available to interested parties as appropriate. Objectives must be measurable where practicable, monitored, communicated and updated, and planning must state what will be done, by whom, when and how results are evaluated. Clause 6.3 adds a short requirement that is easy to miss: where the organization determines a need for changes to the AI management system, those changes are carried out in a planned manner. That concerns changes to the management system itself, distinct from clause 8.1 control of operational changes.
- **S:** Distinguish a policy statement from an objective, and a change to the management system from an operational change.
- **A:** Expectation that leadership is evidenced rather than asserted.

### Task 2.4 - Assign roles, responsibilities and authorities for AI

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `conformance-authority`, `performance-reporting-authority`, `roles-responsibilities-authorities` |

- **K:** Top management assigns and communicates responsibilities and authorities for relevant roles, and must specifically assign authority for ensuring the AIMS conforms to the standard and for reporting AIMS performance to top management. Areas that typically need named ownership span risk management, impact assessment, resource management, security, safety, privacy, development, performance, human oversight, supplier relationships and data quality across the whole life cycle.
- **S:** Identify where an assignment leaves an outcome unowned.
- **A:** Insistence that a person, not a system, is accountable.

### Task 2.5 - Apply the AI risk assessment process

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-risk-assessment`, `ai-risk-criteria`, `consistent-repeatable-results`, `risk-analysis-and-evaluation`, `risk-identification-ai` |

- **K:** AI risk criteria are established and maintained first, and must support distinguishing acceptable from non-acceptable risk, performing assessments, conducting treatment and assessing risk impacts. The process is informed by and aligned with the AI policy and objectives, and is designed so that repeated assessments produce consistent, valid and comparable results. It identifies risks that aid or prevent achieving AI objectives, analyses them to assess potential consequences to the organization, individuals and societies, assesses likelihood where applicable, determines levels of risk, then evaluates against the criteria and prioritises for treatment. Annex C lists candidate objectives and risk sources; ISO/IEC 23894 gives risk management guidance.
- **S:** Given a scenario, identify AI-specific risk sources that a generic IT risk assessment would not surface.
- **A:** Preference for systematic method over intuition.

### Task 2.6 - Apply the AI system impact assessment

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-system-impact-assessment`, `foreseeable-misuse`, `impact-assessment-documentation`, `impact-on-individuals`, `impact-on-societies`, `jurisdictional-context` |

- **K:** A formal documented process by which impacts on individuals, groups of individuals and societies are identified, evaluated and addressed. It determines the potential consequences of an AI system's deployment, intended use and foreseeable misuse, and takes into account the specific technical and societal context of deployment and applicable jurisdictions. The result must be documented and, where appropriate, may be made available to relevant interested parties. Areas of impact reach the legal position and life opportunities of individuals, physical and psychological well-being, and universal human rights, with specific protection needs for groups such as children, elderly persons, impaired persons and workers. ISO/IEC 42005 gives guidance.
- **S:** Given an AI system, identify affected parties and potential impacts including unintended ones.
- **A:** Concern for people outside the organization's own interest.

### Task 2.7 - Differentiate the AI risk assessment from the AI system impact assessment and determine what a situation requires

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `anchoring-difference`, `disclosure-difference`, `impact-feeds-risk`, `risk-vs-impact-assessment` |

- **K:** The two are not parallel and are not distinguished by who is harmed - the risk analysis already assesses consequences to the organization, individuals and societies. The impact assessment is an input, and the link is a requirement: clause 6.1.4 states that the organization shall consider the results of the AI system impact assessment in the risk assessment, with a reciprocal note at clause 6.1.2 permitting its use when assessing consequences. What separates them is four things: anchoring (risk to AI objectives; impact to deployment, intended use and foreseeable misuse), output (risk levels prioritised for treatment; documented consequences), context (risk criteria; technical, societal and jurisdictional context of deployment) and audience (internal; may be released to interested parties). Both are separately required and neither substitutes for the other.
- **S:** Given a scenario, determine which assessment is called for, or both, and justify the answer from anchoring and output rather than from who is harmed.
- **A:** Refusal to collapse two obligations into one document.

### Task 2.8 - Apply AI risk treatment and produce the Statement of Applicability

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-risk-treatment`, `inclusion-exclusion-justification`, `residual-risk-approval`, `statement-of-applicability`, `treatment-options`, `treatment-plan` |

- **K:** Treatment selects appropriate options, determines all controls necessary to implement them, compares those controls against Annex A to verify that no necessary control has been omitted, identifies any additional controls needed beyond Annex A, and considers the Annex B guidance. The Statement of Applicability documents all necessary controls with justification for inclusion and exclusion; legitimate exclusion grounds include the control not being deemed necessary by the risk assessment and not being required by applicable external requirements. All identified risks and the controls established to address them are reflected in the Statement of Applicability. Designated management must approve both the risk treatment plan and the acceptance of residual AI risks.
- **S:** Determine a treatment option for a described risk and state what the Statement of Applicability must record.
- **A:** Treating documentation as evidence rather than paperwork.

---

# Domain D3 - Support and operation (20%)

**Description.** Clauses 7 and 8: resources and competence, awareness and communication, documented information, operational planning and control, third-party supply, data management, and the clause 8 operational duties.

**Tasks:** 8  |  **MCQ seats:** 8

## Tasks

### Task 3.1 - Determine resources and competence needs for an AIMS

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `ai-expertise-diversity`, `aims-resources`, `competence-evidence`, `competence-requirements-ai` |

- **K:** The organization determines and provides the resources needed to establish, implement, maintain and continually improve the AIMS. Competence must be determined for persons doing work under its control that affects AI performance, established on the basis of appropriate education, training or experience, and evidenced by appropriate documented information. Where competence is lacking the organization takes action and evaluates the effectiveness of that action. AI competence spans data science, human oversight roles, trustworthiness specialists and domain experts, and rarely sits in one person; different life-cycle stages need different resources.
- **S:** Identify a competence gap from a described team.
- **A:** Honesty about what the organization does not know.

### Task 3.2 - Explain awareness and communication requirements

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Low |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `awareness-requirement`, `communication-planning`, `work-under-organizational-control` |

- **K:** Awareness covers persons doing work under the organization's control, not only employees, and spans the AI policy, their contribution to the effectiveness of the AIMS including the benefits of improved AI performance, and the implications of not conforming with AIMS requirements. Communication must be determined across what will be communicated, when, with whom and how, for both internal and external communications relevant to the AIMS.
- **S:** Distinguish awareness from training.
- **A:** Treating communication as a designed process.

### Task 3.3 - Manage documented information for an AIMS

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `control-of-documented-information`, `creating-and-updating`, `documented-information`, `external-origin-documents` |

- **K:** Documented information covers what the standard requires plus what the organization determines is necessary for effectiveness, and its extent varies with organization size, process complexity and the competence of persons. Creation and update require appropriate identification and description, format and media, and review and approval for suitability and adequacy. Control ensures availability and suitability for use and adequate protection, and addresses distribution and access, storage and preservation including legibility, control of changes, and retention and disposition. Documented information of external origin determined to be necessary must also be identified and controlled.
- **S:** Identify which records a described activity must generate.
- **A:** Evidence discipline.

### Task 3.4 - Explain operational planning and control

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `change-control-ai`, `externally-provided-processes`, `operational-planning-and-control`, `process-criteria` |

- **K:** The organization establishes criteria for its processes and implements control in accordance with those criteria, and implements the controls determined during risk treatment that relate to operation of the AIMS. The effectiveness of those controls must be monitored and corrective actions considered where intended results are not achieved. Documented information must be available to the extent necessary to have confidence that processes were carried out as planned. The organization controls planned changes and reviews the consequences of unintended changes, taking action to mitigate adverse effects, and ensures that externally provided processes, products or services relevant to the AIMS are controlled.
- **S:** Identify what controlled requires for a described outsourced activity.
- **A:** Ownership that does not transfer with the work.

### Task 3.5 - Apply the AIMS to AI systems and components obtained from third parties

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `model-supply-chain`, `supplier-documentation`, `supplier-obligations`, `third-party-ai-supply` |

- **K:** Suppliers can provide datasets, machine learning algorithms or models, software components, or an entire AI system for use on its own or as part of another product. Supplier selection, the requirements placed on suppliers and the level of ongoing monitoring and evaluation should follow the type of supplier and the risk posed. The organization documents how supplied systems and components are integrated. Where a supplied component does not perform as intended or produces impacts misaligned with the organization's responsible approach, the organization requires corrective action, and suppliers must deliver appropriate and adequate documentation.
- **S:** Determine what a supplier must provide for a described AI dependency.
- **A:** Refusal to treat an opaque supplier as out of scope.

### Task 3.6 - Explain data management requirements for AI systems

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `data-acquisition`, `data-for-ai-systems`, `data-preparation`, `data-provenance`, `data-quality` |

- **K:** Data management spans privacy and security implications of the data used, security and safety threats arising from data-dependent development, transparency and explainability including provenance, representativeness of training data against the operational domain of use, and accuracy and integrity. Acquisition records categories and quantity of data needed, sources and their characteristics, data subject demographics and known or potential biases, prior handling, data rights and associated metadata. Provenance records creation, update, transcription, abstraction, validation and transfer of control. Preparation criteria and the methods used must be documented, because failure to prepare data properly can lead to AI system errors.
- **S:** Identify a data property that affects AI outcomes but not information security.
- **A:** Attention to data as a governed input rather than a stored asset.

### Task 3.7 - Analyze which of an existing ISMS's support and operation machinery carries over to an AIMS

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `carry-over-limits`, `competence-does-not-carry`, `iso-42001-27001-integration`, `shared-clause-seven-eight` |

- **K:** Because the harmonised structure makes clauses 7 and 8 identical in numbering and title, documented-information control, communication planning and awareness infrastructure largely carry over. Competence does not, because AI competence is a different body of knowledge with different evidence. Operational control carries over in form but not in content, because the processes being controlled are different. Annex D.2 endorses integration and notes that controls relating to information security can be implemented through the organization's existing ISO/IEC 27001 implementation, which is licence to integrate rather than licence to assume. Reusing an ISMS process without re-examining what it now governs is the common integration failure.
- **S:** Given a described ISMS, determine which elements extend unchanged, which extend with modification, and which must be built new.
- **A:** Skepticism toward reuse that has not been checked.

### Task 3.8 - Apply the clause 8 operational requirements for assessment and treatment

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `clause-eight-operation`, `planned-intervals`, `retained-results`, `significant-change-trigger` |

- **K:** Clause 6 defines the processes; clause 8 requires them to be performed. AI risk assessments are performed at planned intervals or when significant changes are proposed or occur. The AI risk treatment plan is implemented and its effectiveness verified; where risk assessments identify new risks requiring treatment those go back through the treatment process; where treatment options prove ineffective they are reviewed and revalidated and the plan is updated. AI system impact assessments are performed at planned intervals or when significant changes are proposed to occur. Documented information on the results of all three must be retained.
- **S:** Given a described change, determine which clause 8 obligations are triggered and what must be retained.
- **A:** Treating a defined process as worthless until it is actually run.

---

# Domain D4 - Annex A controls: structure and selection (25%)

**Description.** The structure of Annex A and the normative status of Annex B, the relationship to the Statement of Applicability, and selection reasoning across the nine control categories.

**Tasks:** 7  |  **MCQ seats:** 10

## Tasks

### Task 4.1 - Explain the structure of Annex A and the status of Annex B

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `annex-a-not-exhaustive`, `annex-a-structure`, `annex-b-normative`, `control-categories`, `control-count` |

- **K:** Annex A is normative and holds 38 controls across nine categories, A.2 to A.10, carrying ten objectives, because A.6 subdivides into A.6.1 and A.6.2 and each carries its own objective statement. That subdivision is why nine objectives is a common miscount. The controls provide a reference for meeting organizational objectives and addressing risks: not all are required to be used, and the organization can design and implement its own. Annex B is also normative and provides implementation guidance for all the controls listed in Annex A, though organizations do not have to document or justify inclusion or exclusion of the implementation guidance in the Statement of Applicability. Annexes C and D are informative.
- **S:** Locate a described concern under the correct control category.
- **A:** Structure before detail.

### Task 4.2 - Explain how Annex A relates to the Statement of Applicability

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `exceeding-annex-a`, `soa-annex-a-relationship`, `soa-completeness`, `statement-of-applicability` |

- **K:** The Statement of Applicability documents all necessary controls and the justification for inclusion or exclusion of controls. Organizations may not require all controls listed in Annex A, and may exceed that list with additional controls established by the organization itself. Exclusion is legitimate and must be reasoned rather than silent, and documented justifications may be provided for excluding control objectives in general or for specific AI systems. All identified risks and the risk management measures established to address them must be reflected in the Statement of Applicability.
- **S:** Determine whether a described exclusion is adequately justified.
- **A:** Completeness over convenience.

### Task 4.3 - Select controls for AI policy, internal organization and resources

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `internal-organization-controls`, `policy-controls`, `reporting-of-concerns`, `resource-controls` |

- **K:** These categories establish the governing apparatus: documenting a policy for the development or use of AI systems, determining where other organizational policies are affected by or apply to AI objectives, reviewing the AI policy at planned intervals, defining and allocating AI roles and responsibilities, putting in place a process to report concerns about the organization's role with respect to an AI system, and identifying and documenting the resources involved - data, tooling, system and computing, and human resources with their competences.
- **S:** Given a governance gap, select the control category that addresses it.
- **A:** Governance treated as infrastructure.

### Task 4.4 - Select controls across impact assessment and the AI system life cycle

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `event-log-controls`, `impact-assessment-controls`, `life-cycle-stage-controls`, `operation-monitoring-controls`, `responsible-development-controls`, `verification-validation-controls` |

- **K:** These categories cover establishing a process to assess potential consequences for individuals, groups and societies, documenting and retaining the results, and assessing impacts on individuals and on societies across the life cycle. They also cover identifying objectives for responsible development and defining processes for responsible design and development, and defining criteria and requirements at each life-cycle stage: requirements and specification, design and development documentation, verification and validation measures, a deployment plan and pre-deployment requirements, operation and monitoring, technical documentation for each relevant category of interested party, and event logging - where the control requires the organization to determine at which phases of the life cycle record keeping of event logs should be enabled, with in-use as the stated minimum. That is a determination duty, not a flat logging mandate.
- **S:** Place a described life-cycle failure against the control category that would have prevented it.
- **A:** Coverage across the whole life rather than the release moment.

### Task 4.5 - Select controls for data and for information to interested parties

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `data-controls`, `external-reporting-control`, `incident-communication-control`, `information-for-users` |

- **K:** Data controls cover defining and implementing data management processes for development, determining details about acquisition and selection, defining data quality requirements and ensuring data meet them, recording provenance over the life cycles of the data and the system, and documenting criteria for selecting data preparation methods. Information controls cover determining and providing the necessary information to users, including that they are interacting with an AI system, how and when to override it, needs for human oversight and relevant information from the impact assessment; providing capabilities for interested parties to report adverse impacts; documenting a plan for communicating incidents to users; and determining obligations to report information about the system to interested parties.
- **S:** Determine what a described deployment must disclose and to whom.
- **A:** Transparency as a default rather than a concession.

### Task 4.6 - Select controls for use of AI systems and for third-party and customer relationships

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `customer-controls`, `human-oversight-guidance`, `intended-use-control`, `third-party-controls`, `use-of-ai-controls` |

- **K:** The Annex A use controls require the organization to define and document processes for the responsible use of AI systems, to identify and document objectives to guide responsible use, and to ensure the system is used according to its intended uses and accompanying documentation. Relationship controls allocate responsibilities within the AI system life cycle between the organization, its partners, suppliers, customers and third parties, establish a supplier process, and consider customer expectations and needs. The familiar content - fairness, accountability, transparency, explainability, reliability, safety, robustness, privacy, accessibility, and meaningful human oversight with authority to override decisions - is Annex B guidance at B.9.3, which uses should and offers the list as examples rather than a required set. Annex B is normative, so this is not optional reading, but a should and an illustrative list must not be taught as a shall and an exhaustive one. Which controls apply depends on the role held.
- **S:** Given an organization's role, determine which control categories apply and which are legitimately excluded.
- **A:** Precision about what the organization actually does.

### Task 4.7 - Analyze overlap between ISO/IEC 42001 and ISO/IEC 27001 controls

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `control-overlap`, `false-equivalence-controls`, `iso-42001-27001-integration`, `single-control-two-systems` |

- **K:** Annex D.2 explicitly contemplates implementing controls that partly relate to information security through an existing ISO/IEC 27001 implementation, so genuine overlap exists and should be used. But some obligations look equivalent and are not: an access control protecting a model endpoint is not the obligation to record the provenance of the data that model was trained on. Treating overlap as equivalence produces a Statement of Applicability that passes review while leaving the AI obligation unmet.
- **S:** Given a pair of controls, determine whether one implementation satisfies both and justify the answer.
- **A:** Suspicion of convenient equivalence.

---

# Domain D5 - Performance evaluation, improvement and certification (17.5%)

**Description.** Clauses 9 and 10: monitoring and measurement, internal audit, management review, nonconformity and corrective action, and the route to certification under ISO/IEC 42006.

**Tasks:** 6  |  **MCQ seats:** 7

## Tasks

### Task 5.1 - Explain monitoring, measurement, analysis and evaluation for an AIMS

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `aims-effectiveness-vs-system-performance`, `evidence-of-results`, `monitoring-and-measurement`, `what-to-monitor` |

- **K:** The organization determines what needs to be monitored and measured, the methods to be used to ensure valid results, when monitoring and measuring is performed, and when results are analysed and evaluated, with documented information available as evidence of the results. It must evaluate the performance and the effectiveness of the AI management system. A note to the definition of performance - not a requirement - records that performance refers both to results achieved by using AI systems and results related to the management system itself, and the two are distinct: a well-governed system can perform poorly and a well-performing system can be ungoverned.
- **S:** Distinguish a measure of AIMS effectiveness from a model performance metric.
- **A:** Measuring the system of governance, not only the technology.

### Task 5.2 - Explain the internal audit requirement

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `audit-criteria-and-scope`, `audit-programme`, `auditor-objectivity`, `internal-audit-requirement` |

- **K:** Internal audits are conducted at planned intervals to provide information on whether the AIMS conforms to the organization's own requirements for it and to the requirements of the standard, and whether it is effectively implemented and maintained. The audit programme covers frequency, methods, responsibilities, planning requirements and reporting, and considers the importance of the processes concerned and the results of previous audits. The organization defines audit objectives, criteria and scope for each audit, selects auditors and conducts audits to ensure objectivity and the impartiality of the audit process, and ensures results are reported to relevant managers. An internal audit may be conducted by the organization itself or by an external party on its behalf.
- **S:** Identify an objectivity or impartiality problem in a described audit assignment.
- **A:** Independence treated as a structural requirement.

### Task 5.3 - Explain management review inputs and results

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `management-review`, `review-inputs`, `review-records`, `review-results` |

- **K:** Top management reviews the AIMS at planned intervals to ensure its continuing suitability, adequacy and effectiveness. Inputs are the status of actions from previous reviews, changes in external and internal issues relevant to the AIMS, changes in the needs and expectations of interested parties, information on AIMS performance including trends in nonconformities and corrective actions, monitoring and measurement results and audit results, and opportunities for continual improvement. Results include decisions related to continual improvement opportunities and any need for changes to the AIMS, and must be evidenced by documented information.
- **S:** Identify a missing management review input.
- **A:** Review treated as a decision forum rather than a formality.

### Task 5.4 - Apply nonconformity and corrective action

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `cause-analysis`, `continual-improvement`, `correction-vs-corrective-action`, `effectiveness-review`, `nonconformity` |

- **K:** When a nonconformity occurs the organization reacts to it, taking action to control and correct it and dealing with the consequences, then evaluates the need for action to eliminate the causes so that it does not recur or occur elsewhere, by reviewing the nonconformity, determining its causes and determining whether similar nonconformities exist or could potentially occur. Any needed action is implemented, the effectiveness of any corrective action taken is reviewed, and changes are made to the AIMS if necessary. Corrective actions must be appropriate to the effects of the nonconformities encountered, and documented information must be available as evidence of the nature of the nonconformities, subsequent actions taken and the results of corrective action. Root cause for an AI failure may sit in data or in a supplier rather than in a process.
- **S:** Given a described failure, distinguish the correction from the corrective action.
- **A:** Impatience with fixes that do not prevent recurrence.

### Task 5.5 - Describe the certification route and what ISO/IEC 42006 governs

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `accreditation-vs-certification`, `certification-route`, `iso-42006-role`, `stage-one-stage-two`, `surveillance-and-recertification` |

- **K:** ISO/IEC 42001 says nothing about how certification is conducted; the route belongs to other documents, and stating otherwise is the same error as claiming a certificate validity period from ISO/IEC 27001. ISO/IEC 42006 sets requirements for bodies auditing and certifying an AI management system, including competence, impartiality and audit time. The two-stage initial audit, surveillance and recertification cycle comes from ISO/IEC 17021-1, the generic requirements for bodies providing audit and certification of management systems. What ISO/IEC 42001 does say is that an organization conforming with its requirements can generate evidence of its responsibility and accountability regarding its role with respect to AI systems, which is narrower than a compliance claim. Accreditation assesses the certifier; certification assesses the organization; the two are routinely conflated.
- **S:** Distinguish what an accreditation body does from what a certification body does.
- **A:** Precision about who is assuring whom.

### Task 5.6 - Analyze whether an integrated ISO/IEC 27001 and ISO/IEC 42001 audit programme can share evidence

| Attribute | Value |
|-|-|
| Domain | D5 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Concept slugs | `auditor-competence-limit`, `evidence-that-cannot-be-shared`, `integrated-audit-programme`, `shared-evidence` |

- **K:** The standard's own definition of audit contemplates a combined audit combining two or more disciplines, and the clause 9 and 10 machinery is shared, so one audit programme, one management review cycle and one nonconformity process can serve both systems. Evidence is a different question: a management review record can cover both, an impact assessment cannot substitute for a risk assessment, and an ISMS internal auditor is not automatically competent to audit an AIMS.
- **S:** Given a described integrated programme, determine which evidence serves both systems and which does not.
- **A:** Integration where it is real and separation where it is not.

---

*Generated 2026-09-02 by scripts/gen-jta-doc.mjs from certification AIMS-F (de046fa6-e627-48c1-85d8-9df226d144f4).*
