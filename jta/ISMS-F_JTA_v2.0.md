> ## SUPERSEDED FOR ALL FACTUAL CONTENT
>
> **The authoritative JTA for ISMS-F is `jta/ISMS-F_JTA_generated.md`**, rendered
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

# ISMS-F - Job-Task Analysis (v2.0 LOCKED)

**Document version:** 2.0.1 - **LOCKED** (erratum: see change log)
**Status:** Scheme of record. This is the basis for content production. No task,
Bloom level, weight, concept slug or KSA line moves without a version bump and a
re-review. `trg_invalidate_task_translations` enforces the translation half of
this automatically once the rows are seeded.
**Certification:** ISO/IEC 27001 Foundation - AI (`ISMS-F`)
**Family:** `security` (founding member)
**Tier:** Level I
**Authority:** `BOK-ISMS-F.md` v0.3 (triangulated; sources verified 4 August 2026)
**Last updated:** 4 August 2026

## Change log

- **v2.0.1** - **Erratum, arithmetic only.** Concept total corrected 187 -> 191
  and link total stated as 194. The v2.0 totals table subtracted the three reuse
  entries from the domain counts, but reuse entries are `task_concepts` links to
  concepts defined in another domain, not members of the listing domain's own
  list. Caught when the scaffold generator parsed the locked document and its
  count disagreed with the stated one. **No task, Bloom level, weight, concept
  slug, KSA line or link changed** - the document always described 191 concepts;
  only the summary was wrong.
- **v2.0** - **LOCKED.** External review returned lock with no structural
  changes; the amended cognitive profile (57% Understand) was accepted, and the
  three Bloom declines (2.4, 4.2, 5.2) stand. `BOK-ISMS-F.md` amended to v0.3 to
  carry the derived profile. No content change from v1.1.
- **v1.1** - **KSA pass: knowledge / skills / abilities written for all 49 tasks.**
  Two Bloom declarations raised on the merits of the skills line (3.2, 4.5); three
  candidates examined and declined with reasoning (2.4, 4.2, 5.2). Tasks 3.2 and
  4.5 restated. Cognitive profile amended to the derived figure. No structural
  change; task count, domains, weights and concept inventory unchanged.
- **v1.0** - Initial draft from BoK v0.2. Five domains, 49 tasks, 186 concepts.
  Statements, Bloom, frequency, criticality and concepts only - **no KSAs**, which
  v1.1 supplies.

---

## Positioning

`ISMS-F` is a **complete ISO/IEC 27001 Foundation**, rebuilt for an era in which
AI is in the estate. It teaches clauses 4-10, Annex A as a structure, and the
certification process - and asks at every domain what has changed now that
models, agents and prompts are part of the environment being protected.

It certifies **understanding of an ISMS and applied judgment about the security
of AI within it.** It does not certify the ability to build or operate an ISMS
(that is `ISMS-LI`), to audit one, or to engineer security controls.

**Ladder.** `ISMS-F` (Level I) -> `ISMS-LI` (Level II). `AIGRM-I` is orthogonal
and recommended as companion study, not a prerequisite. Eligibility is open.

**Exam form (locked in BoK).** Closed book / en - es-419 - pt-BR. **Items,
duration and pass mark: read `jta/ISMS-F_JTA_generated.md`.** These values were
correct as of 2026-09-01 and are not repeated here -- the generated JTA carries
them. A reader should not have to know which narratives happen to be accurate.

---

## Basis of the body of knowledge

See `BOK-ISMS-F.md` v0.3 section 3. Triangulated from ISO/IEC 27001:2022 +
Amd 1:2024 and the 27000 family (primary, normative); market consensus across
PECB, APMG and EXIN Foundation examinations, collected and dated
4 August 2026; and published AI-era security practice - OWASP Top 10 for LLM
Applications, OWASP Top 10 for Agentic Applications 2026, OWASP MCP Top 10,
MITRE ATLAS, the NIST adversarial ML taxonomy, and NCSC/CISA secure AI guidance.

**The honesty firewall governs the AI weave.** AI content enters only where a
practitioner genuinely does something differently. Where a control is unchanged
by AI, the task says so and the lesson teaches it straight.

**Copyright.** No task requires reproducing ISO normative text. Control titles
and clause numbers are factual references; control text is taught in Certidemy's
own words.

## How to read the KSAs

Per `ASSESSMENT-ENGINE.md` section 1, **the skills line is the truth-teller.** It
says what the candidate must *do*, and where it disagrees with the statement verb
or the declared Bloom level, the skills line governs. Every Bloom declaration
below was written to survive that test, and two did not survive it in v1.0.

The diagnostic that settles Apply against Analyze: **Apply** = select or classify
using a framework the candidate was taught, answer derivable from the lesson.
**Analyze** = find a cause nobody supplied, no pattern to match against.

---

# D1 - Information security fundamentals and the AI-era threat landscape *(15% - 6 items)*

**Intent.** The vocabulary floor and the threat picture. Everything downstream
depends on a candidate distinguishing asset from threat from vulnerability from
risk, and on knowing that the AI threat surface is a real, catalogued thing
rather than a vague anxiety. Carries two of the five declared recall tasks
because this is where the canonical definitions live.

| Code | Task - *the candidate can...* | Bloom | Freq | Crit |
|---|---|---|---|---|
| **1.1** | **Define** confidentiality, integrity and availability, and the supporting properties. | 1_remember | weekly | H |
| **1.2** | Distinguish **asset, threat, vulnerability, risk and control** and explain how they relate. | 2_understand | weekly | H |
| **1.3** | Explain the difference between an information security **event, incident and breach**. | 2_understand | occasional | M |
| **1.4** | **Recognize** the core members of the **ISO/IEC 27000 family** and what each does. | 1_remember | per_exam | M |
| **1.5** | Explain how **AI systems change the information security attack surface**. | 2_understand | weekly | H |
| **1.6** | Distinguish **model-level risks from agentic risks**. | 2_understand | weekly | H |
| **1.7** | **Classify** a described AI-related security concern against the appropriate threat category. | 3_apply | occasional | H |

### D1 knowledge / skills / abilities

**1.1** — **K:** the three core properties and the four supporting properties, and their standard definitions. **S:** states each property and its definition accurately; identifies which property a stated definition describes. **A:** holds the core vocabulary reliably enough to use it without re-deriving it.

**1.2** — **K:** what each of the five terms means and how they compose into a risk. **S:** distinguishes the five terms in a described situation; explains why a vulnerability without a threat is not a risk. **A:** reasons about security situations in the standard's vocabulary rather than in colloquial terms.

