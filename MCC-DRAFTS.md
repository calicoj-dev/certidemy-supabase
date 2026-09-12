# MCC drafts — ISMS-IA and AIMS-IA

**DRAFTS, revision 4. For reaction. Not adopted, not referenced by any scheme
document yet — and deliberately so: they need what SM-AI-II's needed, which is a
practising auditor reading them and saying whether that person is recognisable.
See "Adopting these" at the foot.** Written to the shape the SM-AI-II split set: a **candidate
description** that is publishable, and an **item-construction mapping** that is
not and would live in `scripts/lib/item-grounding.mjs`.

**Revision 2** applied three accepted corrections — bidirectional modality as the
unifying competence, clause attribution as its own named mode, and NC/observation/OFI
kept as the surface rather than the gap — and cut the AI mode that had no items
behind it.

**Revision 3** rebuilt Draft B frame off any prior standard, added a panel briefing
note, and wrote down what adopting these would touch.

**Revision 4** follows an external review. It corrects the ISO 19011 edition and
the panel note built on it, drops the claim that one competence explains
everything, removes a slogan that collapsed the third kind of obligation, and
names the organisational pressure behind the harm-before-nonconformity mode.

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

That is not a modality error, and **the claim I first made about it was wrong.**

I wrote that ISO 19011:2018 predates the question and no standard reaches it.
**These schemes are built on ISO 19011:2026**, and it does reach the question.
Verified against the corpus: AIMS-IA cites 19011:2026 in 384 items and 25
lessons with zero references to 2018, and clause **7.2.3** — auditor competence —
is cited across the bank and described there as *"guidance the organization uses
to define its own competence criteria for auditors"*. Per the source, 7.2.3's
competence list includes understanding the appropriateness and consequences of
using emerging technology to conduct audits, naming AI-based evaluation tools.
*(The edition and the clause are confirmed from our own corpus; that specific
bullet's wording is taken from a reading of the standard, which this repository
does not quote.)*

**So the mode stands and the reason changes. 19011:2026 CONSTRAINS WITHOUT
DETERMINING.** It is guidance, it says *should*, and it does not say at what
point a reviewed AI ranking becomes the auditor's own evidence. A candidate has
something to reason from and not enough to be told the answer — **which is the
Level II band exactly, and a better argument than a vacuum.**

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

**What makes them borderline is not one thing, and a definition that claims it is
one thing will not survive a reader who audits.** The largest share of it is how
they read the STRENGTH of an obligation: a requirement in the standard, a
recommendation in the standard, and a commitment the organisation made in its own
documented process are three different kinds of obligation with three different
consequences, and this candidate treats them as points on a single scale of
strictness. **That failure runs in both directions** — a *shall* becomes
negotiable when the auditee has a reason, a *should* becomes binding when the
practice seems obviously right — and it is the single most common thing under a
finding that does not survive review.

**But some of what makes them borderline is craft, and some of it is politics.**
Putting the remedy in the finding, asserting cause from evidence, and needing
something to have gone wrong before writing a nonconformity are not misreadings
of a text. They are habits formed by what it costs to raise a finding in an
organisation you work for. **The modes below are named separately because they
fail separately**, and a panel rates items one at a time.

**On the third kind of obligation.** A documented procedure the organisation
adopted is not weaker than a clause — for that organisation it is binding, and
departing from it is a nonconformity in its own right. The error is not that the
candidate treats the procedure as obligatory. It is that they stop there, and
never ask the prior question: does the procedure, followed exactly as written,
satisfy what the clause requires?

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
- **They require harm before they will write a nonconformity, and the reason is
  organisational rather than technical.** A nonconformity creates
  corrective-action work for colleagues they will still be working beside next
  month, and the closing meeting is a negotiation in which the auditee has more
  at stake than they do. So absent a disruption or a loss, an unmet requirement
  becomes an observation — not because they misread the clause, but because the
  grade that costs nobody anything is available and defensible. **This is the
  mode a room full of internal auditors will name first**, and a definition that
  omits it reads as written by someone who has only done second-party work.
