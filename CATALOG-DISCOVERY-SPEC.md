# Catalog Discovery — Build Spec

**Feature area:** how visitors find the right certification on Certidemy.
**Status:** designed & prototyped in the visualizer (no Certidemy code written yet).
**Angle:** "certifications for the age of AI" — the discovery UX itself should feel AI-era.

This spec captures every decision from the design session so the real build starts
from a plan, not a blank page. Two features, two pages, one coherent visual language.

---

## 1. Summary — two features, two jobs

Finding a cert splits into two different user mindsets, so it gets two tools:

| | **AI Path Advisor** | **Neural Network Navigator** |
|---|---|---|
| Job | Advise the confused ("I don't know what I need") | Let the decided browse ("show me what you have") |
| User | Cold / first-time / overwhelmed | Warm / knows roughly what they want |
| Primary home | Hero / main page (centerpiece) | Certifications page (main browse) |
| Also appears | Certifications page (slim entry point) | — |
| Motion | Static input → guided lit path reveal | Calm ambient network, drill on click |

Both are rendered in the same **neural-network visual language** so the site reads as
one AI-era product, not two unrelated widgets. This coherence is a deliberate goal.

---

## 2. Page architecture & hierarchy

Same two features, prominence flipped per page so they complement rather than compete.

**Hero / main page** — advisor is the star:
- Headline + "not sure where to start? tell us your goal."
- AI advisor input as the centerpiece (large, magenta-accented, `Chart my path`).
- Example goal chips below the input.
- Trust markers row: ISO/IEC 17024-designed · trilingual (en/es-419/pt-BR) · verifiable credentials.
- Quiet escape hatch: "or browse all certifications →" (for the already-decided).

