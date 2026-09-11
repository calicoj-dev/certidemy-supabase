# CERT-PUBLISH-CHECKLIST.md

**What this is:** the steps between `verify-cert` returning green and a
certification being sellable. None of them were documented before this file.
`CERT-CREATION.md` ends at the item banks; `CERT-SCHEMA-GUIDE.md` §2 documents
the scaffold tables and stops. Both of the surfaces below were done by hand on
the first six certs and never written down, which cost a discovery cycle on
cert #7.

**Why it matters:** `verify-cert` returns *"All certs conform. Safe to publish"*
on a certification that renders a blank catalogue card and shows no sample
questions. Every invariant it checks is about assessment integrity. Nothing it
checks is about whether the thing can be sold.

---

## 1. Catalogue claim — `certification_i18n`

The one-line **"Validates …"** string under each cert in the catalogue picker.
Without a row the card renders bare: code and name only.

| Column | Value |
|---|---|
| `name` | **NULL** for every language. Cert names are product identifiers and are not translated; NULL makes the loader fall back to `certifications.name`. |
| `claim` | Required, all three languages. **A scope statement bound to the JTA, not marketing copy** — it is what a buyer or an assessor holds you to. |
| `description` | Populated in all three languages for every cert. The catalogue card reads `claim`; the certification page reads `description`. (This row previously said NULL; that stopped being true once the long-form pass ran, and the note was never updated.) |

**English goes in a migration.** It is ASCII and safe through the SQL editor.
Precedent: migration 113, and 151 for AIHR-I.

**es-419 and pt-BR go through the script.** They carry accented characters and
the Supabase SQL editor is this project's known source of double-encoded UTF-8.

```
cd certidemy-web
node scripts/load-cert-i18n.mjs --dry     # ALWAYS first; flag is --dry
node scripts/load-cert-i18n.mjs
```

The data lives in the `CLAIMS` object inside that script, shaped
`{ lang: { code: claim } }`. Add the new cert to both language blocks.

### How the two fields actually render — neither is guessable from the database

**Read this before writing either field.** Both facts below were established by reading the
marketing certification pages on 2026-09-11, and both had already shaped copy that was
written without them.

> **THE CARD SHOWS `claim ?? description`.** `certifications/page.tsx:150`. So the CLAIM is
> the scannable catalogue line and the DESCRIPTION is detail-page body copy. They are two
> jobs, not two lengths of the same sentence — a claim written as a short description
> reads as a truncation, and a description written as a long claim never gets seen on the
> card at all.

> **THE DESCRIPTION'S PARAGRAPH BREAKS DO NOT SURVIVE.** `[code]/page.tsx:263` renders it
> inside a single `<p class="max-w-2xl text-lg">` with **no `whitespace-pre-line`**. Copy
> drafted and approved as four paragraphs renders as one unbroken block of large type under
> the h1 — **and nobody sees that until the page is live**, because the database holds the
> newlines faithfully and every query shows them.
>
> **Write the description as one flowing paragraph.** If it needs sections, it is not a
> description; it belongs in the scheme document, which the blueprint drawer already links.

**The exam facts are already on the page and do not belong in the prose.**
`[code]/page.tsx:269` renders a `Stat` strip directly beneath the description carrying
**questions, pass mark, minutes and domain count**. Stating them in the description puts
them on screen twice, a few hundred pixels apart. **Languages are NOT in that strip**, so a
language list in the prose earns its place.

### A note on length, and why SM-AI-II is not the model

| | chars |
|---|---|
| House range across eleven certs | **266 – 595** |
| AISM-I, the longest before 2026-09-11 | 595 |
| **SM-AI-II** | **~1,200** |

**SM-AI-II's description is roughly double the longest and that is deliberate, but it is
not a precedent.** Its fourth passage does work no other certification's description has to
do: it states that **four of D5's nine tasks would have the same best answer without a
model in the work system**, and that they earn their place on frequency rather than on
judgment. That is `SCHEME-SM-AI-II.md` §2.1's scenery-swap finding, put on the sales page
on purpose — a competitor comparing at that level reads the scheme document and finds the
table in a minute, and the only question is whether they find it from us first.

> **DO NOT COPY THE LENGTH WITHOUT COPYING THE REASON.** A description runs long when it is
> disclosing something a buyer would otherwise discover and hold against you. Absent that,
> the range above is the range.

