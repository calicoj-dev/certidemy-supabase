# Pilot 4, de-cue re-run: original versus rewritten distractors

Re-run under the RESHAPE-NEVER-REPLACE principle and the two rewrite checks, over the 24 items pilot 4 de-cued. No items were generated and nothing was written to the database.

| | |
|---|---|
| applied | 21 |
| reverted | 3 (rewrite checks 1, code gates 0, blind solver 2) |
| malformed / could-not-run | 0 / 0 |
| key-pick, applied items | before 19/21, after 19/21 |

**A REVERT IS THE PROCESS WORKING.** The original passed every gate and the solver, so a
rewrite that introduces an absolute or drops a real control is discarded and the item keeps
the distractors it had.

## What moved

| | before | after |
|---|---|---|
| probe state | flag 18, no-cue 3 | flag 18, no-cue 3 |
| cue the probe named | length 5, odd-verdict 5, grammar 3, only-hedged 3, shared-phrase 2, only-negation 2, none 1 | shared-phrase 14, odd-verdict 4, only-hedged 2, none 1 |
| shape cues (code) | 10 | 4 |

**The flag rate did not move and the CUE KIND collapsed.** The mechanical cues the code
checks can see -- length, grammar agreement, a lone negation -- went to zero, and
`shared-phrase` absorbed nearly all of them. That is what reshape-never-replace predicts:
each distractor has to keep naming its own control or clause, so making the four forms
parallel makes them share vocabulary, and the probe reads the parallelism itself as the cue.
Whether that is a cue a candidate could use, or the probe rationalising over a symmetric
option set, is a judgement this instrument cannot make -- which is the reason it flags and
never rejects.

**And the rewrites are reshapes, not appends**, measured over all 63 rewritten
distractors: 6 contain the original verbatim, 16 keep 80 percent or more of its words, 51 are longer.
Item 1.4 reads as a pure append and is the exception -- I read it first and nearly reported
it as the pattern.

**Three items are marked APPROXIMATE.** Their pre-de-cue distractors are not recoverable:
the paraphrase retry had also touched them, so the "original" shown is the raw writer
output from before both steps. `gen-grounded-items` now stores `item_before_decue`.

---

## task 1.1 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Technical documentation about an AI system supplied to users, partners and supervisory authorities in suitable form | Assembled documents of an organization that describe its AI systems and the information supplied to users |
| 2 | A defined process for assessing how an AI system can affect individuals, groups and societies | Structured process of an organization that assesses its AI impacts on individuals and the societies affected |
| 3 | The ongoing activities of monitoring performance, carrying out repairs, issuing updates and providing support | Combined activities of an organization that monitor its AI performance and the updates and support provided |

probe: no-cue -> flag   shape cues: none -> none

---

## task 1.4 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Privacy-related controls of the AI management system are the ones best folded into the existing ISO 9001 arrangements. | The privacy-related controls of the AI management system are the ones best folded into the existing ISO 9001 arrangements, so the security work stays separately maintained. |
| 2 | Certification to ISO 9001 is obtained first, and the AI management system is then layered on top of that system. | The certification to ISO 9001 is obtained first, and the AI management system is then layered on top of that system once the quality arrangements are running. |
| 3 | Security objectives for the AI components are handled apart from those covering the remaining parts of the system. | The security objectives for the AI components are handled apart from those covering the remaining parts of the system, and each set is reviewed on its own. |

probe: flag -> flag   shape cues: key-length -> none

---

## task 2.2 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Keep the bought-in tools outside the boundary and record that exclusion with its justification in the statement of applicability. | Set the boundary around the in-house models, log the vendor-supplied features as justified exclusions in the statement of applicability, and keep that record current. |
| 2 | Derive the boundary from the risk treatment options already selected, and review internal and external issues once the boundary is fixed. | Derive the boundary from the risk treatment options already selected, bring the vendor-supplied features in afterwards, and review internal and external issues once it is fixed. |
| 3 | Confine the boundary to internally built systems and cover the bought-in features by obtaining technical documentation from each supplier. | Confine the boundary to internally built systems, cover the vendor-supplied features by obtaining technical documentation from each supplier, and file that documentation as evidence. |

probe: flag -> flag   shape cues: clang -> none

---

