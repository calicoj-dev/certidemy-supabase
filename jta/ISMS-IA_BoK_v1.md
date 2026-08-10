# ISMS-IA — Body of Knowledge (Stage 1 decision)

**Credential name:** ISO/IEC 27001:2022 Internal Auditor - AI
**Credential code:** `ISMS-IA`
**Family:** `ai-security`, `sort_order` 2 (after `ISMS-F`)
**Tier:** **II** — single-BEST-answer, first Level II in the catalogue
**Status on authoring:** `draft`
**Date:** 2026-08-09
**Gate:** Juan signs off before JTA authoring begins (CERT-CREATION Stage 1).

---

## 1. THE DECISION IN ONE PARAGRAPH

`ISMS-IA` certifies competence to **plan, conduct, report and follow up an
internal audit of an information security management system built to
ISO/IEC 27001:2022**, using ISO 19011:2026 as the audit methodology and 27001 as
the audit criteria — including where that ISMS has AI systems inside its scope,
and where AI tooling is used in the conduct of the audit itself. It is a
Level II credential: the candidate is asked to *judge among defensible options*,
not to *recall and apply*.

---

## 2. WHY THIS IS A SECOND JOB, NOT A HARDER FIRST ONE

The ladder rule — **two credentials need two jobs** — is what shelved `AIGRM-II`,
and it is the first thing an auditor tests when a body ships a second credential
on the same standard. `ISMS-IA` passes it on the body of knowledge itself, before
any argument about difficulty:

| | `ISMS-F` | `ISMS-IA` |
|---|---|---|
| Primary source | ISO/IEC 27001:2022 | **ISO 19011:2026** |
| 27001's role | **the subject** — clauses and controls are what you learn | **the criteria** — clauses and controls are what you audit *against* |
| Question the cert answers | *What does an ISMS consist of?* | *Does this ISMS conform, and how do I establish that?* |
| Competence shape | understand and apply a framework | gather evidence, weigh it, reach a defensible conclusion |
| Job in an org | anyone in scope of the ISMS | the clause 9.2 internal audit function |

Different primary standard, different competence, different role. This is the
same relationship `ISMS-F` and `AIMS-F` already have — two Foundations on
adjacent standards with visibly different cognitive profiles — and it is settled
by query rather than by prose, per §7.

**The commercial half of the same point:** clause 9.2 requires internal audits at
planned intervals, and an organization cannot use its certification body's
auditors to satisfy it. Every company in LATAM pursuing or holding 27001
certification needs internal audit competence as a *condition*, not as career
development. That is a budget line, and it is a recurring one.

---

## 3. THE SOURCE STACK

Six layers, each with an explicit role. The role assignment is the whole point —
this is the document lesson authoring reads before it attributes anything.

### Layer 1 — Audit methodology (guidance, not requirements)

**ISO 19011:2026**, fourth edition, published 2026-05-27, superseding :2018.

This is the primary source of the credential. Verified against iso.org
2026-08-09: Edition 4, 2026-05, 46 pages, stage 60.60 published, ISO/TMBG.

What the 2026 edition changed, and why it matters here:

- **Remote and hybrid auditing is now a defined method**, not a complementary
  note. The remote audit method is defined in clause 3, and there is guidance on
  choosing between remote, on-site and hybrid.
- **Digital competence is explicit** in auditor competence.
- **Evidence reliability guidance is expanded** — verifiability of information,
  evaluating the reliability of what is collected.
- **Risk-based approach strengthened** — audit effort concentrated where it
  matters, which for an ISMS means access control and incident management ahead
  of low-risk support processes.
- Core principles unchanged: integrity, fair presentation, due professional care,
  confidentiality, independence, evidence-based approach, risk-based approach.

> **The market position this creates.** Every Internal Auditor course currently
> sold teaches :2018. This is a dateable, checkable edge in the source, not a
> claim about us. It should be stated as a fact about the standard and never as
> a comparative claim about a competitor (`CLAIMS-POLICY`; and no competitor is
> ever named, per `/our-standard` §3.4).

### Layer 2 — ISMS-specific audit guidance

**ISO/IEC 27007:2020**, third edition. Guidance on the ISMS audit programme, the
conduct of ISMS audits, and ISMS auditor competence, *in addition to* 19011.
States no requirements.

**Volatility:** a DIS revision is in progress. Re-check before lesson authoring
and again before publish.