**1.3** — **K:** the definitions of event, incident and breach and the thresholds between them. **S:** explains why not every event is an incident and not every incident is a breach. **A:** recognizes that escalation language carries consequences and is not interchangeable.

**1.4** — **K:** which standard in the family carries requirements, which carries control guidance, which carries risk guidance, and the role of the overview document. **S:** names the function of each core family member. **A:** knows where to look rather than assuming one standard contains everything.

**1.5** — **K:** the exposure AI systems introduce beyond conventional application surface — the model as an asset, prompts as data, the inference boundary. **S:** explains why an AI system extends attack surface rather than merely adding a feature. **A:** treats AI adoption as a change to the security picture rather than a procurement event.

**1.6** — **K:** the distinction between a model treated as input-in output-out and a system that plans, holds memory, calls tools and acts. **S:** distinguishes a model-level risk from an agentic one in a described deployment; explains why autonomy widens blast radius. **A:** does not apply chatbot-era assumptions to an agent.

**1.7** — **K:** the published AI threat categories and what characterizes each. **S:** given a described concern, classifies it against the correct threat category and states why the neighbouring category does not fit. **A:** uses shared vocabulary so a concern can be communicated and tracked rather than described ad hoc.

### D1 concepts
- `cia-triad` - confidentiality, integrity and availability as the three core properties of information security.
- `confidentiality` - information is not made available to unauthorized individuals, entities or processes.
- `integrity` - information is accurate and complete and has not been altered without authorization.
- `availability` - information is accessible and usable on demand by an authorized entity.
- `supporting-properties` - authenticity, non-repudiation, accountability and reliability as properties supporting the triad.
- `information-asset` - anything of value to the organization that holds or processes information.
- `threat` - a potential cause of an unwanted incident.
- `vulnerability` - a weakness that can be exploited by a threat.
- `security-control` - a measure that modifies risk.
- `risk-relationship` - how a threat exploiting a vulnerability against an asset produces risk, and how a control modifies it.
- `security-event` - an identified occurrence indicating a possible security-relevant state.
- `security-incident` - one or more events that compromise operations or threaten information security.
- `data-breach` - an incident resulting in unauthorized disclosure of information.
- `iso-27000-family` - the family of standards supporting information security management.
- `iso-27001-requirements` - the certifiable requirements standard for an ISMS.
- `iso-27002-controls` - implementation guidance for the reference controls.
- `iso-27005-risk` - guidance on information security risk management.
- `ai-attack-surface` - the exposure introduced by AI systems beyond conventional application surface.
- `model-as-asset` - a model, its weights and its access path as an information asset in their own right.
- `prompt-as-data` - prompt and context content as information that carries classification and can leave the organization.
- `inference-boundary` - the point at which organizational information crosses into a model provider's control.
- `model-level-risk` - risks arising from a model treated as input-in, output-out.
- `agentic-risk` - risks arising when a system plans, holds memory, calls tools and acts.
- `delegated-authority` - the authority an agent holds to act on behalf of a principal.
- `autonomy-and-blast-radius` - how the scope of possible damage widens with the degree of autonomy.
- `threat-taxonomy-ai` - published catalogues of AI-specific threats and their role as shared vocabulary.
- `prompt-injection` - instructions embedded in input or retrieved content that redirect a model's behaviour.
- `training-data-poisoning` - manipulation of training or fine-tuning data to alter model behaviour.
- `insecure-output-handling` - downstream systems trusting model output without validation.
- `tool-misuse` - legitimate tools bent to destructive or unintended outputs by a compromised agent.

**Task-concept links.** 1.1: `cia-triad`, `confidentiality`, `integrity`, `availability`, `supporting-properties`. 1.2: `information-asset`, `threat`, `vulnerability`, `security-control`, `risk-relationship`. 1.3: `security-event`, `security-incident`, `data-breach`. 1.4: `iso-27000-family`, `iso-27001-requirements`, `iso-27002-controls`, `iso-27005-risk`. 1.5: `ai-attack-surface`, `model-as-asset`, `prompt-as-data`, `inference-boundary`. 1.6: `model-level-risk`, `agentic-risk`, `delegated-authority`, `autonomy-and-blast-radius`. 1.7: `threat-taxonomy-ai`, `prompt-injection`, `training-data-poisoning`, `insecure-output-handling`, `tool-misuse`.

*D1: 7 tasks - 30 concepts defined - Bloom 2x remember, 4x understand, 1x apply.*

---

# D2 - The ISMS: context, leadership, scope and policy with AI in the estate *(17.5% - 7 items)*

**Intent.** Clauses 4 and 5, plus the management-system model itself. The
signature AI content here is scope: a SaaS AI tool used from a browser touches
systems the scope statement never anticipated, and the boundary reasoning that
worked for on-premise assets fails quietly.

| Code | Task - *the candidate can...* | Bloom | Freq | Crit |
|---|---|---|---|---|
| **2.1** | Explain what an **ISMS** is and what a management system does. | 2_understand | weekly | H |
| **2.2** | Explain **clause 4** - internal and external issues, and interested parties. | 2_understand | weekly | H |
| **2.3** | Explain the **environmental-conditions consideration** introduced by Amendment 1:2024. | 2_understand | per_exam | M |
| **2.4** | Explain how the **ISMS scope** is determined, bounded and documented. | 2_understand | weekly | H |
| **2.5** | **Analyze** how a scope boundary is challenged when SaaS AI tools cross system and organizational lines. | 4_analyze | occasional | H |
| **2.6** | Explain **clause 5** - leadership, commitment, and the information security policy. | 2_understand | weekly | H |
| **2.7** | Explain **roles, responsibilities and authorities** within an ISMS. | 2_understand | weekly | H |
| **2.8** | **Apply** policy reasoning to determine what an **acceptable AI use** provision must address. | 3_apply | occasional | H |
| **2.9** | Explain **continual improvement** and the plan-do-check-act model as the ISMS operating rhythm. | 2_understand | weekly | M |

### D2 knowledge / skills / abilities

**2.1** — **K:** what an ISMS is, and the common management-system structure of policy, objectives, process and improvement. **S:** explains what a management system adds over a set of security measures. **A:** thinks of security as a managed system rather than a toolset.

**2.2** — **K:** internal and external issues, interested parties, and which of their requirements are security-relevant. **S:** explains why context is determined before scope; distinguishes an interested party's requirement from a general preference. **A:** grounds security decisions in the organization's actual situation.

