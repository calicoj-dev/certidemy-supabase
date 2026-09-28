# Task linking by judgment -- the blind AIMS-F control

Run 2026-09-28. `scripts/judge-task-sources.mjs --cert=AIMS-F --top=25`, blind.

## The verdict first

**The gate fails, so ISMS-F, ISMS-IA and AIMS-IA were NOT run and nothing was written to
`task_sources`.**

| | required | measured |
|---|---|---|
| recall | >= 90% | **57.3%** (86 of 150) |
| precision | >= 85% | **69.9%** (86 of 123) |

35 tasks judged, 0 could-not-run, 0 malformed, 0 `none_apply`, 1 low-confidence decision,
0 proposals naming a clause the library does not hold.

## But the gate could not have passed, and that is the real finding

**47 of the 150 reviewed primaries were never shown to the judgment.** They are outside the
ranker's top 25, so no judgment of any quality could have proposed them.

```
of the 150 reviewed primaries
  chosen by the judgment                   86
  OFFERED in the top 25 and not chosen     17    <- the judgment's actual misses
  NEVER OFFERED                            47    <- the ranker never surfaced them
                                          ---
  ceiling on recall at top 25                    68.7%
```

So the >= 90% bar was unreachable before a single model call was made, and the 57.3% is a
measurement of the RANKER and the judgment welded together. Separated:

> **Judgment, measured only on what it was actually shown: 83.5% (86 of 103).**

Still under 90, so the conclusion does not change -- but it is a different number from 57.3%,
and it points at a different half of the system.

**This was already measured and I did not read it before spending the calls.**
`ISO-TASK-SOURCES-DRAFT.md`, written earlier in this session, says the ranker surfaces at most
**106 of 150 at ANY depth** and that **44 are invisible to it at every depth** -- they have no
title match and fewer than three shared distinctive terms. Depth 60 buys 69%, depth `all` buys
71%. The ceiling was in an artifact I wrote, in a table headed *"which separates a bad ranking
from a small cap"*, and the run went ahead without consulting it. A bigger `--top` is therefore
not the fix either.

## The 65 misses, classified by reading them

| class | n | what it is |
|---|---|---|
| container instead of children | 28 | the judgment named `A.9`; the reviewed set enumerates `A.9.2`, `A.9.3`, `A.9.4` |
| sibling inside the right subject | 4 | `B.6.1.3` proposed where `B.6.1.1` is linked; `B.9.3` for `A.9.3` |
| a genuinely different subject | 32 | the judgment did not find this material at all |

And the 38 extras: **21** a different subject, **9** a clause-3 definition, **8** the other side
of a grain disagreement already counted above.

**My first reading of this was wrong twice, and both times the plausible story was the wrong
one.** I expected the Annex A / Annex B pair -- an `A.x.y` control linked while its `B.x.y`
guidance was proposed instead, which CLAUDE.md records a gate firing on nine times. Measured, that
is **2 of 65**. I then expected grain to explain the rest; collapsing every address to its subject
spine and re-measuring gives **subject-level recall 71.7%**, so even forgiving grain entirely the
bar is missed, and 32 misses are not a grain question at all.

Worked example, AIMS-F 1.3 -- *"Describe the AI system life cycle and why it anchors AIMS
obligations"*:

```
reviewed  A.6.2  C.3.6  B.6.2.1  A.6.1  B.6.1.1
proposed  A.6.2  C.3.6  B.6.2.1  B.6.1.3  B.6.2.6
```

Both sets identify the same two subjects, 6.1 and 6.2, and disagree on which sub-address of each
carries the task. Scored per address that is 3 of 5.

And 4.6 -- *"Select controls for use of AI systems and for third-party and customer
relationships"* -- where the reviewed set enumerates `A.9.2 A.9.3 A.9.4 A.10.2 A.10.3 A.10.4` and
the judgment proposed the two containers `A.9` and `A.10` plus three of the six children.

## What the never-offered 47 look like

They arrive in RUNS, which is why a per-passage lexical ranker cannot reach them:

```
3.6  ->  A.7.2  A.7.3  A.7.4  A.7.5   (a whole Annex A data-control family)
3.7  ->  7.3    7.4    7.5.1  7.5.2   (a run of main clauses)
4.4  ->  A.5.3  A.6.2.2  A.6.2.5  A.6.2.6
```

A task whose mapping spans a control family needs each sibling surfaced, and each sibling scores
low on its own against the task statement. That is a property of scoring one passage at a time,
not a cap that a larger `--top` relieves.

## Precision is asymmetric and recall is not

A proposal absent from the reviewed set may be a passage nobody linked -- the reviewed 150 is a
floor on what is correct, not a ceiling. So 69.9% is read with that caveat, and the 9 clause-3
definitional extras are the clearest instance: `2.1` was given `4.1` and `4.2` exactly as reviewed,
plus `3.2`, which is defensible.

Recall carries no such caveat. A reviewed primary the judgment did not propose is a miss.

## The blindness held, and the guard that enforced it had to be rebuilt

First run aborted on task 28 of 35: `assertBlind` searched the SERIALISED payload for the strings
`accepted`, `"role"` and `"primary":`, and a 42001 passage contains the ordinary English word
*accepted*. **Twenty-six completed model calls were lost with it.**

That is verbatim this repository's own defect -- a guard matching an English word where the
property is structural, recorded already against `assertBlind` in the grounded gates (a distractor
containing *explanation* aborting a 40-item pilot) and against a migration guard matching `to anon`
inside a comment reading *no grant to anon*. Rebuilt as two structural facts:

- the payload's PROPERTY NAMES are walked against an allowlist -- a link-derived field cannot
  arrive without a name, and a name is not prose;
- `linksRead` is set at the one site that reads `task_sources`, and `assertBlind` throws if a
  payload is built after it. This is the stronger half: it holds whatever the payload contains, and
  it is the actual hypothesis -- the run is blind because the links do not exist in the process
  until every call has returned.

4 controls, both directions, run before any call is paid for: a clean payload whose passage text
contains *accepted*, *role*, *primary* and *task_sources* must pass; a payload carrying a `role`
FIELD must fail; one carrying `reviewed_primary` must fail; one built after the links were read must
fail.

**And the calls are now persisted as they land**, to `TASK-SOURCE-PROPOSALS-AIMS-F-raw.json`,
marked `ungated` so it cannot be read as a result. `--from=<file>` re-scores without paying for the
model again, which is also how a changed scorer runs on the OLD input, one thing at a time. The
lost 26 are the reason; generation is the expensive half and gating is the cheap one.

One transport note: the first run was launched piped through `tail`, so node's uncaught throw
reported **exit 0** to the caller. A crashed run wearing a success code -- the same
could-not-run / did-not-pass confusion this repository records against `process.exit` with open
handles. Background runs now redirect to a file and the log is read.

## What I am NOT proposing

Not a bigger `--top`: depth `all` reaches 71%. Not a prompt tweak: 32 of 65 misses are material
the judgment never found and 47 were never shown. The binding constraint is candidate generation,
and closing it means a generator that can surface a control FAMILY for a task rather than ranking
passages independently. That is a design decision, so it waits for you.

The container-for-children class (28 of 65) is the one cheap, mechanical piece: a rule that a
container proposal expands to its held children, which the anchor gate already does for
`9.3.1.2`-style references. On its own it would move recall to about 76% -- still short of 90.
