# STYLE-GUIDE-SM-AI-II.md

**Per-cert authoring delta for Scrum Master II - AI.**
**Version:** 1.0 · **Derived from:** module 1, nine lessons, authored and externally
reviewed 2026-09-09.
**Applies to:** the remaining 35 lessons, all three languages, and the item banks.

This document does **not** restate `LESSON_AUTHORING_SPEC.md`. It records only what is
different or additionally binding for this credential, and every rule here was earned by
writing module 1 rather than decided in advance.

**The one-line version of the whole guide:** this scheme certifies judgment in the space
the 2020 Scrum Guide leaves open. Every rule below exists because module 1 found a way
to close that space by accident - with the previous edition's text, with a Level I
explanation, with a distractor nobody would pick, or with a widget that promised a
mechanism and delivered prose.

---

## 0. THE RULES THAT OVERRIDE EVERYTHING

### 0.1 Every Guide claim is 2020 text, or the sentence says it is inference

> **If a lesson says the Guide requires, permits, provides or is explicit about
> something, that sentence must be checkable against the 2020 text. If it is inference
> from the text, the sentence says so.**

**This is the worst defect a lesson in this credential can have**, and it is worse here
than it would be in any other scheme in the catalogue. `SM-AI-II` rests on the Guide's
**silences**: the whole Level II argument is that the framework constrains without
determining, so the practitioner supplies the reading. **Filling a silence with the
previous edition's text destroys the argument the scheme is built on.** It does not
merely teach a wrong fact - it converts a judgment task into a lookup task, and then the
item bank inherits the lookup.

**What it cost.** Lesson 01-06's deep-dive presented the **2017** cancellation procedure
as Guide content: that cancellations *consume resources*, are *often traumatic*, are
*very uncommon*, that Done items are *reviewed*, and that incomplete work is
*re-estimated and returned to the Product Backlog*. It also attributed to the Guide an
observation about short Sprints keeping cancellation rare.

The 2020 Guide says **two sentences**, in full:

> "A Sprint could be cancelled if the Sprint Goal becomes obsolete. Only the Product
> Owner has the authority to cancel the Sprint."

Everything else was deliberately deleted, and the 2020 release notes name the deletion.
**State the positive, not the absence.** The 2020 edition carries those two sentences and
no cancellation procedure, and its word for the activity is *sizing* - *"The Developers who
will be doing the work are responsible for the sizing."* A wording change can be quoted; an
absence cannot be shown by any instrument available here. **Two of that lesson's four checkpoint questions test the
deleted material**, so the defect had already reached assessment.

**Three more the review found. None may be reintroduced anywhere:**

| Lesson | The sentence | What the 2020 Guide actually says |
|---|---|---|
| **01-03** | *"...and then the same asymmetry applies to itself, because a Definition of Done that can be relaxed when a Sprint gets tight is not a definition of anything."* | *As a minimum* governs an **organizational** standard. The Guide provides **no rule against a Scrum Team lowering a Definition of Done it created itself.** The claim is sound practice and it is inference - so it must say so. |
| **01-04** | *"The Guide is unambiguous about which of the two the Sprint Backlog is."* (the passage rests throughout on *forecast*) | 2020 calls the Sprint Backlog **"a plan by and for the Developers."** The word *forecast* appears **at least twice, and neither instance describes the Sprint Backlog**: *"Various practices exist to forecast progress, like burn-downs, burn-ups, or cumulative flows"* (The Sprint) and *"the more confident they will be in their Sprint forecasts"* (Sprint Planning, Topic Two). **The Guide had the word available and still called the artifact a plan - it is a choice, not an absence of vocabulary.** "Forecast" for the Sprint Backlog is 2011-2017 language. |
| **01-02** | *"The Developers are accountable for sizing the work - the Guide is explicit that the people who will do the work are the ones who size it."* | *"The Developers who will be doing the work are **responsible for the sizing**. The Product Owner **may influence** the Developers by helping them understand and select trade-offs."* **Responsible, not accountable**, and the permitted influence is half the sentence. |

**The 01-04 case is the load-bearing one, because the JTA carries the same error.** Task
1.4's knowledge line reads *"The Sprint Backlog is a forecast; the Sprint Goal is the
commitment"*; 4.8 and 5.4 say the same. **An author who copies a task's knowledge line
into a lesson propagates a 2017 word under a 2020 attribution.** The *commitment* half is
Guide text - 2020 carries a "Commitment: Sprint Goal" heading and the sentence *"Although
the Sprint Goal is a commitment by the Developers, it provides flexibility in terms of
the exact work needed to achieve it."* The *forecast* half is not.

> **Task 4.8's knowledge line stated that "the Guide never mentions velocity, burndowns
> or story points." No occurrence of velocity or story points was found; burn-downs
> are named**, in the burn-downs sentence quoted above. Corrected in the JTA on
> 2026-09-09. A lesson repeating the original line would have asserted something false
> about the Guide while teaching a lesson about not asserting things about the Guide.

