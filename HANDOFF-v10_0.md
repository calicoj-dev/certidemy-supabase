# HANDOFF v10.0 — 2026-09-12

**A new document rather than a v9.9 addendum.** v9.9 closed on SM-AI-II going
live and named three things as open. This session did different work, at a
different layer, and most of it is about *how the numbers became trustworthy*
rather than what the numbers are. That reads better cold as its own document.

49 commits. Migrations 298 through 302. Two repos.

---

## 1. THE STATE

### What is true now

**Every certification is fully trilingual on lessons and on module headings.**

| | en | es-419 | pt-BR |
|---|---|---|---|
| lessons | 12 of 12 certs | 12 of 12 | 12 of 12 |
| module headings | 12 of 12 | 12 of 12 | 12 of 12 |

AIMS-IA was the last gap: tier 2, `available`, 40 English lessons and **zero**
translations. A Spanish or Portuguese candidate could buy it and find nothing to
study. It now has 80 translated lessons, loaded and verified.

**Module headings are reviewed, not merely present.** 116 rows, all
`review_status = 'approved'`, read by a human against a generated document.
Before this session **three** certifications had approved module headings and 46
rows had been provisional and unread since 2026-07-27.

**Every Scrum secure and practice bank is clean or adjudicated.** SPO-AI-I,
SM-AI-I, SD-AI-I and SM-AI-II carry no unflagged prior-edition vocabulary. 82
rows carry `retired_vocabulary_intent = 'quoted'` — 27 groups of three, **plus
one ungrouped row**, each with a written reason in the commit that set it. That
odd row is not a rounding detail; it is the inert adjudication in §7.

**verify-cert runs identically from any working directory**, and its baseline in
CLAUDE.md has been re-measured: 53–57 checks per certification, 4 certifications
with failures, replacing a table dated 2026-08-25 that said 43–44 checks and one
failure.

### What that does NOT cover — read this before quoting the above

- **The pass mark is still adopted by citation.** No standard-setting panel has
  run on any certification. The mark is defensible by reference, not by a
  procedure this platform performed.
- **No candidate has sat SM-AI-II.** It went live in v9.9's session. The
  assembler has still never run against a real seat on it.
- **"Nothing queued for review" is NOT true**, and I will not write it. Two
  queues remain open:
  - `task_translations`: **2 rows** (SD-AI-I, one per language) unreviewed since
    2026-07-22. Small, real, untouched by this session.
  - `analysis_findings`: **94 flagged, 0 reviewed** — deliberately left, see §7.
  What closed is the *module translation* queue specifically.
- **Module headings approved does not mean module headings audited.** A reviewer
  compared each to its English. Nothing checked them against the lessons
  beneath them, which is how the SM-AI-I title defect survived until a human
  read the title and description side by side.

---

## 2. THE PATTERN DEFECTS

**A defect in the instrument is invisible to the instrument.** Every one below
was found by measuring a second way. **Not one was found by running the same
check again more carefully**, and that instinct is the one to distrust: a re-read
performed with the instrument under suspicion inherits its blind spot and returns
the same answer with more confidence.

`READ-FAILURE-AUDIT.md` §7b now carries six rules, each with the instance that
bought it. This section is the session's own contribution to that list.

### Four on one check, in one evening

The AIMS-IA translation check — 80 files, three parts, ~1,494 assertions — was
run five times. **Every failure reported on a first run was a defect in the
check. Not one was a defect in the content.**

| # | the defect | it reported | what was true |
|---|---|---|---|
| 1 | patterns required the SINGULAR adjacent phrase | 20 failures | the text says `auditorías internas`, `acciones correctivas` — plural, and correct |
| 2 | `/internal audit/i` matched the prefix of `internal AUDITOR` | 2 failures | `auditor interno` is a PERSON, correctly rendered, not the process term |
| 3 | pt-BR pluralises `informação` as `informaçÕES`, not `informação`+`es` | 1 failure | the file uses the correct plural **nine times** |
| 4 | `\m` / `\M` — **Postgres** word-boundary operators — inside a **JavaScript** regex | **374/374, clean** | in JS `\m` is a literal `m`. The guard searched for `mcláusulaM`, could never match, and **six real violations passed under it** |

