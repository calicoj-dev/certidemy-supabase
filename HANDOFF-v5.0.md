# HANDOFF-v5.0.md

**Previous:** HANDOFF-v4.9.md
**Migration tip:** 168 · **next free number: 169** — this session ran no SQL.
**Session date:** 2 August 2026
**Repos touched:** both

Two unrelated pieces of work: the certificate template redesign that v3.2 §9
set up eight months ago finally landed, and the app's perceived latency turned
out to have a cause nobody had looked for.

---

## 1. What shipped

### Certificate v3 — the redesign loop closed

v3.2 §9 described the loop: designer builds to spec → hands back coordinates →
engineering translates into `certificate.ts` → deploy → Regenerate. That loop
ran this session, with the design arriving as a PNG mockup rather than a spec.

`CERTIFICATE_RENDERER_VERSION` 2 → 3.

**The mockup was 843 × 596 px against an A4 landscape page of 841.89 × 595.28
pt.** One pixel to the point, so every coordinate was measurable directly rather
than inferred. That is why the numbers in `CERTIFICATE-LAYOUT-v4.md` are exact
and not approximations.

Three new `_shared` modules, all inline for the reason `badges.ts` documents —
Deno at the edge cannot read the web repo's `public/`, and this project has paid
twice for render-time external dependencies on these exact functions:

- **`cert-art.ts`** (89 kB) — the border ornament and the signature as SVG path
  data flattened into page coordinates. Traced with potrace from the mockup and
  from Juan's signature PNG, then verified by rebuilding the render from the
  flattened paths alone and diffing against the proof: **0 differing pixels, max
  delta 0**. Rounded to 3dp afterwards, which costs 1391 subpixels at a max
  delta of 18/255 and halves the file.
- **`wordmark.ts`** (18 kB) — the Certidemy wordmark trimmed to its ink at
  native 989 × 178, ~369 dpi at the certificate's 193pt width. Replaces the word
  being set as Inter Bold text. **This also closes the "Wordmark PNG pending"
  item `factsheet.ts` has been carrying since v3.7** — that renderer still has
  its insertion point marked and can now import this.
- **`certificate.ts`** — rewritten to the approved layout.

What changed on the face:

| | before | after |
|---|---|---|
| eyebrow | CERTIFICATE OF ACHIEVEMENT | **CERTIFICATE OF COMPETENCE** |
| frame | two plain hairline rectangles | traced ornament, `#E40064` |
| badge | none | 85 × 108 at top left |
| code mark | none | `AIGRM-I™`, 16pt Bold, `#be185d` |
| expiry | none | **EXPIRES beside ISSUED** |
| seal | a disc with a "C" in it | gone — the badge replaces it |
| signature | none | vector, 100pt wide |
| wordmark | the word, set in Inter Bold | the actual mark |
| dates | `toLocaleDateString` long form | compact, hand-rolled table |

"Certificate of Achievement" had been flagged since v3.6 as course-completion
language for a competence certification. The seal was flagged in v3.7 as reading
weakly in magenta, with the note "leave it — the design team's badge replaces
it." It has.

**`expires_at` was a real defect and survived three correct things.** The DB has
the column, both callers already selected it, and `CertificateData` looked
complete — but neither caller passed it into the object, so it never reached the
renderer. Nothing errored. This is the kind of gap that a green build, a correct
interface and a correct query all fail to catch.

### Route loading states

**There was no `loading.tsx` anywhere in the app.** Combined with
`dynamic = "force-dynamic"`, that means Next holds the *old* page on screen,
unchanged, for the entire server render. A 900ms render reads as three seconds
because for 900ms the app looks broken rather than busy.

Four files, one per route group — `(app)`, `(learn)`, `(marketing)`, `console` —
each covering every page nested beneath it. `components/brand/brand-loader.tsx`
renders the imagotipo with a slow opacity-and-scale breath, and holds still
under `prefers-reduced-motion`.

Not a spin: the imagotipo has a descender and is not radially symmetric, so
rotating it reads as the logo being mishandled rather than as progress.

### Auth round trips: four per render → one

`supabase.auth.getUser()` is a **network call to Supabase Auth**, not a cookie
read — correctly so, and it must not be swapped for `getSession()`, which only
reads cookies and can be spoofed. But nobody had counted the calls.

A single `/dashboard` render made four: middleware, the `(app)` layout, the
page, and `loadHomeData`. Four validations of the same JWT, at roughly 100ms
each from South America.

- **`lib/supabase/user.ts`** wraps it in React's `cache()`, which memoises on
  the function reference for the lifetime of one render. First caller pays the
  round trip, the rest await the same promise. Not a stale-data cache — it
  cannot outlive the render, so there is no invalidation to get wrong. The three
  server-side call sites now go through it.
- **Middleware is guarded** on the presence of an `sb-*-auth-token` cookie.
  Logged-out visitors on the marketing site were paying a round trip to validate
  a session that did not exist, on every navigation. The gate is unchanged —
  absent cookie means null user, which is exactly what `getUser()` would have
  returned — and logged-in users still refresh on every request.

Middleware cannot be converted to `cache()`: it runs in a separate invocation
before the render begins, so it has no render to share.

---

## 2. Rules learned this session

