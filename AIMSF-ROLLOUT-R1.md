# AIMS-F rollout R1

**Nothing is inserted.** Every item below is in an artifact awaiting the director's read.

| | |
|---|---|
| tasks | 21 |
| attempted | 88 |
| survivors | **67** |
| spend | **$30.47** |
| dollars per survivor | **$0.455** |

## Spend by role

At $15 / $75 per million tokens (input / output).

| role | calls | input | output | USD |
|---|---|---|---|---|
| solver | 154 | 809044 | 31399 | $14.49 |
| paraphrase | 43 | 317785 | 44537 | $8.11 |
| options-probe | 83 | 50681 | 25824 | $2.70 |
| writer | 3 | 18297 | 27376 | $2.33 |
| de-cue | 17 | 20880 | 17305 | $1.61 |
| solver-recheck | 14 | 67734 | 2903 | $1.23 |
| **total** | **314** | **1284421** | **149344** | **$30.47** |

## Per task

| task | batch | shortfall | attempted | survived | rejections by gate | key-pick | flag | cue flags | distinct anchors |
|---|---|---|---|---|---|---|---|---|---|
| 1.1 | batch 1 | 0 | 4 | **4** | — | 100% (4/4) | 75% (3/4) | length 2, only-negation 1 | 4 |
| 1.3 | batch 2 | 4 | 4 | **3** | `solver-split` 1 | 67% (2/3) | 67% (2/3) | only-hedged 1, shared-phrase 1 | 3 |
| 1.4 | batch 1 | 0 | 5 | **5** | — | 60% (3/5) | 40% (2/5) | odd-verdict 1, shared-phrase 1 | 5 |
| 1.5 | batch 1 | 1 | 6 | **5** | `modal-fidelity` 1, `reproduction` 1 | 80% (4/5) | 80% (4/5) | odd-verdict 1, length 1, shared-phrase 1, only-hedged 1 | 5 |
| 1.6 | batch 2 | 5 | 5 | **4** | `reproduction` 1 | 100% (4/4) | 100% (4/4) | only-hedged 1, length 1, shared-phrase 1, odd-verdict 1 | 4 |
| 2.3 | batch 2 | 3 | 3 | **3** | — | 33% (1/3) | 33% (1/3) | odd-verdict 1 | 3 |
| 2.5 | batch 2 | 4 | 4 | **2** | `solver` 2 | 0% (0/2) | 0% (0/2) | — | 2 |
| 2.6 | batch 2 | 5 | 5 | **5** | — | 100% (5/5) | 100% (5/5) | shared-phrase 3, only-hedged 1, odd-verdict 1 | 5 |
| 3.3 | batch 2 | 4 | 4 | **4** | — | 75% (3/4) | 75% (3/4) | length 3 | 4 |
| 3.5 | batch 2 | 6 | 6 | **6** | — | 100% (6/6) | 100% (6/6) | odd-verdict 3, shared-phrase 2, only-hedged 1 | 6 |
| 3.6 | batch 2 | 5 | 5 | **5** | — | 80% (4/5) | 80% (4/5) | length 1, shared-phrase 1, odd-verdict 1, only-hedged 1 | 5 |
| 3.7 | batch 2 | 5 | 5 | **4** | `solver-split` 1 | 100% (4/4) | 100% (4/4) | odd-verdict 2, only-hedged 1, shared-phrase 1 | 4 |
| 3.8 | batch 2 | 3 | 3 | **3** | — | 100% (3/3) | 100% (3/3) | odd-verdict 2, shared-phrase 1 | 2 |
| 4.1 | batch 2 | 2 | 2 | **1** | `modal-fidelity` 1, `reproduction` 1 | 0% (0/1) | 0% (0/1) | — | 1 |
| 4.3 | batch 2 | 1 | 1 | **0** | `solver` 1 | — | — | — | 0 |
| 4.4 | batch 2 | 4 | 4 | **1** | `reproduction` 2, `solver-split` 1, `modal-fidelity` 1, `shared-distractor-phrase` 1 | 0% (0/1) | 0% (0/1) | — | 1 |
| 4.5 | batch 2 | 3 | 3 | **0** | `reproduction` 3 | — | — | — | 0 |
| 4.6 | batch 2 | 2 | 2 | **1** | `solver` 1 | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |
| 4.7 | batch 2 | 7 | 7 | **4** | `structure` 2, `shared-distractor-phrase` 1, `solver-split` 1 | 100% (4/4) | 100% (4/4) | odd-verdict 3, shared-phrase 1 | 4 |
| 5.5 | batch 2 | 5 | 5 | **2** | `structure` 1, `reproduction` 1 | 100% (2/2) | 100% (2/2) | shared-phrase 1, odd-verdict 1 | 1 |
| 5.6 | batch 2 | 5 | 5 | **5** | — | 100% (5/5) | 100% (5/5) | odd-verdict 2, length 2, shared-phrase 1 | 5 |

**Rejections across the run:** `reproduction` 9, `solver-split` 4, `solver` 4, `modal-fidelity` 3, `structure` 3, `shared-distractor-phrase` 2

### The options probe, against the authored bank

**These are two measurements and only one of them compares to 98 percent.** The authored bank's
98 percent is a KEY-PICK rate: how often the probe, shown the options alone with no stem, picks the
key. A FLAG is narrower -- it picked the key AND could name the cue it used -- so the flag count is a
subset of the key-pick count by construction. Reading a flag rate against 98 percent would report an
improvement nobody measured.

| | rate | |
|---|---|---|
| **key-pick, these survivors** | **82%** (55/67) | the figure comparable to 98% |
| key-pick, authored bank | 98% | measured in the 480-item audit |
| key-pick, chance | 25% | four options |
| flag (picked the key AND named the cue) | **79%** (53/67) | a SUBSET of key-pick, not comparable to 98% |
| flag, batch 1 | 64% (9/14) | the figure comparable to the flag rate above |

The probe FLAGS and never rejects, and it has no target rate. Per-task rates are in the table above.

`quote-noise`: **0**. That count is what will say later whether
the extraction repair is worth money.

`solver-split`: **4** — items the solver answered two different
ways across two runs with the options shuffled.

## Tasks that hit a stop condition

- **4.3**: fewer than half survived (0 of 1)
- **4.4**: fewer than half survived (1 of 4)
- **4.5**: fewer than half survived (0 of 3)
- **5.5**: fewer than half survived (2 of 5)

---

## Every survivor, in full

### Task 1.1   (4 survivors)

#### `c45a02f1`   anchor `3.4`

> management system set of interrelated or interacting elements of an organization (3.1) to establish policies (3.5) and objectives (3.6), as well as processes (3.8) to achieve those objectives

**Q** In the terminology of the standard, which description corresponds to a management system?

- **A) Linked parts of an organization through which it sets direction and targets and runs the processes for reaching them.  ← key**
- B) Linked activities that consume or convert inputs so as to deliver a result for a given context of use.
- C) The intentions and the direction of an organization as formally expressed by the people at its top level.
- D) A result that an organization intends to achieve, which may be strategic, tactical or operational in nature.

*explanation:* Clause 3.4 defines a management system as the "set of interrelated or interacting elements of an organization (3.1) to establish policies (3.5) and objectives (3.6), as well as processes (3.8) to achieve those objectives". The other options restate the separate definitions of process, policy and objective.

#### `19ce57e0`   anchor `A.1`

> Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).

**Q** How does the annex table of control objectives and controls relate to controls that an organization works out for itself?

- **A) It serves as a reference set, and an organization can instead devise and put in place controls of its own.  ← key**
- B) It forms a fixed baseline that has to be adopted in full, and controls an organization devises itself are not accepted.
- C) It is supplemented by a further annex, and an organization can apply those extra controls alongside the tabled ones.
- D) It states technical build specifications for AI models, and an organization implements them in the form they are written.

*explanation:* Clause A.1 states that "Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3)." The table is a reference, not a fixed technical specification.

*options-only probe FLAG (only-negation):* picked the key from the options alone and named a cue (only-negation): A and B are direct mirror-images of each other (reference set vs. fixed baseline; own controls allowed vs. not accepted), so the answer is almost certainly one of that pair; B is the only o

#### `f1dff639`   anchor `4.4`

> The organization shall establish, implement, maintain, continually improve and document an AI management system, including the processes needed and their interactions, in accordance with the requirements of this document.

**Q** Which obligation does the standard place on an organization with respect to the AI management system itself?

- **A) To set up, operate, sustain, improve and document the system, including its processes and the way they interact.  ← key**
- B) To record the technical design of each deployed model, including its data pipelines and component interfaces.
- C) To secure certification of the system from an accredited body before any AI system is put into operation.
- D) To apply the system where AI forms a core product, given the size and nature of the organization concerned.

*explanation:* Clause 4.4 requires the organization to "establish, implement, maintain, continually improve and document an AI management system, including the processes needed and their interactions, in accordance with the requirements of this document." The obligation is about the management system, not about technical artefacts or certification.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the only option with a five-verb chain ('set up, operate, sustain, improve and document') covering a whole lifecycle, while B, C and D each name a single narrow action; C also contains the ab

