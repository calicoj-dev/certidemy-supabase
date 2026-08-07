# AIMS-F_JTA_v1.2.md — Job-Task Analysis

**Credential:** ISO/IEC 42001 Foundation
**Code:** `AIMS-F` · **UUID:** `de046fa6-e627-48c1-85d8-9df226d144f4`
**Tier:** Level I — single-correct-answer MCQ, Bloom ceiling `4_analyze`
**Family:** `governance-service-management`, `sort_order` 3
**Stage:** 2 of `CERT-CREATION.md` — **DRAFT, not locked.** Stage 3 external review
is a gate; Stage 4 locks.
**Supersedes:** `AIMS-F_JTA_v1.1.md`
**Date:** 2026-08-06 · **BoK:** `BOK-AIMS-F.md`, signed 2026-08-06

---

## 0. WHAT CHANGED FROM v1, AND WHY

v1 carried a verification block listing six structural assertions taken from
secondary sources. **The standard text was then read directly. Two of the six were
wrong and one task's entire teaching point was wrong.** The block is struck; every
structural fact below is verified against ISO/IEC 42001:2023 itself.

| v1 said | Actual | Fixed in |
|---|---|---|
| Annex A: 38 controls in **9 objectives** | 38 controls in **9 categories (A.2–A.10)** carrying **10 objectives** — A.6 splits into A.6.1 and A.6.2, each with its own objective | 4.1 |
| Annex B is implementation guidance (confirm not normative) | **Annex B IS normative.** B.1 exempts the guidance from SoA justification, but the annex carries normative status | 4.1 |
| Roles: provider / developer / user | **Six categories** — AI providers, AI producers, AI customers, AI partners, AI subjects, relevant authorities. Developer is a subtype of producer. And clause 4.1 makes role determination a **`shall`** | 1.2 |
| 2.7: the axis is *direction of harm* — risk to the organization, impact on people | **False.** Clause 6.1.2 d) 1) already has risk analysis assess consequences to the organization, individuals **and societies**. And 6.1.4 requires impact results to be **considered in** the risk assessment. They are not parallel | **2.7, rewritten** |
| — | **Climate change is an explicit `shall`** in clause 4.1 | 2.1 |
| — | **Clause 8 re-states risk assessment, risk treatment and impact assessment as operational requirements.** Clause 6 defines; clause 8 performs | **new task 3.8** |

Also new: `4_analyze` tasks now cite **Annex D.2**, which states integration with
other management system standards is essential and names 27001 first — turning the
BoK's primary differentiator from an inference into a citation.

**The lesson, recorded because it generalises:** the external reviewer confirmed
five of the six assertions and flagged only the sixth, while stating that the
impact-assessment clause number came "from the standard text itself." It did not.
**A verification that cannot distinguish a read source from a summarised one
produces confidence, not assurance.**

---

## 0a. THE ATTRIBUTION RULE — binding on every K/S/A field below

Added in **v1.2**, from HANDOFF v5.5 §2 and §9.

ISMS-F's audit found the generator asserting ISO requirements from training
knowledge rather than from the text: *"27001 requires the risk register to be a
living document"* (the standard never mentions a risk register), *"certificates are
valid for three years"* (that is ISO/IEC 17021-1). **`item-pipeline.mjs` has no
attribution rule at all**, and `verify-cert` cannot see this class of error — all
29 invariants held through every finding.

**v5.5 §9.4 is why this belongs here and not only in the generator: K/S/A fields
are generator input.** Task 5.2's `skills` phrasing propagated a false attribution
into ISMS-F's exam items. Whatever these fields say is what the generator asserts.

**The rule:**

> **1.** State what the standard *requires* only where it is a requirement in the
> text. Preserve the modal — `shall` is a requirement, `should` in Annex B is
> guidance, and a NOTE is neither.
> **2.** Where a widely-taught rule is an implication rather than the text,
> **attribute it to practice or to the document that does say it.**
> **3.** Where the source is another standard — 42006, 17021-1, 22989, 5338, 23894,
> 42005 — name that standard, never "the standard".

### Four v1.1 fields corrected under this rule

| Task | v1.1 said | Why it failed | v1.2 |
|---|---|---|---|
| **5.5** | "Certification proceeds through stage 1 and stage 2, then surveillance and recertification" | **42001 contains none of this.** Same class as the three-year-validity defect | Attributed to ISO/IEC 42006 and 17021-1 |
| **1.1** | concept `certifiable-management-system` | An inference from Annex D and the existence of 42006, not text | → `management-system-certification-basis`, attributed |
| **4.4** | event logging "**required** at minimum while in use" | A.6.2.8 requires the organization to **determine at which phases** logging **should** be enabled | Modal restored |
| **5.1** | "performance means both…" | True, but it is **Note 3 to a definition**, not a requirement | Marked as a note |

**Task 5.2 was checked and is clean.** It uses the standard's own words —
*objectivity and impartiality of the audit process* — and never asserts the
own-work rule, which is ISO 19011 guidance and the exact false attribution ISMS-F
shipped. **Do not let a reviewer "improve" it by adding the own-work rule.**

### Standing instruction for Stage 7

**The attribution rule must be in `item-pipeline.mjs` before AIMS-F generates a
single item** (v5.5 §0). It is its own session. Recorded in §7 so it cannot be
skipped by a session that arrives at generation without reading v5.5.

---

## 1. Exam blueprint

