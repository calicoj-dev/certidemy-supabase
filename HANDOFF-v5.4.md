# HANDOFF v5.4 — advertising, consent, and the copy that was left behind

**Session date:** 2026-08-06
**Supersedes:** nothing. Read v5.3 and its addendum first; this is the next chapter.
**Migration tip:** **174 applied** · next free **175**
**Repos:** both clean and pushed
**Build:** green, no new warnings

The session began as a question about whether the site needed a cookie policy and
ended with an advertising stack, a rewritten privacy clause, and four corrections
to things this project believed about itself.

---

## 0. WHAT TO DO FIRST

**Two things block a campaign and neither is code.**

1. **Does CertiGlobal's checkout expose a webhook or order-completion endpoint?**
   Asked four times this session, still unanswered. Without it there is no
   attribution: the money event fires on certiglobal.org and certidemy.com never
   sees it, so Meta and Google optimise on landing-page views. Everything in §5
   hangs on this.
2. **Nothing is enabled.** Ten vendor adapters ship; zero rows are on. Enabling
   one is still a SQL `update` because the console panel is not built (§8).

**One verification is owed** (§3.3): notice-mode opt-out was never confirmed
end to end. It is the newest path and the one that fires in Colombia.

---

## 1. THE ADVERTISING STACK — what shipped

Marketing is about to run LinkedIn, Reddit, Google and Meta, with GoHighLevel
already in place. Nothing existed to receive that.

### 1.1 The governing rule

> **Vendors live in code. Identifiers live in the database.**

Superadmin pastes `1234567890123456`. Nobody ever pastes a `<script>` block into
a form, and **Google Tag Manager is excluded for the same reason** — it grants
container access the ability to inject any script into certidemy.com, outside
this repo and outside code review, on a platform that runs secure examinations.

This is not caution about the marketing team. It is about what the artifact is,
and the ID-only version is also the one that actually works:

| A pasted snippet cannot | Because |
|---|---|
| Be consent-gated | Holding a tag until the banner resolves needs something owning the load call |
| Be surface-restricted | Keeping tags off `/quiz/play` needs the app deciding per route |
| Fire anything but `PageView` | The value is in `sign_up` and `purchase`; Meta's boilerplate does not know what a voucher is |
| Send server-side conversions | Those come from an edge function with a token |

### 1.2 Migration 174 — `marketing_integrations`

Identifiers, never executable code. **There is no `snippet` column and there
must never be one.**

- `vendor` PK, `external_id`, `enabled`, `events[]`, `consent_category`, `settings` jsonb
- `vault_secret_id` + `key_last4` for server-side conversion tokens, following
  the migration-144 GHL pattern — the token is never in the table
- Check constraint: an **enabled** row may not have a blank id (a blank id
  renders a broken tag on every page); a disabled row may, so a vendor can be
  staged before its id is issued
- `marketing_integrations_audit` with a `before/update/delete` trigger that
  strips `vault_secret_id` from the trail
- `marketing_store_token` / `marketing_read_token`, `service_role` only

**Grants are column-scoped and that is the whole point.** RLS passing is not a
grant, and a table-wide `GRANT SELECT` re-confers every column, silently
overriding any column-level revoke. Seven safe columns are listed explicitly;
`vault_secret_id` and `key_last4` are outside the grant.

Verified live: 7 columns × 2 roles, **zero** table-wide grants, RLS on both
tables, RPCs `service_role` only, check constraint fires, audit trigger records.

### 1.3 The code

