# HANDOFF v4.4 — Badges, names, and the disconnected OG renderer

Supersedes v4.3. Migration tip **167**, next free **168**. Checkpoint written
mid-session: the badge pipeline is ingested and the naming is settled, but the
`credential-og` rewrite has not started.

v4.3 has the review protocol and the patch-script rules; v4.0 has the
examination chain.

---

## 1. WHAT SHIPPED

**Seven badge PNGs are in the web repo** at `public/badges/<CODE>.png`, named by
certification code: `SM-AI-I`, `SPO-AI-I`, `SD-AI-I`, `AIGRM-I`, `AISM-I`,
`AIE-I`, `AIHR-I`. Design delivered them as `SMAI-I_`, `SPOAI-1_`, `SDAI-1_`
etc. — digit `1` and letter `I` mixed — and the ingest normalises on the way in.
**The filenames on disk are now canonical; do not re-derive them from whatever
design sends next time.**

Specs, verified rather than assumed: 501×501 RGBA, true alpha (0→255, not a
white matte), 19.7–23.1 KB each, trim consistent to within a pixel across all
seven (L73 T24 R73 B25). Total 152 KB, which is small enough to inline as base64
into the edge functions rather than fetch at render time.

**Migration 166 — certification names.** Dropped the `Certidemy ` brand prefix
and the redundant ` - AI` suffix from the four non-Scrum certs:

| Code | Was | Now |
|---|---|---|
| AIE-I | Certidemy AI Essentials I - AI | AI Essentials I |
| AIGRM-I | Certidemy AI Governance & Risk Management I - AI | AI Governance & Risk Management I |
| AIHR-I | Certidemy AI for Human Resources & Talent I | AI for Human Resources & Talent I |
| AISM-I | Certidemy AI Service Management I - AI | AI Service Management I |

The Scrum three were already correct and were not touched. The `— AI` suffix
survives only where it disambiguates from a generic Scrum certification; it
means nothing appended to a cert already named for AI.

Every target string was ASCII, so the SQL editor was safe. **Had the Scrum rows
needed editing, this would have had to go through an API loader** — an em-dash
in an editor paste is this project's documented source of double-encoded UTF-8.

**Migration 167 — `certification_i18n.name` nulled everywhere.** All 21 rows
already existed; only the English ones carried a name, and those had gone stale
the moment 166 ran. Cert names are product identifiers, like PMP or CSM. This
was already the documented rule — `load-cat-i18n.mjs:18` states it outright —
and 167 makes the data match a convention that had been enforced only by
accident in the non-English rows.

**`scripts/load-aihr-descriptions.mjs`** — new, committed, run. Filled
`certification_i18n.description` for AIHR-I in en / es-419 / pt-BR. Verified on
the live Spanish surface, not on the script's exit code.

**LinkedIn Company Page ID: `136038016`.** This is the unblock for the
Add-to-Profile flow (§4).

---

## 2. THE FINDING: `credential-og` IS BUILT AND DISCONNECTED

The verify page (`app/[locale]/verify/[id]/page.tsx`) already has an
Add-to-Profile button, already imports the LinkedIn icon, and already sets
per-credential OG metadata. Roughly a month old. **No handoff records any of
it.** This is v4.2 §4.5's failure mode in reverse — that document claimed a
feature existed when it did not; here a feature exists that no document claims.

`generateMetadata` sets `og:image` to `${SITE_URL}/og/credential-fallback.png`
— the static generic card. It never calls `credential-og`. The inline comment
says the per-credential card is a follow-up "once a working edge renderer is
confirmed."

**That confirmation happened in v3.2 §8** — the esm.sh default-export boot
failure was fixed, the function verified returning `200 image/png` — and nobody
came back to re-point the metadata. Proven again this session: the function
renders correctly today against `?code=AISM-I-SPEC-0001`.

Consequences live in production right now:

**Every shared credential previews the same generic card.** Same image for every
holder, every certification. This is the entire gap between what exists and what
a Credly share looks like.

**The fallback card advertises `certidemy.pages.dev`** — the retired domain.
v3.2 §7 fixed the hardcoded footer *inside* `credential-og`'s SVG but
`/og/credential-fallback.png` is a static file in the web repo and was never
regenerated. Wiring the real renderer retires the file.

**The OG card renders specimens as `ACTIVE`.** `credentials.status` is `active`
and `is_specimen` is a separate boolean; `credential-og` selects `status` and not
`is_specimen`, so `Certidemy Specimen` renders with a green dot, visually
identical to a real credential. `SALES-LIBRARY-SPEC.md` §8 names this exact
outcome a fraud vector. The verify *page* branches on
`cred.status === "specimen"`, so `verify-credential` is mapping the flag on its
way out — but `credential-og` queries the table directly and bypasses that
mapping. **Two consumers, one derived field, one of them doesn't know.**

