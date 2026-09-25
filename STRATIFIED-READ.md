# Stratified read -- mechanical checks over the never-reviewed corpus

Measured 2026-09-25. **Report only. Nothing was fixed.**

```
population    917 never-reviewed translated lesson rows
characters    12,068,433
strata        14 generation runs
```

## The frame is five times what the withheld subset suggested

The three strata were derived from the never-reviewed **and withheld** rows: 174 across
three runs. The never-reviewed population as a whole is **917 rows across 14 runs** --
most of them SERVING, because `mcp_translation_review_required` is false on their groups, so
no review was ever required of them.

The checks below cover all 917. The paired sample covers the three named runs. Whether to
widen the reading frame is the decision this number exists to inform.

## Flags per stratum and language, as a rate

Flags per 10,000 characters. Raw counts would rank the runs by which one was bigger.

| stratum | lang | rows | chars | structure | accent | modal | convem | cia | ceiling | ratio | language | /10k |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AIE-I 2026-07-20 | es-419 | 16 | 148,916 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | **0.27** |
| AIE-I 2026-07-20 | pt-BR | 16 | 145,899 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | **0.41** |
| AIGRM-I 2026-07-09 | es-419 | 49 | 568,992 | 1 | 1 | 15 | 0 | 0 | 0 | 0 | 0 | **0.30** |
| AIGRM-I 2026-07-09 | pt-BR | 49 | 550,044 | 1 | 4 | 19 | 0 | 0 | 0 | 0 | 0 | **0.44** |
| AIHR-I 2026-07-26 | es-419 | 28 | 398,619 | 0 | 4 | 10 | 0 | 0 | 0 | 0 | 0 | **0.35** |
| AIHR-I 2026-07-26 | pt-BR | 28 | 385,164 | 0 | 12 | 13 | 0 | 0 | 0 | 0 | 0 | **0.65** |
| AIMS-F 2026-08-07 | es-419 | 35 | 535,169 | 1 | 6 | 4 | 0 | 0 | 0 | 0 | 0 | **0.21** |
| AIMS-F 2026-08-07 | pt-BR | 35 | 518,649 | 1 | 6 | 9 | 11 | 0 | 0 | 0 | 0 | **0.52** |
| AIMS-IA 2026-09-12 | es-419 | 30 | 564,929 | 0 | 9 | 1 | 0 | 0 | 0 | 0 | 0 | **0.18** |
| AIMS-IA 2026-09-12 | pt-BR | 26 | 463,780 | 1 | 8 | 2 | 22 | 0 | 0 | 0 | 0 | **0.71** |
| AISM-I 2026-07-18 | es-419 | 61 | 607,580 | 0 | 3 | 10 | 0 | 0 | 0 | 0 | 0 | **0.21** |
| AISM-I 2026-07-18 | pt-BR | 61 | 589,461 | 0 | 3 | 17 | 0 | 0 | 0 | 0 | 0 | **0.34** |
| ISMS-F 2026-08-05 | es-419 | 46 | 553,016 | 0 | 1 | 8 | 0 | 1 | 0 | 0 | 0 | **0.18** |
| ISMS-F 2026-08-05 | pt-BR | 46 | 537,728 | 0 | 5 | 11 | 2 | 0 | 0 | 0 | 0 | **0.33** |
| ISMS-IA 2026-08-12 | es-419 | 34 | 572,362 | 4 | 1 | 1 | 0 | 0 | 1 | 1 | 0 | **0.14** |
| ISMS-IA 2026-08-12 | pt-BR | 31 | 502,233 | 4 | 6 | 4 | 7 | 0 | 1 | 1 | 0 | **0.46** |
| SD-AI-I 2026-07-05 | es-419 | 44 | 489,503 | 3 | 1 | 8 | 0 | 0 | 0 | 0 | 0 | **0.25** |
| SD-AI-I 2026-07-05 | pt-BR | 44 | 471,688 | 3 | 3 | 16 | 0 | 0 | 0 | 0 | 0 | **0.47** |
| SM-AI-I 2026-05-23 | es-419 | 9 | 117,197 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.43** |
| SM-AI-I 2026-05-23 | pt-BR | 9 | 115,449 | 5 | 2 | 4 | 0 | 0 | 0 | 0 | 0 | **0.95** |
| SM-AI-I 2026-05-24 | es-419 | 16 | 207,178 | 4 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | **0.29** |
| SM-AI-I 2026-05-24 | pt-BR | 16 | 201,841 | 4 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | **0.40** |
| SM-AI-I 2026-06-15 | es-419 | 6 | 67,999 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.00** |
| SM-AI-I 2026-06-15 | pt-BR | 6 | 65,678 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.00** |
| SM-AI-II 2026-09-12 | es-419 | 44 | 924,441 | 0 | 6 | 2 | 0 | 0 | 0 | 0 | 0 | **0.09** |
| SM-AI-II 2026-09-12 | pt-BR | 44 | 891,153 | 0 | 2 | 11 | 0 | 0 | 0 | 0 | 0 | **0.15** |
| SPO-AI-I 2026-06-21 | es-419 | 44 | 444,479 | 0 | 4 | 11 | 0 | 0 | 0 | 0 | 0 | **0.34** |
| SPO-AI-I 2026-06-21 | pt-BR | 44 | 429,286 | 0 | 5 | 20 | 0 | 0 | 0 | 0 | 0 | **0.58** |