| Domain | Title | Weight | Tasks | Items on form |
|---|---|---|---|---|
| D1 | AI management systems and the AI landscape | 15.0% | 6 | **6** |
| D2 | Context, leadership and planning | 22.5% | 8 | **9** |
| D3 | Support and operation | 20.0% | **8** | **8** |
| D4 | Annex A controls: structure and selection | 25.0% | 7 | **10** |
| D5 | Performance evaluation, improvement and certification | 17.5% | 6 | **7** |
| | **Total** | **100.0%** | **35** | **40** |

**Form:** 40 items · 80% pass · 60 minutes · closed book · open eligibility.

**The floor holds.** Thinnest domain carries 6 items — the BoK §4.5 minimum, set
from ISMS-F's live 6/7/9/11/7 allocation. Items per task is **1.14**; that is an
outcome, not a target.

**Disclosure owed in `SCHEME-AIMS-F.md`:** a 6-item domain cannot carry a
diagnostic subscore. Whole-form reliability governs the pass decision; per-domain
feedback is directional only. **ISMS-F has the same exposure and the same sentence
is owed there.**

### Weighting rationale

- **D4 at 25%** — Annex A is where a Foundation candidate does the most
  distinguishing work, and control *selection reasoning* is the durable skill.
  Deliberately below ISMS-F's 27.5% because 38 controls is a smaller surface
  than 93.
- **D2 at 22.5%** carries the assessment triad (2.5 / 2.6 / 2.7).
- **D1 at 15%**, the floor. Foundations are tested implicitly through every other
  domain — 2.2 is unanswerable without 1.2.
- **D3 at 20%** grew by one task without changing weight, because clause 8's
  operational restatement is a real competence with no home elsewhere.
- **D5 at 17.5%**.

---

## 2. Cognitive profile — a result, never a target

| Bloom | Tasks | Share |
|---|---|---|
| `1_remember` | 0 | 0% |
| `2_understand` | 17 | 48.6% |
| `3_apply` | 14 | 40.0% |
| `4_analyze` | 4 | 11.4% |
| `5_evaluate` / `6_create` | 0 | 0% |

**No `1_remember` tasks, and this is now forced rather than chosen.** Clause 2
makes ISO/IEC 22989:2022 a **normative reference** and clause 3 delegates its terms
to it — so *AI system* is **not defined anywhere in 42001**. There is no definition
in this document to recite. The BoK §5 citation rule and the Bloom floor arrive at
the same place from opposite directions.

**The weighted profile from `v_cognitive_profile` after scaffold is authoritative
and will differ from the table above**, because tasks weight by domain share rather
than count. Set `exam_blueprint` from the computed value. Never adjust the profile
to flatter the cert.

ISMS-F computes to remember 10.39 / understand 56.77 / apply 22.68 / analyze 10.17.
**AIMS-F must land meaningfully heavier at apply.** If it does not, this JTA is
describing a recall course and needs rework before scaffold.

---

## 3. Criticality and frequency — distributions, not constants

v1 marked **all 34 tasks `occasional` and 30 of 34 `high`.** A column with one
value carries no information and renders as noise in the JTA sheet and the
Blueprint Drawer.

| Frequency | Count | Tasks |
|---|---|---|
| `daily` | 3 | 3.3, 3.4, 5.1 |
| `weekly` | 6 | 2.6, 2.7, 3.5, 3.6, 3.8, 5.4 |
| `occasional` | 26 | the rest |

**2.6 and 2.7 at `weekly` is the substantive call.** In a live estate the impact
assessment is the *most frequently performed* obligation — every new system, every
material change, every retraining. Marking it `occasional` beside "write the AI
policy" understates the signature competence of the credential.

| Criticality | Count | Tasks |
|---|---|---|
| `high` | 25 | the rest |
| `medium` | 9 | 1.3, 1.5, 2.1, 2.4, 3.1, 3.3, 4.3, 5.2, 5.3 |
| `low` | 1 | 3.2 |

**5.2 is `medium` deliberately.** At Foundation the competence is recognising the
internal-audit requirement; `AIMS-IA` owns performing it.

---

## 4. The four `4_analyze` tasks carry the differentiator

BoK §2.3 rules 27001 integration as primary and requires it to shape the JTA.
**This is where that happens**, and **Annex D.2 is the textual basis.**

| Task | The analysis |
|---|---|
| **2.7** | Which assessment does this situation require, and how do the two relate? |
| **3.7** | Which of an existing ISMS's clause 7–8 machinery carries over, and which does not? |
| **4.7** | Where does one control satisfy both Annex A sets, and where is that a mistake? |
| **5.6** | Can an integrated 27001 + 42001 audit programme share evidence, and where can it not? |

Three of four are integration tasks. **A candidate who has not thought about 27001
alongside 42001 cannot reach analyze in D3, D4 or D5.**

---

# DOMAIN 1 — AI management systems and the AI landscape

**Weight:** 15.0% · **Tasks:** 6 · **Items:** 6 · **Concepts:** 27

---

### Task 1.1 — Explain what an AI management system is and what a management system standard does

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `ai-management-system`, `management-system-standard`, `pdca-cycle`, `management-system-certification-basis` |

**K:** An AIMS is the interrelated elements of an organization — policies,
objectives, processes — through which it governs responsible development,
provision and use of AI; the standard specifies requirements for that system, not
for the technology; it deliberately avoids prescribing management processes and
expects the organization to focus on what is unique to AI. **Certification of an
organization against 42001 is possible because ISO/IEC 42006 sets requirements for
the bodies that audit and certify an AIMS — 42001 itself does not describe
certification.**
**S:** Distinguish a management system requirement from a technical control.
**A:** Systems thinking over tool thinking.

---

