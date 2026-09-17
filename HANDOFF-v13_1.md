# HANDOFF v13.1 — a list that is almost complete reads as complete

2026-09-17, closing. Everything below is measured. The delivery is in §5; the
first four sections are the part worth carrying forward.

---

## 1. The enumeration pattern

Four instances of one shape, in two days:

| the list | what was on it | what was missing | how it surfaced |
|---|---|---|---|
| English strong modals | `obligation` | **`requirement`** | the same repair scored 1→1 in Spanish and Portuguese and 1→0 in English |
| English strong modals | `obligation` | **`obligations`** | a recast of "legal requirements, contractual obligations" |
| English weak modals | `can`, `might` | **`could`** | two recasts wrote "could weaken the conclusions" and were read as dropped modals |
| markers to preserve in a translation | `**bold**`, `*italic*`, glossary | **the blockquote `>`** | eleven quotations became ordinary prose in Spanish or Portuguese |

**Nothing in a passing run distinguishes an almost-complete list from a complete
one.** Each of these lists was written deliberately, read by someone, and used
for days. Each was wrong by exactly one entry, and the entry was never exotic —
`requirement` beside `obligation`, `obligations` beside `obligation`, `could`
beside `can`, `>` beside `**`. The missing item was in every case the sibling of
an item already present.

**The prompt one cost the most, because a prompt has no controls.** A word list
in `obligation-guard.mjs` has a `checkFaithful()` that exercises it. The
instruction *"Reproduce every markdown marker exactly: `**bold**`, `*italic*`,
and glossary annotations"* had nothing. It shipped, ran across hundreds of
paragraphs, and produced eleven rows where a quotation attributed in English was
unmarked prose in two languages — which IP-POSITION §6 does not permit.

**The counter-measure is not longer lists.** It is that the guard and the
instruction must not be the same artefact. The prompt now names the blockquote
marker *and* `retranslate-repaired-passages.mjs` refuses a completion that drops
it, because **a prompt is not a guard**. The list can be short again and the
failure will be loud.

The full tally is higher than four — the modal vocabulary absorbed roughly a
dozen of these over two days, across participles (`exigido` beside `exigen`),
subjunctives (`possam` beside `pode`), nominalisations (`requisito` beside
`exigencia`) and one form that was not in its own character class at all
(`deverão`). Four is the number of *distinct lists*. **One is still open and
deliberately so:** `is/are (not) to be` is an obligation form and is not on the
English strong list, and adding it needs its own measurement because `is to be`
appears in benign prose — including "what is to be done" in this pass's own
clause 6.2 recast.

---

## 2. The method: a check that finds something by accident will miss the next one

`check-attribution-parity.mjs` was built to assert one thing — that a clause
designation present in an English lead-in is present in both translations. It
found 14 such losses. One of them, `isms-ia-01-03`, was reported as a missing
designation and **was not one**: the designation sat one line above, and the real
defect was that both translations had lost the `>`, so clause 4.6's two sentences
were a set-off quotation in English and ordinary prose in Spanish and Portuguese.

The finding was correct. The *reason* was wrong, and a wrong reason is a
measurement of a property nobody chose.

So the property was tested directly — is an English blockquote a blockquote in
both siblings? — and that found **ten more rows the accident had not touched.**

```
address parity, built for the job      14 findings across 5 lead-ins
marker parity, built from the accident 11 findings across 9 rows
```

**The accident found 1 of 11.** Had the address check been treated as sufficient
because it found something, ten rows would still be reproducing clause text
unmarked in the two languages nothing here can measure.

This is the same move as the day's other two entries, applied to a checker rather
than to a control: the positive control that was a lesson, and the post-condition
that named two certifications. In all three the instrument was measuring
something adjacent to the thing it was for.

> **When a check fires for a reason you did not predict, the finding is a bonus.
> The reason is the work.**

---

## 3. What is checked and what is trust, corrected

§6's table read *"not at all"* for the translated columns on two rows. It said
that for one day, and in that day the gap produced 25 real defects.

Both properties the amended rule turns on are language-invariant, **because
neither is ISO text**:

| property | invariant | now |
|---|---|---|
| is the quotation set off? | `>` is markup | machine-enforced, all three languages |
| is it attributed? | `9.2.2`, `ISO/IEC 27001:2022` are designations | machine-enforced, all three |
| does the translation say what the English says? | no | **still a human** |

Closing the third means indexing the Spanish and Portuguese editions of the three
standards. We do not hold them; that is a purchasing decision. Two thirds closed
for the cost of one read-only script.

---

## 4. Where the four certifications stand

Read from the live rows:

| cert | english | non-english | withheld pending bilingual read |
|---|---|---|---|
| AIMS-F | 35/35 | 70/70 | 68 |
| ISMS-F | 49/49 | 98/98 | 6 |
| AIMS-IA | 40/40 | 80/80 | 78 |
| ISMS-IA | 38/38 | 76/76 | 56 |

Every certification: **0 refused, longest run 9w** against a threshold of 10.
Marker parity 0 of 243. Address parity 0 of 104. Modal inflation **1**, and that
1 is the known false positive. 479 lesson groups coherent.

---

## 5. What is waiting, and what it costs

1. **Run 337**, then deploy `courseware-read`, then the web Worker to twelve.
   338 has run. The order is not interchangeable and 338 already aborts if 337
   has not run.
2. **Surface `mcp.task.ksa_withheld`** in `courseware-read` so a partner can tell
   a withheld KSA from an absent one. Deliberately not bundled with the 337
   deploy — two differently-ordered dependencies in one file is how one of them
   lands at the wrong time.
3. **The bilingual read.** 208 rows are withheld waiting for it. Nothing
   mechanical substitutes, and §6 now says exactly which third of the problem it
   is.
4. **`is/are (not) to be`** on the English strong list, with its own measurement.
5. **`convém` is zero** across both auditor certifications' Portuguese against
   382 and 223 uses of `deve/devem`. A register decision, not a defect —
   `deveria` carries `should` there instead.

---

## 6. What to distrust in this document

§4 was read from the live rows at the end of the session. Everything else is a
count I took while working.

Three numbers in this arc were wrong because a tool answered a different question
than the one asked: a 1000-row page cap read as a total, a per-line run count
read as the gate's per-segment count, and a missing designation reported for a
quotation whose designation was present. **All three were caught by an assertion.
None was caught by re-reading.**

```
node --dns-result-order=ipv4first scripts/scan-iso-leaks.mjs
node --dns-result-order=ipv4first scripts/check-attribution-parity.mjs
node --dns-result-order=ipv4first scripts/measure-ksa-provisional.mjs
node --dns-result-order=ipv4first scripts/triage-held-paragraphs.mjs
node --dns-result-order=ipv4first scripts/sweep-modal-inflation.mjs
```

Read-only without `--apply`. Each carries a control that must fail if the
instrument is broken — which is the only reason any number above is worth
reading.
