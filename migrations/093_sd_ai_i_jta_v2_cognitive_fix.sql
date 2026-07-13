-- ============================================================================
-- 093_sd_ai_i_jta_v2_cognitive_fix.sql
--
-- SD-AI-I JOB-TASK ANALYSIS REVISION (v2.0)
--
-- THE WORST OVER-DECLARATION IN THE CATALOG.
--
-- SD-AI-I declared 13 of 44 exam-scope tasks at 4_analyze - a 30.3% Analyze weight,
-- the highest of any Certidemy certification. Adjudicated task by task against the
-- KSAs, only FOUR genuinely reach Analyze.
--
-- THE DIAGNOSTIC, AND IT IS SHARP:
--
--   Analyze  = FIND SOMETHING NOBODY POINTED AT. The defect is hidden; you infer it
--              from evidence that does not announce itself.
--   Apply    = DECIDE AN ACTION USING A FRAMEWORK YOU WERE TAUGHT. The options are
--              known; the candidate selects among them.
--
-- Read the skills lines and the split is unambiguous.
--
-- THE FOUR THAT STAY - every one requires finding something concealed:
--   3.2  "DETECT undone work HIDING behind a demo"
--   3.10 "Evaluate WHETHER a test suite ACTUALLY constrains behavior"  (tests that
--        assert nothing look exactly like tests that do)
--   4.3  "FIND THE SUBTLE DEFECT in plausible-looking generated code"  (the defining
--        skill of the AI era: the code compiles, reads well, and is wrong)
--   4.5  "Add the cases THE AI MISSED"  (find the gap in a suite that looks complete)
--
-- THE NINE THAT COME DOWN - every one selects from taught material:
--   1.6  "CATEGORIZE a piece of work and CHOOSE an AI-use posture"
--   2.8  "DISTINGUISH legitimate coordination from command-and-control creep"
--   3.5  "NAME debt, make it visible, NEGOTIATE paydown"
--   4.4  "SEQUENCE a task as generate, verify, integrate"
--   4.6  "DEFINE where to let an agent run and where to gate it"
--   4.7  "ANTICIPATE the failure mode" - from a list its own knowledge line TEACHES
--        ("hallucinated APIs, insecure defaults, subtle logic errors, outdated patterns")
--   4.8  "MAKE a no-AI call" - from poor-fit contexts its knowledge line TEACHES
--   4.12 "READ the signals and PICK a concrete adjustment" - signals are taught
--   5.6  "DESIGN a personal practice" - DESIGN IS BLOOM 6 (CREATE). MCQ cannot assess
--        it at all. Rewritten to the assessable competence.
--
-- WHAT THIS MEANS. Every item written against those nine was drafted as a diagnostic
-- reasoning problem against a task that only requires applying a taught framework.
-- Measured: 24.7% of SD-AI-I's secure items already tested above their declared level -
-- and that was measured against declarations which were THEMSELVES inflated. The true
-- over-testing was worse than the number showed.
--
-- THE HONEST CONSEQUENCE: Analyze falls from 30.3% to roughly 9%. That is LOWER than
-- SM-AI-I's, which looks backwards for the more technical credential. We publish it
-- anyway, because it is what the tasks say. Most of "AI-augmented implementation" genuinely
-- IS applied workflow - gate the agent, verify before you merge, know when not to use it.
-- Only a few tasks ask the candidate to find what is wrong when everything looks right.
-- Adjusting the number upward to look more impressive is the exact defect this revision
-- exists to cure.
--
-- ALSO FIXED - UNDER-declaration (the other direction, and just as invalid):
--   3.7  "USE version-control discipline" / "STRUCTURE work into reviewable units" was
--        declared 2_understand. Both verbs are Apply. The exam has been testing this
--        competence too EASILY - construct under-representation.
--   1.5  "DEFINE who the Developers are" declared 2_understand, but its skills say
--        "correctly CLASSIFY who is and isn't a Developer in a scenario" - classification
--        against a taught definition is Apply. Statement and level corrected.
--   5.8  "NAVIGATE terminology drift" declared 2_understand with skills "TRANSLATE legacy
--        phrasing to canonical" - translation is Understand. Statement corrected; level
--        kept.
-- ============================================================================

do $$
declare
  v_cert uuid := '44444444-4444-4444-4444-444444444444';
  n_analyze integer;
