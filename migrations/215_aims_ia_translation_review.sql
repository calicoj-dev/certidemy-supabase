-- 215_aims_ia_translation_review.sql
--
-- AIMS-IA translation review - 90 rows read, three corrected, all flipped to
-- is_provisional = false.
--
-- This clears the last verify-cert failure on AIMS-IA:
--   FAIL  Translations reviewed against current English
--         90 of 90 provisional - the English moved, or they were never reviewed
--
-- ============================================================================
-- WHAT THE FLAG MEANS
-- ============================================================================
--
-- gen-jta-translations.mjs writes every row is_provisional = true on purpose:
-- the flag is a claim that a HUMAN HAS READ THE STRING, and a generator cannot
-- assert that about its own output. Flipping it is therefore a record of work
-- done, not a formality - and writing false here would put unreviewed machine
-- translation in front of a buyer under a claim of review.
--
-- Scope: 5 domain titles + 5 domain descriptions + 40 task statements, x2
-- languages = 90 rows. NOT the K/S/A fields, which carry their own
-- ksa_is_provisional flag and deserve their own pass.
--
-- ============================================================================
-- WHAT THE REVIEW FOUND
-- ============================================================================
--
-- Reviewed against TRANSLATION-REVIEW-AIMS-IA.md, which renders English beside
-- both translations. The check is not fluency - the machine is fluent. It is
-- whether the TERMS OF ART are the ones a practitioner in that language would
-- use, whether any acronym has been invented, and whether anything normative
-- has drifted.
--
-- CLEAN across all 90:
--   * No coined acronym for "AI management system" anywhere. Spelled out as
--     "sistema de gestion de IA" / "sistema de gestao de IA" throughout, which
--     is the standing rule for this catalogue.
--   * Clause references consistent with the family: "apartado" in Spanish,
--     "secao" in Portuguese, verified against AIMS-F, ISMS-F and ISMS-IA.
--   * "Declaracion de Aplicabilidad" / "Declaracao de Aplicabilidade" correct.
--   * No modal drift - no "should" rendered as a "must", no standard renamed,
--     no clause number moved.
--
-- THREE CORRECTED, applied by scripts/fix-aims-ia-translations.mjs because the
-- SQL editor corrupts multibyte characters on paste:
--
--   1. pt-BR task 5.2   "registro" -> "enunciado"
--      The English reads "Select the nonconformity STATEMENT that correctly
--      links evidence to the requirement", and the skills field is "Choose the
--      statement that does this and no more." The task is about how a finding
--      is WORDED. "Registro" is a record - a different artifact - and points
--      the candidate at the wrong thing. es-419 had it right with "enunciado".
--      This is the only one of the three that changed what the task tests.
--
--   2. es-419 task 1.1  "compromiso" -> "encargo"
--   3. pt-BR  task 1.1  "engajamento" -> "trabalho"
--      Both rendered "audit engagement" as a false friend - "compromiso" and
--      "engajamento" both read as COMMITMENT in ordinary usage. "Encargo" is
--      the IAASB term in Spanish, "trabalho" the IBRACON/CFC term in
--      Portuguese. Neither original misled on the competence, but both read as
--      translated-from-English to a practitioner.
--
-- FLAGGED AND WITHDRAWN, recorded so the next reviewer does not re-raise it:
--   pt-BR task 3.2 renders "review of documented information" as "analise
--   critica da informacao documentada". ABNT uses "analise critica" for review
--   generally across ISO management-system standards, not only for management
--   review. Correct usage; no change.
--
-- ============================================================================
-- WHAT FLIPPING THE FLAG DOES
-- ============================================================================
--
-- render-asset filters translations on is_provisional = false and the flag is
-- row-level, so until now the Spanish and Portuguese blueprint and JTA sheets
-- rendered their domain sections in English. After this they render translated.
--
-- The cache is NOT a problem here, contrary to the warning in
-- gen-jta-translations.mjs's docstring. That warning predates render-asset v6,
-- which made cache keys CONTENT-ADDRESSED: both the blueprint and JTA paths are
-- built from contentHash() of the data the renderer will draw (index.ts lines
-- 849 and 1132). A changed domain description produces a different hash and
-- therefore a different path, so the sheet regenerates on its own. No version
-- bump is needed and no stale sheet survives. The docstring is stale.
--
-- Run in the Supabase SQL editor, AFTER scripts/fix-aims-ia-translations.mjs.
-- ============================================================================

update public.domain_translations dt
set is_provisional = false
from public.domains d
where d.id = dt.domain_id
  and d.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and dt.is_provisional;

update public.task_translations tt
set is_provisional = false
from public.tasks t
where t.id = tt.task_id
  and t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and tt.is_provisional;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. All 90 rows reviewed. Expect 10 domain rows and 80 task rows, zero
--    provisional in either.
select 'domains' as kind, dt.language, count(*) as rows,
       count(*) filter (where dt.is_provisional) as still_provisional
from public.domain_translations dt
join public.domains d on d.id = dt.domain_id
where d.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
group by dt.language
union all
select 'tasks', tt.language, count(*), count(*) filter (where tt.is_provisional)
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
group by tt.language
order by kind, language;

-- 2. The three corrections landed with their accents intact. Expect
--    "enunciado", "encargo" and "trabalho"; expect NO "registro", "compromiso"
--    or "engajamento" in these rows.
select t.code, tt.language, tt.statement
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and ((t.code = '5.2' and tt.language = 'pt-BR')
    or (t.code = '1.1' and tt.language in ('es-419','pt-BR')))
order by t.code, tt.language;

-- 3. No mojibake anywhere in the translated set. chr(195)||chr(162) is the
--    'A-tilde circumflex' signature of double-encoded UTF-8; built with chr() so
--    this file stays ASCII. Expect zero rows.
select t.code, tt.language, tt.statement
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and tt.statement like '%' || chr(195) || chr(162) || '%'
union all
select d.code, dt.language, dt.title
from public.domain_translations dt
join public.domains d on d.id = dt.domain_id
where d.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and (dt.title || coalesce(dt.description,'')) like '%' || chr(195) || chr(162) || '%';

-- 4. Still no coined acronym after the corrections. Expect zero rows.
select t.code, tt.language, tt.statement
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
where t.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and tt.statement ~ '\y(SGIA|SGSIA)\y';

-- 5. The whole-cert check.
--    Run: node scripts\verify-cert.mjs --cert AIMS-IA --strict
--    Expect: 0 fail. This was the last one.
