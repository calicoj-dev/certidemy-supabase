# MCP-SERVER.md

**`https://certidemy.com/mcp` — a remote MCP server over Streamable HTTP,
conforming to spec revision `2026-07-28`. Live, and answering a real Claude
custom connector.**

One tool: `verify_credential`. **Public, no auth.**

**The code lives in `../certidemy-web`**, same split as `WEBMCP.md` and
`OPENNEXT-MIGRATION.md`:

| file | lines | code | reasoning |
|---|---|---|---|
| `app/mcp/route.ts` | 572 | 309 | 224 |
| `lib/verify/tool-contract.ts` | 266 | 147 | 92 |

Three commits, and they are the three acts of this document:

| commit | what |
|---|---|
| `10dad73` | **build the instrument** — the server, written to find out what the client speaks |
| `2a5c173` | **`server/discover`, which servers MUST and we did not** |
| `5c7cbd7` | **retire the instrument** — strict conformance, narrowed log |

---

## 1. THE SIBLING OF `WEBMCP.md`, AND THE CONTRAST IS THE POINT

**Same verification logic. Same privacy contract. Same tool description. Same
call to the same `verify-credential` edge function. Different transport.**

`WEBMCP.md` §2b measured WebMCP's reach on production and found it was **zero
agents** — the tool registered, the origin trial token honoured, the API present
on the tab, and **Gemini in Chrome declining to call it at all**, because it is
not a WebMCP client.

**This server was live and answering a real Claude connector within hours of
being written.**

**That difference is the entire reason this document exists.** Two tools, built
days apart, doing the same work behind the same contract. One reaches nothing
because the demand side does not exist yet. The other reached a production agent
immediately, because MCP has clients today and WebMCP does not.

### What is NOT restated here

**The reasoning is in `WEBMCP.md` and is pointed at, not duplicated:**

- **The privacy contract and why `email` is not a parameter** — `WEBMCP.md` §6.
  Email alone is an **enumeration oracle** where a "no" is as informative as a
  "yes"; a parameter that exists and always fails **teaches an agent to retry**.
- **Schema is documentation, enforcement is code that runs** — `WEBMCP.md` §3.
  Chrome does not validate `inputSchema` at execute time, and both privacy locks
  designed as shape guarantees failed on first contact.

**One sentence belongs here rather than there, because it is stronger in this
setting.** In the browser, an attacker needed a user on our page in a Chrome
build with a trial token. **Here it is a public HTTPS endpoint that accepts
arbitrary JSON from anything that can POST.** Nothing in the MCP spec obliges a
client to validate arguments against `inputSchema` before sending, and a server
could not trust it if it did. **The constraint binds harder, not softer, and
`lib/verify/tool-contract.ts` exists so that both callers enforce it from one
place.**

---

## 2. The spec moved, and the move made this easy

Revision **`2026-07-28`** defines **only two transports** — stdio and Streamable
HTTP. HTTP+SSE is deprecated (since `2025-03-26`, SEP-2596) and eligible for
removal.

**What this revision REMOVED is what made the build small:**

- **protocol-level sessions** (`Mcp-Session-Id`, and its `DELETE` teardown)
- **the GET stream endpoint**
- **`Last-Event-ID` resumability** — "Resumable SSE streams via `Last-Event-ID`
  are not supported"
- **server-initiated JSON-RPC requests**, replaced by a retry pattern

The base protocol is now **stateless, self-contained requests** with
**per-request capability negotiation** and **no `initialize` handshake**.

**A conforming server is one POST endpoint that MAY always answer
`application/json`.** SSE remains available per request, at the server's choice,
and we never choose it.

### This killed the question the work opened with

The feasibility check asked whether a **Supabase edge function could hold a
long-lived SSE connection** against a 150-second idle timeout. It was the
central hosting risk.

**There is no long-lived stream.** The question was not answered — **it was
dissolved by a spec revision published five weeks before it was asked.**

Worth recording as its own kind of lesson: **the hardest constraint in the
feasibility report had already stopped existing.** A hosting question framed
around a transport's shape has a shelf life equal to that transport's.

---

## 3. "WHAT A CONFORMING SERVER MUST DO IS SMALL" WAS WRONG

**That is a quote from my own feasibility report, and it was wrong.**

It was drawn from the transport page's summary, which is accurate about the
endpoint and silent about everything around it. The single MUST it names —
*"the server MUST provide a single HTTP endpoint path that supports POST"* — is
real and is perhaps five percent of the work.

**Most of the work is in Request Metadata:**

