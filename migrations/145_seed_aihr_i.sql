-- 145_seed_aihr_i.sql
-- AIHR-I - AI for Human Resources & Talent I - scaffold (Stage 6).
-- Basis: AIHR-I_JTA_v1.2.md (LOCKED 2026-07-25). Scheme: SCHEME-AIHR-I.md.
--
-- Seeds: 1 cert / 4 domains / 114 concepts / 28 tasks / 118 task_concepts links.
-- Modules are migration 146.
--
-- Editor-first: run in the Supabase SQL editor, then commit this file as the record.
-- Idempotent: fixed ids + on conflict; SECTION 2 wipes only this cert's children.
-- ASCII-only by construction (CERT-SCHEMA-GUIDE.md section 8 paste-safety rule).
--
-- Column set verified against information_schema on 2026-07-25, NOT against
-- CERT-SCHEMA-GUIDE.md section 2, which still lists is_published (dropped by
-- 069-part-2) and predates price_usd / exam_link / max_exam_attempts /
-- attempt_window_months. Deliberately left at their defaults here:
--   price_usd             0   (free to study; the exam is sold on certiglobal.org)
--   exam_link             null (publish-time field)
--   max_exam_attempts     6
--   attempt_window_months 12
--   exam_blueprint        null (set AFTER tasks exist, from the computed profile)
--
-- Build-order note: tasks are created here. Do NOT set exam_blueprint in this
-- migration - recompute the cognitive profile from live rows first, then set the
-- blueprint from the computed profile (invariant-17-safe order).

begin;

-- ============================================================
-- SECTION 0 - category (AI Workplace already exists; do-nothing guard)
-- ============================================================
insert into public.cert_categories (slug, label, tagline, sort_order) values
  ('ai-workplace', 'Certidemy AI Workplace', $$AI competence for the roles that do not build AI.$$, 5)
on conflict (slug) do nothing;

