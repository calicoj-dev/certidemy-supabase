# HANDOFF v6.3 — ISMS-IA, content complete

**Session date:** 2026-08-10 (continues v6.2, same day)
**Reads with:** `HANDOFF-v6_2.md` for the scaffold, and v6.1 §0 for the working
protocol, which is unchanged.
**Migration tip:** **192** · next free **193** (no new migrations this session)
**Commits (supabase):** `ff1630d` · `06c2ef8`
**Commits (web):** `00d1997` · `76695f5` · `f8a2cda` · `4f4c566` · `385352b`

**All 38 lessons authored, reviewed, loaded and wired.** `verify-cert` reports
**20 pass / 4 fail / 1 warn**, and every remaining failure needs item banks that
do not exist yet. **No unverified claim remains anywhere in the credential.**

---

## 0. STATE

| | |
|---|---|
| Cert | `ISMS-IA` · `7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417` · tier 2 · status `draft` |
| Spine | 5 domains · 5 modules · **38 tasks** · **169 concepts** · **169 links** |
| Content | **38 lessons loaded**, ~490 min · 169 `lesson_concepts` · 38 `lesson_tasks` |
| Coverage | **169/169 taught · untaught_testing_violations = 0** |
| Profile | remember 0 · understand 5.00 · apply 29.40 · analyze **65.60** |
| Exam | 50 items · 75% · 90 min · blueprint 6/10/12/13/9 |
| verify-cert | **20 pass · 4 fail · 1 warn** |

**The four failures**, all item-bank dependent:
`All testable concepts tested` (0/169) · `secure floor ≥8/task/lang` (114 below) ·
`practice floor ≥10/task/lang` (114 below) · `Pool can fill a form` (15 shortfalls).

**The warn** is localization: 38 lesson groups at one language each. Correct state
before translation.

### Modules

| # | Slug | Lessons | Review |
|---|---|---|---|
| 1 | `ia-audit-function` | 5 | 9.0 |
| 2 | `ia-audit-programme` | 7 | 9.1 |
| 3 | `ia-conducting-the-audit` | 9 | 9.3 |
| 4 | `ia-auditing-the-isms` | 10 | 9.2 |
| 5 | `ia-findings-and-follow-up` | 7 | 9.0 (independent reviewer) |

Content at `certidemy-web/content/isms-ia/NN-<slug>/`.

---

## 1. THE ⛔ IS CLOSED — AMENDMENT 1:2024 READ DIRECTLY

`ISO_IEC_27001_2022_Amd_1_2024en.pdf`, read 2026-08-10. **Its entire normative
body is two sentences:**

> **4.1** Add the following sentence at the end of the subclause:
> *The organization shall determine whether climate change is a relevant issue.*
>
> **4.2** Add the following note at the end of the subclause:
> *NOTE 2 &nbsp; Relevant interested parties can have requirements related to climate change.*

Published February 2024, ISO/IEC JTC 1/SC 27, under TMB Resolution 75/2023.
**Priced at one page.**

**The inference from ISO/IEC 42001 was correct word for word.** One detail was
wrong: it is **NOTE 2**, not an unnumbered note — the existing note on legal,
regulatory and contractual requirements becomes NOTE 1.

**Erratum 2** applied to `ISMS-IA_JTA_v2.0` and `ISMS-IA_CONCEPTS_v2.0`; the two
live concept rows were updated in the same pass. **Zero `PENDING VERIFICATION`
rows remain, and no ⛔ markers survive in any artefact.**

### The teaching point, which is the lesson's value

**`shall determine whether` is a determination requirement, not a treatment
requirement.** Two conformant outcomes exist: determined relevant, which then
flows into 4.3 and 6.1 like any 4.1 issue; or **determined not relevant, which is
full compliance**. An auditor expecting climate risks in the register, or a
sustainability programme, has invented a requirement — the same failure the
credential dismantles for the risk register and the major/minor scheme.

Lesson `04-07-two-sentences.md` teaches this and the independent reviewer called
it the cleanest treatment of Amd 1:2024 they had seen in commercial material.

---

## 2. THE CONTENT — WHAT IT ACTUALLY TEACHES

Five things a future session should not undo, because each was hard-won.

### 2.1 Degree of verification, not a threshold (03-01)

