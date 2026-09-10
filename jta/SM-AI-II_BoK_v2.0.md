# SM-AI-II — Body of Knowledge v2.0

**Credential name:** Scrum Master II - AI
**Credential code:** `SM-AI-II`
**Family:** `agile-ai`, the Level II rung above `SM-AI-I`
**Tier:** **II** — four defensible options, one best
**Status on authoring:** `draft`
**Date:** 2026-09-10
**Supersedes:** nothing. `SM-AI-II_BoK_v1.1.md` was cited as signed 2026-09-02, was never
committed to any repository, and is recorded as unrecoverable in `jta/SM-AI-II_JTA_v1.4.md`
§9. **This document does not continue its lineage and does not reproduce its numbering.**

---

> ## PROVENANCE — read this before citing anything below
>
> **Reconstructed 2026-09-10 from surviving artefacts. It was not authored at Stage 1, and
> a Stage 1 body of knowledge is what `CERT-CREATION.md` asks for.** The scheme, the JTA
> and 44 lessons were all built before this file existed. **That is a real gap and it is
> the first thing an assessor should be told**, because a body of knowledge written after
> the tasks cannot have constrained them.
>
> **What it can do, and what this document claims to be:** the sources were held and used
> throughout — one of them as a committed file with a recorded hash — and the reasoning
> was written down in the places the work happened. This is that reasoning collected into
> the shape `jta/ISMS-IA_BoK_v1.md` establishes, with the section that had no surviving
> source written fresh and marked.
>
> **Section by section, where each came from:**
>
> | § | Reconstructed from |
> |---|---|
> | 1 | `SCHEME-SM-AI-II.md` §2 |
> | 2 | `SCHEME-SM-AI-II.md` §5.1 — the competence-class argument, which is the only form of the two-jobs argument available to a same-title credential |
> | 3 | `reference/README.md` and `reference/scrum-guide-2020.txt` (committed 2026-09-09, `a88f493` and `9503152`) |
> | 4 | `SCRUM_GUIDE_FACTS` in `scripts/lib/item-grounding.mjs`, plus 22 lesson-level directives read out of `content/sm-ai-ii/` on 2026-09-10 |
> | 5 | `SCHEME-SM-AI-II.md` §2 and §2.1 — already written, including the measured AI-distribution table |
> | 6 | `SCHEME-SM-AI-II.md` §5.1, §5.2, §5.3, and `SCRUM_L2_JUDGMENT` in `scripts/lib/item-grounding.mjs` |
> | **7** | **Nothing. Authored 2026-09-10.** The measurement in it was taken for this document and had not been taken before. |
> | 8 | Superseded — the JTA is published as `v1.4` and the scaffold is live |
> | 9 | `STYLE-GUIDE-SM-AI-II.md` §0.1 |
> | 10 | `SCHEME-SM-AI-II.md` §12 |
> | **11** | **New, dated today.** |
>
> **What is gone and is not reconstructed here**, per `jta/SM-AI-II_JTA_v1.4.md` §9: the
> 45th task and what it said, three of the four demotions, five rewrites, the external
> reviewer's actual returns with the accept/decline reasoning `CERT-CREATION.md` Stage 3
> requires, and the domain-weight rationale for D1 through D4. **None of that is in this
> document and none of it can be. A body of knowledge that silently filled those gaps
> would be a worse artefact than one that names them.**

---

## 1. THE DECISION IN ONE PARAGRAPH

`SM-AI-II` certifies competence to **act as a Scrum Master in the space the 2020 Scrum
Guide deliberately leaves open** — resolving tensions between the framework's own rules,
coaching a team that performs Scrum correctly and still fails, holding accountability
boundaries against the organization, restoring empiricism where inspection has become
ceremonial, and exercising judgment when models and agents are part of how the work gets
done. Its single normative source is the 2020 Scrum Guide, and its subject is that
document's **silences**. It is a Level II credential: the candidate is asked to **choose
among defensible readings**, not to recall and apply.

---

## 2. WHY THIS IS A SECOND CREDENTIAL, NOT A HARDER FIRST ONE

**This is the catalogue's first cognitive-only rung, and it cannot make the argument its
Level II siblings make.** `ISMS-IA` and `AIMS-IA` are Level II because an internal auditor
is a different job from an implementer, with a different primary standard governing it.
**The Scrum Master is the same role in both credentials.** The two-jobs table below
therefore has no "different standard" row to fill, and pretending otherwise would be the
first dishonesty in the document.

| | `SM-AI-I` | `SM-AI-II` |
|---|---|---|
| Primary source | 2020 Scrum Guide | **2020 Scrum Guide** — the same document |
| What the source supplies | **the subject** — what the framework defines | **the boundary** — what it declines to define |
| Question the credential answers | *What does Scrum determine?* | *What do you do where it determines nothing?* |
| Competence shape | know the framework and apply it | choose among defensible readings and say which is which |
| Job in an org | the same job | the same job |
| Where AI sits | woven through every module — the workplace the candidate has | **one domain (D5)** — see §5 |

**The position under ISO/IEC 17024: the standard requires two sets of competence criteria,
not two job titles.** Two schemes over one job title are legitimate where they certify
different **competence classes**, and illegitimate where they certify the same competence
and differ only in item difficulty. *Same title, different competence class* is permitted.
*Same competence, harder items* is a scaled score dressed as a credential.

**The distinction rests on the source document's account of itself**, not on this body's
preference. The 2020 Guide, under *Scrum Definition*:

> The Scrum framework is purposefully incomplete, only defining the parts required to
> implement Scrum theory.

`SM-AI-I` certifies that a holder knows what the Guide defines. `SM-AI-II` certifies that
they act competently in what it deliberately leaves open.

**The distinction is deliberately NOT drawn by citing what `SM-AI-I` examines.** A
sibling's task inventory moves — `SM-AI-I`'s own *"all tasks are within examination
scope"* sentence was false for two months before its correction on 2026-09-08 — and a
level distinction resting on a moving inventory drifts with it. **The Guide's silence does
not move.**

**§7 is where this argument becomes a measurement rather than a claim.** It is the only
section of this document that can falsify the paragraph above.

---

## 3. THE SOURCE STACK

**One layer. This section is three paragraphs because there is one normative source, and
padding it to six would be the exact defect this document exists to prevent.**

