# AIMS-IA — Job-Task Analysis (v1)

**Document version:** 1.1-LOCKED — amended after a profile sanity-check (see §5.1)
**Status:** **LOCKED.** Domains, tasks, task codes, weights and the concept list are frozen. Changes after this point are version-controlled scheme changes, not edits.
**Certification:** Certidemy `AIMS-IA` — ISO/IEC 42001:2023 Internal Auditor
**Tier:** II (single-BEST-answer)
**Sibling schemes:** `AIMS-F` (same standard, Foundation) · `ISMS-IA` (same role, ISO/IEC 27001)
**Authored:** 12 August 2026 | **Revised:** 12 August 2026 after external review (see §5)

---

## 0. Sources, and what each is licensed to assert

This is stated first because it is the constraint that shaped every task below.

| Source | Held | Permitted use in this JTA and downstream |
|---|---|---|
| **ISO/IEC 42001:2023** | yes | **Criteria.** Clause, Annex A and Annex B citations permitted. |
| **ISO 19011:2026** (4th ed.) | yes | **Method.** Clause and Annex A citations permitted. |
| ISO/IEC 22989:2022 | no | May be named as 42001's sole normative reference. **No clause citations.** |
| ISO/IEC 42006:2025 | no | Boundary only — certification-body scope. **No clause citations.** |
| ISO/IEC 17021-1 | no | Boundary only. **No clause citations.** |

**No task below requires a document we do not hold.** Where a task touches 42006 or
17021-1 it tests the *boundary* — that these govern certification bodies and not this
candidate — which is establishable from their titles and scope statements alone.

**Terms.** ISO/IEC 42001 clause 3 carries 26 of its own definitions and that is the
definitional basis for this cert. A definition is never attributed to ISO/IEC 22989,
even though 22989:2022 is 42001's only normative reference and is dated.

### 0.1 Facts read from the standards directly, not from memory

Every one of these was established by reading the text. They are recorded here because
they drive task design, and because the item generator's grounding block now carries
them (`scripts/lib/item-grounding.mjs`, commit `9f0a9c2`).

**ISO/IEC 42001:2023**

- **121 `shall` against 166 `should`, split structurally rather than mixed.** Clauses 4
  to 10 contain 81 `shall` and **zero** `should`. Annex A is `shall`. Annex B is
  almost entirely `should`. Annexes C and D are informative.
- **Annex A (normative)** — Table A.1, 38 controls, each stated with `shall`.
- **Annex B (normative)** — restates each control under a `Control` heading in the
  **`should`** form. The paradox resolves at **clause 6.1.3 e)**: the organization
  *shall consider the guidance in Annex B*. B.1 adds that organizations do not have to
  document or justify inclusion or exclusion of implementation guidance in the
  statement of applicability.
- **Annex A.1** — *"Not all the control objectives and controls listed in Table A.1 are
  required to be used."* Every Table A.1 `shall` is conditional on selection.
- **No amendment exists.** The climate-change wording is in the published first
  edition: 4.1 *"The organization shall determine whether climate change is a relevant
  issue"*, and the NOTE at 4.2. This is the sharpest single divergence from ISMS-IA,
  where the same wording arrived via Amd 1:2024.
- **`risk register` appears zero times**, exactly as in ISO/IEC 27001.
- **ISO 19011 is named once**, in a Note to entry under clause 3.18. 42001 does not
  require its use.
- **Drafting anomaly:** Note 2 to entry under 3.26 contains `shall`. Recorded so no
  item turns on whether notes are normative in general; **clause 6.1.3 f)** is the
  requirement text to cite for the statement of applicability.

**ISO 19011:2026**

- **One `shall`** — patent boilerplate — against **264 `should`**. Clause 1: *"This
  document gives guidance."* It requires nothing, anywhere.
- **No normative references**, and it names neither 42001 nor 27001. Discipline-agnostic.
- **Seven principles**, clauses 4.2 to 4.8. Clause 4.1 says only that adherence is
  fundamental. `precedence`, `hierarchy` and `rank` appear nowhere.
- **Exactly one annex** — Annex A (informative), A.1 to A.18. There is no Annex B.
- Fourth edition changes: remote auditing guidance drawn from ISO/IEC TS 17012, and an
  expanded Annex A covering remote methods and virtual locations.

---

## 1. Scope and positioning

**What this credential attests.** That the holder can plan and conduct an internal audit
of an AI management system against ISO/IEC 42001:2023, using ISO 19011:2026 methodology,
and can report findings that survive challenge.

**In scope.** First-party audit of the holder's own organization: programme management,
audit conduct, evidence and sampling, testing the AIMS against 42001 as criteria, and
findings through follow-up.

**Out of scope**, stated so the JTA does not drift:

- Technical AI assurance — bias metrics, model evaluation, red-teaming as engineering work.
- Implementing an AIMS. That is a Lead Implementer competence and a separate scheme.
- Certification-body process, audit-time calculation, certification decisions.
- Lead-auditor competences: leading a team, ISO/IEC 17021-1 certification cycles.
- Anything requiring ISO/IEC 42006 clause content.

**Eligibility.** None. No audit hours, no employment history, no application. Internal
audit is where an auditor *begins* accumulating experience; gating it on experience
closes the door the credential exists to open. Neither 42001 clause 9.2 nor ISO 19011
requires an internal auditor to hold any certification — the organization determines
competence. A recommended profile may appear in the scheme document as guidance; it is
not a prerequisite, because Certidemy has no verification workflow and **a declared
criterion that is not applied is worse than no criterion**.

---

## 2. What makes this cert distinct from ISMS-IA

Five things a competent ISO/IEC 27001 internal auditor would get wrong on first contact
with 42001. Each is load-bearing on at least one task.

1. **The AI system impact assessment (6.1.4, 8.4) is a second required artifact**,
   distinct from the risk assessment, addressing consequences for individuals, groups
   and societies — and 6.1.4 requires its results to be *considered in* the risk
   assessment. There is no 27001 analogue. **This is the signature competence.**
