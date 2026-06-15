-- 025_seed_lesson06_05.sql
-- =============================================================================
-- Lesson 06-05 "What to Delegate, What to Keep"
-- (task 6.5; concepts delegable-ai-work, retained-accountabilities)
-- in en + es-419 + pt-BR. Module 6, order_index 5.
-- drag-match capped at 4 items / 2 targets per the interaction-sizing rule.
-- Dollar-quoted ($lesson$ body, $jta$ title); idempotent on (slug, language).
-- =============================================================================

-- ---- 06-05 en ----------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'en', '06-05-what-to-delegate-what-to-keep',
  'c0000000-0000-0000-0000-00000000a605'::uuid,
  $jta$What to Delegate, What to Keep$jta$,
  5, 8,
  $lesson$---
lesson_id: 06-05-what-to-delegate-what-to-keep
module_slug: ai-augmented-teams
certification_code: SMPC
title: "What to Delegate, What to Keep"
subtitle: AI can do the work — but some things a team must never hand over
language: en
lesson_group_id: c0000000-0000-0000-0000-00000000a605
duration_minutes: 8
order_index: 5
task_codes: [6.5]
concept_slugs:
  - delegable-ai-work
  - retained-accountabilities
prerequisites:
  - 06-04-empiricism-under-acceleration
preview: |
  An 8-minute lesson on drawing the line between what a Scrum Team can safely
  delegate to AI and the accountabilities it must keep human — and the simple
  test that separates the two.
authors:
  - Certidemy team
status: published
---

::hook
The question is never "can AI do this?" The answer is increasingly yes. The question is "should the team hand this over?"
::

::concept title="Two Questions That Look Like One"
As AI gets more capable, teams blur two very different questions: *can* AI do a task, and *should* the team delegate it. Capability keeps expanding; that does not settle what to delegate.

The line is not about difficulty. It is about the difference between **doing the work** and **being answerable for it**. A team can delegate a great deal of the doing. It cannot delegate the answering — the accountabilities that, as you saw in the first lesson, must stay human. This lesson makes that line concrete so you can hold it in real decisions.
::

::concept title="What a Team Can Safely Delegate"
[Plenty of work is safely delegable to AI]{glossary="delegable-ai-work"} — as long as a person still inspects the result. The pattern is the same across all of it: AI does a first pass, a human reviews and owns the outcome.

Good candidates are drafting (code, release notes, documentation), generation (test cases, boilerplate, examples), analysis (clustering feedback, spotting patterns in data), and summarization (condensing a long backlog or thread). In each, AI produces leverage and the team keeps judgment. Delegating these frees the team to spend its limited human attention where it actually matters — which is the next category.
::

::concept title="What Must Stay Human"
Some things are not delegable at any capability level, because they are accountabilities, not tasks. [These must stay human]{glossary="retained-accountabilities"}:

- **Commitment to the Sprint Goal** — a commitment is a promise a person makes, not output a tool emits.
- **The Definition of Done** — judging the standard is met is the Developers' accountability.
- **Self-management** — the team decides who does what, how, and what it works on; a tool cannot self-manage on the team's behalf.
- **Facilitation of Scrum events** — and the decisions made in them.
- **Accountability for the Increment** — the team owns the result, including AI's contributions.

Notice the pattern: you can delegate producing a thing, but never owning it. The doing can move to a tool; the answering stays with people.
::

::callout type="pro-tip"
A one-line test for any task: "If this goes wrong, who answers?" If a person must answer, keep the judgment human — delegate the doing if you like, but the team owns the call. If nothing about it requires answering, it is safe to delegate outright.
::

