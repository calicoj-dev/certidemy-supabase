# TERMINOLOGY-ISMS-F — Rule 17 and the ISMS-F block

**Date:** 4 August 2026
**Status:** LOCKED. Fold into `TERMINOLOGY-POLICY.md` as Rule 17.
**External review:** returned; the risk-triplet verdict was correct and is adopted.
**Applies to:** `ISMS-F` JTA translations (108 rows), then lesson content
**Blocks:** nothing. All three blocking items are resolved below. Generation may run.

---

## Rule 17 — standards-based certifications follow the adopted standard

`TERMINOLOGY-POLICY` currently resolves the register question for two cases:

> When the same English term appears in both a regulated-AI cert (AIGRM-I) and a
> non-regulated service-management cert (AISM-I), the regulated-AI cert follows
> the official statutory rendering, while the service-management cert uses the
> natural operational register.

**ISMS-F is a third case**, and Rule 17 extends the same principle rather than
contradicting it:

> **Rule 17.** Where a certification is built on a published standard that has an
> adopted translation in the target language, **clause-and-control vocabulary
> follows the adopted standard**. Everything else uses the natural operational
> register.
>
> The test is the same one behind Rules 13 and the AIGRM-I statutory rule:
> **where a candidate can open the source document and check, the source wins.**
> A candidate who studies `ISMS-F` in Portuguese and then reads ABNT NBR ISO/IEC
> 27001 must find the same words.

### 17a — pt-BR has one source; es-419 has several

**pt-BR: ABNT NBR ISO/IEC 27001:2022** is an identical adoption of ISO/IEC
27001:2022 in technical content, structure and wording (ABNT/CB-021, CE-021:004.027).
Single authority. Use it.

**es-419: there is no single official Spanish edition.** The standard is adopted
separately by Spain (UNE-ISO/IEC 27001), Colombia (NTC-ISO-IEC 27001), Chile
(NCh-ISO 27001), Uruguay (UNIT-ISO/IEC 27001) and others. Our target is es-419 —
Latin American Spanish — so **Spain's UNE is not the anchor.**

**Ruling for es-419:** use the rendering on which the Latin American adoptions and
LATAM professional usage converge. Convergence is high in practice — the core
vocabulary is identical across every Spanish source surveyed. Where a genuine
divergence appears, prefer the term a LATAM practitioner will actually meet in an
audit, and record the decision here with its reasoning.

### 17b — the ceiling on this rule

Rule 17 governs **vocabulary**, not text. It does not license reproducing
translated normative text any more than the English rule does. `BOK-ISMS-F` §6
stands in all three languages: teach the structure and reasoning in Certidemy's
own words. Matching the standard's *terms* is what lets a candidate navigate the
standard; reproducing its *sentences* is infringement in any language.

---

## The verified block

Status legend:

- **[N]** — quoted from adopted normative text found in public documents.
- **[C]** — convergent professional usage across multiple independent sources; no
  divergence found. Safe, but not read from the standard itself.
- **[?]** — proposed, **needs source verification before use.**

### Core apparatus

| English | es-419 | pt-BR | Status |
|---|---|---|---|
| information security management system (ISMS) | Sistema de Gestión de la Seguridad de la Información (SGSI) | Sistema de Gestão da Segurança da Informação (SGSI) | **[N]** pt · **[C]** es |
| Statement of Applicability (SoA) | Declaración de Aplicabilidad | Declaração de Aplicabilidade | **[N]** pt · **[C]** es |
| Annex A | Anexo A | Anexo A | **[N]** both |
| reference controls | controles de referencia | referência de controles | **[N]** pt · **[C]** es |
| documented information | información documentada | informação documentada | **[N]** pt · **[C]** es |
| interested parties | partes interesadas | partes interessadas | **[N]** pt · **[C]** es |
| nonconformity | no conformidad | não conformidade | **[N]** pt · **[C]** es |
| corrective action | acción correctiva | ação corretiva | **[N]** pt · **[C]** es |
| conformity | conformidad | conformidade | **[N]** pt |
| information security | seguridad de la información | segurança da informação | **[N]** pt · **[C]** es |

### "Clause" — RESOLVED, and it would have been wrong

| English | es-419 | pt-BR | Status |
|---|---|---|---|
| clause, whole top-level division ("clause 6") | **capítulo** | **Seção** | **[C]** es · **[N]** pt |
| clause, numbered requirement ("clause 6.1.3") | **apartado** | **Seção** | **[C]** es · **[N]** pt |

**pt-BR: `Seção`, never `cláusula`.** ABNT normative text, quoted verbatim:
*"A exclusão de quaisquer dos requisitos especificados nas **Seções** 4 a 10 não
é aceitável quando a organização busca a conformidade com este documento."* The
instinctive `cláusula` is wrong against the Brazilian standard, and this term
appears in nearly every lesson.

