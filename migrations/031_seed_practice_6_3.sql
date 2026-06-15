-- 031_seed_practice_6_3.sql
-- =============================================================================
-- Practice pool: 12 questions for task 6.3 (lesson 06-03 "New Impediments in
-- AI-Augmented Teams"), concepts ai-review-bottleneck + automation-over-trust
-- + eroded-shared-understanding-ai. en + es-419 + pt-BR; shared group_id/question.
-- pool='practice', is_exam_scope=true, status='approved', task_id by code '6.3'.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.3'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- Q1 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000001$g$,'en',
   $t$An AI agent produces far more code than the team can review, so pull requests pile up unreviewed. Which impediment is this?$t$,
   $o$[{"id":"a","text":"Automation over-trust"},{"id":"b","text":"The review bottleneck"},{"id":"c","text":"Eroded shared understanding"},{"id":"d","text":"A blocked dependency"}]$o$,
   $a$["b"]$a$,
   $e$When generation outpaces inspection, the constraint moves to review — the review bottleneck.$e$,2,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000001$g$,'es-419',
   $t$Un agente de IA produce mucho más código del que el equipo puede revisar, así que los pull requests se acumulan sin revisar. ¿Qué impedimento es?$t$,
   $o$[{"id":"a","text":"Exceso de confianza en la automatización"},{"id":"b","text":"El cuello de botella de revisión"},{"id":"c","text":"Entendimiento compartido erosionado"},{"id":"d","text":"Una dependencia bloqueada"}]$o$,
   $a$["b"]$a$,
   $e$Cuando la generación supera a la inspección, la restricción se mueve a la revisión: el cuello de botella de revisión.$e$,2,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Um agente de IA produz muito mais código do que o time consegue revisar, então os pull requests se acumulam sem revisão. Qual impedimento é este?$t$,
   $o$[{"id":"a","text":"Excesso de confiança na automação"},{"id":"b","text":"O gargalo de revisão"},{"id":"c","text":"Entendimento compartilhado erodido"},{"id":"d","text":"Uma dependência bloqueada"}]$o$,
   $a$["b"]$a$,
   $e$Quando a geração supera a inspeção, a restrição se move para a revisão: o gargalo de revisão.$e$,2,$b$2_understand$b$),

  -- Q2 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000002$g$,'en',
   $t$In a review bottleneck, what is no longer the slow step?$t$,
   $o$[{"id":"a","text":"Review"},{"id":"b","text":"Creation / generation"},{"id":"c","text":"Deployment"},{"id":"d","text":"Planning"}]$o$,
   $a$["b"]$a$,
   $e$AI makes creation fast, so review becomes the constraint. Creation is no longer the slow step.$e$,1,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000002$g$,'es-419',
   $t$En un cuello de botella de revisión, ¿qué deja de ser el paso lento?$t$,
   $o$[{"id":"a","text":"La revisión"},{"id":"b","text":"La creación / generación"},{"id":"c","text":"El despliegue"},{"id":"d","text":"La planificación"}]$o$,
   $a$["b"]$a$,
   $e$La IA hace rápida la creación, así que la revisión se vuelve la restricción. La creación ya no es el paso lento.$e$,1,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Em um gargalo de revisão, o que deixa de ser o passo lento?$t$,
   $o$[{"id":"a","text":"A revisão"},{"id":"b","text":"A criação / geração"},{"id":"c","text":"O deploy"},{"id":"d","text":"O planejamento"}]$o$,
   $a$["b"]$a$,
   $e$A IA torna a criação rápida, então a revisão vira a restrição. A criação não é mais o passo lento.$e$,1,$b$2_understand$b$),

  -- Q3 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000003$g$,'en',
   $t$What is the tell that a review bottleneck is forming?$t$,
   $o$[{"id":"a","text":"The team writes less code"},{"id":"b","text":"A growing gap between work generated and work actually reviewed-and-integrated"},{"id":"c","text":"The Sprint gets shorter"},{"id":"d","text":"Fewer impediments are raised"}]$o$,
   $a$["b"]$a$,
   $e$A widening gap between "generated" and "reviewed and integrated" is the signal the bottleneck is forming.$e$,3,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000003$g$,'es-419',
   $t$¿Cuál es la señal de que se está formando un cuello de botella de revisión?$t$,
   $o$[{"id":"a","text":"El equipo escribe menos código"},{"id":"b","text":"Una brecha creciente entre el trabajo generado y el trabajo realmente revisado e integrado"},{"id":"c","text":"El Sprint se acorta"},{"id":"d","text":"Se levantan menos impedimentos"}]$o$,
   $a$["b"]$a$,
   $e$Una brecha creciente entre "generado" y "revisado e integrado" es la señal de que se está formando el cuello de botella.$e$,3,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Qual é o sinal de que um gargalo de revisão está se formando?$t$,
   $o$[{"id":"a","text":"O time escreve menos código"},{"id":"b","text":"Uma lacuna crescente entre o trabalho gerado e o trabalho de fato revisado e integrado"},{"id":"c","text":"O Sprint encurta"},{"id":"d","text":"Menos impedimentos são levantados"}]$o$,
   $a$["b"]$a$,
   $e$Uma lacuna crescente entre "gerado" e "revisado e integrado" é o sinal de que o gargalo está se formando.$e$,3,$b$3_apply$b$),

  -- Q4 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000004$g$,'en',
   $t$A team's generated PRs tripled, but integrated work did not rise. Most likely cause?$t$,
   $o$[{"id":"a","text":"The team is lazy"},{"id":"b","text":"Inspection capacity did not scale with generation — a review bottleneck"},{"id":"c","text":"The Product Owner is absent"},{"id":"d","text":"The Definition of Done was deleted"}]$o$,
   $a$["b"]$a$,
   $e$Generation scaled; inspection did not. The bottleneck relocated to review.$e$,2,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000004$g$,'es-419',
   $t$Los PR generados de un equipo se triplicaron, pero el trabajo integrado no subió. ¿Causa más probable?$t$,
   $o$[{"id":"a","text":"El equipo es perezoso"},{"id":"b","text":"La capacidad de inspección no escaló con la generación: un cuello de botella de revisión"},{"id":"c","text":"El Product Owner está ausente"},{"id":"d","text":"Se eliminó la Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$La generación escaló; la inspección no. El cuello de botella se trasladó a la revisión.$e$,2,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$Os PRs gerados de um time triplicaram, mas o trabalho integrado não subiu. Causa mais provável?$t$,
   $o$[{"id":"a","text":"O time é preguiçoso"},{"id":"b","text":"A capacidade de inspeção não escalou com a geração: um gargalo de revisão"},{"id":"c","text":"O Product Owner está ausente"},{"id":"d","text":"A Definition of Done foi apagada"}]$o$,
   $a$["b"]$a$,
   $e$A geração escalou; a inspeção não. O gargalo se realocou para a revisão.$e$,2,$b$3_apply$b$),

  -- Q5 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000005$g$,'en',
   $t$A team stops carefully reviewing AI output because "the model is usually right." Which impediment?$t$,
   $o$[{"id":"a","text":"The review bottleneck"},{"id":"b","text":"Automation over-trust"},{"id":"c","text":"Eroded shared understanding"},{"id":"d","text":"An unavailable stakeholder"}]$o$,
   $a$["b"]$a$,
   $e$Justifying skipped inspection by the tool's past reliability rather than verifying this work is automation over-trust.$e$,2,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000005$g$,'es-419',
   $t$Un equipo deja de revisar con cuidado la salida de IA porque "el modelo casi siempre tiene razón". ¿Qué impedimento?$t$,
   $o$[{"id":"a","text":"El cuello de botella de revisión"},{"id":"b","text":"Exceso de confianza en la automatización"},{"id":"c","text":"Entendimiento compartido erosionado"},{"id":"d","text":"Un interesado no disponible"}]$o$,
   $a$["b"]$a$,
   $e$Justificar la inspección omitida por la confiabilidad pasada de la herramienta en vez de verificar este trabajo es exceso de confianza en la automatización.$e$,2,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Um time para de revisar com cuidado a saída de IA porque "o modelo geralmente está certo". Qual impedimento?$t$,
   $o$[{"id":"a","text":"O gargalo de revisão"},{"id":"b","text":"Excesso de confiança na automação"},{"id":"c","text":"Entendimento compartilhado erodido"},{"id":"d","text":"Um stakeholder indisponível"}]$o$,
   $a$["b"]$a$,
   $e$Justificar a inspeção pulada pela confiabilidade passada da ferramenta em vez de verificar este trabalho é excesso de confiança na automação.$e$,2,$b$2_understand$b$),

  -- Q6 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000006$g$,'en',
   $t$What is the tell of automation over-trust?$t$,
   $o$[{"id":"a","text":"The team reviews everything twice"},{"id":"b","text":"The justification for not checking is the tool's past reliability, not this work's verification"},{"id":"c","text":"The team writes more tests"},{"id":"d","text":"The AI is turned off"}]$o$,
   $a$["b"]$a$,
   $e$"It is usually right" replacing actual inspection of this work is the tell of over-trust.$e$,1,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000006$g$,'es-419',
   $t$¿Cuál es la señal del exceso de confianza en la automatización?$t$,
   $o$[{"id":"a","text":"El equipo revisa todo dos veces"},{"id":"b","text":"La justificación para no revisar es la confiabilidad pasada de la herramienta, no la verificación de este trabajo"},{"id":"c","text":"El equipo escribe más pruebas"},{"id":"d","text":"Se apaga la IA"}]$o$,
   $a$["b"]$a$,
   $e$"Suele tener razón" reemplazando la inspección real de este trabajo es la señal del exceso de confianza.$e$,1,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Qual é o sinal do excesso de confiança na automação?$t$,
   $o$[{"id":"a","text":"O time revisa tudo duas vezes"},{"id":"b","text":"A justificativa para não verificar é a confiabilidade passada da ferramenta, não a verificação deste trabalho"},{"id":"c","text":"O time escreve mais testes"},{"id":"d","text":"A IA é desligada"}]$o$,
   $a$["b"]$a$,
   $e$"Geralmente está certo" substituindo a inspeção real deste trabalho é o sinal do excesso de confiança.$e$,1,$b$2_understand$b$),

  -- Q7 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000007$g$,'en',
   $t$Why can a tool that is wrong only 5% of the time be more dangerous than one wrong 50% of the time?$t$,
   $o$[{"id":"a","text":"It costs more"},{"id":"b","text":"Confident, occasional errors train the team to stop checking, so the 5% ships unnoticed"},{"id":"c","text":"It is slower"},{"id":"d","text":"It uses more tokens"}]$o$,
   $a$["b"]$a$,
   $e$A frequently-wrong tool gets checked; a rarely-but-confidently-wrong tool erodes vigilance, and the rare error reaches production.$e$,4,$b$4_analyze$b$),
  ($g$d6013001-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Por qué una herramienta que se equivoca solo el 5% del tiempo puede ser más peligrosa que una que se equivoca el 50%?$t$,
   $o$[{"id":"a","text":"Cuesta más"},{"id":"b","text":"Los errores ocasionales y seguros entrenan al equipo a dejar de revisar, así que ese 5% llega sin que nadie lo note"},{"id":"c","text":"Es más lenta"},{"id":"d","text":"Usa más tokens"}]$o$,
   $a$["b"]$a$,
   $e$Una herramienta que se equivoca seguido se revisa; una que se equivoca rara vez pero con seguridad erosiona la vigilancia, y el error raro llega a producción.$e$,4,$b$4_analyze$b$),
  ($g$d6013001-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Por que uma ferramenta que erra só 5% das vezes pode ser mais perigosa que uma que erra 50%?$t$,
   $o$[{"id":"a","text":"Custa mais"},{"id":"b","text":"Erros ocasionais e confiantes treinam o time a parar de verificar, então esses 5% passam sem ser notados"},{"id":"c","text":"É mais lenta"},{"id":"d","text":"Usa mais tokens"}]$o$,
   $a$["b"]$a$,
   $e$Uma ferramenta que erra com frequência é verificada; uma que erra raramente mas com confiança erode a vigilância, e o erro raro chega à produção.$e$,4,$b$4_analyze$b$),

  -- Q8 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000008$g$,'en',
   $t$A reviewer approves AI code without checking, saying "the model probably handled the edge cases." This is:$t$,
   $o$[{"id":"a","text":"Healthy trust"},{"id":"b","text":"Automation over-trust"},{"id":"c","text":"The review bottleneck"},{"id":"d","text":"Good self-management"}]$o$,
   $a$["b"]$a$,
   $e$Approving on assumed reliability instead of inspection is over-trust.$e$,3,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000008$g$,'es-419',
   $t$Un revisor aprueba código de IA sin revisar, diciendo "el modelo seguramente manejó los casos límite". Esto es:$t$,
   $o$[{"id":"a","text":"Confianza sana"},{"id":"b","text":"Exceso de confianza en la automatización"},{"id":"c","text":"El cuello de botella de revisión"},{"id":"d","text":"Buena autogestión"}]$o$,
   $a$["b"]$a$,
   $e$Aprobar por confiabilidad supuesta en vez de inspección es exceso de confianza.$e$,3,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Um revisor aprova código de IA sem verificar, dizendo "o modelo provavelmente cuidou dos casos extremos". Isso é:$t$,
   $o$[{"id":"a","text":"Confiança saudável"},{"id":"b","text":"Excesso de confiança na automação"},{"id":"c","text":"O gargalo de revisão"},{"id":"d","text":"Boa autogestão"}]$o$,
   $a$["b"]$a$,
   $e$Aprovar por confiabilidade presumida em vez de inspeção é excesso de confiança.$e$,3,$b$3_apply$b$),

  -- Q9 ----------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000009$g$,'en',
   $t$Each Developer pairs privately with an AI, and the team ships working code it cannot collectively explain. Which impediment?$t$,
   $o$[{"id":"a","text":"Eroded shared understanding"},{"id":"b","text":"The review bottleneck"},{"id":"c","text":"Automation over-trust"},{"id":"d","text":"A flaky environment"}]$o$,
   $a$["a"]$a$,
   $e$When reasoning lives in private AI chats instead of shared review and pairing, the team loses its collective mental model — eroded shared understanding.$e$,2,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000009$g$,'es-419',
   $t$Cada Developer trabaja en privado con una IA, y el equipo entrega código que funciona pero que no puede explicar colectivamente. ¿Qué impedimento?$t$,
   $o$[{"id":"a","text":"Entendimiento compartido erosionado"},{"id":"b","text":"El cuello de botella de revisión"},{"id":"c","text":"Exceso de confianza en la automatización"},{"id":"d","text":"Un entorno inestable"}]$o$,
   $a$["a"]$a$,
   $e$Cuando el razonamiento vive en chats privados con IA en vez de en la revisión y el pairing compartidos, el equipo pierde su modelo mental colectivo: entendimiento compartido erosionado.$e$,2,$b$2_understand$b$),
  ($g$d6013001-0000-4000-8000-000000000009$g$,'pt-BR',
   $t$Cada Developer trabalha em particular com uma IA, e o time entrega código que funciona mas que não consegue explicar coletivamente. Qual impedimento?$t$,
   $o$[{"id":"a","text":"Entendimento compartilhado erodido"},{"id":"b","text":"O gargalo de revisão"},{"id":"c","text":"Excesso de confiança na automação"},{"id":"d","text":"Um ambiente instável"}]$o$,
   $a$["a"]$a$,
   $e$Quando o raciocínio vive em chats privados com IA em vez de na revisão e no pairing compartilhados, o time perde seu modelo mental coletivo: entendimento compartilhado erodido.$e$,2,$b$2_understand$b$),

  -- Q10 ---------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000010$g$,'en',
   $t$What is the tell of eroded shared understanding?$t$,
   $o$[{"id":"a","text":"The build fails often"},{"id":"b","text":"The team ships working code it cannot collectively explain"},{"id":"c","text":"Velocity drops to zero"},{"id":"d","text":"The backlog is empty"}]$o$,
   $a$["b"]$a$,
   $e$Transparency of the Increment is intact, but transparency of the understanding is gone.$e$,3,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000010$g$,'es-419',
   $t$¿Cuál es la señal del entendimiento compartido erosionado?$t$,
   $o$[{"id":"a","text":"El build falla seguido"},{"id":"b","text":"El equipo entrega código que funciona pero que no puede explicar colectivamente"},{"id":"c","text":"La velocity cae a cero"},{"id":"d","text":"El backlog está vacío"}]$o$,
   $a$["b"]$a$,
   $e$La transparencia del Increment está intacta, pero la transparencia del entendimiento desapareció.$e$,3,$b$3_apply$b$),
  ($g$d6013001-0000-4000-8000-000000000010$g$,'pt-BR',
   $t$Qual é o sinal do entendimento compartilhado erodido?$t$,
   $o$[{"id":"a","text":"O build falha com frequência"},{"id":"b","text":"O time entrega código que funciona mas que não consegue explicar coletivamente"},{"id":"c","text":"A velocity cai a zero"},{"id":"d","text":"O backlog está vazio"}]$o$,
   $a$["b"]$a$,
   $e$A transparência do Increment está intacta, mas a transparência do entendimento desapareceu.$e$,3,$b$3_apply$b$),

  -- Q11 ---------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000011$g$,'en',
   $t$Why is eroded shared understanding dangerous even when the Increment works?$t$,
   $o$[{"id":"a","text":"It slows typing"},{"id":"b","text":"The team cannot inspect or adapt what it does not collectively understand, weakening empiricism"},{"id":"c","text":"It violates the timebox"},{"id":"d","text":"It changes the Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Working code without shared understanding means the team cannot reason about or change it — the very thing empiricism needs.$e$,3,$b$4_analyze$b$),
  ($g$d6013001-0000-4000-8000-000000000011$g$,'es-419',
   $t$¿Por qué el entendimiento compartido erosionado es peligroso incluso cuando el Increment funciona?$t$,
   $o$[{"id":"a","text":"Hace más lenta la escritura"},{"id":"b","text":"El equipo no puede inspeccionar ni adaptar lo que no entiende colectivamente, debilitando el empirismo"},{"id":"c","text":"Viola el timebox"},{"id":"d","text":"Cambia el Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Código que funciona sin entendimiento compartido significa que el equipo no puede razonar sobre él ni cambiarlo: justo lo que el empirismo necesita.$e$,3,$b$4_analyze$b$),
  ($g$d6013001-0000-4000-8000-000000000011$g$,'pt-BR',
   $t$Por que o entendimento compartilhado erodido é perigoso mesmo quando o Increment funciona?$t$,
   $o$[{"id":"a","text":"Deixa a digitação mais lenta"},{"id":"b","text":"O time não consegue inspecionar nem adaptar o que não entende coletivamente, enfraquecendo o empirismo"},{"id":"c","text":"Viola o timebox"},{"id":"d","text":"Muda o Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Código que funciona sem entendimento compartilhado significa que o time não consegue raciocinar sobre ele nem mudá-lo: justamente o que o empirismo precisa.$e$,3,$b$4_analyze$b$),

  -- Q12 ---------------------------------------------------------------------
  ($g$d6013001-0000-4000-8000-000000000012$g$,'en',
   $t$Why are these AI-augmentation impediments especially easy for a Scrum Master to miss?$t$,
   $o$[{"id":"a","text":"They only appear in remote teams"},{"id":"b","text":"They disguise themselves as productivity — more output, faster drafts — so a team that equates 'more' with 'better' overlooks them"},{"id":"c","text":"The Scrum Guide does not mention impediments"},{"id":"d","text":"They only affect the Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Unlike a blocked dependency, these impediments look like progress, so an output-focused team misses the growing review gap, the over-trust, and the lost shared understanding.$e$,3,$b$4_analyze$b$),
  ($g$d6013001-0000-4000-8000-000000000012$g$,'es-419',
   $t$¿Por qué estos impedimentos del aumento con IA son especialmente fáciles de pasar por alto para un Scrum Master?$t$,
   $o$[{"id":"a","text":"Solo aparecen en equipos remotos"},{"id":"b","text":"Se disfrazan de productividad —más salida, borradores más rápidos—, así que un equipo que iguala 'más' con 'mejor' los pasa por alto"},{"id":"c","text":"La Guía de Scrum no menciona los impedimentos"},{"id":"d","text":"Solo afectan al Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$A diferencia de una dependencia bloqueada, estos impedimentos parecen progreso, así que un equipo enfocado en la salida pasa por alto la brecha de revisión, el exceso de confianza y el entendimiento perdido.$e$,3,$b$4_analyze$b$),
  ($g$d6013001-0000-4000-8000-000000000012$g$,'pt-BR',
   $t$Por que esses impedimentos do aumento por IA são especialmente fáceis de um Scrum Master não perceber?$t$,
   $o$[{"id":"a","text":"Eles só aparecem em times remotos"},{"id":"b","text":"Eles se disfarçam de produtividade —mais saída, rascunhos mais rápidos—, então um time que iguala 'mais' a 'melhor' os ignora"},{"id":"c","text":"O Guia do Scrum não menciona impedimentos"},{"id":"d","text":"Eles só afetam o Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Diferente de uma dependência bloqueada, esses impedimentos parecem progresso, então um time focado em saída ignora a lacuna de revisão, o excesso de confiança e o entendimento perdido.$e$,3,$b$4_analyze$b$)
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
-- Expect 12 per language for task 6.3:
-- select language, count(*) from public.quiz_questions
--  where pool='practice' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.3')
--  group by language order by language;
-- Sanity (expect 0 rows):
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like 'd6013001-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
