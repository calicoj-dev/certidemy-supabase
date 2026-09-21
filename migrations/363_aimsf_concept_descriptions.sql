-- 363_aimsf_concept_descriptions.sql
--
-- All 154 AIMS-F concept descriptions were one template stub:
--
--     <name> as required or described by ISO/IEC 42001:2023 and taught in the
--     AIMS-F blueprint.
--
-- 154 of 154, byte-exact after the name. Every other certification had zero
-- such rows, confirmed two independent ways: a name-prefix probe and a
-- shared-suffix probe that share no logic. AIMS-F's description lengths ran
-- 92-123 characters -- a tight band is the signature of a template -- and its
-- MEAN was 104 against ISMS-F's 60, so the stub was LONGER than a real
-- one-liner and no length check would ever have found it.
--
-- ============ WHAT THE STUB DID AND DID NOT DO ============
--
-- item-pipeline.mjs interpolates concept descriptions into two generation
-- prompts, and all 631 AIMS-F English items came through that path. Measured
-- against ISMS-F as a control and then against all twelve certifications:
-- stem length, option length, option-count distribution, duplicate options,
-- stem echo, negation balance, within-task Jaccard, Bloom distribution,
-- concept links per item. AIMS-F is mid-pack on every one.
--
-- The one gap -- concept-name echo, 17.2 percent against ISMS-F's 28.3 --
-- disappeared against the population: across twelve certifications the range
-- is 12.9 to 31.2, AIMS-F is fourth from the bottom and ISMS-F is second from
-- the TOP. The control was the outlier.
--
-- So this is a content-gap repair, not a bank repair. The limit, stated:
-- `concepts` has no timestamps, so nothing establishes what the descriptions
-- held when those items were drafted. This failed to find damage; it did not
-- rule it out.
--
-- ============ THE HOUSE STYLE, AND WHY IT IS NOT ISMS-F'S ============
--
-- A one-line description of a DEFINED TERM must say something the definition
-- does not: the consequence, the distinction, or what a practitioner does with
-- it. A glossary gloss has failed EVEN AT A LEAK SCORE OF 0, because at this
-- length no n-gram instrument can see the category.
--
-- YOU CANNOT STATE WHAT A DEFINITION OMITS IN LESS SPACE THAN THE DEFINITION.
-- These run 160-258 characters where ISMS-F's one-liners run 28-131, and that
-- is the reason rather than an excuse. ISMS-F's terse style is now the suspect
-- one: 14 of 23 tier-A gloss candidates are its, and at ~60 characters a
-- description of a defined term has nowhere to go but the definition.
--
-- ============ SOURCES, AND WHAT WAS DELIBERATELY NOT USED ============
--
-- Written from AIMS-F's own 35 English lessons and 35 task KSA records.
-- iso42001.pdf was NOT opened for any of the 154. Drawing from the standard is
-- what the leak gate exists to prevent, and at this length the gate cannot see
-- a defined-term gloss at all -- so the defence had to be the source, not the
-- threshold.
--
-- Measured against an index of NINE standards (19011, 22989, 27000, 27001,
-- 27001/Amd1, 27002, 27004, 27005, 42001), per source and never against the
-- union: 0 fires, longest run 8 words, every row under the coverage floor.
-- The same 154 also scored 0 against the earlier three-standard index.
--
-- ============ THE ONE NAME THAT CHANGES ============
--
-- `Pdca cycle` -> `PDCA cycle`. An initialism correction, not a rename: the
-- slug, the task mapping and the domain structure are untouched, and post-
-- condition 3 asserts that no OTHER name moved.
--
-- ============ THIS WITHHOLDS 308 TRANSLATIONS, DELIBERATELY ============
--
-- 359 keyed concept_translations.en_hash to concept_row_en_hash(concept_id).
-- Every English description changes here, so all 308 rows stop matching and
-- fall back to English. That is correct: those translations render the stub,
-- and a faithful translation of a stub is a correct translation of nothing.
-- They are deleted and regenerated separately, not repaired in place.
--
-- Post-condition 5 asserts the rows still EXIST and that none passes the gate,
-- because a delete would also satisfy "cannot serve" and would be a different
-- and worse outcome to arrive at by accident.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  v_cert     uuid;
  v_rest_b   text;
  v_rest_a   text;
  v_slugs_b  text;
  v_slugs_a  text;
  v_names_b  text;
  v_names_a  text;
  n          int;
