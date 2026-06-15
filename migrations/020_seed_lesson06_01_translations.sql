-- 020_seed_lesson06_01_translations.sql
-- =============================================================================
-- Lesson 06-01 in es-419 and pt-BR. Same lesson_group_id and slug as the
-- English row (language column differentiates), attached to Module 6.
-- Scrum terms kept in English per the localization rule; "accountability" is
-- treated as a Scrum-2020 term and kept in English. Translations are DB-only
-- (no .md source files for es/pt, matching existing lessons).
--
-- Content dollar-quoted with $lesson$; short fields with $jta$. Idempotent via
-- not-exists on (slug, language). module_id resolved by subquery.
-- =============================================================================

-- ---- 06-01 es-419 ------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'es-419', '06-01-ai-agents-as-tools',
  'c0000000-0000-0000-0000-00000000a601'::uuid,
  $jta$Agentes de IA en un Scrum Team: herramientas, no integrantes$jta$,
  1, 8,
  $lesson$---
lesson_id: 06-01-ai-agents-as-tools
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Agentes de IA en un Scrum Team: herramientas, no integrantes"
subtitle: Por qué las accountabilities siguen siendo humanas aunque la IA haga el trabajo
language: es-419
lesson_group_id: c0000000-0000-0000-0000-00000000a601
duration_minutes: 8
order_index: 1
task_codes: [6.1]
concept_slugs:
  - ai-as-tool-not-team-member
  - human-held-accountabilities
prerequisites: []
preview: |
  Una lección de 8 minutos sobre cómo encajan los agentes de IA en un
  Scrum Team —como herramientas que el equipo usa, nunca como integrantes—
  y qué accountabilities deben seguir siendo humanas sin importar cuánto
  trabajo haga la IA.
authors:
  - Certidemy team
status: published
---

::hook
Un agente de IA escribe código toda la noche y abre doce pull requests para la mañana. ¿Útil? Por supuesto. ¿Un Developer de tu Scrum Team? No.
::

::concept title="El Scrum Team sigue siendo personas"
La Guía de Scrum 2020 define el Scrum Team como un Product Owner, un Scrum Master y Developers: un único equipo de personas responsable de crear un Increment valioso en cada Sprint. Nada de esa definición cambia porque un equipo use IA.

Un agente de IA puede redactar código, resumir un Product Backlog o generar casos de prueba. Eso lo convierte en una **herramienta** poderosa. No lo convierte en integrante del Scrum Team. No existe una "accountability de IA", ni un lugar para la IA en el Sprint Planning, ni un compromiso de la IA con el Sprint Goal.

Piensa en la IA como piensas en un IDE, un pipeline de CI o un servidor de build: esencial para cómo trabajan los Developers modernos, dirigida por el equipo, pero nunca un integrante. Las personas son el equipo. Las herramientas las sirven.
::

::callout type="pitfall"
"La IA ya es básicamente otro integrante del equipo." Suena inofensivo, pero le entrega silenciosamente a una herramienta algo que solo una persona puede sostener: la accountability. Las herramientas tienen capacidades. Las personas tienen accountabilities. Mantén ambas separadas.
::

::concept title="Las accountabilities las sostienen personas"
La [accountability]{glossary="human-held-accountabilities"} significa ser responsable de responder por un resultado. En Scrum, tres accountabilities siempre las sostienen personas:

- El **Product Owner** es responsable de maximizar el valor del producto y del Product Backlog.
- El **Scrum Master** es responsable de la efectividad del equipo y de que Scrum se entienda y se aplique.
- Los **Developers** son responsables de un Increment utilizable en cada Sprint, del Sprint Backlog y de la Definition of Done.

Un agente de IA puede *ayudar* con cualquiera de estas: sugerir un orden del Backlog, redactar el Increment, señalar una brecha de calidad. Pero "ayudar" no es "sostener". Cuando el Increment sale defectuoso, no puedes pedirle cuentas a un modelo; se las pides a los Developers. La accountability tiene que recaer en una persona, porque solo una persona puede responder por una decisión y cambiar lo que hace después.
::