**2.3** — **K:** what Amendment 1:2024 added to clauses 4.1 and 4.2, and the obligation to document a determination of non-relevance. **S:** explains what the amendment requires and what it does not require. **A:** recognizes that "not applicable" is itself a determination that must be recorded.

**2.4** — **K:** how scope is bounded, what an interface and a dependency are, and what a scope statement contains. **S:** **explains** how a boundary is drawn and what must be documented; reads a scope statement and identifies what it includes and excludes. **A:** understands scope as a deliberate decision with consequences. *(Declared Understand deliberately: determining scope for an organization is implementer work and belongs to `ISMS-LI`. A Foundation candidate reads a scope statement; they do not author one.)*

**2.5** — **K:** how browser-accessible AI tooling reaches systems and information, and the characteristic ways a scope statement stops describing reality. **S:** given a described estate and a scope statement, identifies where the boundary has stopped being true and explains the mechanism by which it failed. **A:** recognizes that a documented boundary and an actual boundary can diverge without anyone acting improperly.

**2.6** — **K:** top management's obligations, what an information security policy must establish, and the communication requirement. **S:** explains what leadership commitment means in practice and why policy without communication fails. **A:** distinguishes a policy that operates from a policy that exists.

**2.7** — **K:** ISMS roles, the pairing of responsibility with authority, and the risk owner's position. **S:** explains why responsibility without authority does not function; identifies who holds a stated accountability. **A:** looks for the named owner rather than assuming the security function owns everything.

**2.8** — **K:** what an acceptable-use provision governs, the sanctioned/unsanctioned distinction, and what makes a rule enforceable. **S:** given an organizational situation, determines which provisions an acceptable AI use policy must contain and rejects a provision that could not be observed or enforced. **A:** writes and reads policy with enforceability in mind rather than aspiration.

**2.9** — **K:** the plan-do-check-act rhythm and the continual improvement obligation. **S:** explains where each ISMS activity sits in the cycle and why improvement is an obligation rather than an ambition. **A:** treats the ISMS as ongoing rather than as a project with an end date.

### D2 concepts
- `isms-definition` - a systematic, documented approach to managing information security risk.
- `management-system-model` - the common structure of policy, objectives, processes and improvement shared across ISO management system standards.
- `systematic-vs-ad-hoc` - why a managed system differs from a collection of security measures.
- `organizational-context` - the internal and external setting in which the ISMS operates.
- `internal-external-issues` - the factors that affect the organization's ability to achieve its security objectives.
- `interested-parties` - the persons and organizations with a stake in the ISMS.
- `party-requirements` - the security-relevant requirements those parties impose.
- `amendment-1-2024` - the 2024 amendment adding environmental-condition considerations to clauses 4.1 and 4.2.
- `environmental-conditions-relevance` - the requirement to assess whether environmental change is a relevant issue.
- `documented-non-applicability` - the obligation to record a determination that a consideration does not apply.
- `isms-scope` - the boundaries and applicability of the ISMS.
- `scope-boundaries` - what is inside and outside the system being managed.
- `interfaces-and-dependencies` - the points where in-scope activities meet out-of-scope ones.
- `scope-statement` - the documented expression of scope.
- `saas-ai-in-scope` - how browser-accessible AI tools land inside a scope written for managed systems.
- `boundary-erosion` - the way ubiquitous tooling makes a drawn boundary stop describing reality.
- `third-party-processing` - organizational information processed on infrastructure the organization does not control.
- `scope-failure-modes` - the characteristic ways a scope statement stops being true.
- `leadership-commitment` - top management's demonstrable ownership of the ISMS.
- `information-security-policy` - the documented statement of intent and direction.
- `policy-communication` - making policy available and understood.
- `isms-roles` - the defined roles that carry ISMS responsibilities.
- `assigned-authority` - the authority granted to fulfil an assigned responsibility.
- `risk-owner` - the person accountable for a specific risk and its treatment.
- `top-management` - the level at which ISMS accountability ultimately sits.
- `acceptable-use-ai` - rules defining permissible AI use within the organization.
- `sanctioned-vs-unsanctioned-tools` - the distinction between approved tooling and what people actually use.
- `policy-enforceability` - whether a stated rule can be observed, measured and acted on.
- `policy-to-practice` - how a written provision becomes a daily decision.
- `pdca-cycle` - plan-do-check-act as the improvement rhythm of a management system.
- `continual-improvement` - the ongoing obligation to improve suitability, adequacy and effectiveness.
- `management-system-maturity` - the progression from documented to genuinely operating.

**Task-concept links.** 2.1: `isms-definition`, `management-system-model`, `systematic-vs-ad-hoc`. 2.2: `organizational-context`, `internal-external-issues`, `interested-parties`, `party-requirements`. 2.3: `amendment-1-2024`, `environmental-conditions-relevance`, `documented-non-applicability`. 2.4: `isms-scope`, `scope-boundaries`, `interfaces-and-dependencies`, `scope-statement`. 2.5: `saas-ai-in-scope`, `boundary-erosion`, `third-party-processing`, `scope-failure-modes`. 2.6: `leadership-commitment`, `information-security-policy`, `policy-communication`. 2.7: `isms-roles`, `assigned-authority`, `risk-owner`, `top-management`. 2.8: `acceptable-use-ai`, `sanctioned-vs-unsanctioned-tools`, `policy-enforceability`, `policy-to-practice`. 2.9: `pdca-cycle`, `continual-improvement`, `management-system-maturity`.

*D2: 9 tasks - 32 concepts - Bloom 7x understand, 1x apply, 1x analyze.*

---

# D3 - Risk assessment and treatment *(22.5% - 9 items)*

**Intent.** Clause 6 and clause 8 - the engine of the standard. The AI weave here
is identification: an information risk assessment run on a conventional asset
register does not see a model, a prompt log or a vector store, so it produces a
clean result for an estate that is exposed. Carries the SoA, which the 2026
edition of ISO/IEC 27000 restates plainly is not a copy of Annex A.

