# AIMS-F: the path from a grounded draft to a served exam

**Ruled PROMPT-96 s6: tell me what is left, do not do it.** Nothing in this document has been done. Every
number comes from `scripts/measure-path-to-live.mjs` (read-only) or from `scripts/project-rollout-spend.mjs`,
so it can be regenerated rather than re-typed.

---

## 1. Where the bank stands, measured

```
grounded English rows in the bank        146
  by status          pending_review 146     <- not one approved row
  by pool            secure 146
  by visibility      secure 146
  is_exam_scope      true 114, false 32
  solver verdict recorded               146 of 146
```

Three insert batches, and the dates matter because the always-A defect was corrected between them:

| inserted | rows | key in position A | `is_exam_scope=false` |
|---|---|---|---|
| 2026-09-27 | 32 | 5 | **32** |
| 2026-09-29 | 17 | 4 | 0 |
| 2026-09-30 | 97 | 23 | 0 |

**KEY POSITION IS HEALTHY: A 32, B 42, C 39, D 33** across all 146. The always-A cluster is gone from every
batch, including the first.

> **AND THE TWO 32s ARE A COINCIDENCE, WHICH IS WORTH SAYING BECAUSE A REPORT CARRYING THE SAME NUMBER TWICE
> INVITES A FALSE INFERENCE.** 32 rows have their key in position A; 32 rows carry `is_exam_scope=false`;
> **only 5 rows are in both sets.** The 32 out-of-scope rows are the whole 2026-09-27 batch, whose own key
> spread is 5 of 32. Checked rather than assumed, because the natural reading -- *the always-A batch is the
> out-of-scope batch* -- is wrong and would have retired the wrong rows.

---

## 2. What each item needs before it can be approved

Four gates in order. **Only the first has a mechanism today.**

### 2a. The code gates and the solver -- DONE, recorded per item

13 code gates plus a blind solver, and `item_grounding.solver` carries the verdict the item was judged on for
all 146. `--reuse-solver` exists precisely so an insert does not overwrite that with a fresh judgement nobody
read.

**What they cannot do** is the honest half: anchoring cannot see a CONTESTED DISTRACTOR, and the director's
own read of 40 items found three such misses that anchored cleanly AND the solver accepted. Measured recall of
the strongest instrument was **7 of 14** of his findings, **5 of the 9 that are a named defect in the key**.
The gates reduce the read; they do not replace it.

### 2b. A director read -- RECORDED PER ROW since migration 379. 34 of 146 read.

```
review_verdict   read 34, unread 112     reviewed_by  director     on  2026-09-27, 2026-09-29
```

`item_grounding` carries `reviewed_by`, `reviewed_at`, `review_verdict` and `review_note`, added by **migration
379 on 2026-09-27**, with a closed verdict vocabulary (`read | tier_a | tier_b | tier_c`) and a CHECK that a
verdict cannot exist without a reviewer and a date. The verdict is a record and never a gate: 379's own header
says so, and `quiz_questions.status` remains what decides what may be served.

> **[CORRECTED 2026-09-30. THE TEXT BELOW THIS BANNER IS WHAT THIS SECTION SAID, AND IT WAS FALSE WHEN
> WRITTEN, NOT STALE.]** It read *"no mechanism records the outcome"* and called that the binding constraint,
> then argued at length that the unread count was UNKNOWN. Migration 379 had been applied three days earlier
> and 34 rows already carried a read.
>
> **The two failures are different and only one of them is ordinary.** Everything else this repository guards
> against is DECAY -- a sentence true when written that rotted. This one was wrong on arrival, so nothing about
> it ever looked stale and no re-read asking *is this still true* could catch it.
>
> It was produced by `measure-path-to-live.mjs` selecting `solver` from `item_grounding` and not the review
> columns beside it. **An empty result is a fact about the probe until something proves the probe could have
> found it** -- committed by the probe written to replace a prose claim, which is this file's own thesis
> arriving one level down. The select now names them.
>
> And the sharper part: I ALSO wrote *"I started to write 40 read, 106 unread and that is the inference this
> section says is unavailable"* -- congratulating the document for a rigour it did not have. **A correction
> written into a false claim makes it read as carefully established.** The real answer, 34 and 112, was one
> query away the whole time.

**The superseded text, preserved:** *"HOW MANY OF THE 146 HAVE BEEN READ IS NOT DERIVABLE FROM ANYTHING ON
DISK... Nothing records "a human read this item and accepted it" as a property of the row... so the unread
count is UNKNOWN rather than large."* Every sentence of that is false. The three artifacts it named
(`AUDIT-FINDINGS-480.md`, `DIRECTOR-RULINGS-AIMSF.json`, `AIMSF-DIRECTOR-REJECTIONS.json`) do carry the reads
it described, and they are a SECOND copy of what the rows now hold.

