# HANDOFF v9.4 — SM-AI-II through Stage 6, and four things the build broke on the way

**Migration tip: 278. Next free: 279.** Read the disk, not this line —
`ls migrations/ | tail -1`.

**Pushed.** `certidemy-web` `07fef68`, `efe0f31`. `certidemy-supabase` `709acb5`,
`cc9bde2`, `e3eb533`, `34d5dc4`.

**Thirteen certifications now exist.** Not eleven — that count has been wrong in
every handoff since v7.1, and nothing counts the rows. Twelve were live before
this session; SM-AI-II is the thirteenth and sits at `draft`.

A new certification was built from nothing to a verified spine: body of
knowledge, job-task analysis through two adversarial review passes, 44 tasks,
131 concepts, a computed cognitive profile that cleared its own kill switch, and
a blueprint that equals the view it was derived from.

**But the more durable output is the four defects the build hit in shared
tooling, none of which are specific to this certification and all of which would
have hit every subsequent tier-2.**

| what broke | why it had never surfaced |
|---|---|
| `apply.ts` inserting domains row-at-a-time | every prior cert was seeded by migration, where domains land in one transaction |
| `cert.yml` omitting `price_usd` | `plan.ts` resolves an omitted field with `?? null`; the column is NOT NULL |
| `verify-grounding.mjs` computing a leak and discarding it | a guard that never fires produces no evidence of not firing |
| the Level II item contract with no defined arbiter | "a competent practitioner" was never anyone in particular |

---

## 1. SM-AI-II — where it stands

**Scrum Master II — AI.** `a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46`, family `scrum`
#4, status **`draft`**, **tier 2**.

| | |
|---|---|
| Spine | 5 domains · 5 modules · **44 tasks** · **131 concepts** · **132 links** |
| Exam | 50 items · **75%** · 150 min (3.00/item, the tier-II floor) · 365 days |
| Profile | remember **none** · understand **none** · apply **38.51** · analyze **61.49** |
| Blueprint | written from `v_cognitive_profile`, drift 0.00 on both levels |
| Lessons | **zero** |
| Item banks | **zero** |

**Stages 1–6 complete. Stage 7 is 44 lessons and has not started.**

### 1.1 The tier argument, because it is the whole credential

The 2020 Scrum Guide, *Scrum Definition*:

> The Scrum framework is purposefully incomplete, only defining the parts
> required to implement Scrum theory.

**Cite that sentence verbatim in `SCHEME-SM-AI-II.md`. Do not paraphrase it.** It
is the load-bearing claim of the tier.

`SM-AI-I` certifies that a holder knows what the Guide defines. `SM-AI-II`
certifies that they act competently in the space it deliberately leaves open.
Same role, different competence class — which is what makes it survive the rule
that shelved AIGRM-II. **17024 requires two sets of competence criteria, not two
job titles.** *Same title, different competence class* is permitted; *same
competence, harder items* is not.

### 1.2 The two screens, applied as rejection rules during authoring

**SCREEN 1 — Disjointness.** (a) No `SM-AI-I` task covers it, **and** (b) **the
Scrum Guide constrains the answer but does not determine it.**

> The first form of (b) — *"adding it to SM-AI-I would force that credential's
> declared Bloom up"* — **was inert.** SM-AI-I already declares Analyze on 11.49%
> of its weight against a `4_analyze` MCQ ceiling, so an Analyze task can be
> added without raising anything. The control could not fire for exactly the
> tasks it existed to filter, **while reading as rigorous.** Corrected before
> lock; `SM-AI-II_BoK_v1.1.md` §5.2 still carries the inert text and is owed the
> replacement.

**SCREEN 2 — Framework conformance.** A best answer that violates a Guide rule is
rejected, not reworded.

**Together: constrains but does not determine.** Determined → Level I.
Unconstrained → invention.

### 1.3 The number, and how it got there

| version | analyze | tasks | what moved |
|---|---|---|---|
| JTA v1.0 | 68.88 | 45 | first draft |
| JTA v1.1 | 63.72 | 44 | 3 demotions · 2 cuts · 1 addition · 5 rewrites |
| **JTA v1.2** | **61.49** | **44** | 1 demotion · never-assert 23 → 26 |
| **computed live** | **61.49** | **44** | **matched the hand arithmetic to the hundredth** |

