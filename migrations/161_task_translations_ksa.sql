-- 161_task_translations_ksa.sql
--
-- Knowledge, skills and abilities on task_translations.
--
-- EDITOR-FIRST: this ran in the Supabase SQL editor on 2026-07-29. This file is
-- the versioned record, not the thing that applied it.
--
-- WHY THESE COLUMNS EXIST. K/S/A lived only in English, on `tasks`. The JTA
-- sheet publishes it, so a Spanish or Portuguese edition was structurally
-- thinner than the English one with no way to close the gap. For a LATAM-first
-- certification body that is backwards, and ISO/IEC 17024 treats required
-- knowledge and skills as substance rather than decoration - a task list
-- without them makes a thinner claim exactly where a serious reader checks.
--
-- WHY THEY ARE NULLABLE, AND WHAT DEPENDS ON THAT. render-asset renders K/S/A
-- for a language only when EVERY task carrying English K/S/A also has it
-- translated, and it never falls back to the English columns for a non-English
-- document. Adding these columns empty therefore changes nothing until a
-- translation pass populates them - which is deliberate. The first cut of that
-- code inferred "this language has K/S/A" from the query succeeding, which
-- became true the moment these columns existed and would have interleaved
-- English knowledge statements into Spanish documents. Fixed in the same
-- session; the rule is recorded at the top of render-asset/index.ts.
--
-- is_provisional already exists on this table and is honoured: only reviewed
-- rows reach a client-facing document.

alter table public.task_translations
  add column if not exists knowledge  text,
  add column if not exists skills     text,
  add column if not exists abilities  text;

comment on column public.task_translations.knowledge is
  'Translated knowledge statement. Null until translated - render-asset omits K/S/A entirely for a language rather than mixing English into a translated document.';

comment on column public.task_translations.skills is
  'Translated skills statement. Null until translated. See knowledge.';

comment on column public.task_translations.abilities is
  'Translated abilities statement. Null until translated. See knowledge.';