| File | What it is |
|---|---|
| `lib/marketing/vendors.ts` | **The registry.** Ten adapters: Meta, Google Ads, GA4, LinkedIn, Reddit, Bing UET, TikTok, Pinterest, X, GHL embeds. Each ~20 lines: `id`, `category`, `scriptHosts`, `load`, `track`. `injectScript` is the only place a third-party `<script>` element is ever created, and it refuses non-allowlisted hosts |
| `lib/marketing/consent.ts` | Two categories, cookie-stored, versioned, 365-day expiry. GPC. Consent Mode v2 defaults + update |
| `lib/marketing/surfaces.ts` | Hard-coded route blocklist. **Code, not configuration** |
| `lib/marketing/regime.ts` | `optin` / `notice` from Cloudflare `cf-ipcountry` |
| `lib/marketing/track.ts` | The only way app code fires an event; plus cross-domain attribution capture |
| `lib/marketing/load-integrations.ts` | Server loader, failure-tolerant, safe columns only |
| `components/marketing/tag-loader.tsx` | **The choke point.** Every third-party script passes through here |
| `components/marketing/consent-banner.tsx` | Trilingual, both regimes |
| `components/marketing/cookie-settings-link.tsx` | Withdrawal |

Bing, TikTok, Pinterest and X are staged deliberately so a campaign launch is
never blocked on a deploy. Adding a vendor the code knows is a row and a toggle;
adding one it has never heard of is one file and one migration.

### 1.4 Surfaces — the exclusions are decisions

`lib/marketing/surfaces.ts`. **No console setting can override these.**

| Blocked | Why |
|---|---|
| `/verify/[id]` | A public page showing a **named credential holder**. A tag there tells the ad network who is looking up whom. These pages are indexable *on purpose*, which makes tagging them worse, not better |
| `/quiz`, exam routes | A third-party script inside a secure examination is an integrity problem before it is a privacy one |
| `/learn` | Lesson behaviour is study data under contract, not advertising data |
| `/console` | Staff surfaces |
| `/reset-password`, `/update-password` | URL carries a token |

Two independent mechanisms guard this: the path check, **and** `TagLoader` being
mounted only in the marketing route group. The one that costs nothing is the one
that cannot be defeated by a routing change.

### 1.5 `credential_issued` does not exist

Events: `page_view · sign_up · enroll · lesson_start · checkout_start ·
purchase · lead`.

Firing a conversion when a credential mints tells an advertising network that a
named individual passed a certification examination. A certification body does
not disclose that. **Enforced by omission** — the event is not in the type, so
the call does not compile. The commercial event is `purchase`, which happens
earlier and is the better optimisation target anyway.

---

## 2. CONSENT — and the reasoning that drove it

### 2.1 Two categories, not five

`necessary` and `marketing`. Certidemy has no analytics product separate from
advertising, so a second toggle buys nothing but a larger surface to get wrong.

### 2.2 What consent does NOT cover

**Study progress, quiz history, exam records and credentials are CONTRACT**
(GDPR Art. 6(1)(b)), not consent. Tracking a learner's progress *is* the service
they asked for.

Making that consent-based would be actively harmful: consent is withdrawable,
and a candidate who fails and withdraws it would oblige us to stop processing
the records ISO/IEC 17024 requires us to retain — records backing a credential
already issued to a relying third party. **A certification body cannot have its
evidentiary chain revocable by the person it is evidence about.**

Same reasoning for exam telemetry when it ships: contract plus legitimate
interest in examination integrity, **disclosed prominently**. Disclosure is the
control with real deterrent value anyway.

§5 of the Privacy Policy already covers all of this and needed no change.

### 2.3 Geo regimes

Prior opt-in is an EEA/UK requirement. **Colombia's Ley 1581 governs processing,
not device storage** — no ePrivacy equivalent, so no prior consent is legally
required for the entire Cali audience.

- `optin` — EEA + UK + CH, **plus Brazil**. Blocking choice, tags held.
- `notice` — everywhere else. Tags load, dismissible bar, opt-out available.
- Unknown country → `optin`. Absent configuration is not neutral.
- **GPC wins in both regimes**, before any UI renders.
- `src` is recorded on every decision, so which regime produced it is provable.

**Brazil is a conservative call, not a settled reading.** LGPD is stricter on
advertising cookies than the rest of LATAM and ANPD has been active. One line to
move; worth putting to counsel.

