# HANDOFF v4.6 — The share chain, end to end

Supersedes v4.5, which was written as a closing document and then had another
half-session shipped on top of it. Migration tip **168**, next free **169**.

v4.5 §0 (the `profiles` privilege escalation) and §6 (rules) still stand and are
not repeated here. v4.3 has the review protocol; v4.0 has the examination chain.

---

## 1. WHAT SHIPPED SINCE v4.5

**The badge renders on the verify page.** Centred above the holder name, 176px.
State-branched: valid and specimen get the full badge, expired greyscales at 40%,
**revoked gets none** — revoked means the certification decision was withdrawn,
and a badge there implies standing the holder does not have. The specimen check
was made on screen: the amber verdict card carries enough weight that the badge
reads as illustration, so no greyscale needed there.

**`lib/credentials/share-copy.ts`** — the single source for public-facing
credential copy: `shareTitle`, `shareDescription`, `shareCaption`, `shareLabels`,
`toShareLang`. Pure string building, no I/O, usable from server or client. Both
surfaces import it so a post reads identically wherever it is launched from.

**`lib/credentials/claim.ts`** — `loadCertClaim(supabase, certificationId,
locale)`. Locale first, English fallback, null last. Deliberately NOT folded into
`loadEarnedCredential`, which the exam page also calls and which has no use for a
claim.

**`components/verify/share-credential-button.tsx`** — the share-to-post button,
used by both the verify page and the dashboard.

**og:title and og:description are localized and Credly-shaped.** Was
`"Jairo Casallas — AI Essentials I"`, a page title. Now
`"Certidemy emitió AI Essentials I (AIE-I™) a Jairo Casallas."` — a complete
sentence naming certification, issuer and holder, in the reader's language. This
is the construction Credly uses, and it is what carries the whole story when
LinkedIn renders the COMPACT card instead of the large one, which is not under
our control.

**The dashboard medallion is the real badge.** `CommandDeck`'s `Medallion` drew
a generic `ShieldCheck` in a glowing disc. Now the badge PNG at 160px with the
glow moved to a drop-shadow — a disc around a shield fights the silhouette. The
mono code line under it was removed as redundant with the badge face. Both
reversible in one line.

**The share button is on the dashboard**, under the badge in `CommandDeck`'s
left panel. No ownership check needed: `/learn/[cert]/dashboard` is the learner's
own by construction and `loadEarnedCredential` is RLS-scoped to `auth.uid()`.

**Add-to-Profile is verify-page only.** It needs `issueYear`/`expirationYear` and
`EarnedCredential` carries no dates. Also the better split on merit:
Add-to-Profile is a one-time action belonging on the credential page (one click
away via *Ver tu credencial*), the share post is the repeatable one.

---

## 2. HOW LINKEDIN SHARING ACTUALLY WORKS — verified, not assumed

**LinkedIn will not pre-fill a caption. There is no mechanism.** The old
`shareArticle` endpoint that accepted `title` and `summary` is deprecated; the
current `sharing/share-offsite/?url=` endpoint ignores every parameter except
`url`, and the composer draws its card entirely from the target page's Open Graph
tags.

This is why Credly posts carry a pasted "Proud to earn…" paragraph. Credly gives
the learner text. The learner pastes it. That is the ceiling for everyone.

So the button does two things: **copy the caption, then open the composer.**

### The bug that cost a round trip, and the lesson

v1 branched on `typeof navigator.share === "function"` and treated that as "this
is a phone."

**Chrome on Windows implements `navigator.share`.** So a desktop click opened the
*Windows* share sheet, returned early, and never touched the clipboard. The sheet
handed LinkedIn the URL alone and the composer opened empty — the exact failure
the component existed to prevent, with no error anywhere.

> **Feature detection answered the wrong question.** `navigator.share` exists
> tells you *can I call this*. The question was *will the OS hand my text to the
> app*, and those diverge on desktop Chrome. Same species as every silent
> fallback in this codebase: the check succeeded, nothing threw, the feature just
> quietly did not do its job.

