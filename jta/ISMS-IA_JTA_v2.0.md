> ## SUPERSEDED FOR ALL FACTUAL CONTENT
>
> **The authoritative JTA for ISMS-IA is `jta/ISMS-IA_JTA_generated.md`**, rendered
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

# ISMS-IA — Job-Task Analysis v2.0 · **LAUNCH BASELINE**

**Credential:** ISO/IEC 27001:2022 Internal Auditor - AI
**Code:** `ISMS-IA` · **Tier II** · Family `ai-security`, `sort_order` 2
**Locked:** 2026-08-09
**File:** `supabase/jta/ISMS-IA_JTA_v2.0.md`
**Supersedes:** v0.1–v1.0, all superseded in full.
**Companions:** `ISMS-IA_BoK_v1.md` · `ISMS-IA_CONCEPTS_v2.0.md` (169 rows) ·
`ISMS-IA_CLAUSE-VERIFICATION-RESULTS.md` · `ISMS-IA_19011-VERIFICATION-RESULTS.md`

> **ERRATUM 1 — 2026-08-10.** Eight task statements and seven `skills` fields
> corrected after `verify-cert` flagged create-level verbs on Apply tasks (Rule 5b).
> Migration `191` is the record of record. **No Bloom level, weight, concept or link
> changed; the profile remains 5.00 / 29.40 / 65.60.** Corrected `skills` fields are
> marked ✎. Not a version bump: no item exists and no candidate has been assessed.
>
> **Scaffolded live** — migrations 187–191, commit `47405e2`. `verify-cert`: **17 pass,
> 5 fail, 0 warn**, all five failures being content not yet authored.
>
> **The rule that generalises:** a create-level verb in `skills` is the same defect as
> one in `statement`, and **no invariant checks it**. Sweep every new cert for
> `statement ~* '^(construct|design|compose|write|create|develop|formulate)'` and
> `skills ~* '\m(rewrite|write|design|compose|create|draft|record an)\M'`.

**5 domains · 5 modules · 38 tasks · 169 concepts**
**Profile: remember 0 · understand 5.00 · apply 29.40 · analyze 65.60**

This version adds everything the scaffold migration reads that v1.0 omitted:
task `criticality`, `frequency`, `order_index` and `is_simulation_candidate`;
domain codes, descriptions and order; and the module set. **Concepts moved to the
companion file** — a flat 169-row table is what the migration consumes, and it
makes the reuse-link count checkable.

---

## 0. LOCK STATUS AND ITS ONE EXCEPTION

**Three standards read directly on 2026-08-09** — ISO/IEC 27001:2022 (third
edition, unamended), ISO/IEC 42001:2023, ISO 19011:2026 (fourth edition, 2026-05,
ISO/PC 302).

> **CLOSED 2026-08-10 — erratum 2.** Task 4.7 previously rested on inference.
> **ISO/IEC 27001:2022/Amd 1:2024 has now been read directly.** Its whole normative
> body is two sentences, quoted at task 4.7's K field below. The inference was
> correct word for word, and one detail was wrong: the clause 4.2 addition is
> **NOTE 2**, not an unnumbered note — the existing note on legal and contractual
> requirements becomes NOTE 1. **No blocked item remains in this credential.**

**Erratum clause**, on the `ISMS-F` precedent: a correction arising from a
named unverified item **before any item is generated against that task** lands as a
dated erratum,
not a version bump. Once items exist against that task, it becomes a version
change.

**Review status, for `SCHEME-ISMS-IA.md` §11 verbatim.** This JTA had four rounds
of external second-reviewer critique, one of which materially changed it. That is
editorial rigour. It is **not** the independent SME-panel validation ISO/IEC 17024
requires, which needs a convened panel and is named as pending.

---

## 1. DOMAINS

`domains (certification_id, code, title, description, weight_pct, order_index)`

| code | order | title | weight | description |
|---|---|---|---|---|
| **D1** | 1 | The audit function and its boundaries | **12.5** | The purposes and parties of management system auditing, the ISO 19011 principles and how they interact under tension, auditor objectivity and competence, and the boundary between what ISO 19011 guides, what ISO/IEC 27001 requires, and what ISO/IEC 17021-1 governs. |
| **D2** | 2 | Audit programme management | **20.0** | Deriving programme objectives from the organization's ISMS objectives, risks and audit history; risk-based frequency and priority; defining scope and criteria for an individual audit; selecting on-site, remote or hybrid auditing methods; team composition; and testing a programme against ISO/IEC 27001 clause 9.2. |
| **D3** | 3 | Conducting the audit: evidence, sampling and testing | **25.0** | Determining the degree of verification information carries and the reliance a finding may place on it; sampling adequacy; evidence obtained by remote auditing methods; selecting collection methods; testing an Annex A control against its Statement of Applicability claim; the boundary of an ISMS audit; and what an AI-assisted evidence process establishes and leaves unverified. |
| **D4** | 4 | Auditing the ISMS against ISO/IEC 27001 as criteria | **25.0** | Auditing clauses 4 through 10 as the yardstick rather than the syllabus — scope, leadership, the whole of clause 6, the Statement of Applicability, support, operation and measurement — together with AI systems inside ISMS scope, control effectiveness under non-determinism, and the boundary between ISMS and AI management system conformity. |
| **D5** | 5 | Findings, reporting, follow-up and management review | **17.5** | Determining whether evidence constitutes a nonconformity and whether findings are systemic; classifying against a declared scheme; writing a defensible nonconformity statement; disclosing AI-assisted method in the audit report; judging corrective action adequacy; verification and closure; and what must reach clause 9.3 management review. |

