# Partner-surface incidents

Not for blame. **For the denominator.** Two outages in a week on the same failure
class is a number that should exist somewhere other than a chat transcript, and the
next time someone asks whether the partner surface is reliable, *we do not know* is a
worse answer than a figure.

Scope: `courseware-read` and the `mcp` views behind it — the unauthenticated and
key-scoped surfaces a partner's agent reads.

**And a second section, below the partner-surface ones: SELF-INFLICTED, NO PARTNER
IMPACT.** Kept apart and kept honest. An entry there did not reach anybody outside
this repository, and filing it beside a real outage would inflate the number this
document exists to make trustworthy. It is here because the denominator for *how
often a known failure class recurs* is the same kind of fact, and because a near
miss recorded only in a transcript is a near miss nobody can count.

---

## 2026-09-16 to 2026-09-24 — 177 lessons refused with a false statement about our own curriculum

**CLOSED 2026-09-24.** Migration 371 applied on the second attempt and the deploy is live;
both directions verified on the wire with a partner key. Attempt 1 aborted on its own
post-condition and changed nothing — recorded below, because the abort is the mechanism
working rather than a delay.

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
| **Ended** | 2026-09-24, migration 371 + deploy, verified on the wire |
| **Duration** | **eight days** |
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

Migration 371 makes `mcp.lesson_withholding_reason` **the primary** and derives
`lesson_body_is_servable` from it. The alternative — a reason function written beside
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

### Verified on the wire, both directions, with a partner key

The negative half is the one that matters: a refusal that never mentions ISO would pass a
one-sided check while having simply deleted the true message.

```
AIMS-F 01-01-what-an-aims-is   es-419  run 9   404  translation_pending_review
AIMS-F 05-01-aims-monitoring…  en      run 12  404  body_withheld_standard_text
```

The second still names ISO, because for that row it is true.

### And the new message makes a claim of its own, which was measured

*"The English body is available now"* is an assertion about a DIFFERENT ROW. Checked
across the population rather than on the subject: all 177 review-held rows have an English
sibling and it is servable on every one.

**True today, not true by construction.** An English body withheld by the ISO scanner
while its translation is review-held would make the new sentence false in exactly the way
the old one was. That pairing does not exist yet and nothing prevents it. The predicate is
in a comment beside the message: *review-held row whose English sibling is not servable*,
today 0.

> Writing a replacement message is writing a new claim, and a new claim gets the
> verification the old one failed. The temptation after a correction is to check that the
> wrong sentence is gone.

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

---
---

# Self-inflicted, no partner impact

Nothing below reached a caller outside this repository. It is recorded for the
recurrence count, which is the fact that makes a known failure class arguable.

---

## 2026-09-25 — the pooler exhausted by two of our own readers, ~2 minutes

| | |
|---|---|
| **What happened** | the leak rescan and the invariant suite overlapped; `courseware-read` answered `503 service busy` |
| **5xx served** | **22**, all on `/functions/v1/courseware-read` |
| **Window** | 06:21:14Z – 06:23:12Z, measured from `function_edge_logs` |
| **Who received them** | `ua=node`, from the workstation running the scripts. **All 22.** |
| **Non-script callers in the same 65 minutes** | `pg_net/0.20.0` (dispatch-emails, dispatch-webhooks) 50 requests, one bingbot fetch of `credential-og` — **every one served 200** |
| **Partner impact** | **none, measured** — not inferred from the absence of complaints |

**The measurement needed a second attempt, and the first one failed silently.** The
initial log query filtered on `log_attributes['status_code']`; the key is
`response.status_code`, so it returned an empty set that read exactly like "no 5xx
occurred". The whole status distribution was enumerated first — 200/201/204/206/401/404/503
all present — before the figure was believed. An empty result is a fact about the
probe until something proves the probe could have found anything.

### Why "no partner impact" is not the finding

The pooler is shared with the live app and the MCP. The ceiling is live isolates
times a pool size of 2, and an evicted isolate's connections linger about 100
seconds. Whether a partner was mid-call during those two minutes was luck, and luck
is not a control.

CLAUDE.md already carried the pacing rule. It was read, and then the second script
was launched anyway, by the same session — which is the argument for a mechanism
rather than a sentence, and the same argument this repository has made four times
about counts, hashes and migration tips.

