# HANDOFF v12.1 — addendum to v12.0

**2026-09-14, after the MCP pilot went live.** Everything here was found by an
agent in a fresh chat reading the AISM-I blueprint through `get_syllabus` — the
tool shipped for partners to read it with — and none of it by any gate in this
repository.

**That is the finding under the findings.** The pilot's first real use was not a
partner evaluating coverage. It was a reader with no stake in the answer noticing
things thirteen certifications' worth of invariants had never been asked to look
for. A partner will do the same, and will not send a report.

---

## 1. What the agent found, and what was underneath

It reported two things in one pass: that AISM-I has 5 analyze tasks in 61 and no
evaluate or create, and that AISM-I is tier 1 at 80% while SM-AI-II is tier 2 at
75% with a documented basis.

**Both were true, and neither was the defect.**

**The Bloom observation was the design, but it exposed a real gap.** The absence
of evaluate and create is deliberate and argued: `jta.mcqCeiling` refuses any
exam-scope task above `4_analyze`, because multiple choice cannot validly assess
Evaluate or Create. Platform-wide there is exactly **one** `5_evaluate` task and
it is out of exam scope, as the ceiling requires.

AISM-I at 8.2% is also not an outlier. The tier-1 range is 0.0% to 21.4% and the
tier-2 range is 63.6% to 70.0%, **sharply separated with nothing between** — so
the profile is the tier, measured. But there was a **ceiling and no floor**, and
nothing tied a cognitive profile to a tier anywhere: `tier` reaches item
generation and never the JTA. **`AIE-I` sits at 0.0% — eighteen exam-scope tasks,
none above apply — and passed every gate in the repository.**

**The pass-mark observation was right about tier 2 and pointed at tier 1.**
Tier 2 had a real argument chain: `ISMS-IA` §7 argues from item construction,
`AIMS-IA` §7 makes it independently, `SM-AI-II` §7 cites both and declines a third
copy. **Tier 1 had a convention and no root** — six of nine schemes said the
threshold was *"set at the 'I'-tier standard"*, which is circular.

And a correction the agent could not have seen: its D4 claim was arithmetically
right and pointed at the wrong domain. D4 holds **4 of AISM-I's 5 analyze tasks**
and is its strongest. The shallow one is **D1: 8 tasks, every one at remember or
understand, zero apply, zero analyze, at 12.5% of the exam.**

---

## 2. The tier-1 root

`SCHEME-AIHR-I.md` §7 now carries the tier-1 argument and the other eight cite it.
AIHR-I was the right home because it was already the honest one — it called 80%
*"the catalog's house convention"* rather than implying derivation, and it named
the tension with AIE-I itself.

The argument, in terms of what a tier-1 item **is**: the key is right and the
distractors are wrong, not less good, so a miss is a syllabus gap rather than a
disagreement with the item writer. That is the mirror of ISMS-IA's tier-2
argument and runs the opposite way. **The two numbers are not a lenient one and a
strict one; they are two instruments, each carrying the threshold its item type
supports.**

Not lower, because at 75% a candidate may be wrong about a quarter of a syllabus
the certificate says they covered. Not higher, because **a threshold finer than
the form can resolve is a false claim about the exam's accuracy, not a higher
standard.**

---

## 3. The tier-2 rounding gap, and why it was the sharper finding

**75% of a 50-item form is 37.5 items, which nobody can score.** All three Level
II schemes stated the pass as *"75% (38 of 50 items)"* — two numbers a point
apart, written as though they were one, **with the unreachable one leading.**

Both halves were individually true. `score-mock-exam` is the only decider in
either repository and passes at `score_pct >= 75`, so 37/50 scores 74.0% and
fails while 38/50 scores 76.0% and passes. What was false was the implied
equality — and the consequence was that **a standard-setting panel would have
been deriving toward a value the form cannot return.**

**Resolved so the judgement and the mechanism stay separate**, with the operative
statement leading:

> Minimum passing score: 38 of 50 items (76.0%). The criterion-referenced
> judgement is 75%, and 76.0% is the nearest value the form can express.

