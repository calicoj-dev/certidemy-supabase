-- ============================================================================
-- 095_aigrm_i_jta_v2_cognitive_fix.sql
--
-- AIGRM-I JOB-TASK ANALYSIS REVISION (v2.0)
--
-- The last of the five. AIGRM-I is the only JTA that never carried an inherited
-- "Bloom target" table - it already reported its distribution as a computed RESULT
-- ("Result - Bloom across 49 tasks: 31x understand, 13x apply, 5x analyze"). It is the
-- newest document and it got the hardest part right.
--
-- Its task declarations, however, carry a DIFFERENT disease from the Scrum certs. Those
-- over-declared Analyze. AIGRM-I inflates UNDERSTAND into APPLY, and declares three
-- tasks at Analyze that are really Understand wearing an aspirational verb.
--
-- THE TELL: "Analyze ... / Explain ..."
--
--   Task 3.10's statement says "ANALYZE how the frameworks reinforce one another."
--   Its skills say "EXPLAIN how two instruments combine to strengthen governance."
--   Explaining a relationship you were taught is Understand. The verb was aspiration;
--   the skills line is the truth. Same shape in 5.8.
--
-- =========================================================================
-- 1. OVER-DECLARED: Analyze -> Understand (two tasks)
-- =========================================================================
--   3.10  skills: "Explain how two instruments combine to strengthen governance."
--   5.8   skills: "Explain how the pieces combine to keep AI trustworthy over time."
--
--   Neither asks the candidate to find anything. Both ask them to explain a synergy the
--   lesson taught. That is comprehension.
--
-- =========================================================================
-- 2. OVER-DECLARED: Analyze -> Apply (one task)
-- =========================================================================
--   4.8  skills: "DESIGN oversight points and escalation for a described deployment."
--        DESIGN IS BLOOM 6 (CREATE). Multiple choice cannot assess it. The
--        MCQ-assessable competence is SELECTING where oversight belongs from the
--        taught patterns (human-in-the-loop / human-on-the-loop / gate review).
--
-- =========================================================================
-- 3. OVER-DECLARED: Apply -> Understand (three tasks)
-- =========================================================================
--   1.6  "Reason from a generative/agentic scenario to WHY oversight increases."
--   2.8  "Recognize a security-oriented AI risk and NAME a class of mitigation."
--   4.9  "OUTLINE a monitoring-and-response plan."
--
--   Each explains a rationale or names a taught category. None applies a framework to
--   produce a decision. Their statements all begin "Explain", and for once the statement
--   was right and the declaration was wrong.
--
-- =========================================================================
-- 4. UNDER-DECLARED: Understand -> Apply (four tasks)
-- =========================================================================
--   The mirror error, and just as invalid - the exam has been testing these too easily.
--
--   1.2  "CLASSIFY a described system by type."          - applying a taxonomy
--   1.4  "ASSIGN the right role to an actor in a scenario." - applying the value-chain model
--   3.7  "MATCH a companion standard to its purpose."    - applying a taught mapping
--   3.9  "Recognize the PATTERN rather than any single statute's detail."  <-- KEPT at
--        Understand. Recognising a pattern across a shifting patchwork is genuinely
--        comprehension, not application. Listed here only to record that it was
--        considered and deliberately left alone.
--
-- =========================================================================
-- 5. UNDER-DECLARED: Apply -> Analyze (ONE task, and it is the important one)
-- =========================================================================
--   5.2  skills: "TRACE WHERE BIAS ENTERED a described system and how to mitigate it."
--
--   This is the only task in the entire certification that asks the candidate to find a
--   CAUSE. Bias does not announce which stage produced it - the data, the design, or the
--   deployment - and tracing it back is exactly the governance practitioner's diagnostic
--   act. It was declared 3_apply. It is Analyze, and it was UNDER-tested.
--
-- =========================================================================
-- WHAT IS DELIBERATELY NOT DONE
-- =========================================================================
-- After these changes, D1 (Foundations, 15%) and D3 (Regulatory Landscape, 20%) contain
-- ZERO Analyze tasks. For the Scrum certs we treated an Analyze-free domain as a signal
-- of a missing competence and declared one. WE DO NOT DO THAT HERE, and the reason is in
-- AIGRM-I's own JTA:
--
--     "regulatory tasks say UNDERSTAND / EXPLAIN the structure and obligations of -
--      never 'comply with' (we certify understanding of the landscape, not legal
--      compliance)"
--
-- A regulatory-landscape domain SHOULD be comprehension. Inventing a diagnostic task to
-- decorate D3 would mean certifying legal judgment this credential explicitly declines to
-- certify - and would be padding, which is the same sin as a percentage target.
--
-- The resulting profile is Understand-dominant, and that is CORRECT for a governance
-- credential whose declared purpose is to make an unstable regulatory landscape legible.
-- We publish it as such.
-- ============================================================================

do $$
declare
  v_cert uuid := '55555555-5555-5555-5555-555555555555';
  n_analyze integer;