**Down 7.39 points across two adversarial passes, and no verb was raised
anywhere to compensate.** That is the only defence offered for the number, and
it is now also confirmed by the database. Kill switch was `analyze >= 55` with
`remember = 0`; it cleared by 6.49.

Peer context, **queried from `v_cognitive_profile` rather than read off a
document**: AIHR-I **21.33** (heaviest tier I) · ISMS-IA **65.60** · AIMS-IA
**69.48**.
Below both Internal Auditors, which is honest — auditing *is* more
analyze-dominant than coaching.

### 1.4 Two rules that fell out of review and generalise to every future JTA

> **A task statement that enumerates its own answer set is Apply, not Analyze.**

Task 2.8 printed its three causes — *impediment, capability gap, self-management
failure* — inside the statement, which makes any item a taxonomy lookup no matter
how the stem is dressed. **Checkable by reading statements. No items required.**

> **A never-assert entry must ship with its inverse.**

Forbidding *"the Definition of Done may be relaxed for AI-generated work"* alone
teaches the generator to assert *"generated work cannot be Done"* — equally
false, harder to catch because it sounds cautious. Entries 14 and 26 are a pair.

### 1.5 What is item-writing debt rather than JTA debt

Nine tasks carry ⚠ item constraints where the residue is thin: **1.1, 1.3, 2.4,
2.8, 3.1, 3.6, 4.7, 5.2, 5.6.**

> **A thin-residue task with a lazy stem produces a Level I item inside a Level
> II form, and NO STRUCTURAL INVARIANT CATCHES IT.** Not the firewall, not the
> coverage view, not the cue guard, not invariant 17. It is a content property,
> enforceable only in the grounding entry and the critique pass. **If
> `item-grounding` cannot carry the ⚠ lines, the affected tasks get cut then —
> not pre-emptively now.**

---

## 2. The ingest path created a certification from empty for the first time

`CERT_YML_SPEC.md` has claimed since it was written that the yml is canonical and
the database is a projection of it. **Before this session that had never
happened.** SM-AI-I was the only cert with a `cert.yml`, and that file was
*re-derived from a database that then moved* — its own header says the database
is the source of truth, the inverse of the spec, and its collections are stale
enough that a plan proposes ~42 deletions.

**SM-AI-II is the first certification authored file-first.** 317 operations
applied, and the check that matters is not the counts:

```
re-plan immediately after apply:
  certification: no changes   domains: no changes   concepts: no changes
  tasks: no changes   task_concepts: no changes   modules: no changes
```

Counts would not catch a wrong `weight_pct` or a mis-mapped `domain_id`. A
re-diff of every carried field returning zero ops means the applied state matches
the blueprint **value for value.**

### 2.1 The defect that had been waiting for this moment

```
insert domain D1
  Domain weights for certification a7f3c9d2-… sum to 20.00, must equal 100
```

`trg_domain_weights_sum` (`003_jta_curriculum.sql:77-80`) is a **CONSTRAINT
TRIGGER, DEFERRABLE INITIALLY DEFERRED** — it evaluates at COMMIT. That is what
lets a seed migration insert five domains in one transaction and pass; 003's own
comment says *"we attach the trigger DEFERRABLE so seed-inserts work as a
batch"*, and `205:100-102` inserts its five domains as one statement for exactly
this reason.

**`apply.ts` issues one PostgREST call per row and each call commits alone.** So
the deferred check fired on the commit of D1, saw 20.00, and raised. **The
blueprint was correct.** The seeded-by-migration path and the ingest path
disagreed about transaction boundaries, and nothing had ever exercised the
second one from empty.

**Fixed in `07fef68`:** `KindConfig.batchInsert`, set on `domain` only. One call,
one transaction, one deferred evaluation with all five present. Concepts, tasks
and modules keep the row-at-a-time path byte-for-byte.

**Confirmed against `pg_trigger`, not the migration files:**
`trg_domain_weights_sum` is the **only** constraint trigger on `domains`,
`concepts`, `tasks`, `modules`, `task_concepts` or `certifications`, and the only
one deferrable or initially deferred. **Batching domains is the whole fix, not
the first of several.** The file-based answer could not have established that —
migration 246's trigger register was captured 2026-08-24 and this repo is
editor-first, so anything created in the editor since is invisible to both a grep
and the register.

