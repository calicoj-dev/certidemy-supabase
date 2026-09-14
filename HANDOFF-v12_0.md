# HANDOFF v12.0

**2026-09-12 to 2026-09-14.** 74 commits in `supabase/`, 7 in `certidemy-web/`,
migrations 303-311 and 313-316.

It started with a badge that was not showing and ended with a courseware MCP
serving a partner agent, with the paywall enforced as a grant that was never
written. The middle is the part worth reading: the badge was a symptom of a
routing gap, the routing gap had left two live banks ungrounded, reading those
two banks forced a question about how much ISO text the corpus actually
reproduces, and answering that question produced the IP position the MCP now
rests on.

**Nothing here is a plan. Everything described as shipped has run and been
verified, and the things that are still beliefs are marked as beliefs.**

---

## 1. What shipped

**Item grounding.** `groundingFor` decided ROLE before STANDARD, so ISMS-F and
AIMS-F routed to `NEUTRAL` - 524 characters naming no standard and forbidding
nothing. Every certification now resolves to a grounding that names its standard
and its forbidden claims, and the standard is decided first so a future Lead
Implementer cannot fall through. **This retires the "must be read" category
going forward**; the two banks that were already generated under it are the two
that had to be read by hand.

**Those two banks, read.** 13 defects fixed across migrations 303-308. The
decision rule that came out of it is in CLAUDE.md and is the durable output:
*built with a never-assert list, sweep it; built without one, read it.*

**Translation review became a record rather than a habit.** Migration 311 created
`item_translation_reviews` - a table, append-only, keyed on a hash of what a
reviewer actually read. 313 made that hash canonical over the item's text rather
than its JSON serialisation, which would have reported all 30 approvals stale.
`i18n.reviewed` in verify-cert reports UNREVIEWED and STALE **separately**,
because "nobody read this" and "a human approved something that no longer exists"
are different states.

**Citations became checkable.** `verify-citations.mjs` resolves every clause and
annex reference against the three ISO PDFs on disk, wired into verify-cert as
`items.citations`. It checks EXISTENCE, never MEANING, and says so.

**The quotation audit and `IP-POSITION.md`.** 5,041 contiguous runs of five words
or more across 437 documents, measured against ISO 19011:2026, 27001:2022 and
42001:2023. **Nothing unattributed.** The threshold has no elbow, which is itself
the finding. The document is written to be read by a partner's lawyer and is
honest about what it cannot establish: contiguous matching cannot see paraphrase,
the audit is English-only, and three standards is not the family.

**`match_terms` stays empty, as a decision.** `MATCH-TERMS-DECISION.md`. The
proposer can only offer terms sharing a token with the concept name, so the
useful synonyms are structurally unreachable, and our own prose does not ground
them - AISM-I's 61 lesson bodies define exactly one acronym. A curated list is
groundable if each term carries its authority the way
`drift_rules.authority_citation_id` does; **the blocker is licence and effort,
not principle.**

**The analyzer's evidence became readable.** The excerpt was centred on the match,
so every one opened with ~145 characters of whatever preceded it. Migration 314
carries the matched span to the partner - two nullable int columns, one named
writer, a CHECK asserting both directions.

**The MCP pilot.** Migrations 315 and 316, `config.toml`, `courseware-read`, a
tool registry, four tools, and a smoke test. Section 2.

---

## 2. The boundary, and why it is structural

```
mcp_reader  ->  mcp.certification, mcp.task, mcp.concept
mcp_holder  ->  those three AND mcp.lesson
```

**"No token, no lesson body" is the grant that was never written.** Not a branch
in the route. An `if` can be inverted by a refactor; a missing grant fails closed
in the database.

Three things hold it up, and the second is the one that was nearly missed.

**One: definer views with `security_barrier`.** The view body is the policy, so
neither role needs a privilege on any base table. The consequence is stated in
315's header rather than discovered later: a definer view BYPASSES RLS, so
nothing here may lean on a row policy.

**Two: schema USAGE revoked BY NAME.** 315's boundary rested on table-level
grants - correct, and *configured* rather than *structural*, which is the
property it claimed to have and did not. It was one `CREATE TABLE` away from
leaking. 316 moved it to the choke point:

```sql
revoke usage on schema mcp from anon, authenticated;
```

**By name, not via PUBLIC.** 315 revoked from `PUBLIC`, which does not remove a
privilege granted *directly* to a role - and exposing a schema through a
dashboard is exactly the sort of action that grants directly. Schema usage is a
single gate covering every table that will ever exist there, including ones a
future migration forgets.