#### `342b88d6`   anchor `10.1`

> The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system.

**Q** The standard contains a continual-improvement requirement. What is the object of that improvement?

- **A) The suitability, the adequacy and the effectiveness of the AI management system taken as a whole.  ← key**
- B) The predictive accuracy and the runtime performance of each AI system that the organization operates.
- C) The implementation guidance supplied in the annex for the tabled control objectives and controls.
- D) The intentions and the direction of the organization as these are formally expressed by top management.

*explanation:* Clause 10.1 states: "The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system." The target is the management system, not model performance, annex guidance or the policy alone.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the only option whose scope is the whole system ("taken as a whole") and the only one listing three parallel abstract nouns; B, C and D each restrict themselves to a narrower part (each AI sy

### Task 1.3   (3 survivors)

#### `5f1c8aac`   anchor `A.6.2.8`

> The organization shall determine at which phases of the AI system life cycle, record keeping of event logs should be enabled, but at the minimum when the AI system is in use.

**Q** A recommendation service has gone live and the team is settling how automatic capture of event records will work across the stages of the system's life. Which description matches the Annex A control on event records?

- **A) The organization picks the phases in which records are captured, with capture in place at least while the system is in use.  ← key**
- B) The supervisory authority picks the phases in which records are captured, and the organization then implements that choice.
- C) Records are captured through design and testing, and capture can be dropped once the system passes into live use.
- D) Records are captured while the deployment plan remains current, and are cleared as soon as that plan is superseded.

*explanation:* A.6.2.8 leaves the choice of life-cycle phases for event-log keeping to the organization itself, while fixing the period of live use as the floor below which logging cannot fall. The other options move the decision to an external authority, treat live use as the point where logging stops, or tie retention to a deployment plan.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only option with a hedging floor ('at least while the system is in use'); the other three state a definite cut-off or hand-off, and two of them (C, D) share the same 'capture stops/c

#### `e3185f4a`   anchor `A.6.2.5`

> The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment.

**Q** A model built on premises is to run in a cloud environment for customers. The team writes down how the move will be made and checks that the agreed conditions and sign-offs are in place before access is opened. Which Annex A control is being exercised?

- **A) Deployment, with a written plan and the agreed conditions confirmed before the system goes live.  ← key**
- B) Verification and validation, with the testing measures for the system and the criteria for their use.
- C) Operation and monitoring, with the elements needed for the ongoing running of the system in service.
- D) Technical documentation, with the material each category of interested parties needs, supplied suitably.

*explanation:* A.6.2.5 is the deployment control: it obliges the organization to put a deployment plan in writing and to satisfy itself that the applicable requirements have been met before the system is deployed, which is exactly the activity described. The other options name controls that sit at different points of the life cycle.

#### `65a6b529`   anchor `A.6.2.2`

> for new AI systems or material enhancements to existing systems

**Q** A model that has been in service for two years is about to be substantially reworked. Under the Annex A control on AI system requirements and specification, how does this rework sit?

- **A) Requirements are specified and documented for substantial reworking of a live system as well as for wholly new ones.  ← key**
- B) Requirements are specified and documented for wholly new systems, reworking of a live one falling to operation and monitoring.
- C) Requirements for the rework are specified and documented once the plan for putting it live has been approved.
- D) Requirements for the rework are captured within the recorded design choices as the reworked system is built.

*explanation:* A.6.2.2 reaches beyond first builds: its scope takes in both systems being created from scratch and significant upgrades to systems already in service, so a substantial change to a live model falls within the requirements and specification control.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and B are a near-identical pair differing only in scope, and A is the inclusive 'as well as' version that subsumes the other options' narrower cases.

### Task 1.4   (5 survivors)

#### `b90e65f1`   anchor `9.2.1`

> The organization shall conduct internal audits at planned intervals to provide information on whether the AI management system: a) conforms to: 1) the organization’s own requirements for its AI management system; 2) the requirements of this document; b) is effectively implemented and maintained.

**Q** An organisation already certified to ISO/IEC 27001 is mapping its existing arrangements onto ISO/IEC 42001, whose clauses are numbered the same way. Which description matches what ISO/IEC 42001 places at the clause numbered 9.2.1?

- A) Top management looks over the system periodically to confirm it stays suitable, adequate and effective.
- B) The organisation records the limits and applicability of its system and holds that as documented information.
- **C) Checks made at intervals fixed in advance report on conformity with internal and standard requirements and on effective operation.  ← key**
- D) The organisation keeps raising how suitable, adequate and effective the system is over time.

*explanation:* Clause 9.2.1 is the harmonised internal audit clause: audits at planned intervals give information on conformity with the organisation's own AIMS requirements and with the standard, and on whether the system "is effectively implemented and maintained" (9.2.1). The other options describe management review, scope and continual improvement, which sit at different clause numbers.

#### `90fff510`   anchor `9.3.1`

> Top management shall review the organization’s AI management system, at planned intervals, to ensure its continuing suitability, adequacy and effectiveness.

**Q** ISO/IEC 42001 and ISO/IEC 27001 number their management review provisions identically. What does ISO/IEC 42001 place on top management at 9.3.1?

- **A) Looking over the AI management system at planned intervals so that it goes on being suitable, adequate and effective.  ← key**
- B) Running audits at planned intervals to establish whether the system meets the organisation's own stated requirements.
- C) Setting AI objectives at the functions and levels that matter, keeping them in line with the AI policy.
- D) Seeing to it that the resources the AI management system needs are made available across the organisation.

*explanation:* Clause 9.3.1 assigns the periodic review to top management to ensure "continuing suitability, adequacy and effectiveness" of the AI management system. Auditing (9.2.1), objective setting (6.2) and resourcing (5.1) are separate clauses of the harmonised structure.

#### `ce7cd810`   anchor `10.1`

> The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system.

**Q** Improvement in ISO/IEC 42001 is split between clauses 10.1 and 10.2, following the same pattern as ISO/IEC 27001. Which obligation belongs to 10.1?

- A) Reacting when something fails to conform and weighing whether its causes need to be removed.
- B) Holding evidence about the nature of nonconformities and about what corrective action achieved.
- C) Judging whether corrective action worked and altering the management system where that is needed.
- **D) Improving, on a continuing basis, how suitable, adequate and effective the AI management system is.  ← key**

*explanation:* Clause 10.1 is the short continual improvement clause: the organization "shall continually improve the suitability, adequacy and effectiveness of the AI management system". The other three obligations all come from the nonconformity and corrective action clause, 10.2.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A, B and C all describe steps of the same nonconformity/corrective-action cycle while D is the odd one out and is also the only option that names the domain ('AI management system') explicitl

#### `e11bd9f1`   anchor `4.1`

> The organization shall consider the intended purpose of the AI systems that are developed, provided or used by the organization.

**Q** Clause 4.1 of ISO/IEC 42001 carries the harmonised title also used in ISO 9001 and ISO/IEC 27001. Which requirement is part of the AI standard's version of that clause?

- A) Deciding which of the interested parties' requirements will be handled through the management system.
- **B) Taking account of the purpose for which the organisation's AI systems are meant to be used.  ← key**
- C) Setting out the limits and applicability of the management system and keeping that as documented information.
- D) Establishing and maintaining the management system along with the processes needed and their interactions.

*explanation:* Clause 4.1 adds AI-specific text to the harmonised context clause, including that the organization "shall consider the intended purpose of the AI systems that are developed, provided or used by the organization" (4.1). The other options belong to clauses 4.2, 4.3 and 4.4.

#### `a5eb5694`   anchor `D.1`

> Objectives such as safety, security, privacy and environmental impact should be managed holistically and not separately for AI and the other components of the system.

**Q** The general part of Annex D notes that an AI system is built from AI components together with other technologies. What view does it take of objectives such as safety, security, privacy and environmental impact?

- **A) They are best looked after across the system as a whole rather than handled apart for the AI parts.  ← key**
- B) They are best pursued each in its own separate management system so that AI work stays distinct.
- C) This document addresses them from a technology neutral angle, leaving AI specifics to other standards.
- D) They are dealt with through ISO/IEC 27701, which extends the AI management system to cover privacy.

*explanation:* Annex D.1 advises that such objectives "should be managed holistically and not separately for AI and the other components of the system", which is why integration with other management system standards matters. The annex also states the opposite of option C: other management system standards are the technology neutral ones, while the AI management system adds AI-specific considerations.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and B share the stem "They are best ..." and state directly opposite claims (handled system-wide vs. kept separate), so the key is likely one of that contradictory pair; A is the integrat

### Task 1.5   (5 survivors)

#### `b1831403`   anchor `1`

> This document is intended to help the organization develop, provide or use AI systems responsibly in pursuing its objectives and meet applicable requirements, obligations related to interested parties and expectations from them.

**Q** A board member asks what an implemented and certified AI management system is meant to do for the organization. Which answer best reflects the stated scope of the standard?

- **A) Support it in developing, providing or using AI systems responsibly while meeting requirements that apply to it  ← key**
- B) Certify that the AI products it places on the market satisfy the safety legislation applying to them
- C) Apply to sizeable organizations that build AI systems rather than to those that merely use them
- D) Replace the separate management systems it runs for information security, privacy and quality topics