2. **Normativity is layered.** Annex A is `shall`; Annex B is normative but written in
   `should` and binds through 6.1.3 e); Table A.1 is conditional per Annex A.1. An
   auditor who raises a nonconformity against an Annex B sentence is wrong, and an
   auditor who treats Annex B as ignorable is also wrong.
3. **Scope determination is harder.** Clause 4.1 has the organization determine *its
   roles* with respect to its AI systems — developer, provider, user, or several at
   once — and scope follows from that determination. 27001 scoping has no equivalent move.
4. **Unfamiliar evidence types.** The A.4 resource controls, the A.6 life-cycle controls
   and the A.7 data controls call for documentation about data, tooling, compute and
   human competence that a classic management-system auditor has never sampled.
5. **Climate change is native to 4.1**, not an amendment.

---

## 3. Domain structure (proposed)

| # | Domain | Weight | Tasks |
|---|---|---|---|
| D1 | The internal audit function and its boundaries | 12.50% | 5 |
| D2 | Audit programme management | 20.00% | 7 |
| D3 | Conducting the audit: evidence, sampling and testing | 20.00% | 8 |
| D4 | Auditing the AIMS against ISO/IEC 42001 as criteria | **30.00%** | **13** |
| D5 | Findings, reporting, follow-up and management review | 17.50% | 7 |
| | **Total** | **100%** | **40** |

### Rationale

The spine is deliberately parallel to ISMS-IA — two internal-auditor schemes in one
family should share a structure, and only D4 names a different criteria standard. That
is defensible scheme design, and it makes the es-419 and pt-BR domain translations
near-mechanical.

**One change from ISMS-IA: 2.5 points move from D3 to D4** (ISMS-IA is 25/25).

- **D3 is method.** ISO 19011 does not change between the two certs, so most of D3's
  content is shared with ISMS-IA. It does not grow.
- **D4 is where AIMS-IA is genuinely larger than its sibling**, for the five reasons in
  §2 — layered normativity plus a second required assessment artifact plus role-based
  scoping. Eleven tasks is what that surface needs.

**A second 2.5 points moved D3 to D4 at v1.1**, when review surfaced that no task
tested the substantive Annex A control families at all (§5, gap 1). The reasoning is
the same one, applied again: D3 is method and does not grow, D4 is criteria and did.
D3 now sits at 20.00% across 8 tasks against ISMS-IA's 25.00% across 9 — one fewer
task, and the same per-task weight.

Weight per task lands between 2.31 and 2.86 across all five domains. D4 is the low end
because it is the large domain; at 50 exam items that is roughly 15 items across 13
tasks, which is workable.

### The D3/D4 boundary rule

> **D3 asks "is this evidence sufficient?" D4 asks "sufficient for which requirement?"**

Sampling model documentation, interviewing a data scientist, auditing a virtual location
— D3. Whether documented tooling resources satisfy A.4.4, whether an impact assessment
meets 6.1.4, whether an Annex B deviation can be a nonconformity at all — D4.

---

## 4. Bloom distribution

| Level | Tasks | Share of tasks | Weighted share | Notes |
|---|---|---|---|---|
| 2 — Understand | 5 | 12.5% | 13.02% | |
| 3 — Apply | 7 | 17.5% | 17.50% | |
| 4 — Analyze | 28 | 70.0% | **69.48%** | Level II contract applies |
| 5-6 | 0 | | | Reserved for simulations |

**Two columns, because they are different numbers and only one of them is the
blueprint's.** Share of tasks counts rows. Weighted share applies each domain's
per-task weight — D4's 13 tasks carry 2.308 points each against D2's 2.857 — and is
what `exam_blueprint.cognitive_profile` records. The blueprint value is **computed from
`v_cognitive_profile` after the task rows land**, never typed in; the figures above are
the hand-check the migration asserts against.

**The gate is `tier >= 2 AND bloom_level = '4_analyze'`, both conditions.** The 28
analyze tasks generate on the Level II contract: four options, all defensible, one best.
The 12 understand and apply tasks stay on the Level I contract — forcing four-defensible
onto a task with one right answer produces a coin flip, not a harder item.

ISMS-IA sits at 65.6% analyze. AIMS-IA is at 69.48%, and both v1.1 additions are
analyze tasks. **This makes duration re-derivation non-optional rather than merely
good practice**: at 70%, roughly 35 of 50 items carry a ~90-word stem and four
~200-character options, which is more reading than the ISMS-IA measurement assumed.
Do not inherit 150 minutes — measure AIMS-IA's own items.

---

# Domain 1 — The internal audit function and its boundaries (12.50%)

**Description.** Who the internal auditor is, what governs their work, and what does
not. Establishes ISO 19011 as method and ISO/IEC 42001 as criteria, the seven principles
and how they interact, and the boundary against certification-body activity. Without
this, every downstream judgment rests on borrowed assumptions.

## Tasks

### Task 1.1 — Classify a described audit engagement as first, second or third party and locate the internal auditor's remit within it

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|3 (Apply)|
|Concept slugs|`aia-audit-party-types`, `aia-internal-audit-definition`, `aia-audit-client-vs-auditee`|

**KSAs:**
* **K:** ISO 19011:2026 Table 1 — first party is internal audit, second party is external-provider or interested-party audit, third party is certification audit or accreditation assessment. Clause 3.1 Notes 1-2.
* **S:** Place a described engagement in the correct category.
* **A:** Resisting the assumption that "audit" means an outsider with a certificate.

### Task 1.2 — Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-seven-principles`, `aia-principles-carry-no-precedence`, `aia-principle-interaction-in-practice`, `aia-professional-judgement`|

**KSAs:**
* **K:** The seven principles at 4.2-4.8. Clause 4.1 states adherence is fundamental and that Clauses 5 to 7 are based on them; it states nothing about ranking.
* **S:** Identify which principles a situation actually engages — not every principle bears on every situation — and state what a defensible resolution weighs.
* **A:** Tolerating that the text does not decide it for you.

> **Authoring note.** The absence of a ranking rule is an observation about the text; a
> stated rule of no ranking is a claim the text does not make. This distinction cost
> ISMS-IA a migration (198). Concept descriptions must not repeat that error.

