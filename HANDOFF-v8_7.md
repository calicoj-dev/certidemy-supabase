# HANDOFF v8.7 — Two live bugs nobody had hit yet

**Migration tip: 249. Next free: 250.**

Read v8.6 first for partner onboarding, issuer creation and console issuing.
This session started with a support report and ended with three migrations, two
production fixes, and the first end-to-end proof that a candidate can sit an exam
and receive a credential.

Both bugs were live and neither had been hit, because the paths that trigger them
are rare. That is the theme.

---

## 1. Every passing exam had been failing to mint a credential for six days

**Migration 231 (2026-08-19) made `credentials.achievement_id` NOT NULL**, with no
default and no populating trigger. It backfilled every existing row and **named no
writer**. `score-mock-exam` last changed 2026-08-12 — seven days earlier — and its
insert didn't set the column.

The last exam-issued credential in the database is 2026-08-17. **Nothing had
passed a certification exam since the constraint landed**, which is the only
reason this hadn't surfaced. AIGRM-I alone had nine assigned vouchers, all bound
to real users, all valid to Feb 2027.

**The error is not `23502`.** `trg_guard_credential_issuer` is BEFORE INSERT and
fires ahead of the constraint, so a null `achievement_id` raises
`achievement <NULL> not found` (P0001) instead. **Searching logs for the
constraint code would find nothing** — worth remembering whenever a table has
BEFORE INSERT triggers.

For a passing candidate the sequence was: session closed `passed=true`,
`exam_attempts` row inserted, mint raises, and the voucher redeem sits inside the
`else` branch so it never runs. A pass on screen, an attempt on record, no
credential.

**And the reconciler was broken the same way.**
`scripts/mint-missing-credentials.mjs` built the identical fourteen-key row and
would have failed on the same trigger. **The tool that exists to recover a
passed-attempt-with-no-credential could not run.** A safety net that fails on the
same constraint as the thing it catches isn't a safety net, and nobody would have
discovered it until the moment it was needed.

**The fix.** Resolve the achievement by `certification_id` — the key migration 231
enforces with a partial unique index, *one achievement per certification, ever*.
Not by code equality, which is true today only as an artifact of that backfill.
Take `issuer_id` **from the resolved achievement** rather than a second
independent lookup, so the two can't disagree when a partner-owned certification
eventually exists. Refuse the mint on a missing or non-active achievement rather
than issuing a document whose claim nothing defines.

Both call sites. The scorer throws; the reconciler skips the attempt and
continues, because one certification without an achievement must not cost every
other candidate their recovery.

> **This was the second time on the same insert.** The Open Badges migration added
> `issuer_id` and `subject_salt` NOT NULL, `score-mock-exam` broke, and the fix
> landed with a comment saying exactly what had gone wrong — *"Adding a column to
> a table does not fail the writers that predate it until one of them runs."*
> Migration 231 did it again, two columns later, in the same insert. The comment
> was right there.

`CLAUDE.md` now requires a migration adding a NOT NULL column to grep both repos
for writers and list them by path, state per site whether it writes the column,
and **name the rare path nothing exercises on deploy day**.

---

## 2. Nothing creates the achievement for a new certification

Migration 231 §3 was a **one-time backfill** over the eleven certifications that
existed on 2026-08-19. No trigger, no function, no edge function — every `public`
function body was scanned and none inserts into `achievements`.

So **every certification created since can pass `verify-cert`, sell seats, run
exams, score them, write the `exam_attempts` row — and then fail at the mint**, in
front of a candidate who has just passed.

### Migration 249 — enforced from both sides, by refusal

I proposed a trigger that creates the achievement on certification insert. **That
was wrong, twice over**, and the reasoning against it is the useful part:

- Creating it as `draft` doesn't fix anything — the mint still refuses, so the
  forgotten step just moves one layer deeper, now with a row that *looks* like the
  work was done.
