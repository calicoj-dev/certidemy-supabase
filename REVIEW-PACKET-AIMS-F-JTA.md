# REVIEW-PACKET-AIMS-F-JTA.md

**Stage 3 of `CERT-CREATION.md`** — external review of a job-task analysis.
**Under review:** `AIMS-F_JTA_v1.2.md` and `BOK-AIMS-F.md` at commit `fd94355`.
**Status:** draft. Stage 3 is a gate; nothing is locked, no lessons or items exist.
**Date:** 2026-08-06

---

## 0. Before anything else — do you have the standard?

**This review is only meaningful if it is conducted against the text of ISO/IEC
42001:2023.** If you do not have the document in front of you, **say so in your
first line** and confine your findings to structure and craft. Do not answer
questions about what the standard requires from general knowledge of ISO practice.

This is not a formality. Two things happened on the previous round:

1. Six structural assertions were sent for verification. Five came back confirmed
   and one flagged — including a confirmation that a clause number was checked
   "from the standard text itself." **It had not been.** Reading the PDF afterwards
   showed two of the six were wrong.
2. A separate cert, ISMS-F, passed **29 automated invariants, 0 failures** while
   containing three factual defects — all of the same shape: *something true and
   well taught, attributed to text that does not say it.*

**A review that cannot distinguish a read source from a remembered one produces
confidence, not assurance.** If the source is memory, that is a useful review; it
is just a different one, and it must be labelled.

---

## 1. What is being asked for

**Terms and structural gaps. Not a verdict.**

A verdict — *"ready to lock"*, *"no rework required"* — is the least useful output.
The previous review ended with *"Ready for Stage 3, no structural rework required"*
and the JTA then needed a version bump for four factual corrections plus a new task.

What is wanted:

- **Findings with clause citations.** *"Task 4.4 states X; clause A.6.2.8 says Y"*
  is actionable. *"D4 looks sound"* is not.
- **Terms, not conclusions.** If a phrase is wrong, say which phrase and what the
  standard's word is.
- **Explicit uncertainty.** *"I could not verify this"* is a finding.

---

## 2. Intentional patterns — please do not flag these as defects

Each of these is a decision with a reason. Flagging them costs a finding slot.

**2.1 — Task 2.7 is deliberately close to 2.5 and 2.6.** It exists solely to stop a
candidate collapsing the AI risk assessment and the AI system impact assessment
into one thing. It will read as redundant. It is not. See §3.1.

**2.2 — Task 5.2 is deliberately silent on the rule that auditors may not audit
their own work.** That rule is ISO 19011 guidance, not a 42001 requirement. ISMS-F
shipped it attributed to ISO/IEC 27001 and it took three regeneration attempts to
remove from generated items. **Adding it back is not an improvement.** Task 5.2 uses
clause 9.2.2's own words: *objectivity and impartiality of the audit process*.

**2.3 — Domain 4 teaches Annex A as structure and selection reasoning, not as a
survey of all 38 controls.** A control-per-task JTA would inflate the task count,
distort the exam blueprint and test recall where the standard wants judgement.

**2.4 — The Bloom ceiling is `4_analyze` and there are no `1_remember` tasks.** The
ceiling is a property of the assessment mode (single-correct-answer MCQ at
Foundation tier). The absence of recall tasks is forced rather than stylistic:
clause 2 makes ISO/IEC 22989:2022 a normative reference and clause 3 delegates
terminology to it, so **there is no definition of *AI system* inside 42001 to
recite.** Do not recommend `5_evaluate` or `6_create` tasks.

**2.5 — Three of the four `4_analyze` tasks concern integration with ISO/IEC
27001.** This is the credential's differentiator made assessable rather than
asserted, and **Annex D.2 is the textual basis** — it states that integration with
other management system standards is essential and names 27001 first.

**2.6 — Explanation, never definition.** No lesson built from this JTA will
reproduce an ISO definition or control text. Recommendations to align more closely
with the standard's *wording* run in the wrong direction. Alignment of *substance*
is exactly what is wanted; alignment of phrasing is not.

**2.7 — Frequency and criticality are deliberately uneven.** 3 `daily` / 6 `weekly`
/ 26 `occasional`; 25 `high` / 9 `medium` / 1 `low`. A previous draft marked all
tasks identically, which carries no information.

**2.8 — This credential does not claim equivalence to any Lead Implementer or Lead
Auditor programme, accredited or otherwise.** It is a Foundation. Do not evaluate it
against an LI syllabus; gaps against that syllabus are scope, not defects.

