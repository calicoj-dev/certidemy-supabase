# HANDOFF-v1.9 — ADDENDUM 3

Appends to HANDOFF-v1.9.md + addendum-1 + addendum-2. Covers the family-page +
final-i18n + nav-polish run. Read v1.9 and addenda 1-2 first; this is the delta
since addendum-2 (which ended after the auth overhaul + legal pages).

---

## Commits since addendum-2 (all web repo, pushed)

- **2f54893** — feat(family): Scrum family page + comparison chart (initial)
  *(then trilingual + business link folded into the same feature line — see below)*
- **feat(family)** — trilingual family content + business compare link + month-year date
- **4782c60** — i18n(home): translate the sample-questions transparency section
- **b7c5f89** — fix(nav): scroll-reactive header  *(REVERTED — see below)*
- **c40e7ea** — Revert of b7c5f89
- **fix(nav)** — solid surface bg on header pill + mobile menu (the kept nav fix)

Supabase repo unchanged (tip 078; next 079). Web HEAD after this run: the
mobile-menu solid-bg commit.

---

## What shipped (delta)

### Scrum FAMILY PAGE + comparison chart
- New data-driven route `/certifications/family/[slug]`. Renders a family header,
  a role narrative (Scrum Master facilitates / Product Owner owns value /
  Developer builds the Increment), and an anonymized comparison chart. Pages
  render ONLY where editorial content exists (no thin pages) -> currently `scrum`.
- `getCatalogFamily(supabase, slug)` added to `lib/certifications/data.ts`
  (mirrors listCatalogGroups bucketing, scoped to one category).
- Editorial content in `lib/certifications/family-content.ts`, now LOCALE-KEYED
  (full en / es-419 / pt-BR), `getFamilyContent(slug, locale)` with EN fallback.
- `components/marketing/comparison-chart.tsx` renders the chart (first column =
  Certidemy, highlighted; horizontal scroll on mobile; sticky feature column).

- **COMPARISON CHART — integrity rules (recorded, do not weaken):**
  - Competitors are ANONYMIZED and LOCALIZED (Competitor / Competidor /
    Concorrente A/B/C). Cells describe common approaches among alternative
    certifications in neutral category terms — NOT claims about any specific
    named provider. This was Juan's explicit call and is the safest framing
    (nothing to be wrong about, nothing disparaging).
  - No adjectival praise/disparagement. No price row. "Global", not a region.
  - Certidemy cells are verifiable: 80Q / 90 min / 80%; AI tested in every
    domain (migration 052); the public verification page we built.
  - Footnote states the columns are generalized + unattributed, "as of" date.
  - `asOf` renders MONTH + YEAR only (day-level precision read oddly).

- **Entry points:** "Compare the family" link on the catalog page (gated to
  families with editorial content) AND "See how we compare" in the `/business`
  hero CTA row (family.businessCompare, 3 locales). The business placement is
  the primary one — the chart's real audience is the team buyer, not the
  individual browsing the catalog.

### Public site now FULLY TRILINGUAL (last surface closed)
- `components/marketing/sample-questions.tsx` (the "See it before you trust it"
  home transparency block) had NO translations hook — all chrome hardcoded EN.
  Wired `useTranslations("home")` into both the list component and QuestionCard
  (hooks placed BEFORE early returns — rules of hooks), swapped: section
  heading, "new questions" button, the practice-bank note, "Practice question"
  label, and "Correct"/"Not quite" -> `home.sample*` keys (3 locales).
- The "AI-era" badge stays UNTRANSLATED on purpose — consistent with the other
  AI-Era brand badges (blueprint/verify). The sample QUESTIONS themselves were
  already multilingual via the get_public_samples rpc.
- With this, every public surface — marketing, catalog, detail, verify, auth,
  legal, family page, transparency section — is trilingual end to end.

### NAV polish — solid header + mobile menu (scroll-reactive REVERTED)
- First attempt (b7c5f89) made the header scroll-reactive (transparent floating
  pill at top -> blurred surface bar on scroll). Juan preferred a simpler
  always-solid bar. REVERTED (c40e7ea) + deleted the ScrollAware sentinel.
