# AIMS-F task 1.3 -- the two items ruled KEEP

Matched by CONTENT against the ruling, not by position: an artifact regenerated between the read and
the insert would leave positions pointing at items nobody saw. Each match is asserted to be unique.

Insert with:

```
node --dns-result-order=ipv4first scripts/gen-grounded-items.mjs --cert=AIMS-F \
  --apply --from=PILOT-AIMSF-TASK-1-3.json --exam-scope \
  --ids=81de1ecb,dd535172
```

---

## #1  `81de1ecb`   (the Annex C illustration)

**anchor** `C.3.6`

> Sources of risk can appear over the entire AI system life cycle (e.g. flaws in design, inadequate deployment, lack of maintenance, issues with decommissioning).

**Q** Which of the following is offered in Annex C as an illustration of where risk can come from?

- A) Choosing an unsuitable accuracy metric for a classification task.
- **B) Leaving a fielded system without upkeep over a long period.  ← key**
- C) Publishing technical documentation that management has not approved.
- D) Running an AI management system apart from a quality system.

*explanation:* Clause C.3.6 notes that risk can arise anywhere across the whole life cycle, and its illustrations include design flaws, poor deployment, absence of maintenance, and decommissioning problems; lack of upkeep of a system already in the field matches the maintenance example. The other options come from operational performance guidance, documentation guidance and integration guidance rather than from the C.3.6 illustrations.

*solver:* accepted -- solved to the key from the passages, no second defensible option

*options-only probe:* no-cue -- picked the key but named no concrete cue -- one in four is luck, not evidence

*longest served run:* 4 words (ceiling 9)

---

## #4  `dd535172`   (the insurer, three years unpatched)

**anchor** `C.3.6`

> Sources of risk can appear over the entire AI system life cycle (e.g. flaws in design, inadequate deployment, lack of maintenance, issues with decommissioning).

**Q** An insurer runs an approved model for three years with no patching, no updates and no support arrangement in place. Using the illustrations in Annex C, this fits best under which heading?

- **A) Upkeep of the system in service was absent.  ← key**
- B) The original design of the system was flawed.
- C) The system was put into service inadequately.
- D) Withdrawal of the system raised unresolved issues.

*explanation:* Clause C.3.6 notes that risk sources can arise anywhere across the whole life cycle, and the examples it gives include missing maintenance alongside design flaws, poor deployment and decommissioning problems. Three years in service with no patching, updates or support is the missing-maintenance case.

*solver:* accepted -- solved to the key from the passages, no second defensible option

*options-only probe:* no-cue -- picked C, not the key -- the options do not give it away

*longest served run:* 4 words (ceiling 9)

---

## Not inserted

- `8fb91f8f`  An operations lead claims that only models which keep training on live data can develop new risk after go-live  -- **rejected: anchor-cap + cue flag** (only-hedged)
- `158b0ec3`  Why does an AI management system carry obligations beyond the moment a system ships?  -- **rejected: anchor-cap + cue flag** (shared-phrase)

Both anchor in C.3.6 like the two kept, so with the cap at 2 they are surplus, and both carry an
options-only cue flag -- which is why these two rather than the other two.

