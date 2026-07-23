> ## SUPERSEDED BY MIGRATION 128 - READ THIS FIRST
>
> **This analysis reached the wrong conclusion on 5 of its 16 tasks.** It is kept
> because the reasoning error is itself part of the record, and because the
> corrected analysis only makes sense against it.
>
> **The error:** this document compared each task's STATEMENT verb against its
> `bloom_level` and nothing else. A task's competence is its whole definition -
> statement plus knowledge, skills and abilities. Migration 094 had already
> established the skills line as the tiebreaker:
>
>     "Statement said 'Explain that the PO is one accountable person' while its
>      SKILLS say 'APPLY the one-person rule to a scenario'."
>
> Read against their K/S/A, all 16 tasks tell the same story: **the skills line
> agrees with the stored `bloom_level`, and the statement is the outlier.** The
> existing item banks confirm it independently - the generator reads statement +
> skills + concepts and lets the skills govern, so the items were already testing
> the correct competence.
>
> **What actually changed (migration 128):** 16 statements corrected. **Zero
> cognitive levels changed. No blueprint recompute. No item regeneration. No
> retirement.** Invariant 17 verified MATCH across all six certs; item drift 0.
>
> **Reversed from the recommendations below:**
>
> | task | this document said | 128 did |
> |---|---|---|
> | AIGRM-I 3.10 | raise to `4_analyze` | kept `2_understand`, statement -> Explain |
> | AIGRM-I 5.8 | raise to `4_analyze` | kept `2_understand`, statement -> Explain |
> | AIGRM-I 3.7 | lower to `2_understand` | kept `3_apply`, statement -> Match |
> | SPO-AI-I 2.7 | rewrite at `3_apply` | kept `3_apply`, statement -> Apply (per skills) |
> | SPO-AI-I 3.6 | rewrite at `3_apply` | kept `3_apply`, statement -> Determine (per skills) |
>
> **One finding this document missed entirely:** six tasks have a SKILLS line
> naming a performance an MCQ cannot assess (Write a story, Craft a vision,
> Construct a roadmap/prompt, Demonstrate software). Their statements were
> narrowed to what the exam measures AND `is_simulation_candidate` set true, so
> the authoring half is parked explicitly rather than silently dropped.
>
> **Method note for future analyses:** read the K/S/A and sample the actual items
> before proposing a change. Three times in this session the answer came from
> reading what was there rather than from inference.

---
# Bloom/Verb Reconciliation — Analysis & Recommendations

**Date:** 2026-07-23
**Scope:** 16 tasks across AIGRM-I, SPO-AI-I, SD-AI-I
**Status:** analysis for review — nothing applied

---

## The problem

Each task below has a statement whose **verb sits at a different cognitive level
than the task's `bloom_level` stamp**. That is a construct-validity defect under
ISO/IEC 17024: the blueprint publishes a competence, and the item bank measures a
different one.

No candidate has been affected — the drift query returns 0 across all 16,158
items, because items were generated *after* migrations 090–095 and are stamped
from the task. The defect is that the **statement and the stamp disagree on
paper**, which is what an auditor reads.

---

## The two repair precedents

Both directions are already established in this codebase, and the choice is
per-task.

**091 — rewrite the STATEMENT, keep the level.** Used when the verb names
something an MCQ cannot assess:

> *"WRITE a Sprint Goal - writing is Create (6), which MCQ cannot assess at all.
> The MCQ-assessable competence is SELECTING the coherent goal from plausible
> alternatives, which is Apply. Statement rewritten to the competence the exam
> can actually measure."*

**094 — raise the LEVEL, keep the statement.** Used when the task was
under-declared:

> *"UNDER-DECLARED BY TWO LEVELS ... Declared at Remember, the exam tested recall
> of a fact - when the actual competence is spotting a committee-PO or proxy-PO
> in a described situation and applying the rule. Construct under-representation:
> the credential attested a competence it never measured."*

**Decision rule applied below:** if the surrounding content (domain description,
adjacent tasks) shows the intended competence is genuinely higher, raise the
level. If the verb names a *performance* an MCQ cannot reach — write, create,
build, present, maintain, work with — rewrite the statement to the assessable
competence at the existing level.

---

## ⚠ Downstream cost — read before deciding

**Every statement rewrite invalidates that task's es-419 and pt-BR
translations.** We finished the translation wave less than an hour ago. Of the 16
tasks here, **13 need statement rewrites → 26 translation rows to redo.**

That is an argument for doing this **now**, not later:

- The translation machinery is warm and the pack-block architecture is understood
  (SPO-AI-I is a stub block, SD-AI-I and AIGRM-I are full).
- Doing it later means a second Grok review cycle for the affected strings.
- The three level-raises need **no** translation change at all.

