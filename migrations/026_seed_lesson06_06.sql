-- 026_seed_lesson06_06.sql
-- =============================================================================
-- Lesson 06-06 "Coaching the AI-Augmented Team" (MODULE 6 CAPSTONE)
-- (task 6.7, Bloom-5 sim-candidate; concepts ai-augmentation-anti-patterns,
-- coaching-restore-empiricism) in en + es-419 + pt-BR. Module 6, order_index 6.
-- Widget: scenario-mcq (small: 3 steps, 2-3 options).
-- Dollar-quoted ($lesson$ body, $jta$ title); idempotent on (slug, language).
-- =============================================================================

-- ---- 06-06 en ----------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'en', '06-06-coaching-the-ai-augmented-team',
  'c0000000-0000-0000-0000-00000000a606'::uuid,
  $jta$Coaching the AI-Augmented Team$jta$,
  6, 10,
  $lesson$---
lesson_id: 06-06-coaching-the-ai-augmented-team
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Coaching the AI-Augmented Team"
subtitle: From spotting the anti-patterns to coaching the team out of them
language: en
lesson_group_id: c0000000-0000-0000-0000-00000000a606
duration_minutes: 10
order_index: 6
task_codes: [6.7]
concept_slugs:
  - ai-augmentation-anti-patterns
  - coaching-restore-empiricism
prerequisites:
  - 06-05-what-to-delegate-what-to-keep
preview: |
  The module capstone. A 10-minute lesson that gathers the AI-augmentation
  anti-patterns into one diagnostic view and shows how a Scrum Master coaches
  a team to restore its own empiricism — by making the pattern visible and
  letting the team own the change, not by issuing rules.
authors:
  - Certidemy team
status: published
---

::hook
You can now see what goes wrong when teams adopt AI. The harder skill is helping a team see it for itself — and choose to fix it.
::

::concept title="From Spotting to Coaching"
This module taught you to recognize what breaks when AI enters a Scrum Team: AI mistaken for a team member, unreviewed output called Done, the review bottleneck, automation over-trust, eroded shared understanding, empiricism outrun, and accountability wrongly delegated. Recognition is the foundation. It is not the job.

The job is coaching. A Scrum Master who merely spots dysfunction and issues corrections is policing, not coaching — and policed behavior reverts the moment no one is watching. The Scrum Master's real work is helping the team see its own pattern and choose a change that sticks because the team owns it. This capstone is about making that shift.
::

::concept title="The AI-Augmentation Anti-Patterns"
[AI-augmentation anti-patterns]{glossary="ai-augmentation-anti-patterns"} are the recurring dysfunctions this module has named, now collected as a diagnostic set. When you coach an AI-using team, you are watching for:

- **AI treated as a team member** — accountabilities drifting onto a tool.
- **Output called Done** — AI work entering the Increment without meeting the Definition of Done.
- **Over-trust** — inspection skipped because the tool is "usually right."
- **Eroded shared understanding** — knowledge trapped in private AI chats.
- **Output as success** — raw volume mistaken for value, empiricism outrun.
- **Delegated accountability** — the team handing over not just doing but answering.

These rarely appear alone. A team in trouble usually shows several at once, reinforcing each other. Naming them is diagnosis; it tells you what the team needs to see — but naming is not yet coaching.
::

::concept title="Coaching to Restore Empiricism"
[Coaching restores empiricism by helping the team see the pattern and own the change]{glossary="coaching-restore-empiricism"} — not by mandating a fix.

The move is consistent. First, make the anti-pattern visible without blame: reflect back what you observe so the team can see it too. Then ask, rather than tell — "what do we notice about how we're working?" lands differently than "stop doing that." Then let the team choose a change that puts human inspection and adaptation back into the loop, and inspect that change next Sprint like any other experiment.

Why not just give the answer? Because empiricism is something a team *does*, not a rule it follows. A team that is told what to do has not restored its inspect-and-adapt; it has added a new instruction to obey. A team that sees its own pattern and chooses its own correction has actually adapted — which is the very capability the anti-patterns eroded. The coaching *is* the repair.
::