**Layer 1 — the normative source.** The **2020 Scrum Guide**, Schwaber and Sutherland,
November 2020. Approximately 4,050 words, thirteen pages. Held in this repository at
`reference/scrum-guide-2020.pdf` (md5 `641355a705caf4d1b6820768da684ed0`) and
`reference/scrum-guide-2020.txt` (md5 `c69676b0a490c2f341df8501737f940a`), committed
2026-09-09 under the Guide's own CC BY-SA 4.0 licence, with provenance, extraction method
and four verification checks in `reference/README.md`.

**There is no Layer 2, and declining to invent one is a scheme decision already on the
record.** `SCHEME-SM-AI-II.md` §2 states it: the scheme is *"bounded by the Scrum Guide's
silences, not by the coaching profession."* Lesson `03-04` states it inside the teaching:
its deep-dive is titled **"Two sentences, and everything else is practice."** A source
stack listing coaching, facilitation or organisational-change literature that no author
consulted would be a bibliography rather than a stack, and it would misrepresent where
every key in this credential actually comes from — which, per §7, is mostly this scheme's
own judgment.

**What is used and is NOT a source of authority.** The four coaching stances (teach,
mentor, coach, facilitate) appear in `SM-AI-I` and are named in this scheme's
`stance-selection` concept. **They are professional practice, and both credentials say so
in the lesson text.** `SM-AI-I` `05-02`:

> The Scrum Guide uses verbs like *coach, teach, mentor, facilitate* to describe what a
> Scrum Master does. The structured "four coaching stances" model below — and the detailed
> servant-leadership behavior list — are widely-used **professional practice**, not text
> from the 2020 Guide. The Guide grounds the *idea*; the practice gives it shape.

`SM-AI-II` tightens the same distinction one level: its `stance-selection` concept is
*"whether a dysfunction calls for a coaching stance at all, **or for a service the Guide
names** — and only then which."* **Level I teaches that the stances are practice. Level II
asks the prior question, because the services are the Guide's and the stances are not.**
That is §2's competence-class argument demonstrated on a single concept, and it is the
correct treatment of a non-source: name it, attribute it, do not promote it into the
stack.

**Provable absence is a property of this stack and not of the sibling stacks.** Because the
corpus is complete, local and 4,050 words, a negative claim costs exactly one command and
returns a positive result rather than an unfalsified hedge. `STYLE-GUIDE-SM-AI-II.md` §0.1
states the consequence: **a rule may turn on an absence, stated flatly, with the searched
term in the sentence.** Nothing in ISMS-IA's six-layer stack has that property.

---

## 4. THE ATTRIBUTION MAP

**This is the longest section in the document and that is structurally correct. With one
source, attribution is the entire risk surface.** ISMS-IA's map guards against attributing
a claim to the wrong standard among six. There is no wrong standard here. **Every defect
this credential can commit is the same defect: attributing to the Guide something the
Guide does not say** — and the scheme's own worst recorded failure, `01-06` teaching the
2017 cancellation procedure as 2020 content, is exactly that.

**This map is authoring and generation input, not commentary.** Anything it forbids is a
defect regardless of how true the claim is.

### 4.0 THE PAIRED-ERROR RULE — stated as a rule, because it is one

> **A prohibition that forbids only the permissive error teaches the restrictive one.**
> Where a claim can be got wrong in two directions, both directions ship together, or
> neither does.

It is stated here rather than left implicit because it was discovered as a property of one
entry and applies to all of them. `SCRUM_GUIDE_FACTS` derived entry **D3** carries it in
place:

> *"AI-generated work that meets the Definition of Done IS an Increment. This is the
> INVERSE of the entry above and must ship with it. A list that forbids only the permissive
> error teaches the restrictive one, and 'generated work cannot be Done' is equally false
> and harder to catch because it sounds cautious."*

**"Harder to catch because it sounds cautious" is the whole reason for the rule.** A
reviewer reading a bank for over-permissiveness will not flag an item that errs toward
strictness, so the restrictive error survives review that the permissive one does not.

**The rule already governs the lesson-level directives at §4.3.** Fifteen of the
twenty-two are written as an explicit pair — *what can be keyed* set against *what cannot*
— rather than as a prohibition alone. That is this rule applied per task, and it is why
§4.3 reads as a map rather than as a blacklist.

### 4.1 NEVER-ASSERT — 31 entries

**The deployed form is `SCRUM_GUIDE_FACTS` in `scripts/lib/item-grounding.mjs`, injected
into the draft and critique prompts for every Level II Scrum item.** The text below is
that constant, transcribed. **The code is the copy of record; this section is the copy an
assessor reads.** A change to either is a change to both.

Each is widely taught, and none is in the 2020 text. **None may appear in a key or an
explanation.** A distractor may be built on any of them — that is what makes them good
distractors.

