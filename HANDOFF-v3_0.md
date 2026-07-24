# HANDOFF v3.0

**Session date:** 2026-07-23
**Supersedes:** HANDOFF-v2.9
**Migration tip:** 135 · next free number is **136**
**Conformance:** six certs, **0 fail, 0 warn**

---

## 1. What this session was

v2.9 closed the JTA translation wave. This session started as cleanup of its
deferred queue and turned into something else when Juan asked the right question:

> *"We are patching all that was created, but what about what will be created? Is
> what we're doing being captured in the proper places to prevent it from
> happening in the future?"*

The honest answer at the time was **partly**. About half the defect classes found
were prevented; the other half would have recurred on certification #7.

**The second half of this session closed that gap.** Everything found by hand is
now caught by a gate.

| conformance | before | after |
|---|---|---|
| invariants per cert | 24 | **29** |
| failures | 0 | 0 |
| warnings | 3 | **0** |

A warning that fires on a correct state teaches people to ignore warnings. Every
remaining check either passes or fires on something real.

---

## 2. Commits

### `supabase` (14 migrations, tip 135)

| commit | what |
|---|---|
| `4e02e3f` | migrations 122 + 123, handoffs v2.7 + v2.8 |
| `d3848da` | 124 — approve SM-AI-I JTA translations |
| `0a1b6a5` | 125 — approve SPO-AI-I JTA translations |
| `c9ab064` | **126 — close answer-key exposure through `v_live_items`** |
| `d24b0b2` | **127 — `quiz_attempts` FK CASCADE → RESTRICT** |
| `46de184` | 128 — reconcile 16 task statements to their K/S/A; generators made retirement-aware |
| `a1dd43a` | mark `BLOOM-VERB-RECONCILIATION.md` superseded |
| `2eab78c` | verify-cert live-only fetch + traceability invariant; 129 |
| `aba3273` | verify-cert inflected forms + all languages; 130 |
| `69dd29f` | 131 — SPO-AI-I `order_index` |
| `2da2f45` | **`gen-jta-doc.mjs`** — render every JTA from the database |
| `5494a9b` | staleness banners on six hand-written JTA documents |
| `8563134` | **132 + verify-cert — the prevention layer** |
| `e8cb5ed` | 133 — SD-AI-I 3.10 statement |
| `7956b0a`, `b41d197` | `jta.statementVerb` tuned to signal instead of nag |
| `0827a9b` | **`TERMINOLOGY-POLICY.md`** + per-scheme §10.4 |
| `8cbc732` | **CERT-CREATION Stage 11 — Translate the JTA (GATE)** |
| `11eed4f` | 134 + 135 — attempt policy; vendor residue; root docs archived |

### `certidemy-web`

`54a9d10` SM-AI-I i18n · `97cfdc0` SPO-AI-I i18n · `b302a58` SD-AI-I i18n
(wave complete) · `d55db80` pt-BR Scrum Guide title correction · `4457876`
re-translate the 16 corrected statements · `b8adbfd` SD-AI-I 3.10 ·
`d87be55` vendor residue in `CERT_YML_SPEC`

---

## 3. THE PREVENTION LAYER — read this before building cert #7

Everything here exists because the same defect was found by hand first.

### Triggers (migration 132)

**`trg_invalidate_task_translations` / `trg_invalidate_domain_translations`** —
changing an English statement, or a domain title/description, flips that row's
translations back to `is_provisional = true` **in the same transaction**.

*Why:* migration 091 rewrote five SM-AI-I statements. Their approved translations
were never marked stale, so the Spanish blueprint went on saying *"Explicar los
tres pilares"* while the exam measured *"Apply the three pillars to diagnose which
pillar is broken."* Found weeks later only because a human read a CSV column by
column.

**It fired correctly on its first real use** — migration 133 changed one statement
and both translations went provisional with nobody thinking about it.

**`trg_audit_attempt_policy`** (134/135) — re-examination policy changes write to
`admin_actions`, and **refuse** if the actor is unattributable.

### New verify-cert invariants

| id | catches |
|---|---|
| `jta.itemTraceable` | items with no `task_id` — the 1,026-orphan class. The Bloom check did `if (!t) continue`, so untraceable items were *excluded from verification* rather than flagged |
| `i18n.approved` | any provisional translation blocks publication |
| `jta.statementVerb` | published claim ≠ measured competence |
| `jta.displayOrder` | within a domain, display order must equal task-code order |
| `schema.answerKeyViews` | a view emitting `correct_answer` to a client role |
| `schema.attemptEvidence` | `quiz_attempts` FK must stay RESTRICT |

