# HANDOFF v13.0 — the rule was stricter than the risk

2026-09-17, late. The arc that began with "can partners use our content" closes
with **every ISO-derived certification measuring 0 refused** and a position that
says why, rather than a gate that could not explain itself.

**The largest single change was not code.** IP-POSITION §6's address-not-text
rule was drafted before anything had been measured, and measured, it was
stricter than the risk warranted. Amending it retired more work in one evening
than the previous three days of repairs had completed — one lead-in edit on
`isms-ia-05-05` retired 139 quoted words.

---

## 1. Where the four certifications stand

Read from the live rows, not transcribed:

| cert | english | non-english | withheld pending bilingual read |
|---|---|---|---|
| AIMS-F | 35/35 | 70/70 | 68 |
| ISMS-F | 49/49 | 98/98 | 6 |
| AIMS-IA | 40/40 | 80/80 | 78 |
| ISMS-IA | 38/38 | 76/76 | 56 |

Every certification on the platform: **0 refused, longest run 9w** against a
threshold of 10.

**`migrations/337_mcp_admit_isms_ia.sql` is written and has not run.** It admits
ISMS-IA and empties the held set. Then deploy `courseware-read` (edited, not
deployed), then the web Worker — which is at eleven and needs twelve. The order
is not interchangeable: ahead of the migration the function accepts `ISMS-IA`
and the view returns nothing, so a partner is told the certification has no
lessons.

**336 had already run when I went to write 337**, and CLAUDE.md said it had not.
Caught by querying `pg_catalog` first: the view's own comment read *"Eleven as of
336"*. Seventh recorded instance, and again the status half under a correct
number — the number was right *because* the file existed.

---

## 2. What the amendment actually bought, measured

The blockquotes were never the binding constraint, and the measurement said so
before any of the work was done:

| | lessons servable |
|---|---|
| before | 7 of 38 |
| attributed blockquotes exempt | 10 of 38 |
| **every** blockquote exempt | 10 of 38 |

Three lessons. The other 28 were held by **prose** — 79 runs reproducing ISO
outside any quotation, which the amended rule still does not permit, and which
had to be recast one at a time.

**Module 4 is where the exemption helped least.** Every other ISMS-IA module
quoted ISO in blockquotes; module 4 reproduces clauses 5.1, 5.2, 6.1.2, 6.2 and
6.1.3 as **lettered bullets**, which are not blockquotes and are therefore
measured. That is the honest shape of the rule: it retires quotations that were
already marked *as* quotations. Reproducing a clause as a bulleted list is a
different act.

---

## 3. Two controls died of the work finishing, on the same day

This is the entry to keep.

**The positive control was a lesson.** `scan-iso-leaks` asserted that
`isms-ia-05-05-fixing-it-and-fixing-it` tripped at ≥40 words, and it was the only
check proving the index is not empty. Its 87 words are *entirely* inside
blockquotes; its prose measures 10. Adding four words — "Clause 10.2 is" — to one
lead-in, which the amended rule **requires**, takes it to 8. Complying with our
own position would have retired the control silently, as an editorial edit.

**Then a post-condition did the same thing loudly.** *"the two heavily-quoting
certifications DID produce refusals"* failed on a clean corpus and blocked a scan
whose every verdict was correct.

> **A check whose subject is CONTENT is disarmed by finishing the content.** One
> went quiet and passed; one went loud and failed. Loud is luckier and no more
> correct.

Both are now synthetic. Three canary literals, one per standard, asserted against
**that standard's own index** — a single combined-index canary proves only that
*something* loaded. And the assertion is **full length, not a threshold**: with
27001 absent, its canary still scores **27 of 31 words against 42001 alone**,
because Annex SL gives the two standards near-identical clause 4.1 wording. A
control written `>= 20w` would have passed with a whole standard missing.

The replacement post-condition asserts the **refusal path** in both directions: a
synthetic body over the threshold is refused, one under it is not. Strictly
stronger than what it replaced, which would have passed on a gate stuck at
"refuse".

---

## 4. The identity control fired on its first run and was right

Exempting blockquotes meant segmenting the document. The property the design
rests on: **with nothing exempt, `segments()` must return the body unchanged** —
a string identity, not a re-measurement, which is a stronger claim.

232 of 1437 rows failed it. `split(/\r?\n/)` + `join("\n")` was silently
rewriting CRLF to LF.

