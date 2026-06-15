-- 021_seed_lesson06_02.sql
-- =============================================================================
-- Lesson 06-02 "Done Means Done: The Definition of Done and AI Work"
-- (task 6.2; concepts dod-applies-to-ai-output, increment-transparency-ai)
-- in en + es-419 + pt-BR. Attached to Module 6, order_index 2.
-- Scrum terms (incl. Definition of Done, Done, Increment) kept English.
-- Dollar-quoted ($lesson$ body, $jta$ title); idempotent on (slug, language).
-- =============================================================================

-- ---- 06-02 en ----------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'en', '06-02-definition-of-done-and-ai',
  'c0000000-0000-0000-0000-00000000a602'::uuid,
  $jta$Done Means Done: The Definition of Done and AI Work$jta$,
  2, 8,
  $lesson$---
lesson_id: 06-02-definition-of-done-and-ai
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Done Means Done: The Definition of Done and AI Work"
subtitle: AI can draft the Increment, but it cannot declare it Done
language: en
lesson_group_id: c0000000-0000-0000-0000-00000000a602
duration_minutes: 8
order_index: 2
task_codes: [6.2]
concept_slugs:
  - dod-applies-to-ai-output
  - increment-transparency-ai
prerequisites:
  - 06-01-ai-agents-as-tools
preview: |
  An 8-minute lesson on applying the Definition of Done and artifact
  transparency to AI-generated work — why AI output is a draft, not a
  Done Increment, and how transparency survives when a model writes the code.
authors:
  - Certidemy team
status: published
---

::hook
The AI generated a feature, the tests are green, and the demo looks perfect. Is it Done? Not until the Developers say so.
::

::concept title="The Definition of Done Does Not Care Who Wrote It"
The Definition of Done is the shared standard for when work on the Increment is complete — a checklist of quality the whole Scrum Team commits to. The 2020 Scrum Guide is clear: the moment a Product Backlog item meets the Definition of Done, an Increment is born.

Nothing in that standard changes because AI produced the work. [The Definition of Done applies equally to AI-assisted output]{glossary="dod-applies-to-ai-output"}. AI-written code still has to meet the same bar: tested, reviewed, secure, documented — whatever the team's Definition of Done requires. "An AI wrote it" is not a shortcut around any of those criteria.

The danger is speed. AI can produce a Sprint's worth of output in an afternoon, and the temptation is to wave it through because there is so much of it. Resist that. Volume is not Done. The standard holds regardless of how fast the draft arrived.
::

::callout type="exam-watch"
A common trap: treating "passes automated checks" as the same thing as "meets the Definition of Done." Automated checks are *part* of the Definition of Done, not a replacement for it. The Developers still judge whether the full standard is met.
::

::concept title="AI Output Is a Draft, Not a Done Increment"
Treat anything an AI produces the way you would treat a junior Developer's first pass: useful, often good, never automatically shippable. It is a **draft** that enters the team's normal path to Done — review, testing, integration, judgment.

This matters because the Developers remain accountable for the Increment (you met this in the last lesson). If AI output goes straight into the Increment without meeting the Definition of Done, the team has not saved time — it has hidden risk. The work *looks* finished while skipping the standard that makes "finished" mean something.

The Scrum Master's job here is to protect the Definition of Done as a real gate, not a formality the team rushes past because the AI "already handled it."
::

::interactive widget="highlight-mistake" id="ai-output-treated-as-done" concept_slugs="dod-applies-to-ai-output"
{
  "scenario_title": "What's wrong with how this team handles AI output?",
  "text": "The AI agent generated the new payments module overnight. In the morning, a Developer said: 'It compiles and the unit tests pass, so I merged it straight to main and marked the item Done. The AI even wrote the tests, so we're covered. We can skip code review this time since there's so much to get through.'",
  "highlights": [
    {
      "id": "merged-done",
      "span": "I merged it straight to main and marked the item Done",
      "is_correct": true,
      "feedback": "Compiling and passing tests is not the same as meeting the Definition of Done. The item should not be marked Done until the team's full standard is met."
    },
    {
      "id": "ai-wrote-tests",
      "span": "The AI even wrote the tests, so we're covered",
      "is_correct": true,
      "feedback": "AI-written tests are also a draft. Tests the AI wrote to check AI-written code can share the same blind spots; they still need human review."
    },
    {
      "id": "skip-review",
      "span": "We can skip code review this time since there's so much to get through",
      "is_correct": true,
      "feedback": "Volume is exactly when review matters most. Skipping it because there is a lot of AI output inverts the Definition of Done."
    }
  ],
  "minimum_correct": 2
}
::

