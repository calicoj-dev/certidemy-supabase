# HANDOFF-v5.1.md

**Previous:** HANDOFF-v5.0.md
**Migration tip:** 170 · **next free number: 171**
**Session date:** 3 August 2026
**Repos touched:** both

v5.0 covered the certificate redesign and the first perf fix. Everything below
happened after it, in one long session: the perf work finished, a live data bug
that was feeding a wrong marketing audience, three People-page features, the
certificate-name gap, and a theme bug that only showed on a screen you see when
you pass an exam.

---

## 1. Performance: four auth round trips per render → one

`supabase.auth.getUser()` is a **network call to Supabase Auth**, not a cookie
read. Correctly so — `getSession()` only reads cookies and can be spoofed. But
nobody had counted the calls.

A `/dashboard` render made four: middleware, the `(app)` layout, the page, and
`loadHomeData`. Four validations of the same JWT at roughly 100ms each from
South America.

- **`lib/supabase/user.ts`** wraps it in React's `cache()`, memoised for the
  life of one render. Not a stale-data cache — it cannot outlive the render.
- **Converted:** the dashboard path (3 sites), the console layout and all 13
  console pages, the `(learn)` layout and 6 pages. **All 24 call sites were
  byte-identical in shape**, so one anchor covered each group.
- **Middleware** is guarded on the presence of an `sb-*-auth-token` cookie.
  Logged-out visitors on the marketing site were paying a round trip to
  validate a session that did not exist. The gate is unchanged — absent cookie
  means null user, which is what `getUser()` would have returned.

Middleware cannot use `cache()`: it runs in a separate invocation before the
render begins, so there is no render to share.

**And there was no `loading.tsx` anywhere in the app.** With `force-dynamic`
pages, Next holds the *old* page on screen unchanged for the entire server
render — no spinner, no skeleton. A 900ms render reads as three seconds because
for 900ms the app looks broken rather than busy. Four files, one per route
group, plus `components/brand/brand-loader.tsx`. That was most of what was
actually being felt.

---

## 2. "Last active 25 days ago" for someone using the product daily

`census.ts` derived `lastActiveAt` from `auth.users.last_sign_in_at`, which
**only moves on a fresh sign-in**. A session that keeps refreshing never
rewrites it.

Not a cosmetic label. `dormant` is derived from the same value, drives the
dormant segment and its summary count, and **that segment is the audience an
operator copies emails from or pushes to GoHighLevel**. The bug could have sent
a re-engagement campaign to the most active accounts on the platform.

**Migration 169** adds `v_user_last_activity` — the max across quiz attempts,
exam submissions, FSRS reviews, lesson progress and tutor chat.

Two findings from the data worth keeping:

- **Reading counts.** Lesson progress lagged quiz activity by *twelve days*
  platform-wide, so lessons alone would have been nearly as stale as the column
  being replaced. But someone who reads for an hour and answers nothing is
  engaged, and calling them dormant loses a customer.
- **`lastActiveAt` is the LATER of activity and sign-in.** Neither alone is
  right: live data showed one account +26 days newer by activity and three
  others **negative** by 5–10 days, having signed in recently without studying.
  Both errors were present in the same ten rows.

`v_user_cert_activity` already existed and is **not** the right source — it is
built only from `user_lesson_progress` and is per-user-per-cert. `user_progress`
has **zero rows**; see open loops.

---

## 3. People page: three features

**Certified enrollment chips link to `/verify/{id}`** in a new tab — the same
form the certificate QR encodes. `census.ts` carries `credentialId` on each
enrollment now (`certifiedUserCert` became a Map, keyed identically).

Deliberately **not** the console credentials view. That answers "how do I manage
credentials at scale", which is a real question at 300–400 credentials and one
nobody can answer without having felt the problem. A verify link is true at ten
and true at four hundred. The href is one line to change the day that question
has an answer.

**`IssueDirectModal` lifted out of `admin-allocations.tsx`** (33 kB) into its
own file, with `console-kit.tsx` holding the atoms `CreateCompanyModal` and
`AddBatchModal` still need. It was the one thing in that file with no company
context — it draws down no allocation, because "direct" means there is no
counterparty — which is exactly why it could be reused.

