# HANDOFF v8.9 — LTI phase 2, end to end

**Migration tip: 265. Next free: 266.** But read the disk, not this line —
`ls migrations/ | tail -1`. Four documents said "next free: 262" while 261, 262
and 263 existed, and two sessions independently reached for 264.

---

## 1. What exists now that did not before

**An instructor in Moodle opens Select content, sees eleven Certidemy
certifications, picks one, and it plants a real launchable activity in their
course. A student clicks it and lands in that certification's learn area —
account provisioned, enrolled, signed in, thirty-one lessons in front of them.**

Observed end to end on Moodle 5.2, 2026-08-30. No manual configuration beyond
registering the tool.

That sentence is the whole release. Everything below is how it was reached and
what it cost.

---

## 2. The student launch (LTI phase 2)

**Design decided in conversation, recorded in `LTI-PHASE-2.md`.** It was
deferred across three handoffs as "settle on paper first" and kept not
resolving because it was never a technical question.

**The rule that shapes it:** most LMSs let an administrator sign in as a
student. That the impersonation is *possible* is the 17024 gap, not that it is
likely. So the identity control sits at the moment of assessment and nowhere
else — everything upstream can be convenient because nothing upstream produces a
credential.

**Three paths:**

- **Email present** → find or create profile, link `(platform_id, sub)`, mint a
  session, land them in the app. Silent. Most students never see a login screen.
- **Email absent** → two doors: ask the admin to enable the claim, or break out
  to signup carrying a link token. The next launch resolves by `sub`.
- **Exam** → always breaks out to a real login on `certidemy.com`.

**Proven:** first provisioning at 00:23:36 UTC on **2026-08-29** [corrected: the file said 2026-08-27, which is before phase 2 existed -- migrations 262 and 263 are dated 08-28. From lti_launch_skeleton and lti_users, both 2026-08-29 00:23:36] (`student_provisioned`,
`password_set = false`, session landed, 1.13s end to end). Fast path proven on
the second launch (`student_linked`, no duplicate account). Door two closed
2026-08-30 (`consumed_at` set, `attempts = 1`, `student_linked` on the launch
after signup, one identity).

**Also proven, unplanned:** a colleague on a conference call ran the same
launch from a different house on a different PC and it worked. Every other proof
was one machine, one browser, one network.

---

## 3. The content item — what an instructor actually plants

**We plant `ltiResourceLink`, not `link`.** The file header had asserted the
opposite in the same certain tone, and it was **true when written** — phase 1 had
no launch to point at. It became false without changing a character.

A `link` content item is a URL resource: clicking it is an ordinary navigation
with no `id_token` and no launch, so every bit of phase 2 sat unreachable behind
it. What an instructor got was a bookmark to a marketing page.

**The custom claim is keyed on `certifications.id`, never the code.** A content
item is written once into a platform we do not control and replayed forever. If
the code were the key, a future rename would orphan every planted activity at
every institution — and nothing in either repo would ever see it. Migration 053
already renamed every code in this catalogue and silently falsified four things.

**And only the id.** A readable copy of a mutable fact next to the immutable key
is the pair somebody eventually branches on.

**Seating is enrol-then-land.** `/learn/[cert]` is behind an enrolment gate, so
the URL alone lands a student on an upsell page. Migration 265 adds `'lti'` to
`user_certifications_source_check` — recording it as `'self'` would be a lie in
the one column whose purpose is provenance.

**The fallback is declared, not substituted.** A platform taking `link` but not
`ltiResourceLink` gets the phase 1 shape, and the picker says so before the
instructor chooses.

---

## 4. The one real problem left

**Embed renders the login page.** Observed on Moodle, Chrome, a real
third-party iframe: Certidemy renders in the frame and shows *"Welcome back, log
in to continue your study plan."* The same activity in a new window works.

**The launch succeeded, which is what makes it bad.** Handshake, verification,
provisioning, session minted. The student has a real account and a real session
and the browser will not send it back.

**Cause, confirmed by direct read:** every cookie on the origin is
`SameSite=Lax`, including both Supabase SSR auth cookies. They are present and
readable — not blocked, not absent — and a `Lax` cookie is not sent on a
cross-site iframe request.

**Five options, none chosen** (`LTI-PHASE-2.md` §13). The choice is constrained
rather than open: this document already decided twice that the frame cannot be
trusted for identity — the exam breaks out, signup breaks out — and a session
cookie is identity. `SameSite=None` needs an argument *against* those decisions,
not merely one for itself, and the read showed it is not a targeted override on
one cookie but a change to how the whole product writes sessions.

