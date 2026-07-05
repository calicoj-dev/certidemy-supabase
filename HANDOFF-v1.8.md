# HANDOFF-v1.8

**Session theme:** a cleanup + hardening session. Shipped the earned-credential
seal (Fix F), closed a class of RLS-vs-grant bugs, built the missing voucher
signup-claim, fully remediated SM-AI-I's coverage + task-code traceability, and
fixed the 404 entity bug. Also captured a substantial STRATEGIC DIRECTION from
Juan (governance tab, Scrum II, PDF expert-review, cert roadmap, near-term UX) —
see Section 6, which is the forward-looking heart of this handoff.

> **Before doing anything, read `PIPELINE-INDEX.md`** (the read-first activity
> map + where-everything-lives + operational gotchas + working style). This
> handoff is the session snapshot; the index is the durable map. Supersedes v1.7.

---

## 1. What shipped this session (all committed + pushed)

### Fix F — earned-credential seal on the learner dashboard (DONE)
- Compact tokenized "Verified credential" seal beside the dashboard greeting,
  cert-scoped to the credential for the cert in the URL, linking to /verify/{id}.
  Renders nothing (no layout shift) when the viewer holds no active credential.
- Files: NEW `lib/credentials/data.ts` (`loadEarnedCredential`, owner-RLS direct
  read), NEW `components/dashboard/credential-seal.tsx`, dashboard `page.tsx`
  header -> flex row, i18n `dashboard.credentialSealEyebrow`
  (`scripts/i18n-credential-seal.mjs`). Web commit 632f60c.
- CORRECTION to prior handoffs: there is NO per-credential og renderer. The
  verify page's og:image is a STATIC `/og/credential-fallback.png`; the
  per-credential renderer is unbuilt (a real backlog item). Do not chase it.

### The grant sweep — RLS != grant (migrations 070, 071)
- Seal detection hit `42501 permission denied for table credentials`: the
  `authenticated` role had an owner RLS policy but NO table grant. RLS filters
  rows; the grant lets the role touch the table at all, and is checked BEFORE
  RLS. Missing grant on a direct authed query = silent failure (swallowed by
  failure-tolerant loaders).
- **070**: column-scoped GRANT SELECT on `credentials` to authenticated
  (`score_pct` excluded — it's on a public-reachable path).
- **071**: full GRANT SELECT on `mock_exam_results` (owner-only table; this was
  ALSO silently dark — the dashboard's exam-history section had been returning
  empty for authed users). Found via a full sweep of every table the web app
  reads via direct authed query; all others were already granted, and the ~14
  ungranted tables are edge-function-only (service role) and correctly deny-by-default.

### Voucher signup-claim — the missing trigger (migration 072 + assign-voucher edit)
- `assign-voucher` wrote `assigned_email` with `assigned_user_id` NULL, intending
  it "bound at signup by the claim trigger" (per its own comment) — but that claim
  trigger was NEVER BUILT. Two holes, both now closed:
  - **072**: extended `handle_new_user()` (the existing `on_auth_user_created`
    trigger) to claim pending vouchers by matching email at signup (best-effort,
    wrapped so it never blocks signup). Covers invite-first -> sign-up-later.
  - **assign-voucher edit**: resolve email -> existing profile before minting; set
    `assigned_user_id` inline when the user already exists (the trigger only fires
    for FUTURE signups). Covers the already-registered ordering.
- No live orphans needed backfilling (single-user DB). Both repos committed.

### SM-AI-I full remediation (migrations 073, 074, 075) — the flagship is now CLEAN
Coverage `v_coverage_tested_not_taught` went 7 -> 0, and `wire-lessons` now runs
with ZERO unresolved task codes. Every fix was auditor-defensible (see Section 5
for the discipline). Breakdown of the original 7 tested-not-taught violations:
- **Tag taught concepts** (frontmatter): `iterative-incremental` -> 01-01;
  `daily-scrum-status-report`/`review-as-demo`/`retro-blame-game` -> their event
  lessons (03-03/04/05). Confirmed against lesson BODIES before tagging.
- **Author lean-thinking**: real `::concept` block added to 01-02, scoped exactly
  to the 8 tested items (waste = non-value-adding effort; WIP/flow; deferred
  commitment; iterative vs incremental). It was genuinely untaught, so we taught
  it rather than mis-tag.
- **073**: retire duplicate concept `sm-accountabilities` (0 lessons) into the
  taught canonical `sm-accountability-team-effectiveness` — repoint 58 question +
  2 task links, delete orphan (conflict-safe).
- **074**: retire redundant umbrella `sprint-events` (0 lessons, 60 questions).
  Verified beforehand every question retained a taught link (sprint/
  sprint-container/timeboxes) — so dropped the umbrella links, no repoint needed.
- **075**: fix Module 06 stale task_codes 6.1-6.7 (pre-remap orphans; no 6.x
  tasks exist) -> correct domain-1..5 codes, via exact ASCII substring replace in
  `content_md` for all 3 languages (disk was clean; es/pt live only in the DB).

### 404 entity bug (DONE)
- `not-found.tsx` line 30's "Let's get you back..." is a JS ternary branch (not
  JSX text), so `&rsquo;` rendered literally. Swapped for a real U+2019. The other
  `&rsquo;`/`&amp;` occurrences ARE JSX text nodes and render correctly — left. 632f60c..dcdc67f.

