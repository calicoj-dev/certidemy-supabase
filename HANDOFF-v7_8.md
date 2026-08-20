# HANDOFF v7.8 — The partner backend is finished

**Session date:** 2026-08-19 / 20 (continuous with v7.6 and v7.7)
**Migration tip:** 238. Next free: 239.
**Repos pushed:** `certidemy-supabase`.

---

## 0. WHAT CHANGED

v7.7 ended with a working partner pipeline and a list of backend gaps. Every
one of those gaps is now closed. What remains is UI and integration only.

| commit | what |
|---|---|
| `2be459d` | 235: webhook dispatch, pg_cron scheduled |
| `c294c6a` | 236: webhook URL guard (fragments, SSRF) |
| `14813d2` | 237: credentials claimed at signup |
| `baa093e` | 238: public badges bucket, artwork constrained to our storage |
| `eeeecd1` | upload-achievement-image; partner baked badges |

Proven in production, not asserted:

- a webhook **delivered**, first attempt, 200, signature verified by the receiver
- a credential **claimed** by a real signup, with the document hash unchanged
- a partner badge **baked, extracted from the PNG, and verified** 7/7 against
  the partner's published key by a script sharing no code with the signer

---

## 1. WEBHOOK DISPATCH (235)

`issue-partner-credential` queued into `webhook_deliveries` and nothing read
them. Now: `dispatch-webhooks` runs every minute via pg_cron + pg_net.

### The architecture decision, and where it stops being right

**A table plus a scheduler, NOT pgmq.** Supabase Queues exists and is the right
tool for a pure queue. This is not a pure queue:

- `webhook_deliveries` is ALSO the audit log. A queue archives or deletes;
  "what did we send this partner, when, and what did they return" has to be
  answerable in a year, because that is what a partner disputes. This paid off
  on the first failure: `response_code` 404 and the receiver's own error body,
  truncated, readable without anyone looking anything up.
- pgmq does not supply backoff. Retry policy is custom logic either way.
- the columns already existed and were already being written.

What pgmq would add is a visibility timeout. `FOR UPDATE SKIP LOCKED` is that,
in one line.

**Holds to roughly thousands of deliveries per minute.** Past that, raise the
batch size and the cron frequency together; past THAT, move to pgmq or a
dedicated delivery service. The ceiling moves rather than arrives.

Competitors: Stripe and GitHub run dedicated delivery services at millions/day.
Mid-size SaaS buys Svix or Hookdeck. Nobody at this scale builds delivery
infrastructure.

### Auth: a shared secret, not a JWT

The documented cron-to-function pattern wants a JWT in Vault. Minting one from
SQL is currently awkward — the static service_role key is no longer issued by
the CLI, pgjwt is deprecated in Postgres 17, pgsodium is not recommended for
new use.

So `dispatch-webhooks` runs `verify_jwt = false` and checks
`x-dispatch-key`. **BOTH SIDES READ IT FROM VAULT** — the cron job to send it,
the function to compare it. It exists in exactly one place: not an env var, not
config.toml, not a deploy command. Compared in constant time; a public endpoint
checked with `===` leaks its prefix to anyone willing to measure.

### Signing

```
x-certidemy-signature  sha256=<hex hmac over "<timestamp>.<raw body>">
x-certidemy-timestamp  <unix seconds>
x-certidemy-delivery   <uuid>
x-certidemy-event      credential.issued
```

Stripe/GitHub shape. **Verified to match `crypto.createHmac` byte for byte**, so
a partner's developer needs no Certidemy SDK — four lines of stdlib.

The timestamp is INSIDE the signed string so a captured POST cannot be replayed
next week against a receiver that checks it.

The body is serialised ONCE and both signed and posted from that same string.
Re-serialising for the POST would sign a document that differs by key order.

### Backoff

1m, 5m, 30m, 2h, 12h → `abandoned`. About 14.5 hours across five attempts.
20 consecutive failures disables the endpoint entirely, so a partner who deletes
their receiver stops generating traffic forever.

### Deliberately one attempt per run

A retry loop inside the handler would let one slow endpoint hold a batch shared
with every other partner. Failures are rescheduled and picked up later.

### At-least-once, and it says so

If the POST succeeds and only `complete_webhook_delivery` fails, the row stays
`sending` and is reclaimed after 5 minutes — the receiver may see it twice.
`x-certidemy-delivery` exists for exactly this; receivers should treat delivery
as at-least-once.

---

## 2. THE WEBHOOK URL GUARD (236) — TWO PROBLEMS, ONE SERIOUS

### The fragment

A webhook was registered as `https://webhook.site/#!/view/<uuid>` — the BROWSER
url, not the endpoint. Everything after `#` is a client-side fragment and is
never transmitted, so the POST went to `https://webhook.site/` and 404'd three
times before anyone looked.

**A URL with a fragment can never be a working webhook target.** Not a policy
judgement — how HTTP works. And it will be the most common mistake in this
product, because everyone copies the URL they are looking at.

