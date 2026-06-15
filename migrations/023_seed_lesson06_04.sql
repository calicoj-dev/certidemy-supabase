-- 023_seed_lesson06_04.sql
-- =============================================================================
-- Lesson 06-04 "Empiricism Under Acceleration: Inspection When AI Moves Fast"
-- (tasks 6.4 + 6.6; concepts empiricism-under-acceleration, sm-safeguards-
-- inspection, ai-signal-informs-inspection, metrics-inform-not-decide)
-- in en + es-419 + pt-BR. Module 6, order_index 4. New widget: toggle-and-observe.
-- Dollar-quoted ($lesson$ body, $jta$ title); idempotent on (slug, language).
-- =============================================================================

-- ---- 06-04 en ----------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'en', '06-04-empiricism-under-acceleration',
  'c0000000-0000-0000-0000-00000000a604'::uuid,
  $jta$Empiricism Under Acceleration: Inspection When AI Moves Fast$jta$,
  4, 10,
  $lesson$---
lesson_id: 06-04-empiricism-under-acceleration
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Empiricism Under Acceleration: Inspection When AI Moves Fast"
subtitle: Speed is not the goal — inspect-and-adapt is
language: en
lesson_group_id: c0000000-0000-0000-0000-00000000a604
duration_minutes: 10
order_index: 4
task_codes: [6.4, 6.6]
concept_slugs:
  - empiricism-under-acceleration
  - sm-safeguards-inspection
  - ai-signal-informs-inspection
  - metrics-inform-not-decide
prerequisites:
  - 06-03-new-impediments-ai-teams
preview: |
  A 10-minute lesson on protecting empiricism when AI accelerates output —
  why inspection capacity is the real constraint, how the Scrum Master
  safeguards inspect-and-adapt, and how to use AI-generated signal as input
  without letting metrics make the team's decisions.
authors:
  - Certidemy team
status: published
---

::hook
AI can make your team produce ten times faster. It cannot make your team inspect ten times faster. That gap is where empiricism breaks.
::

::concept title="Empiricism Has a Speed Limit, and It Is Human"
Scrum is built on empiricism: the team works in short cycles, **inspects** what it produced, and **adapts** based on what it learned. Transparency makes the work visible; inspection examines it; adaptation changes course. Take away any one pillar and the loop stops being empirical.

