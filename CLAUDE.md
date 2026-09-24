# Certidemy — supabase

Postgres migrations and Deno edge functions for Certidemy, an ISO/IEC
17024-aligned certification platform issuing Open Badges 3.0 credentials.

**This folder is literally named `supabase/`.** Commit edge functions from
inside it using paths like `functions/get-company-detail/index.ts`. **Deploy from
the PARENT directory** (`../`) with `supabase functions deploy <name>` — the CLI
expects to find `supabase/` beneath the working directory.

Project ref: `pctynukndxnmnxiqpgck`. The sibling repo is `../certidemy-web`.

---

## Migrations

**THERE IS NO MIGRATION TIP IN THIS FILE ANY MORE. Run the probe.**

```
node --dns-result-order=ipv4first scripts/check-migration-state.mjs
```

It prints the next free number from the FOLDER and, for every migration
carrying a fingerprint, whether it has RUN -- read from the database and from
the deployed function, because the `mcp` schema is not reachable through
PostgREST. Add a fingerprint in the same commit as a new migration; one without
a fingerprint reports "no probe" rather than "not run", because silence about a
thing is not a claim about it.

**WHY THE NUMBER WAS REMOVED RATHER THAN CORRECTED AGAIN.** This line was wrong
EIGHT times on 2026-09-17 alone, and the number was almost never the wrong half
-- the STATUS was. *"336 is written and has not run"* while 336 had run.
*"339 and 340 are written and have not run"* while both had, reported by an
assistant that had itself written the rule about checking `pg_catalog` instead
of a note.

A sentence here is a SECOND COPY of a fact that lives in the database, and a
second copy goes stale by default. The folder was never the problem: `ls
migrations/` has always answered "what number is free" correctly, because the
folder IS that fact. Nothing answered "has it run", so somebody wrote it down,
and writing it down is the defect.

The history below is kept because it is the record of that failure, and every
superseded line in it is marked. **None of them is a live instruction.**

---

**AND A MIGRATION IS NOT A SCHEMA. IT IS AN INTENTION, DATED.** The probe above
answers *has it run*. This answers a different question that fails the same way:
**what does the database currently look like** -- and reading that off migration
files is the identical defect with a longer fuse.

Paid for 2026-09-18. An inventory of the scope vocabulary was assembled by
reading migrations 322, 329 and 331, and named three enforcing objects. Migration
347 was written against all three and **aborted**:

```
column "mcp_scopes" of relation "issuers" does not exist
```

331 had retired that column when grant-by-default replaced it, recording the
reason -- *"a column that must stay empty to be correct is a trap for whoever
sets it next"* -- and Postgres dropped `issuers_mcp_scopes_vocab` with it,
because a CHECK does not outlive the column it depends on. **Migration 329 still
describes the constraint perfectly. It was true when written and had been false
for weeks.**

`pg_catalog` answers in one query and disagreed immediately: no matching
`pg_constraint` row, no matching `pg_attribute` row, and `mcp.resolve_oauth_caller`
in `pg_proc` referencing the feature tables and mentioning `mcp_scopes` nowhere.
**The inventory was two, not three**, which is also the better answer -- one
entitlement vocabulary covering both the API-key and the OAuth routes.

So: **never describe the current schema from the migration folder.** A migration
says what someone meant to do on a day. Ask `pg_catalog` what is there:

```sql
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.<t>'::regclass;
select attname, format_type(atttypid, atttypmod) from pg_attribute
 where attrelid = 'public.<t>'::regclass and attnum > 0 and not attisdropped;
select proname, prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'mcp';
```

**The mechanism, not the rule** -- 347 now ASSERTS its own inventory as a
pre-condition: it refuses to run if `issuers.mcp_scopes` ever exists again,
because that would mean a third vocabulary it does not widen. A file that
describes the schema should fail when the schema moves under it, rather than
being read once and believed.

**THE DISK IS AUTHORITATIVE, NOT THIS LINE.** Check before you claim a number:

```
ls migrations/ | tail -1
```

This tip was written by hand in **four** documents — here, and the header of
each of the three v8.8 addenda — and on 2026-08-30 all four still said *"next
free: 262"* while `261`, `262` and `263` existed. It goes stale the moment a
session that did not write it applies a migration, which is the normal case with
two sessions: whoever applies is not whoever last edited the tip.

**A FOURTH TIME ON 2026-09-11, AND THIS ONE WAS SELF-INFLICTED.** The line read
*"290 / next free 291"* while `291` was on disk — **written correct by the session
that created 290, and left stale by the same session when it created 291 an hour
later.** The three before it were one session failing to update what another had
written. This was one session failing to update what IT had written, in the same
sitting. **The mechanism does not need two people.**

**AND A THIRD TIME ON 2026-09-10.** The line read *"285 / next free 286"* while `286`,
`287`, `288` and `289` were all on disk — **four migrations behind, the largest gap
yet.** Same mechanism, same outcome: caught because `ls migrations/` was run before
`290` was claimed. **Three recorded instances now, and the tip has never once been
correct when a later session needed it.** Treat the line as the date of the last edit,
never as the number.

**It happened on 2026-09-09, to this paragraph, in the way this paragraph
describes.** The line read *"282 / next free 283"* while `283` and `284` were
both on disk — applied by sessions that ran the SQL and did not come back to
edit the tip. Nothing was lost, because a third session checked `ls migrations/`
before claiming `285` rather than trusting the line four lines above the
instruction to check it. **That is the only reason this is a note and not a
collision**, and it is the second recorded instance of the same mechanism.

The cost is not a wrong number in a document. **It is two sessions independently
reaching for the same next-free number and both being right**, which happened
with 264 — one session drafted a `SECURITY DEFINER` check for the deployment
timestamp pair, another proposed an unrelated identity migration, same number,
neither aware. A filename collision is cheap to fix and expensive to notice,
because both files look correct in isolation.

**The base schema is not in this repo, and migration replay from zero has
never worked.** `profiles`, `certifications`, `user_progress`, `vouchers` and the
rest are referenced by the earliest migrations and created by none of them — this
repo begins partway through. Replay also fails at `002_rag_and_chat.sql:72`,
which creates a trigger on `set_updated_at()`, a function no migration defined
until 246. Treat these files as a numbered record of what ran, never as a
buildable sequence. Migration 246 records nine triggers and two functions that
existed only in the live database; it is a record, not a fix, and it does not
make `supabase db reset` succeed.

**Editor-first.** SQL is run in the Supabase SQL editor in the browser first.
Only once it works does it get committed as a numbered file. The file is a
record of what already ran, not a script anyone executes.

**ASCII only** (CERT-SCHEMA-GUIDE §8). No accented characters, no em dashes, no
smart quotes. The SQL editor corrupts multibyte characters on paste, so anything
with accents goes through an API-based loader script instead.

**One statement at a time** when handing SQL to a human — each block
independently copyable.

**Keep single-quoted strings inside a plpgsql body SHORT.** A long one does not
survive the path from terminal scrollback to the SQL editor: the terminal wraps
mid-string, the paste arrives truncated, and the result is an unterminated
literal and a `42601`. This is the same class as the mojibake rule — the
transport corrupts the text, not the author — and it is worse, because a
mangled `raise exception` message can also paste *cleanly* and just be wrong.
Migration 249's guard messages were shortened for exactly this reason. Split a
long sentence across `message` / `detail` / `hint`, which reads better anyway.

**When the human edits the SQL before running it, the file records THEIR
version.** Read the body back from `pg_proc.prosrc` and md5 it (CRs stripped,
as 244, 245 and 249 do) rather than committing the draft that was handed over.
A migration file that does not match the live function is worse than no file:
it is a record that lies, and the next person edits from it.

`cron.schedule` is NOT transactional. Keep it outside the `begin/commit` block,
commented, to be run separately after the function it points at is deployed.

**A migration that adds a NOT NULL column MUST NAME EVERY WRITER OF THAT
TABLE.** Backfilling the existing rows proves nothing about the code: a
constraint added today does not fail the writers that predate it until one of
them next runs, and if that path is rare, the break is silent for as long as
nobody exercises it.

This has now happened twice on the same insert. The Open Badges 3.0 migration
added `credentials.issuer_id` and `subject_salt` NOT NULL; `score-mock-exam` did
not write them and raised `23502` on every pass. The fix landed with a comment
saying exactly what had gone wrong — *"Adding a column to a table does not fail
the writers that predate it until one of them runs."* **Migration 231 then did
it again, two columns later, in the same insert**, adding
`credentials.achievement_id` NOT NULL on 2026-08-19. It backfilled every
existing row and named no writer. Both mints omitted the column. It went
unnoticed for six days, across nine live AIGRM-I seats, purely because nobody
happened to pass an exam in that window.

Note the error was **not** `23502`. `trg_guard_credential_issuer` is BEFORE
INSERT and fires ahead of the constraint, so a null `achievement_id` surfaced as
`achievement <NULL> not found` (P0001). **When a table has BEFORE INSERT
triggers, the NOT NULL you added is not necessarily the error you will see** —
searching the logs for the constraint code finds nothing.

So, in the migration's own header, before the `alter ... set not null`:

1. `grep -rn 'from("<table>")' functions/ scripts/` in BOTH repos and list every
   insert site by path.
2. State, per site, whether it writes the new column or why it does not need to.
3. Name the rare path — the one nothing exercises on deploy day. That is the one
   that breaks in production weeks later, in front of a real candidate.

A backfill covers the rows that exist. Only the writer list covers the rows that
do not exist yet.

---

## Database rules that were paid for

**A DROPPED READ MUST NOT BECOME AN ANSWER**, and the audit of where that could
still happen is `READ-FAILURE-AUDIT.md`. A Supabase read whose error is
discarded turns a broken query into a legitimate-looking empty result:
`count ?? 0` on an errored read reports **zero leaked links**, which is the
answer that passes. Three instances surfaced on 2026-09-11 - the silent
`42501` below, a check that skipped instead of failing, and one dropped page
that reported three confident failures against a healthy 2,160-item bank.

**Sections 4 and 5 of that document are the expensive half: sites that LOOK
wrong and are not**, with the backstop named per site and confirmed against
`pg_index`. Read them before "fixing" a pre-check that a unique index already
guarantees, or an authorisation read that is failing closed on purpose.

**RLS is not a grant.** The table-level grant is checked BEFORE row-level
security. A table with RLS enabled and no grant is closed; a table with a grant
and no policies is open. A missing grant produces a silent `42501` that
failure-tolerant loaders swallow.

**Column-scoped `GRANT SELECT` must list columns explicitly.** A table-wide
`GRANT SELECT` silently overrides a column-level `REVOKE`.

**`security_invoker` is stored as `on`, not `true`.**

**PostgREST types to-one embeds as ARRAYS** unless FK uniqueness is provable —
use the `firstOf()` normaliser. Browser clients get arrays; service-role clients
get objects.

**TRANSLATION TABLES USE TWO NAMING CONVENTIONS, AND A PROBE FOR ONE PROVES
NOTHING ABOUT THE OTHER.**

| table | key column |
|---|---|
| `module_translations`, `domain_translations`, `task_translations` | `language` |
| `certification_i18n`, `cert_categories_i18n` | **`lang`** |

Both the name and the key column differ. Found 2026-09-17, measuring three
English surfaces a Spanish demo had surfaced.

**The cost of guessing one convention is a report that inverts the answer.**
`certification_translations` returns a PostgREST 404, and that was one step from
*"certifications have no translation table"* -- which would have costed a
translation pass for **text already written, complete, in three languages** and
already rendered by the public site. The actual defect was the opposite shape:
the copy existed and `mcp.certification` had no language dimension to serve it
through, so the resource answered `400 unknown field 'language'` rather than
English-in-preference-to-Spanish. **A missing probe and a missing column produce
the same symptom and need opposite fixes.**

Same day, the same shape twice more: an artifact enumeration reported absent
because three candidate sources were checked and the fourth (a refusal body)
was not, and 35 review hashes reported stale because an 8-character stored
prefix was compared to a full md5 with `===`. **All three are one rule: AN
EMPTY RESULT IS A FACT ABOUT THE PROBE UNTIL SOMETHING PROVES THE PROBE COULD
HAVE FOUND IT.** Same family as the green-result rule below -- a probe that
cannot match is indistinguishable from a thing that does not exist.

So before reporting that a translation surface is absent: probe **both**
conventions, and check the key column is the one you filtered on. `concepts`
genuinely has neither (`concept_translations` and `concept_i18n` both absent,
checked), which is why `mcp.concept` is English-only and why 1,730 concepts is a
project rather than a pass.

**A concatenated PostgREST select string collapses the row type to
`GenericStringError`.** Keep every select as a single unbroken literal.

---

## Edge functions

**`verify_jwt` must be pinned in `config.toml` for every public function.** This
is a recurring defect class: a plain redeploy drops a `--no-verify-jwt` flag and
silently re-privatizes a public endpoint. It has happened to
`get-credential-certificate`, `open-badge`, `verify-credential` and
`credential-og`. The flag belongs to one command; the pin belongs to the repo.

**`config.toml` IS APPLIED FOR `[functions.*]` AND FOR NOTHING ELSE.** The
`verify_jwt` pins above are real -- `supabase functions deploy` writes them. The
`[auth]` block was the stock CLI template and had never described the live
project; it was **reconciled 2026-09-15** against a Management API read
(`GET /v1/projects/{ref}/config/auth`). Of 55 settings, 35 agreed, 10 were
corrected, and 10 are marked `UNVERIFIABLE` inline because the API does not cover
them.

**RECONCILED IS NOT SAFE TO PUSH, and that distinction is the rule.**
`supabase config push` has no dry run -- one subcommand, writes immediately, all
of it, including the ten nothing has ever verified and the `[db]`, `[storage]`,
`[realtime]` and `[analytics]` blocks the reconciliation did not touch. **Change
auth settings in the DASHBOARD, one at a time, then re-read and update the file.**

**THREE MANAGEMENT API FIELDS ARE POLARITY-INVERTED** against the keys here:
`disable_signup`, `mailer_autoconfirm`, `sms_autoconfirm`. Reading them
positionally records divergences backwards **as matches** -- it would have done so
for two of the ten. Map, never assume, and mark what the API does not cover as
unverifiable rather than confirmed.

The reconciliation found two things nobody knew, both of which a push would have
changed silently: **MFA TOTP is live** while the file said off, and **email
confirmation is live** while the file said off -- the second lets anyone sign up
as an address they do not own, which is a security change wearing a config diff.
`config.toml` carries all of this in its own first lines, because a hazard
recorded only in markdown is not in front of the person typing the command.
Full mapping: `MCP-AUTH-OPTIONS.md` §5.

Type check with:

```
deno check --node-modules-dir=auto functions/<name>/index.ts
```

Expect two pre-existing fontkit/QRCode import errors in anything importing
`_shared/certificate.ts`. Anything else is new.

**WebCrypto typing trap:** a helper annotated `: Uint8Array` widens the buffer to
`ArrayBufferLike` and `crypto.subtle.importKey` rejects it (TS2769). Annotate
`Uint8Array<ArrayBuffer>` on any helper returning bytes for WebCrypto.

**A validation never tested against the input it wrongly rejects looks correct
forever.** `create-lti-platform` required `iss` to be an absolute https URL for
weeks. An LTI issuer is an IDENTIFIER — compared for equality, never fetched —
and the 1EdTech reference implementation sends the bare string `certidemy`. The
rule refused a specification-conformant issuer, and `type="url"` on the console
input refused it a second time in the browser.

Nothing caught it because **the one row that disproves the rule got in by
bypassing the rule**: registered through the console with a URL that turned out
to be a wrong guess, then corrected in raw SQL, which validates nothing. Fixed
2026-08-27 in both halves at once. When a shipped validator and a real-world
value disagree, check which one was ever actually exercised.

**A pair inside ONE repo does not have to stay a pair.** `create-lti-platform`
and `update-lti-platform` write the same nine columns, so their rules live in
`functions/_shared/lti-registration.ts` and both import them — there is nothing
to keep in step. Reserve the mirrored-pair discipline for what genuinely spans
two repos.

**THREE INSTANCES NOW, AND THERE IS FINALLY A MECHANICAL CHECK.**
`scripts/check-cross-repo-vocabulary.mjs` reads BOTH repos' source and compares
the word lists they send each other: auth labels, certifications, log events,
languages, and the telemetry body keys against the field allowlist. Read-only,
no network, no credential.

The three it was built from, all the same shape -- one side emits a set, the
other validates a set, both sides tested against themselves, nothing compared
them:

1. **The wire vocabulary** -- `resource: "syllabus"` against
   `certification|task|concept|search`. All four tools would have 400'd.
2. **The certification list** -- 328 widened the views to eight while
   `CERTIFICATIONS` said four, and the cold-start equality took the curriculum
   surface down.
3. **The auth labels** -- the Worker sends `auth?.kind ?? "unresolved"`, five
   strings; `AUTH_KINDS` was built from the union's four `kind` values and never
   saw the fallback. Every auth refusal with no resolution answered 400, so the
   event added to make refusals visible was silent for the one refusal hardest
   to diagnose without it.

**THE EXTRACTOR IS THE WEAK PART AND IT IS CONTROLLED.** Every comparison asserts
its own extraction was non-empty, because a regex that matches nothing turns the
whole script green -- the failure this file already records against check-mcp's
fragment extractor. There is also a SELF-TEST that feeds the comparator a known
mismatch and fails if it does not fire.

**And it cried wolf once, in its first run, which is worth more than the pass.**
It reported `auth_refusal_telemetry_rejected` as an unaccepted event: that is a
`console.warn` line in the Worker, not a body posted to the function. The
extractor now reads only `event:` inside `body: JSON.stringify(...)` blocks. A
guard that over-reports gets loosened next time, and this one is meant to be
believed once every few months.

**What it cannot do:** it reads SOURCE, not behaviour, so a list assembled at
runtime is invisible; and it cannot see two lists that agree on strings and
disagree on meaning. That is still a human reading both files.

**`contractVersion` SAID WHAT WAS PINNED, NOT WHAT WAS SERVED. FIXED AND
VERIFIED ON THE WIRE 2026-09-22.** Measured before widening `get_concept`, and
it is the most serious defect found in the week -- an outage is visible and
never tells anyone something false; this told a partner who pinned version 1
that they had received version 1.

```
list_lessons contract_version=1  ->  contractVersion=1, and the v3 payload
list_lessons contract_version=2  ->  contractVersion=2, and the v3 payload
list_lessons contract_version=3  ->  contractVersion=3, and the v3 payload
```

No tool in `certidemy-web/lib/mcp/registry.ts` branches on
`request.contractVersion` anywhere. It is validated against `supported`, echoed
into the payload, and never consulted again. **That is worse than having no
versioning**, because the response ASSERTS a version it is not: a partner who
pins 1 to protect themselves is told they received 1.

**The structural reason it cannot simply be fixed by branching:** MCP
advertises ONE `outputSchema` per tool, and these schemas are
`additionalProperties: false`. Two genuinely different shapes cannot both be
legal under one advertised schema, so the only safe evolution is
**additive-with-optional** -- and then `contractVersion` can mean "which fields
you may receive", never "a different shape".

`get_lesson` is the exception and the precedent: `{ current: 2, supported: [2] }`
REFUSES the old pin instead of lying about it. Every other tool accepted it.

**AND THE BUMPS WERE NOT COSMETIC, WHICH IS WHAT MADE IT LIVE RATHER THAN
UNTIDY.** Read out of the history rather than assumed:

| | | |
|---|---|---|
| `list_lessons` v2 -> v3 | `f93a3ab` | added `lessonAccess` to the top-level `required` list -- its own comment says *"a new REQUIRED field in the output"* |
| `list_lessons` | `9289a25` | added `bodyAvailable` to the per-lesson `required` list **with no version bump at all** |
| five tools -> v2 | `54e2a0c` | widened `supported` while changing the shape |

**A REQUIRED FIELD IS A BREAKING CHANGE EVEN THOUGH ADDING A FIELD LOOKS
ADDITIVE**, because the schema is `additionalProperties: false` and the caller
validates against the version they pinned. Not hypothetical -- that is exactly
how a stale client-side copy of these schemas failed this week, and it was
misread as a server defect.

**FIXED.** `supported` now lists only what the server can emit
(`search_blueprint` [2,3]->[3], `get_concept` [1,2]->[2], `get_syllabus`
[1,2]->[2], `explain_task` [1,2]->[2], `list_lessons` [1,2,3]->[3]); a pin to
anything else is refused by name; the seven hand-written copies of the
description sentence are derived from one helper; and a **module-load guard**
refuses any tool listing more than one supported version unless it is declared
in `BRANCHES_ON_CONTRACT_VERSION`, which is empty. Verified on the wire: the
advertised `supportedContractVersions` matches per tool, v1 and v2 are refused
by name, v3 serves.

> **THE SEMANTICS, AND IT IS FORCED RATHER THAN CHOSEN: evolution is
> ADDITIVE-ONLY, and `contractVersion` is the MINIMUM VERSION WHOSE VALIDATOR
> ACCEPTS THE PAYLOAD.** An optional field does not move it; a required field
> does, and retires the version before it. It is written into the tool
> descriptions, not only into a comment, because a partner reads the
> description.

**AND A CHECK CAN PIN A DEFECT.** `certidemy-web/scripts/check-mcp.mjs`
asserted *"es-419 reports tasks only, not concepts"*. That was correct when
written and false the moment the concept translations cleared -- so the check
would have **argued against serving 2,542 rows it was never about**. It is now
asserted in both directions: a language WITH cleared concepts must report them,
one WITHOUT must not and must still answer. Same family as the regression
control that depended on a defect staying in production, and the same fix:
**a check whose subject can legitimately change must say which direction is
the finding.**

**AND THE ONE THAT GENUINELY SPANS TWO REPOS IS THE ONE NOTHING CAN TEST.**
A pair inside one repo is a refactor away from not being a pair. A pair with a
REPOSITORY BOUNDARY between its halves cannot share a module at all, so each
half gets tested against itself and both pass.

`certidemy-web/lib/mcp/registry.ts` sent one wire vocabulary and
`functions/courseware-read` accepted a different one — `resource: "syllabus"`
against `certification | task | concept | search`, plus `code` for `task_code`,
`domain` for `domain_code`, and a `certification` field the function does not
take. **All four courseware tools would have 400'd on every call.**

**It would not have looked like a mismatch.** The Worker maps any non-ok response
to `UPSTREAM_UNREACHABLE`, so an agent would have been told *"The curriculum
service could not be reached"* — a contract error wearing a network fault, which
sends the next person to check secrets, hosts and deploy logs. The same shape as
every silent-success defect in this file: the system returns something plausible
and the wrongness is invisible at the point of failure.

**Neither half's tests could see it, and that is the structural part.** The
Worker's 47 contract cases assert the Worker against itself; the function
validates its own input. Both were green. It was caught by putting the two
vocabularies side by side and reading them — the same move that caught
`AIMS-F`'s worst defects, and the same move nothing automates.

**THIRD INSTANCE IN ONE DAY, 2026-09-13**, and the family is worth naming
because the halves look nothing alike:

1. **A CONTRACT AND ITS CHECKER.** `pin-compliance` gained leak rules that were
   never added to `ISO_MS_VOCABULARY`, so the checker rejected the translator
   for rules it had never been given — 15 straight refusals.
2. **A RULE AND THE PATH THAT MUST OBEY IT.** The tier contract lives in
   `gen-cert-secure.mjs`; `generate-practice-questions` reads no tier at all, so
   a live tier-2 bank was served a two-option item.
3. **A WIRE FORMAT AND ITS CALLER**, above, across a repo boundary.

**The cheap half of the fix is always to make ONE side immovable.**
`scripts/smoke-courseware.mjs` section C pins the function by asserting it
REFUSES the wrong shapes, so a future mismatch can only originate in the Worker.
That does not close the gap — the smoke test cannot see the Worker, and it says
so in its own header — but it halves the surface, and it converts a silent
disagreement into a named failure on the side that can be tested.

**A VIEW THAT CHANGES ITS ROW COUNT HAS A LIVE-DEFECT WINDOW IN BOTH DEPLOY
ORDERS, AND 355 PROVED IT BY WARNING ABOUT ONLY ONE.** Recorded 2026-09-20,
second instance -- 343 did the same thing and the note it left was read as
being about the order it happened to hit.

355 gave `mcp.concept` a language dimension: one row per concept became three.
Its header warned that the function must ship the new field, which is the
FUNCTION-FIRST hazard -- deploy a function selecting `language` before the view
has it and every call 400s. That warning is correct and it is half the problem.

**The half it missed is the one that happened.** The migration ran first, and
the deployed function queried `mcp.concept` with no language filter -- which was
harmless while the view had one row per concept and became a 3x fan-out the
moment it had three. `search_blueprint "incident"` on AISM-I returned 45 concept
rows where 15 exist, each key three times, to whoever called it in that window.

| order | what breaks | how it looks |
|---|---|---|
| view first | the old function's unfiltered reads fan out | **wrong answers, HTTP 200** |
| function first | the new function selects a column that is not there | 400, loud |

**The function-first failure is the safe one.** It is loud, it is total, and
nobody mistakes it for data. The view-first failure returns 200 with plausible
rows and a caller has no way to tell -- the silent-success class this file
opens with.

**So the rule is not an order, it is a shape:**

> **A view change that multiplies rows must be deployed with its readers, not
> before them and not after them** -- and where that is impossible, ship the
> function FIRST and accept a short loud outage over a short silent one.

**AND THE READER LIST IS NOT THE RESOURCE MAP.** 355's readers were enumerated
from the four places that *declared* concepts English-only, and all four were
updated. `courseware-query` reads `mcp.concept` in TWO places -- the `concept`
resource and the `search` union -- and only the first was on any list. The
second sat beside a `mcp.task` read that has always carried `and language = $2`,
which made the omission look like symmetry. **Grep `from mcp.` before changing
any view**; the resource map enumerates resources, not call sites.

**Use `arrayBuffer()`, never `.text()`, in any pass-through proxy.** `.text()`
has corrupted PNG bytes twice.

**`count(*)` AND `row_number()` RETURN BIGINT, AND `JSON.stringify` THROWS ON
BIGINT.** `deno-postgres` maps Postgres `bigint` to a JS `BigInt`, which has no
JSON representation, so an aggregate or window function in an edge-function query
produces `TypeError: Do not know how to serialize a BigInt` at response time.

**The tell is that the QUERY SUCCEEDED.** `courseware-read` logged
`rows:86, ms:75` with both corpora searched, and the caller got
`500 {"error":"read failed"}`. The failure was entirely in serialising a correct
result, so every instinct that reaches for the SQL is aimed at the wrong half.

**Cast at the SOURCE -- `count(*) over (...)::int` -- not in a serialiser.** A
serialiser that special-cases `BigInt` pushes the knowledge into every consumer
and is still wrong the next time someone adds a count.

**No COLUMN can do this**, checked against `information_schema` for the `mcp`
views: every integer there is `smallint` or `integer`. Only the aggregate and
window functions produce bigint, which is why only `search` failed and the other
three resources passed. `row_number()` was safe purely by omission -- it is
filtered on and not selected -- and is now cast anyway, because "safe because
nobody returns it" is one edit away from false.

**`db.<ref>.supabase.co` IS AAAA-ONLY.** No A record at all. The edge runtime
reaches it; a workstation without working IPv6 cannot, and the failure is a
connect timeout that reads as the database being down -- the same misattribution
as the Node `fetch` note above, through a different door. The shared pooler
`aws-0-<region>.pooler.supabase.com` has A records in every region and is the
IPv4 path to the same database. The username form follows the host: the shared
pooler wants `<role>.<ref>`, a dedicated pooler and a direct connection want the
bare role.

**Set `autoRefreshToken: false`** on service-role Supabase clients in scripts.

---

## Credential identity — immovable

**[CORRECTED 2026-09-22. The block below paired certidemy.com's PATHS with
credentials.certidemy.com's HOST. Neither half was wrong on its own; the
combination 404s, and following it during an incident produces three 404s on
the platform's most safety-critical URLs and the conclusion that the host is
down. Measured, both hosts, every path.]**

**THERE ARE TWO HOSTS AND BOTH SERVE.** The authoritative identifiers -- the
ones written inside signed documents -- are on `credentials.certidemy.com`
(a separate Cloudflare Worker repo, `calicoj-dev/certidemy-credentials`), and
the issuer, achievement and status documents are nested under the issuer slug:

```
https://credentials.certidemy.com/credentials/[code]                   200
https://credentials.certidemy.com/issuers/[slug]                       200
https://credentials.certidemy.com/issuers/[slug]/achievements/[code]   200
https://credentials.certidemy.com/issuers/[slug]/status/[N]            200
```

`certidemy.com` serves the same bytes at the shorter paths, by proxying the
`open-badge` edge function through `lib/openbadge/proxy.ts`: `/issuer`,
`/achievements/[code]`, `/credentials/[code]`, `/status/[N]`, and the nested
`/issuers/[slug]` forms as well.

**The unnested paths exist ONLY on certidemy.com.** On
`credentials.certidemy.com` they answer
`404 not an Open Badges identifier on this host`.

> **METHOD, because guessing these is what produced the error above: read the
> URLs OUT OF THE SIGNED DOCUMENT and resolve those.** `id`, `issuer.id`,
> `credentialSubject.achievement.id`, `credentialStatus.id` and
> `credentialStatus.statusListCredential` are the five that must answer. A
> document is the only thing that knows which URLs it promised; a note about it
> is a second copy, and this one went stale exactly as this file says second
> copies do.

**Measured 2026-09-22, all five, from outside with no credential: 200.**
`SM-AI-I-ZZMV-JPC8` resolves at 55,527 bytes and its sha256 matches the
expected hash below -- **and that hash is of the WORKER's document, not of the
`open-badge` function's response.** The function answers 622 bytes to a bare
`?code=`, because its parameter is `doc` and `doc` defaults to `issuer`.

**`open-badge` VERIFIES, checked rather than assumed:**

```
doc=credential&code=SM-AI-I-ZZMV-JPC8   200   the credential
doc=credential&code=TOTALLY-BOGUS-CODE  404   not found
doc=credential&code=                    400   code required
doc=nonsense                            400   unknown doc
```

An earlier note reported it returning identical bytes for a real code, a bogus
code and no code. **That was the probe omitting `doc`, not the function
failing**, and it is recorded because the wrong version was written first.

Each issuer resolves to its OWN profile -- `certidemy`, `durgical` and
`test-partner-02` all return their own name. A slug that does not exist answers
**503 `issuer not configured`**, which says *try again* about something that
will never exist; a 404 is the honest status and it is a small open item.

These are `id`, `issuer.id`, `achievement.id` and `credentialStatus.id` inside
cryptographically signed documents. An external verifier resolves them. **That
host must answer for as long as any credential exists. The URLs can never move.**

**There is no frozen copy of an achievement.** `buildCredential` reads it live on
every request, so an edit reaches every credential already issued. Migration 242
bumps `material_updated_at` so the timestamp stays honest, and the Merkle anchor
must then be rebuilt.

**Renderer change → `DOC_VERSION` bump → `material_updated_at` bump → anchor
rebuild.** Three things that move together.

**Byte-hash `SM-AI-I-ZZMV-JPC8` before and after any `open-badge` deploy.**
Expected:
`366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796`

Before deploying any change to a credential document's shape, grep BOTH repos
for readers of the changed field.

---

## Email

Migration 243 created `email_queue` and `email_suppressions`, plus
`claim_email_sends`, `complete_email_send`, `enqueue_email` and
`record_email_event`. `functions/dispatch-emails` sends via Resend on a
one-minute pg_cron; `functions/resend-webhook` ingests Svix-signed delivery
events.

- Templates live in `functions/_shared/email-templates.ts`, **in git, not the
  database** — a template ships with the code that populates it and is reviewed
  like code.
- `render()` is a pure function of `(key, locale, payload)` and **must not read
  the database.** The queue row is a point-in-time snapshot; a notification is a
  record of what was said at the time, unlike a credential, which is a live
  assertion.
- Suppression is checked inside `claim_email_sends`, at send time, not at
  enqueue — a hard bounce can arrive while a row waits.
- Only a HARD bounce suppresses. A soft bounce or delivery delay is a full
  mailbox, not a dead address.
- The `from` display name carries the ISSUER's name. See the claims discipline
  below.
- **Nothing calls `enqueue_email` yet.** Wiring issuance to it is the next
  migration, and it belongs in SQL (inside the issuance statement or a trigger)
  rather than in TypeScript after the mint — otherwise a crash between the two
  leaves a credential nobody was told about.

---

## Partner onboarding

**An issuer can be verified two ways (migration 250).** `verification_method` is
`'domain'` (the `.well-known` fetch) or `'attested'` (a platform_admin's
out-of-band judgement, for an issuer with no site to publish on). Two CHECK
constraints keep them from mixing: `'domain'` requires a
`verification_domain`, `'attested'` requires it to be NULL. So an attested
issuer who later acquires a domain must move to `'domain'` and set the domain in
one statement — acquiring a domain means re-verifying through it, never
inheriting an attestation.

**`verification_method` is displayed NOWHERE, and that is the decision.** Not in
the OB3 document, `verify-credential`, the verify page, the certificate PDF or
the badge. The domain check never did reader-facing work either — it gates
activation and disappears, and `certidemy`'s own issuer has a NULL domain and
has signed every credential on the platform. **This is a gate, not a claim, and
it stays one only while nothing renders it.** The moment something does, the
wording falls under CLAIMS-POLICY and the self-host rule below stops being
hygiene.

**MIRRORED PAIR, CURRENTLY OUT OF STEP.** `create-partner-issuer` refuses a
`verification_domain` on `certidemy.com` **or `certiglobal.org`** (exact match or
subdomain) and allows the domain to be absent.
`../certidemy-web/components/console/create-issuer-modal.tsx` refuses only
`certidemy.com` and still **requires** a domain — it is the narrower half on
both counts. A web session fixes it. Until then the function is the real gate,
which is the right way round: the modal had the only copy of this rule, so a raw
invocation bypassed it entirely, and that is how `test-partner-02` came to be
`verified = true` against `credentials.certidemy.com` — a host we control,
proving nothing. That row is deliberately left as `'domain'`; the circularity
belongs to the row, not the method.

**The invite-redemption path only ever covered signup-after-invite.**
`on_profile_created_claim_vouchers` is AFTER INSERT on `profiles`, so an address
that already has an account can never redeem — no second profile insert will
ever happen for it. The invite sits pending forever with no error: no failed
row, no log line, no exception. The trigger runs, matches nothing, returns.

**"Already signed up" is the normal case**, not the edge case. A trainer
evaluates the material, decides it is good, and asks to become a partner. The
person most likely to be onboarded is the person most likely to already have an
account.

**Migration 245 fixed it.** `create_company_with_admin()` is a single security
definer function doing all four writes atomically — `companies`,
`company_invites`, `admin_actions`, and `team_members` — and it checks for an
existing profile, granting membership immediately when one is found. The trigger
still handles the invite-first path. **Both paths use `on conflict (company_id,
user_id) do update set role`**, so whichever runs second upgrades the row rather
than failing.

**`company_invites.role` now has a CHECK against the `team_role` vocabulary.**
It was plain text with no constraint while the trigger cast it to the enum, so a
typo inserted cleanly and then raised `22P02` inside the trigger at signup —
aborting the whole transaction and blocking that person's account creation, days
later, against a different actor, with nothing pointing back to the invite.

**`on_profile_created_claim_vouchers` exists only in the live database.** It is
in no migration; 237 does `create or replace function` without `create trigger`.
A fresh environment would have the function, no trigger, and every claim step
would silently never fire. Same for `on_auth_user_created` on `auth.users`. That
needs its own migration.

---

## Issuing

**One mint, two callers.** `functions/_shared/issue.ts` owns achievement
resolution, the dates, the credential insert with its 5-attempt `23505` retry,
and the `credential.issued` webhook queue. `issue-partner-credential` (API key)
and `issue-credential-console` (JWT + `requireIssuerAccess`) are thin callers.
Neither the shared function nor a caller may grow a second copy of the mint —
the drift would be invisible, showing up as credentials that differ in which
columns were set, or one source silently not queueing webhooks.

**There is a THIRD mint, and it is not shared.** `score-mock-exam` writes its own
credential insert on a passing certification exam, and
`scripts/mint-missing-credentials.mjs` writes a fourth copy to recover attempts
the third one dropped. Both predate `_shared/issue.ts`. **This is known debt,
not an oversight — but every column added to `credentials` must be applied to
all three.**

Why they were not folded in (decided 2026-08-25, deliberately deferred):

- `issueCredential` takes an **`achievementCode`** and resolves it scoped to an
  issuer. The exam path has a `certification_id` and no code — the code equality
  it would need is an artifact of migration 231's backfill, not a constraint.
