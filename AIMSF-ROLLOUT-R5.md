# AIMS-F R5: the last top-up, on assigned anchors

**Nothing is inserted.** Every item below is in an artifact awaiting the director's read.

| | |
|---|---|
| tasks | 23 |
| attempted | 38 |
| survivors | **28** |
| spend | **$15.56** |
| dollars per survivor | **$0.556** |
| ceiling | **$20.00**, held with $4.44 unspent |

## Spend by role

At $15 / $75 per million tokens (input / output).

| role | calls | input | output | USD |
|---|---|---|---|---|
| writer | 23 | 134173 | 72275 | $7.43 |
| solver | 68 | 308180 | 17988 | $5.97 |
| options-probe | 30 | 18732 | 9522 | $1.00 |
| paraphrase | 3 | 15187 | 4071 | $0.53 |
| de-cue | 4 | 5029 | 5462 | $0.49 |
| solver-recheck | 2 | 6690 | 560 | $0.14 |
| **total** | **130** | **487991** | **109878** | **$15.56** |

## Per task

| task | batch | shortfall | attempted | survived | rejections by gate | key-pick | flag | cue flags | distinct anchors |
|---|---|---|---|---|---|---|---|---|---|
| 1.2 | R5 | 6 | 4 | **4** | — | 75% (3/4) | 75% (3/4) | length 1, only-hedged 1, shared-phrase 1 | 2 |
| 1.3 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | length 1 | 1 |
| 1.5 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |
| 1.6 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |
| 2.2 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 2.4 | R5 | 2 | 2 | **1** | `solver` 1 | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 2.5 | R5 | 2 | 2 | **2** | — | 100% (2/2) | 100% (2/2) | odd-verdict 2 | 2 |
| 2.7 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | length 1 | 1 |
| 2.8 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 3.1 | R5 | 3 | 3 | **3** | — | 100% (3/3) | 100% (3/3) | odd-verdict 2, shared-phrase 1 | 3 |
| 3.4 | R5 | 2 | 2 | **2** | — | 100% (2/2) | 100% (2/2) | shared-phrase 1, only-hedged 1 | 2 |
| 3.7 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |
| 4.1 | R5 | 2 | 2 | **0** | `modal-fidelity` 1, `solver-split` 1 | — | — | — | 0 |
| 4.2 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | only-hedged 1 | 1 |
| 4.3 | R5 | 1 | 1 | **0** | `solver` 1 | — | — | — | 0 |
| 4.4 | R5 | 3 | 3 | **2** | `solver` 1 | 50% (1/2) | 50% (1/2) | odd-verdict 1 | 2 |
| 4.5 | R5 | 3 | 3 | **1** | `shared-distractor-phrase` 1, `solver` 1 | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 4.6 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |
| 4.7 | R5 | 3 | 3 | **2** | `modal-fidelity` 1 | 100% (2/2) | 100% (2/2) | odd-verdict 1, only-hedged 1 | 2 |
| 5.1 | R5 | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | only-hedged 1 | 1 |
| 5.3 | R5 | 1 | 1 | **0** | `solver-split` 1 | — | — | — | 0 |
| 5.4 | R5 | 1 | 1 | **0** | `quote-noise` 1 | — | — | — | 0 |
| 5.5 | R5 | 4 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |

**Rejections across the run:** `solver` 4, `modal-fidelity` 2, `solver-split` 2, `shared-distractor-phrase` 1, `quote-noise` 1

### The options probe, against the authored bank

**These are two measurements and only one of them compares to 98 percent.** The authored bank's
98 percent is a KEY-PICK rate: how often the probe, shown the options alone with no stem, picks the
key. A FLAG is narrower -- it picked the key AND could name the cue it used -- so the flag count is a
subset of the key-pick count by construction. Reading a flag rate against 98 percent would report an
improvement nobody measured.

| | rate | |
|---|---|---|
| **key-pick, these survivors** | **93%** (26/28) | the figure comparable to 98% |
| key-pick, authored bank | 98% | measured in the 480-item audit |
| key-pick, chance | 25% | four options |
| flag (picked the key AND named the cue) | **93%** (26/28) | a SUBSET of key-pick, not comparable to 98% |
| flag, ALL pre-instruction survivors | **79%** (53/67) | the POPULATION baseline |
| flag, batch 1 alone | 64% (9/14) | the ruling's baseline, and the LOW OUTLIER of the set |
| flag, batch 2 alone | 83% (44/53) | the other pre-instruction point |

**The ruling asked for 64%, and 64% is the low outlier of a two-point set.** Against it the flag rate
looks 28 points worse; against the population of every pre-instruction survivor it is 13. The control
keeps its job -- it is what made the comparison worth making -- but it does not get to be the baseline.

