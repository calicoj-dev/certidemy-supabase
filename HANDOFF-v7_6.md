# HANDOFF v7.6 — Partner issuing: schema, security, and a second live issuer

**Session date:** 2026-08-19
**Migration tip:** 234. Next free: 235.
**Repos pushed:** `certidemy-supabase` only. `certidemy-web` untouched this session.

---

## 0. What this session was

The partner credential-issuing product went from an idea with a schema hint to a
**second live issuer with its own working Ed25519 key**, resolvable by anyone.

Along the way two genuine security defects were found in `open-badge` — both
latent, both exploitable the moment a second issuer existed, which is exactly
what this session created. They were fixed and deployed BEFORE the second issuer
was activated. That ordering was luck as much as planning; see §11.

Commits, in order:

| commit | what |
|---|---|
| `1f6fedd` | migrations 230–233 |
| `2dbaf89` | open-badge pass 1: issuer authority |
| `1720f46` | open-badge pass 2: achievement-first resolution |
| `7f8eddc` | migration 234, ots block hash, DOC_VERSION bump |
| `77d0450` | partner issuer lifecycle functions + config.toml |

---

## 1. THE COMMERCIAL SHAPE (read this before the technical sections)

The partner issuing feature is a **wedge product**, not a side feature.

Any training organisation — ISO trainers, Scrum trainers, universities — wants
to hand out something better than a Canva PDF. Very few can produce a signed
OB3 credential with a Bitcoin-anchored timestamp. Certidemy can, today.

The play: sell the issuing rails, land the training org, upsell certifications
later. Competitor **Acreditta** charges per credential. Certidemy can waive
partner badge volume entirely for orgs buying vouchers, which they cannot
follow, because badges are their whole revenue line.

**The rigor dial is `achievementType`** (OB3 controlled vocabulary):

- Partner's "Scrum Boot Camp, 13–15 Aug" → `Course`, issuer = partner slug
- Certidemy SM-AI-I → `Certification`, issuer = `certidemy`

Two credentials, two issuers, two different claims, neither able to impersonate
the other. **Migration 231 enforces this at the database level**: an achievement
carrying a `certification_id` must be `achievement_type = 'Certification'` AND
must belong to the `certidemy` issuer. A trigger refuses anything else.

Partners may select any type they like, including `Certification`. Certidemy is
a hosting provider for their documents, not an accreditor of them — 17024 binds
Certidemy as a certification body for CERTIDEMY schemes only. The residual risk
is **adjacency**, not accreditation: a fraudulent partner credential served from
`credentials.certidemy.com` reads as ours to anyone not parsing the issuer
field. Mitigations, none of which restrict what a partner may issue:

1. domain verification before activation (BUILT, §7)
2. real legal name on the Profile before activation
3. a "Issued by X · Hosted by Certidemy · Certidemy does not endorse or
   accredit this credential" line on the verify page when
   `issuer_id != certidemy` — **NOT BUILT**
4. terms carrying a unilateral revocation right — **NOT BUILT**

---

## 2. MIGRATIONS 230–234

### 230_issuer_lifecycle.sql

`issuer_status` enum: `draft` → `verified` → `active` → `deactivated`.

Added to `public.issuers`: `status`, `company_id` (FK → companies),
`verification_domain`, `verification_token`, `verified_at`, `activated_at`.

Two constraints and a trigger that turned out to compose with migration 186
without either knowing about the other:

- `issuers_active_requires_keys` — cannot be `active` without
  `vault_secret_id`, `public_key_multibase` and `key_id`. This forces
  store-key-then-flip ordering; the reverse is rejected by the database rather
  than by convention.
- `trg_guard_issuer_identity` — **slug is immutable once status leaves
  'draft'**, and `is_active` is DERIVED from `status = 'active'` so the two can
  never disagree.
- Because `issuer_get_signing_key` (186) filters on `is_active`, a draft or
  verified issuer **physically cannot sign**. That was not designed; it fell
  out. Do not remove the derivation without re-checking 186.

`issuers.company_id` carries the link, NOT `companies.issuer_id`. Unique index
where not null: one issuer per company.

**Issuers are never deleted.** Deactivation stops new issuance; everything
already issued keeps resolving. That is a permanent hosting obligation taken on
at activation and it belongs in the terms explicitly.

### 231_achievements.sql

