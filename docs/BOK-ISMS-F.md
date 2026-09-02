# BOK-ISMS-F — Body of Knowledge basis

**Document version:** 0.3
**Certification:** ISO/IEC 27001 Foundation — AI (`ISMS-F`)
**Family:** `security` (new; founding member)
**Tier:** Level I
**Status:** Pre-JTA. This document establishes what the credential is entitled to
assess and on what evidence. The JTA derives from it and is the artifact that
gets locked.
**Sources verified:** 4 August 2026

## Change log

- **v0.3** — Section 5 cognitive profile replaced with the figure derived
  from JTA v2.0. The v0.2 projection is superseded.
- **v0.2** — Market-consensus collection completed (§3 Source 2); exam form
  **locked** at 40 items / 60 minutes / 80% / closed book; ISO/IEC 17024:2026
  confirmed published with a new AI clause (§8); four of five open questions
  resolved (§9).
- **v0.1** — Initial draft. Source 2 empty pending Class B collection.

---

## 1. Purpose of this document

`CERT-CREATION.md` puts the body of knowledge before the job-task analysis, and
every locked JTA in the catalog carries a defensibility section that names its
sources. This document is that section, written first rather than
retrofitted.

It answers three questions in order:

1. **What job does this credential certify?**
2. **On what published evidence are we entitled to say that job consists of these
   things?**
3. **Where does AI genuinely change the practice, and where does it not?**

Question 3 is the one that decides whether this is a real product or a
re-skinned commodity, and it is governed by the honesty firewall: AI content
enters only where a practitioner genuinely does something differently.

---

## 2. Positioning

`ISMS-F` is a **complete ISO/IEC 27001 Foundation**, rebuilt for an era in which
AI is in the estate.

The model is `SM-AI-I`. That credential does not omit Scrum events or artifacts
because they predate AI; it teaches the entire body of knowledge and asks at
every domain what has changed. Its scheme records that AI competencies are
"distributed across all five domains rather than concentrated." `ISMS-F` follows
the same construction.

**What that commits us to.** Clauses 4 through 10 as machinery — context and
interested parties, leadership and policy, risk assessment *and treatment*, the
Statement of Applicability, competence and awareness, performance evaluation,
internal audit, management review, nonconformity and corrective action. Annex A
as a structure. The certification process. A candidate who holds `ISMS-F` should
be able to hold their own against any Foundation holder in the market, and know
things they do not.

**What it is not.** Not an implementer credential — building and operating an
ISMS is `ISMS-LI` (Level II). Not a security-engineering credential. Not an
AI-specialization course that borrows 27001 vocabulary.

**Target audience.** Anyone who needs to understand an ISMS and the security of
AI within it: security analysts, IT operations, GRC staff, developers with AI in
their environment, auditors-in-training, and managers accountable for an
information-security programme.

**Ladder.** `ISMS-F` (Level I) -> `ISMS-LI` (Level II). `AIGRM-I` is orthogonal —
recommended companion study, not a rung. See section 7.

---

## 3. Triangulation

Three independent sources. They are not equally weighted, and the difference is
stated deliberately.

### Source 1 — The standard and its family (primary, normative)

The operative edition is **ISO/IEC 27001:2022**, incorporating **Amendment
1:2024** (climate action changes). The 2013 edition expired for certification
purposes on 31 October 2025; every certification audit in 2026 references 2022.
There is no 27001:2026.

Structure: **clauses 4-10** mandatory, plus **Annex A** with **93 controls in
four themes** — Organizational, People, Physical, Technological. Amendment
1:2024 adds an environmental-change consideration to clause 4.1 and a note to
clause 4.2.

Supporting family members the BoK draws on:

| Standard | Role |
|---|---|
| ISO/IEC 27002:2022 | Control implementation guidance; the source of the 93 controls and their attributes |
| ISO/IEC 27005 | Information security risk management guidance |
| **ISO/IEC 27000:2026** | Overview. Sixth edition, published July 2026 — see the volatility note below |
| ISO/IEC 27090 | AI security threats — **FDIS, not yet published** |
| ISO/IEC 27091 | AI privacy risks — **FDIS, not yet published** |
| ISO/IEC 42001 | AI management system; the integration point, taught as context only |

**Volatility note — ISO/IEC 27000:2026.** The sixth edition of the overview
document was published in July 2026, replacing the 2018 edition. Reported
changes: the title dropped "and vocabulary", clause 3 shrank from 77 defined
terms to 12, and the document restates plainly that Annex A is a set of
**reference controls** rather than a checklist to be copied into a Statement of
Applicability with a yes/no column. Existing 27001:2022 certifications are
unaffected.

