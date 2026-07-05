# HANDOFF-v1.7

**Session theme:** SD-AI-I completion (question banks + trilingual lessons) →
built the **cert status lifecycle** feature end-to-end → proved the exam flow with
a real credential mint → cleared a batch of B2B/UX bugs. Continues from prior
HANDOFF versions; this one is self-contained enough to onboard cold.

> **Before doing anything, read `PIPELINE-INDEX.md`** (the read-first activity map
> + where-everything-lives + operational gotchas + working style). This handoff is
> the session snapshot; the index is the durable map.

---

## 1. What shipped this session (all committed + pushed unless noted)

### SD-AI-I content — COMPLETE
- **Question banks:** secure **1,107** rows (all 44 tasks ≥8/8/8 per language, 0 firewall breach, cue-neutral at n=352: position 24/27/24/25%, key-longest 36% down from ~82%). Practice **1,380** rows (all ≥10/10/10). Coverage view: **135/135 taught, 135/135 tested, 0 untaught-testing violations.**
- **Trilingual lessons:** all 44 lessons translated to es-419 + pt-BR (88 files under `content/sd-ai-i/_i18n/`), validated 0-failure, loaded, verified **44/44/44** with every `lesson_group_id` holding exactly 3 rows. No re-wire (translations inherit the en group's links).
- **Exam parameters confirmed:** 80Q / 90min / 80% pass, `status='available'`.

### New tooling + docs
- **`translate-lessons.mjs`** (supabase/scripts) — cert-agnostic lesson translator, disk-first, validate-by-graft (FROZEN structural keys / TRANSLATED prose). Generalized from the SPO tool; nothing named for one cert.
- **`TRANSLATION-PIPELINE.md`** — the read-first translation playbook (FROZEN/TRANSLATED schema, widget freeze-list, Scrum-noun list, load+verify sequence).
- **`SCHEME-SD-AI-I.md`** + **`LESSON-PIPELINE.md`** question-stage contract — committed.

### Cert status lifecycle — BUILT & OPERATIONAL (the session's big feature)
Replaces the overloaded `is_published` boolean with a 4-state lifecycle. Enforcement is live and server-side.
- **Migration 069** (`069_cert_status_lifecycle.sql`) — added `status` column (`draft`/`coming_soon`/`available`/`unavailable`, CHECK-constrained, indexed, default `draft`), backfilled (published→available, else→draft, SD-AI-I→coming_soon then flipped to available). `is_published` KEPT as a derived bridge, to be dropped in a later commit-2.
- **Exam freeze gates (deployed + committed):** `generate-mock-exam` refuses to START an exam unless `status='available'` — checked BEFORE `consumeAttempt`, so a freeze never burns a voucher attempt. `score-mock-exam` mint guarded (only `available`/`unavailable` can mint; draft/coming_soon can't). **Design: freeze blocks new STARTS only; an in-flight `available→unavailable` attempt still completes + mints** (fairer, 17024-defensible). SUSPEND ≠ REVOKE — freezing never touches issued credentials.
- **Catalog reads migrated:** `lib/certifications/data.ts` full drop-in — `getCertByCode` resolves any non-draft cert (was `is_published=true`-gated → the source of the SD-AI-I 404s); switcher = available-only; catalog returns `status` for badges. Added `export type CertStatus`. `is_published` kept derived.
- **Three-way catalog badge:** `certifications/page.tsx` — Available (success) / Coming soon (outline) / Temporarily unavailable (default). Only `available` certs link to a detail page.
- **Super-admin toggle (the control Juan asked for):** `set-cert-status` edge fn (platform_admin-guarded, logs `from→to` to `admin_actions`), `listCertsForAdmin` in `lib/console/admin.ts`, `/console/certifications` page + `cert-status-table.tsx` (status dropdown per row), nav item in console layout. **Verified working:** flipped SD-AI-I coming_soon→available, `admin_actions` audit row confirmed correct.

### Migration 068 (`068_cert_tie_read_policy.sql`) — partner-console name fix
`user_has_cert_tie(uuid)` SECURITY DEFINER helper + additive `certifications` SELECT policy granting cert-name read to users with a voucher/allocation tie, regardless of `is_published`. Fixes the partner console showing an unpublished cert as generic "Certification". **Bridge** — superseded once RLS keys off `status` (see backlog).

### Exam smoke test — PASSED end-to-end
Minted real credential **`SD-AI-I-SMS4-XFC6`** ("Certidemy Scrum Developer I — AI", Juan Roman), `/verify` shows Valid. Method: flip `passing_score_pct` to 1 right before submit, pass, restore to 80 (confirmed back at 80.00). Test voucher `SD-AI-I-V-J33T-CQXM` (linked to Juan, 999 attempts, now `redeemed`). **Keep the credential** — all creds get wiped pre-launch.

### Bug fixes this session
- **Fix A — voucher not marked redeemed at mint:** `score-mock-exam` linked `credential_id` but never set `status='redeemed'` → roster showed holders "building" not "certified". Fixed (adds `status:'redeemed'` + `redeemed_at` on passing cert exam) + one-row correction for the existing test voucher. *Edge case logged: a FAILED cert exam still doesn't mark redeemed — refinement "mark-redeemed-on-any-completed-cert-exam".*
- **Fix B — readiness wrong-cert (the "38% building, SM-AI-I domains on an SD voucher"):** `loadRosterReadiness` defaulted `certificationId = SMPC_CERT_ID` for everyone, keyed by userId. Rewrote to **per-(user,cert)**: `roster.ts` now carries `certificationId`; `readiness.ts` takes `pairs:{userId,certificationId}[]`, groups by cert, keys results `"userId::certificationId"`, per-cert pass mark; `people/page.tsx` builds pairs + composite lookup. Component unchanged.
- **Fix C — `SMPC_CERT_ID` → `SM_AI_I_CERT_ID`** rename (constant only, in `team/data.ts` + `team/page.tsx`). Content-pipeline `smpc` paths deliberately untouched.
- **Fix D — certificate button desktop/mobile:** `canShare({files})` now exists on desktop Chrome too, so the mobile-share fix had bled onto desktop. Gated the share branch on a coarse-pointer/touch check → desktop downloads, mobile shares.
- **Fix E — verify-page language switcher:** reused the generic `marketing/locale-switcher.tsx` (path-generic; swaps the `/{locale}/` segment) → whole page + certificate PDF re-render in the chosen language.

---

## 2. Current state — where SD-AI-I and the platform stand

- **SD-AI-I:** content-complete in all 3 languages (lessons + question banks + coverage closed), `status='available'`, exam proven end-to-end. Still `is_published`-derived-true. Has a test credential + voucher (throwaway, wiped pre-launch).
- **Cert lifecycle:** enforcement live (freeze gates + catalog + toggle, all committed). Hardening/docs remain (RLS→status, drop is_published, CERT-LIFECYCLE.md).
- **All three certs:** consistent at 80Q/80%. SM pass-mark "85→80 debt" was found **already resolved** (live 80.00) — close that backlog item.
- **App is pre-launch, single user (Juan).** All credentials/vouchers get wiped before launch.

---

## 3. IMMEDIATE NEXT TASK — Fix F (dashboard earned-credential display)

**Not started.** Juan's request: from the learner Dashboard there's no way to reach
your earned credential. He wants "a PNG of the cert on the header next to Welcome
with a link — something cool that shows you've earned that Cert."

This is a **net-new feature, not a patch** — it's a design task as much as code:
detect whether the viewer holds an active credential for the cert they're viewing,
and if so render a cert thumbnail/badge in the dashboard header linking to their
`/verify/{credentialId}` page. Decisions to make deliberately: thumbnail approach
(the cert PDF is 51KB — render a PNG preview? reuse the credential-og image the
verify page already generates? a styled badge component?), placement, and the
credential lookup on dashboard load.

**Start fresh on it:** read the learner dashboard (`app/[locale]/(learn)/learn/[cert]/dashboard/page.tsx`
and `components/dashboard/*`), see how the "Welcome, {name}" header + hub cards are
built, check whether there's an existing credential-og / thumbnail asset to reuse
(the verify page uses a `credential-og` function — see `generateMetadata` in
`verify/[id]/page.tsx`), then design the badge. Don't bolt it on.

---

## 4. Backlog — HONEST status (done / partial / open)

### Launch-critical, OPEN
- **Voucher email→existing-user linkage — PARTIALLY FIXED.** Existing broken rows were **backfilled** (SQL: set `assigned_user_id` from `profiles` where email matches). **The assign FLOW root-cause is NOT fixed** — assigning a new voucher by email to an already-registered user will recreate the "not signed up yet" bug (`assigned_user_id` comes out null). The write path was never fully read (it's below `assign-voucher-modal.tsx` — likely an `assign-voucher` edge fn or a data-lib insert). **Signup-claim of pending vouchers is UNCONFIRMED.** Needs its own focused fix: read the write path, resolve email→profile on assign, and confirm/ build claim-on-signup.

### Cert lifecycle — remaining hardening
- **RLS policies → status:** `057_catalog_publish_gate` (child catalog tables), `060_get_public_samples_fn`, and retire the `068` tie-read bridge — all currently key off `is_published`; migrate to `status` (non-draft / available as appropriate).
- **`CERT-LIFECYCLE.md`** — extract the lifecycle doc from this handoff (states, transitions, enforcement points, suspend≠revoke) as the 17024 management-system artifact.
- **Commit-2: drop `is_published`** once every read is migrated to `status` and proven green (the boolean is currently a derived bridge).

### Data cleanups
- **GAIPC stub → own-code cert** (CertiProf residue; replace with an own equivalent). Note: only 3 certs returned in the status backfill, so the GAIPC row may already be gone — verify via the `/console/certifications` panel (it lists ALL certs incl. drafts).
- **SD-AI-I `name`** still has the `"Certidemy "` prefix while SM/SPO dropped it — cosmetic parity nit, one-line update.
- **`?? "Certification"` fallback** in `lib/console/admin.ts` batch mapping — same family as the fixed partner bug; works, low priority.

### SM-AI-I known debt
- Stale `task_codes` 6.1–6.7 (pre-remap, flagged UNRESOLVED by `wire-lessons.mjs`) → 7 stale-frontmatter untaught_testing_violations. Cleanup.
- Practice-pool backfill for SM-AI-I / SPO-AI-I tasks below the ≥10/lang floor.

### UX / polish
- **404 page** shows raw `Let&rsquo;s` HTML-entity bug (cosmetic).
- **Breadcrumb sweep:** ~6 files still link `/dashboard` instead of `/learn/${cert}/dashboard`.
- **mark-redeemed-on-any-completed-cert-exam** (Fix A edge case: failed cert exam doesn't mark voucher redeemed).

### Bigger, sequenced later
- **Cert roadmap intake** — a super-admin list to register candidate name+code+rationale for the product team. A planning backlog, **NOT a cert generator** (cert creation stays human: JTA → external-AI review → lock → build). Explicitly decided this session.
- **Super-admin BI/governance dashboard** surfacing all 17024 artifacts as live queries (feed tables already specced in SCHEME-SD-AI-I §12 / LESSON-PIPELINE §6).
- **Credly integration** as eventual badge system of record.
- **Motion/cohesion sprint** (Framer Motion installed).
- **Doc bumps:** `CERTIDEMY-REFERENCE` → v1.5 (fold lesson pipeline + SD-AI-I + lifecycle).

---

## 5. Exam flow (reference — how a credential gets minted)

1. `generate-mock-exam` (mode='exam'): checks `status='available'` → consumes a voucher attempt → assembles a blueprint-weighted secure form (D1=10/D2=12/D3=16/D4=24/D5=18 for the 80Q blueprint; refuses with 409 if the secure pool can't fill any domain). Writes a `quiz_sessions` row (kind `certification_exam`), stamps the consumed `voucher_id`.
2. Client runs the exam; submits to `score-mock-exam`.
3. `score-mock-exam`: grades vs `passing_score_pct` (read live at submit), writes `exam_attempts` (+ 17024 telemetry: language, domain_code, presented_order, late flag, jta_version stamp). **On pass** (and `status` mintable): mints a `credentials` row (snapshots holder + cert name, records locale for the PDF), links `credential_id` onto the voucher AND marks it `redeemed` (Fix A). One active credential per user+cert; re-pass returns the existing one.
4. `/verify/{id or code}` renders Valid/Revoked/Expired via the public `verify-credential` fn. Score never shown. Language switcher added this session.

---

## 6. Session meta-lesson (why the docs exist)

The single biggest efficiency gain this session came from **stopping to read the
playbook before acting** — Juan pushed on this explicitly ("are we translating?
read the translation doc"). It turned the lesson-translation task from a
file-poking discovery scramble into a three-command run. It's also 17024 substance:
a certification body must operate *documented, controlled procedures* so quality is
repeatable and not person-dependent. `PIPELINE-INDEX.md` + the procedure docs +
this handoff *are* that management system taking shape. Keep it fed: any new
repeatable procedure gets a doc and an index row, immediately.
