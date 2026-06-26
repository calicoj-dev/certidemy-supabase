# CERTIDEMY — REFERENCE v1.4 (stable; attach to any chat)

_Version 1.4 — 2026-06-25. Supersedes v1.3. Adds/updates: the **AI-line rename**
(SM-I→SM-AI-I, SPO-I→SPO-AI-I) and its legacy-alias resolver; the **SM-AI-I D6→D1–D5
remap** (AI tested in every domain) and the secure-firewall cleanup; **1-year
credential expiry** set at mint; the new **`wire-lessons.mjs` projection control**
and the **lesson→concept/task wiring model** it enforces (the third junction table,
`lesson_tasks`, and the rule that frontmatter must be projected); the first
**certification scheme documents** and the **17024-framework posture**. Carries
forward all v1.3 navigation / console / exam / credential / generator architecture._

This is the "how this codebase works" manual. It changes slowly. For what's built /
what's next, see the companion **HANDOFF** doc (same version).

Claude: act as the decisive EdTech/Scrum/UX/product expert. Deliver COMPLETE
drop-in files (never snippets, never edit a file without seeing its current
contents first), one clean PowerShell block per batch, `npm run build` locally
before every push. I have no concept of time — never suggest breaks.

**Posture:** Certidemy is an **"audit-ready by design," ISO/IEC 17024-framework**
certification body, differentiator = certs + lessons **built for the age of AI**.
We never claim accreditation we don't hold; provisional things are named as such.

---

## 1. REPOS & WHERE EVERYTHING LIVES

Parent folder (NOT a git repo): `C:\Users\Juan\Documents\certidemy\`

**WEB** — `certidemy-web\` → github.com/calicoj-dev/certidemy.git
Next.js 15.1.4 App Router (no src/), TS strict (`noUncheckedIndexedAccess`),
Tailwind v4, shadcn/ui, @supabase/ssr, next-intl v3.26. Cloudflare Pages via
@cloudflare/next-on-pages (**every route file needs `export const runtime =
"edge"`**). Live: https://certidemy.pages.dev. Trilingual: en, es-419, pt-BR.

**SUPABASE** — `supabase\` → github.com/calicoj-dev/certidemy-supabase.git
**The folder is literally named `supabase\` and is its OWN git repo — there is NO
folder named `certidemy-supabase`.** Layout:
- `functions\<name>\index.ts` — Edge Functions (Deno).
- `migrations\NNN_*.sql` — versioned SQL. **Latest tip is 055** (052 D6 remap +
  firewall clean, 053 AI-line rename + expiry, 054 task-5.11 exam-scope, 055 wire
  6 AI lessons). Confirm tip with `Get-ChildItem migrations | Select-Object -Last 6`.
- `scripts\` — Node generators + the **new** `wire-lessons.mjs` projection control
  (Section 3), plus the shared `.env` (service-role key + Anthropic key + knobs —
  see the MAX_TASKS gotcha in Section 5).
- **Scheme docs live at the supabase repo root** (or wherever `.md` reference docs
  live): `SCHEME-SM-AI-I.md`, `SCHEME-SPO-AI-I.md`, `LESSON_AUTHORING_SPEC.md`,
  `SMI_JTA_*.md`, the HANDOFF/REFERENCE pair.
Deploy FUNCTIONS from the PARENT folder: `cd C:\Users\Juan\Documents\certidemy`
then `supabase functions deploy <name>` (public ones add `--no-verify-jwt`).
Commits run INSIDE `supabase\`. Docker warning on deploy is harmless.

**Editor-first migrations (critical):** committing a `.sql` to GitHub does NOT
apply it — there is no migration runner. The ONLY thing that changes the live DB
is pasting the SQL into the **dashboard SQL Editor and running it**. Workflow:
run in editor → verify → THEN commit the file to `migrations\` as the record.
`auth.uid()` returns NULL in the dashboard SQL editor (postgres role).

DB project ref: `pctynukndxnmnxiqpgck`.

---

## 2. KEY WEB PATHS

### Design / i18n / infra
- `app\globals.css` — design tokens. **App is LIGHT by default**; the **accent is
  magenta `#FF2D72`** (accent-deep `#ff6b9d`, accent-soft faint rgba). surface
  `#0c0a0f`-family on dark; ink/ink-soft/ink-mute/ink-faint; success `#34d399`,
  error `#ff5a4d`. CSS vars `--color-*`. Fonts: Inter (`--font-sans`) + JetBrains
  Mono (`--font-mono`/`.font-label`). The **Console is the only dark surface**
  (it pins `data-theme="dark"` on its own root).