**Three: a runtime identity assertion that refuses to serve.** Once per cold
start, `courseware-read` asserts `current_user` and `session_user` are both
`mcp_reader` **and** that the connection CANNOT select `mcp.lesson`. Both halves.
The positive half alone would pass for a superuser impersonating nothing; the
negative half is the paywall, and it is the one that can contradict the
deployment.

**Measured 2026-09-14 against `pg_catalog`**, not inferred:

| role | schema USAGE | certification | task | concept | lesson |
|---|---|---|---|---|---|
| `service_role` | **false** | false | false | false | **false** |
| `anon` | false | false | false | false | false |
| `authenticated` | false | false | false | false | false |
| `authenticator` | **true** | false | false | false | false |
| `mcp_reader` | true | true | true | true | **false** |
| `mcp_holder` | true | true | true | true | **true** |

Two rows carry the design rather than merely passing. **`authenticator` has USAGE
and no SELECT**: it can see the views exist, which is what PostgREST needs to
serve them, and cannot read a row. **`service_role` has nothing**, which means an
edge function reaching for the convenient credential cannot read these views at
all - there is no quiet path back to the thing `MCP-COURSEWARE.md` section 2
forbids.

**The credential decision reversed once, and the record shows why.** The first
plan had an edge function mint a role JWT from `SUPABASE_JWT_SECRET`, with the
residual named and accepted: such a function can mint `service_role`. Then the
JWKS endpoint was read - the project signs ES256, and the legacy HS256 secret is
the PREVIOUS key, verifying and not signing. The JWT path was not merely worse,
it was dead. The `LOGIN` fallback grants exactly `mcp_reader` and cannot
escalate, so it is **better on the very trade that had been accepted**. Nothing
about the original reasoning was wrong; its premise was.

---

## 3. Four things this rests on that were nearly wrong

### 3.1 The vocabulary mismatch, and the repo boundary in the middle

`certidemy-web/lib/mcp/registry.ts` sent one wire vocabulary and
`functions/courseware-read` accepted a different one: `resource: "syllabus"`
against `certification | task | concept | search`, plus `code` for `task_code`,
`domain` for `domain_code`, and a `certification` field the function does not
take. **All four tools would have 400'd on every call.**

**It would not have looked like a mismatch.** The Worker maps any non-ok response
to `UPSTREAM_UNREACHABLE`, so an agent would have been told *"The curriculum
service could not be reached"* - a contract error wearing a network fault, which
sends the next person to check secrets, hosts and deploy logs.

**Neither half's tests could see it.** The Worker's 47 contract cases assert the
Worker against itself; the function validates its own input. Both green. It was
caught by putting the two vocabularies side by side and reading them.

**Third mirrored-pair failure in one session, and the first with a repository
boundary between the halves** - which is the variant nothing can test, because
the halves cannot share a module:

1. a contract and its checker (`pin-compliance` vs `ISO_MS_VOCABULARY`)
2. a rule and the path that must obey it (the tier contract vs
   `generate-practice-questions`)
3. a wire format and its caller, across two repos

**The cheap half of the fix is to make ONE side immovable.**
`smoke-courseware.mjs` section C pins the function by asserting it REFUSES the
wrong shapes, so a future mismatch can only originate in the Worker. **That
halves the surface and does not close it**, and the script says so in its own
header.

### 3.2 A guess dressed as a derivation

`courseware-read` derived the port as `IS_POOLER ? 6543 : 5432`, encoding "a
`db.<ref>` host means a direct connection". This project runs a **dedicated
pooler** on `db.<ref>.supabase.co:6543` - the same hostname as a direct
connection, the same bare username, a different port.

| shape | host | user | port |
|---|---|---|---|
| shared pooler | `aws-0-<region>.pooler.supabase.com` | `mcp_reader.<ref>` | 6543 / 5432 |
| dedicated pooler | `db.<ref>.supabase.co` | `mcp_reader` | 6543 |
| direct | `db.<ref>.supabase.co` | `mcp_reader` | 5432 |

**The host settles the username form and cannot settle the port.** Only the
shared pooler qualifies the role with the ref, because only it multiplexes
projects behind one hostname. A dedicated pooler and a direct connection are
identical in host and username and differ only by port, so no string inspection
separates them.

**The shared/dedicated distinction is invisible in a connection string except by
the ABSENCE of the ref in the username** - negative evidence, which is what the
next reader reconstructs wrongly. The table is now in the file. The default is
6543 everywhere, and the cold-start log reports `shape`, `port` and
`port_explicit` so a wrong belief is one readable line rather than a connect
timeout.

