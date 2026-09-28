# The 20-extra sample: is the reviewed set a floor?

Drawn from the two-pass blind run on AIMS-F, 2026-09-28. 94 proposals were absent from the reviewed
set of 150; **20 were drawn deterministically** (every 4.7th in sorted order, so the sample is
reproducible and not concentrated in the first few tasks) and each was judged by reading the task
statement against the passage text.

> **NOT judged by the model that produced them.** A reviewer holding the same memory as the writer,
> asked whether the writer was right, is the hostile-reviewer-shown-the-answer shape this repository
> already records as worthless. These were read.

## Verdicts: 18 valid-but-omitted, 2 wrong

| # | task | address | verdict | reading |
|---|---|---|---|---|
| 1 | 1.1 | `A.1` | **WRONG** | Task is what an AI management system IS; A.1 is about Annex A controls being a reference. Off-task -- and the same run correctly gave A.1 to task 4.1, which is about Annex A |
| 2 | 1.4 | `6.1.4` | valid | Task is how 42001 sits alongside 27001 and 9001; the impact assessment is the requirement with no counterpart in either |
| 3 | 2.2 | `4.1` | valid | Scope is determined from 4.1's issues and roles; most scope items rest on 4.1 and 4.3 together |
| 4 | 2.4 | `A.10.2` | valid | "Allocating responsibilities ... between the organization, its partners, suppliers, customers and third parties" is literally the task |
| 5 | 2.6 | `B.5.2` | valid | Task is to APPLY the impact assessment; B.5.2 supplies the areas of impact the application turns on |
| 6 | 2.7 | `8.4` | valid | Task differentiates risk assessment from impact assessment; 8.4 is one of the two being differentiated |
| 7 | 3.1 | `A.4.6` | valid | "document information about the human resources and their competences" against a competence-needs task |
| 8 | 3.2 | `5.2` | valid | The AI policy shall be communicated and available to interested parties -- a communication requirement, though 7.3/7.4 are the primary home |
| 9 | 3.5 | `B.10.1` | valid | The third-party objective clause, against a task about components obtained from third parties |
| 10 | 3.7 | `8.2` | valid | Task asks what does NOT carry over from an ISMS; AI risk assessment is a distinct process |
| 11 | 4.1 | `A.10` | valid | Task is the STRUCTURE of Annex A, so its category headings are the subject |
| 12 | 4.1 | `A.5` | valid | same |
| 13 | 4.1 | `A.9` | valid | same |
| 14 | 4.5 | `B.8.4` | valid | "information to interested parties" against communication of incidents |
| 15 | 4.6 | `A.1` | valid | Task is to SELECT controls; A.1 is the clause saying not all are required and own controls may be designed |
| 16 | 4.7 | `A.4.3` | **WRONG** | Its own reason says "plausibly paired" -- a generic data-resources control with no special claim to an overlap task. Admitting it admits all 38 |
| 17 | 5.1 | `3.13` | valid | Definition of effectiveness, against a monitoring-and-evaluation task; 9.1 requires evaluating effectiveness |
| 18 | 5.4 | `3.16` | valid | Carries the nonconformity and corrective-action definitions, against an apply-nonconformity task |
| 19 | 5.6 | `10.2` | valid | One shared corrective-action process is exactly what a shared-evidence question turns on |
| 20 | 5.6 | `8.2` | valid | The separate AI risk assessment evidence stream, same task, other side |

**18 of 20 = 90 percent valid-but-omitted.**

## The correction, and why it barely moves

```
measured precision      51.5%   (100 of 194)
valid extras, sampled   90%     (18 of 20)
corrected precision     95.2%   ( (100 + 0.90 x 94) / 194 )
```

**Robust to how harsh the two WRONG calls were.** Even at 15 of 20 valid the corrected figure is
87.9 percent, still over the 85 percent bar. Precision is not where this instrument struggles.

> **Note 11, 12 and 13.** Pass 1 was told to prefer children over group headings. For task 4.1 the
> group headings ARE the subject, and it picked them anyway -- the rule was applied with judgement
> rather than followed. That is the behaviour you want and it counts three times against precision
> in the raw number.

## What the sample says about the reviewed set

Two thirds of the sample are addresses a careful human could reasonably have linked and did not.
That is not a criticism of the reviewed 150 -- a mapping is built for what an item writer needs,
not for completeness -- but it does settle the question the ruling asked:

> **The reviewed set is a FLOOR. Precision measured against it understates by roughly a factor of
> two, and any future run should report the corrected figure with its sample beside it.**

Recall carries no such caveat and is not corrected by this sample: a reviewed primary the judgment
did not propose is a miss however incomplete the reviewed set is.