Weights sum to **100.0**.

---

## 2. MODULES

`modules (id, certification_id, title, description, order_index, estimated_minutes, slug)`

**`order_index` aligns 1:1 to domains** — module K ↔ domain DK. That shared index
is the module → domain → tasks → task_concepts reachability fallback.

| order | slug | title | est. min | lessons |
|---|---|---|---|---|
| 1 | `ia-audit-function` | The Audit Function and Its Boundaries | 110 | 5 |
| 2 | `ia-audit-programme` | Managing the Audit Programme | 155 | 7 |
| 3 | `ia-conducting-the-audit` | Conducting the Audit | 200 | 9 |
| 4 | `ia-auditing-the-isms` | Auditing the ISMS Against ISO/IEC 27001 | 220 | 10 |
| 5 | `ia-findings-and-follow-up` | Findings, Reporting and Follow-up | 155 | 7 |

**Total: 38 lessons, ~840 minutes (14 hours).** One lesson per task.

**Content directory:** `certidemy-web/content/isms-ia/`, folders
`01-ia-audit-function/` … `05-ia-findings-and-follow-up/`.

### Two scaffold warnings

> **`modules_slug_unique` is TABLE-WIDE, not scoped to `certification_id`.** That
> is why every slug above carries the `ia-` prefix. The slug must equal the
> content folder name **minus its `NN-` prefix** and must match `module_slug` in
> every lesson's frontmatter. A typo here loads lessons into nothing, silently.

> **The deterministic module-UUID convention in `CERT-SCHEMA-GUIDE` §6 does not
> apply.** It used repeating-digit UUIDs and those slots are exhausted — `AIMS-F`
> took a random UUID instead. ISMS-IA does the same, so the `on conflict (id)`
> idempotency pattern in the guide's example must be rewritten before use.

---

## 3. TASKS — ATTRIBUTE TABLE

`tasks (certification_id, domain_id, code, statement, criticality, frequency,
bloom_level, is_exam_scope, is_simulation_candidate, knowledge, skills,
abilities, order_index)`

**`order_index` is globally sequential 1..38 across the whole cert**, not
per-domain. **`is_exam_scope = true` and `is_simulation_candidate = false` for all
38** — no task in this credential is a simulation candidate, and none is Bloom 5.

**Frequency rationale:** an internal auditor does not audit daily. `occasional` is
the honest cadence for programme-level and boundary work; `weekly` for the
fieldwork tasks, which recur through an audit cycle. `daily` and `per_sprint` are
not used — the first would overstate the rhythm, the second is Scrum-flavoured.