| Code | Task - *the candidate can...* | Bloom | Freq | Crit |
|---|---|---|---|---|
| **3.1** | Explain the **risk assessment process** - identification, analysis and evaluation. | 2_understand | weekly | H |
| **3.2** | **Apply stated risk criteria** to determine whether an analysed risk falls within acceptance. | 3_apply | weekly | H |
| **3.3** | **Apply** risk identification to a described situation to name the asset, threat and vulnerability. | 3_apply | occasional | H |
| **3.4** | **List** the four **risk treatment options**. | 1_remember | per_exam | H |
| **3.5** | Explain the purpose and required content of the **Statement of Applicability**. | 2_understand | weekly | H |
| **3.6** | Explain why **Annex A is a set of reference controls**, not a checklist to be copied into the SoA. | 2_understand | occasional | H |
| **3.7** | Explain the **risk treatment plan** and the role of **residual risk** and risk-owner approval. | 2_understand | weekly | H |
| **3.8** | **Apply** risk identification to a described **AI deployment** to surface the information risks it introduces. | 3_apply | occasional | H |
| **3.9** | Explain how **prompt and context data leaving the organization** constitutes an information security risk. | 2_understand | weekly | H |
| **3.10** | **Apply** treatment reasoning to select a defensible option for a described AI-related risk. | 3_apply | occasional | H |
| **3.11** | **Analyze** why a conventional risk assessment can return a clean result for an estate with unmanaged AI exposure. | 4_analyze | occasional | H |

### D3 knowledge / skills / abilities

**3.1** — **K:** the three stages of assessment and what each produces. **S:** explains what distinguishes identification from analysis from evaluation, and why the order matters. **A:** treats assessment as a defined process rather than an opinion exercise.

**3.2** — **K:** risk criteria, acceptance criteria, the likelihood-consequence pairing, and how appetite is expressed. **S:** **given stated criteria and a risk with stated likelihood and consequence, determines the risk level and classifies it as acceptable, retained, or requiring treatment.** **A:** applies the organization's stated thresholds rather than a personal sense of severity. *(Raised from Understand in v1.0: the skills line classifies against a taught framework, which is the Apply diagnostic. Explaining what criteria are is comprehension; deciding what falls inside them is not.)*

**3.3** — **K:** the asset-threat-vulnerability composition and how a risk is recorded. **S:** given a described situation, names the asset at risk, the threat acting on it and the vulnerability being exploited. **A:** decomposes a vague concern into a statable risk.

**3.4** — **K:** the four treatment options and their standard names. **S:** states the four options; identifies which option a described decision represents. **A:** holds the option set reliably enough to recognize when one is missing from a discussion.

**3.5** — **K:** what the SoA records — necessity, justification for inclusion and exclusion, and implementation status. **S:** explains what each required element of the SoA is for and why justification is the substance of it. **A:** reads an SoA as a reasoning record rather than a compliance artifact.

**3.6** — **K:** Annex A's status as a reference set, and the risk-driven basis of control selection. **S:** explains why controls are selected because treatment requires them, and why an SoA that mirrors Annex A with a yes/no column has inverted the logic. **A:** resists checklist thinking about a risk-based standard.

**3.7** — **K:** what a treatment plan contains, what residual risk is, and whose approval is required. **S:** explains the difference between deciding treatment and planning it, and why the risk owner rather than the security function approves residual risk. **A:** locates accountability for accepted risk correctly.

**3.8** — **K:** the information risks characteristic of AI deployments — context leakage, training-data confidentiality, output trust. **S:** given a described AI deployment, identifies the information risks it introduces and states the asset each threatens. **A:** applies risk identification to a system type the asset register was not built for.

**3.9** — **K:** prompt data egress, provider retention, the inference boundary, and whether classification survives handling. **S:** explains why entering information into an external model is a disclosure, and what determines its severity. **A:** treats a prompt as information leaving the organization rather than as a query.

**3.10** — **K:** the four treatment options, compensating controls, proportionality, and the relationship of treatment to appetite. **S:** given an identified AI-related risk and stated appetite, selects a defensible treatment option and states why a neighbouring option is less appropriate. **A:** matches treatment effort to risk level rather than to alarm.

**3.11** — **K:** how assessment method determines what is visible, and the ways AI adoption escapes the asset register. **S:** given an assessment that returned a clean result against an estate with known AI exposure, identifies the mechanism by which the method could not see the exposure. **A:** distrusts a clean result whose method was never tested against the thing in question.

### D3 concepts
- `risk-assessment-process` - the defined process for identifying, analysing and evaluating information security risk.
- `risk-identification` - finding, recognizing and describing risks.
- `risk-analysis` - understanding the nature of a risk and determining its level.
- `risk-evaluation` - comparing analysis results against criteria to decide significance.
- `risk-criteria` - the terms of reference against which risk significance is judged.
- `risk-acceptance-criteria` - the thresholds at which a risk may be retained.
- `likelihood-and-consequence` - the two dimensions from which a risk level is derived.
- `risk-appetite` - the amount of risk the organization is willing to pursue or retain.
- `asset-threat-vulnerability-mapping` - relating a described situation to the three components of a risk.
- `scenario-based-identification` - deriving risks from described situations rather than from a fixed list.
- `risk-register` - the record in which identified risks and their treatment are held.
- `risk-treatment-options` - the four available responses to an evaluated risk.
- `modify-risk` - applying controls to change likelihood or consequence.
- `retain-risk` - accepting a risk within criteria.
- `avoid-risk` - not undertaking the activity that gives rise to the risk.
- `share-risk` - transferring or sharing risk with another party.
- `statement-of-applicability` - the documented record of which controls are necessary and why.
- `inclusion-justification` - the stated reason a control is necessary.
- `exclusion-justification` - the stated reason a control is not necessary.
- `implementation-status` - whether a necessary control is implemented.
- `annex-a-as-reference` - Annex A as a reference set to check against, not a mandatory list.
- `control-selection-is-risk-driven` - controls are selected because risk treatment requires them.
- `soa-is-justification` - the SoA records reasoning, not a yes/no column against a list.
- `risk-treatment-plan` - the plan for implementing selected treatment.
- `residual-risk` - the risk remaining after treatment.
- `risk-owner-approval` - the risk owner's acceptance of residual risk and the treatment plan.
- `treatment-vs-plan` - the distinction between deciding treatment and planning its implementation.
- `ai-risk-identification` - surfacing information risks specific to an AI deployment.
- `context-leakage` - organizational information exposed through prompt or retrieved context.
- `training-data-confidentiality` - the confidentiality exposure of data used to train or fine-tune.
- `output-trust` - the risk of downstream systems acting on unvalidated model output.
- `prompt-data-egress` - organizational information leaving the boundary through a prompt.
- `retention-by-provider` - what a model provider retains and for how long.
- `classification-survival` - whether a classification label persists when content is retyped or pasted.
- `treatment-selection` - choosing a defensible treatment for an identified risk.
- `compensating-control` - a control applied where the preferred one is unavailable.
- `proportionality` - matching treatment effort to risk level.
- `treatment-and-appetite` - aligning a treatment decision with stated appetite and criteria.
- `assessment-blind-spots` - risks a method cannot see by construction.
- `asset-register-gaps` - assets absent from the register and therefore absent from assessment.
- `invisible-adoption` - tooling adopted individually and never recorded.
- `false-assurance` - a clean result that reflects method limits rather than a secure estate.