*explanation:* Clause 1 frames the document as an aid to acting responsibly when an organization builds, supplies or operates AI while pursuing its own objectives and satisfying obligations owed to, and expectations of, interested parties — including a commitment to "meet applicable requirements" (Clause 1). That is a management-system claim, not a declaration that products or the organization are legally compliant.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D each make a narrow/exclusive claim ("certify", "rather than those that merely use them", "replace the separate management systems"), while A is the only broad, non-restrictive opti

#### `cea3b329`   anchor `3.15`

> conformity fulfilment of a requirement (3.14)

**Q** In the terminology of the standard, the word 'conformity' carries which meaning?

- **A) Fulfilment of a requirement  ← key**
- B) Demonstration of compliance with applicable law
- C) Commitment to continual improvement
- D) Successful audit by a certification body

*explanation:* The defined term in 3.15 is 'conformity fulfilment of a requirement (3.14)'. Conformity is therefore about meeting stated requirements, which is a narrower claim than legal compliance.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): Three options name concrete activities/events (demonstration, commitment, audit) while A is a short abstract definition-style phrase, making it the odd one out and the typical keyed definition.

#### `568cbf03`   anchor `4.1`

> policies, guidelines and decisions from regulators that have an impact on the interpretation or enforcement of legal requirements in the development and use of AI systems

**Q** When determining its context, an organization lists issues arising outside the organization. Which of the following is offered in the guidance as an example of such an external issue?

- **A) Decisions and guidance issued by regulators that shape how legal rules are interpreted or enforced  ← key**
- B) Obligations the organization has taken on through contracts agreed with its counterparties and business partners
- C) Purposes for which the organization intends its AI systems to be developed, provided or used
- D) Governance arrangements, objectives, policies and internal procedures adopted by the organization to direct its activities

*explanation:* NOTE 2 to clause 4.1 places regulator-issued policies, guidance and decisions that bear on how legal rules are read or enforced for AI among the external context considerations. The other three options are drawn from the internal context list in the same note: contractual commitments, the AI system's intended purpose, and the organization's governance, objectives, policies and procedures.

#### `a5c4095a`   anchor `4.2`

> which of these requirements will be addressed through the AI management system

**Q** An organization has listed requirements raised by customers, a sector regulator and a trade body. What does clause 4.2 ask it to do next with that list?

- **A) Decide which of the listed requirements the management system itself will address  ← key**
- B) Show that each listed party's requirement has been met before certification proceeds
- C) Ask the certification body to confirm which of the listed parties count as relevant
- D) Record the listed requirements as external issues determined under clause 4.1

*explanation:* Clause 4.2 has the organization identify the interested parties that matter and the requirements they raise, and then settle which of those the AIMS will actually take on. The system therefore covers a selected subset of external expectations, which is why conformity to the standard is a narrower claim than meeting every obligation an organization faces.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B and C both hinge on 'certification'/'certification body' and pair off against each other, and D is the only one citing a specific clause number as a cross-reference, leaving A as the plai

#### `152f5b26`   anchor `5.2`

> includes a commitment to meet applicable requirements

**Q** Top management is drafting the AI policy. Which of the following must the policy contain according to clause 5.2?

- **A) A commitment to meet the requirements that apply to the organization  ← key**
- B) A declaration that the organization's AI systems satisfy applicable AI legislation
- C) A documented plan for telling users about incidents affecting the AI system
- D) A list of the interested parties whose requirements the system will address

*explanation:* Clause 5.2 states that the AI policy 'includes a commitment to meet applicable requirements'. It is a commitment by top management, not an attestation of legal compliance, and the other items belong to different clauses.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B makes an absolute claim (systems 'satisfy' legislation) while A is the hedged, general 'commitment to meet requirements'; C and D name narrow concrete artifacts, so A is the broad catch-all

### Task 1.6   (4 survivors)

#### `6984516f`   anchor `A.1`

> Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).

**Q** An assessor tells a client that certification depends on implementing every control in the reference table in Annex A. How is that position best corrected?

- **A) The table serves as a reference, and an organization can devise and apply controls it designs itself  ← key**
- B) Each tabled control applies, and any omission is recorded within the risk treatment plan instead
- C) Entries in the implementation guidance annex also need inclusion or exclusion reasons recorded
- D) The tabled set covers everything needed, so further controls are drawn from other standards

*explanation:* Clause A.1 presents Table A.1 as a reference set rather than a compulsory checklist: the organization need not adopt every listed control objective and control, and it may instead 'design and implement their own controls' (A.1), working through the risk treatment process in 6.1.3.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B and D make absolute claims ("Each tabled control applies", "covers everything needed") while A is the permissive/flexible option ("serves as a reference", "can devise... itself"), the class

#### `543f45a2`   anchor `6.1.4`

> The AI system impact assessment shall take into account the specific technical and societal context where the AI system is deployed and applicable jurisdictions.

**Q** A development team proposes to discharge the AI system impact assessment requirement by submitting benchmark accuracy figures for the deployed model. What element of the requirement does this fail to reach?

- **A) The setting of deployment, its societal aspects and the jurisdictions that apply  ← key**
- B) The designated management's approval of the residual risks being carried
- C) The comparison of analysis outputs with the criteria set for risk
- D) The release of the assessment findings to the relevant interested parties

*explanation:* Clause 6.1.4 obliges the assessment to account for "the specific technical and societal context" in which the system is put to use, together with the jurisdictions that apply; a benchmark score on its own addresses none of that.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the longest option and the only one listing three coordinated elements, while B, C and D are single tidy noun phrases of the same shape

#### `4504d7d5`   anchor `D.1`

> Objectives such as safety, security, privacy and environmental impact should be managed holistically and not separately for AI and the other components of the system.

**Q** An insurer already runs certified security and quality management systems and asks how the AI management system relates to them for topics such as privacy and safety. What does the informative annex on sector application convey?

- **A) Such aims are better handled across the whole system rather than split into an AI-only track  ← key**
- B) Generic and sector management standards address these aims from an AI-specific standpoint rather than a broader organisational one
- C) AI-specific considerations take priority over the sector standards wherever both apply rather than being reconciled together
- D) The annex fixes the obligations that apply to the sectors it names, including finance and insurance

*explanation:* D.1 advises that aims like safety, privacy, security and environmental effects be handled for the system as a whole rather than on a separate AI track. The annex points towards integration with existing management systems, not a parallel AI-only programme.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options (A, B, C) are built on the same 'X rather than Y' contrast frame, and among those A is the broad/inclusive member (whole system) while B and C assert narrow or reversed priori

#### `fc7327ff`   anchor `6.1.3`

> f) produce a statement of applicability that contains the necessary controls [see b), c) and d)] and provide justification for inclusion and exclusion of controls.

**Q** An organization has selected its risk treatment options and identified the controls it needs. Which output does the risk treatment clause call for in relation to those controls?

- **A) A statement of applicability, with reasons given for controls taken in and left out  ← key**
- B) A management sign-off obtained separately for each individual control before its use
- C) A record showing which implementation guidance entries were used for each control
- D) A confirmation that the whole reference table of controls has been applied

*explanation:* Clause 6.1.3 f) calls for a statement of applicability that sets out the controls deemed necessary and gives reasons for why each one was taken in or left out.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A is the only option that covers both sides (controls included and excluded); B, C and D each assert a single blanket/absolute action ('each individual', 'each control', 'the whole ... table'

### Task 2.3   (3 survivors)

#### `d9807e6f`   anchor `5.1`

> supporting other relevant roles to demonstrate their leadership as it applies to their areas of responsibility.

**Q** Clause 5.1 lists ways in which top management shows leadership and commitment for the AI management system. Which action appears in that list?

- **A) Supporting other role holders to show leadership in their own areas of responsibility.  ← key**
- B) Reporting personally on how well the management system performs to the governing body.
- C) Reviewing the policy at planned intervals to confirm it stays suitable and adequate.
- D) Setting the process criteria used when operational controls are implemented and monitored.

*explanation:* Clause 5.1 closes its list of leadership demonstrations with "supporting other relevant roles to demonstrate their leadership as it applies to their areas of responsibility." The other actions belong to different clauses: performance reporting is a responsibility assigned under 5.3, periodic policy review is control A.2.4, and establishing process criteria sits in 8.1.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B is the only option with an over-specific intensifier ('personally') and D the only one narrowing to 'process criteria'; A is the broadest, hedge-free option and the only one about other peo

#### `e5d83b20`   anchor `6.2`

> when it will be completed;

**Q** When an organization plans how it will achieve its AI objectives, which of the following is one of the things Clause 6.2 says it determines?

- **A) Determining when each planned action will be finished.  ← key**
- B) Determining criteria for the processes to be controlled.
- C) Determining planned intervals for reviewing the policy.
- D) Determining who reports performance to top management.

*explanation:* Clause 6.2 lists what has to be determined when planning to achieve objectives, including "when it will be completed". The other three belong elsewhere: process criteria to 8.1, policy review intervals to A.2.4, and the reporting responsibility to 5.3.