| idx | code | bloom | crit | freq | statement |
|---|---|---|---|---|---|
| 1 | 1.1 | `2_understand` | medium | occasional | Distinguish first-party, second-party and third-party audits by purpose, criteria and who may conduct them — and distinguish the clause 9.2 internal audit requirement from the Annex A 5.35 independent review control. |
| 2 | 1.2 | `4_analyze` | medium | occasional | Determine which ISO 19011 audit principle governs where two of them pull against each other in a given situation. |
| 3 | 1.3 | `4_analyze` | **high** | occasional | Determine whether a proposed internal auditor assignment preserves objectivity and impartiality, given that auditor's other duties in the organization. |
| 4 | 1.4 | `4_analyze` | medium | occasional | Identify the competence gaps in an audit team against a given audit's scope, including the technology competence a remote or hybrid audit demands. |
| 5 | 1.5 | `2_understand` | **high** | occasional | Distinguish what ISO 19011 provides, what ISO/IEC 27001 requires and what ISO/IEC 17021-1 governs — and where ISO/IEC 27001's terms are actually defined. |
| 6 | 2.1 | `4_analyze` | **high** | occasional | **Determine audit programme objectives** from the organization's ISMS objectives, its information security risks, and the results of previous audits. |
| 7 | 2.2 | `4_analyze` | **high** | occasional | Determine risk-based frequency and priority across the areas within ISMS scope. |
| 8 | 2.3 | `3_apply` | **high** | weekly | Define the scope, criteria and objectives of an individual audit within the programme. |
| 9 | 2.4 | `3_apply` | medium | weekly | Select on-site, remote or hybrid auditing methods for a given audit against the factors ISO 19011 sets out. |
| 10 | 2.5 | `3_apply` | medium | occasional | Determine audit team composition and resourcing for a given audit. |
| 11 | 2.6 | `4_analyze` | **high** | occasional | Determine whether an audit programme satisfies clause 9.2, including what "planned intervals" requires and does not require. |
| 12 | 2.7 | `4_analyze` | medium | occasional | Determine how AI systems within the ISMS scope change the audit programme's risk profile and its prioritisation. |
| 13 | 3.1 | `4_analyze` | **high** | weekly | Determine what degree of verification collected information carries, and what reliance a finding can therefore place on it. |
| 14 | 3.2 | `4_analyze` | **high** | weekly | Determine a sampling approach and judge whether a sample supports the conclusion drawn from it. |
| 15 | 3.3 | `4_analyze` | **high** | weekly | Assess the reliability of evidence obtained through remote auditing methods. |
| 16 | 3.4 | `3_apply` | medium | weekly | Select the evidence-gathering method that fits the evidence sought. |
| 17 | 3.5 | `3_apply` | medium | weekly | **Select the question form that elicits evidence rather than confirmation** in a given interview situation. |
| 18 | 3.6 | `4_analyze` | **high** | weekly | **Determine whether an Annex A control operates as claimed** in the Statement of Applicability. |
| 19 | 3.7 | `4_analyze` | medium | occasional | Determine when control testing has reached the boundary of an ISMS audit and become a technical assessment. |
| 20 | 3.8 | `4_analyze` | **high** | weekly | Determine what an AI-assisted evidence process establishes and what it leaves unverified. |
| 21 | 3.9 | `3_apply` | **high** | weekly | Maintain traceability from an evidence source through to the finding it supports. |
| 22 | 4.1 | `4_analyze` | **high** | occasional | Determine whether a declared ISMS scope is complete and defensible against clause 4. |
| 23 | 4.2 | `4_analyze` | **high** | occasional | **Determine whether evidence shows top management has demonstrated the leadership, policy and role assignments clause 5 requires.** |
| 24 | 4.3 | `4_analyze` | **high** | weekly | **Determine whether an organization's risk assessment, risk treatment, information security objectives and planning of changes conform to clause 6.** |
| 25 | 4.4 | `4_analyze` | **high** | weekly | Determine whether a Statement of Applicability is consistent with the risk treatment decisions behind it. |
| 26 | 4.5 | `3_apply` | medium | weekly | **Select the evidence that would establish conformity with a given clause 7 requirement** for competence, awareness or documented information. |
| 27 | 4.6 | `4_analyze` | **high** | weekly | **Determine whether operational planning and control and the clause 9.1 measurement arrangements are operating as planned.** |
| 28 | 4.7 | `3_apply` | medium | occasional | Determine whether the organization has addressed the climate change consideration Amendment 1:2024 adds to clause 4.1. |
| 29 | 4.8 | `4_analyze` | **high** | weekly | Identify AI systems and AI-derived assets inside the ISMS scope that the asset inventory has not captured. |
| 30 | 4.9 | `4_analyze` | medium | occasional | Determine whether an Annex A control still operates as claimed where the process it protects has become non-deterministic. |
| 31 | 4.10 | `4_analyze` | medium | occasional | Distinguish ISMS conformity from AI management system conformity where the two scopes overlap. |
| 32 | 5.1 | `3_apply` | medium | weekly | Classify a finding against the audit programme's declared classification scheme. |
| 33 | 5.2 | `4_analyze` | **high** | weekly | Determine whether the evidence constitutes a nonconformity, and whether a set of findings indicates a systemic rather than an isolated failure. |
| 34 | 5.3 | `3_apply` | **high** | weekly | **Select the nonconformity statement that correctly links the evidence to the requirement it fails.** |
| 35 | 5.4 | `4_analyze` | medium | occasional | Determine what an audit report must disclose about AI-assisted evidence processing so that a reader can judge the reliability of the evidence. |
| 36 | 5.5 | `4_analyze` | **high** | occasional | Determine whether a proposed correction, root cause analysis and corrective action adequately address a nonconformity. |
| 37 | 5.6 | `4_analyze` | **high** | occasional | Determine the verification approach for a corrective action and whether a finding may be closed. |
| 38 | 5.7 | `3_apply` | medium | occasional | Determine which audit results clause 9.3 requires to reach management review. |

