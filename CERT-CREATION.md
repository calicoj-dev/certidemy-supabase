# CERT-CREATION.md — Adding a new certification (the human-gated playbook)

**Purpose:** the single followable procedure for taking a brand-new certification
from "we picked a topic" to "live, coverage-proven, audit-ready." It is the
playbook PIPELINE-INDEX line 32 points at ("*Add a new certification: No
generator — creation is human*"). Open this FIRST before starting any new cert;
do not reconstruct the arc by memory or by poking at a prior cert's files.

**Status:** Written after SM-AI-I, SPO-AI-I, and SD-AI-I were each taken through
this arc and verified live. The plumbing (scaffold → load → wire → prove →
generate) is executed-and-proven, not theorized (see `LESSON-PIPELINE.md`). What
this document adds is the *human* arc above the plumbing — BoK agreement, JTA
authoring with external review, the lesson style-guide gate — which was tribal
knowledge until now.

**A documented procedure is itself ISO/IEC 17024 management-system evidence.**
An auditor wants to see that new schemes are produced by a controlled, repeatable
process, not ad hoc. This document is that control.

---

## 0. The core discipline (non-negotiable)

> **Creation is human. The machine is downstream.**
> There is deliberately **no generator** that invents a certification. The JTA
> (the job-task analysis) and the lessons are authored and externally reviewed by
> humans. Only *after* the JTA is locked and the lessons are taught do the
> cert-agnostic generators fill the question banks. The gates below are what make
> Certidemy's "audit-ready by design" claim true; a cert that skips them is not a
> faster cert, it is a liability wearing a credential.

**The honesty rule (the actual moat).** Every scheme states plainly what is
*structurally proven now* (firewall = 0, coverage = N/N, cue-neutrality measured)
versus what *requires live candidate data and is pending* (standard-setting, item
difficulty/discrimination, SME-panel JTA validation). We claim **"built to the
ISO/IEC 17024 framework / audit-ready by design,"** never "accredited," until
accreditation is formally achieved. Overstating readiness is the one thing an
auditor never forgives. Copy this posture into every new scheme.

---

## 1. The arc, end to end

```
  1. Agree the Body of Knowledge (BoK)          ── human + research
  2. Author the JTA (domains → tasks → concepts) ── human
  3. External review of the JTA (Grok)           ── GATE
  4. Revise → lock the JTA                        ── human
  5. Author the scheme doc (SCHEME-<code>.md)     ── human, from template
  6. Scaffold migrations (cert/domains/concepts/tasks/modules) ── editor-first
  7. Author lessons:
        module 1 → Grok review → STYLE GUIDE → redo module 1 → Grok ── GATE
        (style guide proven) → author remaining modules to it
  8. Load → Wire → Prove coverage                 ── 3 commands + 1 query
  9. Generate question banks (secure + practice, trilingual) ── L1 only; see §7
 10. Prove the invariants (firewall, coverage, cue-neutrality, integrity)
 11. Translate lessons (progressive; not a launch blocker)
 12. Confirm exam params → publish → set status
```

Steps 1–5 and 7 are the creative, human-gated work (the real cost of a cert).
Steps 6, 8–10, 12 are fast, repeatable plumbing. This split is deliberate: the
tooling exists so per-cert *activation* is cheap and the *judgment* stays human.

---

## 2. Stage-by-stage

### Stage 1 — Agree the Body of Knowledge

**Produces:** a one-page BoK decision: the topic, the public foundational
sources we build *facts* from, the target tier (I or II), and the positioning.

- **Use public bodies of knowledge as the foundation layer, exactly as we used
  the 2020 Scrum Guide.** Facts, structure, and competencies are not ownable;
  read the established source (PMBOK, ITIL, NIST frameworks, CompTIA objectives,
  etc.), learn what the field *is*, then author our own JTA in our own words with
  our AI-native edge woven through. See the **marketing-identity line** in §6:
  we build *on their facts*, we never present as/imply we *are* their program.
- **Prefer sources that are genuinely public/citable** (NIST, ISO summaries, EU
  regulation, published exam-content outlines) over copyrighted books where the
  temptation to mirror structure is higher. The cleaner the source, the lower the
  IP/trademark surface.
- **Verify anything post-cutoff before committing.** A confidently-cited but
  hallucinated framework version poisons the JTA at its root. If a source's
  current version/scope is uncertain, confirm it (web search / primary site)
  before locking the BoK.

**Gate:** Juan signs off on the BoK before JTA authoring begins.

---

### Stage 2 — Author the JTA

**Produces:** `<CODE>_JTA_vN.md` — the job-task analysis: domains with
examination weights, the assessable tasks under each, and the concept list each
task draws on.

Mirror the structure the existing certs use (see any `SCHEME-<cert>.md` §4–5 and
the prior `*_JTA_*.md`). A well-formed JTA has:

- **Domains** (typically 5 for an "I"-tier cert), each with a **weight_pct** that
  sums to 100 and drives the exam blueprint.
- **Tasks** per domain (SD-AI-I had 44 across 5 domains), each a concrete "what a
  competent practitioner must know or do," each with a stable **task_code**
  (e.g. `3.1`) that never changes once published.
- **Concepts** per task — the fine-grained, teachable/testable units. These
  become `concepts` rows and are what lessons tag and questions ground in.
- **AI-native tasks woven through every domain**, not bolted on as one section.
  This is the differentiator; the heaviest-weighted domain is usually the
  signature AI-application area.

The JTA is the traceability spine: **domain → task → concept → item → lesson**.
Get the task/concept granularity right here; everything downstream references it.

---

### Stage 3 — External review of the JTA (GATE)

**The review loop:** Juan sends the drafted JTA to **Grok** (the independent
second reviewer). Grok returns suggestions. Juan relays them back. Claude reviews
each suggestion and **accepts or declines with explicit reasoning** — Grok is a
reviewer, not an authority; we integrate what improves rigor and defend what
doesn't. Iterate until the JTA is judged production-ready.

This external pass is editorial/second-reviewer rigor. It is **not** the formal
independent SME-panel validation the standard ultimately requires (that needs a
convened panel and is named as *pending* in the scheme — state it honestly).

**Gate:** no content pipeline work starts until the JTA is locked.

---

### Stage 4 — Lock the JTA

Freeze domains, tasks, task_codes, weights, and the concept list. Changes after
this point are version-controlled scheme changes, not edits.

---

### Stage 5 — Author the scheme doc

**Produces:** `SCHEME-<CODE>.md` in the `supabase/` repo root.

Copy an existing `SCHEME-*.md` (SD-AI-I is the reference) and adapt every clause.
Non-negotiable contents:

- §1 identification, §2 purpose/scope (incl. **out of scope**), §3 eligibility.
- §4 BoK: domains, weights, task/concept/module/lesson counts.
- §6 exam structure: **"I"-tier convention = 80 items, single-best-answer**,
  pass mark, duration. (Confirm against the live `certifications` row before
  publishing — see §12 here.)
- §7 pass mark stated as **provisional, criterion-referenced, expert-judgment**,
  with formal standard-setting named as pending-on-candidate-data.
- §8 the firewall + the answer-cue-neutrality control + the item-bank floors.
- §10 traceability + the three provable guarantees.
- §11 the **"open items on the path to accreditation"** list, stated plainly.

The scheme, the JTA, and `LESSON-PIPELINE.md` are the narrative artifacts the
governance dashboard links alongside the live queries.

---

### Stage 6 — Scaffold migrations (editor-first)

**Produces:** seed migrations under `supabase/migrations/NNN_*.sql` (next
sequential number — check the folder; do not assume). Two migrations, as for
SD-AI-I: one for cert + domains + concepts + tasks + `task_concepts`, one for the
modules.

- **Migrations are editor-first:** paste + run in the Supabase SQL editor to
  affect the live DB (project ref `pctynukndxnmnxiqpgck`); commit the `.sql` as
  the versioned record. `auth.uid()` is NULL in the editor — verify RLS-dependent
  behavior in the authenticated app, not the editor.
- **Module slug discipline (silent-failure trap):** the module `slug` in the
  migration **must** equal the lesson folder name (minus the `NN-` prefix) and
  the `module_slug` in lesson frontmatter. A typo silently misfiles or drops
  lessons at load time. Modules must exist **before** lessons load.
- **`scripts/ingest` plan→diff→apply seeds only the scaffold from `cert.yml`; it
  does NOT load lessons.** Don't expect `content:apply` to import lesson content.
- End each seed migration with a verify query; run it and confirm row counts.

---

### Stage 7 — Author lessons (the style-guide gate)

**Produces:** lesson markdown under `certidemy-web/content/<cert-code>/<NN-module>/*.md`,
conforming exactly to `LESSON_AUTHORING_SPEC.md` (the section-marker DSL, widget
schemas, the validation checklist).

**The proven cadence — do NOT author all modules blind:**

1. Author **module 1** to the authoring spec.
2. Juan sends module 1 to **Grok** for quality review.
3. Grok returns suggestions; Juan relays them. Claude turns the accepted feedback
   into a **STYLE GUIDE** (an explicit, reusable contract: voice, depth, widget
   usage, callout patterns, example density — whatever module 1 revealed).
4. **Redo module 1** against the style guide.
5. Refeed to Grok. **If module 1 is now production-ready, the style guide
   worked** — that is the gate. If not, refine the style guide and repeat.
6. Author the **remaining modules to the locked style guide** — now fast and
   consistent, because the quality contract is proven, not re-litigated per
   module.

**Authoring gates baked in** (from the authoring spec + policy):
- Localization-friendly prose (no idioms, no US-centric examples, metric units).
- Scrum/domain proper nouns never translated; translated terms get English in
  parentheses on first use.
- No fabricated citations or quotes.
- Third-party exam names allowed here as **pedagogical cross-reference** ("the X
  exam calls this Y") — but see the marketing-identity line in §6.
- Every lesson: ≥1 `::concept`, exactly one `::checkpoint`, a `::summary`;
  checkpoint questions carry `concept_slugs` + `bloom_level`.

---

### Stage 8 — Load → Wire → Prove (three commands, one query)

Per `LESSON-PIPELINE.md` §2–4. From the `supabase/` repo root, `CERT_ID` set:

```powershell
$env:CERT_ID = "<cert-uuid>"
# LOAD (dry, then live) — API loader ONLY, never paste lesson SQL in the web editor
node scripts\load-lessons-direct.mjs --in <path>\content\<cert> --lang en --dry
node scripts\load-lessons-direct.mjs --in <path>\content\<cert> --lang en
# WIRE (dry, then live)
$env:DRY_RUN = "1"; node scripts\wire-lessons.mjs
$env:DRY_RUN = "0"; node scripts\wire-lessons.mjs
```

- **Never paste lesson SQL into the Supabase web editor** — it corrupts multibyte
  characters (em-dashes, curly quotes) inside large statements. The API loader
  sends bytes over the API with no clipboard/SQL-parse path. `gen-lesson-sql.mjs`
  is a versioned/audit artifact only.
- **Editing an existing lesson** is a different order: edit disk → run
  `update-lesson-content.mjs` (propagates to `content_md`) → `wire-lessons.mjs`
  (reads `content_md` from the DB, NOT disk). Skipping the middle step silently
  wires stale content.

**Prove (the 17024 coverage artifact):**
```sql
select * from v_coverage_summary where certification_code = '<CODE>';
```
Require `concepts_taught == concepts_total` and `untaught_testing_violations == 0`.
The second is the "no untaught testing" guarantee — it must always be 0.

---

### Stage 9 — Generate question banks (LEVEL I; see §7 for Level II)

Both generators are cert-agnostic and `CERT_ID`-driven. Need
`supabase/scripts/.env` with `SUPABASE_SERVICE_ROLE_KEY` + `ANTHROPIC_API_KEY`.

```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
$env:CERT_ID = "<cert-uuid>"; Remove-Item Env:\TASK_ID -ErrorAction SilentlyContinue
$env:MAX_TASKS = "0"        # 0 = all tasks
node scripts\gen-cert-secure.mjs      # SECURE pool: ≥8/task/language, writes ZERO question_concepts (firewall)
node scripts\backfill-practice.mjs    # PRACTICE pool: ≥10/task/language, via create_practice_questions RPC
```

- Each item runs the shared **cue-guard** pipeline before translation:
  misconception-sourcing → draft → hostile critique-and-revise → length-parity
  gate (repair-or-drop) → Fisher-Yates position shuffle → translate-by-graft to
  es-419 + pt-BR (English skeleton authoritative; ids/correct_answer/difficulty
  preserved). Cues are killed on the English skeleton so all three languages
  inherit a clean item.
- **Idempotent:** both read current counts and fill only the deficit. Re-run to
  top up any task left short (dropped-for-cue items reduce a round's yield).
- **Verify by COUNT/behavior, not console.** Generators guarantee ≥floor, not
  =floor (over-fill is benign; never delete). A full-cert sweep to a
  double-zero deficit is the authoritative completeness gate — domain-level
  checks alone have missed short tasks before.

---

### Stage 10 — Prove the invariants

Run these and require the stated result before publishing:

| Invariant | Check | Required |
|---|---|---|
| No untaught testing | `v_coverage_summary` | `untaught_testing_violations = 0` |
| Concept coverage | `v_coverage_summary` | `concepts_taught = concepts_total` |
| Secure firewall | count secure items carrying a `question_concepts` link | **0** |
| Trilingual integrity | count question groups not holding exactly 3 language rows | **0** |
| Blueprint sufficiency | per-task secure count ≥ 8 per language, all tasks | all pass |
| Answer-cue neutrality | position dist / key-longest % / length spread | within scheme §8.1 bounds |

These are the live feeds for the governance dashboard — the same queries the
scheme doc references clause-by-clause.

---

### Stage 11 — Translate lessons (progressive, not a launch blocker)

Per `TRANSLATION-PIPELINE.md` + `translate-lessons.mjs` → `load-lessons-direct.mjs`
(`--lang es-419` / `--lang pt-BR`). The `lesson_group_id = uuid_v5(cert_uuid, slug)`
math ties each translation to its English sibling automatically — **no re-wire**
needed for translations. A candidate can sit the exam/practice in any language
once the banks are trilingual (Stage 9) even while lesson localization catches up;
state this transparently in the scheme's open-content note.

---

### Stage 12 — Confirm exam params → publish → set status

- Reconcile the scheme's §6 exam table against the live `certifications` row
  (`num_questions`, `passing_score_pct`, `exam_duration_minutes`). "I"-tier
  convention: 80 items, 80% pass, single-best-answer; duration per cert.
- **Grant-before-feature:** if any new directly-authed read was added for this
  cert's surfaces, ship its `GRANT SELECT ... TO anon, authenticated` + RLS
  policy editor-first BEFORE the web push, or the feature silently no-ops in prod
  (RLS filters rows; the grant lets the role touch the table at all — a missing
  grant is a swallowed 42501).
- Flip lifecycle status via the super-admin `/console/certifications` panel →
  `set-cert-status` edge fn. States: `draft` → `coming_soon` → `available` →
  `unavailable`. `unavailable` freezes new exam starts only; it never touches
  issued credentials, and in-flight exams that began under `available` may finish.
- Author the JTA + scheme as `coming_soon` immediately if you want the credential
  visible before content is complete.

---

## 3. Per-cert fill-in-the-blanks

Record these once per new cert (and add the cert row to PIPELINE-INDEX):

```
Credential name  : Certidemy <Name> I — AI
Credential code  : <CODE>            (e.g. AIGP-AI-I)  — OUR code, never a third party's
Cert UUID        : <uuid>
Tier             : I  (single-correct-answer)   |  II (single-BEST-answer — see §7)
Content dir      : certidemy-web/content/<cert-folder>/
Domains          : <N> (weights sum to 100)
Tasks            : <N>   Concepts: <N>   Modules: <N>
Exam             : 80 items / <pass>% / <duration> min
Scaffold migs    : <NNN_*.sql>, <NNN_*.sql>
Scheme doc       : supabase/SCHEME-<CODE>.md
```

---

## 4. The sacred gates (consolidated — none are optional)

1. **Secure firewall.** Secure items carry **zero** `question_concepts` links.
   `fetchConceptPractice` finds items by walking that graph, so a single link
   leaks exam content into practice. `gen-cert-secure.mjs` enforces this by
   construction; the firewall query must return 0.
2. **Item-bank floors.** ≥8 secure and ≥10 practice items **per task per
   language** (en / es-419 / pt-BR). Over-fill is benign; never delete to hit a
   number.
3. **Answer-cue neutrality.** Every item passes the shared cue-guard (length
   homogeneity + small margin — NOT "key never longest," which is an inverse cue;
   uniform position; no rhetorical/absolute-word tell).
4. **17024 honesty.** Audit-ready-by-design, never "accredited." State pending
   items (SME-panel JTA validation, standard-setting, item stats) plainly.
5. **Proper nouns never translated;** translated terms get English in parens on
   first use.
6. **Marketing-identity line.** Third-party BoK/exam names (Scrum Guide, PMBOK,
   ITIL, NIST, etc.): **ALLOWED** as foundational facts and as pedagogical
   cross-references in lesson bodies. **FORBIDDEN** in marketing and app chrome
   whenever the copy claims or implies Certidemy *is* that program or presents its
   syllabus/domains as ours ("welcome to X", "the five X domains", "the full X
   syllabus"). Internal identifiers (folder names, `--cert` codes,
   `certification_code` frontmatter) are never rendered and stay untouched.
7. **Editor-first migrations; grant-before-feature; commit each repo separately**
   (`certidemy-web` and `supabase`); deploy functions from the parent
   `certidemy\`, commit from inside `supabase\`.
8. **npm run build green before ANY web push** (TS strict, `noUncheckedIndexedAccess`).

---

## 5. Level I vs Level II — where the machine stops

An **"I"-tier** cert asks *"which answer is correct"* — exactly one defensibly
right option, distractors wrong on the merits. The current generators
(`item-pipeline.mjs` + `item-cue-guard.mjs`) encode this contract in their bones:
the critique pass tightens any item with "multiple defensible answers" down to
exactly one. **The full L1 arc — scaffold → lessons → questions → publish —
churns today.**

A **"II"-tier** cert asks *"which answer is BEST"* — four *plausibly-correct*
options graded by quality (situational judgment). This **inverts** the L1 critique
rule (defensible-but-suboptimal distractors are the point, not a flaw to remove),
and needs higher Bloom levels and inverted cue logic.

**Consequence for churn:** an L2 cert can go all the way through this playbook —
BoK, JTA, scheme, scaffold, lessons, load/wire/prove coverage — on the **current
machine unchanged**. It stops only at **Stage 9**: secure/practice generation
needs a new `item-pipeline-l2.mjs` sibling (keeping misconception-sourcing and the
position/length guards, swapping the critique contract to preserve graded
plausibility). That sibling is a **separate, scoped, later build** and **must not
start until L2 JTAs exist**. Until it exists, do not run the L1 generator on an
L2 cert — it would flatten the best-answer items into wrong-answer items.

---

## 6. Definition of done (a new cert is "live")

- [ ] BoK agreed; JTA authored, Grok-reviewed, locked.
- [ ] `SCHEME-<CODE>.md` written, honest about pending items.
- [ ] Scaffold migrations run editor-first + committed; verify counts pass.
- [ ] Lessons authored to the style-guide gate; `LESSON_AUTHORING_SPEC` clean.
- [ ] Load + wire + `v_coverage_summary`: taught = total, violations = 0.
- [ ] Secure + practice banks at floor, trilingual; all §4 invariants pass.
- [ ] Exam params reconciled with the live `certifications` row.
- [ ] Grants shipped ahead of any new authed read; build green; both repos pushed.
- [ ] Status set (`coming_soon` or `available`); cert row added to PIPELINE-INDEX.

---

*End of CERT-CREATION.md. Add a row for "Add a new certification" in
PIPELINE-INDEX pointing here, and update this doc whenever the arc changes.*
