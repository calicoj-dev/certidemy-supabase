# HANDOFF v8.6 — A partner can be onboarded, enabled, and issue

**Migration tip: 246. Next free: 247.**

Read v8.5 and its addendum first for the email infrastructure and the CertiGlobal
wind-down. This covers what came after: the partner path went from "the database
had zero memberships" to a partner who can be created, given an issuer, and
issue a credential from a form.

It also covers an incident where signup was silently broken for eleven minutes,
which is the most useful thing in this file.

---

## 1. The incident: signup was dead and nothing said so

**What happened.** Migration 246 carried a commented verification step reading
`drop trigger if exists on_auth_user_created on auth.users;` with the note
*expect 42501 must be owner of relation users*. That prediction came from the
documented PostgreSQL rule plus the ACL: `postgres` has the TRIGGER privilege on
`auth.users` but is not a member of `supabase_auth_admin`.

**The prediction was wrong.** Run at `2026-08-24T14:19:26Z` from the dashboard
SQL editor, the drop **succeeded**. `handle_new_user()` survived;
`on_profile_created_claim_vouchers` survived. Only the first link was cut — so
every signup from that moment would have created an `auth.users` row with no
profile, no claim chain, and **no error**.

Nobody signed up in the window. 28 auth users, 28 profiles, zero orphans.

**Why it's worth a section.** The check and the damage were the same action. A
verification step whose failure mode is indistinguishable from its success is
not a verification step — and this one was proposed to settle a comment.

The rule is now in `CLAUDE.md`: **never propose a destructive statement to
verify a hypothesis about privileges. Verify against `pg_catalog`, or leave it
unverified and say so.** 246 no longer contains the statement, its
*WHY REPLACE, NOT DROP* block records the observed result rather than the rule,
and it carries a *HOW THIS WAS LEARNED* block.

`create or replace trigger` is still the right form — for idempotency, not for
privilege.

---

## 2. Partner onboarding, fixed at all three layers

**The bug.** Invite redemption lived in exactly one place: an `AFTER INSERT`
trigger on `profiles`. That covers signup-after-invite and only that. If the
invited address **already had an account**, no profile insert would ever happen
for it again — so the invite sat `pending` forever. No failed row, no log line,
no exception. The trigger ran, matched nothing, returned. And the modal told the
admin the invite had been sent.

**"Already signed up" is the normal case.** The person most likely to be made a
partner is the person most likely to have already tried the product — a trainer
evaluates the material, decides it's good, then asks.

Found by doing it in the "wrong" order on purpose.

**Migration 245** — `create_company_with_admin(p_name, p_admin_email, p_actor,
p_invoice_ref)` returns `jsonb`, `security definer`, `search_path = public`.
Validates, then writes `companies`, `company_invites`, `team_members` (when a
profile already exists), and `admin_actions` — **atomically**. Returns
`{company_id, invite_id, user_id, membership}` where membership is `'immediate'`
or `'pending'`.

Body md5 with CRs stripped: `f387492a6954e3c86ee182a723ef54ba`, verified against
live `prosrc`.

Also added `company_invites_role_vocab CHECK (role in ('team_admin','team_member'))`.
The column was plain `text` while the trigger cast it to the `team_role` enum, so
a typo inserted cleanly and then raised `22P02` **inside the signup transaction**
— blocking that person's account creation, days later, against a different actor.

**`create-company`** now writes nothing itself. It authorizes `platform_admin`,
passes the resolved caller as `p_actor` (the RPC can't derive it — `auth.uid()`
is null under service_role), and calls the RPC. The orphan-company failure its
own old comment documented can no longer happen.

**`CreateCompanyModal`** branches on `membership`. **It tests for `"immediate"`,
not `"pending"`**, so an unknown or absent value falls to the conservative
message. Telling an admin that access exists when it does not is the failure this
chain was built to close.

If a fourth outcome is ever added to the RPC, the modal must learn it.

---

## 3. The first partner

`team_members` had **zero rows platform-wide** before this session. So
`is_company_admin()` had never returned true for anyone, the second branch of
`can_read_issuer()` had never fired, and every partner-scoped read that had ever
succeeded went through the `platform_admin` branch.

**The partner console's data layer was unexercised** — four translated pages
shipped through a code path no user had ever traversed.

A second account (`info+partner@certidemy.com`, `platform_role = 'learner'`) now
holds `team_admin` on "Certidemy (partner view)". Verified: the console renders
in both English and Spanish, the scope badge shows the company rather than
"Platform admin", and the four-item nav is correct.

> **An acting-as switcher for the platform_admin account was designed and
> abandoned.** The RLS policies `OR` in `is_platform_admin()` at nearly every
> read, so a cookie saying "act as company X" would narrow what the app asks for
> but not what the database returns — the admin would still read a superset. A
> second account is faithful by construction; it isn't a simulation of a partner,
> it *is* one.