### Task 1.2 — Determine the organization's roles with respect to its AI systems

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `ai-provider-role`, `ai-producer-role`, `ai-customer-role`, `ai-partner-role`, `ai-subject-role`, `role-determination-requirement`, `role-dependent-applicability` |

**K:** Determining roles is a **requirement**, not advice; the role categories are
AI providers, AI producers, AI customers, AI partners, AI subjects and relevant
authorities, with developers, designers, operators, testers and deployers all
sitting **inside the producer category**; one organization can hold several roles
at once and its role determines which requirements and controls apply and to what
extent. Role can also be shaped by data-processing obligations.
**S:** Given a described organization and an AI system, identify which roles apply
and what follows for applicability.
**A:** Resistance to the assumption that one label fits the whole organization.

> **Corrected in v1.1.** v1 wrote *provider / developer / user*, which flattens a
> six-category taxonomy and promotes a subtype to a peer.

---

### Task 1.3 — Describe the AI system life cycle and why it anchors AIMS obligations

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `ai-system-life-cycle`, `life-cycle-stages`, `continuous-learning-behaviour`, `retraining-and-drift` |

**K:** Obligations attach across the whole life cycle rather than at release;
systems that learn continuously change their behaviour during use and need
specific consideration for that reason; performance can shift without continuous
learning through drift in production data, which is what triggers retraining;
ISO/IEC 5338 describes life cycle processes and the organization may define its
own stages.
**S:** Place a described activity at its life-cycle stage.
**A:** Rejection of the deploy-and-forget model.

---

### Task 1.4 — Explain the harmonised structure and how 42001 sits alongside 27001 and 9001

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `harmonised-structure`, `clauses-four-to-ten`, `integrated-management-system`, `iso-42001-27001-integration` |

**K:** 42001 applies the harmonised structure — identical clause numbers, titles
and core definitions — shared with 27001, 9001 and others, which is what makes
integrated implementation practical; **Annex D.2 states that integration is
essential rather than optional** and names 27001 first; the shared structure is
also why the *differences* are the part that needs teaching.
**S:** Identify which clause of 42001 corresponds to a named 27001 clause.
**A:** Reuse before rebuild.

> **Entry point for the integration weave.** Tasks 3.7, 4.7 and 5.6 assume it.

---

### Task 1.5 — Explain the regulatory drivers for an AIMS, and why certification is not compliance

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `regulatory-driver`, `eu-ai-act-overview`, `certification-is-not-compliance`, `voluntary-standard` |

**K:** 42001 is voluntary and certification to it does not by itself establish
compliance with any law; conformity generates *evidence* of responsibility and
accountability regarding the organization's role, which is a narrower claim; the
EU AI Act imposes obligations by risk tier on an independent timetable that **has
already moved once**.
**S:** Distinguish a claim an AIMS supports from one it does not.
**A:** Precision about what a certificate actually says.

> Teach the shape of the obligations. Dates are volatile content — §6 register.

---

### Task 1.6 — Distinguish an AIMS from model-level assurance and from AI ethics frameworks

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `aims-vs-model-assurance`, `aims-vs-ethics-framework`, `nist-ai-rmf-relationship`, `sector-application-annex-d` |

**K:** The standard specifies no fairness thresholds, evaluation methods, model
architectures or testing protocols — it requires a system for deciding those
things and catching them when they fail; NIST AI RMF is referenced as a
complementary description of roles across the life cycle, not a competitor; Annex D
addresses sector application and is informative.
**S:** Given a described activity, determine whether it is an AIMS requirement or a
technical practice the AIMS governs.
**A:** Discipline about scope boundaries.

---

# DOMAIN 2 — Context, leadership and planning (clauses 4–6)

**Weight:** 22.5% · **Tasks:** 8 · **Items:** 9 · **Concepts:** 39

---

### Task 2.1 — Determine the organization's context and interested parties for an AIMS

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `organizational-context`, `internal-external-issues`, `interested-parties-ai`, `climate-change-relevance`, `affected-individuals` |

**K:** External and internal issues include prohibited uses, regulator guidance,
cultural and ethical norms, the competitive landscape and the intended purpose of
the systems themselves; **clause 4.1 requires the organization to determine whether
climate change is a relevant issue**, and 4.2 notes interested parties may have
climate-related requirements; interested parties include those who can *perceive*
themselves affected, which reaches well beyond customers and regulators.
**S:** Given a described organization, identify context issues and interested
parties an information-security-shaped analysis would miss.
**A:** Willingness to count people outside the commercial relationship.

> **New in v1.1.** The climate-change requirement is an explicit `shall` and is the
> single most skipped line in clause 4.

---

### Task 2.2 — Determine the scope of the AIMS

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `aims-scope`, `scope-boundary-decision`, `third-party-ai-in-scope`, `shadow-ai`, `scope-as-documented-information` |

**K:** Scope is determined from the context issues and interested-party
requirements, must be available as documented information, and determines the
organization's activities with respect to the standard's requirements, controls
and objectives; it must account for AI capability the organization did not build —
vendor features, embedded model APIs, AI inside purchased software; a scope drawn
around *systems we developed* omits most of the estate; undeclared use is a scope
problem before it is a control problem.
**S:** Given an estate description, determine what falls inside the boundary and
justify an exclusion.
**A:** Refusal to let a convenient boundary define the scope.

> **This is where the "what is an AI system" boundary question is assessed as a
> competence rather than a recited definition** — and it is forced, because 42001
> delegates the term to ISO/IEC 22989 and does not define it.

---