Plus: the verifier now fetches **live items only** (`retired_at is null`) and the
out-of-domain vocabulary check covers **all three languages** and inflected forms.

### `v_schema_guardrails` (132)

Surfaces schema properties `supabase-js` cannot otherwise reach. Both defects it
covers were real and were found by reading the schema by hand.

### Generators are retirement-aware (128)

Both `gen-cert-secure.mjs` and `backfill-practice.mjs` counted existing stock
**without a `retired_at` filter** — after any retirement they would have counted
retired items as inventory and generated nothing. A silent no-op, the worst
failure shape. `bank_revision` is now a `BANK_REVISION` env rather than hardcoded
`v2-jta`.

Round-trip tested: retire two items → generator reports a deficit → un-retire →
back to zero.

### `gen-jta-doc.mjs`

The hand-written JTA documents drifted from the database and **that is what
caused the stale translations** — the translator read the markdown, not the DB.

Measured across six certs: **76 task statements contradicted the database, 16
tasks were absent entirely.** SPO-AI-I published a Bloom distribution of
15/35/35/15 where the computed profile is 1.9/36.9/52.7/8.5, and 90 minutes where
the DB says 120.

Now: `jta/<CODE>_JTA_generated.md`, rendered from the live schema. Narrative
(rationale, sourcing, review history, reconciliation records) stays hand-written
and untouched. The six originals carry staleness banners stating measured drift.

### `CERT-CREATION.md` Stage 11 — Translate the JTA (GATE)

The playbook had translation at Stage 11 covering **lessons only**. JTA
translations were not in the arc at all. Now a numbered, gated stage, and it
records that the stage **reopens itself** via the trigger.

---

## 4. Security: an answer-key exposure, closed

**`v_live_items` emitted `correct_answer` and was granted to `authenticated`.**

The chain: `reloptions = null` → no `security_invoker` → the view ran as its
**owner** (`postgres`) → `relforcerowsecurity = false` means RLS does not apply to
the owner → the view saw every row including `pool = 'secure'`.

Supabase exposes `public` through PostgREST, so any signed-in user could have
issued `GET /rest/v1/v_live_items?select=correct_answer&pool=eq.secure`.

The base table was hardened correctly. **The view bypassed it**, because PostgREST
checks the view's grants, not the table's — the same failure already recorded in
this project's notes about `GRANT SELECT` overriding a column-level `REVOKE`,
reintroduced one layer up.

**No breach:** only test accounts exist, and nothing in either repo referenced the
view. Closed by migration 126, and now gated by `schema.answerKeyViews`.

**Also (127):** `quiz_attempts.question_id` was `ON DELETE CASCADE` — deleting an
item silently destroyed the record that a candidate was presented it and answered
it. That record is the audit evidence behind a scored decision. Now `RESTRICT`,
which forces the retire-and-supersede path the schema was built for.

Four of five FKs into `quiz_questions` were already correct; this was the outlier.

---

## 5. The AISM-I contamination — resolved

1,026 AIE-I items were filed under AISM-I with no `task_id` (540 practice, 486
secure, all created 2026-07-14). Migration **123** removed them; verified 0
orphans across all six certs, and AISM-I's real bank intact at 10 practice / 8
secure per task per language.

**Reachability, determined by reading `generate-mock-exam`:** the secure orphans
were unreachable (allocation runs task → domain, and step 6 skips anything with no
`domain_id`). The **practice** orphans *were* reachable through the step-9
simulator top-off, which drew from the unfiltered candidate list — closed in
`e35d2be`.

**A correction to v2.8's reasoning:** migration 123's successful DELETE was read as
proof no attempts referenced the orphans. With CASCADE that proves nothing. The
actual proof is the timeline — AISM-I's only session was 2026-07-11, three days
before the contamination existed.

---

## 6. The Bloom/verb reconciliation (128) — and the method that matters

Sixteen tasks across three certs had a statement verb at a different cognitive
level than their `bloom_level`.

**`BLOOM-VERB-RECONCILIATION.md` got 5 of 16 backwards**, because it compared the
statement verb against the level and nothing else. Reading the **K/S/A** reverses
it: in every case the skills line agrees with the stored level and the *statement*
is the outlier. The item banks confirm it independently — the generator reads
statement + skills + concepts and lets the **skills** govern.

**The rule was already written down, twice, in documents nobody consulted:**

- migration `094`'s note: *"Statement said 'Explain…' while its SKILLS say 'APPLY
  the one-person rule to a scenario'"*
- `SM-AI-I_JTA_v2.0_RECONCILIATION.md`: *"The diagnostic is the skills line, not
  the statement verb. The skills line states what the candidate must actually do,
  and it is the closest thing in the JTA to a specification of the assessment."*

