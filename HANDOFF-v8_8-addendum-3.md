# HANDOFF v8.8 addendum 3 — what Moodle changed, and a correction to addendum 2

**Migration tip: 263. Next free: 264** -- verify with `ls migrations/ | tail -1`, the disk is authoritative. Two migrations ran on 2026-08-27 —
**260** `lti_platform_status_vocab` and **261** `lti_capability_history` — both
described in addendum 1's header.

This is a **delta**, not a handoff. The Moodle run itself is written up where it
belongs — `LTI-SETUP.md` Part Two, now eight steps and marked **EXECUTED**
rather than proven. Re-narrating it here would produce a worse second copy. What
this file carries is the three things that live nowhere: the corrected order of
work, one item that never got done, and a pattern in how this build fails that
showed up four times in one afternoon.

---

## 1. The correction: addendum 2 §3's order is wrong

That list reads:

1. the Moodle sandbox
2. the `data` echo
3. phase 2 — the student launch
4. the last-admin guard

**Moodle is done, and it produced a new item that sits above phase 2.** The list
is now actively misleading to a cold start, and it is in a file written from the
coordination chat, so it gets corrected from there.

### The corrected order

1. **`ltiResourceLink` content items.** Moodle 5.2 sends
   `accept_types = ["ltiResourceLink"]` and nothing else. We build a `link`. The
   picker refuses, correctly, and nothing reaches the course. Every deep-linking
   run before this one took the `link` path because lti-ri happened to accept
   five types. **This is the difference between Certidemy working and not
   working on the most widely deployed LMS in the world.**
2. **Phase 2 — the student launch.** Unchanged in substance, and now reached
   *through* item 1 rather than after it. See §2.
3. **The `data` echo.** Still undone. See §4. **[CLOSED 2026-08-28 — proven on
   the wire and made observable in `a2b5895`. The negative half is still
   unproven; see §4.]**
4. **The post-verification recording gap.** Eighteen refusal paths write
   nothing. See §3.
5. **The last-admin guard**, still unnumbered and unapplied.

### Why 1 and 2 are one item wearing two names

An `ltiResourceLink` content item **points back at our own launch URL.** So the
moment an instructor plants one, the next thing that happens is a student
clicking it, and Moodle sends us an `LtiResourceLinkRequest` with a real
learner in it.

**That is phase 2, arriving through the back door.** It is not a compatibility
patch on the signing path with a phase 2 sequel — building item 1 without
settling item 2 means shipping a link that lands a student on a refusal page
inside their own course.

So the paper decision comes first, unchanged from v8.8 §10: `profiles.email` is
`NOT NULL UNIQUE` and feeds five downstream paths including
`credentials.holder_email`, so **a synthetic address for a withheld email gets
hashed into a credential.** **[SETTLED 2026-08-28 — see `LTI-PHASE-2.md`. The
paper decision is made: the identity control sits at the moment of assessment
and nowhere else, and the withheld-email case is refused with two doors rather
than given a synthetic address. Item 1 below is still gated on item 2, but item
2 is now a build rather than a question.]**

**One thing the Moodle run contributed to that decision.** Every launch released
`sub`, `name`, `email`, `roles` and `context_title` — from a platform configured
with Moodle's default privacy settings, which we set to *Always* but did not
otherwise coax. **The withheld-email case is the exception, not the default.**
That does not remove the need to decide it; it means the decision governs a
minority path rather than the common one, which changes what a good answer looks
like. A synthetic address is a worse trade if 95% of launches never need one.

### Also corrected, from the same file

Addendum 2 §1 made four predictions about what Moodle would test. **Three were
wrong**, and the wrong one that matters is the flip.

| addendum 2 §1 said | what happened |
|---|---|
| credentials `admin` / `sandbox` | `admin` / `sandbox24` |
| `state_cookie_survives` may finally read `false` | read `true`, 4 of 4 — Chrome allowed it |
| the mixed capability row is the first real flip | **no flip occurred at all** |
| `product_family_code` populated | correct — `moodle` |

**The flip still has not happened.** Two platforms, twelve launches, and
`changed_at` and `previous_value` are null on every row in `lti_capabilities`.
The `varies` styling has never rendered. Those columns shipped in migration 261
and remain, as of today, decoration that is provably correct rather than
decoration that is untested — the function sets them on a genuine difference,
which was read from `prosrc` and confirmed. **What has never been observed is a
capability changing its mind.**

Safari is the path to it. It blocks third-party cookies by default, it is named
in `lib/lti/config.ts` as the reason the state cookie is never authoritative,
and a run against a fresh sandbox hour in Safari should write
`state_cookie_survives = false` on a platform where it already reads `true`.
That is a flip on one key on one row, and it is one browser away.

