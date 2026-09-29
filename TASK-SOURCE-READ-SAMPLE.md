# Pending task-source proposals: the read sample

**NOTHING IS IN `task_sources`.** These are proposals from `judge-task-sources2.mjs`, blind, and
they stay proposals until you have read them.

| certification | tasks judged | primaries proposed | tasks with none | none_apply | low-confidence |
|---|---|---|---|---|---|
| ISMS-F | 49 | 503 | 2 | 2 | 52 |
| ISMS-IA | 37 | 313 | 0 | 0 | 32 |
| AIMS-IA | 39 | 346 | 0 | 0 | 35 |

**Recall and precision are UNMEASURABLE for all three.** None has a reviewed mapping -- that is why
these are being proposed. The judge's own report said `0.0%` on its first run, which reads as "found
nothing" when the truth is "nothing to compare against"; it now says so instead.

The only evidence about quality is AIMS-F, which does have a reviewed mapping: **recall 84.0%,
subject recall 96.2%, corrected precision 93.2%** -- and 17 of its 24 misses are one task whose
reviewed mapping enumerates every leaf of a clause tree. AIMS-F is also the only one of the four
whose proposals were checked against a human's, so it is an upper bound for these three rather than
a like-for-like prediction: they face larger source pools.

---

## The 8 proposals on a two-edition address, and only 2 are wrong

The library holds ISO/IEC 27001 clauses `4.1` and `4.2` in two editions, `2022` and
`2022/Amd1:2024`. The judge's passage map was keyed on (source, clause) alone, so the AMENDMENT won
the key and the base clause text was unreachable through it. **The key now includes the edition.**

