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

Hours later, a second sweep found **"globally-recognized certifications"** on the
home page and both authentication pages, in all three languages. The first sweep
had searched for `globally recognized` with a space against copy that is
hyphenated, and for `reconocimiento global` against copy that says `reconocidas
mundialmente`.

**A word list cannot catch a false claim made in permitted words, and it cannot
catch a forbidden claim written in a spelling nobody anticipated.** So this
document governs claim *types* and the evidence each requires, and §7 treats the
sweep as the weaker of two checks.

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
| Designed to the ISO/IEC 17024:2026 framework for bodies certifying persons | **This exact formulation only** — see §5. Edition pinned deliberately; see §4 note |
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
- Globally recognised, internationally recognised, recognised worldwide — **in
  any spelling, hyphenation or word order, in any language**
- Recognised by employers, industry standard
- Pass rates or approval statistics of any kind
- Equivalent to, equivalent of, replaces, counts as — for any third-party
  certification
- Salary, hiring or labour-market outcomes
- 1EdTech certified, 1EdTech conformant, Open Badges certified, or any
  formulation implying a relationship with 1EdTech — **until listed in the
  Certified Product Directory at imscert.org**. See §3.1.
- Conforms to / complies with ISO/IEC 17024:2026 clause 6.5, or any claim that
  our use of AI in the certification process has been assessed. Clause 6.5
  governs AI use in the certification process; conformance is assessed by an
  accreditation body, not asserted. *Designed to* remains available. A claim
  about our AI governance in certification is separately unearned until the
  documented AI-in-certification policy and candidate-facing disclosure both
  exist.

### Class D — never permitted

- Any statement about a competitor's practice that we cannot evidence and date
- "The only", "the first", "nobody else" — without evidence meeting Class B
- Any claim that Certidemy *is*, or is affiliated with, a standards body or
  another certification programme

### 3.1 The 1EdTech boundary

Singled out because it is the most dangerous kind of unearned claim: **partly
true**, and true in a way that is easy to overstate in good faith on a call.

**What is true as of August 2026.** Certidemy issues Open Badges 3.0 credentials
that pass JSON-LD safe-mode validation and carry `eddsa-rdfc-2022` — the proof
mechanism 1EdTech's Open Badges 3.0 Conformance and Certification Guide requires.
Every technical requirement of the Issuer certification profile is met.

**What is not true.** Certidemy is not a 1EdTech member, has not run the
certification suite, and is not listed in the Certified Product Directory.
Certification requires membership and a passed test suite; neither has happened.

**Class A — permitted, because a reader can open the document and check it:**

> Our credentials carry the proof mechanism 1EdTech's Open Badges 3.0 conformance
> guide requires.

A fact about our signature. Makes no status claim about us or about 1EdTech.

**Class C — forbidden until listed in the directory:**

> 1EdTech certified · 1EdTech conformant · Open Badges certified · conformance-
> tested · officially recognised by 1EdTech

The check a buyer runs is imscert.org, and it takes ten seconds. A university
procurement officer WILL run it.

**Class D — never:** anything implying Certidemy is a 1EdTech member, partner, or
participant in its governance. This is the standards-body affiliation rule
already stated in Class D, restated here because "conformant" does not obviously
read as an affiliation claim to someone in a hurry.

**When this changes:** passing the suite and appearing in the directory moves the
Class C list to Class A wholesale. Until the directory lists us, it does not
matter how much of the work is done.

### Overclaims about our own product

Not a competitor claim, but caught by the same principle. "An AI tutor that
can't hallucinate" named a guarantee that grounding does not provide. "An AI
tutor that cites its sources" says what is true and is harder to argue with.
If a claim about our own product would fail a determined test, it fails §2.

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
| **en** | Designed to the ISO/IEC 17024:2026 framework for bodies certifying persons. |
| **es** | Diseñada conforme al marco ISO/IEC 17024:2026 para organismos que certifican personas. |
| **pt** | Projetada conforme a estrutura ISO/IEC 17024:2026 para organismos que certificam pessoas. |

