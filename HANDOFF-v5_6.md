# HANDOFF-v5.6 — AIMS-F from body of knowledge to seeded scaffold

**Session date:** 2026-08-06 (continuing)
**Status:** **CHECKPOINT, not a close.** The session continues after this file.
**Supersedes:** nothing. Read v5.3 + addendum, v5.4 and v5.5 first.
**Migration tip:** **177 applied** · next free **178**
**Repos:** both clean and pushed
**Commits this session:** `fd94355` · `9f4b0b8` · `9efb943` · `b18c934` · `9aaaba1`

AIMS-F went from a signed body of knowledge to a seeded scaffold with a computed
exam blueprint. Along the way v5.5's largest open item was closed, four documents
lost to the database, and one factual error was caught that had already passed an
external review.

---

## 0. WHERE THINGS STAND

**AIMS-F (ISO/IEC 42001 Foundation) — Stages 1 through 6 complete.**

| | |
|---|---|
| UUID | `de046fa6-e627-48c1-85d8-9df226d144f4` |
| Family | `governance-service-management`, `sort_order` **3** |
| Status | `draft` |
| Spine | 5 domains · **35 tasks** · **154 concepts** · **157 links** · 5 modules |
| Exam | 40 items · 80% · 60 min · blueprint 6 / 9 / 8 / 10 / 7 |
| `exam_blueprint` | written, **computed** from `tasks x domains` |

**Next: Stage 5, lesson authoring.** 35 lessons across five modules, then wire,
verify, translate. Several sessions.

### The number that validates the whole build

| cert | remember | understand | apply | analyze |
|---|---|---|---|---|
| ISMS-F | 10.39 | 56.77 | 22.68 | 10.17 |
| **AIMS-F** | **none** | **46.93** | **41.26** | **11.80** |

`AIMS-F_JTA_v1.3.md` §2 set this as its own falsification test: *if apply does not
land meaningfully heavier than ISMS-F, the JTA is describing a recall course and
needs rework before scaffold.* **Apply is 1.8x and there is no recall tier at all.**

**This also turns the ladder rule into a query.** *Two credentials need two jobs* -
the rule that shelved AIGRM-II - has only ever been argued in prose. Two Foundation
certs on adjacent standards now have visibly different cognitive profiles.
**Run this comparison first when ISMS-IA is built.**

---

## 1. THE ERROR THAT PASSED REVIEW

`AIMS-F_JTA_v1` taught that the axis separating the **AI risk assessment** (6.1.2)
from the **AI system impact assessment** (6.1.4) is *direction of harm* - risk to
the organization, impact on people.

**The standard contradicts this in two places:**

- 6.1.2 d) 1) has the risk analysis assess consequences to the organization,
  individuals **and societies**
- 6.1.4 requires impact assessment results to be **considered in** the risk
  assessment, with a reciprocal NOTE at 6.1.2

They are not parallel. **The impact assessment is an input to the risk assessment.**

### The four axes that actually separate them — task 2.7, defend this

| | AI risk assessment (6.1.2) | AI system impact assessment (6.1.4) |
|---|---|---|
| **Anchoring** | AI objectives | Deployment, intended use, **foreseeable misuse** |
| **Output** | Risk levels prioritised for treatment | Documented consequences |
| **Context** | Risk criteria (6.1.1) | Technical, societal **and jurisdictional** context |
| **Audience** | Internal | **May be released to interested parties** |

**Why this matters beyond one task.** The wrong version was *plausible*, survived a
review that confirmed five of six structural assertions, and would have become the
credential's headline competence taught in three languages. It was caught only by
reading clauses 6.1.2 and 6.1.4 directly.

> **A verification that cannot distinguish a read source from a remembered one
> produces confidence, not assurance.**

The Stage 3 packet now asks the reviewer to **declare the source in its first
line**, and the second review complied and cited clauses throughout.

---

## 2. FIVE THINGS THE STANDARD SAYS THAT SECONDARY SOURCES GET WRONG

All verified from ISO/IEC 42001:2023 itself.

| Claim | Reality |
|---|---|
| "38 controls in 9 objectives" | **9 categories (A.2-A.10) carrying 10 objectives.** A.6 splits into A.6.1 and A.6.2, each with its own objective statement |
| "Annex B is guidance" | **Annex B is NORMATIVE.** B.1 exempts only the guidance itself from SoA justification |
| "provider / developer / user" | **Six categories**: AI providers, AI producers, AI customers, AI partners, AI subjects, relevant authorities. Developer is a subtype of *producer*. And 4.1 makes role determination a **`shall`** |
| — | **Climate change is an explicit `shall`** in 4.1, with a matching NOTE in 4.2 |
| — | **Clause 8 restates** risk assessment, treatment and impact assessment as *operational* duties (8.2/8.3/8.4). Clause 6 defines; clause 8 performs |