## task 2.5 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Produce a statement of applicability with justification for included and excluded controls before rating risks. | Produce a statement of applicability justifying included and excluded controls, and attach it to the analysis. |
| 2 | Derive the risk criteria afterwards from the ratings that the template produced for this model. | Derive the bank's risk criteria from the ratings the template produced and record both in the analysis. |
| 3 | Defer the rating of harm to affected people until the model is running and later reassessed. | Shift the rating of harm to affected people out of the analysis and into operational monitoring. |

probe: flag -> flag   shape cues: clang -> none

---

## task 2.6 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Defer any re-assessment until the next scheduled internal audit reviews the existing documented file. | Schedule the re-assessment into the next internal audit cycle and record the existing file as current. |
| 2 | Treat the privacy impact assessment already held by the security function as covering the AI aspects. | Extend the privacy impact assessment held by the security function to cover the AI aspects and file it. |
| 3 | Release the assessment findings to the relevant interested parties before the change is allowed to proceed. | Issue the existing assessment findings to the relevant interested parties and record the acknowledgements received. |

probe: flag -> flag   shape cues: none -> clang

---

## task 2.7 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Record the documented consequences as the risk levels themselves, letting the impact work stand in for risk analysis. | Enter the documented consequences directly as the risk levels, then move those levels into treatment planning. |
| 2 | Hold the impact work open until risk levels have been determined, then insert those levels into it. | Determine the risk levels first, then insert them into the impact assessment before treatment planning. |
| 3 | Treat release of the impact findings to relevant interested parties as the obligatory next step. | Release the impact findings to relevant interested parties, then begin treatment planning on that basis. |

probe: flag -> flag   shape cues: clang -> none

---

## task 2.8 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Only controls taken from Annex A, with the self-designed control recorded in the treatment plan instead | The Annex A reference controls, its own monitoring control being recorded instead in the risk treatment plan |
| 2 | The Annex B implementation guidance chosen for each control, entered and justified alongside the controls | The Annex B implementation guidance chosen for each reference control, entered and justified alongside the monitoring control |
| 3 | No reasoning for the two omitted controls, once designated management has signed off the treatment plan | The two omitted reference controls listed without reasoning, once designated management has signed off the treatment plan |

probe: flag -> flag   shape cues: clang -> opposite-pair

---

## task 3.1 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Brief the existing team members on the AI policy, their contribution to the system and what failing to conform would mean for the organization. | Brief the existing team members on the AI policy, their contribution and the consequences of nonconformity, treating that briefing as the remedy for the capability gap. |
| 2 | Identify and record the resources that the relevant life-cycle stage and other AI-related activities call for, covering tools, data and computing. | Identify and record the resources the relevant life-cycle stage and other AI activities call for, covering tools, data and computing, and treat that record as sufficient. |
| 3 | Apply distribution, storage, change and retention arrangements to the team's existing qualification and training records held by the organization. | Apply the distribution, storage, change and retention arrangements to the team's existing qualification and training records, and accept those held records as the evidence of competence. |

probe: flag -> flag   shape cues: none -> none

---

## task 3.2 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | They are outside scope, since awareness applies to payroll staff, while contracted specialists are covered through competence arrangements instead. | They are within scope of competence requirements rather than awareness ones, as contracted specialists are assessed on qualifications while awareness applies to payroll staff. |
| 2 | They are within scope once documented information is held for each of them as evidence that awareness sessions were delivered and understood. | They are within scope, and documented information is retained for each of them as evidence that awareness sessions were delivered, attended and understood. |
| 3 | They are within scope once the organization has settled what will be communicated, at what times, to which parties, and by what means. | They are within scope, and the awareness duty for them is met by determining what is communicated, at what times, to which parties, and by what means. |

probe: flag -> flag   shape cues: none -> none

---

## task 3.3 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Rules for retrieval and use, legible storage, version numbering, and how long it is kept before disposal. | A rule for retrieval and use, a legible storage medium, and version numbering that fixes the disposal date. |
| 2 | A scheduled review by top management confirming that the management system stays suitable, adequate and effective. | A review by top management, held at planned intervals, confirming the system still meets its intended outcomes and objectives. |
| 3 | A recorded statement of what the organization owes by way of reporting on the AI system to outside parties. | A recorded statement of the organization's reporting obligations to external interested parties, and the channels used. |

probe: no-cue -> flag   shape cues: none -> none

---