::interactive widget="drag-match" id="delegate-to-ai-or-keep-human" concept_slugs="delegable-ai-work,retained-accountabilities"
{
  "items": [
    { "id": "a", "text": "Drafting release notes from the commit history" },
    { "id": "b", "text": "Committing the team to the Sprint Goal" },
    { "id": "c", "text": "Summarizing scattered user feedback into themes" },
    { "id": "d", "text": "Deciding the Increment meets the Definition of Done" }
  ],
  "targets": [
    { "id": "delegate", "text": "Safe to delegate to AI" },
    { "id": "keep", "text": "Must stay human" }
  ],
  "correct": { "a": "delegate", "b": "keep", "c": "delegate", "d": "keep" },
  "allowReuse": true,
  "explanation": "Drafting and summarizing are doing — delegate them, with a human reviewing the result. Committing to the Sprint Goal and deciding the Definition of Done is met are accountabilities — they stay human no matter how capable the tool is."
}
::

::concept title="Why the Line Holds"
Delegating the doing multiplies the team's capacity: the same people now get more done because AI handles first passes. That is the upside, and it is real.

Delegating the accountability does the opposite — it removes the person who can answer for an outcome and adapt. If "the AI owns the Sprint Goal," then when the Goal is missed, no one learns, because no person was answerable for it. The empirical loop needs a human at the point of every commitment and judgment, because only a human inspects the result and changes course next time. Keep the doing delegable and the answering human, and AI makes the team faster without making it hollow.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Which of these is safe for a Scrum Team to delegate to AI, with human review?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Committing to the Sprint Goal" },
      { "id": "b", "text": "Drafting documentation from existing code" },
      { "id": "c", "text": "Deciding the Definition of Done is met" },
      { "id": "d", "text": "Owning accountability for the Increment" }
    ],
    "correct": ["b"],
    "explanation": "Drafting is doing — safely delegable as long as a human reviews and owns the result. The other three are accountabilities that must stay human.",
    "concept_slugs": ["delegable-ai-work"],
    "bloom_level": "2_understand",
    "difficulty": 1
  },
  {
    "id": "q2",
    "question": "Why can a team never delegate commitment to the Sprint Goal to an AI, regardless of how capable it is?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Because AI cannot process the Sprint Backlog fast enough" },
      { "id": "b", "text": "Because a commitment is a promise a person is answerable for — it is an accountability, not a task" },
      { "id": "c", "text": "Because the Scrum Guide bans AI from Sprint Planning" },
      { "id": "d", "text": "Because the Product Owner must write the Sprint Goal alone" }
    ],
    "correct": ["b"],
    "explanation": "Commitment is being answerable for an outcome — an accountability. Capability is irrelevant; a tool cannot hold a commitment because it cannot answer for missing it.",
    "concept_slugs": ["retained-accountabilities"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "What is the simple test for whether a task can be delegated to AI?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Whether the AI is fast enough to do it" },
      { "id": "b", "text": "Whether anyone needs to answer if it goes wrong — if so, the judgment stays human" },
      { "id": "c", "text": "Whether the task is technical or not" },
      { "id": "d", "text": "Whether the Product Owner approves it" }
    ],
    "correct": ["b"],
    "explanation": "Ask 'if this goes wrong, who answers?' If a person must answer, keep the judgment human; you may still delegate the doing. If nothing requires answering, it's safe to delegate outright.",
    "concept_slugs": ["delegable-ai-work", "retained-accountabilities"],
    "bloom_level": "4_analyze",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "What happens to Scrum's empirical loop if a team delegates accountability — not just tasks — to AI?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "It speeds up, because AI removes human delay" },
      { "id": "b", "text": "It breaks, because no person is answerable to inspect the outcome and adapt next time" },
      { "id": "c", "text": "It is unaffected, since the work still gets done" },
      { "id": "d", "text": "It improves, because AI is more consistent than people" }
    ],
    "correct": ["b"],
    "explanation": "The empirical loop needs a human at each commitment and judgment to inspect the result and change course. Delegating the accountability removes that person, so the team produces but no longer learns.",
    "concept_slugs": ["retained-accountabilities"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  }
]
::

