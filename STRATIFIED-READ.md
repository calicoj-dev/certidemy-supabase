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

| stratum | lang | rows | chars | structure | accent | modal-sentence | defined-term | register | convem | cia | ceiling | ratio | language | /10k |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AIE-I 2026-07-20 | es-419 | 16 | 148,916 | 0 | 1 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | **0.34** |
| AIE-I 2026-07-20 | pt-BR | 16 | 145,899 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.27** |
| AIGRM-I 2026-07-09 | es-419 | 49 | 568,992 | 1 | 1 | 15 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | **0.42** |
| AIGRM-I 2026-07-09 | pt-BR | 49 | 550,044 | 1 | 4 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.40** |
| AIHR-I 2026-07-26 | es-419 | 28 | 398,619 | 0 | 4 | 9 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | **0.58** |
| AIHR-I 2026-07-26 | pt-BR | 28 | 385,164 | 0 | 12 | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.60** |
| AIMS-F 2026-08-07 | es-419 | 35 | 535,169 | 1 | 6 | 7 | 6 | 2 | 0 | 0 | 0 | 0 | 0 | **0.41** |
| AIMS-F 2026-08-07 | pt-BR | 35 | 518,649 | 1 | 6 | 12 | 2 | 0 | 11 | 0 | 0 | 0 | 0 | **0.62** |
| AIMS-IA 2026-09-12 | es-419 | 30 | 564,929 | 0 | 9 | 11 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | **0.44** |
| AIMS-IA 2026-09-12 | pt-BR | 26 | 463,780 | 1 | 8 | 11 | 0 | 0 | 22 | 0 | 0 | 0 | 0 | **0.91** |
| AISM-I 2026-07-18 | es-419 | 61 | 607,580 | 0 | 3 | 12 | 0 | 13 | 0 | 0 | 0 | 0 | 0 | **0.46** |
| AISM-I 2026-07-18 | pt-BR | 61 | 589,461 | 0 | 3 | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.27** |
| ISMS-F 2026-08-05 | es-419 | 46 | 553,016 | 0 | 1 | 4 | 1 | 10 | 0 | 1 | 0 | 0 | 0 | **0.31** |
| ISMS-F 2026-08-05 | pt-BR | 46 | 537,728 | 0 | 5 | 6 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | **0.24** |
| ISMS-IA 2026-08-12 | es-419 | 34 | 572,362 | 4 | 1 | 1 | 13 | 7 | 0 | 0 | 1 | 1 | 0 | **0.49** |
| ISMS-IA 2026-08-12 | pt-BR | 31 | 502,233 | 4 | 6 | 2 | 0 | 0 | 7 | 0 | 1 | 1 | 0 | **0.42** |
| SD-AI-I 2026-07-05 | es-419 | 44 | 489,503 | 3 | 1 | 6 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | **0.43** |
| SD-AI-I 2026-07-05 | pt-BR | 44 | 471,688 | 3 | 3 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.28** |
| SM-AI-I 2026-05-23 | es-419 | 9 | 117,197 | 5 | 0 | 0 | 4 | 1 | 0 | 0 | 0 | 0 | 0 | **0.85** |
| SM-AI-I 2026-05-23 | pt-BR | 9 | 115,449 | 5 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.69** |
| SM-AI-I 2026-05-24 | es-419 | 16 | 207,178 | 4 | 1 | 3 | 11 | 1 | 0 | 0 | 0 | 0 | 0 | **0.97** |
| SM-AI-I 2026-05-24 | pt-BR | 16 | 201,841 | 4 | 0 | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | **0.59** |
| SM-AI-I 2026-06-15 | es-419 | 6 | 67,999 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | **0.44** |
| SM-AI-I 2026-06-15 | pt-BR | 6 | 65,678 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.00** |
| SM-AI-II 2026-09-12 | es-419 | 44 | 924,441 | 0 | 6 | 5 | 8 | 13 | 0 | 0 | 0 | 0 | 0 | **0.35** |
| SM-AI-II 2026-09-12 | pt-BR | 44 | 891,153 | 0 | 2 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.19** |
| SPO-AI-I 2026-06-21 | es-419 | 44 | 444,479 | 0 | 4 | 7 | 4 | 5 | 0 | 0 | 0 | 0 | 0 | **0.45** |
| SPO-AI-I 2026-06-21 | pt-BR | 44 | 429,286 | 0 | 5 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0.40** |