The load-bearing one. `public.achievements` becomes first class:

```
achievements(id, issuer_id, code, achievement_type, certification_id,
             name, description, criteria_narrative, criteria_url, image_path,
             tags, authoring_depth, status, default_validity_days,
             display_id_prefix, display_id_seq, ...)
unique(issuer_id, code)
unique(certification_id) where not null
```

Plus `achievement_alignments` and `achievement_results` — the OB3 sub-objects an
achievement with no JTA behind it needs. `achievement_results.result_type` is
the OB3 ResultType vocabulary; Acreditta's "Tipo de resultado" dropdown is
literally this list.

Backfilled: **11 achievements, one per certification**, all on `certidemy`, all
`achievement_type = 'Certification'`, `authoring_depth = 'certification'`.

`public.credentials` generalised:

- ADDED `achievement_id` NOT NULL (backfilled from `certification_id`)
- ADDED `holder_email` citext (backfilled from `auth.users`)
- ADDED `claimed_at`, `display_id`
- DROPPED NOT NULL on `certification_id`, `score_pct`, `user_id`
- `credentials_holder_present` — one of `user_id` / `holder_email` must exist
- `credentials_score_requires_attempt` — a score without an exam is a number
  nobody produced
- `trg_guard_credential_issuer` — the credential's `issuer_id` must equal its
  achievement's issuer. Without this a partner credential can name Certidemy
  and it verifies.

**WHY ONE TABLE AND NOT TWO.** A separate partner-credentials table would fork
`open-badge`, the anchor builder, the status lists, the badge baker,
revoke/reinstate, verify-credential and the certificate renderer. Nullable
columns cost four DROP NOT NULLs. A parallel table costs seven forked paths that
must be kept in agreement forever.

**NAMING DEBT, DELIBERATE.** `credentials.certification_name` and
`certification_code` are kept, stay NOT NULL, and now snapshot the ACHIEVEMENT.
For every Certidemy row that is the same string it always was. Not renamed
because both repos read them and a rename buys nothing but a grep. Read them as
`achievement_name` / `achievement_code`.

`display_id` vs `credential_code`: `display_id` is what PRINTS, free-form,
partner-supplied. `credential_code` stays the URL segment with its entropy.
This split exists because sequential public IDs are an enumeration surface —
someone walks `/credentials/1..5000` and harvests every holder name a partner
ever issued.

`public.claim_credentials(uuid, citext)` — security definer RPC, service_role
only. **NOT a trigger on auth.users**: migration 072 already owns a claim path
and two triggers racing over one signup is worse than one explicit call.
**NOT YET WIRED into the signup flow.** See §10.

### 232_issuing_api.sql

`issuer_api_keys` (sha256 hash + display prefix, never the key),
`issuer_inbound_hooks`, `issuer_webhooks`, `webhook_deliveries` (retry queue),
`issuer_api_requests` (with a unique idempotency index per issuer, so a replayed
POST cannot mint twice).

All five RLS-enabled, service-role only. **Nothing consumes any of them yet.**

`trg_guard_api_key_issuer` — cannot mint a key for a non-active issuer.

### 233_certificate_templates.sql

`issuer_branding` (logo, signature raster + SVG path data, accent/border colour,
badge shape and fills) and `certificate_templates` (`layout jsonb`,
`template_version` auto-bumped by trigger on any geometry change).

`achievements.certificate_template_id` and
`credentials.certificate_template_id` + `template_version_at_issue` so a
reissued PDF years later is reproducible.

The layout element contract and six designer rules are documented at the foot of
the migration file. The four that will bite:

1. `locked: true` on holder_name, achievement_name and qr
2. `size_min` REQUIRED on shrink fields (current renderer shrinks holder name
   46→22pt, cert name 26→14pt)
3. field visibility DERIVES FROM DATA, never a manual toggle
4. the preview needs a locale switch — es-419 runs ~20% longer than English

### 234_anchor_block_hash.sql

`credential_anchors.btc_block_hash` (text, 64 lowercase hex) and
`btc_block_height` (bigint). Constraint: both or neither.

`txid` keeps its `block:<height>` string form — consumers already read it.

Also carries `achievements_active_requires_criteria`: an achievement cannot go
`active` with a criteria narrative under 20 characters, unless it is
certification-backed (those take their narrative from
`certification_i18n.claim`, which `open-badge` already guards hard).

