-- 209_aims_ia_public_samples.sql
--
-- AIMS-IA public samples - six practice items promoted to visibility='public'.
--
-- WHAT THESE ARE. The sample questions the marketing page shows to a visitor who
-- has not bought anything. They are real items from the practice pool, not
-- purpose-written marketing copy, so a visitor sees what the product actually
-- contains. Six groups x 3 languages = 18 rows.
--
-- THE THREE VISIBILITY STATES, as ISMS-IA established them:
--   pool='practice', visibility='private'  the study pool
--   pool='practice', visibility='public'   the shop window (exactly 6/language)
--   pool='secure',   visibility='secure'   the exam bank, never public
--
-- verify-cert checks 6 per language across 6 DISTINCT tasks. Two picks in one
-- task was AIHR-I migration 149; that is the failure mode this guards against.
-- A separate check (samples.firewall) fails if any secure item carries a
-- visibility other than 'secure'.
--
-- SELECTION RATIONALE. Blueprint-weighted, one task per domain with two for D4
-- at its 30% weight. Other certs split their samples between traditional and
-- AI-era items so a visitor sees one of each. AIMS-IA has no traditional half -
-- the standard it audits was published in 2023, so every task is AI-era by
-- construction. The equivalent contrast here is METHOD against CRITERIA:
--
--   Recognisable to any experienced ISO auditor
--     1.3  ISO 19011 is method, not criteria - remove it from the finding
--     3.4  a procedure document describes design, not operation
--     5.4  a finding built on ISO 19011 guidance cannot stand
--
--   New even to an ISO/IEC 27001 lead auditor
--     2.4  one system licensed, fine-tuned and deployed = three roles at once
--     4.6  the impact assessment is a distinct artifact with a directional link
--     4.9  Annex B is normative AND written in should; it binds via 6.1.3 e)
--
-- That is the selling proposition made by the items themselves rather than by a
-- claim: half of this you already know, and the other half is why the
-- credential exists.
--
-- WHY GROUP IDS AND NOT ROW IDS. question_group_id spans en / es-419 / pt-BR,
-- so setting visibility on the group promotes all three languages in one
-- statement and cannot leave a language behind. Each group was confirmed to
-- hold exactly 3 rows before this migration was written.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

update public.quiz_questions
set visibility = 'public'
where question_group_id in (
  '4fa2717c-a9cd-466c-8cb2-eed1448e03b6',  -- 1.3  criteria vs method in a finding
  '5cf4e186-0b69-463e-a3e0-2158efef84a1',  -- 2.4  three roles on one AI system
  '05e88bf7-fd7d-49ef-93f4-ee3303a1a613',  -- 3.4  procedure document is not operation
  'a8625e46-312b-4113-949a-56fb3af3b544',  -- 4.6  merged risk/impact assessment document
  '85d5284c-c1b7-4930-95c9-21c049d308c4',  -- 4.9  Annex B binds via clause 6.1.3 e)
  '394fbd75-6094-4b8f-b92b-61db63377059'   -- 5.4  a finding on ISO 19011 cannot stand
);

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. Exactly 6 public items per language, across 6 distinct tasks.
--    This is the shape verify-cert checks.
select q.language, count(*) as public_items, count(distinct q.task_id) as distinct_tasks
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and q.visibility = 'public'
group by q.language
order by q.language;

-- 2. The six, by task and domain. Expect one row per task, domains 1-5 with
--    two entries in D4.
select d.order_index as domain, t.code, q.question_group_id,
       left(q.question_text, 70) as stem
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
join public.domains d on d.id = t.domain_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and q.visibility = 'public' and q.language = 'en'
order by d.order_index, t.code;

-- 3. FIREWALL. No secure item may carry a visibility other than 'secure'.
--    Expect zero rows.
select q.id, t.code, q.pool, q.visibility
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and q.pool = 'secure' and q.visibility <> 'secure';

-- 4. The practice pool is otherwise untouched. Expect 394 private + 6 public
--    per language.
select q.pool, q.visibility, q.language, count(*) as rows
from public.quiz_questions q
join public.tasks t on t.id = q.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
group by q.pool, q.visibility, q.language
order by q.pool, q.visibility, q.language;

-- 5. The whole-cert check.
--    Run: node scripts\verify-cert.mjs --cert AIMS-IA --strict
--    Expect: PASS  Section 12  Six public samples across six distinct tasks  6 / 6 / 6 items, 6 distinct task(s)