- **`MCP-Protocol-Version` is REQUIRED on every POST**, and MUST match
  `_meta.io.modelcontextprotocol/protocolVersion` in the body.
- **`Mcp-Method` is REQUIRED on all requests. `Mcp-Name` is REQUIRED on
  `tools/call`**, `resources/read` and `prompts/get`.
- **Headers MUST match the body**, and a mismatch MUST be rejected with
  `400` + **`-32020` `HeaderMismatch`**. The rationale is worth keeping: two
  components trusting different sources of truth — a load balancer routing on
  the header while the server executes on the body — is the vulnerability this
  prevents.
- **The `=?base64?…?=` sentinel MUST be decoded before comparison.** A server
  that compares the raw header to the body rejects every non-ASCII name.
- **`resultType` on every result.**
- **Unknown method: `404` with a JSON-RPC `-32601` body** — the body is what
  distinguishes a modern server from a legacy one that simply has no MCP
  endpoint.
- **`Origin` validation is a MUST**, `403` when present and invalid.

**None of that is optional, and none of it is in the summary sentence I
quoted.** The correction is not that the spec is unclear — every requirement
above is plainly written on the pages it belongs to. **It is that a summary of a
specification is not a specification**, and I had compressed one into a
feasibility verdict.

---

## 4. `server/discover` IS A MUST, AND ITS PAGE IS LINKED FROM NEITHER TRANSPORTS NOR TOOLS

**Both of those pages were read in full, and it was still missed.**

Our server answered `404` to `server/discover`. In the connector UI that
surfaced as:

> **"Couldn't determine the server settings"**

A message that names no method, no status code and no endpoint.

**IT WAS FOUND FROM A WIRE LOG, NOT FROM DOCUMENTATION.** The instrument was
recording every inbound request; `server/discover` was sitting in the log as a
method we had returned `-32601` for. **That is this section's real point** —
not that a page was missed, but that **the thing which corrected the reading was
traffic, not more reading.**

**Same shape as `WEBMCP.md` §2b's flag-disabled run**, where a local
configuration that kept working concealed the only question being asked. Here
the concealment was a documentation graph: the page exists, is normative, and is
not reachable from either page a person implementing a tool server would
naturally read.

### It also resolved something that had looked orphaned

The spec carries text saying **servers MUST declare the `tools` capability**.
In a revision with no `initialize`, that appeared to have **no home** — there is
no handshake in which to declare anything, and it read as vestigial language
left over from an earlier era.

**It is not vestigial. `capabilities` is a field of `DiscoverResult`.**

**A requirement that looks orphaned is evidence of a page you have not found**,
not evidence of a stale sentence. That inference was available before the wire
log and was not drawn.

---

## 5. A CORRECT REJECTION DID THE ENTIRE NEGOTIATION

**Anthropic's connector opens with the LEGACY handshake:** method `initialize`,
at protocol version `2025-11-25`.

Our server does not implement `initialize`. It answered **`400` with
`-32022` `UnsupportedProtocolVersion`**, carrying both `supported` and
`requested`, matching the spec's own example.

**The client read that, selected `2026-07-28` from `supported`, and retried.**

**NO FALLBACK LOGIC WAS WRITTEN.** No version detection, no legacy branch, no
compatibility shim. **The error response IS the negotiation.**

**The operational consequence, and it is the reason this is a section rather
than a footnote: `supported` must stay populated.** An empty or omitted array
leaves the client with nothing to retry with, and the failure does not present
as a version mismatch — it presents as **a server that does not work**, at the
one moment a partner is deciding whether the integration is real.

**A well-formed rejection is a feature.** It is the only part of this server
that a client depends on before it can talk to any other part.

---

## 6. THE LOGGING FINDING

The instrument logged **every header and the raw body**. Read back, it contained
two things nobody intended to write down.

**First: caller geolocation to five decimal places, on every request.**
Cloudflare's request headers carry it; a header dump captures it; nothing asked
for it.

**Second, and worse: it had written `someone@example.com` to disk.**

**That is the rejected input — recorded by the tool whose entire design refuses
to accept an email address.** The validator did its job: the value never reached
`verify-credential`, exactly as `WEBMCP.md` §6 specifies. And then the
instrument wrote it to a log.

> **REFUSING TO SEND A VALUE UPSTREAM WHILE RECORDING IT IS NOT A PRIVACY
> CONTRACT.**

**The privacy property was never about the network call.** It is about the
platform not holding a mapping from people to credentials. A log file holds that
mapping just as well as a database does, and it does so in a place nobody
listed as a data store.

