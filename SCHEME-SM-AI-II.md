# Certification Scheme — Scrum Master II — AI (SM-AI-II)

**Scheme owner:** Certidemy (the certification body)
**Scheme code:** SM-AI-II
**Document version:** 1.0
**Status:** Pre-launch (`status = draft`)
**Last updated:** September 2026

---

## About this document

This is the **certification scheme** for the Scrum Master II — AI credential: the
published contract describing what the credential certifies, how a candidate earns it,
and how Certidemy keeps that decision fair, consistent and defensible. It is written to
align with the structure of the ISO/IEC 17024 framework for bodies operating
certification of persons.

**A note on accreditation status.** Certidemy is **not currently an accredited
certification body**. This scheme is designed to the ISO/IEC 17024 framework —
"audit-ready by design" — so that the credential is structurally legitimate now and the
body can pursue formal accreditation once operational history and candidate data exist.
Where a requirement depends on data or governance that only accumulates after launch,
this document says so plainly rather than overstating readiness.

**This scheme makes an argument the other twelve do not have to make.** Every other
Level II credential in the catalogue is a different *job* from its Foundation sibling —
an internal auditor is not an implementer. SM-AI-II is the **same role at a different
competence class**, and §5 sets out why that is admissible under 17024 and what keeps it
from being "the same exam, harder". If that argument fails, the credential should not
exist, so it is placed early and stated in full rather than assumed.

**Terminology.** Cross-scheme rules live in `TERMINOLOGY-POLICY.md` and are not repeated
here. Scrum roles and artifacts stay in English in all three languages (Rule 4),
following the official translated Scrum Guides; the Guide's own title is translated
(Rule 5).

---

## 1. Scheme identification

| Field | Value |
|---|---|
| Credential name | Scrum Master II — AI |
| Credential code | SM-AI-II |
| Issuing body | Certidemy |
| Credential family | Certidemy Scrum |
| Credential type | Judgment certification (Level II — single-**best**-answer) |
| Companion credentials | `SM-AI-I` (same role, Level I) · `ISMS-IA`, `AIMS-IA` (other Level II schemes) |
| Languages offered | English, Latin American Spanish (es-419), Brazilian Portuguese (pt-BR) |
| Credential validity | 1 year from issuance (see §9) |
| Delivery | Online, remotely proctored-equivalent secure examination |

**The credential name is load-bearing and is currently mis-routed.**
`scripts/lib/item-profile.mjs` resolves a certification's tier profile by matching the
NAME against `/\bscrum\b/` and does not read `certifications.tier`, so this scheme
currently resolves to the Level I professional profile. `scripts/lib/item-grounding.mjs`
routes correctly, because `groundingFor()` takes an explicit `tier` argument. **The
profile router must learn tier before Stage 9** — §12.

---

## 2. Purpose and scope

The SM-AI-II credential certifies that the holder **acts competently as a Scrum Master
in the space the Scrum Guide deliberately leaves open** — resolving tensions between its
own rules, coaching a team that performs Scrum correctly and still fails, holding
accountability boundaries against the organization, restoring empiricism where
inspection has become ceremonial, and exercising judgment when models and agents are
part of how the work gets done.

**In scope.** Judgment in the practice of the Scrum Master accountability: choosing
between defensible interventions, distinguishing what the framework determines from what
it leaves to the practitioner, and holding the distinction under organizational
pressure.

**Explicitly out of scope.**

- **AI literacy as a subject.** What a model is, why it hallucinates, how to prompt.
  That is `AIE-I`. This scheme assumes it.
- **AI governance, risk and compliance.** Risk classification, impact assessment,
  regulatory instruments. That is `AIGRM-I`.
- **Product management.** Value decisions, backlog craft, product strategy. That is
  `SPO-AI-I`. This scheme tests serving the Product Owner, never doing their job.
- **Engineering craft.** Testing, integration, code review, technical decision-making.
  That is `SD-AI-I`.
- **Any scaling framework.** None is part of Scrum, and none is named or assessed.
- **Coaching or facilitation certification in general.** The scheme is bounded by the
  Scrum Guide's silences, not by the coaching profession.

---

### 2.1 Why AI sits in one domain when `SM-AI-I` weaves it through every module

**This is the first question an auditor or a candidate asks, and the answer was not
written down.** The decision is confirmed by external JTA review and does not move. The
argument for it is reconstructed below.

> **PROVENANCE.** Reconstructed 2026-09-10 from the external review's conclusion and from
> the minimally competent candidate definition in §7.1 and `scripts/lib/item-grounding.mjs`.
> §4 cited `SM-AI-II_BoK_v1.1.md` (signed 2026-09-02) as the source until 2026-09-10, and
> **that file was never committed and cannot be produced** — recorded in
> `jta/SM-AI-II_JTA_v1.4.md` §9 as unrecoverable. **The decision predates this text; the
> argument for it does not survive anywhere else.** `jta/SM-AI-II_BoK_v2.0.md` §5.1 now
> carries this argument as the body of knowledge's own — reconstructed **from** this
> section rather than the other way round, which is the inversion the banner exists to
> record.

**THE TWO CREDENTIALS CERTIFY DIFFERENT OBJECTS.** `SM-AI-I` certifies what the Guide
defines, and AI is the **workplace the candidate has**. That is why its AI lessons are
filed into `scrum-roles`, `scrum-artifacts` and `foundations-of-agile` rather than kept
in a module of their own — a Foundation credential teaching a pre-generation workplace
would be teaching something the candidate does not work in. **Integration is correct
there because the subject is the framework, and the framework is met in an AI workplace.**

