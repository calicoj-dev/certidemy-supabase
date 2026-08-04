# HANDOFF-v5.1-addendum.md

**Extends:** HANDOFF-v5.1.md
**Migration tip:** 170 · next free 171 (unchanged — no SQL here)
**Session date:** 3 August 2026, late

Front-end performance, measured rather than guessed. Mobile PageSpeed went
**67 → 81 → 87**, desktop **82 → 98**, CLS **0.313 → 0**. Three changes landed;
the remaining work is one thing and it is now precisely located.

---

## 1. I introduced a bug earlier the same day and removed it

`loading.tsx` was added to all four route groups. On the authenticated surfaces
that was right — before it, Next held the OLD page on screen unchanged for the
whole server render. On the **public marketing pages it was wrong**: it paints a
loader, then swaps in the content, which is a layout shift by construction.

Evidence at the time: FCP 1.8s, LCP 4.2s, **CLS 0.313, TBT only 30ms**. Low TBT
means JavaScript was not the bottleneck — something was painting and then being
replaced.

Deleting `app/[locale]/(marketing)/loading.tsx` took **CLS to exactly 0** and
mobile 67 → 81. Exactly zero is the proof: the loader was not a contributor to
the shift, it *was* the shift.

**The rule:** a route loader is a trade, not a free win. It helps where the
alternative is a stale screen. It hurts where the page would otherwise paint its
real content first.

Speed Index got *worse* (4.3s → 6.5s) and that is correct — the loader had been
flattering the "how fast does the viewport fill" measure by painting something
early that was not the page.

---

## 2. The wordmarks were 32-bit RGBA for a two-colour logo

**53.6 kB → 15.4 kB** across four files. Per page load, where two variants render
and CSS hides one: **27 kB → 7.5 kB**.

The resize was the smaller half of it. The sources contained **288 distinct
colours** stored as full RGBA — 32 bits per pixel for flat artwork. Palettising
to 256 colours (more than the artwork uses) took 12.4 kB → 3.5 kB on its own.
Resizing 1081×301 → 431×120 did the rest.

Fidelity verified at real display sizes, composited over both surfaces:
**mean channel difference 0.10/255 on dark, worst single pixel 15.** Invisible.

Also `priority` instead of `priority={false}` — it is the first element in the
header, and opting a logo out of eager loading delays it and then pops it in.

**Two corrections to what the component believed:**

- Its comment claimed browsers skip fetching a `display:none` image. PageSpeed
  listed **both** as downloaded. Chrome fetches both.
- `next.config.ts` has `images: { unoptimized: true }`, so **`next/image` does
  nothing here**. Every image is served at source size. This is the same finding
  as the `no-img-element` lint warnings, from the config side.

**`certiglobal-dark/light.png` (17.7 and 18.4 kB) are the same pattern and have
not been done.** Same dual-render badge, almost certainly the same flat artwork
as RGBA.

---

## 3. Cache headers

`public/_headers` added — there was none, so Pages served everything on a short
default TTL.

`/_next/static/*` immutable for a year: every filename carries a content hash, so
a changed file is a new URL and there is no cache to invalidate.

`/brand`, `/badges`, `/og` and the touch icon get **a week with
stale-while-revalidate, deliberately NOT immutable** — those filenames do not
change when the artwork does, which is exactly what happened when four wordmarks
were replaced in place. Lengthening it means renaming the file or purging.

**No HTML is cached.** Every route is server-rendered on demand and several are
per-user; a document rule would serve one learner's page to another.

Verified live: `curl -sI` returns `max-age=604800, stale-while-revalidate=86400`.

---

## 4. Where the remaining 1.8 seconds actually goes

This is the section worth reading before touching anything next time.

**Phase breakdown of a single request** (`curl -w`, from Colombia):

