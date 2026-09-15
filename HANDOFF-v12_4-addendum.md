# HANDOFF v12.4 — addendum to v12.0

**2026-09-15, the widening.** From "open it all up" to four certifications served
over the MCP: migrations 322-325, the token flow, and a run of defects that each
passed something on the way in.

---

## THE FINDING: THE ONLY TEST NOBODY DESIGNED

**An agent with the connector live built a ten-slide AIGRM-I deck without calling
this server once.** It told its operator the MCP "only serves AISM-I" and that
lessons were not available here.

Neither was inference. **Both were verbatim from `SERVER_INSTRUCTIONS`** — the
one string nobody updated. At the time it said the blueprint tools covered one
certification and that no teaching content existed. Both had been true. Neither
was true any more.

The six tool descriptions were current and correct. `get_lesson`'s said, in
terms, that it returns lesson bodies to a caller holding a key. **They lost.**

> `SERVER_INSTRUCTIONS` is read first and believed over anything a tool says
> about itself. It is the only string on this server with authority over the
> others, and it was the only one with no test, no contract version, and no
> place in any checklist.

Every other claim in the MCP is versioned and asserted. `contractVersion` is
discoverable per tool. `smoke-courseware` pins the wire vocabulary. `check-mcp`
compares both halves. And the highest-ranking sentence on the server sat outside
all of it, because it is not a tool and nothing enumerated it.

**The agent behaved correctly throughout.** It read the server's own description
of itself, believed it, and declined to make a call that would have worked. That
is not a model failure to route around — it is the system telling the truth about
a state it was no longer in.

### And the sentence that would have saved it had been deleted by a missing `+`

`lib/mcp/courseware-contract.ts`. A concatenated description lost one operator:

```js
  "the opening hook, the titled concept sections that carry the teaching, any callouts, the titled "
  "deep dives that extend a point, and the summary. " +
```

**This is not a syntax error.** Automatic semicolon insertion closes the
assignment at the end of the first line, and everything after it becomes a
well-formed expression statement that is evaluated and discarded. `get_lesson`
shipped with its description truncated mid-phrase at *"the titled "*, and **635
characters went into the void — including the only sentence saying the tool
requires an API key.**

`tsc` passed it. `npm run build` passed it. No test failed. It is legal
JavaScript that means something other than what it looks like.

**It was mine**, introduced while adding `deep-dive` to the block allowlist.

---

## 1. THE CLASS: A CHECK THAT CANNOT FIRE LOOKS IDENTICAL TO A CLEAN RUN

v12.2 recorded that every defect had *passed* a check. v12.3 sharpened it: the
checks ran as the system, so they measured what the system could do. **v12.4 is
the degenerate case — checks that never executed at all, and were indistinguishable
from checks that executed and found nothing.**

Three instances in one day:

**1. ESLint had not run on `certidemy-web` for as long as eslint has been on 9.x.**
The repo had `.eslintrc.json` and nothing else; ESLint 9 reads flat config and
does not load it, so every invocation exited with a migration notice instead of
linting. A linter that refuses to start looks exactly like a linter with nothing
to say.

`@typescript-eslint/no-unused-expressions` **is the rule for the missing `+`
above.** It was sitting behind a config the linter would not open. It is now set
explicitly rather than inherited, in `eslint.config.mjs`, with the defect it was
written after named in the file.

A second measurement came free: with `.wrangler/**` unignored the first real run
reported **36,608 errors, 36,607 of them from three generated `worker.js`
bundles.** A linter whose output is 36,000 lines of generated code is unreadable
in the same way a linter that will not start is unrunnable. Nobody reads either.

**2. `proconfig::text like '%search_path=""%'` had never matched anything, ever.**
Migration 323's pin assertion. `proconfig` is a `text[]` whose element is
`search_path=""`; rendering the array as text quotes the element and
backslash-escapes the inner pair, so `::text` is `{"search_path=\"\""}` and the
literal never occurs. Measured against three functions that are definitively
pinned — `mcp.log_request`, `is_platform_admin`, `is_team_admin_of` — all three
return **false** for the pattern and **true** for `= any(proconfig)`. It was
unconditionally false and had never been satisfied by anything in this database.

