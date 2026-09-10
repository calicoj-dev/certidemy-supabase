> ## FACTUAL CONTENT IS NOT IN THIS FILE
>
> **The authoritative JTA for SM-AI-II is `jta/SM-AI-II_JTA_generated.md`**, rendered
> from the live database by `scripts/gen-jta-doc.mjs`. Domains, weights, tasks, Bloom
> levels, K/S/A, concept slugs, exam facts and the cognitive profile are all there and
> none of them is here. Regenerate that file rather than reading or editing tables.
>
> Regenerated 2026-09-10, 44 tasks, 766 lines. It is the first JTA in the catalogue whose
> generated half existed before any hand-written half, which is the right way round and
> was an accident.
>
> **REGENERATING IT IS PART OF APPLYING A JTA CHANGE, NOT A SEPARATE STEP.** See §8.5.
>
> **This file carries only what a query cannot reconstruct**: the design screens, the
> lock gate, the review history, what changed and why, and what the record has lost.
> Read it for the *why*, never for the *what*.

# SM-AI-II — Job-Task Analysis v1.4

**Credential:** Scrum Master II — AI
**Code:** `SM-AI-II` · **Tier II** · Family `ai-agile`, status `draft`
**Locked:** v1.2 locked 2026-09-02 · v1.3 superseded it 2026-09-09 ·
**v1.4 supersedes v1.3 on 2026-09-10**
**File:** `supabase/jta/SM-AI-II_JTA_v1.4.md`
**Supersedes:** v1.0, v1.1, v1.2 — **none of which was ever committed to a repository.**
See §9. And v1.3, which was; its changes are in §8.1–§8.4 and v1.4's in §8.5.
**Companions:** `jta/SM-AI-II_JTA_generated.md` (authoritative for facts) ·
`SCHEME-SM-AI-II.md` · `STYLE-GUIDE-SM-AI-II.md` · `scripts/lib/item-grounding.mjs`
(`SCRUM_GUIDE_FACTS` — see §7)
**Recorded in:** `public.jta_versions`, **two rows, exactly one of them `published`** —
`v1.4` from migration 286 is current; `v1.3` from migration 284 is **`retired`, not
deleted**, keeping its version string and its frozen snapshot. That is the model migration
062 built: *“at most one PUBLISHED version per certification at any time”*, enforced by the
partial index `jta_versions_one_published`. **Many rows, one current** — and it is the
surviving rows that let a credential render the blueprint it was earned against, while the
one current row is what a new attempt gets stamped with. v1.3 is the only queryable record
of the scaffold the D3 recon was run against.

---

## 0. WHAT THIS DOCUMENT IS, AND THE PROBLEM IT DOES NOT SOLVE

**v1.3 is the first version of this JTA that exists as a file.**

`SCHEME-SM-AI-II.md` cites `SM-AI-II_JTA_v1.2.md (locked)` in five places, migrations
277 and 278 cite it as their source, and `content/sm-ai-ii/cert.yml` records itself as
derived from it. **The file was never committed to either repository**
(`git log --all --diff-filter=A -- "*SM-AI-II_JTA*"` returns nothing) and cannot be
produced. The same is true of `SM-AI-II_BoK_v1.1.md`.

This document reconstructs what the surviving record preserves of v1.2, states plainly
what it does not, and records the changes made since. **It is not v1.2 recovered.** Every
section below is sourced from a file that does exist — `SCHEME-SM-AI-II.md`,
`HANDOFF-v9_4.md`, migrations 277 and 278, `cert.yml`'s header, and the code — and where
the record is silent this document says so rather than filling the gap.

**That discipline is the scheme's own.** `STYLE-GUIDE-SM-AI-II.md` §0.1 forbids filling a
Guide silence with the previous edition's text. Filling a JTA silence with a plausible
reconstruction is the same error against a different document.

---

## 1. THE TWO SCREENS

The admission test every task had to pass. Preserved in `SCHEME-SM-AI-II.md` §5.2 and
`HANDOFF-v9_4.md` §1.2.

**SCREEN 1 — Would adding this to `SM-AI-I` be wrong?** If the competence could sit in
the Level I credential without distorting it, it is not Level II material.

**SCREEN 2 — Framework conformance.** A best answer that violates a Guide rule is
**rejected, not reworded.**

**Together they constrain but do not determine.** Determined → Level I. Unconstrained →
invention. That sentence is the whole competence class this credential claims, and §5.1
of the scheme argues its admissibility under ISO/IEC 17024: two schemes over one job
title are legitimate where they certify **different competence classes**, not where they
certify the same competence at different item difficulty.

### 1.1 Screen 1(b)'s first form was inert, and it read as rigorous

Sub-test (b) was originally:

> *"adding it to `SM-AI-I` would force that credential's declared Bloom up"*

**That control could not fire.** `SM-AI-I` already declares Analyze on 11.49% of its
weight against a `4_analyze` MCQ ceiling, so an Analyze task can be added to it without
raising anything. **It filtered nothing, for exactly the tasks it existed to filter,
while reading as rigorous.** Corrected before lock.

