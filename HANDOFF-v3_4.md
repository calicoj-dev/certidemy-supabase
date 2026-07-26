# HANDOFF v3.4

Checkpoint after the growth-console + GoHighLevel-integration session. Continues
from v3.3. **Migration tip: 144.** Next free migration: 145. Handoff chain: v3.4.

Two repos under `C:\Users\Juan\Documents\certidemy\`:
- `certidemy-web\` -> GitHub `calicoj-dev/certidemy` -> auto-deploys to Cloudflare Pages on push to main
- `supabase\` -> GitHub `calicoj-dev/certidemy-supabase` (remote name differs from the local folder `supabase\`)

Supabase project ref: `pctynukndxnmnxiqpgck`. Deploy edge functions from the
PARENT `certidemy\` folder; run git from INSIDE each repo folder.

---

## What shipped this session (all committed + pushed + deployed unless noted)

### 1. Platform-admin USER CENSUS (`/console/people`, platform_admin branch)
A whole-account growth/retention console. Every account is placed at exactly one
**funnel stage** (priority order): `certified` -> `seat_unused` ->
`enrolled_no_seat` -> `never_activated`. Independent flags: `dormant` (no session
in 30d; `DORMANT_DAYS`; never-signed-in counts as dormant), `emailConfirmed`.

Surfaces: funnel summary strip; segment chips (all / never_activated /
enrolled_no_seat / seat_unused / certified / dormant / unconfirmed); sort menu
(recent / dormant / newest / most_enrolled); segment-aware **Copy-emails**
(confirmed-only except in the unconfirmed segment); **per-row click-to-copy
email**; per-enrollment **green certified chip** (a person certified in one cert
but studying others shows a green checked chip for the passed cert, plain for the
rest -- keyed by `${user_id}|${CERT_CODE}` from active credentials).

Files:
- `supabase/functions/list-users/index.ts` -- admin-gated, JWT-verified (NO
  `--no-verify-jwt`). One bulk read each of `auth.admin.listUsers()` (paginated),
  `profiles`, `team_members` (role), `user_certifications`+`certifications`,
  `vouchers` (usable-seat state), `credentials` (certified per user+cert). Derives
  stage + flags server-side. No N+1. Returns `{ users, summary }`.
- `certidemy-web/lib/console/users-list.ts` -- loader (`loadCensus`), mirrors
  loadPlatformCredentials; failure-tolerant (empty census on error).
- `certidemy-web/components/console/users-census-table.tsx` -- the client table
  (also grew the GHL push control, see #5).
- `certidemy-web/app/[locale]/console/people/page.tsx` -- ROLE-BRANCHED:
  platform_admin -> census; team_admin -> existing partner roster (untouched).
- `certidemy-web/app/[locale]/console/layout.tsx` -- added "People" + later
  "Integrations" to the admin nav.

No migration for the census -- service-role edge function, same pattern as
list-credentials.

### 2. INTEGRATIONS console section (`/console/integrations`, platform_admin only)
Built as a reusable LIST of integration cards; GoHighLevel is card one. Stripe /
Credly / etc. later are just new rows in the same table + same card component.
Added to the admin nav.

### 3. Encrypted-credential store -- MIGRATION 144 (Supabase Vault)
`144_platform_integrations.sql` -- applied editor-first, verified with a live
Vault round-trip (store -> read back decrypted -> confirm ciphertext at rest ->
clear), committed as the record (`d00b2f0`).

Design: the token is NEVER in the table -- only a POINTER to a Vault secret, plus
`key_last4` and non-secret `config` (e.g. `location_id`, which is a public GHL
identifier from the URL and is stored plain + shown in full). Write-only
credential: nothing reads the token back toward a browser; only the sync/test
functions read it via RPC at call time.

- Table `public.platform_integrations` (slug PK, status, vault_secret_id,
  key_last4, config jsonb, last_error, connected_at/by, updated_at). RLS ON, NO
  authenticated policy -- service-role only (service_role bypasses RLS).
- Vault wrapper RPCs (SECURITY DEFINER, EXECUTE granted to service_role only):
  - `integration_store_token(slug, token, config, actor)` -- create on first
    connect, ROTATE in place on reconnect (vault.update_secret), upsert the row.
  - `integration_read_token(slug)` -- returns decrypted token via
    `vault.decrypted_secrets`; null if not connected.
  - `integration_clear(slug)` -- delete the vault secret, reset the row.
- Vault is enabled by default on Supabase; the RPCs wrap it so the app layer is
  insulated if Vault internals shift. Uses `vault.create_secret` /
  `vault.update_secret` (function API, which does NOT log plaintext -- do not use
  raw INSERTs into vault.secrets).

### 4. Integration edge functions + live paste-and-connect card
- `supabase/functions/connect-integration/index.ts` -- admin-gated. `action:
  "connect"` stores/rotates via `integration_store_token`; `action: "disconnect"`
  clears. **Sanitizes `location_id`**: strips any pasted URL fragment down to the
  bare id (regex on `/locations?/<id>` + drop from first slash) -- fixes the
  real-world paste-the-whole-URL mistake. Returns status only, never the token.
- `supabase/functions/test-ghl-connection/index.ts` -- admin-gated. Reads the
  Vault token, `GET https://services.leadconnectorhq.com/locations/{locationId}`
  with `Authorization: Bearer <token>`, `Version: 2021-07-28`. Stamps status
  connected/error + last_error + returns the location NAME (so the admin confirms
  the right sub-account). Read-only against GHL.
