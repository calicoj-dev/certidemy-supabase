-- 223_add_language_unsupported_suppression.sql
--
-- Adds a third suppression reason: language_unsupported.
--
-- WHY
--   Concept matching is the only stage that produces a coverage number, and the
--   lexical matcher cannot cross languages. public.concepts has no lang column
--   and there is no concept_i18n table, so concept names exist only in English.
--
--   Run against the Spanish AulaUtil syllabus, the matcher reported 8.9%
--   coverage against a hand score of 35%. That gap is almost entirely language,
--   not curriculum -- and 8.9% would have read as a devastating finding about a
--   competitor rather than as a failure of measurement.
--
--   The engine now refuses. A matcher declares which source/blueprint language
--   pairs it can measure; when it cannot, coverage is suppressed with this
--   reason rather than estimated.
--
-- THIS IS A MATCHER LIMITATION, NOT AN ENGINE ONE
--   A multilingual embedding matcher would declare support for es-419 against an
--   en blueprint and this reason would never fire. The alternative fix -- adding
--   translated concept names -- would also close it. Neither is required for the
--   engine to be correct today; refusing to report is.
--
-- Drift, weighting and structural findings are UNAFFECTED and still reported.
-- Suppression withholds the score, never the positive identifications.
--
-- ASCII-only. Editor-first.
--
-- Tip before this migration: 222. This is 223.

alter table public.analysis_runs
  drop constraint if exists analysis_runs_suppression_reason_check;

alter table public.analysis_runs
  add constraint analysis_runs_suppression_reason_check
  check (suppression_reason is null
         or suppression_reason in ('density', 'framework_mismatch', 'language_unsupported'));

comment on column public.analysis_runs.suppression_reason is
  'density = source below the word floor. framework_mismatch = different object model, e.g. SBOK. language_unsupported = the concept matcher cannot measure this source-language / blueprint-language pair, so coverage is withheld rather than estimated.';


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME.
-- =====================================================================

-- 1) the constraint accepts the new value
-- select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--  where conrelid = 'public.analysis_runs'::regclass
--    and conname = 'analysis_runs_suppression_reason_check';

-- 2) NEGATIVE TEST - the suppression CHECKs still hold together.
--    This INSERT must FAIL on analysis_runs_suppressed_has_no_coverage:
--    a suppressed run may not carry a coverage number, whatever the reason.
-- insert into public.analysis_runs
--   (source_kind, source_content_hash, source_lang, source_word_count,
--    reference_kind, reference_certification_id, reference_lang,
--    density_ok, coverage_suppressed, suppression_reason, coverage_pct,
--    engine_version, status)
-- values
--   ('paste', 'lang-negative-test', 'es-419', 1267,
--    'certidemy_certification', '11111111-1111-1111-1111-111111111111', 'en',
--    true, true, 'language_unsupported', 8.90,
--    'v0-negative-test', 'pending');
