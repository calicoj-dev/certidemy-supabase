# Certification Scheme — ISO/IEC 42001:2023 Internal Auditor (AIMS-IA)

**Scheme owner:** Certidemy (the certification body)
**Scheme code:** AIMS-IA
**Document version:** 1.0
**Status:** Pre-launch (`status = draft`, to flip `coming_soon` then `available`)
**Last updated:** August 2026

---

## About this document

This is the **certification scheme** for the ISO/IEC 42001:2023 Internal Auditor
credential: the published contract describing what the credential certifies, how a
candidate earns it, and how Certidemy keeps that decision fair, consistent and
defensible. It is written to align with the structure of the ISO/IEC 17024 framework
for bodies operating certification of persons.

**A note on accreditation status.** Certidemy is **not currently an accredited
certification body**. This scheme is designed to the ISO/IEC 17024 framework —
"audit-ready by design" — so that the credential is structurally legitimate now and
the body can pursue formal accreditation once operational history and candidate data
exist. Where a requirement depends on data or governance that only accumulates after
launch, this document says so plainly rather than overstating readiness.

**A note on subject matter and on which standards this scheme holds.** This credential
concerns *internal auditing of an AI management system*. Certidemy teaches the
structure and reasoning of the underlying standards in its own words; it does not
reproduce their normative text, and it does not present itself as, or as endorsed by,
ISO, IEC or any accreditation or certification body.

The scheme is unusual among Certidemy schemes in declaring **which source documents it
holds and what each is licensed to assert** — see §4.1. That declaration is not
decoration. It exists because an earlier generation pass on a sibling scheme produced
items asserting requirements that were not in the standard, sourced from model training
knowledge rather than from text. The rule that followed is that no assessable claim may
rest on a document the body does not hold.

**Terminology.** Cross-scheme terminology rules are stated once, in
`TERMINOLOGY-POLICY.md`, and are not restated here. §11 records only what is specific
to this scheme.

---

## 1. Scheme identification

| Field | Value |
|---|---|
| Credential name | ISO/IEC 42001:2023 Internal Auditor |
| Credential code | AIMS-IA |
| Issuing body | Certidemy |
| Credential family | Certidemy AI Governance & Service Management |
| Credential type | Judgment certification (Level II — single-**best**-answer) |
| Companion credentials | `AIMS-F` (same standard, Foundation tier) · `ISMS-IA` (same role, ISO/IEC 27001) |
| Languages offered | English, Latin American Spanish (es-419), Brazilian Portuguese (pt-BR) |
| Credential validity | 2 years from issuance (see §9) |
| Delivery | Online, remotely proctored-equivalent secure examination |

**The credential name is load-bearing.** The item generator resolves its subject-matter
grounding by matching the certification name: `/auditor|internal audit/` selects the
audit grounding, and `/42001|aims/` selects ISO/IEC 42001 as the criteria standard
rather than ISO/IEC 27001. Renaming this credential without updating
`scripts/lib/item-grounding.mjs` would silently generate 42001 items grounded in 27001
editions.

---

## 2. Purpose and scope

The AIMS-IA credential certifies that the holder can **plan and conduct an internal
audit of an AI management system against ISO/IEC 42001:2023**, applying ISO 19011:2026
audit methodology, and can write findings that survive challenge.

**In scope.** First-party audit of the holder's own organization: managing an audit
programme, conducting an individual audit, gathering and weighing evidence, testing the
management system against ISO/IEC 42001 as criteria, and carrying findings through
reporting, corrective action and management review.

**Explicitly out of scope.**

- **Technical AI assurance.** Bias metrics, model evaluation, red-teaming and adversarial
  testing as engineering activities. The auditor tests whether the organization does
  these things as it claims; the auditor does not perform them.
