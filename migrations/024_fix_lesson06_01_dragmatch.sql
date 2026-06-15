-- 024_fix_lesson06_01_dragmatch.sql
-- =============================================================================
-- Trim the 06-01 drag-match from 5 items to 4 (drop item e), per the interaction-
-- sizing rule: keep matching/sorting widgets small and glanceable. Leaves a
-- balanced 2 tool / 2 human set. Surgical replace on each language row.
-- Idempotent: if already trimmed, the replace finds nothing and is a no-op.
-- =============================================================================

-- ---- en ----------------------------------------------------------------------
update public.lessons set content_md = replace(replace(
  content_md,
  $from$    { "id": "d", "text": "Ordering the Product Backlog to maximize value" },
    { "id": "e", "text": "Proposing test cases for a new feature" }$from$,
  $to$    { "id": "d", "text": "Ordering the Product Backlog to maximize value" }$to$),
  $cfrom$"correct": { "a": "tool", "b": "human", "c": "tool", "d": "human", "e": "tool" },$cfrom$,
  $cto$"correct": { "a": "tool", "b": "human", "c": "tool", "d": "human" },$cto$)
where slug = '06-01-ai-agents-as-tools' and language = 'en';

-- ---- es-419 ------------------------------------------------------------------
update public.lessons set content_md = replace(replace(
  content_md,
  $from$    { "id": "d", "text": "Ordenar el Product Backlog para maximizar el valor" },
    { "id": "e", "text": "Proponer casos de prueba para una nueva funcionalidad" }$from$,
  $to$    { "id": "d", "text": "Ordenar el Product Backlog para maximizar el valor" }$to$),
  $cfrom$"correct": { "a": "tool", "b": "human", "c": "tool", "d": "human", "e": "tool" },$cfrom$,
  $cto$"correct": { "a": "tool", "b": "human", "c": "tool", "d": "human" },$cto$)
where slug = '06-01-ai-agents-as-tools' and language = 'es-419';

-- ---- pt-BR -------------------------------------------------------------------
update public.lessons set content_md = replace(replace(
  content_md,
  $from$    { "id": "d", "text": "Ordenar o Product Backlog para maximizar o valor" },
    { "id": "e", "text": "Propor casos de teste para uma nova funcionalidade" }$from$,
  $to$    { "id": "d", "text": "Ordenar o Product Backlog para maximizar o valor" }$to$),
  $cfrom$"correct": { "a": "tool", "b": "human", "c": "tool", "d": "human", "e": "tool" },$cfrom$,
  $cto$"correct": { "a": "tool", "b": "human", "c": "tool", "d": "human" },$cto$)
where slug = '06-01-ai-agents-as-tools' and language = 'pt-BR';

-- ---- VERIFICATION (expect 0 rows still containing item "e") ------------------
-- select language from public.lessons
--  where slug = '06-01-ai-agents-as-tools'
--    and content_md like '%Proposing test cases%';