---

## 4. Creating an issuer — the surface that didn't exist

`create-partner-issuer` had **zero callers** in the web app. Both live issuers
were made by raw invocation, and there was no way to create one from the console.
That's why a partner with a company still saw the pitch screen.

New section on `app/[locale]/console/companies/[id]/page.tsx` (already
`platform_admin`-gated at line 153), plus `issuer-section.tsx` and
`create-issuer-modal.tsx`.

**It reads as a capability, not as a row's existence.** Four states, each with the
same sentence: *cannot issue* for none, draft and verified; *can issue* only for
active. The verified-vs-active distinction is otherwise invisible, and only
`active` can issue.

**Two checks exist only in the form**, and that asymmetry is recorded:

- `site_url` parsed with `new URL`, requiring `https:` and a dotted hostname. The
  server checks `startsWith("https://")` and nothing else, so the bare string
  `"https://"` passes it.
- `certidemy.com` and its subdomains **refused** as a verification domain. The
  function has no such check, so raw invocation still bypasses it. The existing
  test issuer verified against `credentials.certidemy.com` — our own domain,
  which satisfied the check while proving nothing about the partner.

`SLUG_RE` and `DOMAIN_RE` are mirrored verbatim. **The 30-entry RESERVED slug list
is deliberately not mirrored** — the server's 400 is surfaced instead. That list
blocks `iso`, `accredited`, `certified`, `17024` and similar, because a slug like
`iso-certified` puts an accreditation claim inside the identifier of every
credential that partner signs, where no page disclaimer can reach it.

**The slug renders as the URL it becomes** — `credentials.certidemy.com/issuers/<slug>`
— with a live preview and a permanence warning, because that URL is embedded in
every credential the issuer signs.

**The verification token is now returned by the console.** It was on the
never-returned list in `issuing.ts` alongside `key_hash` and `vault_secret_id`.
Those two stay. The token moved out with its own paragraph: the function's own
comment says *control of the path is the proof, not knowledge of the string* —
publishing it is the point, and it was otherwise recoverable only by a direct DB
read.

**Not built:** deactivation (no code path anywhere — `activate-partner-issuer`
rejects any mode but `verify` and `activate`), a confirmation on activate (it is
currently one unguarded button, and activation is irreversible), and revoking an
API key (`revoke-issuer-api-key` exists with no caller, while the New-key modal
tells the user to revoke a lost key).

---

## 5. The mint, extracted

A partner admin had **no way to issue a credential to one person**.
`issue-partner-credential` is API-key-only and `verify_jwt = false`; only two
functions in the whole codebase insert into `credentials`, and the other requires
a scored exam attempt. A solo trainer wanting to hand certificates to twelve
people needed a developer.

**`functions/_shared/issue.ts`** (409 lines) now owns achievement resolution
scoped by `(issuer_id, code)`, the date computation with the
`default_validity_days` fallback, the 5-attempt collision loop, the credential
insert, and the `credential.issued` webhook queue. It writes **no audit row of
either kind** — `issuer_api_requests` is keyed to `api_key_id` and `admin_actions`
to `actor_user_id`, so those are two different records, not a duplication.

**Why not a mode on the existing function.** It's pinned `verify_jwt = false`, so
a browser mode would mean one deployment where the gateway is off and
authentication branches on which header arrived. And `logRequest` returns early
when `keyRow` is null — every audit call in a JWT path would have silently
no-opped, leaving console issuance with no record at all.

**One ordering detail worth keeping.** The issuer active-check stays inline in
`issue-partner-credential` and stays *before* the body parse. Folding it into the
shared function would have moved it after parsing, so a request with both an
inactive issuer and a bad email would have started returning 400 instead of 403 —
a silent change to a live partner contract.

**`issue-credential-console`** — `verify_jwt = true`, pinned explicitly in
`config.toml` rather than left to the default, since it's the first
browser-reachable path into `credentials`. It takes `issuer_id` in the **body**,
so `requireIssuerAccess` is the only thing between a valid JWT and minting under
someone else's identity.

`issue-partner-credential` was **redeployed even though its own file didn't
change** — it bundles `_shared/issue.ts`, and without the redeploy the two
functions would have run different copies of the shared mint. Exactly the drift
the extraction exists to prevent, introduced by the extraction.

---

## 6. `is_specimen` is reachable from the code that mints

Seven specimen credentials existed and the platform branches on `is_specimen` in
four places — `verify-credential` computes an effective status, `credential-og`
renders a distinct card so a demo can't be shared as real,
`_shared/certificate.ts` marks the document, and `open-badge` both refuses an
anchor proof and excludes it from the status list.

