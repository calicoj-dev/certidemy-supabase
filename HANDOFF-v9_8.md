# HANDOFF v9.8 — SM-AI-II has a bank

**Date:** 2026-09-11
**Covers:** everything after `HANDOFF-v9_7.md`
**Repos:** `supabase` (this one) and `../certidemy-web`

**The one-line state:** `SM-AI-II` went from nine authored lessons and zero items to
**44 lessons loaded, 2,376 items across two pools and three languages, and `verify-cert`
at 46 pass / 5 fail / 2 warn.** Generation is finished. What remains is publication
paperwork and a panel of human beings.

---

## 1. WHAT `verify-cert --cert SM-AI-II` SAYS NOW

```
46 pass · 5 fail · 2 warn · 3 skip
```

**The five failures, and only one is new work rather than paperwork:**

| Failure | What it needs |
|---|---|
| `items.vocabulary` | **2 secure items use `self-organiz*`, one of them keyed.** New check, see §7 |
| `catalogue.claim` | Catalogue card copy, three languages |
| `catalogue.description` | Long-form description, three languages |
| `jta.translated` | `gen-jta-translations.mjs` — 5 domains × 44 tasks × 2 languages |
| `samples.public` | Six public samples across six distinct tasks, three languages |

**Two warnings, both declared in `SCHEME` §12:** `trilingual.lessons` (44 groups, English
only) and `items.variantstems` (1 stem with two variants, legitimate — the assembler
serves one per form).

**Three skips:** `grounding` (permanent for a Scrum cert), `i18n.approved` (no
translations yet), `credential.achievement` (not required while `draft`).

---

## 2. THE CONTENT: 44 LESSONS, LOADED AND WIRED

**Module 5 completed the corpus** — `05-smii-ai-work-system`, nine lessons, and with it
all 44. Full-module validation found and fixed a **key-versus-distractor collision**:
`04-05 q1.a` was keyed on a sentence that `05-07 q2.d` used as a distractor, ten words
identical. A candidate who learned the sentence in one module would have been punished for
it in the other. Worse than the distractor-to-distractor duplication fixed in `04-07`.

**Loading is TWO scripts and the ingest path is neither of them.** `scripts/ingest/plan.ts`
line 201 says so in its own words — *"lessons handled in a later iteration."* `content:apply`
would have reported success and written no lesson.

```
scripts/load-lessons-direct.mjs --in <dir> --lang en   ->  lessons          (44 rows)
scripts/wire-lessons.mjs                                ->  lesson_concepts  (132)
                                                            lesson_tasks     (44)
```

**Skipping the second is a documented recurring failure** — `wire-lessons`'s own docblock
records that SM-AI-I shipped with six unprojected lessons and SPO-AI-I with all of them.

> **ORDER IS LOAD → WIRE → PRACTICE → SECURE, and it is not a preference.**
> `coverage.tested` counts concepts reached through `question_concepts`, and only the
> PRACTICE pool writes those. Generating practice before the lessons load flips
> `untaught_testing_violations` from 0 to 131 — the one §10 check that is about ISO/IEC
> 17024 rather than about the product. **It held: the counter is still 0.**

`coverage.taught` went 0/131 → **131/131**. Five invariants saw this content for the first
time and all five passed: `lesson.closers`, `widget.dragmatch` (14 widgets, all strictly
1:1), `encoding`, `lesson.widgetshape`, `lesson.spansresolve`. Every one had previously
been checked only by scratch scripts that did not survive the session that wrote them.

---

## 3. THE BODY OF KNOWLEDGE, AND THE NUMBER IT IS BUILT ON

**`jta/SM-AI-II_BoK_v2.0.md` exists.** Eleven sections against `jta/ISMS-IA_BoK_v1.md`.
`v1.1` was cited as signed 2026-09-02, was never committed, and is recorded unrecoverable;
**this document does not continue its lineage** and its provenance banner names, section by
section, what each was reconstructed from.

**§7 is the only section with no surviving source, and it is the document's thesis.**

> **A Bloom profile cannot falsify the Level II claim.** It shows the tasks are demanding,
> not that they are a different job — `SM-AI-I` declares Analyze on 11.49% of its weight,
> so a scheme could clear a cognitive kill switch while being `SM-AI-I` with longer stems.
> **The test that can is whether the Guide's own text determines the keys**, which is
> `SCHEME` §5.2's Screen 1(b) counted rather than asserted.

Measured 2026-09-10 against `reference/scrum-guide-2020.txt`:

```
              3_apply   4_analyze   total
  Guide-determined   7        6       13
  Guide-bounded      5       18       23
  no Guide anchor    4        4        8
                    16       28       44
```

