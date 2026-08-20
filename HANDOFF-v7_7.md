# HANDOFF v7.7 — Partner issuing works end to end

**Session date:** 2026-08-19 (continuous with v7.6)
**Migration tip:** 234. Next free: 235. **No new migrations this stretch.**
**Repos pushed:** `certidemy-supabase`, `certidemy-credentials` (worker), `certidemy-web`.

---

## 0. THE HEADLINE

A partner can now be created, domain-verified, activated with a self-proving
Ed25519 key, define their own achievement, mint an API key, and issue a signed
OB3 credential to a person with no Certidemy account — and a stranger can
verify it without trusting us.

That whole chain was built and proven in production today. The artifact:

```
https://credentials.certidemy.com/credentials/SCRUM-BOOTCAMP-2-T7ZQ-755P
  issuer          test-partner-02 (not Certidemy)
  achievementType Course
  key             the partner's own, minted by activate-partner-issuer
  status list     the partner's own, index 17
  proofs          eddsa-jcs-2022 + eddsa-rdfc-2022
  holder          holder_email only, no user_id, no account
```

Commits, in order:

| commit | repo | what |
|---|---|---|
| `1ca0085` | supabase | `?doc=anchor` returns btc block hash + height |
| `c5c6e7c` | supabase | HANDOFF v7.6 |
| `9bd549a` | worker | `/.well-known/certidemy-issuer.txt` + `/credentials/<code>/anchor` |
| (web) | certidemy-web | panel seventh row + message EOL normalization |
| `dd7e8e9` | supabase | create-partner-achievement; criteria.id fix |
| `67c4896` | supabase | create-issuer-api-key; issue-partner-credential |
| `b793a67` | supabase | verify url is always Certidemy's |

---

## 1. THE SEVENTH PANEL ROW IS LIVE

`components/verify/credential-data-panel.tsx` now runs a seventh check:
**Confirm the anchored date**. It renders on the live verify page in all three
locales, showing the date, a Bitcoin block link, and the block hash in
monospace beneath it.

### Two traps that were designed around, not discovered

**The holder-copy trap.** The panel fetches same-origin with
`credentials: "include"`, so a signed-in holder gets THEIR copy, which carries
`identifier[]` and hashes to something else entirely. The anchor step therefore
makes a SECOND fetch to `credentials.certidemy.com`, which never forwards
Authorization. Without it, a holder opening their own credential would see a red
X on a perfectly valid anchor.

**Re-anchoring is not tampering.** A leaf mismatch has two causes:

- document re-signed AFTER the anchor was built (renderer change, name fix) →
  neutral, shows *re-anchoring after an update*
- document changed with no re-signing behind it → red

Distinguished by comparing `proof.created` to the anchor's `builtAt`, both of
which the client already has. **Deliberately NOT by `doc_version`** — the client
does not know the current DOC_VERSION and should not have to.

### What needed building underneath it

- `?doc=anchor` now returns `blockHash` and `blockHeight` (234's columns were
  added but never served)
- the Worker gained `/credentials/<CODE>/anchor`, so the panel talks to one host
- **no explorer URL is emitted by the endpoint.** Any explorer is somebody's
  company; the client picks the link, the endpoint returns the fact

### Spanish and Portuguese strings are ASCII-only, DELIBERATELY

`detailAnchorPending`, `detailAnchorSubmitted`, `detailAnchorReanchoring`,
`anchorNote` were written without accents (`aun`, `confirmacion`, `apos`) so no
patch in this session could introduce mojibake. **They read fine but are not
correct Spanish or Portuguese.** Fix them in an editor known to handle UTF-8, or
have Laura review the block. Getting the mechanism right first and the accents
second was the right order; shipping mojibake into three locales would not have
been.

---

## 2. THE PARTNER PIPELINE, FOUR FUNCTIONS

### `create-partner-issuer` → `activate-partner-issuer` (v7.6, now exercised)

Proven end to end against `credentials.certidemy.com` as the verification
domain, with the token served from a wrangler secret on the Worker.

**Not certidemy-web:** Cloudflare Pages has skipped dot-prefixed directories
when uploading assets, so a file in `public/.well-known/` can deploy to nothing
with no error anywhere.

**The `.txt` suffix is load-bearing.** The next-intl matcher excludes
`.*\.(?:...|txt)`, so the well-known path already escapes locale prefixing. A
well-known file with NO extension would 307 to `/en/.well-known/...`.

### `create-partner-achievement`

Defines what a partner issues. platform_admin only — partner self-service
belongs in a portal that does not exist, and an unexercised authorization branch
is worse than a missing feature. When the portal lands, add: actor is
team_admin on `issuers.company_id`.

Validation vocabularies are **byte-identical to migrations 231 and 234** —
`TYPES`, `RESULT_TYPES`, `CODE_RE`, and the 20-char criteria floor. Drift there
would surface as a raw Postgres error instead of a usable 400.