**SM-AI-II certifies judgment where the Guide is silent.** If every silence also carried
an AI condition, **each D1–D4 item would measure two things**: the judgment under test,
and whether the candidate noticed a model. That is **construct-irrelevant variance across
35 tasks whose best answer does not change** — and it would make D5 a recap of the other
four domains rather than a domain.

#### The test for where AI belongs

> **A task carries AI only where the BEST ANSWER differs because a model is in the
> system.** Not where the same answer arises more often. Not where the finding is harder
> to raise.

**Five D5 tasks meet that test:** `5.1` (what Done must reach when implementation was
generated), `5.3` (accountability for a defect in generated work), `5.4` (a model-produced
number read as a commitment), `5.5` (summarisation displacing participation), `5.6`
(meeting Done without generation).

**Four earn their seat on frequency rather than judgment:** `5.2`, `5.7`, `5.8`, `5.9`.
Their best answers would be the same in a team that generates nothing; what generation
changes is how often the situation arises and how fast it arrives. **That is recorded
rather than hidden, because it is the honest count** — and because an item writer who
does not know which four they are will write them as their D4 siblings with scenery
changed. `STYLE-GUIDE-SM-AI-II.md` §0.7 names the sibling pairs.

#### What the minimally competent candidate definition already settles

**The evidence that the concentration is right is in the MCC, and it predates this
section.** Failure mode 6 — treating an artifact as evidence of the activity that
produced it — reads, in the deployed form at `scripts/lib/item-grounding.mjs`:

> *"This failure gets much worse when the artifact was generated: the document exists, it
> reads well, and nobody in the team holds what is in it."*

**That is a multiplier on a competence the candidate already has, not a different
competence.** It is how a nastier second-best gets written for a D5 item, and it is why a
D5 item may legitimately use a non-AI failure mode. **Mode 8 — in an AI-augmented team
they measure what moved rather than what held — is the only one of the eight that is
AI-specific, and it is why D5 is a domain at all rather than a difficulty setting.**

---


## 3. Eligibility

**There are no prerequisites, and `SM-AI-I` is recommended rather than required.**

**The consequence is stated plainly, because it is unusual.** This scheme is authored
against an **assumed prior floor**: every task presumes the candidate already holds what
`SM-AI-I` certifies, and no item re-tests it. That floor is a **teaching and
item-writing assumption, not a gate**. A candidate who has not reached it will find the
form unpassable rather than merely hard — the second-best option in a Level II item is
designed to be attractive to someone who knows the framework well, and is simply
confusing to someone who does not.

**Certidemy does not enforce this, and the reason is that it cannot.** The platform has
no prerequisite mechanism: nothing in the enrolment or examination path can require a
prior credential. Declaring a prerequisite the body does not verify would be a finding
under 17024, which asks a scheme to define its prerequisites **and apply them**. So the
recommendation is advice to the candidate, stated in the strongest terms the body can
honestly use, and the honest position is that the examination itself is the filter.

---

## 4. Body of knowledge

| Attribute | Value |
|---|---|
| Domains | 5 |
| Tasks | 44 |
| Concepts | 131 |
| Task–concept links | 132 |
| JTA of record | `jta/SM-AI-II_JTA_v1.4.md` — the version `public.jta_versions` holds as `published`. **This row named `v1.2` until 2026-09-10.** v1.2 was the locked version; v1.3 is retired and v1.4 is published, and a scheme naming a superseded version as its record sends a reader to task text the database no longer holds. |
| Body of knowledge | `jta/SM-AI-II_BoK_v2.0.md` (2026-09-10) — **reconstructed, not authored at Stage 1** (§12). `v1.1` was cited here as signed 2026-09-02; it was never committed and cannot be produced, per `jta/SM-AI-II_JTA_v1.4.md` §9. |

| Domain | Title | Weight | Tasks |
|---|---|---|---|
| D1 | Resolving framework tensions | 20.0% | 9 |
| D2 | Coaching a team performing Scrum and still failing | 20.0% | 9 |
| D3 | Serving the Product Owner and the organization without absorbing their accountabilities | 17.5% | 8 |
| D4 | Empiricism under distortion | 20.0% | 9 |
| D5 | Scrum Master judgment when AI is inside the work system | 22.5% | 9 |

**All 44 tasks are within examination scope** (as at 2026-09-08;
`public.tasks.is_exam_scope`). Counts in this document carry an "as at" date and domain
weights do not; the reasoning is stated once in `SCHEME-SM-AI-I.md` §4 and applies here
unchanged.

**132 links against 131 concepts is correct**: one concept, quality-adherence, is shared
by tasks 5.6 and 5.9. Every JTA version through v1.2 claimed 155 concepts; that figure
was asserted and never counted, and 131 is the counted value.

**D5 is the heaviest domain at 22.5%**, and that is a deliberate statement about what
this credential is for. The AI half of a Scrum Master's context is where the Guide is
most silent and where practitioner habit is least tested.

**AND THE MEASUREMENT AN AUDITOR WILL TAKE, STATED FIRST.** Counted 2026-09-10 across
all 44 task statements and all 132 knowledge, skills and abilities lines:

| | AI vocabulary in statements | in any K/S/A line |
|---|---|---|
| D1, D2, D3, D4 (35 tasks) | **0** | **0** |
| D5 (9 tasks) | 5 | **0** |

