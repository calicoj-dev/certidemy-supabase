-- 201_isms_ia_two_option_item.sql
--
-- ONE SECURE GROUP IN ISMS-IA SHIPPED AS TRUE/FALSE.
--
-- Group db194a3c, task 1.5 (2_understand), three language rows. It reads:
--
--   "An auditor needs the definition of 'corrective action' while reviewing ISMS
--    findings. ISO/IEC 27001 Clause 3 is the correct source for this definition.
--    Is this statement true or false?"   [True / False]
--
-- A candidate who knows nothing scores 50%. The tier-2 true_false ban added to
-- draftSystem only fires on 4_analyze tasks, and 1.5 is 2_understand, so this
-- item was generated under the Level I contract where true_false is still
-- permitted. verify-cert's option-floor invariant catches it regardless, which
-- is the check doing exactly what it was written for.
--
-- WHAT IT TESTS IS WORTH TESTING. ISO/IEC 27001 clause 3 contains no standalone
-- definitions - it points to ISO/IEC 27000 through an UNDATED normative
-- reference, so the current edition of 27000 always applies. An auditor who
-- looks for "corrective action" inside 27001 will not find it. That is a real
-- and useful discrimination; it was simply written as a coin flip.
--
-- THE REWRITE. Four options, each a document an auditor might plausibly reach
-- for, one correct on the merits. This is a Level I item and should stay one:
-- task 1.5 asks the candidate to attribute a statement to the document that
-- actually contains it, and there is exactly one right answer.
--
--   - ISO/IEC 27001 Clause 3 - the misconception the original item tested
--   - ISO 19011 Clause 3 - real, but defines terms for auditing guidance
--   - ISO/IEC 27002 - real, but explains controls rather than defining
--     management-system terms
--   - ISO/IEC 27000 - correct
--
-- The key is placed at "d". The secure/en distribution currently runs
-- 27.1 / 26.4 / 24.8 / 21.8, so d is the thinnest position and this nudges it
-- toward even rather than away.
--
-- Rewritten in place rather than retired: quiz_attempts = 0 for this cert, so
-- migration 089's rule does not bind. Nothing is being edited out from under a
-- candidate's answer.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. GUARD. Expect exactly 3 rows, all 2 options, group db194a3c.
-- ============================================================================

select q.id, q.language, jsonb_array_length(q.options) as n_opts, q.correct_answer
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.retired_at is null
  and jsonb_array_length(q.options) < 4
order by q.language;

-- ============================================================================
-- 2. ENGLISH
-- ============================================================================

update public.quiz_questions set
  question_text = 'An internal auditor reviewing ISMS findings needs the authoritative definition of ''corrective action''. Which document supplies it?',
  options = '[
    {"id":"a","text":"ISO/IEC 27001 Clause 3, which sets out the definitions used throughout the requirements."},
    {"id":"b","text":"ISO 19011 Clause 3, which defines the terms used in management system auditing."},
    {"id":"c","text":"ISO/IEC 27002, which defines each term alongside the control it applies to."},
    {"id":"d","text":"ISO/IEC 27000, which ISO/IEC 27001 Clause 3 references undated for all terms and definitions."}
  ]'::jsonb,
  correct_answer = '["d"]'::jsonb,
  explanation = 'ISO/IEC 27001 Clause 3 carries no standalone definitions - it points to ISO/IEC 27000 through an undated normative reference, so the current edition of 27000 always applies. ISO 19011 defines terms for its own auditing guidance, and ISO/IEC 27002 explains how controls are implemented rather than defining management-system terms.'
where id = '8deb4b63-5d8b-4dbe-8eda-4f01bdec75b5';

-- ============================================================================
-- 3. es-419
-- ============================================================================

update public.quiz_questions set
  question_text = 'Un auditor interno que revisa los hallazgos del SGSI necesita la definición autorizada de ''acción correctiva''. ¿Qué documento la proporciona?',
  options = '[
    {"id":"a","text":"La Cláusula 3 de ISO/IEC 27001, que establece las definiciones usadas en todos los requisitos."},
    {"id":"b","text":"La Cláusula 3 de ISO 19011, que define los términos usados en la auditoría de sistemas de gestión."},
    {"id":"c","text":"ISO/IEC 27002, que define cada término junto al control al que se aplica."},
    {"id":"d","text":"ISO/IEC 27000, al que la Cláusula 3 de ISO/IEC 27001 remite sin fecha para todos los términos y definiciones."}
  ]'::jsonb,
  correct_answer = '["d"]'::jsonb,
  explanation = 'La Cláusula 3 de ISO/IEC 27001 no contiene definiciones independientes: remite a ISO/IEC 27000 mediante una referencia normativa sin fecha, por lo que siempre aplica la edición vigente de 27000. ISO 19011 define términos para su propia orientación de auditoría, e ISO/IEC 27002 explica cómo se implementan los controles en lugar de definir términos del sistema de gestión.'
where id = '2f30803d-1778-463b-8771-90b234829eb5';

-- ============================================================================
-- 4. pt-BR
-- ============================================================================

update public.quiz_questions set
  question_text = 'Um auditor interno que revisa as constatações do SGSI precisa da definição autorizada de ''ação corretiva''. Qual documento a fornece?',
  options = '[
    {"id":"a","text":"A Cláusula 3 da ISO/IEC 27001, que estabelece as definições usadas em todos os requisitos."},
    {"id":"b","text":"A Cláusula 3 da ISO 19011, que define os termos usados na auditoria de sistemas de gestão."},
    {"id":"c","text":"A ISO/IEC 27002, que define cada termo junto ao controle a que se aplica."},
    {"id":"d","text":"A ISO/IEC 27000, à qual a Cláusula 3 da ISO/IEC 27001 remete sem data para todos os termos e definições."}
  ]'::jsonb,
  correct_answer = '["d"]'::jsonb,
  explanation = 'A Cláusula 3 da ISO/IEC 27001 não contém definições independentes: ela remete à ISO/IEC 27000 por meio de uma referência normativa sem data, de modo que a edição vigente da 27000 sempre se aplica. A ISO 19011 define termos para sua própria orientação de auditoria, e a ISO/IEC 27002 explica como os controles são implementados em vez de definir termos do sistema de gestão.'
where id = 'd974f30f-39cc-4000-b488-9d7eb1a12388';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 5. No live item in the catalogue has fewer than four options. Expect 0 rows.
select c.code, q.pool, q.language, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where jsonb_array_length(q.options) < 4 and q.retired_at is null
group by c.code, q.pool, q.language;

-- 6. The group holds three language rows, all four options, all keyed d.
select q.language, jsonb_array_length(q.options) as n_opts, q.correct_answer,
       left(q.question_text, 70) as stem
from public.quiz_questions q
where q.question_group_id = 'db194a3c-2e5a-4c09-9b7d-cbaed532ac3c'
order by q.language;

-- 7. Every key still resolves to an option that exists. Expect 0 rows.
select q.id, q.language
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.retired_at is null
  and not exists (select 1 from jsonb_array_elements(q.options) o
                  where o->>'id' = q.correct_answer->>0);

-- 8. Secure/en position distribution after the move to d.
select q.correct_answer->>0 as key, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.pool = 'secure' and q.language = 'en'
  and q.retired_at is null
group by 1 order by 1;
