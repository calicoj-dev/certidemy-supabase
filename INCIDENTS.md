# Partner-surface incidents

Not for blame. **For the denominator.** Two outages in a week on the same failure
class is a number that should exist somewhere other than a chat transcript, and the
next time someone asks whether the partner surface is reliable, *we do not know* is a
worse answer than a figure.

Scope: `courseware-read` and the `mcp` views behind it — the unauthenticated and
key-scoped surfaces a partner's agent reads.

---

## 2026-09-16 to present — 177 lessons refused with a false statement about our own curriculum

**STILL OPEN AT THE TIME OF WRITING.** The fix is written and has not landed; the first
attempt at migration 371 aborted on its own post-condition and changed nothing. Dated
from when it began, not from when it will end.

**Class: a wrong answer, HTTP 404, for eight days. Not an outage — worse.**

The two entries below are outages. An outage is visible, it is loud, and it never
tells anybody something untrue. This one served a confident, well-written, complete
sentence that was false, to the only audience that cannot check it.

| | |
|---|---|
| **What was wrong** | `get_lesson` refused every withheld lesson body with *"It reproduces clause text from an ISO standard, which Certidemy may teach from but may not redistribute."* |
| **Withheld rows** | **183** |
| **Genuinely withheld by the ISO scanner** | **6** (2 lesson groups x 3 languages) |
| **Told the ISO reason wrongly** | **177 — 96.7 percent** |
| **Started** | 2026-09-16, migration 350, when `lesson_body_is_servable` began ANDing the review arm into the value the refusal branches on |
| **Ended** | **not yet.** Migration 371 is written; attempt 1 aborted on its own reachability post-condition (the new function was created EXECUTE-to-PUBLIC, because schema `mcp` has no `pg_default_acl` entry) |
| **Duration** | **eight days and counting** |
| **Detected by** | a tool-description sweep asking what the server *says*, not what it does. No instrument was watching. |

### It is not merely the wrong reason. It is a claim our own scanner had measured false.

```
the 177 review-held rows:   longest ISO run  max 9     at or over the floor of 10:  0
the 6 ISO-held rows:        longest ISO run  10 and 12
```

**Every one of the 177 is under the reproduction floor, measured by the instrument
that sets the floor.** So this was not an unverified claim — it was a claim
contradicted by a number already stored on the same row.

### Cause: a three-state discriminator whose third state was unreachable

`courseware-read` had the right three branches and a comment explaining them:

```
no index row          -> the lesson does not exist
body_available false  -> the body reproduces standard text
body_available true   -> mcp.lesson still refused: an unreviewed TRANSLATION
```

The third line assumes `body_available` reflects the ISO scanner alone. Since 350 it
is `lesson_body_is_servable`, which ANDs the scanner, the review arm and 367's
provenance arm — so *"body_available true AND mcp.lesson refused"* cannot happen, both
read the same function, and the branch written for the common case (177 rows) was
**dead code** while every row fell into the branch written for the rare one (6).

**A three-state discriminator with an unreachable third state is a two-state one that
reports the wrong state.** This repository has paid for that shape before, in
CONTIGUOUS / INTERPOLATED / CHAINED, where folding one state away would have cleared
69 real reproductions. Here it manufactured 177 false ones.

### Why nothing caught it

Every check pointed at the verdict. `body_available` was correct on all 183 rows, the
gate withheld exactly what it should have withheld, and the wire matrix recorded a 404
with a reason — which it scored as a pass, because **a refusal that arrives is a
refusal that works**. Nothing compared the reason given against the reason held.

`DESCRIPTION-SWEEP.md` row 9 even *verified* this refusal on 2026-09-24 and marked it
**true** — on `aims-ia-04-06`, which is one of the 6. The sweep drew the one subject in
thirty for which the message was accurate.

> **A SPOT CHECK OF A PER-ROW CLAIM LANDS ON THE COMMON CASE BY CONSTRUCTION — AND
> HERE THE COMMON CASE WAS 3 PERCENT OF THE ROWS.** One subject cannot distinguish
> "this message is right" from "this message is right about this row".

### The fix, and the part that is structural

Migration 371 — **written, not yet applied** — makes `mcp.lesson_withholding_reason`
**the primary** and derives `lesson_body_is_servable` from it. The alternative — a reason function written beside
the verdict function — is the `mcp_servable` defect in advance: two implementations of
one rule, drifting at the first edit, the drift surfacing as a row refused for a reason
that is not why it was refused. **They cannot disagree, because there is nothing to
disagree with.**

Each reason now gets a message that is true of it, and a **fourth state** — the gate
withholds and names no arm — is reported as a defect on our side rather than defaulted
into one of the three. Defaulting is how 177 rows came to be told about ISO.

### The abort is worth its own line, because it is the mechanism working

Attempt 1 was reported as applied. `pg_catalog` disagreed: no function, no column,
`lesson_body_is_servable` byte-for-byte the pre-371 body. The migration had raised, rolled
back and left the database correct.

**Nothing was written, and three instruments said so before anything was re-run** — the
fingerprint, the deploy precondition and `pg_catalog`. Had any one of them been trusted
less, the next step would have been a deploy of a function selecting a column that does
not exist: a total 400 on `get_lesson`, replacing a false answer with no answer.

The assertion that fired was the both-directions reachability check. Its positive half —
*the declared roles can call it* — would have passed cleanly while `anon` held EXECUTE.

### What it cost

