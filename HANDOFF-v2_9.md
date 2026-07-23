# HANDOFF v2.9

**Session date:** 2026-07-22/23
**Supersedes:** HANDOFF-v2.8
**Migration tip:** 125 applied · next free number is **126**

---

## 1. Headline: the JTA translation wave is complete — 606/606

All six certs are approved. Every `task_translations` and `domain_translations`
row across the platform is `is_provisional = false`, verified per cert at the
point of approval and again in aggregate at the end.

| cert | task rows | domain rows | total |
|---|---|---|---|
| AIE-I | 36 | 6 | 42 |
| AIGRM-I | 102 | 10 | 112 |
| AISM-I | 122 | 12 | 134 |
| SD-AI-I | 90 | 10 | 100 |
| SM-AI-I | 106 | 10 | 116 |
| SPO-AI-I | 92 | 10 | 102 |
| **total** | **548** | **58** | **606** |

Mojibake sweep across all translated rows: **0**.

This closes the standing top item from v2.7's queue.

---

## 2. Commits this session

### `supabase`

| commit | what |
|---|---|
| `e35d2be` | `fix(exam)`: simulator top-off must not serve items with no task link. **Deployed.** |
| `4e02e3f` | migrations 122 + 123, handoffs v2.7 + v2.8 |
| `d3848da` | migration 124 — approve SM-AI-I JTA translations |
| `0a1b6a5` | migration 125 — approve SPO-AI-I JTA translations |

### `certidemy-web`

| commit | what |
|---|---|
| `49f938e` | `refactor(routing)`: `certifications/family/[slug]` → `program/[slug]`, 308 redirect at old path |
| *(AIE-I)* | AIE-I JTA translations approved |
| `4c444ea` | AIGRM-I JTA translations approved |
| `b5281db` | AISM-I JTA translations approved |
| `54a9d10` | SM-AI-I JTA translations corrected and approved |
| `97cfdc0` | SPO-AI-I JTA translations corrected and approved |
| `b302a58` | SD-AI-I JTA translations approved — wave complete |

Both repos pushed.

---

## 3. The architectural discovery that shaped the second half

`certidemy-web/scripts/load-jta-i18n.mjs` is **not** a complete record of the
platform's JTA translations. Two certs carried "stragglers only" stub blocks; the
bulk of their rows were written straight to the database by
`supabase/scripts/gen-jta-translations.mjs` with no disk representation.

Block completeness, measured before the work:

| cert | pack block | DB | type |
|---|---|---|---|
| AIE-I | 18 tasks / 3 domains | 18 / 3 | **full** |
| AIGRM-I | 51 / 5 | 51 / 5 | **full** |
| SD-AI-I | 45 / 5 | 45 / 5 | **full** |
| AISM-I | 61 / 6 | 61 / 6 | **full** |
| SM-AI-I | 2 / 0 | 53 / 5 | **stub** |
| SPO-AI-I | 2 / 0 | 46 / 5 | **stub** |

**This predicts staleness exactly.** The full blocks were generated *after*
migrations `090`–`095` (the JTA v2 Bloom-alignment fixes); the stubs were
leftovers from a pass that predated them.

| cert | block | stale statements found |
|---|---|---|
| SM-AI-I | stub | **5** (1.2, 3.6, 3.9, 5.7, 5.9) |
| SPO-AI-I | stub | **1** (3.2) |
| AIE-I, AIGRM-I, AISM-I, SD-AI-I | full | **0** |

### How the two shapes are handled

- **Full block** — correct the pack, run `--approve`. One step, no migration.
- **Stub block** — expand the pack with the corrections, run `--approve`, then a
  migration to clear the flag on the rows the pack does not carry.
  (124 for SM-AI-I, 125 for SPO-AI-I.)

### ⚠ Ordering rule for stub certs — this nearly caused a silent failure

**The pack `--approve` MUST run before the flag migration.** Migration 125 was
run first for SPO-AI-I, which marked *uncorrected* text as reviewed — the stale
3.2 and three `Desenvolvedores` violations were briefly flagged approved. Nothing
errored; row counts looked right; the cert read as done.

It was caught only by spot-checking actual strings. **Verification for a stub
cert must read content, not count rows.**

---

## 4. Locked terminology principles — the complete set

Fifteen rules now settled. This is the durable asset of the wave; put them in the
six `SCHEME-*.md` files.

### From the AIGRM-I review

