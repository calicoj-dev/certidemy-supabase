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

## 5b. NO GRADE PASSBACK. Deliberately, and for now.

**There is no AGS anywhere: no line items, no scores, no gradebook column.** An
instructor who plants a Certidemy activity gets no grade back into Moodle, and
nothing in either repo has ever pretended otherwise.

**It is written here because silence reads as an oversight.** It is the first
thing a Moodle instructor asks about an external tool, and until now this
document simply did not mention it — which leaves the next person to discover it
from a support ticket rather than a design note. Saying "not built, on purpose"
is a position somebody can disagree with. Saying nothing is not.

**Why it is defensible today.** What a Certidemy credential attests is an exam
sat under our own conditions, not coursework completed in someone else's LMS. A
number posted into a partner's gradebook is a claim on the partner's surface
about a candidate's performance, and the claims discipline in `certidemy-web`'s
CLAUDE.md already refuses the smaller version of that: **never state an exam
score outside the holder's own surfaces** — `list-credentials` and
`get-company-detail` both decline to. AGS would be exactly that refusal
reversed, so building it is a claims decision before it is an engineering one.

**What an instructor should expect instead:** students launch, land in the
certification's learn area, and their progress lives on Certidemy. Verification
is the credential itself, at its public URL.

**If it is ever built**, the honest shape is completion or credential-issued as
a pass/fail line item, not an exam percentage — and it wants its own review
against the claims policy, not an afternoon.

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

## 12. Door two is CLOSED — proven 2026-08-30

> **OBSERVED, IN ORDER, ON A REAL WITHHELD-EMAIL LAUNCH:**
>
> ```
> 03:09:47  token minted
> 03:10:52  consumed_at set, attempts 1, last_error null
> 03:10:52  lti_users row: sub 2 -> info+door4@certiglobal.org
> 03:13:19  resource_link_ok
> 03:13:20  student_email_absent      (launch predates the link)
> 03:14:10  resource_link_ok
> 03:14:10  student_linked            (the door closing)
> ```
>
> `identities = 1`. **No second account.** That is the whole assertion as it was
> written below before the run: `student_linked` rather than
> `student_provisioned`, `consumed_at` set exactly once, and the student seated
> without a duplicate.
>
> The 03:13:20 `student_email_absent` is not a failure — that launch was fired
> before the link existed and correctly found nothing. It is the control: the
> same rig producing the old outcome one minute earlier is what makes 03:14:10
> evidence of the link rather than of a code change.

**What it took, and none of it was the cause first written down.** Three
defects, each independently sufficient, fixed in this order:

1. the consumption asked `getSession()` for a session written to the *response*;
2. it lived in `/auth/callback`, which email confirmation does not reach — and
   could not fire on the OAuth path either, because the Google button is a
   separate `<form>` and the token stopped at it;
3. `signupAction`'s `emailRedirectTo` and the Supabase **Confirm signup**
   template were a mismatched pair, the template still being the stock
   `{{ .ConfirmationURL }}` while recovery had been migrated long ago.

Details of 2 and 3 live in `certidemy-web`'s `CLAUDE.md` (Auth, and item 8's
fifth pair, which records both templates verbatim because the dashboard keeps no
history).

### 12b. CANDIDATE B IS DEAD, BY MEASUREMENT — read 2026-08-30

**`NEXT_PUBLIC_EDGE_FUNCTIONS_URL` IS SET IN THE CLOUDFLARE ENVIRONMENT.** The
successful run carried `lti_diag=t1b1` in the address bar: token present, and
the **raw** variable present, read before any fallback because a fallback
destroys the measurement. Candidate B was never the cause.

**It stayed open across two sessions and two repos on nothing but inference**,
and it was cheap to close the whole time — one line recording two booleans. Both
sessions argued about it instead, and one of them (this file, below) wrote that
it had been excluded by measurement when nothing had measured it. **The variable
was readable at any point by anyone willing to print it.**

**Candidate A was never isolated, and this is not the section to claim it was.**
The `t1b1` read happened after the `getSession` fix was already deployed, so what
`getSession()` *would* have returned at 01:13 has not been observed and now
cannot be. Defect 2 above was independently sufficient, and so was defect 3, and
all three were fixed before the successful run. **Three fixes, one green result,
no attribution** — which is the honest end state and worth more than a tidy one.

