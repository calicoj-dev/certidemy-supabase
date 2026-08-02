# HANDOFF v4.9 — SEO complete, badge share cards, copy sweep

Supersedes v4.8 (a mid-session checkpoint). Migration tip **168**, next free
**169** — no DB work in this stretch.

v4.6 §2–4 (how LinkedIn sharing works) and v4.5 §0 (the `profiles` privilege
escalation, checks still owed) are not repeated and both still stand.

---

## 0. STATE

Both repos clean and pushed. **Google Search Console** verified as a Domain
property, sitemap Success, 57 pages discovered. **Bing Webmaster Tools**
submitted, Success, 0 errors, 54 URLs. **Cloudflare Crawler Hints enabled** —
IndexNow at the CDN layer, so Bing is pinged on content change rather than
waiting for a recrawl.

Bing reports 54 URLs to Google's 57. Both crawls succeeded and Bing's counting
is less transparent; worth a re-check once both have recrawled. If it persists
it is a real gap.

---

## 1. WHAT SHIPPED SINCE v4.8

**Certification pages share their own badge.** `credential-og` gained a
`?cert=<CODE>&name=<Name>` mode: badge centred at 300px, name auto-shrunk
beneath, code letterspaced, keyline, domain. Wired into the certification
page's `generateMetadata` as `image`. Verified in LinkedIn Post Inspector and
on WhatsApp.

**`/pricing` rewritten.** Was an English-only placeholder saying Certidemy was
"currently in active development" — stale (the library shipped, six more certs
followed) and hardcoded English, so Spanish and Portuguese visitors got the
wrong language. Now translated, and back in the sitemap.

**"Pay to certify" removed everywhere.** Nine strings across three languages:
homepage `freemiumLine`, `business.b6Title`, and the pricing meta title.
`scripts/patch-pay-for-exam.mjs`.

**`llms.txt`** at `app/llms.txt/route.ts`, certification list read from the DB.

**Legal pages adopted `buildMetadata`** — privacy and terms now emit canonical
and hreflang, keeping their own translated titles from the legal content module.

**`id="blueprint"`** on the Exam Composition section, so the JSON-LD's
`inDefinedTermSet` anchor resolves.

---

## 2. THE COPY PRINCIPLE — JUAN'S CALL, AND IT WAS RIGHT

**Do not frame the product by what it lacks.**

The llms.txt originally read *"Certidemy is designed to the ISO/IEC 17024
framework; it is not accredited to that standard and does not claim to be."*
Juan replaced it with *"...and is actively working toward accreditation."* Same
information, forward-facing. **Write it the second way.**

A sweep for the same pattern across all customer-facing copy found **no other
instances** — the only remaining matches are UI state labels (`Coming soon`,
`Not yet assessed`, `Temporarily unavailable`) which are accurate and
unavoidable, and the AISM-I description's ITIL disclaimer, which does legal
work rather than stylistic work and stays.

**"Pay to certify" was the other half of this.** It reads as buying the
outcome — the impression a certification body cannot afford. Now *"you pay only
for the exam"* / *"solo pagas el examen"* / *"você paga só o exame"*, consistent
across five surfaces.

**"Internationally recognized" is in the site-wide description.** Juan's call,
recorded in v4.8 §3 with both sides. Not re-litigated.

---

## 3. RULES LEARNED

**Angle brackets inside a JSX comment are parsed as a tag.** A comment reading
`<url>#blueprint` broke the build with `Unexpected token 'div'` pointing at a
line 40 above the actual problem. JSX comments are not inert to the parser.

**`{/* */}` is only valid in JSX CHILDREN position** (carried from v4.8, hit
again). Inside an opening tag, use `//`.

**A patch that writes LF into a CRLF file makes its own insert unmatchable by
the next CRLF-detecting patch.** Every `WriteAllText` in this project writes LF
regardless of what the file already uses, and `git add` may convert the rest to
CRLF. The result is a file with mixed endings where `$nl` detection picks the
majority and the anchor built from it misses the minority lines.
**Dump the bytes around the target before building an anchor in a file that has
already been patched.** A line-based filter (`-split "\`n" | Where-Object`)
sidesteps the problem entirely.

**A grep that comes back short is not proof of absence.** Searching for
`pay to certif` did not match `pay only to certify` — the adverb sits between
the words. Found by reading the file. Same species as the `0X-*.md` filter and
the "all six certs" script.

