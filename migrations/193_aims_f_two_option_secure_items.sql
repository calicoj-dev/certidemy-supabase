-- 193_aims_f_two_option_secure_items.sql
--
-- AIMS-F: three secure items were authored as two-option true/false. A guesser
-- scores 50% on each, and all three keyed the same option ("False"), so a
-- candidate who noticed the pattern could answer without reading. They are also
-- invisible to the answer-position guard, which filters to items with three or
-- more options - so the items most vulnerable to position cueing are the ones
-- that check cannot see.
--
-- Nothing in LESSON_AUTHORING_SPEC or verify-cert ever set a minimum option
-- count. The spec now does (commit eb8fdec); a verify-cert invariant is owed.
--
-- Each item keeps its id, question_group_id, task_id, difficulty, bloom_level
-- and status. Only question_text, options and correct_answer change. The
-- discrimination each item was testing is preserved and two genuine near-misses
-- are added from the task's own K field - not padding.
--
-- Safe to rewrite in place: quiz_attempts = 0 and question_concepts = 0 for all
-- nine rows (secure items carry no concept links by design).
--
-- The keys deliberately land on a, c and d - never b - which also removes three
-- b-keyed items from a distribution that currently leans to c.
--
-- pt-BR row 755f0a08 additionally carried the invented acronym SGIA. Fixed here
-- rather than in the catalogue-wide coinage sweep.
--
-- Run in the Supabase SQL editor. Statements are individually re-runnable.

-- ============================================================================
-- GROUP 2599c725 - task 2.8, SoA inclusion is not evidence of implementation
-- Key moves from "b" to "c".
-- ============================================================================

update public.quiz_questions set
  question_text = 'An AIMS manager states that listing a control as ''included'' in the Statement of Applicability is sufficient evidence that the control is operational. An auditor disagrees. Which position is correct, and why?',
  options = '[
    {"id":"a","text":"The manager is correct: recording a control as included in the Statement of Applicability satisfies the implementation requirement."},
    {"id":"b","text":"The manager is correct, provided the Statement of Applicability has been approved by designated management."},
    {"id":"c","text":"The auditor is correct: the Statement of Applicability records which controls are necessary and why, and separate objective evidence must show the control is deployed."},
    {"id":"d","text":"The auditor is correct, but only for controls the organization has classed as high risk."}
  ]'::jsonb,
  correct_answer = '["c"]'::jsonb
where id = 'ee7e18ea-97c9-4a0e-b04d-66bb113f64c5';

update public.quiz_questions set
  question_text = 'Un gerente del sistema de gestión de IA afirma que registrar un control como ''incluido'' en la Declaración de Aplicabilidad es evidencia suficiente de que el control está operativo. Un auditor no está de acuerdo. ¿Qué posición es correcta y por qué?',
  options = '[
    {"id":"a","text":"El gerente tiene razón: registrar un control como incluido en la Declaración de Aplicabilidad satisface el requisito de implementación."},
    {"id":"b","text":"El gerente tiene razón, siempre que la Declaración de Aplicabilidad haya sido aprobada por la dirección designada."},
    {"id":"c","text":"El auditor tiene razón: la Declaración de Aplicabilidad registra qué controles son necesarios y por qué, y se requiere evidencia objetiva independiente que demuestre que el control está desplegado."},
    {"id":"d","text":"El auditor tiene razón, pero únicamente para los controles que la organización haya clasificado como de alto riesgo."}
  ]'::jsonb,
  correct_answer = '["c"]'::jsonb
where id = 'acf22c6a-1ec2-43ce-84a1-1c15c9a33ac6';

update public.quiz_questions set
  question_text = 'Um gestor do sistema de gestão de IA afirma que registrar um controle como ''incluído'' na Declaração de Aplicabilidade é evidência suficiente de que o controle está operacional. Um auditor discorda. Qual posição está correta, e por quê?',
  options = '[
    {"id":"a","text":"O gestor está correto: registrar um controle como incluído na Declaração de Aplicabilidade satisfaz o requisito de implementação."},
    {"id":"b","text":"O gestor está correto, desde que a Declaração de Aplicabilidade tenha sido aprovada pela direção designada."},
    {"id":"c","text":"O auditor está correto: a Declaração de Aplicabilidade registra quais controles são necessários e por quê, e evidências objetivas separadas devem demonstrar que o controle está implantado."},
    {"id":"d","text":"O auditor está correto, mas apenas para os controles que a organização tenha classificado como de alto risco."}
  ]'::jsonb,
  correct_answer = '["c"]'::jsonb
