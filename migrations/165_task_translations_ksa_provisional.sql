-- 165_task_translations_ksa_provisional.sql
--
-- A SEPARATE REVIEW FLAG FOR KNOWLEDGE / SKILLS / ABILITIES.
--
-- WHY THIS EXISTS
--
-- task_translations carries `statement` (translated and reviewed months ago) and,
-- since migration 161, `knowledge` / `skills` / `abilities` (empty until now).
-- Both live on one row under one `is_provisional` flag.
--
-- On 2026-07-29 exactly this shape caused a real failure in domain_translations:
-- re-translating the descriptions wrote the row, which set is_provisional = true,
-- which marked the TITLES unreviewed too - and every generated PDF correctly
-- withheld both and fell back to English while the public site kept showing
-- perfect Spanish titles. It took a while to diagnose because nothing was
-- broken; the system was being careful about the wrong thing.
--
-- A K/S/A translation pass would reproduce that precisely: writing the three new
-- columns would flip is_provisional and quietly un-review 302 task statements
-- across two languages.
--
-- So the two review states are separated. `is_provisional` continues to mean
-- "statement is unreviewed"; `ksa_is_provisional` means "the K/S/A block is
-- unreviewed". They are set and cleared independently, by different passes.
--
-- DEFAULT true, deliberately: every existing row has NULL K/S/A, and NULL is
-- correctly described as not-yet-reviewed. Renderers must treat a provisional
-- K/S/A block the same way they treat a provisional statement - omit it entirely
-- for that language rather than falling back to English, because a Spanish JTA
-- sheet with English knowledge statements mixed in is worse than one with no
-- knowledge section at all.
--
-- NOTE ON domain_translations: the same defect still exists there, where `title`
-- and `description` share one flag. Not fixed here because nothing is queued that
-- would rewrite one without the other. Recorded in HANDOFF-v4.1 section 8 as an
-- open decision - either split it the same way, or write down the rule that
-- nothing rewrites a row without re-reviewing every field on it.
--
-- Editor-first: this ran in the Supabase SQL editor. This file is the versioned
-- record.

alter table task_translations
  add column if not exists ksa_is_provisional boolean not null default true;

comment on column task_translations.ksa_is_provisional is
  'Review state for knowledge/skills/abilities, separate from is_provisional which covers statement. Split because the two are translated and reviewed in different passes: writing one must not mark the other unreviewed. See HANDOFF-v4.0 section 3.2.';
