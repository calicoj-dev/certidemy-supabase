# PIPELINE-INDEX.md — Certidemy build index (READ THIS FIRST)

**Purpose:** the single answer to "I want to do X — what do I read before touching
anything?" This is the permanent map. It outlives any one session (the HANDOFF
docs are session snapshots; this is the durable index). If you're about to do a
task on this list, open its playbook FIRST — do not reconstruct the procedure by
poking at files live. That rediscovery is exactly the waste this index exists to
prevent.

> **The core discipline (learned the hard way, non-negotiable):**
> Are we translating? → read the translation playbook.
> Generating questions? → read the question-stage contract.
> Building/changing the cert lifecycle? → read the lifecycle section.
> The first move for any recognized activity is "load its playbook," never
> "start poking." Reading the playbook first is what turned a multi-hour
> discovery scramble into a three-command run.

---

## Activity → read-first map

| I want to… | Read FIRST | Then use (canonical tool) |
|---|---|---|
| **Translate lessons** to es-419 / pt-BR | `TRANSLATION-PIPELINE.md` + the header docstring of `supabase/scripts/translate-lessons.mjs` | `translate-lessons.mjs` → `load-lessons-direct.mjs` |
| **Generate question banks** (secure + practice) | `LESSON-PIPELINE.md` §3 (question-stage operational contract) | `gen-cert-secure.mjs` (secure), `backfill-practice.mjs` (practice) |
| **Load lessons** into the DB | `LESSON-PIPELINE.md` §2 | `db/gen-lesson-sql.mjs` → `scripts/load-lessons-direct.mjs` → `wire-lessons.mjs` |
| **Author lessons** (DSL, widgets, style) | `LESSON_AUTHORING_SPEC.md` (+ v1.2 addendum) | authoring by hand |
| **Understand / audit a cert's blueprint** | `SCHEME-<cert>.md` (e.g. `SCHEME-SD-AI-I.md`) | — |
| **Author a new scheme doc** | copy an existing `SCHEME-*.md` as template | — |
| **Change a cert's lifecycle status** (draft/coming_soon/available/unavailable) | HANDOFF "Cert status lifecycle" section (below, until `CERT-LIFECYCLE.md` is extracted) | super-admin `/console/certifications` panel → `set-cert-status` edge fn |
| **Run / debug the exam flow** | HANDOFF "Exam flow" section | `generate-mock-exam` → `score-mock-exam` → `/verify/{id}` |
| **Add a new certification** | *No generator — creation is human.* JTA → external-AI review → lock → modules → lessons → questions. See HANDOFF "Cert creation stays human." | — |

If an activity isn't on this list, it doesn't have a playbook yet — check the
HANDOFF backlog, and if you create a new repeatable procedure, **add a row here
and write its doc** (documented procedures are also ISO/IEC 17024 management-system
evidence, not just convenience).

---

## Where everything lives

### Repos (two, independent git repos)
- `C:\Users\Juan\Documents\certidemy\certidemy-web\` → `calicoj-dev/certidemy.git`
  — Next.js 15.1.4 App Router, TS strict (`noUncheckedIndexedAccess`), Tailwind v4,
  shadcn/ui, next-intl v3.26, Cloudflare Pages, `export const runtime = "edge"` on routes.
- `C:\Users\Juan\Documents\certidemy\supabase\` → `calicoj-dev/certidemy-supabase.git`
  — the folder **is** `supabase\`, its own repo. **Deploy** functions from the PARENT
  `certidemy\` (`supabase functions deploy <name>`); **commit** from inside `supabase\`.
- Supabase project ref: `pctynukndxnmnxiqpgck`.

### Key scripts (in `supabase/scripts/` unless noted)
- `gen-cert-secure.mjs` — secure-pool generator, cert-agnostic (CERT_ID-driven; writes ZERO `question_concepts` = the firewall). Renamed from `gen-spo-i-secure.mjs`.
- `backfill-practice.mjs` — practice-pool generator (via `create_practice_questions` RPC, which auto-derives `question_concepts`).
- `translate-lessons.mjs` — cert-agnostic lesson translator (disk-first, validate-by-graft). NEW this session.
- `load-lessons-direct.mjs` — canonical API lesson loader (idempotent; `lesson_group_id = uuidV5(lesson_id, CERT_ID)` so translations inherit the en row's concept/task links — **no re-wire needed**).
- `wire-lessons.mjs` — projects frontmatter tags into `lesson_concepts` / `lesson_tasks`. Run after any en lesson load; NOT needed for translations.
- `scripts/lib/item-pipeline.mjs`, `scripts/lib/item-cue-guard.mjs` — shared question-gen engine (draft→hostile-critique→parity→shuffle; answer-cue neutrality).
- `db/gen-lesson-sql.mjs` (in certidemy-web) — cert-agnostic lesson-SQL generator (feeds the loader).

### Governance / procedure docs (supabase repo root)
- `SCHEME-SM-AI-I.md`, `SCHEME-SPO-AI-I.md`, `SCHEME-SD-AI-I.md`
- `LESSON-PIPELINE.md`, `TRANSLATION-PIPELINE.md`
- `HANDOFF-v*.md`, `CERTIDEMY-REFERENCE-v*.md` (versioned; latest wins)
- **`CERT-LIFECYCLE.md` — NOT YET WRITTEN** (gap; lifecycle is documented in HANDOFF-v1.7 for now).

### Certs (UUIDs)
- SM-AI-I `11111111-1111-1111-1111-111111111111` — status `available`
- SPO-AI-I `33333333-3333-3333-3333-333333333333` — status `available`
- SD-AI-I `44444444-4444-4444-4444-444444444444` — status `available` (as of this session; content-complete, exam proven)
- GAIPC stub `22222222-…` — CertiProf-era placeholder, **not ours**; likely `draft` or already absent. To be replaced with an own-code cert (data cleanup, backlog).
- All "I"-tier certs: **80 questions, 80% pass, single-best-answer.** Durations: SM 60min, SPO/SD 90min.

### Content
- Lessons: `certidemy-web/content/<cert-code>/`; SD-AI-I at `content/sd-ai-i/`; translations under `content/<cert>/_i18n/<lang>/`.
- **`content/smpc/` and `--cert smpc` / `certFolder="smpc"` are LEGITIMATE internal content-pipeline identifiers — do NOT rename them.** (The *constant* `SMPC_CERT_ID` was renamed to `SM_AI_I_CERT_ID` this session; the content paths stay.)

---

## Operational gotchas (these WILL bite a fresh instance — internalize them)

1. **Migrations are editor-first.** SQL must be pasted and run in the Supabase
   dashboard SQL editor to affect the live DB. Committing the `.sql` file is only
   the versioned record. `auth.uid()` is NULL in the editor — status-tie/RLS
   helpers return false there; verify behaviorally in the authenticated app.
2. **Large pastes can arrive EMPTY.** A big `Get-Content -Raw` of a full file
   sometimes lands blank on the assistant's side. Workarounds that reliably work:
   `Select-String` with `-Context` (prints just the relevant region), write to a
   `Downloads\*.txt` and `Get-Content` it, or read the file in ~165-line halves
   with `Select-Object -Skip/-First`. Don't fight it — switch method.
3. **Anchor `Repl` patches on CODE, not comments.** PowerShell/console mojibake
   (em-dash `—` shows as `â€"`, curly quotes garble) breaks exact-match anchors
   that include comment text. Anchor on pure code lines (conditions, signatures).
   The file on disk is fine UTF-8; it's only the console display that's mangled.
