-- Migration 065: seed the Scrum Developer I — AI (SD-AI-I) certification.
--
-- Stands up the entire SD-AI-I skeleton from SD_JTA_v1.1 (LOCKED):
--   certification row -> 5 domains -> 44 tasks (with KSAs) -> 135 concepts
--   -> every task_concepts link, written in THIS migration.
--
-- Third and final credential in the Level-I Scrum trilogy (SM-AI-I, SPO-AI-I,
-- SD-AI-I). Signature domain D4 (AI-Augmented Implementation, 30%) is the
-- Developer's half of Spec-Driven Development, pairing with SPO-AI-I's D4.
--
-- Reachability is baked in from row one: task_concepts is populated at creation,
-- so the practice/question pipeline can find questions the moment any are seeded
-- — no D6-style orphan repair will ever be needed here.
--
-- Cert id 44444444-... follows the established pattern (SM 1111..., GAIPC 2222...,
-- SPO 3333...). is_published = false: SD-AI-I stays dark until it has lessons +
-- both question pools. provider = 'Certidemy' (proprietary AI-native cert).
--
-- Idempotent: section 2 wipes ONLY this cert's children (scoped to 4444...),
-- then sections 3-6 reseed. Safe to re-run; never touches the other certs.
-- Editor-first: run top-to-bottom in the SQL Editor, then commit this file.
-- Prose uses dollar-quoting ($$...$$) so apostrophes need no escaping.

