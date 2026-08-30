# LTI PHASE 2 — the student launch

**Status: DECIDED 2026-08-28, NOT BUILT.** This is a design record, not a
runbook. It exists because the decision it records was deferred across three
handoffs as *"settle that on paper first"*, and the reason it kept not resolving
is that **it was never a technical question.** It is a product decision about
where an identity control belongs, and it was settled in conversation.

Read `LTI-SETUP.md` Part One and Part Two first. Phase 1 — registration, OIDC,
verification, the picker, the signed deep-linking response — is proven against
two platforms. This file is about what happens when a **student** clicks the
thing an instructor planted.

---

## 1. The decision that shapes everything else

**Most LMSs let an administrator sign in as a student.** Moodle has it, Canvas
has it, it is a normal support feature and it is not going away.

**That the impersonation is possible is the ISO/IEC 17024 gap. Not that it is
likely.** No teacher is going to log in as a learner and sit their exam. An
auditor does not care — they care whether the control exists. A session minted
from an LTI launch inherits whatever identity the platform asserted, and the
platform's admin can assert anyone.

So:

> **The identity control sits at the moment of assessment and nowhere else.**

Everything upstream of the exam can be convenient, because **nothing upstream of
the exam produces a credential.** Lessons, practice, module tracking, readiness —
an impersonating admin who reaches those has achieved nothing worth auditing.

**The exam is different, and it is the only thing that is.** It breaks out of the
LMS entirely: a fresh top-level navigation to `certidemy.com` and a real login,
every time, with no exception and no remembered session carried across.

---

## 2. What a launched student gets

**The whole app.** This is not an exam wrapper.

Lessons, practice questions, module progress, the readiness check — the product.
A student launching from their course lands in it with a real account and real
progress that persists. **The account is the point**, and it is worth saying
plainly because the obvious wrong turn is to build a thin viewer and call it an
integration.

What they do NOT get from the LTI session is the exam. That is one door, and it
is locked from this side.

---

## 3. The three paths

### Email present — the normal path, and it is invisible

Moodle released `sub`, `name`, `email`, `roles` and `context_title` on **every**
launch observed 2026-08-27, from a tool configured with default privacy. **The
withheld case is the exception, not the default.**

So: **find or create a profile by email, link `(platform_id, sub)` to it, mint a
session, land them in the app.** No signup screen. No password prompt. No
Certidemy login at all. They click the activity in their course and the product
is simply there.

**An existing profile with that email is LINKED, not refused.** A student who
bought a voucher herself last year and later launches from her university's
Moodle is the same person, and making her resolve a collision would be a worse
product for no security gain — the impersonation risk it would guard against is
already handled at the exam.

### Email absent — two doors, never a dead end

Nothing to create a profile from. The launch renders a page that offers **both**:

1. **Ask your administrator to enable it** — name the setting. The reader is a
   student who cannot fix this, so the page has to give them something to
   forward.
2. **Create a Certidemy account** — a button that breaks out to
   `certidemy.com` signup in a new tab. They sign up, return to the LMS tab,
   click the activity again, and this launch links by `sub` and lands them in
   the app.

**A self-supplied email with a password the student set is a STRONGER link than
a platform-supplied one**, since the platform-supplied one is an assertion by a
system whose admin can impersonate. The privacy-strict institution ends up with
better identity than the default one.

**Never invent an address.** `profiles.email` is `NOT NULL UNIQUE` and feeds
`credentials.holder_email`, which is hashed into a signed credential. A synthetic
address for a withheld email produces a real-looking `sha256$` claiming an
identity nobody ever recorded — the same defect already caught once on the OB2
route as `holder_email ?? ""`.

### The exam — always a breakout, from either path

Full top-level navigation to `certidemy.com`, real login, always.

---

## 4. Why signup breaks out instead of rendering in the frame

**A password field inside someone else's LMS chrome is the shape of a phishing
form.** That is not a metaphor — an unexpected credential prompt, embedded in a
frame, on a domain the user did not navigate to, is precisely what security
training teaches people to distrust. The students who hesitate are the ones you
would rather had.

