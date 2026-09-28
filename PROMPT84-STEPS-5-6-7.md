# PROMPT-84 steps 5, 6 and 7

## Step 5 — the modal-fidelity false flag, narrowed

`fcb8a516`'s anchor is **ISO/IEC 42006 clause 1, Scope**, and its key reads:

> "ISO/IEC 42006 governs certification bodies auditing AI management systems; ISO/IEC 42001 governs
> the AIMS requirements organizations **must** meet."

`claimStrength` saw `must` and called it a requirement. Measured: the key alone scores `none`, and the
trigger is the second half plus the explanation's *"the AIMS requirements that organizations must
implement"* -- a report of what a **different standard** obliges, inside a sentence whose whole job is
to say which document covers what. **A scope clause states applicability and carries no obligation, so
there is nothing there to inflate.**

The exemption requires BOTH conditions, because either alone is too wide:

1. the anchor is a SCOPE clause -- clause 1, or a title naming scope or field of application;
2. every requirement-bearing sentence in the claim ATTRIBUTES the requirement to a named document
   with a SCOPE VERB -- sets / defines / specifies / governs / covers / applies to / is intended for.

> **`requires` is deliberately not a scope verb.** *"ISO/IEC 42001 requires every organization to
> document an AI policy"* against a scope anchor is exactly the Tier A inflation this gate exists for,
> and it names a document too -- so attribution alone cannot be the exemption. The line is between a
> document SETTING requirements, which is what a scope clause says, and a document REQUIRING something
> of the reader, which a scope clause never does.

**Three regression cases, and the two negatives are the ones that matter:** the positive is
`fcb8a516` verbatim; the first negative keeps the same scope anchor and the same document name and
swaps the scope verb for `requires`, and must still be refused; the second is a bare `shall` claim
with no document named. **63 gate controls, 0 fail**, up from 54.

### And re-running the four items found a different defect that was masking it

The ruling asked for the 3 cannot-check items plus this one to be re-run. On the first re-run
`fcb8a516` failed EARLIER, at `clause-exists`, with *"ISO/IEC 42006 clause 1 (Scope) is not in the
library"* -- about a clause the library does hold.

The model had returned the clause field as the whole string `"ISO/IEC 42006 clause 1 (Scope)"`.
`normClause` anchored its pattern at `^`, so it returned the string unchanged, the passage map missed,
and **two gates blamed the item and the library for a formatting difference they could have resolved.**
That is the same defect that scored an entire linking run at 0.0% recall earlier today, in a different
instrument.

`normClause` now EXTRACTS the address: a leading document designation is stripped first so
`ISO/IEC 42006` cannot donate its `42006`, an explicit `clause`/`annex`/`control` word wins, and six
controls cover the shapes a model actually returned.

### The result on `fcb8a516`, and why the aggregate counts must NOT be read as the effect

After both fixes, `fcb8a516` is **anchored**, all four gates passing:

```
clause-exists     true   1 clause(s) resolve
verbatim          true   1 anchor(s) verbatim in their named passage
modal-fidelity    true   the claim DESCRIBES what a document governs, against a scope clause --
                         2 requirement-bearing sentence(s), each attributing the obligation to a
                         named document with a scope verb
anchor-is-primary true   the key anchors in 1, a primary passage of this task
```

The aggregate moved `anchored 21 -> 22`, `flagged 16 -> 17`, `cannot_be_checked 3 -> 1`. **That delta
is not attributable and must not be quoted as the effect of the fix.** `anchor-existing-items`
re-parses every item with a model on each run, so the gates' INPUTS change between runs. Five items
moved state and only one is mine:

| item | before | after | cause |
|---|---|---|---|
| `fcb8a516` | flag | anchored | **the fix** -- verified by reading its four gates |
| `b97b25ea` | cannot-be-checked | flag (off-task) | the library now holds ISO/IEC 22989 |
| `dd09940d` | cannot-be-checked | flag | the model anchored it at `B.7.5` this run; it had declined before |
| `87d03b82` | flag | anchored | **model variation** -- it chose `A.7.4` where it had chosen `B.7.4` |
| `b965acf2` | anchored | flag | **model variation** -- same clause `6.1.3`, a different support sentence, so a different modal verdict |

My change only ever ADDS an exemption and `normClause` only ever resolves MORE strings, so neither can
create a new refusal. `b965acf2` is the proof that the run-to-run noise is real: same anchor address,
opposite verdict, because the quoted sentence differed.

> **A re-run of a model-backed measure is not a before/after.** Pinning the parse -- persisting each
> item's parsed anchor and re-gating from it, the way the linking judge now does with `--from` -- is
> what would make this delta attributable. It is not done, and until it is, the only sound reading of
> this re-run is the per-item one above.

### The three cannot-check items: 3 → 2 by the library, 3 → 1 as measured

| item | rests on | now |
|---|---|---|
| `b97b25ea` | ISO/IEC 22989 | **held** -- indexed 2026-09-26 |
| `83f159c4` | Regulation (EU) 2024/1689 | **held** -- indexed 2026-09-26 |
| `dd09940d` | ISO 8000-2 | still not held, and genuinely so |

### A separate latent defect, found and NOT fixed

`anchor-existing-items` builds its per-task passage map as `byKeyForSource.set(p.clause, p)` -- keyed
on the clause ALONE. **This repository's own rule is that a clause address is not a key: the key is
(standard, address).** Measured on AIMS-F:

