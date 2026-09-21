# Concept clearance + AIMS-F repair — run order

Four prompts for `certidemy-supabase`, in this order. Migration tip is **355**; next free is **356**.

Drop these two files in the repo root first — every prompt reads them:

- `CONCEPT-SAMPLE-REVIEWED.json` — 480 rows, each with `verdict` (`ok` / `reword` / `wrong`) and `note`
- `CLEARANCE-PLAN.json` — which draws clear, block, or hold, with reasons and row counts

---

# PROMPT 1 — Clearance pass, and the AIMS-F census

Read `CLEARANCE-PLAN.json` and `CONCEPT-SAMPLE-REVIEWED.json` in the repo root. A human
read all 480 sampled concept translation rows on 2026-09-21. This prompt acts on that verdict.

## 1.1 — Census first, because it sizes later work

Before writing anything, answer these against the database and show me the numbers:

- How many of AIMS-F's concept descriptions match the stub pattern — the description is the
  concept name followed by ` as required or described by ISO/IEC 42001:2023 and taught in the
  AIMS-F blueprint.`? Report `stub_count` and `total_concepts` for AIMS-F.
- Does any OTHER certification have descriptions matching an analogous name-plus-fixed-tail
  pattern? Group by certification and report the count of rows sharing the longest common
  description suffix within each certification, where that suffix is over 40 characters.
- For AIMS-F, are `tasks.knowledge`, `tasks.skills` and `tasks.abilities` populated, or is the
  concept layer the only hollow one? Report populated vs null counts.

I expect AIMS-F `stub_count` to be 154 of 154. 38 are already confirmed — 35 read in the
sample plus `cause-analysis`, `ai-policy` and `competence-does-not-carry` pulled live over MCP.
If the number is lower, tell me which AIMS-F concepts have real descriptions; those are the
house-style reference for the repair.

## 1.2 — Clear the 18 clean draws

For each entry in `CLEARANCE-PLAN.json` → `clear` (18 certification+language pairs, 2,586 rows):

- Write a row to the concept translation review table recording: certification, language,
  seed `2026-09-20-concepts`, sample size 20, reviewed_on `2026-09-21`, verdict `approved`,
  and the `en_hash` gate so a later English edit makes the review stale automatically —
  same pattern as `lesson_translation_reviews` and migration 352's translation-side hash.
- Set `is_provisional = false` for those certification+language pairs **only**.

The review row must carry the clearance wording from `CLEARANCE-PLAN.json` →
`clearance_claim_wording` verbatim. It says this is 20 rows per certification per language,
not a percentage. Draws ranged from 9% of AISM-I to 43% of AIE-I. Nothing may restate this
clearance as "8% of the corpus".

## 1.3 — Hold AIMS-F in both languages, with the reason in the row

AIMS-F es-419 and pt-BR drew **zero** translation defects. Do not clear them.

Write a review row for each with verdict `held` and the reason from `CLEARANCE-PLAN.json` →
`hold[].reason`: the English source descriptions are placeholder boilerplate, the translations
are faithful renderings of a stub, and clearing them would put review provenance behind text
that teaches nothing. `is_provisional` stays `true` for all 308 AIMS-F rows.

This row exists so that nobody later clears AIMS-F by looking only at a clean sample. The
sample is clean. That is the trap.

## 1.4 — Mark the 4 blocked draws

AIE-I/pt-BR, AIMS-IA/pt-BR, ISMS-F/es-419, ISMS-IA/es-419. Write a review row with verdict
`blocked`, carrying the blocking slug and note from the plan. `is_provisional` stays `true`
for all 566 rows in those four pairs. Prompt 4 works them.

## 1.5 — Record two rules in CLAUDE.md, each with its mechanism

**Rule — a sampling gate is scoped to what the sample can see.** A translation-fidelity sample
cannot clear source adequacy. AIMS-F returned a perfectly clean 40-row draw sitting over 154
placeholder descriptions, and every mechanical check passed: no empties, nothing identical to
English, no number drift, no dropped terms. Mechanism: before a certification enters any
translation queue, a source-adequacy check runs on the English — a description that is its own
name plus a tail shared by more than 20 rows in the same certification is a stub, and that
certification does not enter the queue. Every review row records whether a source gate ran.

**Rule — template-generated English must be template-generated in translation.** AIMS-F's
es-419 rows rendered one fixed English tail four different ways across 20 rows
(`blueprint AIMS-F` / `temario de AIMS-F` / `plan de estudios AIMS-F` / `temario AIMS-F`, and
three variants of `as required or described by`). Mechanism: where more than 20 English rows in
one certification share a description suffix, that suffix is translated once and substituted,
never translated per row. Guard: assert the count of distinct translated suffixes is exactly 1
per language.

## 1.6 — Post-conditions

Post-conditions assert a checksum over rows the migration is **not** authorised to change, not
a hardcoded row count. Four migrations have aborted against a correct database on hardcoded
literals (328, 345, 351, 352); do not make it five. Run every post-condition under
`set local role mcp_reader` — the 341 pattern — because 339 reached production and 500'd
`explain_task` in two languages for two hours.

Then verify on the wire, not from your own output: `get_concept` in all three languages for one
cleared certification (should now serve the translated description), one held AIMS-F concept
(should still fall back to English), and one blocked certification (should still fall back).

---

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

---

