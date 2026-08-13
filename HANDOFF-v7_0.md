# HANDOFF v7.0 — First paying customer, and the two defects that nearly cost him

**Session date:** 2026-08-12 (launch day)
**Supersedes:** HANDOFF-v6.9

**Migration tip 207, next free 208 — unchanged. No DDL this session.**
**supabase `272c2a0` + the config-pin commit. certidemy-web `74fa417` — untouched.**

**Certidemy issued its first real credential to a paying customer: `SM-AI-I-ZZMV-JPC8`.**

Both defects found today were **silent state changes with nothing watching**. Neither
appeared in a build, a test, a deploy log or the console. One was found by the
customer; the other by clicking. That is the through-line of the session and the
reason for §6.

---

## 1. What happened, in order

CertiGlobal issued two SM-AI-I seats to `julio.ingmec14@gmail.com` (the seats were
comped; he is the first real B2C candidate). He sat the exam in **es-419**, scored
**98.75% (79/80)** against an 80% pass mark, and was shown a pass.

No credential appeared. Not on his screen, not in `/console/credentials`, which read
**0 total** — across the whole platform.

Assuming the pass had not registered, he started a second attempt. It ended at 25%
with 55 items blank, and he reported an application error mid-exam. That second
sitting consumed his remaining seat.

The reported error string was the Spanish Next.js client-exception message. The
initial hypothesis was Chrome's page translator mutating the DOM under React — a real
failure mode, and **wrong here**. See §4.

---

## 2. DEFECT 1 — the credential mint had never worked since Open Badges 3.0 landed

### Root cause

`public.credentials` carries two columns that are **NOT NULL with no default**:

```
issuer_id      NO   null
subject_salt   NO   null
```

`score-mock-exam`'s mint insert wrote neither. Postgres raised 23502 on every
passing certification exam. Every *other* column the OB3 migration added carries a
default (`status_list_index` → `nextval`, `material_updated_at` → `now()`,
`is_specimen` → `false`); these two do not.

**Adding a NOT NULL column does not fail the writers that predate it until one of
them runs.** Minting requires actually passing an 80-question secure exam, so nothing
ran it until a customer did.

`mint-specimens.mjs` — the other writer to that table — was written *after* the
columns existed and sets both. It passed, and gave false comfort.

### Why nobody was told

```js
if (cErr) {
  console.error("credential issuance failed:", cErr);
}
```

The insert error was caught, logged to the function console, and the function
returned **200** with `credential_pending: true`. The attempt row was written, the
session closed, the voucher kept an attempt in reserve, and the candidate was told he
passed. Nothing retried, nothing alerted, nothing reconciled.

**This swallow is the more serious half of the defect.** The two columns are a
one-time schema drift. The catch would have hidden the next one identically.

### The second-order damage

Because the mint failed, the voucher stayed `assigned` with one attempt left.
`getEligibility` reads exactly that, so the system offered him a second sitting.
Had the mint succeeded, the scorer would have flipped the voucher to `redeemed`
on pass and the second attempt would have been impossible.

**The burned seat traces to the same root cause, not to the client error.**

### The fix

`supabase/scripts/patch-score-mock-exam-ob3.mjs` — five anchored edits:

1. declares `credential_error` beside `credential_id` / `credential_code`
2. resolves the active issuer (`is_active = true`, **never hardcoded** — `issuers` is
   a table so a whitelabel issuer can exist without a code change) and generates
   `subject_salt` (16 random bytes, hex)
3. writes `issuer_id` + `subject_salt` on the insert
4. records the insert error into `credential_error` instead of only logging it
5. returns `credential_error` to the caller

`subject_salt` has **no cross-system encoding constraint**: `hashSubjectIdentifier`
is `sha256(email.trim().toLowerCase() + salt)` and the salt is *published* beside the
hash in the holder's document. It needs randomness, not secrecy — it stops one
rainbow table covering every credential, and per-credential means confirming a
guessed address on one tells you nothing about any other.

### The remedy for Julio

**Not a re-sit.** The decision was made by the engine, recorded in `exam_attempts`,
and stamped with the JTA version it was assessed against. Only the artifact failed to
write. Issuing against the existing `exam_attempt_id` is correct and 17024-defensible.

**Not a hand-INSERT either.** `credential_code`, `expires_at`, `locale`,
`jta_version_id`, `issuer_id`, `subject_salt` and `status_list_index` must all come
from one code path or the result verifies as Valid on `/verify` and fails as an OB3
badge.

