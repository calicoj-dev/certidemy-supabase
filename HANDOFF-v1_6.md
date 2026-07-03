# CERTIDEMY — HANDOFF v1.6 (paste this into the new chat)

_Version 1.6 — 2026-07-03. Supersedes v1.5. Since v1.5 the headline event was the
**full authoring + activation of certification #3, SD-AI-I (Scrum Developer I —
AI)**: all 44 lessons written and validated, loaded live into the DB, wired, and
**proven at 135/135 concepts taught, 0 untaught-testing violations.** This session
also produced two permanent, cert-agnostic tools and a governance doc that together
turn per-cert lesson activation from "days" into "a few commands":
`gen-lesson-sql.mjs`, **`load-lessons-direct.mjs` (the canonical lesson loader)**,
and **`LESSON-PIPELINE.md`**. Pairs with REFERENCE v1.4 (still the stable manual;
a v1.5 reference bump is pending to add the lesson pipeline + SD-AI-I) and the new
**`LESSON-PIPELINE.md`** (repo root)._

Pre-launch. Claude: act as the decisive EdTech/Scrum/UX/product expert and technical
co-builder. Deliver COMPLETE drop-in files (never snippets, never edit or run a file
without seeing its current contents first — always hand me the exact copy-paste
command to read it). One clean PowerShell block per batch. `npm run build` locally
before every web push. I have no concept of time — never suggest breaks. Never ask me
to find a file or recall a name from memory; you decide, you drive. When you learn
something non-obvious about how the system works, it MUST go into the documentation
(governance + future handoff) — I insist on this.

**The mission:** Certidemy is an "audit-ready by design," ISO/IEC 17024-framework
certification platform whose differentiator is certificates and lessons **built for
the age of AI**, targeting LATAM (trilingual en / es-419 / pt-BR). Launch, sell,
collect candidate data, then pursue formal 17024 accreditation. Until accredited we
say "built to the 17024 framework," never "ISO 17024 certified." Everything must be
legit and provable — people pay real money.

---

## 1. REPOS (full detail in REFERENCE §1)