Here is the catch with AI. [Empiricism depends on the team's capacity to inspect and adapt]{glossary="empiricism-under-acceleration"} — and that capacity is human-paced. A model can generate a Sprint's worth of output in an afternoon, but the team's ability to genuinely inspect that output, understand it, and decide what to change has not sped up at all.

When generation outruns inspection, the loop quietly inverts. The team produces faster than it can learn. Transparency floods in faster than anyone can examine it. The Sprint looks productive and stops being empirical — because the inspect-and-adapt that makes Scrum *work* got outrun.
::

::callout type="exam-watch"
The exam framing: more output is not more empiricism. Empiricism is measured by the team's ability to inspect and adapt, not by how much it produces. AI that increases output without increasing inspection capacity does not strengthen Scrum — it strains it.
::

::interactive widget="toggle-and-observe" id="empiricism-under-ai-load" concept_slugs="empiricism-under-acceleration,sm-safeguards-inspection"
{
  "scenario_title": "Empiricism under AI acceleration",
  "intro": "A team has adopted an AI agent and output has surged. Toggle each pillar on to see what genuine inspect-and-adapt requires — and what breaks when output outruns it.",
  "toggles": [
    {
      "id": "transparency",
      "label": "Transparency keeps pace",
      "off_consequence": "AI output floods in faster than it can be made visible and honest; reviewers see volume, not understanding.",
      "on_consequence": "The work — including what AI produced — stays visible and inspectable as it arrives."
    },
    {
      "id": "inspection",
      "label": "Inspection capacity scales",
      "off_consequence": "Generation outruns review; the team ships work no one truly examined.",
      "on_consequence": "The team can genuinely examine what was produced before it counts as done.",
      "depends_on": ["transparency"]
    },
    {
      "id": "adaptation",
      "label": "Adaptation still happens",
      "off_consequence": "Even with output reviewed, nothing changes Sprint to Sprint; the team produces but never learns.",
      "on_consequence": "The team changes course based on what inspection revealed — the loop closes.",
      "depends_on": ["inspection"]
    }
  ],
  "reflection_prompt": "With all three on under heavy AI output, what has the Scrum Master actually protected?",
  "reflection_answer": "Not the speed of production — the team's capacity to inspect and adapt. Empiricism survives acceleration only when inspection and adaptation keep pace with generation, and protecting that balance is the Scrum Master's job."
}
::

::concept title="The Scrum Master Safeguards Inspect-and-Adapt"
When output accelerates, there is pressure to treat raw volume as success. [The Scrum Master protects the cadence of inspection and adaptation instead]{glossary="sm-safeguards-inspection"}.

Concretely, that means protecting the events where inspection happens — the Sprint Review and Retrospective do not get shortened because "we shipped so much." It means helping the team see when generation has outrun review, and supporting their decision to slow generation rather than skip inspection. It means defending the idea that an Increment the team has not genuinely inspected is not really Done, no matter how much of it there is.

This is not anti-AI. A team that uses AI *and* keeps inspection in pace gets the best of both: more capacity and intact empiricism. The Scrum Master's role is to make sure the second half of that sentence never gets dropped.
::

::concept title="AI as Signal: Inform Inspection, Do Not Replace It"
AI is not only a source of output — it is a source of *signal*. It can surface flow metrics, cluster recurring impediments, and flag defect patterns the team might not see on its own. [Used well, AI-generated signal is an input to inspection]{glossary="ai-signal-informs-inspection"} — useful raw material for a Sprint Review or Retrospective.

But signal is not a decision. [Metrics inform the team; they do not decide for it]{glossary="metrics-inform-not-decide"}. AI might show that a certain kind of work always slips, but *why* it slips, and *what to do about it*, is the team's judgment — formed by people who understand the context the metric cannot see.

The failure mode is letting the dashboard run the Retrospective: "the metric says X, so we do Y," with no human interpretation in between. AI surfaces the pattern. The team decides what it means and what changes. Keep that order and AI sharpens your empiricism; reverse it and the team stops thinking.
::

::callout type="pro-tip"
A clean rule for AI signal in events: let it set the agenda, never the conclusion. The metric can decide *what the team talks about*. Only the team decides *what to do*.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "An AI agent makes a team produce far more output per Sprint, but inspection capacity stays the same. What is the effect on empiricism?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Empiricism strengthens, because more output means more to learn from" },
      { "id": "b", "text": "Empiricism strains, because the team produces faster than it can inspect and adapt" },
      { "id": "c", "text": "Empiricism is unaffected by output volume" },
      { "id": "d", "text": "Empiricism improves automatically once AI is involved" }
    ],
    "correct": ["b"],
    "explanation": "Empiricism depends on inspect-and-adapt, which is human-paced. When generation outruns inspection, the team produces without genuinely learning — empiricism strains.",
    "concept_slugs": ["empiricism-under-acceleration"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "Output has surged with AI, and the team proposes cutting the Sprint Retrospective short 'because we shipped so much.' What should the Scrum Master do?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Agree — high output earns a shorter Retrospective" },
      { "id": "b", "text": "Protect the Retrospective; high output is exactly when inspection and adaptation matter most" },
      { "id": "c", "text": "Cancel the Retrospective and rely on the AI's metrics instead" },
      { "id": "d", "text": "Shorten it and add the time to generation" }
    ],
    "correct": ["b"],
    "explanation": "The Scrum Master safeguards the cadence of inspect-and-adapt. Surging output is a reason to protect inspection events, not trim them.",
    "concept_slugs": ["sm-safeguards-inspection"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "An AI tool reports that a category of work consistently slips its estimate. How should the team use this in the Retrospective?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Automatically apply the fix the tool recommends" },
      { "id": "b", "text": "Treat it as a signal to inspect — the team interprets why it slips and decides what to change" },
      { "id": "c", "text": "Ignore it, since only human observation counts" },
      { "id": "d", "text": "Let the metric set the team's next Sprint Goal" }
    ],
    "correct": ["b"],
    "explanation": "AI-generated signal is input to inspection, not a decision. The metric surfaces the pattern; the team interprets the cause and decides the change.",
    "concept_slugs": ["ai-signal-informs-inspection", "metrics-inform-not-decide"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "What is the right relationship between AI metrics and the team's decisions in Scrum events?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Metrics make the decisions; the team executes them" },
      { "id": "b", "text": "Metrics set the agenda and inform the team, but the team interprets and decides" },
      { "id": "c", "text": "Metrics replace the need for a Retrospective" },
      { "id": "d", "text": "Metrics should be ignored to keep judgment human" }
    ],
    "correct": ["b"],
    "explanation": "Let AI signal decide what the team talks about, never what it does. Metrics inform; people interpret and decide — that keeps the team thinking and empiricism intact.",
    "concept_slugs": ["metrics-inform-not-decide"],
    "bloom_level": "2_understand",
    "difficulty": 2
  }
]
::

