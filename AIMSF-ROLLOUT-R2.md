# AIMS-F rollout R2 (the thin tasks, after the director-93 promotions)

**Nothing is inserted.** Every item below is in an artifact awaiting the director's read.

| | |
|---|---|
| tasks | 9 |
| attempted | 47 |
| survivors | **36** |
| spend | **$12.04** |
| dollars per survivor | **$0.334** |

## Spend by role

At $15 / $75 per million tokens (input / output).

| role | calls | input | output | USD |
|---|---|---|---|---|
| solver | 88 | 213758 | 19679 | $4.68 |
| paraphrase | 25 | 120954 | 26396 | $3.79 |
| writer | 2 | 6745 | 19979 | $1.60 |
| options-probe | 40 | 24492 | 13603 | $1.39 |
| de-cue | 4 | 4973 | 4364 | $0.40 |
| solver-recheck | 3 | 7600 | 785 | $0.17 |
| **total** | **162** | **378522** | **84806** | **$12.04** |

## Per task

| task | batch | shortfall | attempted | survived | rejections by gate | key-pick | flag | cue flags | distinct anchors |
|---|---|---|---|---|---|---|---|---|---|
| 2.2 | R2 probe | 6 | 6 | **5** | `structure` 1, `reproduction` 1 | 100% (5/5) | 100% (5/5) | odd-verdict 2, only-hedged 2, only-negation 1 | 4 |
| 2.4 | R2 probe | 5 | 5 | **3** | `solver` 1, `modal-fidelity` 1, `reproduction` 1 | 100% (3/3) | 100% (3/3) | odd-verdict 1, only-hedged 1, shared-phrase 1 | 3 |
| 2.7 | R2 rest | 6 | 6 | **5** | — | 100% (5/5) | 100% (5/5) | shared-phrase 3, odd-verdict 1, length 1 | 4 |
| 2.8 | R2 rest | 6 | 6 | **5** | `solver` 1 | 100% (5/5) | 80% (4/5) | length 2, shared-phrase 1, odd-verdict 1 | 4 |
| 3.1 | R2 rest | 6 | 6 | **4** | `solver` 1, `modal-fidelity` 1, `reproduction` 1 | 50% (2/4) | 50% (2/4) | length 1, only-negation 1 | 4 |
| 3.2 | R2 rest | 4 | 4 | **4** | — | 100% (4/4) | 100% (4/4) | shared-phrase 2, odd-verdict 1, only-hedged 1 | 3 |
| 3.4 | R2 rest | 6 | 6 | **4** | `solver` 1, `solver-split` 1 | 100% (4/4) | 100% (4/4) | shared-phrase 2, length 1, grammar 1 | 4 |
| 5.1 | R2 rest | 5 | 5 | **4** | `solver-split` 1 | 100% (4/4) | 100% (4/4) | shared-phrase 3, grammar 1 | 4 |
| 5.3 | R2 rest | 3 | 3 | **2** | — | 100% (2/2) | 100% (2/2) | odd-verdict 1, shared-phrase 1 | 2 |

**Rejections across the run:** `solver` 4, `reproduction` 3, `modal-fidelity` 2, `solver-split` 2, `structure` 1

### The options probe, against the authored bank

**These are two measurements and only one of them compares to 98 percent.** The authored bank's
98 percent is a KEY-PICK rate: how often the probe, shown the options alone with no stem, picks the
key. A FLAG is narrower -- it picked the key AND could name the cue it used -- so the flag count is a
subset of the key-pick count by construction. Reading a flag rate against 98 percent would report an
improvement nobody measured.

| | rate | |
|---|---|---|
| **key-pick, these survivors** | **94%** (34/36) | the figure comparable to 98% |
| key-pick, authored bank | 98% | measured in the 480-item audit |
| key-pick, chance | 25% | four options |
| flag (picked the key AND named the cue) | **92%** (33/36) | a SUBSET of key-pick, not comparable to 98% |
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

`quote-noise`: **0**. That count is what will say later whether
the extraction repair is worth money.

`solver-split`: **2** — items the solver answered two different
ways across two runs with the options shuffled.

**No task hit a stop condition** — every one had at least half its attempts survive and the writer
produced items for all of them.

---

## Every survivor, in full

### Task 2.2   (5 survivors)

#### `74b18e4a`   anchor `4.1`

> The organization shall consider the intended purpose of the AI systems that are developed, provided or used by the organization.

**Q** A general insurer builds no models itself. Its claims platform, bought from a vendor, ships with an embedded risk-scoring feature, and its HR suite offers an optional CV-ranking add-on that two teams have switched on. The scoping team is working through context issues before fixing the AIMS boundary. Which approach fits the requirement on understanding context?

- A) Cover the systems the insurer develops or provides in the context work, and handle the bought-in features through supplier contract review alone.
- B) Postpone deciding the insurer's roles relative to these systems until an impact assessment for each feature has been commissioned.
- **C) Take account of what the vendor's scoring and ranking features are meant to achieve where the insurer runs them, alongside anything it builds.  ← key**
- D) Leave climate change to the interested-party analysis rather than to the determination of context issues.