**3. The fragment extractor in `check-mcp.mjs` invented fragments.** A naive
`/"([^"]*)"/` over a source constant splits any literal containing an escaped
quote or an apostrophe in two, producing "fragments" that appear nowhere. The
check then compares the live string against text that does not exist. It now has
a self-test asserting the check *would* report a known-missing sentence — a guard
on the guard, which is what this class needs.

### Plus the two probes that named the scarier failure

Both in migration 323, both post-conditions, both reporting the wrong one of two
possible causes:

| raised | had actually measured |
|---|---|
| `a live key resolved to the wrong id` — a cross-partner authorization leak | a closed door. `EXECUTE ... INTO` leaves targets NULL on an empty result, and `is distinct from` is true for a wrong uuid and for no uuid |
| `resolve_api_key is not a pinned definer owned by mcp_authz` — three properties named | the `proconfig` predicate above, which is none of them |

**A post-condition that cannot distinguish its failure modes will name the wrong
one, and it will name the scarier one, because that is the one worth writing a
message about.**

The first was RLS: `issuer_api_keys` has it enabled with one policy for
`authenticated`, and `mcp_authz` is not that. The column grant let it address the
table; RLS returned none of the rows. No `42501`, no error — the query planned,
ran, and was filtered to nothing. **The narrowing is what tripped it**: every
other object in schema `mcp` is owned by postgres, which has `BYPASSRLS`, so the
views *are* the bypass and `mcp_authz` was the first definer owner there that RLS
applied to.

---

## 2. A PARAMETER VALIDATED AND THEN NOT TRANSMITTED

**Four instances in one day**, and the class is worth stating on its own:

> **A parameter that is validated and then dropped is worse than one that is
> never accepted, because the error surface says it worked.**

`certification` had existed on all six tools since the pilot. The Worker
validated it, rejected bad values by name, and then did not send it — correctly,
while the views were scoped to one certification and there was nothing to send.
Migration 325 changed that, and the drop survived in four places:

- the registry-wide omission, fixed with the widening;
- **two wire calls** that kept dropping it after that, serving AISM-I's blueprint
  and catalogue under three other certifications' names;
- **`search_blueprint`**, which builds its SQL in its own branch and was missed
  entirely — it accepted the parameter, validated it, and searched all four
  corpora.

The three checks that find it, ordered by worth: ask for a **non-default** value
and assert the payload differs from the default's; ask for **every** value rather
than one (three of four were wrong and one was right); and assert the property
rather than the diff.

---

## 3. What shipped

**Four certifications: AISM-I, AIE-I, AIHR-I, AIGRM-I** (migration 325). Eight
held — the four ISO-derived pending the clause-text leak detector IP-POSITION §6
requires, the four Scrum pending a quotation-marking pass.

**The boundary stayed in SQL, deliberately.** One view per allowed set, not a
predicate in the query builder. The property that buys, as a failure mode rather
than a principle: if the builder's certification predicate were dropped tomorrow,
the worst case is another **permitted** syllabus. It cannot reach a held one.
That is not hypothetical — `search_blueprint`'s predicate *was* missing, and what
leaked was AIHR-I into AISM-I, not ISO clause text.

`CREATE OR REPLACE VIEW` cannot insert a column, only append. Appending
`certification` last would have made the migration run; it was done as DROP and
CREATE instead, because column order should not be contorted around a
restriction in the statement used to build the view. **A DROP takes the grants,
and the grants are the boundary** — ten cells asserted individually afterwards,
with the paywall as one cell of the same table, plus no PUBLIC grant and
`anon`/`authenticated` still refused. It takes the comments too; all five
restated, and `mcp.certification`'s — which ended *"AISM-I only"* — corrected
rather than restored.

**The lesson paywall** (v12.3) is now proven from outside: `smoke-paywall.mjs`,
20/20, zero untested, against what is deployed.

**The parser.** `deep-dive` is prose and was being dropped — 132 of SM-AI-II's
132 lessons would have served with a whole teaching block missing. Visible only
because `omitted` reports what it withholds. And the frontmatter anchor missed
**50 of SM-AI-I's 93 lessons**, which begin with a blank line before the fence;
widened to `[\r\n]*` and not `\s*`, because across all 1,437 lessons the leading
whitespace is newlines-only in every one of the 48 cases.

**Assertions that mean something.** `smoke-courseware`'s search check was a
threshold — `0 < total < 51` for "AI" — calibrated when AISM-I was the only
corpus. Four certifications made it 116, and 116 is 36 + 44 + 20 + 16 with
AISM-I's own figure unchanged. A threshold cannot tell a corpus change from a
scoping defect; it fires with the same message either way. Replaced with four
property assertions and no magic numbers:

```
"xplain"              -> 0    34 substring occurrences, none at a word boundary
"explain"             -> >0   the same 34; the zero above is a boundary, not an outage
"candidate" in AIHR-I -> >0   14 tasks
"candidate" in AISM-I -> 0    and zero in AIE-I and AIGRM-I
```

The last one named the live defect precisely — *"14 AIHR-I task(s) returned under
AISM-I"* — where the threshold said "116".

---

## 4. Open

**From the Scrum batch, measured 2026-09-15 and not yet acted on:**

- **Five `concepts.description` rows: REWRITE, not mark.** `sprint-goal`,
  `product-backlog`, `team-size`, `daily-scrum`, `po-value-accountability` each
  use the 2020 Scrum Guide's definitional sentence *as* the definition.
  `get_concept` promises "what it means **as Certidemy defines it**" — a
  quotation there breaks the field's contract regardless of licence, and a marked
  quotation only makes the breach explicit.
- **A sixth is a different defect:** `true-leadership` reads *"Scrum Guide 2020
  phrasing; servant-leadership substance retained."* — an editorial note in a
  partner-facing field. Swept all eight open certs; one genuine instance.
- **Six `tasks` rows: MARK, not rewrite.** These are referential by construction
  and short. Task statements are the JTA and standard-setting sits on them.
- **`servant-leader` in 9 SM-AI-I lessons and 1 SD-AI-I lesson.** Removed from
  the 2020 Guide. Not IP — content accuracy. SM-AI-I carries both it and its
  replacement, so some of it is written against 2017.
- **24 verbatim Guide phrases across 21 English lessons in publishable blocks**,
  plus the 12 rows above, which no allowlist protects. Attribution is satisfiable
  by marking. **ShareAlike is open and is not ours to settle.**

**Decisions waiting:**

- **Per-certification scope.** `courseware:lessons` is one scope; one key now
  reads four corpora and would read twelve. The window to choose the shape is
  open until the first key is sold, and closes then. Recommendation and costs in
  v12.3's report.
- **`environment` is a label, not a boundary.** A `cdk_test_` key with
  `credentials:issue` mints real credentials under the issuer's real signature.
  Nothing branches on that column. Still the largest open item here: worse than
  an absent boundary, because the vocabulary asserts one.
- **The two smoke keys are live.** `c14795d3-…` (serves) and `8d959012-…`
  (unscoped), both `test-partner-02`, both `credentials:issue`. `node
  scripts/revoke-issuer-key.mjs --key … --key … --apply`.
- **`cdk_live_2008b3e8` holds `courseware:lessons`.** A live key with lesson
  access and `last_used_at` null.
- **318 is still written and not run.**

**Carried:** `mcp.resolve_api_key` does not touch `last_used_at`, so courseware
keys look dormant to anyone pruning; no rate limiting on `courseware-read`;
`pg_net` PUBLIC grants; `anon` CREATE on schema `public`; `analyze-local.mjs`
dead since `3110eec`; AIE-I still writing ungrouped items.

---

## 5. The through-line, third statement

- **v12.2:** every defect passed a check, because almost every check reads
  configuration rather than exercises behaviour.
- **v12.3:** the checks that *did* exercise behaviour still proved the wrong
  thing, because they ran as the system. Run the check as the party the property
  is about.
- **v12.4:** and a check that cannot run is indistinguishable from a check that
  ran clean.

Which lands somewhere uncomfortable and worth keeping:

> **A green result carries no information unless something proves the check
> executed.** ESLint exiting on a config it would not read, a LIKE that matches
> nothing anywhere, a fragment extractor comparing against invented text — all
> three are silent, and all three are identical to success from the outside.
>
> The defence is the one this repo already uses for empty result sets and now
> owes its own instruments: **a positive control.** `smoke-paywall` will not
> report a pass without proving an authorised caller gets a body. The eslint
> config names the defect it was written after. The fragment check asserts it
> would catch a known-missing sentence.
>
> **An instrument that has never failed is not evidence that nothing is wrong.
> It is an untested instrument.**

And the smaller one the agent taught, which no test would have:

> **Rank your claims and test the one that outranks the others.** Six correct
> descriptions lost to one stale sentence, because that sentence is read first.