**Result:** zero level changes, no blueprint recompute, no item regeneration, no
retirement. Sixteen statements corrected. Six tasks whose skills named an
unassessable performance had their statements narrowed **and**
`is_simulation_candidate` set — the authoring half parked explicitly rather than
silently dropped.

The superseded analysis is kept with a header. The reasoning error is part of the
record.

---

## 7. `TERMINOLOGY-POLICY.md` — sixteen locked rules

Single source of truth, referenced by a short §10.4 in each `SCHEME-<CODE>.md`
that states only what is cert-specific. Copying sixteen rules into six documents
would recreate the drift this session spent its effort eliminating.

Highlights, each traceable to a primary source or a recorded review decision:

- **Official EU AI Act language versions govern statutory terms** — `vigilancia
  humana`, `vigilancia poscomercialización`, `gobernanza` never *gobierno*
- **The cross-cert rule (verbatim from the reviewer):** a regulated-AI cert follows
  the statutory rendering; a service-management cert uses the natural operational
  register. This is why AIGRM-I says `vigilancia humana` and AISM-I says
  `supervisión humana`, deliberately
- **Scrum roles and artifacts stay English** — *because the official translated
  Scrum Guides do exactly that*, verified in both editions. **The Guide's own title
  IS translated**: `la Guía de Scrum` / `o Guia do Scrum`
- **Outputs vs outcomes frozen** in AISM-I: `salida`/`saída` vs `resultado`
- **`Match` → `Emparejar` / `Emparelhar`** — new this session

### Two corrections I made to my own work, recorded because they matter

**The pt-BR Scrum Guide title.** I kept `Scrum Guide` in English in SM-AI-I while
flagging pt-BR as unverified, then *propagated that unverified choice* into
SD-AI-I — breaking a correct draft. The official Brazilian edition titles itself
**"O Guia do Scrum"**. The reviewer's rule ("English in both languages") was wrong
in both halves; I caught the Spanish half only because I had checked that source.

**Lesson: consistency with a shipped cert is not evidence.**

---

## 8. Re-examination policy — a real 17024 gap, half closed

**No scheme document published a re-examination policy.** All twelve
`retake|attempt` hits were the ordinary verb in the eligibility section. 17024
requires the body to define and publish the conditions for re-sitting; the only
thing resembling one was `vouchers.attempts_allowed`, an implementation detail.

**Built (134/135):** `certifications.max_exam_attempts` and
`attempt_window_months` (defaulted 6 / 12), audited on change, plus
**`v_exam_exposure`** which computes what a cap costs:

> exposure(N) = 1 − (1 − form/bank)^N, per cert per language, at 1..8 attempts

### ⚠ THE DECISION JUAN STILL OWES

| cert | bank/lang | @3 | @4 | @6 | items/task/lang for 6 @ ~50% |
|---|---|---|---|---|---|
| **SD-AI-I** | 360 | 52.9% | 63.4% | **77.9%** | **17** (has 8) |
| SPO-AI-I | 395 | 49.3% | 59.6% | 74.3% | 16 |
| AIGRM-I | 459 | 43.7% | 53.5% | 68.3% | 15 |
| AIE-I | 144 | 43.6% | 53.4% | 68.2% | 13 |
| SM-AI-I | 468 | 43.0% | 52.8% | 67.5% | 15 |
| AISM-I | 488 | 41.6% | 51.1% | 65.8% | 13 |

PMI — accredited to 17024 — caps the PMP at **3 attempts per eligibility period**,
**no waiting period between them**, retakes paid at a discount, then 12 months.
Their stated reason is exactly this: *"to uphold exam security and reduce
overexposure of examination questions to individual candidates."*

**Three options:** (A) 3 attempts, defensible today, no work · (B) 6 attempts
after growing banks to ~16/task/lang — a `SECURE_PER_TASK=16` generator run ·
(C) 6 as-is, documenting a known exposure risk.

Caps need not be uniform: AISM-I at 4 is already 51%.

**The policy text is NOT yet in the scheme documents** — that is blocked on this
number.

---

## 9. Vendor residue

Live data is clean; migrations 015/016 did that. What remained was in **files**,
and only the ones that still *instruct an author* mattered — `LESSON_AUTHORING_SPEC`'s
worked examples literally read *"CertiProf often asks about the order of values"*,
a template someone would copy straight into a lesson.

Fixed: the canonical lesson spec, `CERT_YML_SPEC` (live — referenced by
`scripts/ingest`), `TUTOR-README`. Headered as superseded: `GROUND_TRUTH`,
`CERTIDEMY_SPEC`, the two stale `LESSON_AUTHORING_SPEC` duplicates.

