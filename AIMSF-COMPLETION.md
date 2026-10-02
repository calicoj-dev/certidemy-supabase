# AIMS-F completion: every task, its floor, and where its secure items are

**Read-only. Nothing here is inserted.** Ruled PROMPT-94 s5.

The floor is `min(8, 2 x effective primaries)` -- derived, not typed, so a
task that gains a primary returns to 8 with no edit. The rule is in
TASK-FLOORS-AIMSF.json.

**The three counts are three different claims.** `kept` is authored items the survivor audit ruled keep,
counted only up to the cap of 2 per (source, clause). `inserted` is grounded items in the bank as
`pending_review`. `awaiting` is grounded survivors sitting in an artifact and NOT in the bank -- a claim
about what you could approve, never about what the bank holds. Folding the third into the second would
report a finished certification that does not exist.

| task | floor | eff | kept | inserted | **now** | b2 | R2 | R3 | **after approval** | at floor? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.1 | 8 | 5 | 3 | 5 | **8** |  |  |  | **8** | **already** |
| 1.2 | 8 | 7 | 2 | 7 | **9** |  |  |  | **9** | **already** |
| 1.3 | 8 | 11 | 1 | 7 | **8** |  |  |  | **8** | **already** |
| 1.4 | 8 | 11 | 2 | 6 | **8** |  |  |  | **8** | **already** |
| 1.5 | 8 | 12 | 2 | 7 | **9** |  |  |  | **9** | **already** |
| 1.6 | 8 | 12 | 3 | 6 | **9** |  |  |  | **9** | **already** |
| 2.1 | 6 | 3 | 2 | 5 | **7** |  |  |  | **7** | **already** |
| 2.2 | 8 | 5 | 2 | 7 | **9** |  |  |  | **9** | **already** |
| 2.3 | 8 | 8 | 5 | 3 | **8** |  |  |  | **8** | **already** |
| 2.4 | 8 | 5 | 3 | 6 | **9** |  |  |  | **9** | **already** |
| 2.5 | 8 | 20 | 4 | 7 | **11** |  |  |  | **11** | **already** |
| 2.6 | 8 | 7 | 2 | 7 | **9** |  |  |  | **9** | **already** |
| 2.7 | 8 | 6 | 2 | 7 | **9** |  |  |  | **9** | **already** |
| 2.8 | 8 | 5 | 2 | 8 | **10** |  |  |  | **10** | **already** |
| 3.1 | 8 | 8 | 2 | 10 | **12** |  |  |  | **12** | **already** |
| 3.2 | 8 | 5 | 4 | 5 | **9** |  |  |  | **9** | **already** |
| 3.3 | 8 | 17 | 4 | 5 | **9** |  |  |  | **9** | **already** |
| 3.4 | 8 | 5 | 2 | 8 | **10** |  |  |  | **10** | **already** |
| 3.5 | 8 | 9 | 2 | 7 | **9** |  |  |  | **9** | **already** |
| 3.6 | 8 | 11 | 2 | 6 | **8** |  |  |  | **8** | **already** |
| 3.7 | 8 | 10 | 2 | 7 | **9** |  |  |  | **9** | **already** |
| 3.8 | 8 | 4 | 5 | 4 | **9** |  |  |  | **9** | **already** |
| 4.1 | 7 | 4 | 4 | 3 | **7** |  |  |  | **7** | **already** |
| 4.2 | 6 | 3 | 3 | 4 | **7** |  |  |  | **7** | **already** |
| 4.3 | 8 | 9 | 5 | 3 | **8** |  |  |  | **8** | **already** |
| 4.4 | 8 | 13 | 3 | 5 | **8** |  |  |  | **8** | **already** |
| 4.5 | 8 | 9 | 4 | 4 | **8** |  |  |  | **8** | **already** |
| 4.6 | 8 | 8 | 5 | 5 | **10** |  |  |  | **10** | **already** |
| 4.7 | 8 | 6 | 1 | 9 | **10** |  |  |  | **10** | **already** |
| 5.1 | 8 | 5 | 3 | 7 | **10** |  |  |  | **10** | **already** |
| 5.2 | 6 | 3 | 3 | 4 | **7** |  |  |  | **7** | **already** |
| 5.3 | 8 | 4 | 5 | 4 | **9** |  |  |  | **9** | **already** |
| 5.4 | 6 | 3 | 2 | 4 | **6** |  |  |  | **6** | **already** |
| 5.5 | 6 | 34 | 3 | 3 | **6** |  |  |  | **6** | **already** |
| 5.6 | 8 | 10 | 3 | 5 | **8** |  |  |  | **8** | **already** |