### Task 2.3 — Explain leadership requirements, the AI policy, and AI objectives

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `top-management-commitment`, `ai-policy`, `ai-objectives`, `policy-vs-objective`, `objectives-measurable` |

**K:** Top management must demonstrate leadership rather than delegate it,
including integrating AIMS requirements into business processes and supporting
other roles to demonstrate leadership in their own areas; the AI policy provides
the framework for objectives, commits to meeting requirements and to continual
improvement, and must be documented, communicated and available to interested
parties as appropriate; objectives must be measurable where practicable, monitored,
communicated and updated, and planning must state what, who, when and how
evaluated.
**S:** Distinguish a policy statement from an objective.
**A:** Expectation that leadership is evidenced, not asserted.

---

### Task 2.4 — Assign roles, responsibilities and authorities

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `roles-responsibilities-authorities`, `conformance-authority`, `performance-reporting-authority` |

**K:** Top management assigns and communicates responsibilities and authorities,
and must specifically assign authority for AIMS conformity and for reporting AIMS
performance to top management; areas typically needing named ownership span risk
management, impact assessment, security, safety, privacy, development, human
oversight, supplier relationships and data quality across the whole life cycle.
**S:** Identify where an assignment leaves an outcome unowned.
**A:** Insistence that someone is accountable.

---

### Task 2.5 — Apply the AI risk assessment process

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `ai-risk-assessment`, `ai-risk-criteria`, `risk-identification-ai`, `risk-analysis-and-evaluation`, `consistent-repeatable-results` |

**K:** Risk criteria are established first and must support distinguishing
acceptable from unacceptable risk, performing assessments, conducting treatment and
assessing risk impacts; the process must be informed by the AI policy and
objectives, **and designed so repeated assessments produce consistent, valid and
comparable results**; it identifies risks that aid *or* prevent achieving AI
objectives, analyses consequences to the organization, individuals and societies,
assesses likelihood, determines levels, then evaluates against criteria and
prioritises for treatment. Annex C lists candidate objectives and risk sources;
ISO/IEC 23894 gives guidance.
**S:** Given a scenario, identify AI-specific risk sources a generic IT risk
assessment would not surface.
**A:** Systematic method over intuition.

---

### Task 2.6 — Apply the AI system impact assessment

| Attribute | Value |
|---|---|
| Criticality | high · **Frequency** | **weekly** |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `ai-system-impact-assessment`, `impact-on-individuals`, `impact-on-societies`, `foreseeable-misuse`, `jurisdictional-context`, `impact-assessment-documentation` |

**K:** A formal documented process identifying, evaluating and addressing impacts
on individuals, groups and societies; it determines the consequences of deployment,
intended use **and foreseeable misuse**; it must account for the specific technical
and societal context of deployment **and applicable jurisdictions**; results must be
documented and **may be made available to relevant interested parties**; areas of
impact reach legal position and life opportunities, physical and psychological
well-being, and human rights, with specific protection needs for children, elderly,
impaired persons and workers. ISO/IEC 42005:2025 gives guidance.
**S:** Given an AI system, identify affected parties and potential impacts including
unintended ones.
**A:** Concern for people outside the organization's interest.

---

### Task 2.7 — Differentiate the AI risk assessment from the AI system impact assessment and determine what a situation requires

| Attribute | Value |
|---|---|
| Criticality | **high** · **Frequency** | **weekly** |
| Bloom | `4_analyze` · Exam scope | yes |
| Concepts | `risk-vs-impact-assessment`, `impact-feeds-risk`, `anchoring-difference`, `disclosure-difference` |

**K:** The two are **not parallel and not distinguished by who is harmed** — the
risk analysis already assesses consequences to the organization, individuals and
societies. **The impact assessment is an input: its results must be considered in
the risk assessment, and the risk assessment may draw on it when assessing
consequences.** What actually separates them is four things: **anchoring** (risk to
AI objectives; impact to deployment, intended use and foreseeable misuse),
**output** (risk levels prioritised for treatment; documented consequences),
**context** (risk criteria; technical, societal and jurisdictional context of
deployment) and **audience** (internal; may be released to interested parties).
Both are separately required and neither substitutes for the other.
**S:** Given a scenario, determine which is called for or both, and justify from
anchoring and output rather than from who is harmed.
**A:** Refusal to collapse two obligations into one document.

> **THE SIGNATURE TASK, AND IT WAS WRONG IN v1.** v1 taught *direction of harm* as
> the distinguishing axis. The standard contradicts it in two places. **Had this
> shipped, the credential's headline competence would have been teaching a
> falsehood that sounds right** — and it survived one external review.
>
> **This task must survive Stage 3 intact.** A reviewer will read it as redundant
> beside 2.5 and 2.6. Its whole job is preventing their collapse.

---

### Task 2.8 — Apply AI risk treatment and produce the Statement of Applicability

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `ai-risk-treatment`, `treatment-options`, `statement-of-applicability`, `inclusion-exclusion-justification`, `residual-risk-approval`, `treatment-plan` |

**K:** Treatment selects options, determines the necessary controls, **compares
them against Annex A to verify none necessary has been omitted**, identifies any
additional controls needed beyond Annex A, and considers Annex B guidance; the SoA
documents all necessary controls with justification for inclusion **and**
exclusion, and legitimate exclusion grounds include the risk assessment not
requiring the control and no external requirement mandating it; all identified
risks and the controls addressing them must be reflected in the SoA; designated
management must approve both the treatment plan and acceptance of residual risk.
**S:** Determine a treatment option for a described risk and state what the SoA must
record.
**A:** Documentation as evidence, not paperwork.

