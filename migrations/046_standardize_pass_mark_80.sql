-- 046_standardize_pass_mark_80.sql
-- Standardize the "I"-tier pass mark to 80% across all certifications.
-- Rationale: SPO-I ships at 80%; SM-I was 85%. Single pass mark for the
-- "I" tier removes a moving target for SPO-I content authoring and aligns
-- with the exam-trend chart's existing 80 default.
--
-- Editor-first: run this live in the Supabase SQL editor, THEN commit this
-- file to supabase\migrations\ as the versioned record.
--
-- Idempotent: the <> 80 guard makes re-runs no-ops.

update certifications
set passing_score_pct = 80
where code = 'SM-I'
  and passing_score_pct <> 80;

-- Verification (read-only; not part of the migration effect):
-- select code, passing_score_pct from certifications
-- where code in ('SM-I','SPO-I') order by code;
