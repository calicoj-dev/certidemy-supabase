-- 128_task_statement_reconciliation.sql
--
-- Correct 16 task statements whose opening verb contradicted the task's own
-- skills line and declared bloom_level. No cognitive level changes. No item
-- regeneration. No blueprint recompute.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent (each UPDATE is guarded on the text being replaced).
--
-- ===========================================================================
-- 1. WHAT THE EVIDENCE ACTUALLY SHOWED
-- ===========================================================================
-- These 16 tasks were first analysed in BLOOM-VERB-RECONCILIATION.md, which
-- compared the STATEMENT verb against bloom_level and concluded that 5 tasks
-- needed their level changed and 11 needed rewriting.
--
-- THAT ANALYSIS WAS WRONG, because it read only the statement. A task's
-- competence is its whole definition - statement plus knowledge, skills and
-- abilities. Migration 094 had already established this, using the skills line
-- as the tiebreaker:
--
--     "Statement said 'Explain that the PO is one accountable person' while its
--      SKILLS say 'APPLY the one-person rule to a scenario'."
--
-- Reading all 16 against their K/S/A reverses five earlier calls and simplifies
-- the rest. In every case the skills line agrees with the stored bloom_level,
-- and the statement is the outlier:
--
--     3.10  bloom 2_understand | skills "Explain how two instruments combine"
--           | statement said "Analyze"        -> statement wrong
--     3.7   bloom 3_apply      | skills "Match a companion standard to its purpose"
--           | statement said "Recognize"      -> statement wrong
--
-- The item banks confirm it independently. Sampled English secure items:
--     3.10  "Which statement accurately describes how the NIST AI RMF and the
--            EU AI Act relate?"            - comprehension, as stamped
--     3.7   "Which companion standard provides AI-specific risk management
--            guidance?"                    - matching, as stamped
--     2.5   "Which statement best describes the primary purpose of the Sprint
--            Review?"                      - comprehension, as stamped
--     4.2   "Which prompt change is most likely to..."  - selection, as stamped
--
-- The generator reads statement + skills + concepts and lets the SKILLS govern,
-- so the existing items already test the correct competence. Only the published
-- statement was wrong.
--
-- CONSEQUENCE: bloom_level is correct everywhere. exam_blueprint and
-- v_cognitive_profile are unaffected (the profile derives from bloom_level and
-- domain weight, neither of which changes). Invariant 17 continues to hold. No
-- item is invalidated, so nothing is retired and nothing is regenerated.
--
-- ===========================================================================
-- 2. THE SECOND FINDING: SIX ATTESTED-BUT-UNMEASURED COMPETENCES
-- ===========================================================================
-- Six tasks have a SKILLS line that also names a performance an MCQ cannot
-- reach:
--
--     SPO-AI-I 4.3  "Write a well-formed story and split an epic"
--     SPO-AI-I 4.5  "Write clear, testable acceptance criteria"
--     SPO-AI-I 5.1  "Craft and articulate a compelling vision"
--     SPO-AI-I 5.6  "Construct an outcome-based roadmap"
--     SD-AI-I  4.2  "Construct a prompt/context that makes correct output likely"
--     SD-AI-I  2.5  "Demonstrate working software and absorb feedback"
--
-- The exam tests a legitimate proxy - recognising a well-formed story rather
-- than authoring one. The proxy is sound; MCQ cannot assess authoring. But a
-- statement claiming "Write high-quality user stories" while the exam only
-- tests recognition is construct under-representation in migration 094's own
-- words: "the credential attested a competence it never measured."
--
-- ISO/IEC 17024 requires the scheme to assess what it claims; it does not
-- prescribe the remedy. The remedy chosen here is to state the claim honestly
-- rather than quietly drop the authoring half:
--
--   a) the statement narrows to the competence the exam actually measures, and
--   b) is_simulation_candidate is set true, parking the authoring half
--      explicitly for future simulation assessment.
--
-- This follows established practice: is_simulation_candidate is already true on
-- 8 SM-AI-I tasks, 6 SPO-AI-I tasks and 4 SD-AI-I tasks. It does not affect
-- v_cognitive_profile (which keys on is_exam_scope) or item generation.
--
-- The SKILLS lines are deliberately left unchanged. They describe the full job
-- competence identified by the JTA, which is the correct content for a job-task
-- analysis; the statement is what the credential attests, and that is what
-- narrows.
--
-- ===========================================================================
-- 3. TRANSLATIONS
-- ===========================================================================
-- All 16 English statements change, so their 32 es-419 / pt-BR rows now
-- translate superseded text. Section 5 marks them provisional again. They must
-- be re-translated through certidemy-web/scripts/load-jta-i18n.mjs and put
-- through a short review cycle against the fifteen locked terminology
-- principles before being re-approved.
--
-- SPO-AI-I is a stub pack block and will need its flag migration; SD-AI-I and
-- AIGRM-I are full blocks and approve directly. See HANDOFF-v2.9 section 3.
--
-- ---------------------------------------------------------------------------
-- BEFORE: 16 rows, statements as originally written.
--
-- select c.code, t.code, t.bloom_level::text, t.statement, t.skills
--   from public.tasks t join public.certifications c on c.id = t.certification_id
--  where (c.code='AIGRM-I'  and t.code in ('3.10','5.8','3.7'))
--     or (c.code='SPO-AI-I' and t.code in ('2.7','3.6','4.3','4.5','5.1','5.6'))
--     or (c.code='SD-AI-I'  and t.code in ('4.2','4.3','4.5','2.5','4.9','5.2','5.3'))
--  order by c.code, t.code;
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- 4. STATEMENT CORRECTIONS
-- ===========================================================================