### Register

Every claim in the catalogue opens with **Validates / Valida** to preserve the
parallel form, and runs to roughly one sentence. The existing set:

| Cert | Claim (en) |
|---|---|
| AIE-I | Validates that the holder can use everyday AI tools safely and with sound judgment. |
| AIHR-I | Validates the judgment to use AI in employment decisions without creating legal exposure. |
| AIGRM-I | Validates that the holder can establish and maintain organizational AI governance, risk, and control. |
| AISM-I | Validates that the holder can operate and assure AI-enabled services in production. |
| SM-AI-I | Validates the craft of making Scrum work in AI-augmented teams. |
| SPO-AI-I | Validates agile product ownership when AI reshapes backlog, value, and roadmap. |
| SD-AI-I | Validates the engineering craft of building and verifying an Increment with AI in the loop. |

Do not loosen one into something punchier without re-reading that cert's JTA.

---

## 2. Public sample questions — `quiz_questions.visibility`

The *"See it before you trust it"* carousel on the certification page. Real items
from the practice bank, cycled two at a time, free to view.

`visibility` takes three values:

| Value | Meaning |
|---|---|
| `secure` | Every item in the secure pool. Never changes. |
| `private` | Practice items reachable only by enrolled learners. The default. |
| `public` | Practice items rendered on the marketing page. |

**Six logical items, all three languages — 18 rows.** Matched on
`question_group_id` so the languages move together.

### Selection rules

- **Practice pool only.** No secure item is ever made public. The firewall
  invariant is unaffected by this step and must stay that way.
- **Six distinct tasks.** Partition by task, not by domain — ranking within a
  domain puts two picks inside the same task, since each task holds ten items.
  This was the defect in AIHR-I's migration 149, corrected by 150.
- **Blueprint-weighted across domains.** AIHR-I used D1×1, D2×2, D3×2, D4×1
  against weights of 20/30/30/20.
- **Apply and Analyze only** where the scheme's profile supports it. The
  showcase should demonstrate judgment, not recall.
- **Deprioritise single-jurisdiction stems.** A LATAM-first catalogue should not
  lead with US state and city law. Sort those last rather than excluding them.
- **Preview before tagging.** Read the six stems. They are the first thing a
  prospective candidate sees of the item bank.

Reference implementation: `150_aihr_i_public_samples_distinct_tasks.sql`. It
resets to `private` first, so it is a true reselection and re-running cannot
accumulate extra public rows.

---

## 3. Module titles and descriptions — `module_translations`

The module cards inside the course. Without rows, a Spanish or Portuguese
candidate reads the whole module list in English while the lessons around it
are translated.

**ISMS-F published with zero rows.** Every other cert had full coverage. No
check caught it — `verify-cert` does not look at this table, and the view
built to expose it is never consulted. It was found by a human opening the
Spanish course and noticing.

| Column | Value |
|---|---|
| `title` | Required, es-419 and pt-BR. Match the domain translations already approved — a module title and its domain title are the same string to a candidate. |
| `description` | Required. One or two sentences, same register as the English. |
| `is_provisional` | `true` on write. These are AI-drafted; the flag is what says so. Flip after review, like the JTA translations. |

`load-module-i18n.mjs` is a **hardcoded backfill for four specific certs**,
not a reusable tool. A new cert needs its rows written directly, with
` `$`$ `-quoted strings so apostrophes cannot terminate a literal.

**Check:**

```sql
select * from public.v_module_i18n_coverage order by certification_code;
```

Every cert should show `modules = es_419 = pt_br`. A new cert appearing as
the only row where those disagree is the failure this section exists for.

---

## 4. Status

`certifications.status`: `draft` → `coming_soon` → `available`. Flipped in the
super-admin console. Do not flip until §1 and §2 are done and `verify-cert` is
green — a cert can be structurally perfect and commercially unsellable.

---

## 5. Proposed `verify-cert` invariants

These would have failed loudly on AIHR-I instead of requiring a human to notice
a blank card on the live site. Both are cheap:

```
§12  Catalogue claim present        certification_i18n rows for this cert
                                    where claim is not null = 3
§12  Public samples tagged          practice items with visibility='public',
                                    grouped by language = 6/6/6, across
                                    6 distinct task codes
```

