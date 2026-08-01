# HANDOFF v4.7 — ADDENDUM

Two fixes landed after v4.7 was written. Read alongside it, not instead of it.

---

## A1. METADATA ROUTES MUST BE EXCLUDED FROM THE i18n MIDDLEWARE MATCHER

**The bug:** `app/sitemap.ts` and `app/robots.ts` shipped, appeared in the build
route table as `ƒ /sitemap.xml` and `ƒ /robots.txt`, and **returned the 404 page
at the only URLs that matter.**

`middleware.ts`'s matcher excluded `_next`, `api`, `favicon.ico` and a list of
image and font extensions — but not `.xml` or `.txt`. So `/sitemap.xml` matched
the middleware, next-intl saw no locale prefix, and redirected to
`/en/sitemap.xml`, which does not exist.

**Both files live at the DOMAIN ROOT and must never be locale-prefixed.**
Crawlers only ever request `certidemy.com/robots.txt`. A locale-prefixed copy
would not be found even if it existed.

Fixed by adding `robots.txt|sitemap.xml` and the `xml|txt` extensions to the
matcher's negative lookahead:

```
"/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|xml|txt)).*)",
```

**The generalisation, and it is the fourth instance of the same shape today:**
anything added under `app/` that Next treats as a metadata route needs TWO
checks that `npm run build` cannot perform —

1. does it carry `export const runtime = "edge"` (or is it a static asset type),
   which only the Cloudflare build enforces; and
2. is it excluded from the middleware matcher, which only a live request reveals.

**Test metadata routes in an INCOGNITO window.** A normal browser will have been
handed the redirect already and may replay it from cache after the server stops
sending it.

**Verified working:** `certidemy.com/sitemap.xml` serves 57 entries — 9 marketing
paths + 7 certifications + 3 programmes, times three locales — each with
reciprocal hreflang for all three languages plus `x-default`, including the
required self-reference. `robots.txt` serves all 17 agent blocks with `Host` and
`Sitemap`. Certification `lastmod` values carry real `updated_at` timestamps,
which confirms the Supabase read succeeded rather than failing open to an empty
list.

---

## A2. `new Date()` IN AN EDGE SITEMAP MAKES `lastmod` WORTHLESS

Static pages have no `updated_at`, so they used `new Date()`. On an edge route
that evaluates **per request** — so `lastmod` read "just now" on every crawl,
forever.

Google uses `lastmod` to prioritise recrawling and **explicitly discounts it when
it looks unreliable.** A site where every page changed thirty seconds ago is the
definition of unreliable, so the signal would have been lost rather than gained.

Replaced with a `CONTENT_UPDATED` constant in `app/sitemap.ts`. **Bump it when
marketing copy actually changes.** Certification entries use their real
`updated_at` and were never affected.

---

## A3. STILL OWED — unchanged from v4.7 §4

1. **Google Search Console** (Domain property, Cloudflare DNS TXT) and **Bing
   Webmaster Tools**, then submit `sitemap.xml`. **Nothing is indexed until this
   happens.** Bing feeds ChatGPT search. Expect 3–7 days to first crawl.
2. Per-page titles and descriptions via `lib/seo/metadata.ts` — 48 pieces of copy.
3. Delete the dead `certifications/family/` route tree.
4. JSON-LD: `Organization`, `EducationalOccupationalCredential`.
5. Decide whether `/verify/<code>` should be indexable.

---

## A4. THE RULE THIS SESSION KEPT PROVING

Four failures today, one shape:

| What | Build said | Reality |
|---|---|---|
| `app/icon.png` | green | Cloudflare rejected the deploy |
| Share button | green | copied nothing on desktop |
| Wordmark | green | rendered at 1081px intrinsic width |
| sitemap / robots | green, in the route table | 404 at the real URL |

> **`npm run build` tells you the code compiles. It never tells you what a
> stranger gets at a URL.** Every one of these was caught by opening the page,
> not by a check in the pipeline. Keep looking at the artifact.
