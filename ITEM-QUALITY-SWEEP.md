# How bad are the 18,485 unreviewed translated items?

**Not bad. Nothing found in this sweep changes what a single item tests.**

Measured 2026-09-25. Read-only, heavy-reader lock held, every read paged with a
count assertion. Field grain: stem, each option paired **by id**, explanation —
110,880 field comparisons. Full enumeration in `ITEM-QUALITY-SWEEP.json`;
`CUE-EXPANSION.json` carries the cue distribution.

Exposure is answered separately in `ITEM-EXPOSURE.md`.

---

## 1. The load-bearing result: the answer keys are intact

| check, over 18,480 paired translated items | failures |
|---|---|
| option count differs from English | **0** |
| option id set differs | **0** |
| **answer key points at a different id** | **0** |
| an option duplicated within the item | **0** |
| an option empty | **0** |
| the field is a model refusal rather than a translation | **0** |
| a control or zero-width byte anywhere | **0** |

**Every secure key-integrity failure, as asked: there are none.** Not in the
exam pool, not in practice, in neither language.

**Two independent instruments, because this is the claim everything else rests
on.** The JS sweep (paged PostgREST, id-paired) and a pure-SQL comparison agree
at 18,480 — and the numbers reconcile exactly: 18,485 translated rows minus the
5 with no English sibling. Both carry a positive control: the SQL predicates
were re-run against a row perturbed in memory (an option dropped, the key moved)
and **both fired**. A zero from a probe that cannot fire is not a zero.

## 2. 5,546 rows carry a flag. I read the members of every class, and they are
   overwhelmingly the instrument, not the item.

A count is read before it is reported. Per class, what the members turned out to
be. **The flag counts are as the gates stand now, after the §4 repairs; the
reading was done on the pre-repair output, which is why G3 carries two numbers.**

| class | flags | read | verdict |
|---|---|---|---|
| `G7-pin` standard -> norma | 2,366 | 4 | **noise.** Fires on the ordinary sense of "standard" — *a standard chatbot*, *not a standard requirement*, *fails the plain-explanation standard* |
| `cue-introduced` (secure 828 + practice 1,076) | 1,904 | 10 | **79% artifact** — see §3 |
| `G3-modal` | 806 -> **286** | 8 | the 806 was a **broken gate**, now repaired (§4). Of the members read, 8 of 8 were English-side pattern gaps: `requires`, `to be determined`, `would need to`, `is therefore required` were all absent from `DEONTIC_EN` |
| `pin-other` coined acronym `SGAI` | 497 | 3 | **real, and a decision not a defect** — see §5 |
| `G4-term` retained/maintained | 223 | 6 | **5 of 6 noise.** Fires on English "retain" in any sense: a context window, ML features, operational control, keeping a standard in a criteria set |
| `accent` | 194 | 6 | **6 of 6 noise.** All are correct verb forms — `se limite`, `referencia`, `evidencia`, `sequencia`, and `analise`, the subjunctive after *exige que* that CLAUDE.md already records by name |
| `inserted-obligation` | 1 | 1 | **noise.** English *"on a rolling basis"* -> *"de forma contínua"*. The English does state a cadence; the source pattern does not know that phrasing |
| `pin-other` other | 114 | — | `alinea` leaking into es (51), `problemas/asuntos` for *issues* (56), `ISMS` untranslated (5) |

**Not one read member was a defect that changes what the item tests.**

## 3. The cue finding is a threshold artifact, and the population says so

`auditItem` compares `key length - longest rival` against an **absolute**
character margin calibrated on English. Spanish and Portuguese expand:

```
expansion, translated characters / English characters
  es-419   mean 1.210   median 1.205   p90 1.312
  pt-BR    mean 1.148   median 1.144   p90 1.236
```

So a key already 10 characters ahead in English is ~25 ahead in Spanish with no
change in balance at all. In all ten secure examples read, **the English key was
already the longest option.**

Measured relatively — key length as a ratio of its longest rival, translated
minus English — over the whole population of 18,480:

```
                mean      sd      p50       p90      p99
  es-419      -0.0282  0.1005  -0.0290   0.0991   0.2237
  pt-BR       -0.0227  0.0956  -0.0259   0.1015   0.2170
```

**The median is negative in both languages: translation makes the key *less*
dominant relative to its rivals, on average.** Against a population threshold of
mean + 2sd, 2.7% of items sit above it — which is about what an ordinary
distribution gives, so there is no cue population beyond ordinary variation.