begin

  select c.id into v_cert from public.certifications c where c.code = 'AIMS-F';
  if v_cert is null then raise exception 'AIMS-F not found'; end if;

  -- ----------------------------------------------- pre-conditions
  -- THE STUB MUST STILL BE THERE, on all 154. If someone has already written
  -- descriptions, this migration must not overwrite their work.
  select count(*) into n
    from public.concepts cn
   where cn.certification_id = v_cert and cn.retired_at is null;
  if n <> 154 then
    raise exception 'expected 154 live AIMS-F concepts, found %', n;
  end if;

  select count(*) into n
    from public.concepts cn
   where cn.certification_id = v_cert and cn.retired_at is null
     and cn.description = cn.name || ' as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.';
  if n <> 154 then
    raise exception '% of 154 rows still hold the stub -- someone has edited these', n
      using hint = 'Read the rows before rerunning. This migration is not authorised to overwrite written descriptions.';
  end if;

  -- CHECKSUMS captured BEFORE, over what this migration must not change.
  -- No counts and no literals: a count passes on two rows swapping values, and
  -- a literal is a second copy of a fact that lives in the database.
  select md5(string_agg(cn.slug || '|' || cn.name || '|' || coalesce(cn.description, ''), '~' order by cn.slug))
    into v_rest_b from public.concepts cn where cn.certification_id <> v_cert;
  select md5(string_agg(cn.slug, '~' order by cn.slug))
    into v_slugs_b from public.concepts cn where cn.certification_id = v_cert;
  select md5(string_agg(cn.name, '~' order by cn.slug))
    into v_names_b from public.concepts cn
   where cn.certification_id = v_cert and cn.slug <> 'pdca-cycle';

  -- ----------------------------------------------- the descriptions
  update public.concepts cn
     set description = v.d
    from (values
    ('ai-management-system', 'What ISO/IEC 42001 actually places requirements on. It governs how an organization decides, documents and checks its use of AI, and says nothing about what a model must do.'),
    ('management-system-standard', 'A standard specifying what an organization must decide and be able to show, not what its technology must do. It is why no fairness metric is mandated anywhere in ISO/IEC 42001.'),
    ('pdca-cycle', 'Practice vocabulary for the rhythm clauses 4 to 10 imply. The standard never uses the phrase; clause 10.1 requires continual improvement, and the numbering reflects neither importance nor the order of implementation.'),
    ('management-system-certification-basis', 'Not in ISO/IEC 42001 at all. ISO/IEC 42006 governs the bodies that certify an AIMS and ISO/IEC 17021-1 carries the two-stage audit and surveillance cycle; clause 9.2 is internal audit, a different activity.'),
    ('ai-provider-role', 'The organization supplying AI to others, as a platform or as a product or service. Controls about supplying documentation to third parties land here, and an organization that supplies nothing may exclude them.'),
    ('ai-producer-role', 'The widest of the six categories: developers, designers, testers, deployers, procurers, impact assessors and oversight professionals all sit inside it. Treating developer as a peer category is how an organization concludes a role does not apply when it does.'),
    ('ai-customer-role', 'The organization obtaining and using AI, end users included. Holding it exempts you from nothing: a customer for one system is routinely a producer for another.'),
    ('ai-partner-role', 'System integrators and data providers, alongside the system rather than in it. The category exists because responsibilities have to be allocated to parties who are neither the supplier nor the user.'),
    ('ai-subject-role', 'Those the system acts on, data subjects among them. The one role an organization does not choose, and the reason impact assessment reaches people who never interact with the system.'),
    ('role-determination-requirement', 'Clause 4.1 says shall, not should, and the answer is per AI system rather than per organization. It has no counterpart in ISO/IEC 27001, where how you relate to an asset does not change your obligations.'),
    ('role-dependent-applicability', 'Why role determination is not a labelling exercise: the role decides which Annex A controls apply and how far. An exclusion reading we act as a provider for no system in scope is testable; not relevant is not.'),
    ('ai-system-life-cycle', 'The span obligations attach to, reaching from development through transfer and decommissioning. It is why throughout its life cycle recurs across the control objectives, and why deployment is not the finish line.'),
    ('life-cycle-stages', 'Not fixed by the standard. ISO/IEC 22989 and ISO/IEC 5338 offer models and an organization may define its own; what is required is criteria for whichever stages it actually uses.'),
    ('continuous-learning-behaviour', 'Behaviour that moves by design, because output and production data are fed back into training. Where it is in use, monitoring has to confirm the system still meets its design goals on real production data.'),
    ('retraining-and-drift', 'The mechanism teams miss: the model is frozen and the world is not, so performance moves with no learning at all. Monitoring identifies the need to retrain, and a retrained system has had a significant change.'),
    ('harmonised-structure', 'Identical clause numbers, titles and core definitions shared with ISO/IEC 27001 and ISO 9001. Annex D calls the same thing the high-level structure, and the familiar parts are not where your attention belongs.'),
    ('clauses-four-to-ten', 'Context, leadership, planning, support, operation, performance evaluation, improvement. Shared numbering guarantees the question is asked in the same place; it guarantees nothing about whether the answer carries over.'),
    ('integrated-management-system', 'Reusing the machinery, one audit programme and one management review and one documented-information control, after checking what it now governs. Reusing it without checking is assumption rather than integration.'),
    ('iso-42001-27001-integration', 'Annex D.2 calls integration essential and names ISO/IEC 27001 first, allowing controls that partly relate to information security to run on an existing 27001 implementation. Role determination and the impact assessment have nowhere to carry over from.'),
    ('voluntary-standard', 'Nothing obliges an organization to implement ISO/IEC 42001, and the standard calls adopting an AIMS a strategic decision. Voluntary describes the obligation to adopt, not how far the requirements bind once it has.'),
    ('regulatory-driver', 'The loudest reason organizations adopt an AIMS and rarely the only one. Customer expectation and the internal need to describe AI use that has outrun anyone''s account of it stack alongside it rather than competing.'),
    ('certification-is-not-compliance', 'Conformity supports a claim about evidence, scoped to the organization''s role. A certified organization may still be in breach and an uncertified one fully compliant, because the two assessments have different criteria and different assessors.'),
    ('eu-ai-act-overview', 'Risk-tiered, extraterritorial by market placement, and phased over years. Its timetable has already been amended once, so the shape is what is durable and any specific date should be treated as perishable.'),
    ('aims-vs-model-assurance', 'The standard requires the organization to name its objectives, carry them into specific life cycle stages, and evaluate against them. It supplies no fairness metric, no evaluation method and no permitted architecture.'),
    ('aims-vs-ethics-framework', 'An existing ethics programme usually supplies the objectives the standard requires you to identify. What the AIMS adds is the machinery around them: documented, carried into life cycle stages, assessed, monitored, and improved when they fail.'),
    ('nist-ai-rmf-relationship', 'Cited in the context clause for its account of role types across the life cycle. A complementary description of the same territory rather than an alternative to choose between, and many organizations hold both.'),
    ('sector-application-annex-d', 'The standard takes an AI-technology-specific view while sector standards approach the same objective technology-neutrally. Neither substitutes for the other, which is the argument leading to Annex D.2''s conclusion that integration is essential.'),
    ('organizational-context', 'Determined before scope, before policy and before risk, because everything downstream is calibrated to it. Clause 9.3 then requires management review to revisit it, so context written once at implementation describes only the moment the programme started.'),
    ('internal-external-issues', 'Externally: legal requirements including prohibited uses, regulator guidance, incentives, culture and values, and the competitive landscape. The last is there because pressure to ship shapes AI risk in a way it rarely shapes security risk.'),
    ('interested-parties-ai', 'A party can affect a decision, be affected by one, or believe themselves affected - and perception alone is enough. Someone who believes your system affects them behaves as though it does, and you meet them first in a complaint.'),
    ('climate-change-relevance', 'A shall in clause 4.1, and deciding it is not relevant is a legitimate answer. What is not available is not deciding, because the requirement is the determination rather than any particular outcome.'),
    ('affected-individuals', 'Applicants never hired, people quoted who do not buy, accounts belonging to someone else''s users. None appears on a conventional stakeholder map, and an impact assessment can only reach parties someone identified first.'),
    ('aims-scope', 'Sets the reach of every requirement, control and objective in the standard. A system outside it is outside the risk assessment, the impact assessment, the controls and the audit programme, which is why auditors weight it beyond its length.'),
    ('scope-boundary-decision', 'The most consequential single act in a clause 4 implementation. A boundary drawn around the AI we built excludes purchased features, model endpoints called by internal tooling, and anything a team adopted without procurement.'),
    ('third-party-ai-in-scope', 'Using is enough; there is no threshold of authorship below which the standard stops applying. Purchased features, external model endpoints and partner-supplied systems are all inside applicability, and none arrives through a channel that leaves a record.'),
    ('shadow-ai', 'Undeclared use makes the boundary inaccurate in a direction nobody can see, so an inventory can be complete and correct and still describe a fraction of reality. Rarely defiance: the tool needed no budget, and nothing signalled that governance existed.'),
    ('scope-as-documented-information', 'Define the boundary by criteria a reader could apply to a system they encountered, not by a list of systems, because the estate moves faster than the document. Exclusions are where an auditor looks first, since the reasoning is testable.'),
    ('top-management-commitment', 'Clause 5.1 lists eight demonstrations and each is testable, including integrating AIMS requirements into business processes and supporting other roles to lead within their own areas. A statement of support is not among the eight.'),
    ('ai-policy', 'Frames the objectives, commits to meeting requirements and to continual improvement, and must reference the other policies AI intersects. One referencing none describes an organization that has none; one with no exception route is ignored at a deadline.'),
    ('ai-objectives', 'Seven properties apply, and planning for one requires what, which resources, who, when, and how results will be evaluated. That last element is where objective-setting usually fails: no evaluation method means nothing to monitor.'),
    ('policy-vs-objective', 'A policy states intent and direction; an objective is a result to be achieved. We will use AI responsibly is a policy statement and cannot be an objective, because nothing about it can be monitored.'),
    ('objectives-measurable', 'Measurable where practicable, because the standard accepts that some objectives resist quantification. The hedge is not a general exemption: the other six properties still bind, and monitoring becomes harder rather than optional.'),
    ('planning-of-changes', 'Clause 6.3 governs changes to the management system itself, distinct from clause 8.1''s changes to the operations it controls. Where a management review decides the AIMS must change, this is the clause requiring that it be done in a planned manner.'),
    ('roles-responsibilities-authorities', 'Assigned and communicated, because an assignment nobody knows about can be neither acted on nor escalated to. Responsibility travels with authority, or the role can only document its own concerns being overruled.'),
    ('conformance-authority', 'One of the two assignments clause 5.3 names: someone owns whether the management system meets the standard''s requirements, as distinct from whether individual activities were performed.'),
    ('performance-reporting-authority', 'The second named assignment, and it exists so leadership cannot be uninformed by accident. Top management must ensure the AIMS achieves its results and must review it, and neither is possible if news arrives only after something has gone wrong.'),
    ('ai-risk-criteria', 'Established before any assessment runs, and required to support four things: separating acceptable from unacceptable, running assessments, treating the result, and assessing risk impacts. The fourth wires clause 6.1.4 in before it appears.'),
    ('ai-risk-assessment', 'Anchored to the AI policy and objectives, and its analysis assesses consequences to the organization, individuals and societies - all three. It is not the organization-only half of a pair with the impact assessment.'),
    ('risk-identification-ai', 'Annex C''s risk sources reach what a conventional IT assessment does not, because that assessment asks what could go wrong with a system behaving as specified. Several of these concern one behaving exactly as built and still doing harm.'),
    ('risk-analysis-and-evaluation', 'Analysis determines consequences, likelihood where applicable, and levels; evaluation compares against the criteria and prioritizes for treatment. Likelihood is the wrong instrument for some AI risks, so the criteria must handle consequence alone.'),
    ('consistent-repeatable-results', 'The process must be designed so that running it again produces answers that agree, hold up, and can be set side by side. This is what turns assessment from an opinion into a method, and it is the property most often failed.'),
    ('ai-system-impact-assessment', 'Reaches past intended use into foreseeable misuse, and past the organization into societies. Its results are a required input to the risk assessment, and clause 8.4 requires it performed at planned intervals and on significant change.'),
    ('foreseeable-misuse', 'The requirement most often quietly dropped, because assessing intended use is natural while imagining your own product turned against its purpose does not come up unless someone asks. The clause asks.'),
    ('impact-on-individuals', 'Legal standing and life chances, physical and psychological well-being, human rights, with protection needs named for children, impaired and elderly persons and workers. It covers expectations, so a system can meet every specification and still breach them.'),
    ('impact-on-societies', 'Economic, environmental, government, health and safety, and norms and values. Explicitly beneficial as well as detrimental, so an assessment that only catalogues harms is not doing what the clause asks.'),
    ('jurisdictional-context', 'The assessment takes into account the particular technical and social setting a system is deployed into, and the applicable jurisdictions. Deploying the same system into a new market is a significant change, not a copy of one already done.'),
    ('impact-assessment-documentation', 'Documented, retained for a defined period, and where appropriate made available to relevant interested parties. That disclosure pathway makes it a different artifact from a record written to stop at the risk committee.'),
    ('risk-vs-impact-assessment', 'The intuitive split - risk to us, impact to them - is contradicted by the text twice. An organization that believes the two are parallel builds two disconnected processes, and the impact work never reaches the decisions the risk work drives.'),
    ('impact-feeds-risk', 'Clause 6.1.4 requires the impact assessment''s results to be taken into account when risk is assessed. It is an input rather than a parallel process, and considering it is a shall.'),
    ('anchoring-difference', 'The cleanest distinction between them. Risk is anchored to the AI objectives and asks what could deflect us; impact is anchored to deployment, intended use and foreseeable misuse and asks what the system does to people.'),
    ('disclosure-difference', 'The risk assessment is internal and retained; the impact assessment''s result may be made available to interested parties. A record a regulator or an affected individual might read is a different document from one that stops inside.'),
    ('ai-risk-treatment', 'Controls are determined first from the chosen treatment options, and Annex A enters afterwards as a comparison to catch what was missed. Opening the annex first inverts the logic and leaves no link from risk to control for an auditor to test.'),
    ('treatment-options', 'Modify, retain, avoid and share are practice vocabulary rather than text from clause 6.1.3, which requires appropriate options to be selected without enumerating them.'),
    ('treatment-plan', 'Formulated after the Statement of Applicability, then implemented under clause 8.3 with its effectiveness verified. Where an option proves ineffective it is reviewed, revalidated and the plan updated - a defined path, not a failure.'),
    ('inclusion-exclusion-justification', 'Required in both directions, and the two named grounds for exclusion both point at something checkable: the risk assessment, or an external requirement. A justification that cannot be tested against another artifact is an assertion.'),
    ('residual-risk-approval', 'Designated management approves the treatment plan and accepts what remains. Where assurance is simply unobtainable, as with a foundation model, the honest treatment records the limit and has someone with authority accept it.'),
    ('statement-of-applicability', 'Not a control register: all identified risks and the measures addressing them must be reflected in it, which makes each entry traceable to the risk that required it. Every Annex A control must be addressed, and absence is neither inclusion nor exclusion.'),
    ('aims-resources', 'Data, tooling, system and computing, human, and system components, identified per life cycle stage. They can come from the organization, its customers or third parties, and documenting them is what informs the impact assessment.'),
    ('competence-requirements-ai', 'Scoped to persons doing work under the organization''s control rather than to employees, so a contractor labelling data or an agency operating a deployed system is inside it. Where action is taken to acquire competence, its effectiveness must be evaluated.'),
    ('competence-evidence', 'Documented information must be available to show it. Sending people on a course is the action; establishing that they can now do the thing is the requirement, and only the second is evidence.'),
    ('ai-expertise-diversity', 'Data scientists, trustworthiness specialists, domain experts, and people carrying human oversight - a span that does not usually sit in one team. A model triaging medical claims needs someone who understands claims, not only someone who understands models.'),
    ('awareness-requirement', 'Three items: the policy, what you contribute to making the system effective including what better performance buys, and the implications of not conforming. The second is the one awareness material routinely drops.'),
    ('work-under-organizational-control', 'The scope of both competence and awareness, and it is wider than the payroll. Contractors, agency staff and consultants operating a system on the organization''s behalf are all inside it if they can affect AI performance.'),
    ('communication-planning', 'Four decisions - what, with whom, when and how - covering internal and external alike. An organization that communicates whenever something notable happens has reacted to events rather than planned communication.'),
    ('documented-information', 'What the standard requires plus what the organization judges necessary, with its extent varying by size, process complexity and the competence of people. More documentation is not better documentation.'),
    ('creating-and-updating', 'Identification and description, appropriate format and media, and review and approval for suitability. The third is the one with teeth: a record nobody reviewed is a record whose accuracy nobody stands behind.'),
    ('control-of-documented-information', 'Available and fit to use where needed, and protected against lost confidentiality, misuse and lost integrity. Permission to view and authority to change are different grants, and conflating them is how a record gets edited by someone meant only to read it.'),
    ('external-origin-documents', 'Model cards, supplier terms, dataset sheets, notice that a model has been updated. Created by someone else, necessary to operate, able to change without you being consulted - and the practical failure is one downloaded once and never re-checked.'),
    ('operational-planning-and-control', 'Controls selected during treatment must be implemented, their effectiveness monitored, and corrective action considered where results do not follow. A control chosen, deployed and never looked at again satisfies clause 6.1.3 and fails clause 8.1.'),
    ('process-criteria', 'The answer to how would we know this process ran properly: which approvals, what validation evidence, what acceptable ranges, who signs off. Without them, control degenerates into an experienced person forming a view, which no auditor can test.'),
    ('change-control-ai', 'Planned changes are controlled and the consequences of unintended ones reviewed, and unintended change is the normal condition here. A process keyed to discrete events will never fire for drift, because nothing happened.'),
    ('externally-provided-processes', 'Processes relevant to the AIMS that someone else runs must still be controlled. Outsourcing relocates the work and not the obligation, which is the same point the allocation control makes about third parties.'),
    ('third-party-ai-supply', 'Datasets, algorithms, models, libraries, or an entire system - and organizations usually reason about only one point on that range. Treatment is risk-differentiated, so handling a date-formatting library and a foundation model alike mismanages one of them.'),
    ('supplier-obligations', 'Establish a process aligning supplier use with your own responsible approach, document how supplied components are integrated, and require corrective action where one misperforms. Alignment with your approach presupposes that you have one.'),
    ('supplier-documentation', 'The organization determines what information it needs from suppliers and ensures adequate documentation is delivered. Concluding that you need information you cannot get is a legitimate outcome of that determination, and belongs in the risk assessment.'),
    ('model-supply-chain', 'For a foundation model reached as a service, several assurance questions have no available mechanism: training data and rights, what was filtered, pre-release evaluation, what the provider retains. No clause creates a capability that does not exist.'),
    ('data-for-ai-systems', 'A control category of its own, because representativeness, labelling accuracy and preparation method have no information security counterpart. A dataset can be perfectly confidential, intact and available, and completely unfit.'),
    ('data-acquisition', 'Records sources, the demographics of data subjects including biases known or suspected, prior handling and whether it conformed, data rights covering personal information and copyright, and provenance. Bias is asked at acquisition, not found in testing.'),
    ('data-quality', 'Defined requirements the data used to develop and operate the system must meet, with the effect of bias on performance and fairness weighed and the model or data adjusted. Distinct from integrity, which only says nobody unauthorised altered it.'),
    ('data-provenance', 'A documented process recording creation, update, transcription, abstraction, validation and transfer of control across the life cycles of both the data and the system. Whether verification measures are needed depends on source, content and context of use.'),
    ('data-preparation', 'The criteria for selecting preparation methods, and then the methods used. Imputation choices and labelling rules are decisions with consequences for what the model learns, which is why the standard asks for the reasoning and not only the technique.'),
    ('shared-clause-seven-eight', 'Documented-information control, communication and awareness infrastructure, and change machinery genuinely transfer from an ISMS. Reuse them, then check what is now flowing through them: a records process that never handled a model card is only unasked.'),
    ('competence-does-not-carry', 'Clause 7.2 is identical in both standards and the competence it requires is not. A security team''s records evidence security competence and say nothing about whether anyone can tell that a model''s output is wrong.'),
    ('carry-over-limits', 'The dangerous category is carries in form but not in content - operational process criteria, supplier assurance, incident handling. It looks like a clean carry-over, because the process exists and is followed and nobody checked its assumptions.'),
    ('clause-eight-operation', 'Clause 6 defines the processes; clause 8 requires them to be run. Organizations fail the second far more often, and a management system with processes but no results is not operating.'),
    ('planned-intervals', 'The organization''s decision, and the standard names no frequency. The right one is a function of how fast a particular system''s behaviour and context can move, so an annual cycle borrowed from an information security programme may be badly wrong.'),
    ('significant-change-trigger', 'Undefined by the standard, and several changes that should fire it originate outside the organization: a supplier''s model version, a shift in the population served, a new jurisdiction. A trigger written around your own actions will miss most of them.'),
    ('retained-results', 'Documented information on the results of all risk assessments, treatments and impact assessments. That word all makes them a cumulative series rather than a current version, and overwriting last quarter''s destroys the record of how the picture moved.'),
    ('annex-a-structure', 'Normative, and a reference set rather than a checklist. Nine categories numbered A.2 to A.10, because A.1 is the annex''s own general clause rather than a control group.'),
    ('control-categories', 'Policies, internal organization, resources, impact assessment, life cycle, data, information for interested parties, use, and third-party and customer relationships. They do not map onto ISO/IEC 27001''s four themes, and mapping them is the error.'),
    ('control-count', 'Thirty-eight controls, distributed unevenly, with the life cycle category holding nine across its two subdivisions. Nine categories carry ten objectives because A.6 subdivides and each half states its own, which is why published summaries disagree.'),
    ('annex-b-normative', 'Normative rather than informative, and where each control''s actual meaning lives. What confuses people is that an organization need not justify in the Statement of Applicability which parts of the guidance it adopted.'),
    ('annex-a-not-exhaustive', 'Additional control objectives and controls can be needed, and the organization may design its own or take them from elsewhere. Both directions are permitted, so an SoA holding exactly thirty-eight controls has probably not finished thinking.'),
    ('soa-annex-a-relationship', 'Runs in one direction: controls are determined from the treatment options, then compared against the annex to verify nothing necessary was omitted. The inverted approach produces a document of similar length with no link from risk to control.'),
    ('soa-completeness', 'Every Annex A control must be addressed - included with justification, or excluded with justification. A control that simply does not appear is neither, and that is a finding regardless of whether it was needed.'),
    ('exceeding-annex-a', 'The Statement of Applicability may carry controls the organization established itself beyond the annex, and fewer where the risks do not require them. Sufficiency is set by the risk assessment, not by the size of the reference set.'),
    ('policy-controls', 'Document the policy, align it with the other policies AI intersects, and review it at planned intervals. The review consumes management review results, which closes a loop back to clause 9.3.'),
    ('internal-organization-controls', 'Define and allocate AI roles, and provide a route to report concerns. Built first, because the impact assessment, life cycle and data controls all assume someone owns the work and knows what it consumes.'),
    ('reporting-of-concerns', 'Seven properties including anonymity options, promotion to employed and contracted persons, qualified staffing, escalation, and protection from reprisals for reporters and investigators alike. Most of what goes wrong is visible to someone first.'),
    ('resource-controls', 'Data, tooling, system and computing, and human resources identified per life cycle stage. Environmental cost sits inside the computing control, so one of the things being inventoried is a societal impact category from clause 6.1.4.'),
    ('impact-assessment-controls', 'Establish the process, document and retain results, assess impacts on individuals or groups, and assess societal impacts. The last two are separate controls, so an organization can be complete on one and absent on the other - societal is usually the gap.'),
    ('responsible-development-controls', 'Objectives for responsible development identified, taken into account, and integrated into the development life cycle. If fairness is an objective it should be present at requirements, data acquisition, conditioning, training and validation.'),
    ('life-cycle-stage-controls', 'Seven controls running from requirements and specification through design, verification and validation, deployment, operation and monitoring, technical documentation, and event logging. Read in order they describe a system''s whole existence.'),
    ('verification-validation-controls', 'Measures and the criteria for using them, covering test data and how well it represents the intended domain, release criteria and acceptable error rates. The guidance anticipates a system that cannot meet its criteria and directs a deliberate decision.'),
    ('operation-monitoring-controls', 'At minimum system and performance monitoring, repairs, updates and support. This is where continuous learning and drift stop being characteristics of AI and become an obligation to keep looking.'),
    ('event-log-controls', 'A determination duty with a floor: decide at which life cycle phases logs are kept, with in-use as the stated minimum. Logging everything satisfies it no better than logging nothing, because what is required is a decision per phase that can be explained.'),
    ('data-controls', 'Development data management, acquisition, quality, provenance and preparation. The pattern across all five is define, document and do - an imputation method or a labelling rule is treated as a choice requiring justification rather than a step someone took.'),
    ('information-for-users', 'Purpose, limitations, expected lifetime, oversight needs, accuracy, impact assessment findings, and that they are dealing with an AI system at all. The criteria for deciding what to provide are documented, and the organization validates users can reach it.'),
    ('external-reporting-control', 'A route for interested parties to flag harm the system has done - interested parties, not only users. A person the system acted on may have no account, no contract, and no obvious way to reach the organization at all.'),
    ('incident-communication-control', 'A determined and documented plan for telling users. AI incidents can be specific to the system or be information security or privacy events, and integrating them into existing incident management works only if what is unique to AI stays in view.'),
    ('use-of-ai-controls', 'Processes for responsible use, objectives for it, and use according to intended use. The processes are the considerations determining whether to use a system at all: approvals, cost including ongoing monitoring, sourcing, and legal requirements.'),
    ('intended-use-control', 'The system is used according to its instructions and documentation, and the data it runs on aligns with them. Where correct deployment still causes concern about impact or legal requirements, the guidance directs raising it with the supplier too.'),
    ('human-oversight-guidance', 'Reviewers with the authority to overturn what the system decided, oversight placed at determined life cycle stages, and its depth informed by the impact assessments. The last item on the list is whether automated decision-making is appropriate at all.'),
    ('third-party-controls', 'Allocate responsibilities across the organization, its partners, suppliers and customers, and run a supplier process aligned with your own responsible approach. Allocation documents who intervenes in the life cycle; it does not move accountability away.'),
    ('customer-controls', 'Most often skipped, because it points outward in a direction organizations do not habitually think about. Where a system is valid only for a certain domain those limits are communicated - risk treatment by disclosure, which needs a reachable recipient.'),
    ('control-overlap', 'Largest where an AI control is really an information security control applied to an AI asset: protecting models and datasets, records governance, incident machinery, named AI security threats. Smallest where security has no concept of the thing.'),
    ('single-control-two-systems', 'Annex D.2 permits implementing controls that partly relate to information security through an existing ISO/IEC 27001. Document that the shared control serves both, so the Statement of Applicability shows reasoning rather than an apparent omission.'),
    ('false-equivalence-controls', 'Access to a model is not provenance of its training data; integrity is not quality; a supplier security assessment is not AI assurance; security logging is not AI event logging. Each security control is correct, necessary, and answering another question.'),
    ('monitoring-and-measurement', 'Four determinations: what, which methods, when it happens, and when results are analysed. Data collected continuously and looked at annually is being collected rather than monitored, and the two are separate decisions.'),
    ('what-to-monitor', 'Behaviour that moves without an event is the hard case, because monitoring built around failures never fires for drift. What catches it is measuring output distributions, accuracy against fresh ground truth and override rates, compared across time.'),
    ('aims-effectiveness-vs-system-performance', 'Performance carries both senses here: what using the AI systems achieves, and how the management system itself is doing. A diagnostic - if every model performed perfectly for a year, would your monitoring show whether the management system worked?'),
    ('evidence-of-results', 'Documented information must be available showing what monitoring and measurement produced, and the methods must be capable of producing valid results. A proxy nobody has validated against the thing it stands for produces numbers rather than information.'),
    ('internal-audit-requirement', 'Tests conformity against the organization''s own requirements as well as the standard''s, and whether the system is effectively implemented and maintained. A finding can be entirely legitimate without pointing at any clause of the standard.'),
    ('audit-programme', 'Covers methods, frequency, responsibilities, reporting and planning, and considers the importance of the processes audited and what earlier audits found. Evidence is required of the programme''s implementation as well as of its results.'),
    ('audit-criteria-and-scope', 'Defined per audit, not once for the programme. An audit without a stated scope produces findings nobody can situate, and a combined audit plan listing only information security criteria has not covered the AIMS whatever else it examined.'),
    ('auditor-objectivity', 'The requirement attaches to the process rather than to the character of the individuals, so asserting it does not achieve it. An internal audit may be conducted by an external party on the organization''s behalf, which the standard contemplates directly.'),
    ('management-review', 'Top management, not a working group reporting to them, confirming the system is still suitable, adequate and effective. Those three are not synonyms, and a review that does not separate them has usually answered only the last.'),
    ('review-inputs', 'Prior actions, changes in issues, changes in interested-party needs, performance including trends, and improvement opportunities. Trends is the word doing the work: a single period''s figures cannot show movement, which is what determines whether to act.'),
    ('review-results', 'Decisions about improvement opportunities and about any changes the system needs. Both are decisions rather than summaries of discussion, and where a change is decided, clause 6.3 governs carrying it out in a planned manner.'),
    ('review-records', 'Evidence of the results, which means the decisions rather than the discussion. An auditor asking what the review decided and receiving a narrative of what was presented has found something.'),
    ('nonconformity', 'Includes failing the organization''s own policy, objectives and documented processes, and requirements that are generally implied rather than written. In a young field much of what is reasonably expected has not been written down and is a requirement anyway.'),
    ('correction-vs-corrective-action', 'Correction contains the instance and deals with the consequences; corrective action removes what caused it. The clause requires both, and asks not only whether the failure will recur here but whether similar ones exist or could occur elsewhere.'),
    ('cause-analysis', 'For an AI failure the cause frequently sits outside the process that failed - in data, a supplier''s change, competence, a trigger that did not fire, or scope. An analysis terminating at a process step describes where it was detected.'),
    ('effectiveness-review', 'The effectiveness of any corrective action taken must be reviewed, and actions must be appropriate to the effects encountered. Over-responding degrades the system by making it expensive to follow, which is the less obvious half of proportionality.'),
    ('continual-improvement', 'Clause 10.1''s obligation, covering the system''s suitability, adequacy and effectiveness. Three separate paths lead from this is not working back to a decision, and using none of them means waiting for internal audit, the slowest instrument there is.'),
    ('certification-route', 'Not described in ISO/IEC 42001 at all. Attributing the two-stage audit or a certificate validity period to the standard being certified against is the same class of error as claiming one from ISO/IEC 27001.'),
    ('stage-one-stage-two', 'Stage 1 examines whether the system is designed to meet the requirements; stage 2 examines whether it is actually operating. An organization with excellent documentation and no operating history struggles at the second.'),
    ('surveillance-and-recertification', 'Surveillance audits sample across the cycle; recertification reassesses the whole system at its end. Both come from ISO/IEC 17021-1, and the durable part is the shape rather than any particular duration.'),
    ('iso-42006-role', 'Sets competence, impartiality and audit-time requirements for bodies certifying an AIMS, which is what makes one body''s certificate mean roughly what another''s does. A body certifying without that accreditation was assessed against nothing in particular.'),
    ('accreditation-vs-certification', 'Accreditation assesses the certifier; certification assesses the organization. Getting it round the wrong way produces claims that cannot be true, and management system certification is not personnel certification either.'),
    ('integrated-audit-programme', 'The standard''s definition of audit contemplates a combined audit across two or more disciplines, so one programme, one review cycle, one nonconformity process and one reporting route can serve both systems.'),
    ('shared-evidence', 'Management review records, the programme documentation, records governance, and competence for roles spanning both. The test is whether the artifact would satisfy an auditor of each standard asking their own question.'),
    ('evidence-that-cannot-be-shared', 'Risk against impact assessments, two Statements of Applicability, clause 8 records, and data and life cycle evidence. This is where an integrated programme goes wrong quietly: one risk assessment collected where two were needed, because they looked alike.'),
    ('auditor-competence-limit', 'An ISMS auditor is not automatically competent to audit an AIMS, and that same limit is why ISO/IEC 42006 sets competence requirements for certification bodies. The gap applies to the certifier exactly as it applies to the organization.')
    ) as v(slug, d)
   where cn.certification_id = v_cert and cn.slug = v.slug;

  get diagnostics n = row_count;
  if n <> 154 then
    raise exception 'updated % rows, expected 154', n
      using detail = 'A slug in the batch does not match a live AIMS-F concept.';
  end if;

  -- ----------------------------------------------- the one name
  update public.concepts set name = 'PDCA cycle'
   where certification_id = v_cert and slug = 'pdca-cycle' and name = 'Pdca cycle';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'the PDCA initialism fix touched % rows, expected 1', n;
  end if;

  -- ===================== POST-CONDITIONS =====================

  -- 1. POSITIVE. No stub survives anywhere in this certification.
  select count(*) into n
    from public.concepts cn
   where cn.certification_id = v_cert and cn.retired_at is null
     and cn.description like '%as required or described by ISO/IEC 42001:2023 and taught in the%';
  if n <> 0 then
    raise exception '% stub description(s) survive', n;
  end if;

  -- 2. POSITIVE. Every row carries a description in the written band, and none
  --    is its own name. Asserts the PROPERTY, not a count of characters.
  select count(*) into n
    from public.concepts cn
   where cn.certification_id = v_cert and cn.retired_at is null
     and (length(cn.description) < 120 or length(cn.description) > 320
          or position(lower(cn.name) in lower(cn.description)) = 1);
  if n <> 0 then
    raise exception '% row(s) are outside the written band or open with their own name', n;
  end if;

  -- 3. NEGATIVE. Slugs are byte-identical, and every name except pdca-cycle is
  --    byte-identical. The one intended name change is excluded from the
  --    checksum rather than trusted to a count.
  select md5(string_agg(cn.slug, '~' order by cn.slug))
    into v_slugs_a from public.concepts cn where cn.certification_id = v_cert;
  if v_slugs_a is distinct from v_slugs_b then
    raise exception 'a slug changed';
  end if;
  select md5(string_agg(cn.name, '~' order by cn.slug))
    into v_names_a from public.concepts cn
   where cn.certification_id = v_cert and cn.slug <> 'pdca-cycle';
  if v_names_a is distinct from v_names_b then
    raise exception 'a name other than pdca-cycle changed';
  end if;
  select count(*) into n from public.concepts
   where certification_id = v_cert and slug = 'pdca-cycle' and name = 'PDCA cycle';
  if n <> 1 then
    raise exception 'pdca-cycle does not read PDCA cycle';
  end if;

  -- 4. NEGATIVE. No other certification's concepts moved. 1,575 rows this
  --    migration has no authority over.
  select md5(string_agg(cn.slug || '|' || cn.name || '|' || coalesce(cn.description, ''), '~' order by cn.slug))
    into v_rest_a from public.concepts cn where cn.certification_id <> v_cert;
  if v_rest_a is distinct from v_rest_b then
    raise exception 'a concept outside AIMS-F changed'
      using detail = 'This migration is authorised to touch AIMS-F only.';
  end if;

  -- 5. NEGATIVE, BOTH DIRECTIONS. The 308 stub translations must still EXIST
  --    and none may pass the 359 en_hash gate. A delete would also satisfy
  --    "cannot serve" and is a different, worse outcome.
  select count(*) into n
    from public.concept_translations ct
    join public.concepts cn on cn.id = ct.concept_id
   where cn.certification_id = v_cert;
  if n <> 308 then
    raise exception 'expected the 308 translation rows to survive, found %', n;
  end if;
  select count(*) into n
    from public.concept_translations ct
    join public.concepts cn on cn.id = ct.concept_id
   where cn.certification_id = v_cert
     and ct.en_hash = public.concept_row_en_hash(cn.id);
  if n <> 0 then
    raise exception '% stale translation(s) still pass the en_hash gate', n;
  end if;

  raise notice '363 ok: 154 descriptions written, PDCA initialism fixed, 308 translations withheld pending regeneration';
end
$mig$;
