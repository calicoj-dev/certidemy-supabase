# HANDOFF v12.6 — addendum to v12.0

**2026-09-15, the auth decision.** From *"just open it all up"* to a measured
answer about what the MCP endpoint's authorization can be built on. One migration
shipped, three findings, and a decision that is now waiting on a product question
rather than on engineering.

---

## THE FINDING: THE CAPABILITY EXISTS AND IS NOT APPLIED WHERE THE SPEC REQUIRES IT

A real authorization code was exchanged at `/auth/v1/oauth/token` and the token
decoded. Full record in `MCP-SERVER.md` §13. **Three facts, and the third is what
makes it a decision rather than a complaint.**

### `aud` is the Postgres role name

```
aud: "authenticated"
```

Not the resource. **And not the weaker "project-scoped, at least ours" case the
probe's own header anticipated as the middle verdict** — `authenticated` is the
role every ordinary Supabase user token carries on every Supabase project in
existence. It distinguishes nothing. There is no value in that claim to validate
against.

### `resource` is accepted at both legs and honoured nowhere

Measured separately, because *stored-not-validated* and *validated-then-ignored*
are different facts about a vendor, and it turned out to be **both, at different
legs**:

| leg | behaviour |
|---|---|
| authorize | accepted and stored verbatim, unvalidated. `resource=https://totally-not-ours.example/nope` returned `302` and landed in `auth.oauth_authorizations.resource` exactly as sent |
| token | accepted, `HTTP 200`, no error, no warning, no effect on `aud` |

So anyone inspecting that column finds `https://certidemy.com/mcp` on every row
and concludes RFC 8707 is supported. **It is recorded, not implemented.** There
is no error surface at all; the only way to learn this is to decode a token.

### And the id_token in the SAME response is correctly bound

```
id_token.aud: "8b4326bb-…"   <- the client
```

**The capability exists and is not applied to the token that needs it.** This is
not an OAuth server that cannot express an audience. It expresses one correctly,
per OIDC, on the identity token, in the same HTTP response, signed by the same
key — and leaves a constant on the access token, which is the one presented to a
resource server.

### The consequence

**Every token this project issues carries `aud: "authenticated"` and our `iss`.**
A learner's browser session. An edge function's caller token. Any other OAuth
client on this project. **A learner's browser session is presentable at `/mcp`**
— the confused-deputy case the MUST exists to prevent, on a project that issues
both tokens to the same users with the same key.

What survives as checkable: `iss` + JWKS (one ES256 P-256 key), which pins a
token to **this project** — the boundary `aud` was supposed to draw, drawn one
level too wide — and the `client_id` claim, which makes trust an allowlist rather
than an audience check.

---

## 1. THE SECOND FINDING: A COMMITTED FILE DESCRIBING A MACHINE NOBODY RUNS

`config.toml`'s `[auth]` block was the stock CLI template. **Not drifted** — the
only thing anyone had ever added was `[auth.oauth_server]`, and both of its lines
were wrong. The other 53 settings were defaults nobody chose.

**That is why nobody noticed the open registration endpoint.** Dynamic client
registration was open and unauthenticated; our own probe script registered five
clients in a day sending no credential. A file that describes nothing cannot be
audited, and nobody audits it twice.

Reconciled against a Management API read. Of 55 settings: **35 agreed, 10
diverged, 10 cannot be checked and now say so at the key.**

**TWO DIVERGENCES WERE UNKNOWN AND BOTH ARE SECURITY-RELEVANT:**

- **MFA TOTP is enrolled and verifying in production** while the file said
  `false` for both.
- **Email confirmation is ON** while the file said off — meaning a push would
  have let anyone sign up as an address they do not own.

### The command named after fixing it takes production down in four places

`supabase config push` **has no dry run.** One subcommand, writes immediately,
all of it. Against the file as committed it would have set `site_url` to
`127.0.0.1` (every auth redirect and email link), disabled the OAuth server
(`/oauth/consent` has nothing to approve), disabled Google sign-in **by omission**
— the section did not exist at all — and disabled a live second factor.

> **The obvious remedy is the disaster.** Someone who notices the divergence
> reaches for the command named after fixing it. Same shape as the
> destructive-verification rule in CLAUDE.md, except the destructive action here
> is the one labelled *fix*.

### And the mapping had a trap in it

**Three Management API fields are polarity-inverted** against the keys here:
`disable_signup`, `mailer_autoconfirm`, `sms_autoconfirm`. The first happens to
agree. The other two are two of the ten divergences, and reading them
positionally records both backwards — **as matches**. Each is now commented at
its own key, which is where someone editing will be looking.

