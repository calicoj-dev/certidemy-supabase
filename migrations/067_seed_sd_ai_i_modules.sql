-- 067_seed_sd_ai_i_modules.sql
-- Seed the 5 SD-AI-I modules, aligned 1:1 to domains D1-D5 by order_index so the
-- module->domain (shared order_index)->tasks->task_concepts reachability
-- fallback resolves correctly (matches the SM-I and SPO-I module convention).
--
-- Deterministic ids (a4444444-... mirrors SPO-I's a3333333-... and SM-I's
-- a1111111-... patterns) make this idempotent and re-runnable via ON CONFLICT (id).
--
-- Module slugs match the lesson content folders under content/sd-ai-i/ and the
-- module_slug in each lesson's frontmatter, so the ingest pipeline maps every
-- lesson file to the right module. estimated_minutes is the sum of each module's
-- lesson durations.
--
-- Modules are structural (5 stable rows), so a migration is the right home for
-- them. Lesson *content* is NOT seeded here -- it enters the DB through the
-- governed content/sd-ai-i markdown -> plan/diff/apply ingest control, keeping a
-- single source of truth (the version-controlled markdown) rather than a frozen
-- SQL copy.
--
-- Editor-first: run live in the Supabase SQL editor, THEN commit this file to
-- supabase\migrations\.
insert into modules (id, certification_id, title, description, order_index, estimated_minutes, slug)
values
  ('a4444444-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444',
   'Agile Foundations & Empirical Engineering in the AI Era',
   'Agile values and principles from a builder''s seat, the three pillars of empiricism applied to engineering and to AI output, the Scrum values as Developers live them, lean and flow thinking, who the Developers are, and matching AI to the complexity of the work.',
   1, 55, 'agile-foundations-empirical-engineering'),
  ('a4444444-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'The Scrum Framework from the Developers'' Seat',
   'The Developers'' accountabilities, Sprint Planning''s how, the Sprint Backlog as a living forecast, the Daily Scrum as the Developers'' event, participation in Review and Retrospective, estimation with AI as input, and self-management.',
   2, 68, 'scrum-framework-developers-seat'),
  ('a4444444-0000-0000-0000-000000000003','44444444-4444-4444-4444-444444444444',
   'Engineering Craft, Quality & the Definition of Done',
   'The Definition of Done as a quality commitment, Done vs looks-done, test-first development, CI/CD, technical debt, refactoring, version-control discipline, code review, pairing and mobbing, and building quality in -- with AI woven throughout.',
   3, 87, 'engineering-craft-quality-dod'),
  ('a4444444-0000-0000-0000-000000000004','44444444-4444-4444-4444-444444444444',
   'AI-Augmented Implementation',
   'The signature domain: implementing an acceptance-criteria-bearing specification with AI as a teammate while owning verification -- spec-driven development, implementation prompting, scrutinizing AI code, generate-then-verify, AI test generation, agentic workflows, AI-specific risks, when not to use AI, provenance and licensing, human accountability, AI debugging, and review/integration debt.',
   4, 108, 'ai-augmented-implementation'),
  ('a4444444-0000-0000-0000-000000000005','44444444-4444-4444-4444-444444444444',
   'Collaboration, Professionalism & Continuous Improvement',
   'Cross-functionality and T-shaping, working with the Product Owner and Scrum Master, giving and receiving technical feedback, professional responsibility (security, privacy, accessibility, ethics of AI-assisted work), sustaining skill in an AI world, standardizing team AI practices, and terminology drift.',
   5, 63, 'collaboration-professionalism-improvement')
on conflict (id) do update set
  certification_id  = excluded.certification_id,
  title             = excluded.title,
  description       = excluded.description,
  order_index       = excluded.order_index,
  estimated_minutes = excluded.estimated_minutes,
  slug              = excluded.slug;

-- Verification (read-only):
-- select order_index, slug, title, estimated_minutes from modules
-- where certification_id = '44444444-4444-4444-4444-444444444444'
-- order by order_index;
-- Expect 5 rows, order_index 1-5, slugs matching content/sd-ai-i/ folders.