**Task-concept links.** 3.1: `risk-assessment-process`, `risk-identification`, `risk-analysis`, `risk-evaluation`. 3.2: `risk-criteria`, `risk-acceptance-criteria`, `likelihood-and-consequence`, `risk-appetite`. 3.3: `asset-threat-vulnerability-mapping`, `scenario-based-identification`, `risk-register`. 3.4: `risk-treatment-options`, `modify-risk`, `retain-risk`, `avoid-risk`, `share-risk`. 3.5: `statement-of-applicability`, `inclusion-justification`, `exclusion-justification`, `implementation-status`. 3.6: `annex-a-as-reference`, `control-selection-is-risk-driven`, `soa-is-justification`. 3.7: `risk-treatment-plan`, `residual-risk`, `risk-owner-approval`, `treatment-vs-plan`. 3.8: `ai-risk-identification`, `context-leakage`, `training-data-confidentiality`, `output-trust`. 3.9: `prompt-data-egress`, `retention-by-provider`, `inference-boundary` *(D1)*, `classification-survival`. 3.10: `treatment-selection`, `compensating-control`, `proportionality`, `treatment-and-appetite`. 3.11: `assessment-blind-spots`, `asset-register-gaps`, `invisible-adoption`, `false-assurance`.

*D3: 11 tasks - 42 concepts defined (+1 reuse link: `inference-boundary`) - Bloom 1x remember, 6x understand, 4x apply, 1x analyze.*

---

# D4 - Annex A controls and the AI weave *(27.5% - 11 items)* **[SIGNATURE DOMAIN]**

**Intent.** The four themes and the reasoning that selects among them - **not a
survey of 93 controls.** Control enumeration is confined to task 4.1, which is
declared `1_remember` for exactly that reason. Everything else tests structure,
selection reasoning, and where AI genuinely lands. This domain also carries the
explicit null result: physical controls are taught straight, and the task says
why AI does not change them.

| Code | Task - *the candidate can...* | Bloom | Freq | Crit |
|---|---|---|---|---|
| **4.1** | **Recognize** the **four Annex A control themes** and the number of reference controls. | 1_remember | per_exam | H |
| **4.2** | Explain **control attributes** and how they support selection and reporting. | 2_understand | occasional | M |
| **4.3** | Explain the purpose of the **organizational controls** theme. | 2_understand | weekly | H |
| **4.4** | **Apply** asset-inventory reasoning to determine which **AI components are information assets**. | 3_apply | occasional | H |
| **4.5** | **Apply** least-privilege and identity-lifecycle reasoning to a described access arrangement. | 3_apply | weekly | H |
| **4.6** | **Analyze** how access control assumptions break when a **non-human actor holds credentials and acts**. | 4_analyze | occasional | H |
| **4.7** | Explain **supplier relationship controls** and the security requirements placed on suppliers. | 2_understand | weekly | H |
| **4.8** | **Analyze** what supplier assurance can and cannot establish about a **foundation-model provider**. | 4_analyze | occasional | H |
| **4.9** | Explain the **people controls** theme - screening, terms, awareness, disciplinary process. | 2_understand | weekly | M |
| **4.10** | **Apply** awareness and acceptable-use reasoning to a described **shadow AI** situation. | 3_apply | occasional | H |
| **4.11** | Explain the **physical controls** theme, and **why AI does not materially change it**. | 2_understand | per_exam | M |
| **4.12** | Explain the **technological controls** theme - logging, cryptography, secure development, data leakage prevention. | 2_understand | weekly | H |
| **4.13** | **Apply** information-classification reasoning to content a user is about to enter into an **AI tool**. | 3_apply | occasional | H |

### D4 knowledge / skills / abilities

**4.1** — **K:** the four theme names and the count of reference controls. **S:** names the four themes; identifies which theme a named control belongs to. **A:** navigates Annex A by structure rather than by scanning. *(The only task in this domain that touches the control set as a list, and declared `1_remember` for exactly that reason.)*

**4.2** — **K:** the attribute set and what each attribute expresses. **S:** **explains** what the attributes are for and how they let the same control set be viewed from different angles. **A:** understands that Annex A supports more than one reading. *(Declared Understand deliberately: "selection" in the statement describes what attributes are for, not something the candidate does. The v1.0 statement drifted; the skills line caught it.)*

**4.3** — **K:** the purpose of the organizational theme and the control families within it. **S:** explains what the theme governs and why policy, roles, assets and classification sit together. **A:** locates a governance-shaped control problem in the right theme.

**4.4** — **K:** what makes something an information asset, and which AI components qualify. **S:** given a described AI deployment, determines which components belong on the asset inventory and states what each holds or exposes. **A:** extends an established practice to a component class it was not written for.

**4.5** — **K:** the identity lifecycle, least privilege, and privileged-access handling. **S:** given a described access arrangement, determines whether the rights exceed what the role requires and identifies what would change. **A:** reads access as a live risk surface rather than a settled configuration. *(Raised from Understand in v1.0: the skills line evaluates an arrangement against a taught principle. Distinct from 4.6, which is the agent case and genuinely Analyze.)*

**4.6** — **K:** non-human identity, agent credentials, standing versus just-in-time authority, and the attribution problem. **S:** given a described agent deployment, identifies which access-control assumption has stopped holding and explains why the conventional control does not address it. **A:** recognizes when a control's underlying model, not its implementation, is what failed.

**4.7** — **K:** supplier controls, agreements, supply-chain reach, and delivery monitoring. **S:** explains what security requirements a supplier relationship must carry and why monitoring continues past contract signature. **A:** treats suppliers as part of the estate.

**4.8** — **K:** the foundation-model provider as a supplier, inspectability limits, attestation-based assurance, and concentration risk. **S:** given a supplier assurance process applied to a model provider, identifies which questions the process cannot answer and why direct inspection is unavailable. **A:** distinguishes assurance obtained from assurance assumed.

**4.9** — **K:** the people theme and its control families across the employment lifecycle. **S:** explains what each people control addresses and at which point in the employment relationship it applies. **A:** recognizes that most security outcomes route through people.