### The two that are worse, because both reported a number

**A guard that could not fire.** Defect 4 above. It sat beside a Scrum-leakage
assertion using `\b` that *did* work, inside a block returning a plausible
`374/374`. The first three cried wolf — loud, annoying, self-correcting, because
a false failure gets read. The fourth was silent and reported the corpus clean.

> **A guard with no recorded hit is unverified, not clean.** A forbidden-term
> assertion that has never fired on 28,000 rows and 80 fresh translations has not
> been shown to be strict.

**A rule that could not load.** The `accountable` / `responsable` false-friend
entry was added after a reviewer found AIGRM-I's module title collapsing the
distinction. The repair ran an hour later and **the title collapsed again,
identically**. The cause was one word on the dry run's first line:

```
AIGRM-I/ai-lifecycle-accountable-deployment title es-419   contract: general
```

`AIGRM-I` is not in `CERT_DOMAIN`, so it resolved to `general`, which carried no
vocabulary block — and the entry lived inside the ISO block. It was unreachable
for the one certification whose entire subject is that distinction. The
certification most likely to need it was the one least likely to get it, because
"governance" does not look like an ISO management-system cert when you are
writing a domain map.

> **Anything selecting a contract, prompt, profile or ruleset by key must PRINT
> THE KEY IT RESOLVED.** A tool that silently falls back to a default is
> indistinguishable from a tool whose rules are being ignored, and those two have
> opposite fixes. Without that printed line the evidence read as "the model
> ignored the rule twice", the fix would have been to re-word the entry, and the
> re-worded entry would have been just as unreachable.

These are twins: a guard that cannot fire reports a number; a rule that cannot
load reports a model failure.

### The defence, and it was the same one every time

**READ THE OUTPUT, NOT THE COUNT.** Defects 1–3 came from reading the failing
passages. Defect 4 came from reading the per-term table, where `clause` showed a
competing rendering in three files while the guard beside it said clean — **two
numbers disagreed and one of them was a lie.** And the repair of defect 4's
fallout was caught the same way: the dry run printed **`La apartado 3.5`**.
`cláusula` is feminine, `apartado` masculine, so the article and the relative
pronoun had to move with the noun. **A count would have read 6 replacements and
been satisfied.**

### A related result worth acting on

In the same run, the twelve ISO terms given as a **table with per-term counts**
were honoured **374/374** in both languages, while the `clause` rule sitting as a
**prose bullet in the same prompt** was ignored six times across two files.

The confound is recorded rather than hidden: those twelve terms were *also*
already in the prose list, so they were stated twice and `clause` once. It is not
a clean table-versus-prose experiment. The competing reading — that `cláusula` is
simply the strongest cognate attractor — predicts the same action, which is what
makes it usable: **give a new rule the table treatment and carry the evidence,
and when a rule is violated anyway, MEASURE whether it is fixed rather than
re-wording it and assuming.**

---

## 3. THE WRONG-LANGUAGE WRITE

`retranslate-module-rejection.mjs` wrote **fluent Spanish into a pt-BR row**:

```
EN        Serving the Product Owner and the organization without taking their jobs.
written   Servir al Product Owner y a la organización sin asumir sus trabajos.
```

It did this **twice in a row on the same input**, and it reached the database.

### The prompt finding

The system prompt opened with *"You translate … into Brazilian Portuguese"*, then
interpolated a contract block quoting Spanish and Portuguese side by side for
roughly a hundred lines, then stopped. The target language was stated once,
furthest from the point of generation, and **the bilingual block won on
recency.** Moving the target language to the END of the prompt fixed it first
try. The contract was not changed.

> **State the target nearest the generation, not only at the top.** Every block
> in `item-translation.mjs` has this shape, because all three are bilingual by
> construction — they teach a distinction by showing both languages, which is
> exactly what makes them compete with the instruction saying which language to
> produce.

Recorded directly above `contractForDomain`, where a prompt author lands.

### The guard-design finding — the transferable half

