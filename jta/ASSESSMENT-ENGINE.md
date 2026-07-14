# THE ASSESSMENT ENGINE

**How a Certidemy credential is manufactured, and what makes each step true.**

**Version:** 1.0 · 12 July 2026
**Companions:** `COGNITIVE-MODEL.md` (the rules) · `CERT-CREATION.md` (the stages) ·
`CERT-SCHEMA-GUIDE.md` (the tables)
**This document:** the enforcement layer. What guards each link, why it exists, and what
broke without it.

---

## 0. The one lesson

> **A rule that lives only in prose is not a rule. It is a wish.**

Every defect found in the July 2026 audit had the same shape. Not one was a hard
problem. Every one was a stated rule that nothing checked:

| The rule, as written | What was actually happening |
|---|---|
| *"Items assess the task's declared cognitive level."* | The generator **never queried the `tasks` table.** It wrote items from concept definitions and derived Bloom from a difficulty curve. |
| *"Each task declares one cognitive level."* | **Four of five JTAs** carried a second, competing Bloom table. One demanded 15% Analyze from tasks providing 11.5%. Arithmetically impossible. |
| *"MCQ cannot assess Create."* | **Three tasks** said *write a Sprint Goal*, *design a practice*, *design oversight points* — Bloom 6 — and were in exam scope. |
| *"Every task gets ≥10 practice items per language."* | Unordered pagination corrupted the deficit count. One task had **29**. Another had **1**. |
| *"Practice predicts exam readiness."* | Practice items **carried no `bloom_level` at all.** 93.6% of the pool held a column default nobody chose. |

**Six thousand six hundred of 11,135 items (59.3%) tested the wrong competence.**

None of it was visible, because nothing was looking. **This document is about the
looking.**

---

## 1. The chain of custody

This is the flowchart. Everything else is detail.

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │  A JOB REQUIRES A COMPETENCE                                         │
  └──────────────────────────────────────────────────────────────────────┘
                                   │
                    ① JTA declares it as a task, at one
                       cognitive level, with KSAs
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  tasks (statement, bloom_level, K/S/A, criticality, is_exam_scope)    │
  └──────────────────────────────────────────────────────────────────────┘
                     │                              │
      ② concepts carry it            ③ domain weight sets its
         (task_concepts)                share of the exam
                     ▼                              ▼
  ┌──────────────────────┐          ┌──────────────────────────────────┐
  │ concepts             │          │ exam_blueprint                   │
  │  ↓ lesson_concepts   │          │  = COMPUTED from ①×③             │
  │ lessons  ← TEACH     │          │    (never asserted)              │
  └──────────────────────┘          └──────────────────────────────────┘
                     │                              │
      ④ items TEST the task at its declared level   │
                     ▼                              │
  ┌──────────────────────────────────────────────────────────────────────┐
  │  quiz_questions                                                      │
  │    bloom_level == tasks.bloom_level        ← ENFORCED BY TRIGGER     │
  │    secure  → the exam        (no concept links: FIREWALL)            │
  │    practice→ study + readiness (concept-linked, learner-visible)     │
  └──────────────────────────────────────────────────────────────────────┘
                                   │
                    ⑤ a form samples by domain weight;
                       cognition follows automatically
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  the examination                                                     │
  └──────────────────────────────────────────────────────────────────────┘
                                   │
                    ⑥ every response captured, item-level
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  quiz_attempts (question_id, answer, correct, seconds, language)     │
  │  exam_attempts (score, passed, jta_version_id)                       │
  └──────────────────────────────────────────────────────────────────────┘
                                   │
                    ⑦ decision → credential; evidence retained forever
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  credentials  +  the item that produced them, NEVER DELETED          │
  └──────────────────────────────────────────────────────────────────────┘