### Task 1.3 — Apply the distinction between ISO 19011 as methodology and ISO/IEC 42001 as criteria to a proposed audit finding

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|3 (Apply)|
|Concept slugs|`aia-method-vs-criteria`, `aia-19011-is-guidance-only`, `aia-no-certification-to-19011`, `aia-audit-criteria-definition`|

**KSAs:**
* **K:** ISO 19011:2026 contains one `shall` (patent boilerplate) and 264 `should`; clause 1 says it gives guidance. It has no normative references and names no management-system standard. 42001 names it once, in a Note to entry at 3.18.
* **S:** Given a proposed finding, identify whether the criterion cited is capable of being a criterion at all.
* **A:** Refusing to write "ISO 19011 requires".

### Task 1.4 — Analyze how an internal auditor preserves objectivity where independence from the audited activity is not practicable

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-independence-wherever-practicable`, `aia-objectivity-safeguards`, `aia-small-organization-constraint`, `aia-42001-impartiality-clause`|

**KSAs:**
* **K:** ISO 19011:2026 clause 4.6 asks auditors to be independent of the activity audited wherever practicable and, where internal auditors cannot be, to make every effort to remove bias and encourage objectivity. ISO/IEC 42001 clause 9.2.2 b) asks the organization to select auditors and conduct audits to ensure objectivity and the impartiality of the audit process.
* **S:** Evaluate proposed safeguards where the only competent person also built the thing.
* **A:** Naming one's own conflict rather than working around it.

> **Authoring note.** Neither standard *forbids* auditing your own work. That claim is
> widely taught and is not in either text.

### Task 1.5 — Classify activities in a described audit programme as within or outside the internal auditor's remit

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|3 (Apply)|
|Concept slugs|`aia-internal-vs-certification-audit`, `aia-17021-1-governs-certification-bodies`, `aia-42006-scope-boundary`, `aia-no-certification-decision`|

**KSAs:**
* **K:** ISO 19011:2026 states that ISO/IEC 17021-1 provides the requirements for third-party certification audits. ISO/IEC 42006:2025 supplements 17021-1 with AI-specific requirements for bodies auditing and certifying an AIMS. Neither applies to the candidate.
* **S:** Identify which activities in a described programme fall outside the internal auditor's remit.
* **A:** Not importing certification-audit habits into a first-party programme.

> **Authoring note.** No item may cite a clause, table or annex of 17021-1 or 42006 —
> neither document is held.

---

# Domain 2 — Audit programme management (20.00%)

**Description.** The programme above the individual audit: objectives, risks, resources,
competence, scope, methods, monitoring and improvement. ISO 19011:2026 clause 5
throughout, with the AIMS-specific twist that programme scope depends on which roles the
organization holds toward its AI systems.

## Tasks

### Task 2.1 — Explain the objectives an AIMS audit programme serves and how they derive from organizational context

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Concept slugs|`aia-programme-objectives`, `aia-objectives-from-context`, `aia-programme-vs-individual-audit`|

**KSAs:**
* **K:** ISO 19011:2026 clause 5.2. The distinction between programme-level and audit-level objectives.
* **S:** Trace a stated programme objective back to a contextual driver.
* **A:** Treating the programme as a designed thing, not a calendar.

### Task 2.2 — Analyze how audit programme risks and opportunities shape its scope and resourcing

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-programme-risks`, `aia-risk-based-approach`, `aia-programme-resources`, `aia-risk-vs-evidence-tension`|

**KSAs:**
* **K:** Clauses 5.3 and 5.4.4. The risk-based approach at 4.8 "should substantively influence the planning and implementation of the audit programme".
* **S:** Given constrained hours, justify where audit effort concentrates.
* **A:** Accepting that concentrating effort means accepting thinner coverage elsewhere, and saying so.

### Task 2.3 — Determine the competence an AIMS audit team requires given the AI systems in scope

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-auditor-competence`, `aia-aims-specific-knowledge`, `aia-technical-expert-vs-auditor`, `aia-competence-gap-remedies`|

**KSAs:**
* **K:** ISO 19011:2026 clauses 5.4.2, 7.2.3, 7.2.4. The distinction between an auditor and a technical expert on the team.
* **S:** Identify the competence gap a given AI system creates and select a remedy that does not compromise objectivity.
* **A:** Admitting where one cannot competently evaluate the evidence.

### Task 2.4 — Analyze how audit programme scope is set when the organization holds more than one role toward its AI systems

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-organizational-roles-4-1`, `aia-developer-provider-user`, `aia-multiple-roles-one-system`, `aia-scope-follows-roles`, `aia-role-changes-obligations`|

**KSAs:**
* **K:** ISO/IEC 42001 clause 4.1 has the organization consider the intended purpose of AI systems it develops, provides or uses, and determine its roles with respect to them. Clause 4.3 scoping follows.
* **S:** Given a described estate, determine which roles are in play — **including where one organization holds more than one role on a single AI system**, such as fine-tuning a third-party model and then providing it to customers — and determine what the programme must therefore cover.
* **A:** Not collapsing "we use AI" into a single undifferentiated role.

### Task 2.5 — Determine the objectives, scope and criteria for an individual AIMS audit

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-individual-audit-objectives`, `aia-audit-scope-definition`, `aia-criteria-selection`, `aia-42001-9-2-2-a`|

**KSAs:**
* **K:** ISO 19011:2026 clause 5.5.2. ISO/IEC 42001 clause 9.2.2 a) has the organization define the audit objectives, criteria and scope for each audit.
* **S:** Write a scope statement that a finding can later be tested against.
* **A:** Precision at the outset rather than at the report stage.

### Task 2.6 — Select auditing methods appropriate to AI system evidence, including remote methods and virtual locations

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-auditing-methods`, `aia-remote-audit-methods`, `aia-virtual-location`, `aia-method-fit-to-evidence`|