- The exam mint carries fields the shared one has no concept of:
  `exam_attempt_id`, `score_pct`, `jta_version_id`, `locale` derived from
  `exam_session_items`, and the voucher redeem that follows a successful mint.
- The reconciler must set `issued_at` to the attempt's `submitted_at`, not
  `now()`, which inverts the shared function's date handling.

To reconcile them, `issueCredential` would need an achievement resolved **by
`certification_id`** as an alternative to `achievementCode`, an optional
exam-provenance block, and a caller-supplied `issued_at`. That is a real
refactor on the credential path and must not be done under time pressure.

**Until then: `credentials` gains a column → FIVE inserts change.**
`_shared/issue.ts`, `score-mock-exam`, `mint-missing-credentials.mjs`,
**`../certidemy-web/scripts/mint-specimens.mjs`**, and any migration backfill.
Grep `from("credentials")` in both repos before shipping.

**This line said FOUR until 2026-09-11, and the missing one is the dangerous
kind.** `mint-specimens.mjs` upserts credentials, lives in the OTHER repO, and
was named in no checklist — so every reader who followed this instruction
faithfully still missed it. It surfaced only when migration 296's writer list was
built from `pg_class` and a grep of both repos rather than from this paragraph.
**A writer list that lives in prose decays toward the repo the author was in.**

`issue-credential-batch` is NOT on the list and that is correct: it reaches
`credentials` only through `issueCredential`. Checked, because it greps as a
writer and is not one.

**The audit rows are deliberately not shared.** `issuer_api_requests` is keyed
to `api_key_id` and cannot represent a JWT caller; `admin_actions` is keyed to
`actor_user_id` and cannot represent a machine. Two records of two different
facts. `_shared/issue.ts` writes neither.

**`issue-credential-console` takes `issuer_id` from the request body**, unlike
the API where the key IS the identity. `requireIssuerAccess` is the only thing
between a valid learner JWT and minting under another organisation's signature.
Do not add a path that reaches `issueCredential` without it.

**The `credential.issued` webhook payload carries `recipient_email` and
`recipient_name`.** That was defensible when only a partner's own automation
could trigger it. Console issuance now puts holder PII on the wire in response
to a button click by someone who is not writing code and may not know a webhook
is registered. **Not changed on purpose** — a partner's receiver may key off
those fields, so removing them is a breaking change to their integration. Worth
a decision before the console UI ships: either surface "this will notify
<endpoint>" at the point of issuance, or version the payload.

---

## Generated items: practice, not a readiness signal

**DECIDED 2026-09-19. This closes CERTIDEMY-LEARNER-IA section 5.5.**

> **Generated items are practice, reviewed by architecture. The examination
> bank is authored and reviewed by people.**

`generate-mock-exam` excludes `item_origin = 'generated'` on both modes. The
position, because the reasoning is the durable part:

**Practice is acceptable on architecture.** An AI-drafted item is written
against the job-task analysis, to its tier's item contract and grounding, and
through the cue guard. The ten written after the rule modules were consolidated
score **0 percent cue-guard failure against an authored baseline of 9.5**, all
grouped, no tier violations. That is good enough to help a learner practise.

**A readiness judgement is a different claim.** The simulator is graded against
`certifications.passing_score_pct` -- the real threshold -- and a learner
decides whether to sit the exam on the result. Under ISO/IEC 17024 *"no human
reviewed these items"* is the question an auditor asks about anything carrying
that judgement. Architecture is enough for the first and not for the second.

**Cost measured before shipping, not asserted after:** 0 domain/language pairs
fall below their quota, 0 newly short, 0 task/language pairs below the practice
floor of 10. Ten live generated items against 15,220 live practice items.

**AND THERE IS A SECOND READINESS SIGNAL, WHICH THIS DOES NOT TOUCH.**
`certidemy-web/lib/console/readiness.ts` computes per-learner exam readiness
from `user_concept_mastery` -- updated by every practice and review answer --
rolled concept to task to domain, weighted by `weight_pct`, and compared against
the same `passing_score_pct`. **It is shown to a partner's team_admin on the
roster**, who decides whether to buy someone an exam seat.

So a generated item still influences a readiness number, through mastery rather
than through a form, on a surface the learner does not see. **That is correct
and stays**, and the reason is the distinction worth carrying:

> **The simulator is a PROXY for the examination and is read as one, so the
> items in it carry the exam's claim. Readiness is a learning-progress signal
> compared against a threshold, and practice is what it is supposed to
> measure.**

Different claims. Only the first needed the predicate. Excluding generated items
from mastery would also mean a learner who practises on them earns no credit for
it, which is a worse answer than the one it fixes.

**The test for the next surface that shows a number against
`passing_score_pct`**: does it stand in for the examination, or does it report
what the learner has done? A proxy inherits the exam's evidentiary bar; a
progress signal does not. Recorded so "5.5 is closed" is never read as "nothing
AI-written reaches a readiness number" -- it does, by design, and the design has
a reason.

**AND THE PREDICATE IS ON BOTH MODES FOR THE SAME KIND OF REASON.**
`mode='exam'` reads `pool='secure'`, where no generated row exists, so the
exclusion changes nothing there today. It is there because **a guarantee that
depends on a second column staying true is not a guarantee** -- the same
argument as naming every writer of a table rather than backfilling its rows.

## The claims discipline

Certidemy hosts credentials for partners. **The platform must never assert
something the issuer did not.** Subjects and bodies name the issuer; Certidemy
appears only as the infrastructure that hosts and verifies. Never state an exam
score outside the holder's own surfaces.

Automatic skill matching against ESCO **was tried and failed** — embedding
curriculum concepts returned "audio mastering" for "Scrum Master serves the
Product Owner". A human picks. Do not try it again.

---

## Scripts

Node ESM under `scripts/`. Conventions differ between them, so read before
running.

**IF A HOST IS UNREACHABLE FROM NODE OR THE SUPABASE CLI, SUSPECT IPv6 BEFORE
ANYTHING ELSE.** Found 2026-09-14, after a whole session of treating it as
intermittent network trouble.

Node 24's `fetch` (undici) and the Supabase CLI both fail against hosts whose
DNS answers **AAAA first**, on a machine with no working IPv6 path. The failure
is a `ConnectTimeoutError` after 10s — it reads as the remote being down, and
`curl` to the same host succeeds, which makes it look like the host is fine and
the script is broken.

```
node --dns-result-order=ipv4first scripts/<whatever>.mjs
```

**Nothing about any deployment changes.** It is purely local resolution order,
and it does not affect edge functions, the Worker, or anything running outside
this machine.

The tell is the pair: **`curl` works and `node` times out against the same
hostname.** Curl falls back across address families; undici, as configured by
default in Node 24, does not.

This cost a session's worth of misattribution. `mcp.supabase.com` was
unreachable throughout and was recorded as "the MCP host is down", so several
questions that wanted a `pg_catalog` answer were answered from the migration
record instead and marked as inferences. The inferences were correct and the
reason for them was wrong.

**THE SUPABASE CLI HAS ITS OWN FLAG FOR THIS, AND IT IS NOT THE NODE ONE.**
`--dns-result-order=ipv4first` is a NODE flag and does nothing for the CLI. Twice
on 2026-09-18 `supabase functions deploy` failed with

```
failed to dial native: dial tcp: lookup api.supabase.com: no such host
```

while `nslookup api.supabase.com` answered normally. The first time it succeeded
on a blind retry, which is the worst outcome -- it reads as flakiness and teaches
nothing. The flag is:

```
supabase functions deploy <name> --dns-resolver https
```

It resolved first time, both times. `--dns-resolver [ native | https ]` is a
GLOBAL CLI flag and applies to every subcommand.

**AND `scripts/lib/fn-auth.mjs` WAS THE ONE CREDENTIALLED PATH WITH NO RETRY.**
Every other script here wraps `fetch` in a loop because of the note above. This
module did not, so it could not sign in at all while bare `node -e` fetches to
`*.supabase.co` were timing out and `curl` to the same URL returned HTTP 401.
Fixed 2026-09-18.

**The retry is OPT-IN on `callFunction` and defaults to OFF, deliberately.** Its
callers are `mint-issuer-key` and `revoke-issuer-key` -- WRITES. A connect
timeout cannot be distinguished from a request that arrived, executed, and lost
its response, so a blind retry on a mint could mint a SECOND key and both would
land in the JWKS. That is the failure `lti-mint-key.mjs` refuses by design, and
a retry one layer up would have reintroduced it. Pass `{ retry: n }` only for a
read.

**EVERY SUPABASE API CALL NEEDS BOTH `apikey` AND `Authorization`, SAME VALUE.**
Send only `Authorization: Bearer <key>` and the gateway answers

```
{"message":"No API key found in request"}
```

**which reads as a wrong or missing CREDENTIAL and is a missing HEADER.** The key
in your hand is correct. Whoever reads that message goes and checks the key,
rotates it, re-copies it from the dashboard, and none of that is the problem.
Same family as the IPv6 note above: the error names the wrong half of the system.

Every script here already sends the pair -- `scripts/lib/fn-auth.mjs`, `_pg.mjs`,
the loaders. **It is one-off `curl` that drops it**, which is exactly when nobody
has a working example in front of them. Found 2026-09-15 on
`POST /auth/v1/admin/oauth/clients`, against a curl written into this file's own
notes with only one of the two.

```
-H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

**A POSTGREST READ WITHOUT PAGINATION AND A COUNT ASSERTION IS A FLOOR, NOT A
TOTAL.** PostgREST caps a response at 1,000 rows. It does not error, it does not
warn, and it does not care what `limit` you asked for. `?limit=10000` returns
1,000 rows and HTTP 200, and the number you print is the cap wearing the costume
of an answer.

**TWICE IN EIGHT DAYS, AND BOTH TIMES A FLOOR WAS PRINTED AS A TOTAL:**

- **2026-09-09**, the leak scan: `limit=5000` per certification returned 10,838
  rows of SM-AI-I's 12,637 and hid an entire lesson group. A clean verdict on a
  corpus two thousand rows of which were never read.
- **2026-09-17**, `task_translations`: `limit=10000` printed *"1000 rows"*. Every
  per-certification figure derived from it was short -- ISMS-F/pt-BR read 47
  where it is 49, SM-AI-I/es-419 read 45 where it is 53 -- and those figures were
  about to decide which of three options to take on what a partner is served.

**Both were caught by an assertion. Neither was caught by re-reading**, because
a truncated read looks exactly like a complete one: the rows present are all
correct, the request succeeded, and nothing in the response says how much was
left behind.

So every read that feeds a number:

1. **Page to exhaustion.** `Range: from-to` headers, loop until a short page.
2. **Then ask the server for the count** -- `Prefer: count=exact`, read
   `content-range` -- and **assert your row count equals it.**
3. **Throw on mismatch.** Not a warning. A short read must not be able to
   produce a report.

**A PAGE LOOP WITH NO COUNT ASSERTION IS THE SAME BUG WITH MORE CODE.** The loop
exits on the first short page, and a dropped page in the middle -- one retry that
returned 499 rows instead of 500 -- ends it early and silently. The count is what
makes the loop mean something.

Worked examples, both read-only: `scripts/measure-ksa-provisional.mjs` and
`scripts/triage-held-paragraphs.mjs` carry the loop and the assertion in six
lines. `scripts/scan-iso-leaks.mjs` has carried it since the 2026-09-09
instance. Copy one of those rather than writing a fourth.

**THIRD INSTANCE, 2026-09-21, AND IT WAS INSIDE THE PROBE BUILT TO REPLACE A
STALE NOTE.** The two above were reports. This one was a GATE: a sweep asked
which translated rows were already CLEARED, so it could avoid editing reviewed
content, read `limit=4000`, got 1,000 rows and HTTP 200, and reported **"0
cleared rows held"**. Three cleared, serving ISMS-IA rows were in the 730 it
never saw. The cap answered the question of whether a sweep was safe.

**AND THE AUDIT THAT FOLLOWED FOUND THE SAME DEFECT IN `check-migration-state`
ITSELF** -- the script CLAUDE.md tells everyone to run *instead of* trusting a
written number. Fingerprint 355 fetched `concept_translations` to count it:

```
rows returned                                1000
server says total                            3460
cleared, as the fingerprint counted it        271
cleared, true                                2544
```

**The instrument written to kill a stale number was printing one.** It is the
sharpest form of this file's own thesis: replacing prose with a probe removes
the decay, and removes nothing else. A probe is code, and code has defects that
prose does not -- this one is off by 2,273 and has never looked wrong.

> **AND THE FIX WAS NOT TO PAGE IT. NEITHER FIGURE EVER NEEDED THE ROWS.**
> `countWhere()` asks the server with `Prefer: count=exact` and reads
> `content-range`. **Fetching rows in order to count them is the defect one
> level up from failing to page them** -- paging correctly would have been 7
> round trips to compute a number the server had all along.

**The audit is `scripts/audit-unpaged-reads.mjs`** -- read-only, no network, no
credential, unknown flags exit 2. It classifies every PostgREST read literal in
`scripts/` as SAFE-PAGED (goes through a helper that pages AND asserts a
count), SAFE-SCALAR (bounded by an equality or an `in.()` list), CAPPED (an
explicit limit at or under 1,000) or UNSAFE. Measured 2026-09-21, over 230
files and 189 reads:

```
UNSAFE           44
CAPPED            7
PAGED-NO-ASSERT  11
SAFE-SCALAR      61
SAFE-COUNT        6
SAFE-PAGED       75
```

**AND THE CLASSIFIER AIMED ITS WORST FALSE POSITIVE AT THE INVARIANT
CHECKER.** `verify-invariants.mjs` reads seven tables through `getAll()`, which
lives in `_pg.mjs` and is reached through a one-line local alias
(`const get = (path) => getAll(KEY, path)`). Scanning one file at a time, the
audit saw seven bare literals and reported **SEVEN UNSAFE READS against the
platform invariant checker** -- inviting the conclusion that every "invariants
hold" ever printed was about 1,000 of 1,730 concepts.

**It pages. Measured: 1730/1730 concepts, 2984/2984 lesson_concepts, and every
other read exact against `count(*)`.** Nothing was ever short.

This is the same defect in its third form: the audit read the LITERAL and not
the statement, then the FILE and not the program. A guard pointed at the
invariant checker is the worst place for it, because the alarm is big enough
to act on before anyone verifies it.

> **A STATIC CLASSIFIER MUST FOLLOW THE PROGRAM, NOT THE FILE** -- local
> imports and one hop of aliasing. And **a helper body ends at the next
> helper**: a fixed character window spills into the function below, so a
> plain `fetch()` wrapper above a real paging helper inherits machinery it
> does not have.

**PAGED-NO-ASSERT IS A THIRD STATE AND FOLDING IT EITHER WAY IS A LIE.**
A loop that walks `Range` until a short page cannot be truncated at 1,000, so
calling it UNSAFE sends someone to fix a working reader. It also never asks
the server for a count, so calling it SAFE-PAGED claims a check nobody ran --
it ends on the FIRST short page, whatever caused the page to be short.

**A PAGING LOOP ASSERTS ITS TOTAL, AND DOES NOT REASON ABOUT THE SERVER'S ROW
CAP.** Recorded 2026-09-22, and it is the general form of every instance above.

`_pg.mjs`'s `getAll` terminated on `page.length < PAGE`, with `PAGE = 1000` --
exactly the PostgREST cap. **It was correct only because two numbers in two
different systems happened to be equal**, and nothing in the program stated
the dependency. Lower `db-max-rows` to 500 and every request returns 500, the
loop sees `500 < 1000`, stops, and **seven tables truncate silently at once**
-- including the 1,730-row concept corpus that five platform invariants are
computed over.

**LOWERING `PAGE` IS NOT THE FIX. It moves the coincidence.** A loop that is
safe because 500 is under 1,000 depends on the same unstated fact as one that
is safe because 1,000 equals 1,000. Any reasoning of the form *"the page size
is small enough"* is reasoning about a number in a config file Postgres does
not know about.

> **MECHANISM: `Prefer: count=exact`, terminate on REACHING THE TOTAL, throw on
> mismatch.** Termination stops being "this page looked short" -- a short page
> is what a lowered cap, a dropped page and a finished read all look like.
> Page size becomes a throughput choice, and its comment must say so, or the
> next reader "optimises" it and believes they had to think about the cap.

**And the assertion was made to fail before it was believed.**
`_PG_TRUNCATE_AFTER_PAGES=1` cuts the loop after one page:

```
Error: SHORT READ on concepts?select=...: collected 1000 row(s), server says 1730
```

That is the exact sentence the defect needed and never produced. **A count
assertion nobody has watched fail is the same object as a gate nobody has
watched fire.**

**A CHECK THAT PASSES OVER AN EMPTY INPUT REPORTS VACUOUS, NOT PASS.** Same
day, and it is the green-result rule pointed at a suite's own arithmetic.

`verify-invariants`' `match term uniqueness` has printed **pass** for its whole
life while examining **nothing**: `match_terms` is deliberately empty on all
1,730 concepts, so no term has ever been available to collide. It rendered
identically to the five invariants beside it, which cover 5,000+ rows between
them.

**A pass is a claim that something was examined and held.** With a zero
denominator nothing was examined, the claim is empty, and it inflates the
apparent coverage of every suite it sits in -- here by one sixth.

> **MECHANISM: every check returns the COUNT OF THINGS IT EXAMINED, the runner
> renders a zero denominator as its own status, and the summary carries three
> numbers rather than two.** `6/7 invariants hold` cannot say whether the sixth
> looked at anything. `5 pass, 1 vacuous, 0 fail` can.

The denominator must be the thing the check actually iterates. `match term
uniqueness` iterates TERMS, so its denominator is 0 -- using `concepts.length`
would report 1,730 examined and hide the exact vacuity this exists to show.

**Measured on the day it was added: 1 of 6 vacuous, and it is alone.** The
other five examine 1730, 12, 12, 13 and 1730.

**AND AN INVARIANT CAN OUTLIVE ITS SUBJECT.** `migration tip vs disk` asserted
that CLAUDE.md still carried a parseable `Migration tip: NNN` line. That line
was **deliberately deleted** -- it is the defect this file opens with -- so the
invariant asserted the continued presence of something whose removal was the
fix, and failed, exiting the suite non-zero against a repository in exactly
the intended state.

**A suite that is permanently red teaches people to read red as normal**,
which costs more than the check ever returned. Deleted, and the deletion is a
SUCCESSION: `check-migration-state.mjs` answers the number from the folder and
*has it run* from the database and the deployed function -- the half no file
on disk has ever known.

Full enumeration in `UNPAGED-READ-AUDIT.json`, and the enumeration is the
artifact -- the count is commentary until someone reads the members.

**AND THE MORE USEFUL COLUMN IS PURPOSE, NOT SAFETY.** Of the 49 at-risk
reads, the audit asks how many are computing a COUNT by fetching rows -- the
355 shape. Those do not need paging; they need to stop fetching. **Paging a
read that should never have fetched is fixing the wrong layer**, and it is
precisely the fix a careful reading of the paging rule produces.

**The answer was ONE, and that is the finding.** 355 was an instance, not a
family: the other 48 genuinely use their rows -- names, descriptions,
`content_md`, `match_terms`. The one was a post-condition in
`delete-aimsf-concept-translations.mjs` asserting a deletion by fetching rows
to check `.length` was zero. It was bounded by an `in.()` list and never
wrong; it is now `countWhere()`, because **a post-condition that CANNOT be
truncated is worth more than one that merely is not.**

A negative result is worth recording at the same weight as a positive one.
Had this gone unmeasured, "the 355 shape is everywhere" would have been the
natural assumption and 49 reads would have been rewritten to fix one.

**AND THE AUDIT FLAGGED ITS OWN FIX.** `countWhere()` appends `&limit=1` at
runtime, so the static classifier saw an unbounded literal and reported
`check-migration-state` UNSAFE on the next run -- the repair for the
truncation, marked as the defect. A read passed to a helper that asks for a
count and never accumulates rows is now SAFE-COUNT, which is a different fact
from SAFE-PAGED: it is not bounded, it fetches nothing.

**ITS OWN CLASSIFIER HAD THIS FILE'S DEFECT FOUR TIMES BEFORE IT WAS RIGHT, AND
THAT IS THE ENTRY.** Every one over-reported, and an over-reporting guard is
the kind that gets deleted:

1. **It knew only `offset=` paging** and not the `Range:` header idiom this
   file actually recommends. Four correctly paged scripts reported UNSAFE.
2. **It credited paging PER FILE.** A file with a good helper and one raw
   `fetch` beside it reported clean -- which is the live shape in
   `apply-paired-review-fixes.mjs`. Credit is now per read: the helper's name
   must appear immediately before the literal.
3. **It read the LITERAL, not the STATEMENT.** A concatenated query carries its
   limit and its filters in later fragments, so a bounded read looked
   unbounded. **The instrument committed the half-a-read defect it exists to
   find.**
4. **It required the paging plumbing and the count assertion in one function
   body.** Three helpers here split the fetch into a callee. The ASSERTION is
   the discriminator, so that must be in the helper; the plumbing is accepted
   from anywhere in the file.

It also scanned itself and counted its own positive-control strings as five
real reads.

**The positive control is what makes the number worth anything.** Five
synthetic sources with known verdicts, one of which MUST come back UNSAFE; if
any verdict is wrong the script prints nothing and exits 2, because a broken
classifier reports clean.

**What it cannot do**, stated so nobody reads its silence as coverage: it is
static analysis of string literals, so a query assembled from variables at
runtime is invisible to it, and `BIG` is a hand-maintained list of table
populations -- a table that crosses 1,000 rows without being added there moves
from harmless to silent with no output change.

**And the same shape bites outside PostgREST.** A per-LINE run count read as the
gate's per-SEGMENT count under-reported ISMS-IA's runs by thirteen on
2026-09-17, and the missing ones surfaced only as a refusal with no line
attached. **The question is never "did the read succeed" -- it is "did the read
answer the question I am about to print".**

**AND THE FOURTH INSTANCE IS A POPULATION, NOT A UNIT: THE SAME NUMBER OVER A
DIFFERENT SET OF ROWS.** Found 2026-09-18, measuring the cue-tolerance
declaration before publishing it.

ISMS-IA's blueprint declares *"mean key margin 13 characters"*. Measured over
the bank it names, the mean is **-1.8**. Both are correct:

| population | ISMS-IA | AIMS-IA | SM-AI-II |
|---|---|---|---|
| all items | -1.8 | -1.9 | +0.8 |
| **items where the key IS longest** | **13.1** | **13.7** | **12.9** |

The key is SHORTER than the longest distractor about half the time, so averaging
all items cancels most of the signal. The declaration meant the second
population; reading it as the first turns a sound declaration into an apparent
two-day-old lie -- and the next move after "the declared number is wrong" is to
edit the declaration, which would have replaced a correct figure with a
meaningless one.

**Same family as the per-LINE run count read as the gate's per-SEGMENT count,
and it is now FOUR:** a page cap read as a total, a per-line count read as
per-segment, a census taken before the pass it described, and a mean over the
wrong population. Every one was a real measurement of something nobody asked
about.


**AND A TWO-POINT COMPARISON CANNOT SAY WHICH POINT IS UNUSUAL.** Paid for
2026-09-21, measuring whether a bank drafted from stub concept text looked
different from one drafted from real text.

AIMS-F echoes a linked concept's name verbatim in 17.2 percent of links;
ISMS-F, the chosen control, in 28.3 percent. Read as a pair that is an
11-point deficit and a finding. Measured across all twelve certifications,
length-controlled:

```
SD-AI-I 12.9   AIHR-I 14.7   AIE-I 16.8   AIMS-F 17.2   AIMS-IA 17.4
SPO-AI-I 18.0  SM-AI-II 23.2 AISM-I 23.2  AIGRM-I 24.3  ISMS-IA 25.4
ISMS-F 28.3    SM-AI-I 31.2
```

**AIMS-F is fourth from the bottom of twelve and unremarkable. ISMS-F is
second from the TOP.** The control was the outlier, and against a population
the deficit is nothing.

**A control is one sample, and n=2 has no variance.** Two numbers always differ,
and nothing in the pair says which of them is the strange one -- so the
difference can be read as a fact about either point, and it will be read as a
fact about whichever one is under suspicion. That is not a sampling error; it
is the arithmetic of having two points.

> **MECHANISM: any finding stated as a difference from a control is
> re-measured against the FULL POPULATION before it is reported, and the
> population figure is what goes in the report.** The control keeps its job --
> it is what makes the signal worth measuring at all -- but it does not get to
> be the baseline.

Same family as the mean over the wrong population, one level up: there a
number was measured over a set nobody asked about, here it was measured
against a comparator nobody had placed.

**AND THE SIXTH IS ONE-SIDED: A REPLACEMENT IS A COMPARISON, AND ONLY ONE TERM
WAS COUNTED.** Found 2026-09-20, scoping the `clausula` sweep. Nothing was
written, and what stopped it was the person who asked for it, not the census.

The census counted `cláusula` across every translated surface, derived the
column list from the catalogue rather than typing it, paginated with a count
assertion, and found ~18,000 occurrences. Every one of those precautions is in
this file. **It never counted `apartado`, `capítulo` or `seção`** -- the terms
it proposed to install. Measured afterwards:

| corpus | cláusula | apartado / capítulo / seção | |
|---|---|---|---|
| item bank | **14,837** | 142 | cláusula dominant **104 : 1** |
| lessons | 257 | **4,382** | alternative dominant **17 : 1** |

**The two corpora use OPPOSITE conventions and the sweep was scoped from the
smaller one.** Lessons are 2 percent of the surface. The proposal was to
rewrite 10,470 occurrences -- 476 of them in live secure exam items -- so that
the 98 percent would match the 2 percent, and the report presented that as a
consistency fix.

**Worse: the lesson corpus was misread too, by the same omission.** "~240
lesson occurrences of cláusula" is correct and reads as "lessons use
cláusula". Lessons are overwhelmingly `apartado`/`seção` already; the 257 are
the minority form there. Counting one term told the truth about that term and
nothing about the corpus.

> **WHEN A CHANGE REPLACES A WITH B, COUNT B FIRST.** A census of A alone
> cannot distinguish "A is an inconsistency" from "A is the house form". The
> ratio is the finding and it needs both sides; one side is a number with
> nothing to disagree with, which is the same defect as a single count with no
> field beside it, applied to a plan instead of a query.

**Two things the second count also settled, neither of which was guessable:**

- **101 lessons already contain BOTH forms** -- AIMS-IA 57, AIMS-F 21, ISMS-IA
  19, ISMS-F 4. So "lessons are internally consistent" was false before any
  sweep, and nothing has gone wrong. That is the strongest argument for
  leaving both alone: a candidate reading `apartado` in a lesson and
  `cláusula` in an exam is not misled about anything.
- **It is not one week's prompt.** The four ISO certifications were generated
  on four separate days spanning five weeks -- ISMS-F 2026-08-05, AIMS-F
  08-07, ISMS-IA 08-12, AIMS-IA 09-12 -- and each independently used
  `apartado`/`seção`. A convention that survives four independent runs is a
  standing prompt convention, not an accident, even though nothing anywhere
  records it as a decision.

**And the premise under all of it was wrong in a way no counting would have
caught.** `apartado`/`capítulo` is AENOR's convention, which is SPAIN. Our
Spanish is es-419, and `cláusula` is common in Latin American ISO practice.
"Match the published national adoption" does not name one adoption for Latin
America, so the rule the sweep was built to enforce does not exist.

**The defence is not more care, it is naming the population IN THE KEY.**
`mean_key_margin` invites the error; `mean_key_margin_when_key_longest_chars`
cannot be misread, and migration 344 renamed it for that reason rather than
leaving a comment beside it. A number whose name does not say what it is
measured over is half a fact.

**AND IT HAPPENED AGAIN IN THE NEXT MIGRATION, BY THE AUTHOR WHO HAD JUST
WRITTEN THAT.** 345 asserted `secure pool ... expected 12637` and aborted on its
own negative post-condition: **12637 was the TOTAL secure rows, read off a query
with no `retired_at` predicate, and asserted of LIVE rows.** 126 secure items
have been retired since 2026-08-10 -- a deliberate trilingual two-option pass,
42 groups x 3 languages -- so live is 12511 and the database was right.

**Nothing was written, which is the assertion working.** But note what the rule
above did NOT do: it was in this file, written that same evening, by the same
author, and it did not prevent the fifth instance. **Reading a number off one
query and asserting it of another is not a lapse of care. It is the default.**

So the mechanical rule, which is the only part that transfers:

> **AND AN ASSERTION ABOUT WHAT A MIGRATION DID *NOT* TOUCH IS ALWAYS A
> BEFORE/AFTER COMPARISON, NEVER A LITERAL.** Three instances in one week --
> 340's `n === 35`, 345's `expected 12637`, 351's `expected 13` -- and all
> three aborted against a database that was RIGHT. That is the expensive part:
> a literal that fails cannot be told from a real defect, so every one costs a
> round trip of diagnosis before anyone discovers the assertion was the
> problem.
>
> The strongest form is a CHECKSUM of the rows the migration is not authorised
> to change, captured before and compared after. It carries no number, cannot
> go stale, and is stronger than any count -- **a count passes on two rows
> swapping values.** 351 hashes every `exam_attempt` except the one it repairs.

> **AN ASSERTION ABOUT A COUNT MUST NOT CONTAIN A COUNT.** Capture it before
> the change, compare after, and assert *unchanged*. A literal is a second copy
> of a fact that lives in the database -- the same defect as the migration tip,
> with the same half-life, and it fails CLOSED in a migration and OPEN in a
> report.

This is the second time in one session that writing a rule down failed to stop
its own recurrence -- the first was "run the check as the party the property is
about", broken by the author who had documented it. **Both were fixed by a
mechanism, not a sentence:** a probe that asks the database, and a before/after
comparison that has no number to go stale.

**THERE ARE TWO FLAG CONVENTIONS AND THEY ARE OPPOSITES.** This is the single
most dangerous thing about this directory.

| family | flag | default | example |
|---|---|---|---|
| opt into SAFETY | `--dry` | **LIVE** | `load-lessons-direct.mjs` |
| opt into WRITING | `--apply` | **dry** | `mint-missing-credentials.mjs`, `lti-mint-key.mjs` |

Reading `--dry` and inferring "so without it, nothing happens" is exactly
backwards for the first family. Reading `--apply` and inferring "so `--dry`
makes it safe" is exactly backwards for the second — `--dry` there is an
unrecognised flag.

**A script must ABORT on an unrecognised flag, not ignore it.** Never trust that
the reader knows which family a script belongs to. A flag someone believed in
that silently did nothing is how `load-lessons-direct.mjs` runs live on a typo,
and it is the failure this table exists to prevent. `lti-mint-key.mjs` does it:
unknown flags exit 2 and the error names both conventions.

New scripts take `--apply`, dry by default. It is the safe half, and a
default that writes is not defensible in a repo where the recurring failure mode
is silent success.

The individual scripts:

- `load-lessons-direct.mjs` — flag is `--dry`, NOT `--dry-run` (unknown flags are
  silently ignored, which means a typo runs it live). Needs `CERT_ID` env.
  Idempotent: SKIPS existing rows, so it cannot be used to update content.
- `update-lesson-content.mjs` — the one that updates existing rows. `--file`,
  `--lang`, `CERT_ID`, `--dry` first.
- `wire-lessons.mjs` — env vars `CERT_ID` and `DRY_RUN=1/0`, no flags. A third
  convention, for completeness.
- `lti-mint-key.mjs` — mints the platform RSA-2048 key for LTI 1.3, proves it
  signs before Vault, derives the `kid` as an RFC 7638 thumbprint. `--apply` to
  write, `--force` to mint a SECOND key (rotation). Refuses when a non-retired
  key exists, because two accidental mints both land in the JWKS and
  `lti_store_tool_key` only refuses a duplicate `kid`. **Mirrored pair with
  `functions/lti-mint-tool-key`** — the script is bootstrap and operations, the
  function is the console button. If the mint shape changes, both change.
- `verify-cert.mjs` — the conformance gate. **The baseline is NOT clean.**

  **RUN IT FROM ANYWHERE.** Every path is resolved from the script's own
  location as of 2026-09-12. It used to read `SCHEME-*.md` relative to the
  working directory, so running it from `scripts/` silently collapsed fourteen
  scheme-claim checks into one WARN saying the cert "publishes no checkable
  claims" — true of a cert with no scheme, false of one whose scheme could not
  be read. SD-AI-I reported 42 pass / 6 warn from `scripts/` and 56 pass /
  5 warn from the root, and neither run said which had checked less.

  As of **2026-09-19**, `--all` reports 56-59 checks per certification (the count
  varies; some skip) and ends with `1 cert(s) with FAILURES` -- ZZ-TEST-I, the test
  certification. **Every real certification passes.** These thirteen rows were
  pasted from one run's output, not transcribed:

  ```
  WARN  AIE-I      56 pass, 0 fail, 3 warn
  WARN  AIGRM-I    57 pass, 0 fail, 3 warn
  WARN  AIHR-I     56 pass, 0 fail, 2 warn
  WARN  AIMS-F     57 pass, 0 fail, 3 warn
  WARN  AIMS-IA    53 pass, 0 fail, 5 warn
  WARN  AISM-I     57 pass, 0 fail, 2 warn
  WARN  ISMS-F     57 pass, 0 fail, 2 warn
  WARN  ISMS-IA    56 pass, 0 fail, 3 warn
  WARN  SD-AI-I    59 pass, 0 fail, 5 warn
  WARN  SM-AI-I    59 pass, 0 fail, 6 warn
  WARN  SM-AI-II   57 pass, 0 fail, 4 warn
  WARN  SPO-AI-I   59 pass, 0 fail, 5 warn
  FAIL  ZZ-TEST-I  28 pass, 12 fail, 1 warn
  ```

  **THREE CERTIFICATIONS WITH FAILURES BECAME ONE, AND THAT ONE IS THE TEST
  CERTIFICATION.** Three movements got there and only one was a fix to content:

  - **+1 on every certification with lessons** is `lessons.scanned` (§11), added
    2026-09-19. ZZ-TEST-I is unchanged at 28 because it has no lessons and the
    check SKIPs -- a uniform delta with one principled exception is the evidence
    that nothing else moved.
  - **AIE-I and SM-AI-I lost their ungrouped-items failures.** The rows were
    written by `generate-practice-questions` and were retired, which cleared the
    §8 group check on both.
  - **AIE-I's validity claim closed.** `SCHEME-AIE-I.md` now declares 365,
    matching the column and matching every credential ever issued under it.

  The only remaining failure is ZZ-TEST-I, a test certification expected to fail.

  **"EVERY REAL CERTIFICATION PASSES" IS NOT "EVERY REAL CERTIFICATION IS CLEAN."**
  All twelve still WARN, so green is not the bar -- compare against the table and
  investigate anything that moved. AIMS-IA carries five warnings and the lowest
  pass count on the platform; SM-AI-I carries six.

  **The ungrouped-items entry below is kept as the record of a live writer defect
  that was found, measured and closed** -- it is no longer a description of the
  current state, and the counts in it are historical.


  **AIE-I, §8 "Every item belongs to a question group" — CLOSED 2026-09-19.
  The writer was `generate-practice-questions`; its rows were retired and the
  check passes. The measurements below are the record of finding it.**

  [SUPERSEDED 2026-09-19 — every count in this section is historical. AIE-I
  now reports 1 ungrouped row, not 120, and §8 no longer fails on it. The
  section is kept because the writer defect it documents was live for over
  two weeks and nothing noticed.] `question_group_id` is the trilingual
  sibling key, so an ungrouped item is invisible to the three-language coverage
  check that groups by that column.

  Measured 2026-09-12, active and approved only:

  ```
  pool      language  is_exam_scope  n    tasks  created
  practice  en        false          90   17     2026-08-27 -> 09-11
  practice  es-419    false          30    4     2026-08-20 -> 09-04
  ```

  **THIS PARAGRAPH SAID 15, SPANISH-ONLY, AND BOTH HALVES ARE NOW WRONG.** It
  was right on 2026-08-25. Ninety ENGLISH rows have been written since, the most
  recent on 2026-09-11 — **the day before this was measured.** So whatever
  writes AIE-I practice items has been emitting ungrouped rows for over two
  weeks and had not stopped. That is a live defect in a writer, not a pile of
  old debris, and it is the reason this is worth a look before the next content
  run rather than after.

  **Still true: none are in the secure pool**, `is_exam_scope` is false on all
  120, and no certification exam form can contain them. The es-419 simulator and
  the review queue can serve them; a real exam cannot.

  The original 15 were **not** migration 104 rebuild debris as first assumed;
  they were written on 20-21 August 2026. What has been adding to them since
  2026-08-27 has not been identified.

  (A separate 20 ungrouped rows exist on AIE-I that the check correctly ignores:
  `rejected` and retired, from 24 July.)

  **Why they are ungrouped has NOT been established** — whether the fan-out
  failed, was interrupted, or those items were written outside it. Fixing the
  data is its own change.

  **A LIVE TIER-2 CERTIFICATION IS SERVING A TWO-OPTION GENERATED ITEM, AND
  THE GATE ONLY WARNS.** Found 2026-09-12, open, not fixed.

  One of the five SM-AI-II practice questions written by
  `generate-practice-questions` that evening is a `true_false` with **two
  options**. SM-AI-II is `tier = 2` and `status = 'available'` - a live
  certification whose whole Level II item contract is *four defensible options
  with one best*.

  Three things have to line up for that to happen, and they do:

  - `functions/generate-practice-questions` validates `options.length >= 2` and
    accepts `true_false`. **It reads no tier at all.**
  - The tier contract lives in `scripts/gen-cert-secure.mjs` (`certTier`, and
    the comment *"Tier 2 items carry four defensible options with one best"*).
    **The generation path has never seen it** - nothing shares that rule
    between the two, which is the mirrored-pair failure in CLAUDE.md's own
    edge-function section.
  - `verify-cert` `items.optionfloor` FAILS on secure (*"a guesser scores 50%
    on a two-option item"*) and only WARNS on practice. The item is practice,
    so it warns, and a warning on a cert that already carries warnings is
    invisible.

  **This is the argument for `CERTIDEMY-LEARNER-IA.md` section 5.5 arriving on
  its own rather than as a doc note.** That section says AI drafts should land
  `status='pending_review'` before being served, with the gate enforced in the
  fetch paths, and it has said "wire up next" for some time. This is what
  "served without review" produces: not a wrong answer, but an item that
  quietly breaks the tier contract the certification is sold on.

  Not fixed on 2026-09-12, deliberately. The cheap half is teaching
  `validateQuestion` the tier; the real half is 5.5.

  This line previously read *"38 invariants, 0 failures as the baseline"* and
  was wrong on both numbers. That is worse than saying nothing: a clean baseline
  nobody re-checks turns the next real failure into noise someone has already
  decided to ignore. **Every cert also warns**, so "green" is not the bar —
  compare against the table above and investigate anything that moved.

- `scan-iso-leaks.mjs` — the lesson-body leak scan, and **it needs `pdftotext`
  on PATH**. That binary ships with poppler-utils, is not installed by npm, and
  is not declared in `package.json` because nothing in npm can declare it:
  `choco install poppler` on Windows, `brew install poppler` on macOS,
  `apt-get install poppler-utils` on Debian. It also needs the three ISO PDFs at
  the absolute paths in `scripts/lib/citation-index.mjs`. Both are now checked
  before anything else runs and each exits 2 naming the remedy.

  **THE DEPENDENCY BEING UNDECLARED IS WHY A RE-SCAN NEVER HAPPENS, and that is
  the entry.** `trg_lessons_clear_mcp_servable` nulls `mcp_scanned_at` and sets
  `mcp_servable = false` on ANY `content_md` change, so **every edit to a lesson
  body withholds it from the MCP surface until this script runs again.** That is
  fail-closed and correct. It is also silent: no error, no log line, no queue.

  On 2026-09-19 a passive-to-active voice edit to `02-03-amendment-1-2024` pt-BR
  withheld that body for two days. The fix was one command. It surfaced only
  because migration 352 asserted a literal and was wrong for an unrelated
  reason. `check-open-items.mjs` now probes it: **`mcp_scanned_at IS NULL` is
  UNSCANNED, `mcp_servable = false` with a timestamp is REFUSED**, and the two
  are reported apart because only the first is an open item.

  **Do not probe `mcp_servable IS NULL` — the column is NOT NULL DEFAULT false
  and that check can never fire.**

- `verify-citations.mjs` — resolves every clause and annex reference in a bank
  against the three ISO PDFs on disk. **READ-ONLY: no `--apply`, no `--dry`,
  unknown flags exit 2.** `--index` dumps the parsed structures. Also wired into
  verify-cert as `items.citations` (FAIL on secure, WARN on practice, SKIP where
  the PDFs are absent). **It checks EXISTENCE, NEVER MEANING** — "clause 6.7
  exists in ISO 19011:2026" is mechanical, "clause 6.7 says what this item
  claims" is not, and a clean run is no evidence at all about the second.

- `smoke-analyzer-access.mjs` — who may pull a curriculum coverage report.
  **THE ONLY SCRIPT HERE THAT CREATES ITS OWN IDENTITIES**, because the three it
  needs exist nowhere on the platform: a team_admin of a company holding
  `curriculum_coverage`, a plain team_member of that same company, and a
  team_admin of a different one. `--apply` to write, dry by default, unknown
  flags exit 2. Signs in with the ANON key, never service-role — the property is
  what a browser session can do.

  **The grant it inserts carries `expires_at = now() + 15 min`**, so a teardown
  that dies halfway leaves an entitlement that closes itself rather than a live
  one. Teardown reads the grant back rather than trusting that `delete` returned
  no error, and prints recovery SQL when it cannot.

  Its GRANTED control is the one to keep: it asserts `company_has_feature` is
  TRUE for the granted company and FALSE for the other, read back after the
  insert. Without it every refusal is equally consistent with the fixture never
  landing — which is the state `analyze-curriculum`'s partner branch was in for
  its entire deployed life.

- `propose-match-terms.mjs` / `emit-match-terms-sql.mjs` — the `concepts.match_terms`
  pipeline. **`match_terms` is deliberately EMPTY on all 1,730 concepts, platform-wide.
  That is a decision with an argument, not an unfinished task — read
  `MATCH-TERMS-DECISION.md` before filling it.** Short version: the proposer can only
  offer terms sharing a token with the concept name, so the useful synonyms (`SVS`,
  `CAB`, `XLA`) are structurally unreachable, and our prose does not ground them —
  AISM-I's 61 lesson bodies define exactly one acronym. A curated list IS groundable
  if each term carries its authority the way `drift_rules.authority_citation_id` does;
  the blocker is licence (ITIL, and the still-unverified Scrum Guide) and ~1,730
  human judgements, **not principle**.

  **Both guards on this pipeline measure a term's LENGTH when the risk is its
  DOCUMENT FREQUENCY.** `service` is in 34 of AISM-I's 226 concept names; a
  two-token phrase built on it passes every check and inflates a partner's coverage
  invisibly — the one failure in this engine that makes the number look BETTER.

- `analyze-local.mjs` — **DEAD SINCE 2026-09-01, AND THAT IS THE ENTRY.** It reads
  `scripts/calibration-manifest.json`, deleted in `3110eec` by a vendor-reference
  scrub that said so plainly (*"Deleted with no preservation"*). The deletion was
  deliberate; **the consequence was not weighed and went unnoticed for twelve days
  and 160 commits** — found 2026-09-13 during unrelated work. **So the curriculum
  analyzer has had no local test path across a period in which its engine was
  edited.** The manifest was the regression baseline: `hand_*` human judgements
  kept separate from `expect_*` engine values, plus a `sha256_16` per fixture so a
  pdf-parse upgrade could not present as an engine regression.

  **Restoring it is not "put the file back."** The manifest is keyed by filename
  and the filenames are competitor names — the baseline and the vendor-scrub
  policy genuinely conflict. The three resolutions and their costs are in the
  script's header. **Refuse the tempting one**: re-deriving the baseline from the
  current engine launders today's behaviour into "expected", including anything
  that regressed while nobody could run it. A baseline that records the present
  can never fail.

---

## Reading a bank versus sweeping it

**THE DECISION RULE, and it is the durable output of 2026-09-12:**

> **Built with a never-assert list, sweep it. Built without one, read it.**

A sweep can only find a shape someone already named. `CRITERIA_42001`'s "never
say Annex B is informative" found AIMS-F's two worst defects — both **keys**, one
**secure** — in four queries with no reading at all. Nothing carried over from
the ISMS-F read would have found them, because that list is per-standard.

**The converse is what makes the rule bite.** ISMS-F and AIMS-F were generated
while `groundingFor` routed both to `NEUTRAL`, 524 characters naming no standard
and forbidding nothing. There were no shapes to sweep for, so the shapes had to
be produced by reading, one bank at a time. Of ISMS-F's four defect families,
**only one was discoverable by search without reading first**; the other three
were found by reading and only then extended by search.

**And a sweep undercounts even the family it knows about.** The search for
`monitor and review` returned 1 where there were 2 — the second instance reads
*"monitor**ing** and review"*. A morphology variant halved a family, which is the
same defect as every other guard in this file that searched for a STRING when
the property was something else.

**The routing fix is what retires the second category.** Every certification now
resolves to a grounding that names its standard and its forbidden claims —
`FOUNDATION_27001` / `FOUNDATION_42001` for the Foundation certs, `AUDIT_*` for
the auditor certs, and the standard is decided BEFORE the role so a future Lead
Implementer cannot fall through to NEUTRAL. So nothing generated from here on
lands in "must be read". The two banks that already did are ISMS-F and AIMS-F.

**What neither approach reaches.** Both find *addresses* and *named claims*. The
defect class underneath — a true statement filed against the wrong source, in
prose that reads correct — is only ever caught by a human with the standard
open. ISMS-F's worst instance was `clause 4.1 "explicitly lists" governance,
culture and competitive factors`: **those words appear zero times in the entire
standard**, and no gate in this repo would have said so.

---

**A DRY RUN OF A GENERATOR IS A SAMPLE, NOT A PREVIEW, AND NOTHING SAYS SO.**
"Generate, show, approve, land" is the obvious review shape and **it does not
exist in this repo.** `backfill-practice.mjs` and `gen-cert-secure.mjs` generate
fresh on every invocation: the dry run prints one item, the live run prints a
different one, and the output says "Wrote ~3 rows" either way.

Paid for on 2026-09-12. AIMS-F task 4.1's replacement item was dry-run, read in
full, judged on its cue balance, regenerated once on that judgement, read again,
approved — and then the live run produced a THIRD item that nobody had read.
It happened to be sound. The review step had no bearing on what landed.

**What a generate-once-then-persist path would take**, for whoever reaches for
the step and finds it missing:

- a `--emit <file>` on the generator that writes the accepted batch as JSON
  after the cue and validation guards pass, and stops before the insert;
- a `--from <file>` that inserts that exact batch, re-running the guards on the
  way in so an edited file cannot smuggle a bad item past them;
- translation staying with the insert, not the emit, since only the English is
  under review at that point.

Roughly the shape `retranslate-item-rewrite.mjs` already has - a spec file
authored and read first, applied second. The generators predate it.

**Until it exists, the honest sequence is: land it, then read what landed, and
retire it if it is wrong.** Reading a dry run and approving on that basis is a
review of an artefact that will not exist.

---

**THE CUE GUARD'S WORD LIST IS NARROWER THAN THE TELL IT NAMES.**
`ABS_WORDS` in `scripts/lib/item-cue-guard.mjs` is fifteen words - always,
never, must, only, all, none, cannot, can't, every, any, impossible,
guarantee(s|d), without exception. It fires only when **EVERY** distractor
matches and the key does not.

So "unconditional", "entirely", "each", "regardless", "purely" and "freely"
are absolutes to a reader and invisible to the guard, and a 2-of-3 asymmetry
passes however stark it reads.

**This was misdiagnosed first.** The guard was reported as inconsistent - firing
on one item and passing an identical shape on another - and it was not: the
first had all three distractors on the list, the second had one. The guard did
exactly what it says. The inconsistency was in the eye counting by a broader
definition than the code's, then blaming the code. **Before calling a gate
unreliable, read the predicate** - a gate wrongly called unreliable is worse
than a gap in one, because the gap is bounded and the distrust is not.

---

**A GROUP BY OVER A NULLABLE KEY BUCKETS EVERY NULL TOGETHER, AND IT LOOKS LIKE
A FINDING.** Measuring generated items by question_group_id on 2026-09-12
returned what read as one defect spanning three certifications:

    AIE-I     2026-08-20   1 group, 120 rows
    SM-AI-I   2026-08-29   1 group,  20 rows
    SM-AI-II  2026-09-12  10 groups, 10 rows

The first two are not groups. They are the KNOWN ungrouped-items defects -
question_group_id IS NULL on every row - collapsing into a single bucket
because GROUP BY treats all NULLs as one value. Reported as-is it would have
claimed a 120-row group exists, and invited someone to go looking for it.

Same shape as the join fan-out and the field concatenation with no separator:
THE QUERY MANUFACTURED AN ADJACENCY THE DATA DOES NOT HAVE. Count
 separately, or add  to the WHERE,
before reading anything off a grouped result on a nullable column.

**`count(*) filter (...)` OVER A LEFT JOIN COUNTS THE UNMATCHED LEFT ROWS, so a
filtered count and an unfiltered one in the same query can contradict each
other.** Same family as the GROUP BY above: the query manufactures a number the
data does not contain.

Measured 2026-09-14, and both halves were printed side by side:

```
tier | credentials | real_awards
   2 |           0 |           3
