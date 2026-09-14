# MCP-COURSEWARE

**The courseware MCP pilot: what the boundary is, how the route authenticates
across it, and why that decision was reversed once.**

Started 2026-09-13. AISM-I only. Migration 315 created the roles and the views;
this document is the reasoning that is not expressible in SQL.

---

## 1. The boundary is an absent grant

```
mcp_reader  ->  mcp.certification, mcp.task, mcp.concept
mcp_holder  ->  those three AND mcp.lesson
```

Both roles are `nologin noinherit` and hold nothing in `public`. The four views
are definer views with `security_barrier`, so the view body is the policy and
the roles need no privilege on any base table.

**"No token, no lesson body" is the grant that was not written**, not a branch in
the route. A bug in the route cannot serve a lesson body to an unauthenticated
caller, because the role it is connected as has no privilege on that view. An
`if` can be inverted by a refactor; a missing grant fails closed in the database.

Verified after 315 ran, both directions: reader `false` and holder `true` on
`mcp.lesson`, and **0 base tables reachable by either role**.

`config.toml` exposes `mcp` to PostgREST. **Exposure is not access** - the views
became addressable, not readable, and the grants still decide.

### service_role cannot reach schema mcp either, and that is deliberate

**Stated because a document that understates a boundary is how someone later
"fixes" it by granting something.**

315 and 316 are the only migrations that touch schema `mcp`, and **neither grants
`service_role` anything.** 315 creates the schema and grants USAGE to
`mcp_reader` and `mcp_holder`; 316 adds `authenticator` and revokes `anon` and
`authenticated` by name. `service_role` appears in 316 exactly once, in a comment.
`service_role` is not a superuser on Supabase and USAGE is not something
`BYPASSRLS` sets aside, so on the record it has no path to these views.

**That is an inference from the migration record, not a runtime measurement** -
the two are usually the same here and the distinction is the point of saying so.
Confirm it alongside the other post-conditions:

```sql
select has_schema_privilege('service_role', 'mcp', 'USAGE') as usage,          -- expect f
       has_table_privilege('service_role', 'mcp.lesson', 'SELECT') as lesson,  -- expect f
       has_table_privilege('service_role', 'mcp.task', 'SELECT')   as task;    -- expect f
```

**This is a feature and not an oversight.** It means an edge function holding
`service_role` cannot read the courseware views at all, so there is no quiet path
back to the thing section 2 forbids: `courseware-read` must connect as
`mcp_reader` because nothing else works. The boundary is enforced against the
credential most likely to be reached for by someone in a hurry.

---

## 2. The credential question, and the reversal

### What was decided first, and accepted with its residual

An edge function holding `SUPABASE_JWT_SECRET` would mint a short-lived JWT
carrying `role: mcp_reader` and call PostgREST with it. The Worker holds nothing;
every database credential stays inside Supabase.

The residual was named and accepted at the time, and is recorded here because it
is the thing that later changed the answer:

> An edge function holding `SUPABASE_JWT_SECRET` **can mint `service_role`**. So
> the grant boundary constrains the Worker, the route and every prompt, but not
> code running inside that function. The Worker is the exposed surface and it
> holds nothing, so the trade was judged worth taking.

That reasoning was sound. It was made against an assumption that turned out to
be false.

### What the measurement said

```
GET https://<ref>.supabase.co/auth/v1/.well-known/jwks.json
{"keys":[{"alg":"ES256","crv":"P-256","kid":"88aaf3f3-...","kty":"EC",...}]}
```

**The project signs asymmetrically.** Corroborating: the service-role key is the
`sb_secret_...` format, not a JWT.

Under asymmetric signing **the private key is Supabase's and is never exposed**,
so there is no secret to put in the edge function and nothing to mint with. The
JWT path survives only if the **legacy HS256 secret is still enabled in
parallel**, which Supabase keeps valid during migration until revoked.

### Why the answer reverses if it is revoked

The fallback is a `LOGIN` role: the edge function opens a direct Postgres
connection as `mcp_reader` with a password held in function secrets.

**That was ranked worse and is in fact better on exactly the trade that was
accepted above.** A password for `mcp_reader` grants `mcp_reader` and nothing
else. It cannot escalate, cannot reach `mcp.lesson`, and cannot mint
`service_role`. The JWT secret can do all three.

So the ordering is not "JWT is cleaner, LOGIN is a fallback". It is:

| | residual | cost |
|---|---|---|
| legacy JWT secret in the function | **can mint `service_role`** | none beyond the secret |
| `LOGIN` role + password | **grants exactly `mcp_reader`** | a password, and TCP from Deno |

**The record should show why it changed**: the first decision traded a larger
residual for less mechanism, on the belief that minting was the simple path. The
measurement removed the simple path, and once both options cost real mechanism,
the smaller residual wins on its own merits. Nothing about the original
reasoning was wrong; its premise was.