Of the 1,904 items the absolute guard flagged, **1,501 (79%) are explained by
expansion alone** and do not move on the relative measure.

> There is no evidence of a translation-introduced answer cue anywhere in the
> corpus, and the absolute cue margin should not be applied to a translated item
> at all.

**NOT CHANGED, deliberately (ruled 2026-09-25).** `CUE_CFG`'s `KEY_LEN_MARGIN`,
`KEY_LEN_PCT` and `LEN_SPREAD_MAX` stay as they are. They are **calibrated on
English**, they govern the English authoring path where they are sound, and
moving them under time pressure would change what the generator accepts for a
corpus this sweep says nothing about.

> **A relative margin is needed before the cue guard is used on a translation at
> all**, and until one exists, a cue finding on a translated item is a finding
> about character counts. The note belongs beside the constant, not only here.

## 4. Three instrument defects found and repaired, all live in the lesson pipeline

**(a) `render-gates.mjs` G3 had no word boundaries. At all.**

```js
const L = "\p{L}\p{N}_";          // <- inside a STRING, \p is not an escape
```

The backslash is dropped, so `L` is the literal six-character set
`{p, {, L, }, N, _}` and the lookarounds guard against nothing. Measured:

```
"o dever do analista"       -> MATCH "deve"
"un nuevo deber de"         -> MATCH "debe"
"permitem que o conjunto"   -> MATCH "tem que"
```

This is the `\b`-is-ASCII-only defect in a new costume, and **invariant 13 could
not see it**: that guard looked for `\b` beside a non-ASCII letter in a *regex
literal*, and this is a lookbehind assembled from a *string* with no `\b`
anywhere. A mangled escape that still parses is the worst kind.

**FIXED 2026-09-25, approved, with the regression run first.** The measured path,
both halves separately attributable:

```
806   the shipped gate, boundaries dead
350   boundaries fixed, English list unchanged        -57%
286   boundaries fixed AND the English list widened   -64% overall
```

**Regression before landing: 38 subjects the pipeline has already accepted —
batch `cda6698a`'s 30 renderings plus the 8 own-work rows — through G1–G7,
Check A, Check B and Check D. 0 findings added, 0 removed.** No new refusal on
accepted text, which was the condition for landing it.

**And the guard, once extended, found two more live instances of the same
defect** — see §4(c).

**(b) `DEONTIC_EN` is much narrower than `DEONTIC_TR`.** The Spanish and
Portuguese lists carry twelve forms each; the English list does not know
`requires`, `require`, `needs to`, `to be <verb>ed`, or an adverb between *is*
and *required*. That asymmetry makes G3 report "the translation added an
obligation" whenever the English expressed it in a form the list lacks — which
is all eight members I read. Same family as the guard that contradicts itself
across languages, already in CLAUDE.md.

**FIXED in the same change**: `requires`, `is required to`, `needs to`, `need to`
and `to be determined` are now in `DEONTIC_EN`, each with a positive fixture (the
English form must suppress the gate) **and** a negative one (the same translation
against English with the obligation removed must still fire — a one-sided fixture
passes on a pattern that matches everything). That widening is the 350 → 286 step.

**Residual, named rather than silently left:** an adverb between *is* and
*required* — *"Disclosing AI use is therefore required"* — is still not matched.
It was one of the eight members read. Not added, because it needs a pattern with
interior `\s+` rather than another literal, and that is a change to the shape of
the list rather than an entry in it.

**(c) And the extended guard found two more instances of the identical defect**,
on its first clean run:

| | |
|---|---|
| `scripts/lib/translation-checks.mjs:116` | `const LW = "\p{L}\p{N}_"` — **the same broken repair, written twice**, under a byte-identical comment explaining the `\b` defect it was fixing. This is Check A and Check B |
| `scripts/regenerate-moved-english.mjs:448` | `"(^|[^\p{L}])"` compiled to a negated set of five literal characters, which nearly every character satisfies — so the CIA-collision guard matched inside longer words and over-reported |

**Two hand-written copies of one idea were wrong in the same way at the same
time, which is exactly why neither disagreed with the other.** This repository's
most reliable detector — one implementation of a property contradicting another
— cannot fire when both copies carry the same bug. Both fixed, both inside the
same regression, `\p{M}` included in all three.

