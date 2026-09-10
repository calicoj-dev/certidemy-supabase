# HANDOFF v9.7 — a module authored, a review that found the JTA rather than the lessons, and a JTA that did not exist

**Migration tip: 284. Next free: 285.** Read the disk. `ls migrations/ | tail -1`.

**Everything pushed, both repos.**
`certidemy-supabase` — `91cb4d2`, `b730fab`, `f35dd2c`, `bf76f42`, `48b91c0`,
`b8cccec`, `925c645`.
`certidemy-web` — `1762d0a`, `6b2545b`, `f6018b3`, and module 1's nine lessons.

Stage 7 started. Nine lessons authored, reviewed externally, and **the review's
most serious findings were not about the lessons.** Three were about the JTA
they were written from, and one was about a document that had never existed.

---

## 1. Module 1 — nine lessons, one per D1 task

`content/sm-ai-ii/01-smii-tensions/`, 01-01 through 01-09, `status: draft`,
loaded nowhere.

Coverage is exact: nine tasks, nine lessons, and each of D1's 27 concepts
appears in exactly one lesson's frontmatter. Unbroken prerequisite chain,
`order_index` 1–9, four widget primitives with no default — scenario-mcq ×3,
highlight-mistake ×3, drag-match ×2, toggle-and-observe ×1. **That inverts the
corpus**, where drag-match is 47.5% of 1,186 widgets.

> **That denominator excludes SM-AI-II's own module 1**, which is the right
> comparison and is not obvious: the whole `content/` tree is **1,195** widgets
> and the database is **1,228** (it holds loaded lessons this module has none
> of). 563 of 1,186 is 47.47%. Any other denominator gives a different number.

**Duration is 114 minutes against the module's declared 200.** The external
review's answer was *not thin, underscoped on paper* — each lesson has one
Level II move and spent half its words restating the Level I rule that creates
the tension. **Padding to 200 by writing more "what a Definition of Done is"
would make them worse.**

> This read **113** until verification. It was correct for the pre-rewrite
> module: `01-02` went from 12 minutes to 13 in the rewrite §3 documents, which
> is the same session's own work. **The argument is unchanged** — 114 against
> 200 is the same finding.

### 1.1 Two defects found by validation, not by reading

**The scenario-mcq terminal step was a crash.** `step-4` of 01-01 had no
`options` key, and `scenario-mcq.tsx:132` reads `currentStep.options.length` —
`TypeError` during render, on a step reachable from three options including the
second entry of `best_path`.

**I built it from a description.** The recon said *"the terminal step omits
`next`"*, which means *the step's option omits `next`* — all four terminal forms
are properties of an option, never of a step. §0.2 of the style guide exists for
exactly this and I had it in front of me.

> **And the fix corrected me too.** I said use terminal-by-missing-next, citing
> 87 instances. Those are all multi-option ending steps. **Zero single-option
> steps use that form; 32 use the self-loop**, on the same corpus convention as
> §1's 1,186 — excluding SM-AI-II's module 1, whose own three self-loops were
> written after this fix and make it 35 — which the widget's own doc names
> as *"the most common authoring pattern"* and `PathTrail` has dedicated code
> for. Following my instruction would have invented a shape with no precedent.

**Task 1.7's four checkpoint questions were written at `4_analyze`.** The task
is `3_apply` in both `cert.yml` and the database, and the JTA is internally
consistent — same *Determine whether* verb and level as 1.1, 1.2 and 1.3. **I
then told the validating session to expect `4_analyze`**, which would have made
my error the standard it validated against.

Relabelling made the field consistent and **did not make two of the four Apply
items** — flagged rather than papered over, and carried into the review.

---

## 2. The external review found the JTA, not the lessons

Four findings. **The first is the worst defect a lesson in this credential can
have.**

### 2.1 2017 text sold as 2020

`01-06`'s deep-dive presented the 2017 Sprint-cancellation procedure as Guide
content — consume resources, often traumatic, very uncommon, Done items
reviewed, incomplete work re-estimated. **The 2020 Guide says two sentences and
deliberately deleted the rest**, and the release notes name the deletion. Two
checkpoint questions test the deleted text.

> **The credential's entire premise is the Guide's silences. Filling one with
> the previous edition destroys the argument the scheme rests on** — in the one
> lesson about a provision the Guide left at two sentences.

**Not yet fixed.** It is the first item of the rewrite pass.

### 2.2 The Level II move started late in seven of nine

