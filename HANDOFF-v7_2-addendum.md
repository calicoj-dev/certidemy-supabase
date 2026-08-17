# HANDOFF v7.2 — ADDENDUM

**Same session as `HANDOFF-v7_2.md`, continuing after it was written.**
**Migration tip: still 217 · next free 218 — no DDL in this stretch.**

v7.2 closed with the identifier namespace moved and four defects fixed. This
addendum covers what came after: **Open Badges 3.0 baking**, the download
surface for it, and a corruption bug found twice in one night.

---

## 1. BAKED BADGES — the credential travels inside the image

`?doc=baked&code=<CODE>` on `open-badge` returns the badge PNG with the signed
credential embedded in an `iTXt` chunk, keyword `openbadgecredential`, per
OB 3.0 §10. Because Certidemy uses an **embedded proof** (`eddsa-jcs-2022`)
rather than VC-JWT, the chunk carries the JSON representation, not a compact JWS.
Compression is forbidden by the spec and is not used.

**Why this matters more here than for most issuers.** v5.9 §3 recorded the honest
boundary: there are three ways a credential reaches an HR system, and Certidemy
has one — the holder hands it over. A baked badge is the best possible version of
that one. A single 66 KB image that any OB3-aware system opens to find the
issuer, the key, the signature, the revocation status and **53 aligned
competencies**, without contacting us and without trusting us.

Size, for reference: ~21 KB of artwork and ~45 KB of credential. **Mostly
metadata**, which is the inverse of what most issuers produce. That is the
payload nobody else ships and it is not a bug to optimise away.

### 1.1 One branch, not two

`?doc=baked` **shares the credential branch**: the condition became
`doc === "credential" || doc === "baked"` and only the final response differs.

That was the whole design decision. The credential branch already carries three
rules that must apply identically:

- the **specimen refusal** — a baked specimen is a *more* dangerous artifact than
  a specimen document, because it is an image someone can post
- the **bearer-token viewer check**, so the holder's badge carries the salted
  identifier and everyone else's does not
- the **cache split** — `private, no-store` for the holder, shared-cacheable for
  the public copy

A parallel branch would have been a second copy of all three. The cache one is
why: a CDN storing a holder's baked badge and serving it to the next anonymous
visitor is exactly the disclosure the viewer-aware split exists to prevent, now
inside a file people actively pass around.

### 1.2 Not gated, deliberately

No new authorization rule. The holder gets a badge with their identifier; anyone
else gets one without it. **Both verify completely.**

A recruiter downloading a portable, independently verifiable proof is a feature.
A second gate would mean two authorization rules that can drift, protecting a
document already public at `/credentials/<CODE>`.

### 1.3 `_shared/png-bake.ts`

CRC-32 table and iTXt chunk construction, ~200 lines, no dependency. Written out
rather than imported: it is twelve lines of CRC and every import in an edge
function is a cold-start cost and a thing that can change underneath you — which
`credential-og` learned when esm.sh re-transpiled resvg (v3.2 §8).

Guards, all of which throw rather than produce a subtly wrong file:

- PNG signature checked byte by byte
- **refuses a source that already contains `openbadgecredential`** — the spec
  forbids a second chunk, and a pre-baked source badge would mean the artwork is
  not what we think it is
- IEND asserted at `length - 12` rather than assumed; writing a chunk into the
  middle of an image because the tail was unexpected is a corruption nothing
  downstream would notice

404 rather than a blank image when `BADGE_B64` has no artwork for a code. A badge
file with no badge in it reads as a broken credential, and it is the holder who
gets blamed when they share it.

---

## 2. THE SAME BUG, TWICE, IN ONE NIGHT

Both proxies read the upstream body with `.text()`.

That decodes as UTF-8. Every byte that is not valid UTF-8 becomes U+FFFD, so a
baked PNG came back **corrupt with a 200**:

```
expected   65,804 bytes
received   84,276 bytes
iTXt length reading 3,186,606,013
```

