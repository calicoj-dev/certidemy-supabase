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

**Migration tip: 335. Next free number: 336. 332-335 have all RUN (2026-09-17).**
332 added `lessons.mcp_servable` and the trigger that clears it on any
`content_md` change; 333 put the predicate in `mcp.lesson`; 334 widened the MCP
views to TEN certifications, adding ISMS-F and AIMS-F; 335 made the gate
per-language with `lesson_translation_reviews` on 311's en_hash pattern.

**334 IS THE FIRST WIDENING SINCE THE 328 OUTAGE AND IT EXERCISED THE FIX.** The
cold-start check was rewritten asymmetric after 328 refused to serve all eight
certifications, and had never run in the safe direction since. Running 334 before
deploying the function produced `behind_by: ["AIMS-F","ISMS-F"]` in the
courseware-read log -- serving the intersection rather than refusing. That line
was READ BEFORE DEPLOYING, because the opposite direction (function ahead of
views) still refuses everything. The log was the decision, not the reassurance.

[Superseded: the line below was written while 331 was pending.] **Migration tip: 331. Next free number: 332. 331 is WRITTEN AND HAS NOT RUN.**
331 turns partner features from grant-by-exception into GRANT BY DEFAULT,
REVOKE BY EXCEPTION: `public.mcp_features` is the vocabulary, and a row in
`public.company_feature_disables` means REVOKED. A new partner works because the
disables table has no row for them, not because anyone remembered a step.

**TWO POLARITIES NOW COEXIST AND THE NAMES ARE THE ONLY GUARD.**
`company_features` = a row means GRANTED; `company_feature_disables` = a row
means REVOKED. Deliberate: `curriculum_coverage` returns competitor intelligence
and stays grant-shaped, because default-on for every partner is a product
decision and not a refactor. 331 puts that warning in a `comment on table` on the
OLD table, which is the place the mistake would be made.

**AND THE READ FAILS OPEN, WHICH IS THE OPPOSITE OF BEFORE.** "Is the scope
present" fails closed; "is it disabled" fails open, because every way of failing
to learn the truth reads as "not disabled". So `mcp.feature_status` returns a
STATUS -- ok / company_unknown / unknown_feature -- and a caller that cannot get
`ok` must refuse. A typo in `feature_key` is rejected by a foreign key rather
than silently failing to revoke, which under this polarity is the defect nobody
would ever look for.

331 also DROPS `issuers.mcp_scopes`, added by 329 hours earlier: grant-by-default
retires it, and an ignored grant column beside a disable table is two mechanisms
for one question.

**Migration tip: 330. Next free number: 331. Nothing is outstanding.** 303-311
and 313-330 have all RUN, and the OAuth path served its first lesson on
2026-09-16: 8 blocks, 5,002 characters, on `x-certidemy-token` with no API key.
The same user's ordinary browser session, against the same lesson, was refused
401 -- which is the confused-deputy case `MCP-SERVER.md` 13 named, closed and
measured rather than argued.

[Superseded: the line below was written while 330 was pending.] **Migration tip: 330. Next free number: 331. 330 is WRITTEN AND HAS NOT RUN.**
303-311, 313-328 and 329 have all RUN. **330 fixes a grant 329 got wrong**:
`mcp.resolve_oauth_caller` was granted to `service_role` because 329 was written
while the open question was whether the Worker or the function resolves the
token. The function won, resolves on its own reader pool as `mcp_reader`, and the
first OAuth lesson read ever attempted answered `500 read failed` with
`permission denied for function resolve_oauth_caller` in the request log.

**329's post-conditions passed while the path could not run**, because they
asserted `service_role` -- a role that never calls it. Run the check as the party
the property is about; 330 calls it `set role mcp_reader`.

303-311 and 313-328 have all RUN. 329 adds `issuers.mcp_scopes` (default `{}`,
so it entitles nobody) and `mcp.resolve_oauth_caller`, the OAuth twin of
`resolve_api_key`. It also grants `service_role` USAGE on schema `mcp`, without
which the Worker's RPC answers 42501 -- measured against the live project before
the file was written, not discovered afterwards.

