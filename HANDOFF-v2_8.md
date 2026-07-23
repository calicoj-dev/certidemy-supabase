# HANDOFF v2.8

**Session date:** 2026-07-22
**Supersedes:** HANDOFF-v2.7
**Migration tip:** 122 applied · **123 written but NOT YET RUN** · next free number is 124

---

## 1. What this session did

Three things, in this order. The second produced the third.

1. **Closed the `family` → `program` public route rename** (beta blocker).
2. **Ran Grok translation reviews for three certs** (AIE-I, AIGRM-I, AISM-I approved; SM-AI-I reviewed, fixes not yet applied).
3. **Found and remediated a 1,026-row item-bank contamination** in AISM-I, plus the structural hole that made part of it reachable. This was surfaced by Juan pushing back on a reassurance rather than accepting it.

---

## 2. Commits

### `certidemy-web`

| commit | what |
|---|---|
| `49f938e` | `refactor(routing)`: `certifications/family/[slug]` → `program/[slug]`, 308 redirect stub left at old path, 3 internal links repointed. Build green. |
| *(AIE-I)* | `content(i18n)`: AIE-I JTA translations approved |
| `4c444ea` | `content(i18n)`: AIGRM-I JTA translations approved |
| `b5281db` | `content(i18n)`: AISM-I JTA translations approved |

### `supabase`

| commit | what |
|---|---|
| `e35d2be` | `fix(exam)`: simulator top-off must not serve items with no task link. **Deployed** to `pctynukndxnmnxiqpgck`. |

**⚠ VERIFY:** migration `122_fix_aism_i_task_statements.sql` was **run in the editor and verified**, but it is not confirmed committed to the `supabase` repo. Check `git log` and commit it if missing — the file exists in outputs.

---

## 3. Translation progress — corrected totals

**The "~392 provisional translations" figure in v2.5–v2.7 is wrong.** Actual total from live row counts is **606**.

| cert | rows | status |
|---|---|---|
| AIE-I | 42 | ✅ approved |
| AIGRM-I | 112 | ✅ approved |
| AISM-I | 134 | ✅ approved |
| SM-AI-I | 116 | reviewed by Grok, **fixes not applied** |
| SPO-AI-I | 102 | not started |
| SD-AI-I | 100 | not started |
| **total** | **606** | **288 approved (48%)** |

A "row" is one language's version of one item. Domain rows carry both a title and a description, so the string count is higher.

### The approval mechanism (important)

`node scripts/load-jta-i18n.mjs --cert <CODE> --approve` **re-upserts the current file contents** with `is_provisional = false`. So approving-with-fixes is a **single step**: edit the pack in `certidemy-web/scripts/load-jta-i18n.mjs`, then run `--approve`. Clean sign-off is the same command with no edit. `--dry` first, always.

The pack is **ASCII-only with `\uXXXX` escapes**. That is a deliberate safety property — it cannot corrupt in transit. Verify after every edit:

```powershell
Select-String -LiteralPath $p -Pattern '[^\x00-\x7F]'   # expect no output
```

---

## 4. Locked terminology principles

Nine rules now settled. These are the real asset of the session — remaining certs get reviewed against a rulebook instead of re-litigating.

### From the AIGRM-I review (Grok)

1. **Official EU AI Act Spanish governs statutory terms**, even where more formal than everyday LATAM usage (`vigilancia humana`, `vigilancia poscomercialización`). Portuguese follows natural Brazilian usage unless official EU PT differs materially.
2. **Vocabulary-recall tasks carry English acronyms in parentheses on first use** — but only where the target language has no established acronym of its own. ML, LLM, GPAI, AIMS qualify. **AI does not** (ES/PT say IA).
3. **Framework function names**: translate, with English glossed on first use in the *defining* task only; translated forms alone thereafter.
4. **`confiable` beats `fiable`** for es-419 register, despite `fiable` being the official EU Spanish. Regional fit wins here.

### From the AISM-I review (Grok)

5. **Provider vs supplier must not collide.** Service provider = `proveedor` / `fornecedor`. External supplier = a *distinct* term (`suministradores` / `fornecedores externos`).
6. **`pipeline` stays English in Spanish** (Portuguese already did).
7. **Field-standard concepts are NOT glossed.** Principle #3 applies *only* to named public frameworks with source documents (NIST, ISO, EU AI Act articles). It does **not** apply to e.g. the seven guiding principles — glossing those would pull toward branded framing and work against the scheme's honesty position.
8. **Outputs vs outcomes**: `salida` / `saída` = outputs, `resultado` = outcomes. Strict. In AISM-I this is load-bearing (task 1.6 tests it directly) and must never move.

### From the SM-AI-I review (Grok)