Three corrections, all in the current file:

1. **Always copy first, on every path.** The clipboard is the only delivery
   mechanism under our control, so it is no longer conditional on a branch.
2. **`navigator.share` gated on a mobile user agent**, not on API presence.
3. **The URL goes inside `text`**, not the separate `url` field. Share targets
   commonly forward one and drop the other; combining them means the caption
   survives either way.

`AbortError` returns silently — a dismissed sheet is a decision, not an error,
and the copy has already happened.

---

## 3. COPY RULES — read before editing any share string

**™ on the CODE, never on the name.** `SM-AI-I™` is correct. `Scrum Master I —
AI™` would assert a trademark on "Scrum Master", squarely across the third-party
naming red line in `TERMINOLOGY-POLICY.md`. Marking the code sidesteps it because
the code is unambiguously ours. Enforced in `share-copy.ts::marked()`.

**Once per post, at first prominent use** — not every instance. Standard practice
and what `LAUNCH-READINESS.md` specifies. Each post is its own document, so first
use per post carries it.

**"Certification", never "certificate."** Certidemy issues certifications; the
certificate is the PDF. The og:title is the most-read sentence the platform
publishes.

**Spanish and Portuguese captions are genderless.** No *Orgulloso/Orgullosa* or
*Orgulhoso/Orgulhosa* — holder gender is unknown and guessing it on someone's own
post would be a bad look. *"Acabo de obtener…"* and *"Acabei de conquistar…"*
read better regardless.

**The claim drops in verbatim.** `certification_i18n.claim` is already written,
reviewed and translated. It is third-person ("the holder", "la persona") and
stays that way — it is a statement about the certification, not the poster, which
is why it reads correctly after a first-person opening.

Shipping example, es-419:

> Acabo de obtener Scrum Developer I — AI (SD-AI-I™) con Certidemy. Valida el
> oficio de hacer que Scrum funcione en equipos aumentados con IA.

---

## 4. RULES LEARNED

**`--dry` and the live run look identical in the terminal except for the last
line.** Bit twice in one session. Everything above scrolls past the same way, the
build goes green either way because nothing changed, and the commit succeeds
because something is always staged. **Verify by grepping the target for a token
the patch introduces**, never by reading the scrollback:

```powershell
Select-String -LiteralPath <target> -Pattern "<token the patch adds>" | ForEach-Object { $_.LineNumber }
```

**A patch can land the type and miss the destructure.** `claim?: string | null`
went into `CommandDeck`'s type; `claim` never went into the parameter
destructuring. Both anchors sat in the same declaration and only one was written.
**The fixture passed because the fixture had the same gap** — a fixture only
tests what you thought to put in it.

**`Get-Content | Select-String` silently drops blank lines** (carried from v4.5,
reconfirmed). Every anchor in this session's patches was built from a raw
`[System.IO.File]::ReadAllText` dump with `<CR>`/`<LF>` made visible, and every
one matched first try. The two that failed were the two built from piped output.

**Bundle size is a better landing signal than a green build.** The dashboard
route went 20.2 → 21.1 kB when the share button actually reached the bundle. A
build passes whether or not your change did anything.

---

## 5. OPEN — LAUNCH BLOCKERS

**Post Inspector re-scrape.** og:title changed and LinkedIn holds previews ~7
days with no purge you control. Run it on a real credential before any volume.

**Five certificate PDFs stale** after the v4.5 name migration. The console
Regenerate button is the audited path — nulling `certificate_path` does not work,
because v3.7 changed the cache probe to sign the *computed* path.

**`metadataBase` was declaring `pages.dev`** as canonical for all three locales
until v4.5. Fixed, but **check what Google actually indexed.**

**The three `profiles` post-run checks from v4.5 §0** — especially the
escalation-refused test, which must be run from the browser as a non-admin.

