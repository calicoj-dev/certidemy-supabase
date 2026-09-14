# HANDOFF v12.2 — addendum to v12.0

**2026-09-14, the hardening pass.** Migrations 317 through 321, the search
rewrite, contract versioning, telemetry, and three defects that each looked like
something else on the way in.

**THE THROUGH-LINE: EVERY DEFECT HERE PASSED A CHECK BEFORE IT WAS FOUND.** Not
one was caught by a gate. Each was caught by someone reading output and noticing
that a number was implausible, or by a deploy failing loudly enough to be
unignorable. The gates were green throughout.

They share a mechanism, and it is worth stating before the list: **almost every
check in this repository reads configuration rather than exercises behaviour.**
A privilege check and a working write are different claims. A CHECK constraint
permitting a value and something actually storing it are different claims. A
smoke assertion returning rows and returning the RIGHT rows are different claims.
317 asserted six things about grants and owners, all correctly, and shipped two
defects; 319 and 321 fixed that by performing the write and proving the
classification rather than describing them.

---

## 1. What shipped

**Search v2.** `search_blueprint` ordered by `kind, key` and truncated, and
`'concept'` sorts before `'task'` — so a broad query returned twenty concepts and
**zero tasks**, from the tool whose stated job is what a credential examines.
Replaced with relevance scoring, a published per-kind floor, per-kind totals, and
a deterministic tie-break that is now part of the contract.

**Contract versioning**, per tool, before any partner depends on a shape.
`contractVersion` in `structuredContent`, an optional `contract_version` pin,
advertised in `tools/list`, and an unsupported version **refused rather than
substituted**. `verify_credential` is deliberately excluded — its contract is
shared with the browser WebMCP surface and declares
`additionalProperties: false`, so its free moment has passed, which is the
argument for doing it now for the other four.

**Telemetry (317, 319, 320, 321).** `public.mcp_requests`, written through a
`SECURITY DEFINER` function owned by a write-only role, so `mcp_reader` gains
EXECUTE on one function and INSERT on nothing. Search queries stored verbatim
minus an email-only redaction; the IP only as a monthly-rotating HMAC; 90-day
retention by `pg_cron`.

**318 is written and has NOT run** — see section 5. It pins `search_path` on the
two authorization predicates that 45 RLS policies across 42 tables depend on,
with a before/after behaviour probe that aborts the transaction on any changed
answer.

**`MCP-COURSEWARE.md` §6** records `courseware-read` as deliberately public with
no stability promise.

---

## 2. The three that looked like something else

### 2.1 A query that succeeded and returned 500

`count(*) over (partition by kind)` returns `bigint`, deno-postgres maps it to a
JS `BigInt`, and `JSON.stringify` throws. **The log showed `rows:86, ms:75` with
both corpora searched — and the caller got `500 read failed`.** The failure was
entirely in serialising a correct result, so every instinct that reached for the
SQL was aimed at the wrong half. Smoke was 22/22 an hour earlier.

Fixed with `::int` at the source. Audited rather than spot-fixed: **no column in
any of the four views is `bigint`** — every integer is `smallint` or `integer` —
so the only producers were the two window functions v2 introduced. `row_number()`
was safe purely by omission and is cast anyway.

### 2.2 An assertion that could not ask its own question

317 added `has_table_privilege(current_user, 'public.mcp_requests', 'INSERT')` to
the cold-start check. **Resolving a schema-qualified name requires USAGE on that
schema before any privilege is reported** — `LookupExplicitNamespace` raises
42501 — and `mcp_reader` has no USAGE on `public`, by design. So the check
raised, and the function refused to serve **on a property that was in fact
true**.

The same error from the same ACL check had already cost 317 two attempts as DDL.
Filing it as "migrations need schema grants" rather than "qualified names need
USAGE to resolve at all" is why it recurred.

Now by OID, which performs no name resolution — and asserts more than before:
not "cannot insert into the log table" but **"cannot insert anywhere."**

### 2.3 A fallback that produced legible, wrong rows

`args?.resource ?? 'log'`. On a rejection `validateArgs` has thrown, so `args` is
null and **every rejection was filed under a resource a caller may genuinely have
asked for.** Seven deliberate vocabulary-pin refusals read as seven failed log
calls.

**A default that names a real category is indistinguishable from the truth**,
which is worse than illegible: the row answered a question nobody asked while
looking like an answer to one they did.

321 then found the second half — the replacement classified on **validity** when
the question is **outcome**, so a 400 with a valid resource name kept it and
`count(*) where resource='task'` counted five failures. `resource` is now what
was *served*, `requested_resource` what was *asked*, and `400`/`5xx` are
**separate labels** rather than one, because collapsing them would repeat in the
table the exact mistake fixed that morning in the Worker.