### The resolution, and it generalises

**Log the credential ONLY AFTER validation passes.**

At that point it has matched `^[A-Za-z0-9-]+$`, and **it provably cannot be an
email address** — the pattern excludes `@` and `.`. **The same check that
protects the upstream call decides what is safe to write down.**

**On rejection, only the outcome and the length survive.** Not the value, not
the headers, not the body. The length is enough to tell a truncation from a
paste error; the value adds nothing an operator needs.

That is the transferable form: **a validator is not only a gate on what goes
out, it is a classifier for what may be retained.** One check, two uses, and the
second one is easy to forget precisely because the first one is working.

### The second hazard on the same endpoint

**`/mcp` is same-origin with an authenticated application.** `certidemy.com`
serves the console and the learner dashboard, and a browser `fetch` to
`/mcp` from a signed-in tab **sends session cookies** — which the original
header dump would have written to disk alongside everything else.

No MCP client does this; every real caller is server-side and cookieless. **The
exposure came from the endpoint's address, not from its protocol**, and it is
the specific cost of §11's hosting decision. It is closed by the same narrowing:
the log no longer records headers.

---

## 7. THE INSTRUMENT WAS THE BUILD

**v1 (`10dad73`) shipped with `INSTRUMENT_MODE`.** It accepted requests that
omitted required fields, and **logged instead of rejecting**, because **nobody
knew which protocol era the client spoke.** The feasibility report had said so
explicitly: Anthropic's connector documentation does not state a transport, and
the only thing that would settle it was traffic.

**So the first version was not a server that happened to log. It was an
instrument that happened to serve.**

### The expiry condition was wrong, and it was corrected BEFORE it fired

The instrument's retirement condition was written as **"the first log line from
a real connector."**

**That was wrong, and it was caught in time.** The first log line came from a
connector that **failed** — the `server/discover` 404 of §4. Retiring the
instrument on that line would have removed it **at the exact moment it became
useful**, and the `server/discover` finding would have had nothing to be found
in.

It was corrected to **"a successful session that lists the tool"** before the
condition was met.

**THAT IS THE DIFFERENCE BETWEEN CATCHING A WRONG CONDITION AND DISCOVERING
ONE, AND IT IS WHY THE CORRECTION COST NOTHING.** A retirement condition is
itself a claim about the future, and it is checkable while the thing it governs
is still running. **The usual way this goes is the other direction** — the
condition fires, the instrument is gone, and the reason it was wrong is only
visible in what can no longer be observed.

**The flag is now deleted, not switched off** (`5c7cbd7`). A disabled
instrument is a dead branch that reads as available; the strict path is the only
path.

---

## 8. What the wire settled that documentation could not

The feasibility report listed this as the one thing it could not settle:
Anthropic's connector docs do not state a transport, and the claim that Claude
requires Streamable HTTP rested on secondary sources.

**Measured, from real connector traffic:**

- **`MCP-Protocol-Version: 2026-07-28`** — after the negotiation in §5.
- **A full per-request `_meta`**, carrying `clientInfo` and
  `clientCapabilities`. The stateless model is genuinely in use, not a
  paper feature.
- **It DOES send `Mcp-Name` on `tools/call`.** This was the specific open
  question, because a server that validates `Mcp-Name` against the body will
  reject every call from a client that omits it.
- **It identifies variously as `Anthropic`, `Anthropic/Toolbox` and
  `Anthropic/ClaudeAI`** — three names for what a server sees as one client.
  Anything keyed to a single `clientInfo.name` string would be wrong a third of
  the time.
- **It declares an `io.modelcontextprotocol/ui` extension**, accepting
  `text/html;profile=mcp-app`. **We do not implement it.** Recorded because it
  exists and will be encountered: a client is offering to render server-supplied
  HTML inline.

---

## 9. THE AGENT BEHAVIOUR — the finding to carry to the next tool

Asked to verify **`someone@example.com`** — the same input that exposed both
holes in the browser tool — the agent:

- **did NOT** call the tool with a mangled value
- **did NOT** report the credential as not-found
- **did NOT** fall back to web-searching for the person

**It read the rejection, stopped, explained the absence in its own words, and
asked for a credential code.**

**AN ABSENCE CAN BE TAUGHT IN PROSE TO SOMETHING THAT THEN ACTS ON IT.**