::summary
- The real question is not whether AI *can* do a task, but whether the team *should* delegate it.
- Safely delegable: drafting, generation, analysis, summarization — the doing — always with human review.
- Must stay human: commitment to the Sprint Goal, the Definition of Done, self-management, event facilitation, and accountability for the Increment.
- The test: "if this goes wrong, who answers?" If a person must answer, keep the judgment human.
- Delegating the doing multiplies capacity; delegating the answering removes the human the empirical loop depends on.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-05-what-to-delegate-what-to-keep' and l.language = 'en');

-- ---- 06-05 es-419 ------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'es-419', '06-05-what-to-delegate-what-to-keep',
  'c0000000-0000-0000-0000-00000000a605'::uuid,
  $jta$Qué delegar, qué conservar$jta$,
  5, 8,
  $lesson$---
lesson_id: 06-05-what-to-delegate-what-to-keep
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Qué delegar, qué conservar"
subtitle: La IA puede hacer el trabajo, pero hay cosas que un equipo nunca debe ceder
language: es-419
lesson_group_id: c0000000-0000-0000-0000-00000000a605
duration_minutes: 8
order_index: 5
task_codes: [6.5]
concept_slugs:
  - delegable-ai-work
  - retained-accountabilities
prerequisites:
  - 06-04-empiricism-under-acceleration
preview: |
  Una lección de 8 minutos sobre dónde trazar la línea entre lo que un Scrum
  Team puede delegar con seguridad a la IA y las accountabilities que debe
  conservar humanas, y la prueba simple que separa ambas.
authors:
  - Certidemy team
status: published
---

::hook
La pregunta nunca es "¿puede la IA hacer esto?". Cada vez más, la respuesta es sí. La pregunta es "¿debería el equipo ceder esto?".
::

::concept title="Dos preguntas que parecen una"
A medida que la IA se vuelve más capaz, los equipos confunden dos preguntas muy distintas: si la IA *puede* hacer una tarea, y si el equipo *debería* delegarla. La capacidad sigue creciendo; eso no resuelve qué delegar.

La línea no se trata de dificultad. Se trata de la diferencia entre **hacer el trabajo** y **ser responsable de él**. Un equipo puede delegar gran parte del hacer. No puede delegar el responder: las accountabilities que, como viste en la primera lección, deben seguir siendo humanas. Esta lección hace concreta esa línea para que la sostengas en decisiones reales.
::

::concept title="Lo que un equipo puede delegar con seguridad"
[Mucho trabajo se puede delegar con seguridad a la IA]{glossary="delegable-ai-work"}, siempre que una persona inspeccione el resultado. El patrón es el mismo en todos los casos: la IA hace un primer intento, una persona revisa y se hace dueña del resultado.

Buenos candidatos son la redacción (código, notas de versión, documentación), la generación (casos de prueba, boilerplate, ejemplos), el análisis (agrupar feedback, detectar patrones en datos) y el resumen (condensar un backlog largo o un hilo). En cada uno, la IA produce apalancamiento y el equipo conserva el juicio. Delegar estas cosas libera al equipo para gastar su atención humana limitada donde realmente importa, que es la siguiente categoría.
::

::concept title="Lo que debe seguir siendo humano"
Algunas cosas no son delegables a ningún nivel de capacidad, porque son accountabilities, no tareas. [Estas deben seguir siendo humanas]{glossary="retained-accountabilities"}:

- **El compromiso con el Sprint Goal**: un compromiso es una promesa que hace una persona, no salida que emite una herramienta.
- **La Definition of Done**: juzgar que se cumple el estándar es accountability de los Developers.
- **La autogestión**: el equipo decide quién hace qué, cómo y en qué trabaja; una herramienta no puede autogestionarse en nombre del equipo.
- **La facilitación de los eventos de Scrum** y las decisiones que se toman en ellos.
- **La accountability del Increment**: el equipo es dueño del resultado, incluidas las contribuciones de la IA.

Nota el patrón: puedes delegar producir una cosa, pero nunca ser su dueño. El hacer puede pasar a una herramienta; el responder se queda con las personas.
::

