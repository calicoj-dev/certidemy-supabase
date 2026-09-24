# Every threshold that excludes by size, and what could sit below it

**A threshold chosen to reduce noise is a claim that nothing important lies below it.**
That claim is measured or it is a guess.

Occasion: the missing-accent detector skipped tokens under four characters, which made
`não` — 1,110 occurrences, the most common accented word in Portuguese — **unreachable
by construction**, and it sat in the same sentence as a defect the detector did report.

Columns: what the threshold is, what could sit below it, and **whether anyone has
looked**. One line each. No changes.

---

| # | threshold | where | what could sit below it | looked? |
|---|---|---|---|---|
| 1 | **`SEED = 4`** | `leak-score.mjs` | a 3-word reproduction. Nothing: three words of technical English is ordinary collision, and the seed only *finds* candidates now that extension is by position | **yes** — seed 4 and 5 give identical verdicts since the position fix |
| 2 | **`ABS_RUN = 10`** | the leak floor | 9-word runs, unlimited in number | **yes** — full distribution measured, no cliff at 9; 134 lesson and 15 concept runs sit at 9w |
| 3 | **`MIN_RUN = 4` / `MIN_COV = 0.60`** | the ratio arm | a 3-word span at coverage 1.00 — a three-word description that is entirely ISO's | **no.** The floor moved 6→4 when `risk-identification` (5w, coverage 1.00) slipped through; nobody asked what 3 hides |
| 4 | **`SRC_GAP_MAX = 3`** | union merge | a reproduction with 4+ words omitted mid-span | **partly** — 3 of 6 candidate merges were rejected by it and read; the >3 side was never enumerated |
| 5 | **`DESC_GAP_MAX = 0`** | union merge | two runs separated by one word of ours | **no.** Deliberately strict to avoid manufacturing adjacency, never measured |
| 6 | **`QUOTATION_CEILING = 25`** | `iso-segments.mjs` | attributed quotations of 10–25 words, unlimited in number and unsummed | **partly** — the distribution was measured (10 at 10w, 50 at 11+) but the AGGREGATE below the ceiling is exactly the sum nothing counts |
| 7 | **`>= 3 rows AND >= 8w`** | repetition report | a 7-word phrase in 20 rows; a 9-word phrase in 2 rows | **yes** — derived from the members at 2/3/4 rows and 6/7/8w, with the term-of-art rate as the reason |
| 8 | **near-floor band `8w–9w`** | repetition scan | repeated 6–7w runs | **yes** — measured at 6w: 839 distinct, 204 repeated; the band was chosen from that |
| 9 | **`tok.length < 4`** | missing-accent detector | **`não`, `são`, `até`, `têm`, `vêm`, `nós`** | **THIS IS THE OCCASION.** Lowered to 3; it found a real defect and three both-correct classes |
| 10 | **`terms.length >= 2`** | `courseware-query` search | single-character queries | **no**, and it does not matter: a 1-char regex matches most rows and the result would be useless |
| 11 | **`.slice(0, N)` in reports** | many | the tail of every ranked list | **mostly** — the JSON artifacts carry the full set and the console truncates; the enumeration is the artifact |
| 12 | **PostgREST page 500** | `allRows` helpers | nothing — the loop pages to a count assertion | **yes**, and the assertion is watched to fail (`_PG_TRUNCATE_AFTER_PAGES=1`) |
| 13 | **`limit: 50`** | wire matrix cells | rows 51+ of a cell | **no**, and it is sound: the cells assert a floor and transport, not completeness |
| 14 | **half the distinctive terms, floor 2** | contradiction sweep | a 2-term row sharing 1 term | **yes** — the floor-of-4 version could not see its own founding case; measured 50 → 3 candidates |
| 15 | **`length(word) >= 4`** | the accent *exposure* census | 3-letter accented words in the 751/1,008 vocabulary counts | **no.** The exposure figures are therefore a FLOOR, not a total |

---

## The two worth running once without the floor

**#3, `MIN_RUN = 4`.** The floor moved 6 → 4 the last time somebody looked, and the reason
was a five-word description that was entirely ISO's. The same argument applies at 3 and
nobody has made it. Running the concept gate at `MIN_RUN = 3` once would say whether any
three-word description is wholly reproduced — and if the answer is none, that is worth
knowing rather than assuming.

**#15, the exposure census floor.** 751 distinct accented words in es-419 and 1,008 in
pt-BR are reported as *the* exposure, and both exclude every word under four characters.
Given #9, the omitted set is known to contain the highest-frequency member. **Those two
figures should be restated as floors** or re-measured at 3.

## The rest

#5 and #13 are sound-by-design and say so. #1, #2, #7, #8, #12 and #14 have all been
measured against what they hide, several of them after being wrong once. #4 and #6 are
partly measured, and in both the unmeasured half is an aggregate rather than a member —
which is the shape that a per-span rule cannot see and nothing here sums.
