# Certidemy Lesson Style Guide (v1.0)

**Status:** Locked authoring standard. Applies to every lesson in every certification.
**Companion to:** `LESSON_AUTHORING_SPEC.md` (the *syntax* contract). This is the *quality* contract.
**Last updated:** July 2026

---

## What this document is

`LESSON_AUTHORING_SPEC.md` says how a lesson must be *structured* (frontmatter, section markers, widget schemas). This document says how a lesson must *read* — the voice, prose discipline, and pedagogical standards that make a lesson feel like a premium commercial product rather than a strong draft. Both are prerequisites. A lesson that passes the spec but violates this guide is not launch-ready.

Every lesson is drafted **to this bar from the first pass**, so the final polish sweep is light, not a rescue.

---

## 1. Voice

**Professional, but plain-spoken and confident.** Write the way a senior practitioner explains something to a sharp colleague: direct, warm, unpretentious. Authority comes from clarity, not from vocabulary.

- **Confident, not clever.** State the point plainly. Do not reach for a memorable turn of phrase where a clear sentence lands better.
  - Ban list (examples of "trying to sound smart"): *"the AI-era sharp edge," "the most seductive form of waste," "the quiet killer,"* and similar. If a phrase exists to sound impressive rather than to be understood, cut it.
  - Fix pattern: replace the flourish with the plain claim. *"Unreviewed generated code is the most seductive form of waste"* → *"Unreviewed generated code looks like productivity, but it's waste — a review backlog in disguise."*
- **Consistent register.** One lesson should not swing between academic and casual. The `::hook` can be punchy; the `::concept` bodies are calm and explanatory; the `::summary` is crisp. But the underlying voice is the same throughout.
- **Second person, active.** "You inspect the diff," not "the diff should be inspected." Speak to the learner as the practitioner they're becoming.
- **No hedging filler.** Cut *"it's worth noting that," "essentially," "at the end of the day," "in many ways."* Say the thing.

---

## 2. Prose discipline

- **Tighten every sentence once.** After drafting a concept, reread it and cut every word that doesn't carry meaning. Wordy → lean. Most first-draft sentences lose 10–20% with no loss of content.
- **One idea per paragraph.** If a paragraph turns a corner into a second idea, split it.
- **Concrete over abstract.** Prefer a specific example to a general statement. *"An AI assistant can produce a hundred lines in three seconds, none of it evidence of correctness"* beats *"AI output should be treated with appropriate epistemic caution."*
- **Vary sentence length deliberately.** A short sentence after two long ones lands. Don't write in a monotone of same-length sentences.
- **No throat-clearing.** Start the concept with the concept, not with a wind-up.

---

## 3. The domain-seat perspective (the "written for THIS role" rule)

Every cert teaches some shared foundations (the Agile Manifesto, empiricism, the Scrum framework). The rule:

- **Sharpen the role angle wherever it is honestly there.** A Developer reads the Manifesto's "technical excellence" principle differently than a Product Owner reads "customer collaboration." Lead the shared concept into the role's lived reality: *what does this mean for the person who builds / owns value / facilitates?*
- **Do NOT manufacture a role angle that isn't real.** The Agile Manifesto is genuinely shared. If forcing a "Developer-specific" spin would fake a distinction that doesn't exist, don't — teach the foundation cleanly and let the role angle live where it's authentic (usually the application, the examples, the interactive scenario). Honesty beats a contrived hook.
- **Test:** every foundational lesson should have at least one moment a reader thinks "this was written for *me*, the [role]" — through the example, the scenario, or the stakes, not through a strained sentence.

---

## 4. Repetition and cross-referencing

This is the highest-frequency quality defect. Two rules:

- **Each concept has one home lesson.** The lesson whose `concept_slugs` own a concept teaches it in full. Other lessons that touch it **reference, don't re-teach**: a sentence of reminder plus a pointer, not a second full treatment.
  - Pattern: *"Empiricism (covered in 01-02) is why this matters here: …"* — one clause of recall, then the new angle. Never re-explain transparency/inspection/adaptation from scratch in a later lesson.
