# HANDOFF v6.9 — AIMS-IA through Stage 8

**Checkpoint, not a completion.** AIMS-IA (ISO/IEC 42001:2023 Internal Auditor) is
built through Stage 8: cert row, five domains, forty tasks, 158 concepts, five
modules, forty lessons, loaded and projected, all coverage proofs green. Stage 9
(item generation) has not started.

**Migration tip 207, next free 208.**
**supabase `f9bfb53`. certidemy-web `74fa417`.**
**Eleven certifications now exist; ten are `available`, AIMS-IA is `draft`.**

---

## 1. What AIMS-IA is

| | |
|---|---|
| Code | `AIMS-IA` |
| Name | **`ISO/IEC 42001:2023 Internal Auditor`** — no `- AI` suffix |
| UUID | `4818fc03-6da0-4266-9329-0e1ea2ea3fb4` |
| Tier | II (single-best-answer, four defensible options) |
| Status | `draft` |
| Category | `governance-service-management`, sort_order 4 |
| Validity | 730 days |
| Exam | 50 items, 75%, **duration NULL by design** |
| Siblings | `AIMS-F` (same standard, Foundation) · `ISMS-IA` (same role, ISO/IEC 27001) |

**The name is load-bearing.** `groundingFor()` routes on it: `/auditor|internal audit/`
selects the audit grounding, then `/42001|aims/` selects the 42001 criteria half.
Renaming without updating `scripts/lib/item-grounding.mjs` would generate 42001 items
grounded in ISO/IEC 27001 editions.

**The UUID is a generated v4, not a repeating-digit slot.** The `8888` slot was used
briefly and reverted: the rubric does not scale past a dozen certs and recent certs
already use v4. **`9999` remains the last unspent readable slot; do not spend it.**

---

## 2. Structure

| Domain | Title | Weight | Tasks |
|---|---|---|---|
| D1 | The internal audit function and its boundaries | 12.50% | 5 |
| D2 | Audit programme management | 20.00% | 7 |
| D3 | Conducting the audit: evidence, sampling and testing | 20.00% | 8 |
| D4 | Auditing the AIMS against ISO/IEC 42001 as criteria | **30.00%** | **13** |
| D5 | Findings, reporting, follow-up and management review | 17.50% | 7 |

**Cognitive profile: understand 13.02 / apply 17.50 / analyze 69.48.** Verified from
the landed rows, matching the blueprint computed before any row existed.

Modules map one-to-one onto domains: `aia-audit-function`, `aia-audit-programme`,
`aia-conducting-the-audit`, `aia-auditing-the-aims`, `aia-findings-and-follow-up`,
at 110/155/175/285/155 estimated minutes (22 per lesson, matching ISMS-IA).

**D3/D4 boundary rule, confirmed in review:** D3 asks *is this evidence sufficient?*
D4 asks *sufficient for which requirement?*

---

## 3. Artifacts

| File | Repo | State |
|---|---|---|
| `AIMS-IA_JTA_v1_1.md` | supabase | **v1.1-LOCKED** |
| `SCHEME-AIMS-IA.md` | supabase | 12 sections |
| `STYLE-GUIDE-AIMS-IA.md` | supabase | **15 sections** — the quality contract |
| `migrations/205_aims_ia_scaffold.sql` | supabase | applied |
| `migrations/206_aims_ia_concepts.sql` | supabase | **record only — applied via loader** |
| `migrations/207_aims_ia_modules.sql` | supabase | applied |
| `scripts/load-aims-ia-concepts.mjs` + `.json` | supabase | the execution path for 206 |
| `scripts/load-aims-ia-modules.mjs` + `.json` | supabase | idempotent |
| `content/aims-ia/**` (40 lessons) | certidemy-web | loaded and wired |

**`STYLE-GUIDE-AIMS-IA.md` is the most reusable output of this session.** Sections 11,
13 and 15 are rules returned by external review after modules 2, 3 and 4 — the review
was explicitly asked for rules that generalise rather than per-lesson verdicts, and it
delivered. Read it before authoring anything for this cert or its siblings.

