# What a grounded item costs, and what refilling versus checking would cost

Measured 2026-09-28 from the pilot artifacts. **The unit is MODEL CALLS, not currency** — see the gap
below.

---

## The gap: token usage was never recorded, so cost per item is UNAVAILABLE

`gen-grounded-items` records no `usage`, no token counts and no cost on any item, in any of the five
pilot artifacts. So a figure in currency cannot be derived from the logs; it could only be invented.

What the artifacts *do* support exactly is the number of calls, because every call leaves a verdict
behind — a writer output, a solver state, a probe state. That is what this report counts.

> **The fix is one line per call site**: record `response.usage` on the record. Until that exists,
> multiply the call counts below by your own rate. An estimate that looks like money and is built on a
> guessed token count is worse than a call count, because nobody can check it.

---

## Measured: 6.2 model calls per surviving item

Pilot 4, the most complete run — 40 attempted, **29 survivors**:

| stage | calls |
|---|---|
| writer | 40 |
| paraphrase retry (reproduction only) | 10 |
| blind solver | 29 |
| options probe | 29 |
| de-cue writer | 24 |
| de-cue's own solver and probe | 48 |
| **total** | **180** |
| | |
| **per surviving item** | **6.2** |

### Under the new rules that figure falls to about 5.0

The de-cue now triggers only on a code cue from the trigger set, and the probe triggers nothing. Over
the same 24 items, **12 carried a trigger-set cue** rather than 24, so the de-cue arm halves: 36 fewer
calls, 144 total, **5.0 calls per surviving item**.

That is a real saving and it is a side effect rather than the point: the rule changed because
probe-triggered rewrites were not improvements, and costing less is what happens when you stop doing
work that did not help.

---

## The comparison asked for, and the answer is not close

### Refilling each ISO certification's secure floor — 8 per task, English only

Measured against the live bank, per `ISO-TASK-COVERAGE.md`:

| certification | tasks | live secure EN | task-slots short of 8 |
|---|---|---|---|
| ISMS-F | 49 | 391 | **1** |
| ISMS-IA | 38 | 304 | **0** |
| AIMS-F | 35 | 278 | **2** |
| AIMS-IA | 40 | 320 | **0** |
| **total** | **162** | **1,293** | **3** |

**The floors are already met, on 159 of 162 tasks.** Refilling them is **3 items ≈ 15 model calls.**

### A check-only pass over the existing secure English items

Anchor-or-flag is one writer call per item, plus the blind solver where a second signal is wanted:

| | calls |
|---|---|
| anchor-or-flag over 1,293 items | 1,293 |
| with the blind solver as a second signal | 2,586 |

### So

```
refill the floors        ~15 calls
check what already exists  1,293 - 2,586 calls
```

**Roughly a hundredfold difference, and the cheap option is the one that produces nothing new.** The
banks are full; what is unknown is whether the items in them are right. The director's own read of 40
AIMS-F items found 14 problems, and `EN-DEFECTS-SAMPLE.md` confirms the rate independently at 34 of 118
sampled items — so a check-only pass over 1,293 items is where the spend belongs.

---

## And cost is not the binding constraint anyway

**127 of the 162 ISO tasks have ZERO linked source passages.** Only AIMS-F is linked, all 35 tasks.

| certification | tasks | linked | ZERO |
|---|---|---|---|
| ISMS-F | 49 | 0 | **49** |
| ISMS-IA | 38 | 0 | **38** |
| AIMS-F | 35 | **35** | 0 |
| AIMS-IA | 40 | 0 | **40** |

The grounded generator anchors a key in a task's PRIMARY passages and refuses an item it cannot anchor,
so on three of the four ISO certifications it would refuse everything it was asked for, at full writer
cost per refusal. **Generation on ISMS-F, ISMS-IA and AIMS-IA is blocked by the task map, not by
budget**, and `task_sources` linking is the prerequisite for any of it.

That is the whole reason the coverage report was ruled to go first.
