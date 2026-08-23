# HANDOFF v8.4 — Email infrastructure

**This is a delta.** v8.2 is still the substance; v8.3 is the previous delta and
carried the email research this session acted on. Read those first. This file
covers one session, on one subject: outbound email.

**Migration tip: 243. Next free: 244.**

---

## What changed, in one breath

Certidemy had no outbound email at all. It now has two independent paths — auth
mail through Supabase SMTP, and product mail through a queue — both on one
provider, one sending domain, one reputation. Cross-device password recovery was
broken and is fixed.

---

## 1. The thing that was actually broken

Custom SMTP was **off**, so Supabase auth mail was on the built-in service. That
service is capped at ~2 messages/hour project-wide **and only delivers to
addresses belonging to the project's organization members**. Every other
recipient fails with "Email address not authorized" — silently, from the
client's point of view.

So password reset and email confirmation were dead for every real user. Not
degraded: dead. This had presumably been true since the project was created.

Fixed by enabling custom SMTP (section 3 below).

---

## 2. Provider decision — Resend

Account under `info@certidemy.com`. Sending domain **`mail.certidemy.com`**,
region **us-east-1**.

**Why not Google Workspace**, which was the obvious alternative since `info@`
already lives there: Workspace has no per-message delivery webhooks, no bounce
or complaint feed, and no suppression list. For an ISO/IEC 17024-aligned scheme,
"was the holder notified, when, and did it arrive" is part of the record, not a
convenience. Google keeps the humans — MX, `info@`, receiving, replies. The
provider gets the machines.

**Why a subdomain rather than the apex:** reputation isolation. A partner
uploads a stale list, bounces spike, and the damage lands on
`mail.certidemy.com` rather than on the domain Andres and Jairo email from.

> **Correction to something said mid-session.** I claimed apex verification
> would put Google's MX at risk. That was wrong — Resend puts its bounce MX on a
> `send.` subdomain either way and never touches the apex. The subdomain is
> still right, but for one reason (isolation), not two.

**DNS, all in Cloudflare, all under `mail`:**

| type | name | value |
|---|---|---|
| TXT | `resend._domainkey.mail` | DKIM public key |
| TXT | `send.mail` | `v=spf1 include:amazonses.com ~all` |
| MX | `send.mail` | `feedback-smtp.us-east-1.amazonses.com` pri 10 |

Applied via Cloudflare's Domain Connect template. Nothing at the apex was
touched — apex SPF is still Google-only and still owes Shopify an include.

Verified in 5 minutes. Gmail confirms `send.mail.certidemy.com` as sender and
`mail.certidemy.com` as DKIM signer, so **DKIM alignment is strict** and the
setup survives tightening the apex to `p=reject` later.

**No tracking subdomain, deliberately.** Click tracking only exists once a
tracking subdomain exists, and none was created. This is not an oversight:
- The verify URL *is* the content of an issuance email. A holder who copies it
  into a job application must get `certidemy.com/verify/...`, not a redirect
  owned by a third party. Same discipline as the LinkedIn `organizationId` and
  the signature on a partner's PDF.
- Auth links are single-use; every redirect hop is another chance for a
  corporate mail scanner to burn the token before the user clicks.

Delivery, bounce and complaint events all still arrive via the webhook. Only
per-link click counts are lost, and transactional mail has no use for those.

**Keys** (three secrets, three homes):

| name | where it lives | used by |
|---|---|---|
| `supabase-auth-smtp` | Supabase Auth → SMTP password | auth mail |
| `certidemy-issuance` | `RESEND_API_KEY` function secret | `dispatch-emails` |
| webhook signing secret | `RESEND_WEBHOOK_SECRET` function secret | `resend-webhook` |

Two send keys, not one, so rotating the edge function's key cannot knock out
password resets. Both scoped to Sending access on `mail.certidemy.com` only.

Function secrets rather than Vault: Vault earns its keep when two sides need the
same value (that is why `webhook_dispatch_key` is there). These have one
consumer each.

---

## 3. Supabase auth mail

Authentication → Emails → SMTP Settings:

```
Sender email:  no-reply@mail.certidemy.com
Sender name:   Certidemy
Host:          smtp.resend.com
Port:          465
Username:      resend          <- the literal string, not an email
Password:      <supabase-auth-smtp key>
```