The breakout gives a full window, `certidemy.com` in the address bar, our own
design system, and room to say what Certidemy is before asking for anything. In
a 600px Moodle modal you get none of that, and this is an institution's
student's first impression of a certification body.

It is also **one rule instead of an exception.** The exam breaks out because the
frame cannot be trusted for identity. Signup is identity. *"We take passwords in
the frame except for exams"* is the kind of inconsistency that reads as
carelessness to anyone paying attention.

And it is less to build: no signup form in an LTI surface, no password handling
in the frame, no second place where account creation lives.
`app/lti/select`'s own header calls an LMS iframe **"the most hostile rendering
context we ship to."** Do not put signup there.

**Cost:** one extra round trip, once, on a path that only exists for institutions
with strict privacy settings.

---

## 5. The consequence that has to be built for

**A silently provisioned student has an account with no password they ever set.**
They will not discover this until the exam breakout — which is the worst possible
moment, because they will meet a login form for an account they do not know they
have, and the only way through is to guess that "forgot password" is the answer.

**The exam breakout must detect a passwordless profile and say so directly:**
*set your Certidemy password to continue.* Same mechanism as forgot-password,
one screen instead of a dead end.

That screen doubles as account claim. There is no separate invite flow to build,
and **no password email is ever sent at launch time** — an emailed set-password
step turns a click into a chore and most students never complete it.

---

## 6. What this does NOT need

Recorded because these were all named as phase 2 work in earlier handoffs, and
the decision above removes or shrinks them:

- **No entitlement model.** A launched student is entitled to the app. The exam
  is gated by login and voucher, both of which already exist and neither of
  which is LTI's business.
- **No LTI-minted exam session.** Deliberately impossible.
- **No synthetic email handling.** The withheld case is refused with two doors,
  never papered over.
- **No signup UI inside any LTI surface.**
- **Vouchers are out of scope.** Whether the institution or Certidemy issues and
  controls them is a commerce decision, separate from this, and it does not
  block anything here.

---

## 7. What it does need

Not a build plan — the build session writes that. This is the surface area:

- `lti_users` on `(platform_id, sub)`, mapping an LMS identity to a `profiles`
  row. `sub` is unique only within a platform and **may be absent entirely**;
  Canvas reportedly emits different values per placement. See `HANDOFF-v8_8.md`
  §6.
- **Programmatic user creation** — zero occurrences in either repo today.
- **Server-side session minting** — same.
- The resource-link branch in `lti-launch`, currently
  `resource_link_unsupported`, which is **correct telemetry rather than a
  failure** and will need to stay distinguishable from real refusals.
- The passwordless-profile detection on the exam breakout (§5).
- The email-absent page (§3), in three locales, rendered in a hostile frame.

**And it is gated on `ltiResourceLink`**, which is the item above it: an
`ltiResourceLink` content item points back at our own launch URL, so building it
without this is shipping a link that lands a student on a refusal page inside
their own course. The two ship together or neither does.

---

## 8. The spike — OBSERVED 2026-08-28, on the wire, against the live project

§7 named two primitives as zero-occurrence and the build was gated on them. Both
are now settled by observation rather than by reading a `.d.ts`, because this
project has already paid for the difference between *reviewed and looked fine*
and *seen on the wire*.

### `generateLink` does NOT send mail

**The question that could have changed the design's shape.** §5 requires that
**no password email is ever sent at launch time**, and a minting path that
emailed every student would have broken that and, worse, hit the email rate
limiter partway through a class of thirty.

Six `POST /auth/v1/admin/generate_link` calls in about one second, all 200, **no
rate limiting** — a limiter exists to protect a mail sender and it never engaged.
A seventh to a different address also succeeded immediately, so it was not
per-address bucketing. **Then confirmed at the inbox: zero messages**, spam and
trash included.

### `*_sent_at` IS STAMPED WHETHER OR NOT MAIL IS DELIVERED

**This is the trap in the finding, and it points the wrong way.** Every call
moved a timestamp: `confirmation_sent_at` on creation, `recovery_sent_at` on
each call after. Eight stamps, zero emails.

