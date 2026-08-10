# STYLE-GUIDE-ISMS-IA.md

**Per-cert authoring delta for ISO/IEC 27001:2022 Internal Auditor - AI.**
**Version:** 1.1 · **Derived from:** modules 1 and 2, twelve lessons, authored and
externally reviewed 2026-08-10 (module 1 at commit `00d1997`).
**Applies to:** the remaining 26 lessons, all three languages, and the item banks.

This document does **not** restate `LESSON_AUTHORING_SPEC.md`. It records only
what is different or additionally binding for this credential, and every rule
here was earned by writing module 1 rather than decided in advance.

---

## 0. THE THREE RULES THAT OVERRIDE EVERYTHING

### 0.1 Every claim names the document it comes from

This credential teaches on the seam where **ISO 19011:2026** (guidance),
**ISO/IEC 27001:2022** (requirements) and **ISO/IEC 17021-1** (third-party
certification) meet. Widely repeated audit maxims frequently attach to none of
them.

> **If a lesson asserts that something is required, the sentence must make clear
> which document requires it. If no document does, the lesson says so.**

Three claims are dismantled in module 1 and must never be reintroduced anywhere:

| Claim | Truth |
|---|---|
| An auditor may not audit their own work | **In neither standard.** 19011 4.6 says independent of the activity *wherever practicable*, and where that is not possible, every effort to remove bias |
| A risk register is required | **Nowhere.** 6.1.2 and 6.1.3 require documented information about the *processes*; 8.2 and 8.3 about the *results* |
| Major / minor nonconformity | **ISO/IEC 17021-1 practice.** 27001 uses only *nonconformity* and defines no severity |

The full map is `ISMS-IA_JTA_v2.0` §3. **Read it before authoring any lesson.**

### 0.2 Read a rendered lesson before using any widget for the first time

The authoring spec documents each widget's schema. It does **not** document
convention, and convention is what makes a widget work.

This was learned expensively. Module 1's `scenario-mcq` was first written from
the schema alone and invented a terminal step that looped to itself. Reading
`content/isms-f/03-risk-assessment-and-treatment/03-11-the-clean-result.md`
showed the actual pattern in about a minute.

> **Before the first use of any widget in this cert, open a live lesson that uses
> it.** `content/smpc/_test/_test-all-widgets.md` covers all six.

### 0.3 Attribution corrections never live in a `::deep-dive`

A deep-dive renders **collapsed in Focus mode**. A candidate working on a phone
can complete the lesson without ever expanding it, and nothing marks it as
skipped.

> **Anything that dismantles a claim a candidate would otherwise carry into
> practice belongs in a `::callout type="pitfall"` in the main flow.** Deep-dives
> carry depth for the interested reader. They do not carry corrections.

Module 1 got this right by instinct - every dismantled maxim sits in a body
callout. Module 2's lesson 02-06 initially buried "clause 9.2 does not require a
documented audit procedure" in a deep-dive and had to be moved. The test: if a
candidate who skipped this passage would raise a finding against a requirement
that does not exist, it is not optional content.

### 0.4 Three standards open in another window, always

Every content defect in this credential's ancestry was **true and well taught,
attributed to text that does not say it.** ISO 19011:2026, ISO/IEC 27001:2022,
ISO/IEC 42001:2023. A second window catches every one of them.

---

## 1. FRONTMATTER CONVENTIONS FOR THIS CERT

```yaml
lesson_id: isms-ia-01-01-audit-parties        # cert-prefixed - see below
module_slug: ia-audit-function                 # ia- prefixed - see below
certification_code: ISMS-IA
language: en
lesson_group_id: <same as lesson_id>
prerequisites: [<previous lesson_id in the module>]
status: draft
```

**`lesson_id` carries an `isms-ia-` prefix.** Lesson slug uniqueness is global,
not per-cert. The filename does **not** carry the prefix - it follows the spec's
`{module}-{lesson}-{slug}.md` convention.

**`module_slug` carries an `ia-` prefix** because `modules_slug_unique` is a
table-wide constraint. The slug must equal the content folder name minus its
`NN-` prefix and match the module row in the database exactly. **A typo loads
lessons into nothing, silently.**

**`prerequisites` chains within the module.** Each lesson lists the previous one.
Module 1 reads as one argument and the later modules should too.

**One lesson per task.** 38 tasks, 38 lessons. `task_codes` holds exactly one
code; `concept_slugs` holds every concept mapped to that task in
`ISMS-IA_CONCEPTS_v2.0` - all of them, none added.

---

## 2. SECTION SHAPE THAT MODULE 1 ESTABLISHED

```
hook → concept ×3-5 → callout → interactive → concept → callout/deep-dive
     → checkpoint (4 questions) → summary (5 bullets)
```