::interactive widget="drag-match" id="tool-capability-vs-human-accountability" concept_slugs="ai-as-tool-not-team-member,human-held-accountabilities"
{
  "items": [
    { "id": "a", "text": "Generar un primer borrador del código del Increment" },
    { "id": "b", "text": "Decidir que el Increment cumple la Definition of Done" },
    { "id": "c", "text": "Resumir cincuenta items del Product Backlog en temas" },
    { "id": "d", "text": "Ordenar el Product Backlog para maximizar el valor" },
    { "id": "e", "text": "Proponer casos de prueba para una nueva funcionalidad" }
  ],
  "targets": [
    { "id": "tool", "text": "Una herramienta puede hacerlo (IA)" },
    { "id": "human", "text": "Una persona debe sostenerlo (accountability)" }
  ],
  "correct": { "a": "tool", "b": "human", "c": "tool", "d": "human", "e": "tool" },
  "allowReuse": true,
  "explanation": "Redactar, resumir y proponer son capacidades de herramienta: la IA puede hacerlas, sujetas a revisión humana. Decidir el Done y ordenar el Backlog por valor son accountabilities: los Developers y el Product Owner siguen respondiendo por ellas, aunque la IA informe el trabajo."
}
::

::concept title="Por qué la línea importa en la práctica"
Esto no es un punto filosófico: cambia lo que haces como Scrum Master.

Cuando un interesado dice "la IA lo aprobó, así que está terminado", tienes un problema: se trató la salida de una herramienta como una decisión. La Definition of Done se cumple cuando los **Developers** juzgan que se cumple, no cuando un modelo emite una marca verde. Cuando alguien pregunta "de quién es la culpa de la caída", la respuesta nunca es "de la IA": el equipo es dueño de su Increment, incluidas las partes que produjo la IA.

Sostener esta línea mantiene intacto el empirismo de Scrum. Las decisiones quedan en personas que pueden inspeccionar, aprender y adaptarse. En el momento en que la accountability se desplaza a una herramienta, nadie responde, y el equipo pierde su capacidad de autocorregirse.
::

