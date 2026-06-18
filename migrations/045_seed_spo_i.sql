-- Migration 045: seed the Scrum Product Owner I (SPO-I) certification.
--
-- Stands up the entire SPO-I skeleton from SPO_JTA_v1.1 (LOCKED):
--   certification row -> 5 domains -> 44 tasks (with KSAs) -> 132 concepts
--   -> every task_concepts link, written in THIS migration.
--
-- Reachability is baked in from row one: because task_concepts is populated at
-- creation, the practice/question pipeline can find questions for these concepts
-- the moment any are seeded — no D6-style orphan repair will ever be needed here.
--
-- Cert id 33333333-... follows the established pattern (SM-I 1111..., GAIPC 2222...).
-- is_published = false: SPO-I stays dark until it has lessons + questions.
-- provider = 'Certidemy': this is the proprietary AI-native cert (modeled on
--   CertMind), NOT a CertiProf resale. If SM-I uses a different provider string
--   and you want brand consistency, change the one literal in section 1.
--
-- Idempotent: section 2 wipes ONLY this cert's children (scoped to 3333...),
-- then sections 3-6 reseed. Safe to re-run; never touches SM-I or GAIPC.
-- Editor-first: run top-to-bottom in the SQL Editor, then commit this file.
-- Prose uses dollar-quoting ($$...$$) so apostrophes need no escaping.

