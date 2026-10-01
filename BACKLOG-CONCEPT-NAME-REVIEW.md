# Backlog: the 440 provisional concept names now being served

**Queued, not done. Ruled 2026-10-01:** *"440 provisional concept names: showing them is correct, as you did.
Queue a review of those 440 for later, not now."*

---

## What is being served, and why that is right

`score-mock-exam`, the blueprint page and the module dashboard now render
`concept_translations.name` for the learner's language, falling back to English only when the name is
**missing**. 1,730 concepts carry an es-419 and a pt-BR name, so nothing falls back.

**440 of those 3,460 rows are `is_provisional`** — a machine translation no human has read. They are served
anyway, deliberately:

- the concept review gate governs **descriptions** served to partners through MCP, which is an evidentiary
  surface with a partner on the other end;
- a **name** is a short label on the learner's own results page;
- an unreviewed Spanish label beats a reviewed English one on a Spanish page, which is the defect the whole
  round was fixing.

If that trade is ever ruled the other way it is **one predicate**, in `score-mock-exam`'s
`localizedName` map and in `lib/concepts/localized-name.ts`.

---

## The 440, by certification

```
cert        es-419  pt-BR
  AIE-I         0     47
  AIGRM-I       2      2
  AIMS-IA       0      2
  AISM-I        1      1
  ISMS-F      191    191
  ISMS-IA       3      0
  TOTAL       197    243   = 440
```

**ISMS-F is 382 of the 440 — 87 percent — and it is the same 191 concepts in both languages.** That is the
shape of the work: this is not 440 scattered judgements, it is one certification's concept set plus a
47-concept pt-BR gap on AIE-I and nine strays.

**And ISMS-F's concept names are the ones this repository already has a finding about.** CLAUDE.md records
that all 192 of its English descriptions are one sentence or fewer, median 59 characters, and that its
slug-derived names are 192 of 192 — the only certification at 100 percent. A review of its 191 provisional
translated names should be read **with** that, because a translated name derived from a slug-shaped English
name inherits the English defect: fixing the translation alone would make the Spanish better than its source,
which is the asymmetry this repository records as evidence about the ENGLISH.

---

## What a review has to decide, per name

Not "is this good Spanish" — these are machine translations of short labels and most will be fine. The three
questions that actually need a human:

1. **Is it a defined term?** An ISO defined term has a settled rendering in the standard's own Spanish and
   Portuguese editions, and we hold neither — so a name that is a defined term cannot be verified here and
   must be marked unverifiable rather than cleared. The leak index is English-only for the same reason.
2. **Does it keep a term that must stay English?** Scrum terms stay English, ruled. `Sprint Goal` translated
   to `Meta del Sprint` is a defect, and `lint-translation-terms` enforces it — but only where it runs.
3. **Is it a truncation rather than a loan?** CLAUDE.md's `PIN_FULL` / `PIN_LOAN` split: `el backlog` is what
   practitioners say, `el Goal` is `Sprint Goal` with the disambiguating word missing. The test is the missing
   word, not the Englishness.

---

## What this is NOT

- **Not a serving risk today.** Every one of the 440 renders a real label in the right language.
- **Not blocking anything.** The 46 accepted AIMS-F items, the exam results localization and the
  practice-locale fix are all independent of it.
- **Not measurable against the standards' own translations**, for the two languages that matter, because the
  index holds English editions only. A review can clear register and truncation; it cannot clear terminology
  against ISO's own Spanish.

## How to re-measure the count

```
node --dns-result-order=ipv4first -e "<the per-certification query in this file's git history>"
```

The number moves when `apply-concept-translation-review` clears rows, and it is the only number here worth
re-deriving rather than quoting: a count of provisional rows is a fact about a column, and this file is a
second copy of it.