::callout type="pro-tip"
Una prueba de una línea para cualquier tarea: "Si esto sale mal, ¿quién responde?". Si una persona debe responder, mantén humano el juicio; delega el hacer si quieres, pero el equipo es dueño de la decisión. Si nada en ello requiere responder, es seguro delegarlo por completo.
::

::interactive widget="drag-match" id="delegate-to-ai-or-keep-human" concept_slugs="delegable-ai-work,retained-accountabilities"
{
  "items": [
    { "id": "a", "text": "Redactar notas de versión a partir del historial de commits" },
    { "id": "b", "text": "Comprometer al equipo con el Sprint Goal" },
    { "id": "c", "text": "Resumir feedback disperso de usuarios en temas" },
    { "id": "d", "text": "Decidir que el Increment cumple la Definition of Done" }
  ],
  "targets": [
    { "id": "delegate", "text": "Seguro de delegar a la IA" },
    { "id": "keep", "text": "Debe seguir siendo humano" }
  ],
  "correct": { "a": "delegate", "b": "keep", "c": "delegate", "d": "keep" },
  "allowReuse": true,
  "explanation": "Redactar y resumir son el hacer: delégalos, con una persona revisando el resultado. Comprometerse con el Sprint Goal y decidir que se cumple la Definition of Done son accountabilities: siguen siendo humanas por capaz que sea la herramienta."
}
::

::concept title="Por qué la línea se sostiene"
Delegar el hacer multiplica la capacidad del equipo: las mismas personas ahora logran más porque la IA se encarga de los primeros intentos. Ese es el beneficio, y es real.

Delegar la accountability hace lo contrario: elimina a la persona que puede responder por un resultado y adaptarse. Si "la IA es dueña del Sprint Goal", entonces cuando el Goal no se cumple, nadie aprende, porque ninguna persona era responsable de él. El ciclo empírico necesita un humano en el punto de cada compromiso y juicio, porque solo un humano inspecciona el resultado y cambia el rumbo la próxima vez. Mantén el hacer delegable y el responder humano, y la IA hace al equipo más rápido sin volverlo hueco.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "¿Cuál de estas es seguro que un Scrum Team delegue a la IA, con revisión humana?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Comprometerse con el Sprint Goal" },
      { "id": "b", "text": "Redactar documentación a partir del código existente" },
      { "id": "c", "text": "Decidir que se cumple la Definition of Done" },
      { "id": "d", "text": "Ser dueño de la accountability del Increment" }
    ],
    "correct": ["b"],
    "explanation": "Redactar es el hacer: delegable con seguridad siempre que una persona revise y sea dueña del resultado. Las otras tres son accountabilities que deben seguir siendo humanas.",
    "concept_slugs": ["delegable-ai-work"],
    "bloom_level": "2_understand",
    "difficulty": 1
  },
  {
    "id": "q2",
    "question": "¿Por qué un equipo nunca puede delegar el compromiso con el Sprint Goal a una IA, sin importar lo capaz que sea?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Porque la IA no puede procesar el Sprint Backlog lo bastante rápido" },
      { "id": "b", "text": "Porque un compromiso es una promesa de la que responde una persona: es una accountability, no una tarea" },
      { "id": "c", "text": "Porque la Guía de Scrum prohíbe la IA en el Sprint Planning" },
      { "id": "d", "text": "Porque el Product Owner debe escribir el Sprint Goal solo" }
    ],
    "correct": ["b"],
    "explanation": "El compromiso es ser responsable de un resultado: una accountability. La capacidad es irrelevante; una herramienta no puede sostener un compromiso porque no puede responder por incumplirlo.",
    "concept_slugs": ["retained-accountabilities"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "¿Cuál es la prueba simple para saber si una tarea se puede delegar a la IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Si la IA es lo bastante rápida para hacerla" },
      { "id": "b", "text": "Si alguien debe responder en caso de que salga mal: si es así, el juicio sigue siendo humano" },
      { "id": "c", "text": "Si la tarea es técnica o no" },
      { "id": "d", "text": "Si el Product Owner la aprueba" }
    ],
    "correct": ["b"],
    "explanation": "Pregunta 'si esto sale mal, ¿quién responde?'. Si una persona debe responder, mantén humano el juicio; aun así puedes delegar el hacer. Si nada requiere responder, es seguro delegarlo por completo.",
    "concept_slugs": ["delegable-ai-work", "retained-accountabilities"],
    "bloom_level": "4_analyze",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "¿Qué le pasa al ciclo empírico de Scrum si un equipo delega la accountability, no solo las tareas, a la IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Se acelera, porque la IA elimina la demora humana" },
      { "id": "b", "text": "Se rompe, porque ninguna persona es responsable de inspeccionar el resultado y adaptarse la próxima vez" },
      { "id": "c", "text": "No se ve afectado, ya que el trabajo igual se hace" },
      { "id": "d", "text": "Mejora, porque la IA es más consistente que las personas" }
    ],
    "correct": ["b"],
    "explanation": "El ciclo empírico necesita un humano en cada compromiso y juicio para inspeccionar el resultado y cambiar el rumbo. Delegar la accountability elimina a esa persona, así que el equipo produce pero ya no aprende.",
    "concept_slugs": ["retained-accountabilities"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  }
]
::