```

`count(cr.id)` is 0 because the LEFT JOIN matched nothing. `count(*) filter
(where not coalesce(cr.is_specimen,false))` is 3 because **`count(*)` counts the
three unmatched CERTIFICATION rows**, and `not coalesce(NULL,false)` is `true` on
every one of them. Read alone, "3 real awards" is a finding about credentials
that do not exist.

The fix is to make every filter reject the unmatched row explicitly -
`count(*) filter (where cr.id is not null and not cr.is_specimen)` - or to count
the joined column rather than the star.

---

**AND THE DEFENCE, WHICH IS CHEAPER THAN THE CARE: SELECT THE FIELD THAT WOULD
CONTRADICT THE NUMBER.** It worked twice on 2026-09-14 and neither defect was
visible from its own number alone.

- An all-zero Bloom distribution across every certification looked like "no
  cognitive data exists on this platform". It was caught because the same query
  also selected `unset`, which was **also zero** - every task has a level and
  none matched, which cannot both be true. The enum labels are prefixed
  (`1_remember`, not `remember`) and the query was asking for names that do not
  exist.
- The credential count above was caught because `credentials: 0` sat in the same
  row as `real_awards: 3`.

**A single count has nothing to disagree with.** So when a query is going to
produce a number someone will act on, select a second field whose value is
determined by the first - a total beside a filtered subset, a null count beside a
matched count, a distinct count beside a row count. The pair is the check. This
is the same rule as "assert BOTH DIRECTIONS of the property", applied to a read
rather than to a write.

**A PRIVILEGE CHECK PASSES THE OBJECT, NOT ITS NAME.** The same lesson one
layer down, and it broke the fix for the layer above.

The ACL form measured what was TYPED instead of what is TRUE. The correction
used `has_table_privilege`, which was right -- and reached for the TEXT-NAME
overload, which reintroduced a lookup the OID overload does not need:

```
has_table_privilege('supabase_read_only_user', 'mcp.' || c.relname, 'SELECT')

    ERROR: relation "mcp.pg_stat_statements_info" does not exist