### Layer 3 — The audit criteria

**ISO/IEC 27001:2022 + Amendment 1:2024.** Clauses 4–10 and Annex A, treated as
the yardstick rather than the syllabus. Amd 1:2024 names **climate change**
specifically in 4.1 — not "environmental conditions" (`ISMS-F` Finding 1).

Annex A control counts, counted from the standard: Organizational 37, People 8,
Physical 14, Technological 34 = **93**.

### Layer 4 — Control assessment depth

**ISO/IEC TS 27008** — guidelines for the assessment of information security
controls, including technical assessment. Bounds how deep a control test goes
before it stops being an ISMS audit and becomes a security engineering exercise.

**Edition to be confirmed at Stage 2** before any concept cites it.

### Layer 5 — Conformity assessment context (boundary only)

**ISO/IEC 17021-1:2015** and **ISO/IEC 27006**. These are *not* normative for
internal audit and the credential does not teach to them. They are here for one
lesson's worth of boundary-setting: what a first-party audit is, and what it is
not.

> **This layer is the single highest-risk attribution surface in the catalogue.**
> See §4.

### Layer 6 — The AI weave

Woven through every domain, concentrated in the two heaviest. Three distinct
threads, and they must not be collapsed into one:

1. **Auditing an ISMS whose scope contains AI systems.** Shadow AI surfacing
   during scope determination. Model weights, training data and prompt logs as
   information assets. AI vendors and model APIs inside the supplier-relationship
   controls. Whether a control's stated implementation still holds when the
   process it protects became non-deterministic.
2. **Using AI in the conduct of the audit.** Log triage, evidence sampling,
   document review, control-narrative summarisation — and the problem this
   creates, which 19011:2026 speaks to directly through digital competence and
   evidence reliability. *An AI-summarised document the auditor never opened is
   not verified information.* This thread is where the credential is genuinely
   ahead of the field.
3. **The integrated ISMS/AIMS audit.** Where 27001 and 42001 overlap and where
   they do not — 42001 Annex B.6.1.2 anticipates the integration explicitly.
   `ISMS-F` task 3.7's finding stands: **ISMS competence records do not satisfy
   AIMS competence.** This thread is also the bridge to `AIMS-IA`.

**ISO/IEC 27090 is NOT in the stack.** Still FDIS as of 2026-08-09; the ballot
closes **2026-08-18**. It may not be cited as a published normative source.
Re-check before lesson authoring — when it publishes it becomes directly relevant
to thread 1, and `ISMS-F` D1/D4 need a pass at the same time.

---

## 4. THE ATTRIBUTION MAP

All three `ISMS-F` content defects were one shape: **something true and well
taught, attributed to text that does not say it.** This credential sits directly
on the seam that produced them, and it has three sources in play instead of one.
`ATTRIBUTION_RULES` in `item-pipeline.mjs` will get its hardest test here.

The table below is authoring input, not commentary. Anything in the right column
is a defect regardless of how true the claim is.

| Claim | Actual source | The error to expect |
|---|---|---|
| Auditors shall not audit their own work | **ISO 19011 guidance** | Attributed to 27001. 9.2.2 b) says only: select auditors and conduct audits ensuring objectivity and impartiality. **This exact defect shipped in `ISMS-F` lesson 05-02 and survived three regeneration attempts.** |
| Findings are classified major / minor | **ISO/IEC 17021-1** practice | Attributed to 27001. 27001 says *nonconformity* and requires reaction, correction and corrective action at 10.2. It defines no severity scheme. An internal programme may adopt one — that is the organization's choice. |
| Three-year certificate cycle, stage 1 / stage 2, surveillance | **ISO/IEC 17021-1 and 27006** | Attributed to 27001. 27001 contains no conformity assessment provisions at all. The `AIMS-F` generator stated this correctly by name — hold that line. |
| The organization maintains a risk register | **nobody** | 27001 does not require a risk register. It requires documented information on the risk assessment process and results. |
| ISO 19011 requires X | **category error** | 19011 states no requirements. Nothing is ever *required by* 19011. You cannot be certified to it. |
| ISO/IEC 27000 defines the term | **no longer true** | 27000:2026 dropped "and vocabulary"; clause 3 went from ~77 defined terms to about 12. Define in our own words and name 27001 / 27002 / 27005 where the authoritative home matters. |
| Terms and definitions of ISO 19011 clause 3 | **verify each one** | Clause 3 changed in :2026 — the remote audit method was added. Do not carry a :2018 definition forward on memory. |