::summary
- La verdadera pregunta no es si la IA *puede* hacer una tarea, sino si el equipo *debería* delegarla.
- Delegable con seguridad: redacción, generación, análisis, resumen —el hacer—, siempre con revisión humana.
- Debe seguir siendo humano: el compromiso con el Sprint Goal, la Definition of Done, la autogestión, la facilitación de eventos y la accountability del Increment.
- La prueba: "si esto sale mal, ¿quién responde?". Si una persona debe responder, mantén humano el juicio.
- Delegar el hacer multiplica la capacidad; delegar el responder elimina al humano del que depende el ciclo empírico.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-05-what-to-delegate-what-to-keep' and l.language = 'es-419');

-- ---- 06-05 pt-BR -------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'pt-BR', '06-05-what-to-delegate-what-to-keep',
  'c0000000-0000-0000-0000-00000000a605'::uuid,
  $jta$O que delegar, o que manter$jta$,
  5, 8,
  $lesson$---
lesson_id: 06-05-what-to-delegate-what-to-keep
module_slug: ai-augmented-teams
certification_code: SMPC
title: "O que delegar, o que manter"
subtitle: A IA pode fazer o trabalho, mas há coisas que um time nunca deve ceder
language: pt-BR
lesson_group_id: c0000000-0000-0000-0000-00000000a605
duration_minutes: 8
order_index: 5
task_codes: [6.5]
concept_slugs:
  - delegable-ai-work
  - retained-accountabilities
prerequisites:
  - 06-04-empiricism-under-acceleration
preview: |
  Uma lição de 8 minutos sobre onde traçar a linha entre o que um Scrum Team
  pode delegar com segurança à IA e as accountabilities que ele deve manter
  humanas, e o teste simples que separa as duas.
authors:
  - Certidemy team
status: published
---

::hook
A pergunta nunca é "a IA consegue fazer isto?". Cada vez mais, a resposta é sim. A pergunta é "o time deveria ceder isto?".
::

::concept title="Duas perguntas que parecem uma"
À medida que a IA fica mais capaz, os times confundem duas perguntas muito diferentes: se a IA *consegue* fazer uma tarefa, e se o time *deveria* delegá-la. A capacidade continua crescendo; isso não resolve o que delegar.

A linha não é sobre dificuldade. É sobre a diferença entre **fazer o trabalho** e **ser responsável por ele**. Um time pode delegar boa parte do fazer. Ele não pode delegar o responder: as accountabilities que, como você viu na primeira lição, devem permanecer humanas. Esta lição torna essa linha concreta para que você a sustente em decisões reais.
::