A lesson may state the Level I rule in one sentence. Seven spent a full
`::concept` block on it. The reviewer's phrase: *"the II move in each lesson is
real. It starts late."*

### 2.3 Twelve distractors a competent Scrum Master dismisses on sight

*"The Sprint Backlog is frozen once the Sprint starts."* *"Cannot assess without
velocity."* *"The Scrum Master cancels to protect the team."* Level I traps in a
Level II form. The review also named the ones that worked — 01-01 q2's
refuse-on-their-behalf against make-the-consequence-visible — as the pattern to
build to.

### 2.4 Task 1.2 was a subset of a Level I task, at a lower level

**SM-AI-I 2.7 — "Identify accountability boundary violations", `4_analyze`,
skill "diagnose the boundary violation AND prescribe the correction" — lists *SM
ordering backlog* as its first enumerated violation.** SM-AI-II 1.2 was
"Identify which accountability is displaced when ordering and sizing
responsibilities are crossed" at `3_apply`.

The recon made it worse: **SM-AI-II covers displacement ten other ways**, and
3.1 is the same SM-does-PO-ordering scenario at the same Bloom, pinned to a
response. **1.2 was the only one of the ten that was a bare identify.**

---

## 3. Task 1.2 rewritten rather than cut, and the cut was the wrong instinct

I proposed cutting it. **The recon refused, on three measured grounds:**

**Cutting orphans three concepts against a hard `scaffold.concepts` FAIL** —
131 concepts, zero orphans, no precedent for tolerating one.

**`developer-sizing-authority` has no clean home.** Attaching it to 5.4 would
make the only four-concept task on a uniform 44 × 3 grid.

**And the cut raises analyze to 62.88**, which falsifies §5.3's own defence —
that 61.49 is credible *because it fell across two adversarial passes with no
verb raised.*

**The gap is real and nothing else fills it.** Sizing authority appears three
times in SM-AI-II and **none is a person outside the Developers setting their
estimates**: 4.8 is self-inflicted pressure, 5.4 is a model, 3.2 is the
assignment boundary — *who does what*, never *how big*.

### 3.1 Built as 3.2's structural sibling

```
3.2  Analyze a situation in which a functional manager assigns work
     directly to Developers                            work-assignment-boundary
1.2  Analyze a situation in which the Developers' sizing of an item
     has been set by someone else                    developer-sizing-authority
```

`4_analyze`, non-enumerative statement, alternatives in the skills line —
**imposed, conceded or genuinely contested.**

> **The enumeration rule decided the construction.** HANDOFF v9.4 records: *a
> task statement that enumerates its own answer set is Apply, not Analyze* —
> and the database obeys it perfectly. **Zero of 27 `4_analyze` statements name
> their answer set; twelve name alternatives in the skills line instead.** The
> rule is not "never name them" but "name them in the skills line once you are
> at Analyze."

**Migration 283** re-derived the blueprint from `v_cognitive_profile` — 278 is
inert under its `exam_blueprint is null` guard. Profile moved 38.51/61.49 →
36.28/63.72, and **§5.3 records the change without falsifying the original
claim**: the two-pass defence remains an accurate account of those two passes.

---

## 4. `SM-AI-II 1.7` — the review was wrong, and the JTA's own rule says why

Grok argued 1.7's checkpoints are Analyze and the task should move up.

**1.7 prints its own two-option answer set** — *"a Definition of Done failure or
a forecasting failure"* — which is the condition that demoted 2.8 in the v1.2
pass. Promoting it would create exactly the state the rule prevents. **And D1
already has the Analyze version: 1.4**, same forecast-versus-delivery
distinction, one level up, same domain.

**1.7 stays `3_apply` and the lesson comes down to it.**

---

## 5. "The Sprint Backlog is a forecast" — a JTA defect, on two certifications

The lessons said it because **the tasks said it.** Tasks 1.4, 4.8 and 5.4 all
carried it in their knowledge lines, and 1.4 in its statement — so an author
writing from a task inherits the error.

**2020 calls it "a plan by and for the Developers."** *Forecast* appears **at
least twice** and never about the artifact.

### 5.1 And it was on a shipped certification

Searching all eleven certs found it on **SD-AI-I** too — and one instance is
serious:

> **SD-AI-I task 5.8's statement is "Translate legacy Scrum terminology to the
> 2020 Guide's canonical terms."** Its knowledge line correctly translates
> *Development Team → Developers*, *self-organizing → self-managing*,
> *ceremonies → events* — **and then taught a 2011-2017 word as the canonical
> 2020 term.** A candidate learning that task learns the error as the
> correction. Now corrected, and the forecast-to-plan swap is a fourth
> translation the task teaches *against*.