**Working rule:** the 2020 Scrum Guide is thirteen pages. Keep it open in a second
window and search it. Every defect above would have taken under a minute to catch.

#### The instrument, and why it cannot prove an absence

This rule was itself broken by the tool used to enforce it, on its own subject, which is
the most useful thing in this section.

The forecast count above was first written as **"appears once in the whole document."**
That came from a URL fetch that converts the page and answers through a small model.
**Asked whether the word appears and in what sentence, it returned one instance. Asked
for an exhaustive section-by-section list with a total, it returned "Total Count: 1" -
more confidently for the more exhaustive prompt. Asked to reproduce Sprint Planning Topic
Two verbatim, the second instance was in the first passage returned.** The wrong number
had by then been written into this document twice, a commit message, and two sections of
`SCHEME-SM-AI-II.md`.

> **Ask for the passage, never for the count.** A count from a summarizer is a claim
> about absence, and a summarizer answers from what it surfaced rather than from what is
> there. Quote the section and read it yourself.

**And the honest caveat on everything else in this section.** Every Guide verification in
this session used that same instrument. **The cancellation finding** (that *traumatic*,
*re-estimated* and *estimate* appear nowhere), **the velocity and story-point absences**,
and **the burn-downs claim** were all established the same way. The burn-downs claim is a
presence and is verified - a quoted sentence proves a presence. **The absences are not
proven.** They are very likely true and they are not established by a method that can
establish them.

Where a rule turns on a word being absent, either quote the passage where it would have
appeared and is not, or say the absence is unverified. **This document is about not
making unproven claims about the Guide; it does not get an exemption.**

### 0.2 The Level II move starts in the first concept

> **A lesson may state the Level I rule in ONE SENTENCE. If the first `::concept` block
> explains what a Sprint Goal, a Definition of Done or the Sprint Backlog *is*, the
> lesson has spent its opening on the credential below it.**

**What it cost.** **Seven of module 1's nine lessons** open with a full concept block
restating what `SM-AI-I` already certifies. The candidate holding this credential's
prerequisite has been tested on all of it. A lesson that re-teaches it has moved its own
competence into the second half and shortened the part that carries the task.

The scheme's own §5.1 makes this a conformance question, not a taste question: two
schemes over one job title are legitimate only where they certify **different competence
classes**. A Level II lesson that opens by defining a Level I term is evidence against
the distinction the scheme argues for.

**The shape that works:** state the rule, then immediately state the tension it does not
resolve. `01-01`'s hook does this in one line - two Guide provisions that both apply and
point in different directions, and nothing in the Guide says which wins.

### 0.3 No distractor a competent Scrum Master dismisses on sight

> **The test is not "is this wrong?" It is "would an experienced Scrum Master actually
> pick this?" If the answer is no, the option is occupying a slot and teaching nothing.**

At Level II an item presents **four defensible options, one best**. A distractor that
contradicts a Guide rule outright is a Level I item's distractor, and it converts a
four-way weighing into a two-way one - which is the exact failure the blueprint's
`item_model.contract` names: *"An item whose second choice is incorrect is a Level I item
in the wrong bank."*

**What it cost.** The review listed **twelve** across module 1. The pattern, quoted:

- *"the Sprint Backlog is frozen once the Sprint starts"* - contradicts the Guide's own
  statement that the Developers update it throughout the Sprint
- *"cannot assess without velocity"* - velocity is not in the Guide at all
- *"the Scrum Master cancels to protect the team"* - the Guide names one person with the
  authority, and it is not the Scrum Master

None of the three is a decision anyone weighs. Each is a recall check wearing a scenario.

**The two that worked, and they are the reference pattern:**

**`01-01` q2** - a stakeholder asks the Developers directly for a two-hour fix unrelated
to the Sprint Goal; the Developers say they can fit it in; the Scrum Master knows those
two hours are the only remaining buffer before an integration step the Goal depends on.
The live contest is between:

> *"Refuse it on the team's behalf, since stakeholders may not add work to a Sprint."*
> versus
> *"Make the consequence visible to the Developers and the Product Owner, so the decision
> is taken by the people accountable for it."*

**Refusing is defensible.** It protects the Sprint Goal, which is the Scrum Master's
concern. It is second-best because it takes a decision away from the people accountable
for it - and stating *why* it is second-best is exactly the competence.

**`01-04` q4** - a stakeholder frames undelivered scope as a broken promise at the Sprint
Review. The contest:

> *"Correct the terminology: the items were a forecast, and only the Sprint Goal was a
> commitment."*
> versus
> *"Report the outcome against the Sprint Goal, note that three items proved unnecessary
> to it and are back in the Product Backlog, and let the Product Owner take it from
> there."*

**Correcting the vocabulary is right and is not the best move.** Answering against the
goal does the same work without a lecture, and leaves the Product Owner holding their own
accountability. Both options are things a good Scrum Master does.

