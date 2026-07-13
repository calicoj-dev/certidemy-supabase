# Certidemy Cognitive Model

**Version:** 2.0
**Status:** Normative. Binding on every certification scheme, JTA, item bank, and
examination form Certidemy produces.
**Applies to:** SM-AI-I, SPO-AI-I, SD-AI-I, AIGRM-I, AIE-I, and every certification
created hereafter.
**Owner:** Certification body (CertiGlobal / Certidemy)

> **Citation note.** This document states the *substance* of what ISO/IEC 17024:2012
> requires. Clause numbers referenced below should be verified against the purchased
> standard text before any of this language is used in an external accreditation
> submission. The substance is not in doubt; the paragraph numbering must be checked
> by someone reading the standard itself.

---

## 1. Why this document exists

Every certification body claims its exam "measures competence." ISO/IEC 17024 exists
to make that claim checkable. Its core demand, stated plainly:

> **The examination must measure the competence the job-task analysis declares —
> all of it, and nothing else.**

That sentence contains two failure modes, and psychometrics has names for both
(Messick, 1989, on construct validity):

| Failure | What it means | How it shows up here |
|---|---|---|
| **Construct-irrelevant variance** | The exam measures something it never declared. | A task declared at *Understand* is tested with an *Analyze* item. The candidate fails on a competence the credential never claimed to require. |
| **Construct under-representation** | The exam fails to measure something it did declare. | A task declared at *Apply* is tested only with *Remember* items. The candidate is certified as able to *apply* X, having only demonstrated they can *recall* X. |

**Both are validity failures. Both are auditor findings.** One is not the safe
direction. This is the point that has to be internalized, because the intuition that
"easier is safer" is exactly backwards: an exam that under-tests is as invalid as one
that over-tests, and it is the one that gets a certification body sued when a
credential-holder cannot do the job.

Certidemy's JTAs did the hard part correctly: **all 204 tasks across five certifications
carry a declared Bloom level**, assigned individually, with KSAs. That is the
foundation. This document defines how that foundation binds everything downstream — and
records the defect that made it necessary.

---

## 2. What went wrong (recorded, because it must not recur)

Four of the five JTAs contain a section titled **"Bloom's Taxonomy distribution (MCQ
target)"** — a free-standing table asserting a percentage mix of items across Bloom
levels. For example, SM-AI-I: *15% Remember / 35% Understand / 35% Apply / 15% Analyze.*

That table originated in `SMPC_JTA_v2.md` (May 2026), written when Certidemy was an
**exam-prep product for CertiProf's SMPC**. There, the table was a marketing claim about
our *practice* material: *"By placing 50% of questions at Apply/Analyze, learners
over-prepare for the actual exam. Train to a higher standard than the test."* For a prep
product aimed at someone else's exam, that was a perfectly reasonable thing to say.

It was then inherited, by template, into the JTAs of certifications **we ourselves
issue** — where it is not a marketing claim but a **second, competing declaration of
cognitive level**, sitting alongside the per-task Bloom declarations, with nothing
reconciling the two.

They do not reconcile. Measured against the actual task rows:

- **SPO-AI-I's table demands 15% Analyze items.** Only **11.5%** of its exam weight sits
  on tasks declared at Analyze. **The document asks for something arithmetically
  impossible.** No generator could ever satisfy it.
- **AIE-I's table demands 44% Remember items.** **Zero** of its 16 tasks are declared at
  Remember. Acting on that table, we set AIE-I's `exam_blueprint` to 44% Remember and
  regenerated its entire secure bank against it — producing 35 items that test *below*
  their tasks' declared level. **Textbook construct under-representation, introduced by
  trusting the summary table over the task rows.**

Meanwhile the item generator never read the tasks table at all — it derived item Bloom
from a hardcoded difficulty curve — so the declared levels were ignored in the one place
they mattered most. Measured consequence, items testing **above** their task's declared
level: **AIGRM-I 58.9%, SM-AI-I 35.5%, SPO-AI-I 34.4%, SD-AI-I 24.7%.**

**AIGRM-I's JTA (the newest, July 2026) is the only one that got this right.** It has no
target table. It states:

> *"Result — Bloom across 49 tasks: 31× understand, 13× apply, 5× analyze"*

**A result.** Computed from the tasks, not asserted over them. That is the correct form,
and it is now the rule.

---

## 3. The model

### Rule 1 — The task's declared Bloom level is the single cognitive declaration

