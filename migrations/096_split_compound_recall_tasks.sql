-- ============================================================================
-- 096_split_compound_recall_tasks.sql
--
-- A CONSISTENCY DEFECT IN MY OWN ADJUDICATION. Recorded plainly, because the whole
-- point of this exercise is that unchecked judgment drifts.
--
-- Laying the five reconciled profiles side by side exposed it immediately:
--
--     cert      remember  understand  apply   analyze
--     AIE-I       16.2%      51.4%    32.4%     0%
--     SM-AI-I     15.7%      30.5%    42.4%    11.5%
--     AIGRM-I      0%        67.3%    26.4%     6.3%
--     SPO-AI-I     0%        38.0%    53.2%     8.8%
--     SD-AI-I      0%        18.9%    72.2%     9.0%
--
-- Three certifications with ZERO recall competence. That is not what those job-task
-- analyses say - it is what I did to them.
--
-- THE INCONSISTENCY. Every one of the five JTAs contained COMPOUND tasks of the form
-- "DEFINE X ... and APPLY X" - a recall competence and an applied competence welded
-- into one declaration. The cognitive model is explicit about this: if a task wants to
-- be Remember for the definition and Apply for the judgment, IT IS TWO TASKS.
--
-- For AIE-I and SM-AI-I I split them:
--     AIE-I 1.1  "Define AI and distinguish it..."  -> 1.1 (Understand) + new 1.7 (Remember)
--     SM-AI-I 4.4 "Define the Increment and the DoD" -> 4.4 (Remember) + new 4.13 (Apply)
--
-- For SD-AI-I, SPO-AI-I and AIGRM-I I hit the identical shape and COLLAPSED THEM UPWARD
-- instead - promoting the whole task to Apply and silently discarding the recall half:
--     SD-AI-I 1.5   "DEFINE who the Developers are"        + "classify who is/isn't"  -> Apply
--     SPO-AI-I 3.2  "the PO is one accountable person"     + "apply the one-person rule" -> Apply
--     AIGRM-I 1.2   "DEFINE the core AI terms"             + "classify a system"      -> Apply
--     AIGRM-I 1.4   "IDENTIFY the value-chain actors"      + "assign the role"        -> Apply
--
-- Same shape. Different treatment. Four genuine recall competences deleted by
-- inconsistency rather than by argument.
--
-- AND THEY ARE GENUINE. Each of these four is precisely the fact candidates get wrong:
--
--   * "Developer" means ANYONE on the Scrum Team - testers, designers, writers - not
--     just programmers. It is the single most common misconception about the role, and
--     it is a definitional error, not a classification failure.
--   * The Product Owner is ONE PERSON, not a committee and not a proxy. Same: the
--     canonical PO misconception, and it is recall before it is judgment.
--   * You cannot read the EU AI Act without knowing what a foundation model and an
--     agentic system ARE. The Act's obligations attach to those terms.
--   * Provider / deployer / distributor / importer / affected person are LEGALLY
--     DEFINED ROLES. Recalling them correctly is a competence in its own right, before
--     any question of assigning one in a scenario.
--
-- Under the cognitive model, the ONLY legitimate way to test recall is to declare a
-- recall task. So: split, exactly as AIE-I and SM-AI-I were split. The applied task
-- keeps its Apply declaration; a new sibling carries the recall.
--
-- No new concepts. No new lessons. Each new task inherits its sibling's concepts - the
-- material is identical; only the competence being declared differs.
-- ============================================================================

do $$
declare
  v_sd    uuid := '44444444-4444-4444-4444-444444444444';
  v_spo   uuid := '33333333-3333-3333-3333-333333333333';
  v_aigrm uuid := '55555555-5555-5555-5555-555555555555';
  v_dom   uuid;
  v_new   uuid;
  v_src   uuid;
