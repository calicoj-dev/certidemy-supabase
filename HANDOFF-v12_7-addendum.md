# HANDOFF v12.7 — addendum to v12.0

**2026-09-15 into 2026-09-16.** The Scrum four shipped, the curriculum surface
went down and came back, `get_lesson` served a licensed lesson body for the first
time, and the auth decision was made and then reversed on an argument nobody had
made yet. One outage, two migrations, and a measurement that retired a blocker
this repository had spent two days building around.

**Nothing is broken at the close.** What is open is listed in section 5 and is
all observability, scope or judgement.

---

## THE FINDING: THE LEAP, NOT THE MEASUREMENT, WAS WRONG

v12.6 recorded that a Supabase access token carries `aud: "authenticated"` — the
Postgres role name every token on every Supabase project carries — and concluded
that **a learner's browser session is presentable at `/mcp`**, the confused-deputy
case the MCP spec's MUST exists to prevent. That drove a week of WorkOS scoping.

**Every measurement in it was right. The conclusion drawn from them was not.**

Two tokens, both decoded from this project on 2026-09-16:

| claim | ordinary password session | OAuth access token |
|---|---|---|
| `aud` | `"authenticated"` | `"authenticated"` |
| `iss` | this project | this project |
| **`client_id`** | **ABSENT** | **PRESENT** |
| `amr` | `["password"]` | `["oauth_provider/authorization_code"]` |

**`client_id` is absent from a browser session and present on an OAuth token, and
the password grant cannot be made to mint one.** The case §13 named is
discriminable after all, by a claim that was sitting on the token through every
session that argued otherwise.

> **"`aud` cannot discriminate" was measured. "Nothing can" was inferred, and it
> was the inference that cost the week.**

The gate is now `iss` + `client_id` against an approved-client list + an
entitlements row. `aud` is never read — it is the same constant on every token
this project issues, so a check against it would pass on everything and look like
a control.

### And the argument that actually reversed the decision

Not the claim. **The Supabase path is already built** — consent screen live, PRM
deployed, `oauth_issuer_bindings` holding rows written through its own policy,
dynamic registration exercised and then closed deliberately, a real code
exchanged and decoded. WorkOS would discard all of it to close one gap that
closes with a predicate.

**That is not sunk cost.** Sunk cost keeps a path because it was expensive. This
is the opposite: the built path meets the requirement once the requirement is
stated correctly, and the requirement had been overstated.

---

## 1. THE OUTAGE, AND WHY NO ORDERING AVOIDED IT

Migration 328 widened the MCP views to eight certifications.
`functions/_shared/courseware-query.ts` still listed four. `courseware-read`
asserts at cold start that the two agree — **as an equality** — and refuses to
serve on a difference.

So it refused **all eight**, not the four it had not heard of. The four that had
worked for weeks went down with the four being added.

**There was no ordering that avoided this.** Views first: `served(8) != expected(4)`.
Function first: `served(4) != expected(8)`. **An equality assertion across a deploy
boundary makes a two-copy list unshippable in either direction.** The ordering was
never the mistake; the predicate was.

### The fix is asymmetric, because the two differences are not the same risk

| | |
|---|---|
| `served ⊃ expected` | somebody widened the views and this function is behind. The extras are not offered; everything it knows still works. **Log and serve on.** |
| `expected ⊄ served` | the function believes it serves a certification the views do not carry, so a request would read a view that filters it out and **return an empty result that looks like an answer**. **Refuse**, and name what vanished. |

The widened-views log is written to be read at 3am by somebody asking why a new
certification returns nothing: it names cause, effect and fix, says plainly that
nothing is broken and this function is behind, and never uses the word
*mismatch*.

**Neither new branch can fire today** — expected(8) equals served(8) — so
deploying proved nothing about them. `scripts/test-certset-predicate.mjs`
produces all three outcomes on purpose, 14 assertions including the narrowing and
the unknown-code cases, because a check that cannot fire is indistinguishable
from one that ran clean.

**The same shape now governs the auth transition** and is recorded in
`MCP-AUTH-OPTIONS.md` §7: accept both token issuers, never flip.

---

## 2. THE SCRUM FOUR SHIPPED, AND READING INVERTED EVERY COUNT

Three pieces of work, and the interesting part is that the numbers that
justified them all shrank on contact with the rows.