Control count verified by category: 3+2+5+4+9+5+4+3+3 = **38**. Confirmed
independently by the external reviewer reaching the same total.

**Clause 6.3 Planning of changes** was found untaught at Stage 3 and added as a
concept on task 2.3. **Unlike ISMS-F's Finding 3, there was no excuse** - 27001
omits its 6.3 from its own contents page; 42001 lists it plainly. D2 was mapped to
clauses 4-6 and a clause in that range was skipped.

---

## 3. THE ATTRIBUTION RULE — closed, and UNTESTED

v5.5 §2 called this *"the largest outstanding correctness item."* `9aaaba1` closes
it, **before AIMS-F has generated a single item.**

`scripts/lib/item-pipeline.mjs`, three edits following the existing
`CUE_NEUTRALITY_RULES` pattern:

1. `export const ATTRIBUTION_RULES` after the `item-cue-guard` import
2. interpolated into `draftSystem` after PARALLEL OPTIONS
3. **numbered check 7 in `critiqueSystem`**, so the reviewer enforces what the
   drafter was told

385 lines to 422, LF preserved, `parsed OK`, 1,194 characters exported.

### Two design decisions worth keeping

**Conditional on standards-based subject matter.** The pipeline also serves
SM-AI-I and AIE-I, where *"the standard"* is not a thing. An unconditional rule
would fire noise on most of the catalogue.

**A distractor MAY be a false attribution; the key and explanation may not.** A
false attribution is exactly the wrong mental model a candidate holds, which makes
it a *good* distractor. Forbidding it everywhere would blunt distractor quality -
the pipeline's own stated priority at lines 157-161.

### It is not proven to work

**Nothing has generated an item through it.** The const parses; that is all that is
established. ISMS-F's generator reasserted a false attribution across **three**
regeneration attempts *from corrected source fields* - the model's ISO prior
overrides clean input.

> **First generation run on any cert: `MAX_TASKS=1`, read the eight items.** The
> prompt changed today. That rule exists for exactly this moment.

---

## 4. FOUR DOCUMENTS LOST TO THE DATABASE

Every one cost a failed paste or a wrong assertion.

| Doc | Said | Live |
|---|---|---|
| `CERT-SCHEMA-GUIDE` §1 | 4 families, `governance` | **6 families**, `governance-service-management` |
| `CERT-SCHEMA-GUIDE` §2 | `is_published` exists | **Dropped by 069-part-2.** Plus six columns never listed: `price_usd`, `exam_link`, `exam_blueprint`, `max_exam_attempts`, `attempt_window_months`, `validity_days` |
| `CERT-SCHEMA-GUIDE` §6 | slug matches the folder name | **Also GLOBALLY UNIQUE.** `modules_slug_unique` is table-wide, not scoped to `certification_id` |
| `CERT-SCHEMA-GUIDE` §7 | *(believed stale)* | **Already correct.** A cached snapshot was read as current and the guide was wrongly accused |

§1 and §6 patched this session. **§2 was already fixed by another session** - the
patch script's anchor guard caught that and refused to overwrite better-sourced
wording. That is the second time today an anchor check prevented a regression
rather than merely a mismatch.

> **Query `information_schema.columns` before writing a scaffold.** A scaffold is a
> single transaction: one bad column name rolls back the whole file.

**And the `/mnt/project/` upload is a snapshot, not the working tree.** One patch
this session was built from it and failed all its anchors. **Dump the repo copy.**

---

## 5. SCAFFOLD CRAFT

**Generate the migration, do not type it.** `176_seed_aims_f.sql` was emitted from
the JTA data by a script that asserts its own counts. 35 tasks, 154 concepts, 157
links, weights summing to 100.0, **zero non-ASCII across 71KB** - which matters
because §8 says the editor corrupts multibyte characters in large pastes.

**`aims-` prefix on every module slug**, because of the global constraint. Folders:
`content/aims-f/01-aims-and-the-ai-landscape/` and so on. **Prefix module slugs on
every future cert** - the constraint will not stop being global.

**Keep the `begin`/`commit` wrapper.** 176 failed on `is_published` and rolled back
cleanly; 177 failed on the slug collision and left nothing partial. Atomicity turned
two schema surprises into two retries instead of two cleanups.

**`exam_blueprint` stays NULL at scaffold** and is written afterwards from the
computed profile - never from the JTA's authored table. Nine keys, matching
ISMS-F's shape.

---

## 6. SWEEPS THAT FLAG THEMSELVES — five instances today

v5.5 §6 already recorded this. It happened five more times, every time in a check
**I** wrote:

- old slug "still present" - it was the changelog recording the rename
- `is_published` "still present" - it was the comment explaining the drop
- `evaluation-improvement-certification` "still present" - the comment explaining
  the collision