**KSAs:**
* **K:** ISO 19011:2026 clause 5.5.3 and Annex A.16; the fourth edition expanded this from ISO/IEC TS 17012. Much AIMS evidence has no physical location.
* **S:** Match method to evidence type and justify the choice.
* **A:** Not defaulting to on-site as the rigorous option or remote as the convenient one.

### Task 2.7 — Explain how audit programme results are monitored, reviewed and improved

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Concept slugs|`aia-programme-monitoring`, `aia-programme-review-improvement`, `aia-audit-records`|

**KSAs:**
* **K:** ISO 19011:2026 clauses 5.5.6, 5.5.7, 5.6, 5.7.
* **S:** Identify what a programme review should examine.
* **A:** Treating the programme itself as subject to improvement.

---

# Domain 3 — Conducting the audit: evidence, sampling and testing (22.50%)

**Description.** The individual audit from initiation to completion — ISO 19011:2026
clause 6 and Annex A. Domain 3 is about the *quality of the evidence*: whether it was
gathered soundly, sampled defensibly and verified. Whether it satisfies a particular
requirement is Domain 4.

## Tasks

### Task 3.1 — Place a described audit activity at its correct point in the sequence from initiation to completion

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|3 (Apply)|
|Concept slugs|`aia-audit-sequence`, `aia-initiating-the-audit`, `aia-audit-feasibility`, `aia-completing-the-audit`|

**KSAs:**
* **K:** ISO 19011:2026 clauses 6.2 to 6.6, including 6.2.3 feasibility.
* **S:** Place a described activity at the correct point in the sequence.
* **A:** Following a sequence without treating it as a script.

### Task 3.2 — Analyze whether the review of documented information supports proceeding to further audit activities

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-documented-information-review`, `aia-audit-planning`, `aia-plan-adjustment`, `aia-working-documents`|

**KSAs:**
* **K:** ISO 19011:2026 clauses 6.3.1, 6.3.2, 6.3.4 and Annex A.13.
* **S:** Judge whether what was supplied is enough to plan against, and what to do when it is not.
* **A:** Raising an obstacle early rather than absorbing it.

### Task 3.3 — Determine an appropriate sampling approach for AIMS audit evidence

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-sampling-general`, `aia-judgement-based-sampling`, `aia-statistical-sampling`, `aia-sample-defensibility`|

**KSAs:**
* **K:** ISO 19011:2026 Annex A.6, including A.6.2 and A.6.3.
* **S:** Choose an approach that fits the population and state what the sample can and cannot support.
* **A:** Not generalizing beyond what was sampled.

### Task 3.4 — Analyze whether information collected constitutes verified audit evidence

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-collecting-verifying-information`, `aia-evidence-vs-assertion`, `aia-verifying-information`, `aia-evidence-based-approach`|

**KSAs:**
* **K:** ISO 19011:2026 clause 6.4.7, Annex A.5, and the evidence-based principle at 4.7. Only verifiable information can be audit evidence.
* **S:** Separate what was demonstrated from what was described.
* **A:** Declining to record an assertion as evidence because the person was credible.

### Task 3.5 — Determine what to ask and how to record it when interviewing personnel involved in AI system work

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-conducting-interviews`, `aia-interview-selection-of-persons`, `aia-interview-confirmation`, `aia-leading-question-risk`|

**KSAs:**
* **K:** ISO 19011:2026 Annex A.17 ("Conducting interviews"), and clause 6.4.4 on communication during the audit.
* **S:** Frame questions that surface evidence rather than agreement, and confirm what was recorded.
* **A:** Interviewing a specialist without deferring to them or posturing against them.

### Task 3.6 — Analyze the sufficiency of evidence obtained through remote auditing methods

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-remote-evidence-sufficiency`, `aia-screen-share-verification`, `aia-remote-access-limits`, `aia-remote-vs-onsite-tradeoff`|

**KSAs:**
* **K:** ISO 19011:2026 Annex A.16 and clause 6.4.5 on access to audit information.
* **S:** Judge whether a remotely demonstrated control was actually verified.
* **A:** Naming the limits of what a screen share showed.

### Task 3.7 — Select sources of information appropriate to an AIMS audit

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|Medium|
|Frequency|Frequent|
|Bloom level|3 (Apply)|
|Concept slugs|`aia-sources-of-information`, `aia-aims-evidence-types`, `aia-data-and-tooling-records`|

**KSAs:**
* **K:** ISO 19011:2026 Annex A.14. AIMS-specific sources: data documentation, tooling and computing resource records, impact assessment outputs, event logs.
* **S:** Choose the source that answers the question being asked.
* **A:** Going to the record rather than the summary of the record.

### Task 3.8 — Explain the purpose and conduct of the opening and closing meetings

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|Medium|
|Frequency|Frequent|
|Bloom level|2 (Understand)|
|Concept slugs|`aia-opening-meeting`, `aia-closing-meeting`, `aia-guides-and-observers`|

**KSAs:**
* **K:** ISO 19011:2026 clauses 6.4.2, 6.4.3, 6.4.10.
* **S:** Identify what belongs in each meeting.
* **A:** Setting expectations rather than assuming them.

---

# Domain 4 — Auditing the AIMS against ISO/IEC 42001 as criteria (27.50%)

**Description.** The largest domain, and where this cert diverges from its ISMS sibling.
Testing the management system clause by clause, with the layered normativity of Annex A
and Annex B, the role-based scope, and the AI system impact assessment as a required
artifact with no ISO/IEC 27001 equivalent.

**KSA voice convention.** In every task below, **K** states what the standard says and
**S** states what the auditor does with it. Where a K field quotes a clause it uses the
clause's own modal, because preserving the modal is itself a tested competence (tasks
1.3, 4.9, 5.4). Where a K field paraphrases, it takes the auditor's voice.

## Tasks

### Task 4.1 — Analyze whether the organization's determination of its roles toward its AI systems is adequately evidenced

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-4-1-context`, `aia-role-determination-evidence`, `aia-role-assertion-vs-determination`, `aia-intended-purpose-consideration`, `aia-external-internal-issues`|