Every task in a JTA declares exactly one Bloom level in `tasks.bloom_level`. It is
assigned when the task is written, from the task's own verb and KSAs — *define* and
*list* are Remember; *explain* and *distinguish* are Understand; *apply* and *determine*
are Apply; *diagnose* and *analyze* are Analyze.

**This is the only place cognitive level is declared anywhere in the system.** No other
document, table, or configuration may assert a competing one.

### Rule 2 — An item's cognitive level equals its task's cognitive level

> **item.bloom_level == task.bloom_level**

Not "at most." Not "around." **Equal.**

This is the rule used by ISTQB — the closest accredited analogue to what Certidemy is
building — where every learning objective carries a K-level and every question must be
written at the K-level of the objective it assesses. It follows directly from §1: an
item above the task's level introduces construct-irrelevant variance; an item below it
under-represents the construct. Only equality measures the declared competence.

**A task's K (knowledge) component is not a licence to test below its level.** Task 2.6
of SM-AI-I is *"Apply 'self-managing' to a described team scenario"* (Apply). Its K
component is *"the 2020 shift from self-organizing to self-managing."* Writing a Remember
item — *"What does self-managing mean?"* — assesses the K but **does not assess the
task**. The candidate walks away certified as able to *apply* a concept they only proved
they could *recall*. If recall of that definition genuinely matters as an independent
competence, **it must be declared as its own task at Remember.** That is what the JTA is
for.

### Rule 3 — MCQ ceiling is `4_analyze`

Multiple-choice cannot validly assess Evaluate or Create. A task declared at
`5_evaluate` or `6_create` **must** carry `is_exam_scope = false` and be flagged
`is_simulation_candidate`. Those competences are assessed by simulation, not by MCQ, and
until simulations exist they are **not certified**.

*(Found by this review: SM-AI-I task 5.11 was `5_evaluate` **and** `is_exam_scope = true`
— in direct contradiction of its own JTA's stated ceiling. Corrected to
`is_exam_scope = false`.)*

### Rule 4 — Difficulty is orthogonal to cognitive level

`difficulty` (1-5) and `bloom_level` are **independent axes**, and conflating them is
what produced this entire mess. `bloomFor(difficulty)` — mapping difficulty ≤2 to
Understand, 3 to Apply, 4+ to Analyze — made `1_remember` **structurally unreachable**
and severed item Bloom from the JTA entirely.

- **Bloom** = *what kind of thinking* the item demands. Fixed by the task.
- **Difficulty** = *how hard* that thinking is. Varies 1-5 **within** the level.

An easy Analyze item and a hard Analyze item are both Analyze items. You make an item
harder by making the content subtler, the distractors closer, or the situation less
familiar — **never** by raising the cognitive level.

### Rule 5 — The examination blueprint is COMPUTED, never asserted

The cognitive profile of a form is a **mathematical consequence** of two things already
declared: the domain weights, and the Bloom level of the tasks within each domain.

```
cognitive_profile[L] = Σ  (domain.weight_pct × share of that domain's
                           exam-scope tasks declared at level L)
```

It is a **derived property**, like a sum. It is not a lever, not a target, and **not a
thing anyone gets to choose.** Once the JTA declares its tasks and its domain weights,
the cognitive profile is already determined — the only remaining question is whether the
item bank honors it.

**Therefore no JTA may contain a "Bloom target" table.** A JTA states its tasks, its
domain weights, and then *reports* the resulting distribution — as AIGRM-I already does.
`certifications.exam_blueprint` records that computed profile so it can be published,
verified, and audited. It is a **declaration of what the exam is**, not an instruction
for what to assemble.

### Rule 6 — Form assembly samples by domain; cognition follows

The assembler samples by **domain weight** (the 17024 blueprint constraint), then across
tasks within each domain. Because every item carries its task's Bloom level, **the
cognitive profile emerges automatically** — it does not need to be enforced, only
verified against the computed declaration.

Within a task's items, the assembler balances **difficulty** (roughly 30% easy / 50%
moderate / 20% hard) for form reliability. **That is what `difficulty_mix` means, and it
has nothing to do with Bloom.**

---

## 4. The computed cognitive profiles

Derived from `tasks.bloom_level` weighted by `domains.weight_pct`, over exam-scope tasks
only. **These are not choices. They are what the JTAs already say.**