ISO 19011:2026 clause 6.4.7: *only information subject to **some degree of
verification** should be accepted as audit evidence, and where the degree is low
the auditor should use professional judgement to determine the **degree of
reliance**.*

**This is the module 3 spine and four later lessons lean on it.** A screen share
(03-03), an uncorroborated interview statement (03-05), a compliance log versus
system trace (03-06) and an AI summary (03-08) are the *same judgement* applied to
different material. Reverting 3.1 to a binary verifiability test breaks all four.

### 2.2 The SoA is a claim, and it is what you test (03-06, 04-04)

Clause 6.1.3 d) requires the SoA to record **whether each necessary control is
implemented or not**. That entry is a written claim, control by control.

**You are not auditing the control you would have designed.** You are auditing the
claim the organization made. Design and operating effectiveness are separate
questions needing different evidence, and the strongest evidence of operation is
what the control leaves behind **by running** rather than a record created to
demonstrate compliance.

### 2.3 The signature task, grounded in text (03-08)

ISO 19011:2026 clause **7.2.3 item 10** names **artificial-intelligence-based
evaluation tools** in auditor competence. The lesson teaches three things:

- **An AI summary is a lead with low verification; the source record is evidence.**
- **Tool-driven selection is a sampling decision**, and its blind spot has a
  **shape** — template matching finds absence not weakness, anomaly detection finds
  the unusual not the routine problem, keyword search finds the term not the
  paraphrase. *The shape of the miss determines what a clean result means.*
- **Accountability does not transfer.**

The scenario deliberately shows the tool doing real work — 400 contracts reviewed,
14 real gaps found, then 2 more found by sampling what the tool cleared. **If this
lesson reads as anti-AI, it has failed.**

### 2.4 Annex A 8.34 binds the auditor (03-07)

*Audit tests and other assurance activities involving assessment of operational
systems shall be planned and agreed between the tester and appropriate
management.* **You are the tester.** An organization that has included 8.34 and
whose audit activity routinely bypasses that agreement has a finding an internal
auditor is unusually well placed to see.

### 2.5 The chain, and where it breaks (05-07)

One finding, seven steps, six clauses: reported to relevant management (9.2.2 c) →
corrected (10.2 a) → cause evaluated including elsewhere (10.2 b) → effectiveness
reviewed (10.2 d) → reached management review as a **trend** (9.3.2 d) 3) →
produced a **decision** (9.3.3) → changed the programme (9.2.2).

**It usually breaks at 3, 4 or 7.** A chain that breaks at step 7 means the
organization has been auditing for years and improving by accident.

---

## 3. PROCESS — WHAT THE BUILD PROVED

### 3.1 The validator earned its place three times

A Python check run before every module presentation — parses every checkpoint and
widget JSON, asserts 4 questions, verifies every `correct` id exists, drag-match
1:1, scenario-mcq terminal step, 5 summary bullets.

**It caught a missing `]` closing an options array three separate times** (02-07,
03-01, and one during authoring). Each would have broken the lesson at load with
an error pointing at the wrong place.

> **Run it before any review, human or otherwise. Neither reviewer can parse JSON,
> and a broken widget is invisible in prose.**

### 3.2 Read a rendered lesson before using a widget

Module 1's `scenario-mcq` was written from the schema doc and invented a terminal
step that looped to itself. Reading
`content/isms-f/03-risk-assessment-and-treatment/03-11-the-clean-result.md` showed
the real pattern in a minute:

- **The terminal step omits `next` entirely.**
- **Wrong choices route to a correction step** that explains the error and
  re-offers the remaining options. The widget teaches on the wrong path, which is
  most of its value.

`content/smpc/_test/_test-all-widgets.md` covers all six primitives. **The schema
doc is not the authority on convention.**

### 3.3 The concept-coverage check neither reviewer can do

Mechanical comparison of each lesson's `concept_slugs` against the locked register,
plus a check that every declared concept is actually assessed somewhere in the body.

**It found `ia-audit-report-content-6-5-1` declared in 05-04 and tagged on no
checkpoint question.** Every other concept in the module was assessed. Seconds to
run, and it is now a style guide checklist item.

### 3.4 Two reviewers, two jobs

The project-context reviewer checks module coherence, forward-reference debts,
style-guide compliance and Bloom alignment — it has the JTA and the prior modules.