This is the most useful thing v1.2's review produced and it generalises past this
scheme: **a screen that cannot fail is worse than no screen**, because it is counted as
having been applied.

> `SM-AI-II_BoK_v1.1.md` §5.2 is recorded in `SCHEME-SM-AI-II.md` §5.2 and
> `HANDOFF-v9_4.md` as still carrying the inert text and owed the replacement. **That
> file does not exist**, so the correction cannot be made and the debt cannot be
> cleared. It is recorded here as unpayable rather than as outstanding.

---

## 2. THE LOCK GATE, RESTATED AGAINST v1.4

**v1.2 would lock only if the computed profile reached `analyze >= 55%` with
`remember = 0`.**

| | analyze | remember | clears by |
|---|---|---|---|
| **at v1.2 lock (2026-09-02)** | 61.49% | 0 | **6.49 points** |
| **at v1.3 (2026-09-09)** | **63.72%** | **0** | **8.72 points** |
| **at v1.4 (2026-09-10)** | **63.72%** | **0** | **8.72 points** |

**v1.4 does not move this table, and that is the point of the row.** Migration 285
rewrote eleven knowledge and description strings and touched no `bloom_level`, so
`v_cognitive_profile` is arithmetically identical either side of it. A version that
corrects what a task SAYS without changing what it MEASURES should show exactly this,
and a changed figure here would have meant the correction went further than intended.

The gate still holds, and it holds by more. **Zero Remember and zero Understand are
unchanged** — this remains a cognitive-only rung above a Level I credential, which is
what §5.1 requires it to be.

**The profile is computed, never asserted.** `certifications.exam_blueprint.cognitive_profile`
is built by `jsonb_object_agg` directly from `public.v_cognitive_profile` — migration 278
first, migration 283 after the 1.2 rewrite — and no percentage is typed in either.
`verify-cert.mjs` invariant 17 therefore holds by construction. **No number in this
section may be hand-maintained; read it from the generated JTA.**

---

## 3. THE ARC, AND WHAT MOVED AT EACH STEP

| version | analyze | tasks | what moved |
|---|---|---|---|
| v1.0 | 68.88 | 45 | first draft |
| v1.1 | 63.72 | 44 | 3 demotions · 2 cuts · 1 addition · 5 rewrites |
| **v1.2 (locked)** | **61.49** | **44** | 1 demotion · never-assert 23 → 26 |
| *computed live at lock* | *61.49* | *44* | *matched the hand arithmetic to the hundredth* |
| **v1.3** | **63.72** | **44** | 1 promotion (task 1.2), 1 statement and 3 knowledge lines corrected, 1 concept renamed |
| **v1.4** | **63.72** | **44** | 5 knowledge lines and 6 concept descriptions corrected in D3; no verb moved |

**Two adversarial review passes took the analyze share down 7.39 points and no verb was
raised anywhere to compensate.** That was the only defence offered for 61.49 at lock, and
it remains an accurate account of those two passes.

**v1.3 raises one verb, deliberately and on the record** — task 1.2 from `3_apply` to
`4_analyze` — returning the share to 63.72, coincidentally v1.1's figure. The coincidence
is arithmetic: any single task moving between levels in a 9-task, 20%-weight domain moves
the share by 20/9 = 2.2222 points. **It is not a reversion to v1.1**; §8 records what
actually changed.

### 3.1 Peer context

Queried from `v_cognitive_profile` rather than read off a document:

| certification | analyze |
|---|---|
| AIHR-I (heaviest Level I) | 21.33% |
| **SM-AI-II** | **63.72%** |
| ISMS-IA | 65.60% |
| AIMS-IA | 69.48% |

Below both Internal Auditors, which is honest — auditing *is* more analyze-dominant than
coaching.

---

## 4. TWO RULES THAT FELL OUT OF REVIEW AND GENERALISE

Recorded in `HANDOFF-v9_4.md` §1.4. Both are catalogue-wide, not scheme-specific.

### 4.1 A task statement that enumerates its own answer set is Apply, not Analyze

**Worked instance: task 2.8.** It printed its three causes — *impediment, capability gap,
self-management failure* — inside the statement, **which makes any item a taxonomy lookup
no matter how the stem is dressed.** Demoted to `3_apply` in v1.2, and that demotion is
the single one the v1.2 row records.

**Checkable by reading statements. No items required.**

The rule survives into v1.3 and is measurable against the current scaffold: **three
`3_apply` statements name their options (1.3, 1.7, 2.8) and zero of the twenty-eight
`4_analyze` statements do.** At Analyze the alternatives live in the skills line instead —
twelve of twenty-eight do that. `STYLE-GUIDE-SM-AI-II.md` §0.3 and §3.2 carry the
authoring form of this.

### 4.2 A never-assert entry must ship with its inverse