**Both issuing paths hardcoded `false`.** Every one of those seven was created
some other way. A designed mechanism the minting code cannot produce is one that
will rot.

`isSpecimen` now exists on `IssueInput`, resolved as `input.isSpecimen === true`
so a stray truthy JSON value can't produce one by accident. Exposed **only** on
the console function, **only** to `platform_admin`, and **refused rather than
ignored** — silently dropping the flag would tell an operator they minted a
specimen when they minted a real credential.

Not exposed on `issue-partner-credential`: a new body field is a change to a live
partner API contract.

**What a specimen still costs.** `status_list_index` defaults to
`nextval('credential_status_index_seq')` and is NOT NULL, so a specimen consumes a
sequence value like anything else. What it avoids is narrower: its index never
occupies a bit in a signed status list document, and it is refused an anchor
proof. **Cheaper is not free.**

---

## 7. What the smoke test proved

Two specimens were minted **through the form**, by clicking a button — after an
attempt to test via a browser-console `fetch` failed and was abandoned. That
approach was wrong for this operator and wrong in general: hand-assembling bearer
tokens is not how you verify a product.

| code | achievement | index | recipient |
|---|---|---|---|
| `SCRUM-BOOTCAMP-2-SYKX-FGZ7` | `SCRUM-BOOTCAMP-2026-08` | 18 | specimen+console@certidemy.com |
| `SCRUM-BOOTCAMP-2-YTQE-47QD` | `SCRUM-BOOTCAMP-2026-09` | 19 | testingtesting@gmail.com |

Both `is_specimen: true`, `status: active`, `user_id: null`, `expires_at: null`,
`subject_salt` 64 chars, `webhooks_queued: 0`. **Both rows are permanent** —
revocation is a status change, not a delete. Sequence is at 19.

**Proven:** the console path end to end, `requireIssuerAccess`, the specimen gate,
`status_list_index` allocation, the audit row, and the achievement lookup.

**A false alarm worth recording.** The first mint appeared not to have landed —
the achievement row's count didn't move. It was correct: `lib/console/issuing.ts`
excludes specimens from the "N issued" figure, deliberately, because *a partner's
count that includes them is a number they will quote and be wrong about*. The
count stayed honest and the screen was opaque. Fixed by showing the specimen
figure as a secondary label (`1 ISSUED · 1 DEMO`), not by changing the count.

**The second mint answered the first mint's open question.** It ran on v3, where
`requested_achievement_code` had just been added, and both the requested and
resolved codes read `-09` — equal. So the lookup resolves correctly and the first
mint's attachment to August was a request-side value, not a lookup fault.

**Still unexercised:** both `IssueError` mappings (the part that was actually
rewritten — the mints were success paths), `achievement_not_active` (no reachable
case; both test achievements are active), and **the entire partner API surface
since the extraction**. All four `issuer_api_keys` are SHA-256 hashed with no
recoverable plaintext, so testing it means minting a fifth key.
`issue-partner-credential` v5 has served no request since the rewrite.

---

## 8. An audit row that agreed with its own outcome

`admin_actions.metadata` originally recorded only the **resolved** achievement
code, on the principle that an audit row records what was written rather than what
was asked for. Correct for `is_specimen`. Wrong here: it made the row agree with
the outcome by construction, so it could not distinguish *"asked for August"* from
*"asked for September and got August"* — which is the one dispute the row exists
for.

Now records both: `achievement_code` (the fact) and `requested_achievement_code`
(the evidence). Equal on every correct issuance, which is why only the failures
make them worth storing.

The existing key kept its name rather than becoming `resolved_achievement_code`,
so `metadata->>'achievement_code'` doesn't silently mean different things either
side of the deploy.

---

## 9. Console i18n — the partner surface is complete

Waves 2–4 shipped earlier (see v8.5). Since then:

| Namespace | Keys | Note |
|---|---|---|
| `consoleSeats` | 87 | +4, −1 (`companyCreated` retired for two branch keys) |
| `consoleOverview` | 8 | `adminSubtitle` rewritten — the tabs carry the dropped sentence |
| `consoleIssuers` | 43 | new |
| `consoleIssuing` | 200 | +42 |

89 keys added per locale, 267 across three. All namespaces equal-sized in all
three locales.

**Two admin-overview fixes:**

The Companies list was derived from `seat_batches`, so **a company with no batch
was invisible** — the count line said "2 empresas" above an empty state. Right
after creating a company, before allocating anything, is exactly when an admin
most needs to see it. Now iterates `companies` and takes the usage rollup where it
exists; empty companies sort first, newest first among them.

The **Direct** B2C voucher list was rendering *inside* the Partners container, so
67 direct vouchers read as partner cards under a heading saying "every partner".
Now a tab, with `?tab=direct` validated server-side so the tab is linkable rather
than just clickable.