## task 3.4 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Hand accountability for the retraining to the vendor, whose contract terms set the criteria applied | Keep the outsourced retraining under its control while the vendor's contract terms set the criteria applied |
| 2 | Accept the vendor's own certification as the criteria governing how the retraining is performed | Keep the retraining within the management system by adopting the vendor's certification as its governing criteria |
| 3 | Defer review of unintended changes arising from the retraining until the next scheduled internal audit | Control the retraining process but review unintended changes from it at the next scheduled internal audit |

probe: flag -> flag   shape cues: clang -> none

---

## task 3.6 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Whether records stay unaltered from creation through to their later use in training | Whether the data feeding the system stays unaltered from creation through to model training |
| 2 | Whether sensitive records are shielded from disclosure to parties without authorization | Whether sensitive inputs are shielded from disclosure to parties the system has not authorized |
| 3 | Whether the records stay reachable by authorized staff at the moment they are needed | Whether the system's stored data stays reachable by authorized staff when it is needed |

probe: flag -> flag   shape cues: clang -> none

---

## task 3.7 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Awareness briefings that already cover the security policy will serve, without adding content on the AI policy. | Awareness briefings that already cover the security policy carry over to AI as they stand, and their records remain valid. |
| 2 | Document control has to be rebuilt as a separate AI register, held apart from the security records. | Document control has to be rebuilt as a separate AI register, maintained under its own numbering and review cycle. |
| 3 | Operational planning is satisfied by the security process controls alone, without the controls chosen in risk treatment. | Operational planning is satisfied by the existing security process controls, and the AI treatment plan serves as a later annex. |

probe: flag -> flag   shape cues: none -> none

---

## task 3.8 — REVERTED by the blind solver

**Why:** rejected

| # | original | rewritten |
|---|---|---|
| 1 | Hold the system impact assessment until the change has actually gone live in production, and keep records of the results then. | Run the system impact assessment now against the deployed model as it currently operates in production, and keep records of the results. |
| 2 | Defer verification that the existing treatment plan still works to the next internal audit, and keep the results in the audit file. | Verify that the existing treatment plan still works by scheduling an extra internal audit of the deployed system, and keep the results in the audit file. |
| 3 | Record any newly identified risk needing action in the statement of applicability rather than re-running the treatment process. | Document newly identified risks needing action in the statement of applicability during the current cycle, and treat that entry as the record. |

---

## task 4.1 — APPLIED  *(original APPROXIMATE)*

| # | original | rewritten |
|---|---|---|
| 1 | Organizations list in the statement of applicability the guidance items adopted per control. | They are listed in the statement of applicability, and an organization records the guidance items adopted. |
| 2 | Organizations can treat the guidance as sufficient for their particular control requirements. | They supply sufficient guidance, and an organization can meet its particular control requirements from them. |
| 3 | Organizations find guidance for some table entries and devise the rest themselves. | They carry guidance for some entries, and an organization devises the remaining ones itself. |

probe: flag -> flag   shape cues: none -> clang

---

## task 4.2 — REVERTED by the rewrite check  *(original APPROXIMATE)*

**Why:** 1 new absolute(s): any

| # | original | rewritten |
|---|---|---|
| 1 | The Annex A reference list reproduced in full, with an implementation status noted against each listed entry | The Annex A reference list was reproduced in full, and an implementation status noted against each entry did not require any accompanying reasoning |
| 2 | The implementation guidance drawn from Annex B, with a note showing which items were adopted and which were set aside | The implementation guidance drawn from Annex B was consulted, and a note of which items were adopted or set aside records the removal |
| 3 | The risk treatment plan itself, together with the designated management's approval of the acceptance of residual risk | The risk treatment plan was approved by designated management, and that recorded acceptance of residual risk stands in place of a stated justification |

---

## task 4.3 — APPLIED  *(original APPROXIMATE)*

| # | original | rewritten |
|---|---|---|
| 1 | Defining and allocating AI roles and responsibilities to suit organizational needs | Allocating AI roles and responsibilities consistent with the organization's AI policy |
| 2 | Reviewing the AI policy at planned intervals and as circumstances change | Reviewing the AI policy at planned intervals to keep objectives current |
| 3 | Documenting human resources and their competences used across the system life cycle | Documenting the human resources and competences supporting the organization's AI objectives |

probe: no-cue -> no-cue   shape cues: clang -> clang

---

