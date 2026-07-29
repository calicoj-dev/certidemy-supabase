-- 162_domain_descriptions_client_facing.sql
--
-- Rewrites all 33 English domain descriptions for a reader outside the
-- building.
--
-- WHY. domains.description was authored when nothing outside the repository
-- read it. It now renders in two client-facing PDFs - the blueprint sheet and
-- the JTA sheet - and the existing text carries three things that should never
-- reach a buyer:
--
--   SELF-ASSESSMENT. "The richest domain", "the most stable domain", "the
--   signature domain", "carries the heaviest apply/analyze load". A buyer
--   cannot verify any of it and gains nothing from our internal ranking.
--
--   PEDAGOGY NOTES. "Predominantly comprehension, making the applied domains
--   legible", "comprehension-led with an analytic capstone". The blueprint
--   sheet already prints the cognitive profile COMPUTED from the tasks.
--   Asserting the same thing in prose duplicates a number and, worse, asserts
--   what the data is there to prove.
--
--   INTERNAL CROSS-REFERENCES. "(it pairs with SPO-AI-I's D4)", "deliberately
--   bounded to complement, not duplicate, AIGRM-I". Meaningful to whoever
--   authored the scheme; noise to a reader holding one document.
--
-- One further cut: AIGRM-I D3 ended "never implying Certidemy is any of them".
-- Internally that is the honesty firewall working. In a client's hands it
-- answers an accusation nobody made and raises the question instead of closing
-- it. The legitimate half - that the standards are taught as structure and
-- obligations rather than as legal advice - is kept, stated positively.
--
-- LENGTH WAS THE OTHER HALF OF THE PROBLEM. SM-AI-I D2 was eight words;
-- SD-AI-I D4 was ninety. Same product line, same field, side by side in the
-- same library. Everything here lands between roughly 28 and 48 words, so the
-- maximum length goes DOWN - nothing that renders today gets longer.
--
-- PURE ASCII, DELIBERATELY. No em-dashes, no curly quotes, no accents. The
-- Supabase SQL editor corrupts multibyte characters on paste, and this file is
-- meant to be run there. The es-419 and pt-BR rewrites CANNOT follow this route
-- for the same reason - they must go through an API-based loader.
--
-- Idempotent: plain UPDATEs, safe to re-run.

-- ---------------------------------------------------------------- AIE-I ----

update public.domains d set description =
'Core AI vocabulary and how the technology works at a high level: the difference between AI, machine learning and generative AI, where these systems already appear in everyday work, and the things they cannot reliably do.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIE-I' and d.code = 'D1';

update public.domains d set description =
'Working with generative AI in practice: writing effective prompts, recognizing what these tools do well and badly, why they state false information confidently, how to verify what they produce, and how to judge when generative AI is the right tool for a task.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIE-I' and d.code = 'D2';

update public.domains d set description =
'Safe and responsible use at work: protecting personal and confidential data, recognizing bias in AI output, keeping a person accountable for decisions, working within an acceptable-use policy, and the lines that should not be crossed.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIE-I' and d.code = 'D3';

-- -------------------------------------------------------------- AIGRM-I ----

update public.domains d set description =
'The vocabulary and mental model the rest of the certification rests on: how AI governance, risk management and compliance differ, risk versus harm, the actors in an AI value chain, the characteristics of trustworthy AI, and the types of governance instrument available.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIGRM-I' and d.code = 'D1';

update public.domains d set description =
'How AI risk is managed in practice: the govern, map, measure and manage cycle, the identify-analyze-evaluate-treat process, characterizing and treating risk, and the concrete risks of the AI era - generative-model risks, agentic risks, security risks, model drift, and human oversight as a control.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIGRM-I' and d.code = 'D2';

update public.domains d set description =
'The instruments that govern AI and how they relate to each other: the EU AI Act risk tiers and obligation types, ISO/IEC 42001 and its companion standards, the NIST AI Risk Management Framework, and the pattern emerging in other jurisdictions. Covered as structure and obligations rather than as legal advice.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIGRM-I' and d.code = 'D3';

update public.domains d set description =
'Governance across the AI lifecycle: who is accountable at each stage, AI system impact assessment, technical documentation and provenance, human oversight of systems in production, incident response and post-market monitoring, third-party and procured AI, responsible retirement, and accountability in agentic workflows.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIGRM-I' and d.code = 'D4';

update public.domains d set description =
'The human and organizational layer: the principles of responsible AI, fairness, transparency and privacy as duties owed to affected people, and how a working governance function is built and sustained through roles, policy, AI literacy and culture.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIGRM-I' and d.code = 'D5';