**And the delta is confounded, which is stated rather than buried.** This run changed the writer prompt
AND the task set AND the maps those tasks anchor on, all in one session. A delta measurement changes one
thing. So this figure is a fact about the run, not a measurement of the instruction, and the honest next
step is to read the flagged members rather than to tune the prompt again.

The probe FLAGS and never rejects, and it has no target rate. Per-task rates are in the table above.

`quote-noise`: **1**. That count is what will say later whether
the extraction repair is worth money.

`solver-split`: **2** — items the solver answered two different
ways across two runs with the options shuffled.

`anchor-assignment`: **0** refused for anchoring outside the clause assigned to them, of 38 item(s) that carried an assignment. 0 item(s) had none — generated
before PROMPT-96 s2 and re-gated through `--from`, so the gate could not examine them; UNASSERTED,
never a pass, and never blocking. **A zero refusal count means nothing without those two
denominators**: it reads identically whether every writer obeyed or the gate never ran.

**AND WHETHER THE ASSIGNMENT COULD SPREAD AT ALL IS A DIFFERENT QUESTION FROM WHETHER IT WAS
OBEYED.** Distinct assigned clauses per multi-item task:

| task | items assigned | distinct clauses |
|---|---|---|
| 1.2 | 4 | **2** |
| 2.4 | 2 | 2 |
| 2.5 | 2 | 2 |
| 3.1 | 3 | 3 |
| 3.4 | 2 | 2 |
| 4.1 | 2 | **1** |
| 4.4 | 3 | 3 |
| 4.5 | 3 | 3 |
| 4.7 | 3 | 3 |

The bolded rows are tasks where two or more items share a clause. That is **not** the writer
clustering — it is the cap being the only room available: `capacity = cap x eligible primaries`,
and a task with one eligible primary can hold two items and no more than one clause. Run
`scripts/check-floor-vs-anchorable.mjs` for which of those are CROSS-SOURCE maps, where the floor
is derived from primaries in standards this run cannot anchor in.

## Tasks that hit a stop condition

- **4.1**: fewer than half survived (0 of 2)
- **4.3**: fewer than half survived (0 of 1)
- **4.5**: fewer than half survived (1 of 3)
- **5.3**: fewer than half survived (0 of 1)
- **5.4**: fewer than half survived (0 of 1)

---

## Every survivor, in full

### Task 1.2   (4 survivors)

#### `ec26b212`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** A firm builds a recommendation service on a licensed third-party model, obtains training data from a partner, and sells the finished service to business customers. Under the Annex A control on allocating responsibilities in the AI system life cycle, what must the firm ensure?

- **A) That life-cycle responsibilities are divided up among itself, its partners, suppliers, customers and other third parties.  ← key**
- B) That responsibility for the whole life cycle sits with the party that provides the AI system to the customer.
- C) That the responsibilities of external parties are written into the documented scope statement of the management system.
- D) That responsibilities are assigned to anyone who perceives themselves as affected by the service's decisions.

*explanation:* Clause A.10.2 states that "The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties." The obligation is an apportionment across that named set of parties, not a concentration of responsibility in one party, a scope-document entry, or an assignment to every affected person.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the longest option and the only one that enumerates a broad inclusive list (itself, partners, suppliers, customers, third parties), while B, C and D each name a single narrow party or rule.

#### `b6382561`   anchor `A.3.2`

> Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization.

**Q** A mid-sized insurer has deployed an AI underwriting tool and is deciding how internal accountability for AI should be arranged. Which statement reflects the Annex A control on AI roles and responsibilities?

- **A) Roles and responsibilities for AI are defined and assigned in a way that fits what the insurer needs.  ← key**
- B) A separate individual is designated for each of the role categories listed in the context clause.
- C) Roles and responsibilities for AI follow from customer expectations and general usage agreements.
- D) Roles and responsibilities for AI are fixed by the documented scope, which sets the insurer's activities.

*explanation:* Clause A.3.2 states that "Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization." The driver is the organization's own needs, not a fixed staffing template, customer agreements, or the scope statement.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): Three options share the stem 'Roles and responsibilities for AI...'; of those, C and D name a rigid external determiner ('follow from', 'fixed by') while A is the flexible/accommodating varia

#### `2741d373`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** A deployer of an AI triage tool works with a data supplier and a systems integrator. Considering the Annex A control on allocating responsibilities in the AI system life cycle together with its Annex B implementation guidance, which pairing is correct?

- **A) Splitting life-cycle responsibilities among the parties is required, and recording each intervening party and its role is advised.  ← key**
- B) Splitting life-cycle responsibilities among the parties is required, and recording each intervening party and its role is required.
- C) Splitting life-cycle responsibilities among the parties is advised, and recording each intervening party and its role is advised.
- D) Splitting life-cycle responsibilities among the parties is advised, and recording each intervening party and its role is required.

*explanation:* Clause A.10.2 frames the sharing out of life-cycle responsibilities across the organization and its partners, suppliers, customers and third parties as an obligation, using shall. The related implementation guidance in B.10.2 is phrased with should when it advises writing down the parties that take part in the life cycle and the roles they hold, so that step is recommended rather than obligatory.