```

**The claim the credential makes** is that the holder possesses the competences in ①.
Every arrow is a place that claim can quietly become false. **Each one now has a guard.**

---

## 2. The links, and what holds each one

### ① Competence → Task

**Artifact:** `<CODE>_JTA_v2.0.md` → migration → `public.tasks`

Every task carries **exactly one** `bloom_level`, plus `knowledge` / `skills` /
`abilities`, `criticality`, `frequency`, `is_exam_scope`.

**The skills line is the truth-teller.** It says what the candidate must *do*, and it
outranks both the statement's verb and the declared level when they disagree. Every JTA
defect in the audit was found by reading the skills line against the declaration.

**The diagnostic that settles Apply vs. Analyze:**

| | |
|---|---|
| **Apply** | *Select or classify* using a framework you were **taught**. The answer is derivable from the lesson. |
| **Analyze** | *Find a cause* **nobody supplied**. There is no pattern to match against. |

By this test, *"categorize a problem as complex or complicated"* is **Apply** — Cynefin
is taught. *"Diagnose why a team that runs every event correctly still isn't adapting"*
is **Analyze** — no framework hands you that.

**Enforced by:**
- **verify-cert §9** — no exam-scope task above `4_analyze` (MCQ ceiling)
- **verify-cert §5** — every task belongs to a domain; every concept links to a task
- Human + external (Grok) adjudication at JTA authoring. **Not machine-enforceable** —
  a task can be wrong in its verb *and* its declaration *and* its skills, consistently.
  See §7, Gaps.

**What broke:** all five JTAs. Over-declared Analyze (SM 11→6, SD 13→4), under-declared
by two levels (SPO 3.2), a task declaring three levels at once (SPO 5.11), a task wearing
another's skills line (SM 3.3), zero recall competence in three certs, and three Bloom-6
tasks in MCQ exams.

---

### ② Task → Concept → Lesson  (the teaching path)

```
task ──task_concepts──> concept <──lesson_concepts── lesson
                                 └──question_concepts──> practice item
```

**Three junctions, three jobs. Keep them straight:**

| Junction | Job | Break it and… |
|---|---|---|
| `task_concepts` | authoritative task→concept map | mastery rollup breaks |
| `lesson_concepts` | what a lesson teaches | review→lesson link dies |
| `question_concepts` | **how practice FINDS questions** | item is invisible to practice — **and a secure item here leaks the exam** |

**THE SECURE FIREWALL (sacred).** `fetchConceptPractice` does **not** filter by pool. A
secure item linked into `question_concepts` would surface as free practice. **Secure items
carry zero rows in that table**, and `verify-cert §8` proves it on every run. This has
leaked historically (1,077 stray links, migration 052).

**The projection rule.** A lesson declares `concept_slugs` / `task_codes` in frontmatter.
**Frontmatter is inert** — the system queries the join tables. `wire-lessons.mjs`
projects one into the other, and a lesson that is never wired has a hole in the
traceability matrix. Both finished certs shipped with this missed.

**Enforced by:** verify-cert §10 (all concepts taught / all concepts tested / **no
untaught testing** — the 17024 rule that you may not test what you did not teach), §8
(firewall), §11 (lesson integrity: trilingual, no mojibake, every DSL block closed,
drag-match strictly 1:1).

---

### ③ Task + Domain weight → Exam blueprint

> **The cognitive profile is a SUM, not a lever.**

```
profile[level] = Σ  domain.weight_pct ÷ (exam-scope tasks in that domain)
                    over tasks declared at that level
