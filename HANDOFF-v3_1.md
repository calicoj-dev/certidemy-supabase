# HANDOFF v3.1

**Session date:** 2026-07-23/24
**Supersedes:** HANDOFF-v3.0 (written mid-session; this continues it)
**Migration tip:** 138 · next free number is **139**
**Conformance:** six certs, **29/29/29/29/28/28 pass, 0 fail, 0 warn**

---

## 1. Where this picked up

v3.0 closed the prevention-layer work. Everything after it is **the voucher and
commercial layer** — plus one nav bug that turned out to be the fourth instance
of a single bad constant.

The through-line: Certidemy's backend now models the full seat lifecycle
correctly. **Almost none of it has a UI yet.**

---

## 2. THE COMMERCIAL MODEL — read this first

This was clarified mid-session and it reframes several things.

**Certidemy is free.** Sign up, study every lesson, take unlimited practice and
simulation exams. Nothing on this platform is sold.

**Certification is purchased on certiglobal.org** — a separate platform with its
own database. Both individuals and partner organizations buy there. A Certidemy
platform admin then issues the corresponding seats here.

Consequences that are easy to get wrong:

- The payment record and the voucher it paid for live in **two systems with no
  shared key**. `vouchers.order_ref` (B2C) and `seat_batches.invoice_ref`
  (partner) are the only threads across that boundary.
- `certifications.price_usd` is misleading — Certidemy sells nothing. It appears
  only in `scripts/ingest`, never rendered. Left alone.
- This belongs in the scheme documents. An auditor reading §3 Eligibility will
  ask how a candidate becomes eligible to sit, and "they buy a seat on
  certiglobal.org" is the answer. It also cleanly separates the free training
  from the certification decision, which is a good look under 17024.

---

## 3. THE TWO-CLOCK MODEL (migrations 136, 137)

| clock | governs | value |
|---|---|---|
| **batch** `expires_at` | whether a seat can be **assigned** from it | 12 months from purchase |
| **voucher** `expires_at` | whether an assigned seat can be **redeemed** | 6 months from assignment |

**The voucher clock is independent once assigned.** 136 originally resolved
effective expiry as `LEAST(voucher, batch)` — 137 corrected it. A seat handed out
in month 11 of a 12-month batch keeps its full six months, because the batch date
is a commercial term between Certidemy and the partner, while the voucher date is
a commitment to the candidate. Neither of them signed the invoice.

Tail is bounded: last assignable day is 364, plus six months, so **no seat
outlives 18 months from purchase**.

`v_voucher_validity` resolves all of this — `effective_expires_at`,
`effective_status` (reports `expired` while the stored status still reads
`assigned`), `days_remaining`, and `can_unassign`. **Read the view, not
`vouchers.status`, anywhere a human sees the state.**

---

## 4. What shipped

### `supabase` (tip 138)

| commit | what |
|---|---|
| `ec4ed1a` | **retake block fix** — the double-assign guard refused a new seat to anyone whose email held a voucher in status `assigned`/`redeemed`/`available`. But `redeemed` means EXHAUSTED (`consumeAttempt` flips it when the allowance runs out), so it was refusing a seat to precisely the person who needs one: someone who used their attempts and wants to buy more. New rule: block only an `assigned` voucher **with attempts remaining**. `hasUsableVoucherByEmail` in `_shared/vouchers.ts` reuses `resolveAllowance` and reads ATTEMPTS, not status. |
| `c3a36f9` | **136** — `vouchers.expires_at`; `credentials.holder_name` correctable but audited; the certification DECISION made immutable |
| `1b5b1a2` | **137** — two clocks; `seat_batches.expires_at` defaults to 12 months |
| `5af05fb` | expiry **enforced**: `assign-voucher` stamps it, `getEligibility` rejects expired (so `consumeAttempt` and exam start are covered). NEW **`unassign-voucher`** |
| `7be11a5` | **138** — `vouchers.order_ref`; **B2C direct-issue path**; fixed `unassign-voucher`'s role check |

### `certidemy-web`