- `lib\i18n\navigation.ts` — Link, redirect, **usePathname** (path WITHOUT locale
  prefix), useRouter, getPathname. ALWAYS use these, never raw next/link.
- `messages\en.json` / `es-419.json` / `pt-BR.json` — **STALE snapshots; do not
  trust for completeness.** Nav labels localized INLINE off `useLocale()`. Edits go
  ONLY through idempotent `scripts\i18n-*.mjs` merge scripts.

### Navigation system + the cert "silo" (unchanged from v1.3)
One shell, rendered by both `(app)\layout.tsx` and `(learn)\layout.tsx`. The
learner dashboard lives INSIDE the cert namespace at
`app\[locale]\(learn)\learn\[cert]\dashboard\page.tsx`; cert-less
`(app)\dashboard\page.tsx` is a **redirect** to the default cert's silo. Rail /
switcher / bottom-bar derive the cert FROM THE URL.
- `components\app\app-shell.tsx` — "use client"; immersion decision (matches
  `^/learn/[^/]+/quiz/play` → full-bleed, no rail/bar).
- `components\app\nav-model.ts` — `useNavModel`; Home/Dashboard href is
  `/learn/${cert}/dashboard`.
- `components\app\cert-switcher.tsx` — dropdown routes to
  `/learn/${code}/dashboard`; **strips the "Certidemy " prefix** for display, shows
  the cert code beneath. NOTE: cert names no longer carry "Certidemy" (the rename
  dropped it), so the strip is now a no-op for the two AI-line certs but harmless.
- `app\[locale]\(learn)\learn\[cert]\page.tsx` — cert landing/breadcrumb.

### Cert resolution (UPDATED v1.4)
- `lib\certifications\data.ts` — **`getCertByCode`** (URL slug → cert via
  `ilike("code", …)` + `is_published=true`). **`DEFAULT_CERT_CODE = "sm-ai-i"`.**
  **`LEGACY_CODE_ALIASES`** map rewrites old segments before lookup
  (`sm-i`→`SM-AI-I`, `spo-i`→`SPO-AI-I`) so old URLs never 404 — add a row here only
  when a cert's code changes. Also `CertSummary` + `listPublishedCerts`,
  `listCatalogCerts`, `listCatalogGroups` (grouped marketing catalog by
  `cert_categories`).
- `components\marketing\sample-questions.tsx` — POOL keyed on `SM-AI-I`/`SPO-AI-I`
  with a `POOL_ALIASES` map tolerating the old codes.

