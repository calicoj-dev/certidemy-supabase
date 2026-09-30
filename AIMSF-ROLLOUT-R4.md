# AIMS-F rollout R4 (the top-up after the s2 insert)

**Nothing is inserted.** Every item below is in an artifact awaiting the director's read.

| | |
|---|---|
| tasks | 20 |
| attempted | 40 |
| survivors | **29** |
| spend | **$19.38** |
| dollars per survivor | **$0.668** |
| ceiling | **$30.00**, held with $10.62 unspent |

## The ceiling: measured, projected, then spent

| | |
|---|---|
| ceiling | $30.00 |
| measured on `R4 probe` | 7 attempt(s), $2.97 -- **$0.425 per attempt** |
| projected for the remaining 33 | $14.02 |
| projected TOTAL | $16.99 |
| actual TOTAL | **$19.38** |
| projection error | 14.0% |

**The projection is printed even where it was accurate.** A ceiling held is only evidence of
discipline if the number that authorised the run is beside the number it cost -- otherwise a run that
came in under budget by luck is indistinguishable from one that was measured first.

## Spend by role

At $15 / $75 per million tokens (input / output).

| role | calls | input | output | USD |
|---|---|---|---|---|
| writer | 20 | 110010 | 71343 | $7.00 |
| solver | 74 | 315218 | 17307 | $6.03 |
| paraphrase | 26 | 167009 | 28941 | $4.68 |
| options-probe | 36 | 22193 | 11915 | $1.23 |
| de-cue | 3 | 3747 | 3032 | $0.28 |
| solver-recheck | 3 | 8861 | 410 | $0.16 |
| **total** | **162** | **627038** | **132948** | **$19.38** |

## Per task

| task | batch | shortfall | attempted | survived | rejections by gate | key-pick | flag | cue flags | distinct anchors |
|---|---|---|---|---|---|---|---|---|---|
| 1.2 | R4 probe | 6 | 6 | **4** | `solver` 1, `anchor-cap` 1 | 100% (4/4) | 100% (4/4) | odd-verdict 2, length 1, only-hedged 1 | 2 |
| 1.5 | R4 probe | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | only-hedged 1 | 1 |
| 1.6 | R4 rest | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |
| 2.2 | R4 rest | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 2.4 | R4 rest | 2 | 2 | **2** | — | 100% (2/2) | 100% (2/2) | shared-phrase 1, only-hedged 1 | 2 |
| 2.5 | R4 rest | 2 | 2 | **2** | — | 0% (0/2) | 0% (0/2) | — | 2 |
| 2.7 | R4 rest | 1 | 1 | **0** | `solver-split` 1 | — | — | — | 0 |
| 2.8 | R4 rest | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 3.1 | R4 rest | 3 | 3 | **3** | — | 100% (3/3) | 100% (3/3) | shared-phrase 1, length 1, odd-verdict 1 | 3 |
| 3.4 | R4 rest | 2 | 2 | **2** | — | 100% (2/2) | 100% (2/2) | shared-phrase 1, odd-verdict 1 | 2 |
| 3.7 | R4 rest | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |
| 4.1 | R4 rest | 2 | 2 | **0** | `reproduction` 2, `modal-fidelity` 1, `quote-noise` 1 | — | — | — | 0 |
| 4.3 | R4 rest | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 4.4 | R4 rest | 3 | 3 | **1** | `solver` 1, `solver-split` 1 | 0% (0/1) | 0% (0/1) | — | 1 |
| 4.5 | R4 rest | 3 | 3 | **3** | — | 33% (1/3) | 0% (0/3) | — | 3 |
| 4.6 | R4 rest | 1 | 1 | **1** | — | 100% (1/1) | 100% (1/1) | odd-verdict 1 | 1 |
| 4.7 | R4 rest | 3 | 3 | **3** | — | 100% (3/3) | 100% (3/3) | shared-phrase 1, only-hedged 1, odd-verdict 1 | 3 |
| 5.1 | R4 rest | 1 | 1 | **1** | — | 100% (1/1) | 0% (0/1) | — | 1 |
| 5.4 | R4 rest | 1 | 1 | **0** | `reproduction` 1, `quote-noise` 1 | — | — | — | 0 |
| 5.5 | R4 rest | 4 | 4 | **1** | `anchor-cap` 3 | 100% (1/1) | 100% (1/1) | shared-phrase 1 | 1 |

**Rejections across the run:** `anchor-cap` 4, `reproduction` 3, `solver` 2, `solver-split` 2, `quote-noise` 2, `modal-fidelity` 1

### The options probe, against the authored bank

**These are two measurements and only one of them compares to 98 percent.** The authored bank's
98 percent is a KEY-PICK rate: how often the probe, shown the options alone with no stem, picks the
key. A FLAG is narrower -- it picked the key AND could name the cue it used -- so the flag count is a
subset of the key-pick count by construction. Reading a flag rate against 98 percent would report an
improvement nobody measured.