---

# DOMAIN 3 — Support and operation (clauses 7–8)

**Weight:** 20.0% · **Tasks:** 8 · **Items:** 8 · **Concepts:** 32

---

### Task 3.1 — Determine resources and competence needs for an AIMS

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `aims-resources`, `competence-requirements-ai`, `competence-evidence`, `ai-expertise-diversity` |

**K:** Competence must be determined for persons whose work affects AI performance,
established through education, training or experience, and **evidenced by
documented information**; where competence is lacking the organization acts and
evaluates whether the action worked; AI competence spans data science, oversight
roles, trustworthiness specialists and domain experts and rarely sits in one
person; different stages of the life cycle need different resources.
**S:** Identify a competence gap from a described team.
**A:** Honesty about what the organization does not know.

---

### Task 3.2 — Explain awareness and communication requirements

| Attribute | Value |
|---|---|
| Criticality | **low** · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `awareness-requirement`, `work-under-organizational-control`, `communication-planning` |

**K:** Awareness covers **persons doing work under the organization's control**, not
only employees, and spans the AI policy, their contribution to effectiveness, and
the implications of not conforming; communication must be planned across what,
when, with whom and how, internally and externally.
**S:** Distinguish awareness from training.
**A:** Communication as a designed process.

---

### Task 3.3 — Manage documented information for an AIMS

| Attribute | Value |
|---|---|
| Criticality | medium · **Frequency** | **daily** |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `documented-information`, `creating-and-updating`, `control-of-documented-information`, `external-origin-documents` |

**K:** Documented information covers what the standard requires plus what the
organization determines it needs, and its extent varies with size, process
complexity and personnel competence; creation and update require identification,
format and review for suitability; control covers availability and protection,
distribution and access, storage and legibility, version control, and retention and
disposition; **documented information of external origin must also be identified and
controlled.**
**S:** Identify which records a described activity must generate.
**A:** Evidence discipline.

---

### Task 3.4 — Explain operational planning and control

| Attribute | Value |
|---|---|
| Criticality | high · **Frequency** | **daily** |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `operational-planning-and-control`, `process-criteria`, `change-control-ai`, `externally-provided-processes` |

**K:** The organization establishes process criteria and controls processes to
them, implements the life-cycle-related controls determined during risk treatment,
**monitors the effectiveness of those controls and considers corrective action when
intended results are not achieved**, keeps enough documented information to have
confidence processes ran as planned, controls planned changes and reviews the
consequences of **unintended** ones, and ensures externally provided processes,
products and services relevant to the AIMS are controlled.
**S:** Identify what "controlled" requires for a described outsourced activity.
**A:** Ownership that does not transfer with the work.

---

### Task 3.5 — Apply the AIMS to AI systems and components obtained from third parties

| Attribute | Value |
|---|---|
| Criticality | high · **Frequency** | **weekly** |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `third-party-ai-supply`, `supplier-obligations`, `model-supply-chain`, `supplier-documentation` |

**K:** Suppliers can provide datasets, algorithms, models, libraries or a whole
system; supplier selection, the requirements placed on them and the level of
ongoing monitoring should follow the risk each poses; the organization documents
how supplied components integrate; where a supplied component does not perform as
intended or produces misaligned impacts the organization requires corrective action;
suppliers must deliver adequate documentation.
**S:** Determine what a supplier must provide for a described AI dependency.
**A:** Refusal to treat an opaque supplier as out of scope.

---

### Task 3.6 — Explain data management requirements for AI systems

| Attribute | Value |
|---|---|
| Criticality | high · **Frequency** | **weekly** |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `data-for-ai-systems`, `data-provenance`, `data-quality`, `data-preparation`, `data-acquisition` |

**K:** Data management spans privacy and security implications, threats arising
from data-dependent development, transparency and explainability, representativeness
of training data against the operational domain, and accuracy and integrity;
acquisition records categories, quantity, sources, source characteristics, subject
demographics and known biases, prior handling, data rights and metadata; provenance
records creation, update, transcription, validation and transfer of control;
preparation criteria and methods must be documented because poor preparation causes
system errors.
**S:** Identify a data property that affects AI outcomes but not information
security.
**A:** Attention to data as a governed input, not a stored asset.

---

### Task 3.7 — Analyze which of an existing ISMS's support and operation machinery carries over to an AIMS

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `4_analyze` · Exam scope | yes |
| Concepts | `iso-42001-27001-integration` *(reused from 1.4)*, `shared-clause-seven-eight`, `carry-over-limits`, `competence-does-not-carry` |

**K:** Because the harmonised structure makes clauses 7 and 8 identical in
numbering and title, documented-information control, communication planning and
awareness infrastructure largely carry over; **competence does not**, because AI
competence is a different body of knowledge with different evidence; operational
control carries over in form but not content, because the processes being
controlled are different; **Annex D.2 endorses integration and specifically notes
that information-security-related controls can be implemented through the
organization's existing 27001** — which is licence to integrate, not licence to
assume. Reusing an ISMS process without re-examining what it now governs is the
common integration failure.
**S:** Given a described ISMS, determine which elements extend unchanged, which
extend with modification, and which must be built new.
**A:** Skepticism toward reuse that has not been checked.

---

### Task 3.8 — Apply the clause 8 operational requirements for assessment and treatment

| Attribute | Value |
|---|---|
| Criticality | high · **Frequency** | **weekly** |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `clause-eight-operation`, `planned-intervals`, `significant-change-trigger`, `retained-results` |

