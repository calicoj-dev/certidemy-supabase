# WEBMCP.md

**This is the record of what was MEASURED about a draft API that will move
again. It is not a tutorial.**

A tutorial for this specification would be wrong by the time anyone read it. The
entry point was renamed **last month** — `navigator.modelContext` became
`document.modelContext` in August 2026, and **Chrome 150 deprecated the
navigator form while the origin trial still ships it**, so both exist right now
and neither is safe to assume. **Expect more renames.** What survives a rename
is what was observed about the runtime's behaviour, and that is what this
document keeps.

**The code lives in `../certidemy-web`**, same split as
`OPENNEXT-MIGRATION.md`. Four commits, in order:

| commit | what |
|---|---|
| `23c57c8` | `app/llms.txt/route.ts` — point agents at the machine credential endpoint |
| `cb8648d` | the Chrome origin trial token on `/[locale]/verify` |
| `00fcfc0` | `components/verify/webmcp-verify-tool.tsx` — the `verify_credential` tool |
| `441d6d7` | **enforce the privacy contract in `execute`** — the schema does not |
| `7bd503b` | adopt `webmcp-types`, turning a hand-found bug into a compile error |

No SQL. No migrations. Nothing in this repo changed but this file.

---

## 1. What WebMCP is, and what it is not

A **W3C Community Group draft** (Google and Microsoft) that lets a page
**register structured tools an in-browser agent calls directly**, instead of the
agent scraping the DOM and guessing at the page's affordances.

**IT IS NOT ANTHROPIC'S MCP.** The name collision is the most likely misreading
of everything below, so it is stated before anything else:

- **No JSON-RPC.**
- **No server side.**
- **It exists only in a browser, on our page.** There is no daemon, no endpoint,
  nothing to deploy, nothing to secure at the network layer.

**Reach today, which is smaller than "small":** Chrome 149 **origin trial**;
Edge **behind a flag**; and **Gemini in Chrome is the only CANDIDATE consuming
agent — and it does not call registered tools.**

**Measured on production 2026-08-31, see §2b.** The distinction is the content
here: being *the only agent* is not the same as being *an agent that consumes*,
and this document originally recorded a July citation in the place where a
measurement belonged. **The citation is kept as corroboration; the observation
is the evidence.**

---

## 2. THE STRATEGIC POINT — verification already worked, and `llms.txt` is worth more than the tool

**This is second on purpose. It is not a conclusion.**

**Verification already worked for any agent that can fetch a URL.**
`credentials.certidemy.com` serves a signed **W3C VC 2.0 / OB3** document with
**open CORS**. That was measured, not assumed: the response is **55,527 bytes**,
`access-control-allow-origin: *`, GET/POST/OPTIONS allowed, 200 to a preflight.
Any agent with an HTTP client has been able to verify a Certidemy credential the
whole time.

**WebMCP fires only for a user on our page, in a Chrome build with the trial
enabled.** That is a strictly smaller audience than "anything that can make a
request", and it will stay smaller for as long as the trial lasts.

**So the `llms.txt` change is worth more today than the tool is.** One is a
pointer every agent can follow; the other is a capability almost nothing can
currently use.

**THE TOOL WAS BUILT DELIBERATELY ANYWAY, AND THE REASON IS WRITTEN HERE
BECAUSE IT WILL OTHERWISE BE INFERRED LATER AS ENTHUSIASM.** The point was to
learn the surface on something **public, unauthenticated and low-stakes** before
attempting the session-bound ideas in §8 — a learner's progress, starting a
quiz — where the same unknowns would have been discovered against real user
data. **Everything in §3 was found on a tool where being wrong cost nothing.**
That was the purchase.

---

## 2b. MEASURED ON PRODUCTION, 2026-08-31

**This is the section that settles §2.** Everything above it about reach was
argument and citation; this is first-party observation on the live site.

### The tool is live, and the origin trial token is honoured

With **`chrome://flags/#enable-webmcp-testing` set to DISABLED** and Chrome
relaunched, on `https://certidemy.com/en/verify`:

```
document.modelContext.getTools()   ->  verify_credential
```

**THAT IS THE ONLY RUN THAT COULD HAVE PROVEN THE TOKEN WORKS.** The flag
**creates the API locally regardless of any token**, so every earlier test —
all of §3's and §5's — proved **the code** and said nothing whatever about
**the trial**. Two different claims that produce identical output on a
flag-enabled browser.

**This is the same shape as the no-op cleanup in §5 and the invisible expiry in
§7**, arriving a third time: a local configuration that keeps working is not
evidence about production, and here it was actively masking the only question
being asked.

**Scope it honestly: the token was observed honoured on 2026-08-31, on that
page.** That is not "honoured until 2026-11-16", and §7 stands unchanged.