Those columns record **token issuance, not delivery** — and they are precisely
the field someone would reach for to answer *"was this person emailed?"*. Every
LTI-provisioned student will carry a populated `confirmation_sent_at` having
never been written to.

**So this is a second, independent reason the passwordless flag must be our own
column** (§5, and the decision that it is set at provisioning time). The auth
table is not merely insufficient here: it holds a field that looks like the
answer and is not one. There is no check to fall back to, and now there is
something that could be mistaken for one.

### The chain, observed

```
POST /auth/v1/admin/generate_link  {type:"magiclink", email, redirect_to}
  -> 200   hashed_token 75db32b6...   verification_type magiclink

POST /auth/v1/verify  {token_hash, type:"magiclink"}      [ANON key]
  -> 200   access_token (ES256) + refresh_token
           email_confirmed_at 2026-08-28T22:42:56Z

same token again
  -> 403   otp_expired  "Email link is invalid or has expired"
```

**The token is single-use.** That matters more here than in an email flow: this
one travels through a redirect inside an LMS frame, and a replayable mint would
be a session anyone in the frame's history could take.

**Verification succeeds with the ANON key**, which is what a browser carries — so
`/auth/confirm`'s `createServerClient` path works unchanged. The only edit
needed there is `ALLOWED_TYPES`.

### `email_confirmed_at` is set at REDEMPTION, not at creation

It was null after `generate_link` and populated by `/verify`. **This is why
provisioning is two calls, not one.** `generateLink` will create the user itself
for `signup`, `invite` and `magiclink` — but a one-call design leaves the
student unconfirmed until they complete the hop, and collapses *"account created,
mint failed"* into *"nothing happened"*, which is a state the second skeleton row
could not describe. Two calls set `email_confirm: true` explicitly, and
`options.data` reaches `raw_user_meta_data` where `handle_new_user()` (072)
already reads `full_name`.

### One value, three names

| where | name |
|---|---|
| `action_link` query string | `token` |
| `generate_link` response body | `hashed_token` |
| `verifyOtp` parameter | `token_hash` |

And the raw API takes `redirect_to` where the SDK takes `options.redirectTo`.
Nothing is wrong with any of them; they are simply four spellings of two things,
across one hop.

### `ALLOWED_TYPES` is intent, not defence

`app/[locale]/auth/confirm/route.ts` whitelists the OTP types it will redeem.
Adding `magiclink` is required and costs nothing, **and nobody should later
reason about it as a security control.** A `token_hash` is a bearer secret
redeemable at Supabase's own `/verify` regardless of what our route accepts. The
list narrows what our route is *for*; it stops no attack.

### Cost of the spike

Two `auth.users` rows, both deleted 2026-08-28, verified in both directions:
the ids absent, no `ltispike` address in either table, and both counts down by
**exactly two** — 33 to 31, matching the 31 observed before the first call. The
`profiles` cascade fired.


---

## 9. The second launch, and why the launch wins

**The common case, and the one nothing had been designed for.** A student opens
the activity again next week. `sub` hits `lti_users`, `last_seen_at` is bumped, a
session is minted, and they are in. No lookup, no provisioning.

Four sub-cases carry decisions rather than behaviour:

**They are already signed in as someone else. THE LAUNCH WINS.**

This is the one worth writing down, because the alternative is defensible and
somebody will ask. Deferring to the existing session sounds respectful and is
worse: **on a shared machine it would show one student another student's
dashboard.** The platform has just asserted who is opening this activity, the
student expects their own course to open as themselves, and a silent switch to
the correct person beats a silent failure to switch away from the wrong one.

**The LMS address changed. We do not follow it.** `sub` still resolves to a
user, so the session is minted for the account we already know, and the
divergence is recorded as `student_email_mismatch`. Email is the identity, and
rewriting it silently MOVES AN ACCOUNT.

**`student_email_mismatch` is a SIGNAL, NOT A REFUSAL.** The student still gets
in. Filing it as a failure would make the console lie in the other direction --
a working launch recorded as broken -- and an institution changing a student's
address mid-course is something to SEE rather than infer later from a support
ticket. It replaces `student_linked` for that launch rather than accompanying
it: one row, most specific outcome.

