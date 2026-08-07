# STYLE-GUIDE-AIMS-F.md

**Scope:** lesson authoring for `AIMS-F` (ISO/IEC 42001 Foundation).
**Derived from:** module 1, six lessons, and its Stage-3-style review.
**Companion to:** `LESSON_AUTHORING_SPEC.md` (the renderer contract) and
`AIMS-F_JTA_v1.3.md` (what is taught). This document is neither of those. It is
**how AIMS-F sounds and what it is not allowed to say.**
**Version:** 1.0 · **Date:** 2026-08-07

> ISMS-F's style guide has eleven sections and four exist because something went
> wrong first. This one starts with **one** written that way — §1, attribution,
> which was nearly a defect in lesson 01-01. The rest are conventions applied
> consistently across module 1 and written down so module 2 does not re-derive
> them. **Expect this file to grow by failure.** That is the point of it.

---

## 1. ATTRIBUTION — the rule that already caught something

**Written because of a near-miss in 01-01.** The concept slug `pdca-cycle` is
seeded in the database, ISMS-F teaches plan-do-check-act as ISO/IEC 27001's
operating rhythm, and every commercial course on this family of standards uses
the phrase. **ISO/IEC 42001 never uses it.** Clause 10.1 requires continual
improvement of suitability, adequacy and effectiveness, and that is all.

The lesson now teaches the cycle, attributes it to management-system practice,
and its checkpoint tests the distinction. Had the PDF not been open, it would
have shipped as the standard's own vocabulary.

**The rule:**

1. **State what the standard requires only where it is a requirement in the
   text.** Preserve the modal. `shall` is a requirement. `should` in Annex B is
   guidance. A NOTE is neither.
2. **Where a widely-taught rule is an implication rather than the text,
   attribute it to practice** — "management-system practice calls this",
   "in practice", "you will meet the term".
3. **Where the source is another document, name that document.** Certification
   cycles and certificate validity are ISO/IEC 17021-1 and ISO/IEC 42006. Audit
   conduct rules are ISO 19011. Terminology is ISO/IEC 22989. **Never "the
   standard".**

**Known traps in this cert.** Plan-do-check-act. Stage 1 / stage 2 / surveillance.
Certificate validity periods. Any fairness metric. "Risk register" — the word
appears nowhere. Maturity levels. RACI.

**Check:** grep a finished lesson for `the standard requires|the standard says|
requires that`. Every hit gets verified against the text before the lesson loads.

---

## 2. EXPLAIN, NEVER DEFINE

No ISO definition is reproduced, in any language, ever. A definition is
normative text and is **more** exposed than a paraphrased clause because it is
recognisable on sight.

**Write the behaviour, not the entry.** Module 1's pattern:

> Confidentiality **holds while** only the people meant to reach the information
> can reach it. It breaks the moment someone who should not have it does.

not "Confidentiality is defined as...". A term explained by what it does is both
safer and better teaching.

**This cert has a structural advantage and it should be used.** Clause 2 makes
ISO/IEC 22989:2022 a normative reference and clause 3 delegates terminology to
it, so **there is no definition of "AI system" inside ISO/IEC 42001 to recite.**
Teach the boundary question — *is this thing in scope of our AIMS* — as a
competence. Lesson 2.2 is where that lands.

**Highest-risk text in the whole standard: Table A.1.** The control statements are
short, memorable and recognisable on sight. Module 4 must paraphrase every one.
ISMS-F shipped five near-verbatim ISO definitions in its first module draft and
the external review then asked for **tighter** alignment with ISO's wording.
**A recommendation to align more closely with the standard's phrasing runs
backwards.** Decline it.

---

## 3. THE VOICE

Second person. Active. Specific before abstract — show the situation, then name
the principle.

**Concede what the standard leaves open.** AIMS-F says "so a great deal is left
to you" and "the choice remains the organization's" repeatedly, because that is
true and because a course that pretends otherwise teaches a false expectation.

**Name the reader's likely error directly.** "The most common first misreading
is expecting a technical checklist." Not softened, not hedged. A learner who
recognises their own assumption in that sentence is now paying attention.

**No promotional register.** See §10.

---

## 4. SECTION RHYTHM

Module 1's shape, which held across all six lessons:

| section | count | notes |
|---|---|---|
| `::hook` | 1 | 1-2 sentences. States the tension, not the topic |
| `::concept` | 3 | Each with a `title` attribute. The load-bearing content |
| `::callout` | 1-2 | `pitfall` for the common error, `terminology` for naming |
| `::interactive` | 1 | Always tests the lesson's hardest distinction |
| `::deep-dive` | 1 | Where an honest complication lives |
| `::checkpoint` | 1 | 4 questions |
| `::summary` | 1 | 6 bullets |

**Budget: 12,000-13,000 characters, 12-14 minutes.** Module 1 ran 12,165-12,846.
ISMS-F ran wider (8,688-14,090); the tighter band is deliberate here because
every AIMS-F task is `2_understand` or above and none is recall.

**The `::interactive` earns its place or it is cut.** Each of module 1's six
targets a real confusion: requirement vs technical choice, role in a described
estate, life-cycle ordering, clause mapping, counting over-claims, inside vs
outside the standard. **Do not add interactives for pacing.**

---

## 5. THE HOOK IS AN ARGUMENT

Module 1's six hooks, as a specification by example:

- "It will not tell you how to test a model for bias. It will require you to have
  decided how."
- "Ask an organization what it does with AI and you usually get one answer. The
  standard requires a more careful one."
- "A conventional system is at its most correct on the day it ships. An AI system
  may not be."
- "If you have implemented ISO/IEC 27001, you already know the shape of clauses 4
  to 10. That is deliberate."