::summary
- Empiricism depends on inspect-and-adapt, which is human-paced; AI can outrun it by generating faster than the team can learn.
- More output is not more empiricism — empiricism is measured by inspection and adaptation, not volume.
- The Scrum Master safeguards inspect-and-adapt: protect the inspection events and refuse to call un-inspected work Done.
- AI-generated signal (flow, impediments, defects) is valuable input to inspection in Reviews and Retrospectives.
- Metrics inform; the team interprets and decides — AI sets the agenda, never the conclusion.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-04-empiricism-under-acceleration' and l.language = 'en');

-- ---- 06-04 es-419 ------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'es-419', '06-04-empiricism-under-acceleration',
  'c0000000-0000-0000-0000-00000000a604'::uuid,
  $jta$Empirismo bajo aceleración: la inspección cuando la IA va rápido$jta$,
  4, 10,
  $lesson$---
lesson_id: 06-04-empiricism-under-acceleration
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Empirismo bajo aceleración: la inspección cuando la IA va rápido"
subtitle: La velocidad no es la meta — inspeccionar y adaptar lo es
language: es-419
lesson_group_id: c0000000-0000-0000-0000-00000000a604
duration_minutes: 10
order_index: 4
task_codes: [6.4, 6.6]
concept_slugs:
  - empiricism-under-acceleration
  - sm-safeguards-inspection
  - ai-signal-informs-inspection
  - metrics-inform-not-decide
prerequisites:
  - 06-03-new-impediments-ai-teams
preview: |
  Una lección de 10 minutos sobre proteger el empirismo cuando la IA acelera
  la salida: por qué la capacidad de inspección es la verdadera restricción,
  cómo el Scrum Master protege el inspeccionar y adaptar, y cómo usar la señal
  generada por IA como insumo sin dejar que las métricas tomen las decisiones.
authors:
  - Certidemy team
status: published
---

::hook
La IA puede hacer que tu equipo produzca diez veces más rápido. No puede hacer que tu equipo inspeccione diez veces más rápido. Esa brecha es donde se rompe el empirismo.
::

::concept title="El empirismo tiene un límite de velocidad, y es humano"
Scrum se construye sobre el empirismo: el equipo trabaja en ciclos cortos, **inspecciona** lo que produjo y **adapta** según lo que aprendió. La transparencia hace visible el trabajo; la inspección lo examina; la adaptación cambia el rumbo. Quita cualquiera de los tres pilares y el ciclo deja de ser empírico.

Aquí está el problema con la IA. [El empirismo depende de la capacidad del equipo para inspeccionar y adaptarse]{glossary="empiricism-under-acceleration"}, y esa capacidad va a ritmo humano. Un modelo puede generar el trabajo de un Sprint en una tarde, pero la capacidad del equipo para inspeccionar de verdad esa salida, entenderla y decidir qué cambiar no se aceleró en absoluto.

Cuando la generación supera a la inspección, el ciclo se invierte en silencio. El equipo produce más rápido de lo que puede aprender. La transparencia llega más rápido de lo que alguien puede examinar. El Sprint parece productivo y deja de ser empírico, porque el inspeccionar y adaptar que hace que Scrum *funcione* quedó atrás.
::

