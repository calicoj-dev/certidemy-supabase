# HANDOFF v3.5

**Date:** 26 July 2026
**Migration tip:** 148 (next free: 149)
**Handoff chain:** v3.4 → **v3.5**
**Scope of this session:** AIHR-I built end to end, from "should we do this?" to
`status = available`. Cert #7.

---

## 1. What shipped

**AIHR-I — Certidemy AI for Human Resources & Talent I.** A Level I role
credential for the people who make employment decisions: recruiters, talent
acquisition specialists, HR business partners, hiring managers, HR operations.

| | |
|---|---|
| UUID | `77777777-7777-7777-7777-777777777777` |
| Program | `ai-workplace` (alongside AIE-I) |
| Tier | Level I, **lateral to AIE-I** — a role specialization, not a rung on the literacy ladder |
| Structure | 4 domains · 28 tasks · 114 concepts · 118 task_concepts links · 4 modules |
| Exam | 40 items · 50 minutes · 80% (32/40) · closed book |
| Cognitive profile | 14.67 Understand / 64.00 Apply / 21.33 Analyze — **zero Remember-level tasks** |
| Content | 28 lessons × 3 languages = 84 rows |
| Item banks | 672 secure (224 logical) + 840 practice (280 logical) = **1,512 items** |
| Validity | 1 year |
| Languages | en · es-419 · pt-BR, complete at every layer |
| Migrations | 145–148 |
| verify-cert | **29 pass / 0 fail / 0 warn** — ALL INVARIANTS HOLD |

Status flipped to `available` by Juan via the super-admin console after
`verify-cert.mjs --cert AIHR-I` returned all-clear.

### Domain structure

| # | Domain | Weight | Items | Tasks | Lessons |
|---|---|---|---|---|---|
| 1 | AI in the Talent Lifecycle | 20% | 8 | 5 | 5 |
| 2 | Legal Exposure, Bias & Candidate Rights | 30% | 12 | 9 | 9 |
| 3 | Scoping Roles & Evaluating Capability Claims | 30% | 12 | 9 | 9 |
| 4 | Responsible AI Use in the Recruiter Workflow | 20% | 8 | 5 | 5 |

**Module 2 lesson order departs from task-code order deliberately:** 02-01
teaches task 2.2 (the six-duty taxonomy) before 02-02 teaches task 2.1 (which
duties attach here), because sorting obligations into categories requires having
the categories. `jta.displayOrder` governs task display within a domain, not
lesson sequence within a module, so this is safe and verified.

### Artifacts committed

**supabase repo**
- `jta/AIHR-I_JTA_v2.0.md` — locked launch baseline
- `SCHEME-AIHR-I.md` — 12-section certification scheme
- `STYLE-GUIDE-AIHR-I.md` — 12-convention per-cert authoring delta
- `AIHR-I-LATAM-REGULATORY-RECORD.md` — source of record for Domain 2, verified 26 July 2026
- `migrations/145_seed_aihr_i.sql` · `146_seed_aihr_i_modules.sql` · `147_aihr_i_exam_blueprint.sql` · `148_aihr_i_statement_verbs.sql`
- `jta/AIE-I_JTA_v2.0.md` — pricing row struck (see §4)

**certidemy-web repo**
- `content/aihr-i/` — 28 English lessons across 4 module folders
- `content/aihr-i/_i18n/es-419/` and `_i18n/pt-BR/` — 56 translated lessons
- `scripts/load-jta-i18n.mjs` — AIHR-I block, full not stub, approved

### Commits

| Hash | Repo | What |
|---|---|---|
| `863b977` | supabase | scaffold: JTA, scheme doc, migrations 145–148 |
| `553f047` | web | JTA translations, provisional |
| `0794968` | supabase | style guide + LATAM regulatory record |
| `cbb93d8` | web | modules 1 and 2, 14 lessons |
| `8b6e9b0` | web | JTA translations approved |
| `e60a5bd` | web | modules 3 and 4, content complete at 28 |
| `bb8d4e7` | supabase | JTA v2.0 launch baseline, validity 1 year |
| `0cb9e1d` | web | es-419 and pt-BR lesson translations |