9. **Domain titles use sentence case in es-419 and pt-BR**, not Title Case. Platform-wide; AIGRM-I and AISM-I already comply.

### Grok's verbatim cross-cert rule — put this in the scheme docs as-is

> "When the same English term appears in both a regulated-AI cert (AIGRM-I) and a non-regulated service-management cert (AISM-I), the regulated-AI cert follows the official EU AI Act statutory rendering, while the service-management cert uses the natural operational/service-management register."

This is why **AIGRM-I says `vigilancia humana` while AISM-I and AIE-I say `supervisión humana`**. Deliberate, not drift. An auditor comparing schemes will ask — quote the rule.

### Scrum terminology — verified against the official source

Checked against the official Latin American Spanish Scrum Guide (scrumguides.org):

- **Roles and artifacts stay in English** — Scrum Master, Product Owner, Developers, Scrum Team, Sprint, Product Backlog, Sprint Backlog, Increment, Definition of Done, Product Goal, Sprint Goal, Daily Scrum, timebox. The official Spanish guide keeps all of these in English. **Certidemy's policy matches the authoritative translated source** — that is a stronger justification than internal consistency and should be stated that way in the scheme docs.
- **The document's own title IS translated: `La Guía de Scrum`.**
- **`liderazgo de servicio`** is the scrum.org Spanish rendering of servant leadership.
- **pt-BR conventions not yet verified** — do this before SPO-AI-I / SD-AI-I.

---

## 5. Corrections to previously stated facts

Recorded because each was asserted rather than checked, and one is committed.

### 5.1 Migration 122's header comment is false

It states: *"AISM-I's secure item bank has not been generated yet, so no quiz_questions rows are stamped against these statements."*

**Wrong.** AISM-I holds 2,370 practice and 1,950 secure items, including items against tasks 1.4 and 1.5 — the two rows 122 edited. The edits themselves stand (removing a leaked authoring note; `result` → `output` are cosmetic/terminological, not competence-changing, so no regeneration is implied). Only the justification was wrong. **Migration 123's header carries the correction.**

### 5.2 SM-AI-I P5 was backwards — DO NOT APPLY

I proposed keeping `Scrum Guide` in English in task 5.7; Grok approved it. **The official Spanish calls it `La Guía de Scrum`** — the original draft was right and the "fix" would introduce an error.

### 5.3 SM-AI-I P10 — use `liderazgo de servicio`

Draft said `liderazgo al servicio`; I proposed `liderazgo servidor`; Grok approved mine. **Both wrong** — scrum.org Spanish uses `liderazgo de servicio`.

### 5.4 The SM-AI-I "staleness" diagnosis was right but for the wrong reason

I first said the translations were stale because the English was revised after translation. Closer: **the translator worked faithfully from `SM-AI-I_JTA_v2_0.md`, and the markdown is what is stale.** Migration `091_sm_ai_i_jta_v2_cognitive_fix.sql` revised the DB English; the markdown was never updated.

**091 precedes 099** (the bank purge + full regeneration), so the banks were built from the *corrected* statements. Confirmed empirically: **0 Bloom drift, 0 out-of-scope items** across all 16,158 items.

---

## 6. The AISM-I contamination incident

### What was found

**1,026 quiz_questions rows carrying `certification_id` = AISM-I with `task_id IS NULL`.**

| pool | en | es-419 | pt-BR | total |
|---|---|---|---|---|
| practice | 180 | 180 | 180 | 540 |
| secure | 162 | 162 | 162 | 486 |

All created **2026-07-14**, a single generation event. **AISM-I was the only affected cert** (all others: 0 orphans).

Content was unambiguously AIE-I — verbatim samples included *"A 1990s chess engine beat grandmasters…"*, *"la diferencia clave entre un prompt y una consulta de búsqueda"* (AIE-I task 2.1 verbatim), and *"You are a market analyst. Compare prices for the five suppliers"* (AIE-I 2.2 prompt-structure example). Nothing about service management.

This is the **same contamination class already remediated for AISM-I lesson rows** (stale AIE-I lessons on AISM-I module IDs). That earlier cleanup did not cover `quiz_questions`.

### Reachability — determined by reading `generate-mock-exam/index.ts`

| pool | reachable? | why |
|---|---|---|
| secure (486) | **No** | allocation runs task → domain; step 6 does `if (!q.domain_id) continue;`. No task ⇒ no domain ⇒ never allocated. Certification integrity was never at risk. |
| practice (540) | **Yes, conditionally** | step 9's simulator top-off did `candidates.filter((q) => !chosen.has(q.id))` — unfiltered. Only fires when a domain quota can't be filled. AISM-I is `draft`, so realistically never hit. |