- Creating it as `active` **publishes a claim**. `achievements_read` is
  `status = 'active' OR can_read_issuer(...)`, so active means readable by every
  authenticated user — with a description the trigger invented, because
  `achievements.description` is NOT NULL and `certifications.description` isn't.
  That's the platform asserting something nobody authored.

**And the real invariant isn't "every certification has an achievement."** A draft
genuinely doesn't need one, and forcing it there is what creates the
abandoned-definition problem. It's **"every certification that can be examined has
an active achievement"** — true at exactly one moment, the flip to `available`.

Every guard trigger in this schema refuses; **none fabricates data**. A trigger
that silently wrote an OB3 definition would have been the first of its kind, and
the odd one out is usually the wrong one.

**`guard_cert_has_active_achievement`** — BEFORE INSERT OR UPDATE OF status on
`certifications`. Refuses the transition into `available` without exactly one
active, `Certification`-typed achievement on an active issuer. Refuses INSERT at
`available` outright, since the achievement references the certification's id and
no ordering makes that satisfiable.

**`guard_achievement_backs_live_cert`** — BEFORE UPDATE OR DELETE on
`achievements`. Refuses archive, detach or delete while the backing certification
is `available` or `unavailable`.

That second guard exists because of a window nobody had noticed:
`credentials.achievement_id` is ON DELETE RESTRICT, which protects an achievement
**only once a credential points at it**. A certification that is live, has sold
seats, and hasn't minted its first credential has zero referencing rows — so a
plain `delete` succeeds. **That window is the launch window**, which is exactly
where this whole bug lived.

Both bodies md5-verified against live `prosrc`. Plus a `verify-cert.mjs` §12
invariant so the failure arrives before anyone is at the console mid-launch, and
`CERT-PUBLISH-CHECKLIST.md` §6.7 with the insert and its four traps.

---

## 3. The exam a candidate couldn't resume

**Two people abandoned exams on 2026-08-21 and I called it a pattern. It wasn't.**

`rherrera` left the simulator after two minutes and kept using the platform for
twenty more — practice at 19:30, review at 19:44. Ordinary behaviour, no stakes.

Natán Palacios burned **both attempts on a paid voucher in 65 seconds** and got
nothing. Five sessions in six minutes. The gaps are the story:

| time | session | kind | answers |
|---|---|---|---|
| 03:04:01 | 27243a2f | mock_exam | 5 |
| 03:06:46 | 80a57268 | certification_exam | 2 |
| 03:07:44 | c4c606eb | mock_exam | 0 |
| 03:07:51 | 29a083ea | certification_exam | 25 |

**He started a mock exam at 03:07:44 and a certification exam seven seconds
later.** Nobody decides to begin an exam seven seconds after beginning another
one. That is a candidate going round a loop, starting fresh instead of resuming.

**The resume was never offered.** `get-active-exam-session` returned the newest
open session of *either* kind; `mock-exam.tsx` discarded it when
`res.kind !== wantKind` and fell through to the intro screen. So at 03:07:51 the
newest session was **the mock exam he'd started seven seconds earlier**, which hid
his live certification exam one row away.

He saw a Start button. There was no other button to see.

**Both halves alone are fine.** Together, any newer session of the other kind
makes a resumable exam invisible — and that window is exactly when a confused
candidate is clicking around.

**Fix:** `get-active-exam-session` takes an optional `kind`, so the exam page asks
for the session it can actually resume. Absent `kind` keeps catalogue-wide
behaviour for the dashboard banner, and now **prefers `certification_exam` when
both are open** — written as an explicit `find(...) ?? open[0]` rather than an
ORDER BY, because `certification_exam` sorts before `mock_exam` alphabetically and
an ascending sort would work today and break silently the day a kind is added
between them.

The client-side kind filter is **removed rather than kept as belt-and-braces** —
two places deciding one thing is what caused this.

Plus a backstop in `generate-mock-exam`, above `consumeAttempt` so it can never
burn an attempt: refuse a second concurrent `certification_exam` for the same
certification, returning the resumable `session_id` so the client can offer the
way back. Certification exams only — a mock exam consumes nothing.

