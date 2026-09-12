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

### ~SD-AI-I

**Scrum Developer I — AI** — tier 1, available. 1 modules, 2 of 2 translation rows never read.

### SD-AI-I/scrum-framework-developers-seat-title

    EN       The Scrum Framework from the Developers' Seat
    en#6a2349bc

    [ ] es-419   El framework Scrum desde la silla de los Developers
        NOTE:

    [ ] pt-BR    O framework Scrum a partir da cadeira dos Developers
        NOTE:

### SD-AI-I/scrum-framework-developers-seat-description

    EN       The Developers' accountabilities, Sprint Planning's how, the Sprint Backlog as a
             living plan, the Daily Scrum as the Developers' event, participation in Review and
             Retrospective, estimation with AI as input, and self-management.
    en#b539b393

    [ ] es-419   Las responsabilidades de los Developers, el cómo del Sprint Planning, el Sprint
                 Backlog como un plan vivo, el Daily Scrum como el evento de los Developers, la
                 participación en la Review y la Retrospective, la estimación con IA como entrada, y
                 la autogestión.
        NOTE:

    [ ] pt-BR    As responsabilidades dos Developers, o como do Sprint Planning, o Sprint Backlog
                 como um plano vivo, o Daily Scrum como o evento dos Developers, participação na
                 Review e na Retrospective, estimativa com IA como entrada, e autogestão.
        NOTE:

---

## When you are done

Hand this file back marked up. **It is the evidence**, not a worksheet — `verify-cert`'s
`i18n.approved` check exists to record that a human compared these translations to the
current English, and this document is what makes that a fact rather than an assertion.

**4 rows in scope.** Nothing is flipped in the database until a person has read
them, and nothing is flipped for a row marked `[!]` at all.