---

## 3. HOW LINKEDIN ACTUALLY WORKS — two surfaces, two mechanisms

Established by research this session, and it changes the build.

**Licenses & Certifications** renders the *issuing organisation's Company Page
logo*, never the badge image. LinkedIn decides this. Without a numeric
`organizationId` resolving to a real Page, the entry shows a grey placeholder on
the learner's profile permanently.

**The feed post** renders `og:image` scraped from the shared URL. This is the
only place badge artwork appears.

Consequences:

- `organizationId=136038016` replaces the current free-text `organizationName`.
- **The issuer is Certidemy, not CertiGlobal.** The body making the certification
  decision is the issuer of record under 17024. CertiGlobal sells the exam.
- OG card is **1200×630** (LinkedIn's 1200×627 is functionally identical, and one
  file covers every platform).
- **WhatsApp is the binding constraint on file weight, not LinkedIn.** LinkedIn
  allows 5 MB; WhatsApp caps far lower, and WhatsApp dominates messaging across
  LATAM. Target under ~300 KB.
- LinkedIn caches previews ~7 days with no purge you control. **Version the
  og:image URL** (`?code=X&v=2`) — it is free now and unfixable later.

**Add-to-Profile writes a permanent copy.** The `name` parameter is a form
prefill, not a live link. Rename a certification afterwards and every profile
already carrying the old string keeps it forever. This is why the naming had to
settle before the first click, and why §1's migrations were blocking rather than
cosmetic.

---

## 4. ROUTES, CONFIRMED BY READING

```
app/[locale]/verify/[id]                            <- accepts UUID *or* credential_code
app/[locale]/(marketing)/certifications/[code]
app/[locale]/(marketing)/certifications/family/[slug]
app/[locale]/(marketing)/certifications/program/[slug]
```

**`certUrl` is the verify page, not the certification page.** A recruiter needs
proof this person holds it, not a brochure. `certUrl` uses `credential_code` so
it agrees with `certId` and survives retyping.

**`family/` and `program/` both exist with a `[slug]` each.** The queued rename
got half-done and one tree is dead. Kill the loser — carrying two parallel route
trees is how a fix lands in the one nobody serves.

---

## 5. RULES LEARNED

**A graceful fallback is also a silent coverage hole.** This is the durable one.
`tr?.description ?? c.description` degrades an untranslated cert to English with
no error, no blank, and no warning — a missing translation and a present one are
visually identical. AIHR-I shipped with no Spanish or Portuguese description and
nobody saw it for weeks. The comments all say "degrades to English rather than a
blank hero," which is correct as design and blinding as instrumentation.

The fix is a query, not a discipline. Standing check, belongs beside
`v_coverage_summary`:

```sql
select c.code, i.lang,
       i.claim is null       as claim_missing,
       i.description is null as description_missing
from public.certifications c
cross join (values ('en'),('es-419'),('pt-BR')) as l(lang)
left join public.certification_i18n i
  on i.certification_id = c.id and i.lang = l.lang
where i.claim is null or i.description is null
order by c.code, l.lang;
```

**AIHR-I is systematically the cert that gets skipped.** It is the seventh, added
after the pipeline scripts were written. `load-cert-descriptions.mjs` says "all
six certs" in its own header — correct on the day, wrong since. **Any script
whose header states a cert count is a script that has silently gone stale.** Grep
for `six certs` before trusting any loader.

**Nulling a column that call sites read is not safe by default.** `row ?
row.name : base.name` breaks when the row exists and the field is null; only
`row?.name ?? base.name` survives. All three read sites were checked by reading
the mapping body, not the lookup — `lib/console/library.ts`'s `pick()` bottoms
out at `?? null` and looks broken until you see `pick(r.id, "name") ?? r.name` at
the call site.

**Terminal rendering is still not evidence about file bytes.** `verify/[id]/page.tsx`
displayed `â€"` throughout under `Get-Content`; byte check returned
`C3A2 count: 0`. PS 5.1 decodes as ANSI. Same trap as `gov-flow.tsx` in v3.6.

**Chrome appends `(1)` rather than overwriting**, and across three badge
revisions the file sizes overlap. **Timestamp is the only reliable discriminator**
when de-duplicating downloads.

---

## 6. OPEN — BLOCKING THE OG REWRITE

Nothing. Badges are in, names are settled, org ID is in hand, renderer proven.

## 7. OPEN — DESIGN

