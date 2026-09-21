# Concept translation review — verdict

Sample `2026-09-20-concepts`, 480 of 3,460 rows, 20 per certification per language.
Read in full, both directions, 2026-09-21.

**Rule applied:** a meaning defect in a certification+language draw blocks **that
certification+language** and triggers a full read of it. Register and style issues
do not block.

Refined from what I proposed, on evidence: in all three cases where a defective
concept was also drawn in the other language, the other language was **correct**.
The defects are per-row, not per-concept and not per-generator-run. Blocking both
languages would have been over-blocking.

---

## Clearance

| | es-419 | pt-BR |
|---|---|---|
| AIE-I | clear | **BLOCKED** |
| AIGRM-I | clear | clear |
| AIHR-I | clear | clear |
| AIMS-F | *held — see below* | *held — see below* |
| AIMS-IA | clear | **BLOCKED** |
| AISM-I | clear | clear |
| ISMS-F | **BLOCKED** | clear |
| ISMS-IA | **BLOCKED** | clear |
| SD-AI-I | clear | clear |
| SM-AI-I | clear | clear |
| SM-AI-II | clear | clear |
| SPO-AI-I | clear | clear |

**18 of 24 draws clear. 4 blocked. 2 held for a reason that is not about translation.**

4 meaning defects in 480 rows — 0.83%. 25 rewords — 5.2%. 451 rows clean.

---

## The four that block

### 1. AIE-I / pt-BR / `genai-limitations` — wrong referent

> EN: "invent plausible-looking sources, citations, and **quotations**"
> PT: "inventam fontes, citações e **transcrições** de aparência plausível"

`transcrições` is transcripts. The claim becomes *the model fabricates transcripts*,
which is a different failure mode from fabricating quotes. The es-419 draw of the
same concept says `textos citados` and is right.

### 2. ISMS-F / es-419 / `risk-acceptance-criteria` — inverted direction

> EN: "the thresholds at which a risk may be retained"
> ES: "los umbrales **a partir de los cuales** un riesgo puede retenerse"

`a partir de` = from the threshold **upward**. Acceptance criteria define the level
at or **below** which risk may be retained. The Spanish disambiguates a loose English
sentence in the wrong direction, and a candidate who learns it will answer a
risk-acceptance item backwards. Suggest `dentro de los cuales`.

### 3. ISMS-IA / es-419 / `ia-awareness-clause-7-3` — defined term substituted for the act

> EN: "the implications of **not conforming**"
> ES: "las implicaciones de **la no conformidad**"

`no conformidad` is the ISO defined term — a formal finding. The English deliberately
says *not conforming*, the behaviour. In an internal-auditor certification that
distinction is examinable. The **pt-BR draw of this exact concept gets it right**:
`das implicações de não estar em conformidade`. Suggest `las implicaciones de no
cumplir los requisitos`.

### 4. AIMS-IA / pt-BR / `aia-ai-policy-requirements` — mechanical substitution destroyed the point

> EN: "This is a **clause requirement** and applies whether or not control A.2.2 is selected."
> PT: "Este é um **requisito de Seção** e se aplica independentemente..."

The clause→`Seção` substitution landed on a *generic* use of "clause". The concept
exists to teach that a clause requirement is mandatory while an Annex A control is
selected; "requisito de Seção" is a category error that carries none of it. Suggest
`um requisito das seções normativas`.

---

## What held up — worth stating, because it is the expensive part

**The ISO modal distinction is correct in 14 of 14 normative cases.** Every
`should` that renders ISO text became `debería` (es, 6/6) or `convém que` (pt, 6/6).
Two pt `deve` renderings exist and both sit on *non-normative* shoulds — the
courseware advising the auditor, not the standard. Same false-positive class as
THIRTEEN-PARAGRAPHS B1. This is the defect family that reached production in the
lesson bodies; it did not reach the concepts.

`AIMS-IA / aia-finding-against-a-note` is the hardest row in the sample — it talks
*about* modals. Both languages handled it:

> "neither a requirement nor guidance in the sense a **should** carries … Note 2 …
> contains a **shall**"
> es: "en el sentido que tiene un «**debería**» … contiene un «**debe**»"
> pt: "no sentido que um «**convém que**» carrega"

**The Spanish clause vocabulary is a correct two-tier convention, not drift.**
Top-level divisions → `capítulo` (5 occurrences, 2 rows: "capítulos 4 a 10",
"capítulo 1 Alcance"). Sub-numbered → `apartado` (40 occurrences, 27 rows). Every
one is on the right tier. `cláusula`: **zero**. Portuguese uses `Seção` flat and
consistently (43 occurrences, 31 rows), matching ABNT. This retroactively confirms
stopping the cláusula sweep was right — there was a convention underneath, and it
is being applied correctly.