**RECONCILED IS NOT SAFE TO PUSH**, and that distinction is the rule that
survives: the file still carries ten settings nothing has verified, plus `[db]`,
`[storage]`, `[realtime]` and `[analytics]` blocks this never touched. It is a
reference, not a source. The warning lives in `config.toml`'s own first lines,
because a hazard recorded only in markdown is not in front of the person typing
the command.

---

## 2. THE REFRAME: A REQUIREMENT THAT DISAPPEARS

The plan of record was a custom access token hook reading `oauth_issuer_bindings`
and stamping `issuer_id` onto the JWT. **That plan existed because Supabase
happens to offer a hook, not because a claim is the right place for the fact.**

The binding is a row we own, keyed by the pair the resource server already holds.
The Worker can read it directly from `sub`, per call.

> **A requirement that disappears is worth more than a vendor that satisfies
> it.** A vendor that satisfies it is a dependency with a roadmap; a requirement
> that is gone cannot regress, cannot be deprecated, and does not appear in the
> comparison at all.

It is also **strictly better security**: a claim is frozen at mint time and
trusted for the token's life, while a lookup is evaluated per call — revoke a
partner's access and the next request stops, rather than the next hour of
requests continuing on a token minted before the revocation. The same argument
this repo already makes about achievements having no frozen copy.

And it survives every option, so **326 is not wasted under any of them.**

**IT DOES NOT CLOSE THE AUDIENCE FINDING**, and that is written into §13 itself
rather than only into the document arguing for it, because the two get read by
the same person on the same evening and the second one is reassuring. Resolving
server-side answers *which issuer does this caller read as*. It says nothing
about *was this token issued for `/mcp`*. A learner with no binding row resolves
to no issuer; **a partner admin who has one resolves to their partner's issuer,
from an ordinary browser session.** §13 is a blocker in its own right.

---

## 3. What shipped

- **Migration 326** — `public.oauth_issuer_bindings` and
  `public.can_bind_issuer(uuid)`. Ran; the consent screen wrote through it end to
  end, and the row is the proof a migration cannot give itself.

  **The DDL handed over from the web repo could not have executed.** Its WITH
  CHECK read `public.issuers` directly, and a policy expression is evaluated as
  the calling role:
  `has_table_privilege('authenticated','public.issuers','SELECT')` is **FALSE**,
  with RLS on top. Every insert would have raised `42501` naming a table the
  statement does not touch — and from the page that is indistinguishable from
  "the table does not exist yet", the exact ambiguity `issuer-binding.ts`'s error
  log was written to resolve. *"RLS is not a grant"* biting on a table the
  **policy reads** rather than on the table being protected. The rule moved into
  a SECURITY DEFINER predicate, `search_path` pinned as 318 pinned the other two.

  `platform_admin` admitted deliberately (`resolveBindableIssuers` admits them
  because `requireIssuerAccess` does), with `user_id = auth.uid()` outside the OR
  so it is not a way to write someone else's binding. Grants narrower than the
  policy: no DELETE, nothing revokes a binding yet.

- **`MCP-SERVER.md` §13** — the audience answer, with the method and the
  `curl`/node discrepancy that produced it.
- **`MCP-AUTH-OPTIONS.md`** — the reframe, the WorkOS scoping, the registration
  endpoint, and the config divergence with its full mapping.
- **`config.toml` reconciled** — 14 `[reconciled]` markers, 6 `UNVERIFIABLE`
  annotations, all 32 `[functions.*]` pins verified intact, parses under
  `tomllib`. `[auth.external.google]` added, secret as an `env()` reference.
- **Dynamic client registration turned off** in the dashboard, confirmed by the
  API read. A manual client, `d5c0cf68-…`, registered to replace it.
- **`probe-mcp-audience.mjs` hardened four ways**, each paid for in this session:
  a gitignored state file, because the PKCE verifier lived only in terminal
  scrollback and a code expired while that was being worked out; `--client-id`
  honoured on the `--apply` leg, a flag that was **already declared and silently
  ignored** there; `reached` checked before diagnosing, because a
  `UND_ERR_CONNECT_TIMEOUT` was being reported as *"the OAuth server is not
  enabled on this project"* minutes after a successful exchange against it; and
  `process.exitCode` instead of `process.exit()`, the libuv fix from
  `mint-issuer-key.mjs`.
- **CLAUDE.md** — the `config.toml` authority rule, the both-headers rule, and
  the migration tip corrected twice.

---

## 4. Open

### Decided, not built

- **The custom access token hook.** Retired by §2, not deferred. Nothing should
  reach for it again without reopening that argument.
- **`authorization_servers` in our RFC 9728 metadata.** The repo declined to
  publish it until a token had been decoded. The token is decoded and the answer
  is still no — there is no authorization server whose tokens we would accept.
  The instrument was right to wait.
