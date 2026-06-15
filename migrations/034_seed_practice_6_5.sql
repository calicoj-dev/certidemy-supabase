-- 034_seed_practice_6_5.sql
-- =============================================================================
-- Practice pool: 12 questions for task 6.5 (lesson 06-05 "What to Delegate,
-- What to Keep"), concepts delegable-ai-work + retained-accountabilities.
-- en + es-419 + pt-BR; shared question_group_id per question.
-- pool='practice', is_exam_scope=true, status='approved', task_id by code '6.5'.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.5'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- Q1 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000001$g$,'en',
   $t$Which of these is safe for a Scrum Team to delegate to AI, with human review?$t$,
   $o$[{"id":"a","text":"Committing to the Sprint Goal"},{"id":"b","text":"Drafting documentation from existing code"},{"id":"c","text":"Deciding the Definition of Done is met"},{"id":"d","text":"Owning accountability for the Increment"}]$o$,
   $a$["b"]$a$,
   $e$Drafting is doing — safely delegable as long as a human reviews and owns the result. The other three are accountabilities that must stay human.$e$,1,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000001$g$,'es-419',
   $t$¿Cuál de estas es seguro que un Scrum Team delegue a la IA, con revisión humana?$t$,
   $o$[{"id":"a","text":"Comprometerse con el Sprint Goal"},{"id":"b","text":"Redactar documentación a partir del código existente"},{"id":"c","text":"Decidir que se cumple la Definition of Done"},{"id":"d","text":"Ser dueño de la accountability del Increment"}]$o$,
   $a$["b"]$a$,
   $e$Redactar es el hacer: delegable con seguridad siempre que una persona revise y sea dueña del resultado. Las otras tres son accountabilities que deben seguir siendo humanas.$e$,1,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Qual destas é seguro um Scrum Team delegar à IA, com revisão humana?$t$,
   $o$[{"id":"a","text":"Comprometer-se com o Sprint Goal"},{"id":"b","text":"Rascunhar documentação a partir do código existente"},{"id":"c","text":"Decidir que a Definition of Done foi cumprida"},{"id":"d","text":"Ser dono da accountability pelo Increment"}]$o$,
   $a$["b"]$a$,
   $e$Rascunhar é o fazer: delegável com segurança desde que uma pessoa revise e assuma o resultado. As outras três são accountabilities que devem permanecer humanas.$e$,1,$b$2_understand$b$),

  -- Q2 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000002$g$,'en',
   $t$What is the common pattern across all safely-delegable AI work?$t$,
   $o$[{"id":"a","text":"The AI ships it directly"},{"id":"b","text":"AI does a first pass, and a human reviews and owns the outcome"},{"id":"c","text":"No human is involved"},{"id":"d","text":"It skips the Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Across drafting, generation, analysis, and summarization, AI produces leverage and a person keeps judgment.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000002$g$,'es-419',
   $t$¿Cuál es el patrón común en todo el trabajo de IA que se puede delegar con seguridad?$t$,
   $o$[{"id":"a","text":"La IA lo entrega directamente"},{"id":"b","text":"La IA hace un primer intento y una persona revisa y se hace dueña del resultado"},{"id":"c","text":"No interviene ninguna persona"},{"id":"d","text":"Se salta la Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$En la redacción, generación, análisis y resumen, la IA produce apalancamiento y una persona conserva el juicio.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Qual é o padrão comum em todo trabalho de IA que pode ser delegado com segurança?$t$,
   $o$[{"id":"a","text":"A IA entrega diretamente"},{"id":"b","text":"A IA faz uma primeira versão e uma pessoa revisa e assume o resultado"},{"id":"c","text":"Nenhuma pessoa participa"},{"id":"d","text":"Pula a Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$No rascunho, geração, análise e resumo, a IA produz alavancagem e uma pessoa mantém o julgamento.$e$,2,$b$2_understand$b$),

  -- Q3 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000003$g$,'en',
   $t$Which of these is a good candidate to delegate to AI?$t$,
   $o$[{"id":"a","text":"Committing to the Sprint Goal"},{"id":"b","text":"Summarizing a long Product Backlog or thread into themes"},{"id":"c","text":"Judging the Definition of Done"},{"id":"d","text":"Self-managing the team"}]$o$,
   $a$["b"]$a$,
   $e$Summarization is doing — delegable with review. The others are accountabilities that stay human.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000003$g$,'es-419',
   $t$¿Cuál de estas es buena candidata para delegar a la IA?$t$,
   $o$[{"id":"a","text":"Comprometerse con el Sprint Goal"},{"id":"b","text":"Resumir un Product Backlog largo o un hilo en temas"},{"id":"c","text":"Juzgar la Definition of Done"},{"id":"d","text":"Autogestionar al equipo"}]$o$,
   $a$["b"]$a$,
   $e$Resumir es el hacer: delegable con revisión. Las otras son accountabilities que siguen siendo humanas.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Qual destas é boa candidata para delegar à IA?$t$,
   $o$[{"id":"a","text":"Comprometer-se com o Sprint Goal"},{"id":"b","text":"Resumir um Product Backlog longo ou uma thread em temas"},{"id":"c","text":"Julgar a Definition of Done"},{"id":"d","text":"Autogerenciar o time"}]$o$,
   $a$["b"]$a$,
   $e$Resumir é o fazer: delegável com revisão. As outras são accountabilities que permanecem humanas.$e$,2,$b$2_understand$b$),

  -- Q4 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000004$g$,'en',
   $t$The real question about an AI task is not "can AI do it?" but:$t$,
   $o$[{"id":"a","text":"Is the AI fast enough?"},{"id":"b","text":"Should the team delegate it?"},{"id":"c","text":"Is it technical?"},{"id":"d","text":"Does the Product Owner approve?"}]$o$,
   $a$["b"]$a$,
   $e$Capability keeps expanding; what matters is whether the team should hand the task over.$e$,3,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000004$g$,'es-419',
   $t$La verdadera pregunta sobre una tarea de IA no es "¿puede la IA hacerla?" sino:$t$,
   $o$[{"id":"a","text":"¿Es la IA lo bastante rápida?"},{"id":"b","text":"¿Debería el equipo delegarla?"},{"id":"c","text":"¿Es técnica?"},{"id":"d","text":"¿La aprueba el Product Owner?"}]$o$,
   $a$["b"]$a$,
   $e$La capacidad sigue creciendo; lo que importa es si el equipo debería ceder la tarea.$e$,3,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$A verdadeira pergunta sobre uma tarefa de IA não é "a IA consegue fazê-la?" mas:$t$,
   $o$[{"id":"a","text":"A IA é rápida o suficiente?"},{"id":"b","text":"O time deveria delegá-la?"},{"id":"c","text":"É técnica?"},{"id":"d","text":"O Product Owner aprova?"}]$o$,
   $a$["b"]$a$,
   $e$A capacidade continua crescendo; o que importa é se o time deveria ceder a tarefa.$e$,3,$b$3_apply$b$),

  -- Q5 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000005$g$,'en',
   $t$Delegating the doing (first passes) to AI does what to the team's capacity?$t$,
   $o$[{"id":"a","text":"Reduces it"},{"id":"b","text":"Multiplies it — the same people get more done"},{"id":"c","text":"Eliminates the Developers"},{"id":"d","text":"Nothing"}]$o$,
   $a$["b"]$a$,
   $e$Delegating the doing multiplies the team's capacity; that is the real upside.$e$,2,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000005$g$,'es-419',
   $t$Delegar el hacer (los primeros intentos) a la IA, ¿qué le hace a la capacidad del equipo?$t$,
   $o$[{"id":"a","text":"La reduce"},{"id":"b","text":"La multiplica: las mismas personas logran más"},{"id":"c","text":"Elimina a los Developers"},{"id":"d","text":"Nada"}]$o$,
   $a$["b"]$a$,
   $e$Delegar el hacer multiplica la capacidad del equipo; ese es el beneficio real.$e$,2,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Delegar o fazer (as primeiras versões) à IA faz o quê com a capacidade do time?$t$,
   $o$[{"id":"a","text":"Reduz"},{"id":"b","text":"Multiplica: as mesmas pessoas realizam mais"},{"id":"c","text":"Elimina os Developers"},{"id":"d","text":"Nada"}]$o$,
   $a$["b"]$a$,
   $e$Delegar o fazer multiplica a capacidade do time; esse é o ganho real.$e$,2,$b$3_apply$b$),

  -- Q6 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000006$g$,'en',
   $t$Why does delegating the doing but not the accountability keep AI from making the team "hollow"?$t$,
   $o$[{"id":"a","text":"It does not; AI always hollows out teams"},{"id":"b","text":"People still hold the commitments and judgments, so the empirical loop keeps its human anchor"},{"id":"c","text":"Because AI is slow"},{"id":"d","text":"Because the Sprint shortens"}]$o$,
   $a$["b"]$a$,
   $e$Keep the doing delegable and the answering human — capacity goes up while empiricism and accountability stay intact.$e$,3,$b$4_analyze$b$),
  ($g$d6015001-0000-4000-8000-000000000006$g$,'es-419',
   $t$¿Por qué delegar el hacer pero no la accountability evita que la IA vuelva al equipo "hueco"?$t$,
   $o$[{"id":"a","text":"No lo evita; la IA siempre vacía a los equipos"},{"id":"b","text":"Las personas siguen sosteniendo los compromisos y juicios, así que el ciclo empírico conserva su ancla humana"},{"id":"c","text":"Porque la IA es lenta"},{"id":"d","text":"Porque el Sprint se acorta"}]$o$,
   $a$["b"]$a$,
   $e$Mantén el hacer delegable y el responder humano: la capacidad sube mientras el empirismo y la accountability quedan intactos.$e$,3,$b$4_analyze$b$),
  ($g$d6015001-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Por que delegar o fazer mas não a accountability impede a IA de tornar o time "oco"?$t$,
   $o$[{"id":"a","text":"Não impede; a IA sempre esvazia os times"},{"id":"b","text":"As pessoas ainda sustentam os compromissos e julgamentos, então o ciclo empírico mantém sua âncora humana"},{"id":"c","text":"Porque a IA é lenta"},{"id":"d","text":"Porque o Sprint encurta"}]$o$,
   $a$["b"]$a$,
   $e$Mantenha o fazer delegável e o responder humano: a capacidade sobe enquanto o empirismo e a accountability ficam intactos.$e$,3,$b$4_analyze$b$),

  -- Q7 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000007$g$,'en',
   $t$Why can a team never delegate commitment to the Sprint Goal to an AI, however capable?$t$,
   $o$[{"id":"a","text":"AI cannot process the Sprint Backlog fast enough"},{"id":"b","text":"A commitment is a promise a person is answerable for — an accountability, not a task"},{"id":"c","text":"The Scrum Guide bans AI from Sprint Planning"},{"id":"d","text":"The Product Owner must write the Sprint Goal alone"}]$o$,
   $a$["b"]$a$,
   $e$Commitment is being answerable for an outcome. Capability is irrelevant; a tool cannot answer for missing it.$e$,3,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Por qué un equipo nunca puede delegar el compromiso con el Sprint Goal a una IA, por capaz que sea?$t$,
   $o$[{"id":"a","text":"La IA no puede procesar el Sprint Backlog lo bastante rápido"},{"id":"b","text":"Un compromiso es una promesa de la que responde una persona: una accountability, no una tarea"},{"id":"c","text":"La Guía de Scrum prohíbe la IA en el Sprint Planning"},{"id":"d","text":"El Product Owner debe escribir el Sprint Goal solo"}]$o$,
   $a$["b"]$a$,
   $e$El compromiso es ser responsable de un resultado. La capacidad es irrelevante; una herramienta no puede responder por incumplirlo.$e$,3,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Por que um time nunca pode delegar o compromisso com o Sprint Goal a uma IA, por mais capaz que seja?$t$,
   $o$[{"id":"a","text":"A IA não consegue processar o Sprint Backlog rápido o suficiente"},{"id":"b","text":"Um compromisso é uma promessa pela qual uma pessoa responde: uma accountability, não uma tarefa"},{"id":"c","text":"O Guia do Scrum proíbe a IA no Sprint Planning"},{"id":"d","text":"O Product Owner deve escrever o Sprint Goal sozinho"}]$o$,
   $a$["b"]$a$,
   $e$Compromisso é ser responsável por um resultado. A capacidade é irrelevante; uma ferramenta não pode responder por descumpri-lo.$e$,3,$b$3_apply$b$),

  -- Q8 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000008$g$,'en',
   $t$Which must stay human regardless of AI capability?$t$,
   $o$[{"id":"a","text":"Drafting release notes"},{"id":"b","text":"Accountability for the Increment"},{"id":"c","text":"Summarizing feedback"},{"id":"d","text":"Generating boilerplate"}]$o$,
   $a$["b"]$a$,
   $e$Accountability for the Increment is an accountability, not a task — it stays human.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000008$g$,'es-419',
   $t$¿Cuál debe seguir siendo humana sin importar la capacidad de la IA?$t$,
   $o$[{"id":"a","text":"Redactar notas de versión"},{"id":"b","text":"La accountability del Increment"},{"id":"c","text":"Resumir feedback"},{"id":"d","text":"Generar boilerplate"}]$o$,
   $a$["b"]$a$,
   $e$La accountability del Increment es una accountability, no una tarea: sigue siendo humana.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Qual deve permanecer humana não importa a capacidade da IA?$t$,
   $o$[{"id":"a","text":"Rascunhar notas de versão"},{"id":"b","text":"A accountability pelo Increment"},{"id":"c","text":"Resumir feedback"},{"id":"d","text":"Gerar boilerplate"}]$o$,
   $a$["b"]$a$,
   $e$A accountability pelo Increment é uma accountability, não uma tarefa: permanece humana.$e$,2,$b$2_understand$b$),

  -- Q9 ----------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000009$g$,'en',
   $t$The simple test for whether a task can be delegated to AI is:$t$,
   $o$[{"id":"a","text":"Is the AI fast enough?"},{"id":"b","text":"If it goes wrong, who answers? If a person must answer, keep the judgment human"},{"id":"c","text":"Is the task technical?"},{"id":"d","text":"Did the Product Owner approve it?"}]$o$,
   $a$["b"]$a$,
   $e$Ask "if this goes wrong, who answers?" If a person must answer, keep the judgment human; you may still delegate the doing.$e$,2,$b$4_analyze$b$),
  ($g$d6015001-0000-4000-8000-000000000009$g$,'es-419',
   $t$La prueba simple para saber si una tarea se puede delegar a la IA es:$t$,
   $o$[{"id":"a","text":"¿Es la IA lo bastante rápida?"},{"id":"b","text":"Si sale mal, ¿quién responde? Si una persona debe responder, mantén humano el juicio"},{"id":"c","text":"¿Es técnica la tarea?"},{"id":"d","text":"¿La aprobó el Product Owner?"}]$o$,
   $a$["b"]$a$,
   $e$Pregunta "si esto sale mal, ¿quién responde?". Si una persona debe responder, mantén humano el juicio; aun así puedes delegar el hacer.$e$,2,$b$4_analyze$b$),
  ($g$d6015001-0000-4000-8000-000000000009$g$,'pt-BR',
   $t$O teste simples para saber se uma tarefa pode ser delegada à IA é:$t$,
   $o$[{"id":"a","text":"A IA é rápida o suficiente?"},{"id":"b","text":"Se der errado, quem responde? Se uma pessoa deve responder, mantenha o julgamento humano"},{"id":"c","text":"A tarefa é técnica?"},{"id":"d","text":"O Product Owner aprovou?"}]$o$,
   $a$["b"]$a$,
   $e$Pergunte "se isto der errado, quem responde?". Se uma pessoa deve responder, mantenha o julgamento humano; ainda assim você pode delegar o fazer.$e$,2,$b$4_analyze$b$),

  -- Q10 ---------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000010$g$,'en',
   $t$What happens to the empirical loop if a team delegates accountability — not just tasks — to AI?$t$,
   $o$[{"id":"a","text":"It speeds up, because AI removes human delay"},{"id":"b","text":"It breaks, because no person is answerable to inspect the outcome and adapt next time"},{"id":"c","text":"It is unaffected, since the work still gets done"},{"id":"d","text":"It improves, because AI is more consistent than people"}]$o$,
   $a$["b"]$a$,
   $e$Delegating the accountability removes the human at each commitment and judgment, so the team produces but no longer learns.$e$,4,$b$4_analyze$b$),
  ($g$d6015001-0000-4000-8000-000000000010$g$,'es-419',
   $t$¿Qué le pasa al ciclo empírico si un equipo delega la accountability —no solo las tareas— a la IA?$t$,
   $o$[{"id":"a","text":"Se acelera, porque la IA elimina la demora humana"},{"id":"b","text":"Se rompe, porque ninguna persona es responsable de inspeccionar el resultado y adaptarse la próxima vez"},{"id":"c","text":"No se ve afectado, ya que el trabajo igual se hace"},{"id":"d","text":"Mejora, porque la IA es más consistente que las personas"}]$o$,
   $a$["b"]$a$,
   $e$Delegar la accountability elimina al humano en cada compromiso y juicio, así que el equipo produce pero ya no aprende.$e$,4,$b$4_analyze$b$),
  ($g$d6015001-0000-4000-8000-000000000010$g$,'pt-BR',
   $t$O que acontece com o ciclo empírico se um time delega a accountability —não só as tarefas— à IA?$t$,
   $o$[{"id":"a","text":"Acelera, porque a IA remove o atraso humano"},{"id":"b","text":"Quebra, porque nenhuma pessoa é responsável por inspecionar o resultado e adaptar na próxima vez"},{"id":"c","text":"Não é afetado, já que o trabalho ainda é feito"},{"id":"d","text":"Melhora, porque a IA é mais consistente que as pessoas"}]$o$,
   $a$["b"]$a$,
   $e$Delegar a accountability remove o humano em cada compromisso e julgamento, então o time produz mas não aprende mais.$e$,4,$b$4_analyze$b$),

  -- Q11 ---------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000011$g$,'en',
   $t$Complete the principle: "You can delegate producing a thing, but never ___ it."$t$,
   $o$[{"id":"a","text":"testing"},{"id":"b","text":"owning"},{"id":"c","text":"drafting"},{"id":"d","text":"summarizing"}]$o$,
   $a$["b"]$a$,
   $e$The doing can move to a tool; owning and answering stay with people.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000011$g$,'es-419',
   $t$Completa el principio: "Puedes delegar producir una cosa, pero nunca ___ de ella."$t$,
   $o$[{"id":"a","text":"probar"},{"id":"b","text":"ser dueño"},{"id":"c","text":"redactar"},{"id":"d","text":"resumir"}]$o$,
   $a$["b"]$a$,
   $e$El hacer puede pasar a una herramienta; ser dueño y responder se quedan con las personas.$e$,2,$b$2_understand$b$),
  ($g$d6015001-0000-4000-8000-000000000011$g$,'pt-BR',
   $t$Complete o princípio: "Você pode delegar produzir uma coisa, mas nunca ___ dela."$t$,
   $o$[{"id":"a","text":"testar"},{"id":"b","text":"ser dono"},{"id":"c","text":"rascunhar"},{"id":"d","text":"resumir"}]$o$,
   $a$["b"]$a$,
   $e$O fazer pode passar para uma ferramenta; ser dono e responder ficam com as pessoas.$e$,2,$b$2_understand$b$),

  -- Q12 ---------------------------------------------------------------------
  ($g$d6015001-0000-4000-8000-000000000012$g$,'en',
   $t$If "the AI owns the Sprint Goal" and the Goal is missed, why does no one learn?$t$,
   $o$[{"id":"a","text":"The AI logs the failure for later"},{"id":"b","text":"No person was answerable for it, so there is no human to inspect and adapt"},{"id":"c","text":"The Sprint restarts automatically"},{"id":"d","text":"The metric explains it"}]$o$,
   $a$["b"]$a$,
   $e$The empirical loop needs a human at every commitment; without an answerable person, the miss produces no learning.$e$,3,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000012$g$,'es-419',
   $t$Si "la IA es dueña del Sprint Goal" y el Goal no se cumple, ¿por qué nadie aprende?$t$,
   $o$[{"id":"a","text":"La IA registra la falla para después"},{"id":"b","text":"Ninguna persona era responsable de él, así que no hay un humano que inspeccione y se adapte"},{"id":"c","text":"El Sprint se reinicia automáticamente"},{"id":"d","text":"La métrica lo explica"}]$o$,
   $a$["b"]$a$,
   $e$El ciclo empírico necesita un humano en cada compromiso; sin una persona responsable, el incumplimiento no produce aprendizaje.$e$,3,$b$3_apply$b$),
  ($g$d6015001-0000-4000-8000-000000000012$g$,'pt-BR',
   $t$Se "a IA é dona do Sprint Goal" e o Goal não é cumprido, por que ninguém aprende?$t$,
   $o$[{"id":"a","text":"A IA registra a falha para depois"},{"id":"b","text":"Nenhuma pessoa era responsável por ele, então não há um humano para inspecionar e adaptar"},{"id":"c","text":"O Sprint reinicia automaticamente"},{"id":"d","text":"A métrica explica"}]$o$,
   $a$["b"]$a$,
   $e$O ciclo empírico precisa de um humano em cada compromisso; sem uma pessoa responsável, o descumprimento não produz aprendizado.$e$,3,$b$3_apply$b$)
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
-- Expect 12 per language for task 6.5:
-- select language, count(*) from public.quiz_questions
--  where pool='practice' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.5')
--  group by language order by language;
-- Sanity (expect 0 rows):
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like 'd6015001-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