Partners may select any `achievement_type`, including `Certification`. What is
blocked is a NAME implying the claim is ours or accredited — `FORBIDDEN_IN_NAME`
covers "certidemy", "accredited by", "iso 17024" and their es/pt forms. A
disclaimer on a verify page cannot reach a string that travels inside the
credential.

**Children get a compensating delete.** Edge functions have no cross-statement
transaction, so if alignments or results fail to insert, the achievement is
DELETED. Safe only here: the row is seconds old, always created in draft, and
`credentials.achievement_id` restricts.

### `create-issuer-api-key`

Returns the key **once**. Only `sha256(key)` and an 8-char display prefix are
stored. No recovery path, by design.

Format: `cdk_live_<64 hex>` / `cdk_test_<64 hex>`.

### `issue-partner-credential` — THE PARTNER SURFACE

`verify_jwt = false`, authenticates itself against `issuer_api_keys` by hash.

**The key arrives in `x-certidemy-key`, not `Authorization`.** Authorization on
this platform means "a Supabase JWT" everywhere else, and a header that means
two things is a header somebody forwards to the wrong place.

- `user_id` NULL, `holder_email` carries the recipient. `claim_credentials()`
  links it at signup — **still not wired into the signup flow.**
- `display_id` is the partner's printed number. `credential_code` is the URL
  segment and carries ~40 bits of entropy (31^8 ≈ 8.5×10^11) because guessable
  codes let anyone walk an issuer's credentials and harvest holder names.
- Idempotency: a replay returns the ORIGINAL credential, not an error. From the
  caller's side a replay and the original are the same request.
- **Auth failures all return "invalid API key".** Distinguishing revoked from
  never-existed tells a prober which guess was once real.
- Webhooks are **QUEUED into `webhook_deliveries`, not delivered.** A POST fired
  inside the handler would fail silently on a slow endpoint and take the
  issuance response with it. **The dispatcher cron does not exist** — rows
  accumulate as `pending`, which is visible and recoverable.

---

## 3. TWO BUGS FOUND BY LOOKING AT REAL OUTPUT

Both were invisible until a partner document actually existed. Neither would
have been caught by any test that did not read the emitted JSON.

### `criteria.id` pointed at a page that does not exist

`buildAchievement` fell back to `${siteUrl}/certifications/<code>` when no
`criteria_url` was given. That page exists for a Certidemy scheme and does not
for a partner's, so the first partner achievement shipped:

```
"criteria": { "id": ".../certifications/scrum-bootcamp-2026-08" }
```

A verifier following `criteria.id` gets a 404, and criteria is the field that
says what the holder did. **Fix: the caller supplies the URL or nothing; the
builder stopped guessing.** `criteria.id` is optional in OB 3.0 and an absent id
is honest.

### `certidemy:humanVerificationUrl` pointed at the issuer's own site

Built from `issuer.site_url`, so a partner credential pointed at
`credentials.certidemy.com/verify/...` (no verify page) and a real partner's
would point at their marketing site (also no verify page). **Fix:
`VERIFY_SITE_URL` constant.** The verify page is always Certidemy's — hosting it
on their behalf IS the arrangement. Not a per-issuer column: no value to look
up, only a knob nobody should turn.

**Both changes were byte-neutral for Certidemy credentials, MEASURED not
assumed.** `366981ac5a547b6c…` before and after each deploy. The anchor from
block 963202 survived both.

---

## 4. LTI 1.3 — DECIDED

**Build it, do not certify yet.**

Building costs nothing: the 1EdTech Reference Implementation is public, Moodle
self-hosts free and is itself LTI Advantage certified. Complexity is comparable
to what was built today — OAuth2, OIDC, JWTs. One catch: **LTI certification
requires RS256**, so it needs an RSA keypair alongside the Ed25519 one.

Certification requires paid 1EdTech membership with annual recertification.
A Tool certifying core + one or two services is "LTI Advantage Certified";
"Complete" (all three) is required only for Platforms.

**The claims line, for CLAIMS-POLICY:**

| may say | may NOT say |
|---|---|
| "Integrates with Moodle, Canvas, Blackboard, Brightspace via LTI 1.3" | "1EdTech certified" |
| "Implements the LTI 1.3 specification" | "LTI Advantage Certified" |
| "Works with any LTI 1.3 platform" | the 1EdTech logo or a registration number |

**Certidemy is a TOOL, not a Platform.** The LMS is the Platform. Saying
"Certidemy is an LTI 1.3 platform" to an LMS admin reads as not knowing the
spec.

**Do not integrate with LMS badging.** Moodle Badges, Blackboard Achievements,
D2L Awards and Canvas Credentials are all OB 2.0, unsigned, LMS-hosted, and most
route through Badgr — now owned by Instructure. Pushing into them downgrades the
credential to the thing we are better than. Integrate on the TRIGGER and the
LINK BACK, never the badge.