| Certification | Items | 1 Remember | 2 Understand | 3 Apply | 4 Analyze |
|---|---|---|---|---|---|
| **AIE-I** (literacy) | 25 | 0% | **70.0%** | 30.0% | 0% |
| **AIGRM-I** (I) | 80 | 0% | **62.9%** | 26.7% | 10.4% |
| **SM-AI-I** (I) | 80 | 12.3% | 33.8% | 31.6% | 22.3% |
| **SPO-AI-I** (I) | 80 | 4.0% | 34.0% | **50.5%** | 11.5% |
| **SD-AI-I** (I) | 80 | 0% | 20.1% | **49.6%** | **30.3%** |

**These profiles are defensible, and they are more honest than a round-numbered target
table.** Read them:

- **SD-AI-I** is the most demanding: **80% of its exam is Apply or Analyze.** A Developer
  credential in the AI era *should* be. Its tasks say *"review an AI-generated PR,"*
  *"trace a quality failure,"* *"own the verification."* You cannot certify that with
  recall questions, and the profile proves we don't.
- **AIGRM-I** is comprehension-heavy (62.9% Understand) because its tasks say *"explain
  the EU AI Act's risk-based structure,"* *"describe the characteristics of trustworthy
  AI."* A governance practitioner must first genuinely *understand* an unstable
  regulatory landscape. The document is explicit that it certifies *understanding of the
  landscape, not legal compliance* — and the profile matches that claim exactly.
- **AIE-I** has **zero Remember**, and that is a feature. Its tasks say *"explain what AI
  is,"* *"distinguish machine learning from generative AI."* A literacy credential
  certifying you can **explain** the difference is worth more than one certifying you
  **memorized** a definition. If recall genuinely matters, the honest fix is to declare
  Remember *tasks* — not to smuggle recall items in under Understand tasks.
- **SM-AI-I** carries the most Remember (12.3%) because Scrum has genuinely canonical
  facts — timeboxes, accountabilities, the three services — and its JTA declares three
  tasks with the verbs *define*, *list*, *recognize*. Honest recall, honestly declared.

The variation between certs is **real**, and it reflects genuine differences in the jobs.
That is what a job-task analysis is *for*. Forcing all five onto one template mix —
which is what the inherited table did — would have been the fiction.

---

## 5. Tier semantics

Cognitive profile is what makes the level ladder mean something. It is not marketing.

| Tier | Cognitive centre of gravity | MCQ ceiling |
|---|---|---|
| **Literacy** (AIE-I) | Understand, with applied judgment | `3_apply` |
| **Level I** | Understand → Apply → some Analyze | `4_analyze` |
| **Level II** *(planned)* | Apply → Analyze dominant; best-of-four-plausible items | `4_analyze` |
| **Level III** *(planned)* | Analyze → Evaluate; simulation-assessed | simulation |

A Level II is not "Level I with harder questions." **Difficulty does not define a
tier — cognitive demand does.** A Level II exam asks the candidate to *diagnose and
choose among defensible options*; a Level I asks them to *understand and apply*. That
distinction is now enforced in the schema, not merely asserted in a brochure.

---

## 6. Executable invariants

Prose does not enforce anything. Every rule above is a check in
`scripts/verify-cert.mjs`, and a non-zero exit is a release gate.

| # | Invariant | Enforces |
|---|---|---|
| **15** | `item.bloom_level == task.bloom_level` for every item | Rules 1, 2 |
| **16** | No `is_exam_scope` task above `4_analyze` | Rule 3 |
| **17** | `exam_blueprint.cognitive_profile` equals the profile computed live from tasks × domain weights | Rule 5 |
| **18** | A form drawn from the pool reproduces the declared profile within tolerance | Rule 6 |

**Invariant 17 is the important one.** It makes the published claim and the database
mutually verifying: if anyone edits a domain weight, retags a task's Bloom level, or
hand-edits a blueprint, the numbers diverge and the gate fails. **The scheme document
cannot silently drift from the exam it describes.** That is the property 17024 is
actually asking for, and it is now mechanical.

---

## 7. Transparency posture

Most certification bodies publish a domain blueprint ("Domain 3: 25%") and stop. The
cognitive demand — *are these recall questions or diagnostic scenarios?* — is left
opaque, which is precisely why so many credentials are memorization exercises wearing a
professional costume.

**Certidemy publishes the cognitive profile.** On every certification page, in every
scheme document:

> *SD-AI-I is assessed at 20% Understand, 50% Apply, 30% Analyze. **80% of this exam
> requires you to do something, not recall something.** These figures are computed from
> the job-task analysis, not chosen — every item is written at the cognitive level its
> task declares, and that correspondence is machine-verified before any form is issued.*