### The meta tag is in `<head>` — measured, not claimed

```
document.head.querySelector('meta[http-equiv="origin-trial"]')  ->  the tag
```

**So React 19 does hoist it.** The comment at
`app/[locale]/verify/page.tsx:95` asserts exactly this, and until now it was an
assertion sitting one line above the thing it described. **It is now backed by a
measurement** — a web session can promote the comment; that file is out of scope
here.

Note what this closes off: §5's row records that Next's Metadata `other` field
emits `name=` and Chrome ignores it. **Avoiding that trap and landing the tag in
`<head>` are two different facts**, and only the second one is the site working.

### GEMINI IN CHROME DOES NOT CALL THE TOOL

Asked **"Verify credential AIE-I-5GFT-YJ93 on this page"**, with the sidebar
open and sharing that exact page, it replied that **it cannot interact with web
pages or submit forms**, and gave the user **three steps to click the box
themselves**.

**Read it in both directions, because only one half is a failure:**

- **EVERY LAYER WE OWN WORKS.** The tool is registered, the token is read, the
  API exists on the tab, the schema and the enforcement in `execute` are live.
  Nothing in §3, §5 or §6 is called into question by this.
- **THE CONSUMING AGENT IS NOT A WebMCP CLIENT.** The gap is entirely on the
  demand side, and it is not a gap we can close by writing better code.

**A tool nothing calls is not a broken tool. It is a tool with no caller**, and
those need opposite responses — the first wants debugging, the second wants
waiting.

### The shape worth keeping: there is no discovery signal

**Gemini read the page and produced instructions for a human.** It did what an
agent does with any page: parsed the DOM, inferred the affordance, told the user
where to click.

**A PAGE WITH REGISTERED TOOLS IS INDISTINGUISHABLE FROM ONE WITHOUT, TO AN
AGENT THAT DOES NOT CHECK.** There is **no discovery mechanism and no signal** —
nothing in the markup, nothing in a header, nothing an agent encounters unless
it already knows to call `getTools()`.

**This is Chrome's own listed limitation, met in practice on the first try.**
Which is worth noting on its own: the documented caveat and the observed
behaviour agreed exactly, in a specification where §3 records them disagreeing
completely. **The docs are reliable about what the API cannot do and unreliable
about what it enforces** — and those were read with equal trust before tonight.

**Corroboration, one line:** Google Search's **AI Mode**, asked the same
question, **fetched the page server-side, could not see the tool, and
recommended building a Playwright harness** — the exact thing WebMCP exists to
make unnecessary. Two of Google's own surfaces, neither aware of a Google-backed
API.

### The consequence for §2, which this settles

**`llms.txt` reaches every agent that can fetch a URL, today. WebMCP reaches, so
far, NONE.**

§2 argued this from reach and made it a comparison of sizes. It is no longer a
comparison — **one of the numbers is zero, measured.**

**The tool remains worth having, for the reason §2 already gives**: learning the
surface on something public, unauthenticated and low-stakes before the
session-bound work in §8. **That reason is now the ONLY one supporting it,
rather than one of two.** Nothing in this section is a reason to remove the
tool, and nothing in it is a reason to build the next one yet.

---

## 3. THE CENTRAL FINDING — Chrome does not enforce `inputSchema` at execute time

**Not loosely. Not partially. NOT AT ALL.** `additionalProperties: false` and
`pattern` are **advisory** — a description handed to the agent, not a validator
run against the arguments.

### Both privacy locks were argued for, and the argument was good

**They were not careless, and a reader who sees only the failure will assume
sloppiness and learn nothing.** The reasoning, recorded as it stood:

> `additionalProperties: false` with exactly one property makes an `email`
> argument **unexpressible** — there is no slot for it. And the `pattern`
> excluding `@` and `.` means an address **cannot be smuggled through the one
> field that does exist**. The contract is therefore **closed by shape, not by a
> runtime check someone could later delete.**

**That argument is sound about JSON Schema and false about this runtime.** Every
clause of it is correct as a statement about what the schema *means*. None of it
is a statement about what Chrome *does*, and Chrome does not read the schema
that way.

**THE LESSON IS THE GENERAL ONE: a correct argument about a specification is not
a measurement of an implementation.** The better the argument, the less likely
anyone is to go and check — which is precisely what happened here, and the
"closed by shape" phrasing was persuasive enough that it shipped in a comment.

### Both locks failed on first contact

Measured in Chrome with the trial enabled:

```
{"credential":"someone@example.com"}
  -> NOT rejected. normalizeCredentialRef laundered it into
     SOMEONE-EXAMPLE-COM and a request was SENT to verify-credential.

{"credential":"SM-AI-I-ZZMV-JPC8","email":"a@b.com"}
  -> accepted; additionalProperties:false was not enforced.
```

