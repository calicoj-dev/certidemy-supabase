certidemy-supabase, then certidemy-web

The Friday deadline is withdrawn. Nothing here is triage; do it properly.

Order matters — each section unblocks the next. 365 is the only thing that needs a human
hand, and everything below assumes it has run and been verified on the wire.

## 1 — 365, then the wire

After the editor reports success:

- Run `check-mcp-wire.mjs`. Every cell 200 with a body. The ten concept cells are the ones
  that must flip.
- Run the invariant suite. Invariant 8 should go from fail to pass with its denominator
  intact.
- Assert 365's post-conditions in both directions: the wrappers are reachable, and
  `mcp_reader` still has no `public` USAGE and still selects zero public relations.

Then the endpoint-measured serving percentages, per certification and language, **from the
endpoint**. That is the first honest version of a number I have been quoting all week.

## 2 — Deploy the search change

Only after §1 is green. `clearedConcepts` and the non-English-only fallback filter are
written and type-clean; they just need to land after 365 rather than before it.

Verify on the wire: a Spanish search against AIMS-IA returns concept hits and reports
`searched: ["task","concept"]`; an English one still returns its whole corpus; a language
with no cleared concept rows still reports `["task"]` and does not 500.

## 3 — The pooler ceiling. This outranks the content backlog.

Seventy-five sequential unauthenticated reads exhausted `max_client_conn`. That is not an
artifact of your instrument — it is the shape of a partner's agent walking the catalogue, and
they will hit it without meaning to.

Measure it rather than reason about it:

- what `max_client_conn` and `default_pool_size` actually are for this project
- how many sequential `courseware-read` calls it takes to exhaust the pooler, from cold
- whether it is connection count, isolate lifetime, or hold duration that binds
- what a realistic catalogue sweep looks like — twelve certifications, three languages, the
  public resources — and whether that sweep completes

Report the numbers before proposing a fix. If the honest answer is that the current
configuration cannot survive a partner reading the whole catalogue, that is the finding and
it is mine to act on.

## 4 — Split the error string

`{"error":"read failed"}` answers both `permission denied for schema public` and
`no more connections allowed (max_client_conn)`. One string, two causes, opposite fixes —
and it cost you twenty minutes tonight on a failure you had caused yourself.

The endpoint distinguishes them. A permission or configuration failure is a 500 that means
*this is broken*; exhaustion is a 503 that means *try again*, ideally with `Retry-After`.
Neither leaks anything a partner should not see: that the service is busy is not a secret,
and that a role lacks a grant is our defect, not our threat model.

Keep the persistence-based separation in `check-mcp-wire.mjs` regardless. A black-box check
should not depend on the server being honest about its own failure mode.

## 5 — The three latent views, fixed properly

`mcp.lesson`, `mcp.lesson_index` and `mcp.task` call public functions exactly as
`mcp.concept` did. They answer 200 today because the planner prunes the call out of a
select-list expression. That is a property of a query plan, not a guarantee, and it is not a
state to leave a partner-facing surface in now that there is no deadline.

Same treatment as 365: thin `mcp.` wrappers delegating to the public originals, no second
copy of any hash. One migration, post-conditions in both directions, and the wire check green
across all four views in all three languages afterwards.

Report the firing count of `check-view-function-grant-gap.sql` before and after. It should go
to zero, and its positive control — which currently fires on `lesson_body_is_servable` — will
need a different subject once that is fixed. Pick one that stays true, or convert it to a
fixture the way you did with the contradiction sweep's regression control.

## 6 — `get_concept` takes a language. certidemy-web.

Your sizing is right and the file already names its own procedure. One ruling on top of it:

**Bump to contract 3 and keep serving 2 unchanged.** Adding `descriptionIsFallback` under
`additionalProperties: false` and widening the `language` enum both break a strict validator
pinned at 2. `contractVersion` exists so a partner can pin; if bumping it breaks pinned
callers then the field is decoration.

- v2: current shape. English only, no `descriptionIsFallback`, no `language` input.
- v3: `language` input defaulting to `en`, three-value output enum, optional
  `descriptionIsFallback`.

**If the registry cannot serve two shapes from one tool, stop and tell me before widening
anything.** That is a finding about the contract mechanism itself and it changes what
`contractVersion` has been promising every partner since it was introduced.

Declare `descriptionIsFallback` in the schema **before** the mapper can emit it, per the note
already in `courseware-contract.ts` — otherwise the first correct response is the first
invalid one.

## 7 — One rule to record, from your §4 reversal

**Rule — a tool description read through a connector is a claim about that connector's cache,
not about the server.** You reported `list_lessons` returning fields its schema forbids;
measured against the live server, zero tools do. The rejection came from a stale client-side
copy, evidenced by it advertising four certifications where the live server advertises twelve.
Mechanism: anything asserted from a connector's tool list is verified against the live
server's declared schema before it becomes work. Occasion: a contract defect reported, a fix
nearly written, and neither existed. Same family as reporting serving from a view — **the
artifact the observer holds is the hypothesis.**

## 8 — After all of the above, the content backlog

In this order, and none of it starts before §1 through §6 are done:

1. **The monolingual leak gap.** 3,460 translated concept rows and every translated lesson
   body sit outside any leak instrument, and we have just regenerated a large part of that
   corpus. The index is English-only, so whether a translated row coincides with ISO's own
   Spanish or Portuguese rendering is currently unmeasurable. Report what closing it would
   require — which editions, what they cost, whether a partial index is worth anything — as
   a decision paper rather than a fix. The purchase is mine.
2. **ISMS-F's quality tail.** Roughly a hundred rows in the `rewrite` disposition that fire
   nothing. Batches of forty, `keep-on-read` expected to be common, same discipline.
3. **The 916-row full read** across the six blocked concept draws.
4. **42006**, which is a purchase decision resting on three AIMS-F descriptions.
