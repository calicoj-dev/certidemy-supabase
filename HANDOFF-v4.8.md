# HANDOFF v4.8 — Per-page SEO, structured data, and the site in Google's index

Supersedes v4.7 and its addendum. Migration tip **168**, next free **169** (no DB
work this stretch).

Checkpoint, written mid-session. v4.6 §2–4 (how LinkedIn sharing works) and
v4.5 §0 (the `profiles` privilege escalation, checks still owed) are not
repeated and both still stand.

---

## 0. THE SITE IS IN GOOGLE'S INDEX QUEUE

**Search Console verified as a Domain property; `sitemap.xml` submitted; status
Success, 57 pages discovered, read same day.** Bing Webmaster Tools still owed.

This was the gate on everything built across three sessions. Nothing before this
did anything — the site was structurally uncrawlable and absent from results.
Expect 3–7 days to first crawl; Coverage shows "Discovered" before "Indexed".

---

## 1. WHAT SHIPPED

**Per-page titles and descriptions**, 9 page types × 3 locales, in
`messages/*.json` under `meta.pages.*`. `scripts/patch-meta-pages.mjs` — it
re-checks lengths on every run (title ≤60, description ≤160) and refuses to
write anything over. Four titles were tightened because Spanish and Portuguese
run ~10% longer than English for the same meaning.

**`lib/seo/metadata.ts` adopted** on home, certifications, how-it-works,
business, about, and the verify landing. Each emits its own title, description,
`canonical`, and per-path hreflang for all three locales plus `x-default`.

**The certification detail page** — 7 certs × 3 locales = 21 pages — gets
`"<Name> (<CODE>) | Certidemy"` from the DB, plus a trimmed description. The
code is in the title deliberately: badge codes are public artifacts now and are
what someone pastes after seeing one on a LinkedIn profile.

**JSON-LD.** `components/seo/json-ld.tsx`:
- `EducationalOrganization` on the homepage
- `EducationalOccupationalCredential` on every certification page, with
  **`competencyRequired` carrying the full JTA** — one `DefinedTerm` per task,
  `termCode` like `AIE-I 2.5`. Validated: 0 errors, 0 warnings, 18 competencies
  on AIE-I.

**Site-wide meta description rewritten.** Was internal vocabulary
("dual-renderer lessons", "exam-honest content") that means nothing to a buyer.
Now: *"Internationally recognized professional certifications for the age of AI.
Any employer can verify a credential. Free to learn; you pay only for the exam."*
This key also feeds `EducationalOrganization.description`, so one edit covers
both.

**`/pricing` removed from the sitemap.** It is an English-only beta placeholder
("Free while in beta") with no translations — indexing it would put an
untranslated stub saying the product is unfinished in front of prospects. The
`meta.pages.pricing` strings stay for when it becomes real.

---

## 2. CORRECTION: `certifications/family/` IS NOT DEAD CODE

**v4.7 §8 says to delete it. Do not.**

`app/[locale]/(marketing)/certifications/family/[slug]/page.tsx` is a 12-line
**308 permanent redirect** to `program/[slug]`, kept so links shared before the
rename still resolve. Whoever wrote it did the right thing.

It is also not duplicate content — a 308 consolidates signal on its own, and
canonical was never the mechanism for that. The comment in `lib/seo/metadata.ts`
saying otherwise has been corrected.

`family-content.ts` and `FAMILY_SLUGS` remain live: the homepage, the catalog
and `program/[slug]` all import them. The **content module** is used; only the
**route** is a redirect.

---

## 3. CLAIMS — WHAT WAS DECIDED AND WHY

**"Internationally recognized" is in the meta description. This was Juan's
call, made deliberately over a recommendation against it.**

The argument against, recorded so it is not re-litigated from scratch: one
client accepting credentials is a client, not international recognition, and a
buyer who asks "recognized by whom?" gets an answer that reads worse than never
claiming it — on a site whose voice is *"No fingimos el dominio"*. Juan's
position: it is real enough, it is good marketing, and unlike "ISO 17024
certified" nobody is coming after it. **The distinction he drew is correct** —
recognition is acceptance by a relying party, accreditation is a formal status
with a body behind it. The claim is the former.

**The sentence is backed immediately by the mechanism:** *"Any employer can
verify a credential."* That is verifiably true today, needs no account, and is
what "internationally recognized" is gesturing at. A claim followed by its proof
survives a skeptic; a bare claim does not.

**"ISO/IEC 17024 framework" is NOT in any marketing copy** and remains unclear
for it. v4.5 flagged it as owing a `CLAIMS-POLICY.md` check and that check has
still not happened. *Built to the framework* and *accredited to the standard*
are different claims, and structured data is read literally by machines that
cannot hear the difference.

**`recognizedBy` is deliberately absent from the JSON-LD.** It means an
organization that recognizes the credential and can imply quality assurance on
their part. Add it when a named organization actually does, not before.

