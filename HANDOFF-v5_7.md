# HANDOFF-v5.7 — AIMS-F, body of knowledge to a complete item bank

**Session:** 2026-08-06 into 2026-08-07
**Reads with:** `HANDOFF-v5_6.md` and its addendum. This continues them.
**Migration tip:** **179 applied** · next free **180**
**Repos:** both clean and pushed

AIMS-F went from nothing to a certifiable body of work in one session: signed BoK,
reviewed JTA, seeded scaffold, 35 lessons, and 1,890 items in three languages.
Along the way the attribution rule from v5.5 was implemented and **proved itself
in production**, and two new global-uniqueness traps were found the hard way.

---

## 0. WHERE AIMS-F STANDS

**ISO/IEC 42001 Foundation.** `de046fa6-e627-48c1-85d8-9df226d144f4`,
`governance-service-management` #3, status **`draft`**.

| | |
|---|---|
| Spine | 5 domains · 35 tasks · 154 concepts · 157 links · 5 modules |
| Lessons | **35, English only.** 460,675 chars, 140 checkpoint questions |
| Coverage | **154 / 154 taught**, `untaught_testing_violations = 0` |
| Items | **1,890** — secure 8/task/lang (840), practice 10/task/lang (1,050) |
| Firewall | `secure` concept links = **0** |
| Exam | 40 items · 80% · 60 min · blueprint 6/9/8/10/7 |
| `jta_versions` | v2.0 published, projected from live rows |
| Scheme doc | `SCHEME-AIMS-F.md`, pinned to **17024:2026** |
| i18n | claim + description in en / es-419 / pt-BR |

**Computed cognitive profile**, which is the artifact that validates the build:

| cert | remember | understand | apply | analyze |
|---|---|---|---|---|
| ISMS-F | 10.39 | 56.77 | 22.68 | 10.17 |
| **AIMS-F** | **none** | **46.93** | **41.26** | **11.80** |

The JTA set this as its own falsification test — apply must land meaningfully
heavier than ISMS-F or the JTA is describing a recall course. **1.8x, no recall
tier.** It also makes the ladder rule computable rather than argued.

---

## 1. THE ATTRIBUTION RULE WORKS

v5.5 called this the largest outstanding correctness item. It was closed in
`9aaaba1` and **had never generated an item** until this session.

**It fired in production, by name.** From the generation log, task 1.4:

```
critique rejected: FALSE ATTRIBUTION: The explanation asserts that
Annex D.2 of ISO/IEC 42001 'expl...
```

That is check 7 in `critiqueSystem` catching a false attribution mid-generation
and forcing a re-draft. The single-task gate on 5.5 confirmed the same thing from
the other direction: every claim about audit stages, surveillance and
recertification was attributed to **ISO/IEC 17021-1**, and the items state
plainly that ISO/IEC 42001 contains no conformity assessment provisions. That is
exactly the sentence ISMS-F's generator would not stop getting wrong.

**Do not remove or soften it.** It is now the only thing standing between a
standards-based cert and the ISMS-F defect class, and `verify-cert` cannot see
that class at all.

### What it does not cover

**Claims about OTHER standards are unconstrained.** The rule stops the generator
asserting things about 42001's text. It says nothing about confident claims
regarding 42006, 17021-1 or 19011.

**One such claim is live and unverified.** A secure item on task 5.5 explains
that *"ISO/IEC 42006 is a distinct standard, not a sector extension of ISO/IEC
17021-1."* Scheme-specific certification-body standards in this family are
normally structured as requirements **supplementing** 17021-1 — ISO/IEC 27006
works that way for 27001. **Nobody has read 42006.** If it follows the pattern,
that explanation is wrong and its own distractor is closer to true. See §7.

---

## 2. TWO GLOBAL-UNIQUENESS TRAPS

Both cost a failed load. Both are now in `CERT-SCHEMA-GUIDE` or the style guide.

**`modules.slug` is globally unique.** Migration 177 collided with ISMS-F on
`evaluation-improvement-certification`. AIMS-F now prefixes every module slug with
`aims-`. Patched into `CERT-SCHEMA-GUIDE` §6 (`b18c934`).