**Reading the eight corrects my own framing of them.** Six INTENTIONALLY mean the amendment --
ISMS-F 2.3 and ISMS-IA 4.7 are explicitly about the climate-change addition, and their recorded
reasons say so (*"Amendment 1:2024 adds to 4.1 the requirement to determine whether climate change
is a relevant issue"*). For those, resolving to the amendment is the right answer.

Only ISMS-F task 2.2's high-confidence pair meant the BASE clause and was judged against change-note
text. Its medium-confidence pair means the amendment. **The judgment distinguished the two editions
correctly, gave them different reasons and different confidences, and the map collapsed them** -- so
the duplicate was my defect showing through a correct judgment, not a confused one.

A bounded listed set beats re-running 127 tasks. AIMS-F and AIMS-IA name neither clause.

| certification | task | clause | confidence | the reason as recorded |
|---|---|---|---|---|
| ISMS-F | 2.2 | `4.1` | high | States the requirement to determine external and internal issues relevant to the ISMS purpose and outcomes. |
| ISMS-F | 2.2 | `4.2` | high | States the requirement to determine interested parties and which of their requirements are relevant to information security. |
| ISMS-F | 2.2 | `4.1` | medium | Amendment 1 text on climate change relevance to internal/external issues. |
| ISMS-F | 2.2 | `4.2` | medium | Amendment 1 text on interested party requirements relating to climate change. |
| ISMS-F | 2.3 | `4.1` | high | Amendment 1:2024 adds to 4.1 the requirement to determine whether climate change is a relevant issue in the organization's context |
| ISMS-F | 2.3 | `4.2` | high | Amendment 1:2024 adds the note that interested parties can have requirements related to climate change. |
| ISMS-IA | 4.7 | `4.1` | high | The amended clause 4.1 is where the climate change relevance determination is stated (base text plus Amendment 1 change to 4.1). |
| ISMS-IA | 4.7 | `4.2` | high | Amendment 1 adds the note that interested parties can have climate-change-related requirements. |

---

## 15 random tasks   (seed 7, reproducible: `--seed=7 --n=15`)

### AIMS-IA task 2.3

> Determine the competence an AIMS audit team requires given the AI systems in scope

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 19011 | `5.4.2` | Competence of individual(s) managing the | high | Competence required of those managing the audit programme, cited directly by the task. |
| 19011 | `5.5.4` | Selecting audit team members | high | Selecting audit team members, including use of technical experts to close competence gaps. |
| 19011 | `6.3.3` | Assigning work to the audit team | medium | Assigning work to the audit team based on individual competence. |
| 19011 | `7.2.1` | General | medium | General statement that auditor competence comprises personal behaviour plus knowledge and skills. |
| 19011 | `7.2.3.1` | General | high | General requirement on auditors' knowledge and skills, the frame for identifying gaps. |
| 19011 | `7.2.3.2` | Generic knowledge and skills of manageme | high | Generic knowledge and skills of management system auditors. |
| 19011 | `7.2.3.3` | Discipline-specific and sector-specific  | high | Discipline- and sector-specific competence — the AI-specific knowledge an AIMS audit needs. |
| 19011 | `7.2.3.4` | Generic competence of the audit team lea | medium | Generic competence of the audit team leader, relevant to team composition. |
| 19011 | `7.2.3.5` | Knowledge and skills for auditing multip | medium | Knowledge and skills for auditing multiple disciplines, relevant to combined AIMS audits. |
| 19011 | `7.2.4` | Achieving auditor competence | high | How auditor competence is achieved, cited directly by the task. |
| 19011 | `4.6` | Independence | medium | Independence — a remedy for a competence gap must not compromise objectivity. |
| 19011 | `3.17` | technical expert <audit> person | high | Definition of technical expert, the distinction the task tests. |
| 19011 | `3.15` | audit team one or | medium | Definition of audit team, which may include technical experts. |
| 42006 | `7.1.2` | Generic technical competence requirement | medium | Generic technical competence requirements for AIMS audit personnel. |
| 42006 | `7.1.3.1` | General requirements for AIMS | high | General competence requirements for AIMS audits. |
| 42006 | `7.1.3.2` | Specific technical competence requiremen | high | Specific technical competence requirements for AI systems in scope. |
| 42006 | `7.1.3.3` | AI and AIMS related legal obligations | medium | Competence in AI and AIMS related legal obligations. |
| 42006 | `7.1.3.4` | Specific technical competence requiremen | medium | Further specific technical competence requirements. |
| 42006 | `7.1.3.5` | Client business sector | medium | Competence regarding the client business sector. |
| 42006 | `7.1.3.6` | Client products, processes and organizat | medium | Competence regarding client products, processes and organization. |
| 42006 | `7.2.2.1` | General considerations | medium | General considerations for selecting competent personnel for an AIMS audit. |
| 42006 | `7.2.2.2` | Selecting auditors | high | Selecting auditors against the competence needed for the scope. |
| 42006 | `7.2.2.3` | Selecting auditors for leading the team | medium | Selecting the audit team leader. |

*pass 2 dropped 8:* `5.4.4` `7.6` `3.16` `3.23` `7.3` `9.2.2` and 2 more

### AIMS-IA task 3.7

> Select sources of information appropriate to an AIMS audit

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 19011 | `A.14` | Selecting sources of information | high | Directly the named guidance on selecting sources of information for an audit. |
| 19011 | `3.10` | audit evidence records, statements | medium | Definition of audit evidence as records, statements of fact or other information. |
| 19011 | `3.9` | objective evidence data supporting | low | Definition of objective evidence underpinning going to the record. |
| 42001 | `A.4.2` | Resource documentation | high | Resource documentation is an AIMS-specific source of information. |
| 42001 | `A.4.3` | Data resources | high | Data resource records as audit evidence source. |
| 42001 | `A.4.4` | Tooling resources | high | Tooling resource records as audit evidence source. |
| 42001 | `A.4.5` | System and computing resources | high | System and computing resource records as audit evidence source. |
| 42001 | `A.4.6` | Human resources | medium | Human resource/competence records as an AIMS source of information. |
| 42001 | `A.6.2.7` | AI system technical documentation The or | medium | AI system technical documentation as a source of information. |
| 42001 | `B.4.2` | Resource documentation | medium | Guidance detailing what resource documentation contains, i.e. what the record shows. |
| 42001 | `B.4.3` | Data resources | medium | Guidance on data resource documentation content auditors would examine. |
| 42001 | `B.4.4` | Tooling resources | medium | Guidance on tooling resource documentation content. |
| 42001 | `B.4.5` | System and computing resources | medium | Guidance on system and computing resource documentation content. |
| 42001 | `B.5.3` | Documentation of AI system impact assess | medium | Guidance on impact assessment documentation content as evidence. |
| 42001 | `B.6.2.8` | AI system recording of event logs | medium | Guidance on event log content and retention as evidence. |

*pass 2 dropped 10:* `A.5` `6.4.7` `6.4.6` `6.4.5` `A.1` `6.1.4` and 4 more

### ISMS-F task 2.2

> Explain clause 4 - internal and external issues, and interested parties.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27001 | `4.1` | Amendment 1: change to 4.1 | high | States the requirement to determine external and internal issues relevant to the ISMS purpose and outcomes. |
| 27001 | `4.2` | Amendment 1: change to 4.2 | high | States the requirement to determine interested parties and which of their requirements are relevant to information security. |
| 27001 | `4.1` | Amendment 1: change to 4.1 | medium | Amendment 1 text on climate change relevance to internal/external issues. |
| 27001 | `4.2` | Amendment 1: change to 4.2 | medium | Amendment 1 text on interested party requirements relating to climate change. |
| 27001 | `4.3` | Determining the scope of the information | high | Shows scope is determined by considering the 4.1 issues and 4.2 requirements, i.e. context precedes scope. |
| 27000 | `3.37` | interested party (preferred term) | high | Definition of interested party. |
| 27000 | `3.22` | external context external environment | high | Definition of external context. |
| 27000 | `3.38` | internal context internal environment | high | Definition of internal context. |
| 27000 | `3.56` | requirement need or expectation | medium | Definition of requirement (need or expectation), used to distinguish a requirement from a preference. |
| 27002 | `0.2` | Information security requirements | low | Sources of information security requirements, supporting which party needs are security-relevant. |

*pass 2 dropped 1:* `4.5.2`

### ISMS-F task 2.7

> Explain roles, responsibilities and authorities within an ISMS.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27001 | `5.3` | Organizational roles, responsibilities a | high | The requirement that top management assign and communicate responsibilities AND authorities for ISMS roles — the core of the task. |
| 27001 | `5.1` | Leadership and commitment | high | Top management's own leadership accountabilities, including ensuring roles are supported and resourced. |
| 27001 | `6.1.2` | Information security risk assessment | high | Requires identification of risk owners as part of risk assessment. |
| 27001 | `A.5.2` | Information security roles and | high | Control requiring information security roles and responsibilities to be defined and allocated. |
| 27001 | `A.5.4` | Management responsibilities | medium | Management responsibilities for personnel applying information security. |
| 27002 | `5.2` | Information security roles and responsib | high | Guidance on defining, allocating and documenting security roles and responsibilities, including asset/risk ownership. |
| 27000 | `3.71` | risk owner person or | high | Definition of risk owner: person or entity with accountability AND authority to manage a risk. |
| 27000 | `3.75` | top management person or | high | Definition of top management: person/group directing and controlling at the highest level with authority to delegate. |
| 27000 | `3.24` | governing body person or | medium | Definition of governing body — accountability structure above management. |
| 27000 | `4.2.4` | Management | medium | Explains management's direction, authority and assignment of responsibilities in the ISMS. |

*pass 2 dropped 7:* `6.1.3` `8.3` `A.5.3` `5.3` `5.4` `3.23` and 1 more

### ISMS-F task 2.9

> Explain continual improvement and the plan-do-check-act model as the ISMS operating rhythm.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27001 | `10.1` | Continual improvement | high | States the obligation to continually improve the suitability, adequacy and effectiveness of the ISMS. |
| 27001 | `10.2` | Nonconformity and corrective action | high | Nonconformity and corrective action - the 'act' step that drives improvement from findings. |
| 27001 | `9.1` | Monitoring, measurement, analysis and ev | high | Monitoring, measurement, analysis and evaluation - the 'check' step of the cycle. |
| 27001 | `9.2.1` | General | medium | Internal audit as a recurring check activity in the ISMS rhythm. |
| 27001 | `9.3.1` | General | high | Management review at planned intervals - periodic check/act point. |
| 27001 | `9.3.2` | Management review inputs | high | Review inputs include opportunities for continual improvement. |
| 27001 | `9.3.3` | Management review results | high | Review results include decisions on continual improvement opportunities and ISMS changes. |
| 27001 | `8.1` | Operational planning and control | high | Control of planned changes and review of unintended changes - the 'do' step and planned change concept. |
| 27001 | `6.2` | Information security objectives and plan | medium | Objectives are monitored, updated and planned - the 'plan' step feeding improvement. |
| 27001 | `6.1.1` | General | medium | Planning actions to address risks and opportunities, including improvement of results. |
| 27001 | `4.4` | Information security management system | high | Requirement to establish, implement, maintain and continually improve the ISMS. |
| 27001 | `0.1` | General | low | Introduction frames the ISMS as an ongoing, preserved and improved system. |
| 27000 | `4.5.6` | Monitor, maintain and improve the effect | high | Monitor, maintain and improve the effectiveness of the ISMS. |
| 27000 | `4.5.7` | Continual improvement | high | Dedicated passage on continual improvement of the ISMS. |
| 27000 | `3.13` | continual improvement recurring activity | high | Definition of continual improvement as a recurring activity. |

*pass 2 dropped 7:* `9.2.2` `4.3` `3.17` `3.16` `4.2.5` `4.6` and 1 more

### ISMS-F task 3.1

> Explain the risk assessment process - identification, analysis and evaluation.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27001 | `6.1.2` | Information security risk assessment | high | Defines the required information security risk assessment process: criteria, identification, analysis, evaluation — the core of the task. |
| 27000 | `3.64` | risk assessment overall process | high | Definition of risk assessment as the overall process of identification, analysis and evaluation. |
| 27000 | `3.68` | risk identification process (3.54) of fi | high | Definition of risk identification — finding, recognizing, describing risks. |
| 27000 | `3.63` | risk analysis process (3.54) | high | Definition of risk analysis — understanding nature of risk and determining level of risk. |
| 27000 | `3.67` | risk evaluation process (3.54) | high | Definition of risk evaluation — comparing analysis results with risk criteria to decide significance. |
| 27000 | `3.66` | risk criteria terms of reference against | medium | Risk criteria are the reference against which evaluation is made. |
| 27000 | `3.39` | level of risk magnitude | medium | Level of risk is the output of analysis. |
| 27000 | `4.5.3` | Assessing information security risks | high | Narrative explanation of assessing information security risks and what the process produces. |
| 27000 | `3.70` | risk management process systematic | low | Risk management process situates assessment among communication, treatment and monitoring. |

*pass 2 dropped 6:* `8.2` `6.1.1` `6.1.3` `3.40` `3.12` `3.61`

### ISMS-F task 3.4

> List the four risk treatment options.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27000 | `4.5.4` | Treating information security risks | high | Describes treating information security risks and enumerates the treatment options (apply controls/modify, accept/retain, avoid, share). |
| 27000 | `3.72` | risk treatment process (3.54) | high | Definition of risk treatment, whose notes list the options (avoiding, taking, removing source, changing likelihood/consequence, sharing, retaining). |
| 27000 | `3.62` | risk acceptance informed decision to tak | medium | Definition of risk acceptance (retain risk), one of the four options. |

*pass 2 dropped 4:* `6.1.3` `4.5.5` `3.14` `3.1.8`

### ISMS-F task 3.9

> Explain how prompt and context data leaving the organization constitutes an information security risk.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27002 | `5.14` | Information transfer | high | Prompt submission to an external model is an information transfer outside the organization; transfer rules and agreements govern it. |
| 27002 | `5.23` | Information security for use of cloud se | high | An external inference service is a cloud service; requirements, retention and provider handling are addressed here. |
| 27002 | `5.12` | Classification of information | high | Severity of the disclosure is determined by the classification of the information placed in the prompt. |
| 27002 | `5.10` | Acceptable use of information and other  | high | Acceptable use rules on what information may be entered into or processed by external tools. |
| 27002 | `8.12` | Data leakage prevention | high | Prompt data egress is precisely the leakage channel data leakage prevention addresses. |
| 27002 | `5.19` | Information security in supplier relatio | medium | The model provider is a supplier; risk from using its service must be managed. |
| 27002 | `5.20` | Addressing information security within s | high | Provider retention, reuse and confidentiality terms are set in supplier agreements. |
| 27002 | `8.10` | Information deletion | medium | Retention by the provider and deletion of transferred information. |
| 27001 | `6.1.2` | Information security risk assessment | medium | Treating prompt egress as an identified information security risk with consequence and likelihood. |
| 27001 | `A.5.14` | Information transfer | medium | Annex A statement of the information transfer control the task rests on. |
| 27001 | `A.5.23` | Information security for use of | medium | Annex A statement on information security for use of cloud services. |
| 27000 | `3.10` | confidentiality property that informatio | medium | Confidentiality definition: unauthorized disclosure is the property breached by egress. |

*pass 2 dropped 5:* `5.13` `6.3` `6.6` `5.34` `3.28`

### ISMS-F task 4.6

> Analyze how access control assumptions break when a non-human actor holds credentials and acts.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27002 | `5.16` | Identity management | high | Identity management explicitly covers identities assigned to non-human entities — the core passage for agent identity assumptions. |
| 27002 | `5.15` | Access control | high | Access control rules and need-to-know/need-to-use model whose underlying human-actor assumption the task probes. |
| 27002 | `5.17` | Authentication information | high | Authentication information (secret management) — agent credentials and their handling. |
| 27002 | `5.18` | Access rights | high | Provisioning, review and revocation of access rights — standing authority versus just-in-time grant. |
| 27002 | `8.2` | Privileged access rights | high | Privileged access rights, including time-limited/event-driven privilege, the JIT authority concept. |
| 27002 | `8.3` | Information access restriction | medium | Information access restriction assumes a bounded requesting subject; relevant when an agent acts on behalf of many users. |
| 27002 | `8.5` | Secure authentication | high | Secure authentication techniques presuppose an interactive human user; breaks for autonomous actors. |
| 27002 | `8.15` | Logging | high | Logging requirements (user IDs, activities) underpin the attribution problem when an agent's credential is logged instead of the initiating person. |
| 27002 | `8.18` | Use of privileged utility programs | low | Privileged utility programs — automated tooling running with elevated authority. |
| 27002 | `5.3` | Segregation of duties | medium | Segregation of duties collapses when one non-human identity performs multiple conflicting duties. |
| 27002 | `3.1.20` | personnel persons doing work under the o | medium | Definition of personnel (persons under the organization's direction) shows the human-actor assumption in the control set. |
| 27000 | `3.1` | access control means to | high | Definition of access control — the assumption set the task dissects. |
| 27000 | `3.5` | authentication provision of assurance | medium | Definition of authentication (assurance of a claimed characteristic of an entity). |
| 27000 | `3.6` | authenticity property that an | medium | Definition of authenticity underpinning identity claims by non-human actors. |
| 27000 | `3.48` | non-repudiation ability to prove | high | Definition of non-repudiation — proving occurrence and origin of an action, i.e. the attribution problem. |
| 27001 | `A.5.15` | Access control | medium | Annex A control statement for access control, keyable for a control-identification item. |
| 27001 | `A.5.16` | Identity management | medium | Annex A identity management control statement covering full life cycle of identities. |
| 27001 | `A.5.17` | Authentication information | medium | Annex A authentication information control statement. |
| 27001 | `A.5.18` | Access rights | medium | Annex A access rights provisioning/review/removal control statement. |
| 27001 | `A.8.2` | Privileged access rights | medium | Annex A privileged access rights control statement. |
| 27001 | `A.8.5` | Secure authentication | low | Annex A secure authentication control statement. |
| 27001 | `A.8.15` | Logging | low | Annex A logging control statement relevant to attribution of recorded activity. |

*pass 2 dropped 5:* `5.10` `8.16` `5.28` `3.1.5` `A.8.16`

### ISMS-F task 4.8

> Analyze what supplier assurance can and cannot establish about a foundation-model provider.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27002 | `5.19` | Information security in supplier relatio | high | Defines managing information security risks from supplier products/services — the base for treating a model provider as a supplier. |
| 27002 | `5.20` | Addressing information security within s | high | Supplier agreements: what can be contractually required (and hence assured) from a provider, including audit/attestation rights. |
| 27002 | `5.21` | Managing information security in the ICT | high | ICT supply chain assurance where direct inspection of components is unavailable; reliance on declarations/evidence. |
| 27002 | `5.22` | Monitoring, review and change management | high | Monitoring/review of supplier services, including use of independent audit reports and attestations in place of inspection. |
| 27002 | `5.23` | Information security for use of cloud se | high | Cloud-service-specific assurance limits; model providers are consumed as a cloud service with limited visibility. |
| 27002 | `8.30` | Outsourced development | medium | Outsourced development: assurance over work the organization cannot inspect directly. |
| 27001 | `A.5.19` | Information security in supplier | medium | Annex A statement of supplier relationship control applied to the model provider. |
| 27001 | `A.5.20` | Addressing information security | medium | Annex A control on security in supplier agreements — what assurance can be contracted for. |
| 27001 | `A.5.21` | Managing information security | medium | Annex A ICT supply chain control relevant to inspectability limits. |
| 27001 | `A.5.22` | Monitoring, review and change | medium | Annex A control on monitoring/review of supplier services — attestation-based assurance. |
| 27001 | `A.5.23` | Information security for use of | medium | Annex A control for cloud service use, the delivery mode of a foundation model. |
| 27001 | `8.1` | Operational planning and control | medium | Control of externally provided processes/products — the requirement to control what is outsourced. |
| 27000 | `3.51` | outsource make an arrangement | low | Definition of outsource — a model provider arrangement remains the organization's responsibility. |
| 27000 | `3.57` | residual risk risk (3.61) remaining afte | low | Residual risk — what remains after assurance that cannot be obtained. |

*pass 2 dropped 4:* `5.35` `8.14` `5.30` `6.1.2`

### ISMS-F task 4.10

> Apply awareness and acceptable-use reasoning to a described shadow AI situation.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27002 | `5.10` | Acceptable use of information and other  | high | Acceptable use of information and associated assets — the rule set an unapproved AI tool use breaches and that a response must clarify. |
| 27002 | `6.3` | Information security awareness, educatio | high | Awareness, education and training — the awareness-over-prohibition response the task asks for. |
| 27002 | `6.8` | Information security event reporting | high | Information security event reporting — underpins reporting culture and not driving use underground. |
| 27002 | `5.36` | Compliance with policies, rules and stan | medium | Compliance with policies, rules and standards — how non-compliance is detected and addressed. |
| 27001 | `7.3` | Awareness | high | Awareness requirement: personnel must be aware of policy, their contribution and implications of non-conformance. |
| 27001 | `A.5.10` | Acceptable use of information | high | Annex A acceptable use control that the situation engages. |
| 27001 | `A.6.3` | Information security awareness | high | Annex A awareness/training control. |
| 27001 | `A.6.8` | Information security event re | medium | Annex A event reporting control supporting reporting culture. |

*pass 2 dropped 6:* `5.1` `5.23` `8.19` `6.4` `5.4` `A.5.36`

### ISMS-F task 4.11

> Explain the physical controls theme, and why AI does not materially change it.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27002 | `4.2` | Themes and attributes | high | Defines the four themes including 'physical' — the basis for describing what the physical theme groups. |
| 27002 | `7.1` | Physical security perimeters | high | Physical security perimeters — core concept named by the task. |
| 27002 | `7.2` | Physical entry | high | Physical entry control, a member of the physical theme family. |
| 27002 | `7.7` | Clear desk and clear screen | high | Clear desk and clear screen — named concept in the task. |
| 27002 | `7.8` | Equipment siting and protection | high | Equipment siting and protection — the equipment security concept. |
| 27002 | `7.9` | Security of assets off-premises | high | Security of assets off-premises — equipment security beyond the perimeter. |
| 27001 | `A.7.1` | Physical security perimeters | medium | Annex A statement of the physical perimeter control. |
| 27001 | `A.7.2` | Physical entry | medium | Annex A physical entry control. |
| 27001 | `A.7.3` | Securing offices, rooms and fa | medium | Annex A securing offices, rooms and facilities. |
| 27001 | `A.7.4` | Physical security monitoring | medium | Annex A physical security monitoring. |
| 27001 | `A.7.5` | Protecting against physical and | medium | Annex A protection against physical and environmental threats. |
| 27001 | `A.7.6` | Working in secure areas | medium | Annex A working in secure areas. |
| 27001 | `A.7.7` | Clear desk and clear screen | medium | Annex A clear desk and clear screen — named concept. |
| 27001 | `A.7.8` | Equipment siting and protection | medium | Annex A equipment siting and protection — named concept. |
| 27001 | `A.7.9` | Security of assets off-premises | medium | Annex A security of assets off-premises. |
| 27001 | `A.7.10` | Storage media | medium | Annex A storage media. |
| 27001 | `A.7.11` | Supporting utilities | medium | Annex A supporting utilities. |
| 27001 | `A.7.12` | Cabling security | medium | Annex A cabling security. |
| 27001 | `A.7.13` | Equipment maintenance | medium | Annex A equipment maintenance. |
| 27001 | `A.7.14` | Secure disposal or re-use of | medium | Annex A secure disposal or re-use of equipment. |

*pass 2 dropped 9:* `7.3` `7.4` `7.5` `7.6` `7.10` `7.11` and 3 more

### ISMS-IA task 2.6

> Determine whether an audit programme satisfies clause 9.2, including what "planned intervals" requires and does not require.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 27001 | `9.2.1` | General | high | States the requirement for internal audits at planned intervals and the two conformity questions the audit must answer. |
| 27001 | `9.2.2` | Internal audit programme | high | Lists the audit programme content requirements (frequency, methods, responsibilities, planning, reporting) and the documented information evidence. |
| 19011 | `3.5` | audit programme arrangements for | medium | Definition of audit programme - set of audits planned for a specific time frame and directed towards a specific purpose. |
| 19011 | `5.1` | General | medium | General guidance on establishing and managing an audit programme, against which a described programme is judged. |

*pass 2 dropped 10:* `7.5.3` `5.2` `5.3` `5.4.3` `5.4.4` `5.5.7` and 4 more

### ISMS-IA task 3.5

> Select the question form that elicits evidence rather than confirmation in a given interview situation.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 19011 | `A.17` | Conducting interviews | high | Interview guidance — question form, open questions, avoiding leading/closed questions that elicit confirmation. |
| 19011 | `3.10` | audit evidence records, statements | medium | Definition of audit evidence (records, statements of fact) — statements must be verifiable. |
| 19011 | `3.9` | objective evidence data supporting | low | Definition of objective evidence, distinguishing evidence from mere assertion/agreement. |

*pass 2 dropped 5:* `6.4.7` `A.5` `4.7` `A.14` `7.2.2`

### ISMS-IA task 5.3

> Select the nonconformity statement that correctly links the evidence to the requirement it fails.

| source | clause | title | confidence | why |
|---|---|---|---|---|
| 19011 | `A.18.3` | Recording nonconformities | high | Directly governs how nonconformities are recorded: the statement of the nonconformity, the supporting audit evidence and the audit criteria not fulfil |
| 19011 | `6.4.8` | Generating the audit findings | high | Generating audit findings: evaluating evidence against criteria and identifying nonconformities, the basis of the statement. |
| 19011 | `4.3` | Fair presentation | high | Fair presentation principle explicitly named in the KSA: findings and reports must reflect the audit truthfully and accurately. |
| 19011 | `3.22` | nonconformity non-fulfilment of a | medium | Definition of nonconformity as non-fulfilment of a requirement — the requirement link the statement must name. |
| 19011 | `3.11` | audit finding results of | medium | Definition of audit finding: result of evaluating audit evidence against audit criteria. |
| 19011 | `3.10` | audit evidence records, statements | medium | Definition of audit evidence — the evidence element of a nonconformity statement. |
| 19011 | `3.8` | audit criteria set of | medium | Definition of audit criteria — the requirement against which evidence is compared. |
| 19011 | `6.5.1` | Preparing the audit report | low | Report content requirements may constrain how nonconformities are expressed to the recipient. |

*pass 2 dropped 5:* `A.18.1` `4.7` `3.9` `10.2` `3.47`

---

## Every low-confidence decision   (119)

Not a sample. These are the decisions the judgment itself flagged as a guess between plausible
options, and the reason says why in each case.

| certification | task | source | clause | title | why it is a guess |
|---|---|---|---|---|---|
| AIMS-IA | 1.4 | 19011 | `5.3` | Determining and evaluating audit p | Audit programme risks include impartiality/independence risks needing safeguards. |
| AIMS-IA | 1.5 | 19011 | `3.13` | audit client organization or | Definition of audit client separates internal programme ownership from certification client relationships. |
| AIMS-IA | 1.5 | 42006 | `5.2.2.3` | Examples of activities with confli | Examples of activities with conflict of interest clarify what a certification body may not do, illuminating role separation. |
| AIMS-IA | 2.1 | 42006 | `9.2.1.2` | Audit objectives | Audit objectives for an individual certification audit, contrasting with programme-level objectives. |
| AIMS-IA | 2.2 | 19011 | `A.6.2` | Judgement-based sampling | Judgement-based sampling underpins risk-based concentration of effort and its evidence limits. |
| AIMS-IA | 2.4 | 22989 | `5.19.5.3` | Data provider | Data provider role. |
| AIMS-IA | 2.5 | 19011 | `5.5.1` | General | General provisions on implementing the audit programme leading into individual audit definition. |
| AIMS-IA | 3.6 | 19011 | `6.4.6` | Reviewing documented information w | Reviewing documented information while conducting the audit, often the remote substitute for direct observation. |
| AIMS-IA | 3.6 | 42006 | `8.4.2` | Access to the documentation of the | Access to the documentation of the organization, relevant to access limits in remote settings. |
| AIMS-IA | 3.7 | 19011 | `3.9` | objective evidence data supporting | Definition of objective evidence underpinning going to the record. |
| AIMS-IA | 4.1 | 22989 | `5.19.2.2` | AI platform provider | AI platform provider sub-role definition. |
| AIMS-IA | 4.1 | 22989 | `5.19.2.3` | AI service or product provider | AI service or product provider sub-role definition. |
| AIMS-IA | 4.1 | 22989 | `5.19.4.1` | General | General on AI customer roles. |
| AIMS-IA | 4.1 | 22989 | `5.19.5` | AI partner | AI partner roles (integrator, data provider) that a role determination may need to distinguish. |
| AIMS-IA | 4.2 | 42001 | `3.26` | statement of applicability documen | Statement of applicability definition; exclusions and their justification are recorded here, relevant to testing an exclusion. |
| AIMS-IA | 4.2 | 42006 | `9.2.1.3` | Scope of audit | Scope of audit determination, which depends on the client's AIMS scope and any exclusions. |
| AIMS-IA | 4.2 | 22989 | `5.19.4` | AI customer | AI customer role relevant to determining role-based scope. |
| AIMS-IA | 4.3 | 42001 | `B.3.3` | Reporting of concerns | Guidance on reporting of concerns mechanisms. |
| AIMS-IA | 4.3 | 42001 | `B.2.1` | Objective | Objective of policies related to AI, frames what conformity means. |
| AIMS-IA | 4.3 | 42001 | `B.3.1` | Objective | Objective of internal organization controls. |
| AIMS-IA | 4.3 | 19011 | `A.5` | Verifying information | Verifying information collected during the audit. |
| AIMS-IA | 4.4 | 42001 | `3.10` | documented information information | Definition of documented information, relevant to what artifact can be demanded. |
| AIMS-IA | 4.5 | 42006 | `9.1.3` | Scope of certification | Scope of certification is linked to the statement of applicability and applicable controls. |
| AIMS-IA | 4.7 | 19011 | `A.5` | Verifying information | Verifying information supports distinguishing controlled documents from present ones. |
| AIMS-IA | 4.7 | 19011 | `3.10` | audit evidence records, statements | Audit evidence definition supports the 'documented information and evidence' concept. |
| AIMS-IA | 4.9 | 42001 | `A.2.2` | AI policy | Example Annex A control stated with shall, for the shall/should contrast. |
| AIMS-IA | 4.9 | 42001 | `B.2.2` | AI policy | The matching Annex B restatement written with should, for the shall/should contrast. |
| AIMS-IA | 4.10 | 42006 | `9.1.3` | Scope of certification | Scope of certification interacts with which controls are declared applicable. |
| AIMS-IA | 4.11 | 19011 | `A.8` | Auditing context | Auditing context - guides what an auditor may require as evidence of a contextual determination. |
| AIMS-IA | 5.3 | 19011 | `3.11` | audit finding results of | Definition of audit finding as evaluation of evidence against audit criteria. |
| AIMS-IA | 5.3 | 19011 | `3.8` | audit criteria set of | Definition of audit criteria as the set of requirements against which evidence is compared. |
| AIMS-IA | 5.5 | 19011 | `6.6` | Completing the audit | Completing the audit — retention/disposition and confidentiality of audit documents after reporting. |
| AIMS-IA | 5.6 | 19011 | `5.5.6` | Managing audit programme results | Managing audit programme results, including tracking corrective action follow-up. |
| AIMS-IA | 5.6 | 42006 | `9.6.2.2` | Surveillance audits | Surveillance audits verify effectiveness of corrective action on prior nonconformities in a certification context. |
| AIMS-IA | 5.7 | 19011 | `6.7` | Conducting the audit follow-up | Audit follow-up on corrective actions, feeding trend data into the review. |
| ISMS-F | 1.2 | 27000 | `4.2.3` | Information security | Explains information security concepts underpinning the vocabulary. |
| ISMS-F | 1.4 | 27000 | `5.3.3` | ISO/IEC 27009 | Role of ISO/IEC 27009 (sector-specific application) as a family member. |
| ISMS-F | 2.1 | 27000 | `3.53` | policy intentions and direction | Definition of policy — a component of the management system structure. |
| ISMS-F | 2.1 | 27000 | `3.49` | objective result to be achieved | Definition of objective — a component of the management system structure. |
| ISMS-F | 2.1 | 27000 | `3.54` | process set of interrelated | Definition of process — a component of the management system structure. |
| ISMS-F | 2.1 | 27000 | `3.13` | continual improvement recurring ac | Definition of continual improvement — the improvement element of the model. |
| ISMS-F | 2.2 | 27002 | `0.2` | Information security requirements | Sources of information security requirements, supporting which party needs are security-relevant. |
| ISMS-F | 2.4 | 27000 | `3.51` | outsource make an arrangement | Outsourcing definition bears directly on dependencies that cross the scope boundary. |
| ISMS-F | 2.5 | 27002 | `8.23` | Web filtering | Web filtering guidance addresses browser-reachable external services. |
| ISMS-F | 2.5 | 27000 | `3.27` | information processing facilities  | Definition of information processing facilities, which determines what falls inside a boundary. |
| ISMS-F | 2.9 | 27001 | `0.1` | General | Introduction frames the ISMS as an ongoing, preserved and improved system. |
| ISMS-F | 3.1 | 27000 | `3.70` | risk management process systematic | Risk management process situates assessment among communication, treatment and monitoring. |
| ISMS-F | 3.8 | 27000 | `3.10` | confidentiality property that info | Confidentiality property threatened by context leakage and training-data exposure. |
| ISMS-F | 3.8 | 27002 | `5.19` | Information security in supplier r | Supplier relationship risks relevant to an AI model provider. |
| ISMS-F | 3.8 | 27002 | `8.26` | Application security requirements | Application security requirements - identifying security requirements for a new system type. |
| ISMS-F | 3.11 | 27001 | `9.1` | Monitoring, measurement, analysis  | Monitoring/measurement: whether the method actually evaluates what it claims, not just that it produced a result. |
| ISMS-F | 3.11 | 27000 | `3.57` | residual risk risk (3.61) remainin | Residual risk concept; a clean result misrepresents residual risk when exposures were never identified. |
| ISMS-F | 4.1 | 27002 | `0.3` | Controls | Explains the nature and organization of the control set referenced by Annex A. |
| ISMS-F | 4.3 | 27001 | `A.5.1` | Policies for information secu | Annex A organizational control for policies, mirrors the theme content. |
| ISMS-F | 4.3 | 27001 | `A.5.2` | Information security roles and | Annex A organizational control for roles and responsibilities. |
| ISMS-F | 4.3 | 27001 | `A.5.3` | Segregation of duties | Annex A organizational control for segregation of duties. |
| ISMS-F | 4.3 | 27001 | `A.5.9` | Inventory of information and | Annex A organizational control for asset inventory. |
| ISMS-F | 4.3 | 27001 | `A.5.12` | Classification of information | Annex A organizational control for classification of information. |
| ISMS-F | 4.4 | 27000 | `3.35` | information system set of | Definition of information system supports classifying an AI agent/pipeline as an asset. |
| ISMS-F | 4.5 | 27002 | `8.4` | Access to source code | Access to source code as a restricted-access example of least privilege. |
| ISMS-F | 4.6 | 27002 | `8.18` | Use of privileged utility programs | Privileged utility programs — automated tooling running with elevated authority. |
| ISMS-F | 4.6 | 27001 | `A.8.5` | Secure authentication | Annex A secure authentication control statement. |
| ISMS-F | 4.6 | 27001 | `A.8.15` | Logging | Annex A logging control statement relevant to attribution of recorded activity. |
| ISMS-F | 4.7 | 27000 | `3.51` | outsource make an arrangement | Definition of 'outsource', underpinning why suppliers remain part of the estate. |
| ISMS-F | 4.8 | 27000 | `3.51` | outsource make an arrangement | Definition of outsource — a model provider arrangement remains the organization's responsibility. |
| ISMS-F | 4.8 | 27000 | `3.57` | residual risk risk (3.61) remainin | Residual risk — what remains after assurance that cannot be obtained. |
| ISMS-F | 4.9 | 27001 | `A.6.7` | Remote working | Annex A remote working control within people theme. |
| ISMS-F | 4.9 | 27001 | `A.6.8` | Information security event re | Annex A event reporting control within people theme. |
| ISMS-F | 4.12 | 27002 | `8.10` | Information deletion | Information deletion - technological data protection control interacting with DLP. |
| ISMS-F | 4.12 | 27001 | `A.8.33` | Test information | Annex A test information control. |
| ISMS-F | 4.12 | 27001 | `A.8.11` | Data masking | Annex A data masking control relating to leakage prevention. |
| ISMS-F | 4.13 | 27002 | `8.11` | Data masking | Data masking/redaction as the means by which otherwise-prohibited content can be made permissible. |
| ISMS-F | 5.1 | 27000 | `3.8` | base measure measure (3.42) | Base measure definition, relevant to how indicators are constructed. |
| ISMS-F | 5.1 | 27000 | `3.18` | derived measure measure (3.42) | Derived measure definition, relevant to indicator construction. |
| ISMS-F | 5.2 | 17021-1 | `9.4.5.2` | Identifying and recording audit fi | Classification/recording of findings. |
| ISMS-F | 5.2 | 17021-1 | `9.4.5.3` | Identifying and recording audit fi | Recording of findings including opportunities for improvement. |
| ISMS-F | 5.2 | 17021-1 | `9.2.1.2` | Determining audit objectives, scop | Audit scope determination. |
| ISMS-F | 5.2 | 17021-1 | `10.2.6.2` | Internal audits | Internal audit programme planning. |
| ISMS-F | 5.2 | 17021-1 | `10.2.6.4` | Internal audits | Action on internal audit findings. |
| ISMS-F | 5.3 | 17021-1 | `10.2.5.1` | Management review | Management review timing/interval requirement for a certification body's own management system. |
| ISMS-F | 5.3 | 17021-1 | `10.2.5.2` | Management review | Lists required management review inputs. |
| ISMS-F | 5.3 | 17021-1 | `10.2.5.3` | Management review | Lists required management review outputs/decisions. |
| ISMS-F | 5.4 | 17021-1 | `10.2.7` | Corrective actions | Corrective actions requirement for the certification body's own management system. |
| ISMS-F | 5.7 | 27001 | `A.5.28` | Collection of evidence | Annex A control statement for collection of evidence. |
| ISMS-F | 5.7 | 27001 | `A.6.8` | Information security event re | Annex A control for event reporting, the entry point to the process. |
| ISMS-F | 5.7 | 27001 | `10.2` | Nonconformity and corrective actio | Nonconformity and corrective action — the management-system route for lessons learned after an incident. |
| ISMS-F | 5.8 | 27002 | `8.12` | Data leakage prevention | Data leakage prevention: detection of data movement to AI services that conventional monitoring may miss. |
| ISMS-IA | 1.3 | 19011 | `3.16` | auditor person who conducts | Definition of auditor, supporting the point that independence is a property of the assignment, not a status. |
| ISMS-IA | 1.3 | 27000 | `3.3` | audit systematic, independent and | ISMS-family definition of audit as systematic, independent and documented process. |
| ISMS-IA | 1.5 | 19011 | `3.22` | nonconformity non-fulfilment of a | ISO 19011's nonconformity definition, contrasted with where ISO/IEC 27001's nonconformity is defined. |
| ISMS-IA | 1.5 | 27002 | `0.7` | Related International Standards | Positions ISO/IEC 27002 relative to ISO/IEC 27001 and the rest of the family. |
| ISMS-IA | 2.3 | 19011 | `5.5.1` | General | General provisions for implementing the audit programme within which individual audits are defined. |
| ISMS-IA | 2.4 | 19011 | `5.3` | Determining and evaluating audit p | Audit programme risks and opportunities, which include risks arising from chosen auditing methods. |
| ISMS-IA | 2.5 | 27001 | `9.2.2` | Internal audit programme | Internal audit programme requirement: objectivity and competence of auditors for the ISMS audit. |
| ISMS-IA | 3.5 | 19011 | `3.9` | objective evidence data supporting | Definition of objective evidence, distinguishing evidence from mere assertion/agreement. |
| ISMS-IA | 3.6 | 27002 | `3.1.8` | control measure that maintains and | Definition of control as a measure that maintains and/or modifies risk. |
| ISMS-IA | 3.6 | 27000 | `3.14` | control measure that is modifying  | Definition of control. |
| ISMS-IA | 3.7 | 19011 | `A.1` | Applying auditing methods | Applying auditing methods — which methods are available to an auditor and their limits. |
| ISMS-IA | 3.8 | 19011 | `3.9` | objective evidence data supporting | Objective evidence definition supports what an AI summary does not establish. |
| ISMS-IA | 3.8 | 19011 | `6.4.6` | Reviewing documented information w | Reviewing documented information while conducting the audit — what review the auditor did or did not perform. |
| ISMS-IA | 4.1 | 27000 | `3.38` | internal context internal environm | Definition of internal context supporting clause 4.1 issues. |
| ISMS-IA | 4.1 | 27000 | `3.51` | outsource make an arrangement | Definition of outsource - the undeclared interface case. |
| ISMS-IA | 4.3 | 27000 | `3.49` | objective result to be achieved | Definition of objective, underpinning information security objectives. |
| ISMS-IA | 4.3 | 27000 | `4.5.3` | Assessing information security ris | Explains assessing information security risks — supporting narrative for the 6.1.2 process. |
| ISMS-IA | 4.3 | 27000 | `4.5.4` | Treating information security risk | Explains treating information security risks — supporting narrative for 6.1.3. |
| ISMS-IA | 4.3 | 27000 | `4.5.5` | Selecting and implementing control | Selecting and implementing controls, relevant to how controls are determined rather than picked from a catalogue. |
| ISMS-IA | 4.4 | 27000 | `3.62` | risk acceptance informed decision  | Definition of risk acceptance as an informed decision, supports judging acceptance evidence. |
| ISMS-IA | 4.4 | 27000 | `3.72` | risk treatment process (3.54) | Definition of risk treatment, underpins tracing SoA inclusion/exclusion to a treatment decision. |
| ISMS-IA | 4.4 | 27000 | `4.5.4` | Treating information security risk | Describes treating information security risks, the decisions the SoA must be consistent with. |
| ISMS-IA | 4.6 | 27000 | `3.46` | monitoring determining the status | Definition of monitoring, underpinning the 9.1 measurement arrangements. |
| ISMS-IA | 4.9 | 19011 | `3.27` | effectiveness extent to which | Definition of effectiveness used in judging the control claim. |
| ISMS-IA | 5.2 | 19011 | `A.5` | Verifying information | Verifying information - underpins the rule that absent/unverified evidence cannot found a nonconformity. |
| ISMS-IA | 5.2 | 19011 | `3.21` | conformity fulfilment of a | Definition of conformity, the alternative determination. |
| ISMS-IA | 5.2 | 19011 | `3.8` | audit criteria set of | Audit criteria - the requirement set against which non-fulfilment is judged. |
| ISMS-IA | 5.2 | 27001 | `7.5.1` | General | Establishes what documented information must exist, supporting whether absent evidence should have existed. |
| ISMS-IA | 5.2 | 27000 | `3.56` | requirement need or expectation | Definition of requirement - the thing that must be non-fulfilled for a nonconformity. |
| ISMS-IA | 5.3 | 19011 | `6.5.1` | Preparing the audit report | Report content requirements may constrain how nonconformities are expressed to the recipient. |
| ISMS-IA | 5.6 | 19011 | `3.10` | audit evidence records, statements | Definition of audit evidence, underpinning what counts as sufficient evidence to close a finding. |
| ISMS-IA | 5.6 | 27000 | `3.20` | effectiveness extent to which | Definition of effectiveness used in judging whether corrective action worked. |

---

## Not judged, and not a rejection

- **ISMS-IA task 4.10** -- state `pass2-unanswered`. Nothing was measured, which
  is not a pass and not a flag.
- **AIMS-IA task 4.12** -- state `malformed`. Nothing was measured, which
  is not a pass and not a flag.
- **ISMS-IA task 4.10** -- 12 of 17 picks got no pass-2 verdict (1 chunk(s) unanswered). Its proposals are a FLOOR, not a verdict.

**Addresses the library does not hold**, dropped and never stored: 0 across 0 task(s).
