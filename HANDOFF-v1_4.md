# CERTIDEMY — HANDOFF v1.4 (paste this into the new chat)

_Version 1.4 — 2026-06-25. Supersedes v1.3. Since v1.3 both finished certs were
**re-branded onto the "AI line" and made provably audit-ready**: SM-I → **SM-AI-I**
("Scrum Master I — AI") and SPO-I → **SPO-AI-I** ("Scrum Product Owner I — AI");
SM-AI-I's dark D6 was **re-homed into D1–D5 and made exam-scope** (AI now tested in
every domain); a **secure-pool firewall leak in SM-AI-I was cleaned**; credentials
now carry a **1-year expiry** (set at mint); the **lesson→concept/task wiring gap was
closed for BOTH certs** via a new permanent control (`wire-lessons.mjs`); and the
first **certification scheme documents** (SM-AI-I + SPO-AI-I) were written to the
ISO/IEC 17024 framework. Pairs with **REFERENCE v1.4** (the stable manual — read it
for paths, schema, the firewall + wiring model, the generators, and exact commands)._

Pre-launch. Claude: act as the decisive EdTech/Scrum/UX/product expert. Deliver
COMPLETE drop-in files (never snippets, never edit a file without seeing its
current contents first), one clean PowerShell block per batch, `npm run build`
locally before every push. I have no concept of time — never suggest breaks. And:
**always hand me the exact copy-paste command for anything you need to read or
run** — don't ask me to find a file or recall a name from memory.

**The mission (say it plainly):** Certidemy is an **"audit-ready by design,"
ISO/IEC 17024-framework** certification platform whose differentiator is
certificates and lessons **built for the age of AI**. The plan: launch, sell, collect
candidate data, then pursue formal 17024 accreditation. Until accredited, we say
**"built to the 17024 framework," never "ISO 17024 certified."** Everything must be
legit and provable — because people pay real money for it.

---

## 1. REPOS (full detail in REFERENCE Section 1)

