# HANDOFF v2.1 — drag-match closed; AIE-I lost and rebuilt

*Session of 2026-07-20. Supersedes HANDOFF-v2.0 for anything below. Corrections to v2.0
are marked **[CORRECTS v2.0]** and are load-bearing — v2.0 is wrong on these points.*

---

## 1. Headline

**Two things happened, and the second was not on the plan.**

1. **The drag-match 1:1 remediation is complete.** All 41 defective widgets across the
   catalog are fixed, translated, pushed, and verified against the database. Every cert
   now passes `§11 drag-match widgets are strictly 1:1`.

2. **AIE-I was found missing from the database, and rebuilt from committed sources to
   23 pass / 0 fail / 0 warn in a single session.** It had been silently overwritten by a
   UUID collision days earlier. Root cause is identified, the loss is fully explained,
   and migration 105 makes the failure mode impossible to repeat.

**The catalog is six certifications, all conforming.**

| Cert | Result | Status | Published |
|---|---|---|---|
| **AIE-I** | **23 pass, 0 fail, 0 warn** | `draft` | false |
| AIGRM-I | 23 pass, 0 fail, 0 warn | `draft` | false |
| AISM-I | 22 pass, 0 fail, 1 warn | `coming_soon` | false |
| SD-AI-I | 22 pass, 0 fail, 0 warn | `available` | **true** |
| SPO-AI-I | 22 pass, 0 fail, 0 warn | `available` | **true** |
| SM-AI-I | 21 pass, 0 fail, 2 warn | `available` | **true** |

---

## 2. THE AIE-I COLLISION — read this before seeding any certification

### What happened

AIE-I was created at `66666666-6666-6666-6666-666666666666`. Migration
`090_aie_i_jta_v2_cognitive_fix.sql` declares that UUID and passed its own guard
(`raise exception 'AIE-I domains D1/D3 not found - wrong cert id?'`), so at that moment
the slot demonstrably held AIE-I.

Migration `102_seed_aism_i.sql` later seeded **AISM-I onto the same UUID**, because the
deterministic-UUID convention numbers certifications by creation order and "the sixth
cert" was assigned `6666` — a slot already in use. The row was updated in place: its
`code` changed from `AIE-I` to `AISM-I`, and every child row beneath it — 3 domains,
18 tasks, 47 concepts, 3 modules, 48 lesson rows, ~1,400 items — was replaced.

**No `DELETE` statement exists in any committed migration.** AIE-I was overwritten, not
deleted.

### Why it went unnoticed for days

- `certifications.id` is the **primary key**, so a duplicate-id check can never fire.
  There was never a duplicate — there was a reassignment.
- A unique constraint on `code` cannot fire either: one row held `AIE-I` before, one row
  held `AISM-I` after.
- `verify-cert.mjs` validates each certification **against itself**. AIE-I before and
  AISM-I after were both internally consistent at every moment.
- A complete overwrite leaves **no orphan rows**, which is why the loss looked exactly
  like a clean cascade delete when we first swept all 18 tables carrying
  `certification_id`.

**The database was never in an invalid state. That is the whole problem.**

### The one clue that survived

Last session's HANDOFF v2.0 §3 recorded "AIE-I contamination hiding behind a correct-
looking count" — 14 AIE-I lessons occupying low `order_index` slots in AISM-I's modules
1–3, "because AIE-I has 3 domains, so its `01-`/`02-`/`03-` prefixes collided."

**That was not contamination.** Those were AIE-I's own lesson rows, sitting under AIE-I's
own `certification_id`, because the two certs shared one id. The cleanup that removed
them removed the last surviving trace of AIE-I. **[CORRECTS v2.0 §3, item 2]**

### The fix — migration 105

`105_cert_identity_guard.sql` installs `trg_guard_cert_identity`, a BEFORE UPDATE trigger
on `certifications` that **raises if `code` changes on an existing row**. That is the
exact statement shape that lost AIE-I.

