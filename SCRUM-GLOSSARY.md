# The Scrum glossary family, and the decision it surfaced

Seeded 2026-09-28 from `reference/scrum-guide-2020-es-419.pdf` and `-pt-br.pdf`, and from a census of
our own 6,847 translated rows on the four Scrum certifications.

> **The official translations and our corpus disagree, and our corpus is nine thousand occurrences
> deep in its own convention. That is a decision for you, not for a glossary seeding.**

## What the official guides say

Read off the two PDFs with `pdftotext`, counted:

| term | official es-419 | official pt-BR |
|---|---|---|
| Product Backlog | `Product Backlog` (33) | `Product Backlog` (33) |
| Sprint Backlog | `Sprint Backlog` (15) | `Sprint Backlog` (15) |
| Increment | `Increment` (27) | **`Incremento`** (25) |
| Product Owner / Scrum Master / Developers / Scrum Team | English | English |
| Sprint Planning / Daily Scrum / Sprint Review / Sprint Retrospective | English | English |
| Sprint Goal | **`Objetivo del Sprint`** (24) | **`Meta da Sprint`** (24) |
| Product Goal | **`Objetivo del Producto`** (21) | **`Meta do Produto`** (13) |
| Definition of Done | **`Definición de Terminado`** (20) | **`Definição de Pronto`** (19) |
| stakeholders | `interesados` (12) | `stakeholders` (11) |

So both official editions keep the ROLES and the EVENTS in English and translate the three
goal/done terms. The two editions disagree with each other on `Increment` and on `stakeholders`.

## What our corpus does

| term | house form here | the official rendering here |
|---|---|---|
| Sprint Goal (es) | **`Sprint Goal` 1,780** | `Objetivo del Sprint` 9 |
| Sprint Goal (pt) | **`Sprint Goal` 1,782** | `Meta da Sprint` **0** |
| Product Goal (es) | **`Product Goal` 544** | `Objetivo del Producto` 2 |
| Product Goal (pt) | **`Product Goal` 548** | `Meta do Produto` **0** |
| Definition of Done (es) | **`Definition of Done` 1,934** | `Definición de Terminado` **0** |
| Definition of Done (pt) | **`Definition of Done` 1,888** | `Definição de Pronto` 2 |
| Increment (pt) | **`Increment` 1,459** | `Incremento` 5 |

**Encoding the official renderings as the house form would have fired on roughly nine thousand
occurrences** -- the convention itself. That is the slug-derived-name defect at five times the
scale: a guard that fires on the normal case is deleted by the first person it inconveniences, and
its deletion takes the real assertion with it.

The corpus convention is also internally consistent across all four certifications and agrees with
the `PIN_LOAN` / `PIN_FULL` rules already recorded in `scripts/lib/item-translation.mjs`. It was not
an accident.

> **THE OPEN DECISION.** Either our translations should move to the official ISO-equivalent
> renderings -- roughly 9,000 occurrences across four live certifications, most of them secure --
> or the house convention stands and the guides are a reference for meaning rather than for
> spelling. **Nothing has been changed either way.** The glossary records the house form and says,
> in its own `house_form_note`, that it differs from the official translation and why.

## What was seeded, with its firing count

Measured in the same commit, and the counts came back exactly as declared.

| term | severity | fires | why |
|---|---|---|---|
| `scrum-team` | flag | 124 | `Equipo Scrum` 49, `Equipe Scrum` 47, `Time Scrum` 28 against ~1,030 `Scrum Team` per language -- 4 to 7 percent |
| `developers-es` | flag | 506 | Spanish only: `Desarrolladores` 500 against `Developers` 2,357 |
| `development-team-retired` | **failure** | **8** | `Equipo de Desarrollo` 6, `Time de Desenvolvimento` 2 |

**`Developers` is gated in Spanish and NOT in Portuguese**, because pt-BR runs 1,504 `Developers`
against 1,354 `Desenvolvedores`. That is a split corpus, not a convention with exceptions, and
gating it would refuse 47 percent of the rows. The two languages genuinely differ and the entry
says so rather than averaging them into a rule that is wrong for both.

**Only `development-team-retired` is a failure**, and it is the one entry that is not a register
choice: the 2020 Guide retired `Development Team` as a role -- the Scrum Team has no sub-team -- so
an item using it is testing a role the current Guide does not contain. Eight occurrences. Not
auto-fixed, because the phrase sometimes appears inside a distractor that is wrong on purpose, and
only a read tells those apart.

## The gender rule that is not there

`Sprint` takes OPPOSITE genders in the two official editions, and neither is unanimous:

```
es-419   el sprint 64   la sprint 17
pt-BR    a sprint  71   o sprint  15
```

A gender rule would fire on the official translation itself. There is none, and the reason is
recorded in the family rather than left for someone to rediscover.

## Everything the census found at one to five occurrences

`Backlog del Producto` 1, `Backlog do Produto` 1, `Backlog del Sprint` 2, `Backlog do Sprint` 2,
`Incremento` (es) 5, `Definición de Listo` 2, `Reunião Diária` 1, `Planificación del Sprint` 4,
`Planejamento do Sprint` 2, `Revisión del Sprint` 1, `Revisão do Sprint` 1, `Objetivo da Sprint` 1,
`Objetivo do Produto` 1.

**Left alone deliberately.** A rule fitted to five rows cannot be distinguished from a rule fitted
to noise, and the firing-count discipline says so in both directions: too many fires is a design
error, and a rule with almost none is fitted to its training set.