**The limit, recorded in the code rather than only here:** a single-row domain
`weight_pct` update, or a domain delete, still commits alone and still trips the
trigger. Unreachable today; reachable the first time a shipped blueprint is
reweighted. **Not fixed, deliberately** — a domain weight is a change-controlled
scheme fact that re-cuts the exam form for every future candidate and invalidates
comparison with every form already sat. It belongs in a numbered migration.
**Refusal is correct behaviour; refusing with a bare sum error is not**, because
it sends the reader to check arithmetic that is already correct.

### 2.2 Omitting an optional yml field is not "leave it alone"

The first dry-run proposed one certification update: `price_usd` from `0` to
`null`. `cert.yml` omitted the field, `plan.ts:471` resolved the omission with
`?? null`, and **`price_usd` is NOT NULL DEFAULT 0** — the update would have
failed on a real apply, possibly after some of the 317 inserts had landed.

**Generalised, and it belongs in `CERT_YML_SPEC.md`:** any NOT NULL column that
`plan.ts` carries and the yml omits will be nulled. There are **four** `?? null`
fields in that object — `description`, `exam_link`, `difficulty_level`
(`:470`) and `price_usd` (`:471`) — and only `price_usd` has a NOT NULL column,
so there is no second instance today.

**Two related findings, neither fixed:**

- **`exam_link` is in `ySide` and in the insert payload but absent from
  `diffFields`.** The importer can create it and can never subsequently change
  it.
- **The insert branch is where the NOT NULL class actually bites.**
  `plan.ts:473-479` sets `payload: ySide` — all ten fields including nulls — and
  a column default does not rescue an explicit null. **That is the branch a
  genuinely new certification takes**, and it is the same branch that forces
  `status: "available"`.

### 2.3 The order that should be the pattern

**`apply.ts:370` forces `status: "available"` on insert, and `cert.yml` has no
status field.** An ingest-created certification publishes itself, empty, the
moment it exists. So:

```
migration: certifications row only, status 'draft', tier 2, blueprint NULL
   -> content:validate
   -> content:apply dry-run, confirm the certification op reads UPDATE not INSERT
   -> content:apply --apply
   -> compute v_cognitive_profile          <- THE KILL SWITCH
   -> migration: exam_blueprint, written FROM the computed profile
```

**This inverts 205's order and it should be the pattern for every subsequent
tier-2.** 205 pasted a blueprint computed before any row existed, then added a
proof block recomputing the profile and demanding it match, headed *"IF THIS
DISAGREES WITH THE BLUEPRINT, STOP"*. **That check is only necessary because the
blueprint came first.** 278 uses 190's construction — `jsonb_object_agg` straight
from `v_cognitive_profile`, no percentage typed anywhere — so **invariant 17
holds by construction rather than by inspection.** 190's header states the rule:
*a hand-typed number is a second declaration reconciled with nothing.*

Same rule kept `bloom_distribution` out of `content/sm-ai-ii/cert.yml`.
`content/sm-ai-i/cert.yml` still carries the inherited **15/35/35/15** against a
live computed profile of **15.65 / 30.50 / 42.37 / 11.49**, with a comment
claiming generation targets it. The field is optional and `validate.ts` never
reconciles the two.

