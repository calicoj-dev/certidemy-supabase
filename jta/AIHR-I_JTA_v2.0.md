> ## SUPERSEDED FOR ALL FACTUAL CONTENT
>
> **The authoritative JTA for AIHR-I is `jta/AIHR-I_JTA_generated.md`**, rendered
> from the live database by `scripts/gen-jta-doc.mjs`. Regenerate it rather than
> reading or editing the tables below.
>
> Generated 2026-09-01. Its exam facts were verified against
> `public.certifications` on that date: questions, duration, pass mark and pass
> ratio all match.
>
> **THIS DOCUMENT HAS NOT BEEN DIFFED AT TASK LEVEL.** The banners on AIE-I,
> AIGRM-I, SD-AI-I, SM-AI-I, SPO-AI-I and the archived AISM-I each state a count
> of divergent task statements, measured 2026-07-23. No equivalent count exists
> for this file. Absence of a number here is not a claim that it agrees with the
> database - only that nobody has checked.
>
> **What is still valuable here:** the design rationale, domain-weight reasoning,
> sourcing and review history. That judgment cannot be regenerated from a query.
> Read this file for the *why* and never for the *what*.

# AIHR-I — Job-Task Analysis (v2.0 — LAUNCH BASELINE)

**Document version:** 2.0
**Status:** **LOCKED — launch baseline.** Seeded by migrations 145-148, content
authored and loaded, both item banks generated. `verify-cert.mjs --cert AIHR-I`
returns **28 pass / 0 fail**, the single warning being progressive lesson
localization, which is explicitly not a launch blocker. Version 2.0 aligns this
document with the rest of the catalog, all of which begin at 2.0 for launch;
pre-launch drafting history is in git and is not carried forward here. This is the basis for content production. Exam parameters
signed off by Juan on 25 July 2026. Task codes and statements below are now
immutable; changing one requires a new version and a re-lock, not an edit.
**Certification:** Certidemy AI for Human Resources & Talent I (AIHR-I) —
proprietary, issued by Certidemy
**Program / category:** `ai-workplace` (alongside AIE-I)
**Proposed UUID slot:** `77777777-7777-7777-7777-777777777777` (canonical free slot;
`8888` and `9999` remain free after this)
**Tier:** Level I — **lateral to AIE-I, not above it.** A role specialization, not a
second rung on the literacy ladder. The Level II slot in the AI Essentials ladder
remains **CAIP-I**.
**Last updated:** July 25, 2026

---

## Change log

- **v2.0** — launch baseline. Aligns with the catalog convention that every JTA
  begins at 2.0 at launch. Consolidates the pre-launch drafting sequence (external
  review, MCQ-verb rules, exam parameters, scaffolding reconciliation) into a single
  locked document, and sets the **credential validity period to 1 year** per §6.
  Content is otherwise unchanged from the version verified against the database:
  4 domains, 28 tasks, 114 concepts, 118 links.

---

## 1. Positioning

AIHR-I is an **applied, judgment-weighted credential for the people who make
employment decisions** — recruiters, talent acquisition specialists, HR business
partners, hiring managers, and HR operations staff. It proves a person can use AI
in the employment lifecycle **without creating legal exposure, without outsourcing
judgment they are accountable for, and without being fooled by either a vendor's
capability claims or a candidate's.**

**Binding positioning phrase for Domain 2 (marketing, scheme doc, and catalog copy):**

> **role-level legal literacy for employment decisions**

Never "governance," never "compliance certification," never any phrasing implying
the holder can clear a legal question. Domain 2 is 30% of the exam and that weight
is only defensible while this phrasing holds. If catalog copy drifts toward
governance language, either the copy or the weight has to change.

**Relationship to AIE-I.** AIE-I is the literacy floor and explicitly names HR
among its target audiences. AIHR-I assumes that floor and applies it to one
profession's actual work. **AIE-I is recommended, not required** — a formal
prerequisite would gate revenue on a free cert and add an enrollment failure mode
for no assessment benefit. Recommended-not-required is a policy call for Juan; the
technical recommendation is to keep them independent schemes.

**Relationship to AIGRM-I.** Clean seam. AIGRM-I governs AI systems at the
organizational level (risk registers, controls, assurance). AIHR-I is the
deployer-side, role-level competence of one function that operates a
consequential-decision system. A person holding both is the natural owner of an HR
AI program. Neither claims the other's scope.

**Commercial role.** B2B-forward. HR and TA teams buy in bulk and have an internal
ROI story a personal-development cert does not — this cert reduces a legal exposure
the buyer already knows they have. It is also, uniquely in the catalog, the
credential whose holders are *evaluators of other credentials*. That second-order
effect is a consequence of teaching credential evaluation honestly; **it is not a
stated purpose of the scheme and must never be positioned as one.** See §5.

**Commercial boundary.** Price points are **CertiGlobal's**, not Certidemy's —
certifications are purchased on certiglobal.org and this scheme does not scope them.
What the scheme does own, because each constrains what can be sold: **validity period**
(2 years), **attempts included** (1, with retake available), and the **free-to-learn /
paid-to-examine** split. Those sit in §6 and are scheme parameters, not commercial ones.
A JTA that names a dollar figure has reached outside its authority.

---

## 2. Basis of the body of knowledge

Three converging sources, per CERT-CREATION.md Stage 1's preference for public,
citable material over copyrighted books.

### 2.1 Regulation and public guidance (the spine)

**Verified current as of July 25, 2026:**

- **EU AI Act** (Regulation (EU) 2024/1689) — **Annex III §4 classifies AI used in
  employment, worker management and access to self-employment as high-risk.**
  Article 50 transparency obligations. Article 4 AI-literacy duty.
