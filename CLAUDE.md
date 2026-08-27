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

**Migration tip: 261. Next free number: 262.** Sequential, zero-padded to three
digits, `NNN_snake_case_name.sql`.

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

**Use `arrayBuffer()`, never `.text()`, in any pass-through proxy.** `.text()`
has corrupted PNG bytes twice.

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

**Until then: `credentials` gains a column → four inserts change.**
`_shared/issue.ts`, `score-mock-exam`, `mint-missing-credentials.mjs`, and any
migration backfill. Grep `from("credentials")` in both repos before shipping.

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

  As of 2026-08-25, `--all` reports 43–44 checks per certification (the count
  varies; some skip) and ends with `1 cert(s) with FAILURES`:

  ```
  FAIL  AIE-I      39 pass, 1 fail, 3 warn
  WARN  AIGRM-I    41 pass, 0 fail, 2 warn
  WARN  AIHR-I     42 pass, 0 fail, 1 warn
  WARN  AIMS-F     42 pass, 0 fail, 2 warn
  WARN  AIMS-IA    39 pass, 0 fail, 5 warn
  WARN  AISM-I     42 pass, 0 fail, 1 warn
  WARN  ISMS-F     42 pass, 0 fail, 1 warn
  WARN  ISMS-IA    41 pass, 0 fail, 2 warn
  WARN  SD-AI-I    40 pass, 0 fail, 2 warn
  WARN  SM-AI-I    41 pass, 0 fail, 2 warn
  WARN  SPO-AI-I   40 pass, 0 fail, 2 warn
  ```

  **The one failure: AIE-I, §8 "Every item belongs to a question group" — 15
  ungrouped items.** `question_group_id` is the trilingual sibling key, so an
  ungrouped item is invisible to the three-language coverage check that groups
  by that column.

  What the 15 rows are, established 2026-08-25 and not further investigated:

  ```
  pool      language  status    is_exam_scope  retired  n   created
  practice  es-419    approved  false          no       15  2026-08-20 -> 08-21
  ```

  So: **none are in the secure pool**, and no certification exam form can
  contain them. They are Spanish-only practice items with no `question_group_id`
  and therefore no en/pt-BR siblings — the es-419 simulator and the review queue
  can serve them, a real exam cannot. They are **not** migration 104 rebuild
  debris as first assumed; they were written on 20–21 August 2026, which points
  at a translation or backfill run from that week.

  (A separate 20 ungrouped rows exist on AIE-I that the check correctly ignores:
  `rejected` and retired, from 24 July.)

  **Why they are ungrouped has NOT been established** — whether the fan-out
  failed, was interrupted, or those items were written outside it. Fixing the
  data is its own change.

  This line previously read *"38 invariants, 0 failures as the baseline"* and
  was wrong on both numbers. That is worse than saying nothing: a clean baseline
  nobody re-checks turns the next real failure into noise someone has already
  decided to ignore. **Every cert also warns**, so "green" is not the bar —
  compare against the table above and investigate anything that moved.

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

**Guards match code shapes, never English words** — a check for `to anon` once
aborted on a comment saying "no grant to anon or authenticated."

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