- **Implementing an AIMS.** That is an implementer competence and a separate scheme.
- **Certification-body process.** Stage 1 and stage 2 audits, audit-time determination,
  surveillance and recertification cycles, certification decisions, use of marks. These
  are governed by ISO/IEC 17021-1 and, for AI management systems, ISO/IEC 42006:2025 —
  neither of which applies to an internal auditor. The scheme tests the *boundary* (that
  these exist and are not the candidate's remit), never their content.
- **Lead auditor competences.** Leading an audit team is named in ISO 19011:2026 clause
  7.2.5 and is deliberately not assessed here.

---

## 3. Eligibility

**There are no prerequisites.** No prior certification, no professional experience, no
audit hours, no employment history, no application review.

**Rationale, stated because it differs from common market practice.** Commercial auditor
credentials commonly gate on declared audit hours and years of experience. Certidemy
does not, for three reasons:

1. **Internal audit is where an auditor begins accumulating experience.** Gating the
   entry credential on experience closes the door the credential exists to open.
2. **Neither standard requires it.** ISO/IEC 42001 clause 9.2 asks the organization to
   select auditors so as to ensure objectivity and the impartiality of the audit
   process; it names no certification. ISO 19011:2026 clause 7 offers guidance on
   evaluating auditor competence and requires nothing, of anyone.
3. **A declared criterion the body does not verify is worse than no criterion.**
   Certidemy operates no experience-verification workflow. Under ISO/IEC 17024 a scheme
   must define its prerequisites *and apply them*; declaring an unverified hours
   requirement would be a finding, not a strength.

**Recommended profile — guidance, not a prerequisite.** Candidates are best served by
prior familiarity with ISO/IEC 42001, for example through `AIMS-F`, and by some exposure
to management-system practice. This is advice to the candidate. It is not checked, and
no candidate is refused for lacking it.

---

## 4. Body of knowledge

| Attribute | Value |
|---|---|
| Domains | 5 |
| Tasks | 40 |
| Concepts | 158 |
| JTA of record | `AIMS-IA_JTA_v1_1.md` (v1.0-LOCKED) |

| Domain | Title | Weight | Tasks |
|---|---|---|---|
| D1 | The internal audit function and its boundaries | 12.50% | 5 |
| D2 | Audit programme management | 20.00% | 7 |
| D3 | Conducting the audit: evidence, sampling and testing | 20.00% | 8 |
| D4 | Auditing the AIMS against ISO/IEC 42001 as criteria | 30.00% | 13 |
| D5 | Findings, reporting, follow-up and management review | 17.50% | 7 |

**Why D4 is the largest domain.** The audit *method* — ISO 19011:2026 — does not change
between this scheme and `ISMS-IA`, so D2 and D3 carry substantially shared competence.
What differs is the criteria standard, and ISO/IEC 42001 is denser than ISO/IEC 27001 in
four specific ways (§4.2). D4 is where that density lives.

### 4.1 Source documents, and what each is licensed to assert

| Source | Held by the body | Permitted use |
|---|---|---|
| **ISO/IEC 42001:2023** | Yes | Criteria. Clause, Annex A and Annex B citations permitted. |
| **ISO 19011:2026** (4th edition) | Yes | Method. Clause and Annex A citations permitted. |
| ISO/IEC 22989:2022 | No | May be named as ISO/IEC 42001's sole normative reference. No clause citations. |
| ISO/IEC 42006:2025 | No | Boundary only. No clause citations. |
| ISO/IEC 17021-1 | No | Boundary only. No clause citations. |

**No task in the JTA requires a document the body does not hold.** Where a task touches
ISO/IEC 42006 or ISO/IEC 17021-1 it tests the scope boundary — that these govern
certification bodies and not this candidate — which is establishable from their titles
and scope statements alone.

**Definitional basis.** ISO/IEC 42001 clause 3 carries 26 of its own definitions and is
the definitional basis for this scheme. No definition is attributed to ISO/IEC 22989,
notwithstanding that ISO/IEC 22989:2022 is ISO/IEC 42001's only normative reference and
is cited as a dated reference.

### 4.2 What this scheme certifies that `ISMS-IA` does not

Four differences, each established by reading the standard, and each load-bearing on at
least one task.

1. **The AI system impact assessment is a second required assessment artifact.** Clause
   6.1.4 requires a process for assessing potential consequences for individuals, groups
   of individuals and societies arising from the development, provision or use of AI
   systems, addressing deployment, intended use and foreseeable misuse; the result must
   be documented; and the results must be **considered in** the risk assessment. Clause
   8.4 performs it operationally, and Annex A.5 carries the supporting controls. **There
   is no ISO/IEC 27001 analogue.** This is the signature competence of the scheme
   (task 4.6).

2. **Normativity is layered, and the layers disagree in modal.** Annex A is normative and
   Table A.1 states its 38 controls with *shall*. Annex B is **also normative** and
   restates the same controls with *should*; it binds because clause 6.1.3 e) has the
   organization *shall consider* it, while B.1 exempts implementation guidance from the
   statement of applicability. Annexes C and D are informative. An auditor who raises a
   nonconformity against an Annex B sentence is wrong; an auditor who treats Annex B as
   ignorable is also wrong (task 4.9).