**31 of 44 — 70% — have a key the Guide does not determine.** The standing invariant is a
majority: if Guide-determined tasks ever exceed half, the scheme has drifted into Level I
with longer stems. **Measured 29.5%, strictest reading 36.4%, bar 50%.**

**§4 is the longest section and that is structural** — with one normative source,
attribution is the entire risk surface. It transcribes all 35 never-assert entries plus
**22 task-scoped never-key directives the lessons wrote themselves**, 15 of them as an
explicit *what can be keyed / what cannot* pair.

**§3 is three paragraphs**, because there is one source and listing coaching literature
nobody read would be the dressing the exercise exists to avoid.

---

## 4. MIGRATIONS 289, 290, 291 — ALL RUN CLEAN

**289 — who is accountable for the Increment.** Five sites said the Developers are. The
Guide gives the Increment to the whole team and the Developers a different verb:
*committed to creating any aspect of a usable Increment*. Their own always-accountable list
is four items with the Increment not among them. **The fifth site was in D2 while the recon
was reading D5** — the second time in two migrations that a guard scoped wider than the
edit caught something.

**290 — the last Stage 9 blocker cleared**, and the guard that fired on its own correction.
See §5 and §9.

**291 — the never-assert count, in the sixth place it was written.** 26 → 35. The count had
six homes: `SCHEME` §8.2, `JTA` §7.1, `BoK` §4.1 and §9, `HANDOFF-v9_7` twice, and the
stored `grounding_note`. The five in git moved in one commit; this one needed SQL.

> **The migration tip was stale a third time.** It read *"285 / next free 286"* while 286
> through 289 were all on disk — **four behind, the largest gap yet.** Recorded in
> `CLAUDE.md`, with the observation that **the tip has never once been correct when a later
> session needed it.** Treat the line as the date of its last edit, never as the number.

---

## 5. THE GENERATION PATH: TWO DEFECTS FIXED BEFORE A SINGLE ITEM EXISTED

**`profileFor()` took a name and no tier**, so `SM-AI-II` matched `/\bscrum\b/` and
inherited `SM-AI-I`'s Level I difficulty profile. It now **resolves tier FIRST, before any
name match**, returning a new `PROFESSIONAL_L2`. A tier branch inside the scrum test would
have re-encoded the defect for ISMS-IA and AIMS-IA.

> **What the defect could NOT do, measured rather than repeated.** `difficultyLineFor` was
> the module's only live consumer; it reaches a prompt only through `bloomDirective`, which
> returns it **only when a task declares no `bloom_level`**. All 509 tasks across 13
> certifications declare one. **No emitted prompt changed.** It was a trapdoor that fires
> silently exactly when a task has already lost its declared level.

**And a gap nothing had named: `isL2` is tier 2 AND `4_analyze`**, so SM-AI-II's 16
apply-level tasks fell to the Level I branch, where the draft prompt offers `true_false`.
**`verify-cert` invariant 19 fails the WHOLE secure bank on one two-option row**, and
nothing would have surfaced it until 1,056 rows existed. The option floor is now a **tier**
property, enforced in the draft prompt, the critique prompt and `validateEnglish`.

**Two dead call sites deleted rather than threaded** — `gen-cert-secure`'s `bloomFor`
wrapper and `verify-cert`'s assigned-and-never-read `profile`. A dead wrapper beside a
comment describing the live path is how the next reader concludes it IS the live path.

**`verify-profile.mjs` asserts the tier-1 strings BYTE-IDENTICAL**, not `.includes()` on a
fragment — a check confirming only that SM-AI-II moved passes cleanly on a change that
moved SM-AI-I too, and four shipped banks have to reproduce that text on a top-up.

---

## 6. `SCRUM_GUIDE_FACTS`: 26 → 35, AND TWO OF THE ORIGINALS WERE WRONG

**The audit against migrations 285–289 found more than gaps.**

```
N4   asserted "The Developers are accountable for the Increment"
     - the exact claim migration 289 retired from five JTA sites hours earlier.
     A dry run on task 5.3 KEYED IT. The item writer was doing what it was told.

N11  asserted "Nobody assigns work" AND gave self-management to the Developers.
     Both wrong, both retired by 285. The Guide states no prohibition, and gives
     the provision to the SCRUM TEAM.

N19  carried the same phantom prohibition and dropped the "the Product Owner may
     influence" half of the sizing sentence.
```

**Nine entries added**, one per correction with no cover: the Increment pair (both
directions, per the paired-error rule), shorter-Sprints-not-the-Sprint, the 2017
*"best achieve goals and missions"* criterion, should-versus-must across multiple teams,
*"should avoid limiting it to a presentation"* hardened into *"is not"*, the subject and
modal on low transparency, the empirical-approach quotation, and the container claim.