`supabase/scripts/mint-missing-credentials.mjs` mints for every passed attempt that
has no credential, with deliberate fidelity to the original mint:

| field | source | why |
|---|---|---|
| `issued_at` | the attempt's `submitted_at`, **not** `now()` | the credential is dated when the person earned it; issuing it today would misstate the record and push expiry out by the length of our own outage |
| `expires_at` | `issued_at + validity_days` | days, not years — `getFullYear()+1` on 29 Feb silently rolls to 1 Mar |
| `locale` | `exam_session_items.language` | the language of the FORM as served, never a request-body claim |
| `holder_name` | `certificate_name` → `full_name` → email → placeholder | same order as the scorer |
| `jta_version_id` | carried from the attempt | re-resolving would stamp today's published JTA onto an exam sat against an earlier one |

Voucher linked; **status and `redeemed_at` deliberately left alone** — the voucher
already read `redeemed` for a different reason (attempts exhausted at
`00:12:37`), and rewriting `redeemed_at` would destroy the record of when that
happened.

**KNOWN DEBT:** the reconciler duplicates the scorer's mint block. Two copies of one
rule can diverge. Kept separate on purpose — the scorer must not grow a
reconciliation path — but if the mint shape changes, both change.

---

## 3. DEFECT 2 — all four OB3 identifier URLs were 401 to the outside world

Found immediately after the mint, on the badge panel: check 1 (fetch the credential
document) green, check 2 (resolve the issuer) red.

An anonymous fetch of `https://certidemy.com/issuer` returned **401**. So did
`/achievements/SM-AI-I`, `/credentials/<code>` and `/status/1`.

A 401 is the **Supabase gateway rejecting the call before `open-badge` runs** — the
function's own failure paths return 400/404/503/500 and never 401.

It looked green in the browser only because the `/credentials/[code]` proxy forwards
the caller's session token (it must — that is how the holder receives the subject
identifier). An authenticated developer sails through the gate. Every external
verifier does not.

### Root cause

`verify_jwt` **defaults to true**. `open-badge` was deployed once with
`--no-verify-jwt`, worked, was tested, and was silently re-privatized by a later
redeploy that did not carry the flag.

**`config.toml` already documented this exact trap**, in the comment block above
`[functions.get-credential-certificate]` — written after the same thing took the
public certificate download in v3.3. That function was pinned. Nothing swept the rest.
`open-badge` was the next one bitten.

Note also: the anon key *is* a valid JWT to the gateway, so a 401 means the proxy
route sent **no** `Authorization` header at all. The pin is the durable fix either
way — a public credential endpoint must survive a caller who has no key, because that
caller is every external verifier.

### The fix

`supabase/scripts/patch-config-open-badge-pin.mjs` appends one block:

```toml
[functions.open-badge]
verify_jwt = false
```

Safe by design: `open-badge` authenticates itself — it reads the bearer token, calls
`auth.getUser`, and treats a failed lookup as "not the holder". The whole
viewer-dependent split (public document vs holder document carrying the salted
identifier) is written on the assumption that anonymous callers reach the function.
Gateway JWT checking does not harden that; it removes the public half.

### After the fix

```
PASS  issuer       200  application/vc+ld+json  510B
PASS  achievement  200  application/vc+ld+json  49517B
PASS  credential   200  application/vc+ld+json  54970B
PASS  status       200  application/vc+ld+json  946B
```

All six checks in the badge panel green, including **firma: auténtica** and
**53 competencias alineadas**. The 49KB Achievement is the payload nobody else ships:
every task with K/S/A, domain weight and Bloom level.

---

## 4. What the client-side error was NOT

The mint told us `locale: es-419`. **He sat the exam in Spanish, on a Spanish page.**
A Spanish speaker on Spanish chrome gets no Chrome translate prompt, and the string he
reported is Next.js's own localized client-exception message.

The translate theory is now weakly supported at best. The stronger candidate: the
scorer returned `credential_id: null` with `credential_pending: true`, and the
pass-results screen hit a path that assumes a credential exists — producing an
exception exactly where he was looking for his certificate.

**Unresolved. Read `exam-results.tsx` around the credential block before building any
translate warning.**