**Five of the 131 concepts carry it**, all in D5: `acceptance-decision`,
`dod-for-generated-work`, `generated-estimates`, `generation-dependence`,
`summarisation-displacement`. **Across the 35 authored lessons of D1-D4, AI appears in
one sentence**, and that sentence exists to record something the Guide does not license.

This is not a gap that was found and left. **It is the scope decision of §2.1 measured**,
and a scheme that states the number is in a different position from one that waits to be
asked for it.

---

## 5. Competency model and job-task basis

### 5.1 The level distinction, and why it is admissible under 17024

**This is the catalogue's first cognitive-only rung.** `ISMS-IA` and `AIMS-IA` are Level
II because an internal auditor is a **different job** from an implementer, with a
different remit and a different standard governing it. **SM-AI-II cannot make that
argument.** The role is the same role.

**The position: ISO/IEC 17024 requires two sets of competence criteria, not two job
titles.** A scheme is defined by what it certifies a person can do. Two schemes over one
job title are legitimate where they certify **different competence classes**, and are
not legitimate where they certify the same competence and merely differ in item
difficulty. *Same title, different competence class* is permitted. *Same competence,
harder items* is not — that is a scaled score dressed as a credential, and it would make
the second credential meaningless.

**The distinction rests on the Guide's own account of itself.** The 2020 Scrum Guide,
*Scrum Definition*:

> The Scrum framework is purposefully incomplete, only defining the parts required to
> implement Scrum theory.

`SM-AI-I` certifies that a holder **knows what the Guide defines**. `SM-AI-II` certifies
that they **act competently in what it deliberately leaves open**. Those are different
competences over one body of practice, and the boundary between them is drawn by the
source document rather than by this body's preference.

**The distinction is deliberately NOT drawn by citing what `SM-AI-I` examines.** A
sibling's task inventory moves — `SM-AI-I`'s own "all tasks are within examination
scope" sentence was false for two months before it was corrected on 2026-09-08 — and a
level distinction resting on a moving inventory drifts with it. **The Guide's silence
does not move**, and it is what this scheme is bounded by.

### 5.2 The two screens

Every task in the JTA was admitted through two screens, applied as rejection rules
during authoring. They are stated here because they are **the scheme's level-distinction
criterion**, not an editorial preference.

**SCREEN 1 — DISJOINTNESS.** A task is admissible only if (a) no `SM-AI-I` task covers
it, **and** (b) **the Guide constrains the answer but does not determine it.**

**SCREEN 2 — FRAMEWORK CONFORMANCE.** A best answer that violates a Guide rule is
**rejected, not reworded.** Judgment operates inside the framework; a scheme that
rewarded working around the Guide would be certifying something else.

**Together: constrains but does not determine.** Where the Guide *determines* the
answer, the task belongs to Level I — there is one right answer and four defensible
options cannot honestly be written. Where the Guide constrains *nothing*, the task is
not about Scrum and the scheme has no basis to mark one answer better. **The credential
lives in the band between**, and both screens are needed to find it: disjointness alone
admits tasks Scrum does not govern, and conformance alone admits tasks Level I already
covers.

> **A NOTE ON SCREEN 1(b)'s FIRST FORM, recorded because it was inert.** (b) was
> originally *"adding it to `SM-AI-I` would force that credential's declared Bloom up"*.
> That control could not fire: `SM-AI-I` already declares Analyze on 11.49% of its
> weight against a `4_analyze` ceiling, so an Analyze task can be added to it without
> raising anything. It read as rigorous and filtered nothing. Corrected before lock. **The
> replacement is carried in `jta/SM-AI-II_BoK_v2.0.md` §6.2**, which states Screen 1(b) in
> its corrected form only; the inert form survives here, and here alone, as the record of
> what it was and why it could not fire.

### 5.3 Cognitive profile

| Bloom level | Tasks | Weighted share | Item contract |
|---|---|---|---|
| 3 — Apply | 16 | 36.28% | Level I: exactly one defensibly correct option |
| 4 — Analyze | 28 | **63.72%** | **Level II: four defensible options, one best** |

**No Remember and no Understand tasks at all**, which is what a cognitive-only rung
above a Level I credential has to look like: everything the candidate would recall is
already certified by `SM-AI-I` and is assumed rather than re-tested.

**The profile is computed, not targeted.** `certifications.exam_blueprint.cognitive_profile`
was written by migration 278 and re-derived by migration 283 with `jsonb_object_agg`
directly from `public.v_cognitive_profile`; no percentage is typed anywhere in either
migration, so `verify-cert.mjs` invariant 17 holds by construction rather than by
inspection.

**The JTA carried a kill switch and it cleared by 8.72 points.** v1.2 would lock only if
the computed profile reached **analyze ≥ 55% with zero Remember**.

**At lock the profile was 61.49 / 38.51.** The hand prediction was 61.49 / 38.51 and the
database returned exactly that. Across two adversarial review passes the analyze share
fell 7.39 points — 68.88 → 63.72 → 61.49 — and **no verb was raised anywhere to
compensate.** That was the defence offered for the number at lock, and it remains an
accurate account of those two passes.

**It is no longer the current profile, and the reason is on the record.** A third,
external review pass on 2026-09-09 found task 1.2 — then *"Identify which accountability
is displaced when ordering and sizing responsibilities are crossed"* — overlapping
`SM-AI-I` 2.7, which enumerates *"SM ordering backlog"* as its first violation at
`4_analyze` with the stronger skill of diagnosing **and** prescribing. 1.2 was rewritten
to sizing alone, built as 3.2's structural sibling, and moved to `4_analyze`. **One verb
was raised, deliberately and for a stated reason**, taking analyze from 61.49 to 63.72.
Migration 283 re-derived the blueprint from `v_cognitive_profile`; no percentage was
typed.