---

## 2. What the Moodle run actually produced

Full detail in `LTI-SETUP.md` Part Two. The short version, because the shape of
it matters more than the steps:

**Part Two described a path that does not work on Moodle 5.2.** Not one wrong
click in an otherwise sound sequence — the module ships disabled so nothing
appears in the activity chooser at all; two required fields were missing from
the table, without which there is no picker; more fields sit behind a "Show
more…" link and read as absent; the launch container makes it two launches
rather than one; and the picker is reached from an existing activity, not from
the creation form. Every one of those is enumerated in Part Two now.

**No amount of re-reading would have surfaced any of it. Only executing it
did** — which is the entire argument for the banner having been there.

**Three firsts, all of them in the tolerant reader's favour:**
`product_family_code = 'moodle'` is the first non-null that column has ever
held; `custom_vars_substituted = false` is the first observation of that value
anywhere; `advertises_link_content_item = false` is the first `false` on that
key and **the first time the capability pair has disagreed.**

That last one is the design paying out. `supports_deep_linking = true` with
`advertises_link_content_item = false` says exactly the right thing: *deep
linking works at this platform, our content item does not.* **A single boolean
would have read `true` and explained nothing**, and the afternoon would have
ended with "deep linking works on Moodle" written down.

**The picker rendered inside a real LMS iframe** — legible, no CSP or
`X-Frame-Options` interference, confirming the web-side header audit from a real
browser rather than a datacentre `curl`. The refusal page it rendered was
`accepts_link === false`, a branch that had never run.

**`document_targets` diverges too**, which nobody predicted: Moodle
`["frame","iframe","window"]` against lti-ri `["iframe","window","embed"]`. A
second Tier A difference on the same claim, found by reading a row rather than
by reasoning about the specification.

---

## 3. The gap the run exposed: recording stops at verification

**`lti-launch` was written as a recorder that also responds. `lti-deep-link` was
written as a request/response function.** That difference is invisible until
something fails after verification, and then it is total.

The Moodle deep-linking launch wrote `outcome = 'deep_linking_ok'`,
`error_code` null — **and the picker then refused it.** The row is truthful
about what it observed: `lti-launch` writes it the moment a request verifies and
a session is recorded, before any content selection exists. But it is **written
once and never revised**, and there is no `.update()` against
`lti_launch_skeleton` anywhere in either repo.

**Eighteen refusal paths write nothing.** Thirteen in `lti-deep-link`, five in
`/lti/select`. And the two worth naming are not the content-item ones:
`no_signing_key` and `platform_missing` are in that set, so **our own
infrastructure failing mid-flow is equally invisible.**

**Why the consequence is worse than an omission.** v8.8 §6 calls the skeleton
table an error log that is also a sales signal — *"this institution tried to
integrate and could not."* The database does not merely omit Moodle from that
query. **It counts it as a success.**

And the obvious proxy does not work. A `deep_linking_ok` with no matching
`deep_link_returned` and `consumed_at IS NULL` is **the identical signature to
an abandoned picker**, which we documented ourselves in the same runbook: *"an
abandoned picker leaves a perfectly good unconsumed session behind — that is
somebody who did not choose."* One query, two meanings, no way to separate a
hard incompatibility from a shrug.

**The fact is recorded, in the other table.** `advertises_link_content_item =
false` is correct against the Moodle platform. So `lti_capabilities` knows
Moodle cannot take our content, `lti_launch_skeleton` says the launch was fine,
and §6 reads the second one. **When those two disagree, the capability row is
the one that knows.**

**`link_type_not_accepted` is still unexercised even though Moodle triggered the
condition.** Two guards cover it and only the quieter one ran: the picker
refuses on `accepts_link === false` before anything can be submitted, so
`lti-deep-link`'s own refusal — the one that records — is never reached.

**Not fixed, and the cheap fix does not work.** `lti-deep-link` has a
service-role client and could record its thirteen. The one that actually fired
is in `/lti/select`, which has no database access by design and could not write
a row if it tried. There is a shape decision inside this, which is why it is
item 4 and not a patch.

---

## 4. The last thing outstanding, closed 2026-08-28