Also from the attempt telemetry: attempt 2 shows `answers_from_client: 80`,
`finalized_server_side: false` — his browser was alive and posted a full form at the
timer. The crash did not kill that submission.

And a correction recorded so it is not re-derived: `duration_seconds = 7200` with
`late_submission = false` is **correct**. SM-AI-I is a 120-minute exam and the check
is `120*60 + 60s` grace. This was briefly and wrongly flagged as a bug.

---

## 5. The credential

| | |
|---|---|
| Code | **`SM-AI-I-ZZMV-JPC8`** |
| Id | `3313e024-cb70-4a3a-80ec-a4c35834e2ee` |
| Holder | Julio M Rodriguez Perez |
| User | `4406bb9f-8378-4aa5-a273-b91f3bf6ce3f` |
| Attempt | `616a240f-a9e2-45d2-b67e-41aa478a5344` — 98.75%, 79/80, 0 unanswered |
| Locale | `es-419` |
| Issued | 2026-08-12T21:20:32.906Z (= the attempt's `submitted_at`) |
| Expires | 2027-08-12 (365d) |
| Issuer | `b2b35e1e-fb05-484d-9065-5deeb400492a` — Certidemy, `key-1` |
| Voucher | `SM-AI-I-V-6BBH-YSW8` / `16e68521-…` — 2 of 2, `redeemed`, now linked |

**The trailing period was caught in the dry run.** `profiles.full_name` held
`Julio Miguel Rodriguez Perez.`; `certificate_name` was set to
`Julio M Rodriguez Perez` before applying. The dry-run holder line exists for exactly
this — that string is snapshotted permanently at mint.

**Learner-side reachability confirmed by reading the code:** `loadEarnedCredential`
returns the row → `<CredentialSeal>` renders in the `/learn/sm-ai-i/dashboard` header
→ links to `/verify/{credential.id}`. Voucher pill suppressed, unenroll hidden.
Note the seal links by **UUID**, not code; both resolve, but hand-sent links should
use the code — it matches the PDF and is typeable.

**Customer verdict:** rigorous, comparable to what he had sat before, slightly longer,
"similar questions but with AI." Sat entirely in Spanish. Ask for a quotable sentence
and permission to use it.

---

## 6. Invariants earned — both would have caught their defect before a customer did

**Check 37 for `verify-cert`. A passed attempt with no credential is a
contradiction.**

```sql
select ea.id, ea.user_id, ea.certification_id, ea.score_pct, ea.submitted_at
from public.exam_attempts ea
left join public.credentials c on c.exam_attempt_id = ea.id
where ea.passed = true
  and c.id is null;
```

Returned Julio before the fix. Returns zero rows now. **Not yet added to
`verify-cert.mjs`.**

**`supabase/scripts/check-ob3-endpoints.ps1`** fetches all four identifier URLs
anonymously — no session, no cookies, no key — and requires 200 +
`application/vc+ld+json`. That is the only test that means anything here: the panel
passed its first check in a logged-in browser while `/issuer` was 401 to everyone else
on earth. **Belongs in `CERT-PUBLISH-CHECKLIST.md`.**

---

## 7. What shipped

### `supabase`

| commit | what |
|---|---|
| `272c2a0` | `score-mock-exam` mint fix (`issuer_id` + `subject_salt`) + `credential_error` surfaced instead of swallowed + `mint-missing-credentials.mjs` |
| *(config pin)* | `[functions.open-badge] verify_jwt = false` + `check-ob3-endpoints.ps1` — **confirm this landed; the commit output was not observed** |

### `certidemy-web`

Untouched this session.

### Files created

- `supabase/scripts/mint-missing-credentials.mjs` — committed
- `supabase/scripts/check-ob3-endpoints.ps1` — committed with the pin
- `supabase/scripts/patch-score-mock-exam-ob3.mjs` — **gitignored, not committed**
- `supabase/scripts/patch-config-open-badge-pin.mjs` — same

**`scripts/patch-*.mjs` is caught by `.gitignore`.** Patch scripts are the audit trail
of what changed in a file and why; the reasoning in their headers is not recoverable
from the diff. Decide deliberately whether to `-f` them or move them to a tracked
path — right now the record of both of today's fixes lives only on Juan's disk.

---

## 8. Rules earned today

**A migration that adds a NOT NULL column with no default silently breaks every
writer that predates it.** Before such a migration ships, grep every
`.from("<table>").insert(` across both repos. Nothing fails at migration time; it
fails the next time a writer runs, which for the mint path meant a paying customer.

**A public edge function must be pinned in `config.toml`, never made public by a
deploy flag.** The flag is a property of one command; the pin is a property of the
repo. Second occurrence of this exact failure. `config.toml`'s own comment said so
months ago — it just needed applying to the rest.

**Catching an error and returning 200 is worse than throwing.** The mint failure
produced a green response, a closed session, a written attempt and a live voucher.
Where the enclosing transaction cannot be rolled back, the failure must reach the
caller as data (`credential_error`) and something must reconcile it.

**Proof of one property is not proof of another.** Specimens minted fine, which
proved the table was writable and proved nothing about the scorer. The badge document
fetched fine, which proved the credential existed and proved nothing about the issuer
being resolvable.

**Test as a stranger.** Every surface in this session looked healthy from an
authenticated browser. The only signal came from fetching with no session at all.

**Read the schema before theorising about the symptom.** The first hypothesis here
(Chrome translate) was plausible, had precedent, and was wrong. The column list
settled it in one query.

---

## 9. Open items

**From this session:**

1. **Re-issue Julio's second seat.** `SM-AI-I-V-6BBH-YSW8` is spent 2/2. That sitting
   was consumed by our defect, not by a candidate. `assign-voucher` blocks only on an
   `assigned` voucher with attempts remaining, so a fresh one will go through.
2. **Confirm the config-pin commit landed** (§7).
3. **`exam-results.tsx`** — read the credential block; render `credential_error`
   honestly ("your result is recorded, your credential is being issued") rather than
   blank or crashing. Likely the real source of his client exception.
4. **Pin `verify-credential` and `credential-og`.** Both public, both currently
   passing, **neither pinned** — one deploy from repeating §3 on the public verify
   page a recruiter lands on. Do it as its own deliberate change.
5. **verify-cert check 37** (§6) into `verify-cert.mjs`.
6. **`check-ob3-endpoints.ps1`** into `CERT-PUBLISH-CHECKLIST.md`.
7. **`translate="no"` on the exam surface** — `<html translate="no">`,
   `class="notranslate"`, `<meta name="google" content="notranslate">`. The integrity
   argument stands on its own (three languages of record; machine-translating a live
   item is an examination-integrity problem) even though it was not this incident's
   cause. Belongs in the scheme doc.
8. **Server-side finalisation on timeout.** `generate-mock-exam` consumes the voucher
   attempt at START. Any client-side crash currently costs a paying candidate a seat
   with no recourse. Answer autosave exists (migration 164); the timeout finaliser
   does not.
9. **No pass email.** A passing customer received no notification with his credential
   code and verify URL. That single email would have made this whole incident a
   non-event.
10. **No learner-facing credentials index.** The only route to a credential is the
    seal inside that cert's learning silo. Fine at one cert; the passer's instinct is
    "where's my certificate", not "back into the Scrum Master dashboard" — which is
    close to the sentence Julio actually said. A `/my-credentials` route is now
    evidence-backed, not speculative.

**Carried:**

11. AIMS-IA Stage 9 — item generation not started (v6.9).
12. ISMS-IA — L2 generator blockers, session-timeout verification before publish.
13. AIGRM-I Stage 9 — secure bank, practice backfill, translations, scheme doc, status
    flip.
14. GHL live push verification → inbound provisioning.
15. Advertising vendor-enable console panel (SQL-only today).
16. CertiGlobal checkout webhook — campaign launch blocker.
17. Practice-pool backfill to ≥10/task/lang where still short.

---

## 10. State summary

- **Migration tip 207. Next free 208.** No DDL this session.
- **Eleven certifications; ten `available`, AIMS-IA `draft`.**
- **One real credential exists**, held by a paying customer, verifying end to end:
  `/verify` Valid, PDF renders, JTA opens, language switch works, all six OB3 checks
  green with an authentic signature.
- `score-mock-exam` is **fixed but unproven in production** — it parsed at deploy,
  which is not the same as working. Run check 37 after each of the first several
  certification exams. If it ever returns a row, `mint-missing-credentials.mjs`
  closes it in one command while you diagnose.

---

**End of checkpoint v7.0.** Launch day. First sale, first credential, two latent
defects closed that would have hit every subsequent customer — one of which had been
broken since Open Badges 3.0 shipped and had never issued a single credential.