**4.10** — **K:** shadow AI, well-intentioned non-compliance, the limits of prohibition, and reporting culture. **S:** given a described shadow AI situation, determines what awareness and acceptable-use response would address it, and rejects a response that would drive adoption further underground. **A:** responds to non-compliance by diagnosing the need behind it.

**4.11** — **K:** the physical theme and its control families, **and the reasoning that establishes AI does not materially change them**. **S:** explains what the physical theme governs, and states why AI adoption does not alter these controls where a candidate might expect it to. **A:** distinguishes a control genuinely affected by a technology shift from one merely adjacent to it.

**4.12** — **K:** the technological theme — logging and monitoring, cryptography, secure development, data leakage prevention. **S:** explains what each control family addresses and how they interact. **A:** reads technical controls as a layered set rather than a product list.

**4.13** — **K:** classification schemes, handling rules, and whether a label survives being retyped into an external tool. **S:** given content and a classification, determines whether entering it into a described AI tool is permitted under the handling rules, and states what makes the difference. **A:** applies handling rules at the moment of the decision rather than after it.

### D4 concepts
- `annex-a-themes` - the four themes into which the reference controls are organized.
- `organizational-controls` - controls concerning policy, roles, assets and supplier relationships.
- `people-controls` - controls concerning individuals and their employment lifecycle.
- `physical-controls` - controls concerning premises, equipment and physical access.
- `technological-controls` - controls concerning systems, networks, development and data.
- `control-attributes` - the attribute set that allows controls to be filtered and reported by different views.
- `control-type` - whether a control is preventive, detective or corrective.
- `security-property-attribute` - which of confidentiality, integrity or availability a control serves.
- `operational-capability` - the operational area a control belongs to.
- `policy-controls` - controls establishing and reviewing security policy.
- `roles-segregation` - separation of conflicting duties.
- `asset-management` - inventory, ownership and acceptable use of assets.
- `information-classification` - assigning and handling information by sensitivity.
- `ai-asset-inventory` - extending the asset inventory to AI components.
- `vector-store-as-asset` - an embedding store as a repository of organizational information.
- `agent-as-asset` - an autonomous agent as an asset with an owner and an acceptable use.
- `prompt-log-as-asset` - retained prompt and completion history as an information store.
- `access-control` - restricting access to information and processing facilities.
- `identity-lifecycle` - provisioning, review and de-provisioning of identities.
- `least-privilege` - granting the minimum access necessary.
- `privileged-access` - elevated rights and their additional controls.
- `non-human-identity` - an identity held by a system or agent rather than a person.
- `agent-credentials` - the credentials under which an agent acts.
- `standing-vs-just-in-time-authority` - persistent authority against authority granted per action.
- `attribution-gap` - the difficulty of attributing an action to a responsible person when an agent acted.
- `supplier-controls` - controls governing information security in supplier relationships.
- `supplier-agreements` - security requirements expressed in supplier contracts.
- `supply-chain-security` - security across the chain of providers, not only the direct supplier.
- `service-delivery-monitoring` - ongoing monitoring of supplier performance against requirements.
- `foundation-model-supplier` - a model provider treated as a supplier within the ISMS.
- `inspectability-limits` - the limits of what a customer can verify about a model provider.
- `assurance-by-attestation` - reliance on third-party attestation where direct inspection is unavailable.
- `concentration-risk` - exposure arising from many services depending on one provider.
- `screening` - background verification proportionate to the role.
- `terms-and-conditions` - security responsibilities expressed in employment terms.
- `awareness-education-training` - ensuring people know their security responsibilities.
- `disciplinary-process` - the process following a security policy violation.
- `shadow-ai` - unsanctioned AI tooling adopted outside the approval process.
- `well-intentioned-noncompliance` - policy breach by people trying to do their job well.
- `awareness-vs-prohibition` - why prohibition alone drives adoption underground.
- `reporting-culture` - conditions under which people disclose rather than conceal tool use.
- `physical-perimeter` - physical security boundaries.
- `equipment-security` - protection of equipment on and off premises.
- `clear-desk-clear-screen` - the control on unattended information.
- `unchanged-by-ai` - the explicit recognition that some controls are not materially affected by AI.
- `logging-and-monitoring` - recording and reviewing security-relevant activity.
- `cryptographic-controls` - use and management of cryptography.
- `secure-development` - security within the development lifecycle.
- `data-leakage-prevention` - controls limiting unauthorized information egress.
- `classification-in-practice` - applying classification to real content in the moment.
- `handling-rules` - what a classification requires of the person holding the information.
- `paste-boundary` - the moment classified content is entered into an external tool.

**Task-concept links.** 4.1: `annex-a-themes`, `organizational-controls`, `people-controls`, `physical-controls`, `technological-controls`. 4.2: `control-attributes`, `control-type`, `security-property-attribute`, `operational-capability`. 4.3: `policy-controls`, `roles-segregation`, `asset-management`, `information-classification`. 4.4: `ai-asset-inventory`, `model-as-asset` *(D1)*, `vector-store-as-asset`, `agent-as-asset`, `prompt-log-as-asset`. 4.5: `access-control`, `identity-lifecycle`, `least-privilege`, `privileged-access`. 4.6: `non-human-identity`, `agent-credentials`, `standing-vs-just-in-time-authority`, `attribution-gap`. 4.7: `supplier-controls`, `supplier-agreements`, `supply-chain-security`, `service-delivery-monitoring`. 4.8: `foundation-model-supplier`, `inspectability-limits`, `assurance-by-attestation`, `concentration-risk`. 4.9: `screening`, `terms-and-conditions`, `awareness-education-training`, `disciplinary-process`. 4.10: `shadow-ai`, `well-intentioned-noncompliance`, `awareness-vs-prohibition`, `reporting-culture`. 4.11: `physical-perimeter`, `equipment-security`, `clear-desk-clear-screen`, `unchanged-by-ai`. 4.12: `logging-and-monitoring`, `cryptographic-controls`, `secure-development`, `data-leakage-prevention`. 4.13: `classification-in-practice`, `handling-rules`, `paste-boundary`, `classification-survival` *(D3)*.

*D4: 13 tasks - 52 concepts defined (+2 reuse links: `model-as-asset`, `classification-survival`) - Bloom 1x remember, 6x understand, 4x apply, 2x analyze.*

---

# D5 - Performance evaluation, improvement and certification *(17.5% - 7 items)*

**Intent.** Clauses 9 and 10, plus what certification actually is - the part most
Foundation candidates get wrong, and where the accreditation-versus-certification
distinction lives. The AI weave is detection: an AI-related incident frequently
leaves no conventional log entry, which is a monitoring problem before it is an
incident-response problem.

