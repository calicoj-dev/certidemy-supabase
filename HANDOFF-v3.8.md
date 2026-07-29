# HANDOFF v3.8

Supersedes v3.7 for everything after the sales library shipped.
Migration tip **162**, next free **163**. Both repos clean and pushed.

---

## 1. What shipped

**The sales library is code-complete.** Four asset types generate in three
languages from live rows: fact sheet, specimen certificate, blueprint sheet,
JTA sheet. The team's checklist items 4 (JTA and blueprint visible) and 8
(demonstration credential) are closed as far as code can close them.

**Renderers**

- `_shared/blueprint.ts` v2 — exam composition, per-domain weights and question
  allocation, computed cognitive profile, derivation argument. Orphan control,
  domain descriptions, Bloom verb labels, ceiling read off the profile rather
  than typed, brand prefix stripped for display.
- `_shared/jta.ts` v2 — every declared task with level, criticality, frequency
  and examination scope, plus K/S/A where the language has it. Domain headers
  are a rule and type, not a filled band (v1's tint sat under the first task's
  ascenders because the rectangle height and the cursor arithmetic were computed
  separately).
- `bloomEntry` is exported from `blueprint.ts` and imported by `jta.ts`. One
  Bloom label table, not two.

**`render-asset` v6**

- `blueprint_sheet` and `jta_sheet` branches.
- Task counts read from live rows, never `exam_blueprint.task_counts`.
- `allocate()` is a verbatim port of `gen-jta-doc.mjs`'s largest-remainder
  rounding, which matches `generate-mock-exam`. Do not "simplify" it.
- **Cache keys are content-addressed** — see §3.
- **K/S/A language rule** — see §3.

**Web**

- `gov-flow.tsx` v3 — edge labels float clear when wider than the gap;
  side-aware endpoints make north/south edges possible; canvas height per flow.
- `library-flow.tsx` — certification record branches to JTA and scheme;
  comparison data deliberately has no edge; picker clustered by program.
- `lib/console/library.ts` — carries `categorySlug` / `categoryLabel` /
  `categorySort` from `cert_categories`, with a tolerant read for a translated
  label.

**Data**

- Migration **161** — `knowledge` / `skills` / `abilities` on
  `task_translations`. Empty; see §3 for the trap this opened.
- Migration **162** — all 33 English domain descriptions rewritten as
  buyer-facing copy. Removed self-assessment ("the richest domain"), pedagogy
  notes ("predominantly comprehension"), internal cross-references, and
  AIGRM-I D3's defensive "never implying Certidemy is any of them".
- 66 domain descriptions re-translated to es-419 / pt-BR. **All still
  `is_provisional = true`** — no document renders them yet.
- 7 terminology corrections applied by
  `scripts/patch-domain-translations-terminology.mjs`, which records the
  reasoning for each in its `EDITS` array.
- `gen-jta-translations.mjs` — `ONLY` scope knob, existing-title preservation,
  full dry-run output, glossary rules for statutes, scaling, lean, provenance,
  prompt, Developers, Done and named regulatory instruments.

---

## 2. Corrections to v3.7

**§4.3 is cancelled, not re-scoped.** There is no mojibake. Both repos scanned
with the correct signature — prefix followed by a non-letter — and every hit is
prose *about* mojibake in the handoff docs, plus `db/fix-encoding.mjs`'s own
doc comment.

**v3.7's advice to add `Ã`-prefixed sequences was wrong.** `Ã` and `Â` are
legitimate Portuguese. The corruption signature is prefix + non-letter, which
`certidemy-web/db/fix-encoding.mjs` already implements. If
`supabase/scripts/fix-mojibake.mjs` is a second fixer, retire it.

**The root cause, finally named.** PowerShell 5.1's `Get-Content` defaults to
the system ANSI code page, so a UTF-8 file without a BOM is decoded as
Windows-1252 and `é` becomes `Ã©` *before anything is printed*. No output
setting fixes it. This has been rediscovered in v1.9, v3.6, v3.7 and again this
session. Permanent fix, in `$PROFILE`:

```powershell
$PSDefaultParameterValues['Get-Content:Encoding'] = 'UTF8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

---

## 3. Traps and discipline

**Cache keys are content-addressed now.** The storage path is a SHA-256 of the
assembled data object the renderer receives. Three earlier attempts enumerated
source timestamps and each had to be extended after a stale document was found
(`computed_at` for Bloom edits, task stamps for statement edits, then migration
162 exposed domains). Enumerating cannot be finished and fails silently toward
serving a client a stale PDF. Renderer version stays a path segment so layout
changes still invalidate independently.

**K/S/A never falls back to English in a translated document.** v4 inferred
"this language has K/S/A" from the translation query *succeeding*. When
migration 161 created the columns empty, that inference became true while the
data was absent — Spanish sheets would have interleaved English knowledge
statements. Two rules: translated values or nothing, and all-or-nothing per
language.

**`is_provisional` is row-level.** A provisional `domain_translations` row drops
out entirely, so the sheet falls back to the English *title* as well as the
description. Expected behaviour, but it means a translation run visibly degrades
the Spanish sheets until the flag is flipped.

**Re-running `FORCE` is not idempotent.** `gen-jta-translations` runs at
temperature 0.2, so every pass re-rolls all strings. Four passes is how "lean"
became inconsistent *within* Portuguese when the first pass had it consistent.
Fix specific rows with a targeted patch script; never re-run to correct wording.

**The Supabase SQL editor shows only the last statement's result set.** Run
multi-statement checks one at a time or you will believe a check passed that you
never saw.

**`$env:` persists for the PowerShell session.** A leftover `CERT_ID` ran a
translation pass against AIHR-I when SM-AI-I was intended. Scripts print the
certification name — read it.

**Never put escaped double quotes inside `node -e "..."` from PowerShell.** The
shell mangles them before Node sees them. Use single quotes in the JS, or
`Select-String`.

**`.gitignore` has a blanket `patch-*.mjs`.** Every one-off patch script is
invisible in the repo, including ones whose names suggest they carry real
reasoning. Force-add or narrow the rule.

**Anchored patches must be verified by grep, every time.** Two patches applied
twice this session because a replacement ran against an already-patched file;
both were caught only by the verification line.

---

## 4. Next session

1. **English K/S/A editing pass.** ~900 fields across 302 tasks. The AI-era
   tasks are already publication prose; the older Scrum entries carry arrows,
   semicolons and `≤`, written as internal notes and now published verbatim in
   the JTA sheet. **Nothing can be translated until this is done** or you
   translate notes into three languages.
2. **Native-speaker read of the 66 domain translations, then flip
   `is_provisional` to false.** Two known Spanish slips: `el Definition of Done`
   and `el Scrum Guide` take feminine articles (`la definición`, `la guía`).
   The content hash means the sheets pick up the change automatically.
3. **SM-AI-I D4 runs 4.11 → 4.13.** Task 4.12 is absent while the header counts
   13. Retirement or authoring error — a buyer will notice either way.
4. **`fuentes principales` has no column.** The team's item 4 asks for it; the
   JTA markdown headers carry it outside the database.
5. **`listCatalogGroups` never asks `cert_categories_i18n` for a label**, so
   program headings render in English on the public Spanish and Portuguese
   catalog. Customer-facing.
6. **`COGNITIVE-MODEL.md` §4 has a hand-typed profile table** that no longer
   matches the database — a Bloom target table in the document that forbids
   them. Regenerate or replace with a pointer.
7. **Task 5.7's lesson should carry the official LATAM Spanish Scrum terms.**
   The official translation renders the three commitments as Objetivo del
   Producto, Objetivo del Sprint and Definición de Terminado; Certidemy keeps
   them English. Teaching the mapping turns a divergence into curriculum.

---

## 5. Owed by Juan, not by code

- Legal entity, jurisdiction, who authorizes issuance, attempt cap.
- AI and internet policy during the exam. **The honest answer to "is there
  proctoring" is currently no** — `exam-leave-guard` is a UX guard, not
  invigilation. Do not let the candidate handbook inherit a claim the software
  does not make.
- Cookies, refunds and contact routes do not exist. Terms and privacy do.
- `/pricing` exists on Certidemy while every asset deliberately carries no price
  because pricing is CertiGlobal's. Those two facts need to agree.
- Competitor facts for the comparison sheet: where they come from and who signs
  off that each is current. The battlecard is the asset the sales team most
  wants and the only one that is not a rendering problem.
- Corrected badge codes and the wordmark PNG from the design team. Insertion
  points are marked in all three renderers.
