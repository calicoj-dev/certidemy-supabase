-- ============================================================================
-- 090_aie_i_jta_v2_cognitive_fix.sql
--
-- AIE-I JOB-TASK ANALYSIS REVISION (v2.0)
--
-- Under the Certidemy Cognitive Model v2.0, an item's cognitive level EQUALS its
-- task's declared level. That makes the task declarations load-bearing in a way they
-- have never been, and it exposed three defects in AIE-I's task list.
--
-- DEFECT 1 - VERB / BLOOM DRIFT.
--   Task 1.5 reads "RECOGNIZE common AI use cases..." and is declared 2_understand.
--   "Recognize" is a recall verb. The task is Remember; only its label said otherwise.
--
--   Task 3.4 reads "FOLLOW organizational AI-use policies and basic ethical red
--   lines" and is declared 2_understand. "Follow" is an action verb - the competence
--   is deciding whether a given use is permitted, which is Apply. Declaring it at
--   Understand means the exam tests comprehension of a policy the candidate is
--   actually required to APPLY. That is construct under-representation written into
--   the foundational document, and no amount of generator fixing would have caught it:
--   the items would faithfully test the wrong level.
--
-- DEFECT 2 - A COMPOUND TASK.
--   Task 1.1 - "DEFINE artificial intelligence AND DISTINGUISH it from ordinary
--   software and automation" - is two competences at two cognitive levels welded
--   together. The cognitive model is explicit: if a task wants to be Remember for the
--   definition and Understand for the discrimination, it is two tasks. Split it.
--
-- DEFECT 3 - NO RECALL COMPETENCE AT ALL.
--   All 16 tasks used explain/distinguish/apply verbs, so the computed cognitive
--   profile came out 0% Remember / 70% Understand / 30% Apply.
--
--   We initially rationalized this as a feature ("certifying that someone can EXPLAIN
--   the difference beats certifying they memorized a definition"). That was motivated
--   reasoning. An AI-literate HR, marketing, finance or ops professional genuinely
--   must NAME THE TERMS COLD - to read a vendor proposal, to sit in a procurement
--   meeting, to not be sold a "foundation model" that is a lookup table. Recall of the
--   core vocabulary is a real job competence, and a literacy credential that never
--   tests it has under-represented its own construct.
--
--   Under the cognitive model, the ONLY legitimate way to get recall items is to
--   declare recall TASKS. So we declare them.
--
-- WHAT THIS MIGRATION DOES NOT NEED: new concepts, new lessons, new coverage. Every
-- concept these tasks reference already exists and is already taught. This is a
-- re-declaration of competence, not new content.
--
-- COMPUTED PROFILE, BEFORE AND AFTER (domain-weighted, exam-scope tasks):
--
--   before:  0.0% Remember | 70.0% Understand | 30.0% Apply     (16 tasks)
--   after : 16.2% Remember | 51.4% Understand | 32.4% Apply     (18 tasks)
--
-- The "after" is what an AI-literacy credential should look like: real vocabulary
-- recall, dominant comprehension, meaningful applied judgment.
-- ============================================================================

do $$
declare
  v_cert  uuid := '66666666-6666-6666-6666-666666666666';
  v_d1    uuid;
  v_d3    uuid;
  v_t17   uuid;
  v_t35   uuid;
  n       integer;
begin
  select id into v_d1 from public.domains where certification_id = v_cert and code = 'D1';
  select id into v_d3 from public.domains where certification_id = v_cert and code = 'D3';
  if v_d1 is null or v_d3 is null then
    raise exception 'AIE-I domains D1/D3 not found - wrong cert id?';
  end if;

  -- ---------------------------------------------------------------------
  -- DEFECT 1a: task 1.5 is a recall task wearing an Understand label.
  -- ---------------------------------------------------------------------
  update public.tasks
  set bloom_level = '1_remember',
      statement   = 'Recall common AI use cases across everyday workplace functions',
      notes       = coalesce(notes || ' | ', '') ||
                    'v2.0: re-declared 2_understand -> 1_remember. The verb was already "recognize"; the competence is recall of where AI shows up at work, not explanation of why.'
  where certification_id = v_cert and code = '1.5';

  -- ---------------------------------------------------------------------
  -- DEFECT 1b: task 3.4 is an Apply task wearing an Understand label.
  -- Re-scope it to the RECALL half (the red lines you must know cold), and add a
  -- new 3.5 for the APPLY half (deciding whether a given use is permitted).
  -- ---------------------------------------------------------------------
  update public.tasks
  set bloom_level = '1_remember',
      statement   = 'Recall the ethical red lines for workplace AI use and when disclosure is expected',
      notes       = coalesce(notes || ' | ', '') ||
                    'v2.0: split. This half is the recall of red lines and disclosure expectations (1_remember). The applied half - deciding whether a specific use is permitted - became task 3.5 (3_apply). Previously declared 2_understand while its verb was "follow", under-testing a competence candidates must actually act on.'
  where certification_id = v_cert and code = '3.4';

  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_cert, v_d3, '3.5',
     'Apply the organization''s AI-use policy to decide whether a specific use is permitted',
     'high', 'weekly', '3_apply',
     true, false,
     'What an acceptable-use policy covers: approved tools, permitted data, required disclosure, prohibited uses. That an absent policy does not mean permission.',
     'Read a described situation and decide whether the intended AI use is permitted, needs disclosure, or is barred.',
     'Willingness to stop and ask rather than assume permission.',
     5,
     'v2.0: new. The applied half of the former task 3.4, which was declared 2_understand while its verb was "follow". Following a policy is an action, and the exam must test the action.')
  returning id into v_t35;

  -- ---------------------------------------------------------------------
  -- DEFECT 2: task 1.1 is compound ("define AND distinguish"). Sharpen it to the
  -- discrimination (Understand); the definition half becomes the new 1.7 (Remember).
  -- ---------------------------------------------------------------------
  update public.tasks
  set statement = 'Distinguish artificial intelligence from ordinary software and automation',
      notes     = coalesce(notes || ' | ', '') ||
                  'v2.0: was "Define AI and distinguish it from...". Compound - two competences at two levels. The definitional half is now task 1.7 (1_remember); this task keeps the discrimination (2_understand).'
  where certification_id = v_cert and code = '1.1';

  -- ---------------------------------------------------------------------
  -- DEFECT 3: no recall competence anywhere. Declare it.
  -- ---------------------------------------------------------------------
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values
    (v_cert, v_d1, '1.7',
     'Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent',
     'high', 'weekly', '1_remember',
     true, false,
     'The definitions of the core terms, and which term names which thing. That "AI" is the umbrella, machine learning a way of building it, generative AI a kind of machine learning, an LLM a kind of generative model, a foundation model a general-purpose base, and an agent a system that acts.',
     'Name the right term for a described system; recognize the term when a vendor or colleague uses it.',
     'Comfort with the vocabulary - enough to read a proposal, sit in a procurement meeting, and not be sold something by its label.',
     7,
     'v2.0: new. AIE-I previously had zero tasks declared at 1_remember, so its exam could not test recall of the vocabulary at all - construct under-representation for a literacy credential whose audience must be able to name the terms cold.')
  returning id into v_t17;

  -- ---------------------------------------------------------------------
  -- Wire the new tasks to EXISTING concepts. No new concepts, no new lessons.
  -- ---------------------------------------------------------------------
  insert into public.task_concepts (task_id, concept_id)
  select v_t17, c.id
  from public.concepts c
  where c.certification_id = v_cert
    and c.slug in ('what-is-ai','machine-learning','generative-ai',
                   'large-language-model','foundation-model','ai-agent')
  on conflict do nothing;

  insert into public.task_concepts (task_id, concept_id)
  select v_t35, c.id
  from public.concepts c
  where c.certification_id = v_cert
    and c.slug in ('acceptable-use-policy','disclosure-and-transparency')
  on conflict do nothing;

  -- ---------------------------------------------------------------------
  -- Proof
  -- ---------------------------------------------------------------------
  select count(*) into n from public.tasks where certification_id = v_cert and is_exam_scope;
  raise notice 'AIE-I exam-scope tasks: % (was 16)', n;
end $$;

-- ============================================================================
-- The recomputed cognitive profile. This is not a choice - it is what the revised
-- JTA now says. exam_blueprint must be set from THIS, and invariant 17 will compare
-- the two on every run.
-- ============================================================================
select t.bloom_level,
       count(*) as tasks,
       round(sum(d.weight_pct / nullif(dt.n, 0)), 2) as pct_of_form
from public.tasks t
join public.domains d        on d.id = t.domain_id
join (
  select domain_id, count(*) as n
  from public.tasks
  where is_exam_scope
  group by domain_id
) dt on dt.domain_id = t.domain_id
where t.certification_id = '66666666-6666-6666-6666-666666666666'
  and t.is_exam_scope
group by t.bloom_level
order by t.bloom_level;

-- Every concept must still be linked to at least one task (coverage integrity).
-- Expect: 0 rows.
select c.slug as orphaned_concept
from public.concepts c
left join public.task_concepts tc on tc.concept_id = c.id
where c.certification_id = '66666666-6666-6666-6666-666666666666'
  and tc.concept_id is null;