| # | Claim that must never be asserted | What the 2020 Guide holds |
|---|---|---|
| **N1** | That anyone other than the Product Owner may cancel a Sprint | Only the Product Owner has that authority, and a Sprint is cancelled when its Sprint Goal becomes obsolete — not when the work is late, hard or unpopular |
| **N2** | That the Scrum Master may overrule the Product Owner's ordering of the Product Backlog | The Product Owner may have others do the ordering work but remains accountable, and those wanting a change persuade the Product Owner |
| **N3** | That the Scrum Team may weaken an organizational Definition of Done | Where the organization has one it is a MINIMUM the Scrum Team may only strengthen. **Permitted change runs in one direction** |
| **N4** | That the Scrum Master is accountable for the Increment, the Product Backlog or delivery | The Product Owner is accountable for the Product Backlog; the Scrum Master for the Scrum Team's effectiveness. **The Increment belongs to the entire Scrum Team — see N23.** *This entry said "the Developers are accountable for the Increment" until 2026-09-10, which is the claim migration 289 retired from five JTA sites the same day.* |
| **N5** | That a Sprint may be extended, paused, or its timebox varied once begun | It may not. A fixed length is what makes the Sprint a container that bounds risk to one Sprint |
| **N6** | That the Daily Scrum is a status report to the Scrum Master, a manager or the Product Owner | It is FOR the Developers, to inspect progress toward the Sprint Goal and adapt the Sprint Backlog |
| **N7** | That the Daily Scrum requires any particular three questions | The 2020 edition REMOVED them as a requirement. A team may use them; an item that treats them as required is **testing a superseded edition** |
| **N8** | That a forecast, an estimate or a velocity figure is a commitment | The Sprint Backlog is a FORECAST by the Developers. The Sprint Goal is the commitment. The distinction does not change because a number looks precise |
| **N9** | That Scrum prescribes story points, velocity, burndown charts, or refinement as an event | It prescribes none of them. Product Backlog refinement is an ongoing ACTIVITY, not one of the five events |
| **N10** | That Scrum defines ROLES | The 2020 edition defines ACCOUNTABILITIES. A role is a job title a person holds; an accountability is an outcome someone is answerable for |
| **N11** | That the Scrum Master assigns work to Developers, **or that nobody may** | The Guide states **no prohibition** on assignment; it states a positive provision, and gives it to the **Scrum Team**: *"Scrum Teams are cross-functional… They are also self-managing, meaning they internally decide who does what, when, and how."* *This entry stated the prohibition and narrowed the provision to the Developers until 2026-09-10 — both errors migration 285 retired from task 3.2 and `work-assignment-boundary`.* |
| **N12** | That a group of people may collectively be "the Product Owner" | The Product Owner is ONE PERSON. A committee may advise; it may not hold the accountability |
| **N13** | That the Daily Scrum is for anyone but the Developers | Others may attend only if they are actively working on Sprint Backlog items |
| **N14** | That a timebox is a fixed duration | Timeboxes are MAXIMA. An event that achieves its purpose early ends early |
| **N15** | That the Sprint Review is a release gate | Release may happen whenever an Increment meets the Definition of Done, including mid-Sprint |
| **N16** | That only one Increment may be created in a Sprint, or that release is reserved to Sprint end | Both are false, for the reason at N15. **N15 and N16 are a pair; neither ships alone** |
| **N17** | That the Product Goal and the Sprint Goal are the same thing, or interchangeable | The Product Goal is the Product Backlog's commitment and describes a future state of the product. The Sprint Goal is the Sprint Backlog's commitment and is the single objective for one Sprint |
| **N18** | That the Scrum Master writes the Sprint Goal | The whole Scrum Team crafts it during Sprint Planning |
| **N19** | That the Product Owner must estimate work or assign it | *"The Developers who will be doing the work are **responsible** for the sizing. The Product Owner **may influence** the Developers by helping them understand and select trade-offs."* Responsible, not accountable, and the permitted influence is half the sentence. `estimat` returns **0** in any form; the Guide's word is *sizing* |
| **N20** | That the Scrum Master is an administrative coordinator or secretary — scheduler of meetings, taker of notes, chaser of statuses | The Guide describes true leaders who serve the team and the organization |
| **N21** | That any scaling framework is part of Scrum | None is. **Do not name one** |
| **N22** | That the terms are anything other than the 2020 terms | SELF-MANAGING, not self-organizing. EVENTS, not ceremonies. ACCOUNTABILITIES, not roles. Prior-edition vocabulary in a stem tells the candidate they are reading an item written against a superseded text |

**N23–N31 were added on 2026-09-10, and their provenance is different from N1–N22's.**
The first twenty-two are the misconceptions the field holds. **These nine are the ones
this credential actually made** — every one reached the job-task analysis and was retired
by migration 285, 287, 288 or 289. The list predates all four.

> **A never-assert list assembled from general knowledge catches the errors everyone
> makes. It does not catch the errors a particular scheme makes**, and those are the ones
> its own item bank will reproduce, because they are already in the task text the
> generator is handed. **The audit that produced these nine also found two of N1–N22
> asserting what the migrations had just retired** — N4 and N11 — so the list was not
> merely incomplete, it was in two places wrong.

| # | Claim that must never be asserted | What the 2020 Guide holds, and where this scheme got it wrong |
|---|---|---|
| **N23** | That **the Developers** are accountable for the Increment | *"The entire Scrum Team is accountable for creating a valuable, useful Increment every Sprint."* The Developers are *"committed to creating any aspect of a usable Increment each Sprint"*, and their own always-accountable list is four items with the Increment **not among them**. **Migration 289, five sites** |
| **N24** | That the Developers therefore bear **no** accountability for what is in the Increment | **The inverse of N23, and it ships with it** (§4.0). They are *always* accountable for *"instilling quality by adhering to a Definition of Done"*. *"The Scrum Team is accountable"* is not a way of saying no one in particular is. **This is the error an item about generated work reaches for first, because it sounds collegial** |
| **N25** | That the Sprint bounds risk to one Sprint, or that having Sprints limits risk | The sentence is about **shorter** Sprints: *"Shorter Sprints can be employed to generate more learning cycles and limit risk of cost and effort to a smaller time frame."* A comparative about length, not a property of the Sprint. **Corrected twice — task 2.4 (285), then task 4.6 and `risk-containment` (288)** |
| **N26** | That the Product Owner orders the Product Backlog *to best achieve goals and missions*, to maximize value, or by any stated criterion | **2017 text.** `best achieve goals` → **0**, `goals and missions` → **0**. The 2020 edition reduces it to one bullet — *"Ordering Product Backlog items;"* — with **no criterion attached**. **Task 4.4 and `product-backlog-ordering` (288)** |
| **N27** | That teams on one product are **required** to share a Product Owner, Product Backlog or Product Goal | Two *shoulds*, reachable only by reorganizing a too-large team. The one **must** is unscoped and different: *"If there are multiple Scrum Teams working together on a product, they must mutually define and comply with the same Definition of Done."* **Task 3.7 (285), task 3.8 (287)** |
| **N28** | That the Sprint Review **is not** a presentation | *"The Sprint Review is a working session and the Scrum Team **should avoid limiting it to** a presentation."* A should-avoid-**limiting**, not an is-not. **Task 4.1 (288), which hardened a Level I floor that was already correct** |
| **N29** | That low transparency leads to bad decisions | Subject and modal are both load-bearing: *"**Artifacts that have** low transparency **can** lead to decisions that diminish value **and increase risk**."* **Task 4.2 and `transparency` (288)** |
| **N30** | That the Scrum Master helps the organization *adopt an empirical approach* | *"Helping employees and stakeholders understand and enact an empirical approach for complex work."* Understand **and** enact, employees **and** stakeholders, for complex work. **Four sites drifted the same way (285)** — which is how a paraphrase becomes the remembered text |
| **N31** | That the Guide calls only Scrum a container, or only the Sprint one | It uses the word for **both**: *"The Sprint is a container for all other events"* and *"Scrum exists only in its entirety and functions well as a container for other techniques, methodologies, and practices."* **A finding that one of these did not exist was acted on, and committed to a message, before it was found false** — `STYLE-GUIDE-SM-AI-II.md` §0.1 |