**SD-AI-I's slugs were deliberately NOT renamed** — 30 question links each, 42
references across twelve lesson files in three languages, and `living-forecast`
baked into a `lesson_id`, a `lesson_group_id` and a filename. Descriptions carry
the correction. **SM-AI-II's was renamed**, because its window was as open as it
will ever be: zero items, zero `lesson_concepts`, zero translations.

**The activity uses survive untouched** — 1.7's *forecasting failure*, 4.8's
statement, SM-AI-I 4.9, SPO-AI-I 4.7 and 5.5. **Naming the artifact a forecast
is the defect; do not over-correct into the activity.**

---

## 6. `STYLE-GUIDE-SM-AI-II.md` — six rules, and one it broke on itself

§0 is what the review earned. §0.1 Guide claims are 2020 text or marked derived;
§0.2 the Level II move starts in the first concept; §0.3 no distractor dismissed
on sight; §0.4 the best answer never recommends omitting a Scrum element; §0.5
no estimation vocabulary; §0.6 a widget must do what its intro promises.

### 6.1 The instrument cannot prove an absence

§0.1 asserted *"forecast appears once in the whole document."* It does not.

> **Asked whether the word appears and in what sentence, the fetch returned one.
> Asked for an exhaustive section-by-section list with a total, it returned
> "Total Count: 1" — more confidently for the more exhaustive prompt. Asked to
> reproduce Sprint Planning Topic Two verbatim, the second instance was in the
> first passage returned.**

The wrong number was by then in the style guide twice, a commit message and two
`SCHEME` sections.

**Ask for the passage, never for the count.** A count from a summarizer is a
claim about absence, and it answers from what it surfaced rather than from what
is there.

**And the caveat that follows.** Every Guide verification this session used that
instrument. **The cancellation finding, the velocity and story-point absences —
all established the same way.** The burn-downs claim is a *presence* and a
quoted sentence proves one. **The absences are not proven.** They are very
likely true and are not established by a method that can establish them.

> The argument survives and is stronger: **the Guide had the word available in
> Sprint Planning and still called the artifact a plan two sections later.** It
> is a choice, not an absence of vocabulary.

### 6.2 §0.5 amended rather than the lesson

The rule forbade a numeric size outright; the rewritten 01-02 uses days.
**Amended, with a checkable test rather than a taste judgment:** the number must
carry a real unit; **delete every figure and re-read — if the scenario still
asks the same question, they were furniture**; and a duration is permitted only
for the same item at two moments, never compared across items, teams or Sprints.

---

## 7. The JTA of record did not exist

`SCHEME-SM-AI-II.md`, `cert.yml` and migrations 277 and 278 all cite
`SM-AI-II_JTA_v1.2.md` and `SM-AI-II_BoK_v1.1.md`. **Neither was ever
committed** — `git log --all --diff-filter=A` finds no addition, so neither was
deleted.

**`jta/` held 26 files and not one named SM-AI-II.** It was the only
certification in the catalogue with no JTA file of any kind, and it had a
complete scaffold, a written scheme document and nine authored lessons.

### 7.1 The blocker that was not one

Migration 278's `grounding_note` — **stored in the database, so no git diff
would ever show it stale** — made two Stage 9 pre-conditions. One had been
cleared when `SCRUM` became `SCRUM_CORE` and `groundingFor()` learned to read
tier. **The other is still true**: `item-profile.mjs` resolves `profileFor()`
from the certification name with no tier argument.

**And the 26 never-assert entries are in code.** `SCRUM_GUIDE_FACTS` in
`scripts/lib/item-grounding.mjs` — 22 plus 4 `[derived]`, with the paired-error
rule inside the third derived entry. **[2026-09-10: 35, being 31 plus 4. Nine were
added and three corrected after an audit against migrations 285-289; the paired-error
rule is now stated as a rule in `jta/SM-AI-II_BoK_v2.0.md` §4.0 rather than living
inside one entry.]** **The citation was wrong, not the list
lost.** v1.2's *"entries 14 and 26"* are positions 24 and 25 there, so the code
is a faithful reconstruction and must never be described as a recovered file.

### 7.2 Both halves written, and the losses recorded

`jta/SM-AI-II_JTA_generated.md` from `gen-jta-doc.mjs` — 44 tasks, 766 lines,
authoritative for every fact. `jta/SM-AI-II_JTA_v1.3.md` carries only what no
query can reconstruct.