- **DESIGN DECISION (recorded):** solid nav beats scroll-reactive HERE. The
  scroll-morph pattern earns its complexity over a photographic hero; Certidemy's
  hero is typographic magenta-on-black and the nav is a floating PILL, so an
  always-solid, always-readable pill reads as more intentional — and it drops a
  scroll listener from every marketing page. Simpler + more robust + better-looking.
- Final fix: header pill AND mobile-menu panel now use a SOLID
  `bg-[var(--color-surface-lift)]` (+ border, + blur on the pill), dropping the
  shared `.glass` (dark theme was 62% -> see-through). The shared `.glass` token
  is UNTOUCHED so decorative panels (auth showcase, business CTA) keep their
  translucency. The mobile menu especially needed full opacity: it's
  position:fixed over the hero with nothing solid behind it.

---

## Infrastructure / config — resolved this run
- **Google OAuth consent branding fixed:** now reads "continue to Certidemy"
  (not the raw supabase host). Root cause was the OAuth client living under a
  stray Gemini Google Cloud project; recreated under a clean Certidemy project
  with App name + authorized domain + branding set. Free, not a Supabase paywall.
  The provider dashboards remain the place to look first for auth/social issues.

---

## Backlog (updated)

### Still outstanding (Juan, dashboards) — unchanged
- **NEXT_PUBLIC_SITE_URL=https://certidemy.com** in Cloudflare Pages env
  (Production) -> redeploy -> drives live og-preview domain; then re-scrape via
  LinkedIn Post Inspector.

### Pre-launch content
- Fill bracketed placeholders in lib/legal/content.ts (entity, jurisdiction,
  payment processor, email provider, refund policy) + counsel review.
- Full es-419 / pt-BR LEGAL translations (privacy/terms currently EN-fallback).

### Enhancements (non-blocking)
- Transparency-section SM->SPO->SD cycler (Juan's idea, endorsed).
- Within-group cert order (Scrum reads code-alpha SD/SM/SPO; one-line sort for
  role order SM/SPO/SD if wanted).
- Layer 2 DB-content i18n (cert description + cert_categories.tagline overlay).
- pricing/page.tsx untranslated chrome (setRequestLocale-only).
- npm audit review (27 vulns, general dep tree).
- Per-credential rendered og:image (verify uses static fallback).
- Additional families for the family-page system (only `scrum` has editorial
  content today; `getFamilyContent` returns null -> notFound for others).

### Carried (unchanged from prior addenda)
- Transactional email (SMTP + SPF/DKIM for @certiglobal.org sender; info@ is the
  CONTACT address only); is_published -> status RLS cutover + CERT-LIFECYCLE.md;
  GAIPC DB stub (22222222-…) delete-vs-draft; SPO concept audit; SM/SPO practice
  backfill to >=10/task/lang; Credly; governance tab; PDF expert review;
  Scrum II JTAs (coming-soon first, do NOT build the II generator); WCAG mode.

---

## Meta-lessons (append to prior lists)
11. **Node-script anchors fail on INDENTATION mismatch — reconstruct exact
    whitespace, don't eyeball it.** Bit us twice this run (sample-questions:
    anchors were 2 spaces over-indented; mobile-menu: 2 over again). Both times
    the FAILs were "anchor not found," not a logic error. The reliable diagnostic
    is a whitespace-bracketed dump: `'{0,4}|{1}|' -f $i, $_` shows exact leading
    spaces between the `|` markers. When a multi-line JSX swap can be expressed as
    a UNIQUE inner substring, prefer that (indentation-independent) over matching
    the whole indented block.
12. **Watch for the `MM` double-staged git state after a failed apply.** A partial
    apply can leave a file both staged AND working-tree-modified (`MM` in
    `git status --short`). A fresh `git checkout -- <file>` fully clean-slates it
    before re-running; otherwise the next apply reports "already applied" on the
    staged remnants (confusing but harmless — the confirm grep is the truth).
13. **Don't out-opaque a translucent utility by LAYERING — replace it.** Adding a
    `color-mix` bg ON TOP of `.glass` still showed the glass's own 62% background
    + blur through. The fix was to drop `.glass` on those elements and set a
    solid surface bg. For a position:fixed overlay over content, only fully
    opaque reads correctly.
14. **`present_files` is required for the user to download — writing to the
    scratch dir isn't enough.** Missed it once this run (fix-nav-opacity.mjs);
    the file existed server-side but never appeared as a download.