Forbidding *"the Definition of Done may be relaxed for AI-generated work"* alone teaches
the generator to assert *"generated work cannot be Done"* — **equally false, harder to
catch because it sounds cautious.** v1.2 recorded the pair as entries 14 and 26. See §7
for where those entries now live and why the numbering no longer matches.

---

## 5. THIN-RESIDUE TASKS — ITEM-WRITING DEBT, NOT JTA DEBT

Nine tasks carry item constraints where the residue between defensible options is thin:

**1.1 · 1.3 · 2.4 · 2.8 · 3.1 · 3.6 · 4.7 · 5.2 · 5.6**

> **A thin-residue task with a lazy stem produces a Level I item inside a Level II form,
> and NO STRUCTURAL INVARIANT CATCHES IT.** Not the firewall, not the coverage view, not
> the cue guard, not invariant 17. It is a content property, enforceable only in the
> grounding entry and the critique pass.

**Unchanged in v1.3.** Task 1.2's promotion does not add to the list: its rewritten form
turns on a three-way attribution (imposed / conceded / genuinely contested) that carries
its own residue.

**Unchanged in v1.4, and 3.7 is the one to argue about.** D3's two entries here, 3.1 and
3.6, are both among the three tasks migration 285 did not touch. Of the five it did, 3.7
is the only candidate for admission and it does not qualify — the correction **sharpens**
its residue rather than thinning it. Under v1.3's knowledge line, *“this violates the
Guide’s one-backlog rule”* was the answer the task itself licensed; under v1.4's it is a
confident wrong answer that a competent Scrum Master would reach for, which is a clean
discriminator and exactly what §7.1's borderline candidate is defined to produce.

---

## 6. WHAT IS CARRIED INTO STAGE 7 AND STAGE 9

- **Stage 7 — 44 lessons.** Modules 1 and 2 are authored, nine lessons each; module 1 was
  externally reviewed and `STYLE-GUIDE-SM-AI-II.md` is the delta that review produced.
  **Modules 3–5 outstanding, 26 lessons.**
- **Stage 9 — the item bank.** Floors are 8 secure and 10 practice per in-scope task per
  language: **1,056 secure and 1,320 practice** at the floor across three languages.
- **One Stage 9 pre-condition remains open.** See §7.2.

---

## 7. THE NEVER-ASSERT LIST — HELD IN CODE, NOT IN THIS FILE

### 7.1 Where it is

**The never-assert entries are held in `scripts/lib/item-grounding.mjs`, in the
constant `SCRUM_GUIDE_FACTS`.** **35 as at 2026-09-10** — 31 plus 4 `[derived]`.
The breakdown below was counted 2026-09-09, when the total was 26:

> **NINE WERE ADDED AND THREE CORRECTED ON 2026-09-10**, after an audit against
> migrations 285 through 289. Every one of those migrations retired a claim that had
> reached this JTA, and the list was written before all of them. **Two entries were not
> merely missing but wrong** — one asserted the Developers are accountable for the
> Increment, which migration 289 retired the same day; the other narrowed self-management
> to the Developers and stated an assignment prohibition, both retired by 285.
> `jta/SM-AI-II_BoK_v2.0.md` §4.1 is the readable copy.

- **22 entries** under *"CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION — each
  is widely taught and none is in the text"*: Sprint cancellation authority · Scrum
  Master overruling ordering · weakening an organizational Definition of Done · Scrum
  Master accountable for the Increment · extending or pausing a Sprint · Daily Scrum as
  status report · the three questions as a requirement · forecast-or-estimate as
  commitment · prescribed story points, velocity, burndowns, refinement-as-event · roles
  versus accountabilities · Scrum Master assigning work · Product-Owner-by-committee ·
  Daily Scrum attendance · timeboxes as fixed durations · Sprint Review as release gate ·
  one Increment per Sprint · Product Goal versus Sprint Goal · Scrum Master writing the
  Sprint Goal · Product Owner estimating or assigning · Scrum Master as coordinator ·
  scaling frameworks · 2020 vocabulary.
- **4 entries** under *"CLAIMS THAT ARE TRUE BUT ARE INFERENCES, NOT QUOTATIONS"*, each
  prefixed `[derived]`: a tool holds no accountability · the Definition of Done may not
  be relaxed for AI-generated work · AI-generated work meeting the Definition of Done
  **is** an Increment · a model's output is not inspection.

**22 + 4 = 26, four labelled `[derived]`.** The paired-error rule of §4.2 is inside the
third derived entry, in its own words: *"This is the INVERSE of the entry above and must
ship with it. A list that forbids only the permissive error teaches the restrictive one."*

### 7.2 THE CODE IS A FAITHFUL RECONSTRUCTION, NOT A BYTE COPY

**v1.2's §7 was never committed and has not been recovered.** What the code holds matches
v1.2's description in every measurable respect — the count, the split, the derived
labelling, the paired-error rule — and **the ordering differs**:

> `HANDOFF-v9_4.md` records the Definition-of-Done pair as **"entries 14 and 26."** In
> `SCRUM_GUIDE_FACTS` those two sit at positions **24 and 25** under any continuous
> numbering.