::concept title="Transparency When a Model Writes the Code"
Scrum runs on transparency: the Increment, and the work behind it, must be visible and honest so the team can inspect it. [AI changes what transparency requires]{glossary="increment-transparency-ai"}.

When a person writes code, a reviewer can ask them what they intended. When a model writes it, that conversation does not exist — so the team has to make the AI's contribution inspectable in other ways: keeping the prompts or context that produced it, reviewing the output as carefully as any external contribution, and being honest in the Increment about what was machine-generated and verified versus what was not.

Opaque AI output is a transparency failure. If no one can say how a part of the Increment came to be or whether anyone truly checked it, the team has lost the visibility that inspection depends on — and inspection is what keeps Scrum empirical.
::

::callout type="pro-tip"
Add one line to your team's working agreement: AI-generated work is reviewed to the same standard as human work before it counts toward the Increment. It turns "the AI did it" from an excuse into a normal, inspectable step.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "An AI agent produces code that compiles and passes all existing automated tests. Does it meet the Definition of Done?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Yes — passing automated tests is the Definition of Done" },
      { "id": "b", "text": "Not necessarily; the Developers still judge it against the full Definition of Done" },
      { "id": "c", "text": "Yes, as long as the AI also wrote the tests" },
      { "id": "d", "text": "No — AI output can never meet the Definition of Done" }
    ],
    "correct": ["b"],
    "explanation": "Automated checks are part of the Definition of Done, not the whole of it. AI output meets Done only when the Developers judge the full standard satisfied — the same as any other work.",
    "concept_slugs": ["dod-applies-to-ai-output"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "Why is it risky to merge AI-generated work into the Increment without the team's normal review?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "AI output is always lower quality than human output" },
      { "id": "b", "text": "It makes work look finished while skipping the standard that makes 'finished' meaningful, hiding risk in the Increment" },
      { "id": "c", "text": "The Scrum Guide forbids AI-generated code in the Increment" },
      { "id": "d", "text": "It violates the Sprint timebox" }
    ],
    "correct": ["b"],
    "explanation": "Skipping review doesn't save time; it hides risk. The Definition of Done is what makes 'Done' trustworthy, and bypassing it for AI work removes that guarantee.",
    "concept_slugs": ["dod-applies-to-ai-output"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "What does artifact transparency require when much of the Increment is AI-generated?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Hiding which parts were AI-generated to avoid bias in review" },
      { "id": "b", "text": "That the team can see and verify how the work was produced — keeping it inspectable and honest about what was machine-generated" },
      { "id": "c", "text": "Trusting the model's output since it is consistent" },
      { "id": "d", "text": "Replacing code review with the AI's own confidence score" }
    ],
    "correct": ["b"],
    "explanation": "Transparency means the work behind the Increment is visible and honest so the team can inspect it. Opaque, unverified AI output breaks that — the team must keep AI contributions inspectable.",
    "concept_slugs": ["increment-transparency-ai"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "A Developer wants to skip code review on a large batch of AI-generated work 'because there's so much to get through.' What is the best Scrum Master response?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Agree — the volume justifies trusting the AI this time" },
      { "id": "b", "text": "Point out that high volume is exactly when review matters most, and the Definition of Done applies regardless of who or what produced the work" },
      { "id": "c", "text": "Tell the Developer to merge it and review later if there's time" },
      { "id": "d", "text": "Take over and review it all yourself as Scrum Master" }
    ],
    "correct": ["b"],
    "explanation": "Volume is not a reason to lower the bar — it's a reason to hold it. The Definition of Done applies to AI work the same as human work; the Scrum Master protects that gate.",
    "concept_slugs": ["dod-applies-to-ai-output", "increment-transparency-ai"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::

::summary
- The Definition of Done applies equally to AI-generated work — "an AI wrote it" is not a shortcut around any quality criterion.
- AI output is a draft that enters the team's normal path to Done, never an automatically Done Increment.
- Passing automated checks is part of the Definition of Done, not a replacement for the Developers' judgment.
- Transparency requires AI contributions to stay inspectable and honest about what was machine-generated and verified.
- High volume is when review matters most; the Scrum Master protects the Definition of Done as a real gate.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-02-definition-of-done-and-ai' and l.language = 'en');

-- ---- 06-02 es-419 ------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'es-419', '06-02-definition-of-done-and-ai',
  'c0000000-0000-0000-0000-00000000a602'::uuid,
  $jta$Terminado es terminado: la Definition of Done y el trabajo con IA$jta$,
  2, 8,
  $lesson$---
lesson_id: 06-02-definition-of-done-and-ai
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Terminado es terminado: la Definition of Done y el trabajo con IA"
subtitle: La IA puede redactar el Increment, pero no puede declararlo Done
language: es-419
lesson_group_id: c0000000-0000-0000-0000-00000000a602
duration_minutes: 8
order_index: 2
task_codes: [6.2]
concept_slugs:
  - dod-applies-to-ai-output
  - increment-transparency-ai
prerequisites:
  - 06-01-ai-agents-as-tools
preview: |
  Una lección de 8 minutos sobre cómo aplicar la Definition of Done y la
  transparencia de los artefactos al trabajo generado por IA: por qué la
  salida de IA es un borrador, no un Increment Done, y cómo sobrevive la
  transparencia cuando un modelo escribe el código.
authors:
  - Certidemy team
status: published
---

::hook
La IA generó una funcionalidad, las pruebas están en verde y la demo se ve perfecta. ¿Está Done? No hasta que los Developers lo digan.
::

::concept title="A la Definition of Done no le importa quién la escribió"
La Definition of Done es el estándar compartido de cuándo el trabajo sobre el Increment está completo: una lista de calidad con la que se compromete todo el Scrum Team. La Guía de Scrum 2020 es clara: en el momento en que un item del Product Backlog cumple la Definition of Done, nace un Increment.

Nada de ese estándar cambia porque la IA haya producido el trabajo. [La Definition of Done se aplica por igual a la salida asistida por IA]{glossary="dod-applies-to-ai-output"}. El código escrito por IA todavía tiene que cumplir el mismo nivel: probado, revisado, seguro, documentado, lo que sea que requiera la Definition of Done del equipo. "Lo escribió una IA" no es un atajo para saltarse ninguno de esos criterios.

El peligro es la velocidad. La IA puede producir el trabajo de un Sprint en una tarde, y la tentación es dejarlo pasar porque hay mucho. Resístela. El volumen no es Done. El estándar se mantiene sin importar qué tan rápido llegó el borrador.
::

::callout type="exam-watch"
Una trampa común: tratar "pasa las verificaciones automatizadas" como lo mismo que "cumple la Definition of Done". Las verificaciones automatizadas son *parte* de la Definition of Done, no un reemplazo. Los Developers siguen juzgando si se cumple el estándar completo.
::

::concept title="La salida de IA es un borrador, no un Increment Done"
Trata todo lo que produce una IA como tratarías el primer intento de un Developer junior: útil, a menudo bueno, nunca automáticamente entregable. Es un **borrador** que entra en el camino normal del equipo hacia Done: revisión, pruebas, integración, juicio.

Esto importa porque los Developers siguen siendo responsables del Increment (lo viste en la lección anterior). Si la salida de IA va directo al Increment sin cumplir la Definition of Done, el equipo no ahorró tiempo: ocultó riesgo. El trabajo *parece* terminado mientras se salta el estándar que hace que "terminado" signifique algo.

El trabajo del Scrum Master aquí es proteger la Definition of Done como una compuerta real, no una formalidad que el equipo apura porque la IA "ya se encargó".
::

::interactive widget="highlight-mistake" id="ai-output-treated-as-done" concept_slugs="dod-applies-to-ai-output"
{
  "scenario_title": "¿Qué está mal en cómo este equipo maneja la salida de IA?",
  "text": "El agente de IA generó el nuevo módulo de pagos durante la noche. En la mañana, un Developer dijo: 'Compila y las pruebas unitarias pasan, así que lo fusioné directo a main y marqué el item como Done. La IA hasta escribió las pruebas, así que estamos cubiertos. Podemos saltarnos la revisión de código esta vez porque hay mucho por avanzar.'",
  "highlights": [
    {
      "id": "merged-done",
      "span": "lo fusioné directo a main y marqué el item como Done",
      "is_correct": true,
      "feedback": "Compilar y pasar pruebas no es lo mismo que cumplir la Definition of Done. El item no debería marcarse como Done hasta que se cumpla el estándar completo del equipo."
    },
    {
      "id": "ai-wrote-tests",
      "span": "La IA hasta escribió las pruebas, así que estamos cubiertos",
      "is_correct": true,
      "feedback": "Las pruebas escritas por IA también son un borrador. Las pruebas que la IA escribió para verificar código escrito por IA pueden compartir los mismos puntos ciegos; todavía necesitan revisión humana."
    },
    {
      "id": "skip-review",
      "span": "Podemos saltarnos la revisión de código esta vez porque hay mucho por avanzar",
      "is_correct": true,
      "feedback": "El volumen es justo cuando la revisión más importa. Saltársela porque hay mucha salida de IA invierte la Definition of Done."
    }
  ],
  "minimum_correct": 2
}
::

::concept title="Transparencia cuando un modelo escribe el código"
Scrum funciona con transparencia: el Increment, y el trabajo detrás de él, deben ser visibles y honestos para que el equipo pueda inspeccionarlo. [La IA cambia lo que exige la transparencia]{glossary="increment-transparency-ai"}.

Cuando una persona escribe código, un revisor puede preguntarle qué pretendía. Cuando un modelo lo escribe, esa conversación no existe, así que el equipo tiene que hacer inspeccionable la contribución de la IA de otras maneras: conservar los prompts o el contexto que la produjeron, revisar la salida con el mismo cuidado que cualquier contribución externa, y ser honesto en el Increment sobre qué fue generado por máquina y verificado y qué no.

La salida de IA opaca es una falla de transparencia. Si nadie puede decir cómo llegó a existir una parte del Increment o si alguien realmente la revisó, el equipo perdió la visibilidad de la que depende la inspección, y la inspección es lo que mantiene empírico a Scrum.
::

::callout type="pro-tip"
Agrega una línea al acuerdo de trabajo de tu equipo: el trabajo generado por IA se revisa con el mismo estándar que el trabajo humano antes de contar para el Increment. Convierte "lo hizo la IA" de una excusa en un paso normal e inspeccionable.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Un agente de IA produce código que compila y pasa todas las pruebas automatizadas existentes. ¿Cumple la Definition of Done?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Sí: pasar las pruebas automatizadas es la Definition of Done" },
      { "id": "b", "text": "No necesariamente; los Developers todavía lo juzgan contra la Definition of Done completa" },
      { "id": "c", "text": "Sí, siempre que la IA también haya escrito las pruebas" },
      { "id": "d", "text": "No: la salida de IA nunca puede cumplir la Definition of Done" }
    ],
    "correct": ["b"],
    "explanation": "Las verificaciones automatizadas son parte de la Definition of Done, no su totalidad. La salida de IA cumple Done solo cuando los Developers juzgan que se satisface el estándar completo, igual que cualquier otro trabajo.",
    "concept_slugs": ["dod-applies-to-ai-output"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "¿Por qué es riesgoso fusionar trabajo generado por IA en el Increment sin la revisión normal del equipo?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "La salida de IA siempre es de menor calidad que la humana" },
      { "id": "b", "text": "Hace que el trabajo parezca terminado mientras se salta el estándar que hace 'terminado' significativo, ocultando riesgo en el Increment" },
      { "id": "c", "text": "La Guía de Scrum prohíbe el código generado por IA en el Increment" },
      { "id": "d", "text": "Viola el timebox del Sprint" }
    ],
    "correct": ["b"],
    "explanation": "Saltarse la revisión no ahorra tiempo; oculta riesgo. La Definition of Done es lo que hace 'Done' confiable, y saltársela para el trabajo con IA elimina esa garantía.",
    "concept_slugs": ["dod-applies-to-ai-output"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "¿Qué exige la transparencia de artefactos cuando gran parte del Increment es generada por IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Ocultar qué partes fueron generadas por IA para evitar sesgo en la revisión" },
      { "id": "b", "text": "Que el equipo pueda ver y verificar cómo se produjo el trabajo, manteniéndolo inspeccionable y honesto sobre qué fue generado por máquina" },
      { "id": "c", "text": "Confiar en la salida del modelo ya que es consistente" },
      { "id": "d", "text": "Reemplazar la revisión de código con el puntaje de confianza de la propia IA" }
    ],
    "correct": ["b"],
    "explanation": "La transparencia significa que el trabajo detrás del Increment es visible y honesto para que el equipo pueda inspeccionarlo. La salida de IA opaca y sin verificar rompe eso; el equipo debe mantener inspeccionables las contribuciones de IA.",
    "concept_slugs": ["increment-transparency-ai"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Un Developer quiere saltarse la revisión de código en un gran lote de trabajo generado por IA 'porque hay mucho por avanzar'. ¿Cuál es la mejor respuesta del Scrum Master?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Estar de acuerdo: el volumen justifica confiar en la IA esta vez" },
      { "id": "b", "text": "Señalar que el alto volumen es justo cuando la revisión más importa, y que la Definition of Done se aplica sin importar quién o qué produjo el trabajo" },
      { "id": "c", "text": "Decirle al Developer que lo fusione y revise después si hay tiempo" },
      { "id": "d", "text": "Encargarte y revisarlo todo tú mismo como Scrum Master" }
    ],
    "correct": ["b"],
    "explanation": "El volumen no es razón para bajar el nivel: es razón para mantenerlo. La Definition of Done se aplica al trabajo con IA igual que al humano; el Scrum Master protege esa compuerta.",
    "concept_slugs": ["dod-applies-to-ai-output", "increment-transparency-ai"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::

::summary
- La Definition of Done se aplica por igual al trabajo generado por IA: "lo escribió una IA" no es un atajo para saltarse ningún criterio de calidad.
- La salida de IA es un borrador que entra en el camino normal del equipo hacia Done, nunca un Increment automáticamente Done.
- Pasar las verificaciones automatizadas es parte de la Definition of Done, no un reemplazo del juicio de los Developers.
- La transparencia exige que las contribuciones de IA sigan siendo inspeccionables y honestas sobre qué fue generado por máquina y verificado.
- El alto volumen es cuando la revisión más importa; el Scrum Master protege la Definition of Done como una compuerta real.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-02-definition-of-done-and-ai' and l.language = 'es-419');

-- ---- 06-02 pt-BR -------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'pt-BR', '06-02-definition-of-done-and-ai',
  'c0000000-0000-0000-0000-00000000a602'::uuid,
  $jta$Pronto é pronto: a Definition of Done e o trabalho com IA$jta$,
  2, 8,
  $lesson$---
lesson_id: 06-02-definition-of-done-and-ai
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Pronto é pronto: a Definition of Done e o trabalho com IA"
subtitle: A IA pode rascunhar o Increment, mas não pode declará-lo Done
language: pt-BR
lesson_group_id: c0000000-0000-0000-0000-00000000a602
duration_minutes: 8
order_index: 2
task_codes: [6.2]
concept_slugs:
  - dod-applies-to-ai-output
  - increment-transparency-ai
prerequisites:
  - 06-01-ai-agents-as-tools
preview: |
  Uma lição de 8 minutos sobre aplicar a Definition of Done e a transparência
  dos artefatos ao trabalho gerado por IA: por que a saída de IA é um rascunho,
  não um Increment Done, e como a transparência sobrevive quando um modelo
  escreve o código.
authors:
  - Certidemy team
status: published
---

::hook
A IA gerou uma funcionalidade, os testes estão verdes e a demo parece perfeita. Está Done? Não até os Developers dizerem.
::

::concept title="A Definition of Done não se importa com quem a escreveu"
A Definition of Done é o padrão compartilhado de quando o trabalho sobre o Increment está completo: uma lista de qualidade com a qual todo o Scrum Team se compromete. O Guia do Scrum 2020 é claro: no momento em que um item do Product Backlog cumpre a Definition of Done, nasce um Increment.

Nada desse padrão muda porque a IA produziu o trabalho. [A Definition of Done se aplica igualmente à saída assistida por IA]{glossary="dod-applies-to-ai-output"}. O código escrito por IA ainda precisa cumprir o mesmo nível: testado, revisado, seguro, documentado, o que quer que a Definition of Done do time exija. "Foi uma IA que escreveu" não é um atalho para pular nenhum desses critérios.

O perigo é a velocidade. A IA pode produzir o trabalho de um Sprint em uma tarde, e a tentação é deixar passar porque há muito. Resista. Volume não é Done. O padrão se mantém não importa quão rápido o rascunho chegou.
::

::callout type="exam-watch"
Uma armadilha comum: tratar "passa nas verificações automatizadas" como a mesma coisa que "cumpre a Definition of Done". As verificações automatizadas são *parte* da Definition of Done, não um substituto. Os Developers ainda julgam se o padrão completo foi cumprido.
::

::concept title="A saída de IA é um rascunho, não um Increment Done"
Trate qualquer coisa que uma IA produza como você trataria a primeira versão de um Developer júnior: útil, muitas vezes boa, nunca automaticamente entregável. É um **rascunho** que entra no caminho normal do time até o Done: revisão, testes, integração, julgamento.

Isso importa porque os Developers continuam responsáveis pelo Increment (você viu isso na lição anterior). Se a saída de IA vai direto para o Increment sem cumprir a Definition of Done, o time não economizou tempo: escondeu risco. O trabalho *parece* terminado enquanto pula o padrão que faz "terminado" significar algo.

O trabalho do Scrum Master aqui é proteger a Definition of Done como um portão real, não uma formalidade que o time apressa porque a IA "já cuidou".
::

::interactive widget="highlight-mistake" id="ai-output-treated-as-done" concept_slugs="dod-applies-to-ai-output"
{
  "scenario_title": "O que está errado em como este time lida com a saída de IA?",
  "text": "O agente de IA gerou o novo módulo de pagamentos durante a noite. De manhã, um Developer disse: 'Compila e os testes unitários passam, então fiz o merge direto na main e marquei o item como Done. A IA até escreveu os testes, então estamos cobertos. Podemos pular a revisão de código desta vez porque há muito a avançar.'",
  "highlights": [
    {
      "id": "merged-done",
      "span": "fiz o merge direto na main e marquei o item como Done",
      "is_correct": true,
      "feedback": "Compilar e passar nos testes não é o mesmo que cumprir a Definition of Done. O item não deveria ser marcado como Done até que o padrão completo do time seja cumprido."
    },
    {
      "id": "ai-wrote-tests",
      "span": "A IA até escreveu os testes, então estamos cobertos",
      "is_correct": true,
      "feedback": "Os testes escritos por IA também são um rascunho. Testes que a IA escreveu para verificar código escrito por IA podem compartilhar os mesmos pontos cegos; ainda precisam de revisão humana."
    },
    {
      "id": "skip-review",
      "span": "Podemos pular a revisão de código desta vez porque há muito a avançar",
      "is_correct": true,
      "feedback": "O volume é justamente quando a revisão mais importa. Pulá-la porque há muita saída de IA inverte a Definition of Done."
    }
  ],
  "minimum_correct": 2
}
::

::concept title="Transparência quando um modelo escreve o código"
O Scrum funciona com transparência: o Increment, e o trabalho por trás dele, devem ser visíveis e honestos para que o time possa inspecioná-lo. [A IA muda o que a transparência exige]{glossary="increment-transparency-ai"}.

Quando uma pessoa escreve código, um revisor pode perguntar a ela o que pretendia. Quando um modelo o escreve, essa conversa não existe, então o time precisa tornar a contribuição da IA inspecionável de outras formas: guardar os prompts ou o contexto que a produziram, revisar a saída com o mesmo cuidado de qualquer contribuição externa, e ser honesto no Increment sobre o que foi gerado por máquina e verificado e o que não foi.

A saída de IA opaca é uma falha de transparência. Se ninguém consegue dizer como uma parte do Increment passou a existir ou se alguém realmente a verificou, o time perdeu a visibilidade da qual a inspeção depende, e a inspeção é o que mantém o Scrum empírico.
::

::callout type="pro-tip"
Adicione uma linha ao acordo de trabalho do seu time: o trabalho gerado por IA é revisado com o mesmo padrão do trabalho humano antes de contar para o Increment. Transforma "a IA fez" de uma desculpa em um passo normal e inspecionável.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Um agente de IA produz código que compila e passa em todos os testes automatizados existentes. Ele cumpre a Definition of Done?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Sim: passar nos testes automatizados é a Definition of Done" },
      { "id": "b", "text": "Não necessariamente; os Developers ainda o julgam contra a Definition of Done completa" },
      { "id": "c", "text": "Sim, desde que a IA também tenha escrito os testes" },
      { "id": "d", "text": "Não: a saída de IA nunca pode cumprir a Definition of Done" }
    ],
    "correct": ["b"],
    "explanation": "As verificações automatizadas são parte da Definition of Done, não o todo. A saída de IA cumpre Done apenas quando os Developers julgam que o padrão completo foi satisfeito, igual a qualquer outro trabalho.",
    "concept_slugs": ["dod-applies-to-ai-output"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "Por que é arriscado fazer o merge de trabalho gerado por IA no Increment sem a revisão normal do time?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "A saída de IA é sempre de qualidade inferior à humana" },
      { "id": "b", "text": "Faz o trabalho parecer terminado enquanto pula o padrão que torna 'terminado' significativo, escondendo risco no Increment" },
      { "id": "c", "text": "O Guia do Scrum proíbe código gerado por IA no Increment" },
      { "id": "d", "text": "Viola o timebox do Sprint" }
    ],
    "correct": ["b"],
    "explanation": "Pular a revisão não economiza tempo; esconde risco. A Definition of Done é o que torna 'Done' confiável, e pulá-la para o trabalho com IA remove essa garantia.",
    "concept_slugs": ["dod-applies-to-ai-output"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "O que a transparência de artefatos exige quando grande parte do Increment é gerada por IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Esconder quais partes foram geradas por IA para evitar viés na revisão" },
      { "id": "b", "text": "Que o time consiga ver e verificar como o trabalho foi produzido, mantendo-o inspecionável e honesto sobre o que foi gerado por máquina" },
      { "id": "c", "text": "Confiar na saída do modelo já que ela é consistente" },
      { "id": "d", "text": "Substituir a revisão de código pela pontuação de confiança da própria IA" }
    ],
    "correct": ["b"],
    "explanation": "Transparência significa que o trabalho por trás do Increment é visível e honesto para que o time possa inspecioná-lo. A saída de IA opaca e não verificada quebra isso; o time precisa manter as contribuições de IA inspecionáveis.",
    "concept_slugs": ["increment-transparency-ai"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Um Developer quer pular a revisão de código em um grande lote de trabalho gerado por IA 'porque há muito a avançar'. Qual é a melhor resposta do Scrum Master?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Concordar: o volume justifica confiar na IA desta vez" },
      { "id": "b", "text": "Apontar que o alto volume é justamente quando a revisão mais importa, e que a Definition of Done se aplica não importa quem ou o que produziu o trabalho" },
      { "id": "c", "text": "Dizer ao Developer para fazer o merge e revisar depois se houver tempo" },
      { "id": "d", "text": "Assumir e revisar tudo você mesmo como Scrum Master" }
    ],
    "correct": ["b"],
    "explanation": "Volume não é razão para baixar o nível: é razão para mantê-lo. A Definition of Done se aplica ao trabalho com IA igual ao humano; o Scrum Master protege esse portão.",
    "concept_slugs": ["dod-applies-to-ai-output", "increment-transparency-ai"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::

::summary
- A Definition of Done se aplica igualmente ao trabalho gerado por IA: "foi uma IA que escreveu" não é um atalho para pular nenhum critério de qualidade.
- A saída de IA é um rascunho que entra no caminho normal do time até o Done, nunca um Increment automaticamente Done.
- Passar nas verificações automatizadas é parte da Definition of Done, não um substituto do julgamento dos Developers.
- A transparência exige que as contribuições de IA permaneçam inspecionáveis e honestas sobre o que foi gerado por máquina e verificado.
- O alto volume é quando a revisão mais importa; o Scrum Master protege a Definition of Done como um portão real.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-02-definition-of-done-and-ai' and l.language = 'pt-BR');

-- ---- VERIFICATION (expect 3 rows) --------------------------------------------
-- select language, slug, title from public.lessons
--  where slug = '06-02-definition-of-done-and-ai' order by language;