*explanation:* Clause 4.1 extends the context determination beyond what an organization builds: it must weigh the purpose an AI system is meant to serve whether that system is developed in house, supplied to others, or simply operated as a bought-in capability. The vendor's scoring and ranking features, being in live use, are therefore in view when context issues are worked through, and a supplier process under A.10.3 sits alongside that rather than replacing it.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A, B and D each narrow, defer or exclude something ('alone', 'Postpone... until', 'rather than'), while C is the only option that adds scope inclusively ('alongside anything it builds').

#### `1f6aed28`   anchor `4.2`

> The organization shall determine: — the interested parties that are relevant to the AI management system; — the relevant requirements of these interested parties; — which of these requirements will be addressed through the AI management system.

**Q** During scoping, a bank lists a financial regulator, a works council, enterprise customers and internal audit, each with stated expectations about its AI use. Several of those expectations will be handled by legal and procurement rather than by the management system. What does the requirement on needs and expectations of interested parties call for here?

- A) List only the expectations the team has already agreed the management system will take on.
- **B) Capture the relevant requirements of each of these parties, then settle which of them the management system will address.  ← key**
- C) Forward every expectation to risk assessment, which then rules on which parties are relevant.
- D) Confine the analysis to the regulator and the enterprise customers, treating internal functions as covered by policy.

*explanation:* Clause 4.2 directs the organization to identify which interested parties are relevant, establish what their relevant requirements are, and then decide which of those the management system itself will take on. The capture step therefore comes first, and the decision about what the AIMS will handle follows; expectations routed to legal or procurement are still recorded as part of the determination.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A, C and D each contain an absolute/restrictive qualifier ('only', 'every', 'Confine ... to'), while B is the one unrestricted two-step option and also the longest.

#### `c20a3808`   anchor `A.10.3`

> The organization shall establish a process to ensure that its usage of services, products or materials provided by suppliers aligns with the organization’s approach to the responsible development and use of AI systems.

**Q** A retailer's AI estate consists of a hosted document-classification service and an analytics product whose vendor added a forecasting model in the latest release. Neither was built in-house. Which action meets the supplier-related control?

- **A) Run a process that checks vendor-provided services and products against the retailer's own approach to responsible AI development and use.  ← key**
- B) Require each vendor to hold certification against this document before its service may remain in use.
- C) Bring the vendors' own operations inside the retailer's management system boundary and audit them as internal processes.
- D) Keep the hosted service outside the retailer's own arrangements and rely on the vendor's published governance statements.

*explanation:* The supplier control (A.10.3) calls for a process that keeps the retailer's use of supplier-supplied services, products or materials consistent with its own stance on developing and using AI responsibly. The test is that consistency with the retailer's own stance — not vendor certification, not treating vendor operations as the retailer's own processes, and not deferring to the vendor's published statements.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only moderate 'run a process to check' option; the other three state absolutes (require certification before use, bring vendors inside the boundary, rely solely on vendor statements)

#### `48064135`   anchor `4.4`

> The organization shall establish, implement, maintain, continually improve and document an AI management system, including the processes needed and their interactions, in accordance with the requirements of this document.

**Q** A logistics firm has published a scope statement and an AI policy and has named owners for its intake, evaluation and deployment processes. A reviewer finds nothing describing how those three processes feed one another. Which expectation about the management system applies?

- A) Interactions between processes are described only where a process crosses a business unit boundary.
- **B) The system, the processes it needs and the way those processes interact are established, maintained and documented.  ← key**
- C) A documented scope statement together with an AI policy is what the requirement for the system asks for.
- D) Process interactions surface through performance evaluation rather than in the documentation of the system.

*explanation:* Clause 4.4 covers the management system together with, in its words, "the processes needed and their interactions", so the links between intake, evaluation and deployment sit inside what the organization has to set up, keep up and document.

*options-only probe FLAG (only-negation):* picked the key from the options alone and named a cue (only-negation): A, C and D each contain a restrictive or contrastive limiter ("only where", "together with ... is what the requirement asks for", "rather than"), while B is the sole unqualified statement a

#### `81ddd809`   anchor `4.2`

> Relevant interested parties can have requirements related to climate change.

**Q** At a scoping workshop, an investor group and a major customer have each raised expectations about the energy consumption of the firm's model training. A participant asks whether such expectations have any place in the interested-party work for the management system. Which response is sound?

- A) Expectations of this kind sit outside the management system and belong in sustainability reporting.
- B) Once a party has raised them, climate-related expectations have to be addressed through the management system.
- **C) Requirements bearing on climate change can come from relevant interested parties and be captured in this work.  ← key**
- D) Climate-related expectations are handled as internal context issues rather than as interested-party requirements.

*explanation:* The note to clause 4.2 records that 'Relevant interested parties can have requirements related to climate change', so such expectations can properly be captured when interested-party requirements are determined.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): C is the only option phrased permissively ('can come from... and be captured'), while A, B and D each assert an exclusive or obligatory rule ('outside', 'have to be', 'rather than').

### Task 2.4   (3 survivors)

#### `63e98f56`   anchor `A.10.2`

> The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** An insurer runs a claims triage model that is hosted by a vendor, trained on data labelled by an external annotation firm, and operated by the insurer's own claims team. Applying the control on allocating responsibilities, what does this arrangement call for?

