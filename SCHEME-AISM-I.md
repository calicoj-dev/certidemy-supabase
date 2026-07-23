# Certification Scheme — AI Service Management I (AISM-I)

**Scheme owner:** Certidemy (the certification body)
**Scheme code:** AISM-I
**Document version:** 1.1
**Status:** Scheme of record, **content-authored / pre-scaffold** (JTA locked 2026-07-15;
`status = draft`, to flip `coming_soon` once scaffolded). All 6 modules / 61 lessons are authored
and JTA-aligned; the live scaffold (domain/task/concept rows), lesson wiring, and item banks do not
yet exist. See the build-status note below — this scheme states plainly, throughout, what exists and
what is still pending.
**Last updated:** July 2026 (v1.1 — reconciled to the locked 6-domain / 61-task / 220-concept JTA
and the authored lessons; v1.0 was authored at JTA-lock before content existed).

---

## About this document

This is the **certification scheme** for the AI Service Management I credential: the published
contract describing what the credential certifies, how a candidate earns it, and how Certidemy
keeps that decision fair, consistent, and defensible. It is written to align with the structure
of the ISO/IEC 17024 framework for bodies operating certification of persons.

**A note on accreditation status.** Certidemy is **not currently an accredited certification
body**. This scheme is designed to the ISO/IEC 17024 framework — "audit-ready by design" — so
that the credential is structurally legitimate now and the body can pursue formal accreditation
once operational history and candidate data exist. Where a requirement depends on data or
governance that only accumulates after launch, this document says so plainly rather than
overstating readiness.

**Build-status note (read this before any guarantee below).** This scheme was first authored at the
moment the job-task analysis was **locked**, and has been reconciled (v1.1) now that all lessons are
authored — but *before* the credential is scaffolded into the live database or its item banks
generated. Accordingly, this document distinguishes throughout between:

- **Locked now:** the domains, tasks, task codes, weights, Bloom levels, concept list, exam
  structure, and computed cognitive profile — all frozen in the JTA (`AISM-I_JTA_v1.md`).
- **Authored now:** the 6 instructional modules / 61 lessons (English), authored to the locked JTA
  with per-lesson Bloom and concept-slug alignment validated. They are **not yet loaded, wired, or
  coverage-proven against the live database** — that happens at scaffold.
- **Enforced-by-design, verified-at-build:** the coverage, firewall, item-floor, and
  answer-cue-neutrality guarantees. These are enforced *by construction* by Certidemy's
  assessment engine — the same engine that has already produced four verified banks
  (SM-AI-I, SPO-AI-I, SD-AI-I, AIGRM-I). For **AISM-I specifically they are pending build**
  and will be proven by live query before publication. This scheme does **not** claim them as
  already proven for this credential; doing so would be false.

**A note on subject matter.** This credential concerns *AI service management* — running and
governing digital services in an environment where AI is a core operating component (AIOps,
predictive operations, conversational/virtual agents, and agentic automation), on top of the
established fundamentals of service management. The body of knowledge draws on the field-standard,
non-ownable *facts* of contemporary service management (service value and value co-creation, the
product-and-service lifecycle, the standard management practices, service-level and monitoring
concepts) together with current AI-operations practice. Certidemy teaches the *structure and
reasoning* of these in its own words; it does not reproduce any framework's normative text, and it
does not present itself as, or as endorsed by, any service-management framework, standards body, or
vendor. See the framework-identity line in §11.

---

## 1. Scheme identification

| Field | Value |
|---|---|
| Credential name | AI Service Management I |
| Credential code | AISM-I |
| Issuing body | Certidemy |
| Credential family | Certidemy AI Governance & Service Management *(program; category slug `governance-service-management`; shared with AIGRM-I — this credential joins it, does not found it)* |
| Credential type | Knowledge-and-application certification (entry / "I" tier) |
| Languages offered | English, Latin American Spanish (es-419), Brazilian Portuguese (pt-BR) |
| Credential validity | 1 year from issuance (see §9, Recertification) |
| Delivery | Online, remotely proctored-equivalent secure examination |

---

## 2. Purpose and scope