**327 — eight `concepts.description` rows** where the 2020 Scrum Guide's sentence
WAS the definition. `get_concept` promises "as Certidemy defines it", so a
quotation there breaks the field's contract whatever the licence says. The record
named five SLUGS; they were eight ROWS, because `sprint-goal` exists on two
certifications and `daily-scrum` on three.

Every replacement was checked against the Guide and shares no run of five or more
words with it. **The check caught a draft of `po-value-accountability` containing
"one person, not a committee"** — the Guide's own phrase, written back in by hand
while trying to avoid exactly that.

**The terminology pass — 215 occurrences, two genuine defects.** 113
`Development Team`, 78 `self-organizing`, 24 `servant-leader`. After reading every
row: of the 113, **five are plain prose and all five sit inside
`05-05-terminology-drift`**, the lesson whose subject is the removal of that term.
A sweep-and-replace would have rewritten the lessons that teach the correction
into nonsense — migration 290's guard, in content.

**The corpus already had the predicate**: `teaches_retired_vocabulary` in lesson
frontmatter. **And it was set in English only** — seven of ten flagged rows
carried it on `en` while their es-419 and pt-BR siblings carried the same retired
terms and no flag. Now nine lessons, all trilingual.

**The marking pass — 450 rows.** 150 English lines carrying a verbatim run of 8+
words gained a trailing source attribution, applied in all three languages.
Verified afterwards by re-reading: **150 marks across 62 lesson rows in each
language, identical.**

The threshold is a CHOICE and was chosen for the cost of its errors. There is no
correct one, and that was established rather than assumed: `team-size` read
*"Typically 10 or fewer people."* — five words, verbatim, the whole definition —
so a long cut misses real defects; and the recorded figure of *"24 phrases across
21 lessons"* reproduces at no setting at all. **An over-attributed passage is not
a defect; an under-attributed one is.**

### The applier earned its guards twice, and the second catch is the one to keep

The round-trip check refused **eight English rows for mixed line endings** —
splitting on `/\r?\n/` and rejoining would have normalised every line in those
files, a 500-line diff on a row where eight words changed.

**And all eight refusals were `en`.** Refusing them row by row would have marked
es-419 and pt-BR and left English unmarked — manufacturing the exact trilingual
asymmetry the pass exists to prevent, in the opposite direction, **in the two
languages nobody reviewing it can read.** Resolution is now per entry across all
three languages: one language that will not resolve drops the entry in all three.

**One lesson is deliberately unmarked.** `SM-AI-I/01-02-empirical-process-control`
has a block sequence that differs across languages. One 8-word run was not worth
a positional edit that could mark the wrong sentence in a language no reviewer
here can read.

---

## 3. THE COUPLING THAT HAS TO BE WRITTEN DOWN

**"An approved client id" means something only because approval is manual.**

Dynamic client registration was open and unauthenticated on this project until
2026-09-15 — our own probe script registered five clients in a day sending no
credential. It is closed now, and **the gate's second term depends on it staying
closed.** If the check tests membership in `auth.oauth_clients` rather than a
curated list, re-enabling that flag silently converts it from *an approved agent*
to *anyone who asked*, with no code change, no deploy and nothing to review.

The recommendation is to assert the state rather than read the setting:

```sql
select count(*) from auth.oauth_clients
 where deleted_at is null and registration_type <> 'manual';
-- must be 0
```

That fails at the moment it starts to matter — somebody re-enables the flag AND a
client self-registers — rather than at the moment somebody changes a setting.

---

## 4. What shipped

- **327** — eight concept descriptions rewritten, `SD-AI-I/daily-scrum` asserted
  unchanged as the negative half.
- **328** — MCP views widened to eight. Generated from 325's body with the
  `allowed` array changed, because 325 had already paid for the drop-and-create
  and the ten-cell grant assertion. **Its first run aborted on a post-condition
  that kept 325's literal `4`** while the views were built from the new array;
  the counts now derive from `allowed`, so the view and its assertion cannot
  disagree by construction.
- **The terminology and marking passes**, above, with `gen-marking-spec.mjs` /
  `apply-marking-spec.mjs` as a spec-then-apply pair — the shape CLAUDE.md asks
  for and the generators in this repo had never had.
- **`courseware-read`** — `CERTIFICATIONS` at eight, the cold-start check made
  asymmetric, deployed and verified.
