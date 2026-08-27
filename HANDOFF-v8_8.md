# HANDOFF v8.8 — Two standards, one of them unproven

**Migration tip: 259. Next free: 260.**

Read v8.7 first for the credential mint bug, the resume bug and migrations 247–249.

This one covers a long session across three repos: an Open Badges 2.0 export
that makes every credential importable into Moodle and Canvas today, the console
turned into something you can show a client, and **LTI 1.3 phase 1 built
end to end and never once exercised.**

That last clause is the most important sentence in this file. See §7.

---

## 1. The strategic reframe that unlocked everything else

The session opened with a line worth keeping, because it changed what got built:

> *"You never want to tell a client you're too good for them. You can absolutely
> tell a client you comply with what they have, and are built for where they're
> going."*

The prior position was that the major LMSs use OB 2.0, which is unsigned and
LMS-hosted, and that pushing into it downgrades the credential to the thing
Certidemy is better than. True, and it loses deals.

**The correct framing: the OB3 credential remains the authoritative signed
artifact, and OB2 is a *view* of it for systems that can't read OB3 yet.** Same
as offering a PDF. You don't stop being a certification body because you also
emit a format Moodle can swallow.

Both sentences are now true in code:

*"Your LMS reads OB2? Every credential we've issued is importable today — same
badge, same recipient, and the signed OB3 original is behind it."*

*"LTI 1.3? Drop us into your course."* — built, unproven.

---

## 2. OB 2.0 — additive, and measured to be

**One thing reads the credential document's bytes**: `build-credential-anchor.mjs`
fetches `/credentials/<CODE>` anonymously and hashes it. A sibling route is
invisible to it. `/credentials/<CODE>/badge` and `/anchor` are the precedent.

`SM-AI-I-ZZMV-JPC8` hashed `366981ac…a109a796` before the deploy, after it, and
after the second deploy. **Measured additive, not assumed additive.**

**The recipient hash was already the OB2 computation.** `hashSubjectIdentifier`
does `sha256(email.trim().toLowerCase() + salt)` and returns `sha256$<hex>` —
that prefix is an OB2 convention with no OB3 requirement behind it, so whoever
wrote it carried the idiom forward deliberately. It lifted into an OB2
`recipient` unchanged, and was **reproduced independently in Node** against
`julio.ingmec14@gmail.com` to confirm it verifies outside our own code.

### The one decision that had to be made first

The OB3 document deliberately withholds the recipient hash from the public URL —
the anchor script *aborts* if it finds one, calling it a disclosure bug. OB2
hosted verification is unusable without it: an assertion with no recipient
identifies nobody.

**Decision: publish it on the OB2 route.** The salt is 16 random bytes minted per
credential and exists so the hash *can* be published — `_shared/issue.ts` says so
in as many words: it needs randomness, not secrecy. The OB3 restriction was a
conservative default, not a considered privacy position.

**The anchor guard is unchanged and unweakened**, with a comment at the guard
itself saying the rule is about `/credentials/<CODE>` and *the exception is that
URL, not a relaxation of this rule.*

### Two defects testing found that reading did not

**`criteria.id` and `image` pointed at 404s.** Both were gated on *the achievement
is backed by a certification*, which does not imply either URL resolves — anon
RLS on `certifications` is `status = 'available'`. The first `ob2` fetch of
`ZZ-TEST-I-A6BJ-EA5R` emitted `/certifications/zz-test-i` and
`/badges/ZZ-TEST-I.png`, both 404. **That is the exact defect removed from
`buildAchievement` once already, arriving in a new format.** Now gated on the
status and on presence in `BADGE_B64`.

**`holder_email ?? ""`** would have hashed the salt alone — a real-looking
`sha256$` no verifier could ever match, claiming an identity never recorded. Now
a 422: OB2 has no optional recipient.

### `/credentials/<CODE>/ob2` is immovable for the *opposite* reason to its neighbours

`/badge` and `/anchor` say they could move because no signed document names them.
**The OB2 assertion's own `id` IS this URL** — that is what hosted verification
means, and moving it makes every assertion ever served unverifiable. The route
comment explicitly warns against copying the neighbouring one.