Parent (NOT a repo): `C:\Users\Juan\Documents\certidemy\`
- **WEB** `certidemy-web\` → github.com/calicoj-dev/certidemy.git (Next 15.1.4,
  edge everywhere, Cloudflare Pages, live https://certidemy.pages.dev).
- **SUPABASE** `supabase\` → github.com/calicoj-dev/certidemy-supabase.git. The
  folder IS `supabase\` and is its own repo — **no `certidemy-supabase` folder
  exists.** Edge Functions in `functions\<name>\index.ts`; migrations in
  `migrations\NNN_*.sql`; the Node generators + `.env` in `scripts\`. Commit
  inside `supabase\`; deploy functions from the PARENT (`supabase functions
  deploy <name>`, `--no-verify-jwt` for public).

**Migrations are editor-first.** A committed `.sql` does NOT touch the live DB —
there is no runner. To change the DB, paste the SQL into the **Supabase dashboard
SQL Editor and run it**; the committed file is only the versioned record.
`auth.uid()` is NULL in that editor (postgres role). DB ref `pctynukndxnmnxiqpgck`.

---

## 2. WHERE WE STAND (canonical facts — UPDATED v1.4)

- **Two certs are real, renamed to the AI line, and provably wired.**
  - **SM-AI-I** `11111111-…`: code **`SM-AI-I`**, name **"Scrum Master I — AI"**,
    provider Certidemy, **80Q / 80% / 60min**, `is_published=true`. **5 domains /
    51 tasks, ALL exam-scope.** Weights D1=12.5 / D2=22.5 / D3=25 / D4=17.5 /
    D5=22.5 → blueprint D1=10 / D2=18 / D3=20 / D4=14 / D5=18 = 80. Secure pool
    **408/lang** (D1 56, D2 88, D3 88, D4 88, D5 88; ~5–6× blueprint quota).
    Practice **619 en / 609 es / 609 pt**. 109 concepts, 5 modules, 31 lessons ×3
    = 93 rows. Lesson→concept/task wiring COMPLETE.
  - **SPO-AI-I** `33333333-…`: code **`SPO-AI-I`**, name **"Scrum Product Owner I
    — AI"**, **80Q / 80% / 90min**, `is_published=true`. **5 domains / 44 tasks,
    all exam-scope.** Weights 12.5 / 15 / 15 / 30 / 27.5 → blueprint D1=10 / D2=12
    / D3=12 / D4=24 / D5=22 = 80. Per task: **24 secure (8/lang) + 30 practice
    (10/lang)** → 1,056 secure + 1,320 practice. 132 concepts, 5 modules. Lesson→
    concept/task wiring COMPLETE (396 concept links + 132 task links via
    `wire-lessons.mjs`). Signature competency: **Spec-Driven Development**.
  - **GAIPC** `22222222-…`: stub (`is_published=false`).
- **The AI is now genuinely IN the credential criteria.** SM-AI-I's old Module-6
  "AI-Augmented Teams" domain (which sat at weight 0.00, authored-but-dark) was
  dissolved: its 7 AI tasks were **re-homed into D1–D5 and flipped to exam-scope**
  (migration 052), the last one's secure pool was generated and it too was flipped
  (054). AI is now tested in every SM-AI-I domain. SPO-AI-I always wove AI through
  all domains.
- **Credentials carry a 1-year expiry.** `score-mock-exam` sets `expires_at` =
  issued + 1 calendar year at mint (deployed). Migration 053 backfilled existing
  rows and re-stamped the one pre-launch test credential to the new cert name/code.
  Issued `credential_code` prefixes are immutable: the test cred keeps
  `SM-I-2DUC-MUCT`; **new credentials mint as `SM-AI-I-XXXX-XXXX`** (the generator
  builds off `cert.code`).
- **Legacy URLs still resolve.** `getCertByCode` has a `LEGACY_CODE_ALIASES` map
  (`sm-i`→SM-AI-I, `spo-i`→SPO-AI-I) so old `/learn/sm-i` links don't 404.
  `DEFAULT_CERT_CODE = "sm-ai-i"`.
- **The lesson→question traceability link works for BOTH certs.** The review→lesson
  feature (question → `question_concepts` → concept → `lesson_concepts` → lesson)
  was always live for core content but was **broken/empty for the AI lessons (SM)
  and for ALL lessons (SPO)** — the frontmatter tags were never projected into the
  join tables. Now fixed: SM via migration 055 (6 AI lessons), SPO via
  `wire-lessons.mjs` (all 132). Verified in the UI ("Review in …" links appear on
  AI questions) and by SQL.
- **First scheme documents written.** `SCHEME-SM-AI-I.md` and `SCHEME-SPO-AI-I.md`
  — formal certification schemes to the 17024 framework, grounded in live DB facts,
  honest about what's provisional (cut score, SME validation, governance, records).
- Roles unchanged: `profiles.platform_role` (learner | platform_admin),
  `team_members.role` (team_admin | team_member). **jroman.mobile@gmail.com =
  platform_admin.** Console (dark) + credentials + vouchers + cert PDF + public
  `/verify/<id>` all live.
- Test fixtures KEPT: credential (now SM-AI-I / "Scrum Master I — AI" / expires
  2027-06-11, code still `SM-I-2DUC-MUCT`); voucher `SM-I-V-TEST-0001` (jroman,
  999 attempts — **SM-AI-I only**).

---

## 3. VERIFIED WORKING (do not re-litigate)

**Migrations applied + committed this session (editor-first, all run live):**
- **052** — SM D6 remap into D1–D5 (7 AI tasks re-homed + exam-scope; 6 AI lessons
  re-homed to Modules 1/2/4/5; empty D6 domain + Module 6 retired) **and** secure
  firewall cleanup (deleted 1,077 stray `question_concepts` on SM secure items —
  legacy pre-firewall residue; SPO was already clean).
- **053** — rename both certs to the AI line + re-stamp the test credential +
  backfill `expires_at = issued_at + 1yr`.
- **054** — task 5.11 (the last re-homed AI task) flipped to exam-scope after its
  secure pool was generated. D5 now 11/11.
- **055** — wire the 6 SM-AI-I AI lessons into `lesson_concepts` + `lesson_tasks`
  (the review→lesson fix for SM's AI content).

**New permanent control — `supabase\scripts\wire-lessons.mjs`** (committed):
cert-agnostic (`CERT_ID`), idempotent, dry-run-first (`DRY_RUN=1`) projection of
each lesson's frontmatter (`concept_slugs`, `task_codes`) into `lesson_concepts`
(weight 1.0) + `lesson_tasks`, for all language rows of each `lesson_group_id`.
**Reports any slug/code that doesn't resolve** (authoring-error surface). Ran live
for SPO-AI-I (396+132 links). Re-run against SM-AI-I is a near no-op on concepts
(confirming it matches the 055 hand-fix) and **reports SM's 6 AI lessons' stale
`task_codes` (6.1–6.7) as UNRESOLVED** — see debt item in §4.

**Edge function change (deployed + committed):** `score-mock-exam` now sets
`expires_at` on the credential insert (calendar +1yr from `now`).

**Web changes (built green + pushed):** `lib\certifications\data.ts`
(`DEFAULT_CERT_CODE="sm-ai-i"` + `LEGACY_CODE_ALIASES`); `components\marketing\
sample-questions.tsx` (POOL keys → `SM-AI-I`/`SPO-AI-I` + `POOL_ALIASES` legacy
tolerance).

**Console magenta re-skin (from earlier this arc, all 15 files):** every console
file moved off hardcoded blue `#5b9dff` → the magenta accent tokens, with
`data-theme="dark"` pinned on the console root so tokens resolve self-contained
(learner/marketing stay light). Status colors kept semantic (amber/green/red);
only off-brand blue → magenta. Done + committed.