**External validation is pending.** The JTA went through two independent review passes
before locking. That is editorial rigor, not the SME-panel validation 17024 contemplates
(§12).

---

## 6. Examination structure

| Parameter | Value |
|---|---|
| Number of items | 50 |
| Duration | **150 minutes** (3.00 min/item) — a floor, not a measurement; see below |
| Item format | Single-**best**-answer multiple choice, four options |
| Delivery language | Candidate-selected: en, es-419, or pt-BR |
| Scoring | Dichotomous (correct / incorrect); no negative marking |
| Attempts | 6 within a rolling 12-month window |

**Blueprint (item allocation by domain), at 50 items:**

| Domain | Weight | Items per form (target) |
|---|---|---|
| D1 | 20.0% | 10 |
| D2 | 20.0% | 10 |
| D3 | 17.5% | 9 |
| D4 | 20.0% | 10 |
| D5 | 22.5% | 11 |

(Row total 50; D3 and D5 round from 8.75 and 11.25.) The assembler draws each form from
the secure bank according to this blueprint and **refuses to issue a form if any domain
is short of its quota**.

**Why 50 items and not `SM-AI-I`'s 80.** A Level II item presents four defensible
options that must each be read and weighed. Eighty is an endurance test rather than a
competence measure, and 50 is the count both other Level II schemes use.

> **150 MINUTES IS THE TIER-II FLOOR, NOT A MEASUREMENT, AND THIS DOCUMENT DOES NOT
> CLAIM OTHERWISE.** It is 50 items at the tier base of 3.00 min/item — the same
> starting point `ISMS-IA` holds — adopted because **this scheme's secure bank does not
> exist yet** and there is nothing to measure.
>
> **Migration 212 is the template for retiring it.** For `AIMS-IA` it derived 165
> minutes from the built bank by a stated rule: reading load in the *binding* language,
> because one duration serves all three and setting it on English disadvantages Spanish
> candidates, plus a premium for analyze share against the tier's reference scheme.
> **The same measurement is owed here once the bank exists**, and at 63.72% analyze
> against `ISMS-IA`'s 65.60% this scheme may land below 165 rather than above it. Until
> that measurement is taken, 150 is a floor the body has adopted and not a number it has
> justified.
>
> **Session timeout must be verified against the final duration before publication.**

---

## 7. Pass mark and standard-setting

**Current pass mark: 75% (38 of 50 items).**

**75% is adopted by citation, not argued fresh.** Both existing Level II schemes set it
and both justify it the same way: a Level II item asks which of four *defensible*
answers is best, so a competent candidate can select a defensible-but-second-best option
and be wrong without being incompetent. Holding the Level I 80% against that item type
would measure agreement with the item writer at the margin rather than competence.
`ISMS-IA` §7 and `AIMS-IA` §7 carry the argument; repeating it here would create a third
copy to keep in step.

### 7.1 The minimally competent candidate, defined

**This section supersedes the house boilerplate, and the reason is a distinction eleven
scheme documents currently collapse.**

Every other scheme says standard-setting is pending because it *"requires real candidate
data that does not yet exist."* **That is true of validating a cut score and false of
defining the borderline candidate.** Standard setting has three stages and they have
different inputs:

1. **Define the borderline candidate.** Prose, per scheme. **Needs no candidate data at
   all.**
2. **The Angoff panel.** *Of 100 borderline candidates as defined, how many answer this
   item correctly?* **Needs items and judges — not candidates.**
3. **Validate against candidates.** Item statistics, reliability, observed pass rates.
   **This** is the stage that needs live operation.

**Writing the definition after seeing pass rates is reverse-engineering a justification
for a number already chosen.** SM-AI-II is the first Certidemy scheme able to do stage 1
prospectively, and this is it. `ISMS-IA` §7 uses the term *minimally competent* twice
and defines it nowhere; that gap is what this section closes.

**THE MINIMALLY COMPETENT SM-AI-II CANDIDATE.**

**Experienced, not shaky.** Two to five years as a Scrum Master, several teams, at least
one organization that did Scrum badly. They would pass a Level I examination
comfortably: they know the timeboxes, the accountabilities, the artifacts and their
commitments, and they recognise the named anti-patterns on sight.

**What makes them borderline is narrower and harder.** Where the Guide is silent — which
is where this entire examination lives — they reach for what their last three
organizations did, and **they cannot reliably tell the difference between "the Guide
does not say" and "the Guide says do it this way."** Their habits usually work. That is
what makes them defensible, and it is what makes them the right author of the
second-best option.

**What they reliably get right**, and therefore what no distractor may be built on:
applying a rule the Guide determines; naming an anti-pattern; protecting a timebox and
holding the Sprint Goal against casual scope pressure.

**What they get wrong** — eight named failure modes, each a source for a defensible
second-best: they over-intervene where developing the team's capacity was available;
they fix the visible symptom rather than its cause; they import a practice and present
it as the framework; they absorb accountabilities to keep things moving; they escalate
at one volume rather than matching the impediment; they treat an artifact as evidence of
the activity that produced it; they protect the relationship over the transparency; and
in an AI-augmented team they measure what moved rather than what held.