4. **The `Repl` helper uses ABSOLUTE paths** via `Join-Path $root $rel` (.NET
   resolves relative paths from the home dir, not CWD). Always set `$root` to the
   repo root.
5. **`-LiteralPath` for bracketed paths**; `[System.IO.Directory]::CreateDirectory()`
   to make bracketed folders (e.g. `app\[locale]\…`).
6. **`npm run build` green before ANY web push.** Non-negotiable (TS strict).
7. **Deploy functions from the PARENT `certidemy\`; commit from inside `supabase\`.**
   "Docker is not running" on deploy is a harmless warning — remote deploy still succeeds.
8. **`$env:TASK_ID` / `$env:CERT_ID` persist across runs in a session** — clear
   `TASK_ID` before any whole-cert sweep; always set `CERT_ID` explicitly (in-code
   default is SM-I).
9. **Verify by COUNT / behavior, not console.** Generators guarantee ≥floor not
   =floor (over-fill is benign, never delete). "Success. No rows returned" on an
   UPDATE doesn't tell you it changed rows — re-query with `returning` or a select.
10. **Full-cert sweep to a double-zero is the authoritative completeness gate**
    (domain-level checks alone missed 3 D5 secure tasks once).
11. **RLS is NOT a grant.** A direct authed query (supabase.from("table") with the
    SSR/user client, NOT via an edge function on the service role) needs BOTH an
    owner RLS policy AND a table-level GRANT SELECT ... TO authenticated. RLS
    filters WHICH rows; the grant lets the role touch the table at all. Missing
    grant = Postgres 42501 "permission denied for table", raised BEFORE RLS runs.
    If the data-loader is failure-tolerant (try/catch that degrades a section),
    the 42501 is SWALLOWED and the feature silently no-ops with no visible error.
    This is exactly how Fix F's seal and the dashboard's mock_exam_results section
    were both silently dark. Column-scope the grant on a public-reachable table
    (exclude sensitive cols, e.g. credentials excludes score_pct); full-grant a
    strictly owner-only table (e.g. mock_exam_results). Migrations 070/071 added
    the two missing ones; a sweep confirmed every OTHER directly-read table was
    already granted, and the ungranted rest are edge-function-only (service role),
    correctly deny-by-default. Adding a direct authed read to a NEW table? This is
    the playbook: check its authenticated grant FIRST.
12. **Ship the grant BEFORE (or with) the feature.** A direct-authed-query feature
    deployed ahead of its grant silently no-ops in prod until the grant lands (Fix
    F's first push beat migration 070 by minutes; the seal was dark until the grant
    ran). Order: grant editor-first, THEN push the web feature.

---

## Working style (how Juan wants the co-builder to operate)

- **Decisive.** Own technical calls when you have context. No menus of options —
  make the call and explain accept/decline reasoning (esp. when weighing Grok's suggestions).
- **Read before editing.** Never edit a file without reading its current contents.
  Complete drop-in files, or literal `.Replace()` anchor patches — never vague snippets.
- **Exact copy-paste commands.** One PowerShell block per batch. Never ask Juan to
  recall a path or name from memory.
- **No suggested breaks / no "we're out of time."** Juan has no concept of time in
  the session; a message gap could be minutes or days. Keep going.
- **Commit each repo separately.** Document newly-discovered system knowledge
  immediately (in HANDOFF / the relevant playbook).
- **Scrum proper nouns never translated** (Sprint, Scrum Master, Product Owner,
  Developers, Definition of Done, Increment, INVEST, etc.). Translated terms get
  English in parentheses on first use.
- **Design aesthetic:** premium, restrained (Linear/Stripe/Vercel/Mercury). Three.js
  rejected (edge-runtime incompatible). Button variants: link/primary/accent/glass/
  outline/ghost/destructive only. Badge variants: default/accent/success/outline/mono.