-- --------------------------------------------------------------- AIHR-I ----

update public.domains d set description =
'What AI is actually doing across sourcing, screening, interviewing, onboarding and worker management: how these systems produce the outputs a recruiter acts on, and where the claims made for their capability run ahead of the evidence.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIHR-I' and d.code = 'D1';

update public.domains d set description =
'The duties that attach when AI influences an employment decision, how AI-assisted selection can produce discriminatory outcomes without anyone intending it, and what a candidate is entitled to. Taught as a transferable set of obligations rather than a list of statutes, so it holds as legislation changes.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIHR-I' and d.code = 'D2';

update public.domains d set description =
'Defining what a role actually requires in AI terms, and judging whether a candidate has it: from the credentials they present, the claims they make, and the evidence available to verify either.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIHR-I' and d.code = 'D3';

update public.domains d set description =
'The practitioner as an AI user: drafting with it, screening with it, verifying what it produces, and knowing where their own accountability begins and the tool stops being an answer.'
from public.certifications c where c.id = d.certification_id and c.code = 'AIHR-I' and d.code = 'D4';

-- --------------------------------------------------------------- AISM-I ----

update public.domains d set description =
'The vocabulary and mental model the rest of the certification rests on: what a service is, how value is co-created, the parties in a service relationship, utility, warranty and experience, outcomes, and service level agreements.'
from public.certifications c where c.id = d.certification_id and c.code = 'AISM-I' and d.code = 'D1';

update public.domains d set description =
'The system that turns opportunity and demand into value: the components of a service value system, the seven guiding principles and how to apply them, the continual improvement model, and governance as direction and control.'
from public.certifications c where c.id = d.certification_id and c.code = 'AISM-I' and d.code = 'D2';

update public.domains d set description =
'The operating layer: the product and service lifecycle activities, value streams, and the core management practices covering incident, problem, change, request, service level and monitoring, together with supplier management and dependency on AI models.'
from public.certifications c where c.id = d.certification_id and c.code = 'AISM-I' and d.code = 'D3';

update public.domains d set description =
'How service operations change when AI is central to them: AIOps and event correlation, predictive and proactive operations, virtual agents on the service desk, intelligent and agentic automation, and human oversight of AI-driven service actions as a primary control.'
from public.certifications c where c.id = d.certification_id and c.code = 'AISM-I' and d.code = 'D4';

update public.domains d set description =
'Governance of AI inside service management: accountability when an agent acts on a live service, data quality and provenance in AIOps pipelines, transparency to users, the risk of over-automation, and how AI service governance connects to an organization wide AI governance function.'
from public.certifications c where c.id = d.certification_id and c.code = 'AISM-I' and d.code = 'D5';

update public.domains d set description =
'The human and sustainable dimensions of service value: managing and measuring experience beyond technical service levels, trust and adoption as prerequisites for getting value from AI services, and the compute and energy footprint of running them.'
from public.certifications c where c.id = d.certification_id and c.code = 'AISM-I' and d.code = 'D6';

-- -------------------------------------------------------------- SD-AI-I ----

update public.domains d set description =
'The reasoning beneath a Developer''s work: Agile values and principles from a builder''s perspective, the three pillars of empiricism applied to engineering, the Scrum values as Developers live them, lean and flow thinking, and why inspection matters more when output becomes cheap to generate.'
from public.certifications c where c.id = d.certification_id and c.code = 'SD-AI-I' and d.code = 'D1';

update public.domains d set description =
'The Scrum framework as Developers own it: their accountabilities, the how of Sprint Planning, the Sprint Backlog as a living forecast, the Daily Scrum as the Developers'' event, their part in Review and Retrospective, and using AI as an input to estimation rather than a substitute for the team.'
from public.certifications c where c.id = d.certification_id and c.code = 'SD-AI-I' and d.code = 'D2';

update public.domains d set description =
'The technical craft that makes Done real: the Definition of Done as a quality commitment, the difference between done and looks-done, test-first development, continuous integration and delivery, technical debt and refactoring, version-control discipline, code review, and pairing.'
from public.certifications c where c.id = d.certification_id and c.code = 'SD-AI-I' and d.code = 'D3';

update public.domains d set description =
'Implementing a specification that carries acceptance criteria with AI as a teammate, while the Developer stays accountable for verification, security, licensing and the Definition of Done: implementation prompting, critical review of generated output, the generate-then-verify loop, AI-written tests, agentic workflows, provenance, and when not to use AI at all.'
from public.certifications c where c.id = d.certification_id and c.code = 'SD-AI-I' and d.code = 'D4';

