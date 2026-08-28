# LTI-SETUP.md

**What this is:** the steps to register a platform with Certidemy as an LTI 1.3
Tool, and to launch from it. A runbook, not a design document -- for the design
see the headers of `functions/lti-launch/index.ts` and migrations 253-259.

**Two parts, and they are different sequences for different people.** Part One
is a developer proving the integration against a hosted test platform. Part Two
is an institution's LMS administrator. Do not read one while doing the other.

**What Certidemy is:** a TOOL. The LMS is the PLATFORM. It registers us; we do
not integrate with it. Saying "Certidemy is an LTI platform" to an LMS admin
reads as not knowing the specification.

**Phase 1 scope:** an instructor can add a Certidemy certification to a course
as a link. A student clicking a Certidemy link launches to an honest "student
launch is not available yet" page. No AGS, no NRPS, no session minting.

---

## What Certidemy gives every platform

Four values, identical for every registration, from `lib/lti/config.ts` in the
web repo and shown verbatim at **`/console/lti`**.

| Field | Value |
|---|---|
| Tool / Target Link URI | `https://certidemy.com/lti/launch` |
| OIDC Login / Initiate Login URL | `https://certidemy.com/lti/login` |
| Redirect URI | `https://certidemy.com/lti/launch` |
| Public JWKS URL | `https://certidemy.com/lti/jwks` |

**COPY THESE, NEVER RETYPE THEM.** OIDC compares `redirect_uri` to the
registered value character for character. A trailing slash or a typo is rejected
by the platform with an opaque error AT THEIR END, where we never see it.

These URLs do not move. They are pasted into configuration we do not control and
cannot enumerate, so changing one silently breaks every existing registration.

---

# PART ONE -- the 1EdTech reference implementation

**Status: PROVEN. Executed end to end on 2026-08-27**, first real LTI 1.3
launch, reference `4b8aca65-23ef-4833-94dc-7d24e000a631`.

`https://lti-ri.imsglobal.org` is a hosted platform you register against. No
Docker, no install. Sign in with GitHub or Google.

