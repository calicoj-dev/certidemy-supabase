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
