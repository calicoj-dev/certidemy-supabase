-- 016_scrub_vendor_references_lessons.sql
-- =============================================================================
-- Forward-only scrub of competitor names (CertiProf, Scrum.org) from LESSON
-- content — the learner-facing prose in lessons.content_md and the 05-05 title.
-- Companion to 015 (which cleaned the JTA tasks + concepts).
--
-- Lesson translations (es-419, pt-BR) live ONLY as DB rows — there are no
-- per-language .md source files — so all three languages are corrected here
-- directly. The English .md sources are fixed separately (scripted swap) so a
-- re-seed of English cannot reintroduce the names.
--
-- Two roles for "CertiProf" are handled distinctly:
--   (a) legacy-source modifier  -> "legacy training material / content"
--   (b) the exam provider       -> drop the name, keep "the SMPC exam"
-- "Scrum Guide" / "Scrum Master" etc. are NOT touched (canonical terms).
-- "SMPC" is intentionally LEFT in place (cert code; rebrand is a separate task).
--
-- Idempotent: replace() is a no-op once applied. Run in the SQL editor AND
-- commit. Re-run the verification block at the bottom afterward (expect 0 rows).
-- =============================================================================

-- ---- English -----------------------------------------------------------------
update public.lessons
set content_md =
  replace(replace(replace(replace(replace(replace(replace(replace(
    content_md,
    'CertiProf prep or older material', 'legacy or older material'),
    'CertiProf prep material',          'legacy training material'),
    'CertiProf prep content',           'legacy training content'),
    'CertiProf SMPC exam',              'SMPC exam'),
    'CertiProf exam',                   'SMPC exam'),
    'CertiProf material',               'legacy training material'),
    'comes from Scrum.org',             'is a well-known scaling framework'),
    'Terminology Drift: CertiProf vs. the Scrum Guide',
    'Terminology Drift: Legacy Wording vs. the 2020 Scrum Guide')
where language = 'en'
  and (content_md like '%CertiProf%' or content_md like '%Scrum.org%');

-- ---- Spanish (es-419) --------------------------------------------------------
update public.lessons
set content_md =
  replace(replace(replace(replace(replace(replace(replace(replace(replace(
    content_md,
    'material de preparación rezagado de CertiProf', 'material de preparación heredado y rezagado'),
    'material de preparación de CertiProf',          'material de preparación heredado'),
    'contenido de preparación de CertiProf',         'contenido de preparación heredado'),
    'preparación de CertiProf o el material',        'preparación heredada o el material'),
    'examen SMPC de CertiProf',                      'examen SMPC'),
    'examen de CertiProf',                           'examen SMPC'),
    'material de CertiProf',                         'material heredado'),
    'proviene de Scrum.org',                         'es un framework de escalado conocido'),
    'Deriva terminológica: CertiProf frente a la Guía de Scrum',
    'Deriva terminológica: redacción heredada frente a la Guía de Scrum 2020')
where language = 'es-419'
  and (content_md like '%CertiProf%' or content_md like '%Scrum.org%');

-- ---- Portuguese (pt-BR) ------------------------------------------------------
update public.lessons
set content_md =
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    content_md,
    'material de preparação atrasado da CertiProf', 'material de preparação herdado e atrasado'),
    'material de preparação da CertiProf',          'material de preparação herdado'),
    'conteúdo de preparação da CertiProf',          'conteúdo de preparação herdado'),
    'preparação da CertiProf ou o material',        'preparação herdada ou o material'),
    'prova SMPC da CertiProf',                      'prova SMPC'),
    'prova da CertiProf',                           'prova SMPC'),
    'materiais da CertiProf',                       'materiais herdados'),
    'material da CertiProf',                        'material herdado'),
    'vem do Scrum.org',                             'é um framework de escalonamento conhecido'),
    'Deriva terminológica: CertiProf frente ao Guia do Scrum',
    'Deriva terminológica: redação herdada frente ao Guia do Scrum 2020')
where language = 'pt-BR'
  and (content_md like '%CertiProf%' or content_md like '%Scrum.org%');

-- ---- 05-05 title column (separate from content_md) ---------------------------
update public.lessons set title = 'Terminology Drift: Legacy Wording vs. the 2020 Scrum Guide'
  where slug = '05-05-terminology-drift' and language = 'en';
update public.lessons set title = 'Deriva terminológica: redacción heredada frente a la Guía de Scrum 2020'
  where slug = '05-05-terminology-drift' and language = 'es-419';
update public.lessons set title = 'Deriva terminológica: redação herdada frente ao Guia do Scrum 2020'
  where slug = '05-05-terminology-drift' and language = 'pt-BR';

-- ---- VERIFICATION (run separately after the updates; expect zero rows) -------
-- select slug, language, 'content_md' as field from public.lessons
--   where content_md ~* 'certiprof|scrum\.?org|certjoin|certmind'
-- union all
-- select slug, language, 'title' from public.lessons
--   where title ~* 'certiprof|scrum\.?org|certjoin|certmind'
-- order by slug, language;