- "expect exactly 1" - forgot the rename was recorded in two places
- a regex needing two characters where the file had a space and a backtick

**Three times a defect was reported that did not exist.** Each cost a verification
round.

> **A sweep must describe the POST-FIX state.** Check for the *column-definition*
> pattern, not the bare word. Check absence in the code region, not in the file.

---

## 7. COMMITS

### `supabase`

| commit | what |
|---|---|
| `fd94355` | JTA v1.2 - attribution rule in the JTA, four K fields corrected |
| `9f4b0b8` | Stage 3 closed - JTA v1.3 teaches clause 6.3, 4.6 modal fixed, review packet |
| `9efb943` | Stage 6 scaffold - migrations 176/177, `SCHEME-AIMS-F.md` |
| `b18c934` | `CERT-SCHEMA-GUIDE` §6 - modules.slug is globally unique |
| `9aaaba1` | item-pipeline `ATTRIBUTION_RULES` + critique check 7 |

Earlier: `610665b` BoK, `16f1d7f` Stage 1 locked.

---

## 8. CARRY INTO LESSON AUTHORING

**1. The PDF open in another window, during authoring, not after.** All three
ISMS-F content defects were the same shape: *true and well taught, attributed to
text that does not say it.* A second window would have caught every one.

**2. Table A.1 is the highest-risk text in the standard.** Short, memorable,
recognisable on sight - and style guide §1 says explain, never define. ISMS-F
shipped five near-verbatim ISO definitions in its first module draft and the
external review then asked for *tighter* alignment. **Run the guard on every
module.**

**3. Task 2.7's four axes must survive contact with lesson prose.** *Direction of
harm* is the intuitive framing and it is wrong. §1 above.

**4. `1_remember` is structurally impossible here, not merely discouraged.** Clause
2 makes ISO/IEC 22989:2022 a normative reference and clause 3 delegates terminology
to it, so **there is no definition of "AI system" inside 42001 to recite.** Teach
the boundary question - *is this thing in scope of our AIMS?* - as a competence.

**5. Attribution in the K fields propagates.** ISMS-F's task 5.2 `skills` phrasing
put a false attribution into generated items. **`ksa_is_provisional` still has no
approval path and `verify-cert` does not check it.**

---

## 9. OPEN LOOPS

### New

1. **The attribution rule is untested.** §3. First `MAX_TASKS=1` run is the test.
2. **AIMS-F needs a `jta_versions` row.** Migration 106 covered six certs, 175
   covered two. AIMS-F is the ninth. **Add it to `CERT-PUBLISH-CHECKLIST.md` as a
   step** while it is fresh (v5.5 §9.5 asked for this and it is still owed).
3. **AIGRM-I discrimination copy**, three languages, reciprocal. AIGRM-I and
   AIMS-F now sit at positions 1 and 3 of the same family and a buyer must tell
   them apart in one line. **Ships in a migration - it changes a live cert.**
4. **The Stage 3 attribution sweep was spot-checked, not exhaustive.** The reviewer
   said *"the K fields examined."* Worth one pass with the PDF before items exist.
5. **`price_usd` is 0** on AIMS-F. Harmless while `draft`; real before publish.

### Carried, still open

6. **The ISMS-F attribution audit** (v5.5 §2 item 2). The rule now prevents new
   defects; **it does not repair the ~2,646 existing items.** Sweep for
   `requires|exige|shall` near `27001|the standard` with the PDF open.
7. A queryable migration tip. Two sessions collided on 174; the tip still lives in
   prose.
8. `ksa_is_provisional` has no approval path; 98 rows unreviewed.
9. Seven `SCHEME-*.md` carry bare `17024`. **ISMS-F and now AIMS-F are pinned.**
10. Formulation drift (v5.4 §8.8, v5.5 §8.6) - still needs a ruling.
11. Everything in v5.4 §8.

---

## 10. THE LESSON

v5.5 §10 said the invariants cannot see whether a claim is true. This session shows
what to do about it, and the answer is not another invariant.

**Task 2.7 was wrong, plausible, and passed a review.** It was caught by opening
the standard and reading two clauses. The corrections in v1.2 - four K fields
attributing to the wrong document - were caught the same way. Clause 6.3 was caught
by a reviewer who *declared they had read the PDF* and then walked the contents
page.

The `ATTRIBUTION_RULES` const is worth having and it will prevent a real class of
defect. **But it is a prompt, and the thing it guards against is a model asserting
plausible-sounding domain knowledge - which is what a prompt is made of.** ISMS-F's
generator needed three attempts to stop doing it from corrected input.

> **The primary source, open, during the work. Everything else is a control on top
> of that, not a substitute for it.**
