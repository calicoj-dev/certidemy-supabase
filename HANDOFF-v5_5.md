# HANDOFF v5.5 — reading ISMS-F against the actual standard

**Session date:** 2026-08-06
**Supersedes:** nothing. Read v5.3, its addendum, and v5.4 first. This runs in
parallel with v5.4 and touches different surfaces.
**Migration tip:** **175 applied** · next free **176**
**Repos:** both clean and pushed
**`verify-cert --strict`:** **29 pass · 0 fail · 0 warn** · 192 concepts

The session began with one question — *does ISMS-F actually hold up against
ISO/IEC 27001?* — asked with the standard attached. It does, mostly. Three things
did not, and chasing the third surfaced a fourth that is bigger than all of them.

---

## 0. WHAT TO DO FIRST

**AIMS-F is being built right now, and it is standards-based.** `16f1d7f` locked
its Stage 1; `610665b` set its body of knowledge on ISO/IEC 42001. That makes §2
of this document immediately actionable rather than theoretical.

> **Put the attribution rule into `item-pipeline.mjs` before AIMS-F generates a
> single item.** ISMS-F cost a full session to audit retroactively. AIMS-F can
> have the rule in place before its bank exists.

**`iso42001.pdf` is in the project files.** The source check that was done
retroactively for ISMS-F — and found three defects in a cert passing 29
invariants — can be done during authoring for AIMS-F, at a fraction of the cost.

### Resolved before this document shipped

**Two sessions claimed migration 174 on the same day.** `174_marketing_integrations`
(the advertising session, documented as 174 in v5.4) and this session's
`jta_versions` backfill. This one moved to **175** — renaming the other would have
made a written handoff wrong. Both were already applied; the rename was file
naming only.

**Nothing prevents this recurring.** The tip lives in a handoff document, which is
a record of a moment — exactly the failure mode v5.4 §6 wrote up. Worth checking
whether an applied-migrations table exists that could be queried instead:

```sql
select table_schema, table_name from information_schema.tables
where table_name ilike '%migration%';
```

**One inconsistency left deliberately.** The two `jta_versions` rows this
migration created carry `"generated_by": "migration 174 - projected from live
rows"` in their snapshot JSON. It is a provenance string on a published record,
and rewriting a snapshot to fix a filename is worse than the mismatch.

---

## 1. THE ISO CHECK — three findings, all closed

ISO/IEC 27001:2022 was read against ISMS-F clause by clause. Most of the cert
verified cleanly, including the parts most likely to be wrong:

- **Clauses 4 to 10 cannot be excluded** — the standard's own wording
- **Annex A control counts.** Counted from the standard: Organizational 37,
  People 8, Physical 14, Technological 34 = 93. Lesson 4.1's claims that
  Organizational is largest and People smallest are both correct
- **Lesson 3.6** is confirmed by the standard's own NOTE 1 and NOTE 3 to 6.1.3 —
  Annex A is a check that nothing was overlooked, not a source to copy from
- **Lesson 3.5's four SoA elements**, **3.7's two approvals**, **5.3's management
  review inputs**, **5.4's corrective action steps** all match the text exactly

### Finding 1 — the amendment says **climate change**, not "environmental"

Amendment 1:2024 adds to 4.1 that the organization shall determine whether
**climate change** is a relevant issue. ISMS-F said *environmental conditions*
throughout — a specific named requirement hedged into a general one.

Fixed across: concept slug `environmental-conditions-relevance` →
`climate-change-relevance`, both concept descriptions, the JTA statement in three
languages, lesson 02-03 rewritten and re-translated, and **task 2.3's 54 items
deleted and regenerated**.

**Why regenerate rather than string-swap:** the distractors were built around the
wrong concept. Zero attempts existed, so the RESTRICT FK did not block and
nothing was lost.

Landed **inside JTA v2.0 as an erratum, not a version bump** — no candidate was
ever assessed against the wrong term.

### Finding 2 — the own-work rule was attributed to the standard

Lesson 05-02 said *"the standard states the consequence plainly: auditors shall
not audit their own work."* Clause 9.2.2 b) says only: *select auditors and
conduct audits that ensure objectivity and the impartiality of the audit
process.* The own-work rule is ISO 19011 guidance and the canonical way to fail
that requirement — but the standard does not contain it.