::callout type="pro-tip"
Una prueba simple cuando la IA entra en una conversación sobre el equipo: pregunta "¿quién responde si esto está mal?". Si la respuesta honesta es una persona, estás usando la IA como herramienta. Si la respuesta es "la IA", alguien entregó silenciosamente una accountability: recupérala.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Un equipo usa un agente de IA para generar la mayor parte de su código. En términos de Scrum, ¿qué es el agente de IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Un nuevo Developer del Scrum Team" },
      { "id": "b", "text": "Una herramienta que los Developers usan; los Developers siguen siendo el equipo" },
      { "id": "c", "text": "Una cuarta accountability de Scrum" },
      { "id": "d", "text": "Un reemplazo del Scrum Master" }
    ],
    "correct": ["b"],
    "explanation": "La IA es una herramienta que el equipo usa. El Scrum Team sigue definiéndose como personas; usar una herramienta —por capaz que sea— no agrega un integrante ni una accountability.",
    "concept_slugs": ["ai-as-tool-not-team-member"],
    "bloom_level": "2_understand",
    "difficulty": 1
  },
  {
    "id": "q2",
    "question": "Un agente de IA informa que un Increment pasa todas las verificaciones automatizadas. ¿Quién es responsable de decidir que el Increment realmente cumple la Definition of Done?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "El agente de IA, ya que ejecutó las verificaciones" },
      { "id": "b", "text": "El Scrum Master" },
      { "id": "c", "text": "Los Developers" },
      { "id": "d", "text": "El interesado que solicitó la funcionalidad" }
    ],
    "correct": ["c"],
    "explanation": "Los Developers son responsables de la Definition of Done. La IA puede informar el juicio, pero la accountability de decidir el Done la sostienen personas.",
    "concept_slugs": ["human-held-accountabilities"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "¿Por qué Scrum exige que las accountabilities las sostengan personas y no herramientas?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Porque las herramientas no son lo bastante rápidas para seguir el ritmo de un Sprint" },
      { "id": "b", "text": "Porque solo una persona puede responder por una decisión y adaptar su comportamiento futuro" },
      { "id": "c", "text": "Porque la Guía de Scrum prohíbe usar cualquier herramienta" },
      { "id": "d", "text": "Porque los interesados prefieren hablar con personas" }
    ],
    "correct": ["b"],
    "explanation": "La accountability significa responder por algo. Solo una persona puede responder por una decisión, aprender del resultado y cambiar lo que hace, que es lo que mantiene funcionando el empirismo del equipo.",
    "concept_slugs": ["human-held-accountabilities", "ai-as-tool-not-team-member"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "Un interesado dice: 'La IA aprobó el release, así que el equipo no es responsable del bug que salió'. ¿Cuál es la respuesta de Scrum más precisa?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Correcto: la IA tomó la decisión, así que la accountability recae en la herramienta" },
      { "id": "b", "text": "Los Developers son responsables del Increment, incluido el trabajo que produjo la IA; una herramienta no puede sostener esa accountability" },
      { "id": "c", "text": "El Scrum Master es personalmente responsable del bug" },
      { "id": "d", "text": "La accountability se comparte por igual entre el equipo y la IA" }
    ],
    "correct": ["b"],
    "explanation": "La salida de una herramienta nunca sustituye la accountability de los Developers por el Increment. La IA puede ayudar, pero el equipo es dueño del resultado, incluidas las partes que generó la IA.",
    "concept_slugs": ["human-held-accountabilities"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::

::summary
- El Scrum Team sigue definiéndose como personas: un Product Owner, un Scrum Master y Developers.
- Los agentes de IA son herramientas que el equipo usa —como un IDE o un pipeline de CI—, nunca integrantes ni una cuarta accountability.
- Las tres accountabilities siempre las sostienen personas; la IA puede ayudar pero no sostenerlas.
- La accountability debe ser humana porque solo una persona puede responder por una decisión y adaptarse, que es lo que mantiene vivo el empirismo de Scrum.
- Cuando la IA entra en escena, pregunta "¿quién responde si esto está mal?". La respuesta debe ser una persona.
::
$lesson$
from (
  select id from public.modules
  where certification_id = '11111111-1111-1111-1111-111111111111'
    and slug = 'ai-augmented-teams'
) m
where not exists (
  select 1 from public.lessons l
  where l.slug = '06-01-ai-agents-as-tools' and l.language = 'es-419'
);

-- ---- 06-01 pt-BR -------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'pt-BR', '06-01-ai-agents-as-tools',
  'c0000000-0000-0000-0000-00000000a601'::uuid,
  $jta$Agentes de IA em um Scrum Team: ferramentas, não integrantes$jta$,
  1, 8,
  $lesson$---
lesson_id: 06-01-ai-agents-as-tools
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Agentes de IA em um Scrum Team: ferramentas, não integrantes"
subtitle: Por que as accountabilities continuam humanas mesmo quando a IA faz o trabalho
language: pt-BR
lesson_group_id: c0000000-0000-0000-0000-00000000a601
duration_minutes: 8
order_index: 1
task_codes: [6.1]
concept_slugs:
  - ai-as-tool-not-team-member
  - human-held-accountabilities
prerequisites: []
preview: |
  Uma lição de 8 minutos sobre como os agentes de IA se encaixam em um
  Scrum Team —como ferramentas que o time usa, nunca como integrantes—
  e quais accountabilities devem permanecer humanas, não importa quanto
  trabalho a IA faça.
authors:
  - Certidemy team
status: published
---

::hook
Um agente de IA escreve código a noite toda e abre doze pull requests pela manhã. Útil? Com certeza. Um Developer do seu Scrum Team? Não.
::

::concept title="O Scrum Team continua sendo pessoas"
O Guia do Scrum 2020 define o Scrum Team como um Product Owner, um Scrum Master e Developers: um único time de pessoas responsável por criar um Increment valioso a cada Sprint. Nada dessa definição muda porque um time usa IA.

Um agente de IA pode rascunhar código, resumir um Product Backlog ou gerar casos de teste. Isso o torna uma **ferramenta** poderosa. Não o torna integrante do Scrum Team. Não existe uma "accountability de IA", nem um lugar para a IA no Sprint Planning, nem um compromisso da IA com o Sprint Goal.

Pense na IA como você pensa em um IDE, um pipeline de CI ou um servidor de build: essencial para como os Developers modernos trabalham, dirigida pelo time, mas nunca um integrante. As pessoas são o time. As ferramentas as servem.
::

::callout type="pitfall"
"A IA já é praticamente outro integrante do time." Parece inofensivo, mas entrega silenciosamente a uma ferramenta algo que só uma pessoa pode sustentar: a accountability. Ferramentas têm capacidades. Pessoas têm accountabilities. Mantenha as duas separadas.
::

::concept title="As accountabilities são sustentadas por pessoas"
A [accountability]{glossary="human-held-accountabilities"} significa responder por um resultado. No Scrum, três accountabilities são sempre sustentadas por pessoas:

- O **Product Owner** é responsável por maximizar o valor do produto e pelo Product Backlog.
- O **Scrum Master** é responsável pela eficácia do time e por garantir que o Scrum seja entendido e aplicado.
- Os **Developers** são responsáveis por um Increment utilizável a cada Sprint, pelo Sprint Backlog e pela Definition of Done.

Um agente de IA pode *ajudar* com qualquer uma delas: sugerir uma ordem do Backlog, rascunhar o Increment, apontar uma lacuna de qualidade. Mas "ajudar" não é "sustentar". Quando o Increment sai com defeito, você não pode responsabilizar um modelo; você responsabiliza os Developers. A accountability precisa recair sobre uma pessoa, porque só uma pessoa pode responder por uma decisão e mudar o que faz em seguida.
::

::interactive widget="drag-match" id="tool-capability-vs-human-accountability" concept_slugs="ai-as-tool-not-team-member,human-held-accountabilities"
{
  "items": [
    { "id": "a", "text": "Gerar um primeiro rascunho do código do Increment" },
    { "id": "b", "text": "Decidir que o Increment cumpre a Definition of Done" },
    { "id": "c", "text": "Resumir cinquenta itens do Product Backlog em temas" },
    { "id": "d", "text": "Ordenar o Product Backlog para maximizar o valor" },
    { "id": "e", "text": "Propor casos de teste para uma nova funcionalidade" }
  ],
  "targets": [
    { "id": "tool", "text": "Uma ferramenta pode fazer isso (IA)" },
    { "id": "human", "text": "Uma pessoa deve sustentar isso (accountability)" }
  ],
  "correct": { "a": "tool", "b": "human", "c": "tool", "d": "human", "e": "tool" },
  "allowReuse": true,
  "explanation": "Rascunhar, resumir e propor são capacidades de ferramenta: a IA pode fazê-las, sujeitas a revisão humana. Decidir o Done e ordenar o Backlog por valor são accountabilities: os Developers e o Product Owner continuam respondendo por elas, mesmo quando a IA informa o trabalho."
}
::

::concept title="Por que a linha importa na prática"
Isto não é um ponto filosófico: muda o que você faz como Scrum Master.

Quando um stakeholder diz "a IA aprovou, então está pronto", você tem um problema: a saída de uma ferramenta foi tratada como uma decisão. A Definition of Done é cumprida quando os **Developers** julgam que foi cumprida, não quando um modelo emite um sinal verde. Quando alguém pergunta "de quem é a culpa pela queda", a resposta nunca é "da IA": o time é dono do seu Increment, incluindo as partes que a IA produziu.

Sustentar essa linha mantém intacto o empirismo do Scrum. As decisões ficam com pessoas que podem inspecionar, aprender e adaptar. No momento em que a accountability se desloca para uma ferramenta, ninguém responde, e o time perde a capacidade de se autocorrigir.
::

::callout type="pro-tip"
Um teste simples quando a IA entra em uma conversa sobre o time: pergunte "quem responde se isto estiver errado?". Se a resposta honesta for uma pessoa, você está usando a IA como ferramenta. Se a resposta for "a IA", alguém entregou silenciosamente uma accountability: recupere-a.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Um time usa um agente de IA para gerar a maior parte do seu código. Em termos de Scrum, o que é o agente de IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Um novo Developer do Scrum Team" },
      { "id": "b", "text": "Uma ferramenta que os Developers usam; os Developers continuam sendo o time" },
      { "id": "c", "text": "Uma quarta accountability do Scrum" },
      { "id": "d", "text": "Um substituto do Scrum Master" }
    ],
    "correct": ["b"],
    "explanation": "A IA é uma ferramenta que o time usa. O Scrum Team continua sendo definido como pessoas; usar uma ferramenta —por mais capaz que seja— não adiciona um integrante nem uma accountability.",
    "concept_slugs": ["ai-as-tool-not-team-member"],
    "bloom_level": "2_understand",
    "difficulty": 1
  },
  {
    "id": "q2",
    "question": "Um agente de IA informa que um Increment passa em todas as verificações automatizadas. Quem é responsável por decidir que o Increment realmente cumpre a Definition of Done?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "O agente de IA, já que executou as verificações" },
      { "id": "b", "text": "O Scrum Master" },
      { "id": "c", "text": "Os Developers" },
      { "id": "d", "text": "O stakeholder que solicitou a funcionalidade" }
    ],
    "correct": ["c"],
    "explanation": "Os Developers são responsáveis pela Definition of Done. A IA pode informar o julgamento, mas a accountability de decidir o Done é sustentada por pessoas.",
    "concept_slugs": ["human-held-accountabilities"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Por que o Scrum exige que as accountabilities sejam sustentadas por pessoas e não por ferramentas?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Porque as ferramentas não são rápidas o suficiente para acompanhar um Sprint" },
      { "id": "b", "text": "Porque só uma pessoa pode responder por uma decisão e adaptar seu comportamento futuro" },
      { "id": "c", "text": "Porque o Guia do Scrum proíbe usar qualquer ferramenta" },
      { "id": "d", "text": "Porque os stakeholders preferem falar com pessoas" }
    ],
    "correct": ["b"],
    "explanation": "A accountability significa responder por algo. Só uma pessoa pode responder por uma decisão, aprender com o resultado e mudar o que faz, que é o que mantém o empirismo do time funcionando.",
    "concept_slugs": ["human-held-accountabilities", "ai-as-tool-not-team-member"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "Um stakeholder diz: 'A IA aprovou o release, então o time não é responsável pelo bug que foi para produção'. Qual é a resposta de Scrum mais precisa?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Correto: a IA tomou a decisão, então a accountability recai sobre a ferramenta" },
      { "id": "b", "text": "Os Developers são responsáveis pelo Increment, incluindo o trabalho que a IA produziu; uma ferramenta não pode sustentar essa accountability" },
      { "id": "c", "text": "O Scrum Master é pessoalmente responsável pelo bug" },
      { "id": "d", "text": "A accountability é compartilhada igualmente entre o time e a IA" }
    ],
    "correct": ["b"],
    "explanation": "A saída de uma ferramenta nunca substitui a accountability dos Developers pelo Increment. A IA pode ajudar, mas o time é dono do resultado, incluindo as partes que a IA gerou.",
    "concept_slugs": ["human-held-accountabilities"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::

::summary
- O Scrum Team continua sendo definido como pessoas: um Product Owner, um Scrum Master e Developers.
- Os agentes de IA são ferramentas que o time usa —como um IDE ou um pipeline de CI—, nunca integrantes nem uma quarta accountability.
- As três accountabilities são sempre sustentadas por pessoas; a IA pode ajudar, mas não sustentá-las.
- A accountability deve ser humana porque só uma pessoa pode responder por uma decisão e se adaptar, o que mantém vivo o empirismo do Scrum.
- Quando a IA entra em cena, pergunte "quem responde se isto estiver errado?". A resposta deve ser uma pessoa.
::
$lesson$
from (
  select id from public.modules
  where certification_id = '11111111-1111-1111-1111-111111111111'
    and slug = 'ai-augmented-teams'
) m
where not exists (
  select 1 from public.lessons l
  where l.slug = '06-01-ai-agents-as-tools' and l.language = 'pt-BR'
);

-- ---- VERIFICATION (run separately; expect 3 rows: en, es-419, pt-BR) ---------
-- select language, slug, title from public.lessons
--  where slug = '06-01-ai-agents-as-tools' order by language;