328 ran on 2026-09-16 after its first attempt aborted on a post-condition that
had kept 325's literal `4` while the views were built from the new array. The
counts now derive from `allowed`, so a view and its assertion cannot disagree by
construction.

303-311 and 313-326 have all RUN. 326 ran on 2026-09-15 and was verified the same day
against `pg_catalog` rather than against a report that it had: the table exists
with `relrowsecurity`, both policies are present, `can_bind_issuer` carries
`proconfig {search_path=""}`, and **`oauth_issuer_bindings` holds one row** --
written by the consent screen through the policy, which is the only evidence
that the authenticated INSERT path actually works.

That last clause is the point. 326's own probes ran inside its transaction and
committed; the row is the separate, after-the-fact proof, and it is the kind a
migration cannot give itself.

303-311 and 313-325 have all RUN. Verified 2026-09-15 against `pg_catalog`, not against
this line: `is_platform_admin` / `is_team_admin_of` carry `proconfig
{search_path=""}`, are still `stable`, and their bodies match 318 byte for byte
including the `::public.platform_role` cast 318 introduced (318); `mcp.resolve_api_key`
exists (323); `mcp.log_request` admits `lesson` and `lesson_index` (324); and all
five `mcp` views carry `code = any ('{AISM-I,AIE-I,AIHR-I,AIGRM-I}')` (325).

**AND ON 2026-09-15 THE STATUS WAS STALE BY FOUR WITH THE NUMBER RIGHT -- the
2026-09-13 variant, recurring.** The line above read *"318, 323, 324 and 325 are
written and have NOT run"* after all four had run, and `HANDOFF-v12_4-addendum.md`
section 4 still listed *"318 is still written and not run"* under decisions
waiting. A session opened on that sentence and carried it forward as fact. The
number was correct, so `ls migrations/` confirmed it and said nothing about the
four. **This is the second recorded instance of the status half going stale under
a correct number, and it is the more dangerous half**: a wrong number collides
loudly at `create`, a wrong status sends someone to re-run a migration that has
already run, or to build on the belief that a pin, a function or a widened view
is not there yet.

**AND IT WENT STALE BY FIVE ON 2026-09-14, in the session that wrote all five.**
The line read *"316 / next free 317"* while 317, 319, 320 and 321 had run and 318
was on disk. Same session, same author, no handover involved -- the third
self-inflicted instance recorded here, and the largest since the 2026-09-12 gap.
The mechanism is the one already named at the top of this section: updating the
tip is not part of writing a migration, so it does not happen when one is
written. It was caught only because a handoff asked the disk what had run. **There is no 312** - the number was claimed and its premise
rejected before anything was written, so the sequence skips it on purpose.
Sequential, zero-padded to three digits, `NNN_snake_case_name.sql`.

**ON 2026-09-13 THE NUMBER WAS RIGHT AND THE STATUS WAS STALE**, which is a
variant this paragraph had not recorded. The line read *"313 / next free 314"* --
correct -- while the same sentence still said *"309 is written and has NOT run"*
after 309, 310, 311 and 313 had all run. Every warning below is about the NUMBER
going stale, so a reader checking `ls migrations/` confirms the number and comes
away reassured about a sentence the check never touched. **`ls` proves what
exists on disk. It proves nothing about what has been applied.**