**A `created_at` fallback was added and then removed.** It retried `id, name` if
`id, name, created_at` errored, because no migration proves the column exists.
Verified live: it's `timestamptz` NOT NULL default `now()`. The retry was worse
than the failure — a missing column returns `42703`, loud and immediate, while
the catch turns it into a page that quietly renders without dates. **A guard that
converts a crash into wrong-but-quiet output is not a safety net.**

---

## 10. The guard rule, now four-for-four

A post-condition guard has matched the wrong thing four times this session, in
four ways, with one cause: **a heuristic standing in for structure.**

- **Substring** — `includes("to anon")` aborted on a comment saying *no grant to
  anon or authenticated*.
- **Memory** — a `MUST_BE_GONE` list passed while eight strings were still
  English, because it can only contain what its author already remembered.
- **Distance** — a "within 400 characters" check fired on *correct* output,
  because two nodes had moved into opposite branches of one ternary.
- **Substring again** — a check for `createdAt: string | null` matched
  `latestBatchCreatedAt`, which is legitimately nullable.

The rule: assert the structural property. *Exactly one call site, and its index
falls after this named marker.* And: **if a guard cannot name the property it is
testing, it is not testing that property.**

Related: a key-resolution checker that assumes one namespace per file produced 27
phantom failures. Most console files now bind two to four translators
(`t` / `tc` / `tn` / `ti`). Map bindings per file.

---

## 11. Open

**The `test-partner-02` webhook is disabled.** `9de43913`, `is_active = false`,
`failure_count = 0`, `disabled_at` null — deliberately, since that column means
*auto-disabled after 20 failures* and this was a manual pause. Turned off before
the specimen mints so no recipient PII would be POSTed to a public `webhook.site`
URL.

> **Correction to v8.5's addendum framing.** The PII exposure is *prospective*,
> not historical. The one delivery that has ever fired (2026-08-20) carries four
> keys — `url`, `event`, `issuer`, `credential_code`. The current payload shape
> includes `recipient_email` and `recipient_name` and **has never been
> dispatched**. Console issuance would make it reachable by a button click. Left
> unchanged because a partner receiver may key off those fields.

**Next builds, in value order:**

1. **CSV batch issuance.** Two columns — `email` and `full_name`, one string
   onto the certificate exactly as typed. Splitting first/last breaks immediately
   in LATAM (*Juan Pablo Román de Jesús* has two given names and two surnames, and
   any four-column scheme makes someone guess). Dates shared for the batch, not
   per row. **The hard part is idempotency**: there is none, so a 40-row upload
   that fails at row 27 and is re-uploaded mints rows 1–26 twice, all permanent
   and revocable-not-deletable. Needs preview-then-commit, not a file parser.
2. **Deactivate an issuer**, and a confirmation on activate.
3. **Revoke an API key** from the console — the modal already tells the user to.
4. **A counter for tiering.** Nothing meters issuance: no quota column, no rate
   limit, no usage view. `credentials.issuer_id` and `issuer_api_requests.issuer_id`
   have the raw material; there is no counter and no enforcement point. "500/month"
   has nothing to enforce against. The on/off switch already exists as
   `issuers.status` — do **not** add `company_features` for issuing, or there are
   two switches for one behaviour.

**Recorded in `certidemy-web/CLAUDE.md` items 6–10:** the UI-only
`certidemy.com` refusal; three `../supabase` files documenting
`platform_admin`-only while delegating to `requireIssuerAccess`
(`create-partner-achievement/index.ts:6` and its note at 33–39 vs the call at
256, `upload-achievement-image/index.ts:4` vs 184, and `config.toml` above both);
`authorize.ts` ↔ `access.ts` as the **third mirrored-logic pair** after the
`set-cert-link` regex and the `create-company` email regex; two form↔server
constant mirrors, which fail more quietly still — a form stricter than its server
rejects valid input with nothing to error on; `claims_on_signup` returned as
unconditional when it isn't; and the issuer card's matching specimen silence.

**Also open:** `companies/[id]/page.tsx:1` imports `redirect` from
`next/navigation` rather than the locale-aware wrapper (pre-existing, and it
hand-builds the prefix so nothing drops today). `is_platform_admin()` is
`SECURITY DEFINER` with no `search_path` pin, unlike its two siblings — not
exploitable as written, since the body fully qualifies `public.profiles`.
`mintCredentialCode` slices the stem to 16 characters, so `SCRUM-BOOTCAMP-2026-08`
and `-09` both produce `SCRUM-BOOTCAMP-2` and differ only in the random suffix.
`create-company/index.ts` still opens *"Certidemy sells nothing"*, which the
Shopify store may have made false. And a fresh migration replay still fails at
`002_rag_and_chat.sql:72` regardless of 246 — the base schema is not in this repo.