#### `5427a86e`   anchor `8.1`

> The organization shall control planned changes and review the consequences of unintended changes, taking action to mitigate any adverse effects, as necessary.

**Q** A deployment team alters how a live AI system is operated, and some of the alterations produce effects nobody intended. Which requirement covers reviewing those effects and acting on adverse ones?

- **A) Operational planning and control, which addresses effects of changes that were unintended.  ← key**
- B) Planning of changes, which addresses alterations to the management system itself.
- C) AI objectives, which addresses keeping objectives current as conditions shift.
- D) Roles and authorities, which addresses who reports on management system performance.

*explanation:* Clause 8.1 states that the organization "shall control planned changes and review the consequences of unintended changes, taking action to mitigate any adverse effects, as necessary", which is the operational change requirement. Clause 6.3 is about changes to the management system, a different subject.

### Task 2.5   (2 survivors)

#### `3820eaa1`   anchor `C.3.4`

> The quality of data used for ML and the process used to collect data can be sources of risk, as they can impact objectives such as safety and robustness (e.g. due to issues in data quality or data poisoning).

**Q** A medical triage provider retrains its model monthly on feeds supplied by third-party clinics. It has no visibility into how those clinics gather or label records, and one feed shows sudden shifts in label distribution that could indicate deliberate manipulation. Servers are healthy, the deployment pipeline is documented and the automation level is unchanged. Which Annex C risk source should the assessment record?

- **A) Data used for learning, including how it is collected and the possibility of poisoning  ← key**
- B) Level of automation, including the share of triage decisions delegated and the extent of human oversight
- C) Hardware, including component faults and the possibility of models moved between different machines
- D) Life cycle stages, including design weaknesses and flaws in deployment, upkeep or retirement

*explanation:* C.3.4 names both data quality and the collection process as risk sources that can affect objectives such as safety and robustness, citing data poisoning as an example — precisely the uncontrolled third-party feeds and suspicious label shifts described.

#### `2bee95d5`   anchor `C.3.2`

> The inability to provide appropriate information to interested parties can be a source of risk (i.e. in terms of trustworthiness and accountability of the organization).

**Q** An insurer's model declines some applications. Outcome monitoring shows no difference in decline rates across protected groups, and no personal data has left the insurer. However, when consumer advocates ask which factors drove individual outcomes, the team can supply only aggregate accuracy figures. Which Annex C risk source best characterises this situation?

- **A) Being unable to give interested parties suitable information, affecting trust in the organization  ← key**
- B) Applying automated decision-making in a way that treats certain persons or groups unfairly
- C) Misusing or disclosing personal and sensitive data, with harmful effects on data subjects
- D) Shifting who answers for a decision once that decision rests on an AI system

*explanation:* C.3.2 identifies the organization's failure to furnish interested parties with suitable information as itself a risk source, bearing on how trustworthy and accountable the organization appears; the team's inability to explain individual outcomes to advocates is exactly that situation.

### Task 2.6   (5 survivors)

#### `7078680e`   anchor `8.4`

> The organization shall perform AI system impact assessments according to 6.1.4 at planned intervals or when significant changes are proposed to occur.

**Q** A hospital assessed the impacts of its triage support tool before go-live two years ago. The supplier now proposes extending the tool to a new patient population. What does the AIMS require the hospital to do?

- **A) Run a fresh impact assessment for the proposed extension, alongside its scheduled ones.  ← key**
- B) Hold the reassessment until a harm confirms that the identified risk has materialized.
- C) Hold the reassessment until the retention period of the original records has expired.
- D) Rely on the existing assessment, since the defined assessment process is unchanged.

*explanation:* Clause 8.4 sets both triggers: assessments are performed at planned intervals and when significant changes are proposed — "The organization shall perform AI system impact assessments according to 6.1.4 at planned intervals or when significant changes are proposed to occur." A proposed extension to a new patient population is such a change.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B and C are a matched pair both starting 'Hold the reassessment until...' and D is a do-nothing variant, leaving A as the only option proposing a distinct affirmative action.

#### `ca1e9e65`   anchor `A.5.3`

> The organization shall document the results of AI system impact assessments and retain results for a defined period.

**Q** An impact assessment for a recruitment screening tool has just been completed. The project lead asks how the findings should be handled. Which handling satisfies the Annex A control on documentation?

- **A) Record the findings and keep them for a period the organization has set.  ← key**
- B) Record the findings and publish them to every candidate the tool screens.
- C) Fold the findings into the risk register and discard the underlying records.
- D) Keep the findings only for as long as the tool stays in production use.

*explanation:* Control A.5.3 requires both actions: "The organization shall document the results of AI system impact assessments and retain results for a defined period." Documenting alone, or keeping records only while convenient, does not meet it.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B, C and D each carry an absolute/limiting qualifier ("every candidate", "discard the underlying records", "only for as long as"), while A is the sole option with a soft, open-ended qualifier

#### `f300866c`   anchor `A.5.5`

> The organization shall assess and document the potential societal impacts of their AI systems throughout their life cycle.

**Q** A utility deploys a demand-forecasting AI system. The team has documented effects on customers whose bills it influences, but rules environmental load and local employment effects out of scope. How should the scope be judged?

- **A) Broader effects on society are also to be assessed and documented over the system's life.  ← key**
- B) Broader effects belong in the risk analysis step rather than in the impact assessment.
- C) Broader effects need attention only where a discipline-specific assessment is called for.
- D) Broader effects are illustrative material in the guidance rather than something to assess.

*explanation:* Control A.5.5 extends the obligation beyond individuals: "The organization shall assess and document the potential societal impacts of their AI systems throughout their life cycle." Environmental and economic consequences fall squarely within that scope.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): All four begin "Broader effects...", but B, C and D each deny, relocate or restrict the assessment ("rather than", "only where", "rather than something to assess"), while A alone states it st

#### `5e763395`   anchor `A.5.4`

> impacts of AI systems to individuals or groups of individuals throughout the system’s life cycle.

**Q** A bank assessed effects on loan applicants at design sign-off and now treats the obligation as closed, although the model is retrained quarterly and monitored in operation. Which approach matches the control on impacts to individuals and groups?

- **A) Effects on applicants are assessed and recorded across the whole life of the system.  ← key**
- B) Effects on applicants are reassessed at design and again when a regulator asks.
- C) Effects on applicants are covered once the defined process refers to the life cycle.
- D) Effects on applicants are handled by consulting experts whenever concerns are raised.

*explanation:* Control A.5.4 ties the assessment to the whole life cycle, requiring the organization to assess and document "impacts of AI systems to individuals or groups of individuals throughout the system’s life cycle", so a one-off design-stage exercise is insufficient for a model that keeps changing.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options make the assessment contingent on a trigger or condition ('when a regulator asks', 'once the defined process refers', 'whenever concerns are raised'); A is the only unconditio

#### `997dd746`   anchor `3.24`

> formal, documented process by which the impacts on individuals, groups of individuals, or both, and societies are identified, evaluated and addressed by an organization developing, providing or using products or services utilizing artificial intelligence

**Q** A new AIMS team disagrees about what an AI system impact assessment actually is. Which description matches the defined term?

- **A) A formal, recorded process in which impacts on people and societies are found, weighed and dealt with.  ← key**
- B) A documented list of identified risks ranked for treatment by comparison with the organization's stated risk criteria.
- C) A catalogue of societal impact examples compiled and tailored to suit the organization's own operating context.
- D) A safety or privacy review carried out inside the wider risk management activities of the organization.

*explanation:* Clause 3.24 defines the term as a formal, documented process run by an organization that develops, provides or uses AI-based products or services, covering identification, evaluation and addressing of impacts on individuals, groups of individuals and societies. All three of those steps belong to the defined activity, which is what option A captures.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D all anchor themselves to 'the organization' and describe a list/catalogue/review, while A alone is phrased as a formal three-stage process (found, weighed, dealt with) — the odd 

### Task 3.3   (4 survivors)

#### `6bba1dd1`   anchor `8.3`

> The organization shall retain documented information of the results of all AI risk treatments.

**Q** A provider has finished applying the mitigations set out in its treatment plan for a deployed model and has checked whether each mitigation worked as intended. Which records must this activity leave behind?

- **A) Retained records of the outcomes of each risk treatment performed  ← key**
- B) Retained records of the outcomes of each risk assessment performed
- C) A retained record describing the risk assessment process itself
- D) Retained records of the outcomes of each impact assessment performed

*explanation:* Clause 8.3 ties the record to the treatment activity: "The organization shall retain documented information of the results of all AI risk treatments." Carrying out and verifying the plan therefore produces treatment-result records.

#### `cee73aa8`   anchor `10.2`

> Documented information shall be available as evidence of: — the nature of the nonconformities and any subsequent actions taken; — the results of any corrective action.

**Q** A deployment team logs a model fault that breaches an internal acceptance criterion, corrects the fault, determines its causes, implements action and later checks whether that action was effective. Which documented information must the organization have available?