> **CLOSED after this section was written.** The echo is proven on the wire —
> lti-ri's confirmation page decodes our outbound response and carries
> `https://purl.imsglobal.org/spec/lti-dl/claim/data` = *"Some random opaque data
> that MUST be sent back"*, read at **00:36** — and it is now recorded rather
> than inferred. Commit `a2b5895` adds **two** booleans to the
> `LtiDeepLinkingResponse` row's `claim_presence`: `data` derived from the signed
> payload and `data_requested` derived from the session column, deliberately from
> two independent sources so a divergence between them **is** the bug signature.
> Observed `true`/`true` at **00:47:59**, with the old-shape row at **00:36:12**
> sitting beneath it as the boundary.
>
> **The negative half is still unproven and the section below still applies to
> it.** `false`/`false` needs a platform that sends no `data`. Moodle is that
> platform — confirmed null — and the sandbox is gone, so there is no rig for it
> today. A check asserting only that `data` reads `true` would pass on code that
> hardcoded it.
>
> **It travels with the Safari flip test.** §1 needs a fresh sandbox hour in
> Safari to make `state_cookie_survives` go `true → false` and produce the first
> capability flip ever observed. That is the same platform, the same hour and the
> same launch: **one deep-linking launch on Moodle in Safari closes both** — the
> flip on one row, and `false`/`false` on the response row. Two unproven things,
> one rig, and neither is worth standing the sandbox up for alone.

**The `data` echo.** Item 2 on the session's own opening list, carried over from
addendum 2 §1, and untouched after a full day. **[SUPERSEDED 2026-08-28 — done
that night. See the banner above.]**

It costs **one glance at a page already being read.** lti-ri's confirmation page
decodes our entire outbound payload, `data` claim included, and three
deep-linking runs have now read `iss`, `aud` and `message_type` off that page
without capturing that one line. Migration 259 exists for this claim; the column
earned itself; **the observability around it still has not.** **[SUPERSEDED
2026-08-28 — the observability now exists: `claim_presence.data` and
`claim_presence.data_requested`, `a2b5895`.]**

Moodle cannot close it — it sends no `data`, confirmed null, exactly as
predicted. This needs lti-ri. **[STILL TRUE, and now it reads the other way:
lti-ri closed the positive half, and Moodle is the only platform that can close
the negative one.]**

---

## 5. The reading problem, now five instances and a family

`CLAUDE.md` item 8 has held one rule for a while: **`git log` orders by graph,
not by time**, so a sibling repo's parallel commits sort above your own and read
as history.

**Three more arrived today, a fifth by the end of the night, and all five are
the same mistake.**

| the rule | the instance |
|---|---|
| `git log` orders by graph, not time | five web commits reported as predating work that came after them |
| **a diff is not a file** | a committed defect asserted from a rendering of a change; the text had been *deleted* in that commit |
| **a working directory is not a remote** | "five unpushed commits in certidemy-web" — they existed, they were pushed; only the word *unpushed* was invented |
| **a banner does not protect a mid-section reader** | two wrong assertions from `HANDOFF-v8_8-addendum.md` §5, with the closure banner four lines above the text being read |
| **a prompt is not an address** | three web-session plans sent to the supabase session in one night, each caught by the receiving session noticing it did not hold the plan being approved — never by the label |

**All five are trusting a rendering of state over the state.** A graph, a diff,
a working directory, a section, a prompt — each one is *about* the thing and
gets read *as* the thing. Every one of them was quiet: the assertion was
specific, quoted accurately, and wrong.

**Four of the five are settled by one command against the thing itself. The
fifth is not, and that is what makes it worth its own row.** There is no `grep`
for *which session holds this plan* — the state is not in either repo. It is
settled by asking, which is why it lands on the constraint below rather than on
the habit.

**Three came from the coordination chat and two from a repo-rooted session.**
`git log` orders by graph and *a working directory is not a remote* were both
the supabase session; *a diff is not a file*, the two mid-section banner reads
and the three misroutes were the coordination chat.

**That ratio is the finding, and it is not the one this section originally
drew.** The first version argued the coordination chat is most exposed because
it is furthest from the files. It isn't: **a session that could `grep` made the
same mistake just as often as the window that could not.** Being rooted in a
repo did not prevent it, because the failure is never a lack of access — it is
not reaching for it. Each of the four was settled by one command that was
available the whole time and simply not run.

**The fifth row does not change that conclusion, and the majority it creates is
not evidence for the version this section abandoned.** Three of five now come
from this window, but the two that do not were made by a session sitting in the
repo with `grep` in hand. A ratio that moves because one window kept working
later into the night says nothing about exposure; the two counter-examples still
say everything, and they are unaffected.

**So the guard is the habit — check the thing itself — not the vantage point.**
A rule that made this the coordination chat's problem would have left both
sessions unguarded, which is exactly how two of the five happened.

The chat does carry one extra constraint, as a consequence rather than an
explanation: **it has no `grep`, so where a session can verify, the chat must
ask.** That is a real asymmetry in what the remedy looks like, not in who is
prone to the mistake.

