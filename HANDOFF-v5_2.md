# HANDOFF v5.2

**Session date:** 2026-08-04
**Supersedes:** HANDOFF-v5.1 and its addendum
**Migration tip:** 173 applied · **next free number: 174**
**Repos:** both clean and pushed

---

## 1. Headline

**Cert #8 — `ISMS-F`, ISO/IEC 27001 Foundation - AI — is scaffolded, verified,
localized and terminologically settled.** It founds a new family, `ai-security`.

Stages 1-6 of `CERT-CREATION.md` in one session: BoK triangulated from live
sources, JTA authored with full KSAs and locked, three scaffold migrations run,
family founded and trilingual, terminology block locked. `verify-cert --strict`
reports **17 pass / 5 fail**, and all five failures are "no lessons, no items
yet."

Along the way the session found **four documents stale or wrong**, three of them
in the catalog's own reference material. Those corrections are worth more than
the cert.

| | |
|---|---|
| Code | `ISMS-F` |
| UUID | `0bb3878a-fb89-455d-a84c-bdb9a26b1643` — **generated, not patterned** |
| Family | `ai-security` (founding member), `sort_order` 6 |
| Tier | Level I |
| Structure | 5 domains · 49 tasks · 191 concepts · 194 links · 5 modules |
| Exam | 40 items · 60 min · 80% · closed book · open eligibility |
| Cognitive profile | remember 10.39 / understand 56.77 / apply 22.68 / analyze 10.17 |
| Status | `draft` |

**First cert in the catalog carrying all four Bloom levels.**

---

## 2. Commits

### `supabase`

| commit | what |
|---|---|
| `a726d13` | scaffold cert #8, found `ai-security`; migrations 171-172; JTA + BoK; 17024 pin; UUID retirement; `CERT-SCHEMA-GUIDE` S2 corrected |
| `39e0c85` | migration 173 — exam blueprint computed from `v_cognitive_profile` |
| `bfb499d` | `CERT-SCHEMA-GUIDE` S0 — scaffold is three migrations, not two |
| `0d47363` | Rule 17 and the `ISMS-F` terminology block, locked |

### `certidemy-web`

| commit | what |
|---|---|
| `dcb17b4` | trilingual `ai-security` taglines; **added the missing `en` block** to `load-cat-i18n.mjs` |

---

## 3. What ISMS-F is, and why it is shaped this way

A **complete ISO/IEC 27001 Foundation**, rebuilt for an era in which AI is in the
estate. Clauses 4-10, Annex A as a structure, the certification process — with
the AI weave distributed across all five domains, `SM-AI-I` style, rather than
concentrated in a bolt-on module.

**Three positions were argued and reversed during design. All three reversals
came from Juan, and each made the product bigger.**

1. **Name the ISO number.** An earlier ruling forbade it by over-applying
   `TERMINOLOGY-POLICY` rule 6. That rule stops us claiming to *be* a
   competitor's branded programme (SMPC, PECB Certified ...). A **public
   standard** is different: anyone may teach to it and say so. The real limits
   are narrower — no ISO logo, no reproduced normative text, no implication of
   endorsement or accreditation.
2. **`AIGRM-I` is not a 42001 Foundation.** It has one task on 42001 and none of
   the clause machinery. Its true market analogue is IAPP's AIGP. It sits
   *beside* the ladder as recommended companion study, not as rung one.
3. **Teach the whole standard, not an AI slice.** The decisive correction. An
   AI-security specialization borrowing 27001 vocabulary is a smaller, weaker
   product than a real Foundation rebuilt for the AI era.

**Naming rule locked:** AI goes in a credential name when the base subject is not
already AI. `ISO/IEC 42001 ...` does not take it (redundant, and it breaks the
search string). `ISO/IEC 27001 Foundation - AI` does.

**Family grammar locked:** ladder by role suffix where the rungs are different
jobs — `ISMS-F` / `ISMS-LI`, and later `AIMS-F` / `AIMS-LI` / `AIMS-IA`. Roman
numerals stay where the ladder is cognitive. Both families read side by side.

**The strategic frame:** market vocabulary on the outside, cognitive rigor on the
inside. The buyer sees exactly what they searched for; the Level I/II designation
becomes evidence in the scheme document rather than a taxonomy they must learn.

---

## 4. FINDINGS — external standards

### 4.1 ISO/IEC 17024:2026 exists, and clause 6.5 is about us

**Published March 2026**, replacing the 2012 edition. Structure realigned to
mirror 17011/17021/17065. **The spine of everything Certidemy does is untouched**
— JTA, teach, assess, published claim matching measurement, impartiality, scheme
requirements, criterion-referenced cut scores.

