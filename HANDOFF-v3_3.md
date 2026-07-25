# HANDOFF v3.3 (checkpoint)

**Session date:** 2026-07-25
**Supersedes:** HANDOFF-v3.2
**Migration tip:** 143 · next free number is **144** (no DB change this session)
**New edge functions this session:** none
**New function secrets this session:** none
**Deploy-state change this session:** `get-credential-certificate` is now pinned
public (`verify_jwt = false`) in `supabase/config.toml`.

---

## 1. What this session did

One feature shipped clean, and two self-inflicted production breakages on
buyer-facing paths were caught (from the browser console) and fixed.

Net:
- **§11.1 voucher-status pill + Buy-Exam-Voucher CTA is live** on all three
  surfaces. The longest-asked feature. Deployed and pushed.
- The **public certificate download** was broken mid-session by a deploy that
  dropped `--no-verify-jwt`, then fixed and pinned in config so it can't recur.
- An **esm.sh hardening sweep was reverted** — `?target=deno` regresses the
  certificate render libraries. §11.2 is reclassified from "cheap insurance" to
  "do not blanket-sweep."

No DB work. Migration tip unchanged at 143.

---

## 2. §11.1 — VOUCHER-STATUS PILL + BUY CTA — shipped

One component, `certidemy-web/components/exam/voucher-status-pill.tsx` (new),
self-contained: it fetches its own eligibility and drops onto any surface with a
cert id + a `hasCredential` boolean. Client component, calls
`get-exam-eligibility` via `@/lib/supabase/browser` (matches `mock-exam.tsx` —
NOT `@/lib/supabase/client`, which does not exist here). i18n is inlined as a
`STR` record (en / es-419 / pt-BR), ASCII-clean, matching the cross-cert home's
own convention — no JSON edits.

**Three states, resolved by CREDENTIAL EXISTENCE, never by the `redeemed` flag:**
- holds a non-revoked credential → renders nothing (the surface's own credential
  UI owns that state).
- no credential + `has_voucher` → ACTIVE: attempts (or ∞) + "expires in N days",
  with a low-days warning ≤14 (constant `LOW_DAYS`), and a "From your
  organization" badge when `source === 'partner'`.
- no credential + no seat → BUY: links to `certiglobal.org` (prop `buyUrl`,
  default `https://certiglobal.org`).

**This is the §11.4 trap fix.** `getEligibility` only reads `assigned` vouchers,
and the scorer flips a voucher to `redeemed` **on pass** regardless of attempts
left — so a learner who passed on attempt 1 of 3 comes back `has_voucher:false`.
Keying "passed" off credential existence (not the ambiguous `redeemed`) means a
passed learner sees their credential, never "buy" or "spent." Verified by reading
the actual `getEligibility` source, not assumed.

**Placements** (all confirmed against the real route tree, not guessed):
- **Exam dashboard** — `app/[locale]/(learn)/learn/[cert]/dashboard/page.tsx`.
  Already loads `credential`; pill gated on `!credential`. Full pill.
- **Practice-exam entry** — `app/[locale]/(learn)/learn/[cert]/exam/page.tsx`,
  above `<ExamLauncher>`. Added `getUser` + `loadEarnedCredential` (it loaded
  neither). This is the "employer-assigned learner sees their seat before the
  dashboard loads" surface.
- **My-credentials** — there is NO standalone route; credentials live in the
  EARNED section of the cross-cert home `app/[locale]/(app)/dashboard/page.tsx`.
  Pill rendered per in-progress card with `hideBuyWhenNoVoucher` (seat
  confirmation only — no "buy" nag on every card; the buy path lives on the exam
  surfaces). Rendered OUTSIDE the card `<Link>` (an anchor can't nest a button).

**Expiry source — `get-exam-eligibility` was extended.** The endpoint returned
attempts but no clock; the client can't read `v_voucher_validity` (service-role
only) or get partner-seat expiry from `v_direct_vouchers` (B2C only). So the edge
function now reads `v_voucher_validity` for the resolved `voucher_id` and returns
`days_remaining` + `expires_at`. Single source: learner countdown and console
roster read the same view. No change to `_shared/vouchers.ts`.

**Known tradeoff / queued:** the cross-cert home mounts one pill per in-progress
card, each fetching its own eligibility (1–3 calls for a typical learner,
fail-quiet). The proper scale fix is a `get-exam-eligibility-batch` function —
queued, not built. Not a problem at current scale.

---

## 3. THE CERTIFICATE-DOWNLOAD 401 — a deploy-flag bug, now pinned in config

