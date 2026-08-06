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

The second cannot be a database check — it compares a source file against
rows — but it is the one that matters most. A row written by hand and never
added to its loader survives until someone runs the loader, at which point it
is silently skipped or overwritten.

Until these exist, this checklist is the control, and it is a human one.

---

## 6. Order for the next cert

1. `CERT-CREATION.md` stages 1–11 as documented.
2. `verify-cert --cert <CODE>` green.
3. English claim migration.
4. Add the cert to `CLAIMS` in `load-cert-i18n.mjs`; `--dry`, then live.
5. Write `module_translations` for every module, both languages (§3).
6. Preview candidate sample questions; tag six distinct tasks public.
7. Confirm the catalogue card and the carousel render in all three languages.
8. **Open the course in es-419 and pt-BR and read a module list and a lesson.**
   Steps 4→7 are all catalogue surfaces. Nothing above this line looks
   inside the course, which is where the module gap and a renderer bug both
   hid on ISMS-F.
9. Flip status.

**On step 4.** It already said this when ISMS-F was built, and ISMS-F's claims
were written by direct SQL instead — so the rows existed only in the database
and the loader did not know the cert. The checklist was correct and was not
followed. Writing a row by hand is faster; adding it to the loader is what
makes it survive.

*Written 26 July 2026, from what AIHR-I needed after verify-cert went green.*
