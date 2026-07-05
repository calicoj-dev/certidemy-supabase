# HANDOFF-v1.9

**Session theme:** the launch-surface session. Closed the entire near-term UX
bug-pair from v1.8 §6E (and more found along the way): the AI-Era tag now shows
to logged-out visitors, the marketing catalog AND cert detail pages are fully
trilingual, **SD-AI-I went publicly live** (its actual go-live), SM-AI-I's
description was rewritten to the house register, and **certidemy.com is live
with SSL**. Also produced two architecture-level findings: a production Three.js
carousel (orphaned, ready to delete) and the complete map of the auth surface
for the upcoming signup/login overhaul.

> **Before doing anything, read `PIPELINE-INDEX.md`.** This handoff supersedes
> v1.8.

---

## 1. What shipped this session (all committed + pushed, all verified live)

### AI-Era tag for logged-out visitors (migration 076) — DONE, visually confirmed
- Root cause: RLS != grant, same class as 070/071. `task_concepts` had an
  anon-inclusive policy (`USING true`) but NO anon table grant; grants are
  checked BEFORE RLS, so anon reads returned empty and every task derived
  `isAiEra=false`. All sibling tables (tasks, domains, concepts incl. columns,
  both translation tables) were already anon-granted — task_concepts was the
  lone gap.
- Fix: `GRANT SELECT ON public.task_concepts TO anon;` (076). NOT the secure
  firewall — public curriculum taxonomy only. Confirmed live logged-out.

### Marketing i18n — catalog page + cert detail page (web commits db5bcf3, 0de67f0)
- Both `certifications/page.tsx` and `certifications/[code]/page.tsx` called
  `setRequestLocale` but never `getTranslations` — ALL chrome was hardcoded
  English. Wired both to `getTranslations("certifications")`.
- NEW tool: **`scripts/i18n-certifications.mjs`** (web repo) — idempotent
  namespace injector for messages/{en,es-419,pt-BR}.json. Existing keys always
  win; preserves indent; safe to re-run. **The pattern for all future chrome
  i18n additions** (accent-heavy content delivered as a file, never console
  here-strings — the multibyte trap).
- Deliberately NOT translated: cert name/provider/category label (Scrum proper
  nouns + brand), "Blueprint" / "Job-Task Analysis" (feature/method names).
  `cert.description` + `cert_categories.tagline` are DB content = Layer 2
  (backlog).

### SD-AI-I PUBLIC GO-LIVE (migration 077)
- SD-AI-I had `status='available'` but `is_published=false` (the never-flipped
  publish step) — anon policy `(is_published OR is_platform_admin())` hid it
  from every logged-out prospect. Also `category_slug` NULL -> "Other
  certifications" bucket.
- 077: `is_published=true, category_slug='scrum', sort_order=3`. This WAS the
  deliberate go-live. All three certs now publicly listed under Certidemy Scrum.