### Honest weaknesses, written down rather than discovered

Results are omitted entirely — OB2 has no comparable structure, so a credential
whose issuer chose public results exposes *less* over OB2 than OB3. **That is the
format's limit, not a policy of ours.**

Revocation carries `revoked` and `revocationReason` but no hosted
`RevocationList`. **An OB2 consumer that cached the assertion learns nothing about
a later revocation until it re-fetches**, whereas the OB3 status list is polled.
Standard for this profile, genuinely weaker, and a partner should be able to find
it written down.

---

## 3. The same bug, a third time, in the same insert

**Migration 231 added `credentials.holder_email` and `claimed_at`, backfilled
every existing row, and named no writer.** `score-mock-exam` was not updated, so
every credential minted by a passing exam since 2026-08-19 carried NULL in both.

This is the **third** time that one insert has been caught by this pattern:
`issuer_id`/`subject_salt`, then `achievement_id` (v8.7), now these two. **The
comment warning about it was already in the file** when 231 broke it again.

Nothing enforced either column, so nothing broke loudly. It surfaced only when the
OB2 route tried to build a recipient and found no address to hash.

`claimed_at` was fixed in the same edit though not asked for — same insert, same
migration, same omission. An exam credential is **born owned, so born claimed**.
Leaving a known-identical defect in a line already being edited would have meant a
third round.

**Nothing reads `credentials.claimed_at`** — the roster's "unclaimed" derives from
`vouchers.assigned_user_id`. So the NULL misreported nothing to any surface. Fixed
forward, no display investigation.

**Migration 252's two statements have different gates, deliberately.**
`holder_email` is guarded on `issued_at > auth.users.updated_at` because
`profiles.email` is mutable with no audit trail anywhere in the schema — a
credential issued a year ago to someone who has since changed address cannot be
backfilled honestly. `updated_at` moves on login, so the proxy **over-refuses
rather than over-writes**. `claimed_at` is ungated because there is nothing to be
wrong about.

`ZZ-TEST-I-A6BJ-EA5R` was declined **by the rule rather than by an exception** —
no hardcoded credential code anyone has to remember later.

---

## 4. A second route to a verified issuer

*"If I'm Joe Shmo Scrum Consulting running off a LinkedIn page, I can't issue
through Certidemy?"*

Correct, as built. Activation fetched a `.well-known` file, so no domain meant no
issuer. **Nobody decided to exclude solo trainers; the verification method just
happened to require file hosting.**

**The domain check does no reader-facing work.** It gates activation and
disappears — `verification_method` appears in no credential, no certificate, no
badge and nothing on the verify page. `certidemy`'s own issuer has a NULL domain
and has signed every credential on the platform.

So this is a **gate change, not a claims change**, and it stays one only while
nothing renders it.

**Migration 250** adds `verification_method` — `'domain'` or `'attested'` — with
two pairing CHECKs that keep them from mixing. An attested issuer who later
acquires a domain must move to `'domain'` and set it in one statement: **acquiring
a domain means re-verifying through it, never inheriting an attestation.**

Not an `issuer_status` value: lifecycle and method are orthogonal axes.

`attest` requires `status = 'draft'` and is **not repeatable** — `verify` is
repeatable because re-running a check is free, but attestation records a
*decision* and the `admin_actions` row is the evidence. Re-recording a decision
already made is audit noise.

**And it closed a hole while it was there.** The `certidemy.com` refusal lived
only in the console modal, so a raw invocation bypassed it — which is how
`test-partner-02` came to be `verified = true` against
`credentials.certidemy.com`, a host we control, proving nothing. The function now
refuses `certidemy.com` **and `certiglobal.org`**, exact match or subdomain.

> **Durgical is the first attested issuer**, created end to end through the
> console: company → invite → signup → issuer → attest → activate. The first
> partner onboarded without touching SQL.

---

## 5. The console became something you can show a client

*"If you were a UI/UX expert with decades of experience — is this how software is
shown today? Is this commercially ready?"*

