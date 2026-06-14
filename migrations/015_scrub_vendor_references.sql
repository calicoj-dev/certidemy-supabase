-- 015_scrub_vendor_references.sql
-- =============================================================================
-- Forward-only scrub of competitor vendor names (CertiProf) from the public /
-- structural JTA content: tasks (statements + knowledge) and concepts
-- (descriptions). These render on the public Certificate Blueprint modal and
-- the learner blueprint, where naming a competitor inside Certidemy's own
-- certification scheme is both an implied-affiliation risk and simply wrong now
-- that Certidemy issues its own credential.
--
-- Why a NEW migration rather than editing 003: 003 is already applied; the fix
-- runs FORWARD so a fresh rebuild (003 seeds the old text, 015 corrects it)
-- ends in the same clean state. Idempotent — every statement is a no-op once
-- applied or on a clean row.
--
-- SCOPE: this migration does NOT touch lesson bodies/titles (a separate content
-- pass) or the AI tutor prompts (a product-identity change). "Scrum Guide"
-- references are deliberately KEPT — it is the canonical CC-licensed source.
--
-- Cert: SM-I = 11111111-1111-1111-1111-111111111111.
-- Run in the SQL editor AND commit to the repo. Re-run the verification scan
-- at the bottom afterward to confirm zero remaining hits.
-- =============================================================================

-- ---- tasks: 4.9 statement (drop the vendor parenthetical entirely) ----------
update public.tasks
set statement = 'Interpret burndown charts and velocity metrics'
where certification_id = '11111111-1111-1111-1111-111111111111'
  and code = '4.9';

-- ---- tasks: 5.7 statement (generic — keeps the real learning objective) -----
update public.tasks
set statement = 'Navigate terminology drift between legacy training materials and the Scrum Guide'
where certification_id = '11111111-1111-1111-1111-111111111111'
  and code = '5.7';

-- ---- tasks: 5.7 knowledge (surgical phrase swap, preserves the rest) --------
update public.tasks
set knowledge = replace(knowledge, 'CertiProf prep materials', 'legacy training materials')
where certification_id = '11111111-1111-1111-1111-111111111111'
  and code = '5.7'
  and knowledge like '%CertiProf prep materials%';

-- ---- concepts: three descriptions (surgical phrase swaps) -------------------
update public.concepts
set description = replace(description, 'CertiProf sometimes uses', 'Some training materials use')
where description like 'CertiProf sometimes uses%';

update public.concepts
set description = replace(description, 'CertiProf materials may use', 'some legacy materials may use')
where description like '%CertiProf materials may use%';

update public.concepts
set description = replace(description, 'and CertiProf materials', 'and legacy training materials')
where description like '%and CertiProf materials%';

-- ---- VERIFICATION (run separately after the updates; expect zero rows) ------
-- select 'tasks' tbl, code, statement, knowledge
--   from public.tasks
--  where certification_id = '11111111-1111-1111-1111-111111111111'
--    and (statement ~* 'certiprof|scrum\.org|certjoin|certimind'
--      or knowledge ~* 'certiprof|scrum\.org|certjoin|certimind')
-- union all
-- select 'concepts', null, description, null
--   from public.concepts
--  where description ~* 'certiprof|scrum\.org|certjoin|certimind';