`ISMS-IA` §7 is the tier-2 root and gives a panel three steps: derive the
judgement unconstrained by the form, map it to the nearest expressible value,
publish both in that order. **A recommendation that lands between two expressible
values is not implemented by silently choosing one.**

**No code change and no migration** — `passing_score_pct` stays 75.00, which is
the point. Confirmed after: `Scheme claim: pass mark` still passes at 75 on all
three, and the gate reads a fenced `scheme-claims` block of explicit key/value
pairs rather than prose, so the pass is structural rather than a lucky parse of a
document that now leads with 76.0%.

**Timing mattered and was verified, not assumed.** Zero attempts and zero
credentials on all three Level II certifications — **no Level II examination has
ever been sat.** `open-badge` embeds `passingScorePct` from the **live** row into
the signed document, so the same reconciliation after a first sitting would have
altered what already-issued credentials assert about their own pass mark.

---

## 4. Two gates added

**`jta.higherOrder` — reports, gates nothing.** The share of exam-scope tasks at
analyze or above, per certification, with the per-level shape beside it. **WARN
by design**: nine tier-1 certifications spanning 0.0% to 21.4% is the evidence for
choosing a floor and is not yet enough to choose one from, and a gate that failed
nine certifications on the day it shipped would be switched off before it taught
anyone anything. The output says the threshold is undecided.

It measures **exam-scope** tasks, which is not the same as all tasks: SM-AI-I
reads 11.5% of 52 here and 13.2% of 53 if every task is counted, because its
single `5_evaluate` is out of scope. The figure is about what the exam assesses,
not what the JTA describes.

**`min_passing_items` — the operative number is now machine-checked.** It lived
only in prose; change `num_questions` to 60 and all three Level II documents would
still have read "38 of 50" with nothing to notice. It is **derived** from
`num_questions` and `passing_score_pct`, both already gated in the same block, so
there is no third source of truth. Verified both directions: setting ISMS-IA to 37
— the count that scores 74% and fails — produces `document says 37, database says
38` and one FAILURE.

**The first version of that check was broken and shipped nothing**, because it
guarded with `Number.isFinite()` on the output of `num()`, which returns a string
for display. It reported `database says null` on all twelve. **It failed loudly
rather than passing vacuously, which is the only reason a broken gate did not
ship looking green.**

Baseline re-measured in one `--all` run, twice: every row gained exactly one warn,
then every row except ZZ-TEST-I gained exactly one pass, with nothing else moving
either time.

---

## 5. Left open, deliberately

**`AIE-I` at 0.0% higher-order is a content decision, not a gate.** Eighteen tasks
with nothing above apply is a question about what that credential claims, and it
needs the same kind of argument the pass mark got. It now has a number printed on
it in every run, which is what it needs *before* the argument is made rather than
instead of it.

**`AIE-I`'s granularity is the harder case.** At 25 items one item is 4.0
percentage points, so the achievable cut scores around the bar are 76% and 80% and
there is no 78%. Whether it states a mapping or changes form length is an open
decision — recorded in `AIHR-I` §7.2 as a decision rather than an oversight.

**`AIE-I`'s validity claim still fails**, 730 against 365, deliberately.

---

## 6. What went wrong in the doing

**A query that contradicted itself, twice.** An all-zero Bloom distribution across
every certification read as "no cognitive data exists" — caught only because the
same query selected `unset`, which was also zero, and both cannot be true. The
enum labels are prefixed (`1_remember`, not `remember`). Then a credential count
returned `credentials: 0` and `real_awards: 3` in the same row, because
`count(*) filter (...)` over a LEFT JOIN counts the unmatched left rows.

Both are recorded in CLAUDE.md beside the GROUP BY-over-nullable entry, **with the
defence, which is cheaper than the care: select the field that would contradict
the number.** A single count has nothing to disagree with. It is "assert both
directions of the property" applied to a read rather than a write.

**And the broken gate in §4**, which is the same lesson from the other side: the
check was wrong, and the thing that saved it was that a wrong check here fails
rather than passes.