No, and the diagnosis was specific: every label was the same 11px uppercase mono
grey, so `CREDENCIALES EMITIDAS` and `CLAVE DE FIRMA` read as equally important;
the 48-character signing key was the loudest thing on a screen where it is the
least useful; and four sections rendered whether or not they had contents.

**The principle: a section does not exist until it earns existence.** Not
collapsed — absent. "No hay claves activas" tells a partner they have zero of a
thing they have never heard of.

**Three zeros in a metric grid is the screen apologising.** Counts moved into
subtitle prose. Day one is one card: what an achievement is, why they need one,
and the button — the empty state *is* the page. API keys and webhooks became a
single sentence, becoming a real disclosure only once a key exists.

**The third state was the one nobody had looked at.** A `team_admin` on a
non-active issuer saw four sections, three empty, and no action anywhere —
because the lifecycle block is admin-gated. **That is the partner-facing case and
it was the worst of the three.**

**The badge placeholder was a bug, not a design choice.** Eleven certification
achievements have committed PNGs, and this was the one surface not using the
`imageUrl ?? /badges/{code}.png` convention that five other files already use. It
rendered a dashed square *and disabled the click* for artwork that exists.

**Status chips say what the platform will let you do, never what Certidemy thinks
of you.** "Ready to issue", not "Verified" — the latter reads as Certidemy
vouching, which is precisely what `verification_method` is forbidden from saying
publicly. `scripts/i18n-issuing-redesign.mjs` **aborts the merge** on any
`Verified` / `Approved` / `Trusted` / `Accredited` value in any locale.

### CSV batch issuing, and CP1252

Two columns only — `email` and `full_name`. **Splitting first/last is a Western
assumption that breaks immediately in LATAM**, and a file with `nombre` and
`apellidos` is *refused with the remedy* rather than guessed at: it parses
cleanly, which is what makes it dangerous.

**Spanish and Portuguese Excel on Windows writes CP1252.** `File.text()` assumes
UTF-8, so an accented name arrives as replacement characters — and that string is
the holder name inside a signed credential, printed on a certificate, at a public
URL, unfixable after the mint. Decode UTF-8; if the result contains U+FFFD,
decode the same buffer as windows-1252. Those locales also default to `;` as the
delimiter, because `,` is the decimal separator.

**Idempotency is on the credential** (migration 247), keyed on a batch label the
partner types. A generated id breaks on re-upload; file content breaks when
someone fixes a row; **a human label survives both.** `dry_run` defaults to
**true**, and preview and commit share one body object so the preview cannot lie
about what commit will do.

`npm run csv:check` (24 fixtures) and `npm run quiz:check` (25) exist because
`npm run build` cannot find any of this — **nothing throws.**

---

## 6. LTI 1.3 — the architecture is the deliverable

`HANDOFF-v7_7.md` §4 had the decisions and no code. They stand: Tool not
Platform, RS256 alongside Ed25519, and **integrate on the trigger and the link
back, never the badge.**

### The rule everything else follows from

**No branching on vendor. Ever.** `product_family_code` is recorded for
diagnostics and support tickets and must never appear in an `if`. **A new LMS is
a new row, never a new code path.**

That rule exists because the variance is real and researched rather than assumed:

- **Canvas cloud uses one `iss` for every instance** — plus separate beta and test
  issuers. So `iss` alone identifies nothing, and `(iss, client_id)` is the key.
- **`deployment_id` cardinality differs** — Canvas many per client, Moodle usually
  one. Modelling it as a column on the registration works against Moodle and
  breaks against Canvas.
- **`sub` may be absent entirely**, is unique only within a platform, and Canvas
  reportedly emits different values per placement. The identity key is itself
  optional.
- **Service availability is per-install, not per-product** — Moodle omits the AGS
  claim unless a plugin setting is on. "Moodle supports AGS" is false as a
  statement about a product.
- **Unsubstituted custom variables return as their own literal** — ask for
  `$Canvas.user.sisSourceId` where it can't resolve and you receive that string.
  Present, a string, and not data. A naive truthiness check is defeated.
- **No LTI-normative clock skew number exists.** So tolerance is a per-registration
  column, not a constant.

### Capabilities are tri-state, and absence is a row that isn't there

