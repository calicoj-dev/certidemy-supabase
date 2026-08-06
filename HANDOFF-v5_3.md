# HANDOFF v5.3 — ISMS-F content build

**Session date:** 2026-08-04 → 05
**Covers:** all 49 lessons in three languages, both item banks, the scheme
document, the 17024 edition pin, and four style-guide sections that exist
because something went wrong first
**Migration tip:** 173 · **next free 174** — this session ran no migrations
**Repos:** both clean and pushed
**`verify-cert --strict`:** 28 pass · 1 fail · 0 warn

Supersedes nothing. Read v5.2 and its addendum first; this is the next chapter.

---

## 1. WHERE ISMS-F STANDS

| | |
|---|---|
| UUID | `0bb3878a-fb89-455d-a84c-bdb9a26b1643` |
| Status | `coming_soon` |
| Structure | 5 domains · 49 tasks · 191 concepts · 194 concept links · 49 task links |
| Lessons | **49 × 3 languages = 147 rows**, loaded and wired |
| Secure bank | **1,176** (392 × 3) · firewall clean · cue-neutral |
| Practice bank | **1,470** (490 × 3) · concept-linked |
| Coverage | **191/191 taught · 191/191 tested · 0 untaught-testing violations** |
| Scheme doc | `SCHEME-ISMS-F.md` v1.0 |
| Publish checklist | `certification_i18n` 3 rows ✓ · public samples 6/lang ✓ |

### The one failure, and it is the honest one

**108 blueprint translation rows are `is_provisional = true` and have not been
independently reviewed.** 10 domain rows + 98 task statements, es-419 and pt-BR.

They were approved once during this session, in error — `load-jta-i18n.mjs
--approve` prints *"APPROVED - Grok has signed off"* and no review had happened.
**Two of the rows were wrong** (§4.3). They were set back to provisional.

`verify-cert` fails on this and only this. That is correct: a candidate must not
sit an examination whose published blueprint has not been read in their language.

### Also unreviewed, and NOTHING TRACKS IT

The three `certification_i18n` rows written this session — claim and description
in en / es-419 / pt-BR — are **assistant translations that no one has reviewed.**
`certification_i18n` has **no `is_provisional` column**, so nothing flags them and
`verify-cert` cannot. They are candidate-facing on the certification page.

**Add them to the same review packet.** This is the only place that fact is
recorded.

---

## 2. WHAT SHIPPED

### Content

**49 English lessons**, 760 minutes, every task owned once and every concept
covered exactly once. Module durations sum exactly to each module's
`estimated_minutes` (110 / 140 / 170 / 200 / 140).

**98 translations** via `translate-lessons.mjs`, validated by graft — frontmatter
frozen, checkpoint and widget JSON structurally identical, glossary slugs
byte-identical.

**Both item banks generated to floor.** Secure at 8/task/lang, practice at
10/task/lang, both complete across all 49 tasks in all three languages.

### Commits — `certidemy-web`

| commit | what |
|---|---|
| `1d3d63e` | modules 1–2, 16 lessons |
| `3e8fbfc` | module 3, 11 lessons |
| `5b03cef` | module 4, 13 lessons |
| `9845d20` | American spelling, 852 replacements across all 49 |
| `f8b8048` | 98 lesson translations |
| `aa799bf` | pt-BR reference-controls word order |
| `cd8e23a` | 17024:2026 pin, 12 web surfaces |
| `dd9d5ba` | `ai-security` into sitemap `PROGRAM_SLUGS` |

### Commits — `supabase`

| commit | what |
|---|---|
| `a7be87c` | `STYLE-GUIDE-ISMS-F.md` v1.0 |
| `7c83afc` | spelling patch script |
| `0840d53` | Rule 17 + glossary freeze in the translator; style guide v1.1 |
| `28d89bc` | reference-controls fix in the Rule 17 glossary |
| `316d1db` | 17024:2026 pin, 23 render-asset surfaces |
| `c1c183a` | `SCHEME-ISMS-F.md` v1.0 |

---

## 3. THE STYLE GUIDE IS THE MAIN ARTEFACT

`STYLE-GUIDE-ISMS-F.md` reached v1.1 with eleven sections. **Four of them exist
because something was wrong first**, and that is the point: the guide was derived
from what the build actually hit, not guessed in advance.

### §1 — explain, never define

Module 1 shipped its first draft with **five near-verbatim ISO definitions**,
including `a measure that modifies risk` word for word. `BOK-ISMS-F` §6 requires
teaching in Certidemy's own words; **a definition is normative text**, and short
definitions are *more* exposed than paraphrased clauses because they are
recognisable on sight.

The external review did not catch them. It asked for **tighter** alignment with
ISO's wording.

The rule fired again at module 3 — `terms of reference against which the
significance of a risk is judged` — caught by the guard before the module left the
sandbox. **The pull toward reciting is strong enough that the guard runs on every
module, not only when something feels wrong.**

