# MCC drafts — ISMS-IA and AIMS-IA

**DRAFTS, for reaction. Not adopted, not referenced by any scheme document yet.**
Written 2026-09-12 against the shape set by the SM-AI-II split: a **candidate
description** that is publishable, and an **item-construction mapping** that is
not and would live in `scripts/lib/item-grounding.mjs`.

Drafted from the secure item banks first and your positions second, because the
distractors already encode what a borderline auditor gets wrong and that is
harder evidence than either of us reasoning about it.

---

## Where the banks disagree with you

Three places. Your two substantive positions both survive; the shape around them
does not.

### 1. Nonconformity / observation / OFI is NOT retired as a discriminator

You said it is "taught and mostly learned". The banks still use it as a live
discriminator, and not as a giveaway. ISMS-IA 4.6 offers:

> *"An **observation rather than a nonconformity**, because clause 8.1 is
> satisfied once documented policies and procedures exist…"*

That distractor is doing two jobs at once — the grading question **and** your
distinction — and it is the second that makes it attractive. So the category
question is not the competence gap, but it is still the **surface** the gap
appears on. An MCC that says "they know the categories" would make a reader
discard exactly the distractor that catches them.

**Recommendation:** keep your position, change its wording. Not *"they can tell
the three apart"* but *"they can recite the three and still mis-grade, because
the grading follows from a judgement they have not made yet."*

### 2. The most frequent distractor shape is clause attribution, not your distinction

Across both banks the single most common wrong answer is **citing the wrong
clause, the wrong sub-item, or several clauses where one applies**:

- ISMS-IA 5.3: *"breaching **both** clause 6.1.2 and Annex A 5.18, as both
  address the user access lifecycle"*
- ISMS-IA 4.6: three distractors, three different clauses (8.1, 6.1.2, 9.1)
- AIMS-IA 4.5: three different sub-items of one clause (6.1.3 b, d, f)

Your distinction is present and real — it is the *reason* a wrong clause gets
cited — but a draft built only on it would under-describe the bank. **Clause
attribution deserves to be its own named failure mode**, not left implicit.

### 3. The borderline auditor errs in BOTH directions, and your framing is one-directional

Your positions describe under-calling: finds a procedure, finds it followed,
writes conformity. The banks are full of the **opposite**:

- ISMS-IA 3.1: *"must be **discarded entirely** because ISO 19011 requires
  auditors to proceed only on documented records"*
- AIMS-IA 4.3: *"clause 5.1 requires top management to **personally perform each
  listed activity** and permits no delegation"*
- AIMS-IA 5.4: *"its normative status **converts 'should' into binding
  obligations equivalent to 'shall'**"*

That last one is your Annex B case — and note it is an **over**-call, not an
under-call. The borderline auditor writes a nonconformity against a
recommendation because they read normative status as binding.

**This is the most consequential correction.** A one-directional MCC would make
every over-strict distractor unwritable, and the banks say over-strictness is at
least as common as leniency. The unifying competence is not caution — it is
**reading the modality of a requirement correctly**: shall, should, and what the
organisation merely wrote down.

### What the banks confirm

- **Your distinction, exactly.** ISMS-IA 4.6: *"clause 8.1 is satisfied once
  documented policies and procedures exist"*. AIMS-IA 4.3: *"clause 5.1 is
  satisfied when a named representative is accountable"*. Existence treated as
  satisfaction, in both certs.
- **Your Annex B sharpening, verbatim.** AIMS-IA 5.4 carries two distractors
  turning on Annex B's normative status, one converting *should* to *shall* and
  one claiming clause 6.1.3 e) requires adopting Annex B as written.
- **AI is woven, not separable.** Neither bank has an AI-only task. AIMS-IA's
  AI content sits inside clause-conformity questions.

---

# DRAFT A — ISMS-IA

## Publishable: the candidate

**The candidate is a practising internal auditor, not a beginner.** Three to six
audits, at least one as lead, in an organisation whose management system
predated them. They know ISO 19011's process, can plan an audit, write a finding
in a defensible structure, and would pass a Foundation examination comfortably.

**At least one of those audits was performative**, and they have not yet drawn
the right conclusion from it: findings written to be closable, nonconformities
downgraded in the closing meeting, an auditee who had clearly seen the checklist.
They recognise that audit as unsatisfying. They do not yet recognise it as a
description of how they themselves audit under time pressure.

**What makes them borderline is a single reading failure with two faces.** They
do not reliably separate **what the standard requires** from **what the
organisation wrote down**, and they do not reliably read the **modality** of a
requirement — *shall*, *should*, and *the procedure says so*. Both faces produce
defensible-sounding findings. Under-read, they write conformity because a
procedure exists and was followed. Over-read, they write a nonconformity against
a recommendation, or against a clause that does not say what they think it says.

**What they reliably get right:** the audit process and its sequence; planning
and sampling; the structure of a written finding; the difference between an
audit of a process and an audit of a document; and reciting the definitions of
nonconformity, observation and opportunity for improvement.

**What they get wrong:**

- **They treat the existence of documentation as satisfaction of the clause.**
  A procedure exists, it was followed, they write conformity — without asking
  whether the procedure satisfies what the clause requires.