> **This document originally printed that profile as 12.3/33.8/31.6/22.3, and
> the 22.3 in §1.2 and the SD-AI-I 30.30 in §1.3 came from the same place.** All
> three were read off `jta/COGNITIVE-MODEL.md:187-193` rather than queried from
> `v_cognitive_profile`. That table introduces itself as *"Derived from
> `tasks.bloom_level` weighted by `domains.weight_pct` … These are not choices.
> They are what the JTAs already say"* — a present-tense claim to BE the view,
> carrying no date and no snapshot marker. **All five of its rows are now wrong
> against the view**, e.g. AIE-I reads 0/70.0/30.0/0 and computes
> 16.23/51.37/32.40/0. The document-versus-view drift is still there and is
> still catching readers: 30.30 travelled from `HANDOFF-v6_2.md:42` through
> `jta/ISMS-IA_JTA_v2.0.md:316` into `migrations/277:241` and then into this
> file, relabelled *"heaviest L1"* at every hop and wrong at every hop.
> **Invariant 17 checks the blueprint against the view; nothing checks a
> markdown table against it.**
>
> **AND THE SESSION THAT SOURCED THOSE THREE FIGURES HAD QUOTED THE WARNING
> AGAINST DOING IT.** `HANDOFF-v6_1.md` §3.1, *"No number is written into the
> page"* (**not in this repository — see the carried finding in §5**):
>
> > *"COGNITIVE-MODEL.md lists SPO-AI-I at 4.0/34.0/50.5/11.5; HANDOFF v3.0
> > records 1.9/36.9/52.7/8.5; the live view says 1.88/36.87/52.71/8.54. Two
> > documents, one database, and the database is right. A number typed into
> > marketing copy is a second declaration reconciled with nothing — exactly the
> > defect the cognitive model exists to prevent."*
>
> **All three of its figures check out, and the live pair still holds.** Queried
> 2026-09-03: SPO-AI-I is **1.88 / 36.87 / 52.71 / 8.54**, unchanged.
> `jta/COGNITIVE-MODEL.md:192` still reads 4.0/34.0/50.5/11.5. The v3.0 figures
> are recoverable at `HANDOFF-v3_0.md:128-129` in git history (`d5aa79e^`,
> before that file was deleted), reading *"SPO-AI-I published a Bloom
> distribution of 15/35/35/15 where the computed profile is 1.9/36.9/52.7/8.5."*
> **So the warning was correct, was written down, was quoted, and was then not
> followed within the same session** — which is the argument for a checker rather
> than a paragraph.

---

## 3. The Level II item contract had no arbiter

`L2_CONTRACT` turns on **"a competent practitioner"** four times, always as the
judge of whether the second-best option is defensible. **Nothing anywhere said
who that is.** The pipeline's only model of a candidate is the binary in
`personaLine` — competent versus unprepared — with nothing between, **which is
exactly the region the second-best option is supposed to occupy.**

A case-insensitive search of all of `scripts/` for `borderline`, `minimally
competent`, `MCC`, `just-passing` and `cut score` returned **zero hits when it
was run — before `e3eb533` and `34d5dc4`.** Re-run today it hits
`item-grounding.mjs` and `verify-grounding.mjs`, and both hits are those two
commits putting the term there. Both Level II banks — ISMS-IA 912 secure,
AIMS-IA 960 — were generated without it. The
auditor certs get a borderline person implicitly from ISO 19011's competence
clause; **SM-AI-II has no such source, and judgment is the entire credential.**

### 3.1 The MCC, and what is actually blocked

Standard setting has three stages and all five scheme docs describe them as one:

1. **Define the borderline candidate.** Prose, per scheme. **Needs no candidate
   data.**
2. **The Angoff panel.** *Of 100 borderline candidates as defined, how many
   answer this correctly?* **Needs items and judges — not candidates.** Counted
   rather than asserted: **6 of 11** certifications hold 1,100 or more secure
   items — AISM-I 1470, SM-AI-I 1407, AIGRM-I 1377, SPO-AI-I 1191, ISMS-F 1185,
   SD-AI-I 1113. The other five run 438 to 960. **"Most certs" is true by one
   cert**, which is thinner than the phrase reads.
3. **Validate against candidates.** Item statistics, reliability, observed pass
   rates. **This** is what needs live operation.

> Every scheme doc says standard-setting is pending because it *"requires real
> candidate data that does not yet exist."* **That is true of stage 3 only.** The
> constraint on stage 2 is a panel of independent SMEs, which is a recruiting
> problem, not a traffic problem.

**Writing the definition after seeing pass rates is reverse-engineering a
justification for a number already chosen.** The eleven live certs get theirs
written *before* any candidate data arrives — retrospective to their item banks
is unavoidable and fine; retrospective to seeing performance is not.

**SM-AI-II is the only cert that can have it prospectively**, and it did.

### 3.2 It went into the grounding, not a scheme appendix

An MCC definition describes what the borderline candidate **gets wrong**, which
is the raw material for distractors. The recon question was whether the pipeline
had a slot for it. It does, with precedent:

| slot | reaches draft? | reaches critique? |
|---|---|---|
| `groundingFor()` return string | yes, `:369` | yes, `:453` |
| `profileFor()` difficulty prose | yes | **no** |
| a new `profileFor()` key | inert until a prompt builder changes | no |
| `exam_blueprint.item_model.*` | **no** | **no** |

**The grounding string is the only slot reaching both prompts**, it is in scope
at the same moment the model is told the second-best must be defensible, and
`WORKPLACE` already carries a candidate description for AIE-I.