-- --- AIGRM-I -------------------------------------------------------------
-- 3.10 | 2_understand | skills: "Explain how two instruments combine to strengthen governance."
update public.tasks set statement = 'Explain how the frameworks reinforce one another.'
 where certification_id = (select id from public.certifications where code='AIGRM-I')
   and code = '3.10' and statement like 'Analyze%';

-- 5.8 | 2_understand | skills: "Explain how the pieces combine to keep AI trustworthy over time."
update public.tasks set statement = 'Explain how ethics, policy, and the governance function combine to sustain trustworthy AI over time.'
 where certification_id = (select id from public.certifications where code='AIGRM-I')
   and code = '5.8' and statement like 'Analyze%';

-- 3.7 | 3_apply | skills: "Match a companion standard to its purpose."
update public.tasks set statement = 'Match each companion ISO/IEC AI standard to the purpose it serves.'
 where certification_id = (select id from public.certifications where code='AIGRM-I')
   and code = '3.7' and statement like 'Recognize%';


-- --- SPO-AI-I ------------------------------------------------------------
-- 2.7 | 3_apply | skills: "Apply the DoD to an Increment partly built by an agent."
update public.tasks set statement = 'Apply the Definition of Done to an Increment partly built by an AI agent'
 where certification_id = (select id from public.certifications where code='SPO-AI-I')
   and code = '2.7' and statement like 'Explain%';

-- 3.6 | 3_apply | skills: "Retain decision authority while incorporating AI inputs."
update public.tasks set statement = 'Determine which value decisions the Product Owner retains when incorporating AI inputs'
 where certification_id = (select id from public.certifications where code='SPO-AI-I')
   and code = '3.6' and statement like 'Explain%';

-- 4.3 | 3_apply | skills names authoring -> narrowed + simulation candidate
update public.tasks set statement = 'Select a well-formed user story, and an epic split that preserves value'
 where certification_id = (select id from public.certifications where code='SPO-AI-I')
   and code = '4.3' and statement like 'Write%';

-- 4.5 | 3_apply | skills names authoring -> narrowed + simulation candidate
update public.tasks set statement = 'Select acceptance criteria that are clear and testable for a described Product Backlog item'
 where certification_id = (select id from public.certifications where code='SPO-AI-I')
   and code = '4.5' and statement like 'Write%';

-- 5.1 | 3_apply | skills names authoring -> narrowed + simulation candidate
update public.tasks set statement = 'Select a product vision that fits a described context, and distinguish it from a goal or a feature list'
 where certification_id = (select id from public.certifications where code='SPO-AI-I')
   and code = '5.1' and statement like 'Create%';

-- 5.6 | 3_apply | skills names authoring -> narrowed + simulation candidate
update public.tasks set statement = 'Determine an outcome-based roadmap structure for a described product context'
 where certification_id = (select id from public.certifications where code='SPO-AI-I')
   and code = '5.6' and statement like 'Build%';


-- --- SD-AI-I -------------------------------------------------------------
-- 2.5 | 2_understand | skills names performance -> narrowed + simulation candidate
update public.tasks set statement = 'Explain the Developers'' part in the Sprint Review: showing a Done Increment and absorbing feedback'
 where certification_id = (select id from public.certifications where code='SD-AI-I')
   and code = '2.5' and statement like 'Present%';

-- 4.2 | 3_apply | skills names authoring -> narrowed + simulation candidate
update public.tasks set statement = 'Select the implementation prompt and context most likely to produce correct, verifiable output'
 where certification_id = (select id from public.certifications where code='SD-AI-I')
   and code = '4.2' and statement like 'Write%';