The AISM-I credential certifies that the holder can **run and govern digital services in an
AI-augmented operating environment**: the fundamentals of digital product and service management
(value, value co-creation, service relationships, service levels), the service value system and
guiding principles, the service lifecycle and the core management practices — and, at its core,
how service operations actually change when AI is central: AIOps and event correlation, predictive
and proactive operations, virtual agents at the service desk, intelligent and agentic automation,
human oversight of AI-driven service actions, and the governance of AI within the service function.

The signature competency is **accountable AI-augmented service operations**: knowing where AI adds
value in running a service, what level of autonomy an action can safely be granted, where a human
must stay in or on the loop, and who remains accountable when an AI agent acts.

**Positioning and differentiation (honest, verifiable).** AISM-I is an **AI-native
service-management credential**: AI is woven through *every* domain rather than isolated in an
appendix, and the applied AI-operations domain (D4) is the single heaviest domain by design. This
is not a marketing posture — it is a **structural, computable fact of the scheme**:

- **42.5% of the examination** (Domains D4 + D5) assesses the fully AI-era-native core —
  AI-augmented operations and the governance of AI in service management — and a genuine AI
  dimension is present in **43 of 61 tasks (~70%)** across the whole credential, with **18 tasks
  taught clean** where the underlying competency does not change under AI.
- The credential **publishes its cognitive profile** (§6.1): the exam is 0% recall, ~42% applied
  or analytical. Most service-management credentials publish only a domain blueprint and leave the
  cognitive demand opaque; Certidemy publishes both, computed from the job-task analysis.

Both figures are derived from the locked JTA and are machine-verifiable against the live database
(§10, §12), so the differentiation can be *checked*, not merely asserted. Certidemy does **not**
position this credential by comparison to, or as a successor of, any named third-party framework
(§11).

**Target audience.** Service and operations managers, service-desk and support leads, IT operations
and reliability staff, and service-management practitioners whose work now includes AI-driven tooling;
and professionals moving into roles that run AI-augmented services.

**Out of scope.** This credential does not certify: the engineering or building of AIOps, ML, or
automation platforms; data-science or model-development proficiency; mastery of, or equivalence to,
any specific service-management framework or its certification; vendor- or tool-specific
administration; or any statement of regulatory compliance. It certifies service-management and
AI-operations literacy and applied judgment, not platform engineering or regulatory authority.

---

## 3. Eligibility

The AISM-I examination operates under **open eligibility**: there are no mandatory prerequisites,
formal training hours, or prior-credential requirements to attempt the examination. This is an
entry-tier ("I") credential, and the body has chosen open access as a deliberate scheme policy.

Candidates are strongly advised to complete the associated body-of-knowledge coursework (or to
possess equivalent practical experience) before attempting the secure examination, but completion
of Certidemy coursework is **not** a condition of eligibility and confers no advantage in the secure
examination (§8).

---

## 4. Body of knowledge

The body of knowledge is organized into **6 domains** comprising **61 assessable tasks**, supported
by **220 defined concepts** (205 native to this scheme plus 15 shared, by slug and definition, with
the Governance scheme AIGRM-I and taught consistently across both — the service/governance bridge).
It is delivered through **6 instructional modules** (one per domain), authored in English at the
content stage (see the open content note in §11).

The six domains and their examination weightings:

| Domain | Title | Weight | Tasks |
|---|---|---|---|
| D1 | Foundations of Digital Product & Service Management | 12.5% | 8 |
| D2 | The Value System, Guiding Principles & Governance | 15.0% | 9 |
| D3 | The Service Lifecycle & Management Practices | 17.5% | 12 |
| D4 | AI-Augmented Service Operations *(signature)* | 27.5% | 15 |
| D5 | Governing AI in Service Management | 15.0% | 9 |
| D6 | Experience, Trust & Sustainable Service | 12.5% | 8 |

(Weights sum to 100; per-domain task counts sum to 61. At scaffold, these are reconciled against
the live `domains` and `tasks` rows for AISM-I.)

All **61 tasks are within examination scope** (none is above the multiple-choice ceiling of
`4_analyze`). AI competencies are **distributed where they genuinely transform the work**: D1–D3
weave AI into the foundations that actually change under it while teaching the rest clean; D4–D5
carry the fully AI-native operations-and-governance core; and D6 adds the human and responsible
dimensions (experience, trust, sustainability) with their own AI-native angles — trust in AI
services and the compute/energy footprint of AI. Across the credential, 43 of 61 tasks carry a real
AI dimension and 18 are taught clean, an honesty discipline that keeps every AI competency
load-bearing rather than decorative.

