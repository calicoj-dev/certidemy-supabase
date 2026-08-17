# HANDOFF v7.2 — ADDENDUM

**Same session as `HANDOFF-v7_2.md`, continuing after it was written.**
**Migration tip: still 217 · next free 218 — no DDL in this stretch.**

v7.2 closed with the identifier namespace moved and four defects fixed. This
addendum covers what came after: **Open Badges 3.0 baking**, the download surface
for it, **the eddsa-rdfc-2022 dual proof**, and the same corruption bug found
twice in one night.

**Headline: every technical requirement for 1EdTech Open Badges 3.0 Issuer
conformance is now met.** What remains is membership and an admin mint path.

---

## 1. BAKED BADGES — the credential travels inside the image

`?doc=baked&code=<CODE>` on `open-badge` returns the badge PNG with the signed
credential embedded in an `iTXt` chunk, keyword `openbadgecredential`, per
OB 3.0 §10. Because Certidemy uses an **embedded proof** rather than VC-JWT, the
chunk carries the JSON representation. Compression is forbidden by the spec and
is not used.

**Why it matters more here than for most issuers.** v5.9 §3 recorded the honest
boundary: there are three ways a credential reaches an HR system, and Certidemy
has one — the holder hands it over. A baked badge is the best possible version of
that one. A single 66 KB image that any OB3-aware system opens to find the
issuer, the key, the signature, the revocation status and **53 aligned
competencies**, without contacting us and without trusting us.

~21 KB of artwork, ~45 KB of credential. **Mostly metadata**, the inverse of what
most issuers produce. Not a bug to optimise away.

### 1.1 One branch, not two

`?doc=baked` **shares the credential branch**: the condition became
`doc === "credential" || doc === "baked"` and only the final response differs.

The credential branch already carries three rules that must apply identically:

- the **specimen refusal** — a baked specimen is a *more* dangerous artifact than
  a specimen document, because it is an image someone can post
- the **bearer-token viewer check**, so the holder's badge carries the salted
  identifier and everyone else's does not
- the **cache split** — `private, no-store` for the holder, shared-cacheable
  otherwise

The cache one is why a parallel branch would have been a mistake: a CDN storing a
holder's baked badge and serving it to the next anonymous visitor is exactly the
disclosure the viewer-aware split exists to prevent, now inside a file people
actively pass around.

### 1.2 Not gated, deliberately

The holder gets a badge with their identifier; anyone else gets one without it.
**Both verify completely.** A recruiter downloading a portable, independently
verifiable proof is a feature. A second gate would mean two authorization rules
that can drift, protecting a document already public at `/credentials/<CODE>`.

### 1.3 `_shared/png-bake.ts`

CRC-32 table and iTXt construction, ~200 lines, no dependency. Guards that throw
rather than produce a subtly wrong file: PNG signature checked byte by byte,
**refuses a source already containing `openbadgecredential`**, and asserts IEND
at `length - 12` rather than assuming it.

404 rather than a blank image when artwork is missing. A badge file with no badge
in it reads as a broken credential, and it is the holder who gets blamed.

---

## 2. THE SAME BUG, TWICE, IN ONE NIGHT

Both proxies read the upstream body with `.text()`, which decodes as UTF-8. Every
byte that is not valid UTF-8 becomes U+FFFD, so a baked PNG came back **corrupt
with a 200**:

```
expected   65,804 bytes
received   84,276 bytes
iTXt length reading 3,186,606,013
```

Found in `credentials-worker/src/index.js`, fixed, then found again an hour later
in `certidemy-web/lib/openbadge/proxy.ts` — and only because the byte count was
compared against a known-good number. **The extractor still printed plausible
JSON**, because the credential payload is ASCII-safe; the surrounding binary was
what got mangled.

Both were written when every response was JSON. The moment one endpoint returned
binary, both were wrong, and nothing in either would have said so.

> **`arrayBuffer()` is correct for text and binary alike. There is no reason to
> use `.text()` in a pass-through proxy, ever.**

---

## 3. THE DOWNLOAD SURFACE

```
open-badge?doc=baked&code=<CODE>                          the function
credentials.certidemy.com/credentials/<CODE>/badge        machine-facing
certidemy.com/credentials/<CODE>/badge                    session-aware
```

