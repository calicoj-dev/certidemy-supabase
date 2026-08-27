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

**Free tier:** core launch is free. Whether Deep Linking is free or requires
1EdTech membership is UNKNOWN -- their wording is *"IMS Members have access to
the complete functionality of the tool including services and message types"*,
and Deep Linking is a message type. Not established either way. Do a resource
link launch first regardless: it proves everything except the picker.

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

## 5. Launch -- and use the right button

There are two, and only one works.

**The plain "Launch" button POSTs the `id_token` with NO `state`.** We refuse
it: `missing_id_token_or_state`, recorded in the skeleton with a null
`platform_id`. **That refusal is correct** -- without a `state` there is no
`lti_nonces` row, so nothing binds the token to a flow we started, and it cannot
be told from a replay.

**The OIDC path is "Launch Resource Link (OIDC)", on the resource link's ROSTER
page.** The roster is where their generated users live, and a launch needs a
user. Their `/users` endpoint **502s**; the roster page is the way in.

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

---

# PART TWO -- a real Moodle

> ## WRITTEN FROM THE SPECIFICATION AND NOT YET EXECUTED
>
> **Nothing below has been run.** Part One is proven; this is not. Field names,
> menu paths and Moodle's own behaviour are from documentation, and Moodle's
> configuration differs between versions.
>
> **The first real Moodle registration is the thing that validates this half.**
> Whoever does it should correct this section from what they actually see, and
> move this banner when they have.

## 1. Moodle -> create the tool

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
| Tool configuration usage | Show as preconfigured tool |
| Default launch container | New window |

**Services: leave IMS LTI Assignment and Grade Services and Names and Role
Provisioning OFF.** Phase 1 implements neither, and advertising a service we do
not answer is a difference that ends up in a capability row.

**Privacy: set name and email deliberately.** Phase 1 never reads them -- the
picker is instructor-facing and needs no identity -- but phase 2 will, and an
institution that withholds them is a case worth knowing about early.

## 2. Moodle -> read back three values

**Manage tools -> View configuration details** on the tool you created.

- **Platform ID** -- this is the `iss`. For Moodle it is the site URL.
- **Client ID**
- **Deployment ID** -- note it, **but do not enter it anywhere.** Deployments
  auto-register on first launch. Entering one is neither necessary nor possible
  in our form.

Endpoints, derived from the site URL:

```
authorization   https://<site>/mod/lti/auth.php
token           https://<site>/mod/lti/token.php
jwks            https://<site>/mod/lti/certs.php
```

## 3. Certidemy -> register

Same form as Part One step 6. `iss` is the Platform ID.

**Unlike the reference implementation, Moodle's `iss` IS a URL.** Do not
generalise the bare-string case from Part One.

## 4. Launch

Add the preconfigured tool to a course and open it as an instructor.

**Expect the deep-linking path**, which is NOT proven anywhere yet: the picker
at `/lti/select`, a choice, and a signed response planting a link to
`/{locale}/certifications/<code>`.

A student clicking that link reaches the public certification page and needs no
session. A student launching the TOOL reaches the "student launch is not
available yet" page.

Verify with the same queries as Part One step 7, plus:

```sql
select message_type, deep_link_return_url, accept_types, accept_multiple,
       locale, deep_link_data, consumed_at
from lti_launch_sessions;
```

Expect one row with `consumed_at` NOT NULL after the response is sent, and
`accept_types` containing `link`.

**The one failure with no telemetry on our side:** if the platform rejects our
signed response, that rejection happens entirely at their end. Nothing is
written here. Whether Moodle shows the planted link is the only signal.

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
- **Deep linking is unproven anywhere.** Picker, signing, `deep_link_data` echo
  and session consumption are all reviewed and not tested.
- **Unexercised checks:** the `azp` branch (needs an array `aud`),
  `unsubstituted` custom variables, `accept_multiple = false`,
  `link_type_not_accepted`, the noscript submit button, and every JWKS error
  code except the ones above.
- **Student launch is phase 2**, and it is where the identity and entitlement
  work lives -- creating users we did not create, signing them in without a
  password, and deciding what a launched student is entitled to.