| Code | Task - *the candidate can...* | Bloom | Freq | Crit |
|---|---|---|---|---|
| **5.1** | Explain **monitoring, measurement, analysis and evaluation** under clause 9.1. | 2_understand | weekly | H |
| **5.2** | Explain the **internal audit** programme and its purpose. | 2_understand | weekly | H |
| **5.3** | Explain **management review** - its required inputs and its outputs. | 2_understand | occasional | H |
| **5.4** | Explain **nonconformity and corrective action**, including root cause. | 2_understand | weekly | H |
| **5.5** | **Recognize** the **certification process** - stage 1, stage 2, surveillance and the three-year cycle. | 1_remember | per_exam | H |
| **5.6** | Distinguish **certification from accreditation**, and the roles of the certification body and accreditation body. | 2_understand | per_exam | H |
| **5.7** | **Apply** incident-response reasoning to a described **AI-related security incident**. | 3_apply | occasional | H |
| **5.8** | **Analyze** why an AI-related incident may not surface through conventional monitoring. | 4_analyze | occasional | H |
| **5.9** | Explain how **ISO/IEC 42001** relates to an ISMS and why organizations increasingly operate both. | 2_understand | per_exam | M |

### D5 knowledge / skills / abilities

**5.1** — **K:** what must be monitored and measured, by what methods, and what effectiveness means. **S:** explains why measuring activity is not measuring effectiveness, and what makes an indicator useful. **A:** asks what a metric would prove before adopting it.

**5.2** — **K:** the audit programme, audit criteria, the objectivity requirement, and finding types. **S:** explains the purpose of internal audit and why an auditor may not audit their own work. **A:** understands internal audit as an assurance mechanism rather than an inspection. *(Declared Understand deliberately. An applied version — identifying an objectivity conflict in a described assignment — is genuine Apply, but it cannot sit inside an Understand task because `trg_item_bloom_matches_task` stamps items from the task. Making it a 50th task was considered and declined: D5 already carries 9 tasks against 7 items, and objectivity holds as a principle at this tier.)*

**5.3** — **K:** required review inputs, required outputs, and the cadence obligation. **S:** explains what management review must consider and what it must produce. **A:** recognizes review as a decision-making event rather than a status report.

**5.4** — **K:** nonconformity, the correction/corrective-action distinction, root cause, and effectiveness verification. **S:** explains why fixing an instance is not corrective action, and what closes a nonconformity properly. **A:** looks past the symptom to the cause.

**5.5** — **K:** the two audit stages, surveillance, and the three-year cycle. **S:** states what happens at each stage and the sequence they occur in. **A:** holds the certification timeline reliably.

**5.6** — **K:** the certification body's role, the accreditation body's role, the separation between management-system and personnel certification, and what a certificate asserts. **S:** distinguishes certification from accreditation; explains what a certificate does and does not claim. **A:** reads a credential claim precisely rather than by impression.

**5.7** — **K:** the incident-response process, AI-specific incident classes, and containment where the component acts autonomously. **S:** given a described AI-related incident, determines the appropriate response steps in order and identifies what containment requires here that it would not for a static system. **A:** applies an established process to an unfamiliar incident class.

**5.8** — **K:** detection gaps, activity that produces no log signal, semantic versus syntactic detection, and time to discovery. **S:** given an AI-related incident that went undetected, identifies why the monitoring in place could not have surfaced it. **A:** recognizes that absence of alerts is not evidence of absence of incident.

**5.9** — **K:** ISO/IEC 42001 as the AI management system standard, integration across shared processes, overlapping controls, and the separateness of the two certifications. **S:** explains how the two standards relate and why holding one does not confer the other. **A:** situates the ISMS within a wider management-system landscape.

### D5 concepts
- `monitoring-and-measurement` - determining what needs to be monitored and measured, and by what methods.
- `what-to-measure` - selecting indicators that reflect security performance rather than activity.
- `effectiveness-evaluation` - judging whether controls achieve their intended outcome.
- `internal-audit-programme` - the planned programme of internal audits.
- `audit-criteria` - the requirements against which conformity is judged.
- `auditor-objectivity` - the requirement that auditors do not audit their own work.
- `audit-findings` - conformities, nonconformities and observations arising from an audit.
- `management-review` - top management's periodic review of the ISMS.
- `review-inputs` - the information the review must consider.
- `review-outputs` - the decisions and actions the review must produce.
- `review-cadence` - the planned interval at which review occurs.
- `nonconformity` - a failure to meet a requirement.
- `correction-vs-corrective-action` - fixing the instance against removing the cause.
- `root-cause` - the underlying reason a nonconformity occurred.
- `effectiveness-check` - verifying that corrective action worked.
- `stage-1-audit` - the readiness and documentation review stage.
- `stage-2-audit` - the implementation and effectiveness audit stage.
- `surveillance-audit` - periodic audits during the certification validity period.
- `recertification-cycle` - the three-year cycle of certificate validity and renewal.
- `certification-body` - the body that assesses and certifies an organization's ISMS.
- `accreditation-body` - the body that assesses the competence of certification bodies.
- `iso-17021-vs-17024` - certification of management systems against certification of persons, requiring separate accreditation.
- `what-a-certificate-signals` - what a certificate does and does not assert.
- `incident-response-process` - the planned process for responding to security incidents.
- `ai-incident-classes` - incident types specific to AI systems, such as injection and context exposure.
- `containment-with-agents` - containment when the affected component acts autonomously.
- `lessons-learned` - using incidents to improve the ISMS.
- `detection-gaps` - conditions under which an incident produces no monitored signal.
- `absent-log-signal` - activity that generates no conventional log entry.
- `semantic-vs-syntactic-detection` - detecting meaning rather than pattern.
- `time-to-discovery` - the interval between compromise and detection, and why it widens here.
- `iso-42001-aims` - ISO/IEC 42001 as the AI management system standard.
- `management-system-integration` - operating more than one management system on shared processes.
- `overlapping-controls` - controls that satisfy requirements in more than one standard.
- `separate-certifications` - why one certificate does not confer the other.

