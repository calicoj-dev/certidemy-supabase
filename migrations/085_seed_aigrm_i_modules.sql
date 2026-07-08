-- Migration: seed the 5 AIGRM-I modules, aligned 1:1 to domains D1-D5 by order_index
-- so the module -> domain (shared order_index) -> tasks -> task_concepts reachability
-- fallback resolves correctly (matches the SM/SPO/SD module convention).
--
-- Deterministic ids (a5555555-... mirrors a4444444-.../a3333333-.../a1111111-...) make
-- this idempotent via ON CONFLICT (id). Module slugs match the lesson content folders
-- under content/aigrm-i/ and the module_slug in each lesson's frontmatter.
--
-- estimated_minutes are PLACEHOLDERS until lessons are authored; refine to the sum of
-- each module's lesson durations at lesson-load time.
-- Editor-first: run live in the Supabase SQL editor, THEN commit this file.
insert into modules (id, certification_id, title, description, order_index, estimated_minutes, slug)
values
  ('a5555555-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555',
   $$Foundations of AI Governance & Trustworthy AI$$,
   $$What AI governance, risk, and compliance are and how they differ; core AI terminology; risk versus harm; the AI value-chain actors; the characteristics of trustworthy AI; why autonomy and scale raise the governance stakes; and the types of governance instrument.$$,
   1, 55, 'foundations-of-ai-governance'),
  ('a5555555-0000-0000-0000-000000000002','55555555-5555-5555-5555-555555555555',
   $$AI Risk Management in Practice$$,
   $$The Govern/Map/Measure/Manage cycle; the identify-analyze-evaluate-treat process; characterizing, prioritizing, and treating risk; risk tolerance; and the AI-era risk types - the generative taxonomy, agentic risks, security-oriented risks, model drift, human oversight, and enterprise-risk integration.$$,
   2, 70, 'ai-risk-management-in-practice'),
  ('a5555555-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   $$Regulatory & Standards Landscape$$,
   $$The EU AI Act's risk-tier structure and obligation types; provider vs deployer duties; GPAI treatment; ISO/IEC 42001 and its companion standards; the NIST AI RMF as a voluntary framework; the emerging jurisdictional pattern; and how the instruments reinforce one another - taught as structure and obligations, never as compliance advice.$$,
   3, 62, 'regulatory-standards-landscape'),
  ('a5555555-0000-0000-0000-000000000004','55555555-5555-5555-5555-555555555555',
   $$The AI Lifecycle & Accountable Deployment$$,
   $$The signature domain: governance across the AI lifecycle; stage accountability; AI system impact assessment; documentation, model and system cards, and content provenance; human oversight in deployment; post-market monitoring and incident response; third-party AI; agentic-workflow accountability; and responsible decommissioning.$$,
   4, 80, 'ai-lifecycle-accountable-deployment'),
  ('a5555555-0000-0000-0000-000000000005','55555555-5555-5555-5555-555555555555',
   $$Responsible AI, Ethics & the Governance Function$$,
   $$The core responsible-AI principles; fairness and bias; transparency and explainability as duties; privacy beyond compliance; building the AI governance function (roles, committee, RACI); the AI policy; AI literacy and training; and how ethics, policy, and function sustain trustworthy AI over time.$$,
   5, 55, 'responsible-ai-ethics-governance-function')
on conflict (id) do update set
  certification_id  = excluded.certification_id,
  title             = excluded.title,
  description       = excluded.description,
  order_index       = excluded.order_index,
  estimated_minutes = excluded.estimated_minutes,
  slug              = excluded.slug;

-- Verification (read-only):
-- select order_index, slug, title, estimated_minutes from modules
-- where certification_id = '55555555-5555-5555-5555-555555555555' order by order_index;  -- expect 5 rows, slugs = content/aigrm-i/ folders