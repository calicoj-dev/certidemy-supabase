# Backlog: served explanations that name an option by letter or position

**Queued, not done. Ruled PROMPT-96 s3.** Read-only: nothing in the bank was changed.

## Why these are not wrong today, and exactly when they become wrong

An explanation reading *"option b restates the definition of effectiveness"* is CORRECT while the letter
the learner saw is `b`. Two independent things have to hold:

1. the stored option order is the served order, and
2. the displayed letter comes from that order.

**Both hold for practice today.** The PROMPT-95 s1e delivery shuffle applies to `generate-mock-exam` only
-- the exam and simulator path. `get-review-batch` serves `options` through unchanged, and the player
renders the letter from the array index. So a practice explanation still describes the option in front of
the learner.

**The day that stops being true is the day a shuffle reaches the practice path**, and the failure would be
silent: an explanation confidently naming the wrong option, after the answer, when the learner is most
likely to believe it. That is why this is a queue and not a note.

**The one ZZ-TEST-I hit is the test certification** and is
listed for completeness rather than as work.

## The repair

Per item: name the option by its **content**, which survives any order. Mechanical in shape and a content
edit in substance -- every one of these is a string a learner reads. **Not a sweep**: this repository
records what a bulk substitution over reviewed content costs.

A trilingual sibling set is ONE editorial decision in three languages, so the language column below is the
one to plan against rather than the row count.

## Summary

| cert | rows | by pool | by language | by rule |
|---|---|---|---|---|
| ISMS-IA | **13** | practice 10, secure 3 | en 9, pt-BR 4 | by-position 9, by-letter-pt 4 |
| AIMS-IA | **10** | practice 6, secure 4 | en 6, pt-BR 2, es-419 2 | by-position 4, by-letter-pt 2, by-letter-es 2, by-position-2 1, by-letter 1 |
| SM-AI-II | **10** | secure 6, practice 4 | en 8, pt-BR 2 | by-position 6, by-letter 2, by-letter-pt 2 |
| AIHR-I | **3** | practice 3 | es-419 1, en 1, pt-BR 1 | by-letter-es 1, by-letter 1, by-letter-pt 1 |
| ISMS-F | **3** | practice 3 | en 1, es-419 1, pt-BR 1 | by-letter 1, by-letter-es 1, by-letter-pt 1 |
| SM-AI-I | **1** | practice 1 | en 1 | by-position 1 |
| ZZ-TEST-I | **1** | secure 1 | en 1 | by-letter 1 |
| **TOTAL** | **41** | of 27,829 explanations examined | | |

## Every row, by certification

### ISMS-IA

| question_id | pool | lang | status | origin | rule | matched | explanation (head) |
|---|---|---|---|---|---|---|---|
| `0ae3f20a-8d74-4977-8f8d-422d00e778d7` | secure | en | approved | authored | `by-position` | "the first option" | A management-system audit establishes whether controls are defined, operating, and subject to appropriate over |
| `14603148-8289-4692-a194-d518aa34de31` | secure | en | approved | authored | `by-position` | "first escalating forecloses options" | ISO 19011 addresses audit feasibility — including whether necessary competence is available — as a concern tha |
| `3476555d-16dd-4b03-9fe7-21865548076b` | practice | en | approved | authored | `by-position` | "the second conforming option" | Clause 6.2 explicitly requires information security objectives to be established at relevant functions and lev |
| `570a94bc-6889-43b8-b17c-c64dd72c37c2` | practice | en | approved | authored | `by-position` | "the first option" | ISO 19011:2026 clause 4.8 states the risk-based approach 'should substantively influence' audit programme plan |
| `70524478-56f4-4390-a8df-e036a6461988` | practice | en | approved | authored | `by-position` | "the second option" | ISO/IEC 27001 clause 10.2 b) 3) requires the organization to determine whether similar nonconformities exist o |
| `7700253f-ab8b-4d72-8a41-40a91228e8f2` | practice | pt-BR | approved | authored | `by-letter-pt` | "opção a" | A cláusula 4.8 da ISO 19011:2026 preconiza que a abordagem baseada em risco influencie substancialmente o plan |
| `9963c249-ff9f-444b-a2b5-7faff4a60778` | practice | en | approved | authored | `by-position` | "the first option" | ISO 19011:2026 clause 4.8 calls for the risk-based approach to substantively influence programme planning so t |
| `a17d31b4-87c7-4a19-8308-37da2300d0a5` | secure | pt-BR | approved | authored | `by-letter-pt` | "opção a" | A ferramenta de IA não apenas auxiliou — ela determinou quais doze categorias de ativos entraram no escopo, to |
| `c3e8235b-8a41-418a-b979-9df51f87b8a7` | practice | pt-BR | approved | authored | `by-letter-pt` | "opção a" | A cláusula 4.8 da ISO 19011:2026 afirma que a abordagem baseada em risco 'deve influenciar substancialmente' o |
| `ceae6f42-e485-4588-baaa-db027d893728` | practice | en | approved | authored | `by-position` | "the second option" | The core deficiency is that the programme's intervals were calibrated to a change-control assumption that exte |
| `dbecd19e-cd29-460b-b44e-f09fdcc1ed27` | practice | en | approved | authored | `by-position` | "the second option" | ISO/IEC 27001 clause 6.1.3 d) records whether controls are implemented; that SoA entry is the claim the audito |
| `e419df28-8a82-45e1-82ff-e944b8301a87` | practice | en | approved | authored | `by-position` | "the first option" | A nonconformity requires three elements: a specific requirement, evidence relating to it, and evidence showing |
| `f1c50003-8036-4541-8dc5-99e156441d54` | practice | pt-BR | approved | authored | `by-letter-pt` | "opção a" | Uma captura de tela fornecida pelo auditado sem recuperação direcionada pelo auditor não permite que o auditor |