**Free tier:** core launch is free, **and so is Deep Linking** -- settled on
2026-08-27 by doing it, with no 1EdTech membership. Their wording had suggested
otherwise (*"IMS Members have access to the complete functionality of the tool
including services and message types"*, and Deep Linking is a message type), so
this was an open question and is no longer one.

Do a resource link launch first regardless. It proves everything except the
picker, in fewer steps, and it is what leaves `supports_deep_linking = false`
for the flip in step 8 to be visible against.

## 1. Add Platform

**Platforms -> Add Platform.**

| Field | What it is |
|---|---|
| Name | Yours to choose. Cosmetic. |
| Client | Yours to choose. Becomes `client_id` and the `aud` claim. |
| **Audience** | **THE `iss`. USED VERBATIM.** |
| Tool Deep Link Service Endpoint | `https://certidemy.com/lti/launch` |
| Platform Public Key / Private Key | see step 2 |
| Tool Public Key | leave blank |
| JWT Key Set URL | `https://certidemy.com/lti/jwks` |

### The Audience field is misnamed and it will cost you if you trust the label

**It populates `iss`, not `aud`.** Whatever string you type is what arrives in
the `id_token` as the issuer, unchanged.

It is NOT built into a URL. Type `certidemy` and the `iss` is the five
characters `certidemy`. Existing platforms on the site whose issuer looks like
`https://lti-ri.imsglobal.org/platforms/Escavel/Audience` simply had that URL
typed into the field by their operator.

**This was got wrong on the first attempt here**, on the strength of one such
example, and correcting it needed raw SQL against `lti_platforms` -- **there is
no edit action in the console yet.** Until there is, a wrong `iss` is a
database edit.

If you do get it wrong, the symptom is precise and recoverable: `lti-launch`
records `error_code = 'iss_mismatch'` in `lti_launch_skeleton` and the browser
shows the generic page with a reference id.

**Tool Public Key vs JWT Key Set URL** is an either/or. Use the Key Set URL: it
is the half we actually serve, so it exercises `/lti/jwks` end to end. A pasted
static key would work even if our JWKS endpoint were broken.

## 2. Generate Keys -- paste the WHOLE PEM

Use their **Generate Keys** control, then paste both halves into Platform Public
Key and Platform Private Key.

**INCLUDE THE `-----BEGIN` AND `-----END` LINES.** Pasting only the base64 body
makes their server return a **500 with a full Rails stack trace** reading:

```
Neither PUB key nor PRIV key: nested asn1 error
```

That is a parse failure on their side, not a key problem. Nothing is saved.

## 3. Platform Keys is a SEPARATE OBJECT, and the JWKS URL has two traps

After saving, open **Platform Keys** from the platform page. It is its own
object, not a section of the config page, and the JWKS URL is only visible here.

```
https://lti-ri.imsglobal.org/platforms/{PLATFORM_ID}/platform_keys/{KEY_ID}.json
```

**Trap one: the `.json` suffix is required.** Without it the URL returns HTML,
and `getPlatformKey` records `jwks_not_json`.

**Trap two: `{KEY_ID}` is not the name you gave the key.** It is a numeric id
assigned by them. Read it off the page.

**Verify before registering.** Open the URL in a browser. It must return
`{"keys":[...]}` with a `kid`. That `kid` appears in the `id_token` header and
is what we look up.

## 4. Create a Context BEFORE a Resource Link

**A Resource Link cannot be created without a Context, and the form does not
say so.** The context dropdown is empty and the form SILENTLY DISCARDS what you
typed. It looks like a save that did nothing.

Create the Context first. **Type of context: `CourseSection`.**

Then create the Resource Link inside it.

## 5. Launch -- the right button, and then three more pages

There are two buttons and only one works. Then the one that works is **not a
single click**.

**The plain "Launch" button POSTs the `id_token` with NO `state`.** We refuse
it: `missing_id_token_or_state`, recorded in the skeleton with a null
`platform_id`. **That refusal is correct** -- without a `state` there is no
`lti_nonces` row, so nothing binds the token to a flow we started, and it cannot
be told from a replay.

**The OIDC path starts on the resource link's ROSTER page.** The roster is where
their generated users live, and a launch needs a user. Their `/users` endpoint
**502s**; the roster page is the way in.

### It is FOUR actions across four pages

This is the correction that matters most in this section. The first version of
this file named only the roster button, which reads as though that button
performs the launch. **It does not** -- three more pages follow it, and someone
who stops after the first one has done nothing wrong and will reasonably
conclude the integration is broken.

1. **Launch Resource Link (OIDC)** -- on the ROSTER page.
2. **Post request** -- on the parameters page.
3. **Launch Resource Link** -- on the authorization page.
4. **Perform Launch**.

### The invisible hop is between 2 and 3, and it is ours

**"Post request" does not go to their authorization page. It goes to US.**

It posts to `/lti/login`, where we look the registration up by `(iss,
client_id)`, mint the `state` and `nonce`, write the `lti_nonces` row, and 302
to the authorization URL from the registration -- which is what renders page 3.

So there is a moment, between clicking a button on their site and seeing their
next page, when **the browser is on certidemy.com**. If anything is wrong with
the registration, that is where it surfaces: a Certidemy refusal page appears
mid-sequence, on what looks like a dead end, at a point the reader has no reason
to think they are only halfway through.

`unregistered_platform` here means the `iss` or `client_id` does not match --
see step 1 on the Audience field. It does NOT mean the launch failed at their
end, and it does not mean you have finished.

## 6. Register it in Certidemy

`/console/lti` -> **Register**. Read the values off their pages.

| Our field | From their page |
|---|---|
| Name | your label |
| Issuer (iss) | **the Audience field, verbatim** |
| Client ID | the Client field |
| OIDC authorization endpoint | `.../platforms/{P}/authorizations/new` |
| Token endpoint | `.../platforms/{P}/access_tokens` |
| Platform JWKS URL | `.../platforms/{P}/platform_keys/{K}.json` |
| Company | blank -- unread in phase 1 |
| Clock tolerance | blank -- defaults to 60s |

**Worked example, the registration proven on 2026-08-27:**

```
name        1EdTech reference TEST
iss         certidemy
client_id   certidemy-tool
auth        https://lti-ri.imsglobal.org/platforms/6475/authorizations/new
token       https://lti-ri.imsglobal.org/platforms/6475/access_tokens
jwks        https://lti-ri.imsglobal.org/platforms/6475/platform_keys/5688.json
```

Note `iss` is a bare string, not a URL. That is legal -- see the closing notes.

## 7. Verify the rows -- this matters more than the page rendering

**A launch that appears to succeed while writing nothing is a different bug from
one that fails visibly.** Run all of these.

```sql
select iss, client_id, name, product_family_code, status from lti_platforms;
select deployment_id, first_seen_at, last_seen_at from lti_deployments;
select state, consumed_at, expires_at from lti_nonces order by created_at desc;
select received_at, outcome, error_code, message_type,
       clock_delta_seconds, claim_presence
from lti_launch_skeleton order by received_at desc limit 5;
select key, value, observation_count from lti_capabilities order by key;
select platform_id, length(raw_jwt), expires_at from lti_launch_evidence;
```

### `first_seen_at` can be LATER than `last_seen_at`, and that is the writer

**A brand-new `lti_deployments` row holds two clocks.** This is a property of
how the row is written, not an anomaly to go looking for -- which matters,
because by the time anyone looks it is usually gone.

`lti-launch:371` upserts the deployment with
`last_seen_at: new Date().toISOString()` -- **the Deno isolate's clock**. It
does not supply `first_seen_at`, so on INSERT that column takes migration 253's
column default, `now()` -- **the Postgres clock**. Two hosts, one row, one
statement. **Whenever the isolate lags Postgres, `first_seen_at` lands after
`last_seen_at`.**

There is no ordering logic to be wrong here. There is no ordering logic at all.

What follows:

- **It reproduces on EVERY new deployment row**, not once. It is ordinary NTP
  drift between two machines, so the size varies and the direction is whichever
  way the isolate happens to be off.
- **`last_seen_at - first_seen_at` is negative on a fresh row**, so anything
  computing a duration gets a negative one. **Nothing computes one today** --
  the console renders both timestamps literally -- so this is latent, not live.
  It is the kind of thing a "seen for N minutes" column would inherit silently.
- **The observation window closes at the second launch.** The upsert rewrites
  `last_seen_at` every time, so one more launch pushes it safely ahead and the
  inversion disappears for good. It can only ever be seen between a deployment's
  first launch and its second.

**OBSERVED 2026-08-27** on the Moodle row, `first_seen_at`
`20:27:04.014174+00` against `last_seen_at` `20:27:03.96+00` -- **54 ms
inverted**. Already invisible: the fourth launch moved `last_seen_at` to
`20:40:17.333+00`.

**Migration 261 is the contrast, and it is why this is worth naming.**
`lti_capabilities.first_observed_at` defaults to `now()` and
`lti_record_capability` sets `observed_at = now()` -- **both Postgres**. One
clock, so those timestamps cannot invert no matter how far any isolate drifts.
The deployment upsert is the **only** place in the LTI code that mixes the two.

**A successful resource link launch produces exactly:**

| Table | Expected |
|---|---|
| `lti_deployments` | 1 row, **created by the launch**, not by you |
| `lti_nonces` | `consumed_at` NOT NULL |
| `lti_launch_evidence` | 1 row, `expires_at` ~30 days out |
| `lti_launch_skeleton` | 1 row, `outcome = 'resource_link_unsupported'`, `error_code` null |
| `lti_capabilities` | up to 6 rows |

**Observed on 2026-08-27:**

```
aud_is_array             false
custom_vars_substituted  true
releases_email           true
releases_name            true
state_cookie_survives    true
supports_deep_linking    false
clock_delta_seconds      31
```

**Reading failures:**

| What you see | What it means |
|---|---|
| Skeleton EMPTY after a visible failure | the recording path is broken. Worst case. |
| `verification_failed` + a code | working as designed. Read the code. |
| `iss_mismatch` | the Audience value. See step 1. |
| `jwks_not_json` | missing `.json`. See step 3. |
| `missing_id_token_or_state` | wrong Launch button. See step 5. |
| Everything written, `lti_capabilities` EMPTY | `lti_record_capability` failing silently -- it is non-fatal by design |

`state_cookie_survives = false` is **not** a failure. It means third-party
cookies were blocked, which the design tolerates -- the authoritative check is
the `lti_nonces` row. Either value is a real observation. An empty table is the
bug.

**AND `true` HERE PROVES NOTHING ABOUT THIRD-PARTY COOKIES. THIS RIG CANNOT
TEST THEM.** (Part Two now tests the frame. It does not test the blocked
cookie -- see the end of this section.)

Observed 2026-08-27: `state_cookie_survives` stayed `true` across eight
launches **with third-party cookies BLOCKED in Chrome**. That is not the browser
setting failing to apply -- it is the setting not being relevant. lti-ri
**navigates** the top-level window rather than embedding us, so `certidemy.com`
is first-party for the whole flow and our cookie is a first-party cookie.

The case the design tolerates -- a tool rendered in an LMS iframe, where we are
third-party and the cookie is dropped -- **cannot be produced against lti-ri at
all.** There is no setting for it. Anyone reading `true, 8 of 8` off this
platform and concluding third-party cookies are fine has measured something
else.

**What produces it: a real Moodle with the tool set to display in an embedded
frame.** Until then, that branch is written, tolerated by design, and untested.

The same limit applies to everything the picker's own header worries about. It
describes an LMS iframe as "the most hostile rendering context we ship to" --
blocked storage, restrictive CSP, ancient embedded browsers -- and **on this rig
the picker has only ever rendered top-level.**

### UPDATED 2026-08-27 -- the frame was tested, the blocked cookie was not

Part Two ran against Moodle 5.2 with the launch container set to **Embed**, so
the following are no longer open:

- **The iframe was exercised.** We rendered inside a real LMS frame in Chrome.
- **The page rendered legibly** -- no CSP or `X-Frame-Options` interference,
  confirming the web-side header audit from a real browser rather than a
  datacentre curl.
- `state_cookie_survives` read **`true`, 4 of 4, in that genuine third-party
  iframe.**

**THESE ARE TWO DIFFERENT PROPOSITIONS AND ONLY ONE OF THEM CLOSED.** The frame
is tested. The **cookie-blocked** case is not: Chrome allowed the cookie in that
context, so the flip never happened. **The `false` branch of that tri-state has
still never been observed anywhere, on any platform, in any browser.**

**Safari is where `false` is expected and it remains untested.** Do not let "the
iframe is now tested" collapse into "the cookie-blocked case is now tested" --
they are one Embed setting apart and one browser apart, and only the first of
those two has been changed.

`supports_deep_linking false` above is the RESOURCE LINK launch's observation
and it is correct for that message. It flips to `true` the first time a
deep-linking launch arrives -- see step 8, and see the note there about the flip
leaving no trace of itself.

## 8. Deep Linking -- the other message type

**Proven end to end on 2026-08-27.** This is the half that plants a link in a
course, and it is the half an institution actually uses.

### Deep links hang off a CONTEXT, not a resource link

`.../platforms/{P}/contexts/{C}/deep_links`. Reach it from the context, the same
one step 4 made you create.

**There is nothing under the resource link that leads here, and looking there is
the natural first move.** It is backwards: a resource link is what deep linking
PRODUCES. You are not configuring an existing link, you are asking the platform
to let you create one.

### `/new` composes the request and offers a launch we refuse

The New Deep Link form builds the request, and the button it offers next POSTs
the `id_token` with **no `state`**. We refuse it: `missing_id_token_or_state`.

**This is the same trap as the plain Launch button in step 5**, in a second
place, and the refusal is correct for the same reason -- no `state` means no
`lti_nonces` row, nothing binding the token to a flow we started, and no way to
tell it from a replay. Both refusals were observed on the proving run.

### "Send Request" on the INDEX page is the one that starts it

Go back to `.../deep_links`. The request you just composed is listed there, with
**Send Request**. That is the entry point to real OIDC -- our `/lti/login`,
their authorization endpoint, our `/lti/launch` -- and it is the only path here
that produces a verified launch.

**IT IS A MULTI-PAGE SEQUENCE, THE SAME SHAPE AS STEP 5.** Read off the screen
2026-08-27:

1. **Send Request** (labelled **Post request** on some pages) -- deep links index.
2. **Launch Deep Link** -- on the authorization page.
3. **Perform Launch**.
4. The **picker** appears. Choose, then **Add**.
5. Their **confirmation page**, listing what was created.

**The hop through `/lti/login` sits before the authorization page**, exactly as
in step 5 -- so a Certidemy refusal appearing partway through means the
registration did not match, not that deep linking failed.

### `/deep_links/new` has its OWN direct Launch button, and we refuse it too

**This is the same trap as step 5, in a THIRD place.** The form that composes a
deep-linking request offers a launch that POSTs the `id_token` with no `state`;
we answer `missing_id_token_or_state`.

Three pages now carry a button that looks like the one you want and is not: the
resource link page, the deep link `/new` page, and the roster's plain Launch.
**The rule that covers all three: if you did not pass through an authorization
page, no OIDC happened, and we will refuse it.** The refusal is correct every
time -- no `state` means no `lti_nonces` row, nothing binding the token to a
flow we started, and no way to tell it from a replay.

### What you should see

The picker, in the iframe: all eleven certifications, **with checkboxes**,
because this platform advertises `accept_multiple: true`. Radio buttons would
mean it advertised a single item, and that is a real difference read per launch,
not a setting.

### After submitting, click through their add-course step

They render the returned content items and then ask you to add them. **Click
through it** -- the confirmation is the page that follows:

```
The following Resource Links were created

Title            AI Essentials I
Resource URL     https://certidemy.com/en/certifications/aie-i
Deep Link Type   link
```

**`Deep Link Type: link` is the row that matters.** That is the content item
type we plant, accepted verbatim. A platform advertising only `ltiResourceLink`
cannot take it, and the picker refuses that up front rather than returning
something the platform discards silently.

Note they turned our `link` item into a Resource Link of their own. That is the
platform's business, not ours.

### Expected rows

| Table | Expected |
|---|---|
| `lti_launch_sessions` | the session for THAT launch has `consumed_at` NOT NULL |
| `lti_launch_skeleton` | **two** new rows: `deep_linking_ok`, then `deep_link_returned` |
| `lti_capabilities` | `supports_deep_linking` = `true` |
| `lti_deployments` | still 1 row, `last_seen_at` bumped, `first_seen_at` UNCHANGED |

**Two skeleton rows, not one.** The inbound `LtiDeepLinkingRequest` and the
outbound `LtiDeepLinkingResponse` are separate facts, and the second is the only
record that we answered at all.

**Count your launches before reading `lti_launch_sessions`.** An abandoned
picker leaves a perfectly good unconsumed session behind, and on the proving run
there were three deep-linking sessions and only the last was consumed. An
unconsumed row is not a failure; it is somebody who did not choose.

### Observed 2026-08-27

```
skeleton   15:49:19  LtiDeepLinkingRequest   deep_linking_ok      delta 3s
skeleton   15:49:37  LtiDeepLinkingResponse  deep_link_returned
session    9563ee97  consumed_at 15:49:37
deployment 1         first_seen 14:50:15 (unchanged)  last_seen 15:49:18
```

`claim_presence` on the request: `deep_linking_settings` true, `custom` true,
`custom_unsubstituted` false, `product_family_code` **false** -- this platform
sends no vendor name, which is recorded and, per the architecture, never
branched on.

### Their confirmation page decodes our signed response -- read it

It renders the JWT we sent, decoded. That is the only place our own outbound
document is visible to us, because deep linking has no callback, and it settled
two things that had been reviewed and never tested. Observed 2026-08-27:

```
iss           certidemy-tool
aud           certidemy
message_type  LtiDeepLinkingResponse
```

**THE INVERSION IS CORRECT ON THE WIRE.** `iss` is our `client_id` and `aud` is
the platform's `iss` -- the reverse of an inbound launch. It looks backwards
every time anyone reads it, and it is right: on the way out we are the issuer,
identified by the client_id THEY issued to US, and they are the audience.
`lti-deep-link` has a header note saying so; this is the observation behind it.

And the created item reads **`Deep Link Type: link`** -- the content item type we
plant, accepted verbatim.

### The `data` echo -- what migration 259 exists for

Their request carried `deep_linking_settings.data` =
`"Some random opaque data that MUST be sent back"`, it is stored on the session,
and the signing path adds
`https://purl.imsglobal.org/spec/lti-dl/claim/data` whenever that column is
non-empty. They accepted the response.

**That is code-level plus acceptance, not a captured wire copy, and it is STILL
OPEN after two deep-linking runs.** Our skeleton row for the response records
`content_items` and a count and says NOTHING about whether the echo went. On a
platform that rejects at its own end -- the exact failure 259 was written to
prevent -- we could not answer "did we send `data` back?" from our own records.

**The evidence is one screen away and has been missed twice.** The confirmation
page above decodes our whole payload, `data` claim included. Both runs read
`iss`, `aud` and `message_type` off it and neither captured the `data` claim.
**Next deep-linking launch, read that one line first** -- it is the only
unproven item left in Part One, and it costs one glance at a page you are
already looking at.

### Replay defence, unprompted

Two `nonce_consumed` refusals landed at 15:48:59 and 15:49:03, from a back or a
refresh on an already-consumed launch. **Nothing asked for that test and it is
the first time it has fired.** A consumed nonce is refused, which is the whole
point of consuming it.

---

# PART TWO -- a real Moodle

**Status: EXECUTED against a real Moodle on 2026-08-27** -- Moodle 5.2, public
sandbox. Registration, OIDC, RS256 verification and the deep-linking request are
proven. **Planting content is not, and cannot be with what we currently build:**
Moodle 5.2 accepts only `ltiResourceLink` and we produce a `link`. The picker
refuses, legibly, and nothing reaches the course. See step 8.

> ### THE SANDBOX RESETS EVERY HOUR, ON THE HOUR
>
> `https://sandbox.moodledemo.net` wipes to blank at the top of every hour.
> **Do the whole sequence in one sitting.** Starting at :55 means rebuilding
> from step 1.
>
> **What survives the reset is asymmetric, and that is the part that catches
> you.** Our `lti_platforms` row is in our database and survives. Their tool is
> in theirs and does not. Rebuilding the tool produces a **NEW `client_id`**,
> so the registration that survived now points at a tool that no longer exists.
>
> **The fix is Edit on the registration card, not a new registration.**
> Re-registering succeeds -- a new `client_id` makes a new `(iss, client_id)`
> pair, so nothing collides and nothing warns -- and leaves you with two rows
> for one institution, one of which matches no launch that will ever arrive.
> This is `update-lti-platform`'s first real use case.

## 1. Enable the External tool activity module

**Site administration -> Plugins -> Activity modules.** The **External tool**
module ships **DISABLED** on this Moodle.

**Do this before anything else**, because the symptom has no error in it.
Until the module is enabled, neither External tool nor your preconfigured tool
appears in the activity chooser. The tool is correctly configured, the
registration is correct, both sides are right, and there is simply nothing to
click. Nothing says why.

## 2. Moodle -> create the tool

**Site administration -> Plugins -> Activity modules -> External tool -> Manage
tools -> configure a tool manually.**

| Moodle field | Value |
|---|---|
| Tool name | Certidemy |
| Tool URL | `https://certidemy.com/lti/launch` |
| LTI version | **LTI 1.3** |
| Public key type | **Keyset URL** |
| Public keyset | `https://certidemy.com/lti/jwks` |
| Initiate login URL | `https://certidemy.com/lti/login` |
| Redirection URI(s) | `https://certidemy.com/lti/launch` |
| **Supports Deep Linking (Content-Item Message)** | **CHECKED** |
| **Content Selection URL** | `https://certidemy.com/lti/launch` |
| Tool configuration usage | Show as preconfigured tool |
| Default launch container | New window -- **see step 5** |

**THE TWO BOLD ROWS ARE REQUIRED AND WERE MISSING FROM THIS TABLE.** Without
them there is no picker at all. Deep linking is not something Moodle infers from
the request; it is a checkbox and a second URL on the tool definition, and a
tool without them can only ever send `LtiResourceLinkRequest`.

### Half these fields are hidden behind "Show more..."

In the **Tool settings** section. **Custom parameters**, **Tool configuration
usage** and **the deep linking fields** are all behind it.

Worth naming because the fields do not look collapsed -- they look absent, and
the natural conclusion is that this Moodle version does not have them.

**Services: leave IMS LTI Assignment and Grade Services and Names and Role
Provisioning OFF.** Phase 1 implements neither, and advertising a service we do
not answer is a difference that ends up in a capability row.

**Privacy: set name and email deliberately.** Phase 1 never reads them -- the
picker is instructor-facing and needs no identity -- but phase 2 will, and an
institution that withholds them is a case worth knowing about early.

## 3. Moodle -> read back three values

**Manage tools -> View configuration details** on the tool you created.

- **Platform ID** -- this is the `iss`. For Moodle it is the site URL.
- **Client ID**
- **Deployment ID** -- note it, **but do not enter it anywhere.** Deployments
  auto-register on first launch. Entering one is neither necessary nor possible
  in our form.

Endpoints, observed 2026-08-27:

```
authorization   https://sandbox.moodledemo.net/mod/lti/auth.php
token           https://sandbox.moodledemo.net/mod/lti/token.php
jwks            https://sandbox.moodledemo.net/mod/lti/certs.php
```

The sandbox is `https://sandbox.moodledemo.net`; `demo.moodle.net` redirects
there. Credentials `admin` / `sandbox24`.

## 4. Certidemy -> register

Same form as Part One step 6. `iss` is the Platform ID.

**Worked example, the registration proven on 2026-08-27:**

```
name        Moodle sandbox 5.2
iss         https://sandbox.moodledemo.net
auth        https://sandbox.moodledemo.net/mod/lti/auth.php
token       https://sandbox.moodledemo.net/mod/lti/token.php
jwks        https://sandbox.moodledemo.net/mod/lti/certs.php
```

`client_id` is whatever that hour's tool produced -- see the reset box.

**Unlike the reference implementation, Moodle's `iss` IS a URL**, confirmed on
the wire. Do not generalise the bare-string case from Part One, and do not
generalise this one either: `iss` is an identifier and its shape is the
platform's business.

## 5. Launch -- and it is TWO launches, not one

Add the preconfigured tool to a course and open it as an instructor.

### The activity page is not the launch

With **Default launch container: New window**, opening the activity renders a
page containing an **"Open in new window"** link. **Nothing has launched yet.**
The launch is a second click, on a second page.

**This is the same single-click error corrected twice in Part One**, now in a
third place -- and unlike those two it is not a trap in somebody else's UI, it
was written into this runbook. The previous text said "open it as an instructor"
and stopped there.

### Embed is the second launch, and the frame is the real test

Set **Default launch container: Embed** and reopen the activity. That renders us
**in an iframe**, which is the configuration a real institution is most likely
to use and the only one that tests anything about being framed.

**Do both.** New window proves the launch; Embed proves it survives a frame.
Part One cannot test this at all -- lti-ri navigates top-level and has no
equivalent setting (Part One step 7).

## 6. Reaching the deep-linking picker

**It is on an EXISTING activity, not on the creation form.**

**Course activity -> Settings tab -> General -> Content -> "Select content".**

That is the whole path, and nothing on the activity creation form leads to it.
You create the activity first, then open its settings, then select content into
it.

### TRAP: "Add tool" builds a second registration, it does not open a picker

**Course -> More -> LTI External tools -> "Add tool"** looks exactly like the
affordance you want and is not.

It creates a **second, course-scoped tool definition from scratch**, defaulting
to **LTI 1.0/1.1 with a consumer key and shared secret**. Filling it in builds a
duplicate registration that our platform row knows nothing about, on a version
of LTI we do not implement.

**Cancel out of it.** The tell is the LTI version dropdown: if you are being
asked for a consumer key, you are creating a tool, not choosing content from one.

### TRAP: the padlock in that table is a status indicator, not a menu

Same table, **Actions** column. It means **"site-defined, not editable here"**.

It is not a control. Clicking it reports a permission error, which reads as
"you lack a privilege" when the truth is "this is not a button". It sits exactly
where a row-actions menu would sit.

## 7. Verify the rows -- what four launches actually wrote

Same queries as Part One step 7, plus the session:

```sql
select message_type, accept_types, accept_multiple, document_targets,
       locale, deep_link_data, consumed_at
from lti_launch_sessions;
```

### Observed 2026-08-27, four launches

Three `LtiResourceLinkRequest`, one `LtiDeepLinkingRequest`.
`clock_delta_seconds` **0, 1, 3, 1**.

```
product_family_code           moodle
advertises_link_content_item  false  0 of 1
aud_is_array                  false  0 of 4
custom_vars_substituted       false  0 of 4
releases_email                true   4 of 4
releases_name                 true   4 of 4
state_cookie_survives         true   4 of 4
supports_deep_linking         true   1 of 1
```

**`product_family_code = 'moodle'` is the first non-null value that column has
ever held.** lti-ri sent an empty string and the tolerant reader correctly wrote
NULL (Part One, closing notes). This is the first platform to actually fill it,
and it is still never branched on.

**`custom_vars_substituted = false` is the first observation of that value
anywhere.** `$Canvas.user.sisSourceId` came back as its own literal -- a Canvas
variable Moodle has no idea about -- and the `UNSUBSTITUTED` regex in
`_shared/lti-jwt.ts` caught it. That state was designed for a case nobody had
seen; this is the case.

**`state_cookie_survives = true, 4 of 4, IN A GENUINE THIRD-PARTY IFRAME** in
Chrome. The flip did not happen: this browser allows the cookie. **Safari is
where `false` is expected, and it has not been tested** -- so the `no` branch of
that tri-state has still never been observed anywhere. See step 8 of Part One's
Known gaps.

**The refusal page rendered correctly inside the Moodle iframe** -- legible, no
CSP or `X-Frame-Options` interference. That confirms the web-side header audit
**from a real browser in a real LMS frame** rather than from a datacentre curl,
which is a different claim.

### The row that lies, and knowing it before you read it

The deep-linking launch wrote `outcome = 'deep_linking_ok'`, `error_code` null
-- **and the picker then refused it.** See step 8.

That is not a bug in the row: `lti-launch` writes it the moment the request
verifies and a session is recorded, which is before any content selection
exists. But **it is written once and never revised**, and every refusal after
verification writes nothing at all. So the skeleton table currently says this
Moodle launch succeeded.

The fact IS recorded, in the other table:
`advertises_link_content_item = false`. When these two disagree, the capability
row is the one that knows.

## 8. WHERE IT STOPS -- Moodle accepts only `ltiResourceLink`

**This is the finding that decides the status marker at the top.**

Everything through verification works. The picker page then renders **"This
course cannot take the link"** and nothing is added to the course.

### The two platforms advertise different things

Observed verbatim:

| claim | Moodle 5.2 | 1EdTech reference |
|---|---|---|
| `accept_types` | `["ltiResourceLink"]` | `["link","file","html","ltiResourceLink","image"]` |
| `document_targets` | `["frame","iframe","window"]` | `["iframe","window","embed"]` |
| `accept_multiple` | `true` | `true` |
| `deep_linking_settings.data` | **null** | `"Some random opaque data that MUST be sent back"` |

**lti-ri accepts five content-item types and Moodle accepts one.** Every
deep-linking run before this one took the `link` path because lti-ri happened to
allow it. We build a `link` content item; Moodle will not take one; the picker
refuses up front rather than returning something the platform would discard
silently.

**`document_targets` diverges too**, which nobody predicted -- a second Tier A
difference on the same claim, found by reading the row rather than by reasoning
about the specification.

### The capability pair says it exactly

```
supports_deep_linking         true   1 of 1
advertises_link_content_item  false  0 of 1
```

**Deep linking works at this platform. Our content item does not.** That is the
first `false` `advertises_link_content_item` has ever taken, and **the first
time the pair has disagreed** -- on lti-ri both read true. Two keys were needed
precisely because these are two different facts, and this is the launch that
proved it.

### Moodle does not send `deep_link_data`, exactly as predicted

Confirmed `null`. So migration 259's echo path stays **unexercised here**, which
is the whole reason lti-ri was needed to prove it: a Moodle-only test would have
left that column looking finished and untested. See Part One step 8.

### What this costs, and where it goes

An `ltiResourceLink` content item points back at **our own launch URL**, so the
next thing Moodle does with one is send a **student** through it. That lands
directly in the entitlement question and in `profiles.email` being NOT NULL
UNIQUE.

**So this is not a small compatibility patch: it IS phase 2**, and it is settled
on paper before any code. It is the top open item.

---

# Facts worth keeping, whatever the platform

**`iss` is an issuer identifier and need not be a URL.** The reference
implementation sends the bare string `certidemy`. Moodle sends a site URL.
Canvas cloud sends `https://canvas.instructure.com` for every institution on
earth. Nothing may assume the shape, and `iss` alone identifies nothing -- the
registration key is **`(iss, client_id)`**.

**Platforms send structure they do not fill.** The reference implementation sent
`tool_platform` with **five of seven fields as empty strings**, including
`product_family_code`. An empty string is not an absent value and must not
become one: the four-state reader in `_shared/lti-jwt.ts` classified it
`provided_empty`, `hasValue()` returned false, and
`lti_platforms.product_family_code` correctly stayed NULL rather than acquiring
`""` permanently.

**Clock delta on a healthy launch was +31 seconds** -- the OIDC round trip.
Positive means the platform's clock is BEHIND ours, which is the safe direction.
**Negative means their clock is fast**, and `iat` carries no leeway by design, so
`iat_in_future` follows. A delta of -2 is a time-sync conversation with the
institution; -3600 is something else entirely.

**Deployments auto-register.** Never enter a deployment id. Refusing an unknown
one would make every new Canvas placement a support ticket, and the value is
attested by a signature we have already verified.

**Errors are generic outward and precise inward.** Every verification failure
shows one page and a reference id; the real `error_code` is in
`lti_launch_skeleton`, readable at `/console/lti` by a platform_admin. Ask for
the reference id, then look it up. `nonce_not_found` and `nonce_consumed` are
deliberately indistinguishable to a caller -- the difference is a replay oracle.

---

## Known gaps

- **No edit action for a registration.** A wrong value needs raw SQL.
  `update-lti-platform` is planned; until then, correct `lti_platforms` directly.
- **SETTLED 2026-08-27 -- deep linking is proven** against lti-ri: picker,
  signing, session consumption and the platform accepting the response. See
  Part One step 8. Not proven against Moodle.
- **We do not record whether the `data` echo was sent.** The skeleton row for an
  `LtiDeepLinkingResponse` carries `content_items` and a count and nothing about
  the echo, so on a platform that rejects our response at its own end -- the
  precise failure migration 259 exists to prevent -- we could not answer "did we
  send `data` back?" from our own records. The claim is included whenever the
  column is non-empty, but that is a fact about the code, not evidence about a
  launch.
- **A capability flip leaves no trace of having flipped.**
  `lti_record_capability` overwrites `value` and increments
  `observation_count` unconditionally, so `observation_count` counts
  observations of the KEY, not of the current value, and there is no
  `first_observed_true_at` or previous value. `supports_deep_linking` reads
  `true, 4` and nothing says it was ever `false`; the only record of the change
  is a `resource_link_unsupported` skeleton row from an hour earlier. That is a
  gap in exactly the place the variance architecture cares most about -- a Tier
  C capability written at runtime by the code that discovers the limitation,
  where the flip IS the interesting event.
- **PARTLY SETTLED 2026-08-27 -- the frame is tested, the blocked cookie is
  not.** Part Two ran against Moodle 5.2 with the launch container set to
  Embed: we rendered inside a real LMS iframe in Chrome, the page was legible
  with no CSP or `X-Frame-Options` interference, and `state_cookie_survives`
  read `true`, 4 of 4, in that genuine third-party frame. **What is still open
  is the other half:** Chrome allowed the cookie, so the flip never happened,
  and **the `false` branch of that tri-state has never been observed anywhere,
  on any platform, in any browser.** Safari is where it is expected and it is
  untested. lti-ri cannot produce it at all -- it navigates top-level. See
  Part One step 7 and Part Two step 7.
- **`link_type_not_accepted` is still unexercised even though Moodle triggered
  the condition.** Two guards cover it and only the quieter one ran: the picker
  refuses on `accepts_link === false` before anything can be submitted, so
  `lti-deep-link`'s own refusal -- the one that records a capability -- is never
  reached. See Part Two step 8.
- **Every refusal after verification writes no `lti_launch_skeleton` row.** The
  Moodle deep-linking launch reads `deep_linking_ok` while the picker refused
  it. `outcome` is written once, at verification, and never revised. The
  capability row is the one that knows. See Part Two step 7.
- **Unexercised checks:** the `azp` branch (needs an array `aud`),
  `unsubstituted` custom variables, `accept_multiple = false`,
  `link_type_not_accepted`, the noscript submit button, and every JWKS error
  code except the ones above.
- **Student launch is phase 2**, and it is where the identity and entitlement
  work lives -- creating users we did not create, signing them in without a
  password, and deciding what a launched student is entitled to.