---

## 4. Standards facts, verified against the PDFs

The three PDFs in the project are ZIP archives of page JPEGs **with a per-page text
layer**, so real `grep` works. Method validated by reproducing v6.5's recorded ISO 19011
counts exactly.

### ISO/IEC 42001:2023

- **121 `shall` / 166 `should`, split structurally.** Clauses 4–10 carry 81 `shall`
  and **zero** `should`. Annex A is `shall`. Annex B is almost entirely `should`.
- **Annex A and Annex B are both normative.** Annexes C and D are informative.
- **Annex B restates each control in `should` where Table A.1 says `shall`.** A.2.2
  *shall document a policy*; B.2.2 *should document a policy*. Same control, two modals.
- **Annex B binds via clause 6.1.3 e)** — the organization *shall consider the guidance
  in Annex B*. B.1 states organizations need not document or justify inclusion or
  exclusion of implementation guidance in the SoA, that it is not always suitable or
  sufficient, and that they can modify it or define their own.
- **Annex A.1: "Not all the control objectives and controls listed in Table A.1 are
  required to be used."** Every Table A.1 `shall` is conditional on selection.
- **No amendment exists.** The climate-change wording is in the published first edition
  (4.1 requirement, 4.2 NOTE). ISO/IEC 27001:2022 acquired the same wording through
  Amd 1:2024. **Citing `ISO/IEC 42001:2023/Amd 1` is a false attribution.**
- **Only normative reference is ISO/IEC 22989:2022**, dated — a future edition does not
  flow through. ISO 19011 appears once, in a Note to entry at clause 3.18.
- **`risk register` appears zero times.** **No risk-owner requirement either** — that is
  ISO/IEC 27001 clause 6.1.2 c) 2).
- **42001 defines its own vocabulary**: nonconformity 3.16, conformity 3.15, corrective
  action 3.17. Unlike 27001, which relies on ISO/IEC 27000.
- **Drafting anomalies:** Note 2 to entry under 3.26 contains `shall` (cite 6.1.3 f)
  instead). A.6.2.6 and A.6.2.8 contain an internal `should` for enumerated content.
  Annex B contains one `shall`, at B.7.6.

### ISO 19011:2026

- **One `shall`** (patent boilerplate) / **264 `should`**. No normative references.
  Names neither 42001 nor 27001.
- **Exactly one annex.** Annex A (informative), A.1–A.18. **There is no Annex B.**
  A.17 is *Conducting interviews* — the prior session's claim confirmed.
- Fourth-edition changes: remote auditing guidance from ISO/IEC TS 17012, and Annex A
  expanded for remote methods and virtual locations.
- Introduction: **ISO/IEC 17021-1 provides requirements for third-party certification**;
  19011 concentrates on first and second party.

### ISO/IEC 42006:2025 — verified externally, **not held**

Published 7 July 2025 by ISO/IEC JTC 1/SC 42, first edition. Specifies additional
requirements to ISO/IEC 17021-1 for bodies auditing and certifying an AIMS against
ISO/IEC 42001. **Governs certification bodies, not internal auditors.** May be named for
scope; **no clause may be cited** — the document is not held.

**Source-licence rule established this session:** no task, concept or item may rest on a
document the body does not hold. Applies to 22989, 42006 and 17021-1. Unlicensed copies
(e.g. document-sharing sites) are not a substitute; a scheme claiming ISO/IEC 17024
rigor cannot have "sourced from an unlicensed scan" in its audit trail.

---

## 5. Grounding — the fix that mattered most

`scripts/lib/item-grounding.mjs`, commits `fdb5f22` and `9f0a9c2`.

**The record was wrong.** v6.5 says the AUDIT grounding fix landed in migration 198. It
did not — 198 is four ISMS-IA concept rows and task 1.2. **The grounding lives in code.**

**Two defects fixed:**

1. **A duplicated 31-line block** (lines 166–196 repeated 135–165) — an append where a
   replace was intended, sending ~1.5k duplicated characters into every ISMS-IA call.
