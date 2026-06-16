-- 041_seed_secure_6_5.sql
-- =============================================================================
-- SECURE pool: 8 fresh questions for task 6.5 (concepts delegable-ai-work +
-- retained-accountabilities). Distinct from the practice pool. COMPLETES the
-- D6 secure pool (6 exam-scope tasks x 8 = 48 per language).
-- en + es-419 + pt-BR; shared question_group_id (prefix 5ec6...) + same
-- correct_answer/option ids across languages. pool='secure', is_exam_scope=true.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.5'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- S1 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000001$g$,'en',
   $t$Which task is appropriate to delegate to AI with human review?$t$,
   $o$[{"id":"a","text":"Committing to the Sprint Goal"},{"id":"b","text":"Generating a first draft of test cases from a spec"},{"id":"c","text":"Judging whether the Increment meets the Definition of Done"},{"id":"d","text":"Holding accountability for the Increment"}]$o$,
   $a$["b"]$a$,
   $e$Generating a first draft is doing — delegable with human review; the other three are accountabilities.$e$,3,$b$3_apply$b$),
  ($g$5ec60605-0000-4000-8000-000000000001$g$,'es-419',
   $t$¿Qué tarea es apropiada para delegar a la IA con revisión humana?$t$,
   $o$[{"id":"a","text":"Comprometerse con el Sprint Goal"},{"id":"b","text":"Generar un primer borrador de casos de prueba a partir de una especificación"},{"id":"c","text":"Juzgar si el Increment cumple la Definition of Done"},{"id":"d","text":"Sostener la accountability del Increment"}]$o$,
   $a$["b"]$a$,
   $e$Generar un primer borrador es el hacer: delegable con revisión humana; las otras tres son accountabilities.$e$,3,$b$3_apply$b$),
  ($g$5ec60605-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Qual tarefa é apropriada para delegar à IA com revisão humana?$t$,
   $o$[{"id":"a","text":"Comprometer-se com o Sprint Goal"},{"id":"b","text":"Gerar um primeiro rascunho de casos de teste a partir de uma especificação"},{"id":"c","text":"Julgar se o Increment cumpre a Definition of Done"},{"id":"d","text":"Sustentar a accountability do Increment"}]$o$,
   $a$["b"]$a$,
   $e$Gerar um primeiro rascunho é o fazer: delegável com revisão humana; as outras três são accountabilities.$e$,3,$b$3_apply$b$),

  -- S2 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000002$g$,'en',
   $t$Commitment to the Sprint Goal is something that:$t$,
   $o$[{"id":"a","text":"Can be delegated to a capable AI"},{"id":"b","text":"Must stay with the people, because it is an accountability"},{"id":"c","text":"Belongs to the AI vendor"},{"id":"d","text":"Disappears when AI is used"}]$o$,
   $a$["b"]$a$,
   $e$A commitment is a human accountability; capability does not make it delegable.$e$,2,$b$2_understand$b$),
  ($g$5ec60605-0000-4000-8000-000000000002$g$,'es-419',
   $t$El compromiso con el Sprint Goal es algo que:$t$,
   $o$[{"id":"a","text":"Puede delegarse a una IA capaz"},{"id":"b","text":"Debe quedarse con las personas, porque es una accountability"},{"id":"c","text":"Pertenece al proveedor de IA"},{"id":"d","text":"Desaparece cuando se usa IA"}]$o$,
   $a$["b"]$a$,
   $e$Un compromiso es una accountability humana; la capacidad no lo vuelve delegable.$e$,2,$b$2_understand$b$),
  ($g$5ec60605-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$O compromisso com o Sprint Goal é algo que:$t$,
   $o$[{"id":"a","text":"Pode ser delegado a uma IA capaz"},{"id":"b","text":"Deve ficar com as pessoas, porque é uma accountability"},{"id":"c","text":"Pertence ao fornecedor de IA"},{"id":"d","text":"Desaparece quando se usa IA"}]$o$,
   $a$["b"]$a$,
   $e$Um compromisso é uma accountability humana; a capacidade não o torna delegável.$e$,2,$b$2_understand$b$),

  -- S3 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000003$g$,'en',
   $t$A manager argues "if the AI can do the analysis, it can own the decision too." The flaw is:$t$,
   $o$[{"id":"a","text":"AI analysis is always wrong"},{"id":"b","text":"Conflating delegable doing with non-delegable accountability — owning a decision means being answerable, which a tool cannot be"},{"id":"c","text":"Analysis is not a task"},{"id":"d","text":"There is no flaw"}]$o$,
   $a$["b"]$a$,
   $e$Doing the analysis is delegable; owning the decision is an accountability requiring a human who can answer for it.$e$,4,$b$4_analyze$b$),
  ($g$5ec60605-0000-4000-8000-000000000003$g$,'es-419',
   $t$Un gerente argumenta "si la IA puede hacer el análisis, también puede ser dueña de la decisión". La falla es:$t$,
   $o$[{"id":"a","text":"El análisis de IA siempre está mal"},{"id":"b","text":"Confundir el hacer delegable con la accountability no delegable: ser dueño de una decisión es ser responsable, lo que una herramienta no puede"},{"id":"c","text":"El análisis no es una tarea"},{"id":"d","text":"No hay falla"}]$o$,
   $a$["b"]$a$,
   $e$Hacer el análisis es delegable; ser dueño de la decisión es una accountability que requiere un humano que pueda responder por ella.$e$,4,$b$4_analyze$b$),
  ($g$5ec60605-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Um gestor argumenta "se a IA consegue fazer a análise, também pode ser dona da decisão". A falha é:$t$,
   $o$[{"id":"a","text":"A análise de IA está sempre errada"},{"id":"b","text":"Confundir o fazer delegável com a accountability não delegável: ser dono de uma decisão é ser responsável, o que uma ferramenta não pode"},{"id":"c","text":"Análise não é uma tarefa"},{"id":"d","text":"Não há falha"}]$o$,
   $a$["b"]$a$,
   $e$Fazer a análise é delegável; ser dono da decisão é uma accountability que exige um humano que possa responder por ela.$e$,4,$b$4_analyze$b$),

  -- S4 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000004$g$,'en',
   $t$The pattern that makes AI work safely delegable is:$t$,
   $o$[{"id":"a","text":"The AI ships it directly"},{"id":"b","text":"AI does the first pass, and a human reviews and owns the result"},{"id":"c","text":"No human reviews it"},{"id":"d","text":"It bypasses the Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Delegable AI work always pairs an AI first pass with human review and ownership.$e$,1,$b$2_understand$b$),
  ($g$5ec60605-0000-4000-8000-000000000004$g$,'es-419',
   $t$El patrón que hace que el trabajo de IA sea delegable con seguridad es:$t$,
   $o$[{"id":"a","text":"La IA lo entrega directamente"},{"id":"b","text":"La IA hace el primer intento y una persona revisa y es dueña del resultado"},{"id":"c","text":"Ninguna persona lo revisa"},{"id":"d","text":"Se salta la Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$El trabajo de IA delegable siempre combina un primer intento de IA con revisión y propiedad humanas.$e$,1,$b$2_understand$b$),
  ($g$5ec60605-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$O padrão que torna o trabalho de IA delegável com segurança é:$t$,
   $o$[{"id":"a","text":"A IA entrega diretamente"},{"id":"b","text":"A IA faz a primeira versão e uma pessoa revisa e assume o resultado"},{"id":"c","text":"Nenhuma pessoa o revisa"},{"id":"d","text":"Pula a Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$O trabalho de IA delegável sempre combina uma primeira versão da IA com revisão e propriedade humanas.$e$,1,$b$2_understand$b$),

  -- S5 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000005$g$,'en',
   $t$Delegating the doing (first passes) to AI primarily:$t$,
   $o$[{"id":"a","text":"Removes the Developers"},{"id":"b","text":"Multiplies the team's capacity"},{"id":"c","text":"Shortens the Sprint"},{"id":"d","text":"Replaces the Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Handing first passes to AI multiplies capacity while people keep judgment.$e$,2,$b$3_apply$b$),
  ($g$5ec60605-0000-4000-8000-000000000005$g$,'es-419',
   $t$Delegar el hacer (los primeros intentos) a la IA principalmente:$t$,
   $o$[{"id":"a","text":"Elimina a los Developers"},{"id":"b","text":"Multiplica la capacidad del equipo"},{"id":"c","text":"Acorta el Sprint"},{"id":"d","text":"Reemplaza la Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Pasar los primeros intentos a la IA multiplica la capacidad mientras las personas conservan el juicio.$e$,2,$b$3_apply$b$),
  ($g$5ec60605-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Delegar o fazer (as primeiras versões) à IA principalmente:$t$,
   $o$[{"id":"a","text":"Remove os Developers"},{"id":"b","text":"Multiplica a capacidade do time"},{"id":"c","text":"Encurta o Sprint"},{"id":"d","text":"Substitui a Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Passar as primeiras versões à IA multiplica a capacidade enquanto as pessoas mantêm o julgamento.$e$,2,$b$3_apply$b$),

  -- S6 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000006$g$,'en',
   $t$The simplest test for whether something can be delegated to AI is:$t$,
   $o$[{"id":"a","text":"Is the AI fast enough?"},{"id":"b","text":"\"If this goes wrong, who answers?\" — if a person must, keep the judgment human"},{"id":"c","text":"Is the task technical?"},{"id":"d","text":"Did the Product Owner approve it?"}]$o$,
   $a$["b"]$a$,
   $e$Answerability is the test: if a person must answer for it, the judgment stays human even when the doing is delegated.$e$,3,$b$4_analyze$b$),
  ($g$5ec60605-0000-4000-8000-000000000006$g$,'es-419',
   $t$La prueba más simple para saber si algo se puede delegar a la IA es:$t$,
   $o$[{"id":"a","text":"¿Es la IA lo bastante rápida?"},{"id":"b","text":"\"Si esto sale mal, ¿quién responde?\": si una persona debe hacerlo, mantén humano el juicio"},{"id":"c","text":"¿Es técnica la tarea?"},{"id":"d","text":"¿La aprobó el Product Owner?"}]$o$,
   $a$["b"]$a$,
   $e$La responsabilidad es la prueba: si una persona debe responder por ello, el juicio sigue siendo humano aunque se delegue el hacer.$e$,3,$b$4_analyze$b$),
  ($g$5ec60605-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$O teste mais simples para saber se algo pode ser delegado à IA é:$t$,
   $o$[{"id":"a","text":"A IA é rápida o suficiente?"},{"id":"b","text":"\"Se isto der errado, quem responde?\": se uma pessoa deve, mantenha o julgamento humano"},{"id":"c","text":"A tarefa é técnica?"},{"id":"d","text":"O Product Owner aprovou?"}]$o$,
   $a$["b"]$a$,
   $e$A responsabilidade é o teste: se uma pessoa deve responder por isso, o julgamento permanece humano mesmo quando o fazer é delegado.$e$,3,$b$4_analyze$b$),

  -- S7 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000007$g$,'en',
   $t$Why does delegating accountability — not just tasks — to AI break the empirical loop?$t$,
   $o$[{"id":"a","text":"It slows production"},{"id":"b","text":"No person remains answerable to inspect the outcome and adapt, so the team produces without learning"},{"id":"c","text":"It shortens the Sprint"},{"id":"d","text":"It removes the Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Empiricism needs a human answerable at each commitment; remove that and inspection and adaptation have no owner.$e$,3,$b$4_analyze$b$),
  ($g$5ec60605-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Por qué delegar la accountability —no solo las tareas— a la IA rompe el ciclo empírico?$t$,
   $o$[{"id":"a","text":"Hace más lenta la producción"},{"id":"b","text":"Ninguna persona queda responsable de inspeccionar el resultado y adaptarse, así que el equipo produce sin aprender"},{"id":"c","text":"Acorta el Sprint"},{"id":"d","text":"Elimina al Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo necesita un humano responsable en cada compromiso; quítalo y la inspección y la adaptación no tienen dueño.$e$,3,$b$4_analyze$b$),
  ($g$5ec60605-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Por que delegar a accountability —não só as tarefas— à IA quebra o ciclo empírico?$t$,
   $o$[{"id":"a","text":"Deixa a produção mais lenta"},{"id":"b","text":"Nenhuma pessoa permanece responsável por inspecionar o resultado e adaptar, então o time produz sem aprender"},{"id":"c","text":"Encurta o Sprint"},{"id":"d","text":"Remove o Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo precisa de um humano responsável em cada compromisso; remova isso e a inspeção e a adaptação ficam sem dono.$e$,3,$b$4_analyze$b$),

  -- S8 ----------------------------------------------------------------------
  ($g$5ec60605-0000-4000-8000-000000000008$g$,'en',
   $t$"You can delegate producing a thing, but never owning it" means:$t$,
   $o$[{"id":"a","text":"Production must stay human"},{"id":"b","text":"The doing can move to a tool while ownership and answerability stay with people"},{"id":"c","text":"AI can own anything it produces"},{"id":"d","text":"Ownership is automated by AI"}]$o$,
   $a$["b"]$a$,
   $e$Producing is delegable; owning and answering for the result is not.$e$,2,$b$2_understand$b$),
  ($g$5ec60605-0000-4000-8000-000000000008$g$,'es-419',
   $t$"Puedes delegar producir una cosa, pero nunca ser dueño de ella" significa:$t$,
   $o$[{"id":"a","text":"La producción debe seguir siendo humana"},{"id":"b","text":"El hacer puede pasar a una herramienta mientras la propiedad y la responsabilidad se quedan con las personas"},{"id":"c","text":"La IA puede ser dueña de todo lo que produce"},{"id":"d","text":"La propiedad la automatiza la IA"}]$o$,
   $a$["b"]$a$,
   $e$Producir es delegable; ser dueño y responder por el resultado no.$e$,2,$b$2_understand$b$),
  ($g$5ec60605-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$"Você pode delegar produzir uma coisa, mas nunca ser dono dela" significa:$t$,
   $o$[{"id":"a","text":"A produção deve permanecer humana"},{"id":"b","text":"O fazer pode passar para uma ferramenta enquanto a propriedade e a responsabilidade ficam com as pessoas"},{"id":"c","text":"A IA pode ser dona de tudo que produz"},{"id":"d","text":"A propriedade é automatizada pela IA"}]$o$,
   $a$["b"]$a$,
   $e$Produzir é delegável; ser dono e responder pelo resultado não.$e$,2,$b$2_understand$b$)
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
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.5')
--  group by language order by language;
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like '5ec60605-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
-- select question_group_id from public.quiz_questions
--  where question_group_id::text like '5ec60605-%'
--  group by question_group_id having count(distinct correct_answer::text) > 1;

-- ---- FULL D6 SECURE TALLY (expect 48 per language = 144 rows) ----------------
-- select q.language, count(*) from public.quiz_questions q
--  join public.tasks t on t.id = q.task_id
--  where q.pool='secure' and t.domain_id = 'd0d10001-0000-0000-0000-000000000006'
--  group by q.language order by q.language;
-- Per-task secure coverage (expect 6 tasks x 8 each, 6.7 absent by design):
-- select t.code, q.language, count(*) from public.quiz_questions q
--  join public.tasks t on t.id = q.task_id
--  where q.pool='secure' and t.domain_id = 'd0d10001-0000-0000-0000-000000000006'
--  group by t.code, q.language order by t.code, q.language;