**Symptom:** on the public verify page, "Descargar certificado" returned
`401 Unauthorized` (visible in the browser console as a gateway rejection of
`.../functions/v1/get-credential-certificate`).

**Root cause:** `get-credential-certificate` is public by design — its header
says `PUBLIC endpoint (deploy with --no-verify-jwt)`, it uses `getServiceClient()`,
never calls `authenticate()`, and re-checks validity itself. The 401 came from
the Supabase **edge gateway**, not the function: the `verify_jwt` flag is set at
DEPLOY time by `--no-verify-jwt`, and redeploying the function WITHOUT that flag
(which happened this session, mid-esm.sh episode) flipped a public endpoint
private. The function code was never wrong.

**Fix:** redeployed with the flag —
`supabase functions deploy get-credential-certificate --no-verify-jwt` (now live,
function version 8) — and then **pinned it in `supabase/config.toml`** so the flag
travels with the repo, not the deploy command:

```toml
[functions.get-credential-certificate]
verify_jwt = false
```

From now on a plain `supabase functions deploy get-credential-certificate` stays
public on its own. Committed (`5d4dc1e`).

**Not yet pinned:** `verify-credential` is also public (the verify page fetches it
with no auth header) but was NOT touched this session and this CLI's
`supabase functions list` does not show a `VERIFY_JWT` column to confirm its flag.
Left alone deliberately — if it ever needs pinning, confirm its current flag in
the dashboard FIRST, then add a matching block. Do not add it on inference.

---

## 4. ESM.SH HARDENING — attempted, reverted, RECLASSIFIED

v3.2 §11.2 called for adding `?target=deno` to `_shared/certificate.ts`'s
`pdf-lib` / `fontkit` / `qrcode` imports as "cheap insurance" against a future
CDN re-transpile (the class of bug that killed `credential-og` via resvg in v3.2
§8).

**This is wrong and is now proven wrong.** `?target=deno` makes esm.sh serve a
DIFFERENT build, and for these three libraries that build regresses the PDF
render — the certificate download failed after the sweep. Reverted in full
(`22ddff6`); `certificate.ts` is back to the working un-tagged imports and all
four cert functions were redeployed on the clean source.

**Reclassification:** do NOT blanket-sweep esm.sh imports on the certificate /
render path. If hardening is ever wanted, each library's Deno build must be
tested in isolation against a real rendered PDF first. resvg needed the tag
(default-import break); these three do not and regress under it. Different
libraries, different answers — there is no safe blanket transform here.

(The supabase-js imports in `_shared/supabase.ts` / `rag.ts` / `vouchers.ts` /
`get-governance-snapshot` were part of the same reverted sweep and are back to
untagged. They were never the fragile default-import pattern; leave them.)

---

## 5. COMMITS THIS SESSION

**certidemy-web** (`github.com/calicoj-dev/certidemy`):
- `ab09e08` — voucher pill + wiring on exam dashboard, home, practice-exam entry
  (§11.1). 4 files, pill created.

