-- 042_backfill_question_concepts_from_tasks.sql
--
-- Make the practice question bank reachable by concept.
--
-- Problem: practice questions were seeded linked to TASKS only (task_id).
-- Concept- and module-scoped practice quizzes (fetchConceptPractice) find
-- questions via the question_concepts junction (concept -> question), so a
-- task-only question is invisible to them: the module/lesson quiz resolves
-- its concepts, finds zero matching question_concepts rows, and falls back to
-- the menu ("builds nothing"). Mastery still worked because it rolls up
-- through task_concepts; only the concept->question reachability was missing.
--
-- Fix: derive the missing question_concepts rows from each question's task
-- concepts (task_id -> task_concepts -> concept_id).
--
-- Scope: pool = 'practice' ONLY. fetchConceptPractice does not filter by pool,
-- so linking SECURE questions here would let secure exam items surface in
-- practice quizzes — breaking the disjoint practice/secure pool design. Secure
-- questions are deliberately left unlinked from question_concepts.
--
-- Idempotent: only touches questions that currently have no question_concepts
-- row, so re-running is a no-op and questions with precise per-concept tags are
-- never diluted. Applies across all languages (each per-language row shares the
-- task_id, so each gets its own concept links).

insert into question_concepts (question_id, concept_id)
select distinct q.id, tc.concept_id
from quiz_questions q
join task_concepts tc on tc.task_id = q.task_id
where q.task_id is not null
  and q.pool = 'practice'
  and not exists (
    select 1 from question_concepts qc where qc.question_id = q.id
  )
on conflict do nothing;

-- Verification (expect linked == practice count, orphaned == 0):
--   select count(*) filter (where q.pool='practice') as practice_q,
--          count(*) filter (where q.pool='practice' and not exists (
--            select 1 from question_concepts qc where qc.question_id=q.id)) as orphaned
--   from quiz_questions q where q.task_id is not null;
