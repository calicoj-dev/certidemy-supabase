# Translated quotation against its English — measured per span

**[REWRITTEN 2026-09-24. The first version of this file reported 21 rows as a surplus
finding. That conclusion is WITHDRAWN: it compared quote ratios against a whole-body
baseline, which is the wrong comparator, and it measured per ROW when the property is per
SPAN. Both corrections came from Juan's ruling; both were then measured, and both hold.]**

---

## §4.1 The comparator was wrong, and the size of the error is the point

The 1.09–1.11 expansion figure is whole-body: headings, markdown, code spans, slugs, none
of which expand. Quoted ISO text is the opposite — dense with English noun compounds.
Measured over the 75 lesson rows per language carrying 15+ English quoted words:

```
                 whole-BODY ratio      QUOTE ratio
                                    mean    p50    p90    p95    max
es-419                  1.090      1.201  1.114  1.338  1.563  3.038
pt-BR                   1.052      1.142  1.070  1.278  1.461  2.731
```

**The prediction was 1.2–1.3 with most of the 13 inside it. Measured: es mean 1.201, p90
1.338.** Against the correct baseline, 11 of the 13 ISO rows sit inside the distribution
and the whole row-level finding dissolves.

## §4.2 Span alignment, top three. Zero surplus in all three

No Spanish edition of the standard required. The question is whether the translation says
more than the English it came from, and that is answered by aligning the two.

**`isms-ia-04-04` es, ratio 1.63 — the highest row in the old report.**

```
en  obtain risk owners' approval of the information security risk treatment plan
    and acceptance of the residual information security risks                         19w
es  obtenga la aprobacion de los propietarios del riesgo del plan de tratamiento del
    riesgo de seguridad de la informacion y la aceptacion de los riesgos residuales
    de seguridad de la informacion                                                    31w
```

Element by element, nothing added:

```
information security risk treatment plan        5  ->  11
acceptance of the residual ... risks            7  ->  11
risk owners' approval                           3  ->   7
```

**Exactly the compound prediction.** 1.63 is what a faithful translation of 27001 6.1.3 e)
looks like.

**`isms-ia-01-04` es, 1.55.** `information and communications technology tools` 5 -> 9;
`artificial-intelligence-based evaluation tools` 4 -> 7. Zero surplus.

**`isms-ia-05-02-one-instance-or-a-pattern` es, 1.36.** 27001 cl.10.2 a) with all four
sub-items present in both. `nonconformity` -> `no conformidad` four times is +4 words on
its own; `reviewing` -> `la revision de` and `determining` -> `la determinacion de` twice
more. Zero surplus.

> **The ruling stands in full: nothing here was surplus, and the report measured the wrong
> thing twice over.** What follows is the same corpus measured correctly.

---

## §4.4 Per SPAN, and this is where the real finding was hiding

430 blockquote spans aligned by position between each translation and its English sibling.

**A ceiling report over ALL spans is meaningless**: 141 English spans already exceed 25
words, because the 25-word ceiling governs *attributed ISO quotation*, not every
blockquote. Most are worked examples and callouts. A guard firing on 141 is a design
error, not a backlog.

Scoped to the one shape that is actionable — **the English span is WITHIN the ceiling and
the translated span is over the language allowance** (25 x p90: 33 es, 32 pt) — the answer
is **16 spans**, and they separate cleanly at ratio 2.0.

### Above 2.0 — ten spans, five lessons: the untrimmed conversions

| ratio | lesson | | en → tr |
|---|---|---|---|
| **11.20** | `isms-ia-03-02-what-the-sample-supports` | es | 5 → 56 |
| **10.60** | same | pt | 5 → 53 |
| **5.80** | `isms-ia-05-03-the-statement-that-survives` | es | 10 → 58 |
| **5.70** | same | pt | 10 → 57 |
| **4.87** | `isms-ia-04-01-what-the-scope-left-out` | es | 15 → 73 |
| **4.07** | same | pt | 15 → 61 |
| **3.46** | `isms-ia-04-03-the-whole-of-clause-6` | es | 13 → 45 |
| **2.85** | same | pt | 13 → 37 |
| **2.71** | `isms-ia-03-01-degree-of-verification` | pt | 17 → 46 |
| **2.53** | same | es | 17 → 43 |

**These are not expansion and nothing in the distribution reaches them** — the corpus p95
is 1.563 and the population maximum 3.038. They are the ceiling conversions: the English
was trimmed to a short marked quotation and **the translation still carries the full
original**, word for word, in both languages.

`isms-ia-03-02` was the known case. **The other four were not known.** All five are
already withheld, so nothing is being served — but this is the lesson-side 1.1 population,
identified by span rather than inferred from a script list.

### Below 2.0 — six spans: compound expansion, already cleared

`isms-ia-03-08` es 1.55, `isms-ia-01-04` es 1.55, `isms-ia-02-03` es 1.50 / pt 1.38,
`isms-ia-03-09` es 1.44 / pt 1.36. Every one is an English span of 22–25 words against a
translation of 33–36, which is p90-to-p95 territory for quoted ISO text. Two of them are
the §4.2 rows already aligned to zero surplus.

> **A span-level measure found in one pass what a row-level measure could not find at
> all.** At row level `isms-ia-03-02` was +51 words in a 17,000-character body — 0.3
> percent, invisible. At span level it is 5 words against 56.

---

## §4.3 The two renderings of one 19011 phrase — confirmed

The same English clause, rendered two ways in the same certification:

```
isms-ia-01-04  es   comprender la PERTINENCIA y las consecuencias del uso de herramientas...
isms-ia-03-08  es   comprender la IDONEIDAD  y las consecuencias del uso de herramientas...
```

English in both: *understand the appropriateness and consequences of using…*

`idoneidad` is already on the recorded drift list from the 2026-09-21 batch, where
`idoneidad -> pertinencia` was one of the unrequested changes that came with a scoped
retranslation. The corpus ran 96 to 6 in favour of `idoneidad` at the time. **Pinned, and
the pin needs a direction**, which is a content call rather than a measurement.

## `02-04` quotes front matter

`isms-ia-02-04-choosing-the-method` es quotes the **changes list from the foreword** of
ISO 19011:2026 — *"ampliacion de la orientacion sobre los metodos de auditoria remota…
ISO/IEC TS 17012"*. Front matter, not normative text. Lower concern, same open question as
the index's front-matter handling, and still subject to the ceiling.