```

**The planner is free to evaluate that constructed identifier on rows a later
predicate would have excluded.** `n.nspname = 'mcp'` was in the same WHERE
clause, and it did not protect the expression: a `relname` from another schema
got `mcp.` prefixed onto it and the lookup failed. The FUNCTION side of the
same query already passed `p.oid`, which is exactly why only the table side
broke.

> **MECHANISM: `has_table_privilege(role, oid, priv)` and
> `has_function_privilege(role, oid, priv)` take the object directly and cannot
> be misresolved.** Inside a migration, `'public.x'::regclass` and
> `'public.f(uuid)'::regprocedure` resolve at parse time and are equally safe.

**A CONSTRUCTED IDENTIFIER INSIDE A WHERE CLAUSE IS A LOOKUP WAITING FOR A ROW
YOU DID NOT INTEND.** It is not a privilege bug and it is not a filter bug; it
is an evaluation-order assumption that SQL does not owe you.

The two rules together are the whole shape: **ask what is true, and ask it
about the object.** Getting the first right and the second wrong turned a
silent wrong answer into a loud abort, which is the better failure -- but it
was still a second run.

**A PRIVILEGE CHECK ASKS WHAT IS TRUE, NOT WHAT WAS GRANTED.** The sharpest
instance of tonight's recurring shape, because the instrument was wrong in a
way that exonerated the exact role running it.

`aclexplode(relacl)` against `aclexplode(proacl)` reported **zero gap on four
views**, while `supabase_read_only_user` -- the role executing the query -- was
sitting in the gap on all four. It reads through **membership of
`pg_read_all_data`**, which confers SELECT and appears in no ACL anywhere.

> **MECHANISM: every privilege assertion uses the `has_*_privilege` family.**
> `has_table_privilege` and `has_function_privilege` resolve membership,
> inheritance and defaults; an ACL comparison sees only what someone typed.

Same instrument, two ways, on the same database, in the same minute: **"no
gap"** and **"eight gaps"**. The ACL form is the obvious way to write it --
it reads like the question -- which is why that note sits at the TOP of
`scripts/sql/check-view-function-grant-gap.sql` rather than in a commit nobody
will open.

**AND A POST-CONDITION GUARDS A WRITE; A CHECK SCRIPT WATCHES A PROPERTY.**
This is the distinction underneath the four aborts, and it is worth stating
separately from "do not use literals".

A post-condition asserts what THIS statement did and what it left alone.
Failing means *do not commit*, and its scope is the rows the migration is
authorised to touch. A check script asks whether a property holds across a
corpus nobody is writing to right now. Failing means *go and look*.

360's fifth post-condition asserted that `pertinencia` appears in **zero**
es-419 concept rows -- a corpus-wide claim over 1,729 rows that migration had
no authority over, which would abort against a perfectly correct database the
first time anyone used the word legitimately somewhere else. It is narrowed to
the two rows 360 changes, and the corpus property moved to
`scripts/sql/check-term-consistency.sql`, which reports and does not fail.

**Every one of the four aborts is this confusion.** 328's `expected 4`, 345's
`12637`, 351's `13` and 352's `98` were all facts about a CORPUS being asserted
inside a gate that guards a WRITE. The literal was the symptom; the misplaced
question was the cause.

**A VIEW'S GRANT LIST MUST NOT BE WIDER THAN THE GRANT LIST OF THE FUNCTION IT
CALLS.** 339's defect, written as a standing assertion instead of something to
remember. `scripts/sql/check-view-function-grant-gap.sql`.

A `security_barrier` view is not `security_invoker`, so tables it queries
directly are checked as the view OWNER -- but a FUNCTION called inside it runs
with the CALLER's privileges. So a role holding SELECT on the view and lacking
EXECUTE on the function gets a 500, and **the gap is invisible from any role
that holds both**, which is every role anyone tests with.

**Measured 2026-09-21. All four function-calling mcp views have a gap:**

```
mcp.concept       concept_row_en_hash       supabase_etl_admin, supabase_read_only_user
mcp.lesson        lesson_body_is_servable   supabase_etl_admin, supabase_read_only_user
mcp.lesson_index  lesson_body_is_servable   supabase_etl_admin, supabase_read_only_user
mcp.task          task_ksa_is_withheld      supabase_etl_admin, supabase_read_only_user
```

The lesson and task gaps have been there since 350 and 341. Production is
unaffected -- `courseware-read` uses `mcp_reader`, which holds both -- so this
is dashboard SQL and ETL, not partner traffic.

**AND THE FIRST VERSION OF THIS CHECK REPORTED ZERO GAP WHILE THE ROLE RUNNING
IT WAS IN THE GAP.** It read `aclexplode(relacl)` against `aclexplode(proacl)`
and compared the explicit grant lists. `supabase_read_only_user` reads through
**membership of `pg_read_all_data`**, which never appears in `relacl` at all.

> **The property is EFFECTIVE privilege, so the check must ask
> `has_table_privilege` and `has_function_privilege` per role.** An ACL
> comparison measures what was typed; those functions measure what is true.

The same instrument, run two ways, gave "no gap" and "eight gaps" -- and the
one that said no gap was being run BY a role it should have named. That is the
closest this file has to a self-demonstrating check failure.

**AND THEN THE FIXED CHECK REPORTED CLEAN WHILE THE ENDPOINT WAS DOWN, BECAUSE
A SECURITY INVOKER FUNCTION IS ONLY AS REACHABLE AS ITS OWN BODY.** Found
2026-09-22 by the wire check. **The heading and the diagnosis below it said
"reaching a function is two gates" and named schema USAGE as the second gate.
That was wrong and is corrected at the end of this entry; the text is kept
because the wrong diagnosis produced a correct fix and that is the part worth
seeing.**

`has_function_privilege('mcp_reader', fn, 'EXECUTE')` is **true** for both
functions `mcp.concept` calls. Every non-English read of that view answers:

```
POST courseware-read {resource: concept, language: es-419}  ->  500
courseware-read failed: permission denied for schema public
```

`mcp_reader` has **no USAGE on schema `public`**, so the call is refused at the
schema door *before the function ACL is ever consulted*. **[WRONG, corrected
below 2026-09-22: a stored view holds its functions by OID and no name
resolution happens at read time. The refusal came from INSIDE
`translation_hash`.]** The previous rule
replaced `aclexplode` with `has_*_privilege` because one measures what was
TYPED and the other what is TRUE. Both of those measure **the function**. The
property is **reachability**, and the function grant is only half of it.

> **MECHANISM: a view/function gap check asks `has_function_privilege` AND
> `has_schema_privilege(role, <the function's schema>, 'USAGE')`, and reports
> WHICH gate is shut** -- because the two need opposite fixes. A missing
> EXECUTE is a grant. A missing schema USAGE **must not** be fixed by granting
> schema USAGE.

> **[SUPERSEDED 2026-09-22. `has_schema_privilege` is the WRONG predicate here
> and it over-reported three working partner-facing views -- see the correction
> at the end of this entry.]**

**Measured before choosing, rather than argued:** granting `USAGE ON SCHEMA
public` to `mcp_reader` would expose **217 public functions** (16 of them
SECURITY DEFINER, running as `postgres`) to the partner-facing read role, which
today can select **zero** public relations. That isolation IS the schema grant.
365 moves the call site instead -- thin `mcp.` wrappers that **delegate to the
public originals rather than reimplementing them**, because a second copy of a
hash diverges and the divergence surfaces as rows withheld for an arithmetic
difference rather than for an edit.

**AND THE REASON NOBODY SAW IT IS THE SHARPEST PART: THE ONLY LANGUAGE THAT
CANNOT EXERCISE THE BROKEN PATH IS THE ONE EVERYTHING WAS TESTED IN.** No
`concept_translations` row has `language = 'en'`, so an English read finds no
candidate row, never evaluates the join predicate, and never calls either
function. **English passed for the entire life of the defect** -- four
migrations, two of which touched this predicate.

Same family as "a branch that has never executed because a precondition is
unmet reads exactly like one that works", with the precondition being the
ABSENCE of data rather than its presence. A test corpus that cannot reach the
call site is not a weak test; it is not a test.

**ONE ERROR STRING FOR TWO CAUSES, AND THE INSTRUMENT MANUFACTURED THE SECOND
ONE.** Found 2026-09-22, minutes after the wire check was written.

`courseware-read` answers `{"error":"read failed"}` for BOTH:

```
permission denied for schema public             deterministic -- a real defect
no more connections allowed (max_client_conn)   transient -- load
```

The matrix fires 75 sequential calls, each waking an isolate that takes a
pooler connection, and the invariant suite ran it a second time immediately.
`lesson_index` came back 500 in three languages and **was read as the same
defect as `concept`**. It is not broken; the check exhausted the pooler and
then reported the wreckage as a finding. English failed too, which is the tell
-- the real defect cannot touch English.

> **MECHANISM: where the endpoint gives one string to two causes, a black-box
> check separates them BY PERSISTENCE.** A permission failure survives any
> backoff; exhaustion clears. A cell fails only after every attempt fails with
> a growing delay, and the check paces itself -- **measuring a surface must not
> be the heaviest thing that surface has seen.**

Same family as the IPv6 note and the missing `apikey` header: **the error names
the wrong half of the system**, and here it names the same half for two
unrelated halves. The endpoint should distinguish them; until it does, the
caller has to.

**A GUARD THAT MANUFACTURES THE FAILURE IT REPORTS IS WORSE THAN NO GUARD**,
because the report is indistinguishable from a real one and arrives with the
authority of an instrument.

**THE VIEW IS NOT THE ENDPOINT, AND ONLY ONE OF THEM IS THE CLAIM.** Querying
`mcp.concept` as an admin reported **158 of 158 serving**, correctly -- the
gate had done its work and the rows were there. The claim being made was that
a partner's agent would receive them, and the only thing that can test that is
the deployed function answering an unauthenticated request. `.mjs` against
PostgREST with the service-role key is the same mistake in a different
costume: **the credential the test holds IS the hypothesis.**

**THE CORRECTION, 2026-09-22: IT WAS NEVER SCHEMA USAGE, AND THE DATE WAS
WRONG TOO.** Everything above diagnosed a gate that does not exist on this
path. Measured, as `mcp_reader`, holding no USAGE on `public`:

```
POST courseware-read {resource: lesson_index, language: es-419}  ->  200
aims-ia-01-01-who-commissioned-it   body_available=false
```

`mcp.lesson_index` SELECTS `public.lesson_body_is_servable(l.id)` and the values
came back. **A stored view holds its functions by OID in the rewrite rule, so no
name lookup happens at read time and schema USAGE is never consulted.**

The real gate was one level in:

| function | security | body runs as | verdict |
|---|---|---|---|
| `public.concept_row_en_hash` | DEFINER | postgres | fine |
| `public.lesson_body_is_servable` | DEFINER | postgres | fine |
| `public.task_ksa_is_withheld` | DEFINER | postgres | fine |
| **`public.translation_hash`** | **INVOKER** | **mcp_reader** | **BROKEN** |

`translation_hash` is `SET search_path = ''`, so its body resolves
`public.ksa_en_hash` **at runtime, in the caller's privilege context** -- and
THAT lookup needs USAGE on `public`.

> **A SECURITY DEFINER FUNCTION IS REACHABLE BY ANYONE HOLDING EXECUTE. A
> SECURITY INVOKER FUNCTION IS ONLY AS REACHABLE AS EVERYTHING ITS BODY
> TOUCHES**, and a `search_path` of `''` makes every one of those touches a
> fully-qualified runtime lookup the CALLER must be able to perform.

**So the outage dates to 364**, which put `translation_hash` into the predicate
-- not to 359, whose predicate used only the DEFINER function. And
**`mcp.lesson`, `mcp.lesson_index` and `mcp.task` were never latent**: all three
call DEFINER functions, `mcp.lesson` calls its one in a WHERE clause where
nothing can prune it, and all three answer 200 in all three languages.

**The check is corrected to ask EXECUTE as the hard gap and to report SECURITY
INVOKER separately as an advisory**, because a static reader cannot follow a
function body to every schema it resolves. Firing count 7 -> 2.

**TWO INSTRUMENTS DISAGREED AND BOTH WERE RIGHT, BECAUSE THEY WERE LOOKING AT
DIFFERENT DATABASES.** Recorded 2026-09-22 from 366's first run.

The post-condition aborted with `1 role(s) can read mcp.concept and cannot call
its wrapper`. A read-only query straight afterwards found **two**. Same
predicate, same database, different answers -- which reads as an instrument
defect and is a stop condition.

**It is a STATE difference.** The whole migration is one transaction, so when
the DO block ran, its own grants had already applied *in that transaction* and
both named roles were correctly excluded. The exception then aborted the
transaction and rolled the grants back, so the query afterwards saw a database
where neither had it.

> **A POST-CONDITION SEES ITS OWN WRITES. A QUERY AFTER AN ABORT SEES NONE OF
> THEM.** Before concluding that two instruments disagree, establish that they
> ran against the same state.

**AND THE ROLE IT FOUND WAS A THIRD ONE NEITHER NUMBER NAMED.** The 1 was
`pg_read_all_data`; the 2 were the named roles post-rollback. Three roles are
in that gap, and `check-view-function-grant-gap.sql` reported only two because
it filtered `rolname not like 'pg\_%'` -- hiding **the role the other three
reach the view through**.

> **A ROLE FILTER IN A PRIVILEGE CHECK IS A COVERAGE GAP THAT REPORTS CLEAN.**
> The migration's role set was WIDER than the standing check's, which is the
> opposite of what a failing migration usually means.

**AND A COUNT CANNOT BE RECONCILED ACROSS STATES. A NAME CAN.** `1 role(s)` is
unreconcilable with a query returning two; `pg_read_all_data -> mcp.translation_hash`
would have ended the question in one line. Post-conditions here now emit the
offending set via `string_agg`, not its cardinality -- the same rule as
*report the enumeration, not the count*, applied to a gate rather than a report.

**A NOLOGIN ROLE IS NOT A CALLER, AND THE PROOF IS THAT IT HAS ALREADY BEEN
HARMLESS.** `pg_read_all_data` holds SELECT on every `mcp` view and EXECUTE on
none of the four functions they call -- including `lesson_body_is_servable` and
`task_ksa_is_withheld`, **in exactly that state since 341 and 350**, while both
views answered 200 in all three languages throughout. A gap that has sat open
for months without a single refusal is not a pending defect; there is no
session to refuse.

So the check reports **two classes**: HARD GAP for roles that can log in, INERT
for NOLOGIN groups. Inert is still printed, because a NOLOGIN group is how a
future login role inherits SELECT without inheriting EXECUTE -- and filtering it
out is what made this invisible the first time. Measured now: **2 hard, 5
inert.**

**Granting to `pg_read_all_data` itself was the tempting fix and was not
taken.** It would close the class permanently and it extends what a builtin
role means for our schema, to fix something three other view/function pairs
demonstrate causes nothing. Recorded as the alternative rather than adopted.

**AND A GRANT MIGRATION ENUMERATES EVERY ROLE THAT HELD THE PRIVILEGE BEFORE.**
365 granted its new wrappers to `mcp_reader` and `mcp_holder` and silently took
`mcp.concept` away from `supabase_read_only_user` and `supabase_etl_admin`,
which held the PUBLIC originals. Nothing on the partner path noticed, because
nothing on the partner path uses those roles.

> **MECHANISM: before changing what a view calls, enumerate the roles holding
> EXECUTE on the OUTGOING function; grant the incoming one to exactly that set,
> and assert in a post-condition that the set is unchanged.** 366 derives the
> assertion from the originals' grant list rather than typing the role names,
> so it cannot drift from the thing it is restoring.

Second time in a week that a change aimed at the partner path moved something
adjacent -- the first was a casing fix invalidating 44 translations.

**A GATE MUST ASSERT THE PAIRS THAT HAPPEN, NOT THE CROSS-PRODUCT.** The
inline-SQL reachability gate's FIRST REAL RUN blocked a correct deploy,
reporting `mcp.resolve_api_key` and `mcp.resolve_oauth_caller` unreachable by
`mcp_holder`.

**They are, and that is the design.** `courseware-read` authenticates on the
READER pool -- `resolveKey`'s own comment says *"ON THE READER POOL,
DELIBERATELY"* -- and the holder pool exists for exactly one thing,
`resource === "lesson"`. mcp_holder never calls a resolver, so granting it
EXECUTE would WEAKEN the design: the enforcement is that each pool is provably
incapable of the other's work. *"An `if` here could be inverted by a refactor;
a missing grant cannot."*

> **MECHANISM: each function declares the roles that actually call it, with the
> reason, and an UNDECLARED function exits 2 rather than defaulting either
> way.** Which role runs a given statement is exactly the question that was got
> wrong; it must be answered, not inherited.

Firing count after the fix: 6 declared pairs, 6 pass. Before: 10 pairs, 2 false
failures -- and **a gate that over-reports is disabled by the first person it
inconveniences, taking the real assertion with it.**

**AND THE ASYMMETRY IT FOUND IS INTENDED, CONFIRMED FROM THE CODE RATHER THAN
ASSUMED.** `mcp.resolve_api_key` executable by `mcp_reader` and not
`mcp_holder` is the two-pool design working: authentication precedes the pool
choice, so it must run on the reader; the holder credential exists solely to
read `mcp.lesson` and its inability to do anything else IS the paywall.

**AND THE ACCENT WORK LANDED.** `mcp.unaccent` deployed through the gated path.
Equality asserted rather than presence, because a floor would have passed the
broken state -- `gestion` returned 5 of 33:

```
es-419  auditoria    69 == 69   informacion  26 == 26   gestion 37 == 37
pt-BR   avaliacao    14 == 14   secao        59 == 59
negative   an absent term returns 0 in all three languages
negative   `gestor` returns 0 against the accented term's 37 -- no collapse
english    80/78/23/5/34/39, identical to baseline BY IDS
```

Latency, endpoint, same 10-sample method: median **0.375s -> 0.386s**, max
1.108s -> 0.598s. Server-side the materialized form measured 20.9 ms against a
19.1 ms baseline; **the deployed wrapper could not be measured from the
read-only connection, because 369 correctly revokes it there** -- stated rather
than estimated.

**The wire matrix now carries the PROPERTY, not one spelling of it.** A matrix
holding only the accented form would pass unchanged if unaccent were reverted
tomorrow -- it would be measuring the half that never broke. English reports
NOT EXERCISED rather than carrying a duplicate cell that always passes.

**ABSENCE OF A RESULT IS A THIRD STATE, AND COLLAPSING IT INTO EITHER OF THE
OTHER TWO PRODUCES A CONFIDENT WRONG ANSWER.** ONE RULE, FIVE OCCASIONS IN ONE
WEEK. Filed together deliberately: five separate entries would be read as five
curiosities, and this is the shape of the most common bug in this codebase.

| the third state | what it was collapsed into | what that produced |
|---|---|---|
| `matchingSources` returned `[]` for NOT ASKED | *nothing matched* | 226 spans printed `(none reported)`; 170 had a source |
| the 19011 clause-4 anchor could not be verified | a percentage | two confident wrong figures, 1.27% then 2.52% |
| wire-matrix `lesson` cells had no key | a pass | three cells claiming coverage they had not earned |
| wire-matrix `search` cells returned zero | a pass | 75/0 reported while es-419 returned nothing for two days |
| the deploy gate could not START | a gate that FAILED | *REACHABILITY GATE FAILED* printed for a path error, sending the reader to debug privileges |

> **MECHANISM: every instrument has THREE outcomes -- it answered yes, it
> answered no, or it could not answer -- and the third is reported under its
> own name.** `UNSOUND`, `UNASSERTED`, `NOT EXERCISED`, `UNVERIFIABLE`,
> `could-not-run`. A function whose empty return is indistinguishable from a
> real negative either throws or returns a third value.

**AND THE FIFTH INSTANCE WAS TWO WINDOWS TRANSPORT DEFECTS IN MY OWN GATE**,
which is the fifth transport surprise of the week:

- `shell: true` re-parsed `process.execPath` -- `C:\Program Files
odejs
ode.exe`
  -- and the step died with *'C:\Program' is not recognized*.
- `process.exit(2)` with fetch keep-alive sockets still open **aborts libuv on
  Windows, and the abort REPLACES the exit code**, so the caller read a
  different number and branched wrongly. `process.exitCode = n` and let Node
  drain; `process.exit()` with open handles is not safe to read from a caller.

**A QUIETLY ALTERED ARTIFACT IS WORSE THAN TWO PASTES.** When a migration has
been read and approved, a change that belongs to a different subject goes in
its OWN migration -- even when folding it in would save a round trip. The
approver's memory of what they read is part of the record, and silently
invalidating it costs more than the paste.

Occasion: 370 was written separately from the approved 369 rather than added to
it.

**AND PRIVILEGE INTROSPECTION ON AN EXPOSED SCHEMA IS ITSELF AN EXPOSURE.**
370 adds a function that enumerates which roles can reach what -- on a database
where PostgREST turns a `public` function into an HTTP endpoint unless
something revokes it. Measured before deciding:

```
anon USAGE on public                                     true
anon USAGE on mcp                                        FALSE
PostgREST exposes public   (rpc/lesson_body_is_servable)  200
PostgREST exposes mcp      (rpc/unaccent)                 404
a revoked public function, anon key                       401
the same, no key at all                                   401
```

`mcp` would be stronger -- invisible to PostgREST entirely -- **and the deploy
gate reaches this database through PostgREST and nothing else, so an `mcp`
function it cannot call is a gate that cannot run.** So: `public`, revoked from
PUBLIC, granted to `service_role` alone, and the post-conditions assert BOTH
directions. An earlier draft did the revoke and asserted only that the function
works: a revoke that silently failed would have left an open
privilege-introspection endpoint with every post-condition green.

**A PRE-DEPLOY CHECK THAT IS NOT IN THE DEPLOY PATH IS A RULE, NOT A CHECK.**
Ruled 2026-09-24 after the second partner-surface outage in a week. **The
difference between a rule and a check is that a check cannot be forgotten.**

Both halves of that outage were this distinction:

| | |
|---|---|
| the RULE existed | CLAUDE.md records, from 364, that a reachability check asks `has_function_privilege` AND `has_schema_privilege` and names which gate is shut. Nothing triggered it |
| the CHECK existed and covered the wrong path | `check-view-function-grant-gap.sql` walks functions named inside VIEWS. The call site that failed was **SQL assembled in TypeScript** |

> **MECHANISM: a check whose purpose is to prevent a deploy RUNS AS PART OF
> DEPLOYING, and a deploy path with no such gate is documented as having
> none.** `scripts/deploy-courseware-read.mjs` is type check, reachability
> gate, deploy, smoke -- and any step can stop it.

**AND A POST-DEPLOY SMOKE IS THE OTHER HALF, BECAUSE ROLLBACK SPEED IS WHAT
MAKES AN OUTAGE CHEAP.** One unauthenticated call per tool, English only,
asserting 200 AND non-empty -- thirty seconds. It is not prevention: **the
thing that makes an outage cheap is not preventing every one, it is noticing in
ten seconds rather than ten minutes.** On failure it prints the ROLLBACK
COMMAND, not only the error, because a smoke test that fails at 2am and prints
a stack trace has told you the wrong thing.

**THE DEPLOY WRAPPER THEN COMMITTED THE DEFECT IT EXISTS TO PREVENT, TWICE.**
Worth recording because it is the same class both times:

1. `shell: true` on Windows re-parsed `process.execPath`
   (`C:\Program Files
odejs
ode.exe`) and the step died with *'C:\Program'
   is not recognized* -- and the wrapper reported **REACHABILITY GATE FAILED**,
   sending the reader to debug privileges when the problem was a path.
2. `process.exit(2)` inside the gate, with fetch keep-alive sockets still open,
   **aborts libuv on Windows and the abort REPLACES the exit code** -- so the
   wrapper read a different number and again took the wrong branch.

> **A STEP THAT COULD NOT START IS NOT A STEP THAT FAILED.** Three outcomes,
> not two: ran-and-passed, ran-and-failed, could-not-run. Folding the third
> into the second is the one-error-string-for-two-causes shape arriving
> through process teardown rather than through an endpoint.

`process.exitCode = n` and letting Node drain is the fix; `process.exit()` with
open handles is not safe to read from a caller.

**AND THE INCIDENT RECORD IS `INCIDENTS.md`, WITH DURATIONS.** Two outages in a
week on one failure class -- 364 and this -- **both schema reachability, both
self-inflicted by a change aimed at improving something.** A duration that
lives only in a transcript is a duration nobody can quote, and *we do not know*
is a worse answer than a figure.

This one is recorded as **bounded 15-22 minutes** rather than to the minute,
because the start is bounded by a deploy whose completion time was never
recorded. 364's is recorded as **not measured** rather than estimated.

**The tell worth keeping: it hit ENGLISH too.** That is what separated it from a
translation-layer fault immediately. If English is affected, the cause is not
about language.

**ANYTHING NON-ASCII CROSSING A SHELL BOUNDARY IS CONSTRUCTED, NEVER TYPED.**
Four transport surprises in four days, all the same class:

| | |
|---|---|
| backslash collapse | a shell heredoc ate `\s`, so a tab class arrived as a literal tab and 28 checks reported NOT FOUND |
| apostrophe mangling | a quoted heredoc in Git Bash failed to parse on `organization's` |
| a paste that may not be one transaction | `on commit drop` vanished between two statements in the SQL editor |
| an accent eaten | `auditor` + i-acute inline in a `curl` reached the endpoint as something else and returned 0 |

**The channel between an authored artifact and its execution is not
transparent, and every one of the four was discovered by a FAILURE rather than
by a check.** Three produced a wrong answer that looked plausible; the fourth
produced a wrong answer that AGREED WITH THE HYPOTHESIS UNDER TEST.

> **MECHANISM: build non-ASCII from `String.fromCharCode` / `chr()` / a
> `\uXXXX` escape, or send it as a FILE the shell never parses.** Same class
> as the BOM-safe write convention already recorded here, and the same class as
> the mojibake rule: the transport corrupts the text, not the author.

**A HYPOTHESIS OFFERED BY WHOEVER IS DIRECTING BIASES THE EVIDENCE COLLECTED
FOR IT.** Recorded 2026-09-23 at the director's own instance.

A ranked candidate list was supplied -- *"the third is the one I would look at
first, because a missing text-search configuration produces exactly this
shape"* -- and the first probe CONFIRMED it, returning 0 for the accented term.

**The candidate was structurally impossible**: search uses a word-boundary
regex and no full-text configuration at all. The confirmation was a shell
eating an accent.

> **MECHANISM: a confirmation of a STATED EXPECTATION is checked against a
> second, independent instrument before it is reported -- the same standard a
> disconfirmation would get.** A ranked list is a useful starting point and a
> bad stopping point, because the first confirming observation ENDS THE SEARCH.

What caught it was not scepticism about the hypothesis. It was that **the
database returned 19 rows for the identical regex** -- two instruments
disagreeing, which is this file's own rule applied to a factor of infinity
rather than of four.

**AND THE TEST BUG UNCOVERED A REAL PRODUCT DEFECT WORTH MORE THAN ITSELF.**
Search is ACCENT-SENSITIVE on a mobile-first LATAM product:

```
gestion       5 rows      gestion-with-accent      33
informacion   0 rows      informacion-with-accent  26
secao         0 rows      secao-with-cedilla       59
```

**751 distinct accented words in the es-419 corpus (12.9 percent of its
vocabulary) and 1,008 in pt-BR (16.9 percent)**, and every one of the top
fourteen in each is a plausible query term. `ACCENT-SENSITIVITY.md` carries the
exposure and the `unaccent` proposal; nothing is deployed.

**The 5-of-33 case is the dangerous one, not the zeros.** An empty result makes
a user question their spelling. A short result looks like an answer.

**AND WHERE A CONTROL CAN BE PROVED WITHOUT TOUCHING PRODUCTION, IT SHOULD BE.**
`verify-367` costs a live lesson a few hundred milliseconds of darkness and
needs a recovery file to be safe. The wire matrix's new expectation logic is
proved on SYNTHETIC responses -- a floor that fails on zero, a floor that
passes when met, an undeclared resource that abstains -- offline, free, and
unskippable by a quiet endpoint. Production controls are the exception that
earns the recovery guard, not the default.

**A MEASUREMENT WITHOUT AN EXPECTATION IS A RECORD, NOT A TEST.** Found
2026-09-23. The wire matrix reported **75 pass / 0 fail** while es-419 search
returned ZERO on every certification, and had done for at least two days.

It recorded row counts and compared them to nothing. So a cell returning zero
forever was indistinguishable, to the matrix, from a cell working perfectly.
**A suite that stores what happened can detect CHANGE; it cannot detect
WRONGNESS, and reporting it as pass/fail claims it can.**

> **MECHANISM: every cell carries an expectation -- a floor, a range, or an
> explicit "zero is correct here and this is why" -- and a cell with no
> expectation is reported as UNASSERTED, never as a pass.** `NOT EXERCISED` was
> already the right precedent: three cells refusing to claim something they had
> not earned. Zero rows with no stated reason is the same class.

The summary now carries THREE numbers. `n pass, m fail` cannot say whether a
cell asserted anything.

**AND THE SPANISH SEARCH DEFECT WAS IN THE TEST, NOT THE PRODUCT.** The
matrix's query term was:

```
const QUERY = { en: "audit", "es-419": "auditoria", "pt-BR": "auditoria" };
```

Spanish is `auditoria` WITH AN I-ACUTE; Portuguese is `auditoria` without. **The
same literal is correct for one language and matches nothing in the other.**
Measured on AIMS-IA es-419 tasks: 19 rows match the accented form, **0** match
the unaccented one. At the endpoint with the correct term: **69 rows**, against
pt-BR 70 and English 80.

**Spanish search was never broken. The matrix asked Spanish a question Spanish
text cannot answer and scored the silence as a pass.**

> A CONSTANT THAT IS CORRECT FOR ONE MEMBER OF A SET AND WRONG FOR ANOTHER IS
> THE SAME DEFECT AS A SINGLE-LANGUAGE VOCABULARY PATTERN, and this file already
> records that one. One literal, three languages, and nobody asked whether it
> meant the same thing in each.

**AND THE INVESTIGATION PRODUCED A FALSE CONFIRMATION, WHICH IS THE FOURTH
TRANSPORT SURPRISE THIS WEEK.** A `curl` with the accented term inline returned
**0** -- the shell mangled the character -- which looked exactly like a product
defect and agreed with the hypothesis under test. It was caught only because
the DATABASE said 19 rows with the identical regex, so two instruments
disagreed. Sending the body as a UTF-8 file returned 69.

The query terms are now built with `String.fromCharCode` rather than typed, and
this is the fourth: backslash collapse, apostrophe mangling in a quoted
heredoc, a paste that may not be one transaction, and now an accent eaten
between a shell and an HTTP body.

**AND THE pt-BR JUMP WAS THE CONCEPT WORK LANDING, CHECKED RATHER THAN
ASSUMED.** pt-BR search went 20 -> 70, 14 -> 64, 2 -> 14 in a day.
`courseware-query` searches concepts for a non-English language ONLY when that
language has cleared concepts; measured now, es-419 is 157/158 cleared and
pt-BR 155/158, so both search task AND concept where pt-BR previously searched
tasks alone. The magnitudes agree -- es-419 69, pt-BR 70, English 80.

**AND A CHECK CONSTRAINT IS A CONTROL THAT CANNOT GO STALE.**
`lessons_mcp_scan_coherent` -- `mcp_servable = false OR (longest_run AND
scanned_at AND scan_sources all present)` -- was written for the scanner and
caught `verify-367`'s restore path two columns short, refusing to leave a row
in a state the scanner could never produce.

> **WHERE A SET OF COLUMNS MUST TRAVEL TOGETHER, A CHECK CONSTRAINT IS CHEAPER
> AND STRONGER THAN A CONVENTION.** It constrains a COHERENCE property of the
> row rather than anticipating a caller's mistake, so it catches callers
> nobody imagined -- and it is pinned to no defect, so it can never expire.

**A MIGRATION'S ATOMICITY IS A PROPERTY OF THE TRANSPORT, AND THE TRANSPORT
IS MEASURED, NOT ASSUMED.** Found 2026-09-23. 367 used a temporary table to
capture its before-state and the SQL editor answered:

```
ERROR: 42P01: relation "_367_before" does not exist
```

`begin; ... commit;` in a file asserts an INTENT. Whether the client, the
editor or the pooler honours it as ONE TRANSACTION ON ONE BACKEND is a separate
fact -- **and a post-condition that cannot roll back its own writes is a
comment.**

**TWO CANDIDATE CAUSES WITH OPPOSITE IMPLICATIONS, AND THE DIFFERENCE IS NOT
ABOUT 367:**

| | | |
|---|---|---|
| **A** | the editor splits on semicolons and autocommits each | **no migration ever run through the editor was atomic**, and every post-condition that "aborted" did so after its own writes had committed |
| **B** | one transaction, but the pooler moves statements between backends | a temp table on one is invisible from another. 367 breaks; atomicity is intact |

**Evidence favours B** -- migration 366 v1 aborted on its own post-condition and
ROLLED BACK, so a transaction was being held that day. That is an INFERENCE,
and `scripts/sql/probe-editor-transaction.sql` measures it: a temp table and
`pg_backend_pid()` as the first and last statement of one paste. Same pid with
the table missing means A; different pids mean B.

> **MECHANISM: a migration that must be atomic is written as ONE STATEMENT --
> a single `DO` block, before-state in a variable rather than a temp table,
> DDL and `create or replace function` inside it via distinct dollar tags.**
> One statement is one transaction under every pooling mode. Or the transport
> is probed and the result recorded. Not assumed either way.

Same principle as the count assertion in `_pg.mjs`: **do not rely on a property
of the transport, assert the property you need.**

**AND IT IS THE THIRD TRANSPORT SURPRISE THIS WEEK.** Backslash collapse
through a shell heredoc; apostrophes mangling a quoted heredoc in Git Bash; and
now a paste that is not one transaction. **The channel between an authored
artifact and its execution is not transparent, and every time we have found
that out through a failure rather than through a check.**

**A COLUMN NAME IS A CONTRACT, AND `en_hash` HAD ALREADY BROKEN IT TWICE
BEFORE A THIRD COLUMN NEARLY TOOK THE NAME.** Found 2026-09-23 while writing
367.

Both of these live inside `lesson_body_is_servable`, in one predicate:

```
lesson_translation_reviews.en_hash   left(md5(content_md), 8)
lesson_translation_reviews.tr_hash   public.translation_hash(content_md)
```

**Two hash columns on ONE table, computed two ways.** Measured on a real body:

```
left(md5(x), 8)              ->  8b7691a0
public.translation_hash(x)   ->  2c5a80ff        same = false
```

`translation_hash` length-prefixes each field, strips CR, and joins with
separators, so it cannot be confused by a body containing the delimiter and it
is stable across CRLF. Plain md5 has none of that.

> **TWO COLUMNS SHARING A NAME AND COMPARED AGAINST DIFFERENT COMPUTATIONS
> INSIDE ONE PREDICATE IS A DEFECT REGARDLESS OF WHICH COMPUTATION IS
> CORRECT**, because the next reader carries the meaning across. This is the
> `mcp_servable` lesson with the roles reversed: there a name promised more
> than it delivered; here a name promised SAMENESS THAT WAS NOT THERE.

367's column is therefore `en_content_hash`, not `en_hash`, and it names its
function in its own comment.

**OPEN ITEM, NOT DONE, WITH ITS COST STATED.** The review arm's `en_hash` is
plain md5 while every other hash in this system is `translation_hash`.
**Unifying it would invalidate all 41 existing reviews at once and withhold
their rows.** That is a decision with a real cost and it does not belong inside
a migration whose subject is a different gate. It has NOT been done. Recorded
here rather than remembered, because an open item that lives only in a
transcript is an item that does not exist.

**A STAMP DOES TWO JOBS AND THEY MUST BE LABELLED SEPARATELY.** Ruled
2026-09-23 on 367's initial stamp, and the first draft got it half right.

| | |
|---|---|
| **(a) a claim about the PAST** | this translation tracks this English |
| **(b) a mechanism for the FUTURE** | a baseline from which the next edit is detected |

Refusing (a) for the 77 lessons the parity check never covered was correct --
stamping them would be grandfathering. **But refusing (a) also declined (b) for
them**, so they would carry NULL, the gate ignores NULL, and their review flag
is unarmed: an English edit tomorrow would withhold nothing. That is the
morning's failure, still live, on 77 lessons instead of eight.

> **The blindfold was the stamp being UNLABELLED, not the stamp existing.**
> Every translated row is stamped, and `en_content_hash_basis` records which
> job the stamp is doing -- `proved` on the 61 the parity check confirmed,
> `baseline` on the rest -- with a CHECK that the basis is present whenever the
> hash is. `en_content_hash is not null` can no longer be read as a clearance.

**AND A CONTROL THAT LIVES IN A COMMENT HAS NEVER FIRED.** 367's first draft
put its demonstration in a SQL comment, four lines under a header quoting *a
hash gate nobody has watched fire is the same object as a count assertion
nobody has watched fail*. The post-conditions assert the NEGATIVE direction
thoroughly -- nothing mis-stamped, servability moved on zero rows -- and every
one of them passes just as cleanly if the new clause is dead code.

`scripts/verify-367.mjs` edits one English body, asserts the English STAYS
servable and BOTH translations go dark, restores byte-for-byte, and re-reads
all three. Both directions, because a predicate that withheld everything would
pass a one-sided check.

**AND `finally` DOES NOT COVER THE FAILURE THAT MATTERS.** PostgREST gives no
transaction to hold, so the script is NET-ZERO rather than read-only: it
PATCHes a live released lesson and PATCHes it back. A thrown assertion is
caught; a kill or a dropped connection between the two writes is not, and would
leave a lesson edited with its translations dark and nothing on disk saying
what the body used to be.

> **MECHANISM: the thing that lets you undo must OUTLIVE THE PROCESS that
> needs undoing.** The original goes to a recovery file before the first write
> and is deleted only after the restore verifies; if that file exists at
> startup the script refuses to run and prints `--recover`.

**PROSE INSERTED INTO A QUOTATION BLOCK INHERITS THE BLOCK'S JOB.** Found
2026-09-23, minutes after applying the ceiling conversions, by the scanner
rather than by reading.

Each conversion replaced an over-ceiling blockquote line with *a short
quotation plus our sentence*. Where the replaced line sat in the MIDDLE of a
multi-line quotation, the inserted prose became the new LEAD-IN for every quote
line beneath it -- and our sentence carried no citation, so the remainder of
clause 10.2 was judged unattributed. `isms-ia-05-05` came back refused at 18w.

**The 18w span is a real reproduction of 42001 and it had always been there.**
It was exempt because the block above it was attributed. The repair cut the
chain, not the text.

> **MECHANISM: prose inserted inside a quotation block must itself name the
> clause**, because it is the lead-in for everything below it. A conversion
> that explains a quotation in the middle of one has to re-state the citation,
> or it silently un-attributes the remainder -- and the script that does it
> asserts `ADDRESS_RE` matches its own replacement text.

Same family as the segmenter defect an hour earlier and worth filing with it:
**an edit made for one span removed the evidence a NEIGHBOURING span depended
on.** Both times the unit of the change was smaller than the unit of the
property.

**A CONVERSION IS NOT A TRUNCATION.** The ten over-ceiling quotations came back
as *a short marked quotation plus our sentence*, never as the same quotation
with its tail deleted. A 52-word quotation cut to 25 is worse teaching than a
five-word quotation plus an explanation, because the whole point of the ceiling
is that we EXPLAIN rather than DELIVER.

The phrase stays quoted where the WORDING is the examinable thing -- `some
degree of verification`, `wherever practicable`, `of external origin` -- and
everything else moves into our voice. Measured: **337 quoted words became 106**,
and every edit declared the modal, conjunction and defined terms it had to
preserve, asserted before the write.

```
52w -> 5w    45w -> 10w   45w -> 17w   30w -> 7w    29w -> 11w
29w -> 10w   27w -> 11w   27w -> 17w   27w -> 10w   26w -> 10w
```

**AND THE CEILING IS ENFORCED ON ENGLISH ONLY, WHICH IS NOW CONCRETE RATHER
THAN THEORETICAL.** The leak index holds English editions, so a translated
quotation scores 0 by construction and a lesson group takes its verdict from
the English sibling.

So after this batch: `isms-ia-03-02`'s English carries a 5-word quotation and
its **es-419 and pt-BR bodies still carry the full 52-word quotation,
translated** --

```
es-419  "> La evidencia de auditoria debe ser verificable. Debe basarse en
         **muestras** de la informacion disponible, ya que una auditoria se
         lleva a cabo durante un periodo determinado y con recursos finitos..."
```

-- and `lesson_body_is_servable` returns TRUE for both, because that group has
`mcp_translation_review_required = false`. **The ceiling was ruled for the
corpus and applied to a third of it.**

> **The translated bodies of every converted lesson are now BOTH over the
> ceiling AND divergent from their English source.** That is two problems, not
> one: a reproduction the index cannot see, and a lesson that says different
> things in different languages. Neither is detectable by any instrument here.

**AND `mcp_servable` SAID TRUE WHILE THE GATE SAID FALSE, ON SIX OF THE EIGHT.**
The column is per row and the FUNCTION additionally requires an approved,
hash-current translation review. Six translated rows are withheld by the review
gate and their column reads `true`. The column is not the gate -- checked with
`lesson_body_is_servable()` rather than read off the row, which is the only
reason the two `isms-ia-03-02` rows were identified as genuinely serving.

**A LEXICAL PROXY STANDS IN FOR THE PROPERTY IT APPROXIMATES, AND IT WORKS ON
THE CORPUS THAT MOTIVATED IT.** Two instances in one change, which is why it is
a class and not a note:

| the proxy | the property | how it failed |
|---|---|---|
| markdown `>` | is this attributed | an inline citation naming standard AND clause scored as a leak; a blockquote was exempt at any length |
| a decimal `\d+\.\d+` | is this a clause address | ANY decimal near a span attributed it |

**All 25 bare-number attributions in the corpus were read and all 25 are
genuine** -- `Clause 5.1 opens:`, `Annex A control 5.9`, `Clause 9.2.2 c):`.
That is a fact about today. The RULE said *a decimal near a span attributes
it*, so *the sample supported 21.80 percent of the population* beside a long
ISO run would exempt it. Nothing does that today; nothing stopped tomorrow.

> **MECHANISM: an address counts when it is ANCHORED** -- introduced by
> clause, annex, control, section, subclause, table or their Spanish and
> Portuguese equivalents -- **or when it carries a lettered sub-item** like
> `9.2.2 c)`, which no percentage or version string does. A bare decimal with
> no anchor is a number.

**Re-measured before adopting, and the tightening cost nothing:** attributed
stays 59 of 61, withholdings stay 0, the over-ceiling set stays 10. Three
occurrences lost an unanchored decimal and kept attribution through the named
standard. `checkAddress()` asserts BOTH directions -- nine anchored forms drawn
from real lead-ins must match, five percentages and version strings must not --
and it is a scanner control, so a future tightening that breaks a real lead-in
fails loudly instead of silently withholding correct quotation.

**AN ERROR IN THE CONSERVATIVE DIRECTION IS NOT SELF-CORRECTING.** This is the
sharpest thing in the week and it cuts against a ruling made twice.

An instrument that OVER-withholds produces findings that look like rigour.
Nobody investigates a refusal. Nobody files a bug against a gate that was too
strict. The false positives read as the system working -- so **a conservative
error survives longer than a permissive one** and is found only when somebody
reads the members.

> **MECHANISM: over-refusals are sampled and READ on the same schedule as
> under-refusals, and a gate whose refusals have never been read is treated as
> UNVALIDATED regardless of direction.**

Occasion: nine occurrences reported unattributed by a fixed two-line look-back,
every one of them attributed six lines up, inside a block.

**Withholding is safe for the CORPUS and unsafe for the INSTRUMENT, and those
are different things.** The safe-direction rule governs what to ship; it does
not excuse the instrument from being checked in that direction.

**AND A FIELD THAT DOES NOT TRAVEL BECOMES A NEGATIVE FINDING DOWNSTREAM.**
Filed with `matchingSources` returning empty for NOT ASKED, because it is the
same defect one layer out: there a function's empty return was read as a real
negative; here a persisted record omitted `term`, so a downstream reader could
not distinguish a declared phrase from an undeclared one and rebuilt the de
facto vocabulary list with **the single genuinely declared phrase at the top of
a list of undeclared ones.** The console had it right and the artifact did not.

> **Every field a verdict depended on travels with the record**, not only the
> verdict -- and a reader that cannot tell "absent" from "not recorded" must
> be given a third value rather than an empty one.

**THE QUOTATION EXEMPTION WAS KEYED ON MARKDOWN FORM, AND FORM IS EVIDENCE OF
NOTHING.** Ruled and rebuilt 2026-09-23. `attributedQuote` was
`isQuoteLine(line) && isAttributed(line, leadIn)` -- exempt if the author
reached for `>`. It failed in BOTH directions at once:

| | |
|---|---|
| UNDER-EXEMPTED | *ISO 19011:2026 clause 3.8 defines audit criteria as the set of requirements used as a reference against which objective evidence is compared* names the standard, the clause AND the term, and scored as a leak. **18 of the 19 repeated-run findings carry a citation somewhere.** |
| OVER-EXEMPTED | a blockquote was exempt at ANY length. That is how **52 contiguous words of ISO 19011** came to sit in a released certification with nobody having decided it. |

Rebuilt: a span is exempt when a citation sits within a bounded distance of
**that occurrence**, and it is within `QUOTATION_CEILING` (25 words, ruled by
Juan). The ceiling now applies to attributed quotation AS A CLASS -- before, it
governed one syntax and exempted the other entirely.

**AN EXEMPTION ATTACHES TO AN OCCURRENCE, NEVER TO A PHRASE.** The same nine
words attributed in one lesson and bare in four is **one attributed quotation
and four reproductions**, not a run that is 80 percent attributed. A property
some instances have and others lack cannot be carried by the text itself;
exempting the phrase launders the unattributed uses under cover of the
attributed one.

> That also names the repair for the bare ones: not *rewrite the phrase* but
> **attribute it where it is used, or stop using it there.**

**A CUT IS A STATEMENT ABOUT DOCUMENT STRUCTURE. AN EXEMPTION IS A STATEMENT
ABOUT ONE SPAN.** The first attempt keyed `segments()` itself on attribution,
and a fixture caught it on the first run. Two things followed:

- every prose line carrying a clause number stopped being measured at all;
- cutting the LEAD-IN broke the lead-in CHAIN, so the blockquote beneath it was
  judged with no attribution -- and **ISMS-IA went from 0 refusals to 72**, the
  52-word span among them.

Collapsing the two meant a span-level judgement deleted a line. `segments`
keeps cutting on FORM, which is what segmentation is for; the attribution test
moved to where the occurrence lives.

**AND A FIXED LOOK-BACK WINDOW IS NOT A LEAD-IN.** The movement measurement
used *the two preceding non-blank lines* and reported NINE occurrences as
unattributed. Read, all nine were lines INSIDE a multi-line blockquote whose
lead-in sat four or six lines up; their windows contained nothing but more
blockquote. **Not nine reproductions -- one measurement error, in the
withholding direction, which is the direction that looks like diligence.**
`segments` already had it right: the lead-in is the most recent non-blank,
NON-BLOCKQUOTE line, so a block inherits the attribution introducing it.

**Measured movement before deploying, both directions:**

```
occurrences at or over 10w              61
exempt today (blockquote + attributed)  57
attributed under the rebuilt rule       59
  STOP being exempt (withhold)           0
  BECOME exempt   (RELEASE)              2   read before deploying
  attributed AND over the 25w ceiling   10   <- what the ceiling bites on
```

**And the strict reading was measured rather than assumed.** *Standard AND
clause* attributes only 15 of 61 and would withhold 44 properly attributed
occurrences -- because CLAUDE.md already records that an unqualified clause
reference means the certification's OWN standard. The bare-number cases were
READ, not counted: `Clause 5.1 opens:`, `Annex A control 5.9`, `Clause 9.2.2
c):`. Real addresses. **LOOSE adopted.**

**A FIELD DROPPED FROM A PERSISTED RESULT IS REBUILT WRONGLY DOWNSTREAM.**
`REPEATED-RUNS.json` omitted each run's `term`, so the de facto vocabulary
list was regenerated from it with the ONE genuinely declared phrase at the top
of a list of undeclared ones. The console had it right and the artifact did
not -- the same shape as the script that printed 77 and persisted 79. **The
number that leaves the process is the one that has to be right, and so is every
field the verdict depended on.**

**THE DE FACTO VOCABULARY IS NOT THE DECLARED ONE: 19 phrases, 4+ rows, no
concept.** `be carried out in a planned manner` in seven rows, `based only on
the audit evidence` in six, `the organization's own requirements for its ai
management system` in five. Exactly one of two things is true of each and
neither is the present state: it wants a concept, or it should be written
differently each time. **An auditor taught vocabulary the exam does not test
has been taught the wrong exam.**

**PLAUSIBILITY IS NOT EVIDENCE, AND A NUMBER THAT LOOKS REASONABLE IS THE ONE
THAT SHIPS.** Three instances in two days, filed as ONE rule because they are
one mechanism wearing three costumes:

| the number | it looked like | it was |
|---|---|---|
| 27 percent of fires manufactured | a plausible artifact rate | 69 real reproductions about to be cleared |
| 1.27 percent of 19011 quoted | a plausible quotation fraction | a wrong clause-4 anchor, twice |
| nine-word runs | plausible collisions | some were chained through text no document contains |

> **MECHANISM: where an instrument's output is a number whose correct value
> nobody knows, the instrument is validated against a case whose answer is
> KNOWN BEFORE the number is read -- and a parameter is never adjusted after
> seeing the result it produced.**

**AND UNSOUND IS A RESULT.** It belongs in the report beside the numbers, not
as an absence. `measure-quotation-denominator` prints UNSOUND for every
standard whose clause-4 anchor nobody has verified, which is a smaller claim
than a percentage and a true one.

**A MEASUREMENT OVERRIDE MAY NOT WRITE.** A parameter that exists so a
measurement can be varied is refused on any path that PERSISTS a result,
because a stored value carries no record of the flag that produced it and will
be read later as the instrument's own answer.

> **MECHANISM: override flags are accepted only by read-only paths; a write
> path that sees one exits non-zero.**

Occasion: `--seed` on `scan-iso-leaks`, retained deliberately after unification
so the seed comparison stays reproducible, and refusing `--apply`.

**THE TERM-OF-ART EXEMPTION IS A LOOKUP, NOT A JUDGEMENT, BECAUSE THE GLOSSARY
IS `concepts`.** There is no glossary table: a `{glossary=<slug>}` annotation
in a lesson body resolves to a CONCEPT SLUG. The concept layer IS the declared
vocabulary, which makes the exemption machine-checkable:

> **A phrase with a concept behind it is a defined term the curriculum is
> obliged to use verbatim. A phrase without one is prose that happens to match
> the standard.** Exempt rows are reported WITH THE ENTRY that excuses them,
> never omitted.

**AND THE FIRST VERSION OF THAT LOOKUP EXCUSED NINE RUNS, MOST OF THEM
NONSENSE.** It accepted containment in either direction at any length, so a
short declared term sitting anywhere inside a long clause fragment exempted the
whole fragment:

```
additional control objectives and controls can be needed
    -> control-of-documented-information
requirements may include policies procedures work instructions legal requirements
    -> awareness-requirement
```

That is the `availability` shape again -- an exemption written to let defined
terms past, excusing the thing it exists to catch. **The declared term must
ACCOUNT FOR the run**: it covers the run, or the run exceeds it by at most one
word. A clause fragment that merely CONTAINS a defined term is prose carrying a
term, not a term.

With both directions asserted -- a glossary-annotated phrase MUST be exempt, a
clause fragment containing a term MUST NOT be -- the rule fires 19 and exempts
**zero**, because the declared terms cluster at 6 to 7 words, below the rule.
The exemption is real, checkable, and currently excuses nothing.

**AND THE DE FACTO VOCABULARY IS NOT THE DECLARED ONE.** 19 phrases recur in
four or more rows with no concept behind them -- `be carried out in a planned
manner` in seven, `based only on the audit evidence` in six. A phrase behaving
as a defined term across seven lessons either deserves an entry or should stop
being used as one, and **both are deliberate acts, unlike the present state,
which is neither.**

> This matters more than the leak score: **a curriculum whose de facto defined
> terms are not its declared ones teaches an auditor vocabulary the exam does
> not test.**

**AND THE ATTRIBUTED-QUOTATION EXEMPTION IS KEYED ON MARKDOWN FORM, NOT ON
ATTRIBUTION.** Found by reading the 19. A blockquote with a lead-in is exempt
at ANY length -- 52 words stands. An INLINE quotation carrying an explicit
citation in its own sentence gets no exemption at all:

```
ISO 19011:2026 clause 3.8 defines audit criteria as the set of requirements
used as a reference against which objective evidence is compared.
```

That is more precisely attributed than most blockquotes and is scored as
unattributed prose. **18 of the 19 findings carry a standard or clause citation
in at least one occurrence; 3 carry one in every occurrence.**

The exemption should turn on whether the span is attributed, not on whether the
author reached for `>`.

**AN ENUMERATION IS NOT A SLOWER COUNT.** A count reports MAGNITUDE; an
enumeration reports IDENTITY, and identity is what tells you whether a row was
ever in the state the change is supposed to move it out of.

> **MECHANISM: where a change is described by what it MOVES, the report names
> the rows. A number is accepted only where the rows' identity provably does
> not matter.**

Occasion: twenty released rows that turned out to be zero released rows. They
were over the floor in `leak-score`'s seed-4 view and the production gate at
seed 5 had never withheld them -- a fact no count of affected rows can even
represent.

**THE FLOOR STAYS AT 10, AND THE REASON IS THE DISTRIBUTION RATHER THAN
PRECEDENT.** Ruled 2026-09-23 from the first clean measurement the threshold
has ever had.

```
             4w    5w   6w   7w   8w   9w  10w  11+
concept     263    93   44   34   19   15    0    0
lesson     3234   747  384  263  152  134    1    3
```

**There is no cliff at 9.** Nothing is bunched just under the line, which is
what deliberate copying would look like; it is a smooth decay curve -- the
collision rate of technical English written about the same subject as the
standard. Lowering to 8 would fire 286 more lesson spans and spend the
programme's remaining attention on the part of the corpus least likely to be
wrong.

> **AND THE FLOOR IN WORDS: the corpus may carry NINE contiguous unattributed
> words of ISO anywhere, with no limit on how many times.** That is a different
> sentence from *we do not reproduce ISO text*, and it is now a decision rather
> than an accident.

**BELOW THE FLOOR, REPETITION IS THE SIGNAL.** A run appearing ONCE is
collision. The same nine words in FIVE lessons is a phrase that was written
once and carried, and whatever carried it will carry it again. A per-span floor
can no more see a repetition than it can see a sum.

Measured, unattributed, 6w and over: **839 distinct runs, 204 in more than one
row**, worst at 8. Three classes, separated only by reading:

| | |
|---|---|
| OUR SENTENCE, REUSED | one sentence of ours pasted across lessons. A style problem |
| A TERM OF ART | `persons doing work under the organization's control` -- 8 rows, and we carry a glossary entry for it. Our prose must contain it to teach at all |
| A CARRIED QUOTATION | the standard's wording, lifted once and spread. The only finding |

**Two false-positive classes fall out mechanically: 24 of the 204 are NESTED
inside a longer reported run** -- the same phrase counted twice because two
standards carry it at different lengths -- **and 19 contain a CLAUSE OR CONTROL
NUMBER**: `6 1 3 f requires the`, `8 1 operational planning and control`. Those
are our own citations colliding with ISO's numbering, not reproduced prose.

**Proposed report threshold: 3 or more rows AND 8w or more, nested and numbered
runs excluded. 19 runs today.** Three rather than two because n=2 has no
variance -- two occurrences of an eight-word technical phrase is well inside
collision, which is this file's own two-point rule. Eight rather than seven
because the term-of-art rate climbs sharply at 7w. A report, not a gate, and
its firing count is stated in the same breath, because a guard firing on 204 is
deleted by the first person it inconveniences.

**A PERCENTAGE IS A CLAIM ABOUT ITS DENOMINATOR, AND THE FIRST ONE WAS THE
WRONG FRACTION.** *716 quoted words, 9.36 percent of ISO/IEC 27001:2022*
divides by the whole extracted document -- foreword, scope, terms, and Annex
A's 93 controls, which are the bulk of the pages. An internal-auditor course
quotes the normative clauses. Split by where each span actually sits:

```
                      words   norm  annex  front   % of WHOLE   % of CLAUSES 4-10
27001:2022 ISMS-IA      706    634     34     38       9.36%          21.80%
42001:2023 ISMS-IA       79     79      0      0       0.38%           1.95%
```

**A tenth of the standard is a fifth of its normative core**, and those are
different sentences to put in front of a decision.

**AND THE DENOMINATOR ITSELF NEEDED A SOUNDNESS TEST, WHICH THE STRUCTURAL ONE
WAS NOT.** ISO 19011 passed *clause 4 found, before the annex, core non-empty*
**twice, with two different wrong anchors**, reporting a confident 1.27 percent
and then a confident 2.52 percent. Its clause 4 is *Principles of auditing*,
not the harmonised context phrase, and the needle kept landing in later
guidance.

> **A DENOMINATOR THAT IS STRUCTURALLY PLAUSIBLE AND SEMANTICALLY WRONG IS
> WORSE THAN ONE THAT FAILS**, because nothing about it looks broken -- and
> tuning the needle until the number looks reasonable is fitting the instrument
> to the expected answer. The clause-4 anchor is therefore DECLARED per
> standard and verified by hand; everything else reports UNSOUND, which is a
> smaller claim and a true one.

**THE SEED IS UNIFIED AT 4, BY IMPORT.** `scan-iso-leaks` took
`Number(arg("seed", "5"))` while `leak-score` used 4. Setting both to the same
literal would leave two constants that agree today, and a gate agreeing with
its sibling by coincidence is one edit away from not doing so -- this file's
own rule that a computation with a stated invariant has exactly one
implementation. The scanner now imports `SEED`. `--seed` survives as a
measurement override and **refuses `--apply`**, because a stored run written
under a flag is a fact about the flag.

**A LARGE DISAGREEMENT BETWEEN TWO INSTRUMENTS IS A DEFECT IN ONE OF THEM
UNTIL IDENTIFIED, NEVER A PARAMETER TO BE TUNED.** A factor of four is not a
seed, a threshold or a window; it is a difference in WHAT IS BEING MEASURED.

> **MECHANISM: when two measures of one property diverge by more than a small
> factor, find ONE case and read it in both, before any parameter is adjusted
> or either number is reported.**

Occasion: 75 lesson reproductions against 9, resolved by reading a single
52-word span and finding an attributed-quotation exemption one instrument
applied and the other did not.

**AND A DISCRIMINATOR'S STATE COUNT COMES FROM THE PHENOMENON, NOT FROM THE
QUESTION.** *Is this run real* invites two answers; the text has three, and the
missing one -- INTERPOLATED -- is the state that looks like the defect and is
actually the phenomenon.

> **MECHANISM: before a classifier ships, its states are checked against READ
> MEMBERS of each class, and a class that is never populated is as suspicious
> as one that swallows everything.**

Occasion: 98 of 361 reported manufactured, **27 percent -- a plausible-looking
artifact rate** -- of which 69 were real reproductions that would have been
cleared. A wrong number that looks reasonable is the one that ships.

**AND THE SEED QUESTION CLOSED BY MEASUREMENT AFTER THE FIX, NOT BY
ARGUMENT.** Before: seed 5 refused 9 lesson rows, seed 4 refused 60. After
extending by position, **seed 4 and seed 5 produce IDENTICAL verdicts on every
certification** -- same refusals, same longest run. The 9-versus-60 divergence
was entirely chaining. Two instruments that had disagreed for the whole life of
the programme unify, and the seed becomes what it always should have been: how
a candidate is found.

**AND THE FIX RELEASED NOTHING IN PRODUCTION, WHICH ONLY THE ENUMERATION COULD
SHOW.** The 20 rows it moves toward served were over the floor in
`leak-score`'s seed-4 view -- reports, draft gating, the concept machinery --
and the production lesson gate at seed 5 had never withheld them. **A release
enumeration is also how you discover a change releases nothing**, and that is
not a fact a count of affected rows can carry.

**THE FLOOR OF 10 WAS CALIBRATED AGAINST A BROKEN INSTRUMENT IN BOTH
DIRECTIONS**, and this is the clean measurement it never had. The greedy skip
DEFLATED runs; the chained extension INFLATED them; the net on any given span
is unknowable after the fact.

True contiguous run lengths, whole corpus, after the fix:

```
population         4w   5w   6w   7w   8w   9w  10w  11+   total
concept text      263   93   44   34   19   15    0    0     468
lesson prose     3234  747  384  263  152  134    1    3    4918
ATTRIBUTED quo      3    5    3    8    5    4   10   50      88
```

> **AND THE FLOOR STATED IN WORDS RATHER THAN NUMBERS: the corpus may carry
> NINE contiguous unattributed words of ISO anywhere, with no limit on how many
> times.** That may well be acceptable. It has never been said out loud, and it
> is a different sentence from *we do not reproduce ISO text*.

**The repetition half of that sentence is measured, because a per-span floor
can no more see a repetition than it can see a sum:** 217 distinct near-floor
runs (8w-9w), **45 of them in more than one row**, worst at 5 rows --
`the organization's own requirements for its ai management system`, nine words
of 42001, in five different lessons.

**AND THE BLANKET QUOTATION EXEMPTION IS ONE CERTIFICATION, NOT A PRACTICE.**
Measured per standard, and the aggregate is the number no per-span rule can
reach:

```
standard          spans  words  longest   share of the standard
27001:2022           54    716      30w   9.49%
19011:2026           20    448      52w   2.21%
42001:2023            7     96      27w   0.46%
27001:2022/Amd1       6     59      11w   6.53%
```

**All 60 spans at or over 10 words are ISMS-IA, and 706 of the 716 quoted
27001 words are ISMS-IA.** So the finding is not *"our courses quote
standards"*; it is *"one certification reproduces about a tenth of ISO/IEC
27001:2022 in attributed blockquotes"*, which is a positioning and licensing
question rather than an instrument one.

**A SEED FINDS A CANDIDATE. IT MUST NEVER MEASURE ONE.** Found 2026-09-23,
and it is the largest instrument defect this programme has produced, because
every leak number in it was measured by the construct below.

Both scorers extend a matched run like this:

```
let n = SEED;
while (own.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
```

The test is *"is the trailing seed-gram present ANYWHERE in this document"*,
not *"does the document continue this way"*. **So the extension HOPS.** A run
walks forward while each successive window exists somewhere, and the windows
need not come from the same place.

Measured per offset against ISO 19011:2026:

```
the results of the evaluation of the collected audit evidence
 4    9    8   7     6      5   4   0        0     0
```

The longest genuinely contiguous run is **nine**, starting at `results`. The
leading `the` matches a 4-gram somewhere else entirely, and chaining it on
reports **ten** -- which is the absolute floor. **A nine-word run that does not
fire became a ten-word run that does, on one word borrowed from another page.**

**THE LIBRARY HELD THE DISPROOF AND DISCARDED IT.** `runsAgainst` calls
`sourcePositions(src, words)` on every run it records -- a plain word-for-word
scan returning every position where the WHOLE run occurs contiguously. For a
chained run that array is empty. It is stored as `sourceAt`, used for the merge
gap and for `inAnnex`, and **never once consulted to ask whether the run is
real.**

> **MECHANISM: extend by POSITION. Keep the candidate source positions from the
> seed match and extend while some position still matches.** A real run has a
> position by construction; an invented one does not. This is correct at EVERY
> seed, and it returns the seed to being what it is for.

**Measured before proposing, 77,602 units, with the canary asserted to measure
its full 14w under BOTH extensions so neither can be shortening real runs:**

```
FIRES, extending by n-gram (today)   292
FIRES, extending by position         272
  still fire                         272
  STOP firing                         20    all lessons, 0 concepts
  NEWLY fire                           0    <- chaining only ever inflates
runs whose length was overstated     280    median 1 word, worst 4
```

**AND THIS IS THE REAL ANSWER TO THE SEED QUESTION.** `scan-iso-leaks` seeds at
5 and refuses 9 lesson rows; `leak-score` seeds at 4 and the same corpus yields
60. That looked like a sensitivity dial and it is not: **a larger seed makes
chaining arithmetically harder, so seed 5 chains LESS. It is not more correct,
it is less wrong** -- and it pays by missing genuine short runs. Of 17 runs
seed 4 reported at or over the floor that seed 5 did not, **17 were chained.**

**A BINARY TEST ON A THREE-STATE PROPERTY CLEARS REAL DEFECTS.** The first
version of this audit asked only *does this exact sequence appear contiguously*
and called everything else MANUFACTURED -- **98 of 361 fires, 27 percent**. The
list opened with

```
react to the nonconformity and as applicable take action to control and correct it
```

which is ISO/IEC 27001:2022 cl.10.2 almost word for word, absent contiguously
because the standard reads *"and, as applicable: a) take action"* and the list
letter is a token our prose has no occasion to carry. **That is a reproduction
with an omission** -- the `confidentiality` shape already recorded here. Three
states, and folding any two is a lie:

| | |
|---|---|
| CONTIGUOUS | one piece, verbatim |
| INTERPOLATED | several pieces, each near the last IN THE SOURCE. Still a reproduction |
| CHAINED | pieces from far apart, or words the source does not contain |

Measured: **263 contiguous, 69 interpolated, 29 chained.** Calling
INTERPOLATED manufactured would have cleared 69 genuine reproductions.

**Caught by reading the members, not by the count.** 27 percent looked like a
plausible artifact rate.

**A HAND-PICKED CONTROL ASSERTS THE AUTHOR OWN GUESS ABOUT THE CORPUS.** The
CHAINED control was first a front-matter phrase welded to the canary; it came
back INTERPOLATED, **correctly**, because those two sit close together. When a
picked control fails there is no way to tell a broken classifier from a wrong
guess, and the temptation is to edit the expectation until it agrees with the
code. **That is how a control dies.**

> **MECHANISM: CONSTRUCT controls from the index at runtime at offsets whose
> answer is known by construction** -- one piece contiguous, two pieces two
> words apart interpolated, two pieces five thousand words apart chained. No
> judgement about the corpus is involved and the expectation cannot drift.

**AND AN INSTRUMENT POINTED AT THE WRONG CORPUS REPORTS A CATASTROPHE.**
Scoring lesson bodies with `leak-score` directly reported **75 lessons serving
reproductions, the worst at 52 words**, against a production scanner reporting
9 refusals and a longest run of 12. The scanner was right twice over: the
52-word span is an ATTRIBUTED BLOCKQUOTE, which IP-POSITION s6 exempts and
`scan-iso-leaks` cuts out before measuring, and `runUnits` alone is the
description-side splitter.

**Two instruments disagreeing by a factor of four is never a parameter
difference**, and reporting it would have withheld correctly attributed
quotation across four certifications.

**THE BLANKET ATTRIBUTED-QUOTATION EXEMPTION CARRIES NO CEILING, AND THE NAMED
ONES ALL DO.** A named lesson exemption records a reason and a `maxRun`, on the
stated ground that an exemption is a ceiling rather than a waiver. The
attributed-quotation exemption is unbounded: a quoted, attributed blockquote is
exempt at any length. Measured, and nobody had ever seen the number --
**59 exempt quotation lines at or over 10 words, median 18, longest 52**,
concentrated in ISMS-IA. *"We permit attributed quotation"* and *"we permit 52
contiguous words of ISO 19011"* are different sentences and only the first has
been agreed.

**A DELTA MEASUREMENT CHANGES ONE THING.** Ruled 2026-09-23, and it is a class
rather than a post-mortem because it has two occasions in one week.

When an instrument is fixed and the input is also changed, the difference is
unattributable -- and the natural reading, that it is all the fix, is the
flattering one and usually wrong.

| | confound | the wrong reading it produced |
|---|---|---|
| the pooler alarm | one run had 45s of rest, the others 90 | *pacing* causes exhaustion |
| the concept re-score | the NAME was scored alongside the description | the skip fix raised fires 15 to 63 |

Both confounds were introduced by the MEASURER, not present in the subject.
Isolated, the concept answer was 2 description fires -- and the drop from the
recorded 15 was **the batch rewrites working**, not the scorer.

> **MECHANISM: run the new instrument on the OLD input first, report that
> delta, and only then change the input.**

Reporting 63 would have sent someone to rewrite sixty-one correct concept
names.

**A SELECTION AMONG CANDIDATES IS MADE BY THE PREDICATE THE GATE ACTS ON,
NEVER BY A COMPONENT OF IT.** The gate fires on `(ratio) OR (absolute run)`.
Selecting the "best" unit by coverage alone discards precisely the case the
absolute floor exists for: a long sentence of ours carrying a ten-word
reproduction dilutes to 0.17, and a short defined term at coverage 1.00 wins a
comparison it should never have been in.

**FILE IT WITH "A GATE IMPLEMENTED AS A FUNCTION IS NOT THE COLUMN IT READS."**
Two instances, one class, different clothing: *the thing that decides must be
the thing that decides.* A column that feeds a gate is not the gate; a
component of a disjunction is not the disjunction.

**THE 8-OR-9 MARGIN IS KEPT, ON DIFFERENT GROUND.** It was hedging against an
instrument known to measure low. The instrument no longer does, so that reason
has expired. It stays because a draft at 9w is one word from a refusal, the
floor is a policy choice rather than a law, and a redraft costs minutes -- a
DRAFTING margin, not instrument distrust. **A rule kept for a reason that has
expired is a rule nobody can argue with later.**

**AND THE FRAME HYPOTHESIS IS REFUTED BY ITS OWN POPULATION.** `determine the
___ relevant to the ___` reproduced twice in one evening -- clause 4.2 and
clause 7.4 -- which looked like harmonised boilerplate we keep reaching for.
Surveyed across 2,208 English bodies: 4,355 distinct matched runs, 13,701
occurrences.

```
the TOP TWENTY frames account for 4% of occurrences
the top 60 are 53 four-word runs -- the seed floor
of the four frames predicted, NONE appears in the top 60
```

The head of the distribution is ordinary English and ISO front matter -- *in
the context of*, *the effectiveness of the*, *note 2 to entry*, *iso online
browsing platform*. **A frame list is not worth having.** Same shape as the
two-point rule one level up: a pattern read off two instances, re-measured
against the population, and the population disagrees.

**A CONCEPT NAME AND A CONCEPT DESCRIPTION ARE DIFFERENT OBJECTS UNDER
DIFFERENT RULES, AND NO MAXIMUM IS TAKEN ACROSS THEM.** A name SHOULD be the
defined term; one that avoided ISO's wording to escape a leak score would be
worse curriculum. A description must not reproduce. The description's verdict
is the gate; the name's is informational.

Measured after the split and after the one real repair: **1 description fire,
62 name fires.**

**AND THE TITLE-CLASS EXEMPTION IS ENCODED, BUT NOT WHERE IT WAS ASSUMED TO
BE.** `isHeadingSpan` lives in `iso-locator.mjs` and is real.
`gate-concept-descriptions` does NOT call it -- it carries a per-slug exemption
list where each entry has a REASON and a `maxRun` CEILING, and an exempt row is
still printed with its score. That is the right shape. The 62 names were never
exempt by anybody's decision, because names were never scored at all.

**THE ENUMERATION REQUIREMENT ATTACHES TO RELEASE, NOT TO CHANGE.** Ruled
2026-09-23 after two gate deploys an hour apart, one of each kind.

A gate change that can move any row toward SERVED enumerates them first and
releases none unread -- the failure mode is text nobody cleared reaching a
partner. A change that can only move rows toward WITHHELD has no such failure
mode: the worst case is over-withholding, which is visible, reversible and
costs only availability. **It ships on its controls.**

Removing the greedy skip could only RAISE runs, so it could only withhold.
Stripping scaffolding could lower them, so it carried a list. Treating the two
alike would have either delayed the safe one or rushed the mixed one.

**THE UNIT OF MEASUREMENT IS THE WHOLE BODY, MEASURED PER UNIT.** A span list
is a WORKLIST, never a coverage claim: it enumerates what the instrument found,
and a lesson containing one found span is not a lesson that has been measured.

`05-01-aims-monitoring-and-measurement` had attention twice in one evening,
took an applied rewrite, and carried a **twelve-word reproduction of 42001
three paragraphs away** throughout. Not because anyone decided not to look --
whole-body scoring was genuinely wrong until `runUnits` existed, because it
joined across segments and produced garbage. It became right and nobody went
back to use it.

> **MECHANISM: every body is scanned whole, per unit, and the span list is
> DERIVED from that scan rather than standing in for it.**

**AND SELECTING THE BEST UNIT BY COVERAGE IS A HIDING MECHANISM.** Found in my
own per-unit change, minutes after writing it. `score()` kept the
highest-coverage unit, so a concept NAME -- a defined term at coverage 1.00 --
beat a description carrying a **ten-word reproduction of 42001 clause 4.2 at
coverage 0.17**, and the run was discarded. The row reported clean.

A ratio is diluted by length and an absolute run is not; **that is the whole
reason `ABS_RUN` exists**, and selecting across units by the diluted measure
threw away exactly the case the undiluted one was added to catch. The governing
unit is now the one the gate would act on: over the absolute floor first, then
over the ratio, then highest coverage.

**CONCEPT RE-SCORE, corpus-wide, after all of the above:**

```
description only          2 fire    (the recorded 15 were fixed by batches B-E)
name + description       63 fire    61 of them from including the NAME
at or over the 10w floor  1         aia-interested-party-requirements
```

**THE 61 ARE A FALSE-POSITIVE CLASS I MANUFACTURED**, by scoring the name as
part of the row. Read: `human in the loop`, `ai system impact assessment`,
`roles responsibilities and authorities`, `8 1 operational planning and
control`. Clause titles and defined terms, which the title-class exemption
already covers -- *naming a category is not reproducing the prose that defines
it*. Reporting 63 as a finding would have sent someone to rewrite sixty-one
concept names that are correct.

**AN OPTIMISATION INSIDE A MEASUREMENT IS A MEASUREMENT ERROR UNTIL PROVEN
OTHERWISE.** Ruled 2026-09-23. The largest defect of the week, and it was found
while fixing a smaller one.

`i += n - 1` sat in the inner loop of BOTH run-finders -- `scan-iso-leaks` and
`lib/leak-score.mjs`. It resumes the scan MID-RUN after a match, which is
correct for COUNTING OCCURRENCES and wrong for FINDING THE LONGEST: a longer
run beginning inside the consumed region is never looked for. The two uses were
never distinguished because the loop was written once and read as obviously
fine.

**IT ERRS IN ONE DIRECTION ONLY.** A skipped start can lose a run and can never
invent one. So **every leak number this programme has produced is a LOWER
BOUND** -- the 371 span lengths, the draft scores, the 8-or-9 margin calibrated
against them.

**MEASURED, corpus-wide, after removing it:**

```
before   AIMS-IA 3 rows refused, everything else clean
after    AIMS-F  05-01-aims-monitoring-and-measurement   12w
         AIMS-IA aims-ia-05-05-a-report-for-someone...   11w
         AIMS-IA aims-ia-04-06-two-assessments-not-one   10w
```

Two further lessons, six further rows, **all real contiguous reproductions of
ISO/IEC 42001:2023, all serving in English until this was deployed**:

```
12w  "the organization should consider the performance of non ai systems or processes"
11w  "ensure that the results of audits are reported to relevant managers"
```

> **MECHANISM: a measurement's inner loop is written for correctness and only
> then measured for cost. A skip, a cache or an early exit inside one carries a
> comment stating what it is allowed to miss.** At this corpus size not
> skipping costs nothing.

**AND THE PER-UNIT SPLIT DID NOT FIX IT.** It reset the offset at a line
boundary that happened to fall before the true start -- luck, not a repair. The
list case is the one shape that split rescues by accident; a paragraph is a
single unwrapped line here, and a paragraph is where most of the corpus lives.

**A CONTROL BUILT AROUND THE DEFECT THAT PROMPTED IT TESTS THE DEFECT, NOT THE
CLASS.** The scaffolding fixture, written one prompt earlier, would never have
caught this: it tests lists because a list was the bug in front of us. The
overlapping-runs fixture was added with the skip fix and asserts that a later,
longer run is not lost to an earlier match.

**AND A STRIP THAT BELONGS ON ONE SIDE MUST NOT BE APPLIED TO BOTH.** Folding
`stripScaffolding` into `norm` broke the index load -- *19011:2026 extracted
19905 words, manifest says 20299* -- because ISO's own numbering is part of
ISO's text. The manifest assertion caught it immediately. Scaffolding stripping
is a DESCRIPTION-side operation; the index is never normalised differently from
how it was built.

**A COMPUTATION WITH A STATED INVARIANT HAS EXACTLY ONE IMPLEMENTATION.**
Ruled 2026-09-23, and it is the general form of `_pg.mjs`'s count assertion and
of the `matchingSources` lesson.

Manufactured adjacency was caught three times in one evening, recorded as a
rule each time, and recurred in the next instrument written. **The rule was not
forgotten. It lived in prose while the union lived in every caller** --
`lib/leak-score.mjs` computed one, `scan-iso-leaks` computed another with a
DIFFERENT SEED, a scorer joined a whole body, and a fourth was asked for by
hand. **A rule written down four times is a rule enforced zero times.**

> **MECHANISM: the invariant is enforced by there being nowhere else to put
> it.** `stripScaffolding` and `runUnits` live in `leak-score.mjs` and every
> caller imports them. A caller needing different joining needs a new argument
> to the shared function, not its own copy.

**AND STRIPPING THE LETTERS WAS NECESSARY AND NOT SUFFICIENT.** With `g)` gone,
`norm` still collapsed the newline and glued item f)'s tail to item g)'s head:
ten words became nine, and nine words that appear in no document are not better
than ten. **Two list items are not contiguous text** -- nor are two table
cells, nor a heading and its paragraph. A run may not cross a line boundary,
and the caller measures each unit and takes the maximum, the same shape as
score-per-document-and-take-the-max.