::callout type="exam-watch"
El enfoque del examen: más salida no es más empirismo. El empirismo se mide por la capacidad del equipo para inspeccionar y adaptarse, no por cuánto produce. La IA que aumenta la salida sin aumentar la capacidad de inspección no fortalece a Scrum: lo tensiona.
::

::interactive widget="toggle-and-observe" id="empiricism-under-ai-load" concept_slugs="empiricism-under-acceleration,sm-safeguards-inspection"
{
  "scenario_title": "El empirismo bajo aceleración de IA",
  "intro": "Un equipo adoptó un agente de IA y la salida se disparó. Activa cada pilar para ver qué exige un verdadero inspeccionar y adaptar, y qué se rompe cuando la salida supera a la inspección.",
  "toggles": [
    {
      "id": "transparency",
      "label": "La transparencia mantiene el ritmo",
      "off_consequence": "La salida de IA llega más rápido de lo que puede hacerse visible y honesta; los revisores ven volumen, no entendimiento.",
      "on_consequence": "El trabajo —incluido lo que produjo la IA— se mantiene visible e inspeccionable a medida que llega."
    },
    {
      "id": "inspection",
      "label": "La capacidad de inspección escala",
      "off_consequence": "La generación supera a la revisión; el equipo entrega trabajo que nadie examinó de verdad.",
      "on_consequence": "El equipo puede examinar de verdad lo que se produjo antes de que cuente como terminado.",
      "depends_on": ["transparency"]
    },
    {
      "id": "adaptation",
      "label": "La adaptación sigue ocurriendo",
      "off_consequence": "Incluso con el trabajo revisado, nada cambia de un Sprint a otro; el equipo produce pero nunca aprende.",
      "on_consequence": "El equipo cambia el rumbo según lo que reveló la inspección: el ciclo se cierra.",
      "depends_on": ["inspection"]
    }
  ],
  "reflection_prompt": "Con los tres activados bajo mucha salida de IA, ¿qué protegió realmente el Scrum Master?",
  "reflection_answer": "No la velocidad de producción, sino la capacidad del equipo para inspeccionar y adaptarse. El empirismo sobrevive a la aceleración solo cuando la inspección y la adaptación mantienen el ritmo de la generación, y proteger ese equilibrio es el trabajo del Scrum Master."
}
::

::concept title="El Scrum Master protege el inspeccionar y adaptar"
Cuando la salida acelera, hay presión para tratar el volumen bruto como éxito. [El Scrum Master protege en cambio la cadencia de inspección y adaptación]{glossary="sm-safeguards-inspection"}.

En concreto, eso significa proteger los eventos donde ocurre la inspección: el Sprint Review y la Retrospective no se acortan porque "entregamos mucho". Significa ayudar al equipo a ver cuándo la generación superó a la revisión, y apoyar su decisión de reducir la generación en vez de saltarse la inspección. Significa defender la idea de que un Increment que el equipo no inspeccionó de verdad no está realmente Done, sin importar cuánto haya.

Esto no es anti-IA. Un equipo que usa IA *y* mantiene la inspección al ritmo obtiene lo mejor de ambos: más capacidad y empirismo intacto. El rol del Scrum Master es asegurarse de que la segunda mitad de esa frase nunca se descarte.
::

::concept title="La IA como señal: informar la inspección, no reemplazarla"
La IA no es solo una fuente de salida: es una fuente de *señal*. Puede mostrar métricas de flujo, agrupar impedimentos recurrentes y marcar patrones de defectos que el equipo quizá no vea por su cuenta. [Bien usada, la señal generada por IA es un insumo para la inspección]{glossary="ai-signal-informs-inspection"}: materia prima útil para un Sprint Review o una Retrospective.

Pero la señal no es una decisión. [Las métricas informan al equipo; no deciden por él]{glossary="metrics-inform-not-decide"}. La IA puede mostrar que cierto tipo de trabajo siempre se retrasa, pero *por qué* se retrasa y *qué hacer al respecto* es el juicio del equipo, formado por personas que entienden el contexto que la métrica no puede ver.