Nothing measurable, and that is not reassurance. The claim was made to partner agents
reading our curriculum, on the single subject where the business is *being believed
about what our content is*. A partner who read it learned that Certidemy's Portuguese
reproduces ISO text. It does not.

---

## 2026-09-23 — search down in every language, ~15 minutes

**Class: schema reachability. Self-inflicted by a change aimed at improving something.**

| | |
|---|---|
| **What broke** | `resource: "search"`, every certification, **every language including English** |
| **Symptom** | `HTTP 500 {"error":"read failed"}` |
| **Other resources** | unaffected — `certification`, `task`, `concept`, `lesson_index` all served throughout |
| **Started** | between 23:30 and 23:37, at the first deploy after commit `d05e8d1` (23:29:56) |
| **First observed** | 23:43:57, a background control run returning `exhausted` on every cell |
| **Confirmed deterministic** | ~23:50, a single call after a 90-second rest still 500 |
| **Service restored** | ~23:52, rollback deploy, verified 200 / 80 rows twice |
| **Duration** | **bounded 15–22 minutes**; not known to the minute, because the start is bounded by a deploy whose completion time was not recorded |

### Cause

Migration 368 installed `unaccent` into the `extensions` schema. `courseware-read`
was deployed calling `extensions.unaccent(...)` from SQL assembled in TypeScript.

```
role          USAGE on extensions    EXECUTE on unaccent
mcp_reader    FALSE                  true
```

**EXECUTE was true** — extension functions are granted to PUBLIC — and the call was
refused at the **schema door**, before the ACL was consulted.

### Why the existing defences did not catch it

Two separate failures, needing two separate fixes:

1. **The rule existed and nothing applied it.** CLAUDE.md records, from 364, that a
   reachability check asks `has_function_privilege` **and** `has_schema_privilege`
   and names which gate is shut. Nothing triggered it before this deploy.
2. **The automated check existed and covered the wrong path.**
   `check-view-function-grant-gap.sql` walks functions named inside `mcp` **views**.
   This call site was SQL built in TypeScript — a second call site no enumeration of
   views can see.

### What was done

- **Rolled back before diagnosing.** Service first. Diagnosing first is how a
  three-minute outage becomes a thirty-minute one.
- Separated deterministic failure from pooler exhaustion **by persistence** — a
  90-second rest, because `{"error":"read failed"}` is the same string for both.
- 369: `mcp.unaccent`, a SECURITY DEFINER wrapper **delegating** to the original.
  Granting `USAGE ON SCHEMA extensions` instead was measured and refused: 59
  functions plus `pg_stat_statements` reachable by a partner-facing read role, for
  one dictionary lookup.
- 370: `mcp_check_reachable()` so the gate can actually run.
- `scripts/check-inline-sql-reachable.mjs` — the missing coverage.
- `scripts/deploy-courseware-read.mjs` — the gate **inside** the deploy path, because
  a pre-deploy check that is not in the deploy path is a rule, not a check.
- `scripts/smoke-courseware-tools.mjs` — one call per tool after every deploy. Not
  prevention: **the thing that makes an outage cheap is noticing in ten seconds
  rather than ten minutes.**

### The tell worth keeping

**It hit English too.** That is what separated it from a translation-layer or
content fault immediately, and it is the first thing to check when a language-shaped
symptom appears: if English is affected, the cause is not about language.

---

## 2026-09-22 — non-English concept reads down, four migrations

**Class: schema reachability. Self-inflicted by a change aimed at improving something.**

| | |
|---|---|
| **What broke** | `resource: "concept"`, `es-419` and `pt-BR`, every certification |
| **Symptom** | `HTTP 500`, `permission denied for schema public` |
| **English** | unaffected — and that is why it survived four migrations |
| **Dates live** | introduced by 364, found and fixed 2026-09-22 |
| **Duration** | **not measured.** Recorded here as unmeasured rather than estimated |

### Cause

`mcp.concept`'s predicate called `public.translation_hash`, which is **SECURITY
INVOKER** with `search_path = ''`. Its body therefore resolved `public.ksa_en_hash`
at runtime **in the caller's privilege context**, and `mcp_reader` holds no USAGE on
`public`.

> A SECURITY DEFINER function is reachable by anyone holding EXECUTE. **A SECURITY
> INVOKER function is only as reachable as everything its body touches.**

### Why it survived

**No `concept_translations` row has `language = 'en'`.** An English read finds no
candidate row, never evaluates the join predicate, and never calls the function. The
only language that could not exercise the broken path is the one everything was
tested in.

---

## The pattern across the outages

The two outages were **schema reachability**. Both were **self-inflicted by an
improvement**. Both were invisible to the checks that existed, for different reasons.
Neither was a surprise about Postgres — both are documented failure modes.

That argues for gates in the deploy path and a fast smoke, **not for more care**.
Care is what both of these already had.

## And the third one is a different animal

The refusal-reason defect is here deliberately, beside two outages, because it belongs
in the same denominator and it is the more serious of the three.

| | outage | false statement |
|---|---|---|
| visible | immediately, to everyone | never |
| duration | 15 and ~20 minutes | **eight days** |
| what the partner learns | the service is down | something untrue about our curriculum |
| what fixes it | a rollback | nothing, once they have read it |

**An outage costs availability. A confident false answer costs the thing availability
is for.** Both deploy gates added this week — the reachability check and the smoke —
would have passed this defect without a murmur, because the endpoint was up, fast and
answering. Uptime is not the property to watch here.
