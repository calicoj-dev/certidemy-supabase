# HANDOFF v1.9 — Addendum 8: Evidence Room wrap + THE NEW-USER-EXPERIENCE FRONT
_July 7, 2026. Follows addendum-7. This doc is the OPENING BRIEF for the next session: launch-critical new-user experience._

## Session tail — state
- **Evidence Room Phase 2 wave 1 SHIPPED + VERIFIED:** JTA artifact drawer on scheme cards (version history, blueprint_snapshot, task inventory by domain — screenshots confirmed for all 3 certs), tone-coded lifecycle chips (AVAILABLE now green), REAL Audit page with search/filter/expandable metadata (finding #2 closed; shows "recent 0" for non-admin-visible rows — verify RLS read as admin shows rows; governance panel shows 12, audit page showed 0 → **RECON: the audit page query returned empty while the service-role feed returns rows. Likely admin_actions RLS SELECT policy doesn't actually grant platform_admin (writes are service-role; reads may be too). If so: route the audit page through the snapshot fn or add a read policy migration.**)
- Snapshot feed v2 deployed (jtaHistory + task inventories). SM/SPO snapshots are pre-083 TASK-DUMP shape — renderer now labels them as historical artifacts; SD shows weight bars (083 shape). **Snapshots are never rewritten.**
- **PARKED (polish): flow edge labels still collide** ("CONSUME ATTEMPT" clips behind Voucher/Assembly, "PASS" behind Mint). v2 made them HTML pills positioned on the straight chord with labelAt — insufficient because edges are cubic curves. Fix options: (a) position on the actual cubic (point-at-t of the bezier), (b) drop edge labels entirely and fold the info into node badges/drawers, (c) hand-tuned label coords per edge in FlowDef. Recommend (a)+(c) hybrid, ~1 focused hour. NOT launch-critical.

## ★ THE FRONT: NEW-USER EXPERIENCE (launch-critical, Juan's directive)
Fresh account (info@certiglobal.org, learner view) tour findings:

### 1. Quiz menu chrome is hardcoded ENGLISH
`/learn/{cert}/quiz` in es-419 shows: "Practice quiz", "Three ways to test yourself…", "Past quizzes", card titles/descriptions (Practice/MIXED, Review due/FSRS, Weak concepts/AI), footer note — all EN.
- Fix: read `components\quiz\mode-picker.tsx` (exists; was dark-swept earlier) + `app\[locale]\(learn)\learn\[cert]\quiz\page.tsx`; apply the inline-STR trilingual pattern (keyed by locale, no message-file edits) used across the Readiness Log.

### 2. Module titles/descriptions are EN-only (content model)
Catalog (`/learn/sd-ai-i`) shows Spanish lesson titles but ENGLISH module titles + descriptions — the `modules` table stores one language.
- Decide: per-language columns vs module_translations table (recommend translations table keyed module_id×lang, mirroring lesson row pattern).
- Migration (084+, editor-first) + es/pt backfill (Claude authors translations; ~15 modules × 2 langs) + locale-aware catalog/dashboard/journey loaders (`lib/catalog/data.ts`, module drawer, journey wheel labels).
- Verify on: catalog, module page, module drawer, dashboard journey, blueprint page.

### 3. Enrollment model — certs should be OPT-IN, not auto-loaded
Today every published cert appears for every learner (AppShell gets `listPublishedCerts`; default via `getDefaultCert`). Fine at 3 certs; wrong at dozens.
- Design: `user_certifications` enrollment table (user_id, certification_id, enrolled_at, source: 'self'|'voucher'|'admin').
- Cert switcher + dashboards scope to ENROLLED; certification marketing page gets "Start free" (logged-out → signup w/ intent) / "Add this certification" (logged-in).
- Voucher assignment AUTO-ENROLLS the assignee. First-run with zero enrollments → a welcoming "pick your certification" state, not an arbitrary default.
- This is product-shaping: propose the model, Juan steers, then migrate + wire.

### 4. Voucher → already-registered user (VERIFY, don't assume)
Question: assigning a voucher to an email that already has an account — does the roster show it linked immediately (assigned_user_id set) or stuck "pending signup"? Claim path was verified both orderings (v1.8), but the DISPLAY state for pre-registered assignees needs a live test: assign to an existing account, check People/roster + learner's exam gate.

### 5. First-run dashboard is GOOD — keep it
"Empieza aquí / Haz tu primer quiz" panel with mapped-gaps framing renders correctly in ES. After fix #1, the full first-session loop (signup → dashboard → first quiz → study plan) should be walked in es-419 AND pt-BR end-to-end as the launch gate.

## Standing backlog (unchanged, condensed)
Evidence Room ph2 cont. (more flows: Item Lifecycle, Content Pipeline; exports/PDF + disclosure tracker; schema diagrams ph3) · lesson route-prefix migration → book overlay · AppBottomBar dark · TutorChat chrome i18n · light/dark toggle · NEXT_PUBLIC_SITE_URL · next CVE bump · SD-AI-I-SMS4-XFC6 wipe · practice backfill ≥10 · Scrum II JTAs (NO II generator) · HANDOFF-v2.0 consolidation.

## Working rules reminder (for the next session's Claude)
Read bytes before editing · drop-in files or CRLF-safe apply scripts with ok/FAIL · one PS block per batch, -LiteralPath, PS 5.1 (no ??) · npm run build green before push · migrations editor-first, sequential (next: 084) · repos committed separately · HANDOFF docs never auto-deleted · indentation-agnostic regexes for list inserts · verify on the live surface, not "the script ran."
