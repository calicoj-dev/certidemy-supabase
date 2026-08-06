# MARKETING-STACK.md

How advertising and analytics tags reach certidemy.com, and the rules that
govern them. Written alongside migration **174**.

**Rev 2 — 2026-08-06.** Renumbered from 171 (171-173 went to the ISMS-F
scaffold and exam blueprint) and updated for the 17024 edition pin.

Companion to `CLAIMS-POLICY.md` (what we may assert) and
`SALES-LIBRARY-SPEC.md` §5 (internal vs client tiers). This document covers what
we may *load*.

---

## 1. The governing rule

> **Vendors live in code. Identifiers live in the database.**

Superadmin pastes `1234567890123456`. Nobody ever pastes a `<script>` block into
a form.

This is not caution about the marketing team. It is about what the artifact *is*.
A snippet field is arbitrary JavaScript executing on every visitor, authorable
through a web form, on a platform that runs secure examinations and publishes
credential verification. Same person, same tab, same trust level — a different
artifact, with different failure modes.

**Google Tag Manager is excluded for the same reason.** GTM's value is real —
it decouples marketing from engineering — but it delivers that by granting
container access the ability to inject any script into certidemy.com, outside
this repo, outside code review, outside the Cloudflare build. For a certification
body, no.

Four consequences, each of which the snippet approach forfeits:

1. **A blob cannot be consent-gated.** Holding a tag until the banner resolves
   requires something to own the loading call.
2. **A blob cannot be surface-restricted.** Keeping tags off `/quiz/play` and
   `/verify/[id]` requires the app to decide per route.
3. **A raw pixel only fires `PageView`.** The value is in `sign_up` and
   `purchase`. Meta's boilerplate does not know what a voucher is.
4. **Server-side conversions are impossible from it.** A Conversions API call
   comes from an edge function with a token, not from anything a browser ran.

The ID-only version is not the restricted version. It is the one that works.

---

## 2. Adding a vendor

An adapter is roughly twenty lines: `id`, `category`, `scriptHosts`, `load(id)`,
`track(event, params)`. Ten ship in `lib/marketing/vendors.ts` — Meta, Google
Ads, GA4, LinkedIn, Reddit, Bing UET, TikTok, Pinterest, X, and GHL embeds — so a
campaign launch is never blocked on a deploy.

- **Enabling a vendor the code knows:** a row and a toggle. No deploy.
- **Adding a vendor the code has never heard of:** one file, one migration.

Bing is already staged for when Spain heats up.

### The escape hatch

If marketing needs a vendor that genuinely is not in the registry and cannot
wait, the generic path accepts a script URL **from an allowlisted host only**
(`connect.facebook.net`, `snap.licdn.com`, `bat.bing.com`,
`www.redditstatic.com`, and the rest of `ALL_SCRIPT_HOSTS`). It fires page views
and nothing more — enough to keep a campaign live for the week it takes to write
the proper adapter. Openness without arbitrary execution.

---

## 3. Surfaces — code, never configuration

`lib/marketing/surfaces.ts`. No console setting can override these.

| Blocked | Why |
|---|---|
| `/verify/[id]` | Public page showing a named credential holder. A tag there tells the ad network who is looking up whom. These pages are indexable *on purpose*, which makes tagging them worse, not better. |
| `/quiz`, exam routes | A third-party script inside a secure examination is an integrity problem before it is a privacy one. |
| `/learn` | Authenticated study. Lesson behaviour is study data processed under contract, not advertising data. |
| `/console` | Staff surfaces. |
| `/reset-password`, `/update-password` | URL carries a token. |

Everything else is taggable: marketing, catalogue, certification and programme
pages, and the signup path (a signup is a conversion and has to be attributable).

---

## 4. Events — and the one that does not exist

`page_view · sign_up · enroll · lesson_start · checkout_start · purchase · lead`

**`credential_issued` is deliberately absent from the enum and must stay absent.**

Firing a conversion when a credential mints tells an advertising network that a
named individual passed a certification examination. A certification body does
not disclose that to anyone. The commercial event is `purchase`, which happens
earlier and is the better optimisation target regardless.

This is enforced by omission rather than by a comment: the event is not in the
type, so the call does not compile.

---

## 5. Consent

Two categories — `necessary` and `marketing`. Not the five-category IAB
arrangement: Certidemy has no analytics product separate from advertising, so a
second toggle buys nothing but a larger surface to get wrong.

- Stored in a **cookie**, `certidemy_consent`, not localStorage — middleware and
  server components need to read it.
- Versioned. Bumping `CONSENT_VERSION` re-prompts rather than grandfathering a
  stale choice. Expires at 365 days.
- **Google Consent Mode v2 defaults are inline in `<head>`, ungated, denied.**
  This is the one piece of marketing JavaScript that must not be gated: if the
  defaults arrive after the Google tag, they do nothing.
