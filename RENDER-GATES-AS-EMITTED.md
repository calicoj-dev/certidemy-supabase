# Render gates G1-G7 over `BATCH1-RETRANSLATION.json`

24 fixtures behave, each drawn from a rendering the read rejected, each with its
correction as the paired negative. A gate that does not fire on its own example is not
a gate.

| rendering | G1 | G2 | G3 | G4 | G5 | G6 | G7 |
|---|---|---|---|---|---|---|---|
| `01-03-the-ai-system-life-cycle` es-419 b14 |  |  |  |  |  |  |  |
| `01-03-the-ai-system-life-cycle` es-419 b21 |  |  | **X** |  |  | **X** |  |
| `01-03-the-ai-system-life-cycle` pt-BR b14 |  |  |  |  |  |  |  |
| `01-03-the-ai-system-life-cycle` pt-BR b21 |  |  | **X** |  |  | **X** | **X** |
| `02-06-the-ai-system-impact-assessment` es-419 b9 | **X** |  |  |  |  |  |  |
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
| `03-04-operational-planning-and-control` es-419 b2 |  | **X** |  |  |  |  |  |
| `03-04-operational-planning-and-control` es-419 b11 |  |  |  | **X** |  |  |  |
| `03-04-operational-planning-and-control` pt-BR b2 |  |  |  |  | **X** |  |  |
| `03-04-operational-planning-and-control` pt-BR b11 |  |  |  | **X** |  |  |  |
| `05-02-aims-internal-audit` es-419 b16 |  |  |  |  |  |  |  |
| `05-02-aims-internal-audit` es-419 b28 |  |  |  | **X** |  | **X** | **X** |
| `05-02-aims-internal-audit` pt-BR b16 |  |  |  |  |  |  | **X** |
| `05-02-aims-internal-audit` pt-BR b28 |  |  |  | **X** | **X** | **X** | **X** |
| `isms-ia-04-02-demonstrated-not-stated` es-419 b14 |  |  |  |  |  |  |  |
| `isms-ia-04-02-demonstrated-not-stated` es-419 b16 |  |  |  |  |  |  |  |
| `isms-ia-04-02-demonstrated-not-stated` es-419 b17 |  |  |  |  |  |  |  |
| `isms-ia-04-02-demonstrated-not-stated` pt-BR b14 |  |  |  |  | **X** |  |  |
| `isms-ia-04-02-demonstrated-not-stated` pt-BR b16 |  |  |  |  |  |  |  |
| `isms-ia-04-02-demonstrated-not-stated` pt-BR b17 |  |  |  |  |  |  |  |

**Totals:** G1 = 3, G2 = 2, G3 = 2, G4 = 5, G5 = 7, G6 = 4, G7 = 11. Clean: 15 of 30.

- `01-03-the-ai-system-life-cycle` es-419 b21
  - **G3** q1.option.c: modal `es obligatorio` with none in the aligned English
  - **G6** q1.option.c: new acronym `SGia`, in neither the English nor the existing translation
- `01-03-the-ai-system-life-cycle` pt-BR b21
  - **G7** q1.option.b: drift: expected \bderiva
  - **G6** q1.option.c: new acronym `SGIA`, in neither the English nor the existing translation
  - **G7** q1.explanation: drift: expected \bderiva
  - **G7** q2.question: stage: expected \betapas?
  - **G7** q2.option.a: stage: expected \betapas?
  - **G7** q2.option.b: stage: expected \betapas?
  - **G7** q2.option.c: stage: expected \betapas?
  - **G7** q2.option.d: stage: expected \betapas?
  - **G7** q2.explanation: stage: expected \betapas?
  - **G3** q4.option.c: modal `devem` with none in the aligned English
- `02-06-the-ai-system-impact-assessment` es-419 b9
  - **G1** directive lines en=1 tr=0
- `02-06-the-ai-system-impact-assessment` pt-BR b9
  - **G1** directive lines en=1 tr=0
  - **G4** retained: retained is not maintained
- `03-02-awareness-and-communication` es-419 b2
  - **G2** title="What awareness requires" is the English, untranslated
- `03-03-documented-information` es-419 b8
  - **G5** cláusula 7.5.3 is a dotted reference; this lesson uses `apartado` for those
- `03-03-documented-information` pt-BR b13
  - **G1** quote lines en=0 tr=1
- `03-04-operational-planning-and-control` es-419 b2
  - **G2** title="Criteria first, then control" is the English, untranslated
- `03-04-operational-planning-and-control` es-419 b11
  - **G4** to the extent (idiom): an idiom, not the noun: en la medida / na medida
- `03-04-operational-planning-and-control` pt-BR b2
  - **G5** cláusula 8.1 is a dotted reference; this lesson uses `Seção` for those
- `03-04-operational-planning-and-control` pt-BR b11
  - **G4** to the extent (idiom): an idiom, not the noun: en la medida / na medida
- `05-02-aims-internal-audit` es-419 b28
  - **G6** q1.option.b: new acronym `SGAI`, in neither the English nor the existing translation
  - **G7** q4.option.c: surveillance: expected \bvigilancia
  - **G4** q4.explanation: scope: scope is alcance / escopo; extension is the OTHER term
- `05-02-aims-internal-audit` pt-BR b16
  - **G7** standard: expected \bnorma
- `05-02-aims-internal-audit` pt-BR b28
  - **G5** q1.question: cláusula 9.2.1 is a dotted reference; this lesson uses `Seção` for those
  - **G6** q1.option.b: new acronym `SGAI`, in neither the English nor the existing translation
  - **G5** q2.option.a: cláusula 9.2.2 is a dotted reference; this lesson uses `Seção` for those
  - **G5** q2.explanation: cláusula 9.2.2 is a dotted reference; this lesson uses `Seção` for those
  - **G5** q4.question: cláusula 9.2.2 is a dotted reference; this lesson uses `Seção` for those
  - **G7** q4.option.c: surveillance: expected \bvigil[aâ]ncia
  - **G4** q4.explanation: scope: scope is alcance / escopo; extension is the OTHER term
- `isms-ia-04-02-demonstrated-not-stated` pt-BR b14
  - **G5** cláusula 5.2 is a dotted reference; this lesson uses `Seção` for those