Escape hatch for a deliberate rename, scoped to the transaction so it cannot leak:

```sql
set local certidemy.allow_cert_code_change = 'on';
update public.certifications set code = 'NEW-CODE' where id = '...';
```

The migration proves the guard by attempting the forbidden update and raising loudly if
it is *permitted*. It also ships two standing queries: a free-slot list and an orphan
sweep.

### THE RULE

> **Never infer a new certification's UUID from how many certs exist.**
> Read the free-slot query in migration 105 first.

Occupied: `1111` SM-AI-I, `2222` AIE-I, `3333` SPO-AI-I, `4444` SD-AI-I, `5555` AIGRM-I,
`6666` AISM-I. **Free: `7777`, `8888`, `9999`.**

---

## 3. AIE-I — rebuilt state

Rebuilt at `22222222-2222-2222-2222-222222222222` by `104_rebuild_aie_i.sql`.

| Layer | State |
|---|---|
| Cert row | `2222…`, `category_slug='ai-workplace'`, `status='draft'`, `is_published=false`, 25 items / 45 min / 80% pass, tier 1 |
| Scaffold | 3 domains (40/36/24), **18 tasks**, **47 concepts**, **55 task_concepts**, 3 modules |
| Profile | **16.23 remember / 51.37 understand / 32.40 apply** — reproduces migration 090's stated figures exactly (16.2 / 51.4 / 32.4) |
| Lessons | 16 × 3 languages = 48 rows, wired (141 lesson_concepts + 48 lesson_tasks), coverage 47/47, `untaught_testing_violations = 0` |
| Secure bank | 432 rows, all 18 tasks ≥8/language, 0 concept links (firewall intact) |
| Practice bank | 540 rows, all 18 tasks ≥10/language |
| Psychometrics | position chi²=**0.5** (lowest in catalog), length-cue escapes 0% (0/142) |
| Widgets | 27 drag-match (9 en × 3), all strictly 1:1 |

### What was recovered vs. reconstructed

**Recovered from committed sources** — scaffold, tasks, KSAs, concept slugs, and task
linkage from `AIE-I_JTA_v2_0.md` (v1.1 LOCKED) with migration 090's revisions applied
(1.1 sharpened; 1.5 and 3.4 re-declared `1_remember`; new tasks 1.7 and 3.5). Lessons
from `content/aie-i/` (commits `e812020`, `cc6d815`, `70673f3`). Blueprint and duration
from migrations 088 and 100.

**Reconstructed, not recovered — the 47 concept `description` fields.** The JTA freezes
concept *slugs* but never their *definitions*; those existed only in the database.
Descriptions were authored from each task's KSA lines. Structure is exact — the wire step
resolved **47/47 concepts with zero unresolved slugs**, proving slug, name, and linkage
are right. Wording is not verified against lesson bodies.

**Outstanding:** spot-check the descriptions most likely to be thinner than what the
lesson teaches — `genai-capabilities`, `genai-limitations`, `ai-limitations`,
`prompt-structure`, `right-tool-for-task`. Items are already written against them.

### Trap for the next lesson load

`load-lessons-direct.mjs` **strips the leading `NN-` from the content folder name before
matching.** Module slugs must be bare: `ai-concepts-and-landscape`, not
`01-ai-concepts-and-landscape`. The first load attempt reported `missing-module: 16` and
inserted nothing — the dry run caught it.

---

## 4. Drag-match remediation — COMPLETE

| Cert | Widgets (DB) | Broken | Result |
|---|---|---|---|
| AIGRM-I | 93 (31×3) | 13 | fixed, translated, pushed, verified |
| SD-AI-I | 75 (25×3) | 3 | fixed, translated, pushed, verified |
| SPO-AI-I | 57 (19×3) | 17 | fixed, translated, pushed, verified |
| SM-AI-I | 54 (18×3) | 8 | fixed, translated, pushed, verified |
| AISM-I | 54 (18×3) | 9 | done previous session |
| AIE-I | 27 (9×3) | 0 | clean |