- **They put the remedy in the finding.** "The organisation must disable the
  accounts and automate deprovisioning" — prescribing a fix rather than stating
  the gap, which takes the correction out of the auditee's hands.
- **They assert cause from evidence.** "This shows the team misunderstood the
  procedure." The evidence establishes what happened, not why.
- **They over-correct under challenge.** Pushed, they retreat to the strictest
  available reading — no verbal evidence is admissible, no delegation is
  permitted. **Sometimes that is the modality failure inverted. Sometimes it is
  cover**: the finding is one they cannot defend on its merits, and an
  unarguable-sounding absolute is easier than withdrawing it. The two look
  identical from outside and are different failures, which is why this is its own
  mode rather than a footnote to the first.
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
>
> **FLAG FOR THE PANEL: the auditor's-own-AI items have no standard behind them.**
> 11 items in ISMS-IA, 9 in AIMS-IA. Every other mode can be rated by reading a
> clause; this one cannot, because ISO 19011:2018 predates the question. Judges
> must be told this BEFORE round one, not discover it during rating — it is where
> disagreement will concentrate, and unbriefed disagreement on a known-hard set
> reads as an unreliable panel rather than as a hard set.

---

# DRAFT B — AIMS-IA

Same candidate shape. **Everything in Draft A applies**; what follows is what
ISO/IEC 42001 changes.

## Publishable: the candidate

**Same experience band. The frame is not a prior standard — it is the subject.**

**42001 is the first management system this candidate has audited whose subject
is not fully under the organisation's control.** Everything they have audited
before behaved: a process does what the procedure says, or the gap between them
IS the finding. An AI system does not behave that way. It was trained on data the
organisation did not create, it is supplied by a third party as often as not, its
output varies, and it changes without anyone editing a document.

**Their habit is to audit the thing.** It has served them everywhere else,
because everywhere else the thing and the management of the thing were close
enough to audit together. Here they come apart, and the candidate audits the AI
system when the requirement was about a documented decision concerning it.

**This frame does not assume a 27001 background**, deliberately. Some of this
intake will have one and some will not, and a central distinction that holds for
half an intake is not a central distinction. What follows applies either way; the
Annex B mode below happens to bite hardest on those who learned their annexes
elsewhere, but it is a mode, not the frame.

**What they get wrong — in addition to Draft A's nine:**

- **They convert Annex B's normative status into binding obligation.** Normative,
  therefore *shall*. A nonconformity against a recommendation, with a true premise
  under it — **the cleanest instance of the modality failure anywhere in either
  certification**, because the premise is correct and only the inference is wrong.
  In 42001, Annex A and Annex B are both normative and Annex B is written in
  *should*; normative STATUS and requirement MODALITY are different properties.
  **ANNEX B IS NORMATIVE. Do not let a later edit "correct" this to informative**
  — it has been checked against the ISO contents page and the UNE adoption, and
  it is counter-intuitive to anyone reasoning from 27001, which is exactly why it
  is the sharpest item source in the bank and exactly why it will keep getting
  challenged.
  This bites hardest on an auditor who learned annexes on 27001, where
  implementation guidance sits in a separate standard and carries no normative
  status at all — but it catches auditors without that background too, because
  "normative" reads as "binding" to anyone who has not been shown otherwise.
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

> As Draft A, including the over-strict proportion AND the panel flag on the
> auditor's-own-AI items (9 here). Additionally: **Annex B is the richest source
> of defensible second-best options in this bank**, because the true premise makes
> the wrong conclusion genuinely attractive. Do not overuse it — it is one
> instance of the modality failure, not the certification.

---

## Decisions taken on revision 3

1. **Modality and conformity-with-the-procedure stay SEPARATE modes**, though the
   second derives from the first. A mode appearing in more items than any other
   should be named, not folded into the mode it derives from — a panel rates
   items, and the commonest shape in the bank must be visible to them by name.
2. **Draft B's frame is the subject, not a prior standard.** A central distinction
   that holds for half an intake is not a central distinction.