**"Issue seat" on the census**, enabled at exactly one selection. Issuing a seat
is per-person and per-payment; a bulk version invites a costly mistake at scale.
It sits beside Push-to-GHL and reuses the selection state already there rather
than adding a seventh column to a six-column grid.

The email field takes suggestions from the census already loaded — **no new
endpoint, no per-keystroke query**. When the selected certification is one the
matched person already holds, the button becomes a two-step confirm. Warns
rather than blocks: a recertification before expiry is legitimate, and refusing
a paying customer is worse than issuing one seat too many.

**Issue direct issues a VOUCHER, not a credential.** It grants the right to sit
the exam. Nothing in this product hands out a credential.

---

## 4. The certificate name

**Google OAuth hands over whatever the person has on their Google account** —
"J Roman" — and `score-mock-exam` stamped that onto the credential permanently.
There was no way to change it at any point by any route: `full_name` is written
once at signup in `auth/actions.ts` and read-only everywhere after.

**Migration 170** adds `profiles.certificate_name` and
`certificate_name_confirmed_at`.

A display name and a certificate name are **different things**. Overloading one
field means editing your certificate name changes how the app greets you, and an
OAuth re-sync silently rewrites what your certificate will say.

- `certificate_name` nullable on purpose: null is "never chose one", which is
  distinguishable from "chose the same string as the display name".
- `certificate_name_confirmed_at` records that a human *looked*, whether or not
  they changed anything. Otherwise someone whose Google name is already correct
  would have to retype an identical string to dismiss a reminder — a chore, not
  a check.
- The grant **enumerates**, extending 168. Never a table-wide grant plus a
  column revoke.

**`/settings` existed in three places and nowhere that mattered**: middleware
protected it, robots excluded it, the user menu had a greyed-out item with a
translated label. The page was the only missing part.

`score-mock-exam` now reads `profiles`, resolving 168's own follow-up note —
until it did, a name edit would stamp nothing and the feature would look broken
rather than missing. Order: `certificate_name` → `full_name` → email →
placeholder. The auth admin call now only fires when both profile names are
empty.

**Validation is deliberately almost nothing**: trim, collapse whitespace, cap at
120 to match `update-credential-name`, refuse empty. Names carry particles,
apostrophes, accents and scripts no rule gets right for everyone, and the
failure mode of being clever is telling a real person their real name is
invalid.

---

## 5. Theme: the tokens that invert

Surfaced by the exam pass screen — the View credential button was `text-white`
on `bg-[var(--color-ink)]`, and **`--color-ink` is `#1d1d1f` in light and
`#f4eff3` in dark.** White on near-white.

**The rule that explains why the earlier sweep missed it:**

| token | inverts? | `text-white` on it |
|---|---|---|
| `--color-accent`, `--color-success`, `--color-error` | no | correct |
| `--color-ink`, the surfaces | **yes** | **wrong** |
| bare `bg-white` | n/a | **wrong everywhere** |

A grep for `text-white` returns ~90 mostly-correct hits with the four that
matter buried in them. **The useful greps are narrow:** `text-white` *adjacent
to* `bg-[var(--color-ink`, and bare `bg-white(?![/-])`.

Fixed to `--color-primary-foreground`: exam pass screen, the public verify
page's download button, Resume lesson, the floating tutor button, and
`ui/badge`'s default variant (unreachable today — the only `<Badge>` names
`variant="mono"` — but a trap for the next person). Bare `bg-white` → 
`--color-surface-lift`: `hub-hero` ×2, `team-readiness`, `citation-chip`.

`bg-white/NN` opacity variants are correct and were left alone.

---

## 6. Rules learned this session

**Count the network calls before optimising anything else.** `getUser()` looked
like a cheap accessor and was four round trips per page.

**Read lint warnings as evidence about the environment.** Two
`no-img-element` warnings were the only signal that `next/image` is not
configured for Cloudflare Pages. A `next/image` builds clean and fails in
production — same class as a missing edge export.

**A green build proves compilation, not behaviour.** `expires_at` had a column,
a query and an interface, and still never reached the renderer.

