# HANDOFF v8.1 — A partner can design their own badge

**Session date:** 2026-08-21 (continuous with v7.6 through v8.0)
**Migration tip:** 242. Next free: 243. **No new migrations this stretch.**
**Certificate renderer version: 6.**
**Repos pushed:** `certidemy-supabase`, `certidemy-web`.

---

## 0. WHAT CHANGED

v8.0 closed the partner/Certidemy split across four surfaces. This stretch
found a hole that split had left open, finished the certificate, and built the
badge maker.

| commit | repo | what |
|---|---|---|
| `b71589e` | certidemy-web | no partner lifecycle on Certidemy certifications |
| (supabase) | supabase | certificate v5: vector fallback badge |
| (supabase) | supabase | certificate v6: fetch uploaded partner artwork |
| (certidemy-web) | certidemy-web | badge maker |

---

## 1. THE HOLE JUAN FOUND

The console offered **Edit / Copy / Archive / Delete on Certidemy's eleven live
certifications.** Juan asked "wait, does this touch the real ones?" — which is
the question worth asking of every admin surface that shares a component with a
partner surface.

Three of the four were refused by the backend. **Copy was not.**

| action | what actually happened |
|---|---|
| Edit | 409 from update-partner-achievement (has a certification_id) |
| Archive | 409 |
| Delete | 409 |
| **Copy** | **SUCCEEDED.** Different function — create-partner-achievement — with no such guard. |

Copying AIMS-IA would have minted a duplicate achievement under the Certidemy
issuer, carrying the certification's name, with no certification backing, live
at a public URL. Brand pollution, one click, no undo.

**The lesson is the asymmetry.** Not "a feature was broken" but "a feature would
have worked and should not have" — the same class as the LinkedIn
`organizationId` and the signature on a partner's PDF. Two buttons in one row
routed to two functions with two different guards, and only one had been
thought about.

**On the structure question specifically:** a certification's alignments are
DERIVED at render time from `public.tasks` and are never stored in
`achievement_alignments`, which is why the Structure box showed empty for
AIMS-IA. A save could not have overwritten the JTA — it 409s first — but had it
landed it would have written rows that then UNION with the derived ones inside
the emitted credential.

Now: certification rows show *"managed by the pipeline"* and no actions at all,
including the badge upload (which 409s on them too).

**Also fixed:** the row reflowed when `issued > 0` because Delete disappeared
and the action group changed width. Fixed width, right-aligned.

---

## 2. CERTIFICATE v5 AND v6

### v5 — the vector fallback

A partner certificate had a hole where the badge sits. `badgeDataUri()` knows
only the eleven compiled Certidemy codes.

Drawn, not fetched: an octagon, a rule, and the type word, in muted ink at a
hairline. **An octagon rather than a shield** — a shield outline that close to
the Certidemy silhouette would read as a Certidemy badge with the artwork
missing, which is the one thing it must not say.

**CARRIES NO CERTIDEMY MARK.** It says what kind of credential this is and
nothing about who endorses it.

### v6 — fetch the real artwork, and why v5 was built in the wrong order

v5 created an inconsistency: `SCRUM-BOOTCAMP-2-T7ZQ-755P` HAS artwork, renders
it on the verify page and inside the baked PNG, and showed a placeholder on the
certificate. **One credential saying two different things is worse than the
empty space the octagon replaced.**

A placeholder is only correct AFTER the real path exists. Built backwards.

Three sources, in order: compiled → fetched → drawn. Failure at any point falls
through rather than failing the render — everything else on the page is intact,
and a missing badge is cosmetic where a failed download is a support ticket.

**No canvas compensation on uploads.** The compiled badges are 501x501 with a
known transparent margin, so their draw box is computed backwards from the
intended ink box. An upload is square, 256–1024px, with UNKNOWN margins —
possibly edge to edge. Applying the same maths would crop or shrink it
unpredictably. The issuer's own framing is theirs.

### Wording and signature (v4, recorded in v8.0, still current)

Wording keyed to `achievementType`. **The fallback direction is asymmetric and
deliberate**: a Certidemy scheme always uses the certification wording; a
partner with an unlisted type falls back to CERTIFICATE OF COMPLETION, never
COMPETENCE. The conservative default for our own schemes is the reckless one for
everybody else.

A partner certificate is **UNSIGNED**. `CERT_SIGNATURE_PATHS` is Juan Roman's
actual signature; drawing it on a document Certidemy had no part in is a real
person's signature on somebody else's certificate. Their name sits on the rule,
nothing above it, no role — we do not know who at that organisation stands
behind it, and inventing a title is the same error one step removed.

---

