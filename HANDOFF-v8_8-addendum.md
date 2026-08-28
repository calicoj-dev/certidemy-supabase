# HANDOFF v8.8 addendum — the unproven half is now proven

**Migration tip: 261. Next free: 262.** Two applied since this addendum was
written: **260** `lti_platform_status_vocab`, **261** `lti_capability_history`.

Read `HANDOFF-v8_8.md` first. **§7 of that file is now out of date** and this
addendum exists mainly to say so: it opens *"No `lti_platforms` row has ever
existed"* and lists everything that had therefore never run. All of it has now
run, against a real platform, and the runbook is in `LTI-SETUP.md`.

The one-line version: **an instructor added Certidemy to a course and the link
landed.** Registration, OIDC login, RS256 verification, nonce consumption,
deployment auto-registration, the tolerant reader, the picker, the signed
deep-linking response, and the platform accepting it.

---

## 1. What was proven, and against what

The platform is the **1EdTech LTI 1.3 Reference Implementation** at
`lti-ri.imsglobal.org` — a hosted test platform, no Docker, no install. Chosen
over standing up a Moodle because both sides are publicly reachable and it costs
nothing to find out.

> **Deep Linking is in the free tier.** Their banner says members get *"services
> and message types"*, and `LtiDeepLinkingRequest` is a message type, so this was
> genuinely open. Settled by doing it, with no membership.

Platform 6475, context 57157 (`AIE-I-2026`), deployment `1`, client id
`certidemy-tool`, our key `uFxPfElfnxCho3cyKWmaFK2XfPe_hZrKERjNvRdkUPU`.

**Four verified launches**, two message types, plus every refusal path that
fired along the way.

| Was unproven in §7 | Now |
|---|---|
| signature verification against a real key | proven, twice |
| JWKS fetch against a live platform | proven |
| `iss` / `aud` / `exp` / `iat` / `nonce` checks | proven |
| **nonce consumption — the atomic replay guard** | **fired unprompted, twice** |
| deployment auto-registration | proven, one row, upsert not re-insert |
| capability observation | six keys, four observations each |
| evidence writing | proven, 3844-char JWT, 30-day expiry |
| the picker | proven, eleven certifications, checkboxes |
| the signed `LtiDeepLinkingResponse` | **accepted by the platform** |
| session consumption | proven |
| `deep_link_data` echo | sent; see §5 for the honest limit |

Still unexercised: the `azp` branch (needs an array `aud`), `unsubstituted`
custom variables, `accept_multiple = false`, `link_type_not_accepted`, the
`noscript` submit button, every JWKS error code, and `--force` on
`lti-mint-key.mjs`.

**And one that read as proven and was not: the iframe.** lti-ri **navigates**
the top-level window rather than embedding us, so `certidemy.com` is first-party
for the entire flow. `state_cookie_survives` read `true` across eight launches
**with third-party cookies blocked in Chrome** — the setting did not apply
rather than failing to bite.

**PARTLY SETTLED 2026-08-27 against Moodle 5.2, launch container Embed.** We
rendered inside a real LMS iframe in Chrome, the page was legible with no CSP or
`X-Frame-Options` interference — the web-side header audit confirmed from a real
browser rather than a datacentre curl — and `state_cookie_survives` read `true`,
4 of 4, in a genuine third-party frame.

**Only one of the two propositions closed.** The frame is tested. **The
cookie-blocked case is not:** Chrome allowed the cookie, so the flip never
happened, and **the `false` branch of that tri-state has never been observed
anywhere, on any platform, in any browser.** Safari is where it is expected and
it remains untested. "The iframe is now tested" must not collapse into "the
cookie-blocked case is now tested" — they are one browser apart.

---

## 2. The bug: a `page.tsx` that returned `Response` objects

`app/lti/select/page.tsx` returned `iframePage()` on five refusal paths and
`new Response(html)` on the success path. **A page must return JSX.** The App
Router took the `Response`, tried to render it as a React node, and threw.

**It failed on every single request, including a completely healthy one.**

What makes it worth recording is *where* it throws. The function body runs first
and runs correctly — the crash is in the handing-back, **after all the work
succeeded**. So every piece of evidence looked fine: the edge function logged a
clean 200 for the page's own context fetch a few hundred milliseconds earlier,
the session row was perfect, `accept_types` was a valid `text[]`, nothing was
null. The visible symptom was `Application error: a server-side exception has
occurred` plus a digest, which reads as a data bug and is not one. Three
hypotheses were formed about the data and all three were wrong.

**The tell was structural.** Every other endpoint in the family — `/lti/login`,
`/lti/launch`, `/lti/jwks`, `/lti/deep-link/return` — is a `route.ts`. `select`
was the sole outlier, and the outlier was the bug.