**KSAs:**
* **K:** ISO/IEC 42001 clause 4.1 — determine external and internal issues, consider the intended purpose of AI systems developed, provided or used, determine the organization's roles.
* **S:** Distinguish a reasoned determination — one that names the systems, applies the developer / provider / user categories to each, and records why — from a bare assertion that "we use AI tools". The first is auditable; the second is not.
* **A:** Pressing on a scope decision that was inherited rather than made.

### Task 4.2 — Analyze whether the AIMS scope statement is defensible given the AI systems and roles determined

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-4-3-scope`, `aia-scope-boundaries-applicability`, `aia-interested-party-requirements`, `aia-scope-exclusion-justification`|

**KSAs:**
* **K:** ISO/IEC 42001 clauses 4.2 and 4.3.
* **S:** Identify a system or activity that the stated scope excludes without justification.
* **A:** Treating a scope statement as testable rather than as given.

### Task 4.3 — Determine whether leadership and AI policy requirements are evidenced

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-5-leadership`, `aia-ai-policy-requirements`, `aia-policy-review-a-2-4`, `aia-roles-responsibilities-authorities`|

**KSAs:**
* **K:** ISO/IEC 42001 clauses 5.1, 5.2, 5.3; controls A.2.2, A.2.3, A.2.4, A.3.2, A.3.3.
* **S:** Distinguish a policy that exists from a policy that is maintained and reviewed.
* **A:** Auditing leadership commitment through artifacts, not attitude.

### Task 4.4 — Analyze whether the AI risk assessment process conforms to clause 6.1.2

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-6-1-2-risk-assessment`, `aia-risk-criteria`, `aia-repeatable-comparable-results`, `aia-no-risk-register-requirement`|

**KSAs:**
* **K:** ISO/IEC 42001 clause 6.1.2. Documented information is required about the *process*.
* **S:** Test the process against its own stated criteria.
* **A:** Not requiring an artifact the standard does not name.

> **Authoring note.** `risk register` appears zero times in ISO/IEC 42001. No item may
> assert that any clause requires one.

### Task 4.5 — Analyze whether the AI risk treatment process and the statement of applicability conform to clause 6.1.3

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-6-1-3-risk-treatment`, `aia-statement-of-applicability`, `aia-control-comparison-annex-a`, `aia-additional-controls-beyond-annex-a`|

**KSAs:**
* **K:** ISO/IEC 42001 clause 6.1.3 a) to f) — select treatment options, determine necessary controls and compare with Annex A to verify none necessary has been omitted, consider Annex A controls, identify additional controls, consider Annex B guidance, produce a statement of applicability with justification for inclusion and exclusion.
* **S:** Test whether the comparison against Annex A was actually performed.
* **A:** Reading the justification column rather than counting the rows.

### Task 4.6 — Distinguish the AI system impact assessment from the AI risk assessment and determine whether clause 6.1.4 is met

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|**Highest**|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-6-1-4-impact-assessment`, `aia-impact-vs-risk-assessment`, `aia-consequences-for-individuals-societies`, `aia-impact-results-into-risk-assessment`, `aia-clause-8-4-operational-impact-assessment`, `aia-annex-a-5-impact-controls`|

**KSAs:**
* **K:** ISO/IEC 42001 clause 6.1.4 — a process for assessing potential consequences for individuals, groups of individuals and societies from development, provision or use of AI systems; it addresses deployment, intended use and foreseeable misuse; it takes account of the technical and societal context and applicable jurisdictions; the result shall be documented; the organization shall consider the results in the risk assessment. Clause 8.4 performs it operationally. Annex A.5 "Assessing impacts of AI systems" carries the supporting controls, including A.5.2 (impact assessment process) and A.5.5 (assessing societal impacts).
* **S:** Identify an organization that has run a risk assessment and called it an impact assessment.
* **A:** Holding the distinction under pressure from an auditee who considers it pedantic.

> **Authoring note.** This is the signature task of the scheme. The two assessments are
> distinct and directional: 6.1.4 requires impact results to be *considered in* the risk
> assessment, not merged with it.

### Task 4.7 — Analyze whether documented information requirements under clause 7.5 are met

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-7-5-documented-information`, `aia-creating-updating-control`, `aia-awareness-and-communication`, `aia-documented-information-vs-record`|

**KSAs:**
* **K:** ISO/IEC 42001 clauses 7.1, 7.3, 7.4, 7.5.1-7.5.3. (Competence, clause 7.2, is task 4.13.)
* **S:** Test control of documented information rather than its existence.
* **A:** Distinguishing a document that is controlled from one that is merely present.

### Task 4.8 — Analyze whether operational planning and control under clause 8 is evidenced

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-8-1-operational-control`, `aia-outsourced-processes`, `aia-planned-changes-control`, `aia-clause-8-2-8-3-operational-risk`|

**KSAs:**
* **K:** ISO/IEC 42001 clauses 6.3, 8.1, 8.2, 8.3, 8.4. Clauses 8.2 and 8.3 require documented information of the *results*.
* **S:** Trace a planned change through to its controlled implementation.
* **A:** Following the process into practice rather than stopping at the procedure.

### Task 4.9 — Determine the normative status of an Annex A control and of Annex B guidance when testing conformity

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|**Highest**|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-annex-a-normative-shall`, `aia-annex-b-normative-but-should`, `aia-annex-b-binds-via-6-1-3-e`, `aia-annex-c-d-informative`, `aia-modal-shall-should-note`|

**KSAs:**
* **K:** Annex A is normative and Table A.1 controls are stated with `shall`. Annex B is normative and restates the same controls with `should`; it binds because 6.1.3 e) has the organization *consider* it, and B.1 exempts implementation guidance from the statement of applicability. Annexes C and D are informative. Clauses 4-10 contain no `should` at all.
* **S:** Given a proposed finding built on an Annex B sentence, determine whether it can stand.
* **A:** Preserving the modal in one's own writing.