---

## 3. open-badge PASS 1 — THE ISSUER CAME FROM THE QUERY STRING

**The defect.** `open-badge` read the issuer from `?issuer=`, defaulting to
`certidemy`. That slug then drove `loadAchievement`, `statusListUrl`,
`buildCredential` **and `readSigningKey`**. The credential's own `issuer_id` was
never read.

With one issuer row this was inert — any other slug returned 503. With two,
`?doc=credential&code=SM-AI-I-ZZMV-JPC8&issuer=<partner>` would have returned a
real Certidemy credential **signed with the partner's key, naming the partner as
issuer, pointing at the partner's status list**. It would have verified.

Same shape on `?doc=achievement`: `loadAchievement` queried `certifications` by
code with **no issuer filter at all**, so `/issuers/<other>/achievements/SM-AI-I`
would have served the full 53-alignment JTA with `creator` set to whoever asked.

**The fix.** `credentials.issuer_id` is now authoritative for building AND
signing. An ownership check against `achievements` gates the achievement branch.
The status branch correctly still uses the requested issuer — a status list IS
the requested issuer's document.

Applied by `scripts/patch-open-badge-issuer-authority.mjs` (gitignored;
`scripts/patch-*.mjs` is excluded).

**Verified in production after test-partner-02 existed** — see §8.

## 4. open-badge PASS 2 — ACHIEVEMENT-FIRST, AND THE achievementType BUG

`loadAchievement(svc, achievementId, issuer, jtaVersionId?)` now resolves
through `achievements` and only reaches into `certifications` when
`certification_id` is set. Two branches:

- **certification-backed** — the original path, cert fetched by id rather than
  `ilike` on code. Both snapshot rules intact (domains from the credential's own
  `jta_version_id`; NAME from the live row, never the snapshot).
- **no certification** — name, description, criteria and image from the
  achievement row; alignments from `achievement_alignments`;
  `resultDescription` from `achievement_results`. No JTA, no
  `certification_i18n`, no claim requirement. "Attended this course" is a fact
  about attendance and dressing it in certification apparatus would be exactly
  the blurring `achievement_type` exists to prevent.

Alignments are a **UNION**, not a branch: derived-from-JTA plus authored. One
side is empty on either path. Emitted only when non-empty — `alignment: []`
asserts "aligned to nothing", which is a different and wrong claim.

### THE achievementType BUG

`buildAchievement` hardcoded `achievementType: "Certificate"`.

**OB3 does not determine this value. The issuer asserts it and nothing
validates it** — nothing can, because only the issuer knows what decision was
made. So for the platform's entire history, every Certidemy credential asserted
"certificate" (a document you receive) when the event was a certification
decision against a published blueprint with a defended pass mark. Understating
itself in the one machine-readable field that categorises the credential, on the
exact axis Certidemy competes on.

Now read from `achievements.achievement_type`. Live value confirmed:
`"achievementType": "Certification"`.

### Subject hash from the column

Was `auth.admin.getUserById(cred.user_id)`. Now `credentials.holder_email`,
which is snapshotted at mint, stable against an account email change, and the
only source that exists before the account does — which issue-to-email-then-claim
requires.

The viewer gate is unchanged and was re-verified: an anonymous fetch carries no
`identityHash` and no `salt`.

Applied by `scripts/patch-open-badge-achievement-first.mjs` (gitignored).

---

## 5. THE ANCHOR: A RULE THAT NOW HAS THREE OCCURRENCES

**A change to emitted credential shape requires THREE things to move together:**