- **A) What the issues were, what followed them, and the corrective action outcomes  ← key**
- B) That the affected procedures were reviewed and approved as suitable and adequate
- C) The outcomes of monitoring and measurement of the management system
- D) That the audit programme was implemented, together with the audit results

*explanation:* Clause 10.2 specifies the evidence produced when a nonconformity is handled: "Documented information shall be available as evidence of: — the nature of the nonconformities and any subsequent actions taken; — the results of any corrective action."

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the only option that enumerates three items ('what..., what..., and the...') and is the longest, most inclusive option; B, C, D each name a single narrow item.

#### `f330c702`   anchor `9.2.2`

> Documented information shall be available as evidence of the implementation of the audit programme(s) and the audit results.

**Q** An organization has completed the internal audits scheduled for the year and has passed the findings to the managers responsible for the areas audited. Which documented information does this activity require to be available?

- A) Evidence of decisions on improvement opportunities and changes to the system
- **B) Evidence that the programme was carried out, plus what the audits found  ← key**
- C) Evidence of the outcomes of the risk assessments the auditors examined
- D) Evidence sufficient for confidence that processes ran as they were planned

*explanation:* Clause 9.2.2 closes with the record requirement for the audit activity: "Documented information shall be available as evidence of the implementation of the audit programme(s) and the audit results."

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): All four begin with "Evidence", but B is the only option that names two things joined by "plus", making it the compound/most inclusive choice while A, C and D each name a single item.

#### `94ea54e5`   anchor `7.2`

> Appropriate documented information shall be available as evidence of competence.

**Q** A data-labelling group whose output affects AI performance receives structured training, after which the organization checks whether the training achieved what was intended. Which documented information must be available as a result?

- A) Appropriate evidence that mentoring and re-assignment options were weighed first
- B) Appropriate evidence of the results of monitoring and measurement activities
- **C) Appropriate evidence showing that these persons are competent  ← key**
- D) Appropriate evidence that the training materials were approved as adequate

*explanation:* Clause 7.2 attaches the record to competence itself: "Appropriate documented information shall be available as evidence of competence." Training and its effectiveness evaluation are the means; the required record evidences competence.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): All four begin 'Appropriate evidence...' but C is the shortest and the only one without an added qualifying detail (mentoring/re-assignment, monitoring and measurement, approval of materials); it 

### Task 3.5   (6 survivors)

#### `c391707b`   anchor `A.10.3`

> The organization shall establish a process to ensure that its usage of services, products or materials provided by suppliers aligns with the organization’s approach to the responsible development and use of AI systems.

**Q** A bank has decided to deploy a credit-scoring model that an outside vendor builds, trains and hosts. Before the contract is signed, what does the AI management system require the bank to have in place in relation to this vendor?

- **A) A defined process so that what the vendor delivers is used in a way that fits the bank's responsible AI stance  ← key**
- B) A signed vendor declaration transferring accountability for outcomes affecting the bank's borrowers, so that the bank's own governance obligations end at the contract
- C) A documented review of the bank's internal and external issues, refreshed and completed for this procurement before any vendor is contacted
- D) An identical monitoring and evaluation schedule applied to this vendor and to every other supplier, set before the contract is signed

*explanation:* Control A.10.3 obliges the organization to establish a process covering how it uses services, products or materials coming from suppliers, so that such usage is consistent with its own responsible approach to developing and using AI systems. A hosted, vendor-built scoring model is exactly such a supplied product, so the bank needs that process in place for it.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B, C and D each carry an absolute/extreme qualifier ('accountability ends at the contract', 'before any vendor is contacted', 'identical ... every other supplier'), while A is the only unqual

#### `b7e1e847`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** A machine vision product is assembled from a dataset bought from a data vendor, a model licensed from a research lab, and integration work performed by a systems integrator, with the manufacturer selling the finished product. How does the AI management system expect responsibility to be handled?

- **A) Life cycle duties are apportioned among the manufacturer, its partners, vendors, customers and other outside parties  ← key**
- B) The integrator, being nearest to deployment, carries the duties for the whole life cycle of the product
- C) The manufacturer carries all duties once the bought-in pieces are combined into its finished product
- D) The data vendor takes the personal data controller role on the basis that it gathered the dataset

*explanation:* Control A.10.2 requires responsibilities across the AI system life cycle to be allocated between the organization and the other parties involved, including suppliers and customers: "The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties." (A.10.2)

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D each assign the whole duty to one single named party, while A is the only option that distributes duties across many parties (and uses the catch-all 'and other outside parties').

#### `181fc068`   anchor `B.10.2`

> The organization should document all parties intervening in the AI system life cycle and their roles and determine their responsibilities.

**Q** An insurer uses an AI claims triage system built from a licensed model, a subcontractor's feature pipeline and its own deployment platform, and the compliance officer is unsure who answers for what. Which step follows the implementation guidance on allocating responsibilities?

- **A) Recording each party taking part across the life cycle, the roles they play, and the responsibilities settled on them  ← key**
- B) Recording only those suppliers holding a direct contractual relationship with the insurer, and leaving the subcontractor's feature pipeline outside the record
- C) Naming the policyholder-facing business unit as the party answerable once the system goes live, with earlier life-cycle roles left unassigned
- D) Assigning the personal data controller role to the model licensor and the processor role to the insurer deploying the system

*explanation:* The implementation guidance in clause B.10.2 advises the organization to write down every party that intervenes across the AI system life cycle together with the role each one plays, and then to work out what each is responsible for. The remaining options narrow the record to contracted parties, move accountability to a single internal unit at deployment, or fix personal data roles from licensing position rather than from actual processing activity and life cycle role.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D each contain an explicit limiting/exclusion clause ('only... leaving outside', 'left unassigned', a narrow role swap), while A alone is the unrestricted inclusive statement cover

#### `bf9c381b`   anchor `A.6.2.7`

> The organization shall determine what AI system techni- cal documentation is needed for each relevant category of interested parties, such as users, partners, supervisory authorities, and provide the technical documentation to them in the appropriate form.

**Q** A device maker embeds a supplier's diagnostic model in a triage product. Clinical users ask how the model behaves at its limits, and a supervisory authority asks for evidence about the product. What does the AI management system require the device maker to do?

- **A) Work out which technical documents each group of interested parties needs and issue them in a suitable form  ← key**
- B) Pass the supplier's documentation package on unchanged to whoever submits a request and treat that as sufficient
- C) Hold the documentation internally and release it to interested parties once the authority issues a formal demand
- D) Arrange for the supplier to send documentation straight to the authority on the maker's behalf instead

*explanation:* Control A.6.2.7 places the decision with the organization: it identifies the technical documentation each relevant category of interested party needs, including users and supervisory authorities, and supplies it in a form suited to that audience. Receiving documentation from a supplier does not discharge this duty.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D each end with a qualifying/deflecting clause ('and treat that as sufficient', 'once the authority issues a formal demand', '...on the maker's behalf instead') that hands the task t

#### `8a14d132`   anchor `8.1`

> The organization shall ensure that externally provided processes, products or services that are relevant to the AI management system are controlled.

**Q** A retailer's recommendation feature calls an external provider's hosted inference service, and that service is relevant to the retailer's AI management system. What does the standard require of the retailer for this arrangement?

- **A) Keeping the externally provided service under control as part of operating the management system  ← key**
- B) Treating the hosted service as outside the management system since the provider operates it
- C) Reviewing the provider's control effectiveness at the annual management review only
- D) Setting criteria for in-house processes and accepting the provider's certificate for the hosted one

*explanation:* Clause 8.1 obliges the organization to keep any outsourced process, product or service that bears on its AI management system under control. The fact that an outside provider hosts and runs the inference service does not move it beyond the scope of that obligation, so the retailer has to exercise control over it.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options describe limiting or excluding the provider's service (outside the system, annual review 'only', accept certificate), while A alone keeps it under control — the odd verdict out.

#### `5477784a`   anchor `A.7.3`

> The organization shall determine and document details about the acquisition and selection of the data used in AI systems.

**Q** A team licenses a labelled image dataset from a data broker to train a quality-inspection model. Which action satisfies the AI management system requirement covering this dependency?

- **A) Establishing and writing down the particulars of how this data was obtained and chosen for use  ← key**
- B) Filing the broker's licence agreement as the record covering where the data came from
- C) Recording the respective roles of the broker and the team in place of data sourcing particulars
- D) Capturing the sourcing particulars during post-deployment monitoring rather than at selection time

*explanation:* Control A.7.3 requires the organization to determine and document details of how data used in AI systems was acquired and selected: "The organization shall determine and document details about the acquisition and selection of the data used in AI systems." (A.7.3)

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D each contain a substitution or deferral clause ('as the record covering', 'in place of', 'rather than at selection time'); A is the only option stated plainly without swapping so

### Task 3.6   (5 survivors)

#### `5f6165f3`   anchor `B.7.5`

> According to ISO 8000-2, a record of data provenance can include information about the creation, update, transcription, abstraction, validation and transferring of the control of data.

**Q** A project team assembles a historical record for a dataset it will reuse. According to the guidance on provenance, such a record can include which of the following?

