# AIGRM-I Lesson Style Guide (LOCKED)

**Status:** LOCKED. Proven by Module 1 (8 lessons, Grok 8.8/10, "ready to move
forward"). Every AIGRM-I lesson (Modules 2-5, tasks 2.1-5.8) is authored to this
guide. It is additive to `LESSON_AUTHORING_SPEC.md` (v1.2) - the spec is the DSL;
this is the cert-specific voice, structure, and calibration for AIGRM-I governance
content. Where this guide and the spec agree, the spec wins on mechanics; this guide
governs feel and governance-domain specifics.

---

## 1. The invariant: one lesson per task

AIGRM-I is a lesson-per-task cert (like SM/SPO/SD). **49 tasks -> ~49 lessons.**
One task -> exactly one lesson -> one row-group. Never split a task across two
lessons, even a concept-dense one (see the 1.5 ruling in §5). This keeps the
traceability matrix clean: task -> lesson is 1:1, coverage is trivially provable.

Frontmatter `task_codes` carries exactly the one task; `concept_slugs` carries
**exactly that task's JTA concept set** - no more, no less. (Validated
programmatically: frontmatter concepts must equal the task's `task_concepts`.)

---

## 2. The spine (every lesson, in order)

```
::hook                              1 short para - sharp, concrete, non-corporate
::concept (x2-4)                    each with [term]{glossary="slug"} on concept slugs
::callout                           exactly 1, type per §6
::interactive                       exactly 1, widget per §4
::concept "The Skill: ..."          names the skill the lesson builds
::checkpoint                        3 questions, Bloom-laddered (§7)
::summary                           5 bullets
```

Size target **8-11 KB / 8-10 minutes** (Module 1 ran 8.1-10.6 KB). Concept blocks
2-4; more than 4 is the density warning (§5).

---

## 3. Voice

- **Second person, direct, opinionated.** "You hold it against this definition,"
  not "one may compare it to the definition."
- **Governance is distinction-drawing** - this cert's content draws sharper lines
  than Scrum's scenario content, and that is correct. BUT every hook and every
  interactive is **scenario-anchored** (a real org mixup, real activities to sort)
  so the lesson exercises the distinction rather than reciting a glossary. Grok
  confirmed this balance is right; do not drift toward dry definition-listing.
- **Name the enemy.** The strongest lessons (1.1, 1.3, 1.6) open on a wrong belief
  the lesson dismantles ("nothing bad has happened, so there's no risk"; "more
  capable, so trust it more"). Lead with the misconception, then take it apart.
- **AI-era woven, not bolted on.** Generative/agentic examples appear inside the
  concept, not in a tacked-on "AI angle" paragraph.
- **ASCII-only prose.** Hyphens not em-dashes, straight quotes, no ellipsis
  characters - lesson SQL is loaded via `load-lessons-direct.mjs`, but ASCII keeps
  every downstream step (editor spot-checks, diffs) safe. Verify with
  `grep -nP '[^\x00-\x7F]'`.

---

## 4. Widget variety (Grok medium-priority note: applied)

Do not default every lesson to drag-match. Match the widget to the cognitive move:

| Widget | Use when the skill is... | Module 1 example |
|---|---|---|
| `drag-match` | classify / sort items into categories | 1.1, 1.2, 1.5, 1.7 |
| `sort-into-order` | a real sequence or flow | 1.4 (value chain) |
| `scenario-mcq` | multi-step judgment (esp. 3_apply/4_analyze tasks) | 1.3, 1.6 |
| grouped `::concept` + drag-match | a set that clusters into themes | 1.5 |

**Rule:** any task at Bloom `3_apply` or `4_analyze` should strongly prefer
`scenario-mcq` for its interactive - judgment tasks deserve a judgment widget. Aim
for **at least 2 scenario-mcq widgets per module.** Drag-match remains the workhorse
for classification/distinction lessons (which governance has many of).

---

## 5. Concept density - the 1.5 ceiling (Grok's one structural note)

1.5 (seven trustworthy-AI characteristics) was flagged as "slightly long - the
'set, not a trait' idea can get lost in the list." **Ruling: do not split.** One
task = one lesson is inviolable. Instead, when a task is concept-dense (6+ concepts):

1. Use the **grouped `::concept`** layout - cluster the items into 3-4 named themes
   so the reader holds structure, not a flat list.
2. Make the **interactive heavier** - a larger drag-match or a scenario that
   *exercises* the whole set, so the unifying thesis is used, not just stated.
3. Make the **apply-level checkpoint question scenario-based**, forcing the learner
   to walk the whole set to answer.
4. State the unifying thesis **first** (before the list) and **echo it in the
   summary**, so the list is bracketed by the point it serves.

Tasks likely to hit this ceiling later: any with 6+ concepts (check the JTA - e.g.
D2's generative-risk taxonomy 2.6, D3's high-risk obligations 3.2, D4's lifecycle
tasks). Apply the four moves above rather than splitting.

---

## 6. Callouts (exactly one per lesson)

Pick the type that fits the lesson's one most-important aside:
- `pitfall` - the classic mistake (1.1 compliance-as-governance, 1.3 likelihood-only,
  1.4 "we just bought it"). Governance lessons often warrant this.
- `note` - a nuance/caveat that prevents over-simplifying (1.2 overlap, 1.7 blurred lines).
- `pro-tip` - a practitioner's quick test (1.6, 1.8 "which altitude").
- `exam-watch` - when framework wording varies but substance is stable (1.5).

Do not stack callouts; one focused aside beats three.

---

## 7. Checkpoints (3 questions, laddered)

- **Bloom ladder** rising to the task's own Bloom level:
  - `2_understand` task -> q1 `1_remember`, q2 `2_understand`, q3 `3_apply`.
  - `3_apply` task -> q1 `2_understand`, q2 `2_understand`, q3 `3_apply`.
  - `4_analyze` task -> ladder up to `4_analyze` on q3.
- **Difficulty** 1 -> 2 -> 3 across the three.
- **Distractors are real things stated wrong** - a true concept in the wrong slot,
  a real value pairing reversed, the exact misconception the lesson dismantled.
  Never a nonsense throwaway option (the "it violates nothing" style is used at most
  once, as the obviously-wrong anchor).
- **Every question** carries `concept_slugs` (seeded), `bloom_level` (valid enum),
  `difficulty`, and an `explanation` that says why the key is right AND why the
  distractors are wrong.
- These checkpoint questions are teaching-practice, NOT the secure exam pool - they
  live in `content_md`. The secure bank is generated separately (Stage 9) and never
  linked into `question_concepts` (the firewall).

---

## 8. Structural cohesion (the through-line)

Module 1 opens on "name the job" (1.1) and closes on "name the altitude" (1.8) -
the same analytic move scaled from three jobs to the whole organization. Grok read
this as good structure, not repetition. **Each module should have a through-line**:
a skill introduced early and paid off in the closer, so the module feels composed
rather than eight adjacent lessons. State the closer's callback explicitly ("the
module's 'name the job' move, scaled up").

---

## 9. The "Skill" concept (second-to-last block)

Every lesson has a penultimate `::concept title="The Skill: ..."` that names, in
plain terms, the transferable move the lesson builds - "name the job, notice which
is missing"; "place the system, then govern it"; "separate, then size." This is
what makes a lesson feel like training rather than reading. It also seeds the
task's real-world ability (the JTA's `abilities` field).

---

## 10. Governance-domain guardrails (non-negotiable, from CERT-CREATION.md)

- **Third-party frameworks are taught as pedagogical cross-reference, never as
  identity.** "Comprehensive AI laws are the classic example of a binding
  regulation" is fine. "Welcome to the EU AI Act course" is forbidden - AIGRM-I is
  Certidemy's own credential built on public frameworks, never a claim to BE any
  framework. In lessons, name frameworks as *examples of a type* or *instances a
  learner will meet*, taught from public summaries.
- **No reproduction of copyrighted standard text.** ISO/IEC standards are paywalled;
  teach the concepts from public summaries, never paste clause text.
- **Teach structure and obligations, not compliance advice.** "High-risk systems
  must enable human oversight" (structure) not "here's how to make your system
  compliant" (advice). AIGRM-I certifies understanding, not legal sign-off.
- **Accuracy over currency-chasing in prose.** Frameworks evolve; write lessons on
  the stable substance (risk tiers, obligation types, the four RMF functions), not
  volatile dates/version numbers that age badly.

---

## 11. Authoring checklist (run before handing a lesson off)

- [ ] Frontmatter complete; `certification_code: AIGRM-I`; correct `module_slug`.
- [ ] `task_codes` = the one task; `concept_slugs` = that task's exact JTA set.
- [ ] Spine present: hook, 2-4 concepts, 1 callout, 1 interactive, Skill concept,
      checkpoint (3 Qs), summary (5 bullets).
- [ ] Widget chosen per §4 (scenario-mcq for apply/analyze tasks).
- [ ] Every `[term]{glossary="slug"}` and every checkpoint `concept_slug` resolves
      to a seeded concept.
- [ ] Checkpoint Bloom-laddered to the task level; distractors are truths-stated-wrong.
- [ ] Concept-dense (6+)? Applied the §5 four moves, did NOT split.
- [ ] ASCII-only (`grep -nP '[^\x00-\x7F]'` clean).
- [ ] Governance guardrails (§10) respected - no identity claims, no clause text,
      structure-not-advice.
- [ ] After authoring the module: `wire-lessons.mjs` projects frontmatter into
      `lesson_concepts`/`lesson_tasks` (spec v1.2 §12 - the step skipped twice before).

---

*Locked from Module 1 review (Grok 8.8/10, July 2026). Companion to CERT-CREATION.md
(Stage 7) and LESSON_AUTHORING_SPEC v1.2. If a later module surfaces a genuinely new
pattern, amend here with a changelog note - but the invariants (§1 one-per-task, §5
no-split, §10 guardrails) do not move.*