**What the candidate one level further on does differently** — six contrasting moves,
each stateable as a one-sentence reason why the best beats the second-best: chooses the
intervention that leaves the team more capable rather than the one that resolves fastest;
separates what the Guide determines from what it leaves open and says which they are
doing; treats a practice that works as worth keeping *and* as not Scrum; declines work
that would move an accountability; reads an artifact as a claim to be tested; and says
the uncomfortable thing to the person who can act on it, at the volume the impediment
warrants.

> **THIS DEFINITION IS ONE ARTIFACT WITH TWO HOMES, AND THEY MUST NOT DIVERGE.** The
> text above is the summary; the deployed form is `SCRUM_L2_JUDGMENT` in
> **`scripts/lib/item-grounding.mjs`** (commit `e3eb533`), which is injected into both
> the draft and the critique prompts for every Level II Scrum item. **The scheme
> document and the generation input are the same statement**, and a change to either is
> a change to both. That is deliberate: it is what stops the published standard and the
> instrument that produces items from drifting apart.

**Stage 2 is not blocked by candidates.** It is blocked by a panel of independent
subject-matter experts, which is a recruiting problem. Stage 3 is blocked by live
operation. Both are named in §12 with which constraint applies to which.

---

## 8. Assessment integrity and separation of functions

**Separation of training and certification** operates through a strict item-pool
firewall: practice items carry concept links, which is how the learning engine retrieves
them; **secure items carry zero concept links, by construction**. The firewall is a
queried invariant that must return zero, checked before publication and on every
verification run.

**Answer keys.** `correct_answer` is revoked from every client role at column level. A
single `SECURITY DEFINER` function is the only route by which any key reaches a browser,
and it serves public sample items alone.

**Item-bank floors.** At least 8 secure and 10 practice items per task per language, in
each of en, es-419 and pt-BR. At 44 tasks that is a minimum of **1,056 secure** and
**1,320 practice** items. Over-fill is retained; items are never deleted to reach a
number.

**Evidence integrity.** Deleting an item that has been answered is blocked at database
level, so scored-attempt evidence cannot be destroyed by content maintenance.

**Governance-level separation** — an impartiality structure separating the certification
decision from the commercial and training functions — **does not yet exist** and is named
in §12. The structural controls above operate now; the governance separation does not.

### 8.1 Answer-cue neutrality

An item is defective if a test-wise candidate can select the key without knowing the
subject — most commonly because the key is systematically longer than the distractors,
or sits in a predictable position.

**Controls applied to every item:** a Fisher-Yates position shuffle so key position is
uniform; a **character-based** length-parity guard measuring the key against the longest
distractor and the spread across all options; and a minimum-option floor.

**The guard is character-based and this document says so precisely, because a sibling
scheme describes it wrongly.** `ISMS-IA` §8.3 states that the Level II guard "tests
comparable qualification density across options"; **no such control has ever existed**,
and `AIMS-IA` §8.1 is the accurate description. The tolerance is what adapts for Level
II, not the mechanism.

**The tolerance is declared per scheme in `exam_blueprint.item_model.cue_tolerance`, and
both the generator and the conformance checker read that same declaration**, so the two
cannot drift. The resolved source is printed at generation time and appended to the
conformance detail line, so a loosened setting cannot pass unnoticed.

> **THIS SCHEME'S TOLERANCE IS UNMEASURED AND SAYS SO.** Migration 278 declares 25
> characters / 15% / spread 100 with `status: PROVISIONAL` and `measured_over: null`.
> **Those are `ISMS-IA`'s numbers, adopted as a starting point only.** They must be
> re-measured over SM-AI-II's own secure/en bank once it exists and re-declared with
> `measured_over` populated. The check that matters is the strict-longest rate: near 25%
> is chance, near 40% means a test-wise candidate beats chance by picking the longest
> option, and that is a scheme defect to correct rather than a threshold to relax.

### 8.2 Source-attribution controls

**The scheme's single greatest generation risk is inventing a rule to fill the Guide's
silence** — which is precisely the space the examination occupies.

The item generator is given an explicit grounding block naming the source, the permitted
citations, and a list of claims that must never appear in a key or an explanation. For
this scheme that list holds **26 never-assert entries**, each written as
claim → correction → reason, covering the misconceptions most widely taught and least
supported by the text: that anyone but the Product Owner may cancel a Sprint; that the
Scrum Master may overrule backlog ordering; that a Scrum Team may weaken an
organizational Definition of Done; that the Daily Scrum requires three particular
questions, which the 2020 edition removed; that a forecast is a commitment; that Scrum
prescribes story points, velocity or refinement-as-an-event; that Scrum defines *roles*
rather than *accountabilities*; and that any scaling framework is part of Scrum.

**Four of the 26 are marked `[derived]`**, and the distinction is a control in its own
right. They are inferences from the Guide rather than sentences in it — that a tool
holds no accountability; that the Definition of Done may not be relaxed for AI-generated
work; that AI-generated work meeting the Definition of Done **is** an Increment; and that
a model's output does not constitute inspection. **An item may rely on them; an item may
never attribute them to the Guide as a quotation.** This is the ISMS-IA attribution
defect stated as a rule: *"an auditor may not audit their own work"* was asserted
confidently, is in neither source standard, and survived external review.

**Each never-assert entry ships with its inverse where one exists.** Forbidding *"the
Definition of Done may be relaxed for AI-generated work"* alone teaches the generator to
assert *"generated work cannot be Done"* — equally false, and harder to catch because it
sounds cautious.

**The list is a generation control, not a style note**, and it is versioned in source
control as `SCRUM_GUIDE_FACTS` in `scripts/lib/item-grounding.mjs`. It is true at every
tier and currently reaches Level II only; wiring it into Level I would change generation
on three shipped certifications and is a scoped decision with its own review.

