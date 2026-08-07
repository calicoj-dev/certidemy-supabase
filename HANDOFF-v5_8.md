# HANDOFF-v5.8 — AIMS-F published, and nine live certifications

**Session date:** 2026-08-07
**Reads with:** `HANDOFF-v5_7.md` and its addendum. This closes them.
**Migration tip:** **181 applied** · next free **182**
**Repos:** both clean and pushed

AIMS-F went from an English-only lesson set to a published, trilingual, badged
certification. Along the way two translators independently invented a term that
does not exist, a live cert was found to have shipped without its badge, and a
new cert nearly shipped without the one field a 17024 credential cannot omit.

---

## 0. THE CATALOGUE

**Nine certifications, all `available`.**

| family | cert | name |
|---|---|---|
| ai-security | ISMS-F | ISO/IEC 27001:2022 Foundation - AI |
| ai-workplace | AIHR-I, AIE-I | |
| governance-service-management | AIGRM-I, AISM-I, **AIMS-F** | **ISO/IEC 42001:2023 Foundation** |
| scrum | SM-AI-I, SPO-AI-I, SD-AI-I | |

**AIMS-F final state**

| | |
|---|---|
| Lessons | **105** — 35 each in en / es-419 / pt-BR |
| Coverage | **154 / 154 taught**, `untaught_testing_violations = 0` |
| Items | **1,890** — secure 8/task/lang, practice 10/task/lang, firewall **0** |
| JTA i18n | 10 domain + 70 task rows, **`is_provisional = false`** |
| cert i18n | claim + description, all three languages |
| Badge | shipped, 501x501, inlined into `badges.ts` |
| Cognitive profile | remember none · understand 46.93 · apply 41.26 · analyze 11.80 |

---

## 1. SGSIA — A TERM THAT DOES NOT EXIST

Two translators, two prompts, **one shared ancestor rule**, and the same invented
acronym 67 times in the lessons and 30-odd times in the task statements.

### The mechanism

`gen-jta-translations.mjs` carried a Rule 17 fixed rendering:

> `ISMS is SGSI in both.`

Correct for ISMS-F. With no equivalent rule for the AI management system, both
models extended it by analogy to `SGSIA`, then drifted to `SGSI de IA` — which
reads as *information security management system of AI*.

**The letters give it away.** `SGSI` = *Sistema de Gestión de **Seguridad** de la
Información*. The middle `S` is *seguridad*. `SGSIA` is `SGSI` plus a letter, not
an acronym derived from *sistema de gestión de IA* — which yields `SGIA`.

### What the market uses (verified 2026-08-07)

| form | who |
|---|---|
| *sistema de gestión de IA*, spelled out | BSI, DEKRA, and the UNE adoption |
| **SGIA** | Bureau Veritas, iso.cat |
| **AIMS**, kept in English | Intertek, G-CERTI |
| **SGSIA** | **nobody** |

The Spanish adoption is **UNE-ISO/IEC 42001**, titled *Tecnología de la
información — Inteligencia artificial — Sistema de gestión*.

**Ruling: spell it out.** `SGIA` is defensible but minority usage, and a learner
meeting an acronym in a task statement and never in a lesson cannot resolve it.

### Where it hurt

- **Task 3.7, pt-BR:** *"um SGSI existente se aplicam a um SGSI de IA"* — the task
  whose entire point is distinguishing the two, giving both the same name.
- **Lesson 05-02 es-419, the KEY of checkpoint q1** — the correct answer to a
  question about internal audit, naming the wrong management system.

### Fixed

`f5cd8c4` JTA prompt + re-run · `cf73b93` lesson prompt · `6b93649` 15 files
re-translated · `3e5d70a` 6 files where SGSI named the wrong system ·
`e65a2d4` the targeted repair script

**Ten `SGSI` references survive and all are correct** — `02-04`, `03-06`,
`03-07`, `04-07`, `05-06`, both languages, each genuinely about the ISMS.

### The generalisable finding

> **A fixed-rendering rule for one standard becomes a template the model extends
> to standards it has no rule for.**

Every future standards-based cert inherits that `SGSI` line. **Write its
terminology rule before the first translation run.** Here it cost a full
re-translation of 21 files; written first it costs nothing.

---

## 2. TWO THINGS THAT NEARLY SHIPPED

**ISMS-F went `available` on 2026-08-06 with no badge**, and nobody noticed for
two days. `credential-og` rendered its OG cards without one.

`cert-inventory.mjs` had `gen-badges-module.mjs` flagged as a gap the entire
time. **The tool worked. Nothing forced a decision on what it found.** Fixed in
`da48cfd` / `3905228` — nine badges now inlined, function redeployed.

> **Run `cert-inventory.mjs` as a publish gate, not as a diagnostic.** A gap it
> reports before a status flip should require an answer, not a note.

**AIMS-F had a NULL English claim.** `certification_i18n.claim` was populated for
es-419 and pt-BR — `load-cert-i18n.mjs` writes those two — but English claims
come from migration 113's lineage and AIMS-F was never added. The claim is the
17024 competence statement, the sentence the credential asserts.

Caught by a query run for an unrelated reason. Fixed in migration `180`.

> **`load-cert-i18n.mjs` does not write English.** Any new cert needs its English
> claim added separately. This is now the second time a loader's language scope
> has caused a silent gap (v5.6 addendum §1 was the first).

---

## 3. EDITION YEARS IN THE NAMES

`ISO/IEC 27001 Foundation` and `ISO/IEC 42001 Foundation` did not say which
edition. Migration `180` corrected both:

- **ISO/IEC 27001:2022 Foundation - AI**
- **ISO/IEC 42001:2023 Foundation**

The badge artwork already carried the years; the database was catching up.

**`jta_versions.blueprint_snapshot` deliberately still holds the old names.** It
records what was true when v2.0 was projected, and `exam_attempts.jta_version_id`
points at it for traceability. The product name is not part of what a candidate
was assessed on. **Do not rewrite snapshots to match a later rename.**

Note also: the badge renders `FOUNDATION -AI` for layout; the database keeps
`Foundation - AI`. Artwork and data need to agree on substance, not typography.

---

## 4. THE PUBLISH DECISION

Migration `181` did two things in one transaction, in this order for a reason.

**80 JTA translation rows flipped to `is_provisional = false`.** That flag is an
**attestation**, not a formatting switch. `render-asset` filters on it and the
flag is row-level, so a provisional domain row drops out completely — the
Spanish and Portuguese blueprint sheets fall back to the **English** title *and*
description. A Spanish-speaking buyer downloading the blueprint would get a
half-English document. **That is why the flag was flipped before the status, not
after.** The ten domain rows were read in full first.

**Then `status = available`.**

**Cache caveat, checked rather than assumed.** `gen-jta-translations.mjs` lines
46-48 warn that neither PDF's cache key includes a domain stamp, so flipping the
flag will not refresh an already-generated sheet. `asset_downloads` held **zero**
rows for AIMS-F, so there was nothing to invalidate. **This does not generalise
— a cert with existing assets needs `render-asset` fixed first.**

`ksa_is_provisional` is a separate column, not rendered on the blueprint, and
still has no approval path. Untouched.

---

## 5. WHAT THE TRANSLATOR GETS RIGHT

The acronym failure is not representative, and the machinery deserves its record.

**Rule 17 without being told.** `01-04` es-419 came back with `capítulo` 24
times, `apartado` 8, `cláusula` **zero** — the convention ISMS-F established,
reached independently. pt-BR used `Seções` correctly throughout.

**The validator earned its place.** `translate-lessons.mjs` validates output
against the English source and refuses to write on mismatch. It caught a
duplicated glossary marker in `05-03` es-419 and **refused seven consecutive
times**; that file was hand-written instead. Without the check, a lesson with
broken glossary rendering would have shipped silently in Spanish.

**Prose quality is good.** *"Las partes familiares no son donde debe concentrarse
tu atención"* is written Spanish, not translated English.

---

## 6. COMMITS

| commit | what |
|---|---|
| `f5cd8c4` | JTA translator terminology rule |
| `cf73b93` | lesson translator, same rule |
| `6b93649` | 15 lesson files re-translated |
| `3e5d70a` | 6 files, SGSI naming the wrong system |
| `e65a2d4` | `fix-lesson-sgsi-drift.ps1` |
| `e4722d1` | 70 translated lesson files committed |
| `8f6f310` | migration 180 — edition years, English claim |
| `da48cfd` | badge PNGs + CODES entries |
| `3905228` | `badges.ts` regenerated, nine badges |
| `779517f` | migration 181 — publish |

Migrations **178** `jta_versions` · **179** `cert_inventory()` · **180** names and
claim · **181** publish.

---

## 7. OPEN

### AIMS-F, non-blocking

1. **Register drift.** `01-04` es-419 uses informal *tú*; `05-02` uses formal
   *usted*. ISMS-F is informal. Nothing wrong per lesson; inconsistent across the
   set. **Add a register line to both translator prompts** once confirmed.
2. **The ISO/IEC 42006 claim.** A task 5.5 secure item asserts 42006 *"is a
   distinct standard, not a sector extension of ISO/IEC 17021-1."* Nobody has read
   42006. ISO/IEC 27006 supplements 17021-1 for 27001; if 42006 follows suit the
   explanation is wrong and its own distractor is closer to true.
3. **1,890 items, ~16 read.** Sample per domain, plus an attribution sweep for
   `42001 requires` / `the standard requires` across all explanations.
4. **A rendered read**, three languages. Glossary markup, six widget types. First
   cert authored since the v5.5 renderer fix, and both of those defects were found
   by a person opening the course.
5. **Task 4.1's critic disagreed** with the ten-objectives finding twice. The
   critic is wrong — A.6.1 and A.6.2 each carry an objective. Expect pushback from
   anything trained on the common summary; **do not let it be "corrected" back.**
6. **No credential exists yet for either Foundation cert**, so the badge render
   is untested. It will be exercised on first issuance.

### Carried

7. The ISMS-F attribution audit — the rule prevents new defects, it does not
   repair ~2,646 existing items.
8. `ksa_is_provisional` has no approval path.
9. Five `SCHEME-*.md` carry bare `17024`.
10. `render-asset` cache key needs a domain stamp before any cert with existing
    assets flips its provisional flag.
11. Everything in v5.4 §8.

---

## 8. THE LESSON

v5.7 said the instrument producing confident prose was the one that could be
wrong, and the one computing an answer was the one that could not.

This session found the boundary of that. **Two translators, two prompts, one
shared ancestor rule — and both produced the same invented term.** No sweep would
have caught it, because a sweep must already know the term is wrong. Nothing in
the pipeline knew.

What caught it was reading the output and asking a question no check can ask:
*is this a real word?* Then searching. One query settled a publishing decision.

And the two near-misses point the same way. The badge gap and the null English
claim were both **visible to a tool that was working correctly** — `cert-inventory`
had flagged the badge for days — and both survived because seeing a gap and
deciding about it are different acts.

> **A derived inventory tells you what is missing. It cannot make you care.**
> Wire it into the gate, not the dashboard.