The body of knowledge is grounded in the public, field-standard *facts* of service management and in
current AI-operations practice. It does not depend on any third-party framework's proprietary text,
any single vendor's product, or any specific AI tool, and it teaches the structure and reasoning of
service management in Certidemy's own words (§11).

---

## 5. Competency model and job-task basis

The domain-and-task structure is a **job-task model**: each of the 61 tasks describes what a
competent AI-service-management practitioner must know or do, carries exactly one declared Bloom
level, and is linked to the concepts it draws on. Once the credential is built, each task links
forward to the assessment items that test it and the lesson(s) that teach its concepts, producing a
complete, queryable **traceability matrix** from domain → task → concept → assessment item →
instructional lesson (§10).

**Validation status — stated honestly.** The competency model was derived from the field-standard
body of service-management knowledge, current AI-operations practice, and analysis of the
competencies the AI-augmented service function now requires. Because "AI service management" is a
**partly emerging role**, this JTA is more *anticipatory* than one written for a long-established
job; it is mitigated by anchoring every task in practices that exist in operation today (AIOps,
conversational agents, agentic automation are current, not speculative) and by the honest posture of
this document. **Independent subject-matter-expert (SME) panel validation of the job-task analysis
is planned but not yet completed**, and is a prerequisite for accreditation. An external-reviewer
pass was performed on the job-task analysis during authoring (five review rounds with accept/decline
reasoning recorded); that is editorial / second-reviewer rigor, **not** the formal SME job-task
validation the standard requires.

---

## 6. Examination structure

| Parameter | Value |
|---|---|
| Number of items | 80 |
| Duration | 120 minutes (90 seconds per item) |
| Item format | Single-best-answer multiple choice and true/false |
| Delivery language | Candidate-selected: en, es-419, or pt-BR |
| Scoring | Dichotomous (correct / incorrect); no negative marking |

(Duration follows the current engine standard of 90 s/item for professional "I"-tier certs —
80 × 90 s = 120 min — chosen because items are scenario-based, not short recall, and because a tight
limit otherwise penalizes es-419/pt-BR candidates whose translated items run 15–25% longer. The
final parameters are reconciled against the live `certifications` row for AISM-I at publication.)

**Blueprint (item allocation by domain).** Each form draws items proportionally to the domain
weightings, yielding this distribution at 80 items:

| Domain | Weight | Items per form |
|---|---|---|
| D1 | 12.5% | 10 |
| D2 | 15.0% | 12 |
| D3 | 17.5% | 14 |
| D4 | 27.5% | 22 |
| D5 | 15.0% | 12 |
| D6 | 12.5% | 10 |

(Per-form counts follow directly from the weights; the row total equals 80.) The examination
assembler draws each form from the secure item bank according to this blueprint and **refuses to
issue a form if any domain is short of its quota**, guaranteeing every candidate a blueprint-valid
form.

### 6.1 Cognitive profile (published, computed — not chosen)