A candidate knows what they are walking into. An employer knows what the credential
attests. An auditor can check the claim against the database in one query. **The
transparency is only possible because the numbers are computed rather than asserted** —
you can publish a derived fact with confidence; you cannot publish a marketing target
and survive scrutiny.

---

## 8. Consequences — the remediation this forces

Recorded honestly, because the cost of this correction is the price of having a
defensible foundation.

1. **All four professional secure banks must be regenerated.** Their items were written
   from concept definitions with no task context, and stamped with a Bloom derived from a
   difficulty curve. Between 24.7% and 58.9% of them test above their task's declared
   level. ~4,500 items.
2. **AIE-I's secure bank must be regenerated too.** Its 44%-Remember blueprint was taken
   from the inherited target table and is construct under-representation against tasks
   that declare zero Remember. **This defect was introduced during the very review that
   found the others** — which is the strongest possible argument for the invariants.
3. **Practice pools** carry the same defect and are regenerated after the secure banks.
4. **The four JTA documents** must have their inherited "Bloom target" tables removed and
   replaced with the computed result, in AIGRM-I's form.
5. **SM-AI-I's JTA exam facts are stale** — it still says 40 items / 60 minutes; the live
   certification is 80 items. Correct the document.
6. **The readiness calculator must be re-derived.** It scores candidates against
   `bloom_level` and `difficulty` — both of which have been **noise** until now. Whatever
   it currently reports is not meaningful. It cannot be trusted until the banks are
   truthful, and must be re-checked afterwards.
7. **`generate-mock-exam` must sample by domain → task**, letting cognition follow, and
   use `difficulty_mix` for difficulty only.

---

## 9. Writing the next JTA

Certidemy has a dozen more certifications planned. Every one is written to this model.

1. **Write the tasks first.** Each task gets a verb, KSAs, criticality, frequency, and
   **exactly one Bloom level**, chosen from the verb and the KSAs. If you find yourself
   wanting a task to be "Understand for the definition and Apply for the judgment,"
   **that is two tasks.** Split it.
2. **Set domain weights** from criticality and frequency.
3. **Compute the cognitive profile.** Do not choose it. Run the query, report the result.
4. **Read the profile back and sanity-check it.** If a hands-on practitioner credential
   computes to 70% Understand, the *tasks* are wrong — go fix the tasks, then recompute.
   **Never adjust the profile to flatter the cert.** The profile is a mirror; if you
   dislike what it shows, change the thing it reflects.
5. **State the profile in the JTA as a result**, never as a target.
6. **Set `exam_blueprint` from the computed profile.**
7. **Run `verify-cert.mjs` before generating a single item.** Invariants 15-18 must pass
   on the scaffold, or the item bank will be built on a foundation that does not hold.

The order matters. **Every defect in this document exists because content was generated
before the foundation was verified.**

---

## Appendix A — The computation

```sql
-- The cognitive profile of any certification, derived from its JTA.
-- This is the single source of truth. exam_blueprint must equal this.
select c.code,
       t.bloom_level,
       count(*) as tasks,
       round(sum(d.weight_pct / nullif(dt.n, 0)), 2) as pct_of_form
from public.tasks t
join public.domains d          on d.id = t.domain_id
join public.certifications c   on c.id = t.certification_id
join (
  select domain_id, count(*) as n
  from public.tasks
  where is_exam_scope
  group by domain_id
) dt on dt.domain_id = t.domain_id
where t.is_exam_scope
group by c.code, t.bloom_level
order by c.code, t.bloom_level;
```

## Appendix B — Bloom levels, as Certidemy uses them

| Level | Task verbs | The candidate must… | Valid MCQ form |
|---|---|---|---|
| `1_remember` | define, list, name, recognize | recall a stated fact | direct recall; a clean recall item is **correct**, not lazy |
| `2_understand` | explain, distinguish, describe, classify | grasp meaning, give the reason why | explanation / comparison; no action required |
| `3_apply` | apply, determine, select, use | act correctly in a described situation | short scenario, one right response |
| `4_analyze` | analyze, diagnose, trace, differentiate | break a situation down, find the cause | multi-factor scenario requiring real reasoning |
| `5_evaluate` | judge, critique, defend | weigh options against criteria | **not MCQ-assessable** — simulation only |
| `6_create` | design, construct, produce | make something new | **not MCQ-assessable** — simulation only |

---

*This document is the foundation. Everything else — the item banks, the exams, the
scheme documents, the marketing claims, the credentials themselves — is downstream of
it. When it and the database disagree, the gate fails and nothing ships.*
