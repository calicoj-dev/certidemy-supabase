# Quiz-Item Access Control & Visibility Model — Remediation & Architecture Memo

_Certidemy / CertiGlobal — 2026-06-29. Companion to `ITEM-CUE-REMEDIATION-REPORT.md`._
_Status: implemented, verified, in production. Pre-launch (zero real candidates at time of fix)._

This memo is written to the same standard as the item-cue remediation report: a
finding, the corrective action, and the evidence that the action held. It is
intended as ISO/IEC 17024-framework evidence for **assessment-content
confidentiality and access control**, and as the architectural reference for how
quiz items are exposed (or not) across the platform.

---

## 1. Summary

During work to make the public marketing "sample question" widget multilingual, a
review of the `quiz_questions` row-level security (RLS) revealed that **the entire
secure examination pool — questions and their answer keys — was readable by any
anonymous caller** through the public API. The application-layer firewall that
keeps exam items out of the learning surface had **no enforcement at the database
layer**.

The hole was closed with a **default-deny, tiered visibility model** (migration
058), a controlled **public-sample publication** of twelve hand-picked practice
items (migration 059), and a **gated read function** that serves only those public
samples to the browser (migration 060). After remediation: anonymous callers can
read **only** the twelve published demo items; the secure exam pool and all answer
keys are unreadable by any client role.

**Blast radius:** none. The platform was pre-launch with zero issued real
credentials and a single internal test credential. No examination had been sat; no
candidate could have exploited the exposure. This was a content/configuration
remediation, not a breach.

---

## 2. The finding

`quiz_questions` carried, simultaneously:

- a permissive RLS policy `catalog read quiz_questions` — `SELECT` for role
  `public` with `USING (true)` (every row readable); and
- raw table-level `GRANT SELECT` to both `anon` and `authenticated`.

With both layers open, `SELECT * FROM quiz_questions` returned **every** row —
including `pool='secure'` items and their `correct_answer` — to an unauthenticated
caller. The secure/practice separation existed only as an application convention
("never link secure items into `question_concepts`"); it was not enforced by the
database.

Severity: **launch-blocking.** A certification whose exam items and answer keys are
publicly scrapeable cannot issue a credible credential.

---

## 3. The architecture (tiered visibility, default-deny)

The remediation introduces an explicit **`visibility`** column on
`quiz_questions`. Access is decided by tier; the default is deny.

| Tier        | Column value | Who may read (client) | Use                                                  |
|-------------|--------------|-----------------------|------------------------------------------------------|
| **secure**  | `'secure'`   | **no client role**    | the live certification exam; service role only       |
| **private** | `'private'`  | authenticated only    | the practice / learning engine                       |
| **public**  | `'public'`   | anyone (incl. anon)   | the handful of marketing sample items                |

Design principles, each chosen deliberately:

- **Default-deny.** The column defaults to `'secure'` and is `NOT NULL` with a
  `CHECK` constraint. Any future row that forgets to set a tier is invisible to all
  client roles until explicitly opened — the safe failure direction.
- **`visibility` is separate from `pool`.** `pool` records *what kind of item this
  is* (secure vs practice); `visibility` records *who may see it*. Keeping them
  separate lets a few practice items be published as public samples **without
  leaving the practice pool** or disturbing the learning engine.
- **Answer key is server-only, always.** `correct_answer` is removed from the
  client roles' grants entirely (column-scoped grant — see §4). No client role can
  read it from the table under any tier, including public. The exam scorer and
  generators read it through the **service role**, which bypasses RLS and is used
  only inside Edge Functions; it is never imported into the browser.
- **Tiers, not a boolean — for the LMS future.** Modelling visibility as ordered
  tiers (rather than a public/not-public flag) means a future LMS / partner
  integration is "issue a credential at the secure tier," not a re-architecture. A
  partner reads the secure pool through a privileged credential; the public web
  never can.

---

## 4. The corrective actions (three migrations, editor-first)

All three were run in the Supabase SQL editor against the live database, then
committed as versioned records. They are idempotent and individually reversible.

### Migration 058 — `058_quiz_questions_visibility_lockdown.sql`
The lockdown.
- Adds `visibility` (`NOT NULL`, default `'secure'`, `CHECK in ('public','private','secure')`, indexed). Backfills existing rows: `pool='secure' → 'secure'`, `pool='practice' → 'private'`.
- Drops the permissive `catalog read quiz_questions` policy and the table-wide `SELECT` grants to `anon` / `authenticated`.
- Re-grants `SELECT` **column-scoped to every column except `correct_answer`** — a column-list grant, *not* a table grant minus a column. (A table-wide `GRANT SELECT` re-confers every column and silently overrides a column-level `REVOKE`; the column-scoped grant is the correct construction. This subtlety was caught and corrected during the work — see §5, check (d).)
- Adds two row policies: `quiz public read` (`visibility='public'` → anon + authenticated) and `quiz private read` (`visibility in ('public','private')` → authenticated). The secure tier matches no client policy and is therefore unreadable by any client role. Admin write (`is_platform_admin()`) is untouched.

### Migration 059 — `059_publish_sample_questions.sql`
The publication. Flips **twelve hand-picked practice question-groups** to
`visibility='public'` (≈36 rows across en / es-419 / pt-BR). The twelve are **3
AI-Era + 3 core per certification**, each selected with the **same AI-Era
task-detection logic that drives the blueprint badge** (a task is AI-Era if its
concepts match the canonical AI term-set). Only `visibility` changes; the rows stay
`pool='practice'`. Reversible (set back to `'private'`).