# PROMPT 3 — AIMS-F content repair

The big one. Run it after Prompt 1 has given the real `stub_count`.

## 3.1 — What is and is not broken

AIMS-F's 154 concepts are **good concepts**. The names are specific and considered —
`competence-does-not-carry` names the real trap for a 27001 shop moving into 42001. The task
code mappings are correct. The domain structure is correct.

**Do not change names, slugs, task mappings or domain structure.** The inventory is done. What
is missing is 154 descriptions. Every one currently reads as its own name plus
` as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.`

## 3.2 — House style

Not AIMS-IA's paragraphs. **ISMS-F's one-liners**, which are the proven Foundation-level style:

```
security control          :: a measure that modifies risk
management system maturity:: the progression from documented to genuinely operating
exclusion justification   :: the stated reason a control is not necessary
risk acceptance criteria  :: the thresholds at which a risk may be retained
```

One line. States what the thing *is*, not that the standard mentions it. A candidate who reads
it learns something they did not know from the name alone — that is the bar, and
`competence-does-not-carry` is the test case: if the description does not say *what* does not
carry and *why*, it has failed.

While you are there: `risk acceptance criteria` above is the ISMS-F English whose Spanish
rendering is one of the four blocking defects (Prompt 4). The English is loose — "the thresholds
at which a risk may be retained" does not say which side of the threshold. Tighten it, and the
Spanish defect becomes easier to fix correctly.

## 3.3 — Sources

- `iso42001.pdf` in the project
- the existing AIMS-F lesson bodies — the teaching material exists even though the concept
  definitions do not
- AIMS-IA's concept descriptions, which are correct, citation-bearing prose on the same
  standard, and can be drawn down to Foundation level

## 3.4 — The leak rule does not move

Run `scan-iso-leaks.mjs` over the new descriptions before anything is written. These are served
over MCP at contractVersion 2 to any caller — they are partner-visible, unauthenticated
blueprint content. A description must not reproduce ISO clause text. All four ISO corpora
currently stand at 0 refused; they stay there.

Note the gap you flagged earlier and have not closed: the 10-word threshold is close to
meaningless against descriptions this short. For a one-line description the n-gram seed needs to
be shorter, or the check needs a different instrument. **Tell me what you propose before you
rely on it** — do not write 154 descriptions behind a gate that cannot see them.

## 3.5 — Then re-translate, after deleting what exists

The 308 existing AIMS-F `concept_translations` rows render a placeholder. They are not a
starting point. Delete them, then regenerate from the new English.

Apply the template rule from Prompt 1.5 in reverse: there is now no shared tail, so each
description is translated on its own — but assert afterwards that no translated suffix is shared
by more than 20 rows, which would mean a stub was reintroduced.

## 3.6 — Then re-sample

New seed, `2026-<date>-aims-f`, 20 rows per language, same file shape as
`CONCEPT-SAMPLE.json` — `en_description` and `tr_description` side by side, empty `verdict`
and `note`. Send it to me and I will read it.

Do not clear AIMS-F on the strength of this prompt. The hold row from 1.3 is released by a
human read of the new sample, not by the repair having run.

---

# PROMPT 4 — Full read of the four blocked draws

566 rows: AIE-I/pt-BR (47), AIMS-IA/pt-BR (158), ISMS-F/es-419 (192), ISMS-IA/es-419 (169).

## 4.1 — What triggered each block

From `CLEARANCE-PLAN.json` → `block[].blocking_rows`. All four are rung-2 defects: right
language, wrong referent, invisible to every mechanical guard.

| Draw | Slug | Defect |
|---|---|---|
| AIE-I / pt-BR | `genai-limitations` | "quotations" → `transcrições` (transcripts) |
| ISMS-F / es-419 | `risk-acceptance-criteria` | `a partir de los cuales` inverts the threshold |
| ISMS-IA / es-419 | `ia-awareness-clause-7-3` | "not conforming" → `la no conformidad`, the ISO defined term |
| AIMS-IA / pt-BR | `aia-ai-policy-requirements` | clause→`Seção` substitution killed the clause-vs-control contrast |

In all three cases where the same concept was also drawn in the other language, **the other
language was correct.** That is why the block is per certification+language rather than per
certification, and it means these are per-row defects, not a systematic generator fault.

## 4.2 — Generate the read files

One file per blocked draw, same shape as `CONCEPT-SAMPLE.json`, **all** rows in that
certification+language, `en_description` beside `tr_description`, empty `verdict` and `note`.
Send them to me.

Order them largest-signal-first within each file: rows whose English contains a normative modal
(`shall`, `should`, `may`), a clause citation, or a defined term first, because that is where
rung-2 defects concentrate. Put the already-identified blocking row at the top of its file with
its note attached.

## 4.3 — Do not pre-fix

Do not repair the four known defects before generating the files. If they are fixed first, the
full read loses its anchor — I want to see whether the same hand made the same class of error
elsewhere in the same draw, and a repaired row hides that.

---

## What this leaves open

Carried forward, unchanged, not touched by any prompt above:

- Spanish-native architecture — English pivot vs native authoring, round-trip quality cost still unmeasured
- Concept leak gating — Prompt 3.4 forces a decision on it, which is the first movement on this item
- The specimen badge and practice item for `/our-standard`
- An auditor for the MCC drafts
- 16 tables maintaining `updated_at` by convention with no enforcement
