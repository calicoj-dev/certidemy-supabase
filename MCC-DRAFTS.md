# MCC drafts — ISMS-IA and AIMS-IA

**DRAFTS, revision 2. For reaction. Not adopted, not referenced by any scheme
document yet.** Written to the shape the SM-AI-II split set: a **candidate
description** that is publishable, and an **item-construction mapping** that is
not and would live in `scripts/lib/item-grounding.mjs`.

Revision 2 applies three accepted corrections — bidirectional modality as the
unifying competence, clause attribution as its own named mode, and NC/observation/OFI
kept as the surface rather than the gap — and cuts the AI mode that had no items
behind it.

---

## The AI question, answered from the banks

**I asked whether the AI competence belongs anywhere. The evidence overturns both
my original mode and your lean, in different directions.**

**Your lean — no mode, one sentence — is right for AI AS SETTING.** In AIMS-IA,
**71 of the 93** distractors that mention AI also cite a clause: the AI is what
the scenario is about and the error is modality or attribution. Woven, exactly as
you said. A separate "AI in the estate" mode would have no items behind it, which
is why cutting mine was correct — it was the only mode I wrote from reasoning
rather than from evidence, and a panel would have found it unratable.

**But there is an AI competence with items behind it, and it is not the one
either of us named: THE AUDITOR'S OWN USE OF AI IN CONDUCTING THE AUDIT.**

| | items | auditor's own AI use | shadow / undeclared AI |
|---|---:|---:|---:|
| ISMS-IA | 304 | **11** | 6 |
| AIMS-IA | 320 | **9** | 0 |

ISMS-IA 5.4 is the clearest:

> *"The draft is adequate: the auditor's personal review of each selected entry
> makes human judgement the operative step; the AI ranking…"*
> *"…audit-conduct standards already require complete and accurate records, so any
> AI involvement is automatically…"*

That is not a modality error and no clause reaches it. **ISO 19011:2018 predates
the question**, so the candidate has no standard to fall back on — which is
precisely the condition that makes a borderline candidate reach for habit, and
precisely what an MCC is for.

**So: one AI mode, in BOTH drafts, and it is about the auditor rather than the
auditee.** The 6 shadow-AI items in ISMS-IA are ordinary scope errors wearing AI
clothes — a tool absent from the asset register treated as out of scope — and
they belong under attribution, not under a mode of their own.

---

# DRAFT A — ISMS-IA

## Publishable: the candidate

**The candidate is a practising internal auditor, not a beginner.** Three to six
audits, at least one as lead, in an organisation whose management system predated
them. They know ISO 19011's process, can plan an audit, write a finding in a
defensible structure, and would pass a Foundation examination comfortably.

**At least one of those audits was performative**, and they have not yet drawn the
right conclusion from it: findings written to be closable, nonconformities
downgraded in the closing meeting, an auditee who had clearly seen the checklist.
They recognise that audit as unsatisfying. They do not yet recognise it as a
description of how they themselves audit under time pressure.

**What makes them borderline is one competence: THEY DO NOT RELIABLY READ THE
MODALITY OF A REQUIREMENT.** *Shall*, *should*, and *the organisation wrote it
down* are three different kinds of obligation, and they treat them as points on a
single scale of strictness. Everything below follows from that.

**It fails in BOTH directions, and that is the point.** Under-read, a *shall*
becomes negotiable because the auditee has a reason, and a procedure that exists
and was followed becomes conformity without anyone asking whether the procedure
satisfies the clause. Over-read, a *should* becomes binding because the practice
seems obviously right, and a departure becomes a nonconformity that will not
survive review. **The failure is not leniency and it is not strictness. It is
that the strength of the obligation is read from how the situation feels rather
than from the text.**

A procedure is *is*. A clause is *shall*. Guidance is *should*. Conflating them is
a modality error before it is anything else.

**What they reliably get right:** the audit process and its sequence; planning and
sampling; the structure of a written finding; the difference between auditing a
process and auditing a document; and reciting the definitions of nonconformity,
observation and opportunity for improvement.

**What they get wrong:**

- **MODALITY — they read obligation from plausibility.** A practice that seems
  right becomes required; a requirement with a good excuse becomes advisory.
  Both directions, in the same auditor, on the same day.
- **CONFORMITY WITH THE PROCEDURE, NOT WITH THE CLAUSE.** A procedure exists, it
  was followed, they write conformity — without asking whether the procedure
  satisfies what the clause requires. This is the modality failure at its most
  common: treating *is* as *shall*.
- **CLAUSE ATTRIBUTION — they cite the wrong clause, the wrong sub-item, or
  several at once** because more than one seems to touch the subject. The finding
  may be real; the citation will not survive review. **This is the symptom that
  shows first, and the modality error is usually underneath it.**
- **GRADING FOLLOWS FEEL.** They can recite nonconformity, observation and
  opportunity for improvement and still mis-grade, because the grade follows from
  a judgement about obligation they have not made yet. The category is the
  surface the gap appears on, not the gap.
- **They require harm before they will write a nonconformity.** Absent a
  disruption or a loss, an unmet requirement reads to them as an observation.
- **They put the remedy in the finding.** "The organisation must disable the
  accounts and automate deprovisioning" — prescribing a fix rather than stating
  the gap, which takes the correction out of the auditee's hands.