**Certifications page** — navigator is the star:
- Page title + one-line subtitle.
- **Slim advisor entry point** near top: single-line invitation ("not sure which fits?
  describe your goal → **Ask the advisor**"). Subordinate, not the full walk-through.
- "Explore the catalog" divider.
- **Neural network navigator** as the main event, filling the page.

Rule of thumb: on the hero, *advise* is primary and *browse* is the escape hatch; on
the catalog page, *browse* is primary and *advise* is the escape hatch.

**Handoff between them (planned, not yet prototyped):** an advisor result's "Open →"
on a recommended cert should be able to drop the user into the navigator focused on
that cert; the navigator should carry a quiet "not sure? describe your goal" link back
to the advisor. Two doors into the same catalog.

---

## 3. Feature 1 — AI Path Advisor ("prompt-to-path")

### 3.1 What it does
The visitor describes their goal in natural language ("I'm a project manager for agile
teams building with AI", "I'm new to AI but my dev team is using it more and more").
The system reasons over the live cert catalog and returns a **short, ordered,
personalized learning path** — 2–5 certs, foundational → advanced, each with a
one-sentence "why this fits you."

This is the headline "age of AI" moment: the catalog behaves like an advisor, not a
shelf. It directly solves the real reason people bounce off cert catalogs ("I don't
know which one I need").

### 3.2 Result rendering — the guided neural path
The result is **not** a stack of blocks. It renders as a **lit trail through a neural
field** (the fusion of the advisor with the navigator's visual language):

- Recommended certs appear as glowing nodes connected in sequence by curved edges with
  traveling signal dots.
- Faint neural background texture (decorative nodes + edges) so it reads "inside a
  network," not a plain list.
- A **guided walk**: after the path lights up, it auto-steps node → node (step 1 of N,
  step 2 of N…), revealing each cert's "why" in a detail panel as it lands. One-time
  walk, not a continuous loop.
- After the walk, **clicking any node** re-focuses it and re-shows its reason.
- Family color per node; `coming soon` certs badged.

Why the trail beats blocks: it **scales**. Whether the AI returns 2 certs or 5, it's a
trail the eye follows, with the "why" revealed per node — never a growing wall of text.

### 3.3 Production architecture
```
browser → Supabase edge function → Claude API (key server-side)
                ↑ live cert catalog from DB (locale-aware)
        ← structured JSON (path + reasons) ← 
browser renders the guided neural path
```
Never call the Claude API directly from the browser (the prototype does, only because
it's a sandbox). The edge function keeps the API key secret and owns cost, caching,
rate-limiting, and the guardrails below.

- Model: current Anthropic small/fast model (prototype used a Sonnet-class model).
- Input to model: the user's goal + the cert catalog as JSON (code, name, family,
  level, status, focus keywords) pulled live from the DB in the request locale.
- Output from model: strict minified JSON only —
  `{"summary": string, "path": [{"code": string, "reason": string}]}`.
- Post-process: **filter path to codes that exist in the catalog** (model can't invent
  a cert), map codes → full DB rows for rendering.

### 3.4 Guardrails — it is a cert advisor, not a free chatbot
Critical requirement (Juan's concern: "don't want them using it as regular AI"). All
enforced in the edge function, not the UI:

1. **Locked system prompt.** "You are Certidemy's certification advisor. You ONLY
   recommend certifications from this catalog. If the user asks anything unrelated to
   certifications or career paths, respond with an empty path and a one-line redirect
   ('I can only help you find the right Certidemy certification.')."
2. **JSON-only output channel.** The function returns structured JSON (path + reasons)
   and nothing else. There is **no free-text pipe back to the user** — even a
   successful off-topic completion is parsed for cert codes and yields "no match."
   Someone typing "write me a poem" or "explain quantum physics" gets a redirect, not
   a chatbot answer.
3. **Rate-limit per session / IP.** A few calls, then a cooldown. Kills anyone trying
   to abuse it as a free LLM.
4. **Input length cap.** A goal is a sentence or two; reject long walls (also blunts
   prompt-injection attempts).

Between the locked prompt, JSON-only output, and rate limits, it structurally cannot
be used as a general assistant.

### 3.5 Caching & fallback
- **Cache** results keyed on a normalized goal string (+ locale). Common goals recur
  ("I'm a project manager…"); serve cached paths for free. This kills most cost at scale.
- **Keyword fallback (already prototyped).** A deterministic local keyword-scoring
  match over the catalog. Two uses:
  - The **always-on free default** — instant, zero-cost; "✨ Ask our AI advisor" is the
    richer Claude-powered upgrade the user opts into.
  - The **graceful degradation** — if the Claude call fails/times out, return the
    keyword match so the user never hits a dead end (the prototype retries 3× with
    backoff, then falls back, and shows a status dot: teal "live AI reasoning" vs amber
    "offline fallback").

### 3.6 Cost model (decided)
Each call is a fraction of a cent (small prompt in, short JSON out). At ~100k hits,
even heavy advisor use is a few hundred dollars — trivial against conversion (if even
~5% buy vouchers it more than pays for itself). **Decision: keep the advisor live,
throttle for hygiene (cache + rate-limit + submit-not-keystroke + keyword default),
do NOT take it down.** Don't optimize away the best conversion tool to save lunch money.

### 3.7 i18n
Inherits the trilingual angle for free: the catalog is queried in the request locale,
and the model answers in the language of the goal (a Spanish/Portuguese goal → Spanish/
Portuguese summary + reasons). Cert names/codes come from the localized DB rows.

---

## 4. Feature 2 — Neural Network Navigator (catalog browse)

Replaces the sun-and-orbit as the primary catalog browser. Chosen because it's the
**general, easier navigator** — calmer, clearer, and it rhymes visually with the
advisor (both neural), giving the site one coherent language. The orbit was "a bit much
for a working storefront"; the network is the storefront.

### 4.1 What it does
Left-to-right layered network. Families are input nodes on the left; selecting one fires
signals to its roles (next layer), then to its levels/certs (final layer). The lit path
you've chosen stays glowing; signal dots travel the active edges; a faint neural texture
sits behind. Clicking a terminal cert opens its detail/page.

Maps the taxonomy directly: **family → role → level**, with "advancing to level II/III"
reading as going deeper into the network. Calmer than the orbit (nothing rotates; the
only motion is signal dots), and the hierarchy is obvious (progression reads L→R).

### 4.2 Structure & scaling
- Columns/layers by taxonomy depth: families → roles → levels.
- Keep any single layer to ~3–7 nodes for elegance; 8–12 crowds a column vertically
  (same lesson learned from the orbit stress test). Design families in **tiers**
  (family → role → level), not flat lists — the network rewards good taxonomy.
- Scales cleanly: Scrum's eventual 9 certs (3 roles × 3 levels) never show as a crowd;
  you only ever see ~3 nodes per layer.

### 4.3 Data source (DB-driven — hard rule)
**Nothing hardcoded.** All families, roles, levels, cert names, codes, statuses, and
stats come from the DB so that changing the DB changes the site (no redeploy) and
content is automatically localized. Use the existing catalog loaders:
- `listCatalogGroups()` / `getCatalogFamily(slug)` for family-of-certs data
  (both scope `.neq("status","draft")` so `coming_soon` certs appear, badged).
- NOT `getCertByCode` for the family/tree data.

### 4.4 Notes carried from the sun-and-orbit design session
The orbit is parked (see §6) but its hard-won interaction lessons transfer to any
motion-based navigator we build, and are worth keeping on record:
- **Nothing auto-advances.** No timed "it moves forward on its own" — that was flagged
  as a terrible experience. Every consequential action waits for an explicit click.
- **Click brings a body front/center; click it again goes forward** (open/enter).
  Click empty space releases / resumes. A labeled center is the "back" affordance.
- **Depth occlusion matters** if anything orbits (bodies must pass *behind* the core,
  not in front) — solved via a real middle layer + depth-flipped z-index.
- **Ephemeral detail, not permanent.** A second moving ring of live stats was tried and
  cut — "too confusing since they're spinning in the background." Stats belong on a calm
  static surface (the cert page), not orbiting. Applies to the network too: keep the
  browse calm; put rich detail on the destination, not in the moving field.

---

## 5. Shared technical constraints (both features)

From the Certidemy stack — these are non-negotiable for the real build:
- **Next.js 15.1.4 App Router, Cloudflare Pages edge.** Every route
  `export const runtime = "edge"`.
- **`export const dynamic = "force-dynamic"`** on the catalog/marketing pages so DB
  changes (status flips, new certs, edited stats) render live without a redeploy. (This
  is the caching fix already shipped as `ea132df` for the cert pages — the navigator and
  advisor pages need it too.)
- **No Three.js** (weight + edge-runtime incompatibility). Everything is CSS/HTML +
  `cos/sin` math + `<canvas>` 2D. All prototypes proved this is enough.
- **`prefers-reduced-motion`** honored — freeze ambient motion into a static, readable
  arrangement when the user asks for reduced motion.
- **Mobile fallback** — the animated network needs a clean mobile list/stack fallback
  (same pattern as `module-journey.tsx`'s `md:hidden` list).
- **next-intl v3.26** locale-aware throughout; author any static strings clean (no
  mojibake — ASCII/clean-UTF8, per the encoding playbook).
- Tailwind v4, shadcn/ui, existing button variants only
  (link/primary/accent/glass/outline/ghost/destructive).

Reference implementation for orbit/network physics:
`components/dashboard/module-journey.tsx` (v2.3, ~214 lines: half-wheel, radial-gradient
hub, cos/sin rim, distance-based scale/opacity falloff, cubic-bezier transitions,
upright labels, mobile list). NOTE: that file currently contains mojibake in its
`S` localization strings + comments (`ContinÃºa`, `lecciÃ³n`, em-dashes) — clean it in
the toolchain encoding pass; author the new components clean from the start.

---

## 6. Parked — sun-and-orbit catalog selector

The sun-and-orbit (central eclipse core, families orbiting a tilted 3D plane, drill +
breadcrumb-constellation trail) is **not** the catalog navigator. It's the *showreel*,
not the storefront — "as much as I like it, the network is the general easier navigator."

Its home is a **marketing / hero flourish** (a landing animation, an about-page
centerpiece, a social clip) — somewhere wow serves a purpose and doesn't carry
load-bearing navigation. Fully designed and prototyped; can be revived for that purpose.
Locked design details if revived: eclipse core (dark disc + glowing corona ring, no
starfield, radius ~38), TILT 0.42 elliptical orbit, magenta/family-color palette,
drill + constellation trail with dashed line-to-core, click-to-front-then-forward,
depth occlusion, no auto-advance, no inner stat ring.

---

## 7. Build sequence (suggested)

1. **Navigator, static first.** Build the neural network from real catalog data
   (`listCatalogGroups`/`getCatalogFamily`), families → roles → levels, on the
   certifications page. Force-dynamic, reduced-motion, mobile fallback. No advisor yet.
   `npm run build` green before push.
2. **Advisor edge function.** Supabase edge function: locked prompt, DB catalog as
   context (locale-aware), JSON-only output, code-filtering, rate-limit, input cap,
   caching. Test the guardrails (off-topic → redirect; injection → rejected).
3. **Advisor UI — keyword fallback first.** Ship the deterministic keyword match as the
   free default + graceful-degradation path. This works with zero API cost and de-risks
   the UI.
4. **Advisor UI — guided neural path + live Claude.** Wire the edge function; render the
   guided lit-path reveal with per-node "why." Live/fallback status indicator.
5. **Place on pages.** Advisor centerpiece on hero + slim entry on certifications page;
   navigator as certifications-page main. Tune per-page hierarchy.
6. **Handoff wiring.** Advisor result "Open →" → navigator focused on that cert;
   navigator "not sure?" → advisor.
7. **(Later)** Orbit as a marketing hero flourish, if/when wanted.

---

## 8. Open questions (decide at build time)
- Advisor: cap on path length (prototype used 2–5). Confirm the max.
- Advisor: does a vague goal trigger **one clarifying question** ("more delivery-side or
  governance-side?") before charting? (A real advisor move — nice-to-have, not v1.)
- Navigator: exact layout when a family has many roles (vertical crowding at ~7+).
- Advisor result: add a "what to skip / what's next" layer, or keep to path + why?
- Caching TTL and normalization rules for the goal-string cache key.

---

*Captured from the design session. All prototypes were built in the visualizer with
placeholder catalog data; no Certidemy code was written. The reasoning, interaction
models, and architecture above are the deliverable — the real build follows this plan
against live DB data.*