- **A) Life cycle responsibilities are apportioned across the insurer, its partners, suppliers, customers and any other third parties involved.  ← key**
- B) Life cycle responsibilities stay with the insurer, and the two external firms are engaged purely through contractual service terms.
- C) Life cycle responsibilities rest mainly with the vendor that built and hosts the model rather than with the insurer that operates it.
- D) Responsibilities are settled internally to suit the insurer's needs, and external parties are covered by the channel for raising concerns.

*explanation:* The allocating-responsibilities control (A.10.2) obliges the organization to see that duties arising anywhere in the life cycle of its AI system are divided up among itself and the partners, suppliers, customers and other outside parties involved. Keeping them internal, pushing them all onto one supplier, or substituting a concerns channel does not meet that.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A is the only option that spreads responsibility across every party listed (insurer, partners, suppliers, customers, other third parties), while B, C and D each restrict it to one party — A i

#### `6ea4afde`   anchor `A.3.2`

> Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization.

**Q** A start-up asks whether the AI management system controls hand it a fixed roster of AI job titles it has to create. What is the correct understanding of the control on AI roles and responsibilities?

- **A) AI roles and responsibilities are defined and allocated to match what the organization actually needs.  ← key**
- B) Named owners are mandated for each area listed in the implementation guidance, such as safety, privacy and data quality.
- C) AI roles may be left undefined where existing management system roles already provide general accountability.
- D) AI roles are settled by top management privately and need not be made known beyond the people appointed.

*explanation:* The control at A.3.2 requires AI roles and responsibilities to be defined and allocated in line with what the organization itself needs, so the set of roles is shaped by the organization rather than handed down as a fixed roster. The areas named in the implementation guidance (B.3.2) are examples that can require defined roles, and that guidance is expressed as should/can rather than as a mandated list; leaving roles undefined, or not communicating assignments, both fall short.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B, C and D each carry an extreme/restrictive qualifier ('mandated for each area', 'may be left undefined', 'privately and need not be made known'), while A is the only moderately-worded optio

#### `689452e1`   anchor `3.3`

> Note 2 to entry: If the scope of the management system (3.4) covers only part of an organization, then top management refers to those who direct and control that part of the organization.

**Q** A holding group has drawn its AI management system scope around one analytics subsidiary only. When responsibilities and authorities for relevant AI roles are assigned, who is meant by "top management" in this case?

- **A) Those who direct and control the analytics subsidiary at its highest level.  ← key**
- B) The group board that directs the whole organization, whatever scope has been declared.
- C) The person given the authority for system conformance and for reporting on performance.
- D) Any subsidiary manager who has been delegated authority and resources for the AI work.

*explanation:* The definition of top management in clause 3.3 carries a note explaining that where the management system covers only a portion of an organization, the term refers instead to the people who direct and control that portion. The group board is therefore not the referent here; the assignee of conformance and reporting authority and any delegated manager are recipients of authority, not top management itself.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B and D are broadened by sweeping quantifiers ('the whole organization, whatever scope', 'Any subsidiary manager') while A alone keeps the tight textbook wording 'direct and control ... at 

### Task 2.7   (5 survivors)

#### `7e485e04`   anchor `6.1.2`

> assess the potential consequences to the organization, individuals and societies that would result if the identified risks were to materialize

**Q** A product team argues that harm to end users and the wider public is the exclusive territory of the AI system impact assessment, and that the AI risk assessment should confine itself to commercial exposure. Judged against the required content of the risk assessment process, how should that position be appraised?

- **A) It is unsound: the analysis step of the risk assessment already weighs what would befall the organization, individuals and society if a risk came about.  ← key**
- B) It is a workable division of labour: business loss drives the risk analysis, while effects on people are handled by the separate impact study.
- C) It is sound in part: the risk assessment estimates likelihood, while the severity of effects on people is worked out only in the impact study.
- D) It is sound once the impact study has been shared with interested parties, after which consequences for people enter the risk work.

*explanation:* The analysis step of the risk assessment process (6.1.2 d) 1)) calls for an appraisal of what the organization, people and society would suffer should an identified risk come about. The two assessments are therefore not divided according to who is harmed.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A is the only option that rejects the premise ("It is unsound"); B, C and D all affirm it as sound/workable, making A the odd verdict out.

#### `b938cea5`   anchor `8.4`

> The organization shall perform AI system impact assessments according to 6.1.4 at planned intervals or when significant changes are proposed to occur. The organization shall retain documented information of the results of all AI system impact assessments.

**Q** An organization completed an impact assessment for its recruitment AI when the system first went live two years ago and filed the report. A substantial redesign of the scoring model is now being proposed. What does the operational requirement covering impact assessments call for in this situation?

- A) Nothing further until the redesign reaches production, when the filed report is refreshed to match the live system.
- B) A fresh AI risk assessment covering the redesign, which stands in place of repeating the impact work for the same change.
- **C) A further impact assessment in connection with the proposed change, with its results held as documented information.  ← key**
- D) A review of the written assessment method, retained as documented information, rather than a new assessment of the system.

*explanation:* Clause 8.4 ties the performance of impact assessments to planned intervals or to significant changes 'proposed to occur', and requires results to be retained.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B and D each tack on a dismissive clause ('stands in place of', 'rather than') and A is the lone do-nothing option, leaving C as the only plain positive requirement that also carries the 'd