**THE FIX BOTH LOOSENS AND TIGHTENS, AND THE TIGHTENING WAS THE SURPRISE.**

```
isms-ia-04-02   10w -> 9w   released   the run included item f)'s tail and the letter g
aims-ia-04-06    9w -> 10w  REFUSED    a real 42001 clause 6.1.4 reproduction
```

The second is a pre-existing defect in the scanner's search order, not in the
scaffolding. `i += n - 1` resumes the scan MID-RUN after a match, so a longer
run beginning inside the consumed region is never found. Per-unit measurement
resets the offset and finds the true start -- one word earlier, which is the
difference between 9w and the 10w floor.

> **A GREEDY SCAN THAT SKIPS PAST WHAT IT MATCHED UNDER-REPORTS**, and it
> under-reports silently, in the direction that flatters.

**`aims-ia-04-06` en and es-419 were SERVING that reproduction**, at a stored
run of 9w, for as long as the scanner has worked this way.

**THE FIXTURE THE LOOSENING OWED.** A gate made less strict without a
demonstration that it still catches the thing it was loosened around is a gate
we have merely stopped hearing from. Measured: a canary sentence whole inside
one lettered item still scores 17w and fires; the same words split across two
items score 9w and do not. Built from canary text rather than a live row, so
it keeps working after any lesson is repaired.

**A JOINED SPAN IS ONLY JOINED ACROSS TEXT THAT EXISTS ON BOTH SIDES.**
Recorded 2026-09-23, and `scan-iso-leaks` has this defect in production.

Numbering, lettering, markdown syntax and any other DESCRIPTION-SIDE
scaffolding is stripped before a union is computed. Joining across it
manufactures the adjacency the union rule exists to detect -- and the union
rule already forbade it, because it requires a description gap of zero and a
letter is a description token with no counterpart in the source.

**Found twice on one day, in two instruments.**

Mine first: clause 5.1's `a)` to `h)` joined WITH the letters scored **10w and
fired** on the run *"g promoting continual improvement h supporting other
relevant management roles"*. Letters stripped, the same list scores **6w**. The
10w never existed.

**Then the production scanner did it, and took a lesson dark.** After an
accurate seven-word quotation of 27001 clause 5.2 g) was restored,
`isms-ia-04-02` scored 10w and was REFUSED on:

```
"the organization g be available to interested parties as appropriate"
```

`organization` is the tail of item **f)**. `g` is the **letter**. The actual
quotation is `be available to interested parties as appropriate` -- **seven
words**, under every threshold. Three rows went unservable for a run that does
not exist in any document.

> **CONSEQUENCE: any accurate short quotation inside a lettered list can be
> pushed over the floor by its neighbours.** The more faithfully a lesson
> quotes, the likelier this is -- so the gate penalises exactly the behaviour
> the reproduction policy asks for.

**AND THE MARKED-QUOTATION EXEMPTION IS UNIMPLEMENTED, NOT MERELY
UNACCOUNTED.** The policy permits a short distinctive quotation under ten
words. Scored, `be available to interested parties, as appropriate` is **8w at
coverage 1.00** -- every word ISO's, which is what a quotation IS -- so it
fires the ratio gate outright. Nothing in any instrument knows it is
attributed. Today the only thing standing between a permitted quotation and a
refusal is a human waiver.

> **MECHANISM: a span is exempt only if an attribution naming STANDARD AND
> CLAUSE sits within a bounded distance and the span is under the policy limit;
> an exempted span is REPORTED AS EXEMPT WITH ITS ATTRIBUTION, never omitted.**
> A gate that hides what it excused cannot be audited -- the same shape as
> `(none reported)` meaning *not asked*.
>
> And the allowance is PER SPAN with nothing counting the total. **Fifty
> permitted eight-word quotations of one standard are a substantial
> reproduction of it that no gate here would ever report**, because the
> per-span floor cannot see a sum and nothing sums.

**A HELPER THAT RETURNS EMPTY ON MISUSE REPORTS A NEGATIVE FINDING IT NEVER
MEASURED.** Recorded 2026-09-23. Fourth instrument failure of the week and the
third where the instrument answered confidently without measuring.

`matchingSources(spanText, sources)` searches for the WHOLE `spanText` as one
contiguous run. Called with a paragraph instead of a matched span it returns
`[]` -- which printed as `(none reported)` and reads as *no source matched*
when the truth is *no source was asked*.

**MEASURED across 371 reproduction spans, re-attributed correctly:**

```
printed NO source before        226
now name a source               170
now name MORE THAN ONE standard  47
still name none                  56
```

**NOT MATERIALLY AFFECTED, and that was checked rather than hoped.** Every
verdict in the affected documents came from `firesUnion(score(...))`, which
never consulted the attribution: the 77-of-77 classification, the twenty-span
selection by run length, and the drift classes are all independent of it. The
damage is a column that read *none* where it should have read a document --
cosmetic in `UNCOVERED-REPRODUCTION-AIMS-F.md`, and silently absent in
`TWENTY-SPANS.md`.

> **MECHANISM: a function whose empty return is indistinguishable from a real
> negative either THROWS on a malformed argument or returns a third value
> meaning NOT ASKED.** Empty is never a result.

**AND THE 47 THAT NAME MORE THAN ONE STANDARD ARE A FINDING THE BUG WAS
HIDING.** The harmonised management-system structure means clauses 4 to 10
share sentences across 27001, 42001, 27002 and 27000 -- so **a 42001 lesson can
reproduce 27001 and nobody would think to check**. Some spans match four
indexed documents at once. Confirmed, not inferred: `score()` iterates every
entry in the index and nothing anywhere filters sources by the lesson's
certification. The index is nine documents: 19011:2026, 22989:2022, 27000:2018,
27001:2022, 27001:2022/Amd1, 27002:2022, 27004:2016, 27005:2022, 42001:2023.

**RESTORING A RESERVED TERM RESTORES THE TERM, NOT THE TERM'S PHRASE.**
`determine`, `implement`, `available`, `appropriate`, `shall` are reserved for
what each word imports, and a reserved term carries that import in isolation.
The clause's object, order and connectives come with no such warrant.

Occasion: a rewrite approved on reserved-term grounds restored `determine` --
and brought *the internal and external communications relevant to the AI
management system* with it. Eleven of ISO's words in a row, in a batch written
to remove reproductions. **The ground was sound and the execution of it
produced the defect.**

> **The exception has a hard limit: ONE WORD.** If a redraft needs two of ISO's
> words adjacent to make its point, the point needs a different sentence.

Measured on the redrafts: 22w to 5w, 11w to 4w, 9w to 0w, with every reserved
term preserved.

**A LESSON IS A UNIT OF APPLICATION.** All accepted spans for one lesson land
in one write, or none do -- and the reason is REVIEW INTEGRITY rather than
cost. Two applications produce two review invalidations, and the second
reviewer reads a body the first review never saw. **A reviewer who approves a
lesson with one span applied and another pending has approved a lesson that
will not exist by the time the approval means anything.**

**A REWRITE IS SCORED BEFORE IT IS READ, AND AGAIN AFTER IT IS APPLIED.**
Ruled 2026-09-23, and the batch that occasioned it proved the point on its
first run.

The draft score is a FILTER and costs a minute. The applied score is the
RECORD. They are different artifacts answering different questions, and running
only the second means an expensive human review runs on text the cheap gate
would have rejected.

**I argued for scoring only the applied text**, on the ground that the score in
the record should belong to what landed. That is right about the record and
wrong about the sequence.

**MEASURED, ON FIFTEEN DRAFTS WRITTEN TO REMOVE REPRODUCTIONS: two of them
reproduced.**

```
#13  05-01  clause 9.1   run 22w  cov 0.49  FIRES   42001:2023
#9   03-02  clause 7.4   run 11w  cov 0.33  FIRES   42001:2023
#7   03-01  clause 7.2   run  9w                    27001:2022
#11  03-04  clause 8.1   run  9w                    27001:2022
#15  isms-ia-04-02 5.2g  run  8w                    27001:2022
```

**A REWRITE THAT REMOVES AN INACCURATE PARAPHRASE CAN REPLACE IT WITH AN
ACCURATE REPRODUCTION.** #13 restored four determinations of clause 9.1 in the
clause's own order and words: twenty-two contiguous tokens. It was predicted to
fire at about fifteen. **Accuracy is not the test** -- the test is whether we
reproduce, and a faithful restatement in the clause's sequence is CLOSER to
reproduction than the loose version it corrected.

**And #9 is the sharper one, because it was nobody's prediction.** The ruling
approving it said `determine` and `implement` are reserved terms and must be
restored. Restoring the reserved term restored the clause's PHRASE with it --
*determine the internal and external communications relevant to the AI
management system* is eleven of ISO's words in a row. **The defended exception
created the defect.**

> **MECHANISM: draft-score, then apply-score. And a span sitting one token
> under the floor is a span the floor DID NOT CATCH, not one that passed** --
> 8w and 9w are redrafted, not shipped.

**Half the batch went back.** Nine of fifteen were clean; six are held. Four of
those six sit in lessons whose sibling span is clean, so applying the clean half
would touch each lesson twice -- two review invalidations, two withholding
windows and two retranslations for one correction. **A batch is applied per
lesson or not at all.**

**A REPAIR IS VERIFIED AGAINST WHAT IT WAS SUPPOSED TO PRESERVE, NOT ONLY
AGAINST WHAT IT WAS SUPPOSED TO REMOVE.** Ruled 2026-09-23. It is the positive
form of the whole week.

Every gate here is subtractive -- does it reproduce, does the citation resolve,
does the hash still match. A repair also has a POSITIVE obligation: the modal,
the conjunction, the quantifier and the defined term it inherited must survive
it. Nothing asked.

**AND THE TRIAGE TURNS ON ONE DISTINCTION: IS THE SPAN A QUOTATION OF THE
CLAUSE, OR OUR EXPLANATION OF IT?** In something presented as the clause's own
words -- blockquoted, lettered, or introduced by *"Clause 8.2 says"* -- every
word is ISO's, and changing one is a MISQUOTATION whether or not the meaning
survives. In our own prose, *relevant* becoming *bears on* is good writing.
**The same substitution is a defect in the first shape and an improvement in
the second**, which is why shape is the primary filter and the word lists are
secondary. Measured: **179 quotation-shaped, 290 explanation-shaped** of 471.

> **THE STRUCTURAL RULE, WHICH IS WHAT CLOSES THIS: WE SHOULD NOT PRESENT
> PARAPHRASES AS QUOTATIONS AT ALL.** That is how it happened -- the lesson
> quotes the clause, the quote reproduces ISO, the repair paraphrases the quote
> to avoid reproduction, and the result LOOKS like a quotation, ISN'T one, and
> is wrong in exactly the details a quotation exists to preserve.
>
> Two honest shapes, and every repaired span becomes one of them: **accurately
> quoted, marked as a quotation, under the reproduction threshold**; or **our
> own explanation, not wearing the clause's voice.** Name the clause, state the
> obligation in our own words, never wear the clause's voice.

**This is the concept layer's ruling arriving at the lesson layer.** The
anti-gloss rule said a description must say something the definition does not.
This says a lesson must not impersonate the clause it teaches.

**AND THE SHAPE CLASSIFIER WAS WRONG BEFORE IT WAS RIGHT, CAUGHT BY DISAGREEING
WITH A HUMAN READ.** It reported 97 quotation-shaped; a reading of 22
candidates said several of its EXPLANATION calls were plainly quotations. Three
blind spots, all real quotations: the citation phrase **inside** the span, so
only the previous line was read; a **clause-number item** where the lettered
test demanded a closing paren; and a requirements **table** keyed by clause
number. Fixed, the count went **97 to 179**.

A classifier that under-reports the category it exists to protect is the same
defect as a guard that cannot fire -- and it was found by a person reading the
output, not by the instrument.

**AND TWENTY SPANS DROP THE DEFINED TERM `available`, WHICH IS A DIFFERENT
SEVERITY AND DOES NOT TURN ON SHAPE.** ISO MSS drafting distinguishes *shall be
available as documented information* from *shall be retained as documented
information*. An auditor taught *kept* looks for retention where the clause
asks for availability, and that is an examinable point on every management
system certification we sell.

**A REPAIR THAT AVOIDS REPRODUCTION CAN ALTER WHAT THE STANDARD REQUIRES, AND
NOTHING CHECKED FOR IT.** Recorded 2026-09-23. It is the inverse of everything
else in this file: not a claim that decayed, but a claim that was changed ON
PURPOSE by the act of protecting us.

The leak gate checks that we do not REPRODUCE. The claims verifier checks that
a citation RESOLVES. **Neither asks whether the paraphrase still says what the
clause says** -- and a repair is written under pressure to differ from ISO's
words, which is exactly the pressure that moves meaning.

Two landed in English and were faithfully carried into BOTH translations:

| clause | was | became |
|---|---|---|
| 27001 5.2 g) | be **available to** interested parties | be **open to** interested parties |
| 27001 8.2 | at planned intervals **OR** when | at planned intervals **AND** when |

*Available to* is a passive obligation to furnish on request; *open to* is a
different claim. Clause 8.2 gives two INDEPENDENT triggers, and  makes
them joint -- while the surrounding prose still says *two triggers*.

**BOTH LESSONS THEN CONTRADICT THEMSELVES, AND THAT IS DETECTABLE WITH NO INDEX
AT ALL.** The quoted clause carries the new word; the explanation beside it
still carries the old one. The lesson disagrees with itself, in English and in
both translations, and no ISO text is needed to see it.

> **MECHANISM: a repair is checked against the clause it paraphrases for MODAL,
> CONJUNCTION, QUANTIFIER and DEFINED-TERM preservation; and a lesson whose
> quoted text disagrees with its own explanation of the same clause is a
> candidate regardless of what any index says.**
> 
  POSITIVE CONTROL -- the two instances a human found
    FIRES  isms-ia-04-02-demonstrated-not-stated   SELF-CONTRADICTION, TERM-SUBSTITUTION
    FIRES  isms-ia-04-06-defined-versus-running   CONJUNCTION-FLIP, SELF-CONTRADICTION, TERM-SUBSTITUTION

