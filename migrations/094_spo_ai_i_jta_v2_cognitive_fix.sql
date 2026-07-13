-- ============================================================================
-- 094_spo_ai_i_jta_v2_cognitive_fix.sql
--
-- SPO-AI-I JOB-TASK ANALYSIS REVISION (v2.0)
--
-- This cert's JTA contained the arithmetic impossibility that started the whole
-- review: its inherited "Bloom target" table demanded 15% Analyze items when only
-- 11.5% of exam weight sat on Analyze-declared tasks. No generator could ever have
-- satisfied it. That table is deleted - a JTA reports its computed distribution, it
-- does not assert one over its own tasks.
--
-- Adjudicating the tasks themselves surfaces three defects, and SPO is the first cert
-- where the SECOND kind dominates.
--
-- DEFECT 1 - OVER-DECLARED ANALYZE (two tasks)
--
--   5.4  "Measure product value and outcomes". Skills: "CHOOSE meaningful value metrics
--        for a given product." Selecting from the taught Evidence-Based Management
--        dimensions is Apply. Analyze would be working out WHY a product with healthy
--        output metrics is not delivering value.
--
--   5.11 "Explain why strategic vision is more critical in the AI era" - this task
--        declares THREE different cognitive levels at once. Its statement says
--        "EXPLAIN" (Understand). Its skills say "MAKE THE CASE for investing in vision
--        and discovery over raw throughput" - arguing a position against alternatives
--        is EVALUATE (Bloom 5), which MCQ cannot validly assess. And it is declared
--        4_analyze, agreeing with neither. The MCQ-assessable competence is
--        understanding why vision matters more when building becomes cheap.
--        -> 2_understand.
--
-- DEFECT 2 - UNDER-DECLARED, AND ONE OF THEM BY TWO FULL LEVELS
--
--   Under-declaring is not the safe direction. It is construct under-representation:
--   the exam certifies a competence it never actually measured.
--
--   3.2  "Explain that the Product Owner is one accountable person" is declared
--        1_remember. Its skills line says "APPLY the one-person rule to a scenario."
--        Declared at Remember, this is tested as recall of a fact - when the actual
--        competence is recognising a committee-PO or proxy-PO in a described situation
--        and applying the rule to it. UNDER-DECLARED BY TWO LEVELS.
--
--   2.1  "DESCRIBE the Scrum framework and what a product is" is declared 1_remember.
--        "Describe" is Understand, and its skills say "Define a product's BOUNDARY" -
--        drawing a boundary requires grasping what makes something one product rather
--        than two. Not recall. -> 2_understand.
--
-- DEFECT 3 - A MISSING DIAGNOSTIC COMPETENCE, IN THE MOST IMPORTANT DOMAIN
--
--   After the demotions, D5 (Product Vision, Value, Roadmap & Strategy - 27.5% of the
--   exam, the largest single domain after D4) has ZERO Analyze tasks. Yet the Product
--   Owner's hardest and most valuable act lives precisely there:
--
--       "We shipped forty features. Usage is flat. Revenue is flat. WHY?"
--
--   The candidate must distinguish: wrong problem, from right problem / wrong solution,
--   from right solution / poorly adopted. Three different diagnoses, three completely
--   different remedies, and choosing the wrong one wastes a quarter.
--
--   This is NOT task 4.12. That task catches a PO who BEHAVES like an order-taker -
--   a visible anti-pattern you can name. Here every output metric looks healthy. The
--   backlog is refined, the team is fast, the roadmap is current, features ship. And
--   value is not being created. There is no anti-pattern to match against; the
--   candidate must reason from symptoms nobody labelled to a cause nobody supplied.
--   That is Analyze in the strict sense.
--
--   One task. Added because the competence is real, frequent and high-criticality -
--   and because a Product Owner credential whose largest strategic domain contains no
--   diagnostic competence is not certifying the job.
-- ============================================================================

do $$
declare
  v_cert uuid := '33333333-3333-3333-3333-333333333333';
  v_d5   uuid;
  v_task uuid;
  n_analyze integer;
  n_link    integer;
