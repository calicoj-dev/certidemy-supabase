# AIHR-I - Job-Task Analysis

> **GENERATED FROM THE DATABASE on 2026-09-02. Do not hand-edit.**
>
> Every fact below is rendered from the live schema by
> `scripts/gen-jta-doc.mjs`. To change anything here, change the database
> through a migration and regenerate - the git diff on this file is then the
> change record.
>
> Design rationale, sourcing, review history and reconciliation records are
> NOT here. They carry human judgment that no query can reconstruct, and live
> in the companion narrative document.

**Certification:** AI for Human Resources & Talent I  
**Status:** available

---

## Exam facts

| Attribute | Value |
|-|-|
| Questions | 40 |
| Duration | 60 minutes |
| Passing score | 80% (32/40) |
| Format | Multiple choice (single answer), online |
| Bloom ceiling | 4 (Analyze) for MCQ; 5-6 reserved for simulation |
| Languages | English, es-419, pt-BR |

## Domain structure

| # | Domain | Weight | MCQ seats |
|-|-|-|-|
| D1 | AI in the Talent Lifecycle | 20% | 8 |
| D2 | Legal Exposure, Bias & Candidate Rights | 30% | 12 |
| D3 | Scoping Roles & Evaluating Capability Claims | 30% | 12 |
| D4 | Responsible AI Use in the Recruiter Workflow | 20% | 8 |
| **Total** | | **100%** | **40** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 2 (Understand) | 4 | 14.67% |
| 3 (Apply) | 18 | 64% |
| 4 (Analyze) | 6 | 21.33% |

---

# Domain D1 - AI in the Talent Lifecycle (20%)

**Description.** What AI is actually doing across sourcing, screening, interviewing, onboarding and worker management: how these systems produce the outputs a recruiter acts on, and where the claims made for their capability run ahead of the evidence.

**Tasks:** 5  |  **MCQ seats:** 8

## Tasks

### Task 1.1 - Identify where AI is used across the talent lifecycle, from sourcing through worker management

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-in-screening`, `ai-in-sourcing`, `ai-in-worker-management`, `talent-lifecycle` |

- **K:** The lifecycle stages where AI now appears: candidate sourcing and outreach, resume parsing and ranking, assessment, interview scheduling and analysis, offer modeling, onboarding, and post-hire performance, scheduling and monitoring systems.
- **S:** Given an organization's tool stack, locate every point where AI touches an employment decision.
- **A:** Recognition that AI in hiring is not one system but a chain, and that worker management sits inside the same regulatory perimeter as recruitment.

### Task 1.2 - Distinguish an automated employment decision tool from ordinary recruiting software

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `automated-decision-tool`, `materially-influences`, `rules-based-filter`, `tool-classification` |

- **K:** What distinguishes a system that automates, substantially assists or materially influences an employment decision from one that merely stores or routes data; that regulators define covered tools broadly; that a human making the final call does not by itself remove a tool from scope.
- **S:** Classify a given tool in a given workflow as in-scope or out-of-scope.
- **A:** Caution against the convenient conclusion, since this classification gates every legal obligation and erring permissively is the most common failure.

### Task 1.3 - Explain how a resume-screening or candidate-ranking model produces a score

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `candidate-ranking`, `pattern-not-judgment`, `score-is-not-truth`, `trained-on-historical-hires` |

- **K:** That ranking models learn from historical hiring outcomes and therefore reproduce historical hiring patterns, including undesirable ones; that a score is a similarity estimate rather than a measure of merit; that fit score has no standard definition across vendors.
- **S:** Explain to a hiring manager, in plain language, what a ranking score does and does not mean.
- **A:** Refusal to treat a numeric output as more objective than the human judgment it replaced.

### Task 1.4 - Identify what AI cannot reliably assess about a candidate

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `assessment-limits`, `construct-validity`, `inferred-trait-claims`, `video-analysis-limits` |

- **K:** The weak evidentiary basis for inferring personality, culture fit, emotion, engagement or integrity from voice, face or text; that a tool measuring something is not the same as that something predicting job performance.
- **S:** Given a vendor assessment claim, judge whether the construct is plausibly measurable and plausibly job-related.
- **A:** Willingness to say that a tool measures something, but not what it says it measures.

### Task 1.5 - Recognize AI-washing in HR technology marketing

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-washing`, `benchmark-without-baseline`, `claim-versus-evidence` |

- **K:** Common patterns: rules engines relabeled as AI, accuracy figures with no stated baseline or population, efficiency claims measuring throughput rather than quality of hire, pilot results presented as validation.
- **S:** Take apart a vendor claim and name what evidence would actually support it.
- **A:** Buyer skepticism proportionate to the stakes of the decision the tool will influence.

---

# Domain D2 - Legal Exposure, Bias & Candidate Rights (30%)

