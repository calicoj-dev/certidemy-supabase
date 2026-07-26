# AIHR-I Lesson Style Guide

**Status:** Locked authoring standard for AIHR-I. Derived from Module 1, reviewed and
locked 26 July 2026.
**Relationship to the platform guides:** `LESSON_AUTHORING_SPEC.md` is the syntax
contract and `LESSON_STYLE_GUIDE.md` v1.0 is the quality contract. Both apply in full.
**This document is the delta only** — the conventions AIHR-I needs that the platform
guide does not cover. Where they conflict, this document governs for this cert.

---

## Why a per-cert delta exists here

AIHR-I differs from every other credential in the catalog in three ways that change how
lessons must be written.

It teaches **legal exposure to people who are not lawyers**, which creates a boundary
no other cert has to police. Its **content is perishable** — three of the instruments
it teaches moved in the eighteen months before Module 1 was written. And Domain 3
teaches learners how to evaluate credentials while Certidemy sells credentials, which
is a conflict of interest managed by construction rather than disclosure.

Everything below follows from one of those three.

---

## 1. The escalation boundary (Domain 2, absolute)

**Every Domain 2 lesson terminates at "and this is where you involve legal."** The
credential builds recognition and escalation. It does not build the ability to clear a
compliance question, and a learner who finishes thinking otherwise has been harmed.

In practice:

- Teach **what triggers a duty**, never **whether the organization has satisfied it**.
- Where a lesson describes what a duty requires, the closing move is the escalation,
  not a checklist that implies self-clearance.
- Never write a sentence a reader could quote back as advice. "You must give notice
  within thirty days" is advice. "Several regimes require explanation within a fixed
  period — find out which applies to you before you need to know" is competence.
- The register is *recognize and route*, not *decide*.

This boundary is also a marketing constraint (`SCHEME-AIHR-I.md` §11.3). If lesson
prose drifts past it, the credential's 30% Domain 2 weighting stops being defensible.

---

## 2. Function over technology (all domains)

**"Is it AI?" is never the test, anywhere in this cert.** It is an unfalsifiable
argument, vendors have every incentive to keep it murky, and it produces no decision.

Every diagnostic in this credential is built on what a tool *does*:

- Not "is this AI" but **"is anything here producing a prediction, score, or ranking
  about a person?"** (01-01)
- Not "does it use machine learning" but **"does it decide or shape who advances?"**
  (01-02)
- Not "is the vendor's AI claim true" but **"what does the system compute, and what
  evidence supports the claim?"** (01-05)

Where a lesson must discuss the technology label at all, it does so to explain why the
label is not the test — never to resolve it.

---

## 3. Every lesson hands over one portable test

The signature device of this credential. Each lesson leaves the learner with **one
short question they can ask out loud in a meeting**, phrased so it survives being
repeated by someone who read the lesson once.

Module 1's set, as the pattern to match:

| Lesson | The test |
|---|---|
| 01-01 | "Is anything here producing a prediction, score, or ranking about a person?" |
| 01-02 | "Does it decide or shape who advances?" |
| 01-03 | "87 of what, computed against whom?" |
| 01-04 | "This measures something — but is it what it says it measures?" |
| 01-05 | "What evidence would settle this claim?" |

Rules: one per lesson, not three. It appears in the body prose and again in the
summary. It is phrased as a question the learner asks someone else, because that is how
this competence is actually used — the holder of this credential is usually the person
in the room who asks the awkward question.

---

## 4. Name which error is expensive

Wherever a lesson presents a judgment call, **say which way to err and why the two
errors cost different amounts.** Do not leave the learner balanced between two options
as though the risks were symmetric.

The model is 01-02's pitfall callout: misclassifying an out-of-scope tool as in-scope
costs one unnecessary review; misclassifying an in-scope tool as out-of-scope means
every downstream duty went silently undone, and the absence of records is itself the
problem when a claim arrives.

This is the shape: *state both errors, price them, name the direction to lean.* It is
what makes the lesson usable under time pressure, which is the only condition in which
it will actually be used.

---

## 5. Perishability discipline (Domain 2, mandatory)

- **Every Domain 2 lesson carries a `verified_as_of` date in frontmatter**, pointing at
  `AIHR-I-LATAM-REGULATORY-RECORD.md` or its successor.
- **No statute name, citation, effective date, or numeric threshold appears in a task
  statement, a lesson title, or a section heading.** They live in body prose and
  concept descriptions, which are updatable. Task codes are immutable; a lesson titled
  after a statute rots with it.
- **Pending law is labelled pending, every time.** Brazil's PL 2338 and Colombia's PL
  043 are direction of travel. A lesson that states either as current duty is wrong,
  not merely early.
- **Teach the duty taxonomy, not the statute list.** Disclosure, audit, explanation,
  human review, record, non-discrimination liability. A learner who knows the six axes
  can read the next law; one who memorized four statutes cannot read the fifth. The
  LATAM record §5 proves this and Domain 2 should make the argument explicitly.
- **Dead authorities are a named hazard.** INAI does not exist. Any source naming it as
  a current Mexican authority is describing a regime that ended in March 2025.