- **A) The dataset's creation, later updates, validation and handover of control  ← key**
- B) The dataset's distribution, median values and standard deviation figures
- C) The demographics of the data subjects and possible bias among them
- D) The volume of data needed and the categories required for the task

*explanation:* The implementation guidance in B.7.5 indicates that a provenance record can cover how data were created, updated, transcribed, abstracted, validated and passed from one party's control to another. The other options describe statistical exploration performed during preparation and acquisition details, not the content of a provenance record.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the longest option and the only one listing four coordinated items (creation, updates, validation, handover) rather than two or three

#### `928bf15e`   anchor `B.7.6`

> Failure to properly prepare the data can potentially lead to AI system errors.

**Q** An engineer asks why the criteria and methods for getting raw data into a usable state are written down for each AI task. Which reason does the guidance give?

- **A) Data that are poorly prepared can give rise to errors in the AI system  ← key**
- B) Records of data preparation can establish the organization's legal rights to use the source material
- C) Preparation records can mark the point at which control of the data changed hands between parties
- D) Preparation records demonstrate that the training data match the domain in which the system operates

*explanation:* The implementation guidance in B.7.6 identifies inadequate preparation of data as something that can result in faults in the behaviour of the AI system, which is why the selection criteria and the methods applied are documented for each task. Rights, transfer of control and representativeness are addressed by acquisition, provenance and data management guidance respectively.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D are parallel constructions all built on 'preparation records ...' while A alone drops that phrase and is phrased as a general claim about data quality.

#### `ae96a44b`   anchor `A.7.4`

> The organization shall define and document requirements for data quality and ensure that data used to develop and operate the AI system meet those requirements.

**Q** An organization is implementing the Annex A control covering the quality of data for AI systems. What does that control oblige it to do?

- **A) Set out documented quality requirements and see that the data used to build and run the system meet them  ← key**
- B) Derive acceptable quality levels from the data preparation methods selected for each AI task and apply them at training time
- C) Note the quality of the data among the documented information kept about the data resources identified for the system
- D) Establish quality by keeping a record of where each dataset came from and how it was changed over time

*explanation:* Control A.7.4 places two obligations on the organization: to define and record what it expects of data quality, and to make sure the data used in developing and operating the AI system actually satisfy those documented expectations. The other options describe preparation criteria (A.7.6), resource documentation (A.4.3) and provenance recording (A.7.5), which are separate controls.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D each name a narrow mechanism (derive from preparation methods / note in documentation / record provenance), while A is the only option stating the general two-part obligation — set

#### `ad81107c`   anchor `B.7.4`

> The organization should consider the impact of bias on system performance and system fairness and make such adjustments as necessary to the model and data used to improve performance and fairness so they are acceptable for the use case.

**Q** Guidance on the quality of data for AI systems addresses bias. What does it say the organization should do about it?

- **A) Weigh how bias affects system performance and fairness, changing model and data as needed for the use case  ← key**
- B) Check the origin of any dataset in which bias among the entries is suspected before that data is used
- C) Convert categorical variables into numeric form so that biased entries are treated consistently by the model
- D) Capture potential biases among data subjects when details of sources and selection are written down

*explanation:* Clause B.7.4 advises weighing how bias affects the performance and the fairness of the system, and adjusting the model and the data as needed so that both are acceptable for the use case. The other options belong to provenance verification, preparation transformations and acquisition details.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only option phrased as a general balancing judgement ('weigh... changing... as needed for the use case'), while B, C and D each name one narrow mechanical step.

#### `cc09eb82`   anchor `A.7.3`

> The organization shall determine and document details about the acquisition and selection of the data used in AI systems.

**Q** Which obligation does the Annex A control on acquisition of data place on an organization using data in an AI system?

- **A) Working out and writing down the particulars of how the data were obtained and chosen  ← key**
- B) Maintaining a process that traces the origin of data across the system's life cycle
- C) Fixing the criteria by which methods for making data usable are chosen
- D) Stating the requirements that data have to satisfy before they are used

*explanation:* Clause A.7.3 obliges the organization to establish and record the particulars of how the data used in its AI systems were obtained and selected. The other options restate the provenance (A.7.5), preparation (A.7.6) and quality (A.7.4) controls of Annex A.7.

### Task 3.7   (4 survivors)

#### `43fd7c8e`   anchor `7.5.3`

> Documented information of external origin determined by the organization to be necessary for the planning and operation of the AI management system shall be identified as appropriate and controlled.

**Q** An organization intends to extend its existing ISMS document-control procedure (version control, retention schedules, access rules) to AI management system documents. It also relies heavily on supplier-issued model cards and dataset descriptions. Which conclusion about the extension is correct?

- A) Documents obtained from suppliers are to be reissued under the organization's own identification and approval.
- **B) Material of external origin judged necessary for planning and operation is identified and brought under control.  ← key**
- C) Supplier-issued documentation sits outside the document-control arrangements and is handled through supplier agreements.
- D) Permission to view documented information is to be held separately from permission to change it.

*explanation:* Clause 7.5.3 extends control explicitly to outside material: "Documented information of external origin determined by the organization to be necessary for the planning and operation of the AI management system shall be identified as appropriate and controlled." The existing machinery carries over, but its coverage has to be re-examined against what it now governs.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A and C make absolute claims about supplier documents (must be 'reissued under the organization's own identification'; 'sits outside the document-control arrangements'), and D shifts to a dif

#### `0b946efa`   anchor `8.1`

> The organization shall implement the controls determined according to 6.1.3 that are related to the operation of the AI management system (e.g. AI system development and usage life cycle related controls).

**Q** A team wants to reuse its ISMS operational-control framework — documented process criteria, change control and oversight of outsourced services — for AI operation. Which element does Clause 8.1 add that the reused framework would not already deliver?

- A) Impact assessments repeated at planned intervals as the element of operational planning that Clause 8.1 contributes.
- B) Annex A supplying implementation guidance for operation while Annex B lists the reference controls the framework omits.
- **C) Controls settled during risk treatment that bear on the AI system life cycle being put into operation.  ← key**
- D) Outsourced processes relevant to the AI system documented for reference by the operator rather than controlled during operation.

*explanation:* Clause 8.1 requires the organization to put into effect the controls arrived at through AI risk treatment under 6.1.3 where they bear on operating the management system, giving as its example "AI system development and usage life cycle related controls". The framework carries over in form, but the controls it now has to operate come from AI risk treatment.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A, B and D each carry an extra contrastive or restrictive twist ('while Annex B lists... the framework omits', 'rather than controlled', 'repeated at planned intervals'), whereas C is the onl

#### `82147973`   anchor `D.2`

> In this case, the way to implement controls which (partly) relate to information security in this document (see B.6.1.2) can be integrated with the organization’s implementation of ISO/IEC 27001.

**Q** An organization holding ISO/IEC 27001 certification asks how its existing security arrangements relate to those AI management system controls that touch information security. Which reading of Annex D is accurate?

- **A) Controls that partly relate to information security can be implemented through the existing ISO/IEC 27001 arrangements.  ← key**
- B) Privacy-related objectives and controls can be integrated through the organization's ISO 9001 arrangements.
- C) Conformity to ISO/IEC 27001 is settled first, and the AI management system is then built upon it.
- D) Security-related controls fall outside the AI management system wherever a certified ISMS is in place.

*explanation:* Annex D.2 says of an organization with an ISMS: "In this case, the way to implement controls which (partly) relate to information security in this document (see B.6.1.2) can be integrated with the organization’s implementation of ISO/IEC 27001." This is permission to integrate the implementation, not permission to drop the controls or to assume coverage.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only moderately hedged option ("partly relate", "can be implemented through existing"), while C and D state absolutes ("settled first", "fall outside ... wherever") and B swaps in a 

#### `3d1d332c`   anchor `7.4`

> The organization shall determine the internal and external communications relevant to the AI management system including: — what it will communicate; — when to communicate; — with whom to communicate; — how to communicate.

**Q** An auditor reviews an inherited ISMS communication plan that is to serve the AI management system, and checks it against the determinations clause 7.4 sets out. Which set of determinations matches that clause?

- A) The AI policy, individual contributions to effectiveness, and implications of nonconformity.
- B) The message, the timing, the audience, and the retention and disposal arrangements.
- **C) The message, the timing, the audience, and the method of communication.  ← key**
- D) The message, the timing, the audience, and the person designated to communicate.

*explanation:* Clause 7.4 sets out four determinations for communications relevant to the AI management system: "— what it will communicate; — when to communicate; — with whom to communicate; — how to communicate." A plan carried over from an ISMS should be checked against exactly this set.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options share the identical stem 'The message, the timing, the audience, and...'; A breaks the pattern entirely, and of the remaining three B's ending ('retention and disposal arrange

### Task 3.8   (3 survivors)

#### `954dccdb`   anchor `8.4`

> The organization shall perform AI system impact assessments according to 6.1.4 at planned intervals or when significant changes are proposed to occur.

**Q** A product team formally proposes a significant change to how a deployed AI system will be used, extending it to a new jurisdiction and user population. The change has not yet been made. Under the clause 8 operational requirements, what does the organization do about the potential consequences for individuals and societies?