> **Blocking new starts alone would have been worse than the bug** — "you already
> have an exam in progress" with no way to reach it.

### One fix widened the path to a recorded defect

`mock-exam.tsx` rebuilt the exam on resume with `res.duration_minutes ?? 60` and
`res.passing_score_pct ?? 85`. AIGRM-I is **120 minutes at 80%**. Making resume
more reachable made that more likely to fire, and it was already recorded in
`CLAUDE.md` as a known-unpatched issue.

Settled by **refusing to resume** when either field is absent, rather than
tightening a cross-repo contract under time pressure. A visible failure beats a
silent wrong clock.

`CLAUDE.md` now carries the general rule: **when you widen a path, re-read what is
recorded about it.** Those entries are landmines indexed by the code they sit in,
not a backlog to work through in order.

---

## 4. Natán's sessions, and migration 248

Four sessions sat open since 2026-08-21. **Nothing closes an expired session** —
`get-active-exam-session` is lazy finalisation on the candidate's *next request*,
so a candidate who never returns leaves a session open forever. That's why the
admin Examinations screen showed a backlog.

**The schema had no way to say "this ended without a result."**
`score-mock-exam:503` is the only writer of `completed_at` and it always writes a
score plus an `exam_attempts` row. So a session could only stay open forever or be
scored dishonestly.

Scoring his would have written **31% at best** — `total` is the *form size*, not
the submission length, so 25 of 80 answered caps at 31.25% against a threshold of
80. A permanent recorded failure for someone whose browser died twelve minutes in.

And it would have happened by itself: lazy finalisation picks the newest open
session on his next authenticated request. **"Do nothing" was not a stable state.**

**Migration 248** adds `quiz_sessions.closed_reason` with three CHECKs — the
vocabulary, reason-implies-closure, and **reason-excludes-score**, which makes the
two closure paths mutually exclusive at the database level rather than by
convention. After it, `score-mock-exam` physically cannot write a reason and a
reasoned closure physically cannot carry a score.

His four sessions were closed unscored and backfilled `administrative`, with an
`admin_actions` row recording that the closure had **no supported path** —
`method: manual SQL - no function closes a session unscored`.

> **There is no decrement path for `attempts_used`, deliberately.**
> `unassign-voucher` refuses when it's above zero, and `v_voucher_validity`
> asserts the same — the recycling guard exists so a spent seat can't be resold.
> So the answer was a **new voucher**, not a restored one: supported code, honest
> audit trail, fresh form, and it sidesteps the guard rather than defeating it.

**Sales is issuing the replacement.** The AIE-I voucher on his account
(`AIE-I-V-3Y2U-P6XN`, 2026-08-25 17:29) predates the session closures by three and
a half hours and is a separate seat, not a mispicked replacement.

**Both existing vouchers have `order_ref` null**, which is why a goodwill
replacement couldn't be distinguished from a sale without comparing clocks. Worth
using that field.

---

## 5. The login crash — real, separate, fixed

A user hit `Application error: a client-side exception has occurred` on
`/en/login`. The deployed chunk carried exactly one `.status` read and it was
unguarded: `"error"===j.status` where `j` is the `useActionState` result.
Bottoming out at `MessagePort` means it threw during render, not in a handler.

`INITIAL` was a real `{ status: "idle" }` object in all four auth forms — so the
`undefined` came from the **action's return**, not the initial value. Consistent
with deploy-time skew: Next content-hashes Server Action IDs per build, so a
client on a stale page posts to an ID that no longer exists.

All four forms now normalise through `authState(raw)` before any read. **Signup,
forgot-password and update-password read `state.status` at line 21, ahead of their
own early return** — they'd have thrown *earlier* than login did.

The fallback is `{ status: "error", code: "generic" }`, **not idle** — idle redraws
a clean form and reads as "nothing happened" when the submission never reached the
server.