---

## 3. What was true and shouldn't have been

**`mcp_reader` can make arbitrary outbound HTTP requests from the database.**
`pg_net` grants ALL on `net.http_request_queue` and `net._http_response` to
PUBLIC, and USAGE on schema `net` to PUBLIC, so every role on this database
qualifies — 12 `net` functions callable.

**The property asserted in 317 was never true**, and the runtime assertion was
right to refuse. It is the only check in this document that caught something by
firing.

**Not fixed, deliberately.** `pg_net` is load-bearing: `dispatch-webhooks` and
`dispatch-emails` both call `net.http_post` every minute. Revoking PUBLIC means
granting it explicitly to whatever role those run as, and getting it wrong stops
outbound email and partner webhooks. The assertion excludes schema `net` **by
name** — a recorded exception, not a loosened check: a write grant appearing in
`public`, `mcp`, or a schema that does not exist yet still refuses to serve.

**Open.** It needs its own migration and its own investigation.

---

## 4. Two more, recorded because the reason generalises

**The Worker collapsed three outcomes into one.** A non-ok response threw a bare
Error and the catch discarded it, so 400, 500 and an unreachable host all arrived
as *"the curriculum service could not be reached"* — which sends the reader to
hosts, secrets and deploys. **It did exactly that twice.** Now a typed error
carries the status, the catch classifies three ways, and the status is logged
regardless. **The comment describing this failure sat directly above the code
committing it.**

**`db.<ref>.supabase.co` is AAAA-only.** No A record at all. The edge runtime
reaches it; a workstation without working IPv6 cannot, and the failure is a
connect timeout that reads as the database being down. The shared pooler
`aws-0-<region>.pooler.supabase.com` has A records in every region and is the
IPv4 path to the same database.

---

## 5. Where things stand

- **317, 319, 320, 321 have run.** Telemetry is landing, and the first refusal
  row — `log / get_syllabus / ISMS-F / 200` — is recorded.
- **318 is written and has not run.**
- `smoke-courseware` is 22/22 plus the refusal-shape check; the Worker suites are
  87 / 25 / 21 / 14.
- **The Worker is not deployed.** The registry, the four contracts, versioning
  and the three-way outcome split are committed in `certidemy-web` and have not
  shipped.
- **Check `git status -sb` in both repos before trusting the remote.** GitHub was
  unreachable from this machine for part of this session, and the unpushed count
  moved from 107 to 0 to 3 while this document was being written.

---

## 6. Open, in the order I would take them

1. **Rate limiting and caching on `courseware-read`.** Unauthenticated,
   unindexed leading-wildcard scans, connection pool of 2, no cache. It must go
   on the function, not the Worker, because §6 of `MCP-COURSEWARE.md` records
   that the direct path is deliberately public.
2. **`pg_net` and PUBLIC.** Section 3.
3. **`anon` holds CREATE on schema `public`** — a Supabase platform default, not
   granted by any migration here. Inert while `anon` is NOLOGIN and PostgREST
   issues no DDL, and it is what would supply a shadowing object if that ever
   changed.
4. **318**, when you are ready to touch authorization.
5. **The lesson token flow**, scoped in §3 of `MCP-COURSEWARE.md`: one scope on
   `issuer_api_keys`, a second pool as `mcp_holder`, and no branch in the reader
   path.

---

## 7. Claims of mine that were wrong

1. **"The seven 400 rows are the log resource failing."** They were the smoke
   test's own vocabulary pin, and the reason was in the `error` column the whole
   time. I accepted the framing before looking.
2. **The port was derivable from the host.** It is not: a dedicated pooler and a
   direct connection share a hostname and a username form and differ only by
   port.
3. **"The repro script is structurally un-runnable here."** It is runnable — the
   shared pooler is IPv4 — which I only established by checking seven regions
   rather than reasoning.
4. **A probe that could not observe the change it tested.** 318's first version
   sampled through plpgsql's plan cache, so pass 2 could have reported pass 1's
   answer and the comparison would have passed unconditionally. Caught while
   reasoning about what else differed between the passes, not by running it.
5. **A negative test that proved nothing**, twice: `loadKey` against a directory
   whose parent was the one being tested, and a duplicated assertion in 320 that
   checked the same condition twice under two names.

The pattern in 1, 2 and 3 is the same as v12.0's: **a confident statement about
something I had not re-read or re-measured.** The pattern in 4 and 5 is newer and
worse — **a check that cannot fail**, which is the exact thing this document says
the whole session was about.