### Task 4.10 — Analyze whether the controls declared in the statement of applicability are justified against Annex A

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-soa-inclusion-exclusion-justification`, `aia-controls-not-all-required`, `aia-control-objectives-a-2-to-a-10`, `aia-soa-vs-implementation-evidence`|

**KSAs:**
* **K:** Annex A.1 states that not all control objectives and controls in Table A.1 are required to be used, and that the organization can design and implement its own. Clause 6.1.3 f) requires the statement of applicability with justification for inclusion and exclusion.
* **S:** Test an exclusion against the risk treatment that produced it.
* **A:** Auditing the justification, not the checkbox.

> **Authoring note.** Never write "ISO/IEC 42001 requires an AI policy". Write "where
> A.2.2 is selected, the organization shall document an AI policy". Every Table A.1
> `shall` is conditional on selection.

### Task 4.11 — Explain how climate change is addressed in ISO/IEC 42001 clauses 4.1 and 4.2

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Concept slugs|`aia-climate-change-4-1`, `aia-climate-note-4-2`, `aia-climate-native-not-amendment`|

**KSAs:**
* **K:** Clause 4.1 has the organization determine whether climate change is a relevant issue; the NOTE at 4.2 observes that relevant interested parties can have requirements related to climate change. Both are in the published first edition — there is no amendment to ISO/IEC 42001.
* **S:** Identify what the auditor can and cannot require here: a determination was made, not a particular answer.
* **A:** Not inflating a determination requirement into a performance requirement.

### Task 4.12 — Analyze whether a control declared in the statement of applicability is implemented as declared

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-control-families-a-2-to-a-10`, `aia-declared-vs-implemented`, `aia-a-4-resource-documentation`, `aia-a-6-life-cycle-controls`, `aia-a-7-data-controls`|

**KSAs:**
* **K:** The auditor knows the nine Annex A control families — A.2 policies, A.3 internal organization, A.4 resources for AI systems, A.5 assessing impacts, A.6 AI system life cycle, A.7 data for AI systems, A.8 information for interested parties, A.9 use of AI systems, A.10 third-party and customer relationships — and knows that A.4, A.6 and A.7 call for documentation about data, tooling, computing and human resources that no ISO/IEC 27001 control asks for.
* **S:** The auditor selects a control the organization declared in the statement of applicability, traces it to the evidence of its implementation, and determines whether the evidence supports the declaration.
* **A:** Testing what was claimed rather than what would have been sensible to claim.

> **Authoring note.** This is one competence, not a coverage checklist. Items sample
> across the nine families; the task is "test a declared control against its evidence",
> which generalises. Do NOT split this into nine per-family tasks — a task is a
> competence, and forty tasks cannot each own a control.
>
> **SAMPLING DISCIPLINE — carry this into the item-generation brief and the lesson
> style guide.** Because the competence is general, an item writer will default to
> A.2 and A.3 (policies, internal organization) because those are the familiar ones,
> and under-sample A.4, A.6 and A.7 — which are precisely the unfamiliar evidence
> types that make this cert different from ISMS-IA. **The bank for this task must
> deliberately hit resources (A.4), life cycle (A.6) and data (A.7).** A 4.12 bank
> drawn only from A.2/A.3 has tested nothing an ISO/IEC 27001 auditor did not
> already know.

### Task 4.13 — Analyze whether people performing AI-related work meet the competence requirements the AIMS claims

|Attribute|Value|
|-|-|
|Domain|4|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-7-2-competence`, `aia-a-4-6-human-resources`, `aia-competence-evidence-vs-headcount`, `aia-organizational-vs-auditor-competence`|

**KSAs:**
* **K:** The auditor knows ISO/IEC 42001 clause 7.2 — determine necessary competence, ensure competence on the basis of education, training or experience, take action where needed, and retain documented information as evidence — and control A.4.6, under which the organization documents information about the human resources and their competences used across the AI system life cycle.
* **S:** The auditor tests whether the organization has determined what competence its AI work requires and evidenced that the people doing it hold it, rather than accepting a headcount or a job title as the evidence.
* **A:** Raising a competence gap about named colleagues without making it personal.

> **Authoring note.** Distinct from task 2.3, which is the AUDIT TEAM's competence. This
> task is the ORGANIZATION's competence, and it is a common nonconformity because the
> AIMS typically claims a competence standard the personnel records do not evidence.

---

# Domain 5 — Findings, reporting, follow-up and management review (17.50%)

**Description.** Turning evidence into findings that survive challenge, reporting them to
the people who can act, and closing the loop through corrective action and management
review. Where Domain 4 asks whether a requirement is met, Domain 5 asks whether the
statement saying so is defensible.

## Tasks

### Task 5.1 — Classify a described observation as a conformity, a nonconformity or an opportunity for improvement

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|3 (Apply)|
|Concept slugs|`aia-recording-conformities`, `aia-recording-nonconformities`, `aia-opportunity-for-improvement`, `aia-classification-scheme-is-an-organizational-choice`|

**KSAs:**
* **K:** ISO 19011:2026 Annex A.18.1-A.18.3. ISO/IEC 42001 uses only the term nonconformity and defines no severity scheme; a major/minor distinction comes from third-party certification practice under ISO/IEC 17021-1, and an internal programme may adopt any scheme it declares. **Unlike ISO/IEC 27001, which relies on ISO/IEC 27000 for the term, ISO/IEC 42001 defines nonconformity itself at clause 3.16** — non-fulfilment of a requirement — alongside conformity (3.15) and corrective action (3.17).
* **S:** Classify a described observation.
* **A:** Not upgrading an observation to make it land.

### Task 5.2 — Select the nonconformity statement that correctly links evidence to the requirement

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|3 (Apply)|
|Concept slugs|`aia-finding-structure`, `aia-evidence-requirement-link`, `aia-finding-does-not-prescribe-remedy`, `aia-finding-does-not-attribute-intent`|

**KSAs:**
* **K:** A nonconformity statement names the requirement, states the evidence, and asserts the gap between them.
* **S:** Choose the statement that does this and no more.
* **A:** Withholding the fix and the blame.

> **Authoring note.** This task has ONE right answer by construction and stays on the
> Level I contract. Its distractors prescribe a remedy, attribute intent, or cite a
> criterion that cannot bear the finding — real auditor errors and excellent
> distractors, but not defensible calls.

### Task 5.3 — Analyze a finding that engages more than one audit criterion

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-multiple-criteria-findings`, `aia-combining-vs-separating-findings`, `aia-criteria-cross-reference`|