begin

  -- =========================================================================
  -- SD-AI-I 1.9 (new) - who the Developers ARE. The #1 misconception in the role.
  -- =========================================================================
  select domain_id, id into v_dom, v_src
  from public.tasks where certification_id = v_sd and code = '1.5';

  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_sd, v_dom, '1.9',
     'Recall who the Developers are under the 2020 Scrum Guide',
     'high', 'occasional', '1_remember',
     true, false,
     'A Developer is anyone on the Scrum Team doing the work of creating a usable Increment - testers, designers, analysts, writers, operations, not only programmers. The 2020 Guide removed "Development Team" as a separate sub-team; there is one Scrum Team with three accountabilities.',
     'State who counts as a Developer and who does not.',
     'Respect for the whole craft, not just the coding part of it.',
     9,
     'v2.0: NEW. Split from task 1.5, which welded "DEFINE who the Developers are" (recall) to "classify who is and isn''t a Developer in a scenario" (Apply). I originally collapsed that upward to Apply and discarded the recall half - inconsistent with how the identical shape was handled in AIE-I 1.1 and SM-AI-I 4.4, which were split. That "Developer means anyone on the team, not just programmers" is the single most common misconception about this role, and it is a definitional error before it is a classification failure.')
  returning id into v_new;

  insert into public.task_concepts (task_id, concept_id)
  select v_new, tc.concept_id from public.task_concepts tc where tc.task_id = v_src
  on conflict do nothing;

  -- =========================================================================
  -- SPO-AI-I 3.9 (new) - the PO is ONE PERSON. The canonical PO misconception.
  -- =========================================================================
  select domain_id, id into v_dom, v_src
  from public.tasks where certification_id = v_spo and code = '3.2';

  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_spo, v_dom, '3.9',
     'Recall that the Product Owner is one accountable person, not a committee',
     'high', 'occasional', '1_remember',
     true, false,
     'The Product Owner is ONE PERSON, not a committee. They may represent the desires of many stakeholders, and those wanting to change the Backlog must persuade the Product Owner - but the accountability is single and undivided. The organization must respect their decisions for them to succeed.',
     'State the one-person rule and what follows from it.',
     'Comfort with holding a single, visible accountability.',
     9,
     'v2.0: NEW. Split from task 3.2, which welded the definitional claim (recall) to "APPLY the one-person rule to a scenario" (Apply). I originally collapsed that to Apply and discarded the recall half, inconsistently with AIE-I and SM-AI-I. "The PO is one person, not a committee" is THE canonical misconception about this accountability, and a candidate must know it before they can spot a committee-PO in a scenario.')
  returning id into v_new;

  insert into public.task_concepts (task_id, concept_id)
  select v_new, tc.concept_id from public.task_concepts tc where tc.task_id = v_src
  on conflict do nothing;

  -- =========================================================================
  -- AIGRM-I 1.9 (new) - the core AI terms. You cannot read the Act without them.
  -- =========================================================================
  select domain_id, id into v_dom, v_src
  from public.tasks where certification_id = v_aigrm and code = '1.2';

  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_aigrm, v_dom, '1.9',
     'Recall the core AI terms: AI system, model, foundation/general-purpose model, generative AI, agentic AI',
     'high', 'weekly', '1_remember',
     true, false,
     'The definitions of AI system, model, foundation / general-purpose model, generative AI, and agentic AI - and which term names which thing. These are not vocabulary trivia: the EU AI Act''s obligations attach to these categories, so a term applied wrongly is an obligation missed.',
     'State what each term means and which is which.',
     'Precision with terminology that carries legal weight.',
     9,
     'v2.0: NEW. Split from task 1.2, which welded "DEFINE the core AI terms" (recall) to "CLASSIFY a described system by type" (Apply). Collapsed to Apply in the first pass, inconsistently with AIE-I and SM-AI-I. You cannot read the EU AI Act without knowing what a foundation model or an agentic system IS - the Act''s obligations attach to those terms, so the recall is a competence in its own right.')
  returning id into v_new;

  insert into public.task_concepts (task_id, concept_id)
  select v_new, tc.concept_id from public.task_concepts tc where tc.task_id = v_src
  on conflict do nothing;

  -- =========================================================================
  -- AIGRM-I 1.10 (new) - the value-chain actors. These are LEGALLY DEFINED roles.
  -- =========================================================================
  select domain_id, id into v_dom, v_src
  from public.tasks where certification_id = v_aigrm and code = '1.4';

  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_aigrm, v_dom, '1.10',
     'Recall the actors in the AI value chain: provider, deployer, distributor, importer, affected person',
     'high', 'weekly', '1_remember',
     true, false,
     'Provider (develops or places the system on the market), deployer (uses it under its own authority), distributor, importer, and affected person (whose rights or opportunities the output touches, whether or not they interacted with the system). These are legally defined roles, and each carries distinct obligations.',
     'Name each actor and state what defines it.',
     'Precision with roles that determine who is legally on the hook.',
     10,
     'v2.0: NEW. Split from task 1.4, which welded "IDENTIFY the actors" (recall) to "ASSIGN the right role to an actor in a scenario" (Apply). Collapsed to Apply in the first pass, inconsistently with AIE-I and SM-AI-I. These are LEGALLY DEFINED roles - recalling them correctly is a competence before any question of assigning one in a scenario, because the obligations follow the label.')
  returning id into v_new;

  insert into public.task_concepts (task_id, concept_id)
  select v_new, tc.concept_id from public.task_concepts tc where tc.task_id = v_src
  on conflict do nothing;

  raise notice 'Split 4 compound tasks. Every certification now declares recall where its JTA actually requires it.';
end $$;

-- ============================================================================
-- All five reconciled profiles. THIS is the set the exam blueprints are built from.
-- ============================================================================
select c.code,
       t.bloom_level,
       count(*) as tasks,
       round(sum(d.weight_pct / nullif(dt.n, 0)), 2) as pct_of_form
from public.tasks t
join public.domains d        on d.id = t.domain_id
join public.certifications c on c.id = t.certification_id
join (
  select domain_id, count(*) as n
  from public.tasks where is_exam_scope group by domain_id
) dt on dt.domain_id = t.domain_id
where t.is_exam_scope
group by c.code, t.bloom_level
order by c.code, t.bloom_level;

-- Integrity: every cert sums to 100, nothing above the MCQ ceiling, no orphaned concepts.
select c.code,
       count(*) as exam_tasks,
       round(sum(d.weight_pct / nullif(dt.n,0)), 2) as total_pct,
       count(*) filter (where t.bloom_level::text in ('5_evaluate','6_create')) as above_ceiling
from public.tasks t
join public.domains d        on d.id = t.domain_id
join public.certifications c on c.id = t.certification_id
join (select domain_id, count(*) as n from public.tasks where is_exam_scope group by domain_id) dt
  on dt.domain_id = t.domain_id
where t.is_exam_scope
group by c.code
order by c.code;

select c.code, count(*) as orphaned_concepts
from public.concepts cc
join public.certifications c on c.id = cc.certification_id
left join public.task_concepts tc on tc.concept_id = cc.id
where tc.concept_id is null
group by c.code;
