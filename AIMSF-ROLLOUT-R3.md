# AIMS-F rollout R3 (the four tasks at a floor of 6)

**Nothing is inserted.** Every item below is in an artifact awaiting the director's read.

| | |
|---|---|
| tasks | 4 |
| attempted | 13 |
| survivors | **11** |
| spend | **$4.88** |
| dollars per survivor | **$0.444** |

## Spend by role

At $15 / $75 per million tokens (input / output).

| role | calls | input | output | USD |
|---|---|---|---|---|
| writer | 4 | 11332 | 22144 | $1.83 |
| solver | 26 | 46788 | 5326 | $1.10 |
| paraphrase | 8 | 30962 | 8192 | $1.08 |
| options-probe | 14 | 8502 | 4459 | $0.46 |
| de-cue | 3 | 3628 | 3776 | $0.34 |
| solver-recheck | 2 | 3278 | 318 | $0.07 |
| **total** | **57** | **104490** | **44215** | **$4.88** |

## Per task

| task | batch | shortfall | attempted | survived | rejections by gate | key-pick | flag | cue flags | distinct anchors |
|---|---|---|---|---|---|---|---|---|---|
| 2.1 | R3 probe | 4 | 4 | **4** | — | 75% (3/4) | 75% (3/4) | odd-verdict 1, only-hedged 1, shared-phrase 1 | 2 |
| 4.2 | R3 rest | 3 | 3 | **2** | — | 100% (2/2) | 100% (2/2) | only-hedged 2 | 2 |
| 5.2 | R3 rest | 2 | 2 | **2** | — | 100% (2/2) | 100% (2/2) | odd-verdict 1, only-negation 1 | 1 |
| 5.4 | R3 rest | 4 | 4 | **3** | `solver` 1 | 67% (2/3) | 67% (2/3) | odd-verdict 2 | 3 |

**Rejections across the run:** `solver` 1

### The options probe, against the authored bank

**These are two measurements and only one of them compares to 98 percent.** The authored bank's
98 percent is a KEY-PICK rate: how often the probe, shown the options alone with no stem, picks the
key. A FLAG is narrower -- it picked the key AND could name the cue it used -- so the flag count is a
subset of the key-pick count by construction. Reading a flag rate against 98 percent would report an
improvement nobody measured.

| | rate | |
|---|---|---|
| **key-pick, these survivors** | **82%** (9/11) | the figure comparable to 98% |
| key-pick, authored bank | 98% | measured in the 480-item audit |
| key-pick, chance | 25% | four options |
| flag (picked the key AND named the cue) | **82%** (9/11) | a SUBSET of key-pick, not comparable to 98% |
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

`solver-split`: **0** — items the solver answered two different
ways across two runs with the options shuffled.

**No task hit a stop condition** — every one had at least half its attempts survive and the writer
produced items for all of them.

---

## Every survivor, in full

### Task 2.1   (4 survivors)

#### `d06e0261`   anchor `3.2`

> person or organization (3.1) that can affect, be affected by, or perceive itself to be affected by a decision or activity

**Q** A hospital is deploying an AI triage tool. A local patient-advocacy group has no contract with the hospital and has not demonstrated any harm, yet its members believe the tool disadvantages them. When the hospital compiles its list of parties relevant to the AI management system, how should this group be handled?

- **A) Include the group, since a body that perceives itself as affected falls within the definition.  ← key**
- B) Exclude the group until it produces evidence of measurable harm from the tool's outputs.
- C) Record the group as an unrelated third party outside the contractual and regulatory chain.
- D) Defer the question to the scope exercise, which settles who counts as a relevant party.

*explanation:* The defined term in Clause 3.2 covers not only those actually affected but also any person or organization that can 'perceive itself to be affected' by a decision or activity, so a self-perceived effect is enough to make the advocacy group relevant; demonstrated harm or a contractual link is not the threshold.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): B and C are two variants of the same 'exclude' verdict (so they cancel each other), and D merely defers instead of answering; A is the only option that gives a distinct verdict backed by an a

#### `c98acc3a`   anchor `4.2`

> The organization shall determine: — the interested parties that are relevant to the AI management system; — the relevant requirements of these interested parties; — which of these requirements will be addressed through the AI management system.

**Q** A project team building an AI management system has listed the parties relevant to it and has captured what each of them requires. Working on the needs and expectations of interested parties, what determination still remains for the team?

- **A) Which of the captured requirements the AI management system will address.  ← key**
- B) Whether climate change is an issue relevant to the organization's purpose.
- C) The boundaries and applicability that establish the management system scope.
- D) The organization's roles with respect to the AI systems it provides or uses.

*explanation:* Clause 4.2 sets three determinations: the relevant interested parties, their relevant requirements, and finally which of those captured requirements the management system itself will take on. The other options are determinations belonging to the context and scope work, not to the interested-party analysis.

