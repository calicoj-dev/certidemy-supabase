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

**Migration tip: 246. Next free number: 247.** Sequential, zero-padded to three
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

`cron.schedule` is NOT transactional. Keep it outside the `begin/commit` block,
commented, to be run separately after the function it points at is deployed.

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
running:

- `load-lessons-direct.mjs` — flag is `--dry`, NOT `--dry-run` (unknown flags are
  silently ignored, which means a typo runs it live). Needs `CERT_ID` env.
  Idempotent: SKIPS existing rows, so it cannot be used to update content.
- `update-lesson-content.mjs` — the one that updates existing rows. `--file`,
  `--lang`, `CERT_ID`, `--dry` first.
- `wire-lessons.mjs` — env vars `CERT_ID` and `DRY_RUN=1/0`, no flags.
- `verify-cert.mjs` — 38 invariants, 0 failures as the baseline.

Mojibake detection is blunt SQL, not clever regex: `content_md like '%â€%'`.

---

## Working style

**Complete files or fully scripted edits.** Never snippets.

**Read a file before editing it.** Never reconstruct contents from an earlier
paste or a similar file.

**`--dry` first, always**, and a dry run reporting `ok` has changed nothing —
verify separately that writes landed.

**Validate before writing**, so ABORT genuinely means nothing was written.

**Post-conditions name a property, not a count.** Wrong expected counts have
caused far more false aborts than real catches.

**Guards match code shapes, never English words** — a check for `to anon` once
aborted on a comment saying "no grant to anon or authenticated."

**The recurring failure mode of this system is silent success.** It is caught
only by asserting a specific expected value, never by the absence of an error.

**`git status --short` before every commit.** Build and commit are separate
steps.