El modo de falla es dejar que el tablero dirija la Retrospective: "la métrica dice X, así que hacemos Y", sin interpretación humana en medio. La IA muestra el patrón. El equipo decide qué significa y qué cambia. Mantén ese orden y la IA agudiza tu empirismo; inviértelo y el equipo deja de pensar.
::

::callout type="pro-tip"
Una regla limpia para la señal de IA en los eventos: deja que fije la agenda, nunca la conclusión. La métrica puede decidir *de qué habla el equipo*. Solo el equipo decide *qué hacer*.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Un agente de IA hace que un equipo produzca mucha más salida por Sprint, pero la capacidad de inspección sigue igual. ¿Cuál es el efecto sobre el empirismo?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "El empirismo se fortalece, porque más salida significa más de qué aprender" },
      { "id": "b", "text": "El empirismo se tensiona, porque el equipo produce más rápido de lo que puede inspeccionar y adaptarse" },
      { "id": "c", "text": "El empirismo no se ve afectado por el volumen de salida" },
      { "id": "d", "text": "El empirismo mejora automáticamente una vez que hay IA" }
    ],
    "correct": ["b"],
    "explanation": "El empirismo depende del inspeccionar y adaptar, que va a ritmo humano. Cuando la generación supera a la inspección, el equipo produce sin aprender de verdad: el empirismo se tensiona.",
    "concept_slugs": ["empiricism-under-acceleration"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "La salida se disparó con la IA, y el equipo propone acortar la Retrospective 'porque entregamos mucho'. ¿Qué debería hacer el Scrum Master?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Estar de acuerdo: la salida alta merece una Retrospective más corta" },
      { "id": "b", "text": "Proteger la Retrospective; la salida alta es justo cuando la inspección y la adaptación más importan" },
      { "id": "c", "text": "Cancelar la Retrospective y confiar en las métricas de la IA" },
      { "id": "d", "text": "Acortarla y sumar el tiempo a la generación" }
    ],
    "correct": ["b"],
    "explanation": "El Scrum Master protege la cadencia de inspeccionar y adaptar. La salida disparada es una razón para proteger los eventos de inspección, no para recortarlos.",
    "concept_slugs": ["sm-safeguards-inspection"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Una herramienta de IA informa que una categoría de trabajo se retrasa de forma consistente respecto a su estimación. ¿Cómo debería usar el equipo esto en la Retrospective?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Aplicar automáticamente la solución que recomienda la herramienta" },
      { "id": "b", "text": "Tratarlo como una señal para inspeccionar: el equipo interpreta por qué se retrasa y decide qué cambiar" },
      { "id": "c", "text": "Ignorarlo, ya que solo cuenta la observación humana" },
      { "id": "d", "text": "Dejar que la métrica fije el próximo Sprint Goal del equipo" }
    ],
    "correct": ["b"],
    "explanation": "La señal generada por IA es insumo para la inspección, no una decisión. La métrica muestra el patrón; el equipo interpreta la causa y decide el cambio.",
    "concept_slugs": ["ai-signal-informs-inspection", "metrics-inform-not-decide"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "¿Cuál es la relación correcta entre las métricas de IA y las decisiones del equipo en los eventos de Scrum?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Las métricas toman las decisiones; el equipo las ejecuta" },
      { "id": "b", "text": "Las métricas fijan la agenda e informan al equipo, pero el equipo interpreta y decide" },
      { "id": "c", "text": "Las métricas reemplazan la necesidad de una Retrospective" },
      { "id": "d", "text": "Las métricas deberían ignorarse para mantener humano el juicio" }
    ],
    "correct": ["b"],
    "explanation": "Deja que la señal de IA decida de qué habla el equipo, nunca qué hace. Las métricas informan; las personas interpretan y deciden, y eso mantiene al equipo pensando y al empirismo intacto.",
    "concept_slugs": ["metrics-inform-not-decide"],
    "bloom_level": "2_understand",
    "difficulty": 2
  }
]
::