**K:** Clause 6 defines the processes; **clause 8 requires them to be performed.**
Risk assessments run at planned intervals or when significant changes are proposed
or occur; the treatment plan is implemented **and its effectiveness verified**; new
risks identified by assessment go back through treatment; **where treatment options
prove ineffective they must be reviewed, revalidated and the plan updated**; impact
assessments run at planned intervals or on significant change. Results of all three
must be retained as documented information.
**S:** Given a described change, determine which clause 8 obligations are triggered
and what must be retained.
**A:** Treating a defined process as worthless until it is run.

> **New in v1.1.** v1 covered clause 6 and missed that clause 8 restates all three
> as operational duties. This is the *"we wrote the procedure"* failure, and it is
> the single most common real-world nonconformity in any management system.

---

# DOMAIN 4 — Annex A controls: structure and selection

**Weight:** 25.0% · **Tasks:** 7 · **Items:** 10 · **Concepts:** 32

> **Teaching decision — BoK §4.4.** Annex A is taught as **structure and selection
> reasoning**, not a survey of 38 controls. Same decision ISMS-F made for its 93.
>
> **Authoring warning.** Table A.1's control wording is short, memorable and
> recognisable on sight — the highest-risk text in the standard for style guide §1.
> ISMS-F shipped five near-verbatim ISO definitions in its first module draft and
> the external review asked for *tighter* alignment. Run the guard on every module.

---

### Task 4.1 — Explain the structure of Annex A and the status of Annex B

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `annex-a-structure`, `control-categories`, `control-count`, `annex-b-normative`, `annex-a-not-exhaustive` |

**K:** Annex A is normative and holds **38 controls across nine categories, A.2 to
A.10, carrying ten objectives** — A.6 subdivides into A.6.1 and A.6.2, each with
its own objective, which is why "nine objectives" is the common miscount; the
controls are a **reference**, not a checklist — not all are required and the
organization may design its own; **Annex B is also normative** and provides
implementation guidance for every Table A.1 control, though organizations need not
justify inclusion or exclusion of the *guidance* in the SoA; Annexes C and D are
informative.
**S:** Locate a described concern under the correct control category.
**A:** Structure before detail.

> **Corrected in v1.1** on both the objective count and Annex B's status.

---

### Task 4.2 — Explain how Annex A relates to the Statement of Applicability

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `statement-of-applicability` *(reused from 2.8)*, `soa-annex-a-relationship`, `soa-completeness`, `exceeding-annex-a` |

**K:** The SoA documents all necessary controls with justification for inclusion and
exclusion; the organization **may not require every Annex A control and may exceed
the list with its own**; exclusion is legitimate and must be reasoned, not silent;
justification for excluding whole control objectives may be documented in general or
per AI system; all identified risks and the controls addressing them must be
reflected in the SoA.
**S:** Determine whether a described exclusion is adequately justified.
**A:** Completeness over convenience.

---

### Task 4.3 — Select controls for AI policy, internal organization and resources

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `policy-controls`, `internal-organization-controls`, `reporting-of-concerns`, `resource-controls` |

**K:** These categories establish the governing apparatus — documenting an AI
policy, aligning it with other organizational policies, reviewing it at planned
intervals, allocating AI roles and responsibilities, providing a route to raise
concerns about the organization's role, and identifying and documenting the
resources involved: data, tooling, system and computing, and human.
**S:** Given a governance gap, select the control category that addresses it.
**A:** Governance as infrastructure.

---

### Task 4.4 — Select controls across impact assessment and the AI system life cycle

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `impact-assessment-controls`, `responsible-development-controls`, `life-cycle-stage-controls`, `verification-validation-controls`, `operation-monitoring-controls`, `event-log-controls` |

**K:** These categories cover establishing and documenting the impact assessment
process and assessing individual and societal impacts; setting objectives and
processes for responsible design and development; and defining criteria at each
life-cycle stage — requirements, design documentation, verification and validation,
deployment readiness, operation and monitoring, technical documentation for
different interested parties, and event logging — where the control requires the
organization to **determine at which life-cycle phases** logging **should** be
enabled, with in-use as the stated minimum. **That is a determination duty, not a
flat logging mandate**; the distinction matters to an implementer and to an
auditor.
**S:** Place a described life-cycle failure against the control category that would
have prevented it.
**A:** Coverage across the whole life, not the release moment.

---

### Task 4.5 — Select controls for data and for information to interested parties

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `data-controls`, `information-for-users`, `external-reporting-control`, `incident-communication-control` |

**K:** Data controls cover development data management, acquisition, quality,
provenance and preparation; information controls cover what users are told —
including **that they are interacting with an AI system**, how to override it, what
oversight is needed, and relevant impact-assessment findings — plus a route for
interested parties to report adverse impacts, a plan for communicating incidents,
and determining reporting obligations to authorities. **This is where the standard
and EU AI Act Article 50 touch most directly.**
**S:** Determine what a described deployment must disclose and to whom.
**A:** Transparency as a default rather than a concession.

---

### Task 4.6 — Select controls for use of AI systems and for third-party and customer relationships

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `use-of-ai-controls`, `human-oversight-control`, `intended-use-control`, `third-party-controls`, `customer-controls` |

**K:** Use controls cover processes and objectives for responsible use — fairness,
accountability, transparency, explainability, reliability, safety, robustness,
privacy, accessibility — and **meaningful human oversight with authority to
override**, informed by the impact assessment; intended-use controls require the
system to be used per its documentation; relationship controls allocate
responsibilities across the organization, partners, suppliers, customers and third
parties, and consider customer expectations. **Which apply depends on the role held
(task 1.2).**
**S:** Given an organization's role, determine which control categories apply and
which are legitimately excluded.
**A:** Precision about what the organization actually does.

