-- 047_seed_spo_i_modules.sql
-- Seed the 5 SPO-I modules, aligned 1:1 to domains D1-D5 by order_index so the
-- module->domain (shared order_index)->tasks->task_concepts reachability
-- fallback resolves correctly (matches the SM-I module convention).
--
-- Deterministic ids (a3333333-... mirrors SM-I's a1111111-... pattern) make
-- this idempotent and re-runnable via ON CONFLICT (id).
--
-- Editor-first: run live in the Supabase SQL editor, THEN commit this file to
-- supabase\migrations\.

insert into modules (id, certification_id, title, description, order_index, estimated_minutes, slug)
values
  ('a3333333-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',
   'Agile Foundations in the AI Era',
   'Agile values and empiricism, lean product thinking, why Scrum stays relevant as AI accelerates delivery, and an intro to AI agents and Spec-Driven Development.',
   1, 60, 'agile-foundations-ai-era'),
  ('a3333333-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333',
   'The Scrum Framework & AI-Ready Artifacts',
   'Scrum essentials through the product lens, plus artifacts as a source of instruction for AI agents and what Done means when an agent did the work.',
   2, 80, 'scrum-framework-ai-artifacts'),
  ('a3333333-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333',
   'The Product Owner Accountability & the Scrum Team',
   'Who the PO is and what they are accountable for, how the role interacts with the team and stakeholders, and the human accountability that persists when AI assists.',
   3, 70, 'po-accountability-scrum-team'),
  ('a3333333-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333',
   'Product Backlog Management & Spec-Driven Development',
   'Building, ordering, and refining the backlog; PBI, story, and acceptance-criteria quality; estimation and story mapping; and the AI-era evolution into agent-executable specs.',
   4, 120, 'product-backlog-spec-driven'),
  ('a3333333-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333',
   'Product Vision, Value, Roadmap & Strategy',
   'Vision, the Product Goal, value maximization and measurement, roadmaps, forecasting, business strategy, and stakeholders, with AI woven into roadmap and strategic analysis.',
   5, 110, 'vision-value-strategy')
on conflict (id) do update set
  certification_id  = excluded.certification_id,
  title             = excluded.title,
  description       = excluded.description,
  order_index       = excluded.order_index,
  estimated_minutes = excluded.estimated_minutes,
  slug              = excluded.slug;

-- Verification (read-only):
-- select order_index, slug, title from modules
-- where certification_id = '33333333-3333-3333-3333-333333333333'
-- order by order_index;