### 8.3 Thin-residue tasks: a per-task authoring constraint

**Nine tasks carry a thin residue once Screen 1 has removed what the Guide determines:
1.1, 1.3, 2.4, 2.8, 3.1, 3.6, 4.7, 5.2 and 5.6.** They passed both screens — the Guide
constrains without determining — but the band it leaves is narrow, and a lazily written
stem collapses back onto the rule.

**This is a scheme requirement rather than an authoring preference**, and it is stated
because **no structural invariant catches its violation**. Not the firewall, not the
coverage view, not the cue guard, not invariant 17. A Level I item sitting inside a
Level II form is a *content* property: every row is valid, every count is right, and the
form silently tests recall at Level II prices.

**For these nine tasks the stem must supply the situation that makes the judgment
live** — what is blocked, how much of the Sprint remains, what has already been tried.
A stem answerable without those details is testing a rule. Enforcement is in the
grounding entry and the critique pass, and it is checked when the bank is reviewed.

**If the grounding cannot carry the constraint for a given task, that task is cut at
review — not pre-emptively now.** Cutting a competence to protect an item-writing
process would be the wrong trade in the wrong direction.

---

## 9. Recertification

SM-AI-II credentials are valid for **1 year** from issuance.

**Rationale, and it reaches `SM-AI-I`'s number by a different argument.** `SM-AI-I`
holds one year because it certifies Scrum *as practiced in AI-augmented teams*, and
reasons from the AI tooling moving quickly.

**This scheme reaches one year from the part of it that actually dates.** The 2020 Scrum
Guide moves slowly — it is a thirteen-page document revised roughly every few years —
and a scheme resting on it alone would justify a longer cycle. **D5, *Scrum Master
judgment when AI is inside the work system*, carries 22.5% of this examination**, the
heaviest of the five domains. **But a domain's weight is not the measure of what dates
inside it**, and this section argued for a time that it was. See the correction below.

**Roughly 7.5% of the examination is genuinely AI-contingent.** Each D5 task carries
22.5 / 9 = 2.50 points of form weight, and three of the nine rest on knowledge that
would move if generation practice moved:

| task | what dates in it |
|---|---|
| **5.1** — *what the Definition of Done must cover when implementation is AI-generated* | The Guide's DoD rule is stable; **which quality measure an existing definition fails to reach** depends on what generation currently produces. |
| **5.5** — *a Retrospective whose inputs are model-summarised and whose actions nobody owns* | `summarisation-displacement` names a failure mode that exists because summarisation became cheap. |
| **5.6** — *a decline in the Developers' ability to meet the Definition of Done without generation* | `generation-dependence` and `capability-erosion` describe a trend whose shape follows how much of the work generation is doing. |

**The other four D5 tasks are Guide-stable, and they are correctly in this domain
anyway.** 5.2 (too much to inspect within the Sprint Review), 5.7 (throughput rising
while Increment usability falls), 5.8 (transparency lost to production rate) and 5.9 (a
Developer who cannot account for work they submitted) carry **no AI vocabulary** in
their statements, their knowledge, skills or abilities, or in any of their twelve
concept descriptions. **None of them is new.** A Review with too much in it, volume
beating quality, and a Developer who cannot explain their own work all long predate
generative tooling.

**What AI changed is their frequency, not their answers**, and the JTA already records
it: all four are `per_sprint`. They belong in D5 because generation is what turned four
occasional dysfunctions into per-Sprint ones, and a Scrum Master in an AI-augmented team
now meets them every Sprint rather than once a year. **That is a real reason for their
placement, and it is not a reason to shorten the interval** — what a candidate is tested
on in those four does not date. (5.6, the one D5 task marked `occasional`, is among the
three that do date: a capability trend is noticed occasionally even where the tooling
producing it is used daily.)

**So the interval rests on 7.5%, not on 22.5%, and that is a weaker case than this
section previously made.** **The interval is set by the fastest-moving part of the body
of knowledge, not by its average** — the principle stands and is the right one. What
changed is the measured size of that part. Recertification re-tests against the
then-current body of knowledge.

**One year is retained, and it is the body's choice rather than a conclusion the
measurement forces.** On the content alone **a two-year cycle would also be defensible**:
92.5% of this examination rests on a document revised every few years, and the 7.5% that
moves is carried by three tasks. One year is kept for two reasons, neither of which is a
derivation from the content:

1. **Catalogue consistency.** `SM-AI-I` holds one year by its own argument, and a Level
   II credential outliving the Level I credential beneath it is difficult to explain to
   a holder.
2. **Recertification content is undefined.** Until §12's open item is closed there is
   nothing to trade a longer interval against — a two-year cycle with an unspecified
   renewal is a longer gap, not a lighter burden.

**This is owed a revisit when recertification is defined.** The honest form of the
question is whether 7.5% of an examination moving justifies re-testing the other 92.5%
every twelve months.