**User-editable display name.** `score-mock-exam:~596` mints `holder_name` from
`auth.users.user_metadata.full_name` with a `"Certified Professional"` fallback,
so a placeholder name can be minted onto a real credential. **Step 1 is making it
read `profiles.full_name` first** — a settings page shipped before that would
change nothing and look broken. Migration 168 already scoped the grant so
`full_name` is directly writable by the owner. Design settled with Juan: editable
at any time, no lock; snapshot at mint means the profile name is simply "what
gets stamped next." Log the changes — a certificate is an identity document with
no ID verification behind it.

---

## 6. OPEN — SMALLER

- **`credential-seal.tsx` comment fix** — still says the og image is "a generic
  static fallback… identical for every holder." False since credential-og was
  wired. Command is in the session log.
- **`CredentialSeal` still draws a `ShieldCheck`** in the header chip — same
  placeholder the medallion was. Swapping in the badge at ~44px would make the
  emblem consistent across chip, medallion, verify page and LinkedIn card. Check
  legibility first: the inner text is unreadable that small, so it would read as
  a coloured silhouette. Given the programme colour-coding, that may be exactly
  right.
- **Header hex drifts within programme** (v4.5 §9) — pure drop-in when design
  returns it: same filenames, same 501×501, same trim, re-run
  `gen-badges-module.mjs`.
- **Wordmark PNG** still outstanding; `/favicon.ico` still 404s.
- **`CERT-PUBLISH-CHECKLIST.md` needs a line**: *badge PNG committed to
  `public/badges/<CODE>.png` and `gen-badges-module.mjs` re-run.* The badge `src`
  is built from `certification_code`, so a cert published without artwork renders
  a broken image on two public surfaces. The guard belongs in the process — a
  hardcoded list of codes in the components would be a second source of truth.
- **`Add-to-Profile` on the dashboard** would need `issued_at`/`expires_at` added
  to `EarnedCredential`, which the exam page also consumes.
- **Regenerate `lib/supabase/types.ts`** so `.from("credentials")` stops
  inferring `never`. Three `as unknown as` casts now exist because of it.
- Everything in v4.5 §10 still stands.

---

## 7. FILE INDEX — new this session

```
lib/credentials/share-copy.ts                     captions, og titles, TM rules
lib/credentials/claim.ts                          localized claim loader
components/verify/share-credential-button.tsx     copy + open, mobile-gated
scripts/gen-badges-module.mjs                     public/badges -> _shared/badges.ts
scripts/gen-og-fallback.mjs                       renderer -> credential-fallback.png
scripts/load-aihr-descriptions.mjs                AIHR-I i18n descriptions
scripts/patch-verify-og-and-org.mjs               og:image wiring + organizationId
scripts/patch-verify-badge.mjs                    badge on the verify page
scripts/patch-verify-share-button.mjs             share button + localized og
scripts/patch-dashboard-medallion-badge.mjs       badge in the medallion
scripts/patch-dashboard-share-button.mjs          share button on the dashboard
supabase/functions/_shared/badges.ts              GENERATED - do not hand-edit
```

---

## 8. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v4.6.md`, then v4.5 §0 and §6 — those are
> not repeated and §0 is a security item with checks still owed.
>
> Migration tip 168, next free 169.
>
> **First:** the three `profiles` post-run checks from v4.5 §0. The
> escalation-refused test must be run FROM THE BROWSER as a non-admin; the SQL
> editor runs as service role and proves nothing.
>
> **Then:** user-editable display name, §5. `score-mock-exam` reads
> `profiles.full_name` BEFORE the settings page exists, or the feature stamps
> nothing.
>
> **The habit:** query before estimating, and read raw bytes to BUILD an edit,
> not only to verify one. Every anchor built from a `ReadAllText` dump matched
> first try this session; both that were built from piped `Get-Content` output
> failed.
>
> **The rule that generalises:** a check that succeeds is not a feature that
> works. RLS passing is not a grant. A fallback firing is not coverage.
> `navigator.share` existing is not the OS delivering your text. Every one of
> those failed silently, and every one was found by looking at the artifact
> rather than the code that produces it.