**Standing rule for this cert:** the credential teaches auditing *per 19011*,
assessed against 27001 *as criteria*. Any sentence that inverts those two roles
is wrong even when every fact in it is correct.

**The three PDFs stay open during authoring** — 19011:2026, 27001:2022+Amd1, and
27007:2020. Not consulted afterwards. Every one of `ISMS-F`'s findings would have
been caught by a second window.

---

## 5. SCOPE BOUNDARY

**In scope.** Audit programme design and risk-based prioritisation. Scope,
criteria and objective setting. Method selection including remote and hybrid.
Evidence gathering, sampling adequacy and evidence reliability. Testing an Annex A
control's operating effectiveness against its SoA claim. Interview technique as a
judgment about evidence, not as a performed behaviour. Finding classification
against a declared scheme. Reporting and follow-up. Feeding clause 9.3 management
review. Auditor independence and objectivity in a first-party setting. All three
AI threads.

**Out of scope, and named in the scheme.**

- **Performing the audit.** Opening and closing meetings, managing a defensive
  auditee, leading a team. Behavioural, not cognitive. No selected-response
  instrument reaches it.
- **Generating audit artefacts from scratch** — writing the audit plan, drafting
  the nonconformity report. Bloom 6. There are no options to choose among.
- **Third-party certification audit competence.** That is `ISMS-LA` and it is a
  different job with a different standard (17021-1) governing it.
- **Implementing an ISMS.** That is `ISMS-LI`, which is Bloom 6 generation and
  needs a constructed-response instrument we have not built. Named as a
  direction, not as a gap.
- **Technical security testing** at engineering depth — penetration testing,
  code review, configuration hardening. TS 27008 bounds this; the auditor
  establishes that testing happened and was competent, not the testing itself.

---

## 6. LEVEL II — WHAT MAKES IT ONE

Not difficulty. Cognitive demand, and the item contract that follows from it.

**The item contract.** Four options, all defensible on the facts given, one best.
Scoring stays dichotomous — one key, no partial credit. That sets the quality bar
directly: the gap between best and second-best must be wide enough that a
competent auditor lands on it reliably, and stateable in one sentence. Both halves
have to hold. An item whose second-best is actually *wrong* is a Level I item that
got through; an item whose reason takes a paragraph is a coin flip.

**Exam-scope rule.** A task is exam-scoped if its competence reduces to a
**judgment among presented options**. It is not if the competence is
**constructing** the options or **performing** the act. This is a per-task
property the JTA declares with a stated reason, and it replaces the raw Bloom
ceiling as the test — the ceiling was too blunt and produced the wrong answer for
auditing.

**Consequence for the database, to be resolved at Stage 2, not deferred past it.**
`verify-cert` invariant 16 forces `is_exam_scope = false` on `5_evaluate` tasks,
and `trg_item_bloom_matches_task` enforces Bloom from `public.tasks` on every
insert path. If the JTA declares any Bloom-5 task, both need to change together:
a new `tasks.is_selected_response_assessable` boolean, required for a Bloom-5 task
to be exam-scoped, with invariant 16 rewritten to check the flag instead of the
number. **Removing invariant 16 without replacing it is not on the table** — it
is the only structural thing standing between us and a credential that claims more
than it measures.

**Whether ISMS-IA needs Bloom 5 at all is a Stage 2 question, not a Stage 1
assumption.** *Classify this finding given these facts* is `4_analyze`. *Do the
accumulated findings warrant escalation ahead of the next management review* is
`5_evaluate`. The JTA decides how many of the latter exist. `ISMS-LA` will
certainly need the flag; this cert may not.

---

## 7. THE FALSIFICATION TEST

`AIMS-F` set its own before scaffold and passed it, and that is the artifact that
validated the build. `ISMS-IA` sets this one:

> **`4_analyze` (plus `5_evaluate`, if declared) must reach ≥ 55% of the computed
> profile, with `1_remember` at zero and `2_understand` below 25%.**

For reference, from `v_cognitive_profile`:

| cert | remember | understand | apply | analyze |
|---|---|---|---|---|
| ISMS-F | 10.39 | 56.77 | 22.68 | 10.17 |
| AIMS-F | none | 46.93 | 41.26 | 11.80 |
| SD-AI-I (heaviest L1) | 0 | 20.1 | 49.6 | 30.3 |