- **They attribute a finding to the wrong clause**, to a sub-item of the right
  clause, or to several clauses at once because more than one seems to touch the
  subject. The finding may be real; the citation will not survive review.
- **They read modality inconsistently.** A *should* becomes binding when the
  practice seems obviously right; a *shall* becomes negotiable when the auditee
  has a reason.
- **They require harm before they will write a nonconformity.** Absent a
  disruption or a loss, a departure from the standard reads to them as an
  observation.
- **They put the remedy in the finding.** "The organisation must disable the
  accounts and automate deprovisioning" — prescribing a fix rather than stating
  the gap, which takes the correction out of the auditee's hands.
- **They assert cause from evidence.** "This shows the team misunderstood the
  procedure." The evidence establishes what happened, not why.
- **They over-correct under scrutiny.** Challenged, they retreat to the
  strictest possible reading — no verbal evidence is admissible, no delegation is
  permitted — which is as wrong as the leniency it replaces and much harder for
  an auditee to argue with.
- **They lose the thread when AI is in the estate.** An AI system in scope is
  treated as a technology question rather than as an information asset with
  owners, controls and evidence like any other.

**What the auditor one level further on does differently:**

- Reads the clause before reading the procedure, and asks what the clause
  requires before asking whether the procedure was followed.
- Cites one clause, the one whose requirement is unmet, and can say in a sentence
  why the others do not apply.
- Distinguishes *shall* from *should* from *the organisation chose to*, and says
  which is which in the finding.
- Writes a nonconformity for an unmet requirement whether or not anything went
  wrong.
- States the gap and stops, leaving the correction and its cause to the auditee.
- Says what the evidence establishes, and separately what it does not.
- Holds the same reading under challenge rather than retreating to strictness.

## Not publishable: the mapping

*Would live in `item-grounding.mjs`, not in the scheme.*

> The second-best option is what this candidate would choose — a finding that is
> defensible, correctly structured, and wrong on the clause, the modality, or the
> question of whether the procedure satisfies the requirement. The best option is
> what the auditor one level on would choose, and beats it for a reason statable
> in one sentence. Build distractors from the eight failure modes and never from
> what they reliably get right, which produces Foundation items wearing an audit
> scenario. Because this candidate errs in both directions, roughly half the
> second-best options should be OVER-strict, not lenient.

---

# DRAFT B — AIMS-IA

Same candidate shape. **Everything in Draft A applies**; what follows is what
ISO/IEC 42001 changes.

## Publishable: the candidate

**Same experience band**, with one addition: their audit experience is in ISO/IEC
27001 or another Annex SL standard, and **42001 is the first management system
they have audited whose subject is not under the organisation's full control.**

**The distinction that makes them borderline is sharper here, because 42001's
annexes are not shaped like 27001's.** In 27001 implementation guidance lives in
a separate standard and carries no normative status. **In 42001, Annex A and
Annex B are both normative** — and Annex B is written in *should*. An auditor who
learned their annexes on 27001 arrives with a rule that does not hold.

**What they get wrong — in addition to Draft A's eight:**

- **They convert Annex B's normative status into binding obligation.** It is
  normative, therefore it is *shall*. They write a nonconformity against a
  recommendation, and it reads well because the premise is true.
- **They discount Annex B entirely**, the same error inverted — guidance, so not
  auditable — and miss that it is not optional reading.
- **They treat the AI system as the audit subject.** The subject is the
  management system; the AI system is what it governs. This produces findings
  about model behaviour where the requirement was about a documented decision.
- **They accept an AI impact assessment as a risk assessment, or the reverse.**
  42001 requires both and they are different artifacts with different triggers.
- **They audit third-party AI as if provenance were unauditable.** A supplied
  model still has documented information, a supplier relationship, and a
  decision about its use.

**What the auditor one level further on does differently:**

- Separates normative STATUS from requirement MODALITY: Annex B is not optional
  reading and still says *should*, and a finding against it must be written as
  what it is.
- Audits the management system's decisions about the AI system, not the AI
  system.
- Keeps the impact assessment and the risk assessment distinct, and knows which
  clause calls for which.
- Treats a third-party model as a supplier question with evidence, not as a
  black box that excuses the absence of it.

## Not publishable: the mapping

> As Draft A. Additionally: Annex B items are the richest source of defensible
> second-best options in this bank, because the true premise (Annex B is
> normative) makes the wrong conclusion (therefore binding) genuinely
> attractive. Do not overuse it — it is one failure mode, not the cert.

---

## What I still need from you

1. **Draft A's eight failure modes are six of mine and two of yours.** Tell me
   which to cut. My instinct is that "loses the thread when AI is in the estate"
   is the weakest — the banks weave AI in rather than making it a failure mode,
   so it may not earn its place.
2. **The both-directions correction changes the standard-setting conversation**,
   not just the text: a panel rating items against a one-directional MCC would
   rate over-strict distractors as implausible. Worth confirming you agree before
   this goes near a panel.
3. **Draft B assumes a 27001 background.** If AIMS-IA candidates are expected to
   arrive without one, its central distinction weakens and I would rebuild it on
   "first audit of a system the organisation does not fully control" instead.