- **`retired_vocabulary_intent = 'quoted'`** on the one secure item that uses
  *servant-leadership* as live professional-practice vocabulary rather than
  testing the drift. The column is `text CHECK IN ('none','quoted')` and read
  `'none'` on all 35 items — it exists for exactly this judgement and nobody had
  ever made one.
- **`MCP-AUTH-OPTIONS.md` §8** — the reversal, the gate, the coupling, and the
  named triggers. §3 and §7 rewritten at their headings rather than banner-marked,
  because a reader lands mid-document and a heading has no room for a bracket.
- **`MCP-SERVER.md` §13** — the conclusion corrected in place. The measurements
  stand; the sentence *"nothing downstream retires it"* did not.

---

## 5. Open

### CLOSED the same day: get_lesson serves

**Nothing in this repository is broken as of 2026-09-16.** `get_lesson` refused a
correctly scoped key for most of the day; both halves are fixed and a real lesson
body has been served.

`mcp_requests` tells the whole story, because the function logs its own refusals
and its own successes:

```
04:25:59  status 401  "x-certidemy-key header required"   <- the Worker sent no key
04:45:40  status 401  "invalid API key [unknown]"         <- key arriving, not yet resolving
04:55:33  status 200  rows 1                              <- a lesson body, first time ever
```

**Root cause: `SUPABASE_SECRET_KEY` was absent from the Cloudflare Worker**, so
its own key lookup returned `unavailable`. **Second defect: the code did not do
what its comment said** — `registry.ts:665` documents that `unavailable` is
deliberately not short-circuited because *"the key is forwarded and the function
decides"*, while the ternary building the headers yielded `{}` for anything that
was not `ok`. So the fallback written to survive a broken lookup did not survive
it, and our missing configuration was reported to the partner as their key being
bad. Both halves closed by the web session.

**The diagnosis is worth keeping as method.** It was reached with no access to
Worker logs, purely by elimination from one row: the function was reached (it
logged) and received no credential; headers attach only on `ok`; `absent` and
`invalid` short-circuit before the call; therefore `unavailable`. The instrument
that answered it was the request log, not the key column — see below.

### ATTRIBUTION: it already works, in a column nobody looked at

**[Corrected 2026-09-16. This section first claimed that "a partner's licensed
lesson read is served and leaves no record of which partner." That was wrong, and
it was wrong in the way this whole document is about: a null column was measured,
and the absence of attribution was inferred from it.]**

`mcp_requests.api_key_id` is indeed null on every row ever written, and
`mcp.log_request` indeed cannot write it — seventeen parameters and the key id is
not one. Both facts are correct. **The conclusion was not**, because attribution
is carried somewhere else:

```ts
// courseware-read, on the authorised path, after the scope check
caller = `key:${key.key_id}`;
```

`caller_hash` does double duty, namespaced so the two kinds cannot be read as
one: an HMAC of the client IP for free traffic, and `key:<uuid>` for a paid read.
Every lesson read since the change carries the key id, and today's green run is
among them:

```
2026-09-15 00:00  ip hmac                      <- before the change
2026-09-15 00:06  ip hmac
2026-09-15 03:26  key:c14795d3-...             <- after
2026-09-16 04:55  key:c14795d3-...             <- today's green run
```

`c14795d3-...` is `cdk_test_5da292df`, the key mcp:check presented. **The read was
attributed, correctly, to the right key, at the moment it was called
unattributable.**

### What is actually left, and it is two comments

Both column comments describe a world that has ended:

- `api_key_id` — *"Null until the lesson token flow exists. There is no
  authentication on the courseware path today, so MCP traffic cannot be
  attributed to a partner."* The lesson token flow shipped in 322 and 323 and
  served a body today. **The column reads as deliberately empty for a reason that
  expired.**
- `caller_hash` — *"HMAC of the caller IP with a monthly salt. Never a raw
  address."* True of free traffic and half the story: it is also where partner
  identity lives.

**Fixing those two comments is a one-statement migration.** No function, no owner
dance, no redeploy. It converts a capability that works and looks absent into one
that is documented — which is the entire defect.

### And what a real `api_key_id` column would cost, if it is ever wanted

Scoped, not built. It is a **signature change on a SECURITY DEFINER function**,
and `create or replace` cannot do it: a different argument list makes an
OVERLOAD, not a replacement. So:

