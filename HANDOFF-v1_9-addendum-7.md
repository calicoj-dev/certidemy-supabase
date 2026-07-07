# HANDOFF v1.9 — Addendum 7: The Evidence Room, Phase 1
_July 7, 2026. Follows addenda 6/6b (flow doctrine). Supabase tip: migration 083. Web tip: governance nav wire (run `git log --oneline -15`)._

## SHIPPED — Governance: the ISO/IEC 17024 Evidence Room (Phase 1)
Admin-gated `/console/governance`, wired into the admin nav (evidence cluster, beside Audit log).
- **Feed**: `get-governance-snapshot` edge fn (service role; verifies caller platform_admin via profiles.platform_role). Returns schemes (+ domains/weights/taskCount + latest jta_versions row), item-bank counts per cert×pool×lang, guardrails, v_coverage_* mirrors (raw rows), exam_attempts aggregates, credentials counts, recent admin_actions. Client contract: `lib/console/governance.ts` (loadGovernanceSnapshot via functions.invoke).
- **Migration 082**: `v_governance_guardrails` — both exam-security invariants as a versioned view (practice_marked_secure, secure_linked_to_concepts; both must be 0; both ARE 0).
- **GovFlow engine** (`components/console/gov-flow.tsx`): generic SVG process-diagram — nodes on a 1000×420 canvas, cubic edges with animated dash-flow (reduced-motion safe), tone-colored glow, click → Healix stage drawer (title/body/stats). Flows are pure data (FlowDef) — new process = new config.
- **First flow: CREDENTIAL LIFECYCLE** — voucher → assembly → secure pool → proctored run → scoring → mint/verify + telemetry branch; every node LIVE-badged from the snapshot (3,387 secure items, active creds, attempts, pass marks). Stage drawers carry per-cert blueprint splits, credential counts, telemetry.
- **Panels** (`governance-panels.tsx`): Scheme Registry (blueprint weight bars + JTA version chips), Item Bank Health (guardrail lights + cert×pool×lang table), Coverage mirrors (verbatim view tables; green-check empty states), Exam Telemetry tiles, Audit Trail slice.

## FINDINGS (the room worked on day one)
1. **SD-AI-I had NO jta_versions row** (SM v2.1 / SPO v1.0 published) — SD attempts stamped no JTA version. **Fixed: migration 083** (idempotent insert, v1.0 published, blueprint_snapshot from live domains). Verified via the room: chip now `SD-AI-I v1.0 · published`.
2. **/console/audit is a "coming soon" STUB** — the governance Audit Trail slice is currently the only live audit surface. Data path proven; full page = reuse panel + pagination/filters.
3. SM-AI-I shows 51 tasks vs 44 (SD/SPO) — historical (AI tasks); not a defect, note for scheme-parity narrative.

## Phase 2 queue (in order)
1. **JTA drawer / artifact shelf**: scheme card click → drawer with version history + blueprint_snapshot rendered + task inventory. (Juan explicitly wants this.)
2. **Full Audit page** (replace stub): filterable/paginated admin_actions.
3. **Status chip tone-coding** on scheme cards (available=success, coming_soon=accent, unavailable=warn, draft=muted) + flow-diagram label-overlap polish near Mint.
4. **More flows** (configs only): Item Lifecycle (JTA task → generator → cue-guard → review → pool), Content Pipeline (disk → update-lesson-content → wire-lessons → joins), Scheme Lifecycle.
5. **Exports / PDF** with the 6C disclosure tracker (secure = de-branded + CONFIDENTIAL + solicitor/purpose log as audit events); schema auto-diagrams (Phase 3).

## Meta-lessons (append)
- **Indent-miscount anchor class**: dumps' line-number prefix invites off-by-two indent errors. For list insertions, use indentation-AGNOSTIC regexes (match content, capture `([ \t]*)`, reuse). FAIL-then-verify discipline correctly produced "nothing to commit" — no false history.
- Editor `Success. No rows returned` on guarded INSERTs is ambiguous — verify via the live surface (the room IS the verification).

## Also carried (unchanged)
Lesson route-prefix migration → book overlay; AppBottomBar dark; TutorChat chrome i18n; quiz-picker/play i18n; light/dark toggle; NEXT_PUBLIC_SITE_URL; next CVE bump; SD-AI-I-SMS4-XFC6 wipe pre-launch; practice backfill ≥10; Scrum II JTAs coming-soon (NO II generator); HANDOFF-v2.0 consolidation.