Resolved **server-side in the marketing layout**, not middleware — nothing here
needs to run before routing, and the next-intl matcher has already broken
metadata routes once.

### 2.4 The banner

- **Decline has equal visual weight to Accept.** Same size, same shape, same
  row, refusal first — in *both* modes.
- No pre-ticked boxes. Continuing to browse is not consent.
- A bar, not a modal.

**The copy was rewritten mid-session** because the first version was
self-sabotaging: heading "Cookies for advertising" is a Decline button with a
title on it. Rewritten to lead with "Cookies", give a reason, and — the line
that does the most work — state that **study progress, exam records and
credentials are never part of this**. That answers the fear actually driving the
refusal, and it is true.

**Ambiguity was rejected as a strategy, on practical grounds:** consent obtained
through ambiguity is void, so the tags then loaded unlawfully *and* the
attribution data is unusable. A murky banner fails at both jobs at once. It is
also read by university legal offices reviewing a body whose pitch is *the
blueprint is public, check it yourself*.

### 2.5 No vendor, no cookie

If nothing is enabled, `TagLoader` writes no consent cookie at all. Writing one
anyway would itself be a non-essential cookie set for no purpose. Verified live
in production: theme, locale and Supabase cookies only.

---

## 3. PRIVACY §6 — rewritten

**The old clause asserted as fact that a codebase sweep found no advertising
cookies.** That is a claim about the code, not a policy position, and it becomes
false the moment someone flips `enabled` on a row.

The replacement is written to be true in **both** states: it describes the
mechanism unconditionally and keeps the current position in a separate, **dated**
sentence. Five claims, each true only because something was built:

1. Necessary cookies cannot be switched off — always was true
2. Advertising is consent-gated, or notice-based where prior consent is not required — §2.3
3. **Withdrawal via the footer link** — built this session. Before it existed this sentence would have been a lie, which is why the banner copy deliberately omitted it
4. **Never on study, examination or verification pages** — §1.4. The strongest sentence in the clause and the one a university DPO will notice
5. GPC honoured in every region

Plus a §7 line placing advertising partners as **independent controllers, not
sub-processors** — lumping them in with Supabase and Cloudflare would be wrong.

The file's provenance comment now records that §6 carries a dated factual claim
to be re-checked in the same commit that enables any vendor.

**English only.** `getLegalDoc` falls back to English for es-419 and pt-BR with
an `isFallback` notice; there are no `privacyEs` / `privacyPt` consts. Spanish
terms are still owed and are more pressing now — see §7.

### 3.3 What was NOT verified

| Verified | Not verified |
|---|---|
| Cookie writes `m:false` / `m:true`, `src` recorded | **Notice-mode opt-out** → reload → `fbq` undefined |
| No banner or `fbq` on `/learn` and `/verify` | **Consent Mode ordering** — `default` present in `dataLayer` before `update` |
| Footer withdrawal clears cookie and unloads tags | Server-side conversions (not built) |
| No cookie when no vendor enabled (prod, US → notice) | |

---

## 4. COPY — family → program

The **route** was already migrated: `/certifications/family/[slug]` is a 308 to
`/program/`, written by someone earlier and mistaken for dead code twice this
session. **Do not delete it** — it protects shared and indexed URLs.

Six customer-facing strings were left behind and are now fixed:
`compareLink` in three locales, and the three Scrum eyebrows in
`family-content.ts`. `scripts/i18n-family.mjs` was updated in the same pass —
otherwise it silently re-applies the old wording on its next run.

**Deliberately unchanged:** `family-content.ts` as a filename,
`getFamilyContent` / `FAMILY_SLUGS` / `FamilyContent`, and the `"family"` JSON
key. Internal names a customer never sees; renaming means touching three
`getTranslations` call sites for nothing.

---

## 5. MARKETING STRATEGY — rulings, recorded because they are decisions