1. `create` the 18-argument function;
2. `alter function mcp.log_request(<18 types>) owner to mcp_logger`;
3. `grant execute on function mcp.log_request(<18 types>) to mcp_reader, mcp_holder`;
4. **`drop function` the 17-argument one**;
5. change `courseware-read` and redeploy.

317 and 324 both restate the owner and both grants with the full type list spelled
out, which is the shape of this dance every time it is done.

**Two failure modes, and both are silent.** Skip step 4 and the edge function's
seventeen-argument call binds to the surviving overload and keeps writing null —
indistinguishable from today. Do step 4 before step 5 and logging stops
altogether, because `boundedLog` is deliberately never-break-the-caller: it would
not error, it would simply record nothing.

**Recommendation: do not build it now.** `api_key_id` is the better QUESTION than
`last_used_at` — a key id on the row says what was read and by whom, while
`last_used_at` says only that a key was used somewhere — but the answer to that
question already exists in `caller_hash`. A typed uuid with a foreign key is
worth having; it is worth having *the next time something else forces a
`log_request` signature change*, so the dance is paid once rather than twice.

`issuer_api_keys.last_used_at` stays unwritten by the courseware path, and stays
the weaker question.

### CLOSED: the web half shipped

`df85b73` deployed. mcp:check section H passes with **all eight certifications
named in the deployed `SERVER_INSTRUCTIONS`**, and D2 proves each returns its own
domains. The string v12.4 established is read first and believed over six correct
tool descriptions is now correct in production, and was verified there rather
than in a repository.

**The `SM-AI-I` / `SM-AI-II` prefix bug is web-side only.** Swept this repo:
every `includes()` here is array membership, the views use `code = any (array)`,
and the cold-start check compares full sorted strings. The bug needs a prose
string of codes to be dangerous, and that side keeps one.

### Judgement calls left open

- **27 passages** carry a run of 20+ words and a trailing attribution where a
  set-off quotation would read better. Attribution satisfies BY; presentation is
  a human pass.
- **16 secure bank items** deliberately use `servant-leader` and still read
  `retired_vocabulary_intent = 'none'`. The column now says one item is
  deliberate and sixteen are not, which is less true than all-`none` was.
- **ShareAlike is not settled and is not ours to settle.** The BY half is.

**Carried:** `environment` is a label and not a boundary, still the largest open
item; per-certification scope for `courseware:lessons`; `mcp.resolve_api_key`
does not touch `last_used_at`; no rate limiting on `courseware-read`; `pg_net`
PUBLIC grants; `anon` CREATE on schema `public`; `analyze-local.mjs` dead since
`3110eec`; AIE-I still writing ungrouped items; Spanish curriculum still
unmeasurable by the analyzer.

---

## 6. The through-line, sixth statement

- **v12.2:** every defect passed a check, because almost every check reads
  configuration rather than exercises behaviour.
- **v12.3:** the checks that *did* exercise behaviour proved the wrong thing,
  because they ran as the system.
- **v12.4:** a check that cannot run is indistinguishable from one that ran clean.
- **v12.5:** so is a code path — and when data holds it shut, it opens without an
  edit.
- **v12.6:** and the records both sides keep are configuration too.
- **v12.7:** and a correct measurement can still carry a wrong conclusion out of
  the room.

Four things in this document were decided by reading one more field than the
question required — and the fourth was this document's own correction, made after
the section claiming it had already been written:

> `aud` cannot discriminate — measured, and true. **Nothing can** — inferred, and
> false, with `client_id` sitting on the token throughout.
>
> 113 occurrences of a retired term — counted, and true. **113 defects** —
> inferred, and false; five were prose and all five were in the lesson about the
> removal.
>
> The views serve eight and the function expects four — measured, and true.
> **Therefore refuse** — inferred, and it took production down, when serving the
> intersection was available the whole time.
>
> `api_key_id` is null on every row and `log_request` cannot write it — measured,
> and true. **Therefore the read is unattributable** — inferred, and false, with
> the key id in `caller_hash` on the very row being examined.

The pattern is not bad measurement. Every number above was right. It is that **a
measurement answers exactly what it was asked, and the sentence that leaves the
room is usually broader than the question.** The defence is cheap and this
document is three instances of it: before acting on a number, say out loud what
it does NOT establish, and check whether the action depends on that part.
