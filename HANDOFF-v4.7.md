# HANDOFF v4.7 — Brand identity and the SEO foundation

Supersedes v4.6. Migration tip **168**, next free **169** (no DB work this
stretch).

v4.6 §2–4 (how LinkedIn sharing actually works) and v4.5 §0 (the `profiles`
privilege escalation, with checks still owed) are not repeated and both still
stand.

---

## 1. WHAT SHIPPED

**Favicon and app icons.** `app/favicon.ico` carries 16/32/48 in one file.
`public/apple-touch-icon.png` is opaque white with extra padding — iOS masks to
a rounded square and does NOT add a background, so a transparent PNG shows
through as black. `public/brand/icon-192.png` and `icon-512.png` for PWA.
**Closes the `/favicon.ico` 404 open since v4.3.**

**The real wordmark, on all six surfaces** — marketing header and footer, app
header, app rail, auth shell, 404. One component,
`components/marketing/wordmark.tsx`.

**Theme toggle in the marketing footer.** The theme cookie applies site-wide, so
a learner who chose light in the rail landed on light marketing with no control
there. Footer rather than header: the header already carries five nav items, the
locale switcher, sign-in and the primary CTA.

**Per-locale marketing OG cards.** `/og/default-en.png`, `default-es-419.png`,
`default-pt-BR.png`, wired in `app/[locale]/layout.tsx`.

**Credential cards follow the reader's language.** `credential-og` now takes
`?lang=` and the verify page passes its own locale.

**Positioning fixed.** `meta.description` said "for LATAM professionals" in all
three languages while the homepage hero already said "FOR PROFESSIONALS
WORLDWIDE". `scripts/patch-meta-worldwide.mjs`.

**SEO foundation.** `app/sitemap.ts`, `app/robots.ts`, `lib/seo/metadata.ts`,
and the removal of layout-level hreflang. See §4.

---

## 2. THE RULE THAT BROKE TWO DEPLOYS

**Next.js metadata files are ROUTES, and `@cloudflare/next-on-pages` rejects any
route without `export const runtime = "edge"`.**

`app/icon.png` and `app/apple-icon.png` are not static files to Next — the
metadata convention turns them into routes. The build failed twice with:

```
The following routes were not configured to run with the Edge Runtime:
  - /apple-icon.png
  - /icon.png
```

**A PNG cannot carry an export.** So raster icons must live in `public/`, not
`app/`. `favicon.ico` is fine — Next treats `.ico` as a static asset, and it was
never in the error list. iOS finds `/apple-touch-icon.png` at the site root by
convention with no link tag, so `public/` under that exact name works with zero
config.

**`app/sitemap.ts` and `app/robots.ts` hit the same rule but CAN carry the
export**, and both do. Anything added to `app/` that Next treats as metadata
needs the same check.

> **`npm run build` CANNOT CATCH THIS.** Plain `next build` succeeded both
> times. The edge-runtime check only runs inside `next-on-pages`, on Cloudflare.
> Every local gate this project uses is blind to an entire class of failure.
> **Watch the Cloudflare log, not the local build, after touching `app/`.**

---

## 3. BRAND ASSETS FOLLOW THE THEME, NEVER A CALLER PROP

`Wordmark` renders BOTH colour variants and lets CSS hide one, keyed off
`data-theme` on `<html>` which the server sets from the cookie — correct in the
first paint, no JS, no flash. Rules at `globals.css` `.wm-on-light` /
`.wm-on-dark`, mirroring `.cg-on-*`.

This is deliberate. `CertiGlobalBadge` used to take a `variant` prop chosen per
caller, and rendered a pale logo on a pale background the moment the app became
themeable. Six `Wordmark` call sites would have been six chances to repeat it.

**`h-auto` vs `w-auto` is not cosmetic with `next/image`.** `h-auto` lets the
`width` attribute drive and height follow. `w-auto` RELEASES the width
constraint, and with no height class the image renders at its intrinsic size —
1081px. One character shipped a wordmark that filled the header on every surface
with an unconstrained container. `CertiGlobalBadge` had it right; I didn't copy
it.

**`next/image` works fine on this deployment.** `certiglobal-badge` proved it.
Earlier caution about Cloudflare loaders was unfounded; the two remaining
`no-img-element` warnings (verify badge, dashboard medallion) can be revisited.

**Trademark:** TM once per page at first prominent use. The header renders the
wordmark before the footer, so the footer passes `tm={false}` and gets a cropped
variant. The crop is clean — the glyph sits past a 13px gap after the "y" and
both variants are re-padded to identical margins.

---

## 4. SEO — WHAT WAS WRONG, WHAT IS FIXED, WHAT IS OWED