#### `f3efc767`   anchor `4.2`

> NOTE Relevant interested parties can have requirements related to climate change.

**Q** During an AI management system workshop, a sustainability lead asks where climate change belongs in the analysis of parties relevant to the system. Which statement is consistent with the standard?

- **A) Relevant parties can hold requirements that are connected to climate change.  ← key**
- B) Relevant parties are obliged to declare whether climate change concerns them.
- C) Climate-related requirements are left out of the consideration of system scope.
- D) Climate change becomes relevant once a regulator imposes a reporting duty.

*explanation:* The note to Clause 4.2 observes that 'Relevant interested parties can have requirements related to climate change', a possibility to take into account rather than a duty placed on those parties.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): A is the only permissive/hedged option ('can hold'), while B and D assert obligations/conditions and C is the only exclusionary ('left out') statement.

#### `565db21b`   anchor `3.2`

> person or organization (3.1) that can affect, be affected by, or perceive itself to be affected by a decision or activity

**Q** A bank's AI management system team has drawn up its list of relevant parties by asking who bears the consequences of its credit-scoring model. An external data provider whose feeds materially shape the model's decisions has been left off the list. What does the defined term for interested party indicate here?

- **A) A party able to affect a decision or activity comes within the term.  ← key**
- B) A party is identified by the consequences it bears from the decision.
- C) A data feed supplier comes within the term once it holds a contract.
- D) A supplier becomes relevant when its feeds sit inside the declared scope.

*explanation:* The definition of interested party in Clause 3.2 covers a person or organization on either side of the relationship: one that influences a decision or activity as well as one that is, or believes itself to be, on the receiving end of it. The phrase "can affect, be affected by" (3.2) means the data provider qualifies on the influencing limb alone, since its feeds shape the model's decisions.

*options-only probe FLAG (shared-phrase):* picked the key from the options alone and named a cue (shared-phrase): A and C share the key phrase "comes within the term", and A states it as an unconditional broad criterion while C attaches a narrow condition; A is the broadest of the four.

### Task 4.2   (2 survivors)

#### `fdb0fda4`   anchor `3.26`

> All identified risks and the risk management measures (controls) established to address them shall be reflected in the statement of applicability.

**Q** An auditor is reviewing how an organization's Statement of Applicability handles the risks it has identified for its AI systems. Which description matches the coverage expected of that document?

- **A) The risks the organization has identified, together with the control measures set up to deal with them, are carried through into the document.  ← key**
- B) Only the residual risks accepted by management appear there, because treated risks are tracked solely in the risk treatment plan.
- C) Identified risks stay in the risk register, and the document is confined to listing the controls drawn from Table A.1.
- D) Each item of implementation guidance the organization has adopted is entered there beside the control it supports.

*explanation:* Note 2 to entry in the definition of the statement of applicability (3.26) sets the expected coverage: every risk the organization has identified, and the risk management measures put in place to address those risks, are to be carried into that document. Option A describes exactly that coverage, while the other options narrow it to residual risk, to Annex A entries, or to implementation guidance.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): B, C and D each carry a restrictive limiter ("Only ... solely", "confined to", "Each item"), while A is the sole unrestricted, inclusive statement.

#### `17930ef7`   anchor `A.1`

> Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).

**Q** How does the control list in Table A.1 relate to the set of controls an organization actually operates for AI risk treatment?

- **A) Table A.1 serves as a reference set, and an organization can devise and apply controls of its own.  ← key**
- B) Annex B holds the reference controls, and Table A.1 sets out how each of them can be put into practice.
- C) Table A.1 is an exhaustive catalogue of the controls available for treating AI risks, and an organization can select from it.
- D) Controls an organization devises for itself sit outside the scope of the statement of applicability, which covers Table A.1 entries.

*explanation:* Clause A.1 presents Table A.1 as a reference point for meeting objectives and addressing AI risks, and it goes on to say that the listed control objectives and controls need not all be taken up and that an organization is free to work out and put in place controls of its own.

*options-only probe FLAG (only-hedged):* picked the key from the options alone and named a cue (only-hedged): C is the only option with an absolute quantifier ("exhaustive catalogue") and D is the only one framed as an exclusion, while A is the permissive/hedged variant of the same Table A.1 claim.

### Task 5.2   (2 survivors)

#### `9e49d229`   anchor `3.18`

> Note 2 to entry: An internal audit is conducted by the organization (3.1) itself, or by an external party on its behalf.

**Q** An AI management system audit is being arranged, and the sponsor asks who is permitted to perform it if it is to count as an internal audit.

- **A) The organization itself, or an outside party acting on its behalf, can carry it out.  ← key**
- B) The organization's own staff can carry it out; an outside party doing so makes it external.
- C) The outside body engaged for the work can conduct it, but that makes it third-party.
- D) An audit covering two or more disciplines at once can count as an external audit.