### 5.1 The structural gap

```
ad → certidemy.com → free course → VOUCHER PURCHASE ON CERTIGLOBAL → exam
```

Every generated asset deliberately carries no price because pricing is
CertiGlobal's. So the money event fires on certiglobal.org. **Point a campaign at
this today and the platform sees a landing-page view and nothing else.**

`track.ts` captures click identifiers on landing (first-touch wins) and
`decorateCertiGlobalLink()` replays `cd_sid` plus UTMs on the handoff.
CertiGlobal must echo `cd_sid` back on order completion. **Blocked on §0.**

### 5.2 Three rules for when it lands

1. **Send purchases server-side** from an edge function — survives ad blockers and iOS.
2. **Server-side does not escape consent.** Common misread. Sending a hashed
   email to a conversion API is still disclosing personal data for advertising.
3. **Do not optimise on purchase.** Meta and Google need ~50 conversions/week to
   leave the learning phase and you will not have that at launch. **Optimise on
   `sign_up`**, feed `purchase` back as a value-based conversion for ROAS only.
   Signup is an honest high-volume proxy *because the course is free* — the free
   course is not a leak in the funnel, it is the top of it, and it is the
   structural advantage over every competitor charging for courseware.

### 5.3 Two funnels, one configuration is wrong

| | B2B (Cali, universities) | B2C (learners) |
|---|---|---|
| Platforms | LinkedIn only | Meta, Google, Reddit, Bing later |
| Conversion | Meeting booked / form filled | `sign_up` |
| Measured in | GHL | Ad platform |
| Cycle | ~6 months | Days |
| Platform optimisation | Meaningless at this volume — buying reach against a named account list | Works |

### 5.4 Ownership — a rule owed before the first campaign

Today Certidemy owns credential name, email, funnel tags; GHL owns payment,
phone, marketing state. **Ad platform identifiers and click IDs sit on neither
side. Ruling: Certidemy holds them**, because certidemy.com receives the click
and is the only place they can be captured first-party. GHL receives them
additively like every other tag.

### 5.5 GHL is server-side and stays that way

`sync-to-ghl` is an edge function with a Vault token; the learner's browser never
touches GHL, which is why it sets no cookies. **The residual risk is a GHL
embed** — forms, calendars, chat widget load from `leadconnectorhq.com` and set
their own cookies. That arrives through marketing wanting a "book a demo"
button, not through an ads conversation. The `ghl_embed` adapter exists so that
request goes through the same gate as a pixel.

---

## 6. CORRECTIONS — four things this project believed that were wrong

Recorded because in every case a document or a terminal disagreed with the
database or the bytes, and the database and the bytes were right.

| Believed | Actual |
|---|---|
| Migration tip 170 (memory) | **173.** 171–172 scaffolded ISMS-F, 173 computed its exam blueprint |
| ISMS-F is `coming_soon` (v5.3 addendum) | **`available`.** All eight certs available. It was flipped 2026-08-06 03:08 |
| `PROGRAM_SLUGS` needs `ai-security` (v5.2 §8) | Already there. Sitemap already correct: 63 URLs, isms-f and ai-security in all three locales |
| `family/` route is dead code (v4.7) | It is the **308 redirect**. Deleting it breaks indexed URLs |

**I made the ISMS-F error after being told directly that ISMS-F was finished.**
I read the handoff, saw `coming_soon`, and treated the document as authoritative
over the person who had just done the work — then put "próximamente" into two
sales decks. One query would have settled it.

> **The rule that generalises:** a handoff is a record of what was true when it
> was written. The database and the file bytes are what is true now. When they
> disagree, the doc loses — and when a person who just did the work disagrees
> with the doc, the doc loses faster.

---

## 7. TOOLING LESSONS — mostly about my own guards failing

Four separate false greens this session. Every one was a verification bug, not a
file bug.