**Description.** The duties that attach when AI influences an employment decision, how AI-assisted selection can produce discriminatory outcomes without anyone intending it, and what a candidate is entitled to. Taught as a transferable set of obligations rather than a list of statutes, so it holds as legislation changes.

**Tasks:** 9  |  **MCQ seats:** 12

## Tasks

### Task 2.1 - Determine which categories of obligation attach to an AI hiring tool in a given jurisdiction

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `deployer-versus-developer`, `jurisdictional-scope`, `multi-jurisdiction-hiring`, `obligation-taxonomy` |

- **K:** That obligations follow the candidate and role location rather than the employer headquarters; that a distributed hiring process can trigger several regimes at once; that deployer duties differ from developer duties and buying a tool does not transfer responsibility for outcomes.
- **S:** Given a hiring scenario spanning jurisdictions, identify which categories of duty are triggered and who owes them.
- **A:** Escalation instinct rather than improvisation.

### Task 2.2 - Distinguish disclosure duties, audit duties, explanation duties, human-review duties, record duties, and non-discrimination liability

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `disclosure-duty`, `explanation-duty`, `human-review-duty`, `independent-bias-audit`, `non-discrimination-liability`, `record-duty` |

- **K:** The six duty types as independent axes; that satisfying one does not satisfy another; that non-discrimination liability exists independently of any AI-specific statute and is the exposure that never goes away when an AI law is delayed or repealed.
- **S:** Given a described regime, sort its requirements into the taxonomy.
- **A:** Structural thinking: read the next new law by its shape rather than memorizing it.

### Task 2.3 - Explain how disparate impact arises from AI-assisted selection

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `disparate-impact`, `protected-characteristic`, `selection-rate-comparison`, `unintentional-discrimination` |

- **K:** That liability attaches to outcomes rather than intent; how selection rates are compared across groups; that a facially neutral criterion applied by a model produces a discriminatory outcome at a scale and speed no human reviewer could.
- **S:** Read an outcome breakdown and recognize a disparity worth escalating.
- **A:** Outcomes-first thinking, since good intentions are not a defence.

### Task 2.4 - Identify proxy variables that encode protected characteristics

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `employment-gap-proxy`, `geographic-proxy`, `institution-proxy`, `linguistic-proxy`, `proxy-variable`, `trained-on-historical-hires` |

- **K:** How location, school or institution name, employment continuity, language fluency markers, activity signals and affiliation cues can correlate with protected characteristics; that some jurisdictions bar specific proxies outright.
- **S:** Audit a set of screening criteria, including one's own, for proxy risk.
- **A:** Suspicion of criteria that feel neutral and merit-based, since those are precisely the ones that survive review unexamined.

### Task 2.5 - Analyze a vendor bias-audit report to distinguish what it establishes from what it does not

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `audit-is-not-indemnity`, `audit-population-mismatch`, `audit-recency`, `audit-scope`, `auditor-independence` |

- **K:** That an audit covers a specified tool, configuration, population and date; that the vendor's audited population may not resemble the deployer's applicant pool; that model updates can invalidate a prior audit; that an audit is evidence of diligence rather than a transfer of liability.
- **S:** Read a bias-audit summary and state precisely what it licenses the employer to conclude.
- **A:** Treating vendor assurance as an input to one's own judgment rather than a substitute for it.

### Task 2.6 - Apply accommodation and accessibility duties to AI-mediated assessment

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `alternative-evaluation-path`, `assessment-accessibility`, `assessment-limits`, `reasonable-accommodation`, `screening-out-by-design` |

- **K:** That timed, video, voice or game-based assessment can systematically disadvantage candidates with disabilities; that an accommodation request may arrive before a candidate has disclosed anything; that an alternative evaluation path must be genuinely equivalent rather than a token.
- **S:** Given an assessment design, identify who it screens out and what alternative path is required.
- **A:** Designing the alternative before it is requested.

### Task 2.7 - Determine what a candidate is entitled to know, contest, or have reviewed by a human

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `adverse-decision-explanation`, `candidate-notice`, `data-correction-right`, `meaningful-human-review` |

- **K:** Pre-use notice, explanation after an adverse outcome, the right to request human review, and correction of inaccurate input data; what makes a human review meaningful rather than a rubber stamp, namely authority to change the outcome, access to the underlying data, and time to use both.
- **S:** Given a rejection produced with AI involvement, determine what the candidate is owed and produce it.
- **A:** Treating the candidate as a rights-holder rather than as throughput.

### Task 2.8 - Determine what a defensible record of an AI-assisted employment decision must contain

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `audit-trail`, `decision-record`, `documented-human-judgment`, `record-retention` |

