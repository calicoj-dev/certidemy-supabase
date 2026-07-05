# HANDOFF-v1.9 — ADDENDUM

Appends to HANDOFF-v1.9.md. Captures work shipped AFTER v1.9 was written
(v1.9 was checkpointed right before the Three.js removal). Read v1.9 first;
this only records the delta.

---

## Commits since v1.9 (all web repo, pushed)

- **13a6f03** — remove orphaned Three.js cert carousel + prune its i18n keys
- **8abfac9** — feat(verify): manual credential-code lookup landing at /verify
- **2f61b18** — fix(brand+verify): magenta theme on verify pages, footer verify
  link, domain fallback

Supabase repo unchanged since v1.9 (still tip 078; next 079).

---

## What shipped (delta)

### Three.js carousel REMOVED (13a6f03)
- `CertModalTrigger` was grep-proven orphaned (rendered nowhere). Deleted the
  whole chain: `certifications-modal.tsx`, `certifications-modal-lazy.tsx`,
  `cert-modal-trigger.tsx`, `lib/cert-data.ts`. Dropped `three` +
  `@types/three` (~580kb lazy bundle, seeded with FAKE pre-pivot certs SM-I /
  GAIPC / Ethical Hacking / ISO Auditor). Contradicted the standing
  "Three.js rejected" arch decision — now honored.
- Pruned 18 orphaned `home.*` keys (certs modal/filter/card + smpc*/gaipc*)
  from all 3 locales. **This cleared the last GAIPC ghosts from the message
  files.** 912 deletions, build green.
- Closes three v1.9 board items at once: Three.js removal, fake-cert exposure,
  GAIPC-in-messages sweep.

### Verify front-door (8abfac9)  — NEW /verify landing
- Discovery: `/verify/[id]` ALREADY resolves either the credential UUID or the
  human code (regex-tests for UUID -> ?id=, else ?code=). So the printed code
  IS a valid shareable URL. Missing piece was a MANUAL entry point.
- New `app/[locale]/verify/page.tsx` (edge) + `components/verify/verify-lookup.tsx`
  (client): one forgiving input -> routes to `/verify/{normalized}`.
- Normalizer (decided AGAINST a cert-prefix dropdown): uppercases, collapses
  spaces/underscores/stray punctuation to single dashes, strips a pasted URL to
  its segment, and NEVER invents dash positions — so legacy `SM-I-...` codes
  pass through intact (a prefix-dropdown would have mis-guessed them). Live
  "reads as:" preview. Client-side routing => zero dependency on domain config.
- i18n: `verify.lookup` (via `scripts/i18n-verify-lookup.mjs`, committed).
- Closes a real ISO/IEC 17024 gap: third-party verifiability without a
  pre-shared link.

### Brand + verify discoverability + domain fallback (2f61b18)
- **BRAND DECISION (recorded, important):** the blue/magenta split is
  INTENTIONAL, not residue. `globals.css` defines TWO themes:
  - light theme: `--color-accent = #0066cc` (Pro Blue) — the logged-in APP +
    console-light accent. WCAG-tuned for text on white.
  - dark theme (`data-theme="dark"`): `--color-accent = #ff2d72` (magenta).
  - AI-Era badge has its OWN theme-independent token (`--color-ai-era #be185d`
    light / `#ff8fb3` dark) so the magenta brand signal is ALWAYS magenta,
    with documented AA contrast.
  Rule going forward: **blue = light app workhorse accent; magenta = brand
  signal + all PUBLIC surfaces via the `data-theme="dark"` opt-in.** Do NOT
  globally magenta-fy the light accent (would break the AA guarantees the token
  comments protect).
- Opted `/verify` and `/verify/[id]` into `data-theme="dark"` (same one-line
  mechanism as `(marketing)/layout.tsx`). This was a HALF-DONE migration: the
  verify download button already had a dark-surface variant; the page wrapper
  was the missing half. Verify surface is now on-brand magenta-on-black.