This matters to us twice. It confirms a teaching point we would have made anyway
— the SoA is a justification document, not a copy of Annex A — and it means the
27000 overview is no longer the terminology source it was. **Any lesson that
would have cited 27000 for a definition needs a different citation.** Verify
against the published document before authoring D2.

**Volatility note — ISO/IEC 27090 and 27091.** Both were at Final Draft
International Standard stage as of mid-2026 and are expected to publish within
the year. 27090 addresses security threats and compromises specific to AI
systems across the lifecycle; 27091 addresses privacy risks in AI and ML
systems. **Neither may be cited as a published normative source until it is
published.** Both are named re-verification triggers (section 8) — when 27090
lands it is the single most relevant document to this credential published by
ISO, and D1 and D4 will need a pass.

### Source 2 — Market consensus (what peers assess)

**Collected 4 August 2026.** Every fact below carries a source and a date per
`CLAIMS-POLICY` Class B. Any fact here older than six months on the date of use
is treated as unverified and must be re-checked.

#### Foundation tier — the market converges

| Provider | Items | Duration | Pass | Book | Prereq | Validity | Source |
|---|---|---|---|---|---|---|---|
| PECB ISO/IEC 27001 Foundation | 40 | 60 min | 70% | closed | training course required | does not expire | pecb.com; partner listings |
| APMG ISO/IEC 27001 Foundation | ~40-60 | 60 min | ~50-70% | — | — | — | **exam-prep vendors only — INDICATIVE, not usable externally** |
| EXIN ISFS | ~45 | 60 min | 65% | — | — | — | **candidate blog only — INDICATIVE, not usable externally** |

**40 items / 60 minutes is the market standard.** Three providers, no meaningful
dissent on form. Pass marks range 65-70% among those with published figures.

APMG and EXIN figures are from exam-preparation vendors and a candidate blog,
not the certification bodies. They do not enter the comparison dataset and must
not appear on any external surface until sourced from APMG and EXIN directly.

#### Implementer tier — PECB's pattern, and why it is the reference

| Provider | Items | Duration | Book |
|---|---|---|---|
| PECB ISO/IEC 27001 Lead Implementer | 80 | 3 hours | **open book** |

PECB's pattern across both Lead Implementer and Lead Auditor is 80 questions /
3 hours / open book — an instrument designed to test judgment with the standard
available, which is what the job actually looks like. Other implementer-tier
examinations surveyed in 2026-08 were dimensionally identical to their own
Foundation papers, which is the contrast that makes PECB's shape informative.

**Carried forward to `ISMS-LI`:** the credible reference point is PECB's
80/3hr/open-book. Open book is worth a deliberate decision at
that tier — a lead implementer at work has the standard on the desk.

#### The positioning finding

**PECB's Foundation is not an ISO/IEC 17024 personnel certification.** PECB's own
site distinguishes the two: "certified" applies only to personnel certifications
under ISO/IEC 17024, "certificate holder" applies to certificate programs under
ANSI/ASTM E2659, and certificate holders are not certified, licensed, accredited
or registered. The credential issued is "PECB Certificate Holder in ISO/IEC
27001:2022 Foundation."

PECB's ISO/IEC 17024 accreditation (IAS, UKAS, COFRAC) covers Lead Auditor and
Lead Implementer schemes. **At the Foundation tier, the accreditation asymmetry
that governs the rest of this market is materially reduced.**

Two related facts, same date:

- **PECB requires completion of its own training course before the Foundation
  exam.** Certidemy's open eligibility is not merely a policy convenience; it is
  the position ISO/IEC 17024 clause 5.2 exists to address — the relationship
  between a certification body and its own training function.
- **Published structure is thin across the market.** PECB's Foundation is graded
  across two competency domains weighted 50/50. No published weighting was found
  for the other programmes surveyed. Five domains with differentiated weights,
  a published blueprint,
  and a cognitive profile computed from the JTA is a real gap rather than a
  claimed one.

#### Where the market goes the other way

**Credential validity.** PECB's Foundation certificate does not expire, and the
other Foundation-tier programmes surveyed in 2026-08 issue multi-year validity.
Certidemy issues 365 days — the tightest validity of the programmes surveyed.

