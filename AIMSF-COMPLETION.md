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
| 1.2 | 8 | 7 | 1 | 1 | **2** |  |  |  | **2** | no, short 6 |
| 1.3 | 8 | 11 | 1 | 3 | **4** | 3 |  |  | **7** | no, short 1 |
| 1.4 | 8 | 11 | 2 | 6 | **8** |  |  |  | **8** | **already** |
| 1.5 | 8 | 12 | 2 | 5 | **7** |  |  |  | **7** | no, short 1 |
| 1.6 | 8 | 12 | 3 | 0 | **3** | 4 |  |  | **7** | no, short 1 |
| 2.1 | 6 | 3 | 1 | 1 | **2** |  |  | 4 | **6** | **yes, on approval** |
| 2.2 | 8 | 5 | 1 | 1 | **2** |  | 5 |  | **7** | no, short 1 |
| 2.3 | 8 | 8 | 5 | 0 | **5** | 3 |  |  | **8** | **yes, on approval** |
| 2.4 | 8 | 5 | 2 | 1 | **3** |  | 3 |  | **6** | no, short 2 |
| 2.5 | 8 | 20 | 3 | 1 | **4** | 2 |  |  | **6** | no, short 2 |
| 2.6 | 8 | 7 | 1 | 2 | **3** | 5 |  |  | **8** | **yes, on approval** |
| 2.7 | 8 | 6 | 1 | 1 | **2** |  | 5 |  | **7** | no, short 1 |
| 2.8 | 8 | 5 | 1 | 1 | **2** |  | 5 |  | **7** | no, short 1 |
| 3.1 | 8 | 8 | 1 | 1 | **2** |  | 4 |  | **6** | no, short 2 |
| 3.2 | 8 | 5 | 3 | 1 | **4** |  | 4 |  | **8** | **yes, on approval** |
| 3.3 | 8 | 17 | 3 | 1 | **4** | 4 |  |  | **8** | **yes, on approval** |
| 3.4 | 8 | 5 | 1 | 1 | **2** |  | 4 |  | **6** | no, short 2 |
| 3.5 | 8 | 9 | 1 | 1 | **2** | 6 |  |  | **8** | **yes, on approval** |
| 3.6 | 8 | 11 | 2 | 1 | **3** | 5 |  |  | **8** | **yes, on approval** |
| 3.7 | 8 | 10 | 2 | 1 | **3** | 4 |  |  | **7** | no, short 1 |
| 3.8 | 8 | 4 | 4 | 1 | **5** | 3 |  |  | **8** | **yes, on approval** |
| 4.1 | 8 | 4 | 4 | 2 | **6** | 1 |  |  | **7** | no, short 1 |
| 4.2 | 6 | 3 | 2 | 1 | **3** |  |  | 2 | **5** | no, short 1 |
| 4.3 | 8 | 10 | 5 | 2 | **7** |  |  |  | **7** | no, short 1 |
| 4.4 | 8 | 13 | 3 | 1 | **4** | 1 |  |  | **5** | no, short 3 |
| 4.5 | 8 | 9 | 4 | 1 | **5** |  |  |  | **5** | no, short 3 |
| 4.6 | 8 | 8 | 4 | 2 | **6** | 1 |  |  | **7** | no, short 1 |
| 4.7 | 8 | 6 | 1 | 0 | **1** | 4 |  |  | **5** | no, short 3 |
| 5.1 | 8 | 5 | 2 | 1 | **3** |  | 4 |  | **7** | no, short 1 |
| 5.2 | 6 | 3 | 2 | 2 | **4** |  |  | 2 | **6** | **yes, on approval** |
| 5.3 | 8 | 4 | 4 | 1 | **5** |  | 2 |  | **7** | no, short 1 |
| 5.4 | 6 | 3 | 2 | 0 | **2** |  |  | 3 | **5** | no, short 1 |
| 5.5 | 8 | 34 | 3 | 0 | **3** | 2 |  |  | **5** | no, short 3 |
| 5.6 | 8 | 10 | 3 | 0 | **3** | 5 |  |  | **8** | **yes, on approval** |

## The line you asked for

**At their floor once you approve what is waiting: 12 of 35 tasks.**

- **already at floor, no approval needed (2)**: 1.1, 1.4
- **reach it on approval (10)**: 2.1 (2 -> 6 against 6), 2.3 (5 -> 8 against 8), 2.6 (3 -> 8 against 8), 3.2 (4 -> 8 against 8), 3.3 (4 -> 8 against 8), 3.5 (2 -> 8 against 8), 3.6 (3 -> 8 against 8), 3.8 (5 -> 8 against 8), 5.2 (4 -> 6 against 6), 5.6 (3 -> 8 against 8)
- **still short after approval (23)**: 1.2 (2 of 8, short 6), 1.3 (7 of 8, short 1), 1.5 (7 of 8, short 1), 1.6 (7 of 8, short 1), 2.2 (7 of 8, short 1), 2.4 (6 of 8, short 2), 2.5 (6 of 8, short 2), 2.7 (7 of 8, short 1), 2.8 (7 of 8, short 1), 3.1 (6 of 8, short 2), 3.4 (6 of 8, short 2), 3.7 (7 of 8, short 1), 4.1 (7 of 8, short 1), 4.2 (5 of 6, short 1), 4.3 (7 of 8, short 1), 4.4 (5 of 8, short 3), 4.5 (5 of 8, short 3), 4.6 (7 of 8, short 1), 4.7 (5 of 8, short 3), 5.1 (7 of 8, short 1), 5.3 (7 of 8, short 1), 5.4 (5 of 6, short 1), 5.5 (5 of 8, short 3)

**78 kept item(s) are over the anchor cap** and are excluded from `kept` above. They
are real, reviewed items; they are simply not available to a floor that counts 2 per
(source, clause). They were reported and not dropped, per PROMPT-87.