Parent (NOT a repo): `C:\Users\Juan\Documents\certidemy\`
- **WEB** `certidemy-web\` → github.com/calicoj-dev/certidemy.git (Next 15.1.4, edge everywhere, Cloudflare Pages, live https://certidemy.pages.dev). Lesson content: `content\<cert>\<NN-module>\*.md`. Lesson-SQL generator: `db\gen-lesson-sql.mjs`. Ingest (scaffold only): `scripts\ingest\`.
- **SUPABASE** `supabase\` → github.com/calicoj-dev/certidemy-supabase.git. The folder IS `supabase\` and is its own repo — no `certidemy-supabase` folder exists. Functions in `functions\<name>\index.ts`; migrations in `migrations\NNN_*.sql`; generators + `.env` in `scripts\`. Scheme/JTA/style-guide/pipeline docs at repo ROOT. Commit inside `supabase\`; deploy functions from the PARENT.

**Migrations are editor-first.** A committed `.sql` does NOT touch the live DB — paste
into the Supabase dashboard SQL Editor and Run; the committed file is only the
versioned record. `auth.uid()` is NULL in that editor. DB ref `pctynukndxnmnxiqpgck`.
Cert UUIDs: **SM-AI-I `11111111-…`**, **SPO-AI-I `33333333-…`**, **SD-AI-I
`44444444-…`**, GAIPC `22222222-…` (unpublished stub). Latest migration: **067**;
next is 068.

---

## 2. WHAT CHANGED THIS SESSION (the SD-AI-I activation arc — NEW in v1.6)

**Authored all 44 SD-AI-I lessons**, 5 modules (D1 6 / D2 8 / D3 10 / D4 12 / D5 8),
to `LESSON_STYLE_GUIDE.md`. Validated whole-cert: banned-phrase clean, glossary
syntax clean, all cross-refs resolve, **all 135 concept slugs have exactly one home
lesson** (structural de-dup clean), 44/44 structurally complete, 3 checkpoints each.
External review (Grok) scored modules 8.6–8.8. Committed to
`content/sd-ai-i/<NN-module>/`.

**Discovered the real lesson-loading path** (documented in `LESSON-PIPELINE.md`):
- The `scripts/ingest` plan→diff→apply pipeline seeds **only the cert scaffold**
  (cert/domains/concepts/tasks/modules) from `cert.yml`. **It does NOT load lessons.**
- Lessons load via a **markdown → DB** step. Two tools now exist:
  - `db/gen-lesson-sql.mjs` — cert-agnostic; generates lesson-load **SQL** (versioned
    / audit record).
  - **`scripts/load-lessons-direct.mjs` — cert-agnostic API loader; THE CANONICAL
    load step.** Reads markdown, inserts via Supabase JS `.insert()`. No clipboard,
    no SQL string parsing. Idempotent. Sets `lesson_group_id = uuid_v5(cert, slug)`
    matching Postgres `uuid_generate_v5` (verified against a live row), so translation
    siblings link automatically.

**⚠️ HARD-WON LESSON (in the pipeline doc):** Do NOT paste lesson SQL into the
Supabase web SQL editor. Its paste path corrupts multibyte chars (em-dashes `—`,
curly quotes, ellipses) inside large statements, breaking string literals
(`relation "X" does not exist`). This cost most of a session on one module. The API
loader avoids it entirely. If SQL load is ever unavoidable: ASCII-normalize first and
run via `psql -f`, never a web paste.

**Migrations run this session (editor-first, committed):**
- **065** — SD-AI-I cert scaffold: cert + 5 domains + 44 tasks + 135 concepts + 135
  task_concepts (verified live).
- **066** — cert-agnostic coverage-audit views (`v_coverage_tested_not_taught`,
  `v_coverage_taught_not_tested`, `v_coverage_summary`).
- **067** — 5 SD-AI-I modules (deterministic `a4444444-…` ids; slugs match content
  folders — load-bearing for module resolution).

**Activation executed + verified live:**
- 44 lessons loaded (36 via generated SQL; module-2's 8 finished via the API loader
  after the paste issue — 02-06 specifically).
- `wire-lessons.mjs` run: 135 `lesson_concepts` + 44 `lesson_tasks`, **zero
  unresolved slugs.**
- `select * from v_coverage_summary where certification_code='SD-AI-I'` →
  **concepts_total 135 / concepts_taught 135 / untaught_testing_violations 0** /
  concepts_tested 0 (expected — no questions yet) / is_published false.

**SD-AI-I teaching layer is COMPLETE and PROVEN.**

---

## 3. CURRENT STATE OF SD-AI-I

| Layer | State |
|---|---|
| Scaffold (cert/domains/concepts/tasks/modules) | ✅ live (065, 067) |
| Lessons (en) | ✅ 44 loaded, wired |
| Coverage | ✅ 135/135 taught, 0 violations |
| Questions (secure + practice) | ⬜ NOT started — **this is the next job** |
| Translations (es-419, pt-BR lessons) | ⬜ not started |
| Published | ⬜ false |

---

## 4. NEXT JOB — QUESTION GENERATION (start here)

Goal: author trilingual question banks so `concepts_tested` climbs to 135 while
`untaught_testing_violations` stays 0. Questions are grounded in the taught, tagged
concepts (that's why lessons-first was the locked order).

- **Generators** live in `supabase\scripts\`, cert-agnostic, `CERT_ID`-parameterized,
  run per domain:
  - **Secure** (`gen-*-secure.mjs` pattern) — writes **zero** `question_concepts`
    (the secure firewall; secure items must never be linked, or they'd leak into
    practice via `fetchConceptPractice` which doesn't filter by pool). Target ~8/task/lang.
  - **Practice** (`backfill-practice.mjs`) — writes via the `create_practice_questions`
    RPC, which **auto-derives** `question_concepts` from `task_concepts`. Floor ≥10/task/lang.
- Knobs seen historically: `SECURE_PER_TASK`, `FLOOR`, `CHUNK`, `TASK_ID`, `DRY_RUN`,
  `MAX_TASKS` (defaults 9; set `$env:MAX_TASKS="0"` for full runs).
- **First step in the new chat:** have Claude READ the existing secure + practice
  generators (exact filenames via a `Get-ChildItem supabase\scripts` listing) before
  running anything — confirm they're `CERT_ID`-driven, then dry-run per domain.
- After questions: re-check `v_coverage_summary` (tested climbing, violations 0), then
  translations, then `is_published=true` when every domain clears blueprint in all
  three languages.

---

## 5. THE CANONICAL LESSON PIPELINE (now documented — `LESSON-PIPELINE.md`)

Scaffold (migrations) → **Load (`load-lessons-direct.mjs`, API, NOT web-paste)** →
**Wire (`wire-lessons.mjs`)** → **Prove (`v_coverage_summary`)** → Questions → Publish.
Per-cert activation is ~3 commands + 1 query. Read `LESSON-PIPELINE.md` (repo root)
for exact commands, the new-cert checklist, and the paste-corruption warning.

Commands that worked this session (SD-AI-I, from `supabase\` root):
```powershell
$env:CERT_ID="44444444-4444-4444-4444-444444444444"
# load (dry then live), per language:
node scripts\load-lessons-direct.mjs --in ..\certidemy-web\content\sd-ai-i --lang en --dry
node scripts\load-lessons-direct.mjs --in ..\certidemy-web\content\sd-ai-i --lang en
# wire (dry then live):
$env:DRY_RUN="1"; node scripts\wire-lessons.mjs
$env:DRY_RUN="0"; node scripts\wire-lessons.mjs
```
Coverage proof:
```sql
select * from v_coverage_summary where certification_code='SD-AI-I';
```

---

## 6. BACKLOG (deferred, non-blocking — from prior handoffs, still open)

- **SM-AI-I: 7 untaught_testing_violations** (stale D6-remap `task_codes` in re-homed
  lesson frontmatter, 6.1–6.7 pre-remap) — fix via coverage views + re-wire.
- **SM-AI-I pass mark 85% → 80%** (standard for "I"-tier).
- **Practice-pool backfill** to ≥10/task/lang across SM-AI-I and SPO-AI-I (distribution
  is uneven; some tasks at 1–2).
- **Governance / architecture super-admin dashboard** — surface each 17024 artifact as
  a LIVE query per clause (`v_coverage_summary`, `v_question_group_integrity`,
  `jta_versions`, telemetry, appeals, late_submission). Juan very keen. Post-launch.
  **`LESSON-PIPELINE.md` feeds this.**
- **REFERENCE bump to v1.5** — fold in the lesson pipeline, `load-lessons-direct.mjs`,
  and SD-AI-I facts (currently only through v1.4).
- Motion/cohesion (Framer Motion) sprint; es-419/pt-BR lesson translations for SD-AI-I.

---

## 7. WORKING RULES (non-negotiable — full list in REFERENCE §5)

Complete drop-in files only; never run/edit a script without reading it first (hand me
the read command). One PowerShell block per batch; `-LiteralPath` for bracketed paths.
`npm run build` green before web push. Migrations + lesson SQL are editor-first (but
lessons load via the API loader, not paste). Commit each repo separately; LF→CRLF
warnings are harmless. Scrum proper nouns never translated. Claude drives decisions —
no menus of options, no "what would you like to do"; you know the plan, execute it.
Document newly-discovered system knowledge immediately. Grok is the second reviewer;
evaluate its notes explicitly (accept/decline with reasoning).