> **That option is quoted live, and its own use of *forecast* is a §0.1 defect the
> rewrite will fix.** It is reproduced here for its **structure** - two defensible moves,
> the runner-up genuinely right - and not for its vocabulary. **A guide that silently
> improves what it quotes is doing the thing this guide exists to prevent.**

> **Test each distractor by naming the practitioner who would choose it and why they
> would be defensible. If you cannot name one, rewrite the option.**

### 0.4 The best answer never recommends omitting a Scrum element

> **Standing rule for lesson authors and item writers alike: no correct answer, no
> best-path step, and no widget "correct" state may recommend dropping, skipping or
> replacing an event, artifact, commitment or accountability.**

**Where this comes from.** Lesson `01-09` is correct and it is the most dangerous lesson
in the module. It teaches - accurately - that *"Scrum is immutable"* is not a
prohibition: the Guide says a partial implementation is **not Scrum**, and it has no
mechanism to forbid anything. Its own words: *"a Scrum Master who says 'you can't do
that' has cited an authority that does not exist, and will be right on the substance and
wrong about the rule."*

**That is true, and it generates items whose best answer is "let them drop the Daily
Scrum."** The review's warning was about the generation step, not the lesson.

The resolution is in the lesson already, and it is the sentence to reuse: the consequence
is not a rule, it is that **what the team has afterwards is not Scrum**, and the
Retrospective they used to decide it is among the things that may not survive. A best
answer may **name that consequence**. It may not **recommend the omission**.

### 0.5 No estimation vocabulary in an example; durations only, and only when the size is the subject

> **Do not use story points, velocity, burn-downs, or a bare number standing in for
> effort as the currency of a scenario, a widget, or a checkpoint option - not even in a
> correct answer.**
>
> **CARVE-OUT: a duration in real units is permitted where the size ITSELF is the
> subject.** Where the competence is reading *why a number moved*, two figures are needed
> to compare, and removing them removes the competence.

**What it cost.** `01-02`'s first draft used one three lessons before `01-04`'s pitfall
says neither is in the Guide:

> *"Five points feels high for that. Can we call it three?"*

**The example trains the opposite of the hygiene.** A candidate who meets story points in
a lesson's own illustration has been taught that they are the natural vocabulary, and
then meets a pitfall callout disowning them. The rewritten `01-02` uses days.

#### The test, three questions in order

**1. Does the number carry a real unit - days, hours, weeks?** If it is *points*,
*velocity*, *story points*, or a bare integer with no unit, it is forbidden. **This is a
lexical check:** `grep -i 'point\|velocity\|burndown\|burn-down'` over the lesson.

**2. Is the number the subject, or the setting? Delete every figure from the scenario and
re-read it. If it still asks the same question, the figures were furniture - leave them
out.** `01-02` q1 fails that deletion and therefore passes the rule: *"the Developers
size an item at five days… a Developer offers three"* cannot be asked as *"the Developers
size an item and the Product Owner questions it"*, because there is no movement left to
read.

**3. Is the number ever compared across items, teams or Sprints?** Comparing sizes
between items is relative estimation; comparing across teams or Sprints is velocity.
**Both are forbidden regardless of unit.** A duration is permitted only for **the same
item at two points in time.**

#### Why days and not points, so this is not a matter of taste

A day is a unit of work duration that exists whether or not a team uses Scrum, and the
Guide's own Topic Two names *"past performance"* and *"upcoming capacity"* as legitimate
inputs to how much fits in a Sprint. Story points and velocity are artifacts of an
estimation practice the Guide does not require. Its one sentence on forecasting practices
names burn-downs, burn-ups and cumulative flows and adds *"while proven useful, these do not
replace the importance of empiricism"* - a statement about what is optional, which is what
the rule needs, and not a claim about which words are missing. **A lesson using days teaches nothing
the candidate must later unlearn; a lesson using points teaches a vocabulary the same
module's pitfall callout disowns.**

The Guide's word for the activity is **sizing**.

> **`4.8` and `5.4` sit on the same carve-out.** *A forecast that has become a performance
> target* and *model-produced estimates read as commitments* are both tasks whose subject
> is a number, so both lessons will need figures. **Durations, for the same item across
> two moments, for the same reason.** Neither may reach for points to make the scenario
> feel realistic.

### 0.6 A widget must do the thing its intro promises

> **If the intro says the reader will observe something by manipulating the widget, the
> widget must produce that observation as a state. Prose after the widget is not the
> widget doing it.**

**What it cost.** `01-04`'s `toggle-and-observe` opens: *"Two things are independently
true or not: the Sprint Goal was met, and the forecast scope was fully delivered. ...
Toggle both and read what each combination actually indicates."* That promises **four
quadrants reachable by toggling**. The widget delivers per-toggle `on_consequence` and
`off_consequence` strings, and **the four combinations are then described in prose below
it.** A reader who does the promised thing does not find the promised result; a reader who
skips the widget loses nothing.