::summary
- El empirismo depende del inspeccionar y adaptar, que va a ritmo humano; la IA puede superarlo generando más rápido de lo que el equipo puede aprender.
- Más salida no es más empirismo: el empirismo se mide por la inspección y la adaptación, no por el volumen.
- El Scrum Master protege el inspeccionar y adaptar: proteger los eventos de inspección y negarse a llamar Done al trabajo no inspeccionado.
- La señal generada por IA (flujo, impedimentos, defectos) es un insumo valioso para la inspección en los Reviews y las Retrospectives.
- Las métricas informan; el equipo interpreta y decide: la IA fija la agenda, nunca la conclusión.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-04-empiricism-under-acceleration' and l.language = 'es-419');

-- ---- 06-04 pt-BR -------------------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'pt-BR', '06-04-empiricism-under-acceleration',
  'c0000000-0000-0000-0000-00000000a604'::uuid,
  $jta$Empirismo sob aceleração: a inspeção quando a IA vai rápido$jta$,
  4, 10,
  $lesson$---
lesson_id: 06-04-empiricism-under-acceleration
module_slug: ai-augmented-teams
certification_code: SMPC
title: "Empirismo sob aceleração: a inspeção quando a IA vai rápido"
subtitle: Velocidade não é a meta — inspecionar e adaptar é
language: pt-BR
lesson_group_id: c0000000-0000-0000-0000-00000000a604
duration_minutes: 10
order_index: 4
task_codes: [6.4, 6.6]
concept_slugs:
  - empiricism-under-acceleration
  - sm-safeguards-inspection
  - ai-signal-informs-inspection
  - metrics-inform-not-decide
prerequisites:
  - 06-03-new-impediments-ai-teams
preview: |
  Uma lição de 10 minutos sobre proteger o empirismo quando a IA acelera a
  saída: por que a capacidade de inspeção é a verdadeira restrição, como o
  Scrum Master protege o inspecionar e adaptar, e como usar o sinal gerado
  por IA como insumo sem deixar as métricas tomarem as decisões.
authors:
  - Certidemy team
status: published
---

::hook
A IA pode fazer seu time produzir dez vezes mais rápido. Ela não pode fazer seu time inspecionar dez vezes mais rápido. Essa lacuna é onde o empirismo se quebra.
::

::concept title="O empirismo tem um limite de velocidade, e ele é humano"
O Scrum é construído sobre o empirismo: o time trabalha em ciclos curtos, **inspeciona** o que produziu e **adapta** com base no que aprendeu. A transparência torna o trabalho visível; a inspeção o examina; a adaptação muda o rumo. Tire qualquer um dos três pilares e o ciclo deixa de ser empírico.

Aqui está o problema com a IA. [O empirismo depende da capacidade do time de inspecionar e adaptar]{glossary="empiricism-under-acceleration"}, e essa capacidade é em ritmo humano. Um modelo pode gerar o trabalho de um Sprint em uma tarde, mas a capacidade do time de inspecionar de verdade essa saída, entendê-la e decidir o que mudar não acelerou nem um pouco.

Quando a geração supera a inspeção, o ciclo se inverte em silêncio. O time produz mais rápido do que consegue aprender. A transparência chega mais rápido do que alguém consegue examinar. O Sprint parece produtivo e deixa de ser empírico, porque o inspecionar e adaptar que faz o Scrum *funcionar* ficou para trás.
::

::callout type="exam-watch"
O enquadramento da prova: mais saída não é mais empirismo. O empirismo é medido pela capacidade do time de inspecionar e adaptar, não por quanto ele produz. A IA que aumenta a saída sem aumentar a capacidade de inspeção não fortalece o Scrum: ela o tensiona.
::