2. **AUDIT hardcoded ISO/IEC 27001 as the criteria standard**, and AIMS-IA matches
   `/auditor/`. It would have generated 42001 items grounded in 27001 editions — the
   same defect the file was written to fix, one layer up.

**Now composed:** `AUDIT_METHOD` (19011, principles, the full Annex A list, modal
discipline, internal-vs-CB boundary) + `CRITERIA_27001` or `CRITERIA_42001`. Routing
keys on the **standard**, not the word "auditor". An unregistered audit cert gets
`AUDIT_METHOD_ONLY` rather than someone else's editions.

**Known and not fixed: `AIMS-F`, `ISMS-F`, `AISM-I` and `AIHR-I` all resolve to
`NEUTRAL`**, which carries no edition set and no never-assert list. Both Foundation
certs are standards-based and were generated without their prompt ever being told what
their standard says. **This is the likely mechanism behind the ISMS-F task 2.3 defect.**
The forward fix is three lines of routing; it implies regenerating banks, so it is a
scoped decision.

---

## 6. Operational lessons — read these before the next session

### The Supabase SQL editor injects text into pastes

Reproduced **four times**, including in fresh tabs: three lines appended after the
pasted content, `ALTER TABLE any ENABLE ROW LEVEL SECURITY;` with a literal `any`
placeholder. An earlier `relation "a" does not exist` was the same phenomenon.

**Three parsers accepted the SQL each time** — quote-state walk, sqlglot, and libpg_query
(the actual PostgreSQL parser). The file was never the problem.

**Rule: anything over ~50 rows goes through a loader.** The `.sql` in `migrations/` is
the versioned record; the loader is the execution path. This is already the rule for
lessons and should never have been re-litigated for concepts.

**Loaders should have zero external dependencies.** `load-aims-ia-concepts.mjs` parses
`scripts/.env` itself and uses built-in `fetch` — it cannot fail on a package the repo
may not have. The first version imported `dotenv` and died immediately, because it was
written without reading an existing script first.

### PS 5.1 `Get-Content` reads with the system codepage, not UTF-8

**This produced two false diagnoses in one session.** A UTF-8 `·` displays as `Â·`,
which looks exactly like mojibake; and a regex on an em-dash returned zero matches
against a file that contained it.

**Rule: read UTF-8 files with `[System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)`.**
Bare `Get-Content` is for ASCII only.

**Corollary for the mojibake playbook:** the documented DETECT query checks `%â€%` and
`%Ã%`. Neither catches `Â` (U+00C2). Worth widening — though the false alarm this
session was display encoding, not corruption.

### Deleting a certification's domains requires deleting the certification too

`check_domain_weights_sum` is `DEFERRABLE INITIALLY DEFERRED`. Removing domains leaves a
sum of 0.00 at commit and the constraint rejects it. **Any scheme teardown is one
transaction, or it does not work.**

### Count rows before reacting to a duplicate-key error

A `23505` on the cert row meant the insert had already succeeded. It was read as failure
and a teardown was attempted twice; the trigger above is the only reason nothing was
lost. **Query the table before reaching for a delete.**

### Other traps hit this session

- `Get-ChildItem -Filter` takes one string, not an array.
- Nested `""` inside `"…"` leaves PowerShell waiting at `>>`.
- Slicing a SQL file by a guessed line offset truncated a statement mid-string; slice to
  the terminating semicolon instead, and assert every block's quote count is even.
- `Set-Clipboard` in consecutive code blocks: the user pastes the whole block, all run,
  only the last survives. **One clipboard command per message, or use files.**
- A text cleaner that stripped `**bold**` but not `*italics*` put markdown into SQL
  strings. Assert zero residue before writing.

---

## 7. The lesson validator — two checks that caught real defects

Beyond the obvious (markers balanced, one `::checkpoint`, one `::summary`, JSON parses,
zero non-ASCII, four options, four questions, difficulty ≥ 3, no `multi_choice`,
claim-based concept titles):