## 3. THE BADGE MAKER

A partner types a word, picks any colour, and gets an 800x800 PNG in their
achievement. Entirely client-side.

### One asset, any colourway

`public/badges/blanks/shield.png` is the magenta shield. Measured on the real
file: **44,741 saturated pixels against 387,988 neutral ones**, cleanly
separable at S > 0.22. The coloured ring is the only saturated part; the black
stroke and the grey gradient are neutral.

So recolouring saturated pixels alone produces any colourway while leaving the
artwork exactly as drawn. **No PNG per colour.**

### The ring is a gradient, and that nearly broke it

Ring saturation runs **0.22 to 1.00** and value **0.04 to 1.00**. Setting every
ring pixel to the picked colour would flatten it and the shield would go dead.

Each pixel keeps its RELATIVE position: hue becomes the target's, while
saturation and value scale by the target's against the ring's own mean
(`RING_MEAN_S = 0.757`, `RING_MEAN_V = 0.797`). Tested against six targets
**including a near-black**, which is precisely the case a naive hue shift
destroys.

### What was tried and abandoned

**Vector-tracing the shield.** RDP simplification got it to 22 points, 238
characters, 99.5% silhouette fidelity — and it looked like a wireframe. The
silhouette is not what makes the badges good; the layered strokes, the gradient
ring and the navy block are, and none of those survive a path trace.

Juan's verdict was blunt and correct. **The PIL samples looked right because
they used the real artwork.** Recolouring beats redrawing.

### Nothing new on the backend

A canvas export satisfies every rule `upload-achievement-image` already
enforces: square by construction, 800x800 so inside the 256–1024 band, PNG so
the magic-byte check passes. The 512 KB ceiling is checked before the round trip
rather than discovered as a 400.

### "Powered by Certidemy" — the decision

Three footer modes: *Powered by*, *Your own* (two free-text lines), *Nothing*.

The argument against a Certidemy mark was made and **overruled by Juan, who
owns the brand.** Recorded because the reasoning still applies to the size: a
badge is seen at 60px, where a logo dominates and a disclaimer does not survive.
It sits at maker's-mark size, roughly where a date sits on the Certidemy badges.

**"Powered by" is a true infrastructure claim** — like "Powered by Stripe" on a
checkout — and is a different thing from "Certidemy Premium Partner", which
would assert endorsement and must never appear.

### The 60px preview is a feature, not decoration

The modal shows the badge at 60px with the note that this is where it actually
gets seen. A badge that reads at 400px and turns to mush in a LinkedIn feed is a
badge nobody looks at twice.

---

## 4. THE DOMAIN QUESTION — ANSWERED AND RECORDED

Juan asked whether the issuing product should live on its own domain
(`acredemy.com` / `certidita`).

**`credentials.certidemy.com` CAN NEVER MOVE.** Those four URLs are inside every
signed credential — `id`, `issuer.id`, `achievement.id`, `credentialStatus.id`.
A verifier RESOLVES them; they are identity, not links. That host must answer
for as long as any credential exists. The commitment is already made.

What is possible:

- a new front end anywhere (marketing, console, verify page)
- a SECOND identifier namespace for NEW credentials, as a second Worker
- **not** a migration: existing credentials would point at a dead host

Recorded view: splitting brands before either is established divides attention,
and `credentials.certidemy.com` on every partner badge is currently an asset —
neutral rails a training company buys into. A product NAME inside Certidemy is
reversible; a domain split is not. Parking the domain costs nothing.

Juan's position: thinking about it. Certidemy is ambiguous enough to point a
student at.

---

## 5. THE HOLDER STORY — SCOPED, NOT BUILT

Juan's scenario: an institute issues semester completions to 20 students. Do
they come to certidemy.com to claim?

**A student never needs an account for the credential to work.** It verifies
publicly, it is in the badge PNG, it is in the PDF. The account is only for the
HUB — one place to see everything they hold.

**The claim mechanism already exists.** Migration 237 wired it: sign up with the
email a credential was issued to and it binds automatically. Proven with a real
account.

Two pieces missing, both self-contained:

1. **`/my-credentials`** — no route exists. A claimed credential is invisible to
   its holder; the only path is through a certification's learning silo, which a
   bootcamp student does not have. **This is the actual blocker.**
2. **The issuance email** — nothing tells a holder they have anything.

Flow: partner issues → holder gets an email with their verify URL → signs up
with that address → 237 claims it silently → lands on a hub.

---

## 6. OPEN

**Found this stretch, not yet fixed:**