**Three `error.tsx` boundaries now exist**: `(auth)`, `(learn)`, and
`learn/[cert]/exam`. The exam one is separate because it's the only surface where
a crash costs money, and its copy states four things each verified against code
first: answers flush server-side on every change, reload restores the recorded
form, the clock is anchored to `started_at`, and an expired session is scored from
what was persisted.

`reset()` is deliberately never called — Next passes it, but it re-renders the
segment with the same JavaScript already in memory, which does nothing when the
cause is a stale chunk. `window.location.reload()` and a plain `<a>` escape, for
the same reason.

---

## 6. The exam engine is one implementation

Worth recording, because the worry that prompted the read was reasonable and
wrong.

**Zero cert-specific branching** anywhere in `components/exam/*` or the `(learn)`
route group. Every branch is on `mode` or `phase`, never identity. Cert reaches
the components as an id and a display name. Blueprint, item bank, pass mark,
duration and question count all arrive from the server.

The only lookup keyed by cert is `LEGACY_CODE_ALIASES` — URL rewriting so old
links resolve. It changes which row you get, not what happens to it.

**Scoring is blueprint-tolerant**; only form assembly is not. `generate-mock-exam`
is domain-first at two separate points, and neither is a flag: an item with no
`task_id` gets `domain_id = null` and is silently dropped from both pools. So an
assessment without a blueprint breaks at form assembly and nowhere after it.

**A degenerate blueprint works** — one domain at 100%, one task, items carrying
that `task_id`. Proven by ZZ-TEST-I below.

---

## 7. ZZ-TEST-I — the first end-to-end proof

A throwaway one-question certification, created to test the whole path rather than
assume it.

`ZZ-TEST-I`, 1 question, 5 minutes, 50% pass mark, one domain at 100%, one task,
one secure item. **Created at `draft`** — invisible to every public surface,
because RLS is `status = 'available' OR is_platform_admin()` and all four
catalogue surfaces use the anon key. Flipped to `available` only for the sittings,
then to `unavailable`, which still scores and mints.

**The fail run first**, deliberately: answer wrong, score 0%, `exam_attempts` row
written, voucher attempt consumed, **nothing minted** — the mint sits behind
`passed && mintable`. That proved the sampler, `exam_session_items`, the resume
fix, `save-exam-answer`, the scorer and the voucher consume, at zero permanent
cost.

**Then the pass.** 100%, credential `ZZ-TEST-I-A6BJ-EA5R` minted with
`achievement_id` populated and `issuer_id` sourced from the achievement — **the
exact defect from §1, proven fixed on real data.** Verify page rendered, blueprint
displayed, certificate PDF generated with its QR code, voucher redeemed 2/2 and
linked. `status_list_index` 23.

Credential subsequently **revoked** — it was a real, active, publicly-verifiable
claim that CertiGlobal earned competence in a test task. Revocation is a status
change, so the row and its four OB3 URLs remain and answer honestly.

### The negative test, and why it was safe

Migration 249's guard was also **observed refusing**, not just verified in the
catalog:

```
ERROR:  23514: Certification ZZ-TEST-I has an achievement that is draft, not active.
DETAIL:  The mint refuses a non-active achievement.
HINT:  Set the achievement to active first.
CONTEXT:  PL/pgSQL function guard_cert_has_active_achievement() line 38 at RAISE
```

The cert stayed at `draft` — the failed statement rolled back cleanly.

**This does not break the rule migration 246 paid for.** That rule is *never
propose a destructive statement to verify a hypothesis about privileges, because
if the check and the damage are the same action, the check IS the damage.* Here
there was nothing to damage: a throwaway certification at `draft`, no candidate,
no credential.

And the load-bearing detail — **the achievement could be demoted at all only
because the certification was draft.** `guard_achievement_backs_live_cert` returns
early for anything not in `('available','unavailable')`. On any of the eleven real
certifications both guards refuse and **there is no safe negative test**. The
throwaway cert is what made the observation possible, which is the argument for
keeping one around.

