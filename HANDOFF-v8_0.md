# HANDOFF v8.0 — Everything a partner touches now says what is true

**Session date:** 2026-08-21 (continuous with v7.6 through v7.9)
**Migration tip:** 242. Next free: 243.
**Certificate renderer version: 4.** Bumped, so every stored PDF re-renders.
**Repos pushed:** `certidemy-supabase`, `certidemy-web`.

---

## 0. WHAT THIS STRETCH WAS

v7.9 ended with the console Issuing section built and the transcript layer
working. Then a partner credential was looked at from the outside -- the verify
page, the badge, the PDF, LinkedIn -- and almost every surface turned out to be
asserting something Certidemy had no business asserting.

**The theme is not "partner support was incomplete."** It is that every surface
had a Certidemy assumption baked in as a default, and defaults are invisible
until something else comes through them.

| commit | repo | what |
|---|---|---|
| `ac76c71` | supabase | 242 + update-partner-achievement |
| `47d7533` | supabase | truthful note on what an edit does |
| `5ad625f` | supabase | archive no longer 500s partner credentials |
| `a161eaf` | supabase | verify-credential returns issuer context |
| `165f6d0` | supabase | certificate wording + signature |
| `3c849ab` | certidemy-web | achievement CRUD in the console |
| `7d14433` | certidemy-web | competencies tab renders partner alignments |
| `1abb605` | certidemy-web | verify page partner-aware |

---

## 1. THE CORRECTION THAT MATTERS MOST

**v7.9 and the first version of update-partner-achievement both stated that an
already-issued credential keeps a frozen copy of its achievement. THAT IS
FALSE.**

`loadAchievement` builds the achievement object FRESH on every request.
Nothing about an achievement is snapshotted onto the credential row. Renaming
an achievement changed the already-issued credential's document on the very
next fetch -- observed, not reasoned about.

For certifications this is deliberate and documented inside `loadAchievement`:
the NAME comes from the live row so a renamed product does not stamp a stale
name onto credentials. Only the JTA `domains` come from a snapshot. Partner
achievements read live for the same reason.

**Editing is still safe -- for a different reason than was claimed.** Not
because the past is untouchable, but because the credential is RE-SIGNED ON
READ, so an edit produces a consistent new document rather than a broken old
one.

**What was actually missing was the timestamp.** The rename changed the
document and `material_updated_at` did not move: two materially different
documents claiming the same version, and the anchor leaf silently stopped
matching. The signature still verified, because open-badge signs at read time
over whatever bytes exist. **Nothing failed loudly. That is the dangerous
part.**

Migration 242 fixes it with triggers, and repaired the one credential that had
already drifted.

---

## 2. MIGRATION 242 — EDITS RE-DATE CREDENTIALS

Three triggers, because a credential's rendered document draws from three
tables and the credential ROW never changes when any of them do:

- `achievements` — UPDATE, watching only the columns that reach the document
- `achievement_alignments` — INSERT, UPDATE **and DELETE**
- `achievement_results` — INSERT, UPDATE and DELETE

INSERT and DELETE matter: `update-partner-achievement` replaces the whole
alignment set by delete-then-insert, and neither half is an UPDATE.

### The watched column list is load-bearing in both directions

Watched: `name`, `description`, `achievement_type`, `criteria_narrative`,
`criteria_url`, `image_path`, `default_validity_days`. Every one verified
against what `buildAchievement` actually emits.

NOT watched: `status` (archiving changes whether the PUBLIC DEFINITION is
served, not what a credential says), `code` (immutable once a credential
exists), `tags`, `authoring_depth` (neither is emitted).

**Too narrow and a document changes under a stale timestamp. Too broad and
every credential re-anchors for an edit nobody can see.**

Consequence to plan for: a professor recording marks weekly re-dates that
credential weekly. `--rebuild` on `build-credential-anchor.mjs` is now
load-bearing rather than a nice-to-have.

---

## 3. THE ARCHIVE BUG — A GATE THAT INFERRED INSTEAD OF ASKING