#### `6bb11929`   anchor `A.3.2`

> Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization.

**Q** An AI service provider has contractually agreed with its model supplier and its customers how life-cycle duties are divided, but has assigned no internal owners for AI oversight, testing or impact assessment. What follows for the organization?

- **A) Internal AI roles and responsibilities still have to be defined and assigned to suit its needs.  ← key**
- B) The agreed division of life-cycle duties with supplier and customers already covers the obligation.
- C) Assigning internal AI roles becomes necessary once the management system scope is documented.
- D) Internal AI roles are derived from the expectations of the customers it supplies the service to.

*explanation:* Clause A.3.2 requires that "Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization." That is a distinct control from the allocation of responsibilities between the organization and external parties across the life cycle, so a contractual split with supplier and customers does not discharge it.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options attach an external dependency or condition ('division of duties with supplier and customers already covers', 'once the management system scope is documented', 'derived from th

### Task 1.3   (1 survivor)

#### `182229d1`   anchor `A.6.2.3`

> The organization shall document the AI system design and development based on organizational objectives, documented requirements and specification criteria.

**Q** A project team is settling on the learning algorithm and model type for a planned AI system, and is writing down the reasons for each choice against the organization's stated aims and the agreed specification criteria. Which Annex A life-cycle obligation is this team fulfilling?

- A) Fixing the measures and the criteria by which the system will later be verified and validated before acceptance.
- **B) Keeping a record of the system's design and build choices, grounded in organizational objectives, documented requirements and specification criteria.  ← key**
- C) Recording a release plan and confirming that the relevant requirements are satisfied before the system goes live.
- D) Setting out the elements needed for continuing operation, covering monitoring, repairs, updates and user support.

*explanation:* The activity described is design and development work being recorded against objectives and agreed criteria. Clause A.6.2.3 requires that the organization "shall document the AI system design and development based on organizational objectives, documented requirements and specification criteria." The other options describe obligations attaching to later life-cycle stages: verification and validation, deployment, and operation and monitoring.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): B is the longest option and the only one stacking a three-item qualifier ('organizational objectives, documented requirements and specification criteria'), while A, C and D are single-clause and s

### Task 1.5   (1 survivor)

#### `4e9044fe`   anchor `4.2`

> The organization shall determine: — the interested parties that are relevant to the AI management system; — the relevant requirements of these interested parties; — which of these requirements will be addressed through the AI management system.

**Q** A provider certified to ISO/IEC 42001 is asked by a customer whether the certificate demonstrates that it satisfies every legal obligation applying to its AI systems. Considering what ISO/IEC 42001 requires about interested parties and their requirements, which statement is accurate?

- **A) The organization itself settles which of the identified interested-party requirements its AI management system will take on.  ← key**
- B) Every requirement identified for a relevant interested party has to be taken on by the AI management system.
- C) The certification body settles which interested-party requirements the AI management system will take on.
- D) Interested-party requirements are covered by top management's policy commitment instead of being determined individually.

*explanation:* Clause 4.2 requires the organization to determine "which of these requirements will be addressed through the AI management system", so the scope of what conformity evidences is a set the organization itself delimits — a narrower claim than satisfying all applicable law.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and C are the same sentence with only the agent swapped (organization vs certification body), marking that pair as the real contrast; B is the only absolute ('Every ... has to') and D the

### Task 1.6   (1 survivor)

#### `c54499aa`   anchor `A.6.1.2`

> The organization shall identify and document objectives to guide the responsible development AI systems, and take those objectives into account and integrate measures to achieve them in the development life cycle.

**Q** A team building an AI system asks what its AI management system actually obliges it to do about responsible-development goals such as fairness, safety and robustness. Which action is required of the organization?

- **A) Set out its own responsible-development aims in documented form and build measures for achieving them into the development life cycle.  ← key**
- B) Apply the numeric fairness and robustness thresholds fixed in Annex C for AI systems used in automated decision-making.
- C) Adopt the testing methodologies, test-data choices and release criteria listed in the implementation guidance on verification and validation.
- D) Implement each of the control objectives and controls set out in the Annex A table before the system is released.

*explanation:* Clause A.6.1.2 requires the organization to "identify and document objectives to guide the responsible development AI systems, and take those objectives into account and integrate measures to achieve them in the development life cycle." The management system therefore obliges the organization to decide and record its own objectives and to work measures for them into development; it does not itself set the substantive engineering targets. Annex C only describes possible objectives, Annex B offers implementation guidance rather than obligations, and the Annex A controls are a reference set, not a mandatory checklist.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D all direct the reader to adopt a fixed externally-specified list (Annex C thresholds, implementation-guidance methodologies, Annex A controls), while A is the only option with no

### Task 2.2   (1 survivor)