Rate limit set to **50/hour** (Supabase drops a 30/hour default the moment
custom SMTP is enabled). Under Resend's 100/day, with room for a partner
onboarding a cohort.

Reply-To is `info@certidemy.com` so a human reply lands in a real mailbox —
the sending subdomain has no inbox and must never look like it does.

**Security notification templates enabled:** Password changed, Email address
changed. The other five (phone, sign-in method linked/removed, MFA added/removed)
are off because nothing generates them yet — turn each on with the feature it
describes.

**Auth templates are still single-language.** The real fix is Supabase's
**Send Email Hook**, which replaces SMTP with a call to an edge function so we
render our own trilingual templates. Deferred to whichever session does console
translation, because that is when trilingual templates stop being a nuisance and
become the task.

---

## 4. Cross-device password recovery — the real bug

**Symptom:** reset link landed on `/en/login` with no explanation.

**Diagnosis chain, worth keeping because I guessed wrong twice on the way:**
I blamed the redirect allow list, then the email template. Both were fine. What
settled it was the actual URL:

```
/en/login?error=missing_code#error=access_denied&error_code=otp_expired
```

Read backwards: Supabase honoured `redirect_to`, the callback ran, and it got an
error instead of a code. **The fragment never leaves the browser**, so the server
saw only "no code" and the real reason was invisible in logs — it was sitting in
the address bar the whole time.

**Root cause:** the link carried `token=pkce_...`. PKCE requires the
`code_verifier` cookie set *in the browser that requested the reset*. Request on
a phone, open on a laptop, and `exchangeCodeForSession` has nothing to verify
against. That is the most common reset path there is.