::interactive widget="toggle-and-observe" id="empiricism-under-ai-load" concept_slugs="empiricism-under-acceleration,sm-safeguards-inspection"
{
  "scenario_title": "O empirismo sob aceleração de IA",
  "intro": "Um time adotou um agente de IA e a saída disparou. Ative cada pilar para ver o que um verdadeiro inspecionar e adaptar exige, e o que se quebra quando a saída supera a inspeção.",
  "toggles": [
    {
      "id": "transparency",
      "label": "A transparência mantém o ritmo",
      "off_consequence": "A saída de IA chega mais rápido do que pode ser tornada visível e honesta; os revisores veem volume, não entendimento.",
      "on_consequence": "O trabalho —incluindo o que a IA produziu— permanece visível e inspecionável conforme chega."
    },
    {
      "id": "inspection",
      "label": "A capacidade de inspeção escala",
      "off_consequence": "A geração supera a revisão; o time entrega trabalho que ninguém examinou de verdade.",
      "on_consequence": "O time consegue examinar de verdade o que foi produzido antes de contar como pronto.",
      "depends_on": ["transparency"]
    },
    {
      "id": "adaptation",
      "label": "A adaptação ainda acontece",
      "off_consequence": "Mesmo com o trabalho revisado, nada muda de um Sprint para outro; o time produz mas nunca aprende.",
      "on_consequence": "O time muda o rumo com base no que a inspeção revelou: o ciclo se fecha.",
      "depends_on": ["inspection"]
    }
  ],
  "reflection_prompt": "Com os três ativados sob muita saída de IA, o que o Scrum Master realmente protegeu?",
  "reflection_answer": "Não a velocidade de produção, mas a capacidade do time de inspecionar e adaptar. O empirismo sobrevive à aceleração apenas quando a inspeção e a adaptação mantêm o ritmo da geração, e proteger esse equilíbrio é o trabalho do Scrum Master."
}
::

::concept title="O Scrum Master protege o inspecionar e adaptar"
Quando a saída acelera, há pressão para tratar o volume bruto como sucesso. [O Scrum Master protege em vez disso a cadência de inspeção e adaptação]{glossary="sm-safeguards-inspection"}.

Concretamente, isso significa proteger os eventos onde a inspeção acontece: o Sprint Review e a Retrospective não são encurtados porque "entregamos muito". Significa ajudar o time a ver quando a geração superou a revisão, e apoiar a decisão dele de reduzir a geração em vez de pular a inspeção. Significa defender a ideia de que um Increment que o time não inspecionou de verdade não está realmente Done, não importa quanto haja.

Isso não é anti-IA. Um time que usa IA *e* mantém a inspeção no ritmo obtém o melhor dos dois: mais capacidade e empirismo intacto. O papel do Scrum Master é garantir que a segunda metade dessa frase nunca seja descartada.
::

::concept title="A IA como sinal: informar a inspeção, não substituí-la"
A IA não é só uma fonte de saída: é uma fonte de *sinal*. Ela pode mostrar métricas de fluxo, agrupar impedimentos recorrentes e sinalizar padrões de defeitos que o time pode não ver sozinho. [Bem usado, o sinal gerado por IA é um insumo para a inspeção]{glossary="ai-signal-informs-inspection"}: matéria-prima útil para um Sprint Review ou uma Retrospective.

Mas o sinal não é uma decisão. [As métricas informam o time; elas não decidem por ele]{glossary="metrics-inform-not-decide"}. A IA pode mostrar que certo tipo de trabalho sempre atrasa, mas *por que* atrasa e *o que fazer a respeito* é o julgamento do time, formado por pessoas que entendem o contexto que a métrica não consegue ver.

O modo de falha é deixar o painel conduzir a Retrospective: "a métrica diz X, então fazemos Y", sem interpretação humana no meio. A IA mostra o padrão. O time decide o que significa e o que muda. Mantenha essa ordem e a IA afia seu empirismo; inverta-a e o time para de pensar.
::

