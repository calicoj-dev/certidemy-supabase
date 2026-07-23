# TERMINOLOGY-POLICY.md

**Scope:** every Certidemy certification, all three delivery languages
(en / es-419 / pt-BR).
**Status:** locked. Sixteen rules, each traceable to either a primary source or a
recorded review decision.
**Last updated:** July 2026

---

## Why this document exists

Certidemy delivers each credential in English, Latin American Spanish and
Brazilian Portuguese. The published blueprint in each language states what the
credential attests. **If a translated task statement describes a different
competence than the exam measures, the credential is invalid for every candidate
sitting in that language** — construct invalidity under ISO/IEC 17024, not a
copy-editing problem.

That is not hypothetical here. Migration 091 rewrote five SM-AI-I task
statements; their translations had already been approved and nothing marked them
stale. The Spanish blueprint said *"Explicar los tres pilares"* while the exam
measured *"Apply the three pillars to diagnose which pillar is broken."* It was
found only because a human read a CSV column by column, weeks later.

This document is the terminology half of the fix. The mechanical half is in §7.

**One source of truth.** These rules are stated **here and only here**. Each
`SCHEME-<CODE>.md` carries a short section that references this document and adds
only what is specific to that cert. Copying sixteen rules into six scheme
documents would recreate exactly the drift this project has spent its effort
eliminating.

---

## 1. The governing principle

A translation is correct when a candidate reading it would attempt the same
competence as a candidate reading the English. Naturalness matters, but never at
the cost of that equivalence.

Three consequences, in priority order:

1. **A term with an authoritative translated source follows that source.** The
   EU AI Act, the ISO/IEC standards and the Scrum Guide all publish official
   Spanish and Portuguese editions. Where one exists, it is not a matter of
   taste.
2. **Where no authoritative source exists, the working language of the
   profession in that region governs.**
3. **Where a term is load-bearing for a distinction the cert teaches, it is
   frozen** — even if a more natural word exists.

---

## 2. Bloom verb mapping (one-to-one, never substituted)

The verb carries the cognitive level. A more natural synonym that shifts the
level changes what the credential attests.

| English | es-419 | pt-BR |
|---|---|---|
| Recall | Recordar | Recordar |
| Explain | Explicar | Explicar |
| Describe | Describir | Descrever |
| Distinguish | Distinguir | Distinguir |
| Identify | Identificar | Identificar |
| Recognize | Reconocer | Reconhecer |
| Apply | Aplicar | Aplicar |
| Select | Seleccionar | Selecionar |
| Choose | Elegir | Escolher |
| Determine | Determinar | Determinar |
| **Match** | **Emparejar** | **Emparelhar** |
| Analyze | Analizar | Analisar |
| Diagnose | Diagnosticar | Diagnosticar |

`Match` was added in the July 2026 review. `Asociar` / `Associar` was considered
and rejected as weaker than the "pair each X with its Y" sense.

---

## 3. Regulated-AI terminology (AIGRM-I and any future regulated cert)

**Rule 1 — official EU AI Act language versions govern statutory terms**, even
where the official wording is more formal than everyday LATAM usage.

| English | es-419 | pt-BR |
|---|---|---|
| human oversight | **vigilancia humana** | supervisão humana |
| post-market monitoring | **vigilancia poscomercialización** | monitoramento pós-comercialização |
| provider | proveedor | prestador |
| deployer | responsable del despliegue | responsável pela implantação |
| distributor / importer / affected person | distribuidor / importador / persona afectada | distribuidor / importador / pessoa afetada |
| governance | **gobernanza** (never *gobierno*) | governança |

Portuguese follows natural Brazilian usage unless the official EU Portuguese
differs materially. The official EU Portuguese is European; `monitoramento` is
the correct Brazilian adaptation of `monitorização`.

**Rule 2 — the cross-cert rule.** Recorded verbatim from the July 2026 review:

> *"When the same English term appears in both a regulated-AI cert (AIGRM-I) and
> a non-regulated service-management cert (AISM-I), the regulated-AI cert follows
> the official EU AI Act statutory rendering, while the service-management cert
> uses the natural operational/service-management register."*

This is why **AIGRM-I says `vigilancia humana` while AISM-I and AIE-I say
`supervisión humana`.** It is deliberate. An auditor comparing two schemes will
ask; quote this rule.

**Rule 3 — `confiable`, not `fiable`,** for *trustworthy AI* in es-419. The
official EU Spanish uses `fiable`, but it is markedly Peninsular and the target
is Latin American Spanish. This is the one case where regional fit overrides the
official rendering, and it is a deliberate exception.

---

## 4. Scrum terminology (SM-AI-I, SPO-AI-I, SD-AI-I)

**Rule 4 — roles and artifacts stay in English in all three languages.**

Scrum Master · Product Owner · Developers · Scrum Team · Sprint · Sprint Planning
· Daily Scrum · Sprint Review · Sprint Retrospective · Sprint Backlog · Product
Backlog · Increment · Definition of Done · Product Goal · Sprint Goal · timebox ·
INVEST