### The site was structurally uncrawlable

No sitemap, no robots.txt, never submitted to Search Console. It does not appear
in Google results at all. **This is the best possible position to fix it from:
nothing has been indexed, so there is nothing to un-teach** — no wrong canonicals
cached, no `pages.dev` duplicate in the index, no penalty to unwind.

### Fixed

**`app/sitemap.ts`** — all three locales × 9 marketing paths + 7 certification
pages + 3 programme pages, each with `<xhtml:link rel="alternate">` for every
language plus `x-default`. Certifications are **read from the DB**, not
hardcoded: AIHR-I was already missed once by a script that said "all six certs"
when there were seven. Fails open — a sitemap missing seven URLs beats a 500.

Entries list locale-prefixed URLs directly, never `/`. Real-time AI search
crawlers have low tolerance for redirect hops, and `/` redirects to `/en`.

**`app/robots.ts`** — allows all three families of AI crawler explicitly, blocks
authenticated paths, declares the sitemap. See §5.

**Layout-level hreflang removed.** `app/[locale]/layout.tsx` set
`alternates.languages` to `/${locale}` — the locale HOMEPAGE — and layout
metadata applies to every descendant. So `/en/certifications` told Google its
Spanish equivalent was `/es-419`. **Wrong hreflang is worse than none**: Google
either discards it as inconsistent or believes it. A layout CANNOT fix this —
`generateMetadata` in a layout never receives the child's path.

**`lib/seo/metadata.ts`** — `buildMetadata({ path, locale, title, description })`
returns canonical, correct per-path hreflang for all three locales plus
`x-default`, OG and Twitter. Adoption is per page and is still owed.

### Owed, in priority order

1. **Per-page titles and descriptions.** Every page currently reports the same
   ones. Near-identical titles signal duplicate pages to Google. 8 pages × 3
   languages × title + description = **48 pieces of copy** — a writing task, not
   a code task. Title tags are the strongest on-page ranking signal; meta
   descriptions are NOT a ranking factor but drive click-through.
2. **Canonical on every page**, via the helper. Matters more than usual here:
   `certifications/family/[slug]` and `certifications/program/[slug]` both exist
   and serve the same content. **Deleting the dead tree is half the fix.**
3. **JSON-LD.** `Organization` on the homepage,
   `EducationalOccupationalCredential` on each certification page. Unusually
   high-leverage for a certification body, and AI assistants parse it directly.
4. **Google Search Console + Bing Webmaster Tools.** Five minutes, and **none of
   the above does anything until this happens.** Search Console as a *Domain*
   property (Cloudflare DNS TXT) covers all three locales at once. Bing feeds
   ChatGPT search.
5. **Decide whether `/verify/<code>` should be indexable.** Public pages carrying
   a holder's name. Credly indexes theirs and treats it as a feature. The helper
   has a `noindex` flag ready either way. **Decide it, don't inherit it.**

---

## 5. AI CRAWLER POLICY — three families, three decisions

Verified against current sources, not memory.

| Family | Agents | What blocking costs |
|---|---|---|
| Training | GPTBot, ClaudeBot, CCBot, Google-Extended, meta-externalagent | Content not used in model weights |
| AI search | OAI-SearchBot, Claude-SearchBot, PerplexityBot | **Removed from AI answers entirely** |
| User fetch | ChatGPT-User, Claude-User, Perplexity-User | Breaks a fetch the user explicitly asked for |

**Certidemy allows all three.** No rights objection to training, every reason to
want citations. This is the standard posture for a startup building AI
visibility.

**Google-Extended is only about Gemini training and grounding.** It has NO effect
on Googlebot crawling, indexing or ranking. Independent decisions.

**Bytespider is deliberately absent from robots.ts.** Documented ignoring
robots.txt at scale — a rule there would be theatre. If it becomes a load
problem the fix is a Cloudflare WAF rule.

Named agents are listed explicitly rather than relying on the wildcard: some
CDNs inject their own AI-blocking rules, and an explicit Allow makes the intent
legible.

---

## 6. OPEN STRATEGIC QUESTION — public lessons

**Not decided. Juan is thinking about it. Do not treat as settled.**

Seven certifications × 30–44 lessons × three languages is roughly **800 pages of
original expert content, all behind auth.** It is the largest SEO asset the
company owns and the only credible answer to Scrum.org, PMI and CertiProf, who
hold a decade of backlinks on the head terms. Long-tail Spanish and Portuguese is
winnable; "scrum master certification" is not.