**PowerShell comma binds tighter than `-and` / `-eq` / `-ne`.**
`@('label', $a -and $b)` parses as `@(('label', $a) -and $b)` and collapses to a
single boolean. This silently broke a check array — **and it means the BOM check
used repeatedly this session was never working**: `@('no BOM', $x -ne '239,187,191')`
becomes array filtering, not comparison, and would have reported PASS with a BOM
present. Parenthesise every expression inside a check tuple.

**`throw` at the interactive prompt does not stop the rest of a pasted block.**
A duplicate-file guard fired, threw, and the copy loop ran anyway. Wrap
multi-step blocks in `& { }` so a throw aborts the whole thing.

**A marker must discriminate the new revision from the old, not merely be
present.** `THE CHOKE POINT` existed in both revisions of `tag-loader.tsx`, so a
stale file reported `landed=True`. Where no positive string is unique, verify on
the **absence** of something the old version had.

**A hash literal with a duplicate key is a parse error, and `foreach` over the
resulting `$null` iterates zero times.** Assert `$map.Count` before trusting any
loop that walks it.

**`str.replace` in a patch script does not error when the anchor is absent.**
A button-wiring edit silently no-opped and only ESLint's unused-variable warning
caught it. Every in-place edit needs an assertion that the anchor matched.

**Terminal rendering is not evidence about bytes — twice.** A mangled section sign in `content.ts`
and a mangled em-dash in `[locale]/layout.tsx` were both correct UTF-8 mangled by the console
codepage. Byte checks cleared both. `Select-String` decodes UTF-8; `Get-Content`
uses the ANSI codepage. **There is no mojibake in this repo.**

**Two environment facts worth keeping:**

- **`@theme` flattens its `var()` references to literal LIGHT values.** A Tailwind
  semantic utility like `bg-accent` would paint light-mode magenta on the dark
  marketing surface and never follow `data-theme`. Use `bg-[var(--color-accent)]`.
- **Tailwind v4 scans source TEXT, not parsed code.** A class-shaped string
  inside a comment is emitted as a real CSS rule — one containing a wildcard
  produced `Unexpected token Delim('*')` on every build. Keep class names out of
  comments.

---

## 8. OPEN LOOPS

### Blocking a campaign

1. **CertiGlobal order webhook** — §0, §5.1.
2. **`/console/integrations` panel.** Extend the existing card list: ID field,
   enabled toggle, event checkboxes, Vault token for server-side, test button.
   Reuses `integration-card.tsx` and the migration-144 pattern. Until it exists,
   enabling Bing for Spain is a SQL statement.
3. **`connect-marketing-integration` edge function** (admin-gated, mirrors
   `connect-integration`).
4. **`send-conversion` edge function** — blocked on 1.

### Owed, not blocking

5. **Notice-mode verification** — §3.3.
6. **`/privacy/partners`** rendering from `marketing_integrations` where
   `enabled = true`. A hand-maintained vendor list in a policy goes stale the
   first time someone toggles a row, and a stale disclosure is a false one.
7. **`FamilyContent` for `ai-security`.** `FAMILY_SLUGS` is `["scrum"]`, so
   *Compare the program* offers a comparison for one programme of four. Click it
   from `ai-security` and there is nothing there — and security postgrads are
   exactly who the Cali push targets. Real content work, not a string swap.
8. **Formulation drift** (carried from v5.3 §6.6). AIGRM-I descriptions say
   `built to` / `construida` / `referencial` where `CLAIMS-POLICY` §4 specifies
   `Designed to` / `Diseñada conforme al marco`. **Rule this before ad copy is
   written** — ad copy is where the phrase lands mid-sentence most often.
9. **Spanish legal documents.** English-only with a fallback notice; Terms §5 and
   §12 are unreviewed drafts. A Colombian university's oficina jurídica will ask
   before signing a convenio. `gen-legal-translations.mjs` exists, unused.