**The two hosts are not redundant.** The Worker never forwards Authorization — by
design — so a badge from there is always the public copy. The apex route forwards
the session, so a signed-in holder gets a badge carrying their salted email hash
and a receiving system can recompute `sha256(email + salt)` against an employee
record. Without that the file verifies but attaches to nobody.

Neither is an identifier. The credential's `id` stays `/credentials/<CODE>`.

### 3.1 The disclosure

Always: *"An image you can post anywhere. The full signed credential travels
inside the file, so any Open Badges system can read and verify it without
contacting us."*

**Holder only:** *"This copy includes your hashed email so a receiving system can
match it to you. The hash can't be reversed, but anyone who already knows your
address could confirm it from this file."*

That second sentence is the honest version of a real trade-off, and `ob3.ts`
states it exactly: **extraction is infeasible, confirmation is not.** They should
know before they post, not after. Three locales, five keys under `verify.*`.

**KNOWN GAP:** the `.jsonld` download in `credential-data-panel` has identical
exposure and says nothing about it.

### 3.2 `lib/download/deliver.ts`

Mobile share sheet / desktop download / never a popup, extracted so a third
button does not copy it a third time. `window.open(url)` **after an await** is
blocked by mobile browsers as a non-gesture popup — user taps, nothing happens,
no error anywhere.

`certificate-download-button.tsx` still carries its own copy. Should adopt this
when next opened.

---

## 4. THE 1EDTECH HARD BLOCKER IS CLOSED — dual proof

**`proof` is now an array of two: `eddsa-jcs-2022` then `eddsa-rdfc-2022`.**

1EdTech's conformance guide accepts only `eddsa-rdfc-2022` or `ecdsa-sd-2023` for
a Linked Data Proof. `eddsa-jcs-2022` is a conformant W3C cryptosuite producing
genuinely verifiable credentials — it is simply not on their list, and a verifier
implementing only RDFC could not check a Certidemy credential at all.

### 4.1 Everything was measured before anything was written

| | |
|---|---|
| canonize the credential | **37.6 ms**, 79,248 bytes of N-Quads |
| canonize the proof config | 547 bytes, **5 triples**, safe mode PASS |
| contexts to bundle | 17.5 KB, two documents |
| network calls at signing | **zero** — loader throws on any attempt |
| import form | `https://esm.sh/jsonld@8.3.2?bundle-deps` |

`ob3.ts`'s stated reason for choosing JCS — *"requiring a JSON-LD processor plus
every referenced @context fetched and cached at signing time"* — was correct when
written and is now a **solved problem**, not a permanent constraint. That comment
should be updated when the file is next opened.

The proof config was checked **property by property**, because a config
canonicalizing to fewer triples than it has properties yields a signature
covering less than it appears to — a valid-looking proof that protects nothing.
All five survive.

### 4.2 A proof set, not a replacement

VCDM 2.0 permits `proof` as an array. JCS stays and is **first**:

- the badge panel verifies it today, in a browser, with no dependency
- it needs no JSON-LD processor, so anything that can sort keys and check Ed25519
  can verify it
- **if the RDFC path is ever wrong, the credential remains verifiable.** A single
  proof is a single point of failure over the one artifact this product exists to
  produce
- some consumers read `proof[0]` blindly

### 4.3 Two things that are load-bearing and look cosmetic

**`?bundle-deps`.** A plain esm.sh import of `jsonld` pulls `rdf-canonize-native`,
which tries to load a `.node` addon that cannot exist in an edge runtime and
fails with *"Cannot set properties of null (setting 'path')"*. Do not simplify.

**`safe: true` on canonize.** Without it, a term not defined by any context is
silently dropped and the signature covers a document missing a field nobody
noticed. This codebase's recurring failure shape, cryptographically blessed.

### 4.4 Contexts are bundled and FROZEN

`_shared/ld-contexts.data.ts`, generated by `gen-ld-contexts.mjs`, 18,294 bytes.
The loader **throws** on any unbundled URL rather than falling back to the
network.

A context defines what every term MEANS. Changing one changes the RDF, which
changes the canonical N-Quads, which changes every signature computed against it.
**After regenerating, run `verify-rdfc-proof.mjs` against an existing
credential** — if it still verifies the change was cosmetic; if not, the upstream
context changed meaning. A new context *version* is a new constant, not an edit.

### 4.5 Verified by code sharing nothing with the signer