Three things the message corroborated beyond "it refused": `23514` is
`check_violation`, so the declared errcode is the one Postgres raised;
`line 38 at RAISE` resolves against the committed body, which is **independent
evidence the file matches the live function** on top of the prosrc md5; and the
branch that fired was achievement-exists-but-inactive, not no-achievement-row,
which is why the body checks them separately.

`ZZ-TEST-II` and `ZZ-TEST-III` were not run — the INSERT-at-available refusal and
the no-achievement-row branch are verified by reading only.

---

## 8. Migration 247 and CSV batch issuance

`credentials.idempotency_key`, with `UNIQUE (issuer_id, idempotency_key) WHERE
idempotency_key IS NOT NULL` — the same shape `issuer_api_requests` uses.

**No batch entity, no queue.** A queue exists for work that's slow, external or
unreliable. Minting is a local insert; forty rows is forty inserts in one request.

**The key is derived server-side** from a batch label the partner types, the
achievement code, and the normalised email. Never sent by the client, so a client
cannot make two rows collide or force a mint. A generated id breaks on re-upload;
file content breaks when someone fixes a row; **a human label survives both**.

`dry_run` defaults to **true** — an omitted field previews rather than minting 500
permanent credentials. Preview and commit share one body object, so the preview
cannot lie about what commit will do.

Two `23505`s are told apart by constraint name: the code index means retry with a
new code, the idempotency index means **stop and return the existing credential**
— and skip the webhook queue, so a receiver never sees `credential.issued` twice
for one credential.

**The CSV parser is the only console code that can put wrong text into a signed
credential without anything erroring.** Spanish and Portuguese Excel on Windows
writes **CP1252**; `File.text()` assumes UTF-8; an accented name arrives as
replacement characters and that string is printed on a certificate at a public
URL, unfixable after the mint. Decode UTF-8, and if the result contains U+FFFD,
decode the same buffer as windows-1252. Delimiter detection too — those locales
default to `;` because `,` is the decimal separator.

**Two columns only: `email` and `full_name`.** Splitting first/last is a Western
assumption that breaks immediately in LATAM. A file with `nombre` and `apellidos`
is **refused with the remedy** rather than guessed at — it parses cleanly, which
is what makes it dangerous.

`npm run csv:check` (24 fixtures) and `npm run quiz:check` (25) exist because
`npm run build` cannot find any of this — nothing throws.

---

## 9. `quiz/play` — the last known white-screen path

`QuizPlayer` ran `shuffle(current.options)` inside a `useMemo` **above** the
`if (!current)` guard. `shuffle` does `[...arr]`, so a question missing `options`
threw "undefined is not iterable" during render, above every guard, on a route
with no boundary.

The page did `JSON.parse(raw) as StoredPayload` and passed `payload.questions`
straight through. **A cast is not a check.** `JSON.parse("null")` left the spinner
up forever; a malformed question threw.

The payload shape has **never changed** — `{ sessionId, questions }` since the
quiz player's first commit, and the `Array.isArray` branch was day-one
defensiveness, not a migration shim. So stale-shape payloads were theoretical.
What was live needed no shape change: nothing validated the payload at all.

Validated at the boundary now, in `lib/quiz/payload.ts`, checking **every**
question rather than the first — a form is served whole, and one bad item throws
at whatever index it sits on.

The `useMemo` **cannot** move below the guard — a hook after a conditional return
is illegal in React, not merely worse — so it's `current?.options ?? []`,
byte-identical for a valid question.

And the `?? "sm-i"` cert default is gone. It came from the SM-I rename and **that
code no longer exists** — `LEGACY_CODE_ALIASES` rewrites it. It was silently
guessing a renamed certification on a route that cannot legitimately lack the
segment.

---

## 10. The guard rule is now four-for-four, and shape is the worst