Certidemy publishes the **cognitive demand** of the examination, not merely its domain blueprint.
The profile below is a **mathematical consequence** of the domain weights and the Bloom level of the
in-scope tasks in each domain; it is computed from the job-task analysis and recorded in
`exam_blueprint`, where it is machine-verified to equal the live tasks×weights computation before any
form is issued (the verifier's invariant 17).

| Cognitive level | Share of examination |
|---|---|
| Remember | 0.0% |
| Understand | 58.4% |
| Apply | 32.8% |
| Analyze | 8.8% |

**~42% of this examination requires the candidate to apply or analyze — to do something, not recall
something.** Recall (Remember) is 0%: the credential does not certify memorized definitions. Genuine
diagnostic reasoning (Analyze) appears in both the signature AI-operations domain (four analyze
tasks: reading an alert flood, judging predictive-control fit, tracing how errors compound, and
diagnosing why an AI-augmented operation degraded) and classic operations (analyzing a recurring
incident to its root-cause problem). The multiple-choice ceiling is `4_analyze`; competencies above
it (evaluating and creating) are not claimed by this credential and are reserved for higher tiers
assessed by simulation.

---

## 7. Pass mark and standard-setting

**Current pass mark:** 80% (64 of 80 items).

**Methodology — stated honestly.** The pass mark is **criterion-referenced**: it reflects the level
of mastery the body judges necessary to certify competence, not a curve relative to other candidates.
The current 80% threshold is a **provisional, expert-judgment cut score** set at the "I"-tier
standard.

It has **not yet** been validated by a formal standard-setting study, because defensible
standard-setting (e.g., a modified-Angoff panel and statistical confirmation against candidate
performance) **requires real candidate data that does not yet exist.** The body's plan is to collect
candidate response data through live operation, compute item-level statistics and form reliability,
then convene a standard-setting panel to confirm or adjust the cut score against that evidence. Until
then, the 80% pass mark is held as the documented, criterion-referenced standard and applied
uniformly to every candidate and form.

---

## 8. Assessment integrity and separation of functions

*The controls in this section are enforced by construction by Certidemy's assessment engine and have
been proven on the body's four existing banks (SM-AI-I, SPO-AI-I, SD-AI-I, AIGRM-I). For AISM-I they
are **pending build** and will be verified by live query before publication (see the build-status
note). They are stated here as the scheme's binding commitments, not as already-proven facts for this
credential.*

**Separation of training and certification.** Certidemy operates a **technical separation** between
the learning function and the certification function through a strict item-pool firewall:

- The **practice pool** (used by the adaptive learning engine and study tools) and the **secure
  pool** (used only to assemble the live certification examination) are entirely distinct sets of
  items.
- Secure items are **never linked into the practice/learning graph** (`question_concepts`), so no
  secure examination content is reachable through study, review, or practice. The secure examination
  is **inert to the adaptive learning engine.** This is a DB-provable invariant: a firewall query
  must return zero secure items carrying a concept link (see §10).
- Completion of coursework confers **no advantage** on the secure examination and is not a condition
  of eligibility (§3).

**Governance-level separation** (an impartiality structure ensuring certification decisions are free
from commercial or training-side influence) is a formal accreditation requirement on the body's
roadmap; it is named here as established-in-design, to-be-formalized-operationally.

**Item bank inventory (design commitment).** The item bank will hold, **per assessable task**, a
floor of 8 secure items and 10 practice items **per language** across en / es-419 / pt-BR, for all 61
tasks — with over-coverage benign. Design totals at floor:

| Pool | Floor per task per language | Design total (61 tasks × 3 languages) |
|---|---|---|
| Secure (examination) | 8 | 1,464 (488 per language) |
| Practice (learning) | 10 | 1,830 (610 per language) |

Completion is proven, at build, by the same completion-gate, balance, and coverage queries used for
the prior banks: every practice item concept-linked (engine-reachable), every secure item
firewall-isolated (zero links into the practice graph), every question group holding exactly its
three language rows. **These holdings do not yet exist for AISM-I.**

**Form variation.** Once built, the secure bank provides substantial over-coverage of every domain's
blueprint quota, so forms vary candidate-to-candidate and no single form approaches exposure of the
bank.

### 8.1 Answer-cue neutrality (enforced by design; measured at build)

A multiple-choice item must be answerable **only by knowing the content** — not by exploiting surface
cues a test-wise candidate can read without competence. AISM-I's item banks will be generated under
the same explicit answer-cue-neutrality control used for the body's existing banks, and the result is
reproducibly auditable.

**The control.** A single shared cue-neutrality module governs both generators. For every item, before
translation, it (a) injects length-parity / no-positional-habit / no-rhetorical-tell rules into the
authoring prompt, (b) audits the item and drops or repairs any whose key dominates on length or shows
the absolute-word tell (every distractor carrying an absolute — always / never / only — while the key
hedges), and (c) deterministically shuffles option order (Fisher–Yates) so the correct answer lands in
a uniformly random slot. Cues are neutralized on the English skeleton, so all three languages inherit a
clean item.

**The result (to be measured on the AISM-I secure pool at build).** The cue-audit query reports the
correct-answer position distribution (target ~25% per slot), the key-longest percentage, and the option
length spread. These metrics are computed by the same query used for the prior certs and will be
reproducible at any time against the live AISM-I secure pool once generated.

**Honest ceiling.** This control proves an item bank is **cue-neutral and structurally sound.** It does
**not** establish item difficulty or discrimination, which can only come from live candidate response
data and remain pending (§7).

**Credential verification.** Every issued credential carries a unique credential code and a public
verification record, allowing any third party to confirm a credential's authenticity, holder, issue
date, and validity status.

---

## 9. Recertification

AISM-I credentials are valid for **1 year** from issuance.

**Rationale.** The credential certifies competence in service management *as practiced in
AI-augmented operations* — a domain whose tools, patterns, and practices are changing rapidly. A
1-year cycle keeps a current credential a genuine signal of current competence. Recertification
re-tests against the then-current body of knowledge, which is itself reviewed as AI-operations
practice evolves (§11).

---

## 10. Traceability and coverage

The scheme maintains a complete, queryable traceability matrix:

**domain → task → concept → assessment item**, and
**concept → instructional lesson**

Three audit-relevant guarantees follow, each backed by a live database view or query (the intended
data feeds for the super-admin governance dashboard, §12). *For AISM-I these are the guarantees the
build will establish and prove; they are pending until the credential is scaffolded, taught, and its
banks generated.*

1. **Coverage** — every one of the 52 in-scope tasks will be supported by assessment items in both
   pools, in all three languages (≥8 secure and ≥10 practice per language), and taught by at least
   one lesson. Proven at build via the coverage view: `concepts_taught = concepts_total`.
2. **No untaught testing** — every concept assessed will be present in the published body of
   knowledge, and every examination item will resolve back to the lesson(s) that teach its
   concept(s). Proven at build via the coverage view: `untaught_testing_violations = 0`. This is the
   ISO/IEC 17024 "no untaught testing" guarantee.
3. **Secure firewall** — the secure examination pool will carry **zero** links into the
   practice/learning graph, provable by a firewall query returning 0.

**A note on what the coverage view measures.** The coverage view derives "tested" from the
practice/learning graph (`question_concepts`). Because secure items carry no such link by design (the
firewall), secure-pool sufficiency is proven not by the coverage view but by the blueprint allocator
plus a per-task count (every task at its ≥8-per-language floor). Two pools, two proofs: practice reach
by the coverage view, secure sufficiency by the allocator and count.

The projection of lessons into this matrix, and the generation of items against the taught concepts,
are maintained by automated, re-runnable controls rather than by hand, so the matrix stays complete as
content evolves.

---


### 10.4 Trilingual equivalence and terminology control

This credential is delivered in English, Latin American Spanish (es-419) and
Brazilian Portuguese (pt-BR). The published blueprint in each language states
what the credential attests, so a translated task statement that describes a
different competence than the exam measures would be invalid for every candidate
sitting in that language.

Terminology is governed by **`TERMINOLOGY-POLICY.md`**, the single source of
truth for all Certidemy credentials. It records sixteen rules, each traceable to
a primary source (the official EU AI Act language versions, the official
translated Scrum Guides, the ISO/IEC standards) or to a recorded external-review
decision.

Two locks specific to this credential. **Outputs and outcomes must never converge** (Rule 10): *output* is `salida`/`saida` and *outcome* is `resultado`, because task 1.6 tests the distinction directly and `resultado` is already spoken for. **Provider and supplier must not collide** (Rule 11): the service provider is `proveedor`/`fornecedor` throughout D1, while task 3.12's external parties are `suministradores`/`fornecedores externos`. Field-standard service-management concepts - the guiding principles, the value system, the practices - are **not** glossed in English (Rule 12), which is the opposite treatment from the named public frameworks in AIGRM-I.

**Equivalence is enforced mechanically, not by procedure.** A database trigger
(`trg_invalidate_task_translations`) flips a task's translations back to
provisional in the same transaction whenever its English statement changes, and
the conformance gate (`verify-cert.mjs`, invariant `i18n.approved`) fails any
certification holding a provisional translation. The English cannot move without
the translations declaring themselves stale, and the credential cannot publish
while they are.

---

## 11. Scheme maintenance and governance

**Review cadence.** Reviewed when the underlying practice of AI-augmented service management shifts
materially (new operating patterns for AIOps, agentic operations, or virtual agents), when the
job-task analysis is re-validated, or at minimum annually.

**Change control.** Changes to domains, weightings, the item bank, or the pass mark are versioned and
recorded. The JTA is locked (`AISM-I_JTA_v1.md`, 2026-07-15); post-lock changes are version-controlled
scheme changes, not edits.

**Framework-identity line (scope discipline).** The field-standard concepts of service management
(service value, value co-creation, the lifecycle, the standard management practices, service levels,
incident/problem/change) are used as the **foundational body of knowledge** — they are the shared,
non-ownable facts of the field — and may be named in lesson content as pedagogical reference. They are
**not** claimed as Certidemy's own, and this credential is **not** presented as, equivalent to, a
successor of, or endorsed by any named service-management framework, its owner, or any vendor. Marketing
and app chrome make no comparative "beyond framework X" identity claim (JTA marketing-identity line). The
credential certifies a candidate's service-management and AI-operations literacy; it is not a statement
of regulatory compliance.

**Open content note.** Once built, the examination and practice item banks are to be complete in all
three languages; instructional lessons are authored in English first, with full es-419 and pt-BR
localization following progressively. A candidate may sit the examination and practice in any of the
three languages once the credential is published, while lesson study material localizes progressively.
This is stated transparently rather than implied as fully complete.

**Publication status.** This credential is **pre-build** at the time of writing (`status = draft`; JTA
locked, not yet scaffolded). It flips to `coming_soon` once scaffolded and to `available` once the
teaching layer is complete and coverage-proven, both item banks are complete, balanced, and verified
(firewall-isolated secure pool, concept-linked practice pool, cue-neutrality measured), the exam
parameters are reconciled with the live `certifications` row, and the launch checklist is cleared.

**Open items on the path to accreditation** (named transparently):

- **Scaffold and generate:** the **6 modules / 61 lessons are authored** (English, JTA-aligned,
  reviewed) — the remaining build is to scaffold the cert (create the 6 domains, 61 tasks, and 220
  concepts as live rows), load and wire the lessons, prove coverage (`concepts_taught =
  concepts_total`, `untaught_testing_violations = 0`), and generate the secure and practice banks to
  floor in all three languages with the firewall and cue-neutrality controls verified. *(Lessons
  exist; the live scaffold, wiring, and item banks do not yet.)*
- Independent SME-panel validation of the job-task analysis and weightings (§5) — with attention to the
  emerging-role caveat noted there.
- Formal standard-setting study and psychometric validation of the cut score, using candidate data
  collected in live operation (§7).
- Item difficulty and discrimination statistics from live candidate data (§8.1).
- Governance-level impartiality structure separating the certification decision from commercial and
  training functions (§8).
- Operational records required by the standard: appeals, complaints handling, examination-integrity /
  identity procedures, and internal audit.
- Full lesson localization into es-419 and pt-BR (above).

The credential is positioned as **"built to the ISO/IEC 17024 framework / audit-ready by design,"**
not as accredited, until accreditation is formally achieved.

---

## 12. Governance dashboard (planned)

Each guarantee in this scheme is designed to be surfaced as a **live query**, not a static claim, in
the planned super-admin governance/BI dashboard — one place that shows, per clause, the current state
of the evidence. The intended feeds (each reads "pending" until the AISM-I build populates it):

| Scheme clause | Live evidence | Source |
|---|---|---|
| Coverage / no untaught testing (§10) | `concepts_taught`, `concepts_tested`, `untaught_testing_violations` | `v_coverage_summary` |
| Cognitive profile == computed (§6.1) | `exam_blueprint.cognitive_profile` vs live tasks×weights | `v_cognitive_profile` (invariant 17) |
| Secure firewall (§8, §10) | count of secure items carrying a concept link (must be 0) | firewall query on `question_concepts` |
| Trilingual group integrity | count of question groups not holding exactly 3 language rows (must be 0) | group-integrity query |
| Blueprint sufficiency (§6) | per-task secure count ≥ 8 per language across all 61 tasks | per-task count query |
| Practice sufficiency (§8) | per-task practice count ≥ 10 per language across all 61 tasks | per-task count query |
| Answer-cue neutrality (§8.1) | position distribution, key-longest %, length spread | cue-audit query |
| Standard-setting / item stats (§7, §8.1) | *pending live candidate data* | (post-launch) |

This scheme document, the JTA (`AISM-I_JTA_v1.md`), and `LESSON-PIPELINE.md` are the narrative
artifacts the dashboard links to alongside those live queries, so a reviewer sees both the contract and
its current, queryable state in a single view.

---

*End of scheme document — AISM-I v1.1 (content-authored / pre-scaffold; reconciled to the locked
6-domain / 61-task / 220-concept JTA and the authored lessons, 2026-07-16).*