- **A) Carry out an impact assessment now under the organization's defined process, and keep its result as documented information.  ← key**
- B) Record the proposal as a planned change and leave the assessment to the next scheduled assessment cycle.
- C) Assess the impact after go-live, once actual consequences for the new user population can be observed.
- D) Circulate the assessment result to relevant interested parties and obtain their agreement before proceeding.

*explanation:* Clause 8.4 sets two triggers for an AI system impact assessment: the planned schedule, or a significant change that is "proposed to occur". The formal proposal is itself the trigger, so the assessment is run under the 6.1.4 process at that point, and clause 8.4 also requires the results of all such assessments to be kept as documented information.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B and C both defer the assessment to a later time and D presupposes an assessment already exists, so A is the only option that actually performs the assessment now and is the odd one out.

#### `43c70bbc`   anchor `8.4`

> The organization shall retain documented information of the results of all AI system impact assessments.

**Q** Over one year an organization completed eleven AI system impact assessments: some at its scheduled cycle, others prompted by proposed changes. During an internal audit, the auditor asks what evidence of these activities is kept. Which statement reflects the clause 8 retention obligation?

- A) Documentation of the defined assessment process is kept, with individual outputs summarized inside the treatment plan.
- **B) Documentation giving the outcome of each of the eleven assessments performed is kept as documented information.  ← key**
- C) Documentation about the risk treatment process is kept and serves in place of the separate assessment outputs.
- D) Documentation is kept for the discipline-specific safety and privacy assessments performed in critical contexts.

*explanation:* Clause 8.4 obliges the organization to keep documented information covering the outcomes of every impact assessment it carries out, whether the trigger was the planned schedule or a proposed change. The evidence expected by the auditor is therefore the recorded outcome of each of the eleven assessments, not process-level or treatment records.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and C are near-paraphrases of each other (process documentation standing in for / summarizing the individual outputs) and D adds a narrowing qualifier ('discipline-specific ... critical c

#### `7ded0bbf`   anchor `8.1`

> The organization shall control planned changes and review the consequences of unintended changes, taking action to mitigate any adverse effects, as necessary.

**Q** A configuration drift in a deployed AI system is discovered after the fact: nobody authorized it and it altered model behaviour in production. Applying the clause 8 operational planning and control requirements, what is the organization's obligation regarding this change itself?

- A) Handle it as an externally provided service and confirm that the supplier's own controls remain in force.
- B) Secure management approval for acceptance of the residual risk before the system is returned to service.
- **C) Examine what the unintended change has brought about and act to mitigate adverse effects where needed.  ← key**
- D) Note the drift and address it through the impact assessment due at the next planned interval.

*explanation:* Clause 8.1 places two change-related duties on the organization: planned changes are to be controlled, and for changes that were not intended the organization looks at what followed from them and takes mitigating action where adverse effects arise. An unauthorized production change falls in the second category, so its consequences have to be reviewed and any harm addressed.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options attach an external condition or delay (supplier's controls, prior management approval, next planned interval) while C alone states immediate unconditional action, making it the 

### Task 4.1   (1 survivor)

#### `c590b702`   anchor `A.6.2`

> The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment.

**Q** An organization is drafting a step that calls for a documented rollout plan and confirmation that the necessary conditions are satisfied before a model is put into production. Which Annex A category covers this concern?

- **A) A.6, covering management guidance and the stages of the AI system life cycle  ← key**
- B) A.4, covering data, tooling and human resources accounted for across the AI system activities
- C) A.9, covering responsible use of AI systems and the objectives set within the organization
- D) A.10, covering relationships with third parties, suppliers and customers and the allocation of responsibilities

*explanation:* The deployment control sits in A.6.2 on the AI system life cycle, where control A.6.2.5 calls for a documented deployment plan together with assurance that the applicable requirements are satisfied before the system goes live.

### Task 4.4   (1 survivor)

#### `b2488074`   anchor `A.6.2.5`

> The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment.

**Q** A development team moved a recommendation model from a laboratory environment straight into a cloud production environment over a weekend. No one had agreed what performance thresholds, user testing or management sign-offs had to be satisfied first, and the environment differences were never considered. Which Annex A control area addresses this failure most directly?

- A) Documented specification of what a new or materially enhanced system is meant to achieve
- **B) A documented deployment plan, with the applicable requirements satisfied before go-live  ← key**
- C) Defined elements for running the system once live, including repairs, updates and support
- D) Documented design and development choices anchored in organizational objectives and specification criteria

*explanation:* Clause A.6.2.5 is the deployment control: it obliges the organization to write down a deployment plan and to confirm that the relevant conditions have been satisfied before the system goes into production. The missing release conditions and environment considerations belong there.

### Task 4.6   (1 survivor)

#### `f668fe70`   anchor `6.1.3`

> f) produce a statement of applicability that contains the necessary controls [see b), c) and d)] and provide justification for inclusion and exclusion of controls.

**Q** A research institute uses AI systems only for internal analysis and supplies no AI product or service to any customer. Its AI risk assessment concludes that the control on customer expectations and needs is not necessary. Which handling of that conclusion fits the AI risk treatment process?

- **A) Recording the control as excluded in the statement of applicability, with the risk assessment given as justification.  ← key**
- B) Omitting the control from the statement of applicability, which carries only the controls being implemented.
- C) Noting the omission in the AI risk treatment plan put to management for approval, rather than in the statement of applicability.
- D) Recording exclusion of both the control and its Annex B implementation guidance in the statement of applicability.

*explanation:* Clause 6.1.3 f) requires the statement of applicability to carry the necessary controls and 'provide justification for inclusion and exclusion of controls', and the same clause notes that a control not deemed necessary by the risk assessment is an acceptable basis for exclusion. Silent omission, relocation to the treatment plan, or justifying implementation guidance are all mismatches with that clause.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and D are near-duplicates (both 'recording exclusion ... in the statement of applicability'), with D merely adding an extra element (Annex B guidance); the plainer member of such a pair i

### Task 4.7   (4 survivors)

#### `14d61619`   anchor `C.2.10`

> In the context of AI and in particular with regard to AI systems based on ML approaches, new security issues should be considered beyond classical information and system security concerns.

**Q** A reviewer checks the security analysis for a machine learning based recommender and finds that the threat catalogue used is the one maintained for conventional systems. How does the Annex C material on security bear on this?

- **A) Issues arising from the machine learning approach are worth examining in addition to the familiar information and system security ones.  ← key**
- B) Familiar information and system security concerns mark the appropriate limit of the analysis for a machine learning based system.
- C) Security for the machine learning parts should be run as a programme kept apart from that of the surrounding components.
- D) Security issues peculiar to machine learning are required to be documented as controls established outside Annex A.

*explanation:* Clause C.2.10 states that for systems based on ML approaches "new security issues should be considered beyond classical information and system security concerns", so an unchanged conventional catalogue is not a complete analysis.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and B share the phrase 'familiar information and system security' as a mirrored pair, and A is the inclusive 'in addition to' version while B ('marks the appropriate limit'), C ('kept apa

#### `202e9d93`   anchor `D.1`

> Objectives such as safety, security, privacy and environmental impact should be managed holistically and not separately for AI and the other components of the system.

**Q** A manufacturer governs privacy and safety objectives for the AI components in one register and the same objectives for the surrounding non-AI components in a second, unconnected register. How does the general material in Annex D bear on this arrangement?

- **A) It cuts against the guidance, which favours handling such objectives across the system taken as a whole.  ← key**
- B) It fits the guidance, because AI-specific considerations are the only ones an AI management system deals with.
- C) It fits the guidance, because information security and privacy fall outside the reach of an AI management system.
- D) It is purely a matter of preference, because joint use with other management system standards is offered as an illustration.

*explanation:* Annex D.1 advises that "Objectives such as safety, security, privacy and environmental impact should be managed holistically and not separately for AI and the other components of the system.", which two unconnected registers do not achieve.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B and C are absolutes ('the only ones', 'fall outside the reach') and D dismisses the issue as 'purely a matter of preference'; A is the only verdict left without an overreaching qualifier.

#### `984044c0`   anchor `A.2.3`

> Alignment with other organizaThe organization shall determine where other policies can tional policies be affected by or apply to, the organization’s objectives with respect to AI systems.

**Q** An organization holds an information security policy and a records retention policy that predate its AI work. Which action does the Annex A control on alignment with other organizational policies call for?

- **A) Working out which of those existing policies bear on, or are touched by, the aims set for its AI systems.  ← key**
- B) Combining the information security policy and the records retention policy into one consolidated document, which then governs the AI management system.
- C) Giving the AI policy precedence over the security and retention policies wherever an existing policy already addresses the same topic.
- D) Rewriting the information security policy so that it cites each of the controls selected from Annex A for the AI system.

*explanation:* Control A.2.3 calls for the organization to identify which of its other policies interact with, or govern, what it aims to achieve with its AI systems — an analysis of interaction, not a consolidation, ranking or rewriting exercise.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D each name the specific existing policies (information security / records retention) and prescribe a drastic action on them (merge, override, rewrite); A is the only generic, non-de