**Every post-condition passed the Spanish output.** Not identical to the rejected
text. Not the English. Not quoted. Not multi-line.

Each of those asks *did the model change the text* — and a guard set built around
that question **has no concept of "changed it into the wrong thing"**. The output
was a correct, fluent, non-identical translation of the right source. It was
simply not the artifact that was asked for.

> **When output is GENERATED rather than TRANSFORMED, at least one post-condition
> must assert what the artifact IS, not merely that it moved.**

The script now carries a wrong-language guard, behaviour-tested in both
directions on six cases including the exact row it broke.

---

## 4. MIGRATIONS 298–302

All five ran clean. All five are committed with their verification.

| # | what | the thing it caught |
|---|---|---|
| **298** | `quiz_questions.retired_vocabulary_intent` (`none` / `quoted`) | an item may QUOTE a retired term to test recognition; nothing could say so, so every future run reported them as defects forever |
| **299** | `create_practice_questions` requires `question_group_id` | the RPC raised on a null `task_id` and accepted a null group **silently** — the asymmetry was the guard nobody wrote |
| **300** | `quiz_questions.item_origin` (`authored` / `generated` / `translated`) | nothing recorded whether an item was written for the bank or generated one language at a time |
| **301** | thread `item_origin` through the RPC | the RPC's INSERT has a **fixed column list** — a caller adding the field got no error and the row took the default. Stamping from the function alone would have looked done and written the wrong value forever |
| **302** | `module_translations.review_status` | 295 gave the other two translation tables a three-state column and left this one with a boolean, so a rejection could not be recorded |

**299 and 302 each found a database writer no application grep sees**, which is
why 298's writer-list discipline was applied to all of them:

- **302:** `invalidate_module_translations()` on `modules` set `is_provisional`
  and nothing else. After the column existed and before that function was
  updated, an English edit would leave `is_provisional = true` beside
  `review_status = 'approved'` — the exact disagreement 295 forbids, arriving
  through a trigger instead of a script. Fixed in the same paste, and since
  exercised for real.
- **301:** confirmed against `prosrc` before writing, not assumed.

**Order mattered and reversed between them.** 299 required the function deployed
FIRST (the guard would otherwise kill practice generation for every learner).
301 required the migration FIRST (it is backward-compatible; deploying first
means rows written in the gap carry the wrong provenance silently). Both
orderings are in the files.

---

## 5. THE WORK, BY THREAD

### The Spanish 404, and the lesson vocabulary gate

Switching an SM-AI-II lesson to Spanish 404'd. Two separate problems: a missing
fallback in `loadLesson`, and 44 untranslated lessons on a live certification.
Both fixed. `trilingual.lessons` became status-aware — a missing translation on
an `available` certification now FAILS rather than warns.

### Retired vocabulary across four Scrum certifications

Secure and practice pools, both measurements at delta 0 at every step.

- **SPO-AI-I** — 34 practice groups, all ordinary reference, **zero** flags, all
  fixed. The 66 translation rows were **regenerated from the corrected English**
  rather than patched, so the three language rows stay translations of one item.
- **SM-AI-I** — almost entirely translation lag. The English was **already
  correct in all fourteen affected groups**; every defect was in the
  translations. An English-first read reports that certification clean forever.
- **SD-AI-I** — 11 of 20 practice groups legitimate, including two quoting the
  **Agile Manifesto** verbatim. One defect existed only in Spanish.
- **SM-AI-II** — clean.

**Four English rows were damaged by EARLIER sweeps**, found by a grammar census
rather than by the vocabulary check that had certified those banks:

```
SM-AI-I  ef512cb8  "the Developers presents completed work and receives"
SPO-AI-I 48cee239  "the Developers owns acceptance criteria phrasing"   SECURE
SPO-AI-I 062d39d5  "The Developers selects how much work to pull"       SECURE
SM-AI-I  4875d8cb  "Developers self-manage and self-manage"
```

Two were in secure banks the vocabulary check had just passed — **and the check
was right. The vocabulary WAS clean.** No vocabulary pattern can see grammar.
`verify-cert` invariant 26 `items.agreement` now covers it: WARN only, English
only, never auto-fixing, scoped to two shapes with evidence. A third shape
(`the Scrum Team` + singular verb) was measured and **rejected** — 26 hits, every
one correct, because *"What should the Scrum Team do?"* is an auxiliary carrying
no number.

