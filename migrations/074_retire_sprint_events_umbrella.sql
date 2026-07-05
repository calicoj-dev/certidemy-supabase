-- 074_retire_sprint_events_umbrella.sql
-- Concept-inventory reconciliation (SM-AI-I): retire the redundant umbrella
-- concept 'sprint-events' (orphan: 0 lessons, 60 questions). Every question
-- linked to it ALSO carries specific, taught concept links (sprint,
-- sprint-container, timeboxes -- all richly lesson-linked), so we simply DROP
-- the umbrella links and delete the concept. Verified safe beforehand: a
-- coverage check confirmed zero questions would be left without a taught link
-- after the drop (no per-question repoint needed). This removes the last
-- tested-not-taught violation for SM-AI-I and eliminates a duplicate an auditor
-- would flag -- without masking anything: the questions keep their real
-- specific coverage.
--
-- umbrella  d0000000-0000-0000-0000-00000000a003  sprint-events
begin;

do $$
declare
  umbrella_id uuid := 'd0000000-0000-0000-0000-00000000a003';
begin
  -- Drop the redundant umbrella links (questions retain their specific links).
  delete from public.question_concepts where concept_id = umbrella_id;
  -- Drop any task links to the umbrella too, so the practice generator can't
  -- re-derive it (same trap that would re-orphan a retired concept).
  delete from public.task_concepts    where concept_id = umbrella_id;
  delete from public.lesson_concepts  where concept_id = umbrella_id;
  -- Retire the umbrella concept row.
  delete from public.concepts where id = umbrella_id;
end $$;

commit;