where id = '755f0a08-f507-4eec-ba80-0cfb0087b188';

-- ============================================================================
-- GROUP baeefba0 - task 3.1, competence reaches procurement roles
-- Key moves from "b" to "d".
-- ============================================================================

update public.quiz_questions set
  question_text = 'A procurement manager who selects AI vendors argues she has no competence obligations under ISO/IEC 42001, because she neither develops nor operates AI systems. Which assessment is correct?',
  options = '[
    {"id":"a","text":"She is correct: competence requirements reach only personnel who develop or operate AI systems directly."},
    {"id":"b","text":"She is correct, unless the vendor lacks its own AI management system certification."},
    {"id":"c","text":"She is incorrect, but the requirement applies only where the organization is an AI provider rather than an AI customer."},
    {"id":"d","text":"She is incorrect: competence must be determined for persons whose work affects AI performance, and procurement decisions determine which systems are adopted and how they operate."}
  ]'::jsonb,
  correct_answer = '["d"]'::jsonb
where id = 'f75f5026-0c78-49d0-91f7-940f54c27981';

update public.quiz_questions set
  question_text = 'Una gerente de adquisiciones que selecciona proveedores de IA argumenta que no tiene obligaciones de competencia bajo ISO/IEC 42001, porque no desarrolla ni opera sistemas de IA. ¿Qué evaluación es correcta?',
  options = '[
    {"id":"a","text":"Tiene razón: los requisitos de competencia alcanzan únicamente al personal que desarrolla u opera sistemas de IA de forma directa."},
    {"id":"b","text":"Tiene razón, salvo que el proveedor carezca de certificación propia de su sistema de gestión de IA."},
    {"id":"c","text":"No tiene razón, pero el requisito aplica solo cuando la organización es proveedora de IA y no cliente de IA."},
    {"id":"d","text":"No tiene razón: la competencia debe determinarse para las personas cuyo trabajo afecta el desempeño de la IA, y las decisiones de adquisición determinan qué sistemas se adoptan y cómo operan."}
  ]'::jsonb,
  correct_answer = '["d"]'::jsonb
where id = '6a5bcc75-35a6-409d-bae0-a5dbc19cec28';

update public.quiz_questions set
  question_text = 'Uma gerente de compras que seleciona fornecedores de IA argumenta que não possui obrigações de competência sob a ISO/IEC 42001, pois não desenvolve nem opera sistemas de IA. Qual avaliação está correta?',
  options = '[
    {"id":"a","text":"Ela está correta: os requisitos de competência alcançam apenas o pessoal que desenvolve ou opera sistemas de IA diretamente."},
    {"id":"b","text":"Ela está correta, a menos que o fornecedor não possua certificação própria do seu sistema de gestão de IA."},
    {"id":"c","text":"Ela está incorreta, mas o requisito se aplica somente quando a organização é fornecedora de IA e não cliente de IA."},
    {"id":"d","text":"Ela está incorreta: a competência deve ser determinada para pessoas cujo trabalho afeta o desempenho da IA, e as decisões de compras determinam quais sistemas são adotados e como operam."}
  ]'::jsonb,
  correct_answer = '["d"]'::jsonb
where id = '399993b5-3703-4cc1-b7c6-1a35ec8c7490';

-- ============================================================================
-- GROUP e8354d1c - task 3.1, competence reaches top management
-- Key moves from "b" to "a".
-- ============================================================================