### The AIE-I writer hunt

CLAUDE.md said 15 ungrouped items, Spanish-only, from 20–21 August. Both halves
were wrong: **120 ungrouped rows, 90 of them English, the most recent written the
day before it was measured.**

Found by fingerprint, not inference: every ungrouped row carries the RPC's forced
signature and the language counts are 90/30/0, which no fan-out produces. The
writer is `generate-practice-questions` → `create_practice_questions`.

**The trigger is not a button.** It is the quiz mode picker's third mode —
*"Weak concepts" / "Conceptos débiles" / "Conceitos fracos"* — which generates
five questions and then opens a session on them. Three quizzes produced nothing
and a fourth produced five, because `quiz_sessions.kind` records `'practice'` for
both Practice and Weak concepts.

A null group is **excluded rather than flagged** by five group-keyed tools
(`trilingual.items`, the vocabulary exemption, the re-translator, the de-biaser,
the sample publisher). 120 ungrouped rows were 120 rows that five tools stepped
over. The 120 existing rows were deliberately **not** backfilled — that would
hide the size of what happened.

### AIMS-IA, and the contract question that gated it

Before translating 40 lessons: does the Scrum contract apply to an ISO 42001
certification? **No** — and applying it was measured as *inert rather than
harmful*, because the retired-term rules scope themselves in their own text and
the model honoured the parenthetical. An earlier count suggested corruption and
was a false lead.

What AIMS-IA needed was a **harvested** ISO contract: twelve terms, every
rendering counted across the three ISO certifications already translated, over
111 lesson groups. Two were not unanimous and the reasoning is recorded in the
block. `roles` was pinned to pt-BR `papéis` against a near-even corpus split
(24/23), narrowing to two lessons that actually disagree.

Both `translate-lessons.mjs` and `gen-module-translations.mjs` were
parameterised — neither hardcodes a framework now, and an unlisted certification
gets **no** contract rather than the wrong one.

### The module translation queue

86 provisional rows, 46 of them unread since 27 July. A cross-certification
review document was generated: 58 modules × 2 fields = 116 blocks, 232 marks.

**It covered 116 rows, not 86.** Filtering on `is_provisional` would have hidden
30 rows behind a migration's convenience — migration 153 flipped them for being
live and said in the same breath *"it is not a claim that a reviewer signed them
off."*

Review returned **227 approve, 5 reject**, and three source findings. The five
were repaired and re-read. The queue closed at 116 approved.

**The generator had been syntactically invalid since `b957b7c`** — `node --check`
fails on HEAD, a double-quoted string spanning three lines. Bisected: the commit
that *added* the `[r]` mark broke the tool that emits it, and nothing noticed
because no document was regenerated afterwards.

### The analysis findings

Scoped, not worked. **94 rows are 48 distinct judgements**, from two pasted
documents, one operator, two days, nine runs at `engine_version 0.1.0`, no CRM
linkage anywhere. **Zero of 510 findings have ever been reviewed**, so there is
no precedent for what reviewing one means. Nothing was marked reviewed —
recording a human judgement nobody made is the thing every flag this session
built exists to prevent.

---

## 6. CORRECTIONS I MADE TO MY OWN CLAIMS

A handoff that records only what went right teaches nobody how the numbers became
trustworthy.

**Annex B.** I was asked to check a suspected scheme defect: AIMS-F's module
description says *"the normative status of Annex B"*, and Annex B is guidance.
**The premise was wrong and the content was right.** In ISO/IEC 42001:2023 Annex
B **is normative** — unlike ISO/IEC 27001, where implementation guidance is a
separate standard carrying no normative status. Lessons `04-01` and `04-06`
already build a teaching point on it. Recorded in `SCHEME-AIMS-F.md` §6 as the
misreading a 27001 background produces, because the next auditor will make it.

