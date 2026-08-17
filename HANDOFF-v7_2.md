# HANDOFF v7.2 — The identifier namespace moves, and four things that were already broken

**Session date:** 2026-08-16 / 17
**Supersedes:** HANDOFF-v7.1

**Migration tip 217. Next free 218.** Two migrations this session: 216 and 217.
**Repos:** three now. See §0.2.

The Open Badges 3.0 identifier namespace moved to an isolated Cloudflare Worker at
`credentials.certidemy.com`, issuer-scoped so a partner issuer needs no code
change. Along the way four pre-existing defects surfaced, one of which had been
live in production for an unknown period.

---

## 0. State summary

### 0.1 The numbers

| | |
|---|---|
| Migration tip | **217** (216 `base_url`, 217 cutover) |
| Certifications | 11, all `available` — **AIMS-IA is no longer draft**, confirmed by a live 200 |
| Real credentials | 1 (`SM-AI-I-ZZMV-JPC8`, Julio) |
| Identifier host | `credentials.certidemy.com` |
| Human host | `certidemy.com` (unchanged) |
| Public edge functions pinned | 5 of 5 |
| `deno check` | clean on `open-badge` and `credential-og` — first time ever |

### 0.2 THERE IS A THIRD REPO NOW

| repo | path | remote |
|---|---|---|
| web | `certidemy\certidemy-web\` | `calicoj-dev/certidemy` |
| supabase | `certidemy\supabase\` | `calicoj-dev/certidemy-supabase` |
| **worker** | `certidemy\credentials-worker\` | **none — local only** |

The worker is committed locally (`b782aff`, branch `main`) but has **no remote**.
It is the surface every credential's verification depends on and it exists on one
disk. Create a GitHub repo and push it.

**It is deliberately NOT git-connected to Cloudflare.** Deploy with
`npx wrangler deploy` from that folder. Wiring it to a repo that auto-deploys would
mean a push to the marketing site could take down credential verification — the
exact coupling the Worker exists to remove.

---

## 1. THE NAMESPACE — what the URLs are now

```
IDENTIFIERS  ->  credentials.certidemy.com
  /issuers/<slug>                        issuer Profile + public key
  /issuers/<slug>/achievements/<CODE>    Achievement definition
  /issuers/<slug>/status/<n>             Bitstring Status List
  /credentials/<CODE>                    the signed credential

HUMAN        ->  certidemy.com
  /badges/<CODE>.png                     badge artwork
  /certifications/<code>                 criteria page
  /verify/<CODE>                         verification page
  /credentials/<CODE>                    VIEWER-AWARE copy (see below)
```

Issuer-scoped because two issuers may legitimately define achievements with the
same code, and an identifier that collides is not an identifier. Credentials stay
flat because `credential_code` is UNIQUE platform-wide.

**`certidemy.com/credentials/<CODE>` deliberately still serves and is NOT
redirected.** It is viewer-aware — the holder's copy carries their salted email
hash — and the dashboard bundle export calls it with a session. Cookies do not
cross to the subdomain, so redirecting it would silently strip the holder's
identifier. Both documents carry the same `id` (the subdomain URL); a document's
`id` is not required to be its only access path.

`/issuer`, `/achievements/<CODE>` and `/status/<n>` on the apex now **301** to the
new namespace. They must answer forever — they are inside every `.jsonld`
downloaded before the cutover — but they must not SERVE, because after 217 those
documents declare ids on the credentials host and returning one from the old
address is a document claiming a URL it was not fetched from.

---

## 2. MIGRATIONS

### 216 — `issuers.base_url`

Separates the identifier namespace from the human site. `site_url` had been doing
both jobs. Backfilled to `site_url`, so **deliberately inert** — every derived URL
was byte-identical after it ran.

### 217 — the cutover

```sql
update public.issuers
set base_url   = 'https://credentials.certidemy.com',
    issuer_url = 'https://credentials.certidemy.com/issuers/' || slug,
    updated_at = now()