**And §9 says what cannot be reconstructed at all**: the 45th task, the two cuts
from v1.0, three of four demotions, five rewrites, the reviewer's actual
reasoning, the domain-weight rationale for D1 through D4, and the BoK's source
stack, attribution map, scope boundary, falsification test, volatility register
and sign-off record. **A version document that silently omits what it lost
pretends the record is complete.**

### 7.3 Migration 284, and the ordering that was load-bearing

The `jta_versions` row — **v1.3, not v2.0.** Migration 211 records the house
rule that a JTA becomes v2.0 on locking for launch; this cert is `draft`, and
the table is `UNIQUE (certification_id, version_string)` so a v2.0 row coexists
at launch.

> **`to_jsonb(c.*)` freezes the whole certifications row, `exam_blueprint`
> included.** The `grounding_note` correction had to run FIRST or the v1.3
> snapshot would permanently preserve a blocker already cleared. **A frozen
> record of a false statement is worse than no record.** Proof 5 checks exactly
> that, and passed.

**It had already cost something.** Migration 283 overwrote
`exam_blueprint.cognitive_profile` on 09-09, so the profile SM-AI-II published
between 09-03 and 09-09 — 38.51/61.49 — **survives in no queryable form.** That
is what a snapshot prevents, and it had already happened.

`verify-cert` now reports **PASS §5 Certification holds a published JTA version
v1.3**, up from a failure reading *"no jta_versions row at all"*.

---

## 8. The importer could not survive a rename

Renaming `sprint-backlog-as-forecast` exposed three defects.

**`plan.ts` has six `diff*` functions. Five take the rename map and
`diffTaskConcepts` did not**, so the bridge table read its DB-side keys from
pre-rename rows. (`diffCertification` is the sixth and correctly takes no map —
the certification row has no renameable natural key.) A
renamed concept produced a phantom delete and a phantom insert on a pair that
had not changed. Both are no-ops at apply time — **but one phantom delete sets
`requires_allow_deletions`, and that flag is not scoped. It authorises every
delete in the plan.** The task side had the identical hole.

**Four of five `renames.yml` failure modes produced output byte-identical to
having no file at all.** A typo, a dropped `to`, a mis-indented key and a wrong
`kind` each exited 0 with a plan showing `delete X` and `insert Y` under a
plausible reason. **The only silent outcome is now "no file, no renames".**

> **A rename matching zero rows has two causes and only one is a fault.** An
> already-applied rename is the documented steady state — SM-AI-I is in it for
> both entries. The check discriminates on whether `to` exists in the database,
> **which is the property rather than a proxy for it**. A flat matched-nothing
> failure would have broken every re-plan after a successful apply.

**And `apply.ts` defaulted to `tmp/<cert>-plan.json` with no freshness check.**
The plan on disk was two days old, predated `renames.yml`, and **its lesson
count matched the database so the existing `staleCheck` passed it.** An apply
would have read it, done nothing, required no flag and reported success.

The new gate compares the plan's own `generated_at` against the newest source
mtime, and **runs in both modes and before any database connection — a dry-run
of a stale plan is exactly as misleading as applying one.**

---

## 9. `CERT-PUBLISH-CHECKLIST` — the row eleven certs each rediscovered

Migration 277 wrote it down in its own header: *"jta_versions row, published,
projected from the live rows. CERT-PUBLISH-CHECKLIST still has no step for this
and ten certs have each rediscovered it."* **SM-AI-II was the eleventh.**

Three steps added, all about **the record rather than the sale**: the
`jta_versions` row, the JTA existing as a file, and a qualified verify-cert
check — **not "green", but every remaining failure named in the scheme's §12**,
so a failure nobody expected cannot hide behind the ones everybody does.

**Two things deliberately not added.** The achievement row is already in §5, §6
and §6.7 — HANDOFF v9.4's note that it is absent is stale. And the BoK: **seven
of the eleven real certifications have none, and four exist under four naming
conventions in four locations** — `AIGRM-I_BOK.md` and `BOK-AIMS-F.md` in the
root, `docs/BOK-ISMS-F.md`, and `jta/ISMS-IA_BoK_v1.md`. (The `certifications`
table holds twelve rows; the twelfth is `ZZ-TEST-I`, a fixture.) A step would
make seven shipped certifications retroactively non-compliant against a rule
nobody has followed. That belongs in `CERT-CREATION` Stage 1 as a path
convention.