**A cold expert reviewer checks whether the material stands up to a competent
stranger**, which is closer to how a candidate or an assessor meets it. Module 5
went to a cold reader and independently confirmed the load-bearing attributions —
no major/minor in 27001, 17021-1 as the source, 10.2 b) 3) as the systemic hook.
**That corroboration is worth more than the project reviewer's**, which has been
told those things across four modules.

Its one false positive shows the limit: it flagged `status: draft` as unfinished,
not knowing it is the authoring spec's own lifecycle field.

### 3.5 `-LiteralPath` disables wildcards

`Remove-Item -LiteralPath "...\Downloads\*.md"` matched nothing on every attempt,
silently, because `-ErrorAction SilentlyContinue` swallowed the error. Correct
form is `-Path`.

**And the deeper lesson: name the exact files.** A blanket `*.md` delete in a
shared folder destroyed files that had already been downloaded. Naming the files
is the same amount of typing and cannot destroy anything Claude did not create.

### 3.6 Anchors from bytes, not from renderings

Patch scripts failed repeatedly on anchors built from how text *looked*:

- **Em-dash where a hyphen was typed** — three separate times.
- **Lowercase after `· S —`** where the fragment had been capitalised.
- **v1.0 text used as a v2.0 anchor**, because the two versions were conflated.

Every failure was loud and wrote nothing. **The guard was wrong, not the thing it
guarded**, which continues to be the pattern.

---

## 4. LOADING — THE FLAG TRAPS, CONFIRMED

`load-lessons-direct.mjs` needs **`--in <content-dir>`**, which no prior handoff
recorded. The path is the **cert root**, not a module folder; the loader walks the
whole tree.

```powershell
$env:CERT_ID = "7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417"
node scripts\load-lessons-direct.mjs --in C:\Users\Juan\Documents\certidemy\certidemy-web\content\isms-ia --lang en --dry
node scripts\load-lessons-direct.mjs --in C:\Users\Juan\Documents\certidemy\certidemy-web\content\isms-ia --lang en
```

**`--dry` is safe as a bare trailing flag.** Its `arg()` helper returns the next
argv element if present, and `true` if the flag exists with nothing after it — the
`if (i >= 0) return true;` line. A concern raised on a partial read of that
function was wrong; the full read settled it. **Still `--dry`, never `--dry-run`
— unknown flags are ignored and it would run live.**

`wire-lessons.mjs` takes env vars only:

```powershell
$env:CERT_ID = "..."; $env:DRY_RUN = "1"; node scripts\wire-lessons.mjs
$env:DRY_RUN = "0"; node scripts\wire-lessons.mjs
```

**`lessons` has no `certification_id`.** It joins through `module_id` → `modules`.

Results: **38 inserted, 0 skipped, 0 missing-module. 169 concept links, 38 task
links, zero UNRESOLVED.**

---

## 5. STAGE 9 — THE LEVEL II FORK, AND IT IS A BUILD

**This is the first thing in the whole cert that the existing pipeline cannot do.**

### 5.1 The item contract

Recorded in `certifications.exam_blueprint.item_model` (migration 190) and in
`SCHEME-ISMS-IA.md` §6.

> Four options, **all defensible on the facts given**, one best. Dichotomous
> scoring.
>
> 1. The best answer must be better than the second-best **for a reason a competent
>    auditor could state in one sentence.** Longer and the item is a coin flip.
> 2. The second-best must be **genuinely defensible, not merely wrong.** An item
>    whose second choice is incorrect is a Level I item in the wrong bank.

### 5.2 The cue guard inverts

In L1, an unusually long key is a cue to strip. **In L2 the best option is
frequently best BECAUSE it is better qualified** — *"...provided the sample is
representative of the period under audit"*. A length-homogeneity guard tuned for
L1 would systematically reject correct items and keep flat ones.

`item_model.cue_guard` records the intended fix: test comparable **qualification
density** across options rather than comparable length. **Not built, not validated
against real items.**

### 5.3 What must not happen

> **Do NOT run `item-pipeline.mjs` or `gen-cert-secure.mjs` against ISMS-IA
> tasks.** They implement the L1 contract — one correct answer among three wrong
> on the merits. Pointing them at a Level II JTA produces items that pass every
> structural invariant and assess the wrong thing.