```
task 1.4   4.4    ISO/IEC 27001 vs ISO/IEC 42001
task 3.7   7.1  7.2  7.3  7.4  8.1   ISO/IEC 42001 vs ISO/IEC 27001
task 5.6   9.2.2  ISO/IEC 42001 vs ISO/IEC 27001
```

**7 collisions across 3 tasks**, each one a same-numbered clause from two standards collapsing into a
single map entry -- the later link silently wins, and a gate then compares an anchor against the wrong
standard's text. The harmonised clause structure guarantees this for every auditor certification.

### FIXED 2026-09-28, and measured with the parse pinned: it changes nothing today

`byKeyForSource` is now keyed `source_id + "|" + clause`. A bare address is ALSO offered under its
plain form, but **only where exactly one of the task's standards holds it** -- where two do, the plain
key is deliberately left unset so the gate reports "not in the library" rather than quietly answering
from the wrong standard. A loud refusal beats a silent wrong answer.

Where the item's own clause field names a document -- `ISO/IEC 42006 clause 1`, which `normClause`
otherwise discards on its way to the address -- that name breaks the tie for that item. This is the
narrowest fix that leaves the gate contract alone: the gates still look up a plain address, and the
call site decides which document it means.

**And the measurement is a real before/after, because the parse is pinned.** Each item's parsed anchor
is persisted to `ANCHOR-PARSE-AIMS-F.json`; `--pinned` re-gates from it with no model call, and
`--legacy-keying` reproduces the old clause-only map exactly. Both runs therefore saw IDENTICAL inputs
and differed in one thing.

```
                     legacy keying    source-keyed
sampled                        40              40
anchored                       23              23
flagged                        16              16
cannot_be_checked               1               1
items whose verdict changed                     0
```

> **Zero.** The 7 collisions are real and the fix is right, and **its effect on these 40 items today
> is nil** -- none of them anchors on a colliding address. That is worth recording at the same weight
> as a positive result: the alternative reading, that the collisions were causing the flags, would
> have sent someone to re-examine 16 items for a cause that was not operating.

The collisions stay latent rather than fixed-and-invisible: `ambiguous` is computed per task, so a
future item that DOES anchor on `7.2` across two standards gets a refusal that names both, instead of
a verdict from whichever link happened to be written last.

**The pinned parse is the other half, and it is what the last re-run lacked.** Five items moved between
two unpinned runs and only one was the gate change. A model-backed measure re-run is not a before/after
until its inputs are frozen, and now they can be.

---

## Step 6 — the OCR fixes: one of five done

`scripts/correct-ocr-sources.mjs`, dry by default, `--apply` writes, unknown flags exit 2.

**Fix 1 is DONE and the numbers are better than "near zero".**

| file | standalone `Al` before | after | rule fires |
|---|---|---|---|
| ISO 38507:2022 | 295 | **0** | Al-to-AI 295, smart-quote 18 |
| ISO/IEC 23894:2023 | 252 | **0** | Al-to-AI 252, smart-quote 18 |

Every rule is declared by name with the OCR failure it repairs, counted per file, and **a rule that
fires zero times is printed too** -- a silent rule cannot be told from one that is not running.
`AIl-to-AI` and `ISO-IEC-spacing` both report 0, which is information.

**11 positive controls, and two caught real defects in my own rule:**

- the first version excluded only letters and digits after `Al`, so it rewrote `Al-Khwarizmi`. All 13
  hyphenated occurrences in these two documents are `Al-related`, `Al-based`, `Al-capable`,
  `Al-specific` -- measured, not assumed -- so the discriminator is the CASE of the letter after the
  hyphen: a compound modifier continues lower case, a surname upper.
- excluding a PRECEDING hyphen then missed `non-Al software solutions`, a genuine AI token, and that
  one occurrence is the whole difference between a count of 251 and 252.

Regenerating from `-tesseract.txt` also **restores the dot leaders** the hand-retyped contents list had
removed, so `isContentsLine` can see the contents block again -- which is what would have made ISO
38507's clauses 3.1, 3.2 and 4.1 resolve to their contents entry and take the next contents line as
their body. The hand-retyped file is preserved as `-corrected-hand-retyped.txt`, not overwritten.

**Fixes 2 to 5 are NOT done**, and neither document is indexed:

| fix | state |
|---|---|
| 2. front-matter boundary for `textPath` sources | not done |
| 3. `provenance='ocr'` with the read list recorded | not done |
| 4. tables not anchorable from OCR sources | not done |
| 5. ISO 38507's missing page identified and named in the manifest | not done |

They load as **NO DECLARED POPULATION** when they load: a scanned document has no machine-readable
contents list, and deriving one from a transcription would check the extraction against the
transcription rather than against the standard.

---

## Step 7 — the 42005 DIS: NOT STARTED, and that is the ruling

> *"Then, only if everything above is done: the 42005 DIS."*

Step 6 is one fix of five. So this is correctly gated off rather than begun.

What is ready for it: `sources/incoming/ISO-42005.pdf` is the **FDIS**, and it is text-extractable --
`pdftotext` returns `ISO/IEC FDIS 42005` and clean headings, so it needs no OCR path.
`sources/incoming/draft/ISO-42005-Draft.pdf` is staged separately.

Its terms when it does land, from the ruling: provenance `draft`, no quotation in explanations,
anchoring allowed, **every anchored item goes to your read**, and the scoped contents fix using the
same front-matter boundary as step 6 fix 2 -- which is the dependency that has to exist first.