**New: clause 6.5, "Use of artificial intelligence (AI) in the certification
process."** Did not exist in 2012. Certidemy generates items, lessons and
translations with AI and is squarely the population it addresses.

Per ISO/CASCO, a body using AI in any certification activity must: control
impartiality risks including AI-related bias; ensure human oversight; validate
AI-supported outcomes; demonstrate validity, reliability and fairness; ensure
personnel competence in AI use; and **disclose AI use where candidates interact
with it.** Principles-based, not prescriptive.

**Most of it is already evidenced** — the cue guard, the lock gate,
`verify-cert.mjs` invariants, the Bloom trigger, the published blueprint and
computed profile. Two gaps: **no documented AI-in-certification policy**, and
**no candidate-facing disclosure.**

`CLAIMS-POLICY` is now pinned to `:2026` across S3/S4/S5, with an edition note
and a **new Class C entry** forbidding any claim of 6.5 conformance — that is
assessed by an accreditation body, and the disclosure requirement is unmet.

### 4.2 ISO/IEC 27000:2026 is no longer the vocabulary standard

Sixth edition, **July 2026**. Title dropped "and vocabulary". Clause 3 went from
~77 defined terms to about 12. Definitions moved to the ISO Online Browsing
Platform and to the individual standards.

**Consequence:** no `ISMS-F` lesson may cite 27000 as the source of a definition.
Lessons define in Certidemy's own words and, where the authoritative home
matters, name 27001 / 27002 / 27005.

**And a live teaching point:** ABNT NBR ISO/IEC 27001 states that the terms and
definitions of ISO/IEC 27000 apply — a deferral that now points at a far thinner
document. **Task 1.4 teaches this.** Most Foundation courses on the market still
describe 27000 as the family's vocabulary standard.

### 4.3 27090 and 27091 are at FDIS, not published

27090 (AI security threats) and 27091 (AI privacy). Neither may be cited as a
published normative source. **When 27090 lands it becomes the single most
relevant ISO document to this credential** and D1 and D4 need a pass. Re-check
quarterly.

### 4.4 The market, collected and dated (Class B)

**Foundation tier converges: 40 items / 60 minutes.** PECB (70% pass, closed
book, **their own training course required**), CertiProf (80%, closed, 3-year
validity). APMG and EXIN figures came from exam-prep vendors — indicative only,
**not usable externally** until sourced from the bodies.

**Implementer tier splits, and the split is diagnostic.** PECB: 80 questions,
3 hours, **open book**. CertiProf: 40 / 60 min, dimensionally identical to its
own Foundation. `ISMS-LI`'s credible reference point is PECB's.

**The positioning finding.** PECB's own site distinguishes "certified"
(ISO/IEC 17024 personnel certification) from "certificate holder" (ANSI/ASTM
E2659 certificate programme) — and their Foundation is the latter. Their 17024
accreditation (IAS, UKAS, COFRAC) covers **Lead Auditor and Lead Implementer**.
**At Foundation tier the accreditation asymmetry is materially reduced.**

**Where the market beats us:** validity. CertiProf 3 years, PECB's Foundation
does not expire, Certidemy 365 days. Defensible on re-review cadence, but a buyer
comparing line items does not read the reasoning. **Owed: a decision and a
sentence of copy.**

---

## 5. FINDINGS — our own documents were wrong

`CERT-SCHEMA-GUIDE.md` exists so the next scaffold is written from a reference
rather than re-derived from old migrations. **It failed that job three times in
one session.**

| What | How it was found |
|---|---|
| `certifications.is_published` documented as present | **069-part-2 dropped it.** Migration 171 failed on paste |
| Repeating-digit UUID convention documented as current | Exhausted at two free slots |
| S0 said a cert needs **two** scaffold migrations | It needs **three**. `verify-cert` failed on the missing blueprint |

Four column names in S2 were also wrong (`duration_minutes` for
`exam_duration_minutes`, `total_questions` for `num_questions`) and six columns
were undocumented. All four wrong names were copied faithfully into a broken
migration.

**Fixes shipped:** S2 rewritten from `information_schema`; S7 retires the UUID
convention; S0 documents the third migration; **S0a is new** and carries a
standing instruction to introspect before writing any SQL, with the query.

**The rule that generalizes, and it is broader than the guide:** *no SQL against
a table not introspected in this session.* Four column-name misses happened today
— `certifications` twice, `cert_categories_i18n` once (`slug`, not
`category_slug`), and one on the i18n verify. Introspection costs one query.

