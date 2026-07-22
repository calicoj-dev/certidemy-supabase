# HANDOFF-v2.6 — Exam Readiness, Rebuilt

Delta from HANDOFF-v2.5, same session. Everything below is committed and pushed.

**Migration tip: 120. Next migration is 121.**

---

## 1. The bug was not that the readiness model was wrong. It was the only thing running.

`pass_predictions` had **zero rows** — nothing had ever written it. Every surface
read it, got null, and fell through to a fallback:

```ts
// score-mock-exam/index.ts
const adjusted = score_pct - 5;
const predicted_real_exam_pass_pct = sigmoid((adjusted - passing_threshold) / 8) * 100;
```

Two invented constants — a flat 5-point penalty and a slope of 8 — neither from
the database nor from evidence. **That was the readiness number the product
showed**, on five surfaces, for its entire life. The code reads as a real model
with a sensible backup; there was only ever the backup.

**Watch for this shape elsewhere.** A primary path that silently never fires,
with a fallback quietly doing all the work, is the same failure mode as the
RLS-without-grant tables from v2.4/v2.5: nothing throws, everything looks wired,
the feature simply does not happen.

---

## 2. Migrations 119 / 120 — `v_user_exam_readiness`

A **live view**, not a snapshot table. No scheduler, never stale.
`pass_predictions` is kept for point-in-time records written at exam time.

### The model

**Blueprint-weighted.** The exam samples domains by `domains.weight_pct`. Strong
in a 12.5% domain and weak in a 30% domain is NOT ready, and a flat mean hides
exactly that.

**Coverage is reported separately and drives the confidence band.** Mastery of
0.9 across 15% of exam-scope concepts tells you almost nothing.

**Unmeasured domains are UNKNOWN, not zero.** The estimate renormalizes over
measured domains. Treating an untouched domain as 0% would tell someone who has
studied one domain well that they are failing.

**Below 25% coverage it reports nothing.** `is_reportable = false`. "Not measured
yet" is honest; a confident number built on four questions is worse than none.

**Mastery maps to expected score 1:1.** `mastery_score` is the proportion correct
on a concept, so a weighted mean is a first-order estimate. **This is the
assumption most worth revisiting** once real attempt data exists — regress
predicted against actual and recalibrate. Do not add another invented constant.

Early evidence it is not crazy: SM-AI-I predicted **31.5%** against a real mock
exam of **35%**.

### 120 corrected 119 within the hour — and the DATA caught it

119 counted mastery ROWS as coverage. But a row exists after ONE attempt, so
coverage measured **presence, not evidence**: a learner 1 lesson into SD-AI-I
showed **coverage 1.0000, ±5**. Observed distribution for a real learner: 100
concepts at exactly 1 attempt, 308 at 3+, tail to 132.

Fixed with `evidence = least(1.0, attempts / 3.0)`. Three attempts because below
that a single lucky answer dominates a 4-option item. After the fix:
SD-AI-I **0.62 coverage / ±16.5**, SM-AI-I **1.00 / ±5**.

### THE TRAP, deliberately avoided

**Evidence weighting applies to COVERAGE ONLY, never to the point estimate.**
FSRS resurfaces concepts the learner is WEAK on, so attempts correlate with
difficulty. Weighting the predicted score by attempts would let struggling
concepts dominate the mean and depress the estimate for reasons unrelated to
readiness.

### Postgres gotcha

`create or replace view` can change a view's BODY but **never its column names,
order, or types**. 120 renames `concepts_measured` to `concepts_seen`, so it
must `drop view` first. The error only appears at run time.

---

## 3. Five surfaces reconciled

| surface | before | after |
|---|---|---|
| home cards | `pass_predictions` (empty) → "not measured yet" | score + band |
| progress strip | sigmoid fallback | score + band |
| command deck | sigmoid `~N% chance` | removed; ring retained |
| hub hero | sigmoid `~N% chance` | removed |
| exam results | sigmoid prediction card | **removed entirely** |

Exam results shows the mock score, pass/fail, concept and difficulty
breakdowns, recommendations — all real. The readiness figure lives on the
dashboard. One number, one method, one place.

### The most consequential fix: `ARMED` / `onTrack`

Both were `weightedMastery >= passing` with **no coverage check**. They drive
"ARMED — YOU'RE READY" and the exam CTA. A learner measured on a fifth of the
blueprint, scoring well on that fifth, was being told to go sit a **paid exam**.

Both now additionally require `data.passPrediction != null`, which is non-null
only when the view reports `is_reportable`. Mastery answers *how well*; coverage
answers *how much do we know*; telling someone to spend money needs both.

### A displayed quantity changed, not just its source

A predicted **score with a band** against a known threshold is actionable —
"47% ±17 against a bar of 80" tells you what to do. A pass **probability** only
tells you how to feel.

---

## 4. Process lessons from this stretch

**Enumerate consumers BEFORE changing a shared type's shape.** Changing
`DashboardData.passPrediction` cost three build cycles because consumers were
fixed as the compiler surfaced them. One `Select-String -Pattern "passPrediction"`
up front would have found all five. Same discipline as anchor uniqueness: look
at the whole surface before editing any of it.

**Propose → run against real rows → revise.** Two models died this session —
`user_progress` having zero rows, and coverage-by-row-existence — and both
replacements were better than the originals. The database is a faster reviewer
than either of us.

---

## 5. Also landed since v2.5

- **Migration 118** — grants on `chat_sessions`, `chat_messages`,
  `lesson_format_preferences`. Same RLS-without-grant class as credentials.
  `quiz_questions` stays deliberately locked: the item bank is reached only
  through edge functions on the service role, and a grant would undermine the
  exam firewall.
- **`_shared/prompts.ts`** no longer hardcodes a 70% pass mark. It is consumed by
  **`score-mock-exam`** (not the study plan — the first deploy attempt uploaded
  the wrong function and changed nothing). Deployed.
  **`supabase functions deploy` prints its uploaded assets; that list is the real
  dependency graph.** Read it, not the "Deployed Functions" line.
- **Checkpoint formative note** — see v2.5 §0.

---

## 6. Queued next

1. **Grok review of the ~392 provisional JTA translations**, then `--approve`
   per cert. Still the biggest gap between the product and its claims.
2. **`score-mock-exam` still computes the sigmoid** and writes
   `predicted_real_exam_pass_pct` to `mock_exam_results`. Nothing renders it now,
   so it is dead weight rather than a live wrong answer — clean it out with the
   two constants on a future pass.
3. **`readinessPct` in command-deck / hub-hero still comes from
   `domainMastery.weightedMastery`**, not the view. It is blueprint-weighted and
   consistent with the radar on that screen, but the view additionally
   renormalizes over measured domains. Migrating it would move the ring and the
   radar together — its own pass.
4. **Recalibrate the mastery→score mapping** once real exam attempts exist.
5. **Reconcile the cert dashboard's "36 / 31"** — per-language lesson rows vs the
   deduped home view. The home number is right.
6. **Blueprint drawer labels**, **CertiGlobal dark variant**, **`/family/` URL**,
   **claims into scheme docs** — carried from v2.5.

### Commercial-readiness

The readiness figure — the number that tells someone whether to pay for an exam
attempt — is now derived from the blueprint and the learner's measured mastery,
reports its own confidence, and refuses to speak below an evidence floor. That
is defensible under scrutiny in a way a hardcoded sigmoid never was.

Unchanged caveat from v2.5: the JTA translations are live but **unreviewed**.
