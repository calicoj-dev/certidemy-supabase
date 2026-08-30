# HANDOFF v8.9 addendum — the sitting that closed it

**Migration tip: 265. Next free: 266.** Read the disk, not this line.

v8.9 was written before this sitting and lists four unproven things. **Three of
them are now observed and the fourth needs a Mac.** This addendum is that
delta and nothing else.

---

## 1. What the sitting proved

**One Moodle hour, 2026-08-30. Four observations, no builds.**

**The framed / top-level pair — and it was the only thing that closed §13.**
New Window launch redirected straight through into the learn area with no
interstitial. Embed launch rendered the interstitial in the frame, and its
button opened Certidemy in a new tab and landed correctly. Both halves, same
activity.

> **`Sec-Fetch-Dest: document` DOES arrive on a cross-site top-level form
> POST.** That was the last piece of reasoning in that section. The risk that
> every New Window launch would take an interstitial it does not need is dead by
> observation rather than by reading the specification.

**`false`/`false` on the `data` echo.** Three `LtiDeepLinkingResponse` rows on
Moodle, all reading `data = false` and `data_requested = false`. Moodle sends no
`deep_linking_settings.data`, we echo none, and **the two booleans agree while
being derived independently** — one from the signed payload, one from the
session column.

That is the half that catches a hardcoded `true`, and **it was unreachable on
lti-ri**, which sends a `data` value on every request. The positive half proves
the claim is echoed; this proves the code is reading something rather than
asserting it. **Neither alone would have.**

**`custom` replay, and it is more than spec conformance.** The launch seated the
student in the certification the instructor picked, which means Moodle carried
the content item's `custom` claim through to a subsequent launch. **That is the
mechanism the entire content-item design rests on** — keyed on
`certifications.id` precisely so a rename cannot orphan planted activities — and
until this launch nothing had shown a platform actually replaying it.

**`accept_multiple: true`, end to end.** One deep-linking response carried three
content items and Moodle planted all three. Read in the picker, enforced
independently in the signer, accepted by the platform.

---

## 2. What is left, and it blocks nothing

**A single `false` on `state_cookie_survives`.** 35 of 35 `true` on Moodle,
13 of 13 on lti-ri. Chrome allows the state cookie even in a genuine third-party
frame; Safari blocks third-party cookies by default and is the only known path
to a `false`. **That needs a Mac.**

**It is not blocking anything, and saying so is the point.** The design already
treats the state cookie as non-authoritative — `lti_nonces` is the authority,
and `state_cookie_survives` is a diagnostic observation rather than a control.
Observing the `false` would exercise the branch that **already tolerates the
cookie being absent**, confirming a design correct by construction.

**The last unobserved value in a tri-state. Tidy rather than important.** It has
no dependents. A one-item list at the top of a document reads as a blocker
regardless of its content, which is why this paragraph exists.

**Also correct by argument and unproven by measurement:** the two-causes split on
an *absent* `Sec-Fetch-Dest`. This browser sent the header, so nothing tested
what happens when it is missing. A silent Fetch Metadata family still means an
old browser and takes the extra click; a partial family still means the header
was stripped upstream and does not. **Distinguishing "closed by measurement" from
"correct by argument" is why item 4 closes and that note does not.**

---

## 3. Corrections to v8.9

Found by the session that could query, not by re-reading.

- **The capability flip HAD happened**, three times, hours before v8.9 claimed
  it never had — `releases_email`, `releases_name`, `custom_vars_substituted`,
  all on Moodle, all with `changed_at` and `previous_value` populated. It was
  produced by toggling the privacy setting during door-two testing, not by
  Safari. **The claim was asserted from a query that only ever asked about
  `state_cookie_survives`** — accurate, complete, and about one key, with a
  conclusion drawn about all of them.
- **First provisioning is 2026-08-29, not 08-27.** Migrations 262 and 263 are
  dated 08-28, so phase 2 did not exist on the 27th.
- **§6's clause about email confirmation not reaching the callback was wrong.**
  Marked disputed, then settled: `lti_diag=t1b1` measured the raw env var before
  any fallback, so the callback ran and `getSession()` was the fault.
- **Four misroutes, not five.** The written record is the count.

---

## 4. What is true now

**An instructor opens Select content inside Moodle, picks one or more Certidemy
certifications, and the platform plants real launchable activities. A student
clicks one and lands in that certification's learn area — provisioned, enrolled,
signed in, studying.**

Every path has been observed on a real LMS: email present, email withheld,
embedded, top-level, single item, multiple items, first launch and second.

**And the failure paths are honest.** A student whose platform withholds their
email gets two doors, not a dead end. A student in a frame gets a screen that
names the browser as the actor and tells the instructor how to remove the step —
which is 1EdTech's own guidance, not our workaround. A student whose activity
points at a retired certification is told the activity is stale rather than that
Certidemy is broken.

---

## 5. Open, in order

1. **1EdTech conformance certification.** The core gap list closed — six
   required-claim validations shipped, free against 43 observed launches. What
   remains is membership and paperwork. LTI Advantage Certified (Core plus Deep
   Linking) is the realistic tier; Complete needs AGS and NRPS, and §5b argues
   AGS is a claims decision rather than a gap.
2. **OB3 certification.** Closest of the two. Issue a valid badge to
   `conformance@imsglobal.org`, submit it, and demonstrate retrieval by video.
   The dual `eddsa-rdfc-2022` / `eddsa-jcs-2022` proof already matches a
   supported mechanism.
3. **The last-admin guard**, still unnumbered and unapplied.
4. **`cert.yml`'s collections are stale** — regenerate from the database, do not
   hand-edit.
5. **The learn layout's hand-rolled unaccented translation table**, on the page
   an LTI student lands on.
6. **`session_cookie_survives`** as a second capability key — not a rename,
   since the existing observations are real observations of exactly what the
   current name says.
7. **The Safari observation**, if a Mac appears. See §2.

---

## 6. The rule this week produced

Recorded across both `CLAUDE.md` files with worked examples. The one that
generalises past the feature:

> **A self-authored check is not independent evidence. The control is what makes
> it evidence.**

When you write a check about your own edit, you decide what the property is and
encode it from the same picture that produced the code. It can disagree with you
about whether you did what you meant. **It cannot disagree with you about what
you meant.** The control asks a different question — *does the finder find
something I know is there* — and that is the only assertion in the run whose
answer does not come from the picture under test.

Two self-authored checks failed on correct work in one session, both from proxies
already written down. Neither was caught by being careful.