> **N1–N22 are the misconceptions the field holds. These nine are the ones this credential
> made** — each reached the JTA and was retired by a migration, and the list was written
> before all of them. **A never-assert list assembled from general knowledge catches
> everyone's errors and not the scheme's own**, and the scheme's own are the ones its bank
> reproduces, because they are already in the task text the generator is handed.

**The paired-error rule is now a rule** (`BoK` §4.0) rather than a sentence inside derived
entry D3: *a prohibition that forbids only the permissive error teaches the restrictive
one*, and the restrictive one is harder to catch because it sounds cautious.

---

## 7. THE N22 EXPERIMENT — PRE-REGISTERED, AND IT FAILED

**The hypothesis was written into the code before the result existed** (`bc12564`): if the
leak drops, never-assert entries are tunable by naming the surface they apply to; if it
leaks anyway at roughly 0.9%, the finding is about the mechanism rather than the phrasing.

```
practice, before the patch    4 real in 440 = 0.91%    all in explanations
secure,   after  the patch    3 real in 352 = 0.85%    ONE OF THEM IN A KEY
```

**Within noise on the rate and worse on placement.** The keyed one is task 2.8 — *"available
**self-organized** learning, making it a **self-management** failure this Sprint"* — which
uses the retired term and the current one in the same sentence, as the answer.

> **So the second branch is what happened, and it is the more useful one.** A prohibition
> the model reads in BOTH the draft and the critique prompt and still violates at a stable
> rate is not failing because it was imprecise. **Naming the surface did not help, so
> rewording the other thirty-four would not either.** These entries are not a dial.

**The effort went into a gate instead.** `verify-cert` invariant 21, `items.vocabulary`:

- **`self-organiz*` → FAIL on secure, WARN on practice.** No innocent sense in a Scrum
  item; the 2020 edition says SELF-MANAGING.
- **`ceremony/ceremonies` → WARN everywhere.** Measured to be ordinary English as often as
  not: *"a commitment ceremony"* in reported speech, *"an approval ceremony"*, *"a
  retirement ceremony"*, *"ceremonial compliance"*. Gating on it would fail correct items.

**N22 is the ONLY entry a lexical check can gate**, and that is the argument for gating it
alone: vocabulary rather than a claim, so no polarity problem and no clause-boundary
problem — the two causes of `audit-grounding-compliance.mjs`'s 92% first-run
false-positive rate.

### It does not only catch the new bank

```
SM-AI-I    10 secure items use self-organiz*   (and 13 use ceremony)
SPO-AI-I    2 secure items
SD-AI-I     1 en + 1 es-419
SM-AI-II    2 secure items, one keyed
```

**SM-AI-I carries five times SM-AI-II's count on a live credential.** `verify-cert --all`
goes from 5 failing certs to 6 — SD-AI-I and SM-AI-I gain a failure, SPO-AI-I gains its
first. **These are real defects in shipped banks, not a moved goalpost**, and none was ever
checked because the check did not exist.

> **The check could not see explanations until the commit that shipped it.** `verify-cert`'s
> questions query never selected the `explanation` column, so the first run found 1 where
> the database holds 2 — blind to the surface where six of seven leaks were. One word in a
> select list, and it would have shipped a gate that passed the thing it was written to
> catch.

---

## 8. THE BANKS

```
practice   1,320 rows   440 logical items   floor 10/task/lang   v4-smaiii
secure     1,056 rows   352 logical items   floor  8/task/lang   v4-smaiii-sec
           2,376 rows   792 groups          132/132 slots at floor in both pools
```

**Practice: one invocation, 5h 38m, zero stalls.** 18 drops in 458 drafted — **3.9%**.
**Secure: two invocations, 2.8%.** Task 5.4 finished invocation 1 one item short after
burning three rounds; **invocation 2 filled it in one round with zero drops.** The stall
was variance, not a wall — and one invocation would have shipped a bank one item short.

**`LEN_SPREAD_MAX` rejected nothing in 819 drafts.** Four key-length drops, three of them
bound by the absolute 25-character margin rather than the 15% term, two missing by three
characters and one. **No case for a blueprint migration, and the evidence points the other
way.**

> **Length drops cluster on apply tasks: 12 of 13 across both runs.** The option COUNT is
> now a tier property; the option LENGTH ceiling is still governed by `isL2`, so a tier-2
> apply task must fit four options inside the **Level I 25-word ceiling** while an analyze
> task gets 45. **Not changed** — it is the same shape as the `item-profile` defect and
> deserves a deliberate decision, not a reflex.