> **AND THE SEARCH THAT "FOUND NOTHING" WAS LOOKING IN THE WRONG BROWSER.** A
> `chrome://history` search for `lti_diag` came back empty and was read as
> evidence the branch never ran. The Moodle tabs run in a **different Chrome
> profile signed into a different Google account**, so the confirmation clicks
> were never in the history being searched. The history was accurate; it was
> the wrong history.
>
> Same family as *a diff is not a file*, *a working directory is not a remote*,
> *a filtered view is not the state*, and *a title is not a URL*: **a rendering
> of state read as the state.** The new form is that the rendering was correct
> and complete — about a different subject. Before reading an absence as
> evidence, check that the instrument was pointed at the thing.

### 12c. The original diagnosis, kept because it was wrong in an instructive way

**The measured fact, and it is the only one:** `lti-consume-link-token` was
**never invoked.** Not a failed call, no call — the edge function logs are empty
for it across the entire window. Whatever went wrong happened before the fetch,
inside this branch of `/auth/callback`:

```ts
const { data: s } = await supabase.auth.getSession();
const token = s.session?.access_token;
const base = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL;
if (token && base) { ...fetch... }
```

**Candidate A — `token` is falsy. The web session's finding, and the stronger
of the two.** `exchangeCodeForSession` had just run **in the same request**, so
`getSession()` asks a cookie store for a session that was written to the
*response*, not the request. The discriminator is real: the sibling probe at
`auth/actions.ts:253` uses the identical shape and **works** — because that user
was already signed in when it ran. Same code, different precondition, opposite
outcome.

