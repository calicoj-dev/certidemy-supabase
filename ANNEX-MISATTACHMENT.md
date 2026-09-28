# Annex control misattachment: the two-direction witness

`scripts/check-annex-misattachment.mjs`, read-only. Nothing was written.

## ISO/IEC 27001:2022 Annex A

Witness: **ISO/IEC 27002 2022 same number**. 27002 states each control at the same number with `should` for `shall`, so a correct statement matches it almost word for word.

| | |
|---|---|
| controls checked | 93 |
| OK | 93 |
| **MISATTACHED** | **0** |
| NO WITNESS (not scored, its own state) | 0 |

No control matches a neighbour better than itself.

**How much the clean result is worth:** 93 of 93 controls match their own witness at 6 or more words. 0 match at fewer, where the witness cannot confirm OR deny the attachment — for those the verdict is the absence of a better neighbour, not positive agreement.

## ISO/IEC 42001:2023 Annex A

Witness: **ISO/IEC 42001 2023 B.x.y** — the same document. Annex B restates each control as B.x.y, but as implementation GUIDANCE -- it elaborates rather than repeats, so a low run is weaker evidence here than against 27002.

| | |
|---|---|
| controls checked | 29 |
| OK | 29 |
| **MISATTACHED** | **0** |
| NO WITNESS (not scored, its own state) | 2 — A.6.1, A.6.2 |

No control matches a neighbour better than itself.

**How much the clean result is worth:** 29 of 29 controls match their own witness at 6 or more words. 0 match at fewer, where the witness cannot confirm OR deny the attachment — for those the verdict is the absence of a better neighbour, not positive agreement.

## Live exposure of anything flagged

Nothing flagged, so nothing to expose.

