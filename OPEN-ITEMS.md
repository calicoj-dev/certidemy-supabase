# Open items — carried forward

## Decisions waiting on a person, not on work

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