What LTI actually buys: **Deep Linking** (an instructor drops Certidemy into
their course — this is the one that sells), **AGS** (grade passback, only
relevant because we host the exam), **NRPS** (roster, so issuance stops needing
CSVs). Draft-then-approve is the right shape either way: nobody wants a badge
minted by a webhook they did not see.

---

## 5. LIVE STATE

```
issuers            2   certidemy (active), test-partner-02 (active)
achievements      12   11 Certidemy Certifications + 1 partner Course
credentials       10   7 specimens, 2 Certidemy real, 1 partner
credential_anchors 3   963090 x2 (stale-but-true), 963202 (current)
api keys           1   cdk_live_861a8700 — REVOKED
```

**test-partner-02** (burned test slug, permanent):
```
issuer_id    2841efa2-ba59-474e-91d3-8fd5ced11ca2
company_id   f222d6bf-108a-45f5-ae17-83d959a16828
key          z6MkukK753DmsUsmZLgKqG5xK7CQUkfS7WuDX8uorJHyDYeo
achievement  bd4e2847-b565-4cda-84e9-d7a49a0fb6c4  SCRUM-BOOTCAMP-2026-08
credential   SCRUM-BOOTCAMP-2-T7ZQ-755P            status index 17
```

Its `site_url` is `https://credentials.certidemy.com` — a **test artifact**.
`test-partner-issuer.mjs` passes `site_url: https://<domain>`, conflating the
marketing site with the verification domain. Real partners supply them
separately. Worth a `--site-url` flag.

### An API key was posted in plaintext and revoked

`cdk_live_861a8700...` appeared in a chat transcript, was revoked within
minutes, and the revocation was confirmed by observing `invalid API key` from
the live endpoint. Test issuer, no real credentials, low stakes — recorded
because the habit is the point.

---

## 6. OPEN — IN ROUGH ORDER

1. **Webhook dispatcher cron.** `webhook_deliveries` accumulates `pending` rows
   with `next_retry_at` set and nothing reads them. Smallest remaining piece of
   the API story.
2. **`claim_credentials` not wired into signup.** Until it is, an
   issue-to-email credential never links to the account that claims it.
3. **`?doc=baked` cannot serve a partner badge.** `BADGE_B64` in
   `_shared/badges.ts` is a compiled-in map of eleven PNGs; a partner's artwork
   lives in storage. Needs a runtime fetch, a size guard, and a decision about
   missing artwork. A partner will ask on day one.
4. **es-419 / pt-BR accents** on the six anchor strings (§1).
5. **`--rebuild` flag on `build-credential-anchor.mjs`**, keyed on stale
   `doc_version`. Without it the future cron silently skips every credential
   whose bytes have moved.
6. **`CERT-PUBLISH-CHECKLIST.md` §6** — the three-things-move-together rule:
   a change to emitted credential shape requires `DOC_VERSION` +
   `material_updated_at` + anchor rebuild. **Three occurrences now.** Today also
   produced two shape changes that were byte-neutral and cost nothing — the
   difference is only knowable by hashing.
7. **No partner portal.** Console and Learning are the only surfaces. All four
   partner functions are platform_admin-only and have no UI.
8. **Super admin context switcher** — a REAL `team_members` row making Certidemy
   the zeroth partner, not a `platform_admin` read-through.
9. **"Hosted by, not endorsed by"** line on the verify page for non-certidemy
   issuers.
10. **Four certifications have no specimen**: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.
11. **The certificate designer** (migration 233 storage is ready, nothing reads
    it).
12. **LTI 1.3** (§4).
13. **`229_partner_leads`** not wired to company creation.

---

## 7. WHAT THIS STRETCH TAUGHT

**Read the output, not the code.** Both bugs in §3 were in code that passed
type-checking, deployed cleanly, and produced a document that looked right until
someone read the actual JSON. `criteria.id` had been wrong since the field was
written; nothing could have caught it before a partner document existed.

**Predict, then measure, then believe.** Two shape changes were byte-neutral.
Both patches said so in a comment. Both were confirmed by hashing a live
credential before and after — and the two changes EARLIER today that said the
same thing were wrong.

**Guards should abort, and they should also be doubted.** A post-condition
fired on the phrase "Blockstream" appearing in the patch script's own
explanatory prose, not in the emitted document. The guard was right to fire and
the expected value was wrong. Same for a check expecting one occurrence of a
block hash that legitimately appears twice.

**Line endings are a recurring, structural defect in this codebase.** Three
files today (`config.toml`, and all three `messages/*.json`) carried a small
block written with the wrong convention by some earlier script. Every one was
caught by a patch guard rather than by a build. `scripts/normalize-eol.mjs` now
exists in the supabase repo and **should be copied into certidemy-web.**
