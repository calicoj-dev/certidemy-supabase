-- 028_add_lesson01_01_principles_dragmatch_es_pt.sql
-- =============================================================================
-- Trilingual parity for 01-01: the EN lesson has a "match-principles-to-themes"
-- drag-match (trimmed to 4 items in migration 027) between the "Twelve Principles"
-- concept and the Snowbird deep-dive. The es-419 and pt-BR rows were missing it.
-- This inserts the SAME 4-item widget (translated) at the SAME position — right
-- before the Snowbird deep-dive — so all three languages line up section-for-section.
--
-- Inserted via replace() anchored on the unique deep-dive marker in each row,
-- prepending the widget. Guarded by "not like" so re-running never double-inserts.
-- (Scrum term "Developers" kept English per platform convention.)
-- =============================================================================

-- ---- es-419 ------------------------------------------------------------------
update public.lessons set content_md = replace(
  content_md,
  $anchor$::deep-dive title="Contexto histórico: la reunión de Snowbird"$anchor$,
  $repl$::interactive widget="drag-match" id="match-principles-to-themes" concept_slugs="agile-principles"
{
  "items": [
    { "id": "a", "text": "Dar la bienvenida a los requisitos cambiantes, incluso tarde en el desarrollo" },
    { "id": "b", "text": "Las personas de negocio y los Developers trabajan juntos a diario" },
    { "id": "c", "text": "Mantener un ritmo constante que el equipo pueda sostener indefinidamente" },
    { "id": "d", "text": "Prestar atención continua a la excelencia técnica" }
  ],
  "targets": [
    { "id": "t1", "text": "Entregar valor temprano y dar la bienvenida al cambio" },
    { "id": "t2", "text": "Personas y colaboración" },
    { "id": "t3", "text": "Software funcionando a un ritmo sostenible" },
    { "id": "t4", "text": "Oficio y mejora continua" }
  ],
  "correct": { "a": "t1", "b": "t2", "c": "t3", "d": "t4" },
  "explanation": "Cada uno de estos cuatro principios ancla un tema del Manifiesto: dar la bienvenida al cambio, la colaboración, un ritmo sostenible y el oficio técnico. Los demás principios del Manifiesto se agrupan bajo estos mismos cuatro temas: el examen te pide reconocer a qué tema pertenece un principio, no recitar la redacción exacta."
}
::

::deep-dive title="Contexto histórico: la reunión de Snowbird"$repl$)
where slug = '01-01-agile-manifesto' and language = 'es-419'
  and content_md not like '%match-principles-to-themes%';

-- ---- pt-BR -------------------------------------------------------------------
update public.lessons set content_md = replace(
  content_md,
  $anchor$::deep-dive title="Contexto histórico: o encontro de Snowbird"$anchor$,
  $repl$::interactive widget="drag-match" id="match-principles-to-themes" concept_slugs="agile-principles"
{
  "items": [
    { "id": "a", "text": "Acolher requisitos que mudam, mesmo tarde no desenvolvimento" },
    { "id": "b", "text": "As pessoas de negócio e os Developers trabalham juntos diariamente" },
    { "id": "c", "text": "Manter um ritmo constante que o time consiga sustentar indefinidamente" },
    { "id": "d", "text": "Dar atenção contínua à excelência técnica" }
  ],
  "targets": [
    { "id": "t1", "text": "Entregar valor cedo e acolher a mudança" },
    { "id": "t2", "text": "Pessoas e colaboração" },
    { "id": "t3", "text": "Software em funcionamento em um ritmo sustentável" },
    { "id": "t4", "text": "Ofício e melhoria contínua" }
  ],
  "correct": { "a": "t1", "b": "t2", "c": "t3", "d": "t4" },
  "explanation": "Cada um destes quatro princípios ancora um tema do Manifesto: acolher a mudança, a colaboração, um ritmo sustentável e o ofício técnico. Os demais princípios do Manifesto se agrupam sob esses mesmos quatro temas — a prova pede que você reconheça a que tema um princípio pertence, não que recite a redação exata."
}
::

::deep-dive title="Contexto histórico: o encontro de Snowbird"$repl$)
where slug = '01-01-agile-manifesto' and language = 'pt-BR'
  and content_md not like '%match-principles-to-themes%';

-- ---- VERIFICATION (expect 3 rows, one per language) --------------------------
-- select l.language, count(*) as principles_widget_count
-- from public.lessons l
-- cross join lateral
--   regexp_matches(l.content_md, 'match-principles-to-themes', 'g') as x
-- where l.slug = '01-01-agile-manifesto'
-- group by l.language order by l.language;   -- each language: 1
