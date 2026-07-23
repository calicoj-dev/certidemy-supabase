-- 122_fix_aism_i_task_statements.sql
--
-- Two corrections to AISM-I English task statements, surfaced during the
-- Grok translation review of the es-419 / pt-BR pack.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- Idempotent: each UPDATE is guarded by a LIKE on the text being removed, so a
-- second run touches 0 rows.
--
-- ASCII-clean throughout (no em-dashes, no curly quotes) per the paste-safety rule.
--
-- SAFE TO RUN: AISM-I's secure item bank has not been generated yet, so no
-- quiz_questions rows are stamped against these statements. No bank regeneration
-- is implied by this migration. Translations live in task_translations keyed by
-- task_id and are unaffected.
--
-- ---------------------------------------------------------------------------
-- BEFORE: run this to see the two rows as they currently stand.
-- ---------------------------------------------------------------------------
-- select code, statement
--   from public.tasks
--  where certification_id = (select id from public.certifications where code = 'AISM-I')
--    and code in ('1.4','1.5')
--  order by code;
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- FIX 1 - task 1.4: strip a leaked authoring annotation
-- ===========================================================================
-- The statement carried a trailing editorial note:
--     *(Foundation unchanged by AI - taught clean.)*
-- That is guidance to the JTA author, not part of the competence being tested.
-- It renders to English-language learners on the blueprint page, and an item
-- writer could mistake it for scope instruction. The es-419 and pt-BR
-- translations correctly omit it, so removing it also brings the three
-- languages into agreement.

update public.tasks
   set statement = $$Distinguish the parties and roles in a service relationship - provider, consumer, and the sponsor / customer / user roles.$$
 where certification_id = (select id from public.certifications where code = 'AISM-I')
   and code = '1.4'
   and statement like '%Foundation unchanged by AI%';


-- ===========================================================================
-- FIX 2 - task 1.5: "identical result" -> "identical output"
-- ===========================================================================
-- AISM-I is built on the outputs-vs-outcomes distinction (task 1.6), where
-- outputs = salidas / saidas and outcomes = resultados. Task 1.5 said "an
-- identical result" while describing output identity, which put the word
-- "result" in tension with the contrast the domain exists to teach.
--
-- Grok approved rendering 1.5 as salida / saida in both target languages to
-- protect that contrast. This aligns the English with the approved
-- translations rather than leaving EN as the odd one out.

update public.tasks
   set statement = $$Explain utility, warranty, and experience as the dimensions of a service's fitness - and how warranty changes for non-deterministic AI output, assuring a range of quality rather than an identical output.$$
 where certification_id = (select id from public.certifications where code = 'AISM-I')
   and code = '1.5'
   and statement like '%rather than an identical result%';


-- ---------------------------------------------------------------------------
-- VERIFY: expect exactly 2 rows, both clean.
--   1.4 must NOT contain "Foundation unchanged"
--   1.5 must end with "an identical output."
-- ---------------------------------------------------------------------------
-- select code,
--        statement,
--        (statement like '%Foundation unchanged%')          as has_leaked_note,   -- expect false
--        (statement like '%rather than an identical result%') as has_old_result   -- expect false
--   from public.tasks
--  where certification_id = (select id from public.certifications where code = 'AISM-I')
--    and code in ('1.4','1.5')
--  order by code;
-- ---------------------------------------------------------------------------
