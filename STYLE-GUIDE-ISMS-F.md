# STYLE-GUIDE-ISMS-F

**Version:** 1.0
**Certification:** ISO/IEC 27001 Foundation — AI (`ISMS-F`)
**Status:** Locked for authoring
**Derived from:** module 1 (7 lessons, D1) and its review round, 4 August 2026
**Relationship to the spec:** a per-cert delta on `LESSON_AUTHORING_SPEC.md` v1.2.
Where the two disagree, this document governs for `ISMS-F` only.

Written *after* module 1 rather than before it, per the AIHR-I pattern: the
conventions below are what the module turned out to need, not what was guessed in
advance. Two of them were found by the review round catching real defects.

---

## 1. THE COPYRIGHT RULE — explain, never define

**This is the most important rule in this document and it applies to all 49
lessons.**

ISO's normative text is copyrighted, and `BOK-ISMS-F` §6 requires that lessons
teach structure and reasoning in Certidemy's own words. **A definition is
normative text.** Short definitions are *more* exposed than paraphrased clauses,
not less, because they are recognisable on sight.

Module 1 shipped its first draft with five near-verbatim ISO definitions,
including `a measure that modifies risk` word for word. The external review did
not catch them; it asked for *tighter* alignment with ISO's wording.

### The rule

> Never write `X is <ISO's definition>`. Write what X *does*, when it holds, and
> what it looks like when it fails.

| ✗ Recited | ✓ Taught |
|---|---|
| "Confidentiality means information is not made available or disclosed to unauthorised individuals, entities, or processes." | "Confidentiality holds while only the people and systems meant to reach the information can reach it. It breaks the moment someone who should not have it does." |
| "A control is a measure that modifies risk." | "A control is anything you put in place that changes how much risk you carry." |
| "A security event is an identified occurrence indicating a possible security-relevant state." | "A security event is something that happened and that might mean something." |

**This is better teaching, not a compromise.** The spec's §8 asks for *specific
over abstract — show a scenario, then name the principle*. Reciting a definition
and then illustrating it does exactly the reverse.

**Checkpoint questions are covered too.** A question whose stem quotes a
definition reproduces it just as surely as a concept block does.

**Control titles and clause numbers are factual references and are fine.**
"Clause 6.1.3", "Annex A", "the four themes", "93 controls" — all usable. The
line is between naming a thing and reproducing the text that defines it.

---

## 2. "Clause" in English, and only in English

ISO/IEC 27001's English text says **Clauses**. Module 1 shipped with "Sections 4
to 10" — the Portuguese rendering imported into English — and the review round
praised it as correct. It was not.

| Language | Rendering |
|---|---|
| **en** | `Clause` — "Clauses 4 to 10", "clause 6.1.3" |
| **es-419** | `capítulo` for a whole top-level division; `apartado` for a numbered sub-requirement |
| **pt-BR** | `Seção` — never `cláusula` |

Rule 17 in `TERMINOLOGY-ISMS-F.md` is a **translation** rule. It does not change
the English source, and the es-419/pt-BR renderings must never leak back into it.

Phrasing: **"Clauses 4 to 10"**, not "4 through 10".

---

## 3. Checkpoint Bloom is uniform per lesson

Every checkpoint question carries **the same `bloom_level` as the lesson's
task**. Not a style preference — `trg_item_bloom_matches_task` stamps items from
the task and rejects mis-levelled inserts, so a mixed checkpoint fails at load.

`LESSON_AUTHORING_SPEC.md` §4.7's worked example mixes levels freely. **That
example predates the trigger and is wrong.** Follow this document.

Variation goes in **`difficulty` (1–5)**, which is orthogonal to cognitive level —
see the blueprint's own `difficulty_note`. A hard Remember question is still a
Remember question. Module 1's ranges:

| Task Bloom | Question count | Difficulty range |
|---|---|---|
| `1_remember` | 4 | 1–3 |
| `2_understand` | 3–4 | 2–3 |
| `3_apply` | 4 | 2–3 |

---

## 4. Widgets

**`drag-match` is strictly 1:1.** Equal items and targets, every target used
exactly once, no `allowReuse`. `verify-cert` enforces this and a violation fails
the cert.

**Four items is the house size.** Enough to discriminate, small enough for a
phone.