| | rate | |
|---|---|---|
| **key-pick, these survivors** | **83%** (24/29) | the figure comparable to 98% |
| key-pick, authored bank | 98% | measured in the 480-item audit |
| key-pick, chance | 25% | four options |
| flag (picked the key AND named the cue) | **76%** (22/29) | a SUBSET of key-pick, not comparable to 98% |
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

`quote-noise`: **2**. That count is what will say later whether
the extraction repair is worth money.

`solver-split`: **2** — items the solver answered two different
ways across two runs with the options shuffled.

`anchor-assignment`: **NOT MEASURED ON THIS RUN.** The artifact carries no assignment and no
unasserted entry for it, which means it was gated before the gate existed rather than that every
item passed. Three zeros and a clean bill of health look identical, so this says which it is.

## Tasks that hit a stop condition

- **2.7**: fewer than half survived (0 of 1)
- **4.1**: fewer than half survived (0 of 2)
- **4.4**: fewer than half survived (1 of 3)
- **5.4**: fewer than half survived (0 of 1)
- **5.5**: fewer than half survived (1 of 4)

---

## Every survivor, in full

### Task 1.2   (4 survivors)

#### `4d544a58`   anchor `A.3.2`

> Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization.

**Q** An organization is setting up accountability for its AI work and asks what should govern how its internal AI roles and duties are shaped. Which statement reflects the Annex A control on AI roles and responsibilities?

- **A) Roles and duties for AI are set and assigned in line with what the organization needs.  ← key**
- B) Roles and duties for AI mirror the role categories described in the AI vocabulary standard.
- C) Roles and duties for AI follow the split of work written into the organization's customer contracts.
- D) Roles and duties for AI are assigned after the management system scope has been issued.

*explanation:* The Annex A control on AI roles and responsibilities (A.3.2) makes defining and assigning those roles a requirement, and the yardstick it sets is what the organization itself needs, not an external template. The other options substitute an external taxonomy, contracts or a sequencing rule that the control does not state.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): All four share the stem "Roles and duties for AI", but B, C and D each tie it to a specific external anchor (a named standard, customer contracts, an issued scope) while A alone is the generi

#### `fb629038`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** An AI management system lead argues that responsibility allocation for the organization's AI system stops at its own employees. Why is this reading of the responsibility-allocation control mistaken?

- **A) Because the allocation runs across the organization together with its partners, suppliers, customers and outside parties.  ← key**
- B) Because anyone who perceives themselves to be affected by the activity takes a share of the duties.
- C) Because the duties for the AI system are apportioned by the customer that receives the product.
- D) Because the duties for the AI system are transferred to the supplier providing the models and data.

*explanation:* A.10.2 requires responsibilities in the AI system life cycle to be allocated 'between the organization, its partners, suppliers, customers and third parties', so the allocation deliberately extends past internal staff. The alternatives invent a different allocating actor or a wholesale transfer of duties.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the longest option and the only one that enumerates an inclusive list (organization, partners, suppliers, customers, outside parties), while C and D are near-identical mirrored variants that 

#### `cdfbfffc`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** A retailer contracts an external laboratory to test and validate its AI model before release. What follows for the retailer from the control on allocating responsibilities across the AI system life cycle?

- **A) Responsibility for the testing stage is apportioned between the retailer and the laboratory.  ← key**
- B) Responsibility for the testing stage passes to the laboratory once the contract is signed.
- C) The testing stage sits outside the retailer's allocation while the work is performed externally.
- D) The retailer captures the laboratory's expectations as a supplier of the testing service.

*explanation:* A.10.2 requires responsibilities within the AI system life cycle to be allocated between the organization and third parties, so engaging an external tester is precisely a case where the split has to be settled rather than avoided.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the moderate/inclusive option, splitting the responsibility between both named parties, while B, C and D each assign it wholly to one side or reframe it; the other three are mutually exc

#### `cc92ad83`   anchor `A.3.2`

> Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization.

**Q** A ten-person startup that deploys a single purchased AI tool argues that, because of its size, it need not define who is accountable for AI. Which response is correct?

- **A) AI roles and duties have to be defined and assigned, shaped by what the startup itself needs.  ← key**
- B) AI roles and duties are recommended at that size and their assignment can be deferred.
- C) AI roles and duties have to be assigned once the startup supplies its tool to outside customers.
- D) AI roles and duties have to be assigned by organizations that build models rather than deploy them.