10. **Brazil in the opt-in list** — §2.3. Counsel question.
11. Carried from v5.3: `ksa_is_provisional` has no approval path and
    `verify-cert` does not check it; seven `SCHEME-*.md` still carry bare
    `17024`; clause 6.5 policy.

---

## 9. COMMITS

### `supabase`

| commit | what |
|---|---|
| `b2b8178` | migration 174 + `MARKETING-STACK.md` |

### `certidemy-web`

| commit | what |
|---|---|
| `356cce1` | gated tag loader, trilingual consent banner, Consent Mode v2 defaults, attribution capture |
| `044cfbf` | geo consent regimes, footer cookie settings, GPC precedence |
| `b6f3d1d` | Privacy §6 rewrite; no consent cookie when no vendor enabled |
| ``6180c1c`` | family → program in customer-facing strings, 3 locales |

Patch scripts committed to `certidemy-web/scripts/`:
`patch-locale-layout-consent.mjs`, `patch-footer-cookie-settings.mjs`,
`patch-privacy-cookies.mjs`, `patch-family-to-program-wording.mjs`.

---

## 10. NON-REPO ARTIFACTS

Two internal sales documents were generated this session and live outside the
repo. Both are **internal tier** per `SALES-LIBRARY-SPEC.md` §5 — band on every
page, diagonal watermark, provenance footer.

- **`Certidemy-Cali-Mapa-Instituciones-INTERNO-2026-08-06.pdf`** — 20 higher-ed
  institutions plus 3 non-university channels in Cali, tiered by legwork
  required, with a per-institution field form. Institution programmes verified
  against official sites on 2026-08-04; third-party facts age out at six months.
- **`Certidemy-Prospeccion-Universitaria-Colombia-INTERNO-2026-08-06.pdf`** —
  national version, all eight credentials.

Both were **corrected mid-session** once ISMS-F's real status was established:
they had described it as *próximamente*. They now say *disponible* with no
date-hedging, and the roadmap box owns both wrong versions rather than deleting
them.

Three things they encode that are worth keeping:

- **UAO is the strongest single target in Cali** — Especialización en
  Ciberseguridad *and* Especialización en Seguridad Informática, plus
  Especialización en Inteligencia Artificial. With ISMS-F the pitch is a 27001
  foundation against a 27001 programme, not an approximation.
- **USB Cali already runs a certification channel** with Huawei, AWS, Fortinet
  and Azure. The convenio paperwork exists there; it does not need inventing.
- **The accreditation-asymmetry argument.** Competitors hold 17024 accreditation
  on Lead Auditor and Lead Implementer, **not at Foundation tier**. True,
  precise, and says nothing about our own accreditation.

---

## 11. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v5.4.md` first — §0 has the two blockers
> and §6 has four corrections to things the docs got wrong.
>
> Migration tip 174, next free 175.
>
> **Before anything else:** confirm whether CertiGlobal's checkout exposes an
> order-completion webhook. Everything in §5 is blocked on it, and without it a
> campaign optimises on landing-page views.
>
> **Then §8 item 2** — the `/console/integrations` panel, so enabling a vendor
> stops being a SQL statement. Extend the existing card list; the migration-144
> Vault pattern already fits.
>
> **Do not treat §8 item 7 as small.** A `FamilyContent` entry for `ai-security`
> is content work, and *Compare the program* currently goes nowhere for three of
> four programmes — including the one the Cali push is aimed at.
>
> **The habit:** query before asserting. Every correction in §6 came from
> reading the actual row, the actual file, or the actual bytes — and every one
> of them contradicted a document that sounded authoritative.
>
> **The rule that generalises:** a verification that cannot distinguish pass
> from fail is worse than no verification, because it produces confidence. Four
> false greens this session, all from guards that were present but could not
> discriminate — a marker that existed in both revisions, a check array that
> collapsed to a boolean, a `throw` that did not stop the block, a `replace`
> that no-opped in silence.