**Decided, and the dashboard settled it.** ECC P-256 is the CURRENT key
(kid 88AAF3F3-...); the legacy HS256 shared secret is the PREVIOUS key - it
verifies unexpired tokens and does not sign, and the page advises revoking it
once they expire. A token minted with it would not be accepted, so option three
was not merely worse, it was **dead**: building on it means building on something
scheduled for deletion.

**Migration 316 took the LOGIN path.** `alter role mcp_reader login`, with the
password set separately as a pre-hashed SCRAM verifier
(`scripts/scram-verifier.mjs`) so the plaintext never reaches the SQL editor,
whose history is not a secret store. `mcp_holder` stays NOLOGIN until the holder
path exists. **The password never entered a migration file.**

### What must never happen

**The edge function must not use `service_role`.** It would satisfy every query
and make migration 315 decorative - the boundary would exist in the database and
be bypassed by the only thing that talks to it. If the credential question has
no acceptable answer, the correct outcome is that the pilot does not ship, not
that it ships on `service_role`.

---

## 3. One edge function, parameterised by resource

Not four functions, and not one function switching on tool name.

**Against four:** they would share credential acquisition, the AISM-I scoping,
error shaping and the "never reaches `mcp.lesson`" property. Four copies of the
credentialed connection is four places to drift - the failure this repo already
carries as known debt on the credential mint, where `_shared/issue.ts` owns one
mint precisely because a second copy would differ invisibly.

**The deciding argument is deployment.** `verify_jwt` must be pinned in
`config.toml` **per function**, and CLAUDE.md records four separate occasions
where a plain redeploy dropped a `--no-verify-jwt` flag and silently
re-privatised a public endpoint. Four functions is four pins and four chances to
repeat a mistake already made four times.

**Against dispatching on tool name:** the Worker route already dispatches on tool
name. A second dispatch on the same key inside the edge function puts one
decision in two repositories.

So the function takes a **resource**. As built, those are
**`certification`, `task`, `concept`, `search`** - matching
`functions/courseware-read`, which is the authority on this vocabulary.

**THIS PARAGRAPH SAID "concept, task, syllabus, search" AND THAT WAS THE BUG.**
`syllabus` is a TOOL, not a resource: `get_syllabus` composes the
`certification` and `task` resources in the Worker. The first registry sent the
tool vocabulary over the wire - `syllabus`, `code`, `domain`, plus a
`certification` field the function does not accept - and **all four tools would
have 400'd on every call**, surfacing to an agent as "the curriculum service
could not be reached" because the Worker maps a non-ok response to
UPSTREAM_UNREACHABLE. A contract mismatch wearing a network fault.

Caught by reading the two vocabularies side by side before deploying, not by
either half's tests - neither half can see the other. **Two halves in two
repositories with no shared module is the mirrored-pair failure CLAUDE.md
reserves that discipline for**, and the translation seam now lives in
`lib/mcp/registry.ts` so there is exactly one place that changes if the function
vocabulary moves again.

The four tool contracts stay in the Worker beside `verify_credential`'s, and each
tool's validator produces a validated tool INTENT which the registry translates.

What this buys: a fifth tool needs no new function, no new deploy, and no new
`verify_jwt` pin. `mcp.lesson` stays unreachable by construction, because the
function connects as `mcp_reader`.

**What it costs, stated plainly:** the function's input surface is wider than any
single tool's, so its own validation must be real rather than inherited from a
tool schema. That is the lesson `validateArgs` already encodes in the route - the
schema is documentation, the validator is the enforcement.

---

## 4. Why AISM-I is the pilot

`IP-POSITION.md` section 6: an MCP returns Certidemy's prose and clause
**addresses**, never clause **text**. **AISM-I cites no ISO standard at all** -
226 concepts, zero citations - so the address-not-text rule has nothing to bite
on. Extending these views to any of the four ISO-derived certifications requires
that rule enforced in code first, not in a prompt.

---

## 5. Two limits that are in the data, not the design

**`mcp.certification` and `mcp.concept` are English-only.** There is no
`certification_translations` and no `concept_translations` table, and no view
body can fix that. `mcp.task` and `mcp.lesson` carry all three languages.

**The concept half is the es-419 gap arriving from the other direction.** A
Spanish partner document has no Spanish concept layer to match against - the same
defect the curriculum analyzer hits, showing up here as a view that cannot carry
a language column.

**Consequence for `search_blueprint`:** in `es-419` and `pt-BR` it can search
task statements and KSAs but not concepts. The tool reports which corpora it
actually searched rather than silently returning a thinner result, for the same
reason `mcp.task` exposes `domain_title_is_fallback`: a reduction the caller
cannot detect is the same defect class as a dropped read.
