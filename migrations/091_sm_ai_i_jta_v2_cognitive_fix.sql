-- ============================================================================
-- 091_sm_ai_i_jta_v2_cognitive_fix.sql
--
-- SM-AI-I JOB-TASK ANALYSIS REVISION (v2.0)
--
-- Adjudicated task by task against the STATEMENT and the KSAs - because the skills
-- line is the truth-teller. It says what the candidate must actually DO, and it
-- repeatedly contradicts both the statement's opening verb and the declared level.
--
-- THE SYSTEMATIC DEFECT: SM-AI-I OVER-DECLARES ANALYZE.
--
-- Six tasks are declared 4_analyze whose skills line says "categorize", "classify",
-- or "recognize". Classifying a situation against a framework you were taught is
-- APPLY. Analyze means breaking a situation down to find a cause nobody handed you.
--
-- The distinction is not academic. Every item written against those six tasks was
-- drafted to a harder cognitive standard than the competence requires - construct-
-- irrelevant variance, sourced directly from the foundational document. Candidates
-- were being failed on reasoning the JTA never asked them to perform.
--
-- Only four SM tasks genuinely reach Analyze, and each says so in its skills:
--   1.6  "trace consequences"                    - causal chains
--   2.7  "Diagnose the violation and prescribe"  - root cause + remedy
--   3.10 "Diagnose the anti-pattern and prescribe"
--   5.5  "Diagnose safety issues"
-- Those four stay. The rest come down to Apply.
--
-- Consequence: SM-AI-I's Analyze weight was inflated at 22.3%. The reconciled JTA
-- puts it where the tasks actually are.
--
-- ALSO FIXED
--   3.3  declared 2_understand, but the statement is "Identify the three topics of
--        Sprint Planning (Why, What, How)" - that is recall. Its skills line borrowed
--        a diagnosis ("Diagnose Sprint Plannings that skip Why") that properly belongs
--        to 3.10 (event anti-patterns). Re-declared 1_remember and the skills line
--        corrected to match the competence.
--   4.4  "Define the Increment and the Definition of Done" declared 3_apply, with
--        skills "Apply DoD to determine if work is done". Two competences at two
--        levels welded together. SPLIT: 4.4 keeps the recall (1_remember), new 4.13
--        carries the application (3_apply).
--   1.2, 3.6, 5.9  statement verbs contradicted their own (correct) declared level.
--        Statements sharpened; levels unchanged.
--
-- 5.11 (5_evaluate) was already removed from exam scope in an earlier fix - MCQ
-- cannot validly assess Evaluate. It remains a simulation candidate.
-- ============================================================================

do $$
declare
  v_cert uuid := '11111111-1111-1111-1111-111111111111';
  v_d4   uuid;
  v_t413 uuid;
  n_analyze integer;
