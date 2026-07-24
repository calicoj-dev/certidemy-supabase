# HANDOFF v3.2

**Session date:** 2026-07-24
**Supersedes:** HANDOFF-v3.1 (which ended with the console redesign approved but unbuilt)
**Migration tip:** 143 · next free number is **144**
**New edge functions this session:** `update-credential-name`, `regenerate-certificate`
**New function secret this session:** `PUBLIC_SITE_URL = https://certidemy.com`

---

## 1. What this session did

v3.1 left the voucher/commercial backend complete but almost entirely without UI,
and named a console redesign that hadn't been built. This session built that UI
and then spent most of its length on a cascade of **production-correctness bugs**
that surfaced once real credentials and real domains were exercised.

Net: the super-admin console is redesigned and live, credential holder-name
correction works end to end, the certificate/OG system points at the real domain,
and a third-party CDN failure that was silently breaking the OG image was found
and fixed. Nothing is left half-wired.

---

## 2. THE CONSOLE REDESIGN — built (was §8 in v3.1, deferred)

Spec: `CONSOLE-REDESIGN-SPEC.md` (in the supabase repo).
Component: `certidemy-web/components/console/admin-allocations.tsx` (rewritten).

The old screen listed **batches flat, sorted by creation** — one partner with six
batches read as six customers, and seats/attempts were conflated into one number.

The new screen:
- **Companies are the object**, one card each, with a **row per certification**
  inside (a partner buying SM-AI-I and AIGRM-I has two different populations).
- **Seats and attempts never share a meter.** Separate bars, each carrying its
  unit. `6 of 20 seats assigned` and `9 of 40 attempts used` are separate facts.
- **Unlimited renders as an infinity glyph, never a filled bar** — you can't fill
  a bar to infinity.
- **Idle seats are the headline metric and the default sort** — paid-for
  inventory nobody is using is the number an admin can act on.
- **Direct (B2C) card** — dashed border, deliberately NOT styled as a company (no
  counterparty). Lists each direct voucher inline with code, holder, order ref,
  attempts, and an effective-status pill. This is where Lizeth's B2C seat finally
  became visible; the original complaint was that a direct seat could be issued
  and then seen nowhere.

Console page (`app/[locale]/console/page.tsx`) updated to pass the new props
(`partners`, `directVouchers`, `totals`) instead of the old batch list.

`lib/console/admin.ts` grew `loadAdminData` additively — `batches`, `totalSeats`,
`totalUsed` are still returned so nothing else importing it broke — and now also
builds `partners`, `directVouchers`, and `totals`.

**Design decision — denominator is purchased entitlement**, `seats *
attempts_per_seat` per batch then summed. NOT the sum of per-voucher allowances,
which grows as seats are assigned and would move the meter while nobody sat an
exam. A meter whose denominator moves is a lie. Proof case: Acme's SM-AI-I is two
batches on different terms, 13 seats, 106 attempts.

---

## 3. MIGRATIONS 139–143

All applied to the live DB (editor-first) and committed.

**139 — `v_console_usage_views`.** Three additive views:
- `v_batch_attempts` (batch grain: seats, attempts_purchased, seats_idle)
- `v_company_cert_usage` (company × cert rollup — the card body rows)
- `v_direct_vouchers` (B2C seats, no company/batch)

`v_batch_quota` was deliberately NOT modified — `v_allocation_quota` depends on it
and `CREATE OR REPLACE VIEW` can't insert a column mid-list. Denominator logic and
the unlimited=NULL rule live here.

**140 — `security_invoker` + `authenticated` grants** on the two aggregate views,
matching `v_batch_quota`. Note: an earlier check *suggested* those grants leaked
across partners; that check was wrong — it tested for `security_invoker=true` where
Postgres stores `on`. The views ARE security_invoker; RLS on the base tables
applies to the caller; no leak.

**141 — rebuild `v_direct_vouchers` as `security_invoker`.** 139 built it joined to
`v_voucher_validity` (not invoker, not granted to authenticated), so an
authenticated read would 42501 and `Promise.allSettled` would swallow it into an
empty array — the Direct card would render "0 vouchers" and look like working code.
A direct seat has no batch, so only the voucher clock applies and the join was
unnecessary; the expiry logic collapses to a `CASE` over `vouchers`. `can_unassign`
is hardcoded `false` (see §4).