**41 defects total. Four of the five affected certs were `available` and
`is_published = true` while broken — this was repair of shipped product, not
pre-launch cleanup.** **[CORRECTS v2.0 §5, which implies these were pending publication]**

### Corrections to v2.0's inventory table

- **SM-AI-I is 18 widgets, 8 broken — not 19 / 7.** `content/smpc/_test-all-widgets.md`
  is a scratch file carrying a drag-match. Loaders skip a leading underscore, so it never
  reaches the database and inflates every raw disk scan by one. **[CORRECTS v2.0 §4]**
- **SMPC/SPO-I split was 8 + 17 = 25, not 7 + 16 = 23.** The total 25 was right.
  **[CORRECTS v2.0 §4]**
- **SM-AI-I had no `_i18n` directory on disk at all** before this session, yet the DB held
  93 lesson rows across 3 languages. For that cert, disk was never the source of truth.

### Commit scope caveat

Commit `284d144` is messaged "SM-AI-I (8) + SPO-AI-I (17)" but `git add -A` also swept in
the **AIGRM-I (13) and SD-AI-I (3) disk fixes** from the previous session. The content is
correct and belongs in the repo; the message understates the scope. Not rewritten —
recorded here instead.

---

## 5. Tooling built this session (all committed to `certidemy-web/`)

- **`dragmatch-phase2.ps1`** — translate / push / verify driver for smpc + spo-i.
  **Contains a defect**: `Invoke-Step` swallows child stdout into its return value, so
  every step printed a bare `ok` and `verify-cert.mjs`'s report was invisible. Superseded.
- **`dragmatch-phase3.ps1`** — same driver for aigrm-i + sd-ai-i, **with the fix**:
  `& node @NodeArgs 2>&1 | Out-Host`. Use this one as the template.
- **`verify-dragmatch-cert.ps1`** — cert-wide disk audit. Discovers every drag-match
  widget in a content dir (no hardcoded list), checks bijection per language, detects
  stale siblings by timestamp, detects machine-key drift across languages, and detects a
  copy masquerading as a translation. Reports `_`-prefixed scratch files separately and
  excludes them from the tally.
- **`verify-dragmatch-i18n.ps1`** — superseded by the above; kept for history.

### Two verifier bugs worth remembering

1. **PowerShell operator precedence.** `-join` and the comparison operators share one
   precedence level and evaluate left to right. `$a -join "," -ne $b -join ","` parses as
   `(($a -join ",") -ne $b) -join ","` → the string `"True"` → always truthy. Every
   comparison of joined arrays needs explicit parentheses on both sides. This produced
   25/25 false failures.
2. **A verifier that fails *closed* is survivable; one that fails *open* is not.** The
   above screamed instead of waving 25 broken widgets through. Had the parse gone the
   other way it would have passed everything silently. Run new checks against known-bad
   input once before trusting a green.

---

## 6. Backlog changes

### RETIRED — practice-pool backfill

v2.0 §5 lists "practice-pool backfill on older certs — D1–D5 distribution uneven, some
tasks at 29, some at 1–2." **All six certs now report `practice floor >= 10/task/lang`
at floor.** The migration-099 purge-and-regenerate closed this and it was never recorded.
**[CORRECTS v2.0 §5]**

### NEW

- **AIE-I concept descriptions** — 47 reconstructed, 5 flagged for spot-check (§3).
- **`jta_versions` is partial and stale.** It holds rows for only 3 of 6 certs
  (SM-AI-I, SPO-AI-I, SD-AI-I); AIGRM-I, AISM-I and AIE-I have none. SD-AI-I's
  `blueprint_snapshot` is a bare domain list where the others carry full task-level
  snapshots. Worse, **SM-AI-I's snapshot is labelled `v2.1` and dated 2026-07-01, but the
  reconciliation that supersedes it is `v2.0` dated 12 July** — the registered snapshot
  predates its own successor and still shows task 1.4 as `4_analyze` and 5.11 as
  `5_evaluate` with `is_exam_scope: true`, both changed by migration 091. Under 17024
  this table is the evidence of what the scheme committed to; right now it evidences a
  superseded state under a higher version number.