#### `3bb6992f`   anchor `4.1`

> The organization shall consider the intended purpose of the AI systems that are developed, provided or used by the organization.

**Q** A regional insurer builds two pricing models in-house. It also runs a purchased claims platform with a vendor-embedded scoring model it cannot modify, and a customer-service chatbot that calls an external model through an API. The AIMS working group proposes to base its context analysis on the two in-house models only, arguing that the other capability was bought rather than built. Applying the context requirements of ISO/IEC 42001, what should the group do instead?

- **A) Take the intended purposes of the embedded scoring model and the chatbot's external model into account alongside the two in-house models when working out context.  ← key**
- B) Confine the context analysis to the two in-house models and deal with the embedded scoring model and the chatbot's external model through the supplier process.
- C) Treat the embedded scoring model and the chatbot's external model as interested-party requirements to be listed, rather than as systems whose purposes are considered.
- D) Record the boundary as a shared understanding within the working group and hold documented information for the two in-house models alone.

*explanation:* Clause 4.1 requires that “The organization shall consider the intended purpose of the AI systems that are developed, provided or used by the organization.” Systems the insurer merely uses — the vendor-embedded scoring model and the externally hosted chatbot model — fall within that consideration, so context cannot be limited to what was built in-house.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options (B, C, D) all limit the analysis to the two in-house models and handle the other two systems some other way; A is the only one that treats all four together, making it the odd v

### Task 2.4   (1 survivor)

#### `29a3ad5f`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** A company assembles an AI system from a vendor's pretrained model, uses an integrator to build the application, and runs it on a managed cloud service. Its internal role chart is complete and current, yet nothing records which party looks after monitoring, retraining and eventual decommissioning. What does ISO/IEC 42001's control on allocating responsibilities expect here?

- A) Responsibility for building the system should be settled with the integrator, with later stages falling to whoever operates the service.
- B) Defining AI roles internally to suit the company's own needs is sufficient to discharge the allocation obligation.
- **C) Duties arising across the system's life cycle are to be apportioned between the company and the outside parties involved.  ← key**
- D) Top management is expected to hold each life cycle duty directly rather than passing it to other roles or parties.

*explanation:* Clause A.10.2 requires that responsibilities within the AI system life cycle “are allocated between the organization, its partners, suppliers, customers and third parties”, so the unowned monitoring, retraining and decommissioning duties must be apportioned across the parties. Option 1 limits allocation to an early stage, option 2 confuses internal role definition with allocation across parties, and option 4 contradicts the note that top management may delegate.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A, B and D each contain a restrictive/absolute qualifier ('settled with the integrator... whoever operates', 'is sufficient', 'directly rather than passing it'), while C alone is the inclusiv

### Task 2.5   (2 survivors)

#### `d73d4f82`   anchor `C.2.10`

> In the context of AI and in particular with regard to AI systems based on ML approaches, new security issues should be considered beyond classical information and system security concerns.

**Q** A bank has deployed a fraud-detection model built with machine learning. The security team has already run its standard IT review, covering network segmentation, access control and patching of the hosting platform, and now asks the AI governance lead what else to do about security risk sources. What is the most appropriate response?

- **A) Extend the review to security concerns arising from the model's learning approach itself.  ← key**
- B) Treat the completed conventional review as covering the model's security risk sources.
- C) Pass the security questions to the assessment of consequences for individuals and societies.
- D) Hold any further security work until the next scheduled interval for risk assessment.

*explanation:* Clause C.2.10 states that "In the context of AI and in particular with regard to AI systems based on ML approaches, new security issues should be considered beyond classical information and system security concerns." The classical infrastructure review is therefore a starting point, not the whole picture, for a machine learning based system.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options defer, delay, or hand off the security question (treat as covered / pass to another assessment / hold until next interval) while only A takes an affirmative extending action, ma

#### `20fe9eeb`   anchor `C.2.7`

> The misuse or disclosure of personal and sensitive data (e.g. health records) can have harmful effects on data subjects.

**Q** A hospital analytics team is drawing up candidate risk sources for a model trained on patient records, and wants to record the privacy-related entry. Which statement best characterises that risk source?

- **A) Harmful effects on the individuals whose health data is disclosed or misused.  ← key**
- B) Uncertainty about performance where the range of operating situations is very broad.
- C) Limited ability of the organisation to fix defects or adapt to new requirements.
- D) Inability to give interested parties suitable information about the organisation and its system.

