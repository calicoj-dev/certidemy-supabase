certidemy-supabase

# PROMPT 2 — Mechanical register sweep, and four English defects

Read `CONCEPT-SAMPLE-REVIEWED.json` → the 25 rows with verdict `reword`. Those are the sample's
share. This prompt sweeps the classes they belong to across all 3,460 rows, and fixes four
defects in the English.

## 2.1 — Four mechanical sweeps, whole corpus

Write each as a check script under `scripts/`, run it, report counts **before** changing
anything, then apply.

1. **Spanish `aplicar` missing its reflexive.** `aplica a` / `aplican a` where the subject is
   the thing being applied — must be `se aplica a` / `se aplican a`. Three rows in the 480
   sample (`ia-disclosure-proportionality`, `dod-applies-to-ai-output`,
   `aia-nonconformity-needs-a-shall`, the last one twice in a single row).

2. **Pinned terms that left a bare noun behind.** `hacia el Goal`, `Procedencia en el Done`,
   `Falla de Done` — the pinned-term list pinned `Goal` and `Done` rather than `Sprint Goal`
   and `Definition of Done`, so a bare English noun survived behind a Spanish article. Guard:
   for each pinned term, assert no translated string contains the term's final word standing
   alone after a target-language article. Fix the list, then the rows.

3. **One rendering per term per language.** Two confirmed collisions in pt-BR:
   - *accountability* → `prestação de contas` (8 rows) vs `responsabilidade` (3 rows).
     Both are defensible in isolation — `responsabilidade` is the official pt-BR Scrum Guide
     term, `prestação de contas` preserves the accountability/responsibility distinction the
     Guide draws in English. Using both is not defensible. **Pick one, tell me which and why,
     then apply it everywhere.** Spanish is already consistent on `rendición de cuentas`.
   - *model card* → `model card`, `cartões de modelo`, and `Model Card (Ficha do Modelo)`.
   Build a term-rendering table per language and assert each source term maps to exactly one
   target rendering corpus-wide. Report every other collision the table finds — there will be
   more than these two, the sample only saw 14%.

4. **Report, do not auto-fix, the judgment rewords.** The remaining `reword` rows in the JSON
   need a reading, not a regex. List them for a human pass.

## 2.2 — Four defects in the English

These are not translation defects. They were invisible until someone read the English beside a
rendering of it. Each will be re-translated into two languages every time the corpus moves, so
fix the English first.

1. **ISMS-IA carries duplicate concepts.** `ia-ai-evaluation-tools-in-auditor-competence-7-2-3`
   and `ia-ict-and-emerging-technology-competence-7-2-3` have identical descriptions apart from
   *giving* vs *naming*. Two slugs, one concept, two translations, two rows of review cost —
   and both were drawn in the same pt-BR sample. Decide which survives, check what task codes
   each is mapped to before merging, and retire the other through the retirement path that
   migration 345 established. Add a guard: no two concept slugs in one certification share a
   normalized description.

2. **SPO-AI-I `refinement-ongoing` teaches deprecated vocabulary.** Its description is
   "Continuous **grooming** of the backlog" — while the same certification family carries
   `self-organizing (deprecated)`, `ceremonies-vs-events-terminology` and
   `servant-vs-true-leader` precisely to teach candidates that this vocabulary was retired.
   `backlog-refinement` already exists and is correct. Rewrite the description, or retire the
   concept into `backlog-refinement` if they are the same thing. Then sweep every certification
   for deprecated Scrum vocabulary appearing **outside** a concept whose job is to flag it as
   deprecated — `grooming`, `self-organizing`, `ceremonies`, `servant leader`, `commitment` used
   for the Sprint Backlog.

3. **ISMS-F concept names are raw slug text.** "annex a themes", "acceptable use ai",
   "saas ai in scope", "ai asset inventory" — lower-cased, with `ai` where `AI` belongs and
   `annex a` where `Annex A` belongs. The Spanish and Portuguese renderings quietly repaired
   most of these; the English is what a partner sees over MCP. Fix casing and initialisms
   across ISMS-F, then check the other eleven certifications for the same pattern.

4. **AISM-I `keep-it-simple-and-practical` is titled "Keep IT Simple and Practical".** The slug
   `keep-it-simple` was title-cased into the IT department. It is the ITIL guiding principle
   "Keep it simple and practical". Add `it` to the title-casing exception list alongside
   whatever already handles `ai`.

## 2.3 — Record the rule

**Rule — a concept name that was derived from its slug is not a name.** Mechanism: assert no
concept name is byte-equal to its slug with hyphens replaced by spaces and the first letter
capitalised. That single assertion catches all of 2.2.3 and 2.2.4.
