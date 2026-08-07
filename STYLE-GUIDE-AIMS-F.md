# STYLE-GUIDE-AIMS-F.md

**Scope:** lesson authoring for `AIMS-F` (ISO/IEC 42001 Foundation).
**Derived from:** all five modules, 35 lessons, and their reviews.
**Companion to:** `LESSON_AUTHORING_SPEC.md` (the renderer contract) and
`AIMS-F_JTA_v1.3.md` (what is taught). This document is neither of those. It is
**how AIMS-F sounds and what it is not allowed to say.**
**Version:** 1.1 · **Date:** 2026-08-07

> ISMS-F's style guide has eleven sections and four exist because something went
> wrong first. **v1.0 had one such section. v1.1 has four**, and §13 and §14 were
> both written after a load failed. Expect this file to keep growing by failure;
> that is the point of it.

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

**Budget, revised in v1.1: 12,000-14,000 characters, 12-15 minutes.** Module 1
ran 12,165-12,846 and the original band was set from it. Modules 2 to 5 could not
hold it, and the reason is structural rather than indiscipline: module 1 is
conceptual while modules 4 and 5 enumerate 38 controls and the clause 9-10
machinery. **Two stated exceptions**, both deliberate:

| lesson | chars | why |
|---|---|---|
| 04-06 use and third-party controls | ~14,500 | Carries the full human-oversight guidance, which is the longest passage in Annex B |
| 05-05 the certification route | ~14,100 | Four documents to separate, and the separation is the whole competence |

**Trimming below the band costs content the task assesses.** Where a lesson runs
long, state why in this table rather than cutting a concept block.

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


---

## 13. LESSON SLUGS ARE GLOBALLY UNIQUE

**Written after module 5 failed to load.** Three lessons silently did not insert,
and coverage read 142 of 154 with no error reported anywhere.

`lessons.slug` is unique **across all certifications**, not scoped per cert — the
same shape as `modules_slug_unique`, which migration 177 already hit. ISMS-F owned
`05-01-monitoring-and-measurement`, `05-02-internal-audit` and
`05-03-management-review`, because two certs on management-system standards
produce the same clause structure and therefore the same natural lesson names.

**`load-lessons-direct.mjs` checks `(slug, language)` and skips silently.** It
reported `skipped(existing): 32` when only 29 existed, and nothing in the output
distinguished a real skip from a collision.

**The rule:**

> Before authoring a module, query for slug collisions. One statement:
>
> ```sql
> select l.slug, c.code from lessons l
> join modules m on m.id = l.module_id
> join certifications c on c.id = m.certification_id
> where l.slug in ('<planned slugs>');
> ```
>
> Any row is a collision. **Prefix the cert's lessons** — AIMS-F uses
> `05-01-aims-...` — and do it before loading, because `lesson_group_id` is
> `uuidV5(lesson_id, CERT_ID)` and translations group on it.

**This will recur.** AIMS-IA, ISMS-IA and AIMS-LI all sit on clause-structured
standards. Consider prefixing every lesson slug from the start on any future
standards-based cert rather than discovering the collision at load.

**And verify the load by count, not by exit code.** `inserted + skipped` must
equal the file count, and `skipped` must equal what was already there.

---

## 14. THE SWEEP FINDS WHAT THE REVIEW DOES NOT

**Written from five modules of evidence.**

Across all five reviews, the external reviewer rated factual accuracy 9.0 to 9.3
and reported no material errors. **It found zero of the thirteen reproduced
definitions and clause statements.** The mechanical sweep found all thirteen.

That is not a failing of the review. It checks whether claims are *true*, and a
reproduction is true — which is exactly what makes it invisible to that check.
**Two instruments, two defect classes, and only one of them looks for §2.**

| module | §2 hits found by sweep | what they were |
|---|---|---|
| 1 | 3 | Introduction text, A.6.1.2 control wording, a clause 4.1 `shall` |
| 2 | 5 | Clause 4.3 scope, risk definition, impact assessment definition, SoA definition, the consistency phrase |
| 3 | 0 | first clean pass |
| 4 | 0 | Table A.1's 35 control statements, clean on first pass |
| 5 | 5 | clause 3 definitions: nonconformity, corrective action, requirement, effectiveness, plus 9.3.1 |

**The pattern to read from this:** hits cluster where the standard's own phrasing
is most quotable. Definitions and short `shall` clauses are the danger; long
guidance passages are safe because nobody reproduces a paragraph by accident.

**Run the sweep before sending anything for review**, and run it against the
specific text the module touches — a generic banned-phrase list will not catch
module 5's clause 3 definitions or module 4's Table A.1.

---

*v1.1 written after all 35 lessons. §1, §10, §13 and §14 exist because something
went wrong first. When the next thing does, add a section and say why.*