**What is actually left here:** 112 rows unread, and the verdict vocabulary has no `accept` or `reject` -- so
the director's PROMPT-97-addendum verdicts need it widened before they can be recorded. That is the live gap,
and it is much smaller than the one this section claimed.

> **A ROW CANNOT TODAY DISTINGUISH READ-AND-ACCEPTED FROM NEVER-READ.** Both are `pending_review`. That is the
> same shape as `description_is_fallback` rendering two withholding reasons identically, and it is the one gap
> that makes the approval step unsafe to automate: a bulk promotion would promote the unread with the read and
> nothing afterwards could tell them apart.

### 2c. Translation to es-419 and pt-BR -- NO PATH ON THE GROUNDED GENERATOR

```
grounded rows with no question_group_id at all     146
grounded rows fully trilingual                       0
```

`gen-grounded-items.mjs` writes `language: "en"` and **no `question_group_id`**. `gen-cert-secure.mjs` has a
translation step, welded into that generator and reached through `lib/item-translation.mjs`; the grounded path
has never called it.

**A CONSEQUENCE OF THIS WEEK'S OWN FIX, WHICH IS CORRECT AND STILL A GAP.** The PROMPT-96 s1 repair to
`get-review-batch` resolves the served language through the sibling via `question_group_id` and **skips and
logs rather than falling back to English**. So a grounded item with no group is not served in the wrong
language to a Spanish learner -- it is invisible to them. Fail-closed, as ruled, and it means **the Spanish
and Portuguese practice surfaces gain nothing from these 146 items until the translation lands.**

### 2d. A translation read -- the ladder this repository already paid for

Three defect classes the guards cannot see, in increasing difficulty: wrong language (now caught), wrong
object (a false friend -- caught only by name, one term at a time), and **inserted obligation** (a periodicity
word the English does not carry, which changes what the item TESTS). The third is why a translated item needs a
bilingual read and not only a lint pass, and why `lint-translation-terms.mjs` passing is not a clearance.

---

## 3. How many items, and what the spend is

### Generation -- MEASURED

```
shortfall before this run        43 items across 23 tasks
reachable by generation          38          <- what the anchor assignment will carry
unreachable                       5          <- 1.2 by 2, 5.5 by 3
measured unit cost            $0.32 per item generated   (from AIMSF-R5-PROBE.json, 4 items, $1.28)
projection                   $12.15 of a $20.00 ceiling, $7.85 spare
```

**THE 5 UNREACHABLE ITEMS ARE NOT A CHEAPER RUN.** `check-floor-vs-anchorable.mjs` says which kind each is,
and they are different kinds:

| task | why | the decision |
|---|---|---|
| 1.2 | 7 effective primaries across sources, **3 in ISO/IEC 42001**; capacity 4 against an ask of 6 | a MAP change, or accept 4 |
| 5.5 | 34 effective primaries across sources, **1 in ISO/IEC 42001**. Its other 35 are ISO/IEC 17021-1 (22) and 42006 (13) | a FLOOR change, or make those sources anchorable |

> **AND THIS CORRECTS MY OWN R4 DIAGNOSIS.** I reported 5.5's four items clustering on clause 3.4 as the
> writer choosing the most salient passage repeatedly, and section 2 of this prompt was ruled on that premise.
> **5.5 has exactly one anchorable clause in the standard the run reads. There was nowhere else to go.** The
> assignment is still right and still does real work -- it moved 1.2 from 1 distinct anchor in 4 items to 2,
> and it refuses to spend a writer call on an item the cap would reject -- but for 5.5 it cannot help, because
> the constraint was never the writer.

### Translation -- NOT MEASURED, and deliberately left blank

**Volume, measured:** the 146 grounded items carry **138,170 characters of served text**, mean 946 per item.
Two target languages, so roughly 276,000 characters of output plus the same again read as input.

**No dollar figure, and that is the finding.** Two things are unknown and neither can be guessed responsibly:

1. **tokens per character for this content.** The only measured ratio available is the writer's, and it is
   useless here: 7,863 output tokens for 9,851 characters of item JSON, because that figure includes the
   writer's reasoning and its grounding fields. Applying it to a translator would overstate the bill several
   times over.
2. **the batching grain.** `gen-cert-secure` translates a whole task's items in one call; per item it would be
   dearer. Nothing has measured either for this content.