*explanation:* The control on AI roles and responsibilities (A.3.2) obliges the organization to set out AI roles and hand out the duties in line with what it needs. The obligation therefore stands regardless of headcount, and neither supply relationships nor model-building activity is what triggers it.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B is the only hedged/weakened option ("recommended", "can be deferred") and C and D each tack on a narrowing condition ("once the startup supplies its tool to outside customers", "rather than

### Task 1.5   (1 survivor)

#### `7eb8209f`   anchor `5.2`

> includes a commitment to meet applicable requirements

**Q** A vendor tells a prospective customer that its management system certificate demonstrates that its AI systems satisfy the AI legislation applying to them. Regarding legal obligations, what does the AI management system standard actually place on the organization?

- **A) Top management establishes an AI policy that commits the organization to meeting applicable requirements.  ← key**
- B) A certification body attests that the organization meets the legal requirements applying to its AI systems.
- C) A documented plan for notifying users of incidents is the required route to discharging legal obligations.
- D) An information security management system is required wherever legal obligations touch AI system security.

*explanation:* The AI policy requirement at 5.2 obliges top management to build into the policy an undertaking that the organization will meet the requirements applicable to it. That supports a claim of responsible, accountable management of legal obligations; it is not an attestation that the law has been satisfied, and nothing in the standard has a certifier confirm legal compliance.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B, C and D each make an absolute claim ('attests that the organization meets the legal requirements', 'the required route', 'is required wherever'), while A is the only qualified/hedged optio

### Task 1.6   (1 survivor)

#### `e43726f3`   anchor `A.6.2.4`

> The organization shall define and document verification and validation measures for the AI system and specify criteria for their use.

**Q** A development team asks whether the AI management system standard will tell them which accuracy metric and cut-off value to use for a classifier. Regarding verification and validation of an AI system, what does the standard place on the organization?

- A) The organization adopts the minimum error rates that the document publishes for each class of AI system.
- **B) The organization documents its verification and validation measures together with criteria for applying them.  ← key**
- C) The organization uses the testing tools and release criteria listed in the implementation guidance annex.
- D) The organization obtains approval from designated management for its model evaluation metrics before release.

*explanation:* Control A.6.2.4 places the obligation at the management-system level: "The organization shall define and document verification and validation measures for the AI system and specify criteria for their use." The standard governs that the measures and their criteria exist and are documented; it does not supply metrics, thresholds or test methods.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options tie the requirement to an external authority or artifact ("minimum error rates that the document publishes", "listed in the implementation guidance annex", "approval from desi

### Task 2.2   (1 survivor)

#### `7fc70283`   anchor `4.1`

> The organization shall consider the intended purpose of the AI systems that are developed, provided or used by the organization.

**Q** A general insurer is drafting the boundary of its AI management system. Its estate includes a fraud model built by its own data team, a lead-scoring feature switched on inside a licensed CRM, an assistant embedded in a purchased service-desk product, and a claims team experimenting with a public chatbot. The draft boundary reads: "AI systems engineered by the insurer's data team." On what basis should the drafting team reject that boundary?

- A) Bought-in capability is handled through the supplier alignment process rather than the boundary, which is drawn around what the insurer itself engineers.
- B) Interested-party requirements can be recorded in a separate register, which lets the bought-in capability sit outside the declared boundary.
- **C) The context determination reaches the purposes of AI systems the insurer merely uses, so the CRM feature and embedded assistant sit inside the boundary.  ← key**
- D) The boundary can remain unrecorded until an inventory of vendor features is finished, and be set down in documented form after that.

*explanation:* Clause 4.1 requires the organization to weigh the intended purpose of AI systems that are "developed, provided or used by the organization", and to determine its roles with respect to them; capability the insurer only uses (the CRM feature, the embedded assistant, the trialled chatbot) is therefore part of the context that feeds the boundary, so a boundary limited to in-house engineering omits most of the estate.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options keep the bought-in/vendor capability outside or defer the boundary; C is the lone option placing it inside, and it is also the only one naming the concrete examples (CRM feature

### Task 2.4   (2 survivors)

#### `b6d39e3f`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** A bank licenses a fraud-detection model from a vendor, hosts it on its own infrastructure, and uses a separate firm to prepare retraining data. Internal job descriptions exist for each AI team, but no party is named as owner of post-deployment drift monitoring. Reading the allocation-of-responsibilities control, how should the bank treat this gap?

- **A) Monitoring duties across the life cycle must be apportioned between the bank and the outside parties it works with.  ← key**
- B) Internal job descriptions can stand alone here, with the vendor's duties left to the contract owners to settle.
- C) A confidential channel for raising concerns about the bank's role adequately addresses the unowned monitoring task.
- D) Naming one manager with authority to report system performance upward adequately addresses the unowned monitoring task.

*explanation:* The allocation control at A.10.2 obliges the organization to make sure that duties arising anywhere in the AI system life cycle are divided up among itself, its partners, suppliers, customers and third parties. Drift monitoring after deployment is one of those life cycle duties, so it must be explicitly placed with the bank, the vendor or the data firm rather than left unowned.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): C and D end with the identical clause "adequately addresses the unowned monitoring task", so they mirror each other and cancel out; B is a dismissive 'can stand alone' option, leaving A as 