**Nothing leaked. THE GUARANTEE HELD BY ACCIDENT.** The mangled address missed,
and `email` was ignored **because `execute` never destructured it** — not
because anything rejected it. **An accident is not a privacy contract.** Had the
normalizer produced something that happened to match a real code, or had a later
edit destructured the arguments object, the same two payloads would have
behaved differently with nothing in the diff to warn anyone.

### Where enforcement belongs

**In `execute`, against the RAW argument, BEFORE any normalisation.**

The ordering is not a detail. `normalizeCredentialRef` exists to accept **pasted
URLs**, so it is built to be permissive — it will uppercase, strip and collapse
whatever it is handed. **It will launder anything.** Validating after it runs is
validating a value the attacker did not supply.

`validateArgs` now enumerates the accepted properties in a `const` rather than
reading them from the schema, **so that adding a property to the schema for
documentation cannot silently widen what `execute` will run on.** The schema and
the checks deliberately state the same bounds twice; they are a mirrored pair
and must not drift.

**The fix is enforced in `execute` and tested against those two inputs.** It is
not described here as "closed" — that word is the error this document is partly
about.

### The general form

**ANY WEBMCP TOOL THAT TREATS ITS SCHEMA AS A BOUNDARY HAS NO BOUNDARY.**

**And the failure is invisible, because the happy path works perfectly.** A
well-formed call from a cooperative agent returns exactly the right answer, on
the first try, every time. Nothing in normal operation distinguishes a tool that
validates from one that does not.

---

## 4. The `"--------"` hole, and how it was found

**Found by ENUMERATING what the normalizer does to an input that already passed
the pattern** — rather than asserting that a value which passed validation was
therefore safe.

Eight hyphens satisfy `^[A-Za-z0-9-]+$` and satisfy the length bounds.
`normalizeCredentialRef` reduces them to **the empty string**, which would have
fallen through to:

```
{ found: false }
```

**A claim about a lookup that never ran.** That is the one answer this tool must
never give: an agent would repeat it to a user as a verdict about a credential,
when no request was made. A `found: false` from a real miss and a `found: false`
from an empty reference are indistinguishable to every reader downstream.

**Rejected in `validateArgs` by requiring at least one alphanumeric character in
the raw input**, which makes the empty normalisation unreachable — with the
empty-reference throw retained below it as a belt, explicitly so that a future
edit which makes it reachable again **cannot turn it back into a
`found: false`**.

*(That sentence originally began "Closed by requiring". The word was caught by
this document's own check and replaced with what was actually done — which is
the discipline §3 and §4 are both about, applied to the text describing them.)*

**THE FIRST DRAFT OF THAT COMMENT SAID THE CALL WAS "SAFE NOW".** That is the
same unmeasured-claim error as the retracted "closed by shape" note in §3 —
**twice in one session, in the same file, in the same shape**: an assertion
about behaviour standing in for an enumeration of it. The comment now lists
every branch of the normalizer and marks which are provably unreachable and
why, because that is a thing a reader can check and "safe now" is not.

---

## 5. API facts that cost round trips

Lookups, not arguments. **Every one of these fails quietly**, which is why they
cost time rather than raising errors.

| fact | how it bites |
|---|---|
| **`inputSchema` is not enforced at execute time** | **Silently, and only on the inputs nobody tests.** §3 is the long form of this row |
| `executeTool` takes the tool **object** from `getTools()`, not its name | a name looks like the obvious argument and fails without saying why |
| its arguments are a **JSON string**, not an object | passing an object does not throw at the call site |
| unregistration is `registerTool(tool, { signal })` + `controller.abort()` — **not a method** | our cleanup called `.unregister()` / `.remove()`. **NEITHER EXISTS**, the `typeof` guards swallowed both, and **the tool was never unregistered on unmount**. **A NO-OP CLEANUP IS INDISTINGUISHABLE FROM A WORKING ONE UNTIL TESTED** |
| `registerTool` returns `Promise<void>` | **a synchronous `try/catch` cannot see a rejected registration.** Found by `webmcp-types`; **the hand-written interface hid it** |
| the trial token must be `<meta http-equiv>` | Next's Metadata `other` field emits `name=`, and **Chrome silently ignores it**. The token would have shipped, **looked correct in view-source**, and never been read. **Trap avoided and confirmed in `<head>` on production — §2b** |

**Three of these six are silent-success failures** — the no-op cleanup, the
unobservable rejected promise, and the ignored meta tag. Each produces a system
that looks configured and does nothing. That is the recurring failure mode this
codebase already names, arriving intact in a new API.

