# HANDOFF-v1.9 — ADDENDUM 4

Appends to HANDOFF-v1.9.md + addenda 1-3. Covers the home family-transparency
section, a batch of UI fixes, and — most importantly — a data-integrity
diagnosis + fix on SD-AI-I (migration 079). Read v1.9 + addenda 1-3 first.

---

## Commits since addendum-3

### Web repo (certidemy-web)
- **11bd186** — feat(home): family-driven transparency section (SM/SPO/SD tabs)
- **83995e2** — fix(ui): readable auth inputs + within-family cert order SM->SPO->SD
- (nav opacity fixes landed just before addendum-3's window closed: header pill
  + mobile menu solid-surface — see addendum-3 if not already captured there)

### Supabase repo (certidemy-supabase) — TIP NOW 079
- **9ee211d / migration 079** — fix SD-AI-I transparency samples (see below)

---

## What shipped

### Home FAMILY-DRIVEN transparency section (11bd186)
- The "See it before you trust it" section is now organized by FAMILY, not a
  single flagship exam. Header shows the family ("Certidemy Scrum") + the
  high-demand badge at the FAMILY level; SM/SPO/SD tabs let visitors cycle through
  the family's certs. Each tab swaps the exam-composition bars, the BlueprintDrawer,
  the role blurb, AND the live sample questions.
- Home page (server) now fetches all 3 Scrum certs (getCertByCode per code ->
  loadBlueprint each) and passes a `family`-shaped prop. Role blurbs reuse the
  trilingual family-content.ts. RETIRED the stale `FLAGSHIP_CODE = "sm-i"` ghost.
- `TransparencySection` is family-keyed and future-proof: adding Certidemy Project
  Management / Agile Frameworks later = pass a different family object, no
  structural change. (Juan's vision: eventually wrap multiple families with
  arrows / a 3D pass between families — the per-family internals are already built.)
- `<SampleQuestions key={active.code} .../>` forces a clean remount + refetch on
  tab change.

### UI fixes (83995e2)
- **Auth inputs were white-on-white on dark pages.** components/ui/input.tsx
  hardcoded `bg-white` + `text-[var(--color-foreground)]`; on the dark-theme auth
  pages, foreground ink is near-white -> invisible typed text. Fixed to
  `bg-[var(--color-surface-lift)]` + `text-[var(--color-ink)]` (readable in BOTH
  themes).
- **Within-family cert order SM->SPO->SD.** The three sort sites in
  lib/certifications/data.ts used `code.localeCompare` (alphabetical -> SD/SM/SPO).
  Added a CODE_ORDER role-rank helper (SM=0, SPO=1, SD=2) as the tiebreaker,
  applied at all 3 sort sites. Now catalog, family page, and transparency tabs
  all agree on role order.

### Migration 079 — SD-AI-I transparency samples fix (THE important one)
- **Symptom:** SD-AI-I's transparency tab showed exam bars + blueprint but NO
  sample questions, on both home + detail, logged in AND out.
- **Root cause:** SD-AI-I's practice-pool rows (pool='practice', is_exam_scope
  =false) were loaded with **visibility='secure'** instead of 'private'.
  SM-AI-I / SPO-AI-I practice rows are visibility='private' (with 18 = 6/lang
  flipped to 'public' for demos). Since get_public_samples needs
  visibility='public', SD-AI-I returned none.