#### `551ea490`   anchor `A.5.2`

> The organization shall establish a process to assess the potential consequences for individuals or groups of individuals, or both, and societies that can result from the AI system throughout its life cycle.

**Q** An internal audit finds that a provider's impact assessment procedure stops at product release: nothing is assessed once the model is in service or when it is retired. Against the control governing the impact assessment process, what correction is indicated?

- **A) Broaden the procedure so that potential consequences for people and societies arising from the system across its life cycle are assessed.  ← key**
- B) Leave the procedure at release and cover the later stages through monitoring of risk treatment effectiveness instead.
- C) Confine the procedure to intended use settled at launch and hand foreseeable misuse to the security testing team.
- D) Keep the procedure as it is and record the deployment context, which stabilises once the product has been released.

*explanation:* Control A.5.2 requires a process assessing potential consequences for individuals, groups and societies 'throughout its life cycle', so a procedure ending at release is incomplete.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options begin with limiting verbs ("Leave...", "Confine...", "Keep... as it is") and hand work off elsewhere, while A is the lone option that broadens scope and stands alone without a

#### `778b6a16`   anchor `6.1.2`

> e) evaluates the AI risks to: 1) compare the results of the risk analysis with the risk criteria (see 6.1.1); 2) prioritize the assessed risks for risk treatment.

**Q** A governance board asks which assessment gives it an ordered set of AI risks showing where treatment effort should go first. Which response is correct, and on what basis?

- A) The impact assessment, whose documented consequences are the material that sets treatment order for the board.
- **B) The risk assessment, whose evaluation step weighs the analysis against the organization's criteria and ranks risks for treatment.  ← key**
- C) The impact assessment, whose process determines a level of risk for each consequence identified for individuals and societies.
- D) Either assessment may supply it, as long as the organization documents the outcome and keeps it available to the board.

*explanation:* The evaluation step in 6.1.2 e) requires comparison with the risk criteria and asks the organization to 'prioritize the assessed risks for risk treatment'; the impact assessment's output is documented consequences.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Two options open with the identical phrase "The impact assessment" and one is a hedged "either assessment" catch-all, leaving B as the single uniquely-named alternative.

#### `3d10a844`   anchor `3.24`

> formal, documented process by which the impacts on individuals, groups of individuals, or both, and societies are identified, evaluated and addressed by an organization developing, providing or using products or services utilizing artificial intelligence

**Q** A start-up holds a quarterly discussion about how its AI affects users and the public, writes nothing down, and tells an assessor the conversation is sufficient. Judged against how an AI system impact assessment is characterised and what must be kept, what is absent?

- A) A statement of realistic likelihood attached to each effect on users raised in the discussion.
- B) A ranked register of the firm's risks measured against its established risk criteria.
- **C) A formal, recorded process in which effects on people and societies are identified, evaluated and dealt with.  ← key**
- D) A written description of the assessment approach kept on file, individual outcomes needing no retention.

*explanation:* The definition in 3.24 describes a 'formal, documented process' in which impacts are identified, evaluated and addressed; an unrecorded conversation does not meet it.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): Three options carry a narrowing qualifier ("likelihood attached", "against its established risk criteria", "individual outcomes needing no retention"), while C alone is an unqualified generic defi

### Task 2.8   (5 survivors)

#### `12b09f86`   anchor `8.3`

> When risk treatment options as defined by the risk treatment plan are not effective, these treatment options shall be reviewed and revalidated following the risk treatment process according to 6.1.3 and the risk treatment plan shall be updated.

**Q** Six months into operation, monitoring shows that a control named in the AI risk treatment plan is not reducing the risk it was selected for. What does ISO/IEC 42001 require the organization to do?

- A) Record the shortfall and have designated management accept the remaining risk as it stands.
- B) Verify effectiveness again at the next scheduled audit and retain the results as documented information.
- **C) Take the treatment option back through the treatment process, revalidate it, and update the plan.  ← key**
- D) Drop the control from the statement of applicability, noting that assessment no longer deems it necessary.

*explanation:* Clause 8.3 deals with treatment options that turn out to be ineffective: the option is put back through the treatment process for review and revalidation, and the plan is then revised accordingly. Acceptance of residual risk, later re-verification or removal from the statement of applicability do not discharge that requirement.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): C is the only option that stacks three chained actions (re-run the process, revalidate, update the plan), while A, B and D each state one action plus a trailing justifying clause.

#### `bc555466`   anchor `8.3`

> When risk assessments identify new risks that require treatment, a risk treatment process in accordance with 6.1.3 shall be performed for these risks.

**Q** A scheduled reassessment of a deployed recommendation system surfaces two previously unknown risks that need treating. How does ISO/IEC 42001 expect these to be handled?

- **A) Both risks are put through the defined risk treatment process, as any risk needing treatment is.  ← key**
- B) Both risks are logged and taken up when risks and opportunities are next planned.
- C) Both risks are treated only where controls already deemed necessary are shown not to cover them.
- D) Both risks are reported to designated management, whose acceptance of them closes the matter.

