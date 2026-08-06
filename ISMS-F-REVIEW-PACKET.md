# ISMS-F — translation review packet

**Certification:** ISO/IEC 27001 Foundation - AI (`ISMS-F`)
**Languages:** Latin American Spanish (es-419), Brazilian Portuguese (pt-BR)
**Prepared:** 5 August 2026
**Reviewer needs:** working Spanish and Portuguese, and a reading knowledge of
ISO/IEC 27001. Subject-matter depth is helpful but not required — most of what
this review catches is language, not content.

---

## Why this review exists

ISMS-F is complete and sits at `coming_soon`. Everything that can be verified by
query has been: 191/191 concepts taught and tested, zero untaught testing, the
secure/practice firewall clean, answer positions uniform, both item banks at floor
in all three languages.

**The one thing left needs a human reader.** `verify-cert --strict` reports 28
passes and one failure, and the failure is that the Spanish and Portuguese
blueprint has not been read by anyone.

That check is not being cautious for its own sake. During the build these
translations were approved once by mistake, and **two of them were wrong** in a way
any Portuguese reader would have caught immediately (§4). They have since been
corrected and set back to unreviewed.

---

## What is in the packet

| Part | What | Rows | Blocks publication? |
|---|---|---|---|
| **A** | Domain titles/descriptions + task statements | **108** | **Yes** — `verify-cert` fails on this |
| **B** | Certification page claim + description | **3** | No, and nothing tracks it |
| **C** | Task knowledge / skills / abilities | **98** (×3 fields) | No, and `verify-cert` does not check it |

**Part A is the blocking one.** Parts B and C are unreviewed for different reasons
and are included because leaving them out would misrepresent what has been read.

**Part B has no tracking at all.** The `certification_i18n` table has no
`is_provisional` column, so nothing marks these rows and no automated check can
flag them. They are candidate-facing on the certification page. This document is
the only record that they are unreviewed.

**Part C is roughly three times the volume of Part A.** Each of the 98 rows carries
three prose fields. `verify-cert` does not check its provisional flag — a known gap
recorded as item 4 in `HANDOFF-v5_3.md` §6.

---

## What to look for

In rough order of how much it matters:

**1. Meaning inverted or lost.** A statement that says the opposite of the English,
or that drops a qualifier the English depends on. Several ISMS-F statements turn on
a negation — task 5.8's *"may not surface"*, task 4.11's *"does not materially
change"* — and those are where a translation most often goes wrong.

**2. Terminology that a candidate could check against the standard.** See §3 below.
This is the rule with the most rows behind it.

**3. Register.** These are examination blueprint statements. They should read as
professional, neutral certification text — not marketing, not casual.

**4. Word order and collocation.** The two defects found so far were both this:
`referência de controles` where `controles de referência` was meant. Grammatically
possible, semantically wrong.

**5. Consistency with the lessons.** The same vocabulary is used in 98 translated
lesson files. **If a term is wrong here, it is wrong in roughly 49 lessons too** —
so flag the term, not just the row.

---

## Three patterns that look like defects and are not

**es-419 alternates `capítulo` and `apartado`.** This is deliberate. `capítulo` is
used for a whole top-level division of the standard (Clause 4, Clause 5) and
`apartado` for a numbered sub-requirement (clause 9.1). Both appear, and the split
is by granularity, not inconsistency.

**pt-BR uses `Seção`, never `cláusula`, for ISO divisions.** This follows the ABNT
adopted translation. Note that `cláusula` **does** appear correctly elsewhere for
*contractual* clauses — lesson 02-02 has two, and they are right.

**es-419 risk vocabulary follows ISO 31000:2018, not the 2010 rendering.**
`evaluación del riesgo` is the whole process; `valoración del riesgo` is the third
step only. `apreciación` is the superseded 2010 word and does not appear anywhere.

Most Spanish ISO/IEC 27001 material still uses the older rendering, in which
`evaluación` meant the third step. **Our text will look inconsistent with that
material. The older material is what is stale.** Please do not "correct" toward it.

Equivalently in pt-BR: `processo de avaliação de riscos` for the whole process,
`avaliação de riscos` for the third step.

---

## Already found and fixed — please confirm

Two pt-BR rows were wrong and have been corrected. Worth a specific look, since
they came from a glossary error that could have left traces:

| Task | Was | Now |
|---|---|---|
| 3.6 | `um conjunto de referência de controles` | `um conjunto de controles de referência` |
| 4.1 | `o número de referência de controles` | `o número de controles de referência` |

**The same phrase was corrected in four lesson files.** If `referência de
controles` appears anywhere in Part A or C, it is a survivor and should be flagged.

---

## Terminology reference

Renderings the translation is expected to use. A departure from these is worth
flagging even if the alternative reads well.

| English | es-419 | pt-BR |
|---|---|---|
| clause (whole division) | capítulo | Seção |
| clause (sub-requirement) | apartado | Seção |
| risk assessment (whole process) | evaluación del riesgo | processo de avaliação de riscos |
| risk analysis | análisis del riesgo | análise de riscos |
| risk evaluation (third step) | valoración del riesgo | avaliação de riscos |
| ISMS | SGSI | SGSI |
| Statement of Applicability | Declaración de Aplicabilidad | Declaração de Aplicabilidade |
| Annex A | Anexo A | Anexo A |
| reference controls | controles de referencia | controles de referência |
| nonconformity | no conformidad | não conformidade |
| corrective action | acción correctiva | ação corretiva |
| documented information | información documentada | informação documentada |
| interested parties | partes interesadas | partes interessadas |
| risk owner | propietario del riesgo | proprietário do risco |
| residual risk | riesgo residual | risco residual |
| risk treatment | tratamiento del riesgo | tratamento de riscos |
| standard (a published one) | la norma | a norma |

**AI-era terms are deliberately outside this table.** `prompt` and `shadow AI` stay
in English (shadow AI glossed on first use); AI is `IA` in both languages. These
have no adopted translation and take the natural operational register.

---

## How to return findings

Per row, whatever is quickest to read: the task code, the language, and what is
wrong. A suggested replacement is welcome but not required — flagging the problem
is the valuable part.

**If a term is wrong rather than a single row, say so explicitly.** A term flagged
once saves a sweep across 98 lesson files; a row flagged in isolation does not.

**Silence on a row will be read as approval**, because the outcome of this review
is that 108 rows get marked reviewed and the certification becomes publishable. If
a row is merely awkward rather than wrong, say that too — it will not block, but it
will get fixed.

---

## After the review

Part A approval flips `is_provisional` on 108 rows and clears the last
`verify-cert` failure. Parts B and C are corrected in place; neither has an
approval mechanism today, and building one for Part C is a separate piece of work
already recorded.

---

*Certidemy — ISMS-F v1.0 · scheme document `SCHEME-ISMS-F.md` · terminology rule
`TERMINOLOGY-ISMS-F.md`*