The reflection prompt makes the gap visible - *"Which of the four quadrants is invisible
to an organization that tracks only delivered scope?"* - a question the widget never puts
the reader in a position to answer by using it.

**Two ways out, and either is fine:** use the `depends_on` chain so the toggles compose
into states, or drop to `drag-match` with four combination cards and four readings. **Do
not keep an intro that promises a mechanism the widget does not have.**

### 0.7 A keyed-correct option is an assertion, and §0.1 governs it

> **§0.1 applies to options and explanations BEFORE it applies to concepts and callouts.
> An answer key makes a stronger claim than a sentence does, because a candidate who
> disagrees with it is marked wrong.**

Prose can be read sceptically. A key cannot. A lesson that says something false in a
concept block invites a reader to push back; a lesson that keys it correct **tells the
candidate their correct belief is the wrong one, and scores them on it.**

**What it cost.** `01-01` q3 offered *"It is a forecast by the Developers"* as a true
statement about the Sprint Backlog **and keyed it correct.** The 2020 Guide calls that
artifact *"a plan by and for the Developers"*; the word *forecast* is 2011-2017 language
for it. `01-04`, three lessons later in the same module, teaches exactly that — and the
key three lessons earlier told the candidate the opposite.

**It survived the external review, four rewrite passes and every validation sweep this
document describes.** Not because the sweeps were careless: because **every one of them
read prose.** §0.1's own working rule — *keep the Guide open in a second window* — was
followed, against concepts, callouts and deep-dives. Nothing read what an option
asserted. A defect can sit in the highest-stakes sentence in a lesson and be invisible to
a check that looks everywhere else.

> **The check: read the 53 keys, not the 9 lessons.** Thirty-six questions across nine
> lessons: 27 single-choice keys, plus 26 more across the nine multi-choice questions.
> (This said 48 until 2026-09-09 - a miscount, in a rule about checking things properly.
> Derive the figure from the files; do not carry it.) Extract every option marked correct
> and every explanation,
> and read that list against the Guide as a list — separately from the lesson it came
> from, so the surrounding prose cannot supply a charity the candidate will not get.
>
> **A wrong distractor is a §0.3 problem. A wrong key is a §0.1 problem, and it is worse.**

### 0.8 A checker needs a control that fires

> **Plant the defect the check is meant to catch and confirm it catches it. Only then is
> a zero worth anything.**

A scan that reports nothing has told you one of two things and does not distinguish
between them: there is nothing there, or the scan does not work. **This module produced
four of the second kind in a single day.**

| the check | what it did |
|---|---|
| the 2017-material scan | fired on `01-06`'s own **disowning** sentence — the paragraph naming what the Guide does not say matched a search for what the Guide does not say |
| the `forecast` classifier | same shape, on `01-04`'s *"What is wrong is naming the artifact a forecast"* — the sentence teaching the rule counted as a violation of it |
| the overlap checker | compared options rather than whole questions, and **missed** `q3`/`e2`. Its zero read as "no duplication" |
| the `task_concepts` fetch | hit PostgREST's default row limit, returned a truncated set, and reported **all 27 D1 concepts as foreign to D1** |

**The first two are false positives, which are cheap — they announce themselves.** The
last two are false negatives, which are the dangerous half: one reported *no overlap*
where overlap existed, and one reported a catastrophe that did not exist, which is the
same failure wearing the opposite sign.

**All four are the same error: a substring, a sample or a default limit standing in for
the property.** A regex over text cannot tell an assertion from its refutation, because
both contain the words. A row fetch without an explicit limit is a sample, not a set.

**A fifth, and it is not a checker - it is the tool that applies the fix.** A batch edit
script called its file-modifying function twice on one path. Each call re-read the file
from disk, so the second call computed its output from the **unedited** text and the write
silently discarded the first edit. Nothing errored: both edits were correct in isolation,
both anchors were unique, and every post-condition on each one passed. **The defect was in
the sequence, not in either edit** - the same shape as the sample and the substring, where
the instrument is right about what it examines and wrong about what it stands for. It was
caught only because one post-condition asserted a property of the **final** file rather
than of each edit. **One edit call per path, enforced by the script rather than remembered
by its author.**

**So before trusting a zero:** add a line that should match and confirm it does; run the
check against a lesson you know contains the defect; or assert the count you expect and
fail on anything else. The repo's own rule already covers this — *"the recurring failure
mode of this system is silent success, and it is caught only by asserting a specific
expected value, never by the absence of an error."* **A checker is a system too.**

#### A removal needs a sweep, not a read

The cases above are **checks** that reported wrongly. This one is a **fix** that reported
wrongly, and it is the more common failure.

The invented cancellation claim was removed from `01-06`'s deep-dive, the lesson was
re-read to confirm the cut landed, and **the same claim survived in four other places** —
concept 1's *"cancelling a Sprint destroys the container that inspection and adaptation
happen inside"*, concept 2's comparison, the widget feedback, and a summary bullet. The
lesson asserted in four places what its own deep-dive had just refused to assert, and the
note disclaiming exactly that kind of fill-in sat below them. It took a third external
review to find, and **the second sweep found one more than the review had listed.**

