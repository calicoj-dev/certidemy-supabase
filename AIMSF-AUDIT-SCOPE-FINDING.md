# The AIMS-F survivor count measures the task map, not the items

**Nothing has been retired and nothing has been generated.** This is why the 156-item shortfall must
not be used as a bill for regeneration until a ruling lands.

## What was run, and what it returned

278 live secure English AIMS-F items, each through `anchor-or-flag` and the blind solver. Keep only
if it anchors cleanly **and** the solver picks the key, as ruled.

| | |
|---|---|
| keep | **124** |
| drop | 142 |
| unexamined | 12 |
| shortfall to 8 per task | 156 |

## Why the drop count is unsound

**95 of the 142 drops carry no failing code gate at all.** They were withheld on the anchoring
model's judgement, and its reason is the same shape every time: *the key rests on a clause we do hold
which was not among the passages supplied for this task.*

Five were drawn on a stated seed and read in full. **All five read as correct items.** The fifth is
the one that settles it -- the model's own reason says:

> the key itself is anchorable in 6.1.2 d) 1)

and the item was flagged anyway, because the *explanation* additionally cites Annex C.

### The mechanism, measured

The anchoring pass supplies each task's **primary** passages. Under the 2026-09-29 ruling AIMS-F kept
its 150 reviewed links as primary and **every judge addition went in as supporting**:

```
primary rows      150
supporting rows   382      <- 72 percent of the map, invisible to the audit
tasks with 0 supporting rows   0 of 35
```

So an item resting on ISO/IEC 42001 clause 3, clause 6, ISO/IEC 17021-1 or ISO/IEC 22989 had nothing
to anchor in -- **not because the library lacks those, but because the row says `supporting`.**

**86 of the 95 name a source the library holds**, and the instrument says so itself in its own reason
string -- it already has the third state, and it was my report that folded it away:

```
63  ISO/IEC 42001      8  ISO/IEC 17021-1      7  ISO/IEC 27001
 6  ISO/IEC 22989      3  ISO 19011            1  ISO/IEC 42006      7  (no source named)
```

### And the flag rate tracks the map, not the bank

```
tasks with <= 4 primary passages    37.9% model-flagged   (25 tasks)
tasks with >= 8 primary passages    22.9% model-flagged   ( 6 tasks)
```

The two tasks that lost **every** item are the two with the most lopsided maps:

| task | primary | supporting | items | flagged |
|---|---|---|---|---|
| `4.7` | 1 | 15 | 7 | 7 |
| `5.6` | 2 | 39 | 8 | 8 |

A task with one primary passage and fifteen supporting ones cannot have eight anchorable items, and
that is a fact about the link roles.

## What this is an instance of

An error in the **conservative** direction does not self-correct. Nobody files a bug against a gate
that was too strict, so an over-withholding instrument produces findings that look like rigour. Acting
on this count would have retired about a third of a live bank for a bookkeeping reason and spent
roughly 780 model calls replacing items that are sound.

It was caught only by reading the members. The count was available and looked entirely plausible:
34 percent off-task is a believable defect rate for an ungrounded bank, which is exactly why it would
have been believed.

## Two decisions, and they are not the same one

**(1) Should the anchoring pass see the supporting passages?** If it does, these 86 items get a real
verdict instead of an absence: they anchor, and then `anchor-is-primary` -- the ruled gate -- decides.
That gate fired on **3** items in this run, because for the other 86 the model never had the passage
to anchor in, so the ruled rule never got to run. Re-running costs about 550 model calls.

**(2) Is a key on a supporting passage wrong for a FOUNDATION certification?** The gate says a
distractor's reason may use a supporting passage and a key may not. That is right for an auditor
certification. AIMS-F 5.4 asks a candidate to distinguish *correction* from *corrective action* -- a
clause 3 definition, mapped supporting -- and that is a legitimate Foundation item. This is a ruling
about the gate, not a defect in it.

Until (1) and (2) are settled, the honest statement of the survivor count is:

> **124 items are proven sound. The other 142 are not proven unsound.** 47 of them failed a code
> gate and are real findings; 95 were not measured against the passages we hold.

## The 12 unexamined, which are a separate matter

- **9** rest on a source the library genuinely does not hold -- the EU AI Act as a legal instrument,
  GDPR, ISO 31000, ISO/IEC Directives Annex SL. A purchasing decision, not a rewrite.
- **3** anchor cleanly but the blind solver's payload was refused: their explanation reproduces the
  anchor passage verbatim, so `assertBlind` cannot tell a leaked key from an explanation copied out of
  a passage that has to be supplied. Those need a re-run, not retirement -- **and the refusal is also
  a finding about the item**, because an explanation that is the standard's sentence word for word is
  what the reproduction ceiling exists to catch.

## The real code-gate findings, which stand

47 items failed a mechanical gate and those verdicts do not depend on any of the above:

| gate | items |
|---|---|
| `modal-fidelity` | 30 |
| `verbatim` | 8 |
| `clause-exists` | 6 |
| `anchor-is-primary` | 3 |

`clause-exists` failing on 6 is worth its own look: an item citing an address no held standard
carries is the invented-address class, and that is a defect in the item whatever the map says.