**The module row count.** I reported 40 provisional rows from that evening's work
and was asked if there were more. There were **86** — 46 predating it by six
weeks. Tonight's work did not create that backlog, it doubled it.

**`quiz_sessions.kind`.** I wrote, and committed, that it records `'practice'`
for all three quiz modes. It records **four distinct values** and `review` has
always been distinguishable; the collapse is two of three. I read it off one
session pair instead of off the column's vocabulary, when `select distinct kind`
or the comment at `sessions.ts:202` would have caught it. Corrected in 299's note
and in a commit that names the original.

**The practice-pool prediction.** SD-AI-I's secure pool was 100% legitimate and I
was asked to expect its practice pool to follow. It did not: 9 of 20 groups were
real defects. Reported as a finding rather than smoothed over.

**`backfill-practice.mjs`.** I asserted in a draft migration header that it
neither inserts nor calls the RPC, contradicting 298's note. Both halves were
wrong and **298 was right**. The cause: I trusted a single grep whose result set
was silently short, and read the slower second grep — which disagreed — as a
notification rather than as evidence. Caught only because the editor-first rule
kept that migration out of git.

**"Nothing queued for review."** Corrected in §1 of this document. Two queues
remain open.

---

## 7. OPEN ITEMS

| item | what it actually needs |
|---|---|
| **`true_false` option floor** | One of five generated SM-AI-II practice questions is a `true_false` with **2 options**, on a tier-2 `available` certification whose Level II contract is four defensible options. `validateQuestion` accepts `options.length >= 2` and **reads no tier**; the tier contract lives in `gen-cert-secure.mjs` and nothing shares it. `items.optionfloor` FAILS secure and only WARNS practice, so it landed as a warning on a cert that already had warnings. **Cheap half:** teach `validateQuestion` the tier. **Real half:** the `pending_review` gate in `CERTIDEMY-LEARNER-IA.md` §5.5. Recorded in CLAUDE.md and the function header. |
| **es-419 matcher gap** | The analyzer cannot compare Spanish source against an English blueprint, so Spanish prospect analysis is **suppressed rather than answered** — on a platform selling into LatAm, where every certification now ships es-419 content. The engine is behaving correctly; migration 223 holds the measurement (8.9% reported against a hand score of 35%). Needs a multilingual matcher declaring es-419/en support, or translated concept names. Neither is scheduled. |
| **SM-AI-I's 20 ungrouped items** | Now load-bearing: one of them holds a `retired_vocabulary_intent = 'quoted'` adjudication that is **stored and inert**, because the exemption is read per group and that row has no group. Do **not** make the exemption row-keyed — the group key is what stops a re-translated sibling losing an exemption its siblings keep. Fix the grouping and the flag becomes live. |
| **AIMS-F `02-04`** | pt-BR renders the clause-5.3 heading as *"Funções, responsabilidades e autoridades"* where the pin is `papéis`. **One lesson, one pass.** Recorded rather than swept, because a sweep is the larger risk. |
| **AIE-I's ungrouped writer** | Fixed going forward (299 + the function deploy). The **120 existing rows** are untouched by design. Whether to group them is a content decision. |
| **`task_translations`** | 2 rows, SD-AI-I, unreviewed since 2026-07-22. `gen-translation-review-doc.mjs` already covers this table. |
| **`analysis_findings`** | 94 flagged, 0 reviewed. Scoped as shakedown residue in the analyzer header. Nothing to do unless the analyzer is picked up again. |
| **Polish** | Accent notes from the module review; `SGSIA` vs `AIMS` inconsistency in Spanish module descriptions; pt-BR `Responsabilidades de Scrum` where `do Scrum` is more idiomatic. |
| **Carried from v9.9** | The pass mark is adopted by citation, no panel has run, and the assembler has never run against a real SM-AI-II seat. |

---

## 8. IF YOU READ ONE THING

The four pattern defects, the guard that could not fire, and the rule that could
not load are the same shape, and this session found all six of them the same way:
**two measurements disagreed, and the disagreement was the signal.**

Where they agreed, the number was real. Where they differed, the difference named
the bug — usually in the instrument, not in the content. The count that looked
clean was the one to distrust, every time.