> **Reading a file to confirm a removal is the same error as trusting a zero.** The eye
> confirms the thing it was looking for is gone and slides straight past the same claim
> in different words.

> **After removing an invented provision, grep for the CLAIM, not the sentence — and use
> two lenses if the claim can be stated without its keywords.** This one could: *"a
> cancelled one **produces none of them**"* contains no loss verb, names no event, and
> would survive any search built from the sentence that was deleted.

**An invented provision is rarely stated once.** It gets written where it is argued, then
restated in a callout, compressed into a widget's feedback, and finally reduced to a
summary bullet — four surfaces, four wordings, one claim. **Removing the argument and
leaving the compression is the normal outcome**, because the compression is the version
that no longer looks like a Guide attribution.

---

## 1. WHAT MODULE 1 ESTABLISHED

Nine lessons, one per task, `1.1` through `1.9`. Uniform enough to be a convention:

| Element | Module 1 | Binding? |
|---|---|---|
| Duration | 12 or 13 minutes (13, 12, 12, 13, 13, 12, 13, 12, 13) | Yes - 12-13. Under 11 means a concept was cut; over 14 means two lessons |
| `::concept` | 3 or 4 | Yes - 3-4, and see §0.2 for what the first one may not be |
| `::callout` | Exactly 2 in every lesson | Yes - 2, and every dismantled Guide claim gets one |
| `::deep-dive` | Exactly 1 in every lesson | At most 1 |
| `::interactive` | Exactly 1 | Yes |
| `::checkpoint` | 4 questions in every lesson | Yes - 4. See §3 |
| `task_codes` | Exactly one code | Yes |
| `concept_slugs` | Exactly the three mapped to that task | Yes - all three, none added. Every task on this cert has exactly three |
| `prerequisites` | Chains to the previous lesson in the module | Yes |

**`lesson_id` carries the `sm-ai-ii-` prefix** and equals `lesson_group_id`. Slug
uniqueness is global, not per-cert. The filename does not carry the prefix.

**Titles are claims, not labels.** *"The Goal Was Met and Half the Backlog Was Not"*, not
*"Sprint Outcomes"*. Every module 1 title states the tension; keep it.

> **A `::deep-dive` renders collapsed in Focus mode.** Nothing that corrects a Guide
> attribution may live in one - a candidate on a phone can finish the lesson without
> expanding it. This is how `01-06` shipped 2017 text where nobody was looking. Depth for
> the interested reader belongs there; corrections belong in a `pitfall` callout in the
> main flow.

---

## 2. WIDGET CONVENTIONS

Module 1 used four of the six primitives. `sort-into-order` and the remaining primitive
are unused here - **read a rendered lesson elsewhere in the catalogue before the first
use of either**, per `STYLE-GUIDE-ISMS-IA` §0.2.

Every one of these is subordinate to §0.6.

### 2.1 `scenario-mcq` - used in 01-01, 01-05, 01-08

The branching pattern is the catalogue's, and it is unchanged here:

- **The terminal step omits `next` entirely.** Its options carry only `id` and `text`.
- **Wrong choices route to a correction step**, not to a shared debrief; the correction
  states why the choice fails and re-offers the remaining options.
- **Correct choices acknowledge before advancing.**
- `best_path` lists `step-id:option-id` pairs.
- Validate before shipping: every `next` resolves, the terminal step has none.

**Additionally for this cert:** the wrong path is where the Level II teaching happens.
A correction that says *"that is against the rules"* has written a Level I item into a
Level II widget. The correction must say **what the choice costs** - whose accountability
it absorbs, what it makes invisible, which conversation it prevents.

**Choose this widget when the competence is sequential judgment** - a first move, then
what the first move changes. `01-01` and `01-08` both turn on the second decision, not
the first.

### 2.2 `drag-match` - used in 01-02, 01-07

**Strictly 1:1.** `verify-cert` invariant 13 checks it: equal items and targets, a
bijection in `correct`, no `allowReuse`.

**Use it where the competence is attribution from evidence.** `01-07` is the model: four
described incomplete items, each attributed to a Done failure or a forecasting failure
from what the Sprint itself shows - when the item was started, which criterion is unmet,
what happened to the other items, when the Developers found out. **The evidence must be
in the card**, not recoverable only from the lesson body.

Four to six pairs. `01-07`'s four are enough because each card carries a different signal.

### 2.3 `highlight-mistake` - used in 01-03, 01-06, 01-09

**Include non-defects, and make the lesson's own thesis one of them.** This cert's
recurring teaching point is that a familiar-looking thing is *not* a violation -
`01-09`'s whole subject is a practice that works and is not part of Scrum. **The
distractor that is not a defect is where the misconception lives.**