### The SSRF — this one was not from a typo

`dispatch-webhooks` POSTs to a partner-supplied URL **and stores the response
body** in `last_error`. A partner pointing a webhook at
`http://169.254.169.254/latest/meta-data/` or an internal hostname turns the
dispatcher into a request proxy AND a read channel: they choose the URL, we
fetch it, the body comes back in a column they can be shown.

Blocked: localhost, loopback, link-local, RFC1918, and `.internal` / `.local` /
`.localhost` / `.home.arpa`. Credentials and ports are stripped before the host
is tested, so `https://user:pw@evil.internal/` does not slip past.

**NOT caught: a public hostname that RESOLVES to a private address.** No string
matching sees that. This raises the floor; a resolver-level check in the
dispatcher would be the ceiling. Written into the migration so it is not
rediscovered.

---

## 3. CLAIM AT SIGNUP (237)

`claim_vouchers_for_new_profile` already ran AFTER INSERT on `profiles` and
already performed three claims keyed on `new.email`. Credentials became the
fourth step in that same function.

Migration 231 shipped `claim_credentials()` as a standalone RPC saying it was
deliberately NOT a trigger because "072 already owns a claim path". That
reasoning held; the conclusion was half-right. The answer was neither a second
trigger nor an application call somebody has to remember — it was a fourth step
in the function that already owns this moment. The RPC is KEPT and called from
there, so a signup and an admin re-run take one path.

`CREATE OR REPLACE` replaces the whole function, so 072's three claims are
reproduced verbatim in 237. There is no appending to a function.

### PROVEN: claiming does not move the bytes

`user_id` and `claimed_at` are NOT in the signed document. The credential
carries a salted hash of `holder_email`, which does not change on claim — the
whole reason pass 2 moved the subject hash off `auth.users` and onto the column.

Measured: hash `1663e69f…` identical before and after a real signup claimed the
credential. **Anchoring is safe across claims.**

A claim that re-signed would invalidate every distributed copy for a change the
document does not contain.

Once claimed, the credential stays with that `user_id`. `holder_email` is the
snapshot the identityHash was built from and must never move — same reason
`subject_salt` is immutable in 185.

---

## 4. BADGE ARTWORK (238 + two functions)

### The bucket is PUBLIC, deliberately

`certificates` and `sales-assets` are private and correctly so — a certificate
is one person's document. A badge is the opposite: referenced by `image.id`
inside a signed credential, meant to be posted publicly, loaded anonymously by
every consuming platform. **A signed URL cannot appear in a signed document** —
it expires, the credential does not.

### image_path is constrained to our own storage

It is emitted as `image.id` AND fetched by `?doc=baked`. An arbitrary URL there
would make `open-badge` a request proxy — the same SSRF shape as the webhook, in
a second place.

CHECK pins it to this project's public badges bucket, rejects traversal (`..`)
and double slashes. Tested 9/9 against lookalike hosts
(`pctynukndxnmnxiqpgck.supabase.co.evil.com`), wrong bucket, http, and
traversal.

### THE SPEC IS REQUIRED, NOT NEGOTIATED

PNG, square within 5%, 256–1024px, under 512 KB.

**A 3000x400 banner cannot be rescued by scaling.** Squashed it distorts;
letterboxed the content occupies a fraction of a 60px badge and reads as a
smear. Aspect ratio is the failure and no resize repairs it. A partner who
uploads a banner is told, with their actual dimensions in the message, rather
than silently handed a squashed badge they never approved and will see on
LinkedIn.

Oversized SQUARE artwork is simply accepted up to 1024px — browsers downscale
that well.

### PNG ONLY. SVG IS DEFERRED AND THE REASON MATTERS

An SVG can contain `<script>`. The bucket is public. Serving partner-supplied
SVG from a domain we control is an XSS vector that needs a real sanitiser, not a
regex. The bucket permits `image/svg+xml` so the capability can be turned on
later; the endpoint does not accept it.

**This also settles the recolorable-SVG question from v7.7.** Upload and
generated-SVG are NOT alternatives — both end at the same place. A generated SVG
gets rasterised and stored exactly like an upload; `image_path`, the storage
read and the baked branch are identical either way. The plumbing is built once.
Where the pixels come from is a design question that changes nothing
downstream.

### Magic bytes, not headers

Content-type on an upload is whatever the client claims. Format and dimensions
are read from the PNG signature and the IHDR chunk. Tested against generated
PNGs: 501x501 accepted, 3000x400 rejected by name, 64x64 too small, 2000x2000
too large, a GIF claiming to be a PNG rejected.

The object path is DERIVED (`<issuer-slug>/<code>.png`), never client-supplied —
a caller-chosen key would be the one way to get something outside the bucket
into `image_path`.

### ?doc=baked: two sources, one rule

Certidemy's eleven badges stay compiled into `_shared/badges.ts` — no fetch, no
network, nothing between a holder and their own badge. Partner artwork is
fetched from the URL in the Achievement, with `redirect: "error"`, an 8s
timeout, and the 512 KB ceiling re-applied at read because a bucket policy can
be changed and this cannot.