---

## 2. The arc, and the order that made it work

Stages 1–11 of `CERT-CREATION.md` in one session. The sequencing that mattered:

**BoK agreed with sources verified live.** Three of the regulatory anchors had
moved within the previous ninety days. Verifying them before writing changed the
JTA's central design rule (§3 below).

**JTA authored → external review → reconcile → lock.** Two review rounds. The
second produced the exam-length change (30 → 40 items) and closed two coverage
gaps.

**Scaffold → verify → fix → translate.** This order is the finding. Migration
148 corrected three task statements that `verify-cert` caught. Had the JTA
translation wave run first, that correction would have flipped six translation
rows back to provisional and forced a re-review of signed-off work. **Structural
invariants must be green before the translation gate, not after.**

**JTA translation before any lesson authoring.** The thing that has bitten this
platform repeatedly, done early this time. Grok reviewed, three corrections
applied to the pack, `--approve` flipped 64 rows.

**Module 1 → review → per-cert style guide → modules 2–4.** The style guide was
derived from what module 1 actually established rather than written in advance.

**Load → wire → prove coverage → item banks → lesson localization.**

---

## 3. What we found

### 3.1 Rule 5b — MCQ-assessability and cognitive level are separate constraints

The JTA's Rule 5 originally required task verbs to be MCQ-assessable and listed
*evaluate* and *judge* among the permitted set. Both are assessable by selection.
Both sit at **Bloom 5**, above this scheme's declared Analyze ceiling.

Three statements shipped into the scaffold carrying them. `verify-cert`
invariant `jta.statementVerb` caught all three before any content existed
(migration 148). **Enforcing assessability without enforcing level lets a task
publish a claim one cognitive level above what the exam measures.**

Rule 5b now carries a level-banded verb table. Worth applying to the other six
certs — their task statements are immutable, so the check there is whether items
written against those tasks over-claim, which is an item-bank audit rather than
a migration.

### 3.2 The LATAM finding that proves the taxonomy

Brazil, Colombia and Mexico have **no dedicated employment-AI statute between
them.** What they have: data-protection law reaching AI hiring anyway (Brazil's
LGPD right to review of automated decisions; Colombia's Ley 1581; Mexico's
LFPDPPP 2025), one AI-specific regulatory circular already in force (SIC Circular
Externa 002, 21 Aug 2024, requiring idoneidad/necesidad/razonabilidad/
proporcionalidad plus a privacy impact study at high risk), ministerial guidance
(MinTIC, 22 Apr 2026), a constitutional tutela route, and two pending bills.

A learner who memorised "the LATAM AI rules" would have memorised nothing usable.
A learner who asks *which of the six duties attaches here, under what
instrument* works in all three countries and still works when the pending bills
land. **That is the argument for teaching the obligation taxonomy rather than a
statute list, and Domain 2 makes it explicitly.**

### 3.3 Dead authorities are a live hazard

**INAI does not exist.** Abolished by Mexico's constitutional reform published 20
December 2024; the new LFPDPPP took effect 21 March 2025 with the Secretaría
Anticorrupción y Buen Gobierno as regulator. A large amount of 2026
Spanish-language compliance material still names INAI as the enforcing authority
and attributes fine ranges to it.

Recorded as a hard prohibition in the LATAM record. It is also the clearest
demonstration of why `verified_as_of` exists on every Domain 2 lesson.

### 3.4 Regulatory movement in the six months before the build

- **EU:** Digital Omnibus (Parliament 16 June 2026, Council 29 June 2026)
  **deferred Annex III employment high-risk obligations from 2 Aug 2026 to 2 Dec
  2027.** Most Article 50 transparency obligations were **not** deferred and
  apply 2 Aug 2026.
- **Colorado:** SB 26-189 (signed 14 May 2026) **repealed SB 24-205 before it
  ever took effect** and replaced it with a structurally different ADMT regime,
  effective 1 Jan 2027, currently under an enforcement stay.
- **Illinois:** HB 3773 in force 1 Jan 2026; IDHR implementing rules proposed 15
  May 2026, comment closed 29 June 2026 — **confirm final status before
  publishing Domain 2 updates.**
