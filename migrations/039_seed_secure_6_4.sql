-- 039_seed_secure_6_4.sql
-- =============================================================================
-- SECURE pool: 8 fresh questions for task 6.4 (concepts empiricism-under-
-- acceleration + sm-safeguards-inspection). Distinct from the practice pool.
-- en + es-419 + pt-BR; shared question_group_id (prefix 5ec6...) + same
-- correct_answer/option ids across languages. pool='secure', is_exam_scope=true.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.4'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- S1 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000001$g$,'en',
   $t$A team triples output with AI but keeps the same review and Retrospective capacity. The most likely effect on its empiricism is that it:$t$,
   $o$[{"id":"a","text":"Strengthens proportionally with the output"},{"id":"b","text":"Is strained, because learning cannot keep pace with production"},{"id":"c","text":"Is unchanged"},{"id":"d","text":"Becomes automated"}]$o$,
   $a$["b"]$a$,
   $e$Empiricism is paced by inspect-and-adapt; production outrunning it strains the loop.$e$,3,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000001$g$,'es-419',
   $t$Un equipo triplica la salida con IA pero mantiene la misma capacidad de revisión y Retrospective. El efecto más probable sobre su empirismo es que:$t$,
   $o$[{"id":"a","text":"Se fortalece proporcionalmente con la salida"},{"id":"b","text":"Se tensiona, porque el aprendizaje no puede seguir el ritmo de la producción"},{"id":"c","text":"No cambia"},{"id":"d","text":"Se automatiza"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo va al ritmo del inspeccionar y adaptar; la producción que lo supera tensiona el ciclo.$e$,3,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Um time triplica a saída com IA mas mantém a mesma capacidade de revisão e Retrospective. O efeito mais provável sobre seu empirismo é que ele:$t$,
   $o$[{"id":"a","text":"Fortalece proporcionalmente à saída"},{"id":"b","text":"É tensionado, porque o aprendizado não consegue acompanhar a produção"},{"id":"c","text":"Não muda"},{"id":"d","text":"Torna-se automatizado"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo é no ritmo do inspecionar e adaptar; a produção que o supera tensiona o ciclo.$e$,3,$b$3_apply$b$),

  -- S2 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000002$g$,'en',
   $t$Under an AI-driven output surge, a Scrum Master's priority is to:$t$,
   $o$[{"id":"a","text":"Maximize the number of merged pull requests"},{"id":"b","text":"Protect the team's capacity to inspect and adapt"},{"id":"c","text":"Shorten the Retrospective"},{"id":"d","text":"Track velocity more closely"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Master safeguards inspect-and-adapt, not raw throughput.$e$,2,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000002$g$,'es-419',
   $t$Ante un aumento de salida impulsado por IA, la prioridad de un Scrum Master es:$t$,
   $o$[{"id":"a","text":"Maximizar la cantidad de pull requests fusionados"},{"id":"b","text":"Proteger la capacidad del equipo de inspeccionar y adaptarse"},{"id":"c","text":"Acortar la Retrospective"},{"id":"d","text":"Seguir la velocity más de cerca"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Master protege el inspeccionar y adaptar, no el rendimiento bruto.$e$,2,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Diante de um aumento de saída impulsionado por IA, a prioridade de um Scrum Master é:$t$,
   $o$[{"id":"a","text":"Maximizar a quantidade de pull requests integrados"},{"id":"b","text":"Proteger a capacidade do time de inspecionar e adaptar"},{"id":"c","text":"Encurtar a Retrospective"},{"id":"d","text":"Acompanhar a velocity mais de perto"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Master protege o inspecionar e adaptar, não o rendimento bruto.$e$,2,$b$3_apply$b$),

  -- S3 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000003$g$,'en',
   $t$Why can a Sprint with record output still be failing empirically?$t$,
   $o$[{"id":"a","text":"Output and empiricism are unrelated"},{"id":"b","text":"If work is produced faster than it can be inspected and learned from, the team ships without adapting"},{"id":"c","text":"Record output always indicates a problem"},{"id":"d","text":"The Sprint Goal was too small"}]$o$,
   $a$["b"]$a$,
   $e$High output with no real inspection means produce-without-learning — the empirical loop has been outrun.$e$,4,$b$4_analyze$b$),
  ($g$5ec60604-0000-4000-8000-000000000003$g$,'es-419',
   $t$¿Por qué un Sprint con salida récord puede estar fallando empíricamente?$t$,
   $o$[{"id":"a","text":"La salida y el empirismo no se relacionan"},{"id":"b","text":"Si el trabajo se produce más rápido de lo que se puede inspeccionar y aprender, el equipo entrega sin adaptarse"},{"id":"c","text":"La salida récord siempre indica un problema"},{"id":"d","text":"El Sprint Goal era muy pequeño"}]$o$,
   $a$["b"]$a$,
   $e$Alta salida sin inspección real significa producir sin aprender: el ciclo empírico quedó atrás.$e$,4,$b$4_analyze$b$),
  ($g$5ec60604-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Por que um Sprint com saída recorde pode estar falhando empiricamente?$t$,
   $o$[{"id":"a","text":"Saída e empirismo não se relacionam"},{"id":"b","text":"Se o trabalho é produzido mais rápido do que se pode inspecionar e aprender, o time entrega sem adaptar"},{"id":"c","text":"Saída recorde sempre indica um problema"},{"id":"d","text":"O Sprint Goal era pequeno demais"}]$o$,
   $a$["b"]$a$,
   $e$Alta saída sem inspeção real significa produzir sem aprender: o ciclo empírico ficou para trás.$e$,4,$b$4_analyze$b$),

  -- S4 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000004$g$,'en',
   $t$A team wants to mark a very large AI-built Increment "Done" without inspecting it. The Scrum Master should:$t$,
   $o$[{"id":"a","text":"Approve it; its size implies completeness"},{"id":"b","text":"Help the team see that un-inspected work is not Done regardless of volume"},{"id":"c","text":"Inspect it alone and decide for the team"},{"id":"d","text":"Defer to the AI's own checks"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Master defends that an Increment the team has not genuinely inspected is not Done, however large.$e$,3,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000004$g$,'es-419',
   $t$Un equipo quiere marcar como "Done" un Increment muy grande construido por IA sin inspeccionarlo. El Scrum Master debería:$t$,
   $o$[{"id":"a","text":"Aprobarlo; su tamaño implica que está completo"},{"id":"b","text":"Ayudar al equipo a ver que el trabajo no inspeccionado no está Done sin importar el volumen"},{"id":"c","text":"Inspeccionarlo solo y decidir por el equipo"},{"id":"d","text":"Ceder a las verificaciones de la propia IA"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Master defiende que un Increment que el equipo no inspeccionó de verdad no está Done, por grande que sea.$e$,3,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$Um time quer marcar como "Done" um Increment muito grande construído por IA sem inspecioná-lo. O Scrum Master deveria:$t$,
   $o$[{"id":"a","text":"Aprová-lo; seu tamanho implica que está completo"},{"id":"b","text":"Ajudar o time a ver que trabalho não inspecionado não está Done não importa o volume"},{"id":"c","text":"Inspecioná-lo sozinho e decidir pelo time"},{"id":"d","text":"Ceder às verificações da própria IA"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Master defende que um Increment que o time não inspecionou de verdade não está Done, por maior que seja.$e$,3,$b$3_apply$b$),

  -- S5 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000005$g$,'en',
   $t$Why can't AI scale a team's inspection the way it scales generation?$t$,
   $o$[{"id":"a","text":"Inspection tools do not exist"},{"id":"b","text":"Genuine inspection and understanding are human-paced"},{"id":"c","text":"The Scrum Guide caps inspection"},{"id":"d","text":"Inspection is already fully automated"}]$o$,
   $a$["b"]$a$,
   $e$Generation scales with AI; the human work of inspecting and understanding does not.$e$,2,$b$2_understand$b$),
  ($g$5ec60604-0000-4000-8000-000000000005$g$,'es-419',
   $t$¿Por qué la IA no puede escalar la inspección de un equipo como escala la generación?$t$,
   $o$[{"id":"a","text":"No existen herramientas de inspección"},{"id":"b","text":"La inspección y el entendimiento genuinos van a ritmo humano"},{"id":"c","text":"La Guía de Scrum limita la inspección"},{"id":"d","text":"La inspección ya está totalmente automatizada"}]$o$,
   $a$["b"]$a$,
   $e$La generación escala con la IA; el trabajo humano de inspeccionar y entender no.$e$,2,$b$2_understand$b$),
  ($g$5ec60604-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Por que a IA não consegue escalar a inspeção de um time como escala a geração?$t$,
   $o$[{"id":"a","text":"Ferramentas de inspeção não existem"},{"id":"b","text":"A inspeção e o entendimento genuínos são em ritmo humano"},{"id":"c","text":"O Guia do Scrum limita a inspeção"},{"id":"d","text":"A inspeção já é totalmente automatizada"}]$o$,
   $a$["b"]$a$,
   $e$A geração escala com a IA; o trabalho humano de inspecionar e entender não.$e$,2,$b$2_understand$b$),

  -- S6 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000006$g$,'en',
   $t$Generation has outrun review for three Sprints, and the team proposes skipping inspection to clear the gap. The best Scrum Master move is to:$t$,
   $o$[{"id":"a","text":"Support skipping inspection temporarily"},{"id":"b","text":"Surface the imbalance and support slowing generation rather than dropping inspection"},{"id":"c","text":"Increase generation further to power through"},{"id":"d","text":"Remove the Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Master keeps inspection intact, helping the team rebalance by slowing generation, not by cutting inspection.$e$,3,$b$4_analyze$b$),
  ($g$5ec60604-0000-4000-8000-000000000006$g$,'es-419',
   $t$La generación superó a la revisión durante tres Sprints y el equipo propone saltarse la inspección para cerrar la brecha. El mejor movimiento del Scrum Master es:$t$,
   $o$[{"id":"a","text":"Apoyar saltarse la inspección de forma temporal"},{"id":"b","text":"Sacar a la luz el desbalance y apoyar reducir la generación en vez de abandonar la inspección"},{"id":"c","text":"Aumentar aún más la generación para salir adelante"},{"id":"d","text":"Eliminar la Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Master mantiene intacta la inspección, ayudando al equipo a reequilibrar reduciendo la generación, no recortando la inspección.$e$,3,$b$4_analyze$b$),
  ($g$5ec60604-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$A geração superou a revisão por três Sprints, e o time propõe pular a inspeção para fechar a lacuna. O melhor movimento do Scrum Master é:$t$,
   $o$[{"id":"a","text":"Apoiar pular a inspeção temporariamente"},{"id":"b","text":"Trazer à tona o desequilíbrio e apoiar reduzir a geração em vez de abandonar a inspeção"},{"id":"c","text":"Aumentar ainda mais a geração para seguir em frente"},{"id":"d","text":"Remover a Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Master mantém a inspeção intacta, ajudando o time a reequilibrar reduzindo a geração, não cortando a inspeção.$e$,3,$b$4_analyze$b$),

  -- S7 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000007$g$,'en',
   $t$"More output equals more empiricism" is:$t$,
   $o$[{"id":"a","text":"True"},{"id":"b","text":"False — empiricism is the inspect-and-adapt loop, not volume"},{"id":"c","text":"True when AI produces the output"},{"id":"d","text":"True only in short Sprints"}]$o$,
   $a$["b"]$a$,
   $e$Empiricism is measured by inspect-and-adapt, not by how much is produced.$e$,1,$b$2_understand$b$),
  ($g$5ec60604-0000-4000-8000-000000000007$g$,'es-419',
   $t$"Más salida equivale a más empirismo" es:$t$,
   $o$[{"id":"a","text":"Verdadero"},{"id":"b","text":"Falso: el empirismo es el ciclo de inspeccionar y adaptar, no el volumen"},{"id":"c","text":"Verdadero cuando la IA produce la salida"},{"id":"d","text":"Verdadero solo en Sprints cortos"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo se mide por el inspeccionar y adaptar, no por cuánto se produce.$e$,1,$b$2_understand$b$),
  ($g$5ec60604-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$"Mais saída equivale a mais empirismo" é:$t$,
   $o$[{"id":"a","text":"Verdadeiro"},{"id":"b","text":"Falso: o empirismo é o ciclo de inspecionar e adaptar, não o volume"},{"id":"c","text":"Verdadeiro quando a IA produz a saída"},{"id":"d","text":"Verdadeiro só em Sprints curtos"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo se mede pelo inspecionar e adaptar, não por quanto se produz.$e$,1,$b$2_understand$b$),

  -- S8 ----------------------------------------------------------------------
  ($g$5ec60604-0000-4000-8000-000000000008$g$,'en',
   $t$Keeping inspection in pace while using AI heavily gives a team:$t$,
   $o$[{"id":"a","text":"Less capacity, but safer"},{"id":"b","text":"More capacity with empiricism intact"},{"id":"c","text":"The same capacity as before"},{"id":"d","text":"A shorter Sprint"}]$o$,
   $a$["b"]$a$,
   $e$AI plus paced inspection raises capacity while keeping the empirical loop whole.$e$,3,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000008$g$,'es-419',
   $t$Mantener la inspección al ritmo mientras se usa IA intensamente le da a un equipo:$t$,
   $o$[{"id":"a","text":"Menos capacidad, pero más seguro"},{"id":"b","text":"Más capacidad con el empirismo intacto"},{"id":"c","text":"La misma capacidad que antes"},{"id":"d","text":"Un Sprint más corto"}]$o$,
   $a$["b"]$a$,
   $e$IA más inspección al ritmo eleva la capacidad mientras mantiene entero el ciclo empírico.$e$,3,$b$3_apply$b$),
  ($g$5ec60604-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Manter a inspeção no ritmo enquanto se usa IA intensamente dá a um time:$t$,
   $o$[{"id":"a","text":"Menos capacidade, mas mais seguro"},{"id":"b","text":"Mais capacidade com o empirismo intacto"},{"id":"c","text":"A mesma capacidade de antes"},{"id":"d","text":"Um Sprint mais curto"}]$o$,
   $a$["b"]$a$,
   $e$IA mais inspeção no ritmo eleva a capacidade enquanto mantém o ciclo empírico inteiro.$e$,3,$b$3_apply$b$)
)
insert into public.quiz_questions
  (certification_id, module_id, question_text, question_type, options, correct_answer,
   explanation, difficulty, bloom_level, is_exam_scope, task_id, status, question_group_id, language, pool)
select
  '11111111-1111-1111-1111-111111111111', null, q.qtext, 'single_choice'::question_type,
  q.opts::jsonb, q.ans::jsonb, q.expl, q.diff::smallint, q.bloom::bloom_level,
  true, task.task_id, 'approved', q.grp::uuid, q.lang, 'secure'
from q cross join task
where not exists (
  select 1 from public.quiz_questions e
  where e.question_group_id = q.grp::uuid and e.language = q.lang
);

-- ---- VALIDATION (expect 8/8/8, then 0 rows, then 0 rows) ---------------------
-- select language, count(*) from public.quiz_questions
--  where pool='secure' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.4')
--  group by language order by language;
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like '5ec60604-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
-- select question_group_id from public.quiz_questions
--  where question_group_id::text like '5ec60604-%'
--  group by question_group_id having count(distinct correct_answer::text) > 1;