begin

  -- =========================================================================
  -- OVER-DECLARED ANALYZE -> APPLY (eight tasks; 5.6 handled separately)
  -- =========================================================================

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Categorize a piece of work and choose an AI-use posture accordingly." Categorising against a taught complexity framework and selecting a posture is Apply. Analyze would require diagnosing WHY a piece of work resists AI assistance from evidence nobody supplied.'
  where certification_id = v_cert and code = '1.6';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Distinguish legitimate coordination from command-and-control creep." Applying the self-management boundary to a described situation.'
  where certification_id = v_cert and code = '2.8';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Name debt, make it visible, and negotiate paydown." Making known debt transparent is Apply. Analyze would be inferring the presence of debt nobody has named - which is task 3.2 (undone work hiding behind a demo).'
  where certification_id = v_cert and code = '3.5';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Sequence a task as generate, verify, integrate - not generate, merge." Following a taught loop in the right order is the definition of Apply. The statement itself says "Apply".'
  where certification_id = v_cert and code = '4.4';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Define where to let an agent run and where to gate it." Placing a human checkpoint at an accountable boundary applies a taught principle.'
  where certification_id = v_cert and code = '4.6';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Anticipate the failure mode for a given task and check for it." The failure modes are enumerated in this task''s OWN knowledge line (hallucinated APIs, insecure defaults, subtle logic errors, outdated patterns). Recalling a taught list and checking against it is Apply. Task 4.3 - FINDING the defect the list did not predict - is the Analyze counterpart.'
  where certification_id = v_cert and code = '4.7';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Make and defend a no-AI call." The poor-fit contexts are taught in its own knowledge line (novel design, security-critical paths, ambiguous requirements, skill-building). Matching a situation to a taught list is Apply.'
  where certification_id = v_cert and code = '4.8';

  update public.tasks set bloom_level = '3_apply',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 3_apply. Skills: "Read the signals and pick a concrete adjustment." The signals are enumerated in its own knowledge line (growing unreviewed PRs, rising rollbacks, integration backlog). Recognising taught signals and selecting a taught remedy is Apply.'
  where certification_id = v_cert and code = '4.12';

  -- =========================================================================
  -- 5.6 - "DESIGN a personal practice" is Bloom 6 (Create). Not MCQ-assessable.
  -- =========================================================================
  update public.tasks set
    bloom_level = '2_understand',
    statement   = 'Explain how over-reliance on AI erodes the fundamentals that make AI safe to use',
    skills      = 'Explain why deliberate practice and occasional AI-off work preserve the judgment that AI use depends on.',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 4_analyze -> 2_understand, statement rewritten. Skills read "DESIGN a personal practice that keeps core skills sharp" - designing is Bloom 6 (Create), which multiple choice cannot assess AT ALL. The MCQ-assessable competence is understanding WHY skill erosion undermines safe AI use. Designing the practice remains a real competence and is a candidate for simulation assessment; it is not certified by this exam, and that is now stated rather than silently assumed.'
  where certification_id = v_cert and code = '5.6';

  -- =========================================================================
  -- UNDER-DECLARED (the other direction - the exam tests these too easily)
  -- =========================================================================
  update public.tasks set
    bloom_level = '3_apply',
    statement   = 'Apply version-control discipline to structure work into reviewable units',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 2_understand -> 3_apply. Statement verb was "Use" and skills say "Structure work into reviewable units" - both are Apply. Declared at Understand, the exam was testing comprehension of a discipline the candidate must actually PRACTISE. Construct under-representation.'
  where certification_id = v_cert and code = '3.7';

  update public.tasks set
    bloom_level = '3_apply',
    statement   = 'Classify who is and is not a Developer under the 2020 Scrum Guide',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: 2_understand -> 3_apply. Statement said "Define" (recall) but skills say "Correctly CLASSIFY who is and isn''t a Developer in a scenario" - classification against a taught definition is Apply. Statement corrected to the competence the skills describe.'
  where certification_id = v_cert and code = '1.5';

  update public.tasks set
    statement = 'Translate legacy Scrum terminology to the 2020 Guide''s canonical terms',
    notes = coalesce(notes || ' | ', '') ||
      'v2.0: statement verb was "Navigate" (an Apply verb) while skills say "Translate legacy phrasing to canonical" and the level is 2_understand. Level kept; statement corrected to match.'
  where certification_id = v_cert and code = '5.8';

  -- =========================================================================
  -- Proof
  -- =========================================================================
  select count(*) into n_analyze
  from public.tasks
  where certification_id = v_cert and is_exam_scope and bloom_level::text = '4_analyze';

  raise notice 'SD-AI-I 4_analyze exam-scope tasks: % (was 13)', n_analyze;
  if n_analyze <> 4 then
    raise warning 'Expected 4 (3.2, 3.10, 4.3, 4.5). Got %.', n_analyze;
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
where t.certification_id = '44444444-4444-4444-4444-444444444444'
  and t.is_exam_scope
group by t.bloom_level
order by t.bloom_level;

-- The four survivors. Each must FIND something concealed.
select t.code, left(t.statement, 58) as statement, left(t.skills, 52) as skills
from public.tasks t
where t.certification_id = '44444444-4444-4444-4444-444444444444'
  and t.is_exam_scope and t.bloom_level::text = '4_analyze'
order by t.code;

-- Coverage integrity. Expect 0 rows.
select c.slug as orphaned_concept
from public.concepts c
left join public.task_concepts tc on tc.concept_id = c.id
where c.certification_id = '44444444-4444-4444-4444-444444444444'
  and tc.concept_id is null;
