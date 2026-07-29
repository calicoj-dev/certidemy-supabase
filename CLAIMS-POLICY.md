# CLAIMS-POLICY

The approved claim list. Governs every public surface — website, generated
documents, decks, emails, and what a representative says on a call.

Supersedes nothing; `TERMINOLOGY-POLICY.md` covers third-party naming and
remains in force alongside this.

Last reviewed: 2026-07-29.

---

## 1. Why a rule set and not a word list

A keyword sweep of the entire web application and the certification tables was
run on 2026-07-29 for accreditation, equivalence, global recognition,
psychometric validation and pass-rate language, in all three languages. It came
back clean.

The same day, the about page was found asserting that competitors' **blueprints
sit behind paywalls**. ITIL's syllabus, PMI's Exam Content Outline, ISTQB's
syllabi and the Scrum Guide are all free downloads. The claim is largely false,
any prospect who has certified in one of those knows it, and no forbidden
keyword appears anywhere near it.

**A word list cannot catch a false claim made in permitted words.** So this
document governs claim *types* and the evidence each requires.

---

## 2. The governing principle

> Every claim we make must be checkable by the person hearing it, or evidenced
> and dated by us.

Two consequences that decide most cases:

**Claims about ourselves must point at something a reader can open.** "The full
blueprint is published" is checkable — the blueprint sheet exists and the
catalog links to it. "Our exams are rigorous" is not, and is therefore worthless
as well as unsafe.

**Claims about anyone else carry the same burden as the comparison sheet:** a
source URL and a verification date, per fact. If we would not put it in a cell
with a source, we do not say it on a page or on a call.

---

## 3. Claim classes

### Class A — permitted without conditions

Facts derived from our own records, checkable by a reader.

| Claim | Why it holds |
|---|---|
| The full job task analysis and exam blueprint are published | Both generate from live rows; the catalog exposes them |
| The cognitive profile is computed from the job task analysis, not asserted over it | `v_cognitive_profile`; verify-cert invariant 17 blocks divergence |
| Every examination question traces to a task in a published analysis | Enforced by the item generators and the Bloom trigger |
| Multiple-choice items are capped at Bloom 4; levels 5 and 6 are reserved for simulation and are not certified until simulations exist | Stated on the blueprint and JTA sheets |
| Designed to the ISO/IEC 17024 framework for bodies certifying persons | **This exact formulation only** — see §5 |
| Every credential is independently verifiable on a public page, without contacting us | `/verify/[id]`, public endpoint, QR on the certificate |
| The full course is free to study; only the examination is purchased | True today |
| Available in English, Latin American Spanish and Brazilian Portuguese | True for lessons, exams and generated documents |

### Class B — permitted with evidence

Comparative and market claims. Each requires a **source URL and a verification
date**, recorded in the comparison dataset. Internal tier by default; a Class B
claim only becomes external after it is checked and dated.

Examples: what a named programme's exam format is, what it costs, what its
syllabus contains, whether it publishes weights.

**Ageing rule:** a Class B fact older than 6 months is treated as unverified and
must be re-checked before use.

### Class C — forbidden until earned

Not false — *unearned*. These become permitted if and when the underlying fact
becomes true, and not before.

- Accredited / accreditation by any body
- Psychometrically validated, psychometric validation
- Globally recognised, internationally recognised
- Recognised by employers, industry standard
- Pass rates or approval statistics of any kind
- Equivalent to, equivalent of, replaces, counts as — for any third-party
  certification
- Salary, hiring or labour-market outcomes

### Class D — never permitted

- Any statement about a competitor's practice that we cannot evidence and date
- "The only", "the first", "nobody else" — without evidence meeting Class B
- Any claim that Certidemy *is*, or is affiliated with, a standards body or
  another certification programme

---

## 4. Approved texts

The permitted formulations, in all three languages. Use these verbatim where a
claim of this kind is needed.

### Transparency

| | |
|---|---|
| **en** | The full blueprint is published — every domain, every weight, every task. |
| **es** | El blueprint completo es público: cada dominio, cada peso, cada tarea. |
| **pt** | O blueprint completo é público: cada domínio, cada peso, cada tarefa. |

### Derivation