| commit | what |
|---|---|
| `63ff225` | **deleted `DEFAULT_CERT_CODE`** — see §6 |
| *(rail fix)* | the cert label above the nav renders only when a cert exists |

---

## 5. `unassign-voucher` — the guard that matters

Returns an **assigned, unused** seat to the batch pool. A partner buys ten seats,
assigns five, one person leaves before sitting the exam — without this that seat
is dead.

**`attempts_used` must be 0.** Assign → sit → unassign → reassign would otherwise
be unlimited attempts on a single purchased seat, straight through the published
cap, and the exposure math behind that cap assumes a bounded number of sittings
per candidate. A seat that has been sat on is spent. This also matches the real
case: the person who left never took the exam.

Unassigning **clears** the clock rather than carrying it — the next holder gets a
fresh six months, still bounded by the batch's assignability window.

**Not revocation.** `available` = back on the shelf. `revoked` = pulled and spent
against the batch. Different commercial meanings; the roster should show them
differently.

---

## 6. The fourth bug from one constant

A brand-new user with zero enrollments saw **SM-AI-I** above the nav, five links
into `/learn/sm-ai-i/*`, and — on clicking one — an offer to enroll in a
certification they never chose.

Both app shells fell back to `getDefaultCert()`, and the last-resort literal was
`"sm-i"`, a legacy code that only resolves through the alias map.

`DEFAULT_CERT_CODE` had already caused three bugs, each fixed in isolation — the
comments are still in `lib/console/readiness.ts`, `lib/console/roster.ts` and
`components/app/cert-switcher.tsx`. **Deleted entirely.** `certCode` is
`string | null` through `AppShell`, `AppRail`, `AppBottomBar`, `CertSwitcher` and
`useNavModel` (returns `[]` when null). TypeScript found the one consumer that
had been missed.

A default certification is only correct when the user has exactly one — and then
it isn't a default, it's their cert.

---

## 7. IN FLIGHT — finish this first

**`IssueDirectModal`** is written and sitting in `/mnt/user-data/outputs/issue-direct-modal.txt`
(re-generate if lost). It needs pasting into
`certidemy-web/components/console/admin-allocations.tsx` and wiring:

1. paste the component into the file (it uses that file's existing `Modal`,
   `Field`, `inputCls`, `primaryBtn`, `successBoxStyle`, `errorBoxStyle`,
   `invokeFn`)
2. widen the modal state: `useState<"company" | "batch" | "direct" | null>` — line ~423
3. add a third header button next to "New company" / "Add batch" — lines ~447-462
4. render `{modal === "direct" && <IssueDirectModal certs={certs} onClose={() => setModal(null)} />}`
5. `npm run build`, commit, push (deploy is automatic)

**The B2C path has never been called end to end.** This modal is what proves it.

---

## 8. The console redesign — MOCKUP APPROVED, NOT BUILT

The current admin allocations screen lists **batches** flat, sorted by creation.
Fine at five rows, unusable at two hundred, and it shows the wrong primary
object: one partner with six batches looks like six customers.

Approved design:

- **Companies are the object, batches are detail.** One card per company;
  invoice refs as secondary text. Batch detail lives on the company page.
- **Seats and attempts get SEPARATE meters, never one number.** `6 of 20 seats
  assigned` and `9 of 40 attempts used` are different facts about different
  resources. Never leave the unit implicit.
- **Idle seats** as a headline metric and the default sort — paid-for inventory
  nobody is using is the commercial signal, and it's currently invisible.
- **Unlimited renders as ∞**, not a filled bar.
- **Direct** is its own card with a dashed border — visibly not a company.
- Status pills carry exceptions only ("14 seats idle", "fully assigned").
- **Company name is a link and clicks THROUGH** to `/console/companies/[id]` —
  Juan's call, because a roster can be extensive. Back navigation must be easy.

Also missing today: **nothing aggregates `attempts_used` at batch level**, so a
partner cannot see consumption at all. `v_batch_quota` has seats but no attempts.

---

## 9. Queue

**UI, all backend-complete:**