**KSAs:**
* **K:** ISO 19011:2026 Annex A.18.4 on dealing with audit findings related to multiple criteria.
* **S:** Decide whether to record one finding referencing several criteria or several findings.
* **A:** Choosing for the reader's benefit rather than the tally.

### Task 5.4 — Determine whether a proposed finding is supportable given the normative status of the clause cited

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|**Highest**|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-finding-against-should-text`, `aia-finding-against-annex-b`, `aia-finding-against-a-note`, `aia-nonconformity-needs-a-shall`|

**KSAs:**
* **K:** A nonconformity requires an unfulfilled requirement. ISO 19011 contains none. Annex B is written in `should`. Notes are not requirements — with the 3.26 drafting anomaly noted and avoided as an item basis.
* **S:** Identify which of several proposed findings can actually stand, and restate the others as observations.
* **A:** Withdrawing one's own finding when the criterion will not bear it.

> **Authoring note.** This task is the payoff of 1.3 and 4.9 and is where the scheme's
> central competence is measured. It pairs with the grounding rule that a key must never
> write "ISO 19011 requires".

### Task 5.5 — Analyze the adequacy of an audit report for its intended recipients

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|Medium|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-audit-report-content`, `aia-report-distribution`, `aia-fair-presentation-in-reporting`, `aia-confidentiality-in-reporting`|

**KSAs:**
* **K:** ISO 19011:2026 clauses 6.5.1 and 6.5.2; the fair presentation principle at 4.3 and confidentiality at 4.5.
* **S:** Judge whether a report is complete without disclosing what it should not.
* **A:** Writing for a reader who was not in the room.

### Task 5.6 — Determine whether corrective action and its follow-up satisfy clause 10.2

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|High|
|Frequency|Frequent|
|Bloom level|4 (Analyze)|
|Concept slugs|`aia-clause-10-2-corrective-action`, `aia-correction-vs-corrective-action`, `aia-cause-analysis`, `aia-follow-up-verification`|

**KSAs:**
* **K:** ISO/IEC 42001 clause 10.2 — react to the nonconformity, evaluate the need for action to eliminate the causes, implement, review effectiveness. ISO 19011:2026 clause 6.7 on audit follow-up.
* **S:** Distinguish a correction from a corrective action and judge whether effectiveness was reviewed.
* **A:** Not closing a finding because the immediate symptom is gone.

### Task 5.7 — Explain how internal audit results feed the management review inputs in clause 9.3.2

|Attribute|Value|
|-|-|
|Domain|5|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Concept slugs|`aia-clause-9-3-management-review`, `aia-audit-results-as-review-input`, `aia-review-results-9-3-3`|

**KSAs:**
* **K:** ISO/IEC 42001 clause 9.3.2 lists audit results and trends in nonconformities and corrective actions among management review inputs; 9.3.3 requires documented results.
* **S:** Trace an audit finding to its place in the review.
* **A:** Seeing the audit as an input to governance rather than an end in itself.

---

## 5. External review disposition (v1.0 -> v1.1)

Reviewed externally, rated 8.6/10, *"almost ready to lock"*. Three actions were asked
for. All three are addressed below, two by change and one by evidence.

### Accepted, with change

**Gap 1 — no task tested the Annex A control families. WIDENED and accepted.**
The review named A.6 life-cycle documentation. Checking Annex A against the standard
showed the gap is broader than A.6: there are **nine control families** (A.2 to A.10,
38 controls) and v1.0 named only A.2 and A.3, inside task 4.3. A.4, A.5, A.6, A.7,
A.8, A.9 and A.10 appeared nowhere. **New task 4.12**, framed as one competence — test
a declared control against its implementation evidence — rather than nine per-family
tasks, because a task is a competence and 38 tasks cannot each own a control. Items
sample across families.

**Gap 2 — organizational competence. Accepted as stated.**
Correct, and it exposed a defect: v1.0 task 4.7 was titled for clause 7.5 but its KSA
silently carried 7.2, so competence was tested by a task that did not say so. **New
task 4.13** takes clause 7.2 and control A.4.6; 4.7 keeps 7.1, 7.3, 7.4 and 7.5. The
review's framing is right that this is a different nonconformity from 2.3 — that is the
audit team's competence, this is the organization's.

**Task 2.4 — multi-role.** Accepted. The S field now names the case explicitly: one
organization holding more than one role **on a single system**, e.g. fine-tuning a
third-party model and then providing it onward.

**Task 4.1 — assertion vs determination.** Accepted. Slug `aia-role-assertion-vs-
determination` added and the S field now states the test: a determination names the
systems, applies the categories, and records why; "we use AI tools" does not.

**KSA voice.** Accepted as a stated convention rather than 38 rewrites — see the note
at the head of Domain 4. K states what the standard says, S states what the auditor
does. K fields quoting a clause keep that clause's modal deliberately, because the
modal is a tested competence in 1.3, 4.9 and 5.4; flattening every `shall` into auditor
voice would erase the distinction the scheme exists to measure.

### Accepted, no change needed — already true

**Recommendation 3 — confirm the grounding carries the two never-write rules.**
Verified mechanically against `scripts/lib/item-grounding.mjs` at commit `9f0a9c2`.
All six of these resolve PRESENT for a cert named "ISO/IEC 42001:2023 Internal Auditor":

```
PRESENT  never write "ISO 19011 requires"
PRESENT  never write "ISO/IEC 42001 requires an AI policy"
PRESENT  Table A.1 shall is conditional on selection (Annex A.1)
PRESENT  Annex B is normative but written in should
PRESENT  Annex B binds via clause 6.1.3 e)
PRESENT  no clause requires a risk register
```