`unknown` / `true` / `false`, where **unknown is the absence of a row**. The CHECK
permits only `'true'` and `'false'`, so `unknown` can never be written as a value
and then compared as a string — which is how tri-state usually degrades back to
two states within a month.

**Tier C capabilities are writable at runtime by the code that discovers the
limitation.** When something fails in a way that names a platform quirk, the
handler records it and takes the other path next time. Nobody edits code; nobody
ships a release. **If Tier C were admin-configured, the first institution with a
new quirk becomes a support ticket and then a patch** — which is the failure mode
being designed against.

The console renders **`KNOWN_CAPABILITIES`, not the rows.** Iterating rows makes
absence invisible by construction. And `value` is `text`, so **`value ? "yes" :
"no"` renders "yes" for false** — it would look correct in every demo where
everything happens to be true. `capabilityState()` returns one of three literals
so nobody can flatten it with a ternary.

### The two security decisions that are counter-intuitive

**Step 4 — resolve the registration from `lti_nonces.platform_id`, never from the
token's `iss`.** At that point the token is unverified and `iss` is
attacker-controlled; **using it to pick which key verifies the signature is the
classic mistake.** A crafted `iss` verifies beautifully against a key the attacker
controls. Resolving from the row we wrote at login time makes `iss` a *check*
rather than a lookup key — the same instinct as `open-badge` resolving the issuer
from `credentials.issuer_id` rather than a query param.

**Step 6 — consume the nonce *after* verifying.** Consuming first lets anyone burn
a real student's state mid-launch with a garbage POST. **That presents as "the exam
link doesn't work for me" and is almost impossible to diagnose from the other
end.**

### The disclosure line

**One generic page for every verification failure; the precise reason goes in the
skeleton row; a reference id bridges them.** `bad_signature`, `unknown_kid`,
`nonce_not_found` vs `nonce_consumed`, `expired`, `aud_mismatch` — each would
confirm one field was right, and the nonce pair is a replay oracle.

Same precedent as `requireIssuerAccess` returning an identical 403 for "no role"
and "wrong company".

**Better than differentiated errors**, because the reference id also works for
failures a user can't screenshot. Two deliberate exceptions:
`unregistered_platform` keeps its readable page naming `iss` and `client_id`
(the reader is an admin doing setup, and the alternative is an institution
silently unable to start), and a student `LtiResourceLinkRequest` gets an honest
"not supported yet" — that's phase 2 not existing, not a failure.

### The JWKS error taxonomy exists because of a question

Asked what it would look like if the in-memory cache assumption was wrong, and
the answer changed the design.

**The imagined failure was rate-limiting under load. The realistic one is a WAF or
allowlist** — which fails on the very first launch at that institution rather than
at 9am under load. *"It has never worked here"* is dramatically easier to diagnose
than *"it worked and then stopped."*

But we'd only recognise it if the codes were distinct, so they are:
`jwks_unreachable`, `jwks_http_429`, `jwks_http_403`, `jwks_http_5xx`,
`jwks_not_json`, `unknown_kid`, `unknown_kid_cached`, `jwk_unusable`. **Collapsed
into one `jwks_failed`, a rate limit and a key rotation would look identical and
we'd chase the wrong remedy.**

Residual named: the cache dies with the isolate, the fix is a `lti_jwks_cache`
table, and **the evidence would arrive as `jwks_http_429` with a platform name
attached.**

### Two things that would have cost an afternoon each

**`lti` had to be excluded from the middleware matcher.** An LTI launch is a
cross-site POST carrying `id_token` as a form field, `localePrefix` is `"always"`,
and a 307 to `/en/lti/launch` **turns the POST into a GET and drops the body.**
The launch then fails with nothing in the logs naming the cause. Same class as the
`sitemap.xml` incident already recorded in that file, but silent rather than a
404 — it presents as *"the integration doesn't work at this institution."*

**`deep_linking_settings.data` is opaque and must be echoed back.** Optional, and
Moodle doesn't send one — **so it would have worked in testing and failed silently
at the first platform that does**, with the rejection entirely at their end. One
column (migration 259). Naming it in a header and moving on would have been worse.

### The two-table log split