### Remediation

- **Migration 123** (`123_purge_aism_i_orphaned_items.sql`) — **WRITTEN, VERIFIED, NOT YET RUN.** Deletes exactly the 1,026, guarded three ways (AISM-I + `task_id is null` + `created_at < 2026-07-15`). Idempotent. The file itself is the audit record.
- **`e35d2be`** — added `&& q.domain_id !== null` to the step-9 filler. **Deployed.** Closes the structural hole so a *future* orphan cannot be served.

### AISM-I's real bank is intact underneath

- linked practice 1,830 = 61 tasks × 3 langs × **10/task/lang**
- linked secure 1,464 = 61 tasks × 3 langs × **8/task/lang**

Those ratios match AIE-I's live bank exactly — what a correct generation run produces.

### Bank inventory (all `bank_revision = v2-jta`)

| cert | practice | secure |
|---|---|---|
| AIE-I | 540 | 432 |
| AIGRM-I | 1,530 | 1,377 |
| AISM-I | 2,370 → **1,830** after 123 | 1,950 → **1,464** after 123 |
| SD-AI-I | 1,350 | 1,080 |
| SM-AI-I | 1,560 | 1,404 |
| SPO-AI-I | 1,380 | 1,185 |

---

## 7. Deferred queue

Ordered by what unblocks what.

| # | item | scope / owner |
|---|---|---|
| 1 | **Run migration 123** | ready to paste; run BEFORE/AFTER blocks are in the file |
| 2 | **Apply SM-AI-I translation fixes** | Grok approved; **drop P5**, **P10 → `liderazgo de servicio`**. Then `--approve` |
| 3 | **SPO-AI-I + SD-AI-I reviews** | **diff against live DB before building review docs** — the JTA markdowns are the stale source |
| 4 | **AIGRM-I 3.10 / 5.8 Bloom mismatch** | Analyze verb stamped `2_understand`. Migration + recompute `v_cognitive_profile` + reset `exam_blueprint` + **regenerate items for those 2 tasks**. DB chat. |
| 5 | AIGRM-I 3.7 vs 3.9 `Recognize` inconsistency | lower confidence; fold into #4's pass |
| 6 | **Add orphan invariant to `verify-cert.mjs`** | `task_id is not null` for every non-retired item. Would have caught this contamination. |
| 7 | **Reconcile stale JTA markdowns** | `SM-AI-I_JTA_v2_0.md` contradicts the DB and is what the translator read. Other certs likely the same. |
| 8 | SM-AI-I 5.4 uses "servant leadership" | 2017 terminology, in a cert that teaches legacy-vs-2020 drift (task 5.7) and has a `servant-vs-true-leader` concept. Small self-contradiction. |
| 9 | SM-AI-I has **no task 4.12** | codes run 4.11, 4.13, 4.14. Harmless to the exam; an auditor reading the blueprint will ask. |
| 10 | Verify pt-BR Scrum Guide conventions | before #3 |

Everything from v2.7's queue that was not touched this session still stands (mastery→score recalibration, claims/terminology policy into the six `SCHEME-*.md` files, lint cleanup).

---

## 8. Process notes worth keeping

### The failure mode that keeps recurring

**Row counts without content verification are a false-clean signal.** Already recorded for lessons; it just bit the item bank. Every count-based check passed while 1,026 rows of the wrong cert's content sat in the table. Item #6 above exists because of this.

### Reusable: the per-cert translation dump

One query template, swap the cert code. Returns `domain_code, kind, item_code, bloom, exam_scope, en, es_419, pt_br, es_prov, pt_prov` ordered domain → kind → task. Download CSV from the Supabase editor (clean UTF-8; avoids console mojibake in transit). Row count = domains×2 + tasks.

### Reusable: the guarded PowerShell edit

Every pack edit this session used: build an `$edits` array of `old`/`new` pairs → assert **each anchor matches exactly once** → write only if all pass → verify residuals + ASCII. It caught the trap where `"1.7"` matched three certs and `supervisión humana` matched four.

**Anchors must be long enough to be unique across all six cert blocks in the pack.**

### Working with Grok

Linguistic judgment is strong. **Verification is not.** This session he:

- mislabelled a fix as task `1.7` carrying the number from a *different cert* — applying it literally would have destroyed AIGRM-I's governance-instrument task;
- wrote `ao profissional`, using Spanish personal-*a* grammar in a Portuguese slot;
- approved both P5 and P10 without checking the official Scrum Guide, and both were wrong.

**Therefore:** always check item codes against the dump before applying, and verify any *named-document* terminology against the source **before** proposing it. Ask him for stated rules, not just verdicts — the rules generalize across the remaining certs and the verdicts don't.