begin
  select id into v_d4 from public.domains where certification_id = v_cert and code = 'D4';
  if v_d4 is null then raise exception 'SM-AI-I domain D4 not found'; end if;

  -- =========================================================================
  -- OVER-DECLARED ANALYZE -> APPLY (six tasks)
  -- Each skills line says categorize / classify / recognize / coach. That is
  -- applying a taught framework, not analysing an undiagnosed situation.
  -- =========================================================================

  update public.tasks set
    bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills line reads "Categorize a real problem accurately" - categorising against the complex/complicated framework is applying it, not analysing. Analyze would require diagnosing WHY a domain resists prediction from undiagnosed evidence.'
  where certification_id = v_cert and code = '1.4';

  update public.tasks set
    bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills line reads "Classify activities as safely delegable or necessarily retained" - classification against the accountability boundary is Apply.'
  where certification_id = v_cert and code = '2.11';

  update public.tasks set
    bloom_level = '3_apply',
    statement   = 'Select a Sprint Goal that is coherent and outcome-focused, and distinguish it from the Product Backlog items selected for the Sprint',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills line read "WRITE a Sprint Goal" - writing is Create (6), which MCQ cannot assess at all. The MCQ-assessable competence is SELECTING the coherent goal from plausible alternatives, which is Apply. Statement rewritten to the competence the exam can actually measure.'
  where certification_id = v_cert and code = '3.9';

  update public.tasks set
    bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills line reads "Coach a team out of we cant show stakeholders until its polished" - applying the transparency principle to a described situation.'
  where certification_id = v_cert and code = '4.7';

  update public.tasks set
    bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills line reads "Resist the urge to fix everything" - deciding whether a given blocker is an impediment or the team''s own work is applying the boundary, not analysing it.'
  where certification_id = v_cert and code = '5.2';

  update public.tasks set
    bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills line reads "Recognize these impediment patterns in a team''s behavior" - recognising taught patterns is Apply. Analyze would require tracing an undiagnosed flow problem to its AI-related cause.'
  where certification_id = v_cert and code = '5.10';

  -- =========================================================================
  -- 3.3 - a recall task mislabelled, with a borrowed skills line
  -- =========================================================================
  update public.tasks set
    bloom_level = '1_remember',
    statement   = 'Recall the three topics of Sprint Planning (Why, What, How)',
    skills      = 'Name the three topics and what each answers.',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 2_understand -> 1_remember. The statement is "Identify the three topics" - pure recall of a canonical list. Its skills line ("Diagnose Sprint Plannings that skip Why") described a DIFFERENT competence that properly belongs to 3.10 (event anti-patterns, 4_analyze); it was inflating this task''s apparent level. Skills corrected to the competence this task actually names.'
  where certification_id = v_cert and code = '3.3';

  -- =========================================================================
  -- 4.4 - compound: a definition (Remember) welded to its application (Apply)
  -- =========================================================================
  update public.tasks set
    bloom_level = '1_remember',
    statement   = 'Recall the Increment and the Definition of Done',
    skills      = 'State what an Increment is and what the Definition of Done is.',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 3_apply -> 1_remember, and SPLIT. Statement was "Define the Increment and the Definition of Done" (recall) while its skills said "Apply DoD to determine if work is done" (Apply) - two competences at two levels in one task. This task keeps the recall; the application moved to new task 4.13.'
  where certification_id = v_cert and code = '4.4';

  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_cert, v_d4, '4.13',
     'Apply the Definition of Done to determine whether work is releasable',
     'high', 'per_sprint', '3_apply',
     true, false,
     'The DoD as the shared, binding quality bar; that an Increment is only an Increment when it meets the DoD; that partial completion is not Done; that the DoD may tighten but not loosen mid-Sprint.',
     'Given a described piece of work and a DoD, determine whether it is Done - and identify what remains if it is not.',
     'Quality-bar discipline; refusing "done except for" as an answer.',
     13,
     'v2.0: new. The applied half of the former task 4.4, which welded a definition (Remember) to its application (Apply). Applying the DoD is the competence a Scrum Master exercises every Sprint, and it must be tested as Apply.')
  returning id into v_t413;

  -- The new task inherits 4.4's concepts: the DoD and Increment are the same material,
  -- exercised rather than recalled. No new concepts, no new lessons, no coverage gap.
  insert into public.task_concepts (task_id, concept_id)
  select v_t413, tc.concept_id
  from public.task_concepts tc
  join public.tasks t on t.id = tc.task_id
  where t.certification_id = v_cert and t.code = '4.4'
  on conflict do nothing;

  -- =========================================================================
  -- STATEMENT-VERB FIXES (level was already correct; the verb lied about it)
  -- =========================================================================
  update public.tasks set
    statement = 'Apply the three pillars of empirical process control (Transparency, Inspection, Adaptation) to diagnose which pillar is broken',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: statement verb was "Explain" while the skills said "Diagnose which pillar is broken in a described scenario" and the level was 3_apply. Level kept; statement corrected to the competence.'
  where certification_id = v_cert and code = '1.2';

  update public.tasks set
    statement = 'Facilitate the Sprint Retrospective with a focus on team process',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: statement verb was "Describe" while the skills said "Run formats (Liked/Learned/Lacked, Start/Stop/Continue, 4Ls, sailboat)" and the level was 3_apply. Level kept; statement corrected.'
  where certification_id = v_cert and code = '3.6';

  update public.tasks set
    statement = 'Recognize scaling anti-patterns at a foundational level',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: statement verb was "Apply" while the skills said "Recognize anti-patterns (two teams, two backlogs, same product)" and the level was 2_understand. Level kept; statement corrected. This is a Level I cert - it does not certify the ability to scale, only to recognise when scaling has gone wrong.'
  where certification_id = v_cert and code = '5.9';

  update public.tasks set
    statement = 'Translate between legacy training terminology and the 2020 Scrum Guide',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: statement verb was "Navigate" (an Apply verb) while the skills said "Translate between the two" and the level was 2_understand. Level kept; statement corrected.'
  where certification_id = v_cert and code = '5.7';

  -- =========================================================================
  -- Proof: only genuinely diagnostic tasks remain at Analyze
  -- =========================================================================
  select count(*) into n_analyze
  from public.tasks
  where certification_id = v_cert and is_exam_scope and bloom_level::text = '4_analyze';

  raise notice 'SM-AI-I 4_analyze exam-scope tasks: % (was 11)', n_analyze;
  if n_analyze <> 4 then
    raise warning 'Expected 4 Analyze tasks (1.6, 2.7, 3.10, 5.5). Got %. Review.', n_analyze;
  end if;
end $$;

-- ============================================================================
-- The recomputed profile. This is what SM-AI-I's JTA now says - not a choice.
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

-- The four tasks that genuinely reach Analyze. Each must diagnose, not classify.
select t.code, t.bloom_level, left(t.statement, 60) as statement, left(t.skills, 50) as skills
from public.tasks t
where t.certification_id = '11111111-1111-1111-1111-111111111111'
  and t.is_exam_scope and t.bloom_level::text = '4_analyze'
order by t.code;

-- Coverage integrity: no concept may be orphaned. Expect 0 rows.
select c.slug as orphaned_concept
from public.concepts c
left join public.task_concepts tc on tc.concept_id = c.id
where c.certification_id = '11111111-1111-1111-1111-111111111111'
  and tc.concept_id is null;