- **SM-AI-I drifted from its own reconciliation record.** `091` asserts 4 Analyze tasks;
  live shows **6**. The reconciliation doc says 51 tasks; live shows **53**, 52 in scope.
  Two Analyze tasks were added after 091 and no document records them. *(AIGRM-I 3,
  SD-AI-I 4, SPO-AI-I 4 all match their migrations exactly — only SM-AI-I drifted.)*
- **`_test-all-widgets.md`** — keep as a rendering testbed, but note it in any widget
  audit so the phantom count doesn't resurface.

### CARRIED FORWARD from v2.0

- Publish the certs that are ready. AIGRM-I is `draft` at 23/0/0 — the cleanest result in
  the catalog and nothing argues against flipping it. AIE-I is `draft` at 23/0/0 pending
  the description spot-check.
- **AISM-I nominal-bridge slug review (4)** — `ai-incident-response`,
  `enterprise-ai-governance-link`, `escalation-and-handoff`, `human-accountability-retained`
  have no verbatim AIGRM-I sibling; the "16 shared concepts" claim is really 12.
- **SM-AI-I open warnings** — task `5.11` out of exam scope (deliberate per migration 091,
  but unlabelled in the data), and one concept reachable only via that out-of-scope task.
- Level II generator rewrite (best-of-four-plausible model).
- Publish cognitive profiles on scheme pages; `PSYCHOMETRIC-PROCEDURES.md` register.
- `translate-lessons.mjs` persona is Scrum-specific — its do-not-translate list is all
  Scrum nouns, so service-management and governance terms get translated. Harmless for
  smpc/spo-i; a real gap for AIGRM-I, AISM-I and AIE-I.

---

## 7. Migration tip

**105.** Next is **106.**

- `104_rebuild_aie_i.sql` — AIE-I scaffold rebuild at `2222`
- `105_cert_identity_guard.sql` — `trg_guard_cert_identity`

**Commits:** supabase `6e99173`, `053a319`; certidemy-web `284d144`, `609a0bb`.

---

## 8. Operational notes

- **PowerShell paste collisions caused two more incidents** (`--cert SM-AI-Inode`, and a
  swallowed `cd`). Give each `node` / `git` command its own line and let it finish. This
  is now the single most frequent failure mode across three sessions.
- **Downloads is the default browser directory.** Every generated file needs
  `Move-Item -LiteralPath "$env:USERPROFILE\Downloads\<file>" -Destination <target> -Force`
  before use. Two runs failed on a file that was never moved in.
- `verify-cert.mjs` takes `--cert <CODE>`, not `CERT_ID` env. **Exit code is not proof** —
  without `--strict` it does not change its exit tally. Read the report.
- `load-lessons-direct.mjs` — inserts only, skips existing rows; `--dry`, never `--dry-run`.
  Strips `NN-` prefixes from folder names when matching module slugs.
- `update-lesson-content.mjs` — the tool for existing rows. Reports
  `updated / unchanged / not-found / errors` per file. `not-found: 0` is the signal that
  the row existed and actually changed.
- `wire-lessons.mjs` — env vars `CERT_ID` + `DRY_RUN`, no flags. Its
  `"Resolved N concepts, M tasks"` line is the cheapest possible proof that concept slugs
  match the lessons.
- Both item generators enforce answer-cue neutrality at generation time, dropping drafts
  for length dominance and the absolute-word tell, then re-drafting. Expect several
  `drop (cue)` lines per task and re-runs to top up; a run reporting
  `0 task(s) below target` is the clean exit.