**Reserve `scenario-mcq` for `3_apply` tasks and above.** Module 1 used it once, at 1.7. It
is expensive to author and to read, and it earns its place only where the task is
genuinely about applying judgment. Wrong branches should *explain and return*
rather than dead-end.

**One `::interactive` per lesson** unless the lesson runs past 18 minutes.

Only three of the six primitives have schemas in the spec. **Do not invent
configuration for `toggle-and-observe`, `highlight-mistake` or
`annotated-diagram`** — confirm the schema first.

---

## 5. The honesty firewall in practice

AI content enters **only where the practitioner genuinely does something
differently.**

Module 1's split is the target for the whole cert: **lessons 1.1–1.4 are almost
AI-free**; 1.5–1.7 are AI-native. Roughly a third of the 49 should look like 1.1.

**Naming a null result is teaching, not an omission.** Task 4.11's content is
that AI does *not* materially change physical controls. Where a candidate might
expect an AI angle and there is none, say so and say why.

**Never AI-flavour a control that AI did not change.** A reader can tell, and the
credibility spent there is not available where the change is real.

---

## 6. Voice

**British spelling**, following ISO's own English: *organisation, unauthorised,
recognise, prioritise*.

**Second person, active voice**, per spec §8.

**Concrete before abstract.** Every concept block in module 1 that works names a
situation before naming the principle.

**No fabricated authority.** Where the standard is silent, say so — 1.6's
deep-dive says plainly that "the standard will not hand you an answer here."

**Voluntary sources are labelled voluntary.** OWASP, MITRE ATLAS and NIST
taxonomies are practitioner consensus. State it, and state that ISO/IEC 27001
governs where they conflict.

**Localisation-friendly**, per spec §8: no idioms, no US-centric examples, metric
units, no culturally specific humour.

---

## 7. Cross-referencing

Lessons reference each other **by task number**, not by lesson title:
*"lesson 1.2"*, *"task 4.6 takes this up properly"*. Titles change; task codes are
locked by the JTA.

Forward references are encouraged — they make 49 lessons read as one structure
rather than 49 pages. Module 1 carries eight.

`prerequisites` in frontmatter names **only genuine dependencies**, not narrative
order. 1.5 requires 1.2 because it uses the asset test; 1.3 requires 1.2 for the
same reason. 1.4 requires only 1.1.

---

## 8. Lesson shape

| | |
|---|---|
| `::hook` | 1, one or two sentences, ~20 words |
| `::concept` | 2–3, 200–300 words each |
| `::callout` | 1–3, mixing `pitfall`, `exam-watch`, `terminology` |
| `::interactive` | 1 |
| `::deep-dive` | 0–1, 200–400 words |
| `::checkpoint` | exactly 1, 3–4 questions |
| `::summary` | exactly 1, 5 bullets |

**Duration budget must sum to the module's `estimated_minutes`.** Module 1: 12,
16, 12, 14, 18, 18, 20 = 110. This is checked, so plan the whole module before
writing the first lesson.

Remember-tier lessons run shorter (12–14 min); Apply-tier lessons run longest
(20 min) because the interactive dominates.

---

## 9. Sampling reality

40 items across 49 tasks is **0.82 items per task** — the lowest ratio in the
catalog, inherent to a 40-item market form over a full Foundation body of
knowledge.

**Every lesson must stand alone as teaching**, because no candidate can rely on
their task appearing on their form. Do not write a lesson that only makes sense
as exam preparation.

---

## 10. Checklist beyond spec §9

Before a lesson leaves draft:

- [ ] No sentence recites an ISO definition (§1). Read every `X is…` aloud.
- [ ] `Clause`, never `Section`, in English (§2).
- [ ] Every checkpoint question carries the task's Bloom level (§3).
- [ ] `drag-match` is 1:1 with four items (§4).
- [ ] Voluntary sources labelled voluntary (§5).
- [ ] Cross-references use task numbers (§7).
- [ ] Lesson duration fits the module budget (§8).
- [ ] `concept_slugs` covers the task's concepts exactly — no strays, no gaps.
- [ ] After the module loads: `wire-lessons.mjs`, dry then live, zero UNRESOLVED
      (spec §12).

---

## Changelog

- **1.0** (4 August 2026) — derived from module 1 and its review. §1 and §2 exist
  because the first draft got both wrong and the external review endorsed both
  errors: five near-verbatim ISO definitions, and the Portuguese rendering of
  "clause" used in English text.