**142 — platform-admin SELECT + UPDATE policies on `credentials`.** The table had
only "owner reads own credentials". No platform-admin access of any kind. Needed
for the name-edit path (§5).

**143 — `GRANT UPDATE (holder_name, certificate_path)` on credentials to
authenticated.** THE 42501 FIX. 142 added the UPDATE *policy* but there was no
UPDATE *grant*, and **the grant is checked before RLS** — so the write was denied at
the grant layer and the policy was never consulted. Column-scoped on purpose (a
table-wide grant re-confers every column). This is the documented failure mode from
prior sessions: "RLS is not a grant — a missing grant produces a silent 42501."

---

## 4. UNASSIGN GUARD FOR B2C SEATS (`unassign-voucher`)

`unassign-voucher` now **refuses any voucher with a NULL `batch_id`.**

A direct seat has no batch and no company. Returning one breaks twice:
1. `'available'` means "back on the shelf" — there is no shelf, so the row becomes
   an orphan no admin surface can draw from.
2. `v_voucher_validity` resolves an unassigned seat's clock from its BATCH, so
   clearing `expires_at` on a voucher with no batch leaves it with no clock at all:
   `effective_expires_at` NULL, `days_remaining` NULL, `effective_status` reverts to
   raw. **An immortal seat** — exactly what the two-clock model exists to prevent.

The real B2C correction case (mistyped buyer email) is **revoke and re-issue**, not
unassign — which keeps the CertiGlobal refund and the replacement as two auditable
events. `revoke-credential` and `restore-credential` already exist for this.

---

## 5. CREDENTIAL HOLDER-NAME CORRECTION — built end to end

