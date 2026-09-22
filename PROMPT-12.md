certidemy-supabase, then certidemy-web

365 is the only thing between us and everything claimed this week being false on the wire.
Run it first. Everything below assumes it has succeeded.

## 0 — What this outage means for the record, stated once

Every non-English concept read has answered HTTP 500 since migration 359. That includes
**AIMS-F**, which I signed off as released and serving 2,544 rows. No Spanish or Portuguese
caller has ever received one of them.

Correct the record wherever a serving claim was written from a view query rather than from
the endpoint — FRIDAY-READINESS, the AIMS-F release note, and the clearance records written
tonight. The rows passed the gate; the claim was that a partner's agent would receive them,
and that claim was false for the whole period.

**Rule — the view is not the endpoint, and only one of them is the claim.** A view query run
as an admin reports what the gate decided. The claim being made is that an unauthenticated
partner receives the rows, and the only thing that tests it is the deployed function
answering an unauthenticated request. A `.mjs` script against PostgREST with the service-role
key is the same error in a different costume: **the credential the test holds is the
hypothesis.** Occasion: `mcp.concept` reported 158 of 158 serving while every non-English
read of it 500'd.

**Rule — a test corpus that cannot reach the call site is not a weak test, it is not a
test.** No `concept_translations` row has `language = 'en'`, so an English read finds no
candidate, never evaluates the join predicate and never calls either function. English passed
for the entire life of the defect, across four migrations, two of which touched that
predicate. Mechanism: when a code path is reachable only for a subset of the data, the test
matrix names that subset explicitly, and a suite that exercises only the majority case
reports which paths it did not reach.

## 1 — Run 365, then verify it on the wire and not in the view

After the editor reports success:

- `courseware-read` for `concept` in **es-419 and pt-BR**, for AIMS-IA, ISMS-IA, AIMS-F and
  at least two other certifications. Report the HTTP status and a non-empty body per call.
- The same four in **en**, to confirm nothing regressed on the path that was working.
- Assert the post-conditions 365 carries in both directions: the wrappers are reachable, and
  `mcp_reader` still has no `public` USAGE and still selects zero public relations.

Report what the endpoint returned. If any call is not 200 with a body, stop there.

## 2 — The wire check that should have existed

Build it now, because it is the instrument that would have caught this on day one and it
costs almost nothing.

Every `mcp.` view, every language, against the **deployed** endpoint with a
**partner-equivalent credential** — not the service-role key. Assert 200 and a non-empty
body. Report a matrix: view by language, with the status.

Put it in the invariant suite with a denominator, per the VACUOUS rule. A matrix that
examines zero cells is not a pass.

**Do not redefine `mcp.lesson`, `mcp.lesson_index` or `mcp.task` tonight.** They call public
functions the same way and answer 200 today only because the planner prunes the call out of a
select-list expression. That is a property of a query plan, not a guarantee — but three
working partner-facing views are not worth redefining the night before the meeting. The
grant-gap check now reports them, the wire check will watch them, and they get fixed after
Friday.

## 3 — The search question, ruled

**Make it a data question, as the comment predicted.** `const withConcepts = a.language === "en"`
becomes a test of whether that language has cleared concept rows.

`searched` reports **what was actually searched**: it includes `concept` when the language has
cleared concept rows and omits it when it does not. That is a field describing what happened
rather than what exists, so widening it is additive and not a contract break at
contractVersion 2.

**Deploy order: 365 first.** Reversing it turns Spanish search from a silent omission into a
500, which is the one way to make this worse.

## 4 — `list_lessons` outranks both of the above

It fails its own declared output schema — `data/lessons/0 must NOT have additional
properties` — in both languages, and it **needs no credential**. That makes it the first tool
a partner's agent calls and the first one that will fail for them.

A server returning fields its own schema forbids is a worse thing for an ISO practice to find
than a thin description, because it is the contract being wrong rather than the content.
Fix it before Friday: either the schema admits the fields or the server stops returning them,
and say which and why.

While in that repo, check every other tool's response against its declared schema. One
mismatch found by accident usually means nobody was checking.

## 5 — `get_concept` declares concepts English-only

Its live tool description reads *"Concept text is English only — the concept layer has no
translations — so this tool takes no language argument."*

Until that changes, **an agent cannot request a Spanish concept at all**, and the entire
translation programme is invisible to an MCP caller regardless of what 365 fixes. Three things
have to ship for Friday's Spanish surface to exist: 365, the search fix, and this.

It is the Worker registry in another repo. Report what changing it involves — signature,
description, and whether the language argument needs a default — before changing it. I want
to know the size before it is done, not after.

## 6 — Then, and only then, the clearance stands

The five refusals behaved exactly as designed: rows the pins edited, never re-read, correctly
refused rather than cleared. That is the gate doing its job and it is the first time this week
a clearance has refused anything.

Once 365 is verified on the wire, report the serving percentages **from the endpoint** rather
than from the gate. Those two numbers have been the same in every report this week and they
were never the same in fact.

## 7 — Out of scope, still

ISMS-F's quality tail. The 916-row full read. The monolingual leak gap. 42006. The three
latent views.