where slug = 'certidemy';
```

`site_url` NOT touched.

**THE ORDER IS THE WHOLE POINT.** `open-badge` rebuilds and re-signs documents on
every fetch — nothing is frozen server-side — so this UPDATE was live for every
holder the instant it committed. Running it before the Worker existed would have
made every credential name an unresolvable issuer.

Correct sequence, if this is ever done again:

1. add the column, backfilled inert
2. code derives every URL from it — output unchanged
3. build the new host, prove all four paths anonymously
4. **flip the column**
5. 301 the old paths

### `issuer_url` has no live readers

Grepped across both repos at cutover: zero hits outside the select list and a doc
comment. `issuerUrl()` in `_shared/ob3.ts` computes it from `base_url + slug`. The
column is kept in sync because it is UNIQUE NOT NULL from 185 and records what a
given issuer's identifier is.

### The accepted cost

A `.jsonld` downloaded before 217 names `certidemy.com/issuers/certidemy` in
`proof.verificationMethod`. The legacy path 301s, so a redirect-following verifier
reaches a valid document — but its `id` differs from what the frozen copy names,
and a strict verifier rejects that mismatch.

One credential existed. **Julio must be told to re-download** if he ever did.

A `base` override in `open-badge` was designed and rejected: it would have kept
both namespaces working forever at the cost of a permanent legacy branch nobody
would remember the reason for.

---

## 3. THE WORKER

`credentials-worker/src/index.js`, ~200 lines, deployed as `certidemy-credentials`,
custom domain bound in the dashboard (DNS auto-created, zone on the same account).

It generates nothing and reads nothing. It proxies to `open-badge`, which holds the
private key under service_role and is the only place the key is touched.

**Direct to Supabase, not via certidemy.com.** Both prior OB3 outages were failures
of the CHAIN, not the document generator — a redeploy silently re-privatised the
gateway, and next-intl's matcher had to be hand-carved to leave four paths alone.
Proxying through the Next.js app would have kept that dependency behind a new
hostname: isolation in name only.

Hardening, all verified against the running Worker:

| behaviour | verified |
|---|---|
| Never forwards `Authorization` | by construction |
| Never forwards client query params | `?doc=issuer` on a credential path returned the CREDENTIAL |
| Path segments validated before reaching a query string | uppercase slug 400, `status/0` 400 |
| `/` redirects to `/verify` | 302 |
| Unknown paths 404 | `/issuers`, `/random` |
| GET/HEAD only | POST 405, OPTIONS 204 |
| Upstream unreachable is 502, not 404 | a verifier must distinguish "does not exist" from "we are down" |

---

## 4. DEFECT — JSON-LD safe mode was failing on two documents

1EdTech added a JSON-LD **safe mode** requirement to the Open Badges 3.0 Issuer
certification profile in December 2025: an error is raised whenever a term in the
document is not defined by any of its contexts.

Two of four documents failed. Found by a new checker, not by anything existing.

**`/issuer`** — `verificationMethod` did not expand. OB3's Profile class has no such
property and VC v2 defines it only INSIDE `proof`. Fixed by adding
`https://www.w3.org/ns/controller/v1` as a new `PROFILE_CONTEXT`.

**Deliberately NOT added to `VC_CONTEXT`.** The context array is hashed into every
credential's proof config; widening the shared constant would change the signed
bytes of every document for a term only the Profile uses. Verified after deploy that
the credential still carries exactly two contexts.

**`/status/N`** — type `Profile` was a relative `@type` reference; the document
carried only `credentials/v2`. Now uses `VC_CONTEXT`. Chosen over dropping
`issuer.type` (which also passes) because `Profile` is correct and the same issuer
block appears in `buildCredential` — one shape across all four documents.

**All four pass, plus all eleven certifications' Achievement documents.**

