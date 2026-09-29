# AIMS-F rollout R1

**Nothing is inserted.** Every item below is in an artifact awaiting the director's read.

| | |
|---|---|
| tasks | 3 |
| attempted | 15 |
| survivors | **14** |
| spend | **$6.41** |
| dollars per survivor | **$0.458** |

## Spend by role

At $15 / $75 per million tokens (input / output).

| role | calls | input | output | USD |
|---|---|---|---|---|
| solver | 28 | 147688 | 3817 | $2.50 |
| writer | 3 | 18297 | 27376 | $2.33 |
| options-probe | 16 | 9734 | 5738 | $0.58 |
| paraphrase | 3 | 21611 | 3314 | $0.57 |
| de-cue | 3 | 3676 | 3124 | $0.29 |
| solver-recheck | 2 | 8027 | 300 | $0.14 |
| **total** | **55** | **209033** | **43669** | **$6.41** |

## Per task

| task | batch | shortfall | attempted | survived | rejections by gate | cue flags | distinct anchors |
|---|---|---|---|---|---|---|---|
| 1.1 | batch 1 | 4 | 4 | **4** | — | length 2, only-negation 1 | 4 |
| 1.4 | batch 1 | 5 | 5 | **5** | — | odd-verdict 1, shared-phrase 1 | 5 |
| 1.5 | batch 1 | 6 | 6 | **5** | `modal-fidelity` 1, `reproduction` 1 | odd-verdict 1, length 1, shared-phrase 1, only-hedged 1 | 5 |

**Rejections across the run:** `modal-fidelity` 1, `reproduction` 1

`quote-noise`: **0**. That count is what will say later whether
the extraction repair is worth money.

`solver-split`: **0** — items the solver answered two different
ways across two runs with the options shuffled.

**No task hit a stop condition** — every one had at least half its attempts survive and the writer
produced items for all of them.

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

