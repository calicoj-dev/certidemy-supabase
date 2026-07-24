> ## FOUNDING VISION DOCUMENT - PARTLY SUPERSEDED
>
> This is the original product specification, written when the v1 target was
> **CertiProf's SMPC** and v2 was **GAIPC**. That strategy changed: Certidemy issues six
> of its own proprietary credentials and resells nobody's exam.
>
> The strategic reasoning here remains valuable - notably decision 8, "Build own content
> from JTA, not consume CertiProf material," which is the decision that produced the
> current product. Read it for the *why*.
>
> For what is true now: `supabase/CERT-CREATION.md`, `supabase/SCHEME-<CODE>.md`,
> `supabase/TERMINOLOGY-POLICY.md`, and the generated JTAs.

---

# Certidemy — Master Specification

**Document version:** 1.0
**Last updated:** May 18, 2026
**Owners:** Juan + Claude
**Purpose:** Single source of truth for all architectural and product decisions. If you only read one document, read this one.

\---

## Table of contents

1. [Product summary](#1-product-summary)
2. [Architecture overview](#2-architecture-overview)
3. [Stack decisions](#3-stack-decisions)
4. [Database schema (what's deployed)](#4-database-schema-whats-deployed)
5. [Edge Functions (what's deployed)](#5-edge-functions-whats-deployed)
6. [Pedagogy philosophy](#6-pedagogy-philosophy)
7. [JTA framework (Job-Task Analysis)](#7-jta-framework)
8. [Lesson format — dual renderer](#8-lesson-format--dual-renderer)
9. [Widget primitives](#9-widget-primitives)
10. [AI tutor + RAG](#10-ai-tutor--rag)
11. [Mock exam system](#11-mock-exam-system)
12. [Adaptive learning engine](#12-adaptive-learning-engine)
13. [Localization (LATAM)](#13-localization-latam)
14. [Conventions (naming, structure, security)](#14-conventions)
15. [Roadmap](#15-roadmap)

\---

## 1\. Product summary

**Certidemy** is an adaptive certification prep platform serving primarily LATAM professionals seeking globally-recognized credentials.

**v1 target certification:** CertiProf Scrum Master Professional Certificate (SMPC).
**v2 target certification:** CertiProf Generative AI Professional Certificate (GAIPC).
**Long-term:** Provider-agnostic. Same content engine can prep PSM I, CSM, SAFe, AWS, Google Cloud, etc.

**Differentiation:**

1. **Adaptive depth.** Same content scales from exam-prep to professional mastery via the user's mastery scores.
2. **AI-grounded tutor.** Citation-backed, can't hallucinate beyond corpus, three languages (EN / ES-419 / PT-BR).
3. **Dual-renderer lessons.** Slide-style (Focus mode) for first-time learning, article-style (Review mode) for review. Same source.
4. **Bloom-aligned questions.** Tests reach Apply/Analyze (Bloom 3-4) far more than competitors' Remember/Understand drills.
5. **B2B-ready.** Company licenses, team admin dashboards, bulk seats — built into the schema from day one.

**Honest constraint:** No content exists yet. The entire pedagogical product needs to be built. Engine is ready and waiting.

\---

## 2\. Architecture overview

Three deployment surfaces:

```
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages                                                │
│  ─────────────────                                               │
│  Next.js 15 frontend (App Router, Edge runtime)                  │
│  - Public pages (landing, pricing, cert catalog)                 │
│  - Auth flow (Supabase Auth)                                     │
│  - Dashboard, study plan, lesson viewer (dual renderer)          │
│  - Quiz player, mock exam, AI tutor chat                         │
│  - Team admin dashboards (B2B)                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (JWT in Authorization header)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase                                                        │
│  ────────                                                        │
│  Postgres 15 with pgvector, RLS enforced on every row            │
│  Auth (email + OAuth, JWTs)                                      │
│  Edge Functions (Deno, TypeScript)                               │
│   - 8 deployed: submit-quiz-answer, get-review-batch,            │
│     generate-study-plan, generate-practice-questions,            │
│     ingest-document, chat-tutor, generate-mock-exam,             │
│     score-mock-exam                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  External APIs                                                   │
│  ─────────────                                                   │
│  Anthropic (claude-sonnet-4-6) — tutor, plan gen, question gen   │
│  Voyage AI (voyage-3) — embeddings for RAG                       │
│  Stripe (later) — payments, company subscriptions                │
└─────────────────────────────────────────────────────────────────┘
```

**Trust boundaries:**

* API keys (Anthropic, Voyage) live as Supabase secrets. Never reach the browser.
* Quiz answer keys never leave the server before submission.
* Service-role key bypasses RLS — only used inside Edge Functions, never client-side.
* Anon key + JWT enforce RLS — used in the browser via supabase-js.

\---

## 3\. Stack decisions

### Frontend

* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript, strict mode
* **Styling:** Tailwind CSS v4
* **Components:** shadcn/ui (copy-paste, fully owned)
* **Animations:** Framer Motion
* **Icons:** Lucide React
* **Forms:** react-hook-form + zod for validation
* **State:** React Server Components by default; client components only when needed (interactives, charts, real-time)
* **Localization:** next-intl
* **Hosting:** Cloudflare Pages (edge runtime, not Node runtime)

### Backend

* **Database:** Supabase Postgres 15 with pgvector
* **Auth:** Supabase Auth
* **Edge Functions:** Supabase (Deno, TypeScript)
* **AI:** Anthropic Claude (Sonnet 4.6); Voyage AI for embeddings

### Why these choices

* **Next.js + Cloudflare Pages**: free for early users, scales to millions, edge-deployed for LATAM latency
* **Supabase**: Postgres + Auth + Functions + RLS in one tool, no managed-service zoo
* **shadcn/ui over Material/Chakra**: components live in our repo, fully customizable, never break on upstream updates
* **Tailwind over CSS-in-JS**: faster builds, smaller bundles, no runtime cost
* **Anthropic over OpenAI**: Sonnet 4.6 is best-in-class for instruction following and grounded answers; we're already paying

### Edge runtime caveats

* No Node.js APIs (`fs`, `crypto.scrypt`, etc.)
* Use Web Crypto API instead of Node's `crypto`
* Image optimization: Cloudflare Image Resizing, not Next's built-in
* Most npm packages work; check for "edge compatible" before adding heavy ones

\---

## 4\. Database schema (what's deployed)

Two migrations applied to Supabase:

### Migration 001: Core schema (`certidemy\_schema.sql`)

Reference: see `/mnt/user-data/outputs/certidemy\_schema.sql`

**Tables:** `profiles`, `companies`, `team\_members`, `company\_certifications`, `certifications`, `modules`, `lessons`, `concepts`, `lesson\_concepts`, `module\_prerequisites`, `quiz\_questions`, `question\_concepts`, `quiz\_sessions`, `quiz\_attempts`, `study\_plans`, `study\_plan\_items`, `user\_progress`, `user\_lesson\_progress`, `user\_concept\_mastery`, `fsrs\_cards`, `fsrs\_reviews`, `pass\_predictions`, `audit\_logs`.

**Materialized view:** `team\_progress\_reports`.

### Migration 002: RAG + tutor + mock exam (`002\_rag\_and\_chat.sql`)

**Tables added:** `source\_documents`, `document\_chunks` (with `vector(1024)` HNSW index), `chat\_sessions`, `chat\_messages`, `mock\_exam\_results`.

**RPC added:** `match\_document\_chunks(query\_embedding, filter\_certification\_id, match\_count, match\_threshold)`.

### Migration 003 (pending — to be written next)

**Will add:** `domains`, `tasks`, lesson sectioning support, widget definitions, format preferences. Schema updates to `quiz\_questions` (bloom\_level, is\_exam\_scope, task\_id) and `certifications` (SMPC passing score 70→80).

### RLS posture

Every table has RLS enabled. Three helper functions: `is\_platform\_admin()`, `is\_team\_admin\_of(target\_user)`, plus standard `auth.uid()`. Pattern: own data only by default; team admins get read access to their team's data; platform admins get full access.

\---

## 5\. Edge Functions (what's deployed)

Eight functions, all live:

|Function|Purpose|Calls Anthropic?|Calls Voyage?|
|-|-|-|-|
|`submit-quiz-answer`|Grade answer, update mastery, advance FSRS|No|No|
|`get-review-batch`|Fetch due FSRS cards + optional new questions|No|No|
|`generate-study-plan`|Plan personalization + deterministic scheduling|Yes|No|
|`generate-practice-questions`|AI questions for weak concepts|Yes|No|
|`ingest-document`|Chunk + embed source material (admin only)|No|Yes|
|`chat-tutor`|Streaming RAG-grounded chat (SSE)|Yes|Yes|
|`generate-mock-exam`|Stratified sample, balanced difficulty|No|No|
|`score-mock-exam`|Grade exam, compute analytics, AI recommendations|Yes|No|

All functions: authenticate JWT first, use service-role client for writes, return JSON or SSE.

\---

## 6\. Pedagogy philosophy

Four principles that govern every content decision:

1. **Test what we teach, teach what we test.** Every quiz question maps to a task. Every task maps to lesson content. No orphan questions, no orphan lessons.
2. **Active recall over passive reading.** Lessons end with checkpoints. Interactives appear mid-lesson, not just at end.
3. **Bloom-honest.** Claim only the cognitive level we can actually test. Multiple choice tops out at Analyze (Bloom 4). Evaluate/Create reserved for AI simulations (future).
4. **Provider-neutral pedagogy, provider-specific terminology.** Teach Scrum from the Scrum Guide. Layer in CertiProf-specific terminology drift (e.g., "ceremonies," "self-managing") as exam tips, not as core truth.

**Anti-principles** (things we explicitly reject):

* ❌ Teaching to the exam exclusively (learners pass exam, fail in real Scrum Master role)
* ❌ Replacing the exam (we're prep, not certification — we direct learners to take the official exam)
* ❌ Pure recall drills (Anki replaces these for free)
* ❌ Lecture videos as primary medium (low completion, hard to update, hard to translate)

\---

## 7\. JTA framework

**Job-Task Analysis** is the foundation. Every cert in Certidemy has a JTA structured as:

```
Certification
└── Domain (4-6 per cert, weighted to sum to 100%)
    └── Task (4-10 per domain)
        ├── Knowledge / Skills / Abilities (KSAs)
        ├── Criticality (high/medium/low)
        ├── Frequency (daily/weekly/per-sprint/occasional)
        ├── Bloom level (1-6, but MCQs target 1-4)
        └── Concept tags (link to user\_concept\_mastery)
```

**For SMPC v2 (locked):**

* 5 domains: Foundations (12.5%), Team \& Accountabilities (22.5%), Events (25%), Artifacts \& Commitments (17.5%), SM in Practice \& Org Context (22.5%)
* \~44 tasks total
* Bloom MCQ target distribution: 15% Remember / 35% Understand / 35% Apply / 15% Analyze
* Bloom 5-6 (Evaluate/Create): flagged as future AI-simulation candidates, not MCQ-tested

See `SMPC\_JTA\_v2.md` for full task list (next deliverable after this spec).

\---

## 8\. Lesson format — dual renderer

**Decision: one markdown source, two renderers.**

### Source format

Every lesson is a single markdown file with frontmatter + custom section markers (a "lesson DSL"):

```markdown
---
lesson\_id: 01-01-agile-manifesto
module\_id: foundations-of-agile
title: The Agile Manifesto
duration\_minutes: 8
language: en
concept\_slugs: \[agile-values, agile-principles]
task\_ids: \[1.1]
prerequisites: \[]
---

::hook
Why a four-sentence manifesto changed software forever.
::

::concept title="The Four Values"
Individuals and interactions over processes and tools...
\[full explanatory text, can include sub-headings and markdown]
::

::diagram type="manifesto-values" caption="The four values, ordered by precedence"
::

::interactive widget="drag-match" id="match-values-to-principles"
{
  "items": \["Working software", "Customer collaboration", ...],
  "targets": \["Value delivery", "Stakeholder engagement", ...]
}
::

::deep-dive title="Historical context: the Snowbird meeting"
\[secondary content; collapsed by default in Focus mode, expanded in Review mode]
::

::callout type="exam-watch"
CertiProf's SMPC frequently asks which value takes precedence. Memorize the order.
::

::checkpoint
\[
  { "question": "...", "options": \[...], "correct": \["b"], "explanation": "..." },
  { ... },
  { ... }
]
::

::summary
- Four values, twelve principles
- Order matters: items on the left are valued more than items on the right
- The manifesto predates Scrum by 6 years
::
```

### Section types

|Section|Purpose|Focus mode|Review mode|
|-|-|-|-|
|`::hook`|Open with a memorable line|Full screen, large type|Lead paragraph|
|`::concept`|Main explanatory text|One concept per slide|Inline, with heading|
|`::diagram`|Visual element|Full screen|Inline, caption below|
|`::interactive`|Active engagement widget|Takes over screen|Inline, full-width|
|`::deep-dive`|Secondary detail|Collapsed; tap to expand|Expanded by default|
|`::callout`|Exam tip / warning|Slide between concepts|Styled aside in flow|
|`::checkpoint`|3-5 question quiz|Final slide of lesson|End of article|
|`::summary`|Key takeaways|Final slide|End of article|

### Focus mode (slide-style)

* One section per screen
* Swipe / arrow keys / next button to advance
* Progress bar at top
* AI tutor floating button on every slide
* Mobile-native feel
* Default for first-time learners
* Default on mobile

### Review mode (article-style)

* All sections stacked vertically
* Sticky table of contents (desktop only)
* Deep-dives expanded by default
* Browser Ctrl+F works
* Default for repeat visitors
* Default on desktop

### Toggle behavior

* Button in top-right of every lesson page
* Preference saved per (user, certification) — stored in `lesson\_format\_preferences` table
* Default rules: mobile + first visit = Focus; desktop + already-completed = Review
* User can override either way

\---

## 9\. Widget primitives

Six reusable widget types cover \~80% of pedagogical needs. Each is a React component fed by JSON config in the lesson markdown.

### 9.1 `drag-match`

Drag items from one column onto matching targets.
**Use cases:** Match Scrum values to behaviors. Match events to timeboxes. Match KSAs to accountabilities.

### 9.2 `sort-into-order`

Drag items into the correct sequence.
**Use cases:** Order Sprint events chronologically. Order Product Backlog by priority logic. Order accountabilities by who acts first in a workflow.

### 9.3 `toggle-and-observe`

Boolean toggles change a visualization in real time. Reveals consequences.
**Use cases:** Gemini's "Broken Factory" — toggle Transparency off, watch Inspection break. Toggle DoD strictness, observe Increment quality.

### 9.4 `highlight-the-mistake`

Read a scenario. Click the part that's wrong.
**Use cases:** "Daily Scrum transcript — find the anti-pattern." "Read this user story — what's wrong with it (per INVEST)?"

### 9.5 `scenario-mcq`

Multi-step branching scenarios. Choose, see consequence, choose again.
**Use cases:** "Your team's Daily Scrum is failing — what's your first move? (then) Now they say X — what next?"

### 9.6 `annotated-diagram`

Click hotspots on a diagram to reveal info.
**Use cases:** The Scrum framework diagram with clickable accountabilities/events/artifacts. The empiricism loop with clickable pillars.

### Widget contract

Every widget:

* Takes JSON config + optional `concept\_slugs` array
* Reports completion + accuracy back to the engine (feeds `user\_concept\_mastery`)
* Has built-in "Why did I get this wrong?" → opens AI tutor with the widget context
* Works on mobile (touch) and desktop (mouse/keyboard)
* Renders identically in Focus mode and Review mode

\---

## 10\. AI tutor + RAG

Deployed in `chat-tutor` Edge Function. Streaming SSE responses, three languages.

### Grounding contract (the load-bearing rule)

The system prompt forces every factual claim to come from retrieved `<reference\_material>`. If the answer isn't in the corpus, the tutor says so explicitly. Never guesses.

### Tutor system prompts

EN, ES-419, PT-BR. All enforce the same grounding rules. See `\_shared/prompts.ts` in the deployed `certidemy-tutor` package.

### RAG pipeline

1. User asks question
2. Voyage embeds the question (`input\_type: query`)
3. `match\_document\_chunks` RPC returns top-8 chunks above 0.4 similarity
4. Chunks formatted as `<reference\_material>` block with `\[source N]` indices
5. Claude generates response with inline `\[source N]` citations
6. Frontend renders citations as superscript chips, expandable to source preview

### Corpus

Currently empty. Will be populated with:

1. Our own Certidemy lessons (auto-ingested when published)
2. Public-domain Scrum sources (2020 Scrum Guide, Agile Manifesto)
3. Optionally: CertiProf official materials (for calibration, with proper licensing review)

\---

## 11\. Mock exam system

`generate-mock-exam` builds the exam; `score-mock-exam` grades it.

### Generation logic

* Loads cert config (`num\_questions`, `passing\_score\_pct`, `exam\_duration\_minutes`)
* Stratified sample by concept (every major concept represented)
* Balanced difficulty mix (30% easy, 50% medium, 20% hard)
* Shuffles order
* Creates `quiz\_sessions` row with `kind='mock\_exam'`
* Returns questions without correct answers

### Scoring logic

* Server-side grading (correct answers loaded on score endpoint, never on generate)
* Per-concept breakdown
* Per-difficulty breakdown
* Weakest 3 concepts identified
* Real-exam pass prediction via sigmoid (mocks \~5pts easier than real exams)
* Claude generates 3-5 natural-language recommendations in user's language

### Bloom-level mock exams (future)

Once lessons are tagged by Bloom level, we'll offer "Bloom-stratified" mocks that match the proposed 15/35/35/15 distribution exactly.

\---

## 12\. Adaptive learning engine

### Knowledge tracing

`user\_concept\_mastery` per (user, concept). Updated on every quiz answer via EWMA with two adjustments:

1. **Time decay** toward 0.5 prior (\~1% per day)
2. **Difficulty weighting** — harder questions move the score more

### Spaced repetition

FSRS-5 algorithm in `fsrs\_cards`. After every answered question, the card's stability, difficulty, and due date are updated. Daily review queue: cards with `due <= now()`, ordered by due time.

### Pass prediction

Sigmoid over weighted concept mastery. Stored in `pass\_predictions`. Updated nightly (cron not yet built — Phase 5 deliverable).

### Adaptive depth

**This is the key product differentiator.** Every concept has an `is\_exam\_scope` flag on its questions:

* `is\_exam\_scope = true` (default): questions reasonable for the actual exam
* `is\_exam\_scope = false`: deeper, harder questions for users who've mastered the exam-scope material

User flow:

1. Learner takes exam-scope questions until concept mastery reaches \~0.85
2. UI surfaces: "You've passed exam-level mastery on Impediment Removal. Want to go deeper?"
3. If yes, deeper questions unlock for that concept
4. Mastery scale extends past 1.0 for tracking (or we use a separate `professional\_mastery\_score` — TBD in v2 schema)

This makes Certidemy two products in one wrapper:

* **Foundation tier:** Pass the exam
* **Mastery tier:** Become a great Scrum Master

\---

## 13\. Localization (LATAM)

Three languages supported throughout:

* `en` — English
* `es-419` — Latin American Spanish (avoid Iberian Spanish: ustedes not vosotros, computadora not ordenador, tutea con "tú")
* `pt-BR` — Brazilian Portuguese (avoid European Portuguese constructions)

### What's localized

* UI strings (next-intl)
* Tutor system prompts (three versions in `prompts.ts`)
* Mock exam recommendations (generated in user's language)
* Lesson content (each lesson is in one language; same lesson translated as a separate row sharing a `lesson\_group\_id`)
* Question text + explanations (same pattern — translated row, shared `question\_group\_id`)

### What's not localized (intentionally)

* Concept slugs (always English; they're identifiers)
* Task IDs, module IDs (always English; identifiers)
* Internal admin tooling (English only for now)
* CertiProf-specific terminology in exam tips (kept in English since that's how the exam presents it, even when surrounding text is Spanish)

### Translation workflow

1. Lesson authored in English first
2. Claude translates to ES-419 and PT-BR via batch script (not yet built)
3. Native-speaker review (this is real human work — we'll need LATAM reviewers eventually)
4. Both translations published as separate `lessons` rows pointing to the same `lesson\_group\_id`

\---

## 14\. Conventions

### Naming

* **Database:** `snake\_case` for tables and columns
* **TypeScript:** `camelCase` for variables, `PascalCase` for types and components
* **Files:** `kebab-case.ts` for utilities, `PascalCase.tsx` for components
* **IDs:** UUID v4 everywhere; never auto-incrementing integers for user-facing data
* **Slugs:** `kebab-case`, English, immutable once published

### Security

* **Service role key:** server-side only, never logged, never returned to client
* **Anon key:** safe to expose, paired with JWT for RLS enforcement
* **RLS:** every user-data table has policies; admin operations use service role
* **Auth:** Supabase Auth handles password hashing, JWT issuance, OAuth
* **Secrets:** all third-party API keys as Supabase function secrets

### File structure (Next.js frontend, to be created)

```
certidemy-web/
├── app/
│   ├── (marketing)/        Public pages
│   ├── (app)/             Authenticated pages
│   │   ├── dashboard/
│   │   ├── learn/\[cert]/\[module]/\[lesson]/
│   │   ├── tutor/\[cert]/
│   │   ├── exam/\[cert]/
│   │   └── settings/
│   ├── (admin)/           Platform admin
│   └── api/               Route handlers (if any; most logic in Edge Functions)
├── components/
│   ├── ui/                shadcn primitives
│   ├── lesson/            Renderers + section components
│   ├── widgets/           The six widget primitives
│   ├── tutor/             Chat components
│   └── exam/              Exam components
├── lib/
│   ├── supabase/          Server + browser clients
│   ├── engine-client.ts   Wrapper around Edge Functions
│   └── lesson-parser.ts   Markdown DSL → section tree
└── content/               Lesson markdown files (or move to DB)
```

### Git conventions (when you set up the repo)

* Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
* Branch per feature
* Main is always deployable
* Tag releases (`v0.1.0`)

\---

## 15\. Roadmap

### ✅ Done

* Phase 1.1: Database schema (Migration 001)
* Phase 1.2: Learning engine (4 Edge Functions)
* Phase 1.3: AI tutor + mock exam (Migration 002 + 4 Edge Functions)
* Phase 1.4: JTA v1 + triangulation
* Phase 1.5: Lesson format decided (dual renderer)

### 🔄 In progress (this conversation)

* Phase 1.6: **Master spec doc (this file)**
* Phase 1.7: JTA v2 finalized
* Phase 1.8: Migration 003 (domains, tasks, lesson sections, format prefs)
* Phase 1.9: Lesson authoring spec
* Phase 1.10: Module 1, Lesson 1 written as template

### ⏳ Next (frontend phase)

* Phase 2.1: Next.js scaffold (auth, layout, marketing pages)
* Phase 2.2: Lesson renderer (Focus + Review modes)
* Phase 2.3: Six widget primitives
* Phase 2.4: Quiz player
* Phase 2.5: AI tutor chat page (using TutorChat.tsx)
* Phase 2.6: Mock exam page (using MockExam.tsx)
* Phase 2.7: Dashboard + study plan view
* Phase 2.8: Deploy to Cloudflare Pages

### 🚧 After v1 ships

* Phase 3.1: Content production at scale (10 modules × \~5 lessons = 50 lessons for SMPC)
* Phase 3.2: Question bank to 150+ questions
* Phase 3.3: ES-419 + PT-BR translations
* Phase 3.4: GAIPC certification (Module 2 cert)
* Phase 3.5: Team admin dashboard
* Phase 3.6: Stripe integration + B2B licensing
* Phase 3.7: AI simulations (Bloom 5-6, real-time Claude interactions)
* Phase 3.8: Mobile apps (React Native or Capacitor wrapping the web app)

### 📋 Backlog (worth knowing about, not urgent)

* Pass-prediction nightly cron
* Per-user FSRS optimizer (fit weights from review history)
* Content ingestion pipeline (PDFs → markdown → ingest-document)
* AI question review queue (`pending\_review` status before serving)
* Re-ranker on RAG retrieval (Cohere Rerank or Claude pass)
* LMS export (SCORM/xAPI) for corporate buyers
* Mobile push notifications for review reminders

\---

## Appendix A: Files inventory

### What's deployed

* `certidemy\_schema.sql` — Migration 001 (run in Supabase SQL Editor)
* `002\_rag\_and\_chat.sql` — Migration 002 (run in Supabase SQL Editor)
* Eight Edge Functions deployed via `supabase functions deploy`

### What's in the repo (Juan's local at C:\\Users\\Juan\\Documents\\certidemy)

```
certidemy/
├── client/learning-engine-client.ts       Engine wrapper for frontend
├── frontend/TutorChat.tsx                 React chat component (ready)
├── frontend/MockExam.tsx                  React exam component (ready)
├── supabase/
│   ├── config.toml                        Auto-generated by supabase init
│   ├── migrations/002\_rag\_and\_chat.sql
│   └── functions/                         9 folders (8 functions + \_shared)
├── ENGINE-README.md
└── TUTOR-README.md
```

### What needs to be created

* `CERTIDEMY\_SPEC.md` (this file)
* `SMPC\_JTA\_v2.md`
* `003\_jta\_curriculum.sql`
* `LESSON\_AUTHORING\_SPEC.md`
* `lessons/smpc/01-foundations/01-agile-manifesto.md` (first lesson)
* `certidemy-web/` (Next.js frontend, separate folder/repo)

\---

## Appendix B: Decision log

Every non-obvious decision we've made, with rationale:

|#|Decision|Date|Rationale|
|-|-|-|-|
|1|Postgres on Supabase, not separate vector DB|early|RLS + pgvector + Auth in one stack; <10M chunks fits Postgres fine|
|2|Voyage AI for embeddings, not OpenAI|early|Better retrieval benchmarks, asymmetric encoder, half the cost|
|3|Edge Functions over PostgREST RPCs for engine logic|early|TypeScript is testable; FSRS algorithm matches reference impls|
|4|FSRS-5, not SM-2 or BKT|early|State of the art for spaced repetition; weights are refittable per user|
|5|Server-side answer grading, not client-side|early|Anti-cheating; correct\_answer never leaves server before submit|
|6|Claude for personalization, code for scheduling|study plan|Claude handles judgment (strategy, coaching); code handles arithmetic (topo sort, time budget)|
|7|Three Tutor languages via system prompt variants|tutor|One model, three prompts, consistent grounding rules|
|8|Build own content from JTA, not consume CertiProf material|spec|Strategic moat; provider-agnostic; better pedagogy|
|9|5 domains for SMPC (not 6, not 4)|JTA v2|Triangulated across Grok, Gemini, primary sources|
|10|Bloom ceiling at 4 (Analyze) for MCQs|JTA v2|MCQs can't reliably test Evaluate/Create; reserved for AI simulations|
|11|Dual-renderer lessons (slide + article from same source)|format|Slide for first-time, article for review; one source of truth|
|12|Six widget primitives|format|Covers \~80% of needs without building bespoke widgets per lesson|
|13|Next.js + Cloudflare Pages for frontend|stack|Edge-deployed for LATAM latency; React skills carry over|
|14|shadcn/ui over Material/Chakra|stack|Components live in repo; never break on upstream updates|
|15|Adaptive depth via `is\_exam\_scope` flag|engine|Two products in one wrapper without rebuilding the engine|

When we make new significant decisions, append them here.

\---

**End of master spec.** Keep this file updated as the project evolves. When in doubt about anything — schema, conventions, philosophy — this is the source of truth.