Found in `credentials-worker/src/index.js` first, fixed, then found again an hour
later in `certidemy-web/lib/openbadge/proxy.ts` — and only because the byte count
was compared against a known-good number. **The extractor still printed plausible
JSON**, because the credential payload happens to be ASCII-safe; it was the
surrounding binary that was mangled.

Both files were written when every response was JSON. The moment one endpoint
returned binary, both were wrong, and nothing in either would have said so: status
200, filename ending `.png`.

> **`arrayBuffer()` is correct for text and binary alike. There is no reason to
> use `.text()` in a pass-through proxy, ever.**

### 2.1 The pattern this session kept producing

Four instances tonight of **silent success**:

| defect | what it looked like |
|---|---|
| the mint (v7.0) | HTTP 200, `credential_pending: true`, nothing written |
| `credential-og` 401 | perfect in a browser, dead to every crawler |
| `verify_jwt` unpinned | works until a redeploy nobody connects to it |
| `.text()` corruption | 200, right filename, wrong bytes |

Every one was caught by a check asserting a **specific expected value** — 65,804
bytes, `iTXt`, exactly one keyword, exit code 0 — and none would have been caught
by "did it respond".

---

## 3. THE DOWNLOAD SURFACE

Three routes now serve a baked badge:

```
open-badge?doc=baked&code=<CODE>                          the function
credentials.certidemy.com/credentials/<CODE>/badge        machine-facing
certidemy.com/credentials/<CODE>/badge                    session-aware
```

**The two hosts are not redundant.** The Worker never forwards an Authorization
header — by design — so a badge from there is always the public copy. The apex
route forwards the session, so a signed-in holder gets a badge carrying their
salted email hash, and a receiving HR system can recompute
`sha256(email + salt)` against an employee record and **match the credential to a
person**. Without that the file verifies but attaches to nobody.

Neither path is an identifier. No signed document names `/badge`; the credential's
`id` stays `/credentials/<CODE>`. It could move later without breaking a verifier,
which is true of nothing else in that space.

### 3.1 The disclosure, and why it is worded that way

Button: **Download badge**. Beneath it, always:

> An image you can post anywhere. The full signed credential travels inside the
> file, so any Open Badges system can read and verify it without contacting us.

And **only when the viewer is the holder**:

> This copy includes your hashed email so a receiving system can match it to you.
> The hash can't be reversed, but anyone who already knows your address could
> confirm it from this file.

That second sentence is the honest version of a real trade-off, and `ob3.ts`
states it exactly: **extraction is infeasible, confirmation is not.** The
identifier is what makes the badge matchable, and it is going into a file the
holder will post publicly. They should know before they post, not after.

Three locales, five keys, under `verify.*`.

**KNOWN GAP, not closed:** the `.jsonld` download in `credential-data-panel` has
identical exposure and says nothing about it. It shows a `holderNote` explaining
the copy includes the identifier — an observation, not a caution. If this warning
is worth writing, it is worth applying there.

### 3.2 `lib/download/deliver.ts`

Mobile share sheet / desktop download / never a popup, extracted so a third
button does not copy it a third time.

The logic looks obvious and is not: `window.open(url)` called **after an await**
is treated by mobile browsers as a non-gesture popup and blocked — the user taps,
nothing happens, no error anywhere.

`certificate-download-button.tsx` **still carries its own copy.** Deliberately not
refactored: it is a working path for a paying customer and was not worth touching
on the same night a new feature shipped. It should adopt this when next opened,
for the reason v7.0 already recorded — two copies of one rule can diverge.

---

## 4. VERIFICATION — what was actually proven

| check | result |
|---|---|
| baked PNG, direct from function | 65,804 bytes |
| via Worker (`credentials.certidemy.com`) | 65,804, byte-identical |
| via apex, after the `.text()` fix | 65,804, byte-identical |
| PNG signature | `89 50 4E 47 0D 0A 1A 0A` |
| `openbadgecredential` chunk count | **1** (spec forbids more) |
| ends with IEND | yes |
| opens as the badge image | yes |
| extracted credential | JSON-LD safe mode PASS, 53 alignments |
| identifiers in the extracted doc | all on `credentials.certidemy.com` |
| `has identifier` on an anonymous fetch | **false**, correct |
| JSON-LD documents after the arrayBuffer change | unchanged |
| `deno check` on `open-badge` | clean |