**A second institution.** Different `platform_id`, so a miss, resolved by email
to the same profile, and a second `lti_users` row. Correct with no special
handling -- the same mechanism that makes Canvas's per-placement `sub` harmless
whenever an email is present.

**Volume.** A session is minted on every launch, and Moodle's Embed container
fires a launch on every activity VIEW. Token count will exceed student count by
a large factor. It is not a sign-in count.

---

## 10. The obvious reading keeps being wrong

**Five things in this feature read as something they are not.** Listed together
because separately each looks like a local quirk, and the pattern is the point.

1. **`ALLOWED_TYPES` reads as a defence.** It is intent. A `token_hash` is a
   bearer secret redeemable at Supabase's own `/verify` regardless of what our
   route accepts. The list says what the route is FOR; it stops no attack.

2. **`password_set` reads as a control.** It gates a MESSAGE. The exam is gated
   by login and voucher. Someone who lies to skip their own reminder meets a
   login form instead of a helpful sentence, and has gained nothing.

3. **An unsubstituted claim reads as a value.** `$Person.email.primary` comes
   back as its own literal -- present, a string, and not data. `profiles.email`
   is NOT NULL UNIQUE, so a truthiness check would have SUCCEEDED in creating an
   account named after a variable, and fed it to `credentials.holder_email`.
   That is `holder_email ?? ""` with a longer string; the empty one was caught
   because it was empty.

4. **`*_sent_at` reads as proof that an email was sent.** It records token
   issuance. Eight stamps, zero emails, observed 2026-08-28. Every
   LTI-provisioned student carries a populated `confirmation_sent_at` having
   never been written to.

5. **`verify_jwt = true` on the provisioner read as a boundary.** It refuses
   anonymous callers, and the only credential that gets past it is the
   service-role key -- which can call `auth.admin.createUser` directly. It would
   have refused strangers from doing something strangers already cannot do.

**THE FIFTH DID NOT COME FROM THE CODE. It came from this document, an hour
before it was written down.** It was proposed in a plan, approved as a
decision, and had a well-formed sentence explaining it. That sentence was the
problem: it was about a gateway setting that does not do the work attributed to
it, and it survived a plan and an approval before anyone checked.

That is why the list is worth keeping. **Four found in the code would read as a
caution about the code.** Five, with one written into a decision that had
already been agreed, is a caution about the reasoning -- and specifically about
this feature, which keeps producing readings that sound right and are not.

A plausible sentence is exactly what a wrong one feels like from the inside.

---

## 11. What has been proven, and by whom

**Two launches on 2026-08-29 took the whole path**: verified RS256 launch ->
resolve or provision -> `generateLink` -> redirect -> `verifyOtp` -> seated
session in the app. **1.13 seconds** from the first skeleton row to
`last_sign_in_at` on the first one.

    00:23:35.501  resource_link_ok        row one, at verification
    00:23:36.213  student_provisioned     row two, 712ms later
    00:23:36.633  last_sign_in_at         the token was redeemed

    00:46:47.777  resource_link_ok
    00:46:48.195  student_linked          the FAST PATH, first time it ran
    00:46:48.473  last_sign_in_at         minted again, no new account

`password_set = false` is the first value that column has ever held. `full_name`
reached `profiles` through `user_metadata` and `handle_new_user` with no extra
write. `lti_link_tokens` stayed empty, correct for a launch that had an email.
No mail was sent at any point, which section 5 requires.

### THE THIRD LAUNCH WAS THE ONE THAT MATTERED, AND NOBODY PLANNED IT

At **00:29:07**, between the two above, a colleague on a conference call ran the
same lti-ri launch **from a different house, on a different PC, on a different
network, as a different person, on a machine we do not control.** It provisioned
nothing new and seated them correctly, taking the fast path by `sub`.

**It was not set up as a test. Someone on a call just ran it.**

That makes it the strongest evidence phase 2 has, and it is worth being precise
about why. Every other proof in this file and in `LTI-SETUP.md` was **one
machine, one browser, one network, one person** -- the person who wrote the
code, on the machine it was written on, with that machine's cookies, clock,
extensions and DNS. A great many integration bugs live exactly in the gap
between that and anyone else.