`loadAchievement` gated unpublished achievements with:

```
if (!jtaVersionId && ach.status !== "active") return null;
```

The intent was right: a draft definition is not a published claim, so the
PUBLIC endpoint must not serve one, and a credential is exempt because an
achievement can be archived after issuance.

**The mechanism inferred "is this a credential?" from a CERTIFICATION-ONLY
column.** A partner credential has no `jta_version_id`, so the exemption never
applied to one. The moment a partner archived an achievement, every credential
ever issued from it would have returned 500.

It worked for certifications only by accident — they happen to pass a version
id, which happens to satisfy an unrelated condition.

Now an explicit `publicDefinition` flag. Exactly one caller passes true.
**Verified live: archived achievement → credential 200, public definition
404.**

---

## 4. ACHIEVEMENT LIFECYCLE (update-partner-achievement + console)

| | code | other fields | delete | archive |
|---|---|---|---|---|
| 0 issued | editable | editable | allowed | allowed |
| any issued | LOCKED | editable | REFUSED | allowed |

Both locks were already structural: 231's trigger blocks the code change,
`credentials.achievement_id` is ON DELETE RESTRICT. **The UI reflects reality
rather than inventing rules.**

Delete only appears at 0 issued — a Delete button that always errors is worse
than no button. The 409 explains what to do instead.

**Duplicate** pre-fills everything and increments a trailing number preserving
width: `2026-08` → `2026-09`, `BATCH-099` → `BATCH-100`. No trailing number
means no guess, and the field starts blank.

**Code normalisation is on BLUR, and spaces become HYPHENS not underscores.**
The existing eleven codes are SM-AI-I, AIMS-IA, ISMS-F; a namespace with two
conventions is permanent, and this was the moment it would have forked.
Normalising per keystroke rewrites under the cursor mid-word, which is how a
form stops getting filled in.

**Criteria is marked required** because 234 demands 20 characters for an active
achievement and the form always creates as active. Marking it optional and
then rejecting it is the worst of both.

---

## 5. THE PARTNER-VS-CERTIDEMY SPLIT, SURFACE BY SURFACE

`verify-credential` returned `certification_name` and `certification_code` and
nothing about WHO issued the credential or WHAT KIND it is. Every consumer
therefore assumed Certidemy.

It now returns `is_certification`, `issuer_slug`, `issuer_name`,
`issuer_site_url`, `achievement_type`, `image_url`, `criteria_url`. **Nothing
new is exposed** — every field already appears in the credential document
open-badge serves publicly. The endpoint was returning less than the document
beside it. The score remains absent.

### What was wrong, and which was serious

| surface | symptom | severity |
|---|---|---|
| verify page badge | 404, src built as `/badges/<code>.png` | broken |
| verify page label | said CERTIFICATION over a Course | false claim |
| "Earn this badge" | linked to a certification page that does not exist | broken |
| competencies tab | three `undefined`s per row | broken |
| **LinkedIn** | **attributed a partner's course to Certidemy** | **FALSE ATTRIBUTION** |
| **certificate PDF** | **COMPETENCE wording + Juan Roman's signature** | **FALSE ATTRIBUTION** |

**The last two are a different class.** The others make a page look broken.
Those two put a claim on somebody's professional record and a real person's
signature on a document they had no part in.

### LinkedIn

`organizationId` renders Certidemy's logo on the holder's Licenses &
Certifications entry. LinkedIn accepts `organizationName` as free text when
there is no numeric id — so a partner's credential now carries the partner's
own name, no logo, no implied relationship.

### The competencies tab

Read `certidemy:domainCode` and `certidemy:domainWeightPct`, which exist only
on JTA-derived alignments. **`String(undefined)` returns "undefined" rather than
throwing**, so nothing failed and the panel confidently displayed it. Now
renders what is present: domain and weight when there is one, the group name
when there is not, nothing when neither.

---

## 6. THE CERTIFICATE (renderer v4)

### Wording keyed to achievementType