#### `460d87c8`   anchor `3.3`

> If the scope of the management system (3.4) covers only part of an organization, then top management refers to those who direct and control that part of the organization.

**Q** An insurer's AI management system is scoped to its claims-automation division only. During preparation for certification, the team debates who counts as top management for the purpose of assigning AIMS responsibilities and authorities. Which reading is consistent with the definition used by the standard?

- **A) The leaders who direct and control the claims-automation division at its highest level count as top management.  ← key**
- B) The board directing the whole insurer counts as top management, irrespective of how the system scope is drawn.
- C) The individual given authority to report on management system performance counts as top management for this purpose.
- D) Any manager to whom divisional leaders pass authority and resources counts as top management from that point on.

*explanation:* The definition of top management in clause 3.3 carries a note explaining that where a management system is scoped to only a portion of an organization, the term refers to whoever directs and controls that portion. Since the scope here is limited to the claims-automation division, the people leading that division at its highest level are top management for AIMS purposes.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B and D each carry a sweeping extra qualifier ('irrespective of how the system scope is drawn', 'Any manager... from that point on') and C narrows to a single named individual; A is the only 

### Task 2.5   (2 survivors)

#### `c4bd3604`   anchor `C.3.4`

> The quality of data used for ML and the process used to collect data can be sources of risk, as they can impact objectives such as safety and robustness (e.g. due to issues in data quality or data poisoning).

**Q** An insurer retrains its claims-triage model each quarter on records that field agents upload through a shared portal. During a review, the team finds that a subset of uploads was assembled by an outside party in a coordinated way, and that several batches were labelled by staff who had no triage training. Hardware, hosting and network controls are unchanged and operating normally. Which AI-specific risk source does this scenario most directly illustrate?

- A) The components that fail in service, and the transfer of a trained model between different systems, can be a source of risk.
- B) The breadth of operating situations the system meets, and the resulting uncertainty about its performance, can be a source of risk.
- **C) The material used to retrain the model, and the way it was collected, can be a source of risk.  ← key**
- D) The immaturity of the technology, together with limits and drift that are not yet understood, can be a source of risk.

*explanation:* The scenario concerns both the content of the retraining data and the collection route through which it arrived. Annex C, risk sources related to machine learning, treats the quality of machine learning data and the collection process as possible risk sources that can affect objectives such as safety and robustness, giving poisoned or poor-quality data as examples. Coordinated third-party submissions and untrained labelling fall squarely within that source, rather than being an infrastructure or maturity concern.

#### `40901930`   anchor `C.3.2`

> The inability to provide appropriate information to interested parties can be a source of risk (i.e. in terms of trustworthiness and accountability of the organization).

**Q** A lending organization deploys a purchased scoring model. Declined applicants ask why their applications failed, and the organization cannot describe, in terms a person can follow, which factors drove each result; the supplier treats this as proprietary. An outcome review found no difference in decline rates across applicant groups, no personal data left the organization, and change requests are handled within agreed timescales. Which AI-specific risk source is most directly present?

- **A) Being unable to give affected applicants understandable information about results can be a source of risk.  ← key**
- B) Harm to data subjects arising from disclosure of personal or sensitive records can be a source of risk.
- C) Limited ability to alter the system to correct defects or meet new demands can be a source of risk.
- D) Automated decision-making that bears unfairly on particular persons or groups can be a source of risk.

*explanation:* The scenario isolates an explainability gap: affected parties cannot be told what influenced the outcome. The Annex C risk source on lack of transparency and explainability (C.3.2) treats a failure to supply suitable information to interested parties as itself a source of risk, bearing on the organization's trustworthiness and accountability. The facts given rule out the privacy, maintainability and fairness sources.

### Task 2.8   (1 survivor)

#### `5e181194`   anchor `3.26`

> All identified risks and the risk management measures (controls) established to address them shall be reflected in the statement of applicability.

**Q** A team has finished treating the risks for two AI systems and is now finalising the organization's statement of applicability. Based on the definition of that document and its notes, what does the finished document have to show?

- **A) Every identified risk and the controls set up to address it, together with reasons for including or leaving out controls.  ← key**
- B) Every implementation guidance point drawn from Annex B, together with a reason for applying or skipping each point.
- C) Every control in the Annex A reference table recorded as adopted for the organization's AI systems and objectives.
- D) Every control left out with a stated reason, while the controls actually adopted are simply listed without reasons.