*explanation:* Clause C.2.7 frames privacy in terms of data subjects: "The misuse or disclosure of personal and sensitive data (e.g. health records) can have harmful effects on data subjects." The other statements name genuine candidate risk sources, but they belong to different objectives and topics.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A is the only option naming a concrete subject (individuals' health data); B, C and D are generic organisation/system statements, making A the specific odd one out.

### Task 2.7   (1 survivor)

#### `eef76522`   anchor `8.2`

> The organization shall perform AI risk assessments in accordance with 6.1.2 at planned intervals or when significant changes are proposed or occur. The organization shall retain documented information of the results of all AI risk assessments.

**Q** A provider has completed and documented an AI system impact assessment for a new recommendation engine, covering the consequences of its deployment, intended use and foreseeable misuse for affected individuals and communities. The AI management system lead proposes that this document be filed as the operational risk record for the engine, so that no separate risk assessment cycle is run. Under ISO/IEC 42001, which analysis of this proposal is correct?

- A) The risk analysis may be limited to consequences for the organization, with individuals and societies left to the impact assessment.
- B) The documented impact assessment can stand in for the operational risk record where its results are shared with interested parties.
- **C) The impact findings feed the risk assessment, which is still performed on schedule and when major changes arise, with results retained.  ← key**
- D) The impact assessment sits downstream of the risk assessment, taking the determined levels of risk as its starting point.

*explanation:* Clause 8.2 obliges the organization to "perform AI risk assessments in accordance with 6.1.2 at planned intervals or when significant changes are proposed or occur" and to keep documented results, so the impact assessment cannot serve as the risk record. The two are linked but not interchangeable: the impact assessment's documented consequences are an input considered during risk assessment, while the risk assessment is anchored to the AI objectives and outputs risk levels prioritized for treatment.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): C is the longest option and the only one stacking multiple qualifying clauses ("on schedule and when major changes arise, with results retained"), while A and B are hedged single-clause claims ("m

### Task 2.8   (1 survivor)

#### `f08a242f`   anchor `A.1`

> Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).

**Q** An AI risk treatment team judges that the reference controls in Table A.1 of ISO/IEC 42001 do not adequately address one of its assessed risks. Consistent with the annex's own statement about how that table is used, which approach is available to the team?

- **A) The team can design and apply controls of its own to treat the risk.  ← key**
- B) The team must first adopt every listed reference control before adding any control of its own.
- C) The team must record in the statement of applicability why each item of implementation guidance was left out.
- D) The team may add controls of its own, but the statement of applicability lists only reference controls.

*explanation:* Clause A.1 states that "Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3)." The reference table is a starting point, so where it does not fit an assessed risk the organization is free to determine and implement controls of its own design.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A is the only option with no restrictive qualifier (the other three all contain 'must' or 'only') and is also the shortest by a wide margin.

### Task 3.1   (3 survivors)

#### `3e47e159`   anchor `A.4.3`

> As part of resource identification, the organization shall document information about the data resources utilized for the AI system.

**Q** A bank is compiling the resource identification record for a fraud-detection model. The record already covers the modelling tools, the servers and storage, and the staff and their competences, but nothing has been written down about the training and validation datasets, their provenance or how they were labelled. Which action closes this gap?

- A) Defer any dataset write-up until an impact assessment raises a concern about bias in the training data.
- B) Rely on the external supplier's own records for the datasets, which were not built in-house.
- **C) Add a description of the datasets the model uses to the resource identification for the system.  ← key**
- D) Cover the datasets by describing the storage hardware and processing capacity in the system record.

*explanation:* Clause A.4.3 requires the organization, as part of resource identification, to "document information about the data resources utilized for the AI system." The missing element is the dataset documentation itself; documenting other resource categories does not satisfy it.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A, B and D each attach a limiting or substituting clause (defer until..., rely on supplier's records..., cover by describing hardware instead), while C is the only option stating the action p

#### `87f4fe40`   anchor `7.1`

> The organization shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the AI management system.

**Q** An insurer has costed out the staff, tooling and infrastructure needed to build its AI management system and plans to release those people and that infrastructure back to other work once the system is up and running, on the assumption that upkeep will absorb itself. How should the resourcing plan be corrected?

- **A) Provide for what the management system will need to be sustained and improved, not only to be put in place.  ← key**
- B) Plan resources stage by stage across the AI system life cycle and leave the management system itself outside the plan.
- C) Concentrate the provision on establishing and implementing the system, leaving upkeep to existing operational budgets.
- D) Work out centrally what resources are needed and hand the actual provision to the owners of each AI project.

*explanation:* Clause 7.1 states that the organization "shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the AI management system." Maintenance and continual improvement are inside the scope of that obligation, so resourcing cannot stop at go-live.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D all share the pattern 'do X and leave/hand the rest to someone/something else', while A is the only option without that carve-out clause (and the only one phrased as 'not only').

#### `b7a63cf1`   anchor `A.4.4`

> As part of resource identification, the organization shall document information about the tooling resources utilized for the AI system.

**Q** A team preparing the resource inventory for a machine learning recommendation service has written up its datasets, its servers and storage, and the people involved with their competences. Nothing has been recorded about the model types chosen, the data conditioning steps or the evaluation methods applied. Which action addresses the omission?