**A size-changing inline run reserves advance width at the PARENT's size.**
The code mark was first written as a `<tspan>` at 55% for the ™. The renderer
reserved advance for it using the 16pt parent metrics while drawing the glyph at
8.8pt, and opened a **35.5pt hole** before the trademark — against 3.0pt between
the letters themselves. Draw each run as its own element at an x computed from
font metrics. pdf-lib forces this anyway, which is the only reason the proof and
production now agree.

**Verify a font subset by decoding its cmap, not by reading its header.**
`fonts.ts` says its coverage includes "tm". That happens to be true, but the way
to know is to base64-decode the format-4 table and look for a segment containing
U+2122. There is one. The `%` incident in v3.7 is what a wrong assumption here
costs: loud on the page, silent in the text layer.

**`next/image` is not configured for Cloudflare Pages in this repo, and the
build will not tell you.** The signal was two existing plain `<img>` tags in
`verify/[id]/page.tsx` and `command-deck.tsx`, each eating a `no-img-element`
lint warning. `@cloudflare/next-on-pages` has no Image Optimization API without
a custom loader. A `next/image` builds clean and fails in production — the same
class as a missing edge export, where only the Cloudflare log catches it.
**Read the lint warnings as evidence about the environment, not as noise.**

**Verify layout by pixel collision, not by eye.** Rendering the frame layer and
the content layer separately, dilating the frame by 3pt and counting overlapping
non-white pixels catches near-misses that look fine at screen resolution. It
found the QR caption sitting 2pt from the box edge and the badge overlapping the
certification name's band — neither visible in a review.

**A QR quiet zone is not optional.** The first build used `border: 0` and the
frame's own box outline sat inside the required 4-module clear area. Fixed, the
symbol decodes from a full page rendered at 100 dpi.

**Design mockups reintroduce retired tokens.** The artwork came back carrying
`#0066CC` — Pro Blue, removed from both PDF renderers in v3.7 — plus two magentas
that were neither `#E40064` nor `#be185d`. Check a delivered design against the
palette before building to it.

**Raster artwork has a resolution ceiling, and enlarging it makes things worse.**
The badges are 501 × 501 with 356 × 452 of ink. At 108pt that is exactly 301 dpi.
130pt would be 250. More prominence needs bigger source art, not a bigger box.

**Column geometry can veto a date format.** `toLocaleDateString` with
`month: "long"` gives "30 de septiembre de 2026" — 127.4pt at 10pt, against
111pt between the ISSUED and EXPIRES columns. A hand-rolled month table is also
immune to ICU data differing between runtimes.

**PowerShell:** `Move-Item` to a path containing `[locale]` needs `-LiteralPath`
on the **destination**, or the brackets are read as a wildcard character class
and the move goes nowhere. And clear Downloads *before* downloading, not after —
Chrome appends `(1)` rather than overwriting.

---

## 3. Open loops

**`app-nav.tsx` and `mobile-nav.tsx` run identical logic in the browser.**
Each does `getUser()` then a `team_members` lookup — four client round trips per
page to decide whether one admin link renders. It belongs resolved once in the
server layout and passed down as a prop. It does not affect the server render,
which is why it was not part of this fix, but it is why the nav settles a beat
after the page.

**~40 `getUser()` call sites are unconverted.** Every console page, every learn
page. Each is a round trip that `cache()` would collapse. The three on the
dashboard path were done because that is the page that was measured; the console
is the heaviest surface and is the obvious next target.

**`CERTIFICATE-DESIGN-SPEC.md` (v3.2 §9) now describes a layout that no longer
exists.** `CERTIFICATE-LAYOUT-v4.md` replaces it. Delete or supersede the old
one before it misleads someone.

**`CERT-PUBLISH-CHECKLIST.md` should gain an `expires_at` line.** The defect
survived a correct interface, a correct query and a green build; the checklist is
the only place that would have caught it.

**`factsheet.ts` and `credential-og` can both now use `wordmark.ts`.** The
factsheet has its insertion point marked with exact lines. The OG card renders
its own brand treatment and would be more consistent using the same asset.

Carried from v4.4 and still open: badge header hex drifts within programme
(three Scrum badges, three different navies) — a corrected set lands as a pure
drop-in, same filenames, same 501 × 501, same trim. `/favicon.ico` still 404s.

**All seven certifications are `available` — built, published, live.** Verified
against `public.certifications` on 3 August 2026. Any note anywhere claiming a
cert is draft or mid-build is stale; check the column, not a handoff.

---

## 4. Next session prompt

> Continuing Certidemy. Read `HANDOFF-v5.0.md` first — v4.3 has the review
> protocol, v4.0 has the examination chain, `CERTIFICATE-LAYOUT-v4.md` has the
> certificate geometry.
>
> **The finding to carry:** `getUser()` is a network round trip and nobody had
> counted them. Four per dashboard render, now one. Roughly forty call sites
> remain unconverted, mostly in `/console`, which is the heaviest surface.
>
> **The habit:** read lint warnings as evidence about the environment. Two
> `no-img-element` warnings were the only signal that `next/image` does not work
> on this deploy target, and a build would never have said so.
>
> **The rule that generalises:** a green build proves compilation, not
> behaviour. `expires_at` had a column, a query and an interface, and still
> never reached the renderer.