The tool description, the `instructions` string on `DiscoverResult`, and the
error messages were written **as an interface for an agent rather than as
documentation for a human**. `WEBMCP.md` §5 already asserts that *error messages
are the interface* — each one says what is wrong **and what is impossible**,
rather than failing bare and inviting a retry with a variation.

**This is the first evidence that the distinction is real**, and it was
asserted before it was demonstrated. The agent did not merely fail to find a
credential; **it understood that this lookup does not exist**, which is a
different and more useful thing for it to know.

**Carry it to the next tool: the expensive part of a tool interface is not the
schema. It is the sentences that say what the tool will never do.** Those are
what stop an agent inventing a path around the refusal.

---

## 10. The cost contrast

**One observed run, not a benchmark. One trial, order of magnitude, and the
comparison is decisive at that resolution.**

The same verification **without** the connector took roughly **three minutes**:
the agent web-searched, `curl`ed `credentials.certidemy.com`, and **hand-rolled
Ed25519 verification in Python**.

**With the tool: one call.**

Everything the long path did was possible because `WEBMCP.md` §2 is right —
verification already worked for anything that can fetch a URL, and the OB3
document is open and signed. **The tool did not add a capability. It removed
three minutes and a Python script from reaching it.**

That is the honest argument for the endpoint, and it is worth stating as
measurement rather than intuition: **the value is not access, it is the
elimination of a bespoke integration written from scratch at every call site.**

---

## 11. Decisions, briefly

**Hosting: a flat route on the existing Worker.** Not a subdomain, not a
separate Worker. **Cloudflare route precedence means `certidemy.com/mcp` can
later be re-pointed to its own Worker without the URL changing** — *"Routes can
`fetch()` Custom Domains and take precedence if configured on the same
hostname"* — so **no partner ever reconfigures.** A connector URL lives in
someone else's client settings, which is why this mattered before anything was
designed. **Supabase custom domains were rejected:** one domain per project,
$10/month, and the URL would carry `/functions/v1/` — a vendor's shape baked
permanently into a string we cannot change. The precedent for a flat,
locale-excluded route was already in the codebase at `app/lti/`, for exactly
this reason: *machines that were handed a fixed URL do not follow our locale
conventions.*

**No SDK.** `@modelcontextprotocol/sdk` carries **seventeen runtime
dependencies including `express` and `cross-spawn`**, against a protocol
envelope that is **a few hundred lines of code** — with over half of both files
being the reasoning rather than the implementation. **And the sharper reason:
an SDK that normalised headers would have destroyed the measurement in §8.**
The whole value of v1 was seeing exactly what arrived on the wire.

**`capabilities: { tools: {} }`, and NOT `listChanged`.** We do not implement
the notification stream. **Advertising a capability we do not have would leave a
client waiting** for notifications that never come — a silent failure on the
client's side, caused by an accurate-looking declaration on ours.

**What is not built: anything authenticated.** The road is in the feasibility
report — OAuth 2.1, **RFC 9728 Protected Resource Metadata as the one hard
server-side MUST**, an authorization server that is explicitly out of the spec's
scope. **Supabase's own documentation says MCP auth on edge functions is
"coming soon."** **Anything session-bound is a separate decision with its own
hosting question**, and `WEBMCP.md` §8 already says why: it is a security design
question, not a discoverability one.

---

## 12. The line worth carrying

**Three things in this document were settled by reading the wire, not the
documentation:** `server/discover` being a MUST (§4), which protocol era the
client speaks (§5), and what the connector actually sends (§8).

**In every case the documentation had been read carefully first.** §4 says so
explicitly — both the transports page and the tools page were read in full, and
the missing requirement was still missed.

**And `WEBMCP.md` §2b records the mirror of this in a different
specification.** Chrome's WebMCP documentation was **exactly right about what
the API cannot do** — no discovery signal, no way for an agent to know tools
exist, met in practice on the first try — and **exactly wrong about what it
enforces**, since `inputSchema` turned out to be advisory and both privacy locks
failed on first contact.

**Two independent instances, in two unrelated specifications, in the same week,
is a pattern rather than an anecdote:**

> **SPECIFICATIONS DESCRIBE INTENT RELIABLY AND BEHAVIOUR UNRELIABLY, AND ONLY
> ONE OF THOSE IS WHAT YOU ARE SHIPPING AGAINST.**

The practical form is not "distrust documentation" — the documentation was
correct in both cases about what the authors meant, and reading it was never
wasted. It is narrower and more useful: **when a claim is about what a running
system will do with your bytes, the specification is a hypothesis and the wire
is the measurement.** Build the instrument first, and do not retire it until
something has actually succeeded.