### 5.4 Floors

**≥8 secure and ≥10 practice per task per language**, across en / es-419 / pt-BR.
38 tasks → **912 secure and 1,140 practice** minimum.

### 5.5 Attribution rule still binds

The generator asserts requirements from model knowledge unless constrained.
`ISMS-IA_JTA_v2.0` §3 is the attribution map, and three claims must never appear:
the own-work rule (in neither standard), the risk register (nowhere), major/minor
severity (ISO/IEC 17021-1 practice).

Lesson content also contains the corrections explicitly, so an item contradicting
them contradicts the teaching layer — which the coverage link makes visible.

---

## 6. OWED — ACCUMULATED, NONE BLOCKING ISMS-IA

### Catalogue-wide

1. **Create-verb sweep against the other nine certs.** Never run. ISMS-IA had
   seven defective `skills` fields in 38 tasks; those certs already have generated
   banks.
   ```sql
   select code, statement, skills from public.tasks
   where certification_id = '<uuid>'
     and (statement ~* '^(construct|design|compose|write|create|develop|formulate)'
       or skills     ~* '\m(rewrite|write|design|compose|create|draft|record an)\M');
   ```
2. **Two proposed `verify-cert` invariants**, each one query, each would have
   caught a real defect: (a) create-level verbs in `skills`/`abilities`, which
   `verify-cert` does not read; (b) every cert holds a published `jta_versions`
   row, which it does not check.
3. **`CERT-PUBLISH-CHECKLIST`** still has no `jta_versions` step. Owed since v5.5
   §9.5, and ten certs have each discovered it separately.
4. **`ISMS-F` task 2.3** reads *"the environmental-conditions consideration
   introduced by Amendment 1:2024"*. **The amendment says climate change.** Live
   cert, wrong term, two-sentence amendment.
5. **`ISMS-F` lesson 3.6** — the Annex A completeness claim rests on **NOTE 2 and
   NOTE 3** to 6.1.3, not NOTE 1 and NOTE 3. Check whether the misnumbering reached
   the published lesson.

### ISMS-IA, before publish

6. **Item banks** — §5. The largest remaining piece.
7. **Translations** — 38 lessons × es-419 + pt-BR. `translate-lessons.mjs`
   validates output against the English source and refuses to write on mismatch.
8. **`price_usd` is 0.**
9. **`ISMS-IA_BoK_v1.md`** — §3 Layer 1 still lists five ISO 19011 changes; ISO's
   foreword names **two**, both remote auditing. Add ISO/IEC TS 17012:2024 to the
   source stack. The own-work row is superseded by JTA §3.
10. **ISO/IEC 27007 DIS** and **ISO/IEC 27090** (FDIS ballot closed 2026-08-18) —
    named re-verification triggers in `SCHEME-ISMS-IA.md` §11.
11. `ksa_is_provisional` still has no approval path.

---

## 7. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v6_3.md`, then v6.2 for the scaffold and
> v6.1 §0 for the working protocol, which is unchanged.
>
> **ISMS-IA content is complete.** 38 lessons authored, reviewed, loaded and
> wired. Coverage 169/169 taught, 0 untaught-testing violations.
> `verify-cert --cert ISMS-IA` reports **20 pass / 4 fail / 1 warn** and every
> failure needs item banks. Migration tip **192**, next free **193**.
> **Do not re-author, re-load or re-scaffold anything.**
>
> **Stage 9 is next and it is a build, not a run.** §5 has the Level II item
> contract, the cue-guard inversion, and the instruction that the existing L1
> generators must not be pointed at these tasks.
>
> **The scheme of record is `ISMS-IA_JTA_v2.0` with errata 1 and 2 applied.** The
> database is correct; a document that disagrees is the defect.
>
> **No unverified claim remains in this credential.** Three standards and one
> amendment were read directly. §6 lists what is owed elsewhere, including a
> create-verb sweep never run against the other nine certs and a wrong term in a
> live cert.
>
> **The habits that carried this build:** run the JSON validator before any
> review; read a rendered lesson before using a widget; build patch anchors from
> bytes rather than renderings; name exact filenames in delete commands; and read
> the receiving document before believing a correction.

*End of HANDOFF v6.3.*