**Criticality distribution:** 22 high, 16 medium, 0 low. High is assigned where
getting the task wrong **invalidates the audit or the finding** — a compromised
assignment (1.3), a false attribution (1.5), an inadequate sample (3.2), an
unsupported nonconformity (5.2). Medium is assigned where an error degrades the
audit without voiding it. Nothing here is low; a task that could be would not have
survived the JTA.

---

## 4. K/S/A

**Generator input.** `ISMS-F` task 5.2's `skills` phrasing propagated a false
attribution into generated items, and the generator reasserted it across three
regeneration attempts from corrected source. Every K field below names its source
where the claim sits on the ISO 19011 / ISO/IEC 27001 / ISO/IEC 17021-1 seam, and
states what a document does **not** say where that is the competence. Tasks where
this is load-bearing are marked **⚠ ATTR**.

`ksa_is_provisional` has no approval path and `verify-cert` does not check it.
**These 114 fields are read, not generated.**

### D1

**1.1** · K — ISO 19011:2026 Table 1 sets out first-, second- and third-party audits, and clause 3.1 notes internal audits are conducted by or on behalf of the organization itself while third-party audits are conducted by independent auditing organizations; ISO/IEC 27001 carries **two obligations that both speak of planned intervals** — clause 9.2 internal audit, and Annex A control **5.35** requiring the approach to managing information security to be reviewed independently. Satisfying one does not satisfy the other. · S — place a described audit or review into the correct category and determine which obligation an activity discharges. · A — treats the internal audit as serving the organization rather than as rehearsal for a certification body.

**1.2** · K — the **seven** principles of ISO 19011:2026 — integrity (4.2), fair presentation (4.3), due professional care (4.4), confidentiality (4.5), independence (4.6), evidence-based approach (4.7), risk-based approach (4.8) — and that **the standard states no order of precedence among them**; clause 4.1 says only that adherence is fundamental and that Clauses 5 to 7 are based on all seven. · S — identify which principle is decisive where two point in different directions, and state why. · A — treats a conflict between principles as requiring judgment rather than a lookup.

**1.3 ⚠ ATTR** · K — ISO/IEC 27001 clause 9.2.2 b) requires the organization to *select auditors and conduct audits that ensure objectivity and the impartiality of the audit process*, and that is the whole of what that standard says; ISO 19011:2026 clause 4.6 states auditors **should be independent of the activity being audited wherever practicable**, and that **where an internal auditor cannot be, every effort should be made to remove bias and encourage objectivity** rather than the assignment being barred; and **neither document contains a rule that an auditor may not audit their own work** — that formulation is practice convention and must not be attributed to either. · S — examine an auditor's other responsibilities against the area to be audited, determine whether objectivity survives, and identify what arrangement would restore it. · A — treats independence as a property established per assignment, not a status an auditor holds.

**1.4** · K — the competence elements of ISO 19011:2026 clause 7.2 — personal behaviour (7.2.2), knowledge and skills (7.2.3) — the ISMS-specific additions in ISO/IEC 27007, and that **7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools and emerging technology to conduct audits, naming artificial-intelligence-based evaluation tools as its example**; Annex A.16 adds technical skills to use the appropriate technology while auditing. · S — compare a team's competence against an audit's scope and technology profile and identify the gap. · A — accepts that team competence can cover an individual gap, and that a gap left unclosed becomes a limitation on the audit's conclusions.

**1.5 ⚠ ATTR** · K — ISO 19011 states guidance and not requirements, so nothing is ever *required by* it and no organization or person is certified to it; its Introduction states **ISO/IEC 17021-1 provides requirements for auditing management systems for third-party certification** while 19011 concentrates on first- and second-party audits; ISO/IEC 27001 contains no conformity assessment provisions; and ISO/IEC 27001 clause 3 delegates its terms to ISO/IEC 27000 through an **undated** normative reference, so *nonconformity*, *correction*, *corrective action* and *audit* are not defined inside ISO/IEC 27001 at all. · S — attribute a statement about auditing to the document that actually contains it. · A — will not assert a requirement without knowing which document states it.

### D2

**2.1** · K — the inputs a programme's objectives derive from, and that ISO/IEC 27001 clause 9.2.2 requires the organization, when establishing the internal audit programme, to consider **the importance of the processes concerned and the results of previous audits**; ISO 19011:2026 clause 5.2 covers establishing programme objectives. · S — ✎ determine which programme objectives a described organization's ISMS objectives, risk profile and audit history support. · A — treats programme objectives as derived from the organization rather than copied from a template.