If the profile comes back understand-heavy, the JTA is describing **a Foundation
course about auditing** rather than an auditor credential, and it goes back to
Stage 2 before scaffold. Run the comparison the moment the scaffold lands. It also
makes the two-jobs argument computable rather than argued — the second time that
has been possible.

---

## 8. PROPOSED SHAPE (Stage 2 input, not locked)

| | |
|---|---|
| Domains | 5 |
| Tasks | ~35 — deliberately fewer than `ISMS-F`'s 49 |
| Exam | **50 items / 90 min** |
| Sampling | ~1.43 items per task, against `ISMS-F`'s 0.82 (the catalogue's worst) |
| Pass mark | **75%, provisional** — see below |
| Prerequisite | none enforced; `ISMS-F` or equivalent working knowledge assumed and stated |

**Domain sketch and weights:**

| # | Domain | Weight |
|---|---|---|
| D1 | The audit function and its boundaries | 15% |
| D2 | Audit programme management (clause 9.2) | 20% |
| D3 | Conducting the audit — evidence, sampling, testing | **25%** |
| D4 | Auditing the ISMS against 27001 as criteria | **25%** |
| D5 | Findings, reporting, follow-up, management review | 15% |

The two heaviest domains are where both AI threads concentrate — using AI in the
audit (D3) and auditing an AI-bearing ISMS (D4). **The AI is in the load-bearing
domains and woven through the rest; there is no AI domain.**

**On the pass mark.** Every existing cert is 80%. The cut score is
criterion-referenced, which means it should reflect what a minimally competent
candidate is expected to score *on these items* — and Level II items are built so
that the minimally competent candidate finds the second-best answer genuinely
attractive. Holding 80% across a change in item construction is not consistency,
it is a number carried forward without its reasoning. 75% is the recommendation,
stated as provisional and expert-judgment, with formal standard-setting named as
pending candidate data. **Reconcile against the live `certifications` row at
Stage 12** — `passing_score_pct` defaults to 70.00 and omitting the column seeds a
cert that passes at 70 with no error.

Fewer tasks is also deliberate. `ISMS-F` carries the catalogue's thinnest sampling
ratio and the scheme has to state it. A Level II with harder items and better task
coverage is the stronger product, and it costs fewer lessons.

---

## 9. VOLATILITY REGISTER

| Source | State at 2026-08-09 | Trigger |
|---|---|---|
| ISO 19011:2026 | **Published 2026-05-27.** In the stack | none — this is the current edition |
| ISO/IEC 27007:2020 | Current; **DIS revision in progress** | re-check before lesson authoring and before publish |
| ISO/IEC 27090 | **FDIS. Ballot closes 2026-08-18** | not citable. Re-check 2026-09; on publication, pass D1/D4 here *and* in `ISMS-F` |
| ISO/IEC TS 27008 | Edition unconfirmed | confirm at Stage 2 before any concept cites it |
| ISO/IEC 17021-1:2015 | Current; systematic review closed 2026-03-05 | boundary layer only; low impact |
| ISO/IEC 27000:2026 | Sixth edition, no longer the vocabulary standard | already governs; do not cite it as a source of definitions |

---

## 10. WHAT THIS UNBLOCKS

`AIMS-IA` (ISO/IEC 42001 Internal Auditor) is the direct sibling. The audit-process
spine — programme design, evidence and sampling, method selection, finding
classification, reporting, follow-up, independence — is roughly 40% shared. Only
the criteria layer changes, from 27001 to 42001. It is also the cert with no
incumbent to argue with.

`ISMS-LA` follows, and it is the one that needs the Bloom-5 flag and a real
argument for why lead-auditor judgment reduces to a choice among options. Not
this cycle.

`ISMS-LI` needs a constructed-response instrument with rubric grading. Named as a
direction. Not built.

---

## 11. SIGN-OFF

- [ ] Juan signs the BoK
- [ ] Stage 2 begins: `ISMS-IA_JTA_v1.md`

**Open at sign-off, carried into Stage 2:** TS 27008 edition; whether any task is
Bloom 5 and therefore whether the `is_selected_response_assessable` migration is
needed this cycle; migration tip (check `supabase/migrations/`, do not assume);
`ksa_is_provisional` still has no approval path and K/S/A fields are generator
input.

*End of ISMS-IA BoK v1.*
