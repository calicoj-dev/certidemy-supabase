# AIMS-F task 1.3 -- the three R2 items not inserted

**Read-only.** Nothing here is written to the bank.

`B.6.2.1` is the one to read hardest: it was ruled for insertion, survived generation, and was refused
when the same gates ran again because the blind solver named a second defensible option the second
time. Same item, same passages, two runs, two verdicts. "The rows inserted are the rows measured"
holds for the code gates and does not hold for the solver.

---

## `a1411c8e`   anchor `A.6.2.2`

**Why held:** options-probe flag (shared-phrase), and fails quote-noise

**key_support**

> for new AI systems or material enhancements to existing systems.

**Q** A system already in production is to receive a substantial functional upgrade. Which statement reflects the Annex A control on AI system requirements and specification?

- **A) Requirements are specified and documented for the upgrade, just as for a newly built system.  ← key**
- B) Requirements documents are prepared for new builds; upgrades are handled under the deployment plan.
- C) Requirements are captured inside the design and development documentation rather than separately.
- D) Requirements for the upgrade are conveyed through the technical documentation given to users.

**distractor support**

- `A.6.2.2` — for new AI systems or material enhancements to existing systems.
  - *why wrong:* Material enhancements are explicitly inside the scope of the requirements control, not covered by deployment planning alone.
- `A.6.2.3` — The organization shall document the AI system design and and development development based on organizational objectives, docu- mented requirements and specification criteria.
  - *why wrong:* Design and development documentation is built on documented requirements, so it presupposes rather than replaces them.
- `A.6.2.7` — documentation is needed for each relevant category of interested parties
  - *why wrong:* Technical documentation is provided to interested parties and is not the vehicle for specifying requirements.

**explanation:** A.6.2.2 extends the requirements control beyond first builds: it reaches both brand-new systems and significant upgrades to systems already in place. The distractors displace that work onto deployment planning, design documentation or user-facing technical documentation.

**quote-noise:** **FAILS** — distractor_support[1] carries hyphen-break ("u- m"): a word broken across a line join, as in "docu- mented"; distractor_support[1] carries doubled-word ("and and"): the same word twice, as in "and and development development" -- the quote is faithful to a MANGLED source, so `verbatim` passes it

**options-only probe:** flag — picked the key from the options alone and named a cue (shared-phrase): Options B, C and D all relocate the requirements into some other document (deployment plan, design/development docs, technical documentation), while A alone states they are documented in their own right — the odd one out.

**solver (generation run):** accepted — solved to the key from the passages, no second defensible option

---

## `843ad22b`   anchor `A.6.2.5`

**Why held:** options-probe flag (grammar), and fails quote-noise

**key_support**

> The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment.

**Q** A validated model is about to be released into a cloud environment. Which item does Annex A place at the deployment stage?

- **A) A documented deployment plan, with the applicable requirements satisfied beforehand  ← key**
- B) A documented record of design choices resting on the specification criteria
- C) A documented decision on which life-cycle phases keep records of events
- D) A documented set of objectives steering responsible development of the system

**distractor support**

- `A.6.2.3` — The organization shall document the AI system design and and development development based on organizational objectives, docu- mented requirements and specification criteria.
  - *why wrong:* Documenting design and development belongs to an earlier stage than deployment.
- `A.6.2.8` — The organization shall determine at which phases of the AI system life cycle, record keeping of event logs should be enabled, but at the minimum when the AI system is in use.
  - *why wrong:* The logging-phase decision is a separate control and is not what the deployment control calls for.
- `A.6.1.2` — Objectives for responsible develop- The organization shall identify and document objectives ment of AI system to guide the responsible development AI systems, and take those objectives into account and integrate measures to achieve them in the development life cycle.
  - *why wrong:* Responsible development objectives are set for the development life cycle, not as the deployment-stage item.

**explanation:** Clause A.6.2.5 places two things at this stage: a written plan for the deployment, and confirmation that the relevant requirements have been satisfied before the system goes live. The other options belong to design documentation (A.6.2.3), event-log phases (A.6.2.8) and development objectives (A.6.1.2).

**quote-noise:** **FAILS** — distractor_support[0] carries hyphen-break ("u- m"): a word broken across a line join, as in "docu- mented"; distractor_support[0] carries doubled-word ("and and"): the same word twice, as in "and and development development" -- the quote is faithful to a MANGLED source, so `verbatim` passes it

**options-only probe:** flag — picked the key from the options alone and named a cue (grammar): All four begin 'A documented …', but A is the only one containing a comma and a trailing qualifying clause ('with the applicable requirements satisfied beforehand'), making it structurally the odd one out with added specification.

**solver (generation run):** accepted — solved to the key from the passages, no second defensible option

---

## `4f639a4b`   anchor `B.6.2.1`

**Why held:** RULED FOR INSERTION, then refused on re-gate by the blind solver

**key_support**

> To define the criteria and requirements for each stage of the AI system life cycle.

**Q** An auditor asks why AIMS obligations are spread across stages instead of concentrating at release. Which description best captures the stated aim of the AI system life cycle control set?

- **A) Setting the criteria and requirements that apply at each separate stage  ← key**
- B) Gathering evidence from earlier work into a single release decision
- C) Tracking where data came from across the data and system life cycles
- D) Documenting objectives and processes for responsible design and development

**distractor support**

- `B.6.2.1` — To define the criteria and requirements for each stage of the AI system life cycle.
  - *why wrong:* The stated aim is stage-by-stage criteria, not evidence funnelled into one release decision.
- `A.7.5` — Data provenance The organization shall define and document a process for recording the provenance of data used in its AI systems over the life cycles of the data and the AI system.
  - *why wrong:* This is the aim of the data provenance control, not of the life cycle control set.
- `B.6.1.1` — To ensure that the organization identifies and documents objectives and implements processes for the responsible design and development of AI systems.
  - *why wrong:* This is the objective of the management guidance for development, a different control set.

**explanation:** The objective stated at B.6.2.1 for this control set is to establish, stage by stage, what the criteria and requirements are across the AI system life cycle, which is why obligations attach at every stage rather than only at release. The other options restate the aim of data provenance, restate the aim of the responsible development guidance, or collapse the life cycle into a single release gate.

**quote-noise:** passes

**options-only probe:** no-cue — picked B, not the key -- the options do not give it away

**solver (generation run):** accepted — solved to the key from the passages, no second defensible option