::concept title="O que um time pode delegar com segurança"
[Muito trabalho pode ser delegado com segurança à IA]{glossary="delegable-ai-work"}, desde que uma pessoa inspecione o resultado. O padrão é o mesmo em todos os casos: a IA faz uma primeira versão, uma pessoa revisa e assume o resultado.

Bons candidatos são o rascunho (código, notas de versão, documentação), a geração (casos de teste, boilerplate, exemplos), a análise (agrupar feedback, detectar padrões em dados) e o resumo (condensar um backlog longo ou uma thread). Em cada um, a IA produz alavancagem e o time mantém o julgamento. Delegar essas coisas libera o time para gastar sua atenção humana limitada onde realmente importa, que é a próxima categoria.
::

::concept title="O que deve permanecer humano"
Algumas coisas não são delegáveis em nenhum nível de capacidade, porque são accountabilities, não tarefas. [Estas devem permanecer humanas]{glossary="retained-accountabilities"}:

- **O compromisso com o Sprint Goal**: um compromisso é uma promessa que uma pessoa faz, não saída que uma ferramenta emite.
- **A Definition of Done**: julgar que o padrão foi cumprido é accountability dos Developers.
- **A autogestão**: o time decide quem faz o quê, como e em que trabalha; uma ferramenta não pode se autogerenciar em nome do time.
- **A facilitação dos eventos de Scrum** e as decisões tomadas neles.
- **A accountability pelo Increment**: o time é dono do resultado, incluindo as contribuições da IA.

Note o padrão: você pode delegar produzir uma coisa, mas nunca ser dono dela. O fazer pode passar para uma ferramenta; o responder fica com as pessoas.
::

::callout type="pro-tip"
Um teste de uma linha para qualquer tarefa: "Se isto der errado, quem responde?". Se uma pessoa deve responder, mantenha o julgamento humano; delegue o fazer se quiser, mas o time é dono da decisão. Se nada nisso exige responder, é seguro delegar por completo.
::

::interactive widget="drag-match" id="delegate-to-ai-or-keep-human" concept_slugs="delegable-ai-work,retained-accountabilities"
{
  "items": [
    { "id": "a", "text": "Rascunhar notas de versão a partir do histórico de commits" },
    { "id": "b", "text": "Comprometer o time com o Sprint Goal" },
    { "id": "c", "text": "Resumir feedback disperso de usuários em temas" },
    { "id": "d", "text": "Decidir que o Increment cumpre a Definition of Done" }
  ],
  "targets": [
    { "id": "delegate", "text": "Seguro delegar à IA" },
    { "id": "keep", "text": "Deve permanecer humano" }
  ],
  "correct": { "a": "delegate", "b": "keep", "c": "delegate", "d": "keep" },
  "allowReuse": true,
  "explanation": "Rascunhar e resumir são o fazer: delegue-os, com uma pessoa revisando o resultado. Comprometer-se com o Sprint Goal e decidir que a Definition of Done foi cumprida são accountabilities: permanecem humanas por mais capaz que a ferramenta seja."
}
::

::concept title="Por que a linha se sustenta"
Delegar o fazer multiplica a capacidade do time: as mesmas pessoas agora realizam mais porque a IA cuida das primeiras versões. Esse é o ganho, e é real.

