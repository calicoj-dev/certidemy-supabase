-- 125_approve_spo_ai_i_jta_translations.sql
--
-- Clear is_provisional on the SPO-AI-I JTA translation rows that were NOT
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
-- Same shape as migration 124 for SM-AI-I. SPO-AI-I's entry in
-- certidemy-web/scripts/load-jta-i18n.mjs was a "stragglers only" block
-- carrying 2 tasks and no domains - 44 of 46 tasks and all 5 domains were
-- translated in an earlier pass by supabase/scripts/gen-jta-translations.mjs,
-- straight to the database with no disk representation.
--
-- Block completeness across the pack, measured before this work:
--     AIE-I    18 tasks / 3 domains   (full - DB has 18/3)
--     AIGRM-I  51 / 5                 (full)
--     SD-AI-I  45 / 5                 (full)
--     AISM-I   61 / 6                 (full)
--     SM-AI-I  15 / 5                 (partial - DB has 53/5; see 124)
--     SPO-AI-I  2 / 0                 (stub - DB has 46/5; this migration)
--
-- Consequence: `--cert SPO-AI-I --approve` alone could only flag the packed
-- rows and would silently leave the rest provisional.
--
-- ===========================================================================
-- WHAT HAS ALREADY HAPPENED (do not repeat)
-- ===========================================================================
-- The pack's SPO-AI-I block was expanded to carry all five domains (both
-- languages) plus every task corrected in the Grok review of 2026-07-22, then:
--
--     node scripts/load-jta-i18n.mjs --cert SPO-AI-I --approve
--     -> 10 domain rows, 13 task rows. Wrote 23 rows.
--
-- Corrections applied in that run:
--   3.2       - STALE. Migration 094 rewrote the English from "Explain that the
--               PO is one accountable person" (1_remember) to "Apply the
--               one-Product-Owner rule ... not a committee or a proxy"
--               (3_apply); 094's own note calls the old declaration
--               "UNDER-DECLARED BY TWO LEVELS ... construct under-
--               representation: the credential attested a competence it never
--               measured." The translation still carried the pre-fix wording.
--   D3 desc,
--   3.4, 3.5  - POLICY VIOLATION in Portuguese: "Developers" had been
--               translated to "Desenvolvedores". Verified against the official
--               Brazilian Portuguese Scrum Guide, which keeps "Developers" in
--               English (as does the official LATAM Spanish guide). Spanish was
--               already correct.
--   D1-D5     - domain titles moved to sentence case (platform rule); D3 title
--               stopped translating "Scrum Team"; D2 description uses "Done"
--               rather than substituting "Definition of Done"; D1 description
--               reworded ("El porque de ..." rather than "El fundamento del
--               por que de ...").
--   1.6, 4.9,
--   D1/D4     - "Spec-Driven Development" kept in English in both languages
--               with one gloss on first use in the D1 description. It had been
--               rendered five different ways across the cert (two forms in
--               Spanish, three in Portuguese including English twice).
--   4.7       - PBI expanded to "elementos del Product Backlog" / "itens do
--               Product Backlog", matching 4.4.
--   3.6       - "responsabilidad humana por el valor", and "aumentados por IA"
--               to match AISM-I and SM-AI-I.
--   3.9, 5.12 - the two original stragglers, unchanged in content.
--
-- Declined from the review, recorded so it is not revisited:
--   4.12 CRAFT - the reviewer proposed rendering "feature waiter" as "fabrica
--               de funcionalidades" to match the D4 description. Declined: the
--               English deliberately names TWO different anti-patterns
--               (feature-factory in D4, feature waiter in 4.12). Merging them
--               would translate a term the source does not use and erase a
--               distinction the cert teaches.
--   P6 label   - the reviewer labelled the "aumentados por IA" fix as task 1.5;
--               it is task 3.6. Applied to 3.6.
--
-- ===========================================================================
-- SAFETY: NO TEXT IS MODIFIED HERE
-- ===========================================================================
-- Only the review flag is flipped. This file therefore contains no accented
-- characters and cannot introduce mojibake through the SQL editor. All
-- corrected text went through the ASCII-escaped pack and the API loader.
--
-- ---------------------------------------------------------------------------
-- BEFORE: expect 79 task rows still provisional, 0 domain rows
--         (the 10 domain rows were approved by the pack run above)
--
-- select
--   (select count(*) from public.task_translations tt
--      join public.tasks t on t.id = tt.task_id
--     where t.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--       and tt.is_provisional) as tasks_provisional,
--   (select count(*) from public.domain_translations dt
--      join public.domains d on d.id = dt.domain_id
--     where d.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--       and dt.is_provisional) as domains_provisional;
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- THE FLAG FLIP
-- ===========================================================================

update public.task_translations tt
   set is_provisional = false
  from public.tasks t
 where t.id = tt.task_id
   and t.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
   and tt.is_provisional;

update public.domain_translations dt
   set is_provisional = false
  from public.domains d
 where d.id = dt.domain_id
   and d.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
   and dt.is_provisional;


-- ---------------------------------------------------------------------------
-- AFTER: expect 0 / 0 / 102
--
-- select
--   (select count(*) from public.task_translations tt
--      join public.tasks t on t.id = tt.task_id
--     where t.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--       and tt.is_provisional) as tasks_provisional,
--   (select count(*) from public.domain_translations dt
--      join public.domains d on d.id = dt.domain_id
--     where d.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--       and dt.is_provisional) as domains_provisional,
--   (select count(*) from public.task_translations tt
--      join public.tasks t on t.id = tt.task_id
--     where t.certification_id = (select id from public.certifications where code = 'SPO-AI-I'))
--   + (select count(*) from public.domain_translations dt
--      join public.domains d on d.id = dt.domain_id
--     where d.certification_id = (select id from public.certifications where code = 'SPO-AI-I')) as total_rows;
--
-- Spot-check the corrections landed. Expect: 3.2 begins "Aplicar la regla" /
-- "Aplicar a regra"; 3.4 and 3.5 pt-BR contain "Developers" not
-- "Desenvolvedores".
--
-- select t.code, tt.language, left(tt.statement, 70) as statement
--   from public.task_translations tt
--   join public.tasks t on t.id = tt.task_id
--  where t.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--    and t.code in ('3.2','3.4','3.5')
--  order by t.code, tt.language;
--
-- And confirm no Portuguese row still says Desenvolvedores (expect 0):
--
-- select count(*) as pt_desenvolvedores
--   from public.task_translations tt
--   join public.tasks t on t.id = tt.task_id
--  where t.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--    and tt.language = 'pt-BR'
--    and tt.statement like '%Desenvolvedor%';
-- ---------------------------------------------------------------------------