`scripts/check-jsonld-safe-mode.mjs` is the regression test. **It belongs in
`CERT-PUBLISH-CHECKLIST.md` beside `check-ob3-endpoints.ps1`.**

---

## 5. DEFECT — `credential-og` was returning 401 in production

Found while auditing which public functions were pinned.

The `og:image` meta tag emits the raw function URL. LinkedIn's, Twitter's and
Slack's crawlers carry no Supabase key. **Every credential share card was dead** from
whichever redeploy dropped `--no-verify-jwt` until this session. v4.5 verified it
working through Post Inspector; nothing since.

It rendered fine in a browser, because a browser never fetches `og:image`.

**Fourth occurrence of this exact failure class.** `verify_jwt` defaults to true, so
a function made public by a deploy flag is public as a property of one command, not
of the repo.

Anonymous probe, before and after:

| function | before | after |
|---|---|---|
| `open-badge` | 200 | 200 |
| `get-credential-certificate` | 200 | 200 |
| `verify-credential` | 200 unpinned | 200 pinned |
| `get-certification-blueprint` | 200 unpinned | 200 pinned |
| `credential-og` | **401** | 200 `image/png` |
| `get-governance-snapshot` | 401 | 401 — correct |
| `revoke-credential` | 401 | 401 — the control |

**The rule applied: pin only what must answer a caller holding NO KEY AT ALL.** The
anon key is a valid JWT to the gateway, so anything called from an authenticated
browser or with the anon key does not need this and must not get it.
`get-governance-snapshot` goes through `supabase.functions.invoke()` which attaches
the session; pinning it would have removed a real layer for nothing.

`get-certification-blueprint` was fetched from the BROWSER with no headers at all
and was working only on an unrecorded flag.

---

## 6. DEFECT — 30 `deno check` errors across two functions, none of them new

`deno check` had never been run on this repo. Deno was not installed.

**13 in `credential-og`, 17 in `open-badge`.** Both measured against HEAD before and
after, so the attribution is evidence rather than assertion.

**supabase-js infers row types by PARSING the `.select()` string as a
string-literal type.** A string built by concatenation is not a literal type, so
inference degrades to `GenericStringError`, which has none of the columns the code
then reads.

Both functions had concatenated selects. Both had untyped rows since they were
written.

Two consequences worth stating:

- in `credential-og`, the untyped block is the one that decides whether a card
  renders the SPECIMEN band. A typo in `is_specimen`, `status` or `expires_at` would
  have been silent, and the failure mode is a demonstration credential that shares
  as real
- in `open-badge`, `signDocument(issuer, ...)` had been type-broken since OB3
  shipped: `SigningIssuer` required a non-null `public_key_multibase` that
  `IssuerRow` declares nullable. The `base_url` refactor removed that field from the
  interface and fixed it by accident

Also fixed: `new Response(png, ...)` — Deno 2.x tightened `Uint8Array`'s generic and
`BodyInit` now wants `Uint8Array<ArrayBuffer>`. Type-level only, but on the hot path
of every render.

**`deno check` should run before every function deploy.** It is clean now for the
first time, and that only stays true if something enforces it.

---

## 7. THE STATUS LIST BUG THAT HAD NOT BITTEN YET

The revoked-credentials query in `open-badge` had **no issuer filter**:

```js
.eq("status", "revoked")
.eq("is_specimen", false);
```

With one issuer that is correct by accident. With two, every issuer's status list
would carry every other issuer's revocations — and a bit index meaningful in one
list lands somewhere arbitrary in another. Silent corruption of both.

Now `.eq("issuer_id", issuer.id)`.

`ISSUER_SLUG` as a module constant is gone; the slug comes from the request
(`?issuer=`, defaulting to `certidemy`), so a partner issuer resolves without a
redeploy.

---

## 8. THE SHARE CARD IS NOW THE BADGE, CENTRED, ON WHITE

`OG_RENDERER_VERSION` 2 → 3.

