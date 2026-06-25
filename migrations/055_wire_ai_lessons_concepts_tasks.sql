-- 055_wire_ai_lessons_concepts_tasks.sql
--
-- THE MISSING WIRING. The 6 AI lessons (originally Module 6, re-homed into
-- D1/D2/D4/D5 by migration 052) were authored AFTER the cert and inserted as
-- lesson rows WITHOUT projecting their frontmatter concept_slugs/task_codes
-- into the lesson_concepts / lesson_tasks join tables. Every original D1-D5
-- lesson has these links (276 rows); the 6 AI lessons had ZERO — so AI practice
-- questions could not resolve "review where this is covered" back to a lesson,
-- the way every other question does.
--
-- This populates both join tables for all 6 AI lesson groups, across all 3
-- languages, matching each lesson's frontmatter. After this, the review path
-- works for AI exactly as it does for core content:
--   practice question -> question_concepts -> concept -> lesson_concepts -> lesson
--
-- THE RULE (now codified in LESSON_AUTHORING_SPEC): a lesson's frontmatter
-- concept_slugs and task_codes MUST be projected into lesson_concepts and
-- lesson_tasks at ingestion. Original SM-I lessons did this; the AI retrofit
-- skipped it. SD-AI-I and every future cert must wire at insert time.
--
-- Lesson-group -> concepts / task mapping (post-remap codes):
--   a601 AI Agents: Tools, Not Members      task 2.10  ai-as-tool-not-team-member, human-held-accountabilities
--   a602 Done Means Done: DoD + AI          task 4.11  increment-transparency-ai, dod-applies-to-ai-output
--   a603 New Impediments in AI Teams        task 5.10  automation-over-trust, ai-review-bottleneck, eroded-shared-understanding-ai
--   a604 Empiricism Under Acceleration      tasks 1.7 + 3.11  empiricism-under-acceleration, sm-safeguards-inspection, ai-signal-informs-inspection, metrics-inform-not-decide
--   a605 What to Delegate, What to Keep     task 2.11  delegable-ai-work, retained-accountabilities
--   a606 Coaching the AI-Augmented Team     task 5.11  ai-augmentation-anti-patterns, coaching-restore-empiricism
--
-- Editor-first; this is the record. Idempotent (NOT EXISTS guards + the join
-- tables' natural keys). weight defaults to 1.0 for lesson_concepts.

-- ===========================================================================
-- lesson_concepts: (lesson_id, concept_id, weight)
-- For each lesson group, for every language row, link each of its concepts.
-- ===========================================================================

insert into public.lesson_concepts (lesson_id, concept_id, weight)
select l.id, c.id, 1.0
from public.lessons l
join public.concepts c
  on c.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a601'
  and c.slug in ('ai-as-tool-not-team-member','human-held-accountabilities')
  and not exists (
    select 1 from public.lesson_concepts lc
    where lc.lesson_id = l.id and lc.concept_id = c.id
  );

insert into public.lesson_concepts (lesson_id, concept_id, weight)
select l.id, c.id, 1.0
from public.lessons l
join public.concepts c
  on c.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a602'
  and c.slug in ('increment-transparency-ai','dod-applies-to-ai-output')
  and not exists (
    select 1 from public.lesson_concepts lc
    where lc.lesson_id = l.id and lc.concept_id = c.id
  );

insert into public.lesson_concepts (lesson_id, concept_id, weight)
select l.id, c.id, 1.0
from public.lessons l
join public.concepts c
  on c.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a603'
  and c.slug in ('automation-over-trust','ai-review-bottleneck','eroded-shared-understanding-ai')
  and not exists (
    select 1 from public.lesson_concepts lc
    where lc.lesson_id = l.id and lc.concept_id = c.id
  );

insert into public.lesson_concepts (lesson_id, concept_id, weight)
select l.id, c.id, 1.0
from public.lessons l
join public.concepts c
  on c.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a604'
  and c.slug in ('empiricism-under-acceleration','sm-safeguards-inspection','ai-signal-informs-inspection','metrics-inform-not-decide')
  and not exists (
    select 1 from public.lesson_concepts lc
    where lc.lesson_id = l.id and lc.concept_id = c.id
  );

insert into public.lesson_concepts (lesson_id, concept_id, weight)
select l.id, c.id, 1.0
from public.lessons l
join public.concepts c
  on c.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a605'
  and c.slug in ('delegable-ai-work','retained-accountabilities')
  and not exists (
    select 1 from public.lesson_concepts lc
    where lc.lesson_id = l.id and lc.concept_id = c.id
  );

insert into public.lesson_concepts (lesson_id, concept_id, weight)
select l.id, c.id, 1.0
from public.lessons l
join public.concepts c
  on c.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a606'
  and c.slug in ('ai-augmentation-anti-patterns','coaching-restore-empiricism')
  and not exists (
    select 1 from public.lesson_concepts lc
    where lc.lesson_id = l.id and lc.concept_id = c.id
  );

-- ===========================================================================
-- lesson_tasks: (lesson_id, task_id)
-- Link each lesson group to the task(s) it teaches (post-remap codes).
-- a604 teaches TWO tasks (1.7 empiricism + 3.11 AI-signal-in-inspection).
-- ===========================================================================

insert into public.lesson_tasks (lesson_id, task_id)
select l.id, t.id
from public.lessons l
join public.tasks t
  on t.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a601' and t.code = '2.10'
  and not exists (select 1 from public.lesson_tasks lt where lt.lesson_id=l.id and lt.task_id=t.id);

insert into public.lesson_tasks (lesson_id, task_id)
select l.id, t.id
from public.lessons l
join public.tasks t
  on t.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a602' and t.code = '4.11'
  and not exists (select 1 from public.lesson_tasks lt where lt.lesson_id=l.id and lt.task_id=t.id);

insert into public.lesson_tasks (lesson_id, task_id)
select l.id, t.id
from public.lessons l
join public.tasks t
  on t.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a603' and t.code = '5.10'
  and not exists (select 1 from public.lesson_tasks lt where lt.lesson_id=l.id and lt.task_id=t.id);

insert into public.lesson_tasks (lesson_id, task_id)
select l.id, t.id
from public.lessons l
join public.tasks t
  on t.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a604' and t.code in ('1.7','3.11')
  and not exists (select 1 from public.lesson_tasks lt where lt.lesson_id=l.id and lt.task_id=t.id);

insert into public.lesson_tasks (lesson_id, task_id)
select l.id, t.id
from public.lessons l
join public.tasks t
  on t.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a605' and t.code = '2.11'
  and not exists (select 1 from public.lesson_tasks lt where lt.lesson_id=l.id and lt.task_id=t.id);

insert into public.lesson_tasks (lesson_id, task_id)
select l.id, t.id
from public.lessons l
join public.tasks t
  on t.certification_id = '11111111-1111-1111-1111-111111111111'
where l.lesson_group_id = 'c0000000-0000-0000-0000-00000000a606' and t.code = '5.11'
  and not exists (select 1 from public.lesson_tasks lt where lt.lesson_id=l.id and lt.task_id=t.id);

-- ===========================================================================
-- Verify (expected):
--   Each AI lesson group: concept_links = (2 or 3 or 4) x 3 languages,
--   task_links = 1 (or 2 for a604) x 3 languages, all now > 0.
-- ===========================================================================
-- select l.lesson_group_id, l.language,
--        count(distinct lc.concept_id) as concept_links,
--        count(distinct lt.task_id) as task_links
-- from public.lessons l
-- left join public.lesson_concepts lc on lc.lesson_id=l.id
-- left join public.lesson_tasks lt on lt.lesson_id=l.id
-- where l.lesson_group_id in (
--   'c0000000-0000-0000-0000-00000000a601','c0000000-0000-0000-0000-00000000a602',
--   'c0000000-0000-0000-0000-00000000a603','c0000000-0000-0000-0000-00000000a604',
--   'c0000000-0000-0000-0000-00000000a605','c0000000-0000-0000-0000-00000000a606')
-- group by l.lesson_group_id, l.language order by l.lesson_group_id, l.language;