1. **[IN FLIGHT]** Issue-direct modal — §7
2. Partner list redesign — §8
3. Company detail page `/console/companies/[id]`
4. **Unassign action** in the partner roster (`roster-table.tsx`) — calls
   `unassign-voucher`, show only when `can_unassign`
5. **Expiry display** — learner dashboard (a learner cannot currently see they
   hold a voucher or when it dies; `get-exam-eligibility` already returns it),
   partner roster ("expires in N days", expired state), seats page
6. **Holder-name edit** console action — must call through as the admin so
   `auth.uid()` exists; the 136 trigger refuses an unattributable change
7. Seats/attempts labels + attempts aggregation

**Decisions Juan owes:**

8. **Attempt cap.** Default is 6/12mo on every cert. `select * from
   v_exam_exposure where language='en'` shows what each cap costs. SD-AI-I at 6
   is **78% bank exposure** and needs ~17 secure items/task/lang (has 8) to hold
   that honestly; at 3 it's 53% and defensible today. Caps can differ per cert —
   AISM-I at 4 is 51%. Options: (A) 3 now, no work; (B) 6 after a
   `SECURE_PER_TASK=16` generator run; (C) 6 as-is, documenting the risk.
9. **Re-examination policy text into the six scheme docs** — blocked on 8. This
   is a real 17024 gap: no scheme document publishes a retake policy.

**Verification:**

10. **Live claim test** — sign up as `new.hire@acmetest.co` (matches
    `SM-I-V-PEND-0006`) and confirm the roster flips `pending → active`. The
    claim trigger (migration 072) is committed and wired but has never fired in
    production; all three pending vouchers belong to emails that never signed up.

**Carried:**

11. JTA narrative extraction into `<CODE>_JTA_narrative.md`, then archive the
    banner'd originals. Careful work — that reasoning cannot be regenerated.
12. Practice pool backfill to ≥10/task/lang.
13. Mastery→score recalibration (blocked until real attempts exist).
14. Level II generator rewrite (best-of-four-plausible model).

---

## 10. Decisions worth not relitigating

**Bundles are not a first-class entity.** A voucher grants access to one exam
because a credential is per-certification — that's what 17024 assesses. A bundle
is a purchase-time concept with no ongoing meaning; once bought you have three
vouchers, and every downstream question is per-cert anyway. Group them with a
shared `seat_batches.invoice_ref`. Admin issues one by one; bundling is a
CertiGlobal sales mechanic.

**`redeemed` does not mean "passed."** `consumeAttempt` flips a voucher to
`redeemed` the moment its allowance is exhausted. Two live vouchers have a status
that doesn't match their usage (set outside `consumeAttempt`), which is why
`hasUsableVoucherByEmail` reads attempts rather than status.

**The certification decision is immutable; the holder's name is not.** Score,
issue date, certification, attempt, JTA version, credential code — the 136
trigger raises on any edit. The name is an identity attribute attached to the
decision, not part of it; correcting a typo is audited and clears
`certificate_path` so the stored PDF regenerates.

---

## 11. Process notes from this stretch

**`WriteAllLines` changes line endings to CRLF; `WriteAllText` preserves them.**
Mixing them mid-sequence broke every `\n` anchor in a follow-up patch and
silently shipped a broken `assign-voucher` — the guard verified the anchors
matched, not that the result was valid. **After a code edit, parse it.** For edge
functions the deploy itself is the parse check (Deno rejects invalid syntax), so
deploy before assuming.

**PowerShell here-strings eat `<`.** `): Promise<` became `): Promise` in a
written file. Build such characters from `[char]0x3C`, or avoid multi-line
generics.

**A here-string closer `'@` must be at column 0** — indenting it inside an
`if { }` block hangs the parser waiting for input.

**Check the real enum values.** `team_members.role` is `team_admin` /
`team_member` — no `owner`, no `admin`. A deployed function checked for the wrong
two and would have 403'd every partner admin.

**`CREATE OR REPLACE VIEW` cannot insert a column mid-list.** Drop and recreate,
after verifying nothing depends on it.