`scripts/verify-rdfc-proof.mjs` re-derives base58, canonicalization and payload
assembly from the cryptosuite spec, and **fetches the public key over the network**
from the issuer document — exactly as a stranger's verifier would.

Run **before** deploy as a control:

```
PASS  eddsa-jcs-2022   signature verifies
PASS  proof set contains eddsa-jcs-2022
FAIL  proof set contains eddsa-rdfc-2022
```

That sequence is what makes the green run mean something: the verifier proved it
could validate a signature it did not produce, *then* proved the new one.

After deploy, with `--tamper`:

```
PASS  eddsa-jcs-2022   signature verifies
PASS  eddsa-rdfc-2022  signature verifies
PASS  eddsa-jcs-2022 is proof[0]
--- TAMPER TEST ---
PASS  eddsa-jcs-2022   correctly rejects the altered document
PASS  eddsa-rdfc-2022  correctly rejects the altered document
```

**The tamper test is the one that matters.** A proof surviving a one-character
change is not covering the document — which is exactly what a canonicalizer
silently dropping fields produces.

### 4.6 It broke the badge panel, and nothing caught that

`credential-data-panel.tsx` destructured `credential.proof` as an object. With a
proof set, `proofValue` and `verificationMethod` were both `undefined` and the
six checks failed **on a live credential**. Fixed with `pickProof()`, which
selects the JCS proof and falls back to `proof[0]`.

A grep of both repos afterwards found the panel was the **only** consumer of
`.proof`. That grep took four seconds and should have run before the deploy.

> **CHECKLIST ITEM: before deploying a change to the credential document shape,
> grep both repos for readers of the field you changed.**

### 4.7 Sizes after

| | before | after |
|---|---|---|
| credential | 55,024 | 55,520 |
| status list | 1,069 | 1,517 |
| baked badge | 65,804 | 66,124 |

The status list is signed by the same function and now carries two proofs too.

### 4.8 `ecdsa-sd-2023` — considered, not needed

The two cryptosuites are **alternatives**; 1EdTech accepts either. `ecdsa-sd-2023`
adds *selective disclosure* — a holder could present "I hold SM-AI-I" while
withholding their name. Genuinely useful, and not next: it needs ECDSA P-256 (a
second key pair on a different curve) and **wallet software the holder uses to
derive the disclosure**, which this market does not have. The viewer-aware
two-document split already gives a crude version that works with every verifier
today.

---

## 5. CONFORMANCE STATUS

| requirement | status |
|---|---|
| JSON-LD safe-mode validation | ✅ closed (v7.2 §4) |
| Valid credential structure | ✅ |
| Four identifier URLs, anonymous, correct content type | ✅ |
| **`eddsa-rdfc-2022`** | ✅ **closed this stretch** |
| Recipient-retrieval video | ✅ trivial — there is a download button |
| Issue on demand to `conformance@imsglobal.org` | ❌ no admin mint path |
| Membership | ❌ not a member |

**Every technical requirement is met.** What remains is a form and a fee.

**The claim that becomes available** — and only after the CLAIMS-POLICY entry in
§8 exists: *"Our credentials carry the proof mechanism 1EdTech's Open Badges 3.0
conformance guide requires."* A fact about the signature, checkable by anyone who
opens the document, making no status claim.

**Still forbidden:** "1EdTech certified", "1EdTech conformant", or anything
implying a relationship. Not listed in the Certified Product Directory.

---

## 6. ALSO IN THIS STRETCH

**Rich Results Test passes.** `certifications/spo-ai-i` — 1 valid item,
Breadcrumbs, no errors.

**Post Inspector passes on both** the verify page and a certification page. Both
re-scraped, evicting previews cached while `credential-og` was 401.

**The verify card renders slightly softer than the cert card in LinkedIn**, and it
is not ours. Both pages declare identical `og:image:width`/`height` and
`summary_large_image`; the SM-AI-I card fetched through the credential path and
the `?cert=` path is **byte-identical at 63,060**; all eleven source PNGs are
within 20–24 KB. No variable left on our side. Most likely a derivative cached
while that URL was broken. **When SVG badges arrive, re-run Post Inspector on
both.**

**`deno check` now needs `--node-modules-dir=auto` in the supabase repo.**
`npm install jsonld` created a `node_modules` that puts Deno in manual mode, and
the failure reads like a code error (`Could not find a matching package for
'npm:@types/node'`). It is not.

