# Scrum glossary: the terms needed, and the two files that would supply them

**STOPPED, as ruled.** The official 2020 Spanish and Portuguese Scrum Guides are **not on disk**. Only
`reference/scrum-guide-2020.pdf` (English) is held. The ruling says to take the official terms from
those editions and forbids reconstructing them from memory, so the `scrum_2020` family in
`scripts/lib/translation-glossary.json` carries **zero terms** and the lint checks **none** of them.

## What to download

```
Scrum Guide 2020, Spanish     https://scrumguides.org/download.html  (Espanol)
Scrum Guide 2020, Portuguese  https://scrumguides.org/download.html  (Portugues do Brasil)
```

Both are CC BY-SA 4.0, like the English one already tracked in `reference/`, so they can be committed
rather than gitignored. Put them at `reference/scrum-guide-2020-es.pdf` and
`reference/scrum-guide-2020-pt-BR.pdf` and this file becomes a ten-minute job.

## The terms, grouped by what they are

**Accountabilities — already ruled to stay in English in both languages**, so these are needed only to
confirm the official editions agree and to get the surrounding grammar right:

```
Scrum Team          Product Owner          Scrum Master          Developers
```

**Artifacts and their commitments** — each needs the official es and pt form. These are the ones that
carry a disambiguating first word, so a truncation loses which object is meant:

```
Product Backlog     Product Goal
Sprint Backlog      Sprint Goal
Increment           Definition of Done
```

**Events:**

```
Sprint              Sprint Planning       Daily Scrum
Sprint Review       Sprint Retrospective
```

**Pillars, values and principles:**

```
transparency, inspection, adaptation
Commitment, Focus, Openness, Respect, Courage
empiricism          lean thinking         self-managing        cross-functional
```

**Other nouns the bank uses:**

```
stakeholder         impediment            Product Backlog refinement
timebox             done                  usable
```

## Three terms that are NOT in the 2020 Guide, and must not be sourced from it

Stating these so nobody goes looking and then invents one:

| term | status |
|---|---|
| **velocity** | absent from the 2020 Guide. A house term. Needs a house ruling, not a lookup |
| **story points** | absent. Same |
| **"potentially releasable"** | **2017 wording, removed in 2020.** The 2020 Guide says an Increment must be **usable**. Two SM-AI-I items (`c389caa1`, `85474389`) still carry it in English -- see `EN-DEFECTS-SAMPLE.md` |

## And one rule that needs no guide

Already ruled and implementable now, recorded in the glossary under
`families.scrum_2020.ruled_without_the_guides`:

- **In pt-BR, Sprint is feminine: `a Sprint`.**
- **On first use in a stem, the official term carries the English in parentheses** --
  `Objetivo del Sprint (Sprint Goal)`, `Definição de Pronto (Definition of Done)`.
- The three accountabilities stay in English.

None of that is linted yet, because the lint's Scrum family is empty by design: a rule enforced against
a term nobody has verified would assert an official rendering we do not hold, which is the defect this
whole section exists to avoid.