**So: the same content, in a different order.** Cite the code, never v1.2 §7, and do not
describe the list as recovered. Any future reference to "entry N" must be numbered
against the code, because the document that numbered them differently is gone.

### 7.3 Two things the constant's own header records

**The list reaches only `SCRUM_L2`.** `SM-AI-I`, `SPO-AI-I` and `SD-AI-I` were generated
against a Scrum grounding string carrying **no never-assert list at all** — named in the
code as *"very likely a real quality gap in shipped banks."* Wiring it into Level I would
change generation on three live certifications and is a scoped decision, not a side
effect.

**`SCRUM` was renamed `SCRUM_CORE` when this certification arrived, and not one byte of
its value changed** — deliberately, because `\bscrum\b` is the first branch in
`groundingFor` and now matches four certifications. Level II composes on top via
`SCRUM_L2` rather than editing the shared string.

### 7.4 Stage 9 pre-conditions: one cleared, one open

Migration 278 stored two blockers in `exam_blueprint.item_model.grounding_note`.

**CLEARED 2026-09-09.** *"`item-grounding.mjs` has no SCRUM entry, so this certification
resolves to NEUTRAL."* `groundingFor(certName, tier)` now reads tier and returns
`SCRUM_L2` for tier 2, which composes `SCRUM_CORE` with `SCRUM_GUIDE_FACTS`. **True when
written; false since.** Migration 284 corrects the stored note.

**CLEARED 2026-09-10.** *"`item-profile.mjs` resolves `profileFor(certName)` from the
certification name and takes no tier argument, so this certification inherits
`SM-AI-I`'s Level I tier profile."* `profileFor(certName, tier)` now resolves **tier
first, before any name match**, returning `PROFESSIONAL_L2` for tier 2. **True when
written; false since.** Migration 290 corrects the stored note.

**And the claim was narrower than it read.** `difficultyLineFor` is the module's only
live consumer, and `bloomDirective` returns it **only when a task declares no
`bloom_level`**. Counted 2026-09-10: 509 tasks, 13 certifications, none without one. So
no bank was ever going to be generated against the wrong profile — the fallback fires
only once a task has already lost its declared level, and then it fires silently. **The
blocker was real and its stated consequence was not.**

**A second defect was cleared in the same pass and this section never named it.**
`isL2()` is tier 2 **and** `4_analyze`, so all 16 of this scheme's `3_apply` tasks
reached a draft prompt offering `true_false`. `verify-cert` invariant 19 fails the
**whole** secure bank on one two-option row, and nothing would have surfaced it until
1,056 rows existed. The option floor is now a tier property.

---

## 8. CHANGES BY VERSION

**§8.1 through §8.4 are what v1.3 changed from v1.2. §8.5 is what v1.4 changed from
v1.3.** The sections are not renumbered when a version lands, because two documents in
this repository already cite §8 and §9 by number.

### 8.0 v1.3, from v1.2

All between 2026-09-03 and 2026-09-09. Baseline is `content/sm-ai-ii/cert.yml` as first
committed (`efe0f31`, 2026-09-03), which records itself as derived from v1.2.

**Task codes, domains, weights, criticality, frequency, exam scope and order_index are
unchanged on all 44.** Counts unchanged: 44 tasks, 131 concepts, 132 links, 5 domains.

### 8.1 Task 1.2 — rewritten and promoted

| field | v1.2 | v1.3 |
|---|---|---|
| statement | *Identify which accountability is displaced when ordering and sizing responsibilities are crossed* | **Analyze a situation in which the Developers' sizing of an item has been set by someone else** |
| **bloom_level** | **`3_apply`** | **`4_analyze`** |
| knowledge | *The Product Owner orders the Product Backlog; the Developers alone size the work* | *The Developers who will be doing the work are responsible for the sizing; the Product Owner may influence them by helping them understand and select trade-offs* |
| skills | *Identifying which side of the split moved, and in which direction* | *Reading whether the number was imposed, conceded or genuinely contested* |
| abilities | *Naming a displacement without assigning blame* | *Naming a displacement the Developers took part in* |

**WHY IT CHANGED.** An external review found v1.2's 1.2 **overlapping `SM-AI-I` 2.7**,
*"Identify accountability boundary violations"* — which sits at `4_analyze` in the Level I
credential, enumerates *"SM ordering backlog"* as the first of its four violations, and
carries the stronger skill of **diagnosing AND prescribing**. v1.2's task was narrower in
scope, narrower in required output, and one Bloom level lower than a Level I task that
already covered its main case. **That is Screen 1 failing after the fact.**

Cutting it was considered and rejected: it would have orphaned three concepts against a
`scaffold.concepts` hard failure, `developer-sizing-authority` had no clean home
elsewhere, and the cut would have raised the analyze share to 62.88 — falsifying the
scheme's own §5.3 defence of 61.49.