begin

  -- --- 1. Analyze -> Understand -------------------------------------------
  update public.tasks set bloom_level = '2_understand',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 2_understand. Statement said "Analyze how the frameworks reinforce one another" but skills say "EXPLAIN how two instruments combine to strengthen governance." Explaining a taught synergy is comprehension. The candidate is not asked to find anything.'
  where certification_id = v_cert and code = '3.10';

  update public.tasks set bloom_level = '2_understand',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 2_understand. Skills say "EXPLAIN how the pieces combine to keep AI trustworthy over time." Same shape as 3.10 - an aspirational statement verb over a comprehension skill.'
  where certification_id = v_cert and code = '5.8';

  -- --- 2. Analyze -> Apply (Design is Bloom 6, not MCQ-assessable) ---------
  update public.tasks set
    bloom_level = '3_apply',
    statement   = 'Select where human oversight belongs in a deployed AI system, and what escalation it requires',
    skills      = 'Place oversight at the accountable decision points of a described deployment, choosing from human-in-the-loop, human-on-the-loop, and gate review.',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply, statement and skills rewritten. Skills read "DESIGN oversight points and escalation" - designing is Bloom 6 (Create), which multiple choice cannot assess at all. The MCQ-assessable competence is SELECTING where oversight belongs from the taught patterns. Designing an oversight architecture remains a real competence and is a simulation candidate; it is not certified by this exam.'
  where certification_id = v_cert and code = '4.8';

  -- --- 3. Apply -> Understand ----------------------------------------------
  update public.tasks set bloom_level = '2_understand',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 3_apply -> 2_understand. Skills: "Reason from a generative/agentic scenario to WHY oversight increases." Explaining a rationale is comprehension. The statement already said "Explain" - the statement was right and the declaration was wrong.'
  where certification_id = v_cert and code = '1.6';

  update public.tasks set bloom_level = '2_understand',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 3_apply -> 2_understand. Skills: "Recognize a security-oriented AI risk and NAME a class of mitigation." Naming a taught category is comprehension, not application.'
  where certification_id = v_cert and code = '2.8';

  update public.tasks set bloom_level = '2_understand',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 3_apply -> 2_understand. Skills: "OUTLINE a monitoring-and-response plan." Outlining the taught components of post-market monitoring is comprehension. Statement already said "Explain".'
  where certification_id = v_cert and code = '4.9';

  -- --- 4. Understand -> Apply (under-declared: applying a taxonomy) ---------
  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 2_understand -> 3_apply. Skills: "CLASSIFY a described system by type." Placing a system within the AI/model/foundation/generative/agentic taxonomy is applying it. Under-declared: the exam was testing recall of the definitions rather than their use.'
  where certification_id = v_cert and code = '1.2';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 2_understand -> 3_apply. Skills: "ASSIGN the right role to an actor in a scenario." Applying the provider/deployer/distributor/importer model to a described situation. Under-declared.'
  where certification_id = v_cert and code = '1.4';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 2_understand -> 3_apply. Skills: "MATCH a companion standard to its purpose." Applying a taught mapping (23894 risk / 42005 impact / 38507 governance / 22989 terminology) to a described need. Under-declared.'
  where certification_id = v_cert and code = '3.7';

  -- --- 5. Apply -> Analyze (the only true diagnostic task in the cert) ------
  update public.tasks set
    bloom_level = '4_analyze',
    statement   = 'Trace where bias entered an AI system and determine how to mitigate it',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 3_apply -> 4_analyze. UNDER-DECLARED. Skills: "TRACE WHERE BIAS ENTERED a described system and how to mitigate it." Bias does not announce which stage produced it - data, design, or deployment - and tracing it back to its source is finding a cause nobody supplied. This is the only task in the entire certification that asks the candidate to diagnose, and it was being tested one level too easily.'
  where certification_id = v_cert and code = '5.2';

  select count(*) into n_analyze
  from public.tasks
  where certification_id = v_cert and is_exam_scope and bloom_level::text = '4_analyze';

  raise notice 'AIGRM-I 4_analyze exam-scope tasks: % (was 5)', n_analyze;
  if n_analyze <> 3 then
    raise warning 'Expected 3 (2.7, 4.11, 5.2). Got %.', n_analyze;
  end if;
end $$;

-- ============================================================================
-- The recomputed profile. Understand-dominant BY DESIGN: this credential certifies
-- understanding of the governance landscape, not legal compliance.
-- ============================================================================
select t.bloom_level,
       count(*) as tasks,
       round(sum(d.weight_pct / nullif(dt.n, 0)), 2) as pct_of_form
from public.tasks t
join public.domains d on d.id = t.domain_id
join (
  select domain_id, count(*) as n
  from public.tasks where is_exam_scope group by domain_id
) dt on dt.domain_id = t.domain_id
where t.certification_id = '55555555-5555-5555-5555-555555555555'
  and t.is_exam_scope
group by t.bloom_level
order by t.bloom_level;

-- The three Analyze tasks. Each must trace or locate a cause.
select t.code, left(t.statement, 60) as statement, left(t.skills, 52) as skills
from public.tasks t
where t.certification_id = '55555555-5555-5555-5555-555555555555'
  and t.is_exam_scope and t.bloom_level::text = '4_analyze'
order by t.code;

-- Coverage integrity. Expect 0 rows.
select c.slug as orphaned_concept
from public.concepts c
left join public.task_concepts tc on tc.concept_id = c.id
where c.certification_id = '55555555-5555-5555-5555-555555555555'
  and tc.concept_id is null;
