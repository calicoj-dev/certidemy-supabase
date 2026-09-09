> ## FACTUAL CONTENT IS NOT IN THIS FILE
>
> **The authoritative JTA for SM-AI-II is `jta/SM-AI-II_JTA_generated.md`**, rendered
> from the live database by `scripts/gen-jta-doc.mjs`. Domains, weights, tasks, Bloom
> levels, K/S/A, concept slugs, exam facts and the cognitive profile are all there and
> none of them is here. Regenerate that file rather than reading or editing tables.
>
> Generated 2026-09-09, 44 tasks, 766 lines. It is the first JTA in the catalogue whose
> generated half existed before any hand-written half, which is the right way round and
> was an accident.
>
> **This file carries only what a query cannot reconstruct**: the design screens, the
> lock gate, the review history, what changed and why, and what the record has lost.
> Read it for the *why*, never for the *what*.

# SM-AI-II — Job-Task Analysis v1.3

**Credential:** Scrum Master II — AI
**Code:** `SM-AI-II` · **Tier II** · Family `ai-agile`, status `draft`
**Locked:** v1.2 locked 2026-09-02 · **v1.3 supersedes it 2026-09-09**
**File:** `supabase/jta/SM-AI-II_JTA_v1.3.md`
**Supersedes:** v1.0, v1.1, v1.2 — **none of which was ever committed to a repository.**
See §9.
**Companions:** `jta/SM-AI-II_JTA_generated.md` (authoritative for facts) ·
`SCHEME-SM-AI-II.md` · `STYLE-GUIDE-SM-AI-II.md` · `scripts/lib/item-grounding.mjs`
(`SCRUM_GUIDE_FACTS` — see §7)
**Recorded in:** `public.jta_versions`, migration 284, `version_string` `v1.3`,
`status` `published`, snapshot projected from live rows.

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

## 2. THE LOCK GATE, RESTATED AGAINST v1.3

**v1.2 would lock only if the computed profile reached `analyze >= 55%` with
`remember = 0`.**

| | analyze | remember | clears by |
|---|---|---|---|
| **at v1.2 lock (2026-09-02)** | 61.49% | 0 | **6.49 points** |
| **at v1.3 (2026-09-09)** | **63.72%** | **0** | **8.72 points** |

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

---

## 6. WHAT IS CARRIED INTO STAGE 7 AND STAGE 9

- **Stage 7 — 44 lessons.** Module 1 is authored and externally reviewed;
  `STYLE-GUIDE-SM-AI-II.md` is the delta that review produced. Modules 2–5 outstanding.
- **Stage 9 — the item bank.** Floors are 8 secure and 10 practice per in-scope task per
  language: **1,056 secure and 1,320 practice** at the floor across three languages.
- **One Stage 9 pre-condition remains open.** See §7.2.

---

## 7. THE NEVER-ASSERT LIST — HELD IN CODE, NOT IN THIS FILE

### 7.1 Where it is

**The 26 never-assert entries are held in `scripts/lib/item-grounding.mjs`, in the
constant `SCRUM_GUIDE_FACTS`.** Counted 2026-09-09:

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

**STILL OPEN.** `scripts/lib/item-profile.mjs` resolves `profileFor(certName)` from the
certification **name** and takes no tier argument, so this certification inherits
`SM-AI-I`'s Level I tier profile. **Must be fixed before any item is generated.**

---

## 8. CHANGES FROM v1.2

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

## 9. WHAT v1.0 THROUGH v1.2 LOST, AND IS NOT RECOVERABLE

**No version of this JTA before v1.3 was ever committed to a repository.** Neither was
`SM-AI-II_BoK_v1.1.md`. The following is **gone**, and this section exists so that no
future reader mistakes the surviving summary for the whole record.

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

- **Author the BoK.** `SM-AI-II_BoK_v1.1.md` cannot be recovered; a `v2.0` written fresh
  against `jta/ISMS-IA_BoK_v1.md`'s eleven sections can be. **The falsification test and
  the scope boundary are the two that carry accreditation weight.**
- **Fix `item-profile.mjs`** to resolve the tier profile per certification rather than by
  name. Last Stage 9 blocker. See §7.4.
- **Decide whether the never-assert list reaches Level I.** Three shipped banks were
  generated without one. Scoped decision with its own review; regenerating those banks is
  the cost.
- **Modules 2 through 5**, 35 lessons, to `STYLE-GUIDE-SM-AI-II.md`.
- **`CERT-PUBLISH-CHECKLIST.md` has no step for the `jta_versions` row.** Migration 277
  recorded that *"ten certs have each rediscovered it"*; SM-AI-II is the eleventh, and the
  checklist still has no step.
- **At launch, a `v2.0` row.** The house rule in migration 211 is that every scheme's JTA
  becomes `v2.0` on locking for launch. `v1.3` is a working version on a `draft`
  certification, and `jta_versions` is unique on `(certification_id, version_string)`, so
  both rows can coexist and should.

---

*End of SM-AI-II_JTA_v1.3. Factual content lives in `jta/SM-AI-II_JTA_generated.md`;
regenerate it after any scaffold change and let the git diff be the change record.*