---

### Task 4.7 — Analyze overlap between ISO/IEC 42001 and ISO/IEC 27001 controls

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `4_analyze` · Exam scope | yes |
| Concepts | `iso-42001-27001-integration` *(reused from 1.4)*, `control-overlap`, `single-control-two-systems`, `false-equivalence-controls` |

**K:** **Annex D.2 explicitly contemplates implementing information-security-related
AI controls through an existing 27001 implementation**, so genuine overlap exists
and should be used; but some obligations look equivalent and are not — an access
control protecting a model endpoint is not the obligation to record the provenance
of what that model was trained on; treating overlap as equivalence produces an SoA
that passes review and leaves the AI obligation unmet.
**S:** Given a pair of controls, determine whether one implementation satisfies both
and justify the answer.
**A:** Suspicion of convenient equivalence.

---

# DOMAIN 5 — Performance evaluation, improvement and certification

**Weight:** 17.5% · **Tasks:** 6 · **Items:** 7 · **Concepts:** 26

---

### Task 5.1 — Explain monitoring, measurement, analysis and evaluation

| Attribute | Value |
|---|---|
| Criticality | high · **Frequency** | **daily** |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `monitoring-and-measurement`, `what-to-monitor`, `aims-effectiveness-vs-system-performance`, `evidence-of-results` |

**K:** The organization determines what to monitor, by what methods, when it is
performed and when results are analysed, with documented evidence of results; **a
NOTE to the definition of performance — not a requirement — records that**
performance means both results achieved by using AI systems and results of the
management system itself, and the two are distinct: a well-governed system can
perform poorly and a well-performing system can be ungoverned.
**S:** Distinguish a measure of AIMS effectiveness from a model metric.
**A:** Measuring the system of governance, not only the technology.

---

### Task 5.2 — Explain the internal audit requirement

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `internal-audit-requirement`, `audit-programme`, `auditor-objectivity`, `audit-criteria-and-scope` |

**K:** Internal audits run at planned intervals against **both** the organization's
own AIMS requirements and the standard's, and test whether the system is effectively
implemented and maintained; the programme covers frequency, methods,
responsibilities, planning and reporting, and considers process importance and
previous results; auditors must be selected to ensure objectivity and impartiality,
results go to relevant managers, and an internal audit may be conducted by an
external party on the organization's behalf.
**S:** Identify an objectivity problem in a described audit assignment.
**A:** Independence as a structural requirement.

> `AIMS-IA` is where this becomes a job rather than a requirement to recognise.

---

### Task 5.3 — Explain management review inputs and results

| Attribute | Value |
|---|---|
| Criticality | medium · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `management-review`, `review-inputs`, `review-results`, `review-records` |

**K:** Top management reviews the AIMS at planned intervals for continuing
suitability, adequacy and effectiveness; inputs are the status of prior actions,
changes in external and internal issues, changes in interested-party needs,
performance information including **trends** in nonconformities, monitoring results
and audit results, and improvement opportunities; results include decisions on
improvement and any needed changes, and must be evidenced.
**S:** Identify a missing management review input.
**A:** Review as a decision forum, not a formality.

---

### Task 5.4 — Apply nonconformity and corrective action

| Attribute | Value |
|---|---|
| Criticality | high · **Frequency** | **weekly** |
| Bloom | `3_apply` · Exam scope | yes |
| Concepts | `nonconformity`, `correction-vs-corrective-action`, `cause-analysis`, `effectiveness-review`, `continual-improvement` |

**K:** React to the nonconformity — control and correct it, deal with the
consequences — then evaluate whether action is needed to eliminate the cause so it
does not recur **or occur elsewhere**, by reviewing it, determining causes and
determining whether similar nonconformities exist or could; corrective actions must
be appropriate to the effects encountered, their effectiveness reviewed, and both
the nature of the nonconformity and the results of action evidenced. Root cause for
an AI failure may sit in data or in a supplier rather than in a process.
**S:** Given a described failure, distinguish the correction from the corrective
action.
**A:** Impatience with fixes that do not prevent recurrence.

---

### Task 5.5 — Describe the certification route and what ISO/IEC 42006 governs

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `2_understand` · Exam scope | yes |
| Concepts | `certification-route`, `stage-one-stage-two`, `surveillance-and-recertification`, `iso-42006-role`, `accreditation-vs-certification` |

**K:** **ISO/IEC 42001 says nothing about how certification is conducted** — the
route belongs to other documents, and stating otherwise is the same error as
claiming a certificate validity period from 27001. **ISO/IEC 42006:2025** sets
requirements for bodies auditing and certifying an AIMS — competence,
impartiality, audit-time calculation — and the two-stage initial audit,
surveillance and recertification cycle comes from **ISO/IEC 17021-1**, the generic
requirements for management-system certification bodies. What 42001 *does* say is
that conformity generates evidence of the organization's responsibility and
accountability for its role, which is narrower than a compliance claim.
**Accreditation assesses the certifier, certification assesses the organization,
and the two are routinely conflated.**
**S:** Distinguish what an accreditation body does from what a certification body
does.
**A:** Precision about who is assuring whom.

---

### Task 5.6 — Analyze whether an integrated 27001 and 42001 audit programme can share evidence

| Attribute | Value |
|---|---|
| Criticality | high · Frequency | occasional |
| Bloom | `4_analyze` · Exam scope | yes |
| Concepts | `integrated-audit-programme`, `shared-evidence`, `evidence-that-cannot-be-shared`, `auditor-competence-limit` |