A third worth considering, since it is the same class of failure:

```
§12  No secure item is public       quiz_questions where pool='secure'
                                    and visibility <> 'secure' = 0
```

Two more, added after ISMS-F. The first would have caught the module gap in
one query; the second catches a source file and the database disagreeing,
which cost two reverted corrections in one session:

```
§12  Module translations complete   v_module_i18n_coverage: for this cert,
                                    modules = es_419 = pt_br
§12  Claim loader knows this cert   the cert code appears in the CLAIMS
                                    object in load-cert-i18n.mjs
```

One more, added August 2026, and it is the only one on this page whose absence
loses a credential rather than a sale:

```
§12  Certification has an          exactly ONE achievements row with
     active achievement            certification_id = this cert, status
                                   'active', achievement_type 'Certification',
                                   on an ACTIVE issuer                (§6.7)
```

Every other invariant here catches a cert that cannot be sold. This one catches
a cert that can be sold, examined and passed — and then cannot issue the
document the candidate earned.

The second cannot be a database check — it compares a source file against
rows — but it is the one that matters most. A row written by hand and never
added to its loader survives until someone runs the loader, at which point it
is silently skipped or overwritten.

Three more, added September 2026 after SM-AI-II. All three are about the
**record** rather than the sale: a certification that passes every check above
and cannot show an assessor what its exam claims to measure.

```
§5   Published JTA version         jta_versions rows for this cert where
                                   status='published' >= 1
§5   JTA exists as a file          jta/<CODE>_JTA_generated.md AND
                                   jta/<CODE>_JTA_vN.md both present
§12  verify-cert is green, or      every remaining failure is named in
     its failures are declared     SCHEME-<CODE>.md §12 as content not
                                   yet built
```

**Published JTA version already exists as a check** — `verify-cert.mjs:1005`,
invariant `jta.published`. It is listed here because it was missing from §6's
order, which is how eleven certifications each rediscovered the row by hand.
**Migration 277 wrote the problem down in its own header:** *"jta_versions row,
published, projected from the live rows. CERT-PUBLISH-CHECKLIST still has no
step for this and ten certs have each rediscovered it."* SM-AI-II was the
eleventh, and it had already paid for the absence — migration 283 overwrote its
`cognitive_profile`, so the profile it published for six days survives in no
queryable form.

**JTA exists as a file is a filesystem check, not a database one**, like the
claim-loader check above it. **SM-AI-II reached a complete scaffold, a written
scheme document and an authored module of nine lessons with no JTA file of any
kind**, while `SCHEME-SM-AI-II.md`, `cert.yml` and two migrations all cited
`SM-AI-II_JTA_v1.2.md` as the JTA of record. That file was never committed —
`git log --all --diff-filter=A` finds no addition, so it was not deleted; it
never existed. **Nothing caught it for a week.**

**The third is not "verify-cert green".** A certification mid-build fails
`floors.secure`, `floors.practice` and `jta.formFill` because the bank does not
exist yet, and that is the correct state. What must be true is that **every
remaining failure is one the scheme document already declares**, so a failure
nobody expected cannot hide behind the ones everybody does. This is the check §4
assumes when it says "until `verify-cert` is green" and does not define.

Until these exist, this checklist is the control, and it is a human one.

---

## 6. Order for the next cert

1. `CERT-CREATION.md` stages 1–11 as documented.
2. **Write the JTA, both halves.** `node scripts/gen-jta-doc.mjs --cert <CODE>`
   produces `jta/<CODE>_JTA_generated.md` from the live rows and is
   authoritative for every fact. The hand-written `jta/<CODE>_JTA_vN.md` carries
   only what no query can reconstruct — design rationale, review history, what
   changed and why. **Neither substitutes for the other**, and a hand-written
   JTA that restates the scaffold is the drift `gen-jta-doc.mjs` exists to
   prevent.
3. **Write the `jta_versions` row**, `status='published'`, snapshot **projected
   from the live rows and never hand-typed**. Template: `migrations/211`. Most
   recent worked example: `migrations/284`. Nothing creates this row for you,
   `verify-cert` invariant `jta.published` fails without it, and a snapshot
   pasted as literal JSON is the transport that has corrupted multibyte
   characters before.