| | |
|---|---|
| **en** | The examination's cognitive profile is computed from the job task analysis, not asserted over it. |
| **es** | El perfil cognitivo del examen se calcula a partir del análisis de tareas; no se declara sobre él. |
| **pt** | O perfil cognitivo do exame é calculado a partir da análise de tarefas; não é declarado sobre ela. |

### Framework

| | |
|---|---|
| **en** | Designed to the ISO/IEC 17024 framework for bodies certifying persons. |
| **es** | Diseñada conforme al marco ISO/IEC 17024 para organismos que certifican personas. |
| **pt** | Projetada conforme a estrutura ISO/IEC 17024 para organismos que certificam pessoas. |

### Verification

| | |
|---|---|
| **en** | Every credential carries a unique code and a public verification page. Anyone can confirm it without contacting us. |
| **es** | Cada credencial lleva un código único y una página pública de verificación. Cualquiera puede confirmarla sin contactarnos. |
| **pt** | Cada credencial carrega um código único e uma página pública de verificação. Qualquer pessoa pode confirmá-la sem falar conosco. |

### Honest limits — say these rather than let them be asked

| | |
|---|---|
| **en** | Tasks above the multiple-choice ceiling are declared and marked as not examined. They are reserved for simulation and are not certified until simulations exist. |
| **es** | Las tareas por encima del techo de opción múltiple se declaran y se marcan como no evaluadas. Se reservan para simulación y no se certifican mientras las simulaciones no existan. |
| **pt** | Tarefas acima do teto da múltipla escolha são declaradas e marcadas como não avaliadas. Ficam reservadas para simulação e não são certificadas enquanto as simulações não existirem. |

---

## 5. Forbidden formulations

Substitute the approved text on the right.

| Do not say | Say instead |
|---|---|
| Accredited to ISO/IEC 17024 · Acreditada según ISO 17024 · Acreditada conforme ISO 17024 | Designed to the ISO/IEC 17024 framework (§4) |
| Equivalent to [any programme] | Nothing. There is no permitted equivalence claim. |
| Globally recognised · Reconocimiento global · Reconhecimento global | Independently verifiable on a public page (§4) |
| Psychometrically validated | The cognitive profile is computed from the analysis (§4) |
| X% pass rate | Nothing. No approval statistic is published. |
| Their blueprints are behind paywalls | Our blueprint is published in full (§4) — a claim about us, not about them |
| Competitors ignore AI | Nothing, unless evidenced and dated per Class B |

---

## 6. Worked example — the about page

Current copy, live:

> Most certifications still test whether you memorized a framework — and act as
> though AI never entered the room. **Their blueprints sit behind paywalls.**

And in the contrast block: **"Blueprint hidden behind a paywall"**, **"AI ignored
entirely"**.

**Assessment.** The paywall claim is Class D — a statement about competitors'
practice, unevidenced, and largely false. "AI ignored entirely" is Class D on
the same grounds and weakening with time.

**The repair does not weaken the page.** Every one of those lines can be
restated as a Class A claim about us, which is both true and stronger:

| Was | Becomes |
|---|---|
| Blueprint hidden behind a paywall | Our blueprint is published in full — every domain, every weight, every task |
| AI ignored entirely | AI is part of every domain, not a bolt-on module |
| Memorize the framework | We test whether you can apply and analyse, not just remember |

"We publish ours" needs no claim about anyone else, cannot be rebutted, and says
something rarer than "they hide theirs."

---

## 7. Review procedure

1. **Before any new public copy ships**, check each claim against §3 and assign a
   class. Class C and D do not ship. Class B ships only with source and date.
2. **Keyword sweep** — the mechanical half. Run against files and the
   certification tables:

   ```
   accredit|acreditad|equival|reconocimiento global|reconhecimento global|
   globally recognized|psychometr|psicom|tasa de aprobaci|taxa de aprova|pass rate
   ```

   A clean sweep proves the absence of Class C vocabulary and nothing else.
3. **Comparative-claim review** — the half a sweep cannot do. Read every sentence
   that describes what anyone other than Certidemy does. Each needs a source and
   a date or it comes out.
4. **Re-verify Class B facts every 6 months.**

Surfaces in scope: marketing pages, `messages/*.json`, `certifications` and
`certification_i18n`, `domains` and `domain_translations`, generated documents,
the sales library, and the comparison sheet when it exists.