**Rule, now in `CLAUDE.md` item 17: if it returns a `Response`, it is a
`route.ts`.** Wanting `createTranslator` is not a reason to make a page a
handler; a route handler can import it just as well.

**And the fix for the iframe was not an `error.tsx`.** `/lti` is flat, so it has
no boundary — a throw renders a bare Next digest inside an LMS iframe where an
instructor cannot tell it from their own LMS breaking. But a route handler
renders no React, so there is no boundary to place. The guarantee is a
`try/catch` around the whole handler, which is **strictly stronger**: a boundary
catches render errors, that catches everything, including the translator failing
to load. Two floors — the reader's own language if the translator survived,
hardcoded English if it did not — and a reference id that resolves to a real
`lti_launch_sessions` row either way.

---

## 3. What the reference implementation taught, all of it recorded

`LTI-SETUP.md` is the runbook. Part One is marked **proven** and dated. **Part
Two was executed against Moodle 5.2 on 2026-08-27** and now carries its own
dated marker — one that deliberately refuses Part One's verb. Registration,
OIDC, RS256 verification and the deep-linking request are proven; **planting
content is not**, because Moodle 5.2 accepts only `ltiResourceLink` and we build
a `link`.

The reasoning that put the original "not yet executed" banner there is why the
replacement says EXECUTED rather than PROVEN: a runbook that reads as proven
when it isn't is worse than none, and that applies to the half of Part Two that
still does not work.

Each of these presents as something other than what it is:

**`iss` is the Audience field verbatim, not a constructed URL.** This was
asserted from one example whose operator happened to have typed a URL into that
field, and generalised into a shape. The forum thread had already said the plain
version. It cost a raw SQL correction because **there is no edit action for a
registration** — see §6.

**Paste the entire PEM including `-----BEGIN` and `-----END`.** Without them
their server 500s with `Neither PUB key nor PRIV key: nested asn1 error` and a
full Rails stack trace. Reads as a key problem; is a parse failure.

**The platform JWKS URL needs the `.json` suffix**, and lives under Platform
Keys rather than the main config page. Without it you get HTML, which our code
records as `jwks_not_json` — at least the code names the problem.

**A Context must exist before a Resource Link.** The dropdown is empty and the
form silently discards what you type into it.

**The plain Launch button POSTs the `id_token` with no `state`**, and we refuse
it as `missing_id_token_or_state`. Correct: no `state` means no `lti_nonces`
row, nothing binding the token to a flow we started, and no way to tell it from a
replay. **This trap exists in two places** — the resource link page and the deep
link `/new` page — and both refusals were observed.

**The OIDC path is a different button.** For resource links it is *"Launch
Resource Link (OIDC)"* on the **roster** page, which is where their generated
users live (their `/users` endpoint 502s). For deep linking it is *"Send
Request"* on the deep links **index**. The pattern: one page composes, another
sends.

**And that button is only the first of four.** Corrected 2026-08-27: the
resource-link sequence is *Launch Resource Link (OIDC)* → *Post request* →
*Launch Resource Link* → *Perform Launch*, across four pages, **with our own
`/lti/login` between the second and third** — it mints `state` and `nonce` and
302s to their authorization URL. So a Certidemy refusal can appear mid-sequence,
on what looks like a dead end, when the reader has no reason to think they are
halfway through. `LTI-SETUP.md` step 5 has it; step 8 records that the
equivalent labels for deep linking were never read off the screen and refuses to
guess them.

**Deep links hang off a context, not a resource link.** Looking under the
resource link is the natural first move and it is backwards — a resource link is
what deep linking *produces*.

---

## 4. Three architecture decisions that earned themselves on first contact

**The tolerant reader, on launch one.** The platform sent
`product_family_code` as an **empty string**, not absent — five of seven
`tool_platform` fields were empty strings. `claim_presence` recorded `false` and
`lti_platforms.product_family_code` stayed NULL. A `?? ""` or a truthiness check
would have written an empty string permanently onto the row that identifies the
platform, and nobody would have noticed until a support screen rendered a blank
vendor.

**Migration 259, on the launch it was written for.** Their request carried
`deep_linking_settings.data` = *"Some random opaque data that MUST be sent
back"*. That column exists only because we decided naming a gap in a header was
the wrong place to leave it — and **Moodle does not send one**, so the path would
have looked finished right up until the first platform that does.

**The locale decision.** The planted URL is
`https://certidemy.com/en/certifications/aie-i` — prefixed explicitly, never the
bare path, because *a link in someone's course outlives our routing.*

And two things nobody asked for:

