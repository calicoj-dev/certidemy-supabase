# Own-work attribution: drafts for the remaining surfaces

**Nothing in this file has been written.** Drafts only, for the director's ruling.

Measured 2026-09-25. The claim: *"an auditor may not audit their own work"* appears
in **neither** ISO/IEC 27001 **nor** ISO 19011:2026 — `HANDOFF-v6_2.md` §2, full-text
search, zero hits. ISO 19011 clause 4.6 asks for independence wherever practicable
and, where that is not possible, every effort to remove bias.

---

## 0. First, a correction to my own table

PROMPT-59's table listed eight rows as live. **Three of them are not**, and I had
not checked servability per surface before reporting. Asked through each gate:

| surface | rows | actually served? |
|---|---|---|
| **ISMS-F task 5.2 `skills`** | en + es + pt | **YES — all three.** `task_ksa_is_withheld` is false; `explain_task` returns it on the wire |
| **ISMS-F item explanation** | en + es + pt | **YES** to learners. `visibility = private`, so no MCP tool serves it — this is the in-app graded surface, not the partner surface |
| **ISMS-F concept `auditor-objectivity`** | es + pt | **NO.** `is_provisional = true` AND `en_hash` stale. `get_concept` returns the corrected English with `descriptionIsFallback: true` — confirmed on the wire |

So the **live** count is six rows, not eight, and the two concept rows were already
being held by the gate. Reporting them as live overstated the exposure; the fix is
still owed, because the row is wrong and will serve the moment it clears.

**And the worst of the six is the task, not the item.** It is the blueprint: exam
scope, criticality `high`, domain weight 17.5 percent, and a partner agent reads it
through `explain_task`. The item is scored feedback to one learner on one question;
the task statement is what the exam measures.

---

## 1. ISMS-F task 5.2 — the `skills` field

Only `skills` carries the defect. `statement`, `knowledge` and `abilities` are sound
and are not touched.

### Old

| lang | text |
|---|---|
| en | explains the purpose of internal audit, and why objectivity and impartiality **mean an auditor does not audit their own work.** |
| es | explica el propósito de la auditoría interna y **por qué un auditor no puede auditar su propio trabajo.** |
| pt | explica a finalidade da auditoria interna e **por que um auditor não pode auditar seu próprio trabalho.** |

### New (draft)

Keeps the JTA unit, the Bloom level (`2_understand`, an *explain* verb) and the
competence measured — *why objectivity and impartiality are properties the audit
process must secure* — and makes the common error the examinable point, which is
what the lesson and the concept now teach.

| lang | text |
|---|---|
| en | explains the purpose of internal audit, and why objectivity and impartiality are properties the audit process must secure rather than a rule about who may audit what. |
| es | explica el propósito de la auditoría interna y por qué la objetividad y la imparcialidad son propiedades que el proceso de auditoría debe asegurar, no una regla sobre quién puede auditar qué. |
| pt | explica a finalidade da auditoria interna e por que a objetividade e a imparcialidade são propriedades que o processo de auditoria deve assegurar, e não uma regra sobre quem pode auditar o quê. |

**No clause number is used, deliberately.** ISMS-F's Spanish clause word is
genuinely unsettled — see §4 — and a JTA skills line does not need an address to be
examinable. It also keeps the draft free of a decision that is yours.

### What a changed statement touches

```
live items on ISMS-F task 5.2     54    24 secure, 30 practice, 18 groups
ISMS-F lessons declaring 5.2       1    05-02-internal-audit
concepts examined under 5.2        4    audit-criteria, audit-findings,
                                        auditor-objectivity, internal-audit-programme
```

**None of the 54 items depends on the deleted clause.** They test the programme,
criteria, finding types, and objectivity-as-a-process-property — including seven
objectivity items whose keys are all of the form *"auditing work you helped design
compromises objectivity"*, which is true under the new wording and under the old.
`05-02-internal-audit` en already teaches it correctly: *"The standard requires
objectivity and impartiality; it does not name the own-work rule. That rule is how
audit practice delivers what the standard asks."*

### Machinery, and what goes dark

`task_translations.review_status` is `approved` on both; the gate is
`public.task_ksa_is_withheld(task_translation_id)`, and
`task_translation_reviews` holds `en_hash` (over the English KSA, via
`task_ksa_en_hash`) and `tr_hash`.

- Editing the **English** `skills` moves `task_ksa_en_hash`, so **both translations
  withhold immediately** — `explain_task` falls back to English for es and pt.
- Editing the **translations** moves `tr_hash`, which the review pins.
- So: English and both translations must land **together**, with a review row
  recorded in the same run, or ISMS-F's task 5.2 serves English-only in the interval.

---

## 2. Concept `auditor-objectivity` (ISMS-F) — es and pt

**Two concepts share this slug**, one per certification. AIMS-F's is correct and
current; only ISMS-F's is stale. Its English was fixed and its translations were
not — the same shape as the callout.

### Current English (unchanged, correct)

> Clause 9.2.2 asks that auditors be selected and audits conducted so that
> objectivity and impartiality are ensured - not that nobody may audit their own
> area. Neither ISO/IEC 27001 nor ISO 19011 contains that prohibition, and reading
> the practice convention as a requirement is the common error.

### Old translations

| lang | name | description |
|---|---|---|
| es | objetividad del auditor | **el requisito de que los auditores no auditen su propio trabajo** |
| pt | objetividade do auditor | **o requisito de que os auditores não auditem o próprio trabalho** |

### New (draft) — translated from the current English

