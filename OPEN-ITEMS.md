# Open items — carried forward

## Decisions waiting on a person, not on work

**SHOULD THE SECURE POOLS GET A SOURCE-CONFORMANCE AUDIT BEFORE MORE EXAMS RUN?**
**ANSWERED 2026-09-26. The rate holds, it holds everywhere, and it is a GENERATOR
problem.** This replaces the question that stood here; the reasoning that raised it is
in `SCRUM-2017-REPORT.md` and the two reads are `ITEM-EXPOSURE.md` and
`AUDIT-FINDINGS-480.md`.

**822 English secure items have now been read against their own cited sources**
— 342 from the exposed set and 480 from a stratified random sample of all twelve
certifications, seed 20260926, with no overlap. **16 wrong keys, 92 contested.**

| cert | live EN secure | read | wrong keys | rate | contested |
|---|---|---|---|---|---|
| AIGRM-I | 457 | 40 | **2** | 5.0% | 3 |
| AIMS-F | 278 | 40 | **2** | 5.0% | 12 |
| SM-AI-I | 452 | 230 | **6** | 2.6% | 27 |
| AIHR-I | 223 | 40 | **1** | 2.5% | 3 |
| ISMS-F | 391 | 40 | **1** | 2.5% | 3 |
| SD-AI-I | 359 | 40 | **1** | 2.5% | 3 |
| SPO-AI-I | 388 | 40 | **1** | 2.5% | 5 |
| AIE-I | 143 | 112 | **1** | 0.9% | 7 |
| AISM-I | 487 | 120 | **1** | 0.8% | 6 |
| AIMS-IA | 320 | 40 | **0** | 0.0% | 11 |
| ISMS-IA | 304 | 40 | **0** | 0.0% | 6 |
| SM-AI-II | 352 | 40 | **0** | 0.0% | 6 |
| **total** | **4154** | **822** | **16** | **1.9%** | **92** |

**The two samples agree**: 1.5% wrong keys on the exposed 342, 2.3% on the random 480.
The second was drawn at random from every certification, so the rate is a property of
the bank and not of what eight attempts happened to draw. **Every certification has
defects**; three have no wrong key yet and all three have contested items.

### It is a generator problem, not a translation problem

The errors cluster by **source**, not by language:

- 2017 Scrum Guide wording across the four Scrum certifications
- 19011:2018-style clause numbering in AIMS-IA and ISMS-IA
- "requirements" the ISO standards do not contain
- an odd-one-out option pattern the generator repeats (Tier D, nine items)

**The Spanish read clean across all 342.** No translation moved a key or made a
distractor correct. Every defect found in both reads is in the English, so every fix
lands in all three languages and no translation pass would have found any of them.

### What remains, and what the next step is

| | |
|---|---|
| English secure items live | **4154** |
| read across both samples | 822 |
| retired as Tier A | 16 |
| **not yet read** | **3348** |

**The next step is batches of 480, read the same way**: stratified by domain per
certification, seed recorded, no overlap with what has been read, Tier A retired on the
spot after the domain-quota feasibility check. At 3348 remaining that is
about 7 more batches. `scripts/build-audit-sample.mjs`
already excludes read groups, so each batch is one command.

### The one thing only Juan can supply: human SMEs

**92 contested items are waiting on subject-matter judgement, and an AI
read cannot close them.** Four domains:

| domain | who is needed | queue depth |
|---|---|---|
| Scrum (2020 Guide) | a PST or equivalent | 41 |
| ITIL 4 / ISO 20000 | a service-management practitioner | 6 |
| ISO auditor (27001 / 42001 / 19011) | a lead auditor | 32 |
| EU AI Act and HR / employment law | counsel or a compliance specialist | 13 |

> **Under ISO/IEC 17024 an AI read is TRIAGE. It does not replace SME sign-off.** What
> the two reads can do is put the right items in front of the right expert and retire the
> ones that are plainly wrong; what they cannot do is be the judgement of record for a
> scored examination. Tier A was retired on measurement. **Tier B is not rescored on
> "contested" and must not be** — that decision belongs to a named human with the
> standard open.

Queues: `ITEM-REVIEW-QUEUE.md` (Tier B, SME) and `ITEM-FIX-QUEUE.md` (Tiers C, D, E).

**A SPANISH SCRUM/ITIL GLOSSARY TO PIN — nine terms, none settled.** Raised
2026-09-26 from the Tier C read. Counts in `TIER-C-SPANISH-DRAFTS.md`; every one of
the nine is genuinely split in the live corpus, so **no sweep can pick a side the
corpus has already chosen.** Sharpest case: *el* Sprint Review 380 rows against *la*
152, while *la* Sprint Retrospective leads 152 to 94 — the corpus disagrees with
itself about the gender of two events in the same family. `prompt` is 225 English
against 196 *indicador*; `Developers` 1001 against 766 *desarrolladores*. This wants
one decision per term, then a pinned list, not a replacement pass.