**The replay guard fired unprompted** — two `nonce_consumed` refusals at 15:48:59
and 15:49:03, from a back or a refresh on an already-consumed launch. First time
it has run.

**`state_cookie_survives = true`.** `SameSite=None; Secure` survived the
cross-site POST. One data point from one browser against one platform, and the
design must still never require it — but it is the first evidence the cookie path
works at all.

---

## 5. Two gaps the proving run exposed

> **CLOSED IN THE DATA LAYER 2026-08-27 by migration 261**, and the console has
> not caught up yet — it still renders `value` and `observation_count` and knows
> nothing about the counts. Read the gap below as written; the fix and what it
> could not recover are in 261's header.
>
> Building it also turned up a live bug the gap was hiding: **`supports_deep_linking`
> was not a platform property at all.** `lti-launch` wrote `false` on every
> resource-link launch and `true` on every deep-linking one, so the value tracked
> whatever the instructor last clicked. It read `true` below only because the last
> three launches happened to be deep-linking. It is now monotonic — written only
> when the launch IS a deep-linking request, never with `false`.

**A capability flip leaves no trace of having flipped.**
`lti_record_capability` does `value = excluded.value, observation_count =
observation_count + 1` unconditionally, so the count is of the **key**, not of
the current value. **[SUPERSEDED 2026-08-27 by migration 261 — that function
body was replaced. It now increments `true_count` or `false_count` by which
value was observed, and `observation_count` remains the sum. Do not act on the
SQL named in this sentence.]** `supports_deep_linking` now reads `true, 4` and
**nothing in the row says it was ever `false`** — the only evidence of the
change is a `resource_link_unsupported` skeleton row from an hour earlier. There
is no `first_observed_true_at` and no previous value. **[SUPERSEDED 2026-08-27
by migration 261 — `previous_value` and `changed_at` now exist and are set only
when the value actually differs. Note that `first_observed_true_at` was never
created and still does not exist; the question it names is answered by
`changed_at` plus `previous_value` instead.]**

That is a gap in exactly the place the variance architecture cares most: a Tier C
capability is written at runtime by the code that discovers a limitation, and
**the flip is the interesting event.**

**We do not record whether the `data` echo was sent.** **[CLOSED 2026-08-28 by
`a2b5895` — this is the gap that commit exists to fix. The
`LtiDeepLinkingResponse` row's `claim_presence` now carries TWO booleans:
`data`, derived from the signed payload immediately before it becomes the signed
bytes, and `data_requested`, derived from the session column. Two independent
sources, so `data_requested: true` with `data: false` is precisely the failure
259 exists to prevent, self-contained in one row with indefinite retention.
Observed `true`/`true` on lti-ri at 00:47:59. **The `false`/`false` half is
UNPROVEN** — it needs a platform that sends no `data`, which is Moodle, and the
sandbox is gone.]** The signing path adds the
claim whenever the column is non-empty, the column was non-empty, and the
platform accepted the response. But that is *code plus acceptance, not a captured
wire copy* — the skeleton row for an `LtiDeepLinkingResponse` carries
`content_items` and a count and says nothing about the echo. **On a platform that
rejects at its own end — precisely the failure 259 exists to prevent — we could
not answer "did we send `data` back?" from anything we store.** The column earned
itself; the observability around it hasn't.

**A deactivated registration's refused launches land in the orphan list.**
Found while building `update-lti-platform`, which is the function that makes
deactivation reachable. `lti-login` filters `.eq("status", "active")`, so an
inactive platform simply does not match and the refusal is recorded as
`unregistered_platform` **with `platform_id` NULL** — which puts it on the
console under *"Launches from platforms we have not registered"*. That is wrong
for a platform we registered and deliberately switched off, and it reads to an
operator as a stranger knocking.

Fixing it means `lti-login` distinguishing "no such registration" from
"registered but inactive", which is a change to the refusal vocabulary **and**
to what the console renders. Recorded in `update-lti-platform`'s header, not
fixed.

Related and settled the same day: **deactivating does not exercise
`platform_inactive`.** `lti-launch:281` is only reachable when a platform is
switched off *between* a successful login and the launch POST that follows,
because login refuses first and there is no launch without one. Deactivation
does exercise a never-run path — `lti-login`'s status filter — just not that
one. Do not claim the coverage.

Also worth knowing before someone debugs a working system: **two unconsumed
`lti_launch_sessions` rows are not a failure.** Three deep-linking sessions
exist; only the last is consumed. An abandoned picker leaves a perfectly healthy
row behind. That is somebody who did not choose.

---

## 6. Open, in order

