# The two OCR'd standards are not loadable as staged, and here is what is wrong with them

Measured 2026-09-27. **Nothing was loaded.** ISO/IEC 38507:2022 and ISO/IEC 23894:2023 are scanned
documents; the OCR ran and the text files are in `sources/incoming/ocr/`. Three things stop the load,
two of them measured in the files themselves and one about when it is safe to widen the index.

---

## 1 — The `Al` to `AI` correction covered the contents list and not the body

The rule is that OCR renders `AI` as `Al` (capital A, lowercase L) and that the standalone token is
replaced, with the replacements counted. Counted:

| | standalone `Al` | standalone `AI` |
|---|---|---|
| ISO 38507, `-tesseract.txt` | 295 | 2 |
| ISO 38507, `-corrected.txt` | **266** | 36 |
| ISO/IEC 23894, `-tesseract.txt` | 252 | 11 |
| ISO/IEC 23894, `-corrected.txt` | **205** | 58 |

**34 and 47 replacements happened, all of them in the retyped contents list.** The bodies still carry
266 and 205 standalone `Al`, and they are genuine AI tokens — read, not assumed:

```
of Al within      any Al system     For Al concepts     However, Al has
of Al systems     to Al is          of Al risk          an Al system
```

**Why this is not cosmetic.** Every gate that anchors an item quotes the source VERBATIM. Our items
say `AI`; a library passage saying `Al` does not contain that string, so `gateVerbatim` would refuse
a correct anchor and the refusal would name the item. An OCR artifact would arrive as an item defect,
on the one document whose whole subject is AI governance.

---

## 2 — The retyped contents list defeats the contents-decoy defence, and 3 addresses would get junk

`-corrected.txt` does not contain a mechanically corrected contents page. It contains a **hand-retyped
one**: the OCR garble

```
3 Terms ANA AeFIMTLIONIS ...............c.cooorssorssrssssesssss sss sss sss sass 1
4.2 Maintaining governance when introducing Al...
```

was replaced with clean lines — `3 Terms and definitions 1`, `4.2 Maintaining governance when
introducing AI 3`. **The dot leaders went with it.**

Every locator in this repository defends against the table-of-contents decoy, and
`isContentsLine` keys on `\.{4,}\s*\d+\s*$` — dot leaders. A typed contents entry with no leaders is
indistinguishable from a real body heading. The last-occurrence rule is the remaining defence, and it
only works where a later occurrence exists. Measured:

| | clause numbers in the contents block | also later in the body | **only in the contents block** |
|---|---|---|---|
| ISO 38507 | 33 | 30 | **3** |
| ISO/IEC 23894 | 39 | 38 | 1 |

ISO 38507's three are **3.1 Terms related to AI, 3.2 Terms related to governance, and 4.1 General** —
real addresses. Each would resolve to its contents entry, and its "body" would be the next contents
line. **A junk passage at a real address is worse than a missing one**, because the coverage report
then says the address is held. That is the `A.4.6` and `7.4` defect this repository has already paid
for twice.

23894's one orphan is `11 © ISO/IEC 2023 - All rights reserved`, a page footer, not a clause.

**And the typed list must not become the declared population.** `check-library-completeness` derives a
declared population from a document's own contents list. Deriving it from text I typed by reading the
same OCR is circular: it would check the extraction against my transcription rather than against the
standard, and a title I mistyped would show as a gap in the document.

> These two belong in **NO DECLARED POPULATION**, beside NIST, the EBM Guide and ITIL — a third state
> rather than a derived count. A scanned document has no machine-readable contents list, and saying so
> is a smaller claim than a coverage figure and a true one.

---

## 3 — Widening the index tonight would make tonight's leak measurement unattributable

`LEAK-REWRITES-DRAFT.md` was scored an hour ago against a 15-document index, and
`INDEX-WIDENING-DELTA.json` measures the last widening as a re-calibration with a baseline derived
from what the index held before it.

Adding two sources moves that index. The 11 drafts would have to be re-scored, and a draft that
cleared tonight could fire tomorrow against a document nobody had loaded when it was written — which
is not a defect in the draft and would read as one. This repository's own rule is that an
instrument's error modes are a function of its input size, so **adding a source is re-measured, not
configured**, and it deserves its own delta rather than a tail-end push.

---

## What it would take, and none of it is hard

1. **A correction script**, `--apply` and dry by default, reading `-tesseract.txt` and writing
   `-corrected.txt`: standalone `Al` to `AI` by word boundary, replacements COUNTED and printed, plus
   whatever other OCR substitutions are declared BY NAME. The count is then reproducible, which it is
   not today — there is no script, so nobody can say how the present files were made.
2. **A front-matter boundary for text sources**, asserting the body starts at clause 1, applied ONLY
   to sources carrying a `textPath`. That is the mechanism `splitIsoBs` already gives the BS
   adoptions, and scoping it to text sources leaves the 15 existing ones untouched.
3. **`provenance: "ocr"` on every passage from these two**, and the read list: any item that anchors
   in an OCR'd passage is read by a human, because a verbatim gate against OCR'd text is checking our
   sentence against a transcription rather than against the standard.
4. **Tables are not anchorable here.** OCR does not preserve column boundaries, so the annex-table
   splitter cannot run; table content from these two is excluded rather than guessed at.
5. **The missing page.** ISO 38507's scan is short one page and that page must be named in the
   manifest, so a gap in the library is a recorded fact rather than a silent absence. *(Not yet
   identified — the page number was never written down, and a plausible one is worth less than a
   blank.)*

Item 7, the ISO/IEC 42005 DIS, is untouched and unblocked by any of this: it is a text-layer PDF in
`sources/incoming/draft/`, and its contents-line fix is scoped to that document.