*explanation:* The definition of the statement of applicability (3.26) describes it as documentation of all necessary controls plus justification for their inclusion or exclusion, and its second note to entry requires the risks that have been identified, along with the risk management measures put in place to address them, to appear in that same document. So both the risks and their controls, with inclusion and exclusion reasoning, belong in it.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): All four begin "Every ...", but A is the only one that is symmetric (reasons for both including AND excluding controls); B, C and D are each one-sided (only skipped points, no reasons at all,

### Task 3.1   (3 survivors)

#### `88eaa24a`   anchor `C.2.2`

> A selection of dedicated specialists with interdisciplinary skill sets and expertise in assessing, developing and deploying AI systems is needed.

**Q** A lender is building and releasing a credit-scoring model. Its entire AI capability is one senior data scientist who will design the model, judge whether it is fit for use, and put it into production alone. Applying the standard's guidance on AI expertise, what does this staffing picture suggest?

- **A) It lacks the mix of dedicated specialists whose combined skills cover evaluating, building and releasing AI systems.  ← key**
- B) It is adequate for a single practitioner who holds all three of those skill areas at once.
- C) It is adequate once training records for that practitioner are retained as evidence of competence.
- D) It lacks expertise for the later life-cycle stages, while design and evaluation needs are already met.

*explanation:* The guidance on AI expertise in C.2.2 points to a group of dedicated specialists whose skill sets cut across disciplines and together cover assessing, developing and deploying AI systems. One individual carrying all three of those functions does not provide that spread of specialist expertise, so a gap exists.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Options split 2 'lacks' vs 2 'adequate'; within the 'lacks' pair, A is the general/inclusive one naming all three activity types (echoed by B's 'all three of those skill areas'), while D co

#### `c3a4e913`   anchor `A.4.6`

> As part of resource identification, the organization shall document information about the human resources and their competences utilized for the development, deployment, operation, change management, maintenance, transfer and decommissioning, as well as verification and integration of the AI system.

**Q** An organization finishing resource identification for a fraud-detection system has recorded its datasets, its modelling tools and its computing platform. Its resource records list the project's engineers by name but say nothing about what they are able to do, and the records stop at go-live. Which addition does the control on human resources call for?

- A) Records of the engineers' competences for build and deployment, with later stages captured in maintenance logs.
- B) Records naming contracted third-party staff and their competences, in-house staff being held in personnel files.
- **C) Records of the people and their competences used from build through to retirement, including verification and integration.  ← key**
- D) Records of training certificates for the named engineers, standing in place of resource documentation for people.

*explanation:* Clause A.4.6 requires resource identification to capture who is used and what competences they hold across the whole span of the system's life, from development and deployment through operation, change management, maintenance, transfer and decommissioning, and also for verification and integration work. Names alone, with the record stopping at go-live, fall short of that.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A, B and D each tack on a clause that narrows or offloads the record ('later stages in maintenance logs', 'in-house staff in personnel files', 'standing in place of'), while C is the only option w

#### `9677e009`   anchor `A.4.2`

> The organization shall identify and document relevant resources required for the activities at given AI system life cycle stages and other AI-related activities relevant for the organization.

**Q** A manufacturer produced a single resource list when its vision-inspection AI was designed. The system is now in operation, needing different computing capacity and different people, and a periodic retraining activity has begun. Which approach fits the requirement on documenting resources?

- A) Treat the design-stage list as the baseline and rely on change management to note any departures from it.
- **B) Identify and record the resources needed for the activities at each life-cycle stage and for other AI-related work.  ← key**
- C) Record the resources the manufacturer supplies itself and leave out those supplied by customers or suppliers.
- D) Record data and computing resources for each stage, keeping tools and people as listed at the design stage.

*explanation:* Clause A.4.2 requires the organization to "identify and document relevant resources required for the activities at given AI system life cycle stages and other AI-related activities relevant for the organization." A one-off design-stage list does not cover operation or the retraining activity.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options contain an explicit restriction or carve-out ('rely on change management to note departures', 'leave out those supplied by customers or suppliers', 'keeping tools and people as 

### Task 3.4   (2 survivors)

#### `6d6098c6`   anchor `A.10.3`

> The organization shall establish a process to ensure that its usage of services, products or materials provided by suppliers aligns with the organization’s approach to the responsible development and use of AI systems.

**Q** A company buys a pre-trained model and a data-labelling service from an outside vendor and uses both inside an AI system covered by its AI management system. Which action does the standard require of the company with respect to this vendor arrangement?

- **A) Put a process in place so that what it takes from vendors fits its own stance on responsible AI development and use.  ← key**
- B) Accept the vendor's own management system evidence in place of its own process, treating the vendor's certification as covering the acquired components.
- C) Hold life cycle responsibilities open until the vendor's deliverables have been received and accepted, then assign them to the internal teams involved.
- D) Require the vendor to issue the statement of applicability covering the controls applied to delivered work, and file it with the company's records.