## A and B now measure the corpus, not their own strictness

```
aligned by sentence    617
aligned by block       292
refused                  8   (was 300)
```

Requiring equal SENTENCE counts refused A and B on **300 of 917 rows** -- a third of the
corpus unmeasured on the two checks that had found the worst defects. Translation splits
and merges sentences; that is normal, and an aligner demanding equality was measuring its
own strictness rather than the text.

A BLOCK is small enough: inside one paragraph, `should` in the English and `debe` in the
translation are the same statement in every case that matters. **292 of the 300 became
measurable**, and the 8 that remain are the structure finding, refused as they should be.

The newly measured rows carried real findings: modal-sentence went 134 to 199 and
defined-term 38 to 57. Those were not absent before; they were unexamined.

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

## Per-stratum verdict -- hand-edit, regenerate, or clear

A stratum is CLEARED when the checks report nothing material **and** a fresh random half
reads clean. **No stratum can be cleared today**, because the random half has not been
re-read since checks A to D existed -- the reading that produced them was against the
older set. The column below is therefore hand-edit or regenerate, and the clear column
waits on a read.

**The density threshold is retired.** A cut producing one answer for every stratum was
reported as a broken threshold; it is not. The densest stratum is sparse, and every flag
names its sentence or its block. Regeneration is warranted where defects are DENSE or
CANNOT BE LOCATED, and neither is true anywhere. The rule is now:

- **REGENERATE** when the English moved (provenance), or when the body cannot be aligned,
  so the defects cannot be located.
- **Targeted fix** otherwise.

Density is still reported, because it sizes the work even when it does not decide it.

| stratum | rows | material flags | /10k | rows clean | verdict |
|---|---|---|---|---|---|
| AIE-I 2026-07-20 | 32 | 41 | **1.39** | 0/32 | targeted fix |
| AIGRM-I 2026-07-09 | 98 | 144 | **1.29** | 0/98 | targeted fix |
| AIHR-I 2026-07-26 | 56 | 102 | **1.30** | 0/56 | targeted fix |
| AIMS-F 2026-08-07 | 70 | 124 | **1.18** | 0/70 | targeted fix |
| AIMS-IA 2026-09-12 | 56 | 123 | **1.20** | 0/56 | targeted fix |
| AISM-I 2026-07-18 | 122 | 166 | **1.39** | 0/122 | targeted fix |
| ISMS-F 2026-08-05 | 92 | 122 | **1.12** | 0/92 | targeted fix |
| ISMS-IA 2026-08-12 | 65 | 110 | **1.02** | 0/65 | REGENERATE (4 unalignable) |
| SD-AI-I 2026-07-05 | 88 | 122 | **1.27** | 0/88 | targeted fix |
| SM-AI-I 2026-05-23 | 18 | 32 | **1.38** | 0/18 | REGENERATE (4 unalignable) |
| SM-AI-I 2026-05-24 | 32 | 64 | **1.56** | 0/32 | targeted fix |
| SM-AI-I 2026-06-15 | 12 | 15 | **1.12** | 0/12 | targeted fix |
| SM-AI-II 2026-09-12 | 88 | 137 | **0.75** | 0/88 | targeted fix |
| SPO-AI-I 2026-06-21 | 88 | 125 | **1.43** | 0/88 | targeted fix |

**The threshold is 1.0 material flags per 10,000 characters, and it is a judgement with a
reason rather than a measurement.** Above it, fixing sentence by sentence costs more than
regenerating and re-reviewing; below it, every flag is pinpointed to a sentence, which
makes a hand-edit both cheaper and safer than replacing text a human has already read.

## What none of this can do

Every check compares a translation with its **English**. None can see a translated
reproduction of ISO text, because the leak index holds English editions only and a
translated quotation scores zero by construction. Unchanged, and still the largest of the
three coverage gaps this repository records.