Reworded in three places. **Task 5.2's `skills` field was also the problem**: it
read *"why an auditor may not audit their own work"*, and the generator read that
as licence to assert it as a requirement.

**Three regeneration attempts before one came back clean.** The model's prior
about ISO auditing is strong enough to reassert the claim even from corrected
source fields. That is the seam Finding 4 sits in.

### Finding 3 — clause 6.3 was untaught

**6.3 Planning of changes** is a real numbered requirement, and it is **missing
from the standard's own table of contents**, which skips 6.2 to 7. That is how it
was missed, and the lesson now teaches it.

Added as a **concept on task 2.9**, not a new task. A new task would have meant
50 tasks, a re-derived blueprint, a new lesson, and stale counts in
`SCHEME-ISMS-F.md`, the JTA and the `jta_versions` snapshot — for one sentence.
As a concept the blueprint does not move.

Concepts **191 → 192**, task links **194 → 195**, blueprint unchanged.

---

## 2. FINDING 4 — THE ATTRIBUTION PROBLEM (open, and the real one)

Chasing Finding 2 turned up a wider pattern. A sweep for *"the standard requires
X"* across ISMS-F returned ~250 rows. **Most are correct** — "clause 4.3 requires
the scope to be documented", "requires the risk owner to approve the treatment
plan" — those are real requirements accurately stated.

**Some are not.** Confirmed against the PDF:

| Item | Claim | Reality |
|---|---|---|
| `1f0cf2a3` | "ISO 27001 requires the risk register to be a living document" | **The standard never mentions a risk register.** Practice vocabulary |
| `216bc40d`, `cd2053f4` | "ISO/IEC 27001 certificates are valid for three years" | True as market practice; 27001 says nothing about certificate validity. That is ISO/IEC 17021-1 |

**Root cause:** `scripts/lib/item-pipeline.mjs` has **no attribution rule at
all** — grep for `standard|ISO|attribut|verbatim|quote` returns three unrelated
comments. The generator asserts requirements from its own training knowledge of
ISO practice, and nothing checks the attribution.

**`verify-cert` cannot catch this.** It checks structure, coverage, bias,
firewall, Bloom. **Not whether a factual claim is true.** All 29 invariants held
throughout every one of these findings.

### What the next session should do

1. **Add an attribution rule to `item-pipeline.mjs`.** Roughly: *state what the
   standard requires only where it is a requirement in the text; where a
   widely-taught rule is an implication rather than the text, attribute it to
   practice.* Without this every standards-based cert regenerates the defect, and
   **ISMS-LI inherits it on day one.**
2. **Audit the claims.** 2,646 items is too many to read whole, but the sweep
   narrows it: search for `requires|exige|shall` near `27001|the standard` and
   read the assertions. Most will be fine. The ones that are not follow a
   pattern — practice vocabulary (risk register, three-year validity, maturity
   levels) presented as normative text.
3. **This is a human check, like the translation review.** Budget it as its own
   session with the PDF open.

---

## 3. FOUR GAPS FOUND ALONG THE WAY

### 3.1 `jta_versions` — ISMS-F and AIHR-I had no row

Migration 106 standardized the six certs that existed in July. **AIHR-I and
ISMS-F were built afterwards and had no row**, so `exam_attempts.jta_version_id`
had nothing to point at. The column is nullable so no attempt failed — the
attempt simply lost its link back to the scheme version it was taken under, which
is the traceability record 17024 asks for.

Migration **175** fills both, projection lifted verbatim from 106. Deliberately does **not** regenerate the six existing snapshots.

All eight now hold one `v2.0 / published` row. ISMS-F: 5 domains, 49 tasks, 191
concepts *(snapshot taken before 6.3 was added — it says 191, live is now 192)*.

### 3.2 The markdown renderer dropped nested directives — **catalogue-wide**

`**[term]{glossary="slug"}**` rendered as raw text. The inline tokenizer pushed
bold and italic as **flat strings** and the renderer printed them verbatim, so
nothing nested inside `**…**` was ever tokenized.