- **Turning off the OAuth server.** Only DCR was closed. The server carries the
  consent screen and everything 326 holds; they are two flags and this session
  first reported them as one.
- **Running `supabase config push`.** Never, against this project, until the file
  is verified rather than reconciled.

### Waiting on a PRODUCT answer, not on engineering

- **Does one person need two agents bound to two different issuers?** This gates
  everything downstream. If yes, the binding must be per-client and the vendor
  must expose a client id on the token. If no, it collapses to per-user or
  per-organization and the field stays open.

  **It must be answered before the vendor is chosen, because the vendor can
  foreclose it** — four WorkOS sources list access-token claims and **none names
  `client_id`**, and JWT templates cannot add one, having no per-OAuth-client
  context. Recorded as a hypothesis, not a finding; one decoded token from a free
  staging environment settles it, and creating that account is a decision.

- **What the consent screen becomes.** `/oauth/consent` exists *because* Supabase
  hands us a screen we host; AuthKit's prompt is WorkOS-hosted. Issuers-as-
  organizations, an interstitial of ours, or moving issuer selection out of auth
  entirely. Follows from the question above.

### Waiting on engineering

- **Whether the token endpoint rejects a MISMATCHED `resource`.** One browser
  round; the authorize leg is settled and validates nothing.
- **What `auth.uid()` becomes under Supabase third-party auth**, and whether
  `auth.users` rows are still required. **Blocking** for the
  WorkOS-as-identity-provider option, because 45 RLS policies across 42 tables
  are written against it.
- **The four `[auth.third_party.*]` settings**, served by a different Management
  API endpoint that was not read.
- **~~The five dynamic OAuth clients.~~ DONE, and it surfaced one more thing.**
  Measured at handoff: **1 client live, 0 dynamic, 1 manual.** All five are gone
  and `d5c0cf68-…` is the only one left, which is the state the probe was
  rebuilt for.

  **But both `oauth_issuer_bindings` rows now point at deleted clients.** The
  table has **no foreign key on `client_id`** — a deliberate choice recorded in
  326's header, because `auth.oauth_clients` is SOFT-deleted and an FK would only
  ever fire on a hard delete. The clients were soft-deleted, the bindings
  survived, and **nothing prunes them.**

  Inert today: under §2 the Worker resolves `(sub, client_id)`, and an orphaned
  row can never match a live token because client ids are uuids and are not
  reissued. But the table accumulates a row per dead client forever, and the
  first person to count rows in it will read two bindings where zero are
  reachable. **A cleanup path, or a periodic reconcile against
  `auth.oauth_clients`, is unbuilt and unowned.**

**Carried:** `environment` is a label and not a boundary, still the largest open
item; per-certification scope for `courseware:lessons`, whose window closes at
the first key sold; `mcp.resolve_api_key` does not touch `last_used_at`; no rate
limiting on `courseware-read`; `pg_net` PUBLIC grants; `anon` CREATE on schema
`public`; `analyze-local.mjs` dead since `3110eec`; AIE-I still writing ungrouped
items; Spanish curriculum still unmeasurable by the analyzer.

---

## 5. The through-line, fifth statement

- **v12.2:** every defect passed a check, because almost every check reads
  configuration rather than exercises behaviour.
- **v12.3:** the checks that *did* exercise behaviour proved the wrong thing,
  because they ran as the system.
- **v12.4:** a check that cannot run is indistinguishable from one that ran clean.
- **v12.5:** so is a code path — and when what holds it shut is data rather than
  code, it opens without an edit.
- **v12.6:** and the records both sides keep are configuration too.

Two findings in this document are the same error pointed in opposite directions,
and both records were committed, readable, and plausible:

> `auth.oauth_authorizations.resource` records what we asked for, and the token
> ignores it. `config.toml` records what we set, and production ignores it.

One is a vendor's record of our request; the other is our record of a vendor's
state. **Neither was evidence of anything, and both read as evidence.** The
authorization row would have convinced a careful person that RFC 8707 worked. The
config file would have convinced the same person there was no OAuth server to
worry about. Both were wrong in the direction that stops you looking.

> **A SYSTEM'S RECORD OF YOUR REQUEST IS NOT EVIDENCE THAT IT HONOURED IT, AND
> YOUR RECORD OF A SYSTEM'S STATE IS NOT EVIDENCE OF ITS STATE.**
>
> A record is a record. Only the running system is the system — so decode the
> token, read the live config, and attempt the write as the party the property is
> about.

The practical form, and it is cheap: **every claim in this document that matters
came from one HTTP response or one `pg_catalog` query.** The audience answer is a
decoded JWT. The divergence is a Management API read. The 326 policy defect is
one `has_table_privilege` call. None of it needed a day; all of it needed
someone to stop reading the record and ask the system.