**"Pay to certify" was replaced with "you pay only for the exam."** Juan's
catch, and a good one: the first reads as buying the outcome, which is precisely
the impression a certification body cannot afford.

---

## 4. RULES LEARNED

**`{/* */}` is only valid in JSX CHILDREN position.** Inside an opening tag,
between attributes, it is a syntax error — and one that surfaces as
`Unexpected token 'div'. Expected jsx identifier` pointing at a line several
above the actual problem. Use `//` inside a tag.

**`noUncheckedIndexedAccess` types regex capture groups as possibly
undefined**, even when the group always matches on a non-null `exec`. Guard with
a `const` and an `if`; do not assert with `!`. An assertion compiles but claims
something the compiler cannot check — which is the same species as every other
silent failure in this codebase.

**Abbreviations break naive sentence-boundary detection.** The description
trimmer initially cut the Spanish AIHR-I text at `"socio de negocio de RR. HH."`
— treating an abbreviation as a full stop, producing a description that appears
to stop mid-thought. The shipped version requires the token before the stop to
be 3+ characters and falls through to a word boundary otherwise. **Test string
handling against the real strings, not invented ones.**

**Romance-language copy runs ~10% longer than English** for the same meaning.
Any character-limited string needs all three checked, not just the English.

---

## 5. OWED — SEO

1. **Bing Webmaster Tools.** Imports from Search Console in ~90 seconds. Bing's
   index feeds ChatGPT search, which matters given the AI-discovery goal.
2. **`llms.txt`.** Worth adding *now that the site is indexed* — it is a summary
   layer, not a substitute for crawlable structure. Google confirms it has no
   effect on Search rankings; the value is at the real-time retrieval layer
   (Perplexity, ChatGPT search). PageSpeed flags its absence because Lighthouse
   13.3.0 promoted the Agentic Browsing audit into the default config in May
   2026 — it is a separate category and does not affect the other scores.
   **Do not generate `.md` copies of every page**: if indexable they are
   duplicate content at scale.
3. **`?cert=<CODE>` mode on `credential-og`**, so each certification page shares
   its own badge instead of the generic locale card. The badge is 501×501 and
   the card is 1200×630, so it needs compositing — `credential-og` already has
   resvg and the base64 badge module.
4. **`id="blueprint"`** on the Exam Composition heading. `inDefinedTermSet`
   points at `#blueprint`, an anchor that does not exist. Harmless (it is an
   identifier, not a followed link) but adding it makes it resolve.
5. **`privacy` and `terms`** still have their own `generateMetadata` and have not
   adopted the helper — so no canonical, no hreflang. Legal pages; a careful
   manual edit, and the strings already exist in `meta.pages`.
6. **`/pricing` back into the sitemap** when it carries real, translated pricing.

---

## 6. OWED — CARRIED, UNCHANGED

- **The three `profiles` post-run checks from v4.5 §0.** The escalation-refused
  test must run FROM THE BROWSER as a non-admin; the SQL editor runs as service
  role and proves nothing.
- **User-editable display name** (v4.6 §5). `score-mock-exam` must read
  `profiles.full_name` BEFORE a settings page exists, or the feature stamps
  nothing.
- **Five certificate PDFs stale** after the v4.5 name migration — console
  Regenerate is the audited path.
- **Public lessons: still an open strategic question** (v4.7 §6). Not decided.
  Confirmed this session that `loadLesson` takes no user and `lessons` has
  `SELECT` granted to `anon` with a `qual: true` policy — **the data layer is
  already fully public; only a middleware regex gates it.** What is missing is a
  reading surface: a public route, a stripped renderer, and a per-widget
  decision about what a logged-out reader sees. Sequence still matters, but the
  metadata prerequisite is now done.
- **Header hex drifts within programme** — pure drop-in when design returns it.
- **`CredentialSeal` still draws a `ShieldCheck`** in the header chip.
- **`CERT-PUBLISH-CHECKLIST.md`** needs: badge PNG committed and
  `gen-badges-module.mjs` re-run.
- **Regenerate `lib/supabase/types.ts`** so `.from("credentials")` stops
  inferring `never`.
- Everything in v4.5 §10 and v4.6 §6.

---

## 7. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v4.8.md`, then v4.6 §2–4 and v4.5 §0 —
> neither is repeated and §0 has security checks still owed.
>
> Migration tip 168, next free 169.
>
> **Note §2:** v4.7 says to delete `certifications/family/`. That is wrong — it
> is a working 308 redirect and deleting it breaks every link shared before the
> rename.
>
> **§5 is the SEO remainder**, smallest first: Bing, `llms.txt`, the `?cert=`
> OG mode.
>
> **The habit:** query before estimating, read raw bytes to BUILD an edit, and
> after anything touching `app/` watch the CLOUDFLARE log — `npm run build`
> cannot see the edge-runtime rule.
>
> **The rule that generalises:** a check that succeeds is not a feature that
> works, and absent configuration is not neutral — someone else supplies the
> default. Verify at the artifact: view-source, the validator, the live URL in
> an incognito window.