3. **Scope follows a role determination.** Clause 4.1 has the organization consider the
   intended purpose of the AI systems it develops, provides or uses and determine its
   roles with respect to them — including more than one role on a single system. Clause
   4.3 scoping follows from that determination. ISO/IEC 27001 scoping has no equivalent
   move (tasks 2.4, 4.1, 4.2).

4. **Unfamiliar evidence types.** The A.4 resource controls, the A.6 life-cycle controls
   and the A.7 data controls call for documentation about data, tooling, computing
   resources and human competence that no ISO/IEC 27001 control asks for (task 4.12).

**A fifth difference, minor but frequently mis-stated:** the climate-change wording at
clauses 4.1 and 4.2 is in ISO/IEC 42001's **published first edition**. There is no
amendment to ISO/IEC 42001. ISO/IEC 27001 acquired the same wording through Amendment
1:2024. No item may cite "ISO/IEC 42001:2023/Amd 1" — it does not exist.

---

## 5. Competency model and job-task basis

The scheme rests on a documented job-task analysis (`AIMS-IA_JTA_v1_1.md`), authored to
`CERT-CREATION.md` and passed through external review before locking. The traceability
spine is **domain → task → concept → item → lesson**, and every assessable item is bound
to exactly one task.

**Cognitive profile.**

| Bloom level | Tasks | Share | Item contract |
|---|---|---|---|
| 2 — Understand | 10 | 25.0% | Level I: exactly one defensibly correct option |
| 3 — Apply | 2 | 5.0% | Level I |
| 4 — Analyze | 28 | 70.0% | **Level II: four defensible options, one best** |

**The Level II contract, and where it stops.** For a task at tier 2 **and** bloom level
`4_analyze` — both conditions — an item presents four options that are all defensible,
one of which is best, and the best must beat the second-best for a reason a competent
practitioner could state in one sentence. The second-best must be genuinely defensible
rather than merely wrong.

The 12 understand and apply tasks stay on the Level I contract deliberately. Task 5.2 —
selecting the nonconformity statement that correctly links evidence to a requirement —
has one right answer by construction; its distractors prescribe a remedy, attribute
intent, or cite a criterion that cannot bear the finding. Those are real auditor errors
and excellent distractors, but they are not defensible calls, and forcing
four-defensible onto such a task produces a coin flip, not a harder item.

**External validation is pending.** The JTA was reviewed by an independent second
reviewer before locking. That is editorial rigor, not the formal SME-panel validation
ISO/IEC 17024 ultimately expects, which requires a convened panel and is named as
outstanding in §12.

---

## 6. Examination structure

| Parameter | Value |
|---|---|
| Number of items | 50 |
| Duration | **Provisional — to be derived by measurement before publication (see below)** |
| Item format | Single-**best**-answer multiple choice, four options |
| Delivery language | Candidate-selected: en, es-419, or pt-BR |
| Scoring | Dichotomous (correct / incorrect); no negative marking |

**Blueprint (item allocation by domain), at 50 items:**

| Domain | Weight | Items per form (target) |
|---|---|---|
| D1 | 12.50% | 6 |
| D2 | 20.00% | 10 |
| D3 | 20.00% | 10 |
| D4 | 30.00% | 15 |
| D5 | 17.50% | 9 |

(Row total 50; D1 and D5 round from 6.25 and 8.75.)

The examination assembler draws each form from the secure item bank according to this
blueprint and **refuses to issue a form if any domain is short of its quota**, so every
candidate receives a blueprint-valid form.

**Why 50 items rather than the 80 used at "I" tier.** A Level II item presents four
defensible options that must each be read and weighed against the others. Eighty such
items is an endurance test rather than a competence measure. Fifty is the count used by
`ISMS-IA`, the only other Level II scheme, and holding both at 50 keeps the family
comparable.

**Duration is deliberately unset in this document.** `ISMS-IA` runs 150 minutes at 3.00
minutes per item, derived from a measured reading load: a ~90-word stem plus four
~200-character options at 65.6% analyze. **AIMS-IA sits at 70.0% analyze**, so roughly
35 of 50 items carry that load rather than 33, and the measurement that justified 150
minutes does not transfer. Duration will be derived from AIMS-IA's own item lengths once
the secure bank exists, and recorded with its reasoning in the migration that sets it.
Inheriting 150 minutes without that measurement is not permitted.

**Session timeout must be verified against the final duration before publication.** A
form longer than the session token lifetime logs candidates out mid-examination.

---

## 7. Pass mark and standard-setting

**Current pass mark:** 75% (38 of 50 items).

