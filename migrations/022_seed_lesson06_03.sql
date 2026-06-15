-- 022_seed_lesson06_03.sql
-- =============================================================================
-- Lesson 06-03 "New Impediments in AI-Augmented Teams"
-- (task 6.3; concepts ai-review-bottleneck, automation-over-trust,
-- eroded-shared-understanding-ai) in en + es-419 + pt-BR.
-- Module 6, order_index 3. New widget: scenario-mcq (branching).
-- Dollar-quoted ($lesson$ body, $jta$ title); idempotent on (slug, language).
-- =============================================================================

-- ---- 06-03 en ----------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'en', '06-03-new-impediments-ai-teams',
  'c0000000-0000-0000-0000-00000000a603'::uuid,
  $jta$New Impediments in AI-Augmented Teams$jta$,
  3, 9,
  $lesson$---
lesson_id: 06-03-new-impediments-ai-teams
module_slug: ai-augmented-teams
certification_code: SMPC
title: "New Impediments in AI-Augmented Teams"
subtitle: The bottlenecks automation creates — and how to spot them
language: en
lesson_group_id: c0000000-0000-0000-0000-00000000a603
duration_minutes: 9
order_index: 3
task_codes: [6.3]
concept_slugs:
  - ai-review-bottleneck
  - automation-over-trust
  - eroded-shared-understanding-ai
prerequisites:
  - 06-02-definition-of-done-and-ai
preview: |
  A 9-minute lesson on the new impediments AI-augmented teams face —
  review bottlenecks, automation over-trust, and eroded shared
  understanding — and how a Scrum Master spots and categorizes them.
authors:
  - Certidemy team
status: published
---

::hook
AI did not remove your team's impediments. It created new ones — and they are easy to miss because they look like progress.
::

::concept title="Impediments Change Shape, Not Existence"
An impediment is anything that slows the Developers or blocks the path to the Sprint Goal. The Scrum Master's classic work is making impediments visible and helping remove them. AI does not end that work — it changes what the impediments look like.

The old impediments were obvious: a blocked dependency, a flaky environment, an unavailable stakeholder. The new ones wear a disguise. They show up *as* productivity — more code, more output, faster drafts — which is exactly why they slip past a team that equates "more" with "better." This lesson teaches you to recognize three of them by name, because you cannot remove what you cannot see.
::

::concept title="Impediment 1 — The Review Bottleneck"
When AI generates output faster than the team can inspect it, the constraint moves. [The review bottleneck]{glossary="ai-review-bottleneck"} is the impediment where creation is no longer the slow step — *review is*.

A team used to writing code at human speed suddenly has ten times the volume arriving for review. Pull requests pile up. Reviewers skim instead of read. Work sits "almost done" because the inspection capacity never scaled with the generation capacity. The Sprint feels busy and stalled at the same time.

The tell: a growing gap between "generated" and "actually reviewed and integrated." If your team produces far more than it can inspect, the AI did not speed you up — it relocated your bottleneck and hid it.
::

::concept title="Impediment 2 — Automation Over-Trust"
[Automation over-trust]{glossary="automation-over-trust"} is the impediment where unverified AI output flows into the Increment because the team has started to assume the tool is right.

It builds quietly. The AI is correct often enough that checking it starts to feel like a waste of time. Reviews get shallower. "The model probably handled the edge cases." Then a confidently wrong output ships — plausible, well-formatted, and broken — and because no one really inspected it, it reaches production before anyone notices.

The tell: the team's justification for not checking is the tool's past reliability rather than this work's actual verification. "It is usually right" is not inspection.
::

::callout type="pitfall"
Over-trust is more dangerous than obvious failure. A tool that is wrong 50% of the time gets checked. A tool that is wrong 5% of the time, confidently, trains the team to stop checking — and the 5% ships.
::

::concept title="Impediment 3 — Eroded Shared Understanding"
[Eroded shared understanding]{glossary="eroded-shared-understanding-ai"} is the impediment where reliance on private AI assistance fragments what the team collectively knows about its own product.

When each Developer pairs privately with an AI, knowledge that used to flow through pairing, review, and hallway conversation now lives in individual chat histories. The code exists, but no shared mental model of *why* it works does. Six weeks later, no one can explain a module because the reasoning happened in a conversation only one person — and a model — ever saw.

