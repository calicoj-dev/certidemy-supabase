# Render gates G1-G7 over `BATCH1-RETRANSLATION.json`

24 fixtures behave, each drawn from a rendering the read rejected, each with its
correction as the paired negative. A gate that does not fire on its own example is not
a gate.

| rendering | G1 | G2 | G3 | G4 | G5 | G6 | G7 |
|---|---|---|---|---|---|---|---|
| `01-03-the-ai-system-life-cycle` es-419 b14 |  |  |  |  |  |  |  |
| `01-03-the-ai-system-life-cycle` es-419 b21 |  |  |  |  |  | **X** |  |
| `01-03-the-ai-system-life-cycle` pt-BR b14 |  |  |  |  |  |  |  |
| `01-03-the-ai-system-life-cycle` pt-BR b21 |  |  |  |  |  | **X** | **X** |
| `02-06-the-ai-system-impact-assessment` es-419 b9 | **X** |  |  |  | **X** |  |  |
| `02-06-the-ai-system-impact-assessment` pt-BR b9 | **X** |  |  | **X** |  |  |  |
| `03-01-resources-and-competence` es-419 b11 |  |  |  |  |  |  |  |
| `03-01-resources-and-competence` pt-BR b11 |  |  |  |  |  |  |  |
| `03-02-awareness-and-communication` es-419 b2 |  | **X** |  |  |  |  |  |
| `03-02-awareness-and-communication` es-419 b9 |  |  |  |  |  |  |  |
| `03-02-awareness-and-communication` pt-BR b2 |  |  |  |  |  |  |  |
| `03-02-awareness-and-communication` pt-BR b9 |  |  |  |  |  |  |  |
| `03-03-documented-information` es-419 b8 |  |  |  |  | **X** |  |  |
| `03-03-documented-information` es-419 b13 |  |  |  |  |  |  |  |
| `03-03-documented-information` pt-BR b8 |  |  |  |  |  |  |  |
| `03-03-documented-information` pt-BR b13 | **X** |  |  |  |  |  |  |
| `03-04-operational-planning-and-control` es-419 b2 |  | **X** |  |  | **X** |  |  |
| `03-04-operational-planning-and-control` es-419 b11 |  |  |  | **X** |  |  |  |
| `03-04-operational-planning-and-control` pt-BR b2 |  |  |  |  | **X** |  |  |
| `03-04-operational-planning-and-control` pt-BR b11 |  |  |  | **X** |  |  |  |
| `05-02-aims-internal-audit` es-419 b16 |  |  |  |  |  |  |  |
| `05-02-aims-internal-audit` es-419 b28 |  |  |  |  |  | **X** | **X** |
| `05-02-aims-internal-audit` pt-BR b16 |  |  |  |  |  |  | **X** |
| `05-02-aims-internal-audit` pt-BR b28 |  |  |  |  | **X** | **X** | **X** |
| `isms-ia-04-02-demonstrated-not-stated` es-419 b14 |  |  |  |  |  |  |  |
| `isms-ia-04-02-demonstrated-not-stated` es-419 b16 |  |  |  |  | **X** |  |  |
| `isms-ia-04-02-demonstrated-not-stated` es-419 b17 |  |  |  |  |  |  |  |
| `isms-ia-04-02-demonstrated-not-stated` pt-BR b14 |  |  |  |  | **X** |  |  |
| `isms-ia-04-02-demonstrated-not-stated` pt-BR b16 |  |  |  |  | **X** |  |  |
| `isms-ia-04-02-demonstrated-not-stated` pt-BR b17 |  |  |  |  |  |  |  |

**Totals:** G1 = 3, G2 = 2, G3 = 0, G4 = 3, G5 = 8, G6 = 4, G7 = 5. Clean: 13 of 30.

- `01-03-the-ai-system-life-cycle` es-419 b21
  - **G6** new acronym `SGia`, in neither the English nor the existing translation
- `01-03-the-ai-system-life-cycle` pt-BR b21
  - **G6** new acronym `SGIA`, in neither the English nor the existing translation
  - **G7** drift: expected \bderiva
  - **G7** stage: expected \betapas?
- `02-06-the-ai-system-impact-assessment` es-419 b9
  - **G1** directive lines en=1 tr=0
  - **G5** uses `cláusula` x1; this lesson uses `apartado`
- `02-06-the-ai-system-impact-assessment` pt-BR b9
  - **G1** directive lines en=1 tr=0
  - **G4** retained: retained is not maintained
- `03-02-awareness-and-communication` es-419 b2
  - **G2** title="What awareness requires" is the English, untranslated
- `03-03-documented-information` es-419 b8
  - **G5** uses `cláusula` x1; this lesson uses `capítulo`
- `03-03-documented-information` pt-BR b13
  - **G1** quote lines en=0 tr=1
- `03-04-operational-planning-and-control` es-419 b2
  - **G2** title="Criteria first, then control" is the English, untranslated
  - **G5** uses `apartado` x2; this lesson uses `capítulo`
- `03-04-operational-planning-and-control` es-419 b11
  - **G4** to the extent (idiom): an idiom, not the noun: en la medida / na medida
- `03-04-operational-planning-and-control` pt-BR b2
  - **G5** uses `cláusula` x2; this lesson uses `Seção`
- `03-04-operational-planning-and-control` pt-BR b11
  - **G4** to the extent (idiom): an idiom, not the noun: en la medida / na medida
- `05-02-aims-internal-audit` es-419 b28
  - **G6** new acronym `SGAI`, in neither the English nor the existing translation
  - **G7** surveillance: expected \bvigilancia
- `05-02-aims-internal-audit` pt-BR b16
  - **G7** standard: expected \bnorma
- `05-02-aims-internal-audit` pt-BR b28
  - **G5** uses `cláusula` x4; this lesson uses `Seção`
  - **G6** new acronym `SGAI`, in neither the English nor the existing translation
  - **G7** surveillance: expected \bvigil[aâ]ncia
- `isms-ia-04-02-demonstrated-not-stated` es-419 b16
  - **G5** uses `cláusula` x1; this lesson uses `apartado`
- `isms-ia-04-02-demonstrated-not-stated` pt-BR b14
  - **G5** uses `cláusula` x1; this lesson uses `Seção`
- `isms-ia-04-02-demonstrated-not-stated` pt-BR b16
  - **G5** uses `cláusula` x1; this lesson uses `Seção`