**Candidate B — `base` is falsy.** `NEXT_PUBLIC_EDGE_FUNCTIONS_URL` is read with
no fallback here, one of four such sites out of thirteen in `certidemy-web`
(recorded in that repo's `CLAUDE.md`). If the variable is unset in the
Cloudflare environment, `base` is `undefined` and the guard never fires.

**NEITHER HAS BEEN EXCLUDED, AND NOTHING HAS READ THE CLOUDFLARE
ENVIRONMENT.** An earlier note in this record said measurement had ruled the env
var out. **It had not** — no measurement of that variable exists. The counts
that were read concern migration 264's new columns and say nothing about it.

**They are not mutually exclusive, and that is the trap:**

> **If `token` is falsy the fetch never happens regardless of `base`.** So
> adding the fallback on `base` would fix nothing while looking exactly like the
> fix — the code would read correctly, the guard would still not fire, and the
> next failed launch would be blamed on something else.

**One read separates them.** At that branch, record the two booleans
independently — `!!token` and `!!base` — on the next confirmed signup. They are
two facts and one line, and either can be false without the other.

Migration 264 exists for the same reason at the durable layer: `attempts = 0`
with `last_attempt_at` null says *nobody tried*, which is ours, and is
distinguishable from a recorded refusal, which is the token's. **Note it is not
yet written by anything** — the columns exist and no code sets them.

**Attribution, because it decides who fixes it:** candidate A is the web
session's, from reading the auth flow. Candidate B is the supabase session's,
inferred from the fallback divergence and circumstantial. The fix belongs with
the web session, which owns `auth/callback/route.ts` and `auth/actions.ts`.

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

### TWO UNPROVEN THINGS SHARE ONE SANDBOX HOUR

The Moodle sandbox resets on the hour, so anything needing it needs a sitting.
Door two was the third and is **done** (§12); two remain:

1. ~~**Door two** -- with privacy turned off.~~ **PROVEN 2026-08-30, §12.**
2. **A `false` on `state_cookie_survives`** -- that ONE KEY has never read
   `false` anywhere: **30 of 30 on Moodle, 13 of 13 on lti-ri.** Chrome allows
   the state cookie even in a genuine third-party iframe, and Safari is the only
   known path to a `false`. **[CORRECTED 2026-08-30 — this item used to say "the
   Safari flip", as though the capability flip in general were unobserved. It is
   not: three keys flipped on Moodle the same day, from door-two privacy
   toggling. See §13. What remains open is this key and nothing wider.]**
3. **`false`/`false` on the `data` echo** -- proving the NEGATIVE half of
   migration 259's claim_presence pair needs a platform that sends no
   `deep_linking_settings.data`, and Moodle is that platform. A check asserting
   only that `data` reads `true` would pass on code that hardcoded it.

**They are listed together because they are one booking, not three.** Each is
cheap once the rig is up and none of them is reachable without it.

---

## 13. Embed renders the LOGIN PAGE — the frame holds the launch, not the session

**Observed 2026-08-30. Moodle, Chrome, a real third-party iframe.**

```
Embed launch      -> Certidemy renders in the frame -> LOGIN PAGE
                     "Welcome back, log in to continue your study plan"
New window, same activity -> works, student lands in SM-AI-I
state_cookie_survives      true, 29 of 29, changed_at null
```

### The launch SUCCEEDED, and that is what makes this bad

This is not a launch failure. The OIDC handshake completed, verification passed,
provisioning ran, the session was minted. **The student has a real account and a
real session, and the browser will not send it back.** They are looking at a
login form for an account they already have, inside their own course, having
done nothing wrong.

An institution that chooses Embed — the setting `LTI-SETUP.md` Part Two step 5
calls "the configuration a real institution is most likely to use" — gets this
for every student.

### The auth cookies are `SameSite=Lax` — CONFIRMED by direct read

**FINDING, not hypothesis. Observed 2026-08-30**, DevTools -> Application ->
Cookies, on the framed login document at `certidemy.com/en/login`:

```
sb-pctynukndxnmnx...  (x2)   SameSite = Lax     <- the Supabase SSR auth cookies
certidemy_consent            Lax
certidemy-theme              Lax
NEXT_LOCALE                  Lax
_shopify_y                   Lax
```

**The auth cookies are PRESENT AND READABLE in that frame. Not blocked, not
absent, not evicted.** They exist on the origin and the browser simply does not
send them on a cross-site iframe request, because `Lax` says not to. Nothing is
broken; a default is doing exactly what it says.

That single fact is the whole explanation and it needs no comparison to anything
else.

### DO NOT WRITE THIS AS "ONE COOKIE SURVIVED AND THE OTHER DID NOT"

**`certidemy_lti_state` does not appear in the list above, and its absence there
is not evidence of anything.** It is scoped `Path=/lti`; the inspected document
is `/en/login`. It is out of scope for that path, so DevTools was never going to
show it.

**Its `SameSite` attribute has never been read.** What is known about it comes
from somewhere else entirely: `state_cookie_survives` is measured **server-side**
at `/lti/launch`, by comparing `body.state_cookie` to `state`. Never in a
browser, never in DevTools, never on the same document as the read above.

**So the two facts were established by different instruments, at different
layers, on different documents.** The sentence that merges them — *"the state
cookie survived the frame and the session cookie did not"* — reads as one
observation of two cookies and is actually two observations that were never
compared. It is a tidier story than the evidence supports, and it is the kind
that survives because nobody re-derives it.

**What can honestly be inferred, marked as inference:** a `Lax` cookie is not
sent on a cross-site POST, and an LTI launch is a cross-site POST. So a state
cookie that survived 29 of 29 launches is very unlikely to be `Lax` — the
behaviour implies `SameSite=None`. **That is inferred from what it did, not read
from what it is**, and it is not needed for the finding above. Confirm it by
reading the attribute if it ever matters; do not assume it because it appears
here.

### DECIDED 2026-08-30 — option 3, the honest interstitial

**In the frame, we render one screen that says why and offers a button that
breaks out.** Not a silent redirect, not a cookie change, not a documented
refusal.

**THIS IS NOT A CERTIDEMY PROBLEM, AND THAT IS THE POINT.** It is the defining
problem of the LTI tool ecosystem, and **the standard explicitly declines to
solve our half of it.**

1EdTech built **LTI Platform Storage / Client Side postMessages** for exactly
this shape of failure — Safari blocking cookies in third-party iframes made a
workaround necessary for storing state between login and launch, and Canvas
implements it. **But that solves the STATE cookie**, which we already have
working at 30 of 30 on Moodle and 13 of 13 on lti-ri.

A developer on 1EdTech's own forum described our situation exactly: cookieless
auth working for the initial request, and afterwards **the application's own
session cookie blocked so the user cannot navigate the tool.** An 1EdTech
architect answered that **LTI does not describe how tools and platforms work
outside the LTI interaction**, so the cookieless solutions give no guidance on
cookies within a tool's own system.

**So the session layer is out of scope for the standard, by design, and every
tool solves it itself.**

**What tools actually do.** 1EdTech's own guidance to institutions is that
platforms can set a link to launch in a new window, **which allows the tool to
be used even if the experience degrades.** Qwickly, a commercial LTI vendor,
tells its customers the same: configure a new window and the tool stops being
third-party. And Chuck Severance predicted the split years ago — large tools pop
themselves out of the iframe; small widgets carry state in parameters and use no
cookies at all. **We are the first category.**

**Which is what settles it between 2 and 3.** Option 2 does what the ecosystem
does, silently. Option 3 does the same thing and tells the instructor why. The
break-out is not a workaround we are embarrassed by — it is the documented
behaviour of large LTI tools, recommended by the standards body — so there is no
reason to perform it behind the reader's back.

**And option 1 is the one nobody recommends.** Not merely constrained by §1 and
§4 below: it is absent from every piece of ecosystem guidance found, because
making a product's session cookie third-party-readable everywhere to serve one
embedding context is not what anyone does.

### FOR THE CERTIFICATION CONVERSATION

**We do NOT implement LTI Platform Storage, and we do not need it.** A reviewer
may ask, and the honest answer is two sentences: our state cookie survives the
third-party frame — measured, 30 of 30 and 13 of 13 — so the problem Platform
Storage exists to solve does not arise for us; and the session layer it does not
cover is out of scope for the specification by its own architects' account.

**Do not offer to implement it to look thorough.** It would be building a
workaround for a failure we do not have.

### The four rejected options — kept, not deleted

Recorded so the decision can be re-argued rather than re-discovered.

1. **Session cookies to `SameSite=None; Secure`.** Works in the frame. Makes
   them third-party cookies **everywhere**, subject to Chrome's phase-out and
   already blocked by default in Safari, and widens CSRF surface. **Note the
   scope: the read above found the SSR auth cookies are `Lax` along with every
   other cookie at that path — so this is not a one-line override on one cookie,
   it is a change to how the Supabase SSR client writes the session for the
   whole product, to serve one embedding context.** **[REJECTED — and it is the
   one option no ecosystem guidance recommends, not merely the one this document
   argues against.]**
2. **Break out of the frame on launch.** Top-level navigation into the learn
   area, the same move the exam already makes. **[REJECTED — right behaviour,
   wrong manners. It is what the ecosystem does and what option 3 also does; it
   just does it without telling the instructor why their Embed setting did not
   hold.]**
3. **An interstitial in the frame** — one honest screen saying why, one click
   out. The middle ground, and the only option that respects the instructor's
   setting while telling the truth about it. **[CHOSEN 2026-08-30 — see above.]**
4. **Document Embed as unsupported**, tell institutions to set New window.
   Cheapest, worst product, and it contradicts step 5 of the runbook.
   **[REJECTED — it makes the institution do the work and still leaves the
   student staring at a login page if they miss the note.]**
5. **Storage Access API** — request storage access from inside the frame. Real,
   needs a user gesture, and support varies. **[REJECTED — a user gesture is
   already required to break out, so this buys a worse-supported path to the
   same click.]**

**THIS DOCUMENT HAS ALREADY DECIDED THIS QUESTION TWICE, AND THAT NARROWS IT.**

§1: the exam always breaks out, because a session minted in a frame inherits
whatever the platform asserted. §4: signup breaks out because *"the frame cannot
be trusted for identity"*.

**A session cookie is identity.** Option 1 is the only one that argues against
the rule the rest of this file is built on — it makes our session cookie
readable in every third-party context on the web to fix one of them. Options 2
and 3 are what this document already says everywhere else.

That is not a decision. It is a constraint on the decision: **option 1 needs an
argument against §1 and §4, not merely an argument for itself.**

### The observability problem: the metric was GREEN on the runs that failed

`state_cookie_survives` read **`true` on 29 of 29 launches — including the
embedded ones that landed on the login page.**

**The name is accurate and the measurement is correct.** It compares
`body.state_cookie === state` at `/lti/launch` and answers one question: *did
our OIDC handshake survive the frame?* That is genuinely useful, and it is why
deep linking works embedded at all.

**The problem is the inference it invites.** Anyone reading `true, 29 of 29`
concludes that cookies work in this frame. They do not — *one* cookie works. The
metric's scope is narrower than its name, and the two diverged on real data on
the first day the difference mattered.

**This is not the item-8 family.** Nothing here is a rendering read as the thing;
the reading is honest and the value is right. It is narrower and more ordinary:
**a measurement whose name is broader than its scope, in a table built to be read
at a glance.** The tri-state discipline protects absence from being read as a
*no*. It does not protect a small *true* from being read as a large one.

**Not fixed.** When it is, the shape is a second key — `session_cookie_survives`
— rather than a rename: the 29 observations are real observations of exactly what
the name says, and renaming would orphan them.

### And the flip STILL has not happened

**29 of 29 `true`. `changed_at` null, `previous_value` null. On every key, on
every platform.** The `varies` styling and the flip line have never rendered
against real data, and 261's columns remain correct-and-unexercised.

**Safari remains the only known path, and it stays on the list above.**

> **[CORRECTED 2026-08-30 — THE FLIP HAD ALREADY HAPPENED, HOURS EARLIER, AND
> THIS PARAGRAPH WAS WRONG WHEN WRITTEN.]**
>
> Three keys on the Moodle platform, from `lti_capabilities`:
>
> ```
> releases_email           true   20 / 10   changed_at 2026-08-30 04:18:49
> releases_name            true   24 /  6   changed_at 2026-08-30 02:10:33
> custom_vars_substituted  true   15 /  4   changed_at 2026-08-30 04:21:42
> ```
>
> `changed_at` and `previous_value` are populated, both counters are non-zero,
> and **the `varies` styling has therefore rendered against real data.**
> Migration 261's columns are exercised, not merely correct.
>
> **It was not Safari. It was door two.** Toggling Moodle's privacy setting on
> and off to test the withheld-email path flips `releases_email` and
> `releases_name` directly. The flip was produced by the testing, hours before
> anyone looked for it.
>
> **WHAT SURVIVES IS NARROWER AND MUST BE STATED AS THAT:**
> `state_cookie_survives` **specifically** has never read `false` — **30 of 30
> on Moodle, 13 of 13 on lti-ri.** Safari is still the only known path to that
> one key. "The flip" is closed; "the state cookie has never been dropped" is
> not.
>
> **How the wrong claim survived, because it is the rule this file already
> carries:** it was asserted repeatedly from a query that only ever asked about
> `state_cookie_survives`. The query was accurate, complete, and about one key
> — and the conclusion drawn was about every key on every platform. **An
> instrument pointed at the wrong thing**, which is §7's own rule in the
> handoff, produced by the window that wrote it down.

Worth noting precisely, because it was a prediction: **the embedded launch was
the case expected to produce the flip, and it did not.** Chrome allowed the state
cookie in a genuine third-party frame. The prediction was not wrong about the
mechanism — a third-party frame is where a cookie gets dropped — it was wrong
about the browser.

---

## 14. OPEN: when the picker refuses, the platform is never told

**Found 2026-08-30 while reading the deep-linking specification against the
implementation. Its own piece of work, not started.**

The deep-linking response has four optional claims for talking back to the
platform:

| claim | spec text |
|---|---|
| `msg` | *"a plain text string of a message the platform may show to the end user upon return"* |
| `log` | *"a message the platform may log when processing this message"* |
| `errormsg` | *"...may show to the end user... It indicates some error as occurred"* |
| `errorlog` | *"...may log... It indicates some error as occurred"* |

**We send none of them, and that fails nothing.** All four are optional, and the
specification *"does not prescribe what tools must do"* with them — they are the
platform's business once received. **This is not a certification gap and must
not be recorded as one.**

**The product gap is real and separate.** When the picker refuses —
`plants: "neither"`, or no certifications available, or an expired session —
**we do not return to the platform at all.** The instructor reads our page
inside the frame and Moodle is told nothing: no response, no error, no record on
their side. From the LMS's point of view the instructor opened a tool and
nothing happened.

`errormsg` and `errorlog` are precisely the specified way to return having
failed. `msg` is the specified way to confirm having succeeded — *"Added AI
Essentials I to this course"* in the platform's own chrome, in the platform's
own language, rather than only in ours.

**Why it is its own work rather than four strings.** Returning-on-error means
signing and posting a response with an empty `content_items` array, which is a
different shape from the success path — the picker currently has no way to send
anything back at all, only to render. And the strings are instructor-facing in
three locales, which puts them under the claims discipline: what `errormsg` says
about *whose* fault a refusal is will be read inside an institution's own LMS.

**One caution for whoever builds it.** `msg` on success is tempting and is the
part most likely to be wrong: the platform decides whether and where to show it,
so a message that reads well in Moodle may be invisible in Canvas or duplicated
beside our own confirmation. Ship `errormsg` first, where silence is
unambiguously worse than a sentence.