- **Within-module awareness.** When drafting lesson N, assume the reader did lessons 1..N-1. Build on them; don't restate them.
- **Cross-module repetition is a FINAL-SWEEP item.** Full de-duplication across all lessons of a cert can only be done once every lesson exists (you can't assign a concept's "home" until you see all the lessons that touch it). So: minimize repetition as you draft, and flag a **final consistency sweep** per cert to catch the rest. This is the one polish task legitimately deferred to the end.

---

## 5. Checkpoint quality

Checkpoints are assessment, not filler. Standards:

- **Explanations teach, they don't just confirm.** A good explanation says why the right answer is right *and why the tempting wrong answer is wrong*. Weak: *"B is correct because it's the definition."* Strong: *"B is correct — generation isn't evidence of correctness. A overstates it (AI isn't 'always wrong'); C and D name the wrong mechanism."*
- **Distractors must be plausible.** Wrong options should be things a real learner might believe, not obvious throwaways. A distractor nobody would pick teaches nothing.
- **Deliberate difficulty progression.** Within a checkpoint set, roughly ascend: a `1_remember` or easy `2_understand` first, an application/analysis item last. Don't put the hardest item first or cluster all at one level.
- **Bloom honesty.** The `bloom_level` tag must match what the item actually demands. A recall question tagged `4_analyze` is a lie the psychometrics will later expose.
- **One concept focus per item where possible.** Tag the concept(s) the item genuinely tests, so the traceability matrix stays honest.

---

## 6. Widgets

- **The interactive must teach the concept, not decorate it.** A `toggle-and-observe` or `drag-match` should make the learner *do* the discrimination the concept is about. If the widget could be deleted without losing understanding, it's decoration — redesign it.
- **The reflection/explanation is the payoff.** Write it to consolidate the insight, not to restate the prompt.
- **One widget per lesson is the norm.** Two only if the lesson genuinely has two distinct interactive moments. Never zero (every lesson needs one active-learning beat).

---

## 7. Structure defaults (within the spec)

- `::hook` — 1–2 sentences, punchy, states the tension the lesson resolves. It may be sharper in tone than the body.
- `::concept` blocks — 2–4 per lesson, each one idea, calm and explanatory.
- `::callout` — use `pitfall` / `terminology` / `pro-tip` sparingly and only when the aside genuinely earns a box. Not every lesson needs one; don't force it.
- `::interactive` — one, teaching the core discrimination.
- `::checkpoint` — 3 items, ascending difficulty, per §5.
- `::summary` — 4–6 crisp bullets, each a takeaway a learner could repeat. Not a table of contents; the *conclusions*.
- **Duration:** 8–10 minutes for a foundational lesson; up to ~12 for a signature/heavy one. Honest estimate of Focus-mode time.

---

## 8. Scrum terminology

- **Scrum proper nouns are never translated and always canonical to the 2020 Guide:** Developers (not "Development Team"), self-managing (not "self-organizing"), events (not "ceremonies"), the three commitments (Product Goal, Sprint Goal, Definition of Done).
- Where legacy terms appear in the wild, teach the canonical term and flag the drift in a `terminology` callout — don't silently use legacy language.

---

## 9. Pre-submit checklist (run on every lesson)

1. Frontmatter passes the spec; `concept_slugs` and `task_codes` exist in the DB for this cert.
2. Voice is confident-plain — no "trying to sound smart" phrases (§1).
3. Every sentence tightened once; no throat-clearing or hedging filler (§2).
4. Role angle is present and honest — not manufactured (§3).
5. Concepts owned here are taught in full; borrowed concepts are referenced, not re-taught (§4).
6. Checkpoint explanations teach the distractors; difficulty ascends; Bloom tags are honest (§5).
7. The widget makes the learner *do* the concept's core discrimination (§6).
8. Summary is 4–6 conclusion bullets, not a recap of headings (§7).
9. Scrum terminology is canonical 2020-Guide (§8).

---

## 10. What is deferred to the per-cert final sweep

Only these — everything else is done at draft time:

- **Cross-module de-duplication:** assigning each shared concept its single home lesson and reducing all other mentions to references, once all lessons of the cert exist.
- **Cross-lesson tone consistency check:** a read-through of the whole cert for register drift.
- **Prerequisite-chain and cross-reference accuracy:** confirming every "covered in NN-NN" pointer resolves correctly across the finished set.

*End of style guide v1.0.*