**`WORKPLACE` is also the form.** It does *not* prepend a candidate block: the
subject scoping is one clause, **the candidate is the second sentence**, and the
scenario paragraph plus three of four hard constraints refer back to it. The
candidate does the work; the scoping opens the door.

### 3.3 Compose, do not extend — `e3eb533`

`\bscrum\b` is the **first** branch in `groundingFor` and matches **four**
certifications. Editing `SCRUM` would silently change generation on three shipped
Level I banks. So:

```
SCRUM_CORE          the original six lines, value untouched
SCRUM_GUIDE_FACTS   the never-assert list. TRUE AT EVERY TIER.
SCRUM_L2_JUDGMENT   the borderline candidate. Genuinely tier-specific.
SCRUM_L2_TAIL       the silence rule
SCRUM_L2 = CORE + GUIDE_FACTS + L2_JUDGMENT + TAIL
```

Same shape as `auditGrounding(criteria)`. **Verified byte-identical by hash
before and after** — `19fd62c9…`, 484 chars — for all three Level I Scrum names.

**`groundingFor(certName, tier = 1)`.** `\bscrum\b` cannot tell "Scrum Master I"
from "Scrum Master II" without matching a numeral, and routing a *tier* decision
off a naming convention is the defect v6.9 fixed one layer down in this same
file. **The protection for three live banks lives in the caller** —
`gen-cert-secure.mjs:408` reads `Number(certRow?.tier ?? 1) || 1` from the row.

**`SCRUM_GUIDE_FACTS` is deliberately not Level II material.** *"Only the Product
Owner may cancel a Sprint"* is as true for SD-AI-I as for SM-AI-II. **The three
Level I banks were generated against a SCRUM string with no never-assert list at
all**, which is very likely a real quality gap in shipped banks. It is defined
and named but reaches `SCRUM_L2` only — wiring it into Level I changes generation
on three live certs and is a scoped decision with its own review.

### 3.4 The borderline Scrum Master, in one paragraph

**Experienced, not shaky.** Two to five years, several teams, at least one
organization that did Scrum badly. Would pass Level I comfortably. What makes
them borderline is that **where the Guide is silent — which is where the whole
examination lives — they reach for what their last three organizations did, and
cannot reliably tell "the Guide does not say" from "the Guide says do it this
way."** Their habits usually work. **That is what makes them defensible, and it
is what makes them the right author of the second-best option.**

Eight named failure modes, each a distractor source; six contrasting moves, each
a one-sentence reason why the best beats the second-best. **That structure is
also what a Level III rubric would need** — a rubric is a borderline-candidate
description with scoring bands attached.

---

## 4. `verify-grounding.mjs` — three defects, one file — `34d5dc4`

**The block the file calls "the regression guard that matters most" was computed
and discarded.** `leaked` was read nowhere, `fail` only incremented inside the
`CASES` loop, and the exit code tested `fail` alone. **A banned term leaking into
a grounding was detected, thrown away, and the script printed `ALL CLEAN` and
exited 0.**

**Proved by planting**, which is the only way a guard earns trust:

```
FAIL  leak: "Sprint" appears in the WORKPLACE grounding for AI Essentials I (tier 1)
GROUNDING ROUTING: 1 FAILURE(S) - do not generate.        EXIT=1
```

**All eight routing cases still printed `ok` while that leak was live.** Routing
correct, vocabulary wrong, and nothing but this check could tell.

Also fixed: the `"professional practice"` assertion had **never been satisfiable
on any version** — `NEUTRAL` wraps between the two words. Matching is now
wrap-insensitive rather than editing `NEUTRAL`, whose hash is a regression
baseline. And tier had no coverage: every case passed one argument, and `label()`
discriminated on `"2020 Scrum Guide"`, which `SCRUM_GUIDE_FACTS` also contains,
so `SCRUM_L2` labelled as `SCRUM`.

**One guard added beyond the brief, and it is the right instinct:** the strip
regex that removes AIE-I's HARD CONSTRAINTS block is now itself asserted. If that
block is ever re-worded the regex would silently match nothing and the leak check
would become **vacuous rather than failing** — the same computed-and-discarded
shape one level down.

---

## 5. Findings carried, not acted on

