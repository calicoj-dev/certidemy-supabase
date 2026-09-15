# HANDOFF v12.3 — addendum to v12.0

**2026-09-14/15, the paywall.** Lesson bodies over the MCP behind an issuer API
key: migrations 322 through 324, the token flow across both repositories, and a
test that proved a property nobody owned.

---

## THE FINDING, AND IT IS THE ONLY ONE THAT MATTERS

**`smoke-courseware` reported 37 of 37 passing. It had proved the GRANT and not
the PAYWALL, and the paywall did not exist.**

Section B2 asserted everything worth asserting about a lesson body: that
`content_md` never crosses the wire, that the blocks are parsed, that no
`::checkpoint` or `::interactive` answer key travels with it, that `omitted`
reports what was withheld. Every one of those was true. None of them was the
question.

**The test called the function the same way an attacker would — and the function
holds both credentials.** `courseware-read` opens a pool as `mcp_reader` and a
second as `mcp_holder`, and picks the holder pool when the resource is `lesson`.
A request arriving at that function is already authorised by construction, from
any caller, with no credential of any kind. So the test could not distinguish

> the paywall works

from

> there is no paywall

because both produce a lesson body when the caller is the function itself. The
boundary was in the database — migration 315 gives `mcp_reader` no grant on
`mcp.lesson`, and 322 proved that by *attempting the read and being refused* —
and the boundary was real. It just did not sit between the internet and a body.

**What was actually shipped on 2026-09-14 was a public endpoint that returned
licensed course material to anyone who could type a JSON object.** The only
thing closing it was `MCP_HOLDER_PASSWORD` being unset, which made the lesson
path answer 503. An operational accident, not a design.

**A test of an access boundary has to be made FROM OUTSIDE IT.** That is the
whole lesson and it generalises past this endpoint: a suite that runs with the
system's own credentials measures what the system can do, never what a stranger
can.

---

## 1. The gate: derived, never accepted

The obvious design is that the Worker checks the key and tells the function what
it found. **The function cannot check that.** `courseware-read` is
`verify_jwt = false` and independently reachable — the smoke test has always hit
it with curl — so a `scope` field is worth exactly what the least trustworthy
party who can set it is worth, and that party is anyone.

Signing the assertion only moves the question to *who holds the signing key*,
and the answer would be a static secret in two deployments.

**So no scope is accepted from any caller.** The function takes the presented
key, hashes it, and asks the database what that key may do. The answer comes
from a row selected by a secret only a real key holder has. There is no
forgeable field because there is no field.

The Worker still resolves the same key and sends what it found as
`x-certidemy-scope`. That is **a drift detector, not a grant**: the function
compares it with its own derivation and refuses on disagreement, and forging it
widens nothing because the derivation already decided. Both halves say so, at
every site, because "the Worker checks the key" is the sentence that gets
believed later.

**THE ORDERING IS PART OF THE PROPERTY.** Authorization resolves on the
`mcp_reader` pool, which provably cannot select `mcp.lesson`. The holder
credential is not touched until it passes. A bug anywhere in the authorization
path therefore cannot leak a body — the connection in hand while the decision is
being made cannot fetch one.

**A failed lookup in the Worker returns `unavailable`, never `invalid`.** A
dropped read becoming an answer would report *"your key is bad"* to every
partner at once during an outage. On `unavailable` the key is forwarded and the
gate decides alone. Degrading to "the gate decides" is the whole reason the gate
is not in that repository.

---

## 2. What the test does, and what makes it mean anything

`scripts/smoke-paywall.mjs`. Eight unauthorised requests that must fail,
including the one the design exists for: a forged
`x-certidemy-scope: courseware:lessons` with no key behind it. Plus the MCP
path, where an agent actually arrives.

**A refusal alone proves nothing.** "All eight were refused" is what a
completely broken deployment produces — a wrong URL, an expired project, a
function that 500s, a typo in the slug. Each of those refuses everything and
passes a test that only checks for refusals. That is the 37/37 failure one layer
out, and it would have been easy to ship.

So two controls gate the verdict:

| | |
|---|---|
| **ALIVE** | `list_lessons` **unauthenticated** must return a real catalogue — so every refusal below is a refusal and not an outage, and the free tier has not been swallowed by the paid boundary |
| **SERVES** | `get_lesson` **with a scoped key** must return a real body — otherwise "no body was served" is true of a function that serves nobody |

SERVES reports **UNTESTED** without a key and is never counted as a pass. The
leak detector is also proven to *fire* on the authorised body, because a
detector that never fires is not evidence.

**It found a live defect on its first run.** `get_lesson` and `list_lessons`
were 400-ing in production: the deployed validator's `TOOLS` still held four
names and the Worker sent the new two. So every `get_lesson` "refusal" observed
was a vocabulary error wearing an authorization refusal — the same shape the
test was written to correct, caught by the control rather than by the refusals.

**Final state: 20 passed, 0 failed, 0 untested, against what is deployed.**

---

## 3. Three defects the probes found in themselves

Every one of these was a *post-condition* failing, not the thing under test. All
three share a mechanism: **a check that cannot distinguish its failure modes
will name the wrong one, and it will name the scarier one, because that is the
one worth writing a message about.**

### 3.1 NULL is not a wrong uuid

323 aborted with:

```
ERROR: P0001: a live key resolved to the wrong id
```

which is the single worst thing that function could do — one partner's key
resolving to another partner's scopes. **It had not happened.**

`EXECUTE ... INTO` leaves its targets NULL when the query returns no rows. The
probe read that NULL into `v_got` and tested `v_got is distinct from v_id`,
which is true for a wrong uuid and equally true for no uuid at all:

| | |
|---|---|
| **no row** | a closed door. Nobody gets in. Safe, and wrong. |
| **wrong row** | one key returning another key's row. A cross-partner leak. |

The real cause was **RLS**. `issuer_api_keys` has it enabled with one policy,
SELECT to `authenticated`. `mcp_authz` is not authenticated, does not own the
table, and has no `BYPASSRLS` — so the column grant let it address the table and
RLS returned none of the rows. No `42501`, no error of any kind: the query
planned, ran, and was filtered to nothing.

**The narrowing is what tripped it.** Every other object in schema `mcp` is
owned by **postgres** — all five views, none `security_invoker` — and postgres
has `BYPASSRLS`. The views *are* the bypass, by owner. `mcp_authz` is the first
definer owner there that RLS applies to, and it exists precisely because it is
narrow. Second instance in this subsystem: 317 gave `mcp_logger` INSERT on
`mcp_requests` and 319 exists to add the policy that made the write land.

CLAUDE.md names the two ends — *"RLS enabled and no grant is closed; a grant and
no policies is open"* — and not this middle: **a grant, and a policy that does
not name you.**

Fixed with a policy, not `alter role mcp_authz bypassrls`: a role attribute is
global, permanent, and applies to every table the role ever touches, including
ones that do not exist yet. The probe now counts before it compares, walks
**every** key rather than the first, and raises the leak and the closed door as
separate exceptions.

**And checks 2 and 3 passed throughout** — unknown hash, empty hash, null hash
all "resolved to no rows", which is exactly what they were written to expect.
Three negative assertions agreeing for the wrong reason, and only the positive
control disagreed.

### 3.2 A predicate that had never matched anything, anywhere

323 then aborted on:

```
ERROR: P0001: resolve_api_key is not a pinned definer owned by mcp_authz
```

Five conjoined predicates, one count, one message naming three of them. The half
that had moved was **none of them**:

```sql
p.proconfig::text like '%search_path=""%'
```

`proconfig` is a `text[]` whose element is `search_path=""`, 14 characters.
Rendering that array as text quotes the element — it contains quotes — and
backslash-escapes the inner pair, so `::text` is `{"search_path=\"\""}` and the
literal never occurs in it.

Measured against three functions that are definitively pinned —
`mcp.log_request`, `public.is_platform_admin`, `public.is_team_admin_of`:

| | `= any(proconfig)` | `::text like '%search_path=""%'` |
|---|---|---|
| all three | **t** | **f** |

