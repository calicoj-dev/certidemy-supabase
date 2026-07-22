# HANDOFF-v2.3 — Catalog Discovery + Full Cert i18n

*(supersedes the v2.2 draft; the cert detail page listed there as queued is now done)*

Delta from HANDOFF-v2.1. Everything below is committed and pushed.

**Migration tip: 113. Next migration is 114.**

**Note:** no migration 114 exists. The description work that would have been 114
went through an API loader script instead — see §3.5. The committed script is
the versioned record.

---

## 1. Neural Network Navigator — shipped

`components/marketing/network-navigator.tsx` is now the primary browse surface
on `/[locale]/certifications`, replacing the grouped-list block. Took four
passes; the reasoning behind each is worth keeping because two of the decisions
look wrong until you know why.

### Three states

| State | Left column | Right column |
|---|---|---|
| `overview` | 3 families, count + chevron | every cert as a 44px **chip** — code + name only |
| `family` | others dock to top as pills; selected centres, grows tagline + compare link | that family's certs expand to 96px **cards** — status, depth line, affordance |
| `cert` | unchanged | chosen cert expands to 200px **detail** — claim, depth, CTA; siblings shrink to chips |

Clicking a card body never navigates. Only the CTA does. A visitor can traverse
the whole catalog without leaving the page, then arrive at the cert page
already sold.

### Non-obvious decisions

**Canvas height is pinned across all states.** Every state's layout is computed
at mount and the canvas takes the tallest. This is the single thing that makes
the transitions read as smooth — the page never reflows, nodes just travel.

**Edges fade during transitions.** SVG path `d` cannot be CSS-transitioned. So
edges fade out (180ms), nodes glide (420ms), edges fade back in at the new
geometry. Reads as the network rewiring itself.

**The Tailwind transition class is a string literal, not a template.** An
interpolated `duration-[${MOVE_MS}ms]` is invisible to Tailwind's JIT scanner
and would never be emitted — nodes would snap. Keep the literal in sync with
`MOVE_MS` by hand.

**Ghost edges were deleted, deliberately.** The first cut drew a faint line from
every family to every cert it did NOT own, to make the default state feel
populated. It made the real edges unreadable, which defeats the only reason to
draw a network instead of a list. **If the canvas ever feels sparse again, the
fix is node density, never fake edges.**

**Brand prefix stripped for display only.** `stripBrand()` removes a leading
"Certidemy " from family labels and cert names. The wordmark is already in the
header; repeating it twice more per row was noise and was causing mid-word
truncation. DB values untouched.

### The capture-phase gotcha (cost a debugging cycle)

Outside-click-to-reset must be registered in the **capture** phase:

```js
document.addEventListener("click", onDocClick, true);
```

Selecting a family swaps its node from `<button>` (collapsed) to `<div>` (open);
a cert swaps `<button>` (chip) to `<div>` (detail). React replaces the element,
so a bubble-phase listener runs *after* the DOM changed, finds the clicked
element detached, concludes `canvas.contains(target) === false`, and resets the
selection that was just made. Symptom: click, brief flash of selection, instant
revert.

`e.stopPropagation()` does **not** save you here. Next.js App Router hydrates the
whole document, so React's delegated listeners are attached to `document` — the
same node as a naive outside-click listener. `stopPropagation` blocks listeners
on *ancestor* nodes, not siblings on the same node. Capture sidesteps the
ordering question entirely.

### Known limits

- Canvas is a hard 960px inside `max-w-5xl px-6` (976px content). 16px of slack.
  A padding bump clips it.
- A single-cert family (AI Workplace) opens to one card in a ~400px canvas.
  Sparse but not broken. If it bothers you, single-cert families should skip
  the family state and go straight to cert detail.
- `ROW_H` is fixed, so canvas height grows linearly with cert count. Fine at 6.
  Revisit around 12.

### The next layer (not built)

A fourth state fanning the selected cert into its **domains** is the natural
continuation, and a better third layer than the spec's original family → role →
level (every cert is level I today). Blocked on `listCatalogGroups` returning
domain titles, not just a count.

Level II certs (`SM-AI-II`, etc.) belong in a third column to the right of a
selected cert. **Not built on purpose**: there are no Level II rows, and
hardcoding them would break the DB-driven contract this component rests on.
When they exist as `draft`/`coming_soon` rows with a `predecessor_code`, the
column renders itself — roughly a 40-line change.

