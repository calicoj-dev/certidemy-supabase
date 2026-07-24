# CONSOLE-REDESIGN-SPEC.md

**Surface:** super-admin console — the partner/seat management screen
**Component today:** `certidemy-web/components/console/admin-allocations.tsx`
**Status:** approved from a mockup, not built
**Written:** 2026-07-24

---

## Why the current screen is wrong

It lists **seat batches** flat, sorted by creation date.

1. **Wrong primary object.** A batch is an invoice line item. The admin's mental
   model is *who are my customers and what do they have*. One partner with six
   batches currently renders as six rows and reads as six customers.
2. **Two resources conflated into one number.** "2/10 used" next to a "2
   attempts" badge — is 10 seats or attempts? Seats (people) and attempts
   (sittings) are different resources with different meanings.
3. **No scale story.** Sorted by creation, no search, no grouping. Fine at 5
   rows, unusable at 200.
4. **No commercial signal.** Nothing surfaces idle inventory or near-exhaustion.
5. **Company name is not a link** — no drill-down affordance at all.
6. **Direct (B2C) seats have no home** — they belong to no company and appear
   nowhere.

---

## The model

| unit | is | lives in |
|---|---|---|
| **allocation** | what a partner bought | `company_certifications.seats_allocated` |
| **batch** | one purchase, with terms | `seat_batches` (+ `invoice_ref`, `attempts_per_seat`, `expires_at`) |
| **seat** | one person's entitlement | one `vouchers` row |
| **attempt** | one sitting | `vouchers.attempts_used` / resolved allowance |

**A company owns batches. A batch holds seats. A seat carries attempts.**

The screen aggregates to **company**, then breaks down by **certification**,
because a partner buying SM-AI-I and AIGRM-I has two different populations.

---

## Layout

### Header

Left: `Partners` (h2) with a subtitle — `4 companies · 1 direct channel`.

Right, three buttons: **Issue direct** · **New company** · **Add batch**.
(`Issue direct` already exists as `IssueDirectModal`.)

### Summary strip — four metric cards

`background: var(--color-surface-lift)`, no border, radius, ~12px 14px padding.
12px muted label above, 22px/500 number below.

| card | value | note |
|---|---|---|
| Seats sold | total seats across all batches | |
| Assigned | `n` + a muted `64%` | assigned ÷ sold |
| Attempts used | `57` + muted `/ 128` | **this data does not exist yet — see Gaps** |
| **Idle seats** | count, in warning colour | sold − assigned. The commercial signal. |

### Controls

A search input (`Search company, invoice, or email`) and a sort select:
**Most idle first** (default) · Recently added · A–Z.

Idle-first is the default because unassigned paid-for inventory is the thing an
admin can act on.

### Company card — one per company

`var(--color-surface-lift)`, 0.5px border, 12px radius, ~14px 16px padding,
10px gap between cards.

**Header row:**
- Company name, 15px/500, in `var(--color-accent-deep)` or equivalent link
  colour, and it **is a link** to `/console/companies/[id]`
- Secondary text, 12px muted: `2 batches · INV-2291, INV-2402`
- Right-aligned status pill, **only when there is an exception**:
  - `14 seats idle` — warning tint
  - `attempts nearly exhausted` — warning tint
  - `fully assigned` — success tint
  - nothing at all when unremarkable

**Body — a row per certification**, grid `88px | 1fr | 1fr`, 10px/16px gap:

| column | content |
|---|---|
| cert code | mono, 12px, muted — `SM-AI-I` |
| seats meter | label row `Seats assigned` / `6 of 20`, then a 5px bar, accent fill |
| attempts meter | label row `Attempts used` / `9 of 40`, then a 5px bar, success fill; warning fill above ~85% |

**Never render a number without its unit.** `6 of 20 seats assigned` and
`9 of 40 attempts used` are separate facts and must read as separate facts.

**Unlimited attempts** render as `unlimited` in the label and a centred `∞`
where the bar would be — never a filled bar, because you cannot fill a bar to
infinity and pretending otherwise misleads the partner about their own terms.

### Direct card — last, visually distinct

Dashed border (`border: 0.5px dashed var(--color-border-strong)`), same radius
and padding.

- Title `Direct`, with muted `B2C — no company`
- Right: `7 vouchers issued`
- One line of body copy: *Individually issued seats. No batch, no seat pool —
  attempts set per voucher at issue.*
- Clicks through to a filtered list of direct vouchers

It is deliberately **not** styled as a company. There is no counterparty.

---

## Company detail page — `/console/companies/[id]`

Click-through rather than inline expansion: a roster can be long, and expanding
one company inside a list of forty is worse than navigating.

**Requirements:**
- Obvious back link to `/console` — top-left, labelled `Partners`, not a bare
  chevron
- Company name as page title, with invoice refs and contract dates
- Batches table: seats, terms, invoice ref, **expiry**, seats used/available
- Roster (reuse `roster-table.tsx`) with per-seat state, holder, expiry, and
  the **unassign** action
- `get-company-detail` already exists and returns much of this

---

## Gaps this design exposes

**1. Attempts are not aggregated anywhere.** `v_batch_quota` has `seats`,
`seats_used`, `seats_available` and `attempts_per_seat` — but nothing sums
`attempts_used` at batch or company level. The "Attempts used" card and the
attempts meters need a view or a rollup that does not exist yet. **Build this
first**; the UI cannot show what the data layer cannot answer.

**2. Expiry is not surfaced.** `v_voucher_validity` (migration 137) resolves
`effective_expires_at`, `effective_status` and `days_remaining`. The roster
should show `expires in N days` and an `expired` state distinct from `revoked`.

**3. Unassign has no button.** `unassign-voucher` is deployed. Show the action
only when `v_voucher_validity.can_unassign` is true — false the moment
`attempts_used > 0`, because a sat-on seat is spent.

---

## Design rules to hold

1. **Companies are the object; batches are detail.**
2. **Never leave a unit implicit.** Always `N seats` or `N attempts`.
3. **Seats and attempts never share a meter.**
4. **Unlimited is ∞, never a full bar.**
5. **Status pills carry exceptions only** — if everything is fine, the eye should
   skim past.
6. **Idle inventory is the headline**, because it is the number an admin can act
   on.
7. **Direct is not a company.** No fake "Certidemy Direct" partner row — it would
   pollute partner reporting and invent a counterparty that does not exist.