-- =====================================================================
-- SECTION 1 — Certification (upsert by fixed id)
-- =====================================================================
insert into certifications (
  id, code, name, provider, description,
  exam_duration_minutes, passing_score_pct, num_questions,
  difficulty_level, is_published
)
values (
  '33333333-3333-3333-3333-333333333333',
  'SPO-I',
  'Certidemy Scrum Product Owner I',
  'Certidemy',
  $$AI-ready Scrum Product Owner certification. Validates agile product management — backlog, value, vision, roadmap, stakeholders — with AI woven through: Spec-Driven Development (stories as agent-executable specifications), AI-assisted refinement, and the strategic discipline AI makes more critical. Grounded in the 2020 Scrum Guide.$$,
  90, 80.00, 80,
  1, false
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
  is_published = excluded.is_published,
  updated_at = now();

-- =====================================================================
-- SECTION 2 — Idempotency reset (scoped strictly to SPO-I)
-- =====================================================================
delete from task_concepts
  where task_id in (select id from tasks where certification_id = '33333333-3333-3333-3333-333333333333');
delete from tasks      where certification_id = '33333333-3333-3333-3333-333333333333';
delete from concepts   where certification_id = '33333333-3333-3333-3333-333333333333';
delete from domains    where certification_id = '33333333-3333-3333-3333-333333333333';

-- =====================================================================
-- SECTION 3 — Domains (5)
-- =====================================================================
insert into domains (certification_id, code, title, description, weight_pct, order_index)
values
  ('33333333-3333-3333-3333-333333333333','D1',$$Agile Foundations in the AI Era$$,$$The why beneath agile product management, refreshed for the AI era: agile values and principles, empiricism, lean product thinking, why Scrum stays relevant when AI accelerates delivery, and an intro to AI agents and Spec-Driven Development.$$,12.5,1),
  ('33333333-3333-3333-3333-333333333333','D2',$$The Scrum Framework & AI-Ready Artifacts$$,$$Scrum framework essentials through the product lens — theory, team, events, artifacts — plus artifacts as a source of instruction for AI agents and what Done means when an agent did the work.$$,15.0,2),
  ('33333333-3333-3333-3333-333333333333','D3',$$The Product Owner Accountability & the Scrum Team$$,$$Who the PO is and what they are accountable for (maximizing value), and how the role interacts with the SM, Developers, and stakeholders — including the human accountability that persists when AI assists.$$,15.0,3),
  ('33333333-3333-3333-3333-333333333333','D4',$$Product Backlog Management & Spec-Driven Development$$,$$The core craft: building, ordering, and refining the backlog; PBI, story, and acceptance-criteria quality; estimation; story mapping — and the AI-era evolution: stories as agent-executable specs, AI-assisted refinement, and the feature-factory trap AI amplifies.$$,30.0,4),
  ('33333333-3333-3333-3333-333333333333','D5',$$Product Vision, Value, Roadmap & Strategy$$,$$The strategic half of the role: vision, the Product Goal, value maximization and measurement, roadmaps, forecasting and release planning, business strategy, and stakeholders — with AI woven into roadmap and strategic analysis, and the argument that vision matters more in the AI era.$$,27.5,5);

-- =====================================================================
-- SECTION 4 — Concepts (132)
-- =====================================================================
insert into concepts (certification_id, slug, name, description) values
-- D1
('33333333-3333-3333-3333-333333333333','agile-meaning',$$Meaning of Agile$$,$$Agile as empirical, iterative-incremental delivery.$$),
('33333333-3333-3333-3333-333333333333','agile-vs-waterfall',$$Agile vs Waterfall$$,$$Empirical iterative delivery vs predictive plan-then-execute.$$),
('33333333-3333-3333-3333-333333333333','agile-lifecycle',$$Agile Product Lifecycle$$,$$The iterative-incremental lifecycle of agile product work.$$),
('33333333-3333-3333-3333-333333333333','agile-manifesto-values',$$Agile Manifesto Values$$,$$The four values and the precedence of the items on the left.$$),
('33333333-3333-3333-3333-333333333333','agile-principles',$$Agile Principles$$,$$The twelve principles, especially those most relevant to a PO.$$),
('33333333-3333-3333-3333-333333333333','customer-collaboration',$$Customer Collaboration$$,$$Daily business-developer collaboration and customer focus.$$),
('33333333-3333-3333-3333-333333333333','empiricism',$$Empiricism$$,$$Making decisions from observation under uncertainty.$$),
('33333333-3333-3333-3333-333333333333','transparency-inspection-adaptation',$$Transparency, Inspection, Adaptation$$,$$The three empirical pillars of Scrum.$$),
('33333333-3333-3333-3333-333333333333','empirical-product-decisions',$$Empirical Product Decisions$$,$$Basing value decisions on evidence rather than opinion.$$),
('33333333-3333-3333-3333-333333333333','lean-product-thinking',$$Lean Product Thinking$$,$$Flow, small batches, waste reduction, deferred commitment.$$),
('33333333-3333-3333-3333-333333333333','small-batches',$$Small Batches$$,$$Working in small increments to reduce risk and waste.$$),
('33333333-3333-3333-3333-333333333333','deferring-commitment',$$Deferring Commitment$$,$$Deciding at the last responsible moment.$$),
('33333333-3333-3333-3333-333333333333','scrum-in-ai-era',$$Scrum in the AI Era$$,$$Why Scrum and empiricism stay relevant as AI accelerates delivery.$$),
('33333333-3333-3333-3333-333333333333','ai-agent-definition',$$What an AI Agent Is$$,$$An autonomous or semi-autonomous system that executes specified work.$$),
('33333333-3333-3333-3333-333333333333','ai-impact-product-development',$$AI Impact on Product Development$$,$$How agents change throughput and what stays human.$$),
('33333333-3333-3333-3333-333333333333','spec-driven-development',$$Spec-Driven Development$$,$$Writing specifications precise enough for agents to execute.$$),
('33333333-3333-3333-3333-333333333333','executable-specifications',$$Executable Specifications$$,$$Specs an AI agent can act on directly.$$),
('33333333-3333-3333-3333-333333333333','intro-agent-executable-stories',$$Stories as Agent-Executable Specs (Intro)$$,$$The shift from story-as-conversation toward story-as-executable-spec.$$),
-- D2
('33333333-3333-3333-3333-333333333333','scrum-framework-overview',$$Scrum Framework Overview$$,$$Scrum as a lightweight empirical framework.$$),
('33333333-3333-3333-3333-333333333333','definition-of-product',$$Definition of a Product$$,$$A vehicle to deliver value with a clear boundary and stakeholders.$$),
('33333333-3333-3333-3333-333333333333','product-vs-project',$$Product vs Project$$,$$Product-centric over project-centric thinking.$$),
('33333333-3333-3333-3333-333333333333','scrum-team-composition',$$Scrum Team Composition$$,$$One PO, one Scrum Master, and Developers; typically 10 or fewer.$$),
('33333333-3333-3333-3333-333333333333','po-in-scrum-team',$$The PO in the Scrum Team$$,$$The Product Owner role within the one accountable team.$$),
('33333333-3333-3333-3333-333333333333','one-team-no-subteams',$$One Team, No Sub-Teams$$,$$No sub-teams or hierarchies within a Scrum Team.$$),
('33333333-3333-3333-3333-333333333333','scrum-artifacts',$$Scrum Artifacts$$,$$Product Backlog, Sprint Backlog, and Increment.$$),
('33333333-3333-3333-3333-333333333333','artifact-commitments',$$Artifact Commitments$$,$$Product Goal, Sprint Goal, and Definition of Done.$$),
('33333333-3333-3333-3333-333333333333','backlog-sprintbacklog-increment',$$Backlog / Sprint Backlog / Increment$$,$$The three artifacts and how they relate.$$),
('33333333-3333-3333-3333-333333333333','scrum-events',$$Scrum Events$$,$$The five events and their purposes.$$),
('33333333-3333-3333-3333-333333333333','po-event-participation',$$PO Event Participation$$,$$Where the PO is essential vs supporting across events.$$),
('33333333-3333-3333-3333-333333333333','sprint-as-container',$$Sprint as Container$$,$$The Sprint contains all other events.$$),
('33333333-3333-3333-3333-333333333333','artifact-transparency',$$Artifact Transparency$$,$$Artifacts must be transparent for inspection to be meaningful.$$),
('33333333-3333-3333-3333-333333333333','inspection-adaptation-artifacts',$$Inspection & Adaptation of Artifacts$$,$$Inspecting artifacts to adapt toward value.$$),
('33333333-3333-3333-3333-333333333333','transparency-breakdown',$$Transparency Breakdown$$,$$Detecting and correcting low transparency in the backlog.$$),
('33333333-3333-3333-3333-333333333333','artifacts-as-ai-instruction',$$Artifacts as AI Instruction$$,$$Artifacts become the instruction set agents act on.$$),
('33333333-3333-3333-3333-333333333333','pbi-as-agent-input',$$PBI as Agent Input$$,$$Ambiguous PBIs produce wrong agent output.$$),
('33333333-3333-3333-3333-333333333333','transparency-for-agents',$$Transparency for Agents$$,$$Transparency now serves machines as well as people.$$),
('33333333-3333-3333-3333-333333333333','definition-of-done',$$Definition of Done$$,$$The shared quality standard for the Increment.$$),
('33333333-3333-3333-3333-333333333333','dod-ai-assisted-work',$$DoD in AI-Assisted Work$$,$$The DoD applies equally to AI-generated output.$$),
('33333333-3333-3333-3333-333333333333','dod-applies-to-agent-output',$$DoD Applies to Agent Output$$,$$Agent output is not Done just because it was produced.$$),
('33333333-3333-3333-3333-333333333333','scrum-anti-patterns-po',$$PO Scrum Anti-Patterns$$,$$Common framework anti-patterns affecting the PO.$$),
('33333333-3333-3333-3333-333333333333','proxy-po',$$Proxy / Committee PO$$,$$A PO who only relays a committee without authority.$$),
('33333333-3333-3333-3333-333333333333','absent-po',$$Absent PO$$,$$A PO disengaged from the team and backlog.$$),
-- D3
('33333333-3333-3333-3333-333333333333','po-value-accountability',$$PO Value Accountability$$,$$Accountable for maximizing the value of the product.$$),
('33333333-3333-3333-3333-333333333333','maximizing-value',$$Maximizing Value$$,$$Value from the work of the Scrum Team.$$),
('33333333-3333-3333-3333-333333333333','value-from-team-work',$$Value from the Team's Work$$,$$Value resulting from the Scrum Team, not output alone.$$),
('33333333-3333-3333-3333-333333333333','po-one-person',$$PO Is One Person$$,$$The Product Owner is one person, not a committee.$$),
('33333333-3333-3333-3333-333333333333','po-not-committee',$$PO Not a Committee$$,$$May represent a committee but decisions are the PO's.$$),
('33333333-3333-3333-3333-333333333333','po-decision-authority',$$PO Decision Authority$$,$$Others may influence; the PO decides.$$),
('33333333-3333-3333-3333-333333333333','po-backlog-authority',$$PO Backlog Authority$$,$$The PO orders the Product Backlog.$$),
('33333333-3333-3333-3333-333333333333','po-sprint-cancellation',$$Sprint Cancellation$$,$$Only the PO can cancel a Sprint.$$),
('33333333-3333-3333-3333-333333333333','respecting-po-decisions',$$Respecting PO Decisions$$,$$The organization must respect the PO's decisions.$$),
('33333333-3333-3333-3333-333333333333','po-sm-boundary',$$PO / SM Boundary$$,$$The PO is not the Scrum Master or a project manager.$$),
('33333333-3333-3333-3333-333333333333','po-developer-boundary',$$PO / Developer Boundary$$,$$The PO does not dictate the how; Developers own it.$$),
('33333333-3333-3333-3333-333333333333','accountability-anti-patterns',$$Accountability Anti-Patterns$$,$$Boundary violations between PO, SM, and Developers.$$),
('33333333-3333-3333-3333-333333333333','po-developer-collaboration',$$PO-Developer Collaboration$$,$$The PO supplies why and ordering; Developers size work.$$),
('33333333-3333-3333-3333-333333333333','refinement-collaboration',$$Refinement Collaboration$$,$$Refinement is a collaborative activity.$$),
('33333333-3333-3333-3333-333333333333','estimates-by-developers',$$Estimates Owned by Developers$$,$$Developers own the estimates.$$),
('33333333-3333-3333-3333-333333333333','human-held-value-accountability',$$Human-Held Value Accountability$$,$$The value decision and accountability remain the PO's.$$),
('33333333-3333-3333-3333-333333333333','ai-does-not-own-value',$$AI Does Not Own Value$$,$$Accountability cannot be delegated to an agent.$$),
('33333333-3333-3333-3333-333333333333','accountability-with-ai',$$Accountability with AI$$,$$Justifying a value decision AI influenced.$$),
('33333333-3333-3333-3333-333333333333','product-ecosystem-actors',$$Product Ecosystem Actors$$,$$Stakeholders, customers, users, and sponsors.$$),
('33333333-3333-3333-3333-333333333333','stakeholders-customers-users',$$Stakeholders, Customers, Users$$,$$Distinguishing the actors around the product.$$),
('33333333-3333-3333-3333-333333333333','voice-of-customer',$$Voice of the Customer$$,$$The PO as the voice of the customer to the team.$$),
-- D4
('33333333-3333-3333-3333-333333333333','product-backlog-definition',$$Product Backlog$$,$$An emergent, ordered, single source of work; never complete.$$),
('33333333-3333-3333-3333-333333333333','single-product-backlog',$$Single Product Backlog$$,$$One backlog per product, even with multiple teams.$$),
('33333333-3333-3333-3333-333333333333','backlog-emergent',$$Emergent Backlog$$,$$The backlog evolves as the product and environment evolve.$$),
('33333333-3333-3333-3333-333333333333','backlog-ordering',$$Backlog Ordering$$,$$The PO orders by value, risk, dependency, cost of delay.$$),
('33333333-3333-3333-3333-333333333333','value-based-prioritization',$$Value-Based Prioritization$$,$$Ordering to maximize delivered value.$$),
('33333333-3333-3333-3333-333333333333','cost-of-delay',$$Cost of Delay$$,$$The economic cost of postponing value.$$),
('33333333-3333-3333-3333-333333333333','user-stories',$$User Stories$$,$$As-a / I-want / so-that framing of backlog items.$$),
('33333333-3333-3333-3333-333333333333','epics',$$Epics$$,$$Large stories that are split over time.$$),
('33333333-3333-3333-3333-333333333333','story-splitting',$$Story Splitting$$,$$Vertically splitting work while preserving value.$$),
('33333333-3333-3333-3333-333333333333','invest-criteria',$$INVEST Criteria$$,$$Independent, Negotiable, Valuable, Estimable, Small, Testable.$$),
('33333333-3333-3333-3333-333333333333','pbi-quality',$$PBI Quality$$,$$Evaluating and improving backlog item quality.$$),
('33333333-3333-3333-3333-333333333333','story-independence',$$Story Independence$$,$$Items that can be delivered independently.$$),
('33333333-3333-3333-3333-333333333333','acceptance-criteria',$$Acceptance Criteria$$,$$Conditions that define done-ness for a specific item.$$),
('33333333-3333-3333-3333-333333333333','testable-criteria',$$Testable Criteria$$,$$Criteria written so they can be verified.$$),
('33333333-3333-3333-3333-333333333333','criteria-vs-dod',$$Acceptance Criteria vs DoD$$,$$Item-specific criteria vs the universal Definition of Done.$$),
('33333333-3333-3333-3333-333333333333','backlog-refinement',$$Backlog Refinement$$,$$Adding detail, estimates, and order over time.$$),
('33333333-3333-3333-3333-333333333333','refinement-not-event',$$Refinement Is Not an Event$$,$$An ongoing activity, not a formal Scrum event.$$),
('33333333-3333-3333-3333-333333333333','refinement-ongoing',$$Ongoing Refinement$$,$$Continuous grooming of the backlog.$$),
('33333333-3333-3333-3333-333333333333','estimation-techniques',$$Estimation Techniques$$,$$Relative estimation, story points, planning poker.$$),
('33333333-3333-3333-3333-333333333333','story-points',$$Story Points$$,$$Relative units of effort/complexity.$$),
('33333333-3333-3333-3333-333333333333','relative-estimation',$$Relative Estimation$$,$$Sizing items against one another.$$),
('33333333-3333-3333-3333-333333333333','story-mapping',$$Story Mapping$$,$$A two-dimensional narrative view of the backlog.$$),
('33333333-3333-3333-3333-333333333333','walking-skeleton',$$Walking Skeleton$$,$$A thin end-to-end releasable slice.$$),
('33333333-3333-3333-3333-333333333333','backlog-structure',$$Backlog Structure$$,$$Backbone plus slices in a story map.$$),
('33333333-3333-3333-3333-333333333333','spec-driven-development-applied',$$Spec-Driven Development (Applied)$$,$$Story plus acceptance criteria as the executable spec.$$),
('33333333-3333-3333-3333-333333333333','stories-as-executable-specs',$$Stories as Executable Specs$$,$$Writing stories agents can execute without losing intent.$$),
('33333333-3333-3333-3333-333333333333','precision-for-agents',$$Precision for Agents$$,$$Raising precision without over-constraining the how.$$),
('33333333-3333-3333-3333-333333333333','ai-assisted-refinement',$$AI-Assisted Refinement$$,$$Using AI to draft, split, and surface edge cases.$$),
('33333333-3333-3333-3333-333333333333','ai-drafted-pbis',$$AI-Drafted PBIs$$,$$AI generates backlog items the PO curates.$$),
('33333333-3333-3333-3333-333333333333','curating-ai-output',$$Curating AI Output$$,$$Critical curation, not rubber-stamping AI suggestions.$$),
('33333333-3333-3333-3333-333333333333','ai-user-research',$$AI for User Research$$,$$Synthesizing research with AI, validated by the PO.$$),
('33333333-3333-3333-3333-333333333333','ai-feedback-analysis',$$AI Feedback Analysis$$,$$Clustering and analyzing feedback with AI.$$),
('33333333-3333-3333-3333-333333333333','ai-hypothesis-generation',$$AI Hypothesis Generation$$,$$Drafting product hypotheses for validation.$$),
('33333333-3333-3333-3333-333333333333','feature-waiter-anti-pattern',$$Feature Waiter Anti-Pattern$$,$$The order-taker PO who only relays requests.$$),
('33333333-3333-3333-3333-333333333333','ai-amplified-feature-factory',$$AI-Amplified Feature Factory$$,$$AI making feature churn cheaper amplifies the trap.$$),
('33333333-3333-3333-3333-333333333333','strategy-over-throughput',$$Strategy over Throughput$$,$$Why value discrimination matters more when output is cheap.$$),
-- D5
('33333333-3333-3333-3333-333333333333','product-vision',$$Product Vision$$,$$The north star aligning development with long-term goals.$$),
('33333333-3333-3333-3333-333333333333','vision-communication',$$Vision Communication$$,$$Articulating vision to team and stakeholders.$$),
('33333333-3333-3333-3333-333333333333','vision-alignment',$$Vision Alignment$$,$$Aligning work to the product vision.$$),
('33333333-3333-3333-3333-333333333333','product-goal',$$Product Goal$$,$$The commitment for the Product Backlog.$$),
('33333333-3333-3333-3333-333333333333','product-goal-commitment',$$Product Goal as Commitment$$,$$A single objective the backlog progresses toward.$$),
('33333333-3333-3333-3333-333333333333','product-goal-vs-sprint-goal',$$Product Goal vs Sprint Goal$$,$$How Sprint Goals relate to the Product Goal.$$),
('33333333-3333-3333-3333-333333333333','value-maximization',$$Value Maximization$$,$$Maximizing multi-dimensional product value.$$),
('33333333-3333-3333-3333-333333333333','roi',$$Return on Investment$$,$$Weighing value against cost.$$),
('33333333-3333-3333-3333-333333333333','value-vs-cost',$$Value vs Cost$$,$$Avoiding output-as-value thinking.$$),
('33333333-3333-3333-3333-333333333333','value-metrics',$$Value Metrics$$,$$Choosing meaningful measures of value.$$),
('33333333-3333-3333-3333-333333333333','outcome-vs-output-metrics',$$Outcome vs Output Metrics$$,$$Measuring outcomes, not just output.$$),
('33333333-3333-3333-3333-333333333333','evidence-based-management',$$Evidence-Based Management$$,$$Current value, unrealized value, ability to innovate, time to market.$$),
('33333333-3333-3333-3333-333333333333','forecasting',$$Forecasting$$,$$Probabilistic forecasting from velocity/throughput.$$),
('33333333-3333-3333-3333-333333333333','release-planning',$$Release Planning$$,$$Planning and coordinating releases.$$),
('33333333-3333-3333-3333-333333333333','cone-of-uncertainty',$$Cone of Uncertainty$$,$$Uncertainty narrows as work progresses.$$),
('33333333-3333-3333-3333-333333333333','product-roadmap',$$Product Roadmap$$,$$Outcome-oriented intent over time.$$),
('33333333-3333-3333-3333-333333333333','outcome-based-roadmap',$$Outcome-Based Roadmap$$,$$Now/next/later framed by outcomes, not fixed features.$$),
('33333333-3333-3333-3333-333333333333','roadmap-vs-plan',$$Roadmap vs Plan$$,$$An adaptive roadmap is not a fixed schedule.$$),
('33333333-3333-3333-3333-333333333333','business-strategy-alignment',$$Business Strategy Alignment$$,$$Aligning product decisions to strategic goals.$$),
('33333333-3333-3333-3333-333333333333','product-strategy',$$Product Strategy$$,$$The strategy connecting vision to execution.$$),
('33333333-3333-3333-3333-333333333333','strategy-to-execution',$$Strategy to Execution$$,$$The PO as translator from strategy to backlog.$$),
('33333333-3333-3333-3333-333333333333','stakeholder-management',$$Stakeholder Management$$,$$Identifying, engaging, and aligning stakeholders.$$),
('33333333-3333-3333-3333-333333333333','managing-conflicting-priorities',$$Managing Conflicting Priorities$$,$$Navigating competing stakeholder demands toward value.$$),
('33333333-3333-3333-3333-333333333333','stakeholder-transparency',$$Stakeholder Transparency$$,$$Being transparent with stakeholders about progress.$$),
('33333333-3333-3333-3333-333333333333','sprint-review',$$Sprint Review$$,$$Inspecting the Increment and adapting the backlog with stakeholders.$$),
('33333333-3333-3333-3333-333333333333','review-not-demo',$$Review Is Not a Demo$$,$$A working session, not a one-way demo.$$),
('33333333-3333-3333-3333-333333333333','value-inspection',$$Value Inspection$$,$$Collaborating on what to do next to optimize value.$$),
('33333333-3333-3333-3333-333333333333','ai-roadmap-construction',$$AI Roadmap Construction$$,$$Using AI to draft roadmap options and scenarios.$$),
('33333333-3333-3333-3333-333333333333','ai-strategic-analysis',$$AI Strategic Analysis$$,$$AI as analyst surfacing dependencies and risks.$$),
('33333333-3333-3333-3333-333333333333','ai-scenario-modeling',$$AI Scenario Modeling$$,$$Modeling options with AI; the PO decides.$$),
('33333333-3333-3333-3333-333333333333','strategic-vision-ai-era',$$Strategic Vision in the AI Era$$,$$Deciding what is worth building when building is cheap.$$),
('33333333-3333-3333-3333-333333333333','value-discrimination-cheap-output',$$Value Discrimination$$,$$Discriminating value when output is cheap and fast.$$),
('33333333-3333-3333-3333-333333333333','vision-as-differentiator',$$Vision as Differentiator$$,$$Vision and value judgment as the PO's durable edge.$$);

-- =====================================================================
-- SECTION 5 — Tasks (44). domain_id resolved by domain code.
-- order_index is globally sequential 1..44 (uniqueness-safe).
-- =====================================================================
insert into tasks (certification_id, domain_id, code, statement, criticality, frequency, bloom_level, is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index)
select '33333333-3333-3333-3333-333333333333', d.id, v.code, v.statement,
       v.criticality::criticality, v.frequency::task_frequency, v.bloom::bloom_level,
       true, v.sim, v.knowledge, v.skills, v.abilities, v.order_index
from (values
  ('D1','1.1',$$Explain the meaning of agile and distinguish it from predictive (waterfall) delivery$$,'high','occasional','2_understand',false,$$Agile as empirical, iterative-incremental delivery vs predictive plan-then-execute; the agile lifecycle; when each fits.$$,$$Judge whether a context suits an agile or predictive approach.$$,$$Comfort with emergence and uncertainty.$$,1),
  ('D1','1.2',$$Apply the Agile Manifesto values and principles to product decisions$$,'high','occasional','3_apply',false,$$The four values (precedence of the left) and twelve principles, emphasizing early/continuous value delivery, welcoming change, and business-developer collaboration.$$,$$Map a product decision to the value or principle that supports it.$$,$$Value-over-process bias.$$,2),
  ('D1','1.3',$$Explain the three pillars of empiricism and their role in product decisions$$,'high','daily','2_understand',false,$$Transparency, Inspection, Adaptation; empiricism as the basis for value decisions under uncertainty.$$,$$Recognize when a product decision lacks an empirical basis.$$,$$Evidence over opinion.$$,3),
  ('D1','1.4',$$Explain lean product thinking$$,'medium','occasional','2_understand',false,$$Flow, small batches, reducing waste, deferring commitment to the last responsible moment; cost of delay; Scrum's lean lineage.$$,$$Identify waste in a product process.$$,$$Bias toward small, reversible bets.$$,4),
  ('D1','1.5',$$Explain why Scrum remains relevant in the AI era and how AI agents impact product development$$,'high','daily','2_understand',true,$$What an AI agent is; how agents accelerate throughput; why empiricism and value judgment become more important when building is cheap; Scrum as the empirical wrapper around AI-accelerated work.$$,$$Articulate the human accountabilities AI does not remove.$$,$$Grounded realism, neither AI-hype nor AI-dismissal.$$,5),
  ('D1','1.6',$$Describe Spec-Driven Development and the role of executable specifications$$,'high','per_sprint','2_understand',false,$$Spec-Driven Development as writing specs precise enough for agents to execute; the PBI as that specification; the shift from story-as-conversation toward story-as-executable-spec and the tension between them.$$,$$Recognize what makes a spec executable vs ambiguous.$$,$$Precision without over-specification.$$,6),
  ('D2','2.1',$$Describe the Scrum framework and what a product is$$,'high','occasional','1_remember',false,$$Scrum as a lightweight framework; a product as a vehicle to deliver value with a clear boundary and stakeholders; product-over-project mindset.$$,$$Define a product's boundary.$$,$$Product-centric thinking.$$,7),
  ('D2','2.2',$$Explain the Scrum Team composition and the PO's place in it$$,'high','occasional','2_understand',false,$$One PO, one Scrum Master, and Developers; typically 10 or fewer; no sub-teams; the PO is one person.$$,$$Apply composition rules to a described team.$$,$$Small-team comfort.$$,8),
  ('D2','2.3',$$Explain the three Scrum artifacts and their commitments$$,'high','daily','2_understand',false,$$Product Backlog to Product Goal; Sprint Backlog to Sprint Goal; Increment to Definition of Done.$$,$$Match each artifact to its commitment.$$,$$Transparency orientation.$$,9),
  ('D2','2.4',$$Explain the five Scrum events from the PO's perspective$$,'high','per_sprint','2_understand',false,$$The Sprint as container; Planning, Daily Scrum, Review, Retrospective; where the PO is essential vs supporting.$$,$$Identify the PO's role in each event.$$,$$Presence without overreach.$$,10),
  ('D2','2.5',$$Apply Transparency, Inspection, and Adaptation to artifacts$$,'high','daily','3_apply',true,$$Each artifact must be transparent for inspection to be meaningful; the consequences of low transparency for value decisions.$$,$$Detect and correct a transparency breakdown in the Product Backlog.$$,$$Courage to surface inconvenient truths.$$,11),
  ('D2','2.6',$$Explain how Scrum artifacts serve as a source of instruction for AI agents$$,'high','per_sprint','2_understand',false,$$When agents do work, the backlog, PBIs, and acceptance criteria become the instruction set; ambiguous artifacts produce wrong agent output; transparency serves machines too.$$,$$Evaluate whether an artifact is clear enough to instruct an agent.$$,$$Rigor in artifact clarity.$$,12),
  ('D2','2.7',$$Explain the Definition of Done in AI-assisted teams$$,'high','per_sprint','3_apply',false,$$The DoD applies equally to AI-generated output; output is not Done because an agent produced it; the risk of quietly lowering the DoD because AI is fast.$$,$$Apply the DoD to an Increment partly built by an agent.$$,$$No quality double-standard for AI work.$$,13),
  ('D2','2.8',$$Recognize Scrum framework anti-patterns relevant to the PO$$,'medium','occasional','4_analyze',false,$$Proxy/committee PO; absent PO; PO bypassing the team; treating events as status meetings.$$,$$Diagnose the anti-pattern and prescribe the correction.$$,$$Diplomatic firmness.$$,14),
  ('D3','3.1',$$Explain the PO's central accountability: maximizing product value$$,'high','daily','2_understand',false,$$The PO is accountable for maximizing the value of the product resulting from the Scrum Team's work.$$,$$Distinguish value work from output work.$$,$$Outcome over output.$$,15),
  ('D3','3.2',$$Explain that the Product Owner is one accountable person$$,'high','occasional','1_remember',false,$$One person, not a committee; may represent a committee's desires but the decisions are the PO's; only the PO (or those answering to them) changes the backlog.$$,$$Apply the one-person rule to a scenario.$$,$$Ownership of decisions.$$,16),
  ('D3','3.3',$$Explain the PO's authority over the Product Backlog and the Sprint$$,'high','per_sprint','2_understand',false,$$The PO orders the backlog; only the PO can cancel a Sprint; the organization must respect the PO's decisions.$$,$$Recognize violations of PO authority.$$,$$Authority held responsibly.$$,17),
  ('D3','3.4',$$Distinguish PO boundaries from Scrum Master and Developer accountabilities$$,'high','daily','4_analyze',false,$$The PO is not the SM or a project manager; the PO does not assign tasks or dictate the how; Developers own the how and their estimates.$$,$$Diagnose a boundary violation and prescribe the correction.$$,$$Restraint.$$,18),
  ('D3','3.5',$$Explain the PO's collaboration with Developers on the backlog$$,'high','daily','2_understand',false,$$Developers size the work; the PO supplies the why and the ordering; refinement is collaborative.$$,$$Facilitate productive PO-Developer interaction.$$,$$Respect for the team's craft.$$,19),
  ('D3','3.6',$$Explain the human-held value accountability in AI-augmented teams$$,'high','daily','3_apply',true,$$AI can draft, suggest, and analyze, but the value decision and accountability remain the PO's; accountability cannot be delegated to an agent; the PO must justify a value decision AI influenced.$$,$$Retain decision authority while incorporating AI inputs.$$,$$Accountability that does not hide behind the tool.$$,20),
  ('D3','3.7',$$Describe the product ecosystem and stakeholder relationships$$,'medium','weekly','2_understand',false,$$Stakeholders, customers, users, sponsors; the PO as the voice of the customer to the team and of the team to stakeholders.$$,$$Map a product's stakeholder landscape.$$,$$Boundary-spanning.$$,21),
  ('D4','4.1',$$Explain the Product Backlog as an emergent, ordered, single source$$,'high','daily','2_understand',false,$$One backlog per product; never complete; dynamic; the single source of work; multiple teams on one product share one backlog.$$,$$Recognize multi-backlog anti-patterns.$$,$$Single-source discipline.$$,22),
  ('D4','4.2',$$Apply Product Backlog ordering to maximize value$$,'high','daily','3_apply',false,$$Ordering by value, risk, dependency, and cost of delay; not all priority is equal; the PO owns the ordering.$$,$$Order a sample backlog with explicit rationale.$$,$$Decisiveness under tradeoffs.$$,23),
  ('D4','4.3',$$Write high-quality user stories and epics$$,'high','daily','3_apply',false,$$Story structure (as-a / I-want / so-that); epics as large stories; vertical splitting that preserves value.$$,$$Write a well-formed story and split an epic into valuable slices.$$,$$User-centric framing.$$,24),
  ('D4','4.4',$$Apply INVEST criteria to PBI quality$$,'high','daily','3_apply',false,$$Independent, Negotiable, Valuable, Estimable, Small, Testable.$$,$$Evaluate a PBI against INVEST and improve it.$$,$$A quality bar for backlog items.$$,25),
  ('D4','4.5',$$Write effective acceptance criteria$$,'high','daily','3_apply',false,$$Acceptance criteria define done-ness for a specific item, distinct from the DoD which applies to every item; given/when/then style.$$,$$Write clear, testable acceptance criteria.$$,$$Precision.$$,26),
  ('D4','4.6',$$Explain backlog refinement as an ongoing activity$$,'high','daily','2_understand',false,$$Refinement is a continuous activity, not a formal event; it adds detail, estimates, and order.$$,$$Run effective refinement.$$,$$Continuous-grooming discipline.$$,27),
  ('D4','4.7',$$Apply estimation techniques to PBIs$$,'medium','per_sprint','3_apply',false,$$Relative estimation, story points, planning poker; estimates owned by Developers; the PO uses them for forecasting, not as commitments.$$,$$Facilitate estimation and interpret estimates for forecasting.$$,$$Estimates as forecasts, not promises.$$,28),
  ('D4','4.8',$$Apply story mapping to structure the backlog$$,'medium','occasional','3_apply',false,$$Story maps as a two-dimensional narrative view; backbone plus slices; the releasable walking skeleton.$$,$$Build a story map from a product narrative.$$,$$Whole-journey thinking.$$,29),
  ('D4','4.9',$$Apply Spec-Driven Development: stories as agent-executable specifications$$,'high','per_sprint','3_apply',true,$$When agents execute work, story plus acceptance criteria become the executable spec; the precision bar rises; the gap-filling conversation may not happen with an agent, so the spec must carry the intent.$$,$$Convert a conversational story into an agent-executable specification without over-constraining the how.$$,$$Precision balanced with leaving the team room to implement.$$,30),
  ('D4','4.10',$$Apply AI-assisted backlog refinement$$,'high','per_sprint','3_apply',false,$$AI can draft PBIs, suggest splits, surface edge cases, and generate acceptance criteria; the PO curates and stays accountable; the risk of accepting plausible-but-wrong suggestions.$$,$$Use AI to accelerate refinement while curating for quality.$$,$$Critical curation, not rubber-stamping.$$,31),
  ('D4','4.11',$$Use AI for user research and feedback analysis$$,'medium','weekly','3_apply',false,$$AI to synthesize research, cluster feedback, and draft hypotheses; the PO validates and decides; correlation vs causation; bias in AI synthesis.$$,$$Turn AI-analyzed feedback into validated backlog candidates.$$,$$Validate before acting.$$,32),
  ('D4','4.12',$$Recognize the feature waiter anti-pattern amplified by AI agents$$,'high','daily','4_analyze',true,$$The feature-waiter / order-taker PO who relays requests; AI making feature churn cheaper amplifies the feature-factory trap; why vision and value discrimination matter more when output is cheap.$$,$$Diagnose feature-factory behavior and redirect toward value and outcomes.$$,$$Strategic backbone; the discipline to say no.$$,33),
  ('D5','5.1',$$Create and communicate a product vision$$,'high','weekly','3_apply',false,$$Vision as the north star; aligning development with long-term goals; communicating vision to team and stakeholders.$$,$$Craft and articulate a compelling vision.$$,$$Inspirational clarity.$$,34),
  ('D5','5.2',$$Explain the Product Goal as a commitment to the Product Backlog$$,'high','per_sprint','2_understand',false,$$The Product Goal is the commitment for the Product Backlog; a single objective; one at a time; its relationship to Sprint Goals.$$,$$Write a coherent Product Goal and relate Sprint Goals to it.$$,$$Goal-orientation.$$,35),
  ('D5','5.3',$$Apply value-maximization concepts and ROI$$,'high','weekly','3_apply',false,$$Maximizing value/ROI; value is multi-dimensional (revenue, cost savings, risk reduction, learning); avoiding output-as-value.$$,$$Argue for an option on value/ROI grounds.$$,$$Value discrimination.$$,36),
  ('D5','5.4',$$Measure product value and outcomes$$,'high','weekly','4_analyze',false,$$Outcome metrics over output metrics; leading vs lagging; Evidence-Based Management dimensions (current value, unrealized value, ability to innovate, time to market) at a foundational level.$$,$$Choose meaningful value metrics for a given product.$$,$$Measure what matters.$$,37),
  ('D5','5.5',$$Apply forecasting and release planning$$,'high','per_sprint','3_apply',false,$$Forecasting from velocity/throughput; the cone of uncertainty; release burndown; forecasts are probabilistic, not promises; the PO tracks progress at least each Review.$$,$$Produce a release forecast and communicate its uncertainty.$$,$$Honesty about uncertainty.$$,38),
  ('D5','5.6',$$Build and maintain a product roadmap$$,'high','weekly','3_apply',false,$$The roadmap as outcome-oriented intent over time, not a fixed feature schedule; now/next/later; revisiting as you learn.$$,$$Construct an outcome-based roadmap.$$,$$Adaptive planning.$$,39),
  ('D5','5.7',$$Align product decisions to business strategy$$,'medium','weekly','3_apply',false,$$Bridging business strategy and execution; aligning product decisions to strategic goals; the PO as strategy translator.$$,$$Connect a backlog decision to a strategic objective.$$,$$Strategic framing.$$,40),
  ('D5','5.8',$$Manage stakeholders and collaborate across the ecosystem$$,'high','daily','3_apply',false,$$Identifying and engaging stakeholders; managing conflicting priorities; transparency with stakeholders; the Sprint Review as the key inspection point.$$,$$Navigate conflicting stakeholder demands toward value.$$,$$Diplomatic and value-anchored.$$,41),
  ('D5','5.9',$$Facilitate the Sprint Review as the PO's key value-inspection event$$,'high','per_sprint','3_apply',false,$$The Review is a working session to inspect the Increment and adapt the backlog with stakeholders, not a one-way demo; collaborating on what could be done next to optimize value.$$,$$Run a value-focused Sprint Review.$$,$$Collaboration over presentation.$$,42),
  ('D5','5.10',$$Apply AI to roadmap construction and strategic analysis$$,'medium','weekly','3_apply',false,$$AI to draft roadmap options, model scenarios, and surface dependencies and risks; the PO sets strategy and decides; AI as analyst, not strategist.$$,$$Use AI to generate roadmap options, then exercise strategic judgment.$$,$$Strategy stays human.$$,43),
  ('D5','5.11',$$Explain why strategic vision is more critical in the AI era$$,'high','daily','4_analyze',true,$$When AI makes building cheap and fast, the scarce skill becomes deciding what is worth building; vision and value discrimination are the PO's durable differentiators; the risk of accelerating in the wrong direction.$$,$$Make the case for investing in vision and discovery over raw throughput.$$,$$Long-game strategic conviction.$$,44)
) as v(domain_code, code, statement, criticality, frequency, bloom, sim, knowledge, skills, abilities, order_index)
join domains d on d.certification_id = '33333333-3333-3333-3333-333333333333' and d.code = v.domain_code;

-- =====================================================================
-- SECTION 6 — task_concepts links (132). Reachability written at creation.
-- =====================================================================
insert into task_concepts (task_id, concept_id)
select t.id, c.id
from (values
  ('1.1','agile-meaning'),('1.1','agile-vs-waterfall'),('1.1','agile-lifecycle'),
  ('1.2','agile-manifesto-values'),('1.2','agile-principles'),('1.2','customer-collaboration'),
  ('1.3','empiricism'),('1.3','transparency-inspection-adaptation'),('1.3','empirical-product-decisions'),
  ('1.4','lean-product-thinking'),('1.4','small-batches'),('1.4','deferring-commitment'),
  ('1.5','scrum-in-ai-era'),('1.5','ai-agent-definition'),('1.5','ai-impact-product-development'),
  ('1.6','spec-driven-development'),('1.6','executable-specifications'),('1.6','intro-agent-executable-stories'),
  ('2.1','scrum-framework-overview'),('2.1','definition-of-product'),('2.1','product-vs-project'),
  ('2.2','scrum-team-composition'),('2.2','po-in-scrum-team'),('2.2','one-team-no-subteams'),
  ('2.3','scrum-artifacts'),('2.3','artifact-commitments'),('2.3','backlog-sprintbacklog-increment'),
  ('2.4','scrum-events'),('2.4','po-event-participation'),('2.4','sprint-as-container'),
  ('2.5','artifact-transparency'),('2.5','inspection-adaptation-artifacts'),('2.5','transparency-breakdown'),
  ('2.6','artifacts-as-ai-instruction'),('2.6','pbi-as-agent-input'),('2.6','transparency-for-agents'),
  ('2.7','definition-of-done'),('2.7','dod-ai-assisted-work'),('2.7','dod-applies-to-agent-output'),
  ('2.8','scrum-anti-patterns-po'),('2.8','proxy-po'),('2.8','absent-po'),
  ('3.1','po-value-accountability'),('3.1','maximizing-value'),('3.1','value-from-team-work'),
  ('3.2','po-one-person'),('3.2','po-not-committee'),('3.2','po-decision-authority'),
  ('3.3','po-backlog-authority'),('3.3','po-sprint-cancellation'),('3.3','respecting-po-decisions'),
  ('3.4','po-sm-boundary'),('3.4','po-developer-boundary'),('3.4','accountability-anti-patterns'),
  ('3.5','po-developer-collaboration'),('3.5','refinement-collaboration'),('3.5','estimates-by-developers'),
  ('3.6','human-held-value-accountability'),('3.6','ai-does-not-own-value'),('3.6','accountability-with-ai'),
  ('3.7','product-ecosystem-actors'),('3.7','stakeholders-customers-users'),('3.7','voice-of-customer'),
  ('4.1','product-backlog-definition'),('4.1','single-product-backlog'),('4.1','backlog-emergent'),
  ('4.2','backlog-ordering'),('4.2','value-based-prioritization'),('4.2','cost-of-delay'),
  ('4.3','user-stories'),('4.3','epics'),('4.3','story-splitting'),
  ('4.4','invest-criteria'),('4.4','pbi-quality'),('4.4','story-independence'),
  ('4.5','acceptance-criteria'),('4.5','testable-criteria'),('4.5','criteria-vs-dod'),
  ('4.6','backlog-refinement'),('4.6','refinement-not-event'),('4.6','refinement-ongoing'),
  ('4.7','estimation-techniques'),('4.7','story-points'),('4.7','relative-estimation'),
  ('4.8','story-mapping'),('4.8','walking-skeleton'),('4.8','backlog-structure'),
  ('4.9','spec-driven-development-applied'),('4.9','stories-as-executable-specs'),('4.9','precision-for-agents'),
  ('4.10','ai-assisted-refinement'),('4.10','ai-drafted-pbis'),('4.10','curating-ai-output'),
  ('4.11','ai-user-research'),('4.11','ai-feedback-analysis'),('4.11','ai-hypothesis-generation'),
  ('4.12','feature-waiter-anti-pattern'),('4.12','ai-amplified-feature-factory'),('4.12','strategy-over-throughput'),
  ('5.1','product-vision'),('5.1','vision-communication'),('5.1','vision-alignment'),
  ('5.2','product-goal'),('5.2','product-goal-commitment'),('5.2','product-goal-vs-sprint-goal'),
  ('5.3','value-maximization'),('5.3','roi'),('5.3','value-vs-cost'),
  ('5.4','value-metrics'),('5.4','outcome-vs-output-metrics'),('5.4','evidence-based-management'),
  ('5.5','forecasting'),('5.5','release-planning'),('5.5','cone-of-uncertainty'),
  ('5.6','product-roadmap'),('5.6','outcome-based-roadmap'),('5.6','roadmap-vs-plan'),
  ('5.7','business-strategy-alignment'),('5.7','product-strategy'),('5.7','strategy-to-execution'),
  ('5.8','stakeholder-management'),('5.8','managing-conflicting-priorities'),('5.8','stakeholder-transparency'),
  ('5.9','sprint-review'),('5.9','review-not-demo'),('5.9','value-inspection'),
  ('5.10','ai-roadmap-construction'),('5.10','ai-strategic-analysis'),('5.10','ai-scenario-modeling'),
  ('5.11','strategic-vision-ai-era'),('5.11','value-discrimination-cheap-output'),('5.11','vision-as-differentiator')
) as m(task_code, slug)
join tasks t    on t.certification_id = '33333333-3333-3333-3333-333333333333' and t.code = m.task_code
join concepts c on c.certification_id = '33333333-3333-3333-3333-333333333333' and c.slug = m.slug;

-- =====================================================================
-- VERIFICATION (run after; expect: 1 cert, 5 domains, 44 tasks, 132 concepts, 132 links)
-- =====================================================================
-- select
--   (select count(*) from certifications where id='33333333-3333-3333-3333-333333333333') as certs,
--   (select count(*) from domains where certification_id='33333333-3333-3333-3333-333333333333') as domains,
--   (select count(*) from tasks where certification_id='33333333-3333-3333-3333-333333333333') as tasks,
--   (select count(*) from concepts where certification_id='33333333-3333-3333-3333-333333333333') as concepts,
--   (select count(*) from task_concepts tc join tasks t on t.id=tc.task_id where t.certification_id='33333333-3333-3333-3333-333333333333') as links;