**2.2** · K — ISO 19011:2026 clause 4.8 states the risk-based approach **should substantively influence the planning and implementation of the audit programme, and the planning, conducting and reporting of audits**, so that audits focus on matters significant to the audit client; clause 5.3 covers determining and evaluating programme risks and opportunities; and ISO/IEC 27001's Introduction states that **the order in which its requirements are presented does not reflect their importance**. · S — allocate audit frequency and depth across areas of differing risk and importance, and justify the allocation. · A — resists equal-time coverage as a proxy for fairness, and clause order as a proxy for risk.

**2.3 ⚠ ATTR** · K — ISO 19011:2026 defines *audit scope* (3.6) as the extent and boundaries of an audit, generally including physical **and virtual** locations, functions, units, activities, processes and the time period covered; *audit criteria* (3.8) as the set of requirements against which objective evidence is compared; clause 5.5.2 covers defining objectives, scope and criteria for an individual audit; and **ISO/IEC 27001 clause 9.2.2 a) requires the organization to define the audit *criteria and scope* for each audit — it does not require audit objectives.** ISO/IEC 42001's own 9.2.2 a) adopted objectives where ISO/IEC 27001 did not. · S — ✎ determine whether a described audit's scope, criteria and objectives are consistent with one another and with the programme. · A — states scope boundaries explicitly rather than leaving them to be inferred.

**2.4** · K — ISO 19011:2026 defines **remote auditing method** (3.4) as a method for conducting audit activities from any place other than the auditee's location, **sourced from ISO/IEC TS 17012:2024**, with notes covering combination with on-site methods, virtual locations, and auditing one site from another; method selection is clause 5.5.3; and the detailed guidance, including the additional risks remote methods introduce, is in **Annex A.16** rather than the body. · S — select a method for a described audit and name the factor that decided it. · A — treats method choice as carrying its own risks rather than as a logistics decision.

**2.5** · K — the roles an audit team may contain, what a technical expert may and may not do, and that programme resources include access to adequate information and communication technology. · S — ✎ determine an appropriate team composition for a described audit scope and what each role contributes to it. · A — treats resourcing as a constraint on what the audit can conclude.

**2.6** · K — clause 9.2.1 requires internal audits at planned intervals to provide information on whether the ISMS conforms to the organization's own requirements and the standard's, and is effectively implemented and maintained; clause 9.2.2 requires the programme to include frequency, methods, responsibilities, planning requirements and reporting, with documented information available as evidence; and **the standard sets no numeric interval**. · S — examine a described programme against clause 9.2 and determine whether the interval and coverage are defensible. · A — will not accept "annual" as self-justifying.

**2.7** · K — why systems whose behaviour changes without a change request disturb an interval set on a change-controlled assumption, and why model providers enter the programme through the Annex A supplier-relationship controls. · S — adjust a programme's frequency and priority for a scope that has acquired AI systems since the programme was set. · A — treats a model update as a change to the audited environment.

### D3

**3.1** · K — ISO 19011:2026 defines **audit evidence** (3.10) as records, statements of fact or other information relevant to the audit criteria **and verifiable**, and separately defines **objective evidence** (3.9) as data supporting the existence or verity of something — two different defined terms, and clause 3.1's definition of *audit* uses the latter; clause 6.4.7 states **only information subject to some degree of verification should be accepted as audit evidence, and where that degree is low the auditor should use professional judgement to determine the degree of reliance placed on it**. · S — determine what a described item of information establishes and what reliance a finding can place on it. · A — does not let relevance substitute for verifiability, and does not treat verification as binary.

**3.2** · K — ISO 19011:2026 clause 4.7 states audit evidence should be based on samples because an audit runs for a specified duration with finite resources, and that **appropriate use of sampling is closely related to the confidence that can be placed in the audit conclusions**; clause 6.4.7 requires collection by means of appropriate sampling; sampling guidance is Annex A.6. · S — judge whether a described sample supports the conclusion drawn, and identify what would strengthen it. · A — reports the conclusion the sample supports rather than the one it was taken to support.

**3.3** · K — Annex A.16 states the use of remote auditing methods can introduce additional risks and opportunities to the audit process, naming data security, confidentiality and contingency planning for technology failure among the considerations; and the limitations electronic and remotely-obtained evidence carries against the 6.4.7 verification test. · S — assess a described piece of remotely-obtained evidence and determine what it establishes. · A — distinguishes what was seen from what was shown.

**3.4** · K — ISO 19011:2026 clause 6.4.7 names interviews, observations and review of documented information among the methods of collecting information, and what each can and cannot establish. · S — select the method that produces the evidence a given audit trail needs. · A — does not accept a document as evidence that a process runs.

**3.5** · K — how question form shapes the evidential value of an answer; interview guidance is Annex A.17. · S — ✎ determine which of several question forms would produce evidence rather than confirmation in a described interview. · A — does not treat agreement as corroboration.