**`npm run build` and `git commit` in one paste will commit over a red build.**
PowerShell does not stop on failure. It happened twice. Run the build alone.

---

## 4. SEO — WHAT IS DONE

- `sitemap.ts` — 60 entries, per-locale hreflang + x-default, certs from the DB
- `robots.ts` — all three AI crawler families allowed explicitly
- Per-page titles and descriptions, 9 page types x 3 locales
- `canonical` + correct per-page hreflang on every public page
- `EducationalOrganization` (homepage) and `EducationalOccupationalCredential`
  (every cert page, full JTA as `competencyRequired`) — both validate 0/0
- `llms.txt`
- Search Console + Bing submitted; Crawler Hints on
- Per-certification badge share cards

**Nothing on the SEO list is outstanding.** Expect first crawl 3–7 days from
Aug 1; Coverage shows "Discovered" before "Indexed".

---

## 5. THE OPEN CONTRADICTION — READ THIS BEFORE WRITING MORE COPY

**Four surfaces now promise open lessons. The lessons are behind auth.**

- Homepage: *"Léelo todo. Está todo abierto."* / *"Every lesson, every practice
  question, and the full exam blueprint — open and free."*
- Business: *"Lessons, practice, and the AI tutor are open to everyone."*
- Pricing (new this session): *"Every lesson... open at no cost."*
- llms.txt: notes lessons require a free account — the only honest one.

**The data layer is already public.** `loadLesson(cert, lessonId, locale)` takes
no user, does no enrollment check, writes no progress. `lessons` has
`SELECT` granted to `anon` AND a `qual: true` policy — both halves, verified.
**Only the middleware regex `/^\/[^/]+\/learn(\/|$)/` gates it.**

What is missing is a reading surface: a public route outside the middleware
patterns, a stripped renderer (no tutor, no progress, no quiz buttons), a
per-widget decision about what a logged-out reader sees, and syllabus links from
the certification pages so the pages are discoverable.

**This is not a recommendation to open them.** It is a note that the copy and
the product have drifted apart, and the gap should close in one direction or the
other. Juan has not decided. See v4.7 §6 for the full argument on both sides,
including that the peer set (Scrum.org, PMI, CertiProf) all gate.

---

## 6. OWED — CARRIED

- **The three `profiles` post-run checks from v4.5 §0.** The escalation-refused
  test must run FROM THE BROWSER as a non-admin.
- **User-editable display name** (v4.6 §5). `score-mock-exam` must read
  `profiles.full_name` BEFORE a settings page exists.
- **Five certificate PDFs stale** after the v4.5 name migration — console
  Regenerate is the audited path.
- **`certifications/family/` is a working 308 redirect. Do not delete it**
  (v4.8 §2 corrects v4.7 §8).
- **Header hex drifts within programme** — drop-in when design returns it.
- **`CredentialSeal` still draws a `ShieldCheck`** in the header chip.
- **`CERT-PUBLISH-CHECKLIST.md`** needs: badge PNG committed and
  `gen-badges-module.mjs` re-run. **Now also needs: the certification page's OG
  card reads `/badges/<CODE>.png` through `_shared/badges.ts`, so a cert
  published without artwork shares a text-only card.**
- **Regenerate `lib/supabase/types.ts`** so `.from("credentials")` stops
  inferring `never`.
- Everything in v4.5 §10 and v4.6 §6.

**Note on tooling:** `supabase/scripts/` IS tracked. The `.gitignore` excludes
`patch-*.mjs` specifically — one-shot patches are disposable, pipeline tools are
not. `verify-cert.mjs`, `backfill-practice.mjs` and the rest are versioned.

---

## 7. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v4.9.md`, then v4.6 §2–4 and v4.5 §0 —
> neither is repeated and §0 has security checks still owed.
>
> Migration tip 168, next free 169.
>
> **SEO is complete** (§4). Nothing outstanding there. Check Search Console
> Coverage for first-crawl results.
>
> **§5 is the live question:** four marketing surfaces promise open lessons and
> the lessons are gated. The data layer is already public — only middleware
> gates it. Juan has not decided which way to resolve it. Do not assume.
>
> **The habit:** query before estimating, dump raw bytes before building an
> anchor in an already-patched file, run the build alone before committing, and
> verify at the artifact — view-source, the validator, an incognito window.
>
> **The rule that generalises:** a check that succeeds is not a feature that
> works, and absent configuration is not neutral — someone else supplies the
> default.