**1. `concept_slugs` containment.** Checkpoint and widget `concept_slugs` must be
subsets of what the lesson declares in frontmatter. Caught `02-06` citing a slug
belonging to task 2.5 — which `wire-lessons.mjs` would have reported as UNRESOLVED after
all 40 lessons were already loaded.

**2. Bloom against the JTA, per lesson.** Caught `05-01` written at understand level when
task 5.1 is apply. That task was one of five moved in the JTA amendment; the lesson was
written to the pre-amendment level.

Both are cheap and both found things reading would not have.

---

## 8. The JTA amendments — how the cognitive profile got corrected

The JTA locked at v1.0 and was amended twice before Stage 6.

**Amendment 1.** The profile read understand 25.52 / apply 5.00 / analyze 69.48, against
ISMS-IA's 5.0 / 29.4 / 65.6 — nearly inverted on the middle two for two schemes built
parallel. Investigation found the bloom labels were *correct* and **five task statements
were lying**: 1.1, 1.3, 1.5, 3.1 and 5.1 said *Explain* or *Distinguish* while their own
S fields described applied work. **Same defect as migration 198.** Fixed by moving the
statement to match the competence, not by relabelling the bloom — the statement is what a
candidate reads on the published blueprint.

**Amendment 2.** The §3 weight table was updated at v1.1 and the domain **headings** were
not, so the document contradicted itself (D3 22.50 vs 20.00). Caught because migration
205 is **generated from the JTA rather than transcribed beside it** — a self-contradicting
document fails to generate instead of producing a database that quietly disagrees with
the published blueprint.

**Rule: generate migrations from the locked JTA. Do not transcribe.**

---

## 9. Scheme decisions — made, and pending

**Made:**

- **Validity 730 days**, reached by the *opposite* argument to ISMS-IA's. ISMS-IA: slow
  revision cycles. AIMS-IA: 42001's clause text is stable (first edition, no amendment,
  systematic review ~2028) but its ecosystem is not — 42006 arrived 18 months later,
  Annex B leans on 5259/23894/TS 4213, AI regulation phases in across the window.
  Recorded as a judgement to revisit.
- **50 items at 75%**, matching ISMS-IA so the two Level II schemes stay comparable.
- **Eligibility: none.** No hours, no application. Internal audit is where an auditor
  *starts* accumulating experience; neither 42001 clause 9.2 nor ISO 19011 requires
  certification; and **a declared criterion the body does not verify is worse than none**.
  A recommended profile appears as guidance, not a prerequisite.
- **`exam_duration_minutes` is NULL.** Deliberate. §6 of the scheme forbids inheriting
  ISMS-IA's 150 minutes at 69.48% analyze against 65.60. **Publication gate: non-null,
  measured on this bank.**

**Pending:**

- **Re-measure `cue_tolerance` after the bank exists.** Currently declared
  `PROVISIONAL - NOT YET MEASURED ON THIS BANK` with `measured_over: null`, holding
  ISMS-IA's 25 / 15 / 100 as an unmeasured starting point. The declaration must exist or
  the generator falls back to the L1 default (5 chars / 10%) and rejects correct L2 items.
- **Derive exam duration** from measured item lengths.
- **Session timeout verification** before publication.

---

## 10. Stage 9 — what to do next

```
CHUNK=3
BANK_REVISION=v3-l2
```

**Do NOT set `KEY_LEN_MARGIN`, `KEY_LEN_PCT` or `LEN_SPREAD_MAX`.** Cue tolerance comes
from the blueprint. **If the generator prints `(default)` rather than `(blueprint)`, stop
— the seed migration's declaration is not being read.**

The tier gate is `tier >= 2 AND bloom_level = '4_analyze'`, per task. **Twenty-eight tasks
generate on the Level II contract; twelve stay on Level I.** Do not force four-defensible
onto a task with one right answer.

**Task 4.12 sampling requirement** (style guide §12, and in the blueprint's
`item_model.task_4_12_sampling`): the bank for 4.12 must deliberately reach control
families **A.4 resources, A.6 life cycle and A.7 data** — not only A.2 and A.3. A bank
drawn from the ISMS-familiar families tests nothing this credential exists to certify.

