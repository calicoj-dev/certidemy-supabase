# The 342 secure items that decided seven live credentials

**Read these, not the bank.** No mechanical check in this repository reads
for meaning: the 05-02 threshold inversion was fluent, correctly keyed, and
passed every gate we own. A credential is defended by the items the candidate
actually saw.

Generated 2026-09-25, read-only. English beside Spanish, field by field,
key marked. `ITEM-EXPOSURE.md` carries the exposure finding this comes from.

## What the 342 are, and what they are not

Distinct `quiz_questions` rows, **`pool = secure`**, presented in es-419 inside a
session that produced an `exam_attempt`. Eight attempts, seven people, three
certifications.

**1,057 distinct items have been presented in Spanish overall.** The other **715**
are PRACTICE items shown in 20 `mock_exam` simulator sessions that produced no
attempt — 12 users, 6 of whom also sat a real exam. The arithmetic reconciles
exactly (342 + 715 = 1,057) and the two populations carry different claims: the
simulator is a readiness signal a learner acts on, these 342 decided credentials.
**Only the 342 are in this document.**

| | |
|---|---|
| AIE-I | 72 distinct secure items |
| AISM-I | 80 distinct secure items |
| SM-AI-I | 190 distinct secure items |
| **total** | **342** |

## Margin: how many items would have to flip to change each outcome

**This is the table to reach for if a defect is found.** For a pass, `flips` is how
many correct answers would have to become wrong to drop the candidate below the
mark. For the one failure, it is how many wrong answers would have to become
right to lift them over it.

| date | cert | score | pass mark | correct / total | needed | outcome | flips to change it |
|---|---|---|---|---|---|---|---|
| 2026-08-12 | SM-AI-I | 98.75% | 80% | 79 / 80 | 64 | **pass** | **16** |
| 2026-08-17 | AIE-I | 100% | 80% | 25 / 25 | 20 | **pass** | **6** |
| 2026-08-26 | AIE-I | 76% | 80% | 19 / 25 | 20 | **FAIL** | **1** |
| 2026-08-26 | AIE-I | 100% | 80% | 25 / 25 | 20 | **pass** | **6** |
| 2026-08-27 | AISM-I | 95% | 80% | 76 / 80 | 64 | **pass** | **13** |
| 2026-09-04 | AIE-I | 100% | 80% | 25 / 25 | 20 | **pass** | **6** |
| 2026-09-07 | SM-AI-I | 96.25% | 80% | 77 / 80 | 64 | **pass** | **14** |
| 2026-09-23 | SM-AI-I | 91.25% | 80% | 73 / 80 | 64 | **pass** | **10** |

**1 outcome(s) turn on two items or fewer.** They are the ones to check first against any defect found below.

### The one-flip attempt: the six items it turns on

The 2026-08-26 AIE-I failure was **one item** short. Any single one of the
items that candidate answered wrongly, if defective in Spanish, is sufficient
to have produced that result. **Read these before anything else.**

They retook the same day and scored 100, so no certification is currently
withheld from anyone — the cost was a consumed attempt, not a denied credential.

- `6c0b1bce-7c0c-4031-9612-9008a9fbad10` — AIE-I · task 2.2
- `2fa659f8-c483-40ad-9c76-da440900b327` — AIE-I · task 3.4
- `c2ab42be-9b7d-4b11-8883-078ba43ed69e` — AIE-I · task 1.5
- `7f1f9226-2862-4d1b-84a8-aa32748d05ec` — AIE-I · task 2.1  *(also in the sample)*
- `c727087f-3eaa-4680-a39a-e4e795e3fd91` — AIE-I · task 1.4  *(also in the sample)*
- `529c8db9-6708-400f-b021-5b647aa7addb` — AIE-I · task 1.7

---

# A. The sample — 40 items, read these first

Random, **stratified by certification in proportion to exposure**, largest
remainder. Seed `20260925`, mulberry32, Fisher-Yates over ids sorted
ascending — reproducible by re-running this script.

| cert | exposed | exact quota | sampled |
|---|---|---|---|
| AIE-I | 72 | 8.42 | 9 |
| AISM-I | 80 | 9.36 | 9 |
| SM-AI-I | 190 | 22.22 | 22 |
| **total** | **342** | **40.00** | **40** |

### 1. AIE-I · 1.5 · `8eb1bba8-522c-4bc4-91d7-9874718e1431`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.5: Recall common AI use cases across everyday workplace functions

**stem**

| | |
|---|---|
| EN | A marketing associate needs to quickly produce five variations of a promotional email for different customer segments. Which AI capability best fits this need? |
| ES | Un asociado de marketing necesita producir rápidamente cinco variaciones de un correo electrónico promocional para diferentes segmentos de clientes. ¿Qué capacidad de IA se adapta mejor a esta necesidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | AI drafting tools, which generate multiple text variations from a brief prompt for human review. `<<KEY` |
| **a** ES | Herramientas de redacción con IA, que generan múltiples variaciones de texto a partir de un breve indicador para revisión humana. `<<KEY` |
| **b** EN | AI analysis tools, which predict the single best message, eliminating the need for copy variations. |
| **b** ES | Herramientas de análisis con IA, que predicen el único mejor mensaje, eliminando la necesidad de variaciones de contenido. |
| **c** EN | AI scheduling tools, which allocate send times based on calendar availability. |
| **c** ES | Herramientas de programación con IA, que asignan horarios de envío según la disponibilidad del calendario. |
| **d** EN | AI strategy tools, which independently set campaign goals and select the optimal segment mix. |
| **d** ES | Herramientas de estrategia con IA, que establecen de forma independiente los objetivos de la campaña y seleccionan la combinación óptima de segmentos. |

**explanation**

| | |
|---|---|
| EN | Generating multiple drafts from a prompt is a core AI drafting capability, directly matching the need for varied copy. Scheduling tools manage send timing, not content creation. Strategy tools do not autonomously set campaign goals. Predictive analysis serves a different purpose than text generation. |
| ES | Generar múltiples borradores a partir de un indicador es una capacidad central de redacción con IA, que se adapta directamente a la necesidad de contenido variado. Las herramientas de programación gestionan el tiempo de envío, no la creación de contenido. Las herramientas de estrategia no establecen objetivos de campaña de forma autónoma. El análisis predictivo tiene un propósito diferente al de la generación de texto. |

### 2. AIE-I · 3.1 · `02573622-7c16-4d52-b8fd-3b7fc15c286a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.1: Protect privacy and confidential data when using AI tools

**stem**

| | |
|---|---|
| EN | A sales coordinator wants to draft a follow-up email using a free, public AI chatbot. She plans to paste in the client's name, email address, and contract value. What should she do? |
| ES | Una coordinadora de ventas quiere redactar un correo electrónico de seguimiento utilizando un chatbot de IA público y gratuito. Planea pegar el nombre del cliente, su dirección de correo electrónico y el valor del contrato. ¿Qué debería hacer? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Proceed, because the chatbot's privacy policy ensures client data cannot be used for training. |
| **a** ES | Proceder, porque la política de privacidad del chatbot garantiza que los datos del cliente no pueden usarse para entrenamiento. |
| **b** EN | Use fictional placeholders in the public tool and insert real client details only in an approved internal system. `<<KEY` |
| **b** ES | Usar datos ficticios de marcador de posición en la herramienta pública e insertar los datos reales del cliente solo en un sistema interno aprobado. `<<KEY` |
| **c** EN | Proceed, because names and emails are not confidential—only passwords and account numbers require protection. |
| **c** ES | Proceder, porque los nombres y correos electrónicos no son confidenciales; solo las contraseñas y números de cuenta requieren protección. |
| **d** EN | Proceed, then delete the conversation so the client data is no longer stored by the tool. |
| **d** ES | Proceder y luego eliminar la conversación para que los datos del cliente ya no estén almacenados por la herramienta. |

**explanation**

| | |
|---|---|
| EN | Client names, email addresses, and contract values are confidential; entering them into a public AI tool risks storage, training use, or exposure outside the organization's control. The safe approach is to draft with placeholders and add real details only in approved internal systems. A privacy policy does not guarantee data is excluded from training. Deleting a conversation does not remove data already ingested by the provider. Personal identifiers such as names and emails are confidential regardless of whether financial account numbers are involved. |
| ES | Los nombres de los clientes, las direcciones de correo electrónico y los valores de los contratos son confidenciales; ingresarlos en una herramienta de IA pública conlleva el riesgo de almacenamiento, uso para entrenamiento o exposición fuera del control de la organización. El enfoque seguro es redactar con marcadores de posición y agregar los datos reales solo en sistemas internos aprobados. Una política de privacidad no garantiza que los datos queden excluidos del entrenamiento. Eliminar una conversación no elimina los datos que el proveedor ya ha procesado. Los identificadores personales como nombres y correos electrónicos son confidenciales independientemente de si se involucran números de cuentas financieras. |

### 3. AIE-I · 2.1 · `fe88f3ee-76a2-4c39-9424-3b4051a23b5a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.1: Explain what a prompt is and how it differs from a search query

**stem**

| | |
|---|---|
| EN | Which description most accurately captures how a prompt differs from a search query? |
| ES | ¿Cuál descripción captura con mayor precisión en qué se diferencia un prompt de una consulta de búsqueda? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A prompt must follow special command syntax; a search query is written in plain language. |
| **a** ES | Un prompt debe seguir una sintaxis de comandos especial; una consulta de búsqueda se escribe en lenguaje común. |
| **b** EN | A prompt instructs a model to generate new content; a search query retrieves existing documents. `<<KEY` |
| **b** ES | Un prompt instruye a un modelo para que genere contenido nuevo; una consulta de búsqueda recupera documentos existentes. `<<KEY` |
| **c** EN | A prompt is longer than a search query, which is why it produces more detailed results. |
| **c** ES | Un prompt es más largo que una consulta de búsqueda, razón por la cual produce resultados más detallados. |
| **d** EN | A prompt uses the same engine as a search query but displays results in paragraph form. |
| **d** ES | Un prompt utiliza el mismo motor que una consulta de búsqueda, pero muestra los resultados en forma de párrafo. |

**explanation**

| | |
|---|---|
| EN | The core distinction is generation versus retrieval: a prompt directs a generative AI to produce something new, while a search query asks an index to surface existing documents. Prompts require no special syntax — plain language is sufficient — and length alone does not determine output quality. Prompts and search queries also use entirely different underlying systems. |
| ES | La distinción fundamental es generación versus recuperación: un prompt dirige a una IA generativa para que produzca algo nuevo, mientras que una consulta de búsqueda le pide a un índice que muestre documentos existentes. Los prompts no requieren sintaxis especial: el lenguaje común es suficiente, y la longitud por sí sola no determina la calidad del resultado. Los prompts y las consultas de búsqueda también utilizan sistemas subyacentes completamente diferentes. |

### 4. AIE-I · 3.5 · `abe98cec-2946-4641-8f91-47af14fbfd4f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Apply the organization's AI-use policy to decide whether a specific use is permitted

**stem**

| | |
|---|---|
| EN | An HR coordinator used an AI tool to substantially restructure a job description before sending it to the hiring manager. The coordinator made final edits. Must the coordinator disclose AI involvement? |
| ES | Una coordinadora de Recursos Humanos usó una herramienta de IA para reestructurar sustancialmente una descripción de puesto antes de enviarla al gerente de contratación. La coordinadora realizó ediciones finales. ¿Debe la coordinadora revelar la participación de la IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No, because AI generated less than 100% of the final text, so the disclosure threshold is not met. |
| **a** ES | No, porque la IA generó menos del 100% del texto final, por lo que no se alcanza el umbral de divulgación. |
| **b** EN | No, because disclosure applies only to external audiences such as candidates, not internal colleagues. |
| **b** ES | No, porque la divulgación aplica solo a audiencias externas como candidatos, no a colegas internos. |
| **c** EN | Yes, because AI materially shaped the content, so disclosure is required regardless of subsequent human editing. `<<KEY` |
| **c** ES | Sí, porque la IA influyó materialmente en el contenido, por lo que la divulgación es obligatoria independientemente de la edición humana posterior. `<<KEY` |
| **d** EN | No, because the coordinator reviewed and edited the text, making it the coordinator's own work. |
| **d** ES | No, porque la coordinadora revisó y editó el texto, convirtiéndolo en trabajo propio de la coordinadora. |

**explanation**

| | |
|---|---|
| EN | Disclosure is required whenever AI materially produced or restructured content, not only when it generated every word. Human review does not erase AI's material contribution. Disclosure obligations extend to internal stakeholders, not only external audiences like candidates. |
| ES | La divulgación es obligatoria cuando la IA produjo o reestructuró materialmente el contenido, no solo cuando generó cada palabra. La revisión humana no elimina la contribución material de la IA. Las obligaciones de divulgación se extienden a las partes interesadas internas, no solo a audiencias externas como los candidatos. |

### 5. AIE-I · 3.2 · `6986c595-d36a-4b13-8760-5647da651585`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Recognize bias and fairness risks in AI outputs

**stem**

| | |
|---|---|
| EN | An AI chatbot achieves 95% accuracy overall in resolving customer queries. A team leader concludes it is fair to all customer groups. What is the flaw in this conclusion? |
| ES | Un chatbot de IA alcanza un 95% de precisión general en la resolución de consultas de clientes. Un líder de equipo concluye que es justo para todos los grupos de clientes. ¿Cuál es el error en esta conclusión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The conclusion is sound — performance metrics are objective and automatically capture fairness. |
| **a** ES | La conclusión es sólida: las métricas de rendimiento son objetivas y capturan automáticamente la equidad. |
| **b** EN | High overall accuracy can hide poor performance for specific subgroups, masking unfair treatment. `<<KEY` |
| **b** ES | Una alta precisión general puede ocultar un rendimiento deficiente para subgrupos específicos, enmascarando un trato injusto. `<<KEY` |
| **c** EN | The flaw is that accuracy measures speed, not correctness, so it cannot indicate fairness at all. |
| **c** ES | El error es que la precisión mide la velocidad, no la exactitud, por lo que no puede indicar equidad en absoluto. |
| **d** EN | The conclusion is sound — 95% accuracy means the model performs equally well across every group. |
| **d** ES | La conclusión es sólida: un 95% de precisión significa que el modelo funciona igual de bien en todos los grupos. |

**explanation**

| | |
|---|---|
| EN | Aggregate accuracy can be high while a minority subgroup receives correct answers far less often, experiencing a systematically worse service. Fairness requires examining performance broken down by subgroup, not just the overall figure. A single aggregate number can obscure significant disparities that affect real customers. |
| ES | La precisión agregada puede ser alta mientras que un subgrupo minoritario recibe respuestas correctas con mucha menor frecuencia, experimentando un servicio sistemáticamente peor. La equidad requiere examinar el rendimiento desglosado por subgrupo, no solo la cifra general. Un único número agregado puede ocultar disparidades significativas que afectan a clientes reales. |

### 6. AIE-I · 1.4 · `d47c3016-bc59-4b3d-a48a-e6cd7cb93dfd`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.4: Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**stem**

| | |
|---|---|
| EN | A marketing associate describes a tool that drafts a promotional email when asked. A colleague describes a tool that researches competitor prices, updates a spreadsheet, and sends a summary report without being prompted at each step. Which label correctly classifies these two tools? |
| ES | Un asociado de marketing describe una herramienta que redacta un correo electrónico promocional cuando se le solicita. Un colega describe una herramienta que investiga precios de la competencia, actualiza una hoja de cálculo y envía un informe de resumen sin necesidad de indicaciones en cada paso. ¿Qué etiqueta clasifica correctamente estas dos herramientas? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The second is an agent because it uses a larger underlying model than the first. |
| **a** ES | La segunda es un agente porque utiliza un modelo subyacente más grande que la primera. |
| **b** EN | Both are chatbots, because both ultimately produce text as their output. |
| **b** ES | Ambas son chatbots, porque en última instancia ambas producen texto como resultado. |
| **c** EN | The first is a chatbot; the second is an AI agent pursuing a goal across multiple steps. `<<KEY` |
| **c** ES | La primera es un chatbot; la segunda es un agente de IA que persigue un objetivo a través de múltiples pasos. `<<KEY` |
| **d** EN | The second is an agent because it accesses the internet; the first lacks that capability. |
| **d** ES | La segunda es un agente porque accede a internet; la primera carece de esa capacidad. |

**explanation**

| | |
|---|---|
| EN | An AI agent pursues a goal by planning and taking multiple actions autonomously, while a chatbot responds to a single prompt and waits for the next one. The second tool fits the agent definition; the first fits the chatbot definition. Internet access alone does not define an agent, and model size is unrelated to this distinction. |
| ES | Un agente de IA persigue un objetivo planificando y tomando múltiples acciones de forma autónoma, mientras que un chatbot responde a una sola indicación y espera la siguiente. La segunda herramienta se ajusta a la definición de agente; la primera se ajusta a la definición de chatbot. El acceso a internet por sí solo no define a un agente, y el tamaño del modelo no está relacionado con esta distinción. |

### 7. AIE-I · 2.1 · `7f1f9226-2862-4d1b-84a8-aa32748d05ec`

shown **4×** in the eight scored attempts — 3 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 2.1: Explain what a prompt is and how it differs from a search query

**stem**

| | |
|---|---|
| EN | A finance analyst believes adding 'please' and 'thank you' to her prompts produces better AI outputs because the model responds to politeness. Which statement correctly explains why this belief is mistaken? |
| ES | Una analista financiera cree que agregar 'por favor' y 'gracias' a sus prompts produce mejores resultados de IA, porque el modelo responde a la cortesía. ¿Cuál enunciado explica correctamente por qué esta creencia es incorrecta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Polite language reduces output quality because filler words disrupt the model's syntax parsing. |
| **a** ES | El lenguaje cortés reduce la calidad de los resultados porque las palabras de relleno interrumpen el análisis sintáctico del modelo. |
| **b** EN | AI models process statistical patterns, not social cues, so polite phrasing does not improve reasoning. `<<KEY` |
| **b** ES | Los modelos de IA procesan patrones estadísticos, no señales sociales, por lo que las frases corteses no mejoran el razonamiento. `<<KEY` |
| **c** EN | Models respond to social cues only when the prompt is submitted in formal written English. |
| **c** ES | Los modelos responden a señales sociales solo cuando el prompt se envía en inglés escrito formal. |
| **d** EN | Courtesy words shorten the effective instruction, so the model receives less information to work with. |
| **d** ES | Las palabras de cortesía acortan la instrucción efectiva, por lo que el modelo recibe menos información con la que trabajar. |

**explanation**

| | |
|---|---|
| EN | Generative AI models do not experience social cues; they process statistical patterns in language. Polite words neither improve nor meaningfully harm output — what matters is the clarity and specificity of the instruction. The other options introduce false mechanisms: disrupted syntax parsing, a formality threshold for social cues, and a word-count effect — none of which reflect how these models work. |
| ES | Los modelos de IA generativa no experimentan señales sociales; procesan patrones estadísticos en el lenguaje. Las palabras corteses no mejoran ni perjudican significativamente los resultados: lo que importa es la claridad y especificidad de la instrucción. Las demás opciones introducen mecanismos falsos: análisis sintáctico interrumpido, un umbral de formalidad para las señales sociales y un efecto del conteo de palabras, ninguno de los cuales refleja cómo funcionan estos modelos. |

### 8. AIE-I · 1.4 · `c727087f-3eaa-4680-a39a-e4e795e3fd91`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 1.4: Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**stem**

| | |
|---|---|
| EN | Which description accurately captures what an AI agent is? |
| ES | ¿Qué descripción captura con precisión qué es un agente de IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | An AI that executes a rigid, predefined script of steps faster than a rule-based chatbot. |
| **a** ES | Una IA que ejecuta un guion rígido y predefinido de pasos más rápido que un chatbot basado en reglas. |
| **b** EN | An AI with a large memory that stores full conversation history for more coherent replies. |
| **b** ES | Una IA con una gran memoria que almacena el historial completo de conversaciones para obtener respuestas más coherentes. |
| **c** EN | An AI that plans and takes autonomous multi-step actions toward a goal using tools and decisions. `<<KEY` |
| **c** ES | Una IA que planifica y toma acciones autónomas de múltiples pasos hacia un objetivo utilizando herramientas y decisiones. `<<KEY` |
| **d** EN | An AI that requires explicit human instructions at every decision point before proceeding. |
| **d** ES | Una IA que requiere instrucciones humanas explícitas en cada punto de decisión antes de continuar. |

**explanation**

| | |
|---|---|
| EN | An AI agent is defined by its ability to plan, use tools, and act across multiple steps toward a goal with limited supervision. It is not simply a chatbot with more memory, nor does it require human input at every decision point or follow a rigid script. |
| ES | Un agente de IA se define por su capacidad de planificar, usar herramientas y actuar a través de múltiples pasos hacia un objetivo con supervisión limitada. No es simplemente un chatbot con más memoria, ni requiere intervención humana en cada punto de decisión ni sigue un guion rígido. |

### 9. AIE-I · 2.5 · `c7f73aee-12e4-4a35-983d-bd1bed455d9d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.5: Verify and evaluate AI output before relying on it

**stem**

| | |
|---|---|
| EN | An office manager asks an AI tool to draft a brief announcement about a policy change. The draft is polished with no grammar errors. What should the manager do before posting it to staff? |
| ES | Un gerente de oficina le pide a una herramienta de IA que redacte un breve comunicado sobre un cambio de política. El borrador está pulido y sin errores gramaticales. ¿Qué debe hacer el gerente antes de publicarlo para el personal? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Post it immediately because the absence of grammar errors confirms the factual content is also correct. |
| **a** ES | Publicarlo de inmediato porque la ausencia de errores gramaticales confirma que el contenido factual también es correcto. |
| **b** EN | Post it without review since staff announcements are routine and verification adds unnecessary overhead. |
| **b** ES | Publicarlo sin revisión ya que los comunicados al personal son rutinarios y la verificación agrega una carga innecesaria. |
| **c** EN | Run the draft through a second AI tool; matching content from both versions confirms the policy details are correct. |
| **c** ES | Ejecutar el borrador en una segunda herramienta de IA; si el contenido de ambas versiones coincide, los detalles de la política son correctos. |
| **d** EN | Have a knowledgeable person review the policy details for accuracy before the announcement is posted. `<<KEY` |
| **d** ES | Pedir a una persona con conocimiento del tema que revise los detalles de la política para verificar su precisión antes de publicar el comunicado. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Grammatical polish does not indicate factual correctness; an AI can produce a flawlessly written announcement with inaccurate policy details. A knowledgeable person must review the substance before it is posted. Verification is not limited to high-stakes decisions, and matching outputs from two AI tools does not confirm accuracy. |
| ES | El pulido gramatical no indica corrección factual; una IA puede producir un comunicado impecablemente redactado con detalles de política incorrectos. Una persona con conocimiento del tema debe revisar el contenido antes de publicarlo. La verificación no se limita a decisiones de alto impacto, y que dos herramientas de IA produzcan resultados coincidentes no confirma la precisión. |

### 10. AISM-I · 5.8 · `b4469e05-bfbe-45fa-9d00-56fdb17e3d42`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.8: Explain how incident-response and continual-improvement processes must adapt when the incident or improvement involves an AI-driven service action.

**stem**

| | |
|---|---|
| EN | An AI recommendation engine surfaces biased results for a demographic group, but uptime and error rates remain normal. Why does this qualify as an AI incident? |
| ES | Un motor de recomendación de IA muestra resultados sesgados para un grupo demográfico, pero el tiempo de actividad y las tasas de error permanecen normales. ¿Por qué esto califica como un incidente de IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | User harm is an incident criterion independent of system downtime or technical error rates. `<<KEY` |
| **a** ES | El daño al usuario es un criterio de incidente independiente del tiempo de inactividad del sistema o de las tasas de error técnico. `<<KEY` |
| **b** EN | It does not qualify; bias issues are addressed through scheduled model retraining, not incident response. |
| **b** ES | No califica; los problemas de sesgo se abordan mediante el reentrenamiento programado del modelo, no mediante la respuesta a incidentes. |
| **c** EN | It qualifies only once user complaints exceed a defined volume threshold confirming statistical significance. |
| **c** ES | Califica solo cuando las quejas de los usuarios superan un umbral de volumen definido que confirma la significancia estadística. |
| **d** EN | It does not qualify because accuracy metrics within acceptable bounds indicate normal model behavior. |
| **d** ES | No califica porque las métricas de precisión dentro de límites aceptables indican un comportamiento normal del modelo. |

**explanation**

| | |
|---|---|
| EN | AI incident criteria include the nature and breadth of harm to users, not only technical indicators like uptime or error rates. Relying solely on downtime or error rate misses harm-based failures characteristic of AI services. Waiting for complaint volume ignores the structural obligation to detect harm proactively. |
| ES | Los criterios de incidentes de IA incluyen la naturaleza y el alcance del daño a los usuarios, no solo indicadores técnicos como el tiempo de actividad o las tasas de error. Basarse únicamente en el tiempo de inactividad o en la tasa de errores pasa por alto las fallas basadas en daño características de los servicios de IA. Esperar el volumen de quejas ignora la obligación estructural de detectar el daño de manera proactiva. |

### 11. AISM-I · 3.1 · `2073f9de-0665-44fb-930e-a8fb0f500ab4`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.1: Explain the product-and-service lifecycle activities and that they are iterative, not sequential.

**stem**

| | |
|---|---|
| EN | A cloud storage service has been live for two years. The business identifies a new user segment with different needs. Which lifecycle characterisation is accurate? |
| ES | Un servicio de almacenamiento en la nube lleva dos años en producción. El negocio identifica un nuevo segmento de usuarios con necesidades diferentes. ¿Cuál caracterización del ciclo de vida es correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A stable service signals that design and discovery work should not recur. |
| **a** ES | Un servicio estable indica que el trabajo de diseño y descubrimiento no debe repetirse. |
| **b** EN | The lifecycle ended at deployment, so new needs require a separate, unrelated support process. |
| **b** ES | El ciclo de vida terminó con el despliegue, por lo que las nuevas necesidades requieren un proceso de soporte separado y no relacionado. |
| **c** EN | Discover and design recur, because the iterative lifecycle continuously revisits live services. `<<KEY` |
| **c** ES | Descubrir y diseñar se repiten, porque el ciclo de vida iterativo revisa continuamente los servicios en producción. `<<KEY` |
| **d** EN | Discover is irrelevant here; it only applies when an entirely new product is being conceived. |
| **d** ES | Descubrir no es relevante aquí; solo aplica cuando se está concibiendo un producto completamente nuevo. |

**explanation**

| | |
|---|---|
| EN | Lifecycle activities recur throughout a service's life; discover and design are revisited whenever new requirements emerge, regardless of how long the service has been live. Treating deployment as the lifecycle's end, or restricting discovery to new products, both reflect common but incorrect mental models. |
| ES | Las actividades del ciclo de vida se repiten a lo largo de la vida de un servicio; descubrir y diseñar se retoman siempre que surgen nuevos requisitos, independientemente del tiempo que lleve el servicio en producción. Tratar el despliegue como el fin del ciclo de vida, o restringir el descubrimiento a productos nuevos, refleja modelos mentales comunes pero incorrectos. |

### 12. AISM-I · 2.9 · `935634a8-4040-4a74-b351-482181a36c47`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.9: Given a described improvement effort, determine which continual-improvement step it skipped.

**stem**

| | |
|---|---|
| EN | A problem-management team disbanded after six months. No role was assigned ownership of the new process and it was not added to any policy. Backlogs returned to prior levels within a year. Which step was skipped? |
| ES | Un equipo de gestión de problemas se disolvió después de seis meses. No se asignó a ningún rol la propiedad del nuevo proceso y este no se añadió a ninguna política. Los registros pendientes volvieron a los niveles anteriores en un año. ¿Qué paso fue omitido? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Defining the vision, because no long-term target state for problem management was ever articulated. |
| **a** ES | Definir la visión, porque nunca se articuló un estado objetivo a largo plazo para la gestión de problemas. |
| **b** EN | Establishing a baseline, because the original backlog volume was never formally recorded before the effort launched. |
| **b** ES | Establecer una línea base, porque el volumen original de registros pendientes nunca fue registrado formalmente antes de que se lanzara el esfuerzo. |
| **c** EN | Embedding the change, because the improvement was never anchored in policy or assigned ongoing ownership. `<<KEY` |
| **c** ES | Incorporar el cambio, porque la mejora nunca se ancló en una política ni se asignó una responsabilidad continua. `<<KEY` |
| **d** EN | Communicating results, because stakeholders were unaware of the improvement and so stopped following the process. |
| **d** ES | Comunicar los resultados, porque las partes interesadas desconocían la mejora y, por lo tanto, dejaron de seguir el proceso. |

**explanation**

| | |
|---|---|
| EN | The regression pattern — results hold while the team is active, then erode — is the signature of failing to embed and sustain the change. Anchoring the improvement in policy, procedures, and assigned ownership is what prevents backsliding once the initiative team is gone. Missing vision or baseline would have prevented early results, not caused later regression. |
| ES | El patrón de regresión —los resultados se mantienen mientras el equipo está activo, luego se deterioran— es la señal característica de no haber incorporado y sostenido el cambio. Anclar la mejora en políticas, procedimientos y responsabilidades asignadas es lo que previene el retroceso una vez que el equipo de la iniciativa se ha ido. La falta de visión o de línea base habría impedido los resultados iniciales, no causado una regresión posterior. |

### 13. AISM-I · 4.12 · `536090c0-83d3-4760-ba5d-dfcf0e5babda`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.12: Analyze how errors compound across an agentic workflow's multi-step chain.

**stem**

| | |
|---|---|
| EN | A circuit breaker halts an agentic pipeline after three consecutive failed API responses. It did not stop the agent when it silently wrote incorrect data to a database. What does this reveal about the circuit breaker? |
| ES | Un circuit breaker detiene un pipeline agéntico después de tres respuestas API fallidas consecutivas. No detuvo al agente cuando este escribió silenciosamente datos incorrectos en una base de datos. ¿Qué revela esto sobre el circuit breaker? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It was misplaced; positioning it at the pipeline's entry point would block bad inputs before any execution begins. |
| **a** ES | Estaba mal ubicado; colocarlo en el punto de entrada del pipeline bloquearía las entradas incorrectas antes de que comience cualquier ejecución. |
| **b** EN | It automatically rolled back the incorrect writes when it tripped, so the database corruption was already remediated. |
| **b** ES | Revirtió automáticamente las escrituras incorrectas cuando se activó, por lo que la corrupción de la base de datos ya fue remediada. |
| **c** EN | Its threshold was too high; a one-failure limit would have caught the semantic data error before it was written. |
| **c** ES | Su umbral era demasiado alto; un límite de un fallo habría detectado el error semántico de datos antes de que fuera escrito. |
| **d** EN | It monitors observable error rates, not semantic correctness, so silent logical data errors fall outside its detection scope. `<<KEY` |
| **d** ES | Monitorea tasas de error observables, no la corrección semántica, por lo que los errores lógicos silenciosos en los datos quedan fuera de su alcance de detección. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A circuit breaker halts a chain based on measurable signals such as error rates—it cannot detect semantic or logical mistakes. Monitoring API failure rates will not surface silent data corruption. Treating circuit breakers as input validators or assuming they trigger rollbacks conflates them with distinct mechanisms. |
| ES | Un circuit breaker detiene una cadena basándose en señales medibles como tasas de error; no puede detectar errores semánticos o lógicos. Monitorear tasas de fallo de API no detectará la corrupción silenciosa de datos. Tratar los circuit breakers como validadores de entrada o asumir que activan reversiones confunde este mecanismo con otros distintos. |

### 14. AISM-I · 3.3 · `1d8f85e7-2890-43ee-8869-e35e1efce207`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Explain what a management practice is and distinguish general vs service management practices.

**stem**

| | |
|---|---|
| EN | Why is 'risk management' classified as a general management practice rather than a service management practice? |
| ES | ¿Por qué la 'gestión de riesgos' se clasifica como una práctica de gestión general en lugar de una práctica de gestión de servicios? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It originated in broader business disciplines and applies universally across all organization types, not exclusively within service provider environments. `<<KEY` |
| **a** ES | Se originó en disciplinas empresariales más amplias y se aplica universalmente en todos los tipos de organizaciones, no exclusivamente en entornos de proveedores de servicios. `<<KEY` |
| **b** EN | It was first developed within IT service management and subsequently adopted by wider business functions as its value became recognized. |
| **b** ES | Se desarrolló primero dentro de la gestión de servicios de TI y posteriormente fue adoptada por funciones empresariales más amplias a medida que se reconoció su valor. |
| **c** EN | It addresses only financial and legal exposure, making it irrelevant to service delivery contexts and therefore excluded from service management practice sets. |
| **c** ES | Aborda únicamente la exposición financiera y legal, lo que la hace irrelevante para los contextos de entrega de servicios y, por lo tanto, excluida de los conjuntos de prácticas de gestión de servicios. |
| **d** EN | It operates at a strategic level of organizational decision-making, whereas service management practices focus on day-to-day operational concerns. |
| **d** ES | Opera a un nivel estratégico de toma de decisiones organizacionales, mientras que las prácticas de gestión de servicios se centran en las preocupaciones operativas del día a día. |

**explanation**

| | |
|---|---|
| EN | General management practices are those that originated in broader business disciplines and apply universally, regardless of industry or organization type. Risk management meets both criteria. The direction of adoption runs from general business into service management, not the reverse, and classification is based on origin and scope—not on strategic importance or subject matter. |
| ES | Las prácticas de gestión general son aquellas que se originaron en disciplinas empresariales más amplias y se aplican universalmente, independientemente de la industria o el tipo de organización. La gestión de riesgos cumple ambos criterios. La dirección de adopción va desde los negocios en general hacia la gestión de servicios, no al revés, y la clasificación se basa en el origen y el alcance, no en la importancia estratégica ni en la materia tratada. |

### 15. AISM-I · 5.8 · `7ec2ac97-2349-458e-a124-663a41899787`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.8: Explain how incident-response and continual-improvement processes must adapt when the incident or improvement involves an AI-driven service action.

**stem**

| | |
|---|---|
| EN | An AI service is retrained after a fairness incident, passes offline benchmark evaluations, and the team considers the incident closed. Why is this conclusion premature? |
| ES | Un servicio de IA es reentrenado tras un incidente de equidad, supera las evaluaciones de referencia fuera de línea y el equipo considera el incidente cerrado. ¿Por qué es prematura esta conclusión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The incident is resolved once the model is updated; revising guardrails and human-review thresholds is a separate lower-priority task. |
| **a** ES | El incidente se resuelve una vez que el modelo es actualizado; revisar las salvaguardas y los umbrales de revisión humana es una tarea separada de menor prioridad. |
| **b** EN | Offline benchmarks do not confirm production safety; staged re-deployment and live harm monitoring are still required. `<<KEY` |
| **b** ES | Las evaluaciones de referencia fuera de línea no confirman la seguridad en producción; aún se requieren un redespliegue por etapas y monitoreo de daños en tiempo real. `<<KEY` |
| **c** EN | Retraining closes the improvement loop; monitoring the same failure mode afterward adds cost without reducing risk. |
| **c** ES | El reentrenamiento cierra el ciclo de mejora; monitorear el mismo modo de fallo posteriormente añade costos sin reducir el riesgo. |
| **d** EN | Offline benchmarks confirm model quality; the only remaining step is notifying affected users about the resolution. |
| **d** ES | Las evaluaciones de referencia fuera de línea confirman la calidad del modelo; el único paso restante es notificar a los usuarios afectados sobre la resolución. |

**explanation**

| | |
|---|---|
| EN | Offline benchmark performance does not guarantee production safety. The improvement loop is only closed when the fix is validated through staged or canary re-deployment and the previously identified failure mode is actively monitored in live conditions. Treating retraining as the final step—or deprioritizing updates to guardrails and human-review processes—leaves the service exposed to the same class of harm. User notification, while important, does not substitute for technical validation in production. |
| ES | El rendimiento en evaluaciones de referencia fuera de línea no garantiza la seguridad en producción. El ciclo de mejora solo se cierra cuando la corrección es validada mediante un redespliegue por etapas o canary, y el modo de fallo previamente identificado es monitoreado activamente en condiciones reales. Tratar el reentrenamiento como el paso final —o dar menor prioridad a las actualizaciones de salvaguardas y procesos de revisión humana— deja al servicio expuesto a la misma clase de daño. La notificación a los usuarios, aunque importante, no sustituye la validación técnica en producción. |

### 16. AISM-I · 4.4 · `4ef845b2-9238-4e21-a020-397f8ca98b68`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.4: Explain predictive and proactive service management.

**stem**

| | |
|---|---|
| EN | Which statement best explains how predictive service management differs from reactive service management? |
| ES | ¿Qué afirmación explica mejor cómo la gestión de servicios predictiva difiere de la gestión de servicios reactiva? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It detects anomalies faster, reducing time between failure onset and technician response. |
| **a** ES | Detecta anomalías más rápido, reduciendo el tiempo entre el inicio de la falla y la respuesta del técnico. |
| **b** EN | It applies scheduled maintenance intervals to all components, eliminating unplanned outages through fixed cycles. |
| **b** ES | Aplica intervalos de mantenimiento programados a todos los componentes, eliminando las interrupciones no planificadas mediante ciclos fijos. |
| **c** EN | It uses data patterns to anticipate disruptions before they occur, shifting focus from response to prevention. `<<KEY` |
| **c** ES | Utiliza patrones de datos para anticipar interrupciones antes de que ocurran, trasladando el enfoque de la respuesta a la prevención. `<<KEY` |
| **d** EN | It prevents failures entirely, making root cause analysis unnecessary in normal operations. |
| **d** ES | Previene las fallas por completo, haciendo innecesario el análisis de causa raíz en las operaciones normales. |

**explanation**

| | |
|---|---|
| EN | Predictive service management uses data and patterns to anticipate issues before they cause disruption, fundamentally shifting operations from response to prevention. Faster anomaly detection still reacts to a detected event rather than anticipating it. Scheduled maintenance follows fixed intervals rather than data-driven forecasts. Preventing failures does not eliminate the value of understanding their root causes. |
| ES | La gestión de servicios predictiva utiliza datos y patrones para anticipar problemas antes de que causen interrupciones, trasladando fundamentalmente las operaciones de la respuesta a la prevención. La detección más rápida de anomalías sigue siendo una reacción a un evento detectado en lugar de anticiparlo. El mantenimiento programado sigue intervalos fijos en lugar de pronósticos basados en datos. Prevenir fallas no elimina el valor de comprender sus causas raíz. |

### 17. AISM-I · 3.2 · `3dc173c3-b9d9-4b66-bec8-5da061f228e4`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Given a described situation, determine which lifecycle activity it belongs to.

**stem**

| | |
|---|---|
| EN | After six months in production, the support team analyses ticket trends and initiates a redesign of the AI service's escalation logic to reduce repeat contacts. Which lifecycle activity does this improvement work belong to? |
| ES | Después de seis meses en producción, el equipo de soporte analiza las tendencias de los tickets e inicia un rediseño de la lógica de escalado del servicio de IA para reducir los contactos repetidos. ¿A qué actividad del ciclo de vida pertenece este trabajo de mejora? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Discover and Design, because redesigning service logic based on operational insights loops back into the design activity. `<<KEY` |
| **a** ES | Descubrir y Diseñar, porque rediseñar la lógica del servicio basándose en los conocimientos operativos retroalimenta la actividad de diseño. `<<KEY` |
| **b** EN | Transition and Operate, because changing live service behaviour is an operational adjustment managed within that activity. |
| **b** ES | Transicionar y Operar, porque cambiar el comportamiento del servicio en vivo es un ajuste operativo gestionado dentro de esa actividad. |
| **c** EN | Acquire and Build, because redesigning escalation logic requires building new components, making it a build activity. |
| **c** ES | Adquirir y Construir, porque rediseñar la lógica de escalado requiere construir nuevos componentes, lo que lo convierte en una actividad de construcción. |
| **d** EN | Deliver and Support, because the improvement originates from support data and stays within that phase's scope. |
| **d** ES | Entregar y Soportar, porque la mejora se origina en los datos de soporte y permanece dentro del alcance de esa fase. |

**explanation**

| | |
|---|---|
| EN | Redesigning service logic in response to operational insights loops back into Discover and Design, where service shaping occurs. The misconception that improvement stays within Deliver and Support because it originates there ignores that continual improvement feeds back into earlier lifecycle activities rather than remaining in the phase that triggered it. |
| ES | Rediseñar la lógica del servicio en respuesta a los conocimientos operativos retroalimenta Descubrir y Diseñar, donde ocurre la configuración del servicio. El error conceptual de que la mejora permanece en Entregar y Soportar porque se origina allí ignora que la mejora continua retroalimenta las actividades anteriores del ciclo de vida en lugar de quedarse en la fase que la desencadenó. |

### 18. AISM-I · 5.2 · `68b563c0-803d-47a1-9cca-256b8efb3b2e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.2: Explain accountability when an AI agent takes a service action - who remains answerable.

**stem**

| | |
|---|---|
| EN | A supervisor approves an AI agent's recommended service action. The agent then executes it incorrectly, causing an outage. Where does accountability reside? |
| ES | Un supervisor aprueba la acción de servicio recomendada por un agente de IA. Luego, el agente la ejecuta incorrectamente, causando una interrupción del servicio. ¿Dónde reside la responsabilidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Split between the supervisor and vendor, because human approval and vendor code each contributed to the error. |
| **a** ES | Dividida entre el supervisor y el proveedor, porque la aprobación humana y el código del proveedor contribuyeron al error. |
| **b** EN | With the AI vendor, because a post-approval execution failure indicates a product defect. |
| **b** ES | En el proveedor de IA, porque un fallo en la ejecución posterior a la aprobación indica un defecto del producto. |
| **c** EN | With the AI agent, because execution errors after human approval become the agent's sole responsibility. |
| **c** ES | En el agente de IA, porque los errores de ejecución tras la aprobación humana son responsabilidad exclusiva del agente. |
| **d** EN | With the supervisor and organization, because approval does not transfer accountability to the agent. `<<KEY` |
| **d** ES | En el supervisor y la organización, porque la aprobación no transfiere la responsabilidad al agente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Approving an agent's recommended action does not shift accountability to the agent for what happens during execution; agents cannot be held answerable. The supervisor and organization remain accountable because they authorized the action and bear responsibility for the system they deployed. |
| ES | Aprobar la acción recomendada por un agente no traslada la responsabilidad al agente por lo que ocurre durante la ejecución; los agentes no pueden ser considerados responsables. El supervisor y la organización siguen siendo responsables porque autorizaron la acción y son responsables del sistema que desplegaron. |

### 19. SM-AI-I · 4.2 · `237f2d05-0dd3-4951-b59b-2fd76a6ee477`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.2: Explain the Product Backlog as an emergent, ordered list owned by the PO

**stem**

| | |
|---|---|
| EN | A Scrum Team's Product Backlog contains only feature requests. Developers want to add technical debt items. What belongs in the Product Backlog? |
| ES | El Product Backlog de un Scrum Team contiene únicamente solicitudes de funcionalidades. Los desarrolladores quieren agregar elementos de deuda técnica. ¿Qué pertenece al Product Backlog? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Non-functional requirements and features; bugs and technical debt stay in a technical log. |
| **a** ES | Requisitos no funcionales y funcionalidades; los errores y la deuda técnica se registran en un log técnico separado. |
| **b** EN | Only items the Product Owner has estimated and formally approved for inclusion. |
| **b** ES | Solo los elementos que el Product Owner ha estimado y aprobado formalmente para su inclusión. |
| **c** EN | All work needed to improve the product: features, bugs, technical debt, and non-functional items. `<<KEY` |
| **c** ES | Todo el trabajo necesario para mejorar el producto: funcionalidades, errores, deuda técnica y elementos no funcionales. `<<KEY` |
| **d** EN | Only features and bugs; technical debt is tracked separately by developers. |
| **d** ES | Solo funcionalidades y errores; la deuda técnica es rastreada por separado por los desarrolladores. |

**explanation**

| | |
|---|---|
| EN | The Product Backlog is the single source of all work needed to improve the product, including features, bugs, technical debt, and non-functional requirements. Splitting these into separate backlogs violates the single-source principle and fragments transparency. |
| ES | El Product Backlog es la única fuente de todo el trabajo necesario para mejorar el producto, incluyendo funcionalidades, errores, deuda técnica y requisitos no funcionales. Dividir estos elementos en backlogs separados viola el principio de fuente única y fragmenta la transparencia. |

### 20. SM-AI-I · 5.4 · `8190129f-97b5-4055-a653-22f81eba4bb6`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 5.4: Apply servant leadership behaviors

**stem**

| | |
|---|---|
| EN | The Product Owner frequently interrupts Developers mid-Sprint with new requests. A Scrum Master leading through service should: |
| ES | El Product Owner interrumpe frecuentemente a los Desarrolladores en medio del Sprint con nuevas solicitudes. Un Scrum Master con liderazgo de servicio debería: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Facilitate a conversation between the Product Owner and Developers to establish healthy collaboration boundaries within Scrum. `<<KEY` |
| **a** ES | Facilitar una conversación entre el Product Owner y los Desarrolladores para establecer límites de colaboración saludables dentro de Scrum. `<<KEY` |
| **b** EN | Escalate the pattern to senior management, since accountability for cross-role dynamics falls outside the Scrum Master's defined scope of responsibility. |
| **b** ES | Escalar el patrón a la alta gerencia, ya que la responsabilidad por la dinámica entre roles está fuera del alcance definido del Scrum Master. |
| **c** EN | Instruct the Product Owner to cease all mid-Sprint contact by invoking the managerial authority the Scrum Master holds under the 2020 Scrum Guide. |
| **c** ES | Instruir al Product Owner a cesar todo contacto durante el Sprint invocando la autoridad gerencial que el Scrum Master posee según la Guía Scrum 2020. |
| **d** EN | Block all Product Owner access to the Developers, because protecting the team from outside interference is the Scrum Master's foremost service obligation. |
| **d** ES | Bloquear todo acceso del Product Owner a los Desarrolladores, porque proteger al equipo de interferencias externas es la obligación de servicio más importante del Scrum Master. |

**explanation**

| | |
|---|---|
| EN | Servant leadership means serving the entire Scrum Team and the organization, not shielding Developers from the Product Owner. Facilitating healthy collaboration boundaries addresses the dysfunction while respecting all parties. Blocking Product Owner access misframes the Scrum Master's service obligation as one-sided protection rather than whole-team support. Escalating to senior management misplaces accountability that the Scrum Master is expected to handle directly. Claiming managerial authority misreads the 2020 Scrum Guide, which grants the Scrum Master no such positional power. |
| ES | El liderazgo de servicio significa servir a todo el Scrum Team y a la organización, no proteger a los Desarrolladores del Product Owner. Facilitar límites de colaboración saludables aborda la disfunción respetando a todas las partes. Bloquear el acceso del Product Owner malinterpreta la obligación de servicio del Scrum Master como protección unilateral en lugar de apoyo a todo el equipo. Escalar a la alta gerencia traslada incorrectamente una responsabilidad que se espera que el Scrum Master maneje directamente. Reclamar autoridad gerencial malinterpreta la Guía Scrum 2020, que no otorga al Scrum Master tal poder posicional. |

### 21. SM-AI-I · 3.1 · `9ccbfc1a-7c72-426f-b3ef-cfd0a95b0ffe`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.1: State the maximum timebox for each event

**stem**

| | |
|---|---|
| EN | For a one-week Sprint, which statement correctly describes the Sprint Planning timebox? |
| ES | Para un Sprint de una semana, ¿cuál afirmación describe correctamente el timebox del Sprint Planning? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | 15 minutes, matching the Daily Scrum since both occur within a one-week Sprint |
| **a** ES | 15 minutos, igual al Daily Scrum ya que ambos ocurren dentro de un Sprint de una semana |
| **b** EN | Approximately 2 hours, proportional to the one-week Sprint length `<<KEY` |
| **b** ES | Aproximadamente 2 horas, proporcional a la duración del Sprint de una semana `<<KEY` |
| **c** EN | 8 hours, because the maximum applies equally to all Sprint lengths |
| **c** ES | 8 horas, porque el máximo aplica por igual a todas las duraciones de Sprint |
| **d** EN | 4 hours, matching the Sprint Review timebox for the same Sprint length |
| **d** ES | 4 horas, igual al timebox del Sprint Review para la misma duración de Sprint |

**explanation**

| | |
|---|---|
| EN | Sprint Planning scales proportionally: 8 hours for a one-month Sprint means roughly 2 hours for a one-week Sprint. The fixed-8-hours option reflects a misconception that the timebox does not scale. The 4-hour option confuses Sprint Planning with the Sprint Review maximum. Equating Sprint Planning to the Daily Scrum timebox conflates two entirely different events. |
| ES | El Sprint Planning se escala proporcionalmente: 8 horas para un Sprint de un mes equivale a aproximadamente 2 horas para un Sprint de una semana. La opción de 8 horas fijas refleja un malentendido de que el timebox no se escala. La opción de 4 horas confunde el Sprint Planning con el máximo del Sprint Review. Equiparar el Sprint Planning al timebox del Daily Scrum confunde dos eventos completamente diferentes. |

### 22. SM-AI-I · 5.7 · `2e91e172-5340-4069-83df-cea80edbc930`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.7: Translate between legacy training terminology and the 2020 Scrum Guide

**stem**

| | |
|---|---|
| EN | A legacy manual calls Sprint Planning, Daily Scrum, Sprint Review, and Sprint Retrospective 'ceremonies.' What does the 2020 Scrum Guide officially call them? |
| ES | Un manual antiguo llama Sprint Planning, Daily Scrum, Sprint Review y Sprint Retrospective 'ceremonias'. ¿Cómo los denomina oficialmente la Guía Scrum 2020? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Events, because the 2020 guide standardized this term, retiring 'ceremonies.' `<<KEY` |
| **a** ES | Eventos, porque la guía 2020 estandarizó este término, retirando 'ceremonias'. `<<KEY` |
| **b** EN | Meetings, because the 2020 guide reduced formality and dropped ceremony language. |
| **b** ES | Reuniones, porque la guía 2020 redujo la formalidad y eliminó el lenguaje de ceremonias. |
| **c** EN | Rituals, because the 2020 guide rebranded them to emphasize cultural habit. |
| **c** ES | Rituales, porque la guía 2020 los rebautizó para enfatizar el hábito cultural. |
| **d** EN | Ceremonies, because the 2020 guide retained that as the official collective name. |
| **d** ES | Ceremonias, porque la guía 2020 conservó ese término como nombre colectivo oficial. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide uses 'events' as the official term for all four occurrences; 'ceremonies' is legacy training language not found in the guide. The number of events did not change — the shift was a deliberate terminology standardization, not a reduction in occurrences. |
| ES | La Guía Scrum 2020 utiliza 'eventos' como término oficial para las cuatro ocurrencias; 'ceremonias' es lenguaje de capacitación heredado que no aparece en la guía. El número de eventos no cambió: el cambio fue una estandarización deliberada de terminología, no una reducción de ocurrencias. |

### 23. SM-AI-I · 3.10 · `2f2c65ec-8d0d-47a8-be53-547555c7f35f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.10: Recognize event anti-patterns

**stem**

| | |
|---|---|
| EN | Midway through Daily Scrum, a developer raises a build pipeline blocker. The team spends the remaining 12 minutes diagnosing and resolving it together. Which anti-pattern is occurring? |
| ES | A mitad del Daily Scrum, un desarrollador plantea un bloqueo en el pipeline de construcción. El equipo pasa los 12 minutos restantes diagnosticándolo y resolviéndolo en conjunto. ¿Qué antipatrón está ocurriendo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The team resolved the blocker without updating the Sprint Backlog, leaving impediment tracking incomplete. |
| **a** ES | El equipo resolvió el bloqueo sin actualizar el Sprint Backlog, dejando el seguimiento de impedimentos incompleto. |
| **b** EN | The Scrum Master failed to report the blocker's impact on velocity to management before the Daily Scrum ended. |
| **b** ES | El Scrum Master no reportó el impacto del bloqueo en la velocidad a la gerencia antes de que terminara el Daily Scrum. |
| **c** EN | Developers bypassed the Product Owner, who should triage all technical blockers before team discussion begins. |
| **c** ES | Los desarrolladores evitaron al Product Owner, quien debería clasificar todos los bloqueos técnicos antes de que comience la discusión del equipo. |
| **d** EN | The Daily Scrum is being used as a whole-team problem-solving session rather than a brief coordination event. `<<KEY` |
| **d** ES | El Daily Scrum se está utilizando como una sesión de resolución de problemas de todo el equipo en lugar de un breve evento de coordinación. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Daily Scrum is a short coordination event; blockers should be noted so the right people can address them afterward, not solved in real time by the full team. Whole-team problem-solving during the event delays everyone and defeats the 15-minute timebox. Reporting velocity impact to management is itself an anti-pattern. The Product Owner has no role triaging technical blockers. Sprint Backlog updates are a separate concern unrelated to the timebox violation described. |
| ES | El Daily Scrum es un evento de coordinación breve; los bloqueos deben señalarse para que las personas adecuadas los aborden después, no resolverse en tiempo real por todo el equipo. La resolución de problemas de todo el equipo durante el evento retrasa a todos y anula el timebox de 15 minutos. Reportar el impacto en la velocidad a la gerencia es en sí mismo un antipatrón. El Product Owner no tiene ningún rol en la clasificación de bloqueos técnicos. Las actualizaciones del Sprint Backlog son una preocupación separada, no relacionada con la violación del timebox descrita. |

### 24. SM-AI-I · 2.1 · `714cb571-3aa1-4f41-9e68-e7809dfb0f98`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.1: Define the Scrum Team's composition and size constraints

**stem**

| | |
|---|---|
| EN | Which statement about the Product Owner role is correct according to the Scrum Guide? |
| ES | ¿Cuál afirmación sobre el rol de Product Owner es correcta según la Guía de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A role shared between the Scrum Master and a senior stakeholder on smaller teams |
| **a** ES | Un rol compartido entre el Scrum Master y un stakeholder senior en equipos más pequeños |
| **b** EN | One person who is solely accountable for managing the Product Backlog `<<KEY` |
| **b** ES | Una sola persona que es la única responsable de gestionar el Product Backlog `<<KEY` |
| **c** EN | One person who may delegate full backlog authority to a Business Analyst proxy |
| **c** ES | Una sola persona que puede delegar la autoridad total sobre el backlog a un Analista de Negocio como proxy |
| **d** EN | A committee of stakeholders who collectively approve backlog decisions |
| **d** ES | Un comité de stakeholders que aprueba colectivamente las decisiones sobre el backlog |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide is explicit that the Product Owner is one person, not a committee, and is solely accountable for the Product Backlog. While the Product Owner may collaborate with stakeholders, authority cannot be delegated to a proxy or shared with another role. |
| ES | La Guía de Scrum es explícita en que el Product Owner es una sola persona, no un comité, y es el único responsable del Product Backlog. Aunque el Product Owner puede colaborar con los stakeholders, la autoridad no puede delegarse a un proxy ni compartirse con otro rol. |

### 25. SM-AI-I · 5.5 · `f02f62e3-51eb-448e-bda1-d4cd2c464f1f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.5: Recognize psychological safety and how SM behavior affects it

**stem**

| | |
|---|---|
| EN | A team of two years reports high satisfaction, yet junior members defer silently to seniors in every Sprint Review. What does this most likely indicate? |
| ES | Un equipo con dos años de antigüedad reporta alta satisfacción, pero los miembros junior se deferentan silenciosamente a los seniors en cada Sprint Review. ¿Qué indica esto con mayor probabilidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Long tenure has produced sufficient safety; the silence reflects genuine agreement, not suppression. |
| **a** ES | La larga trayectoria ha producido suficiente seguridad; el silencio refleja un acuerdo genuino, no supresión. |
| **b** EN | High satisfaction confirms safety is present; status-based deference is normal in self-managing teams. |
| **b** ES | La alta satisfacción confirma que la seguridad está presente; la deferencia basada en estatus es normal en equipos autogestionados. |
| **c** EN | Safety has eroded due to low morale; restoring job satisfaction will rebalance participation. |
| **c** ES | La seguridad se ha erosionado debido a la baja moral; restaurar la satisfacción laboral reequilibrará la participación. |
| **d** EN | Safety has not emerged despite tenure and satisfaction; it requires deliberate cultivation of shared norms. `<<KEY` |
| **d** ES | La seguridad no ha surgido a pesar de la trayectoria y la satisfacción; requiere el cultivo deliberado de normas compartidas. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Psychological safety does not develop automatically with time or satisfaction — Edmondson's research shows it requires active cultivation through leader behavior and explicit norms. High satisfaction is a separate construct; a team can be satisfied yet still suppress dissent due to status hierarchies. Silence in the presence of seniors is a recognized sign of low safety, not evidence of genuine consensus. |
| ES | La seguridad psicológica no se desarrolla automáticamente con el tiempo o la satisfacción; la investigación de Edmondson muestra que requiere un cultivo activo a través del comportamiento del líder y normas explícitas. La alta satisfacción es un constructo separado; un equipo puede estar satisfecho y aun así suprimir el disenso debido a jerarquías de estatus. El silencio en presencia de personas de mayor rango es un signo reconocido de baja seguridad, no evidencia de consenso genuino. |

### 26. SM-AI-I · 5.1 · `56bd3157-a868-4563-b077-bbe6b8a813f2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.1: Identify impediments and choose removal strategies

**stem**

| | |
|---|---|
| EN | A shared test environment is frequently unavailable, slowing but not fully blocking the team. What should the Scrum Master do? |
| ES | Un entorno de pruebas compartido no está disponible con frecuencia, lo que ralentiza pero no bloquea completamente al equipo. ¿Qué debe hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Ignore it until the environment is completely unavailable, since partial progress means no impediment exists. |
| **a** ES | Ignorarlo hasta que el entorno esté completamente no disponible, ya que el progreso parcial significa que no existe ningún impedimento. |
| **b** EN | Add it to the Sprint Backlog as a task so the team can track and resolve it alongside user stories. |
| **b** ES | Agregarlo al Sprint Backlog como una tarea para que el equipo pueda rastrearlo y resolverlo junto con las historias de usuario. |
| **c** EN | Wait for the Sprint Retrospective, since impediment management belongs in that ceremony. |
| **c** ES | Esperar al Sprint Retrospective, ya que la gestión de impedimentos corresponde a esa ceremonia. |
| **d** EN | Treat it as an impediment and work to resolve it, since slowdowns that reduce flow qualify. `<<KEY` |
| **d** ES | Tratarlo como un impedimento y trabajar para resolverlo, ya que las ralentizaciones que reducen el flujo califican como tal. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Impediments include any friction that reduces team effectiveness, not only complete blockers. Waiting for a full stop, logging it as a Sprint Backlog task, or deferring to the Retrospective all delay removal and misrepresent how impediment management works. |
| ES | Los impedimentos incluyen cualquier fricción que reduzca la efectividad del equipo, no solo los bloqueos completos. Esperar a que el trabajo se detenga por completo, registrarlo como una tarea en el Sprint Backlog o diferirlo al Sprint Retrospective retrasa la eliminación del impedimento y representa incorrectamente cómo funciona la gestión de impedimentos. |

### 27. SM-AI-I · 5.7 · `cc9426e4-7b21-4293-8432-2d73a8fc97bb`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.7: Translate between legacy training terminology and the 2020 Scrum Guide

**stem**

| | |
|---|---|
| EN | A legacy training manual labels the Scrum Master a 'servant-leader.' How does the 2020 Scrum Guide treat this term? |
| ES | Un manual de capacitación antiguo etiqueta al Scrum Master como 'líder-servidor'. ¿Cómo trata la Guía Scrum 2020 este término? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It removed the term because servant-leadership conflicts with Scrum's self-managing principles. |
| **a** ES | Eliminó el término porque el liderazgo-servidor entra en conflicto con los principios de autogestión de Scrum. |
| **b** EN | It replaced 'servant-leader' with 'true leader' — making 'servant-leader' outdated terminology. `<<KEY` |
| **b** ES | Reemplazó 'líder-servidor' por 'verdadero líder', convirtiendo a 'líder-servidor' en terminología obsoleta. `<<KEY` |
| **c** EN | It retained 'servant-leader' as the official label, so the term remains current. |
| **c** ES | Conservó 'líder-servidor' como la etiqueta oficial, por lo que el término sigue siendo vigente. |
| **d** EN | It dropped 'servant' to signal the Scrum Master now holds formal authority over the team. |
| **d** ES | Eliminó 'servidor' para indicar que el Scrum Master ahora tiene autoridad formal sobre el equipo. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide replaced 'servant-leader' with 'true leader,' so 'servant-leader' is now legacy language, not current official terminology. Retaining 'servant-leader' as the official label is incorrect — the Guide explicitly changed the wording. Granting the Scrum Master formal authority contradicts the Guide; the role has no authority over the team. Claiming servant-leadership conflicts with self-management is a plausible-sounding but false rationale — the Guide's intent was to broaden the leadership framing, not to reject service. |
| ES | La Guía Scrum 2020 reemplazó 'líder-servidor' por 'verdadero líder', por lo que 'líder-servidor' es ahora terminología obsoleta y no la terminología oficial actual. Conservar 'líder-servidor' como la etiqueta oficial es incorrecto: la Guía cambió explícitamente la redacción. Otorgar al Scrum Master autoridad formal contradice la Guía; el rol no tiene autoridad sobre el equipo. Afirmar que el liderazgo-servidor entra en conflicto con la autogestión es una justificación que suena plausible pero es falsa: la intención de la Guía fue ampliar el enfoque de liderazgo, no rechazar el servicio. |

### 28. SM-AI-I · 5.7 · `94dbb043-badf-4cfe-b11d-20a6dffafe42`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.7: Translate between legacy training terminology and the 2020 Scrum Guide

**stem**

| | |
|---|---|
| EN | A trainer argues that dropping 'servant' means the Scrum Master now holds authority to make final decisions on process disputes. Which statement best identifies this claim? |
| ES | Un instructor argumenta que eliminar 'servidor' significa que el Scrum Master ahora tiene autoridad para tomar decisiones finales sobre disputas de proceso. ¿Cuál enunciado identifica mejor esta afirmación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Inaccurate; the 2020 guide transferred process authority from the Scrum Master to Developers. |
| **a** ES | Inexacta; la guía 2020 transfirió la autoridad sobre el proceso del Scrum Master a los Developers. |
| **b** EN | A misreading; 'true leader' still describes a service-oriented, non-authoritative stance. `<<KEY` |
| **b** ES | Una mala interpretación; 'verdadero líder' sigue describiendo una postura orientada al servicio y no autoritaria. `<<KEY` |
| **c** EN | Accurate; removing 'servant' upgraded the Scrum Master to a formal decision-making authority. |
| **c** ES | Exacta; eliminar 'servidor' elevó al Scrum Master a una autoridad formal de toma de decisiones. |
| **d** EN | Partially accurate; the Scrum Master gained authority over process but not product decisions. |
| **d** ES | Parcialmente exacta; el Scrum Master obtuvo autoridad sobre el proceso pero no sobre las decisiones de producto. |

**explanation**

| | |
|---|---|
| EN | Replacing 'servant-leader' with 'true leader' did not grant the Scrum Master managerial or decision-making authority; the role remains service-oriented. The word change was a terminology refinement, not a structural authority shift. |
| ES | Reemplazar 'líder servidor' por 'verdadero líder' no otorgó al Scrum Master autoridad gerencial ni de toma de decisiones; el rol sigue orientado al servicio. El cambio de término fue un refinamiento de terminología, no un cambio estructural de autoridad. |

### 29. SM-AI-I · 3.7 · `bb2fe83e-6721-4525-930c-71b7f31e2e60`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.7: Identify when a Sprint can be canceled and by whom

**stem**

| | |
|---|---|
| EN | Under what condition does the Scrum Guide permit a Sprint to be cancelled? |
| ES | ¿Bajo qué condición permite la Guía de Scrum cancelar un Sprint? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The team cannot complete all Sprint Backlog items before the timebox ends. |
| **a** ES | El equipo no puede completar todos los elementos del Sprint Backlog antes de que termine el tiempo establecido. |
| **b** EN | The Developers' chosen technical approach proves incorrect or inefficient mid-Sprint. |
| **b** ES | El enfoque técnico elegido por los Developers resulta incorrecto o ineficiente a mitad del Sprint. |
| **c** EN | The Sprint Goal becomes obsolete due to changed circumstances or direction. `<<KEY` |
| **c** ES | El Sprint Goal se vuelve obsoleto debido a cambios en las circunstancias o en la dirección. `<<KEY` |
| **d** EN | A higher-priority feature arrives that was not anticipated in Sprint Planning. |
| **d** ES | Llega una funcionalidad de mayor prioridad que no fue anticipada en el Sprint Planning. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide specifies that a Sprint may be cancelled only when the Sprint Goal becomes obsolete — an event the Guide notes is rare. Failing to complete all Sprint Backlog items, receiving a new high-priority feature request, or discovering a flawed technical approach are not grounds for cancellation; the team is expected to adapt within the Sprint instead. |
| ES | La Guía de Scrum especifica que un Sprint solo puede cancelarse cuando el Sprint Goal se vuelve obsoleto, un evento que la Guía señala como poco frecuente. No completar todos los elementos del Sprint Backlog, recibir una nueva solicitud de funcionalidad de alta prioridad o descubrir un enfoque técnico defectuoso no son motivos para la cancelación; se espera que el equipo se adapte dentro del Sprint en su lugar. |

### 30. SM-AI-I · 2.10 · `96e732ab-64db-473a-9466-0030b9ce9e2e`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.10: Explain how AI agents participate in a Scrum Team as tools, and which accountabilities must remain human

**stem**

| | |
|---|---|
| EN | A Product Owner approves every AI recommendation engine suggestion without independent review. Where does Product Owner accountability lie? |
| ES | Un Product Owner aprueba cada sugerencia de un motor de recomendaciones de IA sin revisión independiente. ¿Dónde recae la responsabilidad del Product Owner? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The AI shares accountability for ordering because it makes the substantive prioritization decisions each Sprint. |
| **a** ES | La IA comparte la responsabilidad de ordenamiento porque toma las decisiones sustantivas de priorización en cada Sprint. |
| **b** EN | The team can update its working agreements to recognize the AI as co-Product Owner for ordering decisions. |
| **b** ES | El equipo puede actualizar sus acuerdos de trabajo para reconocer a la IA como co-Product Owner en las decisiones de ordenamiento. |
| **c** EN | Accountability remains entirely with the human Product Owner, who is responsible for every ordering choice made. `<<KEY` |
| **c** ES | La responsabilidad recae completamente en el Product Owner humano, quien es responsable de cada decisión de ordenamiento tomada. `<<KEY` |
| **d** EN | Accountability transfers to the AI once the Product Owner stops exercising independent judgment over its outputs. |
| **d** ES | La responsabilidad se transfiere a la IA una vez que el Product Owner deja de ejercer juicio independiente sobre sus resultados. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide places Product Owner accountability solely with a person. An AI recommendation engine is a decision-support tool, and the human Product Owner is accountable for every ordering choice regardless of how those choices are generated. Saying the AI shares accountability conflates influence over a decision with responsibility for it. Saying accountability transfers when a human rubber-stamps outputs misunderstands how Scrum assigns responsibility. Working agreements cannot reassign Scrum accountabilities to a non-human entity. |
| ES | La Guía Scrum sitúa la responsabilidad del Product Owner únicamente en una persona. Un motor de recomendaciones de IA es una herramienta de apoyo a la toma de decisiones, y el Product Owner humano es responsable de cada decisión de ordenamiento independientemente de cómo se generen esas decisiones. Afirmar que la IA comparte la responsabilidad confunde la influencia sobre una decisión con la responsabilidad por ella. Afirmar que la responsabilidad se transfiere cuando un humano aprueba automáticamente los resultados malinterpreta cómo Scrum asigna la responsabilidad. Los acuerdos de trabajo no pueden reasignar las responsabilidades de Scrum a una entidad no humana. |

### 31. SM-AI-I · 2.9 · `2ffcad50-58e8-4714-a374-87ec9c22fe01`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.9: Recognize that "Developer" applies to any team member, not just software engineers

**stem**

| | |
|---|---|
| EN | According to the 2020 Scrum Guide, can a Scrum Master also hold the Developer accountability on the same team? |
| ES | Según la Guía Scrum 2020, ¿puede un Scrum Master también tener la responsabilidad de Developer en el mismo equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Yes, but only after the Product Owner formally approves the dual accountability. |
| **a** ES | Sí, pero solo después de que el Product Owner apruebe formalmente la doble responsabilidad. |
| **b** EN | Yes, though the guide notes this can create a conflict of focus requiring careful attention. `<<KEY` |
| **b** ES | Sí, aunque la guía señala que esto puede generar un conflicto de enfoque que requiere atención cuidadosa. `<<KEY` |
| **c** EN | No, because facilitation and delivery work are defined as incompatible accountabilities. |
| **c** ES | No, porque la facilitación y el trabajo de entrega se definen como responsabilidades incompatibles. |
| **d** EN | No, because combining two accountabilities always creates a disqualifying conflict of interest. |
| **d** ES | No, porque combinar dos responsabilidades siempre crea un conflicto de interés descalificador. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide acknowledges that a Scrum Master can also work as a Developer on the same team, while noting this can create a conflict of focus. The guide does not prohibit the combination, does not require Product Owner approval, and does not declare the accountabilities incompatible — it simply cautions that the dual role demands careful attention. |
| ES | La Guía Scrum 2020 reconoce que un Scrum Master también puede trabajar como Developer en el mismo equipo, aunque señala que esto puede generar un conflicto de enfoque. La guía no prohíbe la combinación, no requiere la aprobación del Product Owner y no declara las responsabilidades incompatibles; simplemente advierte que el doble rol exige atención cuidadosa. |

### 32. SM-AI-I · 2.9 · `5738236e-f2fd-4567-a7f5-4617cf07ce56`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.9: Recognize that "Developer" applies to any team member, not just software engineers

**stem**

| | |
|---|---|
| EN | According to the 2020 Scrum Guide, who holds the Developer accountability on a Scrum Team? |
| ES | Según la Guía Scrum 2020, ¿quién tiene la responsabilidad de Developer en un Scrum Team? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Only software engineers and programmers, because Developers are defined by their ability to produce working, shippable code each Sprint. |
| **a** ES | Solo los ingenieros de software y programadores, porque los Developers se definen por su capacidad de producir código funcional y entregable en cada Sprint. |
| **b** EN | Technical contributors such as engineers and testers, but excluding non-technical roles like UX designers, writers, or business analysts. |
| **b** ES | Colaboradores técnicos como ingenieros y testers, pero excluyendo roles no técnicos como diseñadores UX, redactores o analistas de negocio. |
| **c** EN | Anyone committed to creating any aspect of a usable Increment, regardless of their discipline, background, or job title. `<<KEY` |
| **c** ES | Cualquier persona comprometida con la creación de cualquier aspecto de un Increment utilizable, independientemente de su disciplina, formación o título profesional. `<<KEY` |
| **d** EN | Any specialist whose employment contract or organizational role formally designates Developer as their official job title within the company. |
| **d** ES | Cualquier especialista cuyo contrato laboral o rol organizacional designe formalmente Developer como su título oficial dentro de la empresa. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide deliberately removed all software-specific language and defines Developers as anyone committed to creating any aspect of a usable Increment, covering writers, designers, analysts, and any other discipline. Limiting the accountability to software engineers only, or to technical contributors only, or to those with a formal job title all contradict this intentionally inclusive definition. |
| ES | La Guía Scrum 2020 eliminó deliberadamente todo el lenguaje específico del software y define a los Developers como cualquier persona comprometida con la creación de cualquier aspecto de un Increment utilizable, abarcando redactores, diseñadores, analistas y cualquier otra disciplina. Limitar la responsabilidad únicamente a ingenieros de software, o solo a colaboradores técnicos, o a quienes tengan un título formal, contradice esta definición intencionalmente inclusiva. |

### 33. SM-AI-I · 4.7 · `1bbf746b-375d-4340-b3f8-9ff3c090791e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.7: Distinguish artifact transparency from artifact perfection

**stem**

| | |
|---|---|
| EN | A developer argues that tentative velocity estimates on the backlog should be hidden because they may change. How should the Scrum Master respond? |
| ES | Un desarrollador argumenta que las estimaciones de velocidad tentativas en el Product Backlog deberían ocultarse porque pueden cambiar. ¿Cómo debería responder el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Restrict backlog access until the Product Owner confirms the estimates are accurate, because unvalidated data should not be visible to stakeholders prematurely. |
| **a** ES | Restringir el acceso al Product Backlog hasta que el Product Owner confirme que las estimaciones son precisas, porque los datos no validados no deberían ser visibles para los interesados prematuramente. |
| **b** EN | Remove estimates until they stabilize, because displaying uncertain numbers erodes stakeholder confidence and undermines trust in the team's planning. |
| **b** ES | Eliminar las estimaciones hasta que se estabilicen, porque mostrar números inciertos erosiona la confianza de los interesados y socava la confianza en la planificación del equipo. |
| **c** EN | Replace numeric estimates with a written narrative, because qualitative descriptions convey the team's intent more authoritatively than figures that will change. |
| **c** ES | Reemplazar las estimaciones numéricas con una narrativa escrita, porque las descripciones cualitativas transmiten la intención del equipo con más autoridad que cifras que cambiarán. |
| **d** EN | Keep estimates visible and label them as tentative, because exposing uncertainty reflects the artifact's honest current state and supports inspection. `<<KEY` |
| **d** ES | Mantener las estimaciones visibles y etiquetarlas como tentativas, porque exponer la incertidumbre refleja el estado actual honesto del artefacto y apoya la inspección. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Estimates that may change are still part of the artifact's honest current state. Transparency requires exposing uncertainty, not hiding it. Removing estimates to manage impressions, substituting a narrative for numbers, or restricting access until the Product Owner validates figures all undermine the inspection that enables meaningful adaptation. |
| ES | Las estimaciones que pueden cambiar siguen siendo parte del estado actual honesto del artefacto. La transparencia requiere exponer la incertidumbre, no ocultarla. Eliminar estimaciones para manejar las impresiones, sustituir números por una narrativa o restringir el acceso hasta que el Product Owner valide las cifras socavan la inspección que permite una adaptación significativa. |

### 34. SM-AI-I · 3.11 · `1f07af42-66ec-42b4-b41c-a2cca7d32749`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.11: Use AI-generated signal as input to inspection without ceding the team's decision-making

**stem**

| | |
|---|---|
| EN | The Scrum Master wants to introduce AI-generated defect-trend data into the Retrospective. What is the correct approach? |
| ES | El Scrum Master quiere introducir datos de tendencias de defectos generados por IA en la Retrospective. ¿Cuál es el enfoque correcto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Restructure the agenda so AI findings are primary and team observations serve as supplementary context. |
| **a** ES | Reestructurar la agenda para que los hallazgos de IA sean primarios y las observaciones del equipo sirvan como contexto complementario. |
| **b** EN | Convert defect trends into ranked action items with assigned owners before the event starts. |
| **b** ES | Convertir las tendencias de defectos en elementos de acción priorizados con responsables asignados antes de que comience el evento. |
| **c** EN | Present defect trends as one input, then facilitate the team in interpreting what the data means. `<<KEY` |
| **c** ES | Presentar las tendencias de defectos como un insumo más y luego facilitar que el equipo interprete qué significan los datos. `<<KEY` |
| **d** EN | Share each team member's individual defect count so everyone can see their personal quality impact. |
| **d** ES | Compartir el conteo individual de defectos de cada miembro del equipo para que todos puedan ver su impacto personal en la calidad. |

**explanation**

| | |
|---|---|
| EN | AI-derived data enriches inspection when presented as one input alongside other signals; the team then interprets and decides. Pre-assigning action items removes team ownership, restructuring the agenda around AI findings displaces human observation, and sharing individual defect counts conflates transparency with individual performance surveillance. |
| ES | Los datos derivados de IA enriquecen la inspección cuando se presentan como un insumo junto con otras señales; el equipo luego interpreta y decide. Pre-asignar elementos de acción elimina la responsabilidad del equipo, reestructurar la agenda en torno a los hallazgos de IA desplaza la observación humana, y compartir conteos individuales de defectos confunde la transparencia con la vigilancia del desempeño individual. |

### 35. SM-AI-I · 2.1 · `561e88cb-8571-4a64-b37c-6247edf65d53`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.1: Define the Scrum Team's composition and size constraints

**stem**

| | |
|---|---|
| EN | A Scrum Team has grown to 14 people. According to the Scrum Guide, what is the recommended response? |
| ES | Un Scrum Team ha crecido a 14 personas. Según la Guía de Scrum, ¿cuál es la respuesta recomendada? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Keep the team intact, since the 10-person limit applies only to new teams |
| **a** ES | Mantener el equipo intacto, ya que el límite de 10 personas aplica solo a equipos nuevos |
| **b** EN | Split into a development sub-team and a testing sub-team within the same Scrum Team |
| **b** ES | Dividirse en un sub-equipo de desarrollo y un sub-equipo de pruebas dentro del mismo Scrum Team |
| **c** EN | Reorganize into multiple smaller Scrum Teams sharing the same Product Goal `<<KEY` |
| **c** ES | Reorganizarse en múltiples Scrum Teams más pequeños que compartan el mismo Product Goal `<<KEY` |
| **d** EN | Add a second Scrum Master to manage the increased coordination overhead |
| **d** ES | Agregar un segundo Scrum Master para gestionar la mayor carga de coordinación |

**explanation**

| | |
|---|---|
| EN | When a team exceeds roughly 10 people, the Scrum Guide recommends forming multiple Scrum Teams rather than creating internal sub-teams or hierarchies. Creating testing or coordination sub-teams violates the no-sub-teams principle, and the size guidance applies to all Scrum Teams regardless of their age. |
| ES | Cuando un equipo supera aproximadamente 10 personas, la Guía de Scrum recomienda formar múltiples Scrum Teams en lugar de crear sub-equipos o jerarquías internas. Crear sub-equipos de pruebas o de coordinación viola el principio de no tener sub-equipos, y la orientación sobre el tamaño aplica a todos los Scrum Teams independientemente de su antigüedad. |

### 36. SM-AI-I · 5.5 · `b8ce76a0-bcda-414a-be78-3dc56d6ff587`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.5: Recognize psychological safety and how SM behavior affects it

**stem**

| | |
|---|---|
| EN | Team members collaborate freely one-on-one but go silent in full-team ceremonies. Which analysis best distinguishes low safety from low trust as the primary barrier? |
| ES | Los miembros del equipo colaboran libremente de manera individual, pero guardan silencio en las ceremonias con todo el equipo. ¿Qué análisis distingue mejor la baja seguridad de la baja confianza como la barrera principal? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No conflict in one-on-one settings means both trust and safety are low, since healthy trust always produces open disagreement. |
| **a** ES | La ausencia de conflicto en los entornos individuales significa que tanto la confianza como la seguridad son bajas, ya que una confianza saludable siempre produce desacuerdo abierto. |
| **b** EN | Silence in ceremonies points to weak facilitation, because psychological safety is the Scrum Master's sole responsibility. |
| **b** ES | El silencio en las ceremonias apunta a una facilitación débil, porque la seguridad psicológica es responsabilidad exclusiva del Scrum Master. |
| **c** EN | Candor in dyads but silence in group settings points to low team-level safety rather than low pairwise trust. `<<KEY` |
| **c** ES | La franqueza en las interacciones diádicas pero el silencio en los entornos grupales apunta a una baja seguridad a nivel de equipo en lugar de una baja confianza entre pares. `<<KEY` |
| **d** EN | Individual work satisfaction points to low trust, because satisfaction and safety move together as constructs. |
| **d** ES | La satisfacción laboral individual apunta a baja confianza, porque la satisfacción y la seguridad se mueven juntas como constructos. |

**explanation**

| | |
|---|---|
| EN | The pattern of candor in dyads but silence in groups is the diagnostic signature Edmondson identifies for low team-level psychological safety with adequate pairwise trust. Pairwise trust governs bilateral exchanges; team-level safety governs willingness to take interpersonal risks in front of the whole group. Attributing the gap to the Scrum Master alone misframes safety as a unilateral SM responsibility rather than a shared team property. |
| ES | El patrón de franqueza en las interacciones diádicas pero silencio en los grupos es la firma diagnóstica que Edmondson identifica para la baja seguridad psicológica a nivel de equipo con confianza entre pares adecuada. La confianza entre pares rige los intercambios bilaterales; la seguridad a nivel de equipo rige la disposición a asumir riesgos interpersonales frente a todo el grupo. Atribuir la brecha únicamente al Scrum Master enmarca erróneamente la seguridad como una responsabilidad unilateral del Scrum Master en lugar de una propiedad compartida del equipo. |

### 37. SM-AI-I · 1.4 · `fbd6ee9c-5b45-4828-84b8-5306d4236317`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.4: Distinguish complex problems suited to Scrum from problems suited to predictive approaches

**stem**

| | |
|---|---|
| EN | A team proposes using Scrum to build a machine-learning recommendation engine where user behavior is unknown and model accuracy can only be validated through live experimentation. What should the team do? |
| ES | Un equipo propone usar Scrum para construir un motor de recomendación de aprendizaje automático donde el comportamiento del usuario es desconocido y la precisión del modelo solo puede validarse mediante experimentación en vivo. ¿Qué debería hacer el equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Use a predictive plan—collecting enough behavioral data upfront will eventually make requirements fully knowable. |
| **a** ES | Usar un plan predictivo: recopilar suficientes datos de comportamiento de antemano eventualmente hará que los requisitos sean completamente conocibles. |
| **b** EN | Use Scrum—unknown behavior and live-only validation signal a complex domain where probe-sense-respond is appropriate. `<<KEY` |
| **b** ES | Usar Scrum: el comportamiento desconocido y la validación solo en vivo indican un dominio complejo donde explorar-percibir-responder es apropiado. `<<KEY` |
| **c** EN | Use a predictive plan—empirical process means gathering metrics to forecast outcomes, the same as data-driven prediction. |
| **c** ES | Usar un plan predictivo: el proceso empírico significa recopilar métricas para pronosticar resultados, lo mismo que la predicción basada en datos. |
| **d** EN | Use Scrum only as a fallback—skilled data scientists with enough time could plan the full solution upfront. |
| **d** ES | Usar Scrum solo como alternativa: científicos de datos capacitados con suficiente tiempo podrían planificar la solución completa de antemano. |

**explanation**

| | |
|---|---|
| EN | Unknown patterns that only reveal themselves through live use define the complex domain; iterative experimentation via Scrum is the correct response. Collecting data upfront does not resolve unknowability when cause-and-effect only emerges through real use. Scrum is not a fallback—it is the appropriate method when the domain is complex. Empirical process control means inspecting real outcomes to adapt direction, not building a predictive model from historical data. |
| ES | Los patrones desconocidos que solo se revelan a través del uso en vivo definen el dominio complejo; la experimentación iterativa mediante Scrum es la respuesta correcta. Recopilar datos de antemano no resuelve la imposibilidad de conocer cuando la causa y el efecto solo emergen a través del uso real. Scrum no es una alternativa de respaldo, es el método apropiado cuando el dominio es complejo. El control de proceso empírico significa inspeccionar resultados reales para adaptar la dirección, no construir un modelo predictivo a partir de datos históricos. |

### 38. SM-AI-I · 5.2 · `0aa2edf8-f3b5-4a9e-b549-442c762b369d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.2: Distinguish impediments from problems the team should resolve themselves

**stem**

| | |
|---|---|
| EN | A team cannot access a required third-party API for two Sprints because a vendor contract is pending legal approval. What should the Scrum Master do? |
| ES | Un equipo no puede acceder a una API de terceros requerida durante dos Sprints porque un contrato con un proveedor está pendiente de aprobación legal. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Raise it only if it persists a third Sprint; one or two Sprints of delay does not yet qualify as an impediment. |
| **a** ES | Plantearlo solo si persiste un tercer Sprint; uno o dos Sprints de retraso aún no califican como un impedimento. |
| **b** EN | Inform the Product Owner that vendor blockers fall under product ownership, not Scrum Master scope. |
| **b** ES | Informar al Product Owner que los bloqueos de proveedores corresponden a la responsabilidad del producto, no al alcance del Scrum Master. |
| **c** EN | Wait for the team to escalate it; self-managing teams should solve their own problems before involving the SM. |
| **c** ES | Esperar a que el equipo lo escale; los equipos autogestionados deben resolver sus propios problemas antes de involucrar al Scrum Master. |
| **d** EN | Treat it as an impediment and engage the appropriate organizational stakeholders to remove it. `<<KEY` |
| **d** ES | Tratarlo como un impedimento e involucrar a los interesados organizacionales apropiados para eliminarlo. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | An external blocker beyond the team's authority to resolve is a true impediment the Scrum Master must actively remove. Waiting for the team to escalate ignores the SM's accountability. Duration thresholds do not define impediments; the team's inability to resolve the issue does. Vendor contract blockers are not exclusively a Product Owner concern. |
| ES | Un bloqueo externo que está fuera de la autoridad del equipo para resolver es un verdadero impedimento que el Scrum Master debe eliminar activamente. Esperar a que el equipo lo escale ignora la responsabilidad del Scrum Master. Los umbrales de duración no definen los impedimentos; lo que los define es la incapacidad del equipo para resolver el problema. Los bloqueos por contratos con proveedores no son una preocupación exclusiva del Product Owner. |

### 39. SM-AI-I · 4.14 · `c2c2a2fe-a4da-4345-a212-f561ae9e76a8`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.14: Diagnose why a team that runs the events correctly is still not adapting

**stem**

| | |
|---|---|
| EN | A Scrum Master responds to a stagnant team by introducing a weekly management dashboard and a mid-Sprint metrics review. Two Sprints pass with no behavioral change. Why did this intervention most likely fail? |
| ES | Un Scrum Master responde a un equipo estancado introduciendo un panel de control semanal para la gerencia y una revisión de métricas a mitad del Sprint. Dos Sprints después no hay ningún cambio de comportamiento. ¿Por qué esta intervención probablemente falló? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It added reporting for external observers rather than empowering the team to inspect its own work and adapt. `<<KEY` |
| **a** ES | Agregó reportes para observadores externos en lugar de empoderar al equipo para que inspeccionara su propio trabajo y se adaptara. `<<KEY` |
| **b** EN | The intervention was sound but premature; teams need at least four Sprints of data before adapting is meaningful. |
| **b** ES | La intervención era correcta pero prematura; los equipos necesitan al menos cuatro Sprints de datos antes de que la adaptación sea significativa. |
| **c** EN | Mid-Sprint inspection is premature; meaningful adaptation requires waiting until the Sprint Review boundary. |
| **c** ES | La inspección a mitad del Sprint es prematura; la adaptación significativa requiere esperar hasta el límite del Sprint Review. |
| **d** EN | Management dashboards must be paired with an updated Definition of Done to make quality problems transparent. |
| **d** ES | Los paneles de control gerenciales deben ir acompañados de un Definition of Done actualizado para hacer transparentes los problemas de calidad. |

**explanation**

| | |
|---|---|
| EN | Restoring empiricism requires the team itself to inspect and adapt with genuine accountability — not more reporting routed to management. Directing information upward bypasses the team's self-management and does nothing to close the adaptation loop. Inspection is not restricted to Sprint boundaries; the Daily Scrum exists precisely for mid-Sprint inspection and adaptation. |
| ES | Restaurar el empirismo requiere que el propio equipo inspeccione y se adapte con responsabilidad genuina, no más reportes dirigidos a la gerencia. Dirigir la información hacia arriba evita la autogestión del equipo y no cierra el ciclo de adaptación. La inspección no está restringida a los límites del Sprint; el Daily Scrum existe precisamente para la inspección y adaptación a mitad del Sprint. |

### 40. SM-AI-I · 3.10 · `f8df6e37-adc2-48cf-8bee-b0a8d697f8b0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.10: Recognize event anti-patterns

**stem**

| | |
|---|---|
| EN | At Sprint Review, the Product Owner formally accepts or rejects each story before the next is shown. Stakeholders observe but do not discuss backlog priorities. What is the core anti-pattern? |
| ES | En el Sprint Review, el Product Owner acepta o rechaza formalmente cada historia antes de mostrar la siguiente. Los interesados observan pero no discuten las prioridades del Product Backlog. ¿Cuál es el antipatrón central? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Reviewing stories one at a time in a sequential approval format consumes disproportionate time and violates the Sprint Review's prescribed timebox constraint. |
| **a** ES | Revisar historias de una en una en un formato de aprobación secuencial consume tiempo de manera desproporcionada y viola la restricción de timebox prescrita del Sprint Review. |
| **b** EN | The Product Owner is acting as a gatekeeper who approves or rejects individual items rather than facilitating collaborative inspection and joint backlog adaptation with stakeholders. `<<KEY` |
| **b** ES | El Product Owner actúa como guardián que aprueba o rechaza elementos individuales en lugar de facilitar la inspección colaborativa y la adaptación conjunta del Product Backlog con los interesados. `<<KEY` |
| **c** EN | Stakeholders are present but kept silent, so the increment must be re-demonstrated at a dedicated stakeholder session to satisfy the event's collaborative intent. |
| **c** ES | Los interesados están presentes pero en silencio, por lo que el Increment debe volver a demostrarse en una sesión dedicada a los interesados para satisfacer la intención colaborativa del evento. |
| **d** EN | Developers are presenting the increment and fielding stakeholder questions directly, bypassing the Product Owner's role as the sole communication channel for feedback. |
| **d** ES | Los desarrolladores están presentando el Increment y respondiendo preguntas de los interesados directamente, evitando el rol del Product Owner como único canal de comunicación para la retroalimentación. |

**explanation**

| | |
|---|---|
| EN | The Sprint Review is not a formal acceptance gate where the Product Owner approves or rejects individual items. Its purpose is collaborative inspection of the increment and joint adaptation of the Product Backlog with stakeholders. Treating it as a per-item sign-off session eliminates the forward-looking backlog discussion that gives the event its value. Stakeholder silence is a related concern but is secondary to the gatekeeper role described. No separate stakeholder meeting is prescribed by Scrum, and developers communicating directly with stakeholders is normal and expected. |
| ES | El Sprint Review no es una puerta de aceptación formal donde el Product Owner aprueba o rechaza elementos individuales. Su propósito es la inspección colaborativa del Increment y la adaptación conjunta del Product Backlog con los interesados. Tratarlo como una sesión de firma por elemento elimina la discusión prospectiva del Product Backlog que le da valor al evento. El silencio de los interesados es una preocupación relacionada, pero es secundaria al rol de guardián descrito. Scrum no prescribe ninguna reunión separada con interesados, y que los desarrolladores se comuniquen directamente con los interesados es normal y esperado. |


---

# B. The remaining 302

Same rendering. Section A and section B together are the 342, with no overlap.

### 41. AIE-I · 1.1 · `0bf3f292-fab7-433a-9bd1-7b53675e944e`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.1: Distinguish artificial intelligence from ordinary software and automation

**stem**

| | |
|---|---|
| EN | A team is told their email-subject-line tool 'understands what customers want' just like a human copywriter. Which classification of that claim is most accurate? |
| ES | A un equipo se le dice que su herramienta de líneas de asunto de correos electrónicos 'entiende lo que los clientes quieren' igual que un redactor humano. ¿Cuál es la clasificación más precisa de esa afirmación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Overstated, because the tool matches learned patterns but does not genuinely comprehend or intend anything. `<<KEY` |
| **a** ES | Exagerada, porque la herramienta coincide con patrones aprendidos pero no comprende ni tiene intención genuina de nada. `<<KEY` |
| **b** EN | Overstated, because the tool cannot be AI unless it handles tasks beyond subject-line generation without retraining. |
| **b** ES | Exagerada, porque la herramienta no puede ser IA a menos que maneje tareas más allá de la generación de líneas de asunto sin reentrenamiento. |
| **c** EN | Accurate, because outputs indistinguishable from human work prove the tool has human-like understanding. |
| **c** ES | Precisa, porque los resultados indistinguibles del trabajo humano demuestran que la herramienta tiene una comprensión similar a la humana. |
| **d** EN | Accurate, because AI trained on human-generated data acquires genuine comprehension over time. |
| **d** ES | Precisa, porque la IA entrenada con datos generados por humanos adquiere comprensión genuina con el tiempo. |

**explanation**

| | |
|---|---|
| EN | AI performs tasks associated with human intelligence — such as generating persuasive text — but does so by matching patterns in data, not through genuine comprehension or intent. Impressive output quality does not imply understanding, and narrow task focus does not disqualify a system from being AI. |
| ES | La IA realiza tareas asociadas con la inteligencia humana —como generar texto persuasivo— pero lo hace haciendo coincidir patrones en los datos, no mediante comprensión o intención genuinas. La calidad impresionante de los resultados no implica comprensión, y el enfoque en tareas específicas no descalifica a un sistema de ser IA. |

### 42. AIE-I · 1.1 · `3c38985f-69d7-40ba-93a4-ddad7bc444a3`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.1: Distinguish artificial intelligence from ordinary software and automation

**stem**

| | |
|---|---|
| EN | One tool routes support tickets using fixed priority rules; another predicts ticket urgency from historical resolution data. Which statement correctly categorizes both? |
| ES | Una herramienta enruta tickets de soporte usando reglas de prioridad fijas; otra predice la urgencia de los tickets a partir de datos históricos de resolución. ¿Qué afirmación categoriza correctamente a ambas? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Both are conventional software, because neither requires an internet connection to access external knowledge. |
| **a** ES | Ambas son software convencional, porque ninguna requiere una conexión a internet para acceder a conocimiento externo. |
| **b** EN | Both are AI, because both automate a decision a human would otherwise make manually. |
| **b** ES | Ambas son IA, porque las dos automatizan una decisión que un humano tomaría manualmente de otro modo. |
| **c** EN | The prediction tool is not truly AI because it focuses only on ticket urgency rather than a broad range of tasks. |
| **c** ES | La herramienta de predicción no es verdaderamente IA porque se enfoca solo en la urgencia de los tickets en lugar de una amplia gama de tareas. |
| **d** EN | The routing tool is rule-based automation; the prediction tool is AI — both types can coexist in one workflow. `<<KEY` |
| **d** ES | La herramienta de enrutamiento es automatización basada en reglas; la herramienta de predicción es IA — ambos tipos pueden coexistir en un mismo flujo de trabajo. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Rule-based automation and AI are not mutually exclusive; a workflow can include both. The routing tool applies programmer-defined priority conditions, while the prediction tool derives urgency judgments from learned patterns — making it AI. Internet connectivity and task breadth are not the distinguishing criteria. |
| ES | La automatización basada en reglas y la IA no son mutuamente excluyentes; un flujo de trabajo puede incluir ambas. La herramienta de enrutamiento aplica condiciones de prioridad definidas por el programador, mientras que la herramienta de predicción deriva juicios de urgencia a partir de patrones aprendidos, lo que la convierte en IA. La conectividad a internet y la amplitud de tareas no son los criterios de distinción. |

### 43. AIE-I · 1.1 · `459e7b2b-e7e8-4ac9-9dba-e9567a341148`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.1: Distinguish artificial intelligence from ordinary software and automation

**stem**

| | |
|---|---|
| EN | A vendor calls its document-sorting tool 'AI-powered' because it handles hundreds of file types accurately. A colleague says it just applies fixed developer-written rules. What correctly determines whether the tool is genuinely AI? |
| ES | Un proveedor llama a su herramienta de clasificación de documentos 'impulsada por IA' porque maneja cientos de tipos de archivos con precisión. Un colega dice que solo aplica reglas fijas escritas por desarrolladores. ¿Qué determina correctamente si la herramienta es genuinamente IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Whether no human was involved in writing its instructions or training process. |
| **a** ES | Si ningún humano estuvo involucrado en la escritura de sus instrucciones o en el proceso de entrenamiento. |
| **b** EN | Whether its outputs are accurate enough to match what a human expert would produce. |
| **b** ES | Si sus resultados son lo suficientemente precisos como para coincidir con lo que produciría un experto humano. |
| **c** EN | Whether it requires an internet connection to access knowledge it cannot store locally. |
| **c** ES | Si requiere una conexión a internet para acceder a conocimiento que no puede almacenar localmente. |
| **d** EN | Whether its categorization logic was learned from data rather than explicitly programmed. `<<KEY` |
| **d** ES | Si su lógica de categorización fue aprendida a partir de datos en lugar de ser explícitamente programada. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The correct criterion is whether the logic was learned from data rather than hand-coded — that is what separates AI from conventional software, regardless of how impressive the outputs appear. Matching human expert output quality does not make a rule-based system AI. Requiring an internet connection is unrelated to the AI distinction. Absence of human involvement is not the defining feature, since humans are actively involved in building and training AI systems. |
| ES | El criterio correcto es si la lógica fue aprendida a partir de datos en lugar de codificada manualmente — eso es lo que separa a la IA del software convencional, independientemente de qué tan impresionantes parezcan los resultados. Que los resultados coincidan con la calidad de un experto humano no convierte a un sistema basado en reglas en IA. Requerir una conexión a internet no está relacionado con la distinción de IA. La ausencia de participación humana no es la característica definitoria, ya que los humanos participan activamente en la construcción y el entrenamiento de sistemas de IA. |

### 44. AIE-I · 1.1 · `e6edc7e9-7841-4921-93d1-075d3353cfc6`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.1: Distinguish artificial intelligence from ordinary software and automation

**stem**

| | |
|---|---|
| EN | A spreadsheet flags invoices over a set amount for review. A second tool learns from past invoices which ones are likely fraudulent. Which statement correctly distinguishes them? |
| ES | Una hoja de cálculo marca las facturas que superan un monto determinado para su revisión. Una segunda herramienta aprende de facturas pasadas cuáles son probablemente fraudulentas. ¿Qué afirmación las distingue correctamente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The fraud tool is AI only if it can also perform unrelated tasks such as drafting emails or summarizing reports. |
| **a** ES | La herramienta de fraude es IA solo si también puede realizar tareas no relacionadas, como redactar correos electrónicos o resumir informes. |
| **b** EN | Both are automation because both produce outputs without the analyst deciding each case manually. |
| **b** ES | Ambas son automatización porque las dos producen resultados sin que el analista decida cada caso manualmente. |
| **c** EN | The spreadsheet is rule-based automation; the fraud tool is AI because it derives judgments from learned data patterns. `<<KEY` |
| **c** ES | La hoja de cálculo es automatización basada en reglas; la herramienta de fraude es IA porque deriva juicios a partir de patrones aprendidos en los datos. `<<KEY` |
| **d** EN | The spreadsheet becomes AI once the analyst adds enough conditional rules to cover all possible invoice amounts. |
| **d** ES | La hoja de cálculo se convierte en IA una vez que el analista agrega suficientes reglas condicionales para cubrir todos los montos posibles de facturas. |

**explanation**

| | |
|---|---|
| EN | The spreadsheet executes a threshold condition a person wrote; the fraud tool learned what suspicious patterns look like from historical data. That difference — explicit rules versus a learned model — separates automation from AI. Running on code is common to both, and narrow task scope does not disqualify a system from being AI. |
| ES | La hoja de cálculo ejecuta una condición de umbral que una persona escribió; la herramienta de fraude aprendió cómo se ven los patrones sospechosos a partir de datos históricos. Esa diferencia —reglas explícitas versus un modelo aprendido— separa la automatización de la IA. Ejecutarse en código es común a ambas, y el alcance limitado de tareas no descalifica a un sistema de ser IA. |

### 45. AIE-I · 1.2 · `2296004d-a28b-433a-a8b9-a9cd9f61e3d2`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.2: Distinguish machine learning and generative AI from traditional AI

**stem**

| | |
|---|---|
| EN | A spam filter studies thousands of labeled emails to learn patterns, then applies that knowledge to new messages. How do the training and inference phases differ? |
| ES | Un filtro de spam estudia miles de correos etiquetados para aprender patrones y luego aplica ese conocimiento a nuevos mensajes. ¿En qué se diferencian las fases de entrenamiento e inferencia? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Training sets initial rules on a small sample; inference expands those rules by processing the full email volume. |
| **a** ES | El entrenamiento establece reglas iniciales con una muestra pequeña; la inferencia amplía esas reglas procesando el volumen completo de correos. |
| **b** EN | Training uses labeled data to build the model; inference applies the finished model to new emails without further learning. `<<KEY` |
| **b** ES | El entrenamiento usa datos etiquetados para construir el modelo; la inferencia aplica el modelo terminado a nuevos correos sin aprendizaje adicional. `<<KEY` |
| **c** EN | Training classifies new emails; inference adjusts the filter's rules based on messages users mark as spam. |
| **c** ES | El entrenamiento clasifica nuevos correos; la inferencia ajusta las reglas del filtro según los mensajes que los usuarios marcan como spam. |
| **d** EN | Training and inference cost the same; the only difference is which team — data or IT — runs each phase. |
| **d** ES | El entrenamiento y la inferencia tienen el mismo costo; la única diferencia es qué equipo —datos o TI— ejecuta cada fase. |

**explanation**

| | |
|---|---|
| EN | Training is the resource-intensive phase where the model learns patterns from labeled data; inference is when the trained, fixed model is applied to new inputs. The two phases are not computationally equivalent — training is far more demanding. During inference the model does not continue learning or expanding its rules. |
| ES | El entrenamiento es la fase que requiere muchos recursos, donde el modelo aprende patrones a partir de datos etiquetados; la inferencia es cuando el modelo entrenado y fijo se aplica a nuevas entradas. Las dos fases no son computacionalmente equivalentes: el entrenamiento es mucho más exigente. Durante la inferencia, el modelo no continúa aprendiendo ni ampliando sus reglas. |

### 46. AIE-I · 1.2 · `3f4344b0-a91e-4cb2-84c4-61ce5c8d764b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.2: Distinguish machine learning and generative AI from traditional AI

**stem**

| | |
|---|---|
| EN | A marketing associate notices the AI writing tool sometimes states confident-sounding facts that are false. Which explanation best accounts for this behavior? |
| ES | Una asistente de marketing nota que la herramienta de escritura con IA a veces afirma con confianza hechos que son falsos. ¿Qué explicación da mejor cuenta de este comportamiento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The tool reasons dynamically with current knowledge, so confident errors indicate a software bug, not a model limit. |
| **a** ES | La herramienta razona dinámicamente con conocimiento actual, por lo que los errores confiados indican un error de software, no un límite del modelo. |
| **b** EN | The tool retrieves source documents from its training database and copies errors from those documents. |
| **b** ES | La herramienta recupera documentos fuente de su base de datos de entrenamiento y copia los errores de esos documentos. |
| **c** EN | The tool understands meaning like a human expert, so errors occur only when training data contained wrong facts. |
| **c** ES | La herramienta entiende el significado como un experto humano, por lo que los errores ocurren solo cuando los datos de entrenamiento contenían hechos incorrectos. |
| **d** EN | The tool predicts statistically likely word sequences, which can produce fluent but factually wrong statements. `<<KEY` |
| **d** ES | La herramienta predice secuencias de palabras estadísticamente probables, lo que puede producir enunciados fluidos pero factualmente incorrectos. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Generative AI produces text by predicting likely continuations based on statistical patterns, not by verifying facts or retrieving authoritative sources. This mechanism can yield fluent but incorrect outputs, commonly called hallucinations. The tool does not understand meaning the way humans do, and it does not have continuously updated knowledge — it has a training cutoff after which new information is unknown to it. |
| ES | La IA generativa produce texto prediciendo continuaciones probables basadas en patrones estadísticos, no verificando hechos ni recuperando fuentes autorizadas. Este mecanismo puede generar resultados fluidos pero incorrectos, comúnmente llamados alucinaciones. La herramienta no comprende el significado como lo hacen los humanos, y no tiene conocimiento actualizado continuamente: tiene una fecha de corte de entrenamiento después de la cual la información nueva le es desconocida. |

### 47. AIE-I · 1.2 · `98378f75-6ac2-45c9-b48c-b15d4175a13d`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.2: Distinguish machine learning and generative AI from traditional AI

**stem**

| | |
|---|---|
| EN | A finance analyst uses one AI tool to predict next quarter's sales and a second to write commentary explaining those figures. How should these tools be classified? |
| ES | Una analista financiera usa una herramienta de IA para predecir las ventas del próximo trimestre y una segunda para redactar el comentario que explica esas cifras. ¿Cómo deben clasificarse estas herramientas? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Both are traditional AI, because neither produces images or audio, which define generative AI outputs. |
| **a** ES | Ambas son IA tradicional, porque ninguna produce imágenes ni audio, que son los resultados que definen a la IA generativa. |
| **b** EN | Both are generative AI, because both produce an output — a number and a text — from an input dataset. |
| **b** ES | Ambas son IA generativa, porque ambas producen un resultado —un número y un texto— a partir de un conjunto de datos de entrada. |
| **c** EN | The prediction tool is traditional rule-based AI; the commentary tool is machine learning because it learned language patterns. |
| **c** ES | La herramienta de predicción es IA tradicional basada en reglas; la herramienta de comentarios es aprendizaje automático porque aprendió patrones del lenguaje. |
| **d** EN | The prediction tool is machine learning; the commentary tool is generative AI producing new text content. `<<KEY` |
| **d** ES | La herramienta de predicción es aprendizaje automático; la herramienta de comentarios es IA generativa que produce contenido de texto nuevo. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A tool that learns from historical data to forecast a value is machine learning used for prediction. A tool that produces written text from inputs is generative AI. Producing any output does not make a tool generative — the defining feature is creating new content such as text, images, or audio. Generative AI is not limited to images or audio, so that definition is incorrect. |
| ES | Una herramienta que aprende de datos históricos para pronosticar un valor es aprendizaje automático usado para predicción. Una herramienta que produce texto escrito a partir de entradas es IA generativa. Producir cualquier resultado no convierte a una herramienta en generativa: la característica definitoria es crear contenido nuevo como texto, imágenes o audio. La IA generativa no se limita a imágenes o audio, por lo que esa definición es incorrecta. |

### 48. AIE-I · 1.3 · `12bf4835-6813-4771-81c6-e92d887535ce`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Explain what a foundation model / large language model is at a high level

**stem**

| | |
|---|---|
| EN | A colleague asks why an AI assistant sometimes states an incorrect fact very confidently. Which explanation is most accurate? |
| ES | Un colega pregunta por qué un asistente de IA a veces afirma un hecho incorrecto con mucha confianza. ¿Cuál explicación es la más precisa? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It selected a pre-written response template that happened to contain a mistake. |
| **a** ES | Seleccionó una plantilla de respuesta predefinida que contenía un error. |
| **b** EN | It retrieved a training-data record that contained an introduced error. |
| **b** ES | Recuperó un registro de datos de entrenamiento que contenía un error introducido. |
| **c** EN | It predicted plausible-sounding tokens without any truth-verification step. `<<KEY` |
| **c** ES | Predijo tokens que sonaban plausibles sin ningún paso de verificación de veracidad. `<<KEY` |
| **d** EN | It queried an external knowledge source that was outdated at inference time. |
| **d** ES | Consultó una fuente de conocimiento externa que estaba desactualizada al momento de la inferencia. |

**explanation**

| | |
|---|---|
| EN | An LLM generates text by predicting the next most plausible tokens — a process that is truth-agnostic. It does not retrieve records from a database, consult external sources at inference time, or select from fixed pre-written responses, so confident fluency is no guarantee of factual accuracy. |
| ES | Un LLM genera texto prediciendo los siguientes tokens más plausibles, un proceso que no tiene en cuenta la veracidad. No recupera registros de una base de datos, no consulta fuentes externas al momento de la inferencia ni selecciona de respuestas predefinidas fijas, por lo que la fluidez confiada no garantiza precisión factual. |

### 49. AIE-I · 1.3 · `34c79e81-cc9b-46c7-8fe8-6732882824ba`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Explain what a foundation model / large language model is at a high level

**stem**

| | |
|---|---|
| EN | Why is it misleading to describe a large language model as 'knowing' the facts it states? |
| ES | ¿Por qué es engañoso describir a un modelo de lenguaje grande como que 'conoce' los hechos que enuncia? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Its parameters reset on a fixed schedule, expiring whatever facts it learned. |
| **a** ES | Sus parámetros se reinician en un calendario fijo, haciendo caducar los hechos que aprendió. |
| **b** EN | It only retains facts seen above a minimum frequency threshold during training. |
| **b** ES | Solo retiene hechos vistos por encima de un umbral mínimo de frecuencia durante el entrenamiento. |
| **c** EN | It grasps facts internally but cannot express them due to vocabulary constraints. |
| **c** ES | Comprende los hechos internamente pero no puede expresarlos debido a limitaciones de vocabulario. |
| **d** EN | It generates statistically likely text rather than retrieving or confirming facts. `<<KEY` |
| **d** ES | Genera texto estadísticamente probable en lugar de recuperar o confirmar hechos. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | An LLM produces plausible text through prediction, not through knowledge retrieval or verification. Saying it 'knows' facts implies a lookup or confirmation step that does not exist in how these models operate. |
| ES | Un LLM produce texto plausible mediante predicción, no mediante recuperación o verificación de conocimiento. Decir que 'conoce' hechos implica un paso de búsqueda o confirmación que no existe en la forma en que operan estos modelos. |

### 50. AIE-I · 1.3 · `4be85523-3df3-4d89-bc61-43723ed09727`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Explain what a foundation model / large language model is at a high level

**stem**

| | |
|---|---|
| EN | A sales rep hears that 'all LLMs are foundation models, but not all foundation models are LLMs.' Which statement explains this correctly? |
| ES | Un representante de ventas escucha que 'todos los LLMs son modelos de fundación, pero no todos los modelos de fundación son LLMs'. ¿Cuál enunciado explica esto correctamente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | LLMs are smaller task-specific models; foundation models are their larger counterparts. |
| **a** ES | Los LLMs son modelos más pequeños y específicos para tareas; los modelos de fundación son sus contrapartes más grandes. |
| **b** EN | Foundation models span many data types; LLMs are the text-focused subset. `<<KEY` |
| **b** ES | Los modelos de fundación abarcan muchos tipos de datos; los LLMs son el subconjunto enfocado en texto. `<<KEY` |
| **c** EN | Foundation models train on text only; LLMs extend to images and audio. |
| **c** ES | Los modelos de fundación se entrenan solo con texto; los LLMs se extienden a imágenes y audio. |
| **d** EN | The terms are interchangeable because general-purpose models train primarily on text. |
| **d** ES | Los términos son intercambiables porque los modelos de propósito general se entrenan principalmente con texto. |

**explanation**

| | |
|---|---|
| EN | Foundation model is the broader category — it includes models trained on images, audio, video, and more. LLMs are specifically the text-trained subset. The terms are not interchangeable, and it is foundation models, not LLMs, that may handle non-text modalities. |
| ES | Modelo de fundación es la categoría más amplia; incluye modelos entrenados con imágenes, audio, video y más. Los LLMs son específicamente el subconjunto entrenado con texto. Los términos no son intercambiables, y son los modelos de fundación, no los LLMs, los que pueden manejar modalidades distintas al texto. |

### 51. AIE-I · 1.4 · `0d3d18db-691f-4c60-a105-1ec7360f00c1`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.4: Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**stem**

| | |
|---|---|
| EN | A sales representative hears that an AI agent 'can use a calculator and search the web.' She concludes the tool must be an agent. What is the flaw in her reasoning? |
| ES | Una representante de ventas escucha que un agente de IA 'puede usar una calculadora y buscar en la web'. Concluye que la herramienta debe ser un agente. ¿Cuál es el error en su razonamiento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Tool use alone is insufficient; an agent is defined by goal-directed, multi-step autonomous action. `<<KEY` |
| **a** ES | El uso de herramientas por sí solo es insuficiente; un agente se define por la acción autónoma de múltiples pasos orientada a objetivos. `<<KEY` |
| **b** EN | Her reasoning is sound—any AI with web browsing capability qualifies as an agent by definition. |
| **b** ES | Su razonamiento es correcto: cualquier IA con capacidad de navegación web califica como agente por definición. |
| **c** EN | Her reasoning is sound—using external tools proves the system plans ahead and acts autonomously. |
| **c** ES | Su razonamiento es correcto: el uso de herramientas externas demuestra que el sistema planifica con anticipación y actúa de forma autónoma. |
| **d** EN | Tool use alone is insufficient; a true agent must also be built on multiple cooperating AI models. |
| **d** ES | El uso de herramientas por sí solo es insuficiente; un verdadero agente también debe estar construido sobre múltiples modelos de IA cooperantes. |

**explanation**

| | |
|---|---|
| EN | Tool use is a common feature of agents but is not the defining criterion. What makes a system an agent is goal-directed, multi-step autonomous action. A chatbot could call a calculator without being an agent. Multi-model architecture is also not a requirement. |
| ES | El uso de herramientas es una característica común de los agentes, pero no es el criterio definitorio. Lo que hace que un sistema sea un agente es la acción autónoma de múltiples pasos orientada a objetivos. Un chatbot podría llamar a una calculadora sin ser un agente. La arquitectura de múltiples modelos tampoco es un requisito. |

### 52. AIE-I · 1.4 · `2bacad60-88f7-4189-8019-f2581c0d6231`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.4: Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**stem**

| | |
|---|---|
| EN | An operations lead is told that an agentic AI tool 'plans ahead, so it almost never makes mistakes and rarely needs checking.' Which aspect of this claim is inaccurate? |
| ES | A un líder de operaciones le dicen que una herramienta de IA agéntica 'planifica con anticipación, por lo que casi nunca comete errores y rara vez necesita verificación'. ¿Qué aspecto de esta afirmación es inexacto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Planning does not guarantee accuracy; autonomous multi-step action makes checking more important, not less. `<<KEY` |
| **a** ES | La planificación no garantiza precisión; la acción autónoma de múltiples pasos hace que la verificación sea más importante, no menos. `<<KEY` |
| **b** EN | Agents are accurate only when built on multiple cooperating models; single-model agents are error-prone. |
| **b** ES | Los agentes son precisos solo cuando están construidos sobre múltiples modelos cooperantes; los agentes de un solo modelo son propensos a errores. |
| **c** EN | Agents are self-correcting by design, so human review is needed only for final outputs, not interim steps. |
| **c** ES | Los agentes se autocorrigen por diseño, por lo que la revisión humana solo es necesaria para los resultados finales, no para los pasos intermedios. |
| **d** EN | Agents do not plan ahead; they generate each step reactively, just as a chatbot does. |
| **d** ES | Los agentes no planifican con anticipación; generan cada paso de forma reactiva, igual que un chatbot. |

**explanation**

| | |
|---|---|
| EN | Agentic AI plans toward a goal but is not inherently more accurate than other AI systems. Because errors can compound across autonomous steps, human oversight is actually more critical for agents, not less. The number of underlying models does not determine error rates, and agents are not reliably self-correcting. |
| ES | La IA agéntica planifica hacia un objetivo, pero no es inherentemente más precisa que otros sistemas de IA. Dado que los errores pueden acumularse a través de pasos autónomos, la supervisión humana es en realidad más crítica para los agentes, no menos. El número de modelos subyacentes no determina las tasas de error, y los agentes no se autocorrigen de manera confiable. |

### 53. AIE-I · 1.4 · `51bbec7b-9bb2-4c5d-987c-7d58ee496c3e`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.4: Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**stem**

| | |
|---|---|
| EN | An HR coordinator reads that an AI tool 'runs in a loop, repeatedly generating text until a condition is met.' Is this tool best described as an AI agent? |
| ES | Una coordinadora de recursos humanos lee que una herramienta de IA 'se ejecuta en un bucle, generando texto repetidamente hasta que se cumple una condición'. ¿Se describe mejor esta herramienta como un agente de IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Yes—looping behavior is the defining feature that makes any AI system agentic. |
| **a** ES | Sí: el comportamiento en bucle es la característica definitoria que hace que cualquier sistema de IA sea agéntico. |
| **b** EN | No—a true agent requires physical or robotic embodiment to take real-world actions. |
| **b** ES | No: un verdadero agente requiere encarnación física o robótica para realizar acciones en el mundo real. |
| **c** EN | Not necessarily—a true agent must be built from multiple cooperating AI models, not a single looping one. |
| **c** ES | No necesariamente: un verdadero agente debe estar construido a partir de múltiples modelos de IA cooperantes, no de uno solo en bucle. |
| **d** EN | Not necessarily—looping alone is not sufficient; goal-directed planning and autonomous action define an agent. `<<KEY` |
| **d** ES | No necesariamente: el bucle por sí solo no es suficiente; la planificación orientada a objetivos y la acción autónoma definen a un agente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Looping by itself is mechanical repetition; what distinguishes an agent is that it plans toward a goal and takes autonomous actions to reach it. A single looping model without goal-directed behavior is not an agent. Physical embodiment and multi-model architecture are also not requirements. |
| ES | El bucle por sí solo es repetición mecánica; lo que distingue a un agente es que planifica hacia un objetivo y toma acciones autónomas para alcanzarlo. Un único modelo en bucle sin comportamiento orientado a objetivos no es un agente. La encarnación física y la arquitectura de múltiples modelos tampoco son requisitos. |

### 54. AIE-I · 1.4 · `8faac608-f568-4270-9a60-5b650c43892c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.4: Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**stem**

| | |
|---|---|
| EN | A team leader asks why the goals of an AI agent must still be set by a person, even though the agent acts autonomously. Which answer is most accurate? |
| ES | Un líder de equipo pregunta por qué los objetivos de un agente de IA aún deben ser establecidos por una persona, aunque el agente actúe de forma autónoma. ¿Cuál es la respuesta más precisa? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Agents only follow rigid pre-scripted instructions and cannot interpret open-ended intentions. |
| **a** ES | Los agentes solo siguen instrucciones rígidas y predefinidas y no pueden interpretar intenciones abiertas. |
| **b** EN | Agents require internet access, and a human must authorize each external connection they make. |
| **b** ES | Los agentes requieren acceso a internet, y un humano debe autorizar cada conexión externa que realicen. |
| **c** EN | Agents cannot plan without human approval at each step, so involvement is constant throughout. |
| **c** ES | Los agentes no pueden planificar sin aprobación humana en cada paso, por lo que la participación es constante en todo momento. |
| **d** EN | Agents autonomously pursue whatever goal they are given, so humans must define the right goal upfront. `<<KEY` |
| **d** ES | Los agentes persiguen de forma autónoma cualquier objetivo que se les asigne, por lo que los humanos deben definir el objetivo correcto desde el principio. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | An agent's autonomy means it will pursue its assigned goal with limited intervention, making the initial goal-setting by a human critical for ensuring the agent's actions remain appropriate and aligned. Agents do not need human approval at every step, do not follow rigid scripts only, and do not require per-connection authorization. |
| ES | La autonomía de un agente significa que perseguirá el objetivo asignado con intervención limitada, lo que hace que el establecimiento inicial del objetivo por parte de un humano sea fundamental para garantizar que las acciones del agente sean apropiadas y estén alineadas. Los agentes no necesitan aprobación humana en cada paso, no siguen solo guiones rígidos y no requieren autorización por conexión. |

### 55. AIE-I · 1.5 · `1158cdb2-458e-4914-8ce0-d1a1a345660a`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.5: Recall common AI use cases across everyday workplace functions

**stem**

| | |
|---|---|
| EN | Which scenario best illustrates appropriate AI use for text summarization in an office setting? |
| ES | ¿Cuál escenario ilustra mejor el uso apropiado de IA para el resumen de texto en un entorno de oficina? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | An AI tool issues a binding contract summary that the legal team accepts without further review. |
| **a** ES | Una herramienta de IA emite un resumen de contrato vinculante que el equipo legal acepta sin revisión adicional. |
| **b** EN | An AI tool summarizes a contract with the same expert nuance a qualified lawyer would apply. |
| **b** ES | Una herramienta de IA resume un contrato con el mismo matiz experto que aplicaría un abogado calificado. |
| **c** EN | An AI tool replaces the need to read contracts, since its summaries are trained on legal writing. |
| **c** ES | Una herramienta de IA reemplaza la necesidad de leer contratos, ya que sus resúmenes están entrenados con escritura legal. |
| **d** EN | An AI tool condenses a supplier contract into key points, which a manager then reviews for accuracy. `<<KEY` |
| **d** ES | Una herramienta de IA condensa un contrato con proveedores en puntos clave, que un gerente luego revisa para verificar su exactitud. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Appropriate AI summarization means treating the output as a starting point that a human then reviews, not as a final authoritative interpretation. AI summaries do not capture expert nuance the way a specialist would, outputs should never be accepted without human verification, and AI does not eliminate the need for human engagement with source documents. |
| ES | El uso apropiado del resumen con IA implica tratar el resultado como un punto de partida que un humano luego revisa, no como una interpretación final y autoritativa. Los resúmenes de IA no capturan el matiz experto de la manera en que lo haría un especialista, los resultados nunca deben aceptarse sin verificación humana y la IA no elimina la necesidad de que los humanos interactúen con los documentos fuente. |

### 56. AIE-I · 1.5 · `9ca82220-04eb-497e-a920-a0ee2dfe39f5`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.5: Recall common AI use cases across everyday workplace functions

**stem**

| | |
|---|---|
| EN | Across which workplace functions is AI most commonly applied for drafting and summarizing tasks? |
| ES | ¿En qué funciones del lugar de trabajo se aplica más comúnmente la IA para tareas de redacción y resumen? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Finance and operations exclusively, because AI drafting tools require structured numerical data. |
| **a** ES | Exclusivamente en finanzas y operaciones, porque las herramientas de redacción con IA requieren datos numéricos estructurados. |
| **b** EN | Broadly across functions — HR, marketing, sales, finance, and operations all use AI drafting tools. `<<KEY` |
| **b** ES | Ampliamente en todas las funciones: RRHH, marketing, ventas, finanzas y operaciones utilizan herramientas de redacción con IA. `<<KEY` |
| **c** EN | Only customer service and marketing, because they produce enough text to justify AI tools. |
| **c** ES | Solo en servicio al cliente y marketing, porque generan suficiente texto para justificar el uso de herramientas de IA. |
| **d** EN | Primarily IT and engineering, because other functions lack the setup needed to run AI drafting tools. |
| **d** ES | Principalmente en TI e ingeniería, porque otras funciones carecen de la configuración necesaria para ejecutar herramientas de redacción con IA. |

**explanation**

| | |
|---|---|
| EN | AI drafting and summarization tools are used across virtually all workplace functions — including HR, marketing, sales, finance, and operations — by non-technical employees. Limiting AI's value to IT, to customer-facing teams, or to functions with numerical data reflects a common but inaccurate misconception. |
| ES | Las herramientas de redacción y resumen con IA se usan en prácticamente todas las funciones del lugar de trabajo, incluidas RRHH, marketing, ventas, finanzas y operaciones, por parte de empleados no técnicos. Limitar el valor de la IA a TI, a equipos orientados al cliente o a funciones con datos numéricos refleja un malentendido común pero inexacto. |

### 57. AIE-I · 1.5 · `c2ab42be-9b7d-4b11-8883-078ba43ed69e`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 1.5: Recall common AI use cases across everyday workplace functions

**stem**

| | |
|---|---|
| EN | An operations lead wants to use AI to reduce time spent writing internal status reports each week. Which AI capability directly addresses this need? |
| ES | Un líder de operaciones quiere usar IA para reducir el tiempo dedicado a redactar informes de estado internos cada semana. ¿Qué capacidad de IA aborda directamente esta necesidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | AI drafting or summarization tools, which turn notes or data into a structured report draft. `<<KEY` |
| **a** ES | Herramientas de redacción o resumen con IA, que convierten notas o datos en un borrador de informe estructurado. `<<KEY` |
| **b** EN | AI scheduling tools, which block calendar time so report writing is completed on time. |
| **b** ES | Herramientas de programación con IA, que bloquean tiempo en el calendario para que la redacción del informe se complete a tiempo. |
| **c** EN | AI optimization tools, which learn the team's full workflow after one deployment and rewrite reports autonomously. |
| **c** ES | Herramientas de optimización con IA, que aprenden el flujo de trabajo completo del equipo tras una sola implementación y reescriben los informes de forma autónoma. |
| **d** EN | AI image-generation tools, which convert raw data into visual dashboards replacing written reports. |
| **d** ES | Herramientas de generación de imágenes con IA, que convierten datos sin procesar en paneles visuales que reemplazan los informes escritos. |

**explanation**

| | |
|---|---|
| EN | Drafting and summarization directly reduce the effort of producing structured reports from existing notes or data. Scheduling tools manage time, not content. Image generation produces visuals, not written text. AI does not autonomously master full workflows after a single deployment. |
| ES | La redacción y el resumen reducen directamente el esfuerzo de producir informes estructurados a partir de notas o datos existentes. Las herramientas de programación gestionan el tiempo, no el contenido. La generación de imágenes produce elementos visuales, no texto escrito. La IA no domina de forma autónoma los flujos de trabajo completos tras una sola implementación. |

### 58. AIE-I · 1.5 · `de33003a-32cf-4018-80f8-ffdb65ea0b54`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.5: Recall common AI use cases across everyday workplace functions

**stem**

| | |
|---|---|
| EN | Which task represents a well-established AI use case in a customer service function? |
| ES | ¿Qué tarea representa un caso de uso de IA bien establecido en una función de servicio al cliente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Drafting reply suggestions for a human agent to review before sending `<<KEY` |
| **a** ES | Redactar sugerencias de respuesta para que un agente humano las revise antes de enviarlas `<<KEY` |
| **b** EN | Issuing disciplinary decisions about agent performance automatically |
| **b** ES | Emitir decisiones disciplinarias sobre el desempeño de los agentes de forma automática |
| **c** EN | Setting department service strategy and defining response-time targets |
| **c** ES | Establecer la estrategia de servicio del departamento y definir los objetivos de tiempo de respuesta |
| **d** EN | Resolving every customer complaint without human agent involvement |
| **d** ES | Resolver cada queja de clientes sin la intervención de un agente humano |

**explanation**

| | |
|---|---|
| EN | Drafting reply suggestions for a human agent to review before sending is a well-established AI use case—AI handles routine language generation while a person retains final control. Resolving every complaint without human involvement overstates current AI capability and removes necessary human oversight. Setting service strategy requires organizational judgment beyond AI's established role. Issuing disciplinary decisions carries legal and ethical weight that requires human accountability. |
| ES | Redactar sugerencias de respuesta para que un agente humano las revise antes de enviarlas es un caso de uso de IA bien establecido: la IA se encarga de la generación rutinaria de lenguaje mientras que una persona conserva el control final. Resolver cada queja sin intervención humana sobreestima la capacidad actual de la IA y elimina la supervisión humana necesaria. Establecer la estrategia de servicio requiere un juicio organizacional que va más allá del rol establecido de la IA. Emitir decisiones disciplinarias conlleva un peso legal y ético que exige responsabilidad humana. |

### 59. AIE-I · 1.6 · `0f34fddc-2156-40f2-944c-eccf7dcaea24`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Identify what current AI cannot reliably do

**stem**

| | |
|---|---|
| EN | A finance analyst asks an AI to solve an unusual budgeting scenario her organization has never faced before. Which limitation of current AI is most relevant here? |
| ES | Una analista financiera le pide a una IA que resuelva un escenario de presupuesto inusual que su organización nunca ha enfrentado antes. ¿Qué limitación de la IA actual es más relevante aquí? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | AI pattern-matches from training data rather than reasoning from first principles, making its output on genuinely novel situations unreliable. `<<KEY` |
| **a** ES | La IA reconoce patrones a partir de datos de entrenamiento en lugar de razonar desde principios fundamentales, lo que hace que su resultado en situaciones genuinamente nuevas sea poco confiable. `<<KEY` |
| **b** EN | AI automatically refuses any question outside its training domain and returns an explicit error message rather than attempting a response. |
| **b** ES | La IA rechaza automáticamente cualquier pregunta fuera de su dominio de entrenamiento y devuelve un mensaje de error explícito en lugar de intentar una respuesta. |
| **c** EN | AI handles novel scenarios reliably in any domain where it has previously processed a large volume of related questions and examples. |
| **c** ES | La IA maneja escenarios novedosos de manera confiable en cualquier dominio donde haya procesado previamente un gran volumen de preguntas y ejemplos relacionados. |
| **d** EN | AI applies the same logical inference process humans use when facing new problems, though it executes each reasoning step more slowly on unfamiliar structures. |
| **d** ES | La IA aplica el mismo proceso de inferencia lógica que usan los humanos al enfrentar nuevos problemas, aunque ejecuta cada paso de razonamiento más lentamente en estructuras desconocidas. |

**explanation**

| | |
|---|---|
| EN | AI generates responses by matching patterns from training data; it does not reason through genuinely novel problems the way a human expert does, making its output on edge-case scenarios unreliable. AI does not refuse novel questions or produce error messages for them, does not apply human-like logical inference, and strong past performance in a domain does not guarantee reliable handling of truly new situations. |
| ES | La IA genera respuestas haciendo coincidir patrones de datos de entrenamiento; no razona a través de problemas genuinamente nuevos como lo haría un experto humano, lo que hace que su resultado en escenarios de casos extremos sea poco confiable. La IA no rechaza preguntas novedosas ni produce mensajes de error para ellas, no aplica inferencia lógica similar a la humana, y un buen desempeño pasado en un dominio no garantiza un manejo confiable de situaciones verdaderamente nuevas. |

### 60. AIE-I · 1.6 · `51476497-5924-40a1-aae1-7675747ed476`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.6: Identify what current AI cannot reliably do

**stem**

| | |
|---|---|
| EN | A team leader treats AI-generated in-text citations as reliable because they look properly formatted. Why is this approach problematic? |
| ES | Un líder de equipo trata las citas en el texto generadas por IA como confiables porque parecen estar correctamente formateadas. ¿Por qué este enfoque es problemático? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | AI retrieves and reads actual studies it cites but sometimes misattributes findings to the wrong author. |
| **a** ES | La IA recupera y lee los estudios reales que cita, pero a veces atribuye incorrectamente los hallazgos al autor equivocado. |
| **b** EN | AI includes citations only when highly confident, so formatted references are a reliability signal. |
| **b** ES | La IA incluye citas solo cuando tiene alta confianza, por lo que las referencias formateadas son una señal de confiabilidad. |
| **c** EN | AI formats citations correctly only for pre-cutoff sources, so recent studies are always mislabeled. |
| **c** ES | La IA formatea las citas correctamente solo para fuentes anteriores a la fecha de corte, por lo que los estudios recientes siempre están mal etiquetados. |
| **d** EN | AI generates citation text statistically and may produce plausible but entirely invented references. `<<KEY` |
| **d** ES | La IA genera el texto de las citas estadísticamente y puede producir referencias plausibles pero completamente inventadas. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | AI language models generate citation text the same way they generate any text — by producing statistically plausible strings — which means they can invent journal names, authors, and page numbers that sound real but do not exist. AI does not retrieve or read actual studies, citation formatting is not tied to publication recency, and citations are not a confidence or accuracy signal. |
| ES | Los modelos de lenguaje de IA generan el texto de las citas de la misma manera que generan cualquier texto: produciendo cadenas estadísticamente plausibles, lo que significa que pueden inventar nombres de revistas, autores y números de página que suenan reales pero no existen. La IA no recupera ni lee estudios reales, el formato de las citas no está vinculado a la recencia de la publicación, y las citas no son una señal de confianza o precisión. |

### 61. AIE-I · 1.6 · `6491e64f-e9ad-456a-a4ef-89c896d4e605`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Identify what current AI cannot reliably do

**stem**

| | |
|---|---|
| EN | A sales representative notices an AI tool gives the same answer every time she asks about a competitor's pricing. She concludes the repeated answer must be accurate. Which reasoning error does this illustrate? |
| ES | Una representante de ventas nota que una herramienta de IA da la misma respuesta cada vez que pregunta sobre los precios de un competidor. Concluye que la respuesta repetida debe ser precisa. ¿Qué error de razonamiento ilustra esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Assuming consistency across responses proves correctness, when AI can repeat the same wrong answer reliably. `<<KEY` |
| **a** ES | Asumir que la consistencia entre respuestas prueba su exactitud, cuando la IA puede repetir la misma respuesta incorrecta de manera confiable. `<<KEY` |
| **b** EN | Assuming AI has a live connection to competitor websites and updates pricing in real time. |
| **b** ES | Asumir que la IA tiene una conexión en vivo con los sitios web de los competidores y actualiza los precios en tiempo real. |
| **c** EN | Assuming AI learns from previous sessions and refines pricing data each time she returns. |
| **c** ES | Asumir que la IA aprende de sesiones anteriores y refina los datos de precios cada vez que ella regresa. |
| **d** EN | Assuming AI signals uncertainty when data is outdated, so a confident answer means current information. |
| **d** ES | Asumir que la IA señala incertidumbre cuando los datos están desactualizados, por lo que una respuesta confiada significa información actual. |

**explanation**

| | |
|---|---|
| EN | Consistency is not a reliability signal; an AI can reproduce the same incorrect answer repeatedly because it reflects stable patterns in training data, not verified facts. Live data access, uncertainty signaling, and cross-session learning are separate misconceptions and are not features of standard AI language tools. |
| ES | La consistencia no es una señal de confiabilidad; una IA puede reproducir la misma respuesta incorrecta repetidamente porque refleja patrones estables en los datos de entrenamiento, no hechos verificados. El acceso a datos en vivo, la señalización de incertidumbre y el aprendizaje entre sesiones son conceptos erróneos separados y no son características de las herramientas de lenguaje de IA estándar. |

### 62. AIE-I · 1.6 · `d35898df-701f-4902-b41e-c3994156d876`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.6: Identify what current AI cannot reliably do

**stem**

| | |
|---|---|
| EN | A colleague argues that an AI tool's phrasing — 'It is well established that…' — means the claim can be trusted. Which characteristic of AI output does this misunderstand? |
| ES | Un colega argumenta que la expresión de una herramienta de IA —'Está bien establecido que…'— significa que la afirmación puede ser confiable. ¿Qué característica del resultado de la IA malentiende esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Confident phrasing indicates the claim was drawn from sources within the AI's training period. |
| **a** ES | La redacción confiada indica que la afirmación fue extraída de fuentes dentro del período de entrenamiento de la IA. |
| **b** EN | Confident phrasing is a stylistic pattern and carries no signal about the factual accuracy of the claim. `<<KEY` |
| **b** ES | La redacción confiada es un patrón estilístico y no transmite ninguna señal sobre la exactitud factual de la afirmación. `<<KEY` |
| **c** EN | Confident phrasing appears only after the AI's internal fact-check has confirmed the statement is accurate. |
| **c** ES | La redacción confiada aparece solo después de que la verificación interna de hechos de la IA ha confirmado que la declaración es precisa. |
| **d** EN | Confident phrasing reflects the AI's genuine belief, similar to how a human expert asserts known facts. |
| **d** ES | La redacción confiada refleja la creencia genuina de la IA, similar a cómo un experto humano afirma hechos conocidos. |

**explanation**

| | |
|---|---|
| EN | AI produces language that mirrors the style of its training data; authoritative-sounding phrases are generated because they commonly appear in that data, not because any verification has occurred. AI has no internal fact-checking mechanism, holds no beliefs, and confident phrasing is unrelated to whether a source falls within the training period. |
| ES | La IA produce lenguaje que refleja el estilo de sus datos de entrenamiento; las frases que suenan autoritativas se generan porque aparecen comúnmente en esos datos, no porque haya ocurrido alguna verificación. La IA no tiene un mecanismo interno de verificación de hechos, no tiene creencias, y la redacción confiada no está relacionada con si una fuente cae dentro del período de entrenamiento. |

### 63. AIE-I · 1.6 · `e598fefe-d16e-4445-8add-cacda4b8d5d2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Identify what current AI cannot reliably do

**stem**

| | |
|---|---|
| EN | A teacher publishes all AI-generated quiz answers that sounded confident, skipping only the one the AI flagged as uncertain. Which misconception drives this decision? |
| ES | Una maestra publica todas las respuestas de un cuestionario generadas por IA que sonaban confiadas, omitiendo solo la que la IA marcó como incierta. ¿Qué concepto erróneo impulsa esta decisión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Believing that answers stated without expressed uncertainty are definitively correct and need no verification. `<<KEY` |
| **a** ES | Creer que las respuestas expresadas sin incertidumbre son definitivamente correctas y no necesitan verificación. `<<KEY` |
| **b** EN | Believing that AI's confident answers can be traced back to verified training sources. |
| **b** ES | Creer que las respuestas confiadas de la IA pueden rastrearse hasta fuentes de entrenamiento verificadas. |
| **c** EN | Believing that AI improves answer accuracy after the teacher corrects the uncertain item mid-session. |
| **c** ES | Creer que la IA mejora la precisión de las respuestas después de que la maestra corrige el elemento incierto durante la sesión. |
| **d** EN | Believing that AI refuses to generate answers in domains where its training data is sparse. |
| **d** ES | Creer que la IA se niega a generar respuestas en dominios donde sus datos de entrenamiento son escasos. |

**explanation**

| | |
|---|---|
| EN | AI's expression of uncertainty in one place does not validate the rest of the response; the model can be confidently wrong across multiple answers simultaneously because confidence is a linguistic feature, not an accuracy measure. AI does not learn from in-session corrections, does not refuse low-confidence domains, and does not provide traceable links to verified training sources. |
| ES | La expresión de incertidumbre de la IA en un lugar no valida el resto de la respuesta; el modelo puede estar confiadamente equivocado en múltiples respuestas simultáneamente porque la confianza es una característica lingüística, no una medida de precisión. La IA no aprende de correcciones durante la sesión, no rechaza dominios de baja confianza y no proporciona enlaces rastreables a fuentes de entrenamiento verificadas. |

### 64. AIE-I · 1.7 · `2dfebd3a-4cc2-4f03-8e4d-3fdd79bdb5f5`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.7: Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

**stem**

| | |
|---|---|
| EN | Which statement correctly describes the relationship between generative AI and machine learning? |
| ES | ¿Qué afirmación describe correctamente la relación entre la IA generativa y el aprendizaje automático? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Machine learning is a subset of generative AI, since all learning systems ultimately produce some new output. |
| **a** ES | El aprendizaje automático es un subconjunto de la IA generativa, ya que todos los sistemas de aprendizaje producen en última instancia alguna salida nueva. |
| **b** EN | Generative AI is a subset of machine learning that produces new content rather than only classifying or predicting. `<<KEY` |
| **b** ES | La IA generativa es un subconjunto del aprendizaje automático que produce contenido nuevo en lugar de solo clasificar o predecir. `<<KEY` |
| **c** EN | Generative AI is parallel to machine learning, built on different mathematical foundations for content creation. |
| **c** ES | La IA generativa es paralela al aprendizaje automático, construida sobre diferentes fundamentos matemáticos para la creación de contenido. |
| **d** EN | Generative AI and machine learning are synonymous terms used interchangeably in professional contexts. |
| **d** ES | La IA generativa y el aprendizaje automático son términos sinónimos que se usan indistintamente en contextos profesionales. |

**explanation**

| | |
|---|---|
| EN | Generative AI is a specific category within machine learning — it uses learned patterns to produce new content. It is not a separate technology with different foundations, not a synonym for machine learning, and machine learning is the broader discipline, not the narrower one. |
| ES | La IA generativa es una categoría específica dentro del aprendizaje automático: utiliza patrones aprendidos para producir contenido nuevo. No es una tecnología separada con fundamentos diferentes, no es un sinónimo del aprendizaje automático, y el aprendizaje automático es la disciplina más amplia, no la más estrecha. |

### 65. AIE-I · 1.7 · `416a5ee1-f18d-4303-a1b0-28cbc532f30b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.7: Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

**stem**

| | |
|---|---|
| EN | A tool searches a supplier database, drafts a summary email, and schedules a follow-up — all without asking for approval at each step. Which term best applies? |
| ES | Una herramienta busca en una base de datos de proveedores, redacta un correo electrónico de resumen y programa un seguimiento, todo sin pedir aprobación en cada paso. ¿Qué término se aplica mejor? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Generative AI, because producing the email draft is what distinguishes this tool from traditional software. |
| **a** ES | IA generativa, porque producir el borrador del correo electrónico es lo que distingue esta herramienta del software tradicional. |
| **b** EN | AI agent, because it plans, uses tools, and takes sequential steps toward a goal without per-step approval. `<<KEY` |
| **b** ES | Agente de IA, porque planifica, usa herramientas y realiza pasos secuenciales hacia un objetivo sin aprobación por cada paso. `<<KEY` |
| **c** EN | Large language model, because generating the email and summary text is the system's defining capability. |
| **c** ES | Modelo de lenguaje grande, porque generar el texto del correo electrónico y el resumen es la capacidad definitoria del sistema. |
| **d** EN | Foundation model, because a broadly trained base model is required before any multi-step task can be automated. |
| **d** ES | Modelo fundacional, porque se requiere un modelo base ampliamente entrenado antes de poder automatizar cualquier tarea de múltiples pasos. |

**explanation**

| | |
|---|---|
| EN | An AI agent is defined by its ability to plan, use tools, and act autonomously across multiple steps toward a goal. Generating text is only one component; the autonomous sequential action across tools is what makes this an agent rather than a language model or generative AI tool alone. |
| ES | Un agente de IA se define por su capacidad de planificar, usar herramientas y actuar de forma autónoma en múltiples pasos hacia un objetivo. Generar texto es solo un componente; la acción secuencial autónoma a través de herramientas es lo que convierte esto en un agente en lugar de un modelo de lenguaje o una herramienta de IA generativa por sí sola. |

### 66. AIE-I · 1.7 · `529c8db9-6708-400f-b021-5b647aa7addb`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 1.7: Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

**stem**

| | |
|---|---|
| EN | Which term names the broadest field concerned with systems that perform tasks normally associated with human intelligence? |
| ES | ¿Qué término nombra el campo más amplio relacionado con los sistemas que realizan tareas normalmente asociadas con la inteligencia humana? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Artificial intelligence, because it is the umbrella field that includes machine learning and generative AI. `<<KEY` |
| **a** ES | Inteligencia artificial, porque es el campo paraguas que incluye el aprendizaje automático y la IA generativa. `<<KEY` |
| **b** EN | Foundation model, because one broadly trained model underlies every intelligent system in use today. |
| **b** ES | Modelo fundacional, porque un modelo entrenado de forma amplia es la base de todo sistema inteligente en uso hoy en día. |
| **c** EN | Generative AI, because producing new content represents the most complete form of intelligent behavior. |
| **c** ES | IA generativa, porque producir contenido nuevo representa la forma más completa de comportamiento inteligente. |
| **d** EN | Machine learning, because it covers all methods computers use to process data and make decisions. |
| **d** ES | Aprendizaje automático, porque abarca todos los métodos que usan las computadoras para procesar datos y tomar decisiones. |

**explanation**

| | |
|---|---|
| EN | Artificial intelligence is the umbrella field; machine learning is one approach within it, not the field itself. Generative AI is a subset of machine learning, and a foundation model is one type of AI artifact, not the field. |
| ES | La inteligencia artificial es el campo paraguas; el aprendizaje automático es un enfoque dentro de él, no el campo en sí. La IA generativa es un subconjunto del aprendizaje automático, y un modelo fundacional es un tipo de artefacto de IA, no el campo en sí. |

### 67. AIE-I · 1.7 · `61782aae-94c4-4ae6-88a2-c3ad3a10053f`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.7: Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

**stem**

| | |
|---|---|
| EN | Which statement correctly describes the relationship between generative AI and machine learning? |
| ES | ¿Cuál enunciado describe correctamente la relación entre la IA generativa y el aprendizaje automático? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Generative AI is a broader category that encompasses all machine learning systems. |
| **a** ES | La IA generativa es una categoría más amplia que abarca todos los sistemas de aprendizaje automático. |
| **b** EN | Generative AI and machine learning are synonymous terms for the same technology. |
| **b** ES | La IA generativa y el aprendizaje automático son términos sinónimos para la misma tecnología. |
| **c** EN | Generative AI is a subset of machine learning focused on producing new content. `<<KEY` |
| **c** ES | La IA generativa es un subconjunto del aprendizaje automático enfocado en producir contenido nuevo. `<<KEY` |
| **d** EN | Generative AI operates independently of machine learning by recombining stored data. |
| **d** ES | La IA generativa opera de manera independiente del aprendizaje automático mediante la recomposición de datos almacenados. |

**explanation**

| | |
|---|---|
| EN | Generative AI is a specific type of machine learning focused on producing novel content such as text, images, or audio, rather than only classifying or predicting. It is not broader than machine learning, nor synonymous with it. Describing generative AI as independently recombining stored database content confuses it with a search or retrieval system, which is a common misconception. |
| ES | La IA generativa es un tipo específico de aprendizaje automático enfocado en producir contenido novedoso, como texto, imágenes o audio, en lugar de únicamente clasificar o predecir. No es una categoría más amplia que el aprendizaje automático, ni es sinónimo de este. Describir la IA generativa como un sistema que recompone de forma independiente contenido de bases de datos almacenadas la confunde con un sistema de búsqueda o recuperación de información, lo cual es un concepto erróneo común. |

### 68. AIE-I · 1.7 · `e3908d72-b26f-41cf-9499-bb8c54ade9d2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.7: Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

**stem**

| | |
|---|---|
| EN | Which term describes a foundation model specifically trained on text that predicts and generates language? |
| ES | ¿Qué término describe un modelo fundacional entrenado específicamente en texto que predice y genera lenguaje? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Foundation model, because all foundation models are trained on text and therefore generate language by default. |
| **a** ES | Modelo fundacional, porque todos los modelos fundacionales se entrenan en texto y por lo tanto generan lenguaje de forma predeterminada. |
| **b** EN | Large language model, because it is a foundation model whose training and outputs are centered on language. `<<KEY` |
| **b** ES | Modelo de lenguaje grande, porque es un modelo fundacional cuyo entrenamiento y salidas están centrados en el lenguaje. `<<KEY` |
| **c** EN | Generative AI, because any model that outputs new text falls under that label rather than a more specific one. |
| **c** ES | IA generativa, porque cualquier modelo que produzca texto nuevo cae bajo esa etiqueta en lugar de una más específica. |
| **d** EN | AI agent, because generating coherent language requires planning and sequential decision-making across steps. |
| **d** ES | Agente de IA, porque generar lenguaje coherente requiere planificación y toma de decisiones secuencial a través de múltiples pasos. |

**explanation**

| | |
|---|---|
| EN | A large language model is a foundation model trained on text that predicts and generates language. Foundation model is the broader parent category — not all foundation models are text-based — so it is too general here. Generative AI is a category of output type, and an AI agent is defined by autonomous action, not language generation. |
| ES | Un modelo de lenguaje grande es un modelo fundacional entrenado en texto que predice y genera lenguaje. El modelo fundacional es la categoría padre más amplia —no todos los modelos fundacionales están basados en texto— por lo que es demasiado general aquí. La IA generativa es una categoría de tipo de salida, y un agente de IA se define por la acción autónoma, no por la generación de lenguaje. |

### 69. AIE-I · 2.1 · `cac10264-ecbe-4644-98ad-5935fa913016`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.1: Explain what a prompt is and how it differs from a search query

**stem**

| | |
|---|---|
| EN | A marketing associate types 'best slogans for eco-friendly soap' into a search engine, then types the same phrase into a generative AI tool. Which statement best explains why these are fundamentally different actions? |
| ES | Una asociada de marketing escribe 'mejores eslóganes para jabón ecológico' en un motor de búsqueda y luego escribe la misma frase en una herramienta de IA generativa. ¿Cuál enunciado explica mejor por qué estas son acciones fundamentalmente diferentes? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The search engine finds existing pages; the AI generates new slogan text from the instruction. `<<KEY` |
| **a** ES | El motor de búsqueda encuentra páginas existentes; la IA genera nuevo texto de eslóganes a partir de la instrucción. `<<KEY` |
| **b** EN | Both actions retrieve existing content, but the AI filters results by relevance more precisely. |
| **b** ES | Ambas acciones recuperan contenido existente, pero la IA filtra los resultados por relevancia con mayor precisión. |
| **c** EN | The AI replays a pre-written slogan list stored during training rather than composing anything new. |
| **c** ES | La IA reproduce una lista de eslóganes pregrabada almacenada durante el entrenamiento, en lugar de componer algo nuevo. |
| **d** EN | The AI searches a smarter index of web pages, returning higher-quality documents than a search engine. |
| **d** ES | La IA busca en un índice más inteligente de páginas web y devuelve documentos de mayor calidad que un motor de búsqueda. |

**explanation**

| | |
|---|---|
| EN | A search query retrieves existing documents already indexed on the web; a prompt instructs a generative AI to produce new content at the moment of submission. The AI does not search an index or replay stored outputs. The 'smarter search engine' framing and the 'pre-written list' framing both mischaracterize generation as retrieval. |
| ES | Una consulta de búsqueda recupera documentos existentes ya indexados en la web; un prompt instruye a una IA generativa para que produzca contenido nuevo en el momento de la solicitud. La IA no busca en un índice ni reproduce resultados almacenados. Tanto la idea de 'motor de búsqueda más inteligente' como la de 'lista pregrabada' malinterpretan la generación como si fuera recuperación. |

### 70. AIE-I · 2.1 · `d7f9c7b2-0d05-47c2-a24f-c27b66b32099`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.1: Explain what a prompt is and how it differs from a search query

**stem**

| | |
|---|---|
| EN | A sales rep prompts an AI to draft a follow-up email, then sends a second message asking for a friendlier tone. Which statement about this interaction is accurate? |
| ES | Un representante de ventas le pide a una IA que redacte un correo electrónico de seguimiento y luego envía un segundo mensaje solicitando un tono más amigable. ¿Cuál enunciado sobre esta interacción es correcto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The second message restarts the session, erasing the original draft and generating an unrelated response. |
| **a** ES | El segundo mensaje reinicia la sesión, borra el borrador original y genera una respuesta sin relación. |
| **b** EN | The second message is ignored, because output is fixed once the first prompt is submitted. |
| **b** ES | El segundo mensaje es ignorado, porque el resultado queda fijo una vez que se envía el primer prompt. |
| **c** EN | The second message refines the output, because generative AI sessions support follow-up instructions. `<<KEY` |
| **c** ES | El segundo mensaje refina el resultado, porque las sesiones de IA generativa admiten instrucciones de seguimiento. `<<KEY` |
| **d** EN | The second message requires special syntax to be recognized as a revision rather than a new topic. |
| **d** ES | El segundo mensaje requiere sintaxis especial para ser reconocido como una revisión en lugar de un tema nuevo. |

**explanation**

| | |
|---|---|
| EN | Generative AI chat sessions are iterative: follow-up prompts refine or redirect earlier outputs within the same conversation. The belief that output is fixed after the first submission is a common misconception. No special syntax is needed; plain-language follow-up instructions are processed as additional prompts. |
| ES | Las sesiones de chat de IA generativa son iterativas: los prompts de seguimiento refinan o redirigen los resultados anteriores dentro de la misma conversación. La creencia de que el resultado queda fijo después del primer envío es un malentendido común. No se necesita sintaxis especial; las instrucciones de seguimiento en lenguaje común se procesan como prompts adicionales. |

### 71. AIE-I · 2.2 · `57453abf-3528-4e33-bf5e-22d20e2f3e6f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.2: Apply the basic elements of an effective prompt (role, context, task, constraints, format)

**stem**

| | |
|---|---|
| EN | A teacher asks an AI to explain photosynthesis, but the response is too advanced for her students. Applying iterative prompting, what is the most effective next step? |
| ES | Una maestra le pide a una IA que explique la fotosíntesis, pero la respuesta es demasiado avanzada para sus estudiantes. Aplicando el prompting iterativo, ¿cuál es el siguiente paso más efectivo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Add only a strict word limit, because shorter responses are automatically simpler and more age-appropriate. |
| **a** ES | Agregar solo un límite estricto de palabras, porque las respuestas más cortas son automáticamente más simples y adecuadas para la edad. |
| **b** EN | Follow up by specifying student age, an analogy style, and a format such as short paragraphs with a summary box. `<<KEY` |
| **b** ES | Hacer un seguimiento especificando la edad de los estudiantes, un estilo de analogía y un formato como párrafos cortos con un cuadro de resumen. `<<KEY` |
| **c** EN | Start a new conversation and retype the original prompt, because follow-up refinements rarely improve a poor initial response. |
| **c** ES | Iniciar una nueva conversación y volver a escribir el prompt original, porque los refinamientos de seguimiento rara vez mejoran una respuesta inicial deficiente. |
| **d** EN | Add a tone instruction like 'be friendly,' because tone determines reading level more than audience or format guidance. |
| **d** ES | Agregar una instrucción de tono como 'sé amigable,' porque el tono determina el nivel de lectura más que la orientación sobre la audiencia o el formato. |

**explanation**

| | |
|---|---|
| EN | Iterative prompting means refining the prompt based on what was missing or wrong. Adding audience age, example style, and format gives the model the context and constraints needed to adjust depth and structure. A word limit alone does not make content age-appropriate—brevity is not the same as simplicity. Starting a new conversation discards useful history. Tone guidance affects register, not reading level or conceptual depth. |
| ES | El prompting iterativo consiste en refinar el prompt en función de lo que faltó o estuvo mal. Agregar la edad de la audiencia, el estilo de ejemplos y el formato le da al modelo el contexto y las restricciones necesarias para ajustar la profundidad y la estructura. Un límite de palabras por sí solo no hace que el contenido sea apropiado para la edad: la brevedad no equivale a simplicidad. Iniciar una nueva conversación descarta el historial útil. La orientación de tono afecta el registro, no el nivel de lectura ni la profundidad conceptual. |

### 72. AIE-I · 2.2 · `6c0b1bce-7c0c-4031-9612-9008a9fbad10`

shown **2×** in the eight scored attempts — 1 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 2.2: Apply the basic elements of an effective prompt (role, context, task, constraints, format)

**stem**

| | |
|---|---|
| EN | An HR coordinator writes: 'Act as an experienced HR recruiter. We need a mid-level data analyst with 3+ years of experience. List each candidate's strengths and gaps in a table.' What prompt element is still missing? |
| ES | Una coordinadora de recursos humanos escribe: 'Actúa como un reclutador de RR. HH. con experiencia. Necesitamos un analista de datos de nivel intermedio con más de 3 años de experiencia. Lista las fortalezas y brechas de cada candidato en una tabla.' ¿Qué elemento del prompt aún falta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A word count constraint, because without one the model tends to produce unmanageably long tables. |
| **a** ES | Una restricción de cantidad de palabras, porque sin ella el modelo tiende a producir tablas de longitud inmanejable. |
| **b** EN | A tone instruction such as 'be professional,' because tone shapes whether the output is appropriate for a hiring context. |
| **b** ES | Una instrucción de tono como 'sé profesional,' porque el tono determina si el resultado es adecuado para un contexto de contratación. |
| **c** EN | A longer role description, because a brief role instruction does not meaningfully change how the model evaluates candidates. |
| **c** ES | Una descripción de rol más extensa, porque una instrucción de rol breve no cambia de manera significativa cómo el modelo evalúa a los candidatos. |
| **d** EN | An explicit task instruction telling the model what action to perform on the résumés provided. `<<KEY` |
| **d** ES | Una instrucción de tarea explícita que le indique al modelo qué acción realizar con los currículums proporcionados. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The prompt has role, context, constraints, and format, but never states the task—what the model should do with the résumés (e.g., 'review each résumé below and assess it against the criteria'). A tone instruction is not a required element when format and role already guide response style. A longer role description does not compensate for a missing action directive. A word count constraint addresses length, not the absence of a task. |
| ES | El prompt tiene rol, contexto, restricciones y formato, pero nunca indica la tarea: qué debe hacer el modelo con los currículums (por ejemplo, 'revisa cada currículum a continuación y evalúalo según los criterios'). Una instrucción de tono no es un elemento obligatorio cuando el formato y el rol ya orientan el estilo de la respuesta. Una descripción de rol más extensa no compensa la ausencia de una directiva de acción. Una restricción de cantidad de palabras aborda la longitud, no la falta de una tarea. |

### 73. AIE-I · 2.2 · `7971c125-382b-44d9-94bd-ad89dafc5265`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.2: Apply the basic elements of an effective prompt (role, context, task, constraints, format)

**stem**

| | |
|---|---|
| EN | A sales rep re-states role and customer context in a follow-up prompt after the AI drifted off-topic. A colleague says this is wasteful because those elements were already set. What should the rep do? |
| ES | Un representante de ventas vuelve a indicar el rol y el contexto del cliente en un prompt de seguimiento después de que la IA se desvió del tema. Un colega dice que esto es un desperdicio porque esos elementos ya estaban establecidos. ¿Qué debería hacer el representante? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continue refining role and context in follow-up prompts, since iterative correction is a normal and effective prompting practice. `<<KEY` |
| **a** ES | Continuar refinando el rol y el contexto en los prompts de seguimiento, ya que la corrección iterativa es una práctica de prompting normal y efectiva. `<<KEY` |
| **b** EN | Stop re-stating role and context, because repeating established elements in follow-up prompts is redundant and counterproductive. |
| **b** ES | Dejar de volver a indicar el rol y el contexto, porque repetir elementos ya establecidos en prompts de seguimiento es redundante y contraproducente. |
| **c** EN | Switch to a new conversation thread, because role and context instructions lose effect after the first model response. |
| **c** ES | Cambiar a un nuevo hilo de conversación, porque las instrucciones de rol y contexto pierden efecto después de la primera respuesta del modelo. |
| **d** EN | Add only a stricter format instruction, because format constraints override context drift without requiring re-statement. |
| **d** ES | Agregar solo una instrucción de formato más estricta, porque las restricciones de formato corrigen la desviación de contexto sin necesidad de volver a indicarlo. |

**explanation**

| | |
|---|---|
| EN | Prompting is iterative; when a response drifts, re-stating or refining role and context in a follow-up is a standard corrective technique, not waste. The belief that initial role and context settings are permanently locked in is a misconception—models can lose focus, and re-grounding them is both normal and effective. Starting a new thread discards useful conversation history. Format constraints alone do not restore lost contextual grounding. |
| ES | El prompting es iterativo; cuando una respuesta se desvía, volver a indicar o refinar el rol y el contexto en un seguimiento es una técnica correctiva estándar, no un desperdicio. La creencia de que las configuraciones iniciales de rol y contexto quedan bloqueadas permanentemente es un error: los modelos pueden perder el enfoque, y reorientarlos es tanto normal como efectivo. Iniciar un nuevo hilo descarta el historial de conversación útil. Las restricciones de formato por sí solas no restauran el contexto perdido. |

### 74. AIE-I · 2.2 · `e0646031-af81-400c-bec2-c5637ebb95d3`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.2: Apply the basic elements of an effective prompt (role, context, task, constraints, format)

**stem**

| | |
|---|---|
| EN | An office manager writes: 'Act as an executive assistant. Draft a 60-minute team meeting agenda covering Q3 results, process improvements, and next steps. Use a two-column table: time slot and agenda item.' Which element is absent? |
| ES | Una gerente de oficina escribe: 'Actúa como asistente ejecutivo. Redacta una agenda de reunión de equipo de 60 minutos que cubra los resultados del T3, mejoras de procesos y próximos pasos. Usa una tabla de dos columnas: franja horaria e ítem de la agenda.' ¿Qué elemento está ausente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Task, because listing topics does not tell the model what action to perform on those topics. |
| **a** ES | La tarea, porque listar temas no le indica al modelo qué acción realizar con esos temas. |
| **b** EN | Context, because the prompt gives no background about the team, meeting purpose, or attendees. `<<KEY` |
| **b** ES | El contexto, porque el prompt no proporciona antecedentes sobre el equipo, el propósito de la reunión ni los asistentes. `<<KEY` |
| **c** EN | Format, because a two-column table instruction is too vague to qualify as a valid format specification. |
| **c** ES | El formato, porque una instrucción de tabla de dos columnas es demasiado vaga para considerarse una especificación de formato válida. |
| **d** EN | Constraint, because without a word limit the model may allocate time slots inconsistently across agenda items. |
| **d** ES | La restricción, porque sin un límite de palabras el modelo puede asignar franjas horarias de manera inconsistente entre los ítems de la agenda. |

**explanation**

| | |
|---|---|
| EN | The prompt has role, task, a time constraint, and a clear format, but no context—there is no background about the team, the nature of the Q3 results, or who will attend. Without that background, the model must guess at relevant details. The two-column table instruction is a clear and valid format specification. Listing the topics and saying 'draft an agenda' does constitute an action directive. A word limit is not required when a time constraint and format already bound the output. |
| ES | El prompt tiene rol, tarea, una restricción de tiempo y un formato claro, pero no tiene contexto: no hay antecedentes sobre el equipo, la naturaleza de los resultados del T3 ni quiénes asistirán. Sin ese contexto, el modelo debe adivinar los detalles relevantes. La instrucción de tabla de dos columnas es una especificación de formato clara y válida. Listar los temas y decir 'redacta una agenda' sí constituye una directiva de acción. Un límite de palabras no es necesario cuando una restricción de tiempo y un formato ya delimitan el resultado. |

### 75. AIE-I · 2.3 · `0185c1eb-1b23-4950-b2c3-6aa5dab15532`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: Describe the capabilities and limitations of current generative AI tools

**stem**

| | |
|---|---|
| EN | A finance analyst uses a generative AI tool to calculate the percentage change between two quarterly revenue figures. Which description best explains the risk? |
| ES | Una analista financiera usa una herramienta de IA generativa para calcular el cambio porcentual entre dos cifras de ingresos trimestrales. ¿Cuál descripción explica mejor el riesgo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Low risk for simple percentages, because errors only arise in multi-step or complex calculations. |
| **a** ES | Riesgo bajo para porcentajes simples, porque los errores solo surgen en cálculos de múltiples pasos o complejos. |
| **b** EN | Low risk, because the tool performs arithmetic the same way a calculator does. |
| **b** ES | Riesgo bajo, porque la herramienta realiza operaciones aritméticas de la misma manera que una calculadora. |
| **c** EN | No risk if the analyst adds 'be accurate' to the prompt, because that instruction prevents incorrect figures. |
| **c** ES | Sin riesgo si la analista agrega 'sé precisa' al prompt, porque esa instrucción evita cifras incorrectas. |
| **d** EN | High risk, because generative AI predicts plausible text rather than computing mathematically, so figures can be wrong. `<<KEY` |
| **d** ES | Riesgo alto, porque la IA generativa predice texto plausible en lugar de calcular matemáticamente, por lo que las cifras pueden ser incorrectas. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Generative AI generates text by predicting likely sequences, not by executing arithmetic the way a calculator does. Even simple numerical results can be incorrect. Adding accuracy instructions to a prompt does not change the underlying mechanism. The analyst should verify any figures with a dedicated calculation tool. |
| ES | La IA generativa genera texto prediciendo secuencias probables, no ejecutando operaciones aritméticas como lo hace una calculadora. Incluso resultados numéricos simples pueden ser incorrectos. Agregar instrucciones de precisión al prompt no cambia el mecanismo subyacente. La analista debe verificar cualquier cifra con una herramienta de cálculo dedicada. |

### 76. AIE-I · 2.3 · `42c981b1-4743-4ad4-a03a-79b9a0dba790`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: Describe the capabilities and limitations of current generative AI tools

**stem**

| | |
|---|---|
| EN | A finance analyst pastes a supplier contract into a generative AI tool and asks it to draft a short payment-terms summary. Which statement best describes what the tool is and is not reliable for? |
| ES | Un analista financiero pega un contrato de proveedor en una herramienta de IA generativa y le pide que redacte un breve resumen de los términos de pago. ¿Cuál de las siguientes afirmaciones describe mejor en qué es y en qué no es confiable la herramienta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Reliable for condensing the pasted text into clear prose, but not for verifying whether the terms comply with current regulations. `<<KEY` |
| **a** ES | Es confiable para condensar el texto pegado en una prosa clara, pero no para verificar si los términos cumplen con las regulaciones vigentes. `<<KEY` |
| **b** EN | Reliable for the full task without review, provided the analyst instructs the tool to 'only state facts.' |
| **b** ES | Es confiable para realizar la tarea completa sin revisión, siempre que el analista le indique a la herramienta que 'solo declare hechos'. |
| **c** EN | Reliable for flagging factual errors in the contract, because fluent summarization includes checking whether facts are true. |
| **c** ES | Es confiable para identificar errores factuales en el contrato, porque la capacidad de resumir con fluidez incluye verificar si los hechos son verdaderos. |
| **d** EN | Reliable for both summarizing and confirming arithmetic consistency, because AI processes numbers like a calculator. |
| **d** ES | Es confiable tanto para resumir como para confirmar la consistencia aritmética, porque la IA procesa números como una calculadora. |

**explanation**

| | |
|---|---|
| EN | Generative AI is strong at condensing and rephrasing text the user provides, but it cannot verify regulatory compliance or guarantee arithmetic accuracy — those require human review or dedicated tools. Claiming AI processes numbers like a calculator conflates text generation with computation. Assuming fluent summarization includes fact-checking reflects the misconception that fluency equals accuracy. Believing a 'state only facts' instruction prevents hallucination misunderstands how language models generate output. |
| ES | La IA generativa es eficaz para condensar y reformular el texto que el usuario proporciona, pero no puede verificar el cumplimiento normativo ni garantizar la exactitud aritmética; esas tareas requieren revisión humana o herramientas especializadas. Afirmar que la IA procesa números como una calculadora confunde la generación de texto con el cálculo. Suponer que la capacidad de resumir con fluidez incluye la verificación de hechos refleja el error de creer que fluidez equivale a exactitud. Creer que una instrucción de 'solo declarar hechos' previene las alucinaciones demuestra una comprensión incorrecta de cómo los modelos de lenguaje generan resultados. |

### 77. AIE-I · 2.4 · `1028ad7e-e14e-49b6-88d5-9829614976f7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain what AI "hallucination" is and why it happens

**stem**

| | |
|---|---|
| EN | A sales rep says: 'I asked the AI the same question three times and got the same answer, so I trust it.' Which concept best explains why this reasoning is flawed? |
| ES | Un representante de ventas dice: 'Le hice la misma pregunta a la IA tres veces y obtuve la misma respuesta, así que confío en ella.' ¿Qué concepto explica mejor por qué este razonamiento es incorrecto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The AI adjusts confidence based on repetition, so consistent answers only mean its certainty threshold was met each time. |
| **a** ES | La IA ajusta la confianza según la repetición, por lo que las respuestas consistentes solo significan que su umbral de certeza se alcanzó cada vez. |
| **b** EN | Consistency is reliable for common topics but hallucinations still occur for specialized questions outside the training data. |
| **b** ES | La consistencia es confiable para temas comunes, pero las alucinaciones aún ocurren para preguntas especializadas fuera de los datos de entrenamiento. |
| **c** EN | Consistency reflects the model reproducing the same plausible pattern, not verifying the answer against external facts. `<<KEY` |
| **c** ES | La consistencia refleja que el modelo reproduce el mismo patrón plausible, no que verifica la respuesta con hechos externos. `<<KEY` |
| **d** EN | Three repetitions are statistically too few; more queries would eventually surface a different, more accurate answer. |
| **d** ES | Tres repeticiones son estadísticamente insuficientes; más consultas eventualmente mostrarían una respuesta diferente y más precisa. |

**explanation**

| | |
|---|---|
| EN | A model that has learned a plausible but incorrect pattern will reproduce that pattern consistently. Consistency reflects the model's learned associations, not factual verification, so repeated identical answers provide no evidence of accuracy. |
| ES | Un modelo que ha aprendido un patrón plausible pero incorrecto reproducirá ese patrón de manera consistente. La consistencia refleja las asociaciones aprendidas por el modelo, no la verificación factual, por lo que respuestas idénticas repetidas no constituyen evidencia de precisión. |

### 78. AIE-I · 2.4 · `4425cda8-d192-4456-ac73-447d4fd46300`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain what AI "hallucination" is and why it happens

**stem**

| | |
|---|---|
| EN | A team leader finds that an AI-generated supplier summary, though invented, happens to match facts she already knows. She concludes the AI drew on real knowledge. Why is that conclusion unreliable? |
| ES | Una líder de equipo descubre que un resumen de proveedores generado por IA, aunque inventado, coincide con hechos que ella ya conoce. Concluye que la IA se basó en conocimiento real. ¿Por qué esa conclusión no es confiable? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Training on mostly accurate human data means plausible output and true output are closely correlated for everyday business topics. |
| **a** ES | El entrenamiento con datos humanos mayoritariamente precisos significa que la salida plausible y la salida verdadera están estrechamente correlacionadas para temas empresariales cotidianos. |
| **b** EN | Alignment is only unreliable for obscure topics; for common supplier information, post-hoc fit reliably signals real knowledge. |
| **b** ES | La coincidencia solo es poco confiable para temas poco conocidos; para información común de proveedores, la coincidencia posterior señala de manera confiable conocimiento real. |
| **c** EN | Coincidental alignment can occur through pattern-matching to plausible content, not necessarily through access to verified knowledge. `<<KEY` |
| **c** ES | La coincidencia accidental puede ocurrir mediante la coincidencia de patrones con contenido plausible, no necesariamente mediante el acceso a conocimiento verificado. `<<KEY` |
| **d** EN | Post-review alignment with known facts confirms the model retrieved verified information rather than producing a lucky guess. |
| **d** ES | La coincidencia posterior con hechos conocidos confirma que el modelo recuperó información verificada en lugar de producir una suposición afortunada. |

**explanation**

| | |
|---|---|
| EN | A model optimizing for plausible text can produce output that coincidentally matches real facts without having retrieved or verified those facts. Post-hoc fit between AI output and known facts is not evidence that the model was drawing on grounded knowledge rather than fabricating. |
| ES | Un modelo que optimiza para texto plausible puede producir una salida que coincida accidentalmente con hechos reales sin haber recuperado ni verificado esos hechos. La coincidencia posterior entre la salida de la IA y los hechos conocidos no es evidencia de que el modelo se basara en conocimiento fundamentado en lugar de fabricar. |

### 79. AIE-I · 2.4 · `58be30df-c3b7-4b54-a084-9fcbe4acf4ef`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain what AI "hallucination" is and why it happens

**stem**

| | |
|---|---|
| EN | Which description most accurately explains why AI hallucinations occur? |
| ES | ¿Qué descripción explica con mayor precisión por qué ocurren las alucinaciones de la IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The model lacks sufficient parameters to store all facts, so it fabricates only when its knowledge storage capacity is exceeded. |
| **a** ES | El modelo carece de suficientes parámetros para almacenar todos los hechos, por lo que fabrica solo cuando se supera su capacidad de almacenamiento de conocimiento. |
| **b** EN | The model predicts the most plausible next words given its training, producing fluent output even when no factual grounding exists. `<<KEY` |
| **b** ES | El modelo predice las siguientes palabras más plausibles según su entrenamiento, produciendo una salida fluida incluso cuando no existe base factual. `<<KEY` |
| **c** EN | The model was trained on inaccurate data, so hallucinations directly reflect errors inherited from low-quality training sources. |
| **c** ES | El modelo fue entrenado con datos inexactos, por lo que las alucinaciones reflejan directamente errores heredados de fuentes de entrenamiento de baja calidad. |
| **d** EN | The model contains a software bug causing occasional errors, which developers can patch once the failure mode is identified. |
| **d** ES | El modelo contiene un error de software que provoca fallas ocasionales, que los desarrolladores pueden corregir una vez identificado el modo de falla. |

**explanation**

| | |
|---|---|
| EN | Hallucinations arise because AI models are built to predict plausible text continuations, not to verify facts before generating them. This is a fundamental property of how the models work, not a patchable bug, a training-data quality problem, or a storage-capacity limitation. |
| ES | Las alucinaciones ocurren porque los modelos de IA están diseñados para predecir continuaciones de texto plausibles, no para verificar hechos antes de generarlos. Esta es una propiedad fundamental de cómo funcionan los modelos, no un error corregible, un problema de calidad de datos de entrenamiento ni una limitación de capacidad de almacenamiento. |

### 80. AIE-I · 2.4 · `7a6bfae8-300e-4900-9505-411e6a304f2a`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain what AI "hallucination" is and why it happens

**stem**

| | |
|---|---|
| EN | A marketing associate asks an AI tool for three published case studies supporting a campaign strategy. The tool responds with specific titles, authors, and journal names in confident, polished prose. Which statement best describes this output? |
| ES | Un asociado de marketing le pide a una herramienta de IA tres estudios de caso publicados que respalden una estrategia de campaña. La herramienta responde con títulos específicos, autores y nombres de revistas en una prosa segura y pulida. ¿Cuál de las siguientes afirmaciones describe mejor este resultado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The citations are likely fabricated; AI generates plausible text rather than retrieving verified sources. `<<KEY` |
| **a** ES | Las citas probablemente son fabricadas; la IA genera texto plausible en lugar de recuperar fuentes verificadas. `<<KEY` |
| **b** EN | The response is trustworthy; confident, well-structured prose indicates the model's internal certainty threshold was met. |
| **b** ES | La respuesta es confiable; una prosa segura y bien estructurada indica que se cumplió el umbral de certeza interna del modelo. |
| **c** EN | Fabrication is unlikely; hallucinations mainly affect obscure topics, and marketing case studies are common training data. |
| **c** ES | La fabricación es poco probable; las alucinaciones afectan principalmente a temas oscuros, y los estudios de caso de marketing son datos de entrenamiento comunes. |
| **d** EN | The citations are probably accurate; detailed names and dates show the model is drawing on real stored knowledge. |
| **d** ES | Las citas probablemente son precisas; los nombres y fechas detallados muestran que el modelo está recurriendo a conocimiento real almacenado. |

**explanation**

| | |
|---|---|
| EN | AI models predict plausible continuations of text; they do not retrieve or verify sources, so specific-sounding citations can be entirely invented. Fluent, detailed output with names and dates is not a reliability signal — it is exactly what a hallucination looks like. The belief that detailed specifics confirm accuracy is a common misconception, as is the idea that confident tone reflects a passed internal certainty check, or that hallucinations are limited to obscure subject matter. |
| ES | Los modelos de IA predicen continuaciones plausibles de texto; no recuperan ni verifican fuentes, por lo que las citas que suenan específicas pueden ser completamente inventadas. Una salida fluida y detallada con nombres y fechas no es una señal de confiabilidad, sino exactamente lo que parece una alucinación. La creencia de que los detalles específicos confirman la precisión es un error común, al igual que la idea de que un tono seguro refleja una verificación interna de certeza superada, o que las alucinaciones se limitan a temas oscuros. |

### 81. AIE-I · 2.4 · `a910cf13-4954-4e5e-916d-2db1bd0956f2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain what AI "hallucination" is and why it happens

**stem**

| | |
|---|---|
| EN | A marketing associate asks an AI tool for a report's publication date. The AI responds in a confident, formal tone. Why is that confident tone not a reliable signal of accuracy? |
| ES | Un asociado de marketing le pide a una herramienta de IA la fecha de publicación de un informe. La IA responde con un tono seguro y formal. ¿Por qué ese tono seguro no es una señal confiable de precisión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Fluent prose indicates the model drew on verified sources, since incoherent output would signal uncertainty instead. |
| **a** ES | La prosa fluida indica que el modelo se basó en fuentes verificadas, ya que una salida incoherente señalaría incertidumbre. |
| **b** EN | AI tools only fabricate dates for obscure documents, so common reports are reliably accurate despite a confident tone. |
| **b** ES | Las herramientas de IA solo fabrican fechas para documentos poco conocidos, por lo que los informes comunes son confiablemente precisos a pesar de un tono seguro. |
| **c** EN | A confident tone signals a high internal certainty score, meaning the model only responds confidently when a probability threshold is met. |
| **c** ES | Un tono seguro indica una puntuación de certeza interna alta, lo que significa que el modelo solo responde con confianza cuando se alcanza un umbral de probabilidad. |
| **d** EN | AI tools optimize for plausible-sounding text, so fluent confidence reflects pattern-matching, not confirmed knowledge. `<<KEY` |
| **d** ES | Las herramientas de IA optimizan para producir texto que suene plausible, por lo que la confianza fluida refleja coincidencia de patrones, no conocimiento confirmado. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | AI models generate text by predicting plausible continuations, not by retrieving confirmed facts, so a confident tone reflects linguistic fluency rather than factual accuracy. The idea that confidence maps to an internal certainty score, or that fluency implies verified sourcing, are both misconceptions about how these models work. |
| ES | Los modelos de IA generan texto prediciendo continuaciones plausibles, no recuperando hechos confirmados, por lo que un tono seguro refleja fluidez lingüística más que precisión factual. La idea de que la confianza se corresponde con una puntuación de certeza interna, o que la fluidez implica fuentes verificadas, son conceptos erróneos sobre cómo funcionan estos modelos. |

### 82. AIE-I · 2.5 · `87e33f3b-ad62-432a-9852-81fd4cc66b6c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.5: Verify and evaluate AI output before relying on it

**stem**

| | |
|---|---|
| EN | An operations lead asks an AI tool to produce a supplier compliance summary to share with senior management. Who is accountable for the summary's accuracy once it is shared? |
| ES | Un líder de operaciones le pide a una herramienta de IA que produzca un resumen de cumplimiento de proveedores para compartir con la alta dirección. ¿Quién es responsable de la precisión del resumen una vez que se comparte? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The legal department, because human review is primarily a liability step that shifts responsibility away from the submitter. |
| **a** ES | El departamento legal, porque la revisión humana es principalmente un paso de responsabilidad legal que transfiere la responsabilidad lejos del remitente. |
| **b** EN | The operations lead, because the person who reviews and submits the output owns responsibility for its accuracy. `<<KEY` |
| **b** ES | El líder de operaciones, porque la persona que revisa y envía el resultado es responsable de su precisión. `<<KEY` |
| **c** EN | Senior management, because accountability transfers to whoever receives and acts on the information. |
| **c** ES | La alta dirección, porque la responsabilidad se transfiere a quien recibe y actúa sobre la información. |
| **d** EN | The AI tool's provider, because the tool generated the content and any errors originate there. |
| **d** ES | El proveedor de la herramienta de IA, porque la herramienta generó el contenido y cualquier error se origina allí. |

**explanation**

| | |
|---|---|
| EN | The human who reviews and submits an AI output is accountable for its accuracy, regardless of where errors originated. Human review is a quality control step, not merely a liability transfer mechanism, and accountability does not pass automatically to the recipient or the tool's provider. |
| ES | El ser humano que revisa y envía un resultado de IA es responsable de su precisión, independientemente de dónde se originaron los errores. La revisión humana es un paso de control de calidad, no simplemente un mecanismo de transferencia de responsabilidad, y la responsabilidad no pasa automáticamente al destinatario ni al proveedor de la herramienta. |

### 83. AIE-I · 2.5 · `f50704f0-33c8-459a-a3e9-46b8ee7af517`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 2.5: Verify and evaluate AI output before relying on it

**stem**

| | |
|---|---|
| EN | A teacher uses an AI tool to create a handout on a scientific topic. The AI cites a journal article whose title resolves to an existing webpage. What must the teacher do before distributing the handout? |
| ES | Un docente usa una herramienta de IA para crear un material didáctico sobre un tema científico. La IA cita un artículo de revista cuyo título lleva a una página web existente. ¿Qué debe hacer el docente antes de distribuir el material? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Distribute it immediately, since a resolving URL confirms the AI represented the article accurately. |
| **a** ES | Distribuirlo de inmediato, ya que una URL que funciona confirma que la IA representó el artículo con precisión. |
| **b** EN | Confirm only that the author name matches, since author accuracy signals overall citation fidelity. |
| **b** ES | Confirmar solo que el nombre del autor coincide, ya que la precisión del autor indica la fidelidad general de la cita. |
| **c** EN | Read the actual article to verify it supports the specific claims the handout attributes to it. `<<KEY` |
| **c** ES | Leer el artículo real para verificar que respalda las afirmaciones específicas que el material le atribuye. `<<KEY` |
| **d** EN | Accept the citation as verified because current AI training data includes accurate scientific references. |
| **d** ES | Aceptar la cita como verificada porque los datos de entrenamiento actuales de la IA incluyen referencias científicas precisas. |

**explanation**

| | |
|---|---|
| EN | A source that exists and resolves online may still not say what the AI claims it says. The teacher must read the article and confirm it actually supports the stated claims. A real URL or matching author name does not verify the accuracy of the AI's characterization of the source's content. |
| ES | Una fuente que existe y se puede acceder en línea puede no decir lo que la IA afirma que dice. El docente debe leer el artículo y confirmar que realmente respalda las afirmaciones indicadas. Una URL real o un nombre de autor coincidente no verifica la precisión con la que la IA caracterizó el contenido de la fuente. |

### 84. AIE-I · 2.6 · `2d1af4b4-88fd-42af-8fa6-d5fe2175c52c`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.6: Choose when generative AI is and is not the right tool for a task

**stem**

| | |
|---|---|
| EN | A marketing associate must write a first draft of a social media post. Brand guidelines and key messages are already documented. What should the associate do? |
| ES | Un asociado de marketing debe redactar un primer borrador de una publicación para redes sociales. Las pautas de marca y los mensajes clave ya están documentados. ¿Qué debería hacer el asociado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Use AI to generate a draft from the documented guidelines, then refine it before publishing. `<<KEY` |
| **a** ES | Usar IA para generar un borrador a partir de las pautas documentadas y luego refinarlo antes de publicarlo. `<<KEY` |
| **b** EN | Use AI to generate and publish directly, since reviewing the output is sufficient quality control. |
| **b** ES | Usar IA para generar y publicar directamente, ya que revisar el resultado es un control de calidad suficiente. |
| **c** EN | Avoid AI, because creative writing is one of the areas where AI performs least reliably. |
| **c** ES | Evitar la IA, porque la escritura creativa es una de las áreas donde la IA tiene menor confiabilidad. |
| **d** EN | Avoid AI, because brand voice is too nuanced for AI to capture from written guidelines. |
| **d** ES | Evitar la IA, porque la voz de marca es demasiado sutil para que la IA la capture a partir de pautas escritas. |

**explanation**

| | |
|---|---|
| EN | Generating a first draft from provided guidelines is a strong use case for generative AI. Human refinement before publishing ensures brand accuracy and tone. Creativity and nuance are not absolute barriers to AI use; the human review step addresses those concerns appropriately. |
| ES | Generar un primer borrador a partir de pautas proporcionadas es un caso de uso sólido para la IA generativa. El refinamiento humano antes de publicar garantiza la precisión de la marca y el tono. La creatividad y la sutileza no son barreras absolutas para el uso de IA; el paso de revisión humana aborda esas preocupaciones de manera apropiada. |

### 85. AIE-I · 2.6 · `7312ac33-e46b-481d-ad72-82a44f2c8890`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.6: Choose when generative AI is and is not the right tool for a task

**stem**

| | |
|---|---|
| EN | A finance analyst must confirm the exact current central bank interest rate before publishing a client report. What should the analyst do? |
| ES | Un analista financiero debe confirmar la tasa de interés actual exacta del banco central antes de publicar un informe para un cliente. ¿Qué debería hacer el analista? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Use AI, because a confident numerical answer from it is reliable enough for a client report. |
| **a** ES | Usar IA, porque una respuesta numérica confiable de su parte es suficientemente fiable para un informe de cliente. |
| **b** EN | Retrieve the rate directly from the central bank's official website. `<<KEY` |
| **b** ES | Obtener la tasa directamente del sitio web oficial del banco central. `<<KEY` |
| **c** EN | Use AI to find the rate, since a human will review the report before publishing. |
| **c** ES | Usar IA para encontrar la tasa, ya que un humano revisará el informe antes de publicarlo. |
| **d** EN | Use AI, because it processes large data sources faster than a manual search. |
| **d** ES | Usar IA, porque procesa grandes fuentes de datos más rápido que una búsqueda manual. |

**explanation**

| | |
|---|---|
| EN | Authoritative, time-sensitive financial figures must come from official primary sources. Generative AI can fabricate or present outdated numbers convincingly. Human review of AI output afterward does not make the original figure accurate, and retrieval speed does not offset the risk of publishing a wrong rate. |
| ES | Las cifras financieras autorizadas y sensibles al tiempo deben provenir de fuentes primarias oficiales. La IA generativa puede fabricar o presentar números desactualizados de manera convincente. La revisión humana del resultado de la IA no hace que la cifra original sea precisa, y la velocidad de recuperación no compensa el riesgo de publicar una tasa incorrecta. |

### 86. AIE-I · 2.6 · `7d8f0d0d-1312-4313-ab64-1cd93855f501`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 2.6: Choose when generative AI is and is not the right tool for a task

**stem**

| | |
|---|---|
| EN | A hiring manager wants to use a public AI tool to rank ten applicants and advance candidates to interviews, with no further human review. What should the manager do instead? |
| ES | Un gerente de contratación quiere usar una herramienta de IA pública para clasificar a diez candidatos y avanzarlos a entrevistas, sin ninguna revisión humana adicional. ¿Qué debería hacer el gerente en su lugar? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Proceed, because technical capability confirms AI is the right tool for this step. |
| **a** ES | Proceder, porque la capacidad técnica confirma que la IA es la herramienta adecuada para este paso. |
| **b** EN | Proceed, because AI applies criteria consistently, removing subjectivity from the process. |
| **b** ES | Proceder, porque la IA aplica criterios de manera consistente, eliminando la subjetividad del proceso. |
| **c** EN | Proceed, because AI rankings are unbiased and therefore fairer than human judgment. |
| **c** ES | Proceder, porque las clasificaciones de la IA son imparciales y, por lo tanto, más justas que el juicio humano. |
| **d** EN | Use AI to organize applicant notes, but keep a qualified human responsible for the final ranking. `<<KEY` |
| **d** ES | Usar IA para organizar las notas de los candidatos, pero mantener a un humano calificado responsable de la clasificación final. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Consequential hiring decisions require human accountability. AI can assist by organizing information but must not make the final call without review. AI tools can reflect biases from training data and are not inherently fairer or more consistent than informed human judgment. Technical capability alone does not make AI appropriate for sensitive personnel decisions. |
| ES | Las decisiones de contratación con consecuencias significativas requieren responsabilidad humana. La IA puede ayudar organizando información, pero no debe tomar la decisión final sin revisión. Las herramientas de IA pueden reflejar sesgos de los datos de entrenamiento y no son inherentemente más justas o consistentes que el juicio humano informado. La capacidad técnica por sí sola no hace que la IA sea apropiada para decisiones sensibles de personal. |

### 87. AIE-I · 3.1 · `1e1f105b-3f45-4e31-84d3-a7cff71a22dc`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.1: Protect privacy and confidential data when using AI tools

**stem**

| | |
|---|---|
| EN | A sales rep plans to paste a client's name, company, deal value, and contract terms into a free public AI chatbot to draft a follow-up email. What should she do? |
| ES | Una representante de ventas planea pegar el nombre de un cliente, la empresa, el valor del trato y los términos del contrato en un chatbot de IA público y gratuito para redactar un correo de seguimiento. ¿Qué debería hacer? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Replace the client's name with initials before pasting; removing the name fully anonymizes the data and makes it safe. |
| **a** ES | Reemplazar el nombre del cliente con iniciales antes de pegar; eliminar el nombre anonimiza completamente los datos y los hace seguros. |
| **b** EN | Paste everything as planned; reputable AI services cannot be hacked during normal use and pose no leakage risk. |
| **b** ES | Pegar todo como está planeado; los servicios de IA de buena reputación no pueden ser hackeados durante el uso normal y no representan riesgo de filtración. |
| **c** EN | Use generic placeholders for confidential details, then add the real client specifics herself after the AI responds. `<<KEY` |
| **c** ES | Usar marcadores genéricos para los detalles confidenciales y luego agregar ella misma los datos reales del cliente después de que la IA responda. `<<KEY` |
| **d** EN | Paste freely, then delete the chat history; deleting history ensures the provider permanently removes all entered data. |
| **d** ES | Pegar libremente y luego eliminar el historial del chat; eliminar el historial garantiza que el proveedor elimine permanentemente todos los datos ingresados. |

**explanation**

| | |
|---|---|
| EN | Entering confidential client details into a public AI tool risks data leakage because the provider may store or use those inputs. Using generic placeholders keeps sensitive information out of the tool entirely. Deleting chat history does not remove data from provider systems, and replacing a name with initials does not meaningfully anonymize financial and contractual details. |
| ES | Ingresar datos confidenciales de clientes en una herramienta de IA pública representa un riesgo de filtración de datos, ya que el proveedor puede almacenar o utilizar esas entradas. Usar marcadores genéricos mantiene la información sensible completamente fuera de la herramienta. Eliminar el historial del chat no elimina los datos de los sistemas del proveedor, y reemplazar un nombre con iniciales no anonimiza de manera significativa los detalles financieros y contractuales. |

### 88. AIE-I · 3.1 · `64697aec-21cd-4616-8008-04e237780edd`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.1: Protect privacy and confidential data when using AI tools

**stem**

| | |
|---|---|
| EN | An HR analyst summarizes affected employees' roles and locations in his own words before pasting the summary into a public AI tool, believing this removes the privacy risk. Is his approach safe? |
| ES | Un analista de recursos humanos resume con sus propias palabras los roles y ubicaciones de los empleados afectados antes de pegar el resumen en una herramienta de IA pública, creyendo que esto elimina el riesgo de privacidad. ¿Es seguro su enfoque? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Yes, because the risk only materializes if a breach occurs, and end-to-end encryption during the session prevents the tool from exposing the content he enters. |
| **a** ES | Sí, porque el riesgo solo se materializa si ocurre una brecha, y el cifrado de extremo a extremo durante la sesión evita que la herramienta exponga el contenido que él ingresa. |
| **b** EN | No, because summarized confidential data still reveals sensitive organizational information—workforce changes, roles, locations—and carries the same leakage risk as the original. `<<KEY` |
| **b** ES | No, porque los datos confidenciales resumidos aún revelan información organizacional sensible —cambios en la plantilla, roles, ubicaciones— y conllevan el mismo riesgo de filtración que la información original. `<<KEY` |
| **c** EN | Yes, because accessing the public tool over the corporate network subjects it to the same data-governance controls and retention policies as internal systems. |
| **c** ES | Sí, porque acceder a la herramienta pública a través de la red corporativa la somete a los mismos controles de gobernanza de datos y políticas de retención que los sistemas internos. |
| **d** EN | Yes, because paraphrasing strips out identifying details, so the substance of the confidential information no longer enters the external tool in a recognizable form. |
| **d** ES | Sí, porque la paráfrasis elimina los detalles identificativos, por lo que el contenido de la información confidencial ya no ingresa a la herramienta externa de forma reconocible. |

**explanation**

| | |
|---|---|
| EN | Paraphrasing does not eliminate privacy risk. The substance of the information—workforce changes, roles, locations—still enters an external system outside the organization's control and may be stored or used for model training. Accessing a public tool over the corporate network does not extend internal data governance to that tool's own infrastructure or policies. Encryption in transit protects data from interception by third parties but does not govern how the tool provider itself handles, stores, or uses the content submitted to it. |
| ES | La paráfrasis no elimina el riesgo de privacidad. La sustancia de la información —cambios en la plantilla, roles, ubicaciones— sigue ingresando a un sistema externo fuera del control de la organización y puede ser almacenada o utilizada para el entrenamiento del modelo. Acceder a una herramienta pública a través de la red corporativa no extiende la gobernanza de datos interna a la infraestructura ni a las políticas propias del proveedor de la herramienta. El cifrado en tránsito protege los datos de la interceptación por parte de terceros, pero no regula la forma en que el propio proveedor de la herramienta maneja, almacena o utiliza el contenido que se le envía. |

### 89. AIE-I · 3.2 · `1f989df2-94ad-4501-b3e3-abe5a717efe2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Recognize bias and fairness risks in AI outputs

**stem**

| | |
|---|---|
| EN | A recruitment platform removes names, genders, and postcodes before the AI scores CVs. The team believes this fully prevents biased scoring. Which concept best explains why this belief is mistaken? |
| ES | Una plataforma de reclutamiento elimina nombres, géneros y códigos postales antes de que la IA evalúe los currículums. El equipo cree que esto previene completamente la puntuación sesgada. ¿Qué concepto explica mejor por qué esta creencia es errónea? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Without sensitive attributes in the input, the model has no mechanism to produce biased scores. |
| **a** ES | Sin atributos sensibles en la entrada, el modelo no tiene ningún mecanismo para producir puntuaciones sesgadas. |
| **b** EN | Removing attributes prevents bias only when the training data was also collected without those attributes. |
| **b** ES | Eliminar atributos previene el sesgo solo cuando los datos de entrenamiento también fueron recopilados sin esos atributos. |
| **c** EN | Remaining variables like school names or hobbies can act as proxies for the removed attributes, preserving bias. `<<KEY` |
| **c** ES | Las variables restantes, como nombres de escuelas o pasatiempos, pueden actuar como variables proxy de los atributos eliminados, preservando el sesgo. `<<KEY` |
| **d** EN | The approach fails only because the model architecture was not updated when the attributes were removed. |
| **d** ES | El enfoque falla únicamente porque la arquitectura del modelo no se actualizó cuando se eliminaron los atributos. |

**explanation**

| | |
|---|---|
| EN | Sensitive attributes are often correlated with other variables that remain in the data — a phenomenon called proxy discrimination. The model can effectively reconstruct protected characteristics from details like school name or listed activities, so removing the explicit attribute does not remove the bias encoded in correlated features. |
| ES | Los atributos sensibles suelen estar correlacionados con otras variables que permanecen en los datos, un fenómeno denominado discriminación por proxy. El modelo puede reconstruir efectivamente las características protegidas a partir de detalles como el nombre de la escuela o las actividades listadas, por lo que eliminar el atributo explícito no elimina el sesgo codificado en las características correlacionadas. |

### 90. AIE-I · 3.2 · `249b7505-1856-4c2b-8695-7b7e3000511e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Recognize bias and fairness risks in AI outputs

**stem**

| | |
|---|---|
| EN | An AI writing tool consistently describes nurses as 'she' and engineers as 'he' in job-posting drafts. What does this pattern most likely indicate? |
| ES | Una herramienta de redacción con IA describe consistentemente a las enfermeras como 'ella' y a los ingenieros como 'él' en borradores de ofertas de trabajo. ¿Qué indica más probablemente este patrón? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The model architecture is flawed and must be replaced with a more advanced model. |
| **a** ES | La arquitectura del modelo es defectuosa y debe reemplazarse por un modelo más avanzado. |
| **b** EN | The tool is unbiased because it uses mathematical rules rather than personal opinions. |
| **b** ES | La herramienta no tiene sesgo porque utiliza reglas matemáticas en lugar de opiniones personales. |
| **c** EN | The tool absorbed gender stereotypes from its training data, producing biased output. `<<KEY` |
| **c** ES | La herramienta absorbió estereotipos de género de sus datos de entrenamiento, produciendo resultados sesgados. `<<KEY` |
| **d** EN | The pattern reflects statistical reality, so the tool is working correctly with no fairness concern. |
| **d** ES | El patrón refleja la realidad estadística, por lo que la herramienta funciona correctamente y no hay preocupación de equidad. |

**explanation**

| | |
|---|---|
| EN | Stereotyped language in AI output is a classic sign that the model absorbed occupational gender associations from its training data. Switching to a more sophisticated model does not fix the problem if training data still contains the same stereotypes. Statistical frequency in past text does not make a biased output fair or acceptable. |
| ES | El lenguaje estereotipado en los resultados de la IA es una señal clásica de que el modelo absorbió asociaciones de género ocupacional de sus datos de entrenamiento. Cambiar a un modelo más sofisticado no soluciona el problema si los datos de entrenamiento aún contienen los mismos estereotipos. La frecuencia estadística en textos pasados no hace que un resultado sesgado sea justo o aceptable. |

### 91. AIE-I · 3.2 · `b792d531-818b-453c-8d53-334991075b52`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Recognize bias and fairness risks in AI outputs

**stem**

| | |
|---|---|
| EN | A company screens job applications with an AI trained on ten years of its own hiring decisions. Senior roles were historically filled almost exclusively by men. Which statement best explains the fairness risk? |
| ES | Una empresa filtra solicitudes de empleo con una IA entrenada en diez años de sus propias decisiones de contratación. Los puestos de nivel superior históricamente fueron ocupados casi exclusivamente por hombres. ¿Cuál enunciado explica mejor el riesgo de equidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Risk is minimal because a larger historical dataset gives the model a more balanced view of merit. |
| **a** ES | El riesgo es mínimo porque un conjunto de datos históricos más grande le da al modelo una visión más equilibrada del mérito. |
| **b** EN | There is no risk because the tool applies the same scoring rules to every applicant equally. |
| **b** ES | No hay riesgo porque la herramienta aplica las mismas reglas de puntuación a cada solicitante por igual. |
| **c** EN | The tool will reproduce past gender imbalance because it learned patterns from historically skewed decisions. `<<KEY` |
| **c** ES | La herramienta reproducirá el desequilibrio de género pasado porque aprendió patrones a partir de decisiones históricamente sesgadas. `<<KEY` |
| **d** EN | Bias only arises if a developer deliberately programmed gender preferences into the screening rules. |
| **d** ES | El sesgo solo surge si un desarrollador programó deliberadamente preferencias de género en las reglas de selección. |

**explanation**

| | |
|---|---|
| EN | Training data that reflects historical discrimination causes the model to reproduce that discrimination — skewed past decisions become its learned definition of a good hire. Applying the same rule to everyone does not eliminate bias when the rule was learned from biased examples, and a larger biased dataset reinforces rather than corrects the skew. Bias does not require deliberate programming; it emerges from the data itself. |
| ES | Los datos de entrenamiento que reflejan discriminación histórica hacen que el modelo reproduzca esa discriminación: las decisiones pasadas sesgadas se convierten en su definición aprendida de una buena contratación. Aplicar la misma regla a todos no elimina el sesgo cuando esa regla fue aprendida a partir de ejemplos sesgados, y un conjunto de datos sesgado más grande refuerza en lugar de corregir el desvío. El sesgo no requiere programación deliberada; surge de los propios datos. |

### 92. AIE-I · 3.2 · `e8f80a43-a7b0-4b23-a220-c671a8489c3f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Recognize bias and fairness risks in AI outputs

**stem**

| | |
|---|---|
| EN | A marketing analyst assumes AI bias only matters in hiring or lending, not in content recommendations. Which statement best identifies the flaw in her reasoning? |
| ES | Una analista de marketing asume que el sesgo de la IA solo importa en la contratación o los préstamos, no en las recomendaciones de contenido. ¿Cuál enunciado identifica mejor el error en su razonamiento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | She is correct — content recommendations are low-stakes and biased suggestions have no meaningful effect. |
| **a** ES | Tiene razón: las recomendaciones de contenido son de bajo riesgo y las sugerencias sesgadas no tienen ningún efecto significativo. |
| **b** EN | She is mistaken — biased recommendations can reinforce stereotypes and limit what information groups encounter. `<<KEY` |
| **b** ES | Está equivocada: las recomendaciones sesgadas pueden reforzar estereotipos y limitar la información a la que acceden ciertos grupos. `<<KEY` |
| **c** EN | She is correct — bias in recommendation tools is a technical issue that does not affect real people. |
| **c** ES | Tiene razón: el sesgo en las herramientas de recomendación es un problema técnico que no afecta a personas reales. |
| **d** EN | She is mistaken — but only because recommendation tools operate at a scale that amplifies bias beyond other domains. |
| **d** ES | Está equivocada, pero solo porque las herramientas de recomendación operan a una escala que amplifica el sesgo más allá de otros ámbitos. |

**explanation**

| | |
|---|---|
| EN | Biased content recommendations can systematically expose different groups to narrower or distorted information, reinforcing stereotypes and shaping beliefs — a real impact even outside high-stakes domains like hiring or lending. Dismissing bias as irrelevant in everyday applications ignores these meaningful downstream effects on users. |
| ES | Las recomendaciones de contenido sesgadas pueden exponer sistemáticamente a diferentes grupos a información más limitada o distorsionada, reforzando estereotipos y moldeando creencias, un impacto real incluso fuera de ámbitos de alto riesgo como la contratación o los préstamos. Ignorar el sesgo como irrelevante en aplicaciones cotidianas pasa por alto estos efectos significativos sobre los usuarios. |

### 93. AIE-I · 3.3 · `2cc60850-8a79-4297-8ee7-c286ef66be51`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Apply the principle of human oversight (keeping a human in the loop)

**stem**

| | |
|---|---|
| EN | An office manager watches a real-time dashboard of AI-generated purchase order approvals but does not review each order individually. A mistaken order for ten times the needed quantity is approved automatically. What does this illustrate? |
| ES | Un gerente de oficina observa un panel en tiempo real de aprobaciones de órdenes de compra generadas por IA, pero no revisa cada orden individualmente. Una orden errónea por diez veces la cantidad necesaria se aprueba automáticamente. ¿Qué ilustra esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | That the AI vendor bears primary responsibility, because a correctly built model would have flagged the quantity error. |
| **a** ES | Que el proveedor de IA tiene la responsabilidad principal, porque un modelo correctamente construido habría señalado el error de cantidad. |
| **b** EN | That the error is systemic and not attributable to the manager, since automated processes distribute accountability broadly. |
| **b** ES | Que el error es sistémico y no atribuible al gerente, ya que los procesos automatizados distribuyen la responsabilidad ampliamente. |
| **c** EN | That dashboard monitoring without individual review is not human oversight, leaving no accountable person per decision. `<<KEY` |
| **c** ES | Que monitorear un panel sin revisión individual no es supervisión humana, dejando a ninguna persona responsable por cada decisión. `<<KEY` |
| **d** EN | That oversight was present because the manager was available to intervene, making this an acceptable level of involvement. |
| **d** ES | Que la supervisión estuvo presente porque el gerente estaba disponible para intervenir, lo que hace de esto un nivel aceptable de participación. |

**explanation**

| | |
|---|---|
| EN | Being present at a dashboard does not fulfill the human-in-the-loop requirement; each consequential decision needs active individual review before it takes effect. Automation does not dissolve individual accountability by making errors appear systemic. The AI vendor does not absorb responsibility for decisions the manager was positioned to review and approve. |
| ES | Estar presente en un panel no cumple el requisito del humano en el circuito; cada decisión relevante necesita una revisión activa e individual antes de que entre en vigor. La automatización no disuelve la responsabilidad individual haciendo que los errores parezcan sistémicos. El proveedor de IA no absorbe la responsabilidad por decisiones que el gerente estaba en posición de revisar y aprobar. |

### 94. AIE-I · 3.3 · `843ecd28-aeb4-46aa-ae9c-ab8c13d7be1b`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.3: Apply the principle of human oversight (keeping a human in the loop)

**stem**

| | |
|---|---|
| EN | A team leader approves an AI-recommended performance rating. Three months later, the rating is found to be based on flawed input data. The leader argues the AI is responsible for the downstream consequences. Is this valid? |
| ES | Un líder de equipo aprueba una calificación de desempeño recomendada por IA. Tres meses después, se descubre que la calificación se basó en datos de entrada defectuosos. El líder argumenta que la IA es responsable de las consecuencias posteriores. ¿Es esto válido? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Yes, because unforeseeable downstream consequences transfer responsibility to the AI once a human has approved its output. |
| **a** ES | Sí, porque las consecuencias posteriores imprevisibles transfieren la responsabilidad a la IA una vez que un humano ha aprobado su resultado. |
| **b** EN | No, because the team leader owns the decision they approved, and responsibility does not shift to the AI for later consequences. `<<KEY` |
| **b** ES | No, porque el líder del equipo es dueño de la decisión que aprobó, y la responsabilidad no se transfiere a la IA por consecuencias posteriores. `<<KEY` |
| **c** EN | No, because the team leader should always be able to detect flawed data before approving any AI recommendation. |
| **c** ES | No, porque el líder del equipo siempre debe ser capaz de detectar datos defectuosos antes de aprobar cualquier recomendación de IA. |
| **d** EN | Yes, because the AI vendor is liable for errors caused by the model's own data processing, regardless of human approval. |
| **d** ES | Sí, porque el proveedor de IA es responsable de los errores causados por el procesamiento de datos del propio modelo, independientemente de la aprobación humana. |

**explanation**

| | |
|---|---|
| EN | Approving a decision means owning it and its consequences; accountability does not transfer to the AI system after the fact, even for unforeseen outcomes. AI tools hold no legal or moral responsibility. The claim that a human must always detect flawed data is incorrect—the point is that approving the output makes the leader responsible regardless of whether the flaw was detectable. |
| ES | Aprobar una decisión significa ser dueño de ella y de sus consecuencias; la responsabilidad no se transfiere al sistema de IA después del hecho, incluso para resultados imprevistos. Las herramientas de IA no tienen responsabilidad legal ni moral. La afirmación de que un humano siempre debe detectar datos defectuosos es incorrecta: el punto es que aprobar el resultado hace al líder responsable independientemente de si el defecto era detectable. |

### 95. AIE-I · 3.3 · `cfcccf94-c328-451d-953e-e277e0f07739`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Apply the principle of human oversight (keeping a human in the loop)

**stem**

| | |
|---|---|
| EN | An operations lead reads the AI's explanation of how it built a staffing schedule, then forwards the schedule without checking the actual shift assignments. Is the oversight requirement met? |
| ES | Un líder de operaciones lee la explicación de la IA sobre cómo construyó un horario de personal, y luego reenvía el horario sin verificar las asignaciones de turno reales. ¿Se cumple el requisito de supervisión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Yes, because reading the AI's full explanation of its reasoning satisfies the human oversight requirement. |
| **a** ES | Sí, porque leer la explicación completa del razonamiento de la IA satisface el requisito de supervisión humana. |
| **b** EN | No, because the lead must evaluate the actual shift assignments, not just the AI's explanation of its method. `<<KEY` |
| **b** ES | No, porque el líder debe evaluar las asignaciones de turno reales, no solo la explicación de la IA sobre su método. `<<KEY` |
| **c** EN | Yes, because forwarding the schedule makes the lead accountable, which is all human oversight requires here. |
| **c** ES | Sí, porque reenviar el horario hace al líder responsable, que es todo lo que la supervisión humana requiere en este caso. |
| **d** EN | No, but only because the lead skipped the explanation; reading it carefully would have completed the oversight requirement. |
| **d** ES | No, pero solo porque el líder omitió la explicación; leerla con atención habría completado el requisito de supervisión. |

**explanation**

| | |
|---|---|
| EN | Receiving an explanation from an AI tool does not complete oversight; the human must actually evaluate the decisions the tool produced. Reading methodology without checking the resulting assignments means no one has genuinely reviewed what will affect employees. Understanding how the AI reasoned is useful but does not replace verifying what it decided. |
| ES | Recibir una explicación de una herramienta de IA no completa la supervisión; el ser humano debe evaluar efectivamente las decisiones que la herramienta produjo. Leer la metodología sin verificar las asignaciones resultantes significa que nadie ha revisado genuinamente lo que afectará a los empleados. Entender cómo razonó la IA es útil, pero no reemplaza verificar lo que decidió. |

### 96. AIE-I · 3.3 · `da20ee66-4ba6-4736-b2d9-dff04a7610e6`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Apply the principle of human oversight (keeping a human in the loop)

**stem**

| | |
|---|---|
| EN | A manager instructs the team to follow all AI-generated campaign budget recommendations without review to speed up approvals. A recommendation causes a budget error. Where does accountability lie? |
| ES | Un gerente instruye al equipo a seguir todas las recomendaciones de presupuesto de campaña generadas por IA sin revisión para agilizar las aprobaciones. Una recomendación provoca un error presupuestario. ¿Dónde recae la responsabilidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | With the associate who applied the recommendation, because acting on a manager's instruction does not eliminate the individual's own accountability for the decision. `<<KEY` |
| **a** ES | En el colaborador que aplicó la recomendación, porque actuar siguiendo las instrucciones de un gerente no elimina la responsabilidad individual de la persona por la decisión. `<<KEY` |
| **b** EN | With the AI system, because the error originated in its recommendation and human actors were simply executing a machine-generated output. |
| **b** ES | En el sistema de IA, porque el error se originó en su recomendación y los actores humanos simplemente ejecutaban un resultado generado por la máquina. |
| **c** EN | Distributed across the organization as a whole, because automating budget decisions makes the error systemic and removes attribution from any single person. |
| **c** ES | Distribuida en toda la organización, porque automatizar las decisiones presupuestarias hace que el error sea sistémico y elimina la atribución de cualquier persona individual. |
| **d** EN | With the manager alone, because issuing the instruction transfers full accountability upward and shields those who followed orders from any responsibility. |
| **d** ES | Solo en el gerente, porque emitir la instrucción transfiere la responsabilidad total hacia arriba y protege a quienes siguieron órdenes de cualquier responsabilidad. |

**explanation**

| | |
|---|---|
| EN | A manager's instruction to follow AI recommendations does not transfer the associate's individual accountability upward. The associate who acts on a decision remains responsible for that action. Accountability cannot rest with an AI system, nor does automation dissolve individual responsibility by making errors appear systemic. |
| ES | La instrucción de un gerente de seguir las recomendaciones de la IA no transfiere la responsabilidad individual del colaborador hacia arriba. El colaborador que actúa sobre una decisión sigue siendo responsable de esa acción. La responsabilidad no puede recaer en un sistema de IA, ni la automatización disuelve la responsabilidad individual haciendo que los errores parezcan sistémicos. |

### 97. AIE-I · 3.4 · `2fa659f8-c483-40ad-9c76-da440900b327`

shown **2×** in the eight scored attempts — 1 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 3.4: Recall the ethical red lines for workplace AI use and when disclosure is expected

**stem**

| | |
|---|---|
| EN | A marketing associate uses AI to restructure, reword, and substantially expand a short brief into a full proposal, then submits it to a client with no mention of AI involvement. Which statement best describes this situation? |
| ES | Un asociado de marketing usa IA para reestructurar, reformular y ampliar sustancialmente un breve resumen en una propuesta completa, y luego la envía a un cliente sin mencionar la participación de la IA. ¿Cuál de las siguientes afirmaciones describe mejor esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No disclosure is needed because the associate wrote the original brief and reviewed the final text. |
| **a** ES | No se requiere divulgación porque el asociado escribió el resumen original y revisó el texto final. |
| **b** EN | Disclosure is satisfied by adding a brief 'AI-assisted' tag at the end of the submitted document. |
| **b** ES | La divulgación se cumple agregando una breve etiqueta 'asistido por IA' al final del documento enviado. |
| **c** EN | No disclosure is needed because AI only assisted; disclosure applies only when AI wrote the entire document. |
| **c** ES | No se requiere divulgación porque la IA solo asistió; la divulgación aplica únicamente cuando la IA redactó el documento completo. |
| **d** EN | Disclosure is expected because AI materially shaped the final work delivered to the client. `<<KEY` |
| **d** ES | Se espera divulgación porque la IA influyó de manera sustancial en el trabajo final entregado al cliente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Transparency obligations apply whenever AI materially shaped the work, not only when it produced the work entirely. Substantially restructuring and expanding a document counts as material involvement, so the client should be informed. Writing the original brief and reviewing the output does not eliminate the disclosure obligation when AI drove the final form. A token label appended to the end does not adequately convey the degree of AI involvement. |
| ES | Las obligaciones de transparencia aplican siempre que la IA haya influido de manera sustancial en el trabajo, no solo cuando lo produjo en su totalidad. Reestructurar y ampliar significativamente un documento cuenta como participación material, por lo que el cliente debe ser informado. Haber escrito el resumen original y revisado el resultado no elimina la obligación de divulgación cuando la IA determinó la forma final. Una etiqueta simbólica agregada al final no transmite adecuadamente el grado de participación de la IA. |

### 98. AIE-I · 3.4 · `48a0878e-5ed6-4a79-aca7-5eab3f383751`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.4: Recall the ethical red lines for workplace AI use and when disclosure is expected

**stem**

| | |
|---|---|
| EN | Under the EU AI Act's Article 4 literacy expectation, what must organizations promote among staff who use AI tools? |
| ES | Según la expectativa de alfabetización del Artículo 4 de la Ley de IA de la UE, ¿qué deben promover las organizaciones entre el personal que usa herramientas de IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Full technical understanding of the algorithms underlying each approved AI tool. |
| **a** ES | La comprensión técnica completa de los algoritmos que subyacen a cada herramienta de IA aprobada. |
| **b** EN | The ability to build and fine-tune AI models relevant to their job function. |
| **b** ES | La capacidad de construir y ajustar modelos de IA relevantes para su función laboral. |
| **c** EN | Formal AI ethics certification before any workplace AI tool may be accessed. |
| **c** ES | Una certificación formal en ética de IA antes de que se pueda acceder a cualquier herramienta de IA en el lugar de trabajo. |
| **d** EN | Sufficient AI literacy to use tools responsibly and recognize their risks. `<<KEY` |
| **d** ES | Una alfabetización en IA suficiente para usar las herramientas de manera responsable y reconocer sus riesgos. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Article 4 of the EU AI Act requires organizations to promote an appropriate level of AI literacy — meaning staff understand enough to use AI responsibly and recognize its limitations and risks. It does not require technical expertise, model-building skills, or formal certification before access is granted. Those options each overstate what the Article demands. |
| ES | El Artículo 4 de la Ley de IA de la UE exige que las organizaciones promuevan un nivel apropiado de alfabetización en IA, lo que significa que el personal comprenda lo suficiente para usar la IA de manera responsable y reconocer sus limitaciones y riesgos. No requiere experiencia técnica, habilidades para construir modelos ni certificación formal antes de que se otorgue el acceso. Esas opciones exageran lo que el Artículo exige. |

### 99. AIE-I · 3.4 · `4e9d523b-48b4-4381-8ce4-50c93d434f89`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.4: Recall the ethical red lines for workplace AI use and when disclosure is expected

**stem**

| | |
|---|---|
| EN | An organization's acceptable-use policy approves a general-purpose AI writing tool. Which statement correctly describes an employee's remaining ethical obligations? |
| ES | La política de uso aceptable de una organización aprueba una herramienta de escritura con IA de propósito general. ¿Cuál afirmación describe correctamente las obligaciones éticas restantes de un empleado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Employees must still avoid harmful uses—such as entering confidential data or deceiving recipients—even when the tool is approved. `<<KEY` |
| **a** ES | Los empleados aún deben evitar usos dañinos —como ingresar datos confidenciales o engañar a los destinatarios— incluso cuando la herramienta está aprobada. `<<KEY` |
| **b** EN | General approval implicitly permits entering any organizational data, because the tool was already vetted for company use. |
| **b** ES | La aprobación general permite implícitamente ingresar cualquier dato organizacional, porque la herramienta ya fue evaluada para uso empresarial. |
| **c** EN | Ethical obligations for AI use apply only to technical staff; general employees using approved tools bear no individual responsibility. |
| **c** ES | Las obligaciones éticas sobre el uso de IA aplican solo al personal técnico; los empleados en general que usan herramientas aprobadas no tienen responsabilidad individual. |
| **d** EN | IT approval removes any duty to judge whether a specific use, such as entering confidential data, is appropriate. |
| **d** ES | La aprobación del área de TI elimina cualquier obligación de juzgar si un uso específico, como ingresar datos confidenciales, es apropiado. |

**explanation**

| | |
|---|---|
| EN | Tool approval covers the tool itself, not every possible use of it. Employees retain independent ethical obligations—such as protecting confidential data and not deceiving audiences—regardless of IT or compliance sign-off. Believing that approval eliminates further individual judgment, that general approval covers all data types, or that only technical staff bear ethical duties are each genuine misconceptions that the correct answer refutes. |
| ES | La aprobación de una herramienta cubre la herramienta en sí misma, no todos los usos posibles de ella. Los empleados mantienen obligaciones éticas independientes —como proteger datos confidenciales y no engañar a las audiencias— independientemente de la autorización de TI o de cumplimiento normativo. Creer que la aprobación elimina el juicio individual posterior, que la aprobación general cubre todos los tipos de datos, o que solo el personal técnico tiene obligaciones éticas son concepciones erróneas genuinas que la respuesta correcta refuta. |

### 100. AIE-I · 3.4 · `a39fa179-b512-4151-bcf8-78b60d13e60a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.4: Recall the ethical red lines for workplace AI use and when disclosure is expected

**stem**

| | |
|---|---|
| EN | IT approves an AI writing tool for general office use. A marketing associate uses it to draft press releases containing unverified competitor claims. Is this within policy? |
| ES | TI aprueba una herramienta de redacción con IA para uso general en la oficina. Un asociado de marketing la usa para redactar comunicados de prensa que contienen afirmaciones no verificadas sobre competidores. ¿Esto está dentro de la política? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No, because AI tools may never be used to produce content intended for external audiences. |
| **a** ES | No, porque las herramientas de IA nunca pueden usarse para producir contenido destinado a audiencias externas. |
| **b** EN | Yes, because writing external communications is a standard task covered by general approval. |
| **b** ES | Sí, porque redactar comunicaciones externas es una tarea estándar cubierta por la aprobación general. |
| **c** EN | No, because tool approval does not override the policy's rules on deceptive or unverified content. `<<KEY` |
| **c** ES | No, porque la aprobación de la herramienta no anula las reglas de la política sobre contenido engañoso o no verificado. `<<KEY` |
| **d** EN | Yes, because IT approval of a tool authorizes all uses of that tool. |
| **d** ES | Sí, porque la aprobación de TI de una herramienta autoriza todos los usos de esa herramienta. |

**explanation**

| | |
|---|---|
| EN | IT or procurement approval confirms a tool is technically safe to use; it does not authorize every possible use of that tool. Publishing unverified claims about competitors violates the ethical prohibition on deception, independently of whether the tool itself is approved. The claim that AI may never be used for external content is too absolute and not a standard policy position. |
| ES | La aprobación de TI o de adquisiciones confirma que una herramienta es técnicamente segura de usar; no autoriza todos los usos posibles de esa herramienta. Publicar afirmaciones no verificadas sobre competidores viola la prohibición ética del engaño, independientemente de si la herramienta en sí está aprobada. La afirmación de que la IA nunca puede usarse para contenido externo es demasiado absoluta y no es una postura estándar de política. |

### 101. AIE-I · 3.4 · `c7f3595b-13a6-4589-a6b9-ce64abaa2bd9`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.4: Recall the ethical red lines for workplace AI use and when disclosure is expected

**stem**

| | |
|---|---|
| EN | Which action represents an ethical red line for workplace AI use, regardless of what an organization's written policy says? |
| ES | ¿Qué acción representa una línea roja ética en el uso de IA en el lugar de trabajo, independientemente de lo que diga la política escrita de una organización? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Using AI to draft a routine internal email without disclosing it to colleagues. |
| **a** ES | Usar IA para redactar un correo electrónico interno rutinario sin informárselo a los colegas. |
| **b** EN | Using AI to generate fabricated citations in a report submitted to a client. `<<KEY` |
| **b** ES | Usar IA para generar citas falsificadas en un informe entregado a un cliente. `<<KEY` |
| **c** EN | Using AI to reformat a spreadsheet before sharing it with a manager. |
| **c** ES | Usar IA para reformatear una hoja de cálculo antes de compartirla con un gerente. |
| **d** EN | Using AI to summarize a public industry report for a team meeting. |
| **d** ES | Usar IA para resumir un informe público del sector para una reunión de equipo. |

**explanation**

| | |
|---|---|
| EN | Fabricating citations is deception and a form of fraud — both are ethical red lines that hold whether or not a policy explicitly names them. The other actions involve low-stakes or routine AI assistance that does not cross an ethical threshold. Ethical red lines such as fabrication and fraud are hard prohibitions in any professional context, independent of policy wording. |
| ES | Falsificar citas es un engaño y una forma de fraude; ambas son líneas rojas éticas que se mantienen independientemente de si una política las menciona explícitamente. Las otras acciones implican asistencia de IA rutinaria o de bajo riesgo que no cruza un umbral ético. Las líneas rojas éticas, como la falsificación y el fraude, son prohibiciones absolutas en cualquier contexto profesional, independientemente del texto de la política. |

### 102. AIE-I · 3.5 · `4540734f-2901-4143-b391-6e96eea27117`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.5: Apply the organization's AI-use policy to decide whether a specific use is permitted

**stem**

| | |
|---|---|
| EN | A finance analyst wants to use a free, browser-based AI tool to draft a supplier performance summary. The organization's acceptable-use policy lists approved tools but does not mention this specific tool. What should the analyst do? |
| ES | Un analista financiero quiere usar una herramienta de IA gratuita y basada en navegador para redactar un resumen del desempeño de proveedores. La política de uso aceptable de la organización enumera las herramientas aprobadas, pero no menciona esta herramienta específica. ¿Qué debería hacer el analista? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Proceed, because browser-based tools on personal accounts fall outside any acceptable-use policy. |
| **a** ES | Proceder, porque las herramientas basadas en navegador en cuentas personales quedan fuera de cualquier política de uso aceptable. |
| **b** EN | Proceed, because publicly available tools automatically qualify as organizationally approved. |
| **b** ES | Proceder, porque las herramientas de acceso público califican automáticamente como aprobadas por la organización. |
| **c** EN | Pause and seek clarification, because absence from the approved list does not establish permission. `<<KEY` |
| **c** ES | Pausar y buscar aclaración, porque la ausencia en la lista de aprobadas no establece permiso. `<<KEY` |
| **d** EN | Proceed, because policy silence on a tool implies it is permitted for all work tasks. |
| **d** ES | Proceder, porque el silencio de la política sobre una herramienta implica que está permitida para todas las tareas laborales. |

**explanation**

| | |
|---|---|
| EN | An acceptable-use policy that omits a tool does not implicitly permit it — absence from the approved list means the tool is unapproved until confirmed otherwise, so the analyst must pause and seek clarification. Assuming policy silence implies permission conflates omission with approval. Treating browser-based or personal-account tools as outside policy scope ignores that work tasks fall under organizational policy regardless of access method. Assuming public availability confers organizational approval misunderstands how acceptable-use policies work. |
| ES | Una política de uso aceptable que omite una herramienta no la permite implícitamente: la ausencia de la lista de aprobadas significa que la herramienta no está aprobada hasta que se confirme lo contrario, por lo que el analista debe pausar y buscar aclaración. Asumir que el silencio de la política implica permiso confunde la omisión con la aprobación. Considerar que las herramientas basadas en navegador o en cuentas personales quedan fuera del alcance de la política ignora que las tareas laborales están sujetas a la política organizacional independientemente del método de acceso. Asumir que la disponibilidad pública otorga aprobación organizacional refleja una comprensión incorrecta de cómo funcionan las políticas de uso aceptable. |

### 103. AIE-I · 3.5 · `4b5d4ed5-bfec-4a18-9b87-ff11ab4c747c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Apply the organization's AI-use policy to decide whether a specific use is permitted

**stem**

| | |
|---|---|
| EN | A finance analyst needs to summarize a spreadsheet with sensitive budget figures using an external AI tool. The policy bars entering confidential data into external tools. What should the analyst do? |
| ES | Una analista de finanzas necesita resumir una hoja de cálculo con cifras presupuestarias confidenciales usando una herramienta de IA externa. La política prohíbe ingresar datos confidenciales en herramientas externas. ¿Qué debe hacer la analista? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Withhold the figures and check whether an approved internal tool is available for this task. `<<KEY` |
| **a** ES | Omitir las cifras y verificar si hay una herramienta interna aprobada disponible para esta tarea. `<<KEY` |
| **b** EN | Enter the data, because the manager verbally approved using AI tools for budget work this quarter. |
| **b** ES | Ingresar los datos, porque el gerente aprobó verbalmente el uso de herramientas de IA para trabajo presupuestario este trimestre. |
| **c** EN | Enter the data after removing employee names, because anonymizing figures eliminates any policy concern. |
| **c** ES | Ingresar los datos después de eliminar los nombres de los empleados, porque anonimizar las cifras elimina cualquier preocupación relacionada con la política. |
| **d** EN | Enter the data, because no 'confidential' label means it falls outside the policy's data restrictions. |
| **d** ES | Ingresar los datos, porque la ausencia de una etiqueta de 'confidencial' significa que quedan fuera de las restricciones de datos de la política. |

**explanation**

| | |
|---|---|
| EN | Data-classification rules cover sensitive information regardless of formal labeling, so unclassified but sensitive budget data must not be entered into an external tool without authorization. Verbal approval does not override the written policy, and removing employee names does not make financial figures non-sensitive. |
| ES | Las reglas de clasificación de datos cubren la información sensible independientemente del etiquetado formal, por lo que los datos presupuestarios sensibles pero no clasificados no deben ingresarse en una herramienta externa sin autorización. La aprobación verbal no anula la política escrita, y eliminar los nombres de los empleados no hace que las cifras financieras dejen de ser sensibles. |

### 104. AISM-I · 1.2 · `3a6dc3dc-8021-4119-abd0-f68c8b823aa1`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.2: Define the core terms - service, product, digital product, digital service - and recognize an AI-infused service as one whose behavior is partly produced by a model.

**stem**

| | |
|---|---|
| EN | A streaming platform updates its recommendation engine weekly, adding features without releasing versioned packages to users. Which characteristic of a digital product does this best illustrate? |
| ES | Una plataforma de streaming actualiza su motor de recomendaciones semanalmente, añadiendo funcionalidades sin lanzar paquetes con versiones a los usuarios. ¿Qué característica de un producto digital ilustra mejor esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continuous evolution, because the product changes persistently rather than shipping discrete stable versions. `<<KEY` |
| **a** ES | Evolución continua, porque el producto cambia de manera persistente en lugar de distribuir versiones estables discretas. `<<KEY` |
| **b** EN | Agile delivery, because weekly release cycles are the defining feature of how digital products are built. |
| **b** ES | Entrega ágil, porque los ciclos de lanzamiento semanales son la característica definitoria de cómo se construyen los productos digitales. |
| **c** EN | Completion at deployment, because a live platform is stable until the next planned release cycle begins. |
| **c** ES | Finalización en el despliegue, porque una plataforma en producción es estable hasta que comienza el siguiente ciclo de lanzamiento planificado. |
| **d** EN | Value transfer, because the provider creates recommendation value and transfers it fully to the consumer each session. |
| **d** ES | Transferencia de valor, porque el proveedor crea valor de recomendación y lo transfiere completamente al consumidor en cada sesión. |

**explanation**

| | |
|---|---|
| EN | Continuous evolution—changing persistently rather than shipping discrete stable versions—is the defining characteristic this scenario illustrates. The misconception that a digital product is complete at deployment mirrors physical product shipment and contradicts this definition. Labeling it agile delivery confuses a development practice with a product characteristic, and value transfer mischaracterizes the relationship as unilateral rather than co-created. |
| ES | La evolución continua —cambiar de manera persistente en lugar de distribuir versiones estables discretas— es la característica definitoria que ilustra este escenario. La idea errónea de que un producto digital se completa en el despliegue refleja el modelo de envío de productos físicos y contradice esta definición. Etiquetarlo como entrega ágil confunde una práctica de desarrollo con una característica del producto, y la transferencia de valor caracteriza erróneamente la relación como unilateral en lugar de co-creada. |

### 105. AISM-I · 1.2 · `e603f3a4-ef36-4dcf-a4e7-5b43b46870c9`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.2: Define the core terms - service, product, digital product, digital service - and recognize an AI-infused service as one whose behavior is partly produced by a model.

**stem**

| | |
|---|---|
| EN | A vendor sells a perpetual software license. The buyer installs, maintains, and operates it on their own servers. Which classification is most accurate? |
| ES | Un proveedor vende una licencia de software perpetua. El comprador la instala, mantiene y opera en sus propios servidores. ¿Cuál es la clasificación más precisa? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A digital service, because the software is delivered digitally and the vendor continues to enable its value. |
| **a** ES | Un servicio digital, porque el software se entrega de forma digital y el proveedor continúa habilitando su valor. |
| **b** EN | A service, because value co-creation occurs whenever the buyer uses the software in business processes. |
| **b** ES | Un servicio, porque la co-creación de valor ocurre cada vez que el comprador utiliza el software en sus procesos de negocio. |
| **c** EN | A digital product, because it is delivered digitally and the buyer owns the operational costs and risks. `<<KEY` |
| **c** ES | Un producto digital, porque se entrega de forma digital y el comprador asume los costos y riesgos operativos. `<<KEY` |
| **d** EN | A hybrid offering, because perpetual licenses always combine product ownership with an implied ongoing service relationship. |
| **d** ES | Una oferta híbrida, porque las licencias perpetuas siempre combinan la propiedad del producto con una relación de servicio continuo implícita. |

**explanation**

| | |
|---|---|
| EN | A digital product is a configured resource delivered digitally; when the buyer assumes operational costs and risks through a perpetual license, no ongoing service relationship exists with the vendor. A service requires the provider to retain those costs and risks. The claim that perpetual licenses always imply an ongoing service relationship conflates the two concepts and contradicts the defining criterion of service. |
| ES | Un producto digital es un recurso configurado entregado de forma digital; cuando el comprador asume los costos y riesgos operativos mediante una licencia perpetua, no existe una relación de servicio continuo con el proveedor. Un servicio requiere que el proveedor retenga esos costos y riesgos. La afirmación de que las licencias perpetuas siempre implican una relación de servicio continuo confunde ambos conceptos y contradice el criterio definitorio del servicio. |

### 106. AISM-I · 1.3 · `5a37b4fb-5a79-4de4-a39c-9ebc49fea4ab`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Explain value co-creation - how value is jointly produced by provider and consumer, not delivered - and how it changes when the provider's contribution is a probabilistic AI model (co-creation under u

**stem**

| | |
|---|---|
| EN | A user submits a detailed prompt to a generative AI service and considers co-creation complete at that point. Which concept does this view misunderstand? |
| ES | Un usuario envía un prompt detallado a un servicio de IA generativa y considera que la co-creación está completa en ese momento. ¿Qué concepto malinterpreta esta visión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Co-creation under uncertainty—value is realized only when the consumer evaluates and applies the probabilistic output. `<<KEY` |
| **a** ES | Co-creación bajo incertidumbre: el valor solo se realiza cuando el consumidor evalúa y aplica el resultado probabilístico. `<<KEY` |
| **b** EN | Provider contribution—the model's generation is a provider act, so co-creation ends when the output is returned. |
| **b** ES | Contribución del proveedor: la generación del modelo es un acto del proveedor, por lo que la co-creación termina cuando se devuelve el resultado. |
| **c** EN | Consumer contribution—a detailed prompt already represents the consumer's full and final input to the interaction. |
| **c** ES | Contribución del consumidor: un prompt detallado ya representa el insumo completo y definitivo del consumidor en la interacción. |
| **d** EN | Value delivery—the prompt transfers value from consumer to provider, completing the exchange at submission. |
| **d** ES | Entrega de valor: el prompt transfiere valor del consumidor al proveedor, completando el intercambio en el momento del envío. |

**explanation**

| | |
|---|---|
| EN | Submitting a prompt is only part of the consumer's contribution. Because the model's output is probabilistic, value is not realized until the consumer interprets the output, judges its relevance, and applies it within their context. Co-creation continues through that evaluation and use phase, which is why AI services require different expectation-setting than deterministic ones. |
| ES | Enviar un prompt es solo una parte de la contribución del consumidor. Dado que el resultado del modelo es probabilístico, el valor no se realiza hasta que el consumidor interpreta el resultado, juzga su relevancia y lo aplica dentro de su contexto. La co-creación continúa durante esa fase de evaluación y uso, razón por la cual los servicios de IA requieren una configuración de expectativas diferente a la de los servicios deterministas. |

### 107. AISM-I · 1.3 · `74fd259c-6e87-4afe-95b3-aa298e42ea4c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Explain value co-creation - how value is jointly produced by provider and consumer, not delivered - and how it changes when the provider's contribution is a probabilistic AI model (co-creation under u

**stem**

| | |
|---|---|
| EN | A consumer uses an AI writing assistant to draft legal summaries. The model produces fluent, confident text but the consumer lacks domain expertise to verify accuracy. Why has value NOT yet been co-created? |
| ES | Un consumidor utiliza un asistente de escritura con IA para redactar resúmenes legales. El modelo produce texto fluido y seguro, pero el consumidor carece de experiencia en el dominio para verificar la precisión. ¿Por qué el valor AÚN NO ha sido co-creado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Co-creation completes at delivery, and the final output has not been delivered yet. |
| **a** ES | La co-creación se completa en la entrega, y el resultado final aún no ha sido entregado. |
| **b** EN | The model's accuracy metrics are too low, making consumer context irrelevant. |
| **b** ES | Las métricas de precisión del modelo son demasiado bajas, lo que hace que el contexto del consumidor sea irrelevante. |
| **c** EN | The consumer's judgment is still needed to validate and apply the output meaningfully. `<<KEY` |
| **c** ES | El juicio del consumidor todavía es necesario para validar y aplicar el resultado de manera significativa. `<<KEY` |
| **d** EN | Value is fully realized once the model generates fluent output, regardless of consumer use. |
| **d** ES | El valor se realiza completamente una vez que el modelo genera un resultado fluido, independientemente del uso que le dé el consumidor. |

**explanation**

| | |
|---|---|
| EN | Value co-creation requires the consumer's goals, context, and judgment to realize an outcome. Fluent output is only the provider's contribution; worth depends on how the consumer interprets and applies it. The claim that low accuracy metrics make consumer context irrelevant is incorrect—even high-accuracy outputs require consumer validation. The claim that co-creation completes at delivery treats value as a handover rather than a jointly realized outcome. The claim that fluent output alone constitutes realized value ignores that unused or misapplied output produces no benefit. |
| ES | La co-creación de valor requiere los objetivos, el contexto y el juicio del consumidor para alcanzar un resultado. El resultado fluido es solo la contribución del proveedor; el valor depende de cómo el consumidor lo interpreta y lo aplica. La afirmación de que las bajas métricas de precisión hacen que el contexto del consumidor sea irrelevante es incorrecta: incluso los resultados de alta precisión requieren validación por parte del consumidor. La afirmación de que la co-creación se completa en la entrega trata el valor como una transferencia en lugar de un resultado alcanzado conjuntamente. La afirmación de que un resultado fluido por sí solo constituye valor realizado ignora que un resultado no utilizado o mal aplicado no produce ningún beneficio. |

### 108. AISM-I · 1.4 · `01031758-86b4-43f1-8953-64d60183c31c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.4: Distinguish the parties and roles in a service relationship - provider, consumer, and the sponsor / customer / user roles.

**stem**

| | |
|---|---|
| EN | A provider's service desk resolves incidents for end users but never engages the business unit manager who originally specified service requirements. Which role is the provider neglecting? |
| ES | El servicio de asistencia de un proveedor resuelve incidentes para los usuarios finales, pero nunca interactúa con el gerente de la unidad de negocio que originalmente especificó los requisitos del servicio. ¿Qué rol está descuidando el proveedor? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The sponsor role, because budget authorization is not being reviewed with the appropriate consumer-side authority. |
| **a** ES | El rol de patrocinador, porque la autorización del presupuesto no se está revisando con la autoridad correspondiente del lado consumidor. |
| **b** EN | The user role, because incident resolution alone does not constitute adequate engagement with direct service consumers. |
| **b** ES | El rol de usuario, porque la resolución de incidentes por sí sola no constituye una interacción adecuada con los consumidores directos del servicio. |
| **c** EN | No role is neglected, because providers are only required to engage whoever raises incidents. |
| **c** ES | No se descuida ningún rol, porque los proveedores solo están obligados a interactuar con quienes reportan incidentes. |
| **d** EN | The customer role, because the business unit manager who defined requirements is not being engaged by the provider. `<<KEY` |
| **d** ES | El rol de cliente, porque el gerente de la unidad de negocio que definió los requisitos no está siendo atendido por el proveedor. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The customer role belongs to the party that defines requirements and owns desired outcomes—here, the business unit manager. Effective service relationship management requires engaging all consumer-side roles, not only users. Limiting provider engagement to incident resolution ignores the customer's ongoing stake in service performance and overlooks the difference between the customer and sponsor roles. |
| ES | El rol de cliente corresponde a la parte que define los requisitos y es dueña de los resultados deseados; en este caso, el gerente de la unidad de negocio. Una gestión eficaz de la relación de servicio requiere interactuar con todos los roles del lado consumidor, no solo con los usuarios. Limitar la interacción del proveedor a la resolución de incidentes ignora el interés continuo del cliente en el desempeño del servicio y pasa por alto la diferencia entre los roles de cliente y patrocinador. |

### 109. AISM-I · 1.4 · `08a3f8f6-f97c-4635-924d-3d6427f35a57`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.4: Distinguish the parties and roles in a service relationship - provider, consumer, and the sponsor / customer / user roles.

**stem**

| | |
|---|---|
| EN | Two logistics firms co-develop a shared tracking platform, jointly invest in its infrastructure, and share accountability for performance outcomes. Which service relationship type does this best represent? |
| ES | Dos empresas de logística codesarrollan una plataforma de seguimiento compartida, invierten conjuntamente en su infraestructura y comparten la responsabilidad por los resultados de desempeño. ¿Qué tipo de relación de servicio representa mejor esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Basic provision, because one firm still supplies the platform while the other consumes it regardless of investment structure. |
| **a** ES | Provisión básica, porque una empresa sigue suministrando la plataforma mientras la otra la consume, independientemente de la estructura de inversión. |
| **b** EN | Partnership, because the contract duration and spend level exceed those of a standard service agreement. |
| **b** ES | Asociación, porque la duración del contrato y el nivel de gasto superan los de un acuerdo de servicio estándar. |
| **c** EN | Partnership, because the arrangement involves shared risk, joint investment, and co-creation of outcomes. `<<KEY` |
| **c** ES | Asociación, porque el acuerdo implica riesgo compartido, inversión conjunta y cocreación de resultados. `<<KEY` |
| **d** EN | Cooperation, because both parties contribute resources toward a common deliverable under separate accountability. |
| **d** ES | Cooperación, porque ambas partes aportan recursos hacia un entregable común bajo responsabilidades separadas. |

**explanation**

| | |
|---|---|
| EN | Partnership as a relationship type is characterized by shared risk, joint investment, and co-creation—not merely by contract length or spend level. Cooperation involves working together but maintains separate accountability rather than a mutual stake in outcomes. Basic provision implies a straightforward supplier–consumer split that does not apply when both parties co-own the platform and its results. |
| ES | La asociación como tipo de relación se caracteriza por el riesgo compartido, la inversión conjunta y la cocreación, no simplemente por la duración del contrato o el nivel de gasto. La cooperación implica trabajar juntos, pero mantiene responsabilidades separadas en lugar de una participación mutua en los resultados. La provisión básica supone una división simple proveedor-consumidor que no aplica cuando ambas partes son copropietarias de la plataforma y sus resultados. |

### 110. AISM-I · 1.5 · `04d639b1-7a98-4866-82d4-3cb28784244d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.5: Explain utility, warranty, and experience as the dimensions of a service's fitness - and how warranty changes for non-deterministic AI output, assuring a range of quality rather than an identical outp

**stem**

| | |
|---|---|
| EN | A legal AI service correctly identifies relevant case law but is inaccessible for two hours daily due to maintenance. How should this shortfall be classified? |
| ES | Un servicio de IA legal identifica correctamente la jurisprudencia relevante, pero es inaccesible durante dos horas diarias por mantenimiento. ¿Cómo debe clasificarse esta deficiencia? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A user-experience gap only, because scheduled maintenance is a perception issue rather than a structural deficiency. |
| **a** ES | Solo una brecha en la experiencia del usuario, porque el mantenimiento programado es un problema de percepción más que una deficiencia estructural. |
| **b** EN | A utility gap, because the service fails its purpose during each unavailable window. |
| **b** ES | Una brecha de utilidad, porque el servicio no cumple su propósito durante cada ventana de no disponibilidad. |
| **c** EN | A security gap under warranty, because recurring downtime indicates inadequate cybersecurity controls. |
| **c** ES | Una brecha de seguridad dentro de la garantía, porque el tiempo de inactividad recurrente indica controles de ciberseguridad inadecuados. |
| **d** EN | A warranty gap in availability, because the service cannot be used when needed despite functioning correctly. `<<KEY` |
| **d** ES | Una brecha de garantía en disponibilidad, porque el servicio no puede usarse cuando se necesita a pesar de funcionar correctamente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Warranty covers fitness for use, including availability. The service's functional capability (utility) is intact—it correctly identifies case law—but users cannot access it when needed, which is an availability failure within warranty. Downtime is not a utility shortfall, a security issue, or purely an experiential perception. |
| ES | La garantía cubre la aptitud para el uso, incluida la disponibilidad. La capacidad funcional del servicio (utilidad) está intacta: identifica correctamente la jurisprudencia, pero los usuarios no pueden acceder a él cuando lo necesitan, lo que constituye un fallo de disponibilidad dentro de la garantía. El tiempo de inactividad no es una deficiencia de utilidad, un problema de seguridad ni puramente una percepción experiencial. |

### 111. AISM-I · 1.6 · `c6fd61bb-ac16-4faa-a047-925881a7ac6c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Explain outputs vs outcomes, and cost and risk as what a service removes and imposes - including why AI's ability to mass-produce outputs sharpens the risk of mistaking outputs for outcomes.

**stem**

| | |
|---|---|
| EN | Which scenario correctly illustrates the 'AI output volume trap'? |
| ES | ¿Qué escenario ilustra correctamente la 'trampa del volumen de outputs de IA'? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | An AI replaces human drafting, and the team measures value as labor cost saved rather than output volume. |
| **a** ES | Una IA reemplaza la redacción humana y el equipo mide el valor como el costo laboral ahorrado, en lugar del volumen de outputs. |
| **b** EN | An AI generates thousands of responses daily, and the team treats message count as proof that customer needs are met. `<<KEY` |
| **b** ES | Una IA genera miles de respuestas diariamente y el equipo trata el conteo de mensajes como prueba de que las necesidades del cliente están satisfechas. `<<KEY` |
| **c** EN | An AI flags low-quality outputs for human review, and the team uses rework rates to track consumer goal achievement. |
| **c** ES | Una IA señala outputs de baja calidad para revisión humana y el equipo usa las tasas de retrabajo para rastrear el logro de los objetivos del consumidor. |
| **d** EN | An AI accelerates report generation, and the team validates each report against the consumer's stated business objective. |
| **d** ES | Una IA acelera la generación de informes y el equipo valida cada informe frente al objetivo de negocio declarado por el consumidor. |

**explanation**

| | |
|---|---|
| EN | The output volume trap occurs when high-volume AI production makes activity look like achievement—treating message count as evidence that consumer needs are met. The other scenarios show teams measuring rework rates, labor savings, or alignment with business objectives, none of which conflate raw output count with outcomes. |
| ES | La trampa del volumen de outputs ocurre cuando la alta producción de la IA hace que la actividad parezca un logro, tratando el conteo de mensajes como evidencia de que las necesidades del consumidor están satisfechas. Los otros escenarios muestran equipos que miden tasas de retrabajo, ahorros laborales o alineación con objetivos de negocio, ninguno de los cuales confunde el conteo bruto de outputs con outcomes. |

### 112. AISM-I · 1.7 · `26cde04c-44ca-45ef-8fd7-d5a85a83fde3`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.7: Explain service quality, service levels, and SLAs as the agreement of expectation - and how a service level is written for an AI service, committing to quality bounds and escalation rather than identi

**stem**

| | |
|---|---|
| EN | Which description most accurately characterises the primary purpose of an SLA? |
| ES | ¿Qué descripción caracteriza con mayor precisión el propósito principal de un SLA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A technical specification listing every measurable provider output, excluding qualitative experience factors. |
| **a** ES | Una especificación técnica que enumera todos los resultados medibles del proveedor, excluyendo los factores cualitativos de experiencia. |
| **b** EN | A documented agreement that aligns provider and consumer expectations to enable shared accountability and improvement. `<<KEY` |
| **b** ES | Un acuerdo documentado que alinea las expectativas del proveedor y del consumidor para permitir la responsabilidad compartida y la mejora continua. `<<KEY` |
| **c** EN | A one-time baseline document set at contract signing, superseded by operational reports once delivery begins. |
| **c** ES | Un documento de referencia único establecido al momento de la firma del contrato, reemplazado por informes operativos una vez que comienza la entrega. |
| **d** EN | A legal contract whose main function is to specify financial penalties for missed performance thresholds. |
| **d** ES | Un contrato legal cuya función principal es especificar penalizaciones financieras por incumplimiento de umbrales de rendimiento. |

**explanation**

| | |
|---|---|
| EN | An SLA is fundamentally a shared agreement designed to align understanding and support continuous improvement—not primarily a penalty mechanism. Framing it as a legal enforcement tool or a static technical specification misses its role as a living, shared commitment. Treating it as a one-time baseline similarly ignores its ongoing, evolving nature. |
| ES | Un SLA es fundamentalmente un acuerdo compartido diseñado para alinear el entendimiento y apoyar la mejora continua, no principalmente un mecanismo de penalización. Enmarcarlo como una herramienta de aplicación legal o una especificación técnica estática omite su rol como un compromiso compartido y dinámico. Tratarlo como un documento de referencia único ignora igualmente su naturaleza continua y evolutiva. |

### 113. AISM-I · 1.8 · `df6bafc6-7381-4002-94a0-a58806eb4951`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.8: Explain the provider's continuing accountability for an AI service's behavior - that an AI output is a service action the provider owns, and that AI services drift and must be monitored, not assumed s

**stem**

| | |
|---|---|
| EN | A customer-facing AI service has had no code changes or model updates for six months. A service manager argues that no special monitoring is needed because nothing has changed technically. Why is this reasoning flawed? |
| ES | Un servicio de IA orientado al cliente no ha tenido cambios de código ni actualizaciones de modelo durante seis meses. Un gerente de servicio argumenta que no se necesita monitoreo especial porque nada ha cambiado técnicamente. ¿Por qué este razonamiento es incorrecto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Output quality accountability transfers to the model vendor once the model passes initial validation and is deployed. |
| **a** ES | La responsabilidad sobre la calidad de los resultados se transfiere al proveedor del modelo una vez que el modelo supera la validación inicial y es desplegado. |
| **b** EN | SLA uptime and response-time metrics are insufficient, so a formal SLA review is required every six months regardless. |
| **b** ES | Las métricas de tiempo de actividad y tiempo de respuesta del SLA son insuficientes, por lo que se requiere una revisión formal del SLA cada seis meses independientemente. |
| **c** EN | Monitoring is only warranted after a known trigger such as a data pipeline change, software update, or user complaint. |
| **c** ES | El monitoreo solo está justificado después de un desencadenante conocido, como un cambio en el pipeline de datos, una actualización de software o una queja de un usuario. |
| **d** EN | Real-world data distributions shift over time, degrading AI output quality even when code and model weights are unchanged. `<<KEY` |
| **d** ES | Las distribuciones de datos del mundo real cambian con el tiempo, degradando la calidad de los resultados de la IA incluso cuando el código y los pesos del modelo no han cambiado. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | An AI service can degrade because the real-world data it encounters changes over time, shifting output quality even without any code or model modification. Technical stability does not imply behavioral stability. The idea that monitoring requires a known trigger ignores this continuous passive drift. Accountability for output quality remains with the service provider regardless of who built the model, so vendor handoff does not remove the monitoring obligation. |
| ES | Un servicio de IA puede degradarse porque los datos del mundo real que encuentra cambian con el tiempo, afectando la calidad de los resultados incluso sin ninguna modificación de código o modelo. La estabilidad técnica no implica estabilidad en el comportamiento. La idea de que el monitoreo requiere un desencadenante conocido ignora esta deriva pasiva continua. La responsabilidad sobre la calidad de los resultados permanece con el proveedor del servicio independientemente de quién haya construido el modelo, por lo que la transferencia al proveedor no elimina la obligación de monitoreo. |

### 114. AISM-I · 2.1 · `c330fb40-aca2-428f-88b2-54aaec17c583`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.1: Explain the components of a service value system and how they fit together.

**stem**

| | |
|---|---|
| EN | An organization's leadership asks why continual improvement appears throughout their service management framework rather than only at the end of each project cycle. Which explanation correctly describes continual improvement's role in the SVS? |
| ES | El liderazgo de una organización pregunta por qué la mejora continua aparece a lo largo de su marco de gestión de servicios en lugar de solo al final de cada ciclo de proyecto. ¿Cuál explicación describe correctamente el rol de la mejora continua en el SVS? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It is a sequential phase that begins once all value chain activities are completed. |
| **a** ES | Es una fase secuencial que comienza una vez que se completan todas las actividades de la cadena de valor. |
| **b** EN | It is a distinct SVS component woven across all other elements, not confined to one phase. `<<KEY` |
| **b** ES | Es un componente distintivo del SVS que se integra en todos los demás elementos, sin estar confinado a una sola fase. `<<KEY` |
| **c** EN | It is one of the six value chain activities, so it operates only within that chain. |
| **c** ES | Es una de las seis actividades de la cadena de valor, por lo que opera únicamente dentro de esa cadena. |
| **d** EN | It belongs to the governance component, which directs all improvement decisions. |
| **d** ES | Pertenece al componente de gobernanza, que dirige todas las decisiones de mejora. |

**explanation**

| | |
|---|---|
| EN | Continual improvement is a distinct, pervasive SVS component that applies across guiding principles, governance, the value chain, and practices simultaneously. Describing it as one of the six value chain activities confines it incorrectly inside the chain. Treating it as a sequential closing phase misrepresents it as a bounded step. Assigning it solely to governance conflates two separate SVS components. |
| ES | La mejora continua es un componente del SVS distintivo y omnipresente que se aplica simultáneamente a través de los principios guía, la gobernanza, la cadena de valor y las prácticas. Describirla como una de las seis actividades de la cadena de valor la confina incorrectamente dentro de dicha cadena. Tratarla como una fase de cierre secuencial la representa erróneamente como un paso delimitado. Asignarla exclusivamente a la gobernanza confunde dos componentes separados del SVS. |

### 115. AISM-I · 2.2 · `ab265e1a-2e75-450c-a60e-22220454d54b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.2: Explain the purpose of the guiding principles as universal, framework-agnostic recommendations.

**stem**

| | |
|---|---|
| EN | A practitioner argues that because all guiding principles are universal, none should receive more emphasis than another in any context. Which statement best explains why this reasoning is flawed? |
| ES | Un profesional argumenta que, dado que todos los principios guía son universales, ninguno debería recibir más énfasis que otro en ningún contexto. ¿Qué afirmación explica mejor por qué este razonamiento es incorrecto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Universal applicability means practitioners should select only the single most relevant principle per decision to avoid conflict. |
| **a** ES | La aplicabilidad universal significa que los profesionales deben seleccionar únicamente el principio más relevante por decisión para evitar conflictos. |
| **b** EN | Universal applicability means every principle must be explicitly referenced in project documentation, so all receive equal attention. |
| **b** ES | La aplicabilidad universal significa que cada principio debe ser referenciado explícitamente en la documentación del proyecto, para que todos reciban igual atención. |
| **c** EN | Universal applicability means principles have equal weight by design, so de-emphasizing any one constitutes a governance violation. |
| **c** ES | La aplicabilidad universal significa que los principios tienen igual peso por diseño, por lo que dar menos énfasis a cualquiera de ellos constituye una violación de gobernanza. |
| **d** EN | Universal applicability means principles apply in all circumstances, but context determines which ones warrant greater emphasis. `<<KEY` |
| **d** ES | La aplicabilidad universal significa que los principios aplican en todas las circunstancias, pero el contexto determina cuáles merecen mayor énfasis. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Universal applicability means the principles are relevant in all circumstances, not that they must always receive identical emphasis. Context legitimately influences which principles are most prominent in a given situation. Equating universality with rigid equal weighting, requiring explicit documentation of each, or treating uneven emphasis as a governance violation all misread what 'universal' means. |
| ES | La aplicabilidad universal significa que los principios son relevantes en todas las circunstancias, no que siempre deban recibir un énfasis idéntico. El contexto influye legítimamente en cuáles principios son más prominentes en una situación determinada. Equiparar universalidad con una ponderación igual rígida, exigir documentación explícita de cada uno, o tratar el énfasis desigual como una violación de gobernanza son interpretaciones erróneas del significado de 'universal'. |

### 116. AISM-I · 2.3 · `33470439-ac03-462c-9df8-754958ad69eb`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: Explain each of the seven guiding principles and what it recommends.

**stem**

| | |
|---|---|
| EN | A team finds an existing incident-routing workflow mostly sound but containing two redundant approval steps. Which guiding principle best explains why removing only those steps—rather than rebuilding from scratch—is the right approach? |
| ES | Un equipo encuentra un flujo de trabajo de enrutamiento de incidentes existente que es en su mayoría sólido, pero que contiene dos pasos de aprobación redundantes. ¿Qué principio rector explica mejor por qué eliminar solo esos pasos —en lugar de reconstruir desde cero— es el enfoque correcto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Progress Iteratively with Feedback, because incremental delivery cycles naturally eliminate redundant steps over time. |
| **a** ES | Progresar Iterativamente con Retroalimentación, porque los ciclos de entrega incremental eliminan naturalmente los pasos redundantes con el tiempo. |
| **b** EN | Start Where You Are, because existing capability should be assessed and preserved where it adds value. `<<KEY` |
| **b** ES | Empezar Donde Estás, porque la capacidad existente debe evaluarse y preservarse donde agrega valor. `<<KEY` |
| **c** EN | Keep It Simple and Practical, because reducing step count is the primary goal of any process review. |
| **c** ES | Mantenerlo Simple y Práctico, porque reducir la cantidad de pasos es el objetivo principal de cualquier revisión de procesos. |
| **d** EN | Optimize and Automate, because identified inefficiencies should prompt automation of the affected workflow. |
| **d** ES | Optimizar y Automatizar, porque las ineficiencias identificadas deben impulsar la automatización del flujo de trabajo afectado. |

**explanation**

| | |
|---|---|
| EN | Start Where You Are directs practitioners to measure and leverage what already exists rather than discarding current assets by default. Removing only the redundant steps preserves proven value while eliminating waste—exactly what this principle recommends. Keeping It Simple and Practical concerns avoiding unnecessary complexity but does not capture the 'assess before discarding' logic central to the scenario. Optimize and Automate addresses efficiency and automation but prescribes optimizing before automating, not replacing a sound workflow. Progress Iteratively with Feedback governs how changes are delivered over time, not whether existing assets should be retained. |
| ES | Empezar Donde Estás dirige a los profesionales a medir y aprovechar lo que ya existe en lugar de descartar los activos actuales de forma predeterminada. Eliminar solo los pasos redundantes preserva el valor demostrado mientras se elimina el desperdicio —exactamente lo que recomienda este principio. Mantenerlo Simple y Práctico se refiere a evitar la complejidad innecesaria, pero no captura la lógica de 'evaluar antes de descartar' que es central en el escenario. Optimizar y Automatizar aborda la eficiencia y la automatización, pero prescribe optimizar antes de automatizar, no reemplazar un flujo de trabajo sólido. Progresar Iterativamente con Retroalimentación rige cómo se entregan los cambios a lo largo del tiempo, no si los activos existentes deben conservarse. |

### 117. AISM-I · 2.3 · `93d8815d-09f9-4d20-a836-3fb39e901b47`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: Explain each of the seven guiding principles and what it recommends.

**stem**

| | |
|---|---|
| EN | Before launching a new service desk, a manager proposes a full greenfield design, arguing that existing tools and processes are too outdated to reuse. Which guiding principle does this most clearly conflict with? |
| ES | Antes de lanzar un nuevo centro de servicio, un gerente propone un diseño completamente nuevo desde cero, argumentando que las herramientas y procesos existentes están demasiado desactualizados para reutilizarse. ¿Con qué principio guía entra esto en mayor conflicto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Start Where You Are, because current capabilities must be assessed before deciding what to change or replace. `<<KEY` |
| **a** ES | Comenzar Donde Se Está, porque las capacidades actuales deben evaluarse antes de decidir qué cambiar o reemplazar. `<<KEY` |
| **b** EN | Focus on Value, because discarding existing assets reduces measurable outcomes delivered to customers. |
| **b** ES | Enfocarse en el Valor, porque descartar los activos existentes reduce los resultados medibles entregados a los clientes. |
| **c** EN | Collaborate and Promote Visibility, because the decision was made without involving affected teams. |
| **c** ES | Colaborar y Promover la Visibilidad, porque la decisión se tomó sin involucrar a los equipos afectados. |
| **d** EN | Progress Iteratively with Feedback, because a full redesign cannot be broken into equal-sized iterations. |
| **d** ES | Progresar Iterativamente con Retroalimentación, porque un rediseño completo no puede dividirse en iteraciones de igual tamaño. |

**explanation**

| | |
|---|---|
| EN | Start Where You Are requires measuring and understanding what already exists before acting. Assuming assets are outdated without assessment is precisely the misconception this principle guards against. The other principles are not violated by the described decision: no customer outcome is yet affected, no collaboration failure is described, and iteration is not precluded by a redesign. |
| ES | Comenzar Donde Se Está requiere medir y comprender lo que ya existe antes de actuar. Asumir que los activos están desactualizados sin una evaluación es precisamente el error conceptual contra el que este principio protege. Los demás principios no son violados por la decisión descrita: ningún resultado para el cliente se ve afectado aún, no se describe ningún fallo de colaboración y la iteración no queda excluida por un rediseño. |

### 118. AISM-I · 2.4 · `529e1d38-0466-4af6-abe2-342914bfbfd5`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Given a described situation - including a decision about whether and where to adopt AI - apply the appropriate guiding principle to choose a sound course of action.

**stem**

| | |
|---|---|
| EN | Midway through an AI implementation, the team discovers that user needs have shifted significantly. Which action correctly applies principle-based reasoning at this stage? |
| ES | A mitad de una implementación de IA, el equipo descubre que las necesidades de los usuarios han cambiado significativamente. ¿Qué acción aplica correctamente el razonamiento basado en principios en esta etapa? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continue under the original principle, since principle selection governs all subsequent work once made. |
| **a** ES | Continuar bajo el principio original, ya que la selección del principio rige todo el trabajo posterior una vez realizada. |
| **b** EN | Continue unchanged, because the original decision was supported by at least one principle when made. |
| **b** ES | Continuar sin cambios, porque la decisión original fue respaldada por al menos un principio cuando se tomó. |
| **c** EN | Treat the shift as purely technical, since AI adoption judgment is primarily about AI capability. |
| **c** ES | Tratar el cambio como puramente técnico, ya que el juicio sobre la adopción de IA se refiere principalmente a la capacidad de la IA. |
| **d** EN | Revisit which principles apply now and adjust the approach to stay aligned with genuine value. `<<KEY` |
| **d** ES | Revisar qué principios aplican ahora y ajustar el enfoque para mantenerse alineado con el valor genuino. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Principles are applied continuously, not selected once and locked in. When circumstances change, the practitioner must re-read the situation and re-apply relevant principles to keep decisions sound. Resting on a prior justification or treating the problem as purely technical ignores the ongoing role of principled reasoning. |
| ES | Los principios se aplican de manera continua, no se seleccionan una vez y se bloquean. Cuando las circunstancias cambian, el profesional debe releer la situación y reaplicar los principios relevantes para mantener las decisiones sólidas. Apoyarse en una justificación previa o tratar el problema como puramente técnico ignora el papel continuo del razonamiento basado en principios. |

### 119. AISM-I · 2.4 · `5fe28afb-9711-4f44-9d59-d14520baf091`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Given a described situation - including a decision about whether and where to adopt AI - apply the appropriate guiding principle to choose a sound course of action.

**stem**

| | |
|---|---|
| EN | An AI vendor demonstrates a highly accurate predictive model for inventory management. The organization's current inventory process already meets its service targets consistently. What should the decision-maker do? |
| ES | Un proveedor de IA demuestra un modelo predictivo de alta precisión para la gestión de inventarios. El proceso de inventario actual de la organización ya cumple consistentemente con sus objetivos de servicio. ¿Qué debería hacer el tomador de decisiones? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Decline adoption, because the existing process meets targets and AI adds complexity without a clear value gap. `<<KEY` |
| **a** ES | Rechazar la adopción, porque el proceso existente cumple los objetivos y la IA agrega complejidad sin una brecha de valor clara. `<<KEY` |
| **b** EN | Adopt the model, because high accuracy confirms alignment with 'focus on value.' |
| **b** ES | Adoptar el modelo, porque la alta precisión confirma la alineación con 'enfocarse en el valor'. |
| **c** EN | Adopt the model to maximize available capabilities and ensure future value. |
| **c** ES | Adoptar el modelo para maximizar las capacidades disponibles y asegurar valor futuro. |
| **d** EN | Commission an infrastructure audit first, since 'start where you are' requires readiness before any AI decision. |
| **d** ES | Encargar primero una auditoría de infraestructura, ya que 'comenzar donde estás' requiere disponibilidad antes de cualquier decisión sobre IA. |

**explanation**

| | |
|---|---|
| EN | When the current state already meets its target, adopting AI introduces complexity without a demonstrable value gain—contrary to both 'focus on value' and 'keep it simple.' Technical accuracy and feasibility do not constitute value justification on their own. Accumulating capabilities is not the same as creating value. |
| ES | Cuando el estado actual ya cumple su objetivo, adoptar IA introduce complejidad sin una ganancia de valor demostrable, lo que va en contra tanto de 'enfocarse en el valor' como de 'mantenlo simple'. La precisión técnica y la viabilidad no constituyen por sí solas una justificación de valor. Acumular capacidades no es lo mismo que crear valor. |

### 120. AISM-I · 2.5 · `1081431b-ab26-4656-9e4e-140e2f0d8ea8`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.5: Apply "optimize and automate" to decide which service activities suit AI-driven automation and which must retain meaningful human judgment - recognizing that AI widens both what can be automated and w

**stem**

| | |
|---|---|
| EN | A password-reset workflow runs 500 times per day but uses inconsistent identity-verification steps. What is the correct automation decision? |
| ES | Un flujo de trabajo de restablecimiento de contraseñas se ejecuta 500 veces por día, pero utiliza pasos de verificación de identidad inconsistentes. ¿Cuál es la decisión correcta de automatización? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Automate it; security risk for password resets is low, so inconsistency is an acceptable trade-off for efficiency. |
| **a** ES | Automatizarlo; el riesgo de seguridad para los restablecimientos de contraseñas es bajo, por lo que la inconsistencia es una compensación aceptable por la eficiencia. |
| **b** EN | Automate it; high frequency confirms strong candidacy and automation will enforce a single verification path. |
| **b** ES | Automatizarlo; la alta frecuencia confirma una candidatura sólida y la automatización impondrá una única ruta de verificación. |
| **c** EN | Do not automate yet; standardize the verification step first, because automating it now scales the security risk. `<<KEY` |
| **c** ES | No automatizar aún; estandarizar primero el paso de verificación, porque automatizarlo ahora escala el riesgo de seguridad. `<<KEY` |
| **d** EN | Automate with monitoring to flag anomalous patterns; reactive detection is sufficient given the low cost per transaction. |
| **d** ES | Automatizar con monitoreo para señalar patrones anómalos; la detección reactiva es suficiente dado el bajo costo por transacción. |

**explanation**

| | |
|---|---|
| EN | Frequency alone does not make a process a good automation candidate; the process must also be well-defined and consistently executed. Automating inconsistent identity verification would scale the security defect across all 500 daily resets. Monitoring after the fact does not prevent the harm—it only records it. |
| ES | La frecuencia por sí sola no convierte a un proceso en un buen candidato para la automatización; el proceso también debe estar bien definido y ejecutarse de manera consistente. Automatizar la verificación de identidad inconsistente escalaría el defecto de seguridad en los 500 restablecimientos diarios. El monitoreo posterior al hecho no previene el daño, solo lo registra. |

### 121. AISM-I · 2.6 · `6962bd72-5dd9-4f43-bc58-7cb996288e7b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.6: Explain governance as the direction and control that enables service management.

**stem**

| | |
|---|---|
| EN | A service organization establishes objectives, tracks performance metrics, and periodically assesses whether outcomes remain aligned with strategy. Which statement best describes what these three activities together represent? |
| ES | Una organización de servicios establece objetivos, realiza seguimiento de métricas de desempeño y evalúa periódicamente si los resultados siguen alineados con la estrategia. ¿Cuál enunciado describe mejor lo que estas tres actividades representan en conjunto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A management practice that replaces governance once an organization reaches operational maturity. |
| **a** ES | Una práctica de gestión que reemplaza a la gobernanza una vez que la organización alcanza la madurez operativa. |
| **b** EN | A continuous governance cycle of directing, monitoring, and evaluating that enables controlled value delivery. `<<KEY` |
| **b** ES | Un ciclo continuo de gobernanza de dirección, monitoreo y evaluación que permite la entrega controlada de valor. `<<KEY` |
| **c** EN | A compliance mechanism whose sole purpose is to restrict staff actions and prevent unauthorized decisions. |
| **c** ES | Un mecanismo de cumplimiento cuyo único propósito es restringir las acciones del personal y evitar decisiones no autorizadas. |
| **d** EN | A one-time sequential process that ends once evaluation confirms results match the original objectives. |
| **d** ES | Un proceso secuencial de una sola vez que termina una vez que la evaluación confirma que los resultados coinciden con los objetivos originales. |

**explanation**

| | |
|---|---|
| EN | Governance directs, monitoring, and evaluates in a continuous feedback loop, enabling the organization to stay aligned with objectives while adapting to change. Describing it as a one-time sequential process misrepresents governance as having a definitive end point. Treating it as purely a compliance restriction confuses its enabling purpose with a control-only view. Claiming it is replaced by management at maturity misunderstands that governance and management are distinct, complementary functions that coexist at all stages. |
| ES | La gobernanza dirige, monitorea y evalúa en un ciclo continuo de retroalimentación, lo que permite a la organización mantenerse alineada con los objetivos mientras se adapta al cambio. Describirla como un proceso secuencial de una sola vez tergiversa la gobernanza al atribuirle un punto final definitivo. Tratarla como una restricción de cumplimiento puramente confunde su propósito habilitador con una visión de solo control. Afirmar que es reemplazada por la gestión al alcanzar la madurez malinterpreta que la gobernanza y la gestión son funciones distintas y complementarias que coexisten en todas las etapas. |

### 122. AISM-I · 2.7 · `090630b5-88a4-4489-bcb9-01cd9dda906f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.7: Distinguish governance from management and from day-to-day operations.

**stem**

| | |
|---|---|
| EN | An AI program manager proposes expanding her team's delegated authority to respond faster to market changes, without governing body approval. Which principle does this misunderstand? |
| ES | Una gerente de programa de inteligencia artificial propone ampliar la autoridad delegada de su equipo para responder más rápido a los cambios del mercado, sin aprobación del órgano de gobierno. ¿Qué principio malinterpreta esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Strategic direction — market-driven adjustments are governance decisions, so management may not initiate any response. |
| **a** ES | Dirección estratégica: los ajustes impulsados por el mercado son decisiones de gobernanza, por lo que la dirección no puede iniciar ninguna respuesta. |
| **b** EN | Compliance oversight — regulations, not the governing body, define the limits of management authority. |
| **b** ES | Supervisión de cumplimiento: las regulaciones, no el órgano de gobierno, definen los límites de la autoridad de la dirección. |
| **c** EN | Delegated authority — its boundaries are set by the governing body and cannot be unilaterally redefined by management. `<<KEY` |
| **c** ES | Autoridad delegada: sus límites son establecidos por el órgano de gobierno y no pueden ser redefinidos unilateralmente por la dirección. `<<KEY` |
| **d** EN | Operational accountability — management owns its outcomes and therefore owns the scope of its authority. |
| **d** ES | Rendición de cuentas operativa: la dirección es dueña de sus resultados y, por lo tanto, es dueña del alcance de su autoridad. |

**explanation**

| | |
|---|---|
| EN | Delegated authority is granted by the governing body; management operates within those boundaries and cannot unilaterally expand them. Returning to the governing body to revise delegation scope is not optional—it is how governance maintains accountability. Saying regulations define authority limits misidentifies the source. Saying management owns its authority because it owns outcomes conflates execution responsibility with governance accountability. Saying management may not initiate any market response is an overstatement that misrepresents the governance-management boundary. |
| ES | La autoridad delegada es otorgada por el órgano de gobierno; la dirección opera dentro de esos límites y no puede ampliarlos unilateralmente. Volver al órgano de gobierno para revisar el alcance de la delegación no es opcional, es la forma en que la gobernanza mantiene la rendición de cuentas. Afirmar que las regulaciones definen los límites de la autoridad identifica erróneamente la fuente. Decir que la dirección es dueña de su autoridad porque es dueña de los resultados confunde la responsabilidad de ejecución con la rendición de cuentas de gobernanza. Afirmar que la dirección no puede iniciar ninguna respuesta al mercado es una exageración que tergiversa el límite entre gobernanza y gestión. |

### 123. AISM-I · 2.8 · `5071ba44-9902-4e4d-a6cf-f4fcaaf64f89`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.8: Explain the continual improvement model and its steps - and why AI services in particular require continual improvement, because they drift and cannot be improved once and left.

**stem**

| | |
|---|---|
| EN | An AI service passed acceptance testing six months ago and has had zero reported incidents. A colleague argues it needs no further improvement reviews because it is stable. Why is this reasoning flawed? |
| ES | Un servicio de IA pasó las pruebas de aceptación hace seis meses y no ha tenido ningún incidente reportado. Un colega argumenta que no necesita más revisiones de mejora porque es estable. ¿Por qué este razonamiento es incorrecto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Improvement reviews are triggered solely by changes in business goals; because the goals are unchanged, the service remains aligned without further review. |
| **a** ES | Las revisiones de mejora se activan únicamente por cambios en los objetivos del negocio; como los objetivos no han cambiado, el servicio sigue alineado sin necesidad de revisiones adicionales. |
| **b** EN | Zero incidents confirms the model is performing correctly; improvement effort should be redirected to services that have experienced reported failures. |
| **b** ES | Cero incidentes confirma que el modelo está funcionando correctamente; el esfuerzo de mejora debería redirigirse a servicios que hayan experimentado fallas reportadas. |
| **c** EN | Acceptance testing confirms only point-in-time fitness; shifting data patterns cause silent model drift that demands continual reassessment regardless of incident count. `<<KEY` |
| **c** ES | Las pruebas de aceptación confirman únicamente la idoneidad en un momento específico; los cambios en los patrones de datos provocan una deriva silenciosa del modelo que exige una reevaluación continua independientemente del número de incidentes. `<<KEY` |
| **d** EN | Model drift is identified and corrected once during deployment validation; scheduling ongoing monitoring after that point adds operational overhead without improving outcomes. |
| **d** ES | La deriva del modelo se identifica y corrige una sola vez durante la validación del despliegue; programar un monitoreo continuo después de ese punto agrega sobrecarga operativa sin mejorar los resultados. |

**explanation**

| | |
|---|---|
| EN | AI services are never 'done' because real-world data distributions shift over time, causing model performance to degrade silently even when no incidents are raised — this is model drift. Acceptance testing confirms fitness at a point in time, not ongoing fitness. The claim that zero incidents signals stability confuses break-fix maintenance with continual improvement. The claim that drift is corrected once at deployment is incorrect because drift is continuous and data-driven, not a one-time training artifact. |
| ES | Los servicios de IA nunca están 'terminados' porque las distribuciones de datos del mundo real cambian con el tiempo, lo que provoca que el rendimiento del modelo se degrade de forma silenciosa incluso cuando no se reportan incidentes; esto se conoce como deriva del modelo. Las pruebas de aceptación confirman la idoneidad en un momento específico, no la idoneidad continua. La afirmación de que cero incidentes indica estabilidad confunde el mantenimiento correctivo con la mejora continua. La afirmación de que la deriva se corrige una sola vez durante el despliegue es incorrecta porque la deriva es continua y está impulsada por los datos, no es un artefacto puntual del entrenamiento. |

### 124. AISM-I · 2.9 · `93928493-0ee1-4aeb-8604-40c1912265e2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.9: Given a described improvement effort, determine which continual-improvement step it skipped.

**stem**

| | |
|---|---|
| EN | Stakeholders agreed the incident response process was 'clearly broken,' so the team skipped formal baseline measurement. A year later, they cannot provide regulators with evidence of improvement. What should they have done? |
| ES | Las partes interesadas acordaron que el proceso de respuesta a incidentes estaba 'claramente roto', por lo que el equipo omitió la medición formal de la línea base. Un año después, no pueden proporcionar a los reguladores evidencia de mejora. ¿Qué deberían haber hecho? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Measured and documented the current state before starting, regardless of how obvious the deficiency appeared. `<<KEY` |
| **a** ES | Medir y documentar el estado actual antes de comenzar, independientemente de cuán obvia pareciera la deficiencia. `<<KEY` |
| **b** EN | Substituted an auditor complaint for a quantitative baseline, since qualitative evidence satisfies most regulators. |
| **b** ES | Sustituir una queja de auditor por una línea base cuantitativa, ya que la evidencia cualitativa satisface a la mayoría de los reguladores. |
| **c** EN | Collected post-change data indefinitely to compensate for the absent pre-change measurement over time. |
| **c** ES | Recopilar datos posteriores al cambio de forma indefinida para compensar con el tiempo la medición previa al cambio ausente. |
| **d** EN | Used the project scope document as the baseline, since scope and vision capture equivalent starting-point information. |
| **d** ES | Utilizar el documento de alcance del proyecto como línea base, ya que el alcance y la visión capturan información equivalente del punto de partida. |

**explanation**

| | |
|---|---|
| EN | Stakeholder consensus that a situation is 'broken' is not a substitute for a documented, quantitative baseline. Without a pre-change measurement, the organization has no defensible evidence of the magnitude of improvement — a critical gap when regulators require proof. |
| ES | El consenso de las partes interesadas de que una situación está 'rota' no es un sustituto de una línea base documentada y cuantitativa. Sin una medición previa al cambio, la organización no tiene evidencia defendible de la magnitud de la mejora, una brecha crítica cuando los reguladores requieren pruebas. |

### 125. AISM-I · 3.1 · `c77a7258-2569-43f5-9942-dd7fc7b2f59e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.1: Explain the product-and-service lifecycle activities and that they are iterative, not sequential.

**stem**

| | |
|---|---|
| EN | An organisation procures a fully configured SaaS platform rather than coding it internally. Which statement about the 'build' activity is accurate? |
| ES | Una organización adquiere una plataforma SaaS completamente configurada en lugar de desarrollarla internamente. ¿Cuál afirmación sobre la actividad 'construir' es correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | 'Build' covers configuration and integration work, so it applies even when the service is procured. `<<KEY` |
| **a** ES | 'Construir' abarca el trabajo de configuración e integración, por lo que aplica incluso cuando el servicio es adquirido. `<<KEY` |
| **b** EN | 'Build' cannot begin until 'acquire' is fully closed out, so the two activities never overlap. |
| **b** ES | 'Construir' no puede comenzar hasta que 'adquirir' esté completamente cerrado, por lo que las dos actividades nunca se superponen. |
| **c** EN | 'Build' is skipped entirely because no custom software development is involved. |
| **c** ES | 'Construir' se omite por completo porque no se involucra desarrollo de software personalizado. |
| **d** EN | 'Build' and 'acquire' merge into one undifferentiated activity whenever a third-party product is used. |
| **d** ES | 'Construir' y 'adquirir' se fusionan en una sola actividad indiferenciada cuando se utiliza un producto de terceros. |

**explanation**

| | |
|---|---|
| EN | 'Build' is not limited to writing code; it covers any assembly, configuration, or integration needed to make a service ready. Treating it as software-development-only causes organisations to overlook critical readiness work when adopting procured or configured solutions. |
| ES | 'Construir' no se limita a escribir código; abarca cualquier ensamblaje, configuración o integración necesaria para que un servicio esté listo. Tratarlo como exclusivo del desarrollo de software lleva a las organizaciones a pasar por alto trabajo crítico de preparación al adoptar soluciones adquiridas o configuradas. |

### 126. AISM-I · 3.10 · `f4a8eba7-2440-4e50-a031-5a9ea5468f76`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.10: Given a described flow, determine an improvement using value-stream thinking (find the waste).

**stem**

| | |
|---|---|
| EN | A value stream map for software-feature delivery omits rework loops because the team considers them rare. What should the facilitator do? |
| ES | Un mapa de flujo de valor para la entrega de funcionalidades de software omite los bucles de retrabajo porque el equipo los considera raros. ¿Qué debería hacer el facilitador? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Add rework loops to the map, because they consume lead time and represent waste that improvements must target. `<<KEY` |
| **a** ES | Agregar los bucles de retrabajo al mapa, porque consumen tiempo de entrega y representan desperdicio que las mejoras deben abordar. `<<KEY` |
| **b** EN | Keep rework off the map and log it separately so the main flow diagram stays readable for stakeholders. |
| **b** ES | Mantener el retrabajo fuera del mapa y registrarlo por separado para que el diagrama del flujo principal sea legible para los interesados. |
| **c** EN | Move rework loops to the future-state map only, where they can be addressed in the improvement plan. |
| **c** ES | Mover los bucles de retrabajo únicamente al mapa del estado futuro, donde pueden abordarse en el plan de mejora. |
| **d** EN | Replace rework loops with an automated testing step, eliminating the need to map exception paths. |
| **d** ES | Reemplazar los bucles de retrabajo con un paso de pruebas automatizadas, eliminando la necesidad de mapear rutas de excepción. |

**explanation**

| | |
|---|---|
| EN | Rework loops add real lead time and cost; excluding them from the current-state map hides significant waste and produces an inaccurate baseline. The current-state map must reflect actual flow, including exceptions that occur with any regularity. Treating rework as a future-state concern means designing improvements without understanding the true current state, and logging rework separately keeps it invisible to the improvement team. |
| ES | Los bucles de retrabajo añaden tiempo de entrega y costos reales; excluirlos del mapa del estado actual oculta un desperdicio significativo y produce una línea base inexacta. El mapa del estado actual debe reflejar el flujo real, incluidas las excepciones que ocurren con alguna regularidad. Tratar el retrabajo como una preocupación del estado futuro significa diseñar mejoras sin comprender el verdadero estado actual, y registrar el retrabajo por separado lo hace invisible para el equipo de mejora. |

### 127. AISM-I · 3.12 · `251045a1-9023-4639-824e-9f4166c29598`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.12: Explain supplier and service-provider management, and the distinctive dependency risk of an AI service built on a model you do not own - lock-in, and a provider changing the model underneath you.

**stem**

| | |
|---|---|
| EN | After two years, a contracted foundation model provider announces updated terms for the next renewal. Why should the organization treat this as a supplier risk event rather than a routine update? |
| ES | Después de dos años, un proveedor contratado de modelos de fundación anuncia términos actualizados para la próxima renovación. ¿Por qué debería la organización tratar esto como un evento de riesgo del proveedor en lugar de una actualización rutinaria? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Because contractual changes automatically trigger a regulatory review obligation under standard AI service management frameworks. |
| **a** ES | Porque los cambios contractuales activan automáticamente una obligación de revisión regulatoria bajo los marcos estándar de gestión de servicios de IA. |
| **b** EN | Because terms from launch may no longer reflect current model versions, usage patterns, or deprecation protections the service now requires. `<<KEY` |
| **b** ES | Porque los términos del lanzamiento pueden ya no reflejar las versiones actuales del modelo, los patrones de uso o las protecciones de descontinuación que el servicio ahora requiere. `<<KEY` |
| **c** EN | Because any term change signals provider instability, since stable providers keep original terms throughout a service relationship. |
| **c** ES | Porque cualquier cambio en los términos señala inestabilidad del proveedor, ya que los proveedores estables mantienen los términos originales durante toda la relación de servicio. |
| **d** EN | Because original terms remain adequate only if the model has not been updated, and unchanged models are unlikely after two years. |
| **d** ES | Porque los términos originales siguen siendo adecuados solo si el modelo no ha sido actualizado, y los modelos sin cambios son improbables después de dos años. |

**explanation**

| | |
|---|---|
| EN | Foundation model capabilities, versioning, and the organization's service dependencies evolve substantially over two years. Terms adequate at launch may no longer provide the version stability, deprecation notice, or behavioral-change protections now needed. Treating renewal as routine risks locking in outdated protections. Provider incentives toward compatibility do not substitute for explicit contractual safeguards, and no universal regulatory review obligation applies automatically. |
| ES | Las capacidades del modelo de fundación, el versionado y las dependencias del servicio de la organización evolucionan sustancialmente en dos años. Los términos adecuados en el lanzamiento pueden ya no proporcionar la estabilidad de versión, el aviso de descontinuación o las protecciones contra cambios de comportamiento que ahora se necesitan. Tratar la renovación como rutinaria arriesga consolidar protecciones desactualizadas. Los incentivos del proveedor hacia la compatibilidad no sustituyen las salvaguardas contractuales explícitas, y ninguna obligación de revisión regulatoria universal se aplica automáticamente. |

### 128. AISM-I · 3.2 · `7fc0401f-a7b0-43b6-8c9c-ea628b74ffe4`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 3.2: Given a described situation, determine which lifecycle activity it belongs to.

**stem**

| | |
|---|---|
| EN | The team is conducting user acceptance testing (UAT) on a completed AI triage tool before approving it for production release. Which lifecycle activity does this work belong to? |
| ES | El equipo está realizando pruebas de aceptación de usuario (UAT) sobre una herramienta de triaje de IA completada antes de aprobarla para su lanzamiento en producción. ¿A qué actividad del ciclo de vida pertenece este trabajo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Acquire and Build, because UAT verifies the solution and confirms it meets requirements before going live. |
| **a** ES | Adquirir y Construir, porque la UAT verifica la solución y confirma que cumple los requisitos antes de salir en vivo. |
| **b** EN | Deliver and Support, because end-user involvement determines the ongoing supportability of the service. |
| **b** ES | Entregar y Soportar, porque la participación del usuario final determina la capacidad de soporte continuo del servicio. |
| **c** EN | Discover and Design, because UAT surfaces unmet requirements that feed back into the service design. |
| **c** ES | Descubrir y Diseñar, porque la UAT revela requisitos no satisfechos que retroalimentan el diseño del servicio. |
| **d** EN | Transition and Operate, because UAT is a gate activity that moves the service from build into production readiness. `<<KEY` |
| **d** ES | Transicionar y Operar, porque la UAT es una actividad de control que mueve el servicio desde la construcción hasta la preparación para producción. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | UAT is a transition gate: it confirms the built service is ready for production and belongs to Transition and Operate. Placing UAT in Acquire and Build confuses construction and verification of components with the formal transition process that authorises a service to go live. |
| ES | La UAT es un control de transición: confirma que el servicio construido está listo para producción y pertenece a Transicionar y Operar. Ubicar la UAT en Adquirir y Construir confunde la construcción y verificación de componentes con el proceso formal de transición que autoriza a un servicio a entrar en producción. |

### 129. AISM-I · 3.3 · `39f82e74-a894-402e-a5a8-d4deb2d5145c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Explain what a management practice is and distinguish general vs service management practices.

**stem**

| | |
|---|---|
| EN | A framework lists 'incident management' and 'service level management' in the same practice category. Which category, and why? |
| ES | Un marco enumera 'gestión de incidentes' y 'gestión de niveles de servicio' en la misma categoría de práctica. ¿Cuál categoría y por qué? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | General management, because both originated in broad business disciplines used across all industries. |
| **a** ES | Gestión general, porque ambas se originaron en disciplinas empresariales amplias utilizadas en todas las industrias. |
| **b** EN | Service management, because both were developed specifically within service management contexts. `<<KEY` |
| **b** ES | Gestión de servicios, porque ambas se desarrollaron específicamente dentro de contextos de gestión de servicios. `<<KEY` |
| **c** EN | Technical management, because both exist to maintain stability and performance of technology components. |
| **c** ES | Gestión técnica, porque ambas existen para mantener la estabilidad y el rendimiento de los componentes tecnológicos. |
| **d** EN | Service management, but classification changes if the organization lacks formal service level agreements. |
| **d** ES | Gestión de servicios, pero la clasificación cambia si la organización carece de acuerdos formales de nivel de servicio. |

**explanation**

| | |
|---|---|
| EN | Incident management and service level management are service management practices because they were developed specifically within service management contexts to address challenges unique to running services. Their category membership is not conditional on having a service desk or formal SLAs; that reflects a misunderstanding of how practices are classified. |
| ES | La gestión de incidentes y la gestión de niveles de servicio son prácticas de gestión de servicios porque se desarrollaron específicamente dentro de contextos de gestión de servicios para abordar desafíos únicos de la operación de servicios. Su pertenencia a una categoría no está condicionada a tener un service desk o acuerdos de nivel de servicio formales; eso refleja un malentendido sobre cómo se clasifican las prácticas. |

### 130. AISM-I · 3.5 · `64495519-c26e-43cf-b1a5-cfffe9d709a6`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Explain incident and problem management and select which applies - recognizing that a drop in AI output quality is itself an incident even when nothing is "down".

**stem**

| | |
|---|---|
| EN | An AI loan-decisioning service is fully operational but approval accuracy has dropped significantly over 48 hours. What should the service provider do first? |
| ES | Un servicio de decisión de préstamos basado en IA está completamente operativo, pero la precisión de aprobación ha caído significativamente en las últimas 48 horas. ¿Qué debería hacer primero el proveedor del servicio? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Open a problem record first, because root cause must be identified before an incident can be declared. |
| **a** ES | Abrir primero un registro de problema, porque la causa raíz debe identificarse antes de que se pueda declarar un incidente. |
| **b** EN | Take no action yet, because an incident requires complete unavailability, not reduced accuracy. |
| **b** ES | No tomar ninguna acción aún, porque un incidente requiere indisponibilidad total, no precisión reducida. |
| **c** EN | Escalate to the AI vendor, because model accuracy degradation is a product defect, not a provider-owned incident. |
| **c** ES | Escalar al proveedor de IA, porque la degradación de la precisión del modelo es un defecto del producto, no un incidente de responsabilidad del proveedor. |
| **d** EN | Log an incident, because degraded output quality is a service disruption even when the system is technically available. `<<KEY` |
| **d** ES | Registrar un incidente, porque la calidad degradada de los resultados es una interrupción del servicio incluso cuando el sistema está técnicamente disponible. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A drop in AI output quality is a service incident regardless of technical availability — 'up' is not the same as 'working correctly.' Incident Management must be triggered to restore normal service operation. Waiting for complete unavailability misapplies the incident definition. Opening a problem record before declaring an incident reverses the correct sequence. Escalating to the vendor does not relieve the provider of incident ownership. |
| ES | Una caída en la calidad de los resultados de la IA es un incidente de servicio independientemente de la disponibilidad técnica: que el sistema esté 'activo' no es lo mismo que 'funcionar correctamente'. La Gestión de Incidentes debe activarse para restaurar la operación normal del servicio. Esperar a una indisponibilidad total aplica incorrectamente la definición de incidente. Abrir un registro de problema antes de declarar un incidente invierte la secuencia correcta. Escalar al proveedor no libera al proveedor de la propiedad del incidente. |

### 131. AISM-I · 3.5 · `8d2edcfd-d7d6-4d95-9cab-9a974758f639`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Explain incident and problem management and select which applies - recognizing that a drop in AI output quality is itself an incident even when nothing is "down".

**stem**

| | |
|---|---|
| EN | An AI loan-assessment service meets SLA response times but analysts find approval rates have dropped sharply due to biased scoring. What should the provider do first? |
| ES | Un servicio de evaluación de préstamos con IA cumple los tiempos de respuesta del SLA, pero los analistas descubren que las tasas de aprobación han caído drásticamente debido a una puntuación sesgada. ¿Qué debería hacer primero el proveedor? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Take no action yet, because an incident requires a breach of response-time SLAs or full unavailability. |
| **a** ES | No tomar ninguna acción por ahora, porque un incidente requiere una violación de los SLA de tiempo de respuesta o una indisponibilidad total. |
| **b** EN | Log a service incident, because degraded output quality is an incident even when the system is technically available. `<<KEY` |
| **b** ES | Registrar un incidente de servicio, porque la degradación en la calidad de los resultados es un incidente incluso cuando el sistema está técnicamente disponible. `<<KEY` |
| **c** EN | Open a problem record first, since root-cause analysis should precede incident logging when infrastructure is functioning. |
| **c** ES | Abrir primero un registro de problema, ya que el análisis de causa raíz debe preceder al registro del incidente cuando la infraestructura está funcionando. |
| **d** EN | Escalate to the AI vendor, because biased outputs are a vendor defect outside the provider's incident process. |
| **d** ES | Escalar al proveedor de IA, porque los resultados sesgados son un defecto del proveedor que está fuera del proceso de incidentes del proveedor de servicios. |

**explanation**

| | |
|---|---|
| EN | Degraded AI output quality — including biased decisions — constitutes a service incident regardless of technical availability, because a service that is 'up' but producing harmful results is not working correctly. The provider must log and manage it as an incident immediately. Treating unavailability or SLA breach as the only valid incident triggers misapplies the incident definition. Escalating to the vendor without first logging an incident skips the provider's own incident-management obligation. Opening a problem record before an incident record reverses the correct sequence: incident management restores service first, while problem management investigates the underlying cause separately. |
| ES | La degradación en la calidad de los resultados de la IA — incluyendo decisiones sesgadas — constituye un incidente de servicio independientemente de la disponibilidad técnica, porque un servicio que está 'activo' pero que produce resultados perjudiciales no está funcionando correctamente. El proveedor debe registrarlo y gestionarlo como un incidente de inmediato. Tratar la indisponibilidad o el incumplimiento del SLA como los únicos desencadenantes válidos de un incidente aplica incorrectamente la definición de incidente. Escalar al proveedor sin registrar primero un incidente omite la propia obligación de gestión de incidentes del proveedor. Abrir un registro de problema antes que un registro de incidente invierte la secuencia correcta: la gestión de incidentes restaura el servicio primero, mientras que la gestión de problemas investiga la causa subyacente por separado. |

### 132. AISM-I · 3.6 · `6902cf27-4730-48a6-b184-ddd2333d5b3d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.6: Analyze a described recurring incident to identify its underlying problem (its root cause).

**stem**

| | |
|---|---|
| EN | Investigation into recurring API authentication failures finds an expired certificate causes the failure and an absent expiry alert allowed it to go unnoticed. What is the correct analytical conclusion? |
| ES | La investigación de fallas recurrentes de autenticación en una API descubre que un certificado vencido causa la falla y que la ausencia de una alerta de vencimiento permitió que pasara desapercibido. ¿Cuál es la conclusión analítica correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The absent alert is the root cause; the expired certificate is merely the proximate trigger and would not recur if alerting worked. |
| **a** ES | La ausencia de alerta es la causa raíz; el certificado vencido es meramente el desencadenante próximo y no volvería a ocurrir si las alertas funcionaran. |
| **b** EN | The absent alert is the root cause because it is the systemic gap; the expired certificate is only a proximate technical trigger. |
| **b** ES | La ausencia de alerta es la causa raíz porque es la brecha sistémica; el certificado vencido es solo un desencadenante técnico próximo. |
| **c** EN | Both share root-cause status; a contributing factor that significantly worsens impact is functionally equivalent to the root cause. |
| **c** ES | Ambos comparten el estatus de causa raíz; un factor contribuyente que agrava significativamente el impacto es funcionalmente equivalente a la causa raíz. |
| **d** EN | The expired certificate is the root cause; the absent alert is a contributing factor that enabled the condition to persist undetected. `<<KEY` |
| **d** ES | El certificado vencido es la causa raíz; la ausencia de alerta es un factor contribuyente que permitió que la condición persistiera sin ser detectada. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The expired certificate is the condition that directly produces the authentication failure and is therefore the root cause. The absent alert is a contributing factor: it did not create the expiry but allowed it to go undetected, worsening impact. Treating the absent alert as the root cause confuses detection failure with causation. Both require remediation, but for different reasons, and conflating them obscures what actually produces the incident. |
| ES | El certificado vencido es la condición que produce directamente la falla de autenticación y, por lo tanto, es la causa raíz. La ausencia de alerta es un factor contribuyente: no creó el vencimiento, pero permitió que pasara desapercibido, agravando el impacto. Tratar la ausencia de alerta como la causa raíz confunde la falla de detección con la causalidad. Ambos requieren remediación, pero por razones diferentes, y confundirlos oscurece lo que realmente produce el incidente. |

### 133. AISM-I · 3.7 · `25817069-3f27-48f7-b300-97d5ced5f893`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 3.7: Explain change enablement and select the appropriate change type - including treating an AI model update or retraining as a change whose effects are hard to predict and must be governed accordingly.

**stem**

| | |
|---|---|
| EN | A production AI fraud-detection model must be updated immediately to counter an active attack causing significant financial loss. No pre-authorized procedure exists. Which change type applies? |
| ES | Un modelo de IA de detección de fraudes en producción debe actualizarse de inmediato para contrarrestar un ataque activo que está causando pérdidas financieras significativas. No existe ningún procedimiento preautorizado. ¿Qué tipo de cambio aplica? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Emergency change, requiring expedited authorization from the designated emergency change authority. `<<KEY` |
| **a** ES | Cambio de emergencia, que requiere autorización expedita de la autoridad de cambios de emergencia designada. `<<KEY` |
| **b** EN | Standard change, because the urgency qualifies the update for immediate pre-authorized execution. |
| **b** ES | Cambio estándar, porque la urgencia califica la actualización para una ejecución inmediata preautorizada. |
| **c** EN | Normal change with shorter lead times, because emergency changes follow the same approval steps as normal changes. |
| **c** ES | Cambio normal con plazos más cortos, porque los cambios de emergencia siguen los mismos pasos de aprobación que los cambios normales. |
| **d** EN | No formal change type applies, because AI model updates fall outside standard change enablement scope. |
| **d** ES | No aplica ningún tipo de cambio formal, porque las actualizaciones de modelos de IA están fuera del alcance estándar de la habilitación de cambios. |

**explanation**

| | |
|---|---|
| EN | High urgency combined with significant business impact and no pre-existing pre-authorization defines an emergency change, which uses an expedited but distinct authorization path and still requires post-implementation review. Emergency changes are not simply accelerated normal changes; they have a separate authority and process. Urgency alone does not create a standard pre-authorization. AI model updates remain within change enablement scope regardless of their unpredictability. |
| ES | La alta urgencia combinada con un impacto empresarial significativo y la ausencia de preautorización existente define un cambio de emergencia, que utiliza una ruta de autorización expedita pero diferenciada y aún requiere una revisión posterior a la implementación. Los cambios de emergencia no son simplemente cambios normales acelerados; tienen una autoridad y un proceso separados. La urgencia por sí sola no crea una preautorización estándar. Las actualizaciones de modelos de IA permanecen dentro del alcance de la habilitación de cambios independientemente de su imprevisibilidad. |

### 134. AISM-I · 3.8 · `464b57f0-ccd4-44a3-b751-1064546e46b5`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.8: Explain service request management and the service desk as the point of engagement.

**stem**

| | |
|---|---|
| EN | A user submits a portal form requesting a new software license. Why is this a service request rather than an incident? |
| ES | Un usuario envía un formulario en el portal solicitando una nueva licencia de software. ¿Por qué esto es una solicitud de servicio y no un incidente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The service desk handles only incidents, so it reclassifies all portal submissions as low-priority incidents. |
| **a** ES | El service desk maneja únicamente incidentes, por lo que reclasifica todas las solicitudes del portal como incidentes de baja prioridad. |
| **b** EN | Any request needing specialist fulfillment is automatically categorized as an incident. |
| **b** ES | Cualquier solicitud que requiera cumplimiento por parte de un especialista se categoriza automáticamente como un incidente. |
| **c** EN | The user lacks access to a capability, so it qualifies as a service interruption. |
| **c** ES | El usuario no tiene acceso a una capacidad, por lo que califica como una interrupción del servicio. |
| **d** EN | It is a pre-defined, anticipated demand, not an unplanned disruption to an existing service. `<<KEY` |
| **d** ES | Es una demanda predefinida y anticipada, no una interrupción no planificada de un servicio existente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A service request is a normal, planned demand with a pre-defined fulfillment path, whereas an incident is an unplanned disruption to a working service. The user not yet having the license is a new demand, not a loss of something that was working. Classifying it as an incident confuses 'not yet having something' with 'losing something that was functioning.' |
| ES | Una solicitud de servicio es una demanda normal y planificada con un proceso de cumplimiento predefinido, mientras que un incidente es una interrupción no planificada de un servicio en funcionamiento. El hecho de que el usuario aún no tenga la licencia representa una nueva demanda, no la pérdida de algo que estaba funcionando. Clasificarlo como incidente confunde 'no tener algo todavía' con 'perder algo que estaba funcionando'. |

### 135. AISM-I · 3.8 · `ba3f4dda-80c6-43d8-8808-c94cc441f895`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.8: Explain service request management and the service desk as the point of engagement.

**stem**

| | |
|---|---|
| EN | A user submits a portal form requesting a new software license for their laptop. Why is this classified as a service request rather than an incident? |
| ES | Un usuario envía un formulario del portal solicitando una nueva licencia de software para su laptop. ¿Por qué esto se clasifica como una solicitud de servicio en lugar de un incidente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The user lacks access to a capability, making it a low-priority incident with a known workaround. |
| **a** ES | El usuario no tiene acceso a una capacidad, lo que lo convierte en un incidente de baja prioridad con una solución alternativa conocida. |
| **b** EN | Portal submissions bypass the service desk, so they cannot be classified as incidents. |
| **b** ES | Las solicitudes enviadas por el portal omiten la mesa de servicio, por lo que no pueden clasificarse como incidentes. |
| **c** EN | Specialist fulfillment is required, so it must follow the incident workflow instead. |
| **c** ES | Se requiere cumplimiento especializado, por lo que debe seguir el flujo de trabajo de incidentes en su lugar. |
| **d** EN | It is a pre-defined, normal demand with no unplanned disruption to an existing service. `<<KEY` |
| **d** ES | Es una demanda normal y predefinida sin ninguna interrupción no planificada a un servicio existente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A service request is a normal, pre-defined demand that does not involve any unplanned disruption — no service has failed, so no incident exists. The submission channel (portal or otherwise) is irrelevant to classification; portals are simply a valid engagement route. Lacking prior access to something new is not the same as a service disruption. Service requests requiring specialist fulfillment follow their own fulfillment workflows, not the incident management process. |
| ES | Una solicitud de servicio es una demanda normal y predefinida que no involucra ninguna interrupción no planificada; ningún servicio ha fallado, por lo que no existe un incidente. El canal de envío (portal u otro) es irrelevante para la clasificación; los portales son simplemente una vía de contacto válida. No tener acceso previo a algo nuevo no es lo mismo que una interrupción del servicio. Las solicitudes de servicio que requieren cumplimiento especializado siguen sus propios flujos de trabajo de cumplimiento, no el proceso de gestión de incidentes. |

### 136. AISM-I · 4.1 · `927b6123-aa06-4b32-b1d5-a7056c34dedc`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.1: Explain what AIOps is and how it changes service operations.

**stem**

| | |
|---|---|
| EN | How does correlation in an AIOps platform differ from alert grouping in a traditional event management tool? |
| ES | ¿En qué se diferencia la correlación en una plataforma de AIOps del agrupamiento de alertas en una herramienta tradicional de gestión de eventos? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | AIOps applies the same field-matching rules as traditional tools but executes them faster, making the difference one of speed only. |
| **a** ES | AIOps aplica las mismas reglas de coincidencia de campos que las herramientas tradicionales, pero las ejecuta más rápido, por lo que la diferencia es solo de velocidad. |
| **b** EN | AIOps discovers statistical relationships across diverse signal types, while traditional tools group by matching explicit fields like hostname. `<<KEY` |
| **b** ES | AIOps descubre relaciones estadísticas entre tipos de señales diversas, mientras que las herramientas tradicionales agrupan por coincidencia de campos explícitos como el nombre de host. `<<KEY` |
| **c** EN | AIOps correlates by matching alerts on source host fields, the same logic used by traditional event management tools. |
| **c** ES | AIOps correlaciona haciendo coincidir alertas en campos de host de origen, la misma lógica utilizada por las herramientas tradicionales de gestión de eventos. |
| **d** EN | AIOps correlates only within a single data type such as metrics, while traditional tools can span metrics, logs, and traces. |
| **d** ES | AIOps correlaciona solo dentro de un único tipo de datos, como métricas, mientras que las herramientas tradicionales pueden abarcar métricas, logs y trazas. |

**explanation**

| | |
|---|---|
| EN | Traditional event management groups alerts using explicit, human-defined rules such as matching hostname or service fields. AIOps correlation discovers relationships statistically across heterogeneous signals — metrics, logs, traces — without requiring every relationship to be pre-coded. Claiming the same logic runs faster, or that AIOps is limited to a single data type, both misrepresent the fundamental methodological difference. |
| ES | La gestión tradicional de eventos agrupa alertas usando reglas explícitas definidas por humanos, como la coincidencia de nombre de host o campos de servicio. La correlación de AIOps descubre relaciones estadísticamente entre señales heterogéneas —métricas, logs, trazas— sin requerir que cada relación esté precodificada. Afirmar que la misma lógica se ejecuta más rápido, o que AIOps está limitado a un único tipo de datos, representa incorrectamente la diferencia metodológica fundamental. |

### 137. AISM-I · 4.10 · `5a25be06-1dd2-4d16-81ae-4ef5c4250507`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.10: Explain agentic workflows in service operations - how an AI agent plans and takes multi-step action with reduced per-step human intervention.

**stem**

| | |
|---|---|
| EN | A service organization argues that higher autonomy should always be preferred to reduce latency and workload. Which concept most directly challenges this reasoning? |
| ES | Una organización de servicios argumenta que siempre se debe preferir una mayor autonomía para reducir la latencia y la carga de trabajo. ¿Qué concepto desafía más directamente este razonamiento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Autonomy levels are externally regulated and cannot be adjusted by the organization. |
| **a** ES | Los niveles de autonomía están regulados externamente y la organización no puede ajustarlos. |
| **b** EN | Agentic workflows are inherently slower than human-driven ones, so latency gains are illusory. |
| **b** ES | Los flujos de trabajo agénticos son inherentemente más lentos que los impulsados por humanos, por lo que las ganancias en latencia son ilusorias. |
| **c** EN | Autonomy must be weighed against action reversibility, risk level, and organizational trust thresholds. `<<KEY` |
| **c** ES | La autonomía debe sopesarse frente a la reversibilidad de las acciones, el nivel de riesgo y los umbrales de confianza organizacional. `<<KEY` |
| **d** EN | Oversight duties always expand to fill time saved by automation, so workload never decreases. |
| **d** ES | Las responsabilidades de supervisión siempre se expanden para llenar el tiempo ahorrado por la automatización, por lo que la carga de trabajo nunca disminuye. |

**explanation**

| | |
|---|---|
| EN | Autonomy must be calibrated to risk, reversibility, and the organization's trust thresholds—not optimized purely for speed or workload reduction. The remaining options introduce false claims: agentic systems are not inherently slower, workload dynamics do not follow a fixed expansion rule, and autonomy levels are not externally locked. |
| ES | La autonomía debe calibrarse según el riesgo, la reversibilidad y los umbrales de confianza de la organización, no optimizarse únicamente por velocidad o reducción de carga de trabajo. Las demás opciones introducen afirmaciones falsas: los sistemas agénticos no son inherentemente más lentos, la dinámica de la carga de trabajo no sigue una regla de expansión fija y los niveles de autonomía no están bloqueados externamente. |

### 138. AISM-I · 4.11 · `ece8c914-2baa-431f-bab8-63a532976f9e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.11: Given a described AI-driven service action an agent can perform, determine the highest safe level of autonomy the agent should be granted.

**stem**

| | |
|---|---|
| EN | An AI agent can delete customer records flagged as duplicates. Deletion is permanent; recovery requires a 48-hour restoration process. The agent's duplicate-detection confidence is 92%. What autonomy level should be granted? |
| ES | Un agente de IA puede eliminar registros de clientes marcados como duplicados. La eliminación es permanente; la recuperación requiere un proceso de restauración de 48 horas. La confianza del agente en la detección de duplicados es del 92%. ¿Qué nivel de autonomía debería otorgarse? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Human approval before deletion, because permanent data loss is irreversible and carries high stakes. `<<KEY` |
| **a** ES | Aprobación humana antes de la eliminación, porque la pérdida permanente de datos es irreversible y conlleva un alto impacto. `<<KEY` |
| **b** EN | Full autonomy, because duplicate records have no customer-facing impact and therefore carry low stakes. |
| **b** ES | Autonomía total, porque los registros duplicados no tienen impacto visible para el cliente y, por lo tanto, conllevan un impacto bajo. |
| **c** EN | Full autonomy, because 48-hour recovery availability makes the action effectively reversible. |
| **c** ES | Autonomía total, porque la disponibilidad de recuperación en 48 horas hace que la acción sea efectivamente reversible. |
| **d** EN | Full autonomy, because 92% confidence is sufficiently high to permit irreversible actions without escalation. |
| **d** ES | Autonomía total, porque una confianza del 92% es suficientemente alta para permitir acciones irreversibles sin escalamiento. |

**explanation**

| | |
|---|---|
| EN | Permanent deletion with a 48-hour recovery window is effectively irreversible for practical purposes, and data loss carries high stakes; together these factors require human approval regardless of confidence level. A 48-hour restoration process does not make an action freely reversible—partial reversibility still meaningfully restricts safe autonomy. Duplicate records can affect customer service and billing, so dismissing their stakes is incorrect. Confidence is one input among four and cannot override the irreversibility-and-stakes combination. |
| ES | La eliminación permanente con una ventana de recuperación de 48 horas es efectivamente irreversible para fines prácticos, y la pérdida de datos conlleva un alto impacto; juntos, estos factores requieren aprobación humana independientemente del nivel de confianza. Un proceso de restauración de 48 horas no hace que una acción sea libremente reversible; la reversibilidad parcial sigue restringiendo significativamente la autonomía segura. Los registros duplicados pueden afectar el servicio al cliente y la facturación, por lo que desestimar su impacto es incorrecto. La confianza es uno de cuatro factores y no puede anular la combinación de irreversibilidad e impacto. |

### 139. AISM-I · 4.13 · `50e785b1-d72f-4e2f-9da1-6d8f715d56fb`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.13: Distinguish human-in-the-loop from human-on-the-loop oversight when applied to AI-driven service actions.

**stem**

| | |
|---|---|
| EN | An AI system restarts a failing microservice automatically. A human engineer receives a dashboard alert and can halt future restarts at any time. Which oversight mode does this describe? |
| ES | Un sistema de IA reinicia automáticamente un microservicio que falla. Un ingeniero humano recibe una alerta en el panel de control y puede detener futuros reinicios en cualquier momento. ¿Qué modo de supervisión describe esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Human-in-the-loop, because the engineer reviews and approves each restart before it executes. |
| **a** ES | Human-in-the-loop, porque el ingeniero revisa y aprueba cada reinicio antes de que se ejecute. |
| **b** EN | No formal oversight mode, because an alert system alone does not constitute human oversight. |
| **b** ES | Ningún modo formal de supervisión, porque un sistema de alertas por sí solo no constituye supervisión humana. |
| **c** EN | Human-on-the-loop, because the AI acts without prior approval while the engineer retains authority to intervene. `<<KEY` |
| **c** ES | Human-on-the-loop, porque la IA actúa sin aprobación previa mientras el ingeniero conserva la autoridad para intervenir. `<<KEY` |
| **d** EN | Human-in-the-loop, because receiving an alert for every restart places the human inside the decision loop. |
| **d** ES | Human-in-the-loop, porque recibir una alerta por cada reinicio coloca al humano dentro del ciclo de decisión. |

**explanation**

| | |
|---|---|
| EN | Human-on-the-loop means the AI acts without prior approval while a human supervises and retains intervention authority. The engineer monitors and can stop the process but does not approve each restart, which is the defining characteristic of human-on-the-loop. Receiving alerts does not equal approving actions, and notification alone does not satisfy either formal oversight mode. |
| ES | Human-on-the-loop significa que la IA actúa sin aprobación previa mientras un humano supervisa y conserva la autoridad de intervención. El ingeniero monitorea y puede detener el proceso, pero no aprueba cada reinicio, lo cual es la característica definitoria del human-on-the-loop. Recibir alertas no equivale a aprobar acciones, y la notificación por sí sola no satisface ninguno de los dos modos formales de supervisión. |

### 140. AISM-I · 4.13 · `f6b64c5b-3f11-478b-a9d7-de7a25b3c0fc`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 4.13: Distinguish human-in-the-loop from human-on-the-loop oversight when applied to AI-driven service actions.

**stem**

| | |
|---|---|
| EN | An AI system reroutes network traffic automatically. A human engineer receives alerts and can halt or reverse actions, but does not approve each decision beforehand. Which oversight mode does this describe? |
| ES | Un sistema de IA redirige el tráfico de red automáticamente. Un ingeniero humano recibe alertas y puede detener o revertir las acciones, pero no aprueba cada decisión de antemano. ¿Qué modo de supervisión describe esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Human-on-the-loop: the human monitors and retains intervention authority without pre-approving each action. `<<KEY` |
| **a** ES | Human-on-the-loop: el humano monitorea y conserva la autoridad de intervención sin aprobar previamente cada acción. `<<KEY` |
| **b** EN | Human-in-the-loop: any risk-bearing live-service action requires human approval before execution. |
| **b** ES | Human-in-the-loop: cualquier acción en un servicio en vivo que implique riesgo requiere aprobación humana antes de ejecutarse. |
| **c** EN | Human-on-the-loop: valid only when the human intervenes frequently, not just monitors. |
| **c** ES | Human-on-the-loop: válido solo cuando el humano interviene con frecuencia, no únicamente cuando monitorea. |
| **d** EN | Human-in-the-loop: post-hoc intervention authority counts as approval within the decision path. |
| **d** ES | Human-in-the-loop: la autoridad de intervención posterior cuenta como aprobación dentro de la ruta de decisión. |

**explanation**

| | |
|---|---|
| EN | Human-on-the-loop places the human outside the pre-approval step: the AI acts autonomously, and the human monitors and may intervene afterward. This matches the scenario exactly. Human-in-the-loop requires approval before each action, so post-hoc intervention authority alone does not satisfy that mode. The claim that on-the-loop oversight requires frequent intervention confuses intervention frequency with the structural presence of oversight authority. The claim that any risk-bearing action requires pre-approval imposes a rule that belongs to human-in-the-loop, not to the scenario described. |
| ES | El modo human-on-the-loop ubica al humano fuera del paso de aprobación previa: la IA actúa de forma autónoma, y el humano monitorea y puede intervenir posteriormente. Esto coincide exactamente con el escenario. El modo human-in-the-loop requiere aprobación antes de cada acción, por lo que la autoridad de intervención posterior por sí sola no satisface ese modo. La afirmación de que la supervisión on-the-loop requiere intervención frecuente confunde la frecuencia de intervención con la presencia estructural de la autoridad de supervisión. La afirmación de que cualquier acción que implique riesgo requiere aprobación previa impone una regla que corresponde al modo human-in-the-loop, no al escenario descrito. |

### 141. AISM-I · 4.14 · `229d0648-b0b1-46a9-b62b-d18f881a7917`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.14: Given a described AI-driven service action, determine an appropriate oversight design for its risk.

**stem**

| | |
|---|---|
| EN | An AI system automatically cancels subscriptions flagged as fraudulent, immediately affecting billing and account access. Which oversight design is most appropriate? |
| ES | Un sistema de IA cancela automáticamente suscripciones marcadas como fraudulentas, afectando de inmediato la facturación y el acceso a la cuenta. ¿Qué diseño de supervisión es el más apropiado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Place a human quality check at the end of each daily batch, since oversight is most efficient as a final step. |
| **a** ES | Colocar una revisión humana de calidad al final de cada lote diario, ya que la supervisión es más eficiente como paso final. |
| **b** EN | Rely on high fraud-detection accuracy, since strong aggregate performance ensures safety for individual decisions. |
| **b** ES | Confiar en la alta precisión de detección de fraude, ya que un rendimiento agregado sólido garantiza la seguridad en decisiones individuales. |
| **c** EN | Require human review before each cancellation, because immediate billing and access impact makes this a consequential action. `<<KEY` |
| **c** ES | Requerir revisión humana antes de cada cancelación, porque el impacto inmediato en la facturación y el acceso convierte esto en una acción de alto impacto. `<<KEY` |
| **d** EN | Apply uniform oversight to all billing-system AI actions to ensure consistent monitoring across the workflow. |
| **d** ES | Aplicar supervisión uniforme a todas las acciones de IA del sistema de facturación para garantizar un monitoreo consistente en todo el flujo de trabajo. |

**explanation**

| | |
|---|---|
| EN | Because subscription cancellation immediately harms a user's billing and access, it is a consequential action requiring oversight before execution—at the point where impact materializes. Uniform oversight ignores consequence magnitude. End-of-batch review is too late to prevent harm. High aggregate accuracy does not eliminate risk on individual high-consequence decisions. |
| ES | Dado que la cancelación de una suscripción perjudica de inmediato la facturación y el acceso del usuario, es una acción de alto impacto que requiere supervisión antes de su ejecución, en el punto donde el impacto se materializa. La supervisión uniforme ignora la magnitud de las consecuencias. La revisión al final del lote llega demasiado tarde para prevenir el daño. Una alta precisión agregada no elimina el riesgo en decisiones individuales de alta consecuencia. |

### 142. AISM-I · 4.14 · `b600b810-4f40-4171-97da-807245f52154`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.14: Given a described AI-driven service action, determine an appropriate oversight design for its risk.

**stem**

| | |
|---|---|
| EN | An AI routes support tickets: 95% go to self-service and 5% escalate to a specialist with contract implications. How should oversight be distributed? |
| ES | Una IA enruta tickets de soporte: el 95% va a autoservicio y el 5% se escala a un especialista con implicaciones contractuales. ¿Cómo se debe distribuir la supervisión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Apply equal oversight to both paths, because low frequency of escalations reduces their overall risk to an acceptable level. |
| **a** ES | Aplicar supervisión igual a ambas rutas, porque la baja frecuencia de escalaciones reduce su riesgo general a un nivel aceptable. |
| **b** EN | Apply tighter oversight only to escalation decisions, because contract implications make those outcomes materially consequential. `<<KEY` |
| **b** ES | Aplicar una supervisión más estricta solo a las decisiones de escalación, porque las implicaciones contractuales hacen que esos resultados sean materialmente significativos. `<<KEY` |
| **c** EN | Require human approval at every routing step, because tighter oversight means a human must approve each decision in the workflow. |
| **c** ES | Requerir aprobación humana en cada paso de enrutamiento, porque una supervisión más estricta significa que un humano debe aprobar cada decisión del flujo de trabajo. |
| **d** EN | Audit all routing decisions on a fixed weekly schedule to ensure systematic coverage of the entire workflow. |
| **d** ES | Auditar todas las decisiones de enrutamiento en un calendario semanal fijo para garantizar una cobertura sistemática de todo el flujo de trabajo. |

**explanation**

| | |
|---|---|
| EN | Risk-based oversight concentrates effort where consequences are greatest—the escalation path with contract implications—regardless of frequency. Fixed-interval audits ignore consequence magnitude. Low frequency does not reduce consequentiality; a rare high-impact decision still warrants strong oversight. Tighter oversight means calibrating to the consequential decision point, not approving every step. |
| ES | La supervisión basada en riesgos concentra el esfuerzo donde las consecuencias son mayores: la ruta de escalación con implicaciones contractuales, independientemente de la frecuencia. Las auditorías a intervalos fijos ignoran la magnitud de las consecuencias. La baja frecuencia no reduce la importancia de las consecuencias; una decisión de alto impacto poco frecuente sigue requiriendo una supervisión sólida. Una supervisión más estricta significa calibrarla al punto de decisión consecuente, no aprobar cada paso. |

### 143. AISM-I · 4.15 · `e43bd6a8-c0d2-4dc2-9897-09e5c5536f71`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.15: Diagnose why an AI-augmented operation degraded - model drift, data quality, or automation gone wrong.

**stem**

| | |
|---|---|
| EN | A fraud-detection model runs error-free for three months. Flagged fraud cases drop 40% over six weeks, yet held-out test-set accuracy is unchanged. What is the most defensible diagnosis? |
| ES | Un modelo de detección de fraude funciona sin errores durante tres meses. Los casos de fraude marcados caen un 40% en seis semanas, pero la precisión en el conjunto de prueba reservado no cambia. ¿Cuál es el diagnóstico más defendible? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Threshold misconfiguration: an upstream pipeline change raised the model's classification threshold, suppressing flags without affecting held-out accuracy. |
| **a** ES | Mala configuración del umbral: un cambio en el pipeline anterior elevó el umbral de clasificación del modelo, suprimiendo las marcas sin afectar la precisión en el conjunto de prueba reservado. |
| **b** EN | Data quality failure: corrupted inference inputs caused low-confidence scores, which the downstream system interpreted as non-fraud predictions. |
| **b** ES | Falla de calidad de datos: entradas de inferencia corruptas generaron puntuaciones de baja confianza, que el sistema posterior interpretó como predicciones de no fraude. |
| **c** EN | Model corruption: a deployment update silently altered scoring logic, causing the gradual decline in flagged cases observed in production. |
| **c** ES | Corrupción del modelo: una actualización de despliegue alteró silenciosamente la lógica de puntuación, causando la disminución gradual en los casos marcados observada en producción. |
| **d** EN | Concept drift: fraud patterns shifted, so the model's decision boundary no longer matches current production data despite stable test-set metrics. `<<KEY` |
| **d** ES | Deriva de concepto: los patrones de fraude cambiaron, por lo que la frontera de decisión del modelo ya no coincide con los datos actuales de producción a pesar de que las métricas del conjunto de prueba permanecen estables. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Stable held-out accuracy does not rule out production drift; the test set reflects historical conditions, not the current distribution. A silent, gradual decline in flagged cases with no pipeline errors is the hallmark of concept drift — the relationship between input features and fraud labels has changed in the real world. A deployment-introduced scoring bug is plausible but would typically produce abrupt rather than gradual change and would likely surface other anomalies. A threshold misconfiguration is a genuine competing explanation, but the scenario specifies no pipeline changes, making it less defensible. Models do not self-signal uncertainty when fed shifted data, so corrupted inputs causing systematic refusal to flag is not how inference pipelines behave. |
| ES | Una precisión estable en el conjunto de prueba reservado no descarta la deriva en producción; el conjunto de prueba refleja condiciones históricas, no la distribución actual. Una disminución silenciosa y gradual en los casos marcados sin errores en el pipeline es la señal característica de la deriva de concepto: la relación entre las características de entrada y las etiquetas de fraude ha cambiado en el mundo real. Un error de puntuación introducido en el despliegue es plausible, pero típicamente produciría un cambio abrupto en lugar de gradual y probablemente generaría otras anomalías. Una mala configuración del umbral es una explicación alternativa válida, pero el escenario especifica que no hubo cambios en el pipeline, lo que la hace menos defendible. Los modelos no señalan incertidumbre de forma autónoma cuando reciben datos desplazados, por lo que entradas corruptas que causen un rechazo sistemático a marcar casos no corresponde al comportamiento típico de los pipelines de inferencia. |

### 144. AISM-I · 4.2 · `6cb8439f-5a28-47cb-a404-bd042ad0239f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.2: Given a described operation, determine where AIOps adds value across monitoring, event correlation, and noise reduction.

**stem**

| | |
|---|---|
| EN | A capacity planning team needs to forecast when compute resources will be exhausted before users experience degradation. Which AIOps use case should they apply? |
| ES | Un equipo de planificación de capacidad necesita prever cuándo se agotarán los recursos de cómputo antes de que los usuarios experimenten degradación. ¿Qué caso de uso de AIOps deben aplicar? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Predictive capacity planning, to model consumption trends and forecast exhaustion across resource types. `<<KEY` |
| **a** ES | Planificación predictiva de capacidad, para modelar tendencias de consumo y pronosticar el agotamiento en todos los tipos de recursos. `<<KEY` |
| **b** EN | Alert noise reduction, to suppress low-priority capacity warnings until resources reach a critical threshold. |
| **b** ES | Reducción de ruido de alertas, para suprimir advertencias de capacidad de baja prioridad hasta que los recursos alcancen un umbral crítico. |
| **c** EN | Event correlation, to group compute-related alerts into one incident and surface the exhaustion event faster. |
| **c** ES | Correlación de eventos, para agrupar alertas relacionadas con el cómputo en un solo incidente y detectar el evento de agotamiento más rápido. |
| **d** EN | Anomaly detection, to flag unusual spikes in resource usage after exhaustion has already begun. |
| **d** ES | Detección de anomalías, para señalar picos inusuales en el uso de recursos después de que el agotamiento ya haya comenzado. |

**explanation**

| | |
|---|---|
| EN | AIOps predictive capacity planning applies forecasting models to compute, network, and application-layer resources to anticipate exhaustion before it impacts users. Event correlation addresses alert grouping after an issue occurs, not proactive forecasting. Anomaly detection reacts to deviations as they happen rather than projecting future exhaustion. Suppressing capacity warnings delays action rather than enabling proactive planning. |
| ES | La planificación predictiva de capacidad de AIOps aplica modelos de pronóstico a recursos de cómputo, red y capa de aplicación para anticipar el agotamiento antes de que impacte a los usuarios. La correlación de eventos aborda la agrupación de alertas después de que ocurre un problema, no el pronóstico proactivo. La detección de anomalías reacciona a las desviaciones conforme ocurren en lugar de proyectar el agotamiento futuro. Suprimir las advertencias de capacidad retrasa la acción en lugar de habilitar una planificación proactiva. |

### 145. AISM-I · 4.3 · `720fb636-e28a-4b0c-9c81-2ec71c564e6b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.3: Analyze an alert flood to identify the underlying signal AIOps should surface.

**stem**

| | |
|---|---|
| EN | An AIOps engine ranks alerts by frequency during a storm. A cache-miss warning fires 95 times; a storage-controller timeout fires only 3 times. The engine flags the cache-miss alert as the root signal. What is the likely error in this logic? |
| ES | Un motor AIOps clasifica las alertas por frecuencia durante una tormenta. Una advertencia de cache-miss se dispara 95 veces; un timeout del controlador de almacenamiento se dispara solo 3 veces. El motor marca la alerta de cache-miss como la señal raíz. ¿Cuál es el probable error en esta lógica? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Frequency is a valid proxy for causal depth; high count confirms the cache-miss alert is the originating fault. |
| **a** ES | La frecuencia es un proxy válido para la profundidad causal; el alto conteo confirma que la alerta de cache-miss es la falla de origen. |
| **b** EN | The storage-controller timeout is low-frequency because it is downstream; high-frequency alerts sit closer to the root cause. |
| **b** ES | El timeout del controlador de almacenamiento tiene baja frecuencia porque está downstream; las alertas de alta frecuencia están más cerca de la causa raíz. |
| **c** EN | Frequency reflects how many components depend on a failing resource, not causal origin; the low-frequency storage alert may be upstream. `<<KEY` |
| **c** ES | La frecuencia refleja cuántos componentes dependen de un recurso que falla, no el origen causal; la alerta de almacenamiento de baja frecuencia puede ser upstream. `<<KEY` |
| **d** EN | The engine should prioritize the highest-severity alert instead, because severity maps directly onto the causal hierarchy. |
| **d** ES | El motor debería priorizar en cambio la alerta de mayor severidad, porque la severidad se mapea directamente en la jerarquía causal. |

**explanation**

| | |
|---|---|
| EN | A root fault in a shared resource produces many downstream alerts from dependent components, making high-frequency alerts symptoms rather than causes. The low-frequency storage-controller timeout is consistent with a single upstream failure point. Both frequency-as-cause and severity-as-cause are common misconceptions that misdirect root signal identification. |
| ES | Una falla raíz en un recurso compartido produce muchas alertas downstream de los componentes dependientes, lo que hace que las alertas de alta frecuencia sean síntomas en lugar de causas. El timeout del controlador de almacenamiento de baja frecuencia es consistente con un único punto de falla upstream. Tanto la frecuencia-como-causa como la severidad-como-causa son conceptos erróneos comunes que desvían la identificación de la señal raíz. |

### 146. AISM-I · 4.3 · `9f4fb98e-ddde-49d0-8ef3-6a6cbd2d723e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.3: Analyze an alert flood to identify the underlying signal AIOps should surface.

**stem**

| | |
|---|---|
| EN | After a core router fails, 150 alerts fire. Before any investigation, the team lead instructs analysts to suppress all informational and warning alerts to reduce noise, then begin analysis. Which risk does this approach introduce? |
| ES | Después de que falla un router central, se disparan 150 alertas. Antes de cualquier investigación, el líder del equipo instruye a los analistas a suprimir todas las alertas informativas y de advertencia para reducir el ruido y luego comenzar el análisis. ¿Qué riesgo introduce este enfoque? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The root signal or a key correlating alert may reside among the suppressed alerts, removing evidence needed to identify the upstream fault. `<<KEY` |
| **a** ES | La señal raíz o una alerta correlacionadora clave puede encontrarse entre las alertas suprimidas, eliminando la evidencia necesaria para identificar la falla upstream. `<<KEY` |
| **b** EN | Suppression increases analyst workload by forcing manual review of each remaining alert without automated correlation support. |
| **b** ES | La supresión aumenta la carga de trabajo del analista al obligarlo a revisar manualmente cada alerta restante sin soporte de correlación automatizada. |
| **c** EN | Suppression is safe preprocessing because root signals manifest as critical- or error-severity alerts, not informational ones. |
| **c** ES | La supresión es un preprocesamiento seguro porque las señales raíz se manifiestan como alertas de severidad crítica o de error, no informativas. |
| **d** EN | Suppressing lower-priority alerts causes the AIOps engine to re-fire them at higher severity, compounding the storm volume. |
| **d** ES | Suprimir alertas de menor prioridad hace que el motor AIOps las vuelva a disparar con mayor severidad, lo que agrava el volumen de la tormenta. |

**explanation**

| | |
|---|---|
| EN | Lower-priority alerts can carry causal information or serve as correlating evidence linking symptoms to a shared upstream fault. Suppressing them before correlation removes that evidence. The misconception that root signals always carry high severity leads teams to discard alerts that could identify the root cause. |
| ES | Las alertas de menor prioridad pueden contener información causal o servir como evidencia correlacionadora que vincula los síntomas con una falla upstream compartida. Suprimirlas antes de la correlación elimina esa evidencia. El concepto erróneo de que las señales raíz siempre tienen alta severidad lleva a los equipos a descartar alertas que podrían identificar la causa raíz. |

### 147. AISM-I · 4.4 · `86c5cfc2-3f10-4ca3-ac6f-f950b923852e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.4: Explain predictive and proactive service management.

**stem**

| | |
|---|---|
| EN | Which statement accurately describes the relationship between proactive service management and incidents? |
| ES | ¿Qué afirmación describe con precisión la relación entre la gestión de servicios proactiva y los incidentes? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Proactive management guarantees zero incidents; any incident that occurs proves the predictive system is broken. |
| **a** ES | La gestión proactiva garantiza cero incidentes; cualquier incidente que ocurra demuestra que el sistema predictivo está fallando. |
| **b** EN | Proactive management applies only to hardware failures, since software faults produce no detectable early signals. |
| **b** ES | La gestión proactiva se aplica únicamente a fallas de hardware, ya que las fallas de software no producen señales tempranas detectables. |
| **c** EN | Proactive management replaces incident response entirely, making post-incident reviews unnecessary. |
| **c** ES | La gestión proactiva reemplaza por completo la respuesta a incidentes, haciendo innecesarias las revisiones post-incidente. |
| **d** EN | Proactive management reduces incident frequency and impact; residual incidents do not indicate system failure. `<<KEY` |
| **d** ES | La gestión proactiva reduce la frecuencia e impacto de los incidentes; los incidentes residuales no indican un fallo del sistema. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Proactive management reduces incidents but cannot eliminate them entirely; residual incidents do not invalidate the approach. Equating any incident with system failure sets an impossible standard. Software faults can produce early signals such as rising error-rate trends, making software a valid domain for proactive management. Incident response and post-incident reviews remain valuable alongside proactive practices. |
| ES | La gestión proactiva reduce los incidentes, pero no puede eliminarlos por completo; los incidentes residuales no invalidan el enfoque. Equiparar cualquier incidente con un fallo del sistema establece un estándar imposible. Las fallas de software pueden producir señales tempranas, como tendencias crecientes en tasas de error, lo que hace del software un dominio válido para la gestión proactiva. La respuesta a incidentes y las revisiones post-incidente siguen siendo valiosas junto con las prácticas proactivas. |

### 148. AISM-I · 4.5 · `b86eeacf-871e-44cd-a069-a0c2b088b0ca`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.5: Given a described operation, determine whether a predictive approach fits.

**stem**

| | |
|---|---|
| EN | A telecom operator's model predicts network outages with 78% precision on the test set. Leadership is ready to deploy immediately. What should the team verify before proceeding? |
| ES | El modelo de un operador de telecomunicaciones predice interrupciones de red con un 78% de precisión en el conjunto de prueba. La dirección está lista para implementarlo de inmediato. ¿Qué debe verificar el equipo antes de proceder? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Whether precision can be raised above 90%, since scores below that level fail the standard prediction-value threshold. |
| **a** ES | Si la precisión puede elevarse por encima del 90%, ya que las puntuaciones por debajo de ese nivel no superan el umbral estándar de valor de predicción. |
| **b** EN | Whether the test-set score confirms readiness, since high statistical performance directly equals high operational benefit. |
| **b** ES | Si la puntuación del conjunto de prueba confirma la preparación, ya que el alto rendimiento estadístico equivale directamente a un alto beneficio operativo. |
| **c** EN | Whether outages are frequent enough to justify prediction, since low event frequency disqualifies the approach regardless of precision. |
| **c** ES | Si las interrupciones son suficientemente frecuentes para justificar la predicción, ya que la baja frecuencia de eventos descalifica el enfoque independientemente de la precisión. |
| **d** EN | Whether 78% precision yields net operational value after accounting for false-alarm response costs and missed-outage consequences. `<<KEY` |
| **d** ES | Si el 78% de precisión produce un valor operativo neto después de considerar los costos de respuesta a falsas alarmas y las consecuencias de interrupciones no detectadas. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Statistical precision on a test set does not automatically equal operational value; the team must assess whether acting on 78%-precise alerts—including the cost of the false positives—produces a net benefit. There is no universal precision threshold such as 90%. Test-set metrics and real-world operational value are distinct measures. Event frequency alone does not disqualify prediction. |
| ES | La precisión estadística en un conjunto de prueba no equivale automáticamente a valor operativo; el equipo debe evaluar si actuar ante alertas con un 78% de precisión —incluyendo el costo de los falsos positivos— produce un beneficio neto. No existe un umbral universal de precisión como el 90%. Las métricas del conjunto de prueba y el valor operativo real son medidas distintas. La frecuencia de eventos por sí sola no descalifica la predicción. |

### 149. AISM-I · 4.6 · `082fba7f-54ec-4ff8-9b82-038b11eff77a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.6: Analyze a recurring-incident pattern to determine whether a predictive control would prevent it.

**stem**

| | |
|---|---|
| EN | Over six months, a cloud platform logs 14 crashes after memory usage exceeds 85% for more than 10 minutes. A monitoring tool tracks memory in real time. Which conclusion best explains whether a predictive control fits this pattern? |
| ES | Durante seis meses, una plataforma en la nube registra 14 caídas del sistema después de que el uso de memoria supera el 85% durante más de 10 minutos. Una herramienta de monitoreo rastrea la memoria en tiempo real. ¿Qué conclusión explica mejor si un control predictivo se ajusta a este patrón? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A predictive control fits because sustained memory above 85% is detectable before the crash, giving operators a window to intervene. `<<KEY` |
| **a** ES | Un control predictivo es adecuado porque el uso sostenido de memoria por encima del 85% es detectable antes de la caída, lo que le da a los operadores una ventana para intervenir. `<<KEY` |
| **b** EN | A predictive control is premature until the most recent crash is fully remediated, since that fix addresses conditions behind earlier incidents. |
| **b** ES | Un control predictivo es prematuro hasta que la caída más reciente sea completamente remediada, ya que esa corrección aborda las condiciones detrás de los incidentes anteriores. |
| **c** EN | A predictive control is unnecessary because the same threshold appears in every incident, confirming a single root cause already resolved by patching. |
| **c** ES | Un control predictivo es innecesario porque el mismo umbral aparece en cada incidente, lo que confirma una única causa raíz ya resuelta mediante parches. |
| **d** EN | A predictive control fits because the crash recurs frequently; any control that reduces crash frequency qualifies as predictive. |
| **d** ES | Un control predictivo es adecuado porque la caída se repite con frecuencia; cualquier control que reduzca la frecuencia de caídas califica como predictivo. |

**explanation**

| | |
|---|---|
| EN | A predictive control is appropriate when a detectable precursor exists before failure. Sustained memory above 85% is measurable in real time, giving operators a window to act before the crash—the defining condition for a predictive control. Claiming that any frequency-reducing control qualifies as predictive is wrong: a control that acts after failure has begun is reactive, not predictive. Fixing only the most recent instance does not resolve the shared driver across earlier incidents. A consistent threshold does not confirm a resolved root cause; it confirms a recurring, unaddressed precursor. |
| ES | Un control predictivo es apropiado cuando existe un precursor detectable antes del fallo. El uso sostenido de memoria por encima del 85% es medible en tiempo real, lo que le da a los operadores una ventana para actuar antes de la caída: esa es la condición definitoria de un control predictivo. Afirmar que cualquier control que reduzca la frecuencia de caídas califica como predictivo es incorrecto: un control que actúa después de que el fallo ha comenzado es reactivo, no predictivo. Corregir únicamente la instancia más reciente no resuelve el factor común detrás de los incidentes anteriores. Un umbral consistente no confirma una causa raíz resuelta; confirma un precursor recurrente que no ha sido abordado. |

### 150. AISM-I · 4.7 · `6f443226-493c-4116-abba-beb377a5fd7c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.7: Explain virtual agents and conversational AI at the service desk, and their limits.

**stem**

| | |
|---|---|
| EN | A virtual agent resolves 80% of contacts without human involvement. A stakeholder argues this proves underperformance because the target should be 100% deflection. Why is this argument flawed? |
| ES | Un agente virtual resuelve el 80% de los contactos sin intervención humana. Un interesado argumenta que esto demuestra un rendimiento deficiente porque el objetivo debería ser el 100% de deflexión. ¿Por qué este argumento es incorrecto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Deflection rate is not a valid performance metric; only user satisfaction scores should be used to evaluate virtual agent success. |
| **a** ES | La tasa de deflexión no es una métrica de rendimiento válida; solo las puntuaciones de satisfacción del usuario deben usarse para evaluar el éxito de un agente virtual. |
| **b** EN | Deflection rate is only meaningful when paired with containment rate, so 80% deflection is neither good nor bad on its own. |
| **b** ES | La tasa de deflexión solo es significativa cuando se combina con la tasa de contención, por lo que el 80% de deflexión no es ni bueno ni malo por sí solo. |
| **c** EN | Deflection rate should be benchmarked against industry peers, not an internal target, so 80% cannot be judged without external data. |
| **c** ES | La tasa de deflexión debe compararse con referentes de la industria, no con un objetivo interno, por lo que el 80% no puede evaluarse sin datos externos. |
| **d** EN | 100% deflection is an inappropriate target because ambiguous, high-stakes, and low-confidence cases must be escalated by design. `<<KEY` |
| **d** ES | El 100% de deflexión es un objetivo inapropiado porque los casos ambiguos, de alto impacto y de baja confianza deben escalarse por diseño. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A 100% deflection target is inappropriate because some contacts — those involving ambiguity, high stakes, or low confidence — must be escalated to human agents by design. The virtual agent's limit is a feature, not a defect. Requiring external benchmarking before any judgment is possible, insisting deflection and containment must always be paired, or dismissing deflection rate entirely as invalid are all misconceptions that sidestep the core principle that escalation is a designed and necessary outcome. |
| ES | Un objetivo del 100% de deflexión es inapropiado porque algunos contactos, aquellos que involucran ambigüedad, alto impacto o baja confianza, deben escalarse a agentes humanos por diseño. El límite del agente virtual es una característica, no un defecto. Exigir comparaciones externas antes de emitir cualquier juicio, insistir en que la deflexión y la contención siempre deben combinarse, o descartar completamente la tasa de deflexión como inválida son concepciones erróneas que evaden el principio central de que la escalada es un resultado diseñado y necesario. |

### 151. AISM-I · 4.7 · `a23b4e83-bc4d-40fa-aed7-aef116f48119`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.7: Explain virtual agents and conversational AI at the service desk, and their limits.

**stem**

| | |
|---|---|
| EN | A virtual agent consistently returns low confidence scores when users describe issues in informal or ambiguous language. What does this most accurately indicate about the agent? |
| ES | Un agente virtual devuelve consistentemente puntuaciones de confianza bajas cuando los usuarios describen problemas en lenguaje informal o ambiguo. ¿Qué indica esto con mayor precisión sobre el agente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The NLP model is outdated and must be replaced, because current-generation models handle informal language without confidence issues. |
| **a** ES | El modelo de NLP está desactualizado y debe reemplazarse, porque los modelos de generación actual manejan el lenguaje informal sin problemas de confianza. |
| **b** EN | Low confidence reflects only insufficient training examples and is unrelated to how users phrase their requests. |
| **b** ES | La baja confianza refleja solo ejemplos de entrenamiento insuficientes y no está relacionada con la forma en que los usuarios expresan sus solicitudes. |
| **c** EN | The agent is correctly signaling that intent cannot be reliably determined, due to training gaps, genuine ambiguity, or both. `<<KEY` |
| **c** ES | El agente está señalando correctamente que la intención no puede determinarse de manera confiable, debido a brechas de entrenamiento, ambigüedad genuina, o ambas. `<<KEY` |
| **d** EN | The agent interprets meaning as humans do, so low confidence scores indicate users are providing incomplete information intentionally. |
| **d** ES | El agente interpreta el significado como lo hacen los humanos, por lo que las puntuaciones de confianza bajas indican que los usuarios están proporcionando información incompleta intencionalmente. |

**explanation**

| | |
|---|---|
| EN | Low confidence scores reflect uncertainty in intent matching, which can stem from gaps in training data, genuine ambiguity in the user's phrasing, or both simultaneously. Attributing low confidence solely to training data ignores that user language is inherently variable. Claiming the model is simply outdated or that users are being intentionally unclear are both unsupported conclusions that misrepresent how NLP confidence scoring works. |
| ES | Las puntuaciones de confianza bajas reflejan incertidumbre en la coincidencia de intenciones, lo que puede derivar de brechas en los datos de entrenamiento, ambigüedad genuina en la formulación del usuario, o ambas simultáneamente. Atribuir la baja confianza únicamente a los datos de entrenamiento ignora que el lenguaje del usuario es inherentemente variable. Afirmar que el modelo simplemente está desactualizado o que los usuarios son intencionalmente poco claros son conclusiones sin respaldo que tergiversan el funcionamiento de la puntuación de confianza en NLP. |

### 152. AISM-I · 4.8 · `42f71dd4-ef9f-4fe2-9165-f51e649a5c7e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.8: Given a described user request handled by a virtual agent, determine whether the agent should resolve it or escalate to a human, based on the request's risk and the agent's confidence.

**stem**

| | |
|---|---|
| EN | A virtual agent always escalates legal-advice requests, even at 99% confidence. A manager calls this a design flaw. What should the team do? |
| ES | Un agente virtual siempre escala las solicitudes de asesoramiento legal, incluso con un 99% de confianza. Un gerente considera esto un defecto de diseño. ¿Qué debería hacer el equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Override the rule for high-confidence turns, because 99% confidence means the agent can respond accurately to legal queries. |
| **a** ES | Anular la regla para los turnos de alta confianza, porque el 99% de confianza significa que el agente puede responder con precisión a consultas legales. |
| **b** EN | Retrain the model on legal content so the always-escalate rule becomes unnecessary over time. |
| **b** ES | Reentrenar el modelo con contenido legal para que la regla de escalamiento permanente deje de ser necesaria con el tiempo. |
| **c** EN | Replace the rule with sentiment detection to trigger escalation only when the customer appears distressed. |
| **c** ES | Reemplazar la regla con detección de sentimientos para activar el escalamiento solo cuando el cliente parezca angustiado. |
| **d** EN | Maintain the rule, because some intents are designed to always escalate due to regulatory risk, regardless of confidence. `<<KEY` |
| **d** ES | Mantener la regla, porque algunas intenciones están diseñadas para escalar siempre debido al riesgo regulatorio, independientemente de la confianza. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Certain high-risk or regulated domains are intentionally configured to always escalate, independent of confidence score. Confidence measures intent-recognition certainty, not whether the agent is authorized or safe to respond. Frequent escalation in such cases reflects sound design, not a training deficiency. Sentiment detection addresses emotional state, not legal or regulatory risk. |
| ES | Ciertos dominios de alto riesgo o regulados están configurados intencionalmente para escalar siempre, independientemente de la puntuación de confianza. La confianza mide la certeza del reconocimiento de intención, no si el agente está autorizado o es seguro para responder. El escalamiento frecuente en tales casos refleja un diseño sólido, no una deficiencia de entrenamiento. La detección de sentimientos aborda el estado emocional, no el riesgo legal o regulatorio. |

### 153. AISM-I · 4.8 · `fafca28c-cd10-4d8a-bf13-e50d79d42a21`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.8: Given a described user request handled by a virtual agent, determine whether the agent should resolve it or escalate to a human, based on the request's risk and the agent's confidence.

**stem**

| | |
|---|---|
| EN | A virtual agent's confidence threshold was set at deployment and never reviewed. Call volume has doubled and a high-risk product line was added. What should the team do first? |
| ES | El umbral de confianza de un agente virtual se estableció en el momento del despliegue y nunca se revisó. El volumen de llamadas se ha duplicado y se agregó una línea de productos de alto riesgo. ¿Qué debería hacer el equipo primero? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Keep the existing threshold, because consistency across deployments prevents new configuration errors in production. |
| **a** ES | Mantener el umbral existente, porque la coherencia entre despliegues previene nuevos errores de configuración en producción. |
| **b** EN | Lower the threshold uniformly to reduce escalations from increased volume, without reviewing intent risk levels. |
| **b** ES | Reducir el umbral de manera uniforme para disminuir los escalamientos derivados del mayor volumen, sin revisar los niveles de riesgo de las intenciones. |
| **c** EN | Retrain the model on new product data so confidence scores rise and the original threshold stays valid. |
| **c** ES | Reentrenar el modelo con datos del nuevo producto para que las puntuaciones de confianza aumenten y el umbral original siga siendo válido. |
| **d** EN | Review and adjust thresholds and escalation boundaries using current metrics and the updated risk profile. `<<KEY` |
| **d** ES | Revisar y ajustar los umbrales y los límites de escalamiento utilizando las métricas actuales y el perfil de riesgo actualizado. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Escalation boundaries and confidence thresholds must be continuously monitored and adjusted as business conditions, product risk, and operational metrics change—not fixed at deployment. Adding a high-risk product line directly signals a need to review whether existing boundaries adequately protect customers. Uniform lowering without risk analysis could allow the agent to handle requests it should escalate. Retraining may help over time but does not address the immediate boundary review need. |
| ES | Los límites de escalamiento y los umbrales de confianza deben monitorearse y ajustarse continuamente a medida que cambian las condiciones del negocio, el riesgo del producto y las métricas operativas, no fijarse en el momento del despliegue. Agregar una línea de productos de alto riesgo señala directamente la necesidad de revisar si los límites existentes protegen adecuadamente a los clientes. Reducir uniformemente sin un análisis de riesgo podría permitir que el agente gestione solicitudes que debería escalar. El reentrenamiento puede ayudar con el tiempo, pero no aborda la necesidad inmediata de revisar los límites. |

### 154. AISM-I · 4.9 · `a812e931-f5d0-4095-93f7-b38ebe43fb28`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.9: Explain intelligent automation and how it differs from traditional scripted automation.

**stem**

| | |
|---|---|
| EN | A service desk tool routes tickets by matching exact keyword strings to predefined categories. Which characteristic best explains why this is scripted, not intelligent, automation? |
| ES | Una herramienta de mesa de servicio enruta tickets haciendo coincidir cadenas de palabras clave exactas con categorías predefinidas. ¿Qué característica explica mejor por qué esto es automatización con scripts y no automatización inteligente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It uses if-then-else branching, which defines intelligent rather than scripted automation. |
| **a** ES | Utiliza ramificación if-then-else, lo cual define la automatización inteligente en lugar de la automatización con scripts. |
| **b** EN | It lacks enough rules; adding more keywords would make it intelligent automation. |
| **b** ES | Carece de suficientes reglas; agregar más palabras clave la convertiría en automatización inteligente. |
| **c** EN | It relies on fixed rules and cannot adapt when ticket wording varies outside the keyword list. `<<KEY` |
| **c** ES | Se basa en reglas fijas y no puede adaptarse cuando la redacción del ticket varía fuera de la lista de palabras clave. `<<KEY` |
| **d** EN | It processes tickets too slowly; intelligent automation requires faster execution. |
| **d** ES | Procesa los tickets demasiado lentamente; la automatización inteligente requiere una ejecución más rápida. |

**explanation**

| | |
|---|---|
| EN | Scripted automation is deterministic: it only handles inputs matching its fixed rules and breaks down when variation occurs. Intelligent automation uses AI models that handle novel or ambiguous inputs. Faster execution speed does not change the category, and branching logic alone does not constitute intelligence. |
| ES | La automatización con scripts es determinista: solo maneja entradas que coinciden con sus reglas fijas y falla cuando ocurre variación. La automatización inteligente utiliza modelos de IA que manejan entradas novedosas o ambiguas. La velocidad de ejecución más rápida no cambia la categoría, y la lógica de ramificación por sí sola no constituye inteligencia. |

### 155. AISM-I · 4.9 · `d95bdc13-5828-4719-a38b-806e1bb61b54`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.9: Explain intelligent automation and how it differs from traditional scripted automation.

**stem**

| | |
|---|---|
| EN | After deployment, an intelligent automation system begins mis-routing requests due to a shift in how customers describe their issues. What does this scenario reveal? |
| ES | Después del despliegue, un sistema de automatización inteligente comienza a enrutar incorrectamente las solicitudes debido a un cambio en la forma en que los clientes describen sus problemas. ¿Qué revela este escenario? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Intelligent automation eliminates human oversight because the AI component self-corrects all errors. |
| **a** ES | La automatización inteligente elimina la supervisión humana porque el componente de IA corrige automáticamente todos los errores. |
| **b** EN | AI decision logic is fixed after deployment and requires full redevelopment to change. |
| **b** ES | La lógica de decisión de la IA queda fija después del despliegue y requiere un rediseño completo para cambiarla. |
| **c** EN | Human oversight remains necessary because AI models can drift and may need monitoring and retraining. `<<KEY` |
| **c** ES | La supervisión humana sigue siendo necesaria porque los modelos de IA pueden derivar y pueden requerir monitoreo y reentrenamiento. `<<KEY` |
| **d** EN | Intelligent automation is unsuitable for variable inputs and should be replaced with scripted automation. |
| **d** ES | La automatización inteligente no es adecuada para entradas variables y debe reemplazarse por automatización con scripts. |

**explanation**

| | |
|---|---|
| EN | Intelligent automation does not eliminate the need for human oversight. AI models can experience performance drift when real-world patterns shift, requiring monitoring and periodic retraining. This is a known characteristic of model-assisted automation, not a reason to abandon it or revert to scripted approaches. Decision logic is not permanently fixed and does not require full redevelopment to update. |
| ES | La automatización inteligente no elimina la necesidad de supervisión humana. Los modelos de IA pueden experimentar deriva en su rendimiento cuando los patrones del mundo real cambian, lo que requiere monitoreo y reentrenamiento periódico. Esta es una característica conocida de la automatización asistida por modelos, no una razón para abandonarla o revertir a enfoques con scripts. La lógica de decisión no queda permanentemente fija y no requiere un rediseño completo para actualizarse. |

### 156. AISM-I · 5.1 · `1e2968a2-465f-4971-8749-523103b7e0ca`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.1: Explain why AI in service management needs governance beyond traditional service controls.

**stem**

| | |
|---|---|
| EN | Which statement correctly distinguishes AI service governance from traditional service controls in terms of what each is designed to manage? |
| ES | ¿Cuál enunciado distingue correctamente la gobernanza de servicios de IA de los controles de servicio tradicionales en términos de lo que cada uno está diseñado para gestionar? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Traditional controls manage defined human-executed processes; AI governance also addresses autonomous, opaque decisions those controls cannot inspect. `<<KEY` |
| **a** ES | Los controles tradicionales gestionan procesos definidos ejecutados por humanos; la gobernanza de IA también aborda decisiones autónomas y opacas que esos controles no pueden inspeccionar. `<<KEY` |
| **b** EN | Traditional controls manage change and incident workflows; AI governance extends them by adding mandatory vendor architecture review as an approval gate. |
| **b** ES | Los controles tradicionales gestionan flujos de trabajo de cambios e incidentes; la gobernanza de IA los extiende añadiendo la revisión obligatoria de la arquitectura del proveedor como puerta de aprobación. |
| **c** EN | Traditional controls manage human actions; AI governance covers model construction only, so deployed models fall under existing service controls unchanged. |
| **c** ES | Los controles tradicionales gestionan acciones humanas; la gobernanza de IA cubre solo la construcción del modelo, por lo que los modelos desplegados quedan bajo los controles de servicio existentes sin cambios. |
| **d** EN | Traditional controls manage process execution; AI governance manages only the data privacy obligations arising from AI processing personal information. |
| **d** ES | Los controles tradicionales gestionan la ejecución de procesos; la gobernanza de IA gestiona únicamente las obligaciones de privacidad de datos derivadas del procesamiento de información personal por parte de la IA. |

**explanation**

| | |
|---|---|
| EN | Traditional controls assume inspectable, bounded, human-paced actions. AI introduces autonomous operation, massive scale, and opaque reasoning that those controls were never designed to handle. AI governance must therefore cover explainability, drift monitoring, and scale-proportionate oversight — dimensions outside change and incident management. Limiting AI governance to data privacy, vendor reviews, or model construction each addresses only a narrow slice of the full governance gap. |
| ES | Los controles tradicionales asumen acciones inspeccionables, acotadas y al ritmo humano. La IA introduce operación autónoma, escala masiva y razonamiento opaco que esos controles nunca fueron diseñados para manejar. La gobernanza de IA debe por tanto cubrir la explicabilidad, el monitoreo de deriva y la supervisión proporcional a la escala: dimensiones fuera de la gestión de cambios e incidentes. Limitar la gobernanza de IA a la privacidad de datos, las revisiones de proveedores o la construcción del modelo aborda solo una parte limitada de la brecha de gobernanza completa. |

### 157. AISM-I · 5.2 · `a45bbd9f-22fe-4471-9245-4db98f33adb8`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.2: Explain accountability when an AI agent takes a service action - who remains answerable.

**stem**

| | |
|---|---|
| EN | An organization conducts no oversight after deploying an AI agent, reasoning that initial deployment approval is sufficient accountability. What is the flaw in this reasoning? |
| ES | Una organización no realiza ninguna supervisión después de desplegar un agente de IA, argumentando que la aprobación inicial del despliegue es suficiente para garantizar la responsabilidad. ¿Cuál es el error en este razonamiento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The flaw is procedural: approval must be renewed annually rather than granted as a single authorization. |
| **a** ES | El error es procedimental: la aprobación debe renovarse anualmente en lugar de otorgarse como una autorización única. |
| **b** EN | Accountability requires ongoing oversight, because one-time approval does not cover the agent's evolving actions. `<<KEY` |
| **b** ES | La responsabilidad requiere supervisión continua, porque una aprobación única no cubre las acciones cambiantes del agente. `<<KEY` |
| **c** EN | Deployment approval is only valid when the agent's scope is narrow and decisions are low-risk. |
| **c** ES | La aprobación del despliegue solo es válida cuando el alcance del agente es reducido y las decisiones son de bajo riesgo. |
| **d** EN | Deployment approval transfers accountability to the vendor once the agent is live in production. |
| **d** ES | La aprobación del despliegue transfiere la responsabilidad al proveedor una vez que el agente está en producción. |

**explanation**

| | |
|---|---|
| EN | Meaningful human control and ongoing accountability require continuous oversight, not a one-time sign-off. An agent's behavior can drift, encounter novel situations, or produce unintended effects that only active monitoring can catch; initial deployment approval does not substitute for this. |
| ES | El control humano significativo y la responsabilidad continua requieren supervisión constante, no una aprobación única. El comportamiento de un agente puede desviarse, enfrentarse a situaciones nuevas o producir efectos no deseados que solo un monitoreo activo puede detectar; la aprobación inicial del despliegue no sustituye esto. |

### 158. AISM-I · 5.3 · `fb3ae4ab-6d7d-4fc1-925c-47a9be4d85be`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.3: Given an AIOps or predictive pipeline, determine appropriate data-quality and provenance controls.

**stem**

| | |
|---|---|
| EN | A predictive maintenance model validated at 94% accuracy sees a sharp drop six months after deployment. Sensors were recently replaced with a new type using a different calibration range. What control should be applied? |
| ES | Un modelo de mantenimiento predictivo validado con un 94% de precisión experimenta una caída brusca seis meses después de su implementación. Recientemente se reemplazaron los sensores con un nuevo tipo que usa un rango de calibración diferente. ¿Qué control debería aplicarse? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Increase retraining frequency so the model continuously adapts to the new sensor output without upstream correction. |
| **a** ES | Aumentar la frecuencia de reentrenamiento para que el modelo se adapte continuamente a la nueva salida del sensor sin corrección en el origen. |
| **b** EN | Schedule standard periodic retraining, treating the accuracy drop as normal drift unrelated to the sensor change. |
| **b** ES | Programar un reentrenamiento periódico estándar, tratando la caída de precisión como una deriva normal no relacionada con el cambio de sensor. |
| **c** EN | Validate and recalibrate the new sensor data against the expected range before it feeds the live prediction pipeline. `<<KEY` |
| **c** ES | Validar y recalibrar los datos del nuevo sensor contra el rango esperado antes de que alimenten el pipeline de predicción en producción. `<<KEY` |
| **d** EN | Rely on the validated accuracy score, since a model that passed test-set evaluation is unaffected by post-deployment data changes. |
| **d** ES | Confiar en la puntuación de precisión validada, ya que un modelo que superó la evaluación del conjunto de prueba no se ve afectado por cambios de datos posteriores a la implementación. |

**explanation**

| | |
|---|---|
| EN | A model validated on correctly calibrated data degrades when fed out-of-range inputs from a new sensor type; the defect must be corrected at the source. Treating the drop as ordinary drift ignores the known root cause. Relying on the historical accuracy score ignores that the data context has changed. Retraining on miscalibrated data propagates the defect rather than fixing it. |
| ES | Un modelo validado con datos correctamente calibrados se degrada cuando recibe entradas fuera de rango de un nuevo tipo de sensor; el defecto debe corregirse en el origen. Tratar la caída como una deriva ordinaria ignora la causa raíz conocida. Confiar en la puntuación histórica de precisión ignora que el contexto de los datos ha cambiado. Reentrenar con datos mal calibrados propaga el defecto en lugar de corregirlo. |

### 159. AISM-I · 5.4 · `825b2f54-db58-4962-bc5f-700a15da3a94`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.4: Explain transparency and disclosure when users interact with AI in a service context.

**stem**

| | |
|---|---|
| EN | A virtual agent identifies itself as AI at the start of a chat. Forty minutes later the user asks, 'Am I talking to a person or a machine?' The agent changes the subject without answering. Which principle does this violate? |
| ES | Un agente virtual se identifica como IA al inicio de un chat. Cuarenta minutos después, el usuario pregunta: '¿Estoy hablando con una persona o con una máquina?' El agente cambia el tema sin responder. ¿Qué principio viola esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Intellectual-property protection: deflecting identity questions shields proprietary AI design details. |
| **a** ES | Protección de propiedad intelectual: evadir preguntas de identidad protege los detalles de diseño propietario de la IA. |
| **b** EN | Session-initiation disclosure only: the agent already disclosed at the start and need not repeat it. |
| **b** ES | Divulgación solo al inicio de sesión: el agente ya se identificó al comienzo y no necesita repetirlo. |
| **c** EN | Capability parity: a highly capable AI that deflects identity questions performs equivalently to a human. |
| **c** ES | Paridad de capacidades: una IA altamente capaz que evade preguntas de identidad se desempeña de manera equivalente a un humano. |
| **d** EN | Ongoing transparency: agents must answer sincere mid-conversation identity questions honestly. `<<KEY` |
| **d** ES | Transparencia continua: los agentes deben responder honestamente las preguntas sinceras de identidad en cualquier momento de la conversación. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Honest disclosure requires a virtual agent to answer a direct identity question truthfully at any point in the conversation. Deflecting without lying is still deceptive and violates transparency obligations. Initial disclosure at session start does not eliminate the duty to respond honestly when a user sincerely asks mid-conversation. Intellectual-property interests and capability comparisons do not override this obligation. |
| ES | La divulgación honesta requiere que un agente virtual responda con veracidad una pregunta directa sobre su identidad en cualquier momento de la conversación. Evadir sin mentir sigue siendo engañoso y viola las obligaciones de transparencia. La divulgación inicial al comienzo de la sesión no elimina el deber de responder honestamente cuando un usuario pregunta sinceramente en medio de la conversación. Los intereses de propiedad intelectual y las comparaciones de capacidades no anulan esta obligación. |

### 160. AISM-I · 5.4 · `b39c0d16-330c-4318-aa79-625d3814bc85`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.4: Explain transparency and disclosure when users interact with AI in a service context.

**stem**

| | |
|---|---|
| EN | A chatbot handles billing inquiries via text. The service team argues that users can tell it is automated from the interface, so no explicit AI disclosure is needed. Why is this reasoning flawed? |
| ES | Un chatbot maneja consultas de facturación por texto. El equipo de servicio argumenta que los usuarios pueden identificar que es automatizado desde la interfaz, por lo que no se necesita una divulgación explícita de IA. ¿Por qué este razonamiento es incorrecto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Disclosure applies only to voice systems; text interactions fall under different consumer-protection regulations. |
| **a** ES | La divulgación aplica solo a sistemas de voz; las interacciones por texto están sujetas a diferentes regulaciones de protección al consumidor. |
| **b** EN | General awareness that companies use chatbots provides sufficient notice; per-interaction disclosure adds nothing. |
| **b** ES | El conocimiento general de que las empresas usan chatbots proporciona aviso suficiente; la divulgación por interacción no agrega nada. |
| **c** EN | Billing is low-stakes, so disclosure standards apply only to medical or financial AI decisions. |
| **c** ES | La facturación es de bajo riesgo, por lo que los estándares de divulgación solo aplican a decisiones de IA médicas o financieras. |
| **d** EN | Disclosure obligations apply to all channels; users cannot reliably infer AI involvement from interface design alone. `<<KEY` |
| **d** ES | Las obligaciones de divulgación aplican a todos los canales; los usuarios no pueden inferir de manera confiable la participación de IA solo por el diseño de la interfaz. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Disclosure obligations apply to all virtual agents regardless of channel; users cannot reliably infer AI involvement from interface cues alone. The claim that text channels are exempt conflates channel type with disclosure duty. The claim that billing is low-stakes wrongly limits transparency to high-stakes domains only. General cultural awareness does not substitute for clear, per-interaction disclosure. |
| ES | Las obligaciones de divulgación aplican a todos los agentes virtuales independientemente del canal; los usuarios no pueden inferir de manera confiable la participación de IA solo a partir de indicios de la interfaz. La afirmación de que los canales de texto están exentos confunde el tipo de canal con el deber de divulgación. La afirmación de que la facturación es de bajo riesgo limita incorrectamente la transparencia solo a dominios de alto riesgo. La conciencia cultural general no sustituye una divulgación clara por interacción. |

### 161. AISM-I · 5.5 · `16d3e0c9-97a1-4bae-993e-eb9a60682a93`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.5: Given a described service, determine the over-automation risks and where a human check must remain.

**stem**

| | |
|---|---|
| EN | After three years of AI-assisted loan approvals, analysts struggle significantly when asked to manually evaluate a complex application during a system outage. What does this indicate? |
| ES | Después de tres años de aprobaciones de préstamos asistidas por IA, los analistas tienen dificultades significativas cuando se les pide evaluar manualmente una solicitud compleja durante una interrupción del sistema. ¿Qué indica esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Model dependency, because analysts need retraining on the AI's logic rather than on manual credit evaluation methods. |
| **a** ES | Dependencia del modelo, porque los analistas necesitan reentrenamiento en la lógica de la IA en lugar de en métodos manuales de evaluación crediticia. |
| **b** EN | Automation bias, because analysts who trusted AI outputs now distrust their own manual assessments under pressure. |
| **b** ES | Sesgo de automatización, porque los analistas que confiaban en los resultados de la IA ahora desconfían de sus propias evaluaciones manuales bajo presión. |
| **c** EN | Normal performance variance, because prior training is sufficient to restore manual skills after any period of disuse. |
| **c** ES | Variación normal del desempeño, porque la capacitación previa es suficiente para restaurar las habilidades manuales después de cualquier período de desuso. |
| **d** EN | Deskilling, because years without practicing independent credit analysis has degraded their manual evaluation capability. `<<KEY` |
| **d** ES | Pérdida de habilidades (deskilling), porque años sin practicar el análisis crediticio independiente han degradado su capacidad de evaluación manual. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The analysts' difficulty demonstrates deskilling: skills decay when not practiced, even in workers fully trained before automation was introduced. The belief that prior training protects against skill loss is directly refuted here. This is a capability degradation issue, not automation bias, which would manifest as over-trust in AI output rather than inability to work without it. Retraining on the AI's logic would deepen dependency rather than restore independent manual capability. |
| ES | La dificultad de los analistas demuestra pérdida de habilidades (deskilling): las habilidades se deterioran cuando no se practican, incluso en trabajadores completamente capacitados antes de que se introdujera la automatización. La creencia de que la capacitación previa protege contra la pérdida de habilidades queda directamente refutada aquí. Este es un problema de degradación de capacidades, no de sesgo de automatización, que se manifestaría como exceso de confianza en el resultado de la IA en lugar de incapacidad para trabajar sin ella. Reentrenar a los analistas en la lógica de la IA profundizaría la dependencia en lugar de restaurar la capacidad manual independiente. |

### 162. AISM-I · 5.6 · `80c8d447-1b27-4afc-a176-eda0cff10551`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.6: Explain how AI service governance connects to the organization's broader AI governance and risk management.

**stem**

| | |
|---|---|
| EN | A service owner adopts the enterprise AI policy verbatim as their service-level governance without tailoring it. Which risk does this most directly create? |
| ES | Un responsable de servicio adopta la política empresarial de IA de forma literal como su gobernanza a nivel de servicio sin adaptarla. ¿Qué riesgo crea esto de manera más directa? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The service becomes over-governed because enterprise policy imposes controls stricter than the service's actual risk profile requires. |
| **a** ES | El servicio queda sobre-gobernado porque la política empresarial impone controles más estrictos de los que requiere el perfil de riesgo real del servicio. |
| **b** EN | Risks specific to the service's data sources, user population, or use-case context go unaddressed by untailored policy language. `<<KEY` |
| **b** ES | Los riesgos específicos de las fuentes de datos, la población de usuarios o el contexto del caso de uso del servicio quedan sin abordar por el lenguaje de política no adaptado. `<<KEY` |
| **c** EN | Audit findings cannot be attributed to the service owner because the policy originated with the compliance team, not the service owner. |
| **c** ES | Los hallazgos de auditoría no pueden atribuirse al responsable del servicio porque la política se originó en el equipo de cumplimiento, no en el responsable del servicio. |
| **d** EN | Enterprise policy loses authority because verbatim reuse signals the service owner did not participate in governance design. |
| **d** ES | La política empresarial pierde autoridad porque la reutilización literal indica que el responsable del servicio no participó en el diseño de la gobernanza. |

**explanation**

| | |
|---|---|
| EN | Enterprise policy sets organizational direction but cannot anticipate every service-specific context. Adopting it verbatim without tailoring leaves risks unique to that service's data, users, or use case unaddressed. Loss of policy authority, over-governance, and audit attribution issues are not the primary risks created by verbatim adoption. |
| ES | La política empresarial establece la dirección organizacional, pero no puede anticipar cada contexto específico del servicio. Adoptarla de forma literal sin adaptación deja sin abordar los riesgos únicos de los datos, usuarios o caso de uso de ese servicio. La pérdida de autoridad de la política, la sobre-gobernanza y los problemas de atribución en auditorías no son los riesgos principales creados por la adopción literal. |

### 163. AISM-I · 5.7 · `ea6966b4-59a6-47f6-874a-049f1d1143c9`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 5.7: Given a described AI-driven service, determine what to monitor to detect drift, degradation, and harm.

**stem**

| | |
|---|---|
| EN | An AI loan-recommendation service has stable uptime and low latency, but analysts notice one demographic is increasingly receiving borderline-case rejections. Which signal should the monitoring team prioritize to detect this emerging harm? |
| ES | Un servicio de recomendación de préstamos basado en IA tiene un tiempo de actividad estable y baja latencia, pero los analistas notan que un grupo demográfico está recibiendo cada vez más rechazos en casos límite. ¿Qué señal debería priorizar el equipo de monitoreo para detectar este daño emergente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Outcome disparity rate across demographic segments, because differential output patterns surface harm before individual complaints are filed. `<<KEY` |
| **a** ES | La tasa de disparidad en los resultados entre segmentos demográficos, porque los patrones diferenciales en los resultados revelan el daño antes de que se presenten quejas individuales. `<<KEY` |
| **b** EN | Escalation rate to human reviewers, because rising escalation volume is the earliest available signal of systematic model degradation. |
| **b** ES | La tasa de escalación a revisores humanos, porque el aumento en el volumen de escalaciones es la señal más temprana disponible de degradación sistemática del modelo. |
| **c** EN | Server error rate, because infrastructure faults most commonly cause skewed output distributions across user segments. |
| **c** ES | La tasa de errores del servidor, porque las fallas de infraestructura son la causa más común de distribuciones de resultados sesgadas entre segmentos de usuarios. |
| **d** EN | Model confidence score distribution, because low-confidence outputs flag the specific cases where demographic bias is most likely to occur. |
| **d** ES | La distribución de puntuaciones de confianza del modelo, porque los resultados de baja confianza identifican los casos específicos donde es más probable que ocurra sesgo demográfico. |

**explanation**

| | |
|---|---|
| EN | Outcome disparity rate across demographic segments is the correct priority because differential patterns in outputs can reveal discriminatory trends before any individual harm is confirmed or reported, making it a leading harm indicator. Monitoring server error rate conflates infrastructure health with output fairness and would not surface demographic skew. Tracking model confidence scores is a genuine misconception—confidence scores reflect the model's internal probability estimates, not whether outputs are equitable across groups. Escalation rate can signal degradation but would not isolate the demographic pattern identified here without further disaggregation. |
| ES | La tasa de disparidad en los resultados entre segmentos demográficos es la prioridad correcta porque los patrones diferenciales en los resultados pueden revelar tendencias discriminatorias antes de que se confirme o reporte algún daño individual, lo que la convierte en un indicador adelantado de daño. Monitorear la tasa de errores del servidor confunde la salud de la infraestructura con la equidad en los resultados y no detectaría el sesgo demográfico. Rastrear las puntuaciones de confianza del modelo es un error conceptual genuino: dichas puntuaciones reflejan las estimaciones de probabilidad internas del modelo, no si los resultados son equitativos entre grupos. La tasa de escalación puede señalar degradación, pero no aislaría el patrón demográfico identificado aquí sin una desagregación adicional. |

### 164. AISM-I · 5.9 · `8d796ccd-c3da-452b-bdf8-1ca60ee36647`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.9: Given an AI service action that caused harm, determine an appropriate escalation and incident path.

**stem**

| | |
|---|---|
| EN | Regulators require notification of serious AI incidents within 72 hours of discovery. An AI fraud-detection system has blocked thousands of legitimate transactions. The provider's legal team wants to complete its full internal review first. What should the incident manager do? |
| ES | Los reguladores exigen la notificación de incidentes graves de IA dentro de las 72 horas posteriores a su descubrimiento. Un sistema de detección de fraude con IA ha bloqueado miles de transacciones legítimas. El equipo legal del proveedor quiere completar primero su revisión interna completa. ¿Qué debe hacer el gestor del incidente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Notify regulators within 72 hours using available information; AI serious-incident timelines are not contingent on investigation completion. `<<KEY` |
| **a** ES | Notificar a los reguladores dentro de las 72 horas usando la información disponible; los plazos de incidentes graves de IA no están condicionados a la finalización de la investigación. `<<KEY` |
| **b** EN | Defer notification until the internal review concludes; incomplete information creates greater legal risk than a late report. |
| **b** ES | Diferir la notificación hasta que concluya la revisión interna; la información incompleta genera mayor riesgo legal que un reporte tardío. |
| **c** EN | Treat the blocked transactions as a data breach and follow data-protection notification rules only. |
| **c** ES | Tratar las transacciones bloqueadas como una brecha de datos y seguir únicamente las reglas de notificación de protección de datos. |
| **d** EN | Apply conventional software-outage severity criteria; AI incidents share identical reporting timelines under existing frameworks. |
| **d** ES | Aplicar los criterios convencionales de gravedad de interrupciones de software; los incidentes de IA comparten plazos de reporte idénticos bajo los marcos existentes. |

**explanation**

| | |
|---|---|
| EN | Serious AI incident reporting requires timely notification within mandated windows using information available at the time; deferral until investigations are complete is not permitted. AI incident reporting timelines are distinct from both conventional software severity criteria and data-breach-only frameworks. The incident manager must act within the regulatory deadline regardless of whether the internal review is finished. |
| ES | El reporte de incidentes graves de IA requiere notificación oportuna dentro de los plazos establecidos, usando la información disponible en ese momento; el diferimiento hasta que las investigaciones estén completas no está permitido. Los plazos de reporte de incidentes de IA son distintos tanto de los criterios convencionales de gravedad de software como de los marcos exclusivos de brechas de datos. El gestor del incidente debe actuar dentro del plazo regulatorio independientemente de si la revisión interna ha concluido. |

### 165. AISM-I · 6.1 · `48f4135d-4396-44cf-acee-f48ddd4fa20c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.1: Explain service experience - what it is and why it matters beyond whether a service technically works.

**stem**

| | |
|---|---|
| EN | An IT service manager argues that tracking user satisfaction scores is redundant because technical KPIs already capture everything that matters. Which concept most directly refutes this argument? |
| ES | Un gerente de servicios de TI argumenta que hacer un seguimiento de las puntuaciones de satisfacción del usuario es redundante porque los KPI técnicos ya capturan todo lo que importa. ¿Qué concepto refuta más directamente este argumento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Satisfaction surveys capture the same data as availability metrics but with a longer lag, making them less timely, not redundant. |
| **a** ES | Las encuestas de satisfacción capturan los mismos datos que las métricas de disponibilidad, pero con un retraso mayor, lo que las hace menos oportunas, no redundantes. |
| **b** EN | Satisfaction scores reveal cost-to-outcome ratios that KPIs omit, adding financial rather than experiential information. |
| **b** ES | Las puntuaciones de satisfacción revelan relaciones costo-resultado que los KPI omiten, añadiendo información financiera en lugar de experiencial. |
| **c** EN | Technical KPIs measure system behaviour objectively; perceived value requires direct measurement of user experience. `<<KEY` |
| **c** ES | Los KPI técnicos miden el comportamiento del sistema de forma objetiva; el valor percibido requiere la medición directa de la experiencia del usuario. `<<KEY` |
| **d** EN | Satisfaction scores are a marketing instrument for brand perception, separate from service management accountability. |
| **d** ES | Las puntuaciones de satisfacción son un instrumento de marketing para la percepción de marca, separado de la responsabilidad de la gestión de servicios. |

**explanation**

| | |
|---|---|
| EN | Technical KPIs measure objective system behaviour and cannot capture how users perceive or feel about a service. Because perceived value depends on experience, and experience must be measured directly, user satisfaction data provides information that technical KPIs cannot replicate. The two measurement types are complementary, not redundant. |
| ES | Los KPI técnicos miden el comportamiento objetivo del sistema y no pueden capturar cómo los usuarios perciben o sienten un servicio. Dado que el valor percibido depende de la experiencia, y la experiencia debe medirse directamente, los datos de satisfacción del usuario proporcionan información que los KPI técnicos no pueden replicar. Los dos tipos de medición son complementarios, no redundantes. |

### 166. AISM-I · 6.2 · `7cd895c6-3cba-4117-a32c-cb77e2b4c688`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.2: Explain experience-focused measurement - measuring the outcome and satisfaction a user actually gets, not only technical service levels.

**stem**

| | |
|---|---|
| EN | An IT service manager wants to know whether users of an HR self-service portal are actually achieving their goals. Which metric most directly measures that outcome? |
| ES | Un gerente de servicios de TI quiere saber si los usuarios de un portal de autoservicio de Recursos Humanos están alcanzando realmente sus objetivos. ¿Qué métrica mide más directamente ese resultado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Monthly CSAT score, because it captures whether users felt they achieved what they came to do. |
| **a** ES | La puntuación mensual de CSAT, porque captura si los usuarios sintieron que lograron lo que vinieron a hacer. |
| **b** EN | Average portal response time, because slow pages prevent task completion and therefore proxy the outcome. |
| **b** ES | El tiempo de respuesta promedio del portal, porque las páginas lentas impiden la finalización de tareas y, por lo tanto, son un indicador del resultado. |
| **c** EN | Percentage of sessions where users completed their intended HR transaction without contacting the service desk. `<<KEY` |
| **c** ES | El porcentaje de sesiones en las que los usuarios completaron su transacción de RR. HH. prevista sin contactar al servicio de asistencia. `<<KEY` |
| **d** EN | Ticket resolution time for portal incidents, because closing tickets within SLA confirms users got what they needed. |
| **d** ES | El tiempo de resolución de tickets por incidentes del portal, porque cerrar tickets dentro del SLA confirma que los usuarios obtuvieron lo que necesitaban. |

**explanation**

| | |
|---|---|
| EN | Task completion rate—the proportion of sessions where users finished their intended transaction—directly measures whether the user reached their outcome, which is the defining characteristic of an outcome-based metric. Response time and ticket resolution time measure system or process performance, not goal attainment. CSAT captures satisfaction sentiment but not whether the specific outcome was achieved. |
| ES | La tasa de finalización de tareas, es decir, la proporción de sesiones en las que los usuarios completaron su transacción prevista, mide directamente si el usuario alcanzó su resultado, lo cual es la característica definitoria de una métrica basada en resultados. El tiempo de respuesta y el tiempo de resolución de tickets miden el rendimiento del sistema o del proceso, no el logro del objetivo. El CSAT captura el sentimiento de satisfacción, pero no si se alcanzó el resultado específico. |

### 167. AISM-I · 6.3 · `2df888f2-3314-426d-91ee-36aaa40c37f2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.3: Given a described service situation, determine an action that would improve the user's experience.

**stem**

| | |
|---|---|
| EN | A financial firm's AI document-review tool requires analysts to re-enter credentials every 15 minutes. Analysts report this breaks concentration and slows complex reviews. What action most directly improves their experience? |
| ES | La herramienta de revisión de documentos con IA de una firma financiera requiere que los analistas vuelvan a ingresar sus credenciales cada 15 minutos. Los analistas reportan que esto interrumpe su concentración y ralentiza las revisiones complejas. ¿Qué acción mejora más directamente su experiencia? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Redesign the credential prompt's visual layout so it appears less intrusive when it does appear. |
| **a** ES | Rediseñar el diseño visual del aviso de credenciales para que parezca menos intrusivo cuando aparece. |
| **b** EN | Extend the session timeout to match typical review task length, eliminating mid-task interruptions. `<<KEY` |
| **b** ES | Extender el tiempo de expiración de sesión para que coincida con la duración típica de la tarea de revisión, eliminando las interrupciones a mitad de tarea. `<<KEY` |
| **c** EN | Collect server-side session data to confirm how often re-authentication occurs before acting. |
| **c** ES | Recopilar datos de sesión del lado del servidor para confirmar con qué frecuencia ocurre la reautenticación antes de actuar. |
| **d** EN | Add a single-sign-on dashboard widget so analysts re-authenticate from a central location. |
| **d** ES | Agregar un widget de panel de inicio de sesión único para que los analistas se reautentiquen desde una ubicación central. |

**explanation**

| | |
|---|---|
| EN | The friction is the 15-minute timeout rule that interrupts cognitive flow. Extending the timeout to task length directly removes the interruption. Restyling the prompt is a front-end change that does not eliminate the interruption itself. Analysts have already reported the problem, so collecting more server data delays a known fix. A dashboard widget still requires re-authentication; it relocates rather than removes the friction. |
| ES | La fricción es la regla de expiración de sesión de 15 minutos que interrumpe el flujo cognitivo. Extender el tiempo de expiración a la duración de la tarea elimina directamente la interrupción. Cambiar el estilo del aviso es un cambio de front-end que no elimina la interrupción en sí. Los analistas ya han reportado el problema, por lo que recopilar más datos del servidor retrasa una solución conocida. Un widget de panel aún requiere reautenticación; reubica la fricción en lugar de eliminarla. |

### 168. AISM-I · 6.4 · `19461380-875d-4d0f-9bce-ae33f9011416`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.4: Explain trust and adoption as prerequisites for AI-service value - why users must *appropriately* trust and actually adopt an AI service for value to be co-created.

**stem**

| | |
|---|---|
| EN | An organization significantly improves its AI model's accuracy but sees no change in how appropriately users rely on it. What best explains this outcome? |
| ES | Una organización mejora significativamente la precisión de su modelo de IA pero no observa ningún cambio en la forma en que los usuarios dependen apropiadamente de él. ¿Qué explica mejor este resultado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Reliance patterns are fixed after initial adoption, so accuracy improvements only affect new users. |
| **a** ES | Los patrones de dependencia se fijan después de la adopción inicial, por lo que las mejoras de precisión solo afectan a los nuevos usuarios. |
| **b** EN | Calibration also depends on transparency; accuracy gains alone do not inform users where reliance is now warranted. `<<KEY` |
| **b** ES | La calibración también depende de la transparencia; las mejoras de precisión por sí solas no informan a los usuarios dónde la dependencia ahora está justificada. `<<KEY` |
| **c** EN | Accuracy is the primary lever for trust calibration, so the improvement should have shifted reliance automatically. |
| **c** ES | La precisión es el principal factor para la calibración de la confianza, por lo que la mejora debería haber cambiado la dependencia automáticamente. |
| **d** EN | Blind trust and calibrated trust produce equivalent short-term outcomes, making reliance patterns irrelevant. |
| **d** ES | La confianza ciega y la confianza calibrada producen resultados equivalentes a corto plazo, haciendo que los patrones de dependencia sean irrelevantes. |

**explanation**

| | |
|---|---|
| EN | Model accuracy is one factor in trust calibration, but users cannot adjust reliance appropriately unless informed about what has changed and where. Transparency about updated capabilities and remaining limitations is what translates performance gains into calibrated trust and ultimately into value. Accuracy alone is an insufficient lever. |
| ES | La precisión del modelo es un factor en la calibración de la confianza, pero los usuarios no pueden ajustar su dependencia apropiadamente a menos que se les informe sobre qué ha cambiado y dónde. La transparencia sobre las capacidades actualizadas y las limitaciones restantes es lo que traduce las mejoras de desempeño en confianza calibrada y, en última instancia, en valor. La precisión por sí sola es un factor insuficiente. |

### 169. AISM-I · 6.4 · `4e03fcab-3f5d-48d4-908d-82d1e4a24d89`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.4: Explain trust and adoption as prerequisites for AI-service value - why users must *appropriately* trust and actually adopt an AI service for value to be co-created.

**stem**

| | |
|---|---|
| EN | Which statement accurately describes the relationship between user adoption and AI-service value? |
| ES | ¿Qué afirmación describe con precisión la relación entre la adopción de usuarios y el valor de un servicio de IA? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Adoption alone guarantees value co-creation because user engagement completes the service. |
| **a** ES | La adopción por sí sola garantiza la co-creación de valor porque el compromiso del usuario completa el servicio. |
| **b** EN | Value is embedded in AI outputs; adoption affects convenience but not whether value is realized. |
| **b** ES | El valor está integrado en los resultados de la IA; la adopción afecta la conveniencia pero no si el valor se realiza. |
| **c** EN | Adoption is achieved before deployment; once reached, the service sustains value without further management. |
| **c** ES | La adopción se logra antes del despliegue; una vez alcanzada, el servicio sostiene el valor sin gestión adicional. |
| **d** EN | Value co-creation requires adoption and appropriate ongoing engagement; adoption alone is not sufficient. `<<KEY` |
| **d** ES | La co-creación de valor requiere adopción y un compromiso continuo apropiado; la adopción sola no es suficiente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Adoption is necessary — a non-adopting user co-creates no value — but adoption alone does not guarantee value. The user must also engage appropriately, applying calibrated trust to the AI's outputs. Treating adoption as a one-time pre-deployment achievement ignores that trust and engagement must be continually earned. |
| ES | La adopción es necesaria —un usuario que no adopta no co-crea ningún valor— pero la adopción sola no garantiza el valor. El usuario también debe comprometerse apropiadamente, aplicando confianza calibrada a los resultados de la IA. Tratar la adopción como un logro único previo al despliegue ignora que la confianza y el compromiso deben ganarse continuamente. |

### 170. AISM-I · 6.5 · `7df0197d-8b09-4c4c-86df-648ac0103482`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.5: Given an AI service with low or miscalibrated trust, determine what would build appropriate trust and adoption.

**stem**

| | |
|---|---|
| EN | An AI support chatbot handles most queries well but fails on complex ones. Users distrust the entire service. Which design change best addresses this? |
| ES | Un chatbot de soporte con IA maneja bien la mayoría de las consultas, pero falla con las complejas. Los usuarios desconfían de todo el servicio. ¿Qué cambio de diseño aborda mejor esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Provide a technical explanation of the model architecture so users understand why failures occur. |
| **a** ES | Proporcionar una explicación técnica de la arquitectura del modelo para que los usuarios entiendan por qué ocurren los fallos. |
| **b** EN | Suppress complexity indicators so users cannot identify which query types the AI handles poorly. |
| **b** ES | Suprimir los indicadores de complejidad para que los usuarios no puedan identificar qué tipos de consultas la IA maneja mal. |
| **c** EN | Hide the escalation option to avoid signaling AI limitations to users. |
| **c** ES | Ocultar la opción de escalamiento para evitar señalar las limitaciones de la IA a los usuarios. |
| **d** EN | Make the escalation path to a human agent prominent and reliable so users know failures are safely managed. `<<KEY` |
| **d** ES | Hacer que la ruta de escalamiento a un agente humano sea prominente y confiable para que los usuarios sepan que los fallos se gestionan de forma segura. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A visible, reliable escalation path builds trust by making the AI's limits safe rather than alarming. Hiding escalation or suppressing complexity cues leaves users without recourse, and a technical model explanation addresses developer needs rather than end-user trust calibration. |
| ES | Una ruta de escalamiento visible y confiable genera confianza al hacer que los límites de la IA sean seguros en lugar de alarmantes. Ocultar el escalamiento o suprimir las señales de complejidad deja a los usuarios sin recursos, y una explicación técnica del modelo responde a las necesidades del desarrollador, no a la calibración de confianza del usuario final. |

### 171. AISM-I · 6.6 · `c699dee9-02f0-49ca-80c4-5f1e6b615513`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.6: Explain sustainable service value - the environmental, social, and economic dimensions woven into the value system.

**stem**

| | |
|---|---|
| EN | An IT service manager argues that sustainability belongs to the green team and should not affect everyday service management decisions. Which concept does this contradict? |
| ES | Un gerente de servicios de TI argumenta que la sostenibilidad pertenece al equipo verde y no debería afectar las decisiones cotidianas de gestión de servicios. ¿Qué concepto contradice esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Triple-dimension value, which limits sustainability evaluation to end users and excludes operational staff. |
| **a** ES | El valor de triple dimensión, que limita la evaluación de sostenibilidad a los usuarios finales y excluye al personal operativo. |
| **b** EN | Sustainable service delivery, which requires equal economic and environmental weighting in every operational trade-off. |
| **b** ES | La entrega sostenible de servicios, que requiere una ponderación económica y ambiental igual en cada compensación operativa. |
| **c** EN | Sustainability woven into the value system, meaning all service management decisions carry environmental and social dimensions. `<<KEY` |
| **c** ES | La sostenibilidad tejida en el sistema de valores, lo que significa que todas las decisiones de gestión de servicios tienen dimensiones ambientales y sociales. `<<KEY` |
| **d** EN | Compliance-based sustainability, which assigns accountability to the team holding the regulatory license. |
| **d** ES | La sostenibilidad basada en el cumplimiento, que asigna la responsabilidad al equipo que posee la licencia regulatoria. |

**explanation**

| | |
|---|---|
| EN | Treating sustainability as a specialist team's domain contradicts the principle that it is embedded throughout the value system. Every service management decision — not just those made by a dedicated green team — carries environmental, social, and economic implications. Limiting sustainability to compliance licensing or to equal-weighting rules each misrepresent this principle. |
| ES | Tratar la sostenibilidad como el dominio de un equipo especialista contradice el principio de que está integrada en todo el sistema de valores. Cada decisión de gestión de servicios, no solo las tomadas por un equipo verde dedicado, tiene implicaciones ambientales, sociales y económicas. Limitar la sostenibilidad a la licencia de cumplimiento o a reglas de ponderación igual, ambas representan erróneamente este principio. |

### 172. AISM-I · 6.7 · `7ee4a0d7-f588-4bad-8188-e6eca7b978f8`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.7: Explain the compute and energy footprint of AI services and why it is a service-management concern.

**stem**

| | |
|---|---|
| EN | A team replaces a large general-purpose model with a smaller task-specific one, cutting compute per request by 60%. How should this be classified from a service-management perspective? |
| ES | Un equipo reemplaza un modelo grande de propósito general por uno más pequeño específico para la tarea, reduciendo el cómputo por solicitud en un 60%. ¿Cómo debería clasificarse esto desde una perspectiva de gestión de servicios? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | An efficiency improvement that also enhances scalability and reduces the service's environmental footprint. `<<KEY` |
| **a** ES | Una mejora de eficiencia que también potencia la escalabilidad y reduce la huella ambiental del servicio. `<<KEY` |
| **b** EN | A financial decision only, because model selection affects budgets but not service-level objectives. |
| **b** ES | Una decisión únicamente financiera, porque la selección del modelo afecta los presupuestos pero no los objetivos de nivel de servicio. |
| **c** EN | A one-time optimization whose benefits are fixed at deployment and need no further review. |
| **c** ES | Una optimización puntual cuyos beneficios quedan fijos en el despliegue y no requieren revisión posterior. |
| **d** EN | A quality regression, because smaller models inherently limit the service's usefulness over time. |
| **d** ES | Una regresión de calidad, porque los modelos más pequeños limitan inherentemente la utilidad del servicio con el tiempo. |

**explanation**

| | |
|---|---|
| EN | A task-specific model that meets accuracy requirements while consuming less compute improves scalability and sustainability — both service-management concerns. Assuming smaller always means lower quality conflates model size with fitness for purpose, and treating the change as purely financial ignores its service-level implications. |
| ES | Un modelo específico para la tarea que cumple los requisitos de precisión mientras consume menos cómputo mejora la escalabilidad y la sostenibilidad, ambas preocupaciones de gestión de servicios. Asumir que más pequeño siempre significa menor calidad confunde el tamaño del modelo con su idoneidad para el propósito, y tratar el cambio como puramente financiero ignora sus implicaciones en el nivel de servicio. |

### 173. AISM-I · 6.8 · `123d1a58-18cb-4c9d-9379-4e960048cc04`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.8: Given an AI service, determine a sustainability-improving action that does not degrade service value.

**stem**

| | |
|---|---|
| EN | A support chatbot team finds 60% of prompts are near-identical. Which action reduces compute without affecting response quality? |
| ES | Un equipo de chatbot de soporte descubre que el 60% de los prompts son casi idénticos. ¿Qué acción reduce el cómputo sin afectar la calidad de las respuestas? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Switch entirely to a rule-based system, since AI inference is the sole driver of the service's carbon footprint. |
| **a** ES | Cambiar completamente a un sistema basado en reglas, ya que la inferencia de IA es el único factor que impulsa la huella de carbono del servicio. |
| **b** EN | Introduce prompt caching to reuse key-value states for repeated prompt prefixes, avoiding redundant token processing. `<<KEY` |
| **b** ES | Introducir almacenamiento en caché de prompts para reutilizar los estados clave-valor de los prefijos de prompts repetidos, evitando el procesamiento redundante de tokens. `<<KEY` |
| **c** EN | Limit the chatbot to business hours only, cutting total compute while preserving daytime service quality. |
| **c** ES | Limitar el chatbot al horario comercial únicamente, reduciendo el cómputo total mientras se preserva la calidad del servicio diurno. |
| **d** EN | Introduce response caching to store final outputs, which addresses the same inefficiency as prompt caching. |
| **d** ES | Introducir almacenamiento en caché de respuestas para guardar los resultados finales, lo cual aborda la misma ineficiencia que el almacenamiento en caché de prompts. |

**explanation**

| | |
|---|---|
| EN | Prompt caching reuses intermediate computations (key-value cache) for repeated prompt prefixes, cutting compute needed for near-identical inputs without changing the model or its outputs. This is distinct from response caching: prompt caching operates at the token-processing level for partial matches, while response caching stores final outputs only for exact query matches — they address different inefficiencies. Limiting to business hours reduces availability rather than per-request waste. Switching entirely to rule-based logic eliminates AI capability and is not equivalent to right-sizing. |
| ES | El almacenamiento en caché de prompts reutiliza cómputos intermedios (caché clave-valor) para prefijos de prompts repetidos, reduciendo el cómputo necesario para entradas casi idénticas sin cambiar el modelo ni sus resultados. Esto es distinto del almacenamiento en caché de respuestas: el almacenamiento en caché de prompts opera a nivel del procesamiento de tokens para coincidencias parciales, mientras que el almacenamiento en caché de respuestas almacena los resultados finales solo para coincidencias exactas de consultas; abordan diferentes ineficiencias. Limitar al horario comercial reduce la disponibilidad en lugar del desperdicio por solicitud. Cambiar completamente a la lógica basada en reglas elimina la capacidad de IA y no es equivalente al dimensionamiento adecuado. |

### 174. AISM-I · 6.8 · `67b4cfaf-0639-4ed0-9557-d68c543a5c01`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 6.8: Given an AI service, determine a sustainability-improving action that does not degrade service value.

**stem**

| | |
|---|---|
| EN | A legal-research AI routes all queries — simple statute lookups and complex multi-document analysis — through the same large model. What should the team implement to improve sustainability? |
| ES | Una IA de investigación legal enruta todas las consultas —búsquedas simples de estatutos y análisis complejos de múltiples documentos— a través del mismo modelo grande. ¿Qué debería implementar el equipo para mejorar la sostenibilidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Batch all queries into nightly runs, since legal research does not require real-time responses. |
| **a** ES | Agrupar todas las consultas en ejecuciones nocturnas, ya que la investigación legal no requiere respuestas en tiempo real. |
| **b** EN | Route simple lookups to a smaller model and escalate to the large model only for complex analysis. `<<KEY` |
| **b** ES | Enrutar las búsquedas simples a un modelo más pequeño y escalar al modelo grande solo para el análisis complejo. `<<KEY` |
| **c** EN | Avoid tiered routing because managing two models negates any sustainability benefit the approach might deliver. |
| **c** ES | Evitar el enrutamiento por niveles porque gestionar dos modelos anula cualquier beneficio de sostenibilidad que el enfoque pueda ofrecer. |
| **d** EN | Replace the large model with the smallest available model across all query types to maximize energy savings. |
| **d** ES | Reemplazar el modelo grande con el modelo más pequeño disponible para todos los tipos de consultas y maximizar el ahorro de energía. |

**explanation**

| | |
|---|---|
| EN | Complexity-based routing right-sizes each request dynamically: simple queries consume less compute while complex queries retain full model capability, preserving outcomes across all query types. The claim that operational complexity negates sustainability benefit is a misconception — energy savings from routing high-volume simple queries to a smaller model typically far outweigh routing-layer overhead. Nightly batching assumes legal research is never time-sensitive, which is not established. Replacing the large model entirely sacrifices quality on complex queries. |
| ES | El enrutamiento basado en complejidad dimensiona adecuadamente cada solicitud de forma dinámica: las consultas simples consumen menos cómputo mientras que las consultas complejas conservan la capacidad total del modelo, preservando los resultados en todos los tipos de consultas. La afirmación de que la complejidad operativa anula el beneficio de sostenibilidad es un concepto erróneo: los ahorros de energía al enrutar consultas simples de alto volumen a un modelo más pequeño generalmente superan con creces la sobrecarga de la capa de enrutamiento. El procesamiento por lotes nocturno asume que la investigación legal nunca es urgente, lo cual no está establecido. Reemplazar completamente el modelo grande sacrifica la calidad en consultas complejas. |

### 175. SM-AI-I · 1.1 · `216007a9-4408-470f-ae94-ce029e79af42`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.1: Articulate the Agile Manifesto's four values and twelve principles

**stem**

| | |
|---|---|
| EN | A product owner argues that welcoming changing requirements no longer applies past the project's halfway point. Which principle does this argument misrepresent? |
| ES | Un Product Owner argumenta que dar la bienvenida a los requisitos cambiantes ya no aplica pasada la mitad del proyecto. ¿Qué principio tergiversa este argumento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Welcome changing requirements — Agile welcomes change even late in development. `<<KEY` |
| **a** ES | Bienvenida a los requisitos cambiantes — Agile acepta el cambio incluso tarde en el desarrollo. `<<KEY` |
| **b** EN | Simplicity — maximizing work not done means freezing scope once development begins. |
| **b** ES | Simplicidad — maximizar el trabajo no realizado significa congelar el alcance una vez que comienza el desarrollo. |
| **c** EN | Sustainable pace — capacity to absorb change diminishes as the project progresses. |
| **c** ES | Ritmo sostenible — la capacidad de absorber cambios disminuye a medida que avanza el proyecto. |
| **d** EN | Continuous delivery — frequent releases make late changes structurally impossible. |
| **d** ES | Entrega continua — las entregas frecuentes hacen que los cambios tardíos sean estructuralmente imposibles. |

**explanation**

| | |
|---|---|
| EN | The principle explicitly states that Agile processes welcome changing requirements 'even late in development' to harness change for the customer's competitive advantage. Restricting this openness to early phases directly contradicts the principle's stated scope. |
| ES | El principio establece explícitamente que los procesos ágiles dan la bienvenida a los requisitos cambiantes 'incluso tarde en el desarrollo' para aprovechar el cambio en beneficio de la ventaja competitiva del cliente. Restringir esta apertura a las fases tempranas contradice directamente el alcance declarado del principio. |

### 176. SM-AI-I · 1.1 · `29959842-326f-4c38-a542-4ab144592e0c`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.1: Articulate the Agile Manifesto's four values and twelve principles

**stem**

| | |
|---|---|
| EN | A senior engineer proposes skipping refactoring because the team is already shipping features. Which Agile principle does this conflict with? |
| ES | Un ingeniero senior propone omitir la refactorización porque el equipo ya está entregando funcionalidades. ¿Con qué principio ágil entra en conflicto esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Simplicity — avoiding unnecessary work means deferring refactoring until defects appear. |
| **a** ES | Simplicidad — evitar el trabajo innecesario significa diferir la refactorización hasta que aparezcan defectos. |
| **b** EN | Technical excellence — continuous attention to good design and quality enhances agility. `<<KEY` |
| **b** ES | Excelencia técnica — la atención continua al buen diseño y la calidad mejora la agilidad. `<<KEY` |
| **c** EN | Sustainable pace — skipping refactoring increases future effort and breaks the maintainable rhythm. |
| **c** ES | Ritmo sostenible — omitir la refactorización aumenta el esfuerzo futuro y rompe el ritmo sostenible. |
| **d** EN | Continuous delivery — refactoring sessions block the frequent release cadence the principle requires. |
| **d** ES | Entrega continua — las sesiones de refactorización bloquean la cadencia de entregas frecuentes que requiere el principio. |

**explanation**

| | |
|---|---|
| EN | The principle states that continuous attention to technical excellence and good design enhances agility. Treating technical quality as optional once features ship directly contradicts this principle. Simplicity in the Manifesto refers to avoiding unnecessary process complexity, not deferring quality work. |
| ES | El principio establece que la atención continua a la excelencia técnica y el buen diseño mejora la agilidad. Tratar la calidad técnica como algo opcional una vez que se entregan las funcionalidades contradice directamente este principio. La simplicidad en el Manifiesto se refiere a evitar la complejidad innecesaria en los procesos, no a diferir el trabajo de calidad. |

### 177. SM-AI-I · 1.1 · `ef04dca4-51ff-4fc2-85ad-5ef65a27e91d`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.1: Articulate the Agile Manifesto's four values and twelve principles

**stem**

| | |
|---|---|
| EN | The Agile principle of simplicity means 'maximizing the amount of work not done.' Which interpretation correctly captures this? |
| ES | El principio ágil de simplicidad significa 'maximizar la cantidad de trabajo no realizado.' ¿Cuál interpretación captura correctamente esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Cut planned features whenever the backlog grows too large to deliver on schedule. |
| **a** ES | Recortar las funcionalidades planificadas cuando el Product Backlog crece demasiado para entregarse a tiempo. |
| **b** EN | Eliminate documentation entirely, since it represents work that does not produce software. |
| **b** ES | Eliminar completamente la documentación, ya que representa trabajo que no produce software. |
| **c** EN | Defer all non-functional requirements because they do not constitute working software. |
| **c** ES | Diferir todos los requisitos no funcionales porque no constituyen software funcionando. |
| **d** EN | Avoid unnecessary complexity and overhead in solutions and processes, not merely reduce scope. `<<KEY` |
| **d** ES | Evitar la complejidad y la sobrecarga innecesarias en las soluciones y los procesos, no simplemente reducir el alcance. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Simplicity targets wasteful complexity in solutions and processes — unnecessary steps, over-engineering, and bureaucratic overhead. It is not a directive to shrink feature scope or eliminate documentation; those interpretations confuse simplicity with descoping or misapply the 'over' logic of the documentation value. |
| ES | La simplicidad apunta a la complejidad innecesaria en soluciones y procesos — pasos innecesarios, sobreingeniería y burocracia excesiva. No es una directiva para reducir el alcance de las funcionalidades ni para eliminar la documentación; esas interpretaciones confunden la simplicidad con la reducción del alcance o aplican incorrectamente la lógica del 'sobre' del valor de la documentación. |

### 178. SM-AI-I · 1.2 · `9b1d6553-03ce-4bd4-bd6e-3ec5c2ce2d6c`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.2: Apply the three pillars of empirical process control (Transparency, Inspection, Adaptation) to diagnose which pillar is broken

**stem**

| | |
|---|---|
| EN | A Scrum Team consistently delivers increments but never changes its process, even after Sprint Reviews repeatedly surface the same quality problems. Which pillar is broken? |
| ES | Un Scrum Team entrega Increments de manera consistente pero nunca cambia su proceso, incluso después de que los Sprint Reviews reiteradamente evidencian los mismos problemas de calidad. ¿Qué pilar está quebrado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Inspection, because the same problems recurring means the team is not examining output carefully enough each Sprint. |
| **a** ES | La Inspección, porque la recurrencia de los mismos problemas significa que el equipo no examina el resultado con suficiente cuidado en cada Sprint. |
| **b** EN | Inspection, because quality problems can only be detected through a formal audit, not the Sprint Review. |
| **b** ES | La Inspección, porque los problemas de calidad solo pueden detectarse mediante una auditoría formal, no en el Sprint Review. |
| **c** EN | Transparency, because recurring quality problems mean defects are not visible in the shared artifacts. |
| **c** ES | La Transparencia, porque los problemas de calidad recurrentes significan que los defectos no son visibles en los artefactos compartidos. |
| **d** EN | Adaptation, because the team is not adjusting its process in response to what repeated inspection has revealed. `<<KEY` |
| **d** ES | La Adaptación, porque el equipo no está ajustando su proceso en respuesta a lo que la inspección repetida ha revelado. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | When inspection consistently surfaces the same problems and the team makes no process change, Adaptation is the broken pillar. Transparency and Inspection appear functional — problems are visible and being detected — but the team fails to act on that information. Recurring detection without response is an Adaptation failure, not an Inspection failure. |
| ES | Cuando la inspección evidencia de manera consistente los mismos problemas y el equipo no realiza ningún cambio en el proceso, la Adaptación es el pilar quebrado. La Transparencia y la Inspección parecen funcionar — los problemas son visibles y están siendo detectados — pero el equipo no actúa sobre esa información. La detección recurrente sin respuesta es un fallo de Adaptación, no de Inspección. |

### 179. SM-AI-I · 1.2 · `ea75e40e-7d9d-42db-b7ad-6d25c3a26115`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.2: Apply the three pillars of empirical process control (Transparency, Inspection, Adaptation) to diagnose which pillar is broken

**stem**

| | |
|---|---|
| EN | A Scrum Team defines 'Done' differently across members, causing inconsistent Sprint outputs. Which empirical pillar must the team address first? |
| ES | Un Scrum Team define 'Hecho' de manera diferente entre sus miembros, lo que genera resultados inconsistentes en el Sprint. ¿Qué pilar empírico debe abordar el equipo primero? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Transparency, by establishing a shared Definition of Done for the artifact. `<<KEY` |
| **a** ES | Transparencia, estableciendo una Definition of Done compartida para el artefacto. `<<KEY` |
| **b** EN | Inspection, by auditing all outputs against requirements at Sprint end. |
| **b** ES | Inspección, auditando todos los resultados contra los requisitos al final del Sprint. |
| **c** EN | Inspection, by having the Scrum Master monitor and flag deviations daily. |
| **c** ES | Inspección, haciendo que el Scrum Master monitoree y señale las desviaciones diariamente. |
| **d** EN | Adaptation, by updating the process each time an inconsistency is detected. |
| **d** ES | Adaptación, actualizando el proceso cada vez que se detecta una inconsistencia. |

**explanation**

| | |
|---|---|
| EN | Transparency is the prerequisite pillar: without a shared Definition of Done, the artifact does not mean the same thing to everyone, so any inspection of it is unreliable and any adaptation is uninformed. Jumping straight to adaptation skips this foundation. Treating inspection as a formal end-of-Sprint audit misrepresents how inspection works in Scrum. Assigning daily monitoring to the Scrum Master confuses that role with a command-and-control manager. The team must first make the artifact genuinely transparent before the other pillars can function. |
| ES | La transparencia es el pilar prerequisito: sin una Definition of Done compartida, el artefacto no significa lo mismo para todos, por lo que cualquier inspección del mismo es poco confiable y cualquier adaptación carece de fundamento. Saltar directamente a la adaptación omite esta base. Tratar la inspección como una auditoría formal al final del Sprint tergiversa cómo funciona la inspección en Scrum. Asignar el monitoreo diario al Scrum Master confunde ese rol con el de un gerente de mando y control. El equipo debe primero hacer que el artefacto sea genuinamente transparente antes de que los otros pilares puedan funcionar. |

### 180. SM-AI-I · 1.2 · `fd20ecb2-c200-4fb3-9271-9ae452bd1191`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.2: Apply the three pillars of empirical process control (Transparency, Inspection, Adaptation) to diagnose which pillar is broken

**stem**

| | |
|---|---|
| EN | A Scrum Team skips the Daily Scrum three days running, arguing that inspection already happened at Sprint Planning. Which pillar is at immediate risk? |
| ES | Un Scrum Team se salta el Daily Scrum durante tres días seguidos, argumentando que la inspección ya ocurrió en el Sprint Planning. ¿Qué pilar está en riesgo inmediato? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Inspection, because the team is not frequently examining progress toward the Sprint Goal, making deviations undetectable. `<<KEY` |
| **a** ES | La Inspección, porque el equipo no está examinando frecuentemente el progreso hacia el Sprint Goal, haciendo que las desviaciones sean indetectables. `<<KEY` |
| **b** EN | Adaptation, because without Daily Scrums the team cannot update the Product Backlog to reflect daily progress. |
| **b** ES | La Adaptación, porque sin el Daily Scrum el equipo no puede actualizar el Product Backlog para reflejar el progreso diario. |
| **c** EN | Inspection, because Sprint Planning inspection is valid only for the first day and must be renewed each morning. |
| **c** ES | La Inspección, porque la inspección del Sprint Planning es válida solo para el primer día y debe renovarse cada mañana. |
| **d** EN | Transparency, because skipping Daily Scrums prevents the Scrum Master from keeping artifacts current for stakeholders. |
| **d** ES | La Transparencia, porque saltarse el Daily Scrum impide que el Scrum Master mantenga los artefactos actualizados para los interesados. |

**explanation**

| | |
|---|---|
| EN | Inspection requires frequent examination of progress — not just at Sprint Planning. Skipping the Daily Scrum removes the daily opportunity to detect deviations from the Sprint Goal, putting Inspection at immediate risk. Sprint Planning inspection covers the plan at that moment; it cannot substitute for ongoing daily examination of actual progress throughout the Sprint. |
| ES | La Inspección requiere un examen frecuente del progreso — no solo en el Sprint Planning. Saltarse el Daily Scrum elimina la oportunidad diaria de detectar desviaciones del Sprint Goal, poniendo en riesgo inmediato la Inspección. La inspección del Sprint Planning cubre el plan en ese momento; no puede sustituir el examen diario continuo del progreso real a lo largo del Sprint. |

### 181. SM-AI-I · 1.3 · `4666275a-360c-4c10-97cf-0ed76f09812e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Identify the five Scrum Values in workplace behaviors

**stem**

| | |
|---|---|
| EN | A Scrum Team consistently delivers the Sprint Goal but leaves lower-priority backlog items unfinished each Sprint. The Product Owner is satisfied. What does this best demonstrate? |
| ES | Un Scrum Team entrega consistentemente el Sprint Goal pero deja elementos de menor prioridad del backlog sin terminar en cada Sprint. El Product Owner está satisfecho. ¿Qué demuestra esto mejor? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Correct Commitment, because the team commits to the Sprint Goal, not every backlog item. `<<KEY` |
| **a** ES | Compromiso correcto, porque el equipo se compromete con el Sprint Goal, no con cada elemento del backlog. `<<KEY` |
| **b** EN | A violation of Focus, because unfinished items prove the team was distracted. |
| **b** ES | Una violación del Enfoque, porque los elementos sin terminar demuestran que el equipo se distrajo. |
| **c** EN | A violation of Commitment, because the team must complete all Sprint Backlog items. |
| **c** ES | Una violación del Compromiso, porque el equipo debe completar todos los elementos del Sprint Backlog. |
| **d** EN | Correct Dedication, the term that replaced Commitment in earlier Scrum versions. |
| **d** ES | Dedicación correcta, el término que reemplazó al Compromiso en versiones anteriores de Scrum. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide is explicit: the team commits to the Sprint Goal, not to completing every item on the Sprint Backlog. Consistently achieving the Goal while leaving lower-priority items unfinished is healthy Scrum behavior. Treating the Sprint Backlog as a delivery promise confuses Commitment with a fixed contract. 'Dedication' replaced 'Commitment' in an earlier guide version but the underlying meaning has not changed. |
| ES | La Guía Scrum 2020 es explícita: el equipo se compromete con el Sprint Goal, no con completar todos los elementos del Sprint Backlog. Lograr consistentemente el Sprint Goal mientras se dejan elementos de menor prioridad sin terminar es un comportamiento saludable en Scrum. Tratar el Sprint Backlog como una promesa de entrega confunde el Compromiso con un contrato fijo. 'Dedicación' reemplazó a 'Compromiso' en una versión anterior de la guía, pero el significado subyacente no ha cambiado. |

### 182. SM-AI-I · 1.3 · `7abdbb8d-c711-4a2b-ad60-860a54a5b86d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Identify the five Scrum Values in workplace behaviors

**stem**

| | |
|---|---|
| EN | A developer notices a teammate struggling with a task outside their specialty. The Sprint Goal is at risk. What should the developer do to live the Scrum Values? |
| ES | Un desarrollador nota que un compañero tiene dificultades con una tarea fuera de su especialidad. El Sprint Goal está en riesgo. ¿Qué debería hacer el desarrollador para vivir los Valores de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Raise it at the Retrospective, because cross-skill support belongs in that event. |
| **a** ES | Plantearlo en la Sprint Retrospective, porque el apoyo entre habilidades pertenece a ese evento. |
| **b** EN | Escalate to the Scrum Master, whose role is to resolve skill gaps and enforce values. |
| **b** ES | Escalarlo al Scrum Master, cuyo rol es resolver brechas de habilidades y hacer cumplir los valores. |
| **c** EN | Offer to help, prioritizing the Sprint Goal over individual task boundaries. `<<KEY` |
| **c** ES | Ofrecer ayuda, priorizando el Sprint Goal por encima de los límites individuales de las tareas. `<<KEY` |
| **d** EN | Stay on personal tasks, because Focus means protecting individual specialization. |
| **d** ES | Mantenerse en sus tareas personales, porque el Enfoque significa proteger la especialización individual. |

**explanation**

| | |
|---|---|
| EN | Focus in Scrum is a team-level value directed at the Sprint Goal, not individual task isolation. When the Goal is at risk, helping a struggling teammate correctly expresses both Focus and Respect. Waiting for the Retrospective delays necessary action. Escalating to the Scrum Master misrepresents that role; the Scrum Master is not an enforcer of values or a resolver of skill gaps. |
| ES | El Enfoque en Scrum es un valor a nivel de equipo dirigido al Sprint Goal, no al aislamiento de tareas individuales. Cuando el Sprint Goal está en riesgo, ayudar a un compañero con dificultades expresa correctamente tanto el Enfoque como el Respeto. Esperar a la Sprint Retrospective retrasa la acción necesaria. Escalar al Scrum Master malinterpreta ese rol; el Scrum Master no es un ejecutor de valores ni un resolvedor de brechas de habilidades. |

### 183. SM-AI-I · 1.3 · `b31d27d8-1f39-4605-a338-f3c55f621106`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Identify the five Scrum Values in workplace behaviors

**stem**

| | |
|---|---|
| EN | A developer gives a teammate blunt, specific feedback on poor code quality during a Sprint. The teammate feels uncomfortable. Does this reflect the Scrum Values? |
| ES | Un desarrollador le da a un compañero retroalimentación directa y específica sobre la mala calidad del código durante un Sprint. El compañero se siente incómodo. ¿Refleja esto los Valores de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No — direct feedback during the Sprint violates Respect; it belongs only in Retrospectives. |
| **a** ES | No — la retroalimentación directa durante el Sprint viola el Respeto; solo pertenece a las Sprint Retrospectives. |
| **b** EN | No — Respect means shielding teammates from negative feedback to preserve harmony. |
| **b** ES | No — el Respeto significa proteger a los compañeros de la retroalimentación negativa para preservar la armonía. |
| **c** EN | Yes — honest, specific, professional feedback reflects both Respect and Courage. `<<KEY` |
| **c** ES | Sí — la retroalimentación honesta, específica y profesional refleja tanto el Respeto como el Coraje. `<<KEY` |
| **d** EN | Yes — but discomfort signals the feedback lacked Respect and should be restated. |
| **d** ES | Sí — pero la incomodidad indica que la retroalimentación careció de Respeto y debe reformularse. |

**explanation**

| | |
|---|---|
| EN | Respect in Scrum means valuing colleagues as capable professionals, which includes giving honest feedback that helps them improve — not avoiding hard truths. Delivering specific, professional feedback also requires Courage. Equating Respect with conflict avoidance, or restricting Courage to Retrospectives, are both misconceptions the Scrum Guide does not support. A teammate's discomfort does not itself indicate a values violation. |
| ES | El Respeto en Scrum significa valorar a los colegas como profesionales capaces, lo que incluye dar retroalimentación honesta que les ayude a mejorar, no evitar las verdades difíciles. Dar retroalimentación específica y profesional también requiere Coraje. Equiparar el Respeto con evitar conflictos, o restringir el Coraje a las Sprint Retrospectives, son conceptos erróneos que la Guía Scrum no respalda. La incomodidad de un compañero no indica por sí misma una violación de los valores. |

### 184. SM-AI-I · 1.3 · `1a568ec2-0ae4-4557-bd5d-d5822d2bd7c7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.3: Identify the five Scrum Values in workplace behaviors

**stem**

| | |
|---|---|
| EN | During Sprint Planning, a developer privately doubts the Sprint Goal is achievable but says nothing to avoid conflict. Which Scrum Value is most clearly being violated? |
| ES | Durante el Sprint Planning, un desarrollador duda en privado de que el Sprint Goal sea alcanzable, pero no dice nada para evitar conflictos. ¿Cuál Valor de Scrum se está violando más claramente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Openness, because the concern was never logged in the Sprint Backlog. |
| **a** ES | Apertura, porque la preocupación nunca fue registrada en el Sprint Backlog. |
| **b** EN | Commitment, because the developer has not yet started work on the planned items. |
| **b** ES | Compromiso, porque el desarrollador aún no ha comenzado a trabajar en los elementos planificados. |
| **c** EN | Courage, because voicing difficult feasibility concerns is required, not optional. `<<KEY` |
| **c** ES | Coraje, porque expresar preocupaciones difíciles sobre la viabilidad es obligatorio, no opcional. `<<KEY` |
| **d** EN | Respect, because silence protects teammates from unnecessary stress. |
| **d** ES | Respeto, porque el silencio protege a los compañeros de un estrés innecesario. |

**explanation**

| | |
|---|---|
| EN | Courage requires Scrum Team members to voice difficult truths, including doubts about feasibility, so the team can make informed decisions. Staying silent to avoid conflict is a direct failure of Courage. Silence is not an act of Respect; genuine Respect includes honest communication. Commitment concerns dedication to the Sprint Goal, not whether a concern was spoken aloud. |
| ES | El Coraje exige que los miembros del Scrum Team expresen verdades difíciles, incluidas las dudas sobre la viabilidad, para que el equipo pueda tomar decisiones informadas. Guardar silencio para evitar conflictos es una falla directa del Coraje. El silencio no es un acto de Respeto; la Respeto genuino incluye una comunicación honesta. El Compromiso se refiere a la dedicación al Sprint Goal, no a si una preocupación fue expresada en voz alta. |

### 185. SM-AI-I · 1.4 · `eb852199-e7ac-4157-860a-9be741e0836b`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 1.4: Distinguish complex problems suited to Scrum from problems suited to predictive approaches

**stem**

| | |
|---|---|
| EN | At Sprint Review, a stakeholder suggests that stable velocity and clear acceptance criteria mean the team should stop iterating and deliver the remaining backlog as a single planned release. What should the Scrum Master advise? |
| ES | En el Sprint Review, un interesado sugiere que la velocidad estable y los criterios de aceptación claros significan que el equipo debería dejar de iterar y entregar el backlog restante como un único lanzamiento planificado. ¿Qué debería aconsejar el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Disagree—Scrum must be used for all software development, so iteration can never be replaced by planning. |
| **a** ES | Estar en desacuerdo: Scrum debe usarse para todo el desarrollo de software, por lo que la iteración nunca puede ser reemplazada por la planificación. |
| **b** EN | Evaluate whether the remaining work is still in a complex domain; if unknowns persist, continue iterating rather than switching. `<<KEY` |
| **b** ES | Evaluar si el trabajo restante sigue estando en un dominio complejo; si persisten las incógnitas, continuar iterando en lugar de cambiar. `<<KEY` |
| **c** EN | Agree—empirical process is only needed when requirements are unclear; clear criteria mean predictive planning can take over. |
| **c** ES | Estar de acuerdo: el proceso empírico solo se necesita cuando los requisitos no están claros; los criterios claros significan que la planificación predictiva puede tomar el control. |
| **d** EN | Agree—stable velocity confirms the domain is no longer complex, justifying a switch to a predictive release plan. |
| **d** ES | Estar de acuerdo: la velocidad estable confirma que el dominio ya no es complejo, lo que justifica un cambio a un plan de lanzamiento predictivo. |

**explanation**

| | |
|---|---|
| EN | The decision to switch from empirical to predictive should be based on whether the domain is still complex, not on velocity stability or criteria clarity. Stable velocity is a productivity metric, not a domain indicator. Clear acceptance criteria do not eliminate complexity if emergent user or market feedback is still possible. Scrum is not mandatory for all software regardless of domain—the domain nature must drive the process choice. |
| ES | La decisión de cambiar de empírico a predictivo debe basarse en si el dominio sigue siendo complejo, no en la estabilidad de la velocidad ni en la claridad de los criterios. La velocidad estable es una métrica de productividad, no un indicador de dominio. Los criterios de aceptación claros no eliminan la complejidad si aún es posible recibir retroalimentación emergente del usuario o del mercado. Scrum no es obligatorio para todo el software independientemente del dominio: la naturaleza del dominio debe guiar la elección del proceso. |

### 186. SM-AI-I · 1.4 · `e30f8401-a289-4100-980a-7fc6dd64000e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.4: Distinguish complex problems suited to Scrum from problems suited to predictive approaches

**stem**

| | |
|---|---|
| EN | An organization faces a sudden, unprecedented system outage with no known cause and no established response playbook. According to Cynefin, what should the team do first? |
| ES | Una organización enfrenta una interrupción del sistema repentina y sin precedentes, sin causa conocida y sin un manual de respuesta establecido. Según Cynefin, ¿qué debería hacer el equipo primero? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Probe with small experiments and sense feedback—the situation is complex and cause-and-effect will emerge iteratively. |
| **a** ES | Explorar con experimentos pequeños y percibir la retroalimentación: la situación es compleja y la causa y el efecto emergerán de forma iterativa. |
| **b** EN | Convene expert engineers to analyze the outage upfront—complicated problems yield to sufficient specialist knowledge. |
| **b** ES | Convocar a ingenieros expertos para analizar la interrupción de antemano: los problemas complicados ceden ante el conocimiento especializado suficiente. |
| **c** EN | Act immediately to stabilize the situation, then sense and respond—chaotic domains require action before analysis. `<<KEY` |
| **c** ES | Actuar de inmediato para estabilizar la situación, luego percibir y responder: los dominios caóticos requieren acción antes que análisis. `<<KEY` |
| **d** EN | Run Sprints of investigation—chaos is an extreme form of complexity, so the response pattern is the same. |
| **d** ES | Ejecutar Sprints de investigación: el caos es una forma extrema de complejidad, por lo que el patrón de respuesta es el mismo. |

**explanation**

| | |
|---|---|
| EN | An unprecedented outage with no known cause is chaotic; the Cynefin response is act-sense-respond to restore order first. Chaos is distinct from complexity—probing iteratively is the complex response and is inappropriate when the situation is destabilized. Convening experts to analyze upfront is the complicated response. Running Sprints conflates the chaotic and complex response patterns; chaos requires immediate stabilizing action, not iterative investigation. |
| ES | Una interrupción sin precedentes y sin causa conocida es caótica; la respuesta de Cynefin es actuar-percibir-responder para restablecer el orden primero. El caos es distinto de la complejidad: explorar de forma iterativa es la respuesta compleja y no es apropiada cuando la situación está desestabilizada. Convocar expertos para analizar de antemano es la respuesta complicada. Ejecutar Sprints confunde los patrones de respuesta caótico y complejo; el caos requiere acción estabilizadora inmediata, no investigación iterativa. |

### 187. SM-AI-I · 1.5 · `499c3a66-069c-4bce-8ddb-cea6916c62a7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.5: Explain lean thinking principles as they apply to Scrum

**stem**

| | |
|---|---|
| EN | Scrum's fixed-length Sprints, each producing a done increment, are most directly rooted in which pair of ideas? |
| ES | Los Sprints de duración fija en Scrum, cada uno produciendo un Increment terminado, están más directamente enraizados en cuál par de ideas: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Waste reduction and iterative development: ceremonies are minimized and backlog items repeat until they are perfect. |
| **a** ES | Reducción de desperdicios y desarrollo iterativo: las ceremonias se minimizan y los elementos del Product Backlog se repiten hasta que son perfectos. |
| **b** EN | Deferred commitment and incremental development: decisions are postponed while features accumulate toward one release. |
| **b** ES | Compromiso diferido y desarrollo incremental: las decisiones se posponen mientras las funcionalidades se acumulan hacia un único lanzamiento. |
| **c** EN | Flow and incremental development: team members stay fully busy and each Sprint adds one standalone feature. |
| **c** ES | Flujo y desarrollo incremental: los miembros del equipo se mantienen completamente ocupados y cada Sprint agrega una funcionalidad independiente. |
| **d** EN | Small batches and iterative development: scope is limited per cycle and each cycle refines and extends the product. `<<KEY` |
| **d** ES | Lotes pequeños y desarrollo iterativo: el alcance se limita por ciclo y cada ciclo refina y extiende el producto. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Sprints embody small batches — limiting scope per cycle — and iterative-plus-incremental development, where each Sprint both refines prior work and adds new value. Deferred commitment describes decision timing, not Sprint structure. Conflating flow with full utilization misrepresents Lean, and reducing ceremonies or repeating items until perfect misrepresents both Lean and Scrum. |
| ES | Los Sprints encarnan los lotes pequeños —limitando el alcance por ciclo— y el desarrollo iterativo e incremental, donde cada Sprint tanto refina el trabajo previo como agrega nuevo valor. El compromiso diferido describe el momento de toma de decisiones, no la estructura del Sprint. Confundir el flujo con la plena utilización representa erróneamente el Lean, y reducir las ceremonias o repetir elementos hasta la perfección representa erróneamente tanto el Lean como Scrum. |

### 188. SM-AI-I · 1.5 · `4a98354c-b456-41c6-8553-490a8e314e16`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.5: Explain lean thinking principles as they apply to Scrum

**stem**

| | |
|---|---|
| EN | A Scrum team completes a Sprint with a working increment but does not release it to end users. A colleague claims the increment has no value because nothing was shipped. Why is this view incorrect? |
| ES | Un equipo Scrum completa un Sprint con un Increment funcional pero no lo lanza a los usuarios finales. Un colega afirma que el Increment no tiene valor porque no se entregó nada. ¿Por qué esta visión es incorrecta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Iterative development requires each increment to be independently usable by external stakeholders. |
| **a** ES | El desarrollo iterativo requiere que cada Increment sea utilizable de forma independiente por los interesados externos. |
| **b** EN | Value exists when working software is inspectable; external release is a separate business decision. `<<KEY` |
| **b** ES | El valor existe cuando el software funcional es inspeccionable; el lanzamiento externo es una decisión de negocio separada. `<<KEY` |
| **c** EN | Lean thinking requires every batch to reach the customer before it counts as value-adding work. |
| **c** ES | El pensamiento Lean requiere que cada lote llegue al cliente antes de que se considere trabajo que agrega valor. |
| **d** EN | Value is only realized after the Product Owner formally accepts the increment at the Sprint Review. |
| **d** ES | El valor solo se realiza después de que el Product Owner acepta formalmente el Increment en el Sprint Review. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide defines an increment as a concrete step toward the Product Goal—it has value as working, inspectable software independent of external release. The decision to release is a business choice separate from the increment's existence. Claiming value requires external shipment confuses releasing with building. The option stating the Product Owner must formally accept the increment before value exists is a misconception; the Definition of Done, not PO acceptance, determines whether an increment is complete. Lean thinking values flow of working software, not mandatory external delivery each cycle, so that distractor also misrepresents the concept. |
| ES | La Guía Scrum define un Increment como un paso concreto hacia el Product Goal: tiene valor como software funcional e inspeccionable, independientemente del lanzamiento externo. La decisión de lanzar es una elección de negocio separada de la existencia del Increment. Afirmar que el valor requiere un envío externo confunde el lanzamiento con la construcción. La opción que indica que el Product Owner debe aceptar formalmente el Increment antes de que exista valor es un concepto erróneo; la Definition of Done, no la aceptación del Product Owner, determina si un Increment está completo. El pensamiento Lean valora el flujo de software funcional, no la entrega externa obligatoria en cada ciclo, por lo que esa opción también representa incorrectamente el concepto. |

### 189. SM-AI-I · 1.5 · `7c7c4f5f-34f1-47f8-b499-fd3ff9880ab9`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 1.5: Explain lean thinking principles as they apply to Scrum

**stem**

| | |
|---|---|
| EN | A team splits a large backlog item into four smaller items delivered across two Sprints instead of one big item in four Sprints. Which Lean benefit best explains this approach? |
| ES | Un equipo divide un elemento grande del backlog en cuatro elementos más pequeños entregados en dos Sprints, en lugar de un elemento grande en cuatro Sprints. ¿Qué beneficio Lean explica mejor este enfoque? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Smaller items reduce per-item overhead, so the team completes more story points overall. |
| **a** ES | Los elementos más pequeños reducen la sobrecarga por elemento, por lo que el equipo completa más story points en total. |
| **b** EN | Smaller items are easier to estimate, making velocity forecasts more accurate over time. |
| **b** ES | Los elementos más pequeños son más fáciles de estimar, lo que hace que las previsiones de velocidad sean más precisas con el tiempo. |
| **c** EN | Smaller batches enable earlier feedback, expose integration issues sooner, and reduce delivery risk. `<<KEY` |
| **c** ES | Los lotes más pequeños permiten obtener retroalimentación más temprana, exponen los problemas de integración antes y reducen el riesgo de entrega. `<<KEY` |
| **d** EN | Smaller batches shorten the feedback loop to the Product Owner, improving backlog prioritization. |
| **d** ES | Los lotes más pequeños acortan el ciclo de retroalimentación hacia el Product Owner, mejorando la priorización del Product Backlog. |

**explanation**

| | |
|---|---|
| EN | The Lean case for small batches centers on faster feedback loops, earlier detection of integration problems, and lower risk per delivery cycle. Reduced overhead and better estimation accuracy are common misconceptions about why small batches matter. Shorter feedback to the Product Owner is a real benefit but a secondary effect, not the primary Lean rationale. |
| ES | El argumento Lean a favor de los lotes pequeños se centra en ciclos de retroalimentación más rápidos, detección temprana de problemas de integración y menor riesgo por ciclo de entrega. La reducción de sobrecarga y la mayor precisión en la estimación son conceptos erróneos comunes sobre por qué importan los lotes pequeños. La retroalimentación más rápida al Product Owner es un beneficio real, pero es un efecto secundario, no la razón principal desde la perspectiva Lean. |

### 190. SM-AI-I · 1.5 · `c389caa1-9dc9-4f5c-aec1-412dd1b528c6`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 1.5: Explain lean thinking principles as they apply to Scrum

**stem**

| | |
|---|---|
| EN | A Scrum Team finishes a Sprint with working, tested software that meets the Definition of Done but will not be released to users. How does Lean-influenced Scrum classify this outcome? |
| ES | Un Scrum Team termina un Sprint con software funcional y probado que cumple con la Definition of Done, pero no será lanzado a los usuarios. ¿Cómo clasifica el Scrum influenciado por Lean este resultado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Incomplete work, because an increment only counts when external customers can access it. |
| **a** ES | Trabajo incompleto, porque un Increment solo cuenta cuando los clientes externos pueden acceder a él. |
| **b** EN | A valid increment, because it is integrated, working software that is potentially releasable. `<<KEY` |
| **b** ES | Un Increment válido, porque es software integrado y funcional que es potencialmente lanzable. `<<KEY` |
| **c** EN | A partial increment, because value is only realized once stakeholder feedback is collected. |
| **c** ES | Un Increment parcial, porque el valor solo se realiza una vez que se recopila la retroalimentación de los interesados. |
| **d** EN | Waste, because unshipped software delivers no value and should not have been built this Sprint. |
| **d** ES | Desperdicio, porque el software no lanzado no entrega ningún valor y no debería haberse construido en este Sprint. |

**explanation**

| | |
|---|---|
| EN | An increment is any integrated, working product state that meets the Definition of Done — the decision to release to end users is separate. Requiring external shipment conflates the product increment with the deployment decision. Calling it waste ignores the value of a releasable, done state, and requiring stakeholder feedback confuses value realization with increment validity. |
| ES | Un Increment es cualquier estado del producto integrado y funcional que cumple con la Definition of Done; la decisión de lanzarlo a los usuarios finales es independiente. Exigir el envío externo confunde el Increment del producto con la decisión de despliegue. Llamarlo desperdicio ignora el valor de un estado terminado y lanzable, y exigir retroalimentación de los interesados confunde la realización del valor con la validez del Increment. |

### 191. SM-AI-I · 1.6 · `c81b53a2-081e-4450-bcd1-13537cbd3e02`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Recognize when transparency is compromised and trace consequences

**stem**

| | |
|---|---|
| EN | Midway through a Sprint, the team silently adds three large unplanned items to the Sprint Backlog without updating the Sprint Goal or notifying the Product Owner. Which consequence is most critical? |
| ES | A mitad de un Sprint, el equipo agrega silenciosamente tres elementos grandes no planificados al Sprint Backlog sin actualizar el Sprint Goal ni notificar al Product Owner. ¿Cuál es la consecuencia más crítica? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Sprint Goal becomes an inaccurate transparency signal, so stakeholders cannot inspect whether the Sprint is on track. `<<KEY` |
| **a** ES | El Sprint Goal se convierte en una señal de transparencia inexacta, por lo que los interesados no pueden inspeccionar si el Sprint va por buen camino. `<<KEY` |
| **b** EN | The Product Backlog ordering is invalidated because items were promoted without a formal refinement session. |
| **b** ES | El ordenamiento del Product Backlog queda invalidado porque los elementos fueron promovidos sin una sesión formal de refinamiento. |
| **c** EN | The Definition of Done becomes ambiguous for new items because acceptance criteria were not set in Sprint Planning. |
| **c** ES | La Definition of Done se vuelve ambigua para los nuevos elementos porque los criterios de aceptación no se establecieron en el Sprint Planning. |
| **d** EN | The Daily Scrum loses timebox compliance because additional items require longer synchronization discussions. |
| **d** ES | El Daily Scrum pierde el cumplimiento del tiempo límite porque los elementos adicionales requieren discusiones de sincronización más largas. |

**explanation**

| | |
|---|---|
| EN | Silently expanding the Sprint Backlog without updating the Sprint Goal hides the team's actual commitments, making the Sprint Goal an inaccurate transparency artifact. Stakeholders inspecting the Sprint Goal can no longer assess real progress or forecast delivery, breaking the inspect-and-adapt cycle. While the Definition of Done and backlog ordering may also be affected, the most critical transparency consequence is the corruption of the Sprint Goal as a reliable signal. |
| ES | Expandir silenciosamente el Sprint Backlog sin actualizar el Sprint Goal oculta los compromisos reales del equipo, convirtiendo al Sprint Goal en un artefacto de transparencia inexacto. Los interesados que inspeccionan el Sprint Goal ya no pueden evaluar el progreso real ni pronosticar la entrega, rompiendo el ciclo de inspección y adaptación. Si bien la Definition of Done y el ordenamiento del backlog también pueden verse afectados, la consecuencia de transparencia más crítica es la corrupción del Sprint Goal como señal confiable. |

### 192. SM-AI-I · 1.6 · `d84e5436-81f3-4038-ab61-95f4729a229e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Recognize when transparency is compromised and trace consequences

**stem**

| | |
|---|---|
| EN | A Product Backlog is accessible to all stakeholders, but items use developer-only jargon and acceptance criteria are blank. The Scrum Master declares transparency achieved because the artifact is visible. What does this situation most accurately reveal? |
| ES | Un Product Backlog es accesible para todos los interesados, pero los ítems usan jerga exclusiva de desarrolladores y los criterios de aceptación están en blanco. El Scrum Master declara que se ha logrado transparencia porque el artefacto es visible. ¿Qué revela con mayor precisión esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Transparency is intact because stakeholder visibility satisfies the first empirical pillar. |
| **a** ES | La transparencia está intacta porque la visibilidad de los interesados satisface el primer pilar empírico. |
| **b** EN | Transparency requires every backlog item to be fully detailed with zero ambiguity. |
| **b** ES | La transparencia requiere que cada ítem del backlog esté completamente detallado con cero ambigüedad. |
| **c** EN | Transparency is intact because skilled inspectors can infer missing criteria from context. |
| **c** ES | La transparencia está intacta porque los inspectores capacitados pueden inferir los criterios faltantes del contexto. |
| **d** EN | Transparency requires shared understanding; accessibility alone does not satisfy it. `<<KEY` |
| **d** ES | La transparencia requiere comprensión compartida; la accesibilidad por sí sola no la satisface. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide defines transparency as artifacts being visible AND understood by those inspecting them. Jargon-laden items with blank acceptance criteria prevent genuine shared understanding, so transparency is compromised regardless of tool access. The claim that skilled inspectors can infer missing criteria confuses inspection ability with the prerequisite condition that content must be comprehensible before inspection can begin. The claim that stakeholder visibility alone satisfies transparency mistakes the mechanism (access) for the outcome (shared understanding). |
| ES | La Guía Scrum 2020 define la transparencia como artefactos que son visibles Y comprendidos por quienes los inspeccionan. Los ítems cargados de jerga con criterios de aceptación en blanco impiden una genuina comprensión compartida, por lo que la transparencia se ve comprometida independientemente del acceso a la herramienta. La afirmación de que los inspectores capacitados pueden inferir los criterios faltantes confunde la capacidad de inspección con la condición previa de que el contenido debe ser comprensible antes de que la inspección pueda comenzar. La afirmación de que la visibilidad de los interesados por sí sola satisface la transparencia confunde el mecanismo (acceso) con el resultado (comprensión compartida). |

### 193. SM-AI-I · 1.6 · `9423cbcc-3254-40f7-8ed4-cd88bf18f2d5`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Recognize when transparency is compromised and trace consequences

**stem**

| | |
|---|---|
| EN | A Product Owner's roadmap shows consistently green status. Engineering leads privately report significant technical debt blocking delivery. What does this reveal about transparency? |
| ES | El roadmap de un Product Owner muestra un estado consistentemente verde. Los líderes de ingeniería reportan en privado una deuda técnica significativa que bloquea la entrega. ¿Qué revela esto sobre la transparencia? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Transparency is intact; green status reflects planned scope, not engineering capacity, so no conflict exists. |
| **a** ES | La transparencia está intacta; el estado verde refleja el alcance planificado, no la capacidad de ingeniería, por lo que no existe conflicto. |
| **b** EN | Transparency is compromised; inflated status signals prevent stakeholders from inspecting real progress and adapting plans. `<<KEY` |
| **b** ES | La transparencia está comprometida; las señales de estado infladas impiden que los interesados inspeccionen el progreso real y adapten los planes. `<<KEY` |
| **c** EN | Transparency is intact; the roadmap exists and is visible, so technical debt is outside its scope. |
| **c** ES | La transparencia está intacta; el roadmap existe y es visible, por lo que la deuda técnica está fuera de su alcance. |
| **d** EN | Transparency is a team-internal value; the mismatch between roadmap and engineering reality is a psychological-safety issue. |
| **d** ES | La transparencia es un valor interno del equipo; la discrepancia entre el roadmap y la realidad de ingeniería es un problema de seguridad psicológica. |

**explanation**

| | |
|---|---|
| EN | Consistently green indicators that contradict actual delivery capacity are a classic form of inflated status reporting, which directly compromises the transparency pillar. Without accurate artifact signals, stakeholders cannot inspect real progress, and adaptation decisions are based on false information. Claiming the artifact 'exists' satisfies transparency ignores that its content must truthfully represent reality, and framing it as purely a psychological-safety issue sidesteps the artifact obligation. |
| ES | Los indicadores consistentemente verdes que contradicen la capacidad real de entrega son una forma clásica de reporte de estado inflado, lo que compromete directamente el pilar de transparencia. Sin señales precisas en los artefactos, los interesados no pueden inspeccionar el progreso real y las decisiones de adaptación se basan en información falsa. Afirmar que el artefacto 'existe' satisface la transparencia ignora que su contenido debe representar la realidad con veracidad, y enmarcarlo como un problema puramente de seguridad psicológica evade la obligación del artefacto. |

### 194. SM-AI-I · 1.6 · `c021f358-945a-44da-9a61-03dac5437332`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.6: Recognize when transparency is compromised and trace consequences

**stem**

| | |
|---|---|
| EN | A Product Backlog has 200 items, each described in one sentence with no acceptance criteria. The team claims it is transparent because every item is listed. What is the flaw in this claim? |
| ES | Un Product Backlog tiene 200 elementos, cada uno descrito en una oración sin criterios de aceptación. El equipo afirma que es transparente porque cada elemento está listado. ¿Cuál es el error en esta afirmación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The claim equates visibility with transparency; a backlog is transparent when its content is understandable, not merely listed. `<<KEY` |
| **a** ES | La afirmación equipara visibilidad con transparencia; un backlog es transparente cuando su contenido es comprensible, no simplemente cuando está listado. `<<KEY` |
| **b** EN | The claim is valid; transparency requires only that items be listed and accessible, not that they carry acceptance criteria. |
| **b** ES | La afirmación es válida; la transparencia solo requiere que los elementos estén listados y sean accesibles, no que tengan criterios de aceptación. |
| **c** EN | The claim overstates the problem; reducing backlog size would restore transparency without adding detail. |
| **c** ES | La afirmación exagera el problema; reducir el tamaño del backlog restauraría la transparencia sin necesidad de agregar detalles. |
| **d** EN | The claim is flawed because all stakeholders must reach consensus on item descriptions for transparency to hold. |
| **d** ES | La afirmación es incorrecta porque todos los interesados deben llegar a un consenso sobre las descripciones de los elementos para que la transparencia sea válida. |

**explanation**

| | |
|---|---|
| EN | Transparency means the artifact accurately and understandably represents reality to those who use it — it does not require exhaustive specification. Conversely, a long list of opaque one-liners is not transparent even though every item is visible. Equating transparency with exhaustive detail is a distinct misconception, as is equating it with stakeholder consensus on wording. Reducing backlog size addresses a different problem entirely. |
| ES | La transparencia significa que el artefacto representa la realidad de manera precisa y comprensible para quienes lo utilizan; no requiere una especificación exhaustiva. Por el contrario, una larga lista de oraciones opacas no es transparente aunque cada elemento sea visible. Equiparar la transparencia con el detalle exhaustivo es un concepto erróneo distinto, al igual que equipararla con el consenso de los interesados sobre la redacción. Reducir el tamaño del backlog aborda un problema completamente diferente. |

### 195. SM-AI-I · 1.7 · `39dcb820-d9ae-4faf-9ffd-984616338884`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.7: Analyze how AI-accelerated output can threaten empiricism, and how the Scrum Master safeguards inspection and adaptation

**stem**

| | |
|---|---|
| EN | After AI accelerates feature delivery, the Scrum Master proposes limiting items accepted per Sprint. Developers object that this undermines self-management. How should the Scrum Master analyze this objection? |
| ES | Después de que la IA acelera la entrega de funcionalidades, el Scrum Master propone limitar los elementos aceptados por Sprint. Los desarrolladores objetan que esto socava la autogestión. ¿Cómo debería el Scrum Master analizar esta objeción? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The objection conflates output volume with self-management; protecting inspection capacity is a legitimate Scrum Master intervention. `<<KEY` |
| **a** ES | La objeción confunde el volumen de producción con la autogestión; proteger la capacidad de inspección es una intervención legítima del Scrum Master. `<<KEY` |
| **b** EN | The objection is valid; limiting Sprint items violates the team's authority to determine its own capacity and pace. |
| **b** ES | La objeción es válida; limitar los elementos del Sprint viola la autoridad del equipo para determinar su propia capacidad y ritmo. |
| **c** EN | The objection is valid because the Product Owner alone controls delivery pace through backlog ordering. |
| **c** ES | La objeción es válida porque solo el Product Owner controla el ritmo de entrega mediante el ordenamiento del Product Backlog. |
| **d** EN | The objection is valid only if the team has already tightened the Definition of Done; otherwise the Scrum Master's step comes first. |
| **d** ES | La objeción es válida solo si el equipo ya ha reforzado la Definition of Done; de lo contrario, el paso del Scrum Master viene primero. |

**explanation**

| | |
|---|---|
| EN | Protecting empiricism—specifically the team's capacity to inspect and adapt—is a core Scrum Master accountability, not interference with self-management. Self-management means the team decides how to do the work; it does not prevent the Scrum Master from intervening when the empirical process itself is at risk. Delegating this entirely to the Product Owner's backlog ordering misidentifies who safeguards the process. |
| ES | Proteger el empirismo, específicamente la capacidad del equipo para inspeccionar y adaptarse, es una responsabilidad fundamental del Scrum Master, no una interferencia con la autogestión. La autogestión significa que el equipo decide cómo hacer el trabajo; no impide que el Scrum Master intervenga cuando el proceso empírico en sí está en riesgo. Delegar esto completamente al ordenamiento del Product Backlog del Product Owner identifica erróneamente quién salvaguarda el proceso. |

### 196. SM-AI-I · 1.7 · `4c64aac1-fb74-4f84-a8db-942fd336ca2c`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 1.7: Analyze how AI-accelerated output can threaten empiricism, and how the Scrum Master safeguards inspection and adaptation

**stem**

| | |
|---|---|
| EN | A team using AI tooling doubles its Sprint output. Developers approve AI-generated code with minimal review, and Sprint Reviews rush through twice as many items. Which root cause best explains the empirical risk? |
| ES | Un equipo que utiliza herramientas de IA duplica su producción por Sprint. Los Developers aprueban el código generado por IA con una revisión mínima, y los Sprint Reviews pasan apresuradamente por el doble de elementos. ¿Cuál es la causa raíz que mejor explica el riesgo empírico? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | AI-generated code is visible and documented, so no empirical pillar is genuinely threatened. |
| **a** ES | El código generado por IA es visible y está documentado, por lo que ningún pilar empírico está genuinamente amenazado. |
| **b** EN | Scrum events run on schedule, so inspection and adaptation cadence remains protected. |
| **b** ES | Los eventos de Scrum se ejecutan según lo programado, por lo que la cadencia de inspección y adaptación permanece protegida. |
| **c** EN | Output velocity has outpaced inspection capacity, making adaptation decisions unreliable. `<<KEY` |
| **c** ES | La velocidad de producción ha superado la capacidad de inspección, lo que hace que las decisiones de adaptación sean poco confiables. `<<KEY` |
| **d** EN | More increments per Sprint produce more inspection data, strengthening empirical process. |
| **d** ES | Más Increments por Sprint producen más datos de inspección, lo que fortalece el proceso empírico. |

**explanation**

| | |
|---|---|
| EN | Empiricism requires meaningful inspection before adaptation. When AI-driven output exceeds the team's cognitive capacity to review, inspection becomes superficial and adaptation lags reality. The claim that visibility alone preserves empiricism ignores whether the team can process what is visible. The claim that more data strengthens empiricism confuses volume with quality of inspection. The claim that on-schedule events protect empiricism ignores whether those events produce genuine understanding. |
| ES | El empirismo requiere una inspección significativa antes de la adaptación. Cuando la producción impulsada por IA supera la capacidad cognitiva del equipo para revisar, la inspección se vuelve superficial y la adaptación se rezaga respecto a la realidad. La afirmación de que la visibilidad por sí sola preserva el empirismo ignora si el equipo puede procesar lo que es visible. La afirmación de que más datos fortalecen el empirismo confunde el volumen con la calidad de la inspección. La afirmación de que los eventos realizados según lo programado protegen el empirismo ignora si dichos eventos producen una comprensión genuina. |

### 197. SM-AI-I · 1.7 · `d56397d4-017d-4ebb-9ed4-4e212127389b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 1.7: Analyze how AI-accelerated output can threaten empiricism, and how the Scrum Master safeguards inspection and adaptation

**stem**

| | |
|---|---|
| EN | A team adopts an AI coding assistant and triples output within two Sprints. Reviews proceed on schedule, but defects and misaligned features accumulate faster than they are caught. What does this pattern most directly indicate? |
| ES | Un equipo adopta un asistente de codificación con IA y triplica su producción en dos Sprints. Las revisiones se llevan a cabo según lo programado, pero los defectos y las funcionalidades desalineadas se acumulan más rápido de lo que se detectan. ¿Qué indica este patrón de manera más directa? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Sprints are too long; shortening them will provide sufficient inspection frequency for the higher volume. |
| **a** ES | Los Sprints son demasiado largos; acortarlos proporcionará una frecuencia de inspección suficiente para el mayor volumen. |
| **b** EN | Transparency has failed because AI-generated artifacts are not visible enough for stakeholders. |
| **b** ES | La transparencia ha fallado porque los artefactos generados por IA no son suficientemente visibles para los interesados. |
| **c** EN | The Definition of Done is too weak, and tightening it will restore the output-quality balance. |
| **c** ES | La Definition of Done es demasiado débil, y fortalecerla restaurará el equilibrio entre producción y calidad. |
| **d** EN | Inspection capacity has not scaled with output, so adaptation is lagging behind production. `<<KEY` |
| **d** ES | La capacidad de inspección no ha escalado junto con la producción, por lo que la adaptación va por detrás de la producción. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Accumulating defects and misaligned features despite on-schedule Reviews shows that the team's capacity to inspect work is outpaced by AI-driven production, causing adaptation to lag — a direct degradation of empiricism. Stronger documentation addresses transparency but not inspection throughput. Tightening the Definition of Done raises the quality bar but does not expand capacity to examine a tripled output stream. Shorter Sprints add checkpoints but do not increase how much the team can meaningfully inspect per unit of time. |
| ES | La acumulación de defectos y funcionalidades desalineadas, a pesar de que las Sprint Review se realizan según lo programado, demuestra que la capacidad del equipo para inspeccionar el trabajo es superada por la producción impulsada por IA, lo que provoca que la adaptación quede rezagada — una degradación directa del empirismo. Una documentación más sólida aborda la transparencia, pero no el rendimiento de la inspección. Fortalecer la Definition of Done eleva el estándar de calidad, pero no amplía la capacidad para examinar un flujo de producción triplicado. Los Sprints más cortos añaden puntos de control, pero no incrementan cuánto puede inspeccionar el equipo de manera significativa por unidad de tiempo. |

### 198. SM-AI-I · 2.1 · `4614158e-8caa-4358-ab15-ea5e7992686e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.1: Define the Scrum Team's composition and size constraints

**stem**

| | |
|---|---|
| EN | Two Scrum Teams work on the same product. According to the Scrum Guide, how many Product Owners should there be? |
| ES | Dos Scrum Teams trabajan en el mismo producto. Según la Guía de Scrum, ¿cuántos Product Owners debería haber? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | One Product Owner supported by a dedicated Business Analyst embedded in each team who acts as a day-to-day proxy |
| **a** ES | Un Product Owner respaldado por un Analista de Negocio dedicado integrado en cada equipo que actúa como proxy en el día a día |
| **b** EN | Two Product Owners, each independently managing and prioritizing their own separate portion of the shared Product Backlog |
| **b** ES | Dos Product Owners, cada uno gestionando y priorizando de forma independiente su propia porción separada del Product Backlog compartido |
| **c** EN | Two Product Owners whose competing priorities are aligned by a Chief Product Owner sitting above them in the hierarchy |
| **c** ES | Dos Product Owners cuyas prioridades en competencia son alineadas por un Chief Product Owner que se encuentra por encima de ellos en la jerarquía |
| **d** EN | One Product Owner accountable for the single Product Backlog shared by both teams `<<KEY` |
| **d** ES | Un Product Owner responsable del único Product Backlog compartido por ambos equipos `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide states there is one Product Backlog for one product, and therefore one Product Owner accountable for it, even when multiple Scrum Teams work on that product. Splitting ownership across teams or adding proxy Product Owners violates this principle. |
| ES | La Guía de Scrum establece que existe un Product Backlog para un producto, y por lo tanto un Product Owner responsable de él, incluso cuando múltiples Scrum Teams trabajan en ese producto. Dividir la responsabilidad entre equipos o agregar Product Owners proxy viola este principio. |

### 199. SM-AI-I · 2.1 · `9b16af2f-4b08-4181-adfa-2877e7c8c2c0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.1: Define the Scrum Team's composition and size constraints

**stem**

| | |
|---|---|
| EN | A tester, a UX designer, and two software engineers deliver a usable Increment together. How does the Scrum Guide classify these four people? |
| ES | Un tester, un diseñador de UX y dos ingenieros de software entregan juntos un Increment utilizable. ¿Cómo clasifica la Guía de Scrum a estas cuatro personas? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The tester belongs to an external QA team that validates the Increment before Done |
| **a** ES | El tester pertenece a un equipo de QA externo que valida el Increment antes de que esté Done |
| **b** EN | The UX designer is a stakeholder, not a Scrum Team member, because design precedes development |
| **b** ES | El diseñador de UX es un stakeholder, no un miembro del Scrum Team, porque el diseño precede al desarrollo |
| **c** EN | Only the engineers are Developers; the tester and designer are in separate sub-teams |
| **c** ES | Solo los ingenieros son Desarrolladores; el tester y el diseñador pertenecen a sub-equipos separados |
| **d** EN | All four are Developers, regardless of their individual specializations `<<KEY` |
| **d** ES | Los cuatro son Desarrolladores, independientemente de sus especializaciones individuales `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide defines Developers as anyone who works on creating the Increment each Sprint, regardless of specialty. Testers, designers, and analysts are all Developers if they contribute to the Increment; no separate sub-teams or external QA teams are required. |
| ES | La Guía de Scrum define a los Desarrolladores como cualquier persona que trabaja en la creación del Increment en cada Sprint, independientemente de su especialidad. Los testers, diseñadores y analistas son todos Desarrolladores si contribuyen al Increment; no se requieren sub-equipos separados ni equipos de QA externos. |

### 200. SM-AI-I · 2.10 · `59ca04d4-a881-43e1-91f4-25fa9af68477`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.10: Explain how AI agents participate in a Scrum Team as tools, and which accountabilities must remain human

**stem**

| | |
|---|---|
| EN | Which statement correctly distinguishes how an AI agent participates in a Scrum Team from how a Scrum Master participates? |
| ES | ¿Cuál afirmación distingue correctamente cómo participa un agente de IA en un Scrum Team en comparación con cómo participa un Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Because the Scrum Guide does not explicitly exclude AI, an organization may formally assign the Scrum Master role to an AI. |
| **a** ES | Dado que la Guía Scrum no excluye explícitamente a la IA, una organización puede asignar formalmente el rol de Scrum Master a una IA. |
| **b** EN | An AI and a Scrum Master are equivalent when the AI can facilitate events and surface impediments automatically. |
| **b** ES | Una IA y un Scrum Master son equivalentes cuando la IA puede facilitar eventos e identificar impedimentos automáticamente. |
| **c** EN | The Scrum Master accountability can be split, with the AI owning process enforcement and a human owning coaching. |
| **c** ES | La responsabilidad de Scrum Master puede dividirse: la IA se encarga de la aplicación del proceso y un humano del coaching. |
| **d** EN | An AI holds no Scrum accountability; the Scrum Master accountability must be held by a person who is answerable for it. `<<KEY` |
| **d** ES | Una IA no tiene ninguna responsabilidad de Scrum; la responsabilidad de Scrum Master debe ser asumida por una persona que responda por ella. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Scrum accountabilities are held by people; the Scrum Master is a person answerable for the accountability, not a function delegable to software. The Scrum Guide's silence on AI does not imply permission to assign accountabilities to non-human systems. Splitting an accountability between a human and an AI still leaves part of it with a non-human, which is not permissible. |
| ES | Las responsabilidades de Scrum son asumidas por personas; el Scrum Master es una persona responsable de dicha función, no una función delegable a un software. El silencio de la Guía Scrum sobre la IA no implica permiso para asignar responsabilidades a sistemas no humanos. Dividir una responsabilidad entre un humano y una IA sigue dejando parte de ella en manos de un no humano, lo cual no está permitido. |

### 201. SM-AI-I · 2.10 · `9f68009f-f6fa-4507-a0dd-ce93256dd09e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.10: Explain how AI agents participate in a Scrum Team as tools, and which accountabilities must remain human

**stem**

| | |
|---|---|
| EN | A team's AI assistant attends every event, generates summaries, and proposes improvements. A Developer says the AI has become a team member. Which description of the AI's status is correct? |
| ES | El asistente de IA de un equipo asiste a todos los eventos, genera resúmenes y propone mejoras. Un Developer dice que la IA se ha convertido en miembro del equipo. ¿Cuál descripción del estado de la IA es correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The AI is a team member because consistent participation in all Scrum events defines membership. |
| **a** ES | La IA es un miembro del equipo porque la participación constante en todos los eventos de Scrum define la membresía. |
| **b** EN | The AI holds partial Developer accountability because it contributes to self-management by reporting on Sprint Goal progress. |
| **b** ES | La IA tiene una responsabilidad parcial de Developer porque contribuye a la autogestión al reportar el progreso del Sprint Goal. |
| **c** EN | The AI becomes a team member once the team collectively acknowledges its contributions in a Retrospective. |
| **c** ES | La IA se convierte en miembro del equipo una vez que el equipo reconoce colectivamente sus contribuciones en una Retrospective. |
| **d** EN | The AI remains a tool; frequent participation in events does not confer membership or any Scrum accountability. `<<KEY` |
| **d** ES | La IA sigue siendo una herramienta; la participación frecuente en los eventos no le otorga membresía ni ninguna responsabilidad de Scrum. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Team membership and Scrum accountabilities are defined by human roles, not by frequency or visibility of participation. An AI generating summaries or suggestions is providing a service—it is a tool. No team decision or event attendance can transfer a Scrum accountability to a non-human system. |
| ES | La membresía en el equipo y las responsabilidades de Scrum están definidas por roles humanos, no por la frecuencia o visibilidad de la participación. Una IA que genera resúmenes o sugerencias está prestando un servicio: es una herramienta. Ninguna decisión del equipo ni asistencia a eventos puede transferir una responsabilidad de Scrum a un sistema no humano. |

### 202. SM-AI-I · 2.11 · `0896c92e-b1ef-4c94-a8aa-4ccc1b4e1584`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.11: Distinguish work a team may delegate to AI from the accountabilities it must retain

**stem**

| | |
|---|---|
| EN | A Product Owner wants to delegate backlog prioritization to an AI tool, reasoning that prioritization is purely analytical. What is the correct response? |
| ES | Un Product Owner quiere delegar la priorización del backlog a una herramienta de IA, argumentando que la priorización es puramente analítica. ¿Cuál es la respuesta correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Allow it — the analytical work is delegable, and the Product Owner retains accountability for the resulting order. |
| **a** ES | Permitirlo — el trabajo analítico es delegable, y el Product Owner retiene la responsabilidad sobre el orden resultante. |
| **b** EN | Allow it for lower-priority items only — routine sequencing is safely analytical, but high-value ordering requires human judgment. |
| **b** ES | Permitirlo solo para los elementos de menor prioridad — la secuenciación rutinaria es de manera segura analítica, pero la ordenación de alto valor requiere juicio humano. |
| **c** EN | Reject it — ordering the Product Backlog is a retained Product Owner accountability, not merely analytical work. `<<KEY` |
| **c** ES | Rechazarlo — ordenar el Product Backlog es una responsabilidad retenida del Product Owner, no simplemente trabajo analítico. `<<KEY` |
| **d** EN | Reject it unless the organization validates the AI tool, after which the Product Owner may delegate ordering without further review. |
| **d** ES | Rechazarlo a menos que la organización valide la herramienta de IA, tras lo cual el Product Owner puede delegar la ordenación sin revisión adicional. |

**explanation**

| | |
|---|---|
| EN | Backlog ordering is a retained Product Owner accountability, not merely analytical work. AI may generate analysis, value scores, or ranking suggestions, but the Product Owner must make the prioritization decision. Retaining accountability means the decision itself — not just the outcome — must remain with the Product Owner. Organizational tool validation does not convert retained accountabilities into delegable ones. |
| ES | La ordenación del backlog es una responsabilidad retenida del Product Owner, no simplemente trabajo analítico. La IA puede generar análisis, puntuaciones de valor o sugerencias de clasificación, pero el Product Owner debe tomar la decisión de priorización. Retener la responsabilidad significa que la decisión en sí — no solo el resultado — debe permanecer con el Product Owner. La validación organizacional de la herramienta no convierte las responsabilidades retenidas en delegables. |

### 203. SM-AI-I · 2.11 · `80a786db-97ee-456c-8177-14424d08a5b2`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.11: Distinguish work a team may delegate to AI from the accountabilities it must retain

**stem**

| | |
|---|---|
| EN | An AI tool generates a Definition of Done aligned with industry standards. What should the Scrum Team do? |
| ES | Una herramienta de IA genera una Definition of Done alineada con los estándares de la industria. ¿Qué debe hacer el Scrum Team? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Have the Scrum Master adopt it on the team's behalf, since Definition of Done maintenance is a facilitation responsibility. |
| **a** ES | Hacer que el Scrum Master la adopte en nombre del equipo, ya que el mantenimiento de la Definition of Done es una responsabilidad de facilitación. |
| **b** EN | Adopt it immediately — AI applies industry standards more consistently than manual team discussion can. |
| **b** ES | Adoptarla de inmediato — la IA aplica los estándares de la industria de manera más consistente que una discusión manual del equipo. |
| **c** EN | Treat it as a draft, then inspect and adapt it to fit the team's context before formally adopting it. `<<KEY` |
| **c** ES | Tratarla como un borrador, luego inspeccionarla y adaptarla al contexto del equipo antes de adoptarla formalmente. `<<KEY` |
| **d** EN | Submit it to the Product Owner for approval, since the Definition of Done affects release decisions. |
| **d** ES | Enviarla al Product Owner para su aprobación, ya que la Definition of Done afecta las decisiones de lanzamiento. |

**explanation**

| | |
|---|---|
| EN | AI may draft a Definition of Done, but the team retains accountability for it and must inspect the output before adoption. Adopting an AI-generated artifact without review surrenders a retained accountability, regardless of how well-calibrated the AI tool is. |
| ES | La IA puede redactar una Definition of Done, pero el equipo retiene la responsabilidad sobre ella y debe inspeccionar el resultado antes de adoptarla. Adoptar un artefacto generado por IA sin revisión supone renunciar a una responsabilidad retenida, independientemente de qué tan bien calibrada esté la herramienta de IA. |

### 204. SM-AI-I · 2.11 · `b898581c-9f5f-4a63-ba72-9715ee2a04a0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.11: Distinguish work a team may delegate to AI from the accountabilities it must retain

**stem**

| | |
|---|---|
| EN | A team asks whether an AI tool can run the Daily Scrum so the Scrum Master can focus on impediments. What should the team decide? |
| ES | Un equipo pregunta si una herramienta de IA puede facilitar el Daily Scrum para que el Scrum Master pueda enfocarse en los impedimentos. ¿Qué debería decidir el equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Allow it for the Daily Scrum only; human facilitation is required solely for the Retrospective and Sprint Review. |
| **a** ES | Permitirlo solo para el Daily Scrum; la facilitación humana se requiere únicamente para la Sprint Retrospective y el Sprint Review. |
| **b** EN | Allow it permanently; AI removes human bias from meeting flow and better supports team self-management. |
| **b** ES | Permitirlo de forma permanente; la IA elimina el sesgo humano del flujo de las reuniones y apoya mejor la autogestión del equipo. |
| **c** EN | Allow AI to draft agendas and capture notes, but keep a human accountable for facilitating the event itself. `<<KEY` |
| **c** ES | Permitir que la IA redacte agendas y tome notas, pero mantener a un ser humano responsable de facilitar el evento en sí. `<<KEY` |
| **d** EN | Allow it once the organization approves the tool; human oversight of facilitation then becomes optional. |
| **d** ES | Permitirlo una vez que la organización apruebe la herramienta; la supervisión humana de la facilitación se vuelve entonces opcional. |

**explanation**

| | |
|---|---|
| EN | Facilitation of Scrum events is a retained human accountability and cannot be delegated to AI regardless of the event type or tool approval status. AI may handle delegable tasks such as drafting agendas or capturing notes, but a human must remain accountable for facilitating the event itself. Restricting the requirement to only certain events, or treating tool approval as sufficient to remove human accountability, both misrepresent which responsibilities must stay human. |
| ES | La facilitación de los eventos de Scrum es una responsabilidad humana que debe conservarse y no puede delegarse a la IA, independientemente del tipo de evento o del estado de aprobación de la herramienta. La IA puede encargarse de tareas delegables como redactar agendas o tomar notas, pero un ser humano debe seguir siendo responsable de facilitar el evento en sí. Restringir el requisito solo a ciertos eventos, o considerar que la aprobación de la herramienta es suficiente para eliminar la responsabilidad humana, son interpretaciones que distorsionan qué responsabilidades deben permanecer en manos de personas. |

### 205. SM-AI-I · 2.11 · `e901f0f9-39f7-4c12-ba62-765f04140898`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.11: Distinguish work a team may delegate to AI from the accountabilities it must retain

**stem**

| | |
|---|---|
| EN | A Developer suggests letting an AI tool assign tasks to team members each day to optimize workload. How should the Scrum Master respond? |
| ES | Un Developer sugiere dejar que una herramienta de IA asigne tareas a los miembros del equipo cada día para optimizar la carga de trabajo. ¿Cómo debería responder el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Approve it — self-management applies to Sprint Goal decisions, not to daily task assignment, which is a logistical concern. |
| **a** ES | Aprobarlo — la autogestión aplica a las decisiones del Sprint Goal, no a la asignación diaria de tareas, que es una cuestión logística. |
| **b** EN | Approve it — AI removes managerial bias from distribution, which strengthens rather than undermines self-management. |
| **b** ES | Aprobarlo — la IA elimina el sesgo gerencial en la distribución, lo que fortalece en lugar de socavar la autogestión. |
| **c** EN | Escalate to the Product Owner — task assignment affects Sprint Goal delivery and falls under product accountability. |
| **c** ES | Escalar al Product Owner — la asignación de tareas afecta la entrega del Sprint Goal y cae bajo la responsabilidad del producto. |
| **d** EN | Reject it — self-management requires the team to decide who does what; AI may surface data but must not make assignments. `<<KEY` |
| **d** ES | Rechazarlo — la autogestión requiere que el equipo decida quién hace qué; la IA puede aportar datos pero no debe realizar asignaciones. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Self-management is a retained human accountability; the team decides who works on what, how, and when. AI may provide workload analysis to inform that decision, but delegating the decision itself to AI surrenders self-management. Optimization logic does not override this accountability. |
| ES | La autogestión es una responsabilidad humana retenida; el equipo decide quién trabaja en qué, cómo y cuándo. La IA puede proporcionar análisis de carga de trabajo para informar esa decisión, pero delegar la decisión en sí a la IA renuncia a la autogestión. La lógica de optimización no anula esta responsabilidad. |

### 206. SM-AI-I · 2.2 · `6db4be9a-0770-4bfb-8888-7e64aae7a037`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.2: Explain the Scrum Master's accountability for the Scrum Team's effectiveness

**stem**

| | |
|---|---|
| EN | A large impediment is blocking the team. The Scrum Master explains the situation and helps the team decide how to escalate it. Which understanding of the effectiveness accountability does this reflect? |
| ES | Un impedimento importante está bloqueando al equipo. El Scrum Master explica la situación y ayuda al equipo a decidir cómo escalarlo. ¿Qué comprensión de la responsabilidad de efectividad refleja esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Avoiding accountability, because the Scrum Master must personally remove all impediments. |
| **a** ES | Evasión de responsabilidad, porque el Scrum Master debe eliminar personalmente todos los impedimentos. |
| **b** EN | Facilitating the team's own capacity to address impediments, which enables effectiveness. `<<KEY` |
| **b** ES | Facilitar la capacidad propia del equipo para abordar impedimentos, lo cual habilita la efectividad. `<<KEY` |
| **c** EN | Misapplying the role, because impediment removal is solely a Developer responsibility. |
| **c** ES | Aplicación incorrecta del rol, porque la eliminación de impedimentos es responsabilidad exclusiva de los Developers. |
| **d** EN | Delegating a Scrum Master duty, which dilutes the Scrum Master's accountability for outcomes. |
| **d** ES | Delegación de una responsabilidad del Scrum Master, lo cual diluye su responsabilidad por los resultados. |

**explanation**

| | |
|---|---|
| EN | Effectiveness accountability means enabling the team to function well, which includes building the team's capacity to handle and escalate impediments rather than personally resolving every obstacle. The misconception that the Scrum Master must personally remove all impediments confuses facilitation with direct intervention. |
| ES | La responsabilidad de efectividad implica habilitar al equipo para que funcione bien, lo que incluye desarrollar la capacidad del equipo para gestionar y escalar impedimentos en lugar de resolver personalmente cada obstáculo. La idea errónea de que el Scrum Master debe eliminar personalmente todos los impedimentos confunde la facilitación con la intervención directa. |

### 207. SM-AI-I · 2.2 · `c94769f9-d4c1-4d57-9120-ae1b580e8d59`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.2: Explain the Scrum Master's accountability for the Scrum Team's effectiveness

**stem**

| | |
|---|---|
| EN | A Scrum Master spends most of their time tracking each Developer's daily tasks and reporting utilization metrics to management. Which Scrum concept does this behavior most directly misrepresent? |
| ES | Un Scrum Master dedica la mayor parte de su tiempo a rastrear las tareas diarias de cada Developer e informar métricas de utilización a la gerencia. ¿Qué concepto de Scrum representa de manera más incorrecta este comportamiento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Velocity tracking, because the SM should measure Sprint-over-Sprint velocity instead. |
| **a** ES | El seguimiento de la velocidad, porque el SM debería medir la velocidad Sprint a Sprint en su lugar. |
| **b** EN | The Product Owner's accountability, because all progress reporting belongs solely to the PO. |
| **b** ES | La responsabilidad del Product Owner, porque todos los informes de progreso pertenecen únicamente al PO. |
| **c** EN | The SM's accountability for team effectiveness, which is outcome-focused, not output-monitoring. `<<KEY` |
| **c** ES | La responsabilidad del SM por la efectividad del equipo, que está orientada a los resultados, no al monitoreo del rendimiento. `<<KEY` |
| **d** EN | Transparency, because utilization metrics are a valid Sprint artifact the SM must maintain. |
| **d** ES | La transparencia, porque las métricas de utilización son un artefacto válido del Sprint que el SM debe mantener. |

**explanation**

| | |
|---|---|
| EN | The SM's central accountability is team effectiveness: enabling Scrum, removing systemic obstacles, and fostering improvement — not monitoring individual output or reporting utilization upward. Claiming utilization metrics are a valid Sprint artifact is false; no such artifact exists in Scrum. Attributing all progress reporting to the Product Owner misses the core issue: the SM's role excludes project-management reporting entirely, regardless of who performs it. Substituting Sprint velocity for daily utilization still conflates effectiveness with an output metric, which is equally inconsistent with the SM's role. |
| ES | La responsabilidad central del SM es la efectividad del equipo: habilitar Scrum, eliminar obstáculos sistémicos y fomentar la mejora, no monitorear el rendimiento individual ni reportar la utilización hacia arriba. Afirmar que las métricas de utilización son un artefacto válido del Sprint es falso; no existe tal artefacto en Scrum. Atribuir todos los informes de progreso al Product Owner omite el problema central: el rol del SM excluye por completo los informes de gestión de proyectos, independientemente de quién los realice. Sustituir la utilización diaria por la velocidad del Sprint sigue confundiendo la efectividad con una métrica de rendimiento, lo cual es igualmente inconsistente con el rol del SM. |

### 208. SM-AI-I · 2.2 · `72f245b4-13fd-4229-b9e7-dc7a7fe91d98`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.2: Explain the Scrum Master's accountability for the Scrum Team's effectiveness

**stem**

| | |
|---|---|
| EN | A Scrum Master insists on facilitating every Developer technical discussion to ensure nothing falls outside Scrum norms. Which concept does this behaviour misrepresent? |
| ES | Un Scrum Master insiste en facilitar cada discusión técnica de los Developers para asegurarse de que nada quede fuera de las normas de Scrum. ¿Qué concepto representa incorrectamente este comportamiento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Developer self-management, but the behaviour is justified because the Scrum Master owns all Scrum events. |
| **a** ES | La autogestión de los Developers, pero el comportamiento está justificado porque el Scrum Master es dueño de todos los eventos de Scrum. |
| **b** EN | The Scrum Master's coaching role, which requires intervening only when Scrum ceremonies are at risk. |
| **b** ES | El rol de coaching del Scrum Master, que requiere intervenir solo cuando las ceremonias de Scrum están en riesgo. |
| **c** EN | The effectiveness accountability, which does not require the Scrum Master to attend every team interaction. `<<KEY` |
| **c** ES | La responsabilidad de efectividad, que no requiere que el Scrum Master asista a cada interacción del equipo. `<<KEY` |
| **d** EN | The Sprint Goal accountability, which belongs solely to Developers with no Scrum Master involvement. |
| **d** ES | La responsabilidad del Sprint Goal, que pertenece únicamente a los Developers sin ninguna participación del Scrum Master. |

**explanation**

| | |
|---|---|
| EN | The Scrum Master's effectiveness accountability does not extend to supervising every Developer conversation. Developers self-manage their technical work; the Scrum Master enables that self-management rather than inserting oversight into all interactions. |
| ES | La responsabilidad de efectividad del Scrum Master no se extiende a supervisar cada conversación de los Developers. Los Developers gestionan de manera autónoma su trabajo técnico; el Scrum Master habilita esa autogestión en lugar de insertar supervisión en todas las interacciones. |

### 209. SM-AI-I · 2.3 · `516acbe7-f33f-4c15-b107-0a3d9f614e52`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization

**stem**

| | |
|---|---|
| EN | The 2020 Scrum Guide names three groups the Scrum Master serves. Which option correctly lists all three? |
| ES | La Guía Scrum 2020 menciona tres grupos a los que sirve el Scrum Master. ¿Cuál opción los lista correctamente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Scrum Team, the Product Owner, and the organization. `<<KEY` |
| **a** ES | El Scrum Team, el Product Owner y la organización. `<<KEY` |
| **b** EN | The Developers, the Product Owner, and the Scrum Master themselves. |
| **b** ES | Los Developers, el Product Owner y el propio Scrum Master. |
| **c** EN | The Scrum Team, the Product Owner, and the stakeholders. |
| **c** ES | El Scrum Team, el Product Owner y los interesados. |
| **d** EN | The Scrum Team, the management layer, and the customers. |
| **d** ES | El Scrum Team, la capa gerencial y los clientes. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide dedicates three explicit sections to Scrum Master service: to the Scrum Team, to the Product Owner, and to the organization. Stakeholders, the management layer, and customers are not among the three named groups, and the Scrum Master is not listed as serving themselves. |
| ES | La Guía Scrum 2020 dedica tres secciones explícitas al servicio del Scrum Master: al Scrum Team, al Product Owner y a la organización. Los interesados, la capa gerencial y los clientes no están entre los tres grupos mencionados, y el Scrum Master no aparece listado como alguien que se sirve a sí mismo. |

### 210. SM-AI-I · 2.3 · `a3ed78b9-1706-469c-9496-c17fe17c6e68`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.3: List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization

**stem**

| | |
|---|---|
| EN | Which action is a Scrum Master service to the Product Owner, per the 2020 Scrum Guide? |
| ES | ¿Qué acción es un servicio del Scrum Master al Product Owner, según la Guía Scrum 2020? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Owning the Product Goal definition to relieve the Product Owner of strategic work. |
| **a** ES | Ser dueño de la definición del Product Goal para liberar al Product Owner del trabajo estratégico. |
| **b** EN | Helping the Product Owner establish effective stakeholder collaboration practices. `<<KEY` |
| **b** ES | Ayudar al Product Owner a establecer prácticas efectivas de colaboración con los interesados. `<<KEY` |
| **c** EN | Coaching the organization on Scrum adoption so the Product Owner can focus on delivery. |
| **c** ES | Entrenar a la organización en la adopción de Scrum para que el Product Owner pueda enfocarse en la entrega. |
| **d** EN | Making product decisions on the Product Owner's behalf when stakeholders demand quick answers. |
| **d** ES | Tomar decisiones de producto en nombre del Product Owner cuando los interesados exigen respuestas rápidas. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide explicitly lists helping the Product Owner with stakeholder collaboration as a Scrum Master service to the Product Owner. Making product decisions and owning the Product Goal are Product Owner accountabilities the Scrum Master must not absorb. Coaching the organization on Scrum adoption is a Scrum Master service to the organization, not specifically to the Product Owner. |
| ES | La Guía Scrum 2020 menciona explícitamente que ayudar al Product Owner con la colaboración con los interesados es un servicio del Scrum Master al Product Owner. Tomar decisiones de producto y ser dueño del Product Goal son responsabilidades del Product Owner que el Scrum Master no debe asumir. Entrenar a la organización en la adopción de Scrum es un servicio del Scrum Master a la organización, no específicamente al Product Owner. |

### 211. SM-AI-I · 2.3 · `d959dd16-5438-4643-a460-e7cfe44f6c45`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization

**stem**

| | |
|---|---|
| EN | How does the Scrum Master serve the Scrum Team regarding Scrum events, per the 2020 Scrum Guide? |
| ES | ¿Cómo sirve el Scrum Master al Scrum Team en relación con los eventos de Scrum, según la Guía Scrum 2020? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Scheduling and chairing each event as a neutral meeting facilitator. |
| **a** ES | Programando y presidiendo cada evento como facilitador neutral de reuniones. |
| **b** EN | Deciding which events to hold based on team workload each Sprint. |
| **b** ES | Decidiendo qué eventos realizar según la carga de trabajo del equipo en cada Sprint. |
| **c** EN | Delegating event facilitation to the most senior Developer. |
| **c** ES | Delegando la facilitación de eventos al Developer más experimentado. |
| **d** EN | Facilitating events as requested or needed so they achieve their purpose. `<<KEY` |
| **d** ES | Facilitando los eventos cuando se le solicita o se necesita, para que logren su propósito. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide states the Scrum Master facilitates Scrum events as requested or needed, ensuring they serve their intended purpose. Chairing meetings as a neutral host misses the accountability for purposeful outcomes. Deciding which events to skip contradicts the Guide's prescribed events. Delegating facilitation entirely to a Developer is not a described practice. |
| ES | La Guía Scrum 2020 establece que el Scrum Master facilita los eventos de Scrum cuando se le solicita o se necesita, asegurando que sirvan a su propósito previsto. Presidir reuniones como anfitrión neutral omite la responsabilidad de lograr resultados con propósito. Decidir qué eventos omitir contradice los eventos prescritos por la Guía. Delegar completamente la facilitación a un Developer no es una práctica descrita. |

### 212. SM-AI-I · 2.3 · `37f29e7b-0d82-4d75-b6b1-e1a83db369c4`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization

**stem**

| | |
|---|---|
| EN | How does the Scrum Master serve the Scrum Team regarding impediments, per the 2020 Scrum Guide? |
| ES | ¿Cómo sirve el Scrum Master al Scrum Team en relación con los impedimentos, según la Guía Scrum 2020? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Personally resolving every obstacle so Developers focus solely on Sprint work. |
| **a** ES | Resolviendo personalmente cada obstáculo para que los Developers se concentren únicamente en el trabajo del Sprint. |
| **b** EN | Causing the removal of impediments to the Scrum Team's progress. `<<KEY` |
| **b** ES | Provocando la eliminación de los impedimentos al progreso del Scrum Team. `<<KEY` |
| **c** EN | Escalating all impediments directly to management without team involvement. |
| **c** ES | Escalando todos los impedimentos directamente a la dirección sin involucrar al equipo. |
| **d** EN | Logging impediments in the backlog and assigning them to available Developers. |
| **d** ES | Registrando los impedimentos en el backlog y asignándolos a los Developers disponibles. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide states the Scrum Master serves the team by causing the removal of impediments — broader than personally fixing every obstacle, which removes team ownership. Logging impediments in the backlog and assigning them to Developers is not a described practice. Escalating all impediments to management without team involvement bypasses the collaborative approach the Guide promotes. |
| ES | La Guía Scrum 2020 establece que el Scrum Master sirve al equipo provocando la eliminación de impedimentos, lo cual es más amplio que resolver personalmente cada obstáculo, ya que esto último elimina la responsabilidad del equipo. Registrar impedimentos en el backlog y asignarlos a Developers no es una práctica descrita. Escalar todos los impedimentos a la dirección sin involucrar al equipo omite el enfoque colaborativo que promueve la Guía. |

### 213. SM-AI-I · 2.3 · `c165ec2e-d86b-4572-99a0-ad674aab074c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.3: List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization

**stem**

| | |
|---|---|
| EN | According to the 2020 Scrum Guide, how does the Scrum Master serve the organization? |
| ES | Según la Guía Scrum 2020, ¿cómo sirve el Scrum Master a la organización? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Filtering all communication between stakeholders and the Scrum Team. |
| **a** ES | Filtrando toda la comunicación entre los interesados y el Scrum Team. |
| **b** EN | Ensuring every team member is fully utilized with no idle time per Sprint. |
| **b** ES | Asegurándose de que cada miembro del equipo esté completamente utilizado sin tiempo inactivo por Sprint. |
| **c** EN | Owning the Agile transformation roadmap on behalf of leadership. |
| **c** ES | Siendo dueño del mapa de ruta de transformación Ágil en nombre del liderazgo. |
| **d** EN | Leading, training, and coaching the organization in its Scrum adoption. `<<KEY` |
| **d** ES | Liderando, capacitando y asesorando a la organización en su adopción de Scrum. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide explicitly states that the Scrum Master serves the organization by leading, training, and coaching it in Scrum adoption. Owning the transformation roadmap confuses coaching with management authority. Filtering stakeholder communication misrepresents the SM role, which facilitates collaboration rather than restricting it. Maximizing utilization conflates team effectiveness with resource management, which is not a Scrum Master accountability. |
| ES | La Guía Scrum 2020 establece explícitamente que el Scrum Master sirve a la organización liderándola, capacitándola y asesorándola en la adopción de Scrum. Ser dueño del mapa de ruta de transformación confunde el rol de coaching con la autoridad de gestión. Filtrar la comunicación con los interesados representa incorrectamente el rol del Scrum Master, que facilita la colaboración en lugar de restringirla. Maximizar la utilización confunde la efectividad del equipo con la gestión de recursos, lo cual no es una responsabilidad del Scrum Master. |

### 214. SM-AI-I · 2.4 · `ae90ef9d-ffab-451c-bf52-d563916a3b33`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain the Product Owner's accountability for maximizing product value

**stem**

| | |
|---|---|
| EN | The Product Owner is accountable for maximizing product value. What does 'product value' mean in the Scrum Guide? |
| ES | El Product Owner es responsable de maximizar el valor del producto. ¿Qué significa 'valor del producto' en la Guía de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Volume of backlog items delivered, since a larger throughput signals higher value potential. |
| **a** ES | El volumen de elementos del Product Backlog entregados, ya que un mayor rendimiento indica mayor potencial de valor. |
| **b** EN | Team velocity and throughput, since faster delivery directly increases organizational value. |
| **b** ES | La velocidad y el rendimiento del equipo, ya que una entrega más rápida incrementa directamente el valor organizacional. |
| **c** EN | Revenue generated by shipped features, the primary measurable expression of value. |
| **c** ES | Los ingresos generados por las funcionalidades entregadas, la expresión medible principal del valor. |
| **d** EN | Outcomes meaningful to customers and the business, varying by context and organization. `<<KEY` |
| **d** ES | Los resultados significativos para los clientes y el negocio, que varían según el contexto y la organización. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide leaves value deliberately broad: the Product Owner must understand what is valuable and maximize it, which varies by context and may include user satisfaction, risk reduction, strategic goals, or revenue. Reducing value to revenue alone, velocity, or backlog throughput each reflects a common but incorrect narrowing of the concept. |
| ES | La Guía de Scrum deja el concepto de valor deliberadamente amplio: el Product Owner debe comprender qué es valioso y maximizarlo, lo cual varía según el contexto y puede incluir la satisfacción del usuario, la reducción de riesgos, los objetivos estratégicos o los ingresos. Reducir el valor únicamente a ingresos, velocidad o rendimiento del Product Backlog refleja una simplificación común pero incorrecta del concepto. |

### 215. SM-AI-I · 2.4 · `e337266e-63ed-4315-984c-e27f2d7f128b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain the Product Owner's accountability for maximizing product value

**stem**

| | |
|---|---|
| EN | A Product Owner is on leave. The Scrum Master steps in to order the backlog and approve Sprint work. Which statement best characterizes this? |
| ES | Un Product Owner está de licencia. El Scrum Master interviene para ordenar el Product Backlog y aprobar el trabajo del Sprint. ¿Cuál afirmación caracteriza mejor esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Problematic, because combining both roles in one person conflicts with Scrum's defined accountabilities. `<<KEY` |
| **a** ES | Problemático, porque combinar ambos roles en una sola persona entra en conflicto con las responsabilidades definidas en Scrum. `<<KEY` |
| **b** EN | Acceptable if the Scrum Master consults stakeholders and reaches consensus before each decision. |
| **b** ES | Aceptable si el Scrum Master consulta a las partes interesadas y alcanza un consenso antes de cada decisión. |
| **c** EN | Acceptable temporarily, because the Scrum Master's role includes covering Product Owner duties during absences. |
| **c** ES | Aceptable temporalmente, porque el rol del Scrum Master incluye cubrir las funciones del Product Owner durante sus ausencias. |
| **d** EN | Acceptable because Developers can validate value decisions, offsetting any conflict of interest. |
| **d** ES | Aceptable porque los Developers pueden validar las decisiones de valor, compensando cualquier conflicto de interés. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide defines Product Owner and Scrum Master as separate accountabilities. A Scrum Master who also orders the backlog conflates two distinct roles, undermining the checks and balances Scrum establishes. Neither stakeholder consensus nor Developer validation resolves this structural conflict. |
| ES | La Guía de Scrum define al Product Owner y al Scrum Master como responsabilidades separadas. Un Scrum Master que también ordena el Product Backlog fusiona dos roles distintos, socavando los controles y equilibrios que Scrum establece. Ni el consenso de las partes interesadas ni la validación de los Developers resuelven este conflicto estructural. |

### 216. SM-AI-I · 2.4 · `ea42ed83-39b5-4432-af7f-c52a1b165d0d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain the Product Owner's accountability for maximizing product value

**stem**

| | |
|---|---|
| EN | Which statement correctly distinguishes the Product Owner's accountability from the Scrum Master's accountability? |
| ES | ¿Cuál afirmación distingue correctamente la responsabilidad del Product Owner de la del Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Product Owner maximizes team velocity; the Scrum Master ensures the product delivers business value. |
| **a** ES | El Product Owner maximiza la velocidad del equipo; el Scrum Master garantiza que el producto entregue valor de negocio. |
| **b** EN | The Product Owner owns the process; the Scrum Master owns the product vision and value strategy. |
| **b** ES | El Product Owner es dueño del proceso; el Scrum Master es dueño de la visión del producto y la estrategia de valor. |
| **c** EN | Both are jointly accountable for product value, with the Scrum Master checking the Product Owner's decisions. |
| **c** ES | Ambos son conjuntamente responsables del valor del producto, con el Scrum Master verificando las decisiones del Product Owner. |
| **d** EN | The Product Owner maximizes product value; the Scrum Master is accountable for team effectiveness and the Scrum process. `<<KEY` |
| **d** ES | El Product Owner maximiza el valor del producto; el Scrum Master es responsable de la efectividad del equipo y del proceso Scrum. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide assigns product value accountability to the Product Owner and Scrum process and team effectiveness accountability to the Scrum Master. These are distinct, non-overlapping accountabilities. Swapping or sharing them misrepresents the framework's intentional separation of concerns. |
| ES | La Guía de Scrum asigna la responsabilidad del valor del producto al Product Owner, y la responsabilidad del proceso Scrum y la efectividad del equipo al Scrum Master. Estas son responsabilidades distintas y no superpuestas. Intercambiarlas o compartirlas representa incorrectamente la separación intencional de responsabilidades del marco de trabajo. |

### 217. SM-AI-I · 2.4 · `f54cb241-5622-4835-8d3e-eca3b5444db9`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain the Product Owner's accountability for maximizing product value

**stem**

| | |
|---|---|
| EN | Once items are moved into a Sprint, what happens to the Product Owner's accountability for value? |
| ES | Una vez que los elementos se trasladan a un Sprint, ¿qué ocurre con la responsabilidad del Product Owner sobre el valor? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It transfers to the Developers, who are accountable for value inside the Sprint. |
| **a** ES | Se transfiere a los Developers, quienes son responsables del valor dentro del Sprint. |
| **b** EN | It remains with the Product Owner, because value accountability is continuous. `<<KEY` |
| **b** ES | Permanece con el Product Owner, porque la responsabilidad sobre el valor es continua. `<<KEY` |
| **c** EN | It is shared equally between the Product Owner and Developers for the Sprint's duration. |
| **c** ES | Se comparte en partes iguales entre el Product Owner y los Developers durante la duración del Sprint. |
| **d** EN | It transfers to the Scrum Master, who monitors progress and intervenes when value is at risk. |
| **d** ES | Se transfiere al Scrum Master, quien monitorea el progreso e interviene cuando el valor está en riesgo. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide assigns accountability for maximizing product value to the Product Owner without any Sprint-boundary exception. Developers are accountable for creating a usable Increment that meets the Definition of Done, but value accountability stays with the Product Owner continuously, not just during backlog ordering. |
| ES | La Guía de Scrum asigna la responsabilidad de maximizar el valor del producto al Product Owner sin ninguna excepción relacionada con los límites del Sprint. Los Developers son responsables de crear un Increment utilizable que cumpla con la Definition of Done, pero la responsabilidad sobre el valor permanece con el Product Owner de manera continua, no solo durante la ordenación del Product Backlog. |

### 218. SM-AI-I · 2.4 · `b85a1f94-10cf-4f28-a39d-a342fcc76b9e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.4: Explain the Product Owner's accountability for maximizing product value

**stem**

| | |
|---|---|
| EN | A five-person committee reaches consensus decisions and appoints one member to relay them to the Scrum Team. Which statement best describes this arrangement? |
| ES | Un comité de cinco personas toma decisiones por consenso y designa a un miembro para transmitirlas al Scrum Team. ¿Cuál enunciado describe mejor este acuerdo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It is effective because distributing value decisions across experts outperforms a single Product Owner. |
| **a** ES | Es efectivo porque distribuir las decisiones de valor entre expertos supera el desempeño de un único Product Owner. |
| **b** EN | It violates the one-person rule because the relay member lacks independent authority over value decisions. `<<KEY` |
| **b** ES | Viola la regla de una sola persona porque el miembro designado como enlace carece de autoridad independiente sobre las decisiones de valor. `<<KEY` |
| **c** EN | It is acceptable provided the committee finalizes decisions before each Sprint Planning session. |
| **c** ES | Es aceptable siempre que el comité finalice las decisiones antes de cada sesión de Sprint Planning. |
| **d** EN | It satisfies the one-person rule because a single individual communicates decisions to the team. |
| **d** ES | Satisface la regla de una sola persona porque un único individuo comunica las decisiones al equipo. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide requires the Product Owner to be one person with genuine accountability for maximizing product value—not a spokesperson relaying a committee's choices. When the appointed member cannot make independent value decisions, real accountability stays with the committee, violating the one-person rule. Having a single relay person does not satisfy the requirement if that person lacks decision-making authority. Timing consensus before Sprint Planning does not resolve the accountability gap, and distributing value decisions across a committee is explicitly contrary to how Scrum defines the Product Owner role. |
| ES | La Guía de Scrum requiere que el Product Owner sea una sola persona con responsabilidad genuina de maximizar el valor del producto, no un portavoz que transmite las decisiones de un comité. Cuando el miembro designado no puede tomar decisiones de valor de forma independiente, la responsabilidad real permanece en el comité, lo que viola la regla de una sola persona. Contar con una única persona de enlace no satisface el requisito si esa persona carece de autoridad para tomar decisiones. Alcanzar el consenso antes del Sprint Planning no resuelve la brecha de responsabilidad, y distribuir las decisiones de valor entre un comité es explícitamente contrario a cómo Scrum define el rol del Product Owner. |

### 219. SM-AI-I · 2.5 · `32fdf9c1-d6de-4306-a0a8-d4193bc3a28c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.5: Explain the Developers' four accountabilities

**stem**

| | |
|---|---|
| EN | Which statement correctly distinguishes the Definition of Done from acceptance criteria on individual Product Backlog items? |
| ES | ¿Cuál enunciado distingue correctamente la Definition of Done de los criterios de aceptación de los elementos individuales del Product Backlog? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The DoD is a minimum quality standard for every increment; acceptance criteria are item-specific and supplement the DoD. `<<KEY` |
| **a** ES | La DoD es un estándar mínimo de calidad para cada Increment; los criterios de aceptación son específicos del elemento y complementan la DoD. `<<KEY` |
| **b** EN | Acceptance criteria are the team's quality standard; the DoD is an item-level checklist the Product Owner approves. |
| **b** ES | Los criterios de aceptación son el estándar de calidad del equipo; la DoD es una lista de verificación a nivel de elemento que aprueba el Product Owner. |
| **c** EN | The DoD applies to the Sprint as a whole; acceptance criteria govern the quality of each individual increment. |
| **c** ES | La DoD aplica al Sprint en su conjunto; los criterios de aceptación rigen la calidad de cada Increment individual. |
| **d** EN | They are interchangeable; an item's acceptance criteria replace the team-wide DoD for that item. |
| **d** ES | Son intercambiables; los criterios de aceptación de un elemento reemplazan la DoD del equipo para ese elemento. |

**explanation**

| | |
|---|---|
| EN | The Definition of Done is a non-negotiable, team-wide quality standard that every increment must meet. Acceptance criteria are specific to individual items and add detail on top of the DoD rather than substituting for it. Treating them as interchangeable, reversing their roles, or misapplying the DoD to the Sprint rather than each increment are all common but incorrect mental models. |
| ES | La Definition of Done es un estándar de calidad no negociable a nivel de equipo que cada Increment debe cumplir. Los criterios de aceptación son específicos de elementos individuales y añaden detalle sobre la DoD en lugar de sustituirla. Tratarlos como intercambiables, invertir sus roles o aplicar incorrectamente la DoD al Sprint en lugar de a cada Increment son modelos mentales comunes pero incorrectos. |

### 220. SM-AI-I · 2.5 · `af126d7e-f428-4357-8703-e8273c4109f6`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.5: Explain the Developers' four accountabilities

**stem**

| | |
|---|---|
| EN | Which statement best describes mutual accountability among Developers in Scrum? |
| ES | ¿Cuál enunciado describe mejor la responsabilidad mutua entre los Developers en Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Each Developer is individually responsible for completing every Sprint Backlog item regardless of how work was divided. |
| **a** ES | Cada Developer es individualmente responsable de completar cada elemento del Sprint Backlog sin importar cómo se dividió el trabajo. |
| **b** EN | A Developer who finishes assigned tasks has met their accountability and need not assist others with remaining items. |
| **b** ES | Un Developer que termina sus tareas asignadas ha cumplido con su responsabilidad y no necesita ayudar a otros con los elementos pendientes. |
| **c** EN | Developers hold each other accountable as peers for the Sprint Goal, including helping teammates with open work. `<<KEY` |
| **c** ES | Los Developers se responsabilizan mutuamente como pares por el Sprint Goal, incluyendo ayudar a sus compañeros con el trabajo pendiente. `<<KEY` |
| **d** EN | The Scrum Master enforces mutual accountability by monitoring individual contributions and addressing underperformance. |
| **d** ES | El Scrum Master hace cumplir la responsabilidad mutua monitoreando las contribuciones individuales y abordando el bajo rendimiento. |

**explanation**

| | |
|---|---|
| EN | Mutual accountability in Scrum is peer-based: Developers hold one another responsible for the collective Sprint Goal, which includes stepping in to help when needed. It is not individual item ownership, and it is not enforced top-down by the Scrum Master. Finishing personal tasks does not discharge a Developer's shared accountability for the Sprint Goal. |
| ES | La responsabilidad mutua en Scrum es entre pares: los Developers se hacen responsables entre sí por el Sprint Goal colectivo, lo que incluye intervenir para ayudar cuando sea necesario. No se trata de la propiedad individual de elementos, ni es impuesta de arriba hacia abajo por el Scrum Master. Terminar las tareas personales no exime a un Developer de la responsabilidad compartida por el Sprint Goal. |

### 221. SM-AI-I · 2.5 · `ee7b7c19-9252-4f70-a143-be1bd459945a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.5: Explain the Developers' four accountabilities

**stem**

| | |
|---|---|
| EN | Who owns the Sprint Backlog according to the Scrum framework? |
| ES | ¿Quién es el dueño del Sprint Backlog según el marco de trabajo Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The whole Scrum Team owns it, so the Product Owner may add or reprioritize items at any point. |
| **a** ES | Todo el Scrum Team es dueño de él, por lo que el Product Owner puede agregar o repriorizar elementos en cualquier momento. |
| **b** EN | The Scrum Master owns it as process authority, ensuring Developers do not exceed their capacity. |
| **b** ES | El Scrum Master es su dueño como autoridad del proceso, asegurando que los Developers no excedan su capacidad. |
| **c** EN | The Developers own it; the Product Owner cannot add or reprioritize items without Developer consent. `<<KEY` |
| **c** ES | Los Developers son sus dueños; el Product Owner no puede agregar ni repriorizar elementos sin el consentimiento de los Developers. `<<KEY` |
| **d** EN | The Product Owner owns it because they are accountable for maximizing value from Developer work. |
| **d** ES | El Product Owner es su dueño porque es responsable de maximizar el valor del trabajo de los Developers. |

**explanation**

| | |
|---|---|
| EN | The Sprint Backlog is owned by the Developers alone; it is their plan for achieving the Sprint Goal. Attributing ownership to the whole Scrum Team incorrectly implies the Product Owner can intervene directly. Scrum Master ownership and Product Owner ownership both misplace this accountability. |
| ES | El Sprint Backlog es propiedad exclusiva de los Developers; es su plan para alcanzar el Sprint Goal. Atribuir la propiedad a todo el Scrum Team implica incorrectamente que el Product Owner puede intervenir directamente. La propiedad del Scrum Master y la del Product Owner ubican mal esta responsabilidad. |

### 222. SM-AI-I · 2.5 · `f0cfcac8-7327-4199-981a-cd54023eac59`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.5: Explain the Developers' four accountabilities

**stem**

| | |
|---|---|
| EN | No organizational Definition of Done exists. Who creates it? |
| ES | No existe una Definition of Done organizacional. ¿Quién la crea? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Developers, because they are accountable for quality and for defining what done means. `<<KEY` |
| **a** ES | Los Developers, porque son responsables de la calidad y de definir qué significa terminado. `<<KEY` |
| **b** EN | Each Developer independently, applying a personal DoD only to items they personally complete. |
| **b** ES | Cada Developer de forma independiente, aplicando una DoD personal solo a los elementos que completa personalmente. |
| **c** EN | The Product Owner, because the DoD defines what the customer considers a releasable increment. |
| **c** ES | El Product Owner, porque la DoD define lo que el cliente considera un Increment listo para liberar. |
| **d** EN | The Scrum Master, as part of their accountability for ensuring correct Scrum practices. |
| **d** ES | El Scrum Master, como parte de su responsabilidad de garantizar prácticas correctas de Scrum. |

**explanation**

| | |
|---|---|
| EN | When no organizational standard exists, the Developers create the Definition of Done, because quality is their accountability. Attributing it to the Product Owner conflates customer acceptance with team quality standards. Scrum Master ownership misplaces the accountability, and individual per-Developer DoDs contradict the team-wide standard Scrum requires. |
| ES | Cuando no existe un estándar organizacional, los Developers crean la Definition of Done, porque la calidad es su responsabilidad. Atribuírsela al Product Owner confunde la aceptación del cliente con los estándares de calidad del equipo. La propiedad del Scrum Master ubica mal la responsabilidad, y las DoD individuales por Developer contradicen el estándar a nivel de equipo que Scrum exige. |

### 223. SM-AI-I · 2.6 · `3f0deee1-f0f8-47b2-8b29-265475bc158f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.6: Apply "self-managing" to a described team scenario

**stem**

| | |
|---|---|
| EN | A newly formed Scrum Team argues they need no Scrum Master because they are self-managing and can handle all coaching internally. What should happen? |
| ES | Un Scrum Team recién formado argumenta que no necesita un Scrum Master porque son auto-gestionados y pueden manejar todo el coaching internamente. ¿Qué debería suceder? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Dissolve the role; self-managing teams are accountable for their own process improvement without external coaching. |
| **a** ES | Disolver el rol; los equipos auto-gestionados son responsables de su propia mejora de procesos sin coaching externo. |
| **b** EN | Replace the Scrum Master with a rotating team lead elected each Sprint to satisfy both self-management and coaching needs. |
| **b** ES | Reemplazar al Scrum Master con un líder rotativo elegido cada Sprint para satisfacer tanto las necesidades de autogestión como las de coaching. |
| **c** EN | Retain the Scrum Master; self-managing covers who, how, and what — it does not eliminate the Scrum Master's distinct accountabilities. `<<KEY` |
| **c** ES | Mantener al Scrum Master; la autogestión cubre quién, cómo y qué — no elimina las responsabilidades distintivas del Scrum Master. `<<KEY` |
| **d** EN | Keep the Scrum Master temporarily; self-managing teams eventually mature past the need for Scrum Master support. |
| **d** ES | Conservar al Scrum Master temporalmente; los equipos auto-gestionados eventualmente maduran más allá de la necesidad del apoyo del Scrum Master. |

**explanation**

| | |
|---|---|
| EN | Self-managing describes how the team governs its own work — who, how, and what — not the elimination of Scrum roles. The Scrum Master holds distinct accountabilities for coaching Scrum adoption that exist independently of the team's self-management authority. A rotating team lead does not fulfill those accountabilities, and the Scrum Guide does not treat the Scrum Master role as temporary. |
| ES | La autogestión describe cómo el equipo gobierna su propio trabajo — quién, cómo y qué — no la eliminación de los roles de Scrum. El Scrum Master tiene responsabilidades distintivas en el coaching de la adopción de Scrum que existen independientemente de la autoridad de autogestión del equipo. Un líder rotativo no cumple esas responsabilidades, y la Guía Scrum no trata el rol del Scrum Master como temporal. |

### 224. SM-AI-I · 2.6 · `40d5d539-24c3-44f3-825f-18ceed65e6c4`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.6: Apply "self-managing" to a described team scenario

**stem**

| | |
|---|---|
| EN | During Sprint Planning, the Scrum Master notices the Product Owner is telling each Developer exactly which tasks to perform and in what sequence. What should the Scrum Master do? |
| ES | Durante el Sprint Planning, el Scrum Master nota que el Product Owner le está diciendo a cada Developer exactamente qué tareas realizar y en qué secuencia. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Pause planning and escalate to senior management, because task assignment disputes are outside the Scrum Master's authority. |
| **a** ES | Pausar la planificación y escalar a la gerencia senior, porque las disputas sobre asignación de tareas están fuera de la autoridad del Scrum Master. |
| **b** EN | Allow it; the Product Owner's Sprint Planning authority extends to directing how Developers execute individual tasks. |
| **b** ES | Permitirlo; la autoridad del Product Owner en el Sprint Planning se extiende a dirigir cómo los Developers ejecutan las tareas individuales. |
| **c** EN | Ask Developers to elect a spokesperson who negotiates task assignments with the Product Owner on the team's behalf. |
| **c** ES | Pedir a los Developers que elijan un portavoz que negocie las asignaciones de tareas con el Product Owner en nombre del equipo. |
| **d** EN | Remind the Product Owner to clarify the Sprint Goal and backlog items, leaving task-level decisions to the Developers. `<<KEY` |
| **d** ES | Recordarle al Product Owner que debe clarificar el Sprint Goal y los elementos del backlog, dejando las decisiones a nivel de tareas a los Developers. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Product Owner clarifies backlog items and collaborates on the Sprint Goal, but Developers self-manage by deciding who works on what and how. Directing individual task execution violates the 'who' and 'how' dimensions of self-management. Electing a spokesperson adds an unnecessary layer. Escalating to management is disproportionate and outside the Scrum Master's defined response. |
| ES | El Product Owner clarifica los elementos del backlog y colabora en el Sprint Goal, pero los Developers se auto-gestionan al decidir quién trabaja en qué y cómo. Dirigir la ejecución de tareas individuales viola las dimensiones de 'quién' y 'cómo' de la autogestión. Elegir un portavoz agrega una capa innecesaria. Escalar a la gerencia es desproporcionado y está fuera de la respuesta definida del Scrum Master. |

### 225. SM-AI-I · 2.6 · `7b0589d1-2e3c-45cf-a401-924b867c7c7e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.6: Apply "self-managing" to a described team scenario

**stem**

| | |
|---|---|
| EN | Two Developers leave mid-project. The remaining Developers recruit replacements themselves, citing self-management. Should the Scrum Master support this? |
| ES | Dos Developers abandonan el proyecto a mitad de camino. Los Developers restantes reclutan reemplazos ellos mismos, alegando autogestión. ¿Debería el Scrum Master apoyar esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No — only the Product Owner may approve membership changes because the Product Owner is accountable for value delivery. |
| **a** ES | No — solo el Product Owner puede aprobar cambios de membresía porque el Product Owner es responsable de la entrega de valor. |
| **b** EN | Yes — self-managing includes controlling team membership, so Developers may change composition without organizational involvement. |
| **b** ES | Sí — la autogestión incluye controlar la membresía del equipo, por lo que los Developers pueden cambiar la composición sin la participación de la organización. |
| **c** EN | No — self-managing covers who performs Sprint work internally, not authority to change the Scrum Team's composition. `<<KEY` |
| **c** ES | No — la autogestión cubre quién realiza el trabajo del Sprint internamente, no la autoridad para cambiar la composición del Scrum Team. `<<KEY` |
| **d** EN | Yes — the 2020 expansion of 'who' within self-managing grants the team full staffing authority over their own membership. |
| **d** ES | Sí — la expansión de 'quién' en la autogestión de 2020 otorga al equipo plena autoridad de contratación sobre su propia membresía. |

**explanation**

| | |
|---|---|
| EN | The 'who' dimension of self-managing refers to who among existing team members performs which work items — not authority to hire or replace members, which remains an organizational responsibility. Conflating staffing authority with work-assignment autonomy misreads self-management scope. Assigning membership approval solely to the Product Owner also misreads the Scrum Guide; that is an organizational, not a Product Owner, responsibility. |
| ES | La dimensión de 'quién' en la autogestión se refiere a quién, entre los miembros existentes del equipo, realiza qué elementos de trabajo — no la autoridad para contratar o reemplazar miembros, lo cual sigue siendo una responsabilidad organizacional. Confundir la autoridad de contratación con la autonomía de asignación de trabajo malinterpreta el alcance de la autogestión. Asignar la aprobación de membresía únicamente al Product Owner también malinterpreta la Guía Scrum; esa es una responsabilidad organizacional, no del Product Owner. |

### 226. SM-AI-I · 2.6 · `2faab9a1-1e18-464a-9d92-8da1fec6de12`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.6: Apply "self-managing" to a described team scenario

**stem**

| | |
|---|---|
| EN | A manager tells the Developers which team member must lead each Sprint's technical tasks. The Developers accept this. Which statement best describes this situation? |
| ES | Un gerente le dice a los Developers qué miembro del equipo debe liderar las tareas técnicas de cada Sprint. Los Developers aceptan esto. ¿Cuál enunciado describe mejor esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Acceptable: self-managing replaced self-organizing in name only, so external coordination of roles remains valid. |
| **a** ES | Aceptable: la autogestión reemplazó a la auto-organización solo en nombre, por lo que la coordinación externa de roles sigue siendo válida. |
| **b** EN | Acceptable: self-managing governs collective decisions, not individual task leadership within the team. |
| **b** ES | Aceptable: la autogestión rige las decisiones colectivas, no el liderazgo individual de tareas dentro del equipo. |
| **c** EN | A violation: the 2020 Scrum Guide gives Developers autonomy over who does the work, which the manager is overriding. `<<KEY` |
| **c** ES | Una violación: la Guía Scrum 2020 otorga a los Developers autonomía sobre quién realiza el trabajo, lo cual el gerente está anulando. `<<KEY` |
| **d** EN | A violation only if the manager also dictates the Sprint Goal, since 'what' is the dimension that truly defines self-management. |
| **d** ES | Una violación solo si el gerente también dicta el Sprint Goal, ya que el 'qué' es la dimensión que verdaderamente define la autogestión. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide defines self-managing as the Developers deciding who, how, and what to work on. An external manager assigning task leadership overrides the 'who' dimension, directly violating self-management. The claim that self-managing and self-organizing are interchangeable is incorrect: the 2020 shift explicitly expanded autonomy to include 'who', which the pre-2020 term did not cover. Limiting the violation to the 'what' dimension misreads the Guide, because all three dimensions — who, how, and what — are protected under self-management. |
| ES | La Guía Scrum 2020 define la autogestión como la capacidad de los Developers para decidir quién, cómo y en qué trabajar. Un gerente externo que asigna el liderazgo de tareas anula la dimensión del 'quién', violando directamente la autogestión. La afirmación de que autogestión y auto-organización son intercambiables es incorrecta: el cambio de 2020 amplió explícitamente la autonomía para incluir el 'quién', algo que el término anterior a 2020 no contemplaba. Limitar la violación únicamente a la dimensión del 'qué' es una interpretación errónea de la Guía, ya que las tres dimensiones —quién, cómo y qué— están protegidas bajo la autogestión. |

### 227. SM-AI-I · 2.6 · `e7460496-76a1-4fac-af43-66dae3ab7a4d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.6: Apply "self-managing" to a described team scenario

**stem**

| | |
|---|---|
| EN | A Scrum Master learns 'self-organizing' was deprecated in 2020 and concludes teams now need more external direction. What action reflects a correct understanding? |
| ES | Un Scrum Master se entera de que 'auto-organizado' quedó en desuso en 2020 y concluye que los equipos ahora necesitan más dirección externa. ¿Qué acción refleja una comprensión correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continue releasing control; the shift expanded team autonomy to include who and what, not a call for more oversight. `<<KEY` |
| **a** ES | Continuar cediendo el control; el cambio amplió la autonomía del equipo para incluir quién y qué, no un llamado a mayor supervisión. `<<KEY` |
| **b** EN | Maintain prior practices unchanged; 'self-managing' carries the same meaning as 'self-organizing' in practical application. |
| **b** ES | Mantener las prácticas anteriores sin cambios; 'auto-gestionado' tiene el mismo significado que 'auto-organizado' en la aplicación práctica. |
| **c** EN | Assign an internal coordinator role; replacing 'self-organizing' implies a need for structured internal team leadership. |
| **c** ES | Asignar un rol de coordinador interno; reemplazar 'auto-organizado' implica la necesidad de un liderazgo interno estructurado del equipo. |
| **d** EN | Increase managerial check-ins; deprecating 'self-organizing' signals teams proved unable to govern themselves adequately. |
| **d** ES | Aumentar las revisiones gerenciales; dejar en desuso 'auto-organizado' indica que los equipos demostraron ser incapaces de gobernarse adecuadamente por sí mismos. |

**explanation**

| | |
|---|---|
| EN | The 2020 shift to 'self-managing' expanded team autonomy by adding 'who' and 'what' dimensions — it was not a restriction. Increasing managerial check-ins inverts the intent of the change. Assigning an internal coordinator misreads self-managing as requiring structured leadership. Treating the change as cosmetic ignores the meaningful scope expansion the 2020 Scrum Guide introduced. |
| ES | El cambio de 2020 a 'auto-gestionado' amplió la autonomía del equipo al agregar las dimensiones de 'quién' y 'qué' — no fue una restricción. Aumentar las revisiones gerenciales invierte la intención del cambio. Asignar un coordinador interno malinterpreta la autogestión como si requiriera liderazgo estructurado. Tratar el cambio como cosmético ignora la significativa expansión del alcance que introdujo la Guía Scrum 2020. |

### 228. SM-AI-I · 2.7 · `018bfc24-b9a6-4eac-b6a8-7e9092b8a8fe`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.7: Identify accountability boundary violations

**stem**

| | |
|---|---|
| EN | A Scrum Master sends management weekly reports on each Developer's individual velocity and maintains a personal impediment backlog. What dysfunction do both behaviors share? |
| ES | Un Scrum Master envía a la gerencia informes semanales sobre la velocidad individual de cada Developer y mantiene un backlog personal de impedimentos. ¿Qué disfunción comparten ambos comportamientos? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Only the impediment backlog is a violation; tracking and sharing Developer velocity with management is a recognized Scrum Master transparency responsibility. |
| **a** ES | Solo el backlog de impedimentos es una violación; rastrear y compartir la velocidad de los Developers con la gerencia es una responsabilidad de transparencia reconocida del Scrum Master. |
| **b** EN | Both breach the Product Owner's transparency obligations by bypassing the PO's authority to approve and distribute team metrics to management stakeholders. |
| **b** ES | Ambos incumplen las obligaciones de transparencia del Product Owner al eludir la autoridad del PO para aprobar y distribuir métricas del equipo a los interesados de la gerencia. |
| **c** EN | Both replicate project-manager functions—individual productivity reporting and sole ownership of impediment resolution—that fall outside the Scrum Master's accountability. `<<KEY` |
| **c** ES | Ambos replican funciones de gerente de proyecto —reporte de productividad individual y propiedad exclusiva de la resolución de impedimentos— que están fuera de la responsabilidad del Scrum Master. `<<KEY` |
| **d** EN | Only the velocity reporting is a violation; maintaining a personal impediment backlog is an accepted Scrum Master practice for ensuring impediments are resolved promptly. |
| **d** ES | Solo el reporte de velocidad es una violación; mantener un backlog personal de impedimentos es una práctica aceptada del Scrum Master para garantizar que los impedimentos se resuelvan con prontitud. |

**explanation**

| | |
|---|---|
| EN | Both behaviors mirror classic project-manager functions that fall outside the Scrum Master's accountability. Tracking individual productivity for management treats Developers as resources to be monitored, and owning a personal impediment backlog positions the Scrum Master as a solo resolver rather than a collaborative coach. Options that treat only one behavior as a violation miss the shared root cause: the Scrum Master acting as a project manager. The Product Owner has no gating role over internal team metrics. |
| ES | Ambos comportamientos reflejan funciones clásicas de gerente de proyecto que están fuera de la responsabilidad del Scrum Master. Rastrear la productividad individual para la gerencia trata a los Developers como recursos a monitorear, y ser dueño de un backlog personal de impedimentos posiciona al Scrum Master como un resolutor en solitario en lugar de un coach colaborativo. Las opciones que tratan solo uno de los comportamientos como una violación pasan por alto la causa raíz compartida: el Scrum Master actuando como gerente de proyecto. El Product Owner no tiene un rol de control sobre las métricas internas del equipo. |

### 229. SM-AI-I · 2.7 · `20bb606b-8db6-4d1b-8596-477448066802`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.7: Identify accountability boundary violations

**stem**

| | |
|---|---|
| EN | A Scrum Master sends weekly reports to senior management detailing each Developer's story points and individual velocity. Which statement best diagnoses this? |
| ES | Un Scrum Master envía informes semanales a la alta gerencia detallando los story points y la velocidad individual de cada Desarrollador. ¿Cuál enunciado diagnostica mejor esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A violation, because tracking and reporting individual performance to management is a project-manager anti-pattern. `<<KEY` |
| **a** ES | Una violación, porque rastrear y reportar el desempeño individual a la gerencia es un antipatrón de gerente de proyectos. `<<KEY` |
| **b** EN | Acceptable, because the SM is accountable for communicating team health and productivity to stakeholders. |
| **b** ES | Aceptable, porque el SM es responsable de comunicar la salud y productividad del equipo a los interesados. |
| **c** EN | Acceptable, because the SM needs individual velocity data to coach Developers toward improvement. |
| **c** ES | Aceptable, porque el SM necesita datos de velocidad individual para orientar a los Desarrolladores hacia la mejora. |
| **d** EN | A violation, because only the PO is accountable for reporting Sprint outcomes and value to management. |
| **d** ES | Una violación, porque solo el PO es responsable de reportar los resultados del Sprint y el valor a la gerencia. |

**explanation**

| | |
|---|---|
| EN | Tracking and reporting individual Developer performance to management is a project-manager anti-pattern that undermines self-management and psychological safety. The Scrum Master serves the team and organization by enabling Scrum, not by acting as a performance monitor. Neither the SM nor the PO has an accountability to produce individual performance reports for management. |
| ES | Rastrear y reportar el desempeño individual de los Desarrolladores a la gerencia es un antipatrón de gerente de proyectos que socava la auto-gestión y la seguridad psicológica. El Scrum Master sirve al equipo y a la organización habilitando Scrum, no actuando como monitor de desempeño. Ni el SM ni el PO tienen la responsabilidad de producir informes de desempeño individual para la gerencia. |

### 230. SM-AI-I · 2.7 · `cdd9a008-1c1b-439b-8a54-0f8e220a93ef`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 2.7: Identify accountability boundary violations

**stem**

| | |
|---|---|
| EN | A line manager attends every Daily Scrum, asks Developers for updates, and redirects their work mid-Sprint. The Scrum Master allows this because the manager is a key stakeholder. What boundary violation is occurring? |
| ES | Un gerente de línea asiste a cada Daily Scrum, solicita actualizaciones a los Desarrolladores y redirige su trabajo durante el Sprint. El Scrum Master lo permite porque el gerente es un interesado clave. ¿Qué violación de límites está ocurriendo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No boundary is violated; stakeholders may attend Daily Scrum and the SM may defer to organizational authority. |
| **a** ES | No se viola ningún límite; los interesados pueden asistir al Daily Scrum y el SM puede deferir a la autoridad organizacional. |
| **b** EN | The Product Owner is violating their boundary by not shielding the Sprint Goal from the manager's scope changes. |
| **b** ES | El Product Owner está violando su límite al no proteger el Sprint Goal de los cambios de alcance del gerente. |
| **c** EN | The Scrum Master is violating their boundary by failing to protect Developers' self-management and the Daily Scrum's integrity. `<<KEY` |
| **c** ES | El Scrum Master está violando su límite al no proteger la auto-gestión de los Desarrolladores ni la integridad del Daily Scrum. `<<KEY` |
| **d** EN | The Developers are violating their boundary by engaging the manager instead of raising the interference at the Sprint Retrospective. |
| **d** ES | Los Desarrolladores están violando su límite al involucrarse con el gerente en lugar de plantear la interferencia en el Sprint Retrospective. |

**explanation**

| | |
|---|---|
| EN | The Scrum Master is accountable for ensuring Scrum is enacted, which includes protecting the Daily Scrum as a Developers-only planning event and shielding the team from external interference. Allowing a manager to redirect work mid-Sprint is a failure of that accountability. The Daily Scrum is not a stakeholder status meeting, and deference to organizational authority does not override Scrum's structural rules. |
| ES | El Scrum Master es responsable de garantizar que Scrum se lleve a cabo, lo cual incluye proteger el Daily Scrum como un evento de planificación exclusivo para los Desarrolladores y proteger al equipo de interferencias externas. Permitir que un gerente redirija el trabajo durante el Sprint es un incumplimiento de esa responsabilidad. El Daily Scrum no es una reunión de estado para interesados, y la deferencia a la autoridad organizacional no anula las reglas estructurales de Scrum. |

### 231. SM-AI-I · 2.7 · `e8f2dd0c-504c-45e0-aa3a-b83922c58af7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.7: Identify accountability boundary violations

**stem**

| | |
|---|---|
| EN | The Scrum Master sees the team repeatedly skip Definition of Done steps due to time pressure, then concludes this is solely a Developer accountability and takes no action. Which analysis is correct? |
| ES | El Scrum Master observa que el equipo omite repetidamente los pasos de la Definition of Done debido a la presión del tiempo, y concluye que esto es únicamente responsabilidad de los Desarrolladores y no toma ninguna acción. ¿Cuál análisis es correcto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Correct; the DoD is owned by Developers, so the SM has no standing to intervene in quality decisions. |
| **a** ES | Correcto; la DoD es propiedad de los Desarrolladores, por lo que el SM no tiene autoridad para intervenir en las decisiones de calidad. |
| **b** EN | Wrong; the SM must enforce the DoD by directly rejecting Increment items that fail quality criteria. |
| **b** ES | Incorrecto; el SM debe hacer cumplir la DoD rechazando directamente los elementos del Increment que no cumplen los criterios de calidad. |
| **c** EN | Wrong; the SM is accountable for ensuring Scrum is enacted, which includes coaching consistent adherence to the DoD. `<<KEY` |
| **c** ES | Incorrecto; el SM es responsable de garantizar que Scrum se lleve a cabo, lo que incluye orientar el cumplimiento consistente de la Definition of Done. `<<KEY` |
| **d** EN | Partially correct; the SM should report DoD violations to the PO, who is accountable for quality standards. |
| **d** ES | Parcialmente correcto; el SM debe reportar las violaciones de la DoD al PO, quien es responsable de los estándares de calidad. |

**explanation**

| | |
|---|---|
| EN | The Scrum Master is accountable for causing Scrum to be understood and enacted effectively, which includes coaching the team on consistent application of the Definition of Done. Treating DoD violations as purely a Developer matter neglects the SM's coaching accountability. Rejecting Increment items belongs to the Product Owner, not the SM, so direct enforcement by the SM would itself be a boundary violation. |
| ES | El Scrum Master es responsable de lograr que Scrum sea comprendido y aplicado de manera efectiva, lo que incluye orientar al equipo en la aplicación consistente de la Definition of Done. Tratar las violaciones de la DoD como un asunto puramente de los Desarrolladores descuida la responsabilidad de coaching del SM. Rechazar elementos del Increment corresponde al Product Owner, no al SM, por lo que la aplicación directa por parte del SM sería en sí misma una violación de límites. |

### 232. SM-AI-I · 2.8 · `42f2da5f-390c-4f51-ab78-3a45ff3bbeb1`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.8: Explain cross-functionality as a property of the whole Scrum Team

**stem**

| | |
|---|---|
| EN | Two Scrum Team members both have deep expertise in automated testing. A stakeholder argues this overlap violates cross-functionality. Which statement best explains why the stakeholder is mistaken? |
| ES | Dos miembros de un Scrum Team tienen profunda experiencia en pruebas automatizadas. Un stakeholder argumenta que esta superposición viola la interfuncionalidad. ¿Cuál enunciado explica mejor por qué el stakeholder está equivocado? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Cross-functionality requires unique depth per member, so one tester should be replaced with a different specialism. |
| **a** ES | La interfuncionalidad requiere profundidad única por miembro, por lo que uno de los testers debería ser reemplazado por alguien con una especialización diferente. |
| **b** EN | Cross-functionality is a whole-team property about covering all necessary skills, not a rule against shared depth areas. `<<KEY` |
| **b** ES | La interfuncionalidad es una propiedad del equipo completo que consiste en cubrir todas las habilidades necesarias, no una regla en contra de áreas de profundidad compartidas. `<<KEY` |
| **c** EN | Cross-functionality only prohibits overlap in breadth areas; depth areas may freely overlap without any concern. |
| **c** ES | La interfuncionalidad solo prohíbe la superposición en áreas de amplitud; las áreas de profundidad pueden superponerse libremente sin ninguna preocupación. |
| **d** EN | Cross-functionality is irrelevant to skill distribution; it only describes whether the team works across multiple products. |
| **d** ES | La interfuncionalidad es irrelevante para la distribución de habilidades; solo describe si el equipo trabaja en múltiples productos. |

**explanation**

| | |
|---|---|
| EN | Cross-functionality means the team collectively covers all skills needed to deliver value — it imposes no requirement that each member's depth be unique. Overlapping depth areas can improve resilience and capacity. The misconception that redundancy violates cross-functionality confuses team-level coverage with individual differentiation. Restricting overlap to breadth areas only, or requiring unique specialisms, are not cross-functionality rules. |
| ES | La interfuncionalidad significa que el equipo cubre colectivamente todas las habilidades necesarias para entregar valor — no impone el requisito de que la profundidad de cada miembro sea única. Las áreas de profundidad superpuestas pueden mejorar la resiliencia y la capacidad. La idea errónea de que la redundancia viola la interfuncionalidad confunde la cobertura a nivel de equipo con la diferenciación individual. Restringir la superposición solo a las áreas de amplitud, o exigir especializaciones únicas, no son reglas de interfuncionalidad. |

### 233. SM-AI-I · 2.8 · `6cb8c1c3-f268-4915-81b9-310c4d669ba6`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.8: Explain cross-functionality as a property of the whole Scrum Team

**stem**

| | |
|---|---|
| EN | A hiring manager plans to recruit one person per department — design, development, testing, and operations — so each covers their area independently. Which property of cross-functional teams does this plan misunderstand? |
| ES | Un gerente de contratación planea reclutar a una persona por departamento — diseño, desarrollo, pruebas y operaciones — para que cada una cubra su área de forma independiente. ¿Qué propiedad de los equipos interfuncionales malinterpreta este plan? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Cross-functional teams collaborate toward shared goals using combined skills; the plan creates departmental silos with separate ownership instead. `<<KEY` |
| **a** ES | Los equipos interfuncionales colaboran hacia objetivos compartidos usando habilidades combinadas; el plan crea silos departamentales con responsabilidad separada en su lugar. `<<KEY` |
| **b** EN | Cross-functional teams must span multiple products; staffing one team for one product contradicts the cross-functional principle. |
| **b** ES | Los equipos interfuncionales deben abarcar múltiples productos; asignar personal a un equipo para un solo producto contradice el principio interfuncional. |
| **c** EN | Cross-functional teams must avoid skill overlap, so one specialist per discipline fully satisfies the cross-functionality requirement. |
| **c** ES | Los equipos interfuncionales deben evitar la superposición de habilidades, por lo que un especialista por disciplina satisface completamente el requisito de interfuncionalidad. |
| **d** EN | Cross-functional teams require generalists; hiring one specialist per discipline produces an I-shaped team the Scrum Guide prohibits. |
| **d** ES | Los equipos interfuncionales requieren generalistas; contratar a un especialista por disciplina produce un equipo en forma de I que la Guía Scrum prohíbe. |

**explanation**

| | |
|---|---|
| EN | Cross-functionality means the team works together toward shared goals using its combined skill set — not that each representative independently owns and completes their department's slice. The departmental-representative model produces handoffs and siloed ownership, which is the opposite of cross-functional collaboration. Avoiding skill overlap, mandating generalists, and spanning multiple products are not cross-functionality requirements. |
| ES | La interfuncionalidad significa que el equipo trabaja en conjunto hacia objetivos compartidos usando su conjunto combinado de habilidades — no que cada representante sea dueño y complete de forma independiente la parte de su departamento. El modelo de representante departamental produce transferencias y responsabilidad en silos, que es lo opuesto a la colaboración interfuncional. Evitar la superposición de habilidades, exigir generalistas y abarcar múltiples productos no son requisitos de interfuncionalidad. |

### 234. SM-AI-I · 2.8 · `857a3eee-8599-4854-b204-76fb88b2e120`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.8: Explain cross-functionality as a property of the whole Scrum Team

**stem**

| | |
|---|---|
| EN | A Scrum Team consistently routes security tasks to an external department because no team member has that expertise. Which concept best describes this situation? |
| ES | Un Scrum Team rutinariamente deriva las tareas de seguridad a un departamento externo porque ningún miembro del equipo tiene esa experiencia. ¿Qué concepto describe mejor esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A T-shaped skills gap: each existing member must individually develop deep security expertise before the next Sprint. |
| **a** ES | Una brecha en habilidades en forma de T: cada miembro existente debe desarrollar individualmente una profunda experiencia en seguridad antes del próximo Sprint. |
| **b** EN | An acceptable arrangement, since no team can be fully self-sufficient and external specialists are a normal complement. |
| **b** ES | Un arreglo aceptable, ya que ningún equipo puede ser completamente autosuficiente y los especialistas externos son un complemento normal. |
| **c** EN | A role-boundary issue: the Scrum Master should acquire security skills to complete the team's competency coverage. |
| **c** ES | Un problema de límites de rol: el Scrum Master debe adquirir habilidades de seguridad para completar la cobertura de competencias del equipo. |
| **d** EN | A team-formation problem: the team lacks a skill needed to deliver value, undermining its cross-functional property. `<<KEY` |
| **d** ES | Un problema de formación del equipo: al equipo le falta una habilidad necesaria para entregar valor, lo que socava su propiedad interfuncional. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | When a team must rely on an external group for work that is part of delivering value, it has a team-formation problem — a missing skill that breaks the cross-functional property. Cross-functional teams should be self-sufficient for the skills their work requires; persistent external dependency signals a gap, not an acceptable steady state. Requiring each individual to develop deep security expertise, or assigning that responsibility to the Scrum Master, misrepresents both T-shaped skills and Scrum role accountabilities. |
| ES | Cuando un equipo debe depender de un grupo externo para realizar trabajo que forma parte de la entrega de valor, tiene un problema de formación del equipo — una habilidad faltante que rompe la propiedad interfuncional. Los equipos interfuncionales deben ser autosuficientes en las habilidades que su trabajo requiere; la dependencia externa persistente señala una brecha, no un estado estable aceptable. Exigir que cada individuo desarrolle profunda experiencia en seguridad, o asignar esa responsabilidad al Scrum Master, representa incorrectamente tanto las habilidades en forma de T como las responsabilidades de los roles en Scrum. |

### 235. SM-AI-I · 2.8 · `0511b2d9-b1cd-48fb-9483-4b6631d7d289`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.8: Explain cross-functionality as a property of the whole Scrum Team

**stem**

| | |
|---|---|
| EN | Which statement accurately describes the 'breadth' dimension of T-shaped skills in a cross-functional Scrum Team? |
| ES | ¿Cuál enunciado describe con precisión la dimensión de 'amplitud' de las habilidades en forma de T en un Scrum Team interfuncional? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Breadth means contributing a depth skill across multiple products wherever it is currently most needed. |
| **a** ES | La amplitud significa aportar una habilidad de profundidad en múltiples productos donde sea más necesaria en ese momento. |
| **b** EN | Breadth means enough awareness in adjacent disciplines to collaborate, assist, and reduce bottlenecks across the team. `<<KEY` |
| **b** ES | La amplitud significa suficiente conocimiento en disciplinas adyacentes para colaborar, asistir y reducir cuellos de botella en todo el equipo. `<<KEY` |
| **c** EN | Breadth is a career development milestone signaling readiness for promotion rather than a pattern serving team collaboration. |
| **c** ES | La amplitud es un hito de desarrollo profesional que señala la preparación para una promoción, en lugar de un patrón que sirve a la colaboración del equipo. |
| **d** EN | Breadth means equal proficiency in every discipline the team practices, making the person interchangeable with any specialist. |
| **d** ES | La amplitud significa igual competencia en todas las disciplinas que practica el equipo, haciendo que la persona sea intercambiable con cualquier especialista. |

**explanation**

| | |
|---|---|
| EN | The breadth bar of a T-shape represents enough cross-disciplinary awareness to collaborate effectively and help where needed — not equal proficiency in all areas. Confusing breadth with full interchangeability overstates the requirement and misrepresents how T-shaped contributors reduce team bottlenecks. Breadth is also not a promotion criterion or a multi-product assignment pattern. |
| ES | La barra de amplitud de una forma de T representa suficiente conocimiento interdisciplinario para colaborar eficazmente y ayudar donde sea necesario — no igual competencia en todas las áreas. Confundir la amplitud con plena intercambiabilidad sobreestima el requisito y representa incorrectamente cómo los colaboradores en forma de T reducen los cuellos de botella del equipo. La amplitud tampoco es un criterio de promoción ni un patrón de asignación a múltiples productos. |

### 236. SM-AI-I · 2.9 · `e830714c-24fd-4eec-9b1c-0a02c8c1847c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.9: Recognize that "Developer" applies to any team member, not just software engineers

**stem**

| | |
|---|---|
| EN | According to the 2020 Scrum Guide, which people hold the Developer accountability on a Scrum Team? |
| ES | Según la Guía Scrum 2020, ¿qué personas tienen la responsabilidad de Developer en un Scrum Team? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Technical specialists whose skills match the team's technology stack. |
| **a** ES | Especialistas técnicos cuyas habilidades coinciden con la pila tecnológica del equipo. |
| **b** EN | All team members, including the Product Owner and Scrum Master. |
| **b** ES | Todos los miembros del equipo, incluidos el Product Owner y el Scrum Master. |
| **c** EN | Anyone committed to creating any aspect of a usable Increment each Sprint. `<<KEY` |
| **c** ES | Cualquier persona comprometida a crear cualquier aspecto de un Increment utilizable en cada Sprint. `<<KEY` |
| **d** EN | Software engineers and programmers who write and maintain production code. |
| **d** ES | Ingenieros de software y programadores que escriben y mantienen código de producción. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide defines Developers as anyone committed to creating any aspect of a usable Increment each Sprint, regardless of discipline or job title. The guide deliberately removed software-specific language to make this accountability inclusive of all contributors. The Product Owner and Scrum Master hold distinct accountabilities and are not Developers by default. |
| ES | La Guía Scrum 2020 define a los Developers como cualquier persona comprometida a crear cualquier aspecto de un Increment utilizable en cada Sprint, independientemente de la disciplina o el título del puesto. La guía eliminó deliberadamente el lenguaje específico del software para hacer que esta responsabilidad sea inclusiva para todos los colaboradores. El Product Owner y el Scrum Master tienen responsabilidades distintas y no son Developers de forma predeterminada. |

### 237. SM-AI-I · 2.9 · `5d3ff8b9-f735-4f82-a38e-ff7bfa187422`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 2.9: Recognize that "Developer" applies to any team member, not just software engineers

**stem**

| | |
|---|---|
| EN | A content writer on a marketing Scrum Team creates campaign copy that forms part of every Sprint's Increment. Under the 2020 Scrum Guide, this writer is best described as: |
| ES | Un redactor de contenido en un Scrum Team de marketing crea textos de campaña que forman parte del Increment de cada Sprint. Según la Guía Scrum 2020, este redactor se describe mejor como: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A Developer, because they contribute to creating the Increment each Sprint. `<<KEY` |
| **a** ES | Un Developer, porque contribuye a crear el Increment en cada Sprint. `<<KEY` |
| **b** EN | A specialist who requires a separate accountability not covered by the Scrum Guide. |
| **b** ES | Un especialista que requiere una responsabilidad separada no contemplada por la Guía Scrum. |
| **c** EN | A stakeholder, because marketing roles fall outside the Scrum Team structure. |
| **c** ES | Un interesado (stakeholder), porque los roles de marketing quedan fuera de la estructura del Scrum Team. |
| **d** EN | An external contributor, because the Developer accountability is reserved for technical roles. |
| **d** ES | Un colaborador externo, porque la responsabilidad de Developer está reservada para roles técnicos. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide's Developer accountability is domain-agnostic. Anyone who contributes to creating any aspect of a usable Increment — including a content writer in a marketing team — is a Developer. The guide removed software-specific language precisely to enable this inclusive framing; no separate accountability is needed. |
| ES | La responsabilidad de Developer en la Guía Scrum 2020 es independiente del dominio. Cualquier persona que contribuya a crear cualquier aspecto de un Increment utilizable — incluido un redactor de contenido en un equipo de marketing — es un Developer. La guía eliminó el lenguaje específico del software precisamente para habilitar este enfoque inclusivo; no se necesita ninguna responsabilidad separada. |

### 238. SM-AI-I · 3.1 · `2b1b3f2b-b529-4621-878b-762216908d9b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.1: State the maximum timebox for each event

**stem**

| | |
|---|---|
| EN | What is the maximum timebox for the Sprint Review for a one-month Sprint? |
| ES | ¿Cuál es el tiempo máximo del Sprint Review para un Sprint de un mes? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | 4 hours, proportionally shorter for shorter Sprints `<<KEY` |
| **a** ES | 4 horas, proporcionalmente más corto para Sprints más breves `<<KEY` |
| **b** EN | 8 hours, the same maximum that applies to Sprint Planning |
| **b** ES | 8 horas, el mismo máximo que aplica al Sprint Planning |
| **c** EN | 4 hours for all Sprints, regardless of Sprint length |
| **c** ES | 4 horas para todos los Sprints, independientemente de su duración |
| **d** EN | 3 hours, matching the Sprint Retrospective for the same Sprint length |
| **d** ES | 3 horas, igual al Sprint Retrospective para la misma duración de Sprint |

**explanation**

| | |
|---|---|
| EN | The Sprint Review is timeboxed to 4 hours for a one-month Sprint and is proportionally shorter for shorter Sprints. Stating that 4 hours applies to all Sprint lengths ignores the proportional rule the Scrum Guide applies to this event. The Sprint Review and Sprint Retrospective have different maximum durations for a one-month Sprint. |
| ES | El Sprint Review tiene un tiempo máximo de 4 horas para un Sprint de un mes y es proporcionalmente más corto para Sprints más breves. Afirmar que 4 horas aplica a todas las duraciones de Sprint ignora la regla proporcional que establece la Guía de Scrum para este evento. El Sprint Review y el Sprint Retrospective tienen duraciones máximas diferentes para un Sprint de un mes. |

### 239. SM-AI-I · 3.1 · `322b10b4-ab62-4787-9a4f-de02f825596d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.1: State the maximum timebox for each event

**stem**

| | |
|---|---|
| EN | What is the maximum length of a Sprint according to the Scrum Guide? |
| ES | ¿Cuál es la duración máxima de un Sprint según la Guía de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Two weeks, because longer Sprints reduce empiricism |
| **a** ES | Dos semanas, porque los Sprints más largos reducen el empirismo |
| **b** EN | One month, and Sprints cannot be extended mid-Sprint `<<KEY` |
| **b** ES | Un mes, y los Sprints no pueden extenderse una vez iniciados `<<KEY` |
| **c** EN | Six weeks, to allow adequate time for complex increments |
| **c** ES | Seis semanas, para permitir tiempo suficiente para Increments complejos |
| **d** EN | One month, but extendable if the team cannot finish all planned work |
| **d** ES | Un mes, pero extensible si el equipo no puede terminar todo el trabajo planificado |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide sets one month as the maximum Sprint length. A Sprint's timebox is fixed and cannot be extended mid-Sprint regardless of remaining work. Extending a Sprint to finish backlog items is an explicit anti-pattern the Guide addresses. Two weeks is a common duration but not the stated maximum. |
| ES | La Guía de Scrum establece un mes como la duración máxima del Sprint. El tiempo máximo de un Sprint es fijo y no puede extenderse una vez iniciado, independientemente del trabajo restante. Extender un Sprint para terminar elementos del backlog es un antipatrón explícito que la Guía aborda. Dos semanas es una duración común pero no el máximo establecido. |

### 240. SM-AI-I · 3.10 · `9dba8b64-97ad-40df-a699-e981c6745050`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.10: Recognize event anti-patterns

**stem**

| | |
|---|---|
| EN | At Sprint Review, developers present features for 45 minutes while stakeholders watch silently, then ask brief clarifying questions before leaving. What is the primary anti-pattern? |
| ES | En el Sprint Review, los desarrolladores presentan funcionalidades durante 45 minutos mientras los interesados observan en silencio, luego hacen breves preguntas de aclaración antes de retirarse. ¿Cuál es el antipatrón principal? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Review is a one-way demo rather than a collaborative inspection, preventing stakeholder input on the Product Backlog. `<<KEY` |
| **a** ES | La revisión es una demostración unidireccional en lugar de una inspección colaborativa, lo que impide que los interesados aporten al Product Backlog. `<<KEY` |
| **b** EN | External stakeholders attended, turning an internal Scrum Team event into an unnecessary distraction. |
| **b** ES | Los interesados externos asistieron, convirtiendo un evento interno del Scrum Team en una distracción innecesaria. |
| **c** EN | Developers presented work directly, bypassing the Product Owner as the sole communicator with stakeholders. |
| **c** ES | Los desarrolladores presentaron el trabajo directamente, evitando al Product Owner como único comunicador con los interesados. |
| **d** EN | The Product Owner did not formally accept or reject each item, leaving increment status unresolved at the event's end. |
| **d** ES | El Product Owner no aceptó ni rechazó formalmente cada elemento, dejando el estado del Increment sin resolver al final del evento. |

**explanation**

| | |
|---|---|
| EN | The Sprint Review is designed for collaborative inspection of the increment and adaptation of the Product Backlog based on stakeholder input. A silent audience watching a polished demo eliminates the two-way dialogue that makes the event valuable. Stakeholder attendance is not a distraction—it is essential. The Scrum Guide assigns no formal per-item accept/reject role to the Product Owner, and developers communicating directly with stakeholders is normal and expected. |
| ES | El Sprint Review está diseñado para la inspección colaborativa del Increment y la adaptación del Product Backlog basada en la retroalimentación de los interesados. Una audiencia silenciosa que observa una demostración pulida elimina el diálogo bidireccional que hace valioso el evento. La asistencia de los interesados no es una distracción, es esencial. La Guía de Scrum no asigna al Product Owner un rol formal de aceptar o rechazar elementos individuales, y que los desarrolladores se comuniquen directamente con los interesados es normal y esperado. |

### 241. SM-AI-I · 3.10 · `c475334f-8565-4fbb-9973-3810027682b4`

shown **3×** in the eight scored attempts — 2 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 3.10: Recognize event anti-patterns

**stem**

| | |
|---|---|
| EN | A Scrum Master tells the team: 'The Sprint went smoothly with no major issues, so we'll skip the Retrospective this time.' What flawed reasoning underlies this decision? |
| ES | Un Scrum Master le dice al equipo: 'El Sprint transcurrió sin problemas importantes, así que esta vez omitiremos la Sprint Retrospective.' ¿Qué razonamiento erróneo subyace a esta decisión? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Retrospectives are only valuable when failures occur; smooth Sprints offer no process data worth examining. `<<KEY` |
| **a** ES | Las Sprint Retrospectives solo son valiosas cuando ocurren fallas; los Sprints sin problemas no ofrecen datos de proceso que valga la pena examinar. `<<KEY` |
| **b** EN | The Retrospective can be skipped when the team unanimously agrees the Sprint met its goal and Definition of Done. |
| **b** ES | La Sprint Retrospective puede omitirse cuando el equipo acuerda unánimemente que el Sprint cumplió su objetivo y la Definition of Done. |
| **c** EN | Smooth Sprints still require a Retrospective, but its output should feed the Sprint Review rather than the next Sprint. |
| **c** ES | Los Sprints sin problemas aún requieren una Sprint Retrospective, pero su resultado debe alimentar el Sprint Review en lugar del siguiente Sprint. |
| **d** EN | A smooth Sprint signals team maturity, so the Retrospective should be replaced with an extended Sprint Planning. |
| **d** ES | Un Sprint sin problemas indica madurez del equipo, por lo que la Sprint Retrospective debe reemplazarse por un Sprint Planning extendido. |

**explanation**

| | |
|---|---|
| EN | Retrospectives are a regular inspect-and-adapt event required every Sprint, not a corrective meeting triggered only by failure. A smooth Sprint still offers opportunities to identify what went well and how to sustain or amplify it. No Scrum event can be cancelled or skipped by any role. Routing Retrospective output to Sprint Review, requiring unanimous team agreement to skip, or substituting an extended Sprint Planning are all unsupported by the Scrum Guide. |
| ES | Las Sprint Retrospectives son un evento regular de inspección y adaptación requerido en cada Sprint, no una reunión correctiva activada únicamente por fallas. Un Sprint sin problemas aún ofrece oportunidades para identificar qué salió bien y cómo sostenerlo o amplificarlo. Ningún evento de Scrum puede ser cancelado u omitido por ningún rol. Dirigir la salida de la Sprint Retrospective al Sprint Review, requerir acuerdo unánime del equipo para omitirla, o sustituirla por un Sprint Planning extendido no están respaldados por la Guía de Scrum. |

### 242. SM-AI-I · 3.10 · `e6d87daf-4069-4472-9cbb-848866d55ca7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.10: Recognize event anti-patterns

**stem**

| | |
|---|---|
| EN | Developers answer 'What did I do? What will I do? Any blockers?' at every Daily Scrum but never discuss how their work connects or how to re-plan toward the Sprint Goal. Which anti-pattern does this reveal? |
| ES | Los desarrolladores responden '¿Qué hice? ¿Qué haré? ¿Algún impedimento?' en cada Daily Scrum, pero nunca discuten cómo se conecta su trabajo ni cómo replanificar hacia el Sprint Goal. ¿Qué antipatrón revela esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The team is treating Daily Scrum as a status ritual rather than a planning event focused on the Sprint Goal. `<<KEY` |
| **a** ES | El equipo está tratando el Daily Scrum como un ritual de estado en lugar de un evento de planificación enfocado en el Sprint Goal. `<<KEY` |
| **b** EN | The team is over-structuring the event; Daily Scrum should be unstructured so developers can raise any topic freely. |
| **b** ES | El equipo está sobre-estructurando el evento; el Daily Scrum debería ser no estructurado para que los desarrolladores puedan plantear cualquier tema libremente. |
| **c** EN | The team is following the three mandatory Daily Scrum questions correctly; Sprint Goal alignment belongs in Sprint Planning. |
| **c** ES | El equipo está siguiendo correctamente las tres preguntas obligatorias del Daily Scrum; la alineación con el Sprint Goal pertenece al Sprint Planning. |
| **d** EN | The team is excluding the Product Owner, who should join Daily Scrum to realign work with Sprint Goal priorities. |
| **d** ES | El equipo está excluyendo al Product Owner, quien debería unirse al Daily Scrum para realinear el trabajo con las prioridades del Sprint Goal. |

**explanation**

| | |
|---|---|
| EN | The Daily Scrum's purpose is for developers to inspect progress toward the Sprint Goal and adapt their plan for the next 24 hours. Mechanically answering three fixed questions without discussing goal alignment turns the event into a status ritual. The three questions are not mandatory per the 2020 Scrum Guide—they are one possible structure. Sprint Goal alignment is not reserved for Sprint Planning alone; it is the Daily Scrum's central concern. The Product Owner is not required to attend Daily Scrum, and an unstructured format does not address the goal-alignment failure described. |
| ES | El propósito del Daily Scrum es que los desarrolladores inspeccionen el progreso hacia el Sprint Goal y adapten su plan para las próximas 24 horas. Responder mecánicamente tres preguntas fijas sin discutir la alineación con el objetivo convierte el evento en un ritual de estado. Las tres preguntas no son obligatorias según la Guía de Scrum 2020; son una posible estructura. La alineación con el Sprint Goal no está reservada únicamente para el Sprint Planning; es la preocupación central del Daily Scrum. El Product Owner no está obligado a asistir al Daily Scrum, y un formato no estructurado no aborda la falla de alineación con el objetivo descrita. |

### 243. SM-AI-I · 3.11 · `777225ff-5f1c-4c91-ac88-95941ee4ee19`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 3.11: Use AI-generated signal as input to inspection without ceding the team's decision-making

**stem**

| | |
|---|---|
| EN | A developer argues that velocity and defect counts are objective facts the team should act on directly, without interpretation. How should the Scrum Master respond? |
| ES | Un desarrollador argumenta que la velocidad y los conteos de defectos son hechos objetivos sobre los que el equipo debería actuar directamente, sin interpretación. ¿Cómo debería responder el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Explain that even accurate metrics require team interpretation to understand causes and choose responses. `<<KEY` |
| **a** ES | Explicar que incluso las métricas precisas requieren interpretación del equipo para entender las causas y elegir las respuestas. `<<KEY` |
| **b** EN | Agree, and move to action-item creation since quantitative data needs no subjective interpretation. |
| **b** ES | Estar de acuerdo y pasar a la creación de elementos de acción, ya que los datos cuantitativos no necesitan interpretación subjetiva. |
| **c** EN | Acknowledge the point and let the developer lead the response plan, since they understand the data best. |
| **c** ES | Reconocer el punto y dejar que el desarrollador lidere el plan de respuesta, ya que él entiende mejor los datos. |
| **d** EN | Suggest automating responses to metric thresholds so the team can focus on issues AI cannot handle. |
| **d** ES | Sugerir automatizar las respuestas a los umbrales de métricas para que el equipo pueda enfocarse en los problemas que la IA no puede manejar. |

**explanation**

| | |
|---|---|
| EN | Metrics — however accurate — describe what happened, not why it happened or what to do about it. Interpretation is always required to connect a number to a cause and a response. Moving straight to action items skips that step, automating responses to thresholds transfers decision-making to the tool, and deferring to one individual's data expertise replaces collective deliberation with individual authority. |
| ES | Las métricas, por muy precisas que sean, describen lo que ocurrió, no por qué ocurrió ni qué hacer al respecto. Siempre se requiere interpretación para conectar un número con una causa y una respuesta. Pasar directamente a los elementos de acción omite ese paso, automatizar respuestas a umbrales transfiere la toma de decisiones a la herramienta, y deferir a la experiencia en datos de un individuo reemplaza la deliberación colectiva con la autoridad individual. |

### 244. SM-AI-I · 3.11 · `7e599069-7448-4c2a-8d3d-3daba05f0aee`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.11: Use AI-generated signal as input to inspection without ceding the team's decision-making

**stem**

| | |
|---|---|
| EN | During a Sprint Retrospective, the AI tool surfaces a cycle-time spike. What should the team do? |
| ES | Durante una Sprint Retrospective, la herramienta de IA detecta un pico en el tiempo de ciclo. ¿Qué debería hacer el equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Apply the AI tool's suggested fix immediately, since the data objectively identifies the solution. |
| **a** ES | Aplicar de inmediato la solución sugerida por la herramienta de IA, ya que los datos identifican objetivamente la solución. |
| **b** EN | Escalate the spike to management, because a leading-indicator flag requires immediate senior attention. |
| **b** ES | Escalar el pico a la gerencia, porque una alerta de indicador adelantado requiere atención inmediata de niveles superiores. |
| **c** EN | Have the Scrum Master resolve the bottleneck before the Retrospective so the team can focus elsewhere. |
| **c** ES | Que el Scrum Master resuelva el cuello de botella antes de la Retrospective para que el equipo pueda enfocarse en otras cosas. |
| **d** EN | Use the spike as a discussion prompt and let the team interpret causes and decide on adaptations. `<<KEY` |
| **d** ES | Usar el pico como punto de partida para la discusión y permitir que el equipo interprete las causas y decida las adaptaciones. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | AI-surfaced metrics are inputs to inspection, not decisions. The team uses the cycle-time spike as a starting point for discussion and owns the interpretation and any resulting adaptation. Applying the tool's suggested fix without team deliberation, escalating a flagged metric as a confirmed impediment, or pre-resolving it before the event all remove decision-making from the team. |
| ES | Las métricas generadas por IA son insumos para la inspección, no decisiones. El equipo usa el pico en el tiempo de ciclo como punto de partida para la discusión y es dueño de la interpretación y de cualquier adaptación resultante. Aplicar la solución sugerida por la herramienta sin deliberación del equipo, escalar una métrica marcada como un impedimento confirmado, o resolverla previamente antes del evento, todos eliminan la toma de decisiones del equipo. |

### 245. SM-AI-I · 3.11 · `ec316b0d-594b-47a9-83f5-70837778be1c`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 3.11: Use AI-generated signal as input to inspection without ceding the team's decision-making

**stem**

| | |
|---|---|
| EN | After adopting an AI metrics dashboard, which Retrospective format best preserves team decision-making authority? |
| ES | Después de adoptar un panel de métricas de IA, ¿qué formato de Retrospective preserva mejor la autoridad de toma de decisiones del equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | An async review where team members individually annotate the AI report and submit responses before the meeting. |
| **a** ES | Una revisión asincrónica donde los miembros del equipo anotan individualmente el informe de IA y envían sus respuestas antes de la reunión. |
| **b** EN | A structured review where the team works through each AI finding in order and responds to every flagged item. |
| **b** ES | Una revisión estructurada donde el equipo trabaja en orden cada hallazgo de IA y responde a cada elemento marcado. |
| **c** EN | A meeting where the Scrum Master translates AI metrics into action items and the team confirms or rejects each one. |
| **c** ES | Una reunión donde el Scrum Master traduce las métricas de IA en elementos de acción y el equipo confirma o rechaza cada uno. |
| **d** EN | A facilitated discussion that opens with AI data as one input, then draws on team experience to identify improvements. `<<KEY` |
| **d** ES | Una discusión facilitada que abre con los datos de IA como un insumo más y luego se apoya en la experiencia del equipo para identificar mejoras. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A facilitated discussion that uses AI data as one input — alongside team observations — keeps interpretation and decisions with the team. Structuring the agenda entirely around AI findings subordinates human judgment to the tool, having the Scrum Master pre-translate metrics into action items reduces collective ownership, and replacing live discussion with async annotation removes the collaborative deliberation that makes Retrospectives effective. |
| ES | Una discusión facilitada que usa los datos de IA como un insumo junto con las observaciones del equipo mantiene la interpretación y las decisiones en el equipo. Estructurar la agenda completamente en torno a los hallazgos de IA subordina el juicio humano a la herramienta, que el Scrum Master pre-traduzca las métricas en elementos de acción reduce la responsabilidad colectiva, y reemplazar la discusión en vivo con anotaciones asincrónicas elimina la deliberación colaborativa que hace efectivas las Sprint Retrospectives. |

### 246. SM-AI-I · 3.2 · `0f34229f-ef35-4575-871d-f6d214c3c639`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Explain the Sprint as the container for all other events

**stem**

| | |
|---|---|
| EN | A Scrum Team finishes Sprint work two days early and waits until Monday to begin the next Sprint. Which statement best describes this practice? |
| ES | Un Scrum Team termina el trabajo del Sprint dos días antes y espera hasta el lunes para comenzar el siguiente Sprint. ¿Cuál afirmación describe mejor esta práctica? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It violates Scrum; a new Sprint starts immediately when the previous one ends, with no gap allowed. `<<KEY` |
| **a** ES | Viola Scrum; un nuevo Sprint comienza inmediatamente cuando el anterior termina, sin permitirse ninguna pausa. `<<KEY` |
| **b** EN | It is permitted; Sprint length can flex downward when the team finishes work ahead of schedule. |
| **b** ES | Está permitido; la duración del Sprint puede reducirse cuando el equipo termina el trabajo antes de lo programado. |
| **c** EN | It is valid; Sprint Planning has not occurred, so the new Sprint cannot formally begin yet. |
| **c** ES | Es válido; el Sprint Planning no ha ocurrido, por lo que el nuevo Sprint no puede comenzar formalmente todavía. |
| **d** EN | It is acceptable; the Scrum Guide recommends a cooldown buffer between Sprints for team recovery. |
| **d** ES | Es aceptable; la Guía Scrum recomienda un período de enfriamiento entre Sprints para la recuperación del equipo. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide states a new Sprint starts immediately after the previous Sprint ends — no gaps or cooldown periods exist between Sprints. Sprints form a continuous, unbroken cadence. The idea that a rest buffer is recommended confuses team welfare practices with this structural rule. The claim that Sprint Planning must precede the Sprint's start is also incorrect: Sprint Planning is an event held within the new Sprint, not a prerequisite that delays its start. |
| ES | La Guía Scrum establece que un nuevo Sprint comienza inmediatamente después de que el Sprint anterior termina — no existen pausas ni períodos de enfriamiento entre Sprints. Los Sprints forman una cadencia continua e ininterrumpida. La idea de que se recomienda un período de descanso confunde las prácticas de bienestar del equipo con esta regla estructural. La afirmación de que el Sprint Planning debe preceder al inicio del Sprint también es incorrecta: el Sprint Planning es un evento que se lleva a cabo dentro del nuevo Sprint, no un requisito previo que retrasa su inicio. |

### 247. SM-AI-I · 3.2 · `707ab68f-596c-4c50-a0c6-3ce058b69aa0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Explain the Sprint as the container for all other events

**stem**

| | |
|---|---|
| EN | A Scrum Team adds two extra days to the current Sprint because the Sprint Goal is at risk. This practice is best classified as: |
| ES | Un Scrum Team agrega dos días adicionales al Sprint actual porque el Sprint Goal está en riesgo. Esta práctica se clasifica mejor como: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A violation of the fixed-length Sprint rule, which prohibits mid-Sprint extensions. `<<KEY` |
| **a** ES | Una violación de la regla de Sprint de duración fija, que prohíbe las extensiones durante el Sprint. `<<KEY` |
| **b** EN | Permitted only if the Product Owner formally approves the extension before the original end date. |
| **b** ES | Permitido solo si el Product Owner aprueba formalmente la extensión antes de la fecha de finalización original. |
| **c** EN | A valid Scrum Master decision when the team shows good-faith effort toward the Sprint Goal. |
| **c** ES | Una decisión válida del Scrum Master cuando el equipo muestra un esfuerzo de buena fe hacia el Sprint Goal. |
| **d** EN | An acceptable empirical adjustment, since Scrum values transparency about delivery risk. |
| **d** ES | Un ajuste empírico aceptable, ya que Scrum valora la transparencia sobre el riesgo de entrega. |

**explanation**

| | |
|---|---|
| EN | Sprint length is fixed and cannot be extended by any role — not by the team, the Scrum Master, or the Product Owner. If a Sprint Goal is at risk, the appropriate responses are scope negotiation with the Product Owner or, in extreme cases, Sprint cancellation — not extending the timebox. |
| ES | La duración del Sprint es fija y no puede ser extendida por ningún rol: ni por el equipo, ni por el Scrum Master, ni por el Product Owner. Si un Sprint Goal está en riesgo, las respuestas apropiadas son la negociación del alcance con el Product Owner o, en casos extremos, la cancelación del Sprint, no extender el timebox. |

### 248. SM-AI-I · 3.2 · `a1776de0-081f-4526-bd2a-5e36a7c00237`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.2: Explain the Sprint as the container for all other events

**stem**

| | |
|---|---|
| EN | Which description correctly distinguishes the Sprint from the other four Scrum events? |
| ES | ¿Cuál descripción distingue correctamente el Sprint de los otros cuatro eventos de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Sprint is the only timeboxed event; the other four have recommended but non-binding durations. |
| **a** ES | El Sprint es el único evento con timebox; los otros cuatro tienen duraciones recomendadas pero no vinculantes. |
| **b** EN | The Sprint is the only event without a fixed agenda; the other four each have defined questions to answer. |
| **b** ES | El Sprint es el único evento sin una agenda fija; los otros cuatro tienen preguntas definidas que responder. |
| **c** EN | The Sprint is the container event; all other four Scrum events are nested within it. `<<KEY` |
| **c** ES | El Sprint es el evento contenedor; los otros cuatro eventos de Scrum están anidados dentro de él. `<<KEY` |
| **d** EN | The Sprint is the only event owned by the Developers; the other four involve the full Scrum Team. |
| **d** ES | El Sprint es el único evento que pertenece a los Developers; los otros cuatro involucran al Scrum Team completo. |

**explanation**

| | |
|---|---|
| EN | What distinguishes the Sprint structurally is that it contains all other events — it is the container, not merely one event among five. All other Scrum events are also timeboxed, so the timebox distinction is incorrect. Ownership and agenda structure do not define the Sprint's unique role in the Scrum framework. |
| ES | Lo que distingue estructuralmente al Sprint es que contiene todos los demás eventos: es el contenedor, no simplemente uno de los cinco eventos. Todos los demás eventos de Scrum también tienen timebox, por lo que la distinción del timebox es incorrecta. La propiedad y la estructura de la agenda no definen el rol único del Sprint en el marco de Scrum. |

### 249. SM-AI-I · 3.2 · `c15bfd3c-60ad-42c1-ab75-099e8433da27`

shown **2×** in the eight scored attempts — 1 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 3.2: Explain the Sprint as the container for all other events

**stem**

| | |
|---|---|
| EN | A team inserts a one-week 'hardening Sprint' between Sprint 6 and Sprint 7 to stabilize the product. This practice is best described as: |
| ES | Un equipo inserta un 'Sprint de estabilización' de una semana entre el Sprint 6 y el Sprint 7 para estabilizar el producto. Esta práctica se describe mejor como: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A gap between Sprints, violating the rule that a new Sprint starts immediately after the previous one. `<<KEY` |
| **a** ES | Una pausa entre Sprints que viola la regla de que un nuevo Sprint comienza inmediatamente después del anterior. `<<KEY` |
| **b** EN | A valid Sprint whose goal is stabilization, provided it includes all standard Scrum events. |
| **b** ES | Un Sprint válido cuyo objetivo es la estabilización, siempre que incluya todos los eventos estándar de Scrum. |
| **c** EN | A valid use of the Sprint container, provided the hardening work is tracked on the Sprint Backlog. |
| **c** ES | Un uso válido del contenedor Sprint, siempre que el trabajo de estabilización se registre en el Sprint Backlog. |
| **d** EN | An extended Sprint Review, acceptable when the Increment requires additional testing before release. |
| **d** ES | Un Sprint Review extendido, aceptable cuando el Increment requiere pruebas adicionales antes del lanzamiento. |

**explanation**

| | |
|---|---|
| EN | Scrum does not recognize hardening, stabilization, or cooldown periods between Sprints. Every Sprint must produce a usable Increment, and a new Sprint begins immediately after the previous one closes. Inserting a gap — regardless of its purpose — breaks the continuous Sprint cadence and is not sanctioned by the Scrum Guide. |
| ES | Scrum no reconoce períodos de estabilización, endurecimiento o enfriamiento entre Sprints. Cada Sprint debe producir un Increment utilizable, y un nuevo Sprint comienza inmediatamente después de que el anterior concluye. Insertar una pausa, independientemente de su propósito, rompe la cadencia continua del Sprint y no está sancionado por la Guía de Scrum. |

### 250. SM-AI-I · 3.3 · `212b9be0-9311-408b-838b-31e867a16d4b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Recall the three topics of Sprint Planning (Why, What, How)

**stem**

| | |
|---|---|
| EN | According to the 2020 Scrum Guide, what are the three topics addressed during Sprint Planning? |
| ES | Según la Guía Scrum 2020, ¿cuáles son los tres temas que se abordan durante el Sprint Planning? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Why, What, and When each Product Backlog Item will be finished. |
| **a** ES | Por qué, qué y cuándo se terminará cada elemento del Product Backlog. |
| **b** EN | Who, What, and When the Developers will complete each task. |
| **b** ES | Quién, qué y cuándo completarán los Developers cada tarea. |
| **c** EN | Why, What, and How the Scrum Team will work during the Sprint. `<<KEY` |
| **c** ES | Por qué, qué y cómo trabajará el Scrum Team durante el Sprint. `<<KEY` |
| **d** EN | What, How, and Where the increment will be deployed to users. |
| **d** ES | Qué, cómo y dónde se desplegará el Increment a los usuarios. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide explicitly names Why (Sprint Goal), What (selected backlog items), and How (the plan for delivery) as Sprint Planning's three topics. The Who/When option and the deployment option misrepresent the Guide's defined topics. |
| ES | La Guía Scrum 2020 nombra explícitamente el Por qué (Sprint Goal), el Qué (elementos del backlog seleccionados) y el Cómo (el plan de entrega) como los tres temas del Sprint Planning. La opción de Quién/Cuándo y la opción de despliegue tergiversan los temas definidos en la Guía. |

### 251. SM-AI-I · 3.3 · `e27cde59-8703-4398-8f93-4bec3bd030fe`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Recall the three topics of Sprint Planning (Why, What, How)

**stem**

| | |
|---|---|
| EN | In Sprint Planning, the 'Why' topic results in which specific artifact or commitment? |
| ES | En el Sprint Planning, el tema del 'Por qué' da como resultado ¿cuál artefacto o compromiso específico? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A release plan showing how the increment will reach end users. |
| **a** ES | Un plan de lanzamiento que muestra cómo el Increment llegará a los usuarios finales. |
| **b** EN | A summary title labeling the collection of items selected for the Sprint. |
| **b** ES | Un título resumen que etiqueta la colección de elementos seleccionados para el Sprint. |
| **c** EN | A prioritized list of Product Backlog Items ranked by business value. |
| **c** ES | Una lista priorizada de elementos del Product Backlog ordenados por valor de negocio. |
| **d** EN | A Sprint Goal — a single objective that gives the Sprint its purpose. `<<KEY` |
| **d** ES | Un Sprint Goal — un único objetivo que le da al Sprint su propósito. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Why topic produces the Sprint Goal, a single coherent objective and the Sprint Backlog's commitment. Treating it as a ranked list or a mere title of selected items reflects the misconception that the Sprint Goal is just a summary of chosen backlog items. |
| ES | El tema del Por qué produce el Sprint Goal, un objetivo coherente único y el compromiso del Sprint Backlog. Tratarlo como una lista ordenada o simplemente como un título de los elementos seleccionados refleja la idea errónea de que el Sprint Goal es solo un resumen de los elementos del backlog elegidos. |

### 252. SM-AI-I · 3.3 · `84acea98-fa7b-456b-a484-0b7d592a8d51`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.3: Recall the three topics of Sprint Planning (Why, What, How)

**stem**

| | |
|---|---|
| EN | What does the 'How' topic in Sprint Planning require the Developers to produce? |
| ES | ¿Qué requiere el tema del 'Cómo' en el Sprint Planning que produzcan los Developers? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A structured stakeholder communication plan outlining how Sprint progress and outcomes will be reported externally. |
| **a** ES | Un plan estructurado de comunicación con los interesados que describa cómo se reportarán externamente el progreso y los resultados del Sprint. |
| **b** EN | A plan for building the increment, detailing enough work to cover at least the first days of the Sprint. `<<KEY` |
| **b** ES | Un plan para construir el Increment, detallando suficiente trabajo para cubrir al menos los primeros días del Sprint. `<<KEY` |
| **c** EN | A marketing and release plan coordinating how the increment will be delivered and promoted to end users. |
| **c** ES | Un plan de marketing y lanzamiento que coordine cómo se entregará y promoverá el Increment a los usuarios finales. |
| **d** EN | A comprehensive, day-by-day task schedule that maps out every activity across the full duration of the Sprint. |
| **d** ES | Un cronograma exhaustivo de tareas día a día que mapee cada actividad a lo largo de toda la duración del Sprint. |

**explanation**

| | |
|---|---|
| EN | The How topic requires Developers to plan how they will build the increment, typically detailing enough work for the first few days rather than a complete day-by-day schedule. How refers to technical delivery planning, not marketing and release coordination, exhaustive daily scheduling, or stakeholder reporting strategies. |
| ES | El tema del Cómo requiere que los Developers planifiquen cómo construirán el Increment, detallando típicamente suficiente trabajo para los primeros días en lugar de un cronograma completo día a día. El Cómo se refiere a la planificación técnica de la entrega, no a la coordinación de marketing y lanzamiento, la programación diaria exhaustiva o las estrategias de reporte a los interesados. |

### 253. SM-AI-I · 3.4 · `551184a6-cb64-423f-8417-cfcdc595f18f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.4: Explain the Daily Scrum's purpose and rules

**stem**

| | |
|---|---|
| EN | A Scrum Master runs the Daily Scrum each morning and asks each Developer the three classic questions. Which aspect conflicts with the Scrum framework? |
| ES | Un Scrum Master dirige el Daily Scrum cada mañana y le hace a cada Developer las tres preguntas clásicas. ¿Qué aspecto entra en conflicto con el marco de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Scrum Master must document answers and distribute them as meeting minutes afterward. |
| **a** ES | El Scrum Master debe documentar las respuestas y distribuirlas como acta de reunión después. |
| **b** EN | The Scrum Master is running the event; Developers own and structure the Daily Scrum. `<<KEY` |
| **b** ES | El Scrum Master está dirigiendo el evento; los Developers son dueños del Daily Scrum y lo estructuran ellos mismos. `<<KEY` |
| **c** EN | The Scrum Master should open the meeting, then hand facilitation to the Product Owner. |
| **c** ES | El Scrum Master debería abrir la reunión y luego ceder la facilitación al Product Owner. |
| **d** EN | The Daily Scrum must run at least 30 minutes to give every Developer adequate speaking time. |
| **d** ES | El Daily Scrum debe durar al menos 30 minutos para darle a cada Developer tiempo suficiente para hablar. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide assigns the Daily Scrum to the Developers—it is their event to own and structure. A Scrum Master running and imposing a fixed format undermines that ownership. Handing facilitation to the Product Owner, mandating a 30-minute duration, and distributing minutes are all additional violations, but the root conflict is the Scrum Master conducting the event. |
| ES | La Guía de Scrum asigna el Daily Scrum a los Developers: es su evento para ser dueños y estructurar. Que un Scrum Master lo dirija e imponga un formato fijo socava esa responsabilidad. Ceder la facilitación al Product Owner, exigir una duración de 30 minutos y distribuir actas son violaciones adicionales, pero el conflicto central es que el Scrum Master conduzca el evento. |

### 254. SM-AI-I · 3.4 · `84b18a8c-b6bc-45a4-bce8-91433732c754`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.4: Explain the Daily Scrum's purpose and rules

**stem**

| | |
|---|---|
| EN | Who is responsible for conducting the Daily Scrum? |
| ES | ¿Quién es responsable de llevar a cabo el Daily Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Scrum Master, because ensuring events occur properly is their accountability. |
| **a** ES | El Scrum Master, porque garantizar que los eventos ocurran correctamente es su responsabilidad. |
| **b** EN | A rotating facilitator nominated by the team each Sprint. |
| **b** ES | Un facilitador rotativo nominado por el equipo en cada Sprint. |
| **c** EN | The Developers; they own and structure the event themselves. `<<KEY` |
| **c** ES | Los Developers; ellos son dueños del evento y lo estructuran por sí mismos. `<<KEY` |
| **d** EN | The Product Owner, to verify daily work aligns with backlog priorities. |
| **d** ES | El Product Owner, para verificar que el trabajo diario esté alineado con las prioridades del backlog. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide assigns the Daily Scrum to the Developers; it is their event to run and structure. The Scrum Master's role is to ensure the Developers understand this ownership, not to facilitate the meeting on their behalf. |
| ES | La Guía de Scrum asigna el Daily Scrum a los Developers; es su evento para dirigir y estructurar. El rol del Scrum Master es asegurarse de que los Developers comprendan esta responsabilidad, no facilitar la reunión en su nombre. |

### 255. SM-AI-I · 3.4 · `af961a66-3fa0-4270-9b6a-c337c573e565`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.4: Explain the Daily Scrum's purpose and rules

**stem**

| | |
|---|---|
| EN | A manager attends every Daily Scrum to monitor individual Developer output. Why does this conflict with the Scrum framework? |
| ES | Un gerente asiste a cada Daily Scrum para monitorear el rendimiento individual de cada Developer. ¿Por qué esto entra en conflicto con el marco de Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Attendance is unrestricted, but the manager's presence violates the 15-minute timebox. |
| **a** ES | La asistencia es irrestricta, pero la presencia del gerente viola el timebox de 15 minutos. |
| **b** EN | Managers may observe silently, but the Scrum Master controls who is permitted to speak. |
| **b** ES | Los gerentes pueden observar en silencio, pero el Scrum Master controla quién tiene permitido hablar. |
| **c** EN | It turns the event into a status report, undermining Developer ownership of the Daily Scrum. `<<KEY` |
| **c** ES | Convierte el evento en un reporte de estado, socavando la responsabilidad de los Developers sobre el Daily Scrum. `<<KEY` |
| **d** EN | Only the Product Owner may attend beyond the Developers, as the stakeholder proxy. |
| **d** ES | Solo el Product Owner puede asistir además de los Developers, como representante de los interesados. |

**explanation**

| | |
|---|---|
| EN | The Daily Scrum is a Developer-owned event focused on Sprint Goal inspection. When a manager attends to track individual output, the meeting shifts to a status report, contradicting the event's defined purpose and undermining the self-managing nature of the Developers. |
| ES | El Daily Scrum es un evento de responsabilidad de los Developers enfocado en la inspección del Sprint Goal. Cuando un gerente asiste para rastrear el rendimiento individual, la reunión se convierte en un reporte de estado, lo que contradice el propósito definido del evento y socava la naturaleza autogestora de los Developers. |

### 256. SM-AI-I · 3.5 · `4a4569a6-b6ff-442b-8eef-1725e4d8ceaa`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Describe the Sprint Review as a working session, not a status report

**stem**

| | |
|---|---|
| EN | A Sprint Review ends with no backlog changes because the Product Owner updates the backlog separately afterward. Which concept does this contradict? |
| ES | Un Sprint Review termina sin cambios en el backlog porque el Product Owner actualiza el backlog por separado después del evento. ¿Qué concepto contradice esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Authority to modify the Product Backlog after stakeholder feedback is collected belongs exclusively to the Scrum Master, not the Product Owner. |
| **a** ES | La autoridad para modificar el Product Backlog después de recopilar la retroalimentación de los interesados pertenece exclusivamente al Scrum Master, no al Product Owner. |
| **b** EN | Backlog refinement is a mandatory, time-boxed Scrum event specifically designed to replace all Product Backlog updates that would otherwise occur during the Sprint Review. |
| **b** ES | El refinamiento del backlog es un evento de Scrum obligatorio y con tiempo limitado, diseñado específicamente para reemplazar todas las actualizaciones del Product Backlog que de otro modo ocurrirían durante el Sprint Review. |
| **c** EN | Formal stakeholder sign-off must be obtained and documented before any Product Backlog item can be added, removed, or re-ordered. |
| **c** ES | Se debe obtener y documentar la aprobación formal de los interesados antes de que cualquier elemento del Product Backlog pueda ser agregado, eliminado o reordenado. |
| **d** EN | Adapting the Product Backlog is a defined outcome of the Sprint Review itself, making deferred solo updates a violation of its inspect-and-adapt purpose. `<<KEY` |
| **d** ES | Adaptar el Product Backlog es un resultado definido del Sprint Review en sí mismo, por lo que diferir las actualizaciones de forma individual viola su propósito de inspección y adaptación. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Adapting the Product Backlog is a defined outcome of the Sprint Review itself, not a deferred solo activity. Deferring updates removes the collaborative, inspect-and-adapt nature of the event. Stakeholder sign-off is not a Scrum requirement, backlog refinement does not replace Review-time updates, and the Scrum Master has no authority over the Product Backlog. |
| ES | Adaptar el Product Backlog es un resultado definido del Sprint Review en sí mismo, no una actividad individual diferida. Posponer las actualizaciones elimina la naturaleza colaborativa de inspección y adaptación del evento. La aprobación de los interesados no es un requisito de Scrum, el refinamiento del backlog no reemplaza las actualizaciones durante el Review, y el Scrum Master no tiene autoridad sobre el Product Backlog. |

### 257. SM-AI-I · 3.5 · `c629ff32-18b4-4b63-9e21-aa23928e4e06`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 3.5: Describe the Sprint Review as a working session, not a status report

**stem**

| | |
|---|---|
| EN | What is the Sprint Review's time-box for a one-month Sprint? |
| ES | ¿Cuál es el tiempo límite del Sprint Review para un Sprint de un mes? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A maximum of four hours, scaled proportionally for shorter Sprints. `<<KEY` |
| **a** ES | Un máximo de cuatro horas, escalado proporcionalmente para Sprints más cortos. `<<KEY` |
| **b** EN | Eight hours, to allow thorough stakeholder sign-off on every completed backlog item. |
| **b** ES | Ocho horas, para permitir la aprobación exhaustiva de los interesados sobre cada elemento completado del backlog. |
| **c** EN | Exactly one hour, making it the shortest Scrum event regardless of Sprint length. |
| **c** ES | Exactamente una hora, lo que lo convierte en el evento de Scrum más corto independientemente de la duración del Sprint. |
| **d** EN | No defined limit, because duration depends on the number of attending stakeholders. |
| **d** ES | Sin límite definido, porque la duración depende del número de interesados presentes. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide sets the Sprint Review at a maximum of four hours for a one-month Sprint, with proportionally shorter sessions for shorter Sprints. A one-hour fixed limit is incorrect. All Scrum events are time-boxed, so there is no undefined duration. An eight-hour session reflects a misunderstanding of the event as a sign-off gate. |
| ES | La Guía Scrum establece que el Sprint Review tiene un máximo de cuatro horas para un Sprint de un mes, con sesiones proporcionalmente más cortas para Sprints más breves. Un límite fijo de una hora es incorrecto. Todos los eventos de Scrum tienen tiempo limitado, por lo que no existe una duración indefinida. Una sesión de ocho horas refleja una mala comprensión del evento como una puerta de aprobación. |

### 258. SM-AI-I · 3.5 · `b13cbcad-b900-40dd-8618-44726d764a0f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Describe the Sprint Review as a working session, not a status report

**stem**

| | |
|---|---|
| EN | A team treats the Sprint Review as a gate requiring stakeholder approval before releasing the Increment. Which concept does this misunderstand? |
| ES | Un equipo trata el Sprint Review como una puerta que requiere la aprobación de los interesados antes de liberar el Increment. ¿Qué concepto malentiende esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Release decisions are made exclusively in Sprint Planning, so the Review has no bearing on them. |
| **a** ES | Las decisiones de lanzamiento se toman exclusivamente en el Sprint Planning, por lo que el Review no tiene incidencia en ellas. |
| **b** EN | The Product Owner alone decides release timing; stakeholder input at the Review is purely advisory. |
| **b** ES | Solo el Product Owner decide el momento del lanzamiento; la opinión de los interesados en el Review es puramente consultiva. |
| **c** EN | Stakeholder approval is required before any Increment can be released to production. |
| **c** ES | Se requiere la aprobación de los interesados antes de que cualquier Increment pueda ser liberado a producción. |
| **d** EN | The Sprint Review is for adapting the backlog based on feedback, not for controlling release decisions. `<<KEY` |
| **d** ES | El Sprint Review sirve para adaptar el backlog con base en la retroalimentación, no para controlar las decisiones de lanzamiento. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Sprint Review is designed to generate stakeholder input that shapes the Product Backlog, not to serve as a release gate requiring formal approval. Treating it as an approval ceremony turns a collaborative working session into a bureaucratic checkpoint. Release timing is the Product Owner's responsibility but is not confined to Sprint Planning, and the Review is not purely advisory — it drives real backlog adaptation. |
| ES | El Sprint Review está diseñado para generar retroalimentación de los interesados que dé forma al Product Backlog, no para servir como una puerta de lanzamiento que requiera aprobación formal. Tratarlo como una ceremonia de aprobación convierte una sesión de trabajo colaborativa en un punto de control burocrático. El momento del lanzamiento es responsabilidad del Product Owner, pero no está limitado al Sprint Planning, y el Review no es puramente consultivo: impulsa una adaptación real del backlog. |

### 259. SM-AI-I · 3.5 · `e4fd5f04-8821-4ce9-8e70-62eec6bda40b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Describe the Sprint Review as a working session, not a status report

**stem**

| | |
|---|---|
| EN | During a Sprint Review, stakeholders raise concerns that significantly shift the product's direction. Which outcome best reflects the intent of the event? |
| ES | Durante un Sprint Review, los interesados plantean inquietudes que cambian significativamente la dirección del producto. ¿Cuál resultado refleja mejor la intención del evento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Product Backlog is adapted during the Review to reflect the new insights and direction. `<<KEY` |
| **a** ES | El Product Backlog se adapta durante el Review para reflejar los nuevos conocimientos y la nueva dirección. `<<KEY` |
| **b** EN | The Product Owner defers the concerns and updates the backlog independently after the event. |
| **b** ES | El Product Owner pospone las inquietudes y actualiza el backlog de forma independiente después del evento. |
| **c** EN | The Scrum Master logs the concerns so they can be addressed at the next Sprint Planning. |
| **c** ES | El Scrum Master registra las inquietudes para que puedan abordarse en el próximo Sprint Planning. |
| **d** EN | The Sprint is declared failed and the team restarts the work to meet the original expectations. |
| **d** ES | El Sprint se declara fallido y el equipo reinicia el trabajo para cumplir con las expectativas originales. |

**explanation**

| | |
|---|---|
| EN | Surfacing significant stakeholder feedback and adapting the Product Backlog in response — during the event — is exactly what the Sprint Review is designed for. Declaring the Sprint failed, logging concerns for a later event, or deferring updates to a solo activity all contradict the collaborative inspect-and-adapt purpose of the Sprint Review. |
| ES | Detectar retroalimentación significativa de los interesados y adaptar el Product Backlog en respuesta —durante el evento— es exactamente para lo que está diseñado el Sprint Review. Declarar el Sprint fallido, registrar inquietudes para un evento posterior o diferir las actualizaciones a una actividad individual contradicen el propósito colaborativo de inspección y adaptación del Sprint Review. |

### 260. SM-AI-I · 3.5 · `e53c5e46-0612-4cd0-a270-811f67b379ba`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.5: Describe the Sprint Review as a working session, not a status report

**stem**

| | |
|---|---|
| EN | What is the clearest distinction between the Sprint Review and the Sprint Retrospective? |
| ES | ¿Cuál es la distinción más clara entre el Sprint Review y el Sprint Retrospective? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Review evaluates individual team member performance metrics, while the Retrospective examines product quality issues and outstanding defect counts. |
| **a** ES | El Review evalúa las métricas de desempeño individual de los miembros del equipo, mientras que el Retrospective examina los problemas de calidad del producto y el número de defectos pendientes. |
| **b** EN | The Review inspects the Increment and adapts the Product Backlog; the Retrospective inspects the team's processes and ways of working. `<<KEY` |
| **b** ES | El Review inspecciona el Increment y adapta el Product Backlog; el Retrospective inspecciona los procesos y las formas de trabajar del equipo. `<<KEY` |
| **c** EN | The Review is an internal Scrum Team event closed to outside parties, while the Retrospective invites stakeholders to provide direct process feedback. |
| **c** ES | El Review es un evento interno del Scrum Team cerrado a personas externas, mientras que el Retrospective invita a los interesados a proporcionar retroalimentación directa sobre los procesos. |
| **d** EN | The Review is optional once a team reaches maturity, while the Retrospective remains mandatory and must be held every Sprint without exception. |
| **d** ES | El Review es opcional una vez que el equipo alcanza la madurez, mientras que el Retrospective sigue siendo obligatorio y debe realizarse en cada Sprint sin excepción. |

**explanation**

| | |
|---|---|
| EN | The Sprint Review focuses on the product — inspecting the Increment and adapting the Product Backlog. The Retrospective focuses on the Scrum Team itself — inspecting processes and ways of working. Both events are mandatory; the Review is not internal-only; and neither event is focused on performance metrics or defect counts. |
| ES | El Sprint Review se enfoca en el producto: inspeccionar el Increment y adaptar el Product Backlog. El Retrospective se enfoca en el propio Scrum Team: inspeccionar los procesos y las formas de trabajar. Ambos eventos son obligatorios; el Review no es exclusivo para el equipo interno; y ninguno de los eventos se centra en métricas de desempeño ni en recuentos de defectos. |

### 261. SM-AI-I · 3.6 · `476a4a0c-bcec-49d2-b053-9c8ab6783078`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.6: Facilitate the Sprint Retrospective with a focus on team process

**stem**

| | |
|---|---|
| EN | The team agrees to update the Definition of Done to include a security check. Where should this work item be placed per the Scrum Guide? |
| ES | El equipo acuerda actualizar el Definition of Done para incluir una verificación de seguridad. ¿Dónde debe colocarse este elemento de trabajo según la Guía Scrum? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | In a separate improvement backlog outside the Sprint Backlog so it does not crowd out product delivery items. |
| **a** ES | En un backlog de mejoras separado fuera del Sprint Backlog, para que no desplace a los elementos de entrega del producto. |
| **b** EN | At the top of the Product Backlog, because retrospective improvements automatically become the highest-priority items. |
| **b** ES | En la parte superior del Product Backlog, porque las mejoras de la retrospectiva se convierten automáticamente en los elementos de mayor prioridad. |
| **c** EN | In the next Sprint Backlog, giving it visibility alongside product work and ensuring it competes for team capacity. `<<KEY` |
| **c** ES | En el Sprint Backlog del próximo Sprint, dándole visibilidad junto al trabajo del producto y asegurando que compita por la capacidad del equipo. `<<KEY` |
| **d** EN | In the Product Backlog without special priority, treated the same as any other product work item. |
| **d** ES | En el Product Backlog sin prioridad especial, tratado igual que cualquier otro elemento de trabajo del producto. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide states that at least one high-priority improvement may be added to the next Sprint Backlog, making it visible, trackable work. A separate improvement backlog outside the Sprint Backlog renders the item optional and easily deferred. Retrospective items do not automatically become the highest-priority work; the Developers and Product Owner determine priority. Placing it in the Product Backlog without elevation risks it being deprioritized indefinitely against product features. |
| ES | La Guía Scrum 2020 establece que al menos una mejora de alta prioridad puede agregarse al próximo Sprint Backlog, convirtiéndola en trabajo visible y rastreable. Un backlog de mejoras separado fuera del Sprint Backlog hace que el elemento sea opcional y fácilmente postergado. Los elementos de la retrospectiva no se convierten automáticamente en el trabajo de mayor prioridad; los Developers y el Product Owner determinan la prioridad. Colocarlo en el Product Backlog sin elevarlo arriesga que sea postergado indefinidamente frente a las funcionalidades del producto. |

### 262. SM-AI-I · 3.6 · `77ffd939-c03a-4208-a363-4f045d7ffbb0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.6: Facilitate the Sprint Retrospective with a focus on team process

**stem**

| | |
|---|---|
| EN | The retrospective surfaces many small friction points but no single large problem. A team member says they should wait for a bigger issue before acting. What should the Scrum Master advise? |
| ES | La retrospectiva revela muchos puntos de fricción pequeños pero ningún problema grande. Un miembro del equipo dice que deberían esperar a un problema mayor antes de actuar. ¿Qué debería aconsejar el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Document the friction points and revisit them quarterly when enough issues have accumulated for a meaningful improvement session. |
| **a** ES | Documentar los puntos de fricción y revisarlos trimestralmente cuando se hayan acumulado suficientes problemas para una sesión de mejora significativa. |
| **b** EN | Combine all friction points into one initiative so the team addresses them together with a single, coordinated effort. |
| **b** ES | Combinar todos los puntos de fricción en una sola iniciativa para que el equipo los aborde juntos con un esfuerzo único y coordinado. |
| **c** EN | Agree to wait: acting on minor friction without a root cause risks wasting the team's capacity on low-value changes. |
| **c** ES | Acordar esperar: actuar sobre fricciones menores sin una causa raíz arriesga desperdiciar la capacidad del equipo en cambios de bajo valor. |
| **d** EN | Commit to one small, concrete experiment this Sprint; incremental improvements compound and are fully valid retrospective outcomes. `<<KEY` |
| **d** ES | Comprometerse con un experimento pequeño y concreto en este Sprint; las mejoras incrementales se acumulan y son resultados completamente válidos de la retrospectiva. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Small, incremental experiments are entirely appropriate retrospective outputs; the Scrum Guide places no size threshold on improvements. Waiting for a larger problem delays continuous improvement and contradicts the inspect-and-adapt cadence. Bundling all friction points into one initiative creates unnecessary complexity and reduces focus. Deferring to a quarterly review abandons the Sprint-level improvement cycle the retrospective is designed to sustain. |
| ES | Los experimentos pequeños e incrementales son resultados completamente apropiados de la retrospectiva; la Guía Scrum no establece ningún umbral de tamaño para las mejoras. Esperar un problema mayor retrasa la mejora continua y contradice la cadencia de inspección y adaptación. Agrupar todos los puntos de fricción en una sola iniciativa crea complejidad innecesaria y reduce el enfoque. Diferir a una revisión trimestral abandona el ciclo de mejora a nivel de Sprint que la retrospectiva está diseñada para sostener. |

### 263. SM-AI-I · 3.6 · `b92b382c-f84e-43fd-944d-dfffde2173ea`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.6: Facilitate the Sprint Retrospective with a focus on team process

**stem**

| | |
|---|---|
| EN | Two developers stay silent every retrospective while one senior developer dominates. What should the Scrum Master do during the event? |
| ES | Dos desarrolladores permanecen en silencio en cada retrospectiva mientras un desarrollador senior domina la conversación. ¿Qué debe hacer el Scrum Master durante el evento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Assign equal speaking time slots to every participant, since equal airtime is the primary goal of retrospective facilitation. |
| **a** ES | Asignar turnos de tiempo de habla iguales a cada participante, ya que el tiempo equitativo en el uso de la palabra es el objetivo principal de la facilitación de la retrospectiva. |
| **b** EN | Address the imbalance in the Sprint Review, where team dynamics are formally inspected alongside the product increment. |
| **b** ES | Abordar el desequilibrio en el Sprint Review, donde la dinámica del equipo se inspecciona formalmente junto con el Increment del producto. |
| **c** EN | Speak privately with the senior developer after the Sprint, keeping the retrospective itself free from interpersonal topics. |
| **c** ES | Hablar en privado con el desarrollador senior después del Sprint, manteniendo la retrospectiva libre de temas interpersonales. |
| **d** EN | Use a silent writing round before group discussion so all members record observations before the dominant voice shapes the conversation. `<<KEY` |
| **d** ES | Usar una ronda de escritura en silencio antes de la discusión grupal para que todos los miembros registren sus observaciones antes de que la voz dominante moldee la conversación. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A silent writing round creates psychological safety by letting quieter members form and record thoughts before group pressure sets in — a concrete facilitation technique for inclusion. Enforcing equal time slots applies a mechanical rule without addressing the underlying dynamic. Team working norms are inspected in the retrospective, not the Sprint Review. Deferring the conversation to after the Sprint misses the opportunity to improve participation in the current and next retrospective. |
| ES | Una ronda de escritura en silencio crea seguridad psicológica al permitir que los miembros más callados formen y registren sus pensamientos antes de que la presión grupal se establezca: una técnica concreta de facilitación para la inclusión. Aplicar turnos de tiempo iguales impone una regla mecánica sin abordar la dinámica subyacente. Las normas de trabajo del equipo se inspeccionan en la retrospectiva, no en el Sprint Review. Diferir la conversación para después del Sprint pierde la oportunidad de mejorar la participación en la retrospectiva actual y en la siguiente. |

### 264. SM-AI-I · 3.6 · `e3449b3a-c9c7-4b47-8997-a07efe132778`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.6: Facilitate the Sprint Retrospective with a focus on team process

**stem**

| | |
|---|---|
| EN | A Scrum Team has used Start/Stop/Continue for six Sprints. Engagement is dropping and actions address only surface-level issues. Which facilitation decision is most appropriate? |
| ES | Un Scrum Team ha utilizado el formato Start/Stop/Continue durante seis Sprints. La participación está disminuyendo y las acciones solo abordan problemas superficiales. ¿Cuál es la decisión de facilitación más apropiada? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Keep the format but enforce equal speaking time, since low engagement is caused by dominant voices silencing others. |
| **a** ES | Mantener el formato pero imponer tiempos de participación iguales, ya que la baja participación es causada por voces dominantes que silencian a los demás. |
| **b** EN | Switch to a free-form discussion, since structured formats serve only to ensure equal participation, not to shape thinking. |
| **b** ES | Cambiar a una discusión de formato libre, ya que los formatos estructurados solo sirven para garantizar una participación equitativa, no para orientar el pensamiento. |
| **c** EN | Introduce a different format, such as the sailboat, to prompt inspection of systemic factors the current format does not surface. `<<KEY` |
| **c** ES | Introducir un formato diferente, como el velero, para promover la inspección de factores sistémicos que el formato actual no hace aflorar. `<<KEY` |
| **d** EN | Continue with Start/Stop/Continue, since all retrospective formats surface the same insights regardless of structure. |
| **d** ES | Continuar con Start/Stop/Continue, ya que todos los formatos de retrospectiva generan los mismos aprendizajes independientemente de su estructura. |

**explanation**

| | |
|---|---|
| EN | Different formats structure inspection from different angles. Switching to a format like the sailboat surfaces impediments and motivators that Start/Stop/Continue does not explicitly prompt, breaking the pattern that produces shallow actions. Enforcing equal talk time addresses facilitation mechanics, not the angle of inquiry causing surface-level outputs. Formats are not interchangeable — each elicits a distinct type of reflection, so claiming they produce identical insights is a clear misconception. Free-form discussion removes the structure that guides teams toward useful insights. |
| ES | Los diferentes formatos estructuran la inspección desde distintos ángulos. Cambiar a un formato como el velero hace aflorar impedimentos y motivadores que Start/Stop/Continue no promueve explícitamente, rompiendo el patrón que produce acciones superficiales. Imponer tiempos de participación iguales aborda la mecánica de facilitación, no el ángulo de indagación que genera resultados superficiales. Los formatos no son intercambiables: cada uno elicita un tipo distinto de reflexión, por lo que afirmar que producen los mismos aprendizajes es un error conceptual claro. La discusión de formato libre elimina la estructura que guía a los equipos hacia aprendizajes útiles. |

### 265. SM-AI-I · 3.6 · `974575cc-8361-4719-ae7d-d404f41a444c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.6: Facilitate the Sprint Retrospective with a focus on team process

**stem**

| | |
|---|---|
| EN | A Scrum Team has run Start/Stop/Continue for six Sprints. Answers repeat and energy is low. Which facilitator move best addresses this? |
| ES | Un Scrum Team ha ejecutado Start/Stop/Continue durante seis Sprints. Las respuestas se repiten y la energía es baja. ¿Qué acción del facilitador aborda mejor esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Keep Start/Stop/Continue but enforce strict equal speaking time for each member, since low engagement stems from dominant voices crowding out quieter contributors. |
| **a** ES | Mantener Start/Stop/Continue pero aplicar tiempos de habla iguales y estrictos para cada miembro, ya que el bajo compromiso proviene de voces dominantes que desplazan a los colaboradores más callados. |
| **b** EN | Switch to the sailboat format to reframe the conversation around anchors and winds, breaking the pattern that the repeated format has stopped generating. `<<KEY` |
| **b** ES | Cambiar al formato del velero para reformular la conversación en torno a anclas y vientos, rompiendo el patrón que el formato repetido ha dejado de generar. `<<KEY` |
| **c** EN | Replace the structured event with an asynchronous survey, since all retrospective formats ultimately surface the same insights regardless of how the conversation is structured. |
| **c** ES | Reemplazar el evento estructurado con una encuesta asíncrona, ya que todos los formatos de retrospectiva terminan revelando los mismos aprendizajes independientemente de cómo se estructure la conversación. |
| **d** EN | Shorten the retrospective time-box, since repeated answers and low energy indicate the team has already surfaced and resolved its most significant process issues. |
| **d** ES | Acortar el time-box de la retrospectiva, ya que las respuestas repetidas y la baja energía indican que el equipo ya ha identificado y resuelto sus problemas de proceso más significativos. |

**explanation**

| | |
|---|---|
| EN | Different retrospective formats surface different angles of team experience. Switching to the sailboat reframes the conversation around anchors and winds rather than behaviors, breaking the pattern of stale responses. Enforcing equal speaking time addresses inclusion, not the format's diminishing returns. Low energy is a signal to improve facilitation, not reduce inspection time. Formats are not interchangeable — each structures thinking differently, so replacing the event with an async survey does not resolve the root cause. |
| ES | Los diferentes formatos de retrospectiva revelan distintos ángulos de la experiencia del equipo. Cambiar al formato del velero reformula la conversación en torno a anclas y vientos en lugar de comportamientos, rompiendo el patrón de respuestas desgastadas. Aplicar tiempos de habla iguales aborda la inclusión, no los rendimientos decrecientes del formato. La baja energía es una señal para mejorar la facilitación, no para reducir el tiempo de inspección. Los formatos no son intercambiables: cada uno estructura el pensamiento de manera diferente, por lo que reemplazar el evento con una encuesta asíncrona no resuelve la causa raíz. |

### 266. SM-AI-I · 3.7 · `25b0fead-9d04-480f-bfa6-4c10597ad6e0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.7: Identify when a Sprint can be canceled and by whom

**stem**

| | |
|---|---|
| EN | Under what single condition does the Scrum Guide permit a Sprint to be cancelled? |
| ES | ¿Bajo qué única condición permite la Guía de Scrum cancelar un Sprint? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The technical approach chosen by the team proves incorrect mid-Sprint. |
| **a** ES | El enfoque técnico elegido por el equipo resulta incorrecto a mitad del Sprint. |
| **b** EN | The team cannot complete all Sprint Backlog items before the Sprint ends. |
| **b** ES | El equipo no puede completar todos los elementos del Sprint Backlog antes de que finalice el Sprint. |
| **c** EN | The Sprint Goal becomes obsolete due to changing circumstances. `<<KEY` |
| **c** ES | El Sprint Goal se vuelve obsoleto debido a circunstancias cambiantes. `<<KEY` |
| **d** EN | A higher-priority feature arrives that would deliver more immediate business value. |
| **d** ES | Llega una funcionalidad de mayor prioridad que generaría más valor de negocio de forma inmediata. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide specifies one condition for cancellation: the Sprint Goal has become obsolete. Incomplete work, new feature requests, or wrong technical approaches do not, by themselves, warrant cancellation. |
| ES | La Guía de Scrum especifica una sola condición para la cancelación: que el Sprint Goal se haya vuelto obsoleto. El trabajo incompleto, las nuevas solicitudes de funcionalidades o los enfoques técnicos incorrectos no justifican por sí solos la cancelación. |

### 267. SM-AI-I · 3.8 · `66069f3b-1304-4409-9d34-4ed038ed5bfa`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.8: Apply timebox rules to scenarios

**stem**

| | |
|---|---|
| EN | After 4 hours of Sprint Planning for a two-week Sprint, the team has a clear Sprint Goal and selected backlog items but wants to keep planning. What should happen? |
| ES | Después de 4 horas de Sprint Planning para un Sprint de dos semanas, el equipo tiene un Sprint Goal claro y los elementos del backlog seleccionados, pero quiere continuar planificando. ¿Qué debería ocurrir? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continue up to 8 hours total, since Sprint Planning always has an 8-hour timebox. |
| **a** ES | Continuar hasta 8 horas en total, ya que el Sprint Planning siempre tiene un timebox de 8 horas. |
| **b** EN | Continue if the Scrum Master agrees, since the Scrum Master controls timebox exceptions. |
| **b** ES | Continuar si el Scrum Master lo aprueba, ya que el Scrum Master controla las excepciones de timebox. |
| **c** EN | Continue until every task detail is agreed; outcomes matter more than time limits. |
| **c** ES | Continuar hasta que se acuerden todos los detalles de las tareas; los resultados importan más que los límites de tiempo. |
| **d** EN | End Sprint Planning now; the purpose is met and the 4-hour maximum must not be exceeded. `<<KEY` |
| **d** ES | Terminar el Sprint Planning ahora; el propósito se ha cumplido y no se debe superar el máximo de 4 horas. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Sprint Planning for a two-week Sprint is timeboxed at a maximum of 4 hours. Once the Sprint Goal and selected backlog are established, the purpose is fulfilled and the event must end. Exceeding the timebox for fuller consensus violates the rule, regardless of team preference or Scrum Master approval. |
| ES | El Sprint Planning para un Sprint de dos semanas tiene un timebox máximo de 4 horas. Una vez que el Sprint Goal y el backlog seleccionado están establecidos, el propósito se ha cumplido y el evento debe terminar. Superar el timebox en busca de un mayor consenso viola la regla, independientemente de la preferencia del equipo o la aprobación del Scrum Master. |

### 268. SM-AI-I · 3.8 · `83f18417-2606-42b2-bbb4-47da71aef3ae`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.8: Apply timebox rules to scenarios

**stem**

| | |
|---|---|
| EN | A Daily Scrum covers all coordination topics in 10 minutes with 5 minutes remaining on the timebox. What should the Scrum Master do? |
| ES | Un Daily Scrum cubre todos los temas de coordinación en 10 minutos, con 5 minutos restantes del timebox. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continue until the full 15 minutes are used; the timebox signals expected coordination depth. |
| **a** ES | Continuar hasta que se usen los 15 minutos completos; el timebox indica la profundidad de coordinación esperada. |
| **b** EN | Ask the team whether to extend to 20 minutes, since circumstances allow adjustment. |
| **b** ES | Preguntarle al equipo si desea extenderse a 20 minutos, ya que las circunstancias permiten ajustes. |
| **c** EN | End the meeting; the timebox is a maximum and finishing early is acceptable. `<<KEY` |
| **c** ES | Terminar la reunión; el timebox es un máximo y finalizar antes es aceptable. `<<KEY` |
| **d** EN | Fill the remaining time with backlog refinement to justify the allocated slot. |
| **d** ES | Llenar el tiempo restante con refinamiento del backlog para justificar el espacio asignado. |

**explanation**

| | |
|---|---|
| EN | Timeboxes are maximums, not targets. An event that achieves its purpose early should simply end. Filling remaining time with unrelated discussion treats the timebox as a target, and extending by team vote misapplies the timebox as a flexible guideline. |
| ES | Los timeboxes son máximos, no objetivos. Un evento que logra su propósito antes de tiempo simplemente debe terminar. Llenar el tiempo restante con discusiones no relacionadas trata el timebox como un objetivo, y extenderlo por votación del equipo lo aplica incorrectamente como una guía flexible. |

### 269. SM-AI-I · 3.8 · `e8517c51-1239-4eb6-b679-0485ccfc8988`

shown **2×** in the eight scored attempts — 1 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 3.8: Apply timebox rules to scenarios

**stem**

| | |
|---|---|
| EN | A two-week Sprint Review ends in 35 minutes because stakeholders had little feedback. A stakeholder says important input was skipped. What is the correct assessment? |
| ES | Una Sprint Review de dos semanas termina en 35 minutos porque los stakeholders tuvieron poco feedback. Un stakeholder dice que se omitió información importante. ¿Cuál es la evaluación correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The review is valid; ending early is acceptable when the event's purpose is fulfilled. `<<KEY` |
| **a** ES | La revisión es válida; terminar antes es aceptable cuando el propósito del evento se ha cumplido. `<<KEY` |
| **b** EN | The stakeholder is correct; a two-week Sprint Review should use most of its 2-hour timebox. |
| **b** ES | El stakeholder tiene razón; una Sprint Review de dos semanas debería usar la mayor parte de su timebox de 2 horas. |
| **c** EN | The Scrum Master failed by not filling remaining time to justify the allocated slot. |
| **c** ES | El Scrum Master falló al no llenar el tiempo restante para justificar el espacio asignado. |
| **d** EN | The timebox was violated because 35 minutes is below the proportional minimum for a two-week Sprint. |
| **d** ES | Se violó el timebox porque 35 minutos está por debajo del mínimo proporcional para un Sprint de dos semanas. |

**explanation**

| | |
|---|---|
| EN | Timeboxes define maximums, not minimums. A Sprint Review that fulfills its purpose in 35 minutes has not violated any rule. There is no proportional minimum, and the Scrum Master has no obligation to fill unused time. |
| ES | Los timeboxes definen máximos, no mínimos. Una Sprint Review que cumple su propósito en 35 minutos no ha violado ninguna regla. No existe un mínimo proporcional, y el Scrum Master no tiene la obligación de llenar el tiempo no utilizado. |

### 270. SM-AI-I · 3.8 · `283162a0-7b1e-4c85-a8f9-716224a36a81`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.8: Apply timebox rules to scenarios

**stem**

| | |
|---|---|
| EN | A team runs three-week Sprints. What is the maximum timebox for their Sprint Planning? |
| ES | Un equipo realiza Sprints de tres semanas. ¿Cuál es el timebox máximo para su Sprint Planning? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | 8 hours, because planning complexity is fixed regardless of Sprint length. |
| **a** ES | 8 horas, porque la complejidad de la planificación es fija independientemente de la duración del Sprint. |
| **b** EN | 4 hours, because three-week Sprints use the same timebox as two-week Sprints. |
| **b** ES | 4 horas, porque los Sprints de tres semanas usan el mismo timebox que los Sprints de dos semanas. |
| **c** EN | 6 hours, scaled proportionally from the 8-hour maximum for a four-week Sprint. `<<KEY` |
| **c** ES | 6 horas, escalado proporcionalmente desde el máximo de 8 horas para un Sprint de cuatro semanas. `<<KEY` |
| **d** EN | Any duration the team agrees on, since Sprint Planning timeboxes are adjustable by consensus. |
| **d** ES | Cualquier duración que el equipo acuerde, ya que los timeboxes del Sprint Planning son ajustables por consenso. |

**explanation**

| | |
|---|---|
| EN | Sprint Planning is timeboxed at up to 8 hours for a four-week Sprint, scaling proportionally for shorter Sprints. Three weeks is three-quarters of four weeks, giving a 6-hour maximum. Treating 8 hours as fixed ignores proportionality, and treating the timebox as team-adjustable contradicts the Scrum Guide. |
| ES | El Sprint Planning tiene un timebox de hasta 8 horas para un Sprint de cuatro semanas, escalando proporcionalmente para Sprints más cortos. Tres semanas equivalen a tres cuartas partes de cuatro semanas, lo que da un máximo de 6 horas. Tratar las 8 horas como fijas ignora la proporcionalidad, y tratar el timebox como ajustable por el equipo contradice la Guía de Scrum. |

### 271. SM-AI-I · 3.9 · `017bdded-af94-423b-8a54-26d3ef116a10`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.9: Select a Sprint Goal that is coherent and outcome-focused, and distinguish it from the Product Backlog items selected for the Sprint

**stem**

| | |
|---|---|
| EN | Mid-Sprint, Developers find two selected items are blocked but can still meet the Sprint Goal using three different items. What should they do? |
| ES | A mitad del Sprint, los Developers descubren que dos elementos seleccionados están bloqueados, pero aún pueden cumplir el Sprint Goal usando tres elementos diferentes. ¿Qué deberían hacer? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continue with only the original items, because the Sprint Goal locks in every item chosen at Planning. |
| **a** ES | Continuar solo con los elementos originales, porque el Sprint Goal fija cada elemento elegido en el Planning. |
| **b** EN | Negotiate with the Product Owner to swap the blocked items for alternatives that still achieve the Sprint Goal. `<<KEY` |
| **b** ES | Negociar con el Product Owner para intercambiar los elementos bloqueados por alternativas que aún permitan alcanzar el Sprint Goal. `<<KEY` |
| **c** EN | Wait until the next Sprint, because the Sprint Backlog is frozen once Planning ends. |
| **c** ES | Esperar hasta el próximo Sprint, porque el Sprint Backlog queda congelado una vez que termina el Planning. |
| **d** EN | Cancel the Sprint, because blocked items mean the Sprint Goal can no longer be met. |
| **d** ES | Cancelar el Sprint, porque los elementos bloqueados significan que el Sprint Goal ya no puede cumplirse. |

**explanation**

| | |
|---|---|
| EN | Selected Product Backlog items are the means to the Sprint Goal, not the goal itself, and can change during the Sprint as long as the Goal remains achievable. Cancelling the Sprint is only warranted when the Sprint Goal itself becomes obsolete. Treating the item list as frozen confuses the means with the objective. |
| ES | Los elementos del Product Backlog seleccionados son el medio para alcanzar el Sprint Goal, no el objetivo en sí, y pueden cambiar durante el Sprint siempre que el Goal siga siendo alcanzable. Cancelar el Sprint solo está justificado cuando el Sprint Goal en sí mismo se vuelve obsoleto. Tratar la lista de elementos como congelada confunde los medios con el objetivo. |

### 272. SM-AI-I · 3.9 · `51095906-4f29-4daf-8fb8-6e184d9158e0`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 3.9: Select a Sprint Goal that is coherent and outcome-focused, and distinguish it from the Product Backlog items selected for the Sprint

**stem**

| | |
|---|---|
| EN | During Sprint Planning, Developers want fewer backlog items to reduce risk; the Product Owner disagrees. What should the team do? |
| ES | Durante el Sprint Planning, los Developers quieren menos elementos del backlog para reducir el riesgo; el Product Owner no está de acuerdo. ¿Qué debería hacer el equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Adopt reduced scope unilaterally, because Developers own the Sprint Backlog and the Product Owner cannot override their forecast. |
| **a** ES | Adoptar un alcance reducido de forma unilateral, porque los Developers son dueños del Sprint Backlog y el Product Owner no puede anular su pronóstico. |
| **b** EN | Accept the full item list, because the Sprint Goal locks in every selected item and scope cannot be reduced. |
| **b** ES | Aceptar la lista completa de elementos, porque el Sprint Goal fija cada elemento seleccionado y el alcance no puede reducirse. |
| **c** EN | Defer the discussion to the Daily Scrum, where Developers can raise capacity concerns without the Product Owner. |
| **c** ES | Postergar la discusión al Daily Scrum, donde los Developers pueden plantear preocupaciones de capacidad sin el Product Owner. |
| **d** EN | Negotiate: Developers forecast deliverable items; the Product Owner clarifies priority — both in service of the Sprint Goal. `<<KEY` |
| **d** ES | Negociar: los Developers pronostican los elementos que pueden entregar; el Product Owner clarifica la prioridad — ambos al servicio del Sprint Goal. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Sprint Planning is a collaborative negotiation: Developers forecast what they can deliver, and the Product Owner clarifies value and priority — both in service of the Sprint Goal. The Sprint Goal sets the objective; the items are the negotiable means, so scope can be adjusted without violating the Goal commitment. The Daily Scrum is not a planning or negotiation forum, and neither the Product Owner nor the Developers can unilaterally dictate the final scope. |
| ES | El Sprint Planning es una negociación colaborativa: los Developers pronostican lo que pueden entregar y el Product Owner clarifica el valor y la prioridad, ambos al servicio del Sprint Goal. El Sprint Goal establece el objetivo; los elementos son los medios negociables, por lo que el alcance puede ajustarse sin violar el compromiso del Goal. El Daily Scrum no es un foro de planificación ni de negociación, y ni el Product Owner ni los Developers pueden dictar unilateralmente el alcance final. |

### 273. SM-AI-I · 3.9 · `a87592c5-c102-4cf9-acc4-6cefe5fdf9df`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 3.9: Select a Sprint Goal that is coherent and outcome-focused, and distinguish it from the Product Backlog items selected for the Sprint

**stem**

| | |
|---|---|
| EN | The Product Owner drafts a Sprint Goal before Sprint Planning and presents it to Developers as final. What should happen next? |
| ES | El Product Owner redacta un Sprint Goal antes del Sprint Planning y se lo presenta a los Developers como definitivo. ¿Qué debería ocurrir a continuación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Developers accept it unchanged, because the Product Owner owns the product vision and therefore owns the Sprint Goal. |
| **a** ES | Los Developers lo aceptan sin cambios, porque el Product Owner es dueño de la visión del producto y, por lo tanto, del Sprint Goal. |
| **b** EN | The whole Scrum Team collaborates during Sprint Planning to refine the Goal, including Developer input on feasibility. `<<KEY` |
| **b** ES | Todo el Scrum Team colabora durante el Sprint Planning para refinar el Goal, incluyendo la opinión de los Developers sobre su viabilidad. `<<KEY` |
| **c** EN | The Scrum Master approves or rejects the draft before Developers see it, to prevent unrealistic commitments. |
| **c** ES | El Scrum Master aprueba o rechaza el borrador antes de que los Developers lo vean, para evitar compromisos poco realistas. |
| **d** EN | The Goal is finalized after Sprint Planning, once the team knows which items were selected and completed. |
| **d** ES | El Goal se finaliza después del Sprint Planning, una vez que el equipo sabe qué elementos fueron seleccionados y completados. |

**explanation**

| | |
|---|---|
| EN | The Sprint Goal is crafted collaboratively by the whole Scrum Team during Sprint Planning, not handed down by the Product Owner alone. Developers must negotiate feasibility, making the Goal a shared commitment. The Scrum Master has no approval authority over the Goal, and the Goal must be established during Planning, not after it concludes. |
| ES | El Sprint Goal se elabora de forma colaborativa por todo el Scrum Team durante el Sprint Planning, no es impuesto únicamente por el Product Owner. Los Developers deben negociar la viabilidad, convirtiendo el Goal en un compromiso compartido. El Scrum Master no tiene autoridad de aprobación sobre el Goal, y el Goal debe establecerse durante el Planning, no después de que concluya. |

### 274. SM-AI-I · 3.9 · `ed9c95b6-a285-4e45-b68c-fe526000f7db`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 3.9: Select a Sprint Goal that is coherent and outcome-focused, and distinguish it from the Product Backlog items selected for the Sprint

**stem**

| | |
|---|---|
| EN | Mid-Sprint, Developers find a small unplanned item that would advance the Sprint Goal better than an originally selected item. What should they do? |
| ES | A mitad del Sprint, los Developers encuentran un elemento no planificado pequeño que avanzaría el Sprint Goal mejor que uno de los elementos originalmente seleccionados. ¿Qué deberían hacer? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Defer it to the next Sprint, because the Sprint Backlog is frozen once Planning ends. |
| **a** ES | Postergarlo al próximo Sprint, porque el Sprint Backlog queda congelado una vez que termina el Planning. |
| **b** EN | Discuss the swap with the Product Owner; if it better serves the Sprint Goal, update the Sprint Backlog. `<<KEY` |
| **b** ES | Discutir el intercambio con el Product Owner; si sirve mejor al Sprint Goal, actualizar el Sprint Backlog. `<<KEY` |
| **c** EN | Add it without consulting the Product Owner, because Developers own the Sprint Backlog and can change it freely. |
| **c** ES | Agregarlo sin consultar al Product Owner, porque los Developers son dueños del Sprint Backlog y pueden modificarlo libremente. |
| **d** EN | Cancel the Sprint and re-plan, because any deviation from the original Sprint Backlog violates the commitment. |
| **d** ES | Cancelar el Sprint y replanificar, porque cualquier desviación del Sprint Backlog original viola el compromiso. |

**explanation**

| | |
|---|---|
| EN | The Sprint Backlog is not frozen; Developers may add or swap work in collaboration with the Product Owner as long as the Sprint Goal is preserved. Acting without consulting the Product Owner ignores their role in clarifying value and priority. Deferring beneficial work or cancelling the Sprint both misunderstand the relationship between the flexible means (items) and the fixed objective (the Sprint Goal). |
| ES | El Sprint Backlog no está congelado; los Developers pueden agregar o intercambiar trabajo en colaboración con el Product Owner siempre que se preserve el Sprint Goal. Actuar sin consultar al Product Owner ignora su rol en la clarificación del valor y la prioridad. Postergar el trabajo beneficioso o cancelar el Sprint son malentendidos sobre la relación entre los medios flexibles (elementos) y el objetivo fijo (el Sprint Goal). |

### 275. SM-AI-I · 4.1 · `c484ae8e-71c2-4177-9715-1c3256d5b9e3`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.1: Identify each artifact's commitment

**stem**

| | |
|---|---|
| EN | Which artifact's commitment is the Definition of Done? |
| ES | ¿El compromiso de cuál artefacto es el Definition of Done? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Increment, because every Increment must meet the Definition of Done to be releasable. `<<KEY` |
| **a** ES | El Increment, porque todo Increment debe cumplir el Definition of Done para ser publicable. `<<KEY` |
| **b** EN | The Sprint Backlog, because Done criteria govern what the team selects each Sprint. |
| **b** ES | El Sprint Backlog, porque los criterios de Done rigen lo que el equipo selecciona en cada Sprint. |
| **c** EN | The Product Backlog, because Done criteria define the quality standard for the whole product. |
| **c** ES | El Product Backlog, porque los criterios de Done definen el estándar de calidad para todo el producto. |
| **d** EN | The Product Goal, because the goal is only achieved when all work meets Done criteria. |
| **d** ES | El Product Goal, porque el objetivo solo se alcanza cuando todo el trabajo cumple los criterios de Done. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide assigns the Definition of Done as the commitment for the Increment. It is the quality standard an Increment must meet before it can be considered complete and potentially released. The Sprint Backlog's commitment is the Sprint Goal, and the Product Backlog's commitment is the Product Goal. |
| ES | La Guía Scrum 2020 asigna el Definition of Done como el compromiso del Increment. Es el estándar de calidad que un Increment debe cumplir antes de poder considerarse completo y potencialmente publicable. El compromiso del Sprint Backlog es el Sprint Goal, y el compromiso del Product Backlog es el Product Goal. |

### 276. SM-AI-I · 4.1 · `ba1361f7-2967-4f32-9fb1-705d09ff3eca`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.1: Identify each artifact's commitment

**stem**

| | |
|---|---|
| EN | Which commitment belongs to the Sprint Backlog? |
| ES | ¿Cuál compromiso pertenece al Sprint Backlog? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The selected Product Backlog items, representing the team's delivery scope for the Sprint. |
| **a** ES | Los elementos del Product Backlog seleccionados, que representan el alcance de entrega del equipo para el Sprint. |
| **b** EN | The Product Goal, the overarching long-term objective all Sprint work must serve. |
| **b** ES | El Product Goal, el objetivo a largo plazo general al que debe servir todo el trabajo del Sprint. |
| **c** EN | The Definition of Done, the quality criteria completed Sprint items must satisfy. |
| **c** ES | El Definition of Done, los criterios de calidad que deben satisfacer los elementos completados del Sprint. |
| **d** EN | The Sprint Goal, the single objective giving the Sprint Backlog its purpose and coherence. `<<KEY` |
| **d** ES | El Sprint Goal, el único objetivo que le da al Sprint Backlog su propósito y coherencia. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide identifies the Sprint Goal as the commitment for the Sprint Backlog. The selected Product Backlog items are part of the Sprint Backlog but are not its commitment. The Product Goal belongs to the Product Backlog, and the Definition of Done belongs to the Increment. |
| ES | La Guía Scrum 2020 identifica el Sprint Goal como el compromiso del Sprint Backlog. Los elementos del Product Backlog seleccionados forman parte del Sprint Backlog, pero no son su compromiso. El Product Goal pertenece al Product Backlog y el Definition of Done pertenece al Increment. |

### 277. SM-AI-I · 4.10 · `a6477254-8690-45d3-932c-0ec80654f77d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.10: Apply INVEST criteria to Product Backlog Items

**stem**

| | |
|---|---|
| EN | A PBI reads: 'Improve system performance.' The team cannot agree on what 'improve' means or how to confirm it is done. Which INVEST criterion does this PBI most clearly fail? |
| ES | Un PBI dice: 'Mejorar el rendimiento del sistema.' El equipo no puede ponerse de acuerdo en qué significa 'mejorar' ni en cómo confirmar que está hecho. ¿Qué criterio INVEST falla más claramente este PBI? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Negotiable — open the story's backlog rank to team discussion before refining its wording. |
| **a** ES | Negociable — abrir el rango del backlog de la historia a discusión del equipo antes de refinar su redacción. |
| **b** EN | Small — split it into sub-tasks so each can be finished within a single day. |
| **b** ES | Pequeño — dividirla en subtareas para que cada una pueda terminarse en un solo día. |
| **c** EN | Estimable — require all members to gain performance-tuning expertise before proceeding. |
| **c** ES | Estimable — requerir que todos los miembros adquieran experiencia en ajuste de rendimiento antes de continuar. |
| **d** EN | Testable — add measurable acceptance criteria so completion can be verified objectively. `<<KEY` |
| **d** ES | Verificable — agregar criterios de aceptación medibles para que la finalización pueda verificarse objetivamente. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Without measurable acceptance criteria, there is no way to confirm the work is complete, which is the Testable criterion. Splitting into single-day tasks addresses Small, not the ambiguity of 'done.' Requiring universal expertise misapplies Estimable, and reopening backlog rank is irrelevant to the wording problem. |
| ES | Sin criterios de aceptación medibles, no hay forma de confirmar que el trabajo está completo, lo cual corresponde al criterio Verificable (Testable). Dividir en tareas de un día aborda el criterio Pequeño, no la ambigüedad de 'hecho'. Exigir experiencia universal aplica incorrectamente el criterio Estimable, y reabrir el rango del backlog es irrelevante para el problema de redacción. |

### 278. SM-AI-I · 4.10 · `c0e09567-faa6-4616-8ed8-37de2bb70b6d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.10: Apply INVEST criteria to Product Backlog Items

**stem**

| | |
|---|---|
| EN | Story B ('Allow users to log in') cannot be tested until Story A ('Set up authentication service') is deployed. Which action correctly applies the Independent criterion? |
| ES | La Historia B ('Permitir a los usuarios iniciar sesión') no puede probarse hasta que la Historia A ('Configurar el servicio de autenticación') esté desplegada. ¿Qué acción aplica correctamente el criterio Independiente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Remove Story A; infrastructure stories cannot deliver independent value and therefore violate INVEST. |
| **a** ES | Eliminar la Historia A; las historias de infraestructura no pueden entregar valor independiente y por lo tanto violan INVEST. |
| **b** EN | Keep both stories and schedule A before B to manage the technical sequencing constraint. `<<KEY` |
| **b** ES | Mantener ambas historias y programar A antes que B para gestionar la restricción de secuenciación técnica. `<<KEY` |
| **c** EN | Rewrite both stories; referencing related functionality automatically fails Independence. |
| **c** ES | Reescribir ambas historias; hacer referencia a funcionalidades relacionadas falla automáticamente el criterio de Independencia. |
| **d** EN | Merge A and B; any sequencing dependency is a business-dependency violation under INVEST. |
| **d** ES | Fusionar A y B; cualquier dependencia de secuenciación es una violación de dependencia de negocio bajo INVEST. |

**explanation**

| | |
|---|---|
| EN | Independence means stories should be schedulable without being locked into a fixed order by business logic — it does not forbid technical sequencing. Keeping both stories and ordering them appropriately is the correct response. Merging them or rewriting from scratch treats a manageable dependency as an automatic violation, and removing infrastructure stories misreads the Valuable criterion. |
| ES | Independencia significa que las historias deben poder programarse sin estar bloqueadas en un orden fijo por lógica de negocio; no prohíbe la secuenciación técnica. Mantener ambas historias y ordenarlas apropiadamente es la respuesta correcta. Fusionarlas o reescribirlas desde cero trata una dependencia manejable como una violación automática, y eliminar las historias de infraestructura malinterpreta el criterio Valioso. |

### 279. SM-AI-I · 4.10 · `fab82da0-0f9e-4337-b87d-c44fb707dfb0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.10: Apply INVEST criteria to Product Backlog Items

**stem**

| | |
|---|---|
| EN | A PBI reads: 'Handle all edge cases in the payment gateway integration.' The team cannot form even a rough estimate. Which INVEST criterion is violated and what is the correct fix? |
| ES | Un PBI dice: 'Manejar todos los casos extremos en la integración con la pasarela de pago.' El equipo no puede formar ni una estimación aproximada. ¿Qué criterio INVEST se viola y cuál es la corrección adecuada? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Estimable — switch from story points to hours, which makes any story concrete enough to size. |
| **a** ES | Estimable — cambiar de puntos de historia a horas, lo que hace que cualquier historia sea lo suficientemente concreta para dimensionar. |
| **b** EN | Small — break it into one-day tasks, which will automatically make it estimable as well. |
| **b** ES | Pequeño — dividirlo en tareas de un día, lo que automáticamente también lo hará estimable. |
| **c** EN | Estimable — refine the story to identify specific edge cases so the scope is concrete enough to size. `<<KEY` |
| **c** ES | Estimable — refinar la historia para identificar casos extremos específicos de modo que el alcance sea lo suficientemente concreto para dimensionar. `<<KEY` |
| **d** EN | Testable — write automated test scripts for each edge case before attempting to estimate. |
| **d** ES | Verificable — escribir scripts de prueba automatizados para cada caso extremo antes de intentar estimar. |

**explanation**

| | |
|---|---|
| EN | The vague scope ('all edge cases') makes sizing impossible, which is an Estimable failure. The fix is to clarify scope so the team can form a reasonable estimate — story points remain perfectly valid. Switching to hours does not resolve vague scope. Splitting into one-day tasks conflates Small with Estimable, and requiring automated tests first misapplies Testable. |
| ES | El alcance vago ('todos los casos extremos') hace imposible el dimensionamiento, lo cual es un fallo del criterio Estimable. La corrección consiste en clarificar el alcance para que el equipo pueda formar una estimación razonable; los puntos de historia siguen siendo perfectamente válidos. Cambiar a horas no resuelve el alcance vago. Dividir en tareas de un día confunde el criterio Pequeño con Estimable, y exigir pruebas automatizadas primero aplica incorrectamente el criterio Verificable. |

### 280. SM-AI-I · 4.10 · `fc12e795-696b-4ce8-ac3a-9c6e1e9471e4`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.10: Apply INVEST criteria to Product Backlog Items

**stem**

| | |
|---|---|
| EN | A team cannot estimate a database-migration PBI because one engineer is unfamiliar with the target technology. What does the Estimable criterion require here? |
| ES | Un equipo no puede estimar un PBI de migración de base de datos porque un ingeniero no está familiarizado con la tecnología de destino. ¿Qué requiere el criterio Estimable en este caso? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Remove the PBI from the backlog until every team member has independently acquired full expertise in the target technology. |
| **a** ES | Eliminar el PBI del backlog hasta que cada miembro del equipo haya adquirido de forma independiente experiencia completa en la tecnología de destino. |
| **b** EN | Reclassify it as failing the Testable criterion, because a knowledge gap prevents the team from defining clear acceptance criteria. |
| **b** ES | Reclasificarlo como un fallo del criterio Verificable, porque una brecha de conocimiento impide al equipo definir criterios de aceptación claros. |
| **c** EN | Run a spike or consult the knowledgeable engineer to build enough collective understanding across the team to produce an estimate. `<<KEY` |
| **c** ES | Realizar un spike o consultar al ingeniero con conocimiento para construir suficiente comprensión colectiva en el equipo y poder producir una estimación. `<<KEY` |
| **d** EN | Decompose it into one-day tasks so that each piece is too small to require a formal estimation conversation. |
| **d** ES | Descomponerlo en tareas de un día para que cada parte sea demasiado pequeña como para requerir una conversación formal de estimación. |

**explanation**

| | |
|---|---|
| EN | Estimable requires sufficient collective understanding to size the work, not that every individual be an expert. A spike or knowledge-sharing session resolves the gap so the team can estimate together. Demanding universal expertise before accepting a story misapplies the criterion. Splitting solely to avoid estimation conflates the Small criterion with Estimable. Reclassifying the issue as a Testable failure misdirects attention, since the obstacle is sizing uncertainty, not the inability to define acceptance criteria. |
| ES | El criterio Estimable requiere suficiente comprensión colectiva para dimensionar el trabajo, no que cada individuo sea un experto. Un spike o una sesión de transferencia de conocimiento resuelve la brecha para que el equipo pueda estimar en conjunto. Exigir experiencia universal antes de aceptar una historia aplica incorrectamente el criterio. Dividir únicamente para evitar la estimación confunde el criterio Pequeño con Estimable. Reclasificar el problema como un fallo de Verificable desvía la atención, ya que el obstáculo es la incertidumbre en el dimensionamiento, no la incapacidad de definir criterios de aceptación. |

### 281. SM-AI-I · 4.11 · `2af8efb4-bd7f-485f-bb39-fba94dd559cc`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 4.11: Apply the Definition of Done and artifact transparency to work generated or assisted by AI

**stem**

| | |
|---|---|
| EN | A Developer argues AI-assisted items should skip Sprint Review inspection because AI carries less human-error risk. What should the Scrum Master do? |
| ES | Un Developer argumenta que los elementos asistidos por IA deberían omitir la inspección en el Sprint Review porque la IA conlleva menor riesgo de error humano. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Coach the Developer that all Increment items must be inspectable at Sprint Review regardless of origin. `<<KEY` |
| **a** ES | Orientar al Developer en que todos los elementos del Increment deben ser inspeccionables en el Sprint Review independientemente de su origen. `<<KEY` |
| **b** EN | Escalate to the Product Owner, who decides whether AI-produced items warrant full Sprint Review inspection. |
| **b** ES | Escalar al Product Owner, quien decide si los elementos producidos por IA ameritan una inspección completa en el Sprint Review. |
| **c** EN | Agree; present AI-produced items as a summary only, reserving detailed inspection for human-authored work. |
| **c** ES | Estar de acuerdo; presentar los elementos producidos por IA solo como un resumen, reservando la inspección detallada para el trabajo de autoría humana. |
| **d** EN | Agree; reduced human-error risk means stakeholder inspection of AI-produced items adds no value. |
| **d** ES | Estar de acuerdo; el menor riesgo de error humano significa que la inspección de los interesados sobre los elementos producidos por IA no agrega valor. |

**explanation**

| | |
|---|---|
| EN | Sprint Review exists to inspect the entire Increment; skipping inspection of AI-produced portions violates the transparency and inspection pillars of Scrum. Perceived risk level does not determine whether an item is inspected. Presenting AI items only as a summary still withholds full inspectability, and the Product Owner cannot override this structural Scrum event requirement. |
| ES | El Sprint Review existe para inspeccionar el Increment completo; omitir la inspección de las partes producidas por IA viola los pilares de transparencia e inspección de Scrum. El nivel de riesgo percibido no determina si un elemento es inspeccionado. Presentar los elementos de IA solo como un resumen sigue privando de plena inspeccionabilidad, y el Product Owner no puede anular este requisito estructural del evento de Scrum. |

### 282. SM-AI-I · 4.11 · `6ef47c12-eeb8-4116-a664-60ff5cf2c2fa`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.11: Apply the Definition of Done and artifact transparency to work generated or assisted by AI

**stem**

| | |
|---|---|
| EN | An AI tool drafts a feature; a Developer lightly edits it before Sprint end. The Developer argues human edits make the DoD unnecessary. What is correct? |
| ES | Una herramienta de IA redacta una funcionalidad; un Developer la edita ligeramente antes del fin del Sprint. El Developer argumenta que las ediciones humanas hacen innecesaria la Definition of Done. ¿Qué es correcto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The full DoD must still be met; human editing does not transfer authorship in a way that waives any DoD criteria for the Increment. `<<KEY` |
| **a** ES | La Definition of Done completa debe seguir cumpliéndose; la edición humana no transfiere la autoría de manera que exima de ningún criterio de la Definition of Done para el Increment. `<<KEY` |
| **b** EN | Product Owner acceptance of the edited output substitutes for the DoD, since business sign-off confirms the work meets the necessary quality standard for release. |
| **b** ES | La aceptación del Product Owner sobre el resultado editado sustituye a la Definition of Done, ya que la aprobación del negocio confirma que el trabajo cumple el estándar de calidad necesario para su lanzamiento. |
| **c** EN | The DoD applies only to the Developer-edited portions; AI-drafted sections inherently carry lower defect risk and do not require the same quality checks. |
| **c** ES | La Definition of Done se aplica solo a las partes editadas por el Developer; las secciones redactadas por IA conllevan inherentemente menor riesgo de defectos y no requieren las mismas verificaciones de calidad. |
| **d** EN | Human authorship of the final version exempts the work from the Definition of Done, because the Developer's edits establish full ownership and accountability for quality. |
| **d** ES | La autoría humana de la versión final exime al trabajo de la Definition of Done, porque las ediciones del Developer establecen plena propiedad y responsabilidad sobre la calidad. |

**explanation**

| | |
|---|---|
| EN | The Definition of Done applies to the Increment regardless of how work was produced. Human editing does not transfer authorship in a way that waives DoD criteria. Applying the DoD only to edited portions creates an inconsistent standard, and Product Owner acceptance is separate from and cannot replace the DoD. |
| ES | La Definition of Done se aplica al Increment independientemente de cómo se produjo el trabajo. La edición humana no transfiere la autoría de manera que exima de los criterios de la Definition of Done. Aplicar la Definition of Done solo a las partes editadas crea un estándar inconsistente, y la aceptación del Product Owner es independiente de la Definition of Done y no puede reemplazarla. |

### 283. SM-AI-I · 4.11 · `875efc7d-4abe-436a-a704-e3debb0448e7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.11: Apply the Definition of Done and artifact transparency to work generated or assisted by AI

**stem**

| | |
|---|---|
| EN | Developers want to record whether each Increment item was AI-assisted. A team member says this is optional audit overhead, not a Scrum requirement. What should the Scrum Master say? |
| ES | Los Developers quieren registrar si cada elemento del Increment fue asistido por IA. Un miembro del equipo dice que esto es una sobrecarga de auditoría opcional, no un requisito de Scrum. ¿Qué debería decir el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Clarify that provenance supports Increment transparency and inspectability, making it a legitimate Scrum concern. `<<KEY` |
| **a** ES | Aclarar que la procedencia apoya la transparencia e inspeccionabilidad del Increment, lo que lo convierte en una preocupación legítima de Scrum. `<<KEY` |
| **b** EN | Agree; provenance tracking is an external audit concern unrelated to Scrum's transparency pillar. |
| **b** ES | Estar de acuerdo; el seguimiento de procedencia es una preocupación de auditoría externa no relacionada con el pilar de transparencia de Scrum. |
| **c** EN | Suggest a separate AI transparency log outside Scrum artifacts to keep the Increment records uncluttered. |
| **c** ES | Sugerir un registro de transparencia de IA separado fuera de los artefactos de Scrum para mantener los registros del Increment sin desorden. |
| **d** EN | Agree; stakeholders need only the final deliverable, not details about how it was produced. |
| **d** ES | Estar de acuerdo; los interesados solo necesitan el entregable final, no detalles sobre cómo fue producido. |

**explanation**

| | |
|---|---|
| EN | Scrum's transparency pillar requires that the Increment be fully inspectable, which includes understanding how work was produced and reviewed. Treating provenance as optional audit overhead misrepresents what transparency demands. Isolating it in a separate log outside Scrum artifacts similarly undermines the inspectability of the Increment. |
| ES | El pilar de transparencia de Scrum requiere que el Increment sea completamente inspeccionable, lo que incluye entender cómo se produjo y revisó el trabajo. Tratar la procedencia como una sobrecarga de auditoría opcional tergiversa lo que exige la transparencia. Aislarla en un registro separado fuera de los artefactos de Scrum también socava la inspeccionabilidad del Increment. |

### 284. SM-AI-I · 4.13 · `4800350b-c75a-4627-8b02-4302307a3c9b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.13: Apply the Definition of Done to determine whether work is releasable

**stem**

| | |
|---|---|
| EN | An organization requires code review and regression testing. The team's DoD also requires performance benchmarking. An item has code review and regression tests but no benchmark. Is it Done? |
| ES | Una organización requiere revisión de código y pruebas de regresión. La Definition of Done del equipo también requiere benchmarking de rendimiento. Un elemento tiene revisión de código y pruebas de regresión, pero no tiene benchmark. ¿Está Hecho? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Yes; meeting organizational quality standards replaces any additional team-defined DoD criteria. |
| **a** ES | Sí; cumplir con los estándares de calidad organizacionales reemplaza cualquier criterio adicional de la Definition of Done definido por el equipo. |
| **b** EN | No; the team's DoD must include the organizational standard and may add criteria — all must be met. `<<KEY` |
| **b** ES | No; la Definition of Done del equipo debe incluir el estándar organizacional y puede agregar criterios adicionales: todos deben cumplirse. `<<KEY` |
| **c** EN | Yes; the Scrum Master may waive extra DoD criteria when organizational standards are already satisfied. |
| **c** ES | Sí; el Scrum Master puede eximir criterios adicionales de la Definition of Done cuando los estándares organizacionales ya se han cumplido. |
| **d** EN | No; only the organizational standard applies to releases, so the team's benchmark criterion is irrelevant. |
| **d** ES | No; solo el estándar organizacional aplica para los lanzamientos, por lo que el criterio de benchmark del equipo es irrelevante. |

**explanation**

| | |
|---|---|
| EN | When an organizational standard exists, the team's DoD must include it and may add further criteria; all criteria in the resulting DoD must be met. Organizational standards do not replace the team's DoD. Missing the performance benchmark means the item is not Done regardless of organizational compliance. |
| ES | Cuando existe un estándar organizacional, la Definition of Done del equipo debe incluirlo y puede agregar criterios adicionales; todos los criterios de la Definition of Done resultante deben cumplirse. Los estándares organizacionales no reemplazan la Definition of Done del equipo. No cumplir con el benchmark de rendimiento significa que el elemento no está Hecho, independientemente del cumplimiento organizacional. |

### 285. SM-AI-I · 4.13 · `b42e63bb-f018-4b31-87a7-8467e7f94f15`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.13: Apply the Definition of Done to determine whether work is releasable

**stem**

| | |
|---|---|
| EN | A Sprint ends with three items reviewed. Two fully meet the Definition of Done. The third passes all functional tests but skips the mandatory security review in the DoD. What is the correct determination about the Increment? |
| ES | Un Sprint termina con tres elementos revisados. Dos cumplen completamente con la Definition of Done. El tercero pasa todas las pruebas funcionales, pero omite la revisión de seguridad obligatoria en la Definition of Done. ¿Cuál es la determinación correcta sobre el Increment? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | All three items form the Increment; passing the majority of DoD criteria satisfies the requirement. |
| **a** ES | Los tres elementos forman el Increment; cumplir con la mayoría de los criterios de la Definition of Done satisface el requisito. |
| **b** EN | All three items form the Increment; the Product Owner may waive the security review at Sprint Review. |
| **b** ES | Los tres elementos forman el Increment; el Product Owner puede eximir la revisión de seguridad en el Sprint Review. |
| **c** EN | Only the two compliant items form the Increment; the third is not Done and cannot be included. `<<KEY` |
| **c** ES | Solo los dos elementos conformes forman el Increment; el tercero no está Hecho y no puede ser incluido. `<<KEY` |
| **d** EN | All three items form the Increment; item-level acceptance criteria override the shared DoD. |
| **d** ES | Los tres elementos forman el Increment; los criterios de aceptación a nivel de elemento reemplazan la Definition of Done compartida. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide states that a Product Backlog item not meeting the Definition of Done cannot be included in an Increment. Only the two fully compliant items constitute the Increment. The Product Owner cannot waive the DoD to release a non-compliant item, passing a majority of DoD criteria does not satisfy the requirement, and item-level acceptance criteria do not replace the shared Definition of Done. |
| ES | La Guía Scrum 2020 establece que un elemento del Product Backlog que no cumple con la Definition of Done no puede ser incluido en un Increment. Solo los dos elementos completamente conformes constituyen el Increment. El Product Owner no puede eximir la Definition of Done para liberar un elemento no conforme, cumplir con la mayoría de los criterios de la Definition of Done no satisface el requisito, y los criterios de aceptación a nivel de elemento no reemplazan la Definition of Done compartida. |

### 286. SM-AI-I · 4.13 · `ce076292-5ec1-432d-aa16-d993d229aa00`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 4.13: Apply the Definition of Done to determine whether work is releasable

**stem**

| | |
|---|---|
| EN | A new Scrum Team is forming and no organizational Definition of Done exists. Who is responsible for creating the Definition of Done? |
| ES | Se está formando un nuevo Scrum Team y no existe una Definition of Done organizacional. ¿Quién es responsable de crear la Definition of Done? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Product Owner, because the DoD governs releasability and release decisions belong to the Product Owner. |
| **a** ES | El Product Owner, porque la Definition of Done rige la capacidad de lanzamiento y las decisiones de lanzamiento le pertenecen al Product Owner. |
| **b** EN | The whole Scrum Team — Developers, Product Owner, and Scrum Master — creates it together. `<<KEY` |
| **b** ES | Todo el Scrum Team — Developers, Product Owner y Scrum Master — la crea en conjunto. `<<KEY` |
| **c** EN | The Developers, because they perform the work and best understand technical quality requirements. |
| **c** ES | Los Developers, porque realizan el trabajo y comprenden mejor los requisitos de calidad técnica. |
| **d** EN | The Scrum Master, because verifying quality standards before Sprint Review is the Scrum Master's core duty. |
| **d** ES | El Scrum Master, porque verificar los estándares de calidad antes del Sprint Review es una función central del Scrum Master. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide assigns creation of the Definition of Done to the Scrum Team as a whole, not to any single role. This is a deliberate change from earlier versions that listed only the Developers as responsible for the DoD. |
| ES | La Guía Scrum 2020 asigna la creación de la Definition of Done al Scrum Team en su conjunto, no a un solo rol. Este es un cambio deliberado respecto a versiones anteriores que indicaban solo a los Developers como responsables de la Definition of Done. |

### 287. SM-AI-I · 4.14 · `4c0fe32b-3b80-490c-8067-899bce234a8c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.14: Diagnose why a team that runs the events correctly is still not adapting

**stem**

| | |
|---|---|
| EN | A Scrum team holds every event on time, keeps artifacts current, and agrees on Retrospective improvements each Sprint. Yet the same three impediments recur and no agreed improvement has been implemented in two months. What is the most accurate diagnosis? |
| ES | Un equipo Scrum realiza cada evento a tiempo, mantiene los artefactos actualizados y acuerda mejoras en la Sprint Retrospective cada Sprint. Sin embargo, los mismos tres impedimentos se repiten y ninguna mejora acordada se ha implementado en dos meses. ¿Cuál es el diagnóstico más preciso? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Inspection is failing: Retrospectives are too infrequent to detect the same impediments before they recur next Sprint. |
| **a** ES | La inspección está fallando: las Sprint Retrospectives son demasiado poco frecuentes para detectar los mismos impedimentos antes de que vuelvan a ocurrir en el siguiente Sprint. |
| **b** EN | Adaptation is failing: the team inspects and agrees on changes but consistently does not act on what inspection reveals. `<<KEY` |
| **b** ES | La adaptación está fallando: el equipo inspecciona y acuerda cambios, pero sistemáticamente no actúa en función de lo que la inspección revela. `<<KEY` |
| **c** EN | Transparency is failing: artifacts do not surface the recurring impediments clearly enough for the team to identify them. |
| **c** ES | La transparencia está fallando: los artefactos no muestran los impedimentos recurrentes con suficiente claridad para que el equipo pueda identificarlos. |
| **d** EN | Sprint Planning is failing: impediments are not captured in the Sprint Backlog, so they are never assigned an owner. |
| **d** ES | El Sprint Planning está fallando: los impedimentos no se registran en el Sprint Backlog, por lo que nunca se les asigna un responsable. |

**explanation**

| | |
|---|---|
| EN | When events are held, artifacts are current, and improvements are agreed upon yet never enacted, the breakdown is in the adapt step of inspect-and-adapt. The team can already see its problems, so transparency is not the issue. Claiming Retrospectives are too infrequent ignores that the impediments surface every Sprint without resolution. Attributing the failure to Sprint Planning and ownership misses that agreement already exists in the Retrospective — the problem is that agreed actions are not carried out, which is a pure adaptation failure. |
| ES | Cuando los eventos se realizan, los artefactos están actualizados y las mejoras se acuerdan pero nunca se llevan a cabo, la falla está en el paso de adaptación del ciclo de inspección y adaptación. El equipo ya puede ver sus problemas, por lo que la transparencia no es el inconveniente. Afirmar que las Sprint Retrospectives son demasiado poco frecuentes ignora que los impedimentos aparecen cada Sprint sin resolverse. Atribuir la falla al Sprint Planning y a la asignación de responsables pasa por alto que el acuerdo ya existe en la Sprint Retrospective; el problema es que las acciones acordadas no se ejecutan, lo cual es una falla puramente de adaptación. |

### 288. SM-AI-I · 4.14 · `7a86cc88-4316-4121-a428-68c67fa9ebea`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 4.14: Diagnose why a team that runs the events correctly is still not adapting

**stem**

| | |
|---|---|
| EN | Every Sprint, the burndown stalls in the final two days. The issue is raised at each Retrospective. Transparency is intact and events are held correctly. No change has occurred across four Sprints. Which factor most specifically explains the persistent stagnation? |
| ES | En cada Sprint, el burndown se detiene en los últimos dos días. El problema se plantea en cada Retrospective. La transparencia está intacta y los eventos se realizan correctamente. No ha ocurrido ningún cambio a lo largo de cuatro Sprints. ¿Qué factor explica con mayor precisión el estancamiento persistente? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The burndown chart is wrong; switching to a cumulative flow diagram would reveal the root cause and trigger adaptation. |
| **a** ES | El gráfico burndown es incorrecto; cambiar a un diagrama de flujo acumulativo revelaría la causa raíz y desencadenaría la adaptación. |
| **b** EN | Empirical process control cannot address end-of-Sprint stalling; the feedback cycle is too short for reliable data. |
| **b** ES | El control de procesos empírico no puede abordar el estancamiento al final del Sprint; el ciclo de retroalimentación es demasiado corto para obtener datos confiables. |
| **c** EN | The pattern reflects a skill gap; the team needs training before it can adapt its approach to end-of-Sprint work. |
| **c** ES | El patrón refleja una brecha de habilidades; el equipo necesita capacitación antes de poder adaptar su enfoque al trabajo de fin de Sprint. |
| **d** EN | Inspection is occurring without consequence; the team sees the pattern each Sprint but executes no countermeasure. `<<KEY` |
| **d** ES | La inspección ocurre sin consecuencias; el equipo ve el patrón en cada Sprint pero no ejecuta ninguna contramedida. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | When a visible, recurring pattern goes unaddressed across multiple Sprints despite correct events and transparent artifacts, the failure is in the adapt step — the team inspects without consequence. Artifact choice and feedback-cycle length are not the issue; the data is already clear. Attributing the cause to a skill gap before any countermeasure is even attempted is an unwarranted inference that sidesteps the adaptation failure. |
| ES | Cuando un patrón visible y recurrente queda sin atender a lo largo de múltiples Sprints a pesar de que los eventos son correctos y los artefactos son transparentes, el fallo está en el paso de adaptación: el equipo inspecciona sin consecuencias. La elección de artefactos y la duración del ciclo de retroalimentación no son el problema; los datos ya son claros. Atribuir la causa a una brecha de habilidades antes de intentar siquiera alguna contramedida es una inferencia injustificada que evade el fallo de adaptación. |

### 289. SM-AI-I · 4.2 · `41611b9c-0525-4461-996f-cdf175d95856`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 4.2: Explain the Product Backlog as an emergent, ordered list owned by the PO

**stem**

| | |
|---|---|
| EN | Which characteristic most clearly distinguishes an 'ordered' Product Backlog from a merely 'prioritized' one? |
| ES | ¿Qué característica distingue más claramente un Product Backlog 'ordenado' de uno meramente 'priorizado'? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Each item holds a unique position reflecting the Product Owner's judgment across value, risk, dependency, and learning opportunities. `<<KEY` |
| **a** ES | Cada elemento ocupa una posición única que refleja el juicio del Product Owner considerando valor, riesgo, dependencias y oportunidades de aprendizaje. `<<KEY` |
| **b** EN | The whole team votes to assign each item a numeric rank, producing a democratically agreed sequence that the Product Owner then publishes. |
| **b** ES | Todo el equipo vota para asignar a cada elemento un rango numérico, produciendo una secuencia acordada democráticamente que el Product Owner luego publica. |
| **c** EN | Items are grouped into tiers (high, medium, low), allowing developers to self-select work freely within each tier based on skill and availability. |
| **c** ES | Los elementos se agrupan en niveles (alto, medio, bajo), lo que permite a los desarrolladores seleccionar libremente el trabajo dentro de cada nivel según sus habilidades y disponibilidad. |
| **d** EN | Items are ranked by ROI scores supplied by finance, ensuring the highest-value work always appears first regardless of other considerations. |
| **d** ES | Los elementos se clasifican por puntajes de ROI proporcionados por finanzas, garantizando que el trabajo de mayor valor siempre aparezca primero sin importar otras consideraciones. |

**explanation**

| | |
|---|---|
| EN | Ordering means every item occupies a unique position determined by the Product Owner's judgment across multiple factors — value, risk, dependencies, and learning opportunities. Tiering, pure ROI ranking, or team voting all fail to produce the precise, holistic sequence the Scrum Guide requires. |
| ES | Ordenar significa que cada elemento ocupa una posición única determinada por el juicio del Product Owner considerando múltiples factores: valor, riesgo, dependencias y oportunidades de aprendizaje. La agrupación por niveles, la clasificación pura por ROI o la votación del equipo no producen la secuencia precisa y holística que exige la Guía de Scrum. |

### 290. SM-AI-I · 4.3 · `5ea5663f-6781-4721-8ee1-159907825b2a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.3: Explain that the Sprint Backlog is created by and for the Developers

**stem**

| | |
|---|---|
| EN | Who creates the Sprint Backlog during Sprint Planning? |
| ES | ¿Quién crea el Sprint Backlog durante el Sprint Planning? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Scrum Master, because facilitating Sprint Planning is one of their primary responsibilities. |
| **a** ES | El Scrum Master, porque facilitar el Sprint Planning es una de sus principales responsabilidades. |
| **b** EN | The Product Owner, because they decide which items are built each Sprint. |
| **b** ES | El Product Owner, porque decide qué elementos se construyen en cada Sprint. |
| **c** EN | The entire Scrum Team, because Sprint Planning is a collaborative event for all three accountabilities. |
| **c** ES | Todo el Scrum Team, porque el Sprint Planning es un evento colaborativo para las tres responsabilidades. |
| **d** EN | The Developers, because the Sprint Backlog is their plan for the Sprint. `<<KEY` |
| **d** ES | Los Developers, porque el Sprint Backlog es su plan para el Sprint. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Sprint Backlog is created by the Developers as their own plan for the Sprint. While the whole Scrum Team participates in Sprint Planning, only the Developers select items and craft the delivery plan. The Product Owner's accountability for the Product Backlog does not extend to the Sprint Backlog, and the Scrum Master's facilitation role does not make them its creator. |
| ES | El Sprint Backlog es creado por los Developers como su propio plan para el Sprint. Si bien todo el Scrum Team participa en el Sprint Planning, solo los Developers seleccionan los elementos y elaboran el plan de entrega. La responsabilidad del Product Owner sobre el Product Backlog no se extiende al Sprint Backlog, y el rol de facilitación del Scrum Master no lo convierte en su creador. |

### 291. SM-AI-I · 4.3 · `9637282c-dff5-40a7-8683-b0f41cee77c8`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.3: Explain that the Sprint Backlog is created by and for the Developers

**stem**

| | |
|---|---|
| EN | During a Sprint, the Scrum Master updates the Sprint Backlog each morning after the Daily Scrum. Which concept does this violate? |
| ES | Durante un Sprint, el Scrum Master actualiza el Sprint Backlog cada mañana después del Daily Scrum. ¿Qué concepto viola esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Sprint Backlog is frozen at Sprint Planning and no one may change it during the Sprint. |
| **a** ES | El Sprint Backlog queda congelado en el Sprint Planning y nadie puede modificarlo durante el Sprint. |
| **b** EN | The Sprint Backlog is owned by the whole Scrum Team, so the Product Owner should update it. |
| **b** ES | El Sprint Backlog es propiedad de todo el Scrum Team, por lo que debería ser el Product Owner quien lo actualice. |
| **c** EN | The Sprint Backlog may only be updated during the Daily Scrum, not after it concludes. |
| **c** ES | El Sprint Backlog solo puede actualizarse durante el Daily Scrum, no después de que este concluya. |
| **d** EN | The Sprint Backlog is owned and updated by the Developers, not the Scrum Master. `<<KEY` |
| **d** ES | El Sprint Backlog es propiedad de los Developers y son ellos quienes lo actualizan, no el Scrum Master. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Sprint Backlog belongs solely to the Developers; they are the only ones who create and update it throughout the Sprint. Facilitating the Daily Scrum does not give the Scrum Master authority to modify the Sprint Backlog. The Sprint Backlog is not frozen after Sprint Planning — Developers adapt it as they learn. It is not owned by the whole Scrum Team, and there is no rule restricting updates to a specific moment tied to the Daily Scrum. |
| ES | El Sprint Backlog pertenece únicamente a los Developers; ellos son los únicos que lo crean y actualizan a lo largo del Sprint. Facilitar el Daily Scrum no le otorga al Scrum Master la autoridad para modificar el Sprint Backlog. El Sprint Backlog no queda congelado tras el Sprint Planning — los Developers lo adaptan a medida que aprenden. No es propiedad de todo el Scrum Team y no existe ninguna regla que restrinja las actualizaciones a un momento específico vinculado al Daily Scrum. |

### 292. SM-AI-I · 4.3 · `bdb00269-b54d-41c6-983d-93860c19c00d`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.3: Explain that the Sprint Backlog is created by and for the Developers

**stem**

| | |
|---|---|
| EN | Why do the Developers — rather than the Product Owner — own the Sprint Backlog? |
| ES | ¿Por qué los Developers, en lugar del Product Owner, son dueños del Sprint Backlog? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Ownership is shared: Developers manage tasks while the Product Owner manages the Sprint Goal within the Sprint Backlog. |
| **a** ES | La propiedad es compartida: los Developers gestionan las tareas mientras el Product Owner gestiona el Sprint Goal dentro del Sprint Backlog. |
| **b** EN | Developers own it because they outnumber other roles; the Product Owner retains veto authority over its content. |
| **b** ES | Los Developers son dueños porque son más numerosos que otros roles; el Product Owner conserva autoridad de veto sobre su contenido. |
| **c** EN | The Sprint Backlog is the Developers' plan for their own work; Product Backlog ownership does not extend to it. `<<KEY` |
| **c** ES | El Sprint Backlog es el plan de los Developers para su propio trabajo; la propiedad del Product Backlog no se extiende a él. `<<KEY` |
| **d** EN | The Product Owner temporarily delegates Sprint Backlog ownership during the Sprint and reclaims it at the Sprint Review. |
| **d** ES | El Product Owner delega temporalmente la propiedad del Sprint Backlog durante el Sprint y la recupera en el Sprint Review. |

**explanation**

| | |
|---|---|
| EN | The Sprint Backlog is created by and for the Developers as their self-managed plan for the Sprint. The Product Owner's accountability for the Product Backlog does not carry over to the Sprint Backlog. Ownership is not delegated, shared, or conditional — it belongs to the Developers. |
| ES | El Sprint Backlog es creado por y para los Developers como su plan autogestionado para el Sprint. La responsabilidad del Product Owner sobre el Product Backlog no se traslada al Sprint Backlog. La propiedad no se delega, no se comparte ni es condicional: pertenece a los Developers. |

### 293. SM-AI-I · 4.3 · `c11379f6-89f4-432a-a758-ebb56072e06f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.3: Explain that the Sprint Backlog is created by and for the Developers

**stem**

| | |
|---|---|
| EN | A Scrum Master updates the Sprint Backlog each morning after the Daily Scrum. How should this practice be categorized? |
| ES | Un Scrum Master actualiza el Sprint Backlog cada mañana después del Daily Scrum. ¿Cómo debe categorizarse esta práctica? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Acceptable: the Scrum Master holds the Sprint Backlog on the Developers' behalf. |
| **a** ES | Aceptable: el Scrum Master mantiene el Sprint Backlog en nombre de los Developers. |
| **b** EN | Correct: the Daily Scrum is Scrum Master-led, and producing an updated Sprint Backlog is its output. |
| **b** ES | Correcto: el Daily Scrum es liderado por el Scrum Master y producir un Sprint Backlog actualizado es su resultado. |
| **c** EN | Improper: updating the Sprint Backlog is the Developers' responsibility, not the Scrum Master's. `<<KEY` |
| **c** ES | Inadecuado: actualizar el Sprint Backlog es responsabilidad de los Developers, no del Scrum Master. `<<KEY` |
| **d** EN | Appropriate: the Scrum Master's facilitation role includes maintaining the Sprint Backlog daily. |
| **d** ES | Apropiado: el rol de facilitación del Scrum Master incluye mantener el Sprint Backlog diariamente. |

**explanation**

| | |
|---|---|
| EN | The Sprint Backlog is owned and maintained by the Developers, not the Scrum Master. When the Scrum Master takes over Sprint Backlog updates, they are managing the Developers' work externally, which undermines Developer self-management. Facilitating the Daily Scrum does not confer ownership of the artifact. |
| ES | El Sprint Backlog es propiedad de los Developers y es mantenido por ellos, no por el Scrum Master. Cuando el Scrum Master se hace cargo de las actualizaciones del Sprint Backlog, está gestionando externamente el trabajo de los Developers, lo que socava la autogestión de los Developers. Facilitar el Daily Scrum no otorga la propiedad del artefacto. |

### 294. SM-AI-I · 4.3 · `f713df3b-1424-4c2f-843c-a586cdbcf123`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.3: Explain that the Sprint Backlog is created by and for the Developers

**stem**

| | |
|---|---|
| EN | How does the Developers' delivery plan in the Sprint Backlog differ from a product roadmap? |
| ES | ¿En qué se diferencia el plan de entrega de los Developers en el Sprint Backlog de una hoja de ruta del producto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It is a burndown chart visualizing remaining work, updated daily by the Scrum Master. |
| **a** ES | Es un gráfico de burndown que visualiza el trabajo restante, actualizado diariamente por el Scrum Master. |
| **b** EN | It is the set of acceptance criteria the Product Owner uses to verify Sprint Backlog Items. |
| **b** ES | Es el conjunto de criterios de aceptación que el Product Owner utiliza para verificar los elementos del Sprint Backlog. |
| **c** EN | It is a detailed, adaptable work breakdown scoped to the current Sprint and Sprint Goal. `<<KEY` |
| **c** ES | Es un desglose de trabajo detallado y adaptable, con alcance limitado al Sprint actual y al Sprint Goal. `<<KEY` |
| **d** EN | It is a high-level release schedule the Product Owner maintains across multiple Sprints. |
| **d** ES | Es un calendario de lanzamiento de alto nivel que el Product Owner mantiene a lo largo de múltiples Sprints. |

**explanation**

| | |
|---|---|
| EN | The plan in the Sprint Backlog is the Developers' tactical, Sprint-scoped breakdown — typically tasks or steps — for turning selected Product Backlog Items into an Increment. It is not a release roadmap, a burndown chart, or acceptance criteria; those serve different purposes. |
| ES | El plan en el Sprint Backlog es el desglose táctico de los Developers, con alcance limitado al Sprint, generalmente en forma de tareas o pasos, para convertir los elementos del Product Backlog seleccionados en un Increment. No es una hoja de ruta de lanzamiento, un gráfico de burndown ni criterios de aceptación; esos sirven para propósitos diferentes. |

### 295. SM-AI-I · 4.4 · `235fd6ca-c8f6-48c4-9fd5-68ff388aa09b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.4: Recall the Increment and the Definition of Done

**stem**

| | |
|---|---|
| EN | Work in a Sprint does not meet the Definition of Done by Sprint end. Per the 2020 Scrum Guide, what happens to that work? |
| ES | El trabajo en un Sprint no cumple con la Definition of Done al finalizar el Sprint. Según la Guía Scrum 2020, ¿qué sucede con ese trabajo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It joins the Increment once the Product Owner formally accepts it at Sprint Review. |
| **a** ES | Se incorpora al Increment una vez que el Product Owner lo acepta formalmente en el Sprint Review. |
| **b** EN | It joins the Increment if the team documents the remaining work as technical debt. |
| **b** ES | Se incorpora al Increment si el equipo documenta el trabajo restante como deuda técnica. |
| **c** EN | It is not part of the Increment and returns to the Product Backlog. `<<KEY` |
| **c** ES | No forma parte del Increment y regresa al Product Backlog. `<<KEY` |
| **d** EN | It joins the Increment because the Increment is only finalized during Sprint Review. |
| **d** ES | Se incorpora al Increment porque el Increment solo se finaliza durante el Sprint Review. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide is clear: work that does not meet the Definition of Done cannot be part of the Increment and must return to the Product Backlog. Neither Product Owner acceptance at Sprint Review, the timing of Sprint Review inspection, nor documenting remaining work as technical debt can substitute for meeting the Definition of Done. |
| ES | La Guía Scrum 2020 es clara: el trabajo que no cumple con la Definition of Done no puede formar parte del Increment y debe regresar al Product Backlog. Ni la aceptación del Product Owner en el Sprint Review, ni el momento de la inspección en el Sprint Review, ni la documentación del trabajo restante como deuda técnica pueden sustituir el cumplimiento de la Definition of Done. |

### 296. SM-AI-I · 4.4 · `3cf257f5-c9f8-43ce-8194-6310d606554a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.4: Recall the Increment and the Definition of Done

**stem**

| | |
|---|---|
| EN | Can the Scrum Team update the Definition of Done after initial team formation? |
| ES | ¿Puede el Scrum Team actualizar la Definition of Done después de la formación inicial del equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Only during the Sprint Retrospective, and only if the Scrum Master authorizes the revision. |
| **a** ES | Solo durante la Sprint Retrospective, y únicamente si el Scrum Master autoriza la revisión. |
| **b** EN | No, because changing it mid-project invalidates previously completed Increments. |
| **b** ES | No, porque cambiarla a mitad del proyecto invalida los Increments completados anteriormente. |
| **c** EN | Yes, the team may evolve it as they learn and improve their quality practices. `<<KEY` |
| **c** ES | Sí, el equipo puede evolucionarla a medida que aprende y mejora sus prácticas de calidad. `<<KEY` |
| **d** EN | Only at Sprint start, and only if the Product Owner approves the proposed change. |
| **d** ES | Solo al inicio del Sprint, y únicamente si el Product Owner aprueba el cambio propuesto. |

**explanation**

| | |
|---|---|
| EN | The Definition of Done is not frozen at team formation; the Scrum Team may strengthen it over time as their understanding of quality improves. No single role — neither the Product Owner nor the Scrum Master — holds exclusive authority to approve changes to it. |
| ES | La Definition of Done no queda fija en la formación del equipo; el Scrum Team puede fortalecerla con el tiempo a medida que mejora su comprensión de la calidad. Ningún rol individual —ni el Product Owner ni el Scrum Master— tiene autoridad exclusiva para aprobar cambios en ella. |

### 297. SM-AI-I · 4.4 · `546d85a2-077e-4f91-aa87-fb031b9884bc`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.4: Recall the Increment and the Definition of Done

**stem**

| | |
|---|---|
| EN | According to the 2020 Scrum Guide, who creates the Definition of Done? |
| ES | Según la Guía Scrum 2020, ¿quién crea la Definition of Done? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Scrum Master, who is accountable for process adherence and quality standards. |
| **a** ES | El Scrum Master, quien es responsable del cumplimiento del proceso y los estándares de calidad. |
| **b** EN | The Scrum Team, as a shared commitment owned by all three roles together. `<<KEY` |
| **b** ES | El Scrum Team, como un compromiso compartido que pertenece a los tres roles en conjunto. `<<KEY` |
| **c** EN | The Product Owner, who is accountable for the value and quality of the product. |
| **c** ES | El Product Owner, quien es responsable del valor y la calidad del producto. |
| **d** EN | The Developers, who are accountable for the quality of work they produce. |
| **d** ES | Los Developers, quienes son responsables de la calidad del trabajo que producen. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide changed Definition of Done ownership to the entire Scrum Team. Attributing it solely to Developers reflects pre-2020 wording. Attributing it to the Scrum Master or Product Owner alone misassigns a shared team accountability. |
| ES | La Guía Scrum 2020 transfirió la responsabilidad de la Definition of Done a todo el Scrum Team. Atribuirla únicamente a los Developers refleja la redacción anterior a 2020. Atribuirla solo al Scrum Master o al Product Owner asigna incorrectamente una responsabilidad compartida del equipo. |

### 298. SM-AI-I · 4.5 · `7639e0af-7160-4536-b643-e7c86d0f5668`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.5: Apply the DoD to determine completion

**stem**

| | |
|---|---|
| EN | At Sprint end, two items fully meet the DoD. A third is nearly complete. A developer argues each team member may interpret the DoD for their own work. What should the team do with the third item? |
| ES | Al final del Sprint, dos elementos cumplen completamente la Definition of Done. Un tercero está casi completo. Un desarrollador argumenta que cada miembro del equipo puede interpretar la DoD para su propio trabajo. ¿Qué debería hacer el equipo con el tercer elemento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Allow the developer's interpretation; individual judgment is valid for tasks they personally completed. |
| **a** ES | Permitir la interpretación del desarrollador; el juicio individual es válido para las tareas que completaron personalmente. |
| **b** EN | Carry it into the next Sprint so it can be finished and credited to this Sprint's velocity. |
| **b** ES | Llevarlo al siguiente Sprint para que pueda terminarse y acreditarse a la velocidad de este Sprint. |
| **c** EN | Include it in the Increment and note at the Sprint Review that a relaxed DoD standard was applied. |
| **c** ES | Incluirlo en el Increment y señalar en el Sprint Review que se aplicó un estándar de DoD relajado. |
| **d** EN | Return the third item to the Product Backlog; the DoD is a single shared standard applied uniformly. `<<KEY` |
| **d** ES | Devolver el tercer elemento al Product Backlog; la DoD es un estándar compartido único que se aplica de manera uniforme. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The DoD is a single shared standard for the entire Scrum Team; individual team members cannot apply personal interpretations. Work not meeting that shared standard is not an Increment and returns to the Product Backlog. |
| ES | La Definition of Done es un estándar compartido único para todo el Scrum Team; los miembros individuales del equipo no pueden aplicar interpretaciones personales. El trabajo que no cumple ese estándar compartido no es un Increment y regresa al Product Backlog. |

### 299. SM-AI-I · 4.5 · `d7d0f799-ee2f-4b4e-be33-4649230ae8c7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.5: Apply the DoD to determine completion

**stem**

| | |
|---|---|
| EN | The team completes six items meeting the DoD. A seventh is functionally working but undocumented, violating the DoD. Stakeholders want it shown at the Sprint Review. What should the team do? |
| ES | El equipo completa seis elementos que cumplen la Definition of Done. Un séptimo funciona correctamente pero no tiene documentación, lo que viola la DoD. Los interesados quieren verlo en el Sprint Review. ¿Qué debería hacer el equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Show all seven items; the Sprint Review is the correct forum to inspect even undone work. |
| **a** ES | Mostrar los siete elementos; el Sprint Review es el foro correcto para inspeccionar incluso el trabajo incompleto. |
| **b** EN | Show only the six done items; the seventh is not an Increment and returns to the Product Backlog. `<<KEY` |
| **b** ES | Mostrar solo los seis elementos terminados; el séptimo no es un Increment y regresa al Product Backlog. `<<KEY` |
| **c** EN | Show all seven items after the Product Owner grants a documentation exception for this Sprint. |
| **c** ES | Mostrar los siete elementos después de que el Product Owner otorgue una excepción de documentación para este Sprint. |
| **d** EN | Show all seven items, labeling the seventh incomplete so stakeholders can give informed feedback. |
| **d** ES | Mostrar los siete elementos, etiquetando el séptimo como incompleto para que los interesados puedan dar retroalimentación informada. |

**explanation**

| | |
|---|---|
| EN | Only work meeting the DoD is part of the Increment and appropriate to present as done at the Sprint Review. The seventh item is not an Increment and returns to the backlog. Presenting undone work — even labeled incomplete — misrepresents what the team delivered, and no role can grant a DoD exception. |
| ES | Solo el trabajo que cumple la Definition of Done forma parte del Increment y es apropiado presentarlo como terminado en el Sprint Review. El séptimo elemento no es un Increment y regresa al backlog. Presentar trabajo incompleto, incluso etiquetado como tal, tergiversa lo que el equipo entregó, y ningún rol puede otorgar una excepción a la DoD. |

### 300. SM-AI-I · 4.5 · `d9836819-0390-49d9-ad1f-7f9e0d6862ca`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.5: Apply the DoD to determine completion

**stem**

| | |
|---|---|
| EN | During Sprint Review, a backlog item passes all acceptance criteria but fails two Definition of Done checks. The Product Owner says stakeholders would accept it. What should happen to this item? |
| ES | Durante el Sprint Review, un elemento del backlog cumple todos los criterios de aceptación pero falla dos verificaciones de la Definition of Done. El Product Owner dice que los interesados lo aceptarían. ¿Qué debería ocurrir con este elemento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Present it at the Sprint Review labeled incomplete so stakeholders can give informed feedback. |
| **a** ES | Presentarlo en el Sprint Review etiquetado como incompleto para que los interesados puedan dar retroalimentación informada. |
| **b** EN | Carry it into the next Sprint and count it in the current Increment once DoD checks are finished. |
| **b** ES | Llevarlo al siguiente Sprint y contarlo en el Increment actual una vez que se terminen las verificaciones de la DoD. |
| **c** EN | Return it to the Product Backlog; it is not an Increment without fully meeting the DoD. `<<KEY` |
| **c** ES | Devolverlo al Product Backlog; no es un Increment sin cumplir completamente la DoD. `<<KEY` |
| **d** EN | Release it as a partial Increment; the Product Owner has approved it for stakeholders. |
| **d** ES | Liberarlo como un Increment parcial; el Product Owner lo ha aprobado para los interesados. |

**explanation**

| | |
|---|---|
| EN | Work that does not meet the DoD is not an Increment and must return to the Product Backlog regardless of stakeholder acceptance. The Product Owner cannot waive the DoD. Carrying undone work forward does not make it part of the current Increment, and presenting undone work at the Sprint Review misrepresents what the team delivered. |
| ES | El trabajo que no cumple la Definition of Done no es un Increment y debe regresar al Product Backlog independientemente de la aceptación de los interesados. El Product Owner no puede eximir el cumplimiento de la DoD. Llevar trabajo sin terminar hacia adelante no lo convierte en parte del Increment actual, y presentar trabajo incompleto en el Sprint Review tergiversa lo que el equipo entregó. |

### 301. SM-AI-I · 4.5 · `e70a3314-3075-4b2e-8ec8-37678202f818`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.5: Apply the DoD to determine completion

**stem**

| | |
|---|---|
| EN | Three backlog items are fully done by Sprint end. A fourth meets all functional tests but lacks the automated regression tests required by the DoD. How many items form the Sprint Increment? |
| ES | Al final del Sprint, tres elementos del backlog están completamente terminados. Un cuarto cumple todas las pruebas funcionales pero carece de las pruebas de regresión automatizadas requeridas por la Definition of Done. ¿Cuántos elementos conforman el Increment del Sprint? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Four; the DoD applies only to the final release Increment, not to individual Sprint Increments. |
| **a** ES | Cuatro; la DoD se aplica solo al Increment de la versión final, no a los Increment individuales de cada Sprint. |
| **b** EN | Four; the fourth can be counted once regression tests are added in the next Sprint. |
| **b** ES | Cuatro; el cuarto puede contarse una vez que se agreguen las pruebas de regresión en el siguiente Sprint. |
| **c** EN | Four; the Product Owner can grant an exception for items that pass all functional acceptance tests. |
| **c** ES | Cuatro; el Product Owner puede otorgar una excepción para los elementos que pasan todas las pruebas de aceptación funcionales. |
| **d** EN | Three; the fourth lacks required automated regression tests and does not meet the DoD. `<<KEY` |
| **d** ES | Tres; al cuarto le faltan las pruebas de regresión automatizadas requeridas y no cumple la DoD. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Only work meeting the DoD constitutes an Increment. The fourth item, lacking required automated regression tests, is not done and returns to the Product Backlog. The DoD applies to every Sprint Increment, not just a final release, and no role has authority to grant exceptions to the DoD. |
| ES | Solo el trabajo que cumple la Definition of Done constituye un Increment. El cuarto elemento, al carecer de las pruebas de regresión automatizadas requeridas, no está terminado y regresa al Product Backlog. La DoD se aplica a cada Increment de cada Sprint, no solo a una versión final, y ningún rol tiene autoridad para otorgar excepciones a la DoD. |

### 302. SM-AI-I · 4.5 · `916b683e-98b8-4519-8c21-8cfb41156048`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.5: Apply the DoD to determine completion

**stem**

| | |
|---|---|
| EN | At Sprint Review, a Product Backlog item is 80% complete and does not meet the Definition of Done. The Product Owner wants to show it to stakeholders. What should the team do? |
| ES | En el Sprint Review, un elemento del Product Backlog está completo en un 80% y no cumple con la Definition of Done. El Product Owner quiere mostrárselo a los interesados. ¿Qué debería hacer el equipo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Release it as a partial Increment because the Product Owner has authority to waive the Definition of Done. |
| **a** ES | Lanzarlo como un Increment parcial porque el Product Owner tiene autoridad para eximir la Definition of Done. |
| **b** EN | Return it to the Product Backlog; work that does not meet the Definition of Done is not an Increment. `<<KEY` |
| **b** ES | Devolverlo al Product Backlog; el trabajo que no cumple con la Definition of Done no es un Increment. `<<KEY` |
| **c** EN | Present it at Sprint Review labeled 'incomplete' to satisfy Scrum's transparency principle. |
| **c** ES | Presentarlo en el Sprint Review etiquetado como 'incompleto' para satisfacer el principio de transparencia de Scrum. |
| **d** EN | Carry it into the next Sprint and count it toward that Sprint's Increment when finished. |
| **d** ES | Llevarlo al siguiente Sprint y contarlo como parte del Increment de ese Sprint cuando esté terminado. |

**explanation**

| | |
|---|---|
| EN | Work that does not meet the Definition of Done is not an Increment and must be returned to the Product Backlog for re-ordering. Presenting the item labeled 'incomplete' misrepresents the Sprint outcome and does not satisfy Scrum's transparency requirements. Carrying the item forward and counting it toward a future Increment is not permitted without re-planning in Sprint Planning. The Product Owner has no authority to waive or override the Definition of Done, so releasing a partial Increment is not a valid option. |
| ES | El trabajo que no cumple con la Definition of Done no es un Increment y debe devolverse al Product Backlog para ser reordenado. Presentar el elemento etiquetado como 'incompleto' tergiversa el resultado del Sprint y no satisface los requisitos de transparencia de Scrum. Llevar el elemento al siguiente Sprint y contarlo como parte de un Increment futuro no está permitido sin una replanificación en el Sprint Planning. El Product Owner no tiene autoridad para eximir o anular la Definition of Done, por lo que lanzar un Increment parcial no es una opción válida. |

### 303. SM-AI-I · 4.6 · `4588c2ce-21cc-4f79-9188-60b2f0aa1f3b`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 4.6: Explain the Product Goal as the long-term objective

**stem**

| | |
|---|---|
| EN | According to the 2020 Scrum Guide, how many Product Goals may a Scrum Team pursue simultaneously? |
| ES | Según la Guía Scrum 2020, ¿cuántos Product Goals puede perseguir simultáneamente un Scrum Team? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | One — the team must reach or abandon the current Product Goal before committing to the next. `<<KEY` |
| **a** ES | Uno — el equipo debe alcanzar o abandonar el Product Goal actual antes de comprometerse con el siguiente. `<<KEY` |
| **b** EN | Unlimited — provided each Product Goal has its own dedicated set of Sprint Goals for tracking progress. |
| **b** ES | Ilimitados — siempre que cada Product Goal tenga su propio conjunto dedicado de Sprint Goals para rastrear el progreso. |
| **c** EN | One per release cycle, reset automatically at the start of each new release regardless of prior completion. |
| **c** ES | Uno por ciclo de lanzamiento, que se restablece automáticamente al inicio de cada nuevo lanzamiento independientemente de la finalización anterior. |
| **d** EN | Two at most — one primary and one secondary — to balance long-term strategy with near-term delivery. |
| **d** ES | Dos como máximo — uno primario y uno secundario — para equilibrar la estrategia a largo plazo con la entrega a corto plazo. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide states that a Scrum Team pursues one Product Goal at a time and must reach it or abandon it before taking on another. Allowing multiple simultaneous Product Goals contradicts this rule and dilutes focus. A release-cycle reset and a primary/secondary split are not concepts found in the Scrum Guide. |
| ES | La Guía Scrum 2020 establece que un Scrum Team persigue un Product Goal a la vez y debe alcanzarlo o abandonarlo antes de asumir otro. Permitir múltiples Product Goals simultáneos contradice esta regla y diluye el enfoque. El restablecimiento por ciclo de lanzamiento y la división primaria/secundaria no son conceptos que se encuentren en la Guía Scrum. |

### 304. SM-AI-I · 4.6 · `dab86f67-3b1d-45d1-8f39-b2c747302399`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.6: Explain the Product Goal as the long-term objective

**stem**

| | |
|---|---|
| EN | A Product Owner announces a new Product Goal before the previous one has been achieved or abandoned. Which statement best describes this? |
| ES | Un Product Owner anuncia un nuevo Product Goal antes de que el anterior haya sido alcanzado o abandonado. ¿Cuál de las siguientes afirmaciones describe mejor esta situación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Acceptable — the Product Goal is a recommended practice, so replacing it at any time has no structural consequence. |
| **a** ES | Aceptable — el Product Goal es una práctica recomendada, por lo que reemplazarlo en cualquier momento no tiene consecuencias estructurales. |
| **b** EN | Inconsistent with Scrum — the team must pursue one Product Goal at a time and reach or abandon it before adopting a new one. `<<KEY` |
| **b** ES | Inconsistente con Scrum — el equipo debe perseguir un Product Goal a la vez y alcanzarlo o abandonarlo antes de adoptar uno nuevo. `<<KEY` |
| **c** EN | Inconsistent with Scrum — once set, the Product Goal is permanently fixed and cannot be changed for any reason. |
| **c** ES | Inconsistente con Scrum — una vez establecido, el Product Goal es permanentemente fijo y no puede cambiarse por ningún motivo. |
| **d** EN | Acceptable — stakeholder approval at the Sprint Review serves as the formal checkpoint for replacing the Product Goal. |
| **d** ES | Aceptable — la aprobación de los interesados en el Sprint Review sirve como punto de control formal para reemplazar el Product Goal. |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide requires the team to have one Product Goal at a time, completing or abandoning it before adopting a new one. Switching without resolution violates that principle. Stakeholder approval at the Sprint Review is not a mechanism for replacing the Product Goal. The Product Goal is also not permanently fixed — abandonment is explicitly permitted — which makes the 'permanently fixed' option incorrect. |
| ES | La Guía Scrum requiere que el equipo tenga un Product Goal a la vez, completándolo o abandonándolo antes de adoptar uno nuevo. Cambiar sin resolución viola ese principio. La aprobación de los interesados en el Sprint Review no es un mecanismo para reemplazar el Product Goal. El Product Goal tampoco es permanentemente fijo — el abandono está explícitamente permitido — lo que hace incorrecta la opción de 'permanentemente fijo'. |

### 305. SM-AI-I · 4.7 · `0ff36ada-366d-4b59-bab4-aec88fd3d57e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.7: Distinguish artifact transparency from artifact perfection

**stem**

| | |
|---|---|
| EN | Stakeholders request a vague summary of the Product Backlog instead of the actual backlog. The team agrees, believing it protects focus. What is the primary risk? |
| ES | Los interesados solicitan un resumen vago del Product Backlog en lugar del Product Backlog real. El equipo acepta, creyendo que protege el enfoque. ¿Cuál es el riesgo principal? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Stakeholders cannot inspect the real state, so adaptation decisions are based on incomplete information. `<<KEY` |
| **a** ES | Los interesados no pueden inspeccionar el estado real, por lo que las decisiones de adaptación se basan en información incompleta. `<<KEY` |
| **b** EN | The team spends excessive time maintaining two versions of the backlog simultaneously. |
| **b** ES | El equipo dedica tiempo excesivo a mantener dos versiones del Product Backlog simultáneamente. |
| **c** EN | Stakeholders may lose trust in the team if they later discover the summary omitted details. |
| **c** ES | Los interesados pueden perder la confianza en el equipo si descubren posteriormente que el resumen omitió detalles. |
| **d** EN | The Product Owner loses control of backlog ordering when stakeholders see only a filtered view. |
| **d** ES | El Product Owner pierde el control del ordenamiento del Product Backlog cuando los interesados ven solo una vista filtrada. |

**explanation**

| | |
|---|---|
| EN | Deliberately vague summaries undermine transparency by hiding the artifact's true state from those who need to inspect it. Without accurate inspection, stakeholders cannot make valid adaptation decisions — disabling the empirical process Scrum depends on. Loss of trust, ordering control, and dual-maintenance effort are secondary concerns, not the primary transparency risk. |
| ES | Los resúmenes deliberadamente vagos socavan la transparencia al ocultar el estado real del artefacto a quienes necesitan inspeccionarlo. Sin una inspección precisa, los interesados no pueden tomar decisiones de adaptación válidas, lo que deshabilita el proceso empírico del que depende Scrum. La pérdida de confianza, el control del ordenamiento y el esfuerzo de mantenimiento dual son preocupaciones secundarias, no el riesgo principal de transparencia. |

### 306. SM-AI-I · 4.9 · `101995ee-5475-4d9f-ab34-e1c4a0398990`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.9: Interpret burndown charts and velocity metrics

**stem**

| | |
|---|---|
| EN | Management asks the Scrum Master to set a minimum acceptable velocity so the team 'stays consistent.' What is the correct response? |
| ES | La gerencia le pide al Scrum Master que establezca una velocidad mínima aceptable para que el equipo 'se mantenga consistente'. ¿Cuál es la respuesta correcta? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Agree, but only after benchmarking the team against others to set a fair, evidence-based minimum. |
| **a** ES | Aceptar, pero solo después de comparar al equipo con otros para establecer un mínimo justo y basado en evidencia. |
| **b** EN | Agree, since holding teams to a velocity floor is a valid way to surface underperformance for coaching. |
| **b** ES | Aceptar, ya que mantener a los equipos en un piso de velocidad es una forma válida de identificar bajo rendimiento para el coaching. |
| **c** EN | Agree and publish the threshold, since stable velocity is a reliable commitment the team can promise each Sprint. |
| **c** ES | Aceptar y publicar el umbral, ya que una velocidad estable es un compromiso confiable que el equipo puede prometer en cada Sprint. |
| **d** EN | Decline and explain that a velocity target pressures teams to inflate estimates, corrupting velocity as a forecasting tool. `<<KEY` |
| **d** ES | Rechazar y explicar que un objetivo de velocidad presiona a los equipos a inflar las estimaciones, corrompiendo la velocidad como herramienta de pronóstico. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Velocity is a probabilistic forecasting tool, not a target. Treating it as a minimum (Goodhart's Law) pressures teams to inflate estimates to hit the number, destroying its planning value. Velocity is not a stakeholder commitment, so publishing it as one is misleading. Comparing velocity across teams is meaningless because story-point scales differ. Using a velocity floor to surface underperformance conflates a forecasting metric with a performance standard, which distorts both team behavior and the metric itself. |
| ES | La velocidad es una herramienta de pronóstico probabilístico, no un objetivo. Tratarla como un mínimo (Ley de Goodhart) presiona a los equipos a inflar las estimaciones para alcanzar el número, destruyendo su valor para la planificación. La velocidad no es un compromiso con los interesados, por lo que publicarla como tal es engañoso. Comparar la velocidad entre equipos carece de sentido porque las escalas de puntos de historia difieren. Usar un piso de velocidad para identificar bajo rendimiento confunde una métrica de pronóstico con un estándar de desempeño, lo que distorsiona tanto el comportamiento del equipo como la métrica en sí. |

### 307. SM-AI-I · 4.9 · `d4fd51d9-330b-4c63-b124-11843cccd4fe`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.9: Interpret burndown charts and velocity metrics

**stem**

| | |
|---|---|
| EN | A team inflates story point estimates each Sprint to report higher velocity to leadership. What is the primary risk? |
| ES | Un equipo infla las estimaciones de story points en cada Sprint para reportar una mayor velocidad a la dirección. ¿Cuál es el riesgo principal? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Inflated estimates slow team throughput because larger numbers require more planning time each Sprint. |
| **a** ES | Las estimaciones infladas reducen el rendimiento del equipo porque los números más grandes requieren más tiempo de planificación en cada Sprint. |
| **b** EN | Velocity self-corrects once estimates stabilize, so the risk is temporary and limited in scope. |
| **b** ES | La velocidad se autocorrige una vez que las estimaciones se estabilizan, por lo que el riesgo es temporal y de alcance limitado. |
| **c** EN | Inflated estimates corrupt velocity as a forecasting tool, causing release plans to overestimate capacity. `<<KEY` |
| **c** ES | Las estimaciones infladas corrompen la velocidad como herramienta de pronóstico, haciendo que los planes de lanzamiento sobreestimen la capacidad. `<<KEY` |
| **d** EN | It is harmless for reporting but may cause the team to over-commit in future Sprint Planning sessions. |
| **d** ES | Es inofensivo para los reportes, pero puede hacer que el equipo se sobre-comprometa en futuras sesiones de Sprint Planning. |

**explanation**

| | |
|---|---|
| EN | When estimates are inflated to hit a metric target, velocity no longer reflects real capacity. Forecasts built on that inflated number will overestimate how much work fits in future Sprints, leading to missed release dates. This is a direct consequence of Goodhart's Law: the metric loses its forecasting value once it becomes a target. Velocity does not self-correct automatically, and the distortion persists as long as the incentive to inflate remains. |
| ES | Cuando las estimaciones se inflan para alcanzar un objetivo de métrica, la velocidad deja de reflejar la capacidad real. Los pronósticos construidos sobre ese número inflado sobreestimarán cuánto trabajo cabe en futuros Sprints, lo que llevará a incumplir las fechas de lanzamiento. Esta es una consecuencia directa de la Ley de Goodhart: la métrica pierde su valor de pronóstico una vez que se convierte en un objetivo. La velocidad no se autocorrige automáticamente, y la distorsión persiste mientras el incentivo para inflar se mantenga. |

### 308. SM-AI-I · 4.9 · `d532ca5e-9ac1-4aaa-85d8-6199bcd0f3b8`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 4.9: Interpret burndown charts and velocity metrics

**stem**

| | |
|---|---|
| EN | Management asks the Scrum Master to set a minimum velocity threshold so every team delivers consistently. What should the Scrum Master do? |
| ES | La gerencia le pide al Scrum Master que establezca un umbral mínimo de velocidad para que cada equipo entregue de forma consistente. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Decline, then replace velocity with a different Scrum-prescribed metric for management to target. |
| **a** ES | Negarse y luego reemplazar la velocidad con una métrica diferente prescrita por Scrum para que la gerencia la use como objetivo. |
| **b** EN | Agree, because a velocity floor ensures stakeholders receive predictable output each Sprint. |
| **b** ES | Aceptar, porque un piso de velocidad garantiza que los interesados reciban una entrega predecible en cada Sprint. |
| **c** EN | Decline; velocity is a forecasting tool, and making it a target corrupts honest estimation. `<<KEY` |
| **c** ES | Negarse; la velocidad es una herramienta de pronóstico y convertirla en un objetivo corrompe la estimación honesta. `<<KEY` |
| **d** EN | Agree only if the threshold is set below the team's historical average to avoid pressure. |
| **d** ES | Aceptar solo si el umbral se establece por debajo del promedio histórico del equipo para evitar presión. |

**explanation**

| | |
|---|---|
| EN | Velocity is a probabilistic forecasting tool, not a performance commitment. Turning it into a minimum target (Goodhart's Law) incentivizes teams to inflate estimates to meet the threshold, destroying the metric's planning value. There is no Scrum-prescribed replacement metric that serves as a valid management target, so replacing velocity with another mandated number does not resolve the underlying problem. |
| ES | La velocidad es una herramienta de pronóstico probabilístico, no un compromiso de rendimiento. Convertirla en un objetivo mínimo (Ley de Goodhart) incentiva a los equipos a inflar las estimaciones para cumplir el umbral, destruyendo el valor de planificación de la métrica. No existe una métrica de reemplazo prescrita por Scrum que sirva como objetivo válido de gestión, por lo que sustituir la velocidad por otro número obligatorio no resuelve el problema subyacente. |

### 309. SM-AI-I · 5.1 · `5a5917ca-c10e-4447-8993-5fc1ef5fa3b8`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 5.1: Identify impediments and choose removal strategies

**stem**

| | |
|---|---|
| EN | The same dependency on a slow legal review has blocked the team for three consecutive Sprints. What is the Scrum Master's most appropriate next action? |
| ES | La misma dependencia de una revisión legal lenta ha bloqueado al equipo durante tres Sprints consecutivos. ¿Cuál es la acción más apropiada que debe tomar el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Treat the recurrence as a team issue and coach the team to plan better around legal review timelines. |
| **a** ES | Tratar la recurrencia como un problema del equipo y orientarlo para planificar mejor en torno a los plazos de revisión legal. |
| **b** EN | Log it after each Daily Scrum and wait; repeated logging will eventually prompt management to act. |
| **b** ES | Registrarlo después de cada Daily Scrum y esperar; el registro repetido eventualmente motivará a la gerencia a actuar. |
| **c** EN | Hand the issue to management and close the Scrum Master's involvement, since it is external to the team. |
| **c** ES | Trasladar el problema a la gerencia y cerrar la participación del Scrum Master, ya que es externo al equipo. |
| **d** EN | Escalate the pattern to organizational leadership as a systemic impediment needing structural change. `<<KEY` |
| **d** ES | Escalar el patrón al liderazgo organizacional como un impedimento sistémico que requiere un cambio estructural. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A recurring cross-Sprint impediment signals a systemic organizational issue. The Scrum Master must escalate and advocate for structural change, not attribute it to team planning failure, hand it off without follow-through, or rely on passive logging to prompt action. |
| ES | Un impedimento recurrente a lo largo de varios Sprints es señal de un problema organizacional sistémico. El Scrum Master debe escalar y abogar por un cambio estructural, no atribuirlo a una falla en la planificación del equipo, transferirlo sin seguimiento ni depender del registro pasivo para motivar la acción. |

### 310. SM-AI-I · 5.1 · `dd3228c7-4b32-4414-a320-e92613843b4f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.1: Identify impediments and choose removal strategies

**stem**

| | |
|---|---|
| EN | A Scrum Team loses two days each Sprint waiting for a shared test environment owned by another department. The Scrum Master has raised this at the Daily Scrum for three consecutive Sprints with no resolution. What should the Scrum Master do next? |
| ES | Un Scrum Team pierde dos días en cada Sprint esperando un entorno de pruebas compartido que pertenece a otro departamento. El Scrum Master ha planteado este problema en el Daily Scrum durante tres Sprints consecutivos sin resolución. ¿Qué debería hacer el Scrum Master a continuación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Transfer full ownership to management, since external impediments fall outside the Scrum Master's scope. |
| **a** ES | Transferir la responsabilidad total a la gerencia, ya que los impedimentos externos están fuera del alcance del Scrum Master. |
| **b** EN | Re-log the impediment after the next Retrospective, where impediment resolution is formally reviewed. |
| **b** ES | Volver a registrar el impedimento después de la próxima Sprint Retrospective, donde la resolución de impedimentos se revisa formalmente. |
| **c** EN | Ask the team to absorb the delay, since they can request environment access without Scrum Master involvement. |
| **c** ES | Pedirle al equipo que absorba el retraso, ya que pueden solicitar acceso al entorno sin la intervención del Scrum Master. |
| **d** EN | Escalate the pattern to organizational leadership and track it until the impediment is resolved. `<<KEY` |
| **d** ES | Escalar el patrón al liderazgo organizacional y hacer seguimiento hasta que el impedimento sea resuelto. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | A recurring cross-departmental blocker is a systemic, external impediment. The Scrum Master's accountability is to cause its removal, which requires escalating to people with organizational authority and following through until it is resolved. Waiting for the Retrospective ignores the Scrum Master's ongoing Sprint-level responsibility. Transferring full ownership to management abandons that accountability rather than fulfilling it. Asking the team to absorb the delay treats a structural problem as the team's personal burden to manage. |
| ES | Un bloqueo recurrente entre departamentos es un impedimento externo y sistémico. La responsabilidad del Scrum Master es lograr su eliminación, lo que requiere escalar el problema a personas con autoridad organizacional y hacer seguimiento hasta que sea resuelto. Esperar a la Sprint Retrospective ignora la responsabilidad continua del Scrum Master a nivel de Sprint. Transferir la responsabilidad total a la gerencia abandona esa accountability en lugar de cumplirla. Pedirle al equipo que absorba el retraso trata un problema estructural como una carga personal que el equipo debe gestionar. |

### 311. SM-AI-I · 5.10 · `34c109a8-afcf-4070-baa5-1c1e7297fece`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 5.10: Identify the new impediments that arise in AI-augmented teams

**stem**

| | |
|---|---|
| EN | AI-generated code passes all automated tests and linters. A developer marks the story Done and it enters the Increment without peer review. Which impediment does this introduce? |
| ES | El código generado por IA pasa todas las pruebas automatizadas y los linters. Un desarrollador marca la historia como Terminada y entra al Increment sin revisión de pares. ¿Qué impedimento introduce esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Automation over-trust, because unverified AI output enters the Increment based on tool confidence alone. `<<KEY` |
| **a** ES | Exceso de confianza en la automatización, porque el output no verificado de la IA entra al Increment basándose únicamente en la confianza en las herramientas. `<<KEY` |
| **b** EN | Eroded shared understanding, because no team member discussed the AI-generated solution with others. |
| **b** ES | Comprensión compartida erosionada, porque ningún miembro del equipo discutió la solución generada por la IA con los demás. |
| **c** EN | A review bottleneck, because automated tools cannot process output as fast as AI generates it. |
| **c** ES | Un cuello de botella en la revisión, porque las herramientas automatizadas no pueden procesar el output tan rápido como la IA lo genera. |
| **d** EN | A Definition of Done gap, because the DoD must be updated to explicitly require peer review of AI output. |
| **d** ES | Una brecha en la Definition of Done, porque la DoD debe actualizarse para requerir explícitamente la revisión de pares del output de la IA. |

**explanation**

| | |
|---|---|
| EN | Accepting AI output into the Increment solely because automated checks passed is automation over-trust — unverified output enters the product without human inspection. Automated tests and linters validate certain properties but do not confirm correctness, intent, or full DoD compliance. The eroded-shared-understanding impediment concerns fragmented team knowledge, not unverified acceptance. Calling it a DoD gap misidentifies the root cause as a missing rule rather than an over-reliance on tooling. |
| ES | Aceptar el output de la IA en el Increment únicamente porque las verificaciones automatizadas pasaron es exceso de confianza en la automatización: el output no verificado entra al producto sin inspección humana. Las pruebas automatizadas y los linters validan ciertas propiedades, pero no confirman la corrección, la intención ni el cumplimiento completo de la Definition of Done. El impedimento de comprensión compartida erosionada se refiere al conocimiento fragmentado del equipo, no a la aceptación sin verificación. Llamarlo una brecha en la Definition of Done identifica erróneamente la causa raíz como una regla faltante en lugar de una dependencia excesiva en las herramientas. |

### 312. SM-AI-I · 5.10 · `7938f0eb-498a-41c5-859f-b86d728d6645`

shown **2×** in the eight scored attempts — 1 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 5.10: Identify the new impediments that arise in AI-augmented teams

**stem**

| | |
|---|---|
| EN | A Scrum Team adopts an AI coding assistant. Pull requests triple within two Sprints, but completed stories barely increase. The Scrum Master identifies this as an impediment. What should the Scrum Master do? |
| ES | Un Scrum Team adopta un asistente de codificación con IA. Las solicitudes de revisión de código se triplican en dos Sprints, pero las historias completadas apenas aumentan. El Scrum Master identifica esto como un impedimento. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Wait two more Sprints, because teams typically self-correct as they adjust to AI tools. |
| **a** ES | Esperar dos Sprints más, porque los equipos generalmente se autocorrigen al adaptarse a las herramientas de IA. |
| **b** EN | Redesign the review workflow so review capacity matches the AI generation rate. `<<KEY` |
| **b** ES | Rediseñar el flujo de revisión para que la capacidad de revisión coincida con la tasa de generación de la IA. `<<KEY` |
| **c** EN | Restrict AI usage to one session per developer daily so generation volume drops. |
| **c** ES | Restringir el uso de la IA a una sesión por desarrollador al día para que el volumen de generación disminuya. |
| **d** EN | Add more reviewers until the pull-request backlog clears, since headcount is the constraint. |
| **d** ES | Agregar más revisores hasta que se limpie el backlog de solicitudes de revisión, ya que la cantidad de personas es la restricción. |

**explanation**

| | |
|---|---|
| EN | When AI generates output faster than the team can inspect it, review — not creation — is the constraint on flow. Redesigning the review workflow balances throughput structurally. Adding more reviewers treats headcount as the bottleneck while ignoring cognitive capacity and process design. Restricting AI usage removes value without addressing the structural mismatch between generation and review. Waiting assumes the bottleneck self-resolves, which it does not without explicit process change. |
| ES | Cuando la IA genera resultados más rápido de lo que el equipo puede inspeccionarlos, la revisión —no la creación— es la restricción del flujo. Rediseñar el flujo de revisión equilibra el rendimiento de manera estructural. Agregar más revisores trata la cantidad de personas como el cuello de botella, ignorando la capacidad cognitiva y el diseño del proceso. Restringir el uso de la IA elimina valor sin abordar el desajuste estructural entre generación y revisión. Esperar supone que el cuello de botella se resuelve solo, lo cual no ocurre sin un cambio explícito en el proceso. |

### 313. SM-AI-I · 5.10 · `8467587c-845e-4795-b135-2cbb28da7f5a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.10: Identify the new impediments that arise in AI-augmented teams

**stem**

| | |
|---|---|
| EN | A senior engineer reviews all AI-generated pull requests before merge. Two Sprints later, logic errors are found in the Increment. A team member argues senior review eliminates automation over-trust. What should the Scrum Master recognize? |
| ES | Un ingeniero senior revisa todos los pull requests generados por IA antes de hacer el merge. Dos Sprints después, se encuentran errores lógicos en el Increment. Un miembro del equipo argumenta que la revisión del senior elimina el exceso de confianza en la automatización. ¿Qué debería reconocer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Seniority eliminates automation over-trust because expert reviewers reliably catch AI-generated errors. |
| **a** ES | La seniority elimina el exceso de confianza en la automatización porque los revisores expertos detectan de manera confiable los errores generados por la IA. |
| **b** EN | The team has a review bottleneck; the senior engineer is the single constraint slowing flow to an unsafe pace. |
| **b** ES | El equipo tiene un cuello de botella en la revisión; el ingeniero senior es la única restricción que ralentiza el flujo a un ritmo inseguro. |
| **c** EN | Automation over-trust persists if reviews are superficial or volume exceeds the reviewer's inspection capacity. `<<KEY` |
| **c** ES | El exceso de confianza en la automatización persiste si las revisiones son superficiales o el volumen supera la capacidad de inspección del revisor. `<<KEY` |
| **d** EN | Eroded shared understanding is the root cause; the senior engineer's private reviews excluded the rest of the team. |
| **d** ES | La comprensión compartida erosionada es la causa raíz; las revisiones privadas del ingeniero senior excluyeron al resto del equipo. |

**explanation**

| | |
|---|---|
| EN | Automation over-trust is not eliminated by seniority; it occurs whenever AI output enters the Increment without genuine verification, regardless of who performs the review. A superficial review by a senior engineer still constitutes unverified acceptance. While a single-reviewer setup may also create a bottleneck, the specific impediment evidenced by logic errors reaching the Increment is over-trust in the AI output rather than a throughput or knowledge-sharing failure. |
| ES | El exceso de confianza en la automatización no se elimina con la seniority; ocurre siempre que el output de la IA entra al Increment sin una verificación genuina, independientemente de quién realice la revisión. Una revisión superficial por parte de un ingeniero senior sigue siendo una aceptación no verificada. Si bien una configuración de revisor único también puede crear un cuello de botella, el impedimento específico evidenciado por los errores lógicos que llegan al Increment es el exceso de confianza en el output de la IA, y no un fallo de rendimiento o de intercambio de conocimiento. |

### 314. SM-AI-I · 5.10 · `e8065536-c4d8-4c46-94db-f000ebf9651b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.10: Identify the new impediments that arise in AI-augmented teams

**stem**

| | |
|---|---|
| EN | At the Retrospective, team members give conflicting explanations of a recently delivered feature, even though each used AI assistance on their own tasks. What should the Scrum Master identify as the impediment? |
| ES | En la Sprint Retrospective, los miembros del equipo dan explicaciones contradictorias sobre una funcionalidad recientemente entregada, aunque cada uno usó asistencia de IA en sus propias tareas. ¿Qué debería identificar el Scrum Master como impedimento? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | A documentation gap, because the team never recorded what the AI generated in shared reference materials. |
| **a** ES | Una brecha de documentación, porque el equipo nunca registró lo que generó la IA en materiales de referencia compartidos. |
| **b** EN | A review bottleneck, because AI output was produced faster than the team could collectively inspect it. |
| **b** ES | Un cuello de botella en la revisión, porque el output de la IA se produjo más rápido de lo que el equipo pudo inspeccionarlo colectivamente. |
| **c** EN | Automation over-trust, because the team accepted AI output without verifying it against requirements. |
| **c** ES | Exceso de confianza en la automatización, porque el equipo aceptó el output de la IA sin verificarlo contra los requisitos. |
| **d** EN | Eroded shared understanding, because private AI-assisted work fragmented the team's mental model of the feature. `<<KEY` |
| **d** ES | Comprensión compartida erosionada, porque el trabajo privado asistido por IA fragmentó el modelo mental del equipo sobre la funcionalidad. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | When team members use private AI assistance independently, they each build a local understanding without shared dialogue, fragmenting the team's collective mental model — the eroded shared understanding impediment. Updating documentation after the fact does not restore the shared mental model built through collaboration. This is a coordination and communication impediment, not a review throughput or output-acceptance problem. |
| ES | Cuando los miembros del equipo usan asistencia de IA de forma privada e independiente, cada uno construye una comprensión local sin diálogo compartido, fragmentando el modelo mental colectivo del equipo: el impedimento de comprensión compartida erosionada. Actualizar la documentación después del hecho no restaura el modelo mental compartido que se construye a través de la colaboración. Este es un impedimento de coordinación y comunicación, no un problema de rendimiento de revisión ni de aceptación de output. |

### 315. SM-AI-I · 5.2 · `5f6c0f48-0ba2-4b68-8e6a-3753a29d8eb3`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 5.2: Distinguish impediments from problems the team should resolve themselves

**stem**

| | |
|---|---|
| EN | Two team members have a recurring conflict the team has not yet tried to address. Sprint velocity is slightly lower than usual. What should the Scrum Master do first? |
| ES | Dos miembros del equipo tienen un conflicto recurrente que el equipo aún no ha intentado abordar. La velocidad del Sprint es ligeramente inferior a la habitual. ¿Qué debería hacer el Scrum Master primero? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Log it as an impediment; any issue reducing velocity qualifies for Scrum Master intervention. |
| **a** ES | Registrarlo como un impedimento; cualquier problema que reduzca la velocidad califica para la intervención del Scrum Master. |
| **b** EN | Escalate to HR right away; internal conflicts are outside SM scope and require a neutral third party. |
| **b** ES | Escalarlo a Recursos Humanos de inmediato; los conflictos internos están fuera del alcance del SM y requieren un tercero neutral. |
| **c** EN | Reassign one member immediately; protecting the team from all friction is the Scrum Master's primary role. |
| **c** ES | Reasignar a un miembro de inmediato; proteger al equipo de toda fricción es el rol principal del Scrum Master. |
| **d** EN | Coach the team to address the conflict themselves; give them the opportunity to resolve it first. `<<KEY` |
| **d** ES | Hacer coaching al equipo para que aborde el conflicto por sí mismo; darles la oportunidad de resolverlo primero. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | An interpersonal conflict the team has not yet attempted to resolve is a team-owned problem; the Scrum Master's first response is to coach the team toward self-resolution. Intervening directly before the team has tried undermines self-management. Reduced velocity alone does not reclassify a team-owned problem as an impediment. Immediate HR escalation is disproportionate before coaching has been attempted. |
| ES | Un conflicto interpersonal que el equipo aún no ha intentado resolver es un problema que le pertenece al equipo; la primera respuesta del Scrum Master es hacer coaching al equipo hacia la autorresolución. Intervenir directamente antes de que el equipo lo haya intentado socava la autogestión. La reducción de velocidad por sí sola no reclasifica un problema del equipo como un impedimento. Escalar a Recursos Humanos de inmediato es desproporcionado antes de haber intentado el coaching. |

### 316. SM-AI-I · 5.2 · `96e5b922-c131-45e9-a51a-d4faece3a49e`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.2: Distinguish impediments from problems the team should resolve themselves

**stem**

| | |
|---|---|
| EN | A team consistently underestimates work, missing Sprint Goals. They have the skills and retrospective process to analyze and fix this. What should the Scrum Master do? |
| ES | Un equipo subestima consistentemente el trabajo, sin alcanzar los Sprint Goals. Tienen las habilidades y el proceso de Sprint Retrospective para analizar y corregir esto. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Take over estimation facilitation; coaching instead of acting avoids the SM's real responsibility. |
| **a** ES | Tomar el control de la facilitación de la estimación; hacer coaching en lugar de actuar evita la verdadera responsabilidad del SM. |
| **b** EN | Raise it with management; repeated missed Sprint Goals signal an organizational problem beyond the team. |
| **b** ES | Plantearlo a la gerencia; los Sprint Goals incumplidos de forma repetida señalan un problema organizacional que va más allá del equipo. |
| **c** EN | Support the team in using their retrospective to improve estimation; this is a team-owned problem they can self-correct. `<<KEY` |
| **c** ES | Apoyar al equipo para que use su Sprint Retrospective y mejore la estimación; este es un problema que le pertenece al equipo y pueden autocorregirlo. `<<KEY` |
| **d** EN | Intervene after two more missed Sprints; prolonged issues automatically become impediments requiring SM action. |
| **d** ES | Intervenir después de dos Sprints más incumplidos; los problemas prolongados se convierten automáticamente en impedimentos que requieren la acción del SM. |

**explanation**

| | |
|---|---|
| EN | Repeated underestimation is a process improvement challenge within the team's capability; the Retrospective is the right forum for the team to own and address it. Taking over estimation facilitation bypasses self-management. Escalating to management is premature when the team has the means to self-correct. Duration alone does not convert a team-owned problem into an impediment. |
| ES | La subestimación repetida es un desafío de mejora de proceso dentro de las capacidades del equipo; el Sprint Retrospective es el foro adecuado para que el equipo sea dueño del problema y lo aborde. Tomar el control de la facilitación de la estimación evita la autogestión. Escalar a la gerencia es prematuro cuando el equipo tiene los medios para autocorregirse. La duración por sí sola no convierte un problema del equipo en un impedimento. |

### 317. SM-AI-I · 5.2 · `f38a0039-b41b-4b98-81e5-c13e26d126a1`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.2: Distinguish impediments from problems the team should resolve themselves

**stem**

| | |
|---|---|
| EN | In the Daily Scrum, a developer says she is unfamiliar with the team's chosen testing framework. No one else is blocked. What should the Scrum Master do? |
| ES | En el Daily Scrum, una desarrolladora dice que no está familiarizada con el framework de pruebas elegido por el equipo. Nadie más está bloqueado. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Escalate to management; internal skill gaps are outside SM scope and require organizational intervention. |
| **a** ES | Escalar a la gerencia; las brechas de habilidades internas están fuera del alcance del SM y requieren intervención organizacional. |
| **b** EN | Let the team address it through pairing or self-study; it is a team-owned problem within their capability. `<<KEY` |
| **b** ES | Dejar que el equipo lo aborde mediante trabajo en pareja o autoestudio; es un problema que le pertenece al equipo y está dentro de sus capacidades. `<<KEY` |
| **c** EN | Arrange external training immediately; any skill gap that slows work is an impediment requiring SM removal. |
| **c** ES | Organizar capacitación externa de inmediato; cualquier brecha de habilidades que ralentice el trabajo es un impedimento que el SM debe eliminar. |
| **d** EN | Log it as an impediment; anything raised in the Daily Scrum transfers ownership to the Scrum Master. |
| **d** ES | Registrarlo como un impedimento; todo lo que se plantea en el Daily Scrum transfiere la responsabilidad al Scrum Master. |

**explanation**

| | |
|---|---|
| EN | A skill gap the team can address through pairing or self-directed learning is a team-owned problem, not an impediment requiring Scrum Master removal. Mentioning something in the Daily Scrum does not transfer ownership to the Scrum Master. Arranging external training immediately bypasses the team's self-management. Escalating to management is disproportionate when the team has the means to resolve it. |
| ES | Una brecha de habilidades que el equipo puede abordar mediante trabajo en pareja o aprendizaje autodirigido es un problema que le pertenece al equipo, no un impedimento que el Scrum Master deba eliminar. Mencionar algo en el Daily Scrum no transfiere la responsabilidad al Scrum Master. Organizar capacitación externa de inmediato evita la autogestión del equipo. Escalar a la gerencia es desproporcionado cuando el equipo tiene los medios para resolverlo. |

### 318. SM-AI-I · 5.3 · `49f3d1d2-aded-4564-9fc2-c2ffd4cb8fdf`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.3: Coach a Scrum Team toward greater self-management

**stem**

| | |
|---|---|
| EN | A Scrum Team escalates every technical decision to the Scrum Master for approval. The Scrum Master wants to build greater self-management. What should the Scrum Master do? |
| ES | Un Scrum Team escala cada decisión técnica al Scrum Master para su aprobación. El Scrum Master quiere desarrollar una mayor auto-gestión. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Continue approving decisions quickly so the team maintains velocity while the Scrum Master models good judgment over time. |
| **a** ES | Continuar aprobando decisiones rápidamente para que el equipo mantenga la velocidad mientras el Scrum Master modela un buen juicio con el tiempo. |
| **b** EN | Respond with coaching questions that help the team reason through decisions and own the outcomes themselves. `<<KEY` |
| **b** ES | Responder con preguntas de coaching que ayuden al equipo a razonar sobre las decisiones y a apropiarse de los resultados por sí mismo. `<<KEY` |
| **c** EN | Escalate the pattern to management so the team's lack of autonomy is addressed at the organizational level first. |
| **c** ES | Escalar el patrón a la gerencia para que la falta de autonomía del equipo se aborde primero a nivel organizacional. |
| **d** EN | Decline all escalations immediately, since responding to any request for input reinforces dependency. |
| **d** ES | Rechazar todas las escalaciones de inmediato, ya que responder a cualquier solicitud de opinión refuerza la dependencia. |

**explanation**

| | |
|---|---|
| EN | The coaching stance — asking questions that guide the team's own reasoning — directly builds the self-management capability the team is missing. Approving decisions perpetuates dependency. Declining all input is an overcorrection that abandons the team. Escalating to management treats a coaching opportunity as an organizational defect prematurely. |
| ES | La postura de coaching —hacer preguntas que guíen el razonamiento propio del equipo— desarrolla directamente la capacidad de auto-gestión que le falta al equipo. Aprobar decisiones perpetúa la dependencia. Rechazar toda aportación es una corrección excesiva que abandona al equipo. Escalar a la gerencia trata prematuramente una oportunidad de coaching como un defecto organizacional. |

### 319. SM-AI-I · 5.3 · `d3360c19-49e1-4f8a-954e-8202e07a9ea0`

shown **1×** in the eight scored attempts — 0 correct, 1 wrong, 0 unanswered.  **A candidate got this wrong.**

> task 5.3: Coach a Scrum Team toward greater self-management

**stem**

| | |
|---|---|
| EN | A newly formed Scrum Team is confused during Sprint Planning about how to break down a Product Backlog item into tasks. What should the Scrum Master do? |
| ES | Un Scrum Team recién formado está confundido durante el Sprint Planning sobre cómo desglosar un elemento del Product Backlog en tareas. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Withdraw from the conversation, because self-managing teams must resolve planning confusion without Scrum Master involvement. |
| **a** ES | Retirarse de la conversación, porque los equipos autogestionados deben resolver la confusión de planificación sin la participación del Scrum Master. |
| **b** EN | Facilitate a discussion while steering the team toward the decomposition outcome the organization needs for the Sprint. |
| **b** ES | Facilitar una discusión mientras orienta al equipo hacia el resultado de descomposición que la organización necesita para el Sprint. |
| **c** EN | Teach a task-decomposition technique, since the team lacks the foundational knowledge that coaching questions alone cannot supply. `<<KEY` |
| **c** ES | Enseñar una técnica de descomposición de tareas, ya que al equipo le falta el conocimiento fundamental que las preguntas de coaching por sí solas no pueden proporcionar. `<<KEY` |
| **d** EN | Ask open-ended questions only, because providing direct answers will cause the team to become dependent on the Scrum Master. |
| **d** ES | Hacer únicamente preguntas abiertas, porque proporcionar respuestas directas hará que el equipo se vuelva dependiente del Scrum Master. |

**explanation**

| | |
|---|---|
| EN | When a team genuinely lacks a skill, the teaching stance is appropriate. Powerful coaching questions cannot substitute for missing foundational knowledge, so asking open-ended questions only leaves the team unable to function. Facilitation does not mean steering toward a predetermined outcome — that misrepresents the facilitator stance. Withdrawing entirely ignores the Scrum Master's responsibility to support a team that cannot yet self-manage in this area. |
| ES | Cuando un equipo genuinamente carece de una habilidad, la postura de enseñanza es la adecuada. Las preguntas de coaching poderosas no pueden sustituir el conocimiento fundamental que falta, por lo que hacer únicamente preguntas abiertas deja al equipo sin capacidad para funcionar. La facilitación no significa orientar hacia un resultado predeterminado: eso representa erróneamente la postura de facilitador. Retirarse por completo ignora la responsabilidad del Scrum Master de apoyar a un equipo que aún no puede autogestionarse en esta área. |

### 320. SM-AI-I · 5.3 · `e241a2a9-9632-420b-9ae3-3366653ac574`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 5.3: Coach a Scrum Team toward greater self-management

**stem**

| | |
|---|---|
| EN | Mid-Sprint, a senior developer asks the Scrum Master for advice on a technical approach, citing her software engineering background. What should the Scrum Master do? |
| ES | A mitad del Sprint, un desarrollador senior le pide consejo al Scrum Master sobre un enfoque técnico, citando su experiencia en ingeniería de software. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Convene a team meeting before responding, because facilitation is the correct stance whenever a technical question arises. |
| **a** ES | Convocar una reunión del equipo antes de responder, porque la facilitación es la postura correcta siempre que surja una pregunta técnica. |
| **b** EN | Share relevant experience as peer input using the mentoring stance, while making clear the team retains decision-making authority. `<<KEY` |
| **b** ES | Compartir la experiencia relevante como aporte entre pares usando la postura de mentoría, dejando en claro que el equipo conserva la autoridad para tomar decisiones. `<<KEY` |
| **c** EN | Decline to share an opinion and ask open-ended questions, because the coaching stance prohibits sharing expertise during a Sprint. |
| **c** ES | Negarse a compartir una opinión y hacer preguntas abiertas, porque la postura de coaching prohíbe compartir experiencia durante un Sprint. |
| **d** EN | Refer the developer to an external technical expert to keep the Scrum Master's role strictly process-focused. |
| **d** ES | Remitir al desarrollador a un experto técnico externo para mantener el rol del Scrum Master estrictamente enfocado en los procesos. |

**explanation**

| | |
|---|---|
| EN | Mentoring is appropriate when the Scrum Master has relevant experience the team can benefit from. Sharing it as peer input while preserving team decision authority supports self-management rather than undermining it. The belief that the coaching stance forbids sharing expertise misrepresents coaching — stances are chosen based on what the situation requires. Convening a full team meeting for every technical question misapplies the facilitation stance. Referring the developer to an external expert unnecessarily withholds relevant knowledge the Scrum Master already possesses. |
| ES | La mentoría es apropiada cuando el Scrum Master tiene experiencia relevante de la que el equipo puede beneficiarse. Compartirla como aporte entre pares mientras se preserva la autoridad de decisión del equipo apoya la autogestión en lugar de socavarla. La creencia de que la postura de coaching prohíbe compartir experiencia representa erróneamente el coaching: las posturas se eligen en función de lo que la situación requiere. Convocar una reunión completa del equipo para cada pregunta técnica aplica incorrectamente la postura de facilitación. Remitir al desarrollador a un experto externo retiene innecesariamente el conocimiento relevante que el Scrum Master ya posee. |

### 321. SM-AI-I · 5.3 · `59ecfe15-4a99-4a28-946c-87f5df35395a`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.3: Coach a Scrum Team toward greater self-management

**stem**

| | |
|---|---|
| EN | A Scrum Team has delivered consistently for six months but still waits for the Scrum Master to resolve interpersonal tensions. What is the most appropriate next action? |
| ES | Un Scrum Team ha entregado de manera consistente durante seis meses, pero aún espera que el Scrum Master resuelva las tensiones interpersonales. ¿Cuál es la siguiente acción más apropiada? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Shift to a mentoring stance and share personal conflict-resolution experience so the team gains from her expertise. |
| **a** ES | Cambiar a una postura de mentoría y compartir experiencia personal en resolución de conflictos para que el equipo se beneficie de su experiencia. |
| **b** EN | Continue resolving tensions directly while also teaching conflict-resolution skills in a separate team workshop. |
| **b** ES | Continuar resolviendo las tensiones directamente mientras también enseña habilidades de resolución de conflictos en un taller separado para el equipo. |
| **c** EN | Use coaching questions to prompt team members to reflect on how they want to handle tensions themselves. `<<KEY` |
| **c** ES | Usar preguntas de coaching para motivar a los miembros del equipo a reflexionar sobre cómo quieren manejar las tensiones por sí mismos. `<<KEY` |
| **d** EN | Progressively reduce attendance at Scrum events to signal the team is mature enough to operate independently. |
| **d** ES | Reducir progresivamente la asistencia a los eventos de Scrum para señalar que el equipo es lo suficientemente maduro para operar de forma independiente. |

**explanation**

| | |
|---|---|
| EN | Coaching questions that prompt self-reflection build the team's ownership of interpersonal dynamics, which is the goal when moving toward self-management. Gradually reducing attendance confuses physical presence with capability development — the Scrum Master's role continues even with mature teams. Shifting permanently to mentoring keeps the team reliant on the Scrum Master's answers rather than developing their own capability. Continuing to resolve tensions directly while running a separate workshop still leaves the team dependent for in-the-moment conflicts. |
| ES | Las preguntas de coaching que promueven la autorreflexión desarrollan la responsabilidad del equipo sobre las dinámicas interpersonales, que es el objetivo al avanzar hacia la autogestión. Reducir gradualmente la asistencia confunde la presencia física con el desarrollo de capacidades: el rol del Scrum Master continúa incluso con equipos maduros. Cambiar permanentemente a la mentoría mantiene al equipo dependiente de las respuestas del Scrum Master en lugar de desarrollar su propia capacidad. Continuar resolviendo tensiones directamente mientras se realiza un taller separado aún deja al equipo dependiente para los conflictos en el momento. |

### 322. SM-AI-I · 5.4 · `04be5971-d6de-4841-add6-200a75595910`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.4: Apply servant leadership behaviors

**stem**

| | |
|---|---|
| EN | A Scrum Master is asked why servant leadership applies across many industries, not just software. Which statement best explains this? |
| ES | A un Scrum Master se le pregunta por qué el liderazgo de servicio aplica en muchas industrias, no solo en el software. ¿Cuál enunciado explica mejor esto? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Greenleaf introduced it as a general philosophy centered on serving others first, making it broadly applicable before Scrum adopted it. `<<KEY` |
| **a** ES | Greenleaf lo introdujo como una filosofía general centrada en servir primero a los demás, lo que lo hace ampliamente aplicable antes de que Scrum lo adoptara. `<<KEY` |
| **b** EN | Greenleaf framed it as a project-management model where leaders set vision before delegating execution to subordinates. |
| **b** ES | Greenleaf lo planteó como un modelo de gestión de proyectos donde los líderes establecen la visión antes de delegar la ejecución a sus subordinados. |
| **c** EN | Greenleaf designed it for software teams, so its cross-industry use requires significant reinterpretation of core principles. |
| **c** ES | Greenleaf lo diseñó para equipos de software, por lo que su uso en otras industrias requiere una reinterpretación significativa de los principios fundamentales. |
| **d** EN | Greenleaf built it within manufacturing, so knowledge-work applications like Scrum represent a significant philosophical departure. |
| **d** ES | Greenleaf lo construyó dentro del ámbito manufacturero, por lo que las aplicaciones en trabajo del conocimiento como Scrum representan una desviación filosófica significativa. |

**explanation**

| | |
|---|---|
| EN | Greenleaf's 1970 essay presented servant leadership as a broad, domain-agnostic philosophy—serve others first—that was not tied to any industry. Agile and Scrum communities later adopted it precisely because of that generality. Claiming it was designed for software teams, for project management, or for manufacturing all misrepresent its origin and explain nothing about its cross-industry reach. |
| ES | El ensayo de Greenleaf de 1970 presentó el liderazgo de servicio como una filosofía amplia e independiente del dominio —servir primero a los demás— que no estaba vinculada a ninguna industria. Las comunidades ágiles y de Scrum lo adoptaron posteriormente precisamente por esa generalidad. Afirmar que fue diseñado para equipos de software, para la gestión de proyectos o para la manufactura malrepresenta su origen y no explica nada sobre su alcance en múltiples industrias. |

### 323. SM-AI-I · 5.4 · `745e6848-03f6-4cc5-ad57-8902aec4325b`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.4: Apply servant leadership behaviors

**stem**

| | |
|---|---|
| EN | A new Scrum Master asks whether the 2020 Guide's phrase 'true leader who serves' changes the day-to-day behaviors expected of the role. The correct guidance is: |
| ES | Un nuevo Scrum Master pregunta si la frase 'verdadero líder que sirve' de la Guía 2020 cambia los comportamientos cotidianos esperados del rol. La orientación correcta es: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | No—the 2020 phrasing updates the label only; the serving-others behaviors expected day-to-day remain unchanged. `<<KEY` |
| **a** ES | No: la redacción de 2020 actualiza solo la etiqueta; los comportamientos de servicio a los demás esperados en el día a día permanecen sin cambios. `<<KEY` |
| **b** EN | Yes—the new term signals a directive, managerial stance; the Scrum Master should now assign tasks and set team priorities. |
| **b** ES | Sí: el nuevo término señala una postura directiva y gerencial; el Scrum Master ahora debería asignar tareas y establecer prioridades del equipo. |
| **c** EN | Yes—removing 'servant-leader' means the Scrum Master no longer needs to prioritize others' needs over a personal agenda. |
| **c** ES | Sí: eliminar 'servant-leader' significa que el Scrum Master ya no necesita priorizar las necesidades de los demás sobre su propia agenda. |
| **d** EN | Yes—the term separates servant leadership from true leadership, so each Scrum role now applies a distinct leadership philosophy. |
| **d** ES | Sí: el término separa el liderazgo de servicio del liderazgo verdadero, por lo que cada rol de Scrum aplica ahora una filosofía de liderazgo distinta. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide's language change from 'servant-leader' to 'true leader who serves' is a terminological refinement, not a behavioral shift. The Scrum Master continues to prioritize the needs of the team and organization. Interpreting the change as a directive mandate, a license for self-interest, or a role-differentiated philosophy all misread the Guide's intent. |
| ES | El cambio de lenguaje en la Guía Scrum 2020 de 'servant-leader' a 'verdadero líder que sirve' es un refinamiento terminológico, no un cambio de comportamiento. El Scrum Master continúa priorizando las necesidades del equipo y la organización. Interpretar el cambio como un mandato directivo, una licencia para el interés propio o una filosofía diferenciada por rol, todos malinterpretan la intención de la Guía. |

### 324. SM-AI-I · 5.4 · `e7b3432d-6df7-4762-965d-0d68835931be`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.4: Apply servant leadership behaviors

**stem**

| | |
|---|---|
| EN | During Sprint Planning, the Scrum Master sees the team has selected far more work than historical velocity supports. A Scrum Master leading through service should: |
| ES | Durante el Sprint Planning, el Scrum Master observa que el equipo ha seleccionado mucho más trabajo del que soporta su velocidad histórica. Un Scrum Master con liderazgo de servicio debería: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Share historical velocity data, invite the team to reconsider, and then respect their revised decision. `<<KEY` |
| **a** ES | Compartir los datos de velocidad histórica, invitar al equipo a reconsiderar y luego respetar su decisión revisada. `<<KEY` |
| **b** EN | Take over Sprint Planning and set the Sprint Backlog directly, exercising the directive role the 2020 Guide assigns to the Scrum Master. |
| **b** ES | Tomar el control del Sprint Planning y definir el Sprint Backlog directamente, ejerciendo el rol directivo que la Guía 2020 asigna al Scrum Master. |
| **c** EN | Immediately ask the Product Owner to reduce scope, since protecting the team from overcommitment falls outside the Scrum Master's accountability. |
| **c** ES | Pedir inmediatamente al Product Owner que reduzca el alcance, ya que proteger al equipo del exceso de compromiso está fuera de la responsabilidad del Scrum Master. |
| **d** EN | Stay silent, since raising concerns would undermine the team's autonomy and erode trust. |
| **d** ES | Permanecer en silencio, ya que plantear preocupaciones socavaría la autonomía del equipo y erosionaría la confianza. |

**explanation**

| | |
|---|---|
| EN | A servant leader serves the team's long-term success, which includes surfacing risks and offering data to support better decisions without overriding team autonomy. Sharing historical velocity and prompting reconsideration strikes that balance. Staying silent confuses serving with passivity, taking over the event imposes authority the Scrum Master does not hold, and deferring immediately to the Product Owner misplaces accountability. |
| ES | Un líder servidor sirve al éxito a largo plazo del equipo, lo que incluye señalar riesgos y ofrecer datos para apoyar mejores decisiones sin anular la autonomía del equipo. Compartir la velocidad histórica y promover la reconsideración logra ese equilibrio. Permanecer en silencio confunde servir con pasividad, tomar el control del evento impone una autoridad que el Scrum Master no posee, y deferir inmediatamente al Product Owner traslada incorrectamente la responsabilidad. |

### 325. SM-AI-I · 5.4 · `fb13fb35-0ca2-4e77-98df-4d9fa4dbadd9`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.4: Apply servant leadership behaviors

**stem**

| | |
|---|---|
| EN | The Developers keeps skipping the Sprint Retrospective, calling it a waste of time. Applying servant leadership, what should the Scrum Master do? |
| ES | Los Developers siguen omitiendo la Sprint Retrospective, calificándola como una pérdida de tiempo. Aplicando el liderazgo de servicio, ¿qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Coach the team on the event's value, address their concerns, and reintroduce the Retrospective. `<<KEY` |
| **a** ES | Orientar al equipo sobre el valor del evento, abordar sus preocupaciones y reintroducir la Sprint Retrospective. `<<KEY` |
| **b** EN | Escalate to the Product Owner, since resolving team resistance falls outside the Scrum Master's accountability. |
| **b** ES | Escalar al Product Owner, ya que resolver la resistencia del equipo está fuera de la responsabilidad del Scrum Master. |
| **c** EN | Order the team to attend by invoking managerial authority granted by the 2020 Scrum Guide. |
| **c** ES | Ordenar al equipo que asista invocando la autoridad gerencial otorgada por la Guía Scrum 2020. |
| **d** EN | Cancel Retrospectives to honor the team's preference, since serving the team means deferring to their decisions. |
| **d** ES | Cancelar las Sprint Retrospectives para respetar la preferencia del equipo, ya que servir al equipo significa ceder ante sus decisiones. |

**explanation**

| | |
|---|---|
| EN | Servant leadership does not mean passive deference; a servant leader challenges and redirects the team when needed while still serving their growth. Coaching the team on the Retrospective's purpose and addressing their concerns applies that principle directly. Canceling the event confuses serving with acquiescing, and invoking managerial authority misreads the 2020 Guide's intent. Escalating to the Product Owner misplaces accountability. |
| ES | El liderazgo de servicio no implica deferencia pasiva; un líder servidor desafía y redirige al equipo cuando es necesario, mientras sigue apoyando su crecimiento. Orientar al equipo sobre el propósito de la Sprint Retrospective y abordar sus preocupaciones aplica ese principio de manera directa. Cancelar el evento confunde servir con ceder, e invocar la autoridad gerencial malinterpreta la intención de la Guía Scrum 2020. Escalar al Product Owner ubica la responsabilidad en el lugar equivocado. |

### 326. SM-AI-I · 5.5 · `15e9cee7-9fee-48d0-939c-2720d8275911`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.5: Recognize psychological safety and how SM behavior affects it

**stem**

| | |
|---|---|
| EN | During Sprint Retrospectives, team members only speak after the senior engineer shares his view and no one challenges him. What does this pattern most likely indicate? |
| ES | Durante las Sprint Retrospectives, los miembros del equipo solo hablan después de que el ingeniero senior comparte su punto de vista y nadie lo cuestiona. ¿Qué indica más probablemente este patrón? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | An individual confidence gap — some members personally lack the disposition to speak in groups. |
| **a** ES | Una brecha de confianza individual: algunos miembros carecen personalmente de la disposición para hablar en grupos. |
| **b** EN | High trust — members respect the senior engineer's experience and avoid unnecessary conflict. |
| **b** ES | Alta confianza: los miembros respetan la experiencia del ingeniero senior y evitan conflictos innecesarios. |
| **c** EN | Healthy consensus-building — aligning before debate reduces wasted discussion and improves efficiency. |
| **c** ES | Construcción saludable de consenso: alinearse antes del debate reduce las discusiones innecesarias y mejora la eficiencia. |
| **d** EN | Low psychological safety — members perceive interpersonal risk in challenging a dominant voice. `<<KEY` |
| **d** ES | Baja seguridad psicológica: los miembros perciben un riesgo interpersonal al cuestionar una voz dominante. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Edmondson's research identifies silence and deference as hallmarks of low team-level psychological safety: members suppress honest input because they perceive social risk in dissenting. Attributing the pattern to high trust confuses trust with safety; a team can trust individuals yet still fear consequences for dissent. Framing it as healthy consensus-building ignores that no challenge ever occurs, which signals suppression rather than agreement. Locating the cause in an individual confidence gap misidentifies a collective belief as a personal trait. |
| ES | La investigación de Edmondson identifica el silencio y la deferencia como características distintivas de una baja seguridad psicológica a nivel de equipo: los miembros suprimen sus opiniones honestas porque perciben un riesgo social al disentir. Atribuir el patrón a una alta confianza confunde la confianza con la seguridad psicológica; un equipo puede confiar en los individuos y aun así temer las consecuencias por disentir. Enmarcarlo como una construcción saludable de consenso ignora que nunca se produce ningún cuestionamiento, lo cual señala supresión en lugar de acuerdo. Ubicar la causa en una brecha de confianza individual identifica erróneamente una creencia colectiva como un rasgo personal. |

### 327. SM-AI-I · 5.5 · `5ecddc45-7b6f-459c-9170-ebaa4df2a77d`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 5.5: Recognize psychological safety and how SM behavior affects it

**stem**

| | |
|---|---|
| EN | Edmondson distinguishes psychological safety from trust. Which statement correctly identifies a key difference between the two constructs? |
| ES | Edmondson distingue la seguridad psicológica de la confianza. ¿Qué afirmación identifica correctamente una diferencia clave entre los dos constructos? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Trust concerns another's future reliability; psychological safety is a shared belief about present interpersonal risk in the group. `<<KEY` |
| **a** ES | La confianza se refiere a la fiabilidad futura de otro; la seguridad psicológica es una creencia compartida sobre el riesgo interpersonal presente en el grupo. `<<KEY` |
| **b** EN | Trust applies only to leader-team relationships; psychological safety applies only to peer-to-peer relationships. |
| **b** ES | La confianza se aplica solo a las relaciones líder-equipo; la seguridad psicológica se aplica solo a las relaciones entre pares. |
| **c** EN | Trust and safety are equivalent; building one reliably produces the other in a Scrum team. |
| **c** ES | La confianza y la seguridad son equivalentes; construir una produce de manera confiable la otra en un equipo Scrum. |
| **d** EN | Psychological safety is an individual's comfort level; trust is the collective belief that the team environment is safe. |
| **d** ES | La seguridad psicológica es el nivel de comodidad de un individuo; la confianza es la creencia colectiva de que el entorno del equipo es seguro. |

**explanation**

| | |
|---|---|
| EN | Edmondson explicitly distinguishes the two: trust is typically dyadic and forward-looking (will this person act reliably?), while psychological safety is a collective, present-tense belief about whether the team climate permits interpersonal risk-taking. Treating them as equivalent ignores that a team can have high pairwise trust yet low collective safety, as when members trust each other personally but still fear group judgment. |
| ES | Edmondson distingue explícitamente los dos: la confianza es típicamente diádica y orientada al futuro (¿actuará esta persona de manera confiable?), mientras que la seguridad psicológica es una creencia colectiva en tiempo presente sobre si el clima del equipo permite asumir riesgos interpersonales. Tratarlos como equivalentes ignora que un equipo puede tener alta confianza entre pares pero baja seguridad colectiva, como cuando los miembros se tienen confianza personalmente pero aún temen el juicio del grupo. |

### 328. SM-AI-I · 5.5 · `8ce51417-d7ec-43bc-9038-58c9d36a9ce3`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.5: Recognize psychological safety and how SM behavior affects it

**stem**

| | |
|---|---|
| EN | A Scrum Master resolves all team conflicts immediately, and members now route every disagreement through them. Which problem does this most likely indicate? |
| ES | Un Scrum Master resuelve todos los conflictos del equipo de inmediato, y los miembros ahora canalizan cada desacuerdo a través de él. ¿Qué problema indica esto con mayor probabilidad? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | The Scrum Master is building psychological safety unilaterally, which is the correct approach for this role. |
| **a** ES | El Scrum Master está construyendo seguridad psicológica de manera unilateral, lo cual es el enfoque correcto para este rol. |
| **b** EN | The team has high trust and no longer needs direct conflict, so routing through the SM is efficient. |
| **b** ES | El equipo tiene alta confianza y ya no necesita conflicto directo, por lo que canalizarlo a través del Scrum Master es eficiente. |
| **c** EN | The Scrum Master suppresses productive conflict tolerance, undermining the team's self-management capacity. `<<KEY` |
| **c** ES | El Scrum Master suprime la tolerancia al conflicto productivo, socavando la capacidad de autogestión del equipo. `<<KEY` |
| **d** EN | The pattern signals low morale; improving satisfaction will restore the team's willingness to self-manage. |
| **d** ES | El patrón señala baja moral; mejorar la satisfacción restaurará la disposición del equipo a autogestirse. |

**explanation**

| | |
|---|---|
| EN | Psychological safety enables teams to engage in productive conflict — the Scrum Master's role is to create conditions for that, not to absorb conflict on the team's behalf. Intervening repeatedly prevents the team from developing conflict tolerance, which is foundational to self-management. Safety is a shared team property, not something the Scrum Master produces unilaterally, and the issue is not reducible to morale. |
| ES | La seguridad psicológica permite a los equipos participar en conflictos productivos; el rol del Scrum Master es crear las condiciones para ello, no absorber el conflicto en nombre del equipo. Intervenir repetidamente impide que el equipo desarrolle tolerancia al conflicto, que es fundamental para la autogestión. La seguridad es una propiedad compartida del equipo, no algo que el Scrum Master produce unilateralmente, y el problema no se reduce a la moral. |

### 329. SM-AI-I · 5.6 · `4db6ff94-ef58-4aac-b38c-dc885bc26fb8`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 5.6: Coach the Product Owner

**stem**

| | |
|---|---|
| EN | A Scrum Master sees the PO struggling in a tense stakeholder negotiation. The PO has the authority and context needed. What is the Scrum Master's best coaching response? |
| ES | Un Scrum Master ve al Product Owner luchando en una tensa negociación con interesados. El Product Owner tiene la autoridad y el contexto necesarios. ¿Cuál es la mejor respuesta de coaching del Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Quietly prompt the PO with suggested responses during the negotiation as needed. |
| **a** ES | Sugerir respuestas al Product Owner en voz baja durante la negociación cuando sea necesario. |
| **b** EN | Attend all future stakeholder meetings to provide real-time support until confidence improves. |
| **b** ES | Asistir a todas las reuniones futuras con interesados para brindar apoyo en tiempo real hasta que la confianza mejore. |
| **c** EN | Step in and lead the negotiation so the PO can observe a productive approach. |
| **c** ES | Intervenir y liderar la negociación para que el Product Owner pueda observar un enfoque productivo. |
| **d** EN | Let the PO navigate it, then debrief using reflective questions to build their skills. `<<KEY` |
| **d** ES | Dejar que el Product Owner la maneje y luego hacer una sesión de retroalimentación usando preguntas reflexivas para desarrollar sus habilidades. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Allowing the PO to navigate the negotiation and debriefing with reflective questions afterward respects the PO's authority while actively building capability — this is coaching without taking ownership. Stepping in to lead transfers the PO's accountability to the Scrum Master. Attending all future meetings creates dependency rather than developing the PO's independence. Prompting the PO with suggested responses during the meeting undermines their authority and prevents genuine skill development. |
| ES | Permitir que el Product Owner conduzca la negociación y luego hacer una sesión de retroalimentación con preguntas reflexivas respeta la autoridad del Product Owner mientras se desarrolla activamente su capacidad — esto es coaching sin asumir la responsabilidad. Intervenir para liderar transfiere la responsabilidad del Product Owner al Scrum Master. Asistir a todas las reuniones futuras crea dependencia en lugar de desarrollar la independencia del Product Owner. Sugerirle respuestas al Product Owner durante la reunión socava su autoridad e impide el desarrollo genuino de habilidades. |

### 330. SM-AI-I · 5.6 · `5e1c4a81-359f-4a1b-a367-6b50f92da334`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.6: Coach the Product Owner

**stem**

| | |
|---|---|
| EN | A Scrum Master is coaching a PO who resists having assumptions challenged and prefers agreement over reflection. The Scrum Master should: |
| ES | Un Scrum Master está orientando a un PO que se resiste a que le cuestionen sus suposiciones y prefiere el acuerdo por encima de la reflexión. El Scrum Master debería: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Escalate the PO's resistance to management as a blocker requiring a formal performance intervention. |
| **a** ES | Escalar la resistencia del PO a la gerencia como un obstáculo que requiere una intervención formal de desempeño. |
| **b** EN | Replace open questions with direct advice so the PO avoids the discomfort of reflection. |
| **b** ES | Reemplazar las preguntas abiertas con consejos directos para que el PO evite la incomodidad de la reflexión. |
| **c** EN | Name the pattern openly with the PO and agree on how challenge and safety can coexist in their sessions. `<<KEY` |
| **c** ES | Nombrar el patrón abiertamente con el PO y acordar cómo el cuestionamiento y la seguridad pueden coexistir en sus sesiones. `<<KEY` |
| **d** EN | Avoid challenging the PO's assumptions to protect psychological safety in the coaching relationship. |
| **d** ES | Evitar cuestionar las suposiciones del PO para proteger la seguridad psicológica en la relación de coaching. |

**explanation**

| | |
|---|---|
| EN | Naming the dynamic openly and co-creating a safe-yet-challenging coaching contract addresses the resistance directly while preserving the relationship. Avoiding challenge conflates comfort with safety and stunts PO growth. Replacing questions with direct advice removes the reflective core of coaching. Escalating to management is disproportionate and undermines trust. |
| ES | Nombrar la dinámica abiertamente y co-crear un contrato de coaching seguro pero desafiante aborda la resistencia directamente mientras preserva la relación. Evitar el cuestionamiento confunde la comodidad con la seguridad y frena el crecimiento del PO. Reemplazar las preguntas con consejos directos elimina el núcleo reflexivo del coaching. Escalar a la gerencia es desproporcionado y socava la confianza. |

### 331. SM-AI-I · 5.6 · `bd02f1fa-e9cf-4fe0-aee4-8a11043de89c`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.6: Coach the Product Owner

**stem**

| | |
|---|---|
| EN | A PO is overwhelmed by three stakeholders pushing conflicting Sprint additions. What is the Scrum Master's most appropriate coaching action? |
| ES | Un PO está abrumado por tres interesados que presionan con adiciones al Sprint que se contradicen entre sí. ¿Cuál es la acción de coaching más apropiada del Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Temporarily shield the PO from further stakeholder contact, acting as a buffer until the PO demonstrates stronger negotiation confidence and readiness. |
| **a** ES | Proteger temporalmente al PO del contacto con los interesados, actuando como intermediario hasta que el PO demuestre mayor confianza y disposición para negociar. |
| **b** EN | Step in to negotiate the conflicting priorities directly with stakeholders, relieving the PO of immediate pressure while the situation is resolved. |
| **b** ES | Intervenir para negociar directamente con los interesados las prioridades en conflicto, aliviando la presión inmediata del PO mientras se resuelve la situación. |
| **c** EN | Debrief with the PO afterward, asking reflective questions that build their capacity to handle similar stakeholder conflicts independently in the future. `<<KEY` |
| **c** ES | Hacer una sesión de reflexión con el PO después del evento, haciendo preguntas reflexivas que desarrollen su capacidad para manejar conflictos similares con interesados de forma independiente en el futuro. `<<KEY` |
| **d** EN | Apply a standard prioritization framework on the PO's behalf, overriding any tentative decisions the PO has already made with stakeholders. |
| **d** ES | Aplicar un marco de priorización estándar en nombre del PO, anulando cualquier decisión tentativa que el PO ya haya tomado con los interesados. |

**explanation**

| | |
|---|---|
| EN | Debriefing with reflective questions builds the PO's capability to manage stakeholder conflict independently, which is the coaching goal. Taking over negotiations, overriding decisions, or shielding the PO from stakeholders all prevent the PO from developing the skills they need and undermine their authority. |
| ES | La sesión de reflexión con preguntas reflexivas desarrolla la capacidad del PO para gestionar conflictos con interesados de forma independiente, que es el objetivo del coaching. Asumir las negociaciones, anular decisiones o proteger al PO de los interesados impide que el PO desarrolle las habilidades que necesita y socava su autoridad. |

### 332. SM-AI-I · 5.6 · `ce93d67e-df94-42f3-89b2-37c860594b47`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.6: Coach the Product Owner

**stem**

| | |
|---|---|
| EN | A Scrum Master notices the PO makes backlog decisions by polling the entire Developers for consensus. What should the Scrum Master do? |
| ES | Un Scrum Master nota que el Product Owner toma decisiones sobre el backlog consultando a todos los Developers para llegar a un consenso. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Take over backlog ordering temporarily to model decisive prioritization for the PO. |
| **a** ES | Asumir temporalmente la ordenación del Product Backlog para modelar una priorización decisiva ante el Product Owner. |
| **b** EN | Coach the PO to distinguish between gathering team input and delegating prioritization authority to the group. `<<KEY` |
| **b** ES | Orientar al Product Owner para que distinga entre recopilar aportes del equipo y delegar la autoridad de priorización al grupo. `<<KEY` |
| **c** EN | Instruct the Developers to stop offering opinions so the PO is forced to decide independently. |
| **c** ES | Indicar a los Developers que dejen de ofrecer opiniones para que el Product Owner se vea obligado a decidir de forma independiente. |
| **d** EN | Validate the PO's approach, since collaborative backlog decisions improve team buy-in and raise velocity. |
| **d** ES | Validar el enfoque del Product Owner, ya que las decisiones colaborativas sobre el Product Backlog mejoran la participación del equipo y aumentan la velocidad. |

**explanation**

| | |
|---|---|
| EN | Coaching the PO to distinguish input-gathering from decision delegation addresses the 'by committee' anti-pattern while preserving the PO's authority. Silencing the team, taking over the backlog, or endorsing the pattern all fail to build the PO's decision-making capability. |
| ES | Orientar al Product Owner para que distinga entre recopilar aportes y delegar decisiones aborda el antipatrón de 'decisión por comité', al tiempo que preserva la autoridad del Product Owner. Silenciar al equipo, asumir el control del Product Backlog o avalar el patrón no contribuyen a desarrollar la capacidad de toma de decisiones del Product Owner. |

### 333. SM-AI-I · 5.6 · `ff5f48d4-c6f3-4251-b9f0-318342f620fc`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 5.6: Coach the Product Owner

**stem**

| | |
|---|---|
| EN | A Product Owner consistently defers prioritization to the Developers, saying 'whatever you think is best.' What should the Scrum Master do first? |
| ES | Un Product Owner consistentemente delega la priorización a los Developers, diciendo 'lo que ustedes crean que es mejor'. ¿Qué debería hacer primero el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Ask the PO powerful questions to surface their reasoning about stakeholder value and product goals. `<<KEY` |
| **a** ES | Hacerle al Product Owner preguntas poderosas para revelar su razonamiento sobre el valor para los interesados y los objetivos del producto. `<<KEY` |
| **b** EN | Reprioritize the Product Backlog on the PO's behalf to restore delivery momentum. |
| **b** ES | Repriorizar el Product Backlog en nombre del Product Owner para restaurar el impulso de entrega. |
| **c** EN | Attend stakeholder meetings for the PO to reduce the external pressure driving the avoidance. |
| **c** ES | Asistir a las reuniones con los interesados en lugar del Product Owner para reducir la presión externa que genera la evasión. |
| **d** EN | Escalate the PO's indecisiveness to management so a more decisive owner can be assigned. |
| **d** ES | Escalar la indecisión del Product Owner a la gerencia para que se pueda asignar un responsable más decidido. |

**explanation**

| | |
|---|---|
| EN | Coaching through powerful questions helps the PO develop prioritization capability without the Scrum Master taking ownership of backlog decisions. Reprioritizing the backlog or attending meetings on the PO's behalf removes ownership rather than building it. Escalating to management bypasses the PO's authority entirely. |
| ES | El coaching a través de preguntas poderosas ayuda al Product Owner a desarrollar la capacidad de priorización sin que el Scrum Master asuma la responsabilidad de las decisiones del backlog. Repriorizar el backlog o asistir a reuniones en nombre del Product Owner elimina la responsabilidad en lugar de desarrollarla. Escalar a la gerencia omite por completo la autoridad del Product Owner. |

### 334. SM-AI-I · 5.7 · `38352993-97c1-4dd2-ac5e-86badfcc7ec0`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.7: Translate between legacy training terminology and the 2020 Scrum Guide

**stem**

| | |
|---|---|
| EN | A legacy course says the whole Scrum Team — Product Owner, Scrum Master, and Developers — collectively decides who performs each task. How does the 2020 Scrum Guide classify that claim? |
| ES | Un curso heredado dice que todo el Scrum Team, el Product Owner, el Scrum Master y los Developers, decide colectivamente quién realiza cada tarea. ¿Cómo clasifica la Guía Scrum 2020 esa afirmación? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Partially correct; the Product Owner joins Developers in work selection, but the Scrum Master is excluded. |
| **a** ES | Parcialmente correcta; el Product Owner se une a los Developers en la selección del trabajo, pero el Scrum Master queda excluido. |
| **b** EN | Correct; 'self-managing' means all three accountabilities jointly assign Sprint work. |
| **b** ES | Correcta; 'auto-gestionados' significa que las tres responsabilidades asignan conjuntamente el trabajo del Sprint. |
| **c** EN | A misreading; 'self-managing' refers specifically to Developers deciding who does which work. `<<KEY` |
| **c** ES | Una mala interpretación; 'auto-gestionados' se refiere específicamente a los Developers que deciden quién hace qué trabajo. `<<KEY` |
| **d** EN | Outdated; 'self-managing' eliminated the concept of any role owning work-assignment decisions. |
| **d** ES | Desactualizada; 'auto-gestionados' eliminó el concepto de que cualquier rol sea dueño de las decisiones de asignación de trabajo. |

**explanation**

| | |
|---|---|
| EN | The 2020 Scrum Guide attributes self-management specifically to Developers regarding who does which work. The Product Owner manages the backlog and the Scrum Master leads process; neither joins Developers in internal task-assignment decisions. |
| ES | La Guía Scrum 2020 atribuye la auto-gestión específicamente a los Developers en cuanto a quién hace qué trabajo. El Product Owner gestiona el backlog y el Scrum Master lidera el proceso; ninguno de los dos se une a los Developers en las decisiones internas de asignación de tareas. |

### 335. SM-AI-I · 5.8 · `3e8cbeb2-944b-447a-9322-240ff4851b84`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.8: Coach the organization on Scrum adoption

**stem**

| | |
|---|---|
| EN | Annual project budgets lock scope, preventing Scrum Teams from adapting based on Sprint outcomes. What should the Scrum Master address first? |
| ES | Los presupuestos anuales de proyectos bloquean el alcance, impidiendo que los Scrum Teams se adapten con base en los resultados del Sprint. ¿Qué debería abordar primero el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Escalate to the PMO and remove the item from the SM's impediment list once escalation is sent. |
| **a** ES | Escalar a la PMO y eliminar el elemento de la lista de impedimentos del SM una vez enviada la escalación. |
| **b** EN | Ask the Product Owner to renegotiate scope each Sprint while keeping the funding structure unchanged. |
| **b** ES | Pedir al Product Owner que renegocie el alcance en cada Sprint manteniendo sin cambios la estructura de financiamiento. |
| **c** EN | Coach leaders to explore product-based or capacity funding that supports iterative delivery. `<<KEY` |
| **c** ES | Orientar a los líderes para explorar un financiamiento basado en producto o por capacidad que respalde la entrega iterativa. `<<KEY` |
| **d** EN | Teach teams to work within fixed-scope budgets; funding models are separate from how teams deliver. |
| **d** ES | Enseñar a los equipos a trabajar dentro de presupuestos de alcance fijo; los modelos de financiamiento son independientes de cómo entregan los equipos. |

**explanation**

| | |
|---|---|
| EN | Project-based funding that locks scope is a structural organizational impediment, not a neutral administrative detail. The Scrum Master should coach leaders toward funding models that enable empiricism. Working around the broken model or treating a one-time escalation as resolution fails to remove the root impediment. |
| ES | El financiamiento basado en proyectos que bloquea el alcance es un impedimento organizacional estructural, no un detalle administrativo neutro. El Scrum Master debe orientar a los líderes hacia modelos de financiamiento que habiliten el empirismo. Trabajar alrededor del modelo deficiente o tratar una escalación puntual como resolución no elimina el impedimento raíz. |

### 336. SM-AI-I · 5.8 · `6dc29170-270c-4322-aeb3-cb72faab2fb7`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.8: Coach the organization on Scrum adoption

**stem**

| | |
|---|---|
| EN | Leaders ask the Scrum Master to limit coaching to processes and tools, excluding mindset and cultural topics. What should the Scrum Master do? |
| ES | Los líderes le piden al Scrum Master que limite el coaching a procesos y herramientas, excluyendo los temas de mentalidad y cultura. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Defer to the Product Owner, who owns organizational relationships and can negotiate the coaching scope. |
| **a** ES | Defer al Product Owner, quien es dueño de las relaciones organizacionales y puede negociar el alcance del coaching. |
| **b** EN | Comply; mindset and values are team-level concerns, so organizational coaching should stay process-focused. |
| **b** ES | Cumplir; la mentalidad y los valores son preocupaciones a nivel de equipo, por lo que el coaching organizacional debe mantenerse enfocado en procesos. |
| **c** EN | Focus on processes now and raise mindset topics only after leaders see measurable process improvements. |
| **c** ES | Enfocarse en los procesos ahora y plantear los temas de mentalidad solo después de que los líderes vean mejoras de proceso medibles. |
| **d** EN | Explain that sustainable adoption requires coaching on mindset alongside processes, and seek to include both. `<<KEY` |
| **d** ES | Explicar que una adopción sostenible requiere orientar sobre la mentalidad junto con los procesos, y buscar incluir ambos. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Scrum's empirical pillars and values must be understood and practiced at the organizational level; process changes without mindset change produce shallow, fragile adoption. The SM is responsible for this broader coaching—not the Product Owner—and should proactively make the case rather than waiting for permission or sequencing mindset work after process gains. |
| ES | Los pilares empíricos y los valores de Scrum deben entenderse y practicarse a nivel organizacional; los cambios de proceso sin cambio de mentalidad producen una adopción superficial y frágil. El SM es responsable de este coaching más amplio —no el Product Owner— y debe plantear proactivamente el argumento en lugar de esperar permiso o secuenciar el trabajo de mentalidad después de los logros de proceso. |

### 337. SM-AI-I · 5.8 · `7fa1691e-a6d9-4669-ac5b-feec839318c1`

shown **3×** in the eight scored attempts — 3 correct, 0 wrong, 0 unanswered.

> task 5.8: Coach the organization on Scrum adoption

**stem**

| | |
|---|---|
| EN | A Scrum Team performs well, but a silo between Engineering and Marketing delays feedback on increments. What should the Scrum Master do? |
| ES | Un Scrum Team tiene buen desempeño, pero un silo entre Ingeniería y Marketing retrasa la retroalimentación sobre los Increment. ¿Qué debería hacer el Scrum Master? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Escalate in writing and remove it from the SM's backlog, since authority lies elsewhere. |
| **a** ES | Escalar por escrito y eliminarlo del backlog del SM, ya que la autoridad está en otro lugar. |
| **b** EN | Coach organizational leaders to remove the silo as a structural impediment. `<<KEY` |
| **b** ES | Orientar a los líderes de la organización para eliminar el silo como un impedimento estructural. `<<KEY` |
| **c** EN | Close the impediment; the SM's coaching ends once the Scrum Team itself is functioning well. |
| **c** ES | Cerrar el impedimento; el trabajo de coaching del SM termina una vez que el Scrum Team funciona bien. |
| **d** EN | Schedule recurring cross-team meetings to improve communication across the boundary. |
| **d** ES | Programar reuniones periódicas entre equipos para mejorar la comunicación a través de esa barrera. |

**explanation**

| | |
|---|---|
| EN | The Scrum Master serves the organization by coaching leaders to remove structural impediments such as functional silos; this responsibility does not end when the team performs well. Adding meetings addresses symptoms, not the structural cause. Escalating and dropping the item abandons the SM's ongoing coaching obligation. |
| ES | El Scrum Master sirve a la organización orientando a los líderes para eliminar impedimentos estructurales como los silos funcionales; esta responsabilidad no termina cuando el equipo tiene buen desempeño. Agregar reuniones aborda los síntomas, no la causa estructural. Escalar y abandonar el elemento significa renunciar a la obligación continua de coaching del SM. |

### 338. SM-AI-I · 5.8 · `9b642d82-9737-4a93-bd2f-bbc1e6cea591`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.8: Coach the organization on Scrum adoption

**stem**

| | |
|---|---|
| EN | Leadership asks the Scrum Master for a rollout plan to introduce Scrum across a large department. Which approach best reflects sound adoption coaching? |
| ES | La dirección le pide al Scrum Master un plan de implementación para introducir Scrum en un departamento grande. ¿Qué enfoque refleja mejor un coaching de adopción sólido? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Mandate identical Scrum practices for all teams simultaneously to ensure consistency. |
| **a** ES | Exigir prácticas de Scrum idénticas para todos los equipos simultáneamente para garantizar la coherencia. |
| **b** EN | Roll out in strict department-by-department phases to minimize disruption and ensure uniform readiness. |
| **b** ES | Implementar en fases estrictas departamento por departamento para minimizar la interrupción y garantizar una preparación uniforme. |
| **c** EN | Deliver one certification workshop for all staff, then hand ongoing coaching to attendees. |
| **c** ES | Impartir un taller de certificación único para todo el personal y luego traspasar el coaching continuo a los asistentes. |
| **d** EN | Start with willing teams, inspect outcomes, and adapt the rollout based on what is learned. `<<KEY` |
| **d** ES | Comenzar con los equipos dispuestos, inspeccionar los resultados y adaptar la implementación según lo aprendido. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Empirical adoption—starting where there is readiness, inspecting, and adapting—is more effective and durable than mandating uniform simultaneous rollout or rigid phasing. A one-time workshop without ongoing coaching is insufficient, and strict sequential phases ignore what is learned from early teams. |
| ES | La adopción empírica —comenzar donde hay disposición, inspeccionar y adaptar— es más efectiva y duradera que exigir una implementación simultánea uniforme o fases rígidas. Un taller único sin coaching continuo es insuficiente, y las fases secuenciales estrictas ignoran lo que se aprende de los primeros equipos. |

### 339. SM-AI-I · 5.9 · `0ba6d085-afc8-4898-ab29-b16eb7fd622f`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.9: Recognize scaling anti-patterns at a foundational level

**stem**

| | |
|---|---|
| EN | An organization running LeSS assigns one Product Owner to each team and treats the single-PO rule as optional beyond five teams. This practice is best classified as: |
| ES | Una organización que usa LeSS asigna un Product Owner a cada equipo y trata la regla de un solo PO como opcional cuando hay más de cinco equipos. Esta práctica se clasifica mejor como: |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Acceptable governance: workload above five teams makes a single Product Owner structurally impossible. |
| **a** ES | Gobernanza aceptable: la carga de trabajo con más de cinco equipos hace que un solo Product Owner sea estructuralmente imposible. |
| **b** EN | An anti-pattern: Area POs in LeSS Huge support one overall Product Owner; they do not replace the role. `<<KEY` |
| **b** ES | Un anti-patrón: los Area POs en LeSS Huge apoyan a un Product Owner general; no reemplazan el rol. `<<KEY` |
| **c** EN | Sound scaling: LeSS Huge explicitly lets Area POs replace the single Product Owner. |
| **c** ES | Escalado adecuado: LeSS Huge permite explícitamente que los Area POs reemplacen al Product Owner único. |
| **d** EN | Compliant with LeSS: the framework permits distributed ownership once customer areas are formally defined. |
| **d** ES | Conforme con LeSS: el marco permite la propiedad distribuida una vez que las áreas de cliente están formalmente definidas. |

**explanation**

| | |
|---|---|
| EN | In LeSS Huge, Area Product Owners assist one overall Product Owner; they do not replace single-PO accountability. Treating the single-PO rule as optional once team count grows is a misconception — the rule holds regardless of scale. Area POs are a support structure, not a separate product ownership layer. |
| ES | En LeSS Huge, los Area Product Owners asisten a un Product Owner general; no reemplazan la responsabilidad individual. Tratar la regla de un solo PO como opcional cuando crece el número de equipos es un error conceptual: la regla se mantiene independientemente de la escala. Los Area POs son una estructura de apoyo, no una capa separada de propiedad del producto. |

### 340. SM-AI-I · 5.9 · `2fbc4c87-4324-44c4-a81c-67d4383e22ee`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.9: Recognize scaling anti-patterns at a foundational level

**stem**

| | |
|---|---|
| EN | Two Scrum teams build one product. Team A owns its own Product Backlog; Team B owns a separate one. Which statement best describes this arrangement? |
| ES | Dos equipos Scrum construyen un producto. El Equipo A tiene su propio Product Backlog; el Equipo B tiene uno separado. ¿Cuál afirmación describe mejor este arreglo? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | Required by Nexus: Nexus mandates a per-team backlog alongside the Nexus Sprint Backlog. |
| **a** ES | Requerido por Nexus: Nexus exige un backlog por equipo junto con el Nexus Sprint Backlog. |
| **b** EN | Anti-pattern: one product must have exactly one shared Product Backlog, regardless of team count. `<<KEY` |
| **b** ES | Anti-patrón: un producto debe tener exactamente un Product Backlog compartido, independientemente del número de equipos. `<<KEY` |
| **c** EN | Valid: sharing one Product Goal and one Product Owner satisfies the single-backlog rule. |
| **c** ES | Válido: compartir un Product Goal y un Product Owner satisface la regla de un solo backlog. |
| **d** EN | Acceptable: separate backlogs reduce coordination overhead between teams. |
| **d** ES | Aceptable: los backlogs separados reducen la sobrecarga de coordinación entre equipos. |

**explanation**

| | |
|---|---|
| EN | Scrum requires exactly one Product Backlog per product, no matter how many teams contribute. Splitting it into per-team backlogs is a classic scaling anti-pattern. Nexus does not mandate per-team backlogs; it adds a Nexus Sprint Backlog for integration work while the single Product Backlog remains. Sharing a Product Goal while keeping separate backlogs still violates the one-backlog rule. |
| ES | Scrum requiere exactamente un Product Backlog por producto, sin importar cuántos equipos contribuyan. Dividirlo en backlogs por equipo es un anti-patrón clásico de escalado. Nexus no exige backlogs por equipo; agrega un Nexus Sprint Backlog para el trabajo de integración mientras el Product Backlog único permanece. Compartir un Product Goal manteniendo backlogs separados sigue violando la regla de un solo backlog. |

### 341. SM-AI-I · 5.9 · `4282297a-11ae-44eb-ad38-39f723befe40`

shown **2×** in the eight scored attempts — 2 correct, 0 wrong, 0 unanswered.

> task 5.9: Recognize scaling anti-patterns at a foundational level

**stem**

| | |
|---|---|
| EN | What do Nexus, SAFe, and LeSS have in common regarding the Product Backlog? |
| ES | ¿Qué tienen en común Nexus, SAFe y LeSS con respecto al Product Backlog? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | All three replace the Product Backlog with a program-level artifact once more than two teams are involved. |
| **a** ES | Los tres reemplazan el Product Backlog con un artefacto a nivel de programa cuando hay más de dos equipos involucrados. |
| **b** EN | Each requires teams to independently own their backlog slice, making per-team ownership the norm. |
| **b** ES | Cada uno requiere que los equipos posean de forma independiente su porción del backlog, haciendo que la propiedad por equipo sea la norma. |
| **c** EN | Each allows parallel backlogs per Program Increment or Area, converging only at release time. |
| **c** ES | Cada uno permite backlogs paralelos por Program Increment o Área, que convergen solo en el momento del lanzamiento. |
| **d** EN | All three preserve a single Product Backlog while adding coordination structures for multiple teams. `<<KEY` |
| **d** ES | Los tres preservan un único Product Backlog mientras agregan estructuras de coordinación para múltiples equipos. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | Nexus, SAFe, and LeSS each add coordination layers — integration teams, release trains, area structures — but all retain one Product Backlog as the single source of ordered work for the product. Per-team ownership of backlog slices and parallel backlogs per increment are anti-patterns, not features, of these frameworks. |
| ES | Nexus, SAFe y LeSS agregan capas de coordinación —equipos de integración, trenes de lanzamiento, estructuras de área— pero todos conservan un único Product Backlog como la fuente única de trabajo ordenado para el producto. La propiedad por equipo de porciones del backlog y los backlogs paralelos por incremento son anti-patrones, no características, de estos marcos. |

### 342. SM-AI-I · 5.9 · `38b1d499-9c64-49e1-985f-c62f7ee1d910`

shown **1×** in the eight scored attempts — 1 correct, 0 wrong, 0 unanswered.

> task 5.9: Recognize scaling anti-patterns at a foundational level

**stem**

| | |
|---|---|
| EN | Five Scrum teams share one product. Leadership creates a five-person 'Product Owner committee' so each team has a dedicated decision-maker. Which statement best characterizes this structure? |
| ES | Cinco equipos Scrum comparten un producto. El liderazgo crea un 'comité de Product Owner' de cinco personas para que cada equipo tenga un tomador de decisiones dedicado. ¿Cuál afirmación caracteriza mejor esta estructura? |

**options** — the key is marked `<<KEY`

| id | |
|---|---|
| **a** EN | It is valid because shared ownership prevents any one person from becoming a decision-making bottleneck. |
| **a** ES | Es válida porque la propiedad compartida evita que una sola persona se convierta en un cuello de botella en la toma de decisiones. |
| **b** EN | It is valid in SAFe because a Chief Product Owner at the top satisfies the single-accountability rule overall. |
| **b** ES | Es válida en SAFe porque un Chief Product Owner en la cima satisface la regla de responsabilidad única en general. |
| **c** EN | It is valid above three teams, because scaling frameworks explicitly permit one Product Owner per team at that threshold. |
| **c** ES | Es válida con más de tres equipos, porque los marcos de escalado permiten explícitamente un Product Owner por equipo en ese umbral. |
| **d** EN | It is an anti-pattern: product ownership is a single-person accountability and cannot be held by a committee. `<<KEY` |
| **d** ES | Es un antipatrón: la responsabilidad del Product Owner recae en una sola persona y no puede ser asumida por un comité. `<<KEY` |

**explanation**

| | |
|---|---|
| EN | The Scrum Guide is explicit: the Product Owner is one person, not a committee. Distributing PO accountability across multiple individuals removes clear ownership and is a recognized scaling anti-pattern regardless of team count. A SAFe Chief Product Owner overseeing subordinate POs does not satisfy Scrum's single-accountability rule; it layers hierarchy over the anti-pattern. No scaling framework sets a team-count threshold that makes one PO per team acceptable as a committee arrangement. |
| ES | La Guía Scrum es explícita: el Product Owner es una sola persona, no un comité. Distribuir la responsabilidad del Product Owner entre múltiples individuos elimina la claridad en la propiedad y es un antipatrón de escalado reconocido, independientemente del número de equipos. Un Chief Product Owner de SAFe que supervisa a Product Owners subordinados no satisface la regla de responsabilidad única de Scrum; simplemente añade jerarquía sobre el antipatrón. Ningún marco de escalado establece un umbral de número de equipos que haga aceptable tener un Product Owner por equipo como arreglo de comité. |