1. **The console badge thumbnail does not visibly update after an upload.** The
   object DOES update — verified: 22,340 bytes for August, 97,642 for the
   designed September badge. Supabase overrides the upload's `immutable` header
   to `no-cache`, so this is not a CDN problem: the `<img src>` string is
   unchanged, so the browser serves from memory for the page session and
   `router.refresh()` gives React no reason to refetch. **Fix: append the
   achievement's `updated_at` as a query param on the CONSOLE thumbnail only.
   Never on `image_path` — that is inside signed documents and 238's CHECK
   forbids a `?`.**
2. **The Badge upload is a bare file input.** No spec, no drag-and-drop, no
   indication that square 256–1024px PNG is wanted until it is rejected. Should
   be a modal like the maker.
3. **No way to preview the current badge.** A 36px thumbnail is not a preview;
   clicking it should open the full image.
4. **The colour picker and hex field wrap oddly** at the modal width.

**Still broken for partners:**

5. **Blueprint modal** — calls `get-certification-blueprint`, always fails.
   Juan's preference recorded: render the alignments as a syllabus rather than
   hiding the button.
6. **Competencies intro** still says "that domain's share of the exam" above a
   bootcamp with no exam.

**The holder story (§5):**

7. `/my-credentials`
8. The issuance email

**Language — Juan's decision, recorded:**

9. **Super-admin console: English + Spanish. Partner-reachable surfaces: all
   three.** Today the console is entirely hardcoded English. Partner-reachable
   pages are Overview, Seats, People, Issuing.
10. es-419 / pt-BR accents on the six verify-panel anchor strings.

**Backend:**

11. `--rebuild` on `build-credential-anchor.mjs`. Load-bearing since 242.
12. `upsert-issuer-webhook` — webhooks read-only in the console.
13. `set-credential-results` — nothing writes `credential_results` but raw SQL.
14. **A partner-visible credentials list.** `/console/credentials` is
    platform-admin only. Blocks the results editor.
15. Resolver-level SSRF check in the webhook dispatcher.
16. SVG badge upload, once there is a sanitiser.
17. `229_partner_leads` not wired to company creation.

**Structural:**

18. **Super admin context switcher.** Still no way to see the partner view;
    every screenshot so far is the admin render.
19. `IssuingSnapshot.error` pattern applied to the other console loaders — ten
    `lib/console/*.ts` queries still discard their error at the destructure.
20. Certificate designer (233 storage ready, nothing reads it).
21. LTI 1.3.
22. `CERT-PUBLISH-CHECKLIST.md` §6 — the three-things-move-together rule.
23. `normalize-eol.mjs` copied into certidemy-web.
24. Four certifications have no specimen: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.

---

## 7. LIVE STATE

```
issuers            2   certidemy, test-partner-02
achievements      13   11 Certidemy + 2 partner
credentials       10   7 specimens, 2 Certidemy, 1 partner
migration tip    242
cert renderer      6
```

**Test artifacts — do not "fix":**

- `SCRUM-BOOTCAMP-2-T7ZQ-755P` is `results_visibility = 'public'`, served
  `no-store`, hash no longer matching its anchor leaf.
- `test-partner-02.site_url` is `https://credentials.certidemy.com` — a
  test-script artifact that now shows as the "Earn this badge" target.
  `test-partner-issuer.mjs` conflates site and verification domain.
- August's artwork is `SM-AI-I.png`; September's is a designed badge. Both
  correct.

`SM-AI-I-ZZMV-JPC8` unchanged at
`366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796`.

---

## 8. WHAT THIS STRETCH TAUGHT

**Ask whether an admin surface touches the real ones.** The Copy hole existed
because a component was built for the partner case and rendered for every
achievement. The backend refused three of four actions, which felt like safety
until the fourth turned out to route elsewhere.

**Build the real path before the fallback.** The vector badge was correct work
in the wrong order, and it made one credential contradict itself across
artifacts.

**Measure the asset before designing against it.** The saturation split
(44,741 / 387,988) and the ring's S and V ranges are why the recolour works.
Guessing "the ring is magenta, shift the hue" would have flattened the gradient
and nobody would have known why it looked dead.

**A trace is not a design.** 99.5% silhouette fidelity looked like a wireframe.
What makes the badges good is not the outline.

**Diagnose before asserting.** The thumbnail bug was confidently attributed to
an `immutable` cache header. The actual headers said `no-cache` — Supabase
overrides it — and both objects had updated. The real cause was an unchanged
`src` string. **Three predictions this stretch, one right.**

**Patches must detect already-applied.** `patch-wire-badge-maker.mjs` aborted on
a re-run with 3 of 4 anchors matching, because those three survive inside their
own replacements. The guard did its job; the message did not say "already
applied", which is what the operator needed to hear.