**Not changed, deliberately:** migrations (a migration records what happened), the
governance docs that explain the history, and the `smpc` internal identifiers that
`PIPELINE-INDEX` and `CERT-CREATION` both protect as never-rendered.

**Found in passing:** the repo root was **not a git repository**, so
`GROUND_TRUTH.md`, `CERTIDEMY_SPEC.md`, `TUTOR-README.md` and a stale
`LESSON_AUTHORING_SPEC.md` had no version control at all. Moved to
`supabase/_archive/`.

---

## 10. Deferred queue

**Voucher / commercial — verified working, gaps identified:**

1. **`assign-voucher` blocks retakes.** It refuses a new voucher when one exists
   with status `assigned`, `redeemed`, **or** `available`. `redeemed` in that list
   means a candidate who passed — or one who exhausted attempts — cannot be issued
   a retake seat. Correct rule: block only an `assigned` voucher **with attempts
   remaining**.
2. **No B2C path.** Super admin can only create vouchers through a partner batch.
   Recommendation: extend `assign-voucher` with a platform-admin direct path —
   `company_certification_id` is already nullable (`NULL = B2C`). Do **not** create
   a "Certidemy Direct" company; it pollutes the partner list and invents a
   counterparty.
3. **Seats vs attempts labels are ambiguous.** `"2 attempts · 8 of 10 left"` — of
   what? And **nothing aggregates `attempts_used` at batch level**, so a partner
   cannot see consumption. Proposal: never leave the unit implicit —
   `1/2 seats assigned · 3/10 attempts used`.
4. **Voucher claim trigger never fired in production.** `handle_new_user` claims
   pending vouchers at signup; migration 072 is committed and the trigger is wired.
   But all three pending vouchers belong to emails that never signed up. **Live
   test: sign up as `new.hire@acmetest.co` (matches `SM-I-V-PEND-0006`) and confirm
   the roster flips `pending → active`.**

**Scheme / policy:**

5. Re-examination policy text into six scheme docs — blocked on §8's number.
6. JTA narrative extraction: lift rationale/sourcing/review history into
   `<CODE>_JTA_narrative.md`, then archive the originals. Careful work — that
   reasoning cannot be regenerated.

**Carried from v2.9:**

7. Practice pool backfill to ≥10/task/lang everywhere.
8. Mastery→score recalibration (blocked until real exam attempts exist).
9. Level II generator rewrite (best-of-four-plausible model).
10. Lint noise cleanup.

---

## 11. Process notes

### The through-line of this entire session

**Three times the answer came from reading what was actually there rather than
from inference** — the JTA markdown for the stale translations, the K/S/A for the
Bloom calls, the item stems for both. Each time a confident wrong conclusion had
already been stated.

And twice the rule was **already written down** in a committed document nobody
opened: migration 094's note and the SM-AI-I reconciliation record both state the
skills-line rule that `BLOOM-VERB-RECONCILIATION.md` then contradicted.

**Before analysing, read the existing decision records.**

### Row counts without content verification are a false-clean signal

Recorded for lessons, then it bit the item bank (1,026 contaminated rows passing
every count check), then nearly bit SPO-AI-I's approval. `jta.itemTraceable`
exists because of this.

### Ordering rule for stub certs

**The pack `--approve` must run BEFORE the flag migration.** Migration 125 ran
first for SPO-AI-I and briefly marked uncorrected text as reviewed. Nothing
errored; counts looked right. Caught only by spot-checking strings.

### The guarded-edit pattern

Every file edit this session: build an `$edits` array → assert **each anchor
matches exactly once** → write only if all pass → verify residuals + ASCII. It
caught a `"1.7"` that matched three certs, a `supervisión humana` that matched
four, and a `taskIds` redeclaration.

**Anchors must be unique across all six cert blocks.**

### Working with the external reviewer

Linguistic judgment strong; **bookkeeping and source verification unreliable**.
Across six rounds: three item-code mislabels (one carrying a task number from a
different cert — applying it literally would have destroyed a task), Spanish
grammar in a Portuguese slot, two wrong terms approved without checking the
source, and a final round that answered the *previous* cert's questions.

**Check every item code against the dump. Verify named-document terminology
against the source before proposing it. Ask for stated rules, not verdicts.**

### A warning that fires on a correct state is worse than no warning

`jta.statementVerb` first warned on ~100 tasks with **zero** confirmed defects,
because a JTA is *supposed* to name competences in the profession's language
(*"Refactor safely toward maintainability"*) while the skills line names what the
exam measures. Three exclusion categories later, it fires only on genuine
claim/measurement mismatch — and found SD-AI-I 3.10 on its own.
