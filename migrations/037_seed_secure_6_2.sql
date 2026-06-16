-- 037_seed_secure_6_2.sql
-- =============================================================================
-- SECURE pool: 8 fresh questions for task 6.2 (concepts dod-applies-to-ai-output
-- + increment-transparency-ai). Distinct from the practice pool.
-- en + es-419 + pt-BR; shared question_group_id (prefix 5ec6...) + same
-- correct_answer/option ids across languages. pool='secure', is_exam_scope=true.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.2'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- S1 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000001$g$,'en',
   $t$An AI generates an entire feature overnight. Before it can count toward the Increment, it must:$t$,
   $o$[{"id":"a","text":"Be merged immediately to save time"},{"id":"b","text":"Meet the team's full Definition of Done, judged by the Developers"},{"id":"c","text":"Pass only a syntax check"},{"id":"d","text":"Be approved by the AI vendor"}]$o$,
   $a$["b"]$a$,
   $e$AI output counts toward the Increment only when the Developers judge it meets the full Definition of Done.$e$,3,$b$3_apply$b$),
  ($g$5ec60602-0000-4000-8000-000000000001$g$,'es-419',
   $t$Una IA genera una funcionalidad completa durante la noche. Antes de poder contar para el Increment, debe:$t$,
   $o$[{"id":"a","text":"Fusionarse de inmediato para ahorrar tiempo"},{"id":"b","text":"Cumplir la Definition of Done completa del equipo, juzgada por los Developers"},{"id":"c","text":"Pasar solo una verificación de sintaxis"},{"id":"d","text":"Ser aprobada por el proveedor de la IA"}]$o$,
   $a$["b"]$a$,
   $e$La salida de IA cuenta para el Increment solo cuando los Developers juzgan que cumple la Definition of Done completa.$e$,3,$b$3_apply$b$),
  ($g$5ec60602-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Uma IA gera uma funcionalidade inteira durante a noite. Antes de poder contar para o Increment, ela deve:$t$,
   $o$[{"id":"a","text":"Ser integrada imediatamente para economizar tempo"},{"id":"b","text":"Cumprir a Definition of Done completa do time, julgada pelos Developers"},{"id":"c","text":"Passar só em uma verificação de sintaxe"},{"id":"d","text":"Ser aprovada pelo fornecedor da IA"}]$o$,
   $a$["b"]$a$,
   $e$A saída de IA conta para o Increment apenas quando os Developers julgam que cumpre a Definition of Done completa.$e$,3,$b$3_apply$b$),

  -- S2 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000002$g$,'en',
   $t$Using "an AI wrote it" as a reason to skip a Definition of Done criterion is:$t$,
   $o$[{"id":"a","text":"Acceptable for low-risk code"},{"id":"b","text":"Never a valid shortcut — the Definition of Done applies regardless of author"},{"id":"c","text":"Fine as long as tests pass"},{"id":"d","text":"Allowed once per Sprint"}]$o$,
   $a$["b"]$a$,
   $e$The Definition of Done applies equally to AI work; authorship is never a shortcut around a criterion.$e$,2,$b$2_understand$b$),
  ($g$5ec60602-0000-4000-8000-000000000002$g$,'es-419',
   $t$Usar "lo escribió una IA" como razón para saltarse un criterio de la Definition of Done es:$t$,
   $o$[{"id":"a","text":"Aceptable para código de bajo riesgo"},{"id":"b","text":"Nunca un atajo válido: la Definition of Done se aplica sin importar el autor"},{"id":"c","text":"Está bien mientras pasen las pruebas"},{"id":"d","text":"Permitido una vez por Sprint"}]$o$,
   $a$["b"]$a$,
   $e$La Definition of Done se aplica por igual al trabajo de IA; la autoría nunca es un atajo para saltarse un criterio.$e$,2,$b$2_understand$b$),
  ($g$5ec60602-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Usar "foi uma IA que escreveu" como razão para pular um critério da Definition of Done é:$t$,
   $o$[{"id":"a","text":"Aceitável para código de baixo risco"},{"id":"b","text":"Nunca um atalho válido: a Definition of Done se aplica não importa o autor"},{"id":"c","text":"Tudo bem desde que os testes passem"},{"id":"d","text":"Permitido uma vez por Sprint"}]$o$,
   $a$["b"]$a$,
   $e$A Definition of Done se aplica igualmente ao trabalho de IA; a autoria nunca é um atalho para pular um critério.$e$,2,$b$2_understand$b$),

  -- S3 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000003$g$,'en',
   $t$A team can no longer say how a critical module of the Increment was produced or whether anyone verified it. This most directly undermines:$t$,
   $o$[{"id":"a","text":"The Sprint timebox"},{"id":"b","text":"Transparency, on which inspection depends"},{"id":"c","text":"Velocity"},{"id":"d","text":"The Product Goal"}]$o$,
   $a$["b"]$a$,
   $e$If the work behind the Increment is not visible and verifiable, transparency is lost and inspection cannot function.$e$,4,$b$4_analyze$b$),
  ($g$5ec60602-0000-4000-8000-000000000003$g$,'es-419',
   $t$Un equipo ya no puede decir cómo se produjo un módulo crítico del Increment ni si alguien lo verificó. Esto socava más directamente:$t$,
   $o$[{"id":"a","text":"El timebox del Sprint"},{"id":"b","text":"La transparencia, de la que depende la inspección"},{"id":"c","text":"La velocity"},{"id":"d","text":"El Product Goal"}]$o$,
   $a$["b"]$a$,
   $e$Si el trabajo detrás del Increment no es visible y verificable, se pierde la transparencia y la inspección no puede funcionar.$e$,4,$b$4_analyze$b$),
  ($g$5ec60602-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Um time não consegue mais dizer como um módulo crítico do Increment foi produzido nem se alguém o verificou. Isso mina mais diretamente:$t$,
   $o$[{"id":"a","text":"O timebox do Sprint"},{"id":"b","text":"A transparência, da qual a inspeção depende"},{"id":"c","text":"A velocity"},{"id":"d","text":"O Product Goal"}]$o$,
   $a$["b"]$a$,
   $e$Se o trabalho por trás do Increment não é visível e verificável, a transparência se perde e a inspeção não funciona.$e$,4,$b$4_analyze$b$),

  -- S4 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000004$g$,'en',
   $t$Automated tests passing on AI code means:$t$,
   $o$[{"id":"a","text":"The work is Done"},{"id":"b","text":"One part of the Definition of Done may be satisfied, but the full standard is still judged by the Developers"},{"id":"c","text":"Review can be skipped"},{"id":"d","text":"The AI is accountable for it"}]$o$,
   $a$["b"]$a$,
   $e$Passing tests is part of the Definition of Done, not the whole; Done is the Developers' judgment of the full standard.$e$,1,$b$2_understand$b$),
  ($g$5ec60602-0000-4000-8000-000000000004$g$,'es-419',
   $t$Que las pruebas automatizadas pasen en código de IA significa:$t$,
   $o$[{"id":"a","text":"El trabajo está Done"},{"id":"b","text":"Una parte de la Definition of Done puede estar satisfecha, pero el estándar completo todavía lo juzgan los Developers"},{"id":"c","text":"Se puede saltar la revisión"},{"id":"d","text":"La IA es responsable de ello"}]$o$,
   $a$["b"]$a$,
   $e$Pasar las pruebas es parte de la Definition of Done, no su totalidad; Done es el juicio de los Developers sobre el estándar completo.$e$,1,$b$2_understand$b$),
  ($g$5ec60602-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$Os testes automatizados passarem no código de IA significa:$t$,
   $o$[{"id":"a","text":"O trabalho está Done"},{"id":"b","text":"Uma parte da Definition of Done pode estar satisfeita, mas o padrão completo ainda é julgado pelos Developers"},{"id":"c","text":"A revisão pode ser pulada"},{"id":"d","text":"A IA é responsável por ele"}]$o$,
   $a$["b"]$a$,
   $e$Passar nos testes é parte da Definition of Done, não o todo; Done é o julgamento dos Developers sobre o padrão completo.$e$,1,$b$2_understand$b$),

  -- S5 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000005$g$,'en',
   $t$To keep AI contributions transparent, a team should:$t$,
   $o$[{"id":"a","text":"Hide which code was AI-generated to avoid bias"},{"id":"b","text":"Keep the prompts and context and review AI output as carefully as any external contribution"},{"id":"c","text":"Trust the model's confidence score"},{"id":"d","text":"Skip review to move faster"}]$o$,
   $a$["b"]$a$,
   $e$Transparency means keeping AI contributions inspectable and honest about what was machine-generated and verified.$e$,3,$b$3_apply$b$),
  ($g$5ec60602-0000-4000-8000-000000000005$g$,'es-419',
   $t$Para mantener transparentes las contribuciones de IA, un equipo debería:$t$,
   $o$[{"id":"a","text":"Ocultar qué código fue generado por IA para evitar sesgo"},{"id":"b","text":"Conservar los prompts y el contexto y revisar la salida de IA con el mismo cuidado que cualquier contribución externa"},{"id":"c","text":"Confiar en el puntaje de confianza del modelo"},{"id":"d","text":"Saltar la revisión para ir más rápido"}]$o$,
   $a$["b"]$a$,
   $e$La transparencia significa mantener las contribuciones de IA inspeccionables y honestas sobre qué fue generado por máquina y verificado.$e$,3,$b$3_apply$b$),
  ($g$5ec60602-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Para manter as contribuições de IA transparentes, um time deveria:$t$,
   $o$[{"id":"a","text":"Esconder qual código foi gerado por IA para evitar viés"},{"id":"b","text":"Guardar os prompts e o contexto e revisar a saída de IA com o mesmo cuidado de qualquer contribuição externa"},{"id":"c","text":"Confiar na pontuação de confiança do modelo"},{"id":"d","text":"Pular a revisão para ir mais rápido"}]$o$,
   $a$["b"]$a$,
   $e$Transparência significa manter as contribuições de IA inspecionáveis e honestas sobre o que foi gerado por máquina e verificado.$e$,3,$b$3_apply$b$),

  -- S6 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000006$g$,'en',
   $t$A team's AI output volume is five times normal. The right effect on the Definition of Done is:$t$,
   $o$[{"id":"a","text":"Relax it to keep up"},{"id":"b","text":"None — the standard holds regardless of volume"},{"id":"c","text":"Suspend it for AI work"},{"id":"d","text":"Replace it with the AI's own checks"}]$o$,
   $a$["b"]$a$,
   $e$Volume is not Done; the standard holds no matter how fast the draft arrived.$e$,3,$b$3_apply$b$),
  ($g$5ec60602-0000-4000-8000-000000000006$g$,'es-419',
   $t$El volumen de salida de IA de un equipo es cinco veces lo normal. El efecto correcto sobre la Definition of Done es:$t$,
   $o$[{"id":"a","text":"Relajarla para mantener el ritmo"},{"id":"b","text":"Ninguno: el estándar se mantiene sin importar el volumen"},{"id":"c","text":"Suspenderla para el trabajo de IA"},{"id":"d","text":"Reemplazarla con las verificaciones de la propia IA"}]$o$,
   $a$["b"]$a$,
   $e$El volumen no es Done; el estándar se mantiene sin importar qué tan rápido llegó el borrador.$e$,3,$b$3_apply$b$),
  ($g$5ec60602-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$O volume de saída de IA de um time é cinco vezes o normal. O efeito correto sobre a Definition of Done é:$t$,
   $o$[{"id":"a","text":"Relaxá-la para acompanhar"},{"id":"b","text":"Nenhum: o padrão se mantém não importa o volume"},{"id":"c","text":"Suspendê-la para o trabalho de IA"},{"id":"d","text":"Substituí-la pelas verificações da própria IA"}]$o$,
   $a$["b"]$a$,
   $e$Volume não é Done; o padrão se mantém não importa quão rápido o rascunho chegou.$e$,3,$b$3_apply$b$),

  -- S7 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000007$g$,'en',
   $t$Why does opaque AI output weaken empiricism?$t$,
   $o$[{"id":"a","text":"It makes the build slower"},{"id":"b","text":"Inspection depends on transparency, and unverifiable output cannot be genuinely inspected"},{"id":"c","text":"It shortens the Sprint"},{"id":"d","text":"It changes the Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Empiricism needs transparency for inspection; opaque output removes it.$e$,2,$b$2_understand$b$),
  ($g$5ec60602-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Por qué la salida de IA opaca debilita el empirismo?$t$,
   $o$[{"id":"a","text":"Hace más lenta la construcción"},{"id":"b","text":"La inspección depende de la transparencia, y la salida no verificable no puede inspeccionarse de verdad"},{"id":"c","text":"Acorta el Sprint"},{"id":"d","text":"Cambia el Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo necesita transparencia para la inspección; la salida opaca la elimina.$e$,2,$b$2_understand$b$),
  ($g$5ec60602-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Por que a saída de IA opaca enfraquece o empirismo?$t$,
   $o$[{"id":"a","text":"Deixa a construção mais lenta"},{"id":"b","text":"A inspeção depende da transparência, e a saída não verificável não pode ser genuinamente inspecionada"},{"id":"c","text":"Encurta o Sprint"},{"id":"d","text":"Muda o Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo precisa de transparência para a inspeção; a saída opaca a remove.$e$,2,$b$2_understand$b$),

  -- S8 ----------------------------------------------------------------------
  ($g$5ec60602-0000-4000-8000-000000000008$g$,'en',
   $t$A Developer says "the AI followed our coding standards, so it's Done." What is the flaw?$t$,
   $o$[{"id":"a","text":"AI cannot follow standards"},{"id":"b","text":"Following standards is one input; Done is the Developers' judgment against the full Definition of Done"},{"id":"c","text":"Coding standards are not part of the Definition of Done"},{"id":"d","text":"There is no flaw"}]$o$,
   $a$["b"]$a$,
   $e$Meeting one criterion is not meeting the full Definition of Done; Done is the team's judgment of the whole standard.$e$,3,$b$4_analyze$b$),
  ($g$5ec60602-0000-4000-8000-000000000008$g$,'es-419',
   $t$Un Developer dice "la IA siguió nuestros estándares de código, así que está Done". ¿Cuál es la falla?$t$,
   $o$[{"id":"a","text":"La IA no puede seguir estándares"},{"id":"b","text":"Seguir los estándares es un insumo; Done es el juicio de los Developers contra la Definition of Done completa"},{"id":"c","text":"Los estándares de código no son parte de la Definition of Done"},{"id":"d","text":"No hay falla"}]$o$,
   $a$["b"]$a$,
   $e$Cumplir un criterio no es cumplir la Definition of Done completa; Done es el juicio del equipo sobre el estándar entero.$e$,3,$b$4_analyze$b$),
  ($g$5ec60602-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Um Developer diz "a IA seguiu nossos padrões de código, então está Done". Qual é a falha?$t$,
   $o$[{"id":"a","text":"A IA não consegue seguir padrões"},{"id":"b","text":"Seguir os padrões é um insumo; Done é o julgamento dos Developers contra a Definition of Done completa"},{"id":"c","text":"Padrões de código não são parte da Definition of Done"},{"id":"d","text":"Não há falha"}]$o$,
   $a$["b"]$a$,
   $e$Cumprir um critério não é cumprir a Definition of Done completa; Done é o julgamento do time sobre o padrão inteiro.$e$,3,$b$4_analyze$b$)
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
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.2')
--  group by language order by language;
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like '5ec60602-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
-- select question_group_id from public.quiz_questions
--  where question_group_id::text like '5ec60602-%'
--  group by question_group_id having count(distinct correct_answer::text) > 1;