### AIMS-IA

| question_id | pool | lang | status | origin | rule | matched | explanation (head) |
|---|---|---|---|---|---|---|---|
| `02034e40-8b45-495d-a44e-60d203f7fa0d` | secure | en | approved | authored | `by-position` | "the second option" | ISO 19011:2026 clause 3.6 defines audit scope as the extent and boundaries of an audit and identifies the syst |
| `43317924-3635-4334-b609-eec2fc6efdfa` | practice | pt-BR | approved | authored | `by-letter-pt` | "opção b" | A cláusula 6.1.2 b) exige que o processo de avaliação de risco seja projetado de forma que avaliações repetida |
| `4867933a-7ee2-4f23-a8bb-90ca4df4b841` | practice | en | approved | authored | `by-position` | "the fourth option" | ISO 19011:2026 clause 4.6 explicitly anticipates cases where internal auditors cannot be independent of the ac |
| `5507e27f-9841-46b3-b274-be1d337c4454` | secure | en | approved | authored | `by-position-2` | "options first" | Clause 6.1.3 b) requires the organization to determine all necessary controls from its chosen treatment option |
| `74e0515e-43ec-4d35-9b0f-b4d09eb631a5` | secure | en | approved | authored | `by-position` | "second option" | Annex A.18.4 of ISO 19011:2026 grounds the combination-or-separation decision in what the finding must do for  |
| `8069b8e8-908d-47a4-9d62-891fd2eb693a` | practice | es-419 | approved | authored | `by-letter-es` | "opción b" | La cláusula 6.1.2 b) exige que el proceso de evaluación de riesgos esté diseñado de manera que las evaluacione |
| `871b3180-3834-4833-8eaa-488da4f44bd8` | practice | en | approved | authored | `by-letter` | "option b" | Clause 6.1.2 b) requires the risk assessment process to be designed so that repeated assessments produce consi |
| `ad3542d7-30de-42cf-a888-3cfb7c585ba4` | practice | es-419 | approved | authored | `by-letter-es` | "opción a" | La cláusula 9.2.2 de ISO/IEC 42001 exige explícitamente que la organización defina los objetivos, criterios y  |
| `ceb9661a-cfb1-4e96-b7a6-284d07a04022` | practice | en | approved | authored | `by-position` | "the first option" | Clause 6.1.3 f) requires the statement of applicability to contain the justification for inclusions and exclus |
| `ec5f97bc-ba4f-4fa3-b95a-4affdd61302c` | secure | pt-BR | approved | authored | `by-letter-pt` | "opção a" | A cláusula 5.5.3 solicita que a pessoa responsável pelo gerenciamento do programa de auditoria selecione os mé |

### SM-AI-II