---

## 10. Carried

**`product-backlog-ordering` is declared, wired and untaught.** 01-02 deliberately
stopped teaching ordering; the concept is linked to 1.2 only and no checkpoint
references it. Validation is green because `cert.yml` and the frontmatter agree,
**so the traceability claim is false and nothing catches it.** Proposed: 1.2
drops it, 3.1 takes it as a fourth concept.

**`item-profile.mjs` before Stage 9** — the surviving blocker, preserved
verbatim in the stored note.

**The eight lessons Grok's review named**, plus 01-04's toggle and the twelve
distractors.

**The BoK.** `SM-AI-II_BoK_v1.1.md` is unrecoverable; a fresh one against
`ISMS-IA_BoK_v1.md`'s eleven sections is writable, and **the falsification test
is the section that carries accreditation weight.**

**Two cue-guard defects.** `cueConfigFor` reports `source: "blueprint"` on the
presence of the object while resolving each number independently, and nothing
keys off `source`. And `LEN_SPREAD_MAX` is never audited — the generator prints
it, `verify-cert` neither prints nor uses it, **which is how ISMS-IA generated
912 items at 130 under a declared 100.**

**AIE-I's validity conflict**, still the only deliberate scheme-claim failure.

**The duplicate `## 6.` heading** in the checklist — renumbering breaks every
`§6.1–§6.7` cross-reference.

**Nothing reconciles a hand-written JTA against the database.** `verify-cert`
does that for the scheme document's claims block and has no JTA equivalent. The
fix is a `jta-claims` block plus an invariant, which is code rather than a
checklist line.

---

## 11. Method notes

**Three sessions corrected me on instructions I gave.** The single-option
terminal form had zero precedent and I cited 87 instances of a different shape.
The 1.7 Bloom expectation would have validated my own error. The
matched-nothing rename check would have broken every re-plan after an apply.

**A count from a summarizer is a claim about absence.** §6.1. And it was the
fifth instrument failure of the session, after `jsonb_object_keys` reading only
the top level and hiding `item_model.cue_tolerance` two levels down — which I
escalated as *"the fifth instance of a control that reports success while doing
nothing"* on a mechanism that works.

**`task_concepts` is not cert-scoped.** PostgREST capped a page, client-side
filtering over one request made a small answer indistinguishable from a small
sample, and `unlinked: 131` looked like a finding.

**A heading that counts goes stale.** `## 7. TWO THINGS THIS MODULE OWES` became
three. Renamed to `WHAT IS OWED, AND WHERE IT IS OWED`, which is the more useful
claim anyway.

**`npm run content:validate --cert X` silently swallows the flag.** npm eats it
without the `--` separator, `validate.mjs` never sees it, and it exits on the
missing argument. I wrote it wrong in prompts all session.

**This shell collapses `\\` inside quoted heredocs.** It broke two scripts and a
commit message was written to a file with `git commit -F` for that reason.

**Running `npm run build` unasked on a script-only change was right.** `main`
auto-deploys, so a red build there is an outage rather than a failed check.

---

## 12. What is next

**Module 1's rewrite pass**, in order: 01-06's 2017 cancellation text, the Level
I openings, the distractors, 01-04's toggle. All against the style guide, which
is what it was written for.

**Then the second review.** If module 1 comes back production-ready, **the guide
is proven and modules 2–5 are authored against it.** That gate is the whole
reason the guide was written before the rewrites rather than after.

**Then Stages 8–12**: load the lessons, translate, generate the bank, and the
`item-profile.mjs` fix that has to land before any item is generated.

---

## 13. The line worth carrying

**The review found the lessons and the lessons were downstream.**

*The Sprint Backlog is a forecast* was in three knowledge lines before it was in
a lesson. 1.2's overlap with a Level I task was in the JTA before it was in a
module. The 26 never-assert entries **[2026-09-10: 35]** were cited from a file nobody could open,
and the citation was the only record that they existed. **An author starting
from a task inherits whatever the task got wrong, and every lesson written
against it repeats it faithfully.**

v9.4 said the reliable way to find silent success is to be the first user of
something. v9.5 added that the way to prevent it is to make the absence produce
an event. v9.6 added that an instrument can be wrong in the same way the thing
it measures can.

**What this session adds: check upstream before you fix downstream.** Nine
lessons could have been corrected one at a time, each one right, and the next
module would have reproduced every defect — because the defects were never in
the lessons.

*End of v9.7.*