- A) Fold the model and algorithm details into the existing record of datasets held for the service.
- B) Treat the listed categories of tools as implementation guidance rather than something to write down.
- C) Capture the tools indirectly through the record of servers and processing capacity supporting the service.
- **D) Record the models, conditioning steps and evaluation methods used within the resource identification.  ← key**

*explanation:* Clause A.4.4 requires the organization, as part of resource identification, to "document information about the tooling resources utilized for the AI system." Models, data conditioning processes and evaluation methods sit in that tooling category, which the team has not documented.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options say to fold/subsume/not write down the tools (deflecting away from explicit documentation) while D alone says to record them directly, making it the odd verdict.

### Task 3.4   (2 survivors)

#### `fc0000a0`   anchor `A.10.3`

> The organization shall establish a process to ensure that its usage of services, products or materials provided by suppliers aligns with the organization’s approach to the responsible development and use of AI systems.

**Q** A developer of an AI-enabled triage tool buys a pre-trained model component and labelled training data from an external vendor. According to ISO/IEC 42001's supplier control, what does the developer have to do about this sourcing arrangement?

- **A) Set up a process confirming the bought-in items fit its responsible-AI approach.  ← key**
- B) Transfer responsibility for the whole AI life cycle to the vendor by contract.
- C) Adopt the vendor's control list as the developer's own statement of applicability.
- D) Set measurable objectives for the vendor at relevant functions and levels.

*explanation:* Clause A.10.3 requires the organization to "establish a process to ensure that its usage of services, products or materials provided by suppliers aligns with the organization’s approach to the responsible development and use of AI systems", so a process-based alignment check on the purchased model and data is what is called for. Wholesale transfer of life cycle responsibility contradicts the allocation requirement, the statement of applicability is the organization's own output of its risk treatment process, and the AI objectives requirement applies to the organization's own functions and levels.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options (B, C, D) explicitly hinge on "the vendor" doing or supplying something, while A is the only one framed entirely around the subject's own process/approach.

#### `2accd914`   anchor `6.1.3`

> determine all controls that are necessary to implement the AI risk treatment options chosen and compare the controls with those in Annex A to verify that no necessary controls have been omitted

**Q** A team has completed its AI risk assessment, chosen treatment options, and drafted its own list of controls to implement them. How does the Annex A reference set bear on that draft list?

- A) Each control listed in Annex A is implemented, with any exclusions noted later.
- B) Annex A gives implementation guidance, while Annex B lists the reference controls.
- **C) The team's necessary controls are compared with Annex A to confirm none needed was left out.  ← key**
- D) Where Annex A controls are adopted unchanged, no statement of applicability is produced.

*explanation:* Clause 6.1.3 b) has the organization work out every control needed for the chosen treatment options and then set that set against the annex as a check that nothing necessary was missed, making Annex A a completeness cross-check rather than a mandatory checklist. Annex A is the reference control list and Annex B the implementation guidance, and a statement of applicability with justification for inclusions and exclusions is produced in every case.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A, B and D each make a flat absolute claim ("Each ... is implemented", "Annex B lists", "no statement ... is produced"), while C is the only option phrased as a cautious checking/comparison p

### Task 3.7   (1 survivor)

#### `159b5fda`   anchor `8.3`

> When risk treatment options as defined by the risk treatment plan are not effective, these treatment options shall be reviewed and revalidated following the risk treatment process according to 6.1.3 and the risk treatment plan shall be updated.

**Q** An organization with a mature ISMS wants to reuse its existing security risk treatment workflow for its AI management system. The workflow implements the approved treatment plan and files evidence of each treatment, but it has no defined step for the case where an implemented treatment turns out not to work. Under the AI management system requirements for risk treatment during operation, what gap must be closed in the reused workflow?

- **A) An ineffective treatment option is re-examined and revalidated through the risk treatment process, and the treatment plan is then updated.  ← key**
- B) An ineffective treatment option triggers a fresh assessment of consequences for individuals and societies before the plan is amended.
- C) An ineffective treatment option is logged with the treatment results and picked up at the next scheduled AI risk assessment.
- D) An ineffective treatment option obliges the organization to reissue the documented boundaries and applicability of the management system.

*explanation:* Clause 8.3 states that when treatment options defined by the plan "are not effective, these treatment options shall be reviewed and revalidated following the risk treatment process according to 6.1.3 and the risk treatment plan shall be updated." A reused ISMS workflow that only implements and records treatments therefore needs this review-and-revalidate loop added; the other options substitute impact assessment, a scheduled reassessment or scope documentation for that loop.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): All four share the stem 'An ineffective treatment option...', but only A stays inside that vocabulary (treatment process / treatment plan) while B, C and D each pivot to an unrelated noun p

### Task 4.2   (1 survivor)

#### `a7c36ebd`   anchor `A.1`

> Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).

**Q** An organization is deciding how the reference controls in Annex A of ISO/IEC 42001 bear on the set of controls it will actually put in place. Which statement describes that relationship correctly?