**Also required per changed task:** recompute `v_cognitive_profile` → reset
`exam_blueprint` from the computed profile → regenerate items for that task.
All six certs are `available` but carry only test attempts (Juan's own), so
regeneration is a clean replace — no `retired_at` / `supersedes_id` chain needed
this pass.

---

## AIGRM-I — 3 tasks

### 3.10 · RAISE LEVEL → `4_analyze`

| | |
|---|---|
| statement | Analyze how the frameworks reinforce one another. |
| current | `2_understand` |
| recommend | **`4_analyze`, statement unchanged** |

D3 is the domain that teaches EU AI Act, ISO/IEC 42001, NIST AI RMF and the
emerging jurisdictional pattern. 3.10 is its synthesis task, and seeing how
separate instruments interlock is genuinely analysis — "an organization certified
to 42001 has already satisfied which Act obligations?" is an analyze item and a
realistic one. AIGRM-I already carries `4_analyze` tasks (2.7, 4.11, 5.2), so the
level is in scope for this cert.

**No translation change** (`Analizar` / `Analisar` already correct).

### 5.8 · RAISE LEVEL → `4_analyze`

| | |
|---|---|
| statement | Analyze how ethics, policy, and the governance function combine to sustain trustworthy AI over time. |
| current | `2_understand` |
| recommend | **`4_analyze`, statement unchanged** |

**The English source already argues for this.** D5's own description reads
*"Comprehension-led with an **analytic capstone** tying ethics, policy, and
function into sustained trustworthy AI."* 5.8 is that capstone. This is the
least ambiguous item in the whole set.

**No translation change.**

### 3.7 · LOWER LEVEL → `2_understand`

| | |
|---|---|
| statement | Recognize the companion ISO/IEC AI standards and their roles. |
| current | `3_apply` |
| recommend | **`2_understand`, statement unchanged** |

`BLOOM_SPEC` draws the line as *"what IS this?" = Understand; "what SHOULD be
done?" = Apply.* "Recognize the standards and their roles" is squarely the
former. **3.9 in the same domain uses the identical verb at `2_understand`** —
this is an internal inconsistency, and 3.9 is the correct one.

*Alternative considered and rejected:* rewriting to "Given a described need,
select the appropriate companion standard" would justify Apply. Rejected because
it invents a competence the domain description doesn't claim — D3 is explicitly
*"Taught strictly as structure and obligations, never as compliance advice."*
Selecting a standard for a situation edges toward advice.

**No translation change.**

---

## SPO-AI-I — 6 tasks

### 4.3 · REWRITE STATEMENT (091 pattern)

| | |
|---|---|
| current | **Write** high-quality user stories and epics |
| level | `3_apply` — keep |
| proposed | **Select a well-formed user story or epic from plausible alternatives, and identify what makes the others deficient** |

Writing is Create (6). Mirrors 091's exact reasoning and phrasing for SM-AI-I 3.9.

### 4.5 · REWRITE STATEMENT

| | |
|---|---|
| current | **Write** effective acceptance criteria |
| level | `3_apply` — keep |
| proposed | **Evaluate acceptance criteria for a described PBI against completeness and testability** |

### 5.1 · REWRITE STATEMENT

| | |
|---|---|
| current | **Create** and communicate a product vision |
| level | `3_apply` — keep |
| proposed | **Select a product vision that fits a described context, and distinguish it from a goal or a feature list** |

"Create" is literally Bloom 6. The distinguish-from clause is the real
PO competence and is highly MCQ-testable — vision/goal/roadmap confusion is a
classic PO error.

### 5.6 · REWRITE STATEMENT

| | |
|---|---|
| current | **Build** and maintain a product roadmap |
| level | `3_apply` — keep |
| proposed | **Determine an appropriate roadmap structure and sequencing for a described product context** |

### 2.7 · REWRITE STATEMENT

| | |
|---|---|
| current | **Explain** the Definition of Done in AI-assisted teams |
| level | `3_apply` — keep |
| proposed | **Determine whether AI-assisted work meets the Definition of Done and can be accepted** |

Explain is Understand. But rather than lowering the level, the *right* competence
for a Product Owner here is the acceptance decision — the PO accepts or rejects,
and that is Apply. Note SM-AI-I 4.11 already carries the Developer-side version
("Apply the Definition of Done ... to work generated or assisted by AI"), so this
keeps the two certs complementary rather than duplicative.

### 3.6 · REWRITE STATEMENT

| | |
|---|---|
| current | **Explain** the human-held value accountability in AI-augmented teams |
| level | `3_apply` — keep |
| proposed | **Determine which value decisions remain the Product Owner's when AI assists** |

Same reasoning. The testable competence is the boundary — AI drafts a
prioritization; does the PO accept it or own the call? That is Apply, and it is
the cert's central AI-era claim.

---

## SD-AI-I — 7 tasks

### 4.2 · REWRITE STATEMENT

| | |
|---|---|
| current | **Write** effective implementation prompts and context for AI coding assistants |
| level | `3_apply` — keep |
| proposed | **Select the implementation prompt and context most likely to produce a correct implementation for a described PBI** |

### 4.3 · REWRITE STATEMENT (statement under-claims the level)

| | |
|---|---|
| current | **Apply** the extra scrutiny that AI-authored code demands |
| level | `4_analyze` — keep |
| proposed | **Analyze AI-authored code for the failure modes it is prone to** |

Here the *level* is right and the *statement* under-claims. Reviewing AI code for
plausible-but-wrong logic, hallucinated APIs and silent edge-case failures is
decomposition — analysis.

### 4.5 · REWRITE STATEMENT (same shape)

| | |
|---|---|
| current | **Use** AI to generate and strengthen tests, guarding against blind spots |
| level | `4_analyze` — keep |
| proposed | **Analyze AI-generated tests to identify the coverage gaps they leave** |

The analyze competence is already in the statement's tail ("guarding against
blind spots"); the lead verb just doesn't reflect it.

### 2.5 · REWRITE STATEMENT

| | |
|---|---|
| current | **Present** a Done Increment and gather feedback at the Sprint Review |
| level | `2_understand` — keep |
| proposed | **Explain the Developers' part in the Sprint Review: presenting a Done Increment and gathering feedback** |

"Present" is a performance an MCQ cannot reach. The level is right; the verb
over-claims.

### 4.9 · REWRITE STATEMENT

| | |
|---|---|
| current | **Maintain** provenance, attribution, and licensing hygiene for AI-assisted work |
| level | `2_understand` — keep |
| proposed | **Explain provenance, attribution, and licensing obligations for AI-assisted work** |

### 5.2 / 5.3 · REWRITE BOTH — they use one verb at two levels

| task | current | level |
|---|---|---|
| 5.2 | **Work with** the Product Owner: clarify criteria, surface constraints, negotiate scope | `3_apply` |
| 5.3 | **Work with** the Scrum Master: surface impediments and engage in improvement | `2_understand` |

Same verb, same shape, two different levels — an internal inconsistency, and
"work with" is a performance verb in both cases.

**Proposed — level both at `3_apply`:**

| task | proposed |
|---|---|
| 5.2 | **Determine how to work with the Product Owner to clarify criteria, surface constraints, and negotiate scope** |
| 5.3 | **Determine how to surface an impediment to the Scrum Master and engage in improvement** |

D5 is otherwise predominantly `3_apply`, and both describe situational judgment a
scenario item can test directly.

---

## Summary

| cert | level-only change | statement rewrite | translation rows affected |
|---|---|---|---|
| AIGRM-I | 3 (3.10, 5.8, 3.7) | 0 | **0** |
| SPO-AI-I | 0 | 6 | 12 |
| SD-AI-I | 0 | 7 | 14 |
| **total** | **3** | **13** | **26** |

**Cognitive profile impact** — only the three AIGRM-I changes move a profile:
3.10 and 5.8 shift `2_understand` → `4_analyze`, and 3.7 shifts `3_apply` →
`2_understand`. SPO-AI-I and SD-AI-I keep every level as-is, so **their
blueprints do not change at all** — only the statements and their items.

That is a useful asymmetry: **13 of 16 changes require no blueprint recompute.**

---

## Proposed sequence

1. **Migration 126** — AIGRM-I: three `bloom_level` updates, then recompute
   `v_cognitive_profile`, then reset `exam_blueprint` from the computed profile.
   Invariant-17 order: never set the blueprint ahead of the tasks.
2. **Migration 127** — SPO-AI-I + SD-AI-I: thirteen `statement` updates. No
   profile or blueprint change.
3. **Regenerate items** for all 16 affected tasks. Clean replace — test attempts
   only.
4. **Re-translate the 13 rewritten statements** (26 rows) through the pack, then
   `--approve`. SPO-AI-I is a stub block and needs the flag migration; SD-AI-I is
   a full block and does not.
5. **Grok review** of the 26 new strings only — a short cycle, against the
   fifteen locked principles.

---

## Open question for Juan

**3.7 is the one call I am least sure of.** Lowering it to `2_understand` removes
an Apply task from AIGRM-I D3 and shifts that cert's cognitive profile slightly
toward comprehension. The alternative — rewriting it to a selection task — would
keep the Apply but edges toward "which standard should you use," which D3's own
description rules out as compliance advice.

I recommend the level drop. It is the honest reading of the verb and it matches
3.9. But it is a scheme-shape decision rather than a purely technical one, so
flagging it rather than deciding alone.
