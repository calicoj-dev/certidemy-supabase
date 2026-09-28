# Scrum glossary: the terms needed, and the two files that now supply them

> **[THE GUIDES ARRIVED 2026-09-28. The paragraph below said they were not on disk, which is no longer
> true, and a false claim about present state is the thing this repository punishes hardest.]**
>
> ```
> reference/scrum-guide-2020-es-419.pdf    Latin South American Spanish
> reference/scrum-guide-2020-pt-br.pdf     Brazilian Portuguese, v3.0
> ```
>
> **These are NOT at the paths this file originally named** (`-es.pdf`, `-pt-BR.pdf`), and the files
> were kept rather than renamed. `es-419` is the locale code the platform actually uses, and a bare
> `-es` is the Spain/Latin-America ambiguity that has already cost something once: the EU AI Act's
> official Spanish edition is SPAIN Spanish, which is why the glossary records it as a reference and
> never a mandate. A filename that cannot express that distinction is the wrong filename. The doc is
> the second copy, so the doc moved.
>
> **The `scrum_2020` family is still EMPTY.** Having the guides is not having the terms: they have to
> be extracted, read and seeded, and the lint still checks none of them until that is done.

## Where they came from

Both are CC BY-SA 4.0, like the English one already tracked in `reference/`, so committing them is fine.

```
Scrum Guide 2020, Spanish     https://scrumguides.org/download.html  (Espanol)
Scrum Guide 2020, Portuguese  https://scrumguides.org/download.html  (Portugues do Brasil)
```

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