The ask: super-admin can correct the name on an issued credential (a user's Google
name isn't the name they want on the cert). **Not** a delete-and-reissue — the name
is an identity attribute attached to the decision, so it's edited in place and the
credential keeps its code, verify URL, QR, and ID.

The backend was already half-built (migration 136's `fn_audit_holder_name_change`
trigger). This session added the function and the UI.

**`update-credential-name` edge function (new).** Platform-admin only. The write
goes through `getUserClient(authHeader)` — the CALLER's JWT — not the service role,
because the 136 trigger refuses a name change when `auth.uid()` is NULL (it must be
attributable). This is **the first function that writes as the caller rather than
service-role**, which is why it's subject to RLS and why 142/143 were needed.

The trigger, when `holder_name` changes: verifies attribution, nulls
`certificate_path` (forces PDF regen), writes the audit row, and RAISES if any
decision field (score/date/cert/attempt/jta/code) changed. Proven live: a
SQL-editor UPDATE (where `auth.uid()` is NULL) is correctly refused.

**Buttons in `platform-credentials-table.tsx`:** "Edit name" (modal → the function)
and "Regenerate" (§6), beside the existing revoke/reinstate.

**KNOWN PAPERCUT (not yet fixed):** `update-credential-name`'s error handler maps
*every* 42501 to "unattributable — re-authenticate." During this session that
message sent us chasing an auth ghost when the real cause was the missing UPDATE
grant (143). Fix the message to distinguish grant/RLS denial from a genuine NULL
uid next time that function is touched. Cosmetic — the grant fix (143) resolved the
actual failure.

---

## 6. REGENERATE-CERTIFICATE — the retroactive-template lever

**`regenerate-certificate` edge function (new).** Platform-admin only, synchronous.
Rebuilds an issued certificate's stored PDF from the CURRENT `certificate.ts`
against the CURRENT `PUBLIC_SITE_URL`, with no data change. Same validity gate as
`get-credential-certificate` (a revoked/expired credential can't be regenerated).
Audited.

**Why it matters:** the certificate PDF is cached in storage. Editing the template
changes nothing on already-issued credentials until their stored copy is rebuilt.
This function is what makes a template redesign **retroactive** across every
existing credential. Without it, a redesign only applies to certs issued after the
deploy and you'd have two visual generations in the wild.

**This is the deploy path for the coming template redesign** (see §9).

---

## 7. DOMAIN FIX — certidemy.pages.dev → certidemy.com

The certification PDF and OG share image linked to the retired `certidemy.pages.dev`
(the domain before certidemy.com was bought). Root cause: the two public functions
read `PUBLIC_SITE_URL`, **which was never set as a function secret**, so both always
hit their fallback — and the fallback was the dead domain. The OG card also had the
domain **hardcoded in the SVG footer** where no env var could reach it.

Fixed:
- `supabase secrets set PUBLIC_SITE_URL=https://certidemy.com`
- `credential-og/index.ts` — env fallback + hardcoded SVG literal both → certidemy.com
- `get-credential-certificate/index.ts` — env fallback → certidemy.com
- All fallbacks now point at the LIVE domain, so a future missing secret fails to the
  right place.

**Nothing was wrong at rest.** `certificate_path` is a relative storage key
(`<uuid>/certificate.pdf`) with no domain baked in — the domain is only prepended at
render time. But the stored PDFs had the old domain in the QR verify URL, so they
were cleared (`update credentials set certificate_path = null`) to force a one-time
lazy regen. Verified: OG returns `200 image/png` with the certidemy.com footer; PDF
regenerates against certidemy.com.

---

## 8. ESM.SH BOOT FAILURE — the OG function was dying (third-party CDN)

While fixing the domain, `credential-og` started returning `503 BOOT_ERROR`. It was
NOT the domain edit. **esm.sh stopped serving a `default` export for
`@resvg/resvg-wasm@2.6.2`** — it re-transpiled the package, and
`import initWasm, { Resvg }` (a default import) threw at boot:
*"does not provide an export named default."* The module now exports
`{ Resvg, initWasm }` as named exports.

The code had been frozen and correct for months; the CDN changed underneath it. The
redeploy merely triggered the cold start that surfaced it (the log showed
boot-failures predating today's edits).

Fixed: `import { initWasm, Resvg } from "...resvg-wasm@2.6.2?target=deno"` — named
import, and **pinned with `?target=deno`** so esm.sh serves the Deno-native build and
can't re-transpile the export shape out from under the edge runtime again.

**HARDENING STILL OPEN:** `_shared/certificate.ts` imports `pdf-lib`, `fontkit`, and
`qrcode` from esm.sh WITHOUT `?target=deno`. None uses the fragile default-import
pattern, so none is broken now — but this function serves paying customers, and the
same class of CDN re-transpile could boot-fail it. Add `?target=deno` to those three
next session as cheap insurance. (`get-governance-snapshot`, `_shared/supabase.ts`,
`_shared/rag.ts`, `_shared/vouchers.ts` also import supabase-js from esm.sh but as
named/namespace imports — lower risk, sweep them too when convenient.)

---

## 9. CERTIFICATE TEMPLATE REDESIGN — designer packet ready

`certificate.ts` renders **A4 landscape, 841.89 × 595.28 pt**, pure pdf-lib + vector
QR, fonts Inter + JetBrains Mono (embedded). Fully parametric, no raster assets.

Two artifacts were produced for the designer (in outputs, hand them off together):
- `CERTIFICATE-DESIGN-SPEC.md` — page size, the 72pt=1inch rule, colour tokens, the
  field map, and the critical constraint that **three fields auto-shrink** (holder
  name 46→22pt, cert name 26→14pt, the earned line) so the design must hold at both
  extremes.
- `certidemy-cert-spec.pdf` — the current layout at true size for measuring.

**The loop:** designer builds to the spec → hands back coordinates → engineering
translates into `certificate.ts` → deploy → click **Regenerate** (§6) on each
credential → they all rebuild to the new design. The regenerate button is the last
link that makes it retroactive.

---

## 10. CERTIFICATE FILENAME FIX

Downloaded certificates were named `certificate.pdf` (the storage object key)
instead of the credential code. `CertificateDownloadButton` already built the name
from a `credentialCode` prop with a `"certificate"` fallback — but **neither call
site passed the code.** Both fixed:
- `verify/[id]/page.tsx` → `credentialCode={cred.credential_code}`
- `exam-results.tsx` → `credentialCode={loose.credential_code ?? undefined}` (the
  post-exam download, highest-traffic path)

Files now save as `AIE-I-S3EK-YYM3.pdf`, hyphens kept to match the code everywhere.
The three edge functions' signed URLs already set `download: "${code}.pdf"`; the
frontend blob-download is what makes browsers honor it.

---

## 11. OPEN ITEMS (priority order)

1. **Voucher-status pill + attempts count + Buy-Exam-Voucher CTA** — the highest-
   value feature, longest-asked, all data now exists (`get-exam-eligibility`,
   `v_voucher_validity`, `v_direct_vouchers`). One component, two states: active
   voucher shows "expires in N days" + attempts remaining; no voucher shows
   "Buy Exam Voucher → certiglobal.org". Placements: exam dashboard, my-credentials,
   AND the practice-exam entry screen (an employer-assigned learner should see their
   seat before the dashboard loads). **This is the next session's first task.**
2. **`certificate.ts` esm.sh hardening** — `?target=deno` on its three imports (§8).
   Buyer-facing; do before launch.
3. **Certificate template redesign** — packet ready, waiting on designer (§9).
4. **The `redeemed` double-writer** — `redeemed` currently means "attempts exhausted
   OR passed" (the exam scorer sets it at credential mint, and `consumeAttempt` sets
   it on exhaustion). All three redeemed vouchers carry a `credential_id`. A distinct
   `passed` terminal state is the real fix. The Direct card's status pill currently
   shows `redeemed` for a passed-but-not-exhausted seat, which is slightly
   misleading. Queued.
5. **`update-credential-name` error message** — stop mapping every 42501 to
   "unattributable" (§5).
6. Older backlog (from memory, unchanged): AISM-I / AIGRM-I Stage 9 (secure bank,
   practice backfill, translations, scheme docs, status flip); practice-pool
   backfill to ≥10/task/lang across all certs; catalog discovery UX
   (`CATALOG-DISCOVERY-SPEC.md`); governance tab; company detail page
   (`/console/companies/[id]`) predates the redesign — no proper back link, no expiry
   column, no unassign in roster.

---

## 12. TEST FIXTURES IN THE DB (wipe pre-launch)

- `SD-AI-I-V-TEST-0001` — a hand-minted B2C direct voucher, 999 attempts,
  `phazejuan@gmail.com`. Skews the console "Attempts used" total (contributes 0/∞).
- `AIE-I-V-F84K-Z5NN` — Lizeth's real B2C seat, `lizethlopezz3114@gmail.com`, passed
  AIE-I (credential `923d7bdb…`), name corrected this session. First real end-to-end
  B2C credential. `order_ref = CG-2026-0148`.
- Older credentials from prior sessions (`SM-I-V-TEST-0001`, `SD-AI-I-V-J33T-CQXM`)
  still present.

---

## 13. PROCESS LESSONS FROM THIS SESSION

**`Set-Content -Encoding UTF8` on PowerShell 5.1 writes a BOM** (`EF BB BF`), which
makes Deno edge functions fail to boot. Always write with
`New-Object System.Text.UTF8Encoding($false)` + `[System.IO.File]::WriteAllText`, and
verify first-3-bytes are `2F 2F 20` (`// `) or the expected start, never `EF BB BF`.

**.NET file methods resolve relative paths against the PROCESS working directory, not
PowerShell's `$PWD`.** After `cd`-ing between the two repos, a relative `$f` handed to
`[System.IO.File]::ReadAllText` can resolve to the wrong repo. Always use absolute
paths for the .NET calls.

**A string `.Replace()` that finds no match returns the string unchanged — silently.**
Twice this session an edit "ran" (`"edited"` printed) but changed nothing because the
multi-line anchor didn't match the file's CRLF line endings. **The only proof an edit
landed is a grep for the specific target string afterward** — not that the script ran.

**A `-notmatch` guard on a bare substring can be fooled by that substring appearing
elsewhere.** `credentialCode` matched an unrelated translation key and skipped the
real edit. Guard on the specific assignment (`credentialCode=`), not the word.

**A third-party module CDN (esm.sh) can re-transpile a package and change its export
shape**, boot-failing an unchanged edge function. Pin edge imports with
`?target=deno`. A function that dies when a CDN sneezes is a launch risk.

**`security_invoker` is stored as `on`, not `true`.** Don't test reloptions for
`=true`.

**RLS is not a grant.** The table grant is checked BEFORE RLS. A correct policy with
no matching grant produces a silent 42501. When a write 42501s and the policy looks
right, check `information_schema.role_column_grants` for the verb.

---

## 14. STATE SUMMARY

- **Migration tip: 143.** Next free: 144.
- **New functions:** `update-credential-name`, `regenerate-certificate`.
- **New secret:** `PUBLIC_SITE_URL`.
- Console redesign: **live.** Credential name-edit: **live, proven end to end.**
  Regenerate: **live.** Domain: **fixed.** OG boot failure: **fixed.** Filename:
  **fixed.**
- Both repos build green; six certs unchanged (no cert-content work this session).
- **Next session's first task: the voucher-status pill / Buy-Exam-Voucher CTA (§11.1).**