The comment stripper that both invariant 10 and invariant 13 now need moved to
`scripts/lib/js-source.mjs` rather than being copied a second time.

## 5. The two findings that are about content, not instruments

### UNCHECKABLE — five SM-AI-I practice items exist only in Spanish

**This is their own state, not a clean result and not a defect.** Created
2026-09-18, `approved`, serving. No English sibling has ever existed and no
pt-BR either — so these are Spanish-**origin** items, not translations. Every
gate in this sweep works by comparing a translation against its English, so
**none of them examined these five rows at all**: key integrity, G1–G7, Check A
and Check B are all structurally blind here, and reporting them as "0 findings"
would be a vacuous pass over an empty comparison.

They are also invisible to the three-language coverage check, which groups by
`question_group_id` and finds a group of one.

**Ruled 2026-09-25: they join the read queue after the 342 exposed items.** A
human reading the Spanish against the blueprint is the only instrument that
reaches them.

```
SM-AI-I practice es-419  02517a54-ee1d-49cb-8c7c-7a885c9a701a
SM-AI-I practice es-419  53721438-4cfc-4717-b8e6-c7842a99eb3c
SM-AI-I practice es-419  a5ddf1c0-5daf-4e77-ac7a-84670e3ba522
SM-AI-I practice es-419  f2904532-8cd0-48e3-99bc-1dcaf33467fa
SM-AI-I practice es-419  fe5ab1f8-f12f-48ea-ba6a-592bf79e20fe
```

**`SGAI` is a coined acronym used 497 times.** Consistent across certifications
and both languages, sitting beside `SGSI` — which is the established rendering
of ISMS in ISO's own Spanish. `SGAI` is the parallel coinage for AIMS and no
published standard uses it. That is a house-convention decision for you, not a
defect: it is internally consistent and a reader meets the same term everywhere.

## 6. Per certification x pool x language

Columns after `flag` are flags, not rows. `G3ok` is the corrected-boundary G3.

```
cert      pool      lang      rows  flag  K-int cue/sec cue/pra   G3  G4   G7   pin  acc  unal
AIE-I     practice  es-419     180    42      0       0      18    0   0   16    0    0     0
AIE-I     practice  pt-BR      180    44      0       0      17    2   0   16    0    0     0
AIE-I     secure    es-419     144    31      0      16       0    0   1    7    1    1     0
AIE-I     secure    pt-BR      144    26      0      15       0    0   0    7    0    0     0
AIGRM-I   practice  es-419     510   160      0       0      57    2   5   94    5    1     0
AIGRM-I   practice  pt-BR      510   161      0       0      44    4  14   88    3    6     0
AIGRM-I   secure    es-419     459   145      0      40       0    5  10   63    2    0     0
AIGRM-I   secure    pt-BR      459   138      0      37       0    3   9   54    0    7     0
AIHR-I    practice  es-419     280    93      0       0      26    2   1   53    1    0     0
AIHR-I    practice  pt-BR      280   109      0       0      23    3  12   57    0   19     0
AIHR-I    secure    es-419     224    62      0      16       0    2   4   39    0    0     0
AIHR-I    secure    pt-BR      224    76      0      17       0    2   4   41    0   23     0
AIMS-F    practice  es-419     350   119      0       0      35    3   4   89    8    0     0
AIMS-F    practice  pt-BR      350    98      0       0      34    2  10   34    2    7     0
AIMS-F    secure    es-419     280   118      0      36       0    2   1   69   25    2     0
AIMS-F    secure    pt-BR      280    73      0      28       0    0  10   14    0    7     0
AIMS-IA   practice  es-419     400   185      0       0      74   16   6   36   93    0     0
AIMS-IA   practice  pt-BR      400   192      0       0      61   14   7   47  121   26     0
AIMS-IA   secure    es-419     320   137      0      41       0   16   2   23  105    0     0
AIMS-IA   secure    pt-BR      320   146      0      33       0   12   4   27  102   25     0
AISM-I    practice  es-419     610   170      0       0      75    5  13   59    3    0     0
AISM-I    practice  pt-BR      610   177      0       0      64    3  21   90    0    2     0
AISM-I    secure    es-419     488   132      0      53       0    5   4   40    2    0     0
AISM-I    secure    pt-BR      488   136      0      39       0    5  16   59    0    0     0
ISMS-F    practice  es-419     490   125      0       0      34    9   5   54   12    0     0
ISMS-F    practice  pt-BR      490   115      0       0      28    4   7   45    0    3     0
ISMS-F    secure    es-419     392   105      0      37       0    8   4   51   12    0     0
ISMS-F    secure    pt-BR      392    86      0      31       0    2   8   30    0    1     0
ISMS-IA   practice  es-419     380   123      0       0      59   13   4   39   32    2     0
ISMS-IA   practice  pt-BR      380   114      0       0      54    5   7   37   23   14     0
ISMS-IA   secure    es-419     304    98      0      47       0    8   3   29   17    0     0
ISMS-IA   secure    pt-BR      304    92      0      45       0    6   4   28   18   10     0
SD-AI-I   practice  es-419     450   124      0       0      44    4   0   42    3    3     0
SD-AI-I   practice  pt-BR      450   130      0       0      52    9   1   42    0    2     0
SD-AI-I   secure    es-419     360   106      0      35       0    7   0   29    1    0     0
SD-AI-I   secure    pt-BR      360   108      0      42       0    4   1   30    0    4     0
SM-AI-I   practice  es-419     525   112      0       0      31    8   1   43    2    1     5
SM-AI-I   practice  pt-BR      520   116      0       0      33    7   3   48    0    0     0
SM-AI-I   secure    es-419     458   113      0      38       0    9   1   56    5    1     0
SM-AI-I   secure    pt-BR      458   112      0      36       0    6   3   55    0    1     0
SM-AI-II  practice  es-419     440   168      0       0      54   14   2  129    1    2     0
SM-AI-II  practice  pt-BR      440   174      0       0      53   16   3  148    0    5     0
SM-AI-II  secure    es-419     352   108      0      39       0   11   1   79    5    3     0
SM-AI-II  secure    pt-BR      352   128      0      43       0   11   2   88    0    6     0
SPO-AI-I  practice  es-419     460   110      0       0      52    5   0   40    7    3     0
SPO-AI-I  practice  pt-BR      460   118      0       0      54    4   4   41    0    2     0
SPO-AI-I  secure    es-419     389   101      0      33       0    5   0   30    0    2     0
SPO-AI-I  secure    pt-BR      389    90      0      31       0    3   1   31    0    3     0
                             18485  5546      0   <- totals: rows, rows flagged, key-integrity failures
```