| question_id | pool | lang | status | origin | rule | matched | explanation (head) |
|---|---|---|---|---|---|---|---|
| `06b63f22-68e5-497b-a7c6-c5a1ebb061df` | secure | en | approved | authored | `by-position` | "the first option" | The Scrum Master's first analytical question must be whether the cancellation condition — Sprint Goal obsolesc |
| `08d1c767-790a-40a2-94ff-08f8807f0ee2` | secure | en | approved | authored | `by-letter` | "option c" | The Guide describes Scrum Teams as self-managing — meaning they internally decide who does what, when, and how |
| `192bc887-8a13-4877-9881-52e5081635d7` | secure | pt-BR | approved | authored | `by-letter-pt` | "opção a" | O Guia do Scrum nomeia explicitamente a Sprint Review como o evento em que o Product Backlog pode ser ajustado |
| `2121352e-7e13-4313-8250-49f5d59e4ed3` | secure | en | approved | authored | `by-position` | "the second option" | The Developers update the Sprint Backlog throughout the Sprint — the Daily Scrum is not the only permitted upd |
| `4d6e1c5e-52c5-495f-a5ee-c47d8261010d` | secure | en | approved | authored | `by-position` | "the second option" | The 2020 Scrum Guide assigns Sprint cancellation authority exclusively to the Product Owner — there is no prov |
| `5556130c-23b2-487a-a444-0e495bd91311` | practice | en | approved | authored | `by-position` | "the first option" | The Scrum Master has correctly identified a structural impediment—a governance arrangement that systematically |
| `56938e6f-8d84-4679-b7df-19e3c9b9da86` | practice | en | approved | authored | `by-position` | "the first option" | A Done failure occurs when work was attempted but did not reach the Definition of Done. The three items that w |
| `7302545f-685e-4e52-bcc5-53fbbea7c246` | secure | en | approved | authored | `by-letter` | "option b" | A working session that consistently produces uniform approval without backlog adaptation is almost certainly n |
| `ae32410e-c90d-4bff-9c7d-579b83b0b5b4` | practice | pt-BR | approved | authored | `by-letter-pt` | "opção a" | O Guia atribui a responsabilidade de dimensionamento aos Desenvolvedores que farão o trabalho, e essa responsa |
| `b76f93d4-19f3-4f1f-ae76-61efe615923c` | practice | en | approved | authored | `by-position` | "the second option" | When individual items pass their acceptance criteria yet the integrated build fails, the team is producing vol |

### AIHR-I

| question_id | pool | lang | status | origin | rule | matched | explanation (head) |
|---|---|---|---|---|---|---|---|
| `2fb4764f-ed70-42d9-b0c2-2c83da8c5437` | practice | es-419 | approved | authored | `by-letter-es` | "opción d" | La doctrina del impacto dispar mide la discriminación por el resultado, no por la intención; una tasa de selec |
| `89254f26-67b3-4e7b-af0d-900c554b9cd2` | practice | en | approved | authored | `by-letter` | "option d" | Disparate impact doctrine measures discrimination by outcome, not intent; an unequal selection rate creates le |
| `98c8da5a-03b3-43f5-a03f-6b41a61ba64f` | practice | pt-BR | approved | authored | `by-letter-pt` | "opção d" | A doutrina do impacto díspar mede a discriminação pelo resultado, não pela intenção; uma taxa de seleção desig |

### ISMS-F

| question_id | pool | lang | status | origin | rule | matched | explanation (head) |
|---|---|---|---|---|---|---|---|
| `49d824c2-0992-4e34-8837-9e5a0729ad9f` | practice | en | approved | authored | `by-letter` | "option (b)" | When an out-of-scope entity exchanges information with an in-scope process, that exchange point is an interfac |
| `b97cf460-1247-477e-9549-4258f8cb914d` | practice | es-419 | approved | authored | `by-letter-es` | "opción (b)" | Cuando una entidad fuera del alcance intercambia información con un proceso dentro del alcance, ese punto de i |
| `c0d3330b-9ff1-4311-81c5-39ebad7a3f91` | practice | pt-BR | approved | authored | `by-letter-pt` | "opção (b)" | Quando uma entidade fora do escopo troca informações com um processo dentro do escopo, esse ponto de troca é u |

### SM-AI-I

| question_id | pool | lang | status | origin | rule | matched | explanation (head) |
|---|---|---|---|---|---|---|---|
| `997e1904-879c-4389-9afe-f8408c6308be` | practice | en | approved | authored | `by-position` | "the fourth option" | Developers are accountable for adhering to the Definition of Done when creating each Increment. The SM support |

### ZZ-TEST-I

| question_id | pool | lang | status | origin | rule | matched | explanation (head) |
|---|---|---|---|---|---|---|---|
| `409c6db3-3576-4bc9-9827-6149f8dbfee7` | secure | en | approved | authored | `by-letter` | "Option b" | Option b is the key. This item exists only to exercise the exam path. |

## Drafts awaiting a read (not served, and the cheap place to fix one)

Ruled PROMPT-97 addendum s3. These are artifact survivors, scanned with the same rules. **A draft is not
a live defect** -- no learner can reach it -- so these are kept out of the totals above and reported here,
because the two need different actions: a served row needs a content edit, a draft needs the item rewritten
or dropped before it is inserted.

| item | task | artifact | already inserted? | rule | matched |
|---|---|---|---|---|---|
| `29a3ad5f` | 2.4 | AIMSF-R5.json | no | `by-number` | "Option 1" |
| `a5eb5694` | 1.4 | AIMSF-ROLLOUT-B1.json | **yes** | `by-letter` | "option C" |

## What this list cannot see

- an explanation naming an option by a DESCRIPTION of its position ("the shortest option", "the one
  above") rather than by a letter or an ordinal. The detector matches six declared forms;
- a letter reference inside a lesson body or a checkpoint block, which are different surfaces;
- anything in a retired or rejected row, which is excluded by the read.