**Task-concept links.** 5.1: `monitoring-and-measurement`, `what-to-measure`, `effectiveness-evaluation`. 5.2: `internal-audit-programme`, `audit-criteria`, `auditor-objectivity`, `audit-findings`. 5.3: `management-review`, `review-inputs`, `review-outputs`, `review-cadence`. 5.4: `nonconformity`, `correction-vs-corrective-action`, `root-cause`, `effectiveness-check`. 5.5: `stage-1-audit`, `stage-2-audit`, `surveillance-audit`, `recertification-cycle`. 5.6: `certification-body`, `accreditation-body`, `iso-17021-vs-17024`, `what-a-certificate-signals`. 5.7: `incident-response-process`, `ai-incident-classes`, `containment-with-agents`, `lessons-learned`. 5.8: `detection-gaps`, `absent-log-signal`, `semantic-vs-syntactic-detection`, `time-to-discovery`. 5.9: `iso-42001-aims`, `management-system-integration`, `overlapping-controls`, `separate-certifications`.

*D5: 9 tasks - 35 concepts - Bloom 1x remember, 6x understand, 1x apply, 1x analyze.*

---

## JTA totals

| | Tasks | New concepts | Reused links | Blueprint items |
|---|---|---|---|---|
| D1 | 7 | 30 | - | 6 |
| D2 | 9 | 32 | - | 7 |
| D3 | 11 | 42 | 1 | 9 |
| D4 | 13 | 52 | 2 | 11 |
| D5 | 9 | 35 | - | 7 |
| **Total** | **49** | **191** | **3** | **40** |

*Concept counts are the distinct slugs defined in each domain's concept list. The
three reuse entries are `task_concepts` **links** to concepts defined elsewhere,
not list members — total link rows = 191 + 3 = **194**, which is the figure the
scaffold verification query must return.*

**Bloom distribution (49 tasks):** 5x `1_remember` (10.2%), 28x `2_understand`
(57.1%), 11x `3_apply` (22.4%), 5x `4_analyze` (10.2%).

The item-weighted cognitive profile is computed at generation from
`tasks.bloom_level` and the domain allocation; the figures above are the task
distribution, not the profile.

### On the amended profile

BoK v0.2 section 5 projected roughly 10 / 45-50 / 30-35 / 10. The derived figure
is **10 / 57 / 22 / 10**. The projection was made over an unwritten task list;
this is the derivation, and **the derivation governs.** BoK v0.3 now carries the
derived figure; the projection is superseded.

Two Bloom declarations moved in the KSA pass, both on the merits of the skills
line and neither to reach a number:

- **3.2 raised to `3_apply`** — the skills line classifies a risk against stated
  criteria. Explaining what criteria are is comprehension; deciding what falls
  inside them is not.
- **4.5 raised to `3_apply`** — the skills line evaluates an access arrangement
  against a taught principle.

Three were examined and declined:

- **2.4** — determining scope is implementer work and belongs to `ISMS-LI`.
- **4.2** — "selection" described what attributes are *for*, not something the
  candidate does. Statement verb drift, caught by the skills line.
- **5.2** — the applied version is real but would need a 50th task; D5 already
  carries 9 tasks against 7 items.

**Recommendation: accept 57% Understand.** AIGRM-I sits at 62.9% Understand at
the same tier and `COGNITIVE-MODEL.md` defends that as correct for a
comprehension credential. A third of this examination sitting above comprehension
already makes it more cognitively demanding than any Foundation in the collected
market data, where the closest comparator grades two knowledge domains at 50/50.

**Done in BoK v0.3.** Section 5 carries the derived figure; the superseded
projection is recorded so it is not later mistaken for a target that was missed.

### Item-per-task pressure

40 items across 49 tasks is **0.82 items per task** — the lowest ratio in the
catalog. No form can sample every task. This is inherent to a 40-item market
convention over a full Foundation body of knowledge, and it is not a defect: the
blueprint samples by domain weight, and the item bank holds 8 secure per task per
language regardless.

**Consequence to state in the scheme document:** a given form covers a sampled
subset of tasks within each domain's quota. This is normal criterion-referenced
practice and the market comparators do the same at 40 items, but it should be
stated rather than discovered.

---

## Downstream contract (`CERT-CREATION.md` section 4)

Each of the 191 concepts must be taught by at least one lesson per language and
tested to the item floors — **8 secure and 10 practice items per task per
language** across en / es-419 / pt-BR, all 49 tasks — with
`untaught_testing_violations = 0` and the secure firewall at zero concept links.

Design totals: **secure 392 per language (1,176 total)**, **practice 490 per
language (1,470 total)**.

Modules: 5, one per domain, `order_index` aligned 1:1 to the domains.

---

## Resolved at lock

| # | Item | Resolution |
|---|---|---|
| 1 | Amended profile (57% Understand) | **Accepted.** Derivation governs; BoK amended to match |
| 2 | Item-per-task ratio 0.82 | **Accepted as inherent.** Owed: a sampling sentence in `SCHEME-ISMS-F.md` |
| 3 | Task 4.11 (`unchanged-by-ai`) | **Kept.** Reads as a feature; it is the honesty firewall made assessable |
| 4 | Task 5.6 self-reference risk | **Task kept.** Watch item is on lesson copy, not the task |
| 5 | D1 at 7 tasks / 6 items | **Accepted.** Tightest ratio in the cert, within tolerance |

## Carried forward — owed before or during production

1. **`CLAIMS-POLICY` section 4 edition pin** — must land **before**
   `SCHEME-ISMS-F.md` is written, or the scheme doc ships with an ambiguous
   17024 referent and is rewritten. Catalog-wide, not owned by this cert.
2. **`SCHEME-ISMS-F.md` sampling sentence** — a form covers a sampled subset of
   tasks within each domain quota. Normal criterion-referenced practice; state
   it rather than let it be discovered.
3. **ISO/IEC 27000:2026 terminology check** — owed **before D2 lesson
   authoring.** D2 is where definitions live and the document normally cited for
   them has changed underneath us.
4. **`CERT-SCHEMA-GUIDE.md` section 7** — retire the repeating-digit UUID rule
   before this cert is scaffolded.
5. **Volatility register** (`BOK-ISMS-F.md` section 8) — ISO/IEC 27090 and 27091
   publication, OWASP agentic list revision, market data re-check by
   4 February 2027.

---

## Sign-off

- [x] External reviewer full-JTA consistency and commercial review, all five domains, including the KSA lines — **returned: lock**.
- [x] Juan accepted the amended profile and the three Bloom declines — **locked 4 August 2026**.

**Stage 6 begins.** Scaffold migrations, editor-first, per `CERT-CREATION.md`
and `CERT-SCHEMA-GUIDE.md`: cert row + `security` category (SECTION 0, founding)
+ 5 domains + 49 tasks + 191 concepts + `task_concepts` links + 5 modules, in two
numbered migrations.

*End of JTA v2.0.1 - LOCKED.*
