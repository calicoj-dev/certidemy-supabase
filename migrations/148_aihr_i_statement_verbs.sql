-- 148_aihr_i_statement_verbs.sql
-- AIHR-I - correct three task statements that publish a Bloom-5 (Evaluate) verb
-- while the task is declared and assessed at 4_analyze / 3_apply.
--
-- Caught by verify-cert.mjs invariant jta.statementVerb before any content existed:
--   2.5  "Evaluate ..."  verb level 5  vs declared 4_analyze
--   3.5  "Evaluate ..."  verb level 5  vs declared 4_analyze
--   4.4  "Judge ..."     verb level 5  vs declared 3_apply
--
-- The scheme declares an MCQ ceiling of 4 (Analyze). A task statement is the
-- published claim about what the credential measures; a level-5 verb over a
-- level-4 assessment overstates the claim. The competence intended is unchanged -
-- only the verb is corrected downward to what the examination actually measures.
--
-- Root cause (recorded so it does not recur): JTA v1.2 Rule 5 constrained task
-- verbs to be MCQ-assessable and listed "evaluate" and "judge" among the allowed
-- set. MCQ-assessability and cognitive-level-appropriateness are two separate
-- constraints; only the first was enforced. Rule 5 is amended in JTA v1.3 to
-- require that the verb also sit at or below the task's declared level.
--
-- Safe to run now: AIHR-I is 'draft', no items are written against these tasks,
-- and no translations exist yet, so trg_invalidate_task_translations has nothing
-- to invalidate. Running this BEFORE the JTA translation wave is deliberate -
-- correcting English after translation would flip those rows provisional and
-- force a re-review.
--
-- Editor-first. Idempotent. ASCII-only by construction.

begin;

update public.tasks t
set statement = v.new_statement
from (values
  ('2.5', $$Analyze a vendor bias-audit report to distinguish what it establishes from what it does not$$),
  ('3.5', $$Analyze what a credential evidences about a candidate and what it does not$$),
  ('4.4', $$Determine when a hiring task must not be delegated to AI$$)
) as v(code, new_statement)
where t.certification_id = '77777777-7777-7777-7777-777777777777'
  and t.code = v.code;

commit;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- 1) Read back the three corrected statements with their declared levels:
--
-- select code, bloom_level, statement
--   from public.tasks
--  where certification_id='77777777-7777-7777-7777-777777777777'
--    and code in ('2.5','3.5','4.4')
--  order by code;
--
--   2.5  4_analyze  Analyze a vendor bias-audit report to distinguish ...
--   3.5  4_analyze  Analyze what a credential evidences ...
--   4.4  3_apply    Determine when a hiring task must not be delegated to AI
--
-- 2) No statement in this cert may open with a Bloom 5/6 verb. Expect 0 rows:
--
-- select code, bloom_level, statement
--   from public.tasks
--  where certification_id='77777777-7777-7777-7777-777777777777'
--    and (statement ~* '^(evaluate|judge|appraise|critique|justify|create|design|compose|formulate)\M');
--
-- 3) Re-run: node scripts/verify-cert.mjs --cert AIHR-I
--    jta.statementVerb must PASS. The five content-absence failures remain until
--    lessons and item banks exist.