**`passing_score_pct` defaults to 70.00, not 80.00.** Every I-tier cert is 80.
Omitting the column silently seeds a cert that passes at 70 — no error, nothing
downstream to catch it. **Worse than the failure that was loud.**

---

## 6. Rule 17 — standards-based certifications

`TERMINOLOGY-POLICY` resolved the register question for regulated-AI (statutory
rendering) and service-management (operational register) certs. **ISMS-F is a
third case.**

> **Rule 17.** Where a certification is built on a published standard with an
> adopted translation, **clause-and-control vocabulary follows the adopted
> standard**; everything else uses the natural operational register. The test:
> **where a candidate can open the source and check, the source wins.**

**pt-BR has one authority** — ABNT NBR ISO/IEC 27001:2022, an identical adoption.
**es-419 has several** — UNE (Spain), NTC (Colombia), NCh (Chile), UNIT
(Uruguay). Spain's UNE is **not** the anchor for es-419; use LATAM convergent
usage and record divergences.

### Two renderings that instinct would have got wrong

**`Seção`, never `cláusula`.** ABNT normative text: *"os requisitos especificados
nas **Seções** 4 a 10"*. This term appears in nearly every lesson. In es-419,
`capítulo` for a top-level division, `apartado` for a numbered requirement.

**The es-419 risk triplet inverted between editions:**

| English | UNE-ISO 31000:**2010** | ISO 31000:**2018** official |
|---|---|---|
| risk assessment *(whole process)* | **apreciación** | **evaluación** |
| risk evaluation *(third step)* | **evaluación** | **valoración** |

`evaluación` changed meaning. Anyone on older Spanish material has them exactly
inverted, and much Spanish 27001 training content still uses `apreciación`.
**The 2018 rendering governs**, sourced: ISO/IEC 27005's fourth edition (Oct 2022)
aligns to 31000:2018, and 27001's risk method arrives through 27005.

**This becomes a teaching point the English lesson cannot have.** The Spanish D3
lesson should note the inversion — a candidate will meet both, and the
process/third-step distinction is exactly what task 3.1 tests.

**ISO 31000 Edition 3 is at Committee Draft.** The Spanish risk vocabulary has
already moved once. Volatility register, annual re-check.

---

## 7. Process notes

**The KSA pass is not paperwork — it is the audit.** JTA v1.0 shipped without
KSAs. Writing all 49 skills lines raised two Bloom declarations on the merits
(3.2, 4.5) and declined three with reasoning (2.4, 4.2, 5.2). **Task 4.2 is the
clean case:** the statement said attributes "support selection," which reads
Apply — but the skills line is *explains what attributes are for*. The candidate
selects nothing. `verify-cert` then passed "statement verb agrees with declared
level" on the first run, 49/49.

**Generate migrations by parsing the locked JTA.** The scaffold was emitted by a
parser reading `ISMS-F_JTA_v2_0.md`, so it cannot drift from the document — and
the parser **caught an arithmetic error in the locked JTA** (187 concepts stated,
191 actual; the totals table had subtracted three reuse *links* from domain
*list* counts). Corrected as an erratum, v2.0.1.

**Generated migrations inherit the JTA's characters.** Em-dashes and curly quotes
are normal in markdown and fatal in a large SQL paste. Sanitize at generation,
then **prove** it: `Select-String -Pattern '[^\x00-\x7F]'`.

**Compute, never type, anything the database can derive.** Migration 173 builds
`cognitive_profile` by reading `public.v_cognitive_profile` inside the migration.
The object's own `derived_from` claims the profile is computed from the JTA; a
typed literal makes that sentence descriptive rather than true.
`COGNITIVE-MODEL.md` S4 already carries a hand-typed table that no longer matches
the database — do not create a second.

**Gate every patch on its anchor count.** The doc-patch script checks all nine
anchors before writing anything and aborts on any miss. Two ad-hoc inline patches
this session printed counts but did **not** gate the write; one anchor was 0 and
the edit silently no-op'd. **Printing a count is not a guard.**

**`-Exclude` filters file names, not directory names.** `Get-ChildItem -Recurse
-Exclude node_modules` scans node_modules and appears to hang. Use `git grep`, or
`Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|\.git)\\' }`.
**`git grep` is the better default** — index-only, instant, tracked files only.
Scope it to all extensions that matter; a `*.ts`/`*.tsx` filter missed two `.mjs`
scripts that needed editing.