Delegar a accountability faz o oposto: remove a pessoa que pode responder por um resultado e adaptar. Se "a IA é dona do Sprint Goal", então quando o Goal não é cumprido, ninguém aprende, porque nenhuma pessoa era responsável por ele. O ciclo empírico precisa de um humano no ponto de cada compromisso e julgamento, porque só um humano inspeciona o resultado e muda o rumo na próxima vez. Mantenha o fazer delegável e o responder humano, e a IA torna o time mais rápido sem torná-lo oco.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Qual destas é seguro um Scrum Team delegar à IA, com revisão humana?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Comprometer-se com o Sprint Goal" },
      { "id": "b", "text": "Rascunhar documentação a partir do código existente" },
      { "id": "c", "text": "Decidir que a Definition of Done foi cumprida" },
      { "id": "d", "text": "Ser dono da accountability pelo Increment" }
    ],
    "correct": ["b"],
    "explanation": "Rascunhar é o fazer: delegável com segurança desde que uma pessoa revise e assuma o resultado. As outras três são accountabilities que devem permanecer humanas.",
    "concept_slugs": ["delegable-ai-work"],
    "bloom_level": "2_understand",
    "difficulty": 1
  },
  {
    "id": "q2",
    "question": "Por que um time nunca pode delegar o compromisso com o Sprint Goal a uma IA, não importa quão capaz ela seja?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Porque a IA não consegue processar o Sprint Backlog rápido o suficiente" },
      { "id": "b", "text": "Porque um compromisso é uma promessa pela qual uma pessoa responde: é uma accountability, não uma tarefa" },
      { "id": "c", "text": "Porque o Guia do Scrum proíbe IA no Sprint Planning" },
      { "id": "d", "text": "Porque o Product Owner deve escrever o Sprint Goal sozinho" }
    ],
    "correct": ["b"],
    "explanation": "Compromisso é ser responsável por um resultado: uma accountability. A capacidade é irrelevante; uma ferramenta não pode sustentar um compromisso porque não pode responder por descumpri-lo.",
    "concept_slugs": ["retained-accountabilities"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "Qual é o teste simples para saber se uma tarefa pode ser delegada à IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Se a IA é rápida o suficiente para fazê-la" },
      { "id": "b", "text": "Se alguém precisa responder caso dê errado: se sim, o julgamento permanece humano" },
      { "id": "c", "text": "Se a tarefa é técnica ou não" },
      { "id": "d", "text": "Se o Product Owner a aprova" }
    ],
    "correct": ["b"],
    "explanation": "Pergunte 'se isto der errado, quem responde?'. Se uma pessoa deve responder, mantenha o julgamento humano; ainda assim você pode delegar o fazer. Se nada exige responder, é seguro delegar por completo.",
    "concept_slugs": ["delegable-ai-work", "retained-accountabilities"],
    "bloom_level": "4_analyze",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "O que acontece com o ciclo empírico do Scrum se um time delega a accountability, não só as tarefas, à IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Ele acelera, porque a IA remove o atraso humano" },
      { "id": "b", "text": "Ele se quebra, porque nenhuma pessoa é responsável por inspecionar o resultado e adaptar na próxima vez" },
      { "id": "c", "text": "Não é afetado, já que o trabalho ainda é feito" },
      { "id": "d", "text": "Melhora, porque a IA é mais consistente que as pessoas" }
    ],
    "correct": ["b"],
    "explanation": "O ciclo empírico precisa de um humano em cada compromisso e julgamento para inspecionar o resultado e mudar o rumo. Delegar a accountability remove essa pessoa, então o time produz mas não aprende mais.",
    "concept_slugs": ["retained-accountabilities"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  }
]
::

::summary
- A verdadeira pergunta não é se a IA *consegue* fazer uma tarefa, mas se o time *deveria* delegá-la.
- Delegável com segurança: rascunho, geração, análise, resumo —o fazer—, sempre com revisão humana.
- Deve permanecer humano: o compromisso com o Sprint Goal, a Definition of Done, a autogestão, a facilitação de eventos e a accountability pelo Increment.
- O teste: "se isto der errado, quem responde?". Se uma pessoa deve responder, mantenha o julgamento humano.
- Delegar o fazer multiplica a capacidade; delegar o responder remove o humano do qual o ciclo empírico depende.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-05-what-to-delegate-what-to-keep' and l.language = 'pt-BR');

-- ---- VERIFICATION (expect 3 rows) --------------------------------------------
-- select language, slug, title from public.lessons
--  where slug = '06-05-what-to-delegate-what-to-keep' order by language;