*explanation:* The definition of audit in clause 3.18 states in Note 2 that "An internal audit is conducted by the organization (3.1) itself, or by an external party on its behalf." So engaging an outside party does not, by itself, change the audit from internal to external.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): A is the only option that allows both alternatives (in-house OR outside party) while B and C each exclude one and D changes the topic entirely; the umbrella option that subsumes its rivals is

#### `27558ffa`   anchor `3.18`

> audit systematic and independent process (3.8) for obtaining evidence and evaluating it objectively to determine the extent to which the audit criteria are fulfilled

**Q** A data governance lead designed and runs the organization's AI risk assessment process. She is now assigned to audit that same process for the internal audit programme. Which characteristic of an audit is undermined by this assignment?

- **A) That evidence is gathered and appraised without bias by someone detached from the work.  ← key**
- B) That the programme weighs how significant the audited processes are and earlier findings.
- C) That objectives, criteria and scope are settled for each individual audit engagement.
- D) That the findings produced reach the managers accountable for the area examined.

*explanation:* Clause 3.18 defines an audit as a "systematic and independent process (3.8) for obtaining evidence and evaluating it objectively to determine the extent to which the audit criteria are fulfilled"; auditing one's own process destroys that independence and objective evaluation. The other options describe genuine programme elements that this assignment does not touch.

*options-only probe FLAG (only-negation):* picked the key from the options alone and named a cue (only-negation): A is the only option phrased with a negation ('without bias') and the only one adding a second qualifying clause about the person ('by someone detached from the work'), making it the odd on

### Task 5.4   (3 survivors)

#### `eea72c20`   anchor `3.17`

> corrective action action to eliminate the cause(s) of a nonconformity (3.16) and to prevent recurrence

**Q** A support assistant released replies containing customer personal data, breaching the organization's documented handling rule. The team (i) switched the feature off, (ii) contacted the affected customers and arranged remediation, (iii) traced the fault to a redaction step missing from the text pipeline and built that check into the pipeline, and (iv) six weeks later confirmed no further leaks had occurred. Which step is the corrective action, as opposed to a correction or the handling of consequences?

- **A) Building the missing redaction check into the pipeline so the same gap cannot reappear  ← key**
- B) Switching the feature off so that no further exposed replies could be sent out
- C) Contacting the affected customers and arranging remediation for the exposure caused
- D) Confirming six weeks later that the fix had held and no further leaks had occurred

*explanation:* The vocabulary entry for corrective action (3.17) defines it as action directed at removing the cause of a nonconformity so that the failure does not happen again. Only the pipeline change addresses the traced cause; the others are containment, consequence handling, and the later effectiveness review.

#### `76c313cc`   anchor `3.16`

> nonconformity non-fulfilment of a requirement (3.14)

**Q** An AI team has documented thresholds for the quality of data used to build and run its systems. During monitoring it finds that a training set actually used in production falls below those documented thresholds. Which of the following situations, on the facts given, amounts to a nonconformity?

- **A) The training set in use falls short of the data quality thresholds the organization documented  ← key**
- B) An internal reviewer proposes a quicker labelling method that current procedures do not use
- C) A monitored model indicator is reported in descriptive terms instead of as a number
- D) A vendor agreement covered by the supplier process is scheduled for renewal next quarter

*explanation:* Under the definition in 3.16, a nonconformity exists where a requirement has not been fulfilled. The organization set and documented data quality requirements, and data actually used fails them, so a requirement is unfulfilled. The other situations describe a suggestion, a reporting format and a contract date, none of which shows a requirement unmet.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Only A states a shortfall against a documented requirement (a deficiency verdict); B, C and D all describe neutral, non-violating situations.

#### `5cf5d7db`   anchor `10.1`

> The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system.

**Q** A provider has closed out every corrective action raised in its last internal audit, verified that each one worked, and has no open findings. Regarding improvement of its AI management system, what obligation continues to apply?

- **A) It must go on improving how suitable, adequate and effective that system is  ← key**
- B) It may hold improvement work until a further finding or the next audit cycle
- C) It limits improvement to whatever system changes the closed findings showed to be needed
- D) It satisfies improvement by re-checking that the closed actions achieved their intended results

*explanation:* Clause 10.1 is a standing duty independent of findings: "The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system." Waiting for the next finding, confining improvement to changes flowing from closed nonconformities, or equating improvement with effectiveness re-checks all fall short of that continuing obligation.

*options-only probe FLAG (odd-verdict):* picked the key from the options alone and named a cue (odd-verdict): Three options (B, C, D) all describe limiting, deferring or discharging the improvement duty, while A is the lone option stating an ongoing mandatory obligation ('must go on improving'), maki