**70 English occurrences across four certs** — isms-f 50, aihr-i 12, sd-ai-i 5,
spo-i 3 — plus translations, roughly **210 content rows**. Four separate authoring
sessions produced the pattern independently and `LESSON_AUTHORING_SPEC` does not
forbid it, which is the case for fixing the renderer, not the content.

Fixed in `components/lessons/markdown.tsx`: bold and italic now carry
`children: InlineToken[]` and the render switch maps recursively. Recursion is
bounded — `indexOf` finds the *first* closing delimiter, so an inner slice can
never contain another. **Also fixes links, inline code and citations nested in
bold.**

**Found by a person clicking through the Spanish course.** No check catches this.

### 3.3 ISMS-F had zero `module_translations`

Every other cert had full coverage. The Spanish and Portuguese module lists
rendered in English while the lessons around them were translated.
`v_module_i18n_coverage` exists specifically to expose this and is never
consulted.

Ten rows written. `load-module-i18n.mjs` is a **hardcoded backfill for four
specific certs**, not a reusable tool — a new cert needs its rows written
directly, with `$$`-quoted strings so apostrophes cannot terminate a literal.

### 3.4 ISMS-F was missing from `load-cert-i18n.mjs`

Its claims were written by direct SQL and never added to the loader's `CLAIMS`
object, so the rows existed only in the database. Running the loader would have
skipped ISMS-F while rewriting the other seven.

**`CERT-PUBLISH-CHECKLIST.md` §6 step 4 already said to do this.** It was not
followed. The checklist was right.

---

## 4. `CERT-PUBLISH-CHECKLIST.md` v2

Four corrections, all from publishing ISMS-F:

- **§1** — the `description` note said NULL until a long-form pass. All 24 rows
  across 8 certs are populated and have been for a while
- **New §3** — `module_translations`, with `v_module_i18n_coverage` as the check
- **§5** — two more proposed invariants. One is the coverage view. The other
  **cannot be a database check at all**: does the cert appear in the `CLAIMS`
  object in `load-cert-i18n.mjs`? A row written by hand and never added to its
  loader survives until someone runs the loader
- **§6 step 8** — **open the course in es-419 and pt-BR and read a module list and
  a lesson.** Steps 4–7 are all catalogue surfaces. Nothing in the checklist
  looked inside the course, which is where both of this session's UI defects hid

---

## 5. THE PACK-BLOCK RULE, LEARNED TWICE MORE

> **Never run `load-jta-i18n.mjs --approve` without first checking the pack block
> for the rows you just corrected.**

It happened again with the climate-change fix: SQL corrected the row, `--approve`
ran, and the loader **upserted the stale pack-block text back over it and
reported success**. `verify-cert` then said `ALL INVARIANTS HOLD` while the
corrected row was gone.

**Repair order is: block first, then database, then re-run the loader and confirm
the value survives the round trip.** That last step is the actual proof.

This is the failure v2.9 measured. A full pack block does not prevent staleness —
it only makes staleness fixable.

---

## 6. TOOLING NOTES

**`Unblock-File` belongs in the landing sequence.** A downloaded `.ps1` carried
Mark-of-the-Web and was refused by execution policy. Every prior script in the
session ran fine, so this surfaces intermittently.

**Dash types break anchors.** Two anchor failures this session: em-dash vs
hyphen, then en-dash vs em-dash. **Build anchors from a codepoint dump**, not from
terminal output:

```powershell
($line.ToCharArray() | ForEach-Object {
  if ([int]$_ -lt 128) { $_ } else { "<U+{0:X4}>" -f [int]$_ }
}) -join ''
```

**Escaped quotes in `git commit -m` break the message.** `\"` terminated the
string and git treated the remainder as pathspecs — nothing was committed and the
push reported *Everything up-to-date*. **No double quotes or backslashes in `-m`.**

**Residual sweeps flag their own deliberate exclusions.** Third and fourth
instances this session. A sweep must describe the **post-fix state**, not the
defect.

**`certifications` has `category_slug`, not `family_slug`.**
**`certification_i18n` uses `lang` and `claim`, not `language` and `claims`.**
**`tasks` and `task_translations` both have `statement`** — qualify it inside
`replace()` or the UPDATE is ambiguous.

