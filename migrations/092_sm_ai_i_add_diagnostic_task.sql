-- ============================================================================
-- 092_sm_ai_i_add_diagnostic_task.sql
--
-- SM-AI-I: DECLARE THE COMPETENCE THE JTA WAS MISSING.
--
-- After migration 091 reconciled SM-AI-I's over-declared Analyze tasks (11 -> 5),
-- external review (Grok) challenged the resulting 10.1% Analyze weight as too thin for
-- a Scrum Master credential.
--
-- WE REJECT THE FRAMING AND ACCEPT THE SUBSTANCE.
--
-- The reviewer's remedy was "target 15-18% Analyze." That is a PERCENTAGE TARGET
-- ASSERTED OVER THE TASKS - precisely the defect this entire revision exists to cure.
-- The inherited "Bloom's Taxonomy distribution (MCQ target)" tables were percentage
-- targets, and reverse-engineering task levels to satisfy one is the same error wearing
-- a better argument. Under the cognitive model, you do not adjust the profile. You fix
-- the tasks, and the profile lands where the tasks put it.
--
-- But strip the number away and the reviewer is RIGHT that something is missing. The
-- correct question is not "is 10% enough?" - it is "are there genuine diagnostic
-- competences this job-task analysis never declared?"
--
-- There is one, and it is the central one:
--
--     A TEAM RUNS EVERY EVENT CORRECTLY, FILLS EVERY ARTIFACT, AND STILL DOES NOT
--     IMPROVE.
--
-- That is THE Scrum Master problem. It is the difference between a Scrum Master and a
-- meeting scheduler. And it was nowhere in this JTA.
--
-- WHY IT IS NOT ALREADY COVERED BY TASK 3.10.
-- Task 3.10 (event anti-patterns) catches events that are VISIBLY broken - its
-- knowledge line names "Daily Scrum as status to manager; Review as one-way demo; Retro
-- as blame session; Planning that skips Why." Each is a wrong shape you can see.
--
-- This task is the harder case: EVERY EVENT LOOKS CORRECT. The Daily happens. The Retro
-- is civil and well-attended. The board is current. And adaptation still is not
-- happening. The candidate must reason from thin, ambiguous symptoms - flat velocity,
-- retrospective actions that are agreed and never done, the same impediment recurring
-- for four Sprints, no experiment ever actually run - to a cause NOBODY SUPPLIED. There
-- is no anti-pattern to match against. That is Analyze in the strict sense the cognitive
-- model defines: decomposing a situation to find a cause that was not handed to you.
--
-- It goes in D4 (Artifacts & Transparency, 17.5%), which currently has ZERO Analyze
-- tasks - a domain about whether the truth is visible, with no task requiring the
-- candidate to work out that it is not.
--
-- ONE TASK. NOT THREE. Adding filler tasks to reach a percentage would be the same sin
-- in a new costume. This one is added because the competence is real, frequent, and
-- high-criticality - not because the number was low.
--
-- Resulting Analyze weight: ~10.1% -> ~11.6%. If that is where the tasks put it, that
-- is the honest figure, and we publish it.
-- ============================================================================

do $$
declare
  v_cert uuid := '11111111-1111-1111-1111-111111111111';
  v_d4   uuid;
  v_task uuid;
  n_link integer;
begin
  select id into v_d4 from public.domains where certification_id = v_cert and code = 'D4';
  if v_d4 is null then raise exception 'SM-AI-I domain D4 not found'; end if;

  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_cert, v_d4, '4.14',
     'Diagnose why a team that runs the events correctly is still not adapting',
     'high', 'per_sprint', '4_analyze',
     true, false,
     'Empiricism requires that inspection actually LEAD TO adaptation. A team can hold every event, keep every artifact current, and still be stagnant - because inspection is happening without consequence. The symptoms are quiet rather than dramatic: retrospective actions agreed and never done; the same impediment surfacing for several Sprints; a Sprint Goal missed repeatedly for reasons never examined; no experiment ever actually run; artifacts current but nobody acting on what they reveal. The failure is in the ADAPT half of inspect-and-adapt, and it is invisible to anyone auditing the ceremonies.',
     'Reason from ambiguous symptoms to the underlying cause: distinguish a team that cannot see its problems (a transparency failure) from a team that sees them and does not act (an adaptation failure) from a team that acts and is blocked (an impediment). Each has a different remedy, and prescribing the wrong one wastes Sprints.',
     'The judgment to look past correct ceremony to absent outcome, and to say so.',
     14,
     'v2.0: NEW. Declared because the competence was genuinely absent from the JTA, not to raise a percentage. Distinct from 3.10 (event anti-patterns), which catches events that are VISIBLY broken; this task addresses the case where every event looks correct and adaptation still is not happening - the candidate must find a cause nobody supplied. Placed in D4, which had zero Analyze tasks despite being the domain about whether the truth is visible.')
  returning id into v_task;

  -- Link to EXISTING concepts. No new concepts, no new lessons, no coverage gap.
  insert into public.task_concepts (task_id, concept_id)
  select v_task, c.id
  from public.concepts c
  where c.certification_id = v_cert
    and c.slug in (
      'adaptation',                    -- the half of empiricism that is failing
      'inspection',                    -- happening, but without consequence
      'empirical-process',             -- the loop that is broken
      'retrospective-actions',         -- agreed and never done: the loudest quiet symptom
      'coaching-restore-empiricism'    -- the remedy the candidate must prescribe
    )
  on conflict do nothing;

  get diagnostics n_link = row_count;
  raise notice 'SM-AI-I task 4.14 created, % concept link(s).', n_link;
  if n_link < 4 then
    raise warning 'Expected 5 concept links. Got %. Check the concept slugs exist.', n_link;
  end if;
end $$;

-- ============================================================================
-- The recomputed profile. Not a target - what the tasks now say.
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
where t.certification_id = '11111111-1111-1111-1111-111111111111'
  and t.is_exam_scope
group by t.bloom_level
order by t.bloom_level;

-- Every Analyze task must genuinely diagnose or trace. Six now.
select t.code, left(t.statement, 66) as statement, left(t.skills, 46) as skills
from public.tasks t
where t.certification_id = '11111111-1111-1111-1111-111111111111'
  and t.is_exam_scope and t.bloom_level::text = '4_analyze'
order by t.code;

-- Coverage integrity. Expect 0 rows.
select c.slug as orphaned_concept
from public.concepts c
left join public.task_concepts tc on tc.concept_id = c.id
where c.certification_id = '11111111-1111-1111-1111-111111111111'
  and tc.concept_id is null;
