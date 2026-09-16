# MCP-AUTH-OPTIONS.md

**2026-09-15. Undecided on purpose.** What the MCP endpoint's authorization can
be built on, now that `MCP-SERVER.md` §13 has measured what Supabase issues.

Read §13 first. The short form: a Supabase access token carries
`aud: "authenticated"` -- the Postgres role name, identical on every Supabase
project -- so a learner's browser session is presentable at `/mcp`. That is the
confused-deputy case the spec's MUST exists to prevent.

---

## 1. THE REFRAME, AND IT CHANGES WHAT WE ARE CHOOSING BETWEEN

**Resolve the issuer binding at the RESOURCE SERVER, from `sub`. Not from a
vendor claim.**

The plan of record was: a custom access token hook reads `oauth_issuer_bindings`
and stamps `issuer_id` onto the JWT. **That plan exists because Supabase happens
to offer a hook, not because a claim is the right place for the fact.**

It is not. The binding is a row we own, in our database, keyed by the pair the
resource server already has in hand. The MCP Worker can read it directly:

```
token -> verify against JWKS -> sub  ->  select issuer_id
                                          from oauth_issuer_bindings
                                         where user_id = sub [and client_id = ...]
```

**What this removes from the requirements list is the whole of claim injection.**
Not "satisfied differently" -- gone. No hook, no JWT template, no dependency on
whether a vendor lets us put arbitrary data in a token.

> **A requirement that disappears is worth more than a vendor that satisfies
> it.** A vendor that satisfies it is a dependency with a roadmap; a requirement
> that is gone cannot regress, cannot be deprecated, and does not appear in the
> comparison at all.

**It is also strictly better security.** A claim is a fact frozen at mint time
and trusted for the token's life. A lookup is evaluated per call: revoke a
partner's issuer access and the next request stops, rather than the next hour of
requests continuing on a token minted before the revocation. The same argument
CLAUDE.md makes for achievements -- *"there is no frozen copy"* -- applies here,
and for the same reason.

**And it survives every option below**, which is why it is first. Under Supabase,
under WorkOS, under a future third thing: the Worker holds the database
connection either way, and 326 is not wasted under any of them.

### What the reframe does NOT fix

**It does not fix the audience.** Resolving the binding server-side says which
issuer a caller reads as; it says nothing about whether the token was issued for
`/mcp`. A learner's browser session with no binding row simply resolves to no
issuer -- but a learner's browser session belonging to a partner admin who DOES
have a binding row resolves to that partner's issuer. **The confused deputy is
still there.** §13's finding stands on its own and the reframe does not touch it.

So the choice narrows to exactly one question: **where does a token with a real
audience come from.**

---

## 2. THE PROBE: IS `client_id` ON A WORKOS ACCESS TOKEN?

**Not answerable from documentation. Working hypothesis: no.** Stated as a
hypothesis because absence from documentation is weak evidence, and this decides
something expensive.

Four independent sources were read for a claim list:

| source | claims named |
|---|---|
| [AuthKit sessions](https://workos.com/docs/authkit/sessions) | `sub`, `sid`, `iss`, `org_id`, `role`, `permissions`, `exp`, `iat` |
| [AuthKit MCP](https://workos.com/docs/authkit/mcp) | verification example checks `issuer` and `audience` only; `payload.sub` for user context |
| [JWT Templates](https://workos.com/docs/authkit/jwt-templates) | renders from user / organization / org-membership attributes and their custom metadata |
| [FastMCP AuthKit](https://gofastmcp.com/integrations/authkit) | `aud` bound to the resource URL; no payload shown |

**None lists `client_id`.** And the template system cannot add it: it is
variable interpolation over three context objects, with no database access, no
external calls, and **no per-OAuth-client context**. There is no escape hatch.

Note also that `aud` does not identify the MCP client. With Resource Indicators
configured, `aud` is the resource URL; without them it is **the environment's**
client id -- WorkOS's, not the third-party client's. Neither value distinguishes
one connecting agent from another.

### What it decides

If confirmed, **the binding cannot be per-client on WorkOS at all** -- not in a
claim, and not at the resource server either, because the resource server would
have no client id to key on. `oauth_issuer_bindings`' primary key
`(user_id, client_id)` would have to collapse to per-user, or move to
per-organization via `org_id`.

That is not fatal. It is a different product: *"this person reads as this
issuer"* rather than *"this person, through this agent, reads as this issuer."*
Whether one person needs two agents bound to two different issuers is a question
for the partner model, not for the auth vendor -- **and it should be answered
before the vendor is chosen, because the vendor can foreclose it.**

### How to settle it

**One decoded token.** WorkOS staging environments are free
([pricing](https://workos.com/pricing) -- only production is billed), so: create
a staging environment, register a client, run the same flow
`scripts/probe-mcp-audience.mjs` already runs, decode. The script needs only its
`AUTH` constant changed and would answer the audience and the `client_id`
question in the same exchange.

**Not done here: it requires creating an account with a vendor**, which is a
decision, not a probe.

---

## 3. WORKOS, IF THE ANSWER IS "GO"

Premises confirmed: [Resource Indicators are a Dashboard field](https://workos.com/docs/authkit/mcp)
(Connect -> Configuration), `aud` is set to the requested resource, one indicator
can be the default for clients that omit `resource`, and
[AuthKit is free to 1M MAU](https://workos.com/pricing). **That is the MUST,
satisfied, as a configuration field rather than as work.**

### Does login stay with Supabase?

**This is the whole decision, and the two shapes are not comparable in cost.**

**(a) WorkOS for MCP tokens only.** Supabase remains the application's identity.
Cheap to stand up, and it creates two user-id namespaces: WorkOS `sub` is a
WorkOS user id, while `oauth_issuer_bindings.user_id` is
`uuid references auth.users(id)`. **The Worker would receive a token whose `sub`
means nothing to our database.** A mapping table is required, established in some
session where both identities are present -- and that mapping then sits exactly
where the confused-deputy risk lives.

**(b) WorkOS as the identity provider, Supabase consuming its JWTs.** Supported:
[Supabase third-party auth for WorkOS](https://supabase.com/docs/guides/auth/third-party/workos),
via a JWT template normalising `role` to `"authenticated"`. But it touches
`auth.uid()` in **45 RLS policies across 42 tables** (318's own header counts
them), `profiles.id references auth.users(id)`, `on_auth_user_created`, the
invite and voucher claim path, LTI provisioning, and every edge function calling
`auth.getUser()`. **That is a platform migration, not an MCP change.**

**BLOCKING UNKNOWN FOR (b):** what `auth.uid()` becomes under third-party auth,
and whether `auth.users` rows are still required. The Supabase page does not say.
Worth an hour before (b) is costed at all, because every RLS policy on this
platform is written against `auth.uid()`.

### What does the consent screen become?

**Mostly: it goes away, and that is the sharpest non-obvious cost.**

`/oauth/consent` exists *because* Supabase's
`approveAuthorization(id, { skipBrowserRedirect })` hands us a screen we host.
**That is the only reason an issuer picker could be on it.** AuthKit's
authorization prompt is WorkOS-hosted. Three replacements:

1. **Issuers become WorkOS organizations.** AuthKit's organization-selection step
   is structurally the same choice our picker makes, and `org_id` is a standard
   claim on the access token. Spec-native, no custom machinery, and it survives
   the `client_id` answer either way. Cost: the issuer model lives half in
   WorkOS, and re-binding means re-authenticating with a different
   `organization_id`.
2. **A pre-authorization interstitial of ours**, before handing off to AuthKit.
   Keeps the picker and our wording; adds a hop and a place for state to be lost
   -- the exact failure `recordIssuerBinding`'s fail-closed design was written
   against, reintroduced at a seam we would own.
3. **Take issuer selection out of auth entirely** -- a per-client or per-user
   setting in the partner console, resolved at call time. This is §1 applied to
   the UI as well as the token, and it is the only option that does not care
   which vendor issues tokens.

**Serving that prompt on our own domain is $99/month** (WorkOS Custom Domain).
Price it deliberately rather than discovering it: a partner-facing consent screen
served from `api.workos.com` is a CLAIMS-POLICY question, not only a branding
one.

### Does the issuer binding survive as designed?

**The table survives. The delivery mechanism does not. 326 is not wasted.**

- `oauth_issuer_bindings`, its policies and `can_bind_issuer` are ours and
  outlive any vendor choice -- **provided the binding is read at the resource
  server (§1)** rather than injected into a token.
- The hook plan does not survive: there is no WorkOS equivalent, and templates
  cannot reach a database.
- The RLS policy uses `auth.uid()`, so it keeps working exactly as long as the
  WRITER is a Supabase-authenticated browser session. Under (b) that changes, and
  the policy is rewritten with everything else.
- Per-client granularity depends entirely on §2.

---

## 4. THE OPEN REGISTRATION ENDPOINT -- true today, either way

**Dynamic client registration is open and unauthenticated on this project right
now.** Anyone can register an OAuth client and mint a token carrying our `iss`,
with `aud: "authenticated"`, without an account, a key, or an invitation. This is
independent of the auth decision and does not wait for it.

Evidence, not inference: **five clients exist, all
`registration_type = 'dynamic'`, none manual**, registered between 06:59 and
23:03 on 2026-09-15 by a script in this repo that sends no credential.

### And the repo already says it is off

```
config.toml:371   [auth.oauth_server]
config.toml:373   enabled = false
config.toml:377   allow_dynamic_registration = false
```

**Both lines are false in the repo and true in production.** Discovery returns
200, authorize returns 302, a token exchange returned 200, and five clients
self-registered -- all against a project whose committed configuration says the
OAuth server does not exist.

This is the `verify_jwt` defect class from CLAUDE.md, inverted. There the danger
is a deploy dropping a flag the repo never recorded; here the repo records the
flag and production disagrees, silently, with nothing marking it. **Anyone
reading `config.toml` to learn this project's auth surface would conclude there
is no OAuth server.** `[auth]` settings apply to the local stack unless pushed,
so this is not a malfunction -- which is precisely why it is worth writing down:
it is the normal, quiet way the two diverge.

### What closing it costs -- less than previously stated

**Correcting an error from the session this document came out of: disabling DCR
is NOT disabling the OAuth server.** They are two flags. The earlier claim that
"the consent screen and the probe both depend on it" was wrong about the consent
screen.

| depends on the OAuth server | depends on DYNAMIC registration |
|---|---|
| `/oauth/consent` and `approveAuthorization` | `probe-mcp-audience.mjs --apply`, which self-registers |
| the authorize and token endpoints | nothing else in either repo |
| every row 326 was built to hold | |

So closing DCR costs **nothing that is not already done.** Fixed 2026-09-15,
before the toggle: `--apply` now resolves a client id from `--client-id`, then
from the state file, and only registers if it has neither. Verified against the
live server -- it reused the saved client and the client count stayed at five.

`--client-id` was ALREADY a declared flag and the `--apply` leg ignored it; it
was read only by the `--code` branch, so passing it did nothing and said
nothing. The defect class CLAUDE.md names for parameters, in our own script.

If registration is refused the script now says so is EXPECTED when DCR is off,
and prints the one-line manual registration with the service role key:

```
POST {SUPABASE_URL}/auth/v1/admin/oauth/clients
apikey:        <service role key>
Authorization: Bearer <service role key>
```

**BOTH HEADERS, SAME VALUE.** With only `Authorization` the gateway answers
*"No API key found in request"*, which reads as a wrong credential and sends the
reader to check a key that is fine. Recorded in CLAUDE.md under Scripts; the
first version of this note carried the one-header form and was wrong.

It lands as `registration_type = 'manual'`. The consent screen, migration 326
and the whole OAuth path are untouched by the toggle.

**DONE 2026-09-15:** a manual client, `d5c0cf68-...`, is registered and is what
the state file now points at, so the probe survives both the toggle and the
deletion of all five dynamic clients. The saved verifier and challenge were
dropped with the old client id rather than carried over -- they belonged to an
authorization on a client that no longer exists, and `--apply` mints a fresh
pair every run anyway.

**The residual risk if it stays open is not theoretical.** Under the §1 design
the Worker resolves a binding from `sub`, so a self-registered client obtains a
token for a real user and reads as whatever issuer that user is bound to. The
audience claim that would have stopped it is the one §13 measured as
`"authenticated"`.

**Done 2026-09-15: the five dynamic clients are deleted** -- 1 client live, 0
dynamic, 1 manual.

**AND DELETING THEM LEFT THEIR BINDINGS BEHIND.** Both `oauth_issuer_bindings`
rows point at clients that no longer exist. The table has no foreign key on
`client_id` -- deliberate, recorded in 326's header, because `auth.oauth_clients`
is soft-deleted and an FK would only fire on a hard delete. So the clients were
soft-deleted, the rows survived, and nothing prunes them.

Inert: a resolver keyed on `(sub, client_id)` can never match an orphan, since
client ids are uuids and are not reissued. But the table grows a row per dead
client forever, and a future reader counting rows finds bindings that reach
nothing. **A cleanup path is unbuilt and unowned.**

---

## 5. THE CONFIG DIVERGENCE -- the reason nobody noticed section 4

**`config.toml`'s `[auth]` block is the stock CLI template. It has never
described this project.** Not "drifted": the only thing anyone ever added is the
`[auth.oauth_server]` section, and both of its lines are wrong. The other 53
settings are defaults nobody chose.

That is the finding, and §4 is a symptom of it. **Anyone reading this repo to
learn the project's auth surface would conclude there is no OAuth server** --
which is exactly why an open, unauthenticated registration endpoint sat there
being used by our own scripts for a day without anyone reading it as a finding.
A configuration file that describes nothing cannot be audited, and nobody audits
it twice.

### The sweep, measured 2026-09-15

Established from evidence already in hand -- the decoded access token, the
authorize redirect, and `auth.oauth_clients` -- not from a read of production
config, which needs a Management API token this machine does not have.

| setting | `config.toml` | production | how known |
|---|---|---|---|
| `site_url` | `http://127.0.0.1:3000` | `https://certidemy.com` | authorize returned `302` to `https://certidemy.com/oauth/consent` |
| `[auth.oauth_server] enabled` | `false` | **true** | discovery `200`, authorize `302`, token exchange `200` |
| `allow_dynamic_registration` | `false` | **true** | 5 clients, all `registration_type = 'dynamic'`, none manual |
| `[auth.external.google]` | **section absent** | **enabled** | decoded token `app_metadata.providers: ["email","google"]` |
| `additional_redirect_urls` | `["https://127.0.0.1:3000"]` | at least `certidemy.com` | same `302` |
| `authorization_url_path` | `/oauth/consent` | `/oauth/consent` | matches |
| `jwt_expiry` | `3600` | `3600` | decoded token, `exp - iat` |

**Five disagree, two agree, forty-eight unverified.** The two that agree are the
two that were ever deliberately set.

### The forty-eight, resolved -- Management API read, 2026-09-15

`GET /v1/projects/{ref}/config/auth` on a project-scoped PAT with Auth Config:
Read. 243 fields returned, 73 relevant. **Of 55 `config.toml` settings: 35 agree,
10 diverge, 10 cannot be checked.**

| `config.toml` | said | production | API field |
|---|---|---|---|
| `site_url` | `http://127.0.0.1:3000` | `https://certidemy.com` | `site_url` |
| `additional_redirect_urls` | 1 entry | **8**, incl. `certidemy.com/**` and `certidemy.pages.dev` | `uri_allow_list` |
| `[auth.oauth_server] enabled` | `false` | **true** | `oauth_server_enabled` |
| `[auth.email] enable_confirmations` | `false` | **true** | `mailer_autoconfirm: false` (inverted) |
| `[auth.email] otp_length` | `6` | **8** | `mailer_otp_length` |
| `[auth.email] max_frequency` | `1s` | **60s** | `smtp_max_frequency` |
| `[auth.rate_limit] email_sent` | `2` | **30** | `rate_limit_email_sent` |
| `[auth.mfa.totp] enroll_enabled` | `false` | **true** | `mfa_totp_enroll_enabled` |
| `[auth.mfa.totp] verify_enabled` | `false` | **true** | `mfa_totp_verify_enabled` |
| `[auth.sms] enable_confirmations` | `false` | true (moot) | `sms_autoconfirm: false` (inverted) |

`allow_dynamic_registration` is no longer on this list: the dashboard toggle
landed and the API now reads `false`, so the file and production agree.

**TWO OF THESE WERE UNKNOWN AND BOTH ARE MORE THAN BOOKKEEPING.** MFA TOTP is
enrolled and verifying in production while the file said off -- a push would have
disabled a second factor people already use. And email confirmation is ON while
the file said off -- a push would have let anyone sign up as an address they do
not own. **That one is a security change wearing a config diff**, and it is the
fourth production consequence of the command named after fixing the divergence.

**THE INVERSION HAZARD WAS REAL.** Three API fields are polarity-inverted against
the keys here -- `disable_signup`, `mailer_autoconfirm`, `sms_autoconfirm`.
`disable_signup` happens to agree; the other two are two of the ten divergences,
and reading them positionally would have recorded both backwards **as matches**.
Each is commented at its key in `config.toml`.

**The ten that cannot be checked, marked `UNVERIFIABLE` inline rather than
silently confirmed:** `[auth] enabled` (no counterpart), `sign_in_sign_ups`
(absent from the payload), Apple's `redirect_uri` / `url` / `skip_nonce_check`
(the field exists for Google, not Apple), `[auth.sms.twilio] enabled` (only an
`sms_provider` selector, reading `"twilio"` with every credential null and phone
auth off), and the four `[auth.third_party.*]` blocks, **which a different
Management API endpoint serves**.

**And one section was missing entirely rather than wrong:**
`[auth.external.google]` did not exist in this file, while Google is live with a
real client id. That is why the first sweep could only call it "absent" -- a push
disables it by omission, which no reader of the file could have seen. It now
exists, with the client id and secret as `env()` references; the live secret was
read during reconciliation and deliberately not written down.

**One thing the read confirmed for §13:** `hook_custom_access_token_enabled` is
`false`. No hook is installed, exactly consistent with the decoded token carrying
no issuer claim.

### THE OBVIOUS REMEDY IS THE DISASTER

`supabase config push` **has no dry-run flag** -- `supabase config --help` lists
exactly one subcommand, `push`, and it writes immediately. Run against this repo
it would:

- set `site_url` to `http://127.0.0.1:3000`, breaking every auth redirect and
  every link in every transactional email;
- set `[auth.oauth_server] enabled = false`, so `/oauth/consent` has nothing to
  approve and every row 326 was built to hold stops being written;
- disable Google sign-in, which an absent provider section means by omission.

**Someone who notices the divergence reaches for the command named after fixing
it, and that command takes production down in three places in order to close one
flag.** This is the same shape as the destructive-verification rule in CLAUDE.md
-- *never propose a destructive statement as a way to verify a hypothesis* --
except the destructive action here is the one labelled "fix".

`config.toml` now carries that warning in its own first lines, because a hazard
recorded only in a markdown file is not in front of the person typing the
command.

### What to do, in order

1. **Close DCR in the dashboard**, not by pushing config. Authentication ->
   OAuth Server -> disable dynamic client registration. One toggle, nothing else
   touched.
2. **Reconcile `config.toml` against a real read of production** before any
   `config push` is ever contemplated: `supabase login`, then
   `GET /v1/projects/{ref}/config/auth` on the Management API, and correct this
   file from the answer. Until then the file is a record of defaults, and the
   banner says so.
3. **Delete the five probe clients and let the stale authorizations expire.**

**What is genuinely authoritative in `config.toml` and must stay correct:** the
`[functions.*]` `verify_jwt` pins. Those are applied by
`supabase functions deploy`, not by `config push`, and CLAUDE.md's recurring
defect class depends on them being right. The banner says this too, so that
"this file is not authoritative" is never read as "this file does not matter."

---

## 6. THE PRODUCT QUESTION, SETTLED FROM THE DATA -- 2026-09-16

**Does one person ever need two agents bound to two different issuers?**

**No. Nobody today, and no arrangement requires it.** Measured, not reasoned:

| | |
|---|---|
| team_admin memberships, total | **2** (two distinct people) |
| people holding team_admin at MORE THAN ONE company | **0** |
| companies owning more than one issuer | **0** |
| users with an oauth binding to more than one issuer | **0** |
| issuers | 3 -- `certidemy` (no company), `durgical`, `test-partner-02` |

`durgical` is the only real partner with an administrator, and that person
administers exactly one company. `test-partner-02` is a fixture with no
team_admin and all four live API keys. `certidemy` has no company at all, so no
team_admin can reach it by construction.

### The one person for whom it is even expressible is the platform admin

There is ONE `platform_admin` on the platform, and `can_bind_issuer` (326)
returns true for that role against every issuer. So they alone could want one
agent reading as `certidemy` and another as `durgical`.

**That is an operator convenience, not a customer requirement**, and it does not
gate the vendor: it needs a re-bind, not two simultaneous bindings. If it ever
becomes simultaneous, WorkOS models it natively -- organization-scoped sessions,
re-authenticated with a different `organization_id`, with `org_id` on the token.
No `client_id` claim is required for it.

### Consequence

**The `client_id` probe is not a blocker.** The binding can be per-USER without
losing anything anyone has. `oauth_issuer_bindings` keeps its primary key of
`(user_id, client_id)` -- there is no reason to narrow a column -- and the
resolver keys on `user_id` where a client id is unavailable.

**Take WorkOS.** Re-open this only if a partner appears with two issuers, or a
second `platform_admin` needs two live agents at once.

---

## 7. THE BUILD, IN ORDER, AND WHAT BREAKS AT EACH STEP

Shape: WorkOS for MCP tokens only. Supabase stays the application's identity. The
binding resolves at the resource server from `sub` (section 1), so no
claim-injection is required from any vendor.

**1. Decode a WorkOS token before building on one.** Free staging environment,
register a client, point `scripts/probe-mcp-audience.mjs` at AuthKit (its `AUTH`
constant needs parameterising) and read `aud`.
*Breaks if skipped:* you build on a dashboard claim instead of a decoded token,
which is what section 13 exists to warn against. The Resource Indicator is a
config field with no deploy, and a config field nobody decoded is the
dynamic-registration flag all over again.

**2. The identity mapping, and it is the dangerous step.** WorkOS `sub` is not
`auth.users.id`. A mapping table is needed, and it must be established by an
explicit link action in the console while the partner holds a Supabase session --
not by matching email addresses.
*Breaks if wrong:* trusting an email assertion from a second identity provider
moves the confused-deputy problem from tokens to identities, where it is
persistent rather than hourly. If email is used at all it must require WorkOS
`email_verified` AND a deliberate link.

**3. Protected Resource Metadata.** `.well-known/oauth-protected-resource`
already exists; point `authorization_servers` at WorkOS and configure the
Resource Indicator as `https://certidemy.com/mcp`.
*Breaks if wrong:* with no indicator configured, `aud` silently becomes the
WorkOS ENVIRONMENT's client id -- the documented default -- so every token
carries an audience that is neither the resource nor an error.

**4. The Worker verifies.** Fetch the WorkOS JWKS, verify the signature, assert
`iss`, **assert `aud` equals the resource URL**, take `sub`, resolve the binding.
*Breaks if wrong:* omit the `aud` assertion and nothing has changed -- the work is
done and the vulnerability is intact. That one line is the entire point.

**5. Consent moves.** AuthKit hosts its own prompt, so `/oauth/consent` loses its
reason to exist. Given section 6 -- one issuer per company, nobody with two --
make issuer selection a per-user setting in the partner console. No WorkOS
organizations needed, and it is the only option that does not care which vendor
issues tokens.

**6. Retire the Supabase OAuth server.** It issues `aud: "authenticated"` from an
endpoint that had open dynamic registration until 2026-09-15.
*Breaks if wrong:* leave it running and section 13's finding stays live -- two
authorization servers for one resource, one of which fails the MUST, and the
attacker picks. Do NOT retire it before step 4 works, or there is no auth at all.

**7. The instruments, and `SERVER_INSTRUCTIONS` first.** It outranks every tool
description (v12.4). Then `smoke-paywall` against the new flow, and a positive
control that a token from the OLD server is now REJECTED -- the both-directions
half everyone skips.

### The ordering rule, learned the hard way on 2026-09-16

**Accept both token issuers during the transition. Do not flip.**

The curriculum outage that day was an equality assertion across a deploy
boundary: the views said eight, the function said four, and no ordering avoided
an outage because either side moving first broke it. An `aud` flip has the
identical shape -- clients cannot switch issuers at the same instant the Worker
changes what it accepts.

So: accept WorkOS tokens AND Supabase tokens, log every Supabase one as
`legacy_issuer_token`, wait until that count is zero, then remove. Asymmetric,
observable, and reversible at every point.

---

## 8. Not decided

Waiting on the `client_id` answer (§2), which is one decoded token from a free
staging environment and gates the per-client question underneath everything else.

The DCR item (§4) does not wait for that, and should not be bundled with it.