**THE HOLDER BRANCH IS UNVERIFIED.** One credential exists and it is not ours to
sign in as, so `has identifier: true` and the conditional warning line have never
been seen. The path is shared with `?doc=credential`, which is proven — but v7.0
already recorded that **proof of one property is not proof of another**, and
"shared with something proven" is not proof. Verify on the second credential.

---

## 5. ALSO IN THIS STRETCH

**Rich Results Test passes.** `certifications/spo-ai-i` — 1 valid item,
Breadcrumbs, no errors. Crawled successfully.

**Post Inspector passes on both.** The verify page shows the badge card and the
correct title; the certification page likewise. Both re-scraped, which evicts the
stale previews cached while `credential-og` was 401.

**The verify card renders slightly softer than the cert card in LinkedIn**, and it
is not ours. Established by measurement:

- both pages declare identical `og:image:width` 1200 / `og:image:height` 630 and
  `summary_large_image`
- the SM-AI-I card fetched through the credential path and through the `?cert=`
  path is **byte-identical**, 63,060 both
- all eleven source PNGs are within 20–24 KB of each other

There is no variable left on our side. Most likely LinkedIn serving a derivative
cached while that URL was broken — it was scraped three times tonight across two
different card designs. **When SVG badges arrive from design, re-run Post
Inspector on both**: if the difference vanishes it was always downsampling; if it
persists it was cache and nothing was ever wrong.

---

## 6. COMMITS

### `supabase` (`calicoj-dev/certidemy-supabase`)

| commit | what |
|---|---|
| `59caf38` | og: the badge, centred, on white |
| `c7dea33` | handoff v7.2 |
| *(this stretch)* | ob3: bake the credential into the badge PNG — `_shared/png-bake.ts`, `?doc=baked`, the BodyInit cast |

### `certidemy-web` (`calicoj-dev/certidemy`)

| commit | what |
|---|---|
| `b0a720c` | cert page: badge, balanced title, breadcrumb |
| `52ba0a4` | verify: download the badge with the credential baked in — apex route, button, three locales, **and the second `.text()` fix** |

### `credentials-worker` (`calicoj-dev/certidemy-credentials`)

**This repo now HAS a remote** — v7.2 §0.2 says it does not. Corrected here.

| commit | what |
|---|---|
| `b782aff` | the OB3 identifier Worker |
| `0448854` | `/credentials/<CODE>/badge` + the first `.text()` fix |

Worker deployment version `dd825630-6571-468e-a97c-ebe8af0dabf0`.

**Custom-domain routing lags a deploy by a minute or two.** A 404 from
`credentials.certidemy.com` immediately after `wrangler deploy` while workers.dev
returns 200 is propagation, not a bug. The `x-certidemy-identifier-host` header is
what distinguishes "old version answering" from "route not matching" — it is only
set on a successful proxy, and it earned its place tonight.

---

## 7. OPEN, CARRIED FORWARD

Everything in v7.2 §11 still stands except items 1, 2 and 4, which are now closed
(Rich Results, Post Inspector, the Worker remote). Item 3 — telling Julio — was
resolved in conversation.

New from this stretch:

1. **Holder-branch verification** on the second credential (§4).
2. **The `.jsonld` download disclosure** in `credential-data-panel` (§3.1).
3. **`certificate-download-button.tsx` should adopt `deliverFile()`** (§3.2).
4. **Ask design for SVG badges.** They sent PNG and WebP, both 512×512, so the
   WebP files add nothing — same resolution, and lossy, so if anything slightly
   softer. Vector is the actual fix: the badge renders from 60px in a LinkedIn
   compose thumbnail to full page, and text baked into a raster cannot survive
   that range. Fallback ask: 1024×1024 PNG.
5. **The badge cannot read at 60px** regardless of format — three text elements
   plus a wordmark is a lot to survive that reduction. Not a reason to change
   anything now; `og:title` carries the words. But **"must read at 60px" is the
   brief** if badge v2 is ever commissioned.

---

**End of addendum to v7.2.**