## task 4.5 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Write a plan covering how incidents will be announced to people who use the tool | Set up a route by which the agency announces incidents to users of the tool |
| 2 | Record what the agency owes regulators by way of information about the tool | Set up a register of the information about the tool that regulators are owed |
| 3 | Record how the datasets behind the tool were obtained and chosen for use | Set up a log tracking how the datasets behind the tool were obtained and chosen |

probe: flag -> flag   shape cues: none -> none

---

## task 4.6 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Take the nine responsible-use objectives named in Annex B as the objective set for this deployment | Adopt the responsible-use objectives named in Annex B as the objectives the hospital applies to this deployment and its vendor dealings |
| 2 | Station a clinical reviewer able to reverse tool outputs at each stage of the tool's life cycle | Station a clinical reviewer able to reverse the tool's outputs across the phases of the hospital's deployment and the vendor's updates |
| 3 | Leave documentation of the responsible-use process to the vendor, since the tool was bought in | Assign documentation of the responsible-use process to the vendor, with the hospital retaining the configuration records it produces locally |

probe: flag -> flag   shape cues: clang -> none

---

## task 5.1 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | The arrangements for storing, versioning, retaining and eventually disposing of the resulting records. | The arrangements for retaining, versioning and disposing of records, as needed, so that retrieval stays orderly. |
| 2 | The trends in nonconformities, corrective actions and audit outcomes to be tabled for senior leaders. | The trends in nonconformities, corrective actions and audits, where available, so that leaders are briefed quarterly. |
| 3 | The circumstances that would prompt an assessment of consequences for individuals and for societies. | The circumstances triggering assessment of consequences for individuals and societies, so that harms are foreseen. |

probe: flag -> no-cue   shape cues: none -> none

---

## task 5.1 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | A choice of F1 as the operating metric is mandated by the annex guidance covering the running and monitoring of AI systems. | A choice of F1 as the operating metric, and its reporting interval, is fixed by the annex guidance on running and monitoring AI systems. |
| 2 | A record of monitoring outcomes need only be kept from the moment those outcomes are first presented to senior leaders. | A record of monitoring outcomes dates from its presentation to senior leaders, and earlier working figures sit outside the documented evidence. |
| 3 | A completed assessment of the consequences of the system for individuals and for societies would close the gap on its own. | A completed assessment of the consequences of the system for individuals and for societies is the evidence this clause asks for. |

probe: flag -> flag   shape cues: none -> none

---

## task 5.2 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | Whether the criteria and requirements set for each stage of the AI system life cycle have been documented | Whether the criteria and requirements set for each stage of the AI system life cycle have been documented and carry current approval signatures |
| 2 | Whether interested parties have a usable channel for raising adverse impacts of the AI system | Whether interested parties have a usable channel for raising adverse impacts of the AI system, and the reports they submit get logged promptly |
| 3 | Whether internal and external messages about the system reach the intended parties at the intended time | Whether internal and external messages about the system reach the intended parties at the intended time, and the channels used remain available |

probe: flag -> flag   shape cues: key-length -> none

---

## task 5.2 — APPLIED

| # | original | rewritten |
|---|---|---|
| 1 | The setting of objectives, criteria and scope before each individual audit is carried out | The setting of objectives, criteria and scope before each audit so the audit's boundaries are agreed |
| 2 | The passing of audit findings to the managers who are responsible for the areas audited | The passing of audit findings to the managers responsible for the areas audited so corrective action can follow |
| 3 | The weighing of process importance and earlier audit findings when the programme is set up | The weighing of process importance and earlier audit findings when the programme is planned so effort is prioritised |

probe: flag -> no-cue   shape cues: none -> none

---

## task 5.4 — REVERTED by the blind solver

**Why:** rejected

| # | original | rewritten |
|---|---|---|
| 1 | Switching production traffic back to the prior model version and re-running the applications that were wrongly rejected | Switching production traffic back to the prior model version and re-running the rejected applications in the other portfolios scored from the same refreshed dataset |
| 2 | Logging what went wrong and what was done about it, and retaining that record as evidence for the auditor | Logging what went wrong and what was done about it, and retaining that record as evidence for the auditor reviewing the wider model inventory |
| 3 | Confirming with the affected applicants that their re-run decisions now match the expected outcome before closing the ticket | Confirming with the affected applicants that their re-run decisions match the expected outcome, and sampling other models for similar misrejections before closing the ticket |

