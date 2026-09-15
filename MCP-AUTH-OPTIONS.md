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

So closing DCR costs **one flag on one probe script.** Clients can still be
registered manually with the service_role key, landing as
`registration_type = 'manual'`; the probe would take a `--client-id` for a
pre-registered client instead of registering its own. The consent screen,
migration 326, and the whole OAuth path are untouched.

**The residual risk if it stays open is not theoretical.** Under the §1 design
the Worker resolves a binding from `sub`, so a self-registered client obtains a
token for a real user and reads as whatever issuer that user is bound to. The
audience claim that would have stopped it is the one §13 measured as
`"authenticated"`.

**Also pending regardless: five probe clients and three expired-or-expiring
authorizations are registered and undeleted.** The probe script's own footer says
to remove them.

---

## 5. Not decided

Waiting on the `client_id` answer (§2), which is one decoded token from a free
staging environment and gates the per-client question underneath everything else.

The DCR item (§4) does not wait for that, and should not be bundled with it.