1. **SETTLED 2026-08-27 — `update-lti-platform` ships in `54284b8`**,
   admin-gated, with an
   `admin_actions` before/after diff, a named 409 excluding its own row, and
   `product_family_code` cleared when `iss` or `client_id` actually changes (the
   open question below, answered yes). Migration **260** gave
   `lti_platforms.status` the vocabulary CHECK it never had, since this is the
   first writer able to set it. Building it also found that
   `create-lti-platform` had been wrong about `iss` all along — it required an
   absolute https URL, which refuses the bare-string issuers LTI permits and
   lti-ri actually sends. Both halves now share
   `functions/_shared/lti-registration.ts`. **Deactivation exercises
   `lti-login`'s status filter, NOT `lti-launch`'s `platform_inactive`** — see
   §5. **The console has an edit action from that commit**, which is what
   `LTI-SETUP.md` Part Two's reset box means when it says the fix for a stale
   `client_id` is Edit rather than a new registration — that reference is
   correct and this list was the stale half. Original entry follows.

   ~~there is no edit action for a registration, so a
   wrong value needs raw SQL. This bit on the very first registration.~~ Editable:
   name, `iss`, `client_id`, the three endpoints, `company_id`, skew, status.
   Admin-gated function, `admin_actions` row, `(iss, client_id)` collision
   returning a named 409 rather than a raw `23505`. `product_family_code` stays
   **not** editable — it is discovered, and an admin-typed value would be a guess
   wearing the same column as an observation. Open question: whether an edit
   should clear it so the next launch rediscovers. Probably yes; changing the
   `iss` may mean a different platform.
2. **Register a real Moodle**, and correct `LTI-SETUP.md` Part Two from what you
   actually see, moving the banner. **[SUPERSEDED 2026-08-27 — done. Moodle 5.2
   sandbox, Part Two rewritten from four steps to eight and marked EXECUTED, the
   banner replaced with a dated marker. It also produced a new item that ranks
   above everything left here: see addendum 3 §1.]** **Make that a numbered step
   in the task, not
   a note** — a banner asking for a correction pass cannot enforce one, and the
   likely outcome is someone hits a mismatch, works around it, and never comes
   back. `CERT-PUBLISH-CHECKLIST.md` §6.7 is the precedent.
3. **The console pass for migration 261.** **[SUPERSEDED 2026-08-27 — done. The
   counts, `varies` and the flip line render; `lib/console/lti.ts` line 90 was
   renamed to `advertises_link_content_item`.]** The data layer records
   `true_count` / `false_count` / `first_observed_at` / `changed_at` /
   `previous_value`; nothing reads them. `lib/console/lti.ts` line 90 also still
   lists `accepts_link_content_item`, renamed to `advertises_link_content_item`,
   so it renders "not yet observed" for a key that can no longer exist. Kept
   deliberately separate from the migration so a display bug could not be
   mistaken for a write bug.
4. **The `data` echo gap in §5**, still open — we record nothing about whether
   the echo was sent. **[CLOSED 2026-08-28 by `a2b5895` — `claim_presence` now
   carries `data` and `data_requested`. What remains open is narrower and is
   verification, not observability: the `false`/`false` case has never been
   seen, and needs a platform that sends no `data`.]**
5. **Phase 2** — the student launch, unchanged from v8.8 §10: programmatic user
   creation, session minting, `lti_users` on `(platform_id, sub)`, and what a
   launched student is entitled to. **`profiles.email` is NOT NULL UNIQUE and
   feeds five downstream paths including `credentials.holder_email`**, so a
   synthetic address for a withheld email gets hashed into a credential. Settle
   that on paper first. **[SETTLED 2026-08-28 — see `LTI-PHASE-2.md`. The
   identity control sits at the moment of assessment and nowhere else; the
   withheld-email case is refused with two doors and no address is ever
   invented. "What a launched student is entitled to" resolved to: the whole
   app, never the exam.]**
6. **The last-admin guard** still unnumbered and unapplied. Next free is **262**
   — 260 is `lti_platform_status_vocab`, added with `update-lti-platform`
   because that function is the first writer able to put an operator-chosen
   value in `lti_platforms.status`.

Everything else in v8.8 §10 stands unchanged.

---

## 7. Commits

**supabase:** `7bb2106` (LTI-SETUP.md), `18c480e` (Part One step 8, and three
stale claims corrected now that they are settled).

**certidemy-web:** `5a01b11` (`select` page → route handler, `try/catch` floor,
`referenceLabel` in three locales, `CLAUDE.md` items 8 and 17).

`CLAUDE.md` item 8 also gained the reading half of the two-repo problem: **`git
log` orders by graph, not by time**, so a sibling repo's parallel commits can
sort above your own and read as history. Check timestamps before calling anything
pre-existing.