- **EU Digital Omnibus on AI** (political agreement 7 May 2026; Parliament
  endorsement 16 June 2026; Council final approval 29 June 2026) — **defers
  stand-alone Annex III high-risk obligations from 2 August 2026 to 2 December
  2027.** Annex I embedded systems move to 2 August 2028. **Most Article 50
  transparency obligations were *not* deferred and apply 2 August 2026**; Article
  50(2) legacy-system marking moves to 2 December 2026.
- **NYC Local Law 144** — AEDT independent bias audit, published summary, candidate
  notice. In effect since 2023. Currently the most prescriptive US employment-AI
  rule actually operating.
- **Illinois HB 3773** (amending the Illinois Human Rights Act) — effective
  1 January 2026. Notice duty; liability for discriminatory outcomes including
  unintentional disparate impact; ZIP code barred as a protected-class proxy. IDHR
  implementing rules were **proposed** 15 May 2026 (comment closed 29 June 2026) —
  **confirm final status at lesson-authoring time.**
- **Illinois AI Video Interview Act** — still in force, narrower, video-specific.
- **Colorado SB 26-189** — signed 14 May 2026; **repeals and replaces SB 24-205
  (the original Colorado AI Act, which never took effect).** Shifts from
  impact-assessment/reasonable-care to targeted disclosure, adverse-outcome
  explanation within 30 days, meaningful human review, vendor documentation, and
  three-year record retention. Effective 1 January 2027. **Enforcement is
  contested** — litigation produced a stay and the AG has indicated no enforcement
  pending rulemaking. Teach as *direction of travel*, not settled duty.
- **California CPPA ADMT regulations** — pre-use notice, opt-out, access, appeal,
  and pre-use risk assessment for significant decisions including employment;
  phasing across 2026–2027.
- **US federal** — Title VII, ADA, and the Uniform Guidelines on Employee Selection
  Procedures (the four-fifths rule) apply to AI-assisted selection with no
  AI-specific statute needed. EEOC guidance on AI and Title VII / ADA.
- **NIST AI RMF** and **ISO/IEC 42001** — voluntary frameworks that function as
  evidence of diligence across jurisdictions.

**LATAM layer — LAUNCH BLOCKER, confirmed by review.** Brazil (LGPD as applied to
hiring automation, and the status of PL 2338), Colombia (Ley 1581 and any
Superintendencia guidance on automated decisions), and Mexico (LFPDPPP successor
regime) must be in lesson content at launch, even if lighter in depth than the
EU/US material. **Their current status is unverified in this document and must be
confirmed before lesson authoring — do not assert status from these lines.** A
LATAM-first platform shipping an employment-AI cert that teaches only EU and US
regimes is selling half a product to its actual buyer.

### 2.2 Market consensus

Many "AI for HR" courses exist. Very few are built as assessed certifications with
a published job-task analysis, declared cognitive levels, and a defensible exam.
That gap is the opportunity and it is also the obligation: the differentiator has
to be the rigor, visibly.

### 2.3 The practitioner's actual day

Tasks below were drafted against real recruiter and HRBP activity — screening,
requisition intake, vendor selection, interviewing, candidate communication,
record-keeping — not against a topic outline. A task that does not correspond to
something an HR professional actually does on a Tuesday does not belong here.

---

## 3. The finding that shaped this JTA: the ground moves

Between February and July 2026, in a single window:

- the EU deferred employment high-risk obligations by sixteen months;
- Colorado **repealed its AI Act before it ever took effect** and replaced it with a
  structurally different law, itself now under an enforcement stay;
- Illinois brought a new employment-AI regime into force with implementing rules
  still unfinalized.

Any JTA that named those statutes and dates in its **task statements** would already
be wrong — and **task codes and statements are immutable once published.**

This is not a hazard to note and move past. It is the central design constraint of
this scheme, and §4 encodes it.

---

## 4. Authoring rules for this scheme (binding)

**Rule 1 — Tasks state durable capability, never statutory content.**
Task statements describe what a competent practitioner can *do*. Jurisdiction,
statute name, effective date, and threshold live in **lesson content and concept
descriptions**, which are updatable — never in task statements or task codes.

> ✗ "Describe the impact-assessment requirements of the Colorado AI Act."
> ✓ "Determine which categories of obligation attach to an AI hiring tool in a
>    given jurisdiction."

The first task died on 14 May 2026. The second survives the next decade of
legislative churn and is a *better* assessment target anyway, because it tests
transferable judgment rather than a memorized citation.

**Rule 2 — Teach the obligation taxonomy, not the statute list.**
Disclosure duty, audit duty, explanation duty, human-review duty, record duty,
non-discrimination liability. Every regime in §2.1 is a different combination of
those six. A learner who knows the taxonomy can read a new law; a learner who
memorized four laws cannot read the fifth.

**Rule 3 — Lessons carry a review date.**
Every Domain 2 lesson gets an explicit "verified as of" date in frontmatter and a
scheduled re-verification. This is the platform's first genuinely perishable
content and is treated as such from day one rather than retrofitted.

**Rule 4 — No legal advice.** The scheme teaches recognition and escalation, not
counsel. Every Domain 2 lesson ends at "and this is the point where you involve
legal." A cert producing recruiters who think they can self-clear a compliance
question is worse than no cert.

**Rule 5 — Task verbs must be MCQ-assessable *and* at or below the declared level.**

**5a — assessability.**
The exam is multiple choice. A task statement whose verb denotes *production*
— write, create, draft, maintain, translate, map, communicate, verify-as-an-act —
cannot be validly assessed by item selection, and an item written against it will
silently test something narrower than the task claims. Every task statement uses a
selection-compatible verb: **identify, determine, distinguish, explain, recognize,
evaluate, analyze, select, judge, apply.**