**Practice pool floor: ≥10 per task per language.** At 40 tasks that is 1,200 practice
rows across three languages, and ≥8 secure per task per language is 960.

### Then the six surfaces, all checked by `verify-cert`

| Surface | How |
|---|---|
| Catalogue claim ×3 | English in a migration, es-419 + pt-BR via `load-cert-i18n.mjs` |
| Long-form description ×3 | copy `load-isms-ia-descriptions.mjs` |
| Domain + task translations | `gen-jta-translations.mjs`, `CERT_ID` + `ONLY=all` |
| Public samples | 6 groups, 6 **distinct** tasks, blueprint-weighted |
| Badge | `certidemy-web/public/badges/AIMS-IA.png` |
| Translation review | `gen-translation-review.mjs`, then flip `is_provisional` |

---

## 11. Open items

**Resolved this session:**

- **ISMS-F task 2.3.** Read Amd 1:2024 directly — six pages, two sentences, added to 4.1
  and 4.2. It says **climate change** and nothing resembling "environmental-conditions".
  The defect is confirmed; the fix is still outstanding, and it is visible in the live
  Open Badges Achievement JSON, not just a DB row.
- **The ISO 19011 annex list** is now in `AUDIT_METHOD`, so the critique reviewer stops
  rejecting correct annex citations.

**Likely stale — verify before carrying forward again:**

- **LESSON_AUTHORING_SPEC §7.4 missing.** The project copy has §7.4 `highlight-mistake`
  at line 557. Either the item is stale or the repo copy differs. `git log` the file.

**Carried forward:**

- `exam_blueprint.item_model.cue_guard` on **ISMS-IA** documents a qualification-density
  guard that does not exist — the guard measures characters. AIMS-IA's blueprint states
  it accurately and names ISMS-IA's as wrong; ISMS-IA's own row is a one-line migration.
- **K/S/A review pass for ISMS-IA.** `ksa_is_provisional` is a separate flag; the site
  withholds those fields until reviewed, so the blueprint drawer shows nothing for them
  in es-419 and pt-BR.
- **Four certs route to `NEUTRAL` grounding** (§5 above).
- 16 tasks across the catalogue with create-verb skills fields (WARN).
- **CAIP-I** — Level II slot in the AI Essentials ladder, unbuilt.
- **PL 2338 (Brazil)** — re-verification trigger for AIHR-I Domain 2 if it passes.
- **Lead Auditor** — scoped this session and deliberately deferred. It needs ISO/IEC
  17021-1 (licensed) plus 42006, and an **experience-verification workflow** that does not
  exist: application, evidence capture, reviewer queue, approve/reject with reasons,
  audit trail, revocation. The market model is one exam with four credentials gated at
  application (Provisional / Auditor / Lead / Senior). **Certidemy is a 17024 body only;
  17021-1 never applies to it** — it is subject matter for the candidate, not a standard
  Certidemy conforms to.

---

## 12. Where the review process landed

Five modules, five external reviews, all accepted: **9.0, accepted, accepted, "strongest
module so far", 9.1 / "ship it"**. The review was asked each time for **stated rules that
generalise**, not per-lesson verdicts, and those rules became style guide sections 11, 13
and 15. That is the reusable part.

Three rules the module 4 review described as **settled and locked for item generation**:

1. **Clause requirements are unconditional; Table A.1 `shall`s are conditional on
   selection.** Excluding a control never removes a clause obligation.
2. **Cite Table A.1 for a control, never Annex B.** The only Annex B finding available is
   that it was *not considered*, under 6.1.3 e).
3. **The statement of applicability records decisions, not operation.** A declared control
   not operated is a **clause 8.1** finding.

---

*End of HANDOFF v6.9. Migration tip 207, next free 208. supabase `f9bfb53`,
certidemy-web `74fa417`. AIMS-IA is Stage 8 complete and Stage 9 has not begun.*