**The assertion was unconditionally false and had never been satisfied by
anything.** Same family as the five already recorded in CLAUDE.md: it searched a
STRING when the property was an ARRAY ELEMENT.

**318 already had the correct form**, one migration away, written the same week.
No other migration executes the broken predicate.

### 3.3 The compound assertion

The repair for 3.2 is the general one: **four properties, four exceptions.** It
is now six — existence, owner, `prosecdef`, language, pin-present, pin-empty —
because "no pin at all" and "pinned to the wrong thing" are different repairs,
and a reader shown only the second goes looking for a setting that is not there.

The `prosecdef` assertion carries its consequence in the hint, since that
failure is the interesting one: *it would run as `mcp_reader`, which cannot read
the table — every key would resolve to no row and the paywall would close on
everyone.*

---

## 4. `environment` is a LABEL, and it is written down as a boundary

**`issuer_api_keys.environment` is `live` or `test`, it is selected by
`issue-partner-credential`, and NOTHING BRANCHES ON IT.** Checked by grep across
both repositories.

So a key minted `environment: "test"`, displayed as `cdk_test_…`, carrying
`credentials:issue`, **mints real credentials under the issuer's real signature,
into the real credentials table, resolvable at
`credentials.certidemy.com`.** The prefix says test. The behaviour is
production.

**This is worse than an absent boundary, because the vocabulary asserts one.** A
column named `environment` with values named `live` and `test` is read by every
person who meets it as a sandbox flag. Nothing in the schema, the console or the
API says otherwise. Someone will eventually mint a `test` key to try the
integration, issue a credential to a colleague to see what it looks like, and
have produced a real ISO/IEC 17024-aligned credential for a person who never sat
an exam — with no error anywhere, because there is no error to raise.

The smoke keys minted this session were `environment: "test"` for exactly this
reason and are being revoked for exactly this reason.

**NOT FIXED, and the options are not equal:**

- **Enforce it.** `issue-partner-credential` refuses a `test` key, or writes
  `is_specimen = true`. Honest, and it breaks any partner already using a test
  key to issue — measured: none today, all four historical keys are `live`.
- **Remove it.** Drop the column and the `cdk_test_` prefix. The vocabulary
  stops lying by stopping.
- **Rename it.** `label` rather than `environment`. Cheapest, and the weakest —
  it relies on nobody reading `cdk_test_` as a promise.

The first is the only one that makes the prefix mean what it says. **Until one
is chosen, `cdk_test_` is decoration**, and anyone handed a test key should be
told so in those words.

---

## 5. Also shipped

**324 — `mcp.log_request` did not know the lesson resources existed.** It
classifies by outcome from an allowlist that went stale when 322 added `lesson`
and `lesson_index`, so **five rows that served a catalogue or a body were filed
as `rejected`**, measured. The `else 'rejected'` backstop that protected the
insert is what hid it. These are the **paid** resources: the table counted zero
of them while reporting five refusals that never happened — both numbers wrong,
in opposite directions, neither anomalous alone.

321's own verification asserts this cannot happen. It was true when 321 ran and
nothing re-ran it. **A one-shot invariant is a measurement, not a guard.**

**The scope vocabulary had three lists and no two agreed.**

```
create-issuer-api-key   credentials:issue, credentials:read, achievements:read
migration 322 CHECK     credentials:issue, courseware:lessons
actually enforced       credentials:issue, courseware:lessons
```

Intersection: one scope. `courseware:lessons` **could not be minted at all** —
the gate was built, the database was ready, and no key that passed it could be
issued. And `credentials:read` / `achievements:read` passed the minter then
violated the CHECK as `23514`, reported as `500 failed to create API key`: a
validation error wearing a server fault.

**322 wrote that CHECK from the ROWS** — *"every existing row holds
credentials:issue only, measured"* — which is true and beside the point.
CLAUDE.md states it for NOT NULL columns and **it is the same rule for a CHECK,
and for any constraint**: a backfill covers the rows that exist; only the writer
list covers the rows that do not exist yet. One grep of
`from("issuer_api_keys")` would have found the minter.