**The mojibake false alarm recurred and was correctly refused.** PS 5.1 decodes a
BOM-less UTF-8 file as ANSI, so a clean file *displays* as `â€"`. The byte check
settles it — `C3A2` and `C382` counts on disk, both zero. Permanent fix in
`$PROFILE`: `$PSDefaultParameterValues['Get-Content:Encoding'] = 'UTF8'`.

**PowerShell patch scripts must be pure ASCII.** PS 5.1 reads a BOM-less `.ps1`
as ANSI, mangling literal em-dashes and accents. Build every non-ASCII character
with `[char]0x2014` etc. The doc-patch script is the reference.

**The external reviewer was right where I was stale.** The risk-triplet verdict
was correct and mine was not. **The channel states conclusions without sources,
so a correct verdict and an incorrect one look identical.** Both get verified.
This one held; the competitor-accreditation claim earlier in the same session did
not survive a check.

---

## 8. NEXT SESSION

### Blocking or near it

1. **The `17024` surface sweep.** `CLAIMS-POLICY` and `CERT-SCHEMA-GUIDE` are
   pinned; the surfaces quoting them are **not checked** — seven `SCHEME-*.md`,
   `certification_i18n`, the JSON-LD, and marketing copy in three locales. Search
   **`17024` bare**, never the full phrase (that is the sweep that failed in
   `CLAIMS-POLICY` S1). **Must precede `SCHEME-ISMS-F.md`.**
2. **The JTA translation wave — 108 rows.** 5 domains x 2 + 49 tasks x 2, plus
   K/S/A under `ksa_is_provisional`. `gen-jta-translations.mjs` with `CERT_ID`
   set — **read the cert name the script prints**, a leftover `$env:CERT_ID` once
   ran a pass against the wrong cert. `--dry` first. **`FORCE` is not idempotent**
   (temperature 0.2 re-rolls every string); fix specific rows with a targeted
   patch, never by re-running. `ONLY=ksa` is UPDATE-only.
3. **Stage 7 — 49 lessons.** Folders `content/isms-f/01-information-security-fundamentals/`
   ... `05-evaluation-improvement-certification/`; `module_slug` in frontmatter
   must equal the bare slug. **The 27000:2026 citation rule bites at D2**, where
   the definitions live.

### Owed, non-blocking

4. **AI-in-certification policy + candidate disclosure** (17024 clause 6.5).
   ANAB points bodies at the NIST AI RMF — the framework AIGRM-I already teaches.
5. **`SCHEME-ISMS-F.md`** — needs the sampling sentence: 40 items over 49 tasks is
   **0.82 items per task**, the lowest ratio in the catalog. Inherent to a 40-item
   market form over a full Foundation BoK; the comparators have the same property.
   State it rather than let an auditor find it.
6. **Validity messaging** — 365 days against 3 years and never-expires.
7. **Sitemap `PROGRAM_SLUGS`** — add `ai-security` when status flips to
   `coming_soon`, **not before**; a programme page with nothing on it is a thin
   page in Search Console.
8. **`family-content.ts`** — a trilingual `FamilyContent` entry with comparison
   chart, when there is something to compare. Note `FAMILY_SLUGS` currently
   contains **only `scrum`**; it gates family landing pages, not the catalog.
9. **Badge hex for `ai-security`** — decide with the corrected sibling set, not as
   a sixth drifting value.
10. **`load-cat-i18n.mjs`** — `ai` and `agile-frameworks` still have no es-419 or
    pt-BR taglines. Correct while they hold no certs; the moment either gets one,
    Spanish and Portuguese readers silently get English.
11. **BoK volatility register** — add ISO 31000 Edition 3 (Committee Draft).
12. **`foundation model` and `prompt injection`** in es-419 / pt-BR — check
    OWASP's translated material rather than proposing.

### The ladder beyond ISMS-F

`ISMS-LI` (Level II) is next in this family and is **blocked on
`item-pipeline-l2.mjs`** — the L1 critique pass destroys L2 items by tightening
"multiple defensible answers" down to one, which is the L2 product. It needs an
inverted critique contract and a cue guard that does not punish the best answer
for being better qualified. **L2 stays dichotomously scored** — harder item
construction, not a new scoring model, so the runtime is untouched.

Then the 42001 ladder in `governance-service-management`: `AIMS-F`, `AIMS-LI`,
`AIMS-IA`. **`AIMS-LA` (Lead Auditor) is Level III and blocked on simulation
assessment** — real lead-auditor judgment is `5_evaluate`, the MCQ ceiling is
`4_analyze`, and a Lead Auditor built as MCQ is a Level III wearing the wrong
name.

`AIGRM-II` remains shelved: same subject at higher difficulty does not justify a
separate credential under 17024. Two credentials need two jobs.