**Header hex drifts within programme.** The programme colour-coding is deliberate
and good; the execution is loose. No two badges in a programme share a value:

| Programme | Codes | Hex found |
|---|---|---|
| scrum | SM / SPO / SD | `#04002A`, `#040033`, `#04003C` |
| governance-service-management | AIGRM / AISM | `#1E001E`, `#2D002D` |
| ai-workplace | AIE / AIHR | `#002734`, `#00232A` |

Three Scrum badges side by side in the catalog will read as a mismatched set.
Lands later as a pure drop-in — same filenames, same 501×501, same trim — so it
costs one script run and a redeploy.

**Wordmark PNG still outstanding.** The badges contain it but composited on a
dark band with the ™ baked in, not extractable. `factsheet.ts` has the insertion
point marked with exact lines. pdf-lib embeds PNG/JPG, not SVG.

**`/favicon.ico` still 404s on every page load.** Closes with the wordmark work.

---

## 8. OPEN — NOT SCHEDULED

- **`stripBrand()` is now dead code.** Deliberately left in place: removing it in
  the same pass as 166 would land a display change and a data change together,
  and a wrong-looking catalog afterwards would have two suspects. Separate commit.
- **`certification_i18n.description` duplicates English into the base column** for
  six of seven certs — the same drift 167 removed for `name`. But
  `load-cert-descriptions.mjs`'s header says the English rows are rewritten
  *deliberately*, "so the i18n table never drifts from the canonical column," and
  `claim` lives only in that table. Defensible as-is. **Do not relitigate without
  reading that header first.** Migration 168 candidate at most.
- Carried from v4.3, all still open: import `BlueprintTask` rather than restating
  it; the `is_provisional` split on `domain_translations`; public site vs
  documents on `is_provisional`; visibility/focus telemetry; certificate lacks
  competencies and scheme version; SM-AI-I task 4.12 missing from D4;
  `listCatalogGroups` never asks `cert_categories_i18n` for a label.
- Carried from v4.1 §9, owed by Juan: exam AI/internet policy and the middle of
  the fraud process; Level II attestation wording; counsel on Terms §5 and §12;
  ™ placement per `LAUNCH-READINESS.md`.

---

## 9. NEXT — THE `credential-og` REWRITE

In order, all in one function:

1. **`is_specimen` into the select**, and a specimen state on the card. This is a
   live fraud vector, not a polish item.
2. **Bundle the fonts.** Currently fetched from `raw.githubusercontent.com` at
   render time — not a CDN, rate-limited, no uptime commitment. With the WASM
   from unpkg that is three third-party fetches on every cold start of the most
   public endpoint you have. v3.2 §8 already cost a day to this exact class of
   failure on this exact function.
3. **Palette to `#be185d`**, Inter to match `certificate.ts`. The card currently
   draws `#ff2d72` in Poppins — the share card and the certificate are different
   brands and different typefaces.
4. **Composite the badge**, base64 from the generated module, as an `<image>`
   inside the SVG resvg already renders.
5. **Locale and expiry.** `credentials.locale` exists and is ignored; `expires_at`
   is already selected and used only to compute status. Expiry on the face is
   what reads as a certification body rather than a course platform.
6. **Delete the `AI-ERA` chip.** A hand-typed marketing claim derived by regex
   from the cert name, on a public artifact — the same thing v3.7 killed when
   "Proctored Run" became "Exam Run". Redundant once the badge is on the card.
7. **Fix truncation.** `trunc(holder, 24)` puts an ellipsis mid-name.
   `certificate.ts` already solved this with auto-shrink (v3.2 §9).
8. **Version the URL**, then point `generateMetadata` at the function. This
   retires `/og/credential-fallback.png` and its dead domain.
9. **`organizationId=136038016`** replaces `organizationName` in `linkedInAddUrl`.

Then: verify page badge hero, certification page badges, dashboard locked state
(greyscale filter on the same PNG — never a second asset).

---

## 10. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v4.4.md` first — v4.3 has the review
> protocol, v4.0 has the examination chain.
>
> Migration tip 167, next free 168.
>
> **The finding to carry:** `credential-og` is fully built, works, and is
> disconnected — `generateMetadata` points at a static fallback that advertises a
> dead domain, and the card renders specimens as ACTIVE. §9 is the rewrite, in
> order, starting with `is_specimen`.
>
> **The habit:** query before estimating, and treat a script header stating a
> cert count as an estimate too. `load-cert-descriptions.mjs` says "all six
> certs"; there are seven, and AIHR-I has been the missing one twice.
>
> **The rule that generalises:** every graceful fallback in this codebase is also
> a silent coverage hole. The i18n coverage query in §5 is a standing check, not
> a one-off.