**This is not an internal convention — it is what the official translated Scrum
Guides do.** Verified against the Latin American Spanish and Brazilian Portuguese
editions on scrumguides.org: both keep these terms in English inside otherwise
translated prose, and the Brazilian edition states explicitly that it uses the
English word *developers* to simplify rather than to exclude.

State it that way in scheme documents. "We follow the official translated guide"
is a stronger position than "we chose this."

**Rule 5 — the Scrum Guide's own title IS translated:** `la Guía de Scrum` /
`o Guia do Scrum`. Both official editions title themselves that way. The document
name is not a role or an artifact.

**Rule 6 — `liderazgo de servicio`** for *servant leadership* — the scrum.org
Spanish rendering. Not `liderazgo servidor`, not `liderazgo al servicio`.

**Rule 7 — `Increment` stays English in both languages, platform-wide.** The two
official guides diverge here (the pt-BR edition uses `Incremento`); the platform
holds one convention for cross-cert consistency. A deliberate, recorded
divergence from a source.

**Rule 8 — `Spec-Driven Development` stays English** in both languages, glossed
once on first use in the domain description. It is a named methodology.

**Rule 9 — PBI uses the expanded form**: `elementos del Product Backlog` /
`itens do Product Backlog`.

---

## 5. Service-management terminology (AISM-I)

**Rule 10 — outputs and outcomes are frozen and must never converge.**

| English | es-419 | pt-BR |
|---|---|---|
| output | **salida** | **saída** |
| outcome | **resultado** | **resultado** |

AISM-I task 1.6 tests the distinction directly. `resultado` is already spoken
for; rendering *output* as `respuesta`/`resposta` would also narrow it (an output
may be a ticket, a routing decision, a remediation action — not a conversational
reply). Leave every instance.

**Rule 11 — provider and supplier must not collide.** Service provider =
`proveedor` / `fornecedor`. External supplier = a distinct term
(`suministradores` / `fornecedores externos`). These are separate roles and a
candidate must not confuse them.

**Rule 12 — field-standard concepts are NOT glossed in English.** The seven
guiding principles, the value system, the practices. Glossing them would pull
them toward a recognisable branded formulation, which the scheme's honesty
position specifically avoids. Contrast Rule 13.

---

## 6. Cross-cutting rules

**Rule 13 — named public frameworks get their English glossed once**, on first
use in the *defining* task only: `Gobernar (Govern), Mapear (Map), Medir
(Measure) y Gestionar (Manage)`. This applies to frameworks with a source
document a candidate can look up (NIST AI RMF, ISO/IEC standards, EU AI Act
articles) — **not** to field-standard concepts (Rule 12).

**Rule 14 — vocabulary-recall tasks carry the English acronym in parentheses on
first use** — but only where the target language has no established acronym of
its own. `ML`, `LLM`, `GPAI`, `AIMS` qualify. **`AI` does not**: the Spanish and
Portuguese acronym is `IA`.

**Rule 15 — `pipeline` stays English in Spanish.** `canalización` suggests
physical piping; `pipeline` is near-universal in LATAM technical usage. Portuguese
already keeps it.

**Rule 16 — domain titles use sentence case in es-419 and pt-BR**, never Title
Case. Title Case is an English orthographic convention.

---

## 7. How this is enforced (not by memory)

Terminology rules are judgment. **Staleness is not**, and staleness was the
failure that actually caused damage.

- **`trg_invalidate_task_translations`** and
  **`trg_invalidate_domain_translations`** (migration 132) — changing an English
  statement, or a domain title or description, flips that row's translations back
  to `is_provisional = true` **in the same transaction**. There is no path around
  it short of disabling the trigger.
- **`verify-cert.mjs` invariant `i18n.approved`** — a certification with any
  provisional translation **fails the gate** and cannot be published.

Together these make the SM-AI-I failure mode impossible: the English cannot move
without the translations declaring themselves stale, and the cert cannot ship
while they are.

**The pack is ASCII-only.** `certidemy-web/scripts/load-jta-i18n.mjs` stores every
accented character as a `\uXXXX` escape, so corrected text reaches the database
through the API loader and cannot be corrupted by a SQL-editor paste — the
documented mojibake source on this project. Migrations that must carry accented
text use SQL unicode escapes (`U&'...'`) for the same reason.

---

## 8. Review discipline

JTA translations are reviewed by an external reviewer before approval. Two
observations from six review rounds, recorded because they cost real time:

1. **Verify named-document terminology against the source before proposing it.**
   Two wrong terms were approved by the reviewer because neither of us had
   checked the official guide — `Scrum Guide` kept in English (wrong: the
   official Spanish translates the title) and `liderazgo servidor` (wrong:
   scrum.org uses `liderazgo de servicio`). A reviewer's approval is not
   evidence.
2. **Check every item code against the source data before applying a fix.** Three
   of six rounds mislabelled an item code, once carrying a task number from a
   different certification entirely — applying it literally would have destroyed
   a different task.

Ask a reviewer for **stated rules**, not just verdicts. A rule generalises to the
remaining certs; a verdict does not.