Rejected: making the CTA itself a network node. Metaphor must never outrank
"buy this."

---

## 2. `certification_i18n` — the real blocker, now fixed

`/es-419/` and `/pt-BR/` were rendering **English** cert copy on a platform whose
market is LATAM. This was a bigger credibility problem than any UI issue and it
still affects the cert detail page (see §4).

### Migration 113

```
public.certification_i18n (certification_id, lang, name, claim, description)
  PK (certification_id, lang)
  CHECK lang in ('en','es-419','pt-BR')
  RLS: select to anon, authenticated
  GRANT SELECT to anon, authenticated   <- RLS is not a grant
```

**Contract: fallback layer, not replacement.** `certifications.name/description`
stay canonical for English. Loaders left-join and coalesce, so a missing
translation degrades to English, never to blank. Adding a language is therefore
additive and cannot break an existing one.

`claim` has **no base column** — it is null until translated. The navigator
falls back to `description` when `claim` is absent, which is exactly what
`/es-419/` showed before the loader ran.

### The ASCII / accents split — important

- **Migration 113 seeded English only.** English claims are ASCII, safe to paste
  into the SQL editor.
- **es-419 and pt-BR loaded via `scripts/load-cert-i18n.mjs`.** Every string
  carries accents, and the SQL editor is this project's known source of
  double-encoded UTF-8. **Never seed accented copy through the editor.**
- Verified post-load: 6/6/6 rows, `claim like '%â€%' or claim like '%Ã%'` → 0.

### The locked claims (ISO/IEC 17024 scope statements)

Every claim opens with "Validates" so the catalog column scans as a set and the
form itself signals these are scope statements, not taglines. Each compresses
that cert's **JTA scope**, not its marketing description. Grok reviewed and
tightened AIGRM-I and AISM-I.

| Code | Claim (en) |
|---|---|
| SM-AI-I | Validates the craft of making Scrum work in AI-augmented teams. |
| SPO-AI-I | Validates agile product ownership when AI reshapes backlog, value, and roadmap. |
| SD-AI-I | Validates the engineering craft of building and verifying an Increment with AI in the loop. |
| AIGRM-I | Validates that the holder can establish and maintain organizational AI governance, risk, and control. |
| AISM-I | Validates that the holder can operate and assure AI-enabled services in production. |
| AIE-I | Validates that the holder can use everyday AI tools safely and with sound judgment. |

**These belong in each `SCHEME-<CODE>.md` as the formal scope statement.** Not
yet done. Marketing copy may expand on a claim; it must never contradict or
exceed it.

Names are **not** translated — cert titles are product identifiers, like PMP or
CSM. `name` stays null in non-English rows and falls back.

### Migration 112 — AIE-I description

Opened with "A freemium AI-literacy credential...". That describes the pricing
model, not what the credential validates; every sibling opens with a scope
statement. Rewritten, ASCII-only.

---

## 3. Loader + script conventions learned

**`listCatalogGroups(supabase, locale = 'en')`** — locale defaults so existing
callers keep compiling. Joins `certification_i18n` scoped to `lang`.

**`CatalogCert` gained `description?` and `claim?`, both optional.**
`getCatalogFamily` also constructs `CatalogCert`; a required field would have
broken that call site.

**Anchor uniqueness in patch scripts.** A patch anchored on
`supabase.from("domains").select(...)` matched twice — that line exists in both
`listCatalogGroups` and `getCatalogFamily`. The script fail-closed and wrote
nothing rather than applying 3 of 4 edits. **Keep the assert-before-write
pattern on every patch script.** Scope anchors with a neighbouring unique block.

**No `process.exit(0)` on a success path in a supabase-js script.** It keeps a
keep-alive HTTP handle open; forcing exit trips a libuv assertion on Windows
(`!(handle->flags & UV_HANDLE_CLOSING)`) that looks exactly like a crash. Let
Node drain and exit on its own; use `process.exitCode` for failures.

**Env var name is `SUPABASE_SECRET_KEY`** (Supabase's current name for the
service-role key). `load-lessons-direct.mjs` also accepts
`SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE`.

**Undocumented dependency worth recording in `PIPELINE-INDEX.md`:** `.env.local`
lives in `certidemy-web/`, but the loader scripts live in `supabase/scripts/`,
which has no env file. **Every loader script must be invoked from the
`certidemy-web` directory** or it cannot find credentials.