- "It is not evidence that the organization complies with any law, and the gap
  between those two statements is where careers get complicated."
- "The fastest way to waste six months is to misjudge which problem this standard
  solves."

**Each states a tension the lesson then resolves.** None announces its topic.
A hook that could be rewritten as "This lesson covers X" is not a hook.

---

## 6. CHECKPOINTS

Four questions. **Bloom level matches the task**, never a difficulty curve —
`v_cognitive_profile` is computed from tasks and a mismatched item is rejected by
a database trigger.

**AIMS-F has no `1_remember` tier at all.** Every module 1 checkpoint is
`2_understand`. This makes the first module noticeably harder than ISMS-F's
equivalent, which is correct and not drift.

**Test the trap, not the fact.** Module 1's questions ask what has been *missed*,
what is *inaccurate*, how a statement should be *corrected* — not what a term
means.

**Distractors are real misconceptions.** "Clause 9.2 of ISO/IEC 42001" as the
source of two-stage audits is wrong in a way a real candidate would believe,
because clause 9.2 genuinely is about audits.

**Explanations: 2-3 sentences.** Say why the key is right and why the most
tempting distractor is wrong. **Review finding: two module 1 explanations run
long and get trimmed by roughly a quarter in the rebuild.** Foundation learners
skim; a long explanation is read less, not more.

---

## 7. THE DEEP-DIVE CARRIES THE HONEST COMPLICATION

Not an appendix for overflow. It is where the thing that does not fit the clean
version goes.

Module 1's six: where certification actually comes from; what role determination
is *for*; why this differs from an information asset; reading the two standards
side by side; what an AIMS gives a regulator if not a defence; an AIMS and an
existing ethics programme.

**Each answers a question a sharp reader would raise against the concept
sections.** If a deep-dive only elaborates, cut it and lengthen the concept.

---

## 8. THE 27001 WEAVE

The credential's differentiator, and it must be **assessable rather than
asserted** — three of the four `4_analyze` tasks in the JTA are integration
tasks.

**Textual basis, always cited, never inferred:** Annex D.2 states integration
with other management system standards is **essential** for responsible
development and use of an AI system, names ISO/IEC 27001 first, and notes that
controls partly relating to information security can be implemented through an
existing 27001 implementation.

**The line to hold:** shared clauses guarantee the **question**, not the
**answer**. Clause 7.2 asks about competence in both standards; the competence
is a different body of knowledge. Integration is reusing machinery **after
checking what it now governs**. Assumption is reusing it without checking.

**Never imply equivalence between the two certifications.** Holding one confers
nothing about the other.

---

## 9. VOLATILE CONTENT

Some content has an expiry and must be written so that going stale is visible
rather than silent.

**The EU AI Act calendar has already been amended once** — a June 2026 package
deferred the high-risk obligations while leaving Article 50 on its original date.

**Teach the shape: risk-tiered, extraterritorial by market placement, phased,
amendable.** Where a date is unavoidable, say the timetable has moved before.
Lesson 01-05 does this and names no specific date in its body.

**Re-verification triggers**, per `BOK-AIMS-F.md` §6: any EU AI Act amendment;
ISO/IEC 22989 Amendment 1 on generative AI, since 22989 is a normative
reference; a new edition of ISO/IEC 42001 or 42006.

---

## 10. THE LEARNER IS NOT THE BUYER

**Written because a review recommended otherwise.** The module 1 review suggested
one lesson add "a stronger commercial-facing sentence… make it land harder for
the buyer."

**Declined, and the rule is now standing.** A lesson written to land with a
purchaser has stopped teaching. Lesson 01-05 already dissects three distinct
over-claims in a scenario the learner has to reason through — that is the
visceral version, and it is assessment rather than persuasion.

**This is the second time a reviewer has pushed toward promotional framing.**
Grok's documented pattern is sound craft judgment with an instinct to amplify.
Accept the craft notes. Decline the amplification.

Marketing lives in `/console/library` and the sales decks. Lessons teach.

---

## 11. FORWARD COMMITMENTS

Things module 1 sets up that a later module must honour. **Check this list before
authoring each module.**

| Owed by | What |
|---|---|
| **5.1** | Reinforce **continuous learning vs drift**. It is the highest-value teaching point in module 1, it appears strongly once, and it becomes operational where monitoring is taught |
| 2.2 | The scope-boundary question, as the competence that replaces reciting a definition of "AI system" (§2) |
| 2.7 | The four axes separating risk assessment from impact assessment. **Direction of harm is wrong and must not reappear** |
| 4.1 | 38 controls, nine categories, ten objectives, Annex B **normative** |
| 4.6 | Control selection against the role determined in 01-02 |
| 4.7 | Where one control serves both standards and where that is a mistake |
| 5.5 | The certification route, attributed to 42006 and 17021-1 |

---

## 12. BEFORE A MODULE IS DONE

- [ ] Every task in the domain has exactly one lesson
- [ ] Every concept in the domain appears in exactly one lesson's `concept_slugs`
- [ ] Frontmatter `task_codes` and `concept_slugs` resolve against the live tables
- [ ] Bloom level of every checkpoint question matches its task
- [ ] Attribution sweep (§1) run and every hit verified against the PDF
- [ ] No reproduced definition or control statement (§2)
- [ ] 12,000-13,000 characters, 12-14 minutes
- [ ] `wire-lessons.mjs` run — **frontmatter alone is inert.** A lesson with zero
      rows in `lesson_concepts` or `lesson_tasks` is not done
- [ ] Forward commitments (§11) checked and updated

---

*Written after module 1, before module 2. Every section here is either a
convention applied consistently or a rule that exists because something nearly
went wrong. When the next thing goes wrong, add a section and say why.*