3. **The auditor's-own-AI items are flagged to the panel rather than changed.**
   See below.

---

## Panel briefing note

**Hand this to judges with the definition and the items, before round one.**
There is no separate panel artifact today; the definition IS what a panel is
given, so the note travels with it.

**One item set is constrained by guidance rather than determined by a
requirement.** The auditor's-own-AI mode — 11 items in ISMS-IA, 9 in AIMS-IA —
asks what an auditor may rely on when an AI tool ranked, triaged or summarised
something during the audit.

**Point judges at ISO 19011:2026 clause 7.2.3**, which places understanding the
appropriateness and consequences of using emerging technology to conduct audits,
including AI-based evaluation tools, inside auditor competence. **Then point them
at the evidence principles**, which is where the rating actually happens:

- the **degree of verification** the auditor performed on what the tool produced,
  and whether that verification was of the output or of the method; and
- **what remains demonstrable without the tool** — whether the conclusion still
  stands on evidence the auditor can show, or only on the tool having ranked it.

**7.2.3 constrains without determining.** It is guidance, it says *should*, and
it does not say at what point a reviewed ranking becomes the auditor's own
evidence. That is the whole Level II band: enough to reason from, not enough to
be told. **Judges should expect more spread here than elsewhere and should not
read that spread as a defective panel** — the question is genuinely open in the
standard, which is why the items exist.

**AN EARLIER DRAFT OF THIS NOTE SAID THESE ITEMS HAD "NO STANDARD BEHIND THEM"
AND CITED ISO 19011:2018.** Both were wrong. The schemes are built on 19011:2026
— 384 AIMS-IA items and 25 lessons cite it, none cite 2018 — and 7.2.3 reaches
the question directly. A practising auditor would have falsified that note in
five minutes, and it would have cost the panel's confidence in everything
alongside it. The corrected version is also the better argument.

---

## Adopting these, when the time comes

**Not yet.** These need what SM-AI-II's definition needed: a practising internal
auditor reading them and saying whether that person is recognisable. Everything
here is derived from item banks and two people reasoning; nobody who audits for a
living has looked at it.

When that has happened, adoption touches five things per certification:

1. **`SCHEME-ISMS-IA.md` / `SCHEME-AIMS-IA.md`** — a new §7.1 "The minimally
   competent candidate, defined", carrying the **publishable half only**. Both
   schemes already reference a minimally competent candidate in §7 to justify the
   75% pass mark, without defining one; those sentences become forward references
   rather than loose ends.
2. **`scripts/lib/item-grounding.mjs`** — the mapping half, as new constants
   beside `SCRUM_L2_JUDGMENT`. **They do not route automatically.**
   `groundingFor()` reaches `SCRUM_L2` through `/scrum/` AND `tier >= 2`;
   both auditor certs match `/auditor|internal audit/` FIRST and return
   `AUDIT_27001` / `AUDIT_42001` regardless of tier. **Adoption therefore requires
   a routing change, and that is the step most likely to be missed** — adding the
   constants without it is a no-op that looks done, which is exactly what
   happened with `item_origin` and the RPC's fixed column list.
3. **The BoKs** — `jta/ISMS-IA_BoK_v1.md` and AIMS-IA's equivalent, each gaining
   the §6.3-style pointer SM-AI-II's BoK carries, so the BoK names the definition
   rather than restating it.
4. **The split discipline** — whatever is copied into the scheme must be the
   candidate description only. SM-AI-II's blockquote explains why and should be
   mirrored: the cut is a DELETION of the mapping sentences, never a summary,
   because a summary carries the mapping through in compressed form.
5. **Regeneration is NOT required.** Both banks already exist and were written
   without these definitions. Adopting an MCC does not invalidate items; it states
   what the items were already doing, which the bank evidence in this document
   demonstrates. **If adoption is ever used to justify regenerating a bank, that
   is a different decision and needs its own argument.**

**Order:** scheme first, routing second, BoK third. The routing change is the only
one with a silent failure mode.
