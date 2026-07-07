-- 082: v_governance_guardrails — the exam-security invariants as a VERSIONED,
-- auditable view (not app-side arithmetic). Both columns must always be 0:
--   practice_marked_secure: practice-pool rows carrying visibility='secure'
--     (the SD-AI-I load-pipeline bug class — display tier mislabel).
--   secure_linked_to_concepts: secure-pool items linked into question_concepts
--     (fetchConceptPractice does NOT filter by pool — a link here LEAKS exam
--     items into practice).
-- Read by get-governance-snapshot (service role). Editor-first, then commit.
begin;

create or replace view public.v_governance_guardrails as
select
  (select count(*)::int
     from public.quiz_questions
    where pool = 'practice' and visibility = 'secure')      as practice_marked_secure,
  (select count(distinct q.id)::int
     from public.quiz_questions q
     join public.question_concepts qc on qc.question_id = q.id
    where q.pool = 'secure')                                as secure_linked_to_concepts;

commit;