### NEW tooling + the pipeline lesson (the session's most reusable output)
- **`scripts/update-lesson-content.mjs`** (NEW, supabase repo) — in-place
  `content_md` updater. Closes a real pipeline gap: `load-lessons-direct.mjs`
  only INSERTS (skips existing), so editing a lesson's frontmatter on disk never
  reached the DB, and `wire-lessons.mjs` parses `content_md` from the DB, NOT
  disk. API-write (no SQL-paste corruption), narrow by explicit `--file`, updates
  only content_md/title/minutes, dry-run-first.
- **THE PIPELINE ORDER (memorize):** edit lesson on disk ->
  `update-lesson-content.mjs` (disk -> DB content_md) -> `wire-lessons.mjs`
  (DB content_md -> join tables). Skipping the middle step is why an entire
  debugging detour happened this session. `load-lessons-direct.mjs` is for NEW
  lessons only.

---

## 2. Current state

- **SM-AI-I:** FULLY CLEAN. Coverage 0 tested-not-taught, 0 unresolved task codes,
  147 lesson_task links. Concept inventory de-duplicated. The flagship's
  traceability matrix is complete. `status='available'`.
- **SPO-AI-I, SD-AI-I:** `available`, content-complete. (SPO-AI-I concept
  reconciliation NOT audited this session — see backlog; SM was the priority.)
- **All three certs:** 80Q / 80% / single-best-answer. Uniform on everything
  17024 measures. SM-AI-I's internal quirks (smpc folder name, mixed translation
  layout) are age, not scheme inconsistency — do NOT cosmetically homogenize.
- **Vouchers:** claim path now complete (both orderings). Pre-launch, single user.
- **Migrations tip: 075.** Next is 076.

---

## 3. IMMEDIATE NEXT TASK — Juan's call (steering), recommended sequencing below

No single task is pre-assigned; Juan is steering the roadmap (Section 6). The
recommended near-term order, decisive co-builder's view:

1. **Near-term UX bugs (concrete, launch-relevant)** — see Section 6E. The
   cert-page es/PT translation gap and the logged-out AI-Era-tag bug both hurt the
   LATAM evaluation experience; the signup/login page is visibly dated. These are
   bounded and shippable.
2. **Scrum II JTAs** — the collaborative writing loop (Claude writes -> Grok
   reviews -> refine -> upload as coming_soon). Big, but leave generators alone
   (Section 6B explains why II-level needs a DISTINCT item model — do not build it
   yet).
3. **Governance tab / PDF expert-review** — larger builds, sequenced after the
   above (Section 6A/6C).

Confirm with Juan which thread to pull; don't assume.

---

## 4. Backlog — HONEST status

### Launch-critical / near-term
- **Signup/login page overhaul** — shows old GAIPC cert as coming_soon, dated
  (pre-color-scheme) styling, Google connect link possibly broken, only does basic
  signup/login. Ties into the GAIPC-stub cleanup.
- **Certifications page not translating to es-419/pt-BR** — LATAM-target market,
  real gap.
- **AI-Era magenta tag hidden when logged-out** — in the task drawers on BOTH the
  main hero page and the certifications page, the AI-Era tag only appears when
  logged in. Marketing pages must show the differentiator to everyone. Likely a
  gated read/auth-conditional render.