*explanation:* The supplier control (A.10.3) places the duty on the organization itself: it has to set up a process that keeps its use of supplier-provided services, products or materials consistent with its own approach to responsible development and use of AI systems. The other options shift the duty to the vendor or delay allocation of responsibilities.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A is the shortest option and the only one that keeps the action with the organisation itself; B, C and D all hinge on the vendor's documents/deliverables, so A is the odd one out of a match

#### `a677ae70`   anchor `6.3`

> When the organization determines the need for changes to the AI management system, the changes shall be carried out in a planned manner.

**Q** An AIMS process owner concludes that a process forming part of the AI management system needs to be modified to support a new deployment. How should the modification be handled?

- **A) It is worked through as a planned activity once the need for it has been determined.  ← key**
- B) It is enacted immediately and its consequences reviewed afterwards as an unintended change.
- C) It is held back until AI objectives have been re-established at the relevant functions and levels.
- D) It is handed to the supplier accountable for the affected stage of the AI system life cycle.

*explanation:* Clause 6.3 on planning of changes requires that, once the organization has identified a need to change the AI management system, that change be effected in a planned way rather than ad hoc. The distractors confuse planned with unintended changes, import the objective-setting requirement, or move the duty to a supplier.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D each add a deflecting twist (do it immediately, hold it back, hand it to someone else), while A alone states the plain neutral 'planned once needed' procedure.

### Task 3.7   (1 survivor)

#### `3b89fb47`   anchor `7.2`

> determine the necessary competence of person(s) doing work under its control that affects its AI performance

**Q** A company holds certification to ISO/IEC 27001 and is now extending its management system to cover the AI systems it develops. The team proposes carrying its existing support and operation machinery across unchanged. Which analysis of that proposal is defensible?

- **A) Competence has to be determined afresh for people whose work affects AI performance, with documented evidence retained.  ← key**
- B) Security-related controls have to be delivered inside the existing ISO/IEC 27001 programme rather than as separate AI controls.
- C) Existing security-policy awareness briefings can stand in for making staff aware of the AI policy and its implications.
- D) Operational control can reuse the existing process criteria without establishing criteria for the AI-related processes.

*explanation:* Clause 7.2 obliges the organization to "determine the necessary competence of person(s) doing work under its control that affects its AI performance" and to hold documented information as evidence of competence; an ISMS skills matrix addresses a different body of knowledge, so competence is an element that must be rebuilt rather than inherited. The other options misread permissive integration guidance as a requirement (D.2 says security-related controls 'can' be integrated), substitute security awareness for the AI-policy awareness content required by 7.3, and ignore 8.1's requirement to establish criteria for the AI processes and implement the controls determined for AI operation.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D all assert that something 'existing' can be reused or substituted for an AI-specific requirement; A is the only option that requires a fresh, documented AI-specific action.

### Task 4.3   (1 survivor)

#### `85e27a83`   anchor `A.2.3`

> The organization shall determine where other policies can be affected by or apply to, the organization’s objectives with respect to AI systems.

**Q** A bank has published an AI policy, assigned owners for each AI system, and listed the data, tooling and computing resources behind its credit-scoring model. During an internal audit it emerges that the bank's long-standing privacy, information security and quality policies were drafted before any AI work began and have never been examined against what the bank now wants to achieve with AI. Which Annex A control category directly addresses this gap?

- **A) Establishing where the firm's existing policies bear on, or are touched by, its AI aims  ← key**
- B) Setting a schedule for re-examining the AI policy so it stays suitable and effective
- C) Producing a written policy covering how the firm builds or makes use of AI systems
- D) Assigning accountabilities for AI work across the firm according to what it needs

*explanation:* The gap is that other corporate policies have never been checked against the organization's AI objectives. Control A.2.3 (Alignment with other organizational policies) states the organization "shall determine where other policies can be affected by or apply to, the organization’s objectives with respect to AI systems." The other options describe controls the bank has already satisfied or that address a different concern.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options describe actions performed on the AI policy itself (write it, schedule its review, assign its accountabilities); A is the only one that instead points outward to the firm's othe

### Task 4.4   (1 survivor)

#### `3f1d3b6b`   anchor `A.6.2.5`

> The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment.

**Q** A development team finishes building a fraud-scoring model. Test methods and pass/fail thresholds had been written down and executed, and a monitoring rota is scheduled for go-live. However, the model is pushed into production with no written release plan, and nobody checked whether the agreed pre-release conditions and sign-offs had actually been satisfied. Which Annex A control would most directly have prevented this failure?

- **A) Recording a plan for release and confirming the conditions due before it  ← key**
- B) Setting out test and evaluation measures together with criteria for their use
- C) Fixing the elements needed to keep the system running day to day
- D) Writing down the specification for a newly built or reworked system

*explanation:* Control A.6.2.5 (AI system deployment) covers exactly this gap: "The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment." The scenario shows no deployment plan and no confirmation of pre-deployment conditions.

