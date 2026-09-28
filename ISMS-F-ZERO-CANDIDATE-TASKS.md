# The six ISMS-F tasks that had zero candidates, and what each actually tests

Measured 2026-09-28. Widening the ISMS-F source pool from ISO/IEC 27001 alone to **27001, 27002,
27000 and 17021-1** took the zero-candidate count from 6 to 0. That is the mechanical half. This is
the half that matters: what each task tests, and whether a standard says it.

**Three answers, not two.** *Taught from our own material* is a legitimate answer and it is
recorded as one -- but it is a different answer from *the standard grounds the mechanism and our
material carries the AI-specific reasoning*, and collapsing the two would either overstate our
coverage or understate it.

## Every negative claim below carries a positive control

A negative claim is verified by failing to find text, which is what a broken search also does.
Over the 614-passage ISMS-F pool:

```
POSITIVE CONTROLS, all found      threat 55, vulnerability 15, risk identification 4, supplier 40,
                                  monitoring 63, attribute 16, surveillance audit 6,
                                  information asset 18
THE NEGATIVE CLAIM, all absent    agentic 0, model-level 0, agent autonomy 0, foundation model 0,
                                  large language model 0, machine learning model 0,
                                  autonomous agent 0
```

Eight controls found, seven AI-specific terms absent. **No ISO/IEC 27001, 27002, 27000 or 17021-1
passage we hold contains any of them.** The absences below are facts about the standards, not about
the probe.

---

## 1.6 -- OWN MATERIAL

> *Distinguish model-level risks from agentic risks.*

**Nothing in the pool addresses this, and that is correct rather than a gap.** The distinction
between a risk arising from a model's outputs and a risk arising from an agent's capacity to act is
not in ISO/IEC 27001:2022 or its supporting documents; 27001 predates the question. The task is
ours, taught from our own material, and it should be linked to no passage.

The ranker's top candidate is `27000 3.39 level of risk` at 6.67 -- a lexical hit on *level* from
*model-level*, and a good illustration of why a score is not a finding. **Proposed action: record
this task as deliberately unsourced**, so that "no primary passage" reads as a decision rather than
as unfinished work.

## 3.3 -- PARTLY HELD

> *Apply risk identification to a described situation to name the asset, threat and vulnerability.*

The vocabulary is held precisely and the process is held normatively:

```
27000 3.74   threat         potential cause of an unwanted incident ...
27000 3.77   vulnerability  weakness of an asset or control that can be exploited by one or more threats
27000 3.64   risk assessment  risk identification, risk analysis and risk evaluation
27001 6.1.2  Information security risk assessment  (shall define and apply a process that ...)
```

What is NOT held is the *described situation* -- applying the vocabulary to a scenario is a teaching
act, and the scenarios are ours. So the definitions and 6.1.2 are the primaries; the exercise is
our own.

## 4.2 -- HELD, and by 27002 rather than 27001

> *Explain control attributes and how they support selection and reporting.*

**Attributes are 27002's addition, not 27001's.** This is exactly why the task had zero candidates
against a 27001-only pool -- the material is not in 27001 at all.

```
27002 4.2   Themes and attributes     the five attributes and how controls are categorized
27002 A.1   General                   the table demonstrating attributes as a way of creating views
27002 A.2   Organizational views      discarding the proposed examples and using your own
```

Fully grounded.

## 4.8 -- PARTLY HELD

> *Analyze what supplier assurance can and cannot establish about a foundation-model provider.*

The supplier controls are held in full:

```
27002 5.19  Information security in supplier relationships
27002 5.20  Addressing information security within supplier agreements
27002 5.21  Managing information security in the ICT supply chain
27002 5.22  Monitoring, review and change management of supplier services
27002 5.23  Information security for use of cloud services
```

The **can** half of the task is those five. The **cannot** half is ours: *foundation model* appears
nowhere in the pool, and the argument that supplier assurance cannot establish what a model will do
is our analysis, not a clause.

## 5.5 -- HELD, in ISO/IEC 17021-1

> *Recognize the certification process -- stage 1, stage 2, surveillance and the three-year cycle.*

Every element is held, and the ranker scores the first two at 11.07 and 10.00:

```
17021-1 9.3.1.2.1  Stage 1
17021-1 9.3.1.3    Stage 2
17021-1 9.6.1      General (surveillance activities)
17021-1 9.6.2.2    Surveillance audit
17021-1 9.6.3.2.1  Recertification audit
```

**A correction worth recording: I first reported surveillance and recertification as NOT HELD.**
That was my guess at their clause numbers -- `9.6.2`, `9.6.3` -- being wrong, not a library gap. The
document numbers them `9.6.2.2` and `9.6.3.2.x`. Asking the library what it holds in the `9.5`-`9.7`
range answered in one query; guessing an address and reporting its absence would have sent someone
to fix an extractor that is working.

## 5.8 -- PARTLY HELD

> *Analyze why an AI-related incident may not surface through conventional monitoring.*

Conventional monitoring is what the standard supplies:

```
27002 8.15  Logging
27002 8.16  Monitoring activities
27002 5.24  Information security incident management planning and preparation
27002 5.25  Assessment and decision on information security events
```

Those four define what conventional monitoring IS, which is the premise the task reasons from. Why
an AI-related incident evades them is ours -- and the task word *why ... may not* is a negative
claim about the controls, so a passage cannot assert it.

---

## Summary

| task | verdict | primaries |
|---|---|---|
| 1.6 | **own material** | none, deliberately |
| 3.3 | partly held | `27000 3.74` `3.77` `3.64`, `27001 6.1.2` |
| 4.2 | **held** | `27002 4.2` `A.1` `A.2` |
| 4.8 | partly held | `27002 5.19` `5.20` `5.21` `5.22` `5.23` |
| 5.5 | **held** | `17021-1 9.3.1.2.1` `9.3.1.3` `9.6.1` `9.6.2.2` `9.6.3.2.1` |
| 5.8 | partly held | `27002 8.15` `8.16` `5.24` `5.25` |

**Nothing above has been written to `task_sources`.** These are proposals for your read, and the
judgment linker that would have produced them at scale failed its own control -- see
`TASK-LINKING-JUDGMENT.md`.

**One structural note the six make together.** Four of them needed a source ISMS-F's pool did not
originally contain, and in two cases the material is not in ISO/IEC 27001 at all -- control
attributes are 27002's, the certification cycle is 17021-1's. A task can have zero candidates
because the certification's declared standard genuinely does not carry its subject, which is a
different finding from a ranking failure and needs the opposite response.