update public.quiz_questions set
  question_text = 'Top management deploying AI-driven hiring tools states that it has no competence obligations under ISO/IEC 42001, because leadership accountability is handled through the governance clauses. Which assessment is correct?',
  options = '[
    {"id":"a","text":"Incorrect: competence must be determined for all persons doing work under the organization''s control that affects AI performance, and managerial decision-making is such work."},
    {"id":"b","text":"Correct: the governance clauses address leadership, so competence requirements fall to operational staff."},
    {"id":"c","text":"Incorrect, but the obligation is satisfied by the leadership commitment recorded in the AI policy."},
    {"id":"d","text":"Correct, provided top management has assigned the authority for reporting AIMS performance to a competent person."}
  ]'::jsonb,
  correct_answer = '["a"]'::jsonb
where id = '88ef5543-1260-4898-8aab-2ef1926cce4f';

update public.quiz_questions set
  question_text = 'La alta dirección que despliega herramientas de contratación basadas en IA afirma que no tiene obligaciones de competencia bajo ISO/IEC 42001, porque la responsabilidad del liderazgo se gestiona mediante las cláusulas de gobernanza. ¿Qué evaluación es correcta?',
  options = '[
    {"id":"a","text":"Incorrecta: la competencia debe determinarse para todas las personas que realizan trabajo bajo el control de la organización y que afecta el desempeño de la IA, y la toma de decisiones directiva es ese tipo de trabajo."},
    {"id":"b","text":"Correcta: las cláusulas de gobernanza abordan el liderazgo, por lo que los requisitos de competencia recaen en el personal operativo."},
    {"id":"c","text":"Incorrecta, pero la obligación se satisface con el compromiso de liderazgo registrado en la política de IA."},
    {"id":"d","text":"Correcta, siempre que la alta dirección haya asignado la autoridad para informar el desempeño del sistema de gestión de IA a una persona competente."}
  ]'::jsonb,
  correct_answer = '["a"]'::jsonb
where id = '915445c4-5781-4d6c-b5ed-b270bc23f167';

update public.quiz_questions set
  question_text = 'A alta direção que implanta ferramentas de contratação baseadas em IA afirma não ter obrigações de competência sob a ISO/IEC 42001, pois a responsabilidade da liderança é tratada pelas cláusulas de governança. Qual avaliação está correta?',
  options = '[
    {"id":"a","text":"Incorreta: a competência deve ser determinada para todas as pessoas que realizam trabalho sob o controle da organização e que afeta o desempenho da IA, e a tomada de decisão gerencial é esse tipo de trabalho."},
    {"id":"b","text":"Correta: as cláusulas de governança tratam da liderança, portanto os requisitos de competência recaem sobre o pessoal operacional."},
    {"id":"c","text":"Incorreta, mas a obrigação é satisfeita pelo compromisso de liderança registrado na política de IA."},
    {"id":"d","text":"Correta, desde que a alta direção tenha atribuído a autoridade para relatar o desempenho do sistema de gestão de IA a uma pessoa competente."}
  ]'::jsonb,
  correct_answer = '["a"]'::jsonb
where id = 'c6b0c966-9306-4cc6-9b78-4d57c2124d78';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. No secure item in the catalogue has fewer than four options. Expect 0 rows.
select c.code, q.language, q.id, jsonb_array_length(q.options) as n_options
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where q.pool = 'secure' and jsonb_array_length(q.options) < 4
order by c.code, q.language;

-- 2. Every key resolves to an option that exists. Expect 0 rows.
select q.id, q.language, q.correct_answer
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'AIMS-F'
  and not exists (select 1 from jsonb_array_elements(q.options) o
                  where o->>'id' = q.correct_answer->>0);

-- 3. The three groups still hold three language rows each. Expect 3/3/3.
select q.question_group_id, count(*) as rows, count(distinct q.language) as langs
from public.quiz_questions q
where q.question_group_id in (
  '2599c725-5f56-4d2d-94c6-b8bec958694e',
  'baeefba0-f6b2-47b1-a6c2-78d54edfd586',
  'e8354d1c-497d-40e1-a22d-56172032614f')
group by q.question_group_id;

-- 4. The new secure-en position distribution, on the full 280.
select q.correct_answer->>0 as key, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'AIMS-F' and q.pool = 'secure' and q.language = 'en'
group by 1 order by 1;
