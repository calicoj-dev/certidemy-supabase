-- 040_seed_secure_6_6.sql
-- =============================================================================
-- SECURE pool: 8 fresh questions for task 6.6 (concepts ai-signal-informs-
-- inspection + metrics-inform-not-decide). Distinct from the practice pool.
-- en + es-419 + pt-BR; shared question_group_id (prefix 5ec6...) + same
-- correct_answer/option ids across languages. pool='secure', is_exam_scope=true.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.6'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- S1 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000001$g$,'en',
   $t$An AI tool flags that defects cluster in one module. The team's correct first response is to:$t$,
   $o$[{"id":"a","text":"Auto-apply the AI's suggested refactor"},{"id":"b","text":"Bring the finding to inspection and investigate the cause themselves"},{"id":"c","text":"Ignore it as noise"},{"id":"d","text":"Let the metric set the next Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$AI signal is input to inspection; the team investigates the cause and decides what to do.$e$,3,$b$3_apply$b$),
  ($g$5ec60606-0000-4000-8000-000000000001$g$,'es-419',
   $t$Una herramienta de IA señala que los defectos se agrupan en un módulo. La primera respuesta correcta del equipo es:$t$,
   $o$[{"id":"a","text":"Aplicar automáticamente el refactor que sugiere la IA"},{"id":"b","text":"Llevar el hallazgo a la inspección e investigar la causa ellos mismos"},{"id":"c","text":"Ignorarlo como ruido"},{"id":"d","text":"Dejar que la métrica fije el próximo Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$La señal de IA es insumo para la inspección; el equipo investiga la causa y decide qué hacer.$e$,3,$b$3_apply$b$),
  ($g$5ec60606-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Uma ferramenta de IA sinaliza que os defeitos se agrupam em um módulo. A primeira resposta correta do time é:$t$,
   $o$[{"id":"a","text":"Aplicar automaticamente o refactor que a IA sugere"},{"id":"b","text":"Levar o achado à inspeção e investigar a causa eles mesmos"},{"id":"c","text":"Ignorá-lo como ruído"},{"id":"d","text":"Deixar a métrica definir o próximo Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$O sinal de IA é insumo para a inspeção; o time investiga a causa e decide o que fazer.$e$,3,$b$3_apply$b$),

  -- S2 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000002$g$,'en',
   $t$The correct boundary for AI metrics in a Retrospective is that they can set:$t$,
   $o$[{"id":"a","text":"The team's decisions"},{"id":"b","text":"The agenda, while the team interprets and decides"},{"id":"c","text":"The Sprint length"},{"id":"d","text":"The Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Metrics inform what is discussed; the team owns interpretation and the decision.$e$,2,$b$2_understand$b$),
  ($g$5ec60606-0000-4000-8000-000000000002$g$,'es-419',
   $t$El límite correcto para las métricas de IA en una Retrospective es que pueden fijar:$t$,
   $o$[{"id":"a","text":"Las decisiones del equipo"},{"id":"b","text":"La agenda, mientras el equipo interpreta y decide"},{"id":"c","text":"La duración del Sprint"},{"id":"d","text":"La Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Las métricas informan qué se discute; el equipo es dueño de la interpretación y la decisión.$e$,2,$b$2_understand$b$),
  ($g$5ec60606-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$O limite correto para as métricas de IA em uma Retrospective é que elas podem definir:$t$,
   $o$[{"id":"a","text":"As decisões do time"},{"id":"b","text":"A pauta, enquanto o time interpreta e decide"},{"id":"c","text":"A duração do Sprint"},{"id":"d","text":"A Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$As métricas informam o que é discutido; o time é dono da interpretação e da decisão.$e$,2,$b$2_understand$b$),

  -- S3 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000003$g$,'en',
   $t$A team that lets a dashboard auto-trigger actions with no human interpretation has most fundamentally lost:$t$,
   $o$[{"id":"a","text":"Velocity"},{"id":"b","text":"The interpretation step that turns data into a sound, context-aware decision"},{"id":"c","text":"The Sprint timebox"},{"id":"d","text":"The Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Removing human interpretation between signal and action removes the reasoning the decision depends on.$e$,4,$b$4_analyze$b$),
  ($g$5ec60606-0000-4000-8000-000000000003$g$,'es-419',
   $t$Un equipo que deja que un tablero dispare acciones automáticamente sin interpretación humana ha perdido, en lo más fundamental:$t$,
   $o$[{"id":"a","text":"La velocity"},{"id":"b","text":"El paso de interpretación que convierte los datos en una decisión sólida y consciente del contexto"},{"id":"c","text":"El timebox del Sprint"},{"id":"d","text":"El Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Quitar la interpretación humana entre la señal y la acción elimina el razonamiento del que depende la decisión.$e$,4,$b$4_analyze$b$),
  ($g$5ec60606-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Um time que deixa um painel disparar ações automaticamente sem interpretação humana perdeu, no mais fundamental:$t$,
   $o$[{"id":"a","text":"A velocity"},{"id":"b","text":"O passo de interpretação que transforma dados em uma decisão sólida e consciente do contexto"},{"id":"c","text":"O timebox do Sprint"},{"id":"d","text":"O Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Remover a interpretação humana entre o sinal e a ação remove o raciocínio do qual a decisão depende.$e$,4,$b$4_analyze$b$),

  -- S4 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000004$g$,'en',
   $t$AI-surfaced flow metrics and impediment clusters are best treated as:$t$,
   $o$[{"id":"a","text":"Conclusions the team executes"},{"id":"b","text":"Raw material the team inspects"},{"id":"c","text":"A replacement for the Retrospective"},{"id":"d","text":"The Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Used well, AI signal is input to inspection, not a decision.$e$,2,$b$2_understand$b$),
  ($g$5ec60606-0000-4000-8000-000000000004$g$,'es-419',
   $t$Las métricas de flujo y las agrupaciones de impedimentos que muestra la IA se tratan mejor como:$t$,
   $o$[{"id":"a","text":"Conclusiones que el equipo ejecuta"},{"id":"b","text":"Materia prima que el equipo inspecciona"},{"id":"c","text":"Un reemplazo de la Retrospective"},{"id":"d","text":"El Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Bien usada, la señal de IA es insumo para la inspección, no una decisión.$e$,2,$b$2_understand$b$),
  ($g$5ec60606-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$As métricas de fluxo e os agrupamentos de impedimentos que a IA mostra são melhor tratados como:$t$,
   $o$[{"id":"a","text":"Conclusões que o time executa"},{"id":"b","text":"Matéria-prima que o time inspeciona"},{"id":"c","text":"Um substituto da Retrospective"},{"id":"d","text":"O Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Bem usado, o sinal de IA é insumo para a inspeção, não uma decisão.$e$,2,$b$2_understand$b$),

  -- S5 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000005$g$,'en',
   $t$Why is AI valuable as a source of signal even though it cannot decide?$t$,
   $o$[{"id":"a","text":"It is not actually valuable"},{"id":"b","text":"It can reveal patterns the team might miss, sharpening what they choose to inspect"},{"id":"c","text":"Because it replaces the Scrum Master"},{"id":"d","text":"Because it owns the metrics"}]$o$,
   $a$["b"]$a$,
   $e$AI broadens what the team can see, improving inspection while judgment stays human.$e$,3,$b$3_apply$b$),
  ($g$5ec60606-0000-4000-8000-000000000005$g$,'es-419',
   $t$¿Por qué la IA es valiosa como fuente de señal aunque no pueda decidir?$t$,
   $o$[{"id":"a","text":"En realidad no es valiosa"},{"id":"b","text":"Puede revelar patrones que el equipo podría pasar por alto, agudizando lo que elige inspeccionar"},{"id":"c","text":"Porque reemplaza al Scrum Master"},{"id":"d","text":"Porque es dueña de las métricas"}]$o$,
   $a$["b"]$a$,
   $e$La IA amplía lo que el equipo puede ver, mejorando la inspección mientras el juicio sigue siendo humano.$e$,3,$b$3_apply$b$),
  ($g$5ec60606-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Por que a IA é valiosa como fonte de sinal mesmo não podendo decidir?$t$,
   $o$[{"id":"a","text":"Na verdade não é valiosa"},{"id":"b","text":"Pode revelar padrões que o time poderia perder, afiando o que ele escolhe inspecionar"},{"id":"c","text":"Porque substitui o Scrum Master"},{"id":"d","text":"Porque é dona das métricas"}]$o$,
   $a$["b"]$a$,
   $e$A IA amplia o que o time consegue ver, melhorando a inspeção enquanto o julgamento permanece humano.$e$,3,$b$3_apply$b$),

  -- S6 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000006$g$,'en',
   $t$"Let the metric decide what we discuss, never what we do" is a rule that protects:$t$,
   $o$[{"id":"a","text":"Velocity targets"},{"id":"b","text":"The team's ownership of the decision"},{"id":"c","text":"The Sprint timebox"},{"id":"d","text":"The AI vendor relationship"}]$o$,
   $a$["b"]$a$,
   $e$The metric sets the agenda; the team keeps the decision, preserving its ownership and judgment.$e$,3,$b$3_apply$b$),
  ($g$5ec60606-0000-4000-8000-000000000006$g$,'es-419',
   $t$"Deja que la métrica decida de qué hablamos, nunca qué hacemos" es una regla que protege:$t$,
   $o$[{"id":"a","text":"Las metas de velocity"},{"id":"b","text":"La propiedad de la decisión por parte del equipo"},{"id":"c","text":"El timebox del Sprint"},{"id":"d","text":"La relación con el proveedor de IA"}]$o$,
   $a$["b"]$a$,
   $e$La métrica fija la agenda; el equipo conserva la decisión, preservando su propiedad y juicio.$e$,3,$b$3_apply$b$),
  ($g$5ec60606-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$"Deixe a métrica decidir sobre o que falamos, nunca o que fazemos" é uma regra que protege:$t$,
   $o$[{"id":"a","text":"As metas de velocity"},{"id":"b","text":"A propriedade da decisão pelo time"},{"id":"c","text":"O timebox do Sprint"},{"id":"d","text":"A relação com o fornecedor de IA"}]$o$,
   $a$["b"]$a$,
   $e$A métrica define a pauta; o time mantém a decisão, preservando sua propriedade e julgamento.$e$,3,$b$3_apply$b$),

  -- S7 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000007$g$,'en',
   $t$A team treats every AI metric as an instruction to act. The main risk is that they:$t$,
   $o$[{"id":"a","text":"Move too slowly"},{"id":"b","text":"Stop reasoning about context the metric cannot see and act on misleading signals"},{"id":"c","text":"Run out of metrics"},{"id":"d","text":"Shorten the Sprint"}]$o$,
   $a$["b"]$a$,
   $e$Acting on signal without interpretation means missing the context that determines whether the action is right.$e$,3,$b$4_analyze$b$),
  ($g$5ec60606-0000-4000-8000-000000000007$g$,'es-419',
   $t$Un equipo trata cada métrica de IA como una instrucción para actuar. El riesgo principal es que:$t$,
   $o$[{"id":"a","text":"Avancen demasiado lento"},{"id":"b","text":"Dejen de razonar sobre el contexto que la métrica no puede ver y actúen sobre señales engañosas"},{"id":"c","text":"Se queden sin métricas"},{"id":"d","text":"Acorten el Sprint"}]$o$,
   $a$["b"]$a$,
   $e$Actuar sobre la señal sin interpretación implica perder el contexto que determina si la acción es correcta.$e$,3,$b$4_analyze$b$),
  ($g$5ec60606-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Um time trata cada métrica de IA como uma instrução para agir. O risco principal é que eles:$t$,
   $o$[{"id":"a","text":"Avancem lento demais"},{"id":"b","text":"Parem de raciocinar sobre o contexto que a métrica não consegue ver e ajam sobre sinais enganosos"},{"id":"c","text":"Fiquem sem métricas"},{"id":"d","text":"Encurtem o Sprint"}]$o$,
   $a$["b"]$a$,
   $e$Agir sobre o sinal sem interpretação significa perder o contexto que determina se a ação está certa.$e$,3,$b$4_analyze$b$),

  -- S8 ----------------------------------------------------------------------
  ($g$5ec60606-0000-4000-8000-000000000008$g$,'en',
   $t$When an AI dashboard shows a defect pattern, who decides what it means and what to change?$t$,
   $o$[{"id":"a","text":"The dashboard"},{"id":"b","text":"The team"},{"id":"c","text":"The AI vendor"},{"id":"d","text":"The metric itself"}]$o$,
   $a$["b"]$a$,
   $e$Interpretation and the decision belong to the team, using context the metric cannot see.$e$,1,$b$2_understand$b$),
  ($g$5ec60606-0000-4000-8000-000000000008$g$,'es-419',
   $t$Cuando un tablero de IA muestra un patrón de defectos, ¿quién decide qué significa y qué cambiar?$t$,
   $o$[{"id":"a","text":"El tablero"},{"id":"b","text":"El equipo"},{"id":"c","text":"El proveedor de IA"},{"id":"d","text":"La métrica misma"}]$o$,
   $a$["b"]$a$,
   $e$La interpretación y la decisión pertenecen al equipo, usando el contexto que la métrica no puede ver.$e$,1,$b$2_understand$b$),
  ($g$5ec60606-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Quando um painel de IA mostra um padrão de defeitos, quem decide o que significa e o que mudar?$t$,
   $o$[{"id":"a","text":"O painel"},{"id":"b","text":"O time"},{"id":"c","text":"O fornecedor de IA"},{"id":"d","text":"A própria métrica"}]$o$,
   $a$["b"]$a$,
   $e$A interpretação e a decisão pertencem ao time, usando o contexto que a métrica não consegue ver.$e$,1,$b$2_understand$b$)
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
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.6')
--  group by language order by language;
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like '5ec60606-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
-- select question_group_id from public.quiz_questions
--  where question_group_id::text like '5ec60606-%'
--  group by question_group_id having count(distinct correct_answer::text) > 1;