**`SGAI` — a coined acronym, 497 uses, consistent.** Recorded 2026-09-25 from the
item translation sweep; **nothing changed, deliberately.**

The item bank renders *AI management system* as `SGAI` in Spanish and Portuguese
— AIMS-IA 412, ISMS-IA 79, AIGRM-I 6 — sitting beside `SGSI`, which IS the
established rendering of ISMS in ISO's own Spanish translations. `SGAI` is the
parallel coinage for AIMS and no published standard uses it.

It is internally consistent across certifications and both languages, so a reader
meets the same term everywhere and is not misled. That is why this is a
convention question rather than a defect, and why it should not be swept: a
replacement is a comparison, and the alternative long form has not been counted.

> **The right moment to decide is when a Spanish-speaking auditor reviews
> AIMS-IA.** They will know whether `SGAI` reads as natural practitioner shorthand
> or as an invention, and that judgement is not available from the corpus.

Evidence: `ITEM-QUALITY-SWEEP.md` section 5, `ITEM-QUALITY-SWEEP.json`.

**`concept_slugs` — MEASURED 2026-09-25, AND THE SYNC SHOULD NOT BE WRITTEN.**

The queued item read *"`concept_slugs` diverges in 2 lessons, 4 serving rows"*.
**Divergence does not reproduce and the word was wrong: it is ABSENCE.**

```
lesson rows                                1437
frontmatter agrees with lesson_concepts    1387   (all of them)
DIVERGES                                      0
no frontmatter at all                        50
```

The first run of that measurement reported **592 divergences** and every one was
the join: `lesson_concepts` is keyed on the **English** lesson id, and a
translated row is a separate `lessons` row with no entries of its own, so each
one was being compared against an empty set by construction. Compared against
the English sibling through `lesson_group_id`, the answer is zero.

**The real state, enumerated rather than counted.** All 19 affected lessons are
SM-AI-I:

- **12 lessons carry no frontmatter in ANY language** (36 rows) — an older state,
  nothing to sync to.
- **7 lessons have English frontmatter and translations without it** (14 rows):
  `01-01-agile-manifesto`, `01-02-empirical-process-control`,
  `02-05-self-management-and-boundaries`, `03-03-the-daily-scrum`,
  `03-05-the-sprint-retrospective`, `04-04-increment-and-definition-of-done`,
  `05-05-terminology-drift`. **The two queued lessons are 4 of these 14, not the
  whole set.**

> **WRITING THE FRONTMATTER INTO THOSE 14 TRANSLATED BODIES IS THE WRONG FIX,
> TWICE OVER.** It puts `concept_slugs` in a THIRD place — the table, the English
> body, and now the translated body — which is the second-copy defect this file
> exists to fight. And a translated-side edit moves `tr_hash`, so migration 364
> would correctly withhold all 14 rows until a human re-reviews them: fourteen
> rows dark, and fourteen reviews spent, for a metadata field no reader sees.

**The durable fix is unchanged and still deferred:** `get_lesson` should publish
`concept_slugs` from `lesson_concepts`, which is the relational truth, rather
than from the served body. That is a Worker change in `certidemy-web`. Until it
lands, a consumer reading `concept_slugs` off a served body gets a list for
English and **nothing** for es-419 and pt-BR on those 7 lessons — which is a
third state, not an empty list, and must not be reported as "no concepts".

Evidence: `FRONTMATTER-CONCEPTS.json`, `scripts/measure-frontmatter-concepts.mjs`.

**Checkpoint MACHINE fields do not drift at all**, measured the same day:
20,616 field groups over 958 English/translation lesson pairs, paired by question
id — `correct`, `type`, `bloom_level`, `difficulty`, `concept_slugs` and the
option id list all identical, 0 findings, 0 unparsable blocks.
`scripts/measure-concept-slug-drift.mjs`.

**The cue guard's absolute margin.** Calibrated on English, unsound on a
translation that expands 1.15x–1.21x. Noted beside `CUE_CFG` in
`functions/_shared/item-rules/item-cue-guard.mjs`; a relative margin is needed
before the guard is used on translated items. Not changed.

**The five Spanish-origin SM-AI-I practice items.** No English sibling has ever
existed, so every comparison gate is blind to them. In the read queue behind the
342 exposed items — see `EXPOSED-ITEMS.md`.

---

Carried forward, unchanged, not touched by any prompt above:

- Spanish-native architecture — English pivot vs native authoring, round-trip quality cost still unmeasured
- Concept leak gating — Prompt 3.4 forces a decision on it, which is the first movement on this item
- The specimen badge and practice item for `/our-standard`
- An auditor for the MCC drafts
- 16 tables maintaining `updated_at` by convention with no enforcement