### Task 4.5   (3 survivors)

#### `0a2626ad`   anchor `A.8.5`

> The organization shall determine and document their obligations to reporting information about the AI system to interested parties.

**Q** A financial regulator in the organization's jurisdiction has statutory power to demand technical documentation, impact assessment results and system logs from operators of the credit-scoring AI system the organization runs. Applying the Annex A transparency controls, what does the organization do about this?

- **A) Set out in writing its reporting duties toward outside parties such as regulators.  ← key**
- B) Open a channel through which outside parties can flag harmful effects of the system.
- C) Draw up a written plan for telling system users when incidents occur.
- D) Work out and hand over the information that users of the system need.

*explanation:* The control on information for interested parties (A.8.5) is the one that addresses duties owed outward to parties such as regulators: it obliges the organization to establish and put on record what it is required to report about the AI system to those parties, which is exactly the situation created by the regulator's statutory information powers. The other options are different transparency controls aimed at inbound reports, incident notices or user-facing information.

#### `5d0353c2`   anchor `A.7.6`

> The organization shall define and document its criteria for selecting data preparations and the data preparation methods to be used.

**Q** Before training a demand-forecasting model, a development team buys a third-party dataset, fills missing entries by imputation, normalizes two variables and encodes categorical fields as numbers. Which Annex A data requirement obliges the team to record the basis on which these handling techniques were chosen?

- **A) Documented criteria for choosing the data preparation steps and methods used.  ← key**
- B) Documented details of how the dataset was acquired and selected for the system.
- C) Documented data quality requirements, with assurance that the data satisfy them.
- D) A documented process for recording where the data came from across life cycles.

*explanation:* Imputation, normalization and encoding are all data preparation activities, and the data preparation control (A.7.6) obliges the organization to set out and record the criteria by which it picks its preparations and the preparation methods it will apply. The other options are neighbouring data controls covering acquisition, quality and provenance.

#### `d2e5e889`   anchor `A.8.3`

> The organization shall provide capabilities for interested parties to report adverse impacts of the AI system.

**Q** People affected by an automated benefits-eligibility system have begun complaining through unofficial routes that its decisions are unfair, because the organization offers them no way to raise such concerns. Which Annex A control gap does this situation point to?

- **A) No means for interested parties to report harmful effects of the system.  ← key**
- B) No documented plan for notifying system users when incidents arise.
- C) No documented statement of duties to report system details to authorities.
- D) No determination of the information to be given to users of the system.

*explanation:* The external reporting control (A.8.3) is the gap: it obliges the organization to put in place a channel through which interested parties can flag negative effects of the AI system, which is exactly what these complainants lack. The distractors are other transparency controls dealing with incident notification, outward reporting obligations and user information.

### Task 4.6   (1 survivor)

#### `64abe5a5`   anchor `A.10.3`

> The organization shall establish a process to ensure that its usage of services, products or materials provided by suppliers aligns with the organization’s approach to the responsible development and use of AI systems.

**Q** A retailer licenses a CV-screening AI tool from a vendor and runs it internally for its own hiring. It builds no AI systems and sells no AI products or services. While deciding which reference controls to implement for use and for relationships, which action best fits the retailer's role?

- **A) Put in place a process so that what the vendor supplies is consistent with the retailer's responsible approach to using AI.  ← key**
- B) Leave the whole relationships category out of scope, as the retailer neither builds nor supplies any AI system.
- C) Take the published list of responsible-use objectives, such as fairness and explainability, as the complete set the retailer has to adopt.
- D) Treat the hiring managers who receive the tool's shortlists as the customers whose expectations the relationships category addresses.

*explanation:* The supplier control (A.10.3) is framed around the organization's own usage of services, products or materials obtained from suppliers and the alignment of that usage with its responsible approach to AI, so it applies to an organization that merely deploys a purchased tool rather than only to developers or vendors.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options assert a limitation or substitution ("leave the whole category out of scope", "as the complete set", "treat X as the customers") while A is the only one prescribing a positive p

### Task 4.7   (3 survivors)

#### `48e7ecba`   anchor `D.2`

> In this case, the way to implement controls which (partly) relate to information security in this document (see B.6.1.2) can be integrated with the organization’s implementation of ISO/IEC 27001.

**Q** A software firm already operates a certified information security management system and is now building an AI management system. Its lead auditor asks how far the existing security work can be reused. Which statement best reflects Annex D's position on this situation?

- **A) Work on AI management system controls that bear partly on information security may be carried out together with the firm's existing ISO/IEC 27001 implementation.  ← key**
- B) Privacy obligations and their associated controls within the AI management system may be folded into the firm's existing ISO/IEC 27001 implementation.
- C) Access protection already applied to the deployed model's interface discharges the obligation to record where its training data came from.
- D) Security work for the AI components is kept apart from the security work covering the remaining components of the system.