**es-419 splits by granularity.** Spanish ISO material uses `capítulo` for a whole
top-level division ("ISO 31000:2018 Capítulos del 0 al 3") and `apartado` for a
numbered subsection ("Este apartado de la norma es nuevo respecto de la versión
anterior"). Follow that split; do not use `cláusula`, which in Spanish suggests a
contractual clause.

Recorded so it is not re-litigated: **this was decided, not defaulted.**

### Risk vocabulary

| English | es-419 | pt-BR | Status |
|---|---|---|---|
| risk assessment *(whole process)* | **evaluación del riesgo** | processo de avaliação de riscos | **[N]** es · **[C]** pt |
| risk identification | identificación del riesgo | identificação de riscos | **[N]** es |
| risk analysis | análisis del riesgo | análise de riscos | **[N]** es · **[C]** pt |
| risk evaluation *(third step)* | **valoración del riesgo** | avaliação de riscos | **[N]** es · **[C]** pt |
| risk treatment | tratamiento del riesgo | tratamento de riscos | **[N]** pt · **[C]** es |
| risk owner | propietario del riesgo | proprietário do risco | **[C]** |
| residual risk | riesgo residual | risco residual | **[C]** |
| risk acceptance criteria | criterios de aceptación del riesgo | critérios de aceitação de riscos | **[C]** |

### The risk triplet — RESOLVED, and the trap is real

Verified against the **ISO 31000:2018 official Spanish translation**:

> *"La evaluación del riesgo es el proceso global de identificación del riesgo,
> análisis del riesgo y valoración del riesgo."*

**The terminology moved between editions, and `evaluación` changed meaning:**

| English | UNE-ISO 31000:**2010** | ISO 31000:**2018** official |
|---|---|---|
| risk assessment *(whole process)* | **apreciación** del riesgo | **evaluación** del riesgo |
| risk identification | identificación | identificación |
| risk analysis | análisis | análisis |
| risk evaluation *(third step)* | **evaluación** del riesgo | **valoración** del riesgo |

In 2010 `evaluación` was the third step. In 2018 it is the whole process. Anyone
working from older Spanish material has these two **exactly inverted** — and a
great deal of Spanish ISO 27001 training content still uses `apreciación`.

**Why the 2018 rendering governs for ISMS-F specifically, not merely generically:**
ISO/IEC 27005's fourth edition (October 2022) aligns its terminology with ISO
31000:2018, and 27001's risk method arrives through 27005. The chain is sourced,
not assumed.

**Teaching consequence for task 3.1.** The Spanish lesson should note that older
material inverts these two terms. A candidate will meet both renderings in the
field, and the distinction between the process and its third step is precisely
what 3.1 exists to test. This is a teaching point the English lesson does not
have — one of the few places a translation is *more* informative than its source.

### Annex A themes

| English | es-419 | pt-BR | Status |
|---|---|---|---|
| Organizational controls | Controles organizacionales | Controles organizacionais | **[C]** |
| People controls | Controles de personas | Controles de pessoas | **[C]** |
| Physical controls | Controles físicos | Controles físicos | **[C]** |
| Technological controls | Controles tecnológicos | Controles tecnológicos | **[C]** |

Confirmed as the four-theme structure in both languages across multiple sources.

### AI-era vocabulary — Rule 17 does NOT apply

None of this is in the standard, so it takes the natural operational register and
follows existing platform rules — Rule 14 (English acronym on first use where the
target has none), Rule 15 (`pipeline` stays English).

| English | es-419 | pt-BR | Note |
|---|---|---|---|
| prompt | prompt | prompt | Existing platform rule — stays English |
| shadow AI | IA en la sombra (shadow AI) | IA sombra (shadow AI) | **[?]** — English gloss on first use, Rule 14 |
| non-human identity | identidad no humana | identidade não humana | Descriptive |
| agent | agente | agente | |
| prompt injection | inyección de prompts | injeção de prompt | **[?]** — OWASP has translated material; check |
| foundation model | modelo fundacional | modelo de fundação | **[?]** — divergent usage in both languages |
| context leakage | fuga de contexto | vazamento de contexto | Descriptive |
| AI | IA | IA | Rule 14: `AI` does NOT carry the English acronym |

---

## Resolved

| # | Item | Resolution |
|---|---|---|
| 1 | `clause` in es-419 | `capítulo` for a top-level division, `apartado` for a numbered requirement. Never `cláusula` |
| 2 | Risk triplet in es-419 | ISO 31000:**2018** rendering. `evaluación` = whole process, `valoración` = third step |
| 3 | `reference controls` in es-419 | `controles de referencia` — convergent, no divergence found |
| 4 | `foundation model`, `prompt injection` | **Still open, non-blocking.** Check OWASP's translated material during review rather than proposing from instinct |

## Volatility

**ISO 31000 Edition 3 is at Committee Draft stage** and will replace 31000:2018.
If it publishes, the Spanish risk vocabulary could move a second time — it already
moved once between 2010 and 2018. Add to the `BOK-ISMS-F` volatility register;
re-check annually.

## Review note

The external reviewer's risk-triplet verdict was correct and mine was stale — I
was carrying the 2010 rendering. Recorded because it refines how that channel is
read: the reviewer states conclusions without sources, so a correct verdict and an
incorrect one are indistinguishable on the page. **Both still get verified.** This
one held; the competitor-accreditation claim earlier in the same build did not.

**Verification path.** ABNT and the LATAM national bodies sell their adoptions;
we do not hold them. Where the text cannot be read directly, accept **convergent
usage across independent professional sources with URL and date**, recorded here
per `CLAIMS-POLICY` Class B. Do not accept a single source for a term that
appears in more than five tasks.

## Teaching consequence, not just terminology

ABNT 27001 states that the terms and definitions of ISO/IEC 27000 apply. With
27000:2026 having reduced from roughly 77 defined terms to about 12, that
deferral now points at a far thinner document than it did in 2022 — the
definitions live in the ISO Online Browsing Platform and in the individual
standards instead.

**Task 1.4 should teach this**, in all three languages. It is current, it is
checkable, and most Foundation courses on the market still describe 27000 as the
family's vocabulary standard.