AIMS-IA carries the highest `pin-other` load, and it is the acronym convention
rather than a quality difference. Counted directly rather than inferred from the
`pin` column, which also holds other rules:

```
SGAI flags   AIMS-IA 412    ISMS-IA 79    AIGRM-I 6    total 497
```

## 7. What this licenses

- **The item gate is not an emergency.** The failure mode people feared —
  a translated exam item scoring a candidate against a different answer — does
  not occur anywhere in 18,480 comparisons, confirmed two ways with controls.
- **A review gate built on these gates would mostly refuse correct items.**
  G7 at 2,366, G4 at 223 and accent at 194 are dominated by false positives at
  item grain. Wiring `item_translation_reviews` into the fetch path today would
  withhold a large amount of sound content for reasons that are not defects, and
  a gate that over-refuses is the conservative error this codebase records as
  the hardest to notice, because nobody investigates a refusal.
- **The cheap, high-value work is the instruments, not the corpus**: the G3
  boundary fix, the `DEONTIC_EN` asymmetry, a relative cue margin, and scoping
  `standard -> norma` and `retain` to their ISO senses.

## 8. Limits, stated

- **These are mechanical checks. None of them reads for meaning.** A fluent,
  correctly-keyed translation that says something other than the English is
  invisible to every check here — the "wrong object" rung of the ladder in
  CLAUDE.md. Only a bilingual reader finds that, and this sweep is not evidence
  about it.
- **The accent floor is 3 characters**, which hides `é`, `há`, `já`, `só`, `à`,
  `às`, `dá`, `lá`, `pé` in pt-BR and `él`, `tú`, `sí`, `sé`, `dé` in es-419.
  Listed rather than left implicit.
- **`explanation` and `stem` are compared whole**, not sentence-aligned, so a
  modal inserted into a long explanation whose English has a modal elsewhere is
  still undetectable. Field grain fixed that for options; it does not fix it
  inside a 900-character explanation.
- **The 5 Spanish-origin items were not checked against anything**, because
  there is nothing to check them against. That is UNALIGNABLE, not clean.