### 3.3 The IPv6 misattribution, which cost the most

Node 24's `fetch` and the Supabase CLI both fail against hosts that resolve
**AAAA first** on a machine with no working IPv6 path. It presents as a
`ConnectTimeoutError` after 10s, which reads as the remote being down - and
`curl` to the same host succeeds, which makes the host look fine and the script
look broken.

```
node --dns-result-order=ipv4first scripts/<whatever>.mjs
```

**Nothing about any deployment changes.** It is local resolution order only.

**The cost was not the lost time.** `mcp.supabase.com` was unreachable for two
days and was recorded as "the MCP host is down", so several questions that wanted
a `pg_catalog` answer were answered from the migration record instead and marked
as inferences. **Those inferences were correct and their stated reason was
wrong**, which is the more dangerous of the two to leave in a document: a reader
checking the claim finds it true and never learns the instrument was avoidable.
`service_role` against schema `mcp` was one of them, and is now measured.

### 3.4 A test that failed while the system was right

The smoke test asserted `typeof passing_score_pct === "number"` and failed on a
healthy deployment. Postgres `numeric` does not survive as a JSON number - the
deno-postgres driver returns it as a string to preserve precision, so `"80.00"`.
PostgREST converts it and the driver does not.

**That is the worst way for a smoke test to fail**, because the obvious repair is
to change the thing being measured. The assertion now states the property - a
number or a canonical numeric string - and the numeric columns are enumerated per
resource so a column that stops being returned fails rather than being skipped.
**Measured: exactly two arrive as strings**, `passing_score_pct` and
`domain_weight_pct`, the two `numeric` ones. Sections C and D would have stayed
green through any of it, because neither looks at a value.

---

## 4. Where things stand

`node scripts/smoke-courseware.mjs` - **20 pass, 0 fail**, against the deployed
function. All four tools return real data, es-419 routes and its thin result is
reported rather than absorbed, every wrong vocabulary shape is refused, and
`count: 0` with a 200 is reported rather than disguised.

**The route is not deployed.** The registry, the four tool contracts and the
rewritten `SERVER_INSTRUCTIONS` are committed in `certidemy-web` and nothing has
shipped to the Worker.

---

## 5. Open, and deliberately so

- **The 16 unmarked lesson passages.** Attributed, not visually set off. Marking
  them is presentation, not correction, and several cross a sentence boundary
  mid-line and would need mirroring into two languages nobody can re-read.
- **The four Amendment 1:2024 items**, awaiting the amended text. Flagged and
  untouched: the repo must not confirm its own claim.
- **AIE-I is still writing ungrouped items.** 120 as of 2026-09-12, growing, in
  the practice pool only. The writer has not been identified.
- **`CERTIDEMY-LEARNER-IA.md` section 5.5** - AI drafts landing
  `status='pending_review'` before being served. The cheap half was done
  (`validateQuestion` reads the tier); the real half is still open.
- **The Scrum Guide licence is unverified.**
- **`analyze-local.mjs` is dead** since 3110eec removed its manifest. The
  analyzer has had no local test path since 2026-09-01, and restoring it
  conflicts with the vendor-scrub policy - three resolutions and their costs are
  in the script header, including the one to refuse.
- **AIE-I's scheme claim** - validity 730 against 365 in the database. Fails on
  every run, deliberately, until someone decides.

---

## 6. Claims of mine that were wrong

Recorded because a reader deciding how much weight to give this document should
know how its author behaved.

1. **"I have not written the edge function."** I had, and had committed it. The
   correction was issued confidently and was false.
2. **"Use the shared pooler host."** Wrong shape for this project entirely.
3. **The port derivation**, above - stated as though the host determined it.
4. **The wire vocabulary** - I wrote both halves, in two repos, and they
   disagreed on every resource.
5. **"The MCP host is down"**, for two days. It was local DNS resolution order.
6. **A negative test that proved nothing.** `loadKey` was checked against
   `scripts/nonexistent-dir`, whose parent IS `scripts/` - so finding the key
   there was correct behaviour and my test asserted the opposite.
7. **A diagnostic that inflated itself by the join fan-out**, reporting AISM-I as
   546 labels from 61 lessons when the true figure is 144. Caught because the
   ratio was implausible, which is the only reason.

The pattern across 1, 3 and 4 is the same: **a confident statement about
something I had not re-read.** The pattern across 5 and 6 is that an instrument
was believed over the thing it was measuring.