OB 3.0 carries no display strings whatsoever — only `achievementType` and data.
**Every word on that page is Certidemy's editorial choice**, and "CERTIFICATE
OF COMPETENCE / has successfully earned" over a three-day course is a claim we
were making on a partner's behalf that they never made.

`KIND_WORDS` covers Course, Certificate, CertificateOfCompletion,
LearningProgram, Diploma, Assessment, License, Membership, Badge,
MicroCredential — in all three locales, accents as `\uXXXX` escapes.

**The fallback direction is asymmetric and deliberate.** A Certidemy scheme
always uses the certification wording regardless of its type field. A PARTNER
with an unlisted type falls back to CERTIFICATE OF COMPLETION, not COMPETENCE —
the conservative default for our own schemes is the reckless one for everybody
else, because an unrecognised type would otherwise print the biggest claim we
have on the document we know least about.

### The signature

`CERT_SIGNATURE_PATHS` is Juan Roman's actual signature. On a partner document
that is not wrong copy — it is a real person's signature on somebody else's
certificate.

**A partner certificate is UNSIGNED.** Their name sits on the rule; nothing
above it; no role, because we do not know who at that organisation stands
behind it and inventing a title is the same error one step removed. An unsigned
certificate is a true document; a misattributed signature is not.

`issuer_branding` (migration 233) holds `signature_name`, `signature_title`,
`signature_svg_d` for exactly this. **Nothing reads it yet.**

### Both callers had to change

`get-credential-certificate` renders on demand; `regenerate-certificate`
rebuilds the stored copy. If only one passed the new fields, the same
credential would produce two different documents depending on which path ran —
and the stored one wins every subsequent request.

**v4 invalidates every stored certificate.** That is the mechanism working: it
is the only way a wording change reaches credentials already issued.

---

## 7. CONSOLE READS AND THE ERROR STATE

**239 (v7.9) — GRANT is checked BEFORE RLS.** 185 revoked `public.issuers` from
`authenticated`, so policies alone would have changed nothing. Column-scoped
grants, never `vault_secret_id` / `key_hash` / `secret_id`. Verified live: all
three `has_column_privilege` checks false.

**`IssuingSnapshot.error`** now distinguishes a failure from an empty. Of five
early returns exactly one is a failure; four more child queries that discarded
their errors with `?? []` now surface too. A permissions error rendering as a
product pitch to somebody who already owned two issuers was the bug that
motivated it.

**The pattern is repo-wide.** Ten `lib/console/*.ts` queries still destructure
without capturing `error`:

```
git -C certidemy-web grep -n "const { data: [a-zA-Z]* } = await" -- "lib/console/*.ts"
```

Each one is a section that renders empty when something is actually broken.

---

## 8. LIVE STATE

```
issuers            2   certidemy, test-partner-02
achievements      13   11 Certidemy + 2 partner (2026-08, 2026-09)
credentials       10   7 specimens, 2 Certidemy, 1 partner
credential_results 1   Percent 92, "Final assessment"
migration tip    242
cert renderer      4
```

**Deliberate test artifacts — do not "fix" these:**

- `SCRUM-BOOTCAMP-2-T7ZQ-755P` is `results_visibility = 'public'`, served
  `no-store`, hash no longer matching its anchor leaf (holder_email was edited
  by hand in v7.8, results added, achievement renamed twice).
- `test-partner-02.site_url` is `https://credentials.certidemy.com` — the
  verification host, not a marketing site. A test-script artifact from v7.8
  that now shows as the "Earn this badge" target. **`test-partner-issuer.mjs`
  conflates the two and needs a `--site-url` flag.**
- That partner's badge artwork is `SM-AI-I.png`. A Certidemy shield on a
  partner credential is correct — it is the file that was uploaded.

`SM-AI-I-ZZMV-JPC8` unchanged at
`366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796` throughout,
verified before and after every deploy in this stretch.

---

## 9. OPEN

**Known broken for partners, both contained:**