**Everything from v1.3 still stands:** the per-cert silo dashboard
(`/learn/[cert]/dashboard`), cert-scoped mastery, both generators, the persistent
AppShell, immersive `/quiz/play`, trilingual exam end-to-end, voucher-gated cert
exam that mints a credential on pass, public verify, cert PDF, the dark console.

---

## 4. WHAT'S NEXT (in rough priority)

### A — Start cert #3: SD-AI-I (Scrum Developer I — AI)
The two finished certs are the template. Build SD-AI-I the RIGHT way from birth:
1. JTA → domains/tasks/concepts → modules/lessons → practice + secure pools →
   **run `wire-lessons.mjs`** (the projection is now a documented rule, not tribal
   knowledge — see the LESSON_AUTHORING_SPEC v1.2 addendum).
2. Write `SCHEME-SD-AI-I.md` from the SM/SPO template once it's wired.
3. Mirror the firewall discipline (secure writes no `question_concepts`).

### B — Audit-readiness artifacts (the 17024 path; mostly writing)
4. **Place the scheme docs** (`SCHEME-SM-AI-I.md`, `SCHEME-SPO-AI-I.md`) into the
   repo and commit. They're the highest-leverage legitimacy + enterprise-sales
   artifacts.
5. **Apply the LESSON_AUTHORING_SPEC v1.2 addendum** (the projection rule) into the
   actual spec file and bump it to v1.2.
6. Later, once there's candidate data: item statistics, form reliability, a
   modified-Angoff standard-setting study to validate the 80% cut score; document
   the JTA derivation + plan SME validation; draft appeals/complaints/integrity
   procedures and an impartiality structure. (None are fakeable retroactively —
   they need real candidates and a governance build-out.)

### C — Finish SPO-AI-I to fully launchable
7. **SPO-AI-I trilingual LESSON pass (the real content gap).** Lessons are complete
   in English; es-419 + pt-BR localization is in progress (the scheme doc states
   this transparently). Practice + exam are already trilingual, so a non-English
   candidate can test today; lesson study localizes progressively.
8. **Live SPO-AI-I `mode='exam'` form + credential.** The secure pool is proven
   blueprint-valid by SQL, but the allocator path hasn't been exercised for SPO
   (cert exams are voucher-gated; the only test voucher is SM). Mint a SPO-AI-I
   test voucher, issue one real exam, confirm it assembles + scores + mints a
   `SPO-AI-I-XXXX-XXXX` credential.