1. **Official EU AI Act Spanish governs statutory terms**, even where more formal
   than everyday LATAM usage (`vigilancia humana`, `vigilancia
   poscomercialización`). Portuguese follows natural Brazilian usage unless the
   official EU PT differs materially.
2. **Vocabulary-recall tasks carry English acronyms in parentheses on first use**
   — but only where the target language has no established acronym of its own.
   ML, LLM, GPAI, AIMS qualify. **AI does not** (ES/PT say IA).
3. **Named public framework function names**: translate, with English glossed on
   first use in the *defining* task only.
4. **`confiable` beats `fiable`** for es-419 register.

### From the AISM-I review

5. **Provider vs supplier must not collide.** Service provider = `proveedor` /
   `fornecedor`; external supplier = a distinct term.
6. **`pipeline` stays English in Spanish.**
7. **Field-standard concepts are NOT glossed.** Rule #3 applies *only* to named
   public frameworks with source documents (NIST, ISO, EU AI Act articles).
8. **Outputs vs outcomes**: `salida` / `saída` = outputs, `resultado` = outcomes.
   Load-bearing in AISM-I (task 1.6 tests it); never move it.

### From the SM-AI-I / SPO-AI-I / SD-AI-I reviews

9. **Domain titles use sentence case** in es-419 and pt-BR, not Title Case.
10. **`Spec-Driven Development` stays English** in both languages, glossed once
    on first use.
11. **`Increment` stays English platform-wide**, overriding the official pt-BR
    guide (which says `Incremento`) for cross-cert consistency.
12. **PBI uses the expanded form** — `elementos del Product Backlog` / `itens do
    Product Backlog`.

### Verified against primary sources (not reviewer opinion)

13. **Scrum roles and artifacts stay English in both languages** — Scrum Master,
    Product Owner, Developers, Scrum Team, Sprint, Product Backlog, Sprint
    Backlog, Increment, Definition of Done, Sprint Goal, Product Goal, Daily
    Scrum, timebox. **Because the official translated Scrum Guides do exactly
    this** — confirmed in both the LATAM Spanish and Brazilian Portuguese
    editions. That is a stronger justification than internal consistency and
    should be stated that way in the scheme docs.
14. **The Scrum Guide's own title:** Spanish translates it (`la Guía de Scrum`),
    Portuguese keeps it English (`o Scrum Guide`). ⚠ **Asymmetric, and only half
    verified** — the Spanish title is confirmed from the official document; the
    Portuguese choice was made for consistency with already-shipped SM-AI-I, not
    from the source. **See deferred item 9.**
15. **`liderazgo de servicio`** is the scrum.org Spanish rendering of servant
    leadership — not `liderazgo servidor`, not `liderazgo al servicio`.

### Grok's verbatim cross-cert rule — quote this directly in scheme docs

> "When the same English term appears in both a regulated-AI cert (AIGRM-I) and a
> non-regulated service-management cert (AISM-I), the regulated-AI cert follows
> the official EU AI Act statutory rendering, while the service-management cert
> uses the natural operational/service-management register."

This is why **AIGRM-I says `vigilancia humana` while AISM-I and AIE-I say
`supervisión humana`.** Deliberate. An auditor comparing schemes will ask.

---

## 5. Working with the external reviewer — observed reliability

**Linguistic judgment: strong.** Register, regional fit, and naturalness calls
were consistently good, and the four generalized principles he produced after
AIGRM-I saved several rounds of re-litigation.

**Bookkeeping and source verification: unreliable.** Across six rounds:

| round | failure |
|---|---|
| AIE-I | proposed glossing `inteligencia artificial (AI)` — the ES/PT acronym is **IA**, used three times in the same sentence |
| AIGRM-I | labelled a fix **task 1.7**, carrying the number from AIE-I; in AIGRM-I 1.7 is a governance-instrument task. Applying it literally would have destroyed it |
| AIGRM-I | wrote `ao profissional` — Spanish personal-*a* grammar in a Portuguese slot |
| SM-AI-I | approved **P5** (keep `Scrum Guide` English in Spanish) and **P10** (`liderazgo servidor`) without checking the source. Both wrong |
| SPO-AI-I | labelled the 3.6 fix as **task 1.5** |
| SD-AI-I | **answered the previous cert's questions** — ruled on roadmap, Increment, feature-waiter and sentence-case titles, none of which appear in SD-AI-I; its titles were already sentence case |