**Weights, the D3/D4 boundary rule, task 4.6 as signature, 4.9 as second, 5.2 demoted
to Apply, 38 tasks not needing merges.** All confirmed by the review. Unchanged, except
that the two new tasks take the count to 40 and move a further 2.5 points from D3 to
D4 on the reasoning already given in section 3.

### Amendment 1 — cognitive profile sanity-check (§5.1)

Raised after locking: the profile read **understand 25.52 / apply 5.00 / analyze
69.48**, against ISMS-IA's **5.0 / 29.4 / 65.6**. Nearly inverted on the middle two,
for two schemes deliberately built parallel. 5% apply is implausibly low for an
internal-auditor credential — classifying a finding and selecting a nonconformity
statement are apply work, and there should be more than two such tasks.

**Investigated, and the anomaly was real but not where it looked.** COGNITIVE-MODEL.md
is explicit that the **task statement's verb declares the cognitive level**, and that
this is the only place level is declared anywhere in the system. By that rule all ten
understand tasks were correctly *labelled* — and that was the defect. Five of them
carried statements saying *Explain* or *Distinguish* while their own **S fields
described applied work**:

| Task | S field said | Statement said |
|---|---|---|
| 1.1 | "Place a described engagement in the correct category" | Distinguish |
| 1.3 | "Given a proposed finding, identify whether the criterion cited is capable of being a criterion" | Distinguish |
| 1.5 | "Identify which activities in a described programme fall outside the internal auditor's remit" | Distinguish |
| 3.1 | "Place a described activity at the correct point in the sequence" | Explain |
| 5.1 | "Classify a described observation" | Explain |

**This is the migration-198 defect exactly** — ISMS-IA task 1.2 asked which principle
*governs* while one of its own concepts said none did, and the generator was handed two
incompatible instructions and produced both kinds of key across runs.

**Fixed by moving the statement to match the competence, not by relabelling the bloom.**
A relabel would have left the statement lying about what the task tests, and the
statement is what a candidate reads on the published blueprint. All five now carry apply
verbs — *Classify*, *Apply*, *Place* — and `bloom_level = 3_apply`. Their S and K fields
were already correct and are unchanged.

**Resulting profile: understand 13.02 / apply 17.50 / analyze 69.48.** The analyze share
is untouched, because nothing moved into or out of it. Five understand tasks against
ISMS-IA's two is still the more foundational shape, and that is defensible: 42001's
layered normativity has to be established before it can be applied.

**Left alone deliberately.** Nine analyze tasks open with *Determine*, which
COGNITIVE-MODEL.md §96 maps to Apply. ISMS-IA does the same on its flagship analyze task
1.2. The operative rule is the competence — *determine which of several defensible
positions holds, given considerations that pull against each other* is analyze — and the
verb list is a heuristic that the practice has already outgrown. **Recorded as a
documentation defect in COGNITIVE-MODEL.md, not churned here**: changing nine statements
to satisfy a heuristic that the sibling scheme already departs from would break family
parallelism to fix a doc.

### Found during the review pass, not raised by the reviewer

**Annex A.5 belongs in task 4.6.** The family "Assessing impacts of AI systems" —
A.5.2 impact assessment process, A.5.5 assessing societal impacts — is the control
support for clause 6.1.4, and v1.0's signature task did not name it. Added to the KSA
and as slug `aia-annex-a-5-impact-controls`.

### Resolved after the review — task 5.1 parity with ISMS-IA

The review asked that the no-severity-scheme language match ISMS-IA's treatment. That
was a database question, not a judgment, and it was settled by query:

```sql
select con.slug, con.description
from public.concepts con
join public.certifications c on c.id = con.certification_id
where c.code = 'ISMS-IA'
  and (con.slug ilike '%severity%' or con.slug ilike '%major%'
       or con.description ilike '%major%minor%')
order by con.slug;
```

ISMS-IA's slug is **`ia-classification-scheme-is-an-organizational-choice`** — a name
about the competence, not about the absence — so AIMS-IA takes
`aia-classification-scheme-is-an-organizational-choice` rather than the descriptive name
originally drafted.

The query also returned a third element that would otherwise have been dropped: ISMS-IA's
description records **where the term `nonconformity` itself is defined**. For ISO/IEC
27001 that is ISO/IEC 27000, an external vocabulary standard. **For ISO/IEC 42001 it is
clause 3.16 of the standard itself** — non-fulfilment of a requirement — alongside
conformity (3.15) and corrective action (3.17). Structural parity with the sibling, and
a stronger position: this scheme needs no external vocabulary standard for its core
terms. Task 5.1's K field now says so.

---

## 6. Downstream, once locked

| Stage | Artifact |
|---|---|
| 5 | `SCHEME-AIMS-IA.md` |
| 6 | Migration **205** — cert, domains, concepts, tasks, task_concepts (40 tasks, 158 concepts) |
| 6 | Migration **206** — modules |
| 6 | `exam_blueprint.item_model.cue_tolerance` declared in 205 — the L1 default of 5 chars / 10% rejects correct L2 items. Numbers re-measured against AIMS-IA's own bank, not copied from ISMS-IA's 25/15/100. |
| 7 | Lessons — module 1, style-guide gate, then the rest |
| 9 | `CHUNK=3`, `BANK_REVISION=v3-l2`. Cue tolerance comes from the blueprint; do **not** set `KEY_LEN_MARGIN` / `KEY_LEN_PCT` / `LEN_SPREAD_MAX`. If the generator prints `(default)` rather than `(blueprint)`, 205 did not declare it. |
| 12 | Validity, duration, `num_questions`, `passing_score_pct` — decided with reasoning recorded in the migration, not inherited from ISMS-IA. |

**Grounding is already in place** — `AUDIT_METHOD` + `CRITERIA_42001` compose for any
cert whose name matches `/auditor|internal audit/` and `/42001|aims/`
(`scripts/lib/item-grounding.mjs`, `9f0a9c2`). The name **`ISO/IEC 42001:2023 Internal
Auditor`** is load-bearing for that routing.

---

*End of AIMS-IA_JTA — v1.1-LOCKED. Stage 4 complete. Proceed to Stage 6 (migrations 205, 206).*