**Edition note.** ISO/IEC 17024:2026 replaced the 2012 edition in March 2026.
The edition is named because two are in circulation and the referent would
otherwise be ambiguous. The claim is unchanged in kind: *designed to*, never
*accredited to*. Re-check on the next revision.

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
| Accredited to ISO/IEC 17024 · Acreditada según ISO 17024 · Acreditada conforme ISO 17024 | Designed to the ISO/IEC 17024:2026 framework (§4) |
| Equivalent to [any programme] | Nothing. There is no permitted equivalence claim. |
| Globally recognised · globally-recognized · reconocidas mundialmente · reconocidas a nivel mundial · reconhecidas mundialmente | Certifications built in the open — or the verification claim (§4) |
| Psychometrically validated | The cognitive profile is computed from the analysis (§4) |
| X% pass rate | Nothing. No approval statistic is published. |
| Their blueprints are behind paywalls | Our blueprint is published in full (§4) — a claim about us, not about them |
| Competitors ignore AI | Nothing, unless evidenced and dated per Class B |
| Built on the work nobody else does | Built on work you can inspect |
| An AI tutor that can't hallucinate | An AI tutor that cites its sources |

---

## 6. Worked example — the about page

Original copy, live until 2026-07-29:

> Most certifications still test whether you memorized a framework — and act as
> though AI never entered the room. **Their blueprints sit behind paywalls.**

And in the contrast block: **"Blueprint hidden behind a paywall"**, **"AI ignored
entirely"**.

**Assessment.** The paywall claim is Class D — a statement about competitors'
practice, unevidenced, and largely false. "AI ignored entirely" is Class D on
the same grounds and weakening with time.

**The repair did not weaken the page.** Every one of those lines restates as a
Class A claim about us, which is both true and stronger:

| Was | Became |
|---|---|
| Blueprint hidden behind a paywall | Prepare for the question bank *(left column now describes an approach, not a provider)* |
| AI ignored entirely | AI treated as an optional extra |
| Most certifications *(column header)* | The old model |

"We publish ours" needs no claim about anyone else, cannot be rebutted, and says
something rarer than "they hide theirs."

---

## 7. Review procedure

### 7.1 Two failures that shape this section

Both happened on 2026-07-29, both after a sweep reported the site clean.

**The about page asserted competitors' blueprints sit behind paywalls.** No
forbidden keyword appeared anywhere near it. A vocabulary sweep cannot catch a
false claim made in permitted words.

**`home.subhead` and `auth.showcase.headline` said "globally-recognized
certifications".** The sweep searched `globally recognized` with a space; the
copy is hyphenated. The Spanish and Portuguese read `reconocidas mundialmente`
and `reconhecidas mundialmente` — a different word order from the
`reconocimiento global` the pattern looked for. A Class C claim sat on the home
page and both authentication pages through a sweep that reported no violations.

The lesson is not "write a better regex". It is that **the sweep is the weaker
of the two checks and must never be reported as clearance.**

### 7.2 Scope — marketing surfaces only

Run across the whole repository the sweep returns roughly two hundred lines of
lesson content, because AIHR-I teaches what accredited certification means,
AIGRM-I teaches that alignment is not equivalence, and SD-AI-I teaches
hallucinated APIs. That is the curriculum working correctly, and burying the real
findings in it is how a reviewer stops reading.

**In scope:**
- `certidemy-web/messages/*.json`
- `certidemy-web/components/marketing/**`
- `certidemy-web/app/[locale]/(marketing)/**`
- `certifications`, `certification_i18n`
- `domains`, `domain_translations`
- Generated documents and the sales library
- The comparison sheet, when it exists

**Explicitly out of scope:** `certidemy-web/content/**`. Lesson content teaching
these concepts is the product, not a claim about Certidemy.

### 7.3 The sweep — mechanical half