404 rather than a blank image on missing or failed artwork. A badge file with no
badge in it reads as a broken credential, and it is the HOLDER who gets blamed
when they share it.

**Round trip verified.** Partner badge PNG → iTXt chunk at offset 22336 → parsed
out → `verify-rdfc-proof.mjs` 7/7 including both tamper rejections. A partner
can email one file and any OB3-aware system checks it without contacting us.

---

## 5. LIVE STATE

```
issuers            2   certidemy, test-partner-02
achievements      12   11 Certidemy Certifications + 1 partner Course
credentials       10   7 specimens, 2 Certidemy, 1 partner (CLAIMED)
credential_anchors 3   963090 x2 stale-but-true, 963202 current
buckets            3   certificates, sales-assets, badges (public)
cron jobs          1   dispatch-webhooks, every minute
webhook deliveries 1   delivered
```

**Test artifacts that are now permanent:**
- `test-partner-02` — burned slug, cannot be renamed or reused
- `SCRUM-BOOTCAMP-2-T7ZQ-755P` — `holder_email` was edited by hand to
  `juan+claimtest@certidemy.com` to test the claim, so its hash no longer
  matches its anchor leaf. **Expected**: editing holder_email IS a material
  change. Do not treat this as a bug.
- `juan+claimtest@certidemy.com` — unverified auth user, claim proven. The
  address does not receive mail (plus-alias of a mailbox that does not exist).
- API key `cdk_live_861a8700` — REVOKED after being posted in a transcript.

---

## 6. OPEN — UI AND INTEGRATION ONLY

Nothing on this list is blocked by missing backend.

1. **Partner portal.** Console and Learning are the only surfaces. All six
   partner functions are platform_admin-only with no UI:
   create-partner-issuer, activate-partner-issuer, create-partner-achievement,
   create-issuer-api-key, upload-achievement-image, and issue-partner-credential
   (API key).
   When it lands, the auth to add is: actor is `team_admin` on
   `issuers.company_id`. NOT "any team_admin".
2. **Super admin context switcher** — a REAL `team_members` row making Certidemy
   the zeroth partner, not a `platform_admin` read-through. A special-cased
   admin view is a different code path and will drift.
3. **es-419 / pt-BR accents** on the six anchor strings in the verify panel.
   Written ASCII-only on purpose to avoid mojibake; they read fine and are not
   correct Spanish or Portuguese. Keys: `detailAnchorPending`,
   `detailAnchorSubmitted`, `detailAnchorReanchoring`, `anchorNote`.
4. **`--rebuild` flag on `build-credential-anchor.mjs`**, keyed on stale
   `doc_version`. Without it the future cron silently skips every credential
   whose bytes have moved.
5. **`CERT-PUBLISH-CHECKLIST.md` §6** — the three-things-move-together rule.
6. **Four certifications have no specimen**: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.
7. **"Hosted by, not endorsed by"** on the verify page for non-certidemy
   issuers.
8. **The certificate designer** (233 storage ready, nothing reads it).
9. **LTI 1.3** — build it, claim compatibility, certify when a deal needs it.
   Certidemy is a TOOL, not a Platform.
10. **`229_partner_leads`** not wired to company creation.
11. **`normalize-eol.mjs` should be copied into certidemy-web.** It lives only
    in the supabase repo and is currently invoked across repos by relative path.
12. **Resolver-level SSRF check** in the webhook dispatcher (§2).
13. **SVG badge upload** once there is a sanitiser (§4).

---

## 7. WHAT THIS STRETCH TAUGHT

**The same vulnerability shape appeared twice in one session.** "A feature that
fetches an attacker-chosen URL and hands back the result" turned up in webhook
delivery and again in badge artwork. Neither was noticed while writing the
feature; both were noticed while writing the CONSTRAINT that stores the URL.
Worth asking of anything that stores a URL and later dereferences it.

**A lesson written down is not a lesson followed.** Migration 185 explicitly
avoided `gen_random_bytes` because pgcrypto lives in the `extensions` schema and
is invisible under a restricted `search_path`. 235 used it anyway and failed at
runtime — not at `deno check`, not at parse, only when PL/pgSQL executed the
line. The transaction wrapper made it free.

**Byte-hash before and after is now routine and keeps changing the answer.**
Four shape-adjacent changes this stretch: `criteria.id` (neutral),
`humanVerificationUrl` (neutral), the claim (neutral), the baked branch
(neutral). Every patch predicted neutral. Two changes EARLIER in the session
predicted the same thing and were wrong. The check costs ten seconds.

**Read the output, not the code.** `criteria.id` had been wrong since the field
was written, and could not have been caught before a partner document existed.

**Line endings, again.** `config.toml` and all three `messages/*.json` carried a
small block written with the wrong convention by some earlier script. Every one
caught by a patch guard, none by a build.
