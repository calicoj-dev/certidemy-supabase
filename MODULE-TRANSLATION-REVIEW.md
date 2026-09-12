# ALL CERTIFICATIONS — translation review

**Certification:** module titles and descriptions
**Generated:** 2026-09-12 — regenerate and re-check the hashes if the English has moved.
**Scope:** tiers 1 and 2
**Languages:** es-419 (Latin American Spanish), pt-BR (Brazilian Portuguese)

---

## How to mark this up

Three marks, not two. An empty box and a rejection are different states and need
different handling — one wants a reviewer, the other wants a retranslation.

```
[ ]   not reviewed
[x]   approved — the translation says what the English says, in the right register
[!]   rejected — AND write what is wrong on the NOTE line beneath it
[r]   approved AFTER repair — was [!], re-translated, re-read. Keep the original
      NOTE so the defect stays on the record; append what the repair changed.
```

**A `[!]` with an empty NOTE is an error, not a rejection.** Say what is wrong, even
briefly: *wrong register*, *reverses the meaning*, *uses the pre-2020 term*, *drops the
qualifier that makes the task specific*. The note is what the next person acts on.

**You are not being asked to improve the English.** If the English itself reads wrong,
mark the row `[!]` and say so — that is a finding about the source, and it is worth more
than a corrected translation of a bad sentence.

### The hash on each row

Each row carries `en#xxxxxxxx`, a fingerprint of the exact English you are comparing
against. **If that English is later edited, a regenerated document shows a different
hash and your tick is visibly attached to text that no longer exists.** A tick whose
hash no longer matches is stale rather than approved. You do not need to do anything
with it — it exists so nobody can mistake an old review for a current one.

### What makes a translation wrong here, beyond the usual

**The 2020 Scrum Guide retired several terms, and a translation can reintroduce one
even when the English is right.** This has already happened in this certification's item
bank. Please flag any of these:

| Do not want | Want |
|---|---|
| `autoorganizado` / `auto-organizado` | `autogestionado` / `autogerenciado` |
| `ceremonia` / `cerimônia` | `evento` |
| `equipo de desarrollo` / `time de desenvolvimento` | **Developers**, left in English |
| `roles` / `papéis` for the three accountabilities | `responsabilidades` |

**Scrum terms stay in English throughout** — Sprint, Scrum Master, Product Owner,
Developers, Scrum Team, Sprint Backlog, Product Backlog, Definition of Done, Increment,
Sprint Review, Sprint Retrospective, Sprint Planning, Daily Scrum, Sprint Goal,
Product Goal. A translated one is a defect.

---

## Module headings — every certification

Two blocks per module: the TITLE and the DESCRIPTION are separate rows to mark,
because they fail differently — a title is a heading a candidate navigates by, a
description is a paragraph they read once. One mark covering both would make a
rejection ambiguous about which half is wrong.

### ~AIGRM-I

**AI Governance & Risk Management I** — tier 1, available. 1 modules, 2 of 2 translation rows never read.

### AIGRM-I/ai-lifecycle-accountable-deployment-title

    EN       The AI Lifecycle & Accountable Deployment
    en#18c7c8e1

    [ ] es-419   El ciclo de vida de la IA y la rendición de cuentas en el despliegue
        NOTE:

    [ ] pt-BR    O ciclo de vida da IA e a prestação de contas na implantação
        NOTE:

### AIGRM-I/ai-lifecycle-accountable-deployment-description

    EN       The signature domain: governance across the AI lifecycle; stage accountability; AI
             system impact assessment; documentation, model and system cards, and content
             provenance; human oversight in deployment; post-market monitoring and incident
             response; third-party AI; agentic-workflow accountability; and responsible
             decommissioning.
    en#9587b985

    [ ] es-419   El dominio distintivo: la gobernanza a lo largo del ciclo de vida de la IA; la
                 rendición de cuentas por etapa; la evaluación de impacto del sistema de IA;
                 documentación, fichas de modelo y de sistema, y procedencia del contenido; la
                 supervisión humana en el despliegue; el monitoreo posterior a la comercialización y
                 la respuesta a incidentes; la IA de terceros; la rendición de cuentas en flujos de
                 trabajo agénticos; y el desmantelamiento responsable.
        NOTE:

    [ ] pt-BR    O domínio distintivo: a governança ao longo do ciclo de vida da IA; a prestação de
                 contas por etapa; a avaliação de impacto do sistema de IA; documentação, cartões de
                 modelo e de sistema, e proveniência do conteúdo; a supervisão humana na implantação;
                 o monitoramento pós-comercialização e a resposta a incidentes; a IA de terceiros; a
                 prestação de contas em fluxos de trabalho agênticos; e o descomissionamento
                 responsável.
        NOTE:

---

### ~SM-AI-I

**Scrum Master I — AI** — tier 1, available. 1 modules, 2 of 2 translation rows never read.

### SM-AI-I/scrum-roles-title

    EN       Scrum accountabilities
    en#681437fb

    [ ] es-419   Responsabilidades de Scrum
        NOTE:

    [ ] pt-BR    Responsabilidades de Scrum
        NOTE:

### SM-AI-I/scrum-roles-description

    EN       Product Owner, Scrum Master, Developers.
    en#e3efe431

    [ ] es-419   Product Owner, Scrum Master, Developers.
        NOTE:

    [ ] pt-BR    Product Owner, Scrum Master, Developers.
        NOTE:

---

### ~SM-AI-II

**Scrum Master II — AI** — tier 2, available. 1 modules, 1 of 2 translation rows never read.

### SM-AI-II/smii-boundaries-title

    EN       Accountability Boundaries and the Organization
    en#d23ac9dc

    [ ] pt-BR    Limites de responsabilidades e a organização
        NOTE:

### SM-AI-II/smii-boundaries-description

    EN       Serving the Product Owner and the organization without taking their jobs.
    en#66e7b0d8

    [ ] pt-BR    Servir o Product Owner e a organização sem assumir seus trabalhos.
        NOTE:

---

## Tier 2 — D5 task statements

0 statements, both languages — **undefined**.
The domain the catalogue
description sells, and the one where the retired-vocabulary risk is highest because its
sentences carry *generated*, *model* and *estimates*. **~1 hour.**

---

## When you are done

Hand this file back marked up. **It is the evidence**, not a worksheet — `verify-cert`'s
`i18n.approved` check exists to record that a human compared these translations to the
current English, and this document is what makes that a fact rather than an assertion.

**10 rows in scope.** Nothing is flipped in the database until a person has read
them, and nothing is flipped for a row marked `[!]` at all.