**3.6** · K — the difference between a control that is designed and one that operates, and that ISO/IEC 27001 clause 6.1.3 d) requires the Statement of Applicability to record **whether each necessary control is implemented or not** — which is the claim the auditor tests. · S — ✎ determine which evidence would establish whether a described control operates as claimed, and what a given result shows. · A — audits the claim the organization made, not the control the auditor would have chosen.

**3.7** · K — ISO/IEC 27001 Annex A control **8.34** requires audit tests and other assurance activities involving assessment of operational systems to be **planned and agreed between the tester and appropriate management**; and where management system auditing stops and technical assessment of controls begins. · S — determine whether a proposed test is within the audit's competence, scope and agreed terms. · A — escalates and seeks agreement rather than improvising past the boundary.

**3.8** · K — ISO 19011:2026 clause **7.2.3 item 10** requires auditors to *understand the appropriateness and consequences of using information and communications technology tools, and emerging technology to conduct audits*, giving **artificial-intelligence-based evaluation tools** as its example; under clause 6.4.7 an AI-produced summary of a document the auditor did not open carries a low degree of verification, so professional judgement must set the reliance placed on it; an AI tool selecting which records to examine is making a sampling decision, which clause 4.7 ties to confidence in the audit conclusions; and accountability for the conclusion remains with the auditor regardless of the tool. · S — determine, for a described AI-assisted step, what it established and what remains unverified. · A — treats an AI tool as a method whose reliability must be evaluated, not as a source of evidence.

**3.9** · K — clause 6.4.7 requires audit evidence leading to audit findings to be **recorded**, and what a working-paper record must contain for a finding to be defensible later; audit-related records are clause 5.5.7. · S — ✎ determine what a working-paper record must contain for a finding to remain defensible to a second auditor. · A — treats a finding without a traceable source as unusable.

### D4

**4.1** · K — clause 4.3 requires the scope determination to consider the 4.1 issues, the 4.2 requirements, and **the interfaces and dependencies between activities performed by the organization and those performed by other organizations**, with the scope available as documented information; and **Clause 1 Scope** — not clause 4 — states that excluding any requirement in Clauses 4 to 10 is not acceptable when conformity is claimed. · S — examine a declared scope against the organization described and determine what has been left out. · A — treats an undeclared interface as the most likely place a scope fails.

**4.2** · K — the eight things clause 5.1 requires top management to **demonstrate**; clause 5.2 requires the policy to be appropriate to purpose, to include objectives or provide the framework for setting them, and to include commitments to satisfy applicable requirements and to continual improvement — and separately to be available as documented information, communicated internally, and available to interested parties as appropriate; clause 5.3 requires responsibilities and authorities to be assigned **and communicated**, with specific authority for ISMS conformity and for reporting performance to top management. · S — determine what evidence would establish that a described organization's top management has demonstrated a given clause 5.1 element. · A — distinguishes a documented commitment from a demonstrated one.

**4.3 ⚠ ATTR** · K — clause 6.1.2 requires a defined risk assessment process establishing risk acceptance criteria and criteria for performing assessments, producing consistent, valid and comparable results, with risk owners identified; **ISO/IEC 27001 does not require a risk register** — 6.1.2 and 6.1.3 require documented information *about the processes*, and clauses 8.2 and 8.3 require it *of the results*; **NOTE 2 to 6.1.3 directs users to Annex A to ensure no necessary controls are overlooked and NOTE 3 states the Annex A list is not exhaustive** — Annex A is a completeness check, not a catalogue to select from; clause 6.2 sets seven requirements on objectives and five on the planning to achieve them; and **clause 6.3 Planning of changes is a real numbered requirement that does not appear on the standard's own contents page**. · S — determine whether a described clause 6 process meets the requirements and whether its outputs are traceable to the treatment decisions. · A — audits the process the organization operates, not the one the auditor would design.

**4.4** · K — the **four** elements clause 6.1.3 d) requires the Statement of Applicability to contain — the necessary controls, justification for their inclusion, whether they are implemented or not, and justification for excluding any Annex A control; and clause 6.1.3 f) requires **risk owners'** approval of the treatment plan and acceptance of the residual risks. · S — trace an inclusion or exclusion back to the risk treatment decision that should support it. · A — treats an unjustified exclusion as a finding regardless of how reasonable it sounds.

**4.5** · K — clause 7.2 requires the necessary competence to be determined, persons to be competent on the basis of education, training or experience, actions taken where applicable with their effectiveness evaluated, and documented information **retained as evidence of competence**; what clause 7.3 requires persons to be aware of; and the three parts of clause 7.5. · S — select the evidence that would establish conformity with a given clause 7 requirement. · A — distinguishes attendance from competence.