**AND IT WENT STALE AGAIN ON 2026-09-12, FIVE BEHIND, IN THE SESSION THAT HAD
JUST REWRITTEN IT.** The line read *"304 / next free 305"* while 305, 306, 307
and 308 had all run and 309 was on disk. The same session wrote the tip at 304,
then created and ran five more migrations over the following hours and never came
back to it. That is now the SECOND self-inflicted instance and the largest gap
recorded. The mechanism is not two sessions and it is not forgetfulness about
someone else's work: **updating the tip is not part of writing a migration, so it
does not happen when a migration is written.**

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

  As of **2026-09-13**, `--all` reports 55-58 checks per certification (the count
  varies; some skip) and ends with `3 cert(s) with FAILURES`:

  ```
  FAIL  AIE-I      52 pass, 2 fail, 4 warn
  WARN  AIGRM-I    56 pass, 0 fail, 3 warn
  WARN  AIHR-I     55 pass, 0 fail, 2 warn
  WARN  AIMS-F     56 pass, 0 fail, 3 warn
  WARN  AIMS-IA    52 pass, 0 fail, 5 warn
  WARN  AISM-I     56 pass, 0 fail, 2 warn
  WARN  ISMS-F     56 pass, 0 fail, 2 warn
  WARN  ISMS-IA    55 pass, 0 fail, 3 warn
  WARN  SD-AI-I    58 pass, 0 fail, 5 warn
  FAIL  SM-AI-I    57 pass, 1 fail, 6 warn
  WARN  SM-AI-II   56 pass, 0 fail, 4 warn
  WARN  SPO-AI-I   58 pass, 0 fail, 5 warn
  FAIL  ZZ-TEST-I  28 pass, 12 fail, 1 warn
  ```

  **RE-MEASURED IN ONE `--all` RUN ON 2026-09-14, twice.** First every row gained
  EXACTLY ONE warn and no pass or fail count moved; then every row except
  ZZ-TEST-I (which has no scheme document) gained EXACTLY ONE pass, again with
  nothing else moving. The second delta is `min_passing_items`. That uniform +1 is
  `jta.higherOrder`, which reports the share of exam-scope tasks at analyze or
  above and gates nothing - a floor has not been chosen. A uniform delta across
  thirteen certifications is also the evidence that nothing else shifted.

  **MEASURED IN ONE `--all` RUN, NOT TRANSCRIBED ROW BY ROW.** The previous table
  was carried forward by hand between sessions and went stale; these thirteen
  rows came out of a single invocation on 2026-09-13, so they are consistent with
  each other by construction. Re-measure the same way or not at all - a baseline
  assembled from thirteen separate runs on thirteen different days is not a
  baseline.

  **AIMS-IA'S FAILURE IS GONE - four certifications with failures became three.**
  It was `items.citations` on `ISO 19011:2026 clause 6.8`, a clause that does not
  exist (clause 6 ends at 6.7), in a live tier-2 SECURE bank. Migration 304 fixed
  the explanation and 306 caught that 304 had missed the same address in an
  option. Nothing else about AIMS-IA changed.

  **The pass counts rose 1-2 per certification because two invariants were added,
  not because anything was relaxed:**

  - `items.citations` (§8.1) - resolves every clause and annex reference against
    ISO 19011:2026, 27001:2022 and 42001:2023 on disk. FAIL on secure, WARN on
    practice, SKIP where the PDFs are absent or the cert cites nothing. It is why
    AIGRM-I, AIMS-F, ISMS-F, ISMS-IA and SD-AI-I each gained a pass, and why the
    Scrum certs did not - they cite no clause of any standard held on disk.
  - `i18n.reviewed` (§8) - reads `item_translation_reviews` and reports
    UNREVIEWED and STALE **separately**, because "nobody read anything" and "a
    human approved something that no longer exists" are different states.
    Currently PASS on ISMS-F (18 rows) and AIMS-F (10); every other bank SKIPs,
    having no `item_origin='translated'` rows.

  **SM-AI-II returned to its baseline rather than improving past it.** It read
  55/0/3 before today, moved to 54/0/4 when `generate-practice-questions` wrote
  two `true_false` items with two options onto a tier-2 bank, and is back at
  55/0/3 now that 309 retired them and `validateQuestion` reads the tier. That
  round trip is the only reason its numbers look unchanged.

  The three remaining failures, and none is new work waiting to be found:

  | cert | failure | state |
  |---|---|---|
  | AIE-I | 120 ungrouped items | **grew from 15**, see below |
  | AIE-I | scheme claim: validity 730 vs 365 in the database | **deliberate.** `SCHEME-AIE-I.md` explains why neither side was changed: editing the document retracts a published two-year promise to five holders, setting the column changes what the credential means. It fails on every run until someone decides, which is the correct behaviour for an open question |
  | SM-AI-I | 20 ungrouped items | see the ungrouped note below |

  ZZ-TEST-I is a test certification and is expected to fail.

  **AIE-I, §8 "Every item belongs to a question group" — 120 ungrouped items,
  AND THE NUMBER IS STILL GROWING.** `question_group_id` is the trilingual
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