---

## 6. Decisions, and the reason each was taken

Written down so none is re-litigated from the code alone.

**No `email` parameter at all, rather than a stub.** A parameter that exists and
always fails **teaches an agent to retry**; an absent one teaches it the shape
of the thing. Email alone would also be an **enumeration oracle**, where a "no"
is as informative as a "yes". Email *plus* a credential id returning only a
boolean would be acceptable — and is deliberately not built, because **no
endpoint supports it**: `verify-credential` has no email, hash or salt logic,
and the public OB3 document carries no salted identifier. Building it means a
new edge function in this repo.

**`readOnlyHint: true`.** Verification reads and changes nothing, so an agent
may call it freely and repeat it without consequence.

**`untrustedContentHint: true`, on purpose.** `holder_name` and
`certification_name` originate from **partner-supplied input via the issuing
API**, so a credential can carry third-party text into an agent's context. That
is the definition of untrusted content, and marking it is cheap. It is also the
claims discipline in a new place: **the platform hosts what the issuer
asserted**, and an agent consuming it should know that is what it is holding.

**`webmcp-types` adopted, and proven with a control.** A control file was
written that made the already-fixed bug **a compile error** — establishing that
the types can fail, not merely that they currently pass. Without the control,
"it type-checks" says nothing about whether the checker would have caught
anything.

**`usewebmcp` skipped.** Third-party org, a **runtime** dependency, **five
majors since July**, and it would replace a 30-line effect **we now understand
precisely**. Understanding it precisely is exactly what §3 and §5 cost, and
handing that back to a fast-moving wrapper is a poor trade.

---

## 7. THE TOKEN EXPIRES 2026-11-16, AND THE LAPSE IS INVISIBLE

**Registration will silently stop in production while continuing to work
locally behind the flag.**

That is the worst possible arrangement for noticing. The developer machine —
where anyone would go to check — is the one place that keeps working. Nothing
throws, nothing logs, and the page renders identically, because the whole
registration is a deliberate **no-op on absence**: if the API is not there the
effect returns having done nothing.

**Same family as the no-op cleanup in §5:** correct-looking local behaviour
concealing a dead production path. It is listed as its own section because it is
the only item in this document with a date on it.

### HOW TO LOOK FOR IT — this section had no procedure until 2026-08-31

An invisible failure with no stated way of detecting it is not actionable. §2b
supplies the procedure, and it is the same one that proved the token worked in
the first place:

1. **Set `chrome://flags/#enable-webmcp-testing` to DISABLED.**
2. **Relaunch Chrome** — the flag is read at startup.
3. On `https://certidemy.com/en/verify`, run
   `document.modelContext.getTools()`.

**`verify_credential` present means the token is being honoured. Absent means it
is not**, and after 2026-11-16 that is the expected result.

**STEP 1 IS THE WHOLE PROCEDURE.** With the flag enabled — its normal state on
any machine that has done this work — **the API exists regardless of the token**
and the check returns the tool either way. Running steps 2 and 3 without step 1
produces a confident pass on a dead trial.

---

## 8. What is foreclosed, and what is next

### WebMCP cannot work inside an LTI iframe

**The `tools` permissions policy is disabled cross-origin unless the EMBEDDING
page sets `allow="tools"`** — and that page is **Moodle's or Canvas's**, not
ours. We do not control it and cannot ask every institution to change it.

**`/lti/select` and the embed interstitial ship zero scripts by design, and must
stay that way.** Recorded here so nobody spends a session discovering this from
the inside of a failing launch.

### Next

**The four-URL card on `/console/lti`**, where **a paste error already cost a
test session** — a concrete, already-paid-for reason to make those values
machine-readable rather than hand-copied.

**And anything session-bound** — a learner's progress, starting a quiz. A public
endpoint **structurally cannot serve** those. **That is a security design
question, not a discoverability one**, and it should not be approached as an
extension of this work: everything in §2 that made the verify tool a safe place
to learn stops being true the moment the tool can see a specific user.

---

## 9. The line worth carrying

Both privacy locks were **designed as shape guarantees**, argued for carefully,
and **both failed on first contact with the runtime**. The reason neither leaked
was **luck in the code downstream** — a normalisation that happened to miss, and
a destructure that happened never to be written.

**A schema is documentation addressed to an agent. A boundary is code that
runs.**

**And both holes were found by testing the FAILURE cases.** The happy path
passed on the first try and would have passed every time; **a test suite of
happy paths would have shipped both**. That is why the session ran
`someone@example.com` before it ran anything more interesting — the first
question asked of a new boundary should be what it does with input it is
supposed to refuse, because that is the only question whose answer is not
already visible.