update public.domains d set description =
'A Developer''s work is team work: cross-functionality and T-shaped skill, collaborating with the Product Owner and Scrum Master, professional responsibility for security, privacy, accessibility and ethics including in AI-assisted output, sustaining skill as tools change, and agreeing team-wide AI practice.'
from public.certifications c where c.id = d.certification_id and c.code = 'SD-AI-I' and d.code = 'D5';

-- -------------------------------------------------------------- SM-AI-I ----

update public.domains d set description =
'The reasoning beneath Scrum: the Agile values and principles, empirical process control and its three pillars, the five Scrum values, lean thinking, and how to tell a complex problem from one better served by a predictive approach.'
from public.certifications c where c.id = d.certification_id and c.code = 'SM-AI-I' and d.code = 'D1';

update public.domains d set description =
'The Scrum Team: its composition and size, the three accountabilities and the boundaries between them, self-management, cross-functionality, and how AI tools participate in a team without holding any accountability of their own.'
from public.certifications c where c.id = d.certification_id and c.code = 'SM-AI-I' and d.code = 'D2';

update public.domains d set description =
'The five Scrum events: the purpose, timebox, attendees and outputs of each, the Sprint as the container for the rest, and the anti-patterns that quietly replace an event''s purpose with something else.'
from public.certifications c where c.id = d.certification_id and c.code = 'SM-AI-I' and d.code = 'D3';

update public.domains d set description =
'The three artifacts and their commitments, being the Product Goal, the Sprint Goal and the Definition of Done, together with refinement as an ongoing activity, INVEST criteria for backlog items, and reading burndown and velocity as forecasting tools rather than performance scores.'
from public.certifications c where c.id = d.certification_id and c.code = 'SM-AI-I' and d.code = 'D4';

update public.domains d set description =
'The Scrum Master in practice: facilitation and coaching stances, impediment removal, psychological safety, servant leadership, coaching the Product Owner and the wider organization, the basics of scaling, and translating between legacy terminology and the current Scrum Guide.'
from public.certifications c where c.id = d.certification_id and c.code = 'SM-AI-I' and d.code = 'D5';

-- ------------------------------------------------------------- SPO-AI-I ----

update public.domains d set description =
'The reasoning beneath agile product management: Agile values and principles, empiricism, lean product thinking, why an empirical framework still matters when delivery accelerates, and an introduction to AI agents and specification-driven development.'
from public.certifications c where c.id = d.certification_id and c.code = 'SPO-AI-I' and d.code = 'D1';

update public.domains d set description =
'Scrum framework essentials through a product lens, covering theory, team, events and artifacts, including artifacts as a source of instruction for AI agents and what Done means when an agent produced the work.'
from public.certifications c where c.id = d.certification_id and c.code = 'SPO-AI-I' and d.code = 'D2';

update public.domains d set description =
'Who the Product Owner is and what they are accountable for, which is maximizing the value of the product, and how the role works with the Scrum Master, the Developers and stakeholders, including the accountability that stays human when AI assists.'
from public.certifications c where c.id = d.certification_id and c.code = 'SPO-AI-I' and d.code = 'D3';

update public.domains d set description =
'The core craft: building, ordering and refining the Product Backlog, the quality of backlog items, stories and acceptance criteria, estimation and story mapping, and their AI-era evolution into agent-executable specifications, AI-assisted refinement, and the feature-factory trap that AI amplifies.'
from public.certifications c where c.id = d.certification_id and c.code = 'SPO-AI-I' and d.code = 'D4';

update public.domains d set description =
'The strategic half of the role: product vision, the Product Goal, maximizing and measuring value, roadmaps, forecasting and release planning, business strategy and stakeholder management, with AI applied to roadmap and strategic analysis.'
from public.certifications c where c.id = d.certification_id and c.code = 'SPO-AI-I' and d.code = 'D5';

-- ---------------------------------------------------------------- verify ---
--
-- Expect 33 rows, none containing the phrases this migration exists to remove.
--
--   select c.code, d.code, length(d.description) as chars, d.description
--   from domains d join certifications c on c.id = d.certification_id
--   order by c.code, d.order_index;
--
--   select count(*) from domains
--   where description ~* 'richest|most stable|signature domain|apply/analyze|comprehension-led|predominantly comprehension|pairs with|not duplicate|never implying';
--   -- expect 0