| Element | Convention for this cert |
|---|---|
| `::hook` | One or two sentences that state a tension, not a topic. "Two people examine the same control and reach different conclusions." Never "In this lesson you will learn..." |
| `::concept` | 150-300 words, one idea. Title is a claim, not a label - "The second obligation, and it is not the same one", not "Annex A 5.35" |
| `::callout` | 1-3 per lesson. `pitfall` for the attribution traps, `exam-watch` for a discrimination the exam turns on, `terminology` where a familiar phrase is practice rather than text. Every dismantled claim gets one - see §0.3 |
| `::interactive` | Exactly one, placed after the concepts it tests and before any that build on it |
| `::deep-dive` | At most one. Genuine depth for the interested reader; never overflow for content that did not fit |
| `::checkpoint` | **Four questions.** Three is thin for a Level II lesson; five crowds the end |
| `::summary` | **Five bullets**, each one short sentence. One bullet per major concept |

**Duration: 11-13 minutes.** Module 1 ran 11, 12, 13, 12, 11. Anything under 10
suggests a concept was skipped; over 14 suggests two lessons.

---

## 3. WIDGET CONVENTIONS

### 3.1 `scenario-mcq` - the pattern that actually works

Copied from `ISMS-F` 03-11 and now binding here.

- **The terminal step omits `next` entirely.** Its options carry only `id` and
  `text`. Do not invent a self-referencing end node.
- **Wrong choices route to a correction step**, not to a shared debrief. The
  correction states *why* the choice fails, then re-offers the remaining options.
  The widget teaches on the wrong path; that is most of its value.
- **Correct choices acknowledge before advancing** - "Correct. Now trace the
  mechanism."
- `best_path` lists `step-id:option-id` pairs for the optimal route.
- Validate the JSON before shipping: every `next` resolves to a real step, and
  the terminal step has none.

### 3.2 `drag-match` - strictly 1:1

`verify-cert` checks this. Equal items and targets, a bijection in `correct`,
and no `allowReuse` unless there is a reason that survives the invariant.

**Use a "None of these" target where the teaching point is an absence.** Lesson
01-05's best moment is the risk register having nowhere to go.

### 3.3 `toggle-and-observe` - use the dependency chain or use something else

`depends_on` locks a toggle until its predecessors are on. That mechanic is the
reason to choose this widget: it renders an argument in which each condition is
worthless without the one before it.

Lesson 02-02 chains programme objectives → risk allocation → resourcing → cycle
coverage. Without objectives there is no basis for allocating by risk; without
allocation no basis for sizing resources; without resources a cycle plan is a
schedule nobody can keep. **The chain IS the teaching point.**

If the conditions are independent, this is the wrong widget - use `drag-match`.
Write `off_consequence` as a concrete failure, never as the absence of a benefit.

### 3.4 `sort-into-order` - for decisions with a forced sequence

Use it where getting the order wrong produces a specific, nameable failure, and
say what that failure is in the `explanation`. Lesson 02-05 sequences the
staffing decision: starting anywhere other than the audit's scope produces a team
assembled from who was free rather than from what the audit needs.

Five or six items. Fewer is trivial; more becomes a memory test.

### 3.5 `highlight-mistake` - include non-defects

Distractors with `is_correct: false` and feedback explaining *why they are not
defects* are as instructive as the real ones. Lesson 01-03 marks auditor training
and a signed impartiality declaration as non-defects, which is exactly where the
misconception lives.

Set `minimum_correct` below the number of true defects so the widget rewards
recognition rather than exhaustiveness.

**Where the lesson's thesis is that something familiar is NOT a defect, make it a
distractor.** Lesson 02-06 marks "audited once during the calendar year" as
`is_correct: false`, because annual frequency is not a defect - the absent basis
for it is. A reviewer who thinks that distractor is wrong has told you the lesson
failed to teach its own point, which is useful information.

---

## 4. CHECKPOINT QUESTIONS

**Difficulty is honest to the task's declared Bloom level.** This is a Level II
credential, and the temptation is to inflate. Resist it.

| Task bloom | Question framing | Difficulty |
|---|---|---|
| `2_understand` | Distinguish, attribute, identify what a document says | 2-3 |
| `3_apply` | Given a described situation and a stated rule, select | 3 |
| `4_analyze` | Weigh competing considerations; determine what evidence supports | 3-4 |

**The database trigger enforces Bloom from `public.tasks`.** A checkpoint question
whose `bloom_level` disagrees with its task will not insert.

### 4.1 What an Analyze question must actually do

It must require the candidate to **weigh** something. Recognition dressed in a
scenario is still recognition.

Test it: if the candidate could answer by recalling one sentence from the lesson,
it is not Analyze regardless of how long the stem is.

Module 1's 01-02 q1 is the reference - a confidential disclosure where
confidentiality and fair presentation both engage, and the answer is neither
sacrifice.

> **Binding note for item generation:** that question must not be softened into a
> simple confidentiality lookup. The competing-principles structure *is* the
> assessed competence.