### Cert lifecycle hardening (carried from v1.7)
- RLS policies still keyed off `is_published` (057, 060, retire 068 bridge) ->
  migrate to `status`. Then drop `is_published`. Write `CERT-LIFECYCLE.md`.

### Coverage / concept hygiene
- **SPO-AI-I concept audit** — SM-AI-I had duplicate/umbrella concepts (twins,
  orphans). SPO likely has the same class; run the same `v_coverage_tested_not_taught`
  + concept-duplication check and reconcile identically. NOT done this session.
- **SM-AI-I translation-layout normalization** — SM's translations are
  mixed (per-module es-419/pt-BR dirs for modules 01-02 on disk, module 06
  DB-only, no `_i18n/`). Not audit-blocking (translations exist + correct in DB),
  but SM won't respond to the standard `translate-lessons.mjs` bulk tool.
  Housekeeping.
- **Practice-pool backfill** — a dozen SM/SPO tasks sit at 9/lang (one at 8),
  just under the 10 floor. `backfill-practice.mjs` scoped to those tasks.
  (SD-AI-I is fine.) Under-floor task lists were captured this session.

### Data cleanups
- **GAIPC stub -> own-code cert** (CertiProf residue; also surfaces on signup page).
- **SD-AI-I `name`** still has "Certidemy " prefix while SM/SPO dropped it.

### UX / polish / compliance
- **WCAG accessibility mode** (LATER) — a toggle in course material that renders
  everything as plain text for WCAG compliance. Juan: "much later... would make
  things ugly but comply." Tail-end item.
- **mark-redeemed-on-any-completed-cert-exam** (Fix A edge case).

---

## 5. Auditor-defensible remediation discipline (why the SM-AI-I fixes were done this way)

The recurring principle this session, worth internalizing for all coverage work:
- **A "tested-not-taught" violation is usually a MISSING LINK, not missing
  content.** Check whether the concept is genuinely untaught vs. just unlinked
  before doing anything.
- **Tag against the lesson BODY, not the title.** Read the prose; confirm the
  concept is really taught there. Tagging a concept to a lesson that doesn't
  substantiate it is coverage-gaming an auditor would catch.
- **De-duplicate the concept inventory; don't mask it.** When two concept rows
  are the same idea, retire the redundant one (repoint its links to the canonical,
  conflict-safe) rather than adding a second lesson tag. Duplicate concepts are
  themselves an audit finding.
- **Content flows JTA -> lesson -> item, never item -> lesson.** If items test
  something untaught, first check the items are valid/in-scope, THEN author a
  lesson calibrated to what's tested (not the reverse).
- **Verify by count/behavior against the live view, not by "the script ran."**
  A wire that parses links but doesn't move the coverage view means the DB content
  it read is stale (the content_md-vs-disk trap).

---

## 6. STRATEGIC DIRECTION (Juan's vision — the forward roadmap)

### 6A. Super-admin GOVERNANCE TAB (the 17024 one-stop repository) — BIG BUILD
Vision: a single super-admin surface where the team (and, on request, an auditor)
can see and EXPORT everything ISO/IEC 17024 needs, without scouring repos:
telemetry data, governance documentation, schema + architecture diagrams, the
coverage/traceability matrices, JTA versions, audit logs — all laid out and
sendable.
- **Architectural note (Claude):** most of this is a READ/BI layer over data that
  already exists (coverage views, jta_versions, exam_attempts telemetry,
  admin_actions, SCHEME docs). Feed tables already specced in SCHEME-SD-AI-I §12 /
  LESSON-PIPELINE §6. The genuinely NEW work: (1) schema/architecture DIAGRAMS
  (not in the DB — author them, ideally auto-generated from the live schema so
  they never drift), and (2) EXPORT/SEND — a per-artifact PDF/report generator.
- Lives with the audit logs in the super-admin console.

### 6B. Scrum II exams — write the 3 JTAs now, leave COMING_SOON, DO NOT build generators yet
- Plan: Claude writes each JTA one-by-one -> Grok Expert reviews -> refine ->
  upload -> set `status='coming_soon'`.