Set `minimum_correct` below the number of true defects, so the widget rewards recognition
rather than exhaustiveness.

> **A reviewer who says a non-defect distractor is wrong has told you the lesson failed
> to teach its own point.** That is useful information, not a defect report.

### 2.4 `toggle-and-observe` - used in 01-04, and see §0.6

**Use the `depends_on` chain or use a different widget.** The mechanic locks a toggle
until its predecessors are on, which is the only reason to choose this primitive: it
renders an argument in which each condition is worthless without the one before it.

**`01-04` chose it for independent conditions and got prose instead of states.** If the
conditions are independent, use `drag-match`.

Write `off_consequence` as a **concrete failure**, never as the absence of a benefit.
`01-04` does this well even where the widget choice is wrong: *"The Sprint did not achieve
what it was for. This is the outcome worth inspecting, whatever happened to scope - and it
is the one a velocity chart cannot show you."*

---

## 3. CHECKPOINT CALIBRATION

**Four questions per lesson.** Module 1 is uniform on this and it is right: three is thin
for a Level II lesson, five crowds the end.

**Bloom is the task's, and the database enforces it.** A checkpoint question whose
`bloom_level` disagrees with `public.tasks` will not insert. This cert has **no
`1_remember` and no `2_understand` tasks at all**, so every checkpoint question in the
credential is `3_apply` or `4_analyze`. There is no low rung to fall back to.

### 3.1 Difficulty range and distribution

Module 1 shipped `difficulty` 2 through 4. **Two is too low for this credential.**

| Bloom | Difficulty | How many of the four |
|---|---|---|
| `3_apply` | **3** | Two |
| `3_apply` | **4** | Two |
| `4_analyze` | **3** | One or two |
| `4_analyze` | **4** | Two or three |

> **No question below difficulty 3.** Eight of module 1's nine lessons open with a
> difficulty-2 question. `01-09` is the exception - its four are 3, 3, 4, 4 - and it is
> the shape to copy. A difficulty-2 question on a cognitive-only rung above a Level I
> credential is testing the credential below it, which is §0.2 in the checkpoint.

### 3.2 What an Analyze question must actually do

It must require the candidate to **weigh** something. Recognition dressed in a scenario is
still recognition.

**The test:** if the candidate could answer by recalling one sentence from the lesson, it
is not Analyze regardless of how long the stem is.

**And the sharper test for this cert:** name the second-best option and say in one
sentence why a competent practitioner would choose it. If you cannot, the question has
one real option and three fillers - see §0.3.

`01-01` q2 and `01-04` q4 are the two references. **Neither may be softened during item
generation.** The competing-defensible-actions structure *is* the assessed competence; a
version where the runner-up is simply wrong is a different, easier item.

#### When a recognition item earns its place, keep the label honest

Some questions have to be recognition. `01-06` q3 asks which of four statements the 2020
Guide actually makes, with the removed 2017 cancellation material as the distractors — it
is the direct inoculation against the defect §0.1 records, and a practitioner trained
before 2020 genuinely picks a wrong option. **It is also, plainly, not Analyze**, and task
1.6 is `4_analyze`.

> **Keep `bloom_level` agreeing with the task. Do not relabel a question down to describe
> its own difficulty.**

**Both available moves break something, and they are not symmetric.** A label that
overstates one question is wrong in a way a reader sees on the next line of the same file.
A `bloom_level` that disagrees with its task silently weakens the traceability claim for
that task, and the item generator reads that field against the task rather than against
the prose — so the damage is invisible where it is introduced and shows up somewhere
nobody is looking. **Take the visible error.**

**Measured 2026-09-09, across 1,445 checkpoint questions in the whole content corpus:**

| certifications | below their task's level |
|---|---|
| AIE-I, AIGRM-I, AIHR-I, SD-AI-I, SM-AI-I, **ISMS-IA** | 259 |
| **AIMS-F, AIMS-IA, AISM-I, ISMS-F, SM-AI-II** | **0** |

Five certifications are uniform and this is one of them — **all 36 of its checkpoint
questions sit at their task's declared level, and a below-task label here would be the
first.** But the precedent is not confined to laddered entry-level certs as first
assumed: **`ISMS-IA` is tier II, the same tier as this scheme, and 42 of its 152 sit
below.** So the practice exists at this tier and this credential has not used it. That is
a reason to be deliberate, not a reason it is unavailable.

> **The count depends on a choice the measurement has to make.** A lesson carrying several
> `task_codes` has several declared levels; scoring against the lowest gives 259 and
> against the highest gives 279. The **1,445 total and the five zeros are the same under
> both** — those are the numbers to quote. Anything cited as a single "below" figure is a
> method as much as a measurement.

### 3.3 Explanations teach

Every `explanation` says why the correct answer is correct **and why the most attractive
wrong answer fails**. Where an option rests on something the Guide does not say, **the
explanation says so plainly and quotes what the Guide does say** - that is the
highest-value sentence in the lesson and the one that inoculates against the whole class
of defect in §0.1.