### 4.2 TRUE BUT DERIVED — 4 entries

**These are true, and they are inferences rather than quotations. An item may rely on
them. An item must never attribute them to the Guide as something it states.**

This is the device the template writes as `nobody` in a source column. **It is better in
this form**, because the header does the work the column would: the section name is the
attribution.

| # | Inference | Why it is an inference, and how to write it |
|---|---|---|
| **D1** | A tool, model or agent holds no Scrum accountability and is not a member of the Scrum Team | The Guide says accountabilities are held by the Product Owner, the Scrum Master and the Developers, and that the Scrum Team is people. **It does not discuss tools.** Write it that way — never as *"the Scrum Guide states that a tool cannot hold an accountability"* |
| **D2** | The Definition of Done may not be relaxed for AI-generated work | Follows from the floor-and-additions rule, which is about the standard and says nothing about who or what produced the work |
| **D3** | AI-generated work that meets the Definition of Done **is** an Increment | **The inverse of D2 and must ship with it** — see §4.0. *"Generated work cannot be Done"* is equally false and harder to catch because it sounds cautious |
| **D4** | A model's output does not constitute inspection | Inspection is an act the Scrum Team performs against a transparent artifact. A generated summary is an artifact that **may be inspected**, not the inspection itself. **Items in this domain will invent the opposite if it is not forbidden** |

### 4.3 TASK-SCOPED NEVER-KEY DIRECTIVES — 22 lessons

**The lessons wrote their own attribution-map rows, and they are the half a global list
could not have anticipated.** N1–N22 and D1–D4 guard claims about the framework in
general. These guard the specific construction each task rests on — the taxonomy, the
threshold, the test — where the construction is this scheme's and an item writer would
otherwise key it as the Guide's.

**Counted 2026-09-10 across all 44 lesson files: 22 carry an item-bank directive, and 15
of those state it as an explicit pair** (*what can be keyed* against *what cannot*), which
is §4.0 applied per task.

> **A correction to a number this document was nearly written on.** The pre-authoring
> recon reported **8** such rows. That came from a grep for `no item may`, which is one of
> at least four phrasings the convention actually uses — the others being *must never be
> keyed*, *What can be keyed*, and *what cannot is*. **The true count is 22, and the
> undercount was a wrong pattern, not a wrong corpus** — precisely the failure mode
> `STYLE-GUIDE-SM-AI-II.md` §0.1 names as the successor to the incomplete-corpus era. It
> is recorded here rather than silently fixed because a map whose own extraction was wrong
> once should say so.

| Task | Lesson | What may not be keyed | What may |
|---|---|---|---|
| **1.3** | `01-03` | A Scrum Team lowering a Definition of Done **it created itself** as a Guide violation. The Guide states no such rule; the argument against it is an empiricism argument this credential makes | The organizational floor, which is a provision |
| **2.4** | `02-04` | The intervention threshold as a Guide provision. The Guide gives no threshold, no test and no cadence | The Sprint Goal as the commitment, and that the Increment must be usable — the two things the reading is built from |
| **2.8** | `02-08` | That the Guide supplies the discrimination between the three causes of reduced delivery. The taxonomy is this credential's, built from three separate provisions | Each of the three provisions separately |
| **3.4** | `03-04` | Cost, urgency and standing. They **appear nowhere in the Guide, individually or together** | The single word *causing* |
| **3.6** | `03-06` | Wait, escalate or enable-a-provisional-decision as Guide provisions — **and an interim Product Owner arrangement as one either, because there is no such thing in the text** | That the Product Owner's accountability does not lapse, and that the Developers remain accountable for a plan |
| **3.8** | `03-08` | Equal engagement as a Guide expectation, or a shared Product Owner's uneven attention as a defect in itself | **The consequence**: work decided on less information, which the Guide does address |
| **4.1** | `04-01` | An unchanged Product Backlog as a violation. Nothing states how many Reviews without adaptation is too many | The event's purpose, the recommendation against limiting it, and the permitted adjustment |
| **4.2** | `04-02` | **A metric, a target or a reporting practice as required or prohibited by the Guide** | The transparency standard — visible to those performing and those receiving — and its consequence, which is decisions |
| **4.4** | `04-04` | That a value-tracking order is required; any rule about how ordering is done | The Product Owner's accountability and the artifact's description as emergent |
| **4.5** | `04-05` | Any account of a Definition of Done being insufficient, or what a good one contains | That *usable* is required separately, and that an organizational standard is a minimum |
| **4.7** | `04-07` | Any rule about restoring an absent commitment | Who owns each commitment, and where each is created or inspected |
| **4.8** | `04-08` | Any rule about reporting a number | That the Sprint Goal is the commitment, and that forecasting practices do not replace empiricism |
| **4.9** | `04-09` | Any requirement to capture or act on stakeholder input — **the Guide does not state that it must reach the Product Backlog at all** | That attendees collaborate on what to do next, and that openness is expected of stakeholders too |
| **5.1** | `05-01` | Any of the four candidate quality measures as a requirement | That the Definition of Done is answerable to the product, that an organizational standard is a minimum, and **that the Guide provides no different standard for any part of an Increment** (the D2/D3 pair, keyed) |
| **5.2** | `05-02` | Any rule about how much a Sprint should produce | The timebox, the sum, and that inspection without transparency is misleading |
| **5.3** | `05-03` | Any rule about accepting generated work | Who the Increment belongs to, the Developers' four accountabilities, and that a tool is something a Scrum Team inspects |
| **5.4** | `05-04` | Any rule about producing or circulating a number — **the Guide says nothing about precision, decimal places or presentation** | That the Sprint Backlog is the Developers' plan, that the Sprint Goal is the commitment with flexibility about the work, and that the Developers are responsible for sizing |
| **5.5** | `05-05` | Any rule about how a Retrospective gathers its material. **The claim that ownership follows from participation is entirely this credential's** | That the Scrum Team does the inspecting, that origins of assumptions are explored, and that tools are among what is inspected |
| **5.6** | `05-06` | **Any expectation that a team work without its tools** | That the Developers are accountable for instilling quality by adhering to the Definition of Done, and that cross-functionality is about members having the skills to create value each Sprint |
| **5.7** | `05-07` | Any rule about what a team should measure. **The claim that the countable side wins invisible trade-offs is this credential's reading** | That the Increment must be usable, that Increments must work together, and **that no measure of output appears in the Guide** |
| **5.8** | `05-08` | Any rule about how much a team should produce | The pillar order and the two dependency sentences |
| **5.9** | `05-09` | Any rule about what a Developer must be able to explain | The four Developer accountabilities, the Scrum Master's coaching service, and that the Increment belongs to the entire Scrum Team |