NORMATIVE DRIFT -- candidates, not defects

  repair spans examined            471

  SELF-CONTRADICTION, narrowed (strongest)        12
    the broad form fired on 82 -- kept visible because the
    narrowing is a judgement, not a measurement
  CONJUNCTION-FLIP   (and <-> or)                  13
  MODAL-SHIFT        (shall / should count moved)  4
  QUANTIFIER         (all/every/any/no/not moved)  59
  TERM-SUBSTITUTION  (a listed term swapped)       12

  A high count in the lower three is EXPECTED -- a repair rephrases, and
  rephrasing moves these tokens. They are ranked, never a defect list.

  ===== SELF-CONTRADICTION =====

  AIMS-F  02-06-the-ai-system-impact-assessment   [42001 clause 6.1.4, clause 8.4, Annex B.5]
    still used elsewhere in the lesson: or
    conj: and 0->1  or 1->0
    before: assessments are performed at planned intervals, or when significant changes are proposed to occur
    after : assessments are performed at planned intervals, and again whenever a significant change is proposed

  AIMS-F  04-01-annex-a-structure   [42001 Annex A intro, Annex B general clause]
    still used elsewhere in the lesson: required
    modal: must 0->1  may 0->1  can 1->0
    dropped: required   added: objective
    before: **Not all the control objectives and controls listed are required to be used**, and the organization can design and implement its own controls.
    after : **Not every listed control objective and control must be used**, and an organization may design and implement its own.

  AIMS-F  05-01-aims-monitoring-and-measurement   [42001 clause 9.1, A.6.2.6]
    still used elsewhere in the lesson: ensure
    dropped: ensure   added: monitor
    before: **What needs to be monitored and measured.** **The methods** for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results. **When** the monitoring and measuri
    after : **What to monitor and measure.** **Which methods** to use for monitoring, measurement, analysis and evaluation, so far as each applies, so that the results are valid. **When** monitoring and

  AIMS-F  05-02-aims-internal-audit   [42001 clauses 9.2.1 and 9.2.2]
    still used elsewhere in the lesson: ensure
    dropped: ensure   added: objective, impartial
    before: **Select auditors and conduct audits to ensure objectivity and the impartiality of the audit process.**
    after : **Select auditors and run audits in a way that keeps the process objective and impartial.**

  AIMS-F  05-02-aims-internal-audit   [42001 clauses 9.2.1 and 9.2.2]
    still used elsewhere in the lesson: ensure
    dropped: ensure   added: objective, impartial
    before: conducted so as to ensure objectivity and the impartiality of the audit process
    after : conducted so that the process stays objective and impartial

  AIMS-IA  aims-ia-01-04-when-you-cannot-be-independent   [19011 clause 4.6, 42001 clause 9.2.2 b]
    still used elsewhere in the lesson: ensure
    dropped: ensure   added: objective, impartial
    before: **select auditors and conduct audits to ensure objectivity and the impartiality of the audit process**
    after : **select auditors and run audits in a way that keeps the process objective and impartial**

  AIMS-IA  aims-ia-04-03-leadership-in-artifacts   [42001 clauses 5.1, 5.2, 5.3, controls A.2.2 to A.2.4]
    still used elsewhere in the lesson: available
    dropped: available   added: open
    before: - be **available to interested parties, as appropriate**.
    after : - be **open to interested parties where appropriate**.

  AIMS-IA  aims-ia-04-03-leadership-in-artifacts   [42001 clauses 5.1, 5.2, 5.3, controls A.2.2 to A.2.4]
    still used elsewhere in the lesson: ensure, review, or
    conj: and 1->2  or 1->0
    dropped: ensure, review   added: adequate
    before: **A.2.4, review of the AI policy** - the AI policy shall be reviewed at planned intervals or additionally as needed to ensure its continuing suitability, adequacy and effectiveness
    after : **A.2.4, reviewing the AI policy** - it shall be reviewed at planned intervals, and at other times as needed, so that it stays suitable, adequate and effective

  AIMS-IA  aims-ia-04-09-normative-and-should   [42001 Annex A.1, Table A.1, Annex B.1, clause 6.1.3 e), 3.26]
    still used elsewhere in the lesson: required
    dropped: required   added: objective
    before: Annex A.1 records that not all control objectives and controls listed in Table A.1 are required to be used.
    after : Annex A.1 records that not every control objective and control in Table A.1 has to be used.

  AIMS-IA  aims-ia-04-10-justifying-both-directions   [42001 clause 6.1.3 f), Annex A.1, 19011 clause 6.5.1]
    still used elsewhere in the lesson: required
    dropped: required   added: objective
    before: > The controls detailed in Table A.1 provide the organization with a reference for meeting organizational objectives and addressing risks related to the design and operation of AI systems. *
    after : > The controls set out in Table A.1 give the organization a reference for meeting its objectives and handling risks that arise from designing and operating AI systems. **Not every control ob

    ... and 2 more (--verbose)

  ===== CONJUNCTION-FLIP =====

  AIMS-F  01-03-the-ai-system-life-cycle   [42001 A.4 resources, clause 8]
    conj: and 0->1  or 2->1
    before: assessments at planned intervals, or when significant changes are proposed or occur
    after : assessments at planned intervals, and again whenever a significant change is proposed or occurs

  AIMS-F  01-03-the-ai-system-life-cycle   [42001 A.4 resources, clause 8]
    conj: and 0->1  or 2->1
    before: performed at planned intervals or when significant changes are proposed or occur.
    after : performed at planned intervals, and again whenever a significant change is proposed or occurs.

  AIMS-F  02-06-the-ai-system-impact-assessment   [42001 clause 6.1.4, clause 8.4, Annex B.5]
    still used elsewhere in the lesson: or
    conj: and 0->1  or 1->0
    before: assessments are performed at planned intervals, or when significant changes are proposed to occur
    after : assessments are performed at planned intervals, and again whenever a significant change is proposed

  AIMS-F  03-06-data-for-ai-systems   [42001 A.7 data controls]
    conj: and 0->1  or 2->1
    before: known or potential biases or other systematic errors**. Prior handling
    after : biases known or suspected, and other systematic errors**. Prior handling

  AIMS-IA  aims-ia-04-03-leadership-in-artifacts   [42001 clauses 5.1, 5.2, 5.3, controls A.2.2 to A.2.4]
    still used elsewhere in the lesson: ensure, review, or
    conj: and 1->2  or 1->0
    dropped: ensure, review   added: adequate
    before: **A.2.4, review of the AI policy** - the AI policy shall be reviewed at planned intervals or additionally as needed to ensure its continuing suitability, adequacy and effectiveness
    after : **A.2.4, reviewing the AI policy** - it shall be reviewed at planned intervals, and at other times as needed, so that it stays suitable, adequate and effective

  AIMS-IA  aims-ia-04-04-criteria-before-assessment   [42001 clauses 6.1.2, 6.1.4, 8.2]
    conj: and 0->1  or 2->1
    before: the organization shall perform AI risk assessments at planned intervals or when significant changes are proposed or occur
    after : the organization shall perform AI risk assessments at planned intervals, and whenever significant change is proposed or happens

  AIMS-IA  aims-ia-04-08-defined-versus-running   [42001 clauses 8.1, 8.2, 8.4]
    conj: and 0->1  or 2->1
    before: **8.2** - at planned intervals or when significant changes are proposed or occur; retain documented information of the results
    after : **8.2** - at planned intervals, and whenever significant change is proposed or happens; retain documented information of the results

  AIMS-IA  aims-ia-04-08-defined-versus-running   [42001 clauses 8.1, 8.2, 8.4]
    conj: and 0->1  or 2->1
    before: Clause 8.2 says at planned intervals or when significant changes are proposed or occur; clause 8.4 says
    after : Clause 8.2 says at planned intervals, and whenever significant change is proposed or happens; clause 8.4 says

  ISMS-IA  isms-ia-01-01-audit-parties   [27001:2022 Annex A control 5.35]
    still used elsewhere in the lesson: or
    conj: and 0->1  or 1->0
    before: to be reviewed independently at planned intervals, or when significant changes occur
    after : to be reviewed independently at planned intervals, and whenever significant change occurs

  ISMS-IA  isms-ia-04-06-defined-versus-running   [27001:2022 clauses 8.1, 8.2, 9.1]
    conj: and 1->2  or 2->1
    before: | 6.1.2 - define and apply a risk assessment process | **8.2** - perform assessments at planned intervals or when significant changes are proposed or occur |
    after : | 6.1.2 - define and apply a risk assessment process | **8.2** - perform assessments at planned intervals, and whenever significant change is proposed or happens |

    ... and 3 more (--verbose).

**AND ITS FIRST VERSION FIRED ON 82 OF 471 SPANS.** Any dropped term still used
somewhere in a 13,000-character lesson counted -- which is not a contradiction,
it is English. Narrowed to spans that ALSO flipped a conjunction or substituted
a listed term: **12**, plus 13 conjunction flips. **The broad count is printed
beside the narrow one**, because the narrowing is a judgement and hiding the
number it replaced would hide that.

**The control is the pair of instances a human found.** Both must fire or the
script prints no list -- which is what stops a detector being tuned until it is
quiet.

**AND THERE IS NO THROWAWAY MEASUREMENT WHOSE NUMBER REACHES A REPORT.**
Recorded 2026-09-22, and it is the paging rule's missing clause.

The founding defect of this whole programme -- `limit=2000` against a
1,000-row cap -- was committed again in a SCRATCH SCRIPT, written to be
deleted, **while measuring the consequences of another instance of it.** It
made the review cost come back as 14 of 41 when the answer is 24: eighteen
reviews found no lesson to join to, because the lessons read was short.

It happened a second time the same hour, in `retranslate-repaired-passages`'s
own `g()` helper -- one request, no `Range`, no count -- so the new `--dry`
inspection reported **105 translated rows for 104 lessons across two
languages**, which is arithmetically impossible and is the only reason it was
caught. Paged, the figures are 208 rows and 41 of 41 reviews.

> **MECHANISM: any read that could exceed 1,000 rows goes through a paged
> helper with its count assertion, INCLUDING in a script written to be
> deleted** -- because the script is deleted and the number is not.

The scratch file is the most dangerous place for this, not the least: it skips
review, it skips the helper, and its output goes straight into a report where
nothing distinguishes it from a measured figure.

**A WRITE THAT FAILS AFTER THE PRINT IS WORSE THAN ONE THAT FAILS BEFORE.**
Recorded 2026-09-22 from `check-repair-translation-parity.mjs`.

Its summary printed **77 uncovered lessons**. Its `writeFileSync` then threw on
a `CONTROL_SLUGS` reference left behind when the control moved to the applied
`EDITS` table -- so the file on disk kept a stale **79** from an earlier run.

**The run looked complete.** The summary was right, the exit was quiet enough
to miss, and the next instrument read the FILE rather than the screen: the
classifier built its first result on 79. Two numbers, one script, and the wrong
one was the durable half.

> **MECHANISM: a script that both prints and persists does the WRITE FIRST, or
> asserts afterwards that what it wrote matches what it printed.** A stale
> artifact outlives the terminal, and terminals are not what downstream tools
> read.

Same family as the count assertion on a paged read: **the number that leaves
the process is the one that has to be right.**

**BEFORE AN ENDPOINT DEFECT IS REPORTED, THE REQUEST IS VERIFIED WELL-FORMED
AGAINST THAT ENDPOINT'S OWN DECLARED INTERFACE.** Three times in one week a
malformed probe was reported as a defect in the thing probed:

| reported | actually |
|---|---|
| `list_lessons` returns fields its schema forbids | a stale connector's cached schema; zero tools do |
| `lesson_index` 500s in three languages | the probe had exhausted the pooler itself |
| `open-badge` ignores its input | `doc` omitted, defaulting to `issuer`, so all three probes asked for the issuer profile and correctly received it |

Each was caught by the session that made it, which is the pattern working --
the rule makes it cheaper. **Mechanism: read the interface, construct the
request against it, and only then call a non-matching response a defect.**

**AND A NOTE THAT PAIRS A CORRECT HALF WITH ANOTHER CORRECT HALF IS WORSE THAN
A WRONG NOTE.** This file paired `certidemy.com`'s paths with
`credentials.certidemy.com`'s host. Both hosts serve; both path sets exist; the
combination resolves to nothing.

**Each half survives a spot check alone**, so the error is invisible to any
check short of following the whole instruction -- and the instruction is the
one somebody follows during an incident on the platform's most safety-critical
URLs. **Mechanism: identifier URLs are read out of the signed document, because
a document is the only thing that knows which URLs it promised, and a check
follows the whole path rather than confirming its parts.**

**AND A TOOL DESCRIPTION READ THROUGH A CONNECTOR IS A CLAIM ABOUT THAT
CONNECTOR'S CACHE, NOT ABOUT THE SERVER.** Recorded 2026-09-22. A contract
defect was reported, a fix was nearly written, and neither existed.

`list_lessons` was reported as returning fields its own output schema forbids,
from a real client-side validation failure. Measured against the LIVE server --
its `tools/list` schema against its `tools/call` payload, level by level --
**every key matches and zero tools return an undeclared field.** The rejection
came from a stale registered copy: that copy advertised four certifications
where the live server advertises twelve, and carried a `get_concept`
description the live server no longer serves.

> **MECHANISM: anything asserted from a connector's tool list is verified
> against the live server's declared schema before it becomes work.**

Same family as reporting serving from a view, one layer out: **the artifact the
observer holds is the hypothesis.** The tell was available the whole time -- a
description that disagrees with the live server about something as coarse as
how many certifications exist is not describing the live server.

**REST IS PART OF THE METHOD, AND A PHASE THAT INHERITS THE PREVIOUS PHASE'S
PRESSURE IS MEASURING ITS PREDECESSOR.** Recorded 2026-09-22, and it is the
two-point rule applied to a live service rather than to a corpus.

The pooler ceiling was first measured as: 120 unpaced calls fine, then a
180-call catalogue sweep failing 39 times. The conclusion drawn was that
PACING was the variable and that a partner could not read the whole catalogue.
Both halves were wrong. The phases differed in pacing AND resource mix AND --
the one nobody had written down -- **the sweep began 45 seconds after the
burst, while every later run got 90.**

```
same 180-call mix, UNPACED, 90s rest    180/180
same 180-call mix, 250ms,   90s rest    180/180
same 180-call mix, 250ms,   90s rest    180/180   repeat
same 180-call mix, 250ms,   45s rest    141/180, 37 x 503
```

**The sweep completes, paced or not.** What it cannot do is start while a
previous burst is still draining: the bound is LIVE ISOLATES x the pool size
of 2, and an evicted isolate's connections linger about 100 seconds.

> **AND THE FIX THE WRONG FINDING IMPLIED WAS THE OPPOSITE OF A FIX.** "Ask
> partners to slow down" would have been the recommendation. A slower client
> keeps an isolate idle between calls, and an evicted isolate's replacement
> opens a fresh pool -- so pacing can cost more connections rather than fewer.
> Measured, it changed nothing at 180 calls.

The exact recovery threshold is between 45s and 90s and **is not recorded here,
because the run that would have narrowed it exceeded the time budget.** An
unmeasured number left blank is worth more than a plausible one.

**AN UNREPRODUCIBLE COUNT IS COMMENTARY, NOT MEASUREMENT.** Three careful
counts of one 14-row batch gave **6, 8 and 10** -- the review's figure, the
review's own enumeration, and a line-by-line diff. None is wrong. "Span" was
never defined, so the three counts are answers to three different questions.

**A FIGURE IN A COMMIT IMPLIES A METHOD.** If the method is not stated, the
figure is decoration: nobody can reproduce it, nobody can check it later, and
it will be quoted as though it were measured.

> **MECHANISM: a check reports the ENUMERATION it counted, not only the count,
> and any number in a commit names the predicate that produced it.**

This is the same family as "a number whose name does not say what it is
measured over is half a fact", one level up: there the KEY had to name the
population, here the COMMIT has to name the predicate.

**A RETRANSLATION TRIGGERED BY AN ENGLISH EDIT CHANGES ONLY WHAT THE EDIT
CHANGED.** Paid for 2026-09-21, on the 14 rows regenerated after 358.

The English repairs landed in both languages and did their job. **5 of 7
concepts also drifted in text the source edit never touched** -- including one
whose English description did not change at all, where three spans moved across
two languages anyway.

| | |
|---|---|
| `keep-it-simple` es | `cantidad minima` -> `minima cantidad`, `agrega valor` -> `aporta valor` |
| `keep-it-simple` pt | `atingir o objetivo` -> `alcancar o objetivo` |
| `institution-proxy` pt | `condicao protegida` -> `status protegido` -- **introduced a divergence from es that did not exist before** |
| `ia-ai-evaluation` es, `ia-ict` es | `idoneidad` -> `pertinencia`, against a corpus running 96 to 6 the other way |
| `ia-ict` pt name | singular -> plural, against a singular English name |
| `complementary-practice` es | `se envuelve alrededor` -> `se integra alrededor` |

**EVERY REGENERATED WORD IS AN UNREVIEWED WORD.** The reviewer clears the
requested change and silently clears everything that came with it. That is how
a term the corpus had settled 96 to 6 gets replaced in two rows, inside a
clearance granted for something else entirely.

> **MECHANISM: diff the old translation against the new, assert the changed
> span corresponds to the changed English span, and report all other drift as a
> SEPARATE LIST requiring its own verdict.**

**AND THE SPAN COUNT IS NOT STABLE, WHICH IS ITSELF THE FINDING.** The review
reported *"6 spans across 4 concepts"*; its own `churn_finding` enumerates 8
across 5; a line-by-line diff gives **10 across 5**. Nothing is wrong with any
of those readings -- "span" was never defined, so three careful counts of the
same batch disagree.

**So the mechanism reports the ENUMERATION, not a number.** A drift count is
only reproducible once a span has a definition, and until it does, the list is
the artifact and the count is commentary. The two concepts with no drift at all
-- `tool-misuse` and `daily-backlog-update` -- are what a scoped retranslation
looks like, and both changed exactly where their English changed.

**A PROPOSED GUARD IS MEASURED AGAINST THE CORPUS BEFORE IT IS RECORDED.**
Fourth time in one night that a proposal was wrong in this exact way, which is
why it is a rule and not a note.

The slug-derived-name guard -- *no concept name equals its slug with hyphens
replaced by spaces and the first letter capitalised* -- **fires on 653 of 1,730
names.** Slug-derived names are the CONVENTION, not the defect. ISMS-F's actual
defect is narrower and the narrow form fires on **192, all of them ISMS-F, none
elsewhere**.

**A GUARD THAT FIRES ON THE NORMAL CASE IS DELETED BY THE FIRST PERSON IT
INCONVENIENCES, AND ITS DELETION TAKES THE REAL ASSERTION WITH IT.** That is
the cost: not the noise, but the assertion that leaves with it.

> **MECHANISM: every new check reports its firing count on the current corpus
> in the same commit that adds it, and a count above a stated threshold is a
> DESIGN ERROR, not a backlog of fixes.**

**AND THE SAME RULE CAUGHT THE OPPOSITE FAILURE IN THE SAME MIGRATION.** 358's
duplicate-description guard was first written as exact normalised equality, and
measured **ZERO fires -- including on the ISMS-IA pair it was written for**,
whose descriptions differ by one word (`giving` against `naming`).

**A guard that cannot catch its own motivating instance is worse than one that
fires too often:** it reports clean and retires the question. Comparing the
first 100 normalised characters fires on 3 pairs, catches the ISMS-IA one, and
surfaced two nobody had seen -- `aia-clause-4-1-context` with
`aia-organizational-roles-4-1`, and `aia-clause-4-3-scope` with
`aia-scope-follows-roles`.

**So the count is checked in BOTH directions.** Too many fires is a design
error; zero fires against a known instance is a broken instrument. Neither is
visible without running it, and both look like success in a commit message.

**A BARE ENGLISH NOUN IN A TRANSLATED NAME IS A DEFECT WHEN IT IS A TRUNCATION
AND CORRECT WHEN IT IS A LOAN.** Ruled 2026-09-21 on a corpus census of 31
translated concept names carrying a target-language article in front of a bare
English noun. **Only 11 are defects.**

`el Goal` is not shorthand a Spanish-speaking practitioner uses. It is `Sprint
Goal` with a word missing, and **the missing word is the one that says WHICH
goal.** `el backlog` is what practitioners actually say in both languages, and
expanding it would be correcting the register rather than the meaning.

**THE TEST IS THE MISSING WORD, NOT THE ENGLISHNESS.** Both classes are English
inside a Spanish or Portuguese sentence; only one of them loses information.
That is why a lexical check for "English word after an article" cannot decide
this and the list has to be split by hand, once.

**The mechanism is the split list in `scripts/lib/item-translation.mjs`:**

| | |
|---|---|
| `PIN_LOAN` may stand bare | backlog, sprint, story points, velocity, timebox |
| `PIN_FULL` never truncated | Sprint Goal, Product Goal, Sprint Backlog, Product Backlog, Definition of Done, Sprint Review, Sprint Retrospective, Daily Scrum |

Every `PIN_FULL` entry is two words where **the first disambiguates**: Sprint
Goal and Product Goal are different objects, as are Sprint Backlog and Product
Backlog. Dropping the first word is a meaning change, not a register choice.

**AN ABBREVIATION TAKES THE GENDER OF THE TERM IT ABBREVIATES.** `DoD` is a
LOAN, not a truncation, and it is feminine in both languages because
*Definicion de Terminado* and *Definicao de Pronto* are -- even though the
letters look masculine. Measured across all 3,460 translated concepts: **10
feminine renderings in es-419, 10 in pt-BR, ZERO masculine in either**, names
and descriptions alike. `PIN_ABBREV_GENDER` records a convention that already
exists and is unanimous, so it cannot drift.

**AND THE CENSUS THAT FOUND THESE OVER-REPORTED BY 28 BEFORE ANYONE READ IT.**
The first run said 59. Two false-positive shapes, both found by reading the
output rather than the number: the article may precede the FULL term
(*"Trabajar con el Scrum Master"*), and bare `Scrum` is the framework's name
rather than a truncation of `Daily Scrum` (*"Valores do Scrum"*). A count of a
lexical class is a draft until someone reads its members.

**A PER-SUBJECT COMPLETENESS COUNT SAYS NOTHING ABOUT PER-FIELD
COMPLETENESS.** Paid for 2026-09-21, and it is the sharpest completeness
failure in this file because the check looked complete by its own strongest
signal.

`gen-sibling-check` reported **29 rows in, 29 rows out, every row carrying a
sibling**. Nothing was missing, nothing was short, no read was dropped. It
emitted `description` and not `name` -- and **6 of the 29 flagged defects lived
in the name**, so six siblings were unexamined and all six were serving.

**A check that emits one row per subject looks complete whatever it put IN the
row.** The completeness signal was on the wrong axis: row count answers "did I
see every subject", and the question was "did I see every field a review can
flag". A concept has two translated fields; the check carried one.

> **MECHANISM: a check that extracts a subject asserts on EVERY FIELD A REVIEW
> CAN FLAG, not on the row count.** `gen-sibling-check` now refuses to write
> unless every flagged row carries an English name as well as a description.

**The other four check scripts were audited for the same shape, and one had
it:**

| script | verdict |
|---|---|
| `scan-public-internals` | **immune by construction** -- derives "every text, jsonb and text[] column" from anon's grants rather than naming fields |
| `check-updated-at-writers` | different shape -- the subject is a write SITE and the field is its payload, which it reads |
| `check-migration-state` | different shape -- fingerprints assert named properties per migration |
| `check-open-items` | **HAD IT.** The clausula probe read `lessons.content_md` and a lesson also has a `title`. Fixed: reading both moved the count 4,382 -> 4,390 and left cláusula at 252, so the gap was LATENT, not live -- which is exactly when it is cheap to close |

**A DEFECT ROOTED IN THE ENGLISH TRAPS BOTH LANGUAGES, SO A BLOCKING SLUG'S
SIBLING IS CHECKED BEFORE ANY DRAW CONTAINING IT IS CLEARED.** Paid for
2026-09-21, and the withdrawn inference is the interesting half.

~~The 2026-09-21 clearance blocked per certification+language, on the ground
that a meaning defect is a property of one rendering rather than of the
English.~~ **[WITHDRAWN 2026-09-21 by migration 357.]** That inference came
from 3 observations: for 3 of the reviewer's 4 findings the same concept had
also landed in the OTHER language's draw, and all 3 siblings were correct.

**Those 3 were the concepts that happened to fall in both independent draws.**
That is a sample of what the draw OVERLAPPED ON, not a sample of the question
being asked. A targeted check of all 4 blocking slugs against their sibling
returned **2 hits**, and both sat in draws that had been CLEARED and were
serving:

| | |
|---|---|
| `ISMS-F` / pt-BR | *"os limiares a partir dos quais um risco pode ser retido"* -- the threshold inversion that blocked es-419 |
| `AIMS-IA` / es-419 | *"Este es un requisito de apartado"* -- the clause substitution that blocked pt-BR, same contrast destroyed |

**Mechanism:** for every row a review marks `wrong` or `reword`, the same slug
in the other language is pulled and read in the same pass. Measured yield on
the first four: **2 of 4**. `scripts/gen-sibling-check.mjs` does it, and its
first run across all 29 flagged rows found 29 siblings present, 26 of them
serving.

**A SAMPLE CANNOT FIND THIS ON ITS OWN**, which is why the mechanism is a
separate pass rather than a better sampler: independent per-language draws are
structurally blind to it, because the entire point of an independent draw is
that the two languages see different concepts.

**CROSS-LANGUAGE CONTRAST IS THE INSTRUMENT, SO FUTURE CONCEPT DRAWS ARE
PAIRED, NOT INDEPENDENT.** Same incident, and it is the correction to the
sampler rather than to the rule.

The 2026-09-20 sample drew each language independently, which maximised
distinct-slug coverage -- about 35 concepts per certification instead of 20.
**Every one of the reviewer's four findings was confirmed or refuted by looking
at the same concept in the other language.** That contrast did the work, and an
independent draw supplies it only BY ACCIDENT, on whatever the two draws happen
to overlap: 5 of 20 in AIMS-F and similar elsewhere.

**Mechanism:** the next sampler draws N concept slugs per certification and
emits BOTH languages of each, so every row read carries its own control.

**The trade-off is explicit and belongs in the sampler, not here**, so nobody
"fixes" it back to independent draws for the coverage number:

| | independent | paired |
|---|---|---|
| distinct slugs seen | ~35 | N |
| evidence per slug | one rendering | two, each the other's control |
| defect rooted in English | found by luck | found by construction |

Coverage halves; evidence per slug doubles. The first design bought breadth and
paid for it with two cleared draws serving a defect.

**A SAMPLING GATE IS SCOPED TO WHAT THE SAMPLE CAN SEE, AND A CLEAN SAMPLE OVER
A HOLLOW SOURCE IS THE SHARPEST FORM OF THAT.** Paid for 2026-09-21, on the
concept translation clearance.

AIMS-F returned a **perfectly clean 40-row draw** -- 20 rows in each of two
languages, zero wrong, zero reword. Every mechanical check agreed: no empty
translations, nothing byte-identical to its English, no number drift, no dropped
term, the language guard silent.

**All 154 of its English concept descriptions are the concept's own name
followed by a fixed tail**, byte-exact, measured:

```
AIMS-F      154 of 154 are `<name> as required or described by
            ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.`
every other largest shared 45-character description suffix is 1 or 2 rows
```

The translations were faithful. **A translation-fidelity sample cannot clear
source adequacy, because a faithful rendering of a stub is a correct
translation.** The sample was not wrong; it was answering a different question
from the one the clearance needed answered.

It is also not a general hollowness. AIMS-F's 35 tasks carry knowledge, skills
and abilities on all 35 (655 characters of knowledge on average), its 35 English
lessons average 13,696 characters, and it has 631 English items. **The concept
layer is the only hollow one**, which is exactly why nothing caught it: every
neighbouring surface is real.

**THE MECHANISM, because the rule alone would not have stopped this.** Before a
certification enters any translation queue, a source-adequacy check runs on the
ENGLISH: *a description that is its own name plus a tail shared by more than 20
rows in the same certification is a stub, and that certification does not enter
the queue.* The threshold is data, not taste -- no other certification has a
shared suffix group above 2.

And **every review row records whether a source gate ran**.
`concept_translation_reviews.source_gate_ran` is FALSE on all 24 rows written by
356, which is the truth: no such gate existed when these were translated. A
review table whose provenance column is absent reads as if the question was
never relevant; one that says FALSE says the question was asked and answered
badly.

**TEMPLATE-GENERATED ENGLISH MUST BE TEMPLATE-GENERATED IN TRANSLATION.** Same
incident, second finding, and it is what a clean sample looked like up close.

AIMS-F's es-419 draw rendered ONE fixed English tail **four different ways
across 20 rows** -- `blueprint AIMS-F`, `temario de AIMS-F`, `plan de estudios
AIMS-F`, `temario AIMS-F` -- plus three variants of `as required or described
by`. Every one is defensible Spanish. Together they are four translations of a
string that occurs 154 times and means one thing, which is a glossary
inconsistency a reader meets as four different structural phrases for the same
scaffolding.

**The mechanism:** where more than 20 English rows in one certification share a
description suffix, **that suffix is translated ONCE and substituted**, never
translated per row. A per-row translator cannot see that it has produced a
variant, because each call sees one row.

**The guard is a count and it belongs with the pass:** assert that the number of
DISTINCT translated suffixes is exactly 1 per language. That fires on a corpus
of 154 as loudly as on one of 3, and it is the kind of check a sample can never
be, because the defect is only visible across rows.

**THREE KINDS OF TRANSLATION DEFECT THE GUARDS CANNOT SEE, and they are a
ladder.** Each is fluent, each survived every automated check that existed when
it landed, and each was found only by a bilingual reader:

1. **WRONG LANGUAGE.** Fluent Spanish written into a pt-BR row. Every
   post-condition passed because nothing asserted WHICH language came back. Now
   caught by the language guard in retranslate-item-rewrite.mjs - decisively for
   a whole field, and NOT for a code-switched one, which is recorded there.

2. **WRONG OBJECT.** Right language, wrong referent. "exposure" rendered as
   *vulnerabilidade*; "re-escalate" as *reescalonar*, which means rescheduled.
   Both words are Portuguese and both sentences read correctly - the language
   guard is blind to this by construction. Caught only as named false friends,
   one term at a time, after someone notices.

3. **INSERTED OBLIGATION.** Right language, right objects, and the sentence now
   REQUIRES something the English does not. Group 0987a554's English said the
   determination is "something the organization returns to" with no interval;
   both translations independently added *periodicamente*, across two separate
   regenerations, while the same paragraph stated two clauses earlier that the
   clause imposes no review interval. Each contradicts itself. This is the
   ISO 9001 cadence the English repair removed, coming back in through
   translation.

**The ladder is what matters: each rung is harder to see than the last, and the
last one changes what the item TESTS.** A candidate reading group 9 would learn
that context must be revisited on a schedule - the exact claim the repair was
written to kill, restored in the only two languages nobody re-read.