---

## 7. STALE PROJECT DOCUMENTS — found by reading them

**`CERT-PUBLISH-CHECKLIST.md` has NO OB3 SECTION.** Earlier handoffs record "add
`check-ob3-endpoints.ps1` to the checklist" as though there were a verification
section to append to. There is not — the file is entirely catalogue claims and
sample questions, written 26 July. It needs a §6 covering: `check-ob3-endpoints`,
`check-jsonld-safe-mode`, `verify-rdfc-proof`, and `deno check`.

**Its cert register lists 7 of 11.** Missing ISMS-F, ISMS-IA, AIMS-F, AIMS-IA.

**`CLAIMS-POLICY.md` has no 1EdTech entry.** Class D covers *"any claim that
Certidemy is, or is affiliated with, a standards body"*, which nearly reaches it —
but "1EdTech conformant" does not obviously read as an affiliation claim, and it
is now **partly true**, which makes it more dangerous rather than less.

**Loose component snapshots in project knowledge** — `progress-strip.tsx`,
`exam-trend.tsx`, `study-plan-panel.tsx`, `i18n-provider.js`. Files that have
moved on; better deleted than updated.

**`CERTIDEMY-REFERENCE-v1_2/v1_3` and `HANDOFF-v1_2/v1_3`** at the repo root are
v1.x-era and outside both repos.

---

## 8. COMMITS

### `supabase` (`calicoj-dev/certidemy-supabase`)

| commit | what |
|---|---|
| `59caf38` | og: the badge, centred, on white |
| `c7dea33` | handoff v7.2 |
| `6fd25cc` | ob3: bake the credential into the badge PNG |
| `9d9046b` | handoff v7.2 addendum |
| `5d18747` | **ob3: dual proof — eddsa-rdfc-2022 alongside eddsa-jcs-2022** |

### `certidemy-web` (`calicoj-dev/certidemy`)

| commit | what |
|---|---|
| `b0a720c` | cert page: badge, balanced title, breadcrumb |
| `52ba0a4` | verify: download the badge, + the second `.text()` fix |
| *(this stretch)* | verify panel: read the JCS proof out of the proof set |

### `credentials-worker` (`calicoj-dev/certidemy-credentials`)

**This repo HAS a remote** — v7.2 §0.2 says it does not. Corrected here.

| commit | what |
|---|---|
| `b782aff` | the OB3 identifier Worker |
| `0448854` | `/credentials/<CODE>/badge` + the first `.text()` fix |

**Custom-domain routing lags a deploy by a minute or two.** A 404 from
`credentials.certidemy.com` while workers.dev returns 200 is propagation. The
`x-certidemy-identifier-host` header distinguishes "old version answering" from
"route not matching" — it is only set on a successful proxy, and it earned its
place.

---

## 9. OPEN

v7.2 §11 stands except items 1, 2 and 4, now closed. Item 3 (telling Julio) was
resolved in conversation. **The `eddsa-rdfc-2022` blocker is closed.**

1. **Holder-branch verification** on the second credential — `has identifier:
   true` and the conditional disclosure line have never been seen, because one
   credential exists and it is not ours to sign in as.
2. **The `.jsonld` download disclosure** in `credential-data-panel`.
3. **`certificate-download-button.tsx` should adopt `deliverFile()`.**
4. **Ask design for SVG badges.** PNG and WebP both arrived at 512×512, so the
   WebP adds nothing — same resolution, and lossy. Vector is the actual fix: the
   badge renders from 60px in a LinkedIn compose thumbnail to full page. Fallback
   ask: 1024×1024 PNG.
5. **The badge cannot read at 60px** regardless of format. Not a reason to change
   anything now — `og:title` carries the words. But **"must read at 60px" is the
   brief** if badge v2 is commissioned.
6. **`CERT-PUBLISH-CHECKLIST.md` §6** (§7 above).
7. **`CLAIMS-POLICY.md` 1EdTech entry** (§7 above).
8. **Admin mint path** — issue to an arbitrary email, the last conformance item
   that is not a fee.
9. **Update `ob3.ts`'s header comment** about JCS avoiding a JSON-LD processor.
   True when written, no longer the constraint (§4.1).

---

**End of addendum to v7.2.**