```powershell
Get-ChildItem -LiteralPath "C:\Users\Juan\Documents\certidemy\certidemy-web\messages" -File -Filter *.json |
  Select-String -Pattern "accredit","acredit","psychometr","psicom",
    "global[- ]?ly[- ]?recogni[sz]ed","globally","mundialmente","a nivel mundial",
    "internationally","internacionalmente","mundial",
    "recogni[sz]ed by","reconocid. por","reconhecid. por",
    "equivalent to","equivale a","equivalente a",
    "pass rate","tasa de aprobaci","taxa de aprova",
    "paywall","muro de pago","muro de pagamento",
    "nobody else","nadie m.s","ningu.m mais",
    "industry standard","est.ndar de la industria","padr.o do setor" |
  ForEach-Object { "$($_.Filename):$($_.LineNumber)  $($_.Line.Trim())" }
```

Note what changed: **hyphen-tolerant** on globally-recognized, and the Spanish
and Portuguese entries match on the adverb alone rather than a fixed phrase,
because word order differs per language and per translator.

Then the same patterns against the database:

```sql
select 'certification_i18n' as src, lang, certification_id::text as id,
       coalesce(name,'') || ' | ' || coalesce(claim,'') || ' | ' || coalesce(description,'') as txt
from certification_i18n
where (coalesce(name,'') || coalesce(claim,'') || coalesce(description,'')) ~*
      'accredit|acredit|psychometr|psicom|globally|mundialmente|a nivel mundial|internacionalmente|equivalent to|equivale a|pass rate|tasa de aprobaci|taxa de aprova|paywall|muro de pago'
union all
select 'domain_translations', dt.language, dt.domain_id::text,
       coalesce(dt.title,'') || ' | ' || coalesce(dt.description,'')
from domain_translations dt
where (coalesce(dt.title,'') || coalesce(dt.description,'')) ~*
      'accredit|acredit|psychometr|psicom|globally|mundialmente|a nivel mundial|internacionalmente|equivalent to|equivale a|pass rate|tasa de aprobaci|taxa de aprova|paywall|muro de pago';
```

**A clean sweep proves the absence of Class C vocabulary and nothing else.**
It is never, on its own, grounds for saying copy is clear.

### 7.4 The read — the half that cannot be automated

Someone reads every sentence on a marketing surface and asks two questions:

1. **Is this a statement about anyone other than Certidemy?** If yes, it needs a
   source URL and a verification date, or it comes out. No exceptions for
   "everyone knows" or "it's obviously true".
2. **Could a sceptical buyer check this?** If they could and it would fail, it
   comes out. If they could not check it at all, it is decoration and probably
   should come out anyway.

Superlatives get special attention: *nobody else*, *the only*, *the first*, *the
work nobody does*. Each is a claim about every competitor simultaneously, and
none survives question 1.

Overclaims about our own product are caught by question 2.

### 7.5 Cadence

- **Before any new public copy ships** — §7.4 read, then §7.3 sweep.
- **Every 6 months** — re-verify all Class B facts. A comparative claim older
  than six months is unverified.
- **Whenever a competitor changes something material** — re-check any Class B
  claim that touches it.

### 7.6 Reporting

Never report "the sweep is clean". Report what was actually done:

> Sweep: clean across messages and the certification tables — no Class C
> vocabulary. Comparative read: N sentences checked, M findings.

The first sentence alone is what let two live violations through.

---

## 8. Open items

**The `home.philosophy` block is unreviewed and still live.** It names PSM I and
SMPC, compares their scoring weights with no source — Class D — and says lessons
are tuned to "whichever exam your employer recognizes", which positions
Certidemy as preparation for other people's certifications. Combined with two
competing hero headline sets in the same namespace, it appears to be copy from
an earlier product. Whether it renders at all is unconfirmed.

**The comparison sheet does not exist yet.** When it does, it is the primary
Class B artifact and every cell needs a source URL and verification date. The
permitted and forbidden texts in §4 and §5 are what a representative should be
able to reach for instead of improvising.