- Footer "Verify a credential" link -> `/verify` (`nav.verifyCredential`, 3
  locales, via `scripts/i18n-footer-verify.mjs`). Fixes the "no entry point,
  had to type /verify manually" gap.
- Corrected stale og/LinkedIn domain fallback `certidemy.pages.dev` ->
  `certidemy.com` in `verify/[id]` metadata (the ONLY stale pages.dev fallback
  in the codebase — swept, confirmed unique).

---

## Backlog — NEW / updated items

### Outstanding config (Juan, dashboards) — now BLOCKS the live og-preview too
- **`NEXT_PUBLIC_SITE_URL=https://certidemy.com`** in Cloudflare Pages env
  (Production) -> redeploy. This is the SAME item from v1.9 §3a, but note it now
  ALSO drives: the LinkedIn/WhatsApp share-preview domain (og:image + certUrl)
  and the LinkedIn "add certification" link. The code fallback is fixed; the
  env var is what makes the LIVE preview show certidemy.com.
- After setting it: **re-scrape** shared links via LinkedIn Post Inspector
  (linkedin.com/post-inspector) to bust their og cache. WhatsApp caches per
  thread ~7 days.
- (Still also: Supabase redirect allow-list + Google OAuth URIs, per v1.9 §3a.)

### New tracked items
- **`npm audit` review**: `npm uninstall three` surfaced a pre-existing
  27-vuln count (2 low / 15 mod / 9 high / 1 critical) in the general dep tree —
  unrelated to our deletes. Run `npm audit`, triage before launch. Not urgent,
  but tracked.
- Per-credential rendered og:image is still a fallback (`/og/credential-fallback.png`);
  a real per-credential card renderer remains a follow-up (noted in verify page).

### Unchanged from v1.9
- Auth overhaul (NEXT — see below), family page + comparison chart, nav
  transparency, within-group sort, Layer 2 DB-content i18n, pricing i18n,
  transactional email (SMTP+SPF/DKIM), GAIPC DB stub decision, is_published->
  status RLS cutover, and all carried-from-v1.8 items.

---

## NEXT: auth overhaul (last Option-A piece)
Design basis is v1.9 §5 (full auth surface read). Plan:
1. Facelift `auth-shell` + both forms to current tokens + the SAME
   `data-theme="dark"` opt-in (public surface -> magenta, consistent with verify).
2. Build the REAL password-reset flow (none exists): forgot-password page ->
   `resetPasswordForEmail` action -> update-password page -> callback handling;
   replace the fake `login-form.tsx:49` `href="/login"` forgot link. New
   `auth.forgotPassword`/`auth.updatePassword` i18n via injector.
3. Kill the LAST GAIPC ghost: `auth-shell.tsx:63` footer strip
   `SM-I · GAIPC · MORE COMING` -> real cert line.
4. Wire `info@certiglobal.org` as the CONTACT address (NOT the transactional
   sender — that's the separate SMTP task).
- NOTE: reset-flow email links need the Supabase redirect allow-list + SITE_URL
  config to work end-to-end. Build now, verify after config lands.

---

## Meta-lessons (append to v1.9 §7)
5. **Multiline/CRLF in-place edits go through a node script with per-anchor
   assertions, never PowerShell here-strings + `` `r`n ``.** PowerShell
   `.Replace()` silently no-matched on CRLF and half-applied edits (verify
   brand attempt). The node script (normalize to \n, match, restore \r\n on
   write, report ok/FAIL per anchor) landed all 5 edits first try. Bonus: it
   FAILS LOUD instead of silently.
6. **The browser `(1)` re-download trap**: re-downloading a file the browser
   already has saves `name (1).ext`; a copy of `name.ext` then grabs the STALE
   original. Delete the old download first, or the copy silently uses old bytes
   (bit us twice — verify-lookup fix + the landing page).
7. **`node --check` is NOT the build gate** — it validates syntax only, not
   TS-strict types (`noUncheckedIndexedAccess` caught `m[1]: string|undefined`
   that --check passed). The real pre-commit gate is ALWAYS `npm run build`.