---

## 3. Specific checks requested

### 3.1 Task 2.7 — check against clauses 6.1.2 and 6.1.4 specifically

**Highest-value item in this packet.**

The previous version of this task taught that the axis separating the two
assessments is *direction of harm* — risk to the organization, impact on people.
**That is contradicted by the standard in two places**, and it passed review:

- clause 6.1.2 d) 1) has the risk analysis assess consequences to the organization,
  individuals **and societies**;
- clause 6.1.4 requires the impact assessment results to be **considered in** the
  risk assessment, with a reciprocal NOTE at 6.1.2.

v1.2 now teaches four axes — anchoring, output, context, audience — and that the
impact assessment is an **input** to the risk assessment rather than a parallel
process.

**Please check the current formulation against those two clauses directly. Do not
assess it for plausibility; the wrong version was plausible.**

### 3.2 Attribution — every K field

The defect class that cost a full session on ISMS-F. Examples found there:

| Claim in generated items | Reality |
|---|---|
| "ISO 27001 requires the risk register to be a living document" | The standard never mentions a risk register |
| "ISO/IEC 27001 certificates are valid for three years" | True as market practice; that requirement lives in ISO/IEC 17021-1 |

For each K field the question is **not *is this true*** but **does 42001 say it, and
with which modal**. Specifically:

- `shall` is a requirement; `should` in Annex B is guidance; a NOTE is neither
- where a widely-taught rule is an implication, it must be attributed to practice
- where the source is another standard — 42006, 17021-1, 22989, 5338, 23894, 42005
  — that standard must be named, never "the standard"

Four fields were already corrected under this rule in v1.2 (§0a of the JTA lists
them). **Assume there are more.**

### 3.3 Named requirements hedged into general ones

ISMS-F taught *"environmental conditions"* where 27001 Amendment 1:2024 says
**climate change** — a specific named requirement softened into a general one. The
distractors were built around the wrong concept, so 54 items had to be regenerated
rather than string-swapped.

42001 has its own precisely-named requirements. Where the JTA paraphrases one into
a more general phrase, flag it.

### 3.4 The contents-page check

ISMS-F missed **clause 6.3 Planning of changes** because it is absent from ISO/IEC
27001's own table of contents.

Please walk 42001's body against its contents page and confirm nothing is skipped.
Then confirm that every requirement in clauses 4 through 10 is taught by at least
one of the 35 tasks, and name any that is not.

### 3.5 Structural arithmetic

- 35 tasks across 5 domains; weights 15 / 22.5 / 20 / 25 / 17.5 summing to 100
- 40-item form; per-domain allocation 6 / 9 / 8 / 10 / 7
- **no domain below 6 items** — this is the blueprint floor, taken from ISMS-F's
  live allocation, and it replaced an items-per-task ratio that governed nothing
- 156 concept mentions, **153 distinct concepts**, 3 deliberate cross-domain reuses

Flag any arithmetic that does not reconcile.

### 3.6 Annex A structure

v1.2 states **38 controls in 9 categories (A.2–A.10) carrying 10 objectives** —
A.6 subdivides into A.6.1 and A.6.2, each with its own objective — and that
**Annex B is normative**, not informative.

Most secondary sources say "nine objectives" and describe Annex B as guidance.
**Please confirm from the annexes themselves**, and count the controls.

---

## 4. What a useful response looks like

```
SOURCE: [read the PDF | working from general knowledge] — state this first

FINDINGS
  [task] — [what it says] — [clause] says [what] — [suggested wording]

COULD NOT VERIFY
  [item] — [why]

STRUCTURAL GAPS
  [requirement in clauses 4-10 taught by no task]
```

**If nothing is wrong with a section, say nothing about it.** Confirmations of
correct material are not findings and make real findings harder to see.

---

## 5. What this feeds

If findings land, the JTA goes to v1.3 and Stage 3 runs again. When it closes,
Stage 4 locks the JTA and only then do the scaffold migration, 35 lessons, three
languages, and roughly a thousand items get built against it.

**Everything downstream inherits whatever survives this review.** A wrong K field
here becomes wrong assertions in generated items, in three languages, in a
published credential whose entire premise is that competence is declared, taught
and measured against a source a candidate can go and read.

The automated invariants will not catch it. They held at 29 pass, 0 fail through
every defect described in this document.
