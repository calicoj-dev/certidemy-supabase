-- 032_seed_practice_6_4.sql
-- =============================================================================
-- Practice pool: 12 questions for task 6.4 (lesson 06-04, empiricism half),
-- concepts empiricism-under-acceleration + sm-safeguards-inspection.
-- en + es-419 + pt-BR; shared question_group_id per question.
-- pool='practice', is_exam_scope=true, status='approved', task_id by code '6.4'.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.4'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- Q1 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000001$g$,'en',
   $t$AI makes a team produce far more per Sprint, but inspection capacity stays the same. Effect on empiricism?$t$,
   $o$[{"id":"a","text":"It strengthens — more output means more to learn from"},{"id":"b","text":"It strains — the team produces faster than it can inspect and adapt"},{"id":"c","text":"It is unaffected by output volume"},{"id":"d","text":"It improves automatically once AI is involved"}]$o$,
   $a$["b"]$a$,
   $e$Empiricism depends on inspect-and-adapt, which is human-paced. Generation outrunning inspection strains it.$e$,3,$b$4_analyze$b$),
  ($g$d6014001-0000-4000-8000-000000000001$g$,'es-419',
   $t$La IA hace que un equipo produzca mucho más por Sprint, pero la capacidad de inspección sigue igual. ¿Efecto sobre el empirismo?$t$,
   $o$[{"id":"a","text":"Se fortalece: más salida significa más de qué aprender"},{"id":"b","text":"Se tensiona: el equipo produce más rápido de lo que puede inspeccionar y adaptarse"},{"id":"c","text":"No se ve afectado por el volumen"},{"id":"d","text":"Mejora automáticamente con IA"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo depende del inspeccionar y adaptar, que va a ritmo humano. La generación superando a la inspección lo tensiona.$e$,3,$b$4_analyze$b$),
  ($g$d6014001-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$A IA faz um time produzir muito mais por Sprint, mas a capacidade de inspeção continua a mesma. Efeito sobre o empirismo?$t$,
   $o$[{"id":"a","text":"Fortalece: mais saída significa mais com o que aprender"},{"id":"b","text":"Tensiona: o time produz mais rápido do que consegue inspecionar e adaptar"},{"id":"c","text":"Não é afetado pelo volume"},{"id":"d","text":"Melhora automaticamente com IA"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo depende do inspecionar e adaptar, que é em ritmo humano. A geração superando a inspeção o tensiona.$e$,3,$b$4_analyze$b$),

  -- Q2 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000002$g$,'en',
   $t$What is empiricism measured by?$t$,
   $o$[{"id":"a","text":"The volume of output"},{"id":"b","text":"The team's ability to inspect and adapt"},{"id":"c","text":"Lines of code"},{"id":"d","text":"The number of AI agents"}]$o$,
   $a$["b"]$a$,
   $e$More output is not more empiricism; it is measured by the team's ability to inspect and adapt.$e$,2,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000002$g$,'es-419',
   $t$¿Por qué se mide el empirismo?$t$,
   $o$[{"id":"a","text":"Por el volumen de salida"},{"id":"b","text":"Por la capacidad del equipo de inspeccionar y adaptarse"},{"id":"c","text":"Por las líneas de código"},{"id":"d","text":"Por la cantidad de agentes de IA"}]$o$,
   $a$["b"]$a$,
   $e$Más salida no es más empirismo; se mide por la capacidad del equipo de inspeccionar y adaptarse.$e$,2,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Por que se mede o empirismo?$t$,
   $o$[{"id":"a","text":"Pelo volume de saída"},{"id":"b","text":"Pela capacidade do time de inspecionar e adaptar"},{"id":"c","text":"Pelas linhas de código"},{"id":"d","text":"Pelo número de agentes de IA"}]$o$,
   $a$["b"]$a$,
   $e$Mais saída não é mais empirismo; mede-se pela capacidade do time de inspecionar e adaptar.$e$,2,$b$2_understand$b$),

  -- Q3 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000003$g$,'en',
   $t$Why can't AI make a team "inspect 10x faster" the way it makes them produce 10x faster?$t$,
   $o$[{"id":"a","text":"AI tools are too expensive"},{"id":"b","text":"Genuine inspection and understanding are human-paced and do not scale with generation"},{"id":"c","text":"The Scrum Guide forbids it"},{"id":"d","text":"Inspection is already fully automated"}]$o$,
   $a$["b"]$a$,
   $e$Generation scales with AI; the human capacity to inspect, understand, and decide does not.$e$,3,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000003$g$,'es-419',
   $t$¿Por qué la IA no puede hacer que un equipo "inspeccione 10 veces más rápido" como sí lo hace producir 10 veces más rápido?$t$,
   $o$[{"id":"a","text":"Las herramientas de IA son muy caras"},{"id":"b","text":"La inspección y el entendimiento genuinos van a ritmo humano y no escalan con la generación"},{"id":"c","text":"La Guía de Scrum lo prohíbe"},{"id":"d","text":"La inspección ya está totalmente automatizada"}]$o$,
   $a$["b"]$a$,
   $e$La generación escala con la IA; la capacidad humana de inspeccionar, entender y decidir no.$e$,3,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Por que a IA não consegue fazer um time "inspecionar 10x mais rápido" como faz produzir 10x mais rápido?$t$,
   $o$[{"id":"a","text":"As ferramentas de IA são caras demais"},{"id":"b","text":"A inspeção e o entendimento genuínos são em ritmo humano e não escalam com a geração"},{"id":"c","text":"O Guia do Scrum proíbe"},{"id":"d","text":"A inspeção já é totalmente automatizada"}]$o$,
   $a$["b"]$a$,
   $e$A geração escala com a IA; a capacidade humana de inspecionar, entender e decidir não.$e$,3,$b$3_apply$b$),

  -- Q4 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000004$g$,'en',
   $t$"More output means more empiricism." This statement is:$t$,
   $o$[{"id":"a","text":"True"},{"id":"b","text":"False — empiricism is inspect-and-adapt, not volume"},{"id":"c","text":"True if AI wrote the output"},{"id":"d","text":"True only in long Sprints"}]$o$,
   $a$["b"]$a$,
   $e$Output volume is not empiricism; the inspect-and-adapt loop is.$e$,1,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000004$g$,'es-419',
   $t$"Más salida significa más empirismo." Esta afirmación es:$t$,
   $o$[{"id":"a","text":"Verdadera"},{"id":"b","text":"Falsa: el empirismo es inspeccionar y adaptar, no volumen"},{"id":"c","text":"Verdadera si la IA produjo la salida"},{"id":"d","text":"Verdadera solo en Sprints largos"}]$o$,
   $a$["b"]$a$,
   $e$El volumen de salida no es empirismo; el ciclo de inspeccionar y adaptar sí.$e$,1,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$"Mais saída significa mais empirismo." Esta afirmação é:$t$,
   $o$[{"id":"a","text":"Verdadeira"},{"id":"b","text":"Falsa: o empirismo é inspecionar e adaptar, não volume"},{"id":"c","text":"Verdadeira se a IA produziu a saída"},{"id":"d","text":"Verdadeira só em Sprints longos"}]$o$,
   $a$["b"]$a$,
   $e$O volume de saída não é empirismo; o ciclo de inspecionar e adaptar é.$e$,1,$b$2_understand$b$),

  -- Q5 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000005$g$,'en',
   $t$When generation outruns inspection, what quietly happens to the empirical loop?$t$,
   $o$[{"id":"a","text":"It speeds up safely"},{"id":"b","text":"It inverts — the team produces faster than it can learn, so the Sprint looks productive but stops being empirical"},{"id":"c","text":"Nothing changes"},{"id":"d","text":"The Sprint Goal doubles"}]$o$,
   $a$["b"]$a$,
   $e$Transparency floods in faster than anyone can examine it; producing without learning means empiricism has been outrun.$e$,4,$b$4_analyze$b$),
  ($g$d6014001-0000-4000-8000-000000000005$g$,'es-419',
   $t$Cuando la generación supera a la inspección, ¿qué le pasa en silencio al ciclo empírico?$t$,
   $o$[{"id":"a","text":"Se acelera de forma segura"},{"id":"b","text":"Se invierte: el equipo produce más rápido de lo que puede aprender, así que el Sprint parece productivo pero deja de ser empírico"},{"id":"c","text":"No cambia nada"},{"id":"d","text":"El Sprint Goal se duplica"}]$o$,
   $a$["b"]$a$,
   $e$La transparencia llega más rápido de lo que alguien puede examinar; producir sin aprender significa que el empirismo quedó atrás.$e$,4,$b$4_analyze$b$),
  ($g$d6014001-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Quando a geração supera a inspeção, o que acontece em silêncio com o ciclo empírico?$t$,
   $o$[{"id":"a","text":"Acelera de forma segura"},{"id":"b","text":"Inverte-se: o time produz mais rápido do que consegue aprender, então o Sprint parece produtivo mas deixa de ser empírico"},{"id":"c","text":"Nada muda"},{"id":"d","text":"O Sprint Goal dobra"}]$o$,
   $a$["b"]$a$,
   $e$A transparência chega mais rápido do que alguém consegue examinar; produzir sem aprender significa que o empirismo ficou para trás.$e$,4,$b$4_analyze$b$),

  -- Q6 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000006$g$,'en',
   $t$A team that uses AI and keeps inspection in pace gets:$t$,
   $o$[{"id":"a","text":"Less capacity"},{"id":"b","text":"More capacity and intact empiricism"},{"id":"c","text":"No benefit at all"},{"id":"d","text":"A shorter Sprint"}]$o$,
   $a$["b"]$a$,
   $e$AI plus paced inspection is the best of both: more capacity, empiricism intact.$e$,2,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000006$g$,'es-419',
   $t$Un equipo que usa IA y mantiene la inspección al ritmo obtiene:$t$,
   $o$[{"id":"a","text":"Menos capacidad"},{"id":"b","text":"Más capacidad y empirismo intacto"},{"id":"c","text":"Ningún beneficio"},{"id":"d","text":"Un Sprint más corto"}]$o$,
   $a$["b"]$a$,
   $e$IA más inspección al ritmo es lo mejor de ambos: más capacidad, empirismo intacto.$e$,2,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Um time que usa IA e mantém a inspeção no ritmo obtém:$t$,
   $o$[{"id":"a","text":"Menos capacidade"},{"id":"b","text":"Mais capacidade e empirismo intacto"},{"id":"c","text":"Nenhum benefício"},{"id":"d","text":"Um Sprint mais curto"}]$o$,
   $a$["b"]$a$,
   $e$IA mais inspeção no ritmo é o melhor dos dois: mais capacidade, empirismo intacto.$e$,2,$b$3_apply$b$),

  -- Q7 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000007$g$,'en',
   $t$Output surged with AI; the team wants to cut the Retrospective short "because we shipped so much." The Scrum Master should:$t$,
   $o$[{"id":"a","text":"Agree — high output earns a shorter Retrospective"},{"id":"b","text":"Protect the Retrospective; high output is exactly when inspection and adaptation matter most"},{"id":"c","text":"Cancel it and rely on AI metrics"},{"id":"d","text":"Shorten it and add the time to generation"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Master safeguards the cadence of inspect-and-adapt; surging output is a reason to protect inspection events, not trim them.$e$,2,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000007$g$,'es-419',
   $t$La salida se disparó con la IA; el equipo quiere acortar la Retrospective "porque entregamos mucho". El Scrum Master debería:$t$,
   $o$[{"id":"a","text":"Estar de acuerdo: la salida alta merece una Retrospective más corta"},{"id":"b","text":"Proteger la Retrospective; la salida alta es justo cuando la inspección y la adaptación más importan"},{"id":"c","text":"Cancelarla y confiar en las métricas de la IA"},{"id":"d","text":"Acortarla y sumar el tiempo a la generación"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Master protege la cadencia de inspeccionar y adaptar; la salida disparada es razón para proteger los eventos de inspección, no recortarlos.$e$,2,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$A saída disparou com a IA; o time quer encurtar a Retrospective "porque entregamos muito". O Scrum Master deveria:$t$,
   $o$[{"id":"a","text":"Concordar: saída alta merece uma Retrospective mais curta"},{"id":"b","text":"Proteger a Retrospective; saída alta é justamente quando a inspeção e a adaptação mais importam"},{"id":"c","text":"Cancelá-la e confiar nas métricas da IA"},{"id":"d","text":"Encurtá-la e somar o tempo à geração"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Master protege a cadência de inspecionar e adaptar; a saída disparada é razão para proteger os eventos de inspeção, não cortá-los.$e$,2,$b$3_apply$b$),

  -- Q8 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000008$g$,'en',
   $t$When output accelerates, what does the Scrum Master protect?$t$,
   $o$[{"id":"a","text":"The velocity number"},{"id":"b","text":"The cadence of inspection and adaptation"},{"id":"c","text":"The AI's uptime"},{"id":"d","text":"The number of pull requests"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Master protects inspect-and-adapt, not raw volume.$e$,2,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000008$g$,'es-419',
   $t$Cuando la salida acelera, ¿qué protege el Scrum Master?$t$,
   $o$[{"id":"a","text":"El número de velocity"},{"id":"b","text":"La cadencia de inspección y adaptación"},{"id":"c","text":"El tiempo de actividad de la IA"},{"id":"d","text":"La cantidad de pull requests"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Master protege el inspeccionar y adaptar, no el volumen bruto.$e$,2,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Quando a saída acelera, o que o Scrum Master protege?$t$,
   $o$[{"id":"a","text":"O número de velocity"},{"id":"b","text":"A cadência de inspeção e adaptação"},{"id":"c","text":"O tempo de atividade da IA"},{"id":"d","text":"A quantidade de pull requests"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Master protege o inspecionar e adaptar, não o volume bruto.$e$,2,$b$2_understand$b$),

  -- Q9 ----------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000009$g$,'en',
   $t$A team produced a huge Increment but did not genuinely inspect it. In Scrum terms, it is:$t$,
   $o$[{"id":"a","text":"Done, because it is large"},{"id":"b","text":"Not really Done — un-inspected work is not Done regardless of volume"},{"id":"c","text":"Done if the tests pass"},{"id":"d","text":"The Product Owner's call alone"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Master defends that an Increment the team has not genuinely inspected is not really Done, no matter how much of it there is.$e$,3,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000009$g$,'es-419',
   $t$Un equipo produjo un Increment enorme pero no lo inspeccionó de verdad. En términos de Scrum, está:$t$,
   $o$[{"id":"a","text":"Done, porque es grande"},{"id":"b","text":"No realmente Done: el trabajo no inspeccionado no está Done sin importar el volumen"},{"id":"c","text":"Done si pasan las pruebas"},{"id":"d","text":"Decisión solo del Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Master defiende que un Increment que el equipo no inspeccionó de verdad no está realmente Done, por mucho que haya.$e$,3,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000009$g$,'pt-BR',
   $t$Um time produziu um Increment enorme mas não o inspecionou de verdade. Em termos de Scrum, ele está:$t$,
   $o$[{"id":"a","text":"Done, porque é grande"},{"id":"b","text":"Não realmente Done: trabalho não inspecionado não está Done não importa o volume"},{"id":"c","text":"Done se os testes passam"},{"id":"d","text":"Decisão apenas do Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Master defende que um Increment que o time não inspecionou de verdade não está realmente Done, por mais que haja.$e$,3,$b$3_apply$b$),

  -- Q10 ---------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000010$g$,'en',
   $t$Is safeguarding inspection an "anti-AI" stance?$t$,
   $o$[{"id":"a","text":"Yes — it blocks AI adoption"},{"id":"b","text":"No — a team that uses AI and keeps inspection in pace gets more capacity and intact empiricism"},{"id":"c","text":"Yes — AI and Scrum fundamentally conflict"},{"id":"d","text":"Only for large teams"}]$o$,
   $a$["b"]$a$,
   $e$It is not anti-AI; the Scrum Master ensures the "intact empiricism" half of the equation is never dropped.$e$,3,$b$4_analyze$b$),
  ($g$d6014001-0000-4000-8000-000000000010$g$,'es-419',
   $t$¿Proteger la inspección es una postura "anti-IA"?$t$,
   $o$[{"id":"a","text":"Sí: bloquea la adopción de IA"},{"id":"b","text":"No: un equipo que usa IA y mantiene la inspección al ritmo obtiene más capacidad y empirismo intacto"},{"id":"c","text":"Sí: la IA y Scrum chocan de raíz"},{"id":"d","text":"Solo para equipos grandes"}]$o$,
   $a$["b"]$a$,
   $e$No es anti-IA; el Scrum Master asegura que la mitad de "empirismo intacto" nunca se descarte.$e$,3,$b$4_analyze$b$),
  ($g$d6014001-0000-4000-8000-000000000010$g$,'pt-BR',
   $t$Proteger a inspeção é uma postura "anti-IA"?$t$,
   $o$[{"id":"a","text":"Sim: bloqueia a adoção de IA"},{"id":"b","text":"Não: um time que usa IA e mantém a inspeção no ritmo obtém mais capacidade e empirismo intacto"},{"id":"c","text":"Sim: IA e Scrum se chocam na raiz"},{"id":"d","text":"Só para times grandes"}]$o$,
   $a$["b"]$a$,
   $e$Não é anti-IA; o Scrum Master garante que a metade de "empirismo intacto" nunca seja descartada.$e$,3,$b$4_analyze$b$),

  -- Q11 ---------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000011$g$,'en',
   $t$Generation has outrun review. The team debates slowing generation vs skipping inspection. The Scrum Master supports:$t$,
   $o$[{"id":"a","text":"Skipping inspection to keep pace"},{"id":"b","text":"Slowing generation rather than skipping inspection"},{"id":"c","text":"Removing the Definition of Done"},{"id":"d","text":"Cancelling the Sprint"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Master helps the team see the imbalance and supports slowing generation over skipping inspection.$e$,3,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000011$g$,'es-419',
   $t$La generación superó a la revisión. El equipo debate reducir la generación vs saltarse la inspección. El Scrum Master apoya:$t$,
   $o$[{"id":"a","text":"Saltarse la inspección para mantener el ritmo"},{"id":"b","text":"Reducir la generación en vez de saltarse la inspección"},{"id":"c","text":"Eliminar la Definition of Done"},{"id":"d","text":"Cancelar el Sprint"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Master ayuda al equipo a ver el desbalance y apoya reducir la generación antes que saltarse la inspección.$e$,3,$b$3_apply$b$),
  ($g$d6014001-0000-4000-8000-000000000011$g$,'pt-BR',
   $t$A geração superou a revisão. O time debate reduzir a geração vs pular a inspeção. O Scrum Master apoia:$t$,
   $o$[{"id":"a","text":"Pular a inspeção para manter o ritmo"},{"id":"b","text":"Reduzir a geração em vez de pular a inspeção"},{"id":"c","text":"Remover a Definition of Done"},{"id":"d","text":"Cancelar o Sprint"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Master ajuda o time a ver o desequilíbrio e apoia reduzir a geração antes de pular a inspeção.$e$,3,$b$3_apply$b$),

  -- Q12 ---------------------------------------------------------------------
  ($g$d6014001-0000-4000-8000-000000000012$g$,'en',
   $t$Which event is where the Increment is inspected with stakeholders — and which the Scrum Master protects from being cut "because we shipped so much"?$t$,
   $o$[{"id":"a","text":"The Daily Scrum"},{"id":"b","text":"The Sprint Review"},{"id":"c","text":"Sprint Planning"},{"id":"d","text":"Backlog Refinement"}]$o$,
   $a$["b"]$a$,
   $e$The Sprint Review is where the Increment is inspected with stakeholders; the Scrum Master protects it (and the Retrospective) from being trimmed under high output.$e$,2,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000012$g$,'es-419',
   $t$¿Cuál evento es donde se inspecciona el Increment con los interesados, y que el Scrum Master protege de ser recortado "porque entregamos mucho"?$t$,
   $o$[{"id":"a","text":"El Daily Scrum"},{"id":"b","text":"El Sprint Review"},{"id":"c","text":"El Sprint Planning"},{"id":"d","text":"El Refinement del Backlog"}]$o$,
   $a$["b"]$a$,
   $e$El Sprint Review es donde se inspecciona el Increment con los interesados; el Scrum Master lo protege (y a la Retrospective) de recortes bajo alta salida.$e$,2,$b$2_understand$b$),
  ($g$d6014001-0000-4000-8000-000000000012$g$,'pt-BR',
   $t$Qual evento é onde o Increment é inspecionado com os stakeholders, e que o Scrum Master protege de ser cortado "porque entregamos muito"?$t$,
   $o$[{"id":"a","text":"O Daily Scrum"},{"id":"b","text":"O Sprint Review"},{"id":"c","text":"O Sprint Planning"},{"id":"d","text":"O Refinement do Backlog"}]$o$,
   $a$["b"]$a$,
   $e$O Sprint Review é onde o Increment é inspecionado com os stakeholders; o Scrum Master o protege (e a Retrospective) de cortes sob alta saída.$e$,2,$b$2_understand$b$)
)
insert into public.quiz_questions
  (certification_id, module_id, question_text, question_type, options, correct_answer,
   explanation, difficulty, bloom_level, is_exam_scope, task_id, status, question_group_id, language, pool)
select
  '11111111-1111-1111-1111-111111111111', null, q.qtext, 'single_choice'::question_type,
  q.opts::jsonb, q.ans::jsonb, q.expl, q.diff::smallint, q.bloom::bloom_level,
  true, task.task_id, 'approved', q.grp::uuid, q.lang, 'practice'
from q cross join task
where not exists (
  select 1 from public.quiz_questions e
  where e.question_group_id = q.grp::uuid and e.language = q.lang
);

-- ---- VERIFICATION ------------------------------------------------------------
-- Expect 12 per language for task 6.4:
-- select language, count(*) from public.quiz_questions
--  where pool='practice' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.4')
--  group by language order by language;
-- Sanity (expect 0 rows):
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like 'd6014001-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