### §2 — `Clause` in English, and only in English

Module 1 shipped with `Sections 4 to 10` — the Portuguese rendering imported into
English. The review praised it as correct.

Rule 17 is a *translation* rule: English keeps `clause`, es-419 splits
`capítulo`/`apartado`, pt-BR uses `Seção`. The renderings must never leak back.

### §6 — American spelling, reversed by evidence

§6 first said British, reasoning that ISO's own English is British. That ignored
seven shipped certs. Counting en-language items settled it:

**348 American to 14 British**, the British hits incidental. ISMS-F was the
outlier, and it was the cheaper direction — 49 files against 5,548 items.

Corrected by `scripts/patch-isms-f-spelling.ps1`: **852 replacements, 605
insertions and 605 deletions**, no structural drift, 49/49 checkpoints and widgets
still parsing.

### §11 — read the first generated batch before scaling it

**This rule paid for itself twice on the day it was written.**

The spelling defect was caught by running `gen-cert-secure.mjs` with
`MAX_TASKS=1` and reading eight items. Had the full pass run first, the fix would
have been ~2,600 items rather than 49 files.

The Rule 17 gap in the translator was caught by translating **one lesson** and
grepping it. Had the 98-file run gone first, `cláusula` would have been in every
Spanish and Portuguese lesson — and re-translation is a re-roll, not a patch.

---

## 4. FINDINGS

### 4.1 The item pipeline has no spelling instruction

`item-pipeline.mjs` contains no locale or dialect rule, so both generators default
to American. That is why the catalog is American and why ISMS-F's British lessons
were the collision.

**Any future cert that sets a different dialect for its prose has this waiting,
silently, until the first generated item is read.** Recorded in style guide §4.

### 4.2 A glossary block is a force multiplier in both directions

Rule 17 was added to `translate-lessons.mjs` mid-session because that script had
never been told about ISO terminology — the earlier work went into
`gen-jta-translations.mjs` only. Different script, different system prompt.

The block I wrote contained one wrong line:

```
reference controls is controles de referencia / referência de controles
```

Spanish right, Portuguese **inverted** — `referência de controles` reads as *the
reference number of controls*. It propagated to **2 JTA task statements and 4
lesson files, 9 occurrences**, before anyone read it.

Worst instance, 04-01 pt-BR: *"O Anexo A agrupa 93 referência de controles em
quatro temas"*, which is not Portuguese.

**Corollary:** 03-05 was deliberately NOT corrected in either language. Its English
reads *"whose annex is a control reference"* — a reference **of** controls — which
`referencia de controles` renders correctly. A blind fix would have broken two
correct translations.

### 4.3 The blueprint translations had two real defects

Both found by reading the CSV, both invisible to any structural check:

| Task | Was | Should be |
|---|---|---|
| 3.6 pt-BR | `um conjunto de referência de controles` | `controles de referência` |
| 4.1 pt-BR | `o número de referência de controles` | `controles de referência` |

**A Portuguese reader spots these instantly.** They were approved anyway, because
the approve ran before the review.

Everything else in the 108 read correctly, including the parts most at risk:
`capítulo 4` / `Seção 4` at 2.2, `apartado 9.1` at 5.1, and the full ISO 31000
triplet at 3.1 — *"proceso de evaluación del riesgo: identificación, análisis del
riesgo y valoración del riesgo"*, which most Spanish 27001 material still gets
wrong.

### 4.4 The translator adds glossary markers the English does not have

Six files failed validation because the model added `[term]{glossary=...}` for
concepts glossed **elsewhere in the course** — `interested-parties`,
`nonconformity`, `corrective-action`, `risk-treatment`.

An added slug would link a lesson to a concept the JTA never assigned it, silently
corrupting the coverage matrix. **The validate-by-graft design caught all six and
skipped the files rather than writing bad rows.**

Fixed by freezing glossary markup **in both directions** in the system prompt. That
is now in `translate-lessons.mjs` and every future cert inherits it.

### 4.5 The 17024 sweep found the pin had never left its own document

`CLAIMS-POLICY.md` §4 was pinned to `:2026` earlier in the week. **Nothing else
was.** Every claim surface still carried the bare reference:

- **35 file occurrences** across `factsheet.ts`, `enginebrief.ts`, `objections.ts`,
  `whatis.ts`, `content.ts`, `route.ts`, `load-cert-descriptions.mjs`,
  `library-flow.tsx`
- **8 database rows** — AIGRM-I and AISM-I descriptions, base + 3 langs

All pinned and deployed. `factsheet.ts` carried the Class A formulation verbatim
without the edition, which was the sharpest instance.

**Teaching content deliberately NOT pinned.** ISMS-F 05-06 and AIE-I 03-05/03-06
explain what 17024 **is** — edition-independent. Pinning teaching content dates it
for nothing.

### 4.6 The failure mode of a residual sweep

