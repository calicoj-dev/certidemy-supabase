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