**Evidence** — raw JWT plus decoded claims, PII-bearing, 30 days. The raw token
matters because decoded claims are *what we think arrived*; the raw one can be
re-verified against the platform's JWKS months later. For a disputed exam attempt
only the second is worth anything.

**Skeleton** — `iss`, outcome, error code, timing, and a **boolean map of which
claims were present, never their values**. No PII, retained indefinitely, and it is
what feeds capability inference. *"This registration has never released an email in
40 launches"* is a permanent fact derived from a table holding nothing personal.

**The skeleton policy deliberately admits `platform_id IS NULL` rows** — those are
the `unregistered_platform` attempts, and they are the most valuable rows on the
screen. **An error log that is also a sales signal:** you learn an institution is
trying to integrate before they email you.

---

## 7. LTI phase 1 is complete and unproven. Read this before trusting §6.

**No `lti_platforms` row has ever existed.** Therefore nothing has reached:

- signature verification against a real platform key
- a JWKS fetch against a live platform — **every code in that taxonomy is
  untriggered**
- `iss` / `aud` / `azp` / `exp` / `iat` / `nonce` checks
- **nonce consumption — the atomic replay guard has never fired**
- deployment auto-registration — `lti_deployments` is empty
- capability observation — `lti_capabilities` is empty
- evidence writing — `lti_launch_evidence` is empty
- the picker, the signed `LtiDeepLinkingResponse`, session consumption, the
  `deep_link_data` echo

Also unexercised: `aud`-as-array with `azp`, `unsubstituted` custom variables,
`state_cookie_survives`, `accept_multiple = false`, the `noscript` button, the
`--force` path in `lti-mint-key.mjs`, and `lti_sweep_expired` deleting a non-zero
count.

**What IS proven:** the refusal paths — four skeleton rows, all failures, with
reference ids matching row ids exactly. The JWKS going from `{"keys":[]}` to
serving one key. The `kid` thumbprint recomputed through `node:crypto` rather than
the WebCrypto path that produced it, so the two agree only if both are right. And
`public_jwk ? 'd'` is false — **no private member leaked into a document served to
the entire internet.**

> **Code being complete and code being proven are different claims. Only the
> first is true here.** Registering a real Moodle is what tests it, and the first
> real Canvas institution will produce at least one surprise. **That is not a
> failure of the design — it is what the variance architecture exists to absorb,
> and it only proves itself when something unexpected arrives.**

### Registering a Moodle — our screen, their screen, our screen

1. `/console/lti` → copy the four URLs. **Copy, never retype** — Moodle compares
   `redirect_uri` character for character.
2. Moodle → Manage tools → configure manually. LTI 1.3, Keyset URL, the four
   values. **Leave AGS and NRPS off** — advertising a service we don't answer is
   exactly the variance that ends up in a capability row.
3. Moodle → View configuration details → Platform ID (`iss`), Client ID, and the
   three `/mod/lti/*.php` endpoints. **Note the deployment id but don't enter it**
   — deployments auto-register on first launch.
4. `/console/lti` → Register.

An unknown `deployment_id` on a known platform is attested by the platform's own
signature, so **refusing one would turn every new Canvas placement into a support
ticket.**

---

## 8. The two-repo blind spot, with a concrete instance

`CLAUDE.md` records that a finding in one repo's file is invisible to a session
rooted in the other. It now has a sharper form.

**The supabase session listed five web-repo commits as "predating my work". Two
of them were made *after* its own first web commit that afternoon**, by the web
session, in this same conversation.

The inference came from `git log` position — **which orders by graph, not by
time, and carries no information when two sessions interleave on one branch.** One
`--date` flag would have shown it.

**Assume the sibling repo is being worked on right now, because it usually is.**

It cut the other way too: an item flagged as stale *was* stale — the modal's
self-host list had already been widened — but by this chat's own web session
responding to migration 250, not by unrelated history.

---

## 9. Guards, and the rules that keep being paid for

**The `MUST_BE_GONE`/proxy guard rule is now four-for-four**, and the fourth is
the worst. Substring, memory and distance all fail *at the guard*. **Shape failed
silently and produced wrong code** — an anchor of `})),\n  }));` was unique,
passed the uniqueness check cleanly, and matched the wrong map. `tsc` caught it
only because the two maps happened to differ in type.

