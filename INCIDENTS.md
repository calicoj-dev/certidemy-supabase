# Partner-surface incidents

Not for blame. **For the denominator.** Two outages in a week on the same failure
class is a number that should exist somewhere other than a chat transcript, and the
next time someone asks whether the partner surface is reliable, *we do not know* is a
worse answer than a figure.

Scope: `courseware-read` and the `mcp` views behind it — the unauthenticated and
key-scoped surfaces a partner's agent reads.

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

## The pattern across both

Both were **schema reachability**. Both were **self-inflicted by an improvement**.
Both were invisible to the checks that existed, for different reasons. Neither was a
surprise about Postgres — both are documented failure modes.

That argues for gates in the deploy path and a fast smoke, **not for more care**.
Care is what both of these already had.