**Where the convention is absent, and it is a clean seam.** Ten lessons carry no explicit
provenance marker: `01-01`, `01-02`, `01-04`, `01-05`, `01-06`, `01-07`, `01-08`, `01-09`,
`02-01`, `02-03`. **Eight of module 1's nine, plus two early module-2 lessons.** The
convention was invented during module 2 and module 1 was never retrofitted. `02-01` does
attribute its provenance, in Level I's words — *"Those four are professional practice, not
text from the 2020 Guide"* — it simply predates the phrasing. **Retrofitting module 1 is
named in §11 as open.**

### 4.4 THE ABSENCES THIS CREDENTIAL RESTS ON

**Confirmed against `reference/scrum-guide-2020.txt` on 2026-09-10.** Each is stated with
the searched term so the next reader re-runs rather than trusts.

| Term searched | Result | Where it is load-bearing |
|---|---|---|
| `estimat` (any form) | **0** — the Guide's word is *sizing* | `STYLE-GUIDE` §0.5, task 5.4, lesson `05-04` |
| `velocity` | **0** | N8, N9, task 4.8 |
| `story point` | **0** | N9, task 4.8 |
| `metric` | **0** | task 4.2, lesson `04-02` |
| `assign` (any form) | **0** | N11, N19, task 3.2 |
| `escalat` (any form) | **0** | task 3.4, lesson `03-04` |
| `volume`, `throughput`, `output`, `count`, `amount` | **0 each** | tasks 5.2, 5.7 |
| `AI`, `model`, `agent`, `automat`, `algorithm` | **0 each** | **the whole of D5** |
| `traumatic`, `re-estimat` | **0** | the 2017 cancellation material — see §9 row 2 |

**And the bounded presences, which are claims of the same kind and cost the same command:**
`forecast` **2** (neither describing the Sprint Backlog), `container` **2** (Scrum *and*
the Sprint), `impediment` **2** (both plural, neither defined), `authority` **1** (given to
the Product Owner, to cancel a Sprint), `burn-down` present (named as one of several
practices that forecast progress).

> **`grep -c` does not produce these numbers.** The flatten recipe joins the Guide into a
> single line, which turns `grep -c` into a presence flag. Count with
> `grep -o … | wc -l`, or `grep -o … | sort | uniq -c` for the forms. **Every zero above
> stands under either reading; every non-zero was produced with `uniq -c`.** See §9 row 5.

---

## 5. SCOPE BOUNDARY

**In scope.** Judgment in the practice of the Scrum Master accountability: choosing between
defensible interventions, distinguishing what the framework determines from what it leaves
to the practitioner, and holding that distinction under organizational pressure. Resolving
tensions between the Guide's own provisions. Coaching a team that performs Scrum correctly
and still fails. Holding accountability boundaries against the organization without
absorbing them. Restoring empiricism where inspection has become ceremonial. Scrum Master
judgment where models and agents are inside the work system.

**Out of scope, and named in the scheme.**

- **AI literacy as a subject.** What a model is, why it hallucinates, how to prompt. That
  is `AIE-I`. **This scheme assumes it.**
- **AI governance, risk and compliance.** Risk classification, impact assessment,
  regulatory instruments. That is `AIGRM-I`.
- **Product management.** Value decisions, backlog craft, product strategy. That is
  `SPO-AI-I`. This scheme tests **serving** the Product Owner, never doing their job.
- **Engineering craft.** Testing, integration, code review, technical decision-making.
  That is `SD-AI-I`.
- **Any scaling framework.** None is part of Scrum, and none is named or assessed (N21).
- **Coaching or facilitation certification in general.** **The scheme is bounded by the
  Scrum Guide's silences, not by the coaching profession** — which is also why §3 has one
  layer.

### 5.1 Why AI sits in one domain

**Reproduced from `SCHEME-SM-AI-II.md` §2.1, which is the copy of record.**

`SM-AI-I` certifies what the Guide defines, and AI is **the workplace the candidate has** —
so its AI lessons are filed into `scrum-roles`, `scrum-artifacts` and
`foundations-of-agile` rather than kept apart. Integration is correct there because the
subject is the framework, and the framework is met in an AI workplace.

**SM-AI-II certifies judgment where the Guide is silent. If every silence also carried an
AI condition, each D1-D4 item would measure two things** — the judgment under test, and
whether the candidate noticed a model. That is construct-irrelevant variance across 35
tasks whose best answer does not change, and it would make D5 a recap of the other four
domains rather than a domain.

**The measurement an auditor will take, stated first.** Counted 2026-09-10 across all 44
task statements and all 132 K/S/A lines:

| | AI vocabulary in statements | in any K/S/A line |
|---|---|---|
| D1-D4 (35 tasks) | **0** | **0** |
| D5 (9 tasks) | 5 | **0** |

Five of the 131 concepts carry it, all in D5. **Across the 35 authored lessons of D1-D4,
AI appears in one sentence**, and that sentence exists to record something the Guide does
not license.

**One deliberate exception, and it is a competence rather than a leak.** A D1-D4 **lesson**
may present a case in which a model is present and **the correct response is identical to
the non-AI case, with the feedback saying exactly that** — recognising that a model does
not change the answer is itself learned, and it does not follow from knowing the Guide,
because the Guide has never heard of the question. **Items stay clean**: every D1-D4 item
must be answerable without noticing a model. The rule and its separation are in
`STYLE-GUIDE-SM-AI-II.md` §0.7.