- **GPC is honoured before any banner renders.** NJDPA does not bite on
  thresholds today (100,000 consumers, or 25,000 plus revenue from data sales)
  and neither does CPRA — but the detection duty is the business's, it is three
  lines, and it is the correct posture for a body selling verifiability.
- **Reject has equal visual weight to Accept.** Same size, same shape, same row.
  No pre-ticked boxes. Continuing to browse is not consent.

### What consent does NOT cover

Study progress, quiz history, exam records and credentials are **contract**
(GDPR Art. 6(1)(b)), not consent. Tracking a learner's progress *is* the service
they asked for.

Making that consent-based would be actively harmful: consent is withdrawable, and
a candidate who fails and withdraws it would oblige us to stop processing the
records ISO/IEC 17024 requires us to retain — records backing a credential
already issued to a relying third party. A certification body cannot have its
evidentiary chain revocable by the person it is evidence about.

Same reasoning for exam telemetry when it ships: contract plus legitimate
interest in examination integrity, **disclosed prominently**. Disclosure is the
control with actual deterrent value anyway.

---

## 6. Privacy §6 — REPLACEMENT TEXT

**The current clause becomes false the moment the first tag lands.** It asserts
as a matter of fact that a codebase sweep found no analytics or advertising
cookies. That was true on 2026-07-29 and is a claim about the code, not a
policy position — so it must be replaced **in the same commit** as the first
enabled vendor, not afterwards.

> **6. Cookies and similar technologies**
>
> We use a small number of cookies that are strictly necessary to provide the
> service you requested. These keep you signed in, remember your language and
> theme, and protect the site from automated abuse. They cannot be switched off
> and we do not ask permission for them, because without them the service does
> not work.
>
> Where we run advertising campaigns, we may also allow advertising partners to
> place cookies that let them measure which campaign brought you to us. These are
> **off by default**. They load only if you accept them, and only on our public
> marketing pages. You can change your choice at any time from the link in the
> footer, and we honour Global Privacy Control signals sent by your browser.
>
> **These partners are never present on pages where you study, take an
> examination, or verify a credential.** A credential verification page shows a
> named individual, and we do not disclose to an advertising network who is
> looking up whom.
>
> Your study progress, examination records and issued credentials are not
> advertising data and are never shared with these partners. We process them to
> deliver the service and to maintain the integrity of the credentials we issue.
> That processing is not affected by your cookie choice.
>
> The advertising partners currently enabled are listed at
> certidemy.com/privacy/partners, which is generated from our live configuration
> rather than maintained by hand.

The partners list should render from `marketing_integrations` where
`enabled = true`. A hand-maintained vendor list in a policy document goes stale
the first time someone toggles a row, and a stale disclosure is a false one.

---

## 7. Wiring

1. Run **migration 174** in the SQL editor, one statement at a time. Run the
   verification block at the bottom — including the browser-side check as a
   non-admin. *RLS passing is not a grant, and the SQL editor runs as service
   role and proves nothing.*
2. `lib/marketing/*` and `components/marketing/*` into `certidemy-web`.
3. `CONSENT_MODE_DEFAULTS` inline in `app/[locale]/layout.tsx` `<head>`, before
   anything else.
4. `<TagLoader integrations={...} locale={locale} />` in the **marketing route
   group layout only** — `app/[locale]/(marketing)/layout.tsx`. Not the root
   layout. Surfaces are gated in code as well, but not mounting it on the learn
   and console trees is the cheaper first line.
5. Loader reads `marketing_integrations` where `enabled = true`, safe columns
   only. `export const runtime = "edge"` on anything new under `app/`.
6. Add `ALL_SCRIPT_HOSTS` to the CSP `script-src` if a CSP is in force.
7. Privacy §6 replacement, all three languages, same commit as the first vendor.

**Build and commit separately.** A single paste of `npm run build && git commit`
commits over a red build. And `npm run build` cannot see a missing edge export —
only the Cloudflare log catches that.

---

## 8. Attribution — the actual gap

The funnel crosses a domain boundary:

```
ad → certidemy.com → free course → VOUCHER PURCHASE ON CERTIGLOBAL → exam
```

Every generated asset deliberately carries no price because pricing is
CertiGlobal's. So the money event fires on certiglobal.org and certidemy.com
never sees it. **Point a Meta campaign at this today and the platform sees a
landing page view and nothing else — it will optimise for traffic.**

`lib/marketing/track.ts` captures click identifiers on landing (first-touch
wins) and `decorateCertiGlobalLink()` replays `cd_sid` plus UTMs on the handoff.
CertiGlobal must echo `cd_sid` back on order completion.

**Blocked on one answer: does CertiGlobal's checkout expose a webhook or an
order-completion endpoint we can read?** If yes, server-side conversions are
straightforward. If no, that integration is the first ticket and everything else
here is decoration.

### Three rules for when it lands

1. **Send purchases server-side**, from an edge function on order confirmation —
   Meta CAPI, Google Enhanced Conversions, LinkedIn CAPI. Survives ad blockers
   and iOS.
