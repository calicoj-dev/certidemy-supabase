# HANDOFF-v1.9 — ADDENDUM 2

Appends to HANDOFF-v1.9.md + HANDOFF-v1.9-addendum.md. Records the launch-surface
run that finished the marketing/auth/legal polish. Read v1.9 + addendum-1 first;
this is the delta since addendum-1 (which ended at the Three.js removal).

---

## Commits since addendum-1 (all web repo, pushed)

- **13a6f03** — remove orphaned Three.js cert carousel + prune i18n (covered in addendum-1)
- **8abfac9** — verify front-door /verify (covered in addendum-1)
- **2f61b18** — brand+verify: magenta on verify pages, footer verify link, domain fallback
- **d658251** — auth facelift: magenta brand on login/signup, killed last GAIPC ghost
- **8d8d4ca** — legal: privacy + terms pages (EN, trilingual-ready), footer links
- **eb55bf6** — auth: password-reset flow (forgot + update password)

Supabase repo: tip 078 (unchanged; next 079). Web repo HEAD: eb55bf6.

---

## What shipped (delta since addendum-1)

### Verify surface — brand + discoverability (2f61b18)
- Opted /verify and /verify/[id] into the dark magenta brand theme
  (data-theme="dark", same mechanism as marketing). The verify DOWNLOAD button
  already had a dark-surface variant; the page wrapper was the missing half —
  this was a half-finished migration, now complete.
- Footer "Verify a credential" link -> /verify (nav.verifyCredential, 3 locales).
- Fixed the ONLY stale og/LinkedIn domain fallback: certidemy.pages.dev ->
  certidemy.com in verify/[id] metadata (swept, confirmed unique).

### AUTH OVERHAUL — COMPLETE (d658251 + eb55bf6)
The last Option-A piece. Done in two commits:
- **Facelift (d658251):** (auth) route group opts into data-theme="dark"
  (magenta). AuthShell showcase mesh retinted from Pro Blue literals to magenta.
  Panel copy moved to translated auth.showcase keys. **Killed the LAST GAIPC
  ghost** ("SM-I · GAIPC · MORE COMING" strip -> real cert line
  "SM-AI-I · SPO-AI-I · SD-AI-I · MORE COMING"). AuthShell is now async (calls
  getTranslations); both auth pages are async server components, composes fine.
- **Password-reset flow (eb55bf6) — the launch-must gap, now filled:**
  /forgot-password -> resetPasswordForEmail -> recovery email -> /auth/callback
  -> /update-password (updateUser on the recovery session) -> login. Fixed the
  FAKE forgot link (was href="/login"). New actions forgotPasswordAction /
  updatePasswordAction; AuthState extended with reset_sent / password_updated;
  auth.forgotPassword + auth.updatePassword i18n (3 locales). Both pages inherit
  the (auth) magenta theme.
  - SECURITY: forgot-password is EMAIL-ENUMERATION-SAFE — returns the same
    neutral "if an account exists..." success whether or not the address is
    registered; only rate-limiting is surfaced. Correct posture for a
    credentialing platform.

### LEGAL — privacy + terms LIVE (8d8d4ca)
- /privacy and /terms marketing routes, rendering full English policy content
  (lib/legal/content.ts) via a shared LegalDocument renderer. **Footer bottom-bar
  links are LIVE** (Privacy · Terms beside the rights line) — published, not
  gated. legal.* i18n chrome.
- es-419/pt-BR fall back to EN behind a "translation in preparation" notice.
- Content is a professional DRAFT tailored to the actual stack: Supabase /
  Cloudflare / Google / payment / email sub-processors named; public
  credential-verification disclosed prominently in BOTH docs; exam-integrity
  teeth in the ToS; GDPR + Colombia Ley 1581/1266 + Brazil LGPD rights covered.
- DECISION (Juan): publish as-is now rather than risk launching WITHOUT a
  privacy/terms section. Placeholder fill + counsel review is a pre-launch task,
  NOT a blocker.

---

## Infrastructure / config — RESOLVED this run