**`lessons.slug` is globally unique too, and the loader skips silently.** Module 5
lost three lessons: ISMS-F owned `05-01-monitoring-and-measurement`,
`05-02-internal-audit` and `05-03-management-review`. Coverage read 142 of 154 and
**nothing reported an error** — the load printed `skipped(existing): 32` when only
29 existed. Now style guide §13.

**Why this will recur.** Two certs on management-system standards produce the same
clause structure and therefore the same natural names. **AIMS-IA, ISMS-IA and
AIMS-LI will all hit it.** Query before authoring; prefix from the start on any
standards-based cert.

> **Verify a load by count, not by exit code.** `inserted + skipped` must equal the
> file count, and `skipped` must equal what was already there.

---

## 3. LESSON AUTHORING — WHAT THE FIVE MODULES TAUGHT

`STYLE-GUIDE-AIMS-F.md` is at **v1.1, fourteen sections** (`a432d96`). Four exist
because something went wrong: §1 attribution, §10 the learner is not the buyer,
§13 slugs, §14 the sweep.

### §14 is the finding worth carrying to every future cert

Across five modules and five external reviews, the reviewer rated factual accuracy
**9.0 to 9.3** and reported no material errors. **It found zero of the thirteen
reproduced definitions and clause statements. The mechanical sweep found all
thirteen.**

That is not a failing of the review. It checks whether claims are *true*, and a
reproduction is true — which is precisely what makes it invisible to that check.

| module | §2 hits | what they were |
|---|---|---|
| 1 | 3 | Introduction text, A.6.1.2 control wording, a clause 4.1 `shall` |
| 2 | 5 | Clause 4.3 scope, risk definition, impact assessment definition, SoA definition, the consistency phrase |
| 3 | 0 | first clean pass |
| 4 | **0** | Table A.1's 35 control statements, clean first pass |
| 5 | 5 | clause 3 definitions plus 9.3.1 |

**Hits cluster where the standard's phrasing is most quotable** — definitions and
short `shall` clauses. Long guidance passages are safe; nobody reproduces a
paragraph by accident. Module 4 passing clean on Table A.1 was the module's whole
risk and the discipline held.

### Other rules that earned their place

**Band 12,000-14,000, with stated exceptions.** The original 12,000-13,000 came
from module 1, which is conceptual. Modules 4 and 5 enumerate 38 controls and the
clause 9-10 machinery. Two lessons are recorded as deliberate overruns rather than
left silent.

**Section rhythm:** hook, 3 concepts, 1-2 callouts, 1 interactive, 1 deep-dive,
4 checkpoints, 6 summary bullets. Where a fourth concept block appeared, one was
converted to a deep-dive rather than dropping the material.

**Checkpoint explanations under 330 characters.** Foundation learners skim.

---

## 4. ITEM GENERATION — HOW IT ACTUALLY BEHAVED

Roughly five and a half hours across four passes plus four top-up runs.

**The cue guard is doing real work.** Dozens of drops for `key dominates on
length` and `absolute-word tell: every distractor uses an absolute, key does not`.
The second is a tell nobody would catch by eye.

**`MAX_ROUNDS_PER_TASK = 3` means a single pass under-fills.** Tasks routinely
finished short and needed top-up runs. Both scripts are idempotent and fill only
the deficit, so **plan on re-running until a pass reports `0 task(s) below
target`** rather than assuming one pass completes.

**Analyze-level tasks are the hard ones.** Task 2.7 — the signature
risk-versus-impact task — took **five separate runs** to place its final item,
repeatedly producing `no valid drafts this round`. Tasks 4.7, 3.7 and 5.6 behaved
the same way. That is a reasonable sign the analyze tasks are demanding.

**Env var names differ between the two generators.** `gen-cert-secure.mjs` uses
`SECURE_PER_TASK`; `backfill-practice.mjs` uses **`FLOOR`**. Both use `CERT_ID`,
`MAX_TASKS`, `TASK_ID`, `CHUNK`, `DRY_RUN`.

**`TASK_ID` wants a uuid, not a task code.** Passing `"5.5"` produces a silent
no-op — `0 task(s) below target`, which reads exactly like success.

**The shared `.env` may set `MAX_TASKS=9`.** Set it explicitly every run.

---