---

## 6. LEVEL II — WHAT MAKES IT ONE

Not difficulty. Cognitive demand, the item contract that follows from it, and the two
screens every task was admitted through.

### 6.1 The item contract

**Four options, all defensible on the facts given, one best. Scoring dichotomous.** The gap
between best and second-best must be wide enough that a competent practitioner lands on it
reliably, and **stateable in one sentence**. Both halves have to hold: an item whose
second-best is actually *wrong* is a Level I item that got through; an item whose reason
takes a paragraph is a coin flip.

**The contract applies where the candidate weighs**, which is `tier >= 2` **and**
`bloom_level = 4_analyze`. **28 of the 44 tasks meet both. The 16 apply-level tasks carry
the Level I contract — one defensibly correct option — and that is deliberate**, recorded
in `SCHEME-SM-AI-II.md` §5.3. A four-defensible contract over a task with one right answer
is dishonest in the other direction.

### 6.2 The two screens

Every task was admitted through two rejection rules. **They are the scheme's
level-distinction criterion, not an editorial preference.**

**SCREEN 1 — DISJOINTNESS.** A task is admissible only if (a) no `SM-AI-I` task covers it,
**and (b) the Guide constrains the answer but does not determine it.**

**SCREEN 2 — FRAMEWORK CONFORMANCE.** A best answer that violates a Guide rule is
**rejected, not reworded.** Judgment operates inside the framework; a scheme rewarding
work-arounds would be certifying something else.

**Together: constrains but does not determine.** Where the Guide *determines* the answer,
the task belongs to Level I. Where the Guide constrains *nothing*, the task is not about
Scrum and the scheme has no basis to mark one answer better. **The credential lives in the
band between.**

> **Screen 1(b) is the sentence §7 turns into a number.** It was applied qualitatively,
> task by task, during authoring. It had never been measured.

### 6.3 The minimally competent candidate

**Stage 1 of standard setting is complete and this is it.** The full definition is
`SCHEME-SM-AI-II.md` §7.1; the deployed form is `SCRUM_L2_JUDGMENT` in
`scripts/lib/item-grounding.mjs`, injected into both the draft and critique prompts.
**Same text, two uses — the published standard and the instrument that produces items are
one statement**, which is what stops them drifting apart.

**The candidate is experienced, not shaky.** Two to five years, several teams, at least one
organization that did Scrum badly. They would pass a Level I examination comfortably.
**What makes them borderline is narrower**: where the Guide is silent, they reach for what
their last three organizations did, and **they cannot reliably tell the difference between
"the Guide does not say" and "the Guide says do it this way."**

**Their eight failure modes are the source of every second-best option**: they
over-intervene where developing capacity was available; fix the visible symptom; import a
practice and present it as the framework; absorb accountabilities to keep things moving;
escalate at one volume; treat an artifact as evidence of the activity that produced it;
protect the relationship over the transparency; and in an AI-augmented team, measure what
moved rather than what held.

**Six contrasting moves are the source of every best option**, each stateable in one
sentence.

### 6.4 Exam scope

All 44 tasks are within examination scope. No task is above the MCQ ceiling: the profile is
**16 Apply / 28 Analyze, no Remember and no Understand**, computed from
`v_cognitive_profile` rather than targeted. **No Bloom-5 task exists, so the
`is_selected_response_assessable` question ISMS-IA's §6 raises does not arise here.**

---

## 7. THE FALSIFICATION TEST

**This is the one section of this document with no surviving source. It was authored on
2026-09-10, and the measurement in it was taken for this document and had not been taken
before.** Everything in it is new, and it is marked as new rather than presented as
recovered.

### 7.1 Why the Bloom profile cannot be the test

`AIMS-F` set a cognitive threshold before scaffold and passed it; `ISMS-IA` set
*"analyze >= 55%, remember zero, understand below 25%"*. **SM-AI-II has the equivalent and
it cleared** — `SCHEME-SM-AI-II.md` §5.3 records a kill switch of *analyze >= 55% with zero
Remember*, and the computed profile is **63.72% analyze, 36.28% apply, zero Remember and
zero Understand.**

**And it does not test the thing this credential's existence rests on.**

> **The Level II claim is that this credential certifies judgment where `SM-AI-I` certifies
> the framework. A Bloom profile cannot falsify that. It shows the tasks are demanding; it
> does not show they are a different job.**

A Level I credential can hold Analyze tasks — `SM-AI-I` declares Analyze on 11.49% of its
weight, and nine tier-1 certs hold 37 `4_analyze` tasks between them. **A scheme could
therefore pass a cognitive kill switch while being `SM-AI-I` with longer stems**, which is
the exact failure §2 says would make the second credential meaningless. The cognitive test
was necessary and it was never sufficient.

### 7.2 The test that can falsify it

**Screen 1(b) — "the Guide constrains the answer but does not determine it" — is the
scheme's own admission rule. Counting it is the test.**

> **If the Guide's own text determines the keys, the credential is a lookup examination
> with harder scenery. If it does not, the credential is measuring something the source
> document declines to settle — which is what it claims to measure.**

### 7.3 The classification rule

Applied 2026-09-10 to all 44 task statements, `skills` lines and `knowledge` lines, read
against `reference/scrum-guide-2020.txt`.

- **(A) GUIDE-DETERMINED — the Guide supplies the discriminating criterion.** The judgment
  is in applying it to facts, not in choosing the criterion.
- **(B) GUIDE-BOUNDED, SCHEME-RESOLVED — the Guide supplies the boundary, the vocabulary or
  the categories, and the `skills` line names a discrimination the Guide does not make.**
- **(C) SCHEME JUDGMENT ONLY — the criterion or taxonomy has no Guide anchor at all.**

> **(A) is not a Screen 1(b) failure, and reading it as one would indict thirteen of this
> scheme's own tasks wrongly.** *Determined* in Screen 1(b) means the Guide hands you the
> answer. **(A) means it hands you the test.** Task 1.1 is the clearest case: the Guide
> supplies *"No changes are made that would endanger the Sprint Goal"*, and whether a
> specific proposed change endangers a specific Sprint Goal is exactly the contestable
> judgment four defensible options are written around. **The Guide determines the criterion
> and the scenario determines the answer.**

### 7.4 The measurement