Scrum English terms held everywhere: Sprint, Product Backlog, Sprint Goal,
Definition of Done, Developers, Increment, Scrum Team, velocity, story points.
Zero drops across 160 Scrum-family rows.

ISO/IEC 27001 and 42001 clause numbers, Annex letters and control IDs: zero drift
across 480 rows.

---

## Held, and not for a translation reason: AIMS-F

Both AIMS-F draws are clean, and clearing them would certify nothing.

**All 40 sampled AIMS-F rows carry the same boilerplate description:**

> "*<Concept name>* as required or described by ISO/IEC 42001:2023 and taught in
> the AIMS-F blueprint."

Forty independent draws, forty stubs. The 154 AIMS-F concepts have placeholder
descriptions in **English**. The translations are faithful renderings of a
placeholder.

This is the same gap FRIDAY-READINESS.md recorded underneath
`task_translations.knowledge` being NULL on every AIMS-F row. It is now confirmed
on the concept side too. **Do not clear AIMS-F concepts.** Clearing them would put
1,730-row provenance behind text that teaches nothing, and `get_concept` would start
serving it in three languages.

Second-order: the es-419 rendering of that **fixed** English template varies four
ways across 20 rows — `blueprint AIMS-F` / `temario de AIMS-F` / `plan de estudios
AIMS-F` / `temario AIMS-F`, and `según lo exige o describe` / `según lo requerido o
descrito por` / `tal como lo exige o describe`. When the English is generated from a
template the translation has to be generated from a template too, not translated row
by row.

---

## English-side defects the read surfaced

None of these are translation defects. They were invisible until someone read the
English next to a rendering of it.

1. **AIMS-F: 154 placeholder descriptions** (above).
2. **ISMS-IA has duplicate concepts.** `ia-ai-evaluation-tools-in-auditor-competence-7-2-3`
   and `ia-ict-and-emerging-technology-competence-7-2-3` have identical descriptions
   apart from *giving* vs *naming*. Both were drawn in the pt-BR sample. Two slugs,
   one concept, two translations, two rows of review cost.
3. **SPO-AI-I `refinement-ongoing` teaches deprecated vocabulary.** Its description
   is "Continuous **grooming** of the backlog" — while the same certification family
   carries `self-organizing (deprecated)`, `ceremonies-vs-events-terminology` and
   `servant-vs-true-leader` precisely to teach candidates that this vocabulary was
   retired. `backlog-refinement` already exists and is correct.
4. **Concept names are un-cased slug text in ISMS-F**: "annex a themes",
   "acceptable use ai", "saas ai in scope", "ai asset inventory". And AISM-I carries
   "Keep **IT** Simple and Practical" — the slug `keep-it-simple` title-cased into
   the IT department. Both translations quietly repaired these ("temas do anexo a"
   excepted); the English is what a partner sees over MCP.

---

## Register findings that do not block but should be pinned

| Term | Renderings found in 480 rows | Pin |
|---|---|---|
| accountability (pt-BR) | `prestação de contas` ×8, `responsabilidade` ×3 | one |
| model card (pt-BR) | `model card`, `cartões de modelo`, `Model Card (Ficha do Modelo)` | one |
| `X applies to` (es) | `aplica a` ×3 rows — missing the reflexive `se` | grammar, fix all |
| bare pinned nouns (es) | "hacia el Goal", "Procedencia en el Done", "Falla de Done" | pin `Sprint Goal`, not `Goal` |

The Spanish `aplica a` and the bare-noun artifacts are both **mechanical** and can be
swept with a guard rather than a reading.

---

## What I recommend next

1. **Clear the 18 clean draws.** Write review rows recording seed, sample size, date
   and this verdict; flip `is_provisional = false` for those certification+language
   pairs only.
2. **Hold AIMS-F in both languages** behind the English content gap, not behind the
   translation. Record the reason so nobody clears it later by looking only at the
   sample.
3. **Full read of the four blocked draws** — AIE-I/pt-BR, ISMS-F/es-419,
   ISMS-IA/es-419, AIMS-IA/pt-BR. 47 + 192 + 169 + 158 = 566 rows.
4. **Sweep the mechanical register items** across all 3,460 rows, not just the sample.
5. **Fix the four English defects** — they will otherwise be re-translated into two
   languages each time the corpus moves.

One number to keep: **AISM-I drew 20 of 226 (9%) and AIE-I drew 20 of 47 (43%).**
A flat 20 per draw is not flat coverage. The clearance claim should say *20 rows per
certification per language*, never *8% of the corpus*, because it is not evenly 8%
of anything.