4. `verify-cert --cert <CODE>` green, **or every remaining failure named in
   `SCHEME-<CODE>.md` §12** as content not yet built — **and every §12 entry
   still TRUE, not merely still failing.** Naming and currency are different
   properties and this step only checks the first: a row whose failure persists
   for a changed reason passes it while saying something false. `SM-AI-II` did
   exactly that on the first real run of this step; the standing note at the top
   of `SCHEME-SM-AI-II.md` §12 records both halves and is the worked example.
5. English claim migration.
6. Add the cert to `CLAIMS` in `load-cert-i18n.mjs`; `--dry`, then live.
7. Write `module_translations` for every module, both languages (§3).
8. Preview candidate sample questions; tag six distinct tasks public.
9. Confirm the catalogue card and the carousel render in all three languages.
10. **Open the course in es-419 and pt-BR and read a module list and a lesson.**
    Steps 6→9 are all catalogue surfaces. Nothing above this line looks
    inside the course, which is where the module gap and a renderer bug both
    hid on ISMS-F.
11. **Insert the achievement row (§6.7) and confirm it is `active`.** Nothing
    creates it for you, and without it a passing candidate gets no credential.
    This is the last step that is invisible until the worst possible moment.
12. Flip status.

**On step 6.** It already said this when ISMS-F was built, and ISMS-F's claims
were written by direct SQL instead — so the rows existed only in the database
and the loader did not know the cert. The checklist was correct and was not
followed. Writing a row by hand is faster; adding it to the loader is what
makes it survive.

**On steps 2 and 3.** Both are records rather than surfaces, and both were
discovered eleven times. `CERT-CREATION.md` Stage 4 says "lock the JTA" and
names the file it produces; nothing between there and here made anyone check
that the file was written. SM-AI-II is the certification that proved you can
reach a complete scaffold without one.


---

## 6. Open Badges 3.0 — the credential surface

**Added August 2026.** Sections 1–5 are about whether a certification can be
SOLD. This one is about whether the credential it produces can be VERIFIED by
someone who is not us — which is the entire claim the product rests on.

Every check here has caught a real defect that looked like success. None would
have been caught by "did the page load".

### 6.1 The four identifier documents resolve, anonymously

```
cd supabase
node scripts/check-jsonld-safe-mode.mjs \
  "https://credentials.certidemy.com/issuers/certidemy?cb=$RANDOM" \
  "https://credentials.certidemy.com/issuers/certidemy/achievements/<CODE>?cb=$RANDOM" \
  "https://credentials.certidemy.com/issuers/certidemy/status/1?cb=$RANDOM" \
  "https://credentials.certidemy.com/credentials/<CODE>?cb=$RANDOM"
```

Wants **200**, content-type `application/vc+ld+json`, and **SAFE MODE PASS** on
all four. Cache-bust every URL: the achievement document changes per
certification and a stale edge copy hides a real failure.

JSON-LD safe mode is a hard requirement of the 1EdTech Issuer certification
profile, added December 2025. A term not defined by any context is an ERROR, not
a silent drop.

*Found by this check:* `verificationMethod` not expanding on `/issuer`, and a
relative `@type` reference on the status list. Both had been shipping.

### 6.2 Both proofs verify, and both reject tampering

```
node scripts/verify-rdfc-proof.mjs \
  "https://credentials.certidemy.com/credentials/<CODE>" --tamper
```

Wants **failures: 0**, with `eddsa-jcs-2022` and `eddsa-rdfc-2022` both
verifying, JCS at `proof[0]`, and **both rejecting the altered document**.

The tamper half is the half that matters. A proof that survives a one-character
change is not covering the document — which is exactly what a canonicalizer
silently dropping fields produces. A green run without `--tamper` is half the
evidence.

This script shares NO code with the signer. It re-derives base58,
canonicalization and payload assembly from the cryptosuite spec, and fetches the
public key over the network. A signature that verifies only against the code
that produced it proves nothing.

### 6.3 The baked badge is a valid PNG carrying the credential

```
curl -s -o badge.png "https://credentials.certidemy.com/credentials/<CODE>/badge"
node scripts/extract-baked.mjs badge.png
```

Wants: **~66 KB** (~21 KB artwork + ~45 KB credential), chunk type `iTXt`,
**exactly one** `openbadgecredential` keyword (the spec forbids more), and the
extracted credential passing safe mode.