### The fix

`scripts/lib/heavy-reader-lock.mjs`, taken as a **pre-run check** by
`scan-iso-leaks`, `verify-invariants`, `check-refusal-claim` and `check-mcp-wire`.
A second heavy reader waits rather than refusing; a could-not-acquire exits **3**,
distinct from "found something" and "could not look", because it never ran. Each
script also caps its own in-flight requests, so the lock stops two scripts
overlapping and the cap stops one script being the heaviest thing the endpoint has
seen.

A suite that spawns heavy readers would have deadlocked against its own children;
the holder exports its name and children inherit it. Proven both ways.

---

## 2026-08 to 2026-09-25 — a shell heredoc halving backslashes: TEN instances, now blocked by a hook

**Not an outage. A recurrence count, and the reason a rule became a guard.**

The house rule has been in CLAUDE.md for weeks: anything containing a backslash
crosses a shell as a **file**, never as a heredoc. It has been broken eight times.

| # | when | what it produced | how it was caught |
|---|---|---|---|
| 1–4 | 2026-09-24 | a literal newline inside a string literal | `node --check`, immediately |
| 5 | 2026-09-24 | `/\b(integrity\|confidentiality\|availability)\b/i` arriving with two literal BACKSPACE bytes — valid JavaScript that matches nothing | a fixture happened to sit beside it |
| 6 | 2026-09-24 | `"\b" + term` in a localisation guard: a backspace, not a word boundary. The guard passed the two rows it existed to refuse | read by a human |
| 7 | 2026-09-25 | invariant 13's own comment: `\b` became a literal backspace | **invariant 10 failed the commit that added invariant 13** |
| 8 | 2026-09-25 | `src.split(/\r?\n/)` became a literal newline inside a regex — **in the guard for this exact defect** | `node --check` |
| 9 | 2026-09-25 | a `git commit -F -` message heredoc. Nothing was mangled — the message carried no backslash | noticed by the author, after the fact |
| 10 | 2026-09-25 | a `python - <<PYEOF` patch script editing a `.mjs` file. Nothing was mangled | noticed by the author, after the fact |

**Instances 5 and 6 are the dangerous shape and the reason the guard exists.** A
mangled escape that still PARSES removes every signal you would normally rely on: it
compiles, it runs, and it silently matches nothing. A syntax error is a gift.

**Instance 7 is the guard working before anything shipped** — the first time this
class was caught by a mechanism rather than by luck or by a person.

### A third variant, found the same day

`\b` inside a **string literal** is legal source that evaluates to U+0008 at
runtime. The byte scan cannot see it by construction, so `check-control-bytes` grew
a second pass over string literals, with comments excluded — its first run fired
three times and all three were comments, two of them the note documenting instance 6.

### Ruled 2026-09-25

**No heredoc writes code, or anything containing a backslash. The file tool is the
only path.** The guard stays, because a rule that has been broken eight times is a
rule without a guard — but every instance still costs a debug cycle, and one of them
landed in a guard's own message.

### And the rule failed twice more the same day, which is why it is now a hook

**Instances 9 and 10 happened AFTER the rule had been narrowed to a bare token** —
*if you are about to type `<<`, use the file tool* — and they were committed by the
author who had just written that sentence down, in the session that recorded
instance 8.

**Neither mangled anything**, and that is the point rather than a mitigation. The
rule was keyed on the token precisely so that no judgement about content was
required; both instances happened anyway, and both were harmless by luck rather
than by design. **Luck is not a check.** A rule that survives its tenth violation
is not a rule, and a rule whose violations are usually harmless is one nobody
develops a reflex against.

> **MECHANISM: a Claude Code `PreToolUse` hook on the Bash tool refuses any command
> containing `<<`.** `.claude/hooks/no-heredoc.mjs`, wired in `.claude/settings.json`.
> The refusal names the remedy — the file tool, `git commit -F`, or `<` redirection
> — because a guard that blocks without saying what to do instead is a guard people
> route around.

**Both directions are asserted and it was watched firing.**
`.claude/hooks/test-no-heredoc.mjs` runs the real hook as a child process over ten
cases: five heredoc shapes refused with exit 2, five ordinary commands allowed,
including `git commit -F` and a single `<` redirection, which must NOT be caught.
An unparseable payload **allows and says so** — a hook that blocks everything on a
format change is a hook the next person disables, taking the real guard with it.
Then a live heredoc was attempted through the Bash tool and was refused by the
installed hook, which is the only evidence that the wiring works and not just the
script.