A post-condition guard has matched the wrong thing four ways, one cause: **a
heuristic standing in for structure.**

- **Substring** — `includes("to anon")` aborted on a comment saying *no grant to
  anon*.
- **Memory** — a `MUST_BE_GONE` list passed while eight strings were still English.
- **Distance** — "within 400 characters" fired on *correct* output.
- **Shape** — an anchor of `})),\n  }));` was unique, passed the uniqueness guard
  cleanly, and **matched the wrong map**.

The first three fail *at the guard*. **Shape failed silently and produced wrong
code**, caught by the compiler only because the two maps happened to differ in
type. Had both carried a `status` field it would have shipped. And uniqueness
doesn't rescue it — a shape can be unique by accident and still belong to
something else, so the check that normally catches a bad anchor is the one that
certifies this kind.

**Anchor on an identifier that belongs to the intended structure and no other.**
Punctuation is the weakest possible proxy: it's the part of the source most
identical everywhere.

---

## 11. Open

**Highest value:**

1. **The third mint is not consolidated.** Four sites insert into `credentials` —
   `_shared/issue.ts`, `score-mock-exam`, `mint-missing-credentials.mjs`, and
   migration backfills. `credentials` gains a column → four inserts change.
   Deferred deliberately: the shared function takes an `achievementCode` scoped to
   an issuer while the exam path has a `certification_id` and no code, and the
   exam mint carries `exam_attempt_id`, `score_pct`, `jta_version_id`,
   form-derived locale and the voucher redeem.
2. **`mint-missing-credentials.mjs` has never been run** against a real orphaned
   attempt — there are currently none.
3. **A supported console action to close a session unscored.** The cron sweep
   would only close what can never be scored, which is currently zero rows; what
   drains the Examinations screen is an admin action. Session
   `df083d27` is left open deliberately as its first exercise.

**Found, not fixed:**

- **Migration 057's catalogue publish gate is gone.** `is_cert_published` and
  `is_task_published` do not exist live; `domains` and `tasks` carry `USING (true)`
  plus `GRANT SELECT` to anon, so **any certification's blueprint is anonymously
  readable regardless of status**, including drafts. `quiz_questions` has no
  anon/authenticated grant and does not leak.
- **`quiz_questions` RLS policies are dead letters** — the policies exist, the
  grant does not, and the grant is checked first.
- **`verify-cert` baseline is not clean.** It's 43–44 checks per cert, not 38, and
  **AIE-I fails §8** — 15 ungrouped items, `pool=practice`, `es-419`, created
  20–21 August. None secure, so no exam form can contain them; the es-419
  simulator and review queue can. Cause not established. Every cert also warns, so
  "green" is not the bar.
- **`generate-mock-exam` has no status check on the simulator path** —
  `mode='simulator'` runs at any certification status including `draft`.
- **No manual authoring path for `quiz_questions`** anywhere: migrations, two
  generator scripts, and one practice-only RPC. `IMPORTER_SPEC.md` and
  `CERT_YML_SPEC.md` are both unimplemented.
- **The `credential.issued` webhook payload carries recipient PII.** The one
  delivery that has ever fired predates the current shape and carries none. The
  `test-partner-02` webhook is still paused.
- **`isCertExam` is decided by shape** — `conceptBreakdown.length === 0` — so a
  simulator result with an empty breakdown renders as a certification exam.
- **Copy on an archived achievement creates an active one**, so archiving does not
  prevent content reappearing. Nothing states a position either way.
- **The Company column may be derived from a voucher rather than the issuer** —
  `test-partner-02`'s credential shows as "Self-pay" in the console.

**Process rules added to `CLAUDE.md` this session:** name every writer when adding
a NOT NULL column; keep single-quoted strings in a plpgsql body short (a long one
does not survive terminal-to-SQL-editor and can also paste *cleanly* and be
wrong); when the human edits SQL before running it, read the body back from
`prosrc` rather than committing the draft; and when you widen a path, re-read what
is recorded about it.