**The rewrite drops the ordering half** — covered by 3.1 and 3.6 — **and keeps sizing
authority alone**, built as the structural sibling of 3.2 (*"Analyze a situation in which
a functional manager assigns work directly to Developers"*): non-enumerative statement,
alternatives in the skills line, same Bloom. 3.2 owns the **who-does-what** boundary; 1.2
owns **how-big**.

**Its three concept slugs are unchanged.** `product-backlog-ordering` stays as the
contrast that makes sizing an authority rather than a preference, carried by the
knowledge line's split.

### 8.2 The `forecast` correction — four tasks, three concepts

The 2020 Guide calls the Sprint Backlog **"a plan by and for the Developers."** The word
*forecast* appears **at least twice and never about that artifact** — once about
burn-downs and burn-ups, once about the Developers' confidence at Sprint Planning.
Calling the Sprint Backlog a forecast is 2011–2017 language, and v1.2 carried it in four
places.

| task | field | v1.2 | v1.3 |
|---|---|---|---|
| 1.4 | statement | *…and the Sprint Backlog **forecast** was not delivered* | *…and the scope selected at Sprint Planning was not all delivered* |
| 1.4 | knowledge | *The Sprint Backlog is a forecast; the Sprint Goal is the commitment* | *The Sprint Backlog is a plan by and for the Developers; the Sprint Goal is the commitment* |
| 4.8 | knowledge | *…a forecast by the Developers; **the Guide never mentions velocity, burndowns or story points*** | *…a plan by and for the Developers; the Guide names burn-downs as one of several practices that exist to forecast progress, and no occurrence of velocity or story points was found in it* |
| 5.4 | knowledge | *The Sprint Backlog is a forecast and the Sprint Goal is the commitment…* | *The Sprint Backlog is a plan by and for the Developers and…* |

**4.8 carried a second defect in the same line: burn-downs ARE named in the Guide.** A
lesson written from that knowledge line would have asserted something false about the
Guide inside a task about not doing so.

| concept | v1.2 | v1.3 |
|---|---|---|
| `sprint-backlog-as-forecast` | *The Sprint Backlog is a forecast by the Developers, not a promise of delivered scope.* | **renamed `sprint-backlog-as-plan`** · *…is a plan by and for the Developers…* |
| `developer-sizing-authority` | *The Developers **alone** size the work; no one else may set their estimates.* | *The Developers who will do the work are **responsible for the sizing**; the Product Owner **may influence** them, and the Guide provides for no one setting the number.* |
| `sprint-goal-as-commitment` | *…distinct from its **forecast** scope.* | *…distinct from its **selected** scope.* |
| `purposeful-incompleteness` | *defining only the parts* | *only defining the parts* (Guide-citation wording) |

**`developer-sizing-authority`'s old description overstated the Guide.** *Alone* and *no
one else may set* are stronger than *responsible for the sizing* plus an explicitly
permitted Product Owner influence — and that gap is where task 1.2's competence now sits.

**The slug rename went through `content/sm-ai-ii/renames.yml`**, so the importer emits a
rename and not a delete-plus-insert. A concept delete cascades `task_concepts`,
`lesson_concepts`, `question_concepts` and `user_concept_mastery`.

**Activity uses of *forecast* were deliberately left**: 1.7's *forecasting failure*, 4.8's
statement, `SM-AI-I` 4.9, `SPO-AI-I` 4.7 and 5.5. Forecasting progress is a practice the
Guide names. **Naming the artifact a forecast is the defect; over-correcting into the
activity is a different one.**

### 8.3 The profile

| | v1.2 | v1.3 |
|---|---|---|
| `3_apply` | 17 tasks, **38.51%** | 16 tasks, **36.28%** |
| `4_analyze` | 27 tasks, **61.49%** | 28 tasks, **63.72%** |
| `computed_at` | 2026-09-03 | 2026-09-09 |

Re-derived by **migration 283** from `v_cognitive_profile` via `jsonb_object_agg`, with
no percentage typed. Everything else in `exam_blueprint` — `version`, `basis`,
`assembly`, `item_model` including `cue_tolerance`, `difficulty_mix`, `difficulty_note`,
`derived_from` — is unchanged, preserved by a shallow `||` merge rather than a rebuild.

### 8.4 Also changed

The certification `description`, for Guide-citation wording (*"defining only the parts"* →
*"only defining the parts"*), and `exam_blueprint.item_model.grounding_note` in migration
284.

---

### 8.5 v1.4, from v1.3 — D3's knowledge lines, corrected before a lesson was written

Applied 2026-09-10 by **migration 285**, in the SQL editor, with `content/sm-ai-ii/cert.yml`
carrying the identical strings. **Eleven strings: five task knowledge lines and six concept
descriptions, all in D3.** Task codes, statements, domains, weights, criticality, frequency,
exam scope, `bloom_level` and `order_index` are unchanged on all 44. Counts unchanged: 44
tasks, 131 concepts, 132 links, 5 domains. **The profile did not move** — see §2.

**All seven are the same defect class: a claim about the 2020 Scrum Guide that the Guide
does not support.** Not one was found by reading a lesson, because no lesson exists. They
were found by the pre-authoring recon that D2 established, and D2's version of it caught
three.

> **THE ARGUMENT FOR RUNNING THE RECON BEFORE AUTHORING IS NOW EVIDENCE, NOT A POSITION.**
> Every Guide-attribution defect that reached module 1's lessons was in its tasks first.
> D2's recon caught three before nine lessons were written against them; D3's caught seven.
> A knowledge line is read by every lesson in its task and by every item generated from it,
> so a defect there is not one error — it is the same error as many times as the task is
> used.

#### The consequential one: task 3.7 and `single-product-backlog`

v1.3 read *"One product has one Product Backlog, one Product Goal and one Product Owner"*,
and the concept read *"One product has one Product Backlog, however many teams work on it."*

The Guide's only sentence on this, reproduced rather than searched:

> *"If Scrum Teams become too large, they should consider reorganizing into multiple
> cohesive Scrum Teams, each focused on the same product. **Therefore, they should share
> the same Product Goal, Product Backlog, and Product Owner.**"*

**Three gaps.** It says *should*, not *must* — a recommendation stated as a rule. It is
scoped to teams that reorganized **because one grew too large**, which is not the route two
teams sharing a product may have taken, and 3.7's own scenario does not say they did. And
*"however many teams work on it"* is the generalisation, not the text.

**So 3.7 cannot be keyed as a Guide violation**, which is the whole shape of the task. The
replacement gives the recommendation and then the cost — *"where they do not, no single
order of value exists"* — and the cost is judgment, which is the Level II answer anyway.

**`SM-AI-I` 05-04 overstates it the same way**: *"every scaling question is answered first
by the Guide's rule: one Product Goal, one Product Backlog, one Product Owner per
product."* The Level I floor was carrying the error upward, and the Level II task inherited
it rather than inventing it.

#### The one that was wrong twice: `product-goal-singularity`

v1.3 read *"One product has one Product Goal at a time."* Both halves fail, against
different passages.

> *"The Product Goal is the long-term objective **for the Scrum Team**. **They** must
> fulfill (or abandon) one objective before taking on the next."*

**The Guide attaches the Product Goal to the Scrum Team, not to the product.** And
*"fulfill or abandon one objective before taking on the next"* is a **sequencing rule about
one team over time**; *"one product has one Product Goal at a time"* is a **cardinality rule
about one product across teams**. Two different claims, and neither supports the other. The
same substitution sits under the Product Backlog: *"It is the single source of work
undertaken by **the Scrum Team**."*

#### The other five

| site | v1.3 | v1.4 |
|---|---|---|
| task 3.2 | *The **Developers** decide who does what within the Sprint* | *Self-management belongs to the **Scrum Team**, which internally decides who does what, when and how; an assignment from outside displaces a Scrum Team decision* |
| `work-assignment-boundary` | *…**no one assigns work to them.*** | *The Guide states the provision and no prohibition; that an outside assignment displaces it **follows from the provision and is not text**.* |
| `absence-handling` | *…and **no interim arrangement is prescribed**.* | *The Developers are accountable for creating a plan for the Sprint, and that does not depend on who is present.* |
| task 3.8 | *…and the accountability **is not divisible*** | *…and **says nothing in the Product Owner or Scrum Team sections** about how that attention is apportioned* |
| tasks 3.3, 3.5 · `organizational-service`, `stakeholder-influence` | *…**adopt** an empirical approach* · *…**persuade** the Product Owner* | *…**understand and enact** an empirical approach for complex work* · *…**can do so by trying to convince** the Product Owner* |

**3.2's attribution error was inherited from a live certification that contradicts itself.**
`SM-AI-I` 02-05 has it right — *"A Scrum Team is self-managing: it internally decides who
does what, when, and how"* — and 02-03, three lessons earlier, has it wrong: *"The
Developers are self-managing — they decide who does what, when, and how."* The Level II task
took the wrong half. **02-03 is unchanged and is the only misattribution in SM-AI-I**, swept
across every English lesson.

**`work-assignment-boundary` and `absence-handling` are the §0.1 pair.** One asserted a
prohibition the Guide does not make; the other rested on an absence. Both now state the
provision and mark the inference, which is the treatment task 2.4's threshold already
carries in module 2's lessons.

**The quotation drift sat in FOUR places and the recon found two.** Task 3.3 was found only
by sweeping the file for the claim after fixing the two known sites, and
`stakeholder-influence` additionally hardened *"can do so by trying to convince"* into an
exclusive channel — which is how `SM-AI-I` 02-02 phrases it: *"that is the proper channel,
and it is the only one."* **Migration 285 therefore carries the sweep as a guard**: no
retired phrasing may survive in any task or concept of the certification. A correction
applied to one of four sites looks correct at the site it was applied to.

#### 3.8's replacement is an absence claim on purpose

It says the Guide *"says nothing in the Product Owner or Scrum Team sections"*. That is the
class §8.5 just removed from `absence-handling`, and it stays here for one reason: **it
names the sections that were read.** §0.1's rule is that an absence cannot be established
by failing to find something — it has to be checked against the passage that would carry
it, and a claim that names where it looked can be disproved by pointing at a section that
was not read. **A task whose subject is the Guide's silence has to be able to say so.** It
still needs marking wherever a lesson renders it.

**[SUPERSEDED 2026-09-10, three hours later, by migration 287 — and the hedge came out
because the instrument changed, not because the reasoning was wrong.]** The 2020 Guide is
now a local file at `reference/scrum-guide-2020.txt`, so an absence is a positive result
over a bounded corpus rather than a claim that can only be left unfalsified. `attention`
returns **0** across the whole document. 3.8 now reads *"says nothing **anywhere**"*, and
the clause naming the two sections is gone.

#### The should/must contrast, found after this section was written

**It is the evidence that §8.5's own correction to task 3.7 was right, and it was not
available when that correction was argued.** Grepping the complete Guide for multi-team
language returns three sentences and only three:

> *"If Scrum Teams become too large, they **should** consider reorganizing into multiple
> cohesive Scrum Teams, each focused on the same product."*
>
> *"Therefore, they **should** share the same Product Goal, Product Backlog, and Product
> Owner."*
>
> *"If there are multiple Scrum Teams working together on a product, they **must** mutually
> define and comply with the same Definition of Done."*

**The third is a must, and it is not scoped to the too-large case.** It opens on the
general condition — *"If there are multiple Scrum Teams working together on a product"* —
where the Product Owner sentence is a should reachable only through a reorganization.

**So the Guide knows how to require something of several teams on one product, and for the
Product Owner it chose not to.** 3.7 was rewritten on the argument that a recommendation
had been stated as a rule; this is that argument with the Guide's own contrast behind it.
And it makes 3.8's silence a **choice** rather than an oversight, which is what a Level II
task wants — so the sentence is now in 3.8's knowledge line as its second clause.

> **Neither half of this was reachable by the old instrument.** A summarizer asked about
> multiple teams returns the Product Owner sentence, because that is the one the question
> is about. The Definition of Done sentence sits in a different section under a different
> subject, and nothing would have surfaced it. **The contrast is a property of the whole
> document, and only a whole-document search finds a property of the whole document.**

#### What the six constructs are, and why none of them changed

`empiricism-prerequisites`, `escalation-proportionality`, `po-capacity`, `cross-team-equity`,
`decision-diffusion` and `role-vacancy-pressure` have **no Guide text behind them at all**,
and all six are correct as they stand. Every one is a bare definition of a phenomenon: none
says *the Guide*, *must*, *may not*, or *is required*. They describe rather than legislate,
so a lesson can mark them without first having to un-say something — which is exactly what
the six rewritten ones needed. **Migration 285 names all six in its guard as rows that must
not move**, because a sweep that "corrected" them would have been the over-application the
negative half exists to catch.

#### The generated JTA had been stale for four hours longer than anyone knew

`jta/SM-AI-II_JTA_generated.md` was regenerated for v1.4 and the diff came back **nine
tasks, not five**. Five were D3's, from migration 285. **The other four were D2's** — 2.1,
2.4, 2.6 and 2.9 — from the three JTA fixes made before module 2 was authored.

The dates: the generated file was committed at **15:41** on 2026-09-09 (`b8cccec`); the D2
corrections reached `cert.yml` at **20:09** the same day (`0f8fcc8`, web). **Nobody re-ran
`gen-jta-doc.mjs`.** So the file this document's own banner calls *"authoritative for every
fact"* was wrong about four of 44 tasks for the whole of module 2's authoring.

Nothing bad reached the lessons, because each was authored from live database reads rather
than from the file — **which is the reason it went unnoticed, not a reason it was safe.**

> **REGENERATE THE JTA IN THE SAME PASS THAT APPLIES THE CHANGE.** A generated file is only
> authoritative between regenerations, and the window is invisible: the file has no way to
> say it is behind, the banner asserts the opposite, and the git diff shows nothing because
> nothing was committed. Applying a JTA change and regenerating are one step.

---

## 9. WHAT v1.0 THROUGH v1.2 LOST, AND IS NOT RECOVERABLE

**No version of this JTA before v1.3 was ever committed to a repository.** Neither was
`SM-AI-II_BoK_v1.1.md`. The following is **gone**, and this section exists so that no
future reader mistakes the surviving summary for the whole record.

> **THIS SECTION IS ABOUT LOSS, NOT ABOUT CORRECTION, AND THE TWO ARE DIFFERENT KINDS OF
> ENTRY.** Everything below is material that existed and cannot be produced. §8.5 is the
> opposite case: nothing was lost, and seven claims that were wrong when written were
> found and corrected before anything was built on them. A version history that files
> both under one heading teaches its reader that a corrected record and an incomplete one
> are the same condition. They are not — one is recoverable by work and the other is not
> recoverable at all.

**The 45th task.** v1.0 had 45 tasks; v1.1 has 44 after *"2 cuts · 1 addition."* **Which
two tasks were cut, what they said, which domains they sat in, and what the addition was
— unrecorded anywhere.**

**Three of the four demotions.** v1.1 records *"3 demotions"* and v1.2 *"1 demotion."*
Only v1.2's is documented, as task 2.8, and even that is inferred from §4.1's worked
example plus arithmetic rather than stated. **v1.1's three are unknown.**

**Five rewrites.** v1.1 records *"5 rewrites."* Which tasks, and from what to what,
unrecorded.

**Grok's actual review returns.** `CERT-CREATION.md` Stage 3 requires that each
suggestion be **accepted or declined with explicit reasoning** — *"Grok is a reviewer, not
an authority; we integrate what improves rigor and defend what doesn't."* **None of that
reasoning survives.** Only its net effect on the numbers, in §3's table.

**Domain-weight rationale for D1 through D4.** Only D5's 22.5% is defended, in
`SCHEME-SM-AI-II.md` §4: *"the AI half of a Scrum Master's context is where the Guide is
most silent and where practitioner habit is least tested."* **Why D3 is 17.5% and the
other three are 20% is nowhere.**

**The never-assert list as v1.2 numbered it.** See §7.2. The content is reconstructible
from code; the ordering and the entry numbers are not.

**The Body of Knowledge, almost entirely.** `jta/ISMS-IA_BoK_v1.md` is the shape a Level
II BoK takes in this catalogue — eleven sections. For SM-AI-II only fragments survive:
the *"second job, not a harder first one"* argument is reconstructible from
`SCHEME-SM-AI-II.md` §5.1, and §5.2's inert Screen 1(b) is named. **Gone: the source
stack, the attribution map, the scope boundary, the falsification test, the volatility
register, and the sign-off record.**

> **The falsification test is the one that hurts.** It is the section that states what
> would have disproved the scheme's premise. A Level II credential over the same job
> title as a Level I one rests on a competence-class distinction, and the document
> recording what would have shown that distinction to be false is the document an
> assessor would ask for first.

**None of this is reconstructed here.** A version document that silently omits what it
lost pretends the record is complete, and this scheme's own style guide forbids exactly
that move against the Scrum Guide. It applies to its own paperwork.

---

## 10. NEXT

- ~~**Author the BoK.**~~ **DONE 2026-09-10.** `jta/SM-AI-II_BoK_v2.0.md`, eleven
  sections against `jta/ISMS-IA_BoK_v1.md`. `v1.1` is not recovered and its lineage is
  not continued. **§7, the falsification test, is the one section with no surviving
  source** — it was authored, not reconstructed, and it measures Screen 1(b): 13 of 44
  tasks Guide-determined, so **70% have a key the Guide does not determine.** The scope
  boundary was already written, in `SCHEME-SM-AI-II.md` §2 and §2.1.
- ~~**Fix `item-profile.mjs`.**~~ **DONE 2026-09-10.** `profileFor(certName, tier)`
  resolves tier first. The last Stage 9 blocker; see §7.4 for what it could and could not
  have done. **Item generation is no longer gated on code** — it is gated on the item
  floors and on loading the 44 lessons, in that order, because `coverage.tested` counts
  concepts reached through `question_concepts` and only the PRACTICE pool writes those.
  **Generating practice before the lessons load flips `untaught_testing_violations` from
  0 to 131.**
- **Decide whether the never-assert list reaches Level I.** Three shipped banks were
  generated without one. Scoped decision with its own review; regenerating those banks is
  the cost.
- **Modules 3 through 5**, 26 lessons, to `STYLE-GUIDE-SM-AI-II.md`. Modules 1 and 2 are
  authored, nine lessons each.
- ~~**`CERT-PUBLISH-CHECKLIST.md` has no step for the `jta_versions` row.**~~ **DONE.**
  Migration 277 recorded that *"ten certs have each rediscovered it"*; SM-AI-II was the
  eleventh. The checklist now carries it as §6 step 3, *"Write the `jta_versions` row"*.
- **At launch, a `v2.0` row.** The house rule in migration 211 is that every scheme's JTA
  becomes `v2.0` on locking for launch. `v1.3` and `v1.4` are working versions on a
  `draft` certification. **All three rows coexist and exactly one is published**, which is
  the retire-then-publish transition `public.publish_jta_version()` has shipped since
  migration 062: `v2.0` is inserted published and `v1.4` moves to `retired`. **A v2.0 row
  cannot be added “alongside” a published v1.4** — the partial index
  `jta_versions_one_published` refuses it, and `score-mock-exam` calls `maybeSingle()` on
  `status = published`, so two published rows throw rather than pick.

---

*End of SM-AI-II_JTA_v1.4. Factual content lives in `jta/SM-AI-II_JTA_generated.md`;
regenerate it after any scaffold change and let the git diff be the change record.
v1.4 is the version that found out what happens when you do not — see §8.5.*