begin
  select id into v_d5 from public.domains where certification_id = v_cert and code = 'D5';
  if v_d5 is null then raise exception 'SPO-AI-I domain D5 not found'; end if;

  -- =========================================================================
  -- DEFECT 1 - over-declared Analyze
  -- =========================================================================
  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Choose meaningful value metrics for a given product." Selecting from the taught Evidence-Based Management dimensions (current value, unrealized value, ability to innovate, time to market) is applying a framework. Analyze would be diagnosing WHY a product with healthy output metrics is not delivering value - which is the new task 5.12.'
  where certification_id = v_cert and code = '5.4';

  update public.tasks set
    bloom_level = '2_understand',
    skills = 'Explain why value discrimination becomes the scarce skill when building becomes cheap.',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 2_understand. This task declared THREE cognitive levels at once: its statement said "Explain" (Understand), its skills said "MAKE THE CASE for investing in vision over raw throughput" (arguing a position against alternatives = 5_evaluate, which MCQ cannot validly assess), and it was declared 4_analyze - agreeing with neither. The MCQ-assessable competence is understanding WHY vision matters more when output is cheap. Making the case remains a real competence and is a simulation candidate; it is not certified by this exam.'
  where certification_id = v_cert and code = '5.11';

  -- =========================================================================
  -- DEFECT 2 - under-declared (the exam has been testing these too easily)
  -- =========================================================================
  update public.tasks set
    bloom_level = '3_apply',
    statement   = 'Apply the one-Product-Owner rule: a single accountable person, not a committee or a proxy',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 1_remember -> 3_apply. UNDER-DECLARED BY TWO LEVELS. Statement said "Explain that the PO is one accountable person" while its skills say "APPLY the one-person rule to a scenario". Declared at Remember, the exam tested recall of a fact - when the actual competence is spotting a committee-PO or proxy-PO in a described situation and applying the rule. Construct under-representation: the credential attested a competence it never measured.'
  where certification_id = v_cert and code = '3.2';

  update public.tasks set
    bloom_level = '2_understand',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 1_remember -> 2_understand. "Describe" is an Understand verb, and its skills say "Define a product''s BOUNDARY" - drawing a product boundary requires grasping what makes something one product rather than two. That is not recall.'
  where certification_id = v_cert and code = '2.1';

  -- =========================================================================
  -- DEFECT 3 - the missing diagnostic competence in D5
  -- =========================================================================
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_cert, v_d5, '5.12',
     'Diagnose why a product that is shipping steadily is still not creating value',
     'high', 'weekly', '4_analyze',
     true, false,
     'Output is not outcome. A product can ship on cadence, refine its backlog, keep its roadmap current and satisfy its Definition of Done, and still create no value - and every output metric will look healthy while it happens. The symptoms are quiet: features ship and usage does not move; customers adopt and do not return; the team is fast and the business result is flat. AI makes this failure CHEAPER TO COMMIT and therefore more common: when building is fast, building the wrong thing is fast too. The three causes look alike from the outside and demand different remedies - the wrong PROBLEM was solved (go back to discovery); the right problem was solved with the wrong SOLUTION (re-approach the design); or the right solution was built and poorly ADOPTED (fix onboarding, positioning, access).',
     'Reason from ambiguous outcome data to the underlying cause: distinguish solving the wrong problem from solving the right problem badly from building the right thing nobody could adopt. Each has a different remedy, and prescribing the wrong one wastes a quarter.',
     'The discipline to ask "did this create value?" when every output metric says yes, and to keep asking until the real cause surfaces.',
     12,
     'v2.0: NEW. Declared because the competence was genuinely absent, not to raise a percentage. After reconciliation, D5 - the largest strategic domain at 27.5% - had ZERO Analyze tasks, despite containing the Product Owner''s hardest act. Distinct from 4.12 (feature-waiter anti-pattern), which catches a PO who VISIBLY behaves like an order-taker; here everything looks healthy and the candidate must find a cause nobody supplied.')
  returning id into v_task;

  insert into public.task_concepts (task_id, concept_id)
  select v_task, c.id
  from public.concepts c
  where c.certification_id = v_cert
    and c.slug in (
      'outcome-vs-output-metrics',          -- the distinction the whole task turns on
      'evidence-based-management',          -- the lens for reading flat value
      'value-metrics',                      -- what to look at when output looks fine
      'ai-amplified-feature-factory',       -- why AI makes this failure cheaper to commit
      'maximizing-value'                    -- the accountability being failed
    )
  on conflict do nothing;
  get diagnostics n_link = row_count;

  select count(*) into n_analyze
  from public.tasks
  where certification_id = v_cert and is_exam_scope and bloom_level::text = '4_analyze';

  raise notice 'SPO-AI-I: task 5.12 created with % concept link(s).', n_link;
  raise notice 'SPO-AI-I 4_analyze exam-scope tasks: % (was 5)', n_analyze;
  if n_analyze <> 4 then
    raise warning 'Expected 4 (2.8, 3.4, 4.12, 5.12). Got %.', n_analyze;
  end if;
end $$;

-- ============================================================================
-- The recomputed profile.
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
where t.certification_id = '33333333-3333-3333-3333-333333333333'
  and t.is_exam_scope
group by t.bloom_level
order by t.bloom_level;

-- The four Analyze tasks. Each must diagnose.
select t.code, left(t.statement, 60) as statement, left(t.skills, 50) as skills
from public.tasks t
where t.certification_id = '33333333-3333-3333-3333-333333333333'
  and t.is_exam_scope and t.bloom_level::text = '4_analyze'
order by t.code;

-- Coverage integrity. Expect 0 rows.
select c.slug as orphaned_concept
from public.concepts c
left join public.task_concepts tc on tc.concept_id = c.id
where c.certification_id = '33333333-3333-3333-3333-333333333333'
  and tc.concept_id is null;