It would not have changed one measurement, because `norm()` collapses all
whitespace before anything is compared — **and that is exactly why it was worth
fixing rather than excusing.** A control relaxed to "identical after normalising
line endings" would also stop noticing a segmenter that ate a line.

**Cut, do not delete.** Exempt lines cut the stream into segments; deleting them
would join the line before to the line after and measure a run across a junction
the document does not contain.

---

## 5. Which half is checked and which half is trust

Recorded in §6 as a statement, not a caveat:

| | English | es-419 / pt-BR |
|---|---|---|
| clause text detected | by the scanner | **not at all** |
| quotation set off | by the scanner | **not at all** |
| attribution present | by the scanner | **by a human, or not at all** |

The index is built from the English editions, so a translated row measures zero
by construction and the verdict is taken over the lesson group. Sound under a
rule that refused all clause text; **not** sound under one whose operative half
is *attributed*, because attribution is a property of each rendering.

**And it showed up on a real row within hours.** `isms-ia-04-07`'s English
lead-in now reads *"as ISO/IEC 27001:2022 now carries it"*; both translations
still read *"Seu corpo normativo, na íntegra"*. The attribution is absent from
the translations and no instrument here can see it.

Closing it means indexing the Spanish and Portuguese editions of the three
standards. We do not hold them. That is a purchasing decision, not an
engineering one.

---

## 6. The four items, finished

### Modal inflation: 122 → 8

Re-measured first, and **the count had moved again: 134 → 122.** The vocabulary
changed five times after that 134 was taken — `possam`/`puedan`, `exigido`/
`requerido`, `could`, `obligations`, and the overlap merging — and ISMS-IA's
English was repaired in between. The delta is not attributable to any one of them
and is not quoted as if it were.

**The convention census is the finding underneath the fix.** `convém` is *still
zero* across both auditor certifications' Portuguese, against 382 and 223 uses of
`deve/devem`. On AIMS-F and ISMS-F it is 18 and 6. The ABNT rendering of `should`
was never chosen on the IA certs; `deveria` carries it instead. Recorded, not
changed — that is a register decision.

### AIMS-F: no withheld lesson bodies

35/35 English served, 0 not servable, 34 of 35 review-gated per translation. The
five were module 4's and were completed earlier today.

### The held paragraphs: 5 structural, not ~20

`scripts/triage-held-paragraphs.mjs` splits them with **no model calls**, because
re-running the translator gives a different answer each time — a "glossary keys
changed" refusal is about one completion, not about the text. Of 780 repaired
paragraphs in 208 flagged rows, **five** are structural: the language guard
scores the existing translation 0 want / 0 avoid, a tie it requires want to win,
so no completion can ever pass.

### `is_provisional` vs `ksa_is_provisional`

**1016 rows, not 1000.** The first measurement asked for `limit=10000` and
printed 1000; PostgREST caps a page and says nothing. CLAUDE.md already records
this against `limit=5000` hiding a lesson group — same mistake, same API, eight
days later. It now pages to exhaustion *and* asserts against `count=exact`,
because a page loop with no count assertion is the same bug with more code.

---

## 7. Open, and what each costs

1. **Run 337**, deploy `courseware-read`, then the web Worker to twelve.
2. **The 8 modal paragraphs** — one-word substitutions, listed for a ruling
   rather than forced past a guard that cannot certify a short line.
3. **The 5 structural paragraphs** — a human, or a language-guard change that
   can decide a line carrying no distinctive token.
4. **`ksa_is_provisional`** — three options with numbers, no recommendation,
   because the third one nobody had costed changes the shape of the choice.
5. **The bilingual read** of everything in this arc. 208 rows are withheld
   waiting for it and nothing mechanical substitutes.

---

## 8. What to distrust in this document

Section 1's table was read from the live rows at the end of the session, and
sections 2 and 6 carry numbers I took while working.

Two counts in this arc were wrong because a tool answered a different question
than the one asked — a 1000-row page cap read as a total, and a per-line run
count read as the gate's. Both were caught by an assertion, neither by
re-reading.

If a number here matters:

```
node --dns-result-order=ipv4first scripts/scan-iso-leaks.mjs
node --dns-result-order=ipv4first scripts/measure-ksa-provisional.mjs
node --dns-result-order=ipv4first scripts/triage-held-paragraphs.mjs
```

All three are read-only without `--apply`, and all three carry controls that must
fail if the instrument is broken.