```
              3_apply   4_analyze   total
  (A)               7           6      13
  (B)               5          18      23
  (C)               4           4       8
              -------------------------------
                   16          28      44
```

> ## **31 of 44 tasks — 70% — have a key the 2020 Scrum Guide does not determine.**
>
> **13 Guide-determined. 23 Guide-bounded and scheme-resolved. 8 with no Guide anchor at
> all.**

**And the cross-tab is the second finding.** Guide-determined tasks are **44% of Apply
tasks and 21% of Analyze tasks** — correlated, and nowhere near identical. **The source
classification measures something the Bloom profile does not**, which is the argument for
having it. The eight (C) tasks split evenly across both levels: a task can be cognitively
easy and wholly unsourced, or cognitively hard and squarely anchored.

### 7.5 The eight with no Guide anchor, named

**Every one already says so in its own lesson. Not one had to be discovered.**

| Task | The reading with no source but this scheme's judgment |
|---|---|
| **2.1** | *What a stance can reach* against *what the dysfunction is costing*. The stances are professional practice (§3); proportionality is failure mode 1 |
| **2.6** | Test privately / name the pattern to the Developers / change how planning is run |
| **2.8** | Impediment vs capability gap vs self-management failure. **The knowledge line is literally *"The three causes and the distinct remedy each requires"* — it cites nothing** |
| **3.4** | Cost, urgency and standing — **absent from the Guide individually and together** |
| **3.8** | The knowledge line states the Guide *"says nothing anywhere about how that attention is divided"*, and the task resolves it anyway |
| **4.4** | The knowledge line states the Guide *"attaches no criterion to the ordering and does not define value"*, and the task is *ordering no longer reflects value* |
| **5.5** | *"Ownership follows from participation."* The first half of that knowledge line is Guide text; this half is not |
| **5.7** | *"Volume is not a Scrum measure"* is a provable absence. **That the countable side wins invisible trade-offs is not** |

### 7.6 The soft cases, named so the next reader can disagree specifically

**The A/B line I drew is: *does the Guide tell you which of its own categories this is?***

- **1.4** (Sprint Goal met, scope short) and **1.7** (Definition of Done failure or
  forecasting failure) are **(B)** under that rule, because the Guide supplies both
  categories and no discriminator. **A stricter reader puts both in (A).**
- **3.5** is **(B)**: the one-person provision decides that a committee is wrong, but
  *which decisions have diffused* is the task and is not in the Guide. A stricter reader
  puts it in **(A)**.
- **4.6** is **(B)**: the Guide says inspect *frequently and diligently* and names shorter
  Sprints as the remedy, but gives no interval. A stricter reader puts it in **(C)**.

**Under the stricter reading of 1.4 and 1.7: A = 15, B = 21, C = 8.** The plausible band
across all four soft cases is **A 13-16, B 20-23, C 8-9**.

> **(C) does not move under any reading, and the majority verdict does not either.** The
> stricter reading still leaves **29 of 44 — 66% — with a key the Guide does not
> determine.**

### 7.7 The standing invariant

> ### **Guide-determined tasks must remain a minority of the examination.**
> ### **If they ever exceed half, the scheme has drifted into Level I with longer stems.**

**Measured 2026-09-10: 13 of 44, or 29.5%. Under the strictest reading, 16 of 44, or
36.4%. The bar is 50%.**

**The margin is the point.** A kill switch that clears by a point is a number chosen to
clear; this one has roughly fourteen tasks of headroom in either direction, and it would
take a deliberate change of subject to trip it.

**What to do when it trips.** Not to reword the tasks. **A task whose key the Guide
determines belongs to `SM-AI-I`** — that is Screen 1(a)'s side of the same rule — and the
remedy is to move it or cut it, exactly as v1.1 did with two of the original 45.

**How to re-run it.** Read all 44 `tasks.knowledge`, `tasks.statement` and `tasks.skills`
from the database, classify each against `reference/scrum-guide-2020.txt` by §7.3's rule,
and publish the per-task assignment so a reader disagrees with a task rather than with the
method. **It is a reading, not a query.** A phrase-match against the Guide is not a
substitute: measured on the same 44 knowledge lines, a >=7-word verbatim match finds 21,
and **three of the thirteen it misses are demonstrably in the Guide as paraphrase**
(1.6 *"has the authority to cancel"*, 3.4 *"Causing the removal of impediments"*, 4.3
*"Each artifact contains a commitment"*). **A mechanical trace gets roughly half and
reports the other half as absent.**

### 7.8 What this test does not establish

**It does not validate the scheme's judgment. It establishes that the scheme is exercising
judgment rather than lookup**, which is a claim about *kind*, not about *quality*.

**Whether the eight unsourced readings are the right readings is not decided by anything in
this document, and no measurement can decide it.** That is what the Angoff panel is for
(§11), and it is why the panel must be independent of the person who wrote them. **A
scheme that supplies 70% of its own keys needs external judgment more than one that reads
them off a standard, not less** — and stating that plainly is more defensible than a
source stack padded to look like the alternative.

---

## 8. SHAPE — SUPERSEDED

**This section is retained as a heading because the template has one, and is empty because
it is Stage 2 input and Stage 2 is complete.** The JTA is published as `v1.4`, the scaffold
is live, and the delivered shape is:

| | |
|---|---|
| Domains | 5 |
| Tasks | 44, all in examination scope |
| Concepts | 131; task-concept links 132 (`quality-adherence` is shared by 5.6 and 5.9) |
| Exam | **50 items / 150 minutes** |
| Pass mark | **75%**, adopted by citation from both Level II siblings |
| Prerequisite | none enforced; Level I competence assumed and stated |

**Nothing in a proposed-shape section may be read as current.** `SCHEME-SM-AI-II.md` §6 and
§12 are the live record, including the fact that **150 minutes is a tier floor and not a
measurement**.

---

## 9. VOLATILITY REGISTER

### 9.1 The source