- **Brazil:** PL 2338 passed the Senate 10 Dec 2024, remitted to the Chamber 17
  March 2025, **still pending**, expected to move before the August 2026 recess.
  **That trigger may fire within days of this handoff.**

### 3.5 Documentation drift — the session's recurring failure

Four documents described a database or a repo state that had moved:

| Document | Defect |
|---|---|
| `CERT-SCHEMA-GUIDE.md` §2 | Lists `is_published`, dropped by 069-part-2. Omits `price_usd`, `exam_link`, `max_exam_attempts`, `attempt_window_months`. **Caused a failed migration.** |
| `CERT-SCHEMA-GUIDE.md` §7 | UUID table stops at `5555` and says next is `6666`; `6666` went to AISM-I and `7777` to AIHR-I |
| `CERT-CREATION.md` (project copy) | Pre-v3.0 — Stage 11 still reads "translate lessons," not the JTA translation gate |
| `AIE-I_JTA_v2.0.md` | Carried a pricing row (`$19-29`); pricing is CertiGlobal's. **Struck this session.** |

The pattern is not carelessness. It is that hand-written docs have no invariant
binding them to the schema. `gen-jta-doc.mjs` solved this for JTAs.
**`CERT-SCHEMA-GUIDE.md` §2 is the obvious next candidate — it could be
generated from `information_schema`.**

**Standing rule from this session: query `information_schema` before writing
scaffold SQL. Do not trust the guide.**

### 3.6 Validity was already right; the documents were wrong

Every credential ever issued carries **365 days** — set by
`053_rename_certs_ai_and_expiry.sql`. House policy was implemented all along.

The rationale, per Juan, is **content re-review cadence, not candidate memory**:
a validity period is a commitment to re-review the body of knowledge on that
schedule. Certs anchored to stable frameworks may hold a version for years under
the same cadence; AIHR-I cannot, given §3.4.

**Open: `AIE-I_JTA_v2.0.md` still states 2 years**, contradicted by its own
holders' credentials. Second defect in that file after the pricing row.

### 3.7 Script landmines

**`CERT_ID` defaults to SM-AI-I / SM-I in four scripts** —
`gen-jta-translations.mjs`, `wire-lessons.mjs`, `gen-cert-secure.mjs`,
`backfill-practice.mjs`. A missed env var writes to a live published cert and
reports success. Same failure class as the AIE-I/AISM-I UUID collision. **Should
exit if unset rather than pick a cert.**

**Flag conventions differ within the same repo:** `--dry` on
`load-lessons-direct.mjs` and `translate-lessons.mjs`; `DRY_RUN` env on
`wire-lessons.mjs`, `gen-cert-secure.mjs`, `backfill-practice.mjs`. Unknown flags
are silently ignored and the run goes live.

**`TASK_ID` takes a UUID, not a task code.** Passing `4.5` filtered to zero tasks
and reported cleanly.

**`load-lessons-direct.mjs` has no `_i18n` awareness.** `--in` must point at
`content/<cert>/_i18n/<lang>` explicitly.

**`gen-cert-secure.mjs` header warns the shared `.env` may set `MAX_TASKS=9`.**
Verified: it sets none of `MAX_TASKS`, `SECURE_PER_TASK`, `CERT_ID`, `CHUNK`. The
warning does not apply to this environment, but a silent partial run would look
identical to a complete one.

### 3.8 Two process failures worth not repeating

**A greedy glob swept nine AISM-I lessons into AIHR-I's module 2 folder.**
`Get-ChildItem "Downloads\02-0*-*.md"` matched every `02-` prefixed file present,
including stale AISM-I content. Caught by checking `certification_code` in
frontmatter rather than filenames. **Content moves now use explicit filename
lists, the way migrations already did.**

**Module 1 went missing.** The move command was issued, the conversation moved
on to module 2, and it never ran. Downloads was later cleared. Recovered from
the outputs directory. **"Files landed in the repo" is a step to confirm, not
assume.**

### 3.9 The Grok pattern, confirmed again