**Standing practice for any future review cycle:**

- **Check every item code against the dump before applying.** Three mislabels in
  six rounds; one would have destroyed a task.
- **Verify named-document terminology against the source *before* proposing it,**
  not after. He rubber-stamps plausible proposals.
- **Ask for stated rules, not just verdicts.** The rules generalize; the verdicts
  do not.
- His approval is not evidence. Two of the wrong terms were *my* proposals that
  he approved; both were caught by Juan asking a skeptical question.

---

## 6. AISM-I contamination — remediation confirmed complete

Migration **123** ran and verified. The 1,026 AIE-I items misfiled under AISM-I
are gone.

| check | result |
|---|---|
| orphans (`task_id is null`), all six certs | **0** |
| AISM-I practice | 2,370 → **1,830** |
| AISM-I secure | 1,950 → **1,464** |
| per task per language | **10 practice / 8 secure**, 61 tasks, 3 languages |
| secure items linked into `question_concepts` | **0** (firewall intact) |
| bloom drift, all certs | **0** |
| items for `is_exam_scope = false` tasks | **0** |

The structural hole that made the practice orphans reachable is closed
(`e35d2be`, deployed): the step-9 simulator top-off now requires `domain_id`,
matching the secure path.

---

## 7. Deferred queue

| # | item | scope |
|---|---|---|
| 1 | **Bloom/verb cluster** — see §8 | migration + profile recompute + blueprint reset + item regeneration. DB chat. |
| 2 | **Reconcile stale JTA markdowns** | `SM-AI-I_JTA_v2_0.md` contradicts the live DB and is what the translator read. Other certs likely the same. |
| 3 | **Orphan invariant in `verify-cert.mjs`** | `task_id is not null` for every non-retired item. Would have caught the contamination. |
| 4 | **SPO-AI-I `order_index`** | 3.9 has index 9 but 3.1 has 15; 5.12 has 12 but 5.1 has 34. Both late-added tasks sort ahead of their domain's first task on the blueprint. |
| 5 | **Terminology rules into the six `SCHEME-*.md` files** | §4 above, verbatim. Also the claims/terminology policy carried from v2.7. |
| 6 | SM-AI-I 5.4 says "servant leadership" | 2017 terminology, in a cert that teaches legacy-vs-2020 drift (5.7) and has a `servant-vs-true-leader` concept |
| 7 | SM-AI-I has **no task 4.12** | codes run 4.11, 4.13, 4.14 |
| 8 | AIGRM-I 3.7 vs 3.9 `Recognize` inconsistency | `3_apply` vs `2_understand` for the same verb; fold into #1 |
| 9 | **Verify the pt-BR Scrum Guide title** | The one open uncertainty in §4. If the official Brazilian edition titles itself `Guia do Scrum`, then SM-AI-I and SD-AI-I both need the Portuguese reverted. One migration either way. |

Carried unchanged from v2.7: mastery→score recalibration (blocked until real
exam attempts exist), lint noise cleanup.

---

## 8. The Bloom/verb cluster — detail

~15 tasks across three certs where the English statement's verb sits at a
different cognitive level than the task's `bloom_level` stamp.

**There is precedent for both repair directions**, and it is per-task judgment:

- Migration **091** rewrote the *statement* to match the level, where the verb
  named something MCQ cannot assess:
  > *"WRITE a Sprint Goal - writing is Create (6), which MCQ cannot assess at
  > all. The MCQ-assessable competence is SELECTING the coherent goal from
  > plausible alternatives, which is Apply."*
- Migration **094** raised the *level* to match the statement, where the task was
  under-declared:
  > *"UNDER-DECLARED BY TWO LEVELS ... construct under-representation: the
  > credential attested a competence it never measured."*

### High confidence — verb clearly belongs to another level

| cert | task | statement verb | stamped |
|---|---|---|---|
| AIGRM-I | 3.10 | **Analyze** how the frameworks reinforce one another | `2_understand` |
| AIGRM-I | 5.8 | **Analyze** how ethics, policy, and the governance function combine | `2_understand` |
| SPO-AI-I | 4.3 | **Write** high-quality user stories and epics | `3_apply` |
| SPO-AI-I | 4.5 | **Write** effective acceptance criteria | `3_apply` |
| SPO-AI-I | 5.1 | **Create** and communicate a product vision | `3_apply` |
| SPO-AI-I | 5.6 | **Build** and maintain a product roadmap | `3_apply` |
| SD-AI-I | 4.2 | **Write** effective implementation prompts | `3_apply` |
| SD-AI-I | 4.3 | **Apply** the extra scrutiny AI-authored code demands | `4_analyze` |
| SD-AI-I | 4.5 | **Use** AI to generate and strengthen tests | `4_analyze` |

