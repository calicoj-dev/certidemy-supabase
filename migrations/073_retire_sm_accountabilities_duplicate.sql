-- 073_retire_sm_accountabilities_duplicate.sql
-- Concept-inventory reconciliation (SM-AI-I): retire the duplicate concept
-- 'sm-accountabilities' (orphan: 0 lessons) in favor of the taught canonical
-- 'sm-accountability-team-effectiveness' (3 lessons). Repoints question_concepts
-- (58) and task_concepts (2) to the canonical id, removes now-dead orphan links,
-- then deletes the orphan concept row. Conflict-safe: if a task/question was
-- already linked to the canonical concept, we drop the orphan link rather than
-- duplicate. This removes the redundancy an auditor would flag, instead of
-- masking it with a second lesson tag.
--
-- orphan    d0000000-0000-0000-0000-00000000a002  sm-accountabilities
-- canonical 20e39d2b-2a80-4ac5-b7cf-dbf041c180ef  sm-accountability-team-effectiveness
begin;

do $$
declare
  orphan_id    uuid := 'd0000000-0000-0000-0000-00000000a002';
  canonical_id uuid := '20e39d2b-2a80-4ac5-b7cf-dbf041c180ef';
begin
  -- 1. question_concepts: repoint where the question isn't already on canonical...
  update public.question_concepts qc
     set concept_id = canonical_id
   where qc.concept_id = orphan_id
     and not exists (
       select 1 from public.question_concepts x
        where x.question_id = qc.question_id
          and x.concept_id  = canonical_id
     );
  -- ...then drop any orphan links that survived (question already had canonical).
  delete from public.question_concepts where concept_id = orphan_id;

  -- 2. task_concepts: same repoint-or-drop.
  update public.task_concepts tc
     set concept_id = canonical_id
   where tc.concept_id = orphan_id
     and not exists (
       select 1 from public.task_concepts x
        where x.task_id    = tc.task_id
          and x.concept_id = canonical_id
     );
  delete from public.task_concepts where concept_id = orphan_id;

  -- 3. retire the orphan concept row.
  delete from public.concepts where id = orphan_id;
end $$;

commit;