::callout type="pro-tip"
Uma regra limpa para o sinal de IA nos eventos: deixe-o definir a pauta, nunca a conclusão. A métrica pode decidir *sobre o que o time fala*. Só o time decide *o que fazer*.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Um agente de IA faz um time produzir muito mais saída por Sprint, mas a capacidade de inspeção continua a mesma. Qual é o efeito sobre o empirismo?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "O empirismo se fortalece, porque mais saída significa mais com o que aprender" },
      { "id": "b", "text": "O empirismo se tensiona, porque o time produz mais rápido do que consegue inspecionar e adaptar" },
      { "id": "c", "text": "O empirismo não é afetado pelo volume de saída" },
      { "id": "d", "text": "O empirismo melhora automaticamente assim que há IA" }
    ],
    "correct": ["b"],
    "explanation": "O empirismo depende do inspecionar e adaptar, que é em ritmo humano. Quando a geração supera a inspeção, o time produz sem aprender de verdade: o empirismo se tensiona.",
    "concept_slugs": ["empiricism-under-acceleration"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "A saída disparou com a IA, e o time propõe encurtar a Retrospective 'porque entregamos muito'. O que o Scrum Master deve fazer?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Concordar: saída alta merece uma Retrospective mais curta" },
      { "id": "b", "text": "Proteger a Retrospective; saída alta é justamente quando a inspeção e a adaptação mais importam" },
      { "id": "c", "text": "Cancelar a Retrospective e confiar nas métricas da IA" },
      { "id": "d", "text": "Encurtá-la e somar o tempo à geração" }
    ],
    "correct": ["b"],
    "explanation": "O Scrum Master protege a cadência de inspecionar e adaptar. A saída disparada é uma razão para proteger os eventos de inspeção, não para cortá-los.",
    "concept_slugs": ["sm-safeguards-inspection"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Uma ferramenta de IA informa que uma categoria de trabalho atrasa de forma consistente em relação à estimativa. Como o time deve usar isso na Retrospective?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Aplicar automaticamente a correção que a ferramenta recomenda" },
      { "id": "b", "text": "Tratar como um sinal para inspecionar: o time interpreta por que atrasa e decide o que mudar" },
      { "id": "c", "text": "Ignorar, já que só a observação humana conta" },
      { "id": "d", "text": "Deixar a métrica definir o próximo Sprint Goal do time" }
    ],
    "correct": ["b"],
    "explanation": "O sinal gerado por IA é insumo para a inspeção, não uma decisão. A métrica mostra o padrão; o time interpreta a causa e decide a mudança.",
    "concept_slugs": ["ai-signal-informs-inspection", "metrics-inform-not-decide"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "Qual é a relação correta entre as métricas de IA e as decisões do time nos eventos de Scrum?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "As métricas tomam as decisões; o time as executa" },
      { "id": "b", "text": "As métricas definem a pauta e informam o time, mas o time interpreta e decide" },
      { "id": "c", "text": "As métricas substituem a necessidade de uma Retrospective" },
      { "id": "d", "text": "As métricas deveriam ser ignoradas para manter o julgamento humano" }
    ],
    "correct": ["b"],
    "explanation": "Deixe o sinal de IA decidir sobre o que o time fala, nunca o que ele faz. As métricas informam; as pessoas interpretam e decidem, e isso mantém o time pensando e o empirismo intacto.",
    "concept_slugs": ["metrics-inform-not-decide"],
    "bloom_level": "2_understand",
    "difficulty": 2
  }
]
::

::summary
- O empirismo depende do inspecionar e adaptar, que é em ritmo humano; a IA pode superá-lo gerando mais rápido do que o time consegue aprender.
- Mais saída não é mais empirismo: o empirismo é medido pela inspeção e adaptação, não pelo volume.
- O Scrum Master protege o inspecionar e adaptar: proteger os eventos de inspeção e recusar-se a chamar de Done o trabalho não inspecionado.
- O sinal gerado por IA (fluxo, impedimentos, defeitos) é um insumo valioso para a inspeção nos Reviews e nas Retrospectives.
- As métricas informam; o time interpreta e decide: a IA define a pauta, nunca a conclusão.
::
$lesson$
from (select id from public.modules where certification_id = '11111111-1111-1111-1111-111111111111' and slug = 'ai-augmented-teams') m
where not exists (select 1 from public.lessons l where l.slug = '06-04-empiricism-under-acceleration' and l.language = 'pt-BR');

-- ---- VERIFICATION (expect 3 rows) --------------------------------------------
-- select language, slug, title from public.lessons
--  where slug = '06-04-empiricism-under-acceleration' order by language;