**K:** The standard's own definition of audit contemplates a **combined audit
covering two or more disciplines**, and clause 9–10 machinery is shared, so one
audit programme, one management review cycle and one nonconformity process can serve
both systems; **evidence is a different question** — a management review record can
cover both, an impact assessment cannot substitute for a risk assessment, and an
ISMS internal auditor is not automatically competent to audit an AIMS.
**S:** Given a described integrated programme, determine which evidence serves both
systems and which does not.
**A:** Integration where it is real, separation where it is not.

---

## 5. Concept inventory — counted, not estimated

| Domain | Tasks | Concept mentions |
|---|---|---|
| D1 | 6 | 27 |
| D2 | 8 | 39 |
| D3 | 8 | 32 |
| D4 | 7 | 32 |
| D5 | 6 | 26 |
| | **35** | **156** |

**156 concept mentions · 153 distinct concepts · 156 `task_concepts` link rows.**

Three deliberate reuses, each a cross-domain link, not a duplicate row:

| Slug | Tasks | Why reused |
|---|---|---|
| `iso-42001-27001-integration` | 1.4, 3.7, 4.7 | The integration thesis is introduced once and analysed twice |
| `statement-of-applicability` | 2.8, 4.2 | Produced in D2, examined against Annex A in D4 |

**Scaffold arithmetic:** 153 rows in `concepts`, 156 rows in `task_concepts`. If
those two numbers do not come out of the migration exactly, a slug was typed
inconsistently. Average 4.5 mentions per task, against ISMS-F's 3.9.

**Coverage invariant:** every concept taught by exactly one lesson and tested by at
least one item. `v_coverage_summary` must report
`untaught_testing_violations = 0` before any item generation.

---

## 6. Volatility

| Item | Risk | Re-verify |
|---|---|---|
| EU AI Act calendar (tasks 1.5, 4.5) | **High** — already moved 16 months | Before lock, before publish, every 6 months |
| ISO/IEC 22989 Amendment 1 (generative AI) | Medium — under development, and 22989 is a **normative reference** | Before lock; every 6 months |
| ISO/IEC 42001 edition | Low — first edition, no amendment | Before lock |
| Accredited 42001 personnel schemes | Medium | Before claim copy ships |

---

## 7. Open before Stage 4 lock

1. ~~Structural verification.~~ **Done against the standard text 2026-08-06.**
2. **Stage 3 external review.** Send with the intentional patterns named up front —
   the format that made the ISMS-F review productive:
   - **Task 2.7 is the signature task and must survive intact.** It reads as
     redundant beside 2.5 and 2.6; that is the point. **And note that v1's version
     of it was factually wrong and passed review** — ask the reviewer to check it
     against clauses 6.1.2 and 6.1.4 specifically, not for plausibility.
   - D4 teaches structure and selection, not 38 controls. Deliberate.
   - Bloom ceiling is `4_analyze`. Do not recommend `evaluate` tasks.
   - No `1_remember` tasks — forced, because 42001 defines no terms of its own for
     "AI system" and delegates to ISO/IEC 22989.
   - Three of four analyze tasks are 27001 integration, and **Annex D.2 is the
     textual basis**. That is the differentiator made assessable.
   - **Attribution is a named review dimension.** For every K field, the question
     is not *is this true* but *does 42001 say it, and with which modal*. Practice
     vocabulary presented as normative text is the defect class that cost ISMS-F a
     session and that `verify-cert` cannot see. §0a is the rule.
   - **Task 5.2 is deliberately silent on the own-work rule.** It uses the
     standard's words — objectivity and impartiality. The own-work rule is ISO
     19011 guidance and is the exact false attribution ISMS-F shipped. **Adding it
     is not an improvement.**
3. **Concept deduplication pass** before scaffold migration **176**: 153 concepts,
   156 links, three intentional reuses. Slug change in v1.2 —
   `certifiable-management-system` → `management-system-certification-basis`.
4. **`SCHEME-AIMS-F.md`** — carries the subscore disclosure from §1 and the
   17024:2026 pin per `CLAIMS-POLICY` §4. **Seven scheme docs still carry bare
   `17024`** (v5.5 §8.5); do not make AIMS-F the eighth.
5. **AIGRM-I discrimination copy** (BoK §7.3) ships in a migration, not the
   scaffold — it changes a live published cert.
6. **`item-pipeline.mjs` attribution rule — before Stage 7, its own session.**
   v5.5 §0 and §2. Without it every standards-based cert regenerates the defect.
   §0a above constrains the JTA; this constrains the generator. **Both are needed —
   correcting K/S/A did not stop ISMS-F's generator reasserting the own-work rule
   until the third regeneration attempt.**
7. **AIMS-F needs a `jta_versions` row.** Migration 106 covered six certs, 175
   covered two; AIMS-F is the ninth. Same projection, same shape. v5.5 §9.5 asks
   for this to be added to `CERT-PUBLISH-CHECKLIST.md` as a step.
8. **Check 42001's body against its own contents page.** ISMS-F's Finding 3 was
   clause 6.3, a real requirement missing from 27001's table of contents. Run the
   same check here — the 42001 contents page reproduced in this session lists 6.1.1
   through 6.3 and appears complete, but *appears* is what was said last time.

---

*Stage 2 draft. Stage 3 is a gate: no scaffold, no lessons, no items until the JTA
is reviewed and locked. `CERT-CREATION.md` §0 — creation is human, the machine is
downstream.*