-- ============================================================
-- SECTION 1 - certification row
-- ============================================================
insert into public.certifications (
  id, code, name, provider, description,
  exam_duration_minutes, passing_score_pct, num_questions,
  difficulty_level, tier, category_slug, sort_order, status
) values (
  '77777777-7777-7777-7777-777777777777',
  'AIHR-I',
  'Certidemy AI for Human Resources & Talent I',
  'Certidemy',
  $$AI-ready certification for the people who make employment decisions. Validates that a recruiter, talent specialist, or HR business partner can use AI across the hiring and worker-management lifecycle without creating legal exposure, without delegating judgment they remain accountable for, and without being misled by a vendor's capability claims or a candidate's. Role-level legal literacy for employment decisions, plus the signature discipline: scoping roles and evaluating capability claims in an AI labour market.$$,
  50, 80.00, 40,
  1, 1, 'ai-workplace', 2, 'draft'
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  provider = excluded.provider,
  description = excluded.description,
  exam_duration_minutes = excluded.exam_duration_minutes,
  passing_score_pct = excluded.passing_score_pct,
  num_questions = excluded.num_questions,
  difficulty_level = excluded.difficulty_level,
  tier = excluded.tier,
  category_slug = excluded.category_slug,
  sort_order = excluded.sort_order,
  status = excluded.status,
  updated_at = now();

-- ============================================================
-- SECTION 2 - idempotency reset (this cert's children only)
-- ============================================================
delete from public.task_concepts tc
  using public.tasks t
  where tc.task_id = t.id
    and t.certification_id = '77777777-7777-7777-7777-777777777777';
delete from public.tasks    where certification_id = '77777777-7777-7777-7777-777777777777';
delete from public.concepts where certification_id = '77777777-7777-7777-7777-777777777777';
delete from public.domains  where certification_id = '77777777-7777-7777-7777-777777777777';

-- ============================================================
-- SECTION 3 - domains (weights sum to 100)
-- ============================================================
insert into public.domains (certification_id, code, title, description, weight_pct, order_index)
select '77777777-7777-7777-7777-777777777777', v.code, v.title, v.descr, v.wt, v.ord
from (values
  ('D1', 'AI in the Talent Lifecycle',
   $$What AI is actually doing across sourcing, screening, interviewing, onboarding and worker management; how these systems produce the outputs a recruiter acts on; and where their capability claims outrun their evidence. Establishes the object the remaining domains govern, evaluate and use.$$,
   20, 1),
  ('D2', 'Legal Exposure, Bias & Candidate Rights',
   $$The duties that attach when AI influences an employment decision, the mechanism by which AI-assisted selection produces discriminatory outcomes without anyone intending it, and what a candidate is entitled to. Taught as a transferable obligation taxonomy rather than a statute list, so the competence survives legislative change.$$,
   30, 2),
  ('D3', 'Scoping Roles & Evaluating Capability Claims',
   $$Defining what a role actually requires in AI terms, and judging whether a candidate has it - from the credentials they present, the claims they make, and the evidence available. The domain where the practitioner's own expertise is the product.$$,
   30, 3),
  ('D4', 'Responsible AI Use in the Recruiter Workflow',
   $$The practitioner as an AI user: drafting with it, screening with it, and knowing where their own accountability starts. Lower stakes per decision than the legal domain, but daily - the place where habits either protect the organization or quietly erode it.$$,
   20, 4)
) as v(code, title, descr, wt, ord);

-- ============================================================
-- SECTION 4 - concepts (114)
-- ============================================================
insert into public.concepts (certification_id, slug, name, description)
select '77777777-7777-7777-7777-777777777777', v.slug, v.name, v.descr
from (values
  -- D1
  ('talent-lifecycle','Talent lifecycle',$$The full arc of the employment relationship from sourcing through worker management, treated as one regulatory perimeter rather than as hiring plus everything after.$$),
  ('ai-in-sourcing','AI in sourcing',$$Use of AI to find, rank and contact potential candidates, including outreach generation and passive-candidate identification.$$),
  ('ai-in-screening','AI in screening',$$Use of AI to parse, filter, score or rank applications and to conduct or analyse assessments and interviews.$$),
  ('ai-in-worker-management','AI in worker management',$$Post-hire uses of AI in performance evaluation, scheduling, task allocation and monitoring, which sit inside the same regulatory perimeter as hiring.$$),
  ('automated-decision-tool','Automated employment decision tool',$$A system that automates, substantially assists or materially influences an employment decision, as distinct from one that only stores or routes data.$$),
  ('rules-based-filter','Rules-based filter',$$A deterministic screening rule with no learned component; may still be in regulatory scope depending on how it influences the decision.$$),
  ('materially-influences','Materially influences',$$The threshold test that brings a tool into scope: whether its output shapes the outcome, regardless of whether a human issues the final decision.$$),
  ('tool-classification','Tool classification',$$The act of determining whether a given system in a given workflow is in or out of scope; the gate on every downstream obligation.$$),
  ('candidate-ranking','Candidate ranking',$$Ordering applicants by a model-produced score, and the properties and limits of that ordering.$$),
  ('trained-on-historical-hires','Trained on historical hires',$$That ranking models learn from past hiring outcomes and therefore reproduce past hiring patterns, including undesirable ones.$$),
  ('pattern-not-judgment','Pattern, not judgment',$$A model output is a similarity estimate over learned patterns, not an evaluation of merit or potential.$$),
  ('score-is-not-truth','Score is not truth',$$A numeric output is not more objective than the human judgment it replaced, and fit score has no standard definition across vendors.$$),
  ('assessment-limits','Assessment limits',$$The boundary of what an AI-mediated assessment can reliably measure about a person.$$),
  ('inferred-trait-claims','Inferred trait claims',$$Vendor claims to infer personality, culture fit, emotion, engagement or integrity from voice, face or text, and their weak evidentiary basis.$$),
  ('video-analysis-limits','Video analysis limits',$$Specific limits and accessibility problems of video and voice interview analysis.$$),
  ('construct-validity','Construct validity',$$Whether a tool measures the thing it claims to measure, and whether that thing predicts job performance.$$),
  ('ai-washing','AI washing',$$Marketing that relabels rules engines or conventional software as AI, or presents pilot results as validation.$$),
  ('claim-versus-evidence','Claim versus evidence',$$Separating what a vendor asserts from what evidence would be needed to support it.$$),
  ('benchmark-without-baseline','Benchmark without baseline',$$Accuracy or efficiency figures stated with no comparison population, baseline or definition of success.$$),
  -- D2
  ('jurisdictional-scope','Jurisdictional scope',$$That obligations follow the candidate and the role location rather than the employer headquarters, and that one process can trigger several regimes.$$),
  ('obligation-taxonomy','Obligation taxonomy',$$The six duty types - disclosure, audit, explanation, human review, record, non-discrimination liability - as independent axes that any regime combines differently.$$),
  ('deployer-versus-developer','Deployer versus developer',$$The split of responsibility between the party that builds an AI system and the party that uses it to make decisions.$$),
  ('multi-jurisdiction-hiring','Multi-jurisdiction hiring',$$Hiring processes spanning several legal regimes at once, and how to determine which duties apply to which candidates.$$),
  ('disclosure-duty','Disclosure duty',$$A requirement to tell candidates or employees that AI is used in a decision affecting them.$$),
  ('independent-bias-audit','Independent bias audit',$$A requirement to have a covered tool audited by an independent party and, in some regimes, to publish a summary.$$),
  ('explanation-duty','Explanation duty',$$A requirement to explain an adverse outcome that AI materially influenced, often within a fixed period.$$),
  ('human-review-duty','Human review duty',$$A requirement to offer review of an AI-influenced decision by a person.$$),
  ('record-duty','Record duty',$$A requirement to retain documentation of AI-influenced decisions for a defined period.$$),
  ('non-discrimination-liability','Non-discrimination liability',$$Exposure under general anti-discrimination law, which exists independently of any AI-specific statute and does not disappear when one is delayed or repealed.$$),
  ('disparate-impact','Disparate impact',$$Discrimination measured by outcome rather than intent, arising when a facially neutral criterion produces unequal selection rates.$$),
  ('selection-rate-comparison','Selection rate comparison',$$Comparing the rate at which groups pass a selection step, and the thresholds used to flag a disparity.$$),
  ('unintentional-discrimination','Unintentional discrimination',$$That liability attaches to effects, and that good intentions are not a defence.$$),
  ('protected-characteristic','Protected characteristic',$$A trait on which discrimination is unlawful, and the categories that vary by jurisdiction.$$),
  ('proxy-variable','Proxy variable',$$A facially neutral data point that correlates with a protected characteristic and carries it into the model.$$),
  ('geographic-proxy','Geographic proxy',$$Location, postal code or commute data functioning as a proxy for race, national origin or socioeconomic status; barred outright in some regimes.$$),
  ('institution-proxy','Institution proxy',$$School, university or employer name functioning as a proxy for background or protected status.$$),
  ('linguistic-proxy','Linguistic proxy',$$Language fluency markers, writing style or name form functioning as a proxy for national origin or ethnicity.$$),
  ('employment-gap-proxy','Employment gap proxy',$$Continuity of employment history functioning as a proxy for disability, caregiving status, pregnancy or age.$$),
  ('audit-scope','Audit scope',$$That an audit covers a named tool, configuration, population and date, and nothing outside them.$$),
  ('auditor-independence','Auditor independence',$$Whether the auditing party is genuinely independent of the vendor whose tool is audited.$$),
  ('audit-population-mismatch','Audit population mismatch',$$That the audited applicant pool may not resemble the deployer's own, limiting what the audit establishes locally.$$),
  ('audit-recency','Audit recency',$$That model or configuration updates can invalidate a prior audit.$$),
  ('audit-is-not-indemnity','Audit is not indemnity',$$That an audit is evidence of diligence, not a transfer of liability to the vendor.$$),
  ('reasonable-accommodation','Reasonable accommodation',$$The duty to adjust an assessment process for a candidate with a disability, including where no disclosure has yet been made.$$),
  ('alternative-evaluation-path','Alternative evaluation path',$$A genuinely equivalent non-AI or adjusted route through the assessment, designed in advance rather than improvised.$$),
  ('screening-out-by-design','Screening out by design',$$How timed, video, voice or game-based assessment can systematically exclude candidates with disabilities.$$),
  ('assessment-accessibility','Assessment accessibility',$$Designing assessment so that the measured construct, not the interface, determines the result.$$),
  ('candidate-notice','Candidate notice',$$Informing a candidate before an AI tool is used to evaluate them.$$),
  ('adverse-decision-explanation','Adverse decision explanation',$$Telling a rejected candidate what drove an AI-influenced outcome, within any applicable period.$$),
  ('meaningful-human-review','Meaningful human review',$$Review by a person with authority to change the outcome, access to the underlying data, and time to use both - as distinct from a rubber stamp.$$),
  ('data-correction-right','Data correction right',$$A candidate's ability to correct inaccurate input data used in a decision about them.$$),
  ('decision-record','Decision record',$$The tool and version used, its output, the human reasoning applied on top of it, notices given and accommodations offered.$$),
  ('record-retention','Record retention',$$Multi-year retention expectations for employment decision records, and why the record is what exists when a claim arrives later.$$),
  ('documented-human-judgment','Documented human judgment',$$Writing down the reasoning a person added to a model output, which is what distinguishes oversight from ratification.$$),
  ('audit-trail','Audit trail',$$The traceable sequence showing how a decision was reached and by whom.$$),
  ('vendor-documentation','Vendor documentation',$$The minimum package a deployer should obtain before deployment in order to meet its own duties later.$$),
  ('intended-use-statement','Intended use statement',$$The vendor's declaration of what the tool is for, outside which the deployer carries the risk alone.$$),
  ('known-limitations-disclosure','Known limitations disclosure',$$The vendor's statement of what the tool does not do reliably and for whom.$$),
  ('contractual-allocation-limits','Contractual allocation limits',$$That indemnification does not eliminate regulatory or discrimination exposure, and in some regimes is expressly void.$$),
  -- D3
  ('requirement-elicitation','Requirement elicitation',$$Running a requisition intake that surfaces the underlying business problem rather than the manager's guess at a title.$$),
  ('need-to-capability','Need to capability',$$Converting a stated business need into a small set of observable capabilities.$$),
  ('role-scoping','Role scoping',$$Bounding what a role is accountable for before deciding what to hire against.$$),
  ('title-drift','Title drift',$$That AI job titles are unstandardized and mean different work at different organizations.$$),
  ('builder-versus-user','Builder versus user',$$The substantive difference between people who build models, integrate AI systems, govern them, and use them well.$$),
  ('title-versus-task','Title versus task',$$Reading a job description for the work it describes rather than the label it carries.$$),
  ('seniority-inflation','Seniority inflation',$$Titles claiming a level of responsibility the described work does not support.$$),
  ('task-based-requirement','Task-based requirement',$$Specifying capability as something observable the person must be able to do.$$),
  ('tool-name-versus-capability','Tool name versus capability',$$That naming products dates a requisition and narrows the pool to prior users rather than capable candidates.$$),
  ('over-specification','Over-specification',$$Requirement lists that shrink the pool and lower its quality at the same time.$$),
  ('must-have-versus-nice-to-have','Must-have versus nice-to-have',$$Separating requirements that gate the role from preferences that do not.$$),
  ('task-composition-shift','Task composition shift',$$That AI changes the mix of tasks inside roles more often than it eliminates roles.$$),
  ('augmented-versus-displaced-task','Augmented versus displaced task',$$Distinguishing tasks AI assists from tasks AI absorbs entirely.$$),
  ('skills-adjacency','Skills adjacency',$$How closely an existing capability set sits to a changed role's requirements.$$),
  ('role-redesign','Role redesign',$$Rebuilding a role around the judgment, exception-handling and accountability tasks that remain.$$),
  ('credential-claim-scope','Credential claim scope',$$What a credential asserts and, more importantly, the boundary of what it does not.$$),
  ('assessed-versus-attended','Assessed versus attended',$$Whether competence was measured or attendance was recorded.$$),
  ('issuer-independence','Issuer independence',$$Whether the body issuing the credential is independent of the body that delivered the training.$$),
  ('credential-currency','Credential currency',$$Whether a credential is current, and what its validity period asserts about recency of competence.$$),
  ('course-completion-certificate','Course completion certificate',$$An artifact evidencing exposure to material, without an independent measure of competence.$$),
  ('attendance-badge','Attendance badge',$$An artifact evidencing presence at an event or session.$$),
  ('vendor-certification','Vendor certification',$$An artifact evidencing proficiency with a specific product or platform.$$),
  ('accredited-certification','Accredited certification',$$An artifact evidencing assessment against a published scope by a body accredited to a recognised standard.$$),
  ('academic-qualification','Academic qualification',$$An artifact evidencing sustained study assessed by an educational institution.$$),
  ('job-task-analysis','Job-task analysis',$$A published analysis of the tasks a credential assesses, and what its presence or absence tells a reader.$$),
  ('exam-blueprint','Exam blueprint',$$The published weighting of an examination across its declared domains.$$),
  ('cognitive-level-of-assessment','Cognitive level of assessment',$$Whether an examination measured recall or applied judgment, and why the two support different inferences.$$),
  ('published-scope-versus-marketing-claim','Published scope versus marketing claim',$$The gap between what a program says it certifies and what its own documentation shows it assessed.$$),
  ('credential-verification','Credential verification',$$Confirming a credential with the issuer of record rather than accepting a document or image.$$),
  ('verification-of-record','Verification of record',$$The issuer-held record that is the authoritative source for whether a credential exists.$$),
  ('expiry-and-recertification','Expiry and recertification',$$That a lapsed credential is a different claim from a current one.$$),
  ('fabrication-signals','Fabrication signals',$$Indicators that a presented credential is invented or altered, handled proportionately and fairly.$$),
  ('internal-talent-marketplace','Internal talent marketplace',$$The internal population as a candidate pool, and why external-facing matching often cannot see it.$$),
  ('adjacent-role-match','Adjacent role match',$$Identifying existing employees whose capabilities sit close to a changed role.$$),
  ('reskilling-decision','Reskilling decision',$$Determining what training would actually close an identified gap.$$),
  ('build-versus-hire','Build versus hire',$$Choosing between developing an internal candidate and recruiting externally, with different evidence needs on each side.$$),
  -- D4
  ('candidate-data-confidentiality','Candidate data confidentiality',$$That resumes, interview notes, salary data and background information are personal data owed protection.$$),
  ('public-tool-exposure','Public tool exposure',$$What entering candidate data into an unapproved or public AI tool exposes and to whom.$$),
  ('personal-data-in-prompts','Personal data in prompts',$$Recognising personal data in a prompt and redacting or rerouting before sending it.$$),
  ('approved-tool-boundary','Approved tool boundary',$$Working inside the set of tools the organization has actually cleared for candidate data.$$),
  ('ai-drafted-content','AI-drafted content',$$Job descriptions, outreach and candidate communications produced with AI assistance.$$),
  ('output-review-duty','Output review duty',$$Checking AI-drafted recruiting content against source facts before it is published or sent.$$),
  ('fabricated-requirement','Fabricated requirement',$$Requirements, benefits, salary bands or legal language invented by a model and never approved.$$),
  ('accountability-for-output','Accountability for output',$$That the organization is bound by what it publishes regardless of what drafted it.$$),
  ('ai-assisted-application','AI-assisted application',$$Candidate material written with AI help, which is now normal and is not itself misconduct.$$),
  ('assistance-versus-fabrication','Assistance versus fabrication',$$The line between help with expression and invention of experience.$$),
  ('detector-unreliability','Detector unreliability',$$That AI-detection tools produce false positives falling unevenly, particularly on non-native speakers, creating their own discrimination exposure.$$),
  ('verify-the-claim-not-the-prose','Verify the claim, not the prose',$$Shifting assessment from how material was written to whether the underlying claim is true.$$),
  ('human-decision-boundary','Human decision boundary',$$The line in a workflow above which a person must decide and document.$$),
  ('final-decision-accountability','Final decision accountability',$$That accountability for selection and rejection is personal and cannot be delegated to a tool.$$),
  ('adverse-decision-handling','Adverse decision handling',$$That automating a rejection is a materially different act from automating a scheduling message.$$),
  ('high-stakes-judgment','High-stakes judgment',$$Recognising the decisions whose consequences to a candidate require human deliberation.$$),
  ('candidate-facing-transparency','Candidate-facing transparency',$$Explaining AI involvement to a candidate plainly, without overstating either its role or its rigour.$$),
  ('stakeholder-communication','Stakeholder communication',$$Telling a hiring manager that a tool they want cannot be used, and why.$$),
  ('trust-and-perception','Trust and perception',$$That evasive answers about AI use cost more trust than the AI use itself.$$)
) as v(slug, name, descr);

-- ============================================================
-- SECTION 5 - tasks (28; order_index globally sequential)
-- ============================================================
insert into public.tasks (
  certification_id, domain_id, code, statement,
  criticality, frequency, bloom_level,
  is_exam_scope, is_simulation_candidate,
  knowledge, skills, abilities, order_index
)
select
  '77777777-7777-7777-7777-777777777777', d.id, v.code, v.statement,
  v.crit::criticality, v.freq::task_frequency, v.bloom::bloom_level,
  true, v.sim,
  v.k, v.s, v.a, v.ord
from (values
  ('D1','1.1','Identify where AI is used across the talent lifecycle, from sourcing through worker management',
   'high','weekly','2_understand',false,
   $$The lifecycle stages where AI now appears: candidate sourcing and outreach, resume parsing and ranking, assessment, interview scheduling and analysis, offer modeling, onboarding, and post-hire performance, scheduling and monitoring systems.$$,
   $$Given an organization's tool stack, locate every point where AI touches an employment decision.$$,
   $$Recognition that AI in hiring is not one system but a chain, and that worker management sits inside the same regulatory perimeter as recruitment.$$,1),
  ('D1','1.2','Distinguish an automated employment decision tool from ordinary recruiting software',
   'high','weekly','3_apply',true,
   $$What distinguishes a system that automates, substantially assists or materially influences an employment decision from one that merely stores or routes data; that regulators define covered tools broadly; that a human making the final call does not by itself remove a tool from scope.$$,
   $$Classify a given tool in a given workflow as in-scope or out-of-scope.$$,
   $$Caution against the convenient conclusion, since this classification gates every legal obligation and erring permissively is the most common failure.$$,2),
  ('D1','1.3','Explain how a resume-screening or candidate-ranking model produces a score',
   'high','occasional','2_understand',false,
   $$That ranking models learn from historical hiring outcomes and therefore reproduce historical hiring patterns, including undesirable ones; that a score is a similarity estimate rather than a measure of merit; that fit score has no standard definition across vendors.$$,
   $$Explain to a hiring manager, in plain language, what a ranking score does and does not mean.$$,
   $$Refusal to treat a numeric output as more objective than the human judgment it replaced.$$,3),
  ('D1','1.4','Identify what AI cannot reliably assess about a candidate',
   'high','weekly','3_apply',false,
   $$The weak evidentiary basis for inferring personality, culture fit, emotion, engagement or integrity from voice, face or text; that a tool measuring something is not the same as that something predicting job performance.$$,
   $$Given a vendor assessment claim, judge whether the construct is plausibly measurable and plausibly job-related.$$,
   $$Willingness to say that a tool measures something, but not what it says it measures.$$,4),
  ('D1','1.5','Recognize AI-washing in HR technology marketing',
   'medium','occasional','4_analyze',true,
   $$Common patterns: rules engines relabeled as AI, accuracy figures with no stated baseline or population, efficiency claims measuring throughput rather than quality of hire, pilot results presented as validation.$$,
   $$Take apart a vendor claim and name what evidence would actually support it.$$,
   $$Buyer skepticism proportionate to the stakes of the decision the tool will influence.$$,5),
  ('D2','2.1','Determine which categories of obligation attach to an AI hiring tool in a given jurisdiction',
   'high','occasional','4_analyze',true,
   $$That obligations follow the candidate and role location rather than the employer headquarters; that a distributed hiring process can trigger several regimes at once; that deployer duties differ from developer duties and buying a tool does not transfer responsibility for outcomes.$$,
   $$Given a hiring scenario spanning jurisdictions, identify which categories of duty are triggered and who owes them.$$,
   $$Escalation instinct rather than improvisation.$$,6),
  ('D2','2.2','Distinguish disclosure duties, audit duties, explanation duties, human-review duties, record duties, and non-discrimination liability',
   'high','occasional','3_apply',false,
   $$The six duty types as independent axes; that satisfying one does not satisfy another; that non-discrimination liability exists independently of any AI-specific statute and is the exposure that never goes away when an AI law is delayed or repealed.$$,
   $$Given a described regime, sort its requirements into the taxonomy.$$,
   $$Structural thinking: read the next new law by its shape rather than memorizing it.$$,7),
  ('D2','2.3','Explain how disparate impact arises from AI-assisted selection',
   'high','weekly','2_understand',false,
   $$That liability attaches to outcomes rather than intent; how selection rates are compared across groups; that a facially neutral criterion applied by a model produces a discriminatory outcome at a scale and speed no human reviewer could.$$,
   $$Read an outcome breakdown and recognize a disparity worth escalating.$$,
   $$Outcomes-first thinking, since good intentions are not a defence.$$,8),
  ('D2','2.4','Identify proxy variables that encode protected characteristics',
   'high','weekly','3_apply',true,
   $$How location, school or institution name, employment continuity, language fluency markers, activity signals and affiliation cues can correlate with protected characteristics; that some jurisdictions bar specific proxies outright.$$,
   $$Audit a set of screening criteria, including one's own, for proxy risk.$$,
   $$Suspicion of criteria that feel neutral and merit-based, since those are precisely the ones that survive review unexamined.$$,9),
  ('D2','2.5','Evaluate a vendor bias-audit report for what it does and does not establish',
   'high','occasional','4_analyze',true,
   $$That an audit covers a specified tool, configuration, population and date; that the vendor's audited population may not resemble the deployer's applicant pool; that model updates can invalidate a prior audit; that an audit is evidence of diligence rather than a transfer of liability.$$,
   $$Read a bias-audit summary and state precisely what it licenses the employer to conclude.$$,
   $$Treating vendor assurance as an input to one's own judgment rather than a substitute for it.$$,10),
  ('D2','2.6','Apply accommodation and accessibility duties to AI-mediated assessment',
   'high','occasional','3_apply',true,
   $$That timed, video, voice or game-based assessment can systematically disadvantage candidates with disabilities; that an accommodation request may arrive before a candidate has disclosed anything; that an alternative evaluation path must be genuinely equivalent rather than a token.$$,
   $$Given an assessment design, identify who it screens out and what alternative path is required.$$,
   $$Designing the alternative before it is requested.$$,11),
  ('D2','2.7','Determine what a candidate is entitled to know, contest, or have reviewed by a human',
   'high','occasional','3_apply',true,
   $$Pre-use notice, explanation after an adverse outcome, the right to request human review, and correction of inaccurate input data; what makes a human review meaningful rather than a rubber stamp, namely authority to change the outcome, access to the underlying data, and time to use both.$$,
   $$Given a rejection produced with AI involvement, determine what the candidate is owed and produce it.$$,
   $$Treating the candidate as a rights-holder rather than as throughput.$$,12),
  ('D2','2.8','Determine what a defensible record of an AI-assisted employment decision must contain',
   'high','weekly','3_apply',false,
   $$What a defensible record contains: tool and version used, its output, the human reasoning applied on top of it, notices given and accommodations offered; multi-year retention expectations; that the record is what exists when a claim arrives eighteen months later.$$,
   $$Produce a decision record that would survive a regulator or plaintiff reading.$$,
   $$Documentation as protection rather than bureaucracy.$$,13),
  ('D2','2.9','Determine the minimum documentation a deployer should require from an AI hiring vendor',
   'high','occasional','3_apply',true,
   $$What a deployer should obtain before deployment: intended-use statement, training-data categories at a descriptive level, known limitations, evaluation results with population described, update and revalidation cadence, and support for the deployer's own notice and explanation duties; that contractual indemnification does not eliminate regulatory or discrimination exposure and in some regimes is expressly void.$$,
   $$Given a vendor package, identify what is missing that the deployer will later be unable to produce.$$,
   $$Treating procurement as the cheapest point of intervention, since everything not obtained there becomes unobtainable later.$$,14),
  ('D3','3.1','Determine the observable capabilities a stated business need actually requires',
   'high','weekly','3_apply',true,
   $$How to run a requisition intake conversation that surfaces the underlying business problem rather than the manager's guess at a job title; that a request for someone who knows AI is a symptom rather than a requirement.$$,
   $$Convert a stated business need into a small set of observable capabilities the role must have.$$,
   $$Willingness to push back on a hiring manager's initial framing.$$,15),
  ('D3','3.2','Distinguish AI-related job titles that describe materially different work',
   'high','weekly','3_apply',false,
   $$That AI job titles are unstandardized and drifting; the substantive difference between people who build models, integrate AI systems, govern them and use them well; that the same title means different work at different companies.$$,
   $$Given a job description, determine which category of work it actually describes regardless of its title.$$,
   $$Reading for the work rather than the label.$$,16),
  ('D3','3.3','Determine whether a job description specifies AI capability as observable tasks or as tool names',
   'high','weekly','3_apply',true,
   $$That naming tools dates a requisition and narrows the pool to people who used one product rather than people who can do the work; how over-specification produces both a smaller pool and a worse one.$$,
   $$Rewrite a tool-listing job description into observable task requirements.$$,
   $$Treating requirements as a hypothesis to be tested rather than a wish list.$$,17),
  ('D3','3.4','Analyze how AI shifts the task composition of an existing role',
   'high','occasional','4_analyze',true,
   $$That AI changes the mix of tasks within roles more often than it eliminates roles; that the tasks which remain are typically the judgment, exception-handling and accountability ones.$$,
   $$Decompose a role, identify which tasks AI now absorbs, and state what the role should now be hired against.$$,
   $$Workforce planning as redesign rather than headcount arithmetic.$$,18),
  ('D3','3.5','Evaluate what a credential actually evidences about a candidate',
   'high','weekly','4_analyze',true,
   $$The properties determining what a credential evidences: whether competence was assessed or attendance recorded, who set and marked the assessment, whether the issuer is independent of the trainer, what scope was claimed, and whether it expires; that a credential evidences something narrow and dated rather than general competence.$$,
   $$Given a credential on a resume, state precisely what it licenses the recruiter to infer and what it does not.$$,
   $$Neither dismissing credentials nor over-reading them, treating one as a single evidence source among several.$$,19),
  ('D3','3.6','Distinguish the common types of learning and credentialing artifact',
   'medium','occasional','2_understand',false,
   $$What each artifact type is produced by and can therefore support: completion certificates evidence exposure, vendor certifications evidence product-specific proficiency, accredited certifications evidence assessment against a published scope by an independent body, academic qualifications evidence sustained study.$$,
   $$Categorize a presented artifact and state its evidentiary reach.$$,
   $$Fitness-for-purpose over hierarchy, since the right artifact depends on the hiring question.$$,20),
  ('D3','3.7','Interpret published competence documentation to determine what a credential tested',
   'medium','occasional','3_apply',true,
   $$That a rigorous credential publishes what it assesses, namely the tasks analyzed, the weighting across domains and the cognitive level at which each is tested; that recall-level and judgment-level assessment support very different inferences about a candidate; that a program publishing no scope document is asking to be taken on trust.$$,
   $$Read a published scope document and determine whether the credential tested recall or applied judgment on the capability the role needs.$$,
   $$Asking for the evidence behind a claim as a routine professional habit.$$,21),
  ('D3','3.8','Determine the appropriate verification action for a claimed credential and recognize fabrication or lapse signals',
   'high','occasional','3_apply',true,
   $$That verification means confirming with the issuer of record rather than accepting an image or document; that many credentials expire and a lapsed credential is a different claim from a current one; common fabrication signals.$$,
   $$Verify a presented credential and handle a failed verification proportionately and fairly.$$,
   $$Verifying rather than assuming, without treating candidates as suspects.$$,22),
  ('D3','3.9','Determine how AI-driven task change affects internal mobility and reskilling decisions',
   'medium','occasional','3_apply',true,
   $$That task-composition change creates internal candidates whose adjacency is invisible to a resume-matching process built for external hiring; that build-versus-hire is a real decision with different evidence requirements on each side; that internal AI-assisted assessment carries the same legal duties as external.$$,
   $$Given a role whose task mix has shifted, identify which existing employees are adjacent and what reskilling the gap actually requires.$$,
   $$Looking inward before opening a requisition.$$,23),
  ('D4','4.1','Apply confidentiality rules to candidate data in general-purpose AI tools',
   'high','daily','3_apply',true,
   $$That resumes, interview notes, salary data and background information are personal data; what pasting them into an unapproved tool exposes; that consent to be considered is not consent to be processed by any tool.$$,
   $$Decide whether a given task can be done in a given tool, and redact or reroute when it cannot.$$,
   $$Default caution with other people's data.$$,24),
  ('D4','4.2','Determine what review an AI-drafted recruiting artifact requires before it is published or sent',
   'high','daily','3_apply',true,
   $$That AI-drafted job descriptions and outreach routinely invent requirements, benefits, salary bands and legal language that were never approved; that the employer is bound by what the posting says regardless of what drafted it.$$,
   $$Review AI-drafted recruiting content against the source facts before it is published or sent.$$,
   $$Ownership of the output, since the tool is not a co-signer.$$,25),
  ('D4','4.3','Assess AI-generated or AI-assisted candidate material fairly',
   'medium','weekly','4_analyze',true,
   $$That AI assistance in writing an application is now normal and is not itself misconduct; that fabricating experience is; that AI-detection tools are unreliable and produce false positives falling unevenly, particularly on non-native speakers, creating their own discrimination exposure.$$,
   $$Shift the assessment from how material was written to whether the underlying claim is true and the candidate can do the work.$$,
   $$Fairness to candidates over policing of style.$$,26),
  ('D4','4.4','Judge when a hiring task must not be delegated to AI',
   'high','weekly','3_apply',true,
   $$Which tasks carry accountability that cannot be delegated: final selection, rejection, accommodation decisions, and anything a candidate can contest; that automating a rejection is a different act from automating a scheduling email.$$,
   $$Given a workflow, draw the line above which a human must decide and document.$$,
   $$Accountability as personal rather than procedural.$$,27),
  ('D4','4.5','Select an accurate, plain explanation of AI use in hiring for a candidate or hiring manager',
   'medium','occasional','3_apply',true,
   $$That candidates increasingly ask whether AI screened them, and that evasive answers cost more trust than the AI use itself; how to explain AI involvement plainly without overstating either its role or its rigour; how to tell a hiring manager that a tool they want cannot be used.$$,
   $$Write a candidate-facing explanation of AI use that is accurate and plain.$$,
   $$Transparency as a default rather than a disclosure minimum.$$,28)
) as v(domain_code, code, statement, crit, freq, bloom, sim, k, s, a, ord)
join public.domains d
  on d.certification_id = '77777777-7777-7777-7777-777777777777'
 and d.code = v.domain_code;

-- ============================================================
-- SECTION 6 - task_concepts (118 links: 114 primary + 4 deliberate reuse)
-- ============================================================
insert into public.task_concepts (task_id, concept_id)
select t.id, c.id
from (values
  ('1.1','talent-lifecycle'),('1.1','ai-in-sourcing'),('1.1','ai-in-screening'),('1.1','ai-in-worker-management'),
  ('1.2','automated-decision-tool'),('1.2','rules-based-filter'),('1.2','materially-influences'),('1.2','tool-classification'),
  ('1.3','candidate-ranking'),('1.3','trained-on-historical-hires'),('1.3','pattern-not-judgment'),('1.3','score-is-not-truth'),
  ('1.4','assessment-limits'),('1.4','inferred-trait-claims'),('1.4','video-analysis-limits'),('1.4','construct-validity'),
  ('1.5','ai-washing'),('1.5','claim-versus-evidence'),('1.5','benchmark-without-baseline'),
  ('2.1','jurisdictional-scope'),('2.1','obligation-taxonomy'),('2.1','deployer-versus-developer'),('2.1','multi-jurisdiction-hiring'),
  ('2.2','disclosure-duty'),('2.2','independent-bias-audit'),('2.2','explanation-duty'),('2.2','human-review-duty'),('2.2','record-duty'),('2.2','non-discrimination-liability'),
  ('2.3','disparate-impact'),('2.3','selection-rate-comparison'),('2.3','unintentional-discrimination'),('2.3','protected-characteristic'),
  ('2.4','proxy-variable'),('2.4','geographic-proxy'),('2.4','institution-proxy'),('2.4','linguistic-proxy'),('2.4','employment-gap-proxy'),
  ('2.4','trained-on-historical-hires'),
  ('2.5','audit-scope'),('2.5','auditor-independence'),('2.5','audit-population-mismatch'),('2.5','audit-recency'),('2.5','audit-is-not-indemnity'),
  ('2.6','reasonable-accommodation'),('2.6','alternative-evaluation-path'),('2.6','screening-out-by-design'),('2.6','assessment-accessibility'),
  ('2.6','assessment-limits'),
  ('2.7','candidate-notice'),('2.7','adverse-decision-explanation'),('2.7','meaningful-human-review'),('2.7','data-correction-right'),
  ('2.8','decision-record'),('2.8','record-retention'),('2.8','documented-human-judgment'),('2.8','audit-trail'),
  ('2.9','vendor-documentation'),('2.9','intended-use-statement'),('2.9','known-limitations-disclosure'),('2.9','contractual-allocation-limits'),
  ('3.1','requirement-elicitation'),('3.1','need-to-capability'),('3.1','role-scoping'),
  ('3.2','title-drift'),('3.2','builder-versus-user'),('3.2','title-versus-task'),('3.2','seniority-inflation'),
  ('3.3','task-based-requirement'),('3.3','tool-name-versus-capability'),('3.3','over-specification'),('3.3','must-have-versus-nice-to-have'),
  ('3.4','task-composition-shift'),('3.4','augmented-versus-displaced-task'),('3.4','skills-adjacency'),('3.4','role-redesign'),
  ('3.5','credential-claim-scope'),('3.5','assessed-versus-attended'),('3.5','issuer-independence'),('3.5','credential-currency'),
  ('3.6','course-completion-certificate'),('3.6','attendance-badge'),('3.6','vendor-certification'),('3.6','accredited-certification'),('3.6','academic-qualification'),
  ('3.7','job-task-analysis'),('3.7','exam-blueprint'),('3.7','cognitive-level-of-assessment'),('3.7','published-scope-versus-marketing-claim'),
  ('3.8','credential-verification'),('3.8','verification-of-record'),('3.8','expiry-and-recertification'),('3.8','fabrication-signals'),
  ('3.9','internal-talent-marketplace'),('3.9','adjacent-role-match'),('3.9','reskilling-decision'),('3.9','build-versus-hire'),
  ('3.9','task-composition-shift'),
  ('4.1','candidate-data-confidentiality'),('4.1','public-tool-exposure'),('4.1','personal-data-in-prompts'),('4.1','approved-tool-boundary'),
  ('4.2','ai-drafted-content'),('4.2','output-review-duty'),('4.2','fabricated-requirement'),('4.2','accountability-for-output'),
  ('4.3','ai-assisted-application'),('4.3','assistance-versus-fabrication'),('4.3','detector-unreliability'),('4.3','verify-the-claim-not-the-prose'),
  ('4.4','human-decision-boundary'),('4.4','final-decision-accountability'),('4.4','adverse-decision-handling'),('4.4','high-stakes-judgment'),
  ('4.4','accountability-for-output'),
  ('4.5','candidate-facing-transparency'),('4.5','stakeholder-communication'),('4.5','trust-and-perception')
) as v(task_code, concept_slug)
join public.tasks t
  on t.certification_id = '77777777-7777-7777-7777-777777777777'
 and t.code = v.task_code
join public.concepts c
  on c.certification_id = '77777777-7777-7777-7777-777777777777'
 and c.slug = v.concept_slug
on conflict do nothing;

commit;

-- ============================================================
-- VERIFICATION (run after this migration; expect 1 / 1 / 4 / 28 / 114 / 118)
-- ============================================================
-- select
--   (select count(*) from certifications  where id='77777777-7777-7777-7777-777777777777') as certs,
--   (select count(*) from cert_categories where slug='ai-workplace')                       as category,
--   (select count(*) from domains         where certification_id='77777777-7777-7777-7777-777777777777') as domains,
--   (select count(*) from tasks           where certification_id='77777777-7777-7777-7777-777777777777') as tasks,
--   (select count(*) from concepts        where certification_id='77777777-7777-7777-7777-777777777777') as concepts,
--   (select count(*) from task_concepts tc join tasks t on t.id=tc.task_id
--      where t.certification_id='77777777-7777-7777-7777-777777777777') as links;
--
-- Domain weights must sum to 100:
-- select code, weight_pct from domains where certification_id='77777777-7777-7777-7777-777777777777' order by order_index;
--
-- Orphan concept check (concepts linked by no task) - expect 0:
-- select c.slug from concepts c
--   left join task_concepts tc on tc.concept_id = c.id
--   where c.certification_id='77777777-7777-7777-7777-777777777777' and tc.concept_id is null;