**Do not write it as "one cookie survived and the other did not."**
`certidemy_lti_state` is `Path=/lti`, the inspected document was `/en/login`, and
`state_cookie_survives` is measured server-side at `/lti/launch`. Two facts,
different instruments, different layers, different documents — never compared.

---

## 5. What is still unproven, and it is two things

Both need the Moodle sandbox, which resets on the hour.

1. **A `false` on `state_cookie_survives`.** **[CORRECTED 2026-08-30. This item
   said "29 of 29 true, on every key, on every platform; changed_at and
   previous_value have never been non-null". THE FLIP HAD ALREADY HAPPENED --
   three keys on Moodle, releases_email 20/10, releases_name 24/6,
   custom_vars_substituted 15/4, all with changed_at and previous_value
   populated, and `varies` rendered against real data. Cause: door-two privacy
   toggling, not Safari. The claim came from a query that only ever asked about
   state_cookie_survives -- §7's own instrument rule.]** What remains open is
   ONE KEY: state_cookie_survives has never read `false`, **30 of 30 on Moodle,
   13 of 13 on lti-ri**.
   Chrome allows the state cookie even in a genuine third-party frame; Safari
   blocks third-party cookies by default and is the only known path to a `false`.
2. **`false`/`false` on the `data` echo.** Needs a platform that sends no
   `deep_linking_settings.data`. Moodle is that platform.

**The embedded launch was predicted to produce a `false` on this key and did
not.** Not wrong about the mechanism — a third-party frame is where a cookie
gets dropped — wrong about the browser. **[And it was looking in the wrong place
for a different reason: the flip it was waiting for arrived the same day on
three other keys, from privacy toggling rather than from cookies. The
prediction watched one key and the event happened beside it.]**

---

## 6. The failure shape this build kept producing

Worth stating once, because it recurred at every level and each instance looked
like success.

**A correct action on the wrong target, indistinguishable from working:**

- The consumption lived in `/auth/callback`, which email confirmation does not
  reach — *and* could never fire on the OAuth path either, because the Google
  button is a separate `<form>` and the token stopped at it. **The obvious fix
  would have repaired one path and left the other silently broken, as part of
  the fix.**

  **[DISPUTED 2026-08-30, THEN SETTLED THE SAME DAY — see the resolution at the
  end of this marker. The first clause conflicts with a measurement, and it was
  left unresolved while it could not be settled. Evidence against it:** `auth.users` on the
  door-two account shows `confirmation_sent_at 01:13:01.200` and
  `email_confirmed_at 01:13:19.647`, 18.5 seconds apart — an email was sent and
  a human clicked it. And the reported landing page after confirming was
  `/en/dashboard`, which is the callback's own `next` parameter, so the callback
  did run. **Evidence for it:** `lti-consume-link-token` was never invoked, so
  something inside that branch did not fire; the web session's reading is that
  `getSession()` returned nothing because `exchangeCodeForSession` had written
  the session to the *response* in the same request, which would produce exactly
  this with the callback running normally. **Both cannot be true as stated.**
  Not resolved here: a wrong reason stated confidently is the failure this
  section is about, and picking one now would reproduce it one level up. Whoever
  fixes it settles which clause is wrong.

  **RESOLVED 2026-08-30: the second clause is right and the first is wrong.**
  The door-two proof carried `lti_diag=t1b1` — the `b1` being the RAW
  `NEXT_PUBLIC_EDGE_FUNCTIONS_URL` read before any fallback — so the variable
  was present and `base` was never `undefined`. **Email confirmation DOES reach
  a landing route.** What failed is that `getSession()` read the request cookie
  store for a session written to the *response*, so `token` was falsy. The
  callback ran and the guard did not fire. `lib/lti/consume.ts` now takes the
  session as a parameter so that mistake is unavailable.**]**
- Gap 1 alone would have planted real launchable activities that ignore the
  instructor's choice and seat every student at the generic dashboard.
- Gap 2's URL alone would have landed them on an upsell page.
- `state_cookie_survives` read `true, 29 of 29` on the runs that failed. The name
  is accurate and the measurement correct; the inference it invites is not.

**Every one was found by reading the destination rather than reasoning about the
route.**

---

## 7. Rules recorded, each from a mistake made this session

- **The reporting path cannot depend on the mechanism it reports on.** A monitor
  that goes quiet in precisely the failure it exists to catch.
- **A count in an assertion is a fact about the data, not a constant.** Two
  hardcoded counts hours apart, one in a log line and one in a post-condition.
- **The negative half is not extra coverage — it is the half that can contradict
  you.** An accent contract refused its own contract: it declared a Portuguese
  key must be accented and the language disagreed.
- **A correction banner does not protect a mid-section reader.** Mark claims
  about the present; leave observations dated to a moment.
- **When a repeated idiom has exceptions, check whether they are just younger.**
  Here the heuristic *failed*, which was the useful part: exceptions at both ends
  of the timeline means the convention never existed rather than drifted.
- **The instrument was pointed at the wrong thing.** A history search came back
  empty and was read as evidence; the Moodle tabs run in a different Chrome
  profile. The search was accurate, complete, and about another browser. **An
  absence carries a burden a presence does not.**
- **A pair with half its state in a dashboard has no local ground truth.** The
  `emailRedirectTo` / Confirm-signup-template pair. No grep can find the
  mismatch and the build is green either way.
- **A prompt is not an address.** Four misroutes [the file said five; the
  records show four -- addendum 2 §2 records three, the colliding-plan section
  adds the fourth. A fifth may have occurred and gone unrecorded; the count that
  is written down is four], all one direction, all caught by the receiving
  session. The tell — "as you proposed" attached to a plan the
  session does not hold — is necessary and not sufficient: it cannot see a
  *colliding* plan, and when both sessions hold the same symptom they produce
  overlapping ones.

**And the one that reads worst:** a rule in `CLAUDE.md`, read that same session,
was violated — and then contradicted by a twenty-line comment asserting `THE
ONLY PLACE IT CAN`. A wrong belief stated emphatically in code is harder to
dislodge than the same belief held quietly, because the next reader treats it as
settled and stops looking.

---

## 8. Scope boundary: no grade passback

**No AGS, no line items, no gradebook column. Deliberately.** Recorded in
`LTI-PHASE-2.md` §5b because silence reads as an oversight and it is the first
thing a Moodle instructor asks.

What a Certidemy credential attests is an exam sat under our own conditions, not
coursework in someone else's LMS. Posting a score into a partner's gradebook is
the reversal of a refusal already enforced in `list-credentials` and
`get-company-detail`. **It is a claims decision before it is an engineering
one** — see §9.

---

## 9. Open, in order

1. **Decide the Embed question** (§4). Product call, constrained by §1 and §4 of
   `LTI-PHASE-2.md`.
2. **The already-signed-in redirect on the two-doors page.** Clicking "Create an
   account" while signed in bounces to the dashboard and silently drops the
   token. Caught twice during testing; mints a fresh token each time.
3. **The Safari sitting** (§5), two proofs, one hour.
4. **`session_cookie_survives`** as a second capability key — not a rename, since
   the 30 observations are real observations of exactly what the current name
   says.
5. **`advertises_ltiresourcelink` is a NINTH capability key** and the console
   does not know it. `KNOWN_CAPABILITIES` in `../certidemy-web/lib/console/lti.ts`
   lists eight; the edge functions now write nine. **A cross-repo pair, and the
   half that drifted is the reader.** The list exists so a never-observed
   capability renders "not yet observed" rather than vanishing — a key missing
   from it still renders once observed, because the component appends unknown
   keys, but its ABSENCE is invisible. So a platform that has never advertised
   `ltiResourceLink` shows nothing at all for it, which is the exact collapse
   that list was written to prevent. One line, same fix as
   `advertises_link_content_item` on 2026-08-27.
6. **1EdTech conformance certification** — see the separate note; it is a
   membership and paperwork question more than an engineering one.
7. **The last-admin guard**, still unnumbered and unapplied.
8. **`cert.yml`'s collections are stale** — 6 inserts, 15 updates, 48 deletes.
   Regenerate from the database, do not hand-edit.
9. **The learn layout's hand-rolled unaccented translation table**, on the page
   an LTI student lands on.

---

## 10. Reading this later

`LTI-SETUP.md` Part One and Part Two are the runbooks and both are executed and
dated. `LTI-PHASE-2.md` is the design record — §12 door two, §13 the Embed
finding. Both repos' `CLAUDE.md` carry the rules from §7 with their worked
examples.

**When a document and the database disagree, the database wins.** That has been
true every time it has come up.