Applied as a sweep during drafting, this rule rewrote **seven** statements: 1.1,
2.8, 3.1, 3.3, 3.8, 4.2, 4.5. The underlying competence is unchanged in every case
— the KSA `S:` lines still describe the productive skill, because that is what
lessons teach and what the learner does at work. Only the *assessable claim*
narrowed to what an MCQ can actually support. This is the same correction applied
to SPO-AI-I 4.3/4.5 and SD-AI-I; it is now a standing rule for the house rather
than a per-cert catch.

**5b — cognitive level.** The verb must also sit **at or below the task's declared
Bloom level** — for this scheme, at or below 4 (Analyze). A task statement is the
*published claim* about what the credential measures; a verb one level above the
assessment overstates it.

This clause exists because the first version of the rule lacked it. Rule 5a listed *evaluate* and *judge* among
the permitted verbs: both are MCQ-assessable and both sit at Bloom 5. Three statements
carried them into the scaffold (2.5, 3.5, 4.4), and `verify-cert.mjs` invariant
`jta.statementVerb` caught all three before any content was authored.
**MCQ-assessability and level-appropriateness are separate constraints, and enforcing
only the first is not enough.**

Permitted opening verbs, level-banded:

| Declared level | Permitted |
|---|---|
| 2 — Understand | explain, describe, distinguish, recognize, identify |
| 3 — Apply | apply, determine, select, classify, interpret, identify, distinguish |
| 4 — Analyze | analyze, differentiate, assess, examine, recognize, determine |
| 5+ | **not permitted in this scheme** — evaluate, judge, appraise, critique, justify, create, design, formulate |

Verified across all 28 statements after correction: zero Bloom-5 verbs remain.

---

## 5. The self-service firewall (Domain 3) — enforceable form

Domain 3 teaches learners how to evaluate credentials. Certidemy sells credentials.
That is a real conflict, handled structurally.

External review confirmed the structure survives a hostile reading, with one
caveat: the rules were **aspirational prose**, and a merely-competent item writer
could still produce a self-serving stem. They are now checkable.

### The five structural rules

1. **Certidemy is never named anywhere in Domain 3** — not in lessons, not in
   items, not in examples. Not once.
2. **ISO/IEC 17024 is named factually as one accreditation standard among
   several**, alongside national and sectoral accreditation bodies. Never presented
   as *the* mark of a good credential.
3. **The domain teaches evaluation properties, not a preferred category.** A
   university certificate, a vendor certification, an accredited certification, a
   course-completion badge, and an assessed micro-credential are each taught for
   what they evidence and what they do not. None is superior in the abstract;
   fitness is relative to the hiring question being asked.
4. **Every worked example and every item stem uses hypothetical or generically
   described credentials** — never a real program, ours or anyone's. This also keeps
   the scheme clear of the third-party naming rule in TERMINOLOGY-POLICY.md.
5. **Weight caps are hard.** Domain 3 ≤ 30% of the exam; the credential-literacy
   tasks (3.5–3.8) ≤ 15% of the exam. These are limits, not targets.

### The check (runs before publication, and again before any item-bank regeneration)

Items and lessons on tasks **3.5, 3.6, 3.7, 3.8** are scanned across all three
languages for:

- the strings `Certidemy`, `CertiGlobal`, and every certification code in the
  catalog (`AIE-I`, `AIGRM-I`, `AISM-I`, `SM-AI-I`, `SPO-AI-I`, `SD-AI-I`,
  `AIHR-I`) — **expected count: 0**;
- any real-world credential or training-provider name — **expected count: 0**,
  verified by review of the flagged set rather than by string match alone;