| lang | description |
|---|---|
| es | El apartado 9.2.2 pide que los auditores sean seleccionados y las auditorías realizadas de manera que se asegure la objetividad y la imparcialidad, no que nadie pueda auditar su propia área. Ni ISO/IEC 27001 ni ISO 19011 contienen esa prohibición, y leer la convención de la práctica como un requisito es el error habitual. |
| pt | A Seção 9.2.2 pede que os auditores sejam selecionados e as auditorias conduzidas de forma a assegurar a objetividade e a imparcialidade, não que ninguém possa auditar a própria área. Nem a ISO/IEC 27001 nem a ISO 19011 contêm essa proibição, e ler a convenção de prática como um requisito é o erro comum. |

**The names are left alone.** `objetividad del auditor` is lowercase where AIMS-F's
is `Objetividad del auditor`; that is the ISMS-F 192-row slug-derived-name question
and does not belong in this fix.

### The same shape, measured corpus-wide

You asked whether any other concept has English newer than its translations. **176
rows do**, and none is serving stale text:

```
ISMS-F    174 rows   87 slugs   all is_provisional = true
AIMS-IA     2 rows    1 slug    aia-interested-party-requirements, cleared but
                                withheld by the en_hash mismatch itself
rows that would SERVE a stale translation:  0
```

`auditor-objectivity` is one of the 87. So this is not an isolated miss — it is the
normal state of a certification whose draws are blocked, and the gate is what makes
it safe.

### Machinery, and what goes dark

`mcp.concept` requires `is_provisional = false` AND `en_hash` current AND `tr_hash`
current. Both rows already fail two of the three, so **nothing changes on the wire**:
they are withheld before and after, and `get_concept` keeps returning the English
with `descriptionIsFallback: true`. The fix makes the row correct so it is right
whenever ISMS-F's draw is cleared; clearing is a separate act and this draft does
not ask for it.

---

## 3. ISMS-F item `3823ff33` — the explanation only

Group `352f63bd`, practice pool, task 5.2, key `a`, `visibility = private`.

### The key does NOT depend on the false claim — confirmed

```
stem     A lead engineer helped design the organization's backup controls. Why is it
         inappropriate to assign that engineer as the internal auditor for those controls?
key (a)  Auditors must be impartial; auditing work they helped design compromises
         objectivity regardless of any declaration.
```

Option (a) asserts two true things — impartiality **is** the requirement, and
auditing your own design **does** compromise it. It makes no claim about what the
standard contains. Distractors (b), (c), (d) are about qualifications, disclosure
and external consultants, none of which touches the maxim. **So this is an
explanation fix, not an item rewrite.**

### Old explanation

> **ISO/IEC 27001 requires auditors to be objective and impartial, meaning they must
> not audit their own work.** Declaring prior involvement does not remove the conflict
> of interest; objectivity is structurally compromised when the auditor evaluates work
> they contributed to designing. Using only external consultants is not required, and
> certification body pre-approval is not a mechanism for resolving this conflict.

### New (draft) — first sentence replaced, rest byte-identical

| lang | new first sentence |
|---|---|
| en | ISO/IEC 27001 cláusula 9.2.2 requires auditors to be selected and audits conducted so that objectivity and impartiality are ensured; it contains no rule against auditing your own work, which is practice convention rather than standard text. Auditing work you helped design is nonetheless the canonical way of failing the requirement the standard does contain. |
| es | La cláusula 9.2.2 de ISO/IEC 27001 exige que los auditores sean seleccionados y las auditorías realizadas de manera que se asegure la objetividad y la imparcialidad; no contiene ninguna regla que prohíba auditar el propio trabajo, que es convención de la práctica y no texto de la norma. Auditar un trabajo que uno ayudó a diseñar es, de todos modos, la forma canónica de incumplir el requisito que la norma sí contiene. |
| pt | A cláusula 9.2.2 da ISO/IEC 27001 exige que os auditores sejam selecionados e as auditorias conduzidas de forma a assegurar a objetividade e a imparcialidade; ela não contém nenhuma regra que proíba auditar o próprio trabalho, que é convenção de prática e não texto da norma. Auditar um trabalho que se ajudou a projetar é, ainda assim, a forma canônica de falhar no requisito que a norma de fato contém. |

**The English draft above has a defect I am flagging rather than hiding:** it reads
`ISO/IEC 27001 cláusula 9.2.2` — a Spanish word in the English sentence, from
drafting all three together. The English must read `clause 9.2.2`. Corrected before
anything is written; left visible here because a draft I silently repaired would
hide that the three were written as one.

### Machinery, and what goes dark

`item_translation_reviews` holds `en_hash` and `tr_hash` per question.
**Group `352f63bd` has zero review rows**, so there is no approval to invalidate and
no gate to re-close: the rows are `approved` / `private` on `quiz_questions.status`
and stay served throughout. Editing the explanation changes what a learner reads
after answering and nothing about availability.

---

## 4. The clause word, and the open question

ISMS-F's Spanish clause word is **not settled**, measured per surface:

| surface | es-419 | pt-BR |
|---|---|---|
| items | **cláusula 67**, apartado 9, capítulo 4 | **cláusula 67**, seção 9 |
| task translations | apartado 2, capítulo 2 — **a tie** | seção 3 |
| concept translations | apartado 1 | none |

- The **item** draft uses `cláusula` in both languages: 67 against 9 is decisive.
- The **task** draft uses no clause number at all, so the question does not arise.
- The **concept** draft uses `apartado` (es) and `Seção` (pt), mirroring ISMS-IA's
  measured house words. **That is my judgement, not a measurement** — one datapoint
  in es and none in pt is below any floor G5 would accept.

> **Your ruling, if you want one: is ISMS-F's Spanish clause word `cláusula`,
> following its 67 items, or `apartado`, following ISMS-IA?** Right now a learner
> reading an ISMS-F item sees `cláusula` and a concept sees `apartado`, and I would
> rather one of us decided that than let a per-surface majority decide it twice.