```

Once the JTA declares its tasks and its domain weights, **the profile is already
determined.** Nobody chooses it. `certifications.exam_blueprint` *records* it so it can
be published, verified, and audited — it is **a declaration of what the exam is, not an
instruction for what to assemble.**

**One definition, shared by everything:** `public.v_cognitive_profile`. Used by the
migration that writes the blueprint, by verify-cert that checks it, and by the governance
dashboard that displays it. **They cannot drift, because they are the same query.**

**Enforced by:** verify-cert §9 — the stored blueprint must equal the live computation
(tolerance 0.02, i.e. rounding only). Retag a task's Bloom, edit a domain weight, or
hand-edit a blueprint, and the gate fails.

**What broke:** four JTAs carried a free-standing *"Bloom's Taxonomy distribution (MCQ
target)"* table, inherited from `SMPC_JTA_v2.md` — written when Certidemy was an
exam-**prep** product for CertiProf's SMPC, where it was a **marketing claim**
(*"we place 50% at Apply/Analyze so learners over-prepare"*). Carried into an
own-credential JTA it became a second, competing declaration of cognitive level,
reconciled with nothing. **All four are deleted.**

---

### ④ Task → Item  ★ THE LOAD-BEARING LINK ★

> **`item.bloom_level == task.bloom_level`. Both pools. No exceptions.**

| Direction | Name | What it does to a candidate |
|---|---|---|
| Item **above** task | **construct-irrelevant variance** | Failed on competence the credential never claimed to require. |
| Item **below** task | **construct under-representation** | Certified for competence the exam never measured. |

**Both are validity failures (Messick, 1989). "Easier is safer" is exactly backwards.**

**Why practice is held to the same rule** — reversing an earlier decision. 17024 governs
the examination, not the study material, and scaffolding below the level *is* legitimate
teaching. Both true. The conclusion was still wrong:

- Practice items **carried no `bloom_level` at all** — the RPC listed its insert columns
  and omitted it. 93.6% of the pool held a column default. **Nobody chose that.**
- **The readiness calculator predicts exam performance from practice performance.** It
  was scoring against a near-constant — which is why two right answers on one lesson
  could report *"40% ready."*
- A practice pool that is 94% Understand **cannot predict** a secure exam that is 71%
  Apply. The candidate drills comprehension, feels prepared, and sits an exam demanding
  application. **That is a person who paid us walking into a wall.**
- **The lessons already scaffold** — checkpoints, widgets, in-lesson quizzes. The
  practice pool is not teaching. It is **exam simulation**, and its only job is to
  predict.

**Difficulty is a separate dial.** 1–5 **within** the declared level. An easy Analyze
item and a hard Analyze item are both Analyze items. You make an item harder with subtler
content, closer distractors, or a less familiar situation — **never** by raising the
cognitive level.

**Enforced by — three layers, deliberately redundant:**

1. **The prompt** (`bloomDirective`, `item-task-context.mjs`) — the writer is told the
   task's statement, its KSAs, its declared level, what that level *means* for an MCQ,
   what overshooting looks like, and to spread difficulty 30/50/20 within it.
2. **The database** (`trg_item_bloom_matches_task`, migration 098) — **every insert
   path**: the RPC, a script, a hand-run statement in the SQL editor. A mis-levelled item
   **cannot be stored.**
3. **The verifier** (`verify-cert §9`) — proves it after the fact, across the whole bank.

**What broke:** `gen-cert-secure.mjs` never queried `public.tasks`. It derived Bloom from
`bloomFor(difficulty)` — a curve mapping difficulty ≤2→Understand, 3→Apply, 4+→Analyze,
which made **`1_remember` structurally unreachable** and collapsed Bloom and difficulty
into a single axis wearing two names. The old bank proves it:

```
1_remember   → difficulty 1-2 only
3_apply      → 97% at difficulty 3
4_analyze    → 97% at difficulty 4
```

There was no such thing as a hard recall item or an easy analysis item, **because the
code defined them out of existence.**

---

### ⑤ Item pool → Examination form

**Sample by domain weight → then across tasks within the domain.**

**Cognition follows automatically.** Because every item carries its task's Bloom, a
domain-proportional draw *reproduces* the declared profile. It does not need to be
enforced — only verified.

**Difficulty** is balanced within a task's items (30/50/20) for form reliability:
all-easy fails to discriminate at the cut score; all-hard compresses the score
distribution.

**Forms draw from `v_live_items`** — approved, not retired. Retired items are evidence,
not candidates for circulation.

**Enforced by:** verify-cert §9 (the pool can actually fill a form at the declared
profile, every domain × language — a blueprint the bank cannot satisfy is a promise the
exam breaks silently), §8 (floors: ≥8 secure and ≥10 practice per task per language),
§8.1 (no answer-position bias, χ²; no length cue).

---

### ⑥ Form → Response  (the psychometric record)

**Captured from candidate #1, because it cannot be retrofitted.**

`quiz_attempts` — `question_id`, `user_answer`, `is_correct`, `time_taken_seconds`,
`language`, `presented_order`, `session_id`.

`exam_attempts` — `score_pct`, `passed`, `duration_seconds`, **`jta_version_id`** (every
attempt stamped with the JTA version it was examined against — traceability most
certification bodies do not have).

**Everything downstream is computable from this and nothing else:** p-values,
point-biserial, distractor analysis, KR-20 / Cronbach's α, DIF across es-419 / pt-BR, and
a standard-setting study for the cut score.

**Deferring the *analysis* is fine. Deferring the *capture* is fatal.** An attempt whose
item-level responses were never recorded is psychometrically dead forever.

---

### ⑦ Decision → Credential → Evidence

> **Retire, never delete.**

Once an item has been **presented to a candidate**, it can never be deleted. Deleting it
would destroy the psychometric record, orphan `quiz_attempts`, and make it impossible to
reconstruct **which form a past candidate actually sat** — precisely the evidence required
when a credential is challenged.

| State | Meaning |
|---|---|
| never presented | deletable. This is a **bank correction**, not a record destruction. |
| **ever presented** | **`retire_item()` only.** `trg_prevent_delete_presented_item` raises on DELETE. |

`bank_revision` stamps which cognitive model wrote each item — `v1-preJTA` (difficulty
curve, no task context) vs `v2-jta`. **We can prove, per item, which model produced it.**

`v_retired_items_evidence` computes each retired item's p-value, correct rate, and mean
time-on-item from its live history.

**Suspension ≠ revocation.** `unavailable` status freezes new exam starts; it never
touches an issued credential.

---

## 3. What the database refuses to do

Guards that make bad states **unreachable**, not merely detectable.

| Guard | Migration | Prevents |
|---|---|---|
| `trg_item_bloom_matches_task` | 098 | An item whose cognitive level ≠ its task's. Every insert path. |
| `trg_prevent_delete_presented_item` | 089 | Destroying an examination record. |
| `create_practice_questions()` RPC | 043/044, 098 | Forces `pool='practice'`, `is_exam_scope=false`, `visibility='private'`, writes `question_concepts` atomically, and now stamps `bloom_level` **from the task** and `bank_revision`. |
| `correct_answer` column REVOKE | — | The answer key reaching a client role. Table-wide `GRANT SELECT` **overrides** column-level `REVOKE` — grants must be column-scoped. |
| `visibility` (`secure`/`private`/`public`) | — | Secure items surfacing to learners. |
| Exam freeze gates | — | New exam starts on an `unavailable` cert. |

**Views that exist so two things cannot disagree:**

| View | Why |
|---|---|
| `v_cognitive_profile` | **One definition** of the computed profile — migration, verifier, and dashboard all read it. |
| `v_live_items` | What a form may draw from. Retired items are evidence, not candidates. |
| `v_retired_items_evidence` | The statistics a retired item earned while live. |
| `v_coverage_summary` | Coverage proof; the bar is `untaught_testing_violations = 0`. |
| `v_governance_guardrails` | The evidence room (migration 082). |

---

## 4. The gate: `verify-cert.mjs`

`node scripts/verify-cert.mjs --all` · `--cert <CODE>` · `--json` · `--strict`

**Non-zero exit = do not publish.** 23 checks:

**Structure** — domain weights sum to 100 · every task in a domain · every concept linked
to a task · all tasks in exam scope (or flagged intentional)

**Coverage (17024)** — all concepts taught · all concepts tested · **no untaught testing**

**The firewall** — secure pool carries zero `question_concepts` links

**Pools** — secure floor ≥8/task/lang · practice floor ≥10/task/lang · every item approved

**Cognition (the JTA→item chain)**
- **item bloom == task bloom** (secure, strict)
- no exam-scope task above the MCQ ceiling
- **blueprint == the profile computed live from tasks × domain weights**
- the pool can fill a form at the declared profile

**Item quality** — no answer-position bias (χ² ≤ 11.34) · length cue non-diagnostic
(guard-escape metric) · no out-of-domain vocabulary a key depends on

**Integrity** — every question group holds 3 language rows · every lesson group holds 3 ·
no mojibake · every DSL block has a closer · **drag-match strictly 1:1**

> **On drag-match:** *n* items → *n* targets, exactly one each. `allowReuse` is banned.
> Sorting 4 items into 2 buckets is coin-flips, not assessment — and the component
> evicted the occupant on drop into a filled target, so **39 widgets were literally
> uncompletable.** The rebuild is WCAG 2.1.1 (keyboard) + 2.5.7 (no drag required)
> compliant: click-to-place, keyboard nav, `aria-live`.

---

## 5. The scripts

| Script | Job | Trap |
|---|---|---|
| `gen-cert-secure.mjs` | secure bank, trilingual | Reads `public.tasks`. **No Bloom fallback** — throws if a task declares none. |
| `backfill-practice.mjs` | practice pool to floor | Same. `--dry` first. Deficit-fill only — **never overrides**, so replacing bad items means deleting first. |
| `verify-cert.mjs` | the gate | Run before **any** status change. |
| `wire-lessons.mjs` | frontmatter → join tables | Env `CERT_ID` + `DRY_RUN=1/0`, **no CLI flags**. Reads `content_md` from **DB**, not disk. |
| `load-lessons-direct.mjs` | new lessons → DB | **`--dry`, not `--dry-run`** (unknown flags are silently ignored; `--dry-run` runs **LIVE**). **INSERT only** — cannot update. |
| `update-lesson-content.mjs` | disk edits → existing rows | `--file <ABSOLUTE PATH>`, repeated. No globbing. |
| `debias-positions.mjs` | rebalance answer-key positions | |

**Shared libs:** `lib/item-task-context.mjs` (`taskBlock`, `bloomDirective`,
`bloomForTask`, `isAboveTaskBloom`, `BLOOM_RANK`) · `lib/item-pipeline.mjs`
(`buildCleanItems`: draft → hostile critique → guards → shuffle) · `lib/item-profile.mjs`.

**Pipeline order:** edit lesson on disk → `update-lesson-content.mjs` → `wire-lessons.mjs`
→ `verify-cert.mjs`.

### ⚠ Every paged read needs `.order()`

```js
.eq("certification_id", id).order("id").range(from, from + 999)
//                        ^^^^^^^^^^^^ LOAD-BEARING
```

Postgres guarantees **no row order** without `ORDER BY`. Unordered `.range()` returns the
same row on two pages while skipping another. **The total count still comes out right** —
which is why it hid for months.

**The generators page `quiz_questions` to count how many items each (task, language)
already has. That count *is* the deficit-fill logic.** Fed a duplicated-and-incomplete
list: pairs that looked over-supplied were skipped (**one** practice item), pairs that
looked short were topped up repeatedly (**twenty-nine**). That is the entire explanation
for the uneven practice distribution.

It surfaced only when migration 089 rewrote all 11,135 rows and scrambled the physical
heap order that had been accidentally holding it together.

---

## 6. Building a new certification

`CERT-CREATION.md` has the full stages. **The order that matters:**

1. **Tasks first.** Verb + KSAs + **exactly one Bloom level**. Wanting a task to be
   "Understand for the definition and Apply for the judgment" means **it is two tasks.**
2. Domain weights from criticality and frequency.
3. **Compute the profile. Do not choose it.** Run the query; report the result.
4. **Read it back.** If a hands-on practitioner cert computes to 70% Understand, **the
   tasks are wrong** — fix the tasks, recompute. **Never adjust the profile to flatter
   the credential.** It is a mirror; if you dislike what it shows, change the thing it
   reflects.
5. State the profile in the JTA **as a result, never a target.**
6. Set `exam_blueprint` from it (migration 097's pattern — computed, not typed).
7. **Run `verify-cert.mjs` before generating a single item.**

> **Every defect in this document exists because content was generated before the
> foundation was verified.**

---

## 7. What is NOT enforced (the honest list)

**Machine-checkable, and checked:** everything in §4.

**Not machine-checkable — these need a human or a second model:**

- **A task wrong in both its verb and its declaration.** The verb-scan finds
  *disagreement* between a task's verb and its level. It is **structurally blind** to a
  task where both agree and both are wrong. This is a real hole in the method.
- **Whether a task is a genuine job competence at all.** Only a subject-matter expert
  settles that.
- **Whether a distractor is plausible-but-wrong**, or accidentally defensible.
- **Translation equivalence.** Do es-419 and pt-BR measure the same construct at the same
  difficulty? Back-translation now; DIF analysis once there is candidate data.

**Deferred, and why — recorded so an assessor sees it was a decision, not an oversight:**

| Requirement | Status | Trigger |
|---|---|---|
| **Cut score** — flat 80% | **Interim.** Rationale: **asymmetric error recovery.** Set high and later find the true threshold is 70%? Everyone who passed *is* competent — lower it, past credentials stay valid. Set low and later find it should be 85%? Every holder in the gap is wrongly certified, and you either revoke or permanently compromise the credential. **Conservative-high is the recoverable direction.** | Modified-Angoff study **after** regeneration (SMEs must judge the items that will actually ship). |
| Item analysis (p-value, point-biserial, KR-20) | Deferred — **impossible pre-launch**, requires candidates. Capture is live from attempt #1. | n ≥ 100 attempts/item |
| Form equating | Deferred | multiple live forms |
| DIF across languages | Deferred | sufficient n per language |
| SME panel | **Claude + Grok, with founder adjudication.** More review than most of the market does, and it is described as exactly what it is. | Human panel before accreditation application |

**Positioning — the line that must never be crossed:**

> ✅ **"Built to the ISO/IEC 17024 framework."** True, and a real differentiator.
> ❌ **"ISO 17024 certified."** We are not accredited. Claiming it would be fraud.

---

## Appendix — The July 2026 audit

What one day of forcing item Bloom to equal task Bloom exposed.

| # | Finding |
|---|---|
| 1 | **The generator never read the `tasks` table.** Items were written from concept definitions; Bloom came from a difficulty curve. `1_remember` was structurally unreachable. |
| 2 | **All five JTAs were internally inconsistent** — declared levels contradicted their own KSAs, in five different ways. |
| 3 | **Three tasks were Bloom 6 (Create)** being assessed by multiple choice: *write a Sprint Goal*, *design a personal practice*, *design oversight points*. |
| 4 | **SPO-AI-I's Bloom table was arithmetically impossible** — 15% Analyze demanded from 11.5% of task weight. |
| 5 | **Practice items carried no `bloom_level` at all.** 93.6% held a column default. The readiness calculator was scoring against noise. |
| 6 | **Unordered pagination** corrupted the generators' own deficit counts — the true cause of the uneven practice pool. |
| 7 | **39 drag-match widgets were uncompletable** — the component evicted occupants on drop into a filled target. |
| 8 | **Two widgets never rendered at all** — a missing `::` closer in the lesson DSL. |
| 9 | **Adjudication drift in the fix itself** — I split compound tasks in two certs and collapsed them upward in three, deleting four genuine recall competences. Caught only by laying the five profiles side by side. |

**Result: 6,603 of 11,135 items (59.3%) tested the wrong competence.** The full bank was
purged and regenerated against a reconciled foundation.

**And the meta-finding, which is the reason this document exists:**

> Every single one of these was a rule we had already written down.
>
> **Write the check, or you have not written the rule.**