-- 4.3 | 4_analyze | skills: "Find the subtle defect in plausible-looking generated code."
update public.tasks set statement = 'Analyze plausible-looking AI-generated code to find the subtle defect'
 where certification_id = (select id from public.certifications where code='SD-AI-I')
   and code = '4.3' and statement like 'Apply%';

-- 4.5 | 4_analyze | skills: "Add the cases the AI missed; verify tests actually fail."
update public.tasks set statement = 'Analyze AI-generated tests to identify the cases they miss'
 where certification_id = (select id from public.certifications where code='SD-AI-I')
   and code = '4.5' and statement like 'Use AI%';

-- 4.9 | 2_understand | skills: "Flag and handle code of uncertain provenance."
update public.tasks set statement = 'Explain provenance, attribution, and licensing obligations for AI-assisted work'
 where certification_id = (select id from public.certifications where code='SD-AI-I')
   and code = '4.9' and statement like 'Maintain%';

-- 5.2 | 3_apply | skills: "Translate technical constraints into terms the PO can decide on."
update public.tasks set statement = 'Determine how to clarify criteria, surface constraints, and negotiate scope with the Product Owner'
 where certification_id = (select id from public.certifications where code='SD-AI-I')
   and code = '5.2' and statement like 'Work with%';

-- 5.3 | 2_understand | skills: "Raise an impediment clearly and early."
update public.tasks set statement = 'Explain how Developers work with the Scrum Master: surfacing impediments early and engaging in improvement'
 where certification_id = (select id from public.certifications where code='SD-AI-I')
   and code = '5.3' and statement like 'Work with%';


-- ===========================================================================
-- 5. SIMULATION CANDIDATES + TRANSLATION INVALIDATION
-- ===========================================================================

update public.tasks t set is_simulation_candidate = true
  from public.certifications c
 where c.id = t.certification_id
   and ((c.code = 'SPO-AI-I' and t.code in ('4.3','4.5','5.1','5.6'))
     or (c.code = 'SD-AI-I'  and t.code in ('4.2','2.5')))
   and t.is_simulation_candidate = false;

-- The English changed; the translations now render superseded text.
update public.task_translations tt set is_provisional = true
  from public.tasks t, public.certifications c
 where t.id = tt.task_id and c.id = t.certification_id
   and ((c.code='AIGRM-I'  and t.code in ('3.10','5.8','3.7'))
     or (c.code='SPO-AI-I' and t.code in ('2.7','3.6','4.3','4.5','5.1','5.6'))
     or (c.code='SD-AI-I'  and t.code in ('4.2','4.3','4.5','2.5','4.9','5.2','5.3')));


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) all 16 corrected; no statement should still open with the old verb
-- select c.code, t.code, t.bloom_level::text as bloom, t.is_simulation_candidate as sim,
--        left(t.statement, 80) as statement
--   from public.tasks t join public.certifications c on c.id = t.certification_id
--  where (c.code='AIGRM-I'  and t.code in ('3.10','5.8','3.7'))
--     or (c.code='SPO-AI-I' and t.code in ('2.7','3.6','4.3','4.5','5.1','5.6'))
--     or (c.code='SD-AI-I'  and t.code in ('4.2','4.3','4.5','2.5','4.9','5.2','5.3'))
--  order by c.code, t.code;
--
-- (b) 32 translation rows now provisional; every other cert still fully approved
-- select c.code, count(*) filter (where tt.is_provisional) as provisional, count(*) as rows
--   from public.task_translations tt
--   join public.tasks t on t.id = tt.task_id
--   join public.certifications c on c.id = t.certification_id
--  group by c.code order by c.code;
--
-- (c) INVARIANT 17: stored blueprint must still equal the live computation.
--     Nothing here changed bloom_level, so every cert must report MATCH.
-- select c.code,
--        case when c.exam_blueprint -> 'cognitive_profile' =
--                  (select jsonb_object_agg(p.bloom_level, p.pct_of_form)
--                     from public.v_cognitive_profile p where p.certification_id = c.id)
--             then 'MATCH' else '*** DIVERGED ***' end as verdict
--   from public.certifications c where c.exam_blueprint is not null order by c.code;
--
-- (d) no item drift: every live item still matches its task's level
-- select count(*) as bloom_drift
--   from public.quiz_questions q join public.tasks t on t.id = q.task_id
--  where q.retired_at is null and q.bloom_level is distinct from t.bloom_level;
-- ---------------------------------------------------------------------------