| Source | State at 2026-09-10 | Trigger |
|---|---|---|
| 2020 Scrum Guide | **Current edition, November 2020.** Held locally with recorded hashes | A new edition. **It would move this credential's entire subject**, because the subject is this edition's silences |
| 2017 Scrum Guide | **Superseded.** Not held, not cited, and N7 / N22 exist to keep its vocabulary out | none — but see 9.2 row 2, where it reached a lesson anyway |
| `SCRUM_GUIDE_FACTS` | **35 entries live in code** (31 + 4 `[derived]`), not in a document. §4.1 and §4.2 are the readable copy | Any change to either copy is a change to both. **It went 26 → 35 on 2026-09-10 and this row moved with it, which is the rule working** |
| `SCRUM_L2_JUDGMENT` | **Live in code and in `SCHEME` §7.1.** One artefact, two homes | Same rule |
| `reference/scrum-guide-2020.txt` | md5 `c69676b0a490c2f341df8501737f940a` | **A re-extraction changes the hash and may change line breaking.** See 9.2 row 4 |

### 9.2 The instrument — the column ISMS-IA's register has no slot for

**ISMS-IA's sources are PDFs and its instrument is a reader, so its register has one axis.**
This credential's absences are load-bearing (§4.4), and **an absence is a property of the
search as much as of the document**. Six recorded failures, each with what it cost. They
are in `STYLE-GUIDE-SM-AI-II.md` §0.1; they are here because a body of knowledge that lists
its sources and not the instrument that read them is describing half its risk.

| # | Failure | What it cost |
|---|---|---|
| **1** | A summarizer returned the `forecast` count as **1**. It is **2** | The wrong number reached `STYLE-GUIDE` twice, a commit message, and two sections of `SCHEME-SM-AI-II.md` |
| **2** | A summarizer sweep left the cancellation absences **unproven**, so 2017 material was not excluded | **`01-06`'s deep-dive taught the 2017 cancellation procedure as Guide content** — *consume resources*, *often traumatic*, *very uncommon*, incomplete work *re-estimated*. **Two of that lesson's four checkpoint questions tested deleted material.** The defect had reached assessment |
| **3** | A section reproduced **perfectly** and generalised beyond its scope: *"the Guide never calls the Sprint a container"* | **False** — *"The Sprint is a container for all other events"*, one heading up. A JTA knowledge line was changed on the false finding **in the database and in `cert.yml`**, and commit `a8d57de` states the wrong sentence permanently. The replacement was better than the original and stands |
| **4** | A grep stem encoding the author's phrasing rather than the Guide's | `grep -F` on a real Guide sentence returned **0** — the extraction breaks bulleted lists at PDF line boundaries. **A false absence produced by the instrument that made absences provable, within an hour of it landing** |
| **5** | `grep -c` against the flattened corpus is a **presence flag, not a count** | `clear` 1 -> 3, `time` 1 -> 10, `divid` 1 -> 3. **Every zero stood; every non-zero was unverified.** One fed an absence claim that **held by luck** |
| **6** | Quotations verified at batch validation rather than when written | Three wrong attributions reached finished lessons — `01-02` *responsible* read as *accountable*, `01-04` *forecast* for the Sprint Backlog, `01-03` an inference stated as a rule. **Cheap to catch, expensive to catch late**, because decisions had been built on top |

> **Rows 1-3 are volatility in the source, or in reading it. Rows 4-6 are volatility in the
> instrument**, and they are the more dangerous half, because the instrument is the layer
> everything else is verified against. **A wrong pattern reports a clean result.**
>
> **This document produced a seventh instance while being written.** The pre-authoring
> recon counted the task-scoped never-key rows at **8**; the true count is **22** (§4.3).
> One grep, four phrasings, and the narrowest of them was mistaken for the convention.
>
> **The mitigation is two-step and neither half is optional: search the shortest
> distinctive stem, then read the whole sentence around every hit.** Where a claim turns on
> a number, print what was counted.

---

## 10. WHAT THIS UNBLOCKS

**Nothing downstream depends on this document, and saying so is more useful than inventing
a dependency.** `SM-AI-II` is the top of its line. There is no `SM-AI-III`, and the ladder
rule that shelved `AIGRM-II` — **two credentials need two jobs** — would shelve one, since
§2 already spends the only competence-class argument available over this job title.

**What it unblocks internally:**

- **The Angoff panel (§11).** §6.3's definition is the artefact a panel is briefed with,
  and §7 is the argument for why the panel must be external to the author.
- **A defensible answer to the first question an assessor asks** — *what is this credential
  built on?* — which now has a document rather than a set of files.
- **A re-runnable level-distinction test.** §7.7 is an invariant a future revision can
  fail, which is what `SCHEME` §5.1's argument has lacked.

**What it does not unblock: item generation.** That is gated on
`scripts/lib/item-profile.mjs` tier routing and on the item floors, both in
`SCHEME-SM-AI-II.md` §12.

---

## 11. SIGN-OFF

- [ ] Juan signs `SM-AI-II_BoK_v2.0.md`
- [ ] `SCHEME-SM-AI-II.md` §4, §12 and the closing line cite v2.0 — **done 2026-09-10, in
      the same commit as this file**

**Open at sign-off:**

- **This document was reconstructed, not authored at Stage 1.** It is recorded in
  `SCHEME-SM-AI-II.md` §12 as an open item in its own right, and it does not become closed
  by being signed.
- **§7 is retrospective.** The invariant is prospective from today; the measurement it
  rests on was taken after the tasks were written. **A future revision re-runs it before
  the tasks change, not after.**
- **Module 1's ten unmarked lessons** (§4.3). The convention exists; eight of module 1's
  nine predate it. Retrofitting is a content pass, not a correction — nothing in them is
  known to be wrong.
- **`SCRUM_GUIDE_FACTS` lives in code and this document is its readable copy.** There is no
  mechanism keeping the two in step. Neither is there one for `SCRUM_L2_JUDGMENT`, whose
  other home is `SCHEME` §7.1.
- **The eight unsourced readings (§7.5) have had no external review.** Two independent
  review passes covered the JTA; a convened panel has not.
- **Standard setting stage 2** is blocked by recruiting a panel, not by candidate volume.
  §6.3 is the brief; §7.8 is the reason it cannot be internal.
- **Migration tip:** check `supabase/migrations/` before claiming a number. Do not trust
  the line in `CLAUDE.md`, which has been stale twice.

*End of SM-AI-II Body of Knowledge v2.0. The JTA of record is
`jta/SM-AI-II_JTA_v1.4.md`, published in `public.jta_versions`. The normative source is
`reference/scrum-guide-2020.txt`.*