- `supabase/functions/get-integrations/index.ts` -- admin-gated status read
  (status, last4, config, last_error). NEVER selects the token/vault_secret_id.
- `certidemy-web/lib/console/integrations-status.ts` -- `loadIntegrations` loader.
- `certidemy-web/app/[locale]/console/integrations/page.tsx` -- loads status,
  passes to the card.
- `certidemy-web/components/console/integration-card.tsx` -- rebuilt from
  instruction-panels into a real **paste-token + Location-ID -> Connect** form.
  Token is a password input, write-only, shows only "ending xxxx" when connected.
  Buttons: Test connection, Replace key (rotate = paste new), Disconnect.
  **Error-state recovery**: form shows whenever NOT connected (disconnected OR
  error), error banner shows above the form, plus a "Clear & reset" button --
  fixes a stuck-error dead-end. Help panels: "Where to get these from GHL",
  "What gets synced" (field -> tag mapping).

**VERIFIED LIVE**: connected to GHL account "CertiGlobal", Test connection green.
The full encrypted-credential path (Vault store -> RPC read -> GHL auth) is
proven end to end against the real account.

### 5. sync-to-ghl -- the CRM WRITER (Certidemy -> GHL, outbound)
- `supabase/functions/sync-to-ghl/index.ts` -- admin-gated. Body:
  `{ mode: "segment" | "all", userIds?, dryRun }`.
  - Reads the census (invokes list-users) so funnel stage matches the console.
  - **Matches strictly by EMAIL** (`POST /contacts/upsert`) -- cannot overwrite an
    unrelated contact.
  - Sends **name + email ONLY**. Never phone/payment/marketing -- those are GHL's.
  - Tags are **ADDITIVE** (`POST /contacts/{id}/tags`): `certidemy-stage:<stage>`,
    `certified:<CODE>` per passed cert, `dormant`, `unconfirmed`. Existing GHL tags
    never touched.
  - **Certidemy name is authoritative** (it's the cert issuer) BUT a **dryRun**
    surfaces every name that WOULD change first -- never silent.
  - **Throttled** ~130ms/call to stay under GHL's 100-req/10s burst limit.
  - dryRun=true writes nothing (search + classify + list name mismatches).
    dryRun=false upserts + tags, returns {created, updated, tagged, failures}.
    Stamps `last_sync_at`/`last_sync_count` into config.
- `certidemy-web/components/console/users-census-table.tsx` -- **Push controls**:
  "Push segment to GHL" (current filtered audience) and "Push all". Both run the
  **preview (dry run) first**; a panel shows counts + name mismatches
  (old -> new, Certidemy wins) + a "Confirm push to GoHighLevel" second click that
  does the real write. Preview writes nothing.

GHL API facts (verified current, 2026): base `https://services.leadconnectorhq.com`;
`Authorization: Bearer <token>`; `Version: 2021-07-28`; Private Integration Tokens
are static (no refresh) -- rotate from the GHL UI; endpoints `/contacts/upsert`
(dedupes per the location's Allow-Duplicate setting), `/contacts/{id}/tags`
(additive), `/contacts/search`, `/locations/{id}` (test). Rate limit 100/10s,
200k/day.

---

## Commit hashes (this session)
- web: census (list-users + table + page + nav), integrations shell, then the
  chain below.
- `d2a7c3c` (web) integrations shell v1 (instruction-only card) + click-to-copy
- supabase Stage-B: `fb1fc7b` (connect/test/get functions), `387d620`
  (location_id sanitizer)
- `d00b2f0` (supabase) migration 144
- web `592f044` (live paste-and-connect card + loader + page)
- web `8c145f0` (Push to GHL control), supabase `a6ef65e` (sync-to-ghl)
- (earlier tonight, from v3.3 tail: pill/eligibility/cert-download-pin already
  captured in v3.3)

---

## OPEN LOOPS (eyeball, not yet verified)
- **The GHL push has NOT been run against live data yet.** Built + deployed, not
  eyeballed. FIRST NEXT ACTION: People -> filter ONE email -> Push segment ->
  preview -> Confirm -> verify the contact + tags land in GHL. Test small before
  a big push (it writes to the live CRM).
- Post-exam certificate filename check (carried from v3.3; needs a real exam pass).

## QUEUED (next builds, in recommended order)
1. **Inbound GHL -> Certidemy provisioning** (the "two-way" idea, correctly
   scoped): GHL webhook/action -> Certidemy edge function -> `auth.admin.createUser`.
   **HARD RULE decided this session: temp passwords NEVER travel back to GHL.**
   Certidemy owns the credential and sends its own set-password / magic-link email;
   GHL only triggers creation. This is the safe version of "GHL creates users".
2. **GHL -> create/assign voucher** (money-path, most locked-down + fully audited,
   built LAST): mint+assign a voucher from GHL when CertiGlobal sales closes a
   deal. A voucher gates a paid seat, so this needs admin-authenticated, audited,
   rate-limited plumbing -- never a loose webhook.
3. **CSV bulk account provisioning** (Certidemy-native, separate from GHL): client
   gives an employee CSV -> create accounts w/ temp passwords via
   `auth.admin.createUser` + Certidemy-sent invite email. Same password-safety rule.
4. **Event-driven near-real-time GHL sync** (tier 3): fire sync-to-ghl on
   credential mint / enrollment / voucher assign, so GHL updates within seconds
   instead of on a manual push. Build after the manual push is proven in the wild.
5. From v3.3 still open: `get-exam-eligibility-batch`; `passed` terminal voucher
   state for the console Direct card.

---

## SCALE NOTES (not problems now, flagged for later)
- sync-to-ghl is synchronous + throttled: "Push all" on a large census runs a
  while (~4 calls/contact at ~8/sec). Fine at current scale; becomes a
  background-job candidate in the thousands.
- The dry-run preview does real GHL reads (one search/contact), so even preview
  counts against rate limits on a huge list.
- list-users reads live auth.users via the admin API (paginated, <=50 pages of
  1000). Fine well under a few thousand accounts; cache or move to a view if it
  ever feels slow.

---

## PROCESS LESSONS carried / reinforced this session
- **Editor-first proved its worth**: migration 144's Vault round-trip was verified
  in the SQL editor BEFORE any app code stacked on it. Do this for every new DB
  primitive.
- **Browser download dedup**: re-downloading a file the browser already has saves
  it as `name (1).ext`, so a place script silently copies the STALE original.
  ALWAYS delete old Downloads copies before re-downloading. Bit us twice; the fix
  is the delete-first step now baked into every place block.
- **Deploy/verify honesty**: a green build/deploy of the OLD file is still green.
  `landed=True` (marker present on disk) is the real proof, not the build.
- **`Split-Path -LiteralPath -Parent` fails in PS 5.1** -> use
  `[System.IO.Path]::GetDirectoryName()`.
- **BOM-safe writes**: `New-Object System.Text.UTF8Encoding($false)` +
  `WriteAllText` + absolute paths; first 3 bytes must NOT be `ef bb bf`.
- **JSX-text unicode escapes render literally** -- `\u2014` in JSX text prints the
  literal string; wrap as `{"\u2014"}`.
- **CRM-writer discipline**: match on a stable key (email), only add (tags), never
  overwrite fields another system owns, dry-run before writing. The "700 wrong
  contacts overwritten" failure class is real -- design against it.
- **Secrets are a CLI command, not a file** (was a point of confusion): the token
  now lives Vault-encrypted set via the in-app form, so the CLI is out of the
  connect flow entirely.
- Deploy admin-gated functions WITHOUT `--no-verify-jwt` (JWT-verified is correct);
  only public endpoints get the flag / config.toml pin.

## KEY OWNERSHIP MODEL (decided this session, for the GHL work)
- **Certidemy owns**: credential name (it's on the cert -> authoritative spelling),
  email, funnel tags.
- **GHL owns**: payment, phone, marketing/sales state, everything else. Certidemy
  never writes these.
- **Name collisions**: surfaced in the dry-run preview; Certidemy's name wins on
  an APPROVED push, never silently.