**Flag is `--dry`, not `--dry-run`** — unknown flags are silently ignored, so a
typo runs LIVE. Applies to the new `load-cert-i18n.mjs` too.

---

## 3.5 Cert detail page — trilingual (completed after v2.2 was drafted)

`getCertByCode(supabase, code, locale = "en")` now overlays
`certification_i18n` name/description. **Defaulted deliberately**: this is the
single cert resolver for every `/learn/[cert]/*` route, the detail page, and the
cert switcher. Only callers that opt in by passing a locale see translated copy.

The i18n row is a **second point-lookup**, not a PostgREST embed. An embed would
need a FK relationship name and would change the returned row shape, which this
function's many callers depend on.

### `scripts/load-cert-descriptions.mjs`

Writes the corrected English canonical descriptions **and** all 18 i18n
description rows (en/es-419/pt-BR x 6). **Not a migration**: em-dashes, accents
and an apostrophe in "Certidemy's" all corrupt through the SQL editor.

All non-ASCII in that script is written as `\uXXXX` escapes, so the file itself
is pure ASCII and survives any encoding hazard in transit; Node decodes to real
UTF-8 at runtime. Worth copying that habit for any future content loader.

The upsert carries **only** `description`, so the `claim` values written by
`load-cert-i18n.mjs` survive untouched. Verified: 6/6/6 rows/claims/descs.

### Two descriptions were realigned to their locked claims

Both opened with wording their own scope statements had already rejected:

- **AIGRM-I** said "govern AI responsibly in an organization" — the soft phrasing
  Grok rejected at claim level. Now "establish and maintain organizational AI
  governance, risk, and control", matching the claim exactly.
- **AISM-I** said "run and govern" against a claim of "operate and assure". Also
  trimmed from 120+ words to ~75.

**A description that contradicts its own scope statement is an audit finding.**
Whenever a claim changes, check the description in the same pass.

Grok's addition: **"across six domains"** on AISM-I. A description that lists
*some* domains implies it lists all of them; the clause signals the list is
representative without restoring the full inventory. Use the same device
anywhere else a description enumerates part of a scope.

Names are **not** translated in any language — cert titles are product
identifiers, like PMP or CSM.

---

## 4. Queued next, in order

1. **Enrollment shift to opt-in — IN PROGRESS, this session.** Goal: a fresh
   user has no certs assigned and self-enrols, ideally through a
   navigator-style surface. **This is an access-control change, not a UI task.**
   The auto-assign mechanism must be found and understood before anything is
   built on top of it — the dashboard / exam / quiz pages likely assume an
   enrollment row always exists and will throw when it doesn't. Will need a
   migration (114).

2. **Blueprint drawer labels.** `triggerLabel="Blueprint"` and
   `subtitle="Job-Task Analysis"` are hardcoded English in the cert detail page
   and stay English in all three locales. Small, visible on a Spanish page.

3. **Claims into the scheme docs.** Six `SCHEME-<CODE>.md` files need the
   locked claim as the formal scope statement.

4. **Optional third field:** a one-sentence "who this is for" per cert.
   Deferred — would have meant 36 sentences instead of 18 before anything shipped.

### Still-open non-blockers (carried from v2.1)

- `/certifications/family/[slug]` still says "family" in a public URL after the
  program terminology change. Needs a redirect, not just a rename.
- `lib/certifications/data.ts` comments contain mojibake (`â€"`, `Â·`) —
  comments only.
- SD-AI-I's "standard"-bucket D4 public sample is visibly about AI but its task
  concepts don't match the AI-era regex, so it renders without the badge.
- `sample-questions.tsx:127` eslint-disable isn't on the line the rule reports
  against (`react-hooks/exhaustive-deps` attributes to the dependency array
  line, not the `useMemo` opening). Warning only.

### Commercial-readiness assessment

Interaction: ~7.5/10, shipping-grade. Content: was 4/10 at session start because
of English copy on Spanish pages; **the catalog and the cert detail page now both
speak all three languages**, with claims consistent between the two surfaces.
Adding a fourth language is 6 claims + 6 descriptions through the existing
scripts.

Remaining known English-on-non-English surfaces: the blueprint drawer labels
(§4.2), and the JTA domain titles IF `loadBlueprint`'s locale overlay turns out
not to cover them — unverified at time of writing.
