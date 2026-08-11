# HANDOFF v6.5 — the Level II item pipeline

**Session date:** 2026-08-10/11, continues v6.4 and its addendum.
**Migration tip:** **198** · next free **199**
**Supabase:** `91de93e` · `69884b2` · `2c224a0` (+ the normalize commit)
**Read with:** v6.4 §9 for why Stage 9 was a build, v6.4-addendum for the seven
new invariants.

> **ISMS-IA task 1.2 has 8 secure items across 3 languages. Task 5.3 has 7.**
> The pipeline now produces Level II items at a workable rate. 36 tasks remain.

---

## 1. WHAT A LEVEL II ITEM IS, AND WHAT IT COST TO GET ONE

The contract, now in `L2_CONTRACT` in `lib/item-pipeline.mjs`:

> Four options, ALL defensible. One is best. The best must beat the second-best
> for a reason a competent practitioner could state in ONE SENTENCE — if you
> cannot write that sentence, the item is a coin flip. The second-best must be
> **genuinely defensible, not merely wrong**: an item whose second choice is
> incorrect is a Level I item in the wrong bank.

Three lines in the existing pipeline actively forbade this and had to branch:

| Stage | L1 rule | Why it breaks L2 |
|---|---|---|
| draft | *"Exactly ONE defensibly correct answer"* | the contract's opposite |
| critique | *"tighten so exactly one is defensible"* | would repair every correct item into an L1 item |
| normalize | *"the correct answer is NOT the longest"* | strips the qualifying clause that makes it best |

**The gate is `tier >= 2 AND bloom_level = '4_analyze'`.** Both conditions.

Tier alone was too broad: 13 of ISMS-IA's 38 tasks sit at apply or understand,
and there four-defensible is dishonest. Task 5.3 — *"select the nonconformity
statement that correctly links evidence to requirement"* — has one right answer
by construction; its wrong options prescribe a remedy or attribute intent, which
are real auditor errors and excellent distractors but **not defensible calls**.

Bloom alone was too broad the other way: nine tier-1 certs hold 37 analyze tasks
between them, and switching their contract would leave their banks internally
inconsistent. Whether they *should* move is a real question and a deliberate
catalogue-wide regeneration, not a side effect.

---

## 2. THE YIELD PROBLEM, AND HOW IT WAS ACTUALLY FOUND

Six live runs on task 1.2 produced five items. The logs said `no valid drafts`
fifteen times and `drop (cue)` once — so it was neither the hostile critique nor
the cue guard, which is where I looked first.

**I guessed three times and was wrong three times.** The answer came from adding
one log line that printed what the model returned and why each draft failed.

What it showed:

- **`diff=undefined` on ~9 of 22 rejects.** Sound items — options at 38, 40, 42
  words, well inside the ceiling — discarded because the model omitted an
  optional metadata field. Difficulty now defaults to 3 rather than rejecting.
  Out-of-*range* difficulty still rejects: that is the model asserting something
  wrong rather than omitting something.
- **The rest were one option over the ceiling by 1–4 words.** Whole items gone,
  three good distractors with each.

### The structural finding

**The pipeline had two length checks with opposite consequences.**

```
character-based cue guard (stage 4) -> fails -> normalizeOptions -> repaired
word-based ceiling (stages 2 and 3) -> fails -> DISCARDED, silently
```

`normalizeOptions` exists precisely to shorten over-long options while preserving
meaning. **It sat downstream of the gate that made it necessary**, reachable only
from the cue-guard branch. And the same gate runs again after critique, so an item
the hostile reviewer had just *repaired* was discarded when its rewrite landed a
word over — the reviewer is explicitly told to rewrite inside the ceiling, and its
work was thrown away when it narrowly missed.

`validationFault()` now names the fault; `keepOrRepair()` routes **only**
`option-length` to the repair. Everything else — wrong option count, unresolvable
key, bad type, out-of-range difficulty, over-length *stem* — still rejects
outright, because `normalizeOptions` repairs none of them and leaves the stem
alone by design.

### And the repair did not know what it was repairing toward

Routing alone gave `repair failed` four times in five. `normalizeSystem` asked
for options *"closely matched in length and depth"* — a **relative** instruction,
correct for its original job — so given 46/44/43/41 against a 45 ceiling it
returned 44/44/43/43 and stayed over. Stating the hard number, with an explicit
cutting order (hedges first, reasoning last), took the repair rate from **1 of 5
to 6 of 8** — and it fixed the L1 path too, so every future backfill on any cert
benefits.

> **ROUTE, DON'T RAISE.** At a 25-word ceiling the model wrote 22–28 word
> options; at 45 it writes 35–63. It writes to whatever ceiling it is given and
> overshoots by roughly the same proportion, so raising the number just moves the
> cliff. The ceiling is worth keeping for the QUALITY it buys — options now carry
> reasoning instead of being truncated — but it should never have been expected
> to fix yield.

---

## 3. THE SOURCE DATA WAS WRONG, AND THE GENERATOR WAS OBEYING IT