2. **Server-side does not escape consent.** Common misread. Sending a hashed
   email to a conversion API is still disclosing personal data to a third party
   for advertising. Same legal basis required, which is why consent state is
   recorded alongside the event.
3. **Do not optimise on purchase.** Meta and Google need roughly fifty
   conversions a week to leave the learning phase, and you will not have that at
   launch. **Optimise on `sign_up`**, feed `purchase` back as a value-based
   conversion for ROAS reporting only. Signup is a high-volume honest proxy
   *because the course is free* — the free course is not a leak in the funnel, it
   is the top of it, and it is the structural advantage over every competitor
   charging for courseware.

---

## 9. Two funnels, one configuration is wrong

| | B2B (Cali, universities) | B2C (learners) |
|---|---|---|
| Platforms | LinkedIn only | Meta, Google, Reddit, Bing later |
| Conversion | Meeting booked / form filled | `sign_up` |
| Where measured | GHL | Ad platform |
| Cycle | ~6 months | Days |
| Platform optimisation | Meaningless at this volume — you are buying reach against a named account list, not ROAS | Works |

Running both through one conversion definition produces numbers that describe
neither.

---

## 10. Ownership — a rule owed before the first campaign

Today: **Certidemy owns** credential name, email, funnel tags. **GHL owns**
payment, phone, marketing state.

Ad platform identifiers and click IDs are new territory sitting cleanly on
neither side. **My call: Certidemy holds them**, because certidemy.com is the
domain that receives the click and the only place they can be captured first-
party. GHL receives them as fields on the contact, additively, like every other
tag we push.

Write it into the ownership model before the first campaign, not after the first
disagreement.

---

## 11. Standing rules

- No third-party `<script>` enters this repo outside `lib/marketing/vendors.ts`.
- No snippet field in any admin form, ever.
- No GTM.
- Privacy §6 asserts a fact about the codebase. **Re-sweep whenever a vendor is
  added**, and treat the clause as part of the change.
- A vendor failing to load must never take the page down. Every adapter call is
  wrapped; a warning is the worst outcome.
- `credential_issued` is not an event. If someone asks for it, the answer is
  `purchase`.

---

## 12. What changed since rev 1 (2026-08-06)

Three things moved while this sat, all of which touch the work below.

**Migration numbering.** Tip is **173**, next free **174**. Migrations 171 and 172
scaffolded ISMS-F; 173 computed its exam blueprint from `v_cognitive_profile`.
The file here is renumbered accordingly. *Query the tip before writing SQL — this
document is not the authority, the database is.*

**ISMS-F shipped as cert #8**, founding the `ai-security` family. Status
`coming_soon`, `verify-cert --strict` at 29 pass / 0 fail. Two consequences here:

- **`PROGRAM_SLUGS` in the sitemap needs `ai-security` added.** v5.2 §8 item 7
  said to add it *when* status flips to `coming_soon`, not before. It has flipped.
  Until that lands, the family page exists and nothing submits it — which is a
  live SEO gap now rather than a queued one, and it sits directly upstream of any
  paid campaign pointing at security programmes.
- **`/certifications/family/[slug]` has no sitemap entries at all**, catalog-wide.
  Same fix, larger blast radius.

**The 17024 edition is pinned to `:2026`** across every claim surface — 35 file
occurrences and 8 database rows. The approved formulation now carries the year:
*Designed to the ISO/IEC 17024:2026 framework for bodies certifying persons.*

Teaching content was deliberately **not** pinned, because lessons explaining what
17024 *is* are edition-independent and pinning them dates them for nothing. That
distinction matters for anything generated from lesson content.

**One open item bears directly on advertising copy:** clause 6.5 of the 2026
edition governs AI use in certification processes, and `SCHEME-ISMS-F.md` §11
names it as open and **claims no conformity**. Ad copy must not imply otherwise,
and a landing page for a security programme is exactly where someone would be
tempted to.

**Formulation drift is still unruled.** AIGRM-I's descriptions say
`built to` / `construida` / `referencial` where `CLAIMS-POLICY` §4 specifies
`Designed to` / `Diseñada conforme al marco` / `Projetada conforme a estrutura`.
The question — does "exact formulation only" govern a phrase mid-paragraph or
only the standalone claim? — needs answering **before** ad copy is written, not
after, because ad copy is where the phrase will appear mid-sentence most often.

---

## 13. Still owed

- Superadmin panel: extend `/console/integrations` with a card per vendor —
  ID field, enabled toggle, event checkboxes, Vault token for server-side, test
  button. Reuses `integration-card.tsx` and the migration-144 pattern.
- `connect-marketing-integration` edge function (admin-gated, mirrors
  `connect-integration`).
- `send-conversion` edge function — blocked on §8.
- `/privacy/partners` route rendering from live configuration.
- Footer "Cookie settings" link that re-opens the banner.
- Privacy §6 translations into es-419 and pt-BR. **Through an API loader, never
  the SQL editor** — accented strings pasted into the editor are this project's
  documented source of double-encoded UTF-8.