The tell: the team ships working code it cannot collectively explain. Transparency of the Increment is intact; transparency of the *understanding* is gone — and that is what the team needs to inspect and adapt.
::

::interactive widget="scenario-mcq" id="ai-output-flooding-the-sprint" concept_slugs="ai-review-bottleneck,automation-over-trust"
{
  "scenario_title": "The Sprint is drowning in AI output",
  "steps": [
    {
      "id": "step-1",
      "situation": "Mid-Sprint. Your team adopted an AI agent two weeks ago. Generated pull requests are piling up far faster than anyone reviews them, and a Developer just said: 'Let us just merge the AI ones — it is usually right, and we will never catch up otherwise.'",
      "question": "What is your first move as Scrum Master?",
      "options": [
        { "id": "a", "text": "Agree — merging keeps the Sprint moving and the AI is reliable.", "next": "step-2a" },
        { "id": "b", "text": "Name the impediment to the team: generation now outpaces review, and over-trust is creeping in.", "next": "step-2b" },
        { "id": "c", "text": "Quietly review everything yourself to clear the backlog.", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "The team merges the backlog unreviewed. Two days later, a confidently wrong AI change causes a production incident no one caught.",
      "question": "What now?",
      "options": [
        { "id": "a", "text": "Bring it to the Retrospective: the review bottleneck and over-trust are impediments to surface and address as a team.", "next": "end-good" },
        { "id": "b", "text": "Tell the team to be more careful next time and move on.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2b",
      "situation": "The team pauses. Naming it lands: 'So the AI did not speed us up — it moved our bottleneck to review, and we started trusting it to avoid the pile-up.'",
      "question": "What do you facilitate next?",
      "options": [
        { "id": "a", "text": "Let the team decide how to rebalance — slow generation, strengthen review, or both — and inspect the result next Sprint.", "next": "end-good" },
        { "id": "b", "text": "Mandate that they review every line yourself as the rule.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "You become the sole reviewer. The backlog clears for a week, then you become the bottleneck and burn out. The team never owned the problem.",
      "question": "What now?",
      "options": [
        { "id": "a", "text": "Hand it back to the team as a shared impediment to solve through self-management.", "next": "end-good" },
        { "id": "b", "text": "Keep absorbing the review load yourself.", "next": "end-weak" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2b:a"],
  "explanation": "The Scrum Master's job is to make the impediment visible and let the self-managing team solve it — not to merge unreviewed work (over-trust), and not to become the sole reviewer (which hides the impediment and creates a new one). Naming the review bottleneck and over-trust, then facilitating the team's own fix, is the coaching stance."
}
::

::callout type="pro-tip"
Add one signal to your team's awareness, not a leaderboard: the gap between work generated and work actually reviewed-and-integrated. When that gap grows, the review bottleneck is forming. It is a signal to inspect, not a target to optimize.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "A team's AI agent produces far more code than the team can review, so pull requests pile up unreviewed. Which impediment is this?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Automation over-trust" },
      { "id": "b", "text": "The review bottleneck" },
      { "id": "c", "text": "Eroded shared understanding" },
      { "id": "d", "text": "A blocked dependency" }
    ],
    "correct": ["b"],
    "explanation": "When generation outpaces inspection, the constraint moves to review — the review bottleneck. Creation is no longer the slow step.",
    "concept_slugs": ["ai-review-bottleneck"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "A team stops carefully reviewing AI output because 'the model is usually right.' Which impediment is forming?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "The review bottleneck" },
      { "id": "b", "text": "Automation over-trust" },
      { "id": "c", "text": "Eroded shared understanding" },
      { "id": "d", "text": "An unavailable stakeholder" }
    ],
    "correct": ["b"],
    "explanation": "Justifying skipped inspection with the tool's past reliability — rather than verifying this work — is automation over-trust.",
    "concept_slugs": ["automation-over-trust"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "A team ships working code each Sprint but increasingly cannot collectively explain how its own modules work, because each Developer pairs privately with an AI. Which impediment is this?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Eroded shared understanding" },
      { "id": "b", "text": "The review bottleneck" },
      { "id": "c", "text": "Automation over-trust" },
      { "id": "d", "text": "A flaky test environment" }
    ],
    "correct": ["a"],
    "explanation": "When reasoning lives in private AI conversations instead of shared review and pairing, the team loses its collective mental model — eroded shared understanding.",
    "concept_slugs": ["eroded-shared-understanding-ai"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Why are these AI-augmentation impediments especially easy for a Scrum Master to miss?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "They only appear in remote teams" },
      { "id": "b", "text": "They disguise themselves as productivity — more output, faster drafts — so a team that equates 'more' with 'better' overlooks them" },
      { "id": "c", "text": "The Scrum Guide does not mention impediments" },
      { "id": "d", "text": "They only affect the Product Owner" }
    ],
    "correct": ["b"],
    "explanation": "Unlike a blocked dependency, these impediments look like progress. A team that treats raw output as success will miss the growing review gap, the over-trust, and the lost shared understanding.",
    "concept_slugs": ["ai-review-bottleneck", "automation-over-trust"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  }
]
::

::summary
- AI does not remove impediments; it creates new ones that disguise themselves as productivity.
- The review bottleneck: generation outpaces inspection, so review — not creation — becomes the constraint.
- Automation over-trust: unverified AI output flows into the Increment because the team assumes the tool is right.
- Eroded shared understanding: private AI use fragments what the team collectively knows about its own product.
- The Scrum Master makes these visible and lets the self-managing team remove them — naming the impediment is the first step.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-03-new-impediments-ai-teams' and l.language = 'en');

-- ---- 06-03 es-419 ------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'es-419', '06-03-new-impediments-ai-teams',
  'c0000000-0000-0000-0000-00000000a603'::uuid,
  $jta$Nuevos impedimentos en equipos aumentados con IA$jta$,
  3, 9,
  $lesson$---
lesson_id: 06-03-new-impediments-ai-teams
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Nuevos impedimentos en equipos aumentados con IA"
subtitle: Los cuellos de botella que crea la automatización, y cómo detectarlos
language: es-419
lesson_group_id: c0000000-0000-0000-0000-00000000a603
duration_minutes: 9
order_index: 3
task_codes: [6.3]
concept_slugs:
  - ai-review-bottleneck
  - automation-over-trust
  - eroded-shared-understanding-ai
prerequisites:
  - 06-02-definition-of-done-and-ai
preview: |
  Una lección de 9 minutos sobre los nuevos impedimentos que enfrentan los
  equipos aumentados con IA —cuellos de botella de revisión, exceso de
  confianza en la automatización y entendimiento compartido erosionado— y
  cómo un Scrum Master los detecta y clasifica.
authors:
  - Certidemy team
status: published
---

::hook
La IA no eliminó los impedimentos de tu equipo. Creó nuevos, y son fáciles de pasar por alto porque parecen progreso.
::

::concept title="Los impedimentos cambian de forma, no de existencia"
Un impedimento es cualquier cosa que frena a los Developers o bloquea el camino hacia el Sprint Goal. El trabajo clásico del Scrum Master es hacer visibles los impedimentos y ayudar a removerlos. La IA no termina ese trabajo: cambia cómo se ven los impedimentos.

Los impedimentos antiguos eran obvios: una dependencia bloqueada, un entorno inestable, un interesado no disponible. Los nuevos vienen disfrazados. Aparecen *como* productividad —más código, más salida, borradores más rápidos—, que es justo por lo que se cuelan ante un equipo que iguala "más" con "mejor". Esta lección te enseña a reconocer tres de ellos por su nombre, porque no puedes remover lo que no puedes ver.
::

::concept title="Impedimento 1 — El cuello de botella de revisión"
Cuando la IA genera salida más rápido de lo que el equipo puede inspeccionarla, la restricción se mueve. [El cuello de botella de revisión]{glossary="ai-review-bottleneck"} es el impedimento donde la creación ya no es el paso lento: *la revisión lo es*.

Un equipo acostumbrado a escribir código a velocidad humana de pronto tiene diez veces el volumen llegando a revisión. Los pull requests se acumulan. Los revisores hojean en vez de leer. El trabajo queda "casi terminado" porque la capacidad de inspección nunca escaló con la capacidad de generación. El Sprint se siente ocupado y estancado al mismo tiempo.

La señal: una brecha creciente entre "generado" y "realmente revisado e integrado". Si tu equipo produce mucho más de lo que puede inspeccionar, la IA no te aceleró: reubicó tu cuello de botella y lo ocultó.
::

::concept title="Impedimento 2 — Exceso de confianza en la automatización"
El [exceso de confianza en la automatización]{glossary="automation-over-trust"} es el impedimento donde la salida de IA sin verificar fluye hacia el Increment porque el equipo empezó a suponer que la herramienta tiene razón.

Se construye en silencio. La IA acierta lo suficiente como para que revisarla empiece a sentirse como una pérdida de tiempo. Las revisiones se vuelven más superficiales. "El modelo seguramente manejó los casos límite." Luego una salida confiadamente equivocada llega al release —plausible, bien formateada y rota— y como nadie la inspeccionó de verdad, llega a producción antes de que alguien lo note.

La señal: la justificación del equipo para no revisar es la confiabilidad pasada de la herramienta y no la verificación real de este trabajo. "Suele tener razón" no es inspección.
::

::callout type="pitfall"
El exceso de confianza es más peligroso que la falla obvia. Una herramienta que se equivoca el 50% del tiempo se revisa. Una herramienta que se equivoca el 5% del tiempo, con seguridad, entrena al equipo a dejar de revisar, y ese 5% llega al release.
::

::concept title="Impedimento 3 — Entendimiento compartido erosionado"
El [entendimiento compartido erosionado]{glossary="eroded-shared-understanding-ai"} es el impedimento donde la dependencia de asistencia privada de IA fragmenta lo que el equipo sabe colectivamente sobre su propio producto.

Cuando cada Developer trabaja en privado con una IA, el conocimiento que solía fluir por el pairing, la revisión y la conversación de pasillo ahora vive en historiales de chat individuales. El código existe, pero no un modelo mental compartido de *por qué* funciona. Seis semanas después, nadie puede explicar un módulo porque el razonamiento ocurrió en una conversación que solo una persona —y un modelo— vieron.

La señal: el equipo entrega código que funciona pero que no puede explicar colectivamente. La transparencia del Increment está intacta; la transparencia del *entendimiento* desapareció, y eso es lo que el equipo necesita para inspeccionar y adaptarse.
::

::interactive widget="scenario-mcq" id="ai-output-flooding-the-sprint" concept_slugs="ai-review-bottleneck,automation-over-trust"
{
  "scenario_title": "El Sprint se está ahogando en salida de IA",
  "steps": [
    {
      "id": "step-1",
      "situation": "Mitad del Sprint. Tu equipo adoptó un agente de IA hace dos semanas. Los pull requests generados se acumulan mucho más rápido de lo que alguien los revisa, y un Developer acaba de decir: 'Fusionemos los de la IA y ya, casi siempre tiene razón y si no nunca nos vamos a poner al día.'",
      "question": "¿Cuál es tu primer movimiento como Scrum Master?",
      "options": [
        { "id": "a", "text": "Estar de acuerdo: fusionar mantiene el Sprint avanzando y la IA es confiable.", "next": "step-2a" },
        { "id": "b", "text": "Nombrar el impedimento ante el equipo: la generación ahora supera a la revisión, y el exceso de confianza se está infiltrando.", "next": "step-2b" },
        { "id": "c", "text": "Revisar todo tú mismo en silencio para vaciar la cola.", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "El equipo fusiona la cola sin revisar. Dos días después, un cambio de IA confiadamente equivocado causa un incidente en producción que nadie detectó.",
      "question": "¿Qué haces ahora?",
      "options": [
        { "id": "a", "text": "Llevarlo a la Retrospective: el cuello de botella de revisión y el exceso de confianza son impedimentos para sacar a la luz y abordar como equipo.", "next": "end-good" },
        { "id": "b", "text": "Decirle al equipo que tenga más cuidado la próxima vez y seguir adelante.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2b",
      "situation": "El equipo se detiene. Nombrarlo cala: 'Entonces la IA no nos aceleró: movió nuestro cuello de botella a la revisión, y empezamos a confiar en ella para evitar la acumulación.'",
      "question": "¿Qué facilitas a continuación?",
      "options": [
        { "id": "a", "text": "Dejar que el equipo decida cómo reequilibrar —reducir la generación, fortalecer la revisión o ambas— e inspeccionar el resultado el próximo Sprint.", "next": "end-good" },
        { "id": "b", "text": "Imponer que revisen cada línea, contigo como regla.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "Te conviertes en el único revisor. La cola se vacía por una semana, luego te conviertes en el cuello de botella y te agotas. El equipo nunca se apropió del problema.",
      "question": "¿Qué haces ahora?",
      "options": [
        { "id": "a", "text": "Devolverlo al equipo como un impedimento compartido a resolver mediante la autogestión.", "next": "end-good" },
        { "id": "b", "text": "Seguir absorbiendo la carga de revisión tú mismo.", "next": "end-weak" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2b:a"],
  "explanation": "El trabajo del Scrum Master es hacer visible el impedimento y dejar que el equipo autogestionado lo resuelva, no fusionar trabajo sin revisar (exceso de confianza) ni convertirse en el único revisor (lo que oculta el impedimento y crea uno nuevo). Nombrar el cuello de botella de revisión y el exceso de confianza, y luego facilitar la solución del propio equipo, es la postura de coaching."
}
::

::callout type="pro-tip"
Agrega una señal a la conciencia de tu equipo, no un ranking: la brecha entre el trabajo generado y el trabajo realmente revisado e integrado. Cuando esa brecha crece, se está formando el cuello de botella de revisión. Es una señal para inspeccionar, no una meta para optimizar.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "El agente de IA de un equipo produce mucho más código del que el equipo puede revisar, así que los pull requests se acumulan sin revisar. ¿Qué impedimento es este?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Exceso de confianza en la automatización" },
      { "id": "b", "text": "El cuello de botella de revisión" },
      { "id": "c", "text": "Entendimiento compartido erosionado" },
      { "id": "d", "text": "Una dependencia bloqueada" }
    ],
    "correct": ["b"],
    "explanation": "Cuando la generación supera a la inspección, la restricción se mueve a la revisión: el cuello de botella de revisión. La creación ya no es el paso lento.",
    "concept_slugs": ["ai-review-bottleneck"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "Un equipo deja de revisar cuidadosamente la salida de IA porque 'el modelo casi siempre tiene razón'. ¿Qué impedimento se está formando?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "El cuello de botella de revisión" },
      { "id": "b", "text": "Exceso de confianza en la automatización" },
      { "id": "c", "text": "Entendimiento compartido erosionado" },
      { "id": "d", "text": "Un interesado no disponible" }
    ],
    "correct": ["b"],
    "explanation": "Justificar la inspección omitida con la confiabilidad pasada de la herramienta —en vez de verificar este trabajo— es exceso de confianza en la automatización.",
    "concept_slugs": ["automation-over-trust"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Un equipo entrega código que funciona cada Sprint pero cada vez puede explicar menos colectivamente cómo funcionan sus propios módulos, porque cada Developer trabaja en privado con una IA. ¿Qué impedimento es este?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Entendimiento compartido erosionado" },
      { "id": "b", "text": "El cuello de botella de revisión" },
      { "id": "c", "text": "Exceso de confianza en la automatización" },
      { "id": "d", "text": "Un entorno de pruebas inestable" }
    ],
    "correct": ["a"],
    "explanation": "Cuando el razonamiento vive en conversaciones privadas con IA en vez de en la revisión y el pairing compartidos, el equipo pierde su modelo mental colectivo: entendimiento compartido erosionado.",
    "concept_slugs": ["eroded-shared-understanding-ai"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "¿Por qué estos impedimentos de aumento con IA son especialmente fáciles de pasar por alto para un Scrum Master?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Solo aparecen en equipos remotos" },
      { "id": "b", "text": "Se disfrazan de productividad —más salida, borradores más rápidos—, así que un equipo que iguala 'más' con 'mejor' los pasa por alto" },
      { "id": "c", "text": "La Guía de Scrum no menciona los impedimentos" },
      { "id": "d", "text": "Solo afectan al Product Owner" }
    ],
    "correct": ["b"],
    "explanation": "A diferencia de una dependencia bloqueada, estos impedimentos parecen progreso. Un equipo que trata la salida bruta como éxito pasará por alto la brecha de revisión creciente, el exceso de confianza y el entendimiento compartido perdido.",
    "concept_slugs": ["ai-review-bottleneck", "automation-over-trust"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  }
]
::

::summary
- La IA no elimina los impedimentos; crea nuevos que se disfrazan de productividad.
- El cuello de botella de revisión: la generación supera a la inspección, así que la revisión —no la creación— se vuelve la restricción.
- Exceso de confianza en la automatización: la salida de IA sin verificar fluye hacia el Increment porque el equipo supone que la herramienta tiene razón.
- Entendimiento compartido erosionado: el uso privado de IA fragmenta lo que el equipo sabe colectivamente sobre su propio producto.
- El Scrum Master los hace visibles y deja que el equipo autogestionado los remueva: nombrar el impedimento es el primer paso.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-03-new-impediments-ai-teams' and l.language = 'es-419');

-- ---- 06-03 pt-BR -------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'pt-BR', '06-03-new-impediments-ai-teams',
  'c0000000-0000-0000-0000-00000000a603'::uuid,
  $jta$Novos impedimentos em times aumentados por IA$jta$,
  3, 9,
  $lesson$---
lesson_id: 06-03-new-impediments-ai-teams
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Novos impedimentos em times aumentados por IA"
subtitle: Os gargalos que a automação cria — e como detectá-los
language: pt-BR
lesson_group_id: c0000000-0000-0000-0000-00000000a603
duration_minutes: 9
order_index: 3
task_codes: [6.3]
concept_slugs:
  - ai-review-bottleneck
  - automation-over-trust
  - eroded-shared-understanding-ai
prerequisites:
  - 06-02-definition-of-done-and-ai
preview: |
  Uma lição de 9 minutos sobre os novos impedimentos que os times aumentados
  por IA enfrentam —gargalos de revisão, excesso de confiança na automação e
  entendimento compartilhado erodido— e como um Scrum Master os detecta e
  classifica.
authors:
  - Certidemy team
status: published
---

::hook
A IA não removeu os impedimentos do seu time. Ela criou novos, e eles são fáceis de não perceber porque parecem progresso.
::

::concept title="Os impedimentos mudam de forma, não de existência"
Um impedimento é qualquer coisa que atrasa os Developers ou bloqueia o caminho até o Sprint Goal. O trabalho clássico do Scrum Master é tornar os impedimentos visíveis e ajudar a removê-los. A IA não acaba com esse trabalho: ela muda como os impedimentos se parecem.

Os impedimentos antigos eram óbvios: uma dependência bloqueada, um ambiente instável, um stakeholder indisponível. Os novos vêm disfarçados. Eles aparecem *como* produtividade —mais código, mais saída, rascunhos mais rápidos—, que é justamente por que passam despercebidos por um time que iguala "mais" a "melhor". Esta lição ensina você a reconhecer três deles pelo nome, porque você não pode remover o que não consegue ver.
::

::concept title="Impedimento 1 — O gargalo de revisão"
Quando a IA gera saída mais rápido do que o time consegue inspecioná-la, a restrição se move. [O gargalo de revisão]{glossary="ai-review-bottleneck"} é o impedimento em que a criação não é mais o passo lento: *a revisão é*.

Um time acostumado a escrever código em velocidade humana de repente tem dez vezes o volume chegando para revisão. Os pull requests se acumulam. Os revisores passam o olho em vez de ler. O trabalho fica "quase pronto" porque a capacidade de inspeção nunca escalou junto com a capacidade de geração. O Sprint parece ocupado e travado ao mesmo tempo.

O sinal: uma lacuna crescente entre "gerado" e "de fato revisado e integrado". Se o seu time produz muito mais do que consegue inspecionar, a IA não te acelerou: ela realocou o seu gargalo e o escondeu.
::

::concept title="Impedimento 2 — Excesso de confiança na automação"
O [excesso de confiança na automação]{glossary="automation-over-trust"} é o impedimento em que a saída de IA não verificada flui para o Increment porque o time começou a supor que a ferramenta está certa.

Ele se constrói em silêncio. A IA acerta o suficiente para que verificá-la comece a parecer perda de tempo. As revisões ficam mais rasas. "O modelo provavelmente cuidou dos casos extremos." Então uma saída confiantemente errada vai para o release —plausível, bem formatada e quebrada— e como ninguém a inspecionou de verdade, ela chega à produção antes de alguém perceber.

O sinal: a justificativa do time para não verificar é a confiabilidade passada da ferramenta, e não a verificação real deste trabalho. "Geralmente está certo" não é inspeção.
::

::callout type="pitfall"
O excesso de confiança é mais perigoso que a falha óbvia. Uma ferramenta que erra 50% das vezes é verificada. Uma ferramenta que erra 5% das vezes, com confiança, treina o time a parar de verificar, e esses 5% vão para o release.
::

::concept title="Impedimento 3 — Entendimento compartilhado erodido"
O [entendimento compartilhado erodido]{glossary="eroded-shared-understanding-ai"} é o impedimento em que a dependência de assistência privada de IA fragmenta o que o time sabe coletivamente sobre o próprio produto.

Quando cada Developer trabalha em particular com uma IA, o conhecimento que costumava fluir pelo pairing, pela revisão e pela conversa de corredor agora vive em históricos de chat individuais. O código existe, mas não um modelo mental compartilhado de *por que* ele funciona. Seis semanas depois, ninguém consegue explicar um módulo porque o raciocínio aconteceu em uma conversa que só uma pessoa —e um modelo— viram.

O sinal: o time entrega código que funciona mas que não consegue explicar coletivamente. A transparência do Increment está intacta; a transparência do *entendimento* desapareceu, e é disso que o time precisa para inspecionar e adaptar.
::

::interactive widget="scenario-mcq" id="ai-output-flooding-the-sprint" concept_slugs="ai-review-bottleneck,automation-over-trust"
{
  "scenario_title": "O Sprint está se afogando em saída de IA",
  "steps": [
    {
      "id": "step-1",
      "situation": "Meio do Sprint. Seu time adotou um agente de IA há duas semanas. Os pull requests gerados se acumulam muito mais rápido do que alguém os revisa, e um Developer acabou de dizer: 'Vamos só fazer o merge dos da IA, geralmente está certo e senão a gente nunca vai colocar em dia.'",
      "question": "Qual é o seu primeiro movimento como Scrum Master?",
      "options": [
        { "id": "a", "text": "Concordar: fazer o merge mantém o Sprint avançando e a IA é confiável.", "next": "step-2a" },
        { "id": "b", "text": "Nomear o impedimento para o time: a geração agora supera a revisão, e o excesso de confiança está se infiltrando.", "next": "step-2b" },
        { "id": "c", "text": "Revisar tudo você mesmo em silêncio para esvaziar a fila.", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "O time faz o merge da fila sem revisar. Dois dias depois, uma mudança de IA confiantemente errada causa um incidente em produção que ninguém detectou.",
      "question": "E agora?",
      "options": [
        { "id": "a", "text": "Levar à Retrospective: o gargalo de revisão e o excesso de confiança são impedimentos para trazer à tona e tratar como time.", "next": "end-good" },
        { "id": "b", "text": "Dizer ao time para ter mais cuidado da próxima vez e seguir em frente.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2b",
      "situation": "O time para. Nomear isso faz sentido: 'Então a IA não nos acelerou: ela moveu nosso gargalo para a revisão, e começamos a confiar nela para evitar o acúmulo.'",
      "question": "O que você facilita em seguida?",
      "options": [
        { "id": "a", "text": "Deixar o time decidir como reequilibrar —reduzir a geração, fortalecer a revisão ou ambos— e inspecionar o resultado no próximo Sprint.", "next": "end-good" },
        { "id": "b", "text": "Impor que revisem cada linha, com você como regra.", "next": "end-weak" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "Você se torna o único revisor. A fila esvazia por uma semana, depois você vira o gargalo e se esgota. O time nunca se apropriou do problema.",
      "question": "E agora?",
      "options": [
        { "id": "a", "text": "Devolver ao time como um impedimento compartilhado a resolver por meio da autogestão.", "next": "end-good" },
        { "id": "b", "text": "Continuar absorvendo a carga de revisão você mesmo.", "next": "end-weak" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2b:a"],
  "explanation": "O trabalho do Scrum Master é tornar o impedimento visível e deixar o time autogerenciável resolvê-lo, não fazer o merge de trabalho não revisado (excesso de confiança) nem se tornar o único revisor (o que esconde o impedimento e cria um novo). Nomear o gargalo de revisão e o excesso de confiança, e então facilitar a solução do próprio time, é a postura de coaching."
}
::

::callout type="pro-tip"
Adicione um sinal à consciência do seu time, não um ranking: a lacuna entre o trabalho gerado e o trabalho de fato revisado e integrado. Quando essa lacuna cresce, o gargalo de revisão está se formando. É um sinal para inspecionar, não uma meta para otimizar.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "O agente de IA de um time produz muito mais código do que o time consegue revisar, então os pull requests se acumulam sem revisão. Qual impedimento é este?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Excesso de confiança na automação" },
      { "id": "b", "text": "O gargalo de revisão" },
      { "id": "c", "text": "Entendimento compartilhado erodido" },
      { "id": "d", "text": "Uma dependência bloqueada" }
    ],
    "correct": ["b"],
    "explanation": "Quando a geração supera a inspeção, a restrição se move para a revisão: o gargalo de revisão. A criação não é mais o passo lento.",
    "concept_slugs": ["ai-review-bottleneck"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "Um time para de revisar cuidadosamente a saída de IA porque 'o modelo geralmente está certo'. Qual impedimento está se formando?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "O gargalo de revisão" },
      { "id": "b", "text": "Excesso de confiança na automação" },
      { "id": "c", "text": "Entendimento compartilhado erodido" },
      { "id": "d", "text": "Um stakeholder indisponível" }
    ],
    "correct": ["b"],
    "explanation": "Justificar a inspeção pulada com a confiabilidade passada da ferramenta —em vez de verificar este trabalho— é excesso de confiança na automação.",
    "concept_slugs": ["automation-over-trust"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Um time entrega código que funciona a cada Sprint mas cada vez consegue explicar menos coletivamente como os próprios módulos funcionam, porque cada Developer trabalha em particular com uma IA. Qual impedimento é este?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Entendimento compartilhado erodido" },
      { "id": "b", "text": "O gargalo de revisão" },
      { "id": "c", "text": "Excesso de confiança na automação" },
      { "id": "d", "text": "Um ambiente de testes instável" }
    ],
    "correct": ["a"],
    "explanation": "Quando o raciocínio vive em conversas privadas com IA em vez de na revisão e no pairing compartilhados, o time perde seu modelo mental coletivo: entendimento compartilhado erodido.",
    "concept_slugs": ["eroded-shared-understanding-ai"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Por que esses impedimentos de aumento por IA são especialmente fáceis de um Scrum Master não perceber?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Eles só aparecem em times remotos" },
      { "id": "b", "text": "Eles se disfarçam de produtividade —mais saída, rascunhos mais rápidos—, então um time que iguala 'mais' a 'melhor' os ignora" },
      { "id": "c", "text": "O Guia do Scrum não menciona impedimentos" },
      { "id": "d", "text": "Eles só afetam o Product Owner" }
    ],
    "correct": ["b"],
    "explanation": "Diferente de uma dependência bloqueada, esses impedimentos parecem progresso. Um time que trata a saída bruta como sucesso vai ignorar a lacuna de revisão crescente, o excesso de confiança e o entendimento compartilhado perdido.",
    "concept_slugs": ["ai-review-bottleneck", "automation-over-trust"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  }
]
::

::summary
- A IA não remove os impedimentos; ela cria novos que se disfarçam de produtividade.
- O gargalo de revisão: a geração supera a inspeção, então a revisão —não a criação— vira a restrição.
- Excesso de confiança na automação: a saída de IA não verificada flui para o Increment porque o time supõe que a ferramenta está certa.
- Entendimento compartilhado erodido: o uso privado de IA fragmenta o que o time sabe coletivamente sobre o próprio produto.
- O Scrum Master os torna visíveis e deixa o time autogerenciável removê-los: nomear o impedimento é o primeiro passo.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-03-new-impediments-ai-teams' and l.language = 'pt-BR');

-- ---- VERIFICATION (expect 3 rows) --------------------------------------------
-- select language, slug, title from public.lessons
--  where slug = '06-03-new-impediments-ai-teams' order by language;