**4.6** · K — clause 6 defines the processes and clause 8 performs them — 6.1.2 defines the risk assessment process, 8.2 performs assessments at planned intervals or on significant change; 6.1.3 defines the treatment process, 8.3 implements the plan; and clause 9.1 requires the organization to determine six things, including **who shall monitor and measure** and **who shall analyse and evaluate**. · S — determine whether described operational evidence shows the planned arrangements actually running. · A — looks for the operation of a plan rather than the existence of one.

**4.7** · K — **ISO/IEC 27001:2022/Amd 1:2024, Climate action changes**, published February 2024, adds exactly two things. To clause 4.1: *"The organization shall determine whether climate change is a relevant issue."* To clause 4.2, as **NOTE 2**: *"Relevant interested parties can have requirements related to climate change."* The amendment is priced at one page and its normative body is those two sentences. **The 4.1 addition is a determination requirement, not a treatment requirement** — *shall determine whether* is satisfied by either answer, so a documented determination that climate change is not relevant is full compliance. The 4.2 addition is a note, and notes are not requirements; the existing note on legal, regulatory and contractual requirements becomes NOTE 1. The term in the standard is **climate change**, not environmental conditions. · S — determine whether a described organization has addressed the requirement and what evidence would show it. · A — checks the named requirement rather than a paraphrase of it.

**4.8** · K — the asset classes an AI system introduces, why they are routinely absent from inventories built before the system arrived, and that Annex A 5.9 requires an inventory of information and other associated assets **including owners**. · S — determine from a described environment which AI-related assets fall inside scope and are unaccounted for. · A — treats an absent asset class as more likely than an absent control.

**4.9** · K — why a control validated against a deterministic process may not hold when the same process produces varying output, and what evidence of continued effectiveness looks like in that case. · S — determine whether described evidence still supports an effectiveness claim after the protected process changed character. · A — treats "the control passed last year" as a statement about last year.

**4.10 ⚠ ATTR** · K — the two standards share the harmonized structure but diverge in text at points that change what an auditor must look for: **27001 9.2.2 a) requires audit criteria and scope where 42001 requires objectives, criteria and scope**; 27001 reports results to *relevant management*, 42001 to *relevant managers*; **27001's management review inputs additionally require fulfilment of objectives, feedback from interested parties, and risk assessment results and treatment plan status — none of which 42001 requires**; 27001 9.1 names who shall monitor and who shall analyse, 42001 does not; 27001 requires risk owners' approval of the treatment plan where 42001 requires designated management approval; and 42001 alone carries the AI system impact assessment at 6.1.4, an input to its risk assessment. ISO 19011:2026 defines a **combined audit** (3.2) as one carried out together at a single auditee on two or more management systems. **ISO/IEC 42001 Annex D.2 is informative** and discusses integrated implementation with ISO/IEC 27001. · S — determine which standard a described requirement or finding belongs to when both systems are in scope. · A — does not accept conformity with one system as evidence of conformity with the other.

### D5

**5.1 ⚠ ATTR** · K — ISO/IEC 27001 uses the term *nonconformity* and requires reaction, correction and corrective action at clause 10.2, but **defines no severity scheme and does not use *observation* or *opportunity for improvement* as finding categories at all**; a major/minor distinction comes from third-party certification practice under ISO/IEC 17021-1, and an internal programme adopts a scheme by its own choice; the term *nonconformity* is defined in ISO/IEC 27000, not in ISO/IEC 27001; and ISO 19011:2026 clause 3.8 Note 1 records that where the audit criteria are legal requirements, **compliance** and **non-compliance** are often used in a finding rather than conformity language. · S — classify a described finding against a scheme that has been given. · A — applies the programme's declared scheme rather than a remembered one.

**5.2** · K — what must be true for evidence to establish a nonconformity, and that ISO/IEC 27001 clause 10.2 b) 3) itself directs the organization to determine whether **similar nonconformities exist or could potentially occur** — the standard's own hook for systemic reasoning; generating audit findings is ISO 19011:2026 clause 6.4.8. · S — determine from a set of described findings whether a systemic failure is present. · A — does not raise a nonconformity on absent evidence without first establishing that evidence should exist.

**5.3** · K — what a statement must contain for the recipient to act on it without the auditor present, and that ISO 19011:2026's fair presentation principle (4.3) requires findings, conclusions and reports to reflect the auditing activities truthfully and accurately. · S — ✎ determine which of several candidate statements names the requirement, the evidence and the gap without prescribing the remedy. · A — states what was found rather than what should be done.

**5.4** · K — what an audit report contains under ISO 19011:2026 clause 6.5.1, and why a method that shaped **which evidence was examined** belongs in it while an incidental tool does not — following from clause 6.4.7's requirement that the degree of reliance placed on low-verification evidence be a matter of stated professional judgement. · S — determine what a described audit must disclose about its AI-assisted steps for its conclusions to be assessable. · A — treats an undisclosed method that shaped the evidence as a defect in the report.