- **Fix (079, editor-first then committed):** (1) normalize SD-AI-I practice rows
  visibility secure->private; (2) promote 6/language to 'public', one question
  from each of 6 distinct tasks, 2 AI-Era per language (matching SM/SPO's shape).
  Every statement guarded with `pool='practice' AND is_exam_scope=false` — the
  1,107 secure exam rows were physically excluded and verified UNCHANGED
  (369/lang x 3 = 1,107) after the run. Atomic (begin/commit), idempotent.
- **Verified post-run:** SD-AI-I now 454 private + 6 public + (secure untouched)
  per language; 2 AI-Era among the 6 public per language. SD tab renders.

---

## CRITICAL SCHEMA LESSON (write this down — it caused a scare)

**The practice/exam FIREWALL is `pool` + `is_exam_scope`, NOT `visibility`.**
- `pool` ∈ {practice, secure}; `is_exam_scope` boolean — THIS is the firewall.
  pool='secure'/is_exam_scope=true = the real certification exam. Never exposed
  except super-admin audit.
- `visibility` ∈ {secure, private, public} is a **display tier**, orthogonal to
  the firewall:
  - public  = the 6/lang promoted marketing demos (get_public_samples gates here)
  - private = practice-bank rows shown to learners
  - secure  = a DEFAULT/label that does NOT by itself mean "exam item"
- During diagnosis, conflating visibility='secure' with "exam pool" led to a
  WRONG conclusion ("SD-AI-I has no practice pool / promoting secure leaks the
  exam"). The truth: SD-AI-I HAD its full 1,380 practice + 1,107 secure all along
  (matching prior notes); only the practice rows' visibility LABEL was wrong.
- Rule going forward: when reasoning about exam safety, filter on
  `pool='practice' AND is_exam_scope=false` (safe to expose) vs `pool='secure'`
  (never). `create_practice_questions` writes pool='practice', is_exam_scope=false,
  and does NOT set visibility — so visibility defaults must be watched.

---

## Root-cause follow-up (NEW backlog — worth doing)
- **The SD-AI-I load pipeline set practice rows to visibility='secure'.** 079
  fixed the DATA, not the cause. Before building the NEXT cert, check the
  SD-AI-I load/generation path (load-lessons-direct / practice generation) for a
  visibility default that mislabels practice rows, so a future cert doesn't ship
  the same way. SM-AI-I/SPO-AI-I got 'private' correctly; SD-AI-I did not —
  find what differed.

---

## Backlog (updated)

### Pre-launch (unchanged)
- NEXT_PUBLIC_SITE_URL in Cloudflare Pages env (live og-preview domain).
- Legal placeholder fill + counsel review; full es/pt legal translations.

### Enhancements (non-blocking)
- Multi-family transparency wrapper (arrows / 3D pass between families) —
  per-family internals now exist; only the family-level cycler remains.
- Layer 2 DB-content i18n (cert description + cert_categories.tagline).
- pricing/page.tsx untranslated chrome.
- npm audit review (27 vulns).
- Per-credential rendered og:image.
- Additional families for the family-page + transparency systems (only `scrum`
  has editorial content today).

### Carried
- Transactional email (SMTP + SPF/DKIM); is_published->status RLS cutover +
  CERT-LIFECYCLE.md; GAIPC DB stub decision; SPO concept audit; Credly;
  governance tab; PDF expert review; Scrum II JTAs (coming-soon first, do NOT
  build the II generator); WCAG mode.

---

## Workflow note (adopted this run)
- **Downloads hygiene:** apply blocks now DELETE the Downloads copy after placing
  a file in the repo (kills the `(1)` re-download trap at the source). EXCEPTION:
  HANDOFF docs and anything to be uploaded to the project directory or re-presented
  are NOT auto-deleted.
- **present_files is required** for the user to download — writing to scratch
  isn't enough (missed once this run).
- **Indentation-exact anchors:** node-script edits keep failing on 2-space indent
  mismatches; the `'{0,4}|{1}|'` whitespace-bracketed dump is the diagnostic, and
  unique-inner-substring anchors beat whole-block anchors.

---

## UPDATE — root cause RESOLVED (migration 080)

The "root-cause follow-up" flagged above is now DONE.

- **Cause confirmed:** `quiz_questions.visibility` has a column default of `'secure'`
  (migration 058, deny-by-default — a SAFE default). `create_practice_questions`
  inserted practice rows WITHOUT setting visibility, so they inherited `'secure'`.
  SM-AI-I / SPO-AI-I only became `'private'` because 058's one-time backfill ran
  after their practice rows existed; SD-AI-I's practice rows were generated later
  and never got that backfill. (Secure path, gen-cert-secure.mjs, also omits
  visibility but that's accidentally correct — secure rows SHOULD be 'secure'.)
- **Fix (migration 080, editor-first + committed 8c11847):** `CREATE OR REPLACE`
  of create_practice_questions, byte-identical except two added lines — it now
  inserts `visibility='private'` explicitly. The column default STAYS 'secure'
  (deny-by-default preserved); the practice write path is now explicit rather
  than inheriting. Live-verified: sets_private=true.
- **Guardrail (in 080 footer, run anytime / after building a new cert):**
    select c.code, count(*) from public.quiz_questions q
    join public.certifications c on c.id = q.certification_id
    where q.pool='practice' and q.is_exam_scope=false and q.visibility='secure'
    group by c.code;
  Expect 0 rows. Post-080 it returns empty across all certs.

Migrations tip: **080**. next: 081.