**On ISO/IEC 17024:** publishing lessons is neutral-to-positive. The impartiality
concern when a body both trains and certifies is that training could confer
unfair advantage — **gating creates that structure; publishing dissolves it.**
The firewall that matters is the secure item bank, already enforced at the DB
level. **The standard is not the blocker.**

**The counter-argument, which is Juan's and is reasonable:** nobody in his peer
set operates this way. Scrum.org, PMI and CertiProf all gate. The account
captures leads.

**Middle path worth keeping in view:** the homepage CTA already says "Start a
free lesson" / "Empieza una lección gratis" — and you cannot start without an
account. One public lesson per certification is not a strategy change; it is
delivering what the button promises. 7 × 3 = 21 real content pages, tests whether
organic traffic materialises, commits to nothing.

**If it ever happens, sequence matters:** per-page metadata, then the dead route
tree, then JSON-LD, THEN open. Publishing 800 pages into the current metadata
state hands Google 800 near-duplicates with no canonical — worse than publishing
nothing.

**Nothing built this session forecloses it.** The metadata helper is path-based,
the sitemap takes new URLs in three lines, JSON-LD is per page. Opening later is
purely additive.

---

## 7. RULES LEARNED

**Missing metadata is not neutral — it is a wrong answer chosen by someone
else.** With no `og:image`, Facebook and WhatsApp scrape the page and pick an
image themselves. The largest one they found was `certiglobal-dark.png` in the
footer, so every marketing share previewed the PARENT brand.

**Chrome follows the reader; records follow the record.** `credential-og` used
`credentials.locale` — the language the exam was taken in — for card labels, so a
Spanish share of an English-examined credential rendered English chrome under a
Spanish title. Correct for the certificate PDF, wrong for a share card. Now
`?lang=` from the page, falling back to the record.

**Any fixed font size on translated text is a bug waiting for a longer
language.** Bit twice: the specimen bar overflowed in pt-BR, and the es-419 OG
tagline is four characters longer than English. Both auto-fit now.

**`--dry` and the live run look identical except for the last line** (carried
from v4.6, bit again). Verify by grepping the target for a token the patch
introduces.

**Read raw bytes to BUILD an edit, not only to verify one** (carried). Every
anchor built from `[System.IO.File]::ReadAllText` matched first try; both built
from piped `Get-Content` failed.

---

## 8. OPEN — CARRIED

- **The three `profiles` post-run checks from v4.5 §0.** The escalation-refused
  test must run FROM THE BROWSER as a non-admin; the SQL editor runs as service
  role and proves nothing.
- **User-editable display name** (v4.6 §5). `score-mock-exam` must read
  `profiles.full_name` BEFORE a settings page exists.
- **Five certificate PDFs stale** after the v4.5 name migration — console
  Regenerate is the audited path.
- **`family/` and `program/` route trees both live.** Now an SEO problem as well
  as a tidiness one.
- **Header hex drifts within programme** — pure drop-in when design returns it.
- **`CredentialSeal` still draws a `ShieldCheck`** in the header chip; the badge
  at ~44px would make the emblem consistent everywhere. Check legibility first.
- **`CERT-PUBLISH-CHECKLIST.md` needs:** badge PNG committed and
  `gen-badges-module.mjs` re-run. The badge `src` is built from
  `certification_code`, so a cert published without artwork renders a broken
  image on two public surfaces.
- **Regenerate `lib/supabase/types.ts`** so `.from("credentials")` stops
  inferring `never`.
- Everything in v4.5 §10 and v4.6 §6.

---

## 9. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v4.7.md`, then v4.6 §2–4 and v4.5 §0 —
> neither is repeated and §0 has security checks still owed.
>
> Migration tip 168, next free 169.
>
> **First:** Google Search Console (Domain property, Cloudflare DNS TXT) and Bing
> Webmaster Tools, then submit `/sitemap.xml`. The sitemap and robots.txt shipped
> but **nothing is indexed until this happens.**
>
> **Then §4 owed, in order:** per-page titles and descriptions via
> `lib/seo/metadata.ts` (48 pieces of copy), delete the dead `family/` route
> tree, JSON-LD.
>
> **Do not treat §6 as decided.** Public lessons is an open strategic question
> Juan is still weighing.
>
> **The habit:** query before estimating, read bytes to build an edit, and after
> anything touching `app/` watch the CLOUDFLARE log — `npm run build` cannot see
> the edge-runtime rule that broke two deploys.
>
> **The rule that generalises:** a check that succeeds is not a feature that
> works, and absent configuration is not neutral — someone else supplies the
> default. RLS passing is not a grant. `navigator.share` existing is not the OS
> delivering your text. No `og:image` is not "no image", it is the crawler
> picking your parent brand's logo.