*explanation:* Under the operational risk treatment clause (8.3), newly identified risks that call for treatment are run through the organization's established treatment process, which 'shall be performed for these risks' (8.3). Waiting for the next planning cycle, first screening the risks against controls already in place, or merely escalating them for acceptance are not what the clause provides for.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): All four start 'Both risks are...', but B, C and D each attach a limiting or terminating condition ('when next planned', 'only where...', 'acceptance closes the matter'), while A alone stat

#### `e8f77542`   anchor `3.26`

> documentation of all necessary controls (3.23) and justification for inclusion or exclusion of controls

**Q** A team is drafting the statement of applicability for its AI management system. Which description matches what that document is to contain?

- A) Each control drawn from the reference table, with the matching implementation guidance recorded against it.
- **B) All controls the organization found necessary, with reasons for their inclusion and exclusion.  ← key**
- C) The treatment plan together with the management approval that accepts the residual AI risks.
- D) The organization's risk criteria and the threshold separating acceptable from non-acceptable risk.

*explanation:* The defined term in 3.26 characterises the statement of applicability as the record of every control deemed necessary, together with the reasoning for keeping or leaving out controls. Implementation guidance, the approved plan and the risk criteria are separate artefacts.

#### `006aa6eb`   anchor `A.1`

> Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).

**Q** While treating a risk, a provider concludes that it needs a control with no counterpart among the reference controls in Table A.1. Which statement reflects ISO/IEC 42001?

- **A) The organization can design a control of its own and put it into use.  ← key**
- B) The organization can adopt the nearest listed control and record the gap as an exception.
- C) The organization needs to map its own control to a listed control objective before use.
- D) The organization can treat the listed controls as a required baseline and extend it after approval.

*explanation:* The general text of Annex A presents Table A.1 as a reference set rather than a mandatory one: an organization may devise and apply controls of its own making ('can design and implement their own controls', A.1). No substitution, mapping or baseline-plus-approval mechanism is set out.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A is the only option with no attached procedural qualifier — B, C and D each append a condition clause ('record the gap as an exception', 'before use', 'after approval') — and it is also the short

#### `18effc32`   anchor `6.1.1`

> The organization shall establish and maintain AI risk criteria that support: — distinguishing acceptable from non-acceptable risks; — performing AI risk assessments; — conducting AI risk treatment; — assessing AI risk impacts.

**Q** Before an organization can separate the AI risks it will accept from those it will treat, what does ISO/IEC 42001 require it to have established?

- A) A statement of applicability naming the necessary controls, with reasons for inclusion and exclusion.
- B) A treatment plan approved by designated management, together with acceptance of the residual risks.
- **C) Risk criteria, established and maintained, that also support assessment, treatment and impact judgements.  ← key**
- D) An assessment covering each AI system, from which acceptability thresholds are afterwards derived.

*explanation:* Clause 6.1.1 requires the organization to 'establish and maintain AI risk criteria' that support distinguishing acceptable from non-acceptable risks, performing assessments, conducting treatment and assessing impacts. The statement of applicability and the approved plan come later in the process, and criteria are not derived from the assessment after the fact.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): D is the only option that adds a reversed-sequence qualifier ('afterwards derived'), a typical distractor tell; of the rest, C is the only umbrella option spanning three functions (assessment

### Task 3.1   (4 survivors)

#### `977bd4ff`   anchor `A.4.6`

> As part of resource identification, the organization shall document information about the human resources and their competences utilized for the development, deployment, operation, change management, maintenance, transfer and decommissioning, as well as verification and integration of the AI system.

**Q** A deployment team keeps a resource register that is current for the datasets in use, the model-building tools and the cloud hardware, but it says nothing about who performs the work or what those people are able to do. Applying the resource identification requirements of the AIMS, what does the team still have to record?

- **A) The people used across build, run, change, maintenance and retirement work, together with their competences.  ← key**
- B) The origin of each dataset and the process used to label it before training begins.
- C) Confirmation that the management system as a whole is being kept going and improved over time.
- D) The families of algorithm and the evaluation methods applied to the model in development.

*explanation:* The human resources control (A.4.6) makes staffing part of resource identification: the organization has to keep documented information on the people used at every stage of the system's life, from building and running it through to changes, upkeep, hand-over and retirement, including verification and integration work, and on what those people are competent to do. The register already covers data, tooling and computing resources, so the people dimension is the remaining gap.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): B and D form a matched technical pair (dataset labelling / algorithm families), leaving A and C as odd ones; A is the longest option and the only one with an enumerated list of stages plus an adde

#### `535a136c`   anchor `A.4.2`

> The organization shall identify and document relevant resources required for the activities at given AI system life cycle stages and other AI-related activities relevant for the organization.

**Q** An organization is beginning resource identification for its AI work and wants to fix the scope of what has to be identified and written down. Which statement fits the requirement?

- **A) Resources needed for activities at the relevant life-cycle stages and for other AI work it carries out.  ← key**
- B) Resources the organization itself owns and directly controls, with supplier-furnished items instead handled through procurement contract terms.
- C) Resources drawn on once a system is live in production, revisited whenever a significant change is introduced.
- D) Data, tooling and computing assets used for development, with people handled instead through separate competence and training evidence.