**Uniqueness doesn't rescue it:** a shape can be unique by accident and still
belong to something else, so the check that normally catches a bad anchor is the
one that certifies this kind.

**The two script flag conventions are opposites**, now recorded as a table because
prose lets you read it and still get it backwards:

| family | flag | default |
|---|---|---|
| opt into safety | `--dry` | **LIVE** |
| opt into writing | `--apply` | **dry** |

**A script must abort on an unrecognised flag.** Never trust that the reader knows
which family a script is in.

**Long single-quoted strings in a `plpgsql` body do not survive terminal
scrollback → SQL editor.** The terminal wraps mid-string and the paste arrives
truncated — a `42601` pointing at a line that isn't the problem. Worse than
mojibake, because a mangled `raise exception` message **can also paste cleanly and
just be wrong.** Split across `message` / `detail` / `hint`.

**When the human edits SQL before running it, read the body back from `prosrc`.**
A migration file that doesn't match the live function is a record that lies, and
the next person edits from it.

**When you widen a path, re-read what is recorded about it.** Making resume more
reachable made a known-unpatched defect more likely to fire. Those entries are
landmines indexed by the code they sit in, not a backlog to work in order.

The WebCrypto typing trap (`Uint8Array` widening to `ArrayBufferLike`) fired again
in `_shared/lti-jwt.ts` — **a note from a previous session catching this one, in a
file it could not have anticipated.**

---

## 10. Open

**Highest value:**

1. **Register a real Moodle.** Everything in §7 depends on it.
2. **LTI phase 2** — the student launch. That is where the identity and entitlement
   work lives: programmatic user creation (zero occurrences in either repo today),
   server-side session minting (same), `lti_users` on `(platform_id, sub)`, and
   **what a launched student is entitled to.** `profiles.email` is NOT NULL UNIQUE
   and feeds five downstream paths including `credentials.holder_email` — **a
   synthetic address for a withheld email would be hashed into a credential.**
   Settle that on paper before any code.
3. **The last-admin guard.** Statements drafted, never run. A `team_admin` can
   already add or remove another via PostgREST with no audit row and no
   last-admin protection — harmless while no company has two admins, and it
   changes character the moment multi-admin ships. **Next free number 260.**

**Found, not fixed:**

- **`test-partner-02` has two live unrevoked API keys** on an active issuer owned
  by a company with zero admins and an unredeemable `.invalid` invite. Nobody on
  the partner side will ever notice them.
- **Migration 057's catalogue publish gate is gone.** `domains` and `tasks` carry
  `USING (true)` plus `GRANT SELECT` to anon, so **any certification's blueprint
  is anonymously readable regardless of status**, including drafts.
  `quiz_questions` does not leak.
- **`verify-cert`'s baseline is not clean** — 43–44 checks, and **AIE-I fails §8**
  on 15 ungrouped items (`practice`, `es-419`, created 20–21 August). None secure,
  so no exam form can contain them. Cause unestablished.
- **The third mint is not consolidated.** Four sites insert into `credentials`.
  `mint-missing-credentials.mjs` has never been run against a real orphan.
- **`issue-credential-batch` returns English per-row reasons** into a trilingual
  console. Not mapped to keys — that would be a substring proxy and a fifth
  cross-repo pair. The real fix is a machine-readable code from the function.
- **`isCertExam` is decided by shape**, so a simulator result with an empty
  concept breakdown renders as a certification exam.
- **Copy on an archived achievement creates an active one**, so archiving does not
  prevent content reappearing.
- **`ZZ-TEST-I`** is permanent at `unavailable`, holding one revoked credential at
  `status_list_index` 23 — kept deliberately, because **a throwaway cert at draft
  is the only place a refusal guard can be tested without the check being the
  damage.**

**Deferred with reasons recorded:** PNG baking for OB2 (needs a both-keywords
rule), AGS and NRPS, `lti1p1` migration claims, and a per-company issuing quota —
**nothing meters issuance**, so tiering by volume still has no counter to enforce
against.