> **The cheap experiment that settles it: translate ONE task's items, record the spend, project.** That is
> exactly the method the $20 generation ceiling was measured by, and it costs one call. An unmeasured number
> left blank is worth more than a plausible one -- this repository has a recorded instance of a plausible
> figure being quoted back as evidence.

---

## 4. The approval mechanism

**IT DOES NOT EXIST.** Searched every `scripts/*.mjs` that writes to `quiz_questions`:

```
scripts that set an item's status to 'approved'      0
```

The generator writes `status='draft'` under `--apply`; the audit inserts wrote `pending_review`.
`generate-mock-exam` filters `status='approved'`, read from its source rather than assumed -- **so nothing
grounded can reach any form today.** That is the gate working exactly as designed, and it is also the missing
step: there is no route from a read item to a served one.

### What such a script would have to assert, and why each

Written here as a specification rather than as code, because s6 says report:

| it must assert | because |
|---|---|
| the item is named explicitly, by content id | a bulk promotion by task or by date promotes the unread with the read, and section 2b says nothing on the row distinguishes them |
| `item_grounding` has a row, with a solver verdict | an ungrounded item promoted through this path would carry the grounded pool's guarantees and none of its evidence |
| **the code gates re-run and pass, now** | the library moves. 37 Annex A passages were de-columned and twelve anchors re-cut since the first batch was written; an item approved against last week's library is approved against a document that changed |
| the item is not in `AIMSF-DIRECTOR-REJECTIONS.json` | a rejection is the one disposition no artifact carries, so the promotion path must read the standing list |
| `status`, `visibility`, `pool` and `is_exam_scope` are NAMED in the write, and the row is read back | the standing rule, every prompt |
| **the reverse direction** | assert that the rows it did NOT name are still `pending_review`. A promotion that also promoted a neighbour would pass every positive check |

And one thing it must **not** do: re-run the solver. `item_grounding.solver` is the verdict the item was
approved on; replacing it at promotion is the re-stamping-a-hash defect.

---

## 5. Post-approval checks, and the one that can only run afterwards

### 5a. Key position -- runnable now, and clean

`A 32, B 42, C 39, D 33` over 146. Re-measure on the approved subset, because a subset of a balanced pool is
not balanced: the check belongs on whatever is actually promoted, not on the pool it came from.

### 5b. Enemy feasibility on the approved pool -- CAN ONLY RUN AFTER APPROVAL

`check-enemy-feasibility.mjs` asks whether a form can still be assembled once enemy items -- pairs sharing an
`enemy_key`, or an option text over the 40-character floor -- are excluded. It was measured feasible on the
pool as it stands. **That result does not carry to the approved pool**, because the approved pool is a
different set of rows: exclusions that were absorbed by a large pool can become binding in a smaller one.

This is the check that has to run between approval and the first served form, and it is the one whose failure
mode is an exam that cannot be built.

### 5c. The served-noise sweep -- runnable now

Every survivor already asserts `longest served run <= 9` against the nine-document leak index, and R5's probe
measured max 5. Re-run over the approved set, for the same reason as 5a, and against the library as it stands
rather than as it stood.

### 5d. The 32 rows with `is_exam_scope=false` -- a decision, not a check

They are the 2026-09-27 batch and the default was false deliberately. They are in the secure pool with secure
visibility, so no form can contain them and no practice surface can either. **Either they are promoted with
the flag set, or they are not exam items and should say so.** Leaving them as they are is the third option and
it is the one nobody chose.

---

## 6. The order, and the two things that block everything after them

```
1  finish the R5 top-up                          DONE. 28 survivors of 38 at $15.56
2  decide 1.2 and 5.5                            a MAP or FLOOR ruling; generation cannot help
3  read the remaining 112                        34 of 146 read, recorded per row by migration 379
4  build the promotion script                    does not exist                    <- BLOCKER
5  measure translation on one task               one call, then project
6  translate, group, read the translations
7  enemy feasibility on the approved pool        only meaningful after step 4
8  key position and served-noise on that pool
```

Steps 3 and 4 are the only two that nothing in this repository can currently do, and they are the two that
everything after them waits on. **Step 5 is cheap and answers the question everyone will ask first**, which is
why it is worth doing before step 6 rather than during it.

---

## What this document cannot tell you

- **whether a read item is correct.** 112 of 146 are unread, which IS known (section 2b). What a read cannot
  be replaced by is the gates: the measured recall of the strongest one is 7 of 14 against the director's own
  findings, and 5 of the 9 that are a named defect in the key.
- **the translation bill.** Section 3 says why, and names the one call that would settle it.
- **whether the approved pool assembles a form.** Only 5b can answer that, and only after step 4.
- **anything about the other eleven certifications.** Every figure here is AIMS-F.