*explanation:* Annex D.2 states that where an organization has an ISO/IEC 27001 implementation, "the way to implement controls which (partly) relate to information security in this document (see B.6.1.2) can be integrated with the organization’s implementation of ISO/IEC 27001." Integration is contemplated for the security-related portion of the AI controls.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and B share the phrase 'existing ISO/IEC 27001 implementation' (C and D don't), and within that pair A is the hedged/qualified one ('controls that bear partly on...may be carried out toge

#### `e725e5cc`   anchor `C.2.10`

> In the context of AI and in particular with regard to AI systems based on ML approaches, new security issues should be considered beyond classical information and system security concerns.

**Q** A machine learning team argues that because its models run on infrastructure already hardened under the organization's information security programme, no further security analysis is warranted for the models themselves. Which response is best supported by the guidance on security objectives for AI?

- **A) Security questions arising specifically from machine learning approaches merit consideration in addition to conventional information and system security matters.  ← key**
- B) Coverage of the hosting infrastructure by conventional information security measures is treated as settling the security question for the models.
- C) Security for the model components is best handled as a separate exercise from security for the surrounding components.
- D) An information security management system conforming to ISO/IEC 27001 has to be in place before AI security objectives can be addressed.

*explanation:* The guidance on security objectives in C.2.10 advises that AI, and machine learning based systems in particular, raise security questions that go past the traditional information and system security concerns. Hardening of the hosting infrastructure therefore does not exhaust what should be considered for the models themselves.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only additive/inclusive option ('in addition to'), while B, C and D each state an exclusive absolute ('settling the question', 'separate exercise', 'has to be in place before').

#### `4efdf91c`   anchor `3.26`

> All identified risks and the risk management measures (controls) established to address them shall be reflected in the statement of applicability.

**Q** An organization's AI risk assessment identifies a risk that is addressed by a control it will implement jointly with its existing information security programme. When the organization prepares its statement of applicability, how should this risk and control be handled?

- **A) Both the identified risk and the measure put in place to address it are reflected in the statement of applicability.  ← key**
- B) Controls delivered through the existing security programme are recorded in that programme's documentation instead.
- C) The listing is confined to controls reproduced in Annex A, with organization-defined controls held elsewhere.
- D) Reasoning is recorded for the controls that were left out, while controls brought in need no accompanying rationale.

*explanation:* The definition of the statement of applicability, at 3.26 Note 2, directs that every risk the organization has identified, together with the risk management measures established to treat those risks, is carried into that statement. Choosing to deliver a control jointly with another management system such as an information security management system does not take the risk or the control out of the AI statement of applicability.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options (B, C, D) each assert that something is excluded or documented elsewhere; A is the only one asserting full inclusion of both elements.

### Task 5.1   (1 survivor)

#### `041f2137`   anchor `3.13`

> effectiveness extent to which planned activities are realized and planned results are achieved

**Q** An AIMS team is choosing an indicator that speaks to the effectiveness of its AI management system, rather than to some other concept used in the terminology of AI management systems. Which description corresponds to effectiveness?

- **A) The extent to which the activities the organization planned are carried out and the results it planned for are obtained.  ← key**
- B) Establishing what state a given system, procedure or activity is currently in, by supervising or observing it.
- C) The process the organization carries out in order to arrive at a value for a characteristic of interest.
- D) The score an AI model achieves against a chosen technical metric, such as an agreed F1 value.

*explanation:* Clause 3.13 defines effectiveness as the "extent to which planned activities are realized and planned results are achieved", so an effectiveness indicator asks whether what was planned happened and delivered the intended results. The other options describe monitoring (3.20), measurement (3.19) and a technical model performance metric discussed in the operation and monitoring guidance (B.6.2.6).

### Task 5.5   (1 survivor)

#### `05c54c05`   anchor `3.4`

> management system set of interrelated or interacting elements of an organization (3.1) to establish policies (3.5) and objectives (3.6), as well as processes (3.8) to achieve those objectives

**Q** In the AI management system standard's terminology, a management system is best understood as which of the following?

- **A) Connected organizational elements that set policies and objectives, together with the processes used to reach them.  ← key**
- B) Documented audit procedures that a certification body follows when it evaluates a client organization.
- C) An agreed programme of initial, surveillance and recertification audits covering a three-year period.
- D) Declared arrangements for impartiality and auditor competence held by the body issuing certificates.

*explanation:* The definition given in the terms clause 3.4 frames a management system around the organization's own interacting parts, which exist to set its policy direction and objectives and to run the processes that deliver them. Audit procedures, certificate cycles and certification-body impartiality belong to the conformity assessment documents, not to this definition.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Options B, C and D all explicitly mention certification-body/audit wording, while A is the only option with no reference to audits or certification bodies — the odd one out.

