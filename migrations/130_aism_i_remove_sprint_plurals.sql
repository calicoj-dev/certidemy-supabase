-- 130_aism_i_remove_sprint_plurals.sql
--
-- Remove the last Scrum references from two AISM-I distractors, all three
-- languages. Companion to migration 129.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-CLEAN. Accented replacements use SQL unicode escapes (U&'...' with
-- \00xx), never literal multibyte text.
--
-- Idempotent: every UPDATE is guarded on the text being replaced.
--
-- ===========================================================================
-- WHY 129 MISSED THESE
-- ===========================================================================
-- The word is "sprints", plural. The verifier's regex was:
--
--     /\b(sprint|scrum|...)\b/i
--
-- and \bsprint\b CANNOT match "sprints" - there is no word boundary between
-- "t" and "s". Six items sat behind that gap: task 1.2 and task 3.1, in all
-- three languages. The check reported "0 / 1098 en items" and passed.
--
-- Two further gaps in the same check, both fixed alongside this migration:
--
--   1. It filtered q.language === "en". Spanish and Portuguese items were never
--      examined at all. In a trilingual exam where Scrum terms stay English by
--      policy, one regex serves all three languages and there is no reason to
--      look at only one.
--
--   2. NOT fixed, deliberately: "velocidad" and "velocidade" were briefly added
--      to the pattern as cognates of Scrum's "velocity". That was wrong. They
--      are the ordinary Spanish and Portuguese words for speed, and 41 AISM-I
--      items use them legitimately (response times, throughput, agent quality
--      over time). English "velocity" is safe to flag because this cert never
--      uses it in the plain sense; its cognates are not. Extending an English
--      word list across languages requires checking each term separately.
--
-- ===========================================================================
-- THE TWO ITEMS
-- ===========================================================================
-- As in 129, the Scrum reference appears ONLY in a distractor - never in a key -
-- so no candidate was scored on Scrum knowledge. Both distractors keep their
-- exact trap; only the vocabulary moves in-domain.
--
--   task 1.2, option b: "Agile delivery, because weekly SPRINTS are the
--       defining feature of how digital products are built."
--       -> wrong because it names a delivery method, not a service
--          characteristic. "weekly release cycles" carries the same error
--          without requiring Scrum knowledge to reject it.
--
--   task 3.1, option a: "Iteration applies only within build through SPRINTS;
--       all other activities run once in order."
--       -> wrong because it confines iteration to one lifecycle stage.
--          "development iterations" states the same misconception in
--          service-management language.
--
-- ---------------------------------------------------------------------------
-- BEFORE: expect 6 rows.
--
-- select t.code, q.language
--   from public.quiz_questions q
--   join public.tasks t on t.id = q.task_id
--   join public.certifications c on c.id = q.certification_id
--  where c.code = 'AISM-I' and q.retired_at is null
--    and q.options::text ~* '\msprints?\M'
--  order by t.code, q.language;
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- TASK 1.2 | "weekly sprints" -> "weekly release cycles"
-- ===========================================================================

update public.quiz_questions q
   set options = replace(q.options::text, 'weekly sprints are', 'weekly release cycles are')::jsonb
  from public.tasks t
 where t.id = q.task_id and t.code = '1.2'
   and q.certification_id = (select id from public.certifications where code = 'AISM-I')
   and q.language = 'en' and q.options::text like '%weekly sprints are%';

update public.quiz_questions q
   set options = replace(q.options::text, 'los sprints semanales',
                         U&'los ciclos de lanzamiento semanales')::jsonb
  from public.tasks t
 where t.id = q.task_id and t.code = '1.2'
   and q.certification_id = (select id from public.certifications where code = 'AISM-I')
   and q.language = 'es-419' and q.options::text like '%los sprints semanales%';

update public.quiz_questions q
   set options = replace(q.options::text, 'Sprints semanais',
                         U&'ciclos de lan\00e7amento semanais')::jsonb
  from public.tasks t
 where t.id = q.task_id and t.code = '1.2'
   and q.certification_id = (select id from public.certifications where code = 'AISM-I')
   and q.language = 'pt-BR' and q.options::text like '%Sprints semanais%';


-- ===========================================================================
-- TASK 3.1 | "through sprints" -> "through development iterations"
-- ===========================================================================

update public.quiz_questions q
   set options = replace(q.options::text, 'through sprints', 'through development iterations')::jsonb
  from public.tasks t
 where t.id = q.task_id and t.code = '3.1'
   and q.certification_id = (select id from public.certifications where code = 'AISM-I')
   and q.language = 'en' and q.options::text like '%through sprints%';

update public.quiz_questions q
   set options = replace(q.options::text, U&'a trav\00e9s de Sprints',
                         U&'a trav\00e9s de iteraciones de desarrollo')::jsonb
  from public.tasks t
 where t.id = q.task_id and t.code = '3.1'
   and q.certification_id = (select id from public.certifications where code = 'AISM-I')
   and q.language = 'es-419' and q.options::text like '%de Sprints%';

update public.quiz_questions q
   set options = replace(q.options::text, 'por meio de Sprints',
                         U&'por meio de itera\00e7\00f5es de desenvolvimento')::jsonb
  from public.tasks t
 where t.id = q.task_id and t.code = '3.1'
   and q.certification_id = (select id from public.certifications where code = 'AISM-I')
   and q.language = 'pt-BR' and q.options::text like '%por meio de Sprints%';


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) no AISM-I item carries sprint/scrum vocabulary in any language. Expect 0.
-- select count(*) as agile_items
--   from public.quiz_questions q
--   join public.certifications c on c.id = q.certification_id
--  where c.code = 'AISM-I' and q.retired_at is null
--    and (q.options::text ~* '\m(sprints?|scrums?|product backlog|user stor)'
--      or q.question_text ~* '\m(sprints?|scrums?|product backlog|user stor)');
--
-- (b) velocidad / velocidade untouched - these are legitimate. Expect 41.
-- select count(*) as speed_items
--   from public.quiz_questions q
--   join public.certifications c on c.id = q.certification_id
--  where c.code = 'AISM-I' and q.retired_at is null
--    and (q.options::text ~* '\mvelocidad(e)?\M' or q.question_text ~* '\mvelocidad(e)?\M');
--
-- (c) both groups still hold 4 valid options with unchanged keys. Expect 6 rows.
-- select t.code, q.language, jsonb_array_length(q.options) as opts, q.correct_answer
--   from public.quiz_questions q
--   join public.tasks t on t.id = q.task_id
--   join public.certifications c on c.id = q.certification_id
--  where c.code = 'AISM-I' and t.code in ('1.2','3.1') and q.retired_at is null
--  order by t.code, q.language;
--
-- (d) no mojibake. Expect 0.
-- select count(*) as mojibake
--   from public.quiz_questions q
--   join public.certifications c on c.id = q.certification_id
--  where c.code = 'AISM-I'
--    and q.options::text like '%' || chr(195) || chr(162) || '%';
--
-- (e) then the gate: node scripts\verify-cert.mjs --cert AISM-I
--     Expect "No out-of-domain (agile) vocabulary  0 / 3294 items, all languages"
-- ---------------------------------------------------------------------------