Asked twice for **stated conventions**; returned **verdicts** both times. Style
guide had to be extracted from what module 1 established rather than received.

Craft judgment sound: caught task 3.3's production verb (`Write a job
description`) and cited the SPO-AI-I / SD-AI-I precedent correctly. Enumeration
incomplete: **flagged 1 of 7** production-verb statements. Consistent with prior
sessions — accept the craft note, re-run the sweep yourself.

Substantive contributions this session: the exam-length diagnosis (correct, though
his suggested 35 does not work under clean weights), the Domain 3 firewall being
aspirational rather than enforceable, and confirming the 04-03 detection position.

### 3.10 Style guide §11 was written too tightly

The per-cert guide required a lesson's top checkpoint item to **match** its
task's Bloom level. Module 2 validation flagged 02-03 (task 2.3 is Understand,
checkpoint closes at Apply) — but 01-01 does the same and Grok had already locked
it. A three-Understand checkpoint has no difficulty progression at all, and
checkpoints are formative and do not pass through `trg_item_bloom_matches_task`.

**Amended:** an Understand-level task may close its checkpoint at Apply. The
reverse — a lesson implying the *examination* tests above the task's declared
level — remains forbidden.

### 3.11 Item generation held under stress

The cue guard dropped roughly 25 secure items and 20 practice items for
key-length dominance or the absolute-word tell, plus normalizing option lengths
on a dozen more. Independent measurement of what survived:

- **Answer position:** 29.2 / 20.5 / 26.5 / 23.7, chi² = **3.6** against a
  threshold of 11.34
- **Length cue:** strict-longest 36.5%, mean margin 6.1 chars (5.3% of option),
  **guard escapes 0% (0/219)**

An **Anthropic 520** hit task 2.4's es-419 translation mid-run during practice
generation. It dropped the whole logical item cleanly — `incomplete_groups: 0`,
no two-language orphan. Re-running topped it up.

Both generators converged by re-running: secure took 4 passes, practice 4.

---

## 4. Open items

### Queued, not blocking

1. **`AIE-I_JTA_v2.0.md` validity** states 2 years; platform issues 365 days.
   Fix, and sweep that file for other stale claims — it has now produced two.
2. **`CERT-SCHEMA-GUIDE.md` §2 and §7** are behind the schema. Consider
   generating §2 from `information_schema`.
3. **`CERT_ID` default guards** on the four scripts in §3.7 — exit if unset.
4. **`AISM-I_JTA_v1.md`** is stranded at the `supabase/` root at v1; every other
   cert's JTA lives in `jta/` at v2.0.
5. **Bloom-5 verb audit** across the other six certs (§3.1) — an item-bank check,
   not a migration.
6. **04-03 checkpoint q2** has five options where every other item has four.
   Cosmetic; checkpoints never enter the item bank.

### AIHR-I specific

- **Domain 2 re-verification** due 26 October 2026, or immediately on: a
  Brazilian Chamber vote on PL 2338 (**may fire within days**), Colombian PL 043
  movement, or Mexican implementing regulation.
- **Pricing** is CertiGlobal's and is not scoped by Certidemy.
- **§8.2 impartiality scan** on tasks 3.5–3.8 should be added to the standard
  verification pass so cert #8 inherits it. It returned zero this session, run
  manually.

### Catalog

- Free UUID slots: **`8888`, `9999`**.
- **CAIP-I** remains the unbuilt Level II slot in the AI Essentials ladder.

---

## 5. Where things stand

Seven certifications. AIHR-I is the seventh and the first built start to finish
in a single session — JTA authored, reviewed, locked, scaffolded, translated,
28 lessons written and reviewed by module, loaded, wired, both item banks
generated, lesson content localized into two languages, and every invariant
green.

The thing that made it work was refusing to skip the gates: verify before
translate, review before style guide, style guide before the remaining modules,
coverage proven before item generation. Every failure this session was caught by
a check that existed for that purpose — the schema column, the statement verb,
the stray lessons, the missing module, the translation 520. None of them reached
the database.

*End of handoff v3.5. Migration tip 148.*