### SM-AI-I description + SD-AI-I name (migration 078)
- SM's description was a pre-AI placeholder (no AI mention, raw newlines).
  Rewritten to the house formula ("AI-ready [role] certification. Validates
  [craft] — [scope] + signature discipline. Grounded in the 2020 Scrum Guide"),
  every claim scheme-traceable (AI in every domain = migration 052 fact).
  SM's signature: facilitating teams where AI is a teammate.
- SD-AI-I name: dropped the stale "Certidemy " prefix (backlog item, became
  publicly visible after 077).

### Debt RESOLVED (no action needed)
- **SM-AI-I pass mark is ALREADY 80%** (verified live: all three certs
  80.00 / 80Q). The "85% pending correction" note in running memory was stale.
  CLOSED — stop carrying it.

### Infrastructure: certidemy.com LIVE
- Custom domain Active + SSL on the Cloudflare Pages project (zone in same
  account; Pages custom-domain flow auto-provisioned DNS). Site verified
  serving on https://certidemy.com.

---

## 2. Current state

- **All three certs publicly live, trilingual marketing surface, uniform
  80Q/80%.** SM-AI-I traceability clean (v1.8), SD-AI-I published, catalog
  grouped correctly.
- **Migrations tip: 078. Next is 079.**
- **certidemy.com live**, but three redirect configs OUTSTANDING (Section 3).
- **Auth surface fully read and mapped** (Section 5) — overhaul not started.
- Web repo HEAD 0de67f0; supabase repo has 076/077/078 records committed.

---

## 3. IMMEDIATE NEXT ACTIONS (in order)

### 3a. Redirect configs (Juan, dashboards — unblocks Google OAuth + auth emails on the domain)
1. **Cloudflare Pages** -> project -> Settings -> Env vars (Production):
   `NEXT_PUBLIC_SITE_URL=https://certidemy.com` -> redeploy.
2. **Supabase** -> Authentication -> URL Configuration: Site URL =
   `https://certidemy.com`; Redirect URLs += `https://certidemy.com/**`
   (keep `*.pages.dev/**` during transition).
3. **Google Cloud Console** -> OAuth client: Authorized redirect URIs must
   include `https://pctynukndxnmnxiqpgck.supabase.co/auth/v1/callback`
   (Supabase brokers Google); JS origins += `https://certidemy.com`.
- "Google connect broken" was CONFIG, not code — the OAuth code path is
  correct (verified by read).

### 3b. Three.js carousel removal — READY TO EXECUTE (proven orphaned)
- `CertModalTrigger` is rendered NOWHERE (grep-proven). The whole chain is
  dead code shipping ~580kb lazy Three.js seeded with FAKE pre-pivot certs
  (SM-I, GAIPC, Ethical Hacking, ISO Auditor) — contradicts the standing
  "Three.js rejected" architecture decision.
- Exact removal: delete `components/marketing/certifications-modal.tsx`,
  `certifications-modal-lazy.tsx`, `cert-modal-trigger.tsx`,
  `lib/cert-data.ts`; `npm uninstall three @types/three`; then check for
  orphaned `home.certsModal*` / `home.certsFilter*` / `home.smpc*` /
  `home.gaipc*` message keys; `npm run build` green; one commit.

### 3c. Auth overhaul (the remaining Option-A piece — design locked, Section 5)

---

## 4. Backlog — HONEST status

### Launch-critical / near-term
- **Auth overhaul** (Section 5): facelift to current tokens + REAL password
  reset flow (none exists) + GAIPC/stale sweep + contact email.
- **Three.js removal** (3b — ready).
- **Transactional email**: `info@certiglobal.org` is the CONTACT address
  (footer/support). Supabase auth emails still send from Supabase default;
  custom sender = SMTP config + SPF/DKIM DNS on the domain. Separate infra
  task; deliverability matters.
- **GAIPC DB stub** (`22222222-…`): decide delete vs leave-draft (RLS/FK
  implications — do NOT fold silently into another change).

### Marketing / UX (Juan's direction, this session)
- **Scrum FAMILY PAGE** (`/certifications/scrum`): role narrative (SM/SPO/Dev)
  + **comparison chart**. Chart rules agreed: every row objectively
  verifiable; competitor cells sourced from their public pages with an
  "as of <date>" footnote; ZERO adjectives in competitor cells; NO price row;
  say "Global" not LATAM; re-verify cells periodically. Killed rows:
  "Recognition" (unverifiable). Legality: comparative advertising with
  truthful, verifiable, non-disparaging claims is broadly permitted (not legal
  advice); the discipline above is the guardrail. UNBLOCKED (pass-mark
  consistency verified).
- **Transparency-section cycler** (Juan's idea, endorsed): prev/next cycling
  SM->SPO->SD in the home transparency section; cheap (client wrapper over
  existing loadBlueprint data). Slot: motion sprint or family-page build.
- **Nav transparency fix**: top bar unreadable over content mid-scroll ->
  standard scrolled-state (backdrop-blur + surface tint + hairline border).
  Small, high perceived-quality gain.
- **Within-group cert order**: Scrum group currently code-alpha (SD, SM, SPO).
  One-line sort change in `listCatalogGroups` if role order (SM, SPO, SD)
  preferred — Juan's call.
- **Layer 2 DB-content i18n**: `certifications.description` +
  `cert_categories.tagline` overlay (mirror task_translations pattern). Check
  actual values vary before building.
- **pricing/page.tsx**: same untranslated-chrome class (setRequestLocale, no
  getTranslations).
- **UX verdict (Claude, honest)**: product core is launch-grade; commercial
  shell gaps = auth pages, nav transparency, motion/cohesion pass. Weeks of
  polish, not months. NO 3D — richness comes from the family page + cycler +
  Framer Motion micro-interactions (installed, on-brand, edge-safe).

### Carried from v1.8 (unchanged)
- is_published -> status RLS cutover + drop is_published + write
  CERT-LIFECYCLE.md (077 deliberately did NOT start this — bridge-flag
  reconcile only).
- SPO-AI-I concept audit; SM translation-layout normalization; practice-pool
  backfill (SM/SPO tasks at 9/lang); breadcrumb sweep; Credly; governance tab;
  PDF expert-review; Scrum II JTAs (item-model constraint stands); WCAG mode;
  mark-redeemed edge case.

---

## 5. Auth surface — read complete (design basis for the overhaul)

**Structure** (well-factored; facelift not rebuild):
`app/[locale]/(auth)/{login,signup}/page.tsx` (thin, redirect-if-authed) ->
`components/auth/{auth-shell,login-form,signup-form}.tsx` ->
`app/[locale]/auth/actions.ts` (server actions, Zod, discriminated-union
state, ?next= handling) + `auth/callback/route.ts` (code exchange, safe
fallbacks). OAuth code path CORRECT.

**Gaps/ghosts found:**
- **Password reset DOES NOT EXIST**: `login-form.tsx:49` "forgot" link points
  to `/login` itself; no forgot-password page, no `resetPasswordForEmail`, no
  update-password page. LAUNCH-MUST. Build: forgot-password page -> reset
  action -> update-password page -> callback handling + new
  `auth.forgotPassword` / `auth.updatePassword` i18n namespaces (injector
  pattern).
- **auth-shell.tsx:63**: footer strip reads `SM-I · GAIPC · MORE COMING`
  (stale twice over) -> real cert line.
- **GAIPC message keys**: 9 keys (`home.gaipc*` x3 locales) — sweep with the
  Three.js removal (cert-data.ts is the third GAIPC surface).
- i18n namespaces present: `auth.login` (10), `auth.signup` (17),
  `auth.errors` (4).
- `.env.local` SITE_URL=localhost is CORRECT for dev; production value lives
  in Cloudflare Pages env (Section 3a).

---

## 6. Migrations this session
- 076 task_concepts anon SELECT grant (AI-Era tag fix)
- 077 publish SD-AI-I + category_slug scrum + sort_order 3 (go-live)
- 078 SM-AI-I description rewrite + SD-AI-I name prefix drop

## 7. Meta-lessons
1. **The RLS != grant class keeps paying**: 070/071/076 are one family. When
   an authed surface works and anon doesn't (or vice versa), check GRANTS
   before policies — grants are evaluated first and fail silently through
   failure-tolerant loaders.
2. **"Setup instructions" can be for the wrong branch**: Cloudflare's manual-
   CNAME screen is for external DNS; a zone in the same account should use the
   Pages custom-domain flow (auto-provisions, avoids the known manual-CNAME
   522 failure). Read which path you're on before following steps.
3. **Grep-prove orphanhood before deleting OR keeping**: the Three.js carousel
   looked live (lazy-loaded, triggered) until the caller grep showed the
   trigger renders nowhere. Same discipline that keeps us from deleting live
   code also licenses confident deletion of dead code.
4. **Console mojibake is not file corruption** (em-dashes as â€"/├í in
   PowerShell/git-diff output): verify by codepoint dump or the DB result
   grid, not by eyeballing the terminal.