> **CORRECTION, 2026-09-09 — the 22.5% argument was measured and did not hold.**
>
> This section previously read: *"Nearly a quarter of what this credential attests
> concerns a context that is being renegotiated continuously: what a team may delegate
> to a model, what inspection means when an artifact was generated, what a Developer can
> be accountable for."* It inferred the share of the examination that dates from **D5's
> domain weight**, which is a different quantity.
>
> **Measured over all 44 tasks and 131 concepts:** five of nine D5 tasks carry any AI
> vocabulary (12.5% of the form); three are genuinely AI-contingent (7.5%); four carry
> none in statement, knowledge, skills, abilities or any of their twelve concept
> descriptions (10.0%). **No task outside D5 carries any**, in any of those fields. The
> search was verified against D5 itself before the zero was trusted — it fires on
> exactly 5.1, 5.3, 5.4, 5.5 and 5.6, and is silent on 5.2, 5.7, 5.8 and 5.9.
>
> **All three worked examples were checked against the tasks. None held:**
>
> - *"what a team may delegate to a model"* — **no SM-AI-II task covers delegation.**
>   That competence is `SM-AI-I` 2.11, *"Distinguish work a team may delegate to AI from
>   the accountabilities it must retain"* — a task in the credential below this one.
> - *"what inspection means when an artifact was generated"* — the two inspection tasks
>   are 5.2 and 5.8, and **neither mentions generation.** 5.8 reads *"work produced
>   faster than the team can inspect it"*, cause unstated.
> - *"what a Developer can be accountable for"* — that is 5.3, whose own concept
>   `tool-non-accountability` answers it with the Guide's list of the three
>   accountabilities. **Settled, not renegotiated.**
>
> **No task was moved.** The four Guide-stable tasks are correctly in D5 for the
> frequency reason stated above; relocating them to repair a sentence would move domain
> weights and the computed cognitive profile, which is a worse trade than a wrong
> sentence. The sentence was corrected instead.

**What recertification consists of is not yet defined** — whether a full form, a shorter
one, or something else — and no scheme in the catalogue defines it. Named in §12.

---

## 10. Traceability and coverage

The scheme maintains a complete, queryable traceability matrix from **domain → task →
concept → item → lesson**, with every assessable item bound to exactly one task.

| Guarantee | Check | Required |
|---|---|---|
| No untaught testing | coverage view | violations = 0 |
| Concept coverage | coverage view | concepts taught = concepts total |
| Secure firewall | secure items holding a concept link | 0 |
| Trilingual integrity | item groups not holding exactly 3 language rows | 0 |
| Blueprint sufficiency | per-task secure count, per language | ≥ 8, all 44 tasks |
| Blueprint equals the computed profile | `exam_blueprint` against `v_cognitive_profile` | drift ≤ 0.02 |
| Answer-cue neutrality | position distribution, key-longest rate, length spread | within §8.1 bounds |
| **Scheme document equals the database** | the `scheme-claims` block below | every claim matches |

These are live queries run by `scripts/verify-cert.mjs`, not a periodic report, and they
are the same queries the conformance tool runs before any publication decision.

**The last row is new to this scheme's generation of documents.** Until 2026-09-08
nothing checked a scheme document against anything; `verify-cert` verified the database
against itself. **SM-AI-II is the first scheme authored with its claims block from the
start** rather than reconciled to one afterwards.

---

## 11. Complaints and appeals

**This is the first Certidemy scheme that can describe an appeals process that actually
runs**, rather than name one as an operational record still owed. ISO/IEC 17024 clause
9.9 requires a documented candidate review process.

**What exists.**

- **A candidate route at `/appeals`**, inside the authenticated application. A candidate
  sees their own examination attempts and the status of any appeal against them, and can
  file against an attempt from that page.
- **`appeals.kind = 'regrade'`** — a request to review the result of a specific
  examination attempt. Every appeal is bound to one `exam_attempt_id`, so the record
  under review is always identified.
- **A reviewer surface in the console**, restricted to platform administrators, where an
  appeal can be moved to `under_review`, `upheld` or `denied` with a written
  `resolution_note`. A resolution note is required; a decision cannot be recorded without
  a reason.
- **Reviewer identity is recorded.** `appeals.reviewed_by` and `reviewed_at` (migration
  280) capture who decided and when. Clause 9.9 requires that the reviewer not be the
  original decision-maker; on this platform the original decision is **automatic** —
  produced by the scorer against a fixed key, with no human judgment — so there is no
  original decision-maker to be separated from. The column exists because **reviewer
  identity cannot be captured retroactively**: the moment any human touches a result, the
  separation is assertable only if the column was already there.
- **One open appeal per attempt**, enforced by a partial unique index on
  `exam_attempt_id where status in ('open','under_review')` (migration 279). A resolved
  appeal — upheld, denied or withdrawn — does not block a new filing.
- **A candidate reads their own appeals and nobody else's**, by row-level security; only
  a platform administrator can update one.

**What does NOT exist, stated plainly.**

- **No notification.** A candidate is not told when their appeal changes state; they must
  return to `/appeals` and look.
- **No stated turnaround and no deadline.** The scheme commits to no response time, and
  places no limit on how long after an attempt an appeal may be filed.
- **No item-challenge mechanism.** `appeals.kind` allows `'item_flag'` and nothing can
  produce one. **A candidate never sees a question identifier after an attempt, and that
  is deliberate** — it is a security property of the secure bank, not an oversight. The
  intended design captures an item challenge **in session**, where the question is on
  screen, and promotes it to an appeal at scoring time. It is not built.
- **The in-exam "mark for review" control is not an item challenge** and must never be
  read as one. A mark is a bookmark: the candidate has asserted nothing about the item
  (migration 281).
- **No published email route.** `info@certidemy.com` is named as the appeals address
  in `functions/_shared/objections.ts` — the partner objection-handling brief, an
  internal document — and appears on no candidate-facing surface. It is not a route this
  scheme can claim.
- **No complaints process distinct from appeals** — about the conduct of an examination,
  the body, or a person. Nothing in the platform records one.