- **A) The annex is a reference set, so a subset of it may be used and self-designed controls can be added.  ← key**
- B) The annex is a mandatory baseline, so each listed control objective has to be adopted before any control is added.
- C) The annex's implementation guidance items also need inclusion or exclusion reasoning recorded in the statement of applicability.
- D) The organization's own controls sit outside the statement of applicability, which records the annex reference controls only.

*explanation:* Clause A.1 states that "Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3)." The annex therefore functions as a reference for addressing AI risks, not as a compulsory complete list.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only option without an absolutist marker — B says "mandatory"/"has to", C says "need", D says "only" — while A alone uses permissive modals ("may be used", "can be added").

### Task 4.4   (2 survivors)

#### `677d4794`   anchor `A.6.2.6`

> The organization shall define and document the necessary elements for the ongoing operation of the AI system.

**Q** Six months after launch, a demand-forecasting system's accuracy has drifted far below expectation. Investigation shows the organization never settled what would be watched in production, who would respond to faults, how updates would be issued, or how users would get help. Which Annex A life-cycle control addresses this omission?

- A) Determining the life-cycle phases at which event records are kept, at least during use.
- **B) Recording in writing what ongoing operation requires: monitoring, fixes, updates and support.  ← key**
- C) Defining the measures used to verify and validate the system, with criteria for use.
- D) Assessing and recording potential impacts on individuals across the system's life cycle.

*explanation:* Clause A.6.2.6 requires the organization to "define and document the necessary elements for the ongoing operation of the AI system", and names system and performance monitoring, repairs, updates and support as the expected baseline content — exactly the arrangements that were never settled here.

#### `5513f191`   anchor `A.6.2.7`

> The organization shall determine what AI system technical documentation is needed for each relevant category of interested parties, such as users, partners, supervisory authorities, and provide the technical documentation to them in the appropriate form.

**Q** A supervisory authority requests information on a deployed system's intended purpose and known limitations, while customers separately ask for usage instructions. The provider holds only an internal engineering wiki written in developer shorthand, and hands over extracts of it to both. Which Annex A life-cycle control was not implemented?

- A) Recording the system's design and development against organizational objectives and specification criteria.
- B) Retaining documented outcomes of impact assessments for a period the organization has defined.
- **C) Working out what technical information each category of interested party needs and supplying it suitably.  ← key**
- D) Enabling the keeping of event records across the phases the organization has determined.

*explanation:* Clause A.6.2.7 requires the organization to determine what technical documentation "is needed for each relevant category of interested parties, such as users, partners, supervisory authorities, and provide the technical documentation to them in the appropriate form", which a single developer-facing wiki extract does not satisfy.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options are about recording/retaining documentation (A 'Recording', B 'Retaining documented', D 'keeping of event records'), and two of those share the 'the organization has defined/det

### Task 4.5   (1 survivor)

#### `3279aed3`   anchor `A.7.6`

> The organization shall define and document its criteria for selecting data preparations and the data preparation methods to be used.

**Q** A review of a machine learning pipeline finds that missing entries are filled by imputation, numeric features are scaled, and categorical features are encoded. The team can describe each step, but cannot show on what basis those particular transforms were chosen over alternatives. Applying the Annex A data controls, what is the team required to produce?

- **A) Documented criteria that governed the choice of the preparations and transforms used.  ← key**
- B) Documented thresholds for data quality that the prepared data are shown to meet.
- C) Documented details of the sources from which the pipeline's input data were obtained.
- D) Documented processes for managing data across the development of the AI system.

*explanation:* The deficiency is the missing rationale for selecting preparation methods. Clause A.7.6 requires the organization to "define and document its criteria for selecting data preparations and the data preparation methods to be used." Quality requirements, acquisition details and development data management are distinct controls that would not record why these transforms were selected.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): All four begin "Documented ...", but B, C and D all name data itself (quality thresholds, input sources, data management), while A is the only one naming a rationale for method choices ('crit

### Task 4.6   (1 survivor)

#### `ef298246`   anchor `A.9.2`

> The organization shall define and document the processes for the responsible use of AI systems.

**Q** A hospital uses a diagnostic AI system bought from a vendor; it does not build AI systems itself. While preparing its statement of applicability, the AIMS team considers how clinicians operate the system day to day. Under the Annex A controls for the use of AI systems, what does the hospital itself have to do?

- **A) Set out and record the procedures that govern responsible operation of the system.  ← key**
- B) Adopt the vendor's deployment instructions in place of its own recorded use procedures.
- C) Record the nine responsible-use objectives named in Annex B as its mandatory set.
- D) Treat the apportioning of life cycle duties among the parties as covering its use procedures.

*explanation:* Clause A.9.2 states that "The organization shall define and document the processes for the responsible use of AI systems." The obligation rests on the organization that uses the system, regardless of who developed it.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D each swap in some external item (the vendor's instructions, Annex B's nine objectives, the apportioning of life-cycle duties) as a substitute for the entity's own procedures; A i