-- =====================================================================
-- SECTION 1 — Certification (upsert by fixed id)
-- =====================================================================
insert into certifications (
  id, code, name, provider, description,
  exam_duration_minutes, passing_score_pct, num_questions,
  difficulty_level, tier, is_published
)
values (
  '44444444-4444-4444-4444-444444444444',
  'SD-AI-I',
  'Certidemy Scrum Developer I — AI',
  'Certidemy',
  $$AI-ready Scrum Developer certification. Validates the craft of building and verifying the Increment in AI-augmented teams — engineering quality and the Definition of Done, and the signature discipline of AI-Augmented Implementation: implementing an acceptance-criteria-bearing specification with AI as a teammate while owning verification, security, licensing, and Done. The Developer's half of Spec-Driven Development. Grounded in the 2020 Scrum Guide.$$,
  90, 80.00, 80,
  1, 1, false
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
  is_published = excluded.is_published,
  updated_at = now();

-- =====================================================================
-- SECTION 2 — Idempotency reset (scoped strictly to SD-AI-I)
-- =====================================================================
delete from task_concepts
  where task_id in (select id from tasks where certification_id = '44444444-4444-4444-4444-444444444444');
delete from tasks      where certification_id = '44444444-4444-4444-4444-444444444444';
delete from concepts   where certification_id = '44444444-4444-4444-4444-444444444444';
delete from domains    where certification_id = '44444444-4444-4444-4444-444444444444';

-- =====================================================================
-- SECTION 3 — Domains (5)
-- =====================================================================
insert into domains (certification_id, code, title, description, weight_pct, order_index)
values
  ('44444444-4444-4444-4444-444444444444','D1',$$Agile Foundations & Empirical Engineering in the AI Era$$,$$The why beneath a Developer's work: Agile values and principles from a builder's perspective, the three pillars of empiricism applied to engineering, the five Scrum values as Developers live them, lean/flow thinking, and who the Developers are in the 2020 Guide. The AI-era twist: when generation is cheap and verification is expensive, empiricism is why you inspect AI output instead of trusting it.$$,12.5,1),
  ('44444444-4444-4444-4444-444444444444','D2',$$The Scrum Framework from the Developers' Seat$$,$$The Scrum framework as Developers experience and own it: their accountabilities, Sprint Planning's how, the Sprint Backlog as a living forecast, the Daily Scrum as the Developers' event, and their part in Review and Retrospective. AI-era: AI as input to estimation, never a replacement for the Developers' self-management.$$,15.0,2),
  ('44444444-4444-4444-4444-444444444444','D3',$$Engineering Craft, Quality & the Definition of Done$$,$$The enduring technical craft that makes Done real: the Definition of Done as a quality commitment, done vs looks-done, test-first development, CI/CD, technical debt, refactoring, version-control discipline, code review, and pairing/mobbing. AI-era woven throughout: the DoD applies equally to AI-generated work, and unreviewed AI output is a fast path to technical debt.$$,20.0,3),
  ('44444444-4444-4444-4444-444444444444','D4',$$AI-Augmented Implementation$$,$$The signature domain: implementing an acceptance-criteria-bearing specification with AI as a teammate, while the Developer remains accountable for verification, security, licensing, and the Definition of Done. The Developer's half of Spec-Driven Development (it pairs with SPO-AI-I's D4): implementation prompting, critical review of AI output, the generate-then-verify loop, AI test generation, agentic workflows, AI-specific risks, when not to use AI, provenance, and the human-accountability boundary.$$,30.0,4),
  ('44444444-4444-4444-4444-444444444444','D5',$$Collaboration, Professionalism & Continuous Improvement$$,$$A Developer's work is team work: cross-functionality and T-shaping, collaborating with the Product Owner and Scrum Master, professional responsibility (security, privacy, accessibility, ethics — including for AI-assisted output), sustaining skill in an AI world, standardizing good team AI practices, and the terminology drift Developers must navigate.$$,22.5,5);

-- =====================================================================
-- SECTION 4 — Concepts (135)
-- =====================================================================
insert into concepts (certification_id, slug, name, description) values
-- D1
('44444444-4444-4444-4444-444444444444','agile-values',$$Agile Manifesto Values$$,$$The four values and the primacy of the items on the left.$$),
('44444444-4444-4444-4444-444444444444','agile-principles',$$Agile Principles$$,$$The twelve principles, especially technical excellence and working software.$$),
('44444444-4444-4444-4444-444444444444','working-software-over-docs',$$Working Software over Docs$$,$$Working software as the primary measure of progress.$$),
('44444444-4444-4444-4444-444444444444','empirical-process',$$Empirical Process$$,$$Empiricism as the basis for engineering decisions under uncertainty.$$),
('44444444-4444-4444-4444-444444444444','transparency',$$Transparency$$,$$Making the true state of the work visible.$$),
('44444444-4444-4444-4444-444444444444','inspection',$$Inspection$$,$$Frequently examining artifacts and progress.$$),
('44444444-4444-4444-4444-444444444444','adaptation',$$Adaptation$$,$$Adjusting based on what inspection reveals.$$),
('44444444-4444-4444-4444-444444444444','verify-ai-output',$$Verify AI Output$$,$$AI-generated code is unverified work until inspected.$$),
('44444444-4444-4444-4444-444444444444','scrum-values',$$Scrum Values$$,$$Commitment, Courage, Focus, Openness, Respect applied to building.$$),
('44444444-4444-4444-4444-444444444444','courage-and-quality',$$Courage & Quality$$,$$Courage to reject plausible-but-wrong output and surface bad news.$$),
('44444444-4444-4444-4444-444444444444','openness-about-uncertainty',$$Openness About Uncertainty$$,$$Being open about what isn't understood.$$),
('44444444-4444-4444-4444-444444444444','lean-thinking',$$Lean Thinking$$,$$Flow, small batches, and waste reduction.$$),
('44444444-4444-4444-4444-444444444444','flow-and-wip-limits',$$Flow & WIP Limits$$,$$Limiting work in progress to improve flow.$$),
('44444444-4444-4444-4444-444444444444','ai-shifts-the-bottleneck',$$AI Shifts the Bottleneck$$,$$When code is cheap to generate, the constraint moves to review and verification.$$),
('44444444-4444-4444-4444-444444444444','developers-definition',$$Who the Developers Are$$,$$Team members who create any aspect of a usable Increment each Sprint.$$),
('44444444-4444-4444-4444-444444444444','cross-functional-team',$$Cross-Functional Team$$,$$The team collectively holds all skills needed to deliver.$$),
('44444444-4444-4444-4444-444444444444','whole-team-skills',$$Whole-Team Skills$$,$$Build skills beyond coding: test, design, ops, data.$$),
('44444444-4444-4444-4444-444444444444','complexity-and-ai-fit',$$Complexity & AI Fit$$,$$Matching AI use to the complexity of the work.$$),
('44444444-4444-4444-4444-444444444444','cynefin-lite',$$Cynefin (Lite)$$,$$Distinguishing clear/complicated from complex/novel work.$$),
('44444444-4444-4444-4444-444444444444','when-to-trust-ai',$$When to Trust AI$$,$$Choosing an AI-use posture from the work's nature.$$),
-- D2
('44444444-4444-4444-4444-444444444444','developers-accountabilities',$$Developers' Accountabilities$$,$$Plan the Sprint, instill quality, adapt daily, hold each other accountable.$$),
('44444444-4444-4444-4444-444444444444','instill-quality',$$Instill Quality$$,$$Adhering to a Definition of Done.$$),
('44444444-4444-4444-4444-444444444444','daily-adaptation',$$Daily Adaptation$$,$$Adapting the plan daily toward the Sprint Goal.$$),
('44444444-4444-4444-4444-444444444444','peer-accountability',$$Peer Accountability$$,$$Holding each other accountable as professionals.$$),
('44444444-4444-4444-4444-444444444444','sprint-planning-how',$$Sprint Planning: the How$$,$$Developers decompose selected PBIs into an actionable plan.$$),
('44444444-4444-4444-4444-444444444444','sprint-goal',$$Sprint Goal$$,$$The single objective for the Sprint.$$),
('44444444-4444-4444-4444-444444444444','sprint-backlog-creation',$$Sprint Backlog Creation$$,$$Turning the Goal and items into a plan.$$),
('44444444-4444-4444-4444-444444444444','sprint-backlog-ownership',$$Sprint Backlog Ownership$$,$$By the Developers, for the Developers.$$),
('44444444-4444-4444-4444-444444444444','living-forecast',$$Living Forecast$$,$$A plan that updates as more is learned.$$),
('44444444-4444-4444-4444-444444444444','daily-backlog-update',$$Daily Backlog Update$$,$$Keeping the plan transparent and current.$$),
('44444444-4444-4444-4444-444444444444','daily-scrum',$$Daily Scrum$$,$$The Developers' 15-minute inspect-and-adapt event.$$),
('44444444-4444-4444-4444-444444444444','developers-event',$$The Developers' Event$$,$$For and by the Developers, not a status report.$$),
('44444444-4444-4444-4444-444444444444','replanning-toward-goal',$$Replanning Toward the Goal$$,$$Adapting the plan to progress toward the Sprint Goal.$$),
('44444444-4444-4444-4444-444444444444','sprint-review-participation',$$Sprint Review Participation$$,$$Inspecting the Increment and adapting the Product Backlog.$$),
('44444444-4444-4444-4444-444444444444','done-increment-demo',$$Done Increment Demo$$,$$Only Done work is shown.$$),
('44444444-4444-4444-4444-444444444444','stakeholder-feedback',$$Stakeholder Feedback$$,$$Absorbing feedback without defensiveness.$$),
('44444444-4444-4444-4444-444444444444','sprint-retrospective',$$Sprint Retrospective$$,$$Inspecting how the last Sprint went to improve.$$),
('44444444-4444-4444-4444-444444444444','improvement-commitment',$$Improvement Commitment$$,$$At least one improvement often added to the next Sprint.$$),
('44444444-4444-4444-4444-444444444444','team-process-inspection',$$Team Process Inspection$$,$$People, relationships, process, tools, and the DoD.$$),
('44444444-4444-4444-4444-444444444444','relative-estimation',$$Relative Estimation$$,$$Story points and relative sizing.$$),
('44444444-4444-4444-4444-444444444444','forecasting-throughput',$$Forecasting & Throughput$$,$$Using throughput/velocity as a forecasting aid.$$),
('44444444-4444-4444-4444-444444444444','ai-assisted-estimation',$$AI-Assisted Estimation$$,$$AI suggests estimates; Developers own the forecast.$$),
('44444444-4444-4444-4444-444444444444','self-management',$$Self-Management$$,$$Developers decide how to turn the Backlog into Increments.$$),
('44444444-4444-4444-4444-444444444444','no-externally-assigned-tasks',$$No Externally-Assigned Tasks$$,$$No one tells the Developers how to do the work.$$),
('44444444-4444-4444-4444-444444444444','resist-command-control',$$Resist Command-and-Control$$,$$Guarding self-management against re-imposed task assignment.$$),
-- D3
('44444444-4444-4444-4444-444444444444','definition-of-done',$$Definition of Done$$,$$The commitment that makes Increment quality transparent.$$),
('44444444-4444-4444-4444-444444444444','quality-commitment',$$Quality Commitment$$,$$The DoD as a non-negotiable quality bar.$$),
('44444444-4444-4444-4444-444444444444','dod-applies-to-ai-output',$$DoD Applies to AI Output$$,$$The DoD applies identically whether a human or AI wrote the code.$$),
('44444444-4444-4444-4444-444444444444','done-vs-looks-done',$$Done vs Looks-Done$$,$$Distinguishing truly Done from apparently done.$$),
('44444444-4444-4444-4444-444444444444','undone-work',$$Undone Work$$,$$Untested, unintegrated, undocumented work as invisible debt.$$),
('44444444-4444-4444-4444-444444444444','hidden-integration-cost',$$Hidden Integration Cost$$,$$Deferred integration accrues cost.$$),
('44444444-4444-4444-4444-444444444444','test-driven-development',$$Test-Driven Development$$,$$Red-green-refactor with tests as executable spec.$$),
('44444444-4444-4444-4444-444444444444','test-first',$$Test-First$$,$$Writing the test before the code.$$),
('44444444-4444-4444-4444-444444444444','red-green-refactor',$$Red-Green-Refactor$$,$$The TDD cycle.$$),
('44444444-4444-4444-4444-444444444444','continuous-integration',$$Continuous Integration$$,$$Integrate frequently against a green pipeline.$$),
('44444444-4444-4444-4444-444444444444','continuous-delivery',$$Continuous Delivery$$,$$Keeping the Increment releasable.$$),
('44444444-4444-4444-4444-444444444444','releasable-increment',$$Releasable Increment$$,$$Usable/releasable at Sprint end or sooner.$$),
('44444444-4444-4444-4444-444444444444','technical-debt',$$Technical Debt$$,$$A transparency problem before it's a code problem.$$),
('44444444-4444-4444-4444-444444444444','surface-debt-transparency',$$Surface Debt (Transparency)$$,$$Making debt visible and negotiating paydown.$$),
('44444444-4444-4444-4444-444444444444','ai-generated-debt',$$AI-Generated Debt$$,$$Unreviewed high-volume AI output accelerates debt.$$),
('44444444-4444-4444-4444-444444444444','refactoring',$$Refactoring$$,$$Behavior-preserving change under test coverage.$$),
('44444444-4444-4444-4444-444444444444','maintainability',$$Maintainability$$,$$Care for the next reader of the code.$$),
('44444444-4444-4444-4444-444444444444','ai-assisted-refactoring',$$AI-Assisted Refactoring$$,$$AI proposes; tests and judgment certify safety.$$),
('44444444-4444-4444-4444-444444444444','version-control-discipline',$$Version-Control Discipline$$,$$Meaningful history and reviewable diffs.$$),
('44444444-4444-4444-4444-444444444444','small-reviewable-commits',$$Small Reviewable Commits$$,$$Structuring work into reviewable units.$$),
('44444444-4444-4444-4444-444444444444','branching-tradeoffs',$$Branching Trade-offs$$,$$Trunk-based vs feature-branch trade-offs.$$),
('44444444-4444-4444-4444-444444444444','code-review',$$Code Review$$,$$A collaboration practice that spreads ownership and quality.$$),
('44444444-4444-4444-4444-444444444444','shared-code-ownership',$$Shared Code Ownership$$,$$Collective ownership of the codebase.$$),
('44444444-4444-4444-4444-444444444444','review-feedback-craft',$$Review Feedback Craft$$,$$Specific, kind, actionable feedback.$$),
('44444444-4444-4444-4444-444444444444','pair-programming',$$Pair Programming$$,$$Two developers working together for quality and learning.$$),
('44444444-4444-4444-4444-444444444444','mob-programming',$$Mob Programming$$,$$The whole team working on one thing together.$$),
('44444444-4444-4444-4444-444444444444','ai-pair-programming',$$AI Pair-Programming$$,$$AI as a pair partner, not a substitute for human pairing.$$),
('44444444-4444-4444-4444-444444444444','built-in-quality',$$Built-In Quality$$,$$Quality built in, not inspected in at the end.$$),
('44444444-4444-4444-4444-444444444444','shift-left-testing',$$Shift-Left Testing$$,$$Moving testing earlier in the flow.$$),
('44444444-4444-4444-4444-444444444444','ai-generated-tests-quality',$$AI-Generated Tests Quality$$,$$Tests from the same model may share the code's blind spots.$$),
-- D4
('44444444-4444-4444-4444-444444444444','spec-driven-development',$$Spec-Driven Development$$,$$Implementing an acceptance-criteria-bearing specification.$$),
('44444444-4444-4444-4444-444444444444','pbi-as-executable-spec',$$PBI as Executable Spec$$,$$A PBI with clear criteria an AI agent can execute against.$$),
('44444444-4444-4444-4444-444444444444','acceptance-criteria-driven',$$Acceptance-Criteria-Driven$$,$$Criteria as the contract the implementation must satisfy.$$),
('44444444-4444-4444-4444-444444444444','implementation-prompting',$$Implementation Prompting$$,$$Prompting with criteria, constraints, context, and tests.$$),
('44444444-4444-4444-4444-444444444444','context-engineering',$$Context Engineering$$,$$Supplying the relevant context that makes output correct.$$),
('44444444-4444-4444-4444-444444444444','prompt-with-constraints-and-tests',$$Prompt with Constraints & Tests$$,$$Constraints and tests make output verifiable.$$),
('44444444-4444-4444-4444-444444444444','ai-code-review',$$AI Code Review$$,$$The extra scrutiny AI-authored code demands.$$),
('44444444-4444-4444-4444-444444444444','never-merge-unread',$$Never Merge Unread$$,$$Never merge what you haven't read and understood.$$),
('44444444-4444-4444-4444-444444444444','provenance-and-licensing-check',$$Provenance & Licensing Check$$,$$Checking origin and license of generated code.$$),
('44444444-4444-4444-4444-444444444444','generate-then-verify',$$Generate-Then-Verify$$,$$Generate with AI, then verify against criteria and DoD.$$),
('44444444-4444-4444-4444-444444444444','developer-owns-verification',$$Developer Owns Verification$$,$$The Developer owns verification, not the tool.$$),
('44444444-4444-4444-4444-444444444444','verify-against-dod',$$Verify Against DoD$$,$$Verifying output against the Definition of Done.$$),
('44444444-4444-4444-4444-444444444444','ai-test-generation',$$AI Test Generation$$,$$Drafting tests rapidly with AI.$$),
('44444444-4444-4444-4444-444444444444','coverage-with-ai',$$Coverage with AI$$,$$Expanding test volume with AI.$$),
('44444444-4444-4444-4444-444444444444','testing-to-its-own-bugs',$$Testing to Its Own Bugs$$,$$AI tests may inherit the code's flawed assumptions.$$),
('44444444-4444-4444-4444-444444444444','agentic-dev-workflow',$$Agentic Dev Workflow$$,$$Plan, implement, test, review with tool use.$$),
('44444444-4444-4444-4444-444444444444','plan-implement-test-review',$$Plan-Implement-Test-Review$$,$$The agentic loop's stages.$$),
('44444444-4444-4444-4444-444444444444','human-in-the-loop',$$Human in the Loop$$,$$A human checkpoint at accountable boundaries.$$),
('44444444-4444-4444-4444-444444444444','ai-code-risks',$$AI Code Risks$$,$$Failure modes specific to AI-generated code.$$),
('44444444-4444-4444-4444-444444444444','hallucinated-apis',$$Hallucinated APIs$$,$$Non-existent APIs/packages in generated code.$$),
('44444444-4444-4444-4444-444444444444','insecure-ai-patterns',$$Insecure AI Patterns$$,$$Insecure defaults and outdated patterns.$$),
('44444444-4444-4444-4444-444444444444','when-not-to-use-ai',$$When Not to Use AI$$,$$Contexts where delegation is a poor fit.$$),
('44444444-4444-4444-4444-444444444444','novel-design-human-led',$$Novel Design Human-Led$$,$$Human-led design for novel/architectural work.$$),
('44444444-4444-4444-4444-444444444444','security-critical-paths',$$Security-Critical Paths$$,$$Paths that demand human-led rigor.$$),
('44444444-4444-4444-4444-444444444444','provenance-and-attribution',$$Provenance & Attribution$$,$$Tracking the origin of AI-assisted work.$$),
('44444444-4444-4444-4444-444444444444','license-compliance-ai',$$License Compliance (AI)$$,$$Handling licensed material AI may reproduce.$$),
('44444444-4444-4444-4444-444444444444','ip-hygiene',$$IP Hygiene$$,$$Intellectual-property discipline for generated code.$$),
('44444444-4444-4444-4444-444444444444','human-accountability',$$Human Accountability$$,$$Responsibility for the Increment is human and collective.$$),
('44444444-4444-4444-4444-444444444444','cannot-delegate-accountability',$$Cannot Delegate Accountability$$,$$Accountability cannot be laundered through a tool.$$),
('44444444-4444-4444-4444-444444444444','tool-not-teammate',$$Tool, Not Teammate$$,$$AI is a tool, not a member that holds accountability.$$),
('44444444-4444-4444-4444-444444444444','ai-debugging',$$AI Debugging$$,$$Accelerating debugging with AI.$$),
('44444444-4444-4444-4444-444444444444','code-comprehension-with-ai',$$Code Comprehension with AI$$,$$Understanding code faster with AI.$$),
('44444444-4444-4444-4444-444444444444','dont-outsource-understanding',$$Don't Outsource Understanding$$,$$Understand the solution well enough to own it.$$),
('44444444-4444-4444-4444-444444444444','review-integration-debt',$$Review/Integration Debt$$,$$Debt from generation outpacing verification.$$),
('44444444-4444-4444-4444-444444444444','velocity-outpacing-verification',$$Velocity Outpacing Verification$$,$$AI output arriving faster than it can be verified.$$),
('44444444-4444-4444-4444-444444444444','adjust-team-practices',$$Adjust Team Practices$$,$$WIP limits, review gating, smaller batches to restore balance.$$),
-- D5
('44444444-4444-4444-4444-444444444444','cross-functionality',$$Cross-Functionality$$,$$The team collectively holds all skills to deliver.$$),
('44444444-4444-4444-4444-444444444444','t-shaped-skills',$$T-Shaped Skills$$,$$Depth in one area, breadth across others.$$),
('44444444-4444-4444-4444-444444444444','avoid-silos',$$Avoid Silos$$,$$Reducing single points of failure through shared knowledge.$$),
('44444444-4444-4444-4444-444444444444','working-with-po',$$Working with the PO$$,$$Collaborating on refinement and scope.$$),
('44444444-4444-4444-4444-444444444444','clarify-acceptance-criteria',$$Clarify Acceptance Criteria$$,$$Ensuring criteria are understood before building.$$),
('44444444-4444-4444-4444-444444444444','surface-technical-constraints',$$Surface Technical Constraints$$,$$Making cost, risk, and feasibility visible to the PO.$$),
('44444444-4444-4444-4444-444444444444','working-with-scrum-master',$$Working with the Scrum Master$$,$$Engaging the SM's service to the Developers.$$),
('44444444-4444-4444-4444-444444444444','surface-impediments',$$Surface Impediments$$,$$Making blockers visible early.$$),
('44444444-4444-4444-4444-444444444444','engage-improvement',$$Engage in Improvement$$,$$Participating in team improvement.$$),
('44444444-4444-4444-4444-444444444444','technical-feedback',$$Technical Feedback$$,$$Critiquing the work, not the person.$$),
('44444444-4444-4444-4444-444444444444','professional-disagreement',$$Professional Disagreement$$,$$Disagree-and-commit maturity.$$),
('44444444-4444-4444-4444-444444444444','constructive-critique',$$Constructive Critique$$,$$Feedback as a team-health practice.$$),
('44444444-4444-4444-4444-444444444444','professional-responsibility',$$Professional Responsibility$$,$$Security, privacy, accessibility, and ethics as the Developer's duty.$$),
('44444444-4444-4444-4444-444444444444','security-privacy-accessibility',$$Security, Privacy, Accessibility$$,$$Non-negotiable professional concerns.$$),
('44444444-4444-4444-4444-444444444444','ethics-of-ai-assisted-work',$$Ethics of AI-Assisted Work$$,$$AI assistance doesn't lower the professional bar.$$),
('44444444-4444-4444-4444-444444444444','skill-atrophy-risk',$$Skill Atrophy Risk$$,$$Over-reliance on AI can erode fundamentals.$$),
('44444444-4444-4444-4444-444444444444','deliberate-practice',$$Deliberate Practice$$,$$Practice that keeps core skills sharp.$$),
('44444444-4444-4444-4444-444444444444','learning-in-the-ai-era',$$Learning in the AI Era$$,$$Sustaining judgment that makes AI safe to use.$$),
('44444444-4444-4444-4444-444444444444','team-ai-conventions',$$Team AI Conventions$$,$$Shared conventions for AI use.$$),
('44444444-4444-4444-4444-444444444444','share-ai-practices',$$Share AI Practices$$,$$Spreading good AI-assisted practices.$$),
('44444444-4444-4444-4444-444444444444','collective-ai-guardrails',$$Collective AI Guardrails$$,$$Guardrails as a collective-ownership artifact.$$),
('44444444-4444-4444-4444-444444444444','terminology-drift-developers',$$Terminology Drift (Developers)$$,$$Legacy vs 2020 Guide phrasing a Developer must navigate.$$),
('44444444-4444-4444-4444-444444444444','development-team-to-developers',$$Development Team -> Developers$$,$$The 2020 Guide removed the Development Team sub-team.$$),
('44444444-4444-4444-4444-444444444444','commitment-as-forecast',$$Commitment vs Forecast$$,$$The Sprint Backlog is a forecast; the Sprint Goal is its commitment.$$);

-- =====================================================================
-- SECTION 5 — Tasks (44). domain_id resolved by domain code.
-- order_index is globally sequential 1..44 (uniqueness-safe).
-- =====================================================================
insert into tasks (certification_id, domain_id, code, statement, criticality, frequency, bloom_level, is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index)
select '44444444-4444-4444-4444-444444444444', d.id, v.code, v.statement,
       v.criticality::criticality, v.frequency::task_frequency, v.bloom::bloom_level,
       true, v.sim, v.knowledge, v.skills, v.abilities, v.order_index
from (values
  ('D1','1.1',$$Articulate the Agile Manifesto's values and principles from a Developer's perspective$$,'high','occasional','2_understand',false,$$The 4 values and 12 principles; the primacy of working software and technical excellence.$$,$$Map a delivery decision to the principle it serves or violates.$$,$$Craftsmanship; pride in working, maintainable output.$$,1),
  ('D1','1.2',$$Apply the three pillars of empiricism to engineering work and to AI-generated output$$,'high','daily','3_apply',false,$$Transparency, Inspection, Adaptation and their interdependence; AI-generated code is unverified work until inspected.$$,$$Identify which pillar is broken when a team merges AI output it never read.$$,$$Intellectual honesty; trust-but-verify toward machine output.$$,2),
  ('D1','1.3',$$Live the five Scrum Values as a Developer$$,'high','daily','3_apply',false,$$Commitment, Courage, Focus, Openness, Respect applied to building; Courage to reject plausible-but-wrong output.$$,$$Recognize which value is lived or violated in a build scenario.$$,$$Modeling the values under deadline pressure.$$,3),
  ('D1','1.4',$$Explain lean and flow thinking, and how AI shifts the bottleneck from authoring to reviewing$$,'medium','occasional','2_understand',false,$$Small batches, flow, limiting WIP; when code is cheap to generate, the constraint moves to review and verification.$$,$$Spot when more AI output is making flow worse.$$,$$Systems thinking over local optimization.$$,4),
  ('D1','1.5',$$Define who the Developers are in the 2020 Scrum Guide$$,'high','per_exam','2_understand',false,$$Developers are the team members who create any aspect of a usable Increment each Sprint; the 2020 Guide removed the Development Team sub-team.$$,$$Correctly classify who is and isn't a Developer in a scenario.$$,$$Inclusivity toward all build skills (test, design, ops, data).$$,5),
  ('D1','1.6',$$Match AI assistance to the complexity of the work$$,'medium','occasional','4_analyze',false,$$Where AI generation is high-leverage vs where novel/complex/ambiguous work needs human-led design first.$$,$$Categorize a piece of work and choose an AI-use posture accordingly.$$,$$Resisting AI-for-everything; judgment over reflex.$$,6),
  ('D2','2.1',$$Describe the Developers' accountabilities$$,'high','daily','2_understand',false,$$Create the Sprint plan; instill quality by adhering to a DoD; adapt the plan daily toward the Sprint Goal; hold each other accountable.$$,$$Identify which accountability a behavior fulfills or neglects.$$,$$Ownership of outcomes, not just tasks.$$,7),
  ('D2','2.2',$$Turn the Sprint Goal and selected items into a Sprint Backlog (the how)$$,'high','per_sprint','3_apply',false,$$Sprint Planning topics (why/what/how); Developers decompose selected PBIs into an actionable plan; the Sprint Goal is the single objective.$$,$$Produce a workable plan that serves the Sprint Goal.$$,$$Realistic forecasting over heroic over-commitment.$$,8),
  ('D2','2.3',$$Own and maintain the Sprint Backlog as a living forecast$$,'high','daily','3_apply',false,$$The Sprint Backlog is by the Developers, for the Developers; a forecast that updates as more is learned; not a fixed contract.$$,$$Keep the plan transparent and current through the Sprint.$$,$$Comfort with change within the Sprint.$$,9),
  ('D2','2.4',$$Run the Daily Scrum as the Developers' event$$,'high','daily','3_apply',false,$$15-minute timebox; for and by the Developers; inspect progress toward the Sprint Goal and adapt the plan — not a status report.$$,$$Keep the event focused on the Goal, not individual task accounting.$$,$$Self-management over reporting-up.$$,10),
  ('D2','2.5',$$Present a Done Increment and gather feedback at the Sprint Review$$,'medium','per_sprint','2_understand',false,$$The Review inspects the Increment and adapts the Product Backlog; only Done work is shown; a working session, not a phase-gate.$$,$$Demonstrate working software and absorb feedback without defensiveness.$$,$$Openness to inspection of one's work.$$,11),
  ('D2','2.6',$$Engage in the Sprint Retrospective and commit to improvement$$,'high','per_sprint','3_apply',false,$$Inspect how the last Sprint went (people, relationships, process, tools, DoD); identify the most helpful improvements.$$,$$Move from complaint to a concrete, owned improvement.$$,$$Continuous-improvement habit; candor with kindness.$$,12),
  ('D2','2.7',$$Apply estimation and forecasting, treating AI estimates as input not authority$$,'medium','per_sprint','3_apply',false,$$Relative sizing, story points, throughput as forecasting aids; AI can suggest estimates but the Developers own the forecast.$$,$$Use an AI estimate as a conversation starter, then adjust with team knowledge.$$,$$Skepticism toward false precision, human or machine.$$,13),
  ('D2','2.8',$$Self-manage: decide who does what, when, and how$$,'high','daily','4_analyze',false,$$The Developers internally decide how to turn the Backlog into Increments; no one tells them how; self-management is undermined by re-imposed task assignment.$$,$$Distinguish legitimate coordination from command-and-control creep.$$,$$Collective ownership; professional autonomy.$$,14),
  ('D3','3.1',$$Apply the Definition of Done as the quality bar for every Increment, including AI output$$,'high','daily','3_apply',false,$$The DoD makes Increment quality transparent; work isn't Done until it meets the DoD, applied identically whether a human or AI produced the code.$$,$$Judge whether an Increment, including AI-generated parts, meets the DoD.$$,$$A non-negotiable quality bar.$$,15),
  ('D3','3.2',$$Distinguish Done from looks-done$$,'high','per_sprint','4_analyze',false,$$Undone work (untested, unintegrated, undocumented) accrues as invisible debt; it-runs-on-my-machine is not Done.$$,$$Detect undone work hiding behind a demo.$$,$$Honesty about completeness.$$,16),
  ('D3','3.3',$$Practice test-first / test-driven development$$,'high','daily','3_apply',true,$$Red-green-refactor; tests as executable specification and a guardrail for change (and for verifying AI-generated code).$$,$$Drive a small change test-first.$$,$$Discipline; valuing fast feedback over speed-to-merge.$$,17),
  ('D3','3.4',$$Keep the Increment releasable with continuous integration and delivery$$,'high','daily','3_apply',false,$$Integrate frequently; a green pipeline as a precondition of Done; the Increment should be usable/releasable at Sprint end or sooner.$$,$$Diagnose a broken-flow scenario (long-lived branches, red main).$$,$$Collective responsibility for the build.$$,18),
  ('D3','3.5',$$Surface and pay down technical debt, including AI-generated debt$$,'high','weekly','4_analyze',false,$$Technical debt is a transparency problem before it's a code problem; high-volume AI generation without review accelerates it.$$,$$Name debt, make it visible, and negotiate paydown.$$,$$Long-term stewardship over short-term throughput.$$,19),
  ('D3','3.6',$$Refactor safely toward maintainability$$,'medium','weekly','3_apply',false,$$Behavior-preserving change under test coverage; AI can propose refactorings but the tests and Developer judgment certify safety.$$,$$Refactor without changing behavior; verify with tests.$$,$$Care for the next reader of the code.$$,20),
  ('D3','3.7',$$Use version-control discipline$$,'medium','daily','2_understand',false,$$Small, reviewable commits; trunk-based vs feature-branch trade-offs; meaningful history; AI-generated changes still need reviewable diffs.$$,$$Structure work into reviewable units.$$,$$Consideration for reviewers.$$,21),
  ('D3','3.8',$$Conduct effective code review as a team practice$$,'high','daily','3_apply',false,$$Review is a collaboration practice: it spreads ownership, transfers knowledge, and improves quality through actionable feedback.$$,$$Give specific, kind, actionable review feedback; review for correctness and readability, not style nits.$$,$$Collective ownership; ego-free critique.$$,22),
  ('D3','3.9',$$Collaborate through pairing and mobbing; situate AI pair-programming within them$$,'medium','daily','3_apply',false,$$Pairing/mobbing for quality and knowledge-sharing; an AI assistant is a powerful pair partner but not a substitute for human pairing.$$,$$Choose human pairing vs AI assistance vs both for a given task.$$,$$Valuing shared understanding, not just output.$$,23),
  ('D3','3.10',$$Build quality in continuously (shift-left), including AI-generated tests$$,'high','daily','4_analyze',false,$$Quality must be built in, not inspected in at the end; AI can expand test volume, but tests from the same model that wrote the code may share its blind spots.$$,$$Evaluate whether a test suite actually constrains behavior.$$,$$Distrust of coverage-as-vanity-metric.$$,24),
  ('D4','4.1',$$Implement against a PBI as an executable specification, with AI assistance$$,'high','daily','3_apply',true,$$A PBI with clear acceptance criteria is a specification an AI agent can execute against; the acceptance criteria are the contract the implementation must satisfy.$$,$$Drive an implementation from acceptance criteria, with AI generating candidate code.$$,$$Spec-first discipline over prompt-and-pray.$$,25),
  ('D4','4.2',$$Write effective implementation prompts and context for AI coding assistants$$,'high','daily','3_apply',false,$$Supply the acceptance criteria, constraints, relevant context, and tests when prompting; ambiguous prompts produce plausible but incorrect code.$$,$$Construct a prompt/context that makes correct output likely and verifiable.$$,$$Precision; treating the assistant as a literal-minded collaborator.$$,26),
  ('D4','4.3',$$Apply the extra scrutiny that AI-authored code demands$$,'high','daily','4_analyze',true,$$AI output looks confident and idiomatic, inviting automation bias; never merge what you haven't read, and check for hallucinated APIs, insecure defaults, and uncertain provenance.$$,$$Find the subtle defect in plausible-looking generated code.$$,$$Resistance to automation bias.$$,27),
  ('D4','4.4',$$Apply the generate-then-verify loop and own the verification$$,'high','daily','4_analyze',false,$$AI speeds up generation, but the Developer owns verification against acceptance criteria and the DoD; unverified AI output is unverified work.$$,$$Sequence a task as generate, verify, integrate — not generate, merge.$$,$$Accountability for outcomes regardless of authorship.$$,28),
  ('D4','4.5',$$Use AI to generate and strengthen tests, guarding against blind spots$$,'high','daily','4_analyze',false,$$AI can rapidly draft tests, but tests from the same flawed assumptions as the code can test to its own bugs; independent edge-case reasoning is still required.$$,$$Add the cases the AI missed; verify tests actually fail when behavior breaks.$$,$$Rigor over coverage theater.$$,29),
  ('D4','4.6',$$Operate agentic, multi-step AI dev workflows with a human in the loop$$,'medium','weekly','4_analyze',true,$$Agentic workflows (plan, implement, test, review, with tool use) raise leverage and risk together; a human checkpoint at accountable boundaries is non-negotiable.$$,$$Define where to let an agent run and where to gate it.$$,$$Calibrated trust; comfort interrupting an autonomous run.$$,30),
  ('D4','4.7',$$Recognize and mitigate risks specific to AI-generated code$$,'high','daily','4_analyze',false,$$Common risks: hallucinated APIs/packages, insecure defaults, subtle logic errors, confident-but-incorrect answers, outdated patterns from training data.$$,$$Anticipate the failure mode for a given task and check for it.$$,$$Defensive posture toward generated dependencies.$$,31),
  ('D4','4.8',$$Decide when NOT to use AI$$,'high','weekly','4_analyze',false,$$Novel/architectural design, security-critical paths, deeply ambiguous requirements, and skill-building contexts are poor fits for delegation.$$,$$Make and defend a no-AI call.$$,$$Judgment over default-to-tool.$$,32),
  ('D4','4.9',$$Maintain provenance, attribution, and licensing hygiene for AI-assisted work$$,'medium','occasional','2_understand',false,$$AI-suggested code can reproduce licensed material; teams need provenance, license-compliance, and IP-hygiene practices; the-AI-wrote-it is not a shield.$$,$$Flag and handle code of uncertain provenance.$$,$$Professional and legal responsibility.$$,33),
  ('D4','4.10',$$Keep accountability for the Increment human and collective$$,'high','daily','3_apply',false,$$AI is a tool, not a team member that holds accountability; responsibility for the Increment is human and collective and cannot be laundered through a tool.$$,$$Refuse ship-it-the-AI-says-it's-fine and name who owns the outcome.$$,$$Ownership under pressure.$$,34),
  ('D4','4.11',$$Use AI for debugging and comprehension without outsourcing understanding$$,'medium','daily','3_apply',false,$$AI can accelerate explanation and debugging, but the Developer must understand the solution well enough to own it and detect a wrong explanation.$$,$$Use AI to accelerate comprehension, then confirm independently.$$,$$Curiosity over copy-paste.$$,35),
  ('D4','4.12',$$Recognize when AI velocity is creating review/integration debt and adjust$$,'high','weekly','4_analyze',false,$$Signals that AI generation is outpacing verification — growing unreviewed PRs, rising rollbacks, integration backlog — and the concrete team adjustments that restore balance.$$,$$Read the signals and pick a concrete adjustment.$$,$$Holding the quality line as output volume rises.$$,36),
  ('D5','5.1',$$Collaborate across a cross-functional team and develop T-shaped skills$$,'high','weekly','3_apply',false,$$The Developers collectively have all skills to build a Done Increment; T-shaping and swarming reduce single points of failure and silos.$$,$$Spread knowledge; pick up adjacent work to keep flow.$$,$$Generosity with knowledge; whole-team mindset.$$,37),
  ('D5','5.2',$$Work with the Product Owner: clarify criteria, surface constraints, negotiate scope$$,'high','weekly','3_apply',false,$$Developers and PO collaborate on refinement; Developers surface technical reality so value decisions are informed; the PO owns the what, Developers own the how.$$,$$Translate technical constraints into terms the PO can decide on.$$,$$Respect for the PO's authority; candor about feasibility.$$,38),
  ('D5','5.3',$$Work with the Scrum Master: surface impediments and engage in improvement$$,'medium','weekly','2_understand',false,$$The SM serves the Developers by removing impediments and fostering self-management; Developers must make impediments visible early.$$,$$Raise an impediment clearly and early.$$,$$Trust; willingness to ask for help.$$,39),
  ('D5','5.4',$$Give and receive technical feedback professionally$$,'medium','weekly','3_apply',false,$$Critique the work, not the person; disagree-and-commit; feedback is a team-health practice, not a status contest.$$,$$Deliver hard feedback kindly; receive it without defensiveness.$$,$$Professional maturity; ego subordination.$$,40),
  ('D5','5.5',$$Uphold professional responsibility, including for AI-assisted work$$,'high','daily','3_apply',false,$$Security, privacy, accessibility, and ethics are the Developer's responsibility; AI assistance doesn't lower the bar.$$,$$Apply a professional-responsibility lens to an AI-assisted change.$$,$$Duty of care to users and the public.$$,41),
  ('D5','5.6',$$Sustain skill and learning in an AI-augmented world$$,'high','weekly','4_analyze',false,$$Over-reliance on AI can erode fundamentals; deliberate practice and occasional AI-off work preserve the judgment that makes AI safe to use.$$,$$Design a personal practice that keeps core skills sharp.$$,$$Long-term self-investment over short-term convenience.$$,42),
  ('D5','5.7',$$Share and standardize good AI-assisted practices across the team$$,'medium','weekly','3_apply',false,$$Teams benefit from shared conventions for AI use; guardrails are a collective-ownership artifact, like a coding standard or the DoD.$$,$$Contribute to and follow team AI guardrails.$$,$$Collective ownership over lone-wolf tooling.$$,43),
  ('D5','5.8',$$Navigate legacy vs. 2020 Guide terminology drift$$,'medium','per_exam','2_understand',false,$$Development Team to Developers; self-organizing to self-managing; the Sprint Backlog is a forecast while the Sprint Goal is its commitment; ceremonies to events.$$,$$Translate legacy phrasing to canonical on the exam.$$,$$Patience with terminology lag.$$,44)
) as v(domain_code, code, statement, criticality, frequency, bloom, sim, knowledge, skills, abilities, order_index)
join domains d on d.certification_id = '44444444-4444-4444-4444-444444444444' and d.code = v.domain_code;

-- =====================================================================
-- SECTION 6 — task_concepts links (135). Reachability written at creation.
-- =====================================================================
insert into task_concepts (task_id, concept_id)
select t.id, c.id
from (values
  ('1.1','agile-values'),
  ('1.1','agile-principles'),
  ('1.1','working-software-over-docs'),
  ('1.2','empirical-process'),
  ('1.2','transparency'),
  ('1.2','inspection'),
  ('1.2','adaptation'),
  ('1.2','verify-ai-output'),
  ('1.3','scrum-values'),
  ('1.3','courage-and-quality'),
  ('1.3','openness-about-uncertainty'),
  ('1.4','lean-thinking'),
  ('1.4','flow-and-wip-limits'),
  ('1.4','ai-shifts-the-bottleneck'),
  ('1.5','developers-definition'),
  ('1.5','cross-functional-team'),
  ('1.5','whole-team-skills'),
  ('1.6','complexity-and-ai-fit'),
  ('1.6','cynefin-lite'),
  ('1.6','when-to-trust-ai'),
  ('2.1','developers-accountabilities'),
  ('2.1','instill-quality'),
  ('2.1','daily-adaptation'),
  ('2.1','peer-accountability'),
  ('2.2','sprint-planning-how'),
  ('2.2','sprint-goal'),
  ('2.2','sprint-backlog-creation'),
  ('2.3','sprint-backlog-ownership'),
  ('2.3','living-forecast'),
  ('2.3','daily-backlog-update'),
  ('2.4','daily-scrum'),
  ('2.4','developers-event'),
  ('2.4','replanning-toward-goal'),
  ('2.5','sprint-review-participation'),
  ('2.5','done-increment-demo'),
  ('2.5','stakeholder-feedback'),
  ('2.6','sprint-retrospective'),
  ('2.6','improvement-commitment'),
  ('2.6','team-process-inspection'),
  ('2.7','relative-estimation'),
  ('2.7','forecasting-throughput'),
  ('2.7','ai-assisted-estimation'),
  ('2.8','self-management'),
  ('2.8','no-externally-assigned-tasks'),
  ('2.8','resist-command-control'),
  ('3.1','definition-of-done'),
  ('3.1','quality-commitment'),
  ('3.1','dod-applies-to-ai-output'),
  ('3.2','done-vs-looks-done'),
  ('3.2','undone-work'),
  ('3.2','hidden-integration-cost'),
  ('3.3','test-driven-development'),
  ('3.3','test-first'),
  ('3.3','red-green-refactor'),
  ('3.4','continuous-integration'),
  ('3.4','continuous-delivery'),
  ('3.4','releasable-increment'),
  ('3.5','technical-debt'),
  ('3.5','surface-debt-transparency'),
  ('3.5','ai-generated-debt'),
  ('3.6','refactoring'),
  ('3.6','maintainability'),
  ('3.6','ai-assisted-refactoring'),
  ('3.7','version-control-discipline'),
  ('3.7','small-reviewable-commits'),
  ('3.7','branching-tradeoffs'),
  ('3.8','code-review'),
  ('3.8','shared-code-ownership'),
  ('3.8','review-feedback-craft'),
  ('3.9','pair-programming'),
  ('3.9','mob-programming'),
  ('3.9','ai-pair-programming'),
  ('3.10','built-in-quality'),
  ('3.10','shift-left-testing'),
  ('3.10','ai-generated-tests-quality'),
  ('4.1','spec-driven-development'),
  ('4.1','pbi-as-executable-spec'),
  ('4.1','acceptance-criteria-driven'),
  ('4.2','implementation-prompting'),
  ('4.2','context-engineering'),
  ('4.2','prompt-with-constraints-and-tests'),
  ('4.3','ai-code-review'),
  ('4.3','never-merge-unread'),
  ('4.3','provenance-and-licensing-check'),
  ('4.4','generate-then-verify'),
  ('4.4','developer-owns-verification'),
  ('4.4','verify-against-dod'),
  ('4.5','ai-test-generation'),
  ('4.5','coverage-with-ai'),
  ('4.5','testing-to-its-own-bugs'),
  ('4.6','agentic-dev-workflow'),
  ('4.6','plan-implement-test-review'),
  ('4.6','human-in-the-loop'),
  ('4.7','ai-code-risks'),
  ('4.7','hallucinated-apis'),
  ('4.7','insecure-ai-patterns'),
  ('4.8','when-not-to-use-ai'),
  ('4.8','novel-design-human-led'),
  ('4.8','security-critical-paths'),
  ('4.9','provenance-and-attribution'),
  ('4.9','license-compliance-ai'),
  ('4.9','ip-hygiene'),
  ('4.10','human-accountability'),
  ('4.10','cannot-delegate-accountability'),
  ('4.10','tool-not-teammate'),
  ('4.11','ai-debugging'),
  ('4.11','code-comprehension-with-ai'),
  ('4.11','dont-outsource-understanding'),
  ('4.12','review-integration-debt'),
  ('4.12','velocity-outpacing-verification'),
  ('4.12','adjust-team-practices'),
  ('5.1','cross-functionality'),
  ('5.1','t-shaped-skills'),
  ('5.1','avoid-silos'),
  ('5.2','working-with-po'),
  ('5.2','clarify-acceptance-criteria'),
  ('5.2','surface-technical-constraints'),
  ('5.3','working-with-scrum-master'),
  ('5.3','surface-impediments'),
  ('5.3','engage-improvement'),
  ('5.4','technical-feedback'),
  ('5.4','professional-disagreement'),
  ('5.4','constructive-critique'),
  ('5.5','professional-responsibility'),
  ('5.5','security-privacy-accessibility'),
  ('5.5','ethics-of-ai-assisted-work'),
  ('5.6','skill-atrophy-risk'),
  ('5.6','deliberate-practice'),
  ('5.6','learning-in-the-ai-era'),
  ('5.7','team-ai-conventions'),
  ('5.7','share-ai-practices'),
  ('5.7','collective-ai-guardrails'),
  ('5.8','terminology-drift-developers'),
  ('5.8','development-team-to-developers'),
  ('5.8','commitment-as-forecast')
) as m(task_code, slug)
join tasks t    on t.certification_id = '44444444-4444-4444-4444-444444444444' and t.code = m.task_code
join concepts c on c.certification_id = '44444444-4444-4444-4444-444444444444' and c.slug = m.slug;

-- =====================================================================
-- VERIFICATION (run after; expect: 1 cert, 5 domains, 44 tasks, 135 concepts, 135 links)
-- =====================================================================
-- select
--   (select count(*) from certifications where id='44444444-4444-4444-4444-444444444444') as certs,
--   (select count(*) from domains where certification_id='44444444-4444-4444-4444-444444444444') as domains,
--   (select count(*) from tasks where certification_id='44444444-4444-4444-4444-444444444444') as tasks,
--   (select count(*) from concepts where certification_id='44444444-4444-4444-4444-444444444444') as concepts,
--   (select count(*) from task_concepts tc join tasks t on t.id=tc.task_id where t.certification_id='44444444-4444-4444-4444-444444444444') as links;