### Learner / lessons / exam / dashboard data
- `app\[locale]\(learn)\learn\[cert]\` — `dashboard\`, `quiz\`, `quiz\play\`
  (immersive), `quiz\history\`, `exam\` (Simulator + Cert tabs), `tutor\`,
  `blueprint\`, `module\[module]\`, `[lesson]\`.
- `components\lessons\lesson-container.tsx` + `review-mode.tsx` — take the cert code
  from resolved `certMeta.code`, NOT front-matter `certification_code` (which is
  still stale "SMPC"/"SPO-I" in some lessons — see HANDOFF debt item).
- `lib\engine\` — FOLDER; `sessions.ts` has **`fetchConceptPractice`** (concept
  slugs → `concepts(id)` → `question_concepts(question_id)` → `quiz_questions`).
  **It does NOT filter by `pool`** (a `pool='practice'` filter is pending
  hardening). This is exactly why the secure firewall exists.
- `lib\dashboard\data.ts` — `loadDashboardData` (CERT-SCOPED mastery: intersects the
  user's `user_concept_mastery` with this cert's concept ids — fixes the global-
  mastery bleed), `loadDomainMastery` (domains↔modules by shared `order_index`).

### Partner / Admin Console (dark; magenta-re-skinned v1.4-arc)
Top-level `app\[locale]\console\` (own dark layout). Gated by `lib\console\
access.ts`. All 15 console files now use the magenta accent tokens (was blue
`#5b9dff`); status colors stay semantic (amber pending/expiring, green active/
healthy, red revoked/below-threshold). Pages: `console\page.tsx`,
`companies\[id]\`, `credentials\`, `seats\`, `people\`, `audit\`. `lib\team\
data.ts` still has **`SMPC_CERT_ID`** = the SM-AI-I UUID (invisible legacy
constant name).

---

## 3. KEY SUPABASE PATHS

`supabase\functions\`:
- **`generate-mock-exam\index.ts`** — `mode='simulator'` (practice pool, free) |
  `mode='exam'` (secure pool, VOUCHER-GATED). Allocates `cert.num_questions` across
  DOMAINS by **`domains.weight_pct`** (largest-remainder), balances difficulty
  ~30/50/20, REFUSES a real form if any domain is short. **`weight_pct` is the
  dark-lever** — a domain at 0.00 is excluded regardless of `is_exam_scope`.
- **`score-mock-exam\index.ts`** — grades both kinds; writes `exam_attempts`, links
  voucher, MINTS CREDENTIAL on pass. Reads `passing_score_pct` (?? 80). **v1.4: now
  sets `expires_at` = calendar +1yr from `now` on the credential insert.** Freezes
  `certification_name`/`certification_code`/`credential_code` (via
  `makeCredentialCode(cert.code)`) at mint — so the rename flows onto every new
  credential automatically, and issued history is immutable.
- `verify-credential` (PUBLIC), `get-credential-certificate` (PUBLIC; PDF via
  pdf-lib + QR; `_shared\certificate.ts` reads the FROZEN credential fields, so the
  rename shows on new PDFs with no code change), `get-exam-eligibility`,
  `revoke/restore-credential`, `get-company-detail`, `list-credentials`.
- `_shared\` — cors, supabase (authenticate/getServiceClient/HttpError), claude,
  prompts (en/es-419/pt-BR; "CertiTutor"), mastery, vouchers (`consumeAttempt`),
  certificate, fonts.

`supabase\scripts\` — generators + the projection control (Node, service-role +
Anthropic API; trilingual EN-gen → translate → graft; the **`graftTranslation`**
step keeps ids/correct_answer/type/difficulty from the EN skeleton and rejects
malformed translations, so accents/tildes land clean in the DB — console mojibake
is display-only):
- **`backfill-practice.mjs`** — cert-aware PRACTICE generator. Tops the practice
  pool to a floor (`FLOOR`, default 10/lang/task); inserts via the
  **`create_practice_questions` RPC** (FORCES `pool='practice'`,
  `is_exam_scope=false`, DERIVES `question_concepts` — firewall-safe by
  construction). Idempotent, paginated. Knobs: `CERT_ID`, `FLOOR`, `CHUNK`,
  `MAX_TASKS`, `TASK_ID`, `DRY_RUN`.
- **`gen-spo-i-secure.mjs`** — the SECURE generator (MISNOMER: it's cert-agnostic
  via `CERT_ID`). Tops the secure pool to `SECURE_PER_TASK` (default 8) per lang;
  inserts DIRECTLY to `quiz_questions` with the secure shape (`pool='secure'`,
  `is_exam_scope=true`, `status='approved'`, `module_id=null`, `bloom_level` from
  difficulty, shared `question_group_id`) and **writes NO `question_concepts`** (the
  firewall). Idempotent, paginated. Knobs: `CERT_ID`, `SECURE_PER_TASK`, `CHUNK`,
  `MAX_TASKS`, `TASK_ID`, `DRY_RUN`.
- **`wire-lessons.mjs` (NEW v1.4)** — the **projection control**. Reads each
  lesson's `content_md` frontmatter (`concept_slugs`, `task_codes`), resolves
  slugs→concept ids and codes→task ids **scoped to `CERT_ID`**, and upserts into
  **`lesson_concepts`** (weight `WEIGHT`, default 1.0) + **`lesson_tasks`** for ALL
  language rows of each `lesson_group_id`. Idempotent (`onConflict` +
  `ignoreDuplicates`), dry-run-first (`DRY_RUN=1`), paginated. **Reports any
  unresolved slug/code** (authoring-error surface). Calls NO model (no Anthropic key
  needed). This is the standard tool that keeps the traceability matrix complete;
  run it after authoring any lesson. Knobs: `CERT_ID`, `DRY_RUN`, `LANG`, `WEIGHT`.

---

## 4. DB FACTS (project ref pctynukndxnmnxiqpgck) — UPDATED v1.4

### Certs / blueprints
- **SM-AI-I** `11111111-…`: code **`SM-AI-I`**, name **"Scrum Master I — AI"**,
  provider Certidemy, `num_questions=80`, `passing_score_pct=80`,
  `exam_duration_minutes=60`, `is_published=true`. URL `/learn/sm-ai-i` (legacy
  `/sm-i` aliases). **5 domains / 51 tasks, ALL exam-scope.** Domains: D1 "Agile
  Foundations & Empirical Thinking" 12.5% (7 tasks), D2 "The Scrum Team &
  Accountabilities" 22.5% (11), D3 "Scrum Events" 25% (11), D4 "Scrum Artifacts &
  Commitments" 17.5% (11), D5 "Scrum Master in Practice & Organizational Context"
  22.5% (11). Blueprint D1=10/D2=18/D3=20/D4=14/D5=18=80. Secure **408/lang** (D1
  56, D2 88, D3 88, D4 88, D5 88). Practice 619 en / 609 es / 609 pt. 109 concepts,
  5 modules, 31 lessons ×3 = 93 rows. **All 7 ex-D6 AI tasks re-homed into D1–D5 and
  exam-scope** (migrations 052/054). Lesson→concept/task wiring COMPLETE (migration
  055 for the 6 AI lessons; the rest were always wired).
- **SPO-AI-I** `33333333-…`: code **`SPO-AI-I`**, name **"Scrum Product Owner I —
  AI"**, `num_questions=80`, `passing_score_pct=80`, `exam_duration_minutes=90`,
  `is_published=true`. URL `/learn/spo-ai-i` (legacy `/spo-i` aliases). **5 domains
  / 44 tasks, all exam-scope.** Weights 12.5/15/15/30/27.5 → blueprint
  D1=10/D2=12/D3=12/D4=24/D5=22=80. Tasks per domain: D1=6, D2=8, D3=7, D4=12,
  D5=11. **Per task: 24 secure (8/lang) + 30 practice (10/lang)** → 1,056 secure +
  1,320 practice. 132 concepts, 5 modules, 44 lessons. Lesson→concept/task wiring
  COMPLETE (396 concept + 132 task links via `wire-lessons.mjs`). Signature:
  Spec-Driven Development. English lessons complete; es-419/pt-BR lesson
  localization in progress (practice + exam already trilingual).
- **GAIPC** `22222222-…`: stub (`is_published=false`). **SD-AI-I** (Scrum Developer
  I — AI) = the next cert to build.

### The THREE junction tables (keep them straight — UPDATED v1.4)
- **`task_concepts (task_id, concept_id)`** — authoritative task→concept map; drives
  mastery rollup.
- **`question_concepts (question_id, concept_id)`** — what PRACTICE quizzes walk to
  FIND questions (`fetchConceptPractice`). A question missing here is INVISIBLE to
  practice. **SECURE questions must have ZERO rows here (the firewall).**
- **`lesson_concepts (lesson_id, concept_id, weight)`** — how a lesson resolves "its
  concepts"; half of the **review→lesson** path.
- **`lesson_tasks (lesson_id, task_id)`** — lesson→task link; the other half. *(This
  table is easy to forget — it's the third columns-`(lesson_id, task_id)` table and
  it's what `wire-lessons.mjs` populates alongside `lesson_concepts`.)*

**THE REVIEW→LESSON PATH:** question → `question_concepts` → concept →
`lesson_concepts` → lesson (matched on language). This powers the "Review in <lesson>"
link on quiz results. It is **only as complete as the projection** — see below.

**THE PROJECTION RULE (NEW v1.4, sacred):** a lesson declares its relationships in
frontmatter (`concept_slugs`, `task_codes`) AND must have them PROJECTED into
`lesson_concepts` + `lesson_tasks`. Frontmatter alone is inert — the system queries
the join tables. A lesson with zero join rows is INCOMPLETE: its questions can't
resolve review→lesson and the traceability matrix has a hole. **Both finished certs
shipped with this missed** (SM's 6 AI lessons; ALL 132 SPO lessons) and were fixed
this session. **Always run `wire-lessons.mjs` after authoring.** Documented in the
LESSON_AUTHORING_SPEC v1.2 addendum.

**THE SECURE FIREWALL (sacred):** secure questions must NEVER be linked into
`question_concepts` — `fetchConceptPractice` doesn't filter by pool, so a linked
secure item would surface as free practice, leaking live exam content. Practice
creators write `question_concepts`; secure creators write none. (This session
cleaned 1,077 legacy stray links off SM secure items — migration 052.) Verify after
any secure load: `question_concepts` joined to those secure rows = 0.

**`quiz_questions` pools:** `pool='practice'` (`is_exam_scope=false`, reachable via
`question_concepts`) vs `pool='secure'` (`is_exam_scope=true`, `status='approved'`,
`module_id=null`, `bloom_level` set, shared `question_group_id`; served ONLY by
`generate-mock-exam` mode='exam'). Note: a few legacy practice rows have
`is_exam_scope=true` — harmless, because `pool='secure'` is the real exam gate.

`modules` has NO `domain_id`; modules↔domains map by shared `order_index`.
`tasks.domain_id` is the real FK. `bloom_level` enum: `1_remember, 2_understand,
3_apply, 4_analyze, 5_evaluate, 6_create`.

### Credentials (UPDATED v1.4)
- **credentials**: `credential_code` (unique; new ones mint `SM-AI-I-XXXX-XXXX` /
  `SPO-AI-I-XXXX-XXXX` from `cert.code`; alphabet excludes 0/O/1/I; 31^8 ≈ 852B
  per cert), user_id, certification_id, exam_attempt_id, holder/cert name SNAPSHOTS
  (frozen at mint), score_pct (stored, NEVER shown), locale, **`expires_at` = issued
  + 1yr (set at mint by score-mock-exam; backfilled by migration 053)**,
  certificate_path, credly seams (NULL — independent of credential_code), status.
  RLS owner-select only.
- **Test fixtures (KEEP):** the one credential is now SM-AI-I / "Scrum Master I —
  AI" / `expires_at` 2027-06-11; its `credential_code` stays `SM-I-2DUC-MUCT` (issued
  history immutable — intentional). Voucher `SM-I-V-TEST-0001` (jroman, 999) is
  SM-AI-I only; a live SPO-AI-I cert-exam test needs a SPO-AI-I voucher (not yet
  created).
- company_certifications, seat_batches, vouchers (mutate ONLY via service-role
  functions), admin_actions, quota view `v_allocation_quota` (confirm exact name in
  recon). Bucket `certificates` PRIVATE.

### Roles
`profiles.platform_role` (learner | platform_admin — **jroman.mobile@gmail.com =
platform_admin**); `team_members.role` (team_admin | team_member).

---

## 5. WORKING RULES (non-negotiable)

1. **Never edit a file without seeing its current contents first.** Both historic
   failed Cloudflare builds came from guessing at structure.
2. **Always hand Juan the EXACT command — never "send me the file" from memory.**
   PowerShell with `-LiteralPath` / absolute paths, or a SQL block for the editor.
   Repo layout / script names / DB object names are Claude's to query, not Juan's
   to recall.
3. Deliver COMPLETE drop-in files via download; Juan runs `[System.IO.File]::Copy`
   or `Move-Item -Force -LiteralPath` from `Downloads`. `-LiteralPath` for ANY
   [bracket]/(paren) path; `git add -- "path"` for bracketed paths. DISTINCT
   download names when basenames collide.
4. TS strict has `noUncheckedIndexedAccess`: index access is `T | undefined`; use a
   terminal fallback (`map[k] ?? map.en ?? key`).
5. `npm run build` locally before every push. Cloudflare auto-deploys; failed builds
   don't deploy.
6. **Migrations are editor-first:** run the SQL in the dashboard editor (the only
   thing that changes the live DB), THEN commit the `.sql`. Idempotent, sequentially
   numbered, INDIVIDUAL copy-able blocks. `auth.uid()` is NULL in the editor. **For
   surgical edits to existing files, use the `Repl` helper** (literal `.Replace()`,
   prints "NOT FOUND" if the anchor is absent → idempotent; preserves real unicode
   `— · ✓ →` — console mojibake is display-only, NOT data corruption).
7. **Reachability + the secure firewall are sacred:** practice creators write
   `question_concepts`; lessons get `lesson_concepts` + `lesson_tasks` (via
   `wire-lessons.mjs`); SECURE creators write NEITHER concept link.
8. **NEW — the projection rule:** after authoring/importing a lesson, run
   `wire-lessons.mjs` so its frontmatter projects into `lesson_concepts` +
   `lesson_tasks`. Zero join rows = incomplete lesson. Stale `task_codes` (after a
   remap) show in the script's UNRESOLVED report — rewrite the frontmatter to the new
   codes and re-run.
9. **The exam dark-lever is `domains.weight_pct`, NOT `tasks.is_exam_scope`.** A
   domain at 0.00 is excluded from every form regardless of task flags.
10. Edge Functions: deploy from the PARENT folder; commit inside `supabase\`; public
    ones deploy `--no-verify-jwt`.
11. Scrum proper nouns NEVER translated (Sprint, Scrum Master, Product Owner, Daily
    Scrum, Definition of Done, Sprint Backlog/Goal, Product Backlog/Goal, Increment,
    INVEST). Brand names stay English. Nav labels localized INLINE off `useLocale()`
    (NOT the stale `messages\*.json`). Button variants:
    link|primary|accent|glass|outline|ghost|destructive (NO "secondary").
12. **Recon away from `node_modules`.** **The shared `scripts\.env` sets
    `MAX_TASKS=9`** — `$env:MAX_TASKS="0"` for a full generator run (real process env
    wins over the file).
13. **Windows path gotchas:** bracket/paren paths need `-LiteralPath` (no `-Filter`;
    filter via `Where-Object`). Creating bracketed folders needs
    `[System.IO.Directory]::CreateDirectory()`. Copy via
    `[System.IO.File]::Copy(src,dst,$true)`.
14. **Console = dark; learner/marketing = light.** Never a global dark scrollbar.
    Tailwind v4: opacity-on-var arbitrary values (`bg-[var(--x)]/30`) don't reliably
    compile — use `-soft` tokens or inline `color-mix(in srgb, var(--x) N%,
    transparent)`. Runtime-driven colors can't be Tailwind classes → inline `style`.
15. **Honesty / 17024 posture:** "built to the 17024 framework / audit-ready by
    design," NEVER "ISO 17024 certified." Name provisional things (cut score, SME
    validation, lesson localization) as provisional. One PowerShell block per batch;
    be decisive — recommend, don't menu. LF→CRLF warnings harmless. Never suggest
    breaks.

---

## 6. COMMAND APPENDIX (exact, copy-paste)

### Recon — read a file before editing (ALWAYS)
```powershell
cd C:\Users\Juan\Documents\certidemy\certidemy-web
Get-Content -LiteralPath "app\[locale]\(learn)\learn\[cert]\dashboard\page.tsx" -Raw
```

### Apply a delivered web file → build → push
```powershell
cd C:\Users\Juan\Documents\certidemy\certidemy-web
$dl = "$env:USERPROFILE\Downloads"
[System.IO.File]::Copy("$dl\FILE.tsx", "$PWD\components\app\FILE.tsx", $true)
Remove-Item -LiteralPath "$dl\FILE.tsx"
npm run build
git add -- "components/app/FILE.tsx"; git commit -m "MSG"; git push
```

### Apply a delivered migration (editor-first) → then commit the record
```powershell
# 1) FIRST: paste the SQL into the Supabase dashboard SQL Editor and Run it.
# 2) THEN commit:
cd C:\Users\Juan\Documents\certidemy\supabase
$dl = "$env:USERPROFILE\Downloads"
[System.IO.File]::Copy("$dl\NNN_name.sql", "$PWD\migrations\NNN_name.sql", $true)
Remove-Item -LiteralPath "$dl\NNN_name.sql"
git add -- "migrations\NNN_name.sql"; git commit -m "migration NNN: ..."; git push
```

### Deploy an Edge Function (from the PARENT folder)
```powershell
cd C:\Users\Juan\Documents\certidemy
supabase functions deploy FUNCTION_NAME            # add --no-verify-jwt if public
cd C:\Users\Juan\Documents\certidemy\supabase
git add -- "functions/FUNCTION_NAME/index.ts"; git commit -m "..."; git push
```

### Run the PRACTICE generator (floor practice to >=10/task/lang)
```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
$env:CERT_ID="33333333-3333-3333-3333-333333333333"   # SPO-AI-I (omit for SM-AI-I)
$env:MAX_TASKS="0"                                     # override the .env's 9
node scripts\backfill-practice.mjs
```

### Run the SECURE generator (top up secure to 8/task/lang)
```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
$env:CERT_ID="11111111-1111-1111-1111-111111111111"
$env:TASK_ID=""             # one task: a task uuid; all tasks: empty
$env:MAX_TASKS="0"
$env:DRY_RUN="1"            # dry-run first; then set "0" to insert
node scripts\gen-spo-i-secure.mjs
```

### Run the LESSON-WIRING control (project frontmatter → join tables) — NEW
```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
$env:CERT_ID="33333333-3333-3333-3333-333333333333"   # target cert
$env:DRY_RUN="1"; node scripts\wire-lessons.mjs        # inspect (reports UNRESOLVED)
$env:DRY_RUN="0"; node scripts\wire-lessons.mjs        # apply (idempotent)
```

### SQL — per-task coverage matrix (taught? secure? practice?) — the traceability view
```sql
select d.code as domain, t.code as task, t.is_exam_scope,
       count(distinct lt.lesson_id) as lessons_teaching,
       count(distinct qsec.id) as secure_n,
       count(distinct qprac.id) as practice_n