*explanation:* Clause A.4.2 fixes the scope of resource documentation: the organization has to identify and record whatever resources its AI system life-cycle stages, and its other AI-related activities, call for. That scope is not confined to assets the organization owns, not limited to the period after go-live, and not restricted to non-human categories.

*options-only probe FLAG (only-negation):* picked the key from the options alone and named a cue (only-negation): B, C and D each tack on a narrowing/exclusionary clause ('instead handled through procurement contract terms', 'only once a system is live', 'people handled instead through separate... evid

#### `386668b0`   anchor `A.4.5`

> As part of resource identification, the organization shall document information about the system and computing resources utilized for the AI system.

**Q** A team records that its models run on edge devices, notes the network and storage capacity available to them, and lists the processing requirements each model places on the hardware. Which resource documentation obligation is the team addressing?

- **A) Recording the system and computing resources drawn on by the AI system.  ← key**
- B) Recording the tooling resources drawn on by the AI system.
- C) Recording the data resources drawn on by the AI system.
- D) Providing what is needed to keep the management system running and improving.

*explanation:* Hosting location, processing capacity and storage all describe the computing environment in which the system runs. Clause A.4.5 requires documentation of the system and computing resources used by the AI system, as part of identifying resources.

#### `3a3d26fa`   anchor `A.4.3`

> As part of resource identification, the organization shall document information about the data resources utilized for the AI system.

**Q** A reviewer examines an organization's resource records for a machine learning product. The records cover the development tools, the computing environment and the staff involved with their competences, but nothing describes the training, validation or test material used to build the model. What has to be added to close this gap?

- **A) Recorded information about the data drawn on for the AI system.  ← key**
- B) Recorded evidence of competence for the persons performing the work.
- C) An appraisal of the system's effects on individuals, groups and societies.
- D) A determination of what is needed to keep the management system improving.

*explanation:* Clause A.4.3 makes data one of the resource categories that must be written down when resources are identified, so the missing record of the material used to build the model is what completes the set. The tooling, computing and human resource records described in the stem are already in place.

### Task 3.2   (4 survivors)

#### `e4a5ba5e`   anchor `7.2`

> ensure that these persons are competent on the basis of appropriate education, training or experience; — where applicable, take actions to acquire the necessary competence, and evaluate the effectiveness of the actions taken. Appropriate documented information shall be available as evidence of competence.

**Q** An assessor asks how an organization satisfies the competence obligation for people whose work affects its AI performance. Which statement is consistent with the AI management system requirements?

- **A) Competence rests on suitable schooling, training or experience, and the organization retains records of it.  ← key**
- B) Briefing these people on the AI policy and the benefits of better AI performance establishes their competence.
- C) Competence is determined for direct employees, while contracted workers are covered by the awareness provisions instead.
- D) The organization settles what it will communicate, when and to whom, and that plan evidences competence.

*explanation:* Clause 7.2 requires the organization to "ensure that these persons are competent on the basis of appropriate education, training or experience" and to keep appropriate documented information as evidence of competence. Awareness and communication planning are separate obligations and do not substitute for this.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B, C and D each define competence by borrowing a different concept (briefing/awareness, contracted vs direct workers, a communication plan), while A alone is a self-contained direct definitio

#### `34d16478`   anchor `5.2`

> The AI policy shall: — be available as documented information; — refer as relevant to other organizational policies; — be communicated within the organization; — be available to interested parties, as appropriate.

**Q** Top management has approved an AI policy. Which description matches how the policy is to be handled and made known?

- **A) It is kept as documented information, shared inside the organization, and made available to interested parties where suitable.  ← key**
- B) It is kept as documented information for internal use, with any release outside decided case by case by internal audit.
- C) It is drafted by the AI governance function and issued to workers once they have finished their training.
- D) It fixes the organization's AI objectives directly and is passed to interested parties who ask for it in writing.

*explanation:* Clause 5.2 states that the policy shall "be available as documented information; — refer as relevant to other organizational policies; — be communicated within the organization; — be available to interested parties, as appropriate", so internal communication and conditional external availability both apply.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D each tack on a narrow extra condition ('case by case by internal audit', 'once they have finished their training', 'who ask for it in writing'), while A alone lists the general, 

#### `f82e79ad`   anchor `A.3.3`

> The organization shall define and put in place a process to report concerns about the organization’s role with respect to an AI system throughout its life cycle.

**Q** An organization wants people to be able to raise worries about how it is acting in relation to an AI system. Which arrangement corresponds to the control on reporting of concerns?

- **A) A defined and operating process for raising concerns about its role in an AI system over the life cycle.  ← key**
- B) Arrangements setting out what will be communicated about AI incidents, when it will be said, and to which outside bodies.
- C) Briefings that make workers aware of the AI policy and the consequences of not meeting the management system's requirements.
- D) Records demonstrating that the people who handle such concerns hold suitable schooling, training or experience for the role.

*explanation:* Control A.3.3 requires the organization to "define and put in place a process to report concerns about the organization’s role with respect to an AI system throughout its life cycle". The other options describe communication planning, awareness and competence evidence.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and D are the only pair sharing the keyword "concerns", and D's back-reference ("such concerns") reads as derivative of A's wording, making A the anchor of the pair.

#### `2f10b746`   anchor `7.2`