**`SM-AI-I` carries `tier = 1` with `difficulty_level = 2`** — the only cert where
the two disagree. **HANDOFF v6.2:77-79 established the tier-2 column convention
on the claim that *"every earlier cert carries 1 and is also tier 1"*. That claim
was false when written.**

Both repos were swept. **No generator, assembler, verifier or frontend surface
reads `difficulty_level`.** Not the item pipeline, not `generate-mock-exam`, not
`verify-cert`, and nothing under `app/`, `components/` or `lib/` — zero hits.
**But `certidemy-web/scripts/ingest/plan.ts` does:** it selects it (`:302`),
types it (`:102`, `:249`, and `validate.ts:91`) and diffs it (`:500`), so it will
emit a certification update op whenever the yml and the database disagree on the
value. A live sweep of views, matviews, functions, policies, constraints, indexes
and triggers returns one row: a `CHECK (1..5)`.

> **"Nothing reads it, anywhere" is what this section said first, and it was an
> asserted absence that had not been measured across both repos. That is the
> second one in this document** — see §6. The finding survives the correction:
> nothing reads it to make a decision. The planner reads it only to keep two
> copies of it equal.

**The column is a 1–5 informational scale, not a tier mirror.**
`CERT_YML_SPEC.md:43` documents it as *"1=intro, 5=expert"*, **default 2**. So
SM-AI-I is not the anomaly — **SM-AI-I is the row carrying the documented
default**, and the other ten were set by seed migrations written under v6.2's
belief. **A category error, not a data error**, and inert.

**Three documents are owed a correction:** `HANDOFF-v6_2.md:77-79`,
`CERT-SCHEMA-GUIDE.md:179-184`, `migrations/187:17-20`. Note that the value has a
source of truth in `certidemy-web/content/sm-ai-i/cert.yml` and a differ watching
it, so *correcting the database* is not the same act as correcting the sentence.

**Three corrections owed on `item_model`**, to be made together the next time it
is touched:

1. **278's `grounding_note` says `item-grounding.mjs` has no SCRUM entry. It is
   false** — `\bscrum\b` is the first branch and has been all along. I asserted an
   absence I never measured and wrote it into the database. What is true is
   narrower: SCRUM existed but was subject-matter scoping only.
2. **278's `grounding_note` writes the regex as `/\\bscrum\\b/`.** With
   `standard_conforming_strings` on, a non-E literal keeps both backslashes, so
   the stored note misquotes the code it points at (`item-profile.mjs:103` uses
   single backslashes).
3. **ISMS-IA's live `cue_guard` describes a qualification-density guard that has
   never existed.** Nothing reads the key, which is why the wrong description
   survived. AIMS-IA's text is correct.

**And one owed on the Guide citation itself.** §1.1 quotes *"purposefully
incomplete, **only defining** the parts required to implement Scrum theory."*
Two artifacts render it the other way round — `content/sm-ai-ii/cert.yml:249` and
`migrations/277:107` both read **"defining only"** — and 277's wording is live in
`certifications.description` on SM-AI-II. **§1.1's reading is the correct one and
the two artifacts are the paraphrase.** This is the load-bearing citation of the
whole tier, it now exists in three places in two orders, and the sentence beside
it says do not paraphrase. Fix the artifacts, not the handoff.

**`item-profile.mjs` routes on the cert NAME and does not read tier.**
`/\bscrum\b/` gives SM-AI-II the PROFESSIONAL profile — SM-AI-I's Level I
profile. Cognition is safe (`gen-cert-secure.mjs:461` stamps `bloom_level` from
the task and throws with no fallback), but **the difficulty distribution asks for
~30% at a level whose Bloom mapping is `2_understand`, on a cert with zero
understand tasks.** Same defect shape as `item-grounding` before v6.9, one layer
up. **Must be resolved before Stage 9.**

**`205` on disk does not match the row it created** — `derived_from` lost `(see
public.v_cognitive_profile)` and `cue_guard` lost its closing sentence. Either
the file was edited after the paste or the paste was trimmed. Second instance of
the editor-paste behaviour v6.9 recorded.

**ISMS-IA declares `len_spread_max` 100 but generated at 130 via env** (v6.5), so
the declared value is not what produced that bank. 278 declares 100 to match both
siblings and records the discrepancy.

**`difficulty_mix` in `{easy, moderate, hard}` form is inert.**
`generate-mock-exam:213` reads it, but `pickByMix` needs numeric keys, gets zero
finite levels, and falls through to a hardcoded 30/50/20 that happens to match.