---

## 6. Forward references are one clause, never a lesson

Concepts owned by a later domain get **a single clause of connection and a pointer** —
never a partial treatment that the owning lesson then has to repeat.

Correct, from 01-04: *"which turns a validity problem into an accessibility and
discrimination problem. That link is developed in Domain 2; note here that it starts
with a construct-validity failure."* One sentence, names the connection, hands it off.

Incorrect: explaining disparate impact in Domain 1 because it seemed relevant. Domain 2
owns it, and a reader who meets it twice learns it worse.

---

## 7. The candidate is a person, not throughput

A register rule with legal consequences behind it.

Candidates are **rights-holders**, and Domain 2 makes that literal. Prose that treats
them as volume — "processing 400 applicants," "filtering out the noise" — teaches the
posture the credential exists to correct, and a learner who absorbs it will make the
accommodation and explanation duties feel like friction rather than obligation.

Write about candidates as people whose employment prospects are being decided, and
about the practitioner as someone accountable for that decision.

---

## 8. Precision, not scepticism

The failure mode this cert must avoid is producing graduates who dismiss AI tooling
wholesale. That is as useless as credulity and is easier to fall into when the material
is critical.

Every lesson refuses **both** overclaim and dismissal. The model is 01-03's checkpoint
q3: the wrong answers include "the scores are unreliable and should be ignored
entirely" alongside the vendor's framing. The correct answer names what was computed
and refuses only the unsupported inference.

Say what the tool does do. Then say precisely what it does not. Accuracy about the
technology, not hostility toward it.

---

## 9. Domain 3 impartiality (construction, not disclaimer)

Binding, and enforced by an automated check (`SCHEME-AIHR-I.md` §8.2):

- **Certidemy is never named in Domain 3.** Not in lessons, not in items, not in
  examples.
- **ISO/IEC 17024 appears as one accreditation standard among several**, never as the
  benchmark.
- **No real credential or training provider is named.** All examples are hypothetical
  or generically described.
- **No credential type is superior in the abstract.** Fitness is relative to the hiring
  question, and lessons teach evaluation properties rather than a preferred category.

Tasks 3.5–3.8 are scanned before publication. A hit blocks release.

---

## 10. Widget selection by cognitive level

Confirmed against Module 1 in review. Match the widget to what the task demands:

| Task Bloom | Widget | Why |
|---|---|---|
| 2 Understand | `toggle-and-observe`, `drag-match` | Makes a mechanism or a category boundary visible |
| 3 Apply | `scenario-mcq`, `drag-match` | Forces a judgment with consequences |
| 4 Analyze | `highlight-mistake`, `scenario-mcq` | Requires taking a real artifact apart |

Vary across a module — Module 1 used five widget types across five lessons, which is
the target, not a coincidence. `drag-match` must be strictly 1:1 (items = targets =
mappings = distinct values), which is a platform invariant.

---

## 11. Checkpoint conventions

- **Three items, ascending, starting at `2_understand`.** This scheme declares **zero
  Remember-level tasks**; a `1_remember` checkpoint item contradicts the published
  cognitive profile even though checkpoints are formative.
- **The top item reaches at least the parent task's declared level, and never exceeds
  the scheme's ceiling of 4 (Analyze).** A lesson on a `4_analyze` task closes at
  Analyze (01-05); one on a `3_apply` task closes at Apply.
  **An `2_understand` task may close its checkpoint at Apply.** Checkpoints are
  formative, do not pass through `trg_item_bloom_matches_task`, and a flat
  three-Understand checkpoint has no difficulty progression at all. 01-01 and 02-03
  both do this and both are correct. What must not happen is the reverse - a lesson
  implying the *examination* tests above the task's declared level.
- **Distractors are positions a real practitioner holds.** The final-call fallacy, "we
  excluded protected characteristics," "the scores are unreliable so ignore them."
  Every wrong answer in Module 1 is something someone has actually said in a meeting.
- **Explanations teach every distractor**, naming what is right about the tempting
  wrong answer and where it fails.

---

## 12. Pre-submit checklist (in addition to the platform checklist)

1. Domain 2 lesson carries `verified_as_of` and terminates at escalation (§1, §5).
2. No statute in any title, heading, or task statement (§5).
3. Pending law labelled pending (§5).
4. The lesson hands over exactly one portable test, present in body and summary (§3).
5. Judgment calls name which error is expensive (§4).
6. Forward references are one clause (§6).
7. Candidates written as rights-holders, not volume (§7).
8. Both overclaim and dismissal refused (§8).
9. Domain 3: no Certidemy, no real credentials, no type ranked superior (§9).
10. Widget matches the task's cognitive level and varies within the module (§10).
11. Checkpoint starts at Understand, tops out at the parent task's level (§11).

---

*Derived from Module 1 (lessons 01-01 through 01-05), locked 26 July 2026. Companion to
`LESSON_AUTHORING_SPEC.md`, `LESSON_STYLE_GUIDE.md` v1.0, `SCHEME-AIHR-I.md`, and
`AIHR-I-LATAM-REGULATORY-RECORD.md`.*