> NOTE 2 Applicable actions can include, for example: the provision of training to, the mentoring of, or the re- assignment of currently employed persons; or the hiring or contracting of competent persons.

**Q** A competence shortfall has been identified among people whose work affects AI performance. What does the standard indicate about the actions that may be used to close it?

- **A) Mentoring current staff or contracting competent people can be among the actions taken.  ← key**
- B) Hiring competent persons is the step indicated where re-assigning current staff proves impractical.
- C) Making these people aware of the policy and their contribution can close the shortfall.
- D) The shortfall is recorded and passed on through the internal communication arrangements.

*explanation:* The note to clause 7.2 offers examples: "Applicable actions can include, for example: the provision of training to, the mentoring of, or the re- assignment of currently employed persons; or the hiring or contracting of competent persons." These are illustrative options, not a fixed sequence.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only option that lists two alternatives joined by "or" and hedges with "can be among the actions taken", while B, C and D each name one single specific action or outcome.

### Task 3.4   (4 survivors)

#### `693d1f0f`   anchor `A.10.3`

> Suppliers The organization shall establish a process to ensure that its usage of services, products or materials provided by suppliers aligns with the organization’s approach to the responsible development and use of AI systems.

**Q** A company buys a pre-trained model and labelled datasets from outside vendors for use in one of its AI systems. What does the standard's supplier provision call for?

- A) Life cycle accountability passes to the vendors for the components that they supply to the company.
- **B) A process keeping vendor-supplied items in line with the company's stance on responsible AI.  ← key**
- C) Measurable objectives set for each vendor at the relevant functions and levels of its work.
- D) Effectiveness monitoring of the supplied components carried out by the vendors, with corrective action considered.

*explanation:* A.10.3 requires the acquiring organization to put a process in place so that what it takes in from suppliers — services, products or materials — stays consistent with how that organization says it develops and uses AI responsibly. The duty rests with the buyer, not with the vendors.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and D both hand the activity/accountability to the vendors (a matched distractor pair) and C is vendor-centred too, while B is the only option framed around the company's own policy.

#### `b8a58c54`   anchor `6.3`

> When the organization determines the need for changes to the AI management system, the changes shall be carried out in a planned manner.

**Q** A provider concludes that its AI management system needs to be modified. According to the requirement on changes, how is that modification to be handled?

- A) It is treated as an unintended change whose effects are reviewed afterwards.
- B) It waits until monitoring shows that the intended results are not being achieved.
- **C) It is carried out in a way that has been planned beforehand.  ← key**
- D) It is logged as an extra control with justification for its inclusion.

*explanation:* Clause 6.3 states that where the need for changes to the AI management system is determined, 'the changes shall be carried out in a planned manner'.

*options-only probe FLAG (length):* picked the key from the options alone and named a cue (length): A and C are direct mirror-opposites ("unintended ... afterwards" vs "planned beforehand"), marking them as the real contrast pair, and C is the shortest, plainest member of that pair while B and D

#### `f55f3864`   anchor `6.1.3`

> The organization shall obtain approval from the designated management for the AI risk treatment plan and for acceptance of the residual AI risks.

**Q** Who gives approval for an organization's AI risk treatment plan and for accepting the risk that remains after treatment?

- **A) The management designated for the purpose inside the organization.  ← key**
- B) The supplier, for residual risk arising from what it provides.
- C) The internal audit function, once control effectiveness is confirmed.
- D) Top management, as part of setting objectives at relevant levels.

*explanation:* Clause 6.1.3 places sign-off of the treatment plan, and of accepting whatever risk is left over afterwards, with the management the organization has designated for that purpose; no other body is named for this approval.

*options-only probe FLAG (grammar):* picked the key from the options alone and named a cue (grammar): Three options end with a reason/condition clause ('for residual risk...', 'once ... is confirmed', 'as part of ...'), while A ends with a bare locative phrase ('inside the organization'), making 

#### `972b8caa`   anchor `A.10.2`

> Allocating responsibilities The organization shall ensure that responsibilities within their AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties.

**Q** A firm builds a model, a partner adapts it, and a reseller puts it in front of end users. What does the standard expect the firm to ensure about this arrangement?

- A) That the externally performed steps are monitored by whichever party carries them out.
- **B) That duties across the stages are shared out among itself, the partner and the reseller.  ← key**
- C) That its AI objectives are communicated to the partner and reseller and kept updated.
- D) That the partner and reseller are listed in its statement of applicability with justification.

*explanation:* A.10.2 requires that responsibilities within the AI system life cycle be allocated between the organization and the partners, suppliers, customers and third parties involved, which is exactly the situation described.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B, C and D all name "the partner and the reseller" while A alone names no parties; of the three, B is the only one that also includes "itself", covering all parties named in the set.

### Task 5.1   (4 survivors)

#### `b25f378f`   anchor `3.11`

> Note 3 to entry: In the context of this document, performance refers both to results achieved by using AI systems and results related to the AI management system (3.4).

**Q** The terminology section carries a note explaining how the word "performance" is to be read throughout the AI management system document. What does the term cover there?