1. `DOC_VERSION` in `scripts/build-credential-anchor.mjs`
2. `credentials.material_updated_at` (the proof's `created` reads from it)
3. an anchor rebuild

Occurrences so far: adding `eddsa-rdfc-2022` (v7.5), `achievementType` today,
and there will be a third. `trg_credentials_bump_material` CANNOT catch this —
it only watches `holder_name`, correctly, because a renderer change is not a
change to the material.

**This belongs in `CERT-PUBLISH-CHECKLIST.md` §6 as a hard gate. NOT YET
ADDED.**

### What happened today

Pass 2 changed the served bytes. Measured, not assumed:

```
served now: 366981ac5a547b6c...
leaf wanted: c6f56c46fe9a9785...
```

The 18 Aug anchor (block 963090) remains TRUE — it describes the documents as
they were then, and its row stays in the table under
`doc_version = 'ob3-dual-proof-2026-08'`. It simply no longer describes what is
served.

Sequence run: bump `material_updated_at` → clear `anchor_id`/`anchor_leaf`/
`anchor_path` on both live credentials → `DOC_VERSION` →
`ob3-achievement-first-2026-08` → rebuild → `ots-submit` → 2h wait →
`ots-upgrade`.

**Result: block 963202, 2026-08-19T17:31:09Z**, hash
`000000000000000000004ca7baf1fbb02ef4242906e6d7a5fc723d538a87f467`.
Leaf now matches the served document. Verified by hand.

### The builder skips anything already anchored

`build-credential-anchor.mjs` selects only credentials with no `anchor_id`, so a
rebuild requires clearing the link first:

```sql
update public.credentials
set anchor_id = null, anchor_leaf = null, anchor_path = null
where is_specimen = false;
```

**Durable fix, NOT BUILT:** a `--rebuild` flag that re-anchors rows whose
`doc_version` is not current. That makes `DOC_VERSION` load-bearing instead of
decorative, and the builder already knows the current value. Needed before the
GitHub Actions cron lands, or the daily job will silently skip every credential
whose bytes have moved.

### ots-upgrade now stores the block hash

It always fetched it — `blockTime()` returns `{ hash, iso }` — and printed it to
the console, then discarded it. Patched to write `btc_block_hash` and
`btc_block_height`. The two 963090 rows were backfilled by hand in 234; 963202
was the first stored natively.

**Why the hash and not just the height:** an explorer URL takes the HASH.
`/block/<hash>` renders a page; `/block-height/<height>` returns the hash as
plain text and nothing else. The hash is also the explorer-independent artifact
— someone running their own node needs it and nothing from any website.

---

## 6. STATUS LIST INDEX — NOT A PROBLEM, RECORDED ANYWAY

`credentials_status_list_index_uniq unique (issuer_id, status_list_index)` —
uniqueness is ALREADY per-issuer (migration 185). The sequence is global, so a
partner's first credential may get index 500,000 and size their bitstring at
~62KB of near-entirely zeros. It gzips to nothing. **Not a correctness problem
and not worth a migration.** Revisit only if a high-volume partner appears.

---

## 7. THE PARTNER ISSUER LIFECYCLE (BUILT AND PROVEN)

### `functions/create-partner-issuer` — step one, reversible

`POST { company_id, slug, name, site_url, verification_domain }`,
platform_admin. Creates a `draft` issuer with a 256-bit hex verification token.
No keys, no Vault, no status change.

Validates slug against `SLUG_RE` (mirrors the 230 CHECK) and a RESERVED set.
The reserved list is **policy-shaped and lives in code, not a constraint** —
it will change more often than the schema. Three groups: our own identity,
namespace path segments, and words implying accreditation. The third matters
most: `iso-certified` as a slug would put an accreditation claim inside the
permanent identifier of every credential that partner signs, where no disclaimer
on any page can reach it.

### `functions/activate-partner-issuer` — step two, irreversible

`POST { issuer_id, mode: "verify" | "activate" }`, platform_admin.

- `verify` — fetch `https://<domain>/.well-known/certidemy-issuer.txt`,
  compare, set `verified`. `redirect: "error"` — a partner who can be redirected
  off their own domain has not proven control of it.
- `activate` — require `verified`, re-check the domain, generate the keypair,
  **PROVE IT SIGNS**, store via `issuer_store_key` (185), flip to `active`.

**THE KEY PROVES ITSELF BEFORE IT REACHES VAULT.**
`crypto.subtle.generateKey` for Ed25519 was the only call in this path never run
in this runtime. So: generate → export PKCS#8 → re-import through the SAME
stripping logic `ob3.ts importSigningKey` uses → sign a probe → verify against a
public key rebuilt from the RAW bytes about to be published. Any failure aborts
having written nothing.

A key that cannot sign, stored in Vault and published in a Profile, produces
credentials that fail verification with an error naming the SIGNATURE. Nobody
would look at the key.

HTTPS well-known, not DNS TXT: `Deno.resolveDns` may not exist in this runtime
and a verification path that silently degrades is worse than a narrower one that
works.

`config.toml` carries explicit `verify_jwt = true` for both. Explicit, not
defaulted — the file's own comments record what happens when a pin lives
anywhere other than that file.

### The well-known file lives on the credentials Worker

`credentials-worker/src/index.js` serves
`/.well-known/certidemy-issuer.txt` from a wrangler SECRET
(`ISSUER_VERIFICATION_TOKEN`), above the env guard and outside `route()`.
Absent token → 404, which is what any domain returns when the file is not
published and is the truthful answer.

**Not certidemy-web:** Cloudflare Pages has skipped dot-prefixed directories
when uploading assets, so a file in `public/.well-known/` can deploy to nothing
with no error anywhere.

**The `.txt` suffix is load-bearing.** The next-intl matcher in
`certidemy-web/middleware.ts` excludes `.*\.(?:...|txt)`, so
`/.well-known/certidemy-issuer.txt` already escapes locale prefixing. Verified
by regex test and live 404. **A well-known file with NO extension would 307 to
`/en/.well-known/...`** — if OIDC discovery or apple-app-site-association is
ever added, the matcher needs the change.

### `scripts/test-partner-issuer.mjs`

Drives the whole lifecycle, signs in with email+password for a real user JWT
(service role has no user behind it, so `authenticate()` rejects it), asserts
specific values at every step, and parses the published key with its OWN base58
decoder rather than the encoder that produced it.

`--refusals-only` needs nothing published. `--issuer-id <uuid>` resumes a draft
— needed because each run creates a fresh company, so a later run cannot re-use
a slug an earlier run reserved.

**The token is shown ONCE, at creation. No endpoint returns it again.**

---

## 8. test-partner-02 — A SECOND LIVE ISSUER

Permanently burned test slug. **Cannot be renamed, reused or deleted.**

```
slug        test-partner-02
issuer_id   2841efa2-ba59-474e-91d3-8fd5ced11ca2
company_id  f222d6bf-108a-45f5-ae17-83d959a16828
key         z6MkukK753DmsUsmZLgKqG5xK7CQUkfS7WuDX8uorJHyDYeo
profile     https://credentials.certidemy.com/issuers/test-partner-02
```

16/16 on the full run. The four that matter: the live Profile publishes the same
key that was minted, the multicodec prefix is `ed01`, the key material is 32
bytes, and it imports as Ed25519.

**Then `verify-rdfc-proof.mjs` verified the partner's signed status list against
their published key** — both cryptosuites, using code that shares nothing with
the signer and fetching the key over the network. A key generated minutes
earlier by a function that did not exist that morning produces signatures a
stranger's verifier accepts.

### The pass-1 defects, confirmed dead in production

```
?doc=credential&code=SM-AI-I-ZZMV-JPC8&issuer=test-partner-02
  -> every id says certidemy
?doc=achievement&cert=SM-AI-I&issuer=test-partner-02
  -> 404
/issuers/test-partner-02/status/1
  -> 200, signed with the partner's key
```

These checks were IMPOSSIBLE this morning. Both fixes were unprovable until a
second issuer existed.

---

## 9. SECURITY INCIDENT — ROTATE IF NOT ALREADY DONE

During the Worker setup the `info@certiglobal.org` password was entered at the
`wrangler secret put ISSUER_VERIFICATION_TOKEN` prompt instead of the
verification token. It was then served publicly at
`https://credentials.certidemy.com/.well-known/certidemy-issuer.txt` until
overwritten minutes later.

Caught because the next command fetched the URL and printed what was there.

**The account is `platform_admin` on the system that mints signing keys.**
Cloudflare holds request logs regardless of whether anyone fetched it.

**STATUS AT SESSION END: rotation NOT confirmed.** If the password has not been
changed, change it, and change it anywhere the same string is reused.

---

## 10. OPEN — IN ROUGH ORDER

1. **Rotate the `info@certiglobal.org` password** (§9) if not done.
2. **`?doc=anchor` does not return `btc_block_hash`.** 234 added the column;
   the endpoint still serves only `txid`. The panel link needs it.
3. **The seventh panel row** — anchor verification in the OB3 credential modal.
   Design agreed, four states, all computable from `?doc=anchor` plus the
   credential the panel already has:

   | condition | shows |
   |---|---|
   | 404 "not anchored yet" | *Timestamp pending — hashed at the next batch* |
   | `anchoredAt` null | *Submitted to Bitcoin · awaiting confirmation* |
   | `anchoredAt` set, leaf matches | ✓ *Anchored 19 Aug 2026 · block 963202* ↗ |
   | leaf mismatch AND `docVersion` stale | *Re-anchoring after a document update* |
   | leaf mismatch, `docVersion` current | ✗ red — the only real failure |

   **Two traps.** The panel must fetch the PUBLIC copy for hashing — a
   signed-in holder gets `identifier[]` and hashes differently, producing a red
   X on a perfectly valid anchor. And the block hash must be rendered in
   monospace beneath the link, so the check does not depend on Blockstream
   existing.

4. **Nothing can issue a partner credential yet.** Needs: an achievement row for
   a partner issuer, and an endpoint that mints a credential against it.
   `issuer_api_keys` exists and nothing consumes it.
5. **`claim_credentials` is not wired into signup.** Until it is, an
   issue-to-email credential never links to the account.
6. **`?doc=baked` cannot serve a partner badge.** `BADGE_B64` in
   `_shared/badges.ts` is a compiled-in map of eleven PNGs. A partner's artwork
   lives in storage. Needs a runtime fetch, a size guard, and a decision about
   missing artwork. Does not block issuing; a partner will ask on day one.
7. **`--rebuild` flag on `build-credential-anchor.mjs`** (§5).
8. **`CERT-PUBLISH-CHECKLIST.md` §6** — the three-things-move-together rule.
9. **Four certifications have no specimen**: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.
   Seven were minted when seven existed. Blocks the sales library A6 asset and
   the reference-example button.
10. **The "hosted by, not endorsed by" line** on the verify page for
    non-certidemy issuers (§1).
11. **No partner portal exists.** Console (platform admin) and Learning are the
    only surfaces. The two issuer functions have no UI.
12. **Super admin needs partner-portal access** — the agreed design is a REAL
    `team_members` row making Certidemy the zeroth partner and a context
    switcher in the console shell, NOT a `platform_admin` read-through. A
    special-cased admin view is a different code path and will drift.
13. **`229_partner_leads.sql`** is the top of this funnel and is not wired to
    company creation. A converted lead should carry its `ghl_contact_id`
    through.

---

## 11. WHAT THIS SESSION TAUGHT

**A latent security defect is invisible until the condition that triggers it
exists.** Both `open-badge` defects were unexploitable with one issuer and
became exploitable the moment a second one activated. They were found by reading
the file before generalising it — not by any test, because no test could have
failed.

**A value nothing validates will drift and nobody will notice.**
`achievementType` was wrong for the platform's entire history. OB3 publishes a
vocabulary and the issuer asserts; there is no validator anywhere in the world
that would have flagged it.

**Guards that abort are worth more than guards that warn.** The config patch
refused on mixed line endings. The migration transaction rolled back on a
trigger ordering bug. The keygen self-test would have refused to store an
unusable key. Every one of those cost a minute and would have cost hours later.

**Verification commands can lie.** `Measure-Object -Line` undercounted by every
blank line. A `ReadAllBytes` threw and the next line printed a stale `$b` from a
previous command, reporting a plausible wrong answer about the wrong file. Assert
specific expected values, and be suspicious when a check passes for free.

**Instrument instead of arguing.** The anchor staleness question was settled in
one command — hash the served document, compare to the leaf — not by reasoning
about it.

---

## 12. VERIFICATION SNAPSHOT AT SESSION END

```
issuers            2 (certidemy active, test-partner-02 active)
achievements      11 (all certidemy, all Certification)
credentials        9 (7 specimens + 2 real)
credential_anchors 3 (963090 x2 stale-but-true, 963202 current)
migration tip    234
```

Both live credentials anchored to `447540a67a24d2c3`,
`doc_version = ob3-achievement-first-2026-08`, block 963202,
`anchored_at = 2026-08-19 17:31:09+00`.

`verify-rdfc-proof.mjs --tamper` green on SM-AI-I-ZZMV-JPC8.
`verify-rdfc-proof.mjs` green on test-partner-02's status list.
Leaf `366981ac…` matches the served document byte for byte.

Block 963202 is public:
`https://blockstream.info/block/000000000000000000004ca7baf1fbb02ef4242906e6d7a5fc723d538a87f467`
