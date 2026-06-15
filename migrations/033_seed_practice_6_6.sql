-- 033_seed_practice_6_6.sql
-- =============================================================================
-- Practice pool: 12 questions for task 6.6 (lesson 06-04, AI-as-signal half),
-- concepts ai-signal-informs-inspection + metrics-inform-not-decide.
-- en + es-419 + pt-BR; shared question_group_id per question.
-- pool='practice', is_exam_scope=true, status='approved', task_id by code '6.6'.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.6'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- Q1 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000001$g$,'en',
   $t$An AI tool reports that a category of work consistently slips its estimate. How should the team use this in the Retrospective?$t$,
   $o$[{"id":"a","text":"Automatically apply the fix the tool recommends"},{"id":"b","text":"Treat it as a signal to inspect — the team interprets why it slips and decides what to change"},{"id":"c","text":"Ignore it, since only human observation counts"},{"id":"d","text":"Let the metric set the next Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$AI-generated signal is input to inspection, not a decision. The metric surfaces the pattern; the team interprets the cause and decides the change.$e$,2,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000001$g$,'es-419',
   $t$Una herramienta de IA informa que una categoría de trabajo se retrasa de forma consistente. ¿Cómo debería usarlo el equipo en la Retrospective?$t$,
   $o$[{"id":"a","text":"Aplicar automáticamente la solución que recomienda la herramienta"},{"id":"b","text":"Tratarlo como una señal para inspeccionar: el equipo interpreta por qué se retrasa y decide qué cambiar"},{"id":"c","text":"Ignorarlo, ya que solo cuenta la observación humana"},{"id":"d","text":"Dejar que la métrica fije el próximo Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$La señal generada por IA es insumo para la inspección, no una decisión. La métrica muestra el patrón; el equipo interpreta la causa y decide el cambio.$e$,2,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Uma ferramenta de IA informa que uma categoria de trabalho atrasa de forma consistente. Como o time deve usar isso na Retrospective?$t$,
   $o$[{"id":"a","text":"Aplicar automaticamente a correção que a ferramenta recomenda"},{"id":"b","text":"Tratar como um sinal para inspecionar: o time interpreta por que atrasa e decide o que mudar"},{"id":"c","text":"Ignorar, já que só a observação humana conta"},{"id":"d","text":"Deixar a métrica definir o próximo Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$O sinal gerado por IA é insumo para a inspeção, não uma decisão. A métrica mostra o padrão; o time interpreta a causa e decide a mudança.$e$,2,$b$2_understand$b$),

  -- Q2 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000002$g$,'en',
   $t$AI-generated flow metrics and defect patterns are best understood as:$t$,
   $o$[{"id":"a","text":"Decisions the team must execute"},{"id":"b","text":"Useful input for inspection in Reviews and Retrospectives"},{"id":"c","text":"A replacement for the Retrospective"},{"id":"d","text":"The Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Used well, AI signal is an input to inspection — raw material for the team's events.$e$,1,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000002$g$,'es-419',
   $t$Las métricas de flujo y los patrones de defectos generados por IA se entienden mejor como:$t$,
   $o$[{"id":"a","text":"Decisiones que el equipo debe ejecutar"},{"id":"b","text":"Insumo útil para la inspección en los Reviews y las Retrospectives"},{"id":"c","text":"Un reemplazo de la Retrospective"},{"id":"d","text":"La Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Bien usada, la señal de IA es un insumo para la inspección: materia prima para los eventos del equipo.$e$,1,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$As métricas de fluxo e os padrões de defeitos gerados por IA são melhor entendidos como:$t$,
   $o$[{"id":"a","text":"Decisões que o time deve executar"},{"id":"b","text":"Insumo útil para a inspeção nos Reviews e nas Retrospectives"},{"id":"c","text":"Um substituto da Retrospective"},{"id":"d","text":"A Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Bem usado, o sinal de IA é um insumo para a inspeção: matéria-prima para os eventos do time.$e$,1,$b$2_understand$b$),

  -- Q3 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000003$g$,'en',
   $t$An AI clusters recurring impediments the team had not noticed. What is the right use of this?$t$,
   $o$[{"id":"a","text":"Treat the clustering as the team's decision"},{"id":"b","text":"Bring it to inspection as a starting point the team examines and acts on"},{"id":"c","text":"Disband the impediment list"},{"id":"d","text":"Hide it from the team"}]$o$,
   $a$["b"]$a$,
   $e$AI can surface patterns the team might miss; that is valuable input to inspect, not a verdict.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000003$g$,'es-419',
   $t$Una IA agrupa impedimentos recurrentes que el equipo no había notado. ¿Cuál es el uso correcto?$t$,
   $o$[{"id":"a","text":"Tratar la agrupación como la decisión del equipo"},{"id":"b","text":"Llevarlo a la inspección como un punto de partida que el equipo examina y sobre el que actúa"},{"id":"c","text":"Disolver la lista de impedimentos"},{"id":"d","text":"Ocultarlo del equipo"}]$o$,
   $a$["b"]$a$,
   $e$La IA puede mostrar patrones que el equipo podría no ver; eso es un insumo valioso para inspeccionar, no un veredicto.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Uma IA agrupa impedimentos recorrentes que o time não havia notado. Qual é o uso correto disso?$t$,
   $o$[{"id":"a","text":"Tratar o agrupamento como a decisão do time"},{"id":"b","text":"Levá-lo à inspeção como um ponto de partida que o time examina e sobre o qual age"},{"id":"c","text":"Dissolver a lista de impedimentos"},{"id":"d","text":"Esconder do time"}]$o$,
   $a$["b"]$a$,
   $e$A IA pode mostrar padrões que o time pode não ver; isso é um insumo valioso para inspecionar, não um veredito.$e$,3,$b$3_apply$b$),

  -- Q4 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000004$g$,'en',
   $t$Beyond producing output, AI can also be a source of:$t$,
   $o$[{"id":"a","text":"Accountability"},{"id":"b","text":"Signal — metrics, patterns, and clusters that inform inspection"},{"id":"c","text":"Commitments"},{"id":"d","text":"The Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$AI is not only output; it can surface signal that informs inspection.$e$,2,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000004$g$,'es-419',
   $t$Más allá de producir salida, la IA también puede ser una fuente de:$t$,
   $o$[{"id":"a","text":"Accountability"},{"id":"b","text":"Señal: métricas, patrones y agrupaciones que informan la inspección"},{"id":"c","text":"Compromisos"},{"id":"d","text":"El Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$La IA no es solo salida; puede mostrar señal que informa la inspección.$e$,2,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$Além de produzir saída, a IA também pode ser uma fonte de:$t$,
   $o$[{"id":"a","text":"Accountability"},{"id":"b","text":"Sinal: métricas, padrões e agrupamentos que informam a inspeção"},{"id":"c","text":"Compromissos"},{"id":"d","text":"O Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$A IA não é só saída; ela pode mostrar sinal que informa a inspeção.$e$,2,$b$2_understand$b$),

  -- Q5 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000005$g$,'en',
   $t$A team uses an AI dashboard to spot that one work type slips, then discusses why in the Retrospective and chooses a change. This correctly treats AI as:$t$,
   $o$[{"id":"a","text":"The decision-maker"},{"id":"b","text":"A signal that informs inspection while the team keeps judgment"},{"id":"c","text":"A replacement for the Scrum Master"},{"id":"d","text":"The Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$AI surfaces the pattern; the people interpret and decide. That is signal informing inspection.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000005$g$,'es-419',
   $t$Un equipo usa un tablero de IA para detectar que un tipo de trabajo se retrasa, luego discute por qué en la Retrospective y elige un cambio. Esto trata correctamente a la IA como:$t$,
   $o$[{"id":"a","text":"El que toma la decisión"},{"id":"b","text":"Una señal que informa la inspección mientras el equipo conserva el juicio"},{"id":"c","text":"Un reemplazo del Scrum Master"},{"id":"d","text":"El Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$La IA muestra el patrón; las personas interpretan y deciden. Eso es señal que informa la inspección.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Um time usa um painel de IA para detectar que um tipo de trabalho atrasa, depois discute por que na Retrospective e escolhe uma mudança. Isso trata corretamente a IA como:$t$,
   $o$[{"id":"a","text":"Quem toma a decisão"},{"id":"b","text":"Um sinal que informa a inspeção enquanto o time mantém o julgamento"},{"id":"c","text":"Um substituto do Scrum Master"},{"id":"d","text":"O Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$A IA mostra o padrão; as pessoas interpretam e decidem. Isso é sinal informando a inspeção.$e$,3,$b$3_apply$b$),

  -- Q6 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000006$g$,'en',
   $t$Why is AI signal valuable even though it cannot decide?$t$,
   $o$[{"id":"a","text":"It is not actually valuable"},{"id":"b","text":"It can reveal patterns in flow, defects, and impediments the team might not see alone, sharpening what they inspect"},{"id":"c","text":"Because it replaces human judgment"},{"id":"d","text":"Because it sets the Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$AI broadens what the team can see; used as input it sharpens inspection without replacing judgment.$e$,3,$b$4_analyze$b$),
  ($g$d6016001-0000-4000-8000-000000000006$g$,'es-419',
   $t$¿Por qué la señal de IA es valiosa aunque no pueda decidir?$t$,
   $o$[{"id":"a","text":"En realidad no es valiosa"},{"id":"b","text":"Puede revelar patrones de flujo, defectos e impedimentos que el equipo podría no ver solo, agudizando lo que inspecciona"},{"id":"c","text":"Porque reemplaza el juicio humano"},{"id":"d","text":"Porque fija el Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$La IA amplía lo que el equipo puede ver; usada como insumo agudiza la inspección sin reemplazar el juicio.$e$,3,$b$4_analyze$b$),
  ($g$d6016001-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Por que o sinal de IA é valioso mesmo não podendo decidir?$t$,
   $o$[{"id":"a","text":"Na verdade não é valioso"},{"id":"b","text":"Pode revelar padrões de fluxo, defeitos e impedimentos que o time pode não ver sozinho, afiando o que ele inspeciona"},{"id":"c","text":"Porque substitui o julgamento humano"},{"id":"d","text":"Porque define o Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$A IA amplia o que o time consegue ver; usada como insumo afia a inspeção sem substituir o julgamento.$e$,3,$b$4_analyze$b$),

  -- Q7 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000007$g$,'en',
   $t$What is the correct relationship between AI metrics and the team's decisions?$t$,
   $o$[{"id":"a","text":"Metrics decide; the team executes them"},{"id":"b","text":"Metrics set the agenda and inform the team, but the team interprets and decides"},{"id":"c","text":"Metrics replace the Retrospective"},{"id":"d","text":"Metrics should be ignored to keep judgment human"}]$o$,
   $a$["b"]$a$,
   $e$Let AI signal decide what the team talks about, never what it does. People interpret and decide.$e$,2,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Cuál es la relación correcta entre las métricas de IA y las decisiones del equipo?$t$,
   $o$[{"id":"a","text":"Las métricas deciden; el equipo las ejecuta"},{"id":"b","text":"Las métricas fijan la agenda e informan al equipo, pero el equipo interpreta y decide"},{"id":"c","text":"Las métricas reemplazan la Retrospective"},{"id":"d","text":"Las métricas deberían ignorarse para mantener humano el juicio"}]$o$,
   $a$["b"]$a$,
   $e$Deja que la señal de IA decida de qué habla el equipo, nunca qué hace. Las personas interpretan y deciden.$e$,2,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Qual é a relação correta entre as métricas de IA e as decisões do time?$t$,
   $o$[{"id":"a","text":"As métricas decidem; o time as executa"},{"id":"b","text":"As métricas definem a pauta e informam o time, mas o time interpreta e decide"},{"id":"c","text":"As métricas substituem a Retrospective"},{"id":"d","text":"As métricas deveriam ser ignoradas para manter o julgamento humano"}]$o$,
   $a$["b"]$a$,
   $e$Deixe o sinal de IA decidir sobre o que o time fala, nunca o que ele faz. As pessoas interpretam e decidem.$e$,2,$b$2_understand$b$),

  -- Q8 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000008$g$,'en',
   $t$"The metric says X, so we automatically do Y" with no human interpretation in between is:$t$,
   $o$[{"id":"a","text":"Good empiricism"},{"id":"b","text":"The failure mode — letting the dashboard run the Retrospective"},{"id":"c","text":"Required by Scrum"},{"id":"d","text":"Self-management"}]$o$,
   $a$["b"]$a$,
   $e$Removing the human interpretation between signal and action is the failure mode; it stops the team thinking.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000008$g$,'es-419',
   $t$"La métrica dice X, así que automáticamente hacemos Y" sin interpretación humana en medio es:$t$,
   $o$[{"id":"a","text":"Buen empirismo"},{"id":"b","text":"El modo de falla: dejar que el tablero dirija la Retrospective"},{"id":"c","text":"Requerido por Scrum"},{"id":"d","text":"Autogestión"}]$o$,
   $a$["b"]$a$,
   $e$Quitar la interpretación humana entre la señal y la acción es el modo de falla; hace que el equipo deje de pensar.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$"A métrica diz X, então automaticamente fazemos Y" sem interpretação humana no meio é:$t$,
   $o$[{"id":"a","text":"Bom empirismo"},{"id":"b","text":"O modo de falha: deixar o painel conduzir a Retrospective"},{"id":"c","text":"Exigido pelo Scrum"},{"id":"d","text":"Autogestão"}]$o$,
   $a$["b"]$a$,
   $e$Remover a interpretação humana entre o sinal e a ação é o modo de falha; faz o time parar de pensar.$e$,3,$b$3_apply$b$),

  -- Q9 ----------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000009$g$,'en',
   $t$Complete the rule: "AI sets the agenda, never the ___."$t$,
   $o$[{"id":"a","text":"Sprint"},{"id":"b","text":"conclusion"},{"id":"c","text":"backlog"},{"id":"d","text":"team"}]$o$,
   $a$["b"]$a$,
   $e$The metric can decide what the team talks about; only the team decides what to do — so it never sets the conclusion.$e$,1,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000009$g$,'es-419',
   $t$Completa la regla: "La IA fija la agenda, nunca la ___."$t$,
   $o$[{"id":"a","text":"Sprint"},{"id":"b","text":"conclusión"},{"id":"c","text":"backlog"},{"id":"d","text":"equipo"}]$o$,
   $a$["b"]$a$,
   $e$La métrica puede decidir de qué habla el equipo; solo el equipo decide qué hacer, así que nunca fija la conclusión.$e$,1,$b$2_understand$b$),
  ($g$d6016001-0000-4000-8000-000000000009$g$,'pt-BR',
   $t$Complete a regra: "A IA define a pauta, nunca a ___."$t$,
   $o$[{"id":"a","text":"Sprint"},{"id":"b","text":"conclusão"},{"id":"c","text":"backlog"},{"id":"d","text":"time"}]$o$,
   $a$["b"]$a$,
   $e$A métrica pode decidir sobre o que o time fala; só o time decide o que fazer, então ela nunca define a conclusão.$e$,1,$b$2_understand$b$),

  -- Q10 ---------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000010$g$,'en',
   $t$What happens to a team that lets metrics make its decisions?$t$,
   $o$[{"id":"a","text":"It becomes more empirical"},{"id":"b","text":"It stops thinking — the human interpretation that turns data into a sound decision disappears"},{"id":"c","text":"It self-manages better"},{"id":"d","text":"Nothing changes"}]$o$,
   $a$["b"]$a$,
   $e$Reversing the order so the metric decides removes interpretation; the team stops reasoning about context the metric cannot see.$e$,4,$b$4_analyze$b$),
  ($g$d6016001-0000-4000-8000-000000000010$g$,'es-419',
   $t$¿Qué le pasa a un equipo que deja que las métricas tomen sus decisiones?$t$,
   $o$[{"id":"a","text":"Se vuelve más empírico"},{"id":"b","text":"Deja de pensar: desaparece la interpretación humana que convierte los datos en una decisión sólida"},{"id":"c","text":"Se autogestiona mejor"},{"id":"d","text":"No cambia nada"}]$o$,
   $a$["b"]$a$,
   $e$Invertir el orden para que la métrica decida quita la interpretación; el equipo deja de razonar sobre el contexto que la métrica no puede ver.$e$,4,$b$4_analyze$b$),
  ($g$d6016001-0000-4000-8000-000000000010$g$,'pt-BR',
   $t$O que acontece com um time que deixa as métricas tomarem suas decisões?$t$,
   $o$[{"id":"a","text":"Torna-se mais empírico"},{"id":"b","text":"Para de pensar: desaparece a interpretação humana que transforma dados em uma decisão sólida"},{"id":"c","text":"Autogerencia-se melhor"},{"id":"d","text":"Nada muda"}]$o$,
   $a$["b"]$a$,
   $e$Inverter a ordem para que a métrica decida remove a interpretação; o time para de raciocinar sobre o contexto que a métrica não consegue ver.$e$,4,$b$4_analyze$b$),

  -- Q11 ---------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000011$g$,'en',
   $t$An AI shows a defect pattern. Who decides what it means and what to change?$t$,
   $o$[{"id":"a","text":"The AI"},{"id":"b","text":"The team, using judgment and context the metric cannot see"},{"id":"c","text":"The AI vendor"},{"id":"d","text":"The metric itself"}]$o$,
   $a$["b"]$a$,
   $e$Why it happens and what to do is the team's judgment, formed by people who understand the context.$e$,2,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000011$g$,'es-419',
   $t$Una IA muestra un patrón de defectos. ¿Quién decide qué significa y qué cambiar?$t$,
   $o$[{"id":"a","text":"La IA"},{"id":"b","text":"El equipo, usando juicio y contexto que la métrica no puede ver"},{"id":"c","text":"El proveedor de la IA"},{"id":"d","text":"La métrica misma"}]$o$,
   $a$["b"]$a$,
   $e$Por qué ocurre y qué hacer es el juicio del equipo, formado por personas que entienden el contexto.$e$,2,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000011$g$,'pt-BR',
   $t$Uma IA mostra um padrão de defeitos. Quem decide o que significa e o que mudar?$t$,
   $o$[{"id":"a","text":"A IA"},{"id":"b","text":"O time, usando julgamento e contexto que a métrica não consegue ver"},{"id":"c","text":"O fornecedor da IA"},{"id":"d","text":"A própria métrica"}]$o$,
   $a$["b"]$a$,
   $e$Por que acontece e o que fazer é o julgamento do time, formado por pessoas que entendem o contexto.$e$,2,$b$3_apply$b$),

  -- Q12 ---------------------------------------------------------------------
  ($g$d6016001-0000-4000-8000-000000000012$g$,'en',
   $t$The rule "let AI signal set the agenda, never the conclusion" means the metric can decide:$t$,
   $o$[{"id":"a","text":"What the team does"},{"id":"b","text":"What the team talks about"},{"id":"c","text":"The Sprint length"},{"id":"d","text":"Who is on the team"}]$o$,
   $a$["b"]$a$,
   $e$The metric can decide what the team talks about; only the team decides what to do.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000012$g$,'es-419',
   $t$La regla "deja que la señal de IA fije la agenda, nunca la conclusión" significa que la métrica puede decidir:$t$,
   $o$[{"id":"a","text":"Qué hace el equipo"},{"id":"b","text":"De qué habla el equipo"},{"id":"c","text":"La duración del Sprint"},{"id":"d","text":"Quién está en el equipo"}]$o$,
   $a$["b"]$a$,
   $e$La métrica puede decidir de qué habla el equipo; solo el equipo decide qué hacer.$e$,3,$b$3_apply$b$),
  ($g$d6016001-0000-4000-8000-000000000012$g$,'pt-BR',
   $t$A regra "deixe o sinal de IA definir a pauta, nunca a conclusão" significa que a métrica pode decidir:$t$,
   $o$[{"id":"a","text":"O que o time faz"},{"id":"b","text":"Sobre o que o time fala"},{"id":"c","text":"A duração do Sprint"},{"id":"d","text":"Quem está no time"}]$o$,
   $a$["b"]$a$,
   $e$A métrica pode decidir sobre o que o time fala; só o time decide o que fazer.$e$,3,$b$3_apply$b$)
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
-- Expect 12 per language for task 6.6:
-- select language, count(*) from public.quiz_questions
--  where pool='practice' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.6')
--  group by language order by language;
-- Sanity (expect 0 rows):
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like 'd6016001-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