## The line you asked for

**At their floor once you approve what is waiting: 35 of 35 tasks.**

- **already at floor, no approval needed (35)**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
- **reach it on approval (0)**: none
- **still short after approval (0)**: none

**59 kept item(s) are over the anchor cap** and are excluded from `kept` above. They
are real, reviewed items; they are simply not available to a floor that counts 2 per
(source, clause). They were reported and not dropped, per PROMPT-87.

---

## Floors over ACCEPTED items only

Ruled PROMPT-97 addendum s4. The table above counts what is inserted. This one counts only items
carrying `review_verdict = 'accept'` on their `item_grounding` row -- a human read them and
accepted them. **`read` is not counted**: migration 379 keeps the two apart because a read with
findings is not an acceptance.

- verdict `accept` recorded on **200** row(s)
- of the PROMPT-97 ruling's accepted set, **0** still carry no recorded verdict
  (migration 385 widened the vocabulary and the 46 were written on 2026-10-01, so this reads 0;
  it is non-zero only when a ruling outruns its recorder, which is exactly when you want to see it)

| task | floor | accepted | kept | accepted + kept | at floor? | on accepted alone? |
|---|---|---|---|---|---|---|
| 1.1 | 8 | 5 | 3 | 8 | yes | no |
| 1.2 | 8 | 7 | 2 | 9 | yes | no |
| 1.3 | 8 | 7 | 1 | 8 | yes | no |
| 1.4 | 8 | 6 | 2 | 8 | yes | no |
| 1.5 | 8 | 7 | 2 | 9 | yes | no |
| 1.6 | 8 | 6 | 3 | 9 | yes | no |
| 2.1 | 6 | 5 | 2 | 7 | yes | no |
| 2.2 | 8 | 7 | 2 | 9 | yes | no |
| 2.3 | 8 | 3 | 5 | 8 | yes | no |
| 2.4 | 8 | 6 | 3 | 9 | yes | no |
| 2.5 | 8 | 7 | 4 | 11 | yes | no |
| 2.6 | 8 | 7 | 2 | 9 | yes | no |
| 2.7 | 8 | 7 | 2 | 9 | yes | no |
| 2.8 | 8 | 8 | 2 | 10 | yes | yes |
| 3.1 | 8 | 10 | 2 | 12 | yes | yes |
| 3.2 | 8 | 5 | 4 | 9 | yes | no |
| 3.3 | 8 | 5 | 4 | 9 | yes | no |
| 3.4 | 8 | 8 | 2 | 10 | yes | yes |
| 3.5 | 8 | 7 | 2 | 9 | yes | no |
| 3.6 | 8 | 6 | 2 | 8 | yes | no |
| 3.7 | 8 | 7 | 2 | 9 | yes | no |
| 3.8 | 8 | 4 | 5 | 9 | yes | no |
| 4.1 | 7 | 3 | 4 | 7 | yes | no |
| 4.2 | 6 | 4 | 3 | 7 | yes | no |
| 4.3 | 8 | 3 | 5 | 8 | yes | no |
| 4.4 | 8 | 5 | 3 | 8 | yes | no |
| 4.5 | 8 | 4 | 4 | 8 | yes | no |
| 4.6 | 8 | 5 | 5 | 10 | yes | no |
| 4.7 | 8 | 9 | 1 | 10 | yes | yes |
| 5.1 | 8 | 7 | 3 | 10 | yes | no |
| 5.2 | 6 | 4 | 3 | 7 | yes | no |
| 5.3 | 8 | 4 | 5 | 9 | yes | no |
| 5.4 | 6 | 4 | 2 | 6 | yes | no |
| 5.5 | 6 | 3 | 3 | 6 | yes | no |
| 5.6 | 8 | 5 | 3 | 8 | yes | no |

**35 of 35 tasks are at their floor on REVIEWED items** -- 200 accepted grounded plus 102 kept authored.
On accepted grounded rows alone the figure is **4 of 35**.

`read` counts toward neither: see AIMSF-PILOT-READ.md for the 34 rows awaiting a verdict.

**Neither number says an item is servable.** A verdict is a record, never a gate:
`quiz_questions.status` is `pending_review` on every one of these rows and
`generate-mock-exam` filters `approved`.