The v2 card was a two-column layout in Certidemy's palette — dark ground, accent
rail, holder name, cert name, issued/expires, credential code, our domain. Good
card, does not scale: **a partner issuer's badge rendered in our chrome
misattributes it at the moment it is most visible.** The alternatives were a
per-issuer template system, a palette field, a font decision per tenant, and a
review process for all of it.

Badge-on-white makes the artifact the issuer's. The rule stated to a partner is one
sentence: *upload a 512×512 PNG; we centre it on white.*

`og:title` already carries what the image gave up — holder, credential and issuer,
in text, which is also where a screen reader finds it.

**The specimen band survives, and appears ONLY when a credential is not simply
active.** A band reading "ACTIVE" is noise on the common case and trains a reader to
ignore the band. All three live specimens carry `status='active'`, so `is_specimen`
is the only thing distinguishing them — v4.5 §3's fraud vector. Rendered and
eyeballed in en, es-419 and pt-BR; the Portuguese string is the longest in the
system and `fitSize` handles it without clipping.

**No keyline.** Considered and rejected: the badge should float, not be framed.

### The cache-buster that never existed

The `?cert=` caller in `certifications/[code]/page.tsx` **sent no `&v=` at all.**
Certification cards had never had a cache-buster. Bumping the credential caller
alone would have invalidated credential cards while leaving every certification card
serving the v2 dark design from a crawler cache for about a week — two visual
generations of one brand in the wild simultaneously.

v2 builders retained UNREFERENCED in the file. **Delete them after a Post Inspector
pass on a real credential, a specimen and a revoked one.**

---

## 9. CERTIFICATION PAGE — badge, balanced title, real breadcrumb

**The badge** renders centred above the title, `w-44 md:w-56`, `alt=""` and
`aria-hidden` (the h1 beside it already says the name; describing the image would
make a screen reader announce it twice).

**Rendered conditionally against `BADGE_CODES`, not derived from `cert.code`.** All
eleven live certs have a PNG; the guard is for the twelfth, which will reach
`available` before design delivers its badge, and an unconditional `<Image>` renders
a broken-image icon on a public marketing page.

**`text-balance` on the h1.** The names were orphaning — "AI" alone on line two for
SPO-AI-I, "Management I" for AIGRM-I — because the browser fills line one greedily.
Balance evens them and fixes every name including ones not yet written.

**The title stays.** Replacing it with the badge was considered: the cert name
inside a badge is pixels — not indexable, not selectable, invisible to a crawler.
Deleting the page's primary ranking signal to show a picture of it works against
everything v6.0 did for crawlability.

**The code moved to the catalog line as a breadcrumb.** It was already in the badge
artwork, so above the title it appeared twice stacked over a title saying the same
thing in words. Left-aligned while the hero is centred: navigation on a different
axis from content is how a reader tells chrome from page.

**`BreadcrumbListJsonLd`** added to `components/seo/json-ld.tsx`, reusable —
`certifications/family/[slug]` and `certifications/program/[slug]` have the same
trail shape and **emit no structured data at all** today.

Two items, no phantom Home crumb: structured data must describe the visible page,
and the wordmark already goes home. Last item carries no `url` because it is the
current page. Label comes from `t("catalogBack")` — the same string the visible link
renders, verified clean in all three locales ("Catalog" / "Catálogo" / "Catálogo",
no arrow, no full stop).

Verified live: `https://certidemy.com/es-419/certifications/spo-ai-i` emits the
Spanish label and the `/es-419/` URL.

---

## 10. Rules earned

**Line endings are per-file, and can be mixed WITHIN one file.** `ob3.ts` CRLF,
`open-badge/index.ts` LF, `middleware.ts` LF. `verify/[id]/page.tsx` was 546 CRLF /
552 LF and `certifications/[code]/page.tsx` 309/316 — six and seven bare-LF lines in
otherwise-CRLF files. Detect at read time; never assume. Under `core.autocrlf=true`
normalizing the working copy is a **zero-diff** operation, confirmed.