**Why 75% here and 80% at "I" tier.** The "I"-tier schemes ask which answer is correct
and set 80%. A Level II item asks which of four defensible answers is *best*; a
competent candidate can select a defensible-but-second-best option and be wrong without
being incompetent. Holding an 80% threshold against that item type would measure
agreement with the item writer's judgment at the margin rather than competence. 75%
matches `ISMS-IA` and keeps the two Level II schemes comparable.

**Methodology — stated honestly.** The pass mark is **criterion-referenced**: it reflects
the level of mastery the body judges necessary to certify competence, not a curve
relative to other candidates. The current 75% threshold is a **provisional,
expert-judgment cut score**.

It has **not yet** been validated by a formal standard-setting study, because defensible
standard-setting — a modified-Angoff panel and statistical confirmation against candidate
performance — **requires real candidate data that does not yet exist.** The body's plan
is to collect candidate response data through live operation, compute item-level
statistics and form reliability, then convene a standard-setting panel to confirm or
adjust the cut score against that evidence. Until then, 75% is held as the documented,
criterion-referenced standard and applied uniformly to every candidate and form.

---

## 8. Assessment integrity and separation of functions

**Separation of training and certification.** Certidemy operates a technical separation
between the learning function and the certification function through a strict item-pool
firewall:

- The **practice pool** feeds the learning engine and study tools. Practice items carry
  concept links, which is how the engine finds them.
- The **secure pool** feeds examinations only. Secure items carry **zero** concept
  links, by construction. A single link would leak examination content into practice.
- The firewall is a queried invariant, not a convention. It must return zero.

**Answer keys.** The `correct_answer` column is revoked from every client role at
column level. A single `SECURITY DEFINER` function is the only route by which any answer
key reaches a browser, and it serves public sample items alone.

**Item bank floors.** At least 8 secure and 10 practice items per task per language, in
each of en, es-419 and pt-BR. At 40 tasks that is a minimum of 960 secure and 1,200
practice items. Over-fill is benign; items are never deleted to reach a number.

**Evidence integrity.** Deleting an item that has been answered is blocked at database
level, so scored-attempt evidence cannot be destroyed by content maintenance.

### 8.1 Answer-cue neutrality (measured, and declared per scheme)

An item is defective if a test-wise candidate can select the key without knowing the
subject — most commonly because the key is systematically longer than the distractors,
or sits in a predictable position.

**Controls applied to every item:**

- Fisher-Yates position shuffle, so key position is uniform across the bank.
- A length-parity guard measuring the key's length against the longest distractor, with
  items repaired rather than discarded where the only fault is option length.
- A minimum-option floor, so a two-option item cannot slip past the position guard.

**The tolerance is declared per scheme, not globally.** A Level II option carries a
qualifying clause — the clause is frequently *why* the best answer is best — so the
Level I tolerance of 5 characters / 10% rejects correct Level II items. The tolerance
for this scheme is declared in `exam_blueprint.item_model.cue_tolerance` in the seed
migration, and **both the generator and the conformance checker read that same
declaration**, so the two cannot drift apart. The resolved source is printed at
generation time and appended to the conformance detail line, so a loosened setting
cannot pass unnoticed.

**The numbers are measured against this bank, not inherited.** `ISMS-IA` declares 25
characters / 15% on a measured distribution. AIMS-IA's declaration is re-measured once
its bank exists. The conformance check that matters is the strict-longest rate: near 25%
is chance; near 40% means a test-wise candidate beats chance by picking the longest
option, and that is a scheme defect to correct, not a threshold to relax.

### 8.2 Source-attribution controls

Specific to this scheme and its `ISMS-IA` sibling, because this is the failure mode the
family is most exposed to.

The item generator is given an explicit grounding block naming the edition set, the
permitted citations, and a list of claims that must never appear in a key or an
explanation — each of which is widely taught and none of which is in the text. For this
scheme those include: that any clause requires a risk register; that ISO/IEC 42001
defines major and minor nonconformities; that ISO 19011 requires anything; that a
standard forbids auditing your own work; that Annex B is informative; and that a Table
A.1 control is required unconditionally.

The grounding block is versioned in source control and composed from a shared audit-method
half and a scheme-specific criteria half, so the method rules cannot drift between this
scheme and `ISMS-IA` while the criteria stay correctly separate.

---

## 9. Recertification

AIMS-IA credentials are valid for **2 years** from issuance.

**Rationale, and why it differs from the reasoning behind the same number on `ISMS-IA`.**
Validity is a commitment to re-review the body of knowledge on that schedule and to ask
the holder to demonstrate current competence against it.