### Migration 060 — `060_get_public_samples_fn.sql`
The gated read path. A `SECURITY DEFINER` function
`get_public_samples(p_code text, p_lang text)` that returns sample rows **only where
`visibility='public'`**, for a published cert, in the requested language — including
`correct_answer` (the marketing card reveals the answer + explanation on click) and
a **derived `is_ai_era`** flag (computed in SQL from the same concept term-set, not
stored) and concept slugs. Because the function is hard-bounded to public rows, it
can never surface a secure or private answer. The table-wide `correct_answer` revoke
from 058 is left fully intact; this function is the *only* route by which any answer
key reaches the browser, and it serves exactly the twelve public demo items.
`EXECUTE` granted to `anon` + `authenticated`; all else revoked.

---

## 5. Verification evidence

Run in the SQL editor at each step. (`set role` in the editor reports a column
denial at table granularity — "permission denied for table" — which is the
expected success signal for the answer-key checks, confirmed against the
column-grant audit.)

**After 058 (lockdown):**
- Tier counts: `private`/`practice` = 2855; `secure`/`secure` = 2280.
- As `anon`: visible rows = **0** (nothing public yet — correct).
- As `authenticated`: secure rows seen = **0**; private rows seen = **2855**.
- Column-grant audit: `correct_answer` **absent** from both `anon` and
  `authenticated` grants; all 17 other columns present.
- Live in-app practice quizzes confirmed still working (engine grades via service
  role — unaffected).

**After 059 (publish):**
- `visibility='public'` counts: **SM-AI-I 6/6/6, SPO-AI-I 6/6/6** (en/es-419/pt-BR).
- As `anon`: `group by visibility` returns only **`public | 36`** — nothing else.

**After 060 (gated read):**
- `get_public_samples('SM-AI-I','en')` → 6 rows, exactly **3 with `is_ai_era=true`**, concept slugs populated.
- As `anon`: `get_public_samples('SPO-AI-I','es-419')` → **items 6, ai 3**.
- As `anon`: direct `select correct_answer from quiz_questions` → **permission denied** (revoke intact).
- Live: marketing sample widget renders real questions, grades on click, and
  **switches language with the locale** (the originating defect).

---

## 6. The public-sample feature (what the change also delivered)

The marketing "sample question" widget was previously a hardcoded English-only
React array — which is why switching language never changed the questions. It is now
DB-driven: the client component (`components/marketing/sample-questions.tsx`) calls
`get_public_samples(certCode, locale)` and renders real practice items in the active
language, with the AI-Era badge **derived** from the returned flag (never stored).
The feature is the safe public carve-out of the same access-control model that
closes the finding — the demo is open, the exam is closed, nothing in between leaks.

---

## 7. File / path inventory

**Supabase repo (`supabase/`):**
- `migrations/058_quiz_questions_visibility_lockdown.sql` — the lockdown (new).
- `migrations/059_publish_sample_questions.sql` — publish 12 sample groups (new).
- `migrations/060_get_public_samples_fn.sql` — `get_public_samples()` rpc (new).
- `ITEM-CUE-REMEDIATION-REPORT.md` — sibling audit artifact (prior session).
- `QUIZ-VISIBILITY-SECURITY-MEMO.md` — this memo.

**Web repo (`certidemy-web/`):**
- `components/marketing/sample-questions.tsx` — rewritten DB-driven + multilingual.
- (unchanged, relevant) `app/[locale]/(marketing)/certifications/[code]/page.tsx`
  and `components/marketing/transparency-section.tsx` — the two `SampleQuestions`
  call sites; deliberately **not** modified (component keeps its `certCode` prop and
  self-fetches, so both server- and client-rendered call sites work unchanged).
- (unchanged, relevant) `lib/supabase/server.ts` / `browser.ts` — both use the anon
  key; RLS enforces access. The service-role key lives only in Edge Functions.

**Edge Functions (unchanged, confirmed unaffected):**
- `supabase/functions/submit-quiz-answer/index.ts` — grades via `getServiceClient()`
  (service role), so the client-role lockdown does not affect grading, mastery, or
  FSRS.

---

## 8. Known limitations (pre-disclosed)

- **Blueprint / JTA localization.** The `domains` and `tasks` tables store domain
  titles and task statements as single English strings (no `language` dimension);
  `loadBlueprint` is locale-agnostic. The Job-Task Analysis therefore displays in
  English on **both** the in-app Blueprint screen and the public cert-detail drawer,
  even under es-419 / pt-BR. (Lessons, practice items, exam items, and UI chrome are
  localized; the JTA is not yet.) Fix is a bounded content + schema + loader project,
  scheduled with the trilingual lesson pass — not a security issue.
- **SME review & psychometric validation** remain pending (as stated in the cue
  remediation report). The residual semantic answer-cue is SME-review territory.

---

## 9. Mapping to ISO/IEC 17024 framework

- **Confidentiality of examination materials** — secure items and answer keys are
  now unreadable by any client role; access is default-deny and enforced at the data
  layer, not by application convention. Evidence: §5.
- **Separation of preparation and certification** — the practice (learning) tier and
  the secure (exam) tier are distinct `visibility` tiers with distinct read rules;
  public demo items are a third, explicitly-published tier.
- **Corrective action on a detected control gap** — finding, action, and verifying
  evidence are recorded here in the same form as the prior cue-remediation report.
- **Honesty of disclosure** — known limitations (§8) are recorded rather than
  omitted.

_End of memo._
