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

The four Open Badges 3.0 identifier URLs live on `credentials.certidemy.com`
(a separate Cloudflare Worker repo, `calicoj-dev/certidemy-credentials`):

```
/issuer
/achievements/[code]
/credentials/[code]
/status/[N]
```

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