- **They assert cause from evidence.** "This shows the team misunderstood the
  procedure." The evidence establishes what happened, not why.
- **They over-correct under challenge.** Pushed, they retreat to the strictest
  available reading — no verbal evidence is admissible, no delegation is
  permitted — which is the same modality failure inverted, and much harder for an
  auditee to argue with.
- **THEIR OWN USE OF AI IS UNEXAMINED.** Where an AI tool ranked, triaged or
  summarised something in the course of the audit, they treat their personal
  review of the output as making the tool's involvement immaterial. ISO 19011
  does not address it, so they fall back on habit: the work feels reviewed,
  therefore the evidence is theirs.

**What the auditor one level further on does differently:**

- Reads the modality before reading the situation, and says in the finding which
  it is: *shall*, *should*, or *the organisation's own choice*.
- Reads the clause before the procedure, and asks what the clause requires before
  asking whether the procedure was followed.
- Cites one clause — the one whose requirement is unmet — and can say in a
  sentence why the others do not apply.
- Grades from the obligation, not from the severity of what happened.
- Writes a nonconformity for an unmet requirement whether or not anything went
  wrong.
- States the gap and stops, leaving correction and cause to the auditee.
- Says what the evidence establishes and, separately, what it does not.
- Holds the same reading under challenge instead of retreating to strictness.
- Treats their own tooling as part of the evidence chain: what it selected, what
  it excluded, and what remains demonstrable without it.

## Not publishable: the mapping

*Would live in `item-grounding.mjs`, not in the scheme.*

> The second-best option is what this candidate would choose — a finding that is
> defensible, correctly structured, and wrong on the modality, the clause, or the
> question of whether the procedure satisfies the requirement. The best is what
> the auditor one level on would choose and beats it for a reason statable in one
> sentence. Build distractors from the nine failure modes and never from what
> they reliably get right, which produces Foundation items wearing an audit
> scenario.
>
> **ROUGHLY HALF THE SECOND-BEST OPTIONS MUST BE OVER-STRICT, NOT LENIENT.** The
> competence is bidirectional; a bank built only on under-calling tests half of
> it and trains candidates to pick the strictest option.

---

# DRAFT B — AIMS-IA

Same candidate shape. **Everything in Draft A applies**; what follows is what
ISO/IEC 42001 changes.

## Publishable: the candidate

**Same experience band**, with one addition: their audit experience is in ISO/IEC
27001 or another Annex SL standard, and **42001 is the first management system
they have audited whose subject is not fully under the organisation's control.**

**42001 makes the modality failure sharper than 27001 can**, because its annexes
are not shaped the way theirs were. In 27001, implementation guidance lives in a
separate standard and carries no normative status. **In 42001, Annex A and Annex B
are both normative — and Annex B is written in *should*.** An auditor who learned
their annexes on 27001 arrives with a rule that does not hold, and the rule fails
in the over-calling direction: *normative, therefore binding.*

**That is the cleanest example of the whole competence.** The premise is true —
Annex B is normative. The conclusion is wrong — it still says *should*. Normative
STATUS and requirement MODALITY are different properties, and an auditor who
collapses them writes a nonconformity against a recommendation and defends it
convincingly.

**What they get wrong — in addition to Draft A's nine:**

- **They convert Annex B's normative status into binding obligation.** Normative,
  therefore *shall*. A nonconformity against a recommendation, with a true premise
  under it.
- **They discount Annex B entirely** — the same error inverted: guidance,
  therefore not auditable. It is not optional reading and they treat it as such.
- **They treat the AI system as the audit subject.** The subject is the management
  system; the AI system is what it governs. This produces findings about model
  behaviour where the requirement was about a documented decision.
- **They accept an AI impact assessment as a risk assessment, or the reverse.**
  42001 requires both; they are different artifacts with different triggers.
- **They audit third-party AI as if provenance were unauditable.** A supplied
  model still has documented information, a supplier relationship, and a
  documented decision about its use.

**What the auditor one level further on does differently:**

- Separates normative STATUS from requirement MODALITY, and writes a finding
  against Annex B as what it is rather than as what its status suggests.
- Audits the management system's decisions about the AI system, not the AI system.
- Keeps the impact assessment and the risk assessment distinct, and knows which
  clause calls for which.
- Treats a third-party model as a supplier question with evidence, not a black box
  that excuses its absence.

## Not publishable: the mapping

> As Draft A, including the over-strict proportion. Additionally: **Annex B is the
> richest source of defensible second-best options in this bank**, because the
> true premise makes the wrong conclusion genuinely attractive. Do not overuse it
> — it is one instance of the modality failure, not the certification.

---

## What is still open

1. **Draft A now has nine modes.** Modality and procedure-vs-clause are arguably
   one mode stated twice — the second is the first's commonest form. I kept them
   separate because the banks show the procedure case far more often than any
   other, and a panel rating items needs to see it named. **Say if you want them
   merged.**
2. **Draft B assumes a 27001 background.** If AIMS-IA candidates are expected to
   arrive without one, its central distinction weakens and I would rebuild it on
   *"first audit of a system the organisation does not fully control"* instead.
3. **The auditor's-own-AI mode has 20 items across the two banks and no clause
   behind it.** That makes it the one mode where the best answer rests on
   professional judgement rather than on a text — which is defensible for a
   Level II credential, and worth knowing before a panel rates those 20.