from public.tasks t
join public.domains d on d.id=t.domain_id
left join public.lesson_tasks lt on lt.task_id=t.id
left join public.quiz_questions qsec on qsec.task_id=t.id and qsec.pool='secure'
left join public.quiz_questions qprac on qprac.task_id=t.id and qprac.pool='practice'
where t.certification_id='CERT_UUID'
group by d.code, t.code, t.is_exam_scope order by d.code, t.code;
```

### SQL — prove a review→lesson resolves (the legit check)
```sql
select q.question_text, c.slug as concept, l.title as review_lesson, l.language
from public.quiz_questions q
join public.question_concepts qc on qc.question_id=q.id
join public.concepts c on c.id=qc.concept_id
join public.lesson_concepts lc on lc.concept_id=c.id
join public.lessons l on l.id=lc.lesson_id and l.language=q.language
where q.task_id='TASK_UUID' and q.pool='practice' and q.language='en' limit 3;
```

### SQL — verify the secure firewall held (must be 0)
```sql
select count(*) as leaked_links
from public.question_concepts qc
join public.quiz_questions q on q.id=qc.question_id
where q.certification_id='CERT_UUID' and q.pool='secure';
```

### SQL — cert header + domain weights (blueprint sanity)
```sql
select code, name, num_questions, passing_score_pct, exam_duration_minutes
from public.certifications where id='CERT_UUID';
select code, title, weight_pct from public.domains
where certification_id='CERT_UUID' order by code;
```

---

## 7. TOOLS & STACK

- **AI/ML:** Claude (claude-sonnet-4-6) for CertiTutor chat, mock-exam scoring,
  practice + secure generation; Voyage AI (voyage-3, 1024-dim) embeddings; FSRS-5
  spaced repetition.
- **DB/backend:** Supabase (PostgreSQL + pgvector HNSW, Edge Functions/Deno, RLS).
- **Frontend:** Next.js 15.1.4, Tailwind v4, shadcn/ui, next-intl v3.26, Framer
  Motion (installed; reserved), Lucide, react-hook-form + zod,
  @cloudflare/next-on-pages.
- **PDF:** pdf-lib + @pdf-lib/fontkit + qrcode (pure-JS/Deno-safe).
- **Deploy:** Cloudflare Pages. **Dev env:** Windows 11 / PowerShell (`-LiteralPath`
  for bracketed paths), Supabase CLI, Node 18+.
- **scripts\:** `backfill-practice.mjs` (practice), `gen-spo-i-secure.mjs` (secure;
  cert-agnostic despite the name), **`wire-lessons.mjs` (lesson→join-table
  projection control)**; all driven by `supabase\scripts\.env`.
- **Governance docs:** `SCHEME-SM-AI-I.md`, `SCHEME-SPO-AI-I.md` (17024-framework
  certification schemes), `LESSON_AUTHORING_SPEC.md` (v1.2 with the projection
  addendum), the JTA docs, this REFERENCE + HANDOFF pair.
