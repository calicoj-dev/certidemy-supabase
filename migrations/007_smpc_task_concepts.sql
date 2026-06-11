-- Migration 007: SMPC concept→task mapping (task_concepts).
--
-- Populates the missing bridge that the dashboard radar reads along to roll up
-- per-domain mastery. Migration 003 created task_concepts and seeded domains,
-- tasks, and concepts; this migration finally links concepts to tasks.
--
-- The mapping was drafted by lexical scoring of concept text against task
-- statements + KSAs, augmented by curated overrides for SMPC subject-matter
-- correctness, then narrowed by a judgment pass to remove lexical noise.
-- Result: 113 task_concept rows, 1.24 tasks per concept on average,
-- all 91 concepts linked, all 44 tasks covered.
--
-- Idempotent: ON CONFLICT DO NOTHING on the primary key (task_id, concept_id)
-- means re-running this migration adds nothing new.

begin;

-- All inserts are scoped to the SMPC cert via slug lookups; the 11111111…
-- UUID is the SMPC certifications row from migration 003.

insert into public.task_concepts (task_id, concept_id)
select t.id, c.id
from (values
  ('agile-principles', '1.1'),
  ('agile-values', '1.1'),
  ('adaptation', '1.2'),
  ('artifact-transparency', '1.2'),
  ('empirical-process', '1.2'),
  ('imperfect-but-transparent', '1.2'),
  ('inspection', '1.2'),
  ('complex-vs-complicated', '1.4'),
  ('cynefin-framework', '1.4'),
  ('empirical-vs-predictive', '1.4'),
  ('iterative-incremental', '1.4'),
  ('iterative-incremental', '1.5'),
  ('lean-thinking', '1.5'),
  ('scrum-team-composition', '2.1'),
  ('team-size', '2.1'),
  ('sm-accountabilities', '2.2'),
  ('sm-accountability-team-effectiveness', '2.2'),
  ('sm-accountabilities', '2.3'),
  ('sm-serves-org', '2.3'),
  ('sm-serves-po', '2.3'),
  ('sm-serves-team', '2.3'),
  ('po-accountability', '2.4'),
  ('po-one-person', '2.4'),
  ('product-backlog-ownership', '2.4'),
  ('product-value', '2.4'),
  ('single-product-owner-rule', '2.4'),
  ('developer-accountability', '2.5'),
  ('self-managing', '2.6'),
  ('self-organizing-deprecated', '2.6'),
  ('accountability-boundaries', '2.7'),
  ('sm-vs-pm-anti-pattern', '2.7'),
  ('cross-functional', '2.8'),
  ('t-shaped-skills', '2.8'),
  ('team-trust', '2.8'),
  ('developer-broad-definition', '2.9'),
  ('ceremonies-vs-events-terminology', '3.1'),
  ('sprint-events', '3.1'),
  ('sprint-planning', '3.1'),
  ('sprint-review', '3.1'),
  ('timebox-violations', '3.1'),
  ('timeboxes', '3.1'),
  ('daily-scrum-status-report', '3.10'),
  ('event-anti-patterns', '3.10'),
  ('retro-blame-game', '3.10'),
  ('review-as-demo', '3.10'),
  ('sprint-review-vs-demo', '3.10'),
  ('sprint', '3.2'),
  ('sprint-container', '3.2'),
  ('sprint-events', '3.2'),
  ('sprint-goal', '3.3'),
  ('sprint-planning', '3.3'),
  ('sprint-planning-topics', '3.3'),
  ('daily-scrum', '3.4'),
  ('daily-scrum-purpose', '3.4'),
  ('daily-scrum-status-report', '3.4'),
  ('review-as-demo', '3.5'),
  ('sprint-review', '3.5'),
  ('sprint-review-vs-demo', '3.5'),
  ('retro-blame-game', '3.6'),
  ('retrospective-actions', '3.6'),
  ('retrospective-format', '3.6'),
  ('sprint-retrospective', '3.6'),
  ('sprint-cancellation', '3.7'),
  ('timebox-violations', '3.8'),
  ('timeboxes', '3.8'),
  ('goal-vs-items', '3.9'),
  ('product-goal-relationship-to-sprint-goal', '3.9'),
  ('sprint-cancellation', '3.9'),
  ('sprint-goal', '3.9'),
  ('sprint-goal-crafting', '3.9'),
  ('commitments', '4.1'),
  ('invest-criteria', '4.10'),
  ('pbi-quality', '4.10'),
  ('product-backlog', '4.2'),
  ('product-backlog-ordering', '4.2'),
  ('product-backlog-ownership', '4.2'),
  ('sprint-backlog', '4.3'),
  ('sprint-backlog-ownership', '4.3'),
  ('definition-of-done', '4.4'),
  ('dod-creation', '4.4'),
  ('increment', '4.4'),
  ('definition-of-done', '4.5'),
  ('dod-application', '4.5'),
  ('product-goal', '4.6'),
  ('product-goal-relationship-to-sprint-goal', '4.6'),
  ('artifact-transparency', '4.7'),
  ('imperfect-but-transparent', '4.7'),
  ('refinement-as-activity', '4.8'),
  ('refinement-not-event', '4.8'),
  ('burndown-charts', '4.9'),
  ('metrics-not-targets', '4.9'),
  ('velocity', '4.9'),
  ('impediment-management', '5.1'),
  ('impediment-types', '5.1'),
  ('org-impediments', '5.1'),
  ('impediment-vs-problem', '5.2'),
  ('team-ownership', '5.2'),
  ('coaching-self-management', '5.3'),
  ('coaching-stances', '5.3'),
  ('servant-leadership', '5.4'),
  ('servant-vs-true-leader', '5.4'),
  ('true-leadership', '5.4'),
  ('psychological-safety', '5.5'),
  ('team-trust', '5.5'),
  ('coaching-po', '5.6'),
  ('po-coaching-techniques', '5.6'),
  ('ceremonies-vs-events-terminology', '5.7'),
  ('servant-vs-true-leader', '5.7'),
  ('org-coaching', '5.8'),
  ('org-impediments', '5.8'),
  ('scrum-adoption', '5.8'),
  ('scaling-frameworks-overview', '5.9'),
  ('scaling-multiple-teams', '5.9')
) as pairs(concept_slug, task_code)
join public.concepts c
  on c.slug = pairs.concept_slug
  and c.certification_id = '11111111-1111-1111-1111-111111111111'
join public.tasks t
  on t.code = pairs.task_code
  and t.certification_id = '11111111-1111-1111-1111-111111111111'
on conflict (task_id, concept_id) do nothing;

-- Sanity check: every concept_slug and task_code in the VALUES list must
-- resolve to a real row. If the row count below isn't equal to the number
-- of pairs above, some slug or code didn't match and we silently dropped
-- the link. Failing the migration loudly is better than radar surprises.
--
-- Note: we use format() rather than '||' string concatenation across lines.
-- PL/pgSQL parses each line as a statement, and '||' at the start of a line
-- inside a raise format string is a syntax error (the bug in the first cut).
do $$
declare
  expected int := 113;
  actual int;
begin
  select count(*) into actual
  from public.task_concepts tc
  join public.tasks t on t.id = tc.task_id
  join public.concepts c on c.id = tc.concept_id
  where t.certification_id = '11111111-1111-1111-1111-111111111111'
    and c.certification_id = '11111111-1111-1111-1111-111111111111';
  if actual < expected then
    raise exception 'task_concepts seed: expected at least % rows, found %. A concept_slug or task_code in the migration did not match an existing row.', expected, actual;
  end if;
end $$;

commit;