scripts/lib/pin-compliance.mjs now carries an inserted-cadence rule, and it is
the first rule there that is RELATIVE to the source: a periodicity word is
correct when the English states an interval (clause 8.2's "planned intervals")
and a defect when it does not. **A rule that cannot see the source abstains
rather than guessing** - pass no English and it does not run.

**THE TRANSLATION REVIEW GATE WATCHES THE ENGLISH AND IS BLIND TO THE
TRANSLATION.** Found 2026-09-17. Not fixed, and it is not a content defect --
it is a hole in the mechanism that certifies content.

Both review tables key on a hash of the **English**:

| table | hash over | rows |
|---|---|---|
| `lesson_translation_reviews.en_hash` | `left(md5(en.content_md), 8)` | 41 |
| `task_translation_reviews.en_hash` | the English KSA fields, via `task_ksa_en_hash` | 98 |

So the gate asks *"is this review still about the current English"* and it
works: an English edit moves the hash, the approval goes stale, and the
translation is withheld again with no human action. That was 335's design goal
and it is the reason the reviews are worth recording.

**It never asks whether the review is still about the current TRANSLATION.**
Nothing pins the reviewed side. A reviewed Spanish paragraph can be rewritten
to say something else entirely and the approval still stands, because the hash
is over the other document. **139 approvals are in that state**, and they are
exactly the rows the gate lets through -- an unreviewed row is withheld and
cannot be silently altered, so the hole opens only on the text a human has
signed off. The signature is what makes it reachable.

**AND IT IS NOT HYPOTHETICAL: THIS REPOSITORY USED THE PROPERTY THE DAY IT WAS
FOUND.** A pt-BR paragraph in `02-03-amendment-1-2024` was edited from passive
to active voice, and the six `en_hash` values for that batch were re-verified
against the live English and were unchanged -- correctly, because only a
translation had moved. That is the same mechanism, used deliberately and
benignly, and nothing anywhere would have distinguished it from a rewrite that
changed the meaning.

**Four scripts write translations and none of them touches a review row:**
`retranslate-repaired-passages.mjs`, `fix-modal-inflation.mjs`,
`restore-quote-markers.mjs` and `apply-queue-edits.mjs`. So the realistic path
is not malice, it is a sweep: a modal or terminology pass over a reviewed
corpus invalidates every approval it edits and leaves all of them marked
`approved`. **The 252-reference `clausula` sweep would do this to ISMS-F's
newly cleared rows on its first run.**

**The fix is symmetry, and it is small:** store a second hash over the
translation as reviewed (`tr_hash`), and have the gate require BOTH to match.
Then a translation edit re-closes the gate exactly the way an English edit
does, re-approval is one insert, and a sweep announces itself by withholding
what it touched rather than by nothing happening. **Deferred deliberately on
2026-09-17** -- it changes the gate on a live demo path and must not be done
under time pressure. Anything that edits a reviewed translation before it lands
must re-review the rows it touched, by hand, and there is no instrument that
will remind you.

**The general rule: A HASH GATE PROVES ONLY THE SIDE IT HASHES.** Two documents
and one hash is half a check, and the missing half is invisible because the
present half works.

**AND THE HALF THAT WAS MISSING MADE REVIEWED CONTENT UNMAINTAINABLE, WHICH IS
WORSE THAN THE DRIFT IT GUARDED.** Migration 364 closes the concept-grain side
of that gate, and the reason it got written is the part to generalise.

Twice in one session the honest answer to *"may I edit this cleared
translation"* was to decline -- 4 bare capitalised `Seção` in three CLEARED
ISMS-IA rows, and the `apreciación`/`evaluación` pin across three
certifications. Both are correct fixes. Both were held because **nothing would
re-open the review afterwards**, so landing them would have left content marked
`approved` that no human had read in its current form.

> **RULE - A TRANSLATED-SIDE EDIT MUST INVALIDATE ITS OWN REVIEW.** Store a
> hash of the translation as reviewed, and have the gate require it alongside
> the English hash. Then a sweep announces itself by withholding what it
> touched, re-approval is one insert, and correcting reviewed text stops being
> a thing you have to refuse.

**A GATE THAT CANNOT BE RE-CLOSED IS A GATE THAT FORBIDS MAINTENANCE.** That is
the cost nobody prices when the second hash is deferred: not drift, but a
growing set of known-correct fixes that everyone declines to make. The backlog
looks like discipline and is actually paralysis.

**The gate is PER ROW, and that distinguishes it from the one above it.** 359's
English hash is per concept -- an English edit withholds both languages, which
is right, because the source moved for both. A translation edit moves one
rendering, so editing es-419 must leave pt-BR serving. 364's proof asserts
exactly that: one edit, one row withheld, the sibling language still serving.
A per-concept tr_hash would have passed every count assertion and been wrong.

**THE REPRODUCTION POLICY, AND THE INSTRUMENT ENFORCES IT EXACTLY.** Adopted
2026-09-22, beside the gate parameters because a policy kept somewhere else is
a second copy of a fact.

> **A description may NAME a clause and state what it requires IN OUR OWN
> WORDS. It may quote a short distinctive phrase where the wording itself is
> the examinable thing. It may NOT reproduce a contiguous span of the
> standard's own sentence at or beyond TEN WORDS.**

The 10 is `ABS_RUN` in `scripts/lib/leak-score.mjs`, so the gate enforces the
policy rather than approximating it.

**WHY ATTRIBUTION IS NOT THE ANSWER.** 137 of AIMS-IA's 158 descriptions --
**87 percent** -- are shaped *"clause N.N defines/requires/states ..."*
followed by the text. At that rate it is not drift, it is the pedagogy of an
internal-auditor certification, where the thing taught genuinely is the
requirement as written.

**Attribution answers the plagiarism question and does nothing about the
reproduction one.** Twenty-one words of a copyrighted standard served
unauthenticated are the same twenty-one words whether or not the row says
where they came from, and **an accreditation assessor reads the second
question, not the first.**

So the instruction is not *rewrite until the gate is quiet* -- that pushes
toward paraphrase that loses the examinable point. You cannot teach an auditor
what clause 4.1 requires while avoiding the words *determine external and
internal issues*. Naming the clause and restating the requirement is allowed
and encouraged; copying the sentence is not.

**A SIMILARITY THRESHOLD IN ABSOLUTE TERMS SELECTS BY LENGTH, NOT BY MEANING.**
Recorded 2026-09-22. **Third instrument this week whose scoring turned out to
be arithmetic wearing the costume of judgement**, after coverage-as-a-ratio and
run-of-4-on-a-short-description.

The contradiction sweep required FOUR shared distinctive terms, returned 50
candidates, and missed its own founding case. `auditor-objectivity` is seven
words; once `auditor`, `audit` and `requirement` are stopworded as
corpus-frequent, TWO distinctive terms remain. A seven-word row can never reach
four, **so the threshold excluded by length what it was meant to select by
meaning** -- and the exclusion is silent, because a row that cannot clear the
bar simply never appears.

> **MECHANISM: a similarity threshold is expressed RELATIVE to the smaller of
> the two things compared.** Half its distinctive terms, floor two. A long row
> still needs real overlap; a short row is judged on the terms it actually has.
> Candidates fell 50 to 3 -- the long rows sharing four terms out of forty were
> never a signal.

**And the regression control has to run on a FIXTURE, not on live data.** Its
first version asserted the founding contradiction was present in the LIVE
corpus. That worked once, then failed -- because the row had been FIXED. **A
control that depends on a defect remaining in production forbids repairing
it**, which is the `migration tip vs disk` shape. The fixture holds the
original text of both rows and keeps working after the repair; the live status
is reported separately, as a different question.

**THE GENERATOR IS THE ONLY CALLER THAT MAY STAMP A HASH, AND IT HAD TO LEARN
TWO NEW THINGS TO DO IT.** Recorded from the retranslation run.

`gen-concept-translations` was INSERT-ONLY: it skipped any concept that already
had a translation. Correct for a first pass and useless after an English
rewrite, which is exactly when the en_hash gate has withheld rows so they can
be regenerated. `--stale` treats a row whose stored `en_hash` no longer matches
as ABSENT, so the planner picks it up.

Two failures on the way, both worth keeping:

- **`23502`.** Migration 364 made `tr_hash` NOT NULL and the generator predates
  it, so the first upsert failed on a column it had never written. It now calls
  `public.translation_hash` rather than reimplementing it -- a second
  hand-written copy of one idea diverges, and the divergence would surface as
  rows withheld for an arithmetic difference rather than an edit.
- **`23505`.** `merge-duplicates` resolves against the PRIMARY KEY unless told
  otherwise, and the key here is `id`. The natural unique is
  `(concept_id, language)`, so the conflict target has to be named explicitly.
  The error helpfully printed the row it was trying to replace.

**AND SIX ROWS CAME BACK tr_hash-STALE AFTER A GENERATOR THAT HAD JUST STAMPED
THEM**, which reads as an instrument contradicting itself. It is not. All six
were edited by the `evaluacion` and `Secao` pins, which deliberately do NOT
re-stamp -- the stale hash IS the withholding signal -- and all six had a
CURRENT `en_hash`, so `--stale` correctly left them alone. **Attributed row by
row against the pin plans before the cause was asserted**, because "the
generator is broken" and "the pins did this on purpose" produce the identical
observation.

**THE LIMITS ON WHAT THE TRANSLATION CLEARANCE CAN CLAIM.** Recorded beside
the clearance so the claim made is the claim supportable:

- **The leak index is ENGLISH-ONLY.** Spanish and Portuguese editions of these
  standards exist and are not held, so whether a translated row coincides with
  ISO's own official rendering is **unmeasurable**. The ORDERING protects in
  practice -- these translations were made from clean English rather than from
  reproductions -- but no instrument here can demonstrate it, and the
  difference between those two statements is the whole point.
- **ISO/IEC 27000 is the 2018 edition**, against a 2022 standard that
  references it undated.
- **ISO/IEC 42006 is not indexed** and must never be reported as covered.
- **A score of 0 means "no reproduction of the INDEXED documents"**, never
  "no reproduction".

**A NEGATIVE CLAIM CARRIES A POSITIVE CONTROL, ALWAYS.** Adopted 2026-09-22 as
the standing mechanism, replacing declared-citation-rows.

A positive claim is verified by FINDING text. A negative claim -- *"27001 does
not say X"* -- can only be verified by FAILING to find it, **and failing to
find something is exactly what a broken search does.** That is the vacuous-pass
shape this file already records three times over.

> **MECHANISM: every negative claim names a POSITIVE CONTROL -- a phrase from
> the same document, ideally the same clause, that MUST be found. If the
> control fails the absence result is DISCARDED, not reported.** A search that
> cannot find what is there says nothing about what is not.

**And absence is bounded by the index, so every negative verdict names what it
searched.** *"Absent from the indexed standards"* is not *"absent from ISO"*:
ISO/IEC 17021 and 17024 are not on disk, and 17021 is where the rule this was
all about actually lives.

`scripts/verify-claims.mjs` is the instrument. First run: 6 claims, 0 control
failures, 0 claim failures.

**WHY IT REPLACED DECLARED-CITATION-ROWS.** That mechanism asked the author to
declare which rows made citation claims, on the assumption they were a
minority. In AIMS-IA and ISMS-IA **every row cites a clause**, so the
declaration selected everything and therefore nothing. A filter that matches
the whole population is not a filter.

**ONE CERTIFICATION CAN ASSERT WHAT ANOTHER DENIES, AND NOTHING WAS CHECKING.**
Found 2026-09-22 and it is a new defect class.

ISMS-F served **`auditor-objectivity :: the requirement that auditors do not
audit their own work`** while AIMS-IA and ISMS-IA both stated that no such rule
exists in any of the standards and named reading it as a requirement as the
trap. **Three certifications, one unauthenticated endpoint, opposite claims
about what a standard says.** A partner pulling `get_concept` across the
catalogue -- which is what an ISO practice does -- meets all three together.

Verified with controls before anything was changed: the phrases are **ABSENT**
from 19011:2026, 27001:2022, 42001:2023 and 27002:2022, with four positive
controls found; and 27001 cl.9.2.2 **does** require auditors to be selected and
audits conducted so as to ensure objectivity and impartiality. ISMS-F's row was
the wrong one and was reopened for one row, because a contradiction is worse
than either version of it.

> **EVERY GATE HERE CHECKS A ROW AGAINST A STANDARD. NOTHING CHECKED A ROW
> AGAINST ANOTHER ROW.** `scripts/sweep-requirement-contradictions.mjs` pairs a
> DENIAL in one certification against an ASSERTION in another on shared
> distinctive vocabulary. It generates candidates and decides nothing.

**ITS FIRST VERSION COULD NOT SEE ITS OWN FOUNDING CASE.** It required four
shared distinctive terms, returned 50 candidates, and **none of them was
`auditor-objectivity`**. That row's entire description is seven words; once
`auditor`, `audit` and `requirement` are stopworded as corpus-frequent, TWO
distinctive terms remain. **The threshold excluded by LENGTH what it was meant
to select by MEANING.**

The threshold is now relative to the shorter row -- half its distinctive terms,
floor two -- and **a regression control refuses to print any list unless
`auditor-objectivity` is surfaced.** Candidates fell from 50 to 3, because a
long row sharing four terms out of forty was never a signal.

**A CLAUSE ADDRESS IS NOT A KEY. THE KEY IS (STANDARD, ADDRESS).** Recorded
2026-09-22, before it cost anything.

Pairing ISMS-IA against AIMS-IA by clause address found 17 addresses covering
47 rows -- and **ISO 19011's clause 4.x and 5.x numbers collide with the
harmonised management-system clause 4.x and 5.x.** Clause 4.1 is *context of
the organization* in 27001 and 42001, and *principles* in ISO 19011. Clause 5.3
is *roles and responsibilities* in the management-system standards and *audit
programme risks* in 19011.

So four of the seventeen groups hold two unrelated subjects, and "one analysis
per clause address" would have merged them. Keyed on (standard, address) the
collisions separate.

**An unqualified clause reference means the certification's OWN standard** --
ISMS-IA writing *"Clause 8.2 requires"* means 27001, AIMS-IA means 42001 -- and
a detector without that default returned "unknown" for eight of seventeen and
manufactured one collision that does not exist.

**AN EXEMPTION IS DEFINED BY WHAT THE THING IS, NOT BY WHAT IT LOOKS LIKE IN
THE EXTRACTION.** Recorded 2026-09-22. Third exemption in this corpus to need
narrowing after adoption.

The title-class exemption's first definition accepted *"a short line with no
terminal punctuation"*, because that is what a control title looks like in
Table A.1. **It is also what a terms-and-definitions entry looks like.**
ISO/IEC 22989's definition of `availability` extracts as one 73-character line
with no full stop, so the exemption fired on a genuine nine-word reproduction
of a defined term and **excused the exact thing the gate exists to catch.**

**A SHAPE-BASED EXEMPTION WILL LET A DIFFERENT THING PAST**, because two
unrelated constructs share a shape once a PDF has been flattened to text. The
flattening is what destroys the distinction: in the document a control title
and a definition entry look nothing alike.

> **MECHANISM: an exemption states the PROPERTY it exempts** -- here, the span
> is a heading or contents entry AND the description carries no sentence from
> the clause body -- **and its firing count is read ROW BY ROW before it is
> adopted.** A count alone would have shown "2 exempted" and looked reasonable;
> reading the two showed one of them was `availability`.

**AND THE PREDICTION THAT THE 8 ANNEX ROWS NEEDED A WIDER EXEMPTION WAS WRONG,
FOR A REASON WORTH KEEPING.** It was reasoned from the LABEL -- these rows sit
inside Annex A, Annex A is full of control titles, therefore they reproduce
titles. They do not. They reproduce annex BODY prose: *"Audit sampling takes
place when it is not practical or cost-effective to examine all available
information"* is a sentence, not a name.

**INSIDE ANNEX A and IS A TITLE are different properties**, and the first does
not imply the second. Same family as every other instance in this file where a
category was inferred from a name instead of measured from the members --
reasoning from the label rather than from the spans.

**THE TABLE OF CONTENTS IS A DECOY IN EVERY INDEXED PDF.** Three instruments
have now been written against these documents and **all three hit it on the
first attempt**:

1. `clauseText` asked for 27001 clause 5.2 and got `5.2Policy........ 3`.
2. The fix -- last occurrence -- then walked PAST the body into Table A.1,
   where 27001 numbers its controls 5.1, 5.2, 5.27, so a main-body request
   returned **Annex A control A.5.2**.
3. The annex-boundary locator took the FIRST `annex a normative`, which is the
   contents entry: 27001's boundary landed **6 percent** into the document and
   42001's at **2 percent**, misclassifying nearly every clause-text match as
   annex structure -- while finding no boundary at all in seven other
   standards, so under-reporting there at the same moment.

> **MECHANISM: ONE shared locator, `scripts/lib/iso-locator.mjs`, used by every
> instrument that addresses a clause or an annex boundary.** A new locator
> inherits the existing one's defences -- dot-leader reject, last occurrence,
> the watermark-merged heading allowance -- or states why it does not need
> them. `leak-score`, `audit-aimsf-claims`, the census and the union-fire
> report all point at it; there are no private copies.

**AND A SHORT LINE IS NOT A HEADING.** The title-class test first accepted *"a
short line with no terminal punctuation"*, which is what a control title looks
like in Table A.1 -- and **also what a terms-and-definitions entry looks
like.** ISO/IEC 22989's definition of availability extracts as one 73-character
line with no full stop, so the exemption fired on `availability`: a genuine
nine-word reproduction of a defined term, **excused by the rule written to let
titles past**. An exemption that excuses the thing it exists to catch is worse
than no exemption, because nothing in its output says so.

**A DESCRIPTION MAY NOT POINT AT A REASON IT DOES NOT GIVE.** Survived three
batches, so it is a rule rather than an observation.

`time-to-discovery` ended *"and why it widens here"* and never said why. Batch
1 carried *"both halves matter"* -- which halves? -- and *"cuts both ways"*,
followed by one way.

> **MECHANISM: a description containing *why*, *both*, *the second*, *that
> distinction* or any similar pointer must be readable STANDING ALONE, with no
> antecedent outside itself.** It is served alone, and the description it
> replaced is not there to supply the referent.

Same family as the taskBlock defect: a sentence pointing at content the payload
does not carry.

**WHERE A COUNT AND AN INSTRUCTION CONFLICT, THE INSTRUCTION GOVERNS AND THE
CONFLICT IS REPORTED.** Recorded 2026-09-22. A review's verdict block read
*apply 37 / return 3* while the instruction below it also returned a fourth
row. 40 minus 4 is 36, and the two cannot both hold.

Taking the instruction is right because a count is a summary of intentions and
an instruction IS one. **Reporting the conflict is the other half**: silently
resolving it either way leaves the next reader with a number that does not
reconcile and no record of why.

**AND A CORRECTION CAN CARRY THE DEFECT IT CORRECTS.** The sharpest instance
in this file of that shape.

`pdca-cycle` was returned for an undeclared citation claim -- *"clauses 6 and 7
plan, 8 does, 9 checks, 10 acts"* -- with the correction that the conventional
mapping puts clauses 4 THROUGH 7 on Plan. Measured: **`plan-do-check-act` and
`PDCA` appear in NEITHER ISO/IEC 27001:2022 NOR ISO/IEC 42001:2023.** Only in
ISO 19011:2026.

So **both** mappings were unsupported: the original naming 6 and 7, and the
correction naming 4 through 7. An undeclared citation claim was corrected with
another undeclared citation claim, **inside a ruling whose entire subject was
unverified claims.** Dropping the mapping was the only move that did not add a
third.

The general form: **a correction is a claim, and it is not exempt from the
verification the thing it corrects just failed.**

**NOT WITHHOLDING THE AIMS-IA REPRODUCTIONS -- DECIDED 2026-09-22, EXPIRES
2026-09-25 (THURSDAY).** Recorded with its expiry so it is never read as a
judgement that the rows are fine.

69 AIMS-IA rows reproduce clause text and are cleared and serving. They are NOT
being re-provisioned: serving fallback for 69 concepts makes the certification
look half-built to exactly the partner being courted, which is a worse Friday
than three days of reproduction risk.

**This is a timing judgement, not a content one.** Revisited Thursday: if the
20-plus-word buckets are not clear by then, **the longest rows get withheld
rather than shipped.**

**A SPLIT RUN IS ONE REPRODUCTION ONLY IF THE SOURCE AGREES IT IS.** Adopted
2026-09-22, and it is the coverage rule's missing half.

`confidentiality` read *"information is not made available to unauthorized
individuals, entities or processes"* -- ISO/IEC 27000's definition with **two
words omitted**. That omission splits one total reproduction into runs of 5 and
6, so longest-run coverage is 6/11 = 0.545 and the gate said nothing. The row
was live and unauthenticated. Union coverage is 11/11 = **1.00**.

**A RAW UNION IS NOT THE FIX.** It re-creates the cross-document chaining
defect from the other end: `pdca-cycle` scores 0.667 by summing *"plan do check
act"* and *"of a management system"*, two commonplaces four words apart that no
source ever joined. Summing spans the source never joined is the same
manufactured adjacency, one level up.

> **MECHANISM: two runs merge only when ALL THREE hold --**
> **(1)** they abut in the DESCRIPTION, gap <= 0;
> **(2)** they come from the SAME SOURCE DOCUMENT;
> **(3)** they are near-contiguous IN THE SOURCE, forward gap <= 3 words,
> which is what an interpolation costs.
>
> Condition 3 is the one that cannot be dropped. Without it a description that
> happens to abut two unrelated commonplaces scores as a total reproduction,
> and we manufacture the finding rather than measure it.

**`confidentiality` satisfies all three, and the source-side gap is 2** -- the
exact cost of the omitted "or disclosed". That is what a reproduction with one
edit looks like, measured rather than asserted.

**THE CONDITIONS ARE A FILTER, NOT INSURANCE: THEY DROPPED 3 OF 6.** Abutting
alone would have added six rows corpus-wide; the source-side tests reject half
of them:

```
ia-independence-of-the-activity-audited-4-6   source gap 5     rejected
ia-policy-availability-and-communication      no forward gap   rejected
aia-control-objectives-a-2-to-a-10            gaps 96, 82, 389, 3078   rejected
```

The last is the argument in one row: a description that ENUMERATES control
objectives naturally abuts phrases scattered across an annex. Every pair abuts
in our text and none is contiguous in the standard.

**Final fire set, 1,729 live concepts:** 15 -- ISMS-F 9, AIGRM-I 3, ISMS-IA 2,
AISM-I 1. Three newly visible: ISMS-F 1, ISMS-IA 2.

The scorer is `scripts/lib/leak-score.mjs`, shared, so the gate and every
report cannot drift apart.

**MAIN-BODY CLAUSES AND ANNEX A CONTROLS SHARE A NUMBER SPACE, AND THE
EXTRACTOR RESOLVED THE WRONG ONE.** Found 2026-09-22 while verifying an
unrelated claim.

A request for ISO/IEC 27001:2022 main-body clause **5.2 (Policy)** returned
**Annex A control A.5.2 (Information security roles and responsibilities)**.
The last-occurrence rule exists to skip the table of contents, whose lines
carry dot leaders -- and it then walks on past the main body into Table A.1,
which numbers its controls 5.1, 5.2, 5.27. Two different requirements, one
address, and the wrong one reads as a confident answer.

**Measured shadowing, per indexed standard:**

```
27002:2022   244 addresses in Annex A shadow a main-body number
27001:2022    90
27004:2016    10
42001:2023     0   -- its annex uses A.2, A.3 ... so it shadows NOTHING
```

**That last line is why the AIMS-F claim audit was unaffected, and it is the
part worth stating rather than the reassurance.** Re-run after the fix: **81
claims, 67 OK, 0 FAIL, 14 UNVERIFIABLE -- identical, no verdict moved.** Not
luck: the audit's claims are about 42001, whose annex cannot shadow, and it
makes exactly ONE 27001 clause lookup -- 4.1 -- while 27001's Annex A controls
begin at 5.1. Nothing it asked could have resolved wrongly.

**An identical result after a real fix is only reassuring once you can say why
it is identical.** A no-op fix produces the same output as a fix that mattered.

**AND IT IS THE SECOND TIME THIS PDF HAS DEFEATED A TEXT TEST.** The first was
`4.1Understanding` extracting with no space behind a licence-watermark column,
so `clauseText` returned null for every clause of 27001 and *"clause 4.1 does
not mention roles"* scored OK against an empty string. The 5.2 heading is
unreachable by any line test for the same reason -- it extracts as
`SNV / licensed to ... / ISO/IEC 27001:2022  5.2Po`.

> **RULE - A CLAUSE THE EXTRACTOR CANNOT LOCATE IS UNRESOLVABLE AND LOUD,
> NEVER EMPTY AND SILENT.** An extraction returning nothing must FAIL the check
> that requested it, not satisfy it. Mechanism: the caller treats "not found"
> as a failure of the check rather than as an empty haystack, and EMPTY
> EXTRACTION is counted as its own verdict class beside OK and FAIL.

Both directions are asserted as regression controls: main-body 5.2 must not
return the annex text, **and** the annex control must still be reachable when
asked for explicitly. A one-sided check passes on a lookup that returns
nothing at all.

**A GATE'S STORED VALUE IS WRITTEN ONLY BY THE THING THAT CAN PROVE IT.**
Recorded 2026-09-22, and it is the sharpest instance in this file of an
instrument reporting success while not looking at anything -- because here the
instrument is SOUND and the caller blindfolds it.

`en_hash` records the English a translation was generated FROM. `tr_hash`
records the translated text as reviewed. `mcp.concept` compares both on every
read and withholds the row when either has moved. **Every clearance script in
this repository recomputed the hash from the row's CURRENT source and wrote
it.** That makes every row fresh by construction -- including a row whose
English moved after the translation was generated -- because the value the
gate is about to compare against was just overwritten with the answer it
wanted.

**The gate is never consulted. It is intact and blindfolded.** No amount of
reading the view would find this; the defect is entirely in the callers.

`apply-paired-review-fixes.mjs` carried the justification in its own comment:

> *"Names moved, so every AIMS-F row's hash must be recomputed or the gate
> stays shut on rows whose translation is unchanged."*

**The gate is supposed to stay shut.** That sentence is the defect arguing for
itself, and it reads as maintenance.

> **MECHANISM: hash columns are written ONLY from the generator path, declared
> in one explicit list. Every other caller READS, COMPARES, and REFUSES the row
> on mismatch; a refusal names the slug, the stored hash and the computed hash,
> and the run exits non-zero so a partial clearance cannot read as a success.**

`scripts/check-hash-writers.mjs` enforces it and is invariant 7 in
`verify-invariants`. Measured the day it was written: **30 write positions
examined**, 1 generator, 1 dual-role, 1 review-row recorder, 0 undeclared.

**THE EXPOSURE WAS ZERO, AND THE DENOMINATOR IS WHAT MAKES THAT WORTH SAYING.**
Recomputed every stored hash against current source: **0 of 2,544 cleared
concept rows**, 0 of 41 lesson reviews, 0 of 98 task reviews, 0 of 30 item
reviews. The defect was LATENT -- the re-stamps happened to write values that
were already correct. **Latent is not safe; it is unobserved.**

**AND THE FIRST MEASUREMENT OF IT WAS WRONG IN THE USUAL DIRECTION.** The
lesson check first reported **41 of 41 stale**, because it recomputed with
`left(md5(content_md),8)` while 352 stores `translation_hash(content_md)`,
which concatenates with separators. **A false alarm across an entire corpus,
from using a different instrument than the one that wrote the value.** Caught
by reading 352, not by re-running. **Recompute with the FUNCTION THAT WROTE
IT**, never with a formula that looks equivalent.

**A SCRIPT THAT AUTHORS AND CLEARS IS THE DEFECT IN ITS PUREST FORM**, because
the authoring half supplies the excuse for the clearing half to stamp.
`apply-reread-clearance.mjs` did both: it wrote three translated rewords and
cleared twelve rows, stamping all twelve from current content -- so the gate
was never consulted for the nine it had no business vouching for. It is now
split in code and **named as DUAL ROLE in the census rather than folded into
the generator list**, because folding it in would hide exactly the shape that
needs to stay visible.

**AND THE SAME COLUMN NAME MEANS OPPOSITE THINGS IN TWO TABLES.**
`concept_translation_reviews.en_hash` is the RECORD OF A REVIEW -- writing it
is the whole point of writing a review row. `concept_translations.en_hash` is
the gate's stored value. A classifier blind to the target table reported a
correct recorder as a defect on its first run, and a guard that cries wolf gets
loosened.

**A COSMETIC FIX TO A NAME IS A SOURCE CHANGE.** `concept_row_en_hash` is
`md5(name` + separator + `description)`, so **21 capitalisation fixes
invalidated 44 translations.** That is the gate behaving correctly -- the
translated names really did render the old casing -- but it means **no edit to
a concept row is ever cosmetic downstream.** Nothing was exposed only because
both ISMS-F draws are blocked; had they been serving, a capitalisation pass
would have withheld 44 live rows with no warning.

**AND IT HAS A THIRD STATE THE FIELD NAME CANNOT CARRY: ENGLISH.** Found
2026-09-22, on the wire, minutes after `get_concept` v3 shipped.

`mcp.concept` computes the flag as `ct.description is null`, and **no
`concept_translations` row has `language = 'en'`** -- the English lives on the
concept itself. So the view answers **true for every English read**, and the
first English `get_concept` v3 call told the caller that the description it had
asked for was a substitute.

The view is not wrong. It answers a question about a ROW -- *did a translation
join* -- and the field is read as a question about a REQUEST -- *is this the
language I asked for*. Those coincide for `es-419` and `pt-BR` and come apart
for English, which is the only language whose text is not in that table.

> **MECHANISM: the row-level meaning stays in the view, and the request-level
> meaning is computed where the request is known** -- `request.language !== "en"
> && row.description_is_fallback === true`, in the Worker. Pushing the language
> test into the view would change `courseware-read`'s own contract for every
> other caller to fix a question those callers are not asking.

**It was caught because the verification asked for a case nobody had a reason
to doubt.** The wire check covered a cleared row and an uncleared row -- the
two the feature is about. English was in the list only because the brief said
*"English is unchanged in substance"*, and the substance was unchanged; the
flag beside it was not. **The control that finds this kind of defect is the one
aimed at the case you are confident about.**

**`description_is_fallback` RENDERS BOTH WITHHOLDING REASONS IDENTICALLY.**
Recorded as a finding 2026-09-22. **The contract is NOT changed** --
contractVersion 2 is partner-facing and this is not the week to move it.

Two different states produce the same field:

| state | why the row is withheld |
|---|---|
| **not yet reviewed** | `is_provisional = true`; a human has never cleared it |
| **source moved** | cleared, but `en_hash` or `tr_hash` no longer matches |

A caller sees `description_is_fallback: true` and an English description in
both cases, and **cannot distinguish "not translated yet" from "the translation
went stale"** -- which are different things to tell a partner. The first is a
roadmap question; the second is a freshness question about content they may
already have seen.

A contractVersion 3 would add a reason: `fallback_reason: "unreviewed" |
"source_changed" | null`, computed in the view from whichever predicate failed.
It is additive and cheap; the cost is a contract version, not the field.

**A CLAIM THAT A CHECK "FIRES ON X AND NOWHERE ELSE" IS A CLAIM ABOUT THE
POPULATION, AND NEEDS A POPULATION MEASUREMENT.** Recorded 2026-09-22.

The slug-derived-name guard was recorded here as firing on ISMS-F's 192 names
"and on nothing else in 1,730". Measured: the narrow form as described fires on
**0 rows corpus-wide**, and the form that yields 192 fires on **521 rows across
ten certifications**. The figure was read off one certification and asserted of
the corpus, and nobody had run it against the other eleven.

> **MECHANISM: a guard's firing count is recorded PER CERTIFICATION WITH ITS
> DENOMINATOR, never as a single number** -- and a guard whose count is
> distinctive only on one certification is a guard fitted to its training set,
> not a detector.

`pin-initialism-case.mjs` prints that table before it writes anything, and
refuses when its own count disagrees with the census.

**Fourth instance this week of a conclusion drawn from a partial read**:
per-language blocking (inferred from 3 overlaps, real rate 2 of 4), the
description-collision guard (0 fires against its own motivating instance), the
`en_hash` grain, and this.

**AN UNREPRODUCIBLE NUMBER IS WITHDRAWN, NOT CARRIED.** *"13 of 16
concept-scale gate fires are ISMS-F"* could not be reconstructed. The measured
figure is **11 of 15 over 1,729 live concepts**; part of the difference is the
`security-control` repair and part is unknown.

A number that cannot be re-derived from the corpus is commentary, and it will
be quoted back as evidence by the next reader -- this file's whole thesis,
applied to its own counts.

> **MECHANISM: a recorded count names the script that produces it, and a count
> that no longer reproduces is STRUCK, with its replacement beside it**, rather
> than footnoted or quietly updated.

**AND THE SECOND WITHDRAWAL IS SHARPER, BECAUSE THE INSTRUMENT FAILED ON ITS
OWN EXEMPLAR.** The ISMS-F census reported *"174 of 192 carry no teaching
move"*, and that number was about to scope a 192-row rewrite.

It was measured with a list of teaching words. Run against the text whose
verdict is already settled -- `security-control` as ratified, the house style
precisely because it teaches -- **both the census detector and an independent
second detector call it a GLOSS.** One wants "but" after a negation and gets
"not by whether"; the other wants "not a" and gets "not to accept". The row
performs the clearest teaching move in the corpus using none of the words
either list contains.

> **A LEXICAL DETECTOR CANNOT MEASURE WHETHER PROSE TEACHES.** The 174 is a
> fact about a word list. Withdrawn, not refined -- and the 134 the two
> detectors agree on is withdrawn with it, because agreement between two
> instruments that both fail the exemplar is not evidence.

**What survives the withdrawal is the MECHANICAL half of the census**, which
needs no judgement and no vocabulary: **192 of 192 are one sentence or fewer**,
median 59 characters, max 131. That alone justifies treating the description
set as the unit of repair, and it is a stronger argument than the one the
detector was supplying.

**A HARDCODED FACT INSIDE AN INSTRUMENT GOES STALE BY DEFAULT.** The concept
gate printed

```
ISO/IEC 27000   delegated to by 27001:2022 cl.3   NOT ON DISK
ISO/IEC 22989   delegated to by 42001:2023 cl.3   NOT ON DISK
```

directly beneath an INDEX line naming `27000:2018` and `22989:2022` as indexed.
Both were purchased and indexed on 2026-09-21; the gate contradicted itself in
adjacent lines of its own output and had done since.

**A reported gap that has been CLOSED is worse than a stale note**: it argues
against buying something already owned, and it invites a reader to discount a
real fire as unreachable. Two of the eleven ISMS-F fires are against exactly
those two standards.

> **MECHANISM: coverage facts DERIVE from `iso-corpus-manifest.json`. An
> instrument never carries a second copy of what it reports on.**

**AND THE TWO WITHHOLDING MECHANISMS ARE INDISTINGUISHABLE IN THE OUTPUT,
WHICH IS WHERE THE RISK IS.** Measured 2026-09-22 on ISMS-F, answering whether
a row can be both blocked-by-review and withheld-by-`en_hash`.

**It can, and 22 rows per language are in that state right now.** `mcp.concept`
gates on `is_provisional = false AND en_hash = live AND tr_hash = live` -- and
**does not read `concept_translation_reviews` at all**. A review verdict is not
a gate; `is_provisional` is the gate, and the review table is the record of why.

| | |
|---|---|
| **The gate is safe.** | The three predicates are ANDed, so clearing a block cannot release a row whose English has moved. Neither mechanism masks the other. |
| **The PROCEDURE is not.** | Every clearance script here RE-STAMPS `en_hash` and `tr_hash` rather than verifying them. A clearance that re-stamps releases an English-stale row without anyone reading it -- the gate never gets consulted. |

So the defect is not in the view, it is in the shape of every clearance written
so far. **A clearance must verify the hash it is about to write, and refuse the
rows where the English moved since the review**, rather than stamping current
content over a stale approval.

Both states also render identically -- `description_is_fallback = true` -- so
nothing a caller sees distinguishes *"withheld pending review"* from *"withheld
because the source changed"*, and nothing in the view can.

**A trivial English edit creates real re-read debt.** The 21 initialism casing
fixes moved `concept_row_en_hash`, which is `md5(name || '|' || description)`,
on 22 rows -- so 44 translated rows now look like they need re-reading when
only the capitalisation of an initialism in the English name moved. Nothing was
withheld that was not already withheld, because ISMS-F is blocked in both
languages. **Had it not been, a casing pass would have withheld 44 serving
rows.**

**AND A TRANSLATED FIELD STRUCTURALLY RICHER THAN ITS ENGLISH IS A CANDIDATE
ENGLISH DEFECT.** Paid for on the AIMS-F concept names: 11 English names were
raw slugs with hyphens swapped for spaces (`SoA annex a relationship`), and
both translations rendered them as real phrases. **The translators had silently
repaired the source**, in two languages independently, for weeks.

Nothing reported it, because every check ran down one side. A translation
review asks *is this faithful*; a source-adequacy check asks *is the English
good*. Neither asks *why is the translation better than what it translates*.

> **RULE - MAKE THE COMPARISON AN ASSERTION.** Where a translated field is
> systematically richer than its English -- more words, real syntax where the
> source has none, punctuation the source lacks -- that is evidence about the
> ENGLISH. Assert it mechanically and report the enumeration, because a
> translator repairing a defect in passing hides it from every gate pointed at
> the translation.

Same family as the hollow-source finding one section up, inverted: there a
faithful rendering of a stub cleared a stub, here a generous rendering of a
stub hid one. **In both, the translation is the only surface anybody looked at
and the defect is upstream of it.**

Mojibake detection is blunt SQL, not clever regex: `content_md like '%â€%'`.

---

## Working style

**Complete files or fully scripted edits.** Never snippets.

**Read a file before editing it.** Never reconstruct contents from an earlier
paste, a similar file, or **a diff**. A diff is evidence about a CHANGE, not
about a STATE: a deletion sitting next to an insertion reads at a glance like an
insertion above surviving text, which is how stale banner text in
`LTI-SETUP.md` was reported as still present after the commit that removed it.
If the claim is about what a file contains now, `grep` the file. Verifying costs
seconds; editing on a misread costs a commit that records a defect which never
existed.

**`--dry` first, always**, and a dry run reporting `ok` has changed nothing —
verify separately that writes landed.

**Validate before writing**, so ABORT genuinely means nothing was written.

**Post-conditions name a property, not a count.** Wrong expected counts have
caused far more false aborts than real catches.

**And assert BOTH DIRECTIONS of the property — the sharper form of the same
rule.** Asserting only that a change landed where it should passes cleanly on a
change that ALSO landed where it should not, and over-application is a real
failure mode rather than a theoretical one. The negative half is what catches
it.

Migration 261 is the worked example: it asserts `granted 12` **and**
`ungranted 1`, then names the column that must still be ungranted
(`last_detail`) rather than trusting the totals. The positive half alone would
have passed on a grant that opened all thirteen. Whenever a property has a
negative half, name it — the columns that must stay ungranted, the rows a
backfill must not touch, the writers that must not change.

**A correction banner does not protect a reader who lands mid-section.** When a
section is preserved under a banner saying it has been superseded, **the stale
sentences themselves need inline markers.** A banner protects someone reading
top to bottom, and a document long enough to need banners is one nobody reads
top to bottom — the common case is arriving mid-section from a search, a
pointer, or a grep hit.

This has now caused two wrong assertions in a day, both from partial reads of
`HANDOFF-v8_8-addendum.md` §5: that the capability-flip columns did not exist,
and that they had been added by the wrong migration. The closure banner was four
lines above the text being read.

**Mark claims about the present. Leave observations dated to a moment.** The
test is whether a reader could act on the sentence today and be wrong:

- *"`lti_record_capability` does `observation_count + 1` unconditionally"* is a
  present-tense description of behaviour that names the exact SQL. **Marker.**
- *"`supports_deep_linking` now reads `true, 4`"* was true when written and
  reads as history. **No marker** — dating it is what it already does.

**AND A STALE CLAIM AND A CLAIM THAT WAS NEVER TRUE ARE DIFFERENT DEFECTS WITH
DIFFERENT ANSWERS.** Everything above is about DECAY — a sentence true when
written that rotted. The whole of this file's machinery is aimed at decay:
probes instead of notes, before/after instead of literals, derive instead of
copy. None of it touches the other one.

Both appeared in a single sentence on 2026-09-19, in `SCHEME-AIE-I.md`, in a
note arguing against an edit:

> *"Editing this section to say one year would silently retract a published
> two-year promise to five holders."*

**"five holders" ROTTED.** True on 2026-09-08 when it was written; a sixth
credential was issued on 2026-09-19 and nobody went back. Ordinary decay, and
the mechanisms above are the answer.

**"a published two-year promise" WAS NEVER TRUE.** `SCHEME-AIE-I.md` has never
been served by anything: no route in `certidemy-web` reads any `SCHEME-*.md`,
the public certification page passes `validityDays={null}` and renders no
validity at all, and the string "2 years" appears nowhere in that repository.
The sentence was wrong the moment it was typed.

**THE SECOND IS WORSE AND IT IS WORSE FOR A STRUCTURAL REASON: IT HAS NO
BEFORE.** A stale claim can be dated — you can point at when it turned, and a
re-read that asks "is this still true" will eventually catch it. A claim that
was false on arrival was never fresh, so nothing about it ever looks stale. It
survives every re-read, because re-reading checks currency and currency was
never the problem.

**Where it came from is the part to generalise.** `SCHEME-AIE-I.md`'s own
About section opens *"This is the certification scheme: the published contract
describing what the credential certifies."* The document asserted its own
distribution status, and the note inherited the word "published" from it
instead of asking what serves the file. Nothing does.

> **A CLAIM ABOUT WHAT A SYSTEM DOES — SERVES, PUBLISHES, SENDS, DISPLAYS,
> REFUSES — MUST NAME THE PATH THAT CARRIES IT.** If you cannot name the route,
> the endpoint, the file or the grep, you have a belief. "Published" is not a
> property a document can have by describing itself; it is a property of
> something serving it, and that something is either in the repository or it is
> not.

**AND A COMPOUND CLAIM INHERITS THE CREDIBILITY OF ITS MOST-VERIFIED PART.**
That sentence had one measured half and one assumed half welded together. The
measured half is genuinely impressive — it names a count, a date range and the
mechanism by which expiry is stamped at issue — and it made the assumed half
read as though it had been measured too. **Splitting a sentence into what was
checked and what was assumed is worth doing at the moment of writing**, because
afterwards the two are indistinguishable.

The cost was real. The note argued against the edit that turned out to be
correct, the argument rested entirely on the false half, and it came within one
measurement of deciding the question. What caught it was asking the database
what the six credentials actually say, which is the move this whole file is
about — and which nobody had applied to the sentence because it did not look
like the kind of sentence that needed it.

**A HEADING IS A CLAIM TOO, and it is the highest-traffic place a stale one can
sit.** Marking a body under a stale heading leaves the most-read part wrong: a
reader scanning headings never reaches the marker. *"The one thing that never
got done"* survived above a section whose subject had been done that night —
correct in every sentence beneath it and false at the top.

So a heading that asserts current state gets **rewritten**, not marked, and the
body underneath gets the marker. Those are different treatments because a
heading has no room for a bracket and no reader stops in the middle of one.

Preserve the original wording and append the marker; do not rewrite the text
around it, or the record stops being a record.

**And a live instruction is not a stale observation — rewrite those too.**
*"Next deep-linking launch, read that one line first"* would still be followed
by the next reader, on a task already complete. A marker beside it competes with
the instruction; replacing it removes the instruction. The test is whether the
sentence tells someone to **do** something: mark what merely describes, rewrite
what directs. And **name what actually
replaced it**: 261 added `first_observed_at`, not the `first_observed_true_at`
the gap text asked for, and a marker implying otherwise would send someone
looking for a column that does not exist.

This mostly codifies existing practice — the iframe paragraph, §6 item 1 and
`LTI-SETUP.md` step 7 all carry inline markers already. §5's flip body was the
one place with a banner and nothing inline, which is exactly where the two wrong
assertions came from.

**THE ANTI-GLOSS RULE CANNOT BE SATISFIED IN SIX WORDS, AND THAT RETIRES THE
HOUSE STYLE THAT ASKED FOR SIX.** Ruled 2026-09-21.

A one-line description of a DEFINED TERM must say something the definition does
not -- the consequence, the distinction, or what a practitioner does with it. A
description that could serve as a glossary gloss has failed **even at a gate
score of 0**, because at this length no n-gram instrument can see the category.

**The reason it retires the terse style is arithmetic, not taste: you cannot
state what a definition omits in less space than the definition.** ISMS-F's
one-liners run 28 to 131 characters; the AIMS-F descriptions written under this
rule run 160 to 258, and the extra space is where the omission gets stated.

**So ISMS-F's terse descriptions are now the SUSPECT ones**, which inverts how
they were read for months -- they were held up as the house style to copy.
`scripts/list-defined-term-glosses.mjs` finds **14 of the 23 tier-A candidates
in ISMS-F alone**: `residual-risk`, `risk-identification`, `risk-analysis`,
`risk-evaluation`, `risk-criteria`, `risk-owner`, `threat`, `vulnerability`,
`nonconformity`, `access-control`, `audit-criteria`, `top-management`,
`continual-improvement`, `statement-of-applicability`. Every one is short, and
the shortness is the mechanism.

**[WITHDRAWN AS A TEXT MEASURE 2026-09-22.** The tier-A count reads concept
NAMES against a list of ISO defined terms; it never looks at the description.
It therefore CANNOT FALL when a description is rewritten -- measured directly:
ISMS-F rewrote five tier-A rows in batch 1 and the count stayed at 17.

It is a CANDIDATE LIST derived from the blueprint, useful as that and only
that. Every use of it as evidence about description quality is struck,
including the overlap figure computed against the leak fires as though both
instruments read the same input. **They do not: one reads names, the other
reads text.**

The scope ruling it partly rested on SURVIVES on its other two legs, which are
real text measures -- median 59 characters, and 192 of 192 one sentence or
fewer. 152 rewrite / 18 keep / 0 trim stands.**]**

**A gate score of 0 on a corpus of one-liners is not evidence of anything**, and
`gate-concept-descriptions.mjs` prints that sentence in its own output rather
than letting a clean run be mistaken for a clean batch.

**A PATTERN DEFECT IS THE SAME CLASS AS A DROPPED READ, and the vocabulary
pattern has been wrong THREE ways in eight days** — a single-language
undercount, a boundary bug (`\b` does not stop `equipo de desarrollo`
matching inside `sub-equipo de desarrollo`; a hyphen IS a word boundary), and
per-language patterns blind to an untranslated English term sitting in a
Spanish row. Each was found by a different route and **none by the check
itself**; one produced a false all-clear that re-reading the rows could not
catch, because the re-read used the pattern that had the blind spot.

**So: measure a second, independent way.** `READ-FAILURE-AUDIT.md` §7b carries
**six rules, each with the instance that bought it**, and the cross-language
census query. Two of the six are about the REPAIR rather than the detector: a
vocabulary swap that changes number leaves a verb behind, and no vocabulary
pattern can see grammar — which is how two SECURE banks passed the check that
had just demanded the fix that broke them. The two measurements are
wrong in OPPOSITE directions, which is what makes their agreement meaningful.

**AN INSTRUMENT'S ERROR MODES CAN BE A FUNCTION OF ITS INPUT SIZE, SO WIDENING
AN INDEX IS A RE-CALIBRATION AND NOT A CONFIGURATION CHANGE.** This is the
general form of the entry below, and it is the sharpest thing the corpus
expansion produced.

Nothing about the scanner changed when the ISO corpus went from three standards
to nine. Its threshold, its seed, its segmenter and its controls were all
untouched, and its FALSE-POSITIVE RATE went from invisible to fifty percent --
12 artifacts in 24 refusals, one reporting 14 words where the longest real
fragment was 9. The defect was not introduced by the widening; it was made
frequent enough to see.

**A rate measured at one input size does not transfer to another**, and the
calibration that justified a threshold is void the moment the corpus behind it
changes. Treat adding a source the way you would treat changing the threshold:
re-measure, re-read the fires, and expect the error modes to move.

**A COMBINED INDEX MANUFACTURES A RUN THAT EXISTS IN NO DOCUMENT.** Found
2026-09-21, the first time the ISO corpus went from three standards to nine.

`scan-iso-leaks` extended a matched run greedily against the UNION of every
source's n-grams. A run can therefore chain out of one document and into another
across a junction present in neither, and the reported length becomes a property
of the INDEX rather than of any standard.

Measured on the lesson corpus the moment the corpus widened: of eight groups the
union-based measure refused, **four held no contiguous match in any single
standard**.

```
reported 14w   longest real fragment  9w  (27001 and 42001, both under the threshold)
reported 10w   longest real fragment  7w  (42001)
reported 10w   longest real fragment  7w  (42001)
reported 10w   longest real fragment  9w  (19011)
```

**TWELVE OF TWENTY-FOUR REFUSALS WERE ARTIFACTS** -- four lesson groups in three
languages would have been withheld from the MCP surface for reproducing nothing.

**The defect was always there and the corpus size is what exposed it.** Three
standards rarely chain; nine management-system standards sharing harmonised
boilerplate chain constantly. So this is not a bug the widening introduced --
it is a bug the widening made frequent enough to see, which is the more
dangerous kind, because the narrow index had been quietly producing a small
number of the same artifacts all along.

> **MECHANISM: a reproduction is a reproduction OF A DOCUMENT, so measure per
> source and take the maximum afterwards.** Never score against a union. Report
> WHICH source carries the run, because a run with no source is the tell.

Same family as the join fan-out and the separator-free concatenation already
recorded here: **the query manufactured an adjacency the data does not have.**
It is also the same shape as the segmenter's own fixture case -- text either
side of a cut must never land in one segment -- applied one level up, to
documents rather than to lines.

**COVERAGE IS THE INSTRUMENT; THE RUN FLOOR IS ONLY A NOISE FILTER.** Ruled
2026-09-21, and the instance is disqualifying for the floor that allowed it.

The concept gate refused at `run >= 6 AND coverage >= 0.60`. ISMS-F
`risk-identification` reads *"finding, recognizing and describing risks"* --
**five words, all five present verbatim in an indexed standard, coverage
1.00.** The entire description is a reproduction and the gate said nothing,
because 5 is one short of 6.

**A threshold that lets a COMPLETE reproduction pass because the thing
reproduced is short is the scale defect the instrument was built to escape,
reintroduced one level down.** Floor moved to 4. Coverage carries the
judgement -- a run that is most of the text IS the text -- and the floor exists
only to stop a four-word commonplace in a six-word description reading as a
finding.

Measured: 9 fires at floor 6, **16 at floor 4**, and the seven the old floor hid
include the two completest reproductions in the corpus. **13 of the 16 are
ISMS-F.**

**AND A FILTER CHOSEN TO MATCH THE EXPECTED SHAPE OF A DEFECT FINDS ONLY
DEFECTS OF THAT SHAPE.** `list-defined-term-glosses` filtered to descriptions
of ten words or fewer, on the reasoning that a gloss is short. ISMS-F
`availability` -- *"information is accessible and usable on demand by an
authorized entity"* -- is ELEVEN words, is ISO/IEC 27000's definition
near-verbatim, and scored 9w/11 coverage 0.82 the moment 27000 was indexed.
**The cutoff hid it, and the cutoff was a guess.** Removed; the corpus
considered went 688 -> 1,729 and tier A went 23 -> 52. The TIERS do the
narrowing now, which puts the generosity in a number instead of in a silent
exclusion.

**AND A LESSON CAN CITE THE WRONG STANDARD FOR A SENTENCE IT REPRODUCES
CORRECTLY.** Found in the same pass, by attributing each run to its source
rather than only measuring it. Three lessons carry ISO/IEC 27000's note on
`audit` verbatim; **two of them credit it to ISO 19011:2026, which does not
contain either half of the sentence.** One of the two sits inside a checkpoint
EXPLANATION, so the misattribution is taught as an answer.

> **This is the defect class no gate in this repository can reach** -- a true
> statement filed against the wrong source, in prose that reads correct. It
> surfaced only because the scanner now PRINTS THE ATTRIBUTED SOURCE with every
> fire. A run with no source is the tell for a manufactured adjacency; a run
> whose source disagrees with the prose around it is the tell for this.

**POSSESSION IS NOT VERIFICATION, AND A CHECK THAT PASSES IS A CLAIM ABOUT THE
QUESTION IT ASKED.** Paid for 2026-09-21, and it is the sharpest instance in
this file of a green check meaning nothing.

`citation-index.mjs` verifies that a cited clause ADDRESS EXISTS. Its own header
says so -- *"it checks EXISTENCE, NEVER MEANING"* -- and that was accepted for
months as a known limit. Meanwhile three lessons reproduced a 17-word sentence
from ISO/IEC 27000:2018 and TWO credited it to ISO 19011:2026, which contains
neither half of it. All three standards were on disk. The checker was green.
Every address named was real.

> **MECHANISM: a citation check verifies ADDRESS EXISTENCE and CONTENT
> CORRESPONDENCE, and reports them as TWO SEPARATE RESULTS**, because passing
> one while failing the other is the normal case. Collapsing them into one
> verdict rebuilds the defect.

**A MISATTRIBUTION IS PROVED BY COMPARISON, NOT BY ABSENCE.** A fair paraphrase
shares no contiguous wording with the clause it describes, so "not found in the
cited standard" is weak on its own -- 1,117 of 1,483 citations score that way
and almost all are correct. What is strong is scoring the passage against EVERY
indexed standard and asking which carries it best: a passage appearing verbatim
in a standard OTHER than the one cited is a misattribution with the right answer
attached. Same move as "a run with no source is the tell", turned around.

**MEASURED over 479 lessons and 9,246 live English items: 1,483 explicit
citations, 77 misattributions, 5.4 percent of what is checkable.** And the rate
needs two subtractions before anyone acts on it:

| confound | count | why it is weak evidence |
|---|---|---|
| harmonised siblings | 37 | 42001, 27001, 27000 and 27002 share clause text BY DESIGN, so "best source is the other one" fires constantly between them |
| item distractors | -- | a wrong option is SUPPOSED to be wrong; scanning all options flagged deliberate falsehoods as defects until only the stem, the CORRECT option and the explanation were scanned |

That leaves **40 cross-family candidates**, of which the strongest are
unambiguous: 19011 credited for 27000's audit note (17w), for 27001 clause 9.2.2
(15w), and 27001 credited for 19011's definition of audit finding (11w).

**AND THE SAME AUDIT CLEARED THE 154.** Eighty-one checkable claims in the
AIMS-F concept descriptions: **0 failures**, 67 verified, 14 unverifiable
because the standard is not held. Every claim the audit first reported as broken
was the audit's own parser -- see below.

**THE AUDIT SCRIPT WAS WRONG TWICE BEFORE THE CONTENT WAS WRONG ONCE.** First it
read the TABLE OF CONTENTS instead of the body, because a heading regex matches
the contents entry first, and produced twenty false failures against correct
descriptions. Then the FIX was applied through a shell heredoc, which COLLAPSED
EVERY DOUBLE BACKSLASH -- a tab class arrived as a literal tab, a non-space
class as a bare S -- and every address reported NOT FOUND, 28 failures, none
about content.

> **A TRANSPORT CAN CORRUPT A CHECK.** That is the mojibake and truncated-paste
> family already in this file, pointed at CODE instead of at SQL. Parsers here
> now use NO REGEX ESCAPES AT ALL -- line scanning with trimStart() and
> startsWith() cannot be mangled in transit -- and every extractor carries a
> SELF-TEST that finds something known to be present before any verdict is
> reported. An over-firing extractor turns correct content into a failure report
> and sends someone to fix twenty accurate rows.

**AND FIXING THE PROSE IS NOT FIXING THE LESSON.** Each of the three lessons
carried the sentence TWICE -- once in prose and once inside a CHECKPOINT
EXPLANATION, where a misattribution is taught as the answer. The first pass
rewrote the prose and read as finished; the leak scan immediately reported two
lessons still over the threshold. The explanation copies word it differently
("may be conducted"), so an anchor asserted on the prose wording found exactly
one occurrence and was right to. **Two anchors, never a looser one.**

**AN EXPRESSION-MATCHING INSTRUMENT FINDS REPRODUCTION, NEVER ATTRIBUTION.**
Recorded 2026-09-21, and it is the correction to the rule recorded beside it
the same day.

"Cited the wrong standard" and "cited the right standard, reproduced another
standard's wording" produce an IDENTICAL signal from a contiguity scan. 77
misattributions were read off one, and the first escalated was a WORDING defect
with a defensible citation: ISO 19011:2026 was called a false attribution
because it contains neither half of the reproduced string, while its clause 3.1
Note 1 carries the same substance in its own words.

> **MECHANISM: every misattribution finding carries a SECOND test answered by a
> DIFFERENT instrument -- does the cited source carry the substance at any
> address, in any wording -- and the two results are reported separately.**
> Contiguity asks who wrote the words; distinctive-term coverage over the whole
> cited document asks whether it says the thing at all.

**Measured over 43 cross-family candidates:** 23 are WORDING defects with a
sound citation, 13 are real, and **7 are undecidable because the claim is
NEGATIVE about the cited standard** -- "an AI impact assessment that ISO/IEC
27001 does not mandate" is correct, and low coverage is exactly what a true
negative claim and a false attribution both look like. Three classes, not two.

**AND THE ADDRESS MUST BIND TO THE RIGHT STANDARD.** Both entries in the
real-defect bucket were the extractor binding a clause number to the NEAREST
preceding standard token across an intervening different one: a heading reading
*"what ISO 19011 suggests and what ISO/IEC 42001 requires"* gave 42001 the
following sentence's `clause 5.5.7`, which 42001 does not have and 19011 does.
**The bucket was 2 and is 0.** An address may not be claimed by a standard when
another standard token sits between them.

**A CHECK THAT ASKS NOTHING PASSES.** The sharpest instance in this file, and
it was found only because someone asked whether a figure was measured before or
after a parser fix.

ISO/IEC 27001:2022 extracts as `4.1Understanding the organization` -- **no space
after the number** -- behind a licence-watermark column. `clauseText` required a
space, so it returned NULL for every clause of that document, and the check
consuming it scored **OK against an empty string**: *"27001 clause 4.1 does not
mention roles"* passed because nothing was examined.

> **MECHANISM: an extractor returning empty for an input known to be present is
> a FAILURE, not a pass.** Every content check asserts its extraction is
> non-empty BEFORE evaluating it, and reports EMPTY EXTRACTION as its own result
> class, counted beside OK and FAIL. The audit now prints the extraction length
> next to the verdict, so a vacuous pass cannot look like a real one.

**Three further extractor defects surfaced in the same pass, all of them
turning correct content into a failure report:** reading the table of contents
instead of the body (20 false failures), a shell heredoc collapsing every double
backslash so a tab class arrived as a literal tab (28 more), and a stop
condition that read `split(" ")[0]` as the heading number and therefore never
stopped in 27001, sweeping clause 5 into clause 4.1.

**The count moved 147 -> 179 -> 130 -> 129 across those fixes, and only the last
is a fact about the content.** A defect list is not a defect list until the
instrument that produced it has been made to fail on something known.

**THE TRANSLATION PASS IS A DETECTOR FOR ENGLISH DEFECTS, AND NOTHING WAS
READING IT THAT WAY.** Found 2026-09-21, in the AIMS-F paired review.

`soa-annex-a-relationship` read **"SoA annex a relationship"** in English --
raw slug text with a lowercase annex letter. Both translations render it
correctly and in full: *"Relacion entre la Declaracion de Aplicabilidad y el
Anexo A"*. Checked across the certification, **ELEVEN AIMS-F names carry the
same defect and ALL ELEVEN are correct in both languages** -- `Anexo A`, `IA`,
`Declaracion de Aplicabilidad`.

A translator working from a defective English name silently repaired it eleven
times, and no instrument recorded the disagreement. **A translation that
departs from its source is either a translation defect or a SOURCE defect, and
only a human comparing the two has ever decided which.**

> **MECHANISM: where a translated name is structurally richer than its English
> -- expands an initialism, capitalises a proper noun, spells out a term the
> English left raw -- that is a candidate ENGLISH defect and belongs in the
> review as one.** The paired sampler already puts both renderings beside the
> source; what was missing was reading the disagreement in that direction.

**[MEASURED 2026-09-22 AND BOTH HALVES OF THE GUARD CLAIM ARE FALSE.** The
narrow form as described here -- `name = replace(slug, '-', ' ')`, byte-equal
to the RAW lowercase slug -- fires on **0 rows in the entire corpus**, because
every slug-derived name is sentence-cased. The form that actually yields 192
is `name = slug-with-spaces with the first letter capitalised`, and it fires on
**521 rows across ten certifications**, not on ISMS-F alone:

```
ISMS-F   192 of 192  100%      SM-AI-I    27 of 107   25%
AIHR-I    96 of 114   84%      SD-AI-I     5 of 135    4%
AIMS-F   114 of 154   74%      AISM-I      4 of 226    2%
SM-AI-II  76 of 131   58%      ISMS-IA     0 of 169    0%
```

**The distinctive fact about ISMS-F is a RATE, not a count: it is the only
certification at 100 percent**, and ISMS-IA and AIMS-IA are at 0. The property
itself is the house convention on 30 percent of the corpus, so a guard on it is
the BROAD form wearing a narrow number -- exactly what this section warns
against. The 192 was never evidence that ISMS-F was alone; nobody had measured
the other eleven.

Same defect as the AIMS-F/ISMS-F control pair: a figure read off one
certification and asserted of the population.**]**

**AND 358's GUARD DID NOT MISS THIS -- IT WAS DEFERRED.** The guard tests
`name = replace(slug, '-', ' ')`, byte-equal to the RAW slug, and "SoA" is not
"soa". 358's own header says why:

> *"The lowercase `ai` (9 ISMS-F + 5 AIMS-F) and `annex a` (2 + 2) initialism
> pass is deliberately NOT here. It is a separate step on a separate rule."*

The guard was correctly scoped and the follow-up step was never picked up.
**A deferral recorded in a migration header is invisible to everyone who was
not reading that migration.** Measured now across all twelve: 10 lowercase
standalone `ai`, 8 lowercase annex letters, 1 miscased `Soa` -- AIMS-F's 11
fixed, ISMS-F's 7 left to the 192-row pass.

**[RE-MEASURED 2026-09-22: ISMS-F's share is 21 ROWS, NOT 7.** The earlier
figure counted lowercase `ai` and lowercase annex letters only. Scanning for
every initialism that is not fully uppercase -- `Iso`, `Isms`, `Cia`, `Pdca`,
`Soa`, `Saas`, `Ai` -- returns 21 rows, one of which (`Saas ai in scope`)
carries two defects, so 22 corrections. **A census of one spelling told the
truth about that spelling and nothing about the class** -- the same shape as
counting `clausula` without counting `apartado`.**]**

**AND THE CAP CAME BACK, IN THE SCRIPT CHECKING WHETHER A SWEEP WAS SAFE.**
The `Secao` ruling needed to know which rows were already cleared. The script
fetched `concept_translations?...&limit=4000` and got **1,000 rows and HTTP
200**, then reported **"0 cleared rows held"** -- on the exact question of
whether the sweep would edit reviewed content. Three ISMS-IA rows, cleared and
serving, sat in the 730 that were dropped.

Same defect this file opens with, in a new place: **the question was not "did
the read succeed" but "could the read have seen the rows that would have
changed the answer".** A paging helper with a count assertion already exists in
four scripts here and was simply not used.

**A GUARD THAT CONTRADICTS ITSELF ACROSS LANGUAGES IS THE MOST RELIABLE
DETECTOR IN THIS REPOSITORY.** Four defects on 2026-09-17, every one found by
the guard disagreeing with itself rather than by anyone reviewing it:

1. **The English list was missing `requirement`** while carrying `obligation`.
   Found because ONE repair, in THREE languages, scored strong 1->1 in Spanish
   (`exigencia`) and Portuguese (`exigencia`) and 1->0 in English.
2. **The Spanish list was missing `requisito`** while carrying `exigencia` --
   the same gap, mirrored, found when a faithful translation was refused.
3. **`necesario` matched a bare adjective.** "Cuando sean necesarios controles"
   is descriptive, and English `necessary` is on no list -- one word, two
   verdicts.
4. **`convem` was in the inflation check's vocabulary and not in the weak list
   the profile reads**, so the correct ABNT rendering scored as no modal at all.

**The mechanism is that the same property, measured three ways, must agree.**
Each language is an independent implementation of one judgement, so a
disagreement is a defect in an implementation -- and unlike a green result, a
disagreement cannot be produced by a check that is silently not running.

**So when a check exists per language, per surface or per repository, RUN ALL OF
THEM AND COMPARE, and treat a difference as the finding.** It is the same move
as READ-FAILURE-AUDIT section 7b's "measure a second, independent way", and the
same move that caught the cross-repo wire vocabulary -- but cheaper, because the
second measurement already exists and nobody is looking at it side by side.

**And the disagreement names WHICH side is wrong more often than not.** Three of
the four above were vocabulary gaps in the guard, not defects in the content:
the content was right in all three languages and one list had not heard of a
word. A single-language run would have reported a content defect and someone
would have "fixed" correct text.

**Derive, never duplicate, when two lists mean one thing.** Defect 4 existed only
because a second vocabulary was written beside the first; it is now computed from
it. Two hand-written lists of the same idea will diverge, and the divergence
shows up as a refusal of correct work.

**Guards match code shapes, never English words** — a check for `to anon` once
aborted on a comment saying "no grant to anon or authenticated."

**AND THE PROSE A GUARD CHECKS CAN QUOTE THE THING IT FORBIDS.** The rule above
is about a guard reading a *comment*. The sharper case is a guard reading the
*content*, where the retired phrasing appears on purpose because a correction
has to say what it corrected.

Migration 290 aborted on exactly this. Its guard searched the whole stored
`grounding_note` for `STILL BLOCKING`, and the new note quotes it — *"This note
read STILL BLOCKING until today, on the ground that..."* — which is the sentence
that makes the record readable. **The note was right and the guard was wrong**,
and deleting the quotation to satisfy the check would have been the check
editing the content.

**The property is almost never lexical. It is positional or structural.** A
stale record asserts the retired claim in its opening sentence and at its own
label; a corrected one carries the phrase downstream of the clearance marker,
inside the clause that explains it. So anchor on *where*: nothing retired before
the marker, the opening sentence states the current state, and a phrase that is
deliberately quoted must sit at the quotation and occur exactly once.

**Five instances in one day, 2026-09-10.** Three were in the scripts that
produced 290: a post-condition matching `bloomForCert` inside the comment saying
`bloomForCert` had been deleted; one asserting a COUNT of surviving filename
mentions rather than naming the property; one encoding `\n` against a CRLF file
(`verify-cert.mjs` is CRLF, every sibling is LF). The fourth was 290's guard 1,
above. **The fifth was 290's guard 3, inside the fix for the fourth** — a
certification-wide sweep for the retired phrase, which then matched the note it
had just corrected, because that note quotes the phrase. Scoped to the other
twelve certifications; this one is checked positionally.

**All five aborted before writing, which is what they are for — but all five
were the guard's fault, and a guard that cries wolf gets loosened next time.**
The tell is uniform: every one of them searched for a STRING when the property
was a PLACE.

**A GREEN RESULT CARRIES NO INFORMATION UNLESS SOMETHING PROVES THE CHECK RAN.**
A check that CANNOT fire is indistinguishable from one that fired and found
nothing. Three instances on 2026-09-15: eslint had not run on certidemy-web for
as long as eslint has been on 9.x, because the repo had only .eslintrc.json and
9.x reads flat config -- every invocation exited with a migration notice; the
proconfig predicate in 323 matched no correctly pinned function anywhere in the
database and never had; and check-mcp fragment extractor split literals on
embedded quotes and compared against text that appears nowhere.

The eslint one cost something concrete. A missing `+` in a string concatenation
let AUTOMATIC SEMICOLON INSERTION close the assignment early and turn the
remaining 635 characters into a dead expression statement -- legal JavaScript
that means something other than what it looks like. tsc passed it, the build
passed it, no test failed, and `no-unused-expressions` IS the rule for it, behind
a config the linter would not open. A tool description shipped truncated
mid-phrase and the discarded tail was the only sentence saying the tool needs a
key.

**So give every instrument a positive control**, the way a smoke test is owed one
for an empty result set: something that must FAIL when the check is broken.
smoke-paywall refuses to report a pass without proving an authorised caller gets
a body; the fragment check asserts it would catch a known-missing sentence. **An
instrument that has never failed is not evidence that nothing is wrong. It is an
untested instrument.**

**A COVERAGE GAP IN A CHECK READS AS A PASS, NOT AS A GAP.** This is the
sharpest form of the green-result rule and it is worth separating: an
instrument that cannot fire reports nothing, but an instrument that fires on
HALF ITS SUBJECT reports success.

Measured 2026-09-19. `check-prompt-parity` stage D asserts that the rubric a
partner receives is byte-identical to the rubric the generators use. It
exercised **ISMS-F, which is tier 1**. A tier-2-only change to the shared rules
went undeployed, and:

```
stage C (tests AIMS-IA, tier 2)   FAIL   21807 vs 21979 chars
stage D (tests ISMS-F,  tier 1)   PASS   against the same stale deployment
```

**Both were correct.** D compared a part of the prompt that had not changed, and
said so honestly. Nothing in its output suggested it had only looked at one
tier, because a check does not report the variants it did not try.

So: **when the thing under test branches, the check must exercise every branch,
and the branch list is the part to write down.** These rules branch on tier in a
dozen places; D now runs ISMS-F and SM-AI-II, and the tier-2 certification
reported the same 172-character delta immediately. The gap was closed by the
defect it missed rather than by a synthetic case, which is the only evidence
worth having that it is closed.

**A GATE IS BLIND TO WHAT IS NOT INDEXED, AND THAT BLINDNESS IS INVISIBLE IN
ITS OUTPUT.** The sharpest form of the coverage rule above, because here the
gap is not in the CHECK, it is in the CORPUS the check is measured against.

`scan-iso-leaks` holds three PDFs. **ISO/IEC 27001:2022 clause 3 defines
nothing** -- *"the terms and definitions given in ISO/IEC 27000 apply"* -- and
**ISO/IEC 42001:2023 clause 3 delegates to ISO/IEC 22989** before adding its
own. Neither 27000 nor 22989 is on disk. So every ISMS defined term and every
AI defined term is unreachable at any threshold and any seed.

**The evidence that the parameter was not the variable is that it did not
move.** A calibration over 48 candidate rules scored named defined-term
definitions at a FLAT 33 percent -- the same two of six at every seed and every
threshold. A constant across a whole parameter space is the tell that the
parameter is the wrong knob.

**AND AN EDITION VARIANT OF A SOURCE WE DO HOLD FAILS THE SAME WAY.** ISMS-F's
`security-control` read *"a measure that modifies risk"* -- live,
unauthenticated, five words. ISO/IEC 42001:2023 clause 3.21 IS indexed and DOES
define the term:

```
control   <risk> measure that MAINTAINS AND/OR modifies risk
```

Three inserted words, and no n-gram matches. **The scanner reported 0 against a
document it had indexed.** So the blindness is not only "sources we do not
hold"; it is also "the edition we do not hold of a source we do".

> **A corpus score of 0 means "no reproduction of the indexed documents",
> never "no reproduction".**
>
> **MECHANISM: the scanner NAMES ITS INDEX in every report, and every standard
> that an indexed standard DELEGATES to is listed as a coverage gap until it is
> indexed.** `measure-concept-leak-sensitivity.mjs` splits its own positive
> control on exactly that line -- indexed definitions must fire at 100 percent
> or the instrument is blind, delegated ones print as a named gap. Mixed, the
> control could never pass, and a control that can never pass is one the next
> reader loosens.

**AND AN INDEXED STANDARD IS NOT A COVERED STANDARD.** Recorded 2026-09-21,
and it is stronger than the finding it corrects.

The first report of this said the miss was caused by ISO/IEC 27000 being
absent. Half true. **ISO/IEC 42001:2023 clause 3.21 IS on disk and DOES define
the term** -- read off the PDF:

```
control   <risk> measure that MAINTAINS AND/OR modifies risk
```

`security-control` copied the earlier ISO/IEC 27000 wording, *"a measure that
modifies risk"*. **Three words apart, no n-gram match, and the scanner reported
0 against a document it had indexed.** ~~Holding every standard would not have
caught it, because the gloss was near-wording of an edition we do not hold of a
term we do.~~

> **[FALSIFIED 2026-09-21, THE NEXT DAY, BY MEASUREMENT.]** ISO/IEC 27000:2018
> was purchased and indexed, and `security-control` immediately scored **4w/5,
> coverage 0.80, against 27000:2018**. Holding the right standard caught it.
> The strikethrough sentence was an INFERENCE I could not test, welded to a
> measured half -- the scanner really did report 0 -- and CLAUDE.md's own rule
> about compound claims says the measured half makes the assumed half read as
> measured. It did.
>
> **The rule above it survives and is narrower: an indexed standard is not a
> covered standard, so the remedy is to index THE EDITION THAT WAS COPIED.**
> That is a purchasing decision, not a threshold decision, and it is tractable.
> What is not tractable by any index is the monolingual gap.

> **MECHANISM: for a DEFINED TERM, no n-gram instrument is the defence -- the
> anti-gloss rule is.** The scanner's report NAMES WHICH EDITIONS IT INDEXED and
> states that near-wording from other editions is out of its reach.
> `scripts/list-defined-term-glosses.mjs` therefore matches on the TERM NAME,
> which is stable across editions, never on definition text, which is exactly
> what was shown here not to be.

**AND THE GATE IS MONOLINGUAL, WHICH IS THE LARGEST GAP OF THE THREE.** It
indexes English editions only. `security-control`'s own translations read *"una
medida que modifica el riesgo"* and *"uma medida que modifica o risco"* -- the
same definition in Spanish and Portuguese, invisible to every leak instrument in
this repository and always have been. **That is 3,460 translated concept rows
outside any leak gate at all**, plus every translated lesson body: the lesson
scanner's own header records that an es-419 or pt-BR row scores zero by
construction, and takes its verdict from the English sibling instead. Concepts
have no such sibling rule.

So the coverage-gap list a report must print has three entries, not one:

| gap | why it is unreachable |
|---|---|
| ISO/IEC 27000 | 27001:2022 cl.3 delegates its whole vocabulary to it; **undated reference**, so the latest edition applies and the gap tracks forward on its own |
| ISO/IEC 22989 | 42001:2023 cl.3 delegates to it before adding its own terms |
| **every non-English edition** | the index is English-only, so a translated defined term scores 0 |

**The undated reference is worth its own line.** 27001:2022 clause 2 reads
`ISO/IEC 27000, Information technology -- Security techniques -- Information
security management systems -- Overview and vocabulary` with **no year**, under
boilerplate saying *"For undated references, the latest edition of the
referenced document (including any amendments) applies."* So there is nothing
newer to chase today -- and the gap can WIDEN with no change to anything in this
repository, because a future edition of 27000 becomes applicable automatically.

**And where the gate cannot see the category, the RULE has to do the work
instead.** A one-line description of a defined term must say something the
definition does not -- the consequence, the distinction, or what a practitioner
does with it. A glossary gloss has failed at a score of 0.
`scripts/list-defined-term-glosses.mjs` matches on the TERM NAME, which is
stable across editions, rather than on definition text, which is exactly what
was shown above not to be.

**AND THE CHECK SHAPE THAT FOUND THE DEFECT UNDERNEATH IT IS NEW HERE: COMPARE A
SHARED BLOCK AGAINST ITSELF, AT TWO VARIANTS.**

Every other comparison in this repository asks whether **two implementations
agree** -- two repositories' vocabularies, Node against Deno, the deployed
function against the generators, a guard against the same guard in another
language. This one asks whether **one implementation says the same thing to two
audiences it should not**.

`CUE_NEUTRALITY_RULES` ended *"This is an entry (\"I\") tier exam: test knowledge
plainly, do not set traps"* and shipped identically to every tier-2
certification, a few hundred words below *"never acceptable at this tier"*. The
clause before it -- *"not subtly-worse-but-defensible"* -- is the exact inversion
of `L2_CONTRACT`, which requires the second-best option to be a defensible call
rather than a mistake. **The prompt instructed a tier-2 generator to do the one
thing the tier-2 contract forbids, in the same document as the contract.**

**The tier ternaries everywhere else are what made it invisible.** `draftSystem`
branches on tier in a dozen places and each branch is correct, so reading the
file gives every impression that tier is handled. One unconditional string in a
sibling module is not visible from there, and no test compared the two outputs.

It was found by a human reading a tier-2 payload after a tier-1 one.
`check-prompt-parity` stage E now assembles both tiers per certification and
fails on any sentence that asserts a tier and appears in both. **Generalise it:
wherever a prompt, a policy or a message is assembled for several audiences from
one source, diff the assembled outputs -- not the source.** The source shows the
branches that exist; only the outputs show the text that did not branch.

**AND RANK YOUR CLAIMS: TEST THE ONE THAT OUTRANKS THE OTHERS.** An MCP
`SERVER_INSTRUCTIONS` string is read before any tool description and believed
over it. Six correct, versioned, asserted tool descriptions lost to one stale
sentence there, and an agent declined to call a working server because the server
told it not to bother. It was the only string with authority over the others and
the only one with no version, no test, and no place in any checklist.

**RUN THE CHECK AS THE PARTY THE PROPERTY IS ABOUT.** Exercising behaviour is
not enough on its own -- `smoke-courseware` fetched a real lesson, parsed it,
and passed 37 of 37 while the paywall did not exist, because it called the
function the same way an attacker would AND THE FUNCTION HOLDS BOTH CREDENTIALS.
It could not distinguish "the paywall works" from "there is no paywall": both
return a body when the caller is the system itself.

A paywall is a claim about strangers, so only a stranger can test it. A grant is
a claim about a role, so the role must attempt it (322 does this). **The
credential the test holds IS the hypothesis**, and a suite running with the
system own credentials measures what the system can do, never what a stranger
can. `scripts/smoke-paywall.mjs` is the worked example, and its two controls are
the other half: a refusal proves nothing unless something PROVES THE ENDPOINT
STILL SERVES, because a broken deployment refuses everything.

**AND THE SAME THING IS TRUE OF CODE: A BRANCH THAT HAS NEVER EXECUTED BECAUSE
A PRECONDITION IS UNMET READS EXACTLY LIKE ONE THAT WORKS.** The rule above is
about an instrument that cannot fire. This is about a code path that cannot
RUN, and it is worse, because the thing holding it shut is usually data rather
than code -- so it opens when someone inserts a row, not when someone edits a
file, and nobody reviews an insert.

`analyze-curriculum`'s partner branch, found 2026-09-15, deployed since v7.4:

```
if (!body.company_id) return 403;
const granted = await rpc("company_has_feature", {p_company_id: body.company_id, ...});
if (granted !== true) return 403;
ownerCompanyId = body.company_id;                 // <- now the run's owner
```

`company_has_feature(company_id, feature_key)` is a pure lookup over
`company_features`. **It says nothing about who is asking.** So the check proved
that SOME company holds the grant and then attributed the analysis to whatever
company id arrived in the request body -- the exact shape `requireIssuerAccess`
exists to prevent on the issuing path, one table over. A grant, a membership and
a role are three different facts and only the first was checked.

**It had never been exploited and could not have been.** `public.company_features`
has been EMPTY platform-wide since it was created -- zero rows, zero distinct
feature keys -- so `company_has_feature` answered false for every argument and
every partner call 403-ed before reaching anything. **An empty table was the
entire access control.** The branch survived review because nothing could reach
it, and the review that would have caught it is the one nobody performs on
`insert into company_features`.

**"Leave the table empty" is not the fix, because the first row ever written to
it is also the moment the feature is sold to its first partner.** The gap and
the launch are the same event. That is the property that makes this worth its
own entry: the safety was not a decision, it was a side effect of having no
customers yet.

**So the test had to create the state that had never existed.**
`scripts/smoke-analyzer-access.mjs` builds three identities that exist nowhere on
this platform -- a team_admin of a granted company, a plain team_member of THAT
SAME company, and a team_admin of a different one -- and its GRANTED control
reads `company_has_feature` back before asserting anything, because otherwise
every refusal it records is equally consistent with the fixture never having
landed, which is the state the function spent its whole life in.

**Run it against the old code first. It is the only proof the test can fire.**
Done before the fix was deployed: the plain team_member received a full report,
and the team_admin of the other company passed the granted company's id and
received one too. Six failures, and the two that mattered were the leak
executing rather than a description of it.

**A POST-CONDITION MUST BE ABLE TO TELL ITS FAILURE MODES APART.** If it cannot,
it reports the most alarming one it can describe. Migration 323 raised "a live
key resolved to the wrong id" -- a cross-partner authorization leak -- when it
had measured a closed door: `EXECUTE ... INTO` leaves targets NULL on an empty
result, and `is distinct from` is true for a wrong uuid and for no uuid. Count
first, compare second, and give each failure its own exception. The same file
then raised one message naming three properties for a compound condition, and
the half that had moved was none of them.

**The recurring failure mode of this system is silent success.** It is caught
only by asserting a specific expected value, never by the absence of an error.

**Never propose a destructive statement as a way to verify a hypothesis about
privileges.** If the check and the damage are the same action, the check IS the
damage. Migration 246 shipped `drop trigger if exists on_auth_user_created on
auth.users;` as a commented "expect 42501" verification step; it succeeded
instead of failing, and signup was silently dead until the trigger was
recreated. Verify against `pg_catalog`, or leave it unverified and say so.

**`git status --short` before every commit.** Build and commit are separate
steps.