`functions/_shared/api-scopes.ts` is now the one list. `credentials:read` and
`achievements:read` were **not** restored: nothing reads them and no key has
ever held one, and a scope only the minter knows about is a restriction a
partner is shown and nobody applies.

**Two scripts, because the console cannot do either.** `issuing-panel.tsx` posts
`{ issuer_id, name }` and nothing else, so every key it mints takes the default
and there is no revoke button at all.

- `scripts/mint-issuer-key.mjs` — `--apply` family, dry by default
- `scripts/revoke-issuer-key.mjs` — same, `--key` repeatable
- `scripts/lib/fn-auth.mjs` — the credential path, **once**

---

## 6. Two Windows lessons, both paid for

**A PROMPT IS NOT AN INPUT PATH ON THIS PLATFORM.** `mint-issuer-key` read the
password with readline, `terminal: true`, echo suppressed. The shells this repo
is driven from — agent-driven ones included — hand the process a stdin that is
not a TTY, so readline read EOF and the password arrived as `""`. The server
answered **"Invalid login credentials"**, which is indistinguishable from a
wrong password, so the failure pointed at credentials that were correct all
along. An input path that captures nothing plus a rejection that blames the
input is a dropped read one layer up.

Compounding it: `SUPABASE_PASSWORD` **was read nowhere**, deliberately, on the
argument that an env var holding a password reaches the shell history. The
objection was real and aimed at the wrong place — `scripts/.env` is gitignored
and already holds `SUPABASE_SERVICE_ROLE_KEY`. `SUPABASE_EMAIL` *was* read,
which is why one prompt vanished and one stayed.

**AND THE libuv ASSERTION WAS NOT THE PROMPT.**

```
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
```

It was read as readline teardown. The prompt was removed and **it still fired**,
which is what identified the real cause: `process.exit()` after a `fetch()`,
tearing down undici keep-alive handles mid-close. Scripts now set
`process.exitCode` and return after any network call; exits *before* a fetch are
untouched. **The assertion looked explained by the thing being removed, and
removing it is what disproved the explanation.**

---

## 7. Open

- **`environment` is decorative.** §4. The largest open item here.
- **`last_used_at` is not touched by `mcp.resolve_api_key`.** Courseware keys
  will look dormant to anyone pruning unused keys. Named in 323's header, open.
- **No rate limiting on `courseware-read`.** A caller may present unlimited
  wrong keys. Forging one means finding a sha256 preimage, so this is cost, not
  a break — and it is the same exposure `issue-partner-credential` has always
  had.
- **`cdk_live_2008b3e8` ("moodle", test-partner-02) now holds
  `courseware:lessons`.** A live key with lesson access and `last_used_at` null.
  Deliberate or not, it is a real grant nobody is tracking.
- **The console has no scope selector and no revoke button.** Both are scripts.
- **318 is still written and not run.**
- Carried from v12.2: `pg_net` PUBLIC grants; `anon` CREATE on schema `public`;
  `analyze-local.mjs` dead since `3110eec`; AIE-I still writing ungrouped items.

---

## 8. The through-line, which is v12.2's with the edge sharpened

v12.2 recorded: *every defect passed a check before it was found, because almost
every check reads configuration rather than exercises behaviour.*

v12.3 adds the sharper case. **The checks here DID exercise behaviour — and
still proved the wrong thing, because they ran as the system.** 322 attempted
the forbidden read and was refused. B2 fetched a real lesson and parsed it. Both
were real behavioural tests. Both were run with the system's own credentials,
which measures what the system can do and never what a stranger can.

So the rule that survives this arc is narrower than "exercise behaviour" and
harder to satisfy:

> **Run the check as the party the property is about.** A paywall is a claim
> about strangers, so only a stranger can test it. A grant is a claim about a
> role, so the role must attempt it. The credential the test holds IS the
> hypothesis.

And the corollary the probes paid for three times in one file:

> **A post-condition must be able to tell its failure modes apart.** If it
> cannot, it will report the most alarming one it knows how to describe — and
> someone will spend an afternoon on a cross-partner leak that is a closed door,
> or on an owner that never moved.