---

## 9. WHAT THIS SESSION KEPT GETTING WRONG

**Five guards aborted before writing, and every one was the guard's fault.** Recorded in
`CLAUDE.md` beside the existing *"guards match code shapes, never English words"* rule,
which is now extended: **the prose a guard checks can quote the thing it forbids.**

Migration 290's guard 1 searched the whole stored note for `STILL BLOCKING` — which the new
note deliberately **quotes**, in order to say what it corrected. **The note was right and
the guard was wrong**, and deleting the quotation to satisfy the check would have been the
check editing the content. Rewritten positionally. **Guard 3 then caught itself the same
way, inside the fix for guard 1.**

> **The tell is uniform: every one searched for a STRING when the property was a PLACE.**

**Six line-ending failures.** `verify-cert.mjs` and `item-grounding.mjs` are CRLF; their
siblings are LF. Module 3's eight lessons are CRLF; the other 36 are LF — **and that one
produced a plausible wrong answer rather than an abort**, reporting 24 concepts as untaught
when the true number is zero. The real loaders handle CRLF correctly; only the measurement
script did not.

**And a number reported wrong twice**: the 44 lessons declare **563** minutes, not 564 —
module 1 is 114, not 115.

---

## 10. WHAT REMAINS

### The four §12 items — mechanical, a session each

| Item | Tool |
|---|---|
| Catalogue claim, 3 languages | `load-cert-i18n.mjs` in `../certidemy-web` |
| Long-form description, 3 languages | `load-cert-descriptions.mjs` |
| JTA translations | `gen-jta-translations.mjs` — 5 domains × 44 tasks × 2 langs |
| Six public samples | Six per language across six distinct tasks; `visibility = 'public'` |

**Plus the vocabulary failure**: two secure items to reword, one of them a key.

### The Angoff panel — the real gate, and it is recruiting

**Eight judges, ~7 hours each, ≈56 judge-hours** for a 50-item form. `SCHEME` §7.1 is the
brief and is **complete** — stage 1 is done, and this is the only scheme in the catalogue
that can say so.

> **The panel rates ITEMS, and the exam is assembled PER CANDIDATE.** Rating 50 gives a
> defensible cut for one form. For a 352-item bank: rate the whole bank (~5 days per
> judge, unrealistic), publish one fixed form (cheapest, fully defensible, loses exposure
> control), or rate an anchor set and equate later — **which is stage 3 and needs candidate
> data.** Route two is the only one that closes without candidates, and it is a scheme
> decision, not a study-design detail.

`ASSESSMENT-ENGINE.md` line 462 already binds it: **SMEs must judge the items that will
actually ship**, so the panel cannot precede the bank and any regenerated item loses its
rating.

### Two decisions left open, with the data attached

**1. The tier-blind 50% bar in `cue.length`.** Every Level II secure bank sits 45–50;
every Level I below 41. All three pass by single-digit margins on a number hardcoded for
one-right-three-wrong while `cue_tolerance` IS tier-aware. **`SCHEME` §8.1 carries the full
catalogue table and the four things a deliberate bar would need.** Not changed: **a
threshold set from three banks is as inherited as one set from none**, and the blueprint's
`measured_over` stays NULL until someone argues for a number.

**2. The 25-word option ceiling on tier-2 apply tasks.** 12 of 13 length drops landed
there. Same shape as the `item-profile` defect, one layer along.

### Longer-standing, unchanged

`content:validate` reaches 2 of 12 certs · SM-AI-I `02-03` misattributes self-management ·
SM-AI-I's `06-ai-augmented-teams` lessons carry other modules' `module_slug` · AIMS-F
`01-05` `minimum_correct` · AIE-I's 15 ungrouped es-419 practice items · module 1's
answer-position sweep (23 of 48 `b` keys, χ² 52.56).

---

## 11. THE HONEST POSITION

**Generation is done and it was never the blocker.** `SM-AI-II` has more evidence behind it
than any credential in the catalogue: a source held as a hashed file, a body of knowledge
that measures its own premise, a never-assert list audited against four migrations and
tested against output, and two banks built under a declared tolerance with every drop
accounted for.

**None of that is validation.** `item-pipeline.mjs` states the ceiling in its own docblock:
*professionally drafted, internally reviewed, cue-neutral DRAFT items — not a human SME
panel and not real item statistics.* The 70% figure in `BoK` §7 establishes that the scheme
exercises judgment rather than lookup; **it says nothing about whether the judgment is
right.** That is what the panel is for, and it is why the panel must be independent of the
person who wrote the keys.

*End of HANDOFF v9.8.*