The first analyze run produced a key reading *"Risk-based approach governs: ISO
19011 **requires** risk to substantively influence audit effort."* Two faults in
one sentence, both forbidden by the grounding. **The model was right to write
it** — three rows more specific than the grounding told it to:

| Row | Said | Verified against ISO 19011:2026 |
|---|---|---|
| task 1.2 statement | *"which principle **governs**"* | nothing ranks them |
| `ia-principle-interaction-in-practice` | *"before determining which **governs**"* | same |
| `ia-principles-carry-no-precedence` | *"the standard **states** no precedence"* | "precedence", "hierarchy", "rank" appear **nowhere** |
| `ia-statement-objectivity` | *"fair presentation **requires**"* | clause 4.3 says *should* |

**ISO 19011:2026 contains one instance of "shall" — boilerplate about ISO patent
rights — and 264 of "should".** Clause 1: *"This document gives guidance."* It
requires nothing, anywhere.

Fixed in **migration 198**. The AUDIT grounding now carries the edition set, the
four never-assert claims, and the four principle pairs that genuinely collide,
quoted from the clause text.

> **The distinction is the whole competence this credential certifies.** The
> absence of a ranking rule is an observation about the text; a stated rule of no
> ranking is a claim the text does not make. An exam that trains auditors to check
> whether a clause says *shall* or *should* cannot itself write "ISO 19011
> requires" over a document of 264 shoulds.

**Two external reviewers read the same six items. One caught the precedence
point; neither caught the modal.** Both proposed prompt fixes that would have
worked around the source data rather than correcting it. The standard was in the
project the whole time; one `grep` settled both.

---

## 4. WORKING SETTINGS — NOT YET DEFAULTS

All environment overrides. **None of these is in code**, so a run without them
reverts to L1 values and yield collapses.

```powershell
$env:CHUNK = "3"              # 8 returned 1-3; the model returns what it is asked for
$env:LEN_SPREAD_MAX = "130"   # L1's 70 rejects genuinely parallel L2 options
$env:KEY_LEN_MARGIN = "25"    # a qualifying clause is WHY the key is best
$env:KEY_LEN_PCT = "15"
$env:BANK_REVISION = "v3-l2"  # marks the first Level II items
```

**`LEN_SPREAD_MAX=130` is unvalidated at scale and is the one to watch.** It is
nearly double the L1 value, and it is the guard that stops length carrying signal.
Nothing has been dropped for spread since it was loosened, which means it is not
binding — but that also means we do not know what it is letting through.
**`verify-cert`'s `strict-longest` on the finished bank is the check.** Near 25%
is fine. Near 40% and the guard was doing work we have switched off.

Owed: fold these into tier-2 defaults in code so a bare run does the right thing.

---

## 5. STILL OWED

- **36 tasks** at 8 secure each, plus practice at 10/task/lang. Runnable
  unattended in a loop now; it is a grind, not a design problem.
- **`exam_blueprint.item_model.cue_guard` documents a guard that does not exist** —
  *"tests comparable qualification density across options instead"* of raw length.
  Still documentation. `KEY_LEN_MARGIN` is the interim.
- **Form duration.** Four 45-word options plus a 90-word stem is ~90 seconds of
  reading before any thinking. A 60-item Level II form needs ~150 minutes, not 90.
  That is a scheme decision with a stated reason — comparing two defensible
  positions IS the competence — and 17024 asks the reason be recorded, not that
  the number stay small. PECB's internal auditor exam runs 2–3 hours.
- **Session timeout must be verified against that duration** before ISMS-IA
  publishes. A 150-minute form against a shorter JWT expiry logs candidates out
  mid-exam. Check `get-active-exam-session` and the Supabase token lifetime.
- **ISMS-IA translations** — 38 lessons × 2 languages.
- **`price_usd` = 0** on ISMS-IA and AIMS-F.
- Everything in v6.4 §9 and the addendum §5 that is still open.

---

## 6. METHOD NOTES FROM A LONG SESSION

**One variable per measurement.** Four were changed at once — ceiling, CHUNK,
spread, margin — and the result was attributed to the ceiling. That was a
measurement error, caught by Juan asking the obvious question: *if that was the
problem and not the ceiling, why not test the ceiling alone?* Every change after
that point moved one thing.

**Instrument before theorising.** Three hypotheses, three misses, then one log
line gave the answer immediately. The log had been saying `no valid drafts`
fifteen times — the stage was named in the output all along.

**A guard that fails is not proof the guarded thing is broken.** Three times a
check I had just written was itself wrong: a round-trip simulator that split on
every `+` and ate a literal one; a duplicate-stem check whose severity would have
destroyed 44 legitimate variant items; a post-check regex that matched the
explanatory comment warning against the pattern it was checking for. **Verify the
verifier before acting on its verdict.**

**Post-checks must anchor on code shapes that a comment cannot quote** — a
signature or an operator sequence, never a string that prose might contain.

---

*End of HANDOFF v6.5.*