### 4.2 Explanations teach

Every `explanation` says why the correct answer is correct **and** why the most
attractive wrong answer fails. Where an option cites a requirement that does not
exist, the explanation says so plainly - that is the highest-value sentence in
the lesson.

### 4.3 One `multi_choice` per lesson at most

Module 1 used one in 01-01 and one in 01-03. More than that and the checkpoint
starts testing reading stamina.

---

## 5. VOICE FOR THIS CREDENTIAL

The `LESSON_AUTHORING_SPEC` §8 conventions hold - second person, active voice,
specific over abstract. Additionally:

**Write for someone who will be challenged on this.** The reader is going to
raise findings that cost people work, and they will be pushed back on. Lessons
should give them language that survives that.

**State the limit as clearly as the rule.** "Clause 9.2.2 b) requires an outcome
and prescribes no method" is more useful than a paraphrase that sounds more
definite than the standard is.

**Prefer the standard's own words for anything load-bearing**, quoted in a
blockquote, and paraphrase everything else. Do not reproduce normative text
beyond what the point requires.

**No invented organizations with recognisable names.** Sector and size only - "a
manufacturer with fourteen people in IT", "a logistics company", "a hospital's
quality team". Names used for individuals in scenarios are drawn from Latin
American and Iberian usage where natural, since the credential ships in es-419
and pt-BR.

**No em-dashes in scenario text destined for widget JSON.** They survive markdown
fine; they have corrupted large SQL pastes before. Hyphens in JSON bodies.

---

## 6. TERMINOLOGY

| Use | Not | Why |
|---|---|---|
| audit criteria | audit standard | *Criteria* is the defined term (19011 3.8) |
| audit evidence | proof, findings | *Finding* is the result of evaluating evidence against criteria (3.11) |
| remote auditing method | remote audit | The defined term (3.4) is *remote auditing method* |
| nonconformity | non-conformance, NC | The term ISO/IEC 27001 uses |
| the organization | the company, the client | Matches the standards |
| top management | senior leadership, the board | Defined term |
| Statement of Applicability, then SoA | SOA | Spell out on first use per lesson |

**Do not coin acronyms.** `SGSIA` was invented independently by two translators
for AIMS-F and exists nowhere in the market. Spell things out.

**Clause references:** `clause 9.2.2 b)` for 27001, `clause 6.4.7` for 19011,
`Annex A control 5.35` for controls. Always name the standard on first reference
in a lesson.

---

## 7. THE AI THREAD

Three distinct threads, and they must not be collapsed:

1. **Auditing an ISMS whose scope contains AI systems** - D2 task 2.7, D4 tasks
   4.8 and 4.9.
2. **Using AI tooling within the audit** - D1 task 1.4, D3 task 3.8, D5 task 5.4.
3. **The integrated ISMS/AIMS audit** - D4 task 4.10.

**Thread 2 is the credential's differentiator and it is grounded in text.**
ISO 19011:2026 clause 7.2.3 requires auditors to understand the appropriateness
and consequences of using ICT tools and emerging technology to conduct audits,
naming artificial-intelligence-based evaluation tools as its example.

> **Cite the clause. Do not present this as our observation about modern
> practice - it is a competence the standard declares.**

**Task 3.8 is the signature task of the credential.** Its lesson carries the most
weight in the cert. Protect it through authoring and through item generation.

---

## 8. FORWARD REFERENCES

Module 1 points forward twice - 01-04 to Module 3 on AI-assisted evidence, 01-05
to Module 5 on severity. Both are promises.

> **A forward reference is a debt. The later module must pay it, and in the terms
> the earlier lesson used.**

Keep them rare and specific. "You will meet this properly in Module 3" is a
commitment; "we will return to this later" is filler.

---

## 9. BEFORE A MODULE IS DONE

- [ ] One lesson per task, `task_codes` holds exactly one code
- [ ] Every concept mapped to those tasks appears in some lesson's `concept_slugs`
- [ ] Every widget JSON parses; every `next` resolves; terminal steps omit `next`
- [ ] Every checkpoint question's `bloom_level` matches its task's declared level
- [ ] No claim asserts a requirement without naming the document
- [ ] No attribution correction sits inside a `::deep-dive` (§0.3)
- [ ] Every checkpoint and widget body parses as JSON, and every `correct` id
      exists among that question's options
- [ ] No forward reference is made that a later module cannot pay
- [ ] `module_slug` matches the folder name minus `NN-` and the database row
- [ ] Read aloud - does the module read as one argument or five files?

**Then, and not before:** `load-lessons-direct.mjs` (`--dry` first, never
`--dry-run`), `wire-lessons.mjs` (`DRY_RUN=1` first), and the coverage query.

---

*End of STYLE-GUIDE-ISMS-IA v1.0. Update when a later module establishes a
convention this one does not cover.*