### 3.4 One `multi_choice` per lesson at most

More than that and the checkpoint tests reading stamina.

---

## 4. VOICE

`LESSON_AUTHORING_SPEC` §8 holds - second person, active voice, specific over abstract.
Additionally:

**Write for someone who will be contradicted in a room.** The reader is going to tell a
delivery director that a forecast is not a promise, or a Product Owner that ordering is
theirs and sizing is not. **Give them the sentence that survives the pushback**, and give
them the Guide's own words for the load-bearing half.

**State the limit as clearly as the rule.** *"The Guide names one person with the
authority to cancel a Sprint and says nothing about what happens afterwards"* is more
useful than a paraphrase that sounds more complete than the Guide is. **On this
credential the silence is usually the teaching point** - do not fill it to sound
authoritative.

**Quote the Guide in a blockquote for anything load-bearing.** Paraphrase everything
else. Never reproduce more normative text than the point requires.

**Name the discomfort.** Every task on this cert carries an `abilities` line that names a
social cost - *"Contradicting a number that looks objective"*, *"Raising a competence
question without humiliating a person"*, *"Naming a displacement the Developers took part
in"*. **The lesson should make the reader feel that cost before it gives them the move.**
This is what separates a Level II lesson from a restatement.

**No invented organizations with recognisable names.** Sector and size only - *"a team of
six on a payments product"*, *"a logistics company"*. Individual names are drawn from
Latin American and Iberian usage where natural, since the credential ships in `es-419`
and `pt-BR`.

**No em-dashes in scenario text destined for widget JSON.** They survive markdown fine
and have corrupted large SQL pastes before. Hyphens inside JSON bodies.

---

## 5. TERMINOLOGY

The 2020 Guide changed vocabulary deliberately, and this credential is the one that has
to be exact about it. **Every "Not" column entry below appears somewhere in the ancestry
of this material.**

| Use | Not | Why |
|---|---|---|
| **a plan by and for the Developers** (for the Sprint Backlog) | a forecast | *Forecast* appears **at least twice** in the 2020 Guide - once about burn-downs and burn-ups, once about the Developers' confidence in Sprint Planning - and **never about the Sprint Backlog**. For the artifact it is 2011-2017 language. See §0.1 |
| **commitment** (for the Sprint Goal) | - | Guide text. "Commitment: Sprint Goal" is a heading, and *"the Sprint Goal is a commitment by the Developers"* is the sentence |
| **responsible for the sizing** | accountable for estimating | *"The Developers who will be doing the work are responsible for the sizing"* - and the next sentence permits the Product Owner to influence them |
| **sizing** | estimation, estimates, story points | The 2020 wording is *sizing*: *"The Developers who will be doing the work are responsible for the sizing."* Prefer the quotable wording change over an absence claim |
| **self-managing** | self-organizing | 2020 replaced the term. *"They are also self-managing, meaning they internally decide who does what, when, and how"* |
| **the Developers** | the development team, the dev team, the devs | 2020 removed "Development Team" |
| **accountabilities** | roles | The Guide has three accountabilities and no roles |
| **the Scrum Team** | the team, the squad | Where you mean the whole team including PO and SM, say so - most of this cert's tasks turn on which subset is meant |
| **ordering** | prioritizing | The Product Owner *orders*; the Guide does not use *prioritize* |
| **Definition of Done** | DoD on first use, "definition of done" | Capitalised, spelled out on first use per lesson. **Never "Done-done" or "partially Done"** - `01-03` correctly marks these as not Scrum concepts |
| **Product Backlog item** | story, ticket, PBI on first use | Spell out first, then PBI if needed |
| **Increment** | deliverable, release | Defined term |
| **is not Scrum** | is not allowed, is forbidden | §0.4. The Guide has no prohibition mechanism |

**Do not coin acronyms.** Spell things out.

**Scrum terms stay in English across all three languages**, by platform policy. This is
why `verify-cert`'s construct-grounding check skips this cert with *"Scrum cert: agile
vocabulary IS the construct"* - which means **nothing automated is watching this table.
It is enforced by reading.**

---

## 6. BEFORE A MODULE IS DONE

- [ ] **Every sentence claiming the Guide requires, permits or provides something was
      checked against the 2020 text this session** (§0.1). Not remembered - checked
- [ ] **No sentence attributes 2017 content to the Guide.** Cancellation, forecast,
      estimation and self-organization are the four known entry points
- [ ] Every inference presented as inference, in the sentence, not in a footnote
- [ ] No first `::concept` defines a Level I term (§0.2)
- [ ] **Every distractor has a named practitioner who would choose it** (§0.3)
- [ ] No correct answer, best path or widget correct-state recommends omitting a Scrum
      element (§0.4)
- [ ] No story points, velocity or numeric estimate used as scenario furniture (§0.5)
- [ ] **Every widget intro's promise is delivered by the widget, not by prose beneath
      it** (§0.6)