**Claims about build state belong in the database.** A handoff line saying
AIGRM-I was mid-build was wrong, had been corrected in conversation more than
once, and kept coming back *because it was written down*. All seven
certifications are `available`. Check `public.certifications`, not a document.

**PowerShell:**
- A backtick inside a **double-quoted** string is an escape character. `` `a ``
  wrote a literal **U+0007 BEL byte** into a markdown file and swallowed the
  following letter. The write succeeded and every subsequent search failed
  because of an invisible character. Use single quotes or `[char]0x60`.
- `-Path` does wildcard expansion, so `[locale]` is read as a character class
  and matches nothing. `-LiteralPath` everywhere, on destinations too.
- `-Include` with `-Recurse` matches **directories**; add `-File`.
- Zero output from a loop means "found no files", not "found no matches".

**Patch discipline:** anchor on the whole block, not one line of it. Appending
`</button>` after a line called `Push all` produced a duplicate closing tag
because nobody checked what already followed it. And a guard string must not
match the usage you are about to add — `if ($raw -match "nameLead")` aborted
because the JSX referencing `s.nameLead` was already in place while the keys
were not.

---

## 7. Open loops

**`app-nav.tsx` and `mobile-nav.tsx` run identical logic in the browser** —
`getUser()` plus a `team_members` lookup, four client round trips per page to
decide whether one admin link renders. Belongs resolved once in the server
layout and passed down. Does not affect the server render, which is why it was
not part of the perf fix, but it is why the nav settles a beat late.

**Unconverted `getUser()` sites**, each for a reason rather than by omission:
`lesson-container.tsx` has two calls in one file so the standard anchor is not
unique; `lib/engine/sessions.ts`, `lib/enrollment/*`, `lib/catalog/data.ts` are
helpers where `cache()` only pays if they run inside a render that already
resolved the user; login/signup/forgot-password and `verify/[id]` have one call
each with no layout above them doing the same.

**`user_progress` has zero rows** — a table with `last_activity_at` and
`completed_at` that nobody writes to. Either dead and droppable, or something
that should be writing to it isn't.

**Certification status filter on `IssueDirectModal`.** Deferred deliberately:
all seven certs are `available`, so a filter would guard nothing today. Worth
adding the day one is not — selling a seat for a cert nobody can sit is a rule
about the *transaction*, so it belongs in the modal, and `loadAdminData` would
need to carry `status` (it currently selects `id, code, name` only) for the
Allocations page to get the same rule.

**`info@certiglobal.org` has drifted** — `auth.users.user_metadata.full_name`
says "Andres Cardona", `profiles.full_name` says "CertiGlobal". Probably
deliberate for an org mailbox, but it proves the two stores can diverge with
nothing reconciling them. `score-mock-exam` now reads `profiles`, so that is the
one that matters.

**`factsheet.ts` and `credential-og` can both now use `wordmark.ts`.**

**Downloads holds ~85 stale `.ts`/`.tsx` files** from previous sessions —
exactly the pile the `name (1).ext` trap breeds in. Worth a clear-out.

Carried: badge header hex drifts within programme; `/favicon.ico` 404s; AIE-I's
JTA v2.0 still states two-year validity against 365-day credentials.

---

## 8. Next session prompt

> Continuing Certidemy. Read `HANDOFF-v5.1.md` first — v5.0 has the certificate
> redesign, `CERTIFICATE-LAYOUT-v4.md` has the certificate geometry, v4.3 has
> the review protocol.
>
> **All seven certifications are `available` — built, published, live.** If any
> document says otherwise it is stale; check `public.certifications`.
>
> **The finding to carry:** count network calls before optimising. `getUser()`
> looked like an accessor and was four round trips per page render. Roughly a
> dozen call sites remain, all in helpers where the win depends on whether they
> run inside a render that already resolved the user.
>
> **The habit:** read lint warnings as evidence about the environment. Two
> `no-img-element` warnings were the only signal that `next/image` does not work
> on this deploy target.
>
> **The rule:** a green build proves compilation, not behaviour — and a claim
> about state belongs in the database, not in a handoff.