**A candidate who cannot sign in has no route at all.** That is the gap this section is
least comfortable naming, and it is named in §12.

---

## 12. Open items on the path to accreditation

Stated plainly, because overstating readiness is the one thing an assessor does not
forgive.

> **An entry stays listed until its claim is false as well as its failure resolved,
> and those are two different things.** `CERT-PUBLISH-CHECKLIST.md` §6 step 4 requires
> every remaining `verify-cert` failure to be **named** here. It does not — and cannot —
> check that the reason given is still **true**. A row whose failure persists for a
> changed reason passes that step while saying something false, and this table has
> already produced both halves: the `jta_versions` entry was deleted on 2026-09-09
> because its failure had been resolved, and the instructional-content entry was
> reworded the same day because its failure persisted and its stated reason had
> stopped being true. **Re-read the reasons, not only the verdicts.**

| Item | Status |
|---|---|
| Instructional content (44 lessons) | **All 44 authored, none loaded.** All five modules exist as `status: draft` files under `content/sm-ai-ii/`; no lesson row is in the database, so every concept still reads as untaught (`verify-cert` §10, 0/131). **This row read "nine of 44" until 2026-09-10: the failure never changed and the stated reason stopped being true, which is the second half of the case the banner above describes.** |
| Item banks | **Not generated.** Zero items exist; the floors in §8 are a design commitment. |
| Body of knowledge | **Exists** as `jta/SM-AI-II_BoK_v2.0.md` (2026-09-10), **and was reconstructed rather than authored at Stage 1.** The scheme, the JTA and 44 lessons were built before it, so it cannot have constrained them — which is what a Stage 1 body of knowledge is for. `v1.1` was cited as signed 2026-09-02, was never committed and is unrecoverable. The document carries this in its own provenance banner and §11, and does not close by being signed. |
| `item-profile.mjs` tier routing | **Blocker before Stage 9.** It routes on the certification NAME via `/\bscrum\b/` and does not read `tier`, so this scheme would generate against `SM-AI-I`'s Level I difficulty profile. |
| Cue-tolerance declaration | **Pending measurement.** Migration 278 carries `ISMS-IA`'s numbers with `measured_over: null` (§8.1). |
| Examination duration | **A floor, not a measurement.** 150 minutes is the tier-II base; migration 212 is the template for deriving the real number once the bank exists (§6). |
| Catalogue claim and long-form description | **Not written, in any of the three languages.** The catalogue card renders code and name only; the detail page falls back to English silently. |
| JTA translations | **Not generated.** All 5 domains and all 44 tasks are English-only; `gen-jta-translations.mjs` has not been run. |
| Six public sample items | **None exist.** Six per language across six distinct tasks are required before publication. |
| Standard-setting stage 1 — define the borderline candidate | **DONE** (§7.1). |
| Standard-setting stage 2 — Angoff panel | **Pending a panel of independent SMEs.** Blocked by recruiting, not by candidate volume. |
| Standard-setting stage 3 — validation | **Pending candidate data.** No live candidates yet. |
| Formal SME-panel JTA validation | **Pending.** Two independent review passes complete; a convened panel is not. |
| Item difficulty and discrimination statistics | **Pending candidate data.** |
| Form reliability estimates | **Pending candidate data.** |
| Governance-level impartiality structure | **Not established** (§8). |
| Appeals: notification, turnaround, deadline | **Not defined** (§11). |
| Appeals: item-challenge capture | **Not built** (§11). |
| Appeals: a route for a candidate who cannot sign in | **Does not exist** (§11). |
| Recertification mechanism | **Not defined.** What a renewal consists of is unspecified here and in every sibling scheme (§9). |
| An active achievement row | **Required before `status` can leave `draft`**, enforced by `trg_guard_cert_has_active_achievement`. |
| Accreditation to ISO/IEC 17024 | **Not held.** Scheme designed to the framework; accreditation not claimed. |

**The inert first form of Screen 1(b) is preserved in §5.2 above and nowhere else.** It
was carried in `SM-AI-II_BoK_v1.1.md`, which cannot be produced;
`jta/SM-AI-II_BoK_v2.0.md` §6.2 states the corrected form only.

---

## Declared claims (machine-checked)

A green run of this block means the document is honest about an unfinished scheme, not
that the scheme is ready — it currently passes while declaring zero lessons and zero
items, and §12 is what states readiness.

<!--
  THE BLOCK BELOW IS AUTHORED, NEVER GENERATED.
  It is what THIS DOCUMENT claims. If it were produced by querying the database
  it would verify the database against itself and pass forever.
  When a check fails, establish which side is wrong. NEVER regenerate the block.
  Checked by scripts/verify-cert.mjs, invariant scheme.* -- see its docblock.
-->

```scheme-claims
items: 50
duration_minutes: 150
passing_score_pct: 75
validity_days: 365
domains: 5
tasks_total: 44
tasks_exam_scope: 44
concepts: 131
modules: 5
lesson_groups: 0
domain_weights: D1=20.0, D2=20.0, D3=17.5, D4=20.0, D5=22.5
domain_tasks: D1=9, D2=9, D3=8, D4=9, D5=9
```

---

*End of SCHEME-SM-AI-II.md. The JTA of record is `jta/SM-AI-II_JTA_v1.4.md`, published in
`public.jta_versions`; the body of knowledge is `jta/SM-AI-II_BoK_v2.0.md` (2026-09-10),
reconstructed rather than authored at Stage 1.*