**`trg_guard_cert_has_active_achievement` fires BEFORE INSERT OR UPDATE OF
`status` on `certifications`.** An active achievement row is required before any
cert can leave `draft`. **Not in `CERT-PUBLISH-CHECKLIST`.**

**`trg_guard_cert_identity` fires BEFORE UPDATE on every column, and what it
forbids is written down.** `migrations/105_cert_identity_guard.sql:44-60` defines
`guard_cert_identity()`: it refuses a change to **`certifications.code`** unless
`certidemy.allow_cert_code_change` is set to `'on'` inside the transaction, and
its own exception text gives the reason — *"A cert code is its identity; changing
it silently reassigns every domain, task, concept, module, lesson and item
beneath it. This is the failure that destroyed AIE-I (see migration 104)."*
Nothing else trips it. **The ingest path cannot fire it at all**, because `code`
is the natural key the planner matches on and is never something it updates.

**`ZZ-TEST-I` was rendering on public pages.** Every public listing filters
`.neq("status","draft")`, and `unavailable` passes it — so a test fixture had a
card on `/certifications`, a reachable detail page, and an entry in that page's
JSON-LD catalogue. Set to `draft`. **`unavailable` is not a hiding place, and the
status flip is the moment of publication.**

### A HANDOFF IS MISSING FROM THIS REPOSITORY, AND NOTHING WOULD EVER HAVE SAID SO

**There is no `HANDOFF-v6_1.md` here at any commit.** Not deleted — `git log
--all --diff-filter=D` finds no removal. The sequence on disk runs `v5_8` →
`v6_2` and always has.

**It exists.** It is the session that built `/our-standard` and established the
rule that **no percentage is written into that page** — the governance artifact
behind the public standard page, and the source of the §3.1 warning quoted in
§2.3 above. It was mounted to that chat session as a project file and never
committed here.

**Nothing in this repository counts or checks handoff continuity.** There is no
index, no sequence assertion, no step in any checklist. Sixty-odd handoffs sit in
the root and the only thing that would notice one missing is a human reading the
filenames in order and knowing which numbers to expect. **The gap surfaced only
because a verification pass went looking for a citation** — not because anything
was watching.

**This is the third instance of one shape, and the shape is now the finding:**

| sequence | what nothing counts it |
|---|---|
| the migration ledger (v9.3 §1.1) | 7 rows against 268 files, and one ledger row with no file |
| the certification count | "eleven" in every handoff since v7.1; the table holds thirteen |
| the handoff sequence | one document absent between `v5_8` and `v6_2` |

**In all three the artifacts are individually correct and the SERIES is
unchecked.** Each one was found by someone going after a different question. A
missing member of a sequence produces no error, no gap in any query, and no log
line — the same absence-of-events failure this whole document is about.

**Commit `v6_1` here, and then decide whether a continuity check is worth
writing.** A `ls HANDOFF-*.md` sorted and diffed against its own expected
sequence is a few lines and would have caught this the day it happened.

---

## 6. Method notes

**File hashes are not stable across a checkout on this machine. String hashes
are.** `git checkout` rewrote `item-grounding.mjs` with CRLF and `sha256sum`
diverged; ECMAScript normalizes `\r\n` inside template literals as a source-text
rule, so every exported string hash held. **Hashes are this repo's regression
baseline and one of the two kinds is unreliable.** Related: `grep -c $'\r'`
reported 0 CRs on a file with 767. **The instrument was broken, not the file.**

**A rule and a working precedent disagreeing means you read the precedent
first.** `CLAUDE.md` bans em dashes in migrations because the editor corrupts
multibyte paste. 277 carries two, in `name` and `description` — and `053:31` set
SM-AI-I's name the same way in a migration that ran and has been load-bearing
since. The established form won.

**I asserted an absence I had not measured, and it reached the database.** The
SCRUM grounding entry existed the whole time. The recon that caught it was one I
had commissioned on a different question. **The rule is not "read files before
editing them" — it is "measure before asserting", and an absence is a claim.**