- **A) Outcomes obtained from putting AI systems to use together with outcomes of the management system itself.  ← key**
- B) The degree to which the activities that were planned got carried out and the intended results reached.
- C) Quantitative findings about AI systems, with qualitative judgements handled separately as audit criteria.
- D) Outcomes of the management system alone, since AI system results are treated as technical criteria.

*explanation:* Clause 3.11's third note to the definition of performance explains that, for the purposes of this document, the word takes in both the results that come from using AI systems and the results associated with the AI management system, with context showing which reading applies. The term therefore spans both at once; the second option restates the separate definition of effectiveness in 3.13, and the remaining options each discard part of what the note includes.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A, C and D form one vocabulary family ('outcomes ... AI systems ... criteria'); within that family C and D each add a restricting/excluding clause ('handled separately as audit criteria', '

#### `dfc8a1bf`   anchor `3.13`

> effectiveness extent to which planned activities are realized and planned results are achieved

**Q** While preparing a performance evaluation report, a manager asks what "effectiveness" of the AI management system means as the document defines the word. Which answer is right?

- A) Whether the deployed model meets its technical criteria, such as success rates or confidence rates.
- **B) The degree to which the activities that were planned got carried out and the intended results reached.  ← key**
- C) Establishing the current status of a system, a process or an activity by checking and observing it.
- D) The relation between the results the organization reached and the resources it consumed reaching them.

*explanation:* Clause 3.13 defines effectiveness as the "extent to which planned activities are realized and planned results are achieved", which is about realization of plans, not about a model's technical scores.

*options-only probe FLAG (grammar):* picked the key from the options alone and named a cue (grammar): A is the only option that is not a self-contained generic definition (it starts with the clause 'Whether...' and names a specific 'deployed model'), so it reads as an off-pattern distractor; amon

#### `ba60e337`   anchor `6.2`

> When planning how to achieve its AI objectives, the organization shall determine: — what will be done; — what resources will be required; — who will be responsible; — when it will be completed; — how the results will be evaluated.

**Q** A team is drawing up its plan for achieving one of its AI objectives. Which element does the requirement on AI objectives and planning place in that plan?

- A) The methods chosen for monitoring and measurement so that valid results are obtained.
- B) The acceptable value fixed for the chosen model performance metric.
- **C) A determination of how the results of the objective will be evaluated.  ← key**
- D) A decision on whether the objective is to be kept as documented information.

*explanation:* Clause 6.2 requires the organization, when planning how to achieve its AI objectives, to determine among other things "how the results will be evaluated", alongside what will be done, resources, responsibility and completion date.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): C and D are the only options that refer back to "the objective" (likely echoing the stem), and of those D is the odd one out as a yes/no "whether" decision, leaving C.

#### `763142b3`   anchor `3.19`

> measurement process (3.8) to determine a value

**Q** Each week a team notes whether a deployed AI service is running as expected and, in a separate step, works out a figure for its error rate. Using the defined terms of the document, how should these two activities be named?

- A) Noting the running state is measurement; arriving at the figure is monitoring.
- **B) Noting the running state is monitoring; arriving at the figure is measurement.  ← key**
- C) Both count as measurement, the note on running state being a qualitative measure.
- D) Noting the running state is monitoring; arriving at the figure is analysis of results.

*explanation:* Clause 3.19 defines measurement as a "process (3.8) to determine a value", while monitoring is defined as determining the status of a system, process or activity; so the weekly state check is monitoring and deriving the error-rate figure is measurement.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): B is the maximal-overlap option: its first clause is identical to D's and its second clause is the mirror of A's, so it shares a component with every other option.

### Task 5.3   (2 survivors)

#### `40b78595`   anchor `9.3.3`

> The results of the management review shall include decisions related to continual improvement opportunities and any need for changes to the AI management system.

**Q** Top management has just finished its periodic review of the AI management system. Which of the following belongs in the recorded results of that review?

- **A) Decisions on continual improvement opportunities and on any changes the system needs.  ← key**
- B) The status of actions agreed at earlier reviews and shifts in internal and external issues.
- C) Trends in nonconformities, corrective actions and monitoring results gathered for the meeting.
- D) A schedule fixing the planned intervals at which top management will hold future reviews.

*explanation:* Clause 9.3.3 on review results states that they "shall include decisions related to continual improvement opportunities and any need for changes to the AI management system." The other options name material that feeds the review or a scheduling matter, not its results.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options name information gathered or scheduled (status, trends, schedule); only A names decisions/outputs, making it the odd category out — and it is also the shortest.

#### `9317c0f3`   anchor `10.1`

> The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system.

**Q** During a certification audit the discussion turns to the improvement requirement placed on an organization that operates an AI management system. Which statement describes that requirement correctly?

- A) Top management's periodic review of the system by itself discharges the improvement duty.
- B) Improvement effort is directed at closing audit nonconformities rather than at the system.
- **C) The organization continually improves the system's suitability, adequacy and effectiveness.  ← key**
- D) The improvement obligation falls on top management rather than on the organization.

*explanation:* The continual improvement clause (10.1) puts the duty on the organization itself to go on making the AI management system more suitable, more adequate and more effective. That duty is not exhausted by holding reviews, is not confined to closing out nonconformities found in audits, and is not assigned to top management alone.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): Three options are restrictive/contrastive framings ("by itself", "rather than" twice), while C is the only plain affirmative statement.