- comparative-superiority phrasing about credential *types* (e.g. "the gold
  standard," "the only credential that," "unlike course certificates") —
  **flagged for human review**, not auto-failed, since legitimate comparative
  teaching exists.

A non-zero count on the first two blocks publication. The check belongs in the
same verification pass as the secure-firewall and coverage proofs, not in a
separate review ritual — a rule that runs is a rule; a rule in a document is a
hope.

**Task 3.7 carries the highest exposure in the scheme** and is the first place to
look if this ever goes wrong.

---

## 6. Exam facts

**SUPERSEDED -- read `jta/AIHR-I_JTA_generated.md` for the exam facts.** The table
that stood here stated a duration that is no longer true. Not patched: putting
the figure in two places is how it went stale.

| it said | live 2026-09-01 |
|-|-|
| Duration **50 minutes** | **60 minutes** |

Questions (40) and pass mark (80%, 32/40) were correct and are not repeated
here -- the generated JTA carries all three. The pass mark's "provisional,
pending standard-setting" caveat still stands and is not superseded by this
note.

**Exam facts NOT held in the database:**

| Attribute | Value |
|---|---|
| Format | Multiple choice, online, scenario-stemmed |
| Open/closed book | Closed book |
| Attempts | 1 included; retake purchasable |
| Bloom ceiling | **4 (Analyze)** |
| Bloom floor | **2 (Understand)** — no `1_remember` anywhere in this scheme |
| Validity | **1 year** |
| Languages | English, Español (es-419), Português (pt-BR) |
| Prerequisite | None. AIE-I recommended, not required. |

**Why 40 and not 35.** Review flagged 26 tasks against 30 items as marginal
sampling and preferred a longer exam to a thinner task inventory — correct on both
counts. 35 was the suggested number but does not work: with weights of 20/30/30/20,
whole item counts require a multiple of 10, so the available options were 30, 40 or
50. **40 gives 8 / 12 / 12 / 8**, lands clean with no rounding, and yields ~1.4
items per task — enough for every task to be sampled at least once with headroom
for the high-criticality ones to carry two. This also removed the need to cull
tasks, so nothing was cut; two were added instead.

**On 50 minutes.** 75 seconds per item, set against house precedent rather than in
the abstract: SM-AI-I runs 80 items in 90 minutes (**67.5 s/item**) and AIE-I runs 25
in 45 (**108 s/item** — correctly generous for a novice literacy floor). At 75 s/item
AIHR-I sits between them, gives more room per item than the Scrum certs do, and at 40
items is the second-shortest exam in the catalog. Apply and Analyze items carry
scenario stems that take real time to read; reading speed should not be the
discriminating variable, and 75 s holds that line.

The concern this setting answers is real and sits in a specific place: HR is not an IT
audience with an established exam-sitting habit, and the **minutes figure on the
catalog page** is what a prospective candidate weighs — not the seconds-per-item
arithmetic. "40 questions · 50 minutes" reads as a lunch break.

Cutting to 30 items was rejected. At 28 tasks that yields 1.07 items per task: every
task sampled exactly once, no headroom to weight the high-criticality ones, and a
single weak item takes out a whole task's coverage. An honest 30-item version requires
culling to ~22 tasks, dropping content added for good reason.

**On 1-year validity.** Certidemy credentials expire after one year as a matter of
house policy, and the reason is about the **certification's content**, not the
candidate's memory. A validity period is a commitment to re-review the body of
knowledge on that cadence and to reissue only against material that still holds.

For this scheme the commitment is not notional. Between February and July 2026 the
EU deferred its employment high-risk obligations by sixteen months, one US state
repealed its AI act before it took effect and replaced it with a structurally
different statute, and another brought a new regime into force with implementing
rules unfinalized. A credential asserting current competence in that landscape
cannot honestly run for two years.

Credentials whose body of knowledge is anchored to a stable framework may hold a
version for far longer in practice; the review cadence is the same, and the outcome
of the review differs. Recertification is by re-examination against the then-current
form (§9 of the scheme document).

**Duration is the reversible parameter.** `exam_duration_minutes` is a one-row update
once median completion times exist from live candidates; item count is a blueprint
change; task codes are immutable forever. Revisit this number with data, not with
argument.

**On 80%.** Held at the catalog standard for consistency, and **provisional
pending standard-setting on live candidate data.** The scheme document must state
this plainly rather than implying the cut score was psychometrically derived. It
was not. It is a house convention until data exists — and this exam is materially
harder per item than AIE-I at the same nominal cut score. That is intentional, and
it is the first place to look if early pass rates come in unreasonably low.

---

## 7. Domain structure

| # | Domain | Weight | Items | Tasks |
|---|---|---|---|---|
| 1 | AI in the Talent Lifecycle | 20% | 8 | 5 |
| 2 | Legal Exposure, Bias & Candidate Rights | 30% | 12 | 9 |
| 3 | Scoping Roles & Evaluating Capability Claims | 30% | 12 | 9 |
| 4 | Responsible AI Use in the Recruiter's Workflow | 20% | 8 | 5 |
| | **Total** | **100%** | **40** | **28** |

Weights land on whole item counts with no rounding.

**Rationale.** D2 and D3 carry equal top weight because they are the two things a
recruiter cannot get from AIE-I and cannot safely improvise: *what the law requires
of me* and *how to judge a capability claim*. D1 is deliberately light — AIE-I
already carries general literacy, so D1 is only the lifecycle-specific overlay. D4
is the recruiter as AI *user* rather than AI *buyer*: daily work, lower stakes per
decision.

**On holding D2 at 30%.** Review noted this is heavy for a Level I role credential
and risks reading as a junior AIGRM-I for one function. Held, on the judgment that
legal exposure is the buyer's actual pain and the strongest B2B hook — but the
positioning phrase in §1 is now binding rather than advisory, and it is the
condition on which the weight rests.

---

## 8. Bloom distribution

**Task-level (28 tasks):**

| Bloom | Tasks | % |
|---|---|---|
| 2 — Understand | 4 | 14% |
| 3 — Apply | 18 | 64% |
| 4 — Analyze | 6 | 21% |

**Item-level target (40 items):** ~18% Understand · ~57% Apply · ~25% Analyze
(≈ 7 / 23 / 10).

**Derived, not imposed.** Item Bloom is stamped from the parent task by
`trg_item_bloom_matches_task`; the item distribution is a consequence of how the
blueprint samples tasks. The figures above are checked as achievable against the
per-domain task mix — D4 supplies no Understand-level items at all, which is
correct for that domain and is why the total lands at ~18% rather than higher. The
generators must not be handed an item-Bloom target the task inventory cannot supply.

**Contrast with AIE-I (44 Remember / 40 Understand / 16 Apply).** Correct for a
literacy floor, wrong here. This scheme has **zero Remember-level tasks by design**
— a recruiter who can recite the four-fifths rule but cannot spot a proxy variable
in their own screening criteria has not been made competent, only confident.
Judgment, not jargon.

---

# Domain 1 — AI in the Talent Lifecycle (20%)

**Description.** What AI is actually doing across sourcing, screening,
interviewing, onboarding, and worker management; how these systems produce the
outputs a recruiter acts on; and where their capability claims outrun their
evidence. Establishes the object that D2, D3 and D4 then govern, evaluate, and use.

## Tasks

### Task 1.1 — Identify where AI is used across the talent lifecycle, from sourcing through worker management

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `talent-lifecycle`, `ai-in-sourcing`, `ai-in-screening`, `ai-in-worker-management` |


**KSAs:**

* **K:** The lifecycle stages where AI now appears — candidate sourcing and
  outreach, resume parsing and ranking, assessment, interview scheduling and
  analysis, offer modeling, onboarding, and post-hire performance, scheduling and
  monitoring systems
* **S:** Given an organization's tool stack, locate every point where AI touches an
  employment decision
* **A:** Recognition that "AI in hiring" is not one system but a chain, and that
  worker management sits inside the same regulatory perimeter as recruitment

---

### Task 1.2 — Distinguish an automated employment decision tool from ordinary recruiting software

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `automated-decision-tool`, `rules-based-filter`, `materially-influences`, `tool-classification` |

**KSAs:**

* **K:** What distinguishes a system that automates, substantially assists, or
  materially influences an employment decision from one that merely stores or
  routes data; that regulators define covered tools broadly; that a human making
  the final call does not by itself remove a tool from scope
* **S:** Classify a given tool in a given workflow as in-scope or out-of-scope
* **A:** Caution against the convenient conclusion — this classification gates every
  obligation in Domain 2, and erring permissively is the most common failure

**Note:** the highest-leverage task in the scheme; every D2 duty depends on it.
Confirmed by external review.

---

### Task 1.3 — Explain how a resume-screening or candidate-ranking model produces a score

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `candidate-ranking`, `trained-on-historical-hires`, `pattern-not-judgment`, `score-is-not-truth` |

**KSAs:**

* **K:** That ranking models learn from historical hiring outcomes and therefore
  reproduce historical hiring patterns, including the undesirable ones; that a score
  is a similarity estimate, not a measure of merit; that "fit score" has no standard
  definition across vendors
* **S:** Explain to a hiring manager, in plain language, what a ranking score does
  and does not mean
* **A:** Refusal to treat a numeric output as more objective than the human judgment
  it replaced

---

### Task 1.4 — Identify what AI cannot reliably assess about a candidate

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `assessment-limits`, `inferred-trait-claims`, `video-analysis-limits`, `construct-validity` |

**KSAs:**

* **K:** The weak evidentiary basis for inferring personality, culture fit, emotion,
  engagement, or integrity from voice, face, or text; that a tool measuring
  something is not the same as that something predicting job performance
* **S:** Given a vendor's assessment claim, judge whether the construct is plausibly
  measurable and plausibly job-related
* **A:** Willingness to say "this measures something, but not what it says it
  measures"

---

### Task 1.5 — Recognize AI-washing in HR technology marketing

| Attribute | Value |
|---|---|
| Domain | 1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-washing`, `claim-versus-evidence`, `benchmark-without-baseline` |

*Retained. Review offered this as a cull candidate under a 30-item exam; the move
to 40 items removed the pressure, and it is the only Analyze-level task in D1.*

**KSAs:**

* **K:** Common patterns — rules engines relabeled as AI, accuracy figures with no
  stated baseline or population, efficiency claims measuring throughput rather than
  quality of hire, pilot results presented as validation
* **S:** Take apart a vendor claim and name what evidence would actually support it
* **A:** Buyer skepticism proportionate to the stakes of the decision the tool will
  influence

---

# Domain 2 — Legal Exposure, Bias & Candidate Rights (30%)

**Description.** The duties that attach when AI influences an employment decision,
the mechanism by which AI-assisted selection produces discriminatory outcomes
without anyone intending it, and what a candidate is entitled to. Taught as a
transferable obligation taxonomy (§4 Rule 2), not a statute list.

**Authoring constraints:** every lesson carries a "verified as of" date and
terminates at the escalation boundary (§4 Rules 3 and 4). **Positioning is
role-level legal literacy, never governance (§1).**

## Tasks

### Task 2.1 — Determine which categories of obligation attach to an AI hiring tool in a given jurisdiction

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `jurisdictional-scope`, `obligation-taxonomy`, `deployer-versus-developer`, `multi-jurisdiction-hiring` |

**KSAs:**

* **K:** That obligations follow the candidate's and role's location, not the
  employer's headquarters; that a distributed hiring process can trigger several
  regimes at once; that deployer duties differ from developer duties and buying a
  tool does not transfer responsibility for outcomes
* **S:** Given a hiring scenario spanning jurisdictions, identify which categories of
  duty are triggered and who owes them
* **A:** Escalation instinct rather than improvisation

---

### Task 2.2 — Distinguish disclosure duties, audit duties, explanation duties, human-review duties, record duties, and non-discrimination liability

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `disclosure-duty`, `independent-bias-audit`, `explanation-duty`, `human-review-duty`, `record-duty`, `non-discrimination-liability` |

**KSAs:**

* **K:** The six duty types as independent axes; that satisfying one does not satisfy
  another; that non-discrimination liability exists independently of any AI-specific
  statute and is the exposure that never goes away when an AI law is delayed or
  repealed
* **S:** Given a described regime, sort its requirements into the taxonomy
* **A:** Structural thinking — read the next new law by its shape rather than
  memorizing it

**Note:** the load-bearing task of the scheme; what makes Domain 2 survive §3's
volatility. Confirmed by external review.

---

### Task 2.3 — Explain how disparate impact arises from AI-assisted selection

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `disparate-impact`, `selection-rate-comparison`, `unintentional-discrimination`, `protected-characteristic` |

**KSAs:**

* **K:** That liability attaches to outcomes, not intent; how selection rates are
  compared across groups; that a facially neutral criterion applied by a model
  produces a discriminatory outcome at a scale and speed no human reviewer could
* **S:** Read an outcome breakdown and recognize a disparity worth escalating
* **A:** Outcomes-first thinking — good intentions are not a defense

---

### Task 2.4 — Identify proxy variables that encode protected characteristics

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `proxy-variable`, `geographic-proxy`, `institution-proxy`, `linguistic-proxy`, `employment-gap-proxy` |

**KSAs:**

* **K:** How location, school or institution name, employment continuity, language
  fluency markers, activity signals, and affiliation cues can correlate with
  protected characteristics; that some jurisdictions bar specific proxies outright
* **S:** Audit a set of screening criteria — one's own included — for proxy risk
* **A:** Suspicion of criteria that feel neutral and merit-based, since those are
  precisely the ones that survive review unexamined

---

### Task 2.5 — Analyze a vendor bias-audit report to distinguish what it establishes from what it does not

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `audit-scope`, `auditor-independence`, `audit-population-mismatch`, `audit-recency`, `audit-is-not-indemnity` |

**KSAs:**

* **K:** That an audit covers a specified tool, configuration, population and date;
  that the vendor's audited population may not resemble the deployer's applicant
  pool; that model updates can invalidate a prior audit; that an audit is evidence
  of diligence, not a transfer of liability
* **S:** Read a bias-audit summary and state precisely what it licenses the employer
  to conclude
* **A:** Treating vendor assurance as an input to one's own judgment, not a
  substitute for it


---

### Task 2.6 — Apply accommodation and accessibility duties to AI-mediated assessment

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `reasonable-accommodation`, `alternative-evaluation-path`, `screening-out-by-design`, `assessment-accessibility` |

**KSAs:**

* **K:** That timed, video, voice, or game-based assessment can systematically
  disadvantage candidates with disabilities; that an accommodation request may
  arrive before a candidate has disclosed anything; that an alternative evaluation
  path must be genuinely equivalent, not a token
* **S:** Given an assessment design, identify who it screens out and what alternative
  path is required
* **A:** Designing the alternative before it is requested

**Note:** the most-neglected exposure in the field and a strong differentiator —
external review flagged it for emphasis in marketing. Most competing material omits
it entirely.

---

### Task 2.7 — Determine what a candidate is entitled to know, contest, or have reviewed by a human

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `candidate-notice`, `adverse-decision-explanation`, `meaningful-human-review`, `data-correction-right` |

**KSAs:**

* **K:** Pre-use notice, explanation after an adverse outcome, the right to request
  human review, and correction of inaccurate input data; what makes a human review
  *meaningful* rather than a rubber stamp — authority to change the outcome, access
  to the underlying data, and time to use both
* **S:** Given a rejection produced with AI involvement, determine what the candidate
  is owed and produce it
* **A:** Candidate-as-rights-holder rather than candidate-as-throughput

---

### Task 2.8 — Determine what a defensible record of an AI-assisted employment decision must contain

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `decision-record`, `record-retention`, `documented-human-judgment`, `audit-trail` |


**KSAs:**

* **K:** What a defensible record contains — tool and version used, its output, the
  human reasoning applied on top of it, notices given, accommodations offered;
  multi-year retention expectations; that the record is what exists when a claim
  arrives eighteen months later
* **S:** Produce a decision record that would survive a regulator's or plaintiff's
  reading
* **A:** Documentation as protection rather than bureaucracy

---

### Task 2.9 — Determine the minimum documentation a deployer should require from an AI hiring vendor

| Attribute | Value |
|---|---|
| Domain | 2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `vendor-documentation`, `intended-use-statement`, `known-limitations-disclosure`, `contractual-allocation-limits` |

*Added on external review: sat in the gap between 2.5 (reading an audit) and 4.1
(operating within tool boundaries), and is among the most practical things a
recruiter can actually act on during procurement.*

**KSAs:**

* **K:** What a deployer should obtain before deployment — intended-use statement,
  training-data categories at a descriptive level, known limitations, evaluation
  results with population described, update and revalidation cadence, and support
  for the deployer's own notice and explanation duties; that contractual
  indemnification does not eliminate regulatory or discrimination exposure and in
  some regimes is expressly void
* **S:** Given a vendor package, identify what is missing that the deployer will
  later be unable to produce
* **A:** Procurement as the cheapest point of intervention — everything not obtained
  here becomes unobtainable later

---

# Domain 3 — Scoping Roles & Evaluating Capability Claims (30%)

**Description.** Defining what a role actually requires in AI terms, and judging
whether a candidate has it — from the credentials they present, the claims they
make, and the evidence available. The domain where the recruiter's own expertise is
the product.

**Read §5 before reviewing or authoring this domain.**

## Tasks

### Task 3.1 — Determine the observable capabilities a stated business need actually requires

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `requirement-elicitation`, `need-to-capability`, `role-scoping` |


**KSAs:**

* **K:** How to run a requisition intake conversation that surfaces the underlying
  business problem rather than the manager's guess at a job title; that "we need
  someone who knows AI" is a symptom, not a requirement
* **S:** Convert a stated business need into a small set of observable capabilities
  the role must have
* **A:** Willingness to push back on a hiring manager's initial framing

---

### Task 3.2 — Distinguish AI-related job titles that describe materially different work

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `title-drift`, `builder-versus-user`, `title-versus-task`, `seniority-inflation` |

**KSAs:**

* **K:** That AI job titles are unstandardized and drifting; the substantive
  difference between people who build models, integrate AI systems, govern them, and
  use them well; that the same title means different work at different companies
* **S:** Given a job description, determine which category of work it actually
  describes regardless of its title
* **A:** Reading for the work, not the label

---

### Task 3.3 — Determine whether a job description specifies AI capability as observable tasks or as tool names

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `task-based-requirement`, `tool-name-versus-capability`, `over-specification`, `must-have-versus-nice-to-have` |


**KSAs:**

* **K:** That naming tools dates a requisition and narrows the pool to people who
  used one product rather than people who can do the work; how over-specification
  produces both a smaller pool and a worse one
* **S:** Rewrite a tool-listing job description into observable task requirements
* **A:** Requirements as a hypothesis to be tested, not a wish list

**Note:** the KSA `S:` line deliberately retains the productive skill. Lessons teach
rewriting and learners rewrite; the exam assesses the discrimination that rewriting
depends on. That gap is the honest boundary of an MCQ and is stated rather than
papered over.

---

### Task 3.4 — Analyze how AI shifts the task composition of an existing role

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `task-composition-shift`, `augmented-versus-displaced-task`, `skills-adjacency`, `role-redesign` |

**KSAs:**

* **K:** That AI changes the *mix* of tasks within roles more often than it
  eliminates roles; that the tasks which remain are typically the judgment,
  exception-handling and accountability ones
* **S:** Decompose a role, identify which tasks AI now absorbs, and state what the
  role should now be hired against
* **A:** Workforce planning as redesign rather than headcount arithmetic

---

### Task 3.5 — Analyze what a credential evidences about a candidate and what it does not

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `credential-claim-scope`, `assessed-versus-attended`, `issuer-independence`, `credential-currency` |

**KSAs:**

* **K:** The properties determining what a credential evidences — whether competence
  was assessed or attendance recorded, who set and marked the assessment, whether
  the issuer is independent of the trainer, what scope was claimed, and whether it
  expires; that a credential evidences something narrow and dated, never general
  competence
* **S:** Given a credential on a resume, state precisely what it licenses the
  recruiter to infer — and what it does not
* **A:** Neither dismissing credentials nor over-reading them; one evidence source
  among several


**Firewall: §5 rules 1–5 apply. Subject to the §5 pre-publication check.**

---

### Task 3.6 — Distinguish the common types of learning and credentialing artifact

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam-scope | Yes |
| Simulation candidate | No |
| Concept slugs | `course-completion-certificate`, `attendance-badge`, `vendor-certification`, `accredited-certification`, `academic-qualification` |

**KSAs:**

* **K:** What each artifact type is produced by and therefore can support —
  completion certificates evidence exposure, vendor certifications evidence
  product-specific proficiency, accredited certifications evidence assessment
  against a published scope by an independent body, academic qualifications evidence
  sustained study
* **S:** Categorize a presented artifact and state its evidentiary reach
* **A:** Fitness-for-purpose over hierarchy — the right artifact depends on the
  hiring question

**Firewall: §5 rules 1–5 apply, rule 3 especially.** No artifact type is superior in
the abstract. Subject to the §5 check.

---

### Task 3.7 — Interpret published competence documentation to determine what a credential tested

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `job-task-analysis`, `exam-blueprint`, `cognitive-level-of-assessment`, `published-scope-versus-marketing-claim` |

**KSAs:**

* **K:** That a rigorous credential publishes what it assesses — the tasks analyzed,
  the weighting across domains, the cognitive level at which each is tested; that
  recall-level and judgment-level assessment support very different inferences about
  a candidate; that a program publishing no scope document is asking to be taken on
  trust
* **S:** Read a published scope document and determine whether the credential tested
  recall or applied judgment on the capability the role needs
* **A:** Asking for the evidence behind a claim as a routine professional habit

**Firewall: highest-exposure task in the scheme.** §5 rules 1–5 apply in full.
ISO/IEC 17024 is named factually as one accreditation standard among several, never
as the benchmark. All stems and worked examples use hypothetical credentials.
Subject to the §5 check, and the first place to look if the firewall ever fails.

---

### Task 3.8 — Determine the appropriate verification action for a claimed credential and recognize fabrication or lapse signals

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `credential-verification`, `verification-of-record`, `expiry-and-recertification`, `fabrication-signals` |


**KSAs:**

* **K:** That verification means confirming with the issuer of record rather than
  accepting an image or PDF; that many credentials expire and a lapsed credential is
  a different claim from a current one; common fabrication signals
* **S:** Verify a presented credential and handle a failed verification
  proportionately and fairly
* **A:** Verify rather than assume, without treating candidates as suspects

**Firewall: §5 rules 1–5 apply.** Subject to the §5 check.

---

### Task 3.9 — Determine how AI-driven task change affects internal mobility and reskilling decisions

| Attribute | Value |
|---|---|
| Domain | 3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `internal-talent-marketplace`, `adjacent-role-match`, `reskilling-decision`, `build-versus-hire` |

*Added on external review, which found the worker-management half of the scope
thinner than the acquisition half. Extends 3.4's analysis to the internal population
— where most organizations will feel AI-driven task change first.*

**KSAs:**

* **K:** That task-composition change creates internal candidates whose adjacency is
  invisible to a resume-matching process built for external hiring; that
  build-versus-hire is a real decision with different evidence requirements on each
  side; that internal AI-assisted assessment carries the same D2 duties as external
* **S:** Given a role whose task mix has shifted, identify which existing employees
  are adjacent and what reskilling the gap actually requires
* **A:** Looking inward before opening a requisition

---

# Domain 4 — Responsible AI Use in the Recruiter's Workflow (20%)

**Description.** The recruiter as an AI *user*: drafting with it, screening with it,
and knowing where their own accountability starts. Lower stakes per decision than
D2, but daily — the place where habits either protect the organization or quietly
erode it.

## Tasks

### Task 4.1 — Apply confidentiality rules to candidate data in general-purpose AI tools

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `candidate-data-confidentiality`, `public-tool-exposure`, `personal-data-in-prompts`, `approved-tool-boundary` |

**KSAs:**

* **K:** That resumes, interview notes, salary data and background information are
  personal data; what pasting them into an unapproved tool exposes; that consent to
  be considered is not consent to be processed by any tool
* **S:** Decide whether a given task can be done in a given tool, and redact or
  reroute when it cannot
* **A:** Default caution with other people's data

---

### Task 4.2 — Determine what review an AI-drafted recruiting artifact requires before it is published or sent

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-drafted-content`, `output-review-duty`, `fabricated-requirement`, `accountability-for-output` |


**KSAs:**

* **K:** That AI-drafted job descriptions and outreach routinely invent requirements,
  benefits, salary bands and legal language that were never approved; that the
  employer is bound by what the posting says regardless of what drafted it
* **S:** Review AI-drafted recruiting content against the source facts before it is
  published or sent
* **A:** Ownership of the output — the tool is not a co-signer

---

### Task 4.3 — Assess AI-generated or AI-assisted candidate material fairly

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-assisted-application`, `assistance-versus-fabrication`, `detector-unreliability`, `verify-the-claim-not-the-prose` |

**KSAs:**

* **K:** That AI assistance in writing an application is now normal and is not itself
  misconduct; that fabricating experience is; that AI-detection tools are unreliable
  and produce false positives falling unevenly, particularly on non-native speakers
  — creating its own discrimination exposure
* **S:** Shift the assessment from *how was this written* to *is the underlying claim
  true and can the candidate do the work*
* **A:** Fairness to candidates over policing of style

**Note:** external review confirmed this position as correct on the evidence and
recommended locking it. It is commercially contrarian — it contradicts the tooling
being sold to recruiters right now — and the lesson must therefore be unusually
careful and explicitly evidence-based. Detection does not work; verification does.

---

### Task 4.4 — Determine when a hiring task must not be delegated to AI

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `human-decision-boundary`, `final-decision-accountability`, `adverse-decision-handling`, `high-stakes-judgment` |

**KSAs:**

* **K:** Which tasks carry accountability that cannot be delegated — final selection,
  rejection, accommodation decisions, and anything a candidate can contest; that
  automating a rejection is a different act from automating a scheduling email
* **S:** Given a workflow, draw the line above which a human must decide and document
* **A:** Accountability as personal rather than procedural


---

### Task 4.5 — Select an accurate, plain explanation of AI use in hiring for a candidate or hiring manager

| Attribute | Value |
|---|---|
| Domain | 4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam-scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `candidate-facing-transparency`, `stakeholder-communication`, `trust-and-perception` |


**KSAs:**

* **K:** That candidates increasingly ask whether AI screened them, and that evasive
  answers cost more trust than the AI use itself; how to explain AI involvement
  plainly without overstating either its role or its rigor; how to tell a hiring
  manager that a tool they want cannot be used
* **S:** Write a candidate-facing explanation of AI use that is accurate and plain
* **A:** Transparency as a default rather than a disclosure minimum

---

## 9. Concept inventory

**Scaffolded and verified (migration 145):** **114 distinct concepts** across 28 tasks
(~4.1 per task) and **118 `task_concepts` links** — 114 primary plus 4 deliberate
cross-domain reuse links:

| Task | Reused concept | Why |
|---|---|---|
| 2.4 | `trained-on-historical-hires` (from 1.3) | proxy problems originate in the training data |
| 2.6 | `assessment-limits` (from 1.4) | the accommodation duty follows from what assessment cannot measure |
| 3.9 | `task-composition-shift` (from 3.4) | internal mobility applies the same analysis inward |
| 4.4 | `accountability-for-output` (from 4.2) | the non-delegable boundary rests on it |

An early estimate of ~97 assumed reuse that did not survive deduplication; the
scaffolded figure is authoritative. Verified at seed: zero orphan concepts, zero
unlinked tasks, and every link resolving to a defined task and concept.

Concept **descriptions** were authored from the KSA lines and live in migration 145,
on disk — per the AIE-I recovery lesson they are never left to exist only in the
database.


---

## 10. Resolved decisions (external review)

1. **Domain 3 self-service firewall** — survives a hostile reading; structure kept.
   Rules converted from prose to a runnable pre-publication check (§5). **Resolved.**
2. **Domain 2 at 30%** — kept. The positioning phrase in §1 is now binding rather
   than advisory and is the condition the weight rests on. **Resolved.**
3. **Task inventory vs exam length** — resolved by lengthening the exam rather than
   thinning the inventory. 30 → 40 items; 35 was not available under clean weights.
   No tasks culled; two added. **Resolved.**
4. **Duration** — 50 minutes (75 s/item), answering candidate-facing burden without
   degrading sampling; benchmarked against house precedent, reversible with live
   completion data. **Resolved.**
5. **Validity** — 1 year, per house policy and the content-review rationale in §6.
   The scheme document's §9 dispute is closed in favour of 1 year. **Resolved.**
4. **80% cut score** — kept as house convention, stated provisional pending
   standard-setting in both this document and the scheme doc. **Resolved.**
5. **Task 4.3 (detection vs verification)** — confirmed correct on the evidence.
   **Locked.**
6. **HR-wide vs TA-only** — HR-wide confirmed; follows the regulatory boundary.
   Narrowing to TA would make the cert incomplete relative to the laws it addresses.
   **Resolved.**
7. **LATAM layer** — confirmed a launch blocker, not a fast-follow. Brazil and
   Colombia minimum at launch. **Resolved** (§2.1).
8. **Naming** — AIHR-I confirmed; follows the domain-code + level convention used by
   AIGRM-I and AISM-I. No AIE- prefix; CAIP-I remains the Level II literacy slot.
   **Resolved.**
9. **Missing coverage** — both gaps closed: 2.9 vendor documentation, 3.9 internal
   mobility. **Resolved.**
10. **MCQ-assessable verbs** — one flagged, sweep found seven total; all rewritten
    and Rule 5 added as a standing house rule. **Resolved.**

**No open questions remain and nothing is outstanding.** Exam parameters (40 items /
50 minutes / 80%) and the two added tasks are signed off. Proceed to SCHEME-AIHR-I.md.

---

## 11. Honesty posture (mandatory, carried into SCHEME-AIHR-I.md)

Structurally provable at build time: secure/practice firewall integrity, coverage
(every exam-scope task taught), item-to-task Bloom conformance, cue-neutrality
measurement, **and the Domain 3 self-service check (§5)** — which is new to this
scheme and should be added to the standard verification pass rather than kept as a
one-off.

Pending live candidate data: standard-setting for the cut score, item difficulty and
discrimination, SME-panel validation of the JTA.

Claim: **built to the ISO/IEC 17024 framework, audit-ready by design.** Never
"accredited." Domain 2's currency claim is scoped to its stated verification date
and never to "current law."

---

*v2.0 — July 26, 2026. **LOCKED — launch baseline.** Scaffolded (migrations
145-148), trilingual at the JTA layer, 28 lessons authored and loaded, 672 secure and
840 practice items generated and verified. Task codes, statements, weights, and
cognitive levels are frozen; a substantive change requires a new version, external
review, and a re-lock.*
