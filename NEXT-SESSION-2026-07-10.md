# NEXT SESSION — start here (session of July 10, 2026)

Drop this into a fresh chat alongside `NEXT-SESSION-PROMPT.md` and the master operating
docs. It captures everything decided in the July 10 session so nothing is reconstructed
from memory.

**Read these committed docs first (they are the source of truth):**
- `AIE-I_JTA_v1_1.md` (supabase repo) — locked JTA for the new AI Essentials cert.
- `CATALOG-DISCOVERY-SPEC.md` (supabase repo) — the advisor + navigator UX design.
- `CERT-CREATION.md` (supabase repo) — the 12-stage pipeline every cert follows.

---

## What shipped this session (all committed)

1. **AIGRM-I finished & trilingual.** es-419 + pt-BR lesson translations (49 each)
   authored, loaded, verified (`b75fcca`); SCHEME-AIGRM-I.md committed with real
   cue-audit numbers (`46f4d93`); CERT-CREATION.md Stage 8.5 encoding-integrity section
   added (`e195fb9`). AIGRM-I is at `coming_soon`, fully trilingual across lessons /
   practice (490/lang) / secure (392/lang). Build is done; remaining = human/accreditation
   only (SME panel, standard-setting, operational records).

2. **NEW CERT: AI Essentials I (AIE-I) — JTA locked v1.1** (`4fe12bd`).
   - Freemium top-of-funnel AI-literacy cert for non-technical professionals (HR,
     marketing, sales, ops, finance, leadership, education).
   - Grok-reviewed 9.4/10, no coverage gaps, no changes needed beyond two minor tweaks
     (both applied).
   - **New family:** "AI Essentials" (AIE-I is founding member, like AIGRM-I founded
     "governance").
   - **Exam:** 25 questions / 30 min / 80% pass / 3 domains / ~47 concepts / 16 tasks.
     Bloom 44/40/16 (Remember/Understand/Apply), ceiling at 3 (literacy tier).
   - **Domains:** D1 AI Concepts & Landscape (40%, 10q, 6 tasks) · D2 Working with
     Generative AI (36%, 9q, 6 tasks) · D3 Responsible & Safe Use at Work (24%, 6q, 4 tasks).
   - **Pricing model:** free to study + sit exam; small fee ($19-29) only to mint the
     verifiable badge. 2-year validity both tiers.
   - **Commercial weapon:** EU AI Act Article 4 (live legal literacy mandate, enforcement
     from 2 Aug 2026) → AIE-I is positioned as per-individual, verifiable, audit-ready
     Article 4 *evidence*. Approved marketing language pinned in the JTA (never "guarantees
     compliance" / "certified under Article 4").
   - **Level II planned:** CAIP-I ("Certified AI Practitioner/Professional I") — applied
     fluency tier. "Professional/Practitioner" reserved for Level II; AIE-I doesn't overclaim.
   - **Build advantage:** most of the language already exists in AIGRM-I Module 1 — this
     is the fastest cert to author.

3. **Catalog discovery UX designed & spec'd** (`CATALOG-DISCOVERY-SPEC.md`, `9b5678a`).
   Two features, prototyped in the visualizer (no Certidemy code written yet):
   - **AI Path Advisor ("prompt-to-path")** — user describes their goal in natural
     language, Claude reasons over the live cert catalog, returns a ranked personalized
     path with a "why this fits you" per cert, rendered as a **guided lit trail through a
     neural field** (walks node-by-node revealing each why). Hero-page centerpiece + slim
     entry point on certifications page.
   - **Neural Network Navigator** — the catalog browser (family → role → level, signals
     fire left-to-right). Replaces the sun-and-orbit as primary browse (calmer, clearer,
     visually rhymes with the advisor). Certifications-page main event.
   - **Sun-and-orbit selector** — fully designed but PARKED as a future marketing/hero
     flourish, NOT catalog nav.
   - Architecture, guardrails (advisor is JSON-only, locked prompt, rate-limited — cannot
     be used as a general chatbot), caching, cost model, and DB-driven rule all in the spec.

---

## Immediate next step: BUILD AIE-I (pipeline per CERT-CREATION.md)

The JTA is locked. Next is scaffold → lessons → banks → translate → scheme → coming_soon.
Same arc as AIGRM-I. In order:

1. **Confirm migration tip.** AIGRM-I scaffold used migrations 084/085. Check the current
   tip in the supabase repo before creating new migrations (`075` was noted earlier; the
   DB is canonical — verify).
2. **Scaffold migrations** (editor-first, then commit the .sql as the versioned record):
   - New `cert_category` = "ai-essentials" (the founding family).
   - New `certifications` row: AIE-I, 25q / 80% / 30min, `status='draft'`.
   - 3 domains with weights D1 40 / D2 36 / D3 24 (weight_pct; sum 100).
   - 16 tasks (6/6/4) per the JTA task codes (1.1-1.6, 2.1-2.6, 3.1-3.4).
   - ~47 concepts + task_concept links (concept slugs listed in the JTA; **keep
     `human-in-the-loop` and `accountability` bound to Task 3.3**).
3. **Author lessons** (LESSON_AUTHORING_SPEC + LESSON_STYLE_GUIDE). Reuse AIGRM-I Module 1
   language where it fits (what AI is, model types, responsible-use basics). Author clean
   (ASCII/clean-UTF8 — no mojibake; load only via API loaders). Wire → prove coverage
   (`v_coverage_summary`, bar = untaught_testing_violations = 0).
4. **Secure bank** (`gen-cert-secure.mjs`, env CERT_ID, SECURE_PER_TASK ≥8, firewall by
   construction — zero question_concepts on secure).
5. **Practice bank** (`backfill-practice.mjs`, FLOOR=10/task/lang, concept-linked).
6. **Translate** es-419 + pt-BR (`translate-lessons.mjs` → `load-lessons-direct.mjs
   --lang`, ABSOLUTE web path). Smoke-test one dense lesson first; `%â€%` check after.
7. **SCHEME-AIE-I.md** (from SCHEME-SD-AI-I.md template; real cue-audit numbers baked in).
8. **Flip `draft` → `coming_soon`.**
9. **Product-specific (new for this cert):** the free-to-take / paid-badge flow, and the
   new "AI Essentials" family surfaced in the catalog.

---

## Also parked / on the horizon (not blocking)
- **Discovery UX real build** — advisor edge function (Supabase, key server-side, locked
  prompt, JSON-only, rate-limit, cache) + neural navigator component (DB-driven, edge
  runtime, force-dynamic, reduced-motion, mobile fallback, no Three.js). Full plan in
  `CATALOG-DISCOVERY-SPEC.md`. Reference physics: `components/dashboard/module-journey.tsx`.
- **CAIP-I** (AI Essentials Level II) — applied-fluency JTA, when AIE-I is shipped.
- **Scrum II certs** — JTA authoring; II-level needs best-of-four-plausible answer model
  (generator rewrite required first).
- **Toolchain encoding cleanup** — `module-journey.tsx` + `translate-lessons.mjs` source
  files contain mojibake in strings/comments (non-blocking, flagged).
- **Pre-launch cleanup** — Acme Test Co + Hearing Co test companies; SD-AI-I test credential.

---

## Working reminders (unchanged, but load-bearing)
- Two repos: `certidemy-web` (Next.js, Cloudflare edge) + `supabase` (folder literally
  `supabase\`, ref `pctynukndxnmnxiqpgck`). Commit each separately.
- Files must be physically copied from Downloads → repo folder before git tracks them
  (Claude project uploads are not repo files). `-LiteralPath` for bracketed paths.
- Editor-first migrations (SQL runs live in Supabase dashboard; commit .sql as record).
- `npm run build` green before any web push. Author clean (no mojibake). No Three.js.
- Cert creation stays human; JTA gets external AI (Grok) review before content pipeline.
- Claude drives technical decisions decisively; Juan steers strategy.