- **CRITICAL technical insight (Juan, confirmed by Claude):** I-level items are
  "one CORRECT of 4." II-level items are "the BEST of 4 PLAUSIBLE" (situational
  judgment). This is a DISTINCT item model and REQUIRES generator changes before
  any II questions can be built:
  - The cue-guard INVERTS: today it ensures the key isn't surface-distinguishable
    (longest/most-absolute) because wrong answers are obviously wrong. For II, all
    four must be surface-equivalent and DEFENSIBLE; correctness turns on judgment,
    not recall. "Is the key distinguishable" is the wrong test.
  - The JTA must target HIGHER BLOOM (analyze/evaluate, 4-5) — ties to the
    existing `tasks.is_simulation_candidate` flag.
  - Therefore: JTAs first (human authoring), coming_soon, and the II-item
    generator is its OWN later project — not "same pipeline, harder questions."

### 6C. PDF export for expert review — build it, with controlled-disclosure discipline
- Super-admin button that generates PDFs of practice + secure exams and answers,
  so external experts (Grok Expert, ChatGPT paid) can review item QUALITY before
  launch — right now the items exist only in the DB.
- **Secure PDF:** de-branded (marked CONFIDENTIAL, no Certidemy marks — reduces
  linkability if leaked) + an AUDIT TRACKER: who solicited it + a purpose/notes
  section. Practice PDF: fine to show normally (branded OK).
- **Claude's expert caveat (honest, not a blocker):** this is legitimate
  17024 controlled-disclosure, and the review value is high. BUT once a secure
  item leaves as a PDF to a third-party LLM, exposure expands (paid-plan
  retention/training terms vary). So the control must: (1) log external-AI-review
  as a disclosure EVENT in the audit tracker, and (2) rotate/refresh any item that
  later proves compromised. Acceptable trade pre-launch with that discipline.

### 6D. Cert roadmap — CANDIDATE research (not commitments)
Grok-sourced scan of high-demand AI-era certs, logged as inputs to the human
cert-creation pipeline (JTA -> external-AI review -> lock -> build), NOT decided:
- **Scrum family (core):** SM-I, SPO-I, SD-AI-I (built); Agile Coach/Scaling I (future).
- **Project Management:** Associate PM I - AI (CAPM/entry-PMP analog); PM
  Foundations I - AI; AI-Enabled Project Leadership (mid).
- **IT Service Management:** AI Service Management I (ITIL v5 launched Feb 2026,
  explicitly AI-native — strong timing); AI Governance for Service Management.
- **Cybersecurity (highest demand):** Cybersecurity Foundations I (Security+
  analog); Ethical Hacking/Offensive Security I (CEH analog); AI Security
  Practitioner (fastest-growing niche); Secure AI Development.
- **Cloud:** Cloud Foundations I; Cloud Practitioner - AI Augmented; AI on Cloud.
- **DevOps/Platform:** DevOps Foundations I; Platform Engineering with AI.
- **AI-specific:** AI Governance Professional I; AI-Augmented Business Professional.
- Grok's suggested phase order: finish Scrum -> PM -> AISM (ITIL v5 timing) ->
  Cybersecurity+AI Security -> Cloud -> AI Governance.
- Standout picks per Claude: ITIL-v5/AISM (timing) and AI-Security (niche value).
- Reminder: these are RESEARCH. Cert creation stays human. A cert-roadmap-intake
  super-admin list (name+code+rationale, NOT a generator) was already specced as a
  planning backlog.

### 6E. Near-term UX bugs (concrete — see also Section 4)
- Signup/login page overhaul (GAIPC listed, dated styling, Google connect,
  minimal function).
- Certifications page es-419/pt-BR translation gap.
- AI-Era magenta tag hidden when logged-out (hero + certifications drawers).
- WCAG plain-text course mode (much later).

---

## 7. Migrations this session (versioned records in supabase/migrations)
- 070 credentials authenticated-select grant
- 071 mock_exam_results authenticated-select grant
- 072 handle_new_user claim vouchers (signup claim trigger)
- 073 retire sm-accountabilities duplicate concept
- 074 retire sprint-events umbrella concept
- 075 fix Module 06 stale task_codes

## 8. Meta-lesson
Two recurring wins this session: (1) reading the script/schema BEFORE running it
caught real traps (the wire's default cert, the loader's insert-only skip, the
content_md-vs-disk source) — every detour traced to a step we ran on assumption.
(2) The auditor's lens ("what would a certification body want," not "what's
convenient") produced better fixes than the quick ones — de-duplicating the
concept inventory instead of masking it is the clearest example. Keep both habits.
Keep the docs fed: every new repeatable procedure gets a doc + an index row.