- **K:** What a defensible record contains: tool and version used, its output, the human reasoning applied on top of it, notices given and accommodations offered; multi-year retention expectations; that the record is what exists when a claim arrives eighteen months later.
- **S:** Produce a decision record that would survive a regulator or plaintiff reading.
- **A:** Documentation as protection rather than bureaucracy.

### Task 2.9 - Determine the minimum documentation a deployer should require from an AI hiring vendor

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `contractual-allocation-limits`, `intended-use-statement`, `known-limitations-disclosure`, `vendor-documentation` |

- **K:** What a deployer should obtain before deployment: intended-use statement, training-data categories at a descriptive level, known limitations, evaluation results with population described, update and revalidation cadence, and support for the deployer's own notice and explanation duties; that contractual indemnification does not eliminate regulatory or discrimination exposure and in some regimes is expressly void.
- **S:** Given a vendor package, identify what is missing that the deployer will later be unable to produce.
- **A:** Treating procurement as the cheapest point of intervention, since everything not obtained there becomes unobtainable later.

---

# Domain D3 - Scoping Roles & Evaluating Capability Claims (30%)

**Description.** Defining what a role actually requires in AI terms, and judging whether a candidate has it: from the credentials they present, the claims they make, and the evidence available to verify either.

**Tasks:** 9  |  **MCQ seats:** 12

## Tasks

### Task 3.1 - Determine the observable capabilities a stated business need actually requires

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `need-to-capability`, `requirement-elicitation`, `role-scoping` |

- **K:** How to run a requisition intake conversation that surfaces the underlying business problem rather than the manager's guess at a job title; that a request for someone who knows AI is a symptom rather than a requirement.
- **S:** Convert a stated business need into a small set of observable capabilities the role must have.
- **A:** Willingness to push back on a hiring manager's initial framing.

### Task 3.2 - Distinguish AI-related job titles that describe materially different work

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `builder-versus-user`, `seniority-inflation`, `title-drift`, `title-versus-task` |

- **K:** That AI job titles are unstandardized and drifting; the substantive difference between people who build models, integrate AI systems, govern them and use them well; that the same title means different work at different companies.
- **S:** Given a job description, determine which category of work it actually describes regardless of its title.
- **A:** Reading for the work rather than the label.

### Task 3.3 - Determine whether a job description specifies AI capability as observable tasks or as tool names

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `must-have-versus-nice-to-have`, `over-specification`, `task-based-requirement`, `tool-name-versus-capability` |

- **K:** That naming tools dates a requisition and narrows the pool to people who used one product rather than people who can do the work; how over-specification produces both a smaller pool and a worse one.
- **S:** Rewrite a tool-listing job description into observable task requirements.
- **A:** Treating requirements as a hypothesis to be tested rather than a wish list.

### Task 3.4 - Analyze how AI shifts the task composition of an existing role

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `augmented-versus-displaced-task`, `role-redesign`, `skills-adjacency`, `task-composition-shift` |

- **K:** That AI changes the mix of tasks within roles more often than it eliminates roles; that the tasks which remain are typically the judgment, exception-handling and accountability ones.
- **S:** Decompose a role, identify which tasks AI now absorbs, and state what the role should now be hired against.
- **A:** Workforce planning as redesign rather than headcount arithmetic.

### Task 3.5 - Analyze what a credential evidences about a candidate and what it does not

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `assessed-versus-attended`, `credential-claim-scope`, `credential-currency`, `issuer-independence` |

- **K:** The properties determining what a credential evidences: whether competence was assessed or attendance recorded, who set and marked the assessment, whether the issuer is independent of the trainer, what scope was claimed, and whether it expires; that a credential evidences something narrow and dated rather than general competence.
- **S:** Given a credential on a resume, state precisely what it licenses the recruiter to infer and what it does not.
- **A:** Neither dismissing credentials nor over-reading them, treating one as a single evidence source among several.

### Task 3.6 - Distinguish the common types of learning and credentialing artifact

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `academic-qualification`, `accredited-certification`, `attendance-badge`, `course-completion-certificate`, `vendor-certification` |

- **K:** What each artifact type is produced by and can therefore support: completion certificates evidence exposure, vendor certifications evidence product-specific proficiency, accredited certifications evidence assessment against a published scope by an independent body, academic qualifications evidence sustained study.
- **S:** Categorize a presented artifact and state its evidentiary reach.
- **A:** Fitness-for-purpose over hierarchy, since the right artifact depends on the hiring question.

### Task 3.7 - Interpret published competence documentation to determine what a credential tested

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `cognitive-level-of-assessment`, `exam-blueprint`, `job-task-analysis`, `published-scope-versus-marketing-claim` |