Note AIGRM-I D5's own description calls 5.8 "an analytic capstone" — the English
already argues for `4_analyze`.

### Lower confidence — worth a look in the same pass

| cert | task | verb | stamped |
|---|---|---|---|
| SPO-AI-I | 2.7 | **Explain** the Definition of Done in AI-assisted teams | `3_apply` |
| SPO-AI-I | 3.6 | **Explain** the human-held value accountability | `3_apply` |
| SD-AI-I | 2.5 | **Present** a Done Increment and gather feedback | `2_understand` |
| SD-AI-I | 4.9 | **Maintain** provenance, attribution, licensing hygiene | `2_understand` |
| SD-AI-I | 5.3 | **Work with** the Scrum Master | `2_understand` |
| AIGRM-I | 3.7 / 3.9 | **Recognize** at `3_apply` vs `2_understand` | inconsistent |

**Blast radius per changed task:** the statement or level changes → recompute
`v_cognitive_profile` → reset `exam_blueprint` from the computed profile →
**regenerate items for that task** (existing rows carry the old stamp, and
`trg_item_bloom_matches_task` enforces the match on insert). All three certs have
generated banks. AIGRM-I and AISM-I are `draft`; **SM-AI-I, SPO-AI-I and SD-AI-I
may be live** — check `certifications.status` before touching them.

**None of this is blocking.** No candidate has been served a mis-levelled item:
the drift query returns 0 across all 16,158 items, because items were generated
*after* the 090–095 fixes. The issue is that the statement and the stamp disagree
on paper, which an ISO/IEC 17024 auditor reading the blueprint would notice.

---

## 9. Process notes worth keeping

### The failure mode that keeps recurring

**Row counts without content verification are a false-clean signal.** Recorded
for lessons in an earlier handoff; it bit the item bank (1,026 contaminated rows
passing every count check) and nearly bit SPO-AI-I's approval. Deferred item 3
exists because of this.

### Reusable: per-cert translation dump

One query template, swap the cert code. Returns `domain_code, kind, item_code,
bloom, exam_scope, en, es_419, pt_br, es_prov, pt_prov` ordered domain → kind →
task. Download CSV from the Supabase editor (clean UTF-8; avoids console
mojibake in transit). Expected rows = domains×2 + tasks.

### Reusable: the guarded PowerShell edit

Build an `$edits` array of `old`/`new` pairs → assert **each anchor matches
exactly once** → write only if all pass → verify residuals + ASCII. Used for
every pack edit this session. It caught the trap where `"1.7"` matched three
certs and `supervisión humana` matched four.

**Anchors must be long enough to be unique across all six cert blocks.**

### The pack is ASCII-only by design

`\uXXXX` escapes throughout. It cannot corrupt in transit, which is why corrected
text goes through the pack and the API loader while migrations carry **no
accented characters at all** — they only flip flags. Verify after every pack
edit:

```powershell
Select-String -LiteralPath $p -Pattern '[^\x00-\x7F]'   # expect no output
```

### Check block completeness before building a review doc

```powershell
$l = Get-Content -LiteralPath "scripts\load-jta-i18n.mjs"
$marks = @()
for ($i=0; $i -lt $l.Count; $i++) {
  if ($l[$i] -match '^\s{2}"([A-Z][A-Z0-9-]*-I)":\s*\{') { $marks += [PSCustomObject]@{ Cert=$matches[1]; Line=$i } }
}
$marks += [PSCustomObject]@{ Cert='<end>'; Line=$l.Count }
for ($k=0; $k -lt $marks.Count-1; $k++) {
  $seg = $l[$marks[$k].Line..($marks[$k+1].Line-1)]
  [PSCustomObject]@{
    Cert    = $marks[$k].Cert
    Tasks   = ($seg | Select-String -Pattern '^\s+"\d+\.\d+":' ).Count
    Domains = ($seg | Select-String -Pattern '^\s+"D\d+":' ).Count
  }
}
```

Compare against DB counts. A short block means a stub cert and the two-step path.
