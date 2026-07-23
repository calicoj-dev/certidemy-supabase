-- 124_approve_sm_ai_i_jta_translations.sql
--
-- Clear is_provisional on the SM-AI-I JTA translation rows that were NOT
-- corrected through the translation pack.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- Idempotent: a second run touches 0 rows.
--
-- ===========================================================================
-- WHY THIS MIGRATION EXISTS
-- ===========================================================================
-- SM-AI-I's JTA translations do NOT all live in
-- certidemy-web/scripts/load-jta-i18n.mjs. That file's SM-AI-I entry is a
-- "stragglers only" block - its own comment says so:
--
--     "This cert's domains and its other 51 tasks were translated in an
--      earlier pass; these two were never covered."
--
-- The bulk of SM-AI-I's 116 rows were written directly to the database by
-- supabase/scripts/gen-jta-translations.mjs and have no disk representation.
-- AIE-I, AIGRM-I and AISM-I carry FULL blocks in the pack, which is why their
-- --approve runs matched their row counts exactly. SM-AI-I does not.
--
-- Consequence: `--cert SM-AI-I --approve` can only flag the rows present in
-- the pack. Running it alone would have flipped a handful of rows and silently
-- left the rest provisional. The --dry run caught this before any write.
--
-- ===========================================================================
-- WHAT HAS ALREADY HAPPENED (do not repeat)
-- ===========================================================================
-- The pack's SM-AI-I block was expanded to carry all five domains (both
-- languages) plus every task corrected in the Grok review of 2026-07-22, then:
--
--     node scripts/load-jta-i18n.mjs --cert SM-AI-I --approve
--     -> 10 domain rows, 25 task rows. Wrote 35 rows.
--
-- Those 35 rows already carry is_provisional = false and corrected text.
-- This migration handles ONLY the remaining rows: translated in the earlier
-- pass, reviewed by Grok, and approved unchanged.
--
-- ===========================================================================
-- SAFETY: NO TEXT IS MODIFIED HERE
-- ===========================================================================
-- Only the review flag is flipped. This file therefore contains no accented
-- characters at all and cannot introduce mojibake through the SQL editor -
-- which is the documented corruption source for multibyte paste. All corrected
-- text went through the ASCII-escaped pack and the API loader instead.
--
-- ---------------------------------------------------------------------------
-- BEFORE: expect 81 task rows + 0 domain rows still provisional
--         (the 10 domain rows were approved by the pack run above)
--
-- select
--   (select count(*) from public.task_translations tt
--      join public.tasks t on t.id = tt.task_id
--     where t.certification_id = (select id from public.certifications where code = 'SM-AI-I')
--       and tt.is_provisional) as tasks_provisional,
--   (select count(*) from public.domain_translations dt
--      join public.domains d on d.id = dt.domain_id
--     where d.certification_id = (select id from public.certifications where code = 'SM-AI-I')
--       and dt.is_provisional) as domains_provisional;
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- THE FLAG FLIP
-- ===========================================================================

update public.task_translations tt
   set is_provisional = false
  from public.tasks t
 where t.id = tt.task_id
   and t.certification_id = (select id from public.certifications where code = 'SM-AI-I')
   and tt.is_provisional;

update public.domain_translations dt
   set is_provisional = false
  from public.domains d
 where d.id = dt.domain_id
   and d.certification_id = (select id from public.certifications where code = 'SM-AI-I')
   and dt.is_provisional;


-- ---------------------------------------------------------------------------
-- AFTER: expect 0 / 0 / 116 / 0
--
-- select
--   (select count(*) from public.task_translations tt
--      join public.tasks t on t.id = tt.task_id
--     where t.certification_id = (select id from public.certifications where code = 'SM-AI-I')
--       and tt.is_provisional) as tasks_provisional,
--   (select count(*) from public.domain_translations dt
--      join public.domains d on d.id = dt.domain_id
--     where d.certification_id = (select id from public.certifications where code = 'SM-AI-I')
--       and dt.is_provisional) as domains_provisional,
--   (select count(*) from public.task_translations tt
--      join public.tasks t on t.id = tt.task_id
--     where t.certification_id = (select id from public.certifications where code = 'SM-AI-I'))
--   + (select count(*) from public.domain_translations dt
--      join public.domains d on d.id = dt.domain_id
--     where d.certification_id = (select id from public.certifications where code = 'SM-AI-I')) as total_rows,
--   (select count(*) from public.task_translations tt
--      join public.tasks t on t.id = tt.task_id
--     where t.certification_id = (select id from public.certifications where code = 'SM-AI-I')
--       and tt.statement like '%' || chr(195) || chr(162) || '%') as mojibake;
--
-- Spot-check that the corrected verbs actually landed (expect Aplicar /
-- Facilitar / Seleccionar / Reconocer / Recordar, not the stale forms):
--
-- select t.code, tt.language, left(tt.statement, 60) as statement
--   from public.task_translations tt
--   join public.tasks t on t.id = tt.task_id
--  where t.certification_id = (select id from public.certifications where code = 'SM-AI-I')
--    and t.code in ('1.2','3.6','3.9','5.7','5.9')
--  order by t.code, tt.language;
-- ---------------------------------------------------------------------------