#### `8e6f6132`   anchor `6.1.3`

> Justification for exclusion can include where the controls are not deemed necessary by the risk assessment and where they are not required by (or are subject to exceptions under) applicable external requirements.

**Q** A team proposes to mark an Annex A control as excluded on the ground that its information security management system already delivers most of what the control asks for. Which analysis is correct?

- **A) Where the assessment finds the control necessary, it is listed among the necessary ones and the security work can count as its implementation.  ← key**
- B) Where a comparable measure is already operated under another management system, the control is warranted for exclusion and that existing measure stands in its place.
- C) Where the Annex A entries are read as reference controls rather than obligations, the control may be dropped and no justification for the omission is required.
- D) Where the statement of applicability sets out the measures actually in use, the control is left off that document and the management system remains conformant.

*explanation:* Clause 6.1.3 f) ties exclusion to the control not being deemed necessary by the risk assessment or not being required by external requirements; coverage by another management system is a route to implementation (Annex D.2), so the control remains a necessary, included control.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D all conclude the control is excluded/dropped/left off, while A alone concludes it is included — the odd verdict out.

### Task 5.5   (2 survivors)

#### `43882b06`   anchor `3.4`

> management system set of interrelated or interacting elements of an organization (3.1) to establish policies (3.5) and objectives (3.6), as well as processes (3.8) to achieve those objectives

**Q** In the vocabulary of ISO/IEC 42001, an AI management system is best described as which of the following?

- **A) A connected set of parts of the organization through which policy and objectives are set, together with the processes for meeting them.  ← key**
- B) A certificate issued after a two-stage initial audit and kept alive by periodic surveillance visits to the organization.
- C) The package of competence, impartiality and audit-time rules applied to a body that audits and certifies organizations.
- D) A formal grant of recognition given to an auditing body by a national accreditation authority after assessment.

*explanation:* Clause 3.4 defines the term as "interrelated or interacting elements of an organization" that serve to set its policy and objectives and to run the processes by which those objectives are met. Certificates and audit cycles, rules addressed to certification bodies, and grants of accreditation belong to other documents and are not part of this defined term.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D all describe an external certification/accreditation artefact or body (certificate, certifying body, accreditation authority); A is the only option defining something internal to

#### `adae4c57`   anchor `3.4`

> Note 1 to entry: A management system can address a single discipline or several disciplines.

**Q** A colleague asks whether one management system can cover more than AI. What does the note attached to the defined term indicate?

- **A) It can deal with a single discipline or with several disciplines at once.  ← key**
- B) It is confined to AI subject matter, with other disciplines run as separate systems.
- C) Its disciplinary coverage is fixed by the body that audits and certifies the system.
- D) Its coverage can be widened beyond AI once an accreditation body approves the change.

*explanation:* Note 1 to entry in 3.4 indicates that a management system may cover just one discipline or several at the same time. Nothing in the definition hands that decision to an auditing or accreditation body, and nothing confines the system to a single subject area.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options (B, C, D) all restrict scope via AI-only confinement or an external certifying/accreditation body; A is the only option with no external constraint and phrased as an inclusive '

### Task 5.6   (5 survivors)

#### `9b40bd29`   anchor `3.18`

> An audit can be an internal audit (first party) or an external audit (second party or third party), and it can be a combined audit (combining two or more disciplines).

**Q** A provider runs a single internal audit engagement over both its information security arrangements and its AI management arrangements, using one team, one plan and one report. Judged against how this document defines an audit, how is this engagement best characterised?

- **A) It sits within the defined term, which contemplates one audit spanning more than one discipline.  ← key**
- B) It is outside the defined term, as disciplines may be merged only in certification audits by an external body.
- C) It is outside the defined term, as an internal audit has to be carried out by a party outside the organisation.
- D) It sits within the defined term, and the terms clause of this document supplies the criteria and evidence definitions.

*explanation:* Note 1 to the definition of audit in 3.18 recognises that an audit may be combined, that is, may cover two or more disciplines at once, so a single engagement over security and AI arrangements falls within the defined term. The other options misstate who may conduct an internal audit and where the audit evidence and audit criteria terms are defined.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B and C share the frame "It is outside the defined term, as..." plus absolute qualifiers ("only", "has to"), so they pair off as distractors; of the remaining two, D tacks on a second unrel

#### `d9999f3a`   anchor `7.2`

> The organization shall: — determine the necessary competence of person(s) doing work under its control that affects its AI performance; — ensure that these persons are competent on the basis of appropriate education, training or experience;

**Q** Inside an integrated programme, an internal auditor who holds an information security auditing certificate is scheduled to audit the AI management system. Considering competence, what does the organisation need in place for this assignment?

- **A) Its own determination of the competence needed for work affecting AI performance, with records showing the auditor has it  ← key**
- B) Acceptance of the security auditing certificate as the evidence of competence for the AI audit work
- C) A competence specification issued by the certification body, which the organisation then applies to its auditors
- D) Confirmation drawn from the first AI audit's outcome, with the competence record raised once that audit closes

*explanation:* Clause 7.2 places the determination of necessary competence for work affecting AI performance on the organisation and requires that "Appropriate documented information shall be available as evidence of competence." A qualification in another discipline is not in itself that determination, the specification is not set by an external body, and the evidence is not generated retrospectively by the audit result.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options pin the evidence to something external or later (a certificate, a certification body's specification, the first audit's outcome); A is the only one that is self-contained ('its 

#### `f4f9c689`   anchor `9.3.2`

> d) information on the AI management system performance, including trends in: 1) nonconformities and corrective actions; 2) monitoring and measurement results; 3) audit results;

**Q** One top-management review meeting serves both management systems. The agenda and minutes record security metrics, security audit findings, open actions from the last meeting, changes in issues and interested-party needs, improvement ideas, and a business update. For AI management purposes, what is the shortfall in this shared record?

- **A) Trends in the AI system's nonconformities, monitoring results and audit outcomes were not among the matters reviewed  ← key**
- B) The outcomes of the AI risk assessments were not tabled, these being a listed input to the review
- C) Nothing is missing, as a shared review cycle covering both systems satisfies the input list for each of them
- D) The decisions reached have to be recorded in a document dedicated to the AI management system alone

*explanation:* Clause 9.3.2 lists "information on the AI management system performance, including trends in: 1) nonconformities and corrective actions; 2) monitoring and measurement results; 3) audit results" as required inputs; security-discipline performance data does not cover them. Risk assessment results are not in the 9.3.2 input list, a shared cycle does not cure a missing input, and 9.3.3 calls for documented information of results without prescribing a separate document per system.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A and B form a matched pair both naming an omitted review input, and A is the longest/most detailed of the four (it lists three items rather than one)

#### `97cb2958`   anchor `10.2`

> Documented information shall be available as evidence of: — the nature of the nonconformities and any subsequent actions taken; — the results of any corrective action.

**Q** A single corrective-action register serves both systems. An entry about an AI system records what went wrong, the immediate fix applied, the cause identified and the action implemented, and is then marked closed. For the AI management system, what else does the register entry need to carry?

- **A) The outcome of the corrective action taken, alongside the nature of the issue and the actions applied  ← key**
- B) A cross-reference to a parallel entry kept in a register maintained for the other management system
- C) A note that dealing with the consequences and correcting the issue is sufficient to close the entry
- D) Cause analysis flagged as applicable, given that the finding came from an internal rather than external source

*explanation:* Clause 10.2 calls for retained records showing what the nonconformity was and what was done about it, and additionally evidence of "the results of any corrective action", so closing the entry without recording the outcome of the action leaves the record incomplete. No parallel register is called for, immediate correction alone does not discharge the cause evaluation, and the cause evaluation is not conditioned on the source of the finding.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A is the only option that aggregates several items ('outcome... alongside the nature... and the actions'), while B, C and D each state a single narrow or conditional claim ('sufficient to clo

#### `75cdb83e`   anchor `9.2.2`

> a) define the audit objectives, criteria and scope for each audit;

**Q** An integrated audit programme document covers both systems and names frequency, methods, responsibilities and reporting arrangements for the year. An assessor asks how the AI management system is served by this single programme. Which feature of the programme answers that question?

- **A) Each scheduled audit carries its own stated objectives, criteria and scope, making the AI-related criteria explicit  ← key**
- B) Every clause of the AI management system is scheduled for coverage within each cycle of the programme
- C) The intervals and methods in the programme are fixed by the certification body that assesses both systems
- D) Findings from the programme are escalated to top management rather than to the managers concerned

*explanation:* Clause 9.2.2 requires the organisation to "define the audit objectives, criteria and scope for each audit", which is what lets a shared programme demonstrate that the AI management system was actually audited. Programme establishment considers the importance of processes and previous results rather than exhaustive clause coverage, the organisation plans the programme itself, and results are reported to relevant managers.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the longest option and the only one without an extreme/contrastive marker — B says 'Every clause ... each cycle', C says intervals are 'fixed by' an outside body, D uses 'rather than' — leavi

