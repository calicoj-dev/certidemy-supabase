-- 146_seed_aihr_i_modules.sql
-- AIHR-I modules - one per domain, aligned 1:1 by order_index (module K <-> domain DK).
-- Must run AFTER 145. Modules must exist before any lesson loads, because a lesson
-- resolves module_id by (certification_id, module_slug).
--
-- CRITICAL: each slug below MUST equal the lesson content folder name minus its NN-
-- prefix, and the module_slug in every lesson's frontmatter. A slug typo does not
-- error - lessons silently misfile at load.
--
--   content/aihr-i/01-ai-in-the-talent-lifecycle/
--   content/aihr-i/02-legal-exposure-bias-and-candidate-rights/
--   content/aihr-i/03-scoping-roles-and-capability-claims/
--   content/aihr-i/04-responsible-ai-in-recruiting/
--
-- estimated_minutes is a placeholder; refine to the sum of each module's lesson
-- durations at lesson-load time.
-- ASCII-only by construction.

begin;

insert into public.modules (id, certification_id, title, description, order_index, estimated_minutes, slug)
values
  ('a7777777-0000-0000-0000-000000000001',
   '77777777-7777-7777-7777-777777777777',
   'AI in the Talent Lifecycle',
   $$Where AI actually sits in hiring and worker management, how screening and ranking models produce the outputs you act on, what they cannot reliably assess about a person, and how to read a vendor's capability claim.$$,
   1, 90, 'ai-in-the-talent-lifecycle'),

  ('a7777777-0000-0000-0000-000000000002',
   '77777777-7777-7777-7777-777777777777',
   'Legal Exposure, Bias & Candidate Rights',
   $$The six categories of duty that attach when AI influences an employment decision, how AI-assisted selection produces discriminatory outcomes nobody intended, what candidates are entitled to, and what a defensible record looks like. Role-level legal literacy: recognize and escalate, never advise.$$,
   2, 150, 'legal-exposure-bias-and-candidate-rights'),

  ('a7777777-0000-0000-0000-000000000003',
   '77777777-7777-7777-7777-777777777777',
   'Scoping Roles & Evaluating Capability Claims',
   $$Turning a business need into observable requirements, reading past AI job titles to the work underneath, analysing how AI shifts what a role is, and judging what a credential or a claimed skill actually evidences.$$,
   3, 150, 'scoping-roles-and-capability-claims'),

  ('a7777777-0000-0000-0000-000000000004',
   '77777777-7777-7777-7777-777777777777',
   'Responsible AI Use in the Recruiter Workflow',
   $$Using AI in your own day without leaking candidate data, publishing something the model invented, misjudging an AI-assisted application, or delegating a decision you are accountable for.$$,
   4, 90, 'responsible-ai-in-recruiting')

on conflict (id) do update set
  certification_id  = excluded.certification_id,
  title             = excluded.title,
  description       = excluded.description,
  order_index       = excluded.order_index,
  estimated_minutes = excluded.estimated_minutes,
  slug              = excluded.slug;

commit;

-- ============================================================
-- VERIFICATION (expect 4 modules, order_index 1..4 matching domains D1..D4)
-- ============================================================
-- select m.order_index, m.slug, m.title, d.code as domain_code, d.weight_pct
--   from modules m
--   left join domains d
--     on d.certification_id = m.certification_id
--    and d.order_index = m.order_index
--  where m.certification_id='77777777-7777-7777-7777-777777777777'
--  order by m.order_index;