## What each column is worth

| check | flags | what it is |
|---|---|---|
| structure | 37 | **a finding, and the cheapest one here** |
| accent | 94 | candidates; 1,000 before the members were read |
| modal | 210 | **a RANKING, not a defect list** -- see below |
| convem | 42 | placement, pt-BR only |
| ceiling | 2 | a span over the language allowance |
| ratio | 2 | a span over the p95 quote ratio |
| cia | 1 | CIA vocabulary with no CIA term in the English |
| language | 0 | reads as the wrong language |

## Structure -- 37 flags, and this is the real yield

```
  headings    14
  listItems   13
  quotes      8
  directives  2
```

These are `baseline` rows: 367 stamped them without anybody establishing that each
translation ever tracked its English. A heading present in English and absent from BOTH
translations, or a blockquote the translation has and the English does not, is a divergence
no paragraph-level read would find. It needs no model and no index.

Examples:

- `05-08-terminology-drift` / pt-BR -- headings en=1 tr=0
- `isms-ia-04-05-competence-awareness-documents` / pt-BR -- quotes en=0 tr=1
- `01-05-who-the-developers-are` / es-419 -- headings en=1 tr=0
- `05-08-terminology-drift` / es-419 -- headings en=1 tr=0
- `04-09-monitoring-incident-response` / es-419 -- listItems en=10 tr=9
- `isms-ia-05-05-fixing-it-and-fixing-it` / pt-BR -- quotes en=2 tr=1
- `isms-ia-04-05-competence-awareness-documents` / es-419 -- quotes en=0 tr=1
- `isms-ia-01-03-objectivity-of-the-assignment` / pt-BR -- quotes en=2 tr=3
- `04-07-control-overlap-with-27001` / pt-BR -- listItems en=14 tr=13
- `04-09-monitoring-incident-response` / pt-BR -- listItems en=10 tr=9
- `isms-ia-04-01-what-the-scope-left-out` / es-419 -- quotes en=3 tr=2
- `isms-ia-01-03-objectivity-of-the-assignment` / es-419 -- quotes en=2 tr=3

## Accent -- 1,000 flags became 94, by reading them

The first run reported **1,000**. The top members were `items` 238, `hacia` 214,
`estas` 128, `seria` 86 -- diacritic pairs, part-of-speech pairs, and English
loanwords sitting in translated prose against their accented Spanish cognates. The
5,569-to-36 finding, arriving again in a new place.

Two narrowings, both DECLARED rather than inferred:

- the missing diacritic and part-of-speech members added to `lib/accent-classes.mjs` by
  name, each with the count that justified it;
- **a token the row's own English carries is a loanword in context, not a dropped accent.**
  A per-row test needing no dictionary, because the English sibling is already in hand.

Survivors, which read as genuine:

```
    16  pt-BR analise
    12  es-419 formula
     8  pt-BR secao
     8  pt-BR influencia
     4  pt-BR referencia
     4  es-419 diagnostica
     4  pt-BR sequencia
     3  es-419 publicas
     3  pt-BR formula
     3  pt-BR divida
     3  es-419 perdida
     2  es-419 confiaran
     2  es-419 clausula
     2  pt-BR negligencia
     2  es-419 incomoda
     1  pt-BR estao
```

A residue of the part-of-speech class survives -- `divida`, `perdida`, `publicas`,
`incomoda` are all pairs where both members are words. They are candidates for a human,
not defects, and the list says so rather than guessing.

## The modal column is a RANKING and must not be read as 210 defects

It compares modal COUNTS across a whole body: `should` in the English against obligation
forms in the translation. A `should` in paragraph 2 and a `deve` in paragraph 9 are not
necessarily the same sentence, so this is a document-level heuristic that points at rows
worth reading. Settling one needs sentence alignment, which is what the paired sample is for.

It skews pt-BR, consistent with ABNT rendering `should` as `deve` in registers where
`convem que` would be the careful form -- the same construction the batch review corrected
three times by hand.

## What none of this can do

Every check compares a translation with its **English**. None can see a translated
reproduction of ISO text, because the leak index holds English editions only and a
translated quotation scores zero by construction. Unchanged, and still the largest of the
three coverage gaps this repository records.