**5.5** · K — clause 10.2 a) requires reacting to the nonconformity including action to control and correct it and to deal with the consequences, while 10.2 b) requires evaluating the need for action to **eliminate the causes so it does not recur or occur elsewhere** — the operative distinction between correction and corrective action, neither of which is defined inside ISO/IEC 27001; and corrective actions shall be **appropriate to the effects** of the nonconformities encountered. · S — determine whether a described corrective action would prevent recurrence or only close the instance. · A — does not accept retraining as a root cause response by default.

**5.6** · K — ISO/IEC 27001 clause 10.2 d) requires the **effectiveness** of any corrective action taken to be reviewed, and ISO 19011:2026 clause 6.7 covers conducting the audit follow-up. · S — determine whether described evidence supports closing a finding. · A — does not close on a commitment.

**5.7** · K — clause 9.2.2 c) requires audit results to be reported to **relevant management**, and clause **9.3.2 d) 3)** places audit results among the management review inputs, nested under feedback on information security performance alongside nonconformities and corrective actions, monitoring and measurement results, and fulfilment of information security objectives. · S — select from a described audit's outputs what must reach management review. · A — treats the review input as the point of the audit rather than its administrative tail.

---

## 5. PROFILE

`v_cognitive_profile` splits each domain's `weight_pct` equally across its
exam-scoped tasks and sums by Bloom level. **Computed from the spine; the scaffold
recomputes it and that number is the one that counts.**

| Domain | Weight | Tasks | Per task | understand | apply | analyze |
|---|---|---|---|---|---|---|
| D1 | 12.5 | 5 | 2.500 | 2 → 5.00 | — | 3 → 7.50 |
| D2 | 20.0 | 7 | 2.857 | — | 3 → 8.57 | 4 → 11.43 |
| D3 | 25.0 | 9 | 2.778 | — | 3 → 8.33 | 6 → 16.67 |
| D4 | 25.0 | 10 | 2.500 | — | 2 → 5.00 | 8 → 20.00 |
| D5 | 17.5 | 7 | 2.500 | — | 3 → 7.50 | 4 → 10.00 |
| | **100** | **38** | | **5.00** | **29.40** | **65.60** |

| cert | remember | understand | apply | analyze |
|---|---|---|---|---|
| ISMS-F | 10.39 | 56.77 | 22.68 | 10.17 |
| AIMS-F | none | 46.93 | 41.26 | 11.80 |
| SD-AI-I *(heaviest L1)* | none | 20.10 | 49.60 | 30.30 |
| **ISMS-IA** | **none** | **5.00** | **29.40** | **65.60** |

**Falsification test (BoK §7) passes:** analyze ≥ 55 · remember 0 · understand < 25.

**Proposed exam: 50 items / 90 min / 75% provisional.** 1.32 items per task
against `ISMS-F`'s 0.82, the catalogue's thinnest — deliberate design, and the
scheme states it. **Reconcile `passing_score_pct` at Stage 12; it defaults to 70.00
and omitting the column silently seeds a cert that passes at 70.**

---

## 6. CARRIED INTO STAGE 5

1. **`ISMS-F` task 2.3** reads *"the environmental-conditions consideration introduced by Amendment 1:2024"*. The amendment says **climate change**. A live cert teaches the wrong term for a two-sentence amendment
2. **`ISMS-F` lesson 3.6** — check whether the NOTE 1 / NOTE 3 misnumbering reached the published lesson
3. **`ISMS-IA_BoK_v1.md`** — §3 Layer 1 to ISO's two-item change list; add ISO/IEC TS 17012:2024; §4 own-work row replaced by 1.3's K field; Layer 6 cites 42001 **Annex D.2 informative**
4. **`concepts.slug` uniqueness** — one query for `CERT-SCHEMA-GUIDE`; the `ia-` prefix stands either way
5. **`modules_slug_unique` is table-wide** and the repeating-digit UUID convention is retired — §2
6. **ISO/IEC 27007 DIS** and **ISO/IEC 27090** (FDIS ballot closed 2026-08-18)
7. `ksa_is_provisional` has no approval path and `verify-cert` does not check it

## 7. NEXT

`ISMS-IA_CONCEPTS_v2.0.md` (169 rows) → `SCHEME-ISMS-IA.md` → scaffold migrations
from tip **187** — three, not two: cert row, spine, blueprint. Editor-first.
**Introspect `concepts`, `tasks`, `domains` and `modules` before any SQL.**

*End of ISMS-IA JTA v2.0 — launch baseline, locked 2026-08-09.*
