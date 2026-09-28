# Task linking, second attempt: the ceiling removed

Four blind runs on AIMS-F against its 150 reviewed primaries, 2026-09-28.

## The verdict

| | required | measured |
|---|---|---|
| recall | >= 90% | **78.0%** (117 of 150) -- **FAIL** |
| corrected precision | >= 85% | **93.3%** -- PASS |

**So ISMS-F, ISMS-IA and AIMS-IA were NOT run, and nothing was written to `task_sources`.**

## What changed across four runs

| run | algorithm | recall | precision | subject recall |
|---|---|---|---|---|
| 1 | ranker top-25, one pass | 57.3% | 69.9% | 71.7% |
| 2 | complete title list, two passes | 66.7% | 51.5% | 76.4% |
| 3 | + AIMS-F scope widened to its real sources | 63.3% | 35.1% | 77.4% |
| 4 | + pass 2 returns only its DROPS | **78.0%** | 32.8% | **88.7%** |

**The ceiling is genuinely gone.** Run 1 could not exceed 68.7% because 47 reviewed primaries were
never shown; every run since has offered all 150, and the report now says so against the SCOPED
title list rather than against the whole library.

Raw precision falls as recall rises because pass 1 was instructed to be generous and pass 2 now
keeps by default. The corrected figure is what the ruling asked for and it is comfortably over the
bar -- see `TASK-LINKING-EXTRAS-SAMPLE.md`: **18 of 20 extras read as valid-but-omitted**, so the
reviewed set is a floor and raw precision understates by about a factor of two.

## Why recall still fails, and it is one thing

**26 of the 33 misses come from TWO tasks where pass 2 returned nothing at all.**

```
1.6   pass 1 offered 18 candidates, pass 2 accounted for 0
5.5   pass 1 offered 32 candidates, pass 2 accounted for 0
```

Excluding those two: **recall 94.4% on 33 of 35 tasks.** That is not the reported figure and it is
not a pass -- the bar is on the certification, not on a subset -- but it locates the failure
precisely. The judgment is finding what a human linked; pass 2 is dropping the answer on the floor
for the tasks with the most candidates.

The same shape cost run 3 as well, worse: 79 picks across 3 tasks, and 48 of its 55 misses.

**The cause is the output budget, and the first fix helped without closing it.** Pass 2 originally
re-emitted every candidate in one of two lists with a reason each; 30 candidates is a long answer,
and a truncated JSON object parses to nothing. Run 4 changed it to return only the DROPS, keeping
everything unnamed -- which took the unanswered tasks from 3 to 2 and recall from 63.3% to 78.0%.
Two remain, at 18 and 32 candidates.

> **The remaining fix is to CHUNK pass 2** -- judge candidates in batches of ten and union the
> drops -- rather than to raise `max_tokens` again. A limit that has already been hit twice at
> different sizes is not a number to increase, it is a shape to remove.

## Three instrument defects found and fixed on the way

**1. The clause format destroyed a whole run.** The title list printed `  3.4  management system...`
and the prompt said to copy the clause "exactly as given". The model copied the whole line; all 34
tasks returned unmatched addresses; the run scored **0.0% recall on 0 proposals** and the raw output
was full of sound reasoning. The list is now `  [3.4]  ...` and ingest RESOLVES rather than demanding
equality -- longest held clause the string begins with, at a token boundary. Seven controls, one of
which caught `6.1.39` resolving to `6.1` because I had allowed `.` as a boundary.

**2. The ceiling claim was computed over the wrong population.** The run printed *"150 of 150 ... and
ALL of them were offered"* while 24 of AIMS-F's reviewed primaries were ISO/IEC 17021-1 and
ISO/IEC 42006 addresses and AIMS-F was scoped to 42001 alone. The library held them; the title list
did not. **The instrument asserted the absence of exactly the ceiling it was built to remove.** Now
computed against the in-scope set, with out-of-scope reviewed primaries reported as their own state.

**3. The scope list was read out of another script's artifact.** When the widened pool made the
ranker fail its own exemplars and refuse to write, the judge silently kept using the OLD scope from
the stale file. Both now import `scripts/lib/iso-cert-standards.mjs`.

**And AIMS-F's source list was wrong, which is a content finding rather than an instrument one.**
Task 5.5 is *"describe the certification route and what ISO/IEC 42006 governs"*. Holding the
certification to 42001 alone made 24 of its own reviewed primaries unproposable.

## What I am not doing

Not running the other three certifications: the bar is not met.

Not reporting the 94.4% subset as a pass. It is the diagnosis, not the result.

Not raising `max_tokens` a third time.