1. **Blueprint modal** — calls `get-certification-blueprint`, always fails for a
   partner. Either hide the button when `is_certification === false` (one line,
   and the same content is in the Competencies tab) or render the alignments as
   a syllabus. **Juan's call: the syllabus is the nicer artifact.**
2. **Certificate badge** — `badgeDataUri()` knows only the eleven compiled
   codes, so partner artwork is missing from the PDF although it renders
   everywhere else. Same shape as the `?doc=baked` fix: fetch it, size-guard
   it, omit rather than break.

**Copy and translation:**

3. **Competencies intro** still says "that domain's share of the exam" above a
   bootcamp with no exam. Needs a second message key in three locales.
4. **es-419 / pt-BR accents** on the six verify-panel anchor strings, written
   ASCII-only on purpose. They read fine and are not correct Spanish or
   Portuguese.
5. **THE LANGUAGE DECISION.** Juan's call, recorded: the **super-admin console
   is English + Spanish**; the **partner-reachable surfaces need all three**.
   Today the console is entirely hardcoded English. Partner-reachable pages are
   Overview, Seats, People, Issuing.

**Backend:**

6. `--rebuild` on `build-credential-anchor.mjs`, keyed on stale `doc_version`.
   Now load-bearing (§2).
7. `upsert-issuer-webhook` — webhooks are read-only in the console.
8. `set-credential-results` — nothing writes `credential_results` except raw
   SQL, and the visibility toggle needs scoped authorization.
9. **A partner-visible credentials list.** `/console/credentials` is
   platform-admin only; a partner cannot see their own issued credentials at
   all. Blocks the results editor.
10. Resolver-level SSRF check in the webhook dispatcher.
11. SVG badge upload, once there is a sanitiser.
12. `229_partner_leads` not wired to company creation.

**Structural:**

13. **Super admin context switcher** — a REAL `team_members` row making
    Certidemy the zeroth partner. **There is still no way to see the partner
    view.** Everything looked at so far is the admin render.
14. `IssuingSnapshot.error` pattern applied to the other console loaders (§7).
15. Certificate designer (233 storage ready, nothing reads it).
16. LTI 1.3.
17. `CERT-PUBLISH-CHECKLIST.md` §6 — the three-things-move-together rule.
18. `normalize-eol.mjs` copied into certidemy-web.
19. Four certifications have no specimen: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.

---

## 10. WHAT THIS STRETCH TAUGHT

**A false reassurance is worse than no information.** The function told a
partner "the credentials already issued keep the wording they were signed
with." Somebody would have edited freely on that basis and learned otherwise
from a learner rather than from us.

**Assumptions become defaults, and defaults are invisible.** Every bug in §5
was code written when every credential was a Certidemy certification. None was
wrong when written. All became wrong when something else came through.

**`String(undefined)` returns "undefined".** It does not throw. The competencies
tab rendered three of them per row and nothing anywhere reported a problem.

**A concatenated select string collapses the row type.** Twice now — first
`lib/console/issuing.ts`, then `verify-credential`, where it produced 16 errors
on properties that had worked for months. The certificate callers avoided it by
APPENDING to the existing literal instead of reformatting. **This belongs in
CERT-SCHEMA-GUIDE.md, not in a third header comment.**

**Post-conditions keep failing on arithmetic, never on anchors.** Six aborts
this stretch: `readSigningKey`, `anchorBlock.hash`, `cache-control`, `m[2]`
inside a comment, `"cache-control": cache` twice, `cred?.status === "specimen"`
twice. Every one was a wrong EXPECTED VALUE. **Anchors have never been wrong.**
Guards that match prose rather than code shapes caused three of them — the rule
is now explicit: match code, not words.

**A patch that prints ABORT changed nothing.** Do not build, deploy or commit
after one. Two builds and one deploy were run against unchanged files this
stretch.

**Node tests logic; it does not type-check.** `suggestNextCode` passed every
behavioural test and failed the build on `noUncheckedIndexedAccess`. Supabase
functions get `deno check`; web components get nothing until `npm run build`.
That asymmetry is why every panel patch has needed a second pass.
