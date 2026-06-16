-- 038_seed_secure_6_3.sql
-- =============================================================================
-- SECURE pool: 8 fresh questions for task 6.3 (concepts ai-review-bottleneck +
-- automation-over-trust + eroded-shared-understanding-ai). Distinct from practice.
-- en + es-419 + pt-BR; shared question_group_id (prefix 5ec6...) + same
-- correct_answer/option ids across languages. pool='secure', is_exam_scope=true.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.3'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- S1 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000001$g$,'en',
   $t$AI generation has tripled, but the amount of work reaching production held flat. The constraint has most likely moved to:$t$,
   $o$[{"id":"a","text":"Generation"},{"id":"b","text":"Review and inspection"},{"id":"c","text":"Planning"},{"id":"d","text":"Deployment tooling"}]$o$,
   $a$["b"]$a$,
   $e$When generation outpaces inspection, the bottleneck relocates to review.$e$,3,$b$3_apply$b$),
  ($g$5ec60603-0000-4000-8000-000000000001$g$,'es-419',
   $t$La generación con IA se triplicó, pero la cantidad de trabajo que llega a producción se mantuvo igual. La restricción probablemente se movió a:$t$,
   $o$[{"id":"a","text":"La generación"},{"id":"b","text":"La revisión y la inspección"},{"id":"c","text":"La planificación"},{"id":"d","text":"Las herramientas de despliegue"}]$o$,
   $a$["b"]$a$,
   $e$Cuando la generación supera a la inspección, el cuello de botella se traslada a la revisión.$e$,3,$b$3_apply$b$),
  ($g$5ec60603-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$A geração com IA triplicou, mas a quantidade de trabalho que chega à produção ficou estável. A restrição provavelmente se moveu para:$t$,
   $o$[{"id":"a","text":"A geração"},{"id":"b","text":"A revisão e a inspeção"},{"id":"c","text":"O planejamento"},{"id":"d","text":"As ferramentas de deploy"}]$o$,
   $a$["b"]$a$,
   $e$Quando a geração supera a inspeção, o gargalo se realoca para a revisão.$e$,3,$b$3_apply$b$),

  -- S2 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000002$g$,'en',
   $t$A team's habit of "approve without reading because the model rarely errs" is best named:$t$,
   $o$[{"id":"a","text":"Healthy trust"},{"id":"b","text":"Automation over-trust"},{"id":"c","text":"The review bottleneck"},{"id":"d","text":"Self-management"}]$o$,
   $a$["b"]$a$,
   $e$Skipping inspection on the basis of the tool's track record is automation over-trust.$e$,2,$b$2_understand$b$),
  ($g$5ec60603-0000-4000-8000-000000000002$g$,'es-419',
   $t$El hábito de un equipo de "aprobar sin leer porque el modelo rara vez se equivoca" se nombra mejor como:$t$,
   $o$[{"id":"a","text":"Confianza sana"},{"id":"b","text":"Exceso de confianza en la automatización"},{"id":"c","text":"El cuello de botella de revisión"},{"id":"d","text":"Autogestión"}]$o$,
   $a$["b"]$a$,
   $e$Saltarse la inspección con base en el historial de la herramienta es exceso de confianza en la automatización.$e$,2,$b$2_understand$b$),
  ($g$5ec60603-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$O hábito de um time de "aprovar sem ler porque o modelo raramente erra" é melhor nomeado como:$t$,
   $o$[{"id":"a","text":"Confiança saudável"},{"id":"b","text":"Excesso de confiança na automação"},{"id":"c","text":"O gargalo de revisão"},{"id":"d","text":"Autogestão"}]$o$,
   $a$["b"]$a$,
   $e$Pular a inspeção com base no histórico da ferramenta é excesso de confiança na automação.$e$,2,$b$2_understand$b$),

  -- S3 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000003$g$,'en',
   $t$A team ships a working feature, but in the next Sprint no one can modify it confidently because the design lived only in one Developer's AI session. This is primarily:$t$,
   $o$[{"id":"a","text":"A review bottleneck"},{"id":"b","text":"Eroded shared understanding"},{"id":"c","text":"Automation over-trust"},{"id":"d","text":"A Definition of Done failure"}]$o$,
   $a$["b"]$a$,
   $e$Knowledge trapped in private AI sessions leaves the team unable to collectively reason about or change the work.$e$,4,$b$4_analyze$b$),
  ($g$5ec60603-0000-4000-8000-000000000003$g$,'es-419',
   $t$Un equipo entrega una funcionalidad que funciona, pero en el siguiente Sprint nadie puede modificarla con confianza porque el diseño vivió solo en la sesión de IA de un Developer. Esto es principalmente:$t$,
   $o$[{"id":"a","text":"Un cuello de botella de revisión"},{"id":"b","text":"Entendimiento compartido erosionado"},{"id":"c","text":"Exceso de confianza en la automatización"},{"id":"d","text":"Una falla de la Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$El conocimiento atrapado en sesiones privadas de IA deja al equipo sin poder razonar colectivamente sobre el trabajo ni cambiarlo.$e$,4,$b$4_analyze$b$),
  ($g$5ec60603-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Um time entrega uma funcionalidade que funciona, mas no próximo Sprint ninguém consegue modificá-la com confiança porque o design viveu só na sessão de IA de um Developer. Isso é principalmente:$t$,
   $o$[{"id":"a","text":"Um gargalo de revisão"},{"id":"b","text":"Entendimento compartilhado erodido"},{"id":"c","text":"Excesso de confiança na automação"},{"id":"d","text":"Uma falha da Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$O conhecimento preso em sessões privadas de IA deixa o time sem conseguir raciocinar coletivamente sobre o trabalho nem mudá-lo.$e$,4,$b$4_analyze$b$),

  -- S4 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000004$g$,'en',
   $t$The clearest leading indicator of a review bottleneck is:$t$,
   $o$[{"id":"a","text":"Fewer commits"},{"id":"b","text":"A growing backlog of generated-but-unreviewed work"},{"id":"c","text":"A shorter Sprint"},{"id":"d","text":"More stakeholders attending the Review"}]$o$,
   $a$["b"]$a$,
   $e$A widening gap between generated work and reviewed-and-integrated work is the signal.$e$,2,$b$2_understand$b$),
  ($g$5ec60603-0000-4000-8000-000000000004$g$,'es-419',
   $t$El indicador anticipado más claro de un cuello de botella de revisión es:$t$,
   $o$[{"id":"a","text":"Menos commits"},{"id":"b","text":"Una acumulación creciente de trabajo generado pero sin revisar"},{"id":"c","text":"Un Sprint más corto"},{"id":"d","text":"Más interesados asistiendo al Review"}]$o$,
   $a$["b"]$a$,
   $e$Una brecha creciente entre el trabajo generado y el revisado e integrado es la señal.$e$,2,$b$2_understand$b$),
  ($g$5ec60603-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$O indicador antecipado mais claro de um gargalo de revisão é:$t$,
   $o$[{"id":"a","text":"Menos commits"},{"id":"b","text":"Um acúmulo crescente de trabalho gerado mas não revisado"},{"id":"c","text":"Um Sprint mais curto"},{"id":"d","text":"Mais stakeholders no Review"}]$o$,
   $a$["b"]$a$,
   $e$Uma lacuna crescente entre o trabalho gerado e o revisado e integrado é o sinal.$e$,2,$b$2_understand$b$),

  -- S5 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000005$g$,'en',
   $t$Which practice best counters automation over-trust without abandoning AI?$t$,
   $o$[{"id":"a","text":"Turn the AI off entirely"},{"id":"b","text":"Review AI output on its merits each time, not on the tool's reputation"},{"id":"c","text":"Approve faster to clear the queue"},{"id":"d","text":"Let the AI review its own output"}]$o$,
   $a$["b"]$a$,
   $e$The counter is verifying this work each time rather than trusting the track record.$e$,3,$b$3_apply$b$),
  ($g$5ec60603-0000-4000-8000-000000000005$g$,'es-419',
   $t$¿Qué práctica contrarresta mejor el exceso de confianza en la automatización sin abandonar la IA?$t$,
   $o$[{"id":"a","text":"Apagar la IA por completo"},{"id":"b","text":"Revisar la salida de IA por sus méritos cada vez, no por la reputación de la herramienta"},{"id":"c","text":"Aprobar más rápido para vaciar la cola"},{"id":"d","text":"Dejar que la IA revise su propia salida"}]$o$,
   $a$["b"]$a$,
   $e$El contrapeso es verificar este trabajo cada vez en vez de confiar en el historial.$e$,3,$b$3_apply$b$),
  ($g$5ec60603-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Qual prática melhor contraria o excesso de confiança na automação sem abandonar a IA?$t$,
   $o$[{"id":"a","text":"Desligar a IA por completo"},{"id":"b","text":"Revisar a saída de IA pelos seus méritos a cada vez, não pela reputação da ferramenta"},{"id":"c","text":"Aprovar mais rápido para esvaziar a fila"},{"id":"d","text":"Deixar a IA revisar a própria saída"}]$o$,
   $a$["b"]$a$,
   $e$O contrapeso é verificar este trabalho a cada vez em vez de confiar no histórico.$e$,3,$b$3_apply$b$),

  -- S6 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000006$g$,'en',
   $t$To prevent eroded shared understanding on an AI-heavy team, the most effective habit is:$t$,
   $o$[{"id":"a","text":"Each Developer keeps their AI chats private"},{"id":"b","text":"Bringing AI-assisted work into shared review and pairing so the reasoning is collective"},{"id":"c","text":"Measuring output per Developer"},{"id":"d","text":"Reducing the Sprint length"}]$o$,
   $a$["b"]$a$,
   $e$Making the reasoning shared through review and pairing rebuilds the collective mental model.$e$,3,$b$3_apply$b$),
  ($g$5ec60603-0000-4000-8000-000000000006$g$,'es-419',
   $t$Para prevenir el entendimiento compartido erosionado en un equipo intensivo en IA, el hábito más efectivo es:$t$,
   $o$[{"id":"a","text":"Que cada Developer mantenga privados sus chats de IA"},{"id":"b","text":"Llevar el trabajo asistido por IA a la revisión y el pairing compartidos para que el razonamiento sea colectivo"},{"id":"c","text":"Medir la salida por Developer"},{"id":"d","text":"Reducir la duración del Sprint"}]$o$,
   $a$["b"]$a$,
   $e$Hacer compartido el razonamiento mediante revisión y pairing reconstruye el modelo mental colectivo.$e$,3,$b$3_apply$b$),
  ($g$5ec60603-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Para prevenir o entendimento compartilhado erodido em um time intensivo em IA, o hábito mais eficaz é:$t$,
   $o$[{"id":"a","text":"Cada Developer manter seus chats de IA privados"},{"id":"b","text":"Levar o trabalho assistido por IA à revisão e ao pairing compartilhados para que o raciocínio seja coletivo"},{"id":"c","text":"Medir a saída por Developer"},{"id":"d","text":"Reduzir a duração do Sprint"}]$o$,
   $a$["b"]$a$,
   $e$Tornar o raciocínio compartilhado por meio de revisão e pairing reconstrói o modelo mental coletivo.$e$,3,$b$3_apply$b$),

  -- S7 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000007$g$,'en',
   $t$Why doesn't "just generate more with AI" fix a review bottleneck?$t$,
   $o$[{"id":"a","text":"AI generation is too expensive"},{"id":"b","text":"The constraint is inspection capacity, so adding generation widens the gap"},{"id":"c","text":"It violates the Sprint timebox"},{"id":"d","text":"The Product Owner forbids it"}]$o$,
   $a$["b"]$a$,
   $e$Adding to the non-constraint (generation) makes the constraint (review) worse, not better.$e$,3,$b$4_analyze$b$),
  ($g$5ec60603-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Por qué "solo generar más con IA" no arregla un cuello de botella de revisión?$t$,
   $o$[{"id":"a","text":"La generación con IA es muy cara"},{"id":"b","text":"La restricción es la capacidad de inspección, así que sumar generación amplía la brecha"},{"id":"c","text":"Viola el timebox del Sprint"},{"id":"d","text":"El Product Owner lo prohíbe"}]$o$,
   $a$["b"]$a$,
   $e$Sumar a la no-restricción (generación) empeora la restricción (revisión), no la mejora.$e$,3,$b$4_analyze$b$),
  ($g$5ec60603-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Por que "só gerar mais com IA" não resolve um gargalo de revisão?$t$,
   $o$[{"id":"a","text":"A geração com IA é cara demais"},{"id":"b","text":"A restrição é a capacidade de inspeção, então adicionar geração amplia a lacuna"},{"id":"c","text":"Viola o timebox do Sprint"},{"id":"d","text":"O Product Owner proíbe"}]$o$,
   $a$["b"]$a$,
   $e$Adicionar à não-restrição (geração) piora a restrição (revisão), não melhora.$e$,3,$b$4_analyze$b$),

  -- S8 ----------------------------------------------------------------------
  ($g$5ec60603-0000-4000-8000-000000000008$g$,'en',
   $t$Automation over-trust is dangerous mainly because:$t$,
   $o$[{"id":"a","text":"AI is always wrong"},{"id":"b","text":"Rare, confident errors slip through once the team stops verifying"},{"id":"c","text":"It slows the build"},{"id":"d","text":"It shortens the Sprint"}]$o$,
   $a$["b"]$a$,
   $e$The risk is the occasional confident error reaching production once vigilance drops.$e$,1,$b$2_understand$b$),
  ($g$5ec60603-0000-4000-8000-000000000008$g$,'es-419',
   $t$El exceso de confianza en la automatización es peligroso principalmente porque:$t$,
   $o$[{"id":"a","text":"La IA siempre se equivoca"},{"id":"b","text":"Los errores raros y seguros se cuelan una vez que el equipo deja de verificar"},{"id":"c","text":"Hace más lenta la construcción"},{"id":"d","text":"Acorta el Sprint"}]$o$,
   $a$["b"]$a$,
   $e$El riesgo es el error ocasional y seguro que llega a producción una vez que baja la vigilancia.$e$,1,$b$2_understand$b$),
  ($g$5ec60603-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$O excesso de confiança na automação é perigoso principalmente porque:$t$,
   $o$[{"id":"a","text":"A IA está sempre errada"},{"id":"b","text":"Erros raros e confiantes passam uma vez que o time para de verificar"},{"id":"c","text":"Deixa a construção mais lenta"},{"id":"d","text":"Encurta o Sprint"}]$o$,
   $a$["b"]$a$,
   $e$O risco é o erro ocasional e confiante chegando à produção uma vez que a vigilância cai.$e$,1,$b$2_understand$b$)
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
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.3')
--  group by language order by language;
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like '5ec60603-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
-- select question_group_id from public.quiz_questions
--  where question_group_id::text like '5ec60603-%'
--  group by question_group_id having count(distinct correct_answer::text) > 1;