This is the same succession as every other mechanism here: the migration tip became
a probe, the count assertion replaced a literal, and the heredoc rule became a hook.
**A rule can be forgotten. A hook cannot.**

---

## 2026-09-25 — ISMS-F task 5.2 withheld in es and pt, 44 seconds

**Self-inflicted. Zero outside callers in the window, measured.**

| | |
|---|---|
| **What happened** | The English `skills` of ISMS-F task 5.2 was rewritten, which moves `task_ksa_en_hash`. Both translations are pinned to that hash, so both went dark until a matching review row existed. The review rows written seconds later carried a **wrong `tr_hash`**, so they did not match and the rows stayed dark until the hash was corrected. |
| **Start** | `2026-09-25 14:50:00.278Z` — `PATCH /rest/v1/tasks` |
| **es-419 recovered** | `14:50:44.427Z` — **44.1 seconds** |
| **pt-BR recovered** | `14:50:44.858Z` — **44.6 seconds** |
| **Degradation** | `explain_task` served the English `skills` for es-419 and pt-BR. Statement, knowledge and abilities were unaffected; nothing 404'd. |
| **Outside impact** | **None.** |

### The window, measured from `edge_logs` and `function_edge_logs`

```
14:50:00.278  PATCH /rest/v1/tasks                      <- English skills; both translations go dark
14:50:00.432  PATCH /rest/v1/task_translations (es)
14:50:00.561  PATCH /rest/v1/task_translations (pt)
14:50:01.141  POST  /rest/v1/task_translation_reviews   <- 201, but tr_hash could never match
14:50:01.280  task_ksa_is_withheld -> true
14:50:01.389  task_ksa_is_withheld -> true
14:50:44.171  PATCH review (es)  ->  14:50:44.427 withheld = false
14:50:44.719  PATCH review (pt)  ->  14:50:44.858 withheld = false
```

Inside those 44 seconds: **28 requests in total, 0 to `courseware-read`, and 0 from any
caller that is not this workstation (`ua=node`), the pg_net cron, or the Supabase edge
runtime.** So no `explain_task` or `get_syllabus` call of any certification or language
landed in the window, and the narrower question — ISMS-F in es or pt — is answered by that.

**Both probes carry a positive control**, because a count of zero is a fact about the probe
until something proves the probe could have found anything: in a wider window
(14:00–15:15Z) `courseware-read` appears **9** times and non-`node` callers touching task
tables appear **50** times, the last at 14:42:25 — seven and a half minutes before the
window opened.

### Two measurement traps on the way to that number

- **`task_translations.updated_at` did not move.** It still reads 2026-08-04 after a PATCH
  of `skills`, so there is no update trigger on that table and the column cannot date the
  write. The timeline above comes from the API logs, not from it. Same shape as the
  bulk-write timestamp already recorded in CLAUDE.md: *a timestamp that does not move is not
  a record of when anything changed.*
- **The first three log queries returned empty for the wrong reasons** — a `PATCH` filter on
  a method field that reports differently, and a window three hours off. Empty was treated as
  a fact about the probe until the controls above proved otherwise.

### Cause, and what it says about the design

The one-run design was correct and the run did not honour it. The writer **inferred** the
`tr_hash` formula — `translation_hash` over four newline-joined fields — where the gate
evaluates `translation_hash(knowledge, skills, abilities)`: three arguments, no statement, no
join. Read out of `pg_proc` afterwards in one query.

Worse than the slip: the run **printed `withheld=true` as a neutral status line** while both
languages were dark. It had a guarantee and no assertion of it.

### Fixes

1. The run now ASSERTS `task_ksa_is_withheld` is false for every row it meant to clear, and
   exits non-zero otherwise. A recorder that clears nothing it meant to clear is a failure,
   not a report.
2. Migration **374** gives each gate a read-only function stating what it will compare
   against, built from the gate's own expressions, so a writer asks instead of
   reimplementing. Second occurrence of this class in one day — the first recomputed a lesson
   `en_hash` with `translation_hash` where the arm uses `left(md5(content_md), 8)`.