- **K:** That a rigorous credential publishes what it assesses, namely the tasks analyzed, the weighting across domains and the cognitive level at which each is tested; that recall-level and judgment-level assessment support very different inferences about a candidate; that a program publishing no scope document is asking to be taken on trust.
- **S:** Read a published scope document and determine whether the credential tested recall or applied judgment on the capability the role needs.
- **A:** Asking for the evidence behind a claim as a routine professional habit.

### Task 3.8 - Determine the appropriate verification action for a claimed credential and recognize fabrication or lapse signals

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `credential-verification`, `expiry-and-recertification`, `fabrication-signals`, `verification-of-record` |

- **K:** That verification means confirming with the issuer of record rather than accepting an image or document; that many credentials expire and a lapsed credential is a different claim from a current one; common fabrication signals.
- **S:** Verify a presented credential and handle a failed verification proportionately and fairly.
- **A:** Verifying rather than assuming, without treating candidates as suspects.

### Task 3.9 - Determine how AI-driven task change affects internal mobility and reskilling decisions

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `adjacent-role-match`, `build-versus-hire`, `internal-talent-marketplace`, `reskilling-decision`, `task-composition-shift` |

- **K:** That task-composition change creates internal candidates whose adjacency is invisible to a resume-matching process built for external hiring; that build-versus-hire is a real decision with different evidence requirements on each side; that internal AI-assisted assessment carries the same legal duties as external.
- **S:** Given a role whose task mix has shifted, identify which existing employees are adjacent and what reskilling the gap actually requires.
- **A:** Looking inward before opening a requisition.

---

# Domain D4 - Responsible AI Use in the Recruiter Workflow (20%)

**Description.** The practitioner as an AI user: drafting with it, screening with it, verifying what it produces, and knowing where their own accountability begins and the tool stops being an answer.

**Tasks:** 5  |  **MCQ seats:** 8

## Tasks

### Task 4.1 - Apply confidentiality rules to candidate data in general-purpose AI tools

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `approved-tool-boundary`, `candidate-data-confidentiality`, `personal-data-in-prompts`, `public-tool-exposure` |

- **K:** That resumes, interview notes, salary data and background information are personal data; what pasting them into an unapproved tool exposes; that consent to be considered is not consent to be processed by any tool.
- **S:** Decide whether a given task can be done in a given tool, and redact or reroute when it cannot.
- **A:** Default caution with other people's data.

### Task 4.2 - Determine what review an AI-drafted recruiting artifact requires before it is published or sent

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `accountability-for-output`, `ai-drafted-content`, `fabricated-requirement`, `output-review-duty` |

- **K:** That AI-drafted job descriptions and outreach routinely invent requirements, benefits, salary bands and legal language that were never approved; that the employer is bound by what the posting says regardless of what drafted it.
- **S:** Review AI-drafted recruiting content against the source facts before it is published or sent.
- **A:** Ownership of the output, since the tool is not a co-signer.

### Task 4.3 - Assess AI-generated or AI-assisted candidate material fairly

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Weekly |
| Bloom level | 4 (Analyze) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `ai-assisted-application`, `assistance-versus-fabrication`, `detector-unreliability`, `verify-the-claim-not-the-prose` |

- **K:** That AI assistance in writing an application is now normal and is not itself misconduct; that fabricating experience is; that AI-detection tools are unreliable and produce false positives falling unevenly, particularly on non-native speakers, creating their own discrimination exposure.
- **S:** Shift the assessment from how material was written to whether the underlying claim is true and the candidate can do the work.
- **A:** Fairness to candidates over policing of style.

### Task 4.4 - Determine when a hiring task must not be delegated to AI

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `accountability-for-output`, `adverse-decision-handling`, `final-decision-accountability`, `high-stakes-judgment`, `human-decision-boundary` |

- **K:** Which tasks carry accountability that cannot be delegated: final selection, rejection, accommodation decisions, and anything a candidate can contest; that automating a rejection is a different act from automating a scheduling email.
- **S:** Given a workflow, draw the line above which a human must decide and document.
- **A:** Accountability as personal rather than procedural.

### Task 4.5 - Select an accurate, plain explanation of AI use in hiring for a candidate or hiring manager

| Attribute | Value |
|-|-|
| Domain | D4 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Simulation candidate | Yes |
| Concept slugs | `candidate-facing-transparency`, `stakeholder-communication`, `trust-and-perception` |

- **K:** That candidates increasingly ask whether AI screened them, and that evasive answers cost more trust than the AI use itself; how to explain AI involvement plainly without overstating either its role or its rigour; how to tell a hiring manager that a tool they want cannot be used.
- **S:** Write a candidate-facing explanation of AI use that is accurate and plain.
- **A:** Transparency as a default rather than a disclosure minimum.

---

*Generated 2026-09-02 by scripts/gen-jta-doc.mjs from certification AIHR-I (77777777-7777-7777-7777-777777777777).*