## 5. THE CRITIC DISAGREES WITH ONE VERIFIED FINDING

Task 4.1's critique stage rejected the same claim twice:

```
critique rejected: The item's entire premise - that Annex A yields ten
objectives rather than nine
critique rejected: The correct answer rests on a specific structural claim -
that A.6 splits into A
```

**The critic is wrong and the lessons are right.** Annex A has nine control
categories, A.2 through A.10, and **A.6 subdivides into A.6.1 and A.6.2, each
carrying its own objective statement** — so nine categories produce ten
objectives. Verified from the PDF during module 4 authoring.

The critic is reproducing the common summary, which says nine. **Expect pushback
on anything that contradicts widely-repeated secondary sources**, and do not let
a future session "correct" this back. Same shape as the Annex B normative point,
which almost every summary also gets wrong.

---

## 6. COMMITS

### `supabase`
`610665b` BoK · `16f1d7f` Stage 1 locked · `fd94355` JTA v1.2 · `9f4b0b8` Stage 3
closed, JTA v1.3 · `9efb943` scaffold 176/177 + scheme · `b18c934` schema guide §6
· `9aaaba1` **attribution rule** · `698d6a6` v5.6 checkpoint · `4d6714a`
`jta_versions` 178 · `194074d` `cert_inventory()` 179 · `20551fe` exit 2 ·
`0861246` v5.6 addendum · `a432d96` style guide v1.1

### `certidemy-web`
`b0cb7de` claims loader · `3bf527c` descriptions revert · `c9a2946`
`cert-inventory.mjs` · `5967061` AIMS-F descriptions · `46d51f3` exit 2 ·
`6d73d90` modules 3-4 · `7cf0fe3` module 5 · `eb05bf8` slug collision fix

---

## 7. WHAT REMAINS BEFORE PUBLISH

### Blocking

1. **Lessons are English only.** All 35. Items are trilingual because the
   generators translate; lessons are not. `translate-lessons.mjs` for es-419 and
   pt-BR, then `CERT-PUBLISH-CHECKLIST` v2 step 8 — Spanish and Portuguese course
   review before any status flip.
2. **`load-jta-i18n.mjs` needs AIMS-F** — 35 task statements x 2 languages.
   `cert-inventory.mjs` reports it as a gap.
3. **`gen-badges-module.mjs` needs AIMS-F.** Yajaira is the named authority.
4. **`price_usd` is 0.** Harmless while draft, real before publish.

### Verification owed

5. **Read the item bank.** 1,890 items exist and roughly sixteen have been read.
   At minimum: a sample per domain, and an attribution sweep across all
   explanations for `42001 requires` / `the standard requires`.
6. **The 42006 claim in §1.** Read ISO/IEC 42006 or remove the specific assertion
   about its relationship to 17021-1 from the affected task 5.5 items.
7. **Open the rendered course.** Glossary markup, six interactive widget types
   across three shapes, and one lesson read end to end. Both of v5.5's UI defects
   were found by a person looking, and no query substitutes.

### Carried

8. The ISMS-F attribution audit. The rule prevents new defects; it does not repair
   ~2,646 existing items.
9. `ksa_is_provisional` has no approval path.
10. Five `SCHEME-*.md` still carry bare `17024`.
11. Everything in v5.4 §8 and v5.6's addendum §7.

---

## 8. THE LESSON

v5.6's addendum said: do not write down what the system contains — ask it. This
session tested that and it held. `cert_inventory()` found a missing i18n row and
two loaders no handoff had ever named. The coverage view caught a silent
three-lesson load failure. The computed cognitive profile validated the JTA
against its own falsification test.

**The narrower finding is about review.** Five external reviews rated this content
9.0 to 9.3 and found none of thirteen reproductions. A mechanical sweep found all
thirteen in seconds. The reviews were still worth having — they produced the D2
task pair, the drift call-forward and the Annex A structure confirmation — but
**they answer a different question than the sweep does, and only one of the two
can be trusted with §2.**

The same asymmetry runs through the whole session. The database found what the
documents could not. The sweep found what the reviewer could not. The PDF found
what memory could not. **Each time, the instrument that could be wrong was the one
that produced confident prose, and the instrument that could not was the one that
computed an answer.**