### Google OAuth — FULLY WORKING end-to-end
- Root cause of "provider is not enabled" was the Supabase provider toggle (not
  code — the OAuth code path was always correct). Juan enabled Google in
  Supabase (Auth > Sign In/Up > Auth Providers), created the OAuth client under
  a clean Certidemy Google Cloud project (the old client was under a stray
  Gemini project, which threw the branding off), set redirect URI
  https://pctynukndxnmnxiqpgck.supabase.co/auth/v1/callback, JS origins, and the
  consent-screen branding. Consent screen now reads "continue to Certidemy".
- Supabase redirect allow-list configured (certidemy.com/** + localhost) +
  Site URL. This ALSO satisfies the password-reset flow's email-link dependency,
  so reset works end-to-end.

### Still outstanding (Juan, dashboards)
- **NEXT_PUBLIC_SITE_URL=https://certidemy.com** in Cloudflare Pages env
  (Production) -> redeploy. Drives the LIVE LinkedIn/WhatsApp og-preview domain
  (code fallback is fixed to certidemy.com; env var is what makes it live).
  After setting: re-scrape shared links via LinkedIn Post Inspector to bust og
  cache (WhatsApp caches per-thread ~7 days).

---

## Backlog — pre-launch items (updated)

### Legal
- Fill bracketed placeholders in lib/legal/content.ts: legal entity name +
  address, governing jurisdiction, payment processor name, email provider,
  refund policy, GDPR Art. 27 representative (if required). + counsel review.
- Full es-419 / pt-BR legal translations (dedicated reviewed pass; currently
  EN fallback with notice).

### Cosmetic / polish
- npm audit review: 27 vulns (2 low/15 mod/9 high/1 critical) in the general dep
  tree, surfaced when uninstalling three — unrelated to our work. Triage.
- Per-credential rendered og:image (verify page uses a static fallback).

### Still open from v1.9 (unchanged)
- Scrum FAMILY PAGE + comparison chart (UNBLOCKED — pass-mark verified, chart
  rules agreed, verify feature strengthens the credential-verification row).
- Transparency-section SM->SPO->SD cycler (Juan's idea, endorsed).
- Nav transparency fix (top bar unreadable mid-scroll -> scrolled-state blur).
- Within-group cert order (Scrum group reads code-alpha SD/SM/SPO; one-line sort
  change for role order if wanted).
- Layer 2 DB-content i18n (cert description + cert_categories.tagline overlay).
- pricing/page.tsx untranslated chrome (same class, setRequestLocale-only).
- Transactional email: info@certiglobal.org is the CONTACT address; auth emails
  still send from Supabase default (custom sender = SMTP + SPF/DKIM DNS).
- is_published -> status RLS cutover + CERT-LIFECYCLE.md.
- GAIPC DB stub (22222222-…) delete-vs-draft decision.
- Carried v1.8 items (SPO concept audit, practice backfill, Credly, governance
  tab, PDF review, Scrum II JTAs, WCAG, etc.).

---

## Meta-lessons (append to prior lists)
8. **The node-script edit pattern is now the standard for multi-file / in-place
   edits.** Every edit this run went through a CRLF-safe node script that
   normalizes to \n, asserts each anchor, reports ok/FAIL, restores \r\n on
   write. Zero silent no-ops after adopting it (vs. the PowerShell .Replace()
   failures earlier). Applied to: verify-brand, footer-legal, actions-append,
   fix-login-forgot.
9. **"Config, not code" is the recurring auth diagnosis.** Google OAuth
   ("provider not enabled"), the consent-screen branding (wrong Google project),
   and the og-preview domain (NEXT_PUBLIC_SITE_URL) were ALL dashboard/config,
   never code. The code reads clean because it WAS clean. When an auth/social
   feature misbehaves, check the provider dashboards before touching the repo.
10. **Publish-with-placeholders beats missing-entirely for legal.** Juan's call:
    a live privacy/terms with bracketed blanks (filled pre-launch) is safer than
    forgetting to have them. The pages resolving + being footer-linked is what
    matters for the consent screen and baseline posture.