- [ ] **Every keyed-correct option and every explanation read against the Guide as a
      list, apart from its lesson** — 48 keys, not 9 lessons (§0.7)
- [ ] **Every check that reported zero was made to fire once first** (§0.8)
- [ ] **Every removed claim swept for by CLAIM and not by sentence, in two lenses** —
      a removal confirmed by re-reading is not confirmed (§0.8)
- [ ] One lesson per task; `task_codes` holds exactly one code
- [ ] `concept_slugs` holds exactly the three concepts mapped to that task - all three,
      none added
- [ ] Four checkpoint questions; every `bloom_level` matches its task's declared level;
      **no question below difficulty 3** (§3.1)
- [ ] Every widget and checkpoint body parses as JSON; every `correct` id exists among
      that question's options; every `next` resolves; terminal steps omit `next`
- [ ] `drag-match` is 1:1 with no `allowReuse`
- [ ] No Guide-attribution correction sits inside a `::deep-dive`
- [ ] Duration 12-13; 3-4 concepts; 2 callouts; at most 1 deep-dive; exactly 1 interactive
- [ ] `prerequisites` chains to the previous lesson; `module_slug` matches the folder
      name minus `NN-` and the database row
- [ ] No forward reference the later module cannot pay, in the terms the earlier lesson
      used
- [ ] Read aloud - does the module read as one argument, or as nine files?

**Then, and not before:** `load-lessons-direct.mjs` (`--dry` first, and the flag is
`--dry`, never `--dry-run`), `wire-lessons.mjs` (`DRY_RUN=1` first), and the coverage
query.

---

## 7. WHAT IS OWED, AND WHERE IT IS OWED

Recorded here because it is authoring debt, not spec debt, and the next author meets it
immediately.

### 7.1 Paid on 2026-09-09

**The `forecast` defect, across two certifications.** Tasks 1.4, 4.8 and 5.4 all called
the Sprint Backlog a forecast; 1.4 carried the word in its statement as well. On
`SD-AI-I`, task 2.3's statement read *"as a living forecast"* and **task 5.8 - whose
subject is translating legacy terminology to 2020's canonical terms - taught the
2011-2017 word as canonical inside its own translation list.** All corrected to *a plan
by and for the Developers*, and 5.8 now teaches the forecast-to-plan swap as a fourth
translation rather than committing it.

**Task 4.8 also claimed the Guide "never mentions velocity, burndowns or story points."**
Burn-downs are named. Corrected.

**Concept `sprint-backlog-as-forecast` renamed to `sprint-backlog-as-plan`**, with
`content/sm-ai-ii/renames.yml` written so the importer emits a rename rather than a
delete-and-insert - a concept delete cascades `task_concepts`, `lesson_concepts`,
`question_concepts` and `user_concept_mastery`. **`SD-AI-I`'s `commitment-as-forecast`
and `living-forecast` were deliberately NOT renamed** - 30 question links each, 42
references across twelve lesson files in three languages, and `living-forecast` is baked
into a `lesson_id`, a `lesson_group_id` and a filename. Their descriptions carry the
correction instead.

**Task 1.2 and its lesson.** 1.2 moved from *"Identify which accountability is displaced
when ordering and sizing responsibilities are crossed"* (`3_apply`) to a sizing-only
statement at `4_analyze`, and `01-02` was rewritten from *"Ordering and Sizing, and the
Line Between Them"* to *"The Number Came Back Smaller"* - the ordering half removed, the
*"five points"* example replaced with durations under §0.5's carve-out.

### 7.2 Still open

**The activity uses of *forecast* were left alone and are correct**: `1.7`'s *forecasting
failure*, `4.8`'s statement, `SM-AI-I` 4.9, `SPO-AI-I` 4.7 and 5.5. Forecasting progress
is a practice the Guide names. **Naming the artifact a forecast is the defect; do not
over-correct into the activity.**

**`SD-AI-I`'s lesson content still teaches the word in three languages.** The task
statements and concept descriptions were corrected; `02-03-sprint-backlog-living-forecast.md`
and its `_i18n/es-419` and `_i18n/pt-BR` copies were not, and the lesson's own filename
and `lesson_id` carry it. That is a content migration, not a text fix.

**Absence claims in this document are not proven.** See §0.1's note on the instrument:
every "the Guide does not say X" here was established by a tool that cannot demonstrate
exhaustiveness, and one such claim - *forecast* appearing once - was already wrong. The
presences are quoted and solid. Re-establish any absence a rule turns on before leaning
on it.

> **A task's wording is a JTA change, not a lesson change.** Recorded here because the
> lesson author meets it first and must not silently route around it: a lesson that
> quietly declines to repeat its own task's knowledge line leaves the task wrong and the
> disagreement invisible.

---

*End of STYLE-GUIDE-SM-AI-II v1.0. Update when a later module establishes a convention
this one does not cover, and when module 1's own debt in §7 is paid.*