| phase | time |
|---|---|
| DNS | 0.03–0.05s warm (0.30s cold — a local resolver artefact, not a problem) |
| TCP connect | 0.12s |
| TLS | 0.14s |
| **Worker executing** | **0.76–1.4s** |
| transfer | 0.16s |

**TTFB by page** — this is the important table:

| page | TTFB | does |
|---|---|---|
| `/en/about` | 0.65s | no data |
| `/en/pricing` | 0.69s | no data |
| `/en/certifications` | 1.45s | catalog query |
| `/en` | 1.81s | three blueprints + family content |

It splits in two:

- **~0.65s is a floor** every page pays — Worker boot, layout, next-intl
  messages, the theme cookie. Data or no data.
- **Everything above it is Supabase.** The homepage spends **1.15s** on database
  round trips; the certifications page 0.8s. Not one slow query — several
  sequential trips to us-east-1 from a Bogotá PoP at 100–200ms each.

Repeated measurements were **2.03 / 1.93 / 2.04s** — tight. A cold start or a
flaky dependency would scatter. This is deterministic steady-state cost, which
means it is fixable rather than mysterious.

---

## 5. Cloudflare Smart Shield: ignore it

Cloudflare recommended it. It is the wrong tool and it would cost money for
nothing.

Smart Shield governs the path between Cloudflare's edge and an **origin server** —
tiered cache, connection reuse, Argo routing. **There is no origin here.** The
app runs on Pages and Workers; Cloudflare *is* where the code executes. Tiered
cache has nothing to tier toward.

And the 1.15s is not network latency between edge and origin — it is the Worker
waiting on Supabase. Argo cannot route around a database query. Smart Shield
governs inbound traffic to the zone, not outbound fetches from Workers, so it
does not cover the Supabase call either.

The measurements above show it plainly: Smart Shield operates entirely within the
first 0.56s, and there is nothing left to win there.

**General lesson:** Cloudflare recommends by pattern-matching traffic, not by
reading architecture.

---

## 6. What is left, and what is not worth chasing

**Static or ISR rendering for the marketing routes.** This is the whole remaining
prize and it fixes three flagged items at once: the document response, the
render-blocking CSS (which cannot start until the document finishes), and FCP.
It also sidesteps the 0.65s Worker floor entirely — a cached document runs no
Worker.

The homepage's data is three certifications' blueprints and family content:
domain weights, task statements, KSA. That changes when a JTA is revised. It has
no business being rendered per request.

**Treat it as an investigation, not a patch.** Every route carries
`runtime = "edge"` and `force-dynamic`, and `@cloudflare/next-on-pages` has
historically had limits around ISR. The first question is whether static or
revalidated rendering works on this adapter at all. Could be an hour, could be a
dead end — but nothing else moves the number.

**Not worth chasing:**

- **Legacy JavaScript, 11 kB.** Proved from the chunk contents that these are
  Next.js's own runtime polyfills (`webpackChunk_N_E`,
  `getDeploymentIdQueryOrEmptyString`). A `browserslist` was added anyway — it is
  correct to be explicit and it drives autoprefixer — but **it changed nothing**:
  the chunk hash was byte-identical after the build. Retranspiling settings
  cannot remove code that arrives already transpiled.
- **Render-blocking CSS, 150ms.** 490ms to deliver 1.6 kB is latency, not size.
  The CSS request cannot start until the document finishes, so this is the same
  fix as the item above, not a separate one.

**Watch:** "Reduce unused JavaScript" read 89 kB before the wordmark change and
154 kB after. Nothing in that change touches chunks, so this is probably a
different route being sampled or an attribution shift — but confirm with a second
run before anyone acts on it.

---

## 7. Method note

Every change tonight was **one variable, one measurement.** That is what let the
loader theory be confirmed rather than assumed — and what showed the browserslist
change did nothing, which would have been invisible if it had been bundled with
the wordmark work.

The corollary: check the build artefact, not just the build result. The
browserslist chunk hash being unchanged was the tell, and it was available before
the deploy rather than after.