Defensible on the merits (one year tracks the content re-review cadence, and the
standard's own AI companion documents are publishing this year), but a buyer
comparing line items sees "expires in 1 year" against "never expires" and does
not read the reasoning. **Owed: a decision and a sentence of copy.** Not a change
to the policy.

#### AI layer

No provider surfaced in this collection publishes an AI layer at Foundation
level. Recorded as **not found**, not as **does not exist** — absence of evidence
in a keyword search is not a Class B fact and must not be stated externally.

### Source 3 — AI-era security practice (the differentiated layer)

Published, citable guidance on securing AI systems. This is where `ISMS-F`
departs from every other Foundation on the market, and the sources are strong
enough that the departure is evidenced rather than asserted.

| Source | What it supplies |
|---|---|
| **OWASP Top 10 for LLM Applications** | Model-level risk taxonomy — prompt injection, training-data poisoning, output handling. Treats the model as input-in, output-out |
| **OWASP Top 10 for Agentic Applications 2026** (ASI01-ASI10) | Published 9 December 2025 by the OWASP GenAI Security Project. Covers what happens when the model becomes an *actor* with goals, credentials, tools, memory and autonomy: goal hijack, tool misuse, identity, supply chain, code execution, memory poisoning, inter-agent communication, cascading failures, human-agent trust, rogue agents. Extends rather than replaces the LLM list |
| **OWASP MCP Top 10** | The tool-connection layer specifically |
| **MITRE ATLAS** | Adversarial threat landscape for AI systems; the ATT&CK analogue |
| **NIST adversarial ML taxonomy** | Terminology and attack classification |
| **NCSC / CISA secure AI development guidance** | Government-issued secure-development and deployment practice |

**Why the agentic list is load-bearing.** The distinction between the LLM list
and the agentic list — a model that answers versus a system that acts with
delegated authority — is the same distinction that makes non-human identity a
genuine gap in Annex A. It is the strongest available evidence that the control
set was written for a world that no longer exists in one specific, nameable
respect. That is a teaching point with a citation behind it, not an opinion.

**Honesty note.** All Source 3 documents are voluntary. None has legal force,
none is an ISO standard, and the agentic list in particular is under a year old.
Lessons must present them as current practitioner consensus, not as
requirements. Where they conflict with 27001, 27001 governs.

---

## 4. The AI weave — where practice genuinely changed

The honesty firewall applied. 27001 is unusually good material for this because
the asymmetry is stark, and **saying where AI does not change the control is
itself a teaching point.** A course that AI-flavours physical security is
bullshitting, and a practitioner can tell. Naming the null result is what earns
trust for the places where the change is real.

### Genuinely changed

| Area | What changed |
|---|---|
| **Asset inventory** | Models, prompts, agents, embeddings and vector stores are assets. Most inventories do not contain them |
| **Access control** | Non-human identity. An agent holds credentials and acts. Annex A's access-control model assumes a human principal or a static service account, not an autonomous actor whose next action is not predetermined |
| **Supplier relationships** | Foundation-model providers are suppliers you cannot inspect. Standard supplier assurance assumes you can ask what is inside |
| **Data classification** | Classification has to survive being pasted into a chat window. The control was designed for files that move, not text that is retyped |
| **Awareness and training** | Shadow AI. Unsanctioned tools adopted individually, invisibly, and usually with good intent |
| **Incident response** | Prompt injection and context leakage are incident classes with no established playbook, and often no log entry |
| **Threat intelligence** | The AI-specific threat landscape (Source 3) is new, moving, and not covered by conventional feeds |
| **Secure development** | AI-assisted coding changes what "reviewed" means; model supply chain is a new dependency class |

### Barely or not changed — and we say so

Physical and environmental security. Clear desk and clear screen. Screening and
terms of employment. Most of business continuity. Cryptographic key management as
a discipline. Compliance with legal requirements as a process.

These are taught straight. Where a candidate might *expect* an AI angle and there
is none, the lesson says there is none and why.

---

## 5. Domain structure and exam form

### Proposed domains

For the JTA to argue with. Weights sum to 100.

| D | Domain | Weight | Items @40 | Character |
|---|---|---|---|---|
| 1 | Information security fundamentals and the AI-era threat landscape | 15.0% | 6 | Concepts, CIA triad, threat/vulnerability/risk, the AI-specific threat taxonomy |
| 2 | The ISMS — context, leadership, scope and policy with AI in the estate | 17.5% | 7 | Clauses 4-5, scope decisions when SaaS AI touches everything |
| 3 | Risk assessment and treatment | 22.5% | 9 | Clauses 6 and 8, the SoA, AI-specific risk identification |
| 4 | Annex A controls and the AI weave | 27.5% | 11 | **Signature domain.** Four themes, 93 controls, where AI lands |
| 5 | Performance evaluation, improvement and certification | 17.5% | 7 | Clauses 9-10, internal audit, management review, stage 1/stage 2, the three-year cycle |

The weights divide into 40 items with **zero rounding** — 6+7+9+11+7 = 40. If the
JTA moves a weight, the new set must still divide cleanly, because the form
assembler samples by domain weight.

### Exam form — LOCKED

| | |
|---|---|
| Items | **40** |
| Duration | **60 minutes** |
| Pass mark | **80%** (32/40) |
| Book | **Closed** |
| Eligibility | **Open** — no prerequisite, no required training |
| Languages | en / es-419 / pt-BR |

Derived from market convention (40/60 across four providers), not from internal
precedent. 80% holds Certidemy's uniform criterion-referenced standard across
every scheme, consistent with Foundation-tier market research conducted 2026-08.
A criterion-referenced study remains the intended basis. Open eligibility is the
deliberate divergence and the defensible one.

### Cognitive profile — a deliberate departure

Most of the catalog runs zero `1_remember`. 27001 has genuinely canonical facts:
four Annex A themes, 93 controls, clauses 4-10, two audit stages, a three-year
cycle with annual surveillance. `SM-AI-I` carries 12.3% Remember for exactly this
reason and the cognitive model defends it as "honest recall, honestly declared."

`ISMS-F` should do the same: **declare a small number of `1_remember` tasks
rather than smuggle recall items in under Understand tasks.**

**Derived profile (JTA v2.0, locked):** 5x `1_remember` (10.2%), 28x
`2_understand` (57.1%), 11x `3_apply` (22.4%), 5x `4_analyze` (10.2%) across 49
tasks.

*v0.1 and v0.2 of this document carried a projection of roughly 10 / 45-50 /
30-35 / 10, made over an unwritten task list. The KSA pass raised two tasks to
Apply on the merits of their skills lines (3.2, 4.5) and declined three others
with reasoning (2.4, 4.2, 5.2). **The derivation governs; the projection is
superseded and recorded here only so it is not mistaken for a target that was
missed.** 57% Understand is correct for a comprehension-tier credential —
AIGRM-I sits at 62.9% at the same tier — and a third of this examination above
comprehension already exceeds every Foundation in the collected market data.*

**D4 construction warning (external review, accepted).** The signature domain
must not become "93 controls surveyed." At Foundation level D4 tests **theme
structure, selection reasoning, and where AI lands** — not control text. Control
enumeration is confined to the declared `1_remember` tasks. A control-heavy
domain that tests recall while declaring Apply is precisely the smuggling the
cognitive model exists to prevent.

---

## 6. The copyright constraint

ISO's normative text is copyrighted. This limits **how lessons are written**, not
**what the credential covers**. `SCHEME-AIGRM-I` already sets the pattern: teach
the structure and reasoning in Certidemy's own words rather than reproducing
normative text.

In practice — a lesson may explain what clause 6.1.3 requires and why, in its own
words. It may not reproduce the clause. Control titles and numbers are factual
references and may be used; control text may not be copied. The distinction is a
lecturer explaining a clause versus reading it aloud.

Do not use the ISO logo. Do not state or imply that ISO endorses, approves or
accredits Certidemy or this credential.

---

## 7. Scope boundaries and the AIGRM-I seam

**Out of scope for `ISMS-F`:** building and operating an ISMS as a project
(that is `ISMS-LI`); conducting audits as a discipline; security engineering and
tool configuration; ML engineering; adversarial robustness research.

**The AIGRM-I seam, confirmed:**

> AIGRM-I asks **who is harmed and who answers for it.**
> ISMS-F asks **what leaks and who gets in.**

Concept reuse is expected and fine — both certs touch risk, lifecycle and
third-party AI. The test is at the task level: **if a task can be answered
straight out of an AIGRM-I lesson, it does not belong in `ISMS-F`.**

Specific collision zones to police during JTA drafting:

- **Risk.** AIGRM-I D2 is AI risk management as governance. `ISMS-F` D3 is
  information-security risk assessment under clause 6.1. Same word, different
  discipline, different method.
- **Third-party AI.** AIGRM-I treats it as accountability. `ISMS-F` treats it as
  supplier assurance and supply-chain exposure.
- **Lifecycle.** AIGRM-I D4 governs the AI system lifecycle. `ISMS-F` touches
  lifecycle only where a control attaches.

**42001 in `ISMS-F`.** Taught as context — that a companion management system
standard exists and that organizations increasingly run both — at roughly one
task's depth. The integrated management system is a later credential, not
material here.

---

## 8. Volatility register

Named re-verification triggers, per the AIHR-I pattern.

| Trigger | Effect | Status |
|---|---|---|
| **ISO/IEC 27090 publishes** | D1 and D4 pass required. Becomes the most relevant ISO document to this credential | Re-verify quarterly until published |
| **ISO/IEC 27091 publishes** | D3 pass if privacy-risk method is affected | Re-verify quarterly |
| **ISO/IEC 27000:2026 content** | Any lesson citing 27000 for terminology must be re-sourced. Confirm the Annex A framing against the published text | **Owed before D2 authoring** |
| **OWASP agentic list revision** | D1 threat taxonomy refresh | Annual |
| **Market data (Source 2)** | Class B facts age at six months | Re-check by **4 February 2027** |

### ISO/IEC 17024:2026 — CONFIRMED, and it is about us

**Published March 2026**, replacing the 2012 edition. Verified 4 August 2026.

Structure was realigned to mirror ISO/IEC 17011, 17021 and 17065; requirements
that were implicit or scattered in 2012 are now stated explicitly. **The spine of
everything Certidemy does is untouched** — job-task analysis, teach, assess,
published claim matching measurement; impartiality; separation of training and
certification; scheme requirements; criterion-referenced cut scores.

**The new content is clause 6.5, "Use of artificial intelligence (AI) in the
certification process."** It did not exist in 2012. Certidemy generates items,
lessons and translations with AI, which places it squarely in the population this
clause addresses.

Per ISO/CASCO, where AI is used in any certification activity the body must:
control impartiality risks including AI-related bias; ensure human oversight;
validate AI-supported outcomes; demonstrate validity, reliability and fairness;
ensure personnel competence in AI use; and disclose AI use where candidates
interact with it. Requirements are principles-based, not prescriptive.

**What already evidences this:**

| 6.5 expectation | Existing evidence |
|---|---|
| Control AI-related bias | The shared cue guard — length homogeneity, uniform position, no rhetorical or absolute-word tell. AIE-I position chi-squared of 0.5 is a measurement, not an assertion |
| Human oversight | The lock gate: draft -> external review -> accept/decline with reasoning -> lock, documented per cert |
| Validate AI-supported outcomes | `verify-cert.mjs` invariants; `untaught_testing_violations = 0`; `trg_item_bloom_matches_task`; the firewall query returning zero |
| Validity, reliability, fairness | Published blueprint; cognitive profile computed from the JTA rather than asserted over it |
| Personnel competence in AI use | Exists in practice, **undocumented** |
| Disclose AI use to candidates | **GAP** |

**Owed, catalog-wide (not owned by this cert):**

1. A documented AI-in-certification policy, with named ownership, citing the
   controls above. A writing job; everything it would cite already exists. ANAB
   has been pointing bodies at the NIST AI RMF as the operationalization roadmap
   — the same framework AIGRM-I teaches.
2. Candidate-facing disclosure wherever a candidate interacts with AI (tutor,
   path advisor).
3. **`CLAIMS-POLICY` section 4 approved text** currently reads "Designed to the
   ISO/IEC 17024 framework for bodies certifying persons." With two editions in
   play the referent is ambiguous. **Recommend pinning to `:2026`** — a stronger
   claim, still Class A, still *designed to* rather than *accredited*. Three
   language strings, seven scheme docs, plus the JSON-LD. **Do this before
   `SCHEME-ISMS-F.md` is written.**

---

## 9. Decisions and open questions

### Decided

1. **Exam form — LOCKED.** 40 items / 60 minutes / 80% / closed book / open
   eligibility. Derived from market convention (section 5).
2. **Family slug — `security`.** Founding costs one upsert in SECTION 0 of the
   scaffold migration, plus a `FAMILY_SLUGS` entry and a `family-content.ts`
   block on the web side.
3. **`ISMS-F` vs `AISM-I` legibility — no change.** The public names carry the
   differentiation; the short codes coexist.
4. **UUID convention — `gen_random_uuid()`.** No convention to remember, no
   exhaustion, no slot bookkeeping. Retires the repeating-digit rule and with it
   the "never infer a UUID from cert count" trap, by removing anything to infer
   from. Existing certs keep their repeating digits — they are opaque identifiers
   and renaming them would touch every migration, script and content folder for
   no gain. **Owed: one line in `CERT-SCHEMA-GUIDE.md` section 7** retiring the
   old rule and stating that new certs generate a UUID at scaffold time, recorded
   in the migration header.

### Remaining

5. **Task count.** Scope from the BoK, not from a prior cert. `SM-AI-I` carries 51
   tasks at Level I for a comparable-breadth subject. Expect 45-55. Resolves
   during JTA drafting.
6. **Credential validity messaging.** 365 days against a market of 3 years and
   never-expires. A decision and a sentence of copy, not a policy change.

---

*End of BoK v0.3. JTA v2.0 is locked. Next: scaffold (Stage 6).*