*The byte count is the check.* A `.text()` decode of PNG bytes produced an
84,276-byte corrupt file served with a 200, twice, in two different proxies, and
the extractor still printed plausible JSON both times.

### 6.4 Type check before every function deploy

```
deno check --node-modules-dir=auto supabase/functions/open-badge/index.ts
deno check --node-modules-dir=auto supabase/functions/credential-og/index.ts
```

`--node-modules-dir=auto` is required: `npm install jsonld` created a
`node_modules` that puts Deno in manual mode, and the failure
(`Could not find a matching package for 'npm:@types/node'`) reads like a code
error. It is not.

`supabase functions deploy` bundles with esbuild, which strips types WITHOUT
checking them. A type error deploys clean and fails at runtime — on the mint
path, where it costs a paid attempt.

*Found by this check the first time it was ever run:* 30 errors across two
functions, including `signDocument` having been type-broken since Open Badges
shipped.

### 6.5 Before changing the credential document shape

**Grep both repos for readers of the field you are changing.**

```
Get-ChildItem -Recurse -Path certidemy-web -Include *.ts,*.tsx |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  Select-String -Pattern '\.<field>\b'
Get-ChildItem -Recurse -Path supabase\functions -Include *.ts |
  Select-String -Pattern '\.<field>\b'
```

Adding `eddsa-rdfc-2022` turned `proof` into an array. Correct in itself, and it
broke the badge panel — which destructured it as an object — on a live paying
customer's credential. The grep that found the one affected consumer took four
seconds and ran after the deploy rather than before.

### 6.6 A new certification needs its badge in TWO places

`public/badges/<CODE>.png` in the web repo, AND the `BADGE_CODES` set in
`app/[locale]/(marketing)/certifications/[code]/page.tsx`, AND regenerated into
`_shared/badges.ts` via `gen-badges-module.mjs`.

Three lists, one truth. Miss the first and the cert page renders a broken image;
miss the third and `?doc=baked` 404s.

### 6.7 A new certification has NO achievement until you insert one

**Nothing creates it.** No trigger on `certifications`, no function, no edge
function — every `public` function body was scanned and none inserts into
`achievements`. Migration 231 created one achievement per certification as a
**one-time backfill** over the eleven that existed on 2026-08-19 and left no
forward mechanism.

`credentials.achievement_id` is NOT NULL. So a certification created after that
date **cannot mint a credential at all** until someone remembers this step. The
cert will pass `verify-cert`, sell seats, run exams, score them, write the
`exam_attempts` row — and then fail at the mint, in front of a candidate who
has just passed.

Insert it, with `certification_id` set and `status='active'`:

```sql
insert into public.achievements
  (issuer_id, code, achievement_type, certification_id, name, description,
   authoring_depth, status)
select
  (select id from public.issuers where slug = 'certidemy' and is_active),
  c.code, 'Certification', c.id, c.name,
  coalesce(nullif(c.description, ''), c.name),
  'certification', 'active'
from public.certifications c
where c.code = '<CODE>';
```

Four things that will bite:

- **`achievement_type` MUST be `'Certification'`.** The column defaults to
  `'Certificate'`, and `guard_achievement_identity` rejects anything else once
  `certification_id` is set.
- **`status` MUST be `'active'`.** The mint refuses a `draft` or `archived`
  achievement — deliberately, since a credential pointing at an inactive
  definition claims something nothing defines.
- **The code is immutable once a credential exists** (`guard_achievement_identity`).
  It becomes the public URL `/achievements/<code>`. Choose it once.
- **`achievements_certification_unique`** is a partial unique index — one
  achievement per certification, ever — so re-running the insert is safe but a
  second, different one is impossible.

Verify by property, not by count:

```sql
select c.code
from public.certifications c
left join public.achievements a on a.certification_id = c.id
left join public.issuers i on i.id = a.issuer_id
where c.status in ('available', 'unavailable')
group by c.code
having count(a.id) <> 1
    or not bool_and(a.status = 'active')
    or not bool_and(a.achievement_type = 'Certification')
    or not bool_and(i.is_active);
```

Zero rows is the pass. Any row names a certification that will fail at the mint.

---

*Written 26 July 2026, from what AIHR-I needed after verify-cert went green.*
*Section 6 added August 2026, from what the OB3 namespace migration and the dual-proof change each broke silently.*
