-- Migration 103: seed the 6 AISM-I modules (one per domain, aligned by order_index).
--
-- Module ids reuse the cert's repeating digit: a6666666-0000-0000-0000-00000000000K (K=1..6).
-- slug MUST equal the lesson content folder name minus the NN- prefix and the module_slug in
-- every lesson's frontmatter (all six confirmed against content/aism-i/). Modules must exist
-- before lessons load (a lesson resolves module_id by (certification_id, module_slug)).
-- estimated_minutes is a scaffold placeholder; refine to the sum of lesson durations at load.
-- Editor-first, ASCII-only, idempotent (upsert by fixed id).
-- =====================================================================
insert into modules (id, certification_id, title, description, order_index, estimated_minutes, slug)
values
  ('a6666666-0000-0000-0000-000000000001','66666666-6666-6666-6666-666666666666',$$Foundations of Digital Product & Service Management$$,$$Service value, co-creation, the parties in a service relationship, utility/warranty/experience, outcomes, and SLAs - taught straight, with AI woven in where a foundation genuinely changes.$$,1,70,'foundations-of-service-management'),
  ('a6666666-0000-0000-0000-000000000002','66666666-6666-6666-6666-666666666666',$$The Value System, Guiding Principles & Governance$$,$$The service value system, the seven guiding principles understood and applied, the continual-improvement model, and governance as direction and control.$$,2,75,'value-system-and-governance'),
  ('a6666666-0000-0000-0000-000000000003','66666666-6666-6666-6666-666666666666',$$The Service Lifecycle & Management Practices$$,$$The product-and-service lifecycle, value streams, and the core management practices - incident, problem, change, request, service level, and monitoring - plus supplier and AI-dependency management.$$,3,100,'lifecycle-and-practices'),
  ('a6666666-0000-0000-0000-000000000004','66666666-6666-6666-6666-666666666666',$$AI-Augmented Service Operations$$,$$The signature domain: AIOps, predictive and proactive operations, virtual agents, intelligent and agentic automation, and human oversight of AI-driven service actions.$$,4,130,'ai-augmented-operations'),
  ('a6666666-0000-0000-0000-000000000005','66666666-6666-6666-6666-666666666666',$$Governing AI in Service Management$$,$$The service-specific governance bridge to AIGRM-I: accountability for agentic actions, data quality and provenance, transparency, over-automation risk, and enterprise-governance alignment.$$,5,75,'governing-ai-in-service'),
  ('a6666666-0000-0000-0000-000000000006','66666666-6666-6666-6666-666666666666',$$Experience, Trust & Sustainable Service$$,$$Service experience and its measurement, trust and adoption as prerequisites for AI-service value, and sustainable service value including the AI compute and energy footprint.$$,6,65,'experience-trust-sustainability')
on conflict (id) do update set
  certification_id = excluded.certification_id, title = excluded.title,
  description = excluded.description, order_index = excluded.order_index,
  estimated_minutes = excluded.estimated_minutes, slug = excluded.slug;
-- Verify: select count(*) from modules where certification_id='66666666-6666-6666-6666-666666666666'; -- expect 6