### Task 4.7   (2 survivors)

#### `60239a31`   anchor `3.26`

> All identified risks and the risk management measures (controls) established to address them shall be reflected in the statement of applicability.

**Q** A team has recorded a risk that the origin of its training data is unknown. It decides to treat that risk with an access control already running over the model serving endpoint under its information security management system, and then leaves data provenance out of its statement of applicability altogether. Judged against what a statement of applicability is meant to contain, what is wrong with this?

- **A) The recorded provenance risk and the measure chosen to treat it both have to appear in the statement of applicability.  ← key**
- B) Controls already operating under an information security management system belong in that system's documentation rather than in this one.
- C) The statement of applicability covers the Annex A reference controls, while measures the organization designs itself are logged elsewhere.
- D) A reason has to be stated for controls that are left out, while controls brought in need no recorded reason.

*explanation:* The definition of the statement of applicability in Clause 3.26 states that "All identified risks and the risk management measures (controls) established to address them shall be reflected in the statement of applicability." A risk about data origin that has been identified cannot simply disappear from the document because an endpoint access control was reused; both the risk and the measure addressing it have to be reflected there.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B and C both say some items live in other documentation and D exempts one half from a requirement; A is the only option that keeps both items inside the statement of applicability, i.e. the o

#### `17f918e9`   anchor `D.2`

> In this case, the way to implement controls which (partly) relate to information security in this document (see B.6.1.2) can be integrated with the organization’s implementation of ISO/IEC 27001.

**Q** An organization already operating an information security management system conforming to ISO/IEC 27001 is building its AI management system, and several of the AI controls it has selected bear partly on information security. Which statement best describes how the two bodies of work relate?

- **A) The AI controls touching on information security can be carried out through the existing ISO/IEC 27001 implementation rather than built afresh.  ← key**
- B) Conformity with ISO/IEC 27001 can be taken as discharging the security-related controls selected for the AI management system, needing no further treatment.
- C) Security-related AI controls are carried out separately from the existing information security work, so the boundary between the two systems stays intact.
- D) Security objectives for the AI system can be met by the ISO/IEC 27001 control set in place of the controls AI risk treatment determines.

*explanation:* Clause D.2 notes that "In this case, the way to implement controls which (partly) relate to information security in this document (see B.6.1.2) can be integrated with the organization’s implementation of ISO/IEC 27001." Shared implementation is contemplated, which is different from one certification discharging the other's controls.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B and D make absolute substitution claims ("needing no further treatment", "in place of the controls") and C is the lone flat opposite; A is the only moderately hedged wording ("can be carrie

### Task 5.1   (1 survivor)

#### `28a28fac`   anchor `3.20`

> determining the status of a system, a process (3.8) or an activity

**Q** An AI management system team is agreeing on vocabulary before designing its evaluation arrangements. As the term is defined for AI management systems, monitoring consists of what activity?

- **A) Determining the current state of a system, process or activity, sometimes by close observation.  ← key**
- B) Carrying out a process that arrives at a value for a chosen characteristic.
- C) Assessing how far intended actions were carried out and intended results attained.
- D) Reporting results obtained from using AI systems as quantitative or qualitative findings.

*explanation:* Clause 3.20 defines monitoring as "determining the status of a system, a process (3.8) or an activity", and its note adds that checking, supervising or critically observing can be needed to do so. The other options restate measurement, effectiveness and performance respectively.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the longest option and the only one containing a hedge ('sometimes by close observation'), the classic broad-definition shape.

### Task 5.5   (1 survivor)

#### `97623833`   anchor `3.4`

> A management system can address a single discipline or several disciplines.

**Q** A company that already runs a management system for another discipline is adding AI governance and asks two things: whether the AI elements can live inside the existing system, and whether ISO/IEC 42001 itself lays down the qualification rules for the body that would audit and certify it. Which response is accurate?

- **A) A single management system can address more than one discipline, so the AI elements can sit inside the existing arrangement.  ← key**
- B) The competence and impartiality rules for the auditing body can be found in ISO/IEC 42001 itself, which sets them alongside the organization's requirements.
- C) Each further discipline needs a management system of its own, so the AI elements must be kept apart from the existing arrangement.
- D) The management system of an organization inside a larger entity has to extend across that whole entity, and can cover AI there.

*explanation:* The definition of a management system in Clause 3.4 notes that "A management system can address a single discipline or several disciplines.", so AI-related elements may be handled within an existing multi-discipline system. ISO/IEC 42001 addresses the organization's management system, not the qualification of certification bodies, which is dealt with by separate documents.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and C are mirror-image statements built from the same phrases ('more than one discipline'/'own', 'sit inside'/'kept apart from the existing arrangement'), so the answer is almost certainl