---

## 7. COMMITS

### `certidemy-web`

| commit | what |
|---|---|
| `309e944` | markdown: bold and italic re-tokenize their contents |
| `5fd3845` | ISMS-F added to the catalogue claim loader |
| `d0fb4da` | Amendment 1:2024 says climate change |
| `7564c11` | 05-02 no longer attributes the own-work rule to the standard |
| `9f6bbe9` | teach clause 6.3, planning of changes |

### `supabase`

| commit | what |
|---|---|
| `8ab1062` | `jta_versions` rows for AIHR-I and ISMS-F |
| `918c575` | publish checklist v2 |
| `40c3ce7` | markdown nested-inline patch script |
| `1c4a2c3` | renumber that migration 174 → 175 after the collision |

---

## 8. OPEN LOOPS

### New from this session

1. **The attribution audit + `item-pipeline.mjs` rule** — §2. The largest
   outstanding correctness item, and it blocks ISMS-LI cleanly rather than
   messily: build the rule before the cert, not after.
2. **A queryable migration tip.** Two sessions collided on 174 today because the
   tip lives in prose. §0 has the query to check whether a table exists that
   could replace it.
3. **The `jta_versions` snapshot for ISMS-F says 191 concepts; live is 192.** A
   snapshot is a record of its moment, so this may be correct as-is. Decide
   whether to regenerate.

### Carried

4. `ksa_is_provisional` has no approval path and `verify-cert` does not check it.
   **This session gave it teeth**: task 5.2's `skills` phrasing propagated a false
   attribution into generated exam items. K/S/A fields are generator input, and
   98 rows are unreviewed.
5. Seven `SCHEME-*.md` still carry bare `17024`. ISMS-F's is the only pinned one.
6. Formulation drift (also v5.4 §8.8) — needs a ruling.
7. Clause 6.5 AI-in-certification policy and candidate disclosure.
8. Everything in v5.4 §8, which is a different surface and unaffected by this
   session.

---

## 9. FOR AIMS-F, SPECIFICALLY

AIMS-F is ISO/IEC 42001 Foundation and is at Stage 1. Everything below is cheaper
now than it will be at any later point.

**1. The attribution rule goes in first.** §2. Before item generation, not after.
This is the one that compounds.

**2. Read the standard alongside the JTA, not after the build.** ISMS-F's three
findings were all the same shape: *something true and well taught, attributed to
text that does not say it.* The teaching was right every time; the citation was
not. A PDF open in another window during authoring would have caught all three.

**3. Watch the same three traps ISMS-F hit.**

| Trap | ISMS-F instance | 42001 equivalent to watch |
|---|---|---|
| A named requirement hedged into a general one | "environmental conditions" for **climate change** | 42001 has its own precisely-named requirements; use their words |
| Practice guidance attributed to the standard | the own-work audit rule (ISO 19011, not 27001) | AI-governance practice literature is large and 42001 is small |
| A clause absent from the table of contents | **6.3 Planning of changes** | check 42001's body against its own contents page |

**4. K/S/A fields are generator input.** Task 5.2's `skills` phrasing propagated a
false attribution into exam items. Whatever goes in those fields is what the
generator asserts. `ksa_is_provisional` still has no approval path.

**5. Its `jta_versions` row will not exist.** Migration 106 covered six certs;
175 covered two more. AIMS-F is the ninth and needs its own — same projection,
same shape. **Add it to `CERT-PUBLISH-CHECKLIST.md` as a step while it is fresh.**

---

## 10. THE GENERAL LESSON

`verify-cert` held at **29 pass, 0 fail** through every single finding in this
document. It checks structure, coverage, cue neutrality, firewall isolation, and
Bloom alignment. **It does not check whether a claim is true.**

Both of the UI defects — the renderer and the missing module translations — were
found by a person opening the Spanish course and looking. Both of the worst
content defects were found by reading the standard.

That is not an argument against the invariants. They caught real problems all
session and they are why the structural claims can be made at all. It is an
argument that **the class of error they cannot see is exactly the class that
matters most for a credential whose whole premise is that competence is declared,
taught, and measured against a published source a candidate can go and read.**