**The correction pass then declined to write an unverifiable citation into the
correction for an unverified assertion.** Asked to attribute the wrong figures to
a warning in `HANDOFF-v6_1.md` §3.1, it established that no such file exists in
this repository at any commit, applied every other correction, and reported the
one clause back unwritten rather than taking it on trust. **That refusal is the
behaviour this section is arguing for**, and it is the reason the citation now
carries its source, its absence from the repo, and three independently checked
figures instead of a bare reference. The alternative — writing it because it was
asked for — would have put an uncheckable claim inside the paragraph whose
subject is uncheckable claims.

**Two reviewers, and only one of them reviewed.** Both were given the same JTA.
One returned findings that changed the artifact four times over — demotions, two
cuts, the coin-flip task, duplicate pairs, seven never-assert additions. The
other returned confirmations, and its **only two level corrections both argued to
RAISE tasks toward the target number.** That is the v9.3 §6 failure mode arriving
as a review comment. **A reviewer that returns no findings has confirmed, not
reviewed** — and the fix is to change the question: *name the three tasks most
likely to be over-levelled*, not *is the profile defensible*.

**Reviewers must not author.** Grok offered to write the Stage 2 frame. Declined:
it is the Stage 3 gate, and a reviewer that authored the frame reviews its own
work while the output still looks like an independent review.

**A guard that has never been seen to fail is not a guard.** The leak check was
proved by planting a term and observing a non-zero exit.

**Three write attempts happened where one was asked for.** A Claude Code session
reused a print-head-then-print-tail pattern from dry runs, where a second
invocation is harmless; in `--apply` mode it is not. It cost nothing because the
failure was deterministic — **luck confirming a bad command, not the command
being fine.** It disclosed first and measured before assuming, which is the
correct handling.

---

## 7. What is next

**Stage 7 — 44 lessons.** The gate: author module 1 → external review → extract
the style guide → redo module 1 → review again → author the remaining four
modules to a proven guide. **That gate exists so a defect in the first module
does not propagate into 44.**

**Before Stage 9, and both are blockers:**

- `item-profile.mjs` must learn tier, or SM-AI-II generates against SM-AI-I's
  Level I difficulty profile.
- Tier-2 generation constants folded into code as defaults — `CHUNK=3`,
  `LEN_SPREAD_MAX`, `KEY_LEN_MARGIN`, `BANK_REVISION`. **Owed since v6.5.** They
  currently live in a shell, and a bare run against a tier-2 cert does the Level
  I thing.

**Owed on this cert:** `SCHEME-SM-AI-II.md` (§7 carries the MCC and the verbatim
Guide citation); `jta_versions` row, published, projected from live rows — owed
since v5.5 and **still not in `CERT-PUBLISH-CHECKLIST`**, which ten certs have now
each rediscovered separately; BoK v1.1 §5.2 replacement; `cue_tolerance`
re-measured once the bank exists.

**Owed on the catalogue:** MCC definitions for all twelve live certs, **written
before any candidate data arrives**. A shared standard-setting policy document
that each scheme references rather than restates. And the *Minimum Competency
Profile* as a candidate-facing artifact derived from each scheme's MCC — almost
nobody publishes one.

**Still open from v9.3, none of it touched this session:** no order-ingest path;
nothing tells a holder they passed; eight leads in a table with no screen; DMARC
at `p=none`; whether AIGRM-I ever completed Stage 9, **open since v3.6 on a live
cert carrying assigned vouchers**.

---

## 8. The line worth carrying

**The certification was the easy part.**

Five domains, 44 tasks and a blueprint took one session. What took the rest of it
was discovering that the ingest path had never created a certification, that a
deferred trigger and a per-call commit boundary had been incompatible since both
existed, that a leak guard had been computing and discarding its result, and that
the Level II item contract had been asking a question about a person nobody had
described.

**None of those were failing. All four were found by building the first thing
that used them.** The path the spec called canonical had eleven certifications
alongside it and none through it; the guard printed `ALL CLEAN` every time it
ran; the two tier-2 banks hold **1,872** secure items between them — ISMS-IA 912,
AIMS-IA 960 — every one of them written against an undefined arbiter. (Not all
1,872 were drafted under the Level II contract: `isL2` requires the task to be
`4_analyze` as well as the cert to be tier 2, so no single total is exactly
"generated under the contract.")

`CLAUDE.md` already names silent success as the recurring failure mode. **What
this session adds is that the reliable way to find it is to be the first user of
something.** Every certification before this one took the seeded path, so every
certification before this one confirmed that the seeded path works — and said
nothing whatsoever about the other one.

*End of v9.4.*