**Fix** (Supabase's own documented Next.js pattern):
- New route `app/[locale]/auth/confirm/route.ts` calling
  `verifyOtp({ type, token_hash })`. `verifyOtp` POSTs the hash to Supabase Auth
  and gets the session back in the response body — no browser-side verifier, so
  any device works.
- `forgotPasswordAction` redirectTo changed `auth/callback` → `auth/confirm`.
- Reset template body line 4 is now:
  ```html
  <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Reset password</a></p>
  ```

> **DO NOT REVERT THE TEMPLATE TO `{{ .ConfirmationURL }}`.** That is the PKCE
> link. It works on one device and fails on two, which is exactly the shape of
> bug that survives testing.

`auth/callback` is unchanged and still handles OAuth and email confirmation.

**Also fixed in the new route:** `next` arrives from a link in an email and is
therefore attacker-influenced. Prepending `origin` is not enough — `//evil.com`
yields a protocol-relative URL that browsers resolve to another host. `safeNext`
rejects anything that is not a single-slash, backslash-free, same-origin path.
**The same open redirect still exists in `auth/callback/route.ts`,** which
redirects to `${origin}${next}` unfiltered. Not fixed. See open items.

**Verified on real hardware:** desktop request → phone click → update-password.
That is the case that failed before.

**Deploy order matters:** the new route and the old callback coexist, so deploy
the code first and flip the template second. Doing it the other way leaves
recovery broken for the length of a Pages build.

---

## 5. Migration 243 — the email queue

`243_email_queue.sql`. Editor-first as always; the file records what already ran.

**Tables**
- `email_queue` — `template_key`, `to_email`, `locale`, `payload jsonb`,
  `dedupe_key` (UNIQUE), `status`, `attempts`, `next_retry_at`, `claimed_at`,
  `provider_message_id`, `delivery_status`, `last_error`, `sent_at`
- `email_suppressions` — `email` PK, `reason`, `source_id`

RLS enabled, no policies, **and no table-level grant to `anon` or
`authenticated`** — the missing grant is the real gate, since the grant is
checked before RLS.

**Functions** (all `security definer`, all `service_role` only)
- `claim_email_sends(limit)` — `FOR UPDATE SKIP LOCKED`, reclaims rows stuck in
  `sending` after 5 minutes
- `complete_email_send(...)` — backoff 1m/5m/30m/2h/12h then `abandoned`
- `enqueue_email(...)` — lowercases and trims the address; `ON CONFLICT
  (dedupe_key) DO NOTHING` then returns the **existing** id
- `record_email_event(provider_message_id, event)` — writes `delivery_status`,
  and inserts a suppression on bounce/complaint

**Deliberately mirrors 235 (`webhook_dispatch`)**, including reusing
`webhook_dispatch_secret()` rather than minting a second Vault secret. Same
trust boundary — pg_cron calling one of our own functions — so a second secret
would be a second thing to rotate and no additional isolation.

**Suppression is checked inside `claim_email_sends`, at send time — not at
enqueue.** A row can sit queued for minutes while a hard bounce for the same
address arrives from a different message. Enqueue-time checking leaves that
window open. On a platform hosting partner credentials the sending reputation is
shared, so one partner's stale list must not cost every other issuer their
deliverability.

**Dedupe proof:** `enqueue_email(..., 'test-1')` called twice with
`'INFO@Certidemy.com '` and `'info@certidemy.com'` returned the same uuid.

---

## 6. `dispatch-emails`

`functions/dispatch-emails/index.ts`, pinned `verify_jwt = false`. pg_cron every
minute, gated on the shared secret both sides read from Vault. Same shape as
`dispatch-webhooks`: claim, render, send, complete, one attempt per run.

**A separate dispatcher, not folded into `dispatch-webhooks`.** A partner's HTTP
endpoint and Resend fail differently, and a partner endpoint hanging for its full
10s timeout must not hold an issuance notice behind it in the same batch.

**Terminal vs retryable.** 4xx other than 429, and any render failure, go
straight to `abandoned` rather than burning five retries over 15 hours to arrive
at the same answer. `last_error` is prefixed `TERMINAL:` in that case.

**Renders from `payload` alone — no database reads.** The queue row is a
point-in-time snapshot, so editing an achievement tomorrow does not retroactively
change what an email already queued says. This is the **opposite** of the
credential document, which `buildCredential` reads live on every request, and the
difference is deliberate: a credential is a live assertion, a notification is a
record of what was said at the time.

**From line:** `{issuer_name} via Certidemy <no-reply@mail.certidemy.com>`,
Reply-To `info@certidemy.com`.

**cron job ids:** 1 = `dispatch-webhooks`, 2 = `dispatch-emails`. Both `* * * * *`.

---

## 7. `_shared/email-templates.ts`

Templates live **in git, not the database** — a template ships with the code that
populates it and gets reviewed like code. One in a table can be edited by anyone
with console access, with no diff and no review, and what it says is a claim made
on a partner's behalf.

`render(templateKey, locale, payload)` is pure. One key so far:
`issuance.credential`, in `en` / `es-419` / `pt-BR`.

**The claims discipline, as implemented:**
- Subject names the **issuer**
- Body says the **issuer** issued it
- Certidemy appears exactly twice, both as infrastructure: the verify domain,
  and a footer reading "Sent by Certidemy on behalf of {issuer}. Certidemy hosts
  and verifies this credential; {issuer} issued it."
- Nowhere does it say Certidemy issued, taught, assessed or awarded anything

**Two guards worth keeping:** every interpolated value is HTML-escaped (issuer
and achievement names are typed into a console by someone we do not employ), and
`verify_url` is rejected unless it starts `https://certidemy.com/` — a payload
that becomes an `href` is a redirect someone else controls otherwise.

**8,698 bytes, UTF-8, accented.** It reached disk by download and Move-Item and
must never be pasted through the SQL editor or a PowerShell console.

---

## 8. `resend-webhook`

`functions/resend-webhook/index.ts`, pinned `verify_jwt = false`. The caller is
Svix and carries no Supabase JWT.

Endpoint registered in Resend for `email.delivered`, `email.bounced`,
`email.complained` only. Not `opened`/`clicked` — tracking is off, so they can
never fire.

**Svix scheme:** headers `svix-id` / `svix-timestamp` / `svix-signature` (also
accepts `webhook-` prefixes, which higher Svix tiers use), HMAC-SHA256 base64
over `<id>.<timestamp>.<raw_body>`, secret prefixed `whsec_` (the key is the
base64 after the prefix), signature header carries space-separated `v1,` values
and any one matching is valid. 5-minute replay window.

**`req.text()` once, verify over exactly those bytes.** Parsing to JSON and
re-serialising reorders keys and breaks the signature. This is the single most
common way to get webhook verification wrong.

**Only `bounce_type === 'hard'` suppresses.** `email.delivery_delayed` and soft
bounces are a full mailbox or a receiver having a bad afternoon; retiring that
address would cost a real holder their credential notice.

**Unknown `email_id` returns 200, not 4xx** — a 4xx makes Svix retry an event
that can never match (e.g. an auth email sent over SMTP, which has no queue row).

**Svix does not backfill.** Events only exist for messages sent *after* the
endpoint was registered. `smoke-1` has `delivery_status = null` forever and that
is correct, not a gap.

---

## 9. A TypeScript trap, written down because it will recur

`deno check` rejected `crypto.subtle.importKey` with TS2769. Cause: a helper
annotated `function b64ToBytes(b64: string): Uint8Array` widens the buffer type
to `ArrayBufferLike`, and `importKey` wants `ArrayBuffer`. `dispatch-webhooks`
avoids this by accident — it builds its key buffer inline, so inference keeps the
narrow type.

**Annotate `Uint8Array<ArrayBuffer>` on any helper returning bytes for WebCrypto.**

---

## 10. Corrections to earlier handoffs

- **`verify-credential` and `credential-og` config.toml pins are DONE.** Both are
  present in `config.toml` with the LinkedIn-crawler incident written up. The
  open-items list in v8.2/v8.3 says they are outstanding. They are not.

---

## Open items from this session

**Blocking "issuance email shipped":**
- **Nothing calls `enqueue_email`.** The plumbing works and no product event uses
  it. Next step is 244. Argument for doing it in SQL — inside the issuance
  statement or a trigger on the credentials insert — rather than from TypeScript
  after the mint: a crash between minting and enqueueing otherwise leaves a
  credential nobody was told about. Same reasoning 232 used for webhook rows.
- **Unknown, needs reading not guessing:** which tables/columns hold
  `issuer_name`, `achievement_name`, the holder's email and the holder's locale
  at issuance time — and whether a holder email is stored at all for partner
  credentials.

**Small and worth doing:**
- **Login page ignores the `#error=` fragment.** An expired link gives a bare
  login screen while the real message sits in the address bar.
- **Open redirect in `auth/callback/route.ts`** — `${origin}${next}` unfiltered.
  `auth/confirm` has `safeNext`; callback does not.
- **TLS is Opportunistic** on the Resend domain unless changed since. Enforced is
  correct: a reset link is a bearer token in the message body, and Opportunistic
  sends it in the clear to any server that refuses TLS.
- **The auth account is keyed to `info@certiglobal.org`**, a domain being
  retired. It reaches `info@certidemy.com` by alias today. When the domain lapses
  or the alias is removed, recovery for the highest-privilege account has nowhere
  to go. Unrelated to any bug found this session.
- **DMARC still `p=none`.** Subdomain inherits from the apex. DKIM alignment is
  already strict, so tightening should be safe after a monitoring period.

**Never verified this session:** how the Spanish issuance email actually rendered
in an inbox — accents, From line, and whether the body reads as the partner's.
The Portuguese one delivered and the byte counts matched at every hop, so the
multibyte path is very likely clean, but nobody has read the rendered message.

---

## Working-agreement notes

- **Deliver long files as downloads, not PowerShell here-strings.** A 300-line
  paste through a PS 5.1 console has failure modes a file does not. Established
  pattern: `Remove-Item` the stale Downloads copy → download → `Move-Item
  -Force` → verify byte count. Byte counts were given in advance every time and
  caught nothing, which is the point.
- **Validate before writing, not after.** A patch script that writes and then
  fails a post-condition leaves the file on disk while printing ABORT, which
  breaks the "ABORT means nothing was written" contract and makes the re-run
  abort with a misleading "already exists".
- **Post-condition guards must match code shapes, not words.** A guard checking
  `includes("to anon")` aborted on the comment line
  `-- RLS on, no policies, and NO grant to anon or authenticated`. The guard
  matched the sentence explaining that no such grant exists. Use a regex over
  `grant ... to <role>`.