**`[System.IO.File]::ReadAllText` with a relative path resolves against .NET's
working directory, not PowerShell's.** It silently read a file from
`C:\Users\Juan\` and produced a codepoint dump of entirely the wrong file. Always
`Join-Path $PWD` or a full path.

**LOOSE STATEMENTS PASTED INTO AN INTERACTIVE PROMPT WROTE THE WRONG FILE. AGAIN.**
Second occurrence — v6.2 §7.1 was the first. A `ReadAllText` threw on a missing
file, `$t` kept a value from a command earlier in the session, `return` did not stop
execution because each pasted line is its own statement, and `WriteAllText` wrote
17 kB of `page.tsx` into `HANDOFF-v7_2.md`. Caught immediately; nothing in either
repo was touched. **All file edits go through a scripted `.ps1` or `.mjs` with a
fresh scope. No exceptions, including for "one-line" corrections — that is exactly
when the rule gets waived and exactly when it bites. If a correction is smaller than
the machinery to apply it, edit it in an editor.**

**An anchor must be unique in the file AS IT WILL BE WHEN THAT EDIT RUNS.** Inserted
code is part of the file for every subsequent anchor. One patch inserted a function
containing the exact two lines the next anchor targeted, creating its own collision.

**No backticks anywhere in a replacement string, comments included.** The
replacement is itself a template literal; a backtick in a JSDoc comment closed it and
the script would not parse.

**A post-check must assert the SHAPE it cares about**, not the presence of a
substring that appears in more than one role. One aborted on finding `{cert.code}`
twice — the second being `` src={`/badges/${cert.code}.png`} ``.

**`git stash` rewrites line endings under `core.autocrlf=true`.** Use
`git show HEAD:path > path.head.ts` **beside the real file** for baselines — a copy
in `$env:TEMP` cannot resolve relative imports and produces a meaningless error
count.

**`open-badge` rebuilds and re-signs documents on every fetch.** Nothing is frozen
server-side; only downloaded `.jsonld` copies are. Any identifier change is instant
for every holder. This is the fact that dictates the cutover order in §2.

**`-SkipHttpErrorCheck` is PowerShell 7+.** On 5.1 it fails parameter binding before
any request is made and prints nothing, which looks like every URL returning empty.
Use `curl.exe`.

**Anchors built from terminal output failed five times this session.** Every one.
`Get-Content | Select-Object` strips line endings and cannot show whether a blank
line is present. Build from a codepoint dump, and prefer the shortest unique anchor.

---

## 11. Open items

### Immediately owed from this session

1. **Google Rich Results Test** on `certidemy.com/en/certifications/spo-ai-i` —
   the only thing that confirms the breadcrumb renders.
2. **LinkedIn Post Inspector** on `certidemy.com/en/verify/SM-AI-I-ZZMV-JPC8` and a
   certification page. Previews cache ~7 days with no purge; the broken card
   outlives the fix otherwise.
3. **Tell Julio to re-download** his `.jsonld` if he ever downloaded one (§2).
4. **Push `credentials-worker` to a remote** (§0.2).
5. **Delete the v2 builders** in `credential-og` after item 2 passes.

### New findings, not yet fixed

6. **Unknown issuer slug returns 503, should be 404.** `/issuers/etc` reaches
   `open-badge`, which answers "issuer not configured". Correct for a broken config,
   wrong for a slug that does not exist — 503 means "retry, we are down", which is a
   lie that will matter the moment partner slugs exist and someone typos one.
7. **The `™` on badge artwork.** It is now the entire share card. `SCRUM PRODUCT
   OWNER I-AI™` asserts a mark in language where Scrum Alliance holds registered
   marks nearby (CSPO, "Certified Scrum Product Owner"); asserting a claim there is a
   more exposed position than not asserting one. TERMINOLOGY-POLICY already forbids
   third-party marks in marketing chrome for identity claims — this is the same
   question aimed at our own artwork. Baked into eleven PNGs. Needs a decision, not
   a default. **Not legal advice; worth a lawyer.**
8. **`.gitattributes` with `* text=auto`** — seven project files still carry mixed
   line endings, including `exam-results.tsx` at 1 CRLF / 299 LF.
9. **`check-ob3-endpoints.ps1` hardcodes the OLD paths.** It would now pass on a
   301 while proving nothing about whether the real identifier resolves. Rewrite it
   to read `base_url` from the database.
10. **`check-jsonld-safe-mode.mjs` and `deno check` into
    `CERT-PUBLISH-CHECKLIST.md`.**
11. **verify-cert check 37** (passed attempt with no credential) still not in
    `verify-cert.mjs` — carried from v7.0.

### Carried

12. `exam-results.tsx` — render `credential_error` honestly rather than blank or
    crashing (v7.0 §9.3).
13. Server-side finalisation on exam timeout (v7.0 §9.8).
14. No pass email (v7.0 §9.9).
15. No learner-facing credentials index / `/my-credentials` (v7.0 §9.10).
16. Re-issue Julio's second seat (v7.0 §9.1).
17. AIGRM-I Stage 9; ISMS-IA session-timeout verification.
18. GHL live push verification → inbound provisioning.
19. CertiGlobal checkout webhook — campaign launch blocker.
20. Practice-pool backfill to ≥10/task/lang where short.
21. `credly_badge_id` / `credly_badge_url` — retire or keep.
22. Orphaned certificate PDFs in the `certificates` bucket.

---

## 12. Commits

### `supabase` (`calicoj-dev/certidemy-supabase`)

| commit | what |
|---|---|
| `d55edfc` | JSON-LD safe mode on all four identifier documents |
| `1ad3f4a` | deps: `jsonld` for the conformance checker |
| `131be05` | issuer-scoped namespace derived from `base_url`; migration 216; status-list issuer filter; 17 deno errors |
| `f1d8aa1` | migration 217, the cutover |
| `91a5082` | config: pin the three remaining public edge functions |
| `59caf38` | og: the badge, centred, on white — badge card, specimen band, 13 deno errors |

### `certidemy-web` (`calicoj-dev/certidemy`)

| commit | what |
|---|---|
| `dc666be` | serve the issuer-scoped identifier namespace; `issuers` in the intl matcher |
| `a6b57f9` | 301 the legacy identifier paths |
| `c0ec879` | both og callers to v3, cache-buster the cert page never had |
| `b0a720c` | cert page: badge, balanced title, breadcrumb + BreadcrumbList |

### `credentials-worker` (no remote)

| commit | what |
|---|---|
| `b782aff` | the OB3 identifier Worker |

Worker deployment version `51ceb1af-0311-472e-8666-9d2c5ded4e5f`.

---

## 13. What this unlocks

The partner-issuing product this session started as a question about. The
groundwork is done:

- `issuers` already carries `vault_secret_id`, `key_id`, `public_key_multibase` and
  `public_key_jwk` **per row** — per-issuer keys were architected in 185 and never
  populated with a second row
- `/issuers/<slug>` resolves for any slug in the table, no code change
- per-issuer status lists work and are correctly filtered
- the share card is issuer-neutral

**Certidemy stays the issuer on Certidemy certifications** — non-negotiable under
ISO/IEC 17024, which requires the certification body to retain the certification
decision. A partner who trains must not appear as the certifying body.

What partners get instead is **their own issuer identity for their own badges**:
a training-completion badge is a different claim about a different fact, and a
different fact is a different credential. That is also the attribution mechanism —
no partner name goes inside a Certidemy credential.

Next build: the partner portal OB3 tab. Draft → submit → domain verification →
activate, with **key generation at activation, not at signup**, and issuing gated on
a complete verified Profile. A half-filled Profile that can already issue puts a
badge in the world resolving to an issuer with no name.

---

**End of checkpoint v7.2.**