### D — Cleanup / debt (small, real)
9. **Stale SM-AI-I lesson frontmatter.** The 6 re-homed AI lessons still carry old
   `task_codes` (6.1–6.7), `certification_code: SMPC`, `module_slug:
   ai-augmented-teams` in their `content_md` frontmatter. The running system is
   correct (DB columns + 055's join rows are what execute), but the
   authoring-source-of-truth disagrees with the DB. Rewrite those 6 frontmatters to
   the new task codes (1.7/3.11, 2.10, 2.11, 4.11, 5.10, 5.11) + correct cert/module
   slugs, then re-run `wire-lessons.mjs` (should report 0 UNRESOLVED). Surfaced by
   the script's UNRESOLVED report.
10. **`pool='practice'` filter in `fetchConceptPractice`** (`lib\engine\
    sessions.ts`) — belt-and-suspenders lock so a secure item can never surface in
    practice even if mis-tagged. Reconfirm the exact fetch block before editing.
11. **Breadcrumb sweep** — a few pages still link "Dashboard" → `/dashboard`
    (redirect catches them but lands on the DEFAULT cert). Fix to
    `/learn/${cert}/dashboard`: `blueprint\page.tsx`, `module\[module]\page.tsx`,
    `tutor\page.tsx`, plus `module-catalog.tsx`, `quiz-player.tsx`, `mock-exam.tsx`.
12. **Cross-cert leak audit** — sweep user-wide reads (FSRS/review, any
    `user_concept_mastery` / `quiz_questions` query not scoped by cert/pool) for the
    same class of bug the v1.3 mastery fix addressed.
13. **SM "I"-tier pass mark** — SM-AI-I is 80, SPO-AI-I is 80 (consistent now);
    confirm no surface still hardcodes 85.

### E — Console + housekeeping (carryover)
14. Admin company drill-down + revoke depth (`/console/companies/[id]`); post-login
    `/welcome` interstitial for multi-role users; fold `dashboard\team` into
    `/console`; confirm the learner dashboard READS `passing_score_pct`; the
    **Motion & Cohesion** sprint (Framer Motion installed, unused) — AFTER console.

### F — Roadmap (bigger, later)
15. SM-II / future tiers; Credly / Open Badges integration (NULL seams exist; the
    `credential_code` and Credly's UUID are independent/format-agnostic — no
    throwaway badge before then); public B2B buy/allocate flow; landing-page remodel.

---

## 5. WORKING RULES (full list in REFERENCE Section 5)

1. Never edit a file without seeing its current contents first.
2. **Always hand Juan the exact copy-paste command** (PowerShell `-LiteralPath` /
   absolute for files; SQL block for the editor) — never "send me the file" from
   memory. Querying the repo/DB layout is Claude's job, not Juan's recall.
3. COMPLETE drop-in files via download; Juan moves from `Downloads` (`[System.IO.
   File]::Copy` / `Move-Item -Force -LiteralPath`); distinct names when basenames
   collide.
4. `npm run build` before every push; failed builds don't deploy.
5. **Migrations editor-first:** run SQL in the dashboard editor (that's what
   changes the DB), THEN commit the `.sql`. Idempotent + sequentially numbered.
   Latest is **055**; next is 056.
6. **Reachability + secure firewall (sacred):** practice questions get
   `question_concepts`; lessons get `lesson_concepts` + `lesson_tasks` (via
   `wire-lessons.mjs`); SECURE questions get NEITHER concept link (a link would leak
   exam items into practice via `fetchConceptPractice`).
7. **NEW RULE — project lessons after authoring.** A lesson's frontmatter
   `concept_slugs`/`task_codes` MUST be projected into `lesson_concepts`/
   `lesson_tasks` via `wire-lessons.mjs`. A lesson with zero join rows is
   incomplete — its questions can't resolve review→lesson and the traceability
   matrix has a hole. (This was the bug that hit BOTH certs.)
8. **The exam dark-lever is `domains.weight_pct`, not `tasks.is_exam_scope`.**
9. **Recon away from `node_modules`.** **The shared `scripts\.env` sets
   `MAX_TASKS=9`** — override `$env:MAX_TASKS="0"` for a full generator run.
10. Scrum proper nouns + brand names never translated; nav labels localized INLINE
    off `useLocale()` (the `messages\*.json` snapshots are stale). Button variants:
    link|primary|accent|glass|outline|ghost|destructive (no "secondary").
11. Console dark; learner/marketing light. One PowerShell block per batch. Be
    decisive — recommend, don't menu. LF→CRLF warnings are harmless. Never suggest
    breaks.
12. **Honesty is the brand.** Audit-ready by design; never claim accreditation we
    don't hold. Where something is provisional (cut score, SME validation,
    localization), say so — that honesty is what makes the rest credible.