::interactive widget="scenario-mcq" id="coaching-team-back-to-empiricism" concept_slugs="ai-augmentation-anti-patterns,coaching-restore-empiricism"
{
  "scenario_title": "Coaching a team that has lost its empiricism to AI",
  "steps": [
    {
      "id": "step-1",
      "situation": "A team you coach has gone all-in on AI. The Daily Scrum has become a list of what the AI shipped overnight, unreviewed AI code goes straight into the Increment, and in the last Retrospective someone asked, 'Why retro at all? The metrics already tell us everything.' You see several anti-patterns at once.",
      "question": "Where do you start as their coach?",
      "options": [
        { "id": "a", "text": "Issue a set of rules banning each behavior you have spotted.", "next": "step-2a" },
        { "id": "b", "text": "Make the pattern visible to the team and ask what they notice about how they are working.", "next": "step-2b" },
        { "id": "c", "text": "Quietly clean up the worst issues yourself between Sprints.", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "The team follows the rules without understanding why. The moment you are not watching, the same anti-patterns return wearing slightly different clothes.",
      "question": "What do you take from this?",
      "options": [
        { "id": "a", "text": "Rules without understanding do not restore empiricism — the team has to see the problem and own the change.", "next": "end-good" },
        { "id": "b", "text": "The rules just need to be stricter and better enforced.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2b",
      "situation": "The team reflects and one Developer says it out loud: 'We have been treating output as the goal and we stopped really inspecting anything.'",
      "question": "How do you help them from here?",
      "options": [
        { "id": "a", "text": "Coach them to choose one change that puts human inspection and adaptation back in the loop, and inspect it next Sprint.", "next": "end-good" },
        { "id": "b", "text": "Now that they see it, tell them exactly what to change.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "You become the team's safety net. The Increment looks fine, but the team never confronts its own dysfunction and grows more dependent on you each Sprint.",
      "question": "What now?",
      "options": [
        { "id": "a", "text": "Stop rescuing; surface the anti-pattern to the team and coach them to own it.", "next": "end-good" },
        { "id": "b", "text": "Keep firefighting — at least the Increment stays clean.", "next": "end-weak" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2b:a"],
  "explanation": "Coaching restores empiricism by making the anti-pattern visible and helping the team choose and own a change that puts inspect-and-adapt back in the loop. Directing (rules) and rescuing (fixing it yourself) both bypass the team's ownership, so the dysfunction returns. The Scrum Master coaches; the self-managing team adapts — and that act of adapting is the repair."
}
::

::callout type="pro-tip"
The tell that you are coaching rather than directing: after the conversation, the team can explain *why* the change matters in its own words. If they can only recite what you told them to do, you have given an instruction, not restored a capability.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "A Scrum Master notices a team treating AI output volume as success, skipping review, and delegating the Sprint Goal to its AI. What is the most accurate description of what the Scrum Master is seeing?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "A single isolated impediment" },
      { "id": "b", "text": "Several AI-augmentation anti-patterns appearing together and reinforcing each other" },
      { "id": "c", "text": "Normal, healthy use of AI in Scrum" },
      { "id": "d", "text": "A tooling problem the vendor should fix" }
    ],
    "correct": ["b"],
    "explanation": "These are distinct anti-patterns — output-as-success, over-trust, delegated accountability — and they typically cluster, each making the others worse.",
    "concept_slugs": ["ai-augmentation-anti-patterns"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "Why is issuing a list of rules usually a poor way to fix AI-augmentation anti-patterns?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Rules take too long to write" },
      { "id": "b", "text": "Policed behavior reverts without understanding; the team has not restored its own inspect-and-adapt, only added instructions to obey" },
      { "id": "c", "text": "The Scrum Guide forbids Scrum Masters from setting rules" },
      { "id": "d", "text": "Rules work, but only if the Product Owner writes them" }
    ],
    "correct": ["b"],
    "explanation": "Empiricism is something a team does, not a rule it follows. Rules without ownership revert; coaching the team to see and own the change is what restores the capability.",
    "concept_slugs": ["coaching-restore-empiricism"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "What is the best first coaching move when a team is deep in AI-augmentation anti-patterns?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Make the pattern visible without blame and ask the team what they notice" },
      { "id": "b", "text": "Take over the team's reviews until things stabilize" },
      { "id": "c", "text": "Escalate to management to mandate change" },
      { "id": "d", "text": "Ban the AI tool entirely" }
    ],
    "correct": ["a"],
    "explanation": "Coaching starts by helping the team see its own pattern. Visibility plus a question creates the conditions for the team to choose and own a change.",
    "concept_slugs": ["coaching-restore-empiricism"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "After a coaching conversation about AI over-trust, how can the Scrum Master tell whether empiricism was actually restored rather than just instructed?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "The team produces more output the next Sprint" },
      { "id": "b", "text": "The team can explain in its own words why the change matters and chose the change itself" },
      { "id": "c", "text": "The AI metrics improve" },
      { "id": "d", "text": "The Scrum Master no longer has to attend the Retrospective" }
    ],
    "correct": ["b"],
    "explanation": "Restored empiricism shows up as ownership and understanding: the team chose the change and can articulate why. Reciting an instruction is not the same as having adapted.",
    "concept_slugs": ["coaching-restore-empiricism", "ai-augmentation-anti-patterns"],
    "bloom_level": "5_evaluate",
    "difficulty": 3
  }
]
::

::summary
- Recognizing AI-augmentation anti-patterns is the foundation; coaching the team out of them is the job.
- The anti-patterns — AI as team member, output called Done, over-trust, eroded shared understanding, output-as-success, delegated accountability — usually cluster and reinforce each other.
- Coaching restores empiricism: make the pattern visible without blame, ask rather than tell, and let the team choose and inspect its own change.
- Directing (rules) and rescuing (fixing it yourself) both bypass ownership, so the dysfunction returns.
- The proof empiricism was restored: the team chose the change and can explain why it matters in its own words.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-06-coaching-the-ai-augmented-team' and l.language = 'en');

-- ---- 06-06 es-419 ------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'es-419', '06-06-coaching-the-ai-augmented-team',
  'c0000000-0000-0000-0000-00000000a606'::uuid,
  $jta$Coaching al equipo aumentado con IA$jta$,
  6, 10,
  $lesson$---
lesson_id: 06-06-coaching-the-ai-augmented-team
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Coaching al equipo aumentado con IA"
subtitle: De detectar los anti-patrones a sacar al equipo de ellos con coaching
language: es-419
lesson_group_id: c0000000-0000-0000-0000-00000000a606
duration_minutes: 10
order_index: 6
task_codes: [6.7]
concept_slugs:
  - ai-augmentation-anti-patterns
  - coaching-restore-empiricism
prerequisites:
  - 06-05-what-to-delegate-what-to-keep
preview: |
  El cierre del módulo. Una lección de 10 minutos que reúne los anti-patrones
  del aumento con IA en una vista de diagnóstico y muestra cómo un Scrum Master
  hace coaching a un equipo para restaurar su propio empirismo: haciendo visible
  el patrón y dejando que el equipo sea dueño del cambio, no imponiendo reglas.
authors:
  - Certidemy team
status: published
---

::hook
Ya puedes ver qué sale mal cuando los equipos adoptan IA. La habilidad más difícil es ayudar a un equipo a verlo por sí mismo, y a elegir corregirlo.
::

::concept title="De detectar a hacer coaching"
Este módulo te enseñó a reconocer qué se rompe cuando la IA entra en un Scrum Team: la IA confundida con un integrante, salida sin revisar llamada Done, el cuello de botella de revisión, el exceso de confianza en la automatización, el entendimiento compartido erosionado, el empirismo superado y la accountability delegada por error. Reconocer es la base. No es el trabajo.

El trabajo es el coaching. Un Scrum Master que solo detecta disfunciones y emite correcciones está vigilando, no haciendo coaching, y el comportamiento vigilado revierte en cuanto nadie mira. El verdadero trabajo del Scrum Master es ayudar al equipo a ver su propio patrón y elegir un cambio que perdure porque el equipo es su dueño. Este cierre trata sobre hacer ese giro.
::

::concept title="Los anti-patrones del aumento con IA"
Los [anti-patrones del aumento con IA]{glossary="ai-augmentation-anti-patterns"} son las disfunciones recurrentes que este módulo ha nombrado, ahora reunidas como un conjunto de diagnóstico. Cuando haces coaching a un equipo que usa IA, estás atento a:

- **La IA tratada como integrante**: accountabilities que se desplazan hacia una herramienta.
- **Salida llamada Done**: trabajo de IA que entra al Increment sin cumplir la Definition of Done.
- **Exceso de confianza**: inspección omitida porque la herramienta "casi siempre tiene razón".
- **Entendimiento compartido erosionado**: conocimiento atrapado en chats privados con IA.
- **Salida como éxito**: el volumen bruto confundido con valor, el empirismo superado.
- **Accountability delegada**: el equipo cede no solo el hacer sino el responder.

Rara vez aparecen solos. Un equipo en problemas suele mostrar varios a la vez, reforzándose entre sí. Nombrarlos es el diagnóstico; te dice qué necesita ver el equipo, pero nombrar todavía no es coaching.
::

::concept title="Coaching para restaurar el empirismo"
[El coaching restaura el empirismo ayudando al equipo a ver el patrón y ser dueño del cambio]{glossary="coaching-restore-empiricism"}, no imponiendo una solución.

El movimiento es consistente. Primero, haz visible el anti-patrón sin culpa: refleja lo que observas para que el equipo también lo vea. Luego pregunta, en vez de decir: "¿qué notamos sobre cómo estamos trabajando?" cae distinto que "dejen de hacer eso". Después deja que el equipo elija un cambio que vuelva a poner la inspección y la adaptación humanas en el ciclo, e inspecciona ese cambio el próximo Sprint como cualquier otro experimento.

¿Por qué no dar la respuesta directamente? Porque el empirismo es algo que un equipo *hace*, no una regla que sigue. Un equipo al que le dicen qué hacer no ha restaurado su inspeccionar y adaptar; solo agregó una nueva instrucción que obedecer. Un equipo que ve su propio patrón y elige su propia corrección de verdad se adaptó, que es justo la capacidad que los anti-patrones erosionaron. El coaching *es* la reparación.
::

::interactive widget="scenario-mcq" id="coaching-team-back-to-empiricism" concept_slugs="ai-augmentation-anti-patterns,coaching-restore-empiricism"
{
  "scenario_title": "Coaching a un equipo que perdió su empirismo por la IA",
  "steps": [
    {
      "id": "step-1",
      "situation": "Un equipo al que haces coaching apostó todo a la IA. El Daily Scrum se volvió una lista de lo que la IA entregó durante la noche, el código de IA sin revisar entra directo al Increment, y en la última Retrospective alguien preguntó: '¿Para qué hacer retro? Las métricas ya nos dicen todo.' Ves varios anti-patrones a la vez.",
      "question": "¿Por dónde empiezas como su coach?",
      "options": [
        { "id": "a", "text": "Emitir un conjunto de reglas que prohíban cada comportamiento que detectaste.", "next": "step-2a" },
        { "id": "b", "text": "Hacer visible el patrón al equipo y preguntar qué notan sobre cómo están trabajando.", "next": "step-2b" },
        { "id": "c", "text": "Limpiar en silencio los peores problemas tú mismo entre Sprints.", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "El equipo sigue las reglas sin entender por qué. En cuanto no estás mirando, los mismos anti-patrones regresan con ropa ligeramente distinta.",
      "question": "¿Qué sacas de esto?",
      "options": [
        { "id": "a", "text": "Las reglas sin entendimiento no restauran el empirismo: el equipo tiene que ver el problema y ser dueño del cambio.", "next": "end-good" },
        { "id": "b", "text": "Las reglas solo necesitan ser más estrictas y mejor aplicadas.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2b",
      "situation": "El equipo reflexiona y un Developer lo dice en voz alta: 'Hemos estado tratando la salida como la meta y dejamos de inspeccionar de verdad cualquier cosa.'",
      "question": "¿Cómo los ayudas desde aquí?",
      "options": [
        { "id": "a", "text": "Hacerles coaching para que elijan un cambio que vuelva a poner la inspección y la adaptación humanas en el ciclo, e inspeccionarlo el próximo Sprint.", "next": "end-good" },
        { "id": "b", "text": "Ahora que lo ven, decirles exactamente qué cambiar.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "Te conviertes en la red de seguridad del equipo. El Increment se ve bien, pero el equipo nunca confronta su propia disfunción y se vuelve más dependiente de ti cada Sprint.",
      "question": "¿Qué haces ahora?",
      "options": [
        { "id": "a", "text": "Dejar de rescatar; sacar a la luz el anti-patrón ante el equipo y hacerles coaching para que sean sus dueños.", "next": "end-good" },
        { "id": "b", "text": "Seguir apagando incendios: al menos el Increment se mantiene limpio.", "next": "end-weak" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2b:a"],
  "explanation": "El coaching restaura el empirismo haciendo visible el anti-patrón y ayudando al equipo a elegir y ser dueño de un cambio que vuelve a poner el inspeccionar y adaptar en el ciclo. Dirigir (reglas) y rescatar (arreglarlo tú mismo) ambos esquivan la propiedad del equipo, así que la disfunción regresa. El Scrum Master hace coaching; el equipo autogestionado se adapta, y ese acto de adaptarse es la reparación."
}
::

::callout type="pro-tip"
La señal de que estás haciendo coaching y no dirigiendo: después de la conversación, el equipo puede explicar *por qué* importa el cambio con sus propias palabras. Si solo pueden repetir lo que les dijiste que hicieran, diste una instrucción, no restauraste una capacidad.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Un Scrum Master nota que un equipo trata el volumen de salida de IA como éxito, se salta la revisión y delega el Sprint Goal a su IA. ¿Cuál es la descripción más precisa de lo que ve el Scrum Master?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Un único impedimento aislado" },
      { "id": "b", "text": "Varios anti-patrones del aumento con IA que aparecen juntos y se refuerzan entre sí" },
      { "id": "c", "text": "Un uso normal y sano de la IA en Scrum" },
      { "id": "d", "text": "Un problema de herramientas que el proveedor debería arreglar" }
    ],
    "correct": ["b"],
    "explanation": "Estos son anti-patrones distintos —salida como éxito, exceso de confianza, accountability delegada— y suelen agruparse, empeorándose mutuamente.",
    "concept_slugs": ["ai-augmentation-anti-patterns"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "¿Por qué emitir una lista de reglas suele ser una mala forma de corregir los anti-patrones del aumento con IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Las reglas tardan demasiado en escribirse" },
      { "id": "b", "text": "El comportamiento vigilado revierte sin entendimiento; el equipo no ha restaurado su propio inspeccionar y adaptar, solo agregó instrucciones que obedecer" },
      { "id": "c", "text": "La Guía de Scrum prohíbe que los Scrum Masters pongan reglas" },
      { "id": "d", "text": "Las reglas funcionan, pero solo si las escribe el Product Owner" }
    ],
    "correct": ["b"],
    "explanation": "El empirismo es algo que un equipo hace, no una regla que sigue. Las reglas sin propiedad revierten; hacer coaching al equipo para que vea y sea dueño del cambio es lo que restaura la capacidad.",
    "concept_slugs": ["coaching-restore-empiricism"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "¿Cuál es el mejor primer movimiento de coaching cuando un equipo está hundido en anti-patrones del aumento con IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Hacer visible el patrón sin culpa y preguntar al equipo qué nota" },
      { "id": "b", "text": "Hacerte cargo de las revisiones del equipo hasta que las cosas se estabilicen" },
      { "id": "c", "text": "Escalar a la gerencia para que imponga el cambio" },
      { "id": "d", "text": "Prohibir por completo la herramienta de IA" }
    ],
    "correct": ["a"],
    "explanation": "El coaching empieza ayudando al equipo a ver su propio patrón. La visibilidad más una pregunta crean las condiciones para que el equipo elija y sea dueño de un cambio.",
    "concept_slugs": ["coaching-restore-empiricism"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Después de una conversación de coaching sobre el exceso de confianza en la IA, ¿cómo puede saber el Scrum Master si el empirismo se restauró de verdad en vez de solo haberse instruido?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "El equipo produce más salida el siguiente Sprint" },
      { "id": "b", "text": "El equipo puede explicar con sus propias palabras por qué importa el cambio y eligió el cambio por sí mismo" },
      { "id": "c", "text": "Las métricas de IA mejoran" },
      { "id": "d", "text": "El Scrum Master ya no tiene que asistir a la Retrospective" }
    ],
    "correct": ["b"],
    "explanation": "El empirismo restaurado se manifiesta como propiedad y entendimiento: el equipo eligió el cambio y puede articular por qué. Repetir una instrucción no es lo mismo que haberse adaptado.",
    "concept_slugs": ["coaching-restore-empiricism", "ai-augmentation-anti-patterns"],
    "bloom_level": "5_evaluate",
    "difficulty": 3
  }
]
::

::summary
- Reconocer los anti-patrones del aumento con IA es la base; sacar al equipo de ellos con coaching es el trabajo.
- Los anti-patrones —IA como integrante, salida llamada Done, exceso de confianza, entendimiento compartido erosionado, salida como éxito, accountability delegada— suelen agruparse y reforzarse entre sí.
- El coaching restaura el empirismo: haz visible el patrón sin culpa, pregunta en vez de decir, y deja que el equipo elija e inspeccione su propio cambio.
- Dirigir (reglas) y rescatar (arreglarlo tú mismo) ambos esquivan la propiedad, así que la disfunción regresa.
- La prueba de que el empirismo se restauró: el equipo eligió el cambio y puede explicar por qué importa con sus propias palabras.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-06-coaching-the-ai-augmented-team' and l.language = 'es-419');

-- ---- 06-06 pt-BR -------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'pt-BR', '06-06-coaching-the-ai-augmented-team',
  'c0000000-0000-0000-0000-00000000a606'::uuid,
  $jta$Coaching do time aumentado por IA$jta$,
  6, 10,
  $lesson$---
lesson_id: 06-06-coaching-the-ai-augmented-team
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Coaching do time aumentado por IA"
subtitle: De detectar os anti-padrões a tirar o time deles com coaching
language: pt-BR
lesson_group_id: c0000000-0000-0000-0000-00000000a606
duration_minutes: 10
order_index: 6
task_codes: [6.7]
concept_slugs:
  - ai-augmentation-anti-patterns
  - coaching-restore-empiricism
prerequisites:
  - 06-05-what-to-delegate-what-to-keep
preview: |
  O fechamento do módulo. Uma lição de 10 minutos que reúne os anti-padrões do
  aumento por IA em uma visão de diagnóstico e mostra como um Scrum Master faz
  coaching de um time para restaurar o próprio empirismo: tornando o padrão
  visível e deixando o time ser dono da mudança, não impondo regras.
authors:
  - Certidemy team
status: published
---

::hook
Você já consegue ver o que dá errado quando os times adotam IA. A habilidade mais difícil é ajudar um time a ver isso por si mesmo, e a escolher corrigir.
::

::concept title="De detectar a fazer coaching"
Este módulo ensinou você a reconhecer o que se quebra quando a IA entra em um Scrum Team: a IA confundida com um integrante, saída não revisada chamada de Done, o gargalo de revisão, o excesso de confiança na automação, o entendimento compartilhado erodido, o empirismo superado e a accountability delegada por engano. Reconhecer é a base. Não é o trabalho.

O trabalho é o coaching. Um Scrum Master que apenas detecta disfunções e emite correções está policiando, não fazendo coaching, e o comportamento policiado reverte assim que ninguém olha. O verdadeiro trabalho do Scrum Master é ajudar o time a ver o próprio padrão e escolher uma mudança que dure porque o time é dono dela. Este fechamento é sobre fazer essa virada.
::

::concept title="Os anti-padrões do aumento por IA"
Os [anti-padrões do aumento por IA]{glossary="ai-augmentation-anti-patterns"} são as disfunções recorrentes que este módulo nomeou, agora reunidas como um conjunto de diagnóstico. Quando você faz coaching de um time que usa IA, você está atento a:

- **A IA tratada como integrante**: accountabilities deslizando para uma ferramenta.
- **Saída chamada de Done**: trabalho de IA entrando no Increment sem cumprir a Definition of Done.
- **Excesso de confiança**: inspeção pulada porque a ferramenta "geralmente está certa".
- **Entendimento compartilhado erodido**: conhecimento preso em chats privados com IA.
- **Saída como sucesso**: o volume bruto confundido com valor, o empirismo superado.
- **Accountability delegada**: o time cedendo não só o fazer mas o responder.

Eles raramente aparecem sozinhos. Um time com problemas costuma mostrar vários ao mesmo tempo, reforçando uns aos outros. Nomeá-los é o diagnóstico; isso diz o que o time precisa ver, mas nomear ainda não é coaching.
::

::concept title="Coaching para restaurar o empirismo"
[O coaching restaura o empirismo ajudando o time a ver o padrão e ser dono da mudança]{glossary="coaching-restore-empiricism"}, não impondo uma solução.

O movimento é consistente. Primeiro, torne o anti-padrão visível sem culpa: reflita o que você observa para que o time também veja. Depois pergunte, em vez de dizer: "o que notamos sobre como estamos trabalhando?" soa diferente de "parem de fazer isso". Em seguida, deixe o time escolher uma mudança que recoloque a inspeção e a adaptação humanas no ciclo, e inspecione essa mudança no próximo Sprint como qualquer outro experimento.

Por que não dar a resposta diretamente? Porque o empirismo é algo que um time *faz*, não uma regra que ele segue. Um time a quem dizem o que fazer não restaurou seu inspecionar e adaptar; apenas adicionou uma nova instrução para obedecer. Um time que vê o próprio padrão e escolhe a própria correção de fato se adaptou, que é justamente a capacidade que os anti-padrões erodiram. O coaching *é* o reparo.
::

::interactive widget="scenario-mcq" id="coaching-team-back-to-empiricism" concept_slugs="ai-augmentation-anti-patterns,coaching-restore-empiricism"
{
  "scenario_title": "Coaching de um time que perdeu seu empirismo para a IA",
  "steps": [
    {
      "id": "step-1",
      "situation": "Um time do qual você faz coaching apostou tudo na IA. O Daily Scrum virou uma lista do que a IA entregou durante a noite, o código de IA não revisado entra direto no Increment, e na última Retrospective alguém perguntou: 'Por que fazer retro? As métricas já nos dizem tudo.' Você vê vários anti-padrões ao mesmo tempo.",
      "question": "Por onde você começa como coach deles?",
      "options": [
        { "id": "a", "text": "Emitir um conjunto de regras proibindo cada comportamento que você detectou.", "next": "step-2a" },
        { "id": "b", "text": "Tornar o padrão visível ao time e perguntar o que eles notam sobre como estão trabalhando.", "next": "step-2b" },
        { "id": "c", "text": "Limpar em silêncio os piores problemas você mesmo entre os Sprints.", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "O time segue as regras sem entender por quê. No momento em que você não está olhando, os mesmos anti-padrões voltam com roupa um pouco diferente.",
      "question": "O que você tira disso?",
      "options": [
        { "id": "a", "text": "Regras sem entendimento não restauram o empirismo: o time precisa ver o problema e ser dono da mudança.", "next": "end-good" },
        { "id": "b", "text": "As regras só precisam ser mais rígidas e melhor aplicadas.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2b",
      "situation": "O time reflete e um Developer diz em voz alta: 'A gente tem tratado a saída como a meta e parou de inspecionar de verdade qualquer coisa.'",
      "question": "Como você os ajuda daqui?",
      "options": [
        { "id": "a", "text": "Fazer coaching para que escolham uma mudança que recoloque a inspeção e a adaptação humanas no ciclo, e inspecioná-la no próximo Sprint.", "next": "end-good" },
        { "id": "b", "text": "Agora que eles veem, dizer exatamente o que mudar.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "Você vira a rede de segurança do time. O Increment parece bom, mas o time nunca confronta a própria disfunção e fica mais dependente de você a cada Sprint.",
      "question": "E agora?",
      "options": [
        { "id": "a", "text": "Parar de resgatar; trazer o anti-padrão à tona para o time e fazer coaching para que sejam donos dele.", "next": "end-good" },
        { "id": "b", "text": "Continuar apagando incêndios: pelo menos o Increment continua limpo.", "next": "end-weak" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2b:a"],
  "explanation": "O coaching restaura o empirismo tornando o anti-padrão visível e ajudando o time a escolher e ser dono de uma mudança que recoloca o inspecionar e adaptar no ciclo. Dirigir (regras) e resgatar (consertar você mesmo) ambos contornam a propriedade do time, então a disfunção volta. O Scrum Master faz coaching; o time autogerenciável se adapta, e esse ato de se adaptar é o reparo."
}
::

::callout type="pro-tip"
O sinal de que você está fazendo coaching e não dirigindo: depois da conversa, o time consegue explicar *por que* a mudança importa com as próprias palavras. Se eles só conseguem repetir o que você mandou fazer, você deu uma instrução, não restaurou uma capacidade.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Um Scrum Master nota que um time trata o volume de saída de IA como sucesso, pula a revisão e delega o Sprint Goal à sua IA. Qual é a descrição mais precisa do que o Scrum Master está vendo?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Um único impedimento isolado" },
      { "id": "b", "text": "Vários anti-padrões do aumento por IA aparecendo juntos e reforçando uns aos outros" },
      { "id": "c", "text": "Um uso normal e saudável da IA no Scrum" },
      { "id": "d", "text": "Um problema de ferramenta que o fornecedor deveria corrigir" }
    ],
    "correct": ["b"],
    "explanation": "Estes são anti-padrões distintos —saída como sucesso, excesso de confiança, accountability delegada— e costumam se agrupar, piorando uns aos outros.",
    "concept_slugs": ["ai-augmentation-anti-patterns"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "Por que emitir uma lista de regras costuma ser uma forma ruim de corrigir os anti-padrões do aumento por IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "As regras demoram demais para escrever" },
      { "id": "b", "text": "O comportamento policiado reverte sem entendimento; o time não restaurou o próprio inspecionar e adaptar, apenas adicionou instruções para obedecer" },
      { "id": "c", "text": "O Guia do Scrum proíbe Scrum Masters de definir regras" },
      { "id": "d", "text": "As regras funcionam, mas só se o Product Owner as escrever" }
    ],
    "correct": ["b"],
    "explanation": "O empirismo é algo que um time faz, não uma regra que ele segue. Regras sem propriedade revertem; fazer coaching para que o time veja e seja dono da mudança é o que restaura a capacidade.",
    "concept_slugs": ["coaching-restore-empiricism"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "Qual é o melhor primeiro movimento de coaching quando um time está afundado em anti-padrões do aumento por IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Tornar o padrão visível sem culpa e perguntar ao time o que ele nota" },
      { "id": "b", "text": "Assumir as revisões do time até as coisas se estabilizarem" },
      { "id": "c", "text": "Escalar para a gestão para que imponha a mudança" },
      { "id": "d", "text": "Proibir a ferramenta de IA por completo" }
    ],
    "correct": ["a"],
    "explanation": "O coaching começa ajudando o time a ver o próprio padrão. A visibilidade mais uma pergunta criam as condições para o time escolher e ser dono de uma mudança.",
    "concept_slugs": ["coaching-restore-empiricism"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Depois de uma conversa de coaching sobre o excesso de confiança na IA, como o Scrum Master pode saber se o empirismo foi de fato restaurado em vez de apenas instruído?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "O time produz mais saída no próximo Sprint" },
      { "id": "b", "text": "O time consegue explicar com as próprias palavras por que a mudança importa e escolheu a mudança ele mesmo" },
      { "id": "c", "text": "As métricas de IA melhoram" },
      { "id": "d", "text": "O Scrum Master não precisa mais participar da Retrospective" }
    ],
    "correct": ["b"],
    "explanation": "O empirismo restaurado se manifesta como propriedade e entendimento: o time escolheu a mudança e consegue articular por quê. Repetir uma instrução não é o mesmo que ter se adaptado.",
    "concept_slugs": ["coaching-restore-empiricism", "ai-augmentation-anti-patterns"],
    "bloom_level": "5_evaluate",
    "difficulty": 3
  }
]
::

::summary
- Reconhecer os anti-padrões do aumento por IA é a base; tirar o time deles com coaching é o trabalho.
- Os anti-padrões —IA como integrante, saída chamada de Done, excesso de confiança, entendimento compartilhado erodido, saída como sucesso, accountability delegada— costumam se agrupar e reforçar uns aos outros.
- O coaching restaura o empirismo: torne o padrão visível sem culpa, pergunte em vez de dizer, e deixe o time escolher e inspecionar a própria mudança.
- Dirigir (regras) e resgatar (consertar você mesmo) ambos contornam a propriedade, então a disfunção volta.
- A prova de que o empirismo foi restaurado: o time escolheu a mudança e consegue explicar por que importa com as próprias palavras.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-06-coaching-the-ai-augmented-team' and l.language = 'pt-BR');

-- ---- VERIFICATION (expect 3 rows; and 18 total Module 6 lesson rows) ---------
-- select language, slug, title from public.lessons
--  where slug = '06-06-coaching-the-ai-augmented-team' order by language;
-- select count(*) from public.lessons l
--   join public.modules m on m.id = l.module_id
--  where m.slug = 'ai-augmented-teams';   -- expect 18 (6 lessons x 3 languages)