`ISMS-IA` holds 2 years because its standards revise slowly: ISO 19011 ran 2018 to 2026,
ISO/IEC 27001 ran 2013 to 2022 with an amendment in 2024. An annual cycle would in most
years find nothing changed.

**AIMS-IA reaches the same number by the opposite argument.** ISO/IEC 42001 is a first
edition with no amendment and a systematic review not due until around 2028 — the
standard itself is stable. What is not stable is everything around it: ISO/IEC 42006 was
published eighteen months after ISO/IEC 42001; Annex B leans on ISO/IEC 5259, ISO/IEC
23894 and ISO/IEC TS 4213; and AI regulation continues to phase in across the validity
window. The *clause text* changes slowly and the *body of knowledge* does not.

A 1-year cycle would ask holders to recertify against a body of knowledge that has moved
in its periphery but not its core. Two years is the interval at which a re-review is
likely to find something a holder should demonstrate. **This is recorded as a judgment
to revisit** once the 42001 ecosystem settles or its systematic review lands.

---

## 10. Traceability and coverage

The scheme maintains a complete, queryable traceability matrix from domain to task to
concept to item to lesson. Three guarantees are structurally provable rather than
asserted:

| Guarantee | Check | Required |
|---|---|---|
| No untaught testing | coverage view | violations = 0 |
| Concept coverage | coverage view | concepts taught = concepts total |
| Secure firewall | secure items holding a concept link | 0 |
| Trilingual integrity | item groups not holding exactly 3 language rows | 0 |
| Blueprint sufficiency | per-task secure count, per language | ≥ 8, all tasks |
| Answer-cue neutrality | position distribution, key-longest rate, length spread | within §8.1 bounds |

These are live queries, not a periodic report, and they are the same queries the
conformance tool runs before any publication decision.

---

## 11. Scheme maintenance and governance

**Terminology.** Cross-scheme rules live in `TERMINOLOGY-POLICY.md` and are not repeated
here. Specific to this scheme:

- **Never coin an acronym for the management system in translation.** *Sistema de
  gestión de IA* and *sistema de gestão de IA*, spelled out. No invented initialism.
- **Clause references in es-419** follow the convention documented as Rule 17:
  *capítulo* for a top-level clause, *apartado* for a subdivision. **pt-BR does not
  carry the distinction** — ABNT practice uses *Seção* at every level, and no split is
  introduced to mirror Spanish.
- **Modal verbs are load-bearing and are translated as such.** *Shall* is a requirement,
  *should* is guidance, and a note is neither. Preserving that distinction across three
  languages is itself a competence this scheme certifies; a translation that flattens it
  invalidates the item.

**Translation staleness is enforced mechanically.** Changing an English task statement or
domain description flips that row's translations to provisional in the same transaction,
and a scheme with any provisional translation cannot pass the publication gate.

**Framework-identity line.** ISO and IEC standard designations are used as factual
references to the documents this scheme audits against. Certidemy does not present
itself as, or as endorsed by, ISO, IEC, any accreditation body or any certification
body. Third-party training or certification programme names do not appear in this
scheme, in marketing, or in application chrome.

**Standards-change trigger.** A new edition or amendment of ISO/IEC 42001 or ISO 19011
triggers a scheme review: the grounding block edition set, the affected concept rows and
the affected items are re-verified against the new text before any further generation.
The trigger is the publication of the text, not commentary about it, and re-verification
reads the standard rather than secondary sources.

---

## 12. Open items on the path to accreditation

Stated plainly, because overstating readiness is the one thing an assessor does not
forgive.

| Item | Status |
|---|---|
| Formal SME-panel JTA validation | **Pending.** External second-reviewer pass complete; a convened panel is not. |
| Standard-setting study for the 75% cut score | **Pending candidate data.** No live candidates yet. |
| Item difficulty and discrimination statistics | **Pending candidate data.** |
| Form reliability estimates | **Pending candidate data.** |
| Examination duration | **Pending measurement** against this scheme's own item lengths (§6). |
| Cue-tolerance declaration | **Pending measurement** against this scheme's own bank (§8.1). |
| Session timeout verification | **Pending**, and required before publication. |
| Accreditation to ISO/IEC 17024 | **Not held.** Scheme designed to the framework; accreditation not claimed. |

Every one of these depends on operating history the body does not yet have. None is
concealed by the credential's marketing, which claims *built to the ISO/IEC 17024
framework* and never *accredited*.

---

*End of SCHEME-AIMS-IA.md. The JTA of record is `AIMS-IA_JTA_v1_1.md` (v1.0-LOCKED).*
