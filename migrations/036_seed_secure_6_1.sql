-- 036_seed_secure_6_1.sql
-- =============================================================================
-- SECURE pool: 8 questions for task 6.1 (concepts ai-as-tool-not-team-member +
-- human-held-accountabilities). FRESH items — distinct from the practice pool.
-- en + es-419 + pt-BR; each question shares a question_group_id (prefix 5ec6...)
-- and the SAME correct_answer + option ids across its three language rows.
-- pool='secure', is_exam_scope=true, status='approved', task_id by code '6.1'.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.1'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- S1 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000001$g$,'en',
   $t$A team lists their AI coding agent as a "Developer" on the team board. What is the core Scrum problem?$t$,
   $o$[{"id":"a","text":"The board is too small for another name"},{"id":"b","text":"Membership implies holding an accountability, which a tool cannot do"},{"id":"c","text":"AI agents work faster than Developers"},{"id":"d","text":"The Daily Scrum becomes longer"}]$o$,
   $a$["b"]$a$,
   $e$Listing AI as a Developer implies it holds an accountability. Tools cannot, so it blurs who is actually answerable.$e$,3,$b$3_apply$b$),
  ($g$5ec60601-0000-4000-8000-000000000001$g$,'es-419',
   $t$Un equipo lista a su agente de IA de código como "Developer" en el tablero del equipo. ¿Cuál es el problema central según Scrum?$t$,
   $o$[{"id":"a","text":"El tablero es muy pequeño para otro nombre"},{"id":"b","text":"Ser integrante implica sostener una accountability, lo que una herramienta no puede"},{"id":"c","text":"Los agentes de IA trabajan más rápido que los Developers"},{"id":"d","text":"El Daily Scrum se vuelve más largo"}]$o$,
   $a$["b"]$a$,
   $e$Listar a la IA como Developer implica que sostiene una accountability. Las herramientas no pueden, así que difumina quién es realmente responsable.$e$,3,$b$3_apply$b$),
  ($g$5ec60601-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Um time lista seu agente de IA de código como "Developer" no quadro do time. Qual é o problema central segundo o Scrum?$t$,
   $o$[{"id":"a","text":"O quadro é pequeno demais para outro nome"},{"id":"b","text":"Ser integrante implica sustentar uma accountability, o que uma ferramenta não pode"},{"id":"c","text":"Agentes de IA trabalham mais rápido que Developers"},{"id":"d","text":"O Daily Scrum fica mais longo"}]$o$,
   $a$["b"]$a$,
   $e$Listar a IA como Developer implica que ela sustenta uma accountability. Ferramentas não podem, então isso confunde quem é de fato responsável.$e$,3,$b$3_apply$b$),

  -- S2 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000002$g$,'en',
   $t$When AI drafts a large part of the Increment, accountability for that Increment:$t$,
   $o$[{"id":"a","text":"Transfers to the AI"},{"id":"b","text":"Remains with the Developers"},{"id":"c","text":"Splits between the AI and the Developers"},{"id":"d","text":"Moves to the vendor"}]$o$,
   $a$["b"]$a$,
   $e$Accountability for the Increment stays with the Developers regardless of how it was produced.$e$,2,$b$2_understand$b$),
  ($g$5ec60601-0000-4000-8000-000000000002$g$,'es-419',
   $t$Cuando la IA redacta gran parte del Increment, la accountability de ese Increment:$t$,
   $o$[{"id":"a","text":"Se transfiere a la IA"},{"id":"b","text":"Permanece con los Developers"},{"id":"c","text":"Se reparte entre la IA y los Developers"},{"id":"d","text":"Pasa al proveedor"}]$o$,
   $a$["b"]$a$,
   $e$La accountability del Increment se queda con los Developers sin importar cómo se produjo.$e$,2,$b$2_understand$b$),
  ($g$5ec60601-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Quando a IA rascunha grande parte do Increment, a accountability desse Increment:$t$,
   $o$[{"id":"a","text":"Transfere-se para a IA"},{"id":"b","text":"Permanece com os Developers"},{"id":"c","text":"Divide-se entre a IA e os Developers"},{"id":"d","text":"Passa para o fornecedor"}]$o$,
   $a$["b"]$a$,
   $e$A accountability do Increment fica com os Developers não importa como foi produzido.$e$,2,$b$2_understand$b$),

  -- S3 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000003$g$,'en',
   $t$A stakeholder asks the Scrum Master to "let the AI run the Daily Scrum and assign the day's work to the Developers." Why does this conflict with Scrum?$t$,
   $o$[{"id":"a","text":"The Daily Scrum is too short for an AI to run"},{"id":"b","text":"Self-management and the event belong to the Developers; a tool cannot self-manage on their behalf"},{"id":"c","text":"AI cannot read a calendar"},{"id":"d","text":"The Scrum Master, not the Developers, must run the Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$The Developers self-manage and own the Daily Scrum; handing that to a tool removes the accountability that must stay with them.$e$,4,$b$4_analyze$b$),
  ($g$5ec60601-0000-4000-8000-000000000003$g$,'es-419',
   $t$Un interesado pide al Scrum Master "dejar que la IA dirija el Daily Scrum y asigne el trabajo del día a los Developers". ¿Por qué choca con Scrum?$t$,
   $o$[{"id":"a","text":"El Daily Scrum es muy corto para que lo dirija una IA"},{"id":"b","text":"La autogestión y el evento pertenecen a los Developers; una herramienta no puede autogestionar en su nombre"},{"id":"c","text":"La IA no puede leer un calendario"},{"id":"d","text":"El Scrum Master, no los Developers, debe dirigir el Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$Los Developers se autogestionan y son dueños del Daily Scrum; ceder eso a una herramienta elimina la accountability que debe quedarse con ellos.$e$,4,$b$4_analyze$b$),
  ($g$5ec60601-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Um stakeholder pede ao Scrum Master para "deixar a IA conduzir o Daily Scrum e atribuir o trabalho do dia aos Developers". Por que isso conflita com o Scrum?$t$,
   $o$[{"id":"a","text":"O Daily Scrum é curto demais para uma IA conduzir"},{"id":"b","text":"A autogestão e o evento pertencem aos Developers; uma ferramenta não pode se autogerenciar em nome deles"},{"id":"c","text":"A IA não consegue ler um calendário"},{"id":"d","text":"O Scrum Master, não os Developers, deve conduzir o Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$Os Developers se autogerenciam e são donos do Daily Scrum; entregar isso a uma ferramenta remove a accountability que deve ficar com eles.$e$,4,$b$4_analyze$b$),

  -- S4 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000004$g$,'en',
   $t$In Scrum, AI tools are best described as:$t$,
   $o$[{"id":"a","text":"Members of the Scrum Team"},{"id":"b","text":"Tools that augment the people who hold the accountabilities"},{"id":"c","text":"A fourth Scrum accountability"},{"id":"d","text":"The owner of the Product Backlog"}]$o$,
   $a$["b"]$a$,
   $e$AI augments the people; it is not a member and holds no accountability.$e$,1,$b$2_understand$b$),
  ($g$5ec60601-0000-4000-8000-000000000004$g$,'es-419',
   $t$En Scrum, las herramientas de IA se describen mejor como:$t$,
   $o$[{"id":"a","text":"Integrantes del Scrum Team"},{"id":"b","text":"Herramientas que aumentan a las personas que sostienen las accountabilities"},{"id":"c","text":"Una cuarta accountability de Scrum"},{"id":"d","text":"El dueño del Product Backlog"}]$o$,
   $a$["b"]$a$,
   $e$La IA aumenta a las personas; no es integrante y no sostiene ninguna accountability.$e$,1,$b$2_understand$b$),
  ($g$5ec60601-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$No Scrum, as ferramentas de IA são melhor descritas como:$t$,
   $o$[{"id":"a","text":"Integrantes do Scrum Team"},{"id":"b","text":"Ferramentas que ampliam as pessoas que sustentam as accountabilities"},{"id":"c","text":"Uma quarta accountability do Scrum"},{"id":"d","text":"O dono do Product Backlog"}]$o$,
   $a$["b"]$a$,
   $e$A IA amplia as pessoas; não é integrante e não sustenta nenhuma accountability.$e$,1,$b$2_understand$b$),

  -- S5 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000005$g$,'en',
   $t$Two teams use AI heavily. Team A says "the AI is accountable for quality"; Team B says "we are accountable; the AI helps us." Which aligns with Scrum?$t$,
   $o$[{"id":"a","text":"Team A"},{"id":"b","text":"Team B"},{"id":"c","text":"Both"},{"id":"d","text":"Neither"}]$o$,
   $a$["b"]$a$,
   $e$Accountability stays with people; Team B keeps the human answerability Scrum requires.$e$,3,$b$3_apply$b$),
  ($g$5ec60601-0000-4000-8000-000000000005$g$,'es-419',
   $t$Dos equipos usan IA intensamente. El Equipo A dice "la IA es responsable de la calidad"; el Equipo B dice "nosotros somos responsables; la IA nos ayuda". ¿Cuál se alinea con Scrum?$t$,
   $o$[{"id":"a","text":"El Equipo A"},{"id":"b","text":"El Equipo B"},{"id":"c","text":"Ambos"},{"id":"d","text":"Ninguno"}]$o$,
   $a$["b"]$a$,
   $e$La accountability se queda con las personas; el Equipo B conserva la responsabilidad humana que Scrum exige.$e$,3,$b$3_apply$b$),
  ($g$5ec60601-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Dois times usam IA intensamente. O Time A diz "a IA é responsável pela qualidade"; o Time B diz "nós somos responsáveis; a IA nos ajuda". Qual se alinha com o Scrum?$t$,
   $o$[{"id":"a","text":"O Time A"},{"id":"b","text":"O Time B"},{"id":"c","text":"Ambos"},{"id":"d","text":"Nenhum"}]$o$,
   $a$["b"]$a$,
   $e$A accountability fica com as pessoas; o Time B mantém a responsabilidade humana que o Scrum exige.$e$,3,$b$3_apply$b$),

  -- S6 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000006$g$,'en',
   $t$Which is true about AI and the three Scrum accountabilities (Product Owner, Scrum Master, Developers)?$t$,
   $o$[{"id":"a","text":"AI can hold any of them if it is capable enough"},{"id":"b","text":"None can be held by a tool; they belong to people"},{"id":"c","text":"AI can hold the Developers' accountability only"},{"id":"d","text":"AI can hold the Scrum Master accountability only"}]$o$,
   $a$["b"]$a$,
   $e$The three accountabilities are human; a tool cannot hold any of them.$e$,2,$b$2_understand$b$),
  ($g$5ec60601-0000-4000-8000-000000000006$g$,'es-419',
   $t$¿Qué es verdad sobre la IA y las tres accountabilities de Scrum (Product Owner, Scrum Master, Developers)?$t$,
   $o$[{"id":"a","text":"La IA puede sostener cualquiera si es lo bastante capaz"},{"id":"b","text":"Ninguna puede ser sostenida por una herramienta; pertenecen a personas"},{"id":"c","text":"La IA puede sostener solo la de los Developers"},{"id":"d","text":"La IA puede sostener solo la del Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$Las tres accountabilities son humanas; una herramienta no puede sostener ninguna.$e$,2,$b$2_understand$b$),
  ($g$5ec60601-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$O que é verdade sobre a IA e as três accountabilities do Scrum (Product Owner, Scrum Master, Developers)?$t$,
   $o$[{"id":"a","text":"A IA pode sustentar qualquer uma se for capaz o suficiente"},{"id":"b","text":"Nenhuma pode ser sustentada por uma ferramenta; pertencem a pessoas"},{"id":"c","text":"A IA pode sustentar só a dos Developers"},{"id":"d","text":"A IA pode sustentar só a do Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$As três accountabilities são humanas; uma ferramenta não pode sustentar nenhuma.$e$,2,$b$2_understand$b$),

  -- S7 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000007$g$,'en',
   $t$A Developer integrates AI-written code and it ships with a defect. Who is answerable?$t$,
   $o$[{"id":"a","text":"The AI that wrote it"},{"id":"b","text":"The Developers, who own the Increment"},{"id":"c","text":"No one, since it was AI-generated"},{"id":"d","text":"The AI vendor"}]$o$,
   $a$["b"]$a$,
   $e$The Developers own the Increment and answer for what ships, including integrated AI work.$e$,3,$b$3_apply$b$),
  ($g$5ec60601-0000-4000-8000-000000000007$g$,'es-419',
   $t$Un Developer integra código escrito por IA y se entrega con un defecto. ¿Quién responde?$t$,
   $o$[{"id":"a","text":"La IA que lo escribió"},{"id":"b","text":"Los Developers, que son dueños del Increment"},{"id":"c","text":"Nadie, ya que fue generado por IA"},{"id":"d","text":"El proveedor de la IA"}]$o$,
   $a$["b"]$a$,
   $e$Los Developers son dueños del Increment y responden por lo que se entrega, incluido el trabajo de IA integrado.$e$,3,$b$3_apply$b$),
  ($g$5ec60601-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Um Developer integra código escrito por IA e ele é entregue com um defeito. Quem responde?$t$,
   $o$[{"id":"a","text":"A IA que o escreveu"},{"id":"b","text":"Os Developers, que são donos do Increment"},{"id":"c","text":"Ninguém, já que foi gerado por IA"},{"id":"d","text":"O fornecedor da IA"}]$o$,
   $a$["b"]$a$,
   $e$Os Developers são donos do Increment e respondem pelo que é entregue, incluindo o trabalho de IA integrado.$e$,3,$b$3_apply$b$),

  -- S8 ----------------------------------------------------------------------
  ($g$5ec60601-0000-4000-8000-000000000008$g$,'en',
   $t$Why is keeping "AI as a tool, not a member" important for a Scrum Team's empiricism?$t$,
   $o$[{"id":"a","text":"It speeds up the build"},{"id":"b","text":"It preserves a human who is answerable to inspect outcomes and adapt — the anchor empiricism needs"},{"id":"c","text":"It shortens the Sprint"},{"id":"d","text":"It reduces the number of Developers"}]$o$,
   $a$["b"]$a$,
   $e$A clear human accountability keeps someone answerable to inspect and adapt; that anchor is what empiricism depends on.$e$,4,$b$4_analyze$b$),
  ($g$5ec60601-0000-4000-8000-000000000008$g$,'es-419',
   $t$¿Por qué mantener "la IA como herramienta, no como integrante" es importante para el empirismo de un Scrum Team?$t$,
   $o$[{"id":"a","text":"Acelera la construcción"},{"id":"b","text":"Preserva a un humano responsable de inspeccionar resultados y adaptarse: el ancla que el empirismo necesita"},{"id":"c","text":"Acorta el Sprint"},{"id":"d","text":"Reduce la cantidad de Developers"}]$o$,
   $a$["b"]$a$,
   $e$Una accountability humana clara mantiene a alguien responsable de inspeccionar y adaptarse; esa ancla es de lo que depende el empirismo.$e$,4,$b$4_analyze$b$),
  ($g$5ec60601-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Por que manter "a IA como ferramenta, não como integrante" é importante para o empirismo de um Scrum Team?$t$,
   $o$[{"id":"a","text":"Acelera a construção"},{"id":"b","text":"Preserva um humano responsável por inspecionar resultados e adaptar: a âncora que o empirismo precisa"},{"id":"c","text":"Encurta o Sprint"},{"id":"d","text":"Reduz o número de Developers"}]$o$,
   $a$["b"]$a$,
   $e$Uma accountability humana clara mantém alguém responsável por inspecionar e adaptar; essa âncora é do que o empirismo depende.$e$,4,$b$4_analyze$b$)
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

-- ---- VALIDATION (run all three; expect 8/8/8, then 0 rows, then 0 rows) ------
-- 1) Count per language (expect 8 each):
-- select language, count(*) from public.quiz_questions
--  where pool='secure' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.1')
--  group by language order by language;
-- 2) Answer-in-options sanity (expect 0 rows):
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like '5ec60601-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
-- 3) Cross-sibling consistency — each group has ONE correct_answer across langs (expect 0 rows):
-- select question_group_id from public.quiz_questions
--  where question_group_id::text like '5ec60601-%'
--  group by question_group_id having count(distinct correct_answer::text) > 1;