**The fifth row is the case where that constraint runs both ways.** A misrouted
prompt cannot be caught by checking a file, because the state it gets wrong —
which session holds which plan — is in neither repo. It was caught every time by
the receiving session saying *I do not hold this*, which is the same move the
chat has to make, from the other end. **Its mechanical fix is in addendum 2 §2:
the target repo goes in the first line of the prompt itself, because a label
outside the block is not carried by the block.**

And the reason it belongs in this family rather than beside it: **a session that
treats a misroute as its own memory gap will reconstruct the plan and build it**,
producing an approval trail for decisions nobody made. That is the same shape as
the other four — a specific, accurately quoted, confident wrong answer — with a
worse artifact at the end of it.

Two guards follow, and they belong with the working method in addendum 2 §2:

**`git log --oneline -5` before a doc pass.** The coordination chat writes
documents into `supabase` and tells no session it did. A session spent three
passes rewriting the very section `HANDOFF-v8_8-addendum-2.md` describes,
without knowing that file existed. The write-side rule — *don't edit another
session's document, ask* — held today only because the session asked. That
should not depend on instinct.

**Never report the sibling repo's push state.** Not "five unpushed", not "five
commits, push state unknown". The sibling session knows its own state and is the
only one that should say it. Recorded in `CLAUDE.md` item 8.

---

## 6. Everything else that shipped

**Documentation.** `LTI-SETUP.md` Part Two rewritten from four steps to eight
with two trap subsections; the deployment two-clock property recorded in Part
One step 7; addendum 1 §5 given inline supersession markers; addendum 1 §6
item 1 corrected to name `54284b8`.

**Rules, each with a worked example rather than an abstraction.** *Assert both
directions of a property* — the sharper form of verify-by-property, where the
negative half is what catches over-application. *A count from a cmdlet is a
claim, not a measurement* — `Measure-Object -Line` said 299 on a 332-line file
while `Select-String` matched at 302; resolve by reading bytes, never by
adjudicating between cmdlets. *A correction banner needs inline markers*, with
the operative test: **mark claims about the present, leave observations dated to
a moment.**

**Copy and console.** The deep-linking refusal rewritten in three locales — it
had told an instructor to phone their admin about a correctly-configured
platform, when the gap is ours. All 15 `ltiSelect` values given their accents
back; 82 keys across two namespaces had been written flat, with no policy
requiring it and no runtime cause found, and `ltiSelect` is the only surface a
stranger reads inside their own LMS. `consoleLti`'s 67 left flat deliberately.
Eight outcome enums given human labels with the identifier kept beside them.
Focus, scroll, four button states and an in-flight indicator on `/console/lti`.

**The deployment two-clock property**, which is the finding that would have been
lost. `lti-launch:371` supplies `last_seen_at` from `new Date()` in the Deno
isolate while `first_seen_at` takes migration 253's `now()` default. Two hosts,
one row, one statement. It inverts whenever the isolate lags Postgres,
reproduces on **every** new deployment row, and **the observation window closes
at the second launch** — the upsert pushes `last_seen_at` safely ahead and it is
gone for good. Observed at 54 ms and already invisible by the time it was
checked. Migration 261 is the contrast: both capability timestamps are Postgres,
so they cannot invert.

---

## 7. Found, not fixed

- **`console-kit`'s shared `primaryBtn` / `ghostBtn`** have the same gap
  `/console/lti` just closed — hover only, no `focus-visible`, no `active`, and
  `ghostBtn` has no `disabled`. Used by **every console screen**. Two constants,
  large blast radius, and `/console/lti` is now the worked example of what the
  four states should be.
- **The LTI button classes are exported from `lti-registration-form.tsx`** and
  imported by `lti-tool-config.tsx`. Verified not a cycle. A one-file
  extraction, same as `issue-mode-switch.tsx`, and it can ride with the
  `console-kit` pass.
- **`consoleLti` is now a mixed namespace** — 67 flat values and 8 new ones
  written correctly. Deliberate: writing a new key wrong to match old keys
  acknowledged as wrong is the worse option, and the rationale for leaving the
  67 is about the risk of touching shipped strings, not a house style.

**§1 supersedes three entries in the older lists**, which is the point of this
file and the opposite of leaving them alone:

- **v8.8 §10 item 1** — *"Register a real Moodle"* — done.
- **addendum 1 §6 item 2** — *"Register a real Moodle, and correct
  `LTI-SETUP.md` Part Two… moving the banner"* — done, banner moved.
- **addendum 1 §6 item 3** — *"The console pass for migration 261"* — done.

All three carry inline supersession markers where they sit. **Neither of those
lists contains `ltiResourceLink` at all**, and §1 now ranks it first, so read
§1 as the order and those lists only for what §1 does not mention.

What remains in them stands.