**Three sweeps this session flagged their own correct output**: `fulfil` matching
`fulfill`, an ASCII check firing on intentional em-dashes, and a
reference-controls sweep counting its own deliberate exclusions.

The cause is consistent: **the detector was written from the defect rather than
from the post-fix state.** A sweep has to describe what the file should look like
afterwards.

### 4.7 Transient `fetch failed` is frequent, and idempotency absorbed it

Roughly a dozen drops across the session, sometimes cascading through an entire
pass. Every generator and the translator top up rather than restart, so a re-run
picks up only what failed.

The secure bank took **four passes**; practice took **four**; es-419 took **five**;
pt-BR took **six**. All reached completion with no manual reconciliation.

**Lower `--concurrency` did not obviously help.** The translator failed at 4 and at
2 at similar rates.

### 4.8 A green build proves nothing about whether your edit landed

The 17024 patch was dry-run, then built and deployed **without ever being
applied**. Both succeeded. Nothing had changed.

Same lesson as the `landed=True` marker convention: the guard is the patch
script's own verify block, which is why every script here prints one.

---

## 5. GOTCHAS WORTH KEEPING

**`load-lessons-direct.mjs` computes `lesson_group_id`** as `uuidV5(lesson_id,
CERT_ID)`, overwriting frontmatter. That is the mechanism by which translations
join their English sibling's group automatically — and why **no re-wire is needed
after loading a translation.**

**`wire-lessons.mjs` line 79 defaults `CERT_ID` to SM-AI-I.** Same silent-fallback
pattern removed from the generators. It echoes `cert=` in its header; read it.

**`lessons` has no `certification_id`.** Join through `modules`.

**`tasks` and `task_translations` both have `statement`.** Qualify it inside
`replace()` or the UPDATE is ambiguous.

**`certifications` has `category_slug`, not `family_slug`.** `certification_i18n`
uses `lang`, not `language`, and `claim`, not `claims`.

**PowerShell hashtable keys are case-insensitive.** `'Organisation'` and
`'organisation'` collide and the literal will not parse. Use an ordered array for
case-sensitive replacement pairs.

**`verify-cert` still does not check `ksa_is_provisional`** and no script flips it.
Gap 2.1 and 2.2 from the v5.2 addendum, **both still open.**

---

## 6. NEXT SESSION

### Blocking publication

1. **Independent review of the 108 blueprint rows**, plus the 3
   `certification_i18n` rows nothing tracks. Pull the CSV from the SQL editor, not
   the console. Send §6 of the v5.2 addendum — the three intentional patterns —
   and add a fourth: the 98 lesson translations use the same vocabulary, so a term
   flagged in the JTA is in ~49 lessons.
2. **Then** `node scripts/load-jta-i18n.mjs --cert ISMS-F --approve` — note it
   lives in **certidemy-web**, not supabase. Flips statements and domains only.
3. Re-run `verify-cert --strict`. Expect 29 pass, 0 fail.

### Also open

4. **`ksa_is_provisional`** — find how v4.2 flipped 604 rows, then patch
   `verify-cert` to check it. Catalog-wide.
5. **The seven `SCHEME-*.md` documents** still carry bare `17024`, ~4 each. Each
   also needs its wording checked against `CLAIMS-POLICY` §5 rather than a blanket
   replace.
6. **Formulation drift.** AIGRM-I's descriptions say `built to` / `construida` /
   `referencial` where §4 specifies `Designed to` / `Diseñada conforme al marco` /
   `Projetada conforme a estrutura`. **Needs a ruling**: does "exact formulation
   only" govern a phrase embedded mid-paragraph, or only the standalone claim?
7. **`/certifications/family/[slug]` has no sitemap entries at all.** The route
   exists; nothing submits it. Catalog-wide, not ISMS-F.
8. **AI-in-certification policy + candidate disclosure** — 17024:2026 clause 6.5.
   `SCHEME-ISMS-F.md` §11 names it as an open item and claims no conformity.

### Beyond

`ISMS-LI` (Level II) remains blocked on `item-pipeline-l2.mjs`. Reading the
pipeline this session confirmed why: **line 155 requires "exactly ONE defensibly
correct answer"** and line 316's normaliser explicitly refuses to weaken
distractors. An L2 item needs several defensible answers with one best — the
critique stage would tighten every L2 item into an L1 item and report success. It
is a real fork, not a parameter.

---

## 7. THE HONEST SUMMARY

ISMS-F is complete to the line that can be crossed without a human reviewer. The
teaching layer, both item banks, the coverage proof, the firewall, the bias
measurements, the scheme document and the publish checklist are all done and all
verifiable by query.

What is left needs a person who reads Spanish and Portuguese. **That is the correct
place to stop**, and `verify-cert` says so in the one failure it reports.

Two of the 108 rows were wrong. They were approved anyway, by a script that printed
that a review had happened. **The check exists because the check is needed.**