**supabase** (repo `github.com/calicoj-dev/certidemy-supabase`; local folder is
`supabase\` — note the remote/folder name mismatch):
- `cdd5dab` — `get-exam-eligibility` returns `days_remaining` + `expires_at`.
- `aa02de3` — esm.sh `?target=deno` sweep. **Reverted.**
- `22ddff6` — revert of `aa02de3`.
- `5d4dc1e` — pin `verify_jwt=false` for `get-credential-certificate` in
  `config.toml`.

Both repos pushed. `certidemy-web` auto-deploys to Cloudflare Pages on push (per
CERTIDEMY-REFERENCE) — the pill went live via the `ab09e08` build.

---

## 6. LIVE DEPLOY STATE (edge functions)

All cert functions are on CLEAN (un-tagged) esm.sh imports — the sweep was
reverted and the four affected functions were redeployed on clean source. No live
function runs `?target=deno` on the render path.

Relevant current versions (from `supabase functions list`):
- `get-credential-certificate` — v8, **public** (`verify_jwt=false`), clean imports.
- `get-exam-eligibility` — v6, returns expiry fields.
- `score-mock-exam` — v24, clean imports.
- `regenerate-certificate` — v3, clean imports.
- `update-credential-name` — v4, clean imports.

Deploy convention (unchanged, worth repeating — it bit this session): **deploy
from the parent `certidemy\` folder; commit from inside `supabase\`.** Running git
in the parent fails ("not a git repository").

---

## 7. CORRECTED BELIEFS / LESSONS (carry these forward)

1. **§11.2 is a trap, not insurance.** `?target=deno` breaks
   `pdf-lib`/`fontkit`/`qrcode`. Never blanket-sweep esm.sh on a buyer-facing
   render path; test each library's Deno build in isolation or leave untagged.
2. **`get-credential-certificate` publicness lives in `config.toml`**, not in
   remembering `--no-verify-jwt`. A plain redeploy without the flag (and without
   the config entry, which is now present) silently re-privatizes a public
   function and 401s the download. Same rule for any future public function —
   confirm its current flag in the dashboard first (this CLI's `list` has no
   `VERIFY_JWT` column).
3. **Buyer-facing render/auth paths get an end-to-end click before "done,"** not
   just a green build. Both breakages this session passed `npm run build` /
   deployed successfully and still broke live. The console was the ground truth
   (a `503 BOOT_ERROR` is an import/boot problem; a `401` is the auth gate — read
   which one before choosing a fix).
4. **PowerShell 5.1: `if {…} else {…}` must be on ONE line** at the interactive
   prompt — a standalone `else` line errors and the block silently doesn't run.
   This bit repeatedly; always grep-verify a patch actually landed.
5. **Removing a prop from a React component is a TS type-error at every call
   site**, not a silent runtime ignore. Delete from the interface and all callers
   in the same pass, or keep the prop.

---

## 8. OPEN ITEMS (priority order)

1. **`certificate.ts` esm.sh hardening — RECLASSIFIED, low priority.** Not a
   blanket sweep (see §4). Only worth doing per-library with a rendered-PDF test.
   Was §11.2; no longer "before launch."
2. **Certificate template redesign** — packet ready, waiting on designer
   (v3.2 §9). Unchanged.
3. **The `redeemed` double-writer** — `redeemed` means "attempts exhausted OR
   passed". A distinct `passed` terminal state is the real fix; the Direct card's
   status pill shows `redeemed` for a passed-but-not-exhausted seat. The §11.1
   pill already sidesteps this at the UI (keys off credential existence), so it is
   no longer BLOCKING — but still worth doing for the console's Direct card.
   Queued.
4. **`get-exam-eligibility-batch`** — the scale fix for the cross-cert home's
   per-card fetches (§2). Not needed at current scale. Queued.
5. **`update-credential-name` error message** — stop mapping every 42501 to
   "unattributable — re-authenticate" (v3.2 §5). Cosmetic.
6. **`verify-credential` config pin** — if desired, confirm its flag in the
   dashboard and add a `[functions.verify-credential] verify_jwt = false` block
   (see §3). Not urgent; it works.
7. Older backlog (from memory / v3.2, unchanged): AISM-I / AIGRM-I Stage 9
   (secure bank, practice backfill, translations, scheme docs, status flip);
   practice-pool backfill to ≥10/task/lang across all certs; catalog discovery UX
   (`CATALOG-DISCOVERY-SPEC.md`); governance tab; `/console/companies/[id]`
   predates the redesign (no back link, no expiry column, no unassign in roster).

**Two v3.2 done-but-not-clicked loops:**
- Lizeth's regenerated cert (name + certidemy.com QR) — looked at this session
  when the regen was tested; treat as closed unless a fresh eyeball is wanted.
- Post-exam filename (only triggers on a real pass) — still open; needs one
  end-to-end exam pass to confirm.

---

## 9. FILES TOUCHED THIS SESSION

**Created:**
- `certidemy-web/components/exam/voucher-status-pill.tsx`

**Modified (certidemy-web):**
- `app/[locale]/(learn)/learn/[cert]/exam/page.tsx` (added getUser +
  loadEarnedCredential + pill above launcher)
- `app/[locale]/(learn)/learn/[cert]/dashboard/page.tsx` (pill under header,
  gated on !credential)
- `app/[locale]/(app)/dashboard/page.tsx` (pill per in-progress card,
  hideBuyWhenNoVoucher)

**Modified (supabase):**
- `functions/get-exam-eligibility/index.ts` (expiry fields from
  v_voucher_validity)
- `config.toml` (verify_jwt=false pin for get-credential-certificate)
- `functions/_shared/certificate.ts`, `_shared/supabase.ts`, `_shared/rag.ts`,
  `_shared/vouchers.ts`, `functions/get-governance-snapshot/index.ts` — touched
  by the esm.sh sweep and **reverted** (net-zero; back to their v3.2 state).

---

**End of checkpoint v3.3.** Next session starts at migration 144. The highest-
value open item is now the designer-blocked certificate template (2) and, for
console correctness, the `passed` terminal state (3). Everything buyer-facing
that broke this session is fixed and, where it was a deploy-flag problem, pinned
so it can't recur.
