# What is withheld, and why — derived, not recalled

Measured 2026-09-24. Every figure comes from a hash comparison or from the applied
scripts in this repository. Nothing here is from memory.

**Two of the three signals that should have derived this are blind, and that is the
first finding.**

---

## Concepts — the partition is clean and matches the model exactly

`concept_translations.en_hash` against `concept_row_en_hash`, and `tr_hash` against
`translation_hash(name, description)`. Both hashes are recomputed with the function that
wrote them.

```
rows                                          3460
serving                                       3007
provisional (never cleared)                    440
1.1  English moved, translation did not          2
1.2  translation edited, English did not        11
     both moved                                  0
```

**1.1 — regenerate (2 rows).** `aia-interested-party-requirements` es-419 and pt-BR. Its
English was repaired by `fix-aia-interested-party.mjs`.

**1.2 — review as they stand (11 rows).** Read by name rather than inferred from the
count, because "11 is what I expected" is exactly the trap:

```
keep-it-simple-and-practical   es-419, pt-BR      the minimo / nao / minima fixes
institution-proxy              pt-BR              the condicao fix
ia-audit-programme-3-5         es-419  \
aia-audit-scope-definition     es-419   \
ia-audit-scope-definition-3-6  es-419    \
ia-control-design-versus-...   es-419     >  the 8 periodo normalisations
ia-annex-a-control-testing     es-419    /
ia-evidence-retention-and-...  es-419   /
aia-programme-vs-individual-.. es-419  /
credential-currency            es-419 /
```

Regenerating any of these would throw the correction away.

---

## Lessons — the hash signal returns zero, and it is blind

```
non-English lessons                            958
withheld                                       181
  A  ISO-held (the scanner)                      4
  B  English edited in this programme            36     <- 1.1
  C  never reviewed, English never touched      141
  D  reviewed, then something moved               0
```

**`en_content_hash` finds NOTHING: 0 of 958.** That is not evidence of absence.

> **367 stamped every translated lesson on 2026-09-23, AFTER the conversions landed the
> same day.** The stamp therefore records post-conversion English, and a mismatch is zero
> by construction. 836 of 958 rows carry `en_content_hash_basis = 'baseline'`, which is
> exactly the column saying *we never established that this translation tracks this
> English*. The basis column did its job: it is the reason this is a known blindness
> rather than a clean bill of health.

`en_content_hash` will detect English movement **from 2026-09-23 onward**. It cannot see
backwards, and nothing can.

### The review table cannot fill the gap either: 141 of 177 were never reviewed

Only one row has a review whose `en_hash` has gone stale. There is no baseline to compare
against for the rest, because no review row exists.

### And `updated_at` is destroyed as a signal

An early attempt used it and produced *84 review-held rows with English newer than the
translation* and *324 serving rows* likewise. Both numbers are artifacts:

```
English lesson rows by updated_at minute:   478 of 479 at 2026-09-23 17:00
```

A bulk column write — 367's stamping — reset the whole corpus to one minute. **A
timestamp that every row shares is not a record of when anything changed.** Caught by
reading the distribution rather than trusting the count; the two figures are withdrawn.

### So 1.1 was derived from the REPOSITORY instead

The applied scripts declare their targets, which is a record rather than a recollection.
Union of `apply-0306`, `apply-batch-a`, `apply-ia-batch`, `apply-ismsf-batch-1/2/close`,
`apply-rewrites-batch-1`, `convert-ceiling-breaches`, `fix-aimsia-0410-span`,
`fix-broken-attribution-chain`, `fix-ismsia-0406-modal`:

```
20 English lessons edited, all 20 resolve in the database
40 translations of them:  38 withheld,  2 SERVING
```

**The 2 serving are `aims-ia-04-10` es-419 and `isms-ia-04-06` es-419.** Quoted-word
counts 59 vs 53 and 36 vs 28 against their English — within normal expansion, so they do
not look like untrimmed quotation. They are named because they are in the 1.1 set by
provenance and nothing is holding them.

`isms-ia-03-02`'s Spanish and Portuguese, the 52-word case, **are withheld** — CLAUDE.md
records them as serving and that line is now stale.

---

## C is the largest bucket and it is neither 1.1 nor 1.2

**141 of the 181 withheld lessons were never reviewed at all** — no review row, English
never touched in this programme. They are not stale and they are not corrected; they are
waiting for a first read. Reported rather than folded into either bucket.

---

## The proposed structural gate does not fire on its own motivating case

§3 proposed: *a regenerated body must not be longer than its English by more than normal
expansion, and must not contain a blockquote the English does not have.* Measured on
`isms-ia-03-02`, the lesson the rule was written for:

```
                 quote lines   chars   ratio vs en   quoted words
en                         1   17364          1.00              5
es-419                     1   19251          1.11             56
pt-BR                      1   18892          1.09             53
```

**Neither half fires.** The quotation sits inside a blockquote all three share, so the
count is 1 everywhere; and 47 extra words in a 17,000-character body is 0.3 percent, well
inside expansion. A guard measured against the corpus before it is adopted, and this one
would have been adopted and been silent.

**What does separate them is QUOTED-WORD COUNT per row**, English against translation: 5
against 56. Distribution across all 958 non-English lessons:

```
delta > 10      72     (40 of them SERVING)
delta 4..10     48
delta -3..3    834
delta < -3       4
```

**The 72 were read, and they are a mixture — the detector cannot be a gate.**

| | |
|---|---|
| `isms-ia-04-03` es-419, en 38 -> es 110 | **real.** *"NOTA 2 El Anexo A contiene una lista de posibles controles"* is ISO 27001 text the English no longer carries |
| `isms-ia-05-03` es-419, en 271 -> es 389 | **not a defect.** A long worked example — a fictional audit finding, our own words, expanding |
| SM-AI-II, 34 rows, 31 serving | Scrum certification. Whatever it is, it is not ISO clause reproduction |

Separating the two needs to know whether the quoted text is ISO text, and **the leak
index is English-only**, so no instrument here can score a translated quotation. That gap
is already recorded in CLAUDE.md as the largest of the three coverage gaps.

So: quoted-word delta is a **report**, not a gate. Firing count stated: 72 at >10, of
which an unknown share is legitimate.

---

## What this changes about the plan

1. **§2 and §3 can proceed for the 36 + 2 lesson rows and the 2 concept rows**, which are
   derived from the repository record rather than from a hash.
2. **§3's structural gate needs replacing** with the quoted-word comparison, and that is a
   report requiring a human verdict rather than a pass/fail gate.
3. **The 141 never-reviewed rows are a queue-sizing question, not a regeneration one**, and
   they dwarf both buckets.
4. **The 11 concept rows go to review as they stand** — that half is unambiguous.