**This is what a real student launch looks like**: someone who did not build it,
somewhere else, clicking a link in a course. It is the closest thing to an
institutional test this has had, and it arrived by accident.

### THE DISCRIMINATOR WAS A PERSON ON A CALL, NOT SOMETHING IN THE DATABASE

That third launch also caused, and then resolved, the closest thing to a wrong
turn in this work.

The first launch wrote a row whose `last_seen_at` was 13ms EARLIER than its
`first_seen_at` -- two clocks, one row (see migration 263). A generic check was
written to catch that class of defect. Run against the live table, it reported
**success**, over a row believed to be inverted. The conclusion drawn was that
the check was broken, and a replacement migration was drafted.

**The check was fine.** The colleague's launch at 00:29:07 had run under the old
writer, whose fast path set `last_seen_at` from the edge function's clock -- and
five and a half minutes of elapsed time makes 13ms of skew irrelevant. **The row
had already healed.** The check reported zero because zero was true.

**Nothing in the database recorded why.** The skeleton row at 00:29:07 says a
launch happened; it does not say it was somebody else, and there is no column
where that would have gone. The row's own timestamps had been rewritten by the
event being investigated.

The replacement migration would have been written, would have "worked", and
would have enforced a condition that was already true -- and nobody would ever
have learned it was unnecessary.

**What generalises: a system with more than one actor produces state changes its
own records cannot explain.** The temptation is to explain them from the code,
because the code is what is in front of you and it is legible. The cheaper
question is who else was in it. Here the answer was one sentence from someone on
the call, and it settled in a moment what no amount of reading the DO block
could have.

---

## 12. Door two is BUILT AND UNPROVEN

Everything in section 3's second door now exists: the launch mints a token, the
page offers it, signup carries it, and `/auth/callback` consumes it. **No
launch has ever taken that path**, because the only rig that has exercised phase
2 is the 1EdTech reference implementation, and it releases `sub`, `name` and
`email` on every launch. It has no withheld case to produce.

### What must be proven, stated before the run rather than after

**THE ASSERTION IS THE SECOND LAUNCH.** Door two closing means the student stops
meeting door two. Concretely, after a successful link:

1. the next launch presents the same `sub`
2. it HITS `lti_users` and takes the fast path
3. the skeleton pair reads `resource_link_ok` then **`student_linked`**
4. **no new account is created** -- `profiles` and `auth.users` counts unchanged
5. the student is seated in the app

**`student_linked` rather than `student_provisioned` is the whole result.** A
launch that provisions a second account has not closed the door, it has papered
over it -- the student would have two accounts, one per launch, and nothing
would error.

Also to observe: `lti_link_tokens.consumed_at` set exactly once, and the token
refused on a replay.

### The test must be a platform withholding, not a payload stripped

**Turn the privacy settings OFF on the Moodle sandbox tool.** A doctored
payload would prove the code path and not the situation: what is being tested is
that a real platform, configured the way a privacy-strict institution configures
it, produces a launch we can still do something honest with. The two are not the
same claim, and only one of them is what an institution will do.

It also gives the frame test for free, which lti-ri cannot provide at all.

### THREE UNPROVEN THINGS NOW SHARE ONE SANDBOX HOUR

The Moodle sandbox resets on the hour, so anything needing it needs a sitting.
Three things are now waiting on the same one:

1. **Door two** -- the above, with privacy turned off.
2. **The Safari flip on `state_cookie_survives`** -- the `false` branch of that
   tri-state has never been observed anywhere. Chrome allowed the cookie in a
   genuine third-party iframe, 4 of 4. See `LTI-SETUP.md` Part Two step 7.
3. **`false`/`false` on the `data` echo** -- proving the NEGATIVE half of
   migration 259's claim_presence pair needs a platform that sends no
   `deep_linking_settings.data`, and Moodle is that platform. A check asserting
   only that `data` reads `true` would pass on code that hardcoded it.

**They are listed together because they are one booking, not three.** Each is
cheap once the rig is up and none of them is reachable without it.
