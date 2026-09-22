certidemy-supabase

Runs now, ahead of batch 2, and does not wait on my read of batch 1. Nothing here touches
descriptions.

## 0 — The finding, restated so the scope is unambiguous

You reported it and it is the most important thing in the last two turns:

> Every clearance script here — including the two I wrote this week — re-stamps `en_hash`
> and `tr_hash` rather than verifying them.

The gate is sound. The procedure walks around it. A clearance that re-stamps computes the
hash from the row's *current* English and writes it, which makes every row look fresh by
construction — including rows whose English moved after the translation was generated. The
gate is then never consulted, because the thing it compares against was just overwritten
with the answer it wanted.

This is the same shape as everything else this week: **an instrument reporting success while
not looking at the thing.** Here the instrument is sound and the caller blindfolds it.

Stamping is legitimate in exactly one place — the moment a translation is generated, where
the generator holds the English it translated from and the hash is a record of that fact.
Everywhere else, the hash is read and compared, never written.

## 1 — The exposure number, first and read-only

Before fixing anything I want to know whether this has already released stale rows.

For **every** `concept_translations` row with `is_provisional = false`, recompute
`concept_row_en_hash` and `translation_hash` from the current source and compare to what is
stored. Report:

- how many rows are serving with a stored hash that does not match the recomputed value —
  per certification, per language, with the denominator
- of those, how many were last touched by a clearance script rather than by a generator
- the same figures for `lesson_translations` and `task_translations`, which use the 352
  pattern and may have the same caller defect

Page it and assert the count, per the rule from Part A. If the answer is zero, say so with
the denominator and I will treat the defect as latent rather than realised. If it is not
zero, **stop and report before fixing** — the repair for already-released stale rows is a
withholding decision and that is mine.

Exclude ISMS-F's 44 known rows from the headline figure and report them separately. They are
stale because of this week's casing pass, they are blocked in both languages, and counting
them alongside genuinely-released rows would overstate the exposure.

## 2 — Census every writer of a hash column. Read only.

Enumerate every script, migration and function that writes `concept_row_en_hash`,
`translation_hash`, `en_hash` or `tr_hash` in any position. For each, classify:

- **GENERATOR** — holds the source text it translated from, and the stamp records that. May
  write.
- **CLEARANCE** — flips `is_provisional`, writes review rows, or releases. Must **never**
  write a hash column, and must read and compare.
- **UNCLEAR** — say so rather than guessing. A script that does both is the defect in its
  purest form and I want it named.

Report the three lists before changing any of them. I expect the CLEARANCE list to contain
the two scripts you wrote this week and I would like to know how far back it goes.

## 3 — The repair

Every script on the CLEARANCE list:

- stops writing hash columns
- reads the stored hash, recomputes from current source, and **refuses the row** on mismatch
  rather than clearing it
- reports refusals per row with the slug, the stored hash and the computed hash — a refusal
  that prints only a count is a refusal nobody will act on
- exits non-zero if any row was refused, so a clearance that partially applied cannot be read
  as a clearance that succeeded

A refused row is not an error in the clearance. It is the gate doing its job, and the correct
next step is retranslation, not a flag to force past it. Say that in the refusal message, or
someone will add `--force` in six weeks.

## 4 — The standing assertion

Add to the invariant suite, with a denominator per the VACUOUS rule:

**No script outside the GENERATOR list writes a hash column.** Mechanism: the check
enumerates write positions for the four columns across `scripts/` and `supabase/migrations/`
and asserts the writer set equals the GENERATOR list, which is declared explicitly in one
place rather than inferred. A new writer fails the suite and has to be classified
deliberately.

Report its denominator — how many write positions it examined. If it examines zero it is
vacuous and the pattern-matching is wrong, not the corpus.

## 5 — ISMS-F's 44 stale rows

Do nothing to them now. They are stale, they are correct to be stale, and both ISMS-F draws
are blocked so nothing is exposed. They resolve at retranslation, when a generator legitimately
stamps them from the English it translated. Record them in the open items with that
disposition so nobody clears them on the way past.

Note the general lesson beside it, because it is not obvious: **a cosmetic fix to a name is a
source change.** `concept_row_en_hash` is `md5(name || '|' || description)`, so 21
capitalisation fixes invalidated 44 translations. That is the gate behaving correctly — the
translated names really did render the old casing — but it means no edit to a concept row is
ever cosmetic downstream. Worth recording as a rule.

## 6 — Two small rulings from your last report

**6.1 `aims` in "ISO 42001 aims".** Leave it out of the initialism sweep. You were right that
moving the count off 22 would break the agreement that licensed the write, and the
post-condition asserting it was not swept is the correct shape. But the name is bad in either
casing — if it means the AI Management System, it should say so. Rewrite the name, as one
row, separately from the sweep, and let its hash invalidation ride with the 44.

**6.2 `description_is_fallback` rendering both withholding reasons identically.** Record it
as a finding. Do **not** change the contract. contractVersion 2 is partner-facing and this is
not the week to move it. Write down what the two states are, that a caller cannot distinguish
them, and what a contractVersion 3 field would look like if we decide it matters.

## 7 — One rule to record

**Rule — a gate's stored value is written only by the thing that can prove it.** `en_hash`
and `tr_hash` record that a translation was generated from a particular English. Any caller
that recomputes and writes the hash makes every row fresh by construction and the comparison
never happens; the gate is intact and simply never consulted. Mechanism: hash columns are
written only from the generator path, declared in one explicit list; every other caller reads,
compares and refuses on mismatch, and a refusal exits non-zero. Occasion: every clearance
script in the repo re-stamped rather than verified, including two written the same week the
gate was built to stop exactly this.

## 8 — Out of scope

Descriptions. Batch 2 waits on my read of batch 1, and nothing in this prompt touches
ISMS-F's text.